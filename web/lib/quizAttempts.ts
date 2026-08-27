import { supabase } from "@/lib/supabase";
import type { Quiz, QuizAnswers } from "@/types/quiz";

type SaveQuizAttemptParams = {
  quiz: Quiz;
  answers: QuizAnswers;
  score: number;
  totalMarks: number;
};

export async function saveQuizAttempt({
  quiz,
  answers,
  score,
  totalMarks,
}: SaveQuizAttemptParams): Promise<string> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return "Result calculated, but your session is no longer valid. Please log in again.";
    }

    const { error: quizError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_name: quiz.id,
        score,
        total_marks: totalMarks,
        questions_answered: Object.keys(answers).length,
      });

    if (quizError) {
      return "Could not save overall result: " + quizError.message;
    }

    const questionRows = quiz.questions.map((question) => ({
      user_id: user.id,
      quiz_name: quiz.id,
      question_id: question.id,
      selected_option: answers[question.id] ?? null,
      correct_option: question.correctOption,
      is_correct: answers[question.id] === question.correctOption,
      topic: question.topic ?? null,
      skill: question.skill ?? null,
    }));

    const { error: questionError } = await supabase
      .from("question_attempts")
      .insert(questionRows);

    if (questionError) {
      return (
        "Overall score saved, but question results failed: " +
        questionError.message
      );
    }

    return "Result and question-level performance saved successfully.";
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown persistence error.";
    return "Could not save quiz results: " + message;
  }
}
