import { NextRequest, NextResponse } from "next/server";

// GET /api/auth/discord - Redirect to Discord OAuth
export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: "Discord not configured" }, { status: 500 });
  }

  // Use explicit public URL to avoid Railway/Vercel internal URLs
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.queensbuyinggroup.com";
  const redirectUri = `${origin}/api/auth/discord/callback`;
  
  // Discord OAuth URL with required scopes
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  
  return NextResponse.redirect(discordAuthUrl);
}

