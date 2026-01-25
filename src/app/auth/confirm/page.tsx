"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Confirming your email...");

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "signup" | "email" | "recovery";

      if (!token_hash || !type) {
        setStatus("Invalid confirmation link");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });

      if (error) {
        console.error("Verification error:", error);
        setStatus("Verification failed: " + error.message);
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      setStatus("Email confirmed! Redirecting...");
      router.push("/dashboard");
      router.refresh();
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-queens-black to-purple-950">
      <div className="text-center text-white">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg">{status}</p>
      </div>
    </div>
  );
}
