import type { EvidenceCategory, TutorContentPack, TutorQuestion, TutorSession } from "@/types/tutor";

const coreOrder: EvidenceCategory[] = ["BASIC_RELATIONSHIP", "REVERSED_RELATIONSHIP", "TRANSFER"];

export function selectNextCoreQuestion(session: TutorSession, content: TutorContentPack): TutorQuestion | undefined {
  for (const category of coreOrder) {
    if (session.coreMastery.categories[category]) continue;
    const candidate = content.questions.find((question) =>
      question.evidenceCategory === category &&
      question.purpose !== "CHALLENGE" &&
      !session.seenQuestionIds.includes(question.id) &&
      isMeaningfullyDifferent(question, session, content)
    );
    if (candidate) return candidate;
  }
  return undefined;
}

export function selectChallengeQuestion(session: TutorSession, content: TutorContentPack) {
  if (!session.coreMastery.demonstrated) return undefined;
  return content.questions.find((question) => question.purpose === "CHALLENGE" && !session.seenQuestionIds.includes(question.id));
}

function isMeaningfullyDifferent(candidate: TutorQuestion, session: TutorSession, content: TutorContentPack) {
  if (candidate.evidenceCategory !== "TRANSFER") return true;
  const previous = content.questions.filter((question) => session.seenQuestionIds.includes(question.id));
  return previous.every((question) => overlap(question.variantTags, candidate.variantTags) < 0.75);
}

function overlap(first: string[], second: string[]) {
  const union = new Set([...first, ...second]);
  const shared = first.filter((tag) => second.includes(tag)).length;
  return union.size === 0 ? 0 : shared / union.size;
}
