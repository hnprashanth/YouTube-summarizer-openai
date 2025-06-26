// Load shared utilities
if (typeof ValidationUtils === 'undefined') {
  const script = document.createElement('script');
  script.src = 'api-utils.js';
  document.head.appendChild(script);
}

// Initialize options page
document.addEventListener('DOMContentLoaded', initializeOptions);

function initializeOptions() {
  setupEventListeners();
  displayAllStoredValues();
}

function setupEventListeners() {
  document.getElementById("saveButton").addEventListener("click", handleSaveApiKey);
  document.getElementById("saveModelButton").addEventListener("click", handleSaveModel);
  document.getElementById("savePromptButton").addEventListener("click", handleSavePrompt);
  document.getElementById("saveTokenLimitButton").addEventListener("click", handleSaveTokenLimit);
}

// Save the API key with validation
function handleSaveApiKey() {
  try {
    const apiKey = document.getElementById("apiKeyInput").value.trim();
    ValidationUtils.validateApiKey(apiKey);
    
    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
      showStatus("API key saved successfully.", "success");
      displayStoredApiKey();
      document.getElementById("apiKeyInput").value = '';
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

// Save the selected model
function handleSaveModel() {
  try {
    const selectedModel = document.getElementById("modelSelection").value;
    if (!selectedModel) {
      throw new Error("Please select a model");
    }
    
    chrome.storage.sync.set({ selectedModel }, () => {
      showStatus("Model saved successfully.", "success");
      displayStoredModel();
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

// Save the custom prompt with validation
function handleSavePrompt() {
  try {
    const customPrompt = document.getElementById("customPrompt").value.trim();
    ValidationUtils.validatePrompt(customPrompt);
    
    chrome.storage.sync.set({ customPrompt }, () => {
      showStatus("Prompt saved successfully.", "success");
      displayStoredPrompt();
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

// Save the max token limit with validation
function handleSaveTokenLimit() {
  try {
    const tokenLimitInput = document.getElementById("maxTokenLimit").value;
    const tokenLimit = ValidationUtils.validateTokenLimit(tokenLimitInput);
    
    chrome.storage.sync.set({ maxTokenLimit: tokenLimit }, () => {
      showStatus("Token limit saved successfully.", "success");
      displayStoredTokenLimit();
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
  }
}

// Function to fetch and display the stored API key
function displayStoredApiKey() {
  chrome.storage.sync.get("openaiApiKey", (result) => {
    const apiKey = result.openaiApiKey;
    const displayText = apiKey ? maskApiKey(apiKey) : "No API key stored.";
    document.getElementById("storedApiKey").innerText = displayText;
  });
}

function maskApiKey(apiKey) {
  if (apiKey.length <= 8) return '*'.repeat(apiKey.length);
  return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4);
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
    const prompt = result.customPrompt || "Default prompt will be used";
    const displayText = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
    document.getElementById("storedPrompt").innerText = displayText;
  });
}

// Function to fetch and display the stored token limit
function displayStoredTokenLimit() {
  chrome.storage.sync.get("maxTokenLimit", (result) => {
    const tokenLimit = result.maxTokenLimit || 500;
    document.getElementById("storedTokenLimit").innerText = tokenLimit;
  });
}

function displayAllStoredValues() {
  displayStoredApiKey();
  displayStoredModel();
  displayStoredPrompt();
  displayStoredTokenLimit();
}

function showStatus(message, type) {
  const statusElement = document.getElementById("status");
  statusElement.innerText = message;
  statusElement.className = `status ${type}`;
  
  setTimeout(() => {
    statusElement.innerText = '';
    statusElement.className = 'status';
  }, 3000);
}