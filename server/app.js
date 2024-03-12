const app = require('express')();
const server = require('http').createServer(app);
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const cors = require('cors');

MongoClient.connect(process.env.DB_URL).then(client => {
  console.log('We are connected to database');
  const db = client.db('Game');
  app.locals.db = db;
});

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

app.get('/', (req, res) => {
  res.send('<h1>Welcome to our server!</h1>');
});

/**
 * Function for picking random word and delete/splice it from array
 */

let gameArray = [];

function getRandomWord() {
  
  const randomWordId = Math.floor(Math.random() * gameArray.length);
  let currentWord = gameArray[randomWordId];
  //console.log(gameArray.length + ' ' + randomWordId + ' ' + currentWord.id + currentWord.word);
  gameArray.splice(randomWordId, 1); //Splice from array
  //console.log('gameArray', gameArray);
  let randomWord = currentWord.word; 
  io.emit('words', randomWord);
}

/**
 * Endpoint for words-array fetched from client
 */

app.get('/words', (req, res) => {
  const db = req.app.locals.db;

  db.collection('Words')
    .find()
    .toArray()
    .then(data => {
      res.json(data);
      const wordArray = data[0].words;  
      if (gameArray.length === 0) {
        gameArray = wordArray;
        getRandomWord();
      } else {
        getRandomWord();
      } 
    });
});

let users = [];
let playersReady = 0;
let usedIndexes = []; // keeps track of how many users have already drawn
let countdown = 60; // Initial countdown value in seconds
let currentUser = '';
let countdownInterval = null;

/**
 * Calculates in 5 seconds interval based on timeLeft how many points are recieved
 * @param {number} timeLeft
 * @returns {number} - points
 */
function getPointsAsNumberBasedOnTime(timeLeft) {
  // if time left is greater than 5 seconds give player points
  const pointsThreshold = 5;
  const secsPerPointInterval = 5;
  const pointsPerInterval = 100;
  const minPointsAboveThreshold = 100; // min amount of points over 5 seconds
  if (timeLeft >= pointsThreshold) {
    const secsAboveThreshold = timeLeft - pointsThreshold;
    return minPointsAboveThreshold + Math.floor(secsAboveThreshold / secsPerPointInterval) * pointsPerInterval;
  }
  // if player does not answer above the time threshold they get no points
  return 0;
}

/**
 * Returns random string from provided array of strings
 * Checks if user has already been picked
 * @param {string[]} array
 * @returns random string
 */
function getRandomizedUserToDraw(users) {
  let randomIndex = Math.floor(Math.random() * users.length);
  if (usedIndexes.length >= users.length) return;
  const hasPlayerAlreadyDrawn = usedIndexes.findIndex(index => index === randomIndex);
  if (hasPlayerAlreadyDrawn === -1) {
    usedIndexes.push(randomIndex);
    return users[randomIndex];
  } else {
    return getRandomizedUserToDraw(users);
  }
}

io.on('connection', socket => {
  socket.on('chat', arg => {
    console.log('incoming chat', arg);
    io.emit('chat', arg);
  });

  // CHANGING CANVAS COLOR

  socket.on('changeColor', color => {
    console.log('color', color);
    io.emit('changeColor', color);
  });

  // DRAWING

  socket.on('drawing', data => {
    socket.broadcast.emit('drawing', data);
  });

  socket.on('startDrawing', data => {
    socket.broadcast.emit('startDrawing', data);
  });

  socket.on('endDrawing', () => {
    socket.broadcast.emit('endDrawing');
  });

  socket.on('clearCanvas', () => {
    socket.broadcast.emit('clearCanvas');
  });

  socket.emit('updateUserList', users);

  // NEW USER
  // if player logs in, add a new user with their information to the users
  socket.on('newUser', user => {
    const newUser = { username: user.username, color: user.color, id: socket.id, isReady: false, points: 0 };
    users.push(newUser);
    io.emit('updateUserList', users);
    socket.emit('newUser', { userId: socket.id, playersReady });
  });

  // gets stored id from client, if user exists update user points based on time
  // sending back all users with the updated points
  socket.on('updatePoints', userId => {
    const user = users.find(user => user.id === userId);
    if (user) {
      // placeholder right now
      user.points += getPointsAsNumberBasedOnTime(countdown);
      io.emit('updatedUserPoints', users);
    }
  });

  // from the client ready / waiting status change the player status
  socket.on('userStatus', status => {
    // does user exist in users, if not exit function
    const user = users.find(user => user.id === socket.id);
    if (!user) return;

    if (status.statusText === 'ready') {
      if (!user.isReady) {
        user.isReady = true;
        playersReady += 1;
      }
    } else {
      if (user.isReady) {
        user.isReady = false;
        playersReady -= 1;
      }
    }
    io.emit('userStatus', status);
    io.emit('playersReady', playersReady);
  });

  // on disconnect kick player from game
  socket.on('disconnect', () => {
    // find the userindex in the users array that corresponds to the disconnected socket.id
    const userIndex = users.findIndex(user => user.id === socket.id);
    if (userIndex === -1) return;
    // if player was in ready move, remove their ready from the playersReady number
    if (users[userIndex].isReady) {
      playersReady -= 1;
      io.emit('playersReady', playersReady);
    }
    // remove the user with splice
    users.splice(userIndex, 1);
    io.emit('updateUserList', users);
  });

  // receive guess from client and sends back to all clients
  socket.on('guess', arg => {
    const userInUsers = users.find(user => user.username === arg.user);
    if (userInUsers) {
      io.emit('guess', { message: arg.message, user: arg.user, color: userInUsers.color });
    }
  });

  socket.on('lobbyChat', arg => {
    console.log(arg);
    const userInUsers = users.find(user => user.username === arg.user);
    if (userInUsers) {
      io.emit('lobbyChat', { message: arg.message, user: arg.user, color: userInUsers.color });
    }
  });

  // NEW ROUND
  /**
   * Resets the game's countdown timer to its starting value.
   */
  function resetClock() {
    countdown = 60;
  }

  /**
   * Decreases the countdown timer every second. If the countdown reaches 0, it stops the timer
   * and emits a "countdownFinished" event. Otherwise, it updates the countdown value and emits
   * a "countdownUpdate" event to all connected clients.
   */
  function tick() {
    if (countdown < 0) {
      clearInterval(countdownInterval);
      io.emit('countdownFinished');
      setTimeout(() => {
        const nextUserName = selectNextUser(); // Välj nästa användare som ska rita.
        newRound(nextUserName);
      }, 5000); // Vänta 5 sekunder innan nästa runda startar.
    } else {
      io.emit('countdownUpdate', countdown);
      countdown--;
    }
  }

  /**
   * Starts a new round with the specified user, resets the countdown timer, and schedules the tick function
   * to be called every second. Emits a "newRound" event with the next user's name.
   * @param {string} nextUserName - The username of the next user for the round.
   */
  function newRound(nextUserName) {
    currentUser = nextUserName;
    resetClock();
    countdownInterval = setInterval(tick, 1000);
    io.emit('newRound', nextUserName);
  }

  // START GAME
  /**
   * Selects the next user to draw randomly from the list of users. It filters to use only the usernames
   * for the selection process.
   * @returns {string} The username of the selected next user.
   */
  function selectNextUser() {
    const nameOnlyUsers = users.map(user => user.username);
    const randomUser = getRandomizedUserToDraw(nameOnlyUsers);
    return randomUser;
  }

  /**
   * Resets the game state for a new game. This includes resetting all users' points to 0 and clearing
   * any used indexes. It emits an "updateUserList" event with the updated list of users.
   */
  function resetGameState() {
    usedIndexes = [];
    users = users.map(user => ({
      ...user,
      points: 0,
    }));
    socket.emit('updateUserList', users);
  }

  socket.on('startGame', () => {
    resetGameState();
    const nextUserName = selectNextUser();
    io.emit('startGame');
    newRound(nextUserName);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
