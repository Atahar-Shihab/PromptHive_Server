import { Router } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../env.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

function reportToText(report) {
  return [
    `${report.reason}`,
    "",
    `Quality score: ${report.score}/100 (${report.quality})`,
    `Estimated length: ${report.metrics.wordCount} words`,
    `Concrete prompt check: ${report.metrics.variableCount ? "needs concrete details" : "ready to use"}`,
    "",
    "Strengths:",
    ...report.strengths.map((item) => `- ${item}`),
    "",
    "Issues to fix:",
    ...report.issues.map((item) => `- ${item}`),
    "",
    "Recommended refinements:",
    ...report.recommendations.map((item) => `- ${item}`),
    "",
    "Sample test input:",
    ...report.sampleInput.map((item) => `- ${item}`)
  ].join("\n");
}

function parseAiReport(text) {
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!Number.isFinite(Number(parsed.score))) return null;
    return {
      reason: parsed.reason ?? "Live AI evaluator completed the prompt analysis.",
      score: Math.max(0, Math.min(100, Number(parsed.score))),
      quality: parsed.quality ?? "Reviewed",
      metrics: {
        wordCount: Number(parsed.metrics?.wordCount ?? 0),
        variableCount: Number(parsed.metrics?.variableCount ?? 0),
        roleClarity: Boolean(parsed.metrics?.roleClarity),
        contextClarity: Boolean(parsed.metrics?.contextClarity),
        outputFormat: Boolean(parsed.metrics?.outputFormat),
        constraints: Boolean(parsed.metrics?.constraints)
      },
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 4) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : [],
      sampleInput: Array.isArray(parsed.sampleInput) ? parsed.sampleInput.slice(0, 4) : []
    };
  } catch {
    return null;
  }
}

function evaluationPrompt(prompt) {
  return [
    "You are PromptHive's prompt QA evaluator. Do not execute the prompt. Evaluate its quality for marketplace users.",
    "Prefer concrete ready-to-use prompts over placeholder templates. If placeholder variables are present, reduce the score slightly and recommend replacing them with real project context.",
    "Return only valid JSON with this shape:",
    '{"reason":"string","score":0,"quality":"Excellent|Good|Needs refinement","metrics":{"wordCount":0,"variableCount":0,"roleClarity":true,"contextClarity":true,"outputFormat":true,"constraints":true},"strengths":["string"],"issues":["string"],"recommendations":["string"],"sampleInput":["string"]}',
    "",
    "Prompt to evaluate:",
    prompt
  ].join("\n");
}

function localPromptPreview(prompt, provider = "local", reason = "PromptHive local test engine completed the analysis.") {
  const placeholders = prompt.match(/\{\{.*?\}\}|\{.*?\}/g) ?? [];
  const variableCount = placeholders.length;
  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const hasRole = /\b(act as|you are|role:|expert|assistant)\b/i.test(prompt);
  const hasOutput = /\b(output|return|format|deliver|include)\b/i.test(prompt);
  const hasContext = /\b(context|audience|goal|topic|product|brand|workflow|notes)\b/i.test(prompt);
  const hasConstraints = /\b(constraints|avoid|must|tone|style|length|criteria|rubric|requirements)\b/i.test(prompt);
  const hasExamples = /\b(example|sample|reference|input|source)\b/i.test(prompt);
  const score = Math.min(100, 42 + (hasRole ? 15 : 0) + (hasOutput ? 16 : 0) + (hasContext ? 14 : 0) + (hasConstraints ? 11 : 0) + (hasExamples ? 6 : 0) - Math.min(8, variableCount * 2));
  const quality = score >= 82 ? "Excellent" : score >= 68 ? "Good" : "Needs refinement";
  const strengths = [
    hasRole && "Defines a role or expertise frame.",
    hasContext && "Includes useful context for the model.",
    hasOutput && "Mentions an expected output or format.",
    hasConstraints && "Provides constraints or evaluation criteria.",
    variableCount === 0 && "Uses concrete project details instead of placeholder variables."
  ].filter(Boolean);
  const issues = [
    !hasRole && "Add a clear role such as 'Act as a senior...' or 'You are...'.",
    !hasContext && "Add audience, product, source text, or goal context.",
    !hasOutput && "Specify the exact output format and sections.",
    !hasConstraints && "Add constraints, tone, length, exclusions, or success criteria.",
    wordCount < 35 && "The prompt is short; add more task context for consistent results."
  ].filter(Boolean);
  const recommendations = [
    "Ask for assumptions before the final answer when information is missing.",
    "Add a compact checklist or rubric for quality control.",
    "Specify tone, length, structure, and non-goals.",
    "Test once with a broad input and once with a stricter edge case."
  ];
  const sampleInput = placeholders.length
    ? ["Rewrite the prompt with specific product, audience, channel, and success criteria before testing."]
    : ["Test this prompt with the actual project notes, customer segment, and desired output length."];

  const report = {
    reason,
    score,
    quality,
    metrics: {
      wordCount,
      variableCount,
      roleClarity: hasRole,
      contextClarity: hasContext,
      outputFormat: hasOutput,
      constraints: hasConstraints
    },
    strengths: strengths.length ? strengths : ["The prompt can be tested, copied, and refined from this baseline."],
    issues: issues.length ? issues : ["No major structural gaps detected. Consider testing with an edge case."],
    recommendations,
    sampleInput
  };

  return {
    provider,
    fallback: true,
    report,
    output: reportToText(report)
  };
}

async function evaluateWithGemini(promptContent) {
  if (!env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const candidateModels = [env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-latest"].filter(Boolean);
  const tried = new Set();
  for (const modelName of candidateModels) {
    if (tried.has(modelName)) continue;
    tried.add(modelName);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(evaluationPrompt(promptContent));
      const output = result.response.text();
      const report = parseAiReport(output);
      if (report) {
        return { provider: "gemini", model: modelName, output: reportToText(report), report };
      }
    } catch (err) {
      console.warn(`[AI Evaluator] Gemini (${modelName}) failed:`, err?.message || err);
    }
  }
  return null;
}

async function evaluateWithOpenAI(promptContent) {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const model = env.OPENAI_MODEL === "gpt-5.5" ? "gpt-4o-mini" : env.OPENAI_MODEL;
    const result = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: evaluationPrompt(promptContent) }]
    });
    const output = result.choices[0]?.message?.content ?? "";
    const report = parseAiReport(output);
    if (report) {
      return { provider: "openai", model, output: reportToText(report), report };
    }
  } catch (err) {
    console.warn("[AI Evaluator] OpenAI failed:", err?.message || err);
  }
  return null;
}

router.post(
  "/test-prompt",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        prompt: z.string().min(5),
        provider: z.enum(["auto", "openai", "gemini"]).default("auto")
      })
      .parse(req.body);

    if (body.provider === "gemini") {
      const geminiResult = await evaluateWithGemini(body.prompt);
      if (geminiResult) return res.json(geminiResult);
      const openAiResult = await evaluateWithOpenAI(body.prompt);
      if (openAiResult) return res.json(openAiResult);
    } else if (body.provider === "openai") {
      const openAiResult = await evaluateWithOpenAI(body.prompt);
      if (openAiResult) return res.json(openAiResult);
      const geminiResult = await evaluateWithGemini(body.prompt);
      if (geminiResult) return res.json(geminiResult);
    } else {
      // Auto: prefer Gemini (verified active credentials), fallback to OpenAI
      const geminiResult = await evaluateWithGemini(body.prompt);
      if (geminiResult) return res.json(geminiResult);
      const openAiResult = await evaluateWithOpenAI(body.prompt);
      if (openAiResult) return res.json(openAiResult);
    }

    res.json(
      localPromptPreview(
        body.prompt,
        "mock",
        "Live AI evaluator is currently busy or credentials need top-up. PromptHive generated an instant heuristic QA analysis."
      )
    );
  })
);

export default router;
