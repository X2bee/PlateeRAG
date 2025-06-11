"use client";
import React, { useState } from 'react';
import styles from '@/app/assets/NodeList.module.scss';
import { LuChevronDown } from 'react-icons/lu';

const NodeList = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.accordion}>
            <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <LuChevronDown
                    className={styles.icon}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
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