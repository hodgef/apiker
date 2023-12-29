module.exports = {
    preset: 'ts-jest',
    testMatch: ["<rootDir>/**/tests/*.(js|jsx|ts|tsx)"],
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