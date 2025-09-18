/**
 * Implements a helper function to handle communication with the Google Gemini API.
 * This FINAL version is updated to match the latest Gemini API standards.
 */
import { API_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL } from '../../env';

// --- Configuration ---
const MAX_RETRIES = 3;
const RATE_LIMIT_INTERVAL_MS = 2000; // Gemini 1.5 Flash has a very high limit (3000 RPM)

// --- State for Queueing & Throttling ---
const requestQueue = [];
let isProcessing = false;

// --- Credential Check ---
if (API_PROVIDER !== "gemini" || !GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("CRITICAL ERROR: Gemini API key is not configured in src/env.js");
}

/**
 * Transforms an OpenAI-style message array into the Gemini API's `contents` format.
 */
function transformMessagesToGemini(messages) {
    const contents = [];
    messages.forEach(msg => {
        const role = (msg.role === 'assistant') ? 'model' : 'user';
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts.push({ text: msg.content });
        } else {
            contents.push({ role: role, parts: [{ text: msg.content }] });
        }
    });
    return contents;
}

/**
 * The core function that makes the API call to Gemini.
 */
async function performFetchWithRetries(requestData, attempt = 1) {
    const contents = transformMessagesToGemini(requestData);
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // CORRECTED: Using the X-Goog-Api-Key header for authentication.
                'X-Goog-Api-Key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: contents,
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            const error = new Error(`API request failed with status ${response.status}: ${errorBody}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text === undefined) {
            console.error("Invalid response structure from Gemini:", data);
            throw new Error("Could not extract text from Gemini response.");
        }
        return text;

    } catch (error) {
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt >= MAX_RETRIES) {
            throw new Error(`API call failed after ${MAX_RETRIES} attempts.`);
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return performFetchWithRetries(requestData, attempt + 1);
    }
}

/**
 * Processes the next request in the queue.
 */
async function processQueue() {
    if (requestQueue.length === 0) {
        isProcessing = false;
        return;
    }
    isProcessing = true;
    const { requestData, resolve, reject } = requestQueue.shift();
    try {
        const result = await performFetchWithRetries(requestData);
        resolve(result);
    } catch (error) {
        reject(error);
    }
    setTimeout(processQueue, RATE_LIMIT_INTERVAL_MS);
}

/**
 * Main public function. Adds a request to the queue.
 */
function llmQuery(requestData) {
    return new Promise((resolve, reject) => {
        requestQueue.push({ requestData, resolve, reject });
        if (!isProcessing) {
            processQueue();
        }
    });
}

export default llmQuery;
