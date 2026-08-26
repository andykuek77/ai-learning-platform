"use client";

import { useState } from "react";
import questions from "../data/MT7.json";

export default function Home() {
  const question = questions[0];

  const [selectedOption, setSelectedOption] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (selectedOption === null) {
      setMessage("Please select an answer.");
      return;
    }

    if (selectedOption === question.correctOption) {
      setMessage("Correct!");
    } else {
      setMessage(
        `Incorrect. The correct answer is ${question.correctAnswer}.`
      );
    }
  }

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>Mathematics Practice</h1>

      <h2>Question {question.id}</h2>

      <p>{question.question}</p>

      <div>
        {question.options.map((option, index) => {
          const optionNumber = index + 1;

          return (
            <div
              key={index}
              style={{ marginBottom: "12px" }}
            >
              <label>
                <input
                  type="radio"
                  name="answer"
                  checked={selectedOption === optionNumber}
                  onChange={() =>
                    setSelectedOption(optionNumber)
                  }
                />

                {" "}
                {optionNumber}. {option}
              </label>
            </div>
          );
        })}
      </div>

     <button
  type="button"
  onClick={() => alert("BUTTON WORKS")}
  style={{
    marginTop: "20px",
    padding: "15px 30px",
    backgroundColor: "white",
    border: "2px solid black",
    cursor: "pointer",
    position: "relative",
    zIndex: 9999,
  }}
>
  TEST SUBMIT
</button>

      {message && (
        <p
          style={{
            marginTop: "20px",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}