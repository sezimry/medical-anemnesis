import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Input from '../components/UI/Input.jsx';
import Button from '../components/UI/Button.jsx';

export default function Login() {
  const { login, loading } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.ok) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Логотип */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🏥</div>
          <div className="auth-logo-text">{t('app_name')}</div>
        </div>

        <h2 className="auth-title">{t('auth.welcome_back')}</h2>
        <p className="auth-subtitle">{t('auth.login_subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <Input
              id="email"
              name="email"
              type="email"
              label={t('auth.email')}
              placeholder="example@mail.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <Input
              id="password"
              name="password"
              type="password"
              label={t('auth.password')}
              placeholder="••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

          <Button type="submit" fullWidth loading={loading}>
            {t('auth.sign_in')}
          </Button>
        </form>

        <p className="auth-footer">
          {t('auth.no_account')}{' '}
          <Link to="/register">{t('auth.sign_up')}</Link>
        </p>
      </div>
    </div>
  );
}
