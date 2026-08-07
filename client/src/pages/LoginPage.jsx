import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/common/ErrorBanner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="muted" style={{ marginTop: -8 }}>
          Log in to DataDesk
        </p>
        <ErrorBanner error={error} />
        <div className="stack">
          <div>
            <label className="field-label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
