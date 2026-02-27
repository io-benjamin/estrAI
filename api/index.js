const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('../node_modules/axios/index.d.cts');
const buildPrompt = require('./promptBuilder');

dotenv.config({ path: path.resolve(__dirname, '../.env') });  // LOAD ENV FIRST

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST;
const DEFAULT_BUSINESS = process.env.BUSINESS_PROFILE || 'tacontigo';

console.log('Loaded env vars:', { PORT, OLLAMA_HOST, DEFAULT_BUSINESS });  // DEBUG

app.post('/ask', async (req, res) => {
  const { prompt, business } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  const selectedBusiness = business || DEFAULT_BUSINESS;

  let finalPrompt;
  try {
    finalPrompt = buildPrompt(prompt, selectedBusiness);
  } catch (e) {
    console.error('Error building prompt:', e);
    return res.status(500).json({ error: 'Prompt building failed', details: e.message });
  }

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: 'mistral',
        prompt: finalPrompt,
        stream: false
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.json({ response: response.data.response });
  } catch (err) {
    console.log('Calling Ollama API at:', `${OLLAMA_HOST}/api/generate`);
    console.error('Error calling Ollama:', err.response?.data || err.message);
    res.status(500).json({ error: 'Ollama API call failed', details: err.message });
  }
});

// app.post('/summary', async (req, res) => {
//     const { prompt } = req.body;

//     const wrappedPrompt = `
// You are an assistant to me, estrAI — a family-owned taco truck in Virginia that provides catering for parties, weddings, company events, and festivals.
// The following message was received from a potential customer:
// "${prompt}"
// Send me a small summary of the message, including the key details that I would need to know to follow up with the customer. Keep it short and to the point, just a few sentences.
// `;

//     try {
//         const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
//             model: 'mistral',
//             prompt: wrappedPrompt,
//             stream: false
//         }, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         const data = response.data;
//         res.json({ response: data.response });

//     } catch (error) {
//         console.error('Error calling Ollama:', error.message);
//         res.status(500).json({ error: 'Failed to call Ollama' });
//     }
// });

app.listen(PORT, () => {
    console.log(`estrAI Agent is live at http://localhost:${PORT}`);
});
