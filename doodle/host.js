const canvasWidth = 1920;
const canvasHeight = 1080;
var canvasDiv = document.getElementById('canvas-div');
//Create Guesses Pane
var wordList;
var scoreList;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();

/** Game initilaization **/
var mode = "game";
var players = parent.getPlayers();
console.log(players);
var settings = parent.getSettings();
var numPlayers = Object.keys(players).length;
var current = "";
var word = "";
words = words.split("\n");
var scores = {};
var winner = false;
var totalRounds = 3;
var round = 1;
var timeLimit = 60;
var time = 0;
var timer;
var bar;
var playerList = Object.keys(players);

parent.addReceiver(receive);

window.onload = () => {
    //drawTitle();
    startGame();
    parent.addDisconnectListener(playerDisconnect);
    resize();
}

$(window).resize(resize);

function startGame() {
    drawCanvas();
    wordList = document.getElementById('guesses');
    scoreList = document.getElementById("scores");

    if (settings['rounds'])
        totalRounds = settings['rounds'];
    if (settings['time'])
        timeLimit = settings['time'];
    // bar = document.getElementById('progBar');
    // bar.setAttribute('aria-valuemax', timeLimit);
    // bar.setAttribute('aria-valuenow', 0);
    // bar.style.width = '0%';

    current = playerList[Math.floor(numPlayers * Math.random())];
    getWord();
    parent.send(current, ["you", word]);

    var elem = document.createElement("li");
    elem.classList.add("list-group-item");
    var player = players[current];
    elem.innerHTML = player + " is drawing...";
    wordList.appendChild(elem);

    for (let player of Object.keys(players)) {
        scores[player] = 0;
        if (player != current)
            parent.send(player, "new round");
    }
    timer = setInterval(updateTimer, 1000);
    drawTime(time);
    redraw();
}


function getWord() {
    word = words[Math.floor(words.length * Math.random())];
}

function checkGuess(guess) {
    return word.toLowerCase() == guess.toLowerCase();
}

function nextRound(playerDisconnect = false, player = "") {
    round++;
    if (round > totalRounds) {
        mode = "done";
        drawFinal();
        parent.sendToAll("new round");
    } else {
        if (playerDisconnect) {
            document.getElementById("continue").innerHTML = player + " disconnected";
            setTimeout(() => document.getElementById("continue").innerHTML = "", 5000);
        } else {
            document.getElementById("continue").innerHTML = "";
        }
        mode = "game";
        time = 0;
        if (winner)
            current = winner;
        else
            current = playerList[Math.floor(numPlayers * Math.random())];
        clickX = new Array();
        clickY = new Array();
        clickDrag = new Array();
        wordList.innerHTML = "";
        getWord();
        clearCanvas();
        console.log(current);
        parent.send(current, ["you", word]);
        var elem = document.createElement("li");
        elem.classList.add("list-group-item");
        var player = players[current];
        elem.innerHTML = player + " is drawing...";
        wordList.appendChild(elem);

        for (let player of Object.keys(players)) {
            if (player != current)
                parent.send(player, "new round");
        }
        parent.sendSync();
        drawTime(time);
        timer = setInterval(updateTimer, 1000);
        redraw();
    }
}

/** Event handlers **/
function playerDisconnect(player) {
    console.log(player + " disconnect");
    clearInterval(timer);
    var disconnectedPlayer = players[player];
    delete scores[player];
    delete players[player];
    playerList = Object.keys(players);
    numPlayers--;
    round--;
    winner = false;
    nextRound(true, disconnectedPlayer);
    if (numPlayers < 2)
        parent.redirectToLobby("Too many players have disconnected. Please start a new game.");
}

function receive(playerNum, content) {
    if (mode == "done" || mode == "roundOver") return;
    console.log(playerNum, content);
    if (playerNum == current) {
        if (content == "clear") {
            clickX = new Array();
            clickY = new Array();
            clickDrag = new Array();
            clearCanvas();
            return;
        }
        clickX.push(content[0]);
        clickY.push(content[1]);
        clickDrag.push(content[2]);
    } else {
        receiveGuess(playerNum, content);
    }
    redraw();
}

function receiveGuess(playerNum, content) {
    if (mode != "game") return;
    if (!(typeof content === "string" || content instanceof String)) return;
    var elem = document.createElement("li");
    elem.classList.add("list-group-item");
    var player = players[playerNum];
    elem.innerHTML = player + " guessed " + content;
    wordList.appendChild(elem);
    if (checkGuess(content)) {
        mode = "roundOver";
        winner = playerNum;
        scores[winner] += 1;
        clearInterval(timer);
        redraw();
    }
}

function updateTimer() {
    time++;
    if (time > timeLimit) {
        mode = "roundOver";
        winner = false;
        clearInterval(timer);
        redraw();
    } else {
        drawTime(time);
    }
}

/** drawing **/
function redraw() {
    if (mode == "game") {
        var i = clickX.length - 1;
        context.beginPath();
        if (clickDrag[i]) {
            context.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            context.moveTo(clickX[i] - 1, clickY[i]);
        }
        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();
    } else if (mode == "roundOver") {
        var winnerName = "Nobody";
        if (winner)
            winnerName = players[winner];
        if (!$.trim($("#continue").html())) {
            $('#continue').append("<h4 class='mr-3'>" + winnerName +
                " wins! The word was '" + word + "'</h4>" +
                "<button class='btn btn-primary' onclick='nextRound()'>Continue</button>");
        }
    }
    drawScores();
}

function clearCanvas() {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
}

function drawTime(time) {
    bar.animate((timeLimit - time)/ timeLimit);
}

function drawFinal() {
    var contentDiv = document.getElementById("content-div");
    contentDiv.innerHTML = "";
    contentDiv.appendChild(scoreList);
    scoreList = document.getElementById("scores");
    drawScores();
    var scoreHeader = document.getElementById("score-header");
    scoreHeader.innerHTML = "Final " + scoreHeader.innerHTML;
}

function drawScores() {
    scoreList.innerHTML = `<h4 id="score-header" class="mr-3">Scores</h4>`;
    for (let player of Object.keys(scores).sort(function(a, b) { return scores[b] - scores[a] })) {
        var div = document.createElement('div');
        div.classList.add("p-2", "text-center");
        div.innerHTML = `
            <p class="mb-0">` + players[player] + `</p>` +
            `<h4 class="my-text-primary mb-0">` + scores[player] + `</h4>`;
        scoreList.appendChild(div);
    }
}

function drawTitle() {
    canvasDiv.innerHTML = `
        <hi>Doodle&amp;Noodle</h1>
        <button onclick="startGame()">Start</button>`;
}

function drawCanvas() {
    bar = new ProgressBar.Circle(hellosir, {
        color: '#aaa',
        // This has to be the same size as the maximum width to
        // prevent clipping
        strokeWidth: 4,
        trailWidth: 1,
        easing: 'easeInOut',
        duration: 1400,
        text: {
            autoStyleContainer: false
        },
        from: { color: '#00ff00', width: 4 },
        to: { color: '#0000ff', width: 3 },
        // Set default step function for all animate calls
        step: function(state, circle) {
            circle.path.setAttribute('stroke', state.color);
            circle.path.setAttribute('stroke-width', state.width);

            var value = Math.round(circle.value() * timeLimit);
            if (value === 0) {
                circle.setText('');
            } else {
                circle.setText(value);
            }

        }
    });
    bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
    bar.text.style.fontSize = '2rem';
    //Create Canvas with IE Support
    canvas = document.createElement('canvas');
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', canvasHeight);
    canvas.setAttribute('id', 'canvas');
    canvas.classList.add('rounded-left', 'p-3');
    canvasDiv.appendChild(canvas);
    if (typeof G_vmlCanvasManager != 'undefined') {
        canvas = G_vmlCanvasManager.initElement(canvas);
    }
    context = canvas.getContext("2d");

    context.strokeStyle = "#0000ff";
    context.lineJoin = "round";
    context.lineWidth = 5;
}

let widthTrim = 32;
let heightTrim = 64;

function resize() {
    var canvasElem = document.getElementById("canvas");
    var sideBar = document.getElementById("sidebar");
    if (canvasElem === null) return;
    let width = window.innerWidth - sideBar.offsetWidth - widthTrim;
    let height = window.innerHeight - document.getElementById("statusbar").offsetHeight -
        document.getElementById("scores").offsetHeight - heightTrim;
    let scale = Math.min(width / canvasWidth, height / canvasHeight);
    canvasElem.style.width = scale * canvasWidth + 'px';
    canvasElem.style.height = scale * canvasHeight + 'px';
    document.getElementById("main-div").style.height = scale * canvasHeight + 'px';
    sideBar.style.height = scale * canvasHeight + 'px';
}

// progressbar.js@1.0.0 version is used
// Docs: http://progressbarjs.readthedocs.org/en/1.0.0/
