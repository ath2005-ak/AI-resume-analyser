import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { sequelize } from "./db.js";
import authRoutes from "./authRoutes.js";
import resumeRoutes from "./resumeRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";

dotenv.config();

// Refuse to start without a valid JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "" || process.env.JWT_SECRET === "default_jwt_secret_val") {
  console.error("==================================================================");
  console.error("FATAL SECURITY CONFIGURATION ERROR:");
  console.error("JWT_SECRET environment variable is missing, empty, or set to an insecure default.");
  console.error("The server refuses to start without a secure JWT_SECRET configured in .env.");
  console.error("==================================================================");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;

// Security HTTP headers
app.use(helmet());

// Dynamic CORS configuration from environment variables
const rawOrigins = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error(`CORS error: Origin '${origin}' is not permitted.`));
      }
    },
    credentials: true,
  })
);

// Standard Middlewares
app.use(express.json());
app.use(cookieParser());

// Route registrations
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api", analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "An unexpected error occurred on the server.",
      details: err.details || null,
    },
  });
});

// Database Sync and Server Startup
async function startServer() {
  try {
    // Authenticate and sync Sequelize models
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    
    // Sync all models (create tables if they don't exist)
    await sequelize.sync();
    console.log("Database tables synchronized successfully.");

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to database sync failure:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, startServer };
export default app;
