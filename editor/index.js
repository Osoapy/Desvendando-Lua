const backendWebsocketPort = 2018;
const backendURLWebsocket = window.location.hostname;

/* Validar input */
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("loginUsername");
  const submitButton = document.getElementById("loginButton");

  inputField.addEventListener("input", () => {
    const alphabeticChars = inputField.value.replace(/[^a-zA-Z]/g, "").length;
    submitButton.disabled = alphabeticChars < 5;
  });
});

// prevents user from tabbing into elements that should not be selectable
window.addEventListener('focusin', (e) => {
  if (!!document.activeElement.closest('.unselectable')) {
    const item = document.body.querySelector(':not(.unselectable):not([style*="display:none"]):not([style*="display: none"])');
    if (item) {
      const firstFocusableElement = item.querySelector('input, select, textarea, button, object, a, area[href], [tabindex]')
      if (firstFocusableElement) firstFocusableElement.focus();
    }
  }
});

function updateClientData(name, iconId) {
  document.getElementById('clientUserImage').src = `./assets/profilePics/${iconId}.jpeg`;
}

class Client {
  editor = null;
  websocket = null;
  uuid = null;
  username = null;
  icon = null;
  constructor() {
    this.editor = monaco.editor.create(document.getElementById("editor"), {
      value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join("\n"),
      language: "lua",
    });
    this.editor.getModel().updateOptions({ tabSize: 2, insertSpaces: true });

    monaco.editor.setTheme("vs-dark");

    window.addEventListener("resize", () => {
      this.editor.layout();
    });

    ///////////////////

    this.websocket = new WebSocket(`ws://${backendURLWebsocket}:${backendWebsocketPort}`);
    this.websocket.addEventListener('message', this.messageHandler.bind(this));

    document.getElementById('loginButton').addEventListener('click', () => {
      const username = document.getElementById('loginUsername').value;
      this.sendEvent('setName', username);
    });

    document.getElementById('runButton').addEventListener('click', () => {
      this.callRunCode();
    });
  }

  sendEvent(name, data) {
    if (this.websocket.readyState !== 1) return;
    this.websocket.send(JSON.stringify({ name, data }));
  }

  messageHandler(message) {
    const msg = JSON.parse(message.data);
    
    console.log(msg);
    if (msg.name === 'userStatus') {
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('pageContent').classList.remove('unselectable');
      this.username = msg.data.username;
      this.icon = msg.data.icon;
      this.uuid = msg.data.uuid;
      updateClientData(this.username, this.icon);
    } else if (msg.name === 'startingCodeExecution') {

    } else if (msg.name === 'interpreterOutput') {
      this.showInTerminal(msg.data);
    } else if (msg.name === 'interpreterOutputErr') {
      this.showInTerminal(msg.data);
    } else if (msg.name === 'interpreterClosed') {
    }
  }

  showInTerminal(text) {
    const terminal = document.getElementById('consoleContent');
    const p = document.createElement('p');
    p.textContent = text;
    terminal.appendChild(p);
  }

  callRunCode() {
    const code = this.editor.getValue();
    this.sendEvent('executeCode', code);
  }
}

const client = new Client();

// monaco.editor.defineTheme("vs-dark", {
//   base: "vs-dark",
//   inherit: true,
//   rules: [{ background: "000000" }],
//   colors: {
//     "editor.background": "#000000",
//   },
// });