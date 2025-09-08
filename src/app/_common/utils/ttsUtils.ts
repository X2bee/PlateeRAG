/**
 * TTS 관련 유틸리티 함수들
 */

import { generateSpeech, playAudioBlob } from '@/app/api/ttsAPI';
import { devLog } from '@/app/_common/utils/logger';

interface TTSRequest {
    text: string;
    speaker?: string | null;
    output_format?: string;
    happiness?: number;
    sadness?: number;
    disgust?: number;
    fear?: number;
    surprise?: number;
    anger?: number;
    other?: number;
    neutral?: number;
}

/**
 * 텍스트에서 순수한 텍스트만 추출하는 함수
 * (마크다운, HTML 태그, 특수 블록 등 제거)
 */
export const extractPlainText = (content: string): string => {
    if (!content || typeof content !== 'string') {
        return '';
    }

    let plainText = content;

    // Think 블록 제거
    plainText = plainText.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // Tool Use Log 블록 제거
    plainText = plainText.replace(/<TOOLUSELOG>[\s\S]*?<\/TOOLUSELOG>/gi, '');

    // Tool Output Log 블록 제거
    plainText = plainText.replace(/<TOOLOUTPUTLOG>[\s\S]*?<\/TOOLOUTPUTLOG>/gi, '');

    // 코드 블록 제거 (```로 감싸진 블록)
    plainText = plainText.replace(/```[\s\S]*?```/g, '');

    // 인라인 코드 제거 (`로 감싸진 부분)
    plainText = plainText.replace(/`[^`]+`/g, '');

    // Citation 제거 ([Cite.{...}] 형태)
    plainText = plainText.replace(/\[Cite\.\{[^}]*\}\]/g, '');

    // 마크다운 링크 제거 ([텍스트](URL) -> 텍스트만 남김)
    plainText = plainText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 마크다운 굵게 제거 (**텍스트** -> 텍스트)
    plainText = plainText.replace(/\*\*([^*]+)\*\*/g, '$1');

    // 마크다운 기울임 제거 (*텍스트* -> 텍스트)
    plainText = plainText.replace(/\*([^*]+)\*/g, '$1');

    // HTML 태그 제거
    plainText = plainText.replace(/<[^>]*>/g, '');

    // 여러 개의 공백을 하나로 통합
    plainText = plainText.replace(/\s+/g, ' ');

    // 앞뒤 공백 제거
    plainText = plainText.trim();

    return plainText;
};

/**
 * 텍스트를 TTS에 안전하게 처리하기 위해 정리하는 함수
 */
export const sanitizeTextForTTS = (text: string): string => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    let sanitized = text;

    // 이모지 제거 (유니코드 범위 기반)
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // 감정 이모지
    sanitized = sanitized.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // 기타 기호 및 픽토그램
    sanitized = sanitized.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // 교통 및 지도 기호
    sanitized = sanitized.replace(/[\u{1F700}-\u{1F77F}]/gu, ''); // 알케미컬 기호
    sanitized = sanitized.replace(/[\u{1F780}-\u{1F7FF}]/gu, ''); // 기하학적 모양 확장
    sanitized = sanitized.replace(/[\u{1F800}-\u{1F8FF}]/gu, ''); // 추가 화살표
    sanitized = sanitized.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // 보조 기호 및 픽토그램
    sanitized = sanitized.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // 체스 기호
    sanitized = sanitized.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // 기타 기호 및 픽토그램 확장-A
    sanitized = sanitized.replace(/[\u{2600}-\u{26FF}]/gu, '');   // 기타 기호
    sanitized = sanitized.replace(/[\u{2700}-\u{27BF}]/gu, '');   // 댄글 기호
    sanitized = sanitized.replace(/[\u{FE00}-\u{FE0F}]/gu, '');   // 변형 선택기
    sanitized = sanitized.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // 깃발 (국기)

    // 연속된 줄바꿈을 하나로 통합
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    // 연속된 공백을 하나로 통합
    sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');

    // 특수문자들을 공백으로 대체 (읽기 어려운 문자들)
    sanitized = sanitized.replace(/[•·◦▪▫◆◇■□●○]/g, ' ');

    // 연속된 마침표나 느낌표를 제한
    sanitized = sanitized.replace(/\.{4,}/g, '...');
    sanitized = sanitized.replace(/!{3,}/g, '!!');
    sanitized = sanitized.replace(/\?{3,}/g, '??');

    // URL이나 이메일 주소 제거
    sanitized = sanitized.replace(/(https?:\/\/[^\s]+)/g, '');
    sanitized = sanitized.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, '');

    // 긴 숫자나 코드 같은 것들 제거 (10자 이상의 연속된 숫자/문자)
    sanitized = sanitized.replace(/[0-9a-zA-Z]{10,}/g, '');

    // 여러 개의 공백을 하나로 통합
    sanitized = sanitized.replace(/\s+/g, ' ');

    // 앞뒤 공백 제거
    sanitized = sanitized.trim();

    return sanitized;
};

/**
 * 텍스트가 TTS에 적합한지 확인하는 함수
 */
export const isSuitableForTTS = (content: string): boolean => {
    if (!content || typeof content !== 'string') {
        return false;
    }

    const plainText = extractPlainText(content);
    const sanitizedText = sanitizeTextForTTS(plainText);

    // 너무 짧은 텍스트는 제외
    if (sanitizedText.length < 10) {
        return false;
    }

    // 너무 긴 텍스트는 제외 (3000자로 제한 - 더 보수적으로)
    if (sanitizedText.length > 3000) {
        return false;
    }

    // 줄 수 확인 (너무 많은 줄은 TTS 모델에 문제가 될 수 있음)
    const lines = sanitizedText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 50) {
        return false;
    }

    // 대부분이 특수 문자나 숫자인 경우 제외
    const textOnlyContent = sanitizedText.replace(/[^가-힣a-zA-Z\s]/g, '');
    if (textOnlyContent.length < sanitizedText.length * 0.5) {
        return false;
    }

    // 한국어나 영어가 포함되어 있는지 확인
    const hasKorean = /[가-힣]/.test(sanitizedText);
    const hasEnglish = /[a-zA-Z]/.test(sanitizedText);
    if (!hasKorean && !hasEnglish) {
        return false;
    }

    return true;
};

/**
 * TTS로 텍스트를 읽어주는 함수 (개선된 에러 처리)
 */
export const speakText = async (content: string, options?: {
    speaker?: string;
    output_format?: string;
    happiness?: number;
    sadness?: number;
    disgust?: number;
    fear?: number;
    surprise?: number;
    anger?: number;
    other?: number;
    neutral?: number;
}): Promise<void> => {
    try {
        if (!isSuitableForTTS(content)) {
            devLog.warn('Content is not suitable for TTS:', content.substring(0, 100));
            return;
        }

        const plainText = extractPlainText(content);
        const sanitizedText = sanitizeTextForTTS(plainText);

        if (sanitizedText.length < 10) {
            devLog.warn('Text too short after sanitization:', sanitizedText);
            return;
        }

        devLog.log('Speaking text (sanitized):', sanitizedText.substring(0, 100), 'Length:', sanitizedText.length);

        // 텍스트를 50자 단위의 청크로 나누기 (문장 단위 분할)
        const chunks = splitTextIntoChunks(sanitizedText, 50);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            devLog.log(`Speaking chunk ${i + 1}/${chunks.length}:`, chunk.substring(0, 50));

            try {
                const ttsRequest: TTSRequest = {
                    text: chunk,
                    speaker: options?.speaker || null,
                    output_format: options?.output_format || "wav",
                    happiness: options?.happiness ?? 0.3077,
                    sadness: options?.sadness ?? 0.0256,
                    disgust: options?.disgust ?? 0.0256,
                    fear: options?.fear ?? 0.0256,
                    surprise: options?.surprise ?? 0.0256,
                    anger: options?.anger ?? 0.0256,
                    other: options?.other ?? 0.2564,
                    neutral: options?.neutral ?? 0.3077
                };

                const audioBlob = await generateSpeech(ttsRequest);
                await playAudioBlobWithTracking(audioBlob);

                // 청크 간 짧은 대기 (50자 청크이므로 대기 시간 단축)
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (chunkError) {
                devLog.error(`Failed to speak chunk ${i + 1}:`, chunkError);
                // 개별 청크 실패 시 다음 청크로 계속 진행
                continue;
            }
        }

        devLog.info('TTS playback completed successfully');
    } catch (error) {
        devLog.error('Failed to speak text:', error);
        // 사용자에게 친화적인 에러 메시지 표시
        if (error instanceof Error) {
            if (error.message.includes('conditioning')) {
                devLog.warn('TTS model conditioning error - text may be too complex');
            } else if (error.message.includes('tensor')) {
                devLog.warn('TTS model tensor error - text format incompatible');
            }
        }
        throw new Error('음성 변환에 실패했습니다. 다른 텍스트로 시도해보세요.');
    }
};

/**
 * 텍스트를 50자 단위의 청크로 나누는 함수 (문장 단위 분할, 긴 문장은 그대로 유지)
 */
const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
    if (text.length <= maxLength) {
        return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    // 문장 단위로 나누기 (마침표, 느낌표, 물음표 기준)
    const sentences = text.split(/([.!?])\s+/).filter(part => part.trim().length > 0);

    let i = 0;
    while (i < sentences.length) {
        let sentence = sentences[i];

        // 구두점이 분리된 경우 다음 요소와 합치기
        if (i + 1 < sentences.length && /^[.!?]$/.test(sentences[i + 1])) {
            sentence += sentences[i + 1];
            i += 2;
        } else {
            i += 1;
        }

        sentence = sentence.trim();
        if (!sentence) continue;

        // 개별 문장이 maxLength를 넘는 경우, 그 문장만으로 청크 생성
        if (sentence.length > maxLength) {
            // 현재 청크가 있으면 먼저 저장
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // 긴 문장을 단독 청크로 추가
            chunks.push(sentence);
        } else {
            // 현재 청크에 문장을 추가했을 때 길이 확인
            const testChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;

            if (testChunk.length <= maxLength) {
                currentChunk = testChunk;
            } else {
                // 현재 청크 저장하고 새 청크 시작
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = sentence;
            }
        }
    }

    // 마지막 청크 저장
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
};/**
 * 현재 재생 중인 오디오를 중지하는 함수
 */
let currentAudio: HTMLAudioElement | null = null;

export const stopCurrentSpeech = (): void => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        devLog.log('Current speech stopped');
    }
};

/**
 * TTS 재생을 위한 오디오 요소 관리
 */
export const playAudioBlobWithTracking = (audioBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            // 이전 오디오 중지
            stopCurrentSpeech();

            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            currentAudio = audio;

            audio.onended = () => {
                URL.revokeObjectURL(url);
                currentAudio = null;
                devLog.info('Audio playback completed');
                resolve();
            };

            audio.onerror = (error) => {
                URL.revokeObjectURL(url);
                currentAudio = null;
                devLog.error('Audio playback failed:', error);
                reject(error);
            };

            audio.play().catch(reject);
        } catch (error) {
            devLog.error('Failed to create audio player:', error);
            reject(error);
        }
    });
};
