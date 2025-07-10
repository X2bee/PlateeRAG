"use client";
import React, { useState } from "react";
import { FiFolder, FiPlay, FiEdit, FiTrash2, FiClock, FiUser } from "react-icons/fi";
import styles from "@/app/main/assets/CompletedWorkflows.module.scss";

interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
  author: string;
  nodeCount: number;
  status: "active" | "draft" | "archived";
}

// Mock data - 추후 실제 데이터로 교체
const mockWorkflows: Workflow[] = [
  {
    id: "1",
    name: "Basic Chatbot",
    description: "간단한 챗봇 워크플로우입니다. 사용자 입력을 받아 AI 응답을 생성합니다.",
    createdAt: "2024-12-15",
    lastModified: "2024-12-16",
    author: "AI-LAB",
    nodeCount: 5,
    status: "active"
  },
  {
    id: "2",
    name: "Data Processing",
    description: "데이터 전처리 및 분석을 위한 워크플로우입니다.",
    createdAt: "2024-12-10",
    lastModified: "2024-12-14",
    author: "CocoRoF",
    nodeCount: 8,
    status: "active"
  },
  {
    id: "3",
    name: "Image Classification",
    description: "이미지 분류 모델을 활용한 워크플로우입니다.",
    createdAt: "2024-12-05",
    lastModified: "2024-12-12",
    author: "haesookimDev",
    nodeCount: 12,
    status: "draft"
  }
];

const CompletedWorkflows: React.FC = () => {
  const [workflows] = useState<Workflow[]>(mockWorkflows);
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "archived">("all");

  const filteredWorkflows = workflows.filter(workflow => 
    filter === "all" || workflow.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return styles.statusActive;
      case "draft": return styles.statusDraft;
      case "archived": return styles.statusArchived;
      default: return styles.statusActive;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "활성";
      case "draft": return "초안";
      case "archived": return "보관됨";
      default: return "활성";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with Filters */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2>완성된 워크플로우</h2>
          <p>저장된 워크플로우를 확인하고 관리하세요.</p>
        </div>
        
        <div className={styles.filters}>
          {["all", "active", "draft", "archived"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`${styles.filterButton} ${filter === filterType ? styles.active : ""}`}
            >
              {filterType === "all" ? "전체" : 
               filterType === "active" ? "활성" :
               filterType === "draft" ? "초안" : "보관됨"}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Grid */}
      <div className={styles.workflowsGrid}>
        {filteredWorkflows.map((workflow) => (
          <div key={workflow.id} className={styles.workflowCard}>
            <div className={styles.cardHeader}>
              <div className={styles.workflowIcon}>
                <FiFolder />
              </div>
              <div className={`${styles.status} ${getStatusColor(workflow.status)}`}>
                {getStatusText(workflow.status)}
              </div>
            </div>

            <div className={styles.cardContent}>
              <h3 className={styles.workflowName}>{workflow.name}</h3>
              <p className={styles.workflowDescription}>{workflow.description}</p>
              
              <div className={styles.workflowMeta}>
                <div className={styles.metaItem}>
                  <FiUser />
                  <span>{workflow.author}</span>
                </div>
                <div className={styles.metaItem}>
                  <FiClock />
                  <span>{workflow.lastModified}</span>
                </div>
                <div className={styles.metaItem}>
                  <span>{workflow.nodeCount}개 노드</span>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button className={styles.actionButton} title="실행">
                <FiPlay />
              </button>
              <button className={styles.actionButton} title="편집">
                <FiEdit />
              </button>
              <button className={`${styles.actionButton} ${styles.danger}`} title="삭제">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className={styles.emptyState}>
          <FiFolder className={styles.emptyIcon} />
          <h3>워크플로우가 없습니다</h3>
          <p>아직 저장된 워크플로우가 없습니다. 새로운 워크플로우를 만들어보세요.</p>
        </div>
      )}
    </div>
  );
};

export default CompletedWorkflows;
