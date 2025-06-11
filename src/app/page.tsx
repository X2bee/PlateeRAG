import Canvas from '@/app/components/Canvas';
import Header from '@/app/components/Header';
import styles from '@/app/assets/PlateeRAG.module.scss'; 

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        <Canvas />
      </main>
    </div>
  );
}