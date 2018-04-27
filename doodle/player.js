var round1 = true;
var word = "";
var clickX;
var clickY;
var clickDrag;
var drewLast = true;
var width;
var height;

$(window).resize(resize);

const canvasWidth = 1920;
const canvasHeight = 1080;

parent.addReceiver((message) => {
    if (message == "new round") {
        if (!round1) removeCanvas();
        createInput();
        round1 = false;
        drewLast = false;
    } else if (message[0] == "you") {
        if (!round1 && !drewLast) removeInput();
        if (drewLast) removeCanvas();
        word = message[1];
        createCanvas();
        round1 = false;
        drewLast = true;
    }
});

function createCanvas() {
    document.documentElement.classList.remove("my-bg-primary");
    document.body.classList.remove("my-bg-primary");
    //Create Canvas with IE Support
    var canvasDiv = document.getElementById('content-div');
    var wordRow = document.createElement('div');
    wordRow.id = "word-row";
    wordRow.classList.add("rounded-top", "my-bg-primary", "row", "d-flex",
        "align-items-center", "p-2");

    //Create Word To Draw
    var wordText = document.createElement('h3');
    wordText.id='wordText';
    wordText.innerHTML = "Your word: " + word;
    wordText.classList.add("mr-3");
    wordRow.appendChild(wordText);

    //Create clear button
    var button = document.createElement('button');
    button.onclick = () => {
        clickX = new Array();
        clickY = new Array();
        clickDrag = new Array();
        clear();
        parent.send("clear");
    };
    button.innerHTML="Clear";
    button.classList.add("btn", "btn-primary", "btn-lg");
    button.id = 'button';
    wordRow.appendChild(button);

    canvasDiv.appendChild(wordRow);

    var canvasRow = document.createElement('div');
    canvasRow.classList.add("row");

    canvas = document.createElement('canvas');
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', canvasHeight);
    canvas.setAttribute('id', 'canvas');
    canvas.setAttribute('style', 'border:1px solid #DFDFDF;width:100%;height:80%;')
    canvas.classList.add("rounded-bottom");
    canvasRow.appendChild(canvas);
    canvasDiv.appendChild(canvasRow);

    if (typeof G_vmlCanvasManager != 'undefined') {
        canvas = G_vmlCanvasManager.initElement(canvas);
    }
    context = canvas.getContext("2d");
    width = document.getElementById('canvas').offsetWidth;
    height = document.getElementById('canvas').offsetHeight;

    //Methods to help with drawing
    $('#canvas').mousedown(function(e) {
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;

        paint = true;
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
        redraw();
    });

    $('#canvas').mousemove(function(e) {
        if (paint) {
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
            redraw();
        }
    });

    $('#canvas').mouseup(function(e) {
        paint = false;
    });

    $('#canvas').mouseleave(function(e) {
        paint = false;
    });

    $('#canvas').on('touchstart', function(e) {
        var mouseX = e.targetTouches[0].pageX - this.offsetLeft;
        var mouseY = e.targetTouches[0].pageY - this.offsetTop;

        paint = true;
        addClick(e.targetTouches[0].pageX - this.offsetLeft, e.targetTouches[0].pageY - this.offsetTop);
        redraw();
    });

    $('#canvas').on('touchmove', function(e) {
        if (paint) {
            addClick(e.targetTouches[0].pageX - this.offsetLeft, e.targetTouches[0].pageY - this.offsetTop, true);
            redraw();
        }
    });

    $('#canvas').on('touchend', function(e) {
        paint = false;
    });

    clickX = new Array();
    clickY = new Array();
    clickDrag = new Array();
    var paint;

    function addClick(x, y, dragging) {
        x = x / width * canvasWidth;
        y = y / height * canvasHeight;
        clickX.push(x);
        clickY.push(y);
        clickDrag.push(dragging);
        parent.send([x, y, dragging]);
    }

    function redraw() {

        context.strokeStyle = "#df4b26";
        context.lineJoin = "round";
        context.lineWidth = 5;

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
    }

    function clear() {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
    }

    resize();
}

function removeCanvas() {
    var div = document.getElementById('content-div');
    div.innerHTML='';
}

function createInput() {
    document.documentElement.classList.add("my-bg-primary");
    document.body.classList.add("my-bg-primary");
    var canvasDiv = document.getElementById('content-div');
    var wordRow = document.createElement('div');

    wordRow.classList.add("row", "d-flex", "justify-content-center", "mt-3",
        "align-items-start");
    var inp = document.createElement('INPUT');
    inp.setAttribute("type", "text");
    inp.classList.add("p-2", "rounded", "my-text-primary", "h3", "border-0");
    inp.id = "inp";

    wordRow.appendChild(inp);

    var button = document.createElement('button');
    button.onclick = sendGuess;
    button.innerHTML="Guess";
    button.classList.add("btn", "btn-lg", "btn-primary");
    wordRow.appendChild(button);
    button.id = 'button';

    canvasDiv.appendChild(wordRow);

    function sendGuess() {
        var elem = document.getElementById('inp');
        var text = elem.value;
        elem.value = "";
        parent.send(text);
    }
}

function removeInput() {
    var input = document.getElementById('inp');
    input.parentNode.removeChild(input);
    var button = document.getElementById('button');
    button.parentNode.removeChild(button);
}

function resize() {
    var canvasElem = document.getElementById("canvas");
    var wordRow = document.getElementById("word-row");
    if (canvasElem === null) return;
    width = window.innerWidth;
    height = window.innerHeight - wordRow.offsetHeight;
    canvasElem.style.width = width + 'px';
    canvasElem.style.height = height + 'px';
}

resize();
