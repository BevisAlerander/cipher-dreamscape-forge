export interface DecisionOption {
  name: string;
  description: string;
  worldEvolution: number;
  stability: number;
  innovation: number;
  mystery: number;
}

export interface DecisionScenario {
  id: string;
  title: string;
  description: string;
  category: "resource" | "crisis" | "exploration" | "diplomacy" | "technology";
  icon: string;
  options: DecisionOption[];
}

export const decisionScenarios: DecisionScenario[] = [
  {
    id: "resource-allocation",
    title: "Resource Allocation",
    description: "How should limited resources be allocated?",
    category: "resource",
    icon: "⚖️",
    options: [
      {
        name: "Prioritize Technology",
        description: "Invest most resources in technology R&D",
        worldEvolution: 3,
        stability: -2,
        innovation: 5,
        mystery: 1,
      },
      {
        name: "Balanced Development",
        description: "Distribute resources evenly across all areas",
        worldEvolution: 2,
        stability: 3,
        innovation: 2,
        mystery: 0,
      },
      {
        name: "Conservative Stability",
        description: "Prioritize system stability, develop cautiously",
        worldEvolution: 1,
        stability: 5,
        innovation: -1,
        mystery: -2,
      },
    ],
  },
  {
    id: "mysterious-signal",
    title: "Mysterious Signal",
    description: "A signal from an unknown source has been detected...",
    category: "exploration",
    icon: "📡",
    options: [
      {
        name: "Deep Investigation",
        description: "Dispatch research team to investigate the signal source",
        worldEvolution: 2,
        stability: -3,
        innovation: 4,
        mystery: 5,
      },
      {
        name: "Cautious Observation",
        description: "Observe signal patterns first, then decide",
        worldEvolution: 0,
        stability: 2,
        innovation: 1,
        mystery: 3,
      },
      {
        name: "Ignore Signal",
        description: "Possibly interference, ignore it",
        worldEvolution: -1,
        stability: 1,
        innovation: 0,
        mystery: -2,
      },
    ],
  },
  {
    id: "crisis-management",
    title: "System Crisis",
    description: "Signs of system instability detected...",
    category: "crisis",
    icon: "⚠️",
    options: [
      {
        name: "Emergency Repair",
        description: "Immediately invest resources to repair the system",
        worldEvolution: -1,
        stability: 5,
        innovation: -2,
        mystery: -1,
      },
      {
        name: "Gradual Optimization",
        description: "Gradually optimize system while maintaining other development",
        worldEvolution: 1,
        stability: 3,
        innovation: 1,
        mystery: 0,
      },
      {
        name: "Innovation Breakthrough",
        description: "Try new solutions",
        worldEvolution: 2,
        stability: 1,
        innovation: 4,
        mystery: 2,
      },
    ],
  },
  {
    id: "diplomatic-contact",
    title: "Diplomatic Contact",
    description: "Received communication request from another world...",
    category: "diplomacy",
    icon: "🤝",
    options: [
      {
        name: "Positive Response",
        description: "Respond warmly, seek cooperation opportunities",
        worldEvolution: 3,
        stability: 2,
        innovation: 2,
        mystery: -3,
      },
      {
        name: "Cautious Communication",
        description: "Maintain distance but keep communication",
        worldEvolution: 1,
        stability: 3,
        innovation: 1,
        mystery: 1,
      },
      {
        name: "Reject Contact",
        description: "Maintain independence, reject external interference",
        worldEvolution: 0,
        stability: 2,
        innovation: 0,
        mystery: 3,
      },
    ],
  },
  {
    id: "tech-breakthrough",
    title: "Technology Breakthrough",
    description: "Research team discovered breakthrough technology...",
    category: "technology",
    icon: "🔬",
    options: [
      {
        name: "Full Throttle",
        description: "Invest all resources to advance new technology",
        worldEvolution: 4,
        stability: -2,
        innovation: 6,
        mystery: 2,
      },
      {
        name: "Safe Testing",
        description: "Test on small scale first, ensure safety",
        worldEvolution: 2,
        stability: 1,
        innovation: 3,
        mystery: -1,
      },
      {
        name: "Conservative Adoption",
        description: "Wait for more validation, adopt slowly",
        worldEvolution: 1,
        stability: 3,
        innovation: 1,
        mystery: -2,
      },
    ],
  },
  {
    id: "ancient-ruins",
    title: "Ancient Ruins",
    description: "Discovered mysterious ruins of an ancient civilization...",
    category: "exploration",
    icon: "🏛️",
    options: [
      {
        name: "Deep Exploration",
        description: "Dispatch archaeological team for deep exploration",
        worldEvolution: 2,
        stability: -1,
        innovation: 3,
        mystery: 4,
      },
      {
        name: "Protective Research",
        description: "Conduct protective research, dig carefully",
        worldEvolution: 1,
        stability: 2,
        innovation: 2,
        mystery: 2,
      },
      {
        name: "Keep Distance",
        description: "Keep ruins intact, do not interfere",
        worldEvolution: 0,
        stability: 3,
        innovation: 0,
        mystery: 3,
      },
    ],
  },
];

// Recommend scenarios based on current world state
export function getRecommendedScenarios(
  worldEvolution: number,
  stability: number,
  innovation: number,
  mystery: number
): DecisionScenario[] {
  const scenarios = [...decisionScenarios];
  
  // If stability is low, recommend crisis management scenario
  if (stability < 30) {
    const crisis = scenarios.find((s) => s.id === "crisis-management");
    if (crisis) {
      scenarios.sort((a, b) => {
        if (a.id === "crisis-management") return -1;
        if (b.id === "crisis-management") return 1;
        return 0;
      });
    }
  }
  
  // If innovation is high, recommend tech breakthrough scenario
  if (innovation > 70) {
    const tech = scenarios.find((s) => s.id === "tech-breakthrough");
    if (tech) {
      scenarios.sort((a, b) => {
        if (a.id === "tech-breakthrough") return -1;
        if (b.id === "tech-breakthrough") return 1;
        return 0;
      });
    }
  }
  
  return scenarios.slice(0, 4); // Return top 4 recommended scenarios
}
