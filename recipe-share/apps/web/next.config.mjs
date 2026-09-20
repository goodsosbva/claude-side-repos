/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dockerfile의 runner 스테이지가 .next/standalone만 복사하도록 함
  output: 'standalone',
  // 워크스페이스 패키지를 TS 소스 그대로 소비 (빌드 단계 불필요)
  transpilePackages: ['@recipe-share/db'],
};

export default nextConfig;
