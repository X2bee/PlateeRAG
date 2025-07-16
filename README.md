# 🚀 PlateerRAG

<div align="center">
  <img src="./img/main.png" alt="PlateerRAG 메인 화면" width="100%" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
</div>

<br />

> **차세대 AI 워크플로우 플랫폼** - 드래그 앤 드롭으로 AI 파이프라인을 구축하고 실시간으로 상호작용하세요

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![SCSS](https://img.shields.io/badge/SCSS-Styling-pink?style=flat-square&logo=sass)](https://sass-lang.com/)

PlateerRAG는 **비주얼 워크플로우 에디터**로 AI 애플리케이션을 구축할 수 있는 혁신적인 플랫폼입니다. 복잡한 코딩 없이 **드래그 앤 드롭**만으로 LangChain 기반의 AI 파이프라인을 설계하고, **실시간 채팅**으로 AI와 자연스럽게 소통할 수 있습니다.

## ✨ 주요 기능

### 🎨 **비주얼 캔버스 에디터**

<div align="center">
  <img src="./img/canvas.png" alt="PlateerRAG 캔버스 에디터" width="80%" style="border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" />
  <p><em>🖱️ 직관적인 드래그 앤 드롭 인터페이스로 AI 워크플로우를 시각적으로 구성</em></p>
</div>

- **LangChain 노드 지원**: ChatOpenAI, ChatAnthropic, VectorStore 등 풍부한 AI 노드
- **드래그 앤 드롭**: 직관적인 인터페이스로 워크플로우 구성
- **실시간 연결**: 노드 간 데이터 흐름을 시각적으로 표현
- **자동 저장**: LocalStorage 기반으로 작업 내용 보존
- **템플릿 시스템**: 미리 제작된 워크플로우 템플릿 제공

<div align="center">
  <img src="./img/template.png" alt="워크플로우 템플릿" width="60%" style="border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.08);" />
  <p><em>⚡ 다양한 템플릿으로 빠르게 워크플로우 시작하기</em></p>
</div>

### 💬 **AI 채팅 인터페이스**
- **워크플로우 연동**: 구축한 워크플로우와 실시간 대화
- **타이핑 애니메이션**: 세련된 UI로 AI 응답 표시
- **다중 워크플로우**: 여러 워크플로우 중 선택하여 대화
- **대화 히스토리**: 채팅 기록 저장 및 관리
- **React Hot Toast**: 알림 시스템으로 사용자 경험 향상

### 📊 **통합 관리센터**

<div align="center">
  <img src="./img/chatdemo.png" alt="관리센터 채팅 데모" width="70%" style="border-radius: 8px; margin: 15px 0; box-shadow: 0 3px 12px rgba(0,0,0,0.1);" />
  <p><em>💬 관리센터에서 바로 워크플로우 테스트 및 채팅 확인</em></p>
</div>

- **실행 모니터링**: 워크플로우 실행 상태 및 성능 추적
- **디버그 도구**: 개발 환경에서의 상세 로그 시스템
- **설정 관리**: 글로벌 설정 및 API 키 관리
- **워크플로우 플레이그라운드**: 테스트 환경 제공
- **완료된 워크플로우**: 실행 완료된 작업들의 이력 관리

<div align="center">
  <img src="./img/resource_monitoring.png" alt="리소스 모니터링" width="70%" style="border-radius: 8px; margin: 15px 0; box-shadow: 0 3px 12px rgba(0,0,0,0.1);" />
  <p><em>📈 실시간 워크플로우 실행 상태 및 리소스 모니터링</em></p>
</div>

### ⚡ **고성능 아키텍처**
- **FastAPI 백엔드**: Python 기반의 고성능 API 서버
- **Turbopack**: Next.js 15의 빠른 번들러 활용
- **모듈화 설계**: 컴포넌트 기반의 확장 가능한 구조
- **타입 안전성**: TypeScript로 개발 생산성 및 안정성 확보

## 🏗️ 프로젝트 구조

```
plateerag/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 랜딩 페이지
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── globals.css           # 글로벌 스타일
│   │   ├── HomePage.module.scss  # 홈페이지 전용 스타일
│   │   ├── config.js             # 설정 파일 (API_BASE_URL 등)
│   │   ├── canvas/               # 🎨 비주얼 워크플로우 에디터
│   │   │   ├── page.tsx          # 캔버스 메인 페이지
│   │   │   ├── types.ts          # 캔버스 타입 정의
│   │   │   ├── components/       # 캔버스 핵심 컴포넌트
│   │   │   │   ├── Canvas.tsx    # 메인 캔버스 (ReactFlow 기반)
│   │   │   │   ├── Node.tsx      # AI 노드 컴포넌트
│   │   │   │   ├── Edge.tsx      # 연결선 컴포넌트
│   │   │   │   ├── Header.tsx    # 캔버스 헤더 (저장/불러오기)
│   │   │   │   ├── SideMenu.tsx  # 사이드 메뉴 컨테이너
│   │   │   │   └── ExecutionPanel.tsx # 워크플로우 실행 패널
│   │   │   ├── constants/        # 노드 정의 및 상수
│   │   │   │   ├── nodes.js      # LangChain 노드 데이터
│   │   │   │   └── workflow/     # 워크플로우 템플릿
│   │   │   └── assets/          # 캔버스 스타일 (SCSS Modules)
│   │   ├── chat/                # 💬 AI 채팅 인터페이스
│   │   │   ├── page.tsx         # 채팅 메인 페이지
│   │   │   ├── components/      # 채팅 관련 컴포넌트
│   │   │   │   ├── ChatInterface.tsx    # 메인 채팅 UI
│   │   │   │   ├── ChatContent.tsx      # 채팅 내용 표시
│   │   │   │   └── WorkflowSelection.tsx # 워크플로우 선택기
│   │   │   └── assets/          # 채팅 스타일
│   │   ├── main/                # 📊 통합 관리센터
│   │   │   ├── page.tsx         # 관리센터 메인
│   │   │   ├── components/      # 관리 도구 컴포넌트
│   │   │   │   ├── MainPageContent.tsx  # 메인 대시보드
│   │   │   │   ├── Sidebar.tsx          # 사이드바 네비게이션
│   │   │   │   ├── ContentArea.tsx      # 콘텐츠 영역
│   │   │   │   ├── Executor.tsx         # 워크플로우 실행기
│   │   │   │   ├── Monitor.tsx          # 실행 모니터링
│   │   │   │   ├── Settings.tsx         # 설정 관리
│   │   │   │   ├── Playground.tsx       # 테스트 환경
│   │   │   │   ├── ConfigViewer.tsx     # 설정 뷰어
│   │   │   │   ├── CompletedWorkflows.tsx # 완료 워크플로우
│   │   │   │   └── CanvasIntroduction.tsx # 캔버스 소개
│   │   │   └── assets/          # 관리센터 스타일
│   │   ├── api/                 # 🔗 API 클라이언트
│   │   │   ├── workflowAPI.js   # 워크플로우 실행 API
│   │   │   ├── chatAPI.js       # 채팅 API
│   │   │   ├── nodeAPI.js       # 노드 관리 API
│   │   │   └── configAPI.js     # 설정 API
│   │   ├── data/                # 📊 데이터 관리
│   │   │   └── chatData.js      # 채팅 데이터 모델
│   │   ├── utils/               # 🛠️ 공통 유틸리티
│   │   │   ├── logger.ts        # 디버그 로거 시스템
│   │   │   ├── generateSha1Hash.ts # 해시 생성기
│   │   │   └── debug-guide.js   # 디버그 가이드
│   │   └── _common/             # 공통 컴포넌트
│   │       └── components/      
│   │           ├── ToastProvider.jsx    # 알림 시스템
│   │           ├── nodeHook.ts          # 노드 관리 훅
│   │           ├── sidebarConfig.ts     # 사이드바 설정
│   │           └── workflowStorage.js   # 워크플로우 저장소
│   └── public/                  # 정적 파일 (아이콘, 이미지)
├── package.json                 # 프로젝트 설정 및 의존성
├── next.config.ts              # Next.js 설정
├── tsconfig.json               # TypeScript 설정
├── eslint.config.mjs           # ESLint 설정
├── postcss.config.mjs          # PostCSS 설정
├── DEBUG_GUIDE.md              # 디버그 시스템 사용법
└── README.md                   # 프로젝트 문서
```
│   │   │   └── assets/          # 채팅 스타일
│   │   ├── main/                # 관리센터
│   │   │   ├── page.tsx
│   │   │   ├── components/       # 관리 도구 컴포넌트
│   │   │   └── assets/          # 관리센터 스타일
│   │   ├── api/                 # API 관련 유틸리티
│   │   ├── data/                # 데이터 관리
│   │   └── utils/               # 공통 유틸리티
│   └── public/                  # 정적 파일
├── package.json                 # 프로젝트 설정
├── next.config.ts              # Next.js 설정
├── tsconfig.json               # TypeScript 설정
└── README.md                   # 프로젝트 문서
```

## 🤖 지원하는 AI 노드

PlateerRAG는 **LangChain** 생태계의 다양한 AI 노드를 지원합니다:

### 💬 **Chat Models**
- **ChatOpenAI**: GPT-4o, GPT-4, GPT-3.5 Turbo 지원
- **ChatAnthropic**: Claude 모델 시리즈
- **Temperature 조절**: 창의성과 일관성 제어
- **Stop Sequence**: 출력 제어 옵션

### 🔗 **Chains & Agents**
- **LLMChain**: 기본 언어모델 체인
- **ConversationChain**: 대화형 체인
- **Agent**: 자율적 AI 에이전트
- **Tools**: 외부 도구 연동

### 📚 **Memory & Storage**
- **VectorStore**: 벡터 기반 문서 저장소
- **Memory**: 대화 기억 관리
- **Document Loaders**: 다양한 문서 형식 로드

### 🔄 **Utility Nodes**
- **Input/Output**: 데이터 입출력 노드
- **Transform**: 데이터 변환 노드
- **Conditional**: 조건부 분기 노드

## 🚀 빠른 시작

### 1. 환경 요구사항

- **Node.js** 18.17 이상
- **npm**, **yarn**, **pnpm** 또는 **bun**

### 2. 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-org/plateerag.git
cd plateerag

# 의존성 설치
npm install
# 또는
yarn install

# 개발 서버 실행
npm run dev
# 또는
yarn dev
```

### 3. 브라우저에서 확인

[http://localhost:3000](http://localhost:3000)에서 PlateerRAG를 만나보세요! 🎉

## 📖 사용 가이드

### 🎯 워크플로우 생성하기

1. **캔버스 에디터** 접속 (`/canvas`)
2. 좌측 노드 패널에서 **AI 노드 선택**
3. **드래그 앤 드롭**으로 캔버스에 배치
4. 노드 간 **연결선 생성**으로 워크플로우 구성
5. **저장** 후 **실행 테스트**

### 💬 AI와 채팅하기

1. **채팅 인터페이스** 접속 (`/chat`)
2. **워크플로우 선택** 버튼 클릭
3. 원하는 워크플로우 선택
4. **자연어로 대화** 시작
5. 실시간으로 AI 응답 확인

### 📊 워크플로우 관리하기

<div align="center">
  <img src="./img/workflow_control.png" alt="워크플로우 제어 및 관리" width="75%" style="border-radius: 8px; margin: 15px 0; box-shadow: 0 3px 12px rgba(0,0,0,0.1);" />
  <p><em>🎛️ 직관적인 인터페이스로 워크플로우를 손쉽게 관리하고 제어</em></p>
</div>

1. **관리센터** 접속 (`/main`)
2. **성능 대시보드**에서 실행 현황 확인
3. **실행 로그**에서 디버깅 정보 분석
4. **설정**에서 워크플로우 최적화

<div align="center">
  <img src="./img/setting.png" alt="설정 관리" width="70%" style="border-radius: 8px; margin: 15px 0; box-shadow: 0 3px 12px rgba(0,0,0,0.1);" />
  <p><em>⚙️ 필요한 모든 설정을 한 곳에서 간편하게 관리</em></p>
</div>

## 🛠️ 개발 가이드

### 스크립트 명령어

```bash
# 개발 서버 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 코드 린팅
npm run lint

# 코드 자동 수정
npm run lint:fix

# 코드 포매팅
npm run format
```

### 기술 스택

#### 🎨 **프론트엔드**
- **Next.js 15.3.2**: App Router 기반의 풀스택 React 프레임워크
- **React 19**: 최신 React 기능 활용 (Concurrent Features, Server Components)
- **TypeScript**: 타입 안전성과 개발 생산성 향상
- **SCSS Modules**: 컴포넌트 기반 스타일 캡슐화
- **React Icons**: Feather Icons 세트 활용
- **React Hot Toast**: 세련된 알림 시스템

#### 🔧 **개발 도구**
- **Turbopack**: Next.js 15의 고속 번들러 (dev 모드)
- **ESLint**: 코드 품질 및 일관성 관리
- **Prettier**: 자동 코드 포매팅
- **Husky**: Git 훅을 통한 품질 관리

#### 🌐 **백엔드 연동**
- **FastAPI**: Python 기반 고성능 API 서버
- **LangChain**: AI 체인 구성을 위한 프레임워크
- **RESTful API**: 표준 HTTP API 통신

#### 📊 **데이터 관리**
- **LocalStorage**: 클라이언트 사이드 데이터 저장
- **React State**: 애플리케이션 상태 관리
- **JSON**: 데이터 직렬화 및 API 통신

### 코딩 스타일

- **TypeScript** 엄격 모드 사용
- **ESLint + Prettier** 자동 포매팅
- **SCSS Modules**로 스타일 캡슐화
- **컴포넌트 기반** 아키텍처

### 🔍 디버그 시스템

PlateerRAG는 **스마트 디버그 로거**를 제공합니다:

```javascript
import { devLog, prodLog } from '@/app/utils/logger';

// 개발 환경에서만 출력
devLog.log('디버그 정보');
devLog.error('개발용 에러');

// 항상 출력 (중요한 에러용)
prodLog.error('심각한 에러');
```

#### 브라우저 콘솔 제어
```javascript
// 디버그 로그 강제 활성화
enableDebugLogs()

// 디버그 로그 비활성화
disableDebugLogs()

// 환경 설정으로 리셋
resetDebugLogs()

// 현재 환경 정보 확인
checkEnvironment()
```

상세한 사용법은 [`DEBUG_GUIDE.md`](DEBUG_GUIDE.md)를 참조하세요.

## 📸 스크린샷 갤러리

<div align="center">
  
### 🎨 캔버스 에디터
<img src="./img/canvas.png" alt="캔버스 에디터" width="45%" style="display: inline-block; margin: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
<img src="./img/template.png" alt="템플릿 선택" width="45%" style="display: inline-block; margin: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />

### 📊 관리센터 
<img src="./img/chatdemo.png" alt="채팅 데모" width="45%" style="display: inline-block; margin: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
<img src="./img/resource_monitoring.png" alt="리소스 모니터링" width="45%" style="display: inline-block; margin: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />

### ⚙️ 워크플로우 관리
<img src="./img/workflow_control.png" alt="워크플로우 제어" width="45%" style="display: inline-block; margin: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
<img src="./img/setting.png" alt="설정 관리" width="45%" style="display: inline-block; margin: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />

</div>

## 🌟 주요 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| **홈** | `/` | 프로젝트 소개 및 메인 랜딩 |
| **캔버스** | `/canvas` | 비주얼 워크플로우 에디터 |
| **채팅** | `/chat` | AI 워크플로우 채팅 인터페이스 |
| **관리센터** | `/main` | 워크플로우 관리 및 모니터링 |

## 🤝 기여하기

PlateerRAG 프로젝트에 기여해주셔서 감사합니다! 

### 기여 방법

1. **Fork** 이 저장소
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **브랜치에 Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### 개발 환경 설정

```bash
# 개발 의존성 설치
npm install

# pre-commit 훅 설정
npm run prepare

# 코드 품질 확인
npm run lint
npm run format
```

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다.

## 👥 개발팀

- **Plateer AI-LAB** - 프로젝트 기획 및 AI 엔진
- **CocoRoF** - 프론트엔드 개발 및 UI/UX
- **haesookimDev** - 백엔드 개발 및 아키텍처

## 🔗 관련 링크

- **GitHub 저장소**: [PlateerRAG Repository](https://github.com/plateer/plateerag)
- **개발 문서**: [`DEBUG_GUIDE.md`](DEBUG_GUIDE.md) - 디버그 시스템 사용법
- **이슈 리포트**: GitHub Issues를 통한 버그 신고 및 기능 요청
- **기술 블로그**: [Plateer 기술 블로그](https://tech.plateer.com)

---

<div align="center">

**Made with ❤️ by Plateer AI-LAB**

[⭐ Star this repo](https://github.com/plateer/plateerag) • [🐛 Report Bug](https://github.com/plateer/plateerag/issues) • [💡 Request Feature](https://github.com/plateer/plateerag/issues)

</div>
