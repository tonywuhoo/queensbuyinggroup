"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your account...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      // Check URL params and hash
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const code = params.get("code");
      const error = params.get("error") || hashParams.get("error");
      const errorDescription = params.get("error_description") || hashParams.get("error_description");
      const accessToken = hashParams.get("access_token");

      console.log("Callback params:", { code, error, accessToken });

      if (error) {
        setMessage("Error: " + (errorDescription || error));
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // If we have access_token in hash, set session directly
      if (accessToken) {
        const refreshToken = hashParams.get("refresh_token");
        if (refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }

      // If we have a code, exchange it
      if (code) {
        setMessage("Exchanging code...");
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Exchange error:", exchangeError);
          setMessage("Error: " + exchangeError.message);
          setTimeout(() => router.push("/login"), 2000);
          return;
        }
      }

      // Check if we have a session now
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setMessage("Success! Redirecting...");
        const role = user.user_metadata?.role || "SELLER";
        router.push(role === "ADMIN" ? "/admin" : "/dashboard");
        router.refresh();
      } else {
        setMessage("No session found. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-queens-black to-purple-950">
      <div className="text-center text-white">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>{message}</p>
      </div>
    </div>
  );
}
