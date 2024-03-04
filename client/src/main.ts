import './styles/style.css';
import { swapClassBetweenTwoElements } from './utils/helperfunctions';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/');

const usernameInput = document.getElementById('loginInput');
const loginButton = document.getElementById('loginButton');
const loginSection = document.getElementById('loginSection');
const gameLobbySection = document.getElementById('gameLobbySection');

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
    socket.emit('newUser', { username: inputValue });
    localStorage.setItem('user', inputValue);
    swapClassBetweenTwoElements(loginSection, gameLobbySection, 'hidden');
  }
}

loginButton?.addEventListener('click', () => {
  handleLoginOnClick(usernameInput, loginSection);
});
