import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Sidebar from '../components/Layout/Sidebar.jsx';
import Navbar from '../components/Layout/Navbar.jsx';
import Button from '../components/UI/Button.jsx';
import Input from '../components/UI/Input.jsx';
import Modal from '../components/UI/Modal.jsx';
import api from '../api/index.js';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLocale();

  const [editing, setEditing]       = useState(false);
  const [saving,  setSaving]        = useState(false);
  const [form, setForm]             = useState({
    full_name:  user?.full_name  || '',
    birth_date: user?.birth_date || '',
    gender:     user?.gender     || '',
  });
  const [formError, setFormError]   = useState('');

  // Смена пароля
  const [pwdModal,  setPwdModal]    = useState(false);
  const [pwd, setPwd]               = useState({ current_password: '', new_password: '' });
  const [pwdError,  setPwdError]    = useState('');
  const [pwdSaving, setPwdSaving]   = useState(false);

  // Удаление аккаунта
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      setFormError(t('profile.title') + ': ФИО обязательно');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/user/me', form);
      updateUser(data);
      setEditing(false);
    } catch (err) {
      setFormError(err.response?.data?.error || t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwdError('');
    setPwdSaving(true);
    try {
      await api.put('/user/me/password', pwd);
      setPwdModal(false);
      setPwd({ current_password: '', new_password: '' });
    } catch (err) {
      setPwdError(err.response?.data?.error || t('common.error'));
    } finally {
      setPwdSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete('/user/me');
      logout();
    } catch {
      setDeleting(false);
    }
  }

  const genderLabel = { male: t('auth.gender_male'), female: t('auth.gender_female'), other: t('auth.gender_other') };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Navbar
          title={t('profile.title')}
          actions={
            !editing
              ? <Button size="sm" onClick={() => setEditing(true)}>{t('profile.edit')}</Button>
              : <>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{t('profile.cancel')}</Button>
                  <Button size="sm" loading={saving} onClick={handleSave}>{t('profile.save')}</Button>
                </>
          }
        />

        <div className="app-content">
          <div className="card" style={{ maxWidth: 560 }}>
            {/* Аватар */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--color-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700,
              }}>
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.full_name}</div>
                <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>{user?.email}</div>
              </div>
            </div>

            <div className="divider" />

            {/* Поля профиля */}
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input
                  id="full_name" name="full_name"
                  label={t('auth.full_name')}
                  value={form.full_name}
                  onChange={handleChange}
                  error={formError}
                />
                <div className="form-row">
                  <Input
                    id="birth_date" name="birth_date" type="date"
                    label={t('auth.birth_date')}
                    value={form.birth_date}
                    onChange={handleChange}
                  />
                  <Input id="gender" name="gender" as="select"
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
              </div>
            ) : (
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 0' }}>
                <ProfileRow label={t('auth.full_name')}  value={user?.full_name} />
                <ProfileRow label={t('auth.email')}      value={user?.email} />
                <ProfileRow label={t('auth.birth_date')} value={user?.birth_date || '—'} />
                <ProfileRow label={t('auth.gender')}     value={genderLabel[user?.gender] || '—'} />
              </dl>
            )}

            <div className="divider" />

            {/* Действия */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" size="sm" onClick={() => setPwdModal(true)}>
                🔒 {t('profile.change_password')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
                🗑 {t('profile.delete_account')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Модал: смена пароля */}
      <Modal
        isOpen={pwdModal}
        onClose={() => setPwdModal(false)}
        title={t('profile.change_password')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPwdModal(false)}>{t('common.cancel')}</Button>
            <Button size="sm" loading={pwdSaving} onClick={handleChangePassword}>{t('common.save')}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            id="current_password" name="current_password" type="password"
            label={t('profile.current_password')}
            value={pwd.current_password}
            onChange={e => setPwd(p => ({ ...p, current_password: e.target.value }))}
          />
          <Input
            id="new_password" name="new_password" type="password"
            label={t('profile.new_password')}
            value={pwd.new_password}
            onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))}
            error={pwdError}
          />
        </div>
      </Modal>

      {/* Модал: удаление аккаунта */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={t('profile.delete_account')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteModal(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>{t('common.delete')}</Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('profile.delete_confirm')}</p>
      </Modal>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <>
      <dt style={{ fontSize: 13, color: 'var(--color-muted)', paddingTop: 2 }}>{label}</dt>
      <dd style={{ fontSize: 14, fontWeight: 500 }}>{value}</dd>
    </>
  );
}
