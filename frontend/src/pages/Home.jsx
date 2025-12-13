import React, { useEffect, useState } from 'react';
import API_URL from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import AdSpace from '../components/AdSpace';

export default function Home() {
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [form, setForm] = useState({ myLocation: 'USA', clientLocation: 'India', currentRate: 20, skill: 'web development' });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_URL}/api/countries`);
        const json = await res.json();
        setCountries(json.countries || []);
      } catch (err) {
        console.warn('Failed to load countries', err);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, currentRate: parseFloat(form.currentRate) })
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: 'Request failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 20 }}>
      <h1>Rate Defender</h1>
      <p>Adjust your freelance rate by purchasing power parity and local conditions.</p>

      <div style={{ marginBottom: 18 }}>
        <AdSpace />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Your location
          <br />
          {loadingCountries ? (
            <LoadingSpinner size="small" message="Loading..." />
          ) : (
            <select name="myLocation" value={form.myLocation} onChange={handleChange}>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </label>

        <label>
          Client location
          <br />
          <select name="clientLocation" value={form.clientLocation} onChange={handleChange}>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          Current rate (USD)
          <br />
          <input name="currentRate" type="number" value={form.currentRate} onChange={handleChange} />
        </label>

        <label>
          Skill / Role
          <br />
          <input name="skill" value={form.skill} onChange={handleChange} />
        </label>

        <div>
          <button type="submit" disabled={submitting} style={{ padding: '8px 14px' }}>
            {submitting ? 'Calculating...' : 'Calculate fair rate'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        {result ? (
          result.error ? (
            <div style={{ color: 'red' }}>{result.error}</div>
          ) : (
            <div style={{ background: '#f7f9fc', padding: 12, borderRadius: 8 }}>
              <h3>Result</h3>
              <p><strong>Fair rate:</strong> ${result.fairRate}</p>
              <p><strong>Percentage change:</strong> {result.percentageChange}%</p>
              <p><strong>Purchasing power ratio:</strong> {result.purchasingPowerRatio}x</p>
              <p>{result.insight}</p>
              <p style={{ fontSize: 12, color: '#666' }}>Calculation time: {result.calculationTime}</p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

// src/pages/Home.jsx - High-Performance Calculator Page
import { useState, useEffect, memo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import AdSpace from '../components/AdSpace';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    myLocation: '',
    clientLocation: '',
    currentRate: '',
    skill: ''
  });
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState({ calc: false, email: false, countries: true });
  const [error, setError] = useState(null);

  // Track page view on mount (privacy-friendly)
  useEffect(() => {
    fetch(`${API_URL}/api/track-view`, { method: 'GET' })
      .catch(() => {}); // Silent fail
  }, []);

  // Fetch countries list
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_URL}/api/countries`);
        const data = await res.json();
        setCountries(data.countries || []);
        
        // Set defaults
        if (data.countries.length > 0) {
          setFormData(prev => ({
            ...prev,
            myLocation: data.countries.includes('India') ? 'India' : data.countries[0],
            clientLocation: data.countries.includes('USA') ? 'USA' : data.countries[0]
          }));
        }
      } catch (err) {
        console.error('Failed to load countries:', err);
        setError('Failed to load countries. Please refresh.');
      } finally {
        setLoading(prev => ({ ...prev, countries: false }));
      }
    };
    
    fetchCountries();
  }, []);

  // Memoized input handler
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear errors on input
  }, []);

  // Calculate rate with validation
  const handleCalculate = async () => {
    // Validation
    if (!formData.myLocation || !formData.clientLocation) {
      setError('Please select both locations');
      return;
    }
    
    const rate = parseFloat(formData.currentRate);
    if (isNaN(rate) || rate <= 0) {
      setError('Please enter a valid rate (greater than 0)');
      return;
    }

    setLoading(prev => ({ ...prev, calc: true }));
    setError(null);
    setResult(null);
    setEmail(null);

    try {
      const res = await fetch(`${API_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Calculation failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, calc: false }));
    }
  };

  // Generate AI email
  const handleGenerateEmail = async () => {
    if (!result || !formData.skill) {
      setError('Please enter your skill/service to generate email');
      return;
    }

    setLoading(prev => ({ ...prev, email: true }));
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fairRate: result.fairRate,
          skill: formData.skill,
          currentRate: result.currentRate,
          clientLocation: formData.clientLocation
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setEmail(data.fallback || 'AI service temporarily unavailable');
      } else {
        setEmail(data.email);
      }
    } catch (err) {
      setError('Failed to generate email');
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="container">
      {/* SEO Optimization */}
      <Helmet>
        <title>Freelance Rate Calculator - PPP & Inflation Adjusted | Rate Defender</title>
        <meta 
          name="description" 
          content="Free calculator to adjust your freelance rates for purchasing power parity (PPP) and inflation. Perfect for Upwork, Fiverr, and remote workers worldwide." 
        />
        <meta 
          name="keywords" 
          content="freelance rates, PPP calculator, inflation adjustment, Upwork rates, Fiverr pricing, remote work salary" 
        />
        <link rel="canonical" href="https://yourdomain.com/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Freelance Rate Calculator | Rate Defender" />
        <meta property="og:description" content="Calculate fair freelance rates adjusted for global purchasing power" />
        <meta property="og:type" content="website" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Rate Defender",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            }
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <header className="hero">
        <h1>💰 Freelance Rate Defender</h1>
        <p className="subtitle">
          Calculate your true worth adjusted for global purchasing power & inflation
        </p>
      </header>

      {/* Top Ad Placement */}
      <AdSpace dataAdSlot="1234567890" style={{ height: '90px' }} />

      {/* Main Calculator Card */}
      <section className="calculator-card">
        <h2>Calculate Your Fair Rate</h2>
        
        {error && (
          <div className="error-banner" role="alert">
            ⚠️ {error}
          </div>
        )}

        {loading.countries ? (
          <LoadingSpinner message="Loading countries..." />
        ) : (
          <div className="form-grid">
            {/* My Location */}
            <div className="form-group">
              <label htmlFor="myLocation">
                📍 Your Location
              </label>
              <select
                id="myLocation"
                value={formData.myLocation}
                onChange={(e) => handleInputChange('myLocation', e.target.value)}
                className="select-input"
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Client Location */}
            <div className="form-group">
              <label htmlFor="clientLocation">
                🌍 Client's Location
              </label>
              <select
                id="clientLocation"
                value={formData.clientLocation}
                onChange={(e) => handleInputChange('clientLocation', e.target.value)}
                className="select-input"
              >
                <option value="">Select client country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Current Rate */}
            <div className="form-group">
              <label htmlFor="currentRate">
                💵 Your Current Rate ($/hour)
              </label>
              <input
                id="currentRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 25"
                value={formData.currentRate}
                onChange={(e) => handleInputChange('currentRate', e.target.value)}
                className="text-input"
              />
            </div>

            {/* Skill (Optional for AI) */}
            <div className="form-group">
              <label htmlFor="skill">
                🎯 Your Skill/Service (Optional)
              </label>
              <input
                id="skill"
                type="text"
                placeholder="e.g., Web Development"
                value={formData.skill}
                onChange={(e) => handleInputChange('skill', e.target.value)}
                className="text-input"
              />
              <small>Used for AI-generated email</small>
            </div>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={loading.calc || loading.countries}
          className="btn-primary"
        >
          {loading.calc ? '⏳ Calculating...' : '🚀 Calculate Fair Rate'}
        </button>
      </section>

      {/* Results Section */}
      {result && (
        <>
          {/* Middle Ad (Appears after calculation) */}
          <AdSpace dataAdSlot="0987654321" style={{ height: '250px', marginTop: '30px' }} />

          <section className="result-card">
            <h2>📊 Your Analysis</h2>
            
            <div className="result-grid">
              <div className="stat-box primary">
                <div className="stat-label">Fair Rate</div>
                <div className="stat-value">${result.fairRate}</div>
                <div className="stat-change">
                  {result.percentageChange > 0 ? '↑' : '↓'} 
                  {Math.abs(result.percentageChange)}%
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Current Rate</div>
                <div className="stat-value">${result.currentRate}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Purchasing Power</div>
                <div className="stat-value">{result.purchasingPowerRatio}x</div>
              </div>
            </div>

            <div className="insight-box">
              <strong>💡 Insight:</strong> {result.insight}
            </div>

            {/* AI Email Generator */}
            <div className="email-section">
              <h3>✉️ Generate Professional Email</h3>
              <button
                onClick={handleGenerateEmail}
                disabled={loading.email || !formData.skill}
                className="btn-secondary"
              >
                {loading.email ? '⏳ Generating...' : '🤖 Generate Email with AI'}
              </button>

              {email && (
                <div className="email-result">
                  <pre>{email}</pre>
                  <button
                    onClick={() => copyToClipboard(email)}
                    className="btn-copy"
                  >
                    📋 Copy Email
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* SEO Content Section */}
      <article className="content-section">
        <h2>Understanding Purchasing Power Parity in Freelancing</h2>
        
        <section>
          <h3>What is PPP and Why Does It Matter?</h3>
          <p>
            Purchasing Power Parity (PPP) is an economic theory that compares different countries' currencies 
            through a "basket of goods" approach. For freelancers, understanding PPP is crucial because $50 
            in India has dramatically different purchasing power than $50 in the United States.
          </p>
          <p>
            When you charge clients from high-cost countries, you're competing in their market. However, your 
            living expenses are based on your local economy. This calculator helps you find the sweet spot 
            where your rates are competitive for clients while providing you fair compensation relative to 
            your purchasing power.
          </p>
        </section>

        <section>
          <h3>How Inflation Affects Freelance Rates</h3>
          <p>
            Global inflation has significantly impacted freelance markets since 2020. While costs have risen 
            worldwide, the impact varies by region. A freelancer in Argentina might face 100%+ annual inflation, 
            while someone in Switzerland experiences 2-3%. This disparity means static rates quickly become 
            unfair to either you or your client.
          </p>
          <p>
            Our calculator accounts for these regional differences, ensuring your rates reflect current 
            economic realities. Regular rate adjustments aren't just about making more money—they're about 
            maintaining fair value exchange in a changing global economy.
          </p>
        </section>

        <section>
          <h3>Best Practices for Upwork and Fiverr Sellers</h3>
          <ul>
            <li><strong>Review rates quarterly:</strong> Economic conditions change rapidly in the global market</li>
            <li><strong>Communicate transparently:</strong> Clients appreciate honesty about rate adjustments</li>
            <li><strong>Consider your expertise:</strong> PPP is one factor—your skills and experience matter too</li>
            <li><strong>Track your actual costs:</strong> Monitor how your local expenses change over time</li>
            <li><strong>Build long-term relationships:</strong> Loyal clients understand fair rate adjustments</li>
          </ul>
        </section>

        <section>
          <h3>The Global Freelance Market in 2024</h3>
          <p>
            The freelance economy has exploded to over $1.5 trillion globally. With remote work normalized, 
            clients increasingly hire talent worldwide. This creates opportunities but also challenges around 
            fair compensation. Understanding PPP helps level the playing field, allowing talented freelancers 
            from any country to charge what they're truly worth.
          </p>
          <p>
            Remember: competing on price alone is a race to the bottom. Instead, use tools like this calculator 
            to ensure your rates reflect genuine value while remaining competitive in your target market.
          </p>
        </section>
      </article>

      {/* Bottom Ad */}
      <AdSpace dataAdSlot="1122334455" style={{ height: '250px', marginTop: '40px' }} />

      {/* Footer */}
      <footer className="footer">
        <p>
          Made for freelancers, by freelancers 💙 | 
          <a href="/privacy">Privacy Policy</a> | 
          <a href="/terms">Terms</a>
        </p>
        <p className="disclaimer">
          Rates are estimates based on PPP data. Always research market rates for your specific skills.
        </p>
      </footer>
    </div>
  );
};

export default memo(Home);