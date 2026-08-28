import type { Course } from "@/types/course";

export const primary3Mathematics: Course = {
  id: "primary-3-mathematics",
  title: "Primary 3 Mathematics",
  description:
    "Build confidence with clear explanations, worked examples, and focused practice.",
  level: { id: "primary-3", label: "Primary 3", kind: "primary" },
  subject: { id: "mathematics", label: "Mathematics" },
  category: { id: "core-curriculum", label: "Core curriculum" },
  curriculum: {
    id: "singapore-primary-mathematics",
    title: "Singapore Primary Mathematics",
    jurisdiction: "Singapore",
  },
  status: "published",
  provenance: {
    origin: "original",
    authors: ["LearnAI curriculum team"],
    curriculumReferences: ["Singapore Primary Mathematics curriculum"],
    aiAssisted: false,
    reviewer: "LearnAI curriculum review",
    reviewedAt: "2026-08-28",
  },
  modules: [
    {
      id: "whole-numbers",
      title: "Whole Numbers",
      description:
        "Understand how whole numbers are connected and use them to solve problems.",
      status: "published",
      provenance: {
        origin: "original",
        authors: ["LearnAI curriculum team"],
        curriculumReferences: ["Singapore Primary Mathematics curriculum"],
        aiAssisted: false,
        reviewer: "LearnAI curriculum review",
        reviewedAt: "2026-08-28",
      },
      lessons: [
        {
          id: "comparison-and-change-problems",
          title: "Comparison and Change Problems",
          description:
            "Learn to compare quantities and follow how an amount changes.",
          taxonomy: {
            topicId: "whole-numbers",
            skillId: "comparison-and-change-problems",
          },
          status: "published",
          provenance: {
            origin: "original",
            authors: ["LearnAI curriculum team"],
            curriculumReferences: ["Singapore Primary Mathematics curriculum"],
            aiAssisted: false,
            reviewer: "LearnAI curriculum review",
            reviewedAt: "2026-08-28",
          },
          learningObjectives: [
            "Identify the two quantities being compared.",
            "Find an unknown starting amount, change, or final amount.",
            "Choose addition or subtraction and explain why it works.",
          ],
          explanationSections: [
            {
              id: "compare-quantities",
              title: "Compare two quantities",
              paragraphs: [
                "Comparison problems tell us how much more or how much less one quantity is than another. A simple bar model can help us see the difference.",
              ],
            },
            {
              id: "track-a-change",
              title: "Track what changes",
              paragraphs: [
                "Change problems have a starting amount, a change, and a final amount. Mark the unknown part, then decide whether to add or subtract.",
              ],
            },
          ],
          workedExamples: [
            {
              id: "sticker-comparison",
              title: "Comparing sticker collections",
              problem:
                "Maya has 36 stickers. She has 9 more stickers than Ravi. How many stickers does Ravi have?",
              steps: [
                "Maya has the greater quantity.",
                "The difference between their collections is 9.",
                "Subtract the difference from Maya's amount: 36 - 9 = 27.",
              ],
              answer: "Ravi has 27 stickers.",
            },
          ],
          keyPoints: [
            "Underline words such as more, fewer, gained, or left.",
            "Draw bars of different lengths when comparing quantities.",
            "Check that your answer makes sense in the story.",
          ],
          practice: {
            targetedPracticeSkillId: "comparison-and-change-problems",
          },
          difficulty: "standard",
          estimatedDurationMinutes: 10,
        },
      ],
    },
  ],
};
