import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>A Pinch of Pearl</div>
      <p>Pearl&apos;s recipe collection</p>
    </footer>
  );
}
