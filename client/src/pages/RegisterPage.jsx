import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/common/ErrorBanner';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name);
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
        <h1>Create your account</h1>
        <p className="muted" style={{ marginTop: -8 }}>
          Start managing your data
        </p>
        <ErrorBanner error={error} />
        <div className="stack">
          <div>
            <label className="field-label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
