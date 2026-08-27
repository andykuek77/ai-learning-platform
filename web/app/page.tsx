"use client";

import { useState } from "react";
import questions from "../data/MT7.json";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] =
    useState<number | null>(null);

  const [answers, setAnswers] = useState<
    Record<number, number>
  >({});

  const [feedback, setFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);

  const [finished, setFinished] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const question = questions[currentIndex];

  const progress =
    ((currentIndex + 1) / questions.length) * 100;

  async function saveAttempt(
  score: number,
  totalMarks: number,
  questionsAnswered: number,
  updatedAnswers: Record<number, number>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setSaveMessage(
      "Result calculated, but you must be logged in to save it."
    );
    return;
  }

  // 1. Save overall quiz attempt
  const { error: quizError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_name: "MT7",
      score,
      total_marks: totalMarks,
      questions_answered: questionsAnswered,
    });

  if (quizError) {
    setSaveMessage(
      "Could not save overall result: " + quizError.message
    );
    return;
  }

  // 2. Prepare one row for each question
  const questionRows = questions.map((q) => ({
    user_id: user.id,
    quiz_name: "MT7",
    question_id: q.id,
    selected_option: updatedAnswers[q.id] ?? null,
    correct_option: q.correctOption,
    is_correct:
      updatedAnswers[q.id] === q.correctOption,
    topic: null,
    skill: null,
  }));

  // 3. Save all question-level results
  const { error: questionError } = await supabase
    .from("question_attempts")
    .insert(questionRows);

  if (questionError) {
    setSaveMessage(
      "Overall score saved, but question results failed: " +
        questionError.message
    );
    return;
  }

  setSaveMessage(
    "Result and question-level performance saved successfully."
  );
}
  function checkAnswer() {
    if (selectedOption === null) return;

    if (selectedOption === question.correctOption) {
      setFeedback("correct");
    } else {
      setFeedback("incorrect");
    }
  }

  async function handleContinue() {
    if (selectedOption === null) return;

    if (feedback === null) {
      checkAnswer();
      return;
    }

    const updatedAnswers = {
      ...answers,
      [question.id]: selectedOption,
    };

    setAnswers(updatedAnswers);

    if (currentIndex === questions.length - 1) {
      let score = 0;

      for (const q of questions) {
        if (updatedAnswers[q.id] === q.correctOption) {
          score += q.marks;
        }
      }

      const totalMarks = questions.reduce(
        (total, q) => total + q.marks,
        0
      );

      await saveAttempt(
        score,
        totalMarks,
        Object.keys(updatedAnswers).length
      );

      setFinished(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextQuestion = questions[nextIndex];

    setCurrentIndex(nextIndex);

    setSelectedOption(
      updatedAnswers[nextQuestion.id] ?? null
    );

    setFeedback(null);
  }

  function handlePrevious() {
    if (currentIndex === 0) return;

    const currentAnswers = { ...answers };

    if (selectedOption !== null) {
      currentAnswers[question.id] = selectedOption;
      setAnswers(currentAnswers);
    }

    const previousIndex = currentIndex - 1;
    const previousQuestion = questions[previousIndex];

    setCurrentIndex(previousIndex);

    setSelectedOption(
      currentAnswers[previousQuestion.id] ?? null
    );

    setFeedback(null);
  }

  function calculateScore() {
    let score = 0;

    for (const q of questions) {
      if (answers[q.id] === q.correctOption) {
        score += q.marks;
      }
    }

    return score;
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setFeedback(null);
    setFinished(false);
    setSaveMessage("");
  }

  if (finished) {
    const score = calculateScore();

    const totalMarks = questions.reduce(
      (total, q) => total + q.marks,
      0
    );

    const percentage = Math.round(
      (score / totalMarks) * 100
    );

    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <header style={styles.header}>
            <div style={styles.brand}>LearnAI</div>

            <nav style={styles.nav}>
              <span>Practice</span>
              <span>Progress</span>
              <span>Profile</span>
            </nav>
          </header>

          <section style={styles.resultCard}>
            <div style={styles.badge}>
              Practice completed
            </div>

            <h1 style={styles.resultTitle}>
              Nice work.
            </h1>

            <p style={styles.subtitle}>
              You completed Mathematics Mock Test 7.
            </p>

            <div style={styles.scoreCircle}>
              <div style={styles.scorePercent}>
                {percentage}%
              </div>

              <div style={styles.scoreText}>
                {score} / {totalMarks}
              </div>
            </div>

            {saveMessage && (
              <p style={styles.saveMessage}>
                {saveMessage}
              </p>
            )}

            <button
              onClick={restartQuiz}
              style={styles.primaryButton}
            >
              Practise again
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.brand}>LearnAI</div>

          <nav style={styles.nav}>
            <span style={styles.activeNav}>
              Practice
            </span>

            <span>Progress</span>
            <span>Profile</span>
          </nav>
        </header>

        <section style={styles.content}>
          <div style={styles.topRow}>
            <div>
              <p style={styles.eyebrow}>
                MATHEMATICS
              </p>

              <h1 style={styles.title}>
                Mock Test 7
              </h1>
            </div>

            <div style={styles.counter}>
              {currentIndex + 1} / {questions.length}
            </div>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: `${progress}%`,
              }}
            />
          </div>

          <div style={styles.card}>
            <p style={styles.questionLabel}>
              QUESTION {question.id}
            </p>

            <h2 style={styles.questionText}>
              {question.question}
            </h2>

            <div style={styles.options}>
              {question.options.map(
                (option, index) => {
                  const optionNumber = index + 1;

                  const selected =
                    selectedOption === optionNumber;

                  const isCorrect =
                    feedback !== null &&
                    optionNumber ===
                      question.correctOption;

                  const isWrong =
                    feedback === "incorrect" &&
                    selected &&
                    !isCorrect;

                  let optionStyle = {
                    ...styles.option,
                  };

                  if (selected) {
                    optionStyle = {
                      ...optionStyle,
                      ...styles.selectedOption,
                    };
                  }

                  if (isCorrect) {
                    optionStyle = {
                      ...optionStyle,
                      ...styles.correctOption,
                    };
                  }

                  if (isWrong) {
                    optionStyle = {
                      ...optionStyle,
                      ...styles.wrongOption,
                    };
                  }

                  return (
                    <label
                      key={index}
                      style={optionStyle}
                    >
                      <input
                        type="radio"
                        name="answer"
                        checked={selected}
                        disabled={feedback !== null}
                        onChange={() => {
                          setSelectedOption(
                            optionNumber
                          );
                          setFeedback(null);
                        }}
                        style={{ display: "none" }}
                      />

                      <span
                        style={styles.optionNumber}
                      >
                        {optionNumber}
                      </span>

                      <span>{option}</span>
                    </label>
                  );
                }
              )}
            </div>

            {feedback === "correct" && (
              <div style={styles.goodFeedback}>
                <strong>Correct</strong>
                <div style={{ marginTop: 6 }}>
                  Well done. Continue when you are ready.
                </div>
              </div>
            )}

            {feedback === "incorrect" && (
              <div style={styles.badFeedback}>
                <strong>Not quite</strong>
                <div style={{ marginTop: 6 }}>
                  The correct answer is{" "}
                  {question.correctAnswer}.
                </div>
              </div>
            )}
          </div>

          <div style={styles.controls}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              style={{
                ...styles.secondaryButton,
                opacity:
                  currentIndex === 0 ? 0.4 : 1,
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedOption === null}
              style={{
                ...styles.primaryButton,
                opacity:
                  selectedOption === null
                    ? 0.45
                    : 1,
              }}
            >
              {feedback === null
                ? "Check answer"
                : currentIndex ===
                  questions.length - 1
                ? "Finish"
                : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f7f8fa",
    color: "#202124",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  shell: {
    minHeight: "100vh",
  },

  header: {
    height: 72,
    background: "#ffffff",
    borderBottom: "1px solid #eceef1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 48px",
  },

  brand: {
    fontSize: 22,
    fontWeight: 700,
  },

  nav: {
    display: "flex",
    gap: 32,
    color: "#666",
    fontSize: 15,
  },

  activeNav: {
    color: "#111",
    fontWeight: 600,
  },

  content: {
    maxWidth: 840,
    margin: "0 auto",
    padding: "56px 24px 100px",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },

  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.5px",
    color: "#888",
  },

  title: {
    margin: "7px 0 0",
    fontSize: 28,
    fontWeight: 600,
  },

  counter: {
    fontSize: 14,
    color: "#777",
  },

  progressTrack: {
    height: 6,
    background: "#e5e7ea",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 28,
  },

  progressBar: {
    height: "100%",
    background: "#222",
    borderRadius: 999,
    transition: "width 0.25s ease",
  },

  card: {
    background: "#fff",
    border: "1px solid #eceef1",
    borderRadius: 18,
    padding: 42,
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.035)",
  },

  questionLabel: {
    marginTop: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "1.4px",
    color: "#8a8d91",
  },

  questionText: {
    fontSize: 23,
    fontWeight: 500,
    lineHeight: 1.55,
    marginBottom: 32,
  },

  options: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  option: {
    border: "1px solid #e0e3e7",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#fff",
    cursor: "pointer",
    fontSize: 17,
  },

  selectedOption: {
    border: "2px solid #222",
    background: "#f8f8f8",
  },

  correctOption: {
    border: "1px solid #7abf93",
    background: "#eef9f2",
  },

  wrongOption: {
    border: "1px solid #d88d8d",
    background: "#fff2f2",
  },

  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid #d8dadd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 600,
  },

  goodFeedback: {
    marginTop: 26,
    padding: "18px 20px",
    background: "#eef9f2",
    borderRadius: 12,
    color: "#24693c",
  },

  badFeedback: {
    marginTop: 26,
    padding: "18px 20px",
    background: "#fff3f1",
    borderRadius: 12,
    color: "#9c4039",
  },

  controls: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 24,
  },

  primaryButton: {
    background: "#202124",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "14px 25px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    background: "transparent",
    color: "#444",
    border: "1px solid #d9dcdf",
    borderRadius: 10,
    padding: "14px 22px",
    fontSize: 15,
    cursor: "pointer",
  },

  resultCard: {
    maxWidth: 650,
    margin: "80px auto",
    background: "#fff",
    border: "1px solid #eceef1",
    borderRadius: 20,
    padding: 60,
    textAlign: "center",
  },

  badge: {
    display: "inline-block",
    background: "#eef3ff",
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 13,
    marginBottom: 20,
  },

  resultTitle: {
    fontSize: 34,
    marginBottom: 10,
  },

  subtitle: {
    color: "#666",
  },

  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: "50%",
    border: "8px solid #f0f1f3",
    margin: "36px auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  scorePercent: {
    fontSize: 38,
    fontWeight: 700,
  },

  scoreText: {
    color: "#777",
    marginTop: 4,
  },

  saveMessage: {
    color: "#666",
    marginBottom: 20,
  },
};

async function saveQuestionAttempts(
  userId: string,
  updatedAnswers: Record<number, number>
) {
  const rows = questions.map((q) => ({
    user_id: userId,
    quiz_name: "MT7",
    question_id: q.id,
    selected_option: updatedAnswers[q.id] ?? null,
    correct_option: q.correctOption,
    is_correct:
      updatedAnswers[q.id] === q.correctOption,
    topic: q.topic ?? null,
    skill: q.skill ?? null,
  }));

  const { error } = await supabase
    .from("question_attempts")
    .insert(rows);

  if (error) {
    setSaveMessage(
      "Question results could not be saved: " +
        error.message
    );
  }
}