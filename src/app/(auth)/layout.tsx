import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex pattern-bg">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-queens-black via-purple-950 to-queens-black overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-queens-purple/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-queens-violet/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Logo size="lg" className="[&_span]:text-white" />

          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-display font-bold leading-tight">
              Your trusted partner for{" "}
              <span className="text-purple-gradient">buying and selling</span> with
              confidence.
            </h1>
            <p className="text-white/60 text-lg">
              Join our exclusive buying group to access daily deals and premium
              offers, all in one easy-to-use platform.
            </p>
          </div>

          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Cash Out Queens. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
