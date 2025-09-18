"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiMic, FiPause, FiPlay, FiSquare, FiUpload, FiDownload, FiLoader } from 'react-icons/fi';
import styles from './SoundInput.module.scss';
import { transcribeAudio } from '@/app/_common/api/sttAPI';

interface SoundInputProps {
    isOpen?: boolean; // Portal을 위한 isOpen prop 추가
    onAudioReady?: (audioBlob: Blob) => void;
    onTranscriptionReady?: (transcription: string) => void; // 변환된 텍스트를 받을 콜백 추가
    onClose?: () => void;
    className?: string;
}

type RecordingState = "idle" | "recording" | "paused" | "finished";

const SoundInput: React.FC<SoundInputProps> = ({
    isOpen = true, // 기본값은 true로 설정
    onAudioReady,
    onTranscriptionReady,
    onClose,
    className = ''
}) => {
    const [state, setState] = useState<RecordingState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState<number>(0);
    const [recordingTime, setRecordingTime] = useState<number>(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('');
    const [isTranscribing, setIsTranscribing] = useState<boolean>(false); // STT 처리 중 상태 추가

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);

    // 시간 포맷팅 함수
    const formatTime = useCallback((milliseconds: number) => {
        const minutes = Math.floor(milliseconds / 60000).toString().padStart(2, "0");
        const seconds = Math.floor((milliseconds % 60000) / 1000).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    }, []);

    // 오디오 레벨 측정 함수
    const measureAudioLevel = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        setAudioLevel(normalizedLevel);

        if (state === "recording") {
            animationRef.current = requestAnimationFrame(measureAudioLevel);
        }
    }, [state]);

    // 녹음 시작
    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // 기존 녹음이 있다면 정리
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
                setAudioBlob(null);
            }

            // 녹음 시간 초기화
            setRecordingTime(0);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;

            // 오디오 컨텍스트 설정
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // MediaRecorder 설정
            const options: MediaRecorderOptions = {};
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options.mimeType = 'audio/webm;codecs=opus';
                setMimeType('audio/webm');
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options.mimeType = 'audio/mp4';
                setMimeType('audio/mp4');
            } else {
                setMimeType('audio/webm');
            }

            mediaRecorderRef.current = new MediaRecorder(stream, options);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // 녹음 완료 후 바로 콜백을 호출하지 않고 사용자가 "사용하기" 버튼을 누를 때까지 대기
            };

            mediaRecorderRef.current.start();
            setState("recording");

            // 타이머 시작
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 100);
            }, 100);

            // 오디오 레벨 측정 시작
            measureAudioLevel();

        } catch (err) {
            console.error('녹음 시작 실패:', err);
            setError('마이크 접근 권한이 필요합니다.');
        }
    }, [mimeType, onAudioReady, measureAudioLevel]);

    // 녹음 일시정지
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === "recording") {
            mediaRecorderRef.current.pause();
            setState("paused");

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
    }, [state]);

    // 녹음 재개
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === "paused") {
            mediaRecorderRef.current.resume();
            setState("recording");

            // 타이머 재시작
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 100);
            }, 100);

            // 오디오 레벨 측정 재시작
            measureAudioLevel();
        }
    }, [state, measureAudioLevel]);

    // 녹음 정지
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setState("finished");
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        setAudioLevel(0);
    }, []);

    // 오디오 사용하기 함수 - STT API 호출 추가
    const handleUseAudio = useCallback(async () => {
        if (!audioBlob) return;

        try {
            setIsTranscribing(true);
            setError(null);

            // 오디오 형식 결정
            const audioFormat = mimeType.includes('webm') ? 'webm' :
                               mimeType.includes('mp4') ? 'mp4' : 'webm';

            // File 객체 생성
            const audioFile = new File([audioBlob], `recording.${audioFormat}`, {
                type: mimeType
            });

            console.log('Audio file created:', {
                name: audioFile.name,
                size: audioFile.size,
                type: audioFile.type,
                lastModified: audioFile.lastModified
            });

            // STT API 호출
            const response = await transcribeAudio(audioFile, audioFormat);

            if (response && (response as any).transcription) {
                // 변환된 텍스트를 상위 컴포넌트로 전달
                if (onTranscriptionReady) {
                    onTranscriptionReady((response as any).transcription);
                }

                // 기존 콜백도 유지 (호환성을 위해)
                if (onAudioReady) {
                    onAudioReady(audioBlob);
                }

                // 모달 닫기
                if (onClose) {
                    onClose();
                }
            } else {
                setError('음성 변환에 실패했습니다.');
            }
        } catch (err) {
            console.error('STT 변환 실패:', err);
            setError('음성 변환 중 오류가 발생했습니다.');
        } finally {
            setIsTranscribing(false);
        }
    }, [audioBlob, mimeType, onAudioReady, onTranscriptionReady, onClose]);

    // 배경 클릭으로 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
            <div className={`${styles.soundInputContainer} ${className}`}>
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        {state === "finished" ? "녹음 완료" : "음성 녹음"}
                    </h3>
                    <span className={styles.format}>{mimeType || "(기본 포맷)"}</span>
                </div>

                {/* 오디오 레벨 미터 */}
                <div className={styles.levelMeter}>
                    <div
                        className={styles.levelBar}
                        style={{ width: `${Math.min(100, Math.round(audioLevel * 150))}%` }}
                    />
                </div>

                {/* 녹음 시간 */}
                <div className={styles.timer}>
                    {formatTime(recordingTime)}
                </div>

                {/* 컨트롤 버튼들 */}
                <div className={styles.controls}>
                    {state === "idle" ? (
                        <button
                            onClick={startRecording}
                            className={styles.recordButton}
                            aria-label="녹음 시작"
                        >
                            <FiMic />
                        </button>
                    ) : state === "finished" ? (
                        <button
                            onClick={startRecording}
                            className={`${styles.recordButton} ${styles.restart}`}
                            aria-label="다시 녹음"
                        >
                            <FiMic />
                        </button>
                    ) : (
                        <div className={styles.recordingControls}>
                            {state === "paused" ? (
                                <button onClick={resumeRecording} className={styles.controlButton}>
                                    <FiPlay />
                                    <span>재개</span>
                                </button>
                            ) : (
                                <button onClick={pauseRecording} className={styles.controlButton}>
                                    <FiPause />
                                    <span>일시정지</span>
                                </button>
                            )}
                            <button onClick={stopRecording} className={`${styles.controlButton} ${styles.stopButton}`}>
                                <FiSquare />
                                <span>정지</span>
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className={styles.error}>
                        오류: {error}
                    </div>
                )}

                {audioUrl && state === "finished" && (
                    <div className={styles.playback}>

                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <audio src={audioUrl} controls className={styles.audioPlayer} />
                        <div className={styles.actions}>
                            <button
                                onClick={handleUseAudio}
                                className={`${styles.actionButton} ${styles.uploadButton}`}
                                disabled={isTranscribing}
                            >
                                {isTranscribing ? (
                                    <>
                                        <FiLoader className={styles.spinner} />
                                        <span>변환 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiUpload />
                                        <span>사용하기</span>
                                    </>
                                )}
                            </button>
                            {audioUrl && (
                                <a
                                    href={audioUrl}
                                    download={`recording.${mimeType.split('/')[1]}`}
                                    className={`${styles.actionButton} ${styles.downloadButton}`}
                                >
                                    <FiDownload />
                                    <span>다운로드</span>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* 닫기 버튼 */}
                {onClose && (
                    <button onClick={onClose} className={styles.closeButton}>
                        ✕
                    </button>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default SoundInput;
export type { SoundInputProps };
