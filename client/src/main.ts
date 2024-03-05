import './styles/style.css';
import { swapClassBetweenTwoElements, getRandomColor } from './utils/helperfunctions';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/');

const usernameInput = document.getElementById('loginInput');
const loginButton = document.getElementById('loginButton');
const loginSection = document.getElementById('loginSection');
const gameLobbySection = document.getElementById('gameLobbySection');
const gameLobbyList = document.getElementById('gameLobbySectionUl');

/**
 * Handles login for user
 * Picket username is set in localstorage
 * Displays error message if input is not filled
 * Emits username to server using socket
 * @param {Element | null} input
 * @param {Element | null} loginSection
 * @returns void
 */
function handleLoginOnClick(input: Element | null, loginSection: Element | null) {
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
    swapClassBetweenTwoElements(loginSection, gameLobbySection, 'hidden');
  }
}

function emitUserInfoToServer(username: string) {
  const randomColor = getRandomColor();
  socket.emit('newUser', { username: username, color: randomColor });
}

loginButton?.addEventListener('click', () => {
  handleLoginOnClick(usernameInput, loginSection);
});

/**
 * Adds a user to the lobby list with a ready button. Each user's name is displayed
 * with a specific color defined by the user's `color` property.
 * @param {object} user - The user object that contains username, ID and color.
 * @param {string} user.username - The users name.
 * * @param {string} user.color - The CSS color code (as a string) for the user's name.
 * @param {string} user.id - The users socket-id.
 */

function appendUserToList(user: { username: string; color: string; id: string }) {
  if (!gameLobbyList) return;
  const userElement = document.createElement('div');
  userElement.innerText = user.username;
  userElement.style.color = user.color;
  const readyButton = document.createElement('button');
  readyButton.innerText = 'Ready';
  userElement.appendChild(readyButton);
  const listItem = document.createElement('li');
  listItem.appendChild(userElement);
  gameLobbyList.appendChild(listItem);
}

/**
 * Initializes a listener for the 'updateUserList' event from the server. Upon receiving the event,
 * the user list in the interface is updated with the received list of users.
 * Each user is displayed as a list item with their name in the specified color and their socket ID.
 */

export function initializeUserList(): void {
  socket.on('updateUserList', (users: Array<{ username: string; color: string; id: string }>) => {
    if (!gameLobbyList) return;
    gameLobbyList.innerHTML = '';
    users.forEach(user => appendUserToList(user));
  });
}

initializeUserList();
