module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "events": require.resolve("events/"),
        "stream": false,
        "crypto": false,
        "buffer": false,
        "util": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "zlib": false,
        "fs": false,
        "path": false
      };
      
      return webpackConfig;
    }
  }
}; 