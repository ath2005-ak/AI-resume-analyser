import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./db.js";
import { authMiddleware } from "./authMiddleware.js";
import {
  validateBody,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./validation.js";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "default_jwt_secret_val") {
  throw new Error("FATAL: JWT_SECRET must be securely set in environment variables.");
}

// Rate limiter for authentication routes (login and register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
    },
  },
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// 1. REGISTER
router.post("/register", authRateLimiter, validateBody(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: { message: "Email is already registered" } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("jwt", token, COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 2. LOGIN
router.post("/login", authRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ error: { message: "Invalid email or password" } });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: { message: "Invalid email or password" } });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("jwt", token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 3. LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("jwt");
  return res.json({ ok: true });
});

// 4. ME (GET PROFILE)
router.get("/me", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

// 5. UPDATE PROFILE
router.patch("/profile", authMiddleware, validateBody(updateProfileSchema), async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ error: { message: "Email is already in use" } });
      }
      user.email = email.toLowerCase();
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// 6. CHANGE PASSWORD
router.patch("/password", authMiddleware, validateBody(changePasswordSchema), async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: { message: "Incorrect current password" } });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

export default router;
