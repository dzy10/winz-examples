const threshold = 1;

var oldX;
var oldY;
var newX;
var newY;

$('body').on('touchstart', function(e) {
    oldX = e.targetTouches[0].pageX
    oldY = e.targetTouches[0].pageY
});

$('body').on('touchmove', function(e) {
    newX = e.targetTouches[0].pageX;
    newY = e.targetTouches[0].pageY;
    let dx = newX - oldX;
    let dy = newY - oldY;
    oldX = newX;
    oldY = newY;
    let r = Math.sqrt(dx * dx + dy * dy);
    if (r < threshold) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx < 0)
            parent.send(Phaser.LEFT);
        else
            parent.send(Phaser.RIGHT);
    } else {
        if (dy < 0)
            parent.send(Phaser.UP);
        else
            parent.send(Phaser.DOWN);
    }

});

document.addEventListener('keydown', function(e) {
    switch (e.keyCode) {
        case 37:
            parent.send(Phaser.LEFT);
            break;
        case 38:
            parent.send(Phaser.UP);
            break;
        case 39:
            parent.send(Phaser.RIGHT);
            break;
        case 40:
            parent.send(Phaser.DOWN);
            break;
    }
});
