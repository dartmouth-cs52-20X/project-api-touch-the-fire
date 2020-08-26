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
import throttle from 'lodash.throttle';
import mongoose from 'mongoose';
import * as ChatMessages from './controllers/chat_message_controller';
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
const keystone = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50,
};
const scores = {
  blue: 0,
  red: 0,
};
// eslint-disable-next-line camelcase
const serverlasers = [];
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

// DB setup
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/chat_db';
mongoose.connect(mongoURI);
mongoose.Promise = global.Promise;

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// eslint-disable-next-line no-unused-vars
function scoreIncrease(fId, user) {
  user.score += 1;
  database.child(fId).update(user);
  console.log('updated');
}

/* Starting template was adapted from phaser intro tutorial at https://phasertutorials.com/creating-a-simple-multiplayer-game-in-phaser-3-with-an-authoritative-server-part-1/ */

io.on('connection', (socket) => {
  console.log('a user connected');

  let emitToOthers = (string, payload) => {
    socket.broadcast.emit(string, payload);
  };
  emitToOthers = throttle(emitToOthers, 25);

  let user = {
    initial: true, username: '', score: -1, socketId: socket.id,
  };
  let fId;
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
    console.log(fId);
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
  socket.emit('keystoneLocation', keystone);
  socket.emit('starLocation', star);
  socket.emit('scoreUpdate', scores);
  socket.emit('timeUpdate');
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('disconnect', socket.id);
    console.log('user disconnected');
  });

  // Handling chat
  // For now, chat messages will carry over from game to game --> need to create/call a method to delete all chatMessages from game/round over
  // On first connection, send chats to player
  ChatMessages.getChatMessages().then((result) => {
    console.log('initial chat messages sent');
    socket.emit('chatMessages', result);
  });
  // method to push chat messages to all players
  const pushChatMessages = () => {
    console.log('getting chat messages');
    ChatMessages.getChatMessages().then((result) => {
      console.log('sent chat messages');
      console.log(result);
      io.sockets.emit('chatMessages', result);
    });
  };
  // event listener to handle creating a new chat message
  socket.on('createChatMessage', (fields) => {
    console.log('chat received');
    // Call the createChatMessage function
    ChatMessages.createChatMessage(fields).then((result) => {
      // Then push all the chatMessages (including the newly created one) to all players
      pushChatMessages();
    }).catch((error) => {
      console.log(error);
      socket.emit('error', 'create failed');
    });
  });
  // event listener to clear the chat
  socket.on('clearChat', () => {
    ChatMessages.clearChat().then((result) => {
      console.log('chat cleared');
      pushChatMessages();
    }).catch((error) => {
      console.log(error);
      socket.emit('error', 'clear failed');
    });
  });

  // when a player moves, update the player data
  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    emitToOthers('playerMoved', players[socket.id]);
  });

  socket.on('updateTime', () => {
    socket.emit('timeUpdate');
  });

  socket.on('calcFireTime', (fireTouches) => {
    console.log(fireTouches);
    if (players[socket.id].team === 'red') {
      scores.red += fireTouches;
    } else {
      scores.blue += fireTouches;
    }
    io.emit('scoreUpdate', scores);
  });

  socket.on('starCollected', () => {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    scoreIncrease(fId, user);
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });

  socket.on('keystoneCollected', () => {
    if (players[socket.id].team === 'red') {
      scores.red += 100;
    } else {
      scores.blue += 100;
    }
    scoreIncrease(fId, user);
    keystone.x = Math.floor(Math.random() * 700) + 50;
    keystone.y = Math.floor(Math.random() * 500) + 50;
    io.emit('keystoneLocation', keystone);
    io.emit('scoreUpdate', scores);
  });

  socket.on('lasershot', (data) => {
    if (players[socket.id] !== undefined) {
      serverlasers.push(data);
    }
  });
});

let emitLaserloc = (payload) => {
  io.emit('laser-locationchange', payload);
};
emitLaserloc = throttle(emitLaserloc, 25);

setInterval(() => {
  serverlasers.forEach((item, index) => {
    const speedX = Math.cos(item.rotation + Math.PI / 2) * item.laser_speed;
    const speedY = Math.sin(item.rotation + Math.PI / 2) * item.laser_speed;
    item.x += speedX;
    item.y += speedY;
    Object.keys(players).forEach((key) => {
      if (item.shotfrom !== key) {
        if ((Math.hypot(players[key].x - item.x, players[key].y - item.y)) <= 30) {
          io.emit('hit', { playerId: players[key].playerId, laserId: item.laserId, shooter_team: item.shooter_team });
        }
      }
    });
    if ((Math.hypot(item.x - item.initial_x, item.y - item.initial_y)) >= 500) {
      serverlasers.splice(index, 1);
    }
  });
  emitLaserloc(serverlasers);
}, 20);

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
server.listen(port);

console.log(`listening on: ${port}`);
