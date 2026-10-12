process.env.NODE_ENV = "test";
process.env.DB_STORAGE = ":memory:";
process.env.JWT_SECRET = "test_super_secret_key_1234567890";

import assert from "node:assert";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// Dynamic imports to ensure in-memory test database and environment variables
const { app } = await import("./server.js");
const { sequelize } = await import("./db.js");

console.log("=== RUNNING END-TO-END PRODUCT FEATURES API TEST ===\n");

await sequelize.sync({ force: true });

// Start test server on random ephemeral port
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://localhost:${port}`;

try {
  // 1. Register test user
  console.log("[1] Registering user...");
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Product Test User",
      email: "product.test@example.com",
      password: "Password123!",
    }),
  });
  assert.strictEqual(regRes.status, 201);
  const cookieHeader = regRes.headers.get("set-cookie");
  assert.ok(cookieHeader, "Cookie header should be returned");
  const jwtMatch = cookieHeader.match(/jwt=([^;]+)/);
  const token = jwtMatch ? jwtMatch[1] : null;
  assert.ok(token, "JWT token should be in cookie");
  console.log("✓ User registered and authenticated cookie/token obtained.");

  // 2. Load the existing test PDF
  console.log("[2] Reading existing test PDF...");
  const pdfPath = path.resolve("../ai-resume-checker-ui-boilerplate-code-main/jane_doe_resume.pdf");
  assert.ok(fs.existsSync(pdfPath), `PDF file should exist at ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);

  // 3. Upload PDF via FormData
  console.log("[3] Uploading PDF resume via multipart/form-data...");
  const pdfFormData = new FormData();
  pdfFormData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "jane_doe_resume.pdf");
  pdfFormData.append("title", "Jane Doe Resume");

  const pdfUploadRes = await fetch(`${baseUrl}/api/resumes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: pdfFormData,
  });

  assert.strictEqual(pdfUploadRes.status, 201);
  const pdfUploadData = await pdfUploadRes.json();
  const pdfResumeId = pdfUploadData.resume._id;
  const pdfVersionId = pdfUploadData.resume.currentVersionId;
  assert.ok(pdfResumeId, "Resume ID should be returned");
  assert.ok(pdfVersionId, "Version ID should be returned");
  console.log("✓ PDF uploaded and parsed successfully.");

  // 4. Test DOCX Upload with ZIP Header Magic Bytes
  console.log("[4] Testing DOCX upload with PK magic bytes...");
  const mockDocxBytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
  const docxFormData = new FormData();
  docxFormData.append(
    "file",
    new Blob([mockDocxBytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    "test_document.docx"
  );

  const docxUploadRes = await fetch(`${baseUrl}/api/resumes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: docxFormData,
  });
  const docxData = await docxUploadRes.json();
  // It shouldn't fail with invalid signature
  assert.notStrictEqual(
    docxData.error?.message,
    "Invalid file format: File header does not match PDF signature (%PDF) or DOCX (PK) signature. Please upload a valid PDF or Word document."
  );
  console.log("✓ DOCX file filter and PK signature verification accepted DOCX format.");

  // 5. Run Analysis with Job Description Matching
  console.log("[5] Running analysis with custom Job Description matching...");
  const sampleJD = `
  We are seeking a Lead Full Stack Engineer.
  Requirements:
  - Proven mastery of React, TypeScript, and Node.js
  - Deep experience with Docker, AWS, and CI/CD automation
  - Hands-on expertise with GraphQL APIs, Kafka message streaming, and Kubernetes
  - Strong background in Terraform infrastructure as code and Microservices
  `;

  const analyzeRes = await fetch(`${baseUrl}/api/resumes/${pdfResumeId}/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      versionId: pdfVersionId,
      targetRole: "Lead Full Stack Engineer",
      jobDescription: sampleJD,
    }),
  });

  assert.strictEqual(analyzeRes.status, 200);
  const analyzeData = await analyzeRes.json();
  const analysis = analyzeData.analysis;

  assert.ok(analysis.atsScore >= 0 && analysis.atsScore <= 100);
  assert.strictEqual(analysis.targetRole, "Lead Full Stack Engineer");
  assert.ok(analysis.jobDescription.includes("Lead Full Stack Engineer"));
  assert.ok(analysis.jdMatch, "jdMatch object should be present");
  assert.ok(analysis.jdMatch.matchRate >= 0, "Match rate should be calculated");
  assert.ok(analysis.keywordsPresent.length > 0, "Matched keywords should be present");
  assert.ok(analysis.keywordsMissing.length > 0, "Keyword gap should be detected");
  console.log(
    `✓ Analysis completed: ATS Score ${analysis.atsScore}/100, JD Match Rate: ${analysis.jdMatch.matchRate}%, Matched: ${analysis.keywordsPresent.length}, Gap: ${analysis.keywordsMissing.length}`
  );

  // 6. Verify GET analyses returns jobDescription
  console.log("[6] Verifying GET /resumes/:id/analyses persists and retrieves jobDescription...");
  const listAnalysesRes = await fetch(`${baseUrl}/api/resumes/${pdfResumeId}/analyses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(listAnalysesRes.status, 200);
  const listData = await listAnalysesRes.json();
  assert.ok(listData.analyses.length >= 1);
  assert.ok(listData.analyses[0].jobDescription);
  console.log("✓ jobDescription successfully stored and retrieved via API.");

  console.log("\n=== ALL END-TO-END PRODUCT FEATURES TESTS PASSED! ===");
} finally {
  server.close();
}
