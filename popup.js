// popup.js

// Cache DOM elements
const elements = {
  summarizeButton: null,
  copyButton: null,
  summary: null,
  copyConfirmation: null
};

// Initialize popup
document.addEventListener('DOMContentLoaded', initializePopup);

function initializePopup() {
  try {
    // Cache DOM elements
    elements.summarizeButton = DOMUtils.getElement("summarizeButton");
    elements.copyButton = DOMUtils.getElement("copyButton");
    elements.summary = DOMUtils.getElement("summary");
    elements.copyConfirmation = DOMUtils.getElement("copyConfirmation");

    // Add event listeners
    elements.summarizeButton.addEventListener("click", handleSummarizeClick);
    elements.copyButton.addEventListener("click", handleCopyClick);
  } catch (error) {
    console.error('Failed to initialize popup:', error);
  }
}

async function handleSummarizeClick() {
  try {
    elements.summarizeButton.disabled = true;
    updateSummaryText("Processing...");

    const tabs = await getActiveTab();
    const tab = tabs[0];

    if (!isYouTubeVideoPage(tab.url)) {
      throw new Error("Please navigate to a YouTube video page.");
    }

    await ensureScriptsInjected(tab.id);
    await processTranscriptAndSummarize(tab.id);
  } catch (error) {
    console.error('Summarize error:', error);
    updateSummaryText(`Error: ${ErrorHandler.getErrorMessage(error)}`);
  } finally {
    elements.summarizeButton.disabled = false;
  }
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, resolve);
  });
}

function isYouTubeVideoPage(url) {
  return url && url.includes("youtube.com/watch");
}

async function ensureScriptsInjected(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.contentScriptInjected
  });

  if (!results[0].result) {
    await injectScripts(tabId);
  }
}

async function injectScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['api-utils.js']
  });
  
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['youtube-transcript.js']
  });
  
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['contentScript.js']
  });
}

async function processTranscriptAndSummarize(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: "getTranscript" }, async (response) => {
      try {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }

        if (!response) {
          throw new Error("No response from content script");
        }

        if (response.error) {
          throw new Error(response.error);
        }

        if (!response.transcript) {
          throw new Error("No transcript received");
        }

        updateSummaryText("Transcript fetched. Generating summary...");
        
        const summary = await OpenAIClient.generateSummary(response.transcript);
        updateSummaryText(summary);
        resolve(summary);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function updateSummaryText(text) {
  if (elements.summary) {
    elements.summary.innerText = text;
  }
}

async function handleCopyClick() {
  try {
    const summaryText = elements.summary.innerText;
    
    if (!summaryText || summaryText.includes('Error:') || summaryText.includes('Processing')) {
      throw new Error('No valid summary available to copy');
    }

    await navigator.clipboard.writeText(summaryText);
    showCopyConfirmation('Summary copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showCopyConfirmation('Failed to copy summary', 'error');
  }
}

function showCopyConfirmation(message, type) {
  if (elements.copyConfirmation) {
    elements.copyConfirmation.innerText = message;
    elements.copyConfirmation.className = type;
    elements.copyConfirmation.style.display = 'block';
    
    setTimeout(() => {
      elements.copyConfirmation.style.display = 'none';
    }, 3000);
  }
}

// Load shared utilities
if (typeof DOMUtils === 'undefined') {
  const script = document.createElement('script');
  script.src = 'api-utils.js';
  document.head.appendChild(script);
}