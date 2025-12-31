"use client";

import { createClient } from "@/lib/supabase/client";
import { GraduationCap, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const supabase = createClient();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/notebooks`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Use our custom signup API that sends emails via SendGrid
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      if (data.requiresEmailVerification) {
        setNeedsEmailConfirmation(true);
        setSuccess(true);
      } else {
        // Redirect to notebooks (shouldn't happen with current setup)
        window.location.href = "/notebooks";
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  if (success && needsEmailConfirmation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
            <p className="text-gray-400 mb-6">
              We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
              <br />
              Click the link to activate your account.
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
            <Link
              href="/login"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <GraduationCap className="w-12 h-12 text-purple-500" />
            <span className="text-3xl font-bold">EduFeed</span>
          </Link>
          <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
          <p className="text-gray-400">Start your learning journey today</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="card p-8">
          {/* Email/Password Form - Primary signup method */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Name <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm your password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:underline">
                Sign in
              </Link>
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-500">or continue with</span>
            </div>
          </div>

          {/* OAuth Options */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Creating account..." : "Google"}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-purple-400 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-purple-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
