require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

const pppRates = {
  "USA": 1.0,
  "United Kingdom": 0.88,
  "Canada": 0.91,
  "Australia": 0.93,
  "Germany": 0.85,
  "India": 0.28,
  "Philippines": 0.34,
  "Pakistan": 0.24,
  "Vietnam": 0.32,
  "Nigeria": 0.38,
  "Brazil": 0.48,
  "Mexico": 0.51
};

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/countries', (req, res) => {
  const countries = Object.keys(pppRates).sort();
  res.json({ countries });
});

app.post('/api/calculate', (req, res) => {
  try {
    const { myLocation, clientLocation, currentRate } = req.body;
    
    if (!myLocation || !clientLocation || !currentRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const rate = parseFloat(currentRate);
    if (isNaN(rate) || rate <= 0) {
      return res.status(400).json({ error: 'Invalid rate' });
    }

    const myFactor = pppRates[myLocation] || 1.0;
    const clientFactor = pppRates[clientLocation] || 1.0;
    
    const fairRate = ((rate / myFactor) * clientFactor).toFixed(2);
    const percentageChange = (((fairRate - rate) / rate) * 100).toFixed(1);
    const purchasingPowerRatio = (clientFactor / myFactor).toFixed(2);

    res.json({
      fairRate: parseFloat(fairRate),
      currentRate: parseFloat(rate),
      percentageChange: parseFloat(percentageChange),
      purchasingPowerRatio: parseFloat(purchasingPowerRatio),
      message: `Your $${rate} has ${purchasingPowerRatio}x purchasing power in ${clientLocation}`,
      insight: percentageChange > 0 
        ? `You could charge $${fairRate} to maintain equivalent value`
        : `Your rate is already competitive for ${clientLocation}`
    });
    
  } catch (err) {
    console.error('Calculate error:', err);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPass) {
    res.json({ success: true, token: 'test-token-123' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
