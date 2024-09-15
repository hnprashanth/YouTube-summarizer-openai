// options.js

document.getElementById("saveButton").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKeyInput").value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
        document.getElementById("status").innerText = "API key saved.";
      });
    }
  });