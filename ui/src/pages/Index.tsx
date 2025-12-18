import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Logo } from "@/components/Logo";
import { WorldSimulationPanel } from "@/components/WorldSimulationPanel";
import { WorldStatePanel } from "@/components/WorldStatePanel";
// import { WorldTimeline } from "@/components/WorldTimeline"; // TODO: Re-enable when feature is fully implemented
import { PlayerRanking } from "@/components/PlayerRanking";
import heroLandscape from "@/assets/hero-landscape.jpg";

const Index: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroLandscape})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        {/* Content */}
        <div className="relative container mx-auto px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <ConnectButton />
          </div>

          <div className="text-center py-10 md:py-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Shape a World
              <br />
              <span className="gradient-cosmic bg-clip-text text-transparent">
                No One Can Predict
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A reality-simulation game where your decisions are encrypted using
              Fully Homomorphic Encryption. Every choice shapes the world, but
              no one can see what you choose.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Decision Panel + FHE wiring */}
            <div className="animate-float" style={{ animationDelay: "0.2s" }}>
              <WorldSimulationPanel isConnected={isConnected} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* World State panel (concentric rings + stats) */}
            <div className="animate-float" style={{ animationDelay: "0.4s" }}>
              <WorldStatePanel />
            </div>

            {/* World Timeline - TODO: Re-enable when feature is fully implemented */}
            {/* <div className="animate-float" style={{ animationDelay: "0.6s" }}>
              <WorldTimeline />
            </div> */}

            {/* Player Ranking */}
            <div className="animate-float" style={{ animationDelay: "0.6s" }}>
              <PlayerRanking />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;


