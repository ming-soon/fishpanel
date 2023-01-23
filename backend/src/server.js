const readline = require('readline');
const { exec } = require('child_process');

const startServer = (pwd) => {
  try {
    const { getKeys } = require('./services/rsa.service');
    const res = getKeys(pwd);
    if(res == null) {
      console.log('Closing...');
      return;
    }
    const child = exec(`PASSWORD=${pwd} npm run dev`);
    child.stdout.on('data', (data) => {
      console.log(data);
    });
  }
  catch(err) {
    console.log(err);
  }
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.stdoutMuted = true;

rl.question('? ', function(password) {
  if (password.length < 8) return;
  rl.stdoutMuted = false;
  rl.close();  
  console.log('OK');
  startServer(password);
});

rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted)
    rl.output.write("");
  else
    rl.output.write(stringToWrite);
};