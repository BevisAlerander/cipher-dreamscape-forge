import React from "react";

export const Logo: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel border border-primary/40">
      <img
        src="/cipher-dreamscape-logo.svg"
        alt="Cipher Dreamscape World"
        className="w-8 h-8 rounded-full"
      />
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold tracking-wide uppercase text-primary/90">
          Cipher Dreamscape
        </span>
        <span className="text-xs text-muted-foreground">
          Encrypted World Simulation
        </span>
      </div>
    </div>
  );
};


