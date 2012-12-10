///////////////////////////////////////////////////////////////////////////
////////////////////// Dynamic Object Classes /////////////////////////////
///////////////////////////////////////////////////////////////////////////

function dynamicTextBox(canvas,x,y,text,cleanup) {

    //Setup our variables
    
    this.canvas = canvas;
    this.pos = new point(x,y);
    this.text = text;
    this.editable = true;
    this.draggable = true;
    this.lowerRight = new point(x,y);

    //Create the HTML element that will hold the text box

    this.div = document.createElement('div');
    this.div.innerHTML = text;
    this.div.style.position = "absolute";
    this.div.style.left = (this.pos.x)+"px";
    this.div.style.top = (this.pos.y)+"px";
    this.div.className = "rounded textbox unselectable";

    canvas.canvasElm.parentNode.appendChild(this.div);

    canvas.renderObjects.push(this);

    var uber = this; //This is a sneaky trick to not lose 'this' when we handle events

    this.onDelete = function() {

        //Remove ourselves only if we are still in the array

        var index = canvas.renderObjects.indexOf(uber);
        if (index != -1) canvas.renderObjects.splice(index, 1);

        //Remove our HTML

        canvas.canvasElm.parentNode.removeChild(uber.div);

        //Call cleanup listner, if anyone is listening

        if (cleanup) cleanup();

        //Cleanup listeners

        uber.cleanupEdit();
        uber.cleanupDrag();
    }

    //Because we're using HTML to render this text, we need to actively
    //call functions in order to change it's position or text

    this.setPos = function(x,y) {
        uber.pos.x = x;
        uber.pos.y = y;
        uber.div.style.left = (x)+"px";
        uber.div.style.top = (y)+"px";
        uber.lowerRight.x = x+uber.div.offsetWidth;
        uber.lowerRight.y = y+uber.div.offsetHeight;
    }

    this.setText = function(text) {
        uber.text = text;
        uber.div.innerHTML = text;
    }

    this.onEditStateChange = function(editing) {
        uber.draggable = !editing;
    }

    this.cleanupEdit = makeEditable(this,this.div,this.onDelete,this.onEditStateChange);
    this.cleanupDrag = makeDraggable(this,this.div);
}
