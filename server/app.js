const app = require('express')();
const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to our server!</h1>');
});

io.on('connection', (socket) => {
  socket.emit('chat', { message: 'Hello world!', user: 'BOT' });
  socket.on('chat', (arg) => {
    console.log('incoming chat', arg);
    io.emit('chat', arg);
  });

  socket.on('newUser', (user) => {
    console.log(user);
    io.emit(user);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
