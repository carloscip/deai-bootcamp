// node --loader ts-node/esm agent/src/providers/testGetExperimentData.ts

import { getExperimentData } from "./getExperimentData";

async function main() {
    const experimentId = "7687d604-9aed-4544-b3eb-a58dcdaf194c"; 
    const result = await getExperimentData(experimentId);
    console.log("--- Experiment Data Output ---\n" + result);
}

main().catch((err) => {
    console.error("Error running testGetExperimentData:", err);
});
