"use client"; 
import { useState } from 'react'; 

import Canvas from '@/app/components/Canvas';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import styles from '@/app/assets/PlateeRAG.module.scss'; 

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.pageContainer}>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <main className={styles.mainContent}>
        <Canvas />
                {isSidebarOpen && <Sidebar />}
      </main>
    </div>
  );
}