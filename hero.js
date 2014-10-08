'use strict';
/* 

  The only function that is required in this file is the "move" function

  You MUST export the move function, in order for your code to run
  So, at the bottom of this code, keep the line that says:

  module.exports = move;

  The "move" function must return "North", "South", "East", "West", or "Stay"
  (Anything else will be interpreted by the game as "Stay")
  
  The "move" function should accept two arguments that the website will be passing in: 
    - a "gameData" object which holds all information about the current state
      of the battle

    - a "helpers" object, which contains useful helper functions
      - check out the helpers.js file to see what is available to you

    (the details of these objects can be found on javascriptbattle.com/#rules)

  This file contains four example heroes that you can use as is, adapt, or
  take ideas from and implement your own version. Simply uncomment your desired
  hero and see what happens in tomorrow's battle!

  Such is the power of Javascript!!!

*/

//TL;DR: If you are new, just uncomment the 'move' function that you think sounds like fun!
//       (and comment out all the other move functions)


// // The "Northerner"
// // This hero will walk North.  Always.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   return 'North';
// };

// // The "Blind Man"
// // This hero will walk in a random direction each turn.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   var choices = ['North', 'South', 'East', 'West'];
//   return choices[Math.floor(Math.random()*4)];
// };

// // The "Priest"
// // This hero will heal nearby friendly champions.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   if (myHero.health < 60) {
//     return helpers.findNearestHealthWell(gameData);
//   } else {
//     return helpers.findNearestTeamMember(gameData);
//   }
// };

// // The "Unwise Assassin"
// // This hero will attempt to kill the closest enemy hero. No matter what.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   if (myHero.health < 30) {
//     return helpers.findNearestHealthWell(gameData);
//   } else {
//     return helpers.findNearestEnemy(gameData);
//   }
// };

// // The "Careful Assassin"
// // This hero will attempt to kill the closest weaker enemy hero.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   if (myHero.health < 50) {
//     return helpers.findNearestHealthWell(gameData);
//   } else {
//     return helpers.findNearestWeakerEnemy(gameData);
//   }
// };

// // The "Safe Diamond Miner"
/*var move = function(gameData, helpers) {
  var myHero = gameData.activeHero;

  //Get stats on the nearest health well
  var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function(boardTile) {
    if (boardTile.type === 'HealthWell') {
      return true;
    }
  });
  var distanceToHealthWell = healthWellStats.distance;
  var directionToHealthWell = healthWellStats.direction;
  

  if (myHero.health < 40) {
    //Heal no matter what if low health
    return directionToHealthWell;
  } else if (myHero.health < 100 && distanceToHealthWell === 1) {
    //Heal if you aren't full health and are close to a health well already
    return directionToHealthWell;
  } else {
    //If healthy, go capture a diamond mine!
    return helpers.findNearestNonTeamDiamondMine(gameData);
  }
};*/

var dirs = ['North', 'South', 'East', 'West'];
var deltas = [[-1, 0], [1, 0], [0, 1], [0, -1]];
var opposites = [1, 0, 3, 2];

function valid(board, distanceFromTop, distanceFromLeft) {
  return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
}

function around(board, r, c, cb) {
  var delta, x, y;
  for(var di = 0; di < 4; di++) {
    delta = deltas[di];
    x = r + delta[0];
    y = c + delta[1];
    if(valid(board, x, y)) {
      cb(board.tiles[x][y], x, y, di);
    }
  }
}

function pathable(tile) {
  if(tile.type == 'Unoccupied')
    return true;
  return false;
}

function all(board, cb) {
  var i, j, t;
  for(i = 0; i < board.lengthOfSide; i++) {
    for(j = 0; j < board.lengthOfSide; j++) {
      t = board.tiles[i][j];
      cb(t, i, j);
    }
  }
}

var move = function(game, helpers) {
  var me = game.activeHero;
  var i, j, a, t;

  var tl = [];
  for(i = 0; i < game.board.lengthOfSide; i++) {
      a = [];
      for(j = 0; j < game.board.lengthOfSide; j++) {
        a.push('.');
      }
      tl.push(a);
  }

  var queue = [];

  all(game.board, function(t, x, y) {
    if(t.type == 'Hero' && t.team != me.team) {
      tl[x][y] = 0;

      around(game.board, x, y, function(atile, ax, ay) {
        if(pathable(atile) && tl[ax][ay] == '.')
          queue.push([ax, ay]);
      });
    }
  });

  var e = 0;

  while(queue.length) {
    e++;
    var xy = queue.shift();
    var totalthreat = '.';
    around(game.board, xy[0], xy[1], function(atile, ax, ay) {
      var v = tl[ax][ay];
      if(v != '.') {
        if(totalthreat == '.')
           totalthreat = v;
        else
           totalthreat += v;
      }
    });

    if(totalthreat != '.') {
      tl[xy[0]][xy[1]] = totalthreat - 1;
      around(game.board, xy[0], xy[1], function(atile, ax, ay) {
        if(pathable(atile) && tl[ax][ay] == '.') {
          queue.push([ax, ay]);
        }
      });
    }
  }

  //console.log(tl);

  var bestvalue;
  var bestxy;
  var bestdir;

  around(game.board, me.distanceFromTop, me.distanceFromLeft, function(atile, ax, ay, ad) {
    var v = tl[ax][ay];
    if(v != '.') {
      if(!bestxy || v < bestvalue) {
        bestxy = [ax, ay];
        bestvalue = v;
        bestdir = ad;
      }
    }
  });

  if(!bestxy)
    bestdir = Math.floor(Math.random() * 4);

  return dirs[bestdir];
};


// // The "Selfish Diamond Miner"
// // This hero will attempt to capture diamond mines (even those owned by teammates).
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;

//   //Get stats on the nearest health well
//   var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function(boardTile) {
//     if (boardTile.type === 'HealthWell') {
//       return true;
//     }
//   });

//   var distanceToHealthWell = healthWellStats.distance;
//   var directionToHealthWell = healthWellStats.direction;

//   if (myHero.health < 40) {
//     //Heal no matter what if low health
//     return directionToHealthWell;
//   } else if (myHero.health < 100 && distanceToHealthWell === 1) {
//     //Heal if you aren't full health and are close to a health well already
//     return directionToHealthWell;
//   } else {
//     //If healthy, go capture a diamond mine!
//     return helpers.findNearestUnownedDiamondMine(gameData);
//   }
// };

// // The "Coward"
// // This hero will try really hard not to die.
// var move = function(gameData, helpers) {
//   return helpers.findNearestHealthWell(gameData);
// }


// Export the move function here
module.exports = move;
