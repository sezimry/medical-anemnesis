import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, GitBranch, User, Moon, Sun, LogOut, UserRound, Pill, Bell, FolderOpen } from 'lucide-react';
import { useAuth }   from '../../hooks/useAuth.js';
import { useLocale } from '../../context/LocaleContext.jsx';
import { useTheme }  from '../../context/ThemeContext.jsx';
import styles from './Sidebar.module.css';

const PATIENT_NAV = [
  { to: '/dashboard',       icon: <LayoutDashboard size={18} />, key: 'nav.dashboard' },
  { to: '/relatives',       icon: <Users size={18} />,           key: 'nav.relatives' },
  { to: '/medical-records', icon: <Stethoscope size={18} />,     key: 'nav.medical_records' },
  { to: '/family-tree',       icon: <GitBranch size={18} />,  key: 'nav.family_tree' },
  { to: '/treatment-courses', icon: <Pill size={18} />,  label: 'Курсы лечения' },
  { to: '/reminders',         icon: <Bell size={18} />,       label: 'Напоминания' },
  { to: '/documents',         icon: <FolderOpen size={18} />, label: 'Документы' },
  { to: '/profile',           icon: <User size={18} />,  key: 'nav.profile' },
];

const DOCTOR_NAV = [
  { to: '/doctor/patients', icon: <Users size={18} />,      label: 'Мои пациенты' },
  { to: '/profile',         icon: <UserRound size={18} />,  label: 'Профиль' },
];

export default function Sidebar() {
  const { user, logout }            = useAuth();
  const { t, locale, changeLocale } = useLocale();
  const { theme, toggle }           = useTheme();

  const isDoctor = user?.role === 'doctor';
  const navItems = isDoctor ? DOCTOR_NAV : PATIENT_NAV;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Stethoscope size={24} className={styles.logoIcon} />
        <span className={styles.logoText}>{t('app_name')}</span>
      </div>

      {isDoctor && (
        <div style={{ padding: '6px 16px 0', marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1, color: 'var(--color-primary)', opacity: 0.8,
          }}>
            Врач
          </span>
        </div>
      )}

      <nav className={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.active : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label ?? t(item.key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <button className={styles.themeBtn} onClick={toggle} title="Сменить тему">
          {theme === 'light'
            ? <><Moon size={15} style={{ marginRight: 6 }} /> Тёмная тема</>
            : <><Sun  size={15} style={{ marginRight: 6 }} /> Светлая тема</>}
        </button>

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

        <div className={styles.userRow}>
          <div className={styles.userAvatar}>
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.full_name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title={t('nav.logout')}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
