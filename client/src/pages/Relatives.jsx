import { useState } from 'react';
import { useLocale } from '../context/LocaleContext.jsx';
import { useRelatives } from '../hooks/useRelatives.js';
import { User, Pencil, Trash2 } from 'lucide-react';
import Sidebar  from '../components/Layout/Sidebar.jsx';
import Navbar   from '../components/Layout/Navbar.jsx';
import Button   from '../components/UI/Button.jsx';
import Input    from '../components/UI/Input.jsx';
import Modal    from '../components/UI/Modal.jsx';
import Badge    from '../components/UI/Badge.jsx';

const RELATION_TYPES = [
  'mother','father','sister','brother',
  'grandmother','grandfather','aunt','uncle',
  'daughter','son','other',
];

const GENDER_COLOR = { male: 'blue', female: 'red', other: 'gray' };

const EMPTY_FORM = {
  full_name: '', birth_date: '', gender: '',
  relation_type: '', parent_relative_id: '', notes: '',
};

export default function Relatives() {
  const { t } = useLocale();
  const { relatives, loading, error, create, update, remove } = useRelatives();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = создание
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(rel) {
    setEditTarget(rel);
    setForm({
      full_name:          rel.full_name,
      birth_date:         rel.birth_date || '',
      gender:             rel.gender || '',
      relation_type:      rel.relation_type,
      parent_relative_id: rel.parent_relative_id || '',
      notes:              rel.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.relation_type) {
      setFormError('ФИО и тип связи обязательны');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        parent_relative_id: form.parent_relative_id || null,
      };
      if (editTarget) {
        await update(editTarget.id, payload);
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirm_delete'))) return;
    await remove(id);
  }

  // Поиск по имени
  const filtered = relatives.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Navbar
          title={t('relatives.title')}
          actions={
            <Button size="sm" onClick={openCreate}>
              + {t('relatives.add')}
            </Button>
          }
        />

        <div className="app-content">
          {/* Поиск */}
          <div style={{ marginBottom: 20, maxWidth: 320 }}>
            <Input
              placeholder="Поиск по имени..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Состояния */}
          {loading && <p style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</p>}
          {error   && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

          {/* Сетка карточек */}
          {!loading && filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p style={{ color: 'var(--color-muted)' }}>{t('relatives.no_relatives')}</p>
              <Button style={{ marginTop: 16 }} onClick={openCreate}>
                + {t('relatives.add')}
              </Button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(rel => (
              <RelativeCard
                key={rel.id}
                rel={rel}
                t={t}
                onEdit={() => openEdit(rel)}
                onDelete={() => handleDelete(rel.id)}
                genderColor={GENDER_COLOR[rel.gender] || 'gray'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Модалка создания / редактирования */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? t('relatives.edit') : t('relatives.add')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            id="full_name" name="full_name"
            label={t('auth.full_name')}
            value={form.full_name}
            onChange={handleChange}
            error={!form.full_name && formError ? formError : ''}
          />

          <Input id="relation_type" name="relation_type" as="select"
            label={t('relatives.relation')}
            value={form.relation_type}
            onChange={handleChange}
            error={!form.relation_type && formError ? formError : ''}
          >
            <option value="">—</option>
            {RELATION_TYPES.map(r => (
              <option key={r} value={r}>{t(`relatives.relations.${r}`)}</option>
            ))}
          </Input>

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

          {/* Привязка к родителю (для дерева) */}
          {relatives.length > 0 && (
            <Input id="parent_relative_id" name="parent_relative_id" as="select"
              label="Родитель в дереве"
              value={form.parent_relative_id}
              onChange={handleChange}
            >
              <option value="">—</option>
              {relatives
                .filter(r => !editTarget || r.id !== editTarget.id)
                .map(r => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({t(`relatives.relations.${r.relation_type}`)})
                  </option>
                ))}
            </Input>
          )}

          <Input
            id="notes" name="notes" as="textarea"
            label="Заметки"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            style={{ resize: 'vertical', minHeight: 70 }}
          />

          {formError && <p className="form-error">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
}

function RelativeCard({ rel, t, onEdit, onDelete, genderColor }) {
  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Аватар + имя */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: genderColor === 'blue' ? '#dbeafe' : genderColor === 'red' ? '#fee2e2' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          <User size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rel.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {rel.birth_date || '—'}
          </div>
        </div>
      </div>

      {/* Тип связи */}
      <Badge color={genderColor}>
        {t(`relatives.relations.${rel.relation_type}`)}
      </Badge>

      {/* Заметки */}
      {rel.notes && (
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 10, lineHeight: 1.4 }}>
          {rel.notes}
        </p>
      )}

      {/* Действия */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="ghost" size="sm" onClick={onEdit} style={{ flex: 1 }}>
          <Pencil size={14} style={{marginRight:4}}/> {t('common.edit')}
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          <Trash2 size={14}/>
        </Button>
      </div>
    </div>
  );
}
