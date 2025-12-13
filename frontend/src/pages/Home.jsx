import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import AdSpace from '../components/AdSpace'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Home = () => {
  const [countries, setCountries] = useState([])
  const [formData, setFormData] = useState({
    myLocation: '',
    clientLocation: '',
    currentRate: '25'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/countries`)
      .then(res => res.json())
      .then(data => {
        setCountries(data.countries || [])
        setFormData(prev => ({
          ...prev,
          myLocation: data.countries[0] || '',
          clientLocation: data.countries[1] || ''
        }))
      })
      .catch(err => setError('Failed to load countries'))
  }, [])

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) throw new Error('Calculation failed')
      
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Failed to calculate. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Helmet>
        <title>Freelance Rate Calculator | Rate Defender</title>
      </Helmet>

      <header className="hero">
        <h1>💰 Freelance Rate Defender</h1>
        <p className="subtitle">Calculate your fair rate adjusted for purchasing power</p>
      </header>

      <AdSpace style={{ height: '90px' }} />

      <section className="calculator-card">
        <h2>Calculate Your Fair Rate</h2>
        
        {error && <div className="error">{error}</div>}
        
        <div className="form-grid">
          <div className="form-group">
            <label>Your Location</label>
            <select 
              value={formData.myLocation}
              onChange={(e) => setFormData({...formData, myLocation: e.target.value})}
              className="select-input"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Client's Location</label>
            <select 
              value={formData.clientLocation}
              onChange={(e) => setFormData({...formData, clientLocation: e.target.value})}
              className="select-input"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
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

        <button 
          onClick={handleCalculate} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '⏳ Calculating...' : '🚀 Calculate Fair Rate'}
        </button>
      </section>

      {result && (
        <section className="result-card">
          <h2>📊 Your Analysis</h2>
          <div className="stat-box primary">
            <div className="stat-label">Fair Rate</div>
            <div className="stat-value">${result.fairRate}</div>
            <div className="stat-change">{result.percentageChange > 0 ? '↑' : '↓'} {Math.abs(result.percentageChange)}%</div>
          </div>
          <div className="insight-box">
            <strong>💡 Insight:</strong> {result.insight}
          </div>
        </section>
      )}

      <footer className="footer">
        <p>Made for freelancers 💙</p>
      </footer>
    </div>
  )
}

export default Home
