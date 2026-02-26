import styles from './Hero.module.css';

export default function Hero() {
  return (
    <div className={styles.hero}>
      <h1>A Pinch of Pearl</h1>
      <p>Warm recipes made with love — from my kitchen to yours.</p>
      <div className={styles.divider}></div>
    </div>
  );
}
