import React, { useState } from "react";
import { useWorldSimulation } from "../hooks/useWorldSimulation";

type Props = {
  isConnected: boolean;
};

export function WorldSimulationPanel({ isConnected }: Props) {
  const [delta, setDelta] = useState({
    worldEvolution: 3,
    stability: 5,
    innovation: 7,
    mystery: 2,
  });

  const { contractAddress, applyEncryptedDecision, isBusy, message } =
    useWorldSimulation();

  const disabled = !isConnected || isBusy;

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(148, 163, 184, 0.4)",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 65%) #020617",
        boxShadow: "0 20px 50px rgba(15,23,42,0.85)",
        transition: "all 0.3s ease",
      }}
    >
      <h1 style={{ fontSize: 24, margin: 0, marginBottom: 4, background: "linear-gradient(135deg, #60a5fa, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        🌍 Encrypted World State
      </h1>
      <p style={{ marginTop: 0, marginBottom: 20, color: "#9ca3af" }}>
        Submit encrypted decisions to the FHEVM contract and decrypt the
        resulting world state locally. Experience privacy-preserving computation
        in action!
      </p>

      {!isConnected && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "rgba(248, 250, 252, 0.05)",
            border: "1px dashed rgba(148, 163, 184, 0.6)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          Connect a wallet (top-right) on Sepolia FHEVM to interact with the
          world.
        </div>
      )}

      <section>
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Decision Payload</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 0 }}>
            Adjust the cleartext deltas that will be encrypted and submitted to
            the contract.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginTop: 12,
              fontSize: 14,
            }}
          >
            {(["worldEvolution", "stability", "innovation", "mystery"] as const).map(
              (key) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#e5e7eb",
                    }}
                  >
                    {key}
                  </span>
                  <input
                    type="number"
                    min={-10}
                    max={10}
                    value={delta[key]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= -10 && value <= 10) {
                        setDelta((prev) => ({
                          ...prev,
                          [key]: value,
                        }));
                      }
                    }}
                    style={{
                      borderRadius: 8,
                      border: "1px solid rgba(148, 163, 184, 0.5)",
                      padding: "6px 8px",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      color: "#e5e7eb",
                    }}
                  />
                </label>
              ),
            )}
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              disabled={disabled || !contractAddress}
              onClick={() =>
                applyEncryptedDecision({
                  worldEvolutionDelta: delta.worldEvolution,
                  stabilityDelta: delta.stability,
                  innovationDelta: delta.innovation,
                  mysteryDelta: delta.mystery,
                })
              }
              style={{
                borderRadius: 999,
                border: "none",
                padding: "8px 16px",
                background:
                  "linear-gradient(135deg, #22c55e, #22d3ee, #a855f7)",
                color: "#020617",
                fontWeight: 600,
                fontSize: 14,
                cursor: disabled || !contractAddress ? "not-allowed" : "pointer",
                opacity: disabled || !contractAddress ? 0.5 : 1,
              }}
            >
              {isBusy ? "Submitting..." : "Encrypt & Submit Decision"}
            </button>
          </div>

          {message && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#a5b4fc",
                minHeight: 18,
              }}
            >
              {message}
            </p>
          )}
        </div>

      </section>
    </div>
  );
}



