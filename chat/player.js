function sendItem() {
    var elem = document.getElementById("item");
    var text = elem.value;
    elem.value = '';
    parent.send(text);
}
