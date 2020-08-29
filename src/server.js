/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
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
const startwo = {
  x: Math.floor(Math.random() * 700 * 2) + 50,
  y: Math.floor(Math.random() * 500 * 2) + 50,
};
const keystone = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50,
};
const keystonetwo = {
  x: Math.floor(Math.random() * 700 * 2) + 50,
  y: Math.floor(Math.random() * 500 * 2) + 50,
};
const scores = {
  blue: 0,
  red: 0,
};
// For queueing
// eslint-disable-next-line camelcase
const waiting_players = [];
const game_players = [];

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

// method to push chat messages to all players
const pushChatMessages = () => {
  console.log('getting chat messages');
  ChatMessages.getChatMessages().then((result) => {
    console.log('sent chat messages');
    io.sockets.emit('chatMessages', result);
  });
};

/* Starting template was adapted from phaser intro tutorial at https://phasertutorials.com/creating-a-simple-multiplayer-game-in-phaser-3-with-an-authoritative-server-part-1/ */

io.on('connection', (socket) => {
  console.log('a user connected');
  let inactivecheck = null;
  // eslint-disable-next-line no-unused-vars
  inactivecheck = setTimeout(() => {
    console.log('inactive kick');
    socket.emit('kicked', { x: 1 });
    socket.disconnect();
  }, 10800000);

  let logoffTimer = null;
  let isgame = false;
  socket.on('isgame', () => {
    isgame = true;
  });
  logoffTimer = setTimeout(() => {
    if (isgame === true) {
      console.log('loggedoutduetoinactivity');
      socket.emit('kicked', { x: 1 });
      socket.disconnect();
    }
  }, 10000);
  // Handling queueing
  // Adding a player to the waiting queue
  socket.on('add me to the waiting queue', () => {
    waiting_players.push(socket.id);
    console.log(`added socket id ${socket.id} to the waiting queue`);
    // Tell the player the current game size
    socket.emit('current game size', game_players.length);
  });
  // Remove player from the waiting queue on request
  socket.on('remove me from the queue', () => {
    const index = waiting_players.indexOf(socket.id);
    if (index !== -1) {
      waiting_players.splice(index, 1);
      console.log(`removed socket id ${socket.id} from waiting queue`);
    }
  });
  // Moving a player from the waiting queue to the game_players queue
  socket.on('add me to the game', () => {
    if (game_players.length <= 6) {
      // Add to game queue
      game_players.push(socket.id);
      console.log(`added socket id ${socket.id} to the game`);
      // Tell the waiting players the updated game_players length
      for (let i = 0; i < waiting_players.length; i++) {
        const curr_socket_id = waiting_players[i];
        io.to(curr_socket_id).emit('current game size', game_players.length);
      }
    }
  });
  // Remove player from the game queue on request
  socket.on('remove me from the game', () => {
    const index = game_players.indexOf(socket.id);
    if (index !== -1) {
      // Remove from game list
      game_players.splice(index, 1);
      console.log(`removed socket id ${socket.id} from the game`);
      // Update the waiting players on the size of the game
      for (let i = 0; i < waiting_players.length; i++) {
        const curr_socket_id = waiting_players[i];
        io.to(curr_socket_id).emit('current game size', game_players.length);
      }
    }
  });

  let emitToOthers = (string, payload) => {
    socket.broadcast.emit(string, payload);
  };
  emitToOthers = throttle(emitToOthers, 25);

  let user = {
    initial: true, username: '', score: -1, socketId: socket.id, email: '',
  };
  let fId;
  socket.on('username', (User) => {
    userMap.entrySeq().forEach((element) => {
      const n = User[1].localeCompare(element[1].email);
      if (n === 0) {
        fId = element[0];
        user = element[1];
      }
    });
    if (user.initial === true) {
      user = {
        initial: false, username: User[0], score: 0, socketId: socket.id, email: User[0],
      };
      const ref = database.push(user);
      // eslint-disable-next-line no-unused-vars
      fId = ref.key;
    }
    console.log(fId);
  });
  if (isgame === true) {
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      playercreated: Date.now().toString,
      team: (student === true) ? 'red' : 'blue',
    };
  }
  student = !student;
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  socket.emit('keystoneLocation', keystone);
  socket.emit('keystoneLocationtwo', keystonetwo);
  socket.emit('starLocation', star);
  socket.emit('starLocationtwo', startwo);
  socket.emit('scoreUpdate', scores);
  // Also remove the socket from both the waiting and game lists (if it's in there)
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('disconnect', socket.id);
    console.log('user disconnected');
    const game_index = game_players.indexOf(socket.id);
    const waiting_index = waiting_players.indexOf(socket.id);
    if (game_index !== -1) {
      game_players.splice(game_index, 1);
      console.log(`removed socket id ${socket.id} from the game`);
    }
    if (waiting_index !== -1) {
      waiting_players.splice(waiting_index, 1);
      console.log(`removed socket id ${socket.id} from waiting queue`);
    }
    // Update waiting room on the number of game players
    for (let i = 0; i < waiting_players.length; i++) {
      const curr_socket_id = waiting_players[i];
      io.to(curr_socket_id).emit('current game size', game_players.length);
    }
  });

  socket.on('forcedisconnect', () => {
    socket.disconnect();
  });
  // Handling chat
  // For now, chat messages will carry over from game to game --> need to create/call a method to delete all chatMessages from game/round over
  // Handle initial request from client for chats
  socket.on('getInitialChats', () => {
    ChatMessages.getChatMessages().then((result) => {
      console.log('initial chat messages sent');
      socket.emit('chatMessages', result);
    });
  });
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

  // when a player moves, update the player data
  socket.on('playerMovement', (movementData) => {
    clearTimeout(logoffTimer);
    logoffTimer = setTimeout(() => {
      if (isgame === true) {
        console.log('loggedoutduetoinactivity');
        socket.emit('kicked', { x: 1 });
        socket.disconnect();
      }
    }, 60000);
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    emitToOthers('playerMoved', players[socket.id]);
  });

  socket.on('calcFireTime', (score) => {
    if (players[socket.id].team === 'red') {
      scores.red += score.weight;
    } else {
      scores.blue += score.weight;
    }
    io.emit('scoreUpdate', scores);
  });

  socket.on('starCollected', () => {
    scoreIncrease(fId, user);
    star.x = Math.floor(Math.random() * 700 * 2) + 50;
    star.y = Math.floor(Math.random() * 500 * 2) + 50;
    io.emit('starLocation', star);
  });

  socket.on('starCollectedtwo', () => {
    scoreIncrease(fId, user);
    startwo.x = Math.floor(Math.random() * 600 * 3) + 50;
    startwo.y = Math.floor(Math.random() * 400 * 3) + 50;
    io.emit('starLocationtwo', startwo);
  });
  socket.on('keystoneCollected', () => {
    scoreIncrease(fId, user);
    keystone.x = Math.floor(Math.random() * 700 * 2) + 50;
    keystone.y = Math.floor(Math.random() * 500 * 2) + 50;
    io.emit('keystoneLocation', keystone);
  });
  socket.on('keystoneCollectedtwo', () => {
    scoreIncrease(fId, user);
    keystonetwo.x = Math.floor(Math.random() * 600 * 3) + 50;
    keystonetwo.y = Math.floor(Math.random() * 400 * 3) + 50;
    io.emit('keystoneLocationtwo', keystonetwo);
  });

  socket.on('lasershot', (data) => {
    if (players[socket.id] !== undefined) {
      serverlasers.push(data);
    }
  });

  socket.on('leaderboarddata', (data) => {
    console.log(data);
  });
});

let emitLaserloc = (payload) => {
  io.emit('laser-locationchange', payload);
};
emitLaserloc = throttle(emitLaserloc, 25);

/* Got help on how to simulate bullets serverside from this link https://code.tutsplus.com/tutorials/create-a-multiplayer-pirate-shooter-game-in-your-browser--cms-23311 */
setInterval(() => {
  serverlasers.forEach((item, index) => {
    const speedX = Math.cos(item.rotation + Math.PI / 2) * item.laser_speed;
    const speedY = Math.sin(item.rotation + Math.PI / 2) * item.laser_speed;
    item.x += speedX;
    item.y += speedY;
    Object.keys(players).forEach((key) => {
      if (item.shotfrom !== key) {
        if ((Math.hypot(players[key].x - item.x, players[key].y - item.y)) <= 30) {
          io.emit('hit', {
            playerId: players[key].playerId, laserId: item.laserId, shooter_team: item.shooter_team, laser_damage: item.laser_damage,
          });
        }
      }
    });
    if ((Math.hypot(item.x - item.initial_x, item.y - item.initial_y)) >= 500) {
      serverlasers.splice(index, 1);
    }
  });
  emitLaserloc(serverlasers);
}, 20);

let time = 180;
let gamerestartin = 10;
let interval = null;
function startTimer(f, t) {
  interval = setInterval(f, t);
}

function stopTimer() {
  clearInterval(interval);
}

const tick = () => {
  time -= 1;
  io.emit('tick', time);
  if (time <= 0) {
    stopTimer(interval);
    time = 180;
    // Clear chat at the end of each round
    ChatMessages.clearChat().then((result) => {
      console.log('chat cleared');
      pushChatMessages();
    }).catch((error) => {
      console.log('error');
    });
    if (scores.red > scores.blue) {
      io.emit('gameover', { text: `Red won ${scores.red}:${scores.blue} `, winner: 'red' });
    } else if (scores.red === scores.blue) {
      io.emit('gameover', { text: `Draw ${scores.red}:${scores.blue}`, winner: 'draw' });
    } else {
      io.emit('gameover', { text: `Blue won ${scores.blue}:${scores.red}`, winner: 'blue' });
    }
    // eslint-disable-next-line no-use-before-define
    startTimer(gamerestart, 1000);
  }
};

const gamerestart = () => {
  gamerestartin -= 1;
  io.emit('restarttick', gamerestartin);
  if (gamerestartin < 1) {
    stopTimer(interval);
    gamerestartin = 10;
    io.emit('restart', { c: 1 });
    scores.blue = 0;
    scores.red = 0;
    io.emit('scoreUpdate', scores);
    startTimer(tick, 1000);
  }
};

startTimer(tick, 1000);
// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
server.listen(port);

console.log(`listening on: ${port}`);
