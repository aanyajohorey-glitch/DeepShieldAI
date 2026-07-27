import { MarketingNavbar } from "@/components/landing/MarketingNavbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { WhyDeepShield } from "@/components/landing/WhyDeepShield";
import { About } from "@/components/landing/About";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <WhyDeepShield />
        <About />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
