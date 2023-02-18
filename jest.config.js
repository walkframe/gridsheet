import type {Config} from 'jest';

const config: Config = {
  verbose: true,

  preset: "ts-jest",
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testEnvironment: 'jest-environment-jsdom'
};

export default config;
