import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  calculateMastery,
  type QuestionAttemptForAnalytics,
} from "@/lib/analytics";
import type {
  AiLearningAnalysis,
  AiLearningAnalysisResponse,
  LearnerAnalytics,
} from "@/types/aiAnalysis";

export const runtime = "nodejs";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    areasToImprove: { type: "array", items: { type: "string" } },
    recommendedNextSteps: { type: "array", items: { type: "string" } },
  },
  required: [
    "summary",
    "strengths",
    "areasToImprove",
    "recommendedNextSteps",
  ],
} as const;

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError?.status === 0) {
    return Response.json(
      { error: "Could not verify your session with Supabase. Please try again." },
      { status: 503 }
    );
  }

  if (userError || !user) {
    return Response.json(
      { error: "Your session is no longer valid. Please log in again." },
      { status: 401 }
    );
  }

  const { data, error: attemptsError } = await supabase
    .from("question_attempts")
    .select("topic, skill, is_correct, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false, nullsFirst: false });

  if (attemptsError) {
    return Response.json(
      { error: "Could not load learner analytics." },
      { status: 500 }
    );
  }

  const attempts = (data ?? []) as Array<
    QuestionAttemptForAnalytics & { created_at: string }
  >;

  if (attempts.length === 0) {
    return Response.json(
      { error: "Complete a quiz before requesting an AI analysis." },
      { status: 400 }
    );
  }

  const latestAttemptAt = attempts[0]?.created_at;

  if (!latestAttemptAt || Number.isNaN(Date.parse(latestAttemptAt))) {
    return Response.json(
      { error: "Learner attempt timestamps are unavailable." },
      { status: 500 }
    );
  }

  const { data: cachedRow, error: cacheError } = await supabase
    .from("ai_analyses")
    .select("analysis_json")
    .eq("user_id", user.id)
    .eq("based_on_latest_attempt_at", latestAttemptAt)
    .maybeSingle();

  if (cacheError) {
    return Response.json(
      { error: "Could not check the saved AI analysis." },
      { status: 500 }
    );
  }

  if (cachedRow) {
    if (!isAiLearningAnalysis(cachedRow.analysis_json)) {
      return Response.json(
        { error: "The saved AI analysis has an unexpected format." },
        { status: 500 }
      );
    }

    return analysisResponse(cachedRow.analysis_json, "cache");
  }

  const analytics: LearnerAnalytics = {
    topics: calculateMastery(attempts, "topic"),
    skills: calculateMastery(attempts, "skill"),
  };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "AI learning analysis is not configured yet." },
      { status: 503 }
    );
  }

  let analysis: AiLearningAnalysis;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      store: false,
      max_output_tokens: 600,
      instructions:
        "You are a supportive Primary Mathematics learning coach. Use the supplied analytics exactly as given. Do not calculate or alter scores, counts, percentages, or mastery. Base every observation on the supplied topic and skill aggregates. Keep advice concise, specific, age-appropriate, and evidence-based. Do not mention private data or infer personal traits.",
      input: JSON.stringify({ learnerAnalytics: analytics }),
      text: {
        format: {
          type: "json_schema",
          name: "learning_analysis",
          strict: true,
          schema: analysisSchema,
        },
      },
    });

    const parsedAnalysis: unknown = JSON.parse(response.output_text);

    if (!isAiLearningAnalysis(parsedAnalysis)) {
      return Response.json(
        { error: "AI analysis returned an unexpected response." },
        { status: 502 }
      );
    }

    analysis = parsedAnalysis;
  } catch {
    return Response.json(
      { error: "AI learning analysis is temporarily unavailable." },
      { status: 502 }
    );
  }

  const { error: saveError } = await supabase.from("ai_analyses").insert({
    user_id: user.id,
    analysis_json: analysis,
    based_on_latest_attempt_at: latestAttemptAt,
  });

  if (saveError) {
    if (saveError.code === "23505") {
      const { data: concurrentRow, error: concurrentError } = await supabase
        .from("ai_analyses")
        .select("analysis_json")
        .eq("user_id", user.id)
        .eq("based_on_latest_attempt_at", latestAttemptAt)
        .maybeSingle();

      if (
        !concurrentError &&
        isAiLearningAnalysis(concurrentRow?.analysis_json)
      ) {
        return analysisResponse(concurrentRow.analysis_json, "cache");
      }
    }

    return Response.json(
      { error: "AI analysis was generated but could not be saved." },
      { status: 500 }
    );
  }

  return analysisResponse(analysis, "fresh");
}

function analysisResponse(
  analysis: AiLearningAnalysis,
  source: AiLearningAnalysisResponse["source"]
) {
  const response: AiLearningAnalysisResponse = { ...analysis, source };
  return Response.json(response);
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

function isAiLearningAnalysis(value: unknown): value is AiLearningAnalysis {
  if (!value || typeof value !== "object") return false;

  const analysis = value as Record<string, unknown>;
  return (
    typeof analysis.summary === "string" &&
    isStringArray(analysis.strengths) &&
    isStringArray(analysis.areasToImprove) &&
    isStringArray(analysis.recommendedNextSteps)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
