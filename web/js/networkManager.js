///////////////////////////////////////////////////////////////////////////
/////////////////////////// Network Manager ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

var NetworkManager = {};

NetworkManager.socket = null;

//Make the connection call

NetworkManager.connect = (function(host) {
    if ('WebSocket' in window) {
        NetworkManager.socket = new WebSocket(host);
    } else if ('MozWebSocket' in window) {
        NetworkManager.socket = new MozWebSocket(host);
    } else {

        //Web sockets aren't supported. Time to quit

        return;
    }

    NetworkManager.socket.onopen = function () {
        document.getElementById('chatBox').onkeydown = function(event) {
            if (event.keyCode == 13) {
                NetworkManager.sendMessage(document.getElementById('chatBox').value);
            }
        };
    };

    NetworkManager.socket.onclose = function () {

        //Clean up if our connection to the server dies

        document.getElementById('chatBox').onkeydown = null;
    };

    NetworkManager.socket.onmessage = function (message) {

        //Process message.data

        document.getElementById('chatText').innerHTML = message.data;

    };
});

//Connect our websocket on the right protocol

NetworkManager.initialize = function() {
    if (window.location.protocol == 'http:') {

        // Plug the user in to the correct WebSocket, and include the data we used to specify the project

        NetworkManager.connect('ws://' + window.location.host + '/chatbox/chat' + window.location.search);
    } else {
        NetworkManager.connect('wss://' + window.location.host + '/chatbox/chat' + window.location.search);
    }
};

//Manage raw message sending

NetworkManager.sendMessage = function(message) {
    if (message != '') {
        NetworkManager.socket.send(message);
    }
};

NetworkManager.initialize();
