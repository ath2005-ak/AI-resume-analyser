import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { diffWords, diffLines } from "diff";
import { Resume, Version, Analysis, Activity, sequelize } from "./db.js";
import { parseResumeText, analyzeResume } from "./gemini.js";
import { authMiddleware } from "./authMiddleware.js";
import { aiRateLimiter, logAIAction } from "./rateLimiter.js";
import {
  validateBody,
  validateQuery,
  analyzeSchema,
  rewriteSchema,
  diffQuerySchema,
} from "./validation.js";

const router = express.Router();

// Multer memory storage configuration (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filename = (file.originalname || "").toLowerCase();
    const mime = file.mimetype;
    const isPdf = mime === "application/pdf" || filename.endsWith(".pdf");
    const isDocx =
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      (mime === "application/octet-stream" && filename.endsWith(".docx")) ||
      filename.endsWith(".docx");

    if (isPdf || isDocx) {
      cb(null, true);
    } else {
      cb(new Error("PDF or DOCX files only."));
    }
  },
});

/**
 * Standardizes parsed JSON sections into markdown-like text layout.
 * Used to save standard rawText and generate clean, noise-free diffs.
 */
export function reconstructText(s) {
  let text = "";
  const b = s.basics || {};
  if (b.name) text += `${b.name}\n`;
  if (b.title) text += `${b.title}\n`;
  if (b.email || b.phone || b.location) {
    text += `${[b.email, b.phone, b.location].filter(Boolean).join(" | ")}\n`;
  }
  if (b.links && b.links.length) {
    text += `${b.links.map((l) => l.label || l.url).join(" | ")}\n`;
  }
  text += "\n";

  if (s.summary) {
    text += `SUMMARY\n${s.summary}\n\n`;
  }

  if (s.experience && s.experience.length) {
    text += `EXPERIENCE\n`;
    for (const e of s.experience) {
      text += `${e.role || ""} - ${e.company || ""} (${e.period || ""})\n`;
      if (e.bullets && e.bullets.length) {
        for (const bullet of e.bullets) {
          text += `- ${bullet}\n`;
        }
      }
    }
    text += "\n";
  }

  if (s.education && s.education.length) {
    text += `EDUCATION\n`;
    for (const e of s.education) {
      text += `${e.degree || ""} - ${e.school || ""} (${e.period || ""})\n`;
    }
    text += "\n";
  }

  if (s.skills && s.skills.length) {
    text += `SKILLS\n${Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}\n\n`;
  }

  if (s.projects && s.projects.length) {
    text += `PROJECTS\n`;
    for (const p of s.projects) {
      text += `${p.name || ""} [${Array.isArray(p.tech) ? p.tech.join(", ") : p.tech || ""}]\n${p.summary || ""}\n`;
    }
    text += "\n";
  }

  if (s.certifications && s.certifications.length) {
    text += `CERTIFICATIONS\n`;
    for (const c of s.certifications) {
      text += `- ${c.name || ""} (${c.year || ""})\n`;
    }
    text += "\n";
  }

  if (s.languages && s.languages.length) {
    text += `LANGUAGES\n${Array.isArray(s.languages) ? s.languages.join(", ") : s.languages}\n\n`;
  }

  if (s.interests && s.interests.length) {
    text += `INTERESTS\n${Array.isArray(s.interests) ? s.interests.join(", ") : s.interests}\n\n`;
  }

  return text.trim();
}

// 1. LIST RESUMES
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const resumes = await Resume.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
    });

    const formatted = await Promise.all(
      resumes.map(async (r) => {
        const versions = await Version.findAll({ where: { resumeId: r.id } });
        const scores = versions.map((v) => v.score).filter((s) => s != null);
        const bestScore = scores.length ? Math.max(...scores) : null;

        return {
          _id: r.id,
          title: r.title,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          versionCount: versions.length,
          bestScore,
        };
      })
    );

    return res.json({ resumes: formatted });
  } catch (error) {
    console.error("List resumes error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 2. GET RESUME BY ID
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const dbVersions = await Version.findAll({
      where: { resumeId: id },
      order: [["createdAt", "ASC"]],
    });

    const versions = dbVersions.map((v) => ({
      _id: v.id,
      label: v.label,
      sourceType: v.sourceType,
      createdAt: v.createdAt,
      score: v.score,
      rawText: v.rawText,
      parsedSections: v.parsedSections,
    }));

    return res.json({
      resume: {
        _id: resume.id,
        title: resume.title,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        currentVersionId: resume.currentVersionId,
      },
      versions,
    });
  } catch (error) {
    console.error("Get resume error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 3. GET SPECIFIC VERSION DETAILS
router.get("/:id/versions/:versionId", authMiddleware, async (req, res) => {
  const { id, versionId } = req.params;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const version = await Version.findOne({ where: { id: versionId, resumeId: id } });
    if (!version) {
      return res.status(404).json({ error: { message: "Version not found" } });
    }

    return res.json({
      version: {
        _id: version.id,
        label: version.label,
        sourceType: version.sourceType,
        createdAt: version.createdAt,
        score: version.score,
        rawText: version.rawText,
        parsedSections: version.parsedSections,
      },
    });
  } catch (error) {
    console.error("Get version error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 4. UPLOAD RESUME (Multer PDF or DOCX + Text Extraction + Gemini Parse)
router.post("/", authMiddleware, aiRateLimiter, async (req, res) => {
  // Use multer helper to handle the file upload
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: { message: err.message } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { message: "No resume PDF or DOCX file uploaded." } });
    }

    const userId = req.user.id;
    const title = req.body.title || req.file.originalname;

    try {
      const fileBuffer = req.file.buffer;

      // 1. Inspect Magic Bytes:
      // PDF header: %PDF -> [0x25, 0x50, 0x44, 0x46]
      // DOCX header: PK\x03\x04 -> [0x50, 0x4B, 0x03, 0x04]
      const isPdfHeader =
        fileBuffer &&
        fileBuffer.length >= 4 &&
        fileBuffer[0] === 0x25 &&
        fileBuffer[1] === 0x50 &&
        fileBuffer[2] === 0x44 &&
        fileBuffer[3] === 0x46;

      const isDocxHeader =
        fileBuffer &&
        fileBuffer.length >= 4 &&
        fileBuffer[0] === 0x50 &&
        fileBuffer[1] === 0x4b &&
        fileBuffer[2] === 0x03 &&
        fileBuffer[3] === 0x04;

      if (!isPdfHeader && !isDocxHeader) {
        return res.status(400).json({
          error: {
            message:
              "Invalid file format: File header does not match PDF (%PDF) or DOCX (PK) signature. Please upload a valid PDF or Word document.",
          },
        });
      }

      // 2. Text extraction based on file type
      let rawExtractedText = "";
      if (isPdfHeader) {
        try {
          const pdfData = await pdfParse(fileBuffer);
          rawExtractedText = (pdfData.text || "").trim();
        } catch (parseErr) {
          console.error("PDF Parse binary failure:", parseErr);
          return res.status(400).json({
            error: {
              message: "Failed to read PDF structure. The file may be password-protected or corrupt.",
            },
          });
        }
      } else if (isDocxHeader) {
        try {
          const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
          rawExtractedText = (docxResult.value || "").trim();
        } catch (docxErr) {
          console.error("DOCX extraction failure:", docxErr);
          return res.status(400).json({
            error: {
              message: "Failed to read DOCX structure. The document may be corrupted or encrypted.",
            },
          });
        }
      }

      // 3. Clear message for empty or scanned files
      if (!rawExtractedText || rawExtractedText.length === 0) {
        return res.status(400).json({
          error: {
            message:
              "This file contains no readable text. It appears to be an image-only, scanned, or empty document. Please upload a text-based PDF or DOCX (e.g. exported from Google Docs, Word, or LaTeX).",
          },
        });
      }

      const wordCount = rawExtractedText.split(/\s+/).filter(Boolean).length;
      const letterCount = (rawExtractedText.match(/[a-zA-Z]/g) || []).length;

      if (rawExtractedText.length < 150 || letterCount < 50 || wordCount < 15) {
        return res.status(400).json({
          error: {
            message:
              "Scanned or low-text document detected: The file contains insufficient extractable text. Please upload a standard text-based PDF or Word resume.",
          },
        });
      }

      // Log AI Action for rate limiting
      await logAIAction(userId, "upload");

      // 4. AI parsing using Gemini
      const parsedSections = await parseResumeText(rawExtractedText);

      // Reconstruct standard plain-text for cleaner diffs and storage
      const standardizedText = reconstructText(parsedSections);

      // 5. Database save
      const resume = await Resume.create({
        userId,
        title,
      });

      const version = await Version.create({
        resumeId: resume.id,
        label: "V1",
        sourceType: "upload",
        rawText: standardizedText,
        parsedSections,
      });

      resume.currentVersionId = version.id;
      await resume.save();

      // Log activity
      const sectionCount = Object.keys(parsedSections).filter((k) => {
        const val = parsedSections[k];
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object" && val !== null) return Object.keys(val).length > 0;
        return !!val;
      }).length;

      await Activity.create({
        userId,
        resumeId: resume.id,
        type: "upload",
        title: `Uploaded ${title}`,
        subtitle: `Parsed ${sectionCount} sections`,
        label: "V1",
      });

      return res.status(201).json({
        resume: {
          _id: resume.id,
          title: resume.title,
          createdAt: resume.createdAt,
          updatedAt: resume.updatedAt,
          currentVersionId: resume.currentVersionId,
        },
      });
    } catch (error) {
      console.error("Upload & parse error:", error);
      return res.status(500).json({
        error: { message: error.message || "Failed to process and parse resume document." },
      });
    }
  });
});

// 5. DELETE RESUME
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    await resume.destroy(); // Cascade deletes versions, which deletes analyses
    return res.json({ ok: true });
  } catch (error) {
    console.error("Delete resume error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 6. RUN AI ANALYSIS (ATS Score, Issues, Bullet Rewrites)
router.post("/:id/analyze", authMiddleware, aiRateLimiter, validateBody(analyzeSchema), async (req, res) => {
  const { id } = req.params;
  const { versionId, targetRole, jobDescription } = req.body;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const version = await Version.findOne({ where: { id: versionId, resumeId: id } });
    if (!version) {
      return res.status(404).json({ error: { message: "Version not found" } });
    }

    // Log AI Action for rate limiting
    await logAIAction(userId, "analyze");

    // Run Gemini analysis (with stable scoring & JD matching)
    const analysisResult = await analyzeResume(version.parsedSections, targetRole, jobDescription);

    // Save Analysis
    const analysis = await Analysis.create({
      versionId: version.id,
      atsScore: analysisResult.atsScore,
      model: analysisResult.model || (analysisResult.isFallback ? "basic mode (AI unavailable)" : (process.env.GEMINI_MODEL || "gemini-2.5-flash")),
      summary: analysisResult.summary,
      scoreBreakdown: analysisResult.scoreBreakdown,
      issues: analysisResult.issues,
      strengths: analysisResult.strengths,
      keywordsPresent: analysisResult.keywordsPresent,
      keywordsMissing: analysisResult.keywordsMissing,
      bulletRewrites: analysisResult.bulletRewrites,
      targetRole: targetRole || "Software Engineer",
      jobDescription: jobDescription || null,
    });

    // Update Version score
    const oldScore = version.score;
    version.score = analysisResult.atsScore;
    await version.save();

    // Log activity
    let scoreLabel = "Analysis";
    if (oldScore != null) {
      const diff = analysisResult.atsScore - oldScore;
      scoreLabel = diff >= 0 ? `+${diff} pts` : `${diff} pts`;
    }

    await Activity.create({
      userId,
      resumeId: resume.id,
      type: "analyze",
      title: `Analysis complete on ${version.label}`,
      subtitle: `ATS score ${analysisResult.atsScore} / 100`,
      label: scoreLabel,
    });

    // Update Resume updatedAt timestamp
    resume.changed("updatedAt", true);
    await resume.save();

    return res.json({
      analysis: {
        _id: analysis.id,
        versionId: analysis.versionId,
        atsScore: analysis.atsScore,
        model: analysis.model,
        summary: analysis.summary,
        scoreBreakdown: analysis.scoreBreakdown,
        issues: analysis.issues,
        strengths: analysis.strengths,
        keywordsPresent: analysis.keywordsPresent,
        keywordsMissing: analysis.keywordsMissing,
        bulletRewrites: analysis.bulletRewrites,
        targetRole: analysis.targetRole,
        jobDescription: analysis.jobDescription,
        jdMatch: analysisResult.jdMatch,
      },
    });
  } catch (error) {
    console.error("AI Analysis error:", error);
    return res.status(500).json({
      error: { message: error.message || "Failed to analyze resume version." },
    });
  }
});

// 7. GET ALL ANALYSES FOR RESUME
router.get("/:id/analyses", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const versions = await Version.findAll({ where: { resumeId: id } });
    const versionIds = versions.map((v) => v.id);

    const dbAnalyses = await Analysis.findAll({
      where: { versionId: versionIds },
      order: [["createdAt", "DESC"]],
    });

    const analyses = dbAnalyses.map((an) => ({
      _id: an.id,
      versionId: an.versionId,
      atsScore: an.atsScore,
      model: an.model,
      summary: an.summary,
      scoreBreakdown: an.scoreBreakdown,
      issues: an.issues,
      strengths: an.strengths,
      keywordsPresent: an.keywordsPresent,
      keywordsMissing: an.keywordsMissing,
      bulletRewrites: an.bulletRewrites,
      targetRole: an.targetRole,
      jobDescription: an.jobDescription,
    }));

    return res.json({ analyses });
  } catch (error) {
    console.error("Get analyses error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 8. GET ANALYSIS FOR A SPECIFIC VERSION
router.get("/:id/versions/:versionId/analysis", authMiddleware, async (req, res) => {
  const { id, versionId } = req.params;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const version = await Version.findOne({ where: { id: versionId, resumeId: id } });
    if (!version) {
      return res.status(404).json({ error: { message: "Version not found" } });
    }

    const an = await Analysis.findOne({
      where: { versionId },
      order: [["createdAt", "DESC"]],
    });

    if (!an) {
      return res.status(404).json({ error: { message: "No analysis for this version" } });
    }

    return res.json({
      analysis: {
        _id: an.id,
        versionId: an.versionId,
        atsScore: an.atsScore,
        model: an.model,
        summary: an.summary,
        scoreBreakdown: an.scoreBreakdown,
        issues: an.issues,
        strengths: an.strengths,
        keywordsPresent: an.keywordsPresent,
        keywordsMissing: an.keywordsMissing,
        bulletRewrites: an.bulletRewrites,
        targetRole: an.targetRole,
        jobDescription: an.jobDescription,
      },
    });
  } catch (error) {
    console.error("Get version analysis error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});


// 9. APPLY REWRITES -> NEW VERSION (No Gemini charge)
router.post("/:id/rewrite", authMiddleware, validateBody(rewriteSchema), async (req, res) => {
  const { id } = req.params;
  const { analysisId, rewriteIds } = req.body;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const analysis = await Analysis.findByPk(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: { message: "Analysis not found" } });
    }

    const sourceVersion = await Version.findOne({ where: { id: analysis.versionId, resumeId: id } });
    if (!sourceVersion) {
      return res.status(404).json({ error: { message: "Source version not found" } });
    }

    // Filter rewrites to apply
    let rewritesToApply = analysis.bulletRewrites || [];
    if (rewriteIds && rewriteIds.length > 0) {
      rewritesToApply = rewritesToApply.filter((r) => rewriteIds.includes(r._id));
    }

    if (rewritesToApply.length === 0) {
      return res.status(400).json({ error: { message: "No matching rewrites to apply." } });
    }

    // deep clone parsedSections
    const newSections = JSON.parse(JSON.stringify(sourceVersion.parsedSections));

    let appliedCount = 0;
    const modifiedSectionsSet = new Set();

    for (const rw of rewritesToApply) {
      const { section, original, rewritten, experienceIndex, bulletIndex } = rw;
      if (!rewritten) continue;

      let applied = false;

      // 1. Primary robust strategy: Direct index reference (experienceIndex + bulletIndex)
      if (
        (section === "experience" || !section) &&
        typeof experienceIndex === "number" &&
        typeof bulletIndex === "number" &&
        Array.isArray(newSections.experience) &&
        newSections.experience[experienceIndex] &&
        Array.isArray(newSections.experience[experienceIndex].bullets) &&
        bulletIndex >= 0 &&
        bulletIndex < newSections.experience[experienceIndex].bullets.length
      ) {
        newSections.experience[experienceIndex].bullets[bulletIndex] = rewritten;
        applied = true;
        appliedCount++;
        modifiedSectionsSet.add("experience");
      }

      // 2. Secondary fallback strategy: Exact or substring text match
      if (!applied && original) {
        if (section === "summary") {
          if (newSections.summary && newSections.summary.toLowerCase().trim() === original.toLowerCase().trim()) {
            newSections.summary = rewritten;
            appliedCount++;
            modifiedSectionsSet.add("summary");
            applied = true;
          } else if (newSections.summary && newSections.summary.includes(original)) {
            newSections.summary = newSections.summary.replace(original, rewritten);
            appliedCount++;
            modifiedSectionsSet.add("summary");
            applied = true;
          }
        } else if (Array.isArray(newSections.experience)) {
          for (const job of newSections.experience) {
            if (!Array.isArray(job.bullets)) continue;
            for (let i = 0; i < job.bullets.length; i++) {
              const b = job.bullets[i];
              if (b.toLowerCase().trim() === original.toLowerCase().trim()) {
                job.bullets[i] = rewritten;
                appliedCount++;
                modifiedSectionsSet.add("experience");
                applied = true;
                break;
              } else if (b.includes(original)) {
                job.bullets[i] = b.replace(original, rewritten);
                appliedCount++;
                modifiedSectionsSet.add("experience");
                applied = true;
                break;
              }
            }
            if (applied) break;
          }
        }
      }
    }

    // Determine new version label
    const versions = await Version.findAll({ where: { resumeId: id } });
    const labels = versions.map((v) => v.label);
    let nextNum = 1;
    labels.forEach((lbl) => {
      const match = lbl.match(/^V(\d+)$/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val >= nextNum) nextNum = val + 1;
      }
    });
    const nextLabel = `V${nextNum}`;

    // Reconstruct new rawText from new sections
    const newRawText = reconstructText(newSections);

    // Create new Version record
    const newVersion = await Version.create({
      resumeId: id,
      label: nextLabel,
      sourceType: "rewrite",
      rawText: newRawText,
      parsedSections: newSections,
      score: null, // to be analyzed
    });

    resume.currentVersionId = newVersion.id;
    await resume.save();

    // Log Activity
    const sectionsText = Array.from(modifiedSectionsSet).join(" and ") || "resume";
    await Activity.create({
      userId,
      resumeId: id,
      type: "rewrite",
      title: `${appliedCount} bullet${appliedCount === 1 ? "" : "s"} rewritten`,
      subtitle: `Applied to ${sectionsText} section${modifiedSectionsSet.size === 1 ? "" : "s"}`,
      label: `${nextLabel} created`,
    });

    return res.json({
      version: {
        _id: newVersion.id,
        label: newVersion.label,
        sourceType: newVersion.sourceType,
        createdAt: newVersion.createdAt,
        score: newVersion.score,
        rawText: newVersion.rawText,
        parsedSections: newVersion.parsedSections,
      },
      appliedCount,
    });
  } catch (error) {
    console.error("Apply rewrites error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 10. VERSION DIFF (Inline Diff Word-level or Line-level)
router.get("/:id/diff", authMiddleware, validateQuery(diffQuerySchema), async (req, res) => {
  const { id } = req.params;
  const { from, to, mode } = req.query;
  const userId = req.user.id;

  try {
    const resume = await Resume.findOne({ where: { id, userId } });
    if (!resume) {
      return res.status(404).json({ error: { message: "Resume not found" } });
    }

    const fromVersion = await Version.findOne({ where: { id: from, resumeId: id } });
    const toVersion = await Version.findOne({ where: { id: to, resumeId: id } });

    if (!fromVersion || !toVersion) {
      return res.status(404).json({ error: { message: "One or both versions not found" } });
    }

    // Reconstruct standardized text to ensure layout differences are ignored,
    // only focusing on actual word/phrase changes.
    const textFrom = reconstructText(fromVersion.parsedSections);
    const textTo = reconstructText(toVersion.parsedSections);

    let diffParts = [];
    if (mode === "lines") {
      diffParts = diffLines(textFrom, textTo);
    } else {
      diffParts = diffWords(textFrom, textTo);
    }

    // Calculate added/removed characters stats
    let addedChars = 0;
    let removedChars = 0;

    const parts = diffParts.map((p) => {
      if (p.added) {
        addedChars += p.value.length;
      }
      if (p.removed) {
        removedChars += p.value.length;
      }

      return {
        value: p.value,
        added: !!p.added,
        removed: !!p.removed,
      };
    });

    return res.json({
      stats: {
        added: addedChars,
        removed: removedChars,
      },
      parts,
    });
  } catch (error) {
    console.error("Diff calculation error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

export default router;
