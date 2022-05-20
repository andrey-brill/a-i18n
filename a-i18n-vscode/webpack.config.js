

const baseConfig = (targets) => ({
  entry: './extension/index.js',
  externals: {
    'vscode': 'vscode'
  },
  module: {
    rules: [
      {
        test: /lib/,
        type: 'asset/source'
      },
      {
        test: /\.svg$/,
        type: 'asset/inline'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|lib)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets }]]
          }
        }
      }
    ]
  }
});


const nodeConfig = {
  ...baseConfig({
    node: 12
  }),
  target: 'node',
  output: {
    libraryTarget: 'commonjs2',
    filename: 'a-i18n-node.js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  }
};


const webConfig = {
  ...baseConfig({
    browsers: "> 5%, not ie 11, not dead, not op_mini all"
  }),
  target: 'web',
  output: {
    libraryTarget: 'commonjs2',
    filename: 'a-i18n-web.js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  resolve: {
    fallback: {
      'path': false,
      'fs': false
    }
  }
};


module.exports = [nodeConfig, webConfig];

if (process.env.NODE_ENVIRONMENT !== 'production') {
  module.exports.devtool = 'source-map';
}
