"use client";
import React, { useState, ReactNode } from 'react';
import styles from '@/app/canvas/assets/NodeList.module.scss';
import { LuChevronDown } from 'react-icons/lu';

interface NodeListProps {
    title: string;
    children: ReactNode;
}

const NodeList: React.FC<NodeListProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const toggleOpen = (): void => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.accordion}>
            <button className={styles.header} onClick={toggleOpen}>
                <span>{title}</span>
                <LuChevronDown
                    className={styles.icon}
                    style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}
                />
            </button>
            {isOpen && (
                <div className={styles.content}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default NodeList;