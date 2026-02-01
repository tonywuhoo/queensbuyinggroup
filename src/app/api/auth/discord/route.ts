import { NextRequest, NextResponse } from "next/server";

// GET /api/auth/discord - Redirect to Discord OAuth
export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: "Discord not configured" }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
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

