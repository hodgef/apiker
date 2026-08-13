module.exports = {
    preset: 'ts-jest',
    testEnvironment: '<rootDir>/scripts/jestEnv.js',
    globals: {
        // Transpile each file without whole-program type-checking (fast, low memory).
        // Type-checking is still enforced by the editor and the build (rollup + tsc).
        'ts-jest': { isolatedModules: true }
    },
    testMatch: ["<rootDir>/**/*.spec.(js|jsx|ts|tsx)"],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        "^.+\\.(js|jsx)$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!cfw-*)"
    ],
    moduleNameMapper: {
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/scripts/testMock.js",
        "\\.(css|less)$": "<rootDir>/scripts/testMock.js"
    }
}