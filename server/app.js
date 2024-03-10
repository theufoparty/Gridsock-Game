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
 * Endpoint for words-array fetched from client
 */

app.get('/words', (req, res) => {
  const db = req.app.locals.db;

  db.collection('Words')
    .find()
    .toArray()
    .then(data => {
      io.emit('words', data);
      res.json(data);
    });
});

const users = [];
let playersReady = 0;
let usedIndexes = []; // keeps track of how many users have already drawn
let countdown = 60; // Initial countdown value in seconds

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

  socket.on('startGame', gameState => {
    if (!gameState) return;
    const nameOnlyUsers = users.map(user => user.username);
    const randomUser = getRandomizedUserToDraw(nameOnlyUsers);
    io.emit('randomUser', randomUser);
    //getRandomWord();
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

  socket.on('guess', arg => {
    console.log('incoming guess', arg);
    io.emit('guess', arg);
  });

  socket.on('startGame', () => {
    countdown = 60;
    // An interval to update the countdown every second
    const countdownInterval = setInterval(() => {
      if (countdown <= 0) {
        // If countdown reaches zero, clear the interval and emit a "countdownFinished" event
        clearInterval(countdownInterval);
        io.emit('countdownFinished'); // Notify clients that the countdown has finished
      } else {
        // Update the countdown value and emit a "countdownUpdate" event to all connected clients
        io.emit('countdownUpdate', countdown); // Send the updated countdown value to clients
        countdown--; // Decrement the countdown value by 1 second
      }
    }, 1000); // Run the interval every 1000 milliseconds (1 second)
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
