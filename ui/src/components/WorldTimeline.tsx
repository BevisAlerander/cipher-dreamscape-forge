import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useWorldSimulation, type WorldStateDecoded } from "../hooks/useWorldSimulation";

interface TimelineDataPoint {
  timestamp: number;
  time: string;
  worldEvolution: number;
  stability: number;
  innovation: number;
  mystery: number;
}

export function WorldTimeline() {
  const { decodedState } = useWorldSimulation();
  const [history, setHistory] = useState<TimelineDataPoint[]>([]);

  useEffect(() => {
    if (decodedState) {
      const newPoint: TimelineDataPoint = {
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString(),
        worldEvolution: Number(decodedState.worldEvolution),
        stability: Number(decodedState.stability),
        innovation: Number(decodedState.innovation),
        mystery: Number(decodedState.mystery),
      };

      setHistory((prev) => {
        // Check if same as last point (avoid duplicates)
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          if (
            last.worldEvolution === newPoint.worldEvolution &&
            last.stability === newPoint.stability &&
            last.innovation === newPoint.innovation &&
            last.mystery === newPoint.mystery
          ) {
            return prev; // No change, don't add new point
          }
        }
        // Keep at most 50 data points
        const updated = [...prev, newPoint];
        return updated.slice(-50);
      });
    }
  }, [decodedState]);

  if (history.length === 0) {
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
        <h2 style={{ fontSize: 18, margin: 0, marginBottom: 4 }}>World Evolution Timeline</h2>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          No historical data yet. Evolution trends will appear after decrypting world state.
        </p>
      </div>
    );
  }

  // Format data, use index as X-axis
  const chartData = history.map((point, index) => ({
    index,
    time: point.time,
    "World Evolution": point.worldEvolution,
    "Stability": point.stability,
    "Innovation": point.innovation,
    "Mystery": point.mystery,
  }));

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
      <h2 style={{ fontSize: 18, margin: 0, marginBottom: 4 }}>World Evolution Timeline</h2>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, marginBottom: 20 }}>
        World state changes over time (last {history.length} data points)
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis 
            dataKey="index" 
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            label={{ value: "Data Point", position: "insideBottom", offset: -5, fill: "#9ca3af" }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: 8,
              color: "#e5e7eb",
            }}
            labelStyle={{ color: "#9ca3af" }}
          />
          <Legend 
            wrapperStyle={{ color: "#e5e7eb" }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="World Evolution" 
            stroke="#a855f7" 
            strokeWidth={2}
            dot={{ r: 3, fill: "#a855f7" }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="Stability" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ r: 3, fill: "#22c55e" }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="Innovation" 
            stroke="#22d3ee" 
            strokeWidth={2}
            dot={{ r: 3, fill: "#22d3ee" }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="Mystery" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={{ r: 3, fill: "#f97316" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Display latest state */}
      {history.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(15, 23, 42, 0.6)" }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Latest State</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <span style={{ color: "#a855f7" }}>
              Evolution: {history[history.length - 1].worldEvolution}
            </span>
            <span style={{ color: "#22c55e" }}>
              Stability: {history[history.length - 1].stability}
            </span>
            <span style={{ color: "#22d3ee" }}>
              Innovation: {history[history.length - 1].innovation}
            </span>
            <span style={{ color: "#f97316" }}>
              Mystery: {history[history.length - 1].mystery}
            </span>
            <span style={{ color: "#9ca3af" }}>
              {history[history.length - 1].time}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

