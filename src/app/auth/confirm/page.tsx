"use client";

import { createClient } from "@/lib/supabase/client";
import { Play, CheckCircle, XCircle, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ConfirmStatus = "loading" | "success" | "expired" | "error" | "resending" | "resent";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [email, setEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      // Check URL hash for error or token
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      // Handle errors from Supabase
      if (error) {
        if (errorCode === "otp_expired") {
          setStatus("expired");
          setErrorMessage(errorDescription?.replace(/\+/g, " ") || "The confirmation link has expired.");
        } else {
          setStatus("error");
          setErrorMessage(errorDescription?.replace(/\+/g, " ") || "An error occurred during confirmation.");
        }
        return;
      }

      // Handle successful token exchange
      if (accessToken && refreshToken) {
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setStatus("error");
            setErrorMessage(sessionError.message);
            return;
          }

          if (data.user) {
            // Sync user with backend
            try {
              await fetch("/api/mobile/auth/supabase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  supabaseUserId: data.user.id,
                  email: data.user.email,
                  name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
                }),
              });
            } catch (syncError) {
              console.error("Failed to sync user:", syncError);
            }

            setStatus("success");
            // Redirect to feed after showing success message
            setTimeout(() => {
              router.push("/feed");
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          setErrorMessage("Failed to verify your email. Please try again.");
        }
        return;
      }

      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        setTimeout(() => {
          router.push("/feed");
        }, 2000);
        return;
      }

      // No token and no error - show generic error
      setStatus("error");
      setErrorMessage("Invalid confirmation link. Please request a new one.");
    };

    handleAuthConfirmation();
  }, [router, supabase.auth]);

  const handleResendConfirmation = async () => {
    if (!email) return;

    setStatus("resending");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("resent");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Play className="w-12 h-12 text-purple-500 fill-purple-500" />
          <span className="text-3xl font-bold text-white">EduFeed</span>
        </Link>

        <div className="card p-8">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Verifying your email...</h1>
              <p className="text-gray-400">Please wait while we confirm your account.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Email Verified!</h1>
              <p className="text-gray-400 mb-6">Your account has been confirmed. Redirecting you to your feed...</p>
              <div className="spinner mx-auto" />
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Link Expired</h1>
              <p className="text-gray-400 mb-6">
                This confirmation link has expired. Enter your email below to receive a new one.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                />
                <button
                  onClick={handleResendConfirmation}
                  disabled={!email}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Send New Confirmation Link
                </button>
              </div>
            </>
          )}

          {status === "resending" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Sending...</h1>
              <p className="text-gray-400">Please wait while we send a new confirmation email.</p>
            </>
          )}

          {status === "resent" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Email Sent!</h1>
              <p className="text-gray-400 mb-6">
                We&apos;ve sent a new confirmation link to <strong className="text-white">{email}</strong>.
                Please check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-block text-purple-400 hover:text-purple-300 transition-colors"
              >
                Return to Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Verification Failed</h1>
              <p className="text-gray-400 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-center"
                >
                  Try Signing Up Again
                </Link>
                <Link
                  href="/login"
                  className="block w-full bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors text-center"
                >
                  Go to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-gray-500 text-sm mt-6">
          Need help?{" "}
          <Link href="/support" className="text-purple-400 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
