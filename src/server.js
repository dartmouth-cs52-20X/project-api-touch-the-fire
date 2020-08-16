import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import socketio from 'socket.io';
import Constants from './game/constants/constants';
import Game from './game/game';

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// additional init stuff should go before hitting the routing
app.use(express.static('static'));

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// Listen on port
const port = process.env.PORT || 9090;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);

// Listen for socket.io connections
io.on('connection', (socket) => {
  console.log('Player connected!', socket.id);
  socket.emit(Constants.MSG_TYPES.CHAT, 'Hello World');
  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on('disconnect', onDisconnect);
});

// Setup the Game
const game = new Game();

function joinGame(username) {
  game.addPlayer(this, username);
}

function handleInput(packageDirMove) {
  // eslint-disable-next-line no-undef
  game.handleInput(this, packageDirMove.dr, packageDirMove.mv);
}

function onDisconnect() {
  game.removePlayer(this);
}
