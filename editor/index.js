const backendWebsocketPort = 2018;
const backendURLWebsocket = window.location.hostname;

const statusQuotes = ['Nadando no rasinho da internet', 'Https Error','Você não pode mudar seu passado, mas pode estragar seu futuro', 'Só erra quem tenta', 'Quem passa direto é trem, aqui é recuperação', 'Quem passa direto é busão, aqui é recuperação', 'Três pratos de trigo para três tigres tristes', 'O rato roeu a roupa do rei de Roma', 'Undefined', '[Object object]'];

let currentTheme = true;

/* Validar input */
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("loginUsername");
  const submitButton = document.getElementById("loginButton");

  inputField.addEventListener("input", () => {
    const alphabeticChars = inputField.value.replace(/[^a-zA-Z]/g, "").length;
    submitButton.disabled = alphabeticChars < 5;
  });
});

/* Validar mensagens */
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("inputMessage");
  const button = document.getElementById("inputMessageButton");

  if (inputField && button){
    button.addEventListener("click", () =>{
      const message = inputField.value.trim();
      if (message){
        client.sendEvent("mensagem", message);
        //Mandar para o back
        inputField.value = ""
      }else{
        //Fazer nada?
      }
    });
  }else{
    console.error("404 -Nao tem os campos de texto e botao de enviar");
  }
});

let lastToChat = '';
let lastToChatIcon = -1;

//Para testar as mensagens
function LogMessages(icon, name, message){
  const messageList = document.getElementById("chatMessages");
  if (messageList){
    if (lastToChat !== name || lastToChatIcon !== icon) {
      const newMessage = document.createElement("div");
      newMessage.classList.add('chatMessage');

      const pfp = document.createElement('img');
      pfp.classList.add('chatMessagePFP');
      pfp.src = `./assets/profilePics/${icon}.jpeg`;
      newMessage.appendChild(pfp);

      const nameAndText = document.createElement('div');
      nameAndText.classList.add('vertical');
      const nameE = document.createElement('span');
      nameE.classList.add('messageName');
      nameE.innerText = name;
      nameAndText.appendChild(nameE);
      message.split('\n').forEach((frag) => {
        const msg = document.createElement('span');
        msg.classList.add('messageContent');
        msg.innerText = frag;
        nameAndText.appendChild(msg);
      });

      newMessage.appendChild(nameAndText);
      messageList.appendChild(newMessage);
    } else {
      const lastMessageContent = messageList.children[messageList.children.length - 1].children[1];
      message.split('\n').forEach((frag) => {
        const msg = document.createElement('span');
        msg.classList.add('messageContent');
        msg.innerText = frag;
        lastMessageContent.appendChild(msg);
      });
    }
    lastToChat = name;
    lastToChatIcon = icon;
  } else {
    console.error("A Div de mensagens não foi encontrada")
  }
}

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
  document.getElementById('clientUserName').innerText = name;
  document.getElementById('clientMotd').innerText = statusQuotes[Math.floor(Math.random() * statusQuotes.length)];
}

function getNumberWithZeros(number, amountOfZeros) {
  return number.toString().padStart(amountOfZeros, '0');
}

// monaco.editor.defineTheme("vs-dark", {
//   base: "vs-dark",
//   inherit: true,
//   rules: [{ background: "40444b" }],
//   colors: {
//     "editor.background": "#40444b",
//   },
// });

// monaco.editor.defineTheme("vs-light", {
//   base: "vs-dark",
//   inherit: true,
//   rules: [{ background: "000000" }],
//   colors: {
//     "editor.background": "#000000",
//   },
// });

class Client {
  editor = null;
  websocket = null;
  uuid = null;
  username = null;
  icon = null;
  constructor() {
    this.editor = monaco.editor.create(document.getElementById("editor"), {
      value: 'print("Hello World!")',
      language: "lua",
    });
    this.editor.getModel().updateOptions({ tabSize: 2, insertSpaces: true });

    monaco.editor.setTheme("vs-dark");

    window.addEventListener("resize", () => {
      this.editor.layout();
    });

    // duplicate line on control + d
    monaco.editor.addKeybindingRules([
      {
          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
          command: 'editor.action.copyLinesDownAction',
          when: 'editorTextFocus'
      }
    ]);


    ///////////////////

    this.websocket = new WebSocket(`ws://${backendURLWebsocket}:${backendWebsocketPort}`);
    this.websocket.addEventListener('message', this.messageHandler.bind(this));

    document.getElementById('loginButton').addEventListener('click', () => {
      document.getElementById('loginErrorDialog').classList.add('hidden');
      const username = document.getElementById('loginUsername').value;
      this.sendEvent('setName', username);
      this.editor.layout();
    });

    document.getElementById('runButton').addEventListener('click', () => {
      this.callRunCode();
    });

    document.getElementById('createOrUpdateApp').addEventListener('click', () => {
      this.sendEvent('appData', {
        name: document.getElementById('applicationName').value,
        description: document.getElementById('applicationDescription').value,
      })
    })
  }

  switchTheme(dark) {
    monaco.editor.setTheme(dark ? 'vs-dark' : 'vs-light');
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
      this.username = msg.data.name;
      this.icon = msg.data.icon;
      this.uuid = msg.data.uuid;
      updateClientData(this.username, this.icon);
    } else if (msg.name === 'startingCodeExecution') {

    } else if (msg.name === 'interpreterOutput') {
      this.showInTerminal(msg.data);
    } else if (msg.name === 'interpreterOutputErr') {
      this.showInTerminal(msg.data);
    } else if (msg.name === 'interpreterClosed') {
    } else if (msg.name === 'invalidName') {
      this.showLoginError(msg.data);
    } else if (msg.name === 'ChatMessage') {
      LogMessages(msg.data.icon, msg.data.username, msg.data.content);
    }
  }

  showLoginError(data) {
    document.getElementById('errorDialogTitle').innerText = data.errorTitle;
    document.getElementById('errorDialogDescription').innerText = data.errorBody;
    document.getElementById('loginErrorDialog').classList.remove('hidden');
  }

  showInTerminal(text) {
    const terminal = document.getElementById('consoleContent');
    text.split('\n').forEach((textFragment) => {
      if (!textFragment) return;
      const p = document.createElement('p');
      const tiMp = new Date();
      p.textContent = `[${getNumberWithZeros(tiMp.getHours(), 2)}:${getNumberWithZeros(tiMp.getMinutes(), 2)}:${getNumberWithZeros(tiMp.getSeconds(), 2)}] ${textFragment}`;
      terminal.appendChild(p);
    });
    terminal.scrollTo(0, terminal.scrollHeight);
    this.editor.layout();
  }

  callRunCode() {
    const code = this.editor.getValue();
    this.sendEvent('executeCode', code);
  }
}

const client = new Client();

function toggleTheme(load) {
  if (!load) currentTheme = !currentTheme;
  else currentTheme = localStorage.getItem('theme') === 'dark';
  document.getElementById('themeSwitch').innerText = currentTheme ? 'Modo Claro' : 'Modo Escuro';
  document.body.classList.toggle('light', !currentTheme);
  client.switchTheme(currentTheme);
  localStorage.setItem('theme', currentTheme ? 'dark' : 'light');
}

document.getElementById('themeSwitch').addEventListener('click', () => {
  toggleTheme();
});

document.getElementById('cleanTerminal').addEventListener('click', () => {
  document.getElementById('consoleContent').innerHTML = '';
});

toggleTheme(true);

let tabTransitionTimeout;

document.getElementById('fakeDiscordDevButton').addEventListener('click', () => {
  if (tabTransitionTimeout) clearTimeout(tabTransitionTimeout);
  // mudar para aba de painel de dev
  document.getElementById('fakeChat').classList.add('exiting');
  document.getElementById('fakeDevPanel').classList.remove('exiting');
  document.getElementById('fakeDevPanel').classList.remove('hidden');
  tabTransitionTimeout = setTimeout(() => { 
    document.getElementById('fakeChat').classList.add('hidden');
  }, 500);
  document.getElementById('fakeDiscordChatButton').classList.remove('active');
  document.getElementById('fakeDiscordDevButton').classList.add('active');
});

document.getElementById('fakeDiscordChatButton').addEventListener('click', () => {
  if (tabTransitionTimeout) clearTimeout(tabTransitionTimeout);
  // mudar para aba de painel de chat
  document.getElementById('fakeChat').classList.remove('exiting');
  document.getElementById('fakeDevPanel').classList.add('exiting');
  document.getElementById('fakeChat').classList.remove('hidden');
  tabTransitionTimeout = setTimeout(() => {
    document.getElementById('fakeDevPanel').classList.add('hidden');
  }, 500);
  document.getElementById('fakeDiscordChatButton').classList.add('active');
  document.getElementById('fakeDiscordDevButton').classList.remove('active');
});

document.getElementById('createApplication').addEventListener('click', () => {
  document.getElementById('homeScreenFakeDev').classList.add('hidden');
  document.getElementById('devPanelContent').classList.remove('hidden');
});
