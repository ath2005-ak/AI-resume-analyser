import { AIRateLimitLog } from "./db.js";
import { Op } from "sequelize";

// Rate limit: 10 operations per hour
const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function aiRateLimiter(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  const userId = req.user.id;
  const cutoffTime = new Date(Date.now() - WINDOW_MS);

  try {
    const count = await AIRateLimitLog.count({
      where: {
        userId,
        createdAt: {
          [Op.gt]: cutoffTime,
        },
      },
    });

    if (count >= LIMIT) {
      return res.status(429).json({
        error: {
          message: `AI rate limit exceeded. You are allowed up to ${LIMIT} AI operations (upload or analysis) per hour. Please try again later.`,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit verification error:", error);
    next(); // Fallback: allow the request if database check fails, or return 500
  }
}

/**
 * Helper to log an AI action for rate limiting.
 * @param {string} userId 
 * @param {string} action "upload" or "analyze"
 */
export async function logAIAction(userId, action) {
  try {
    await AIRateLimitLog.create({ userId, action });
  } catch (error) {
    console.error("Failed to log AI action:", error);
  }
}
