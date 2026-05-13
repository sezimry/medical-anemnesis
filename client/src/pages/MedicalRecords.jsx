import { useState } from 'react';
import { useLocale }    from '../context/LocaleContext.jsx';
import { useMedical }   from '../hooks/useMedical.js';
import { useRelatives } from '../hooks/useRelatives.js';
import { useToast }     from '../context/ToastContext.jsx';
import { Stethoscope, AlertTriangle, Search, User, Calendar, Pencil, Trash2 } from 'lucide-react';
import Sidebar           from '../components/Layout/Sidebar.jsx';
import Navbar            from '../components/Layout/Navbar.jsx';
import Button            from '../components/UI/Button.jsx';
import Input             from '../components/UI/Input.jsx';
import Modal             from '../components/UI/Modal.jsx';
import Badge             from '../components/UI/Badge.jsx';
import IcdAutocomplete   from '../components/UI/IcdAutocomplete.jsx';

// ─── Вспомогательные константы ───────────────────────────────────────────────
const SEVERITY_COLOR = { mild: 'green', moderate: 'yellow', severe: 'red' };
const EMPTY_DIAG = {
  relative_id: '', icd_code: '', title: '',
  description: '', diagnosed_at: '', is_chronic: false,
};
const EMPTY_ALLERGY = {
  relative_id: '', allergen: '', reaction: '', severity: '',
};

// ─── Компонент ────────────────────────────────────────────────────────────────
export default function MedicalRecords() {
  const { t } = useLocale();
  const { diagnoses, allergies, loading, error,
          createDiagnosis, updateDiagnosis, removeDiagnosis,
          createAllergy,   updateAllergy,   removeAllergy } = useMedical();
  const { relatives } = useRelatives();
  const toast = useToast();

  // Активная вкладка
  const [tab, setTab] = useState('diagnoses'); // 'diagnoses' | 'allergies'

  // Фильтры
  const [filterRelative, setFilterRelative] = useState('');
  const [filterChronic,  setFilterChronic]  = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [search,         setSearch]         = useState('');

  // Модалки диагнозов
  const [diagModal,  setDiagModal]  = useState(false);
  const [diagTarget, setDiagTarget] = useState(null);
  const [diagForm,   setDiagForm]   = useState(EMPTY_DIAG);
  const [diagError,  setDiagError]  = useState('');
  const [diagSaving, setDiagSaving] = useState(false);

  // Модалки аллергий
  const [allergyModal,  setAllergyModal]  = useState(false);
  const [allergyTarget, setAllergyTarget] = useState(null);
  const [allergyForm,   setAllergyForm]   = useState(EMPTY_ALLERGY);
  const [allergyError,  setAllergyError]  = useState('');
  const [allergySaving, setAllergySaving] = useState(false);

  // ── Диагнозы: открыть модалку ─────────────────────────────────────────────
  function openDiagCreate() {
    setDiagTarget(null); setDiagForm(EMPTY_DIAG); setDiagError(''); setDiagModal(true);
  }
  function openDiagEdit(d) {
    setDiagTarget(d);
    setDiagForm({
      relative_id:  d.relative_id  ?? '',
      icd_code:     d.icd_code     || '',
      title:        d.title,
      description:  d.description  || '',
      diagnosed_at: d.diagnosed_at || '',
      is_chronic:   Boolean(d.is_chronic),
    });
    setDiagError(''); setDiagModal(true);
  }
  async function saveDiag() {
    if (!diagForm.title.trim()) { setDiagError('Название обязательно'); return; }
    setDiagSaving(true);
    try {
      const payload = { ...diagForm, relative_id: diagForm.relative_id || null };
      diagTarget ? await updateDiagnosis(diagTarget.id, payload)
                 : await createDiagnosis(payload);
      setDiagModal(false);
      toast.success(diagTarget ? 'Диагноз обновлён' : 'Диагноз добавлен');
    } catch (err) {
      setDiagError(err.response?.data?.error || 'Ошибка');
    } finally {
      setDiagSaving(false);
    }
  }
  async function deleteDiag(id) {
    await removeDiagnosis(id);
    toast.info('Диагноз удалён');
  }

  // ── Аллергии: открыть модалку ─────────────────────────────────────────────
  function openAllergyCreate() {
    setAllergyTarget(null); setAllergyForm(EMPTY_ALLERGY); setAllergyError(''); setAllergyModal(true);
  }
  function openAllergyEdit(a) {
    setAllergyTarget(a);
    setAllergyForm({
      relative_id: a.relative_id ?? '',
      allergen:    a.allergen,
      reaction:    a.reaction  || '',
      severity:    a.severity  || '',
    });
    setAllergyError(''); setAllergyModal(true);
  }
  async function saveAllergy() {
    if (!allergyForm.allergen.trim()) { setAllergyError('Аллерген обязателен'); return; }
    setAllergySaving(true);
    try {
      const payload = { ...allergyForm, relative_id: allergyForm.relative_id || null };
      allergyTarget ? await updateAllergy(allergyTarget.id, payload)
                    : await createAllergy(payload);
      setAllergyModal(false);
      toast.success(allergyTarget ? 'Аллергия обновлена' : 'Аллергия добавлена');
    } catch (err) {
      setAllergyError(err.response?.data?.error || 'Ошибка');
    } finally {
      setAllergySaving(false);
    }
  }
  async function deleteAllergy(id) {
    await removeAllergy(id);
    toast.info('Аллергия удалена');
  }

  // ── Фильтрация ────────────────────────────────────────────────────────────
  const filteredDiagnoses = diagnoses.filter(d => {
    if (filterRelative && String(d.relative_id ?? '') !== filterRelative) return false;
    if (filterChronic === '1' && !d.is_chronic) return false;
    if (filterChronic === '0' &&  d.is_chronic) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) &&
        !(d.icd_code || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredAllergies = allergies.filter(a => {
    if (filterRelative && String(a.relative_id ?? '') !== filterRelative) return false;
    if (filterSeverity && a.severity !== filterSeverity) return false;
    if (search && !a.allergen.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const relativeName = (id) => {
    if (!id) return t('medical.me');
    const r = relatives.find(r => r.id === id);
    return r ? r.full_name : '—';
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Navbar
          title={t('medical.title')}
          actions={
            tab === 'diagnoses'
              ? <Button size="sm" onClick={openDiagCreate}>+ {t('medical.add_diagnosis')}</Button>
              : <Button size="sm" onClick={openAllergyCreate}>+ {t('medical.add_allergy')}</Button>
          }
        />

        <div className="app-content">
          {/* Вкладки */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20,
                        background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
                        padding: 4, width: 'fit-content' }}>
            <TabBtn active={tab === 'diagnoses'}  onClick={() => setTab('diagnoses')}>
              <Stethoscope size={15} style={{marginRight:4}}/> {t('medical.diagnoses')} <CountBadge n={diagnoses.length} />
            </TabBtn>
            <TabBtn active={tab === 'allergies'} onClick={() => setTab('allergies')}>
              <AlertTriangle size={15} style={{marginRight:4}}/> {t('medical.allergies')} <CountBadge n={allergies.length} />
            </TabBtn>
          </div>

          {/* Фильтры */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <Input
              placeholder={`${tab === 'diagnoses' ? t('medical.disease_name') : t('medical.allergen')}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 220 }}
            />

            <Input as="select"
              value={filterRelative}
              onChange={e => setFilterRelative(e.target.value)}
              style={{ width: 180 }}
            >
              <option value="">{t('medical.who')}: {t('medical.filter_all')}</option>
              <option value="">{t('medical.me')}</option>
              {relatives.map(r => (
                <option key={r.id} value={String(r.id)}>{r.full_name}</option>
              ))}
            </Input>

            {tab === 'diagnoses' && (
              <Input as="select"
                value={filterChronic}
                onChange={e => setFilterChronic(e.target.value)}
                style={{ width: 160 }}
              >
                <option value="">{t('medical.filter_all')}</option>
                <option value="1">🔴 {t('medical.is_chronic')}</option>
                <option value="0">Острые</option>
              </Input>
            )}

            {tab === 'allergies' && (
              <Input as="select"
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                style={{ width: 160 }}
              >
                <option value="">{t('medical.severity')}: {t('medical.filter_all')}</option>
                <option value="mild">{t('medical.severity_mild')}</option>
                <option value="moderate">{t('medical.severity_moderate')}</option>
                <option value="severe">{t('medical.severity_severe')}</option>
              </Input>
            )}
          </div>

          {loading && <p style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</p>}
          {error   && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

          {/* ── Список диагнозов ── */}
          {!loading && tab === 'diagnoses' && (
            filteredDiagnoses.length === 0
              ? <EmptyState icon={<Stethoscope size={32}/>} text={t('medical.no_diagnoses')} onAdd={openDiagCreate} addLabel={t('medical.add_diagnosis')} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredDiagnoses.map(d => (
                    <DiagnosisRow key={d.id} d={d}
                      who={relativeName(d.relative_id)}
                      t={t}
                      onEdit={() => openDiagEdit(d)}
                      onDelete={() => deleteDiag(d.id)}
                    />
                  ))}
                </div>
          )}

          {/* ── Список аллергий ── */}
          {!loading && tab === 'allergies' && (
            filteredAllergies.length === 0
              ? <EmptyState icon={<AlertTriangle size={32}/>} text={t('medical.no_allergies')} onAdd={openAllergyCreate} addLabel={t('medical.add_allergy')} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredAllergies.map(a => (
                    <AllergyRow key={a.id} a={a}
                      who={relativeName(a.relative_id)}
                      t={t}
                      onEdit={() => openAllergyEdit(a)}
                      onDelete={() => deleteAllergy(a.id)}
                    />
                  ))}
                </div>
          )}
        </div>
      </div>

      {/* ── Модалка диагноза ── */}
      <Modal isOpen={diagModal} onClose={() => setDiagModal(false)}
        title={diagTarget ? t('common.edit') : t('medical.add_diagnosis')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDiagModal(false)}>{t('common.cancel')}</Button>
            <Button size="sm" loading={diagSaving} onClick={saveDiag}>{t('common.save')}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input id="d_title" name="title" label={t('medical.disease_name')}
            value={diagForm.title}
            onChange={e => setDiagForm(p => ({ ...p, title: e.target.value }))}
            error={diagError && !diagForm.title ? diagError : ''}
          />
          <div className="form-row">
            <IcdAutocomplete
              label={t('medical.icd_code')}
              value={diagForm.icd_code}
              onChange={(code, title) => setDiagForm(p => ({
                ...p,
                icd_code: code,
                // Автозаполняем название если поле пустое
                title: p.title || title,
              }))}
            />
            <Input id="d_date" name="diagnosed_at" type="date" label={t('medical.diagnosed_at')}
              value={diagForm.diagnosed_at}
              onChange={e => setDiagForm(p => ({ ...p, diagnosed_at: e.target.value }))}
            />
          </div>
          <Input id="d_relative" name="relative_id" as="select" label={t('medical.who')}
            value={diagForm.relative_id}
            onChange={e => setDiagForm(p => ({ ...p, relative_id: e.target.value }))}
          >
            <option value="">{t('medical.me')}</option>
            {relatives.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </Input>
          <Input id="d_desc" name="description" as="textarea" label={t('medical.description')}
            value={diagForm.description}
            onChange={e => setDiagForm(p => ({ ...p, description: e.target.value }))}
            rows={3} style={{ resize: 'vertical', minHeight: 70 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox"
              checked={diagForm.is_chronic}
              onChange={e => setDiagForm(p => ({ ...p, is_chronic: e.target.checked }))}
            />
            {t('medical.is_chronic')}
          </label>
          {diagError && <p className="form-error">{diagError}</p>}
        </div>
      </Modal>

      {/* ── Модалка аллергии ── */}
      <Modal isOpen={allergyModal} onClose={() => setAllergyModal(false)}
        title={allergyTarget ? t('common.edit') : t('medical.add_allergy')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAllergyModal(false)}>{t('common.cancel')}</Button>
            <Button size="sm" loading={allergySaving} onClick={saveAllergy}>{t('common.save')}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input id="a_allergen" name="allergen" label={t('medical.allergen')}
            value={allergyForm.allergen}
            onChange={e => setAllergyForm(p => ({ ...p, allergen: e.target.value }))}
            error={allergyError && !allergyForm.allergen ? allergyError : ''}
          />
          <Input id="a_relative" name="relative_id" as="select" label={t('medical.who')}
            value={allergyForm.relative_id}
            onChange={e => setAllergyForm(p => ({ ...p, relative_id: e.target.value }))}
          >
            <option value="">{t('medical.me')}</option>
            {relatives.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </Input>
          <div className="form-row">
            <Input id="a_reaction" name="reaction" label={t('medical.reaction')}
              value={allergyForm.reaction}
              onChange={e => setAllergyForm(p => ({ ...p, reaction: e.target.value }))}
            />
            <Input id="a_severity" name="severity" as="select" label={t('medical.severity')}
              value={allergyForm.severity}
              onChange={e => setAllergyForm(p => ({ ...p, severity: e.target.value }))}
            >
              <option value="">—</option>
              <option value="mild">{t('medical.severity_mild')}</option>
              <option value="moderate">{t('medical.severity_moderate')}</option>
              <option value="severe">{t('medical.severity_severe')}</option>
            </Input>
          </div>
          {allergyError && <p className="form-error">{allergyError}</p>}
        </div>
      </Modal>
    </div>
  );
}

// ─── Вспомогательные компоненты ──────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', border: 'none', cursor: 'pointer',
      borderRadius: 'var(--radius-sm)', fontWeight: 500, fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 6,
      background: active ? 'var(--color-surface)' : 'transparent',
      color: active ? 'var(--color-primary)' : 'var(--color-muted)',
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function CountBadge({ n }) {
  return (
    <span style={{
      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
      borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700,
    }}>{n}</span>
  );
}

function DiagnosisRow({ d, who, t, onEdit, onDelete }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{d.title}</span>
          {d.icd_code && <Badge color="blue">{d.icd_code}</Badge>}
          {d.is_chronic === 1 && <Badge color="red">{t('medical.is_chronic')}</Badge>}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-muted)', flexWrap: 'wrap' }}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><User size={13}/> {who}</span>
          {d.diagnosed_at && <span style={{display:'flex',alignItems:'center',gap:4}}><Calendar size={13}/> {d.diagnosed_at}</span>}
          {d.description  && <span style={{ fontStyle: 'italic' }}>{d.description}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={onEdit}><Pencil size={14}/></Button>
        <Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={14}/></Button>
      </div>
    </div>
  );
}

function AllergyRow({ a, who, t, onEdit, onDelete }) {
  const color = SEVERITY_COLOR[a.severity] || 'gray';
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{a.allergen}</span>
          {a.severity && (
            <Badge color={color}>
              {t(`medical.severity_${a.severity}`)}
            </Badge>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-muted)', flexWrap: 'wrap' }}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><User size={13}/> {who}</span>
          {a.reaction && <span>{a.reaction}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={onEdit}><Pencil size={14}/></Button>
        <Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={14}/></Button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, onAdd, addLabel }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ color: 'var(--color-muted)', marginBottom: 16 }}>{text}</p>
      <Button onClick={onAdd}>+ {addLabel}</Button>
    </div>
  );
}
