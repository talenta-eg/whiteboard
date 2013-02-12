var textBox;
var textString;
var socket=null;

var connect = function(host) {
    console.log("Connecting to "+host);
    if('WebSocket' in window){
        socket = new WebSocket(host);
    } else if('MozWebSocket' in window){
        socket = new MozWebSocket(host);
    }
    
    socket.onmessage = function(message){
        var oldLength=textBox.value.length;
        var cursor = textBox.selectionStart;
        var substring1 = textBox.value.substring(0,cursor);
        var cursorEnd = textBox.selectionEnd;
        textBox.value = message.data;
        if(textBox.value.substring(0,cursor)!=substring1){
            var difference = textBox.value.length-oldLength;
            textBox.selectionStart=cursor+difference;
            textBox.selectionEnd=cursorEnd+difference;
        }else{
            textBox.selectionStart=cursor;
            textBox.selectionEnd=cursorEnd;
        }
    };
}
var checkKeyPressed = function(evt){
    if(evt.keyCode === 9) { // tab was pressed
        // get caret position/selection
        var start = textBox.selectionStart;
        var end = textBox.selectionEnd;

        var value = textBox.value;
        // set textarea value to: text before caret + tab + text after caret
        textBox.value=(value.substring(0, start)
                    + "\t"
                    + value.substring(end));

        // put caret at right position again (add one for the tab)
        textBox.selectionStart = textBox.selectionEnd = start + 1;

        // prevent the focus lose
        evt.preventDefault();
    }
}

var UpdateText = function(evt){
    textString=textBox.value;
    socket.send(textString);
}
function onLoad(){
	textBox= document.getElementById("textBox");
    connect('ws://' + window.location.host + '/realtime');
    textBox.addEventListener('keydown',checkKeyPressed);
    textBox.addEventListener('keyup',UpdateText);
    
}

document.addEventListener('DOMContentLoaded',onLoad);



