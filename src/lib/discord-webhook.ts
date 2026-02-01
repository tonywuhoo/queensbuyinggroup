/**
 * Discord Webhook Integration
 *
 * Sends deal notifications to the Discord bot webhook server.
 */

interface DealWebhookPayload {
  item: string;
  price?: string;
  exclusive_price?: string;
  original_price?: string;
  discount?: string;
  url?: string;
  image_url?: string;
  store?: string;
  category?: string;
  description?: string;
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
  }
): DealWebhookPayload {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://cashoutqueens.com';
  const dealUrl = `${websiteUrl}/dashboard/deals/${deal.id}`;

  // Convert Prisma Decimal to number if needed
  const retailPrice = typeof deal.retailPrice === 'number' ? deal.retailPrice : Number(deal.retailPrice);
  const payout = typeof deal.payout === 'number' ? deal.payout : Number(deal.payout);

  // Calculate discount percentage
  let discount: string | undefined;
  if (retailPrice > payout) {
    const discountPercent = Math.round(((retailPrice - payout) / retailPrice) * 100);
    discount = `${discountPercent}% off`;
  }

  // Determine exclusive vs regular price
  let exclusivePriceStr: string | undefined;
  const price = `$${payout.toFixed(2)}`;

  // If deal has exclusive pricing, include it
  if (deal.isExclusive && deal.exclusivePrice) {
    const exclusiveNum = typeof deal.exclusivePrice === 'number' ? deal.exclusivePrice : Number(deal.exclusivePrice);
    exclusivePriceStr = `$${exclusiveNum.toFixed(2)}`;
  }

  return {
    item: deal.title,
    price,
    exclusive_price: exclusivePriceStr,
    original_price: `$${retailPrice.toFixed(2)}`,
    discount,
    url: dealUrl,
    image_url: deal.imageUrl || undefined,
    store: 'Cash Out Queens',
    category: 'Deals',
    description: deal.description || undefined,
    timestamp: new Date().toISOString(),
  };
}
