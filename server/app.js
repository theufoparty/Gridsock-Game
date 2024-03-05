const app = require('express')();
const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = [];

app.get('/', (req, res) => {
  res.send('<h1>Welcome to our server!</h1>');
});

io.on('connection', socket => {
  // Behöver vi detta?
  socket.emit('chat', { message: 'Hello world!', user: 'BOT' });
  socket.on('chat', arg => {
    console.log('incoming chat', arg);
    io.emit('chat', arg);
  });

  // Triggers updateUserList for the user that connects to the server.
  socket.emit('updateUserList', users);

  socket.on('newUser', user => {
    const newUser = { username: user.username, color: user.color, id: socket.id };
    users.push(newUser);
    io.emit('updateUserList', users);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
