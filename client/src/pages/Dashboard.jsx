import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, AlertTriangle, ClipboardList } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';
import { useAuth }   from '../hooks/useAuth.js';
import Sidebar     from '../components/Layout/Sidebar.jsx';
import Navbar      from '../components/Layout/Navbar.jsx';
import PatientCard from '../components/PatientCard/PatientCard.jsx';
import api from '../api/index.js';

export default function Dashboard() {
  const { t }    = useLocale();
  const { user } = useAuth();

  const [stats, setStats] = useState({ relatives: 0, diagnoses: 0, allergies: 0, chronic: 0 });
  const [relatives,  setRelatives]  = useState([]);
  const [diagnoses,  setDiagnoses]  = useState([]);
  const [allergies,  setAllergies]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [relRes, diagRes, allergyRes] = await Promise.all([
          api.get('/relatives'),
          api.get('/diagnoses'),
          api.get('/allergies'),
        ]);
        setRelatives(relRes.data);
        setDiagnoses(diagRes.data);
        setAllergies(allergyRes.data);
        setStats({
          relatives: relRes.data.length,
          diagnoses: diagRes.data.length,
          allergies: allergyRes.data.length,
          chronic:   diagRes.data.filter(d => d.is_chronic).length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Диагнозы/аллергии для конкретного человека
  const forPerson = (relativeId) => ({
    diagnoses: diagnoses.filter(d => (relativeId === 'self' ? !d.relative_id : d.relative_id === relativeId)),
    allergies: allergies.filter(a => (relativeId === 'self' ? !a.relative_id : a.relative_id === relativeId)),
  });

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Navbar title={t('dashboard.title')} />

        <div className="app-content">
          {/* Статистика */}
          <div className="stats-grid">
            <StatCard label={t('dashboard.total_relatives')} value={stats.relatives} icon={<Users size={22}/>}          color="blue" />
            <StatCard label={t('dashboard.total_diagnoses')} value={stats.diagnoses} icon={<Stethoscope size={22}/>}    color="red" />
            <StatCard label={t('dashboard.total_allergies')} value={stats.allergies} icon={<AlertTriangle size={22}/>}  color="yellow" />
            <StatCard label={t('dashboard.chronic')}         value={stats.chronic}   icon={<ClipboardList size={22}/>}  color="gray" />
          </div>

          {/* Карточки пациентов */}
          {loading ? (
            <p style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>{t('dashboard.recent')}</h2>
                <Link to="/medical-records" style={{ fontSize: 13, color: 'var(--color-primary)' }}>
                  {t('medical.title')} →
                </Link>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {/* Карточка самого пользователя */}
                {user && (
                  <PatientCard
                    person={user}
                    {...forPerson('self')}
                    t={t}
                    isSelf
                  />
                )}

                {/* Карточки родственников */}
                {relatives.map(r => (
                  <PatientCard
                    key={r.id}
                    person={r}
                    {...forPerson(r.id)}
                    t={t}
                  />
                ))}

                {relatives.length === 0 && (
                  <p style={{ color: 'var(--color-muted)', fontSize: 14, gridColumn: '1/-1' }}>
                    {t('relatives.no_relatives')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorMap = { blue: '#2563eb', red: '#dc2626', yellow: '#d97706', gray: '#475569' };
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={{ color: colorMap[color] }}>{value}</div>
    </div>
  );
}
