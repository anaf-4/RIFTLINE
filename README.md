# RIFTLINE (리프트라인)

2D 로그라이크 덱빌딩 카드게임. 전열/후열 라인 시스템이 핵심 차별화 축이다.
TypeScript + React + Vite 단일 소스에서 **웹 / Windows(.exe) / Android(.apk)** 세 플랫폼을 빌드한다.

## 실행

```bash
npm install
npm run dev          # 웹 개발 서버 (Vite)
```

## 빌드

```bash
npm run build         # 웹 정적 빌드 → dist/
npm run electron:build   # Windows exe (electron-builder) → release/
npm run cap:sync      # Android 프로젝트에 웹 빌드 동기화
npm run cap:open      # Android Studio에서 android/ 프로젝트 열기
```

Android APK는 Android Studio에서 `Build → Generate Signed Bundle / APK`로 생성한다.

## 콘텐츠 현황

- 클래스 4종 (파수병 / 술사 / 밀사 / 각인자), 각 70장 — 총 카드 289장
- 3막 + 히든 4막, 승천 난이도 0~15
- 맵(상점/휴식/이벤트/엘리트/보스), 유물 18종, 포션 6종, 도전과제 11종
- 한국어 / English (카드 설명은 효과 데이터에서 자동 생성됨 — `src/i18n/effectText.ts`)
- AES-256-GCM 세이브 암호화, 일일 도전(시드 공유)

## 기술 스택

- **core**: 순수 TypeScript, React/DOM 의존 없음 (`src/core`) — Node에서 시뮬레이션 가능 (`npm run sim`)
- **ui**: React 18 + Zustand
- **데스크톱**: Electron (`electron/`)
- **모바일**: Capacitor (`android/`)

## 알려진 제한

- 카드 밸런스는 1차 수치 배치 단계이며 대규모 시뮬레이션 검증 전이다.
- 스프라이트/카드 일러스트는 제공된 레퍼런스 시트에서 재사용한 것으로, 카드별 전용 일러스트는 아니다.
