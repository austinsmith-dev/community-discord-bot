const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

const indexPath = path.resolve(__dirname, 'src', 'index.js');

require(indexPath);