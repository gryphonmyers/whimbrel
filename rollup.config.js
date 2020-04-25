import { terser } from "rollup-plugin-terser";

export default [{
    input: './lib/index.js',
    output: {
      file: 'dist/whimbrel.cjs.js',
      format: 'cjs'
    }
}, {
    input: './lib/index.js',
    output: {
      file: 'dist/whimbrel.cjs.min.js',
      plugins: [terser()],
      format: 'cjs'
    }
}, {
    input: './lib/index.js',
    output: {
      file: 'dist/whimbrel.esm.js',
      format: 'esm'
    }
}, {
    input: './lib/index.js',
    output: {
      file: 'dist/whimbrel.esm.min.js',
      plugins: [terser()],
      format: 'esm'
    }
}];