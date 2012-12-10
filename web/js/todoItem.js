///////////////////////////////////////////////////////////////////////////
///////////////////////////// Todo List Nodes /////////////////////////////
///////////////////////////////////////////////////////////////////////////

function todoItem(canvas,todoManager,x,y,text) {

    //Setup our variables

    this.canvas = canvas;
    this.todoManager = todoManager;
    this.pos = new point(x,y);
    this.text = text;
    this.editable = true;
    this.draggable = true;
    this.done = false;
    this.canDo = true;

    //Create the HTML element that will hold the todo item

    this.div = document.createElement('div');
    this.div.style.position = "absolute";
    this.div.style.left = (this.pos.x)+"px";
    this.div.style.top = (this.pos.y)+"px";
    this.div.className = "rounded todo clipped";

    //Create the upper button on the element

    this.upperButton = document.createElement('div');
    this.upperButton.style.backgroundColor = "#4f4";
    this.upperButton.className = "todoUpperButton unselectable";
    this.div.appendChild(this.upperButton);

    //Create a padded zone between the buttons

    this.contentZone = document.createElement('div');
    this.contentZone.className = "todoContentZone";
    this.div.appendChild(this.contentZone);

    //Create the editable text box

    this.textBox = document.createElement('div');
    this.textBox.className = "rounded textbox unselectable";
    this.textBox.innerHTML = this.text;
    this.contentZone.appendChild(this.textBox);
    
    //Create the done button

    this.doneButton = document.createElement('button');
    this.doneButton.innerHTML = "Done";
    this.contentZone.appendChild(this.doneButton);

    //Create the delete button

    this.deleteButton = document.createElement('button');
    this.deleteButton.innerHTML = "Delete";
    this.contentZone.appendChild(this.deleteButton);

    //Create the lower button

    this.lowerButton = document.createElement('div');
    this.lowerButton.style.backgroundColor = "#f44";
    this.lowerButton.className = "todoLowerButton unselectable";
    this.div.appendChild(this.lowerButton);

    canvas.canvasElm.parentNode.appendChild(this.div);

    //Add ourself to the drawn objects on the canvas so it can scale when we get dragged
    //too far out to the side

    canvas.renderObjects.push(this);

    //Add ourselves to the todoManager so we can get our item rendered on the todolist

    todoManager.todoItems.push(this);
    todoManager.updateList();

    //Remember where our furthest down and to the right point is so we can use it to scale
    //the canvas correctly

    this.lowerRight = new point(this.pos.x+this.div.offsetWidth,this.pos.y+this.div.offsetHeight);

    canvas.stretchToContent(this.lowerRight.x,this.lowerRight.y);

    //We want the canvas to resize as soon as we are born, not when the user moves the mouse

    canvas.draw();
    
    //Create our arrays to store links

    this.upperLinks = new Array();
    this.lowerLinks = new Array();

    //Keep a private reference to any links we may be dragging

    var draggingLink;

    //This is a sneaky trick to not lose 'this' when we handle events

    var uber = this; 

    this.onDelete = function() {

        //Remove ourselves only if we are still in the array

        var index = canvas.renderObjects.indexOf(uber);
        if (index != -1) canvas.renderObjects.splice(index, 1);

        //Remove ourselves only if we are still in the array

        index = todoManager.todoItems.indexOf(uber);
        if (index != -1) todoManager.todoItems.splice(index, 1);

        //Remove the div we created

        canvas.canvasElm.parentNode.removeChild(uber.div);

        //Delete all links pointing to us

        for (var i = 0; i < uber.upperLinks.length; i++) {
            uber.upperLinks[i].onDelete();
        }
        for (var i = 0; i < uber.lowerLinks.length; i++) {
            uber.lowerLinks[i].onDelete();
        }

        //Update the screen

        uber.lowerRight.x = 0;
        uber.lowerRight.y = 0;
        canvas.draw();

        //Update the todo list
        
        todoManager.updateList();

        //Detach all of our event listeners, so we can be garbage collected

        uber.upperButton.removeEventListener("mouseover",uber.upperButtonMouseOver);
        uber.upperButton.removeEventListener("mouseout",uber.upperButtonMouseOut);
        uber.upperButton.removeEventListener("mousedown",uber.upperButtonMouseDown);

        uber.lowerButton.removeEventListener("mouseover",uber.lowerButtonMouseOver);
        uber.lowerButton.removeEventListener("mouseout",uber.lowerButtonMouseOut);
        uber.lowerButton.removeEventListener("mousedown",uber.lowerButtonMouseDown);

        uber.div.removeEventListener("mouseover",uber.mainMouseOver);
        uber.div.removeEventListener("mouseout",uber.mainMouseOut);

        window.removeEventListener("mouseup",uber.generalMouseUp);
        window.removeEventListener("mousemove",uber.generalMouseMoved);

        uber.cleanupEditable();
        uber.cleanupDraggable();
    }

    //Register our delete button

    this.deleteButton.onclick = this.onDelete;

    //Update the links that point at us

    this.updateLinks = function() {

        //Update all the links we're involved with

        for (var i = 0; i < uber.upperLinks.length; i++) {
            uber.upperLinks[i].updateLine();
        }
        for (var i = 0; i < uber.lowerLinks.length; i++) {
            uber.lowerLinks[i].updateLine();
        }
    }

    //Because we're using HTML to render this text, we need to actively
    //call functions in order to change it's position or text

    this.setPos = function(x,y) {
        uber.pos.x = x;
        uber.pos.y = y;
        uber.div.style.left = (x)+"px";
        uber.div.style.top = (y)+"px";

        //Update all of our links

        uber.updateLinks();

        //Set the lower right point so the canvas will stretch to accomodate
        //our new position

        uber.lowerRight.x = x+uber.div.offsetWidth;
        uber.lowerRight.y = y+uber.div.offsetHeight;
    }

    this.setText = function(text) {
        uber.text = text;
        uber.textBox.innerHTML = text;

        //This is the hidden variable in makeEditable to save what text to use
        //TODO: This is totally a hack, need a cleaner interface with makeEditable
        //so that this isn't necessary

        uber.textBox.text = text;

        //Update the lines on the screen, because this often resizes the box

        uber.updateLinks();
        uber.canvas.draw();
    }
    
    //This is the callback that makeEditable gives us, so we can know when the
    //editable text is being touched by the user, and respond accordingly

    this.onEditStateChange = function(editing) {
        uber.draggable = !editing;
        if (!editing) {
            uber.text = uber.textBox.innerHTML;
            uber.todoManager.updateList();
        }
        //Update the lines on the screen, because this often resizes the box
        uber.updateLinks();
        uber.canvas.draw();
    }

    //***************************   Dependency management   ********************************

    //This gets called to toggle the done state of this item, true->false, false->true

    this.toggleDone = function() {
        uber.done = !uber.done;
        uber.doneButton.innerHTML = uber.done ? "Undo" : "Done";
        for (var i = 0; i < uber.lowerLinks.length; i++) {
            if (!uber.done && uber.lowerLinks[i].lowerItem.done) {

                //Delete this arc as a contradiction, because you can't have an item that's
                //done with dependencies that are not done yet

                uber.lowerLinks[i].onDelete();
            }
            else {

                //Tell our lower items to check if they can get done yet, because we just
                //finished

                uber.lowerLinks[i].lowerItem.onUpperLinkDone();
            }
        }
        uber.todoManager.updateList();
    }

    //This sets whether or not the item is available to be done

    this.setCanDo = function(canDo) {
        uber.canDo = canDo;
        uber.doneButton.style.display= uber.canDo ? "" : "none";
        uber.todoManager.updateList();

        //Update the lines on the screen, because changing the can-do status often
        //resizes the box

        uber.updateLinks();
        uber.canvas.draw();
    }

    //This checks all the dependency links and updates whether or not this item
    //is available to be done. This would be faster to do with an outstanding-links
    //counter, but that introduces bugs if the counter doesn't get updated in some
    //edge-case. Slow and steady wins the race with UI.

    this.updateCanDo = function() {
        var canDo = true;
        for (var i = 0; i < uber.upperLinks.length; i++) {
            if (!uber.upperLinks[i].upperItem.done) {
                canDo = false;
                break;
            }
        }
        uber.setCanDo(canDo);
    }

    //Register our done button

    this.doneButton.onclick = this.toggleDone;

    //This lets us manage our link flow

    this.addUpperLink = function(link) {
        uber.upperLinks.push(link);
        if (!link.upperItem.done) {
            if (uber.done) {

                //Delete this arc, because it's a contradiction to have a done item
                //with a dependency to an item that isn't done yet

                link.onDelete();
            }
            else {

                //Definately can't do this todo now, because the item that we're newly
                //dependant on isn't done

                uber.setCanDo(false)
            }
        }
    }

    this.addLowerLink = function(link) {
        uber.lowerLinks.push(link);
    }

    this.onUpperLinkDone = function() {

        //We have to check all the items

        uber.updateCanDo();
    }

    this.onUpperLinkUndone = function() {

        //Definately can't do this todo now, so we can set this to false

        uber.setCanDo(false);
    }

    //This is called by the link when it gets deleted. Don't call this
    //directly

    this.removeUpperLink = function(link) {

        //Remove ourselves only if we are still in the array

        var index = uber.upperLinks.indexOf(link);
        if (index != -1) uber.upperLinks.splice(index, 1);

        //We're not sure whether this means we can now be executed, so we
        //need to check all the remaining upper links

        uber.updateCanDo();
    }

    //This is called by the link when it gets deleted. Don't call this
    //directly

    this.removeLowerLink = function(link) {

        //Remove ourselves only if we are still in the array

        var index = uber.lowerLinks.indexOf(link);
        if (index != -1) uber.lowerLinks.splice(index, 1);
    }

    //***************************   Dependency line drawing   ********************************

    //For now, we just prevent dragging on buttons, but eventually they will light up.

    this.upperButtonMouseOver = function(evt) {
        uber.draggable = false;
    }

    this.upperButtonMouseOut = function(evt) {
        uber.draggable = true;
    }

    this.lowerButtonMouseOver = function(evt) {
        uber.draggable = false;
    }

    this.lowerButtonMouseOut = function(evt) {
        uber.draggable = true;
    }

    //This is how we notify other elements if they've dragged over us. We have
    //no idea whether or not someone is dragging until they touch us, then we
    //can check by looking through the canvas element's currentlyDraggingObject
    //(which is set below in upperButtonMouseDown)

    this.mainMouseOver = function() {
        if (uber.canvas.currentlyDraggingObject) {
            if (uber.canvas.currentlyDraggingObject != uber) {
                if (uber.canvas.currentlyDraggingObject.passedOverButton) {
                    uber.canvas.currentlyDraggingObject.passedOverButton(uber,true);
                }
            }
        }
    }

    this.mainMouseOut = function() {
        if (uber.canvas.currentlyDraggingObject) {
            if (uber.canvas.currentlyDraggingObject != uber) {
                if (uber.canvas.currentlyDraggingObject.passedOutOfButton) {
                    uber.canvas.currentlyDraggingObject.passedOutOfButton(uber,true);
                }
            }
        }
    }

    //Drag out a new link when the top button is clicked

    this.upperButtonMouseDown = function(evt) {

        //Make the link

        draggingLink = new todoLink(uber.canvas);

        //Tell the link who we are

        draggingLink.lowerItem = uber;
        draggingLink.startButton = "upper";

        //Notify the canvas that we're dragging so others can poke us

        uber.canvas.currentlyDraggingObject = uber;
    }

    //Drag out a new link when the lower button is clicked

    this.lowerButtonMouseDown = function(evt) {

        //Make the link

        draggingLink = new todoLink(uber.canvas);

        //Tell the link who we are

        draggingLink.upperItem = uber;
        draggingLink.startButton = "lower";

        //Notify the canvas that we're dragging so others can poke us

        uber.canvas.currentlyDraggingObject = uber;
    }

    //Notification we receive if we drag a link over the button
    //of another item

    this.passedOverButton = function(todoItem) {
        if (draggingLink.startButton == "upper") {

            //If we're trying to drag a dependency from a done item to one that isn't
            //finished yet, then ignore it

            if (uber.done && !todoItem.done) return;

            //If we already have a link to it, skip it

            for (var i = 0; i < uber.upperLinks.length; i++) {
                if (uber.upperLinks[i].upperItem == todoItem) return;
            }

            //We have a match

            draggingLink.upperItem = todoItem;
        }
        else if (draggingLink.startButton == "lower") {

            //If we're trying to drag a dependency from an unfinished item to a done one
            //then ignore that

            if (!uber.done && todoItem.done) return;

            //If we already have a link to it, skip it

            for (var i = 0; i < uber.lowerLinks.length; i++) {
                if (uber.lowerLinks[i].lowerItem == todoItem) return;
            }

            //We have a match

            draggingLink.lowerItem = todoItem;
        }
    }

    //We dragged a link out of a button of another item

    this.passedOutOfButton = function(todoItem) {
        if (draggingLink.startButton == "upper") {
            //We have a match
            draggingLink.upperItem = null;
        }
        else if (draggingLink.startButton == "lower") {
            //We have a match
            draggingLink.lowerItem = null;
        }
    }

    //We're done dragging here

    this.generalMouseUp = function(evt) {
        if (!draggingLink) return;

        if (draggingLink.upperItem && draggingLink.lowerItem) {
            draggingLink.upperItem.addLowerLink(draggingLink);
            draggingLink.lowerItem.addUpperLink(draggingLink);
            draggingLink = null;
        }
        else {

            //Delete our link

            draggingLink.onDelete();
            draggingLink = null;
        }

        //Clear the canvases reference to us

        if (uber.canvas.currentlyDraggingObject == uber) {
            uber.canvas.currentlyDraggingObject = null;
        }
    }

    this.generalMouseMoved = function(evt) {
        if (draggingLink) {
            draggingLink.updateLine();
        }
    }

    //Helpers to apply the behavior desired

    this.cleanupEditable = makeEditable(this,this.textBox,this.onDelete,this.onEditStateChange);
    this.cleanupDraggable = makeDraggable(this,this.div);

    //Adding all the event listeners

    this.upperButton.addEventListener("mouseover",this.upperButtonMouseOver);
    this.upperButton.addEventListener("mouseout",this.upperButtonMouseOut);
    this.upperButton.addEventListener("mousedown",this.upperButtonMouseDown);

    this.lowerButton.addEventListener("mouseover",this.lowerButtonMouseOver);
    this.lowerButton.addEventListener("mouseout",this.lowerButtonMouseOut);
    this.lowerButton.addEventListener("mousedown",this.lowerButtonMouseDown);

    this.div.addEventListener("mouseover",this.mainMouseOver);
    this.div.addEventListener("mouseout",this.mainMouseOut);

    window.addEventListener("mouseup",this.generalMouseUp);
    window.addEventListener("mousemove",this.generalMouseMoved);
}

function todoLink(canvas) {

    this.canvas = canvas;

    //Amount of curve in dependency lines

    var bezierStrength = 50;

    //The object that will render our dependency lines

    this.line = new bezierLine(canvas,canvas.mouseX,canvas.mouseY,canvas.mouseX,canvas.mouseY,bezierStrength);

    //The two items we link between

    this.upperItem;
    this.lowerItem;

    //The button we originated from, so we don't accidentally detach ourselves
    //from both the target and the source

    this.startButton;

    //Create delete button for the link

    this.deleteButton = document.createElement('button');
    this.deleteButton.innerHTML = "Unlink";
    this.deleteButton.style.display = "none";
    this.deleteButton.style.position = "absolute";

    //Add the button into the document as a sibling of the canvas

    canvas.canvasElm.parentNode.appendChild(this.deleteButton);

    //Hold on to 'this' while in functions

    var uber = this;

    this.updateLine = function() {
        var buttonHeight = 25;
        var shadowSize = 5;

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
            uber.line.end.y = uber.lowerItem.pos.y;
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

    this.onDelete = function() {
        uber.line.onDelete();
        if (uber.upperItem && uber.lowerItem) {
            uber.upperItem.removeLowerLink(uber);
            uber.lowerItem.removeUpperLink(uber);
        }
        canvas.draw();
        if (uber.deleteButton.parentNode) {
            uber.deleteButton.parentNode.removeChild(uber.deleteButton);
        }
    }

    //Register our delete button
    
    this.deleteButton.onclick = this.onDelete;
}
