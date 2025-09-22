"use client";
import { devLog } from '@/app/_common/utils/logger';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiMic, FiSquare, FiLoader } from 'react-icons/fi';
import { transcribeAudio } from '@/app/_common/api/sttAPI';

interface SoundInputHandlerProps {
    onTranscriptionReady?: (transcription: string) => void;
    className?: string;
    disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "processing";

const SoundInputHandler: React.FC<SoundInputHandlerProps> = ({
    onTranscriptionReady,
    className = '',
    disabled = false
}) => {
    const [state, setState] = useState<RecordingState>("idle");
    const [audioLevel, setAudioLevel] = useState<number>(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationRef = useRef<number | null>(null);
    const [mimeType, setMimeType] = useState<string>('');

    // 오디오 레벨 로깅을 위한 ref들
    const recordingStartTimeRef = useRef<number | null>(null);
    const audioLevelsRef = useRef<number[]>([]);
    const loggingIntervalRef = useRef<number | null>(null);

    // 자동 정지를 위한 ref들
    const lowLevelStartTimeRef = useRef<number | null>(null);
    const autoStopTimeoutRef = useRef<number | null>(null);

    const playStartSound = useCallback(() => {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }, []);

    const playEndSound = useCallback(() => {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.35);
    }, []);

    // 녹음 정지
    const stopRecording = useCallback(() => {
        devLog.log('⏹️ Stopping recording...');
        devLog.log(`📊 Current state: ${state}, MediaRecorder exists: ${!!mediaRecorderRef.current}`);

        if (mediaRecorderRef.current && state === "recording") {
            mediaRecorderRef.current.stop();
            playEndSound();
            devLog.log('🔴 Recording stopped, end sound played');
        } else {
            devLog.log('⚠️ Recording not stopped - conditions not met');
            if (!mediaRecorderRef.current) devLog.log('❌ MediaRecorder is null');
            if (state !== "recording") devLog.log(`❌ State is not recording: ${state}`);

            // 자동 정지의 경우에도 소리를 재생하도록 수정
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                playEndSound();
                devLog.log('🔴 MediaRecorder stopped, end sound played (auto-stop)');
            }
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            devLog.log('🎤 Microphone stream closed');
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // 로깅 인터벌 정리
        if (loggingIntervalRef.current) {
            clearInterval(loggingIntervalRef.current);
            loggingIntervalRef.current = null;
        }

        // 자동 정지 타이머 정리
        if (autoStopTimeoutRef.current) {
            clearTimeout(autoStopTimeoutRef.current);
            autoStopTimeoutRef.current = null;
        }

        // 녹음 관련 데이터 초기화
        recordingStartTimeRef.current = null;
        audioLevelsRef.current = [];
        lowLevelStartTimeRef.current = null;

        setAudioLevel(0);
    }, [state, playEndSound]);

    const measureAudioLevel = useCallback(() => {
        if (!analyserRef.current) {
            return;
        }

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        setAudioLevel(normalizedLevel);

        // 오디오 레벨 히스토리에 추가
        audioLevelsRef.current.push(normalizedLevel);

        // 다음 프레임을 예약
        animationRef.current = requestAnimationFrame(measureAudioLevel);
    }, []); // state와 silenceTimer 제거

    // 실시간 오디오 레벨 로깅 함수
    const logAudioLevels = useCallback(() => {
        if (!recordingStartTimeRef.current) {
            // devLog.log('❌ recordingStartTimeRef is null');
            return;
        }

        const currentTime = Date.now();
        const elapsedTime = (currentTime - recordingStartTimeRef.current) / 1000;
        // devLog.log(`⏰ Elapsed time: ${elapsedTime.toFixed(2)}s`);

        if (elapsedTime >= 1) {
            const levels = audioLevelsRef.current;
            const currentLevel = levels.length > 0 ? levels[levels.length - 1] : 0;
            // devLog.log(`📊 Current level: ${currentLevel.toFixed(3)}, History length: ${levels.length}`);

            if (levels.length > 0) {
                const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
                const levelRatio = averageLevel > 0 ? (currentLevel / averageLevel) : 0;

                // devLog.log(`🎵 Audio Level - Current: ${currentLevel.toFixed(3)}, Average: ${averageLevel.toFixed(3)}, Ratio: ${levelRatio.toFixed(3)}x (${(levelRatio * 100).toFixed(1)}%)`);

                // 자동 정지 로직
                checkAutoStop(levelRatio);
            } else {
                devLog.log('No audio levels in history');
            }
        } else {
            devLog.log(`⏳ Waiting... ${(1.5 - elapsedTime).toFixed(2)}s remaining`);
        }
    }, []); // audioLevel 의존성 제거

    // 자동 정지 체크 함수
    const checkAutoStop = useCallback((levelRatio: number) => {
        const currentTime = Date.now();

        if (levelRatio <= 0.9) {
            if (lowLevelStartTimeRef.current === null) {
                // 처음으로 70% 이하가 된 시점 기록
                lowLevelStartTimeRef.current = currentTime;
                // devLog.log(`🔻 Audio level dropped below 70% (${(levelRatio * 100).toFixed(1)}%), starting 2s timer...`);

                // 2초 후 자동 정지 타이머 설정
                autoStopTimeoutRef.current = window.setTimeout(() => {
                    // devLog.log('⏰ 2 seconds of low audio level detected, auto-stopping recording...');
                    stopRecording();
                }, 1500);
            } else {
                // 이미 70% 이하 상태가 지속 중
                const lowLevelDuration = (currentTime - lowLevelStartTimeRef.current) / 1000;
                // devLog.log(`🔻 Low level continues for ${lowLevelDuration.toFixed(1)}s (${(levelRatio * 100).toFixed(1)}%)`);
            }
        } else {
            // 레벨이 70% 이상으로 회복된 경우
            if (lowLevelStartTimeRef.current !== null) {
                // devLog.log(`🔺 Audio level recovered above 70% (${(levelRatio * 100).toFixed(1)}%), resetting timer`);

                // 타이머 리셋
                lowLevelStartTimeRef.current = null;
                if (autoStopTimeoutRef.current) {
                    clearTimeout(autoStopTimeoutRef.current);
                    autoStopTimeoutRef.current = null;
                }
            }
        }
    }, [stopRecording]);


    const startRecording = useCallback(async () => {
        try {
            devLog.log('🎙️ Starting recording...');
            setState("recording");

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;
            devLog.log('✅ Microphone access granted');

            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);
            devLog.log('🔊 Audio context and analyser set up');

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
                handleRecordingComplete();
            };

            mediaRecorderRef.current.start();
            devLog.log('🔴 Recording started');

            // 녹음 시작 시간 기록
            recordingStartTimeRef.current = Date.now();
            audioLevelsRef.current = []; // 오디오 레벨 히스토리 초기화
            lowLevelStartTimeRef.current = null; // 자동 정지 관련 초기화

            devLog.log('🕐 Recording start time set, starting logging in 1.5s...');

            // 1.5초 후부터 100ms마다 오디오 레벨 로깅 시작
            setTimeout(() => {
                devLog.log('⏰ 1.5s elapsed, starting audio level logging...');
                loggingIntervalRef.current = window.setInterval(() => {
                    devLog.log('🔄 Logging interval triggered');
                    logAudioLevels();
                }, 100);
            }, 1500);

            playStartSound();
            measureAudioLevel();

        } catch (err) {
            devLog.error('❌ 녹음 시작 실패:', err);
            setState("idle");
        }
    }, [playStartSound, measureAudioLevel, logAudioLevels, checkAutoStop, state]);
    // 녹음 완료 처리

    const handleRecordingComplete = useCallback(async () => {
        setState("processing");

        try {
            const blob = new Blob(chunksRef.current, { type: mimeType });

            // 오디오 형식 결정
            const audioFormat = mimeType.includes('webm') ? 'webm' :
                               mimeType.includes('mp4') ? 'mp4' : 'webm';

            // File 객체 생성
            const audioFile = new File([blob], `recording.${audioFormat}`, {
                type: mimeType
            });

            // STT API 호출
            const response = await transcribeAudio(audioFile, audioFormat);

            if (response && (response as any).transcription) {
                // 변환된 텍스트를 상위 컴포넌트로 전달
                if (onTranscriptionReady) {
                    onTranscriptionReady((response as any).transcription);
                }
            }
        } catch (err) {
            devLog.error('STT 변환 실패:', err);
        } finally {
            setState("idle");
        }
    }, [mimeType, onTranscriptionReady]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (loggingIntervalRef.current) {
                clearInterval(loggingIntervalRef.current);
            }
            if (autoStopTimeoutRef.current) {
                clearTimeout(autoStopTimeoutRef.current);
            }
        };
    }, []);

    const handleClick = () => {
        if (disabled) return;

        if (state === "idle") {
            startRecording();
        } else if (state === "recording") {
            stopRecording();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={state === "processing" || disabled}
            className={className}
            style={{
                position: 'relative',
                background: disabled ? '#f9fafb' : (state === "recording" ? '#ef4444' : '#f3f4f6'),
                color: disabled ? '#d1d5db' : (state === "recording" ? 'white' : '#6b7280'),
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: disabled ? '#e5e7eb' : (state === "recording" ? '#ef4444' : '#e5e7eb'),
                borderRadius: '1rem',
                padding: '0.75rem',
                cursor: (state === "processing" || disabled) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                opacity: (state === "processing" || disabled) ? 0.6 : 1,
                transform: (state === "processing" || disabled) ? 'none' : undefined
            }}
            onMouseEnter={(e) => {
                if (!disabled && state !== "processing" && state !== "recording") {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 163, 175, 0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled && state !== "processing" && state !== "recording") {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
            onMouseDown={(e) => {
                if (!disabled && state !== "processing") {
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
        >
            {state === "idle" ? (
                <FiMic style={{ fontSize: '1.1rem', transition: 'transform 0.2s ease' }} />
            ) : state === "recording" ? (
                <FiSquare style={{ fontSize: '1.1rem', transition: 'transform 0.2s ease' }} />
            ) : (
                <FiLoader
                    style={{
                        fontSize: '1.1rem',
                        transition: 'transform 0.2s ease',
                        animation: 'spin 1s linear infinite'
                    }}
                />
            )}
            {state === "recording" && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0px',
                        left: '0',
                        right: '0',
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        opacity: Math.max(0.3, audioLevel * 2),
                        transition: 'opacity 0.1s ease',
                        borderRadius: '0 0 0.875rem 0.875rem'
                    }}
                />
            )}
            <style jsx>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </button>
    );
};

export default SoundInputHandler;
export type { SoundInputHandlerProps };
