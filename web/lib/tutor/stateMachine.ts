import { evaluateAnswer } from "@/lib/tutor/answerEvaluator";
import { selectHint } from "@/lib/tutor/hintSelector";
import { calculateCoreMastery } from "@/lib/tutor/mastery";
import { detectKnownMisconception } from "@/lib/tutor/misconceptionDetector";
import { selectChallengeQuestion, selectNextCoreQuestion } from "@/lib/tutor/questionSelector";
import { selectKaiWisdom, type WisdomTrigger } from "@/lib/tutor/wisdom";
import type {
  ActiveQuestionState,
  AssistanceClass,
  HintLevel,
  LearnerObservation,
  TutorAction,
  TutorAttempt,
  TutorContentPack,
  TutorIntervention,
  TutorQuestion,
  TutorSession,
  TutorTransition,
} from "@/types/tutor";

export function createTutorSession(content: TutorContentPack, initialQuestionId = "cc-basic-maya-ravi"): TutorSession {
  requireQuestion(content, initialQuestionId);
  return {
    phase: "INDEPENDENT_THINKING",
    observation: "UNCLEAR",
    courseId: content.courseId,
    lessonId: content.lessonId,
    topicId: content.topicId,
    skillId: content.skillId,
    active: createActiveQuestion(initialQuestionId),
    seenQuestionIds: [initialQuestionId],
    attempts: [],
    coreMastery: calculateCoreMastery([]),
    challenge: { attempted: false },
    answerSeekingCount: 0,
    turn: 0,
    usedWisdomIds: [],
  };
}

export function transitionTutor(
  current: TutorSession,
  action: TutorAction,
  content: TutorContentPack
): TutorTransition {
  assertSessionMatchesContent(current, content);
  const session = cloneSession(current);
  session.turn += 1;

  switch (action.type) {
    case "SUBMIT_RESPONSE":
      return submitResponse(session, action.response, content);
    case "REQUEST_HELP":
      return requestHelp(session, action.signal, content);
    case "REPORT_FRUSTRATION":
      return handleFrustration(session, action.choice, content);
    case "START_CHALLENGE":
      return startChallenge(session, content);
  }
}

function submitResponse(
  session: TutorSession,
  response: Parameters<typeof evaluateAnswer>[1],
  content: TutorContentPack
): TutorTransition {
  const question = requireQuestion(content, session.active.questionId);
  const evaluation = evaluateAnswer(question, response, session.active.responses);
  const misconception = detectKnownMisconception(question, response, content.misconceptions);
  const priorSameMisconception = Boolean(
    misconception && session.active.activeMisconceptionId === misconception.id
  );
  const observation: LearnerObservation = misconception
    ? "CONCEPTUAL_MISCONCEPTION"
    : evaluation.observation;
  const assistance = classifyAssistance(session.active.highestHintLevel);
  const attempt: TutorAttempt = {
    questionId: question.id,
    purpose: question.purpose,
    ...(question.evidenceCategory ? { evidenceCategory: question.evidenceCategory } : {}),
    response,
    correct: evaluation.correct,
    observation,
    milestones: evaluation.milestones,
    highestHintLevel: session.active.highestHintLevel,
    assistance,
    masteryEligible: session.active.masteryEligible && assistance === "INDEPENDENT",
    ...(misconception ? { misconceptionId: misconception.id } : {}),
  };
  session.active.responses.push(response);
  if (misconception) session.active.activeMisconceptionId = misconception.id;
  session.attempts.push(attempt);
  session.observation = observation;

  if (!evaluation.correct) {
    if (question.purpose === "CHALLENGE") {
      session.challenge = { attempted: true, correct: false };
    }
    if (misconception && !priorSameMisconception) {
      const hint = requireHint(content, "try-again");
      applyHint(session.active, hint.level, hint.id, hint.answerBearing);
      session.phase = "INDEPENDENT_THINKING";
      return { session, intervention: { kind: "TRY_AGAIN", text: hint.text, hint } };
    }
    if (misconception) {
      session.phase = "DIAGNOSIS";
      const hint = selectHint(content, question.hintIds, {
        signal: "HELP",
        responses: session.active.responses,
        currentHintLevel: session.active.highestHintLevel,
        answerSeekingCount: session.answerSeekingCount,
        misconception,
      });
      applyHint(session.active, hint.level, hint.id, hint.answerBearing);
      return { session, intervention: { kind: "HINT", text: hint.text, hint } };
    }
    session.phase = evaluation.madeProgress ? "INDEPENDENT_THINKING" : "DIAGNOSIS";
    return {
      session,
      intervention: evaluation.madeProgress
        ? { kind: "NONE", text: progressMessage(evaluation.milestones) }
        : { kind: "TRY_AGAIN", text: "Show me one part you understand or tell me where your thinking stopped." },
    };
  }

  if (question.purpose === "CHALLENGE") {
    session.challenge = { attempted: true, correct: true };
    session.phase = "COMPLETE";
    return { session, intervention: { kind: "COMPLETE", text: "Correct. You solved the challenge." } };
  }

  session.coreMastery = calculateCoreMastery(session.attempts);
  const hadAssistance = assistance !== "INDEPENDENT";
  if (session.coreMastery.demonstrated) {
    session.phase = "READY_FOR_CHALLENGE";
    return withWisdom(session, { kind: "COMPLETE", text: "You have shown the basic, reversed, and transfer relationships independently." }, "INDEPENDENT_TRANSFER_SUCCESS");
  }

  const next = selectNextCoreQuestion(session, content);
  if (!next) {
    session.phase = "COMPLETE";
    return { session, intervention: { kind: "COMPLETE", text: "There is not enough fresh reviewed content to complete the independent check." } };
  }
  moveToQuestion(session, next, hadAssistance ? "INDEPENDENT_CHECK" : "INDEPENDENT_THINKING");
  return {
    session,
    intervention: {
      kind: "NONE",
      text: hadAssistance
        ? "You learned from that problem. Now try this fresh one independently."
        : "Correct. Now show that you can use the relationship when the problem changes.",
    },
  };
}

function requestHelp(
  session: TutorSession,
  signal: "HELP" | "STUCK" | "ANSWER_SEEKING" | "LEARN_WITH_ME",
  content: TutorContentPack
): TutorTransition {
  const question = requireQuestion(content, session.active.questionId);
  if (signal === "ANSWER_SEEKING") {
    session.answerSeekingCount += 1;
    session.observation = "ANSWER_SEEKING";
  } else if (signal === "STUCK") session.observation = "STUCK";

  const misconception = content.misconceptions.find((item) => item.id === session.active.activeMisconceptionId);
  const hint = selectHint(content, question.hintIds, {
    signal,
    responses: session.active.responses,
    currentHintLevel: session.active.highestHintLevel,
    answerSeekingCount: session.answerSeekingCount,
    ...(misconception ? { misconception } : {}),
  });

  // Answer-bearing status is made permanent before the hint is returned.
  applyHint(session.active, hint.level, hint.id, hint.answerBearing);
  session.phase = hint.level >= 3 ? "GUIDED_LEARNING" : "DIAGNOSIS";
  return {
    session,
    intervention: {
      kind: hint.level === 8 ? "FULL_EXPLANATION" : hint.level === 7 ? "ANSWER_BEARING" : "HINT",
      text: hint.text,
      hint,
    },
  };
}

function handleFrustration(
  session: TutorSession,
  choice: "EASIER" | "LEARN_WITH_ME" | "BREAK" | undefined,
  content: TutorContentPack
): TutorTransition {
  session.observation = "FRUSTRATED";
  if (!choice) {
    return {
      session,
      intervention: { kind: "CHOICES", text: "This one is harder. Choose what would help now.", choices: ["Try an easier one", "Learn it with me", "Take a break"] },
    };
  }
  if (choice === "BREAK") {
    session.phase = "PAUSED";
    return { session, intervention: { kind: "COMPLETE", text: "We can stop here and return later." } };
  }
  if (choice === "LEARN_WITH_ME") return requestHelp(session, "LEARN_WITH_ME", content);
  session.phase = "GUIDED_LEARNING";
  return { session, intervention: { kind: "NONE", text: "Let's reduce the next step: first identify who has more." } };
}

function startChallenge(session: TutorSession, content: TutorContentPack): TutorTransition {
  const challenge = selectChallengeQuestion(session, content);
  if (!challenge) return { session, intervention: { kind: "COMPLETE", text: "No reviewed challenge is available yet." } };
  moveToQuestion(session, challenge, "CHALLENGE");
  session.challenge = { attempted: true };
  return withWisdom(session, { kind: "NONE", text: "Here is a stretch problem. It will not change the core mastery you have already shown." }, "REACHED_CHALLENGE");
}

function withWisdom(session: TutorSession, intervention: TutorIntervention, trigger: WisdomTrigger): TutorTransition {
  const wisdom = selectKaiWisdom(session, trigger, session.phase);
  if (!wisdom) return { session, intervention };
  session.usedWisdomIds.push(wisdom.id);
  session.lastWisdomTurn = session.turn;
  return { session, intervention: { ...intervention, wisdom: wisdom.text } };
}

function moveToQuestion(session: TutorSession, question: TutorQuestion, phase: TutorSession["phase"]) {
  session.phase = phase;
  session.observation = "UNCLEAR";
  session.active = createActiveQuestion(question.id);
  session.seenQuestionIds.push(question.id);
}

function createActiveQuestion(questionId: string): ActiveQuestionState {
  return { questionId, responses: [], highestHintLevel: 0, hintIdsUsed: [], masteryEligible: true, answerBearingAssistance: false };
}

function applyHint(active: ActiveQuestionState, level: Exclude<HintLevel, 0>, hintId: string, answerBearing: boolean) {
  active.highestHintLevel = Math.max(active.highestHintLevel, level) as HintLevel;
  if (!active.hintIdsUsed.includes(hintId)) active.hintIdsUsed.push(hintId);
  if (level >= 3) active.masteryEligible = false;
  if (answerBearing || level >= 7) {
    active.answerBearingAssistance = true;
    active.masteryEligible = false;
  }
}

function classifyAssistance(level: HintLevel): AssistanceClass {
  if (level === 0) return "INDEPENDENT";
  if (level <= 2) return "LIGHT";
  if (level <= 6) return "SUBSTANTIAL";
  return "ANSWER_BEARING";
}

function requireQuestion(content: TutorContentPack, id: string) {
  const question = content.questions.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown reviewed tutor question: ${id}`);
  return question;
}

function requireHint(content: TutorContentPack, id: string) {
  const hint = content.hints.find((item) => item.id === id);
  if (!hint) throw new Error(`Unknown reviewed tutor hint: ${id}`);
  return hint;
}

function progressMessage(milestones: string[]) {
  if (milestones.includes("OPERATION_SELECTED")) return "Your operation now matches the relationship. Check the calculation next.";
  return "Your reasoning has moved forward. Keep going from that step.";
}

function assertSessionMatchesContent(session: TutorSession, content: TutorContentPack) {
  if (session.courseId !== content.courseId || session.lessonId !== content.lessonId || session.skillId !== content.skillId) {
    throw new Error("Tutor session does not match the reviewed content pack");
  }
}

function cloneSession(session: TutorSession): TutorSession {
  return structuredClone(session);
}
