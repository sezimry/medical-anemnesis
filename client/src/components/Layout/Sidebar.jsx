import { NavLink } from 'react-router-dom';
import { useAuth }  from '../../hooks/useAuth.js';
import { useLocale } from '../../context/LocaleContext.jsx';
import { useTheme }  from '../../context/ThemeContext.jsx';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard',       icon: '⊞', key: 'nav.dashboard' },
  { to: '/relatives',       icon: '👥', key: 'nav.relatives' },
  { to: '/medical-records', icon: '🩺', key: 'nav.medical_records' },
  { to: '/family-tree',     icon: '🌳', key: 'nav.family_tree' },
  { to: '/profile',         icon: '👤', key: 'nav.profile' },
];

export default function Sidebar() {
  const { user, logout }            = useAuth();
  const { t, locale, changeLocale } = useLocale();
  const { theme, toggle }           = useTheme();

  return (
    <aside className={styles.sidebar}>
      {/* Логотип */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🏥</span>
        <span className={styles.logoText}>{t('app_name')}</span>
      </div>

      {/* Навигация */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.active : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        {/* Переключатель темы */}
        <button className={styles.themeBtn} onClick={toggle} title="Сменить тему">
          {theme === 'light' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
        </button>

        {/* Переключатель языка */}
        <div className={styles.langSwitch}>
          <button
            className={[styles.langBtn, locale === 'ru' ? styles.langActive : ''].join(' ')}
            onClick={() => changeLocale('ru')}
          >RU</button>
          <button
            className={[styles.langBtn, locale === 'kg' ? styles.langActive : ''].join(' ')}
            onClick={() => changeLocale('kg')}
          >KG</button>
        </div>

        {/* Пользователь + выход */}
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.full_name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title={t('nav.logout')}>
            ⇥
          </button>
        </div>
      </div>
    </aside>
  );
}
