/**
 * Add your personal credentials for API access here
 */

// specify your API provider ("gemini" or "azure")
export const API_PROVIDER = process.env.API_PROVIDER;

// if applicable specify your Gemini credentials here
// Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR-GEMINI-API-KEY";
// Use a model compatible with the v1beta endpoint, like gemini-1.5-flash.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";


// if applicable specify your Azure credentials here
export const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT || "-";
export const AZURE_API_KEY = process.env.AZURE_API_KEY || "-";
export const AZURE_DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID || "-";
