import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

// Helper to get session from cookie manually (fallback)
export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Find the auth cookie
  const authCookie = allCookies.find(c => c.name.includes('auth-token') && !c.name.includes('.'));
  
  if (!authCookie) {
    return null;
  }
  
  try {
    const session = JSON.parse(authCookie.value);
    if (session.access_token) {
      return session;
    }
  } catch {
    // Cookie might be in different format
  }
  
  return null;
}
