const { exec } = require('child_process');
const path =require('path');
const fs = require('fs');
const { Socket } = require('net');

const command = 'prin';

if (!fs.existsSync(path.resolve(__dirname, `../cache`))) fs.mkdirSync(path.resolve(__dirname, `../cache`));
const randomId = Math.random().toString(36).substring(7);
const cachePath = path.resolve(__dirname, `../cache/${randomId}.lua`);
fs.writeFileSync(cachePath, command);

exec(path.resolve(__dirname, `../languageServer/bin/lua-language-server --socket=3520`), (error: any, stdout: any, stderr: any) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);

  // try to send auto completion language server request to the server
  const client = new Socket();
  client.connect(5050, 'localhost', () => {
    console.log('Connected');
    client.on('data', (data: any) => {
      console.log('Received: ' + data);
    });

    client.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'textDocument/completion',
      params: {
        textDocument: {
          uri: 'file://' + cachePath,
        },
        position: {
          line: 0,
          character: 4,
        },
      },
    }));

    client.end();
  });


  // fs.unlinkSync(cachePath);
});