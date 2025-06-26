// background.js

// Load shared utilities
importScripts('api-utils.js');

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "summarize") {
    try {
      if (!request.transcript) {
        throw new Error("Transcript is required");
      }

      const summary = await OpenAIClient.generateSummary(request.transcript);
      sendResponse({ summary });
    } catch (error) {
      console.error("Error summarizing transcript:", error);
      const errorMessage = ErrorHandler.getErrorMessage(error);
      sendResponse({ error: errorMessage });
    }
  }
  return true; // Keep the messaging channel open for sendResponse
});