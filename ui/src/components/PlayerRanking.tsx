import React, { useEffect, useState, useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { WorldSimulationABI, WORLDSIMULATION_ADDRESS_LOCAL, WORLDSIMULATION_ADDRESS_SEPOLIA } from "../config/contracts";

interface PlayerStats {
  address: string;
  decisionsCount: number;
  lastDecisionTime: number;
  totalContribution: number;
}

export function PlayerRanking() {
  const { address: currentAddress, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [players, setPlayers] = useState<PlayerStats[]>([]);

  const contractAddress = useMemo(() => {
    if (chainId === 31337) {
      return WORLDSIMULATION_ADDRESS_LOCAL as `0x${string}`;
    }
    if (chainId === 11155111) {
      return WORLDSIMULATION_ADDRESS_SEPOLIA as `0x${string}`;
    }
    return undefined;
  }, [chainId]);

  useEffect(() => {
    if (!publicClient || !contractAddress) return;

    // Load player statistics from localStorage
    const loadPlayerStats = () => {
      const stored = localStorage.getItem("worldSimulation_playerStats");
      if (stored) {
        try {
          const stats = JSON.parse(stored) as PlayerStats[];
          setPlayers(stats.sort((a, b) => b.decisionsCount - a.decisionsCount));
        } catch (e) {
          console.error("Failed to load player stats:", e);
        }
      }
    };

    loadPlayerStats();

    let unwatch: (() => void) | undefined;

    // Watch for DecisionApplied events
    if (contractAddress) {
      try {
        unwatch = publicClient.watchContractEvent({
          address: contractAddress as `0x${string}`,
          abi: WorldSimulationABI,
          eventName: "DecisionApplied",
          onLogs: (logs) => {
            logs.forEach((log) => {
              if (log.args && log.args.sender) {
                const playerAddress = log.args.sender as string;
                const timestamp = log.args.timestamp 
                  ? Number(log.args.timestamp) 
                  : Math.floor(Date.now() / 1000); // Use seconds if timestamp not provided

                setPlayers((prev) => {
                  const existingIndex = prev.findIndex(
                    (p) => p.address.toLowerCase() === playerAddress.toLowerCase()
                  );
                  
                  let updated: PlayerStats[];
                  if (existingIndex >= 0) {
                    // Update existing player
                    updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      decisionsCount: updated[existingIndex].decisionsCount + 1,
                      lastDecisionTime: timestamp,
                      totalContribution: updated[existingIndex].totalContribution + 1,
                    };
                  } else {
                    // Add new player
                    updated = [
                      ...prev,
                      {
                        address: playerAddress,
                        decisionsCount: 1,
                        lastDecisionTime: timestamp,
                        totalContribution: 1,
                      },
                    ];
                  }

                  // Sort and save to localStorage
                  const sorted = updated.sort((a, b) => b.decisionsCount - a.decisionsCount);
                  localStorage.setItem("worldSimulation_playerStats", JSON.stringify(sorted));
                  return sorted;
                });
              }
            });
          },
        });
      } catch (error) {
        console.error("Failed to watch contract events:", error);
      }
    }

    return () => {
      if (unwatch) {
        unwatch();
      }
    };
  }, [publicClient, contractAddress]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Assume timestamp is in seconds
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hrs ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(148, 163, 184, 0.4)",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(129,140,248,0.16), transparent 60%) rgba(15,23,42,0.95)",
        boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      }}
    >
      <h2 style={{ fontSize: 18, margin: 0, marginBottom: 4 }}>🏆 Player Rankings</h2>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, marginBottom: 20 }}>
        Ranked by decision contribution
      </p>

      {players.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
          No player data yet. Rankings will appear after decisions are submitted.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {players.slice(0, 10).map((player, index) => {
            const isCurrentPlayer = currentAddress?.toLowerCase() === player.address.toLowerCase();
            const rank = index + 1;

            return (
              <div
                key={player.address}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: isCurrentPlayer
                    ? "rgba(96, 165, 250, 0.1)"
                    : "rgba(15, 23, 42, 0.6)",
                  border: isCurrentPlayer
                    ? "1px solid rgba(96, 165, 250, 0.5)"
                    : "1px solid rgba(148, 163, 184, 0.2)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      rank === 1
                        ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                        : rank === 2
                        ? "linear-gradient(135deg, #94a3b8, #64748b)"
                        : rank === 3
                        ? "linear-gradient(135deg, #f97316, #ea580c)"
                        : "rgba(148, 163, 184, 0.2)",
                    color: rank <= 3 ? "#020617" : "#e5e7eb",
                  }}
                >
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontWeight: isCurrentPlayer ? 600 : 400,
                        color: "#e5e7eb",
                        fontSize: 14,
                      }}
                    >
                      {formatAddress(player.address)}
                      {isCurrentPlayer && (
                        <span style={{ marginLeft: 6, fontSize: 12, color: "#60a5fa" }}>(You)</span>
                      )}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    Last decision: {formatTime(player.lastDecisionTime)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#e5e7eb" }}>
                    {player.decisionsCount}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Decisions</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentAddress && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(15, 23, 42, 0.6)" }}>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Your Statistics</div>
          {(() => {
            const myStats = players.find(
              (p) => p.address.toLowerCase() === currentAddress.toLowerCase()
            );
            if (!myStats) {
              return (
                <div style={{ fontSize: 14, color: "#9ca3af" }}>
                  You haven't submitted any decisions yet
                </div>
              );
            }
            const myRank = players.findIndex(
              (p) => p.address.toLowerCase() === currentAddress.toLowerCase()
            ) + 1;
            return (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#e5e7eb" }}>
                <span>Rank: <strong style={{ color: "#60a5fa" }}>#{myRank}</strong></span>
                <span>Decisions: <strong style={{ color: "#60a5fa" }}>{myStats.decisionsCount}</strong></span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

