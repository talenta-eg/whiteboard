
//A function that can make any div editable (double click on it and
//it will replace the content with an editable field, and then go
//back when you're done).

function makeEditable(object,div,onDelete,onEditStateChange) {
    
    //Save a handle to keep our editable box in

    var textBox;

    //Save the text associated with this editable field

    div.text = div.innerHTML;

    var handleKeyDown = function (evt) {

        //User pressed return

        if (evt.keyCode == 13) {
            handleLoseFocus();
        }
    }

    var handleLoseFocus = function(evt) {

        //Remove listeners

        textBox.removeEventListener('blur',handleLoseFocus,false);
        textBox.removeEventListener('keydown',handleKeyDown,false);  

        //Change HTML back

        div.text = textBox.value;
        div.innerHTML = div.text;
        div.editing = false;
        onEditStateChange(div.editing);
        if (div.text == "") onDelete();
    }

    var handleDoubleClick = function(evt) {

        //If we're already an input box, ignore this

        if (div.editing || !object.editable) return;
        div.editing = true;
        onEditStateChange(div.editing);

        //Make an input box

        div.innerHTML = "<textarea></textarea>";

        //Get a handle for it

        textBox = div.childNodes[0];

        //Set it's text to the current value

        textBox.value = div.text;

        //Set the keyboard focus to this

        textBox.focus();

        //Add listeners for going back to boring text

        textBox.addEventListener('blur',handleLoseFocus,false);
        textBox.addEventListener('keydown',handleKeyDown,false);  
    }

    div.addEventListener('dblclick',handleDoubleClick,false);

    //This is the cleanup function

    return function() {
        div.removeEventListener('dblclick',handleDoubleClick,false);
    }
}

//A function that will make any absolutely positioned div draggable

function makeDraggable(object,div) {

    //Set up the variables that we need to support dragging

    object.dragging = false;
    object.dragStart;
    object.dragMouseStart;
    object.draggable = true;
    object.size = new point(0,0);

    //Handle the user clicking on the div

    var handleMouseDown = function(evt) {
        if (!object.draggable) return;
        object.dragging = true;
        object.dragStart = new point(object.pos.x,object.pos.y);
        object.dragMouseStart = new point(object.canvas.mouseX,object.canvas.mouseY);
    }

    //Handle the user mouse moving anywhere on the screen

    var handleMouseMove = function(evt) {
        if (!object.dragging) return;
        var dragged = new point();
        dragged.x = object.dragStart.x + (object.canvas.mouseX - object.dragMouseStart.x);
        dragged.y = object.dragStart.y + (object.canvas.mouseY - object.dragMouseStart.y);

        //Prevent the textbox from being dragged off the whiteboard

        if (dragged.x < 0) dragged.x = 0;
        if (dragged.y < 0) dragged.y = 0;

        //The offsetWidth and offsetHeight are the whole size of the object, including padding, but it's position is 
        //measured from the start of content, without any padding, so we subtract our the difference (the padding on
        //the top and left)

        if (dragged.x > object.canvas.canvasWidth - object.size.x) dragged.x = 
            object.canvas.canvasWidth - object.size.x;
        if (dragged.y > object.canvas.canvasHeight - object.size.y) dragged.y = 
            object.canvas.canvasHeight - object.size.y;

        //Set the textbox's position

        object.setPos(dragged.x,dragged.y);

        //Tell NetworkManager that we've been moved

        if (object.id != null) NetworkManager.itemMoved(object.id,dragged.x,dragged.y);
    }

    //Handle the mouse releasing anywhere on the screen

    var handleMouseUp = function(evt) {
        if (object.dragging) {
            object.dragging = false;

            //Resize the content window to accomodate the new position

            object.canvas.sizeToContent();
            if (object.id != null) NetworkManager.sizeToContent(object.id);
        }
    }

    div.addEventListener('mousedown',handleMouseDown,true);
    window.addEventListener('mousemove',handleMouseMove,false);
    window.addEventListener('mouseup',handleMouseUp,false);

    //This is the cleanup function. We return it so that the users of this interface can call it when they delete
    //the parent element.

    return function() {
        div.removeEventListener('mousedown',handleMouseDown,true);
        window.removeEventListener('mousemove',handleMouseMove,false);
        window.removeEventListener('mouseup',handleMouseUp,false);
    }
}
