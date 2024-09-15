// contentScript.js

console.log("Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "getTranscript") {
    const url = window.location.href;
    extractYouTubeTranscript(url).then((transcript) => {
      if (transcript) {
        console.log("Transcript fetched successfully.");
        sendResponse({ transcript });
      } else {
        console.error("Transcript not available.");
        sendResponse({ error: "Transcript not available." });
      }
    }).catch((error) => {
      console.error("Error in extractYouTubeTranscript:", error);
      sendResponse({ error: error.message });
    });
    return true; // Keep the messaging channel open for sendResponse
  }
});

async function extractYouTubeTranscript(url) {
  try {
    const response = await YoutubeTranscript.fetchTranscript(url);
    const texts = response.map(item => item.text);
    return texts.join(' ').replace(/&amp;#39;/g, "'");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return null;
  }
}