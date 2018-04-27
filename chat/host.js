parent.addReceiver(receive);

var users = parent.getPlayers();

function receive(userNum, message) {
    var elem = document.getElementById("items");
    elem.innerHTML += "<li class=>" + message +
        " - " + users[userNum] + "</li>\n";
}
