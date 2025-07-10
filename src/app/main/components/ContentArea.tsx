"use client";
import React from "react";
import { ContentAreaProps } from "./types";
import styles from "@/app/main/assets/MainPage.module.scss";

const ContentArea: React.FC<ContentAreaProps> = ({ title, description, children, className = "" }) => {
  return (
    <div className={`${styles.contentArea} ${className}`}>
      <header className={styles.contentHeader}>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div>
        {children}
      </div>
    </div>
  );
};

export default ContentArea;
