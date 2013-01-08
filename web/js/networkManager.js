///////////////////////////////////////////////////////////////////////////
/////////////////////////// Network Manager ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

var NetworkManager = {};

NetworkManager.socket = null;
NetworkManager.objects = new Array();

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
                NetworkManager.sendMessage({type:"chat",text:document.getElementById('chatBox').value});
            }
        };
    };

    NetworkManager.socket.onclose = function () {

        //Clean up if our connection to the server dies

        document.getElementById('chatBox').onkeydown = null;
    };

    NetworkManager.socket.onmessage = function (message) {

        //Process message.data

        var messageObj = JSON.parse(message.data); //JSON.parse is not in older browsers, but eval() has security holes

        //Break out behavior based on message content

        if (messageObj.type == "chat") {
            document.getElementById('chatText').innerHTML = "<b>"+messageObj.username+"</b>: "+messageObj.text;
        }
        if (messageObj.type == "todoItemCreated") {
            if (NetworkManager.objects.length < messageObj.id || NetworkManager.objects[messageObj.id] == null) {
                new todoItem(workflowCanvas,todoManager,messageObj.xpos,messageObj.ypos,messageObj.content);
            }
        }
        if (messageObj.type == "itemMoved") {
            NetworkManager.objects[messageObj.id].setPos(messageObj.xpos,messageObj.ypos);
        }
        if (messageObj.type == "itemEdited") {
            NetworkManager.objects[messageObj.id].ignoreNetworkSetText(messageObj.content);
        }
        if (messageObj.type == "itemDeleted") {
            if (NetworkManager.objects[messageObj.id] != null) {
                NetworkManager.objects[messageObj.id].onDelete();
            }
        }
        if (messageObj.type == "todoItemsDependencyLinked") {
            var newLink = new todoLink(workflowCanvas);
            newLink.upperItem = NetworkManager.objects[messageObj.upper];
            newLink.lowerItem = NetworkManager.objects[messageObj.lower];
            newLink.upperItem.addLowerLink(newLink);
            newLink.lowerItem.addUpperLink(newLink);
            workflowCanvas.draw();
        }
        if (messageObj.type == "todoItemsDependencyRemoved") {
            var upperItem = NetworkManager.objects[messageObj.upper];

            //Search for the relevant link
            
            for (var i = 0; i < upperItem.lowerLinks.length; i++) {
                if (upperItem.lowerLinks[i].lowerItem == NetworkManager.objects[messageObj.lower]) {

                    //We've found the link

                    upperItem.lowerLinks[i].onDelete();
                }
            }
        }
        if (messageObj.type == "todoItemDone") {
            if (!NetworkManager.objects[messageObj.id].done) {
                NetworkManager.objects[messageObj.id].toggleDone();
            }
        }
        if (messageObj.type == "todoItemUndone") {
            if (NetworkManager.objects[messageObj.id].done) {
                NetworkManager.objects[messageObj.id].toggleDone();
            }
        }
        if (messageObj.type == "sizeToContent") {
            NetworkManager.objects[messageObj.id].canvas.sizeToContent();
        }
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
    if (message != null) {
        NetworkManager.socket.send(JSON.stringify(message));
    }
};

//Our list of functions

NetworkManager.todoItemCreated = function(item,content,xpos,ypos) {

    //Drop object into array

    var id = NetworkManager.objects.length;
    NetworkManager.objects.push(item);

    //Create todo item

    NetworkManager.sendMessage({type:"todoItemCreated",id:id,content:content,xpos:xpos,ypos:ypos});
    return id;
}

NetworkManager.itemMoved = function(id,xpos,ypos) {

    //Move todo item

    NetworkManager.sendMessage({type:"itemMoved",id:id,xpos:xpos,ypos:ypos});
}

NetworkManager.itemEdited = function(id,content) {

    //Edit todo item

    NetworkManager.sendMessage({type:"itemEdited",id:id,content:content});
}

NetworkManager.itemDeleted = function(id) {

    //Delete todo item

    NetworkManager.sendMessage({type:"itemDeleted",id:id});
}

NetworkManager.todoItemDependencyLinked = function(upper,lower) {

    //Link todo item

    NetworkManager.sendMessage({type:"todoItemsDependencyLinked",upper:upper,lower:lower});
}

NetworkManager.todoItemDependencyRemoved = function(upper,lower) {

    //Unlink todo item

    NetworkManager.sendMessage({type:"todoItemsDependencyRemoved",upper:upper,lower:lower});
}

NetworkManager.todoItemDone = function(id) {

    //Finish a todo item

    NetworkManager.sendMessage({type:"todoItemDone",id:id});
}

NetworkManager.todoItemUndone = function(id) {

    //Unfinish a todo item

    NetworkManager.sendMessage({type:"todoItemUndone",id:id});
}

NetworkManager.sizeToContent = function(id) {
    
    //Resize a canvas to its content

    NetworkManager.sendMessage({type:"sizeToContent",id:id});
}

NetworkManager.initialize();
