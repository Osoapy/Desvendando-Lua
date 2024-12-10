const safeConnection = window.location.protocol.includes('s');
const BU = `${safeConnection?'ws.':''}${location.hostname}`;
const backendWebsocketPort = safeConnection ? 443 : 2018;

const statusQuotes = ['Nadando no rasinho da internet', 'Https Error','Você não pode mudar seu passado, mas pode estragar seu futuro', 'Só erra quem tenta', 'Quem passa direto é trem, aqui é recuperação', 'Quem passa direto é busão, aqui é recuperação', 'Três pratos de trigo para três tigres tristes', 'O rato roeu a roupa do rei de Roma', 'Undefined', '[Object object]', 'Penso logo desisto', 'Odeio HTTP 2.0'];

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

function sendMessageToWebsocket() {
  const inputField = document.getElementById("inputMessage");
  if (inputField){
    const message = inputField.value.trim();
    if (message){
      client.sendEvent("mensagem", message);
      //Mandar para o back
      inputField.value = ""
    }
  }else{
    console.error("404 -Nao tem os campos de texto e botao de enviar");
  }
}

/* Validar mensagens */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("inputMessageButton").addEventListener('click', () => { sendMessageToWebsocket() });
  document.getElementById("inputMessage").addEventListener('change', () => { sendMessageToWebsocket() });
});

let lastToChat = '';
let lastToChatIcon = -1;

const audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);

function beep(duration, frequency, volume, type, callback) {
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (volume){gainNode.gain.value = volume;}
  if (frequency){oscillator.frequency.value = frequency;}
  if (type){oscillator.type = type;}
  if (callback){oscillator.onended = callback;}
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + ((duration || 500) / 1000));
};

function parseLogMessage(message) {
  if (message.includes('\u0007')) {
    beep(250, 1000, 0.25);
    return message.replace(/\u0007/g, '');
  }
  return message;
}

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

let lastActive = '';
// prevents user from tabbing into elements that should not be selectable
window.addEventListener('focusin', (e) => {
  if (document.activeElement.closest('.unselectable') && !document.activeElement.closest('.forcedSelectable')) {
    const closesForced = document.activeElement.closest('.unselectable').querySelector('.forcedSelectable');
    const item = document.body.querySelector(':not(.unselectable):not([style*="display:none"]):not([style*="display: none"]), .forcedSelectable');
    if (closesForced || item) {
      const firstFocusableElement = (closesForced && closesForced.id !== lastActive) ? closesForced : item.querySelector('input, select, textarea, button, object, a, area[href], [tabindex], .forcedSelectable')
      lastActive = firstFocusableElement.id;
      if (firstFocusableElement) firstFocusableElement.focus();
    }
  }
});

document.getElementById('editor').addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key === 'Tab') {
    let indexPos = monaco.editor.getEditors()[0].getPosition().column;
    if (indexPos === 1) {
      e.preventDefault();
  
      const focusableElement = document.getElementById('TopBar').querySelectorAll('input, select, textarea, button, object, a, area[href], [tabindex], .forcedSelectable')
      if (focusableElement.length > 0) focusableElement[focusableElement.length - 1].focus();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    const focusableElement = document.getElementById('console').querySelector('input, select, textarea, button, object, a, area[href], [tabindex], .forcedSelectable')
    if (focusableElement) focusableElement.focus();
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

function colorizeTerminal(el, message) {
  if (!message.includes('\u001b[')) {
    const span = document.createElement('span');
    span.innerText = message;
    el.appendChild(span);
    return;
  }
  message.split('\u001b[').forEach((frag) => {
    const endOfData = frag.indexOf('m');
    if (endOfData === -1) return;
    const span = document.createElement('span');
    const data = frag.substring(0, endOfData);
    const msg = frag.substring(endOfData + 1);
    data.split(';').forEach((code) => {
      if (code === '0') span.classList.add('white');
      else if (code === '1') span.classList.add('bold');
      else if (code === '4') span.classList.add('underline');
      else if (code === '7') span.classList.add('reverse');
      else if (code === '31') span.classList.add('red');
      else if (code === '32') span.classList.add('green');
      else if (code === '33') span.classList.add('yellow');
      else if (code === '34') span.classList.add('blue');
      else if (code === '35') span.classList.add('magenta');
      else if (code === '36') span.classList.add('cyan');
      else if (code === '37') span.classList.add('white');
      else if (code === '39') span.classList.remove('red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white');
      else if (code === '40') span.classList.add('bgBlack');
      else if (code === '41') span.classList.add('bgRed');
      else if (code === '42') span.classList.add('bgGreen');
      else if (code === '43') span.classList.add('bgYellow');
      else if (code === '44') span.classList.add('bgBlue');
      else if (code === '45') span.classList.add('bgMagenta');
      else if (code === '46') span.classList.add('bgCyan');
      else if (code === '47') span.classList.add('bgWhite');
      else if (code === '49') span.classList.remove('bgBlack', 'bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite');
    });
    span.innerText = msg;
    el.appendChild(span);
  });
}

let isRunningCode = false;

function renderTerminalFragment(terminal, textFragment, err, hideTimeStamp) {
  if (!textFragment) return;
  const parsedFrag = parseLogMessage(textFragment);
  if (!parsedFrag) return;
  const p = document.createElement('p');
  p.classList.add('terminalLine');
  
  if (!hideTimeStamp) {
    const tiMp = new Date();
    const timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.textContent = `[${getNumberWithZeros(tiMp.getHours(), 2)}:${getNumberWithZeros(tiMp.getMinutes(), 2)}:${getNumberWithZeros(tiMp.getSeconds(), 2)}] `;
    p.appendChild(timestamp);
  }

  const contentMessage = document.createElement('span');
  contentMessage.classList.add('messageContent');
  if (err) {
    contentMessage.classList.add('error');
    parsedFrag.split('\n').forEach((frag) => {
      colorizeTerminal(contentMessage, frag);
      contentMessage.appendChild(document.createElement('br'));
    });
  } else colorizeTerminal(contentMessage, parsedFrag);
  p.appendChild(contentMessage);

  terminal.appendChild(p);
}

class Client {
  editor = null;
  websocket = null;
  uuid = null;
  username = null;
  icon = null;
  botCreated = false;
  botToken = null;
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

    this.websocket = new WebSocket(`ws${safeConnection ? 's' : ''}://${BU}:${backendWebsocketPort}`);
    this.websocket.addEventListener('message', this.messageHandler.bind(this));

    document.getElementById('loginButton').addEventListener('click',this.connectToServer.bind(this));
    document.getElementById('loginUsername').addEventListener('change',this.connectToServer.bind(this));

    document.getElementById('runButton').addEventListener('click', () => {
      this.callRunCode();
    });

    document.getElementById('botName').addEventListener('input', () => { this.devPanelUpdate(true); });
    document.getElementById('applicationName').addEventListener('input', () => { this.devPanelUpdate(true); });
    document.getElementById('applicationDescription').addEventListener('input', () => { this.devPanelUpdate(true); });

    document.getElementById('createOrUpdateApp').addEventListener('click', () => {
      if (document.getElementById('applicationName').value.trim()) {
        this.sendEvent('appData', {
          name: document.getElementById('applicationName').value,
          description: document.getElementById('applicationDescription').value,
        });
        if (document.getElementById('botName').value.trim()) {
          this.devPanelUpdate(false);
          this.sendEvent('botData', {
            name: document.getElementById('botName').value,
          });
        }
      }
    })

    const terminalInput = document.getElementById('terminalInput');
    document.getElementById('terminalInputSubmit').addEventListener('click', () => {
      this.sendMessageToTerminal(terminalInput.value);
      terminalInput.value = '';
    });
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.sendMessageToTerminal(terminalInput.value);
        terminalInput.value = '';
      }
    })
  }

  sendMessageToTerminal(message) {
    this.sendEvent('terminalMessage', message);
    renderTerminalFragment(document.getElementById('consoleContent'), '> ' + message, false, true);
  }

  devPanelUpdate(has) {
    document.getElementById('SaveChangesPopup').classList.toggle('occult', !has);
    document.getElementById('SaveChangesPopup').classList.toggle('unselectable', !has);
  }

  connectToServer() {
    document.getElementById('loginErrorDialog').classList.add('hidden');
    const username = document.getElementById('loginUsername').value;
    this.sendEvent('setName', username);
    this.editor.layout();
  }

  switchTheme(dark) {
    monaco.editor.setTheme(dark ? 'vs-dark' : 'vs-light');
  }

  sendEvent(name, data) {
    if (this.websocket.readyState !== 1) return;
    this.websocket.send(JSON.stringify({ name, data }));
  }

  onUserStatus(data) {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('pageContent').classList.remove('unselectable');
    this.username = data.name;
    this.icon = data.icon;
    this.uuid = data.uuid;
    updateClientData(this.username, this.icon);
  }

  onStartCodeExecution() {
    document.getElementById('runButton').innerText = 'Parar Execução';
    document.getElementById('runButton').classList.add('enabled');
    isRunningCode = true;
  }

  onInterpreterClosed() {
    document.getElementById('runButton').innerText = 'Executar';
    document.getElementById('runButton').classList.remove('enabled');
    isRunningCode = false;
  }

  onApplicationEvent() {
    document.getElementById('BotEditPage').classList.remove('hidden');
    document.getElementById('ApplicationNotPublished').classList.add('hidden');
    if (!this.botCreated) {
      document.getElementById('saveChangesMessage').innerText = 'Crie o Bot para obter o token';
      document.getElementById('createOrUpdateApp').innerText = 'Criar Bot';
    }
  }

  onBotToken(data) {
    document.getElementById('saveChangesMessage').innerText = 'Salve as alterações';
    document.getElementById('createOrUpdateApp').innerText = 'Salvar alterações';
    this.botToken = data;
    this.botCreated = true;
  }

  onUpdateBot(data) {
    document.getElementById('botPfp').src = `./assets/profilePics/${data.icon}.jpeg`;
    document.getElementById('botUser').classList.remove('hidden');
    document.getElementById('botUserImage').src = `./assets/profilePics/${data.icon}.jpeg`;
    document.getElementById('botUserName').innerText = data.name;
    document.getElementById('botMotd').innerText = statusQuotes[Math.floor(Math.random() * statusQuotes.length)];
  }

  messageHandler(message) {
    const msg = JSON.parse(message.data);

    switch (msg.name) {
      case 'userStatus':
        this.onUserStatus(msg.data);
        break;
      case 'startingCodeExecution':
        this.onStartCodeExecution();
        break;
      case 'interpreterOutput':
        console.log(msg);
        this.showInTerminal(msg.data);
        break;
      case 'interpreterOutputErr':
        this.showInTerminal(msg.data, true);
        break;
      case 'interpreterClosed':
        this.onInterpreterClosed();
        break;
      case 'invalidName':
        this.showLoginError(msg.data);
        break;
      case 'ChatMessage':
        LogMessages(msg.data.icon, msg.data.username, msg.data.content);
        break;
      case 'ApplicationEvent':
        this.onApplicationEvent();
        break;
      case 'botToken':
        this.onBotToken(msg.data);
        break;
      case 'channelId':
        document.getElementById('ChannelId').innerText = msg.data;
        break;
      case 'updateBot':
        this.onUpdateBot(msg.data);
        break;
      default:
        console.log('Unknown message', msg);
        break;
    }
  }

  showLoginError(data) {
    document.getElementById('errorDialogTitle').innerText = data.errorTitle;
    document.getElementById('errorDialogDescription').innerText = data.errorBody;
    document.getElementById('loginErrorDialog').classList.remove('hidden');
  }

  showInTerminal(text, err) {
    const terminal = document.getElementById('consoleContent');
    if (err) renderTerminalFragment(terminal, text, true);
    else text.split('\n').forEach((textFragment) => renderTerminalFragment(terminal, textFragment, false));
    terminal.scrollTo(0, terminal.scrollHeight);
    this.editor.layout();
  }

  callRunCode() {
    const code = this.editor.getValue();
    this.sendEvent('executeCode', !isRunningCode ? code : '');
  }
}

const client = new Client();

function toggleTheme(load) {
  if (!load) currentTheme = !currentTheme;
  else currentTheme = !(localStorage.getItem('theme') === 'light');
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

document.getElementById('ShowApplicationPanel').addEventListener('click', (e) => {
  document.getElementById('ApplicationPage').classList.remove('hidden');
  document.getElementById('BotPage').classList.add('hidden');
  e.target.classList.add('active');
  document.getElementById('ShowBotPanel').classList.remove('active');
});

document.getElementById('ShowBotPanel').addEventListener('click', (e) => {
  document.getElementById('BotPage').classList.remove('hidden');
  document.getElementById('ApplicationPage').classList.add('hidden');
  e.target.classList.add('active');
  document.getElementById('ShowApplicationPanel').classList.remove('active');
});


let showBotToken = false;
document.getElementById('revelToken').addEventListener('click', (e) => {
  if (client.botToken) {
    showBotToken = !showBotToken;
    document.getElementById('botToken').innerText = showBotToken ? client.botToken : 'Token Oculto'; 
    e.target.innerText = !showBotToken ? 'Revelar Token' : 'Esconder Token';
  }
});

let showDiscord = false;
document.getElementById('discordSwitch').addEventListener('click', (e) => {
  showDiscord = !showDiscord;
  document.getElementById('editorBox').classList.toggle('expand', !showDiscord);
  document.getElementById('fakeDiscord').classList.toggle('hidden', !showDiscord);
  e.target.innerText = showDiscord ? 'Esconder Chat' : 'Mostrar Chat';
  e.target.classList.toggle('enabled', showDiscord);
  client.editor.layout();
  const interval = setInterval(() => {
    client.editor.layout();
  }, 10);
  setTimeout(() => {
    clearInterval(interval);
  }, 500);
});

let fontSize = 1;
function updateFontSize() {
  let options = {"fontSize": 12 + (fontSize*2)}
  monaco.editor.getEditors()[0].updateOptions(options);
}

document.getElementById('IncreaseFont').addEventListener('click', () => {
  fontSize++;
  updateFontSize()
});

document.getElementById('DecreaseFont').addEventListener('click', () => {
  fontSize--;
  updateFontSize()
});

document.getElementById('ResetFont').addEventListener('click', () => {
  fontSize = 1;
  updateFontSize()
});

let expandedTerminal = false;
document.getElementById('expandTerminal').addEventListener('click', (e) => {
  expandedTerminal = !expandedTerminal;
  document.getElementById('editorBox').classList.toggle('biggerTerminal', expandedTerminal);
  e.target.innerText = expandedTerminal ? 'Recolher' : 'Expandir';
  client.editor.layout();
  const interval = setInterval(() => {
    client.editor.layout();
  }, 10);
  setTimeout(() => {
    clearInterval(interval);
    const terminal = document.getElementById('consoleContent');
    terminal.scrollTo(0, terminal.scrollHeight);
  }, 500);
});