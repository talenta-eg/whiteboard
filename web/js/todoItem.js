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

    TodoItem.buildHTML(this,TodoItem.textWidget);
    TodoItem.makeDraggable(this);
    TodoItem.makeLinkable(this);
    TodoItem.manageLinkDependencies(this);
    TodoItem.dragLinks(this);
    TodoItem.addToManager(this,todoManager);

    //This is a sneaky trick to not lose 'this' when we handle events

    var uber = this; 

    this.onDelete = function(tellNetwork) {
        if (!window.confirm("Really delete?")) return;

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
TodoItem.todoLink = function(canvas) {

    this.canvas = canvas;

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
        uber.line.onDelete();
        if (uber.upperItem && uber.lowerItem) {
            uber.upperItem.removeLowerLink(uber);
            uber.lowerItem.removeUpperLink(uber);

            //Let NetworkManager know about the our deletion

            if (tellNetwork) {
                NetworkManager.todoItemDependencyRemoved(uber.upperItem.id,uber.lowerItem.id);
            }
        }
        canvas.draw();
        if (uber.deleteButton.parentNode) {
            uber.deleteButton.parentNode.removeChild(uber.deleteButton);
        }
    }

    //Register our delete button
    
    this.deleteButton.onclick = function() {
        uber.onDelete(true);
    }
}

/**
 * A widget that is just an editable text box
 */
TodoItem.textWidget = function(parentDiv,todo) {
    todo.text = "Double Click Me!";
    todo.editable = true;

    //Create the editable text box

    todo.textBox = document.createElement('div');
    todo.textBox.className = "todoItemContent";
    todo.textBox.innerHTML = todo.text;
    parentDiv.appendChild(todo.textBox);

    //This is the callback that makeEditable gives us, so we can know when the
    //editable text is being touched by the user, and respond accordingly

    todo.onEditStateChange = function(editing) {
        todo.draggable = !editing;
        if (!editing) {
            todo.text = todo.textBox.innerHTML;
            todo.todoManager.updateList();

            //Tell NetworkManager that we've been edited
            NetworkManager.itemEdited(todo.id,todo.textBox.text);
        }
        //Update the lines on the screen, because this often resizes the box
        todo.updateLinks();
        todo.canvas.draw();
    }

    //Add the editable text box behavior to this widget

    todo.cleanupFunctions.push(makeEditable(todo,todo.textBox,todo.onDelete,todo.onEditStateChange));

    todo.ignoreNetworkSetText = function(text) {
        todo.text = text;
        todo.textBox.innerHTML = text;
        todo.todoManager.updateList();

        //This is the hidden variable in makeEditable to save what text to use
        //TODO: This is totally a hack, need a cleaner interface with makeEditable
        //so that this isn't necessary

        todo.textBox.text = text;

        //Update the lines on the screen position, because text change often resizes the box

        todo.updateLinks();
        todo.canvas.draw();
    }

    todo.setText = function(text) {
        todo.ignoreNetworkSetText(text);

        //Alert the network of the change
        NetworkManager.itemEdited(todo.id,todo.textBox.text);
    }
}

/**
 * Builds the HTML of a todo item, and can take any
 * widget as the central element to be housed.
 */
TodoItem.buildHTML = function(todo,widget) {
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

    todo.widget = new widget(todo.div,todo);
    
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
TodoItem.addToManager = function(todo,todoManager) {

    todo.todoManager = todoManager;

    //Add ourselves to the todoManager so we can get our item rendered on the todolist

    todo.todoManager.todoItems.push(todo);
    todo.todoManager.updateList();

    todo.cleanupFunctions.push(function() {

        //Remove ourselves only if we are still in the array

        index = todo.todoManager.todoItems.indexOf(todo);
        if (index != -1) todo.todoManager.todoItems.splice(index, 1);

        //Update the todo list
        
        todo.todoManager.updateList();
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

    todo.cleanupFunctions.push(function() {

        //Delete all links pointing to us

        for (var i = 0; i < todo.upperLinks.length; i++) {
            todo.upperLinks[i].onDelete();
        }
        for (var i = 0; i < todo.lowerLinks.length; i++) {
            todo.lowerLinks[i].onDelete();
        }
    });
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
        }
        for (var i = 0; i < todo.lowerLinks.length; i++) {
            if (!todo.done && todo.lowerLinks[i].lowerItem.done) {

                //Delete todo arc as a contradiction, because you can't have an item that's
                //done with dependencies that are not done yet

                todo.lowerLinks[i].onDelete();
            }
            else {

                //Tell our lower items to check if they can get done yet, because we just
                //finished

                todo.lowerLinks[i].lowerItem.onUpperLinkDone();
            }
        }
        todo.todoManager.updateList();
    }

    todo.toggleDone = function() {
        todo.ignoreNetworkToggleDone();
        if (todo.done) {
            NetworkManager.todoItemDone(todo.id);
            todo.div.className = "todoItemBox done";
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
            todo.todoManager.updateList();

            //Update the lines on the screen, because changing the can-do status often
            //resizes the box

            todo.updateLinks();
            todo.canvas.draw();
            todo.div.className = "todoItemBox" + (todo.canDo ? "" : " cant");
        }
    }

    //todo checks all the dependency links and updates whether or not this item
    //is available to be done. todo would be faster to do with an outstanding-links
    //counter, but that introduces bugs if the counter doesn't get updated in some
    //edge-case. Slow and steady wins the race with UI.

    todo.updateCanDo = function() {
        var canDo = true;
        for (var i = 0; i < todo.upperLinks.length; i++) {
            if (!todo.upperLinks[i].upperItem.done) {
                canDo = false;
                break;
            }
        }
        todo.setCanDo(canDo);
    }

    //Register our done button

    todo.doneButton.onclick = todo.toggleDone;

    //todo lets us manage our link flow

    todo.addUpperLink = function(link) {
        todo.upperLinks.push(link);
        if (!link.upperItem.done) {
            if (todo.done) {

                //Delete todo arc, because it's a contradiction to have a done item
                //with a dependency to an item that isn't done yet

                link.onDelete();
            }
            else {

                //Definately can't do todo todo now, because the item that we're newly
                //dependant on isn't done

                todo.setCanDo(false)
            }
        }
    }

    todo.addLowerLink = function(link) {
        todo.lowerLinks.push(link);
    }

    todo.onUpperLinkDone = function() {

        //We have to check all the items

        todo.updateCanDo();
    }

    todo.onUpperLinkUndone = function() {

        //Definately can't do todo todo now, so we can set this to false

        todo.setCanDo(false);
    }

    //todo is called by the link when it gets deleted. Don't call this
    //directly

    todo.removeUpperLink = function(link) {

        //Remove ourselves only if we are still in the array

        var index = todo.upperLinks.indexOf(link);
        if (index != -1) todo.upperLinks.splice(index, 1);

        //We're not sure whether todo means we can now be executed, so we
        //need to check all the remaining upper links

        todo.updateCanDo();
    }

    //todo is called by the link when it gets deleted. Don't call this
    //directly

    todo.removeLowerLink = function(link) {

        //Remove ourselves only if we are still in the array

        var index = todo.lowerLinks.indexOf(link);
        if (index != -1) todo.lowerLinks.splice(index, 1);
    }
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

        todo.draggingLink = new TodoItem.todoLink(todo.canvas);

        //Tell the link who we are

        todo.draggingLink.lowerItem = todo;
        todo.draggingLink.startButton = "upper";

        //Notify the canvas that we're dragging so others can poke us

        todo.canvas.currentlyDraggingObject = todo;
    }

    //Drag out a new link when the lower button is clicked

    todo.lowerButtonMouseDown = function(evt) {

        //Make the link

        todo.draggingLink = new TodoItem.todoLink(todo.canvas);

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
            todo.draggingLink.upperItem.addLowerLink(todo.draggingLink);
            todo.draggingLink.lowerItem.addUpperLink(todo.draggingLink);

            //Let NetworkManager know about the new link

            NetworkManager.todoItemDependencyLinked(todo.draggingLink.upperItem.id,todo.draggingLink.lowerItem.id);
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
