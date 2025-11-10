import React from "react";
import { useWorldSimulation } from "../hooks/useWorldSimulation";

export const WorldStatePanel: React.FC = () => {
  const {
    contractAddress,
    decryptWorldState,
    decodedState,
    isBusy,
    message,
  } = useWorldSimulation();

  const disabled = isBusy || !contractAddress;

  return (
    <section className="space-y-4">
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148, 163, 184, 0.4)",
          padding: 20,
          background:
            "radial-gradient(circle at top, rgba(129,140,248,0.16), transparent 60%) rgba(15,23,42,0.95)",
          boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, margin: 0, marginBottom: 4 }}>
              World State
            </h2>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Decrypted KPIs from the FHEVM contract
            </p>
          </div>
          <button
            disabled={disabled}
            onClick={decryptWorldState}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148, 163, 184, 0.6)",
              padding: "6px 12px",
              backgroundColor: "transparent",
              color: "#e5e7eb",
              fontSize: 13,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {isBusy ? "Decrypting..." : "Decrypt World State"}
          </button>
        </div>

        {/* Concentric rings visualization */}
        <div
          style={{
            position: "relative",
            height: 180,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Background core */}
          <div
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(15,23,42,1) 35%, rgba(37,99,235,0.85) 100%)",
              boxShadow: "0 0 28px rgba(129,140,248,0.65)",
            }}
          />

          {decodedState &&
            (() => {
              const rings = [
                {
                  key: "worldEvolution" as const,
                  label: "World Evolution",
                  value: decodedState.worldEvolution,
                  color: "rgba(168,85,247,0.95)", // purple
                },
                {
                  key: "stability" as const,
                  label: "Stability",
                  value: decodedState.stability,
                  color: "rgba(34,197,94,0.95)", // green
                },
                {
                  key: "innovation" as const,
                  label: "Innovation",
                  value: decodedState.innovation,
                  color: "rgba(34,211,238,0.95)", // cyan
                },
                {
                  key: "mystery" as const,
                  label: "Mystery",
                  value: decodedState.mystery,
                  color: "rgba(249,115,22,0.95)", // orange
                },
              ];

              // Shuffle order so attributes appear in different ring positions
              const shuffled = [...rings].sort(() => Math.random() - 0.5);

              return shuffled.map((ring, index) => {
                const baseDiameter = 80; // innermost ring diameter
                const step = 14; // distance between rings
                const diameter = baseDiameter + index * step * 2;

                const numeric = Number(ring.value);
                const normalized =
                  Number.isFinite(numeric) && numeric > 0
                    ? Math.min(1, numeric / 100)
                    : 0.3;

                return (
                  <div
                    key={ring.key}
                    title={`${ring.label}: ${String(ring.value)}`}
                    style={{
                      position: "absolute",
                      width: diameter,
                      height: diameter,
                      borderRadius: "999px",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: ring.color,
                      opacity: normalized,
                      boxShadow: `0 0 12px ${ring.color}`,
                      transition:
                        "opacity 0.35s ease-out, box-shadow 0.35s ease-out",
                    }}
                  />
                );
              });
            })()}
        </div>

        {/* Numeric metrics */}
        {decodedState ? (
          <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
            <MetricBar
              label="World Evolution"
              value={decodedState.worldEvolution}
              color="#a855f7"
            />
            <MetricBar
              label="Stability"
              value={decodedState.stability}
              color="#22c55e"
            />
            <MetricBar
              label="Innovation"
              value={decodedState.innovation}
              color="#22d3ee"
            />
            <MetricBar
              label="Mystery"
              value={decodedState.mystery}
              color="#f97316"
            />
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#e5e7eb",
              }}
            >
              <span>Decisions applied</span>
              <span>{String(decodedState.decisionsCount)}</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              padding: "16px 0 4px",
            }}
          >
            No decrypted world state yet. Click &quot;Decrypt World State&quot; to
            reveal the current KPIs.
          </div>
        )}

        {message && (
          <p
            style={{
              marginTop: 10,
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
  );
};

type MetricBarProps = { label: string; value: bigint; color: string };

const MetricBar: React.FC<MetricBarProps> = ({ label, value, color }) => {
  const valueNumber = Number(value);
  const clamped =
    valueNumber < 0 ? 0 : valueNumber > 100 ? 100 : valueNumber;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#e5e7eb" }}>{valueNumber}</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          backgroundColor: "rgba(15,23,42,0.9)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: color,
            transition: "width 0.4s ease-out",
          }}
        />
      </div>
    </div>
  );
};



