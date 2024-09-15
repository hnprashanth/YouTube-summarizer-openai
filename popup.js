// popup.js

document.getElementById("summarizeButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
  
      if (tab.url.includes("youtube.com/watch")) {
        // Check if content script has already been injected
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => window.contentScriptInjected, // Check if already injected
          },
          (results) => {
            if (results[0].result) {
              // Content script already injected
              console.log("Content script already injected.");
              sendGetTranscriptMessage(tab.id);
            } else {
              // Inject the YouTube Transcript library
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  files: ['youtube-transcript.js'],
                },
                () => {
                  // Inject the content script
                  chrome.scripting.executeScript(
                    {
                      target: { tabId: tab.id },
                      files: ['contentScript.js'],
                    },
                    () => {
                      // Now send the message to the content script to get the transcript
                      sendGetTranscriptMessage(tab.id);
                    }
                  );
                }
              );
            }
          }
        );
      } else {
        document.getElementById("summary").innerText = "Please navigate to a YouTube video page.";
      }
    });
  });
  
  // Function to send a message to the content script to get the transcript
  function sendGetTranscriptMessage(tabId) {
    chrome.tabs.sendMessage(tabId, { action: "getTranscript" }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message to content script:", chrome.runtime.lastError);
        document.getElementById("summary").innerText = "Error: " + chrome.runtime.lastError.message;
        return;
      }
  
      if (!response) {
        console.error("No response received from content script.");
        document.getElementById("summary").innerText = "Error: No response from content script.";
        return;
      }
  
      console.log("Received response from content script:", response);
  
      if (response.error) {
        document.getElementById("summary").innerText = "Error: " + response.error;
      } else {
        const transcript = response.transcript;
        document.getElementById("summary").innerText = "Transcript fetched. Generating summary...";
  
        // Fetch the OpenAI API key
        chrome.storage.sync.get("openaiApiKey", async (items) => {
          const apiKey = items.openaiApiKey;
          if (!apiKey) {
            document.getElementById("summary").innerText = "Error: OpenAI API key not set.";
            return;
          }
  
          try {
            // Generate summary using OpenAI API
            const summary = await generateSummary(transcript, apiKey);
            document.getElementById("summary").innerText = summary;
          } catch (error) {
            console.error("Error summarizing transcript:", error);
            document.getElementById("summary").innerText = "Error: " + error.message;
          }
        });
      }
    });
  }
  
  // Add copy to clipboard functionality
  document.getElementById("copyButton").addEventListener("click", () => {
    const summaryText = document.getElementById("summary").innerText;
    if (summaryText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        // Display confirmation message
        const confirmationMessage = document.getElementById("copyConfirmation");
        confirmationMessage.innerText = "Summary copied to clipboard!";
        confirmationMessage.style.display = "block"; // Show the confirmation message
  
        // Hide the message after a few seconds
        setTimeout(() => {
          confirmationMessage.style.display = "none";
        }, 3000);
      }).catch((err) => {
        console.error("Failed to copy text: ", err);
        document.getElementById("copyConfirmation").innerText = "Failed to copy summary to clipboard.";
      });
    } else {
      document.getElementById("copyConfirmation").innerText = "No summary available to copy.";
    }
  });
  
  // Function to summarize the transcript using OpenAI API
  async function generateSummary(transcript, apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // or "gpt-4" if you have access
        messages: [{ role: "user", content: `Summarize the following transcript of a YouTube Video:\n\n${transcript}` }],
        max_tokens: 500, // Adjust token limit as needed
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