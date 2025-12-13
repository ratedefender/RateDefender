import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Admin = () => {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuth(true);
        alert('Login successful!');
      } else {
        alert('Wrong password');
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  if (!isAuth) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>🔐 Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
              />
            </div>
            <button type="submit" className="btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>📊 Admin Dashboard</h1>
      <p>Stats will appear here once backend is connected</p>
    </div>
  );
};

export default Admin;