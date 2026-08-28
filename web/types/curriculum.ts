export type ContentStatus = "draft" | "reviewed" | "approved" | "published";

export type ContentOrigin =
  | "original"
  | "adapted"
  | "licensed"
  | "commissioned";

export type ContentProvenance = {
  origin: ContentOrigin;
  authors: string[];
  curriculumReferences: string[];
  aiAssisted: boolean;
  reviewer?: string;
  reviewedAt?: string;
  internalNotes?: string;
};

export type GovernedContent = {
  status: ContentStatus;
  provenance: ContentProvenance;
};

export type CurriculumLevelKind =
  | "primary"
  | "secondary"
  | "programme"
  | "open";

export type CurriculumLevel = {
  id: string;
  label: string;
  kind: CurriculumLevelKind;
};

export type CurriculumSubject = {
  id: string;
  label: string;
};

export type CurriculumProgramme = {
  id: string;
  label: string;
};

export type CurriculumCategory = {
  id: string;
  label: string;
};

export type CurriculumReference = {
  id: string;
  title: string;
  jurisdiction?: string;
  version?: string;
};

export type CurriculumTopic = {
  id: string;
  label: string;
  subjectId: string;
};

export type CurriculumSkill = {
  id: string;
  label: string;
  topicId: string;
};

export type LessonTaxonomyReference = {
  topicId: string;
  skillId: string;
};

export type LessonDifficulty =
  | "foundation"
  | "standard"
  | "advanced"
  | "challenge";

export type LessonPracticePlan = {
  targetedPracticeSkillId: string;
  guidedPracticeSkillId?: string;
  independentPracticeSkillId?: string;
};

