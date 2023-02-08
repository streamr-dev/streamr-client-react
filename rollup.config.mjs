import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import babel from '@rollup/plugin-babel'
import url from '@rollup/plugin-url'
import nodeResolve from '@rollup/plugin-node-resolve'
import cjs from '@rollup/plugin-commonjs';

function bundle(config) {
    return {
        ...config,
        external: ['react', 'react/jsx-runtime', 'streamr-client'],
    }
}

export default [
    bundle({
        input: './src/index.ts',
        plugins: [
            url(),
            cjs(),
            nodeResolve(),
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
        plugins: [cjs(), nodeResolve(), url(), dts()],
        output: [
            {
                file: `./index.d.ts`,
                format: 'es',
            },
        ],
    }),
]
