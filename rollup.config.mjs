import peerDepsExternal from "rollup-plugin-peer-deps-external"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
import terser from "@rollup/plugin-terser"
import dts from "rollup-plugin-dts"


const plugins_for_bundling = [

    peerDepsExternal(),
    resolve({}),
    commonjs(),
    json(),
    typescript({

        tsconfig: './tsconfig.json',

        compilerOptions: {
            outDir: "dist",  
            declaration: true,
            emitDeclarationOnly: true,
        }, 
    
        include: [
            "src/**/*.ts"
        ],

        exclude: ["documentation/**"]
    }),

    terser()
]



export default[

    // bundling - src/index.ts
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.mjs',
                format: 'esm',
            },
            {
                file: 'dist/index.cjs',
                format: 'cjs',
            },
        ],

        context: 'global', // Setting the context to 'global' tells Rollup to treat "this" at the top level 

        plugins: plugins_for_bundling,
    },

    // after bundling, we are generating type declaration files
    {
        input: 'dist/index.d.ts',
        output: { file: "dist/types/index.d.ts" }, 
        plugins: [dts()],
    }
]












