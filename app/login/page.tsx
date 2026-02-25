"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignIn } from "@phosphor-icons/react";

/**
 * Render the login page UI and handle user authentication.
 *
 * Renders a login form with phone number and passcode fields, displays validation and server errors, manages loading state, and submits credentials to /api/auth/login. On successful authentication the user object is stored in localStorage and the router navigates to the root route; network or server errors are surfaced via the visible error message.
 *
 * @returns The rendered login page as a JSX element
 */
export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.trim(), 
          passcode: passcode.trim() 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <SignIn size={32} weight="bold" />
          </div>
          <h1>Welcome Back</h1>
          <p>Login to access Baobab POS</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-field">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              type="tel"
              inputMode="tel"
              pattern="[0-9]*"
              placeholder="e.g. 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              required
              autoFocus
              maxLength={10}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Passcode</label>
            <input
              className="form-input"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link href="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
