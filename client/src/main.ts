import './styles/style.css';
import { IUserType, IUserMessageType } from './utils/types';
import {
  swapClassBetweenTwoElements,
  getRandomColor,
  addFirstClassAndRemoveSecondClassToElement,
  displayOrHideTwoElements,
} from './utils/helperfunctions';
import { io } from 'socket.io-client';
import { initializeDrawing } from './utils/drawingCanvas';

//const socket = io('https://gridsock-game-uodix.ondigitalocean.app/');
const socket = io('http://localhost:3000/');

const usernameInput = document.getElementById('loginInput');
const loginButton = document.getElementById('loginButton');
const loginSection = document.getElementById('loginSection');
const gameLobbySection = document.getElementById('gameLobbySection');
const gameLobbyList = document.getElementById('gameLobbySectionUl');
const playersReadyContainer = document.getElementById('playersReady');
const startGameButton = document.getElementById('startGameButton');
const usernameDisplay = document.getElementById('usernameDisplay');
const guessButton = document.getElementById('guessButton');
const guessInput = document.getElementById('guessInput');
const chatList = document.getElementById('chatList');
const lobbyChatInput = document.getElementById('lobbyChatInput');
const lobbyChatList = document.getElementById('lobbyChatList');
const lobbyChatButton = document.getElementById('lobbyChatButton');
const userThatIsDrawing = document.getElementById('user');
const gameSection = document.getElementById('gameSection');
const playerHighscoreList = document.getElementById('playerHighscore');
const userIcon = document.getElementById('userIcon');
const drawPanel = document.getElementById('drawOptions');
const wordToDraw: HTMLElement | null = document.getElementById('wordToDraw');
const rightWordDisplay = document.getElementById('rightWordDisplay');
const countdownMessage = document.getElementById('countdownMessage');
const questionMark = document.getElementById('question');
const nextRoundTimer = document.getElementById('nextRoundTimer');
const lightbox = document.getElementById('lightbox');
const endSection = document.getElementById('endSection');
const scoreBoardList = document.querySelector('#scoreBoard ul');
let currentWord = '';
let nextRoundInterval: number;

// placeholder for point logic when guessing the right answer
document.getElementById('right')?.addEventListener('click', guessedRightAnswer);

// Remove later!!! - Placeholder to click new word (Logo img)

const clickTest = document.querySelector('header img');
clickTest?.addEventListener('click', fetchWordsFromServer);

/**
 * Fetch endpoint for wordarray
 */

function fetchWordsFromServer() {
  fetch('http://localhost:3000/words').catch(err => console.error('error', err));
}

function getIsCurrentPlayer() {
  const user = localStorage.getItem('user');
  if (userThatIsDrawing === null) {
    return false;
  }
  const userDrawing = userThatIsDrawing.textContent;
  return user === userDrawing;
}

// Random word recieved from server

socket.on('words', newWord => {
  if (!wordToDraw) return;
  // Only show the word to player who will draw
  const isCurrentPlayer = getIsCurrentPlayer();
  if (isCurrentPlayer) {
    wordToDraw.innerText = newWord;
    wordToDraw.classList.remove('hidden');
    questionMark?.classList.add('hidden');
  } else {
    wordToDraw.innerText = newWord;
    wordToDraw.classList.add('hidden');
    questionMark?.classList.remove('hidden');
  }
  currentWord = newWord;
  console.log(currentWord);  
});

/**
 * Handles login for user
 * Picket username is set in localstorage
 * Displays error message if input is not filled
 * Emits username to server using socket
 * @param {Element | null} input
 * @param {Element | null} loginSection
 * @returns void
 */
function handleLoginOnClick(input: Element | null, loginSection: Element | null, gameLobbySection: Element | null) {
  if (!input || !loginSection) {
    return;
  }
  const inputValue = (input as HTMLInputElement).value;
  if (inputValue.trim().length <= 0) {
    // we can change this later if we want to add a red text etc
    alert('you have to fill in input');
  } else {
    localStorage.setItem('user', inputValue);
    emitUserInfoToServer(inputValue);
    if (usernameDisplay) {
      usernameDisplay.textContent = inputValue;
    }
    userIcon?.classList.remove('hidden');
    swapClassBetweenTwoElements(loginSection, gameLobbySection, 'hidden');
  }
}

function emitUserInfoToServer(username: string) {
  const randomColor = getRandomColor();
  socket.emit('newUser', { username: username, color: randomColor });
}

function createUserIcon(color: string) {
  const userIcon = document.createElement('div');
  userIcon.classList.add('list-dot');
  userIcon.style.backgroundColor = color;
  return userIcon;
}

function createUserText(username: string, color: string) {
  const userText = document.createElement('p');
  userText.textContent = username;
  userText.style.color = color;
  return userText;
}

function createReadyButton(id: string, isReady: boolean) {
  const readyButton = document.createElement('button');
  readyButton.id = id;
  readyButton.innerText = isReady ? 'ready' : 'waiting';
  isReady ? readyButton.classList.add('ready') : readyButton.classList.add('waiting');
  return readyButton;
}

/**
 * Adds a user to the lobby list with a ready button. Each user's name is displayed
 * with a specific color defined by the user's `color` property.
 * sets button id to user id
 * @param {object} user - The user object that contains username, ID and color.
 * @param {string} user.username - The users name.
 * * @param {string} user.color - The CSS color code (as a string) for the user's name.
 * @param {string} user.id - The users socket-id.
 */

function appendUserToList(user: { username: string; color: string; id: string; isReady: boolean }) {
  if (!gameLobbyList) return;
  const { username, color, id, isReady } = user;
  const userElement = document.createElement('div');
  const userPanel = document.createElement('div');
  const userIconContainer = document.createElement('div');
  const dotContainer = document.createElement('div');
  dotContainer.classList.add('dot-panel');
  const userIcon = createUserIcon(color);
  const userText = createUserText(username, color);
  const readyButton = createReadyButton(id, isReady);
  userIconContainer.id = 'dot-container';
  dotContainer.append(userIcon);
  userIconContainer.append(dotContainer);
  userPanel.classList.add('player-panel');
  userPanel.append(userIconContainer, userText);
  userElement.style.color = color;
  userElement.append(userPanel, readyButton);
  const listItem = document.createElement('li');
  listItem.appendChild(userElement);
  checkNumberOfPlayers(listItem);
}

function checkNumberOfPlayers(player: HTMLElement) {
  if (gameLobbyList !== null) {
    let liElements = gameLobbyList.getElementsByTagName('li');
    const amountLiElements = liElements.length;
    if (amountLiElements >= 5) {
      alert('Spelet är fullt!');
    } else {
      gameLobbyList.appendChild(player);
    }
  }
}

/**
 * With event delegation checks if target is button
 * If target is button, change player status and send to server together with button id
 * @param {Event} e - click event
 * @returns void
 */
function handleClickOnButtons(e: Event) {
  const target = e.target as HTMLElement;
  const storedId = localStorage.getItem('userId');
  if (target.tagName !== 'BUTTON' || target.id !== storedId) return;
  const currentStatus = target.textContent === 'waiting' ? 'ready' : 'waiting';
  const statusClass = target.textContent === 'waiting' ? 'ready' : 'waiting';
  socket.emit('userStatus', { statusText: currentStatus, statusId: target.id, statusClass: statusClass });
}

function updatePlayersReadyAndWhenFullDisplayStartGameButton(
  startGameButton: Element | null,
  playersReadyContainer: Element | null,
  players: number
) {
  if (!playersReadyContainer) return;
  playersReadyContainer.textContent = `${players}/5`;
  // change to five later
  console.log(players);
  if (players > 0) {
    startGameButton?.removeAttribute('disabled');
    addFirstClassAndRemoveSecondClassToElement(startGameButton, 'active', 'disabled');
  } else {
    startGameButton?.setAttribute('disabled', 'true');
    addFirstClassAndRemoveSecondClassToElement(startGameButton, 'disabled', 'active');
  }
}

/**
 * Generates player highscore based on usernames and current points
 * @param {IUserType[]} users
 * @param {Element | null} playerHighscoreList
 * @returns void
 */
function generatePlayerHighscore(users: IUserType[], playerHighscoreList: Element | null) {
  if (!playerHighscoreList) return;
  playerHighscoreList.innerHTML = '';
  users.forEach((user, index) => {
    const { username, points } = user;
    const li = document.createElement('li');
    const playerNumber = document.createElement('p');
    const userNameContainer = document.createElement('p');
    const colon = document.createElement('p');
    const pointsContainer = document.createElement('div');
    playerNumber.classList.add('player-number');
    pointsContainer.classList.add('points');
    colon.classList.add('colon');
    playerNumber.textContent = (index + 1).toString();
    colon.textContent = ':';
    userNameContainer.textContent = username;
    pointsContainer.textContent = points.toString();
    li.append(playerNumber, pointsContainer, colon, userNameContainer);
    playerHighscoreList.append(li);
  });
}

/**
 * Updates the chat where users write their guesses
 */
function updateGuessChat(guess: IUserMessageType) {
  let li = document.createElement('li');
  let userContainer = document.createElement('p');
  let messageContainer = document.createElement('p');
  userContainer.textContent = guess.user + ':';
  userContainer.style.color = guess.color;
  messageContainer.textContent = guess.message;
  li.append(userContainer, messageContainer);

  const liCorrect = document.createElement('li');
  let theGuesser = guess.user;
  const chatUser = localStorage.getItem('user');

  let theGuess = guess.message;
  const wordToDraw: HTMLElement | null = document.getElementById('wordToDraw');
  const input = guessInput as HTMLInputElement;

  if (chatList && wordToDraw && input && guess.message.trim().length > 0) {
    theGuess = theGuess.toLowerCase();
    let theWord = wordToDraw.innerHTML;
    const secretWord = 'Secret Word';
    theWord = theWord.toLowerCase();
    const input = guessInput as HTMLInputElement;
    // if the guess includes the right word but not the secret word sets it to correct
    if (theGuess.includes(theWord) && !theGuess.includes(secretWord.toLowerCase())) {
      messageContainer.textContent = 'Correct!';
      liCorrect.append(userContainer, messageContainer);
      chatList.appendChild(liCorrect);
      if (theGuess.includes(theWord) && theGuesser.includes(chatUser!)) {
        const btn = guessButton as HTMLInputElement;
        if (btn !== null) {
          btn.disabled = true;
        }
        input.disabled = true;
      }
    } else {
      chatList.appendChild(li);
      input.disabled = false;
    }
    chatList.scrollTop = chatList.scrollHeight;
  }

  input.value = '';
}

function updateLobbyChat(guess: IUserMessageType, lobbyChatList: Element | null, lobbyChatInput: Element | null) {
  let li = document.createElement('li');
  let userContainer = document.createElement('p');
  let messageContainer = document.createElement('p');
  userContainer.textContent = guess.user + ':';
  userContainer.style.color = guess.color;
  messageContainer.textContent = guess.message;
  li.append(userContainer, messageContainer);
  const input = lobbyChatInput as HTMLInputElement;
  if (lobbyChatList && guess.message.trim().length > 0) {
    lobbyChatList.appendChild(li);
    lobbyChatList.scrollTop = lobbyChatList.scrollHeight;
  }

  if (input) {
    input.value = '';
  }
}

function handleClickOnColorButtons(e: Event) {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'LI' || !target.classList.contains('list-color')) return;
  const color = target.className.replace('list-color ', '');
  socket.emit('changeColor', color);
}

// ---------------------- COUNTDOWN FUNCTIONS ---------------------- //

// Function to update the countdown display
function updateCountdownDisplay(countdown: number) {
  const countdownDisplay = document.getElementById('countdownValue');
  if (countdownDisplay) {
    countdownDisplay.textContent = countdown.toString();
  }
}

function guessedRightAnswer() {
  const userId = localStorage.getItem('userId');
  socket.emit('updatePoints', userId);
  // Listen for countdown updates from the server
  socket.on('countdownUpdate', (countdown: number) => {
    updateCountdownDisplay(countdown);
  });
}

// ---------------------- SOCKET FUNCTIONS ---------------------- //

/**
 * Emits user and input value to server for chat
 * @param {Element | null} chatInput
 * @param {string} socketName
 * @returns void;
 */
function sendChatMessageToServer(chatInput: Element | null, socketName: string) {
  if (!chatInput) return;
  const input = chatInput as HTMLInputElement;
  const chatUser = localStorage.getItem('user');

  socket.emit(socketName, {
    message: input.value,
    user: chatUser,
  });
}

/**
 * Initializes a listener for the 'updateUserList' event from the server. Upon receiving the event,
 * the user list in the interface is updated with the received list of users.
 * Each user is displayed as a list item with their name in the specified color and their socket ID.
 */

function initializeUserList(gameLobbyList: Element | null): void {
  socket.on('updateUserList', (users: IUserType[]) => {
    if (!gameLobbyList) return;
    gameLobbyList.innerHTML = '';
    users.forEach(user => appendUserToList(user));
    generatePlayerHighscore(users, playerHighscoreList);
  });
}

// Listen for countdown updates from the server
socket.on('countdownUpdate', (countdown: number) => {
  updateCountdownDisplay(countdown);
});

// Listen for countdown finished event from the server
socket.on('countdownFinished', isItLastRound => {
  let countdown = 3;

  if (!countdownMessage || !nextRoundTimer) return;
  countdownMessage.textContent = "Time's up!";
  updateCountdownDisplay(0);
  if (isItLastRound) {
    nextRoundTimer.textContent = '';
    displayOrHideTwoElements(nextRoundTimer, lightbox, false);
  } else {
    nextRoundInterval = setInterval(() => {
      displayOrHideTwoElements(nextRoundTimer, lightbox, true);
      if (countdown > 0) {
        nextRoundTimer.textContent = countdown.toString();
        countdown -= 1;
      } else {
        clearInterval(nextRoundInterval);
        nextRoundTimer.textContent = 'Next round!';
      }
      console.log('countdown', countdown);
    }, 1000);
  }

  if (rightWordDisplay && currentWord) {
    rightWordDisplay.textContent = `Right word was: ${currentWord}`;
  }
});

/**
 * Recieves users info from server, user id and how many players are ready
 * Sets userid in localstorage
 * Updates UI for how many players are ready when logging in
 * @param {Element | null} startGameButton
 * @param {Element | null} playersReadyContainer
 */
function recieveSocketForNewUser(startGameButton: Element | null, playersReadyContainer: Element | null) {
  socket.on('newUser', usersInfo => {
    const { userId, playersReady } = usersInfo;
    localStorage.setItem('userId', userId);
    updatePlayersReadyAndWhenFullDisplayStartGameButton(startGameButton, playersReadyContainer, playersReady);
  });
}

/**
 * Socket on from which status the user has, catches io.emit
 * Changes the button text to the status
 */
function recieveSocketUserStatus(gameLobbyList: Element | null) {
  socket.on('userStatus', status => {
    if (!gameLobbyList) return;
    const buttons = gameLobbyList.querySelectorAll('button');
    const { statusId, statusText, statusClass } = status;
    console.log(statusClass);
    buttons.forEach(button => {
      if (button.id !== statusId) return;
      button.textContent = statusText;
      button.className = '';
      button.classList.add(statusClass);
    });
  });
}

/**
 * Updates how many players are currently ready
 */
function recieveSocketPlayersReady(startGameButton: Element | null, playersReadyContainer: Element | null) {
  socket.on('playersReady', players => {
    updatePlayersReadyAndWhenFullDisplayStartGameButton(startGameButton, playersReadyContainer, players);
  });
}

function recieveSocketForUpdatedUserPoints() {
  socket.on('updatedUserPoints', users => {
    // here implement some kind of logic for guessing right in chat
    generatePlayerHighscore(users, playerHighscoreList);
  });
}

/**
 * Sets up a listener for the "newRound" event. Updates the user interface with the name
 * of the user that is drawing in the new round. It also includes a TODO for adding logic to
 * enable or disable drawing capabilities based on the current user's role.
 * @param {Element | null} userThatIsDrawing - The DOM element where the current drawing user's name is displayed.
 */
function startNewRound(userThatIsDrawing: Element | null) {
  socket.on('newRound', (nextUserName: string) => {
    if (userThatIsDrawing) {
      userThatIsDrawing.textContent = nextUserName;
    }
    if (chatList) chatList.innerHTML = '';
    if (lobbyChatList) lobbyChatList.innerHTML = '';
    if (!nextRoundTimer) return;
    displayOrHideTwoElements(nextRoundTimer, lightbox, false);
    clearInterval(nextRoundInterval);
    //Development
    if (countdownMessage) countdownMessage.innerHTML = '';
    fetchWordsFromServer();
    socket.emit('clearCanvas');
  });
}

function endOfGame() {
  socket.on('endOfGame', (users: IUserType[]) => {
    displayOrHideTwoElements(nextRoundTimer, lightbox, false);
    clearInterval(nextRoundInterval);
    console.log('Received users:', users);
    const sortedUsers = [...users].sort((a, b) => b.points - a.points);
    if (scoreBoardList) {
      scoreBoardList.innerHTML = '';
      sortedUsers.forEach((user, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}</span><span>${user.username}</span><span>${user.points}p</span>`;
        scoreBoardList.appendChild(li);
      });
    }

    gameSection?.classList.add('hidden');
    endSection?.classList.remove('hidden');
  });
}

/**
 * Sets up a listener for the "startGame" event. When a game starts, it changes the visibility of the
 * game section and lobby section by toggling their classes, effectively showing the game section and
 * hiding the game lobby section. This function is used to transition the user interface from the lobby
 * to the active game state.
 * @param {Element | null} gameSection - The DOM element representing the main game area, to be shown when the game starts.
 * @param {Element | null} gameLobbySection - The DOM element representing the game lobby, to be hidden when the game starts.
 */
function startNewGame(gameSection: Element | null, gameLobbySection: Element | null) {
  socket.on('startGame', () => {
    if (gameSection && gameLobbySection) {
      gameLobbySection.classList.add('hidden');
      gameSection.classList.remove('hidden');
    }
  });
}

/**
 * Recieves change of color for drawing from server
 * Sets the stroke to the recieved color
 */
function recieveDrawColorFromServer() {
  socket.on('changeColor', color => {
    const drawingCanvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
    const context = drawingCanvas.getContext('2d')!;
    context.strokeStyle = color;
    context.stroke();
  });
}

socket.on('guess', arg => {
  console.log('guess!', arg);
  updateGuessChat(arg);
});

socket.on('lobbyChat', arg => {
  console.log('chat:', arg);
  updateLobbyChat(arg, lobbyChatList, lobbyChatInput);
});

function initialFunctionsOnLoad() {
  initializeUserList(gameLobbyList);
  recieveSocketUserStatus(gameLobbyList);
  recieveSocketPlayersReady(startGameButton, playersReadyContainer);
  recieveSocketForNewUser(startGameButton, playersReadyContainer);
  startNewRound(userThatIsDrawing);
  recieveSocketForUpdatedUserPoints();
  startNewGame(gameSection, gameLobbySection);
  recieveDrawColorFromServer();
  endOfGame();
}

document.addEventListener('DOMContentLoaded', initialFunctionsOnLoad);

gameLobbyList?.addEventListener('click', e => {
  handleClickOnButtons(e);
});

startGameButton?.addEventListener('click', () => {
  socket.emit('startGame');
});

guessButton?.addEventListener('click', () => {
  if (guessInput === null) {
    return;
  }
  sendChatMessageToServer(guessInput, 'guess');
});

lobbyChatButton?.addEventListener('click', () => {
  sendChatMessageToServer(lobbyChatInput, 'lobbyChat');
});

loginButton?.addEventListener('click', () => {
  handleLoginOnClick(usernameInput, loginSection, gameLobbySection);
});

drawPanel?.addEventListener('click', handleClickOnColorButtons);

window.onload = () => {
  initializeDrawing(socket);
};
