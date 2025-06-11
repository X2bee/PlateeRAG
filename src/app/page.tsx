import Canvas from '@/app/components/Canvas';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import styles from '@/app/assets/PlateeRAG.module.scss'; 

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        <Canvas />
        <Sidebar />
      </main>
    </div>
  );
}