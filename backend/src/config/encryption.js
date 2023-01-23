const config = require('./config');

const encrypt = (data) => {
  console.log('pwd', config.password);
}

const decrypt = (data) => {
  console.log('pwd', config.password);
}

module.exports = {
  encrypt,
  decrypt,
};