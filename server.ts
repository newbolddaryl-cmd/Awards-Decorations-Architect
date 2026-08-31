import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Health check endpoint for ingress / reverse proxy
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use(express.json({ limit: "2mb" }));

// Process safety
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection in server:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception in server:", err);
});

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Sensitive data pattern detection (Guardrail)
function detectSensitiveData(text: string): { isSensitive: boolean; reason: string } {
  if (!text) return { isSensitive: false, reason: "" };

  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/;
  const classificationKeywords = /\b(TOP SECRET|SECRET|CONFIDENTIAL|CUI|CONTROLLED UNCLASSIFIED|FOUO|NOFORN|SCI|TK|HCS)\b/i;
  const phiKeywords = /\b(HIPAA|DIAGNOSIS|PRESCRIPTION|MEDICAL RECORD NUMBER|PATIENT ID)\b/i;
  const financialKeywords = /\b(\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}|\bROUTING NUMBER\b|\bACCOUNT NUMBER\b)\b/i;

  if (classificationKeywords.test(text)) {
    return {
      isSensitive: true,
      reason: "Potential classified markings or CUI/FOUO identifiers detected.",
    };
  }
  if (ssnRegex.test(text)) {
    return {
      isSensitive: true,
      reason: "Potential Social Security Number (SSN) or unformatted 9-digit ID detected.",
    };
  }
  if (phiKeywords.test(text)) {
    return {
      isSensitive: true,
      reason: "Potential Protected Health Information (PHI) or medical identifiers detected.",
    };
  }
  if (financialKeywords.test(text)) {
    return {
      isSensitive: true,
      reason: "Potential personal financial data or card/account number detected.",
    };
  }

  return { isSensitive: false, reason: "" };
}

const SYSTEM_INSTRUCTION = `# Awards & Decorations Architect – General Edition v32.0

## INIT
Internally adopt the role of Awards & Decorations Architect – General Edition v32.0. Do not announce this role unless asked.
Hard Gate: Before drafting, confirm product type (Award or Decoration), specific award/decoration name or program, form/format (AF Form 1206, citation format, WMA Form 15, Joint, etc.), rank/grade, and target board/approval level. If critical information remains missing, do not generate drafts — provide only organization or gap identification.
Context Hygiene: If prior awards packages or EPBs are provided, use them for progression and competitiveness analysis. If none are available, state that progression assessment is degraded.

## VOICE
Authoritative, concise military staff tone. BLUF, active voice, high information density. Be direct when input is weak or inflated. Build competitive packages, not just edit bullets.

## GUARD
Use only mission-relevant official information. Never process or repeat classified data, PII, PHI, or personal financial information.
Never invent metrics or outcomes. Use [INSERT METRIC] or [VALIDATE IMPACT].
Do not add people, certifications, deployments, boards, or mission claims that are not in the raw notes.

## SCOPE
Transform raw notes into competitive, board-ready award and decoration packages for Air Force, WMA, and Joint environments.

## METHOD
Causal Integrity Test: Every causal claim must be supported by an explicit mechanism or a clear action-result link. If weak, use "enabled," "supported," or "contributed to" and flag it.
Capability & Impact Test: Identify what genuinely changed. Challenge one-time actions presented as enduring capability.
Progression & Competitiveness Test: Compare against prior packages when available. Flag recycled achievements and stagnant scope.

## CRAFT
Treat line and character limits as non-negotiable. Compress in this order: remove filler → tighten verbs → shorten acronyms/phrasings.
Format bullets according to standard modern Air Force / DoD performance formats (action; result--impact or narrative citation sentences as required by the format).`;

// Structured Schema for generation
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isHardGated: {
      type: Type.BOOLEAN,
      description: "True if critical required fields are missing and final drafts cannot be created",
    },
    hardGateNotice: {
      type: Type.STRING,
      description: "Explanation if hard-gated or noting missing criteria",
    },
    progressionWarning: {
      type: Type.STRING,
      description: "Progression warning string if no prior packages provided",
    },
    packageHeader: {
      type: Type.OBJECT,
      properties: {
        productType: { type: Type.STRING },
        awardName: { type: Type.STRING },
        formFormat: { type: Type.STRING },
        rankGrade: { type: Type.STRING },
        afscDutyArea: { type: Type.STRING },
        targetBoardLevel: { type: Type.STRING },
        limitValue: { type: Type.STRING },
        candidateInfo: { type: Type.STRING },
      },
      required: ["productType", "awardName", "formFormat", "rankGrade", "targetBoardLevel", "limitValue"],
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          maxLimit: { type: Type.STRING },
          content: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          charCount: { type: Type.INTEGER },
        },
        required: ["id", "title", "content", "bullets"],
      },
    },
    issuesList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
          category: { type: Type.STRING, description: "Metric, Causal Link, Inflation, Limit, Formatting, etc." },
          description: { type: Type.STRING },
        },
        required: ["severity", "category", "description"],
      },
    },
    gapsIdentified: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    nextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["isHardGated", "packageHeader", "sections", "issuesList", "nextSteps"],
};

// Resilient Gemini calling with verified model fallback, thinking budget control, and retry
async function callGeminiStructured<T>(options: {
  contents: string;
  systemInstruction: string;
  responseSchema: any;
  temperature?: number;
}): Promise<T> {
  const ai = getAI();
  // Valid text models supported by @google/genai per guidelines
  const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          // Brief pause for temporary demand spikes
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));
        }

        const config: any = {
          systemInstruction: options.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: options.responseSchema,
          temperature: options.temperature ?? 0.2,
        };

        // If using gemini-3.7-flash, set thinkingBudget to 0 for rapid response and lower latency
        if (model === "gemini-3.7-flash") {
          config.thinkingConfig = { thinkingBudget: 0 };
        }

        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config,
        });

        const text = response.text;
        if (!text) {
          throw new Error(`Empty response received from ${model}.`);
        }

        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        return JSON.parse(cleaned) as T;
      } catch (err: any) {
        lastError = err;
        const errString = String(err?.message || err);
        console.warn(`[Gemini API] Model ${model} attempt ${attempt + 1} notice:`, errString);

        const isTransient =
          errString.includes("503") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("high demand") ||
          errString.includes("Resource has been exhausted") ||
          errString.includes("429") ||
          errString.includes("500") ||
          errString.includes("Overloaded");

        if (!isTransient) {
          // If non-transient, don't repeat this model, proceed to next
          break;
        }
      }
    }
  }

  let userFriendlyMsg = lastError?.message || "An unexpected error occurred while communicating with the AI service.";
  if (
    userFriendlyMsg.includes("503") ||
    userFriendlyMsg.includes("UNAVAILABLE") ||
    userFriendlyMsg.includes("high demand") ||
    userFriendlyMsg.includes("429") ||
    userFriendlyMsg.includes("Resource has been exhausted")
  ) {
    userFriendlyMsg =
      "The AI model is currently experiencing temporary high demand from Google. Please click 'Retry Now' to try again.";
  }

  throw new Error(userFriendlyMsg);
}

// API Endpoint for Generate
app.post("/api/generate", async (req, res) => {
  try {
    const {
      productType,
      awardName,
      formFormat,
      rankGrade,
      afscDutyArea,
      targetBoardLevel,
      limitValue,
      name,
      dutyTitle,
      unit,
      inclusiveDates,
      priorPackages,
      localGuidance,
      rawNotes,
      revisionInstructions,
    } = req.body;

    // Check sensitive data guard
    const allInputCombined = [
      rawNotes,
      priorPackages,
      localGuidance,
      revisionInstructions,
      name,
      dutyTitle,
      unit,
    ].filter(Boolean).join("\n");

    const sensitiveCheck = detectSensitiveData(allInputCombined);
    if (sensitiveCheck.isSensitive) {
      return res.status(400).json({
        error: "SENSITIVE_DATA_DETECTED",
        message:
          "Input contains potential classified information, CUI, SSN, DoD ID, PHI, or personal financial data. Please sanitize your notes first before resubmitting.",
        details: sensitiveCheck.reason,
      });
    }

    // Check Hard Gate requirements
    const isMissingCritical =
      !productType ||
      !awardName ||
      !formFormat ||
      !rankGrade ||
      !limitValue ||
      limitValue.toString().trim() === "";

    const userPrompt = `
Generate or organize an awards/decoration draft package based on the following input parameters.

SETUP DATA:
- Product Type: ${productType || "[MISSING]"}
- Specific Award/Decoration Name or Program: ${awardName || "[MISSING]"}
- Form/Format: ${formFormat || "[MISSING]"}
- Rank/Grade: ${rankGrade || "[MISSING]"}
- AFSC / Duty Area: ${afscDutyArea || "Not specified"}
- Target Board / Approval Level: ${targetBoardLevel || "[MISSING]"}
- Specified Limit: ${limitValue || "[MISSING]"}
- Member Name: ${name || "Omitted"}
- Duty Title: ${dutyTitle || "Omitted"}
- Unit: ${unit || "Omitted"}
- Inclusive Dates: ${inclusiveDates || "Omitted"}

CONTEXT & GUIDANCE:
- Prior Awards Packages / EPBs: ${priorPackages ? priorPackages : "None provided"}
- Local / Command Guidance: ${localGuidance ? localGuidance : "None provided"}

RAW NOTES & ACCOMPLISHMENTS:
${rawNotes || "[No notes provided]"}

REVISION INSTRUCTIONS (if any):
${revisionInstructions || "Initial Generation"}

HARD GATE STATUS:
${isMissingCritical ? "CRITICAL DATA MISSING. DO NOT DRAFT FINAL BULLETS. Only organize notes and list gaps." : "ALL CRITICAL DATA PRESENT. Produce board-ready drafted bullets/citation sentences adhering to limit."}

REMINDERS:
- If prior awards packages are absent, include: "Progression assessment is degraded without prior packages." in progressionWarning.
- Use [INSERT METRIC] or [VALIDATE IMPACT] where numbers/mechanisms are missing.
- Respect character/line limits strictly.
`;

    const parsed = await callGeminiStructured({
      contents: userPrompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    });

    return res.json(parsed);
  } catch (error: any) {
    console.error("Generation error:", error);
    return res.status(500).json({
      error: "GENERATION_FAILED",
      message: error.message || "Failed to generate award package.",
    });
  }
});

// API Endpoint for Improve (includes before/after tracking)
app.post("/api/improve", async (req, res) => {
  try {
    const {
      currentDraft,
      rawNotes,
      revisionInstructions,
      packageHeader,
      priorPackages,
      localGuidance,
    } = req.body;

    const allInputCombined = [
      rawNotes,
      revisionInstructions,
      priorPackages,
      localGuidance,
      JSON.stringify(currentDraft),
    ].filter(Boolean).join("\n");

    const sensitiveCheck = detectSensitiveData(allInputCombined);
    if (sensitiveCheck.isSensitive) {
      return res.status(400).json({
        error: "SENSITIVE_DATA_DETECTED",
        message:
          "Input contains potential classified information, CUI, SSN, DoD ID, PHI, or personal financial data. Please sanitize your notes first before resubmitting.",
        details: sensitiveCheck.reason,
      });
    }

    const prompt = `
You are tasked with IMPROVING and REVISING the current draft package based on the revision instructions, raw notes, and writing engine rules.

CURRENT PACKAGE HEADER:
${JSON.stringify(packageHeader, null, 2)}

CURRENT DRAFT SECTIONS:
${JSON.stringify(currentDraft, null, 2)}

RAW NOTES / ACCOMPLISHMENTS:
${rawNotes || "[None]"}

REVISION INSTRUCTIONS:
${revisionInstructions || "Tighten phrasing, enforce active voice, strengthen causal integrity, eliminate filler, and ensure strict compliance with limits."}

PRIOR PACKAGES:
${priorPackages || "None provided"}

LOCAL GUIDANCE:
${localGuidance || "None provided"}

TASK:
1. Apply the revision instructions and writing engine rules.
2. Sharpen bullets / citations, verify causal mechanisms (or insert [INSERT METRIC] / [VALIDATE IMPACT]).
3. Ensure every character fits within the target limits.
4. Output the complete revised JSON structure.
`;

    const parsed = await callGeminiStructured({
      contents: prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    });

    return res.json(parsed);
  } catch (error: any) {
    console.error("Improve error:", error);
    return res.status(500).json({
      error: "IMPROVE_FAILED",
      message: error.message || "Failed to improve award package.",
    });
  }
});

// API Endpoint for Murderboard critique
app.post("/api/murderboard", async (req, res) => {
  try {
    const { packageHeader, sections, rawNotes, priorPackages } = req.body;

    const allInputCombined = [
      rawNotes,
      priorPackages,
      JSON.stringify(sections),
    ].filter(Boolean).join("\n");

    const sensitiveCheck = detectSensitiveData(allInputCombined);
    if (sensitiveCheck.isSensitive) {
      return res.status(400).json({
        error: "SENSITIVE_DATA_DETECTED",
        message:
          "Input contains potential classified information, CUI, SSN, DoD ID, PHI, or personal financial data. Please sanitize your notes first before resubmitting.",
        details: sensitiveCheck.reason,
      });
    }

    const MURDERBOARD_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.INTEGER, description: "Board readiness score from 1 to 10" },
        overallAssessment: { type: Type.STRING, description: "Executive summary of package competitiveness" },
        scoringRubric: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "e.g. Causal Integrity, Metric Rigor, Scope & Leadership, Limit Compliance, Progression" },
              score: { type: Type.INTEGER, description: "Score out of 10" },
              verdict: { type: Type.STRING, description: "Competitive, Needs Hardening, or At Risk" },
              critique: { type: Type.STRING },
            },
            required: ["category", "score", "verdict", "critique"],
          },
        },
        boardQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              targetBullet: { type: Type.STRING },
              challengeQuestion: { type: Type.STRING },
              vulnerability: { type: Type.STRING },
            },
            required: ["targetBullet", "challengeQuestion", "vulnerability"],
          },
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["overallScore", "overallAssessment", "scoringRubric", "boardQuestions", "recommendations"],
    };

    const prompt = `
Conduct an intense, realistic military Murderboard Review of this draft package for a ${packageHeader?.targetBoardLevel || "Wing"} level board.

PACKAGE DETAILS:
- Award/Dec: ${packageHeader?.awardName || "Award"} (${packageHeader?.productType || "Award"})
- Form: ${packageHeader?.formFormat}
- Rank: ${packageHeader?.rankGrade}
- AFSC: ${packageHeader?.afscDutyArea}
- Board Level: ${packageHeader?.targetBoardLevel}

SECTIONS & BULLETS:
${JSON.stringify(sections, null, 2)}

RAW NOTES:
${rawNotes || "None"}

PRIOR PACKAGES:
${priorPackages || "None provided (Progression assessment is degraded)"}

Adopt the persona of a senior board president evaluating packages under high scrutiny.
Flag inflated claims, missing quantitative metrics, unverified scope, passive phrasing, or generic buzzwords.
`;

    const parsed = await callGeminiStructured({
      contents: prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseSchema: MURDERBOARD_SCHEMA,
      temperature: 0.3,
    });

    return res.json(parsed);
  } catch (error: any) {
    console.error("Murderboard error:", error);
    return res.status(500).json({
      error: "MURDERBOARD_FAILED",
      message: error.message || "Failed to run murderboard critique.",
    });
  }
});

// Vite middleware / static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Awards Architect server running on http://localhost:${PORT}`);
  });
}

startServer();
