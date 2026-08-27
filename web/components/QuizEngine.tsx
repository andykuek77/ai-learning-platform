"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import QuizControls from "@/components/QuizControls";
import ResultCard from "@/components/ResultCard";
import { calculateScore, calculateTotalMarks } from "@/lib/quiz";
import { saveQuizAttempt } from "@/lib/quizAttempts";
import type { AnswerFeedback, Quiz, QuizAnswers } from "@/types/quiz";

export default function QuizEngine({ quiz }: { quiz: Quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const question = quiz.questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  async function handleContinue() {
    if (selectedOption === null || saving) return;
    if (feedback === null) {
      setFeedback(selectedOption === question.correctOption ? "correct" : "incorrect");
      return;
    }

    const updatedAnswers = { ...answers, [question.id]: selectedOption };
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      const score = calculateScore(quiz.questions, updatedAnswers);
      const totalMarks = calculateTotalMarks(quiz.questions);
      setSaving(true);
      const message = await saveQuizAttempt({ quiz, answers: updatedAnswers, score, totalMarks });
      setSaveMessage(message);
      setSaving(false);
      setFinished(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextQuestion = quiz.questions[nextIndex];
    setCurrentIndex(nextIndex);
    setSelectedOption(updatedAnswers[nextQuestion.id] ?? null);
    setFeedback(null);
  }

  function handlePrevious() {
    if (isFirstQuestion || saving) return;
    const updatedAnswers = { ...answers };
    if (selectedOption !== null) {
      updatedAnswers[question.id] = selectedOption;
      setAnswers(updatedAnswers);
    }
    const previousIndex = currentIndex - 1;
    const previousQuestion = quiz.questions[previousIndex];
    setCurrentIndex(previousIndex);
    setSelectedOption(updatedAnswers[previousQuestion.id] ?? null);
    setFeedback(null);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setFeedback(null);
    setFinished(false);
    setSaving(false);
    setSaveMessage("");
  }

  if (finished) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          <ResultCard completionTitle={quiz.completionTitle} score={calculateScore(quiz.questions, answers)} totalMarks={calculateTotalMarks(quiz.questions)} saveMessage={saveMessage} onRestart={restartQuiz} />
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <AppHeader practiceActive />
        <section style={styles.content}>
          <div style={styles.topRow}>
            <div>
              <p style={styles.eyebrow}>{quiz.subject}</p>
              <h1 style={styles.title}>{quiz.title}</h1>
            </div>
            <div style={styles.counter}>{currentIndex + 1} / {quiz.questions.length}</div>
          </div>
          <ProgressBar current={currentIndex + 1} total={quiz.questions.length} />
          <QuestionCard question={question} selectedOption={selectedOption} feedback={feedback} onSelect={(option) => { setSelectedOption(option); setFeedback(null); }} />
          <QuizControls isFirstQuestion={isFirstQuestion} isLastQuestion={isLastQuestion} hasSelection={selectedOption !== null} hasFeedback={feedback !== null} saving={saving} onPrevious={handlePrevious} onContinue={handleContinue} />
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  shell: { minHeight: "100vh" },
  content: { maxWidth: 840, margin: "0 auto", padding: "56px 24px 100px" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: "#888" },
  title: { margin: "7px 0 0", fontSize: 28, fontWeight: 600 },
  counter: { fontSize: 14, color: "#777" },
};
