import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Next 16에서 next lint가 제거되어 ESLint CLI + flat config로 전환.
// 루트에 두어 apps/*와 packages/* 를 한 번에 린트한다.
// 패키지마다 config를 두면 파일만 늘고 packages/db가 누락된다.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/out/**',
    '**/build/**',
    '**/next-env.d.ts',
    // 테스트 산출물. 빼두지 않으면 pnpm test:coverage 이후 lint 가 생성물을 검사한다.
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ]),
]);

export default eslintConfig;
