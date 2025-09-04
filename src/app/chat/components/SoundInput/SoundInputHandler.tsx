"use client";
import { devLog } from '@/app/_common/utils/logger';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiMic, FiSquare, FiLoader } from 'react-icons/fi';
import { transcribeAudio } from '@/app/api/sttAPI';

interface SoundInputHandlerProps {
    onTranscriptionReady?: (transcription: string) => void;
    className?: string;
}

type RecordingState = "idle" | "recording" | "processing";

const SoundInputHandler: React.FC<SoundInputHandlerProps> = ({
    onTranscriptionReady,
    className = ''
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
        if (mediaRecorderRef.current && state === "recording") {
            mediaRecorderRef.current.stop();
            // 녹음 종료 소리 재생
            playEndSound();
            devLog.log('🔴 Recording stopped, end sound played');
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

        // 다음 프레임을 예약
        animationRef.current = requestAnimationFrame(measureAudioLevel);
    }, []); // state와 silenceTimer 제거


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

            playStartSound();
            measureAudioLevel();

        } catch (err) {
            devLog.error('❌ 녹음 시작 실패:', err);
            setState("idle");
        }
    }, [playStartSound, measureAudioLevel]);
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
        };
    }, []);

    const handleClick = () => {
        if (state === "idle") {
            startRecording();
        } else if (state === "recording") {
            stopRecording();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={state === "processing"}
            className={className}
            style={{
                position: 'relative',
                background: state === "recording" ? '#ef4444' : '#f3f4f6',
                color: state === "recording" ? 'white' : '#6b7280',
                border: '2px solid',
                borderColor: state === "recording" ? '#ef4444' : '#e5e7eb',
                borderRadius: '1rem',
                padding: '0.75rem',
                cursor: state === "processing" ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                opacity: state === "processing" ? 0.6 : 1,
                transform: state === "processing" ? 'none' : undefined
            }}
            onMouseEnter={(e) => {
                if (state !== "processing" && state !== "recording") {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 163, 175, 0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (state !== "processing" && state !== "recording") {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
            onMouseDown={(e) => {
                if (state !== "processing") {
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
