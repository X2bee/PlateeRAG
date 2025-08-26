import React from 'react';
import { MessageRenderer } from './src/app/_common/components/ChatParser';

const TestLatex = () => {
    const testCases = [
        // 사용자가 제시한 원본 예제
        '$$ \\text{중도상환수수료} = \\text{상환금액} \\times \\text{수수료율(0.05%~0.65%)} \\times \\frac{ \\text{대출잔여일수}}{ \\text{대출기간}} $$',
        
        // 간단한 인라인 수식
        '이것은 $E = mc^2$ 공식입니다.',
        
        // 블록 수식
        '아래는 이차방정식의 해입니다:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
        
        // 복잡한 LaTeX 명령어들
        '$$ \\sum_{i=1}^{n} \\alpha_i x_i + \\beta = \\gamma $$',
        
        // 분수와 루트가 섞인 수식
        '$$ \\sqrt{\\frac{\\alpha + \\beta}{\\gamma - \\delta}} $$',
        
        // 일반 텍스트와 LaTeX가 섞인 경우
        '투자 수익률은 $R = \\frac{P_1 - P_0}{P_0} \\times 100\\%$로 계산되며, 여기서 P₁은 현재가격, P₀는 초기가격입니다.'
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>LaTeX 렌더링 테스트</h1>
            
            {testCases.map((testCase, index) => (
                <div key={index} style={{ 
                    marginBottom: '2rem', 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem' 
                }}>
                    <h3>테스트 케이스 {index + 1}</h3>
                    <div style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: '0.5rem', 
                        marginBottom: '1rem', 
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap'
                    }}>
                        원본: {testCase}
                    </div>
                    <div style={{ minHeight: '2rem' }}>
                        <MessageRenderer content={testCase} isUserMessage={false} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TestLatex;