export type QuestionAttemptForAnalytics = {
  topic: string | null;
  skill: string | null;
  is_correct: boolean;
};

export type MasteryArea = {
  name: string;
  attempted: number;
  correct: number;
  accuracy: number;
};

type MasteryDimension = "topic" | "skill";

export function calculateMastery(
  attempts: QuestionAttemptForAnalytics[],
  dimension: MasteryDimension
): MasteryArea[] {
  const areas = new Map<string, { attempted: number; correct: number }>();

  for (const attempt of attempts) {
    const name = attempt[dimension]?.trim() || "Uncategorised";
    const current = areas.get(name) ?? { attempted: 0, correct: 0 };

    current.attempted += 1;
    if (attempt.is_correct) current.correct += 1;
    areas.set(name, current);
  }

  return Array.from(areas, ([name, totals]) => ({
    name,
    attempted: totals.attempted,
    correct: totals.correct,
    accuracy: Math.round((totals.correct / totals.attempted) * 100),
  })).sort((first, second) => {
    return (
      first.accuracy - second.accuracy ||
      second.attempted - first.attempted ||
      first.name.localeCompare(second.name)
    );
  });
}
