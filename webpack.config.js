// Generated using webpack-cli https://github.com/webpack/webpack-cli
const webpack = require('webpack');
const path = require('path');
const { readFileSync } = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
const isProduction = process.env.NODE_ENV == 'production';

const banner = '*/\n' + String(readFileSync('gm-header.txt')) + '\n/*';

const config = {
  entry: {
    main: './src/main.ts'
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].user.js'
  },
  devServer: {
    open: true,
    host: 'localhost',
  },
  optimization: {
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: true,
      },
      extractComments: {
        condition: 'all',
        banner: banner,
      }
    })]
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    new webpack.BannerPlugin({
      raw: true,
      banner: `/*! ${banner} */`,
    })
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
