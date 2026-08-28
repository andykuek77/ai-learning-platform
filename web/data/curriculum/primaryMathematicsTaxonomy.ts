import type {
  CurriculumSkill,
  CurriculumTopic,
} from "@/types/curriculum";

// Labels intentionally match the existing question JSON and persisted attempt
// taxonomy. Stable IDs are used by curriculum content; assessment compatibility
// is maintained through these canonical labels.
export const primaryMathematicsTopics = [
  { id: "whole-numbers", label: "Whole Numbers", subjectId: "mathematics" },
  { id: "fractions", label: "Fractions", subjectId: "mathematics" },
  { id: "measurement", label: "Measurement", subjectId: "mathematics" },
  { id: "geometry", label: "Geometry", subjectId: "mathematics" },
  { id: "patterns", label: "Patterns", subjectId: "mathematics" },
  { id: "data-and-sets", label: "Data and Sets", subjectId: "mathematics" },
] as const satisfies readonly CurriculumTopic[];

export const primaryMathematicsSkills = [
  { id: "comparison-and-change-problems", label: "Comparison and change problems", topicId: "whole-numbers" },
  { id: "consecutive-number-relationships", label: "Consecutive number relationships", topicId: "whole-numbers" },
  { id: "division-with-remainders", label: "Division with remainders", topicId: "whole-numbers" },
  { id: "multiplication-and-division-in-context", label: "Multiplication and division in context", topicId: "whole-numbers" },
  { id: "multi-step-addition-and-subtraction", label: "Multi-step addition and subtraction", topicId: "whole-numbers" },
  { id: "two-quantity-problems", label: "Two-quantity problems", topicId: "whole-numbers" },
  { id: "compare-and-order-fractions", label: "Compare and order fractions", topicId: "fractions" },
  { id: "fractions-of-a-set", label: "Fractions of a set", topicId: "fractions" },
  { id: "capacity-problems", label: "Capacity problems", topicId: "measurement" },
  { id: "length-problems", label: "Length problems", topicId: "measurement" },
  { id: "mass-problems", label: "Mass problems", topicId: "measurement" },
  { id: "money-calculations", label: "Money calculations", topicId: "measurement" },
  { id: "time-and-duration", label: "Time and duration", topicId: "measurement" },
  { id: "perimeter-of-rectangles-and-squares", label: "Perimeter of rectangles and squares", topicId: "geometry" },
  { id: "growing-number-patterns", label: "Growing number patterns", topicId: "patterns" },
  { id: "repeating-patterns", label: "Repeating patterns", topicId: "patterns" },
  { id: "overlapping-groups", label: "Overlapping groups", topicId: "data-and-sets" },
] as const satisfies readonly CurriculumSkill[];

