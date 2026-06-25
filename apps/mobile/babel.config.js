/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind'
        }
      ],
      'nativewind/babel'
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src'
          },
          extensions: [
            '.ios.js',
            '.android.js',
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.json'
          ]
        }
      ],
      // class-static-block must come before worklets plugin
      '@babel/plugin-transform-class-static-block',
      // react-native-worklets/plugin MUST be last
      'react-native-worklets/plugin'
    ]
  }
}
