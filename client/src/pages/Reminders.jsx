import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { Plus, Pencil, Trash2, Bell, BellOff, Clock, Pill, Calendar } from 'lucide-react';
import Sidebar from '../components/Layout/Sidebar.jsx';
import Navbar  from '../components/Layout/Navbar.jsx';
import Button  from '../components/UI/Button.jsx';
import Modal   from '../components/UI/Modal.jsx';
import Input   from '../components/UI/Input.jsx';
import Badge   from '../components/UI/Badge.jsx';
import api     from '../api/index.js';

const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const DAYS_VALUES = ['1','2','3','4','5','6','7'];

function emptyForm() {
  return { title: '', time: '', days: [], medication_id: '', course_id: '', is_enabled: 1 };
}

export default function Reminders() {
  const toast = useToast();

  const [reminders, setReminders] = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [form,      setForm]      = useState(emptyForm());

  // Все лекарства из всех курсов
  const [medications, setMedications] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [remRes, cRes] = await Promise.all([
        api.get('/reminders'),
        api.get('/courses'),
      ]);
      setReminders(remRes.data);
      setCourses(cRes.data);

      // Загружаем лекарства из всех курсов
      const medResults = await Promise.all(
        cRes.data.map(c => api.get(`/courses/${c.id}/medications`))
      );
      const allMeds = medResults.flatMap((r, i) =>
        r.data.map(m => ({ ...m, course_title: cRes.data[i].title }))
      );
      setMedications(allMeds);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm()); setModal(true); };
  const openEdit   = (r) => {
    setEditItem(r);
    setForm({
      title:         r.title,
      time:          r.time,
      days:          r.days ? r.days.split(',') : [],
      medication_id: r.medication_id || '',
      course_id:     r.course_id || '',
      is_enabled:    r.is_enabled,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.title) return toast.error('Введите название');
    if (!form.time)  return toast.error('Укажите время');
    const body = {
      ...form,
      days:          form.days.length ? form.days.join(',') : null,
      medication_id: form.medication_id || null,
      course_id:     form.course_id || null,
    };
    try {
      if (editItem) {
        await api.put(`/reminders/${editItem.id}`, body);
        toast.success('Напоминание обновлено');
      } else {
        await api.post('/reminders', body);
        toast.success('Напоминание добавлено');
      }
      setModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Ошибка'); }
  };

  const toggle = async (r) => {
    await api.patch(`/reminders/${r.id}/toggle`);
    load();
  };

  const del = async (id) => {
    if (!confirm('Удалить напоминание?')) return;
    await api.delete(`/reminders/${id}`);
    toast.success('Удалено');
    load();
  };

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d],
    }));
  };

  const activeCount   = reminders.filter(r => r.is_enabled).length;
  const inactiveCount = reminders.length - activeCount;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar
          title="Напоминания"
          actions={<Button onClick={openCreate}><Plus size={15} style={{marginRight:4}}/>Добавить</Button>}
        />
        <div className="app-content">

          {/* Статистика */}
          {reminders.length > 0 && (
            <div style={{display:'flex', gap:12, marginBottom:20, flexWrap:'wrap'}}>
              <div className="card" style={{flex:1, minWidth:120, textAlign:'center', padding:'12px 16px'}}>
                <div style={{fontSize:24, fontWeight:700, color:'var(--color-primary)'}}>{reminders.length}</div>
                <div style={{fontSize:12, color:'var(--color-muted)'}}>Всего</div>
              </div>
              <div className="card" style={{flex:1, minWidth:120, textAlign:'center', padding:'12px 16px'}}>
                <div style={{fontSize:24, fontWeight:700, color:'#22c55e'}}>{activeCount}</div>
                <div style={{fontSize:12, color:'var(--color-muted)'}}>Активных</div>
              </div>
              <div className="card" style={{flex:1, minWidth:120, textAlign:'center', padding:'12px 16px'}}>
                <div style={{fontSize:24, fontWeight:700, color:'var(--color-muted)'}}>{inactiveCount}</div>
                <div style={{fontSize:12, color:'var(--color-muted)'}}>Отключённых</div>
              </div>
            </div>
          )}

          {/* Список */}
          {loading ? <p style={{color:'var(--color-muted)'}}>Загрузка...</p> :
           reminders.length === 0 ? (
            <div className="card" style={{textAlign:'center', padding:48}}>
              <Bell size={48} style={{opacity:0.3, marginBottom:12}}/>
              <p style={{color:'var(--color-muted)'}}>Нет напоминаний</p>
              <Button onClick={openCreate} style={{marginTop:16}}>
                <Plus size={15} style={{marginRight:4}}/> Добавить первое
              </Button>
            </div>
           ) : (
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {reminders.map(r => (
                <div key={r.id} className="card" style={{
                  display:'flex', alignItems:'center', gap:12,
                  opacity: r.is_enabled ? 1 : 0.55,
                }}>
                  {/* Иконка */}
                  <div style={{
                    width:44, height:44, borderRadius:'50%', flexShrink:0,
                    background: r.is_enabled ? 'var(--color-primary)' : 'var(--color-border)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {r.is_enabled
                      ? <Bell size={20} color="#fff"/>
                      : <BellOff size={20} color="var(--color-muted)"/>}
                  </div>

                  {/* Инфо */}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:600, fontSize:15}}>{r.title}</div>
                    <div style={{display:'flex', gap:12, fontSize:12, color:'var(--color-muted)', flexWrap:'wrap', marginTop:3}}>
                      <span style={{display:'flex', alignItems:'center', gap:4}}>
                        <Clock size={12}/> {r.time}
                      </span>
                      {r.medication_name && (
                        <span style={{display:'flex', alignItems:'center', gap:4}}>
                          <Pill size={12}/> {r.medication_name}
                        </span>
                      )}
                      {r.course_title && (
                        <span style={{display:'flex', alignItems:'center', gap:4}}>
                          <Calendar size={12}/> {r.course_title}
                        </span>
                      )}
                    </div>
                    {r.days && (
                      <div style={{display:'flex', gap:4, marginTop:4, flexWrap:'wrap'}}>
                        {r.days.split(',').map(d => (
                          <span key={d} style={{
                            background:'var(--color-primary)', color:'#fff',
                            borderRadius:4, padding:'1px 6px', fontSize:11,
                          }}>
                            {DAYS[parseInt(d)-1]}
                          </span>
                        ))}
                      </div>
                    )}
                    {!r.days && (
                      <Badge color="blue" style={{marginTop:4, fontSize:10}}>Каждый день</Badge>
                    )}
                  </div>

                  {/* Действия */}
                  <div style={{display:'flex', gap:4, flexShrink:0}}>
                    <Button
                      variant={r.is_enabled ? 'secondary' : 'ghost'}
                      size="sm"
                      title={r.is_enabled ? 'Отключить' : 'Включить'}
                      onClick={() => toggle(r)}
                    >
                      {r.is_enabled ? <BellOff size={14}/> : <Bell size={14}/>}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil size={14}/></Button>
                    <Button variant="danger" size="sm" onClick={() => del(r.id)}><Trash2 size={14}/></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модал */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editItem ? 'Редактировать напоминание' : 'Новое напоминание'}
        footer={
          <>
            <Button onClick={save}>Сохранить</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Отмена</Button>
          </>
        }
      >
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <Input
            label="Название *"
            placeholder="Например: Принять таблетку"
            value={form.title}
            onChange={e => setForm(f => ({...f, title: e.target.value}))}
          />

          <Input
            label="Время *"
            type="time"
            value={form.time}
            onChange={e => setForm(f => ({...f, time: e.target.value}))}
          />

          {/* Дни недели */}
          <div>
            <label style={{fontSize:13, fontWeight:500, marginBottom:6, display:'block'}}>
              Дни недели <span style={{color:'var(--color-muted)', fontWeight:400}}>(пусто = каждый день)</span>
            </label>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(DAYS_VALUES[i])}
                  style={{
                    width:36, height:36, borderRadius:'50%', border:'2px solid',
                    cursor:'pointer', fontSize:12, fontWeight:600,
                    borderColor: form.days.includes(DAYS_VALUES[i]) ? 'var(--color-primary)' : 'var(--color-border)',
                    background:  form.days.includes(DAYS_VALUES[i]) ? 'var(--color-primary)' : 'transparent',
                    color:       form.days.includes(DAYS_VALUES[i]) ? '#fff' : 'var(--color-text)',
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Привязка к лекарству */}
          {medications.length > 0 && (
            <div>
              <label style={{fontSize:13, fontWeight:500, marginBottom:4, display:'block'}}>
                Привязать к лекарству
              </label>
              <select className="input" value={form.medication_id}
                onChange={e => setForm(f => ({...f, medication_id: e.target.value}))}>
                <option value="">Без привязки</option>
                {medications.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.course_title})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Привязка к курсу */}
          {courses.length > 0 && (
            <div>
              <label style={{fontSize:13, fontWeight:500, marginBottom:4, display:'block'}}>
                Привязать к курсу
              </label>
              <select className="input" value={form.course_id}
                onChange={e => setForm(f => ({...f, course_id: e.target.value}))}>
                <option value="">Без привязки</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
            <input
              type="checkbox"
              checked={!!form.is_enabled}
              onChange={e => setForm(f => ({...f, is_enabled: e.target.checked ? 1 : 0}))}
            />
            Активное напоминание
          </label>
        </div>
      </Modal>
    </div>
  );
}
