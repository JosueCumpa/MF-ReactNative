const Repack = require('@callstack/repack');
const pkg = require('./package.json');

module.exports = Repack.defineWebpackConfig((env) => {
  const {mode, context, platform} = env;

  if (!platform) {
    throw new Error('Missing platform');
  }

  return {
    mode,
    context,
    entry: './index.js',
    resolve: {
      ...Repack.getResolveOptions({enablePackageExports: true}),
    },
    output: {
      path: '[context]/build/[platform]',
      uniqueName: 'HostApp',
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          use: '@callstack/repack/babel-swc-loader',
          type: 'javascript/auto',
        },
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin({
        extraChunks: [
          {
            include: /.*/,
            type: 'remote',
            outputPath: `build/${platform}/output-remote`,
          },
        ],
      }),
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'host',
        filename: 'host.container.bundle',
        remotes: {
          remote: `remote@http://localhost:8082/${platform}/mf-manifest.json`,
        },
        dts: false,
        shared: {
          react: {
            singleton: true,
            eager: true,
            requiredVersion: pkg.dependencies.react,
          },
          'react-native': {
            singleton: true,
            eager: true,
            requiredVersion: pkg.dependencies['react-native'],
          },
        },
      }),
    ],
  };
});
