module.exports = {
  testEnvironment: 'jsdom', //Use browser-like DOM environment
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx'],
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/tests/setupTests.js'],
  setupFiles: ['<rootDir>/tests/setupTests.js'],
};