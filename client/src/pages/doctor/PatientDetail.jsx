import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, AlertTriangle, Users, Plus, Trash2, Calendar, User } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext.jsx';
import { useToast }  from '../../context/ToastContext.jsx';
import Sidebar  from '../../components/Layout/Sidebar.jsx';
import Navbar   from '../../components/Layout/Navbar.jsx';
import Button   from '../../components/UI/Button.jsx';
import Badge    from '../../components/UI/Badge.jsx';
import Modal    from '../../components/UI/Modal.jsx';
import Input    from '../../components/UI/Input.jsx';
import api      from '../../api/index.js';

const SEVERITY_COLOR = { mild: 'green', moderate: 'yellow', severe: 'red' };
const SEVERITY_LABEL = { mild: 'Лёгкая', moderate: 'Средняя', severe: 'Тяжёлая' };

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const toast = useToast();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('diagnoses');

  // Модалки добавления
  const [diagModal,    setDiagModal]    = useState(false);
  const [allergyModal, setAllergyModal] = useState(false);

  // Формы
  const [diagForm,    setDiagForm]    = useState({ title: '', icd_code: '', description: '', diagnosed_at: '', is_chronic: false, relative_id: '' });
  const [allergyForm, setAllergyForm] = useState({ allergen: '', reaction: '', severity: '', relative_id: '' });

  const load = () => {
    setLoading(true);
    api.get(`/doctor/patients/${id}`)
      .then(res => setData(res.data))
      .catch(() => toast.error('Ошибка загрузки данных пациента'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const addDiagnosis = async () => {
    if (!diagForm.title) return toast.error('Введите название диагноза');
    try {
      await api.post(`/doctor/patients/${id}/diagnoses`, {
        ...diagForm,
        relative_id: diagForm.relative_id || null,
        is_chronic: diagForm.is_chronic ? 1 : 0,
      });
      toast.success('Диагноз добавлен');
      setDiagModal(false);
      setDiagForm({ title: '', icd_code: '', description: '', diagnosed_at: '', is_chronic: false, relative_id: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Ошибка');
    }
  };

  const addAllergy = async () => {
    if (!allergyForm.allergen) return toast.error('Введите аллерген');
    try {
      await api.post(`/doctor/patients/${id}/allergies`, {
        ...allergyForm,
        relative_id: allergyForm.relative_id || null,
        severity: allergyForm.severity || null,
      });
      toast.success('Аллергия добавлена');
      setAllergyModal(false);
      setAllergyForm({ allergen: '', reaction: '', severity: '', relative_id: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Ошибка');
    }
  };

  const deleteDiag = async (diagId) => {
    if (!confirm('Удалить диагноз?')) return;
    await api.delete(`/doctor/patients/${id}/diagnoses/${diagId}`);
    toast.success('Удалено');
    load();
  };

  const deleteAllergy = async (allergId) => {
    if (!confirm('Удалить аллергию?')) return;
    await api.delete(`/doctor/patients/${id}/allergies/${allergId}`);
    toast.success('Удалено');
    load();
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Пациент" />
        <div className="app-content"><p style={{ color: 'var(--color-muted)' }}>Загрузка...</p></div>
      </div>
    </div>
  );

  if (!data) return null;
  const { user, relatives, diagnoses, allergies } = data;

  const relativeName = (rid) => {
    if (!rid) return 'Сам пациент';
    return relatives.find(r => r.id === rid)?.full_name || '—';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title={user.full_name} />
        <div className="app-content">

          {/* Назад */}
          <button
            onClick={() => navigate('/doctor/patients')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 16, fontSize: 14 }}
          >
            <ArrowLeft size={16} /> Все пациенты
          </button>

          {/* Карточка пациента */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--color-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 24, flexShrink: 0,
              }}>
                {user.full_name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{user.full_name}</div>
                <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>{user.email}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', fontSize: 13, color: 'var(--color-muted)' }}>
                  {user.birth_date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13}/> {user.birth_date}</span>}
                  {user.gender && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13}/> {user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : 'Другой'}</span>}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{relatives.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Родственников</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f97316' }}>{diagnoses.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Диагнозов</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{allergies.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Аллергий</div>
                </div>
              </div>
            </div>
          </div>

          {/* Вкладки */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '2px solid var(--color-border)' }}>
            {[
              { key: 'diagnoses', label: 'Диагнозы', icon: <Stethoscope size={15}/> },
              { key: 'allergies', label: 'Аллергии', icon: <AlertTriangle size={15}/> },
              { key: 'relatives', label: 'Родственники', icon: <Users size={15}/> },
            ].map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontWeight: tab === key ? 600 : 400,
                color: tab === key ? 'var(--color-primary)' : 'var(--color-muted)',
                borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -2,
              }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Диагнозы */}
          {tab === 'diagnoses' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button onClick={() => setDiagModal(true)}>
                  <Plus size={15} style={{ marginRight: 4 }}/> Добавить диагноз
                </Button>
              </div>
              {diagnoses.length === 0
                ? <p style={{ color: 'var(--color-muted)' }}>Диагнозов нет</p>
                : diagnoses.map(d => (
                  <div key={d.id} className="card" style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{d.title}</span>
                        {d.icd_code && <Badge color="blue">{d.icd_code}</Badge>}
                        {d.is_chronic === 1 && <Badge color="red">Хронич.</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{relativeName(d.relative_id)}</span>
                        {d.diagnosed_at && <span>{d.diagnosed_at}</span>}
                        {d.description && <span style={{ fontStyle: 'italic' }}>{d.description}</span>}
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => deleteDiag(d.id)}>
                      <Trash2 size={14}/>
                    </Button>
                  </div>
                ))
              }
            </>
          )}

          {/* Аллергии */}
          {tab === 'allergies' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button onClick={() => setAllergyModal(true)}>
                  <Plus size={15} style={{ marginRight: 4 }}/> Добавить аллергию
                </Button>
              </div>
              {allergies.length === 0
                ? <p style={{ color: 'var(--color-muted)' }}>Аллергий нет</p>
                : allergies.map(a => (
                  <div key={a.id} className="card" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{a.allergen}</span>
                        {a.severity && <Badge color={SEVERITY_COLOR[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', gap: 12 }}>
                        <span>{relativeName(a.relative_id)}</span>
                        {a.reaction && <span>{a.reaction}</span>}
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => deleteAllergy(a.id)}>
                      <Trash2 size={14}/>
                    </Button>
                  </div>
                ))
              }
            </>
          )}

          {/* Родственники */}
          {tab === 'relatives' && (
            relatives.length === 0
              ? <p style={{ color: 'var(--color-muted)' }}>Родственников нет</p>
              : relatives.map(r => (
                <div key={r.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{r.relation_type}</span>
                    {r.birth_date && <span>{r.birth_date}</span>}
                    {r.notes && <span style={{ fontStyle: 'italic' }}>{r.notes}</span>}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Модал: добавить диагноз */}
      <Modal isOpen={diagModal} onClose={() => setDiagModal(false)} title="Добавить диагноз"
        footer={<><Button onClick={addDiagnosis}>Сохранить</Button><Button variant="secondary" onClick={() => setDiagModal(false)}>Отмена</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Название *" value={diagForm.title} onChange={e => setDiagForm(f => ({...f, title: e.target.value}))} />
          <Input label="Код МКБ-10" value={diagForm.icd_code} onChange={e => setDiagForm(f => ({...f, icd_code: e.target.value}))} />
          <Input label="Дата" type="date" value={diagForm.diagnosed_at} onChange={e => setDiagForm(f => ({...f, diagnosed_at: e.target.value}))} />
          <Input label="Описание" value={diagForm.description} onChange={e => setDiagForm(f => ({...f, description: e.target.value}))} />
          <select className="input" value={diagForm.relative_id} onChange={e => setDiagForm(f => ({...f, relative_id: e.target.value}))}>
            <option value="">Сам пациент</option>
            {relatives.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={diagForm.is_chronic} onChange={e => setDiagForm(f => ({...f, is_chronic: e.target.checked}))} />
            Хроническое заболевание
          </label>
        </div>
      </Modal>

      {/* Модал: добавить аллергию */}
      <Modal isOpen={allergyModal} onClose={() => setAllergyModal(false)} title="Добавить аллергию"
        footer={<><Button onClick={addAllergy}>Сохранить</Button><Button variant="secondary" onClick={() => setAllergyModal(false)}>Отмена</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Аллерген *" value={allergyForm.allergen} onChange={e => setAllergyForm(f => ({...f, allergen: e.target.value}))} />
          <Input label="Реакция" value={allergyForm.reaction} onChange={e => setAllergyForm(f => ({...f, reaction: e.target.value}))} />
          <select className="input" value={allergyForm.severity} onChange={e => setAllergyForm(f => ({...f, severity: e.target.value}))}>
            <option value="">Тяжесть не указана</option>
            <option value="mild">Лёгкая</option>
            <option value="moderate">Средняя</option>
            <option value="severe">Тяжёлая</option>
          </select>
          <select className="input" value={allergyForm.relative_id} onChange={e => setAllergyForm(f => ({...f, relative_id: e.target.value}))}>
            <option value="">Сам пациент</option>
            {relatives.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
