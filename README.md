# Auto Exports

VS Code 익스텐션으로, 바렐(Barrel) 패턴의 export 구문을 자동으로 생성해주는 도구입니다.

## 기능

- 폴더 내의 컴포넌트들을 자동으로 export
- 다양한 export 스타일 지원 (default, named, star, custom)
- 파일 변경 감지 및 자동 업데이트

## 사용법

1. VS Code 익스플로러에서 폴더를 우클릭
2. "Generate Barrel Exports" 선택
3. index.ts 파일이 자동으로 생성됨

## 설정

다음 설정들을 커스터마이즈할 수 있습니다:

- `autoExports.exportStyle`: export 스타일 ("default", "named", "star", "custom")
- `autoExports.exportPattern`: 커스텀 export 패턴
- `autoExports.indexFileNames`: 검색할 인덱스 파일명
- `autoExports.outputFileName`: 생성될 barrel 파일명

## 요구사항

- VS Code 1.97.0 이상

## 릴리즈 노트

### 0.0.1

초기 릴리즈

- 기본적인 barrel export 생성 기능
- 파일 시스템 감시 기능
- 다양한 export 스타일 지원
