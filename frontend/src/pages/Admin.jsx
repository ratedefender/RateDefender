import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Admin = () => {
  const [password, setPassword] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setIsAuth(true)
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Login failed')
    }
  }

  if (!isAuth) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>🔐 Admin Login</h1>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                placeholder="Enter admin password"
              />
            </div>
            <button type="submit" className="btn-primary">Login</button>
          </form>
          <p style={{marginTop: '20px', fontSize: '0.9rem', color: '#666'}}>
            Default password: admin123
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <h1>📊 Admin Dashboard</h1>
      <p>✅ Login successful! Dashboard features coming soon...</p>
      <button onClick={() => setIsAuth(false)} className="btn-primary">
        Logout
      </button>
    </div>
  )
}

export default Admin
