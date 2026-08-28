import assert from "node:assert/strict";
import test from "node:test";
import { comparisonAndChangeProblemsTutorContent as content } from "@/data/tutor/comparisonAndChangeProblems";
import { calculateCoreMastery } from "@/lib/tutor/mastery";
import { createTutorSession, transitionTutor } from "@/lib/tutor/stateMachine";

test("scenario 1: repeated misconception gets conceptual help, then requires fresh independent evidence", () => {
  let session = createTutorSession(content);

  let result = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 45 } }, content);
  assert.equal(result.intervention.kind, "TRY_AGAIN");
  assert.equal(result.intervention.hint?.level, 1);
  session = result.session;

  result = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 45 } }, content);
  assert.equal(result.session.observation, "CONCEPTUAL_MISCONCEPTION");
  assert.equal(result.intervention.hint?.level, 3);
  session = result.session;

  result = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 27 } }, content);
  assert.equal(result.session.attempts.at(-1)?.assistance, "SUBSTANTIAL");
  assert.equal(result.session.attempts.at(-1)?.masteryEligible, false);
  assert.equal(result.session.phase, "INDEPENDENT_CHECK");
  assert.notEqual(result.session.active.questionId, "cc-basic-maya-ravi");
  assert.equal(result.session.coreMastery.categories.BASIC_RELATIONSHIP, false);
});

test("scenario 2: distinct independent basic, reversed, and transfer evidence establishes mastery; challenge remains separate", () => {
  let session = createTutorSession(content);
  session = submitCorrect(session, 27);
  assert.equal(session.coreMastery.categories.BASIC_RELATIONSHIP, true);
  assert.equal(session.active.questionId, "cc-reversed-check");

  session = submitCorrect(session, 36);
  assert.equal(session.coreMastery.categories.REVERSED_RELATIONSHIP, true);
  assert.equal(session.active.questionId, "cc-transfer-change");

  session = submitCorrect(session, 52);
  assert.equal(session.coreMastery.demonstrated, true);
  assert.equal(session.phase, "READY_FOR_CHALLENGE");

  session = transitionTutor(session, { type: "START_CHALLENGE" }, content).session;
  assert.equal(session.phase, "CHALLENGE");
  assert.equal(session.active.questionId, "cc-challenge-equal-change");

  const failedChallenge = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 145 } }, content).session;
  assert.equal(failedChallenge.coreMastery.demonstrated, true);
  assert.equal(failedChallenge.challenge.attempted, true);
  assert.equal(failedChallenge.challenge.correct, false);
  assert.equal(calculateCoreMastery(failedChallenge.attempts).demonstrated, true);
});

test("scenario 3: genuine stuck signal can move directly to conceptual/guided support and preserves reasoning progress", () => {
  let session = createTutorSession(content);
  let result = transitionTutor(session, { type: "REQUEST_HELP", signal: "STUCK" }, content);
  assert.equal(result.session.observation, "STUCK");
  assert.equal(result.intervention.hint?.level, 3);
  assert.equal(result.session.phase, "GUIDED_LEARNING");
  session = result.session;

  result = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 29, milestones: ["RELATIONSHIP_UNDERSTOOD", "OPERATION_SELECTED"] } }, content);
  assert.equal(result.session.observation, "COMPUTATION_ERROR");
  assert.match(result.intervention.text ?? "", /operation now matches/);
  session = result.session;

  result = transitionTutor(session, { type: "REQUEST_HELP", signal: "LEARN_WITH_ME" }, content);
  assert.equal(result.intervention.hint?.level, 6);
  session = result.session;

  result = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 27 } }, content);
  assert.equal(result.session.attempts.at(-1)?.masteryEligible, false);
  assert.equal(result.session.phase, "INDEPENDENT_CHECK");
});

test("scenario 4: repeated answer seeking can permit answer-bearing help only after evidence, permanently marking the question assisted", () => {
  let session = createTutorSession(content);
  session = transitionTutor(session, {
    type: "SUBMIT_RESPONSE",
    response: { answer: 45, reasoning: "I added 9 because the question says more." },
  }, content).session;

  let result = transitionTutor(session, { type: "REQUEST_HELP", signal: "ANSWER_SEEKING" }, content);
  assert.ok((result.intervention.hint?.level ?? 0) < 7);
  assert.equal(result.session.active.answerBearingAssistance, false);
  session = result.session;

  result = transitionTutor(session, { type: "REQUEST_HELP", signal: "ANSWER_SEEKING" }, content);
  assert.equal(result.intervention.kind, "ANSWER_BEARING");
  assert.equal(result.intervention.hint?.level, 7);
  assert.equal(result.session.active.answerBearingAssistance, true);
  assert.equal(result.session.active.masteryEligible, false);
  session = result.session;

  result = transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer: 27 } }, content);
  assert.equal(result.session.attempts.at(-1)?.assistance, "ANSWER_BEARING");
  assert.equal(result.session.attempts.at(-1)?.masteryEligible, false);
  assert.equal(result.session.phase, "INDEPENDENT_CHECK");
});

test("scenario 5: frustration requires explicit evidence, restores agency, and stopping preserves prior mastery", () => {
  let session = createTutorSession(content);
  session = submitCorrect(session, 27);
  assert.equal(session.coreMastery.categories.BASIC_RELATIONSHIP, true);

  let result = transitionTutor(session, { type: "REPORT_FRUSTRATION" }, content);
  assert.equal(result.session.observation, "FRUSTRATED");
  assert.deepEqual(result.intervention.choices, ["Try an easier one", "Learn it with me", "Take a break"]);
  session = result.session;

  result = transitionTutor(session, { type: "REPORT_FRUSTRATION", choice: "BREAK" }, content);
  assert.equal(result.session.phase, "PAUSED");
  assert.equal(result.session.coreMastery.categories.BASIC_RELATIONSHIP, true);
});

test("light assistance is non-independent while substantial help requires a fresh check", () => {
  let session = createTutorSession(content);
  session = transitionTutor(session, { type: "REQUEST_HELP", signal: "HELP" }, content).session;
  assert.ok(session.active.highestHintLevel <= 2);
  session = submitCorrect(session, 27);
  assert.equal(session.attempts.at(-1)?.assistance, "LIGHT");
  assert.equal(session.attempts.at(-1)?.masteryEligible, false);
  assert.equal(session.phase, "INDEPENDENT_CHECK");
});

test("Kai Wisdom is contextual, sparse, and never interrupts independent thinking", async () => {
  const { selectKaiWisdom } = await import("@/lib/tutor/wisdom");
  const session = createTutorSession(content);
  assert.equal(selectKaiWisdom(session, "PERSISTED_AFTER_HINT", "INDEPENDENT_THINKING"), undefined);
  assert.ok(selectKaiWisdom({ ...session, phase: "READY_FOR_CHALLENGE", turn: 5 }, "REACHED_CHALLENGE", "READY_FOR_CHALLENGE"));
  assert.equal(selectKaiWisdom({ ...session, phase: "READY_FOR_CHALLENGE", turn: 5, usedWisdomIds: ["challenge"] }, "REACHED_CHALLENGE", "READY_FOR_CHALLENGE"), undefined);
});

function submitCorrect(session: ReturnType<typeof createTutorSession>, answer: number) {
  return transitionTutor(session, { type: "SUBMIT_RESPONSE", response: { answer } }, content).session;
}
