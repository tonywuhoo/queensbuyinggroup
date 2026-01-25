"use client";

import { useState, useEffect } from "react";
import { Truck, Package, ExternalLink, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tracking {
  id: string;
  trackingNumber: string;
  carrier: string;
  lastStatus?: string;
  lastLocation?: string;
  estimatedDelivery?: string;
  createdAt: string;
  commitment: {
    id: string;
    quantity: number;
    warehouse: string;
    deal: {
      title: string;
      payout: number;
    };
  };
}

export default function TrackingPage() {
  const [trackings, setTrackings] = useState<Tracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [carrierFilter, setCarrierFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchTrackings = async () => {
      try {
        const res = await fetch('/api/tracking');
        if (res.ok) {
          const data = await res.json();
          setTrackings(data);
        }
      } catch (e) {
        console.error('Error fetching trackings:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackings();
  }, []);

  const filteredTrackings = trackings.filter((t) => {
    if (warehouseFilter !== "ALL" && t.commitment.warehouse !== warehouseFilter) return false;
    if (carrierFilter !== "ALL" && t.carrier !== carrierFilter) return false;
    return true;
  });

  const getCarrierUrl = (carrier: string, trackingNumber: string) => {
    switch (carrier) {
      case "FEDEX":
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case "UPS":
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      case "USPS":
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
      default:
        return "#";
    }
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case "FEDEX": return "bg-purple-100 text-purple-700";
      case "UPS": return "bg-amber-100 text-amber-700";
      case "USPS": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tracking History</h1>
        <p className="text-slate-500 text-sm">{trackings.length} shipments tracked</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Warehouse Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {["ALL", "MA", "NJ", "CT", "DE"].map((wh) => (
            <button
              key={wh}
              onClick={() => setWarehouseFilter(wh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                warehouseFilter === wh
                  ? "bg-queens-purple text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {wh === "ALL" ? "All" : wh}
            </button>
          ))}
        </div>

        {/* Carrier Filter */}
        <div className="flex gap-2">
          {["ALL", "FEDEX", "UPS", "USPS"].map((c) => (
            <button
              key={c}
              onClick={() => setCarrierFilter(c)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                carrierFilter === c
                  ? "bg-slate-700 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {c === "ALL" ? "All Carriers" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Trackings List */}
      {filteredTrackings.length > 0 ? (
        <div className="space-y-4">
          {filteredTrackings.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-slate-900">{t.commitment.deal.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>Qty: {t.commitment.quantity}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.commitment.warehouse}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCarrierColor(t.carrier)}`}>
                  {t.carrier}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="font-mono text-sm text-slate-700">{t.trackingNumber}</p>
                {t.lastStatus && (
                  <p className="text-sm text-slate-500 mt-1">{t.lastStatus}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Submitted {new Date(t.createdAt).toLocaleDateString()}
                </div>
                <a
                  href={getCarrierUrl(t.carrier, t.trackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Track on {t.carrier}
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No tracking history</p>
          <p className="text-sm text-slate-400 mt-1">Submit tracking for your shipments to see them here</p>
        </div>
      )}
    </div>
  );
}
