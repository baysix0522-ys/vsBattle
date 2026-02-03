# vsBattle

사주 배틀 (React + Node) 모노레포 기본 개발환경.

## Structure

- `apps/frontend` : Vite + React + TypeScript
- `apps/backend` : Node + Express + TypeScript

## Requirements

- Node.js >= 18
- npm (Node에 포함)

## Quick Start

```bash
npm install
npm run dev
```

## Endpoints

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health

## Environment

- Backend: `apps/backend/.env.example` 참고해서 `apps/backend/.env` 생성

## References (Context7)

- Vite create-vite / scripts: `pnpm create vite ... --template react-ts`, `vite`, `vite build`, `vite preview`
- React docs: 신규 앱은 CRA 대신 Vite 같은 빌드툴/프레임워크 권장
- Express: 최소 서버 예시(라우트 + listen)
