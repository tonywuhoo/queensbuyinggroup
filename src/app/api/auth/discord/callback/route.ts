import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthProfile } from "@/lib/api-utils";

// GET /api/auth/discord/callback - Handle Discord OAuth callback
export async function GET(request: NextRequest) {
  // Use explicit public URL to avoid Railway/Vercel internal URLs
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.queensbuyinggroup.com";
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  // Handle errors from Discord
  if (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(`${origin}/dashboard/settings?error=discord_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=no_code`);
  }

  // Get current user (they must be logged in)
  const { profile, error: authError } = await getAuthProfile();
  
  if (authError || !profile) {
    return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
  }

  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/discord/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Discord credentials not configured");
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.text();
      console.error("Discord token error:", errData);
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get user info from Discord
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      throw new Error("Failed to get Discord user info");
    }

    const discordUser = await userRes.json();
    const discordId = discordUser.id;
    const discordUsername = discordUser.global_name || discordUser.username;
    const discordAvatar = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
      : null;

    // Get user's guilds
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let isExclusiveMember = false;

    if (guildsRes.ok) {
      const userGuilds: { id: string }[] = await guildsRes.json();
      const userGuildIds = userGuilds.map((g) => g.id);

      // Check against partnered guilds
      const botWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
      const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;
      
      if (botWebhookUrl && webhookSecret) {
        const baseUrl = botWebhookUrl.replace("/webhook", "");
        
        try {
          const partneredRes = await fetch(`${baseUrl}/partnered-guilds`, {
            headers: {
              "X-Webhook-Secret": webhookSecret,
            },
          });

          if (partneredRes.ok) {
            const { guild_ids: partneredGuildIds } = await partneredRes.json();
            isExclusiveMember = userGuildIds.some((guildId) =>
              partneredGuildIds.includes(guildId)
            );
          }
        } catch (e) {
          console.error("Error fetching partnered guilds:", e);
        }
      }
    }

    // Check if this Discord account is already linked to another profile
    const existingLink = await db.profile.findUnique({
      where: { discordId },
      select: { id: true },
    });

    if (existingLink && existingLink.id !== profile.id) {
      console.log(`Discord ${discordId} already linked to another account`);
      return NextResponse.redirect(`${origin}/dashboard/settings?error=discord_already_linked`);
    }

    // Update profile with Discord info
    await db.profile.update({
      where: { id: profile.id },
      data: {
        discordId,
        discordUsername,
        discordAvatar,
        isExclusiveMember,
        exclusiveMemberCheckedAt: new Date(),
      },
    });

    // Redirect back to settings with success
    return NextResponse.redirect(`${origin}/dashboard/settings?discord=linked`);
  } catch (e: any) {
    console.error("Discord OAuth callback error:", e);
    return NextResponse.redirect(`${origin}/dashboard/settings?error=discord_failed`);
  }
}

