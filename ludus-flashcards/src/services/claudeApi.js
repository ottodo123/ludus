// Claude API Service
// This handles communication with Claude API for the Sentences page

const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;
const CLAUDE_API_URL = process.env.REACT_APP_CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

// Check if API key is configured
const isApiKeyConfigured = () => {
  return CLAUDE_API_KEY && CLAUDE_API_KEY !== 'your_api_key_here';
};

// System prompts for different modes
const SYSTEM_PROMPTS = {
  Study: `You are a Latin tutor helping students practice with vocabulary and grammar they've already learned. 
Your role is to:
- Use only Latin words and grammar concepts the student has encountered before
- Create practice sentences, translations, and exercises
- Provide encouragement and corrections
- Ask follow-up questions to reinforce learning
- Keep responses concise and focused on practice

Be encouraging and patient. If the student makes mistakes, gently correct them and explain why.`,

  Learn: `You are a Latin tutor introducing new vocabulary and grammar concepts one at a time.
Your role is to:
- Introduce ONE new Latin word or grammar concept per response
- Provide clear explanations with examples
- Use simple Latin that builds on previous knowledge
- Offer opportunities to save new words to their collection
- Progress slowly and ensure understanding before moving on

Always introduce only one new concept at a time and check for understanding.`
};

// Call Claude API
export const callClaudeAPI = async (messages, mode = 'Study', userProgress = null) => {
  if (!isApiKeyConfigured()) {
    throw new Error('Claude API key not configured. Please add your API key to the .env file.');
  }

  try {
    // Prepare the conversation history for Claude
    const claudeMessages = messages
      .filter(msg => msg.type !== 'system') // Remove any system messages
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    const requestBody = {
      model: 'claude-3-haiku-20240307', // Using Haiku for faster responses
      max_tokens: 1000,
      system: SYSTEM_PROMPTS[mode],
      messages: claudeMessages
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Claude API key in the .env file.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Claude API is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }

    return {
      content: data.content[0].text,
      usage: data.usage
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    
    // Re-throw known errors
    if (error.message.includes('API key') || 
        error.message.includes('Rate limit') || 
        error.message.includes('temporarily unavailable')) {
      throw error;
    }
    
    // Network or other errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Generic error
    throw new Error('Failed to get response from Claude. Please try again.');
  }
};

// Helper function to check API status
export const checkApiStatus = () => {
  return {
    configured: isApiKeyConfigured(),
    apiKey: CLAUDE_API_KEY ? `${CLAUDE_API_KEY.substring(0, 8)}...` : 'Not set'
  };
};

// Extract any new words that Claude might mention for saving
export const extractNewWords = (claudeResponse) => {
  // This is a simple implementation - you might want to make this more sophisticated
  const wordPattern = /\*\*([\w\s]+)\*\*.*?(?:means?|is|definition|translation).*?"([^"]+)"/gi;
  const words = [];
  let match;
  
  while ((match = wordPattern.exec(claudeResponse)) !== null) {
    words.push({
      latin: match[1].trim(),
      english: match[2].trim(),
      source: 'Claude AI - Learn Mode',
      timestamp: new Date().toISOString()
    });
  }
  
  return words;
};