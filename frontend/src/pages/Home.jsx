import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AdSpace from '../components/AdSpace';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
  const [formData, setFormData] = useState({
    myLocation: 'India',
    clientLocation: 'USA',
    currentRate: '25'
  });
  const [result, setResult] = useState(null);

  const handleCalculate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to calculate. Check if backend is running.');
    }
  };

  return (
    <div className="container">
      <Helmet>
        <title>Freelance Rate Calculator | Rate Defender</title>
        <meta name="description" content="Calculate fair freelance rates adjusted for PPP" />
      </Helmet>

      <header className="hero">
        <h1>💰 Freelance Rate Defender</h1>
        <p className="subtitle">Calculate your fair rate adjusted for purchasing power</p>
      </header>

      <AdSpace dataAdSlot="1234567890" style={{ height: '90px' }} />

      <section className="calculator-card">
        <h2>Calculate Your Fair Rate</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Your Location</label>
            <select 
              value={formData.myLocation}
              onChange={(e) => setFormData({...formData, myLocation: e.target.value})}
              className="select-input"
            >
              <option value="India">India</option>
              <option value="Philippines">Philippines</option>
              <option value="USA">USA</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>

          <div className="form-group">
            <label>Client's Location</label>
            <select 
              value={formData.clientLocation}
              onChange={(e) => setFormData({...formData, clientLocation: e.target.value})}
              className="select-input"
            >
              <option value="USA">USA</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          <div className="form-group">
            <label>Your Current Rate ($/hour)</label>
            <input
              type="number"
              value={formData.currentRate}
              onChange={(e) => setFormData({...formData, currentRate: e.target.value})}
              className="text-input"
            />
          </div>
        </div>

        <button onClick={handleCalculate} className="btn-primary">
          🚀 Calculate Fair Rate
        </button>
      </section>

      {result && (
        <section className="result-card">
          <h2>📊 Your Analysis</h2>
          <div className="result-grid">
            <div className="stat-box primary">
              <div className="stat-label">Fair Rate</div>
              <div className="stat-value">${result.fairRate}</div>
            </div>
          </div>
          <p>{result.message}</p>
        </section>
      )}

      <footer className="footer">
        <p>Made for freelancers 💙</p>
      </footer>
    </div>
  );
};

export default Home;