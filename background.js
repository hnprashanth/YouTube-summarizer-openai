// background.js

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "summarize") {
      const transcript = request.transcript;
      const apiKey = await getApiKey();
  
      if (!apiKey) {
        sendResponse({ error: "API key not set." });
        return;
      }
  
      try {
        const summary = await getSummary(transcript, apiKey);
        sendResponse({ summary });
      } catch (error) {
        console.error("Error summarizing transcript:", error);
        sendResponse({ error: error.message });
      }
    }
    return true; // Keep the messaging channel open for sendResponse
  });
  
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("openaiApiKey", (items) => {
        resolve(items.openaiApiKey);
      });
    });
  }
  
  async function getSummary(text, apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // or "gpt-4" if you have access
        messages: [{ role: "user", content: `Summarize the following text:\n\n${text}` }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message);
    }
  
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }