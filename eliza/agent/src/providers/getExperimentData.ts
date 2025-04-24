import NodeCache from "node-cache";
import { elizaLogger } from "@elizaos/core";

const cache = new NodeCache({ stdTTL: 30 * 60 }); // 30 minutes

/**
 * Fetches and caches experiment data for a given experimentId (returns detailed JSON summary for analysis)
 * @param experimentId The experiment UUID string
 * @returns JSON string with detailed experiment data
 */
export async function getExperimentData(experimentId: string): Promise<string> {
    if (!experimentId || typeof experimentId !== "string") {
        elizaLogger.error("No experimentId provided to getExperimentData");
        return "";
    }
    const cacheKey = `experiment-data-${experimentId}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
        elizaLogger.info(`Returning cached experiment data for ${experimentId}`);
        return cached;
    }
    const apiUrl = `https://pump.science/api/databaseReleasesApi?exp=${experimentId}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            elizaLogger.error(`Pump Science API error: ${response.status}`);
            return "";
        }
        const data = await response.json();
        if (!data.releases || !Array.isArray(data.releases)) {
            elizaLogger.warn("Pump Science API: No releases found for experiment");
            return "";
        }
        // Return a detailed JSON summary for downstream analysis
        // Only exclude video URLs for compactness, but preserve all other fields
        const releases = data.releases.map((release: any) => {
            const { video, ...rest } = release;
            return rest;
        });
        const result = JSON.stringify({
            experiment_id: experimentId,
            releases,
            status: data.status,
            message: data.message
        }, null, 2);
        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        elizaLogger.error("Error fetching experiment data", error);
        return "";
    }
}