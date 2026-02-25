"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "@phosphor-icons/react";

/**
 * Renders the user registration page and handles account creation.
 *
 * This component displays a registration form for full name, phone number,
 * passcode, and passcode confirmation. On form submission it sends the
 * form data to /api/auth/register, shows a loading state while the request
 * is in progress, and displays any error messages returned by the API or
 * a network error message. When registration succeeds the returned user
 * object is stored in localStorage under the "user" key and the router
 * navigates to the home page ("/").
 *
 * @returns The registration page UI as a React element.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [repeatPasscode, setRepeatPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName: fullName.trim(), 
          phoneNumber: phoneNumber.trim(), 
          passcode: passcode.trim(), 
          repeatPasscode: repeatPasscode.trim() 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.message || "Registration failed");
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
            <UserPlus size={32} weight="bold" />
          </div>
          <h1>Create Account</h1>
          <p>Register to start using Baobab POS</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-field">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              maxLength={100}
            />
          </div>

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
              maxLength={10}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Passcode</label>
            <input
              className="form-input"
              type="password"
              placeholder="Minimum 4 characters"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Repeat Passcode</label>
            <input
              className="form-input"
              type="password"
              value={repeatPasscode}
              onChange={(e) => setRepeatPasscode(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
