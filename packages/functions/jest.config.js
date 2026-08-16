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
    "^@gridsheet/engine$": "<rootDir>/../engine/src",
    "^@gridsheet/engine/(.*)$": "<rootDir>/../engine/src/$1",
    "^@gridsheet/web$": "<rootDir>/../web/src",
    "^@gridsheet/web/(.*)$": "<rootDir>/../web/src/$1"
  },
  testEnvironment: 'jest-environment-jsdom'
};
