// components/evaluation/Evaluation.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { EvaluationAPI } from '@/app/api/evalAPI';

import { ModelInfo , PopupState } from '@/app/model/components/types'

import TaskSelector from '@/app/model/components/Eval/TaskSelector';
import PopupSelector from '@/app/model/components/Eval/SelectionPopup';
import JobDetailModal from '@/app/model/components/Eval/JobDetailModal';
import EvaluationTable from '@/app/model/components/Eval/EvaluationTable';

import styles from '@/app/model/assets/Eval.module.scss';

export const DEFAULT_TASKS = [
    'global_mmlu_ko', 
    'hellaswag', 
    'arc_easy', 
] as const;

export const TASK_OPTIONS = [
    { value: 'CausalLM', label: '언어 모델(LLM, 자체 데이터셋)' },
    { value: 'CausalLM_task', label: '언어 모델(LLM, 벤치마크)' },
    { value: 'RAG', label: 'RAG 평가' },
    { value: 'Classification', label: '분류' },
    { value: 'Semantic_Textual_Similarity', label: '의미적 유사도' },
    { value: 'Retrieval', label: '검색' },
    { value: 'Reranking', label: '재랭킹' }
] as const;

type TaskType = typeof TASK_OPTIONS[number]['value'];

export const TOP_TASKS = [
    'global_mmlu_ko',
    'global_mmlu_full_ko',
    'gsm8k_cot',
    'humaneval',
    'hellaswag',
    'arc_easy',
    'arc_challenge',
    'truthfulqa',
    'piqa',
    'commonsense_qa',
    'drop'
] as const;

const Evaluation = () => {
  // 상태 변수들
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedModelInfo, setSelectedModelInfo] = useState<ModelInfo | null>(null);
  const [evaluateWithBaseModel, setEvaluateWithBaseModel] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskType>('CausalLM');
  const [ragApiPath, setRagApiPath] = useState('');
  const [taskGroups, setTaskGroups] = useState({});
  const [selectedBenchmarkTasks, setSelectedBenchmarkTasks] = useState([...DEFAULT_TASKS]);
  const [jobName, setJobName] = useState('');
  const [column1, setColumn1] = useState('input');
  const [column2, setColumn2] = useState('');
  const [column3, setColumn3] = useState('');
  const [label, setLabel] = useState('output');
  const [topK, setTopK] = useState(1);
  const [gpuNum, setGpuNum] = useState(1);
  const [useCot, setUseCot] = useState(false);
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [evalJobs, setEvalJobs] = useState<{ [key: string]: any }>({});
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortField, setSortField] = useState('start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 로딩 상태 디바운싱을 위한 ref
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);

  // 팝업 상태 관리
  const [popupState, setPopupState] = useState<PopupState>({
    dataset: { show: false, options: [], selected: "", loading: false },
    model: { show: false, options: [], selected: "", loading: false },
    columns: { show: false, options: [], selected: "", mode: "main", loading: false },
    tasks: { show: false, options: [], selected: "", loading: false },
  });

  // Task Selector 상태
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  
  // Computed values
  const isCausalLMTask = selectedTask === 'CausalLM_task';
  const showBaseModelOption = isCausalLMTask && 
    selectedModelInfo?.base_model && 
    selectedModelInfo.base_model !== "Unknown" && 
    selectedModelInfo.base_model !== selectedModel;

  // 디바운싱된 로딩 상태 설정
  const setDebouncedLoading = useCallback((loading: boolean, delay = 100) => {

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    if (loading) {
      setIsLoading(true);
      isLoadingRef.current = true;
    } else {
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoadingRef.current) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      }, delay);
    }
  }, []);

  // 평가 작업 필터링
  useEffect(() => {
    const filtered = Object.values(evalJobs).filter((job: any) => {
      // 상태 필터
      if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false;
      }
      
      // 검색 필터
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        return (
          job.job_id.toLowerCase().includes(query) ||
          job.job_info.model_name.toLowerCase().includes(query) ||
          (job.job_info.dataset_name && job.job_info.dataset_name.toLowerCase().includes(query)) ||
          job.job_info.job_name.toLowerCase().includes(query)
        );
      }
      
      return true;
    }).sort((a: any, b: any) => {
      // 정렬
      if (sortField === 'start_time') {
        const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
        const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      
      if (sortField === 'score') {
        const scoreA = a.result ? Number(Object.values(a.result)[0]) || 0 : 0;
        const scoreB = b.result ? Number(Object.values(b.result)[0]) || 0 : 0;
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      
      return 0;
    });

    setFilteredJobs(filtered);
  }, [evalJobs, statusFilter, searchFilter, sortField, sortDirection]);

  // Task Groups 로드
  const loadTaskGroups = useCallback(async () => {
    try {
      const groups = await EvaluationAPI.loadTaskGroups();
      setTaskGroups(groups);
    } catch (error) {
      console.error('Error loading task groups:', error);
      toast.error('태스크 목록을 불러오는데 실패했습니다.');
    }
  }, []);

  // 팝업 열기
  const openPopup = useCallback(async (type: string)  => {
    if (type === 'tasks') {
      setShowTaskSelector(true);
      return;
    }

    setSearchQuery("");
    setPopupState(prev => ({
      ...prev,
      [type]: { ...prev[type], loading: true, show: true }
    }));
    
    try {
      console.log(`Loading ${type}s from MinIO...`);
      
      const data = await EvaluationAPI.loadMinioItems(type === 'model' ? 'model' : 'dataset');
      setPopupState(prev => ({
        ...prev,
        [type]: { ...prev[type], options: data }
      }));
      
    } catch (err) {
      console.error(`Error loading ${type}s:`, err);
      toast.error(`${type === 'model' ? '모델' : '데이터셋'} 목록을 불러오는데 실패했습니다.`);
      setPopupState(prev => ({
        ...prev,
        [type]: { ...prev[type], options: [] }
      }));
    } finally {
      setPopupState(prev => ({
        ...prev,
        [type]: { ...prev[type], loading: false }
      }));
    }
  }, []);

  // 팝업에서 선택 완료
  const selectItem = useCallback((type: string) => {
    const selectedValue = popupState[type].selected;
    console.log(`Selecting ${type}: ${selectedValue}`);
    
    if (selectedValue) {
      if (type === 'dataset') {
        setSelectedDataset(selectedValue);
        setPopupState(prev => ({
          ...prev,
          [type]: { ...prev[type], show: false }
        }));
        fetchDatasetInfo(selectedValue);
      } else if (type === 'model') {
        setSelectedModel(selectedValue);
        const modelInfo = popupState[type].options.find(
          (model) => model.name === selectedValue
        ) || null;
        setSelectedModelInfo(modelInfo);
        
        // 모델이 변경되면 Base Model 평가 옵션 리셋
        setEvaluateWithBaseModel(false);
        
        setPopupState(prev => ({
          ...prev,
          [type]: { ...prev[type], show: false }
        }));
        console.log('Selected model info:', modelInfo);
      }
    }
  }, [popupState]);

  // 팝업 닫기
  const closePopup = useCallback((type : any) => {
    setPopupState(prev => ({
      ...prev,
      [type]: { ...prev[type], show: false }
    }));
  }, []);

  // 데이터셋 정보 가져오기
  const fetchDatasetInfo = useCallback(async (datasetName : string) => {
    try {
      console.log(`Fetching dataset info for: ${datasetName}`);
      
      const columns = await EvaluationAPI.fetchDatasetInfo(datasetName);
      setDatasetColumns(columns);
      
      if (columns.length > 0) {
        setColumn1(columns.includes('input') ? 'input' : columns[0] || '');
        setColumn2(columns.includes('output') ? 'output' : '');
        setLabel(columns.includes('label') ? 'label' : (columns.includes('output') ? 'output' : ''));
      } else {
        setColumn1('');
        setColumn2('');
        setLabel('');
      }
    } catch (error) {
      console.error("Error fetching dataset info:", error);
      setDatasetColumns([]);
      toast.error('데이터셋 정보를 가져오는데 실패했습니다.');
    }
  }, []);

  // 컬럼 선택 팝업 열기
  const openColumnSelection = useCallback((mode : string) => {
    if (datasetColumns.length === 0) {
      toast.error("데이터셋 컬럼 정보가 없습니다. 먼저 데이터셋을 선택하세요.");
      return;
    }
    
    let options: string[] = [];
    let selected = '';
    
    if (mode === 'main') {
      options = datasetColumns;
      selected = column1;
    } else if (mode === 'sub') {
      options = datasetColumns.filter(col => col !== column1);
      selected = column2;
    } else if (mode === 'minor') {
      options = datasetColumns.filter(col => col !== column1 && col !== column2);
      selected = column3;
    }
    
    setPopupState(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        mode,
        options,
        selected,
        show: true
      }
    }));
  }, [datasetColumns, column1, column2, column3]);

  // 컬럼 선택 확인
  const confirmColumnSelection = useCallback(() => {
    const selectedCol = popupState.columns.selected;
    
    if (selectedCol) {
      if (popupState.columns.mode === 'main') {
        if (column1 !== selectedCol) {
          if (column2 === selectedCol) setColumn2('');
          if (column3 === selectedCol) setColumn3('');
        }
        setColumn1(selectedCol);
      } else if (popupState.columns.mode === 'sub') {
        if (column2 !== selectedCol) {
          if (column3 === selectedCol) setColumn3('');
        }
        setColumn2(selectedCol);
      } else if (popupState.columns.mode === 'minor') {
        setColumn3(selectedCol);
      }
    }
    
    setPopupState(prev => ({
      ...prev,
      columns: { ...prev.columns, show: false }
    }));
  }, [popupState.columns, column1, column2, column3]);

  // 평가 결과 불러오기 - 수정된 버전
  const loadEvalResults = useCallback(async () => {
    setDebouncedLoading(true);
    try {
      const updatedJobs: { [key: string]: any } = await EvaluationAPI.loadEvalResults();
      
      // 상태 비교 로직을 setEvalJobs 내부에서 처리
      setEvalJobs(prevJobs => {
        const mergedJobs: { [key: string]: any } = {};
        
        Object.keys(updatedJobs).forEach(jobId => {
          const newJobData = updatedJobs[jobId];
          
          // 기존 작업이 있으면 상태 변경 확인
          if (prevJobs[jobId]) {
            // 상태가 변경된 경우에만 업데이트
            if (prevJobs[jobId].status !== newJobData.status || 
                JSON.stringify(prevJobs[jobId].result) !== JSON.stringify(newJobData.result)) {
              mergedJobs[jobId] = newJobData;
            } else {
              // 상태 변경 없으면 기존 데이터 유지
              mergedJobs[jobId] = prevJobs[jobId];
            }
          } else {
            // 새 작업은 그대로 추가
            mergedJobs[jobId] = newJobData;
          }
        });
        
        // 실제로 변경된 경우에만 새 객체 반환
        const prevJobsStr = JSON.stringify(prevJobs);
        const mergedJobsStr = JSON.stringify(mergedJobs);
        
        if (prevJobsStr !== mergedJobsStr) {
          console.log('Updated evaluation jobs:', mergedJobs);
          return mergedJobs;
        }
        
        return prevJobs; // 변경사항 없으면 기존 객체 반환
      });
      
    } catch (error) {
      console.error('평가 결과 로딩 에러:', error);
      toast.error('평가 결과를 불러오는데 실패했습니다');
    } finally {
      setDebouncedLoading(false);
    }
  }, []); // dependency 배열에서 evalJobs 제거

  // 새 평가 실행
  const runEvaluation = useCallback(async () => {
    if (!selectedModel || !jobName) {
      toast.error('모델과 작업 이름을 입력해주세요');
      return;
    }

    if (isCausalLMTask && selectedBenchmarkTasks.length === 0) {
      toast.error('최소 하나의 벤치마크 태스크를 선택해주세요');
      return;
    }

    if (!isCausalLMTask && !selectedDataset) {
      toast.error('데이터셋을 선택해주세요');
      return;
    }
    
    setIsRunningEval(true);
    try {
        let requestBody

        if (isCausalLMTask) {
            requestBody = {
              job_name: jobName,
              task: 'CausalLM_task',
              model_name: selectedModel,
              dataset_name: selectedBenchmarkTasks.join(','),
              gpu_num: gpuNum,
              model_minio_enabled: true,
              dataset_minio_enabled: false,
              ...(evaluateWithBaseModel && selectedModelInfo?.base_model
                ? { base_model: selectedModelInfo.base_model }
                : {})
            };
          } else {
            requestBody = {
              job_name: jobName,
              task: selectedTask,
              model_name: selectedModel,
              dataset_name: selectedDataset,
              column1,
              column2: column2 || undefined,
              column3: column3 || undefined,
              label: label || undefined,
              top_k: selectedTask !== 'CausalLM' ? topK : undefined,
              gpu_num: gpuNum,
              model_minio_enabled: true,
              dataset_minio_enabled: true,
              use_cot: selectedTask === 'CausalLM' ? useCot : undefined
            };
          }

      console.log('Sending evaluation request:', requestBody);
      
      const data = await EvaluationAPI.runEvaluation(requestBody) as { job_id: string };
      
      if (data.job_id) {
        toast.success(`평가가 시작되었습니다. Job ID: ${data.job_id}`);
        await loadEvalResults();
      } else {
        throw new Error('Job ID를 받지 못했습니다');
      }
      
    } catch (error : any) {
      console.error('평가 실행 에러:', error);
      toast.error(error.message || '평가 실행에 실패했습니다');
    } finally {
      setIsRunningEval(false);
    }
  }, [selectedModel, jobName, isCausalLMTask, selectedBenchmarkTasks, selectedDataset, selectedTask, column1, column2, column3, label, topK, gpuNum, useCot, evaluateWithBaseModel, selectedModelInfo, loadEvalResults]);

  // 평가 작업 상세 조회
  const getEvaluationDetails = useCallback(async (jobId : any) => {
    setIsLoadingJobDetails(true);
    try {
      const data = await EvaluationAPI.getEvaluationDetails(jobId);
      setSelectedJob(data);
      setShowJobDetails(true);
    } catch (error) {
      console.error('평가 작업 상세 조회 에러:', error);
      toast.error('평가 작업 상세 정보를 불러오는데 실패했습니다');
    } finally {
      setIsLoadingJobDetails(false);
    }
  }, []);

  // 작업 상세 모달 닫기
  const closeJobDetails = useCallback(() => {
    setShowJobDetails(false);
    setSelectedJob(null);
  }, []);

  // Task Selector 이벤트 핸들러
  const handleTaskChange = useCallback((tasks : any) => {
    setSelectedBenchmarkTasks(tasks);
  }, []);

  const handleTaskConfirm = useCallback(() => {
    setShowTaskSelector(false);
  }, []);

  const handleTaskClose = useCallback(() => {
    setShowTaskSelector(false);
  }, []);

  // 팝업 이벤트 핸들러
  const handlePopupSelect = useCallback((type : any , name : any , item : any) => {
    console.log('Item selected:', { type, name, item });
    
    setPopupState(prev => ({
      ...prev,
      [type]: { ...prev[type], selected: name }
    }));
    
    if (type === 'model') {
      setSelectedModelInfo(item);
    }
  }, []);

  const handlePopupConfirm = useCallback((type : string, name : string , item : any) => {
    if (type === 'model') {
      setSelectedModel(name);
      setSelectedModelInfo(item);
      closePopup('model');
    } else if (type === 'dataset') {
      setSelectedDataset(name);
      closePopup('dataset');
      fetchDatasetInfo(name);
    } else if (type === 'columns') {
      confirmColumnSelection();
    }
  }, [closePopup, fetchDatasetInfo, confirmColumnSelection]);

  // Job Detail 이벤트 핸들러
  const handleJobClick = useCallback((job : any) => {
    getEvaluationDetails(job.job_id);
  }, [getEvaluationDetails]);

  // 수정된 테이블 새로고침 핸들러
  const handleTableRefresh = useCallback(() => {
    setDebouncedLoading(true, 0); // 즉시 로딩 표시
    loadEvalResults();
  }, [loadEvalResults, setDebouncedLoading]);

  const handleTableSort = useCallback((field : any, direction : any) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // 필터 변경 핸들러들
  const handleStatusFilterChange = useCallback((value : any) => {
    setStatusFilter(value);
  }, []);

  const handleSearchFilterChange = useCallback((value : any) => {
    setSearchFilter(value);
  }, []);

  // 초기 데이터 로드 - 한 번만 실행
  useEffect(() => {
    loadTaskGroups();
    loadEvalResults();
  }, [loadTaskGroups, loadEvalResults]);

  // 주기적 갱신 - loadEvalResults 변경과 무관하게 동작
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadEvalResults();
    }, 100000); // 100초마다

    return () => {
      clearInterval(refreshInterval);
    };
  }, [loadEvalResults]);

  // cleanup
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.layout}>
          {/* 평가 설정 영역 (좌측) */}
          <div className={styles.settingsPanel}>
            <h2 className={styles.sectionTitle}>평가 설정</h2>
            
            {/* 기본 설정 섹션 */}
            <div className={styles.section}>
              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>작업 이름</label>
                  <input 
                    type="text" 
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    className={styles.input}
                    placeholder="평가 작업 이름"
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>평가 타입</label>
                  <select
                    value={selectedTask}
                    onChange={e => setSelectedTask(e.target.value as TaskType)}
                    className={styles.select}
                    >
                    {TASK_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                        {opt.label}
                        </option>
                    ))}
                    </select>
                </div>
              </div>
            </div>

            {/* 모델 선택 섹션 */}
            <div className={styles.section}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>모델</label>
                {selectedTask !== 'RAG' ? (
                  <div className={styles.inputWithButton}>
                    <input 
                      type="text" 
                      className={`${styles.input} ${styles.inputDisabled}`}
                      value={selectedModel} 
                      placeholder="모델을 선택하세요"
                      disabled
                    />
                    <button 
                      onClick={() => openPopup('model')}
                      className={styles.inputButton}
                    >
                      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    className={styles.input}
                    value={ragApiPath}
                    onChange={(e) => setRagApiPath(e.target.value)}
                    placeholder="RAG API 경로를 입력하세요"
                  />
                )}   
              </div>
            </div>

            {isCausalLMTask ? (
              <div className={styles.section}>
                <label className={styles.label}>벤치마크 태스크</label>
                <div className={styles.inputWithButton}>
                  <input 
                    type="text" 
                    className={`${styles.input} ${styles.inputDisabled}`}
                    value={selectedBenchmarkTasks.length > 0 ? 
                      `${selectedBenchmarkTasks.length}개 선택됨: ${selectedBenchmarkTasks.slice(0, 2).join(', ')}${selectedBenchmarkTasks.length > 2 ? '...' : ''}` : 
                      ''
                    } 
                    placeholder="벤치마크 태스크를 선택하세요"
                    disabled
                  />
                  <button 
                    onClick={() => setShowTaskSelector(true)}
                    className={styles.inputButton}
                  >
                    <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </button>
                </div>
                
                {/* 선택된 태스크들 표시 */}
                {selectedBenchmarkTasks.length > 0 && (
                  <div className={styles.taskDisplay}>
                    <div className={styles.taskDisplayHeader}>
                      <span className={styles.taskCount}>
                        선택된 태스크 ({selectedBenchmarkTasks.length}개)
                      </span>
                      <button 
                        type="button" 
                        className={styles.clearAllButton}
                        onClick={() => setSelectedBenchmarkTasks([])}
                      >
                        모두 제거
                      </button>
                    </div>
                    <div className={styles.taskTags}>
                      {selectedBenchmarkTasks.map((task, index) => (
                        <span key={task} className={styles.taskTag}>
                          <span className={styles.taskNumber}>{index + 1}.</span>
                          {task}
                          <button 
                            type="button" 
                            className={styles.taskRemoveButton}
                            onClick={() => {
                              setSelectedBenchmarkTasks(prev => prev.filter(t => t !== task));
                            }}
                          >
                            <svg className={styles.removeIcon} fill="currentColor" viewBox="0 0 8 8">
                              <path d="m0 0 1 1 1.5-1.5 1.5 1.5 1-1-1.5-1.5 1.5-1.5-1-1-1.5 1.5-1.5-1.5z"/>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.section}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>데이터셋</label>
                  <div className={styles.inputWithButton}>
                    <input 
                      type="text" 
                      className={`${styles.input} ${styles.inputDisabled}`}
                      value={selectedDataset} 
                      placeholder="데이터셋을 선택하세요"
                      disabled
                    />
                    <button 
                      onClick={() => openPopup('dataset')}
                      className={styles.inputButton}
                    >
                      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 데이터셋 열 설정 섹션 - CausalLM_task일 때 숨김 */}
            {!isCausalLMTask && (
              <div className={styles.section}>
                <h3 className={styles.subsectionTitle}>데이터셋 열 설정</h3>
                <div className={styles.gridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      주요 데이터 열 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputWithButton}>
                      <select 
                        value={column1}
                        onChange={(e) => setColumn1(e.target.value)}
                        className={styles.select}
                      >
                        <option value="">선택하세요</option>
                        {datasetColumns.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => openColumnSelection('main')}
                        className={styles.inputButton}
                        disabled={datasetColumns.length === 0}
                      >
                        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>보조 데이터 열</label>
                    <div className={styles.inputWithButton}>
                      <select 
                        value={column2}
                        onChange={(e) => setColumn2(e.target.value)}
                        className={styles.select}
                        disabled={!column1 || datasetColumns.length === 0}
                      >
                        <option value="">선택하세요</option>
                        {datasetColumns.filter(col => col !== column1).map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => openColumnSelection('sub')}
                        className={styles.inputButton}
                        disabled={!column1 || datasetColumns.length === 0}
                      >
                        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>보조 데이터 열 2</label>
                    <div className={styles.inputWithButton}>
                      <select 
                        value={column3}
                        onChange={(e) => setColumn3(e.target.value)}
                        className={styles.select}
                        disabled={!column1 || !column2 || datasetColumns.length === 0}
                      >
                        <option value="">선택하세요</option>
                        {datasetColumns.filter(col => col !== column1 && col !== column2).map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => openColumnSelection('minor')}
                        className={styles.inputButton}
                        disabled={!column1 || !column2 || datasetColumns.length === 0}
                      >
                        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                     </button>
                   </div>
                 </div>
                 
                 <div className={styles.inputGroup}>
                   <label className={styles.label}>라벨 (종속 변수)</label>
                   <select 
                     value={label}
                     onChange={(e) => setLabel(e.target.value)}
                     className={styles.select}
                   >
                     <option value="">선택하세요</option>
                     {datasetColumns.map(column => (
                       <option key={column} value={column}>{column}</option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>
           )}
           
           {/* 추가 설정 섹션 */}
           {selectedTask !== 'RAG' && (
             <div className={styles.section}>
               <h3 className={styles.subsectionTitle}>추가 설정</h3>
               <div className={styles.gridTwoCol}>
                 {selectedTask !== 'CausalLM' && !isCausalLMTask && (
                   <div className={styles.inputGroup}>
                     <label className={styles.label}>Top K</label>
                     <input 
                       type="number" 
                       value={topK}
                       onChange={(e) => setTopK(parseInt(e.target.value) || 1)}
                       min="1"
                       className={styles.input}
                     />
                   </div>
                 )}

                 <div className={styles.inputGroup}>
                   <label className={styles.label}>GPU 수</label>
                   <input 
                     type="number" 
                     value={gpuNum}
                     onChange={(e) => setGpuNum(parseInt(e.target.value) || 1)}
                     min="1"
                     className={styles.input}
                   />
                 </div>
               </div>

               {/* 체크박스 옵션들 */}
               <div className={styles.checkboxSection}>
                 {selectedTask === 'CausalLM' && (
                   <label className={styles.checkbox}>
                     <input 
                       type="checkbox" 
                       checked={useCot}
                       onChange={(e) => setUseCot(e.target.checked)}
                       className={styles.checkboxInput}
                     />
                     <span className={styles.checkboxLabel}>Chain-of-Thought 사용</span>
                   </label>
                 )}

                 {/* Base Model과 함께 평가 옵션 (CausalLM_task에서만 표시) */}
                 {showBaseModelOption && (
                   <div className={styles.baseModelOption}>
                     <label className={styles.checkbox}>
                       <input 
                         type="checkbox" 
                         checked={evaluateWithBaseModel}
                         onChange={(e) => setEvaluateWithBaseModel(e.target.checked)}
                         className={styles.checkboxInput}
                       />
                       <div className={styles.baseModelContent}>
                         <span className={styles.baseModelTitle}>Base Model과 함께 평가</span>
                         <div className={styles.baseModelInfo}>
                           현재 모델: <span className={styles.modelName}>{selectedModel}</span><br/>
                           Base Model: <span className={styles.modelName}>{selectedModelInfo?.base_model}</span>
                         </div>
                         <div className={styles.baseModelDescription}>
                           활성화 시 Base Model과 Fine-tuned Model을 모두 평가합니다.
                         </div>
                       </div>
                     </label>
                   </div>
                 )}
               </div>
             </div>
           )}

           <div className={styles.actionSection}>
             <button 
               onClick={runEvaluation} 
               className={`${styles.runButton} ${
                 (!selectedModel || !jobName || isRunningEval || 
                  (isCausalLMTask ? selectedBenchmarkTasks.length === 0 : !selectedDataset)) 
                   ? styles.runButtonDisabled : ''
               }`}
               disabled={!selectedModel || !jobName || isRunningEval || 
                        (isCausalLMTask ? selectedBenchmarkTasks.length === 0 : !selectedDataset)}
             >
               {isRunningEval ? (
                 <>
                   <span className={styles.spinner}></span>
                   평가 실행 중...
                 </>
               ) : (
                 '평가 실행'
               )}
             </button>
           </div>
         </div>

         {/* 평가 결과 목록 (우측) */}
         <EvaluationTable 
           jobs={filteredJobs}
           isLoading={isLoading}
           statusFilter={statusFilter}
           searchFilter={searchFilter}
           sortField={sortField}
           sortDirection={sortDirection}
           onJobClick={handleJobClick}
           onRefresh={handleTableRefresh}
           onSort={handleTableSort}
           onStatusFilterChange={handleStatusFilterChange}
           onSearchFilterChange={handleSearchFilterChange}
         />
       </div>
     </div>

     {/* Task Selector */}
     <TaskSelector 
       show={showTaskSelector}
       taskGroups={taskGroups}
       selectedTasks={selectedBenchmarkTasks}
       onTaskChange={handleTaskChange}
       onConfirm={handleTaskConfirm}
       onClose={handleTaskClose}
     />

     {/* 모델 선택 팝업 */}
     <PopupSelector 
       show={popupState.model.show}
       type="model"
       title="모델 선택"
       options={popupState.model.options}
       selected={popupState.model.selected}
       loading={popupState.model.loading}
       searchQuery={searchQuery}
       onSelect={({ name, item }) => handlePopupSelect('model', name, item)}
       onConfirm={({ name, item }) => handlePopupConfirm('model', name, item)}
       onClose={() => closePopup('model')}
     />

     {/* 데이터셋 선택 팝업 */}
     <PopupSelector 
       show={popupState.dataset.show}
       type="dataset"
       title="데이터셋 선택"
       options={popupState.dataset.options}
       selected={popupState.dataset.selected}
       loading={popupState.dataset.loading}
       searchQuery={searchQuery}
       onSelect={({ name, item }) => handlePopupSelect('dataset', name, item)}
       onConfirm={({ name, item }) => handlePopupConfirm('dataset', name, item)}
       onClose={() => closePopup('dataset')}
     />

     {/* 컬럼 선택 팝업 */}
     <PopupSelector 
       show={popupState.columns.show}
       type="columns"
       title={popupState.columns.mode === 'main' ? '주요 데이터 열 선택' : 
              popupState.columns.mode === 'sub' ? '보조 데이터 열 선택' : 
              '보조 데이터 열 2 선택'}
       options={popupState.columns.options}
       selected={popupState.columns.selected}
       loading={popupState.columns.loading}
       searchQuery=""
       onSelect={({ name, item }) => handlePopupSelect('columns', name, item)}
       onConfirm={({ name, item }) => handlePopupConfirm('columns', name, item)}
       onClose={() => closePopup('columns')}
     />

     {/* 작업 상세 정보 모달 */}
     <JobDetailModal 
       show={showJobDetails}
       job={selectedJob}
       loading={isLoadingJobDetails}
       onClose={closeJobDetails}
       onDeleted={() => {}} 
     />
   </div>
 );
};

export default Evaluation;