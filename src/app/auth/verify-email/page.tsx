"use client";

import { Play, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type VerificationStatus = "loading" | "verifying" | "success" | "error" | "expired";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!token || !emailParam) {
      setStatus("error");
      setError("Invalid verification link. Please request a new one.");
      return;
    }

    setEmail(emailParam);
    verifyEmail(token, emailParam);
  }, [searchParams]);

  const verifyEmail = async (token: string, email: string) => {
    setStatus("verifying");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
      } else if (data.error?.includes("expired")) {
        setStatus("expired");
        setError(data.error);
      } else {
        setStatus("error");
        setError(data.error || "Verification failed. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setError("An error occurred. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        setError(data.error || "Failed to resend verification email.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Play className="w-12 h-12 text-purple-500 fill-purple-500" />
          <span className="text-3xl font-bold">EduFeed</span>
        </Link>

        <div className="card p-8">
          {(status === "loading" || status === "verifying") && (
            <>
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Verifying your email</h1>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Email Verified!</h1>
              <p className="text-gray-400 mb-6">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <Link
                href="/login"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Link Expired</h1>
              <p className="text-gray-400 mb-6">
                This verification link has expired. Click the button below to receive a new one.
              </p>

              {resendSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                  A new verification link has been sent to your email!
                </div>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 mb-4"
                >
                  {isResending ? "Sending..." : "Send New Verification Link"}
                </button>
              )}

              <Link href="/login" className="text-purple-400 hover:underline text-sm">
                Back to Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Verification Failed</h1>
              <p className="text-gray-400 mb-6">{error}</p>

              {email && !resendSuccess && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 mb-4"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              )}

              {resendSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                  A new verification link has been sent to your email!
                </div>
              )}

              <Link href="/login" className="text-purple-400 hover:underline text-sm">
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="card p-8">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
