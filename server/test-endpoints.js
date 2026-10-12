process.env.NODE_ENV = "test";
process.env.DB_STORAGE = ":memory:";

import assert from "node:assert";

// Dynamically import local modules so that NODE_ENV='test' is active before Sequelize initializes
const { reconstructText } = await import("./resumeRoutes.js");
const { User, Resume, Version, Analysis, Activity, sequelize } = await import("./db.js");

async function runTests() {
  console.log("=== STARTING BACKEND VERIFICATION TESTS ===");

  try {
    // Verify in-memory database isolation
    assert.strictEqual(sequelize.options.storage, ":memory:", "Tests must run against an in-memory database to protect database.sqlite");
    console.log("✓ Verified database storage is strictly :memory: (real data is protected).");

    // 1. Test database connection and schema sync
    console.log("Testing database sync...");
    await sequelize.sync({ force: true }); // Safe because it's purely in-memory
    console.log("Database sync successful.");

    // 2. Test User Model creation
    console.log("Testing user model creation...");
    const testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "fake_hash_value_here",
    });
    assert.strictEqual(testUser.name, "Test User");
    assert.strictEqual(testUser.email, "test@example.com");
    console.log("User model creation validated successfully.");

    // 3. Test Resume and Version relationships
    console.log("Testing resume and version creations...");
    const testResume = await Resume.create({
      userId: testUser.id,
      title: "Test Resume",
    });

    const parsedSections = {
      basics: { name: "Test User", email: "test@example.com", links: [] },
      summary: "Experienced test engineer",
      experience: [
        {
          role: "QA Tester",
          company: "Verify Corp",
          period: "2020 - Present",
          bullets: ["Wrote unit tests.", "Validated API outputs."],
        },
      ],
      education: [],
      skills: ["Testing", "Asserts"],
      projects: [],
      certifications: [],
      languages: [],
      interests: [],
    };

    const text = reconstructText(parsedSections);

    const testVersion = await Version.create({
      resumeId: testResume.id,
      label: "V1",
      sourceType: "upload",
      rawText: text,
      parsedSections: parsedSections,
      score: 85,
    });

    assert.strictEqual(testVersion.label, "V1");
    assert.strictEqual(testVersion.score, 85);
    assert.ok(testVersion.rawText.includes("Verify Corp"));
    console.log("Resume and Version creation validated successfully.");

    // 4. Test Text Reconstruction
    console.log("Testing text reconstruction...");
    const reconstructed = reconstructText(parsedSections);
    assert.ok(reconstructed.includes("Test User"));
    assert.ok(reconstructed.includes("QA Tester"));
    assert.ok(reconstructed.includes("Verify Corp"));
    assert.ok(reconstructed.includes("Testing, Asserts"));
    console.log("Text reconstruction validated successfully.");

    // 5. Test Analysis model creation
    console.log("Testing analysis creation...");
    const testAnalysis = await Analysis.create({
      versionId: testVersion.id,
      atsScore: 85,
      model: "gemini-2.5-flash",
      summary: "This is a great resume.",
      scoreBreakdown: [
        { label: "Keywords", value: 90 },
        { label: "Format", value: 80 },
        { label: "Impact", value: 85 },
        { label: "Readability", value: 90 },
        { label: "Action verbs", value: 80 },
      ],
      issues: [],
      strengths: [],
      keywordsPresent: ["Testing", "Asserts"],
      keywordsMissing: ["Integration Testing"],
      bulletRewrites: [],
      targetRole: "QA Engineer",
    });

    assert.strictEqual(testAnalysis.atsScore, 85);
    assert.strictEqual(testAnalysis.targetRole, "QA Engineer");
    console.log("Analysis creation validated successfully.");

    // 6. Test Activity model creation
    console.log("Testing activity logs...");
    const testActivity = await Activity.create({
      userId: testUser.id,
      resumeId: testResume.id,
      type: "upload",
      title: "Uploaded Test Resume",
      subtitle: "Parsed 3 sections",
      label: "V1",
    });
    assert.strictEqual(testActivity.type, "upload");
    console.log("Activity log validated successfully.");

    console.log("=== ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY ===");
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runTests();
