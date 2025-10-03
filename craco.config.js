const million = require('million/compiler');
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  webpack: {
    plugins: isProd
      ? [
          million.webpack({
            auto: true,
            optimize: true,
            server: false, // CRA 클라이언트 전용: SSR 비활성화
          }),
        ]
      : [],
    configure: (webpackConfig, { env, paths }) => {
      // 프로덕션 빌드 최적화
      if (env === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };
      }
      return webpackConfig;
    }
  },
  devServer: {
    port: 3000,
    hot: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    setupMiddlewares: (middlewares, devServer) => {
      // deprecated onBeforeSetupMiddleware와 onAfterSetupMiddleware 대신 사용
      return middlewares;
    },
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  }
};
