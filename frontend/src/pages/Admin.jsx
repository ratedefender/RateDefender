// src/pages/Admin.jsx - Secure Admin Dashboard
import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState([]);
  const [totals, setTotals] = useState({ totalViews: 0, totalCalculations: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('adminExpiry');
    
    if (token && expiry && new Date(expiry) > new Date()) {
      setIsAuthenticated(true);
      loadStats(token, period);
    }
  }, []);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminExpiry', data.expiresAt);
        setIsAuthenticated(true);
        setPassword('');
        loadStats(data.token, period);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = useCallback(async (token, days) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/stats?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('adminToken')}` }
      });

      if (res.status === 403) {
        // Token expired
        handleLogout();
        setError('Session expired. Please login again.');
        return;
      }

      const data = await res.json();
      setStats(data.stats || []);
      setTotals(data.totals || { totalViews: 0, totalCalculations: 0 });
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout handler
  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      // Silent fail
    }

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminExpiry');
    setIsAuthenticated(false);
    setStats([]);
    setTotals({ totalViews: 0, totalCalculations: 0 });
  };

  // Change period handler
  const handlePeriodChange = (days) => {
    setPeriod(days);
    loadStats(localStorage.getItem('adminToken'), days);
  };

  // Calculate conversion rate
  const conversionRate = totals.totalViews > 0 
    ? ((totals.totalCalculations / totals.totalViews) * 100).toFixed(1)
    : 0;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <div className="logo">🔐</div>
          <h1>Admin Access</h1>
          <p>Enter your password to view analytics</p>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary"
            >
              {loading ? '⏳ Logging in...' : '🔓 Login'}
            </button>
          </form>

          <div className="security-note">
            <small>
              🔒 This dashboard is secured. All login attempts are rate-limited and logged.
            </small>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📊 Admin Dashboard</h1>
          <p className="subtitle">Real-time analytics for Rate Defender</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          🚪 Logout
        </button>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon">👁️</div>
          <div className="card-content">
            <div className="card-value">{totals.totalViews.toLocaleString()}</div>
            <div className="card-label">Total Views</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🧮</div>
          <div className="card-content">
            <div className="card-value">{totals.totalCalculations.toLocaleString()}</div>
            <div className="card-label">Calculations</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">{conversionRate}%</div>
            <div className="card-label">Conversion Rate</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-value">{stats.length}</div>
            <div className="card-label">Days Tracked</div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        <label>Time Period:</label>
        <div className="btn-group">
          <button
            onClick={() => handlePeriodChange(7)}
            className={period === 7 ? 'active' : ''}
          >
            7 Days
          </button>
          <button
            onClick={() => handlePeriodChange(30)}
            className={period === 30 ? 'active' : ''}
          >
            30 Days
          </button>
          <button
            onClick={() => handlePeriodChange(90)}
            className={period === 90 ? 'active' : ''}
          >
            90 Days
          </button>
        </div>
        <button
          onClick={() => loadStats(localStorage.getItem('adminToken'), period)}
          className="btn-refresh"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics Table */}
      {loading ? (
        <LoadingSpinner message="Loading statistics..." />
      ) : stats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Data Yet</h3>
          <p>Statistics will appear here once users start visiting your site.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Page Views</th>
                <th>Calculations</th>
                <th>Conversion %</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat, index) => {
                const conversion = stat.views > 0 
                  ? ((stat.calculations / stat.views) * 100).toFixed(1)
                  : 0;
                
                // Calculate trend (compare with previous day)
                const prevStat = stats[index + 1];
                let trend = '—';
                if (prevStat && prevStat.calculations > 0) {
                  const change = ((stat.calculations - prevStat.calculations) / prevStat.calculations) * 100;
                  trend = change > 0 ? `↑ ${change.toFixed(0)}%` : `↓ ${Math.abs(change).toFixed(0)}%`;
                }

                return (
                  <tr key={stat._id}>
                    <td>{new Date(stat.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</td>
                    <td>{stat.views.toLocaleString()}</td>
                    <td>{stat.calculations.toLocaleString()}</td>
                    <td>{conversion}%</td>
                    <td className={
                      trend.includes('↑') ? 'trend-up' : 
                      trend.includes('↓') ? 'trend-down' : 
                      'trend-neutral'
                    }>
                      {trend}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Insights Section */}
      {stats.length > 0 && (
        <div className="insights-section">
          <h2>📈 Key Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Average Daily Views</h4>
              <p className="insight-value">
                {(totals.totalViews / stats.length).toFixed(0)}
              </p>
            </div>
            <div className="insight-card">
              <h4>Average Daily Calculations</h4>
              <p className="insight-value">
                {(totals.totalCalculations / stats.length).toFixed(0)}
              </p>
            </div>
            <div className="insight-card">
              <h4>Best Day (Views)</h4>
              <p className="insight-value">
                {Math.max(...stats.map(s => s.views))}
              </p>
            </div>
            <div className="insight-card">
              <h4>Best Day (Calculations)</h4>
              <p className="insight-value">
                {Math.max(...stats.map(s => s.calculations))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          🔒 Secure Session • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </footer>
    </div>
  );
};

export default Admin;