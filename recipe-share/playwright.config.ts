import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3000);

// E2E_BASE_URL 이 주어지면 "이미 떠 있는 대상"으로 본다 (예: docker compose up).
// 그 경우 개발서버도 띄우지 않고, 로컬 DB 도 건드리지 않는다.
const EXTERNAL = Boolean(process.env.E2E_BASE_URL);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: EXTERNAL ? undefined : './e2e/global-setup.ts',

  // 회원가입·로그인이 IP 당 분당 5회로 막혀 있다 (rate-limit.ts).
  // 병렬로 돌리면 429 가 섞여 엉뚱하게 실패하므로 한 줄로 세운다.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 로그인 계정을 한 번만 만들어 두고 storageState 로 돌려쓴다.
    // 테스트마다 가입하면 rate limit 에 걸린다.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: EXTERNAL
    ? undefined
    : {
        command: 'pnpm --filter @recipe-share/web exec next dev --webpack',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        env: {
          DATABASE_URL: 'file:./e2e.db',
          JWT_SECRET: 'e2e-only-insecure-secret',
          JWT_EXPIRES_IN: '2h',
        },
      },
});
