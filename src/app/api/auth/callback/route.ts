import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

// GET /api/auth/callback - Handle OAuth callback (Discord, etc.)
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard/settings";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=oauth_error`);
    }

    // Check if user has Discord identity linked
    const user = data.user;
    if (user) {
      const discordIdentity = user.identities?.find(
        (identity) => identity.provider === "discord"
      );

      if (discordIdentity) {
        const discordData = discordIdentity.identity_data;
        const discordId = discordIdentity.id || discordData?.id;
        const discordUsername = discordData?.full_name || discordData?.name || discordData?.custom_claims?.global_name;
        const discordAvatar = discordData?.avatar_url;

        // Find profile by authId
        const profile = await db.profile.findUnique({
          where: { authId: user.id },
        });

        if (profile && discordId) {
          // Check if user is member of partnered guilds
          let isExclusiveMember = false;
          
          try {
            // Get user's guilds from Discord (requires guilds scope)
            const discordAccessToken = discordIdentity.identity_data?.provider_token;
            
            if (discordAccessToken) {
              // Fetch user's guilds from Discord
              const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
                headers: {
                  Authorization: `Bearer ${discordAccessToken}`,
                },
              });
              
              if (guildsRes.ok) {
                const userGuilds: { id: string }[] = await guildsRes.json();
                const userGuildIds = userGuilds.map((g) => g.id);
                
                // Fetch partnered guilds from Discord bot
                const botWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
                const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;
                if (botWebhookUrl && webhookSecret) {
                  const baseUrl = botWebhookUrl.replace("/webhook", "");
                  const partneredRes = await fetch(`${baseUrl}/partnered-guilds`, {
                    headers: {
                      'X-Webhook-Secret': webhookSecret,
                    },
                  });
                  
                  if (partneredRes.ok) {
                    const { guild_ids: partneredGuildIds } = await partneredRes.json();
                    
                    // Check if user is in any partnered guild
                    isExclusiveMember = userGuildIds.some((guildId) =>
                      partneredGuildIds.includes(guildId)
                    );
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error checking guild membership:", e);
            // Continue without exclusive status
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
        }
      }
    }
  }

  // Redirect to the next page
  return NextResponse.redirect(`${origin}${next}`);
}

