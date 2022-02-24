const { pathsToModuleNameMapper } = require('ts-jest/utils')
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require('./tsconfig.json')

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'jsdom',
    globals: {
        'ts-jest': {
            babelConfig: false,
            tsconfig: 'tsconfig.json',
        },
    },
    collectCoverage: false,
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/',
    }),
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    collectCoverageFrom: ['src/**'],
    testLocationInResults: true,
    modulePathIgnorePatterns: ['<rootDir>/dist']
}
