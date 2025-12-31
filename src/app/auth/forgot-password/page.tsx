"use client";

import { useState } from "react";
import { Play, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage("Please enter your email address");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Play className="w-12 h-12 text-purple-500 fill-purple-500" />
            <span className="text-3xl font-bold text-white">EduFeed</span>
          </Link>
        </div>

        <div className="card p-8">
          {status === "success" ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Check Your Email</h1>
              <p className="text-gray-400 mb-6">
                If an account exists with <strong className="text-white">{email}</strong>,
                you&apos;ll receive a password reset link shortly.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Don&apos;t see the email? Check your spam folder or make sure you entered the correct email address.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStatus("idle");
                    setEmail("");
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Try Another Email
                </button>
                <Link
                  href="/login"
                  className="block w-full text-center text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">Forgot Password?</h1>
                <p className="text-gray-400">
                  No worries! Enter your email and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {status === "error" && errorMessage && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                    disabled={status === "loading"}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <div className="spinner w-5 h-5" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-purple-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
