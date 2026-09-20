/**
 * 루트는 러너를 직접 돌리지 않고 두 프로젝트를 묶기만 한다.
 * 커버리지는 프로젝트별로 따로 내면 합산이 안 되므로 여기서 한 번에 집계한다.
 *
 * @type {import('jest').Config}
 */
const config = {
  projects: ['<rootDir>/apps/web', '<rootDir>/packages/db'],

  collectCoverageFrom: [
    'apps/web/src/**/*.{ts,tsx}',
    'packages/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx}',
    // Next 가 만들어 준 껍데기. 테스트 대상이 아니다.
    '!apps/web/src/app/layout.tsx',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // 목표치가 아니라 래칫(ratchet)이다. 지금 실측값에 맞춰 놓았으니,
  // 떨어지면 깨지고 테스트를 늘리면 그만큼 올려서 다시 못박는 용도로 쓸 것.
  //
  // 기준 실측 (테스트 2개 기준):
  //   statements 7.43 / branches 5.29 / functions 6.45 / lines 7.89
  // 숫자가 낮은 이유는 라우트 핸들러 5개와 storage/auth 가 통째로 미커버이기 때문이다.
  coverageThreshold: {
    global: { statements: 7, branches: 5, functions: 6, lines: 7 },
  },
};

export default config;
