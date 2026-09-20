import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const E2E_DATABASE_URL = 'file:./e2e.db';
const DB_FILE = path.join(__dirname, '..', 'packages', 'db', 'prisma', 'e2e.db');

export default function globalSetup() {
  rmSync(DB_FILE, { force: true });
  rmSync(`${DB_FILE}-journal`, { force: true });

  execSync(
    'pnpm --filter @recipe-share/db exec prisma db push --skip-generate --accept-data-loss',
    { stdio: 'inherit', env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL } },
  );
}
