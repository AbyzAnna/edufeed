"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Play, Lock, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Status = "loading" | "valid" | "invalid" | "submitting" | "success" | "error";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setStatus("invalid");
        setErrorMessage("Invalid reset link. Please request a new one.");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
          setErrorMessage(data.error || "This reset link has expired or is invalid.");
        }
      } catch (error) {
        setStatus("invalid");
        setErrorMessage("Failed to validate reset link. Please try again.");
      }
    };

    validateToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: "", color: "" };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: strength, text: "Weak", color: "bg-red-500" };
    if (strength <= 3) return { level: strength, text: "Fair", color: "bg-yellow-500" };
    if (strength <= 4) return { level: strength, text: "Good", color: "bg-blue-500" };
    return { level: strength, text: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

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
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Verifying Link...</h1>
              <p className="text-gray-400">Please wait while we validate your reset link.</p>
            </div>
          )}

          {/* Invalid Token State */}
          {status === "invalid" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Invalid Link</h1>
              <p className="text-gray-400 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-center"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/login"
                  className="block w-full bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Password Reset!</h1>
              <p className="text-gray-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Sign In Now
              </button>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Reset Failed</h1>
              <p className="text-gray-400 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <button
                  onClick={() => setStatus("valid")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/auth/forgot-password"
                  className="block w-full bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors text-center"
                >
                  Request New Link
                </Link>
              </div>
            </div>
          )}

          {/* Reset Form */}
          {(status === "valid" || status === "submitting") && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">Create New Password</h1>
                <p className="text-gray-400">
                  Enter a new password for your account.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                      disabled={status === "submitting"}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength.level ? passwordStrength.color : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">
                        Password strength: <span className="text-white">{passwordStrength.text}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                      disabled={status === "submitting"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${
                      password === confirmPassword ? "text-green-400" : "text-red-400"
                    }`}>
                      {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting" || password !== confirmPassword || password.length < 6}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "submitting" ? (
                    <>
                      <div className="spinner w-5 h-5" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Reset Password</span>
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
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="spinner" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
