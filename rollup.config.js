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
},
{
  input: './lib/dom.js',
  output: {
    file: 'dist/whimbrel-dom.esm.min.js',
    plugins: [terser()],
    format: 'esm'
  }
},{
  input: './lib/dom.js',
  output: {
    file: 'dist/whimbrel-dom.cjs.min.js',
    plugins: [terser()],
    format: 'cjs'
  }
},{
  input: './lib/dom.js',
  output: {
    file: 'dist/whimbrel-dom.esm.js',
    plugins: [],
    format: 'esm'
  }
},{
  input: './lib/dom.js',
  output: {
    file: 'dist/whimbrel-dom.cjs.js',
    plugins: [],
    format: 'cjs'
  }
}];