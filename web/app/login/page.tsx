"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login failed: " + error.message);
      setLoading(false);
      return;
    }

    setMessage("Login successful.");

    // Go to quiz
    window.location.href = "/";

    setLoading(false);
  }

  async function handleSignUp() {
    if (!email || !password) {
      setMessage("Please enter your email and choose a password.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("Registration failed: " + error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      setMessage("Account created successfully.");
      window.location.href = "/";
    } else {
      setMessage(
        "Account created. Please check your email to confirm your account, then log in."
      );
    }

    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fa",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "460px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #eceef1",
          borderRadius: "18px",
          padding: "42px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.035)",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            marginBottom: "40px",
          }}
        >
          LearnAI
        </div>

        <h1
          style={{
            fontSize: "28px",
            marginBottom: "8px",
          }}
        >
          Welcome
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "30px",
            lineHeight: 1.5,
          }}
        >
          Log in to continue learning, or create a new student account.
        </p>

        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          Email
        </label>

        <input
          type="email"
          value={email}
          placeholder="student@example.com"
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            border: "1px solid #dfe2e6",
            borderRadius: "10px",
            fontSize: "16px",
            marginBottom: "22px",
          }}
        />

        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          Password
        </label>

        <input
          type="password"
          value={password}
          placeholder="At least 6 characters"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            border: "1px solid #dfe2e6",
            borderRadius: "10px",
            fontSize: "16px",
            marginBottom: "26px",
          }}
        />

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#202124",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Please wait..." : "Log in"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            margin: "25px 0",
            color: "#999",
          }}
        >
          <div
            style={{
              flex: 1,
              borderTop: "1px solid #e5e5e5",
            }}
          />

          <span>or</span>

          <div
            style={{
              flex: 1,
              borderTop: "1px solid #e5e5e5",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#ffffff",
            color: "#202124",
            border: "1px solid #d9dcdf",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Create student account
        </button>

        {message && (
          <div
            style={{
              marginTop: "24px",
              padding: "14px",
              background: "#f4f5f6",
              borderRadius: "10px",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}