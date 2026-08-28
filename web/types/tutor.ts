export type TutorPhase =
  | "INDEPENDENT_THINKING"
  | "DIAGNOSIS"
  | "GUIDED_LEARNING"
  | "INDEPENDENT_CHECK"
  | "READY_FOR_CHALLENGE"
  | "CHALLENGE"
  | "PAUSED"
  | "COMPLETE";

export type LearnerObservation =
  | "CORRECT"
  | "CARELESS_ERROR"
  | "COMPUTATION_ERROR"
  | "CONCEPTUAL_MISCONCEPTION"
  | "MISREADING"
  | "PRODUCTIVE_STRUGGLE"
  | "STUCK"
  | "FRUSTRATED"
  | "ANSWER_SEEKING"
  | "UNCLEAR";

export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type AssistanceClass = "INDEPENDENT" | "LIGHT" | "SUBSTANTIAL" | "ANSWER_BEARING";
export type EvidenceCategory = "BASIC_RELATIONSHIP" | "REVERSED_RELATIONSHIP" | "TRANSFER";
export type QuestionPurpose = "CORE" | "TRANSFER" | "CHALLENGE";

export type ReasoningMilestone =
  | "RELATIONSHIP_UNDERSTOOD"
  | "LARGER_SMALLER_IDENTIFIED"
  | "OPERATION_SELECTED"
  | "REPRESENTATION_CORRECT"
  | "INTERMEDIATE_RESULT_CORRECT"
  | "FINAL_RESULT_CORRECT";

export type LearnerResponse = {
  answer?: number;
  reasoning?: string;
  selectedDiagnosisId?: string;
  milestones?: ReasoningMilestone[];
};

export type TutorHint = {
  id: string;
  level: Exclude<HintLevel, 0>;
  text: string;
  answerBearing: boolean;
  representationId?: string;
};

export type TutorRepresentation = {
  id: string;
  kind: "BAR_MODEL" | "CHANGE_MODEL";
  description: string;
  labels: string[];
};

export type TutorQuestion = {
  id: string;
  sourceQuestionId?: string;
  prompt: string;
  answer: number;
  purpose: QuestionPurpose;
  evidenceCategory?: EvidenceCategory;
  difficulty: "FOUNDATION" | "CORE" | "TRANSFER" | "CHALLENGE";
  variantTags: string[];
  hintIds: string[];
  misconceptionIds: string[];
  reviewedFullExplanation?: string;
};

export type KnownMisconception = {
  id: string;
  skillId: string;
  label: string;
  diagnosticPrompt: string;
  matches: Array<{ questionId: string; incorrectAnswers: number[] }>;
  recommendedHintIds: string[];
};

export type TutorContentPack = {
  id: string;
  courseId: string;
  lessonId: string;
  topicId: string;
  skillId: string;
  objective: string;
  questions: TutorQuestion[];
  hints: TutorHint[];
  representations: TutorRepresentation[];
  misconceptions: KnownMisconception[];
};

export type TutorAttempt = {
  questionId: string;
  purpose: QuestionPurpose;
  evidenceCategory?: EvidenceCategory;
  response: LearnerResponse;
  correct: boolean;
  observation: LearnerObservation;
  milestones: ReasoningMilestone[];
  highestHintLevel: HintLevel;
  assistance: AssistanceClass;
  masteryEligible: boolean;
  misconceptionId?: string;
};

export type ActiveQuestionState = {
  questionId: string;
  responses: LearnerResponse[];
  highestHintLevel: HintLevel;
  hintIdsUsed: string[];
  masteryEligible: boolean;
  answerBearingAssistance: boolean;
  activeMisconceptionId?: string;
};

export type CoreMasteryResult = {
  demonstrated: boolean;
  categories: Record<EvidenceCategory, boolean>;
};

export type TutorSession = {
  phase: TutorPhase;
  observation: LearnerObservation;
  courseId: string;
  lessonId: string;
  topicId: string;
  skillId: string;
  active: ActiveQuestionState;
  seenQuestionIds: string[];
  attempts: TutorAttempt[];
  coreMastery: CoreMasteryResult;
  challenge: { attempted: boolean; correct?: boolean };
  answerSeekingCount: number;
  turn: number;
  usedWisdomIds: string[];
  lastWisdomTurn?: number;
};

export type HelpSignal = "HELP" | "STUCK" | "ANSWER_SEEKING" | "LEARN_WITH_ME";

export type TutorAction =
  | { type: "SUBMIT_RESPONSE"; response: LearnerResponse }
  | { type: "REQUEST_HELP"; signal: HelpSignal }
  | { type: "REPORT_FRUSTRATION"; choice?: "EASIER" | "LEARN_WITH_ME" | "BREAK" }
  | { type: "START_CHALLENGE" };

export type TutorIntervention = {
  kind: "NONE" | "TRY_AGAIN" | "HINT" | "ANSWER_BEARING" | "FULL_EXPLANATION" | "CHOICES" | "COMPLETE";
  text?: string;
  hint?: TutorHint;
  choices?: string[];
  wisdom?: string;
};

export type TutorTransition = {
  session: TutorSession;
  intervention: TutorIntervention;
};
