import { z } from "zod";

// Middleware to validate body
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
    });
  }
  req.body = result.data; // replace with validated and parsed data
  next();
};

// Middleware to validate query
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
    });
  }
  req.query = result.data; // replace with validated and parsed data
  next();
};

// Middleware to validate params
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
    });
  }
  req.params = result.data; // replace with validated and parsed data
  next();
};

// Schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const analyzeSchema = z.object({
  versionId: z.string().uuid("Invalid version ID"),
  targetRole: z.string().max(100).optional(),
  jobDescription: z.string().max(15000).optional(),
});

export const rewriteSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID"),
  rewriteIds: z.array(z.string()).optional(),
});

export const diffQuerySchema = z.object({
  from: z.string().uuid("Invalid 'from' version ID"),
  to: z.string().uuid("Invalid 'to' version ID"),
  mode: z.enum(["words", "lines"]).default("words"),
});

// Helper types for resilient parsing
const safeString = z.preprocess((val) => (val == null ? "" : String(val)), z.string().default(""));
const safeStringArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val.map((v) => (v == null ? "" : String(v)));
  if (typeof val === "string" && val.trim()) return [val.trim()];
  return [];
}, z.array(z.string()).default([]));

// Schema for parsed resume sections (guarantees empty values instead of undefined/null)
export const parsedResumeSchema = z.object({
  basics: z.preprocess(
    (val) => (val && typeof val === "object" ? val : {}),
    z.object({
      name: safeString,
      title: safeString,
      email: safeString,
      phone: safeString,
      location: safeString,
      links: z.preprocess(
        (val) => (Array.isArray(val) ? val : []),
        z.array(
          z.object({
            label: safeString,
            url: safeString,
          })
        ).default([])
      ),
    }).default({})
  ),
  summary: safeString,
  experience: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        role: safeString,
        company: safeString,
        period: safeString,
        bullets: safeStringArray,
      })
    ).default([])
  ),
  education: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        degree: safeString,
        school: safeString,
        period: safeString,
      })
    ).default([])
  ),
  skills: safeStringArray,
  projects: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        name: safeString,
        tech: safeStringArray,
        summary: safeString,
      })
    ).default([])
  ),
  certifications: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        name: safeString,
        year: safeString,
      })
    ).default([])
  ),
  languages: safeStringArray,
  interests: safeStringArray,
});

// Schema for resume analysis results
export const analysisResultSchema = z.object({
  atsScore: z.coerce.number().int().min(0).max(100).default(50),
  scoreBreakdown: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        label: safeString,
        value: z.coerce.number().min(0).max(100).default(50),
      })
    ).default([])
  ),
  summary: safeString,
  issues: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        title: safeString,
        severity: z.preprocess(
          (val) => {
            const s = String(val).toLowerCase();
            return ["high", "medium", "low"].includes(s) ? s : "medium";
          },
          z.enum(["high", "medium", "low"]).default("medium")
        ),
        fix: safeString,
      })
    ).default([])
  ),
  strengths: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        title: safeString,
        note: safeString,
      })
    ).default([])
  ),
  keywordsPresent: safeStringArray,
  keywordsMissing: safeStringArray,
  bulletRewrites: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(
      z.object({
        _id: z.preprocess(
          (val, ctx) => (val ? String(val) : `rw_${Math.random().toString(36).substring(2, 8)}`),
          z.string()
        ),
        section: safeString,
        experienceIndex: z.preprocess(
          (val) => (val != null && !isNaN(val) ? Number(val) : undefined),
          z.number().int().min(0).optional()
        ),
        bulletIndex: z.preprocess(
          (val) => (val != null && !isNaN(val) ? Number(val) : undefined),
          z.number().int().min(0).optional()
        ),
        original: safeString,
        rewritten: safeString,
        rationale: safeString,
      })
    ).default([])
  ),
  model: z.string().optional(),
  isFallback: z.boolean().optional(),
  jobDescription: safeString.optional(),
  jdMatch: z
    .object({
      matchRate: z.coerce.number().min(0).max(100).default(0),
      matchedCount: z.coerce.number().default(0),
      missingCount: z.coerce.number().default(0),
      totalKeywords: z.coerce.number().default(0),
    })
    .optional(),
});

