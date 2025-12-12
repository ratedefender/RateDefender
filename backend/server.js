require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const mongoose = require('mongoose');
const OpenAI = require('openai');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(mongoSanitize());
app.use(compression());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

const PORT = process.env.PORT || 3000;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratedb';
  try {
    await mongoose.connect(uri, { keepAlive: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB connection failed:', err.message);
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.post('/api/predict', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!process.env.OPENAI_API_KEY) return res.status(501).json({ error: 'OpenAI API key not configured' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const text = completion?.choices?.[0]?.message?.content ?? '';
    res.json({ result: text });
  } catch (err) {
    console.error('OpenAI error', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
