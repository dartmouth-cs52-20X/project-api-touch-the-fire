# Touch the Fire
![Team Photo](https://i.imgur.com/VrUfsHW.png)

Touch the Fire is a WASD multiplayer game with two teams of 3 players. The goal of each team is to touch the fire for longer than the other team.  Each player is able to shoot projectiles to send opponents back to the edges of the map.  The map is scattered with DBA, which can be used to buy a variety of powerups.  Powerups include:
* More bullet damage
* Higher maximum health
* More DBA per hit
* Expanded mini-map

The map also contains Keystone powerups, which provide a little DBA and restore health.

There is a chat so that players can communicate with one another during the game.  A leaderboard page keeps track of players' stats.  These include:
* wins
* DBA collected
* shots fired

The game allows for sign-ups and sign-ins with username, email, and password.  There is also an option to sign-in as a guest.

The game consists of a 3 minute round in which each team attempts to control the fire. The winning team is the one who was touching the fire the longest.

## Game Instructions
Basic Movement:
* Forward: W, Left: A, Right: D, Back: S
Advanced Movement:
* Rotate Left: J, Rotate Right: L, Forward: I, Back: K
Other Controls:
* Shoot: SPACE
* Mute Music: M

## Architecture

* Socket.io
    * Used to communicate between the server and the browser
* Express
    * Used to handle multiple requests server-side
* Webpack
    * Used for compilation
* Phaser.js
    * Library to handle game function
* Combination of MongoDB and Firebase
    * MongoDB used to store the chat data, Firebase used for authentication and storing leaderboard data.

## Setup

This project requires both the code in this repo and the [client repo.](https://github.com/dartmouth-cs52-20X/project-touch-the-fire)

### Client Repo

Find our dev site [here.](http://touch-the-fire.surge.sh/)

The game is hosted locally on port 8080.

- `yarn install`
- `yarn start`

### Server Repo

Find our dev server [here.](https://touch-the-fire-api.herokuapp.com/)

The game is running on the above server.  The chat and queueing features are running on a clone of the same server [here.](https://touchthefirechat.herokuapp.com/)

The server is hosted locally on port 9090.

- `yarn install`
- `yarn dev`

## Deployment

### Client Repo

To push to the dev site, simply push to `origin master`. Travis takes care of the rest.

### Server Repo

The server is hosted through Heroku.

- `git push origin master`

## Gifs

You can find gifs of our site in action in the [home wiki page](https://github.com/dartmouth-cs52-20X/project-touch-the-fire/wiki) of the client repo.

## Authors

* Arjun Miklos
* Bibaswan Khadka
* Devon Chen
* Quinn Spraut
* Scott Stuart
* Suraj Srivats

## Acknowledgments

Thanks to our TAs and Tim for helping out on the project.

We want to thank our mothers in addition to Steve Jobs for the inspiration and love they have given us.

### Testing
In order to test locally, on line 61 of project-touch-the-fire/src/scenes/gamescene.js/, make sure that the socket is pointed towards http://localhost:9090 (which it already is).  Then, you just need to run `yarn start` for the client and `yarn start` for the server.  The site will be running at http://localhost:8080, and the server will be running at http://localhost:9090.
