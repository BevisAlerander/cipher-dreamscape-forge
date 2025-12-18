import React, { useState } from "react";
import { decisionScenarios, type DecisionScenario, type DecisionOption } from "../config/decisionScenarios";

interface Props {
  onSelectOption: (option: DecisionOption) => void;
  disabled?: boolean;
}

export function DecisionScenarioSelector({ onSelectOption, disabled }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<DecisionScenario | null>(null);
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);

  const handleScenarioSelect = (scenario: DecisionScenario) => {
    setSelectedScenario(scenario);
    setSelectedOption(null);
  };

  const handleOptionSelect = (option: DecisionOption) => {
    setSelectedOption(option);
    onSelectOption(option);
  };

  const resetSelection = () => {
    setSelectedScenario(null);
    setSelectedOption(null);
  };

  if (selectedScenario) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={resetSelection}
            disabled={disabled}
            style={{
              background: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.5)",
              borderRadius: 6,
              padding: "4px 8px",
              color: "#e5e7eb",
              fontSize: 12,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            ← Back
          </button>
          <h3 style={{ margin: 0, fontSize: 16, color: "#e5e7eb" }}>
            {selectedScenario.icon} {selectedScenario.title}
          </h3>
        </div>
        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: "#9ca3af" }}>
          {selectedScenario.description}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {selectedScenario.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              disabled={disabled}
              style={{
                textAlign: "left",
                padding: 12,
                borderRadius: 8,
                border: selectedOption === option 
                  ? "2px solid #60a5fa" 
                  : "1px solid rgba(148, 163, 184, 0.3)",
                background: selectedOption === option
                  ? "rgba(96, 165, 250, 0.1)"
                  : "rgba(15, 23, 42, 0.6)",
                color: "#e5e7eb",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{option.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                {option.description}
              </div>
              <div style={{ 
                display: "flex", 
                gap: 12, 
                fontSize: 11,
                flexWrap: "wrap",
              }}>
                {option.worldEvolution !== 0 && (
                  <span style={{ color: "#a855f7" }}>
                    Evolution: {option.worldEvolution > 0 ? "+" : ""}{option.worldEvolution}
                  </span>
                )}
                {option.stability !== 0 && (
                  <span style={{ color: "#22c55e" }}>
                    Stability: {option.stability > 0 ? "+" : ""}{option.stability}
                  </span>
                )}
                {option.innovation !== 0 && (
                  <span style={{ color: "#22d3ee" }}>
                    Innovation: {option.innovation > 0 ? "+" : ""}{option.innovation}
                  </span>
                )}
                {option.mystery !== 0 && (
                  <span style={{ color: "#f97316" }}>
                    Mystery: {option.mystery > 0 ? "+" : ""}{option.mystery}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12, color: "#e5e7eb" }}>
        Select Decision Scenario
      </h3>
      <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 0, marginBottom: 16 }}>
        Choose a scenario to decide how to influence the world's development direction
      </p>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 12 
      }}>
        {decisionScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenarioSelect(scenario)}
            disabled={disabled}
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "#e5e7eb",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              textAlign: "left",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.5)";
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
              e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{scenario.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
              {scenario.title}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              {scenario.description.substring(0, 50)}...
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

