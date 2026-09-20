/**
 * db 패키지는 Next 와 무관하므로 next/jest 를 쓰지 않는다.
 * TS 변환만 필요해서 @swc/jest 한 장으로 끝낸다 (Next 가 내부적으로 쓰는 것과 같은 엔진).
 *
 * @type {import('jest').Config}
 */
const config = {
  displayName: 'db',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
        module: { type: 'commonjs' },
      },
    ],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
