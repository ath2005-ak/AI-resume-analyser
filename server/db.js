import { Sequelize, DataTypes } from "sequelize";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbStorage =
  process.env.NODE_ENV === "test" || process.env.DB_STORAGE === ":memory:"
    ? ":memory:"
    : (process.env.DB_STORAGE || path.join(__dirname, "database.sqlite"));

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbStorage,
  logging: false, // Set to console.log to debug SQL queries
});

// 1. USER MODEL
export const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// 2. RESUME MODEL
export const Resume = sequelize.define("Resume", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  currentVersionId: {
    type: DataTypes.UUID,
    allowNull: true, // will be updated when versions are created
  },
});

// 3. VERSION MODEL
export const Version = sequelize.define("Version", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING, // e.g. "V1", "V2"
    allowNull: false,
  },
  sourceType: {
    type: DataTypes.ENUM("upload", "rewrite"),
    allowNull: false,
  },
  rawText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  parsedSections: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// 4. ANALYSIS MODEL
export const Analysis = sequelize.define("Analysis", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  versionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  atsScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  scoreBreakdown: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  issues: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  strengths: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  keywordsPresent: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  keywordsMissing: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  bulletRewrites: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  targetRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  jobDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// 5. ACTIVITY MODEL
export const Activity = sequelize.define("Activity", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  resumeId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM("upload", "analyze", "rewrite"),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// 6. AI RATE LIMIT LOG MODEL
export const AIRateLimitLog = sequelize.define("AIRateLimitLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING, // "upload" or "analyze"
    allowNull: false,
  },
});

// Relationships
User.hasMany(Resume, { foreignKey: "userId", onDelete: "CASCADE" });
Resume.belongsTo(User, { foreignKey: "userId" });

Resume.hasMany(Version, { foreignKey: "resumeId", onDelete: "CASCADE" });
Version.belongsTo(Resume, { foreignKey: "resumeId" });

Version.hasMany(Analysis, { foreignKey: "versionId", onDelete: "CASCADE" });
Analysis.belongsTo(Version, { foreignKey: "versionId" });

User.hasMany(Activity, { foreignKey: "userId", onDelete: "CASCADE" });
Activity.belongsTo(User, { foreignKey: "userId" });
Activity.belongsTo(Resume, { foreignKey: "resumeId" });

User.hasMany(AIRateLimitLog, { foreignKey: "userId", onDelete: "CASCADE" });
AIRateLimitLog.belongsTo(User, { foreignKey: "userId" });
