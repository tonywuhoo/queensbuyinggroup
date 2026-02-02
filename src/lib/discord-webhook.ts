/**
 * Discord Webhook Integration
 *
 * Sends deal notifications to the Discord bot webhook server.
 */

interface RetailLink {
  name: string;
  url: string;
  emoji: string;
}

interface DealWebhookPayload {
  // Required
  item: string;
  buying_group: string; // Standardized: "Queens Buying Group"
  
  // Pricing
  price?: string;           // Payout price
  exclusive_price?: string; // VIP payout price
  retail_price?: string;    // Original retail price
  profit?: string;          // Profit percentage
  
  // Deal details
  description?: string;
  vendor_limit?: number;
  free_label_min?: number;
  deadline?: string;
  
  // Links
  url?: string;             // Commit page URL
  image_url?: string;
  retail_links?: RetailLink[];
  
  // Metadata
  deal_id?: string;
  timestamp?: string;
}

/**
 * Send a deal notification to the Discord bot webhook.
 *
 * @param payload Deal information to send
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function notifyDiscordWebhook(payload: DealWebhookPayload): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK | URL not configured, skipping notification');
    return false;
  }

  if (!webhookSecret) {
    console.warn('DISCORD_WEBHOOK | SECRET not configured, skipping notification');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('DISCORD_WEBHOOK | Success:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('DISCORD_WEBHOOK | Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('DISCORD_WEBHOOK | Error:', error);
    return false;
  }
}

/**
 * Format a deal object into a Discord webhook payload.
 *
 * @param deal Deal object from database (Prisma)
 * @returns DealWebhookPayload
 */
export function formatDealForDiscord(
  deal: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    retailPrice: any; // Prisma Decimal or number
    payout: any; // Prisma Decimal or number
    priceType: string;
    dealNumber: number;
    isExclusive?: boolean;
    exclusivePrice?: any; // Prisma Decimal or number
    limitPerVendor?: number | null;
    freeLabelMin?: number | null;
    deadline?: Date | string | null;
    // Retail links
    linkAmazon?: string | null;
    linkBestBuy?: string | null;
    linkWalmart?: string | null;
    linkTarget?: string | null;
    linkHomeDepot?: string | null;
    linkLowes?: string | null;
    linkOther?: string | null;
  }
): DealWebhookPayload {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://www.queensbuyinggroup.com';
  const dealUrl = `${websiteUrl}/dashboard/deals/${deal.id}`;

  // Convert Prisma Decimal to number if needed
  const retailPrice = typeof deal.retailPrice === 'number' ? deal.retailPrice : Number(deal.retailPrice);
  const payout = typeof deal.payout === 'number' ? deal.payout : Number(deal.payout);

  // Calculate profit percentage (how much user makes per dollar spent)
  let profit: string | undefined;
  if (retailPrice > 0 && payout > 0) {
    const profitPercent = Math.round(((payout - retailPrice) / retailPrice) * 100);
    profit = profitPercent > 0 ? `+${profitPercent}%` : `${profitPercent}%`;
  }

  // Exclusive price if applicable
  let exclusivePriceStr: string | undefined;
  if (deal.isExclusive && deal.exclusivePrice) {
    const exclusiveNum = typeof deal.exclusivePrice === 'number' ? deal.exclusivePrice : Number(deal.exclusivePrice);
    exclusivePriceStr = `$${exclusiveNum.toFixed(2)}`;
  }

  // Build retail links array
  const retailLinks: RetailLink[] = [];
  if (deal.linkAmazon) {
    retailLinks.push({ name: 'Amazon', url: deal.linkAmazon, emoji: '🛒' });
  }
  if (deal.linkBestBuy) {
    retailLinks.push({ name: 'Best Buy', url: deal.linkBestBuy, emoji: '🟡' });
  }
  if (deal.linkWalmart) {
    retailLinks.push({ name: 'Walmart', url: deal.linkWalmart, emoji: '🔵' });
  }
  if (deal.linkTarget) {
    retailLinks.push({ name: 'Target', url: deal.linkTarget, emoji: '🎯' });
  }
  if (deal.linkHomeDepot) {
    retailLinks.push({ name: 'Home Depot', url: deal.linkHomeDepot, emoji: '🧰' });
  }
  if (deal.linkLowes) {
    retailLinks.push({ name: "Lowe's", url: deal.linkLowes, emoji: '🔧' });
  }
  if (deal.linkOther) {
    retailLinks.push({ name: 'Other', url: deal.linkOther, emoji: '🔗' });
  }

  // Format deadline
  let deadlineStr: string | undefined;
  if (deal.deadline) {
    const deadlineDate = typeof deal.deadline === 'string' ? new Date(deal.deadline) : deal.deadline;
    deadlineStr = deadlineDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return {
    item: deal.title,
    buying_group: 'Queens Buying Group', // Standardized name
    
    // Pricing
    price: `$${payout.toFixed(2)}`,
    exclusive_price: exclusivePriceStr,
    retail_price: `$${retailPrice.toFixed(2)}`,
    profit,
    
    // Deal details
    description: deal.description || undefined,
    vendor_limit: deal.limitPerVendor || undefined,
    free_label_min: deal.freeLabelMin || undefined,
    deadline: deadlineStr,
    
    // Links
    url: dealUrl,
    image_url: deal.imageUrl || undefined,
    retail_links: retailLinks.length > 0 ? retailLinks : undefined,
    
    // Metadata
    deal_id: `D-${String(deal.dealNumber).padStart(5, '0')}`,
    timestamp: new Date().toISOString(),
  };
}
