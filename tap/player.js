const colors = ['#e6194b', '#0082c8', '#3cb44b', '#ffe119', '#f58231',
                '#911eb4', '#46f0f0', '#f032e6', '#d2f53c', '#fabebe',
                '#008080', '#e6beff', '#aa6e28', '#fffac8', '#800000',
                '#aaffc3', '#808000', '#ffd8b1', '#000080', '#808080'];
let numPlayers = -1;
let id = -1;
const dropped = new Set();

parent.addReceiver(msg => {
    if (typeof msg != "number") {
        numPlayers = msg[1];
        id = msg[0];
    } else {
        dropped.add(msg);
    }
    createButtons();
});

const size = 64;

function createButtons() {
    console.log(numPlayers, id);
    const contentDiv = document.getElementById('content-div');
    contentDiv.innerHTML = '';
    for (let i = 0; i < numPlayers; i++) {
        if (dropped.has(i) || i == id)  continue;
        var colorString = colors[i];
        var div = document.createElement('div');
        div.classList.add("p-3", "text-center");
        div.innerHTML =  `<div class="mb-0 panel unselectable" style="width:` + size + `px;height:` + size +
            `px;background:` + colorString + `" id="` + i + `"></div>`;
        contentDiv.appendChild(div);
    }
}

$('#content-div').on('mousedown', '.panel', function(e) {
    parent.send(parseInt(e.target.id));
});

