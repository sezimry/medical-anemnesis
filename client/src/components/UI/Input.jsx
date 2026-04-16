import styles from './Input.module.css';

/**
 * Обёртка над <input> и <select> с лейблом и сообщением об ошибке
 */
export default function Input({
  label,
  error,
  type = 'text',
  id,
  as: Tag = 'input',
  children,
  ...rest
}) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <Tag
        id={id}
        type={Tag === 'input' ? type : undefined}
        className={[styles.input, error ? styles.hasError : ''].join(' ')}
        {...rest}
      >
        {children}
      </Tag>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
