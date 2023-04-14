import path from 'path';
import nodeExternals from 'webpack-node-externals';

export default {
  entry: './bin/index.js',
  target: 'node',
  mode: 'production',
  externals: [nodeExternals()],
  output: {
    path: path.resolve('./dist'),
    filename: 'index.js',
  },
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "os": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { node: '18' } }]],
          },
        },
      },
    ],
  },
};
