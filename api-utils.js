// api-utils.js - Shared API utilities and configuration

const API_CONFIG = {
  OPENAI_ENDPOINT: "https://api.openai.com/v1/chat/completions",
  DEFAULT_MODEL: "gpt-4o",
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 500,
  DEFAULT_PROMPT: "Summarize the following transcript of a YouTube Video:"
};

const VALIDATION = {
  MIN_TOKEN_LIMIT: 50,
  MAX_TOKEN_LIMIT: 4000,
  MIN_API_KEY_LENGTH: 20
};

// Centralized storage management
class StorageManager {
  static async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, resolve);
    });
  }

  static async set(items) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(items, resolve);
    });
  }

  static async getApiKey() {
    const { openaiApiKey } = await this.get("openaiApiKey");
    return openaiApiKey;
  }

  static async getConfig() {
    const config = await this.get([
      "selectedModel", 
      "customPrompt", 
      "maxTokenLimit"
    ]);
    
    return {
      model: config.selectedModel || API_CONFIG.DEFAULT_MODEL,
      prompt: config.customPrompt || API_CONFIG.DEFAULT_PROMPT,
      maxTokens: config.maxTokenLimit || API_CONFIG.DEFAULT_MAX_TOKENS
    };
  }
}

// Input validation utilities
class ValidationUtils {
  static validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required');
    }
    if (apiKey.length < VALIDATION.MIN_API_KEY_LENGTH) {
      throw new Error('Invalid API key format');
    }
    return true;
  }

  static validateTokenLimit(tokenLimit) {
    const tokens = parseInt(tokenLimit);
    if (isNaN(tokens) || tokens < VALIDATION.MIN_TOKEN_LIMIT || tokens > VALIDATION.MAX_TOKEN_LIMIT) {
      throw new Error(`Token limit must be between ${VALIDATION.MIN_TOKEN_LIMIT} and ${VALIDATION.MAX_TOKEN_LIMIT}`);
    }
    return tokens;
  }

  static validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }
    return prompt.trim();
  }
}

// Centralized OpenAI API client
class OpenAIClient {
  static async generateSummary(transcript, options = {}) {
    const apiKey = await StorageManager.getApiKey();
    ValidationUtils.validateApiKey(apiKey);

    const config = await StorageManager.getConfig();
    const finalConfig = { ...config, ...options };

    const response = await fetch(API_CONFIG.OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalConfig.model,
        messages: [{
          role: "user", 
          content: `${finalConfig.prompt}\n\n${transcript}`
        }],
        max_tokens: finalConfig.maxTokens,
        temperature: API_CONFIG.DEFAULT_TEMPERATURE,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return data.choices[0].message.content.trim();
  }
}

// Error handling utilities
class ErrorHandler {
  static getErrorMessage(error) {
    if (error.message) {
      return error.message;
    }
    return 'An unknown error occurred';
  }

  static isRateLimitError(error) {
    return error.message && error.message.includes('rate limit');
  }

  static isAuthError(error) {
    return error.message && (
      error.message.includes('authorization') || 
      error.message.includes('invalid') ||
      error.message.includes('API key')
    );
  }
}

// DOM utilities
class DOMUtils {
  static getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element;
  }

  static setElementText(id, text) {
    this.getElement(id).innerText = text;
  }

  static setElementDisplay(id, display) {
    this.getElement(id).style.display = display;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_CONFIG,
    VALIDATION,
    StorageManager,
    ValidationUtils,
    OpenAIClient,
    ErrorHandler,
    DOMUtils
  };
}