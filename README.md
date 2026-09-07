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

## 자동 업데이트 / CI

`main`에 푸시할 때마다 `.github/workflows/release.yml`이 자동으로:
1. package.json 패치 버전을 올리고 `v{version}` 태그로 GitHub Release를 생성한다.
2. Windows exe(nsis 설치본 + portable)를 빌드해 그 Release에 첨부한다.
3. Android debug APK를 빌드해 같은 Release에 첨부한다.

**Electron(nsis 설치본)**: `electron-updater`가 앱 실행 시 자동으로 새 Release를 감지해 백그라운드로 내려받고, 앱을 재시작하면 설치된다 (완전 자동). 단, **portable exe는 이 방식이 적용되지 않는다** — electron-updater 자체가 설치형 배포만 지원하기 때문이다.

**Android**: 사이드로드 APK는 Play 스토어를 거치지 않으므로 OS 차원의 자동 설치가 불가능하다 (항상 사용자의 설치 허용이 필요). 앱 실행 시 GitHub의 최신 Release를 확인해 새 버전이 있으면 타이틀 화면에 배너로 안내하고, 다운로드 링크를 눌러 사용자가 직접 설치하는 반자동 방식이다.

이 워크플로는 실제 GitHub Actions 실행 환경에서 검증되지 않았다 — 처음 푸시한 뒤 Actions 탭에서 결과를 확인하고, 특히 Android SDK 라이선스/그래들 권한 관련 오류가 나면 로그를 보고 조정이 필요할 수 있다.

## 알려진 제한

- 카드 밸런스는 1차 수치 배치 단계이며 대규모 시뮬레이션 검증 전이다.
- 스프라이트/카드 일러스트는 제공된 레퍼런스 시트에서 재사용한 것으로, 카드별 전용 일러스트는 아니다.
