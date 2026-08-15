module.exports = {
  verbose: true,
  preset: 'ts-jest',
  roots: ['<rootDir>/'],
  testMatch: ['**/?(*.)+(spec|test).+(ts)'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
        diagnostics: false,
      },
    ],
  },
  // testEnvironment intentionally left at Jest's default ('node'): the engine is
  // headless, so its tests must run with NO DOM (no jsdom). See headless.spec.ts.
};
