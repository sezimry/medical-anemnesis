import styles from './Badge.module.css';

/**
 * color: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
 */
export default function Badge({ children, color = 'blue' }) {
  return (
    <span className={[styles.badge, styles[color]].join(' ')}>
      {children}
    </span>
  );
}
