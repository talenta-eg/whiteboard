///////////////////////////////////////////////////////////////////////////
///////////////////////////// Todo List Nodes /////////////////////////////
///////////////////////////////////////////////////////////////////////////

var TodoItem = {};

TodoItem.basicTodoItem = function(canvas,todoManager,x,y,text,tellNetwork) {

    //Add ourselves to the object pool for the network manager
    if (tellNetwork) {
        this.id = NetworkManager.todoItemCreated(this,text,x,y);
    }

    //Setup our variables

    this.canvas = canvas;
    this.pos = new point(x,y);
    this.cleanupFunctions = [];

    TodoItem.buildHTML(this,text,Widget.textWidget);
    TodoItem.addTodoManager(this,todoManager);
    TodoItem.makeDraggable(this);
    TodoItem.makeLinkable(this);
    TodoItem.manageLinkDependencies(this);
    TodoItem.dragLinks(this);

    //This is a sneaky trick to not lose 'this' when we handle events

    var uber = this; 

    this.onDelete = function(tellNetwork) {
        if (tellNetwork && !window.confirm("Really delete?")) return;

        //All of our cleanup is put into cleanupFunctions by the adjective
        //functions

        for (var i = 0; i < uber.cleanupFunctions.length; i++) {
            uber.cleanupFunctions[i]();
        }

        //Tell the NetworkManager to delete us over the network

        if (tellNetwork) {
            NetworkManager.itemDeleted(uber.id);
        }
    }

    //Register our delete button

    this.deleteButton.onclick = this.onDelete;
}

/*
 * The class that controls the todo links
 */
TodoItem.todoLink = function(canvas,todoManager) {

    this.canvas = canvas;
    this.todoManager = todoManager;

    //Amount of curve in dependency lines

    var bezierStrength = 50;

    //The object that will render our dependency lines

    this.line = new SimpleShapes.bezierLine(canvas,canvas.mouseX,canvas.mouseY,canvas.mouseX,canvas.mouseY,bezierStrength);

    //The two items we link between

    this.upperItem;
    this.lowerItem;

    //The button we originated from, so we don't accidentally detach ourselves
    //from both the target and the source

    this.startButton;

    //Create delete button for the link

    this.deleteButton = document.createElement('button');
    this.deleteButton.className = "linkDelete";
    this.deleteButton.style.display = "none";
    this.deleteButton.style.position = "absolute";

    //Add the button into the document as a sibling of the canvas

    canvas.canvasElm.parentNode.appendChild(this.deleteButton);

    //Hold on to 'this' while in functions

    var uber = this;

    this.updateLine = function() {
        var buttonHeight = 0;
        var shadowSize = 0;

        //Move our dependency line depending on which end is connected, or both

        if (uber.upperItem) {
            uber.line.start.x = uber.upperItem.pos.x + ((uber.upperItem.div.offsetWidth - shadowSize)/2);
            uber.line.start.y = uber.upperItem.pos.y + uber.upperItem.div.offsetHeight - shadowSize;
        }
        else {
            uber.line.start.x = uber.canvas.mouseX;
            uber.line.start.y = uber.canvas.mouseY;
        }
        if (uber.lowerItem) {
            uber.line.end.x = uber.lowerItem.pos.x + ((uber.lowerItem.div.offsetWidth - shadowSize)/2);
            uber.line.end.y = uber.lowerItem.pos.y - shadowSize;
        }
        else {
            uber.line.end.x = uber.canvas.mouseX;
            uber.line.end.y = uber.canvas.mouseY;
        }

        //Move our "Unlink" button to be at the middle of our dependency line

        if (uber.upperItem && uber.lowerItem) {
            uber.deleteButton.style.display = "";
            var posX = uber.upperItem.pos.x + ((uber.upperItem.div.offsetWidth - shadowSize)/2);
            posX += uber.lowerItem.pos.x + ((uber.lowerItem.div.offsetWidth - shadowSize)/2);
            posX /= 2;
            posX -= uber.deleteButton.offsetWidth/2;
            var posY = uber.upperItem.pos.y + uber.upperItem.div.offsetHeight - shadowSize;
            posY += uber.lowerItem.pos.y;
            posY /= 2;
            posY -= uber.deleteButton.offsetHeight/2;
            uber.deleteButton.style.left = posX+"px";
            uber.deleteButton.style.top = posY+"px";
        }
        else {
            uber.deleteButton.style.display = "none";
        }
    }

    this.onDelete = function(tellNetwork) {

        //Delete our link in the todoManager

        uber.todoManager.removeLink(uber,tellNetwork);

        //Delete our bezier line

        uber.line.onDelete();
    }

    //Register our delete button
    
    this.deleteButton.onclick = function() {
        uber.onDelete(true);
    }
}

/**
 * Builds the HTML of a todo item, and can take any
 * widget as the central element to be housed.
 */
TodoItem.buildHTML = function(todo,text,widget) {
    /* Todo Item HTML:
        <div class="todoItemBox" style="position:absolute;left:210px;top:310px">
            <button class="todoItemDone"></button>
            <button class="todoItemDelete"></button>
            <div class="todoItemTop"></div>
            <div class="todoItemContent">Content here<br>More content. This could get very, very long winded and gross.</div>
            <div class="todoItemBottom"></div>
        </div>
    */

    //Create the HTML element that will hold the todo item

    todo.div = document.createElement('div');
    todo.div.style.position = "absolute";
    todo.div.style.left = (todo.pos.x)+"px";
    todo.div.style.top = (todo.pos.y)+"px";
    todo.div.className = "todoItemBox";

    //Create the upper button on the element

    todo.upperButton = document.createElement('div');
    todo.upperButton.className = "todoItemTop";
    todo.div.appendChild(todo.upperButton);

    //Add the widget

    todo.widget = new widget(todo.div,todo,text);
    
    //Create the done button

    todo.doneButton = document.createElement('button');
    todo.doneButton.className = "todoItemDone";
    todo.div.appendChild(todo.doneButton);

    //Create the delete button

    todo.deleteButton = document.createElement('button');
    todo.deleteButton.className = "todoItemDelete";
    todo.div.appendChild(todo.deleteButton);

    //Create the lower button

    todo.lowerButton = document.createElement('div');
    todo.lowerButton.className = "todoItemBottom";
    todo.div.appendChild(todo.lowerButton);

    todo.canvas.canvasElm.parentNode.appendChild(todo.div);

    todo.cleanupFunctions.push(function() {
        //Remove the div we created

        try {
            todo.canvas.canvasElm.parentNode.removeChild(todo.div);
        }
        catch (e) {
        }

        //Remove ourselves only if we are still in the array

        var index = todo.canvas.renderObjects.indexOf(todo);
        todo.canvas.renderObjects.splice(index, 1);

        //Detach all of our event listeners, so we can be garbage collected

        todo.upperButton.removeEventListener("mouseover",todo.upperButtonMouseOver);
        todo.upperButton.removeEventListener("mouseout",todo.upperButtonMouseOut);
        todo.upperButton.removeEventListener("mousedown",todo.upperButtonMouseDown);

        todo.lowerButton.removeEventListener("mouseover",todo.lowerButtonMouseOver);
        todo.lowerButton.removeEventListener("mouseout",todo.lowerButtonMouseOut);
        todo.lowerButton.removeEventListener("mousedown",todo.lowerButtonMouseDown);

        todo.div.removeEventListener("mouseover",todo.mainMouseOver);
        todo.div.removeEventListener("mouseout",todo.mainMouseOut);

        window.removeEventListener("mouseup",todo.generalMouseUp);
        window.removeEventListener("mousemove",todo.generalMouseMoved);
    });
}

/**
 * Makes the todo item's div draggable
 */
TodoItem.makeDraggable = function(todo) {

    //Add ourself to the drawn objects on the canvas so it can scale when we get dragged
    //too far out to the side

    todo.canvas.renderObjects.push(todo);

    //Remember where our furthest down and to the right point is so we can use it to scale
    //the canvas correctly

    todo.lowerRight = new point(todo.pos.x+todo.div.offsetWidth,todo.pos.y+todo.div.offsetHeight);
    todo.canvas.stretchToContent(todo.lowerRight.x,todo.lowerRight.y);

    //We want the canvas to resize as soon as we are born, not when the user moves the mouse

    todo.canvas.draw();

    //Call in a helper function to add dragging functionality

    todo.draggable = true;
    todo.cleanupFunctions.push(makeDraggable(todo,todo.div));

    //Because we're using HTML to render this text, we need to actively
    //call functions in order to change it's position or text

    todo.setPos = function(x,y) {
        todo.pos.x = x;
        todo.pos.y = y;

        todo.div.style.left = x+"px";
        todo.div.style.top = y+"px";

        //Force a redraw to fix a browser bug in Safari and Chrome

        if (todo.doneButton.style.top === "-30px") {
            todo.doneButton.style.top = "-31px";
        }
        else {
            todo.doneButton.style.top = "-30px";
        }

        if (todo.deleteButton.style.top === "-30px") {
            todo.deleteButton.style.top = "-31px";
        }
        else {
            todo.deleteButton.style.top = "-30px";
        }

        //Update all of our links on screen position

        todo.updateLinks();

        //Set the lower right point so the canvas will stretch to accomodate
        //our new position

        todo.lowerRight.x = x+todo.div.offsetWidth;
        todo.lowerRight.y = y+todo.div.offsetHeight;

        //Resize the window if necessary to accomodate the new movement

        todo.canvas.stretchToContent(todo.lowerRight.x,todo.lowerRight.y);

        todo.canvas.draw();
    }

    todo.cleanupFunctions.push(function() {

        //Update the size of the canvas when we get deleted

        todo.lowerRight.x = 0;
        todo.lowerRight.y = 0;
        todo.canvas.draw();
    });
}

/**
 * Adds this todo item to the Todo Manager
 */
TodoItem.addTodoManager = function(todo,todoManager) {

    todo.todoManager = todoManager;

    //Add ourselves to the todoManager so we can get our item rendered on the todolist

    todo.todoManager.addTodo(todo);

    todo.cleanupFunctions.push(function() {
        todo.todoManager.removeTodo(todo);
    });
}

/**
 * Makes it possible to drag links to/from this todo item
 */
TodoItem.makeLinkable = function(todo) {
    
    //Create our arrays to store links

    todo.upperLinks = new Array();
    todo.lowerLinks = new Array();

    //Update the links that point at us

    todo.updateLinks = function() {

        //Update all the links we're involved with

        for (var i = 0; i < todo.upperLinks.length; i++) {
            todo.upperLinks[i].updateLine();
        }
        for (var i = 0; i < todo.lowerLinks.length; i++) {
            todo.lowerLinks[i].updateLine();
        }
    }
}

/**
 * Makes link dependencies effect our ability to finish a todo
 */
TodoItem.manageLinkDependencies = function(todo) {
    todo.done = false;
    todo.canDo = true;

    //todo gets called to toggle the done state of this item, true->false, false->true

    todo.ignoreNetworkToggleDone = function() {
        todo.done = !todo.done;
        if (todo.done) {
            todo.doneButton.style.display = "none";
            todo.div.className = "todoItemBox done";
        }

        //Deals with links

        todo.todoManager.updateTodoItemDone(todo);
    }

    todo.toggleDone = function() {
        todo.ignoreNetworkToggleDone();
        if (todo.done) {
            NetworkManager.todoItemDone(todo.id);
        }
        else {
            NetworkManager.todoItemUndone(todo.id);
        }
    }

    //todo sets whether or not the item is available to be done

    todo.setCanDo = function(canDo) {
        if (!todo.done) {
            todo.canDo = canDo;
            todo.doneButton.style.display = todo.canDo ? "" : "none";
            todo.todoManager.updateList(todo);

            //Update the lines on the screen, because changing the can-do status often
            //resizes the box

            todo.updateLinks();
            todo.canvas.draw();
            todo.div.className = "todoItemBox" + (todo.canDo ? "" : " cant");
        }
    }

    //Register our done button

    todo.doneButton.onclick = todo.toggleDone;
}

/**
 * This deals with all the logic to let you drag links around from item to item
 */
TodoItem.dragLinks = function(todo) {

    //Make a space to store our dragging links

    todo.draggingLink = null;

    //For now, we just prevent dragging on buttons, but eventually they will light up.

    todo.upperButtonMouseOver = function(evt) {
        todo.draggable = false;
    }

    todo.upperButtonMouseOut = function(evt) {
        todo.draggable = true;
    }

    todo.lowerButtonMouseOver = function(evt) {
        todo.draggable = false;
    }

    todo.lowerButtonMouseOut = function(evt) {
        todo.draggable = true;
    }

    //todo is how we notify other elements if they've dragged over us. We have
    //no idea whether or not someone is dragging until they touch us, then we
    //can check by looking through the canvas element's currentlyDraggingObject
    //(which is set below in upperButtonMouseDown)

    todo.mainMouseOver = function() {
        if (todo.canvas.currentlyDraggingObject) {
            if (todo.canvas.currentlyDraggingObject != todo) {
                if (todo.canvas.currentlyDraggingObject.passedOverButton) {
                    todo.canvas.currentlyDraggingObject.passedOverButton(todo,true);
                }
            }
        }
    }

    todo.mainMouseOut = function() {
        if (todo.canvas.currentlyDraggingObject) {
            if (todo.canvas.currentlyDraggingObject != todo) {
                if (todo.canvas.currentlyDraggingObject.passedOutOfButton) {
                    todo.canvas.currentlyDraggingObject.passedOutOfButton(todo,true);
                }
            }
        }
    }

    //Drag out a new link when the top button is clicked

    todo.upperButtonMouseDown = function(evt) {

        //Make the link

        todo.draggingLink = new TodoItem.todoLink(todo.canvas,todo.todoManager);

        //Tell the link who we are

        todo.draggingLink.lowerItem = todo;
        todo.draggingLink.startButton = "upper";

        //Notify the canvas that we're dragging so others can poke us

        todo.canvas.currentlyDraggingObject = todo;
    }

    //Drag out a new link when the lower button is clicked

    todo.lowerButtonMouseDown = function(evt) {

        //Make the link

        todo.draggingLink = new TodoItem.todoLink(todo.canvas,todo.todoManager);

        //Tell the link who we are

        todo.draggingLink.upperItem = todo;
        todo.draggingLink.startButton = "lower";

        //Notify the canvas that we're dragging so others can poke us

        todo.canvas.currentlyDraggingObject = todo;
    }

    //Notification we receive if we drag a link over the button
    //of another item

    todo.passedOverButton = function(todoItem) {
        if (todo.draggingLink.startButton == "upper") {

            //If we're trying to drag a dependency from a done item to one that isn't
            //finished yet, then ignore it

            if (todo.done && !todoItem.done) return;

            //If we already have a link to it, skip it

            for (var i = 0; i < todo.upperLinks.length; i++) {
                if (todo.upperLinks[i].upperItem == todoItem) return;
            }

            //We have a match

            todo.draggingLink.upperItem = todoItem;
        }
        else if (todo.draggingLink.startButton == "lower") {

            //If we're trying to drag a dependency from an unfinished item to a done one
            //then ignore that

            if (!todo.done && todoItem.done) return;

            //If we already have a link to it, skip it

            for (var i = 0; i < todo.lowerLinks.length; i++) {
                if (todo.lowerLinks[i].lowerItem == todoItem) return;
            }

            //We have a match

            todo.draggingLink.lowerItem = todoItem;
        }
    }

    //We dragged a link out of a button of another item

    todo.passedOutOfButton = function(todoItem) {
        if (todo.draggingLink.startButton == "upper") {
            //We have a match
            todo.draggingLink.upperItem = null;
        }
        else if (todo.draggingLink.startButton == "lower") {
            //We have a match
            todo.draggingLink.lowerItem = null;
        }
    }

    //We're done dragging here

    todo.generalMouseUp = function(evt) {
        if (!todo.draggingLink) return;

        if (todo.draggingLink.upperItem && todo.draggingLink.lowerItem) {

            //Let the todoManager handle link data management

            todo.todoManager.makeLinkReal(todo.draggingLink);
            todo.draggingLink = null;
        }
        else {

            //Delete our link

            todo.draggingLink.onDelete();
            todo.draggingLink = null;
        }

        //Clear the canvases reference to us

        if (todo.canvas.currentlyDraggingObject == todo) {
            todo.canvas.currentlyDraggingObject = null;
        }
    }

    todo.generalMouseMoved = function(evt) {
        if (todo.draggingLink) {
            todo.draggingLink.updateLine();
        }
    }

    //Helpers to apply the behavior desired


    //Adding all the event listeners

    todo.upperButton.addEventListener("mouseover",todo.upperButtonMouseOver);
    todo.upperButton.addEventListener("mouseout",todo.upperButtonMouseOut);
    todo.upperButton.addEventListener("mousedown",todo.upperButtonMouseDown);

    todo.lowerButton.addEventListener("mouseover",todo.lowerButtonMouseOver);
    todo.lowerButton.addEventListener("mouseout",todo.lowerButtonMouseOut);
    todo.lowerButton.addEventListener("mousedown",todo.lowerButtonMouseDown);

    todo.div.addEventListener("mouseover",todo.mainMouseOver);
    todo.div.addEventListener("mouseout",todo.mainMouseOut);

    window.addEventListener("mouseup",todo.generalMouseUp);
    window.addEventListener("mousemove",todo.generalMouseMoved);
}
