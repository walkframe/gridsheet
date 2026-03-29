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
    "^@gridsheet/core$": "<rootDir>/../core/src",
    "^@gridsheet/core/(.*)$": "<rootDir>/../core/src/$1"
  },
  testEnvironment: 'jest-environment-jsdom'
};
