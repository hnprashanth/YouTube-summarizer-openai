// contentScript.js

// Mark script as injected to prevent duplicate injections
window.contentScriptInjected = true;

console.log("Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "getTranscript") {
    handleTranscriptRequest(sendResponse);
    return true; // Keep the messaging channel open for sendResponse
  }
});

async function handleTranscriptRequest(sendResponse) {
  try {
    const url = window.location.href;
    
    if (!isYouTubeVideoPage(url)) {
      throw new Error("Not a valid YouTube video page");
    }

    const transcript = await extractYouTubeTranscript(url);
    
    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript not available for this video");
    }

    console.log("Transcript fetched successfully.");
    sendResponse({ transcript });
  } catch (error) {
    console.error("Error getting transcript:", error);
    sendResponse({ error: error.message });
  }
}

function isYouTubeVideoPage(url) {
  return url && url.includes("youtube.com/watch?v=");
}

async function extractYouTubeTranscript(url) {
  try {
    const response = await YoutubeTranscript.fetchTranscript(url);
    
    if (!response || response.length === 0) {
      return null;
    }

    const texts = response.map(item => item.text || '');
    const transcript = texts.join(' ')
      .replace(/&amp;#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();
    
    return transcript;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}