/**
 * Auto-detect shipping carrier from tracking number format
 * 
 * Tracking Number Formats:
 * 
 * UPS:
 * - 1Z + 16 alphanumeric = 18 chars (e.g., 1Z999AA10123456784)
 * - T + 10 digits = 11 chars (Mail Innovations)
 * - 9 digits (Ground)
 * 
 * FedEx:
 * - 12 digits (Express/Ground)
 * - 15 digits (Ground/Home Delivery)
 * - 20 digits (SmartPost starting with 92)
 * - 22 digits (Ground 96 starting with 96)
 * - 34 digits (Door Tag)
 * 
 * USPS:
 * - 20-22 digits (domestic tracking)
 * - 13 chars: 2 letters + 9 digits + US (international)
 * - 26-34 digits starting with 92, 93, 94
 * 
 * DHL:
 * - 10 digits
 * - 10-11 alphanumeric starting with JD
 * - Waybill: 10-11 digits
 */

export type Carrier = "UPS" | "FEDEX" | "USPS" | "DHL" | "UNKNOWN";

interface CarrierPattern {
  carrier: Carrier;
  pattern: RegExp;
  description: string;
}

const carrierPatterns: CarrierPattern[] = [
  // UPS patterns (check first - most distinctive with 1Z prefix)
  {
    carrier: "UPS",
    pattern: /^1Z[A-Z0-9]{16}$/i,
    description: "UPS Standard (1Z + 16 chars)"
  },
  {
    carrier: "UPS",
    pattern: /^T\d{10}$/i,
    description: "UPS Mail Innovations"
  },
  {
    carrier: "UPS",
    pattern: /^\d{9}$/,
    description: "UPS Ground (9 digits)"
  },
  {
    carrier: "UPS",
    pattern: /^K\d{10}$/i,
    description: "UPS Worldwide Express"
  },
  
  // FedEx patterns
  {
    carrier: "FEDEX",
    pattern: /^\d{12}$/,
    description: "FedEx Express/Ground (12 digits)"
  },
  {
    carrier: "FEDEX",
    pattern: /^\d{15}$/,
    description: "FedEx Ground/Home (15 digits)"
  },
  {
    carrier: "FEDEX",
    pattern: /^96\d{20}$/,
    description: "FedEx Ground 96 (22 digits)"
  },
  {
    carrier: "FEDEX",
    pattern: /^61\d{18}$/,
    description: "FedEx Express Saver"
  },
  {
    carrier: "FEDEX",
    pattern: /^\d{20}$/,
    description: "FedEx SmartPost (20 digits)"
  },
  {
    carrier: "FEDEX",
    pattern: /^\d{22}$/,
    description: "FedEx (22 digits)"
  },
  {
    carrier: "FEDEX",
    pattern: /^DT\d{12}$/i,
    description: "FedEx Door Tag"
  },
  
  // USPS patterns  
  {
    carrier: "USPS",
    pattern: /^(94|93|92|91)\d{18,22}$/,
    description: "USPS Domestic (94/93/92/91 prefix)"
  },
  {
    carrier: "USPS",
    pattern: /^[A-Z]{2}\d{9}US$/i,
    description: "USPS International"
  },
  {
    carrier: "USPS",
    pattern: /^420\d{5}(91|92|93|94)\d{18,22}$/,
    description: "USPS with ZIP prefix"
  },
  {
    carrier: "USPS",
    pattern: /^\d{20,22}$/,
    description: "USPS Standard (20-22 digits)"
  },
  {
    carrier: "USPS",
    pattern: /^82\d{8}$/,
    description: "USPS Priority Mail"
  },
  
  // DHL patterns
  {
    carrier: "DHL",
    pattern: /^\d{10,11}$/,
    description: "DHL Express (10-11 digits)"
  },
  {
    carrier: "DHL",
    pattern: /^JD\d{18}$/i,
    description: "DHL eCommerce"
  },
  {
    carrier: "DHL",
    pattern: /^GM\d{16,18}$/i,
    description: "DHL Global Mail"
  },
  {
    carrier: "DHL",
    pattern: /^LX\d{9}[A-Z]{2}$/i,
    description: "DHL Packet"
  },
];

/**
 * Detect carrier from tracking number
 * Returns the carrier code or "UNKNOWN" if no match
 */
export function detectCarrier(trackingNumber: string): Carrier {
  // Clean up the tracking number
  const cleaned = trackingNumber.replace(/[\s-]/g, "").toUpperCase();
  
  if (!cleaned || cleaned.length < 8) {
    return "UNKNOWN";
  }
  
  for (const { carrier, pattern } of carrierPatterns) {
    if (pattern.test(cleaned)) {
      return carrier;
    }
  }
  
  return "UNKNOWN";
}

/**
 * Get carrier display info
 */
export function getCarrierInfo(carrier: Carrier): { name: string; color: string } {
  switch (carrier) {
    case "UPS":
      return { name: "UPS", color: "bg-amber-100 text-amber-800 border-amber-200" };
    case "FEDEX":
      return { name: "FedEx", color: "bg-purple-100 text-purple-800 border-purple-200" };
    case "USPS":
      return { name: "USPS", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case "DHL":
      return { name: "DHL", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    default:
      return { name: "Unknown", color: "bg-slate-100 text-slate-800 border-slate-200" };
  }
}

/**
 * Format tracking number for display (add spaces for readability)
 */
export function formatTrackingNumber(trackingNumber: string): string {
  const cleaned = trackingNumber.replace(/[\s-]/g, "");
  
  // UPS 1Z format: 1Z 999 AA1 01 2345 6784
  if (/^1Z/i.test(cleaned)) {
    return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
  }
  
  // Others: group by 4
  if (cleaned.length > 12) {
    return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
  }
  
  return cleaned;
}
