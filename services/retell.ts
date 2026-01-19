

import { CallLog } from "../types";

const RETELL_API_URL = "https://api.retellai.com";
const CORS_PROXY = "https://corsproxy.io/?"; 

/**
 * Fetches call logs from Retell API with robust error diagnostics.
 * Uses V2 Endpoint: https://api.retellai.com/v2/list-calls
 */
export const fetchRetellCalls = async (apiKey: string, agentId?: string, limit: number = 50): Promise<CallLog[]> => {
    const cleanKey = apiKey.trim();
    const cleanAgentId = agentId?.trim();

    const getHeaders = {
        "Authorization": `Bearer ${cleanKey}`,
        "Content-Type": "application/json"
    };

    // Helper to execute request with CORS fallback
    const executeFetch = async (url: string) => {
        try {
            // Try direct first
            const res = await fetch(url, { method: "GET", headers: getHeaders });
            return res;
        } catch (e) {
            // Fallback to proxy
            console.warn("Direct fetch failed, attempting proxy...");
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            return fetch(proxyUrl, { method: "GET", headers: getHeaders });
        }
    };

    // Primary Fetch Function
    const performRequest = async (useAgentFilter: boolean) => {
        const url = new URL(`${RETELL_API_URL}/v2/list-calls`);
        if (useAgentFilter && cleanAgentId) {
            url.searchParams.append("filter_agent_id", cleanAgentId);
        }
        url.searchParams.append("limit", limit.toString());
        url.searchParams.append("sort_order", "descending");

        const response = await executeFetch(url.toString());
        
        if (response.status === 401) {
            throw new Error("Authentication Failed: Invalid API Key.");
        }

        if (!response.ok) {
            let errText = await response.text().catch(() => response.statusText);
            
            // Check for HTML error response (common with 404s on wrong paths)
            if (errText.includes("<!DOCTYPE html>") || errText.includes("Cannot GET")) {
                 console.error("Retell API returned HTML error:", errText);
                 throw new Error(`API Endpoint Error (${response.status}): Unable to reach Retell V2 API.`);
            }

            // Try to parse JSON error from Retell
            try {
                const jsonErr = JSON.parse(errText);
                if (jsonErr.message) errText = jsonErr.message;
            } catch (e) {
                // text is plain string
            }

            throw new Error(errText); 
        }

        return response;
    };

    try {
        // Attempt 1: Fetch with Agent ID (if provided)
        let response = await performRequest(!!cleanAgentId);
        
        const data = await response.json();
        // Retell V2 returns data array directly usually, or { calls: [] }
        const rawCalls = Array.isArray(data) ? data : (data.calls || []);
        return mapResponseToCallLogs(rawCalls);

    } catch (e: any) {
        const msg = (e.message || e.toString()).toLowerCase();

        // If the error is about the Agent ID not existing, verify key without agent ID
        if (cleanAgentId && (msg.includes("agent") || msg.includes("exist") || msg.includes("found"))) {
            console.warn("Agent ID specific fetch failed. Verifying API Key validity...");
            try {
                const fallbackResponse = await performRequest(false); // No Agent Filter
                if (fallbackResponse.ok) {
                    return [];
                }
            } catch (fallbackError) {
                throw fallbackError; 
            }
        }

        // Pass through specific known errors
        if (msg.includes("authentication")) throw new Error("Authentication Failed: Invalid API Key.");
        if (msg.includes("network") || msg.includes("failed to fetch")) {
            throw new Error("Network Error: Connection blocked. Please disable Adblock/VPN or check CORS settings.");
        }
        
        throw e;
    }
};

// --- Mappers ---

const formatDuration = (ms: number): string => {
    if (!ms) return "0s";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
};

const determineSentiment = (sentimentObj: any): number => {
    const s = String(sentimentObj || '').toLowerCase();
    if (s.includes("positive") || s.includes("happy") || s.includes("excited")) return 0.9;
    if (s.includes("negative") || s.includes("angry") || s.includes("frustrated")) return -0.8;
    if (s.includes("neutral")) return 0.0;
    return 0.1; // Default slightly positive bias for unknown
};

const mapTranscript = (transcriptObj: any): { speaker: 'AI' | 'USER'; text: string; time: string }[] => {
    if (Array.isArray(transcriptObj)) {
        return transcriptObj.map((t: any, i: number) => ({
            speaker: (t.role === 'agent' || t.role === 'ai_agent') ? 'AI' : 'USER',
            text: t.content,
            time: `Turn ${i+1}`
        }));
    }
    if (typeof transcriptObj === 'string') {
        return [{ speaker: 'AI', text: transcriptObj, time: "Full Text" }];
    }
    return [];
};

const extractTopics = (summary: string): string[] => {
    if (!summary) return [];
    const keywords = ['Appointment', 'Pricing', 'Complaint', 'Inquiry', 'Support', 'Sales', 'Voicemail', 'Booking', 'Follow-up'];
    return keywords.filter(k => summary.includes(k));
};

const mapResponseToCallLogs = (data: any[]): CallLog[] => {
    return data.map((call: any) => {
        const analysis = call.call_analysis || {};
        
        return {
            id: call.call_id,
            caller: call.from_number || call.to_number || 'Unknown',
            duration: formatDuration(call.duration_ms),
            durationSeconds: Math.round((call.duration_ms || 0) / 1000),
            outcome: analysis.call_outcome || call.call_status || 'PROCESSING',
            sentiment: determineSentiment(analysis.user_sentiment || analysis.call_sentiment), 
            summary: analysis.call_summary || 'Processing neural transcript...',
            transcript: mapTranscript(call.transcript_object),
            timestamp: new Date(call.start_timestamp).toLocaleString(),
            topics: extractTopics(analysis.call_summary || ''),
            audioUrl: call.recording_url,
            agentId: call.agent_id,
            cost: (call.cost_metadata?.total_cost || 0) / 100 
        };
    });
};
