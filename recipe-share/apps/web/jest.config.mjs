import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextJest from 'next/jest.js';

// nextJest 의 dir 는 process.cwd() 기준으로 풀린다. 루트에서 `pnpm test` 로 돌리면
// cwd 가 저장소 루트가 되어 Next 가 app 디렉터리를 찾지 못하고
// "Couldn't find any `pages` or `app` directory" 로 죽는다. 그래서 절대경로로 못박는다.
const here = path.dirname(fileURLToPath(import.meta.url));
const createJestConfig = nextJest({ dir: here });

/** @type {import('jest').Config} */
const config = {
  displayName: 'web',
  // 컴포넌트 테스트에 DOM 이 필요하다. 순수 로직만 도는 파일도 같이 jsdom 에서 돈다.
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // e2e 는 Playwright 소관이다. Jest 가 집어가면 안 된다.
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
};

// createJestConfig 는 SWC 트랜스폼, CSS/이미지 모킹, tsconfig paths 를 알아서 붙여 준다.
export default createJestConfig(config);
