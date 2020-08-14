module.exports = Object.freeze({
  PLAYER_RADIUS: 20,
  PLAYER_SPEED: 400,

  // Need to decide on scoring metrics --> just a placeholder for now
  SCORE_PER_SECOND: 1,

  MAP_SIZE: 3000,
  MSG_TYPES: {
    JOIN_GAME: 'join_game',
    GAME_UPDATE: 'update',
    INPUT: 'input',
    GAME_OVER: 'dead',
  },
});
