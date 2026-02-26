import styles from './Hero.module.css';

export default function Hero() {
  return (
    <div className={styles.hero}>
      <h1>A Pinch of Pearl</h1>
      <p>I don't make recipes, I just deliver them.</p>
      <div className={styles.divider}></div>
    </div>
  );
}
