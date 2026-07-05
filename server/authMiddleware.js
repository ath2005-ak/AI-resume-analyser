import jwt from "jsonwebtoken";
import { User } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_val";

export async function authMiddleware(req, res, next) {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ error: { message: "Not authenticated" } });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.clearCookie("jwt");
      return res.status(401).json({ error: { message: "Not authenticated" } });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    res.clearCookie("jwt");
    return res.status(401).json({ error: { message: "Not authenticated" } });
  }
}
