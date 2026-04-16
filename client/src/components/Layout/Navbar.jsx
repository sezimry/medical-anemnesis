import styles from './Navbar.module.css';

/**
 * Верхняя полоса на каждой странице — заголовок + слот для действий
 */
export default function Navbar({ title, actions }) {
  return (
    <header className={styles.navbar}>
      <h1 className={styles.title}>{title}</h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
