const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { messages, mode } = req.body;

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

    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.Study,
      messages: messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key. Please check your Claude API key.' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
      } else if (response.status >= 500) {
        return res.status(500).json({ error: 'Claude API is temporarily unavailable. Please try again later.' });
      } else {
        return res.status(response.status).json({ error: errorData.error?.message || `API request failed with status ${response.status}` });
      }
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      return res.status(500).json({ error: 'Invalid response format from Claude API' });
    }

    res.json({
      content: data.content[0].text,
      usage: data.usage
    });

  } catch (error) {
    console.error('Claude API Proxy Error:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.status(500).json({ error: 'Network error. Please check your internet connection and try again.' });
    } else {
      res.status(500).json({ error: 'Failed to get response from Claude. Please try again.' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔗 Claude API proxy server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.REACT_APP_CLAUDE_API_KEY ? 'Configured' : 'Missing'}`);
});