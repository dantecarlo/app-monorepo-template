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
      // react-native-worklets/plugin MUST be last (reanimated 4+)
      'react-native-worklets/plugin'
    ]
  }
}
