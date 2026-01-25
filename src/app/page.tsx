import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Shield, Zap, DollarSign, Users, Truck, MapPin, Package, FileText } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; code?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Handle email confirmation redirect - exchange code for session
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (!error) {
      redirect("/dashboard");
    }
  }
  
  if (params.token_hash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as "signup" | "email",
    });
    if (!error) {
      redirect("/dashboard");
    }
  }

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const role = user.user_metadata?.role || "SELLER";
    if (role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-queens-black via-purple-950 to-queens-black text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-queens-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-queens-violet/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Logo size="md" className="[&_span]:text-white" />
        <div className="flex items-center gap-4">
          <a
            href="https://discord.gg/SdECS6wxka"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join Discord
          </a>
          <Link href="/login">
            <Button variant="outline-light">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-queens-purple/20 text-queens-lavender text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Now accepting new sellers
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6">
            Buy and sell with{" "}
            <span className="text-purple-gradient">confidence</span>
          </h1>

          <p className="text-xl text-white/60 mb-10 max-w-xl">
            Cash Out Queens is your trusted partner for exclusive deals. 
            Access daily offers, commit to deals, and earn with ease.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/login">
              <Button variant="purple" size="xl">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a
              href="https://discord.gg/SdECS6wxka"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline-light" size="xl">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Join Community
              </Button>
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <div className="w-12 h-12 rounded-lg bg-queens-purple/20 flex items-center justify-center mb-5">
              <DollarSign className="w-6 h-6 text-queens-lavender" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Best Prices</h3>
            <p className="text-white/60">
              Access exclusive deals with competitive prices. We negotiate the best rates so you can maximize your earnings.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <div className="w-12 h-12 rounded-lg bg-queens-purple/20 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6 text-queens-lavender" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Trusted Platform</h3>
            <p className="text-white/60">
              Built on trust and transparency. Track your commitments, shipments, and payments all in one secure place.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <div className="w-12 h-12 rounded-lg bg-queens-purple/20 flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-queens-lavender" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Community</h3>
            <p className="text-white/60">
              Join a growing community of sellers. Get support, access resources, and grow your business with us.
            </p>
          </div>
        </div>

        {/* How it works - Elegant Flow */}
        <div className="mt-32">
          <h2 className="text-3xl font-display font-bold text-center mb-4">
            How It <span className="text-purple-gradient">Works</span>
          </h2>
          <p className="text-center text-white/60 mb-16 max-w-xl mx-auto">
            Simple process, two ways to fulfill. Pick what works best for you.
          </p>

          {/* Flowing steps */}
          <div className="max-w-5xl mx-auto">
            {/* Start - Commit */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-queens-purple to-queens-violet flex items-center justify-center shadow-2xl shadow-queens-purple/40 ring-4 ring-queens-purple/20">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-queens-black border-2 border-queens-purple flex items-center justify-center text-xs font-bold text-queens-lavender">1</div>
              </div>
              <h3 className="text-xl font-semibold mt-5">Find a Deal & Commit</h3>
              <p className="text-white/50 text-sm mt-1">Browse offers, pick your quantity</p>
            </div>

            {/* Flowing connector */}
            <div className="flex justify-center my-6">
              <div className="w-px h-12 bg-gradient-to-b from-queens-purple to-queens-purple/30" />
            </div>


            {/* Two paths side by side */}
            <div className="grid md:grid-cols-2 gap-6 relative">
              {/* Center divider with "or" */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-12 h-12 rounded-full bg-queens-black border border-white/20 flex items-center justify-center">
                  <span className="text-white/60 text-sm font-medium">or</span>
                </div>
              </div>

              {/* Path: Ship */}
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-8">
                  <Truck className="w-6 h-6 text-queens-lavender" />
                  <h4 className="text-lg font-semibold">Ship It</h4>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-queens-purple/30 transition-colors">
                      <FileText className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white/90">Request a shipping label</p>
                      <p className="text-sm text-white/40">We'll send it to you</p>
                    </div>
                  </div>

                  <div className="ml-5 w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-queens-purple/30 transition-colors">
                      <Package className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white/90">Pack & drop at carrier</p>
                      <p className="text-sm text-white/40">UPS, FedEx, USPS</p>
                    </div>
                  </div>

                  <div className="ml-5 w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-400">Get paid</p>
                      <p className="text-sm text-white/40">Once we receive & verify</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile "or" divider */}
              <div className="md:hidden flex items-center justify-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Path: Drop Off */}
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-8">
                  <MapPin className="w-6 h-6 text-queens-lavender" />
                  <h4 className="text-lg font-semibold">Drop Off in Person</h4>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Faster payout</span>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-queens-purple/30 transition-colors">
                      <MapPin className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white/90">Visit a drop-off location</p>
                      <p className="text-sm text-white/40">Northeast area spots</p>
                    </div>
                  </div>

                  <div className="ml-5 w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-queens-purple/30 transition-colors">
                      <Users className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white/90">Hand off your items</p>
                      <p className="text-sm text-white/40">Quick on-site verification</p>
                    </div>
                  </div>

                  <div className="ml-5 w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-400">Get paid instantly</p>
                      <p className="text-sm text-white/40">Cash out same day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Cash Out Queens. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-white/40 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
