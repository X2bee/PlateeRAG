'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './ResizablePanel.module.scss';

interface ResizablePanelProps {
  children: [React.ReactNode, React.ReactNode];
  defaultSplit?: number;
  minSize?: number;
  maxSize?: number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  onResize?: (size: number) => void;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultSplit = 60,
  minSize = 20,
  maxSize = 80,
  direction = 'horizontal',
  className = '',
  onResize
}) => {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let newSplit: number;
    
    if (direction === 'horizontal') {
      const clientX = e.clientX - rect.left;
      newSplit = (clientX / rect.width) * 100;
    } else {
      const clientY = e.clientY - rect.top;
      newSplit = (clientY / rect.height) * 100;
    }

    // 최소/최대 크기 제한
    newSplit = Math.max(minSize, Math.min(maxSize, newSplit));
    
    setSplit(newSplit);
    onResize?.(newSplit);
  }, [isDragging, direction, minSize, maxSize, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const containerClass = `${styles.container} ${styles[direction]} ${className}`;
  const resizerClass = `${styles.resizer} ${styles[direction]} ${isDragging ? styles.dragging : ''}`;

  return (
    <div ref={containerRef} className={containerClass}>
      <div 
        className={styles.panel}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${split}%`
        }}
      >
        {children[0]}
      </div>
      
      <div 
        className={resizerClass}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.resizerHandle} />
      </div>
      
      <div 
        className={styles.panel}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - split}%`
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};

export default ResizablePanel;