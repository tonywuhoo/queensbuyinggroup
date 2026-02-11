import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Package } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    pricePerUnit: number | string;
    dropoffAddress: string | null;
    status: string;
    maxQuantity: number | null;
    currentCommitted?: number;
    endsAt: Date | string | null;
  };
  href: string;
  showCommitButton?: boolean;
}

export function DealCard({ deal, href, showCommitButton = true }: DealCardProps) {
  const remaining = deal.maxQuantity
    ? deal.maxQuantity - (deal.currentCommitted || 0)
    : null;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge
          variant={deal.status === "ACTIVE" ? "success" : "secondary"}
          className="absolute top-3 right-3"
        >
          {deal.status}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">
              {deal.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {deal.description}
            </p>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-queens-purple">
              {formatCurrency(deal.pricePerUnit)}
            </span>
            <span className="text-sm text-muted-foreground">/ unit</span>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            {deal.dropoffAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{deal.dropoffAddress}</span>
              </div>
            )}
            {deal.endsAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Ends {formatDate(deal.endsAt)}</span>
              </div>
            )}
            {remaining !== null && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 shrink-0" />
                <span>{remaining} spots remaining</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {showCommitButton && (
        <CardFooter className="p-5 pt-0">
          <Link href={href} className="w-full">
            <Button variant="purple" className="w-full">
              View Deal
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
