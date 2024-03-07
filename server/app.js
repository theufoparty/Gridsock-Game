const app = require('express')();
const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = [];
let playersReady = 0;
let usedIndexes = []; // keeps track of how many users have already drawn

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

app.get('/', (req, res) => {
  res.send('<h1>Welcome to our server!</h1>');
});

io.on('connection', socket => {
  socket.on('chat', arg => {
    console.log('incoming chat', arg);
    io.emit('chat', arg);
  });

  // Triggers updateUserList for the user that connects to the server.
  socket.emit('updateUserList', users);

  socket.on('newUser', user => {
    const newUser = { username: user.username, color: user.color, id: socket.id, isReady: false };
    users.push(newUser);
    io.emit('updateUserList', users);
    socket.emit('newUser', { userId: socket.id, playersReady });
  });

  socket.on('startGame', gameState => {
    if (!gameState) return;
    const nameOnlyUsers = users.map(user => user.username);
    const randomUser = getRandomizedUserToDraw(nameOnlyUsers);
    io.emit('randomUser', randomUser);
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

  socket.on('guess', (arg) => {
    console.log("incoming guess", arg);
    io.emit('guess', arg)
  })
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
