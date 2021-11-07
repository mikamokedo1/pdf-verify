const path = require('path');

module.exports = {
  webpack(config, env) {
    config.resolve.alias['pdfjs-dist'] = path.join(__dirname, './node_modules/pdfjs-dist/legacy/build/pdf');
    return config;
  },
};
