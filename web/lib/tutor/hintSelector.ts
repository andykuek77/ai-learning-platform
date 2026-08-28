import type { HelpSignal, KnownMisconception, LearnerResponse, TutorContentPack, TutorHint } from "@/types/tutor";

type HintEvidence = {
  signal: HelpSignal;
  responses: LearnerResponse[];
  currentHintLevel: number;
  answerSeekingCount: number;
  misconception?: KnownMisconception;
};

export function selectHint(content: TutorContentPack, questionHintIds: string[], evidence: HintEvidence): TutorHint {
  const available = content.hints.filter((hint) => questionHintIds.includes(hint.id));
  const meaningfulAttempts = evidence.responses.filter(hasMeaningfulAttempt).length;
  const latest = evidence.responses.at(-1);
  const noRecentProgress = evidence.responses.length >= 2 &&
    (latest?.milestones?.length ?? 0) <= (evidence.responses.at(-2)?.milestones?.length ?? 0);

  let targetLevel: number;
  if (evidence.signal === "LEARN_WITH_ME") targetLevel = 6;
  else if (evidence.signal === "STUCK") targetLevel = evidence.misconception ? 5 : 3;
  else if (evidence.signal === "ANSWER_SEEKING") {
    const sustained = evidence.answerSeekingCount >= 2 && (meaningfulAttempts > 0 || noRecentProgress);
    targetLevel = sustained ? 7 : 3;
  } else if (evidence.misconception) targetLevel = 3;
  else if (noRecentProgress) targetLevel = 4;
  else targetLevel = evidence.responses.length === 0 ? 2 : 1;

  return closestPermittedHint(available, Math.max(targetLevel, evidence.currentHintLevel));
}

function hasMeaningfulAttempt(response: LearnerResponse) {
  return response.answer !== undefined || Boolean(response.reasoning?.trim()) || (response.milestones?.length ?? 0) > 0;
}

function closestPermittedHint(hints: TutorHint[], targetLevel: number) {
  const ordered = [...hints].sort((first, second) => first.level - second.level);
  const atOrAbove = ordered.find((hint) => hint.level >= targetLevel);
  const selected = atOrAbove ?? ordered.at(-1);
  if (!selected) throw new Error("Reviewed tutor content has no permitted hint for this question");
  return selected;
}
