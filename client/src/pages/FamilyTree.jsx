import { useState } from 'react';
import { useLocale }    from '../context/LocaleContext.jsx';
import { useAuth }      from '../hooks/useAuth.js';
import { useRelatives } from '../hooks/useRelatives.js';
import { exportJson, exportPdf } from '../utils/export.js';
import Sidebar from '../components/Layout/Sidebar.jsx';
import Navbar  from '../components/Layout/Navbar.jsx';
import Button  from '../components/UI/Button.jsx';
import Badge   from '../components/UI/Badge.jsx';
import { Printer, Download, User, GitBranch } from 'lucide-react';

// ─── Константы раскладки дерева ───────────────────────────────────────────────
const NODE_W   = 140;
const NODE_H   = 64;
const H_GAP    = 40;   // горизонтальный отступ между узлами
const V_GAP    = 90;   // вертикальный отступ между уровнями

const GENDER_BG     = { male: '#dbeafe', female: '#fce7f3', other: '#f1f5f9' };
const GENDER_BORDER = { male: '#93c5fd', female: '#f9a8d4', other: '#cbd5e1' };
const GENDER_ICON   = { male: '♂', female: '♀', other: '○' };

// ─── Алгоритм раскладки ───────────────────────────────────────────────────────
// Возвращает Map<id, {x, y}> — позиции узлов
function buildLayout(nodes, rootUserId) {
  // Строим дерево: children[parentId] = [childId, ...]
  const children = {};
  const roots    = []; // узлы без parent_relative_id

  for (const n of nodes) {
    const pid = n.parent_relative_id;
    if (pid) {
      if (!children[pid]) children[pid] = [];
      children[pid].push(n.id);
    } else {
      roots.push(n.id);
    }
  }

  const positions = {};
  let   cursor    = 0; // текущая X-позиция при обходе листьев

  function placeSubtree(id, depth) {
    const kids = children[id] || [];
    if (kids.length === 0) {
      // Лист — занимаем одну колонку
      positions[id] = { x: cursor * (NODE_W + H_GAP), y: depth * (NODE_H + V_GAP) };
      cursor++;
      return;
    }
    // Сначала рекурсивно размещаем детей
    const startCursor = cursor;
    for (const kid of kids) placeSubtree(kid, depth + 1);
    const endCursor = cursor;
    // Центрируем родителя над детьми
    const leftX  = positions[kids[0]].x;
    const rightX = positions[kids[kids.length - 1]].x;
    positions[id] = { x: (leftX + rightX) / 2, y: depth * (NODE_H + V_GAP) };
  }

  for (const r of roots) placeSubtree(r, 0);

  return positions;
}

// ─── Компонент ────────────────────────────────────────────────────────────────
export default function FamilyTree() {
  const { t }                       = useLocale();
  const { user }                    = useAuth();
  const { relatives, loading }      = useRelatives();

  const [selected,    setSelected]  = useState(null);
  const [exporting,   setExporting] = useState('');

  // Добавляем самого пользователя как корневой узел
  const selfNode = user ? {
    id: 'self',
    full_name:          user.full_name,
    birth_date:         user.birth_date || '',
    gender:             user.gender || 'other',
    relation_type:      'self',
    parent_relative_id: null,
  } : null;

  // Привязываем корневых родственников (без parent) к selfNode
  const allNodes = selfNode
    ? [
        selfNode,
        ...relatives.map(r =>
          r.parent_relative_id ? r : { ...r, parent_relative_id: 'self' }
        ),
      ]
    : relatives;

  const positions = buildLayout(allNodes, 'self');

  // Размер SVG
  const xs = Object.values(positions).map(p => p.x);
  const ys = Object.values(positions).map(p => p.y);
  const svgW = (xs.length ? Math.max(...xs) + NODE_W : NODE_W) + 60;
  const svgH = (ys.length ? Math.max(...ys) + NODE_H : NODE_H) + 60;

  // Строим рёбра (линии от родителя к детям)
  const edges = [];
  for (const n of allNodes) {
    if (!n.parent_relative_id) continue;
    const pPos = positions[n.parent_relative_id];
    const cPos = positions[n.id];
    if (!pPos || !cPos) continue;
    const x1 = pPos.x + NODE_W / 2 + 30;
    const y1 = pPos.y + NODE_H + 30;
    const x2 = cPos.x + NODE_W / 2 + 30;
    const y2 = cPos.y + 30;
    // Кривая Безье для красивых линий
    edges.push(`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`);
  }

  async function handleExport(type) {
    setExporting(type);
    try {
      if (type === 'json') await exportJson();
      else                 await exportPdf();
    } finally {
      setExporting('');
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Navbar
          title={t('nav.family_tree')}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => window.print()}>
                <Printer size={14} style={{marginRight:4}}/> Печать
              </Button>
              <Button
                variant="secondary" size="sm"
                loading={exporting === 'json'}
                onClick={() => handleExport('json')}
              >
                <Download size={14} style={{marginRight:4}}/> JSON
              </Button>
              <Button
                variant="secondary" size="sm"
                loading={exporting === 'pdf'}
                onClick={() => handleExport('pdf')}
              >
                <Download size={14} style={{marginRight:4}}/> PDF
              </Button>
            </div>
          }
        />

        <div className="app-content" style={{ padding: 24 }}>
          {loading && (
            <p style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</p>
          )}

          {!loading && allNodes.length <= 1 && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}><GitBranch size={48} color="var(--color-muted)"/></div>
              <p style={{ color: 'var(--color-muted)' }}>
                {t('relatives.no_relatives')}
              </p>
            </div>
          )}

          {!loading && allNodes.length > 1 && (
            <div style={{ display: 'flex', gap: 20 }}>
              {/* SVG-дерево */}
              <div style={{
                flex: 1, overflowX: 'auto', overflowY: 'auto',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 0,
              }}>
                <svg
                  width={svgW}
                  height={svgH}
                  style={{ display: 'block', minWidth: '100%' }}
                >
                  {/* Рёбра */}
                  {edges.map((d, i) => (
                    <path key={i} d={d}
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth={2}
                      strokeDasharray={i === 0 ? undefined : undefined}
                    />
                  ))}

                  {/* Узлы */}
                  {allNodes.map(n => {
                    const pos = positions[n.id];
                    if (!pos) return null;
                    const x   = pos.x + 30;
                    const y   = pos.y + 30;
                    const isSelf = n.id === 'self';
                    const bg     = isSelf ? '#eff6ff' : (GENDER_BG[n.gender]     || GENDER_BG.other);
                    const border = isSelf ? '#2563eb' : (GENDER_BORDER[n.gender] || GENDER_BORDER.other);
                    const icon   = isSelf ? '👤'      : (GENDER_ICON[n.gender]   || GENDER_ICON.other);
                    const isSelected = selected?.id === n.id;

                    return (
                      <g key={n.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelected(isSelected ? null : n)}
                      >
                        {/* Тень при выделении */}
                        {isSelected && (
                          <rect
                            x={x - 3} y={y - 3}
                            width={NODE_W + 6} height={NODE_H + 6}
                            rx={11} ry={11}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            opacity={0.5}
                          />
                        )}
                        {/* Карточка */}
                        <rect
                          x={x} y={y}
                          width={NODE_W} height={NODE_H}
                          rx={8} ry={8}
                          fill={bg}
                          stroke={isSelected ? '#2563eb' : border}
                          strokeWidth={isSelected ? 2 : 1.5}
                        />
                        {/* Иконка */}
                        <text x={x + 14} y={y + 22} fontSize={16}>{icon}</text>
                        {/* Имя */}
                        <foreignObject x={x + 10} y={y + 8} width={NODE_W - 20} height={NODE_H - 16}>
                          <div xmlns="http://www.w3.org/1999/xhtml" style={{
                            fontSize: 11, fontWeight: 600,
                            color: '#1e293b',
                            lineHeight: 1.3,
                            paddingLeft: 22,
                            wordBreak: 'break-word',
                          }}>
                            {n.full_name}
                          </div>
                          {n.birth_date && (
                            <div xmlns="http://www.w3.org/1999/xhtml" style={{
                              fontSize: 9, color: '#64748b',
                              paddingLeft: 22, marginTop: 2,
                            }}>
                              {n.birth_date}
                            </div>
                          )}
                        </foreignObject>
                        {/* Тип связи (снизу) */}
                        {!isSelf && (
                          <text
                            x={x + NODE_W / 2} y={y + NODE_H + 14}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#94a3b8"
                          >
                            {t(`relatives.relations.${n.relation_type}`)}
                          </text>
                        )}
                        {isSelf && (
                          <text
                            x={x + NODE_W / 2} y={y + NODE_H + 14}
                            textAnchor="middle" fontSize={9} fill="#2563eb"
                          >
                            Я
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Панель деталей выбранного узла */}
              {selected && (
                <div style={{ width: 220, flexShrink: 0 }}>
                  <div className="card" style={{ position: 'sticky', top: 24 }}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 36, marginBottom: 4 }}>
                        {GENDER_ICON[selected.gender] || '🧑'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.full_name}</div>
                      {selected.id !== 'self' && (
                        <div style={{ marginTop: 6 }}>
                          <Badge color={selected.gender === 'male' ? 'blue' : selected.gender === 'female' ? 'red' : 'gray'}>
                            {t(`relatives.relations.${selected.relation_type}`)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="divider" />

                    <dl style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      {selected.birth_date && (
                        <Detail label={t('auth.birth_date')} value={selected.birth_date} />
                      )}
                      <Detail
                        label={t('auth.gender')}
                        value={
                          { male: t('auth.gender_male'), female: t('auth.gender_female'), other: t('auth.gender_other') }[selected.gender] || '—'
                        }
                      />
                      {selected.notes && (
                        <Detail label="Заметки" value={selected.notes} />
                      )}
                    </dl>

                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        marginTop: 16, width: '100%', padding: '6px 0',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)', background: 'none',
                        fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer',
                      }}
                    >
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Легенда */}
          {!loading && allNodes.length > 1 && (
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              <LegendItem color="#dbeafe" label={t('auth.gender_male')} />
              <LegendItem color="#fce7f3" label={t('auth.gender_female')} />
              <LegendItem color="#f1f5f9" label={t('auth.gender_other')} />
              <LegendItem color="#eff6ff" border="#2563eb" label="Вы" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function LegendItem({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-muted)' }}>
      <div style={{
        width: 14, height: 14, borderRadius: 3,
        background: color,
        border: `1.5px solid ${border || '#cbd5e1'}`,
      }} />
      {label}
    </div>
  );
}
