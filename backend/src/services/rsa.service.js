const crypto = require('node:crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const prvKeyFile = path.resolve(__dirname, '../../keys/priv');
const pubKeyFile = path.resolve(__dirname, '../../keys/pub');

const getKeys = (password) => {
  try {
    const privKeyFileBuffer = fs.readFileSync(prvKeyFile, 'ascii');
    const pubKeyFileBuffer = fs.readFileSync(pubKeyFile, 'ascii');
    var privKey = crypto.createPrivateKey({
      key: privKeyFileBuffer,
      format: 'pem',
      type: 'pkcs1',
      cipher: 'aes-256-cbc',
      passphrase: password
    });
    var pubKey = crypto.createPublicKey({
      key: pubKeyFileBuffer,
      format: 'pem',
      type: 'pkcs1'
    });
    return {
      privKey,
      pubKey,
    };
  }
  catch(err) {
    return null;
  }
};

const encrypt = (data, key) => {
  try {
    const { privKey, pubKey } = getKeys(config.password);
    if (key == 0) {
      return crypto.privateEncrypt(privKey, data).toString('base64');
    }
    else {
      return crypto.publicEncrypt(pubKey, data).toString('base64');
    }
  }
  catch(err) {
    console.log(err);
    throw new Error(err);
  }
};

const decrypt = (data, key) => {
  try {
    const { privKey, pubKey } = getKeys(config.password);
    if (key == 0) {
      return crypto.privateDecrypt(privKey, Buffer.from(data, 'base64')).toString();
    }
    else {
      return crypto.publicDecrypt(pubKey, Buffer.from(data, 'base64')).toString();
    }
  }
  catch(err) {
    console.log(err);
    throw new Error(err);
  }
};

const sign = (data) => {
  try {
    const { privKey } = getKeys(config.password);
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    const signature = sign.sign(privKey, 'base64');
    return signature;
  }
  catch(err) {
    console.log(err);
    throw new Error(err);
  }
};

const verify = (data, signature) => {
  try {
    return sign(data).toString() === signature.toString();
  }
  catch(err) {
    console.log(err);
    throw new Error(err);
  }
};

module.exports = {
  getKeys,
  encrypt,
  decrypt,
  sign,
  verify,
};