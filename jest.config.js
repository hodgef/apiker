module.exports = {
    preset: 'ts-jest',
    testMatch: ["<rootDir>/**/tests/*.(js|jsx|ts|tsx)"],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        "^.+\\.(js|jsx)$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!cfw-*)"
    ]
}