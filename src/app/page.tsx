import { Navbar } from "@/components/ui/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black selection:bg-primary selection:text-black relative overflow-hidden">
      {/* Temporary: Simplified background without animations */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-zinc-900 to-black" />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </div>
    </main>
  );
}
