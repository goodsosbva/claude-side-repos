import { rateLimit } from './rate-limit';

// 검증 대상은 로그인 무차별 대입 방어 (risk-analysis.md #6).
// 순수 로직이라 DB 도 HTTP 도 없이 단독으로 돈다.
describe('rateLimit', () => {
  it('한도까지는 통과시키고 초과분은 막는다', () => {
    const key = `test-${Math.random()}`;

    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).ok).toBe(true);
    }

    const blocked = rateLimit(key, 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('키가 다르면 카운터를 공유하지 않는다', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;

    for (let i = 0; i < 5; i++) rateLimit(a, 5, 60_000);

    expect(rateLimit(a, 5, 60_000).ok).toBe(false);
    expect(rateLimit(b, 5, 60_000).ok).toBe(true);
  });

  it('윈도우가 지나면 카운터가 초기화된다', async () => {
    const key = `win-${Math.random()}`;

    expect(rateLimit(key, 1, 20).ok).toBe(true);
    expect(rateLimit(key, 1, 20).ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(rateLimit(key, 1, 20).ok).toBe(true);
  });
});
