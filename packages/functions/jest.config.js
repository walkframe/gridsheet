module.exports = {
  verbose: true,

  preset: "ts-jest",
  "roots": [
    "<rootDir>/"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        "tsconfig": "tsconfig.spec.json",
        "diagnostics": false
      }
    ]
  },
  "moduleNameMapper": {
    "^@gridsheet/react-core$": "<rootDir>/../react-core/src"
  },
  testEnvironment: 'jest-environment-jsdom'
};
