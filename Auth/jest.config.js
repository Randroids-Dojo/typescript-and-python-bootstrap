module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/index.ts'
  ],
  moduleNameMapper: {
    '^bcrypt$': '<rootDir>/tests/mocks/bcrypt.js',
    '^.+/src/utils/redis$': '<rootDir>/tests/mocks/redis.js'
  },
  // Increase timeout for async tests
  testTimeout: 10000,
  // Setup environment variables for tests
  setupFiles: ['<rootDir>/tests/setup.js'],
  // Configure verbose output
  verbose: true
};