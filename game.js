//iife - immediately invoked function expression to create a non-global namespace for everything in the game.

;(function() {

  //Constructor function for the game which holds all the main code. Also binds HTML element
  var Game = function (canvasId){
    // Canvas links with the canvas element in HTML, placing the game on the page.
    var canvas = document.getElementById(canvasId);
    // Creates a drawing context, a bundle of functions for drawing on the screen. Also dictates the game is on a 2d playing field.
    var screen = canvas.getContext('2d');
    // Sets the size of the game to match the size of the canvas element on the HTML.
    var gameSize = { x: canvas.width, y: canvas.height };


    //Array of 'bodies' in the game. Player, Invaders, Bullets. Instantiates Player.
    this.bodies = createInvaders(this).concat(new Player(this, gameSize));

    var self = this;
    loadSound("shoot.mp3", function(shootSound) {
      self.shootSound = shootSound;

      //tick will run about 60x/sec. Will be responsible for running all of the main game logic.
      var tick = function () {
        //updates the game status
        self.update();
        //draws the game objects
        self.draw(screen, gameSize);
        //asks the browser to run tick on a loop
        requestAnimationFrame(tick);
      };
      //Calls tick function.
      tick();
    });
  };


Game.prototype = {
  //Update runs and delegates to other update functions
  update: function () {
    var bodies = this.bodies;
    var notCollidingWithAnything = function(b1) {
      return bodies.filter(function(b2) { return colliding(b1, b2); }).length === 0;
    };

    this.bodies = this.bodies.filter(notCollidingWithAnything);

    //call update on all entities.
    for (var i = 0; i < this.bodies.length; i++) {
      this.bodies[i].update();
    }
  },

  //Draws a rectangle for each member of bodies array.
  draw: function(screen, gameSize) {
    //clears the previous drawings from the game on each tick
    screen.clearRect(0, 0, gameSize.x, gameSize.y);
    for (var i = 0; i < this.bodies.length; i++) {
      drawRect(screen, this.bodies[i]);
    }
  },

//populates the body array
  addBody: function(body) {
    this.bodies.push(body);
  },

  invadersBelow: function(invader) {
    return this.bodies.filter(function(b) {
      return b instanceof Invader &&
        b.center.y > invader.center.y &&
        b.center.x - invader.center.x < invader.size.x;
    }).length > 0;
  }
};

//Constructor function for the Player.
var Player = function (game, gameSize) {
  //Saves the game on the Player Constructor.
  this.game = game;
  //Size of the Player
  this.size = { x: 15, y: 15 };
  //Player starts in the middle of the x axis and just a bit up from the bottom.
  this.center = { x: gameSize.x / 2, y: gameSize.y - this.size.x};
  //instantiate the keyboarder
  this.keyboarder = new Keyboarder();
};

//Adds prototype to the player.
Player.prototype = {
  update: function() {
    //If 'left' key is down, move player left at 2px/tick
    if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
      this.center.x -= 2; }
    else if
    //If 'right' key is down, move player right at 2px/tick
     (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
      this.center.x += 2;
    }

    //Shoots bullets when space is down.
    if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
      //Spawns the bullet just above the Player object.
      var bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.x / 2},
        //dictates the velocity of the bullet (straight up at 6 px/tick)
      { x: 0, y: -6 });
      this.game.addBody(bullet);
      this.game.shootSound.load();
      this.game.shootSound.play();
    }
  }
};

var Invader = function (game, center) {
  this.game = game;
  this.size = { x: 15, y: 15 };
  this.center = center;
  this.patrolX = 0;
  this.speedX = 0.3;
};

Invader.prototype = {
  update: function() {
    if (this.patrolX < 0 || this.patrolX > 40) {
      this.speedX = -this.speedX;
    }

    this.center.x += this.speedX;
    this.patrolX += this.speedX;

    if (Math.random() > 0.995 && !this.game.invadersBelow(this)) {
      var bullet = new Bullet({ x: this.center.x, y: this.center.y + this.size.x / 2},
      { x: Math.random() - 0.5, y: 2 });
      this.game.addBody(bullet);
    }
  }
};

var createInvaders = function(game) {
  var invaders = [];
  for (var i=0; i < 24; i++) {
    var x = 30 + (i % 8) * 30;
    var y = 30 + (i % 3) * 30;
    invaders.push(new Invader(game, { x: x, y: y }));
  }

  return invaders;
};

//Constructor function for the bullet
var Bullet = function (center, velocity) {
  this.size = { x: 3, y: 3 };
  this.center = center;
  this.velocity = velocity;
  };

Bullet.prototype = {
  //updates the bullets per tick
  update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
  }
};

var drawRect = function(screen, body) {
  screen.fillRect(body.center.x - body.size.x / 2,
                  body.center.y - body.size.y / 2,
                  body.size.x, body.size.y);
};

//Handles keyboard input
var Keyboarder = function() {
  //records whether key is down or up
  var keyState = {};

//record when keys go down
  window.onkeydown = function(e) {
    keyState[e.keyCode] = true;
  };
  //record when keys go up
  window.onkeyup = function(e) {
    keyState[e.keyCode] = false;
  };
//returns whether the corresponding key code is down.
  this.isDown = function(keyCode) {
    return keyState[keyCode] === true;
  };

//Object of keycode mappings
  this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32}
};

var colliding = function(b1, b2) {
  return !(b1 === b2 ||
    b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
    b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
    b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
    b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2);
};

var loadSound = function(url, callback) {
  var loaded = function() {
    callback(sound);
    sound.removeEventListener('canplaythrough', loaded);
  };

  var sound = new Audio(url);
  sound.addEventListener('canplaythrough', loaded);
  sound.load();
};

//Instantiates the game once the DOM is compiled.
window.onload = function () {
  new Game('screen');
  };
})();
