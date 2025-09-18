/**
 * Add your personal credentials for API access here
 */

// specify your API provider ("gemini" or "azure")
export const API_PROVIDER = process.env.REACT_APP_API_PROVIDER || undefined;

// if applicable specify your Gemini credentials here
// Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || undefined;

// Use a model compatible with the v1beta endpoint, like gemini-1.5-flash.
export const GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || undefined;


// if applicable specify your Azure credentials here
export const AZURE_ENDPOINT = process.env.REACT_APP_AZURE_ENDPOINT || "-";
export const AZURE_API_KEY = process.env.REACT_APP_AZURE_API_KEY || "-";
export const AZURE_DEPLOYMENT_ID = process.env.REACT_APP_AZURE_DEPLOYMENT_ID || "-";
