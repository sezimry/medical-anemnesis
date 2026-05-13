import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Calendar, ChevronRight } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext.jsx';
import Sidebar from '../../components/Layout/Sidebar.jsx';
import Navbar  from '../../components/Layout/Navbar.jsx';
import api     from '../../api/index.js';

export default function PatientsList() {
  const { t } = useLocale();
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    api.get('/doctor/patients')
      .then(res => setPatients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Мои пациенты" />
        <div className="app-content">

          {/* Поиск */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Поиск по имени или email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Статистика */}
          <div style={{ marginBottom: 20, color: 'var(--color-muted)', fontSize: 14 }}>
            <Users size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Всего пациентов: <strong>{patients.length}</strong>
          </div>

          {/* Список */}
          {loading ? (
            <p style={{ color: 'var(--color-muted)' }}>Загрузка...</p>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-muted)' }}>
              <Users size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Пациентов не найдено</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(p => (
                <Link
                  key={p.id}
                  to={`/doctor/patients/${p.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card" style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer', transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    {/* Аватар */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--color-primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 18, flexShrink: 0,
                    }}>
                      {p.full_name[0].toUpperCase()}
                    </div>

                    {/* Инфо */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{p.full_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{p.email}</div>
                      {p.birth_date && (
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {p.birth_date}
                        </div>
                      )}
                    </div>

                    <ChevronRight size={20} color="var(--color-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
