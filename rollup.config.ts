import { fileURLToPath } from 'node:url'
import { resolve } from 'path'
import { defineConfig, RollupOptions } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { dts } from 'rollup-plugin-dts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const BaseOptions: RollupOptions = {
    input: resolve(__dirname, 'src/main.ts'),
    output: {
        dir: resolve(__dirname, 'dist')
    }
}

export default defineConfig([
    {
        ...BaseOptions,
        plugins: [typescript()]
    },
    {
        ...BaseOptions,
        plugins: [dts()]
    }
])
