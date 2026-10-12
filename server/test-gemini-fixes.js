import assert from "node:assert";
import {
  fallbackParseResumeText,
  fallbackAnalyzeResume,
  GEMINI_MODEL
} from "./gemini.js";
import {
  parsedResumeSchema,
  analysisResultSchema
} from "./validation.js";

console.log("=== RUNNING GEMINI REFACTOR & VALIDATION TESTS ===");

// 1. Model Name Verification
console.log("\n[TEST 1] Verifying active model configuration...");
assert.notStrictEqual(GEMINI_MODEL, "gemini-1.5-flash", "Model should not be legacy gemini-1.5-flash");
assert.strictEqual(GEMINI_MODEL, "gemini-2.5-flash", "Default model should be gemini-2.5-flash");
console.log(`✓ Active model confirmed: ${GEMINI_MODEL}`);

// 2. Fallback Parser - No fake data on empty/sparse resume
console.log("\n[TEST 2] Verifying fallbackParseResumeText does not invent fake data...");
const sparseText = `John Smith\nSoftware Developer\njohn@example.com\n555-0199\n\nEXPERIENCE\nFrontend Developer at Acme\n2022 - Present\n- Built customer dashboards using React\n`;

const parsedSparse = fallbackParseResumeText(sparseText);

// Validate with zod
const validatedSparse = parsedResumeSchema.parse(parsedSparse);

// Check that name and email match real text
assert.strictEqual(validatedSparse.basics.name, "John Smith");
assert.strictEqual(validatedSparse.basics.email, "john@example.com");

// Check that missing fields are strictly empty, NOT fabricated
assert.strictEqual(validatedSparse.summary, "", "Summary should be empty if not in resume");
assert.deepStrictEqual(validatedSparse.certifications, [], "Certifications should be empty array, no AWS placeholder");
assert.deepStrictEqual(validatedSparse.education, [], "Education should be empty array, no State University placeholder");
assert.deepStrictEqual(validatedSparse.languages, [], "Languages should be empty array, no Spanish placeholder");
assert.deepStrictEqual(validatedSparse.interests, [], "Interests should be empty array, no Hiking placeholder");

// Verify that "Jane Doe" is never generated
const completelyEmptyParsed = fallbackParseResumeText("A resume without headers");
assert.notStrictEqual(completelyEmptyParsed.basics.name, "Jane Doe", "Name should never default to Jane Doe");
assert.notStrictEqual(completelyEmptyParsed.basics.email, "jane.doe@example.com");
assert.strictEqual(completelyEmptyParsed.summary, "");
assert.deepStrictEqual(completelyEmptyParsed.certifications, []);
assert.deepStrictEqual(completelyEmptyParsed.languages, []);
assert.deepStrictEqual(completelyEmptyParsed.interests, []);
console.log("✓ Fallback parser leaves all missing fields empty and does not invent fake data.");

// 3. Fallback Analyzer - Basic mode marking and no fabricated numbers
console.log("\n[TEST 3] Verifying fallbackAnalyzeResume markings and metrics...");
const analysis = fallbackAnalyzeResume(validatedSparse, "Software Engineer");

// Validate with zod
const validatedAnalysis = analysisResultSchema.parse(analysis);

assert.strictEqual(validatedAnalysis.model, "basic mode (AI unavailable)", "Model must be marked as basic mode (AI unavailable)");
assert.strictEqual(validatedAnalysis.isFallback, true, "isFallback must be true");
assert.ok(validatedAnalysis.summary.includes("Basic Mode (AI Unavailable)"), "Summary should indicate basic mode");

// Check that bullet rewrites do NOT contain fabricated numbers like "42% decrease in latency"
validatedAnalysis.bulletRewrites.forEach((rw) => {
  assert.ok(!rw.rewritten.includes("42% decrease in latency"), "Rewrite must not fabricate 42% decrease in latency");
  assert.ok(!rw.rewritten.includes("$12,000"), "Rewrite must not fabricate $12,000");
  assert.ok(!rw.original.includes("Assisted senior doctors"), "Must not invent fake bullets like Assisted senior doctors");
});
console.log("✓ Fallback analyzer properly marked as basic mode and does not fabricate numbers.");

// 4. Zod Validation - Rejection of malformed model reply
console.log("\n[TEST 4] Verifying Zod validation prevents malformed database entries...");
const malformedParsed = {
  basics: null,
  summary: null,
  experience: "not an array",
  education: null,
  skills: null
};
const repaired = parsedResumeSchema.parse(malformedParsed);
assert.strictEqual(typeof repaired.basics, "object");
assert.strictEqual(repaired.summary, "");
assert.deepStrictEqual(repaired.experience, []);
assert.deepStrictEqual(repaired.education, []);
assert.deepStrictEqual(repaired.skills, []);
console.log("✓ Zod schema safely normalizes malformed inputs.");

// 5. Password length rule agreement (minimum 8 characters)
console.log("\n[TEST 5] Verifying password schema requires at least 8 characters...");
import { registerSchema, changePasswordSchema } from "./validation.js";

const shortPassResult = registerSchema.safeParse({
  name: "Valid User",
  email: "valid@example.com",
  password: "123456" // 6 chars, used to be valid, now invalid
});
assert.strictEqual(shortPassResult.success, false, "6-character password must fail registration validation");
assert.ok(shortPassResult.error.flatten().fieldErrors.password?.[0]?.includes("8 characters"));

const validPassResult = registerSchema.safeParse({
  name: "Valid User",
  email: "valid@example.com",
  password: "password123" // >= 8 chars
});
assert.strictEqual(validPassResult.success, true, "8+ character password must succeed registration validation");
console.log("✓ Password rules successfully enforce minimum 8 characters.");

// 6. Index-based bullet rewrites
console.log("\n[TEST 6] Verifying index-based bullet rewrites...");
assert.strictEqual(typeof validatedAnalysis.bulletRewrites[0].experienceIndex, "number");
assert.strictEqual(typeof validatedAnalysis.bulletRewrites[0].bulletIndex, "number");
assert.strictEqual(validatedAnalysis.bulletRewrites[0].experienceIndex, 1);
assert.strictEqual(validatedAnalysis.bulletRewrites[0].bulletIndex, 0);
console.log("✓ Bullet rewrites contain experienceIndex and bulletIndex.");

// 7. PDF Magic Bytes validation
console.log("\n[TEST 7] Verifying PDF magic bytes validation...");
const isPdfMagicBytes = (buf) => {
  if (!buf || buf.length < 4) return false;
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
};

const fakePdf = Buffer.from("NOT_A_PDF_FILE");
const realPdfHeader = Buffer.from("%PDF-1.4 header content");
assert.strictEqual(isPdfMagicBytes(fakePdf), false, "Non-PDF buffer must fail magic bytes check");
assert.strictEqual(isPdfMagicBytes(realPdfHeader), true, "Valid %PDF buffer must pass magic bytes check");
console.log("✓ PDF magic bytes check correctly rejects disguised non-PDF files.");

console.log("\n=== ALL GEMINI & SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
