/* eslint-disable new-cap */
/* eslint-disable prefer-destructuring */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import { Map } from 'immutable';
import socketio from 'socket.io';
import http from 'http';
import database from './services/datastore';

// initialize
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const players = {};
// For score keeping and leaderboards
let userMap = Map();
database.on('value', (snapshot) => {
  const newUserState = snapshot.val();
  userMap = Map(newUserState);
});
let student = true;
const star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50,
};
const scores = {
  blue: 0,
  red: 0,
};
// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// additional init stuff should go before hitting the routing

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// eslint-disable-next-line no-unused-vars
function scoreIncrease(fId, user) {
  user.score += 1;
  database.child(fId).update(user);
}

/* Starting template was adapted from phaser intro tutorial at https://phasertutorials.com/creating-a-simple-multiplayer-game-in-phaser-3-with-an-authoritative-server-part-1/ */

io.on('connection', (socket) => {
  console.log('a user connected');
  let user = {
    initial: true, username: '', score: -1, socketId: socket.id,
  };
  let fId = '';
  socket.on('username', (Username) => {
    userMap.entrySeq().forEach((element) => {
      const n = Username.localeCompare(element[1].username);
      if (n === 0) {
        fId = element[0];
        user = element[1];
      }
    });
    if (user.initial === true) {
      user = {
        initial: false, username: Username, score: 0, socketId: socket.id,
      };
      const ref = database.push(user);
      // eslint-disable-next-line no-unused-vars
      fId = ref.key;
    }
  });
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (student === true) ? 'red' : 'blue',
  };
  student = !student;
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  socket.emit('starLocation', star);
  socket.emit('scoreUpdate', scores);
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('disconnect', socket.id);
    console.log('user disconnected');
  });
  // when a player moves, update the player data
  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
  socket.on('starCollected', () => {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    // console.log(user);
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });
});
// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
server.listen(port);

console.log(`listening on: ${port}`);
