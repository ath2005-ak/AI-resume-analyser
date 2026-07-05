import express from "express";
import { Resume, Version, Analysis, Activity, sequelize } from "./db.js";
import { authMiddleware } from "./authMiddleware.js";

const router = express.Router();

// 1. GET DASHBOARD
router.get("/dashboard", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Totals
    const resumes = await Resume.findAll({ where: { userId } });
    const resumeIds = resumes.map((r) => r.id);

    const versions = await Version.findAll({ where: { resumeId: resumeIds } });
    const rewritesCount = versions.filter((v) => v.sourceType === "rewrite").length;

    const versionIds = versions.map((v) => v.id);
    const analysesCount = await Analysis.count({ where: { versionId: versionIds } });

    const totals = {
      resumes: resumes.length,
      rewrites: rewritesCount,
      analyses: analysesCount,
    };

    if (resumes.length === 0) {
      return res.json({
        totals,
        latestResume: null,
        scoreSeries: [],
        versionStack: [],
        kpi: null,
        activity: [],
      });
    }

    // Latest Resume (ordered by updatedAt DESC)
    const latestResume = await Resume.findOne({
      where: { userId },
      order: [["updatedAt", "DESC"]],
    });

    const latestResumeVersions = await Version.findAll({
      where: { resumeId: latestResume.id },
      order: [["createdAt", "ASC"]],
    });

    const latestVersionIds = latestResumeVersions.map((v) => v.id);
    const latestResumeAnalyses = await Analysis.findAll({
      where: { versionId: latestVersionIds },
      order: [["createdAt", "ASC"]],
    });

    // Score series & version stack for the latest resume
    const scoreSeries = [];
    const versionStack = [];

    latestResumeVersions.forEach((v) => {
      scoreSeries.push({
        label: v.label,
        score: v.score ?? 0,
      });

      versionStack.push({
        id: v.id,
        label: v.label,
        title: v.sourceType === "upload" ? "Upload" : "Rewrite pass",
        score: v.score ?? 0,
      });
    });

    // Score evolution & KPIs
    // 1. ATS Score
    const latestVersion = latestResumeVersions[latestResumeVersions.length - 1];
    const latestScoreValue = latestVersion.score;

    let atsScoreDelta = 0;
    const firstAnalyzedVersion = latestResumeVersions.find((v) => v.score != null);
    if (latestScoreValue != null && firstAnalyzedVersion && firstAnalyzedVersion.score != null) {
      atsScoreDelta = latestScoreValue - firstAnalyzedVersion.score;
    }

    const atsScoreSpark = latestResumeVersions.map((v) => ({ v: v.score ?? 0 }));

    // 2. Issues identified spark for latest resume
    const issuesSpark = [];
    let currentIssuesCount = 0;
    let issuesDelta = 0;

    if (latestResumeAnalyses.length > 0) {
      latestResumeAnalyses.forEach((an) => {
        const count = Array.isArray(an.issues) ? an.issues.length : 0;
        issuesSpark.push({ v: count });
      });

      const latestAnalysis = latestResumeAnalyses[latestResumeAnalyses.length - 1];
      const firstAnalysis = latestResumeAnalyses[0];
      currentIssuesCount = Array.isArray(latestAnalysis.issues) ? latestAnalysis.issues.length : 0;
      const firstIssuesCount = Array.isArray(firstAnalysis.issues) ? firstAnalysis.issues.length : 0;
      issuesDelta = currentIssuesCount - firstIssuesCount;
    } else {
      latestResumeVersions.forEach(() => issuesSpark.push({ v: 0 }));
    }

    // 3. Keywords matched spark for latest resume
    const keywordsSpark = [];
    let currentKeywordsCount = 0;
    let totalKeywordsExpected = 0;
    let keywordsDelta = 0;

    if (latestResumeAnalyses.length > 0) {
      latestResumeAnalyses.forEach((an) => {
        const count = Array.isArray(an.keywordsPresent) ? an.keywordsPresent.length : 0;
        keywordsSpark.push({ v: count });
      });

      const latestAnalysis = latestResumeAnalyses[latestResumeAnalyses.length - 1];
      const firstAnalysis = latestResumeAnalyses[0];
      currentKeywordsCount = Array.isArray(latestAnalysis.keywordsPresent) ? latestAnalysis.keywordsPresent.length : 0;
      const currentMissingKeywordsCount = Array.isArray(latestAnalysis.keywordsMissing) ? latestAnalysis.keywordsMissing.length : 0;
      totalKeywordsExpected = currentKeywordsCount + currentMissingKeywordsCount;

      const firstKeywordsCount = Array.isArray(firstAnalysis.keywordsPresent) ? firstAnalysis.keywordsPresent.length : 0;
      keywordsDelta = currentKeywordsCount - firstKeywordsCount;
    } else {
      latestResumeVersions.forEach(() => keywordsSpark.push({ v: 0 }));
    }

    // 4. Versions Spark across all user resumes over time
    const allVersionsSorted = [...versions].sort((a, b) => a.createdAt - b.createdAt);
    const versionsSpark = [];
    let cumulativeVersions = 0;
    allVersionsSorted.forEach(() => {
      cumulativeVersions++;
      versionsSpark.push({ v: cumulativeVersions });
    });
    // Ensure we have at least some elements
    if (versionsSpark.length === 0) versionsSpark.push({ v: 0 });

    const kpi = {
      atsScore: {
        value: latestScoreValue ?? 0,
        delta: atsScoreDelta,
        spark: atsScoreSpark,
      },
      versions: {
        value: versions.length,
        spark: versionsSpark.slice(-7), // last 7 points
      },
      issuesIdentified: {
        value: currentIssuesCount,
        delta: issuesDelta,
        spark: issuesSpark,
      },
      keywordsMatched: {
        value: currentKeywordsCount,
        total: totalKeywordsExpected,
        delta: keywordsDelta,
        spark: keywordsSpark,
      },
    };

    // Recent Activity Feed
    const dbActivities = await Activity.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const activity = dbActivities.map((act) => ({
      id: act.id,
      type: act.type,
      title: act.title,
      subtitle: act.subtitle,
      label: act.label,
      at: act.createdAt,
      resumeId: act.resumeId,
    }));

    return res.json({
      totals,
      latestResume: {
        _id: latestResume.id,
        title: latestResume.title,
      },
      scoreSeries,
      versionStack,
      kpi,
      activity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 2. GET INSIGHTS (analytics across all resumes)
router.get("/insights", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const resumes = await Resume.findAll({ where: { userId } });
    if (resumes.length === 0) {
      return res.json({ empty: true });
    }

    const resumeIds = resumes.map((r) => r.id);
    const versions = await Version.findAll({ where: { resumeId: resumeIds } });
    const versionIds = versions.map((v) => v.id);

    const analyses = await Analysis.findAll({
      where: { versionId: versionIds },
      order: [["createdAt", "ASC"]],
    });

    if (analyses.length === 0) {
      return res.json({ empty: true });
    }

    // Average score
    const scores = analyses.map((a) => a.atsScore);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Best Score
    let bestScoreVal = 0;
    let bestScoreResumeId = null;
    let bestScoreResumeTitle = null;

    // Build map for quick title lookups
    const resumeMap = {};
    resumes.forEach((r) => {
      resumeMap[r.id] = r.title;
    });

    const versionMap = {};
    versions.forEach((v) => {
      versionMap[v.id] = v.resumeId;
    });

    analyses.forEach((an) => {
      if (an.atsScore >= bestScoreVal) {
        bestScoreVal = an.atsScore;
        const resId = versionMap[an.versionId];
        bestScoreResumeId = resId;
        bestScoreResumeTitle = resumeMap[resId] || "Resume";
      }
    });

    const bestScore = {
      value: bestScoreVal,
      resumeId: bestScoreResumeId,
      resumeTitle: bestScoreResumeTitle,
    };

    // Score trend
    const scoreTrend = analyses.map((an) => {
      const resId = versionMap[an.versionId];
      return {
        score: an.atsScore,
        at: an.createdAt,
        resumeTitle: resumeMap[resId] || "Resume",
      };
    });

    // Recurring Issues, Top Missing Keywords, Top Present Keywords aggregation
    const issuesCounts = {};
    const missingKeywordsCounts = {};
    const presentKeywordsCounts = {};

    analyses.forEach((an) => {
      // 1. Issues
      if (Array.isArray(an.issues)) {
        an.issues.forEach((issue) => {
          const key = issue.title;
          if (!issuesCounts[key]) {
            issuesCounts[key] = { title: issue.title, severity: issue.severity, count: 0 };
          }
          issuesCounts[key].count++;
        });
      }

      // 2. Missing keywords
      if (Array.isArray(an.keywordsMissing)) {
        an.keywordsMissing.forEach((kw) => {
          missingKeywordsCounts[kw] = (missingKeywordsCounts[kw] || 0) + 1;
        });
      }

      // 3. Present keywords
      if (Array.isArray(an.keywordsPresent)) {
        an.keywordsPresent.forEach((kw) => {
          presentKeywordsCounts[kw] = (presentKeywordsCounts[kw] || 0) + 1;
        });
      }
    });

    const topIssues = Object.values(issuesCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topMissingKeywords = Object.entries(missingKeywordsCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topPresentKeywords = Object.entries(presentKeywordsCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Resume Performance Table
    const resumePerformance = await Promise.all(
      resumes.map(async (r) => {
        const resumeVersions = await Version.findAll({
          where: { resumeId: r.id },
          order: [["createdAt", "ASC"]],
        });

        const vIds = resumeVersions.map((v) => v.id);
        const resumeAnalyses = await Analysis.findAll({
          where: { versionId: vIds },
          order: [["createdAt", "ASC"]],
        });

        const rScores = resumeAnalyses.map((a) => a.atsScore);
        const latestScore = rScores.length ? rScores[rScores.length - 1] : 0;
        const bestScore = rScores.length ? Math.max(...rScores) : 0;
        const firstScore = rScores.length ? rScores[0] : 0;
        const improvement = rScores.length > 1 ? latestScore - firstScore : 0;

        return {
          resumeId: r.id,
          title: r.title,
          latestScore,
          bestScore,
          improvement,
          analysesCount: resumeAnalyses.length,
        };
      })
    );

    return res.json({
      averageScore,
      bestScore,
      totalAnalyses: analyses.length,
      scoreTrend,
      topIssues,
      topMissingKeywords,
      topPresentKeywords,
      resumePerformance,
    });
  } catch (error) {
    console.error("Insights error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 3. GET ALL VERSIONS LIST
router.get("/versions", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const resumes = await Resume.findAll({ where: { userId } });
    const resumeMap = {};
    resumes.forEach((r) => {
      resumeMap[r.id] = r.title;
    });

    const resumeIds = resumes.map((r) => r.id);
    const dbVersions = await Version.findAll({
      where: { resumeId: resumeIds },
      order: [["createdAt", "DESC"]],
    });

    const uploadCount = dbVersions.filter((v) => v.sourceType === "upload").length;
    const rewriteCount = dbVersions.filter((v) => v.sourceType === "rewrite").length;

    const versions = dbVersions.map((v) => ({
      id: v.id,
      label: v.label,
      resumeId: v.resumeId,
      resumeTitle: resumeMap[v.resumeId] || "Resume",
      sourceType: v.sourceType,
      score: v.score,
      createdAt: v.createdAt,
    }));

    return res.json({
      totals: {
        all: dbVersions.length,
        uploads: uploadCount,
        rewrites: rewriteCount,
      },
      versions,
    });
  } catch (error) {
    console.error("Versions list error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 4. GET ACCOUNT HISTORY (audit feed of all events)
router.get("/history", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const activities = await Activity.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    const uploadCount = activities.filter((a) => a.type === "upload").length;
    const analyzeCount = activities.filter((a) => a.type === "analyze").length;
    const rewriteCount = activities.filter((a) => a.type === "rewrite").length;

    const events = activities.map((act) => ({
      id: act.id,
      type: act.type,
      title: act.title,
      subtitle: act.subtitle,
      label: act.label,
      at: act.createdAt,
      resumeId: act.resumeId,
    }));

    return res.json({
      totals: {
        all: activities.length,
        upload: uploadCount,
        analyze: analyzeCount,
        rewrite: rewriteCount,
      },
      events,
    });
  } catch (error) {
    console.error("History events error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

export default router;
