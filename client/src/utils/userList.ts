import { io } from 'socket.io-client';
const socket = io('http://localhost:3000/');
const gameLobbyList = document.querySelector('#gameLobbySection ul');

/**
 * Adds a user in the lobby-list with a kick-button.
 * @param {object} user - User object that contains username and id.
 * @param {string} user.username - Users namen.
 * @param {string} user.id - Users socket-id.
 */

function appendUserToList(user: { username: string; id: string }) {
  if (!gameLobbyList) return;

  const userElement = document.createElement('div');
  userElement.innerText = user.username;

  // TODO: Replace with code for ready-button
  // const kickButton = document.createElement('button');
  // kickButton.innerText = 'Kick';
  // kickButton.addEventListener('click', () => handleKickUser(user.id));

  // userElement.appendChild(kickButton);

  const listItem = document.createElement('li');
  listItem.appendChild(userElement);
  gameLobbyList.appendChild(listItem);
}

/**
 * Initialiserar lyssnare för 'updateUserList' eventet från servern och uppdaterar
 * användarlistan i gränssnittet med den mottagna listan av användare.
 * Varje användare visas som ett listelement med användarnamn och socket-ID.
 */

export function initializeUserList() {
  socket.on('updateUserList', users => {
    if (!gameLobbyList) return;
    gameLobbyList.innerHTML = '';
    users.forEach(appendUserToList);
  });
}
