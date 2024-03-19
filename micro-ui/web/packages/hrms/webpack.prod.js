const { merge } = require('webpack-merge');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const commonConfig = require('./webpack.common');
const packageJson = require('./package.json');

module.exports = () => {
  const prodConfig = {
    mode: 'production',
    output: {
      publicPath: '/hrms-ui/',
      filename: '[name].[contenthash].js',
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'hrms',
        filename: 'remoteEntry.js',
        exposes: {
          './HRMSModule': './src/SingleSpaEntry',
        },
        shared: {
          'single-spa-react': '^4.6.1',
          'react': '17.0.1',
          'react-dom': '17.0.1',
          'react-router-dom': '5.2.0',
          'rxjs': '6.6.3',
          'react-hook-form': '6.15.8',
          'react-i18next': '11.16.2',
          'react-query': '3.6.1',
          'rooks': '^4.4.0',
          'webpack': '^5.68.0',
          'webpack-cli': '^4.9.2',
          'webpack-dev-server': '^4.8.1',
          'webpack-merge': '5.7.3',
        },
      }),
    ],
  };

  return merge(commonConfig, prodConfig);
};