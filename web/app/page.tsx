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

  const [finished, setFinished] = useState(false);

  const question = questions[currentIndex];

  async function saveAttempt(
    score: number,
    totalMarks: number,
    questionsAnswered: number
  ) {
    const { error } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_name: "MT7",
        score: score,
        total_marks: totalMarks,
        questions_answered: questionsAnswered,
      });

    if (error) {
      alert("SAVE FAILED: " + error.message);
      return;
    }

    alert("SAVED SUCCESSFULLY!");
  }

  async function handleNext() {
    if (selectedOption === null) {
      alert("Please select an answer.");
      return;
    }

    const updatedAnswers = {
      ...answers,
      [question.id]: selectedOption,
    };

    setAnswers(updatedAnswers);

    // Last question
    if (currentIndex === questions.length - 1) {
      let score = 0;

      for (const q of questions) {
        const studentAnswer = updatedAnswers[q.id];

        if (studentAnswer === q.correctOption) {
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
  }

  function handlePrevious() {
    if (currentIndex === 0) return;

    const previousIndex = currentIndex - 1;
    const previousQuestion = questions[previousIndex];

    setCurrentIndex(previousIndex);

    setSelectedOption(
      answers[previousQuestion.id] ?? null
    );
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
    setFinished(false);
  }

  if (finished) {
    const score = calculateScore();

    const totalMarks = questions.reduce(
      (total, q) => total + q.marks,
      0
    );

    return (
      <main
        style={{
          maxWidth: "700px",
          margin: "40px auto",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Quiz Completed</h1>

        <h2>
          Score: {score} / {totalMarks}
        </h2>

        <button
          type="button"
          onClick={restartQuiz}
          style={{
            padding: "12px 24px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <p>
        Question {currentIndex + 1} of{" "}
        {questions.length}
      </p>

      <h1>Mathematics Practice</h1>

      <h2>Question {question.id}</h2>

      <p
        style={{
          fontSize: "20px",
          lineHeight: "1.6",
        }}
      >
        {question.question}
      </p>

      {question.options.map((option, index) => {
        const optionNumber = index + 1;

        return (
          <div
            key={index}
            style={{
              marginBottom: "14px",
              fontSize: "18px",
            }}
          >
            <label style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="answer"
                checked={
                  selectedOption === optionNumber
                }
                onChange={() =>
                  setSelectedOption(optionNumber)
                }
                style={{
                  marginRight: "10px",
                }}
              />

              {optionNumber}. {option}
            </label>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "25px",
        }}
      >
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{
            padding: "12px 24px",
          }}
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          style={{
            padding: "12px 24px",
            cursor: "pointer",
          }}
        >
          {currentIndex === questions.length - 1
            ? "Finish"
            : "Next"}
        </button>
      </div>
    </main>
  );
}