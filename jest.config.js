/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 0
    }
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
  testPathIgnorePatterns: ["dist"]
};

export default config;
