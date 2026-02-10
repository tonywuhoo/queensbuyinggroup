/**
 * Bot API: Active Deals Endpoint
 * 
 * Returns all active deals for the Discord bot's daily digest feature.
 * Authenticated via X-Bot-API-Key header (shared secret).
 * 
 * This endpoint is designed for bot-to-backend communication only.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Response types
interface ActiveDeal {
  deal_id: string;
  item: string;
  description: string | null;
  image_url: string | null;
  
  // Pricing
  buy_price: number;      // What vendor pays at retail
  sell_price: number;     // Payout from buying group
  vip_sell_price: number | null;  // VIP/Exclusive payout
  price_type: "above_retail" | "at_retail" | "below_retail";
  profit_percent: number; // Calculated profit %
  
  // Deal info
  vendor_limit: number | null;
  free_label_min: number | null;
  deadline: string | null;
  
  // Links
  commit_url: string;
  retail_links: { name: string; url: string; emoji: string }[];
}

interface ActiveDealsResponse {
  buying_group: string;
  buying_group_id: string;
  deals: ActiveDeal[];
  count: number;
  generated_at: string;
}

/**
 * Verify the bot API key from request headers
 */
function verifyBotApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("X-Bot-API-Key");
  const expectedKey = process.env.DISCORD_BOT_API_KEY;
  
  if (!expectedKey) {
    console.error("BOT_API | DISCORD_BOT_API_KEY not configured");
    return false;
  }
  
  return apiKey === expectedKey;
}

/**
 * Determine price type based on buy/sell prices
 */
function getPriceType(buyPrice: number, sellPrice: number): "above_retail" | "at_retail" | "below_retail" {
  if (sellPrice > buyPrice) return "above_retail";
  if (sellPrice < buyPrice) return "below_retail";
  return "at_retail";
}

/**
 * Build retail links array from deal
 */
function buildRetailLinks(deal: any): { name: string; url: string; emoji: string }[] {
  const links: { name: string; url: string; emoji: string }[] = [];
  
  if (deal.linkAmazon) links.push({ name: "Amazon", url: deal.linkAmazon, emoji: "📦" });
  if (deal.linkBestBuy) links.push({ name: "Best Buy", url: deal.linkBestBuy, emoji: "🟡" });
  if (deal.linkWalmart) links.push({ name: "Walmart", url: deal.linkWalmart, emoji: "🔵" });
  if (deal.linkTarget) links.push({ name: "Target", url: deal.linkTarget, emoji: "🎯" });
  if (deal.linkHomeDepot) links.push({ name: "Home Depot", url: deal.linkHomeDepot, emoji: "🧰" });
  if (deal.linkLowes) links.push({ name: "Lowe's", url: deal.linkLowes, emoji: "🔧" });
  if (deal.linkOther) links.push({ name: deal.linkOtherName || "Other", url: deal.linkOther, emoji: "🔗" });
  
  return links;
}

/**
 * GET /api/bot/active-deals
 * 
 * Returns all active deals for the Discord bot.
 * Requires X-Bot-API-Key header for authentication.
 */
export async function GET(request: NextRequest) {
  // Verify API key
  if (!verifyBotApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing X-Bot-API-Key header" },
      { status: 401 }
    );
  }
  
  try {
    // Fetch all active deals
    const deals = await db.deal.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [
        { deadline: "asc" },  // Soonest deadline first
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        dealNumber: true,
        title: true,
        description: true,
        imageUrl: true,
        retailPrice: true,
        payout: true,
        priceType: true,
        isExclusive: true,
        exclusivePrice: true,
        limitPerVendor: true,
        freeLabelMin: true,
        deadline: true,
        linkAmazon: true,
        linkBestBuy: true,
        linkWalmart: true,
        linkTarget: true,
        linkHomeDepot: true,
        linkLowes: true,
        linkOther: true,
        linkOtherName: true,
      },
    });
    
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.queensbuyinggroup.com";
    
    // Transform deals for the bot
    const activeDeals: ActiveDeal[] = deals.map((deal) => {
      const buyPrice = Number(deal.retailPrice);
      const sellPrice = Number(deal.payout);
      const vipSellPrice = deal.isExclusive && deal.exclusivePrice 
        ? Number(deal.exclusivePrice) 
        : null;
      
      // Calculate profit using best available price (VIP if available)
      const effectiveSellPrice = vipSellPrice || sellPrice;
      const profitPercent = buyPrice > 0 
        ? Math.round(((effectiveSellPrice - buyPrice) / buyPrice) * 1000) / 10
        : 0;
      
      return {
        deal_id: `D-${String(deal.dealNumber).padStart(5, "0")}`,
        item: deal.title,
        description: deal.description,
        image_url: deal.imageUrl,
        
        // Pricing
        buy_price: buyPrice,
        sell_price: sellPrice,
        vip_sell_price: vipSellPrice,
        price_type: getPriceType(buyPrice, sellPrice),
        profit_percent: profitPercent,
        
        // Deal info
        vendor_limit: deal.limitPerVendor,
        free_label_min: deal.freeLabelMin,
        deadline: deal.deadline ? deal.deadline.toISOString() : null,
        
        // Links
        commit_url: `${websiteUrl}/dashboard/deals/${deal.id}`,
        retail_links: buildRetailLinks(deal),
      };
    });
    
    const response: ActiveDealsResponse = {
      buying_group: "Queens Buying Group",
      buying_group_id: "queens",
      deals: activeDeals,
      count: activeDeals.length,
      generated_at: new Date().toISOString(),
    };
    
    console.log(`BOT_API | /active-deals | Returned ${activeDeals.length} deals`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("BOT_API | /active-deals error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
