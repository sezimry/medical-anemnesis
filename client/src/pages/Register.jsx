import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Input from '../components/UI/Input.jsx';
import Button from '../components/UI/Button.jsx';

export default function Register() {
  const { register, loading } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [form, setForm]   = useState({
    email: '', password: '', full_name: '', birth_date: '', gender: '',
  });
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await register(form);
    if (result.ok) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏥</div>
          <div className="auth-logo-text">{t('app_name')}</div>
        </div>

        <h2 className="auth-title">{t('auth.create_account')}</h2>
        <p className="auth-subtitle">{t('auth.register_subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <Input
              id="full_name"
              name="full_name"
              label={t('auth.full_name')}
              placeholder="Иванов Иван Иванович"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

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
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row" style={{ marginBottom: 16 }}>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              label={t('auth.birth_date')}
              value={form.birth_date}
              onChange={handleChange}
            />

            <Input
              id="gender"
              name="gender"
              as="select"
              label={t('auth.gender')}
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">—</option>
              <option value="male">{t('auth.gender_male')}</option>
              <option value="female">{t('auth.gender_female')}</option>
              <option value="other">{t('auth.gender_other')}</option>
            </Input>
          </div>

          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

          <Button type="submit" fullWidth loading={loading}>
            {t('auth.sign_up')}
          </Button>
        </form>

        <p className="auth-footer">
          {t('auth.have_account')}{' '}
          <Link to="/login">{t('auth.sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}
