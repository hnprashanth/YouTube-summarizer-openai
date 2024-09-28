// Save the API key
document.getElementById("saveButton").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKeyInput").value.trim();
  if (apiKey) {
    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
      document.getElementById("status").innerText = "API key saved.";
      displayStoredApiKey(); // Refresh the displayed key after saving
    });
  }
});

// Save the selected model
document.getElementById("saveModelButton").addEventListener("click", () => {
  const selectedModel = document.getElementById("modelSelection").value;
  chrome.storage.sync.set({ selectedModel: selectedModel }, () => {
    document.getElementById("status").innerText = "Model saved.";
    displayStoredModel(); // Refresh the displayed model after saving
  });
});

// Save the custom prompt
document.getElementById("savePromptButton").addEventListener("click", () => {
  const customPrompt = document.getElementById("customPrompt").value.trim();
  chrome.storage.sync.set({ customPrompt: customPrompt }, () => {
    document.getElementById("status").innerText = "Prompt saved.";
    displayStoredPrompt(); // Refresh the displayed prompt after saving
  });
});

// Save the max token limit
document.getElementById("saveTokenLimitButton").addEventListener("click", () => {
  const tokenLimit = parseInt(document.getElementById("maxTokenLimit").value);
  if (tokenLimit > 0) {
    chrome.storage.sync.set({ maxTokenLimit: tokenLimit }, () => {
      document.getElementById("status").innerText = "Token limit saved.";
      displayStoredTokenLimit(); // Refresh the displayed token limit after saving
    });
  }
});

// Function to fetch and display the stored API key
function displayStoredApiKey() {
  chrome.storage.sync.get("openaiApiKey", (result) => {
    const apiKey = result.openaiApiKey || "No API key stored.";
    document.getElementById("storedApiKey").innerText = apiKey.replace(/.(?=.{4})/g, '*'); // Mask all but last 4 characters
  });
}

// Function to fetch and display the stored model
function displayStoredModel() {
  chrome.storage.sync.get("selectedModel", (result) => {
    const model = result.selectedModel || "GPT-4o (default)";
    document.getElementById("storedModel").innerText = model;
  });
}

// Function to fetch and display the stored custom prompt
function displayStoredPrompt() {
  chrome.storage.sync.get("customPrompt", (result) => {
    const prompt = result.customPrompt || "Summarize the following text:";
    document.getElementById("storedPrompt").innerText = prompt;
  });
}

// Function to fetch and display the stored token limit
function displayStoredTokenLimit() {
  chrome.storage.sync.get("maxTokenLimit", (result) => {
    const tokenLimit = result.maxTokenLimit || 150;
    document.getElementById("storedTokenLimit").innerText = tokenLimit;
  });
}

// Display the stored API key, model, prompt, and token limit when the options page loads
displayStoredApiKey();
displayStoredModel();
displayStoredPrompt();
displayStoredTokenLimit();