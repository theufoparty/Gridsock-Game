const app = require('express')();
const server = require('http').createServer(app);

const fs = require('fs');

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = [];
let playersReady = 0;

app.get('/', (req, res) => {
  //res.send('<h1>Welcome to our server!</h1>');

  fs.readFile("../client/assets/data/words.json", (err, data) => { 
    if (err) {
      console.log(err);
    } 

    const wordArray = JSON.parse(data);
    
    const wordId = wordArray.id;
    console.log(Math.floor(Math.random() * wordArray.length));

    res.send(wordArray);
    return;
  });

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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
