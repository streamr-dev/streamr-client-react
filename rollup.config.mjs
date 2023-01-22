import { readFileSync } from 'fs'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import babel from '@rollup/plugin-babel'
import url from '@rollup/plugin-url'

function bundle(config) {
    return {
        ...config,
        external: [/react/, /streamr-client/, /process/],
    }
}

const config = []

JSON.parse(readFileSync('./exports.json')).forEach(([dist, inputs]) => {
    inputs.forEach((input) => {
        const i = typeof input === 'string' ? input : input[0]

        const o = typeof input === 'string' ? input.split(/\//).pop().replace(/\..+/, '') : input[1]

        config.push(
            bundle({
                input: i,
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
                        file: `${dist}/${o}.js`,
                        format: 'es',
                    },
                ],
            })
        )

        config.push(
            bundle({
                input: i,
                plugins: [url(), dts()],
                output: [
                    {
                        file: `${dist}/${o}.d.ts`,
                        format: 'es',
                    },
                ],
            })
        )
    })
})

export default config
