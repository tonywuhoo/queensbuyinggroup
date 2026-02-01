import { db } from "@/lib/db";
import { getAuthProfile, jsonResponse, errorResponse } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

// POST /api/profile/discord/refresh - Re-check guild membership status
export async function POST() {
  try {
    const { user, profile, error } = await getAuthProfile();
    
    if (error || !profile || !user) {
      return errorResponse(error || "Not authenticated", 401);
    }

    if (!profile.discordId) {
      return errorResponse("Discord not linked", 400);
    }

    // Check if we recently checked (within 1 hour)
    if (profile.exclusiveMemberCheckedAt) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (profile.exclusiveMemberCheckedAt > hourAgo) {
        return jsonResponse({
          isExclusiveMember: profile.isExclusiveMember,
          checkedAt: profile.exclusiveMemberCheckedAt,
          message: "Recently checked, using cached status",
        });
      }
    }

    // Get Supabase session to access Discord token
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) {
      return errorResponse("Session expired", 401);
    }

    const discordIdentity = supabaseUser.identities?.find(
      (identity) => identity.provider === "discord"
    );

    if (!discordIdentity) {
      // Discord was unlinked from Supabase but not our DB
      await db.profile.update({
        where: { id: profile.id },
        data: {
          discordId: null,
          discordUsername: null,
          discordAvatar: null,
          isExclusiveMember: false,
          exclusiveMemberCheckedAt: null,
        },
      });
      return errorResponse("Discord not linked", 400);
    }

    let isExclusiveMember = false;

    try {
      // We need to refresh the token or use the session
      // Supabase should have refreshed the provider token
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      
      if (providerToken) {
        // Fetch user's guilds from Discord
        const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: {
            Authorization: `Bearer ${providerToken}`,
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
      // Keep current status on error
      isExclusiveMember = profile.isExclusiveMember;
    }

    // Update profile
    const updatedProfile = await db.profile.update({
      where: { id: profile.id },
      data: {
        isExclusiveMember,
        exclusiveMemberCheckedAt: new Date(),
      },
    });

    return jsonResponse({
      isExclusiveMember: updatedProfile.isExclusiveMember,
      checkedAt: updatedProfile.exclusiveMemberCheckedAt,
      message: "Membership status refreshed",
    });
  } catch (e: any) {
    console.error("POST /api/profile/discord/refresh error:", e);
    return errorResponse(e.message, 500);
  }
}

