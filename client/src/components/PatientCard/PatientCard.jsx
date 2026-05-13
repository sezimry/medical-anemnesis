import { User, Stethoscope, AlertTriangle, Calendar } from 'lucide-react';
import Badge from '../UI/Badge.jsx';
import styles from './PatientCard.module.css';

const SEVERITY_COLOR = { mild: 'green', moderate: 'yellow', severe: 'red' };

export default function PatientCard({ person, diagnoses = [], allergies = [], t, isSelf = false }) {
  return (
    <div className={[styles.card, isSelf ? styles.self : ''].join(' ')}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <User size={24} />
        </div>
        <div className={styles.info}>
          <div className={styles.name}>{person.full_name}</div>
          <div className={styles.meta}>
            {person.birth_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> {person.birth_date}
              </span>
            )}
            {person.relation_type && !isSelf && (
              <Badge color={person.gender === 'male' ? 'blue' : person.gender === 'female' ? 'red' : 'gray'}>
                {t(`relatives.relations.${person.relation_type}`)}
              </Badge>
            )}
            {isSelf && <Badge color="blue">Вы</Badge>}
          </div>
        </div>
      </div>

      {diagnoses.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Stethoscope size={14} style={{ marginRight: 4 }} />
            {t('medical.diagnoses')}
          </div>
          <div className={styles.list}>
            {diagnoses.map(d => (
              <div key={d.id} className={styles.diagRow}>
                <div className={styles.diagMain}>
                  <span className={styles.diagTitle}>{d.title}</span>
                  {d.icd_code && <Badge color="blue">{d.icd_code}</Badge>}
                  {d.is_chronic === 1 && <Badge color="red">{t('medical.is_chronic')}</Badge>}
                </div>
                {d.diagnosed_at && (
                  <span className={styles.diagDate}>{d.diagnosed_at}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {allergies.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <AlertTriangle size={14} style={{ marginRight: 4 }} />
            {t('medical.allergies')}
          </div>
          <div className={styles.list}>
            {allergies.map(a => (
              <div key={a.id} className={styles.allergyRow}>
                <span className={styles.allergen}>{a.allergen}</span>
                {a.severity && (
                  <Badge color={SEVERITY_COLOR[a.severity] || 'gray'}>
                    {t(`medical.severity_${a.severity}`)}
                  </Badge>
                )}
                {a.reaction && (
                  <span className={styles.reaction}>— {a.reaction}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnoses.length === 0 && allergies.length === 0 && (
        <p className={styles.empty}>{t('dashboard.no_data')}</p>
      )}
    </div>
  );
}
