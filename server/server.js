import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./db.js";
import authRoutes from "./authRoutes.js";
import resumeRoutes from "./resumeRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend during dev (in case direct connection is used instead of proxy)
app.use(
  cors({
    origin: ["http://localhost:5173"],
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

startServer();
