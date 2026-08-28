import type { TutorPhase, TutorSession } from "@/types/tutor";

export type WisdomTrigger = "RECOVERED_AFTER_ERROR" | "INDEPENDENT_TRANSFER_SUCCESS" | "PERSISTED_AFTER_HINT" | "REACHED_CHALLENGE";

const messages: Record<WisdomTrigger, { id: string; text: string }> = {
  RECOVERED_AFTER_ERROR: { id: "recovery", text: "A mistake is useful when it tells us what to practise next." },
  INDEPENDENT_TRANSFER_SUCCESS: { id: "transfer", text: "Understanding the idea helps you solve the next problem even when it looks different." },
  PERSISTED_AFTER_HINT: { id: "persistence", text: "Help is for learning. A fresh independent attempt shows what you can now do yourself." },
  REACHED_CHALLENGE: { id: "challenge", text: "The right challenge should make you think; it does not erase what you already know." },
};

export function selectKaiWisdom(session: TutorSession, trigger: WisdomTrigger, phase: TutorPhase) {
  const message = messages[trigger];
  if (phase === "INDEPENDENT_THINKING" || phase === "INDEPENDENT_CHECK") return undefined;
  if (session.usedWisdomIds.includes(message.id)) return undefined;
  if (session.lastWisdomTurn !== undefined && session.turn - session.lastWisdomTurn < 4) return undefined;
  return message;
}
