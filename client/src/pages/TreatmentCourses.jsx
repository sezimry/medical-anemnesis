import { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast }  from '../context/ToastContext.jsx';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Pill, Stethoscope, Calendar, Building2, User, CheckCircle, Clock } from 'lucide-react';
import Sidebar from '../components/Layout/Sidebar.jsx';
import Navbar  from '../components/Layout/Navbar.jsx';
import Button  from '../components/UI/Button.jsx';
import Modal   from '../components/UI/Modal.jsx';
import Input   from '../components/UI/Input.jsx';
import Badge   from '../components/UI/Badge.jsx';
import api     from '../api/index.js';

export default function TreatmentCourses() {
  const { t } = useLocale();
  const toast  = useToast();

  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState({});

  // Модалки курса
  const [courseModal, setCourseModal] = useState(false);
  const [editCourse,  setEditCourse]  = useState(null);
  const [courseForm,  setCourseForm]  = useState(emptyCourse());

  // Модалки лекарства
  const [medModal,  setMedModal]  = useState(null); // courseId
  const [editMed,   setEditMed]   = useState(null);
  const [medForm,   setMedForm]   = useState(emptyMed());

  function emptyCourse() {
    return { title:'', doctor_name:'', institution:'', prescribed_at:'', started_at:'', ended_at:'', prescription:'', notes:'', is_active:1 };
  }
  function emptyMed() {
    return { name:'', dosage:'', frequency:'', times:'', duration:'', conditions:'', notes:'' };
  }

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // ── Курсы ───────────────────────────────────────────────────────────────────
  const openCourseCreate = () => { setEditCourse(null); setCourseForm(emptyCourse()); setCourseModal(true); };
  const openCourseEdit   = (c) => { setEditCourse(c); setCourseForm({ ...c }); setCourseModal(true); };

  const saveCourse = async () => {
    if (!courseForm.title) return toast.error('Введите название курса');
    try {
      if (editCourse) {
        await api.put(`/courses/${editCourse.id}`, courseForm);
        toast.success('Курс обновлён');
      } else {
        await api.post('/courses', courseForm);
        toast.success('Курс добавлен');
      }
      setCourseModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Ошибка'); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Удалить курс лечения и все лекарства?')) return;
    await api.delete(`/courses/${id}`);
    toast.success('Курс удалён');
    load();
  };

  // ── Лекарства ────────────────────────────────────────────────────────────────
  const openMedCreate = (courseId) => { setMedModal(courseId); setEditMed(null); setMedForm(emptyMed()); };
  const openMedEdit   = (courseId, med) => { setMedModal(courseId); setEditMed(med); setMedForm({ ...med }); };

  const saveMed = async () => {
    if (!medForm.name) return toast.error('Введите название препарата');
    try {
      if (editMed) {
        await api.put(`/courses/${medModal}/medications/${editMed.id}`, medForm);
        toast.success('Лекарство обновлено');
      } else {
        await api.post(`/courses/${medModal}/medications`, medForm);
        toast.success('Лекарство добавлено');
      }
      setMedModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Ошибка'); }
  };

  const deleteMed = async (courseId, medId) => {
    if (!confirm('Удалить лекарство?')) return;
    await api.delete(`/courses/${courseId}/medications/${medId}`);
    toast.success('Удалено');
    load();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Курсы лечения"
          actions={<Button onClick={openCourseCreate}><Plus size={15} style={{marginRight:4}}/>Добавить курс</Button>}
        />
        <div className="app-content">
          {loading ? <p style={{color:'var(--color-muted)'}}>Загрузка...</p> :
           courses.length === 0 ? (
            <div className="card" style={{textAlign:'center', padding:48}}>
              <Stethoscope size={48} style={{opacity:0.3, marginBottom:12}}/>
              <p style={{color:'var(--color-muted)'}}>Нет курсов лечения</p>
              <Button onClick={openCourseCreate} style={{marginTop:16}}>
                <Plus size={15} style={{marginRight:4}}/> Добавить первый курс
              </Button>
            </div>
           ) : (
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {courses.map(c => (
                <div key={c.id} className="card">
                  {/* Заголовок курса */}
                  <div style={{display:'flex', alignItems:'flex-start', gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6}}>
                        <span style={{fontWeight:700, fontSize:16}}>{c.title}</span>
                        <Badge color={c.is_active ? 'green' : 'gray'}>
                          {c.is_active ? 'Активный' : 'Завершён'}
                        </Badge>
                        {c.medications_count > 0 && (
                          <Badge color="blue">{c.medications_count} препарат(ов)</Badge>
                        )}
                      </div>
                      <div style={{display:'flex', gap:16, fontSize:13, color:'var(--color-muted)', flexWrap:'wrap'}}>
                        {c.doctor_name  && <span style={{display:'flex',alignItems:'center',gap:4}}><User size={13}/> {c.doctor_name}</span>}
                        {c.institution  && <span style={{display:'flex',alignItems:'center',gap:4}}><Building2 size={13}/> {c.institution}</span>}
                        {c.started_at   && <span style={{display:'flex',alignItems:'center',gap:4}}><Calendar size={13}/> {c.started_at} {c.ended_at && `— ${c.ended_at}`}</span>}
                      </div>
                      {c.prescription && (
                        <p style={{marginTop:8, fontSize:13, fontStyle:'italic', color:'var(--color-muted)'}}>{c.prescription}</p>
                      )}
                    </div>
                    <div style={{display:'flex', gap:6, flexShrink:0}}>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(c.id)}>
                        {expanded[c.id] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openCourseEdit(c)}><Pencil size={14}/></Button>
                      <Button variant="danger" size="sm" onClick={() => deleteCourse(c.id)}><Trash2 size={14}/></Button>
                    </div>
                  </div>

                  {/* Список лекарств */}
                  {expanded[c.id] && (
                    <div style={{marginTop:16, borderTop:'1px solid var(--color-border)', paddingTop:12}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                        <span style={{fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:6}}>
                          <Pill size={15}/> Лекарства
                        </span>
                        <Button size="sm" onClick={() => openMedCreate(c.id)}>
                          <Plus size={13} style={{marginRight:4}}/> Добавить
                        </Button>
                      </div>

                      {(!c.medications || c.medications_count === 0) ? (
                        <p style={{color:'var(--color-muted)', fontSize:13}}>Лекарства не добавлены</p>
                      ) : (
                        <MedList courseId={c.id} onEdit={openMedEdit} onDelete={deleteMed} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модал: курс лечения */}
      <Modal isOpen={courseModal} onClose={() => setCourseModal(false)}
        title={editCourse ? 'Редактировать курс' : 'Новый курс лечения'}
        footer={<><Button onClick={saveCourse}>Сохранить</Button><Button variant="secondary" onClick={() => setCourseModal(false)}>Отмена</Button></>}
      >
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <Input label="Название курса *" value={courseForm.title} onChange={e => setCourseForm(f=>({...f, title:e.target.value}))} />
          <Input label="ФИО врача" value={courseForm.doctor_name} onChange={e => setCourseForm(f=>({...f, doctor_name:e.target.value}))} />
          <Input label="Медицинское учреждение" value={courseForm.institution} onChange={e => setCourseForm(f=>({...f, institution:e.target.value}))} />
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <Input label="Дата назначения" type="date" value={courseForm.prescribed_at} onChange={e => setCourseForm(f=>({...f, prescribed_at:e.target.value}))} />
            <Input label="Дата начала" type="date" value={courseForm.started_at} onChange={e => setCourseForm(f=>({...f, started_at:e.target.value}))} />
            <Input label="Дата окончания" type="date" value={courseForm.ended_at} onChange={e => setCourseForm(f=>({...f, ended_at:e.target.value}))} />
          </div>
          <div>
            <label style={{fontSize:13, fontWeight:500, marginBottom:4, display:'block'}}>Назначение врача</label>
            <textarea className="input" rows={3} value={courseForm.prescription}
              onChange={e => setCourseForm(f=>({...f, prescription:e.target.value}))}
              style={{width:'100%', resize:'vertical'}} />
          </div>
          <div>
            <label style={{fontSize:13, fontWeight:500, marginBottom:4, display:'block'}}>Примечание</label>
            <textarea className="input" rows={2} value={courseForm.notes}
              onChange={e => setCourseForm(f=>({...f, notes:e.target.value}))}
              style={{width:'100%', resize:'vertical'}} />
          </div>
          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
            <input type="checkbox" checked={!!courseForm.is_active}
              onChange={e => setCourseForm(f=>({...f, is_active: e.target.checked ? 1 : 0}))} />
            Активный курс
          </label>
        </div>
      </Modal>

      {/* Модал: лекарство */}
      <Modal isOpen={!!medModal} onClose={() => setMedModal(null)}
        title={editMed ? 'Редактировать лекарство' : 'Добавить лекарство'}
        footer={<><Button onClick={saveMed}>Сохранить</Button><Button variant="secondary" onClick={() => setMedModal(null)}>Отмена</Button></>}
      >
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <Input label="Название препарата *" value={medForm.name} onChange={e => setMedForm(f=>({...f, name:e.target.value}))} />
          <Input label="Дозировка" placeholder="Например: 500 мг" value={medForm.dosage} onChange={e => setMedForm(f=>({...f, dosage:e.target.value}))} />
          <Input label="Частота приёма" placeholder="Например: 3 раза в день" value={medForm.frequency} onChange={e => setMedForm(f=>({...f, frequency:e.target.value}))} />
          <Input label="Время приёма" placeholder="Например: 08:00, 14:00, 20:00" value={medForm.times} onChange={e => setMedForm(f=>({...f, times:e.target.value}))} />
          <Input label="Продолжительность" placeholder="Например: 7 дней" value={medForm.duration} onChange={e => setMedForm(f=>({...f, duration:e.target.value}))} />
          <Input label="Условия приёма" placeholder="Например: после еды" value={medForm.conditions} onChange={e => setMedForm(f=>({...f, conditions:e.target.value}))} />
          <Input label="Примечание" value={medForm.notes} onChange={e => setMedForm(f=>({...f, notes:e.target.value}))} />
        </div>
      </Modal>
    </div>
  );
}

// Подкомпонент — загружает лекарства курса
function MedList({ courseId, onEdit, onDelete }) {
  const [meds, setMeds] = useState([]);

  useEffect(() => {
    api.get(`/courses/${courseId}/medications`).then(r => setMeds(r.data));
  }, [courseId]);

  if (meds.length === 0) return <p style={{color:'var(--color-muted)', fontSize:13}}>Лекарства не добавлены</p>;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      {meds.map(m => (
        <div key={m.id} style={{
          background:'var(--color-bg)', border:'1px solid var(--color-border)',
          borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <Pill size={16} color="var(--color-primary)" style={{marginTop:2, flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, fontSize:14}}>{m.name}</div>
            <div style={{display:'flex', gap:12, fontSize:12, color:'var(--color-muted)', flexWrap:'wrap', marginTop:2}}>
              {m.dosage     && <span>💊 {m.dosage}</span>}
              {m.frequency  && <span>🔄 {m.frequency}</span>}
              {m.times      && <span>🕐 {m.times}</span>}
              {m.duration   && <span>📅 {m.duration}</span>}
              {m.conditions && <span>📋 {m.conditions}</span>}
            </div>
          </div>
          <div style={{display:'flex', gap:4}}>
            <Button variant="ghost" size="sm" onClick={() => onEdit(courseId, m)}><Pencil size={13}/></Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(courseId, m.id)}><Trash2 size={13}/></Button>
          </div>
        </div>
      ))}
    </div>
  );
}
