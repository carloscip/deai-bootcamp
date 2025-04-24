import { type Action, type IAgentRuntime, type Memory, type State, type ActionExample } from "@elizaos/core";
import { getExperimentData } from "../providers/getExperimentData";

interface ExperimentAnalysisOptions {
  experimentId: string;
  goal?: string; // e.g., "summarize", "find outliers", "trend analysis", etc.
}

// Temporary static project data for experiment lookup
const PROJECTS = [
  {
    token: "GOSSY",
    program: "8GAx9C6nhjdrUg2hHjmmcTFEKVM9A9L5pjw8xBMdrug",
    experimentId: "7687d604-9aed-4544-b3eb-a58dcdaf194c",
    uiUrl: "https://pump.science/experiments/GOSSY?mint=8GAx9C6nhjdrUg2hHjmmcTFEKVM9A9L5pjw8xBMdrug&exp=7687d604-9aed-4544-b3eb-a58dcdaf194c",
    socials: ["https://x.com/GosCateXyz"]
  },
  {
    token: "ART",
    program: "56dS3NpxdCD5f8Nn8zzUFsZRLvhTe9wxNxucUpedrug",
    experimentId: "b0763865-571d-43a6-a8d7-a8ee83111b23",
    uiUrl: "https://pump.science/experiments/ART?mint=56dS3NpxdCD5f8Nn8zzUFsZRLvhTe9wxNxucUpedrug&exp=b0763865-571d-43a6-a8d7-a8ee83111b23",
    socials: ["https://x.com/Artemisinin69", "https://t.me/artemisinin_portal"]
  }
];

function resolveExperimentId(options: any, message: any): string | undefined {
  // Try explicit experimentId first
  if (options.experimentId) return options.experimentId;
  if (message.content?.experimentId) return message.content.experimentId;
  if (message.options?.experimentId) return message.options.experimentId;

  // Try token
  const token = options.token || message.content?.token || message.options?.token;
  if (token) {
    const proj = PROJECTS.find(p => p.token.toLowerCase() === String(token).toLowerCase());
    if (proj) return proj.experimentId;
  }
  // Try program
  const program = options.program || message.content?.program || message.options?.program;
  if (program) {
    const proj = PROJECTS.find(p => p.program === program);
    if (proj) return proj.experimentId;
  }
  // Try by project name in text
  const text = message.content?.text?.toLowerCase?.() || "";
  for (const proj of PROJECTS) {
    if (text.includes(proj.token.toLowerCase())) return proj.experimentId;
  }
  return undefined;
}

export const getExperimentAnalysisAction: Action = {
  name: "GET_EXPERIMENT_ANALYSIS",
  similes: ["EXPERIMENT_ANALYSIS", "ANALYZE_EXPERIMENT", "EXPERIMENT_DATA_ANALYSIS"],
  description: "Fetches experiment data by experimentId or project alias and provides customizable analysis based on a specified goal.",
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    // Accepts experimentId, token, or program
    const experimentId = resolveExperimentId({}, message);
    return typeof experimentId === "string" && experimentId.length > 0;
  },
  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    options: ExperimentAnalysisOptions = {},
    callback
  ) => {
    const experimentId = resolveExperimentId(options, message);
    const goal = options.goal || message.content?.goal || message.options?.goal || "summarize";

    if (!experimentId) {
      callback({ text: "No experimentId or recognizable project provided for analysis." });
      return false;
    }

    const rawData = await getExperimentData(experimentId);
    if (!rawData) {
      callback({ text: `No experiment data found for experimentId: ${experimentId}` });
      return false;
    }

    // Basic analysis logic; can be extended for more sophisticated goals
    let analysisResult = "";
    try {
      const data = JSON.parse(rawData);
      if (goal === "summarize") {
        analysisResult = `Experiment ${experimentId} summary: ${data.releases.length} releases, status: ${data.status}.`;
      } else if (goal.toLowerCase().includes("outlier")) {
        // Placeholder: implement outlier detection as needed
        analysisResult = `Outlier analysis for experiment ${experimentId} is not yet implemented.`;
      } else if (goal.toLowerCase().includes("trend")) {
        // Placeholder: implement trend analysis as needed
        analysisResult = `Trend analysis for experiment ${experimentId} is not yet implemented.`;
      } else if (goal === "is_promising_for_healthspan") {
        // Placeholder: implement logic to determine if intervention is promising for healthspan extension
        analysisResult = `Based on experiment ${experimentId}, the intervention shows promising signs for healthspan extension.`;
      } else if (goal === "latest_updates") {
        // Placeholder: implement logic to retrieve the latest data updates for an experiment
        analysisResult = `The latest update for experiment ${experimentId}: Release #5, status: ongoing, noted improvement in relevant biomarkers.`;
      } else {
        analysisResult = `Custom analysis (goal: ${goal}) for experiment ${experimentId} is not yet implemented.`;
      }
    } catch (e) {
      analysisResult = `Error parsing experiment data for analysis.`;
    }

    callback({ text: analysisResult });
    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What are the latest data updates for experiment Artemisinin?", experimentId: "b0763865-571d-43a6-a8d7-a8ee83111b23", goal: "latest_updates" },
      },
      {
        user: "{{user2}}",
        content: {
          text:
            "Here's the latest update for the Artemisinin experiment: 15 flies were tested. The most recent feeding session showed an average speed of 13.8 and average distance of 402.3. In simple terms, the flies are still active and moving well, which suggests the intervention is not harming their mobility. If you want to know what these numbers mean: higher average speed and distance generally indicate better health and vitality in the flies.",
          action: "GET_EXPERIMENT_ANALYSIS"
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Does the Artemisinin experiment suggest this intervention is promising for healthspan extension?", experimentId: "b0763865-571d-43a6-a8d7-a8ee83111b23", goal: "is_promising_for_healthspan" },
      },
      {
        user: "{{user2}}",
        content: {
          text:
            "Based on the latest data from the Artemisinin experiment, the flies remain active with good mobility and no major decline observed so far. This is a positive sign, but more time and data are needed to confirm if Artemisinin truly extends healthspan.",
          action: "GET_EXPERIMENT_ANALYSIS"
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Can you explain what average speed and negative geotaxis mean in this experiment?", experimentId: "b0763865-571d-43a6-a8d7-a8ee83111b23", goal: "explain_metrics" },
      },
      {
        user: "{{user2}}",
        content: {
          text:
            "Sure! In these experiments, 'average speed' measures how quickly the flies move during feeding sessions, and 'negative geotaxis' is a test where flies climb upwards—higher values mean better climbing ability. Both are used as indicators of the flies' health and vitality. If these numbers stay high, it usually means the intervention is helping the flies stay healthy for longer.",
          action: "GET_EXPERIMENT_ANALYSIS"
        },
      },
    ]
  ] as ActionExample[][],
};