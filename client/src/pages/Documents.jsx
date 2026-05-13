import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { Upload, Trash2, Eye, FileText, Image, Filter, Plus, Pencil, Calendar, User, Building2 } from 'lucide-react';
import Sidebar from '../components/Layout/Sidebar.jsx';
import Navbar  from '../components/Layout/Navbar.jsx';
import Button  from '../components/UI/Button.jsx';
import Modal   from '../components/UI/Modal.jsx';
import Input   from '../components/UI/Input.jsx';
import Badge   from '../components/UI/Badge.jsx';
import api     from '../api/index.js';

const TYPES = [
  { value: '',             label: 'Все типы' },
  { value: 'discharge',    label: 'Выписка из больницы' },
  { value: 'surgery',      label: 'Выписка после операции' },
  { value: 'imaging',      label: 'Лучевое обследование' },
  { value: 'prescription', label: 'Назначение врача' },
  { value: 'other',        label: 'Другое' },
];

const TYPE_COLOR = {
  discharge: 'blue', surgery: 'red', imaging: 'green',
  prescription: 'yellow', other: 'gray',
};

function emptyForm() {
  return { title:'', type:'other', doctor_name:'', institution:'', doc_date:'', description:'' };
}

export default function Documents() {
  const toast   = useToast();
  const fileRef = useRef();

  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form,     setForm]     = useState(emptyForm());
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null); // { url, type, name }

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents', { params: filter ? { type: filter } : {} });
      setDocs(data);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const openCreate = () => { setEditItem(null); setForm(emptyForm()); setFile(null); setModal(true); };
  const openEdit   = (d) => {
    setEditItem(d);
    setForm({ title: d.title, type: d.type, doctor_name: d.doctor_name||'',
              institution: d.institution||'', doc_date: d.doc_date||'', description: d.description||'' });
    setFile(null);
    setModal(true);
  };

  const save = async () => {
    if (!form.title) return toast.error('Введите название');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);

    try {
      if (editItem) {
        await api.put(`/documents/${editItem.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Документ обновлён');
      } else {
        await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Документ добавлен');
      }
      setModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Ошибка'); }
  };

  const del = async (id) => {
    if (!confirm('Удалить документ?')) return;
    await api.delete(`/documents/${id}`);
    toast.success('Удалено');
    load();
  };

  const openPreview = (doc) => {
    if (!doc.file_path) return toast.info('Файл не прикреплён');
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/documents/${doc.id}/file?token=${token}`;
    setPreview({ url, mime: doc.file_mime, name: doc.file_name });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} КБ`;
    return `${(bytes/1024/1024).toFixed(1)} МБ`;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Документы"
          actions={<Button onClick={openCreate}><Plus size={15} style={{marginRight:4}}/>Добавить</Button>}
        />
        <div className="app-content">

          {/* Фильтр по типу */}
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setFilter(t.value)} style={{
                padding:'6px 14px', borderRadius:20, border:'2px solid',
                cursor:'pointer', fontSize:13, fontWeight:500,
                borderColor: filter===t.value ? 'var(--color-primary)' : 'var(--color-border)',
                background:  filter===t.value ? 'var(--color-primary)' : 'transparent',
                color:       filter===t.value ? '#fff' : 'var(--color-text)',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Список документов */}
          {loading ? <p style={{color:'var(--color-muted)'}}>Загрузка...</p> :
           docs.length === 0 ? (
            <div className="card" style={{textAlign:'center', padding:48}}>
              <FileText size={48} style={{opacity:0.3, marginBottom:12}}/>
              <p style={{color:'var(--color-muted)'}}>Нет документов</p>
              <Button onClick={openCreate} style={{marginTop:16}}>
                <Plus size={15} style={{marginRight:4}}/> Добавить первый
              </Button>
            </div>
           ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12}}>
              {docs.map(d => (
                <div key={d.id} className="card">
                  {/* Превью файла */}
                  {d.file_path && d.file_mime?.startsWith('image') && (
                    <div style={{
                      height:140, borderRadius:8, overflow:'hidden', marginBottom:12,
                      background:'var(--color-border)', cursor:'pointer',
                    }} onClick={() => openPreview(d)}>
                      <img
                        src={`http://localhost:5000/api/documents/${d.id}/file?token=${localStorage.getItem('token')}`}
                        alt={d.title}
                        style={{width:'100%', height:'100%', objectFit:'cover'}}
                      />
                    </div>
                  )}
                  {d.file_path && d.file_mime === 'application/pdf' && (
                    <div style={{
                      height:80, borderRadius:8, background:'#fee2e2',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      marginBottom:12, cursor:'pointer', gap:8,
                    }} onClick={() => openPreview(d)}>
                      <FileText size={32} color="#ef4444"/>
                      <span style={{fontSize:13, color:'#ef4444', fontWeight:600}}>PDF</span>
                    </div>
                  )}

                  {/* Инфо */}
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight:700, fontSize:15, marginBottom:4}}>{d.title}</div>
                      <Badge color={TYPE_COLOR[d.type] || 'gray'} style={{marginBottom:6}}>
                        {TYPES.find(t => t.value === d.type)?.label || d.type}
                      </Badge>
                      <div style={{fontSize:12, color:'var(--color-muted)', display:'flex', flexDirection:'column', gap:2}}>
                        {d.doctor_name  && <span style={{display:'flex', alignItems:'center', gap:4}}><User size={11}/> {d.doctor_name}</span>}
                        {d.institution  && <span style={{display:'flex', alignItems:'center', gap:4}}><Building2 size={11}/> {d.institution}</span>}
                        {d.doc_date     && <span style={{display:'flex', alignItems:'center', gap:4}}><Calendar size={11}/> {d.doc_date}</span>}
                        {d.file_size    && <span>{formatSize(d.file_size)}</span>}
                      </div>
                      {d.description && (
                        <p style={{fontSize:12, color:'var(--color-muted)', marginTop:6, fontStyle:'italic',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {d.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div style={{display:'flex', gap:6, marginTop:12}}>
                    {d.file_path && (
                      <Button variant="secondary" size="sm" onClick={() => openPreview(d)}>
                        <Eye size={13} style={{marginRight:4}}/> Просмотр
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                      <Pencil size={13}/>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => del(d.id)}>
                      <Trash2 size={13}/>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модал: добавить/редактировать */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editItem ? 'Редактировать документ' : 'Добавить документ'}
        footer={<><Button onClick={save}>Сохранить</Button><Button variant="secondary" onClick={() => setModal(false)}>Отмена</Button></>}
      >
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <Input label="Название *" value={form.title} onChange={e => setForm(f=>({...f, title:e.target.value}))} />

          <div>
            <label style={{fontSize:13, fontWeight:500, marginBottom:4, display:'block'}}>Тип документа</label>
            <select className="input" value={form.type} onChange={e => setForm(f=>({...f, type:e.target.value}))}>
              {TYPES.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <Input label="ФИО врача" value={form.doctor_name} onChange={e => setForm(f=>({...f, doctor_name:e.target.value}))} />
          <Input label="Учреждение" value={form.institution} onChange={e => setForm(f=>({...f, institution:e.target.value}))} />
          <Input label="Дата документа" type="date" value={form.doc_date} onChange={e => setForm(f=>({...f, doc_date:e.target.value}))} />

          <div>
            <label style={{fontSize:13, fontWeight:500, marginBottom:4, display:'block'}}>Описание</label>
            <textarea className="input" rows={2} value={form.description}
              onChange={e => setForm(f=>({...f, description:e.target.value}))}
              style={{width:'100%', resize:'vertical'}}/>
          </div>

          {/* Загрузка файла */}
          <div>
            <label style={{fontSize:13, fontWeight:500, marginBottom:6, display:'block'}}>
              Файл (фото или PDF, до 20МБ)
            </label>
            <input ref={fileRef} type="file" accept="image/*,application/pdf"
              style={{display:'none'}}
              onChange={e => setFile(e.target.files[0] || null)}
            />
            <Button variant="secondary" onClick={() => fileRef.current.click()}>
              <Upload size={14} style={{marginRight:6}}/> Выбрать файл
            </Button>
            {file && (
              <div style={{marginTop:8, fontSize:13, color:'var(--color-muted)', display:'flex', alignItems:'center', gap:6}}>
                {file.type.startsWith('image') ? <Image size={14}/> : <FileText size={14}/>}
                {file.name} ({formatSize(file.size)})
              </div>
            )}
            {!file && editItem?.file_name && (
              <div style={{marginTop:8, fontSize:13, color:'var(--color-muted)'}}>
                Текущий файл: {editItem.file_name}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Модал: просмотр файла */}
      {preview && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
        }} onClick={() => setPreview(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth:'90vw', maxHeight:'90vh', position:'relative',
          }}>
            <button onClick={() => setPreview(null)} style={{
              position:'absolute', top:-36, right:0, background:'none', border:'none',
              color:'#fff', fontSize:24, cursor:'pointer',
            }}>✕</button>
            {preview.mime?.startsWith('image') ? (
              <img src={preview.url} alt={preview.name}
                style={{maxWidth:'90vw', maxHeight:'85vh', borderRadius:8, objectFit:'contain'}}/>
            ) : (
              <iframe src={preview.url} title={preview.name}
                style={{width:'80vw', height:'85vh', border:'none', borderRadius:8}}/>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
