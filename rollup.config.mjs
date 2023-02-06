import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import babel from '@rollup/plugin-babel'
import url from '@rollup/plugin-url'

function bundle(config) {
    return {
        ...config,
        external: ['react', 'react/jsx-runtime', 'streamr-client', 'process', 'react-fast-compare'],
    }
}

export default [
    bundle({
        input: './src/index.ts',
        plugins: [
            url(),
            esbuild(),
            babel({
                babelHelpers: 'bundled',
                extensions: ['.ts', '.tsx'],
            }),
        ],
        output: [
            {
                file: `./index.js`,
                format: 'es',
            },
        ],
    }),
    bundle({
        input: './src/index.ts',
        plugins: [url(), dts()],
        output: [
            {
                file: `./index.d.ts`,
                format: 'es',
            },
        ],
    }),
]
