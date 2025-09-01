# E2E Testing Guide

이 프로젝트는 Playwright를 사용한 포괄적인 End-to-End 테스트 suite를 제공합니다.

## 📋 테스트 개요

### 테스트 범위

- **기능 테스트**: 홈페이지, 네비게이션, 모든 핵심 기능
- **모바일 테스트**: 반응형 디자인과 터치 인터랙션
- **접근성 테스트**: WCAG 가이드라인 준수 검증
- **성능 테스트**: Core Web Vitals 및 로드 시간 측정
- **보안 테스트**: XSS, CSRF, 인증/인가 보안 검증

### 지원 브라우저

- **Desktop**: Chromium, Firefox, WebKit
- **Mobile**: iPhone 14, Pixel 7, iPad Pro
- **High DPI**: Retina 디스플레이 지원

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. Playwright 브라우저 설치

```bash
npx playwright install
```

### 3. 애플리케이션 실행

```bash
npm run build
npm start
```

### 4. 테스트 실행

```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 테스트 실행 (시각적 디버깅)
npm run test:e2e:ui

# 브라우저를 열고 테스트 실행 (헤드풀 모드)
npm run test:e2e:headed

# 특정 테스트만 실행
npx playwright test homepage.spec.ts

# 디버그 모드로 테스트 실행
npm run test:e2e:debug
```

## 📊 테스트 리포트 보기

### HTML 리포트 생성

```bash
npx playwright test --reporter=html
npm run test:e2e:report
```

### 성능 테스트 (Lighthouse)

```bash
npm run test:lighthouse
```

## 🔧 테스트 구성

### 테스트 파일 구조

```
e2e/
├── fixtures/
│   └── test-fixtures.ts          # 공통 테스트 유틸리티
├── specs/
│   ├── homepage.spec.ts          # 홈페이지 기능 테스트
│   ├── navigation.spec.ts        # 네비게이션 및 라우팅
│   ├── mobile.spec.ts            # 모바일 반응형 테스트 (@mobile)
│   ├── accessibility.spec.ts     # 접근성 테스트 (@a11y)
│   ├── performance.spec.ts       # 성능 테스트 (@performance)
│   └── security.spec.ts          # 보안 테스트 (@security)
├── global.setup.ts               # 전역 설정 (인증 등)
└── global.teardown.ts            # 전역 정리
```

### 특정 테스트 태그 실행

```bash
# 모바일 테스트만 실행
npx playwright test --grep="@mobile"

# 접근성 테스트만 실행
npx playwright test --grep="@a11y"

# 성능 테스트만 실행
npx playwright test --grep="@performance"

# 보안 테스트만 실행
npx playwright test --grep="@security"
```

## 🎯 테스트 시나리오

### 1. 홈페이지 테스트 (`homepage.spec.ts`)

- 페이지 로딩 및 기본 구조 검증
- 네비게이션 요소 확인
- 히어로 섹션 및 CTA 버튼 동작
- 모든 피처 카드 표시 확인
- 반응형 디자인 검증
- 이미지 로딩 및 SEO 메타태그 확인

### 2. 네비게이션 테스트 (`navigation.spec.ts`)

- 주요 페이지 간 네비게이션
- 로그인/로그아웃 플로우
- 브라우저 뒤로/앞으로 버튼
- 딥링킹 및 404 처리
- 키보드 네비게이션

### 3. 모바일 테스트 (`mobile.spec.ts`)

- 다양한 모바일 화면 크기 대응
- 터치 인터랙션 및 스와이프 제스처
- 모바일 폼 및 가상 키보드 처리
- 세로/가로 화면 전환
- 모바일 성능 최적화

### 4. 접근성 테스트 (`accessibility.spec.ts`)

- WCAG 2.1 AA 준수 검증
- 색상 대비 및 폰트 크기
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- ARIA 라벨 및 시맨틱 HTML
- 폼 접근성

### 5. 성능 테스트 (`performance.spec.ts`)

- 페이지 로드 시간 측정
- Core Web Vitals (LCP, FID, CLS)
- 이미지 최적화 검증
- 번들 크기 체크
- 메모리 사용량 모니터링
- API 응답 시간

### 6. 보안 테스트 (`security.spec.ts`)

- XSS 공격 방지
- CSRF 토큰 검증
- 보안 헤더 확인
- 민감 데이터 노출 방지
- 인증/인가 보안
- 쿠키 보안 설정

## 🔒 GitHub Actions 통합

### 자동 실행 조건

- `release` 브랜치에 push 시
- `release` 브랜치 대상 Pull Request 시

### 워크플로우 단계

1. **Health Check**: 린트, 타입 체크, 빌드 검증
2. **E2E Tests**: 멀티 브라우저 병렬 테스트
3. **Mobile Tests**: 모바일 디바이스별 테스트
4. **Accessibility Tests**: 접근성 검증
5. **Performance Tests**: 성능 및 Lighthouse 검사
6. **Security Tests**: 보안 취약점 스캔
7. **Result Consolidation**: 테스트 결과 통합 및 리포트

### 아티팩트 보관

- 테스트 리포트: 7일 보관
- 통합 결과: 30일 보관
- 스크린샷 및 비디오: 실패 시 자동 생성

## 🛠 로컬 개발 환경

### VS Code 확장 추천

```json
{
    "recommendations": ["ms-playwright.playwright"]
}
```

### 환경 변수 설정

```bash
# .env.local 파일에 추가
TEST_USERNAME=testuser@example.com
TEST_PASSWORD=testpassword123
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

### 테스트 작성 가이드라인

#### 1. 테스트 구조

```typescript
test.describe('기능명', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should do something specific', async ({ page }) => {
        // Given: 초기 조건
        // When: 실행할 액션
        // Then: 예상 결과 검증
    });
});
```

#### 2. 안정적인 선택자 사용

```typescript
// ✅ Good - 의미있는 선택자
await page.getByRole('button', { name: 'Get Started' });
await page.getByText('GEN AI Platform');
await page.getByLabel('이메일');

// ❌ Avoid - 불안정한 선택자
await page.locator('.btn-primary');
await page.locator('#button-1');
```

#### 3. 대기 및 동기화

```typescript
// ✅ Good - 명시적 대기
await expect(page.getByText('Success')).toBeVisible();
await page.waitForLoadState('networkidle');

// ❌ Avoid - 하드 코딩된 대기
await page.waitForTimeout(1000);
```

## 📈 성능 최적화

### CI/CD 최적화

- 테스트 병렬 실행 (4개 샤드)
- 브라우저별 독립 실행
- 캐시 활용으로 설치 시간 단축

### 테스트 실행 시간 단축

```bash
# 특정 브라우저만 테스트
npx playwright test --project=chromium

# 병렬 실행 워커 수 조정
npx playwright test --workers=4

# 특정 디렉토리만 테스트
npx playwright test e2e/specs/homepage.spec.ts
```

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 테스트 타임아웃

```bash
# 타임아웃 시간 늘리기
npx playwright test --timeout=60000
```

#### 2. 헤드리스 모드에서만 실패

```bash
# 헤드풀 모드로 디버깅
npx playwright test --headed --debug
```

#### 3. 스크린샷 차이

```bash
# 스크린샷 업데이트
npx playwright test --update-snapshots
```

#### 4. 네트워크 요청 문제

```typescript
// 네트워크 요청 모킹
await page.route('**/api/**', (route) => {
    route.fulfill({ status: 200, body: '{"success": true}' });
});
```

## 📚 추가 리소스

- [Playwright 공식 문서](https://playwright.dev/)
- [WCAG 접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [GitHub Actions 워크플로우 문법](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

## 🤝 기여하기

새로운 테스트를 추가하거나 기존 테스트를 개선할 때:

1. **테스트 커버리지 확인**: 누락된 기능이나 엣지 케이스 식별
2. **테스트 안정성**: 플래키하지 않은 안정적인 테스트 작성
3. **성능 고려**: 불필요하게 긴 실행 시간 방지
4. **문서화**: 복잡한 테스트 시나리오에 대한 주석 추가

---

**Note**: 이 테스트 suite는 프로덕션 배포 전 품질 보증을 위해 설계되었습니다. 모든 테스트가 통과해야만 `release` 브랜치로의 merge가 권장됩니다.
