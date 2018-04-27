const colors = ['#e6194b', '#0082c8', '#3cb44b', '#ffe119', '#f58231',
                '#911eb4', '#46f0f0', '#f032e6', '#d2f53c', '#fabebe',
                '#008080', '#e6beff', '#aa6e28', '#fffac8', '#800000',
                '#aaffc3', '#808000', '#ffd8b1', '#000080', '#808080'];


const settings = parent.getSettings();
var MAX_PARTICLES = 100;
if (settings['dots'])
    MAX_PARTICLES = settings['dots'];

function run() {
    var players = parent.getPlayers();
    var playerList = Object.keys(players);
    var numPlayers = playerList.length;
    for (let i = 0; i < playerList.length; i++) {
        parent.send(playerList[i], [i, playerList.length]);
    }
    var emitters = new Array();
    // create player color key
    const colorList = document.getElementById("colors");
    colorList.innerHTML = `<h4 id="player-header" class="my-4 mr-3">Players</h4>`;
    for (i = 0; i < playerList.length; i++) {
        var colorString = colors[i];
        var div = document.createElement('div');
        div.classList.add("p-2", "text-center");
        div.innerHTML =  `
            <p class="mb-0">` + players[playerList[i]] + `</p>` +
            `<h4 class="mb-0" style="width:16px;height:16px;background:` +
            colorString + `"></h4>`;
        colorList.appendChild(div);
    }

    const mainDiv = document.getElementById('main-div');
    if (document.getElementsByTagName('button')[0] != null)
        mainDiv.removeChild(document.getElementsByTagName('button')[0]);

    const canvas = document.getElementById("canvas");
    const trim = 64;

    canvas.width = window.innerWidth - trim;
    canvas.height = window.innerHeight - colorList.offsetHeight - trim;
    var context = canvas.getContext('2d');
    var proton = new Proton();
    const dotsPerPlayer = Math.floor(MAX_PARTICLES / playerList.length);

    var playerDisconnect = false;

    const R = canvas.height / 3;
    for (let i = 0; i < playerList.length; i++) {
        const angle = 2 * Math.PI * i / playerList.length + Math.PI / 2;
        const cx = canvas.width / 2 + R * Math.cos(angle);
        const cy = canvas.height / 2 - R * Math.sin(angle);
        createProton(cx, cy, colors[i]);
    }

    // Code adapted from Proton examples at https://a-jie.github.io/Proton/
    tick();

    function createProton(cx, cy, color) {
        var emitter = new Proton.Emitter();
        emitter.damping = 0.01;
        emitter.rate = new Proton.Rate(dotsPerPlayer);

        emitter.addInitialize(new Proton.Mass(1));
        emitter.addInitialize(new Proton.Radius(5));
        emitter.addInitialize(new Proton.Velocity(new Proton.Span(1.5), new Proton.Span(0, 360), 'polar'));

        var mouseObj = {
            x: cx,
            y: cy,
        }

        var attractionBehaviour = new Proton.Attraction(mouseObj, 0, 0);
        emitter.addBehaviour(new Proton.Color(color));
        emitter.addBehaviour(attractionBehaviour);
        emitter.addBehaviour(new Proton.RandomDrift(10, 10, .01));

        emitter.p.x = cx;
        emitter.p.y = cy;
        emitter.emit('once');

        proton.addEmitter(emitter);
        proton.addRenderer(createRenderer());
        attractionBehaviour.reset(mouseObj, 10, 1200);
        emitter.dots = dotsPerPlayer;
        emitter.originalX = cx;
        emitter.originalY = cy;
        emitters.push(emitter);
        console.log(emitter);
    }

    function createRenderer() {
        var renderer = new Proton.CanvasRenderer(canvas);
        renderer.onProtonUpdate = function() {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
        };

        return renderer;
    }

    function tick() {
        requestAnimationFrame(tick);
        proton.update();
    }

    let oldTgt = -1;
    function stealDot(src, tgt) {
        if (playerDisconnect) {
            playerDisconnect = false;
            for (let i = 0; i < emitters.length; i++) {
                if (emitters[i] == null) continue;
                const emitter = emitters[i];
                emitter.p.x = emitter.originalX;
                emitter.p.y = emitter.originalY;
            }
        }
        const oldEmitter = emitters[oldTgt];
        if (oldTgt != -1 && oldEmitter != null) {
            oldEmitter.p.x = oldEmitter.originalX;
            oldEmitter.p.y = oldEmitter.originalY;
        }
        const srcEmitter = emitters[src];
        const tgtEmitter = emitters[tgt];
        console.log(srcEmitter);
        console.log(tgtEmitter);
        if (srcEmitter == null || srcEmitter.dots <= 0
                || tgtEmitter == null || tgtEmitter.dots <= 0)
            return;
        srcEmitter.particles.pop();
        srcEmitter.dots--;
        tgtEmitter.rate.numPan.a = 1;
        tgtEmitter.rate.numPan.b = 1;
        tgtEmitter.p.x = srcEmitter.p.x;
        tgtEmitter.p.y = srcEmitter.p.y;
        tgtEmitter.dots++;
        tgtEmitter.emit('once');
        oldTgt = tgt;
        checkForWinner();
    }

    function checkForWinner() {
        console.log(emitters);
        let alive = 0;
        let winner = -1;
        for (let i = 0; i < emitters.length; i++) {
            if (emitters[i] == null) continue;
            else if (emitters[i].dots <= 0) {
                emitters[i] == null;
            } else {
                alive++;
                winner = i;
            }
        }
        if (alive == 1)
            drawFinal(winner);
    }

    function drawFinal(i) {
        parent.clearListeners();
        colorList.innerHTML = `<h4 id="player-header" class="my-4 mr-3">` +
            players[playerList[i]] + ` Wins!</h4>`;
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-md', 'btn-dark');
        button.onclick = run;
        button.innerHTML = 'Play Again';
        document.getElementById('main-div').appendChild(button);
    }

    parent.addReceiver((num, id) => {
        let i = playerList.indexOf(num);
        stealDot(id, i);
    });

    parent.addDisconnectListener((num) => {
        numPlayers--;
        if (numPlayers < 2)
            parent.redirectToLobby("Too many players have disconnected. Please start a new game.");
        let i = playerList.indexOf(num);
        if (emitters[i] == null || emitters[i].dots <= 0) return;
        emitters[i].removeAllParticles();
        const alive = emitters.filter(e => e != emitters[i] && e != null && e.dots > 0);
        let dotsPer = Math.floor(emitters[i].dots / alive.length);
        for (let emitter of alive) {
            emitter.p.x = emitters[i].originalX;
            emitter.p.y = emitters[i].originalY;
            emitter.rate.numPan.a = dotsPer;
            emitter.rate.numPan.b = dotsPer;
            emitter.dots += dotsPer;
            emitter.emit('once');
        }
        emitters[i] = null;
        playerDisconnect = true;
    });
}

run();
