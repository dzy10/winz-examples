var game = new Phaser.Game(448, 496, Phaser.AUTO);
var players = parent.getPlayers();
var state;

function run() {
    console.log("run");
    game.paused = false;
    const colors = [0x00ffda, 0xffb13d, 0xffb1da, 0xff0000];

    // var players = {'1':'a','2':'b','3':'c'};
    var playerList = Object.keys(players);
    var first = Math.floor(Math.random() * playerList.length);

    // create player color key
    let colorList = document.getElementById("colors");
    colorList.innerHTML = `<h4 id="player-header" class="my-4 mr-3">Players</h4>`;
    for (i = 0; i < playerList.length; i++) {
        var colorString = colors[i].toString(16);
        if (colorString.length < 6)
            colorString = "0".repeat(6 - colorString.length) + colorString;
        var div = document.createElement('div');
        div.classList.add("p-2", "text-center");
        div.innerHTML =  `
            <p class="mb-0">` + players[playerList[i]] + `</p>` +
            `<h4 class="mb-0" style="width:16px;height:16px;background:#` +
            colorString + `"></h4>`;
        colorList.appendChild(div);
    }

    let scoreList = document.getElementById("scores");
    scoreList.innerHTML = "";

    if (document.getElementsByTagName("canvas").length > 0) {
        document.getElementsByTagName("canvas")[0].style.display = "block";
    }

    var pacmen = new Array(playerList.length).fill(null);
    var ghosts = new Array(playerList.length).fill(null);
    var ghostCount = 1;

    var startTime;

    // Game object adapted from official Phaser tutorial at https://phaser.io/tutorials/coding-tips-005
    class Game {
        constructor(game) {
            this.game = game;
            this.map = null;
            this.layer = null;

            this.safetile = 14;
            this.gridsize = 16;

        }

        init() {

            this.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
            this.scale.pageAlignHorizontally = true;
            this.scale.setResizeCallback((scale, parentBounds) => {
                let availableHeight = window.innerHeight - colorList.offsetHeight;
                let availableWidth = window.innerWidth;
                let heightScaleFactor = availableHeight / game.height;
                let widthScaleFactor = availableWidth / game.width;
                let scaleFactor = Math.min(heightScaleFactor, widthScaleFactor);
                scale.setUserScale(scaleFactor, scaleFactor, 0, 25);
            }, this);

            Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

            this.physics.startSystem(Phaser.Physics.ARCADE);

        }

        preload() {
            this.load.image('pill', 'assets/pill16.png');
            this.load.image('tiles', 'assets/pacman-tiles.png');
            this.load.spritesheet('pacman', 'assets/pacman.png', 32, 32);
            this.load.spritesheet('ghosts', 'assets/ghosts32.png', 32, 32);
            this.load.tilemap('map', 'assets/pacman-map.json', null, Phaser.Tilemap.TILED_JSON);

            //  Needless to say, graphics (C)opyright Namco
        }

        create() {

            this.map = this.add.tilemap('map');
            this.map.addTilesetImage('pacman-tiles', 'tiles');

            this.layer = this.map.createLayer('Pacman');

            this.dots = this.add.physicsGroup();
            this.map.createFromTiles(7, this.safetile, 'pill', this.layer, this.dots);

            //  Pacman should collide with everything except the safe tile
            this.map.setCollisionByExclusion([this.safetile], true, this.layer);
            this.cursors = this.input.keyboard.createCursorKeys();

            startTime = Date.now();
            // create first ghost
            this.createGhost(first, 0);
            // create players
            for (i = 0; i < playerList.length; i++) {
                if (i != first)
                    this.createPacman(i, startTime);
            }

        }

        update() {
            var frighten = false;
            for (i = 0; i < pacmen.length; i++) {
                if (pacmen[i] != null) {
                    let pacman = pacmen[i];
                    pacman.update();
                    if (this.physics.arcade.overlap(pacman.sprite, this.dots, pacman.eatDot, null, this)) {
                        frighten = true;
                    }
                }
            }
            for (let ghost of ghosts) {
                if (ghost == null) continue;
                ghost.update();
                if (frighten || ghost.frightened) {
                    ghost.frighten();
                    continue;
                }
                for (i = 0; i < pacmen.length; i++) {
                    let pacman = pacmen[i];
                    if (pacman == null) continue;
                    if (this.game.physics.arcade.overlap(ghost.sprite, pacman.sprite))
                        this.makeGhost(i, Date.now());
                    pacman.update();
                }
            }

            if (ghostCount == playerList.length) {
                endGame();
                game.paused = true;
            }
        }

        createGhost(index, time) {
            var ghost = this.game.add.sprite((14 * 16) + 8, (14 * 16) + 8, 'ghosts', index * 4);
            ghost.anchor.set(0.5);
            ghost.animations.add(Phaser.LEFT, [index * 4], 0, false);
            ghost.animations.add(Phaser.UP, [index * 4 + 1], 0, false);
            ghost.animations.add(Phaser.DOWN, [index * 4 + 2], 0, false);
            ghost.animations.add(Phaser.RIGHT, [index * 4 + 3], 0, false);
            ghost.animations.add("frightened", [16, 17], 10, true);
            ghost.play(Phaser.NONE);
            this.game.physics.arcade.enable(ghost);
            ghost.body.setSize(16, 16, 0, 0);
            ghosts[index] = new Ghost(this, index, ghost, time);
        }

        createPacman(index, time) {
            //  Position Pacman at grid location 14x17 (the +8 accounts for his anchor)
            var pacman = this.add.sprite(((11 + 2 * index) * 16) + 8, (17 * 16) + 8, 'pacman', 0);
            pacman.anchor.set(0.5);
            pacman.animations.add('munch', [0, 1, 2, 1], 20, true);
            this.game.physics.arcade.enable(pacman);
            pacman.body.setSize(16, 16, 0, 0);

            pacman.play('munch');
            pacmen[index] = new Pacman(this, index, pacman, time, colors[index]);
        }

        makeGhost(index, time) {
            ghostCount++;
            let pacman = pacmen[index];
            pacmen[index] = null;
            this.createGhost(index, time - pacman.time); // time for ghosts is how long they survived
            pacman.sprite.destroy();
        }

    };

    class Character {
        constructor(game, id, sprite, time) {
            this.game = game;
            this.id = id;

            this.marker = new Phaser.Point();
            this.turnPoint = new Phaser.Point();

            this.directions = [ null, null, null, null, null ];
            this.opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];

            this.current = Phaser.NONE;
            this.turning = Phaser.NONE;
            this.sprite = sprite;

            this.speed = 150;
            this.threshold = 3;
            this.time = time;
        }

        checkKeys() {
            if (this.game.cursors.left.isDown && this.current !== Phaser.LEFT)
            {
                this.checkDirection(Phaser.LEFT);
            }
            else if (this.game.cursors.right.isDown && this.current !== Phaser.RIGHT)
            {
                this.checkDirection(Phaser.RIGHT);
            }
            else if (this.game.cursors.up.isDown && this.current !== Phaser.UP)
            {
                this.checkDirection(Phaser.UP);
            }
            else if (this.game.cursors.down.isDown && this.current !== Phaser.DOWN)
            {
                this.checkDirection(Phaser.DOWN);
            }
            else
            {
                //  This forces them to hold the key down to turn the corner
                this.turning = Phaser.NONE;
            }

        }

        checkDirection(turnTo) {
            console.log(turnTo);
            if (this.turning === turnTo || this.directions[turnTo] === null || this.directions[turnTo].index !== this.game.safetile)
            {
                //  Invalid direction if they're already set to turn that way
                //  Or there is no tile there, or the tile isn't index 1 (a floor tile)
                return;
            }

            //  Check if they want to turn around and can
            if (this.current === this.opposites[turnTo])
            {
                this.move(turnTo);
            }
            else
            {
                this.turning = turnTo;

                this.turnPoint.x = (this.marker.x * this.game.gridsize) + (this.game.gridsize / 2);
                this.turnPoint.y = (this.marker.y * this.game.gridsize) + (this.game.gridsize / 2);
            }

        }

        turn() {

            var cx = Math.floor(this.sprite.x);
            var cy = Math.floor(this.sprite.y);

            //  This needs a threshold, because at high speeds you can't turn because the coordinates skip past
            if (!this.game.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.game.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold))
            {
                return false;
            }

            //  Grid align before turning
            this.sprite.x = this.turnPoint.x;
            this.sprite.y = this.turnPoint.y;

            this.sprite.body.reset(this.turnPoint.x, this.turnPoint.y);

            this.move(this.turning);

            this.turning = Phaser.NONE;

            return true;

        }

        update() {

            this.game.physics.arcade.collide(this.sprite, this.game.layer);

            this.marker.x = this.game.math.snapToFloor(Math.floor(this.sprite.x), this.game.gridsize) / this.game.gridsize;
            this.marker.y = this.game.math.snapToFloor(Math.floor(this.sprite.y), this.game.gridsize) / this.game.gridsize;

            //  Update our grid sensors
            this.directions[1] = this.game.map.getTileLeft(this.game.layer.index, this.marker.x, this.marker.y);
            this.directions[2] = this.game.map.getTileRight(this.game.layer.index, this.marker.x, this.marker.y);
            this.directions[3] = this.game.map.getTileAbove(this.game.layer.index, this.marker.x, this.marker.y);
            this.directions[4] = this.game.map.getTileBelow(this.game.layer.index, this.marker.x, this.marker.y);
            if (this.marker.y == 14 && (this.marker.x <= 1 || this.marker.x >= 27)) {
                for (i = 0; i < this.directions.length; i++) {
                    if (i != this.current && i != this.opposites[this.turning]) {
                        this.directions[i] = null;
                    } else {
                        this.directions[i] = this.game.map.getTileBelow(this.game.layer.index, 1, 0);
                    }
                }
            }

            // this.checkKeys();

            if (this.turning !== Phaser.NONE)
            {
                this.turn();
            }
            // wrap around in middle row
            var cx = Math.floor(this.sprite.x);
            if (cx < 0)
                this.sprite.x = 448;
            else if (cx > 448)
                this.sprite.x = 0;
        }
    }

    class Pacman extends Character {
        constructor(game, id, sprite, time, color) {
            super(game, id, sprite, time);
            this.color = color;
            this.sprite.tint = 0;
            this.sprite.tint += color;
        }

        move(direction) {
            var speed = this.speed;

            if (direction === Phaser.LEFT || direction === Phaser.UP) {
                speed = -speed;
            }

            if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
                this.sprite.body.velocity.x = speed;
            } else {
                this.sprite.body.velocity.y = speed;
            }

            //  Reset the scale and angle (Pacman is facing to the right in the sprite sheet)
            this.sprite.scale.x = 1;
            this.sprite.angle = 0;

            if (direction === Phaser.LEFT) {
                this.sprite.scale.x = -1;
            } else if (direction === Phaser.UP) {
                this.sprite.angle = 270;
            } else if (direction === Phaser.DOWN) {
                this.sprite.angle = 90;
            }

            this.current = direction;
        }

        eatDot(pacman, dot) {
            dot.kill();
            setTimeout(() => dot.revive(), 15000);
        }
    }


    class Ghost extends Character {
        constructor(game, id, sprite, time) {
            super(game, id, sprite, time);
            this.frightened = false;
        }

        move(direction) {
            var speed = this.speed;

            if (direction === Phaser.LEFT || direction === Phaser.UP)
            {
                speed = -speed;
            }

            if (direction === Phaser.LEFT || direction === Phaser.RIGHT)
            {
                this.sprite.body.velocity.x = speed;
            }
            else
            {
                this.sprite.body.velocity.y = speed;
            }

            this.current = direction;
        }

        update() {
            super.update();
            if (!this.frightened)
                this.sprite.animations.play(this.current);
        }

        frighten() {
            this.frightened = true;
            this.speed /= 2;
            this.sprite.play("frightened");
            setTimeout(() => {
                this.frightened = false;
                this.speed *= 2;
            }, 5000);
        }
    }

    state = new Game(game);
    game.state.add('Game', state, true);

    function endGame() {
        parent.clearListeners();
        document.getElementsByTagName("canvas")[0].style.display = "none";
        scoreList.innerHTML = `<h3 id="score-header" class="my-4">Game Results</h3>`;
        ghosts = ghosts.sort(function(a,b){return b.time - a.time});
        ghosts.pop();
        for (let ghost of ghosts) {
            let date = new Date(ghost.time);
            var div = document.createElement('div');
            div.classList.add("p-2", "text-center");
            div.innerHTML =  `
                <p class="mb-0">` + players[playerList[ghost.id]] + `</p>` +
                `<h4 class="mb-0">` + date.getMinutes() + ':' +
                date.getSeconds() + '.' + date.getMilliseconds() + `</h4>`;
            scoreList.appendChild(div);
        }
        scoreList.innerHTML += `<button class="mt-5 btn btn-md btn-dark" onclick="run();">Play Again</button>`;
        game.state.remove(state);
    }

    parent.addReceiver(function (playerNum, message) {
        let i = playerList.indexOf(playerNum);
        var character;
        if (ghosts[i] != null) character = ghosts[i];
        else character = pacmen[i];
        character.checkDirection(message);
    });
}

parent.addDisconnectListener(function(num) {
    console.log('disconnect redirect');
    parent.redirectToLobby("One or more players disconnected. Please start a new game");
});

run();
