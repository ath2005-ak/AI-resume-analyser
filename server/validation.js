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
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const analyzeSchema = z.object({
  versionId: z.string().uuid("Invalid version ID"),
  targetRole: z.string().max(100).optional(),
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
