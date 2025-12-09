import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const production = !process.env.ROLLUP_WATCH || process.env.NODE_ENV === 'production';

const commonPlugins = [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
  }),
];

const terserOptions = {
  compress: {
    drop_console: false,
    drop_debugger: production,
  },
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

export default [
  // Injection Script - 注入脚本（需要最小化）
  {
    input: 'src/injection-script.ts',
    output: {
      file: 'dist/injection-script.min.js',
      format: 'iife',
      name: 'InjectionScript',
      sourcemap: true,
    },
    plugins: [
      ...commonPlugins,
      production && terser(terserOptions),
    ],
  },

  // Launcher - 启动器
  {
    input: 'src/launcher.ts',
    output: {
      file: 'dist/launcher.min.js',
      format: 'iife',
      name: 'SatelliteConsole',
      sourcemap: true,
    },
    plugins: [
      ...commonPlugins,
      production && terser(terserOptions),
    ],
  },

  // Satellite App - 卫星窗口应用
  {
    input: 'src/satellite-app.ts',
    output: {
      file: 'dist/satellite-app.min.js',
      format: 'iife',
      name: 'SatelliteApp',
      sourcemap: true,
    },
    plugins: [
      ...commonPlugins,
      production && terser(terserOptions),
      copy({
        targets: [
          { src: 'src/satellite-window.html', dest: 'dist' },
        ],
      }),
    ],
  },
];
