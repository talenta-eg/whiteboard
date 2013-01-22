///////////////////////////////////////////////////////////////////////////
////////////////////////// Drawing Manager ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

var Canvas = {};

/**
 * Adds all the attributes that a todo canvas should have
 */
Canvas.todoCanvas = function (id) {

    //Initialize the canvas element

    this.ctx = document.getElementById(id).getContext('2d'); // 2  
    this.canvasElm = document.getElementById(id);  

    //Add all the attributes we want for our canvas

    Canvas.addResize(this);
    Canvas.addDrawingArray(this);
    Canvas.addStretch(this);
    Canvas.addInput(this);
}

/**
 * Adds a setSize function to allow resizing the canvas
 */
Canvas.addResize = function(canvas) {

    //Sets the size of the canvas
    
    canvas.setSize = function(size) {
        canvas.size = size;

        //Rescale display size

        canvas.canvasElm.style.width = size.x+'px';
        canvas.canvasElm.style.height = size.y+'px';

        //Rescale number of pixels on canvas (to avoid stretching)

        canvas.canvasElm.width = canvas.canvasElm.offsetWidth;
        canvas.canvasElm.height = canvas.canvasElm.offsetHeight;
    }

    //Initialize our size

    canvas.setSize(Utilities.elementSpace(canvas.canvasElm));
}

/**
 * Adds the renderObjects array and a draw function to allow
 * refreshing the canvas screen with draw objects.
 */
Canvas.addDrawingArray = function(canvas) {

    //Here's the array that will render stuff to the canvas. Just add objects with
    //a draw() function to this, and they will end up on the canvas

    canvas.renderObjects = new Array();

    canvas.draw = function() {
        canvas.setSize(canvas.size); //Touching the size clears the canvas
        for (var i = 0; i < canvas.renderObjects.length; i++) {

            //Each object handles how it is drawn to the screen. To remove
            //an object from the screen, just remove it from this array, and
            //next frame it won't get rendered.

            if (canvas.renderObjects[i].draw) {
                canvas.renderObjects[i].draw(canvas.ctx);
            }
        }
    }
    window.addEventListener('resize',this.draw,false);
}

/**
 * Adds mouse handling, and keeps track of where the mouse
 * is in relation to the canvas
 */
Canvas.addInput = function(canvas) {

    function updateMousePos(evt) {
        var scrollSum = new point();
        scrollSum.x = canvas.canvasElm.parentNode.scrollLeft;
        scrollSum.y = canvas.canvasElm.parentNode.scrollTop;

        //A bit of cross-browser shennanigans for finding window scroll
        //Chrome and Safari:
        
        if (document.body.scrollTop || document.body.scrollLeft) {
            scrollSum.x += document.body.scrollLeft;
            scrollSum.y += document.body.scrollTop;
        }

        //Firefox and IE:

        else if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
            scrollSum.x += document.documentElement.scrollLeft;
            scrollSum.y += document.documentElement.scrollTop;
        }
        canvas.position = Utilities.elementPosition(canvas.canvasElm);
        canvas.mouseX = (evt.clientX)-(canvas.position.x)+scrollSum.x;
        canvas.mouseY = (evt.clientY)-(canvas.position.y)+scrollSum.y;
    }

    //Each listener checks if the main function left a function in
    //one of the callback slots (eg canvas.onMouseMoved) and if
    //there is one, it calls it.

    window.addEventListener('mousemove',function(evt) {
        updateMousePos(evt);
        if (canvas.onMouseMoved) canvas.onMouseMoved();
    });
    window.addEventListener('mousedown',function(evt) {
        updateMousePos(evt);
        if (canvas.onMouseDown) canvas.onMouseDown();
        canvas.mouseDown = true;
    });
    window.addEventListener('mouseup',function(evt) {
        updateMousePos(evt);
        if (canvas.onMouseUp) canvas.onMouseUp();
        canvas.mouseDown = false;
    });
    canvas.canvasElm.addEventListener('dblclick',function(evt) {
        if (canvas.onCanvasDoubleClick) canvas.onCanvasDoubleClick();
    });

    //A helpful function for querying inputs

    canvas.containsMouse = function() {
        return (canvas.mouseX > 0) && (canvas.mouseY > 0) && (canvas.mouseX < canvas.size.x) && (canvas.mouseY < canvas.size.y);
    }
}

/**
 * Adds the ability to stretch or shrink based on the size
 * of the content on the canvas. Requires addDrawingArray to
 * have been called first.
 */
Canvas.addStretch = function(canvas) {
    canvas.contentSizePadding = new point(150,150);
    canvas.contentSize = new point(canvas.size.x,canvas.size.y);

    //Shrinks or grows to fit content

    canvas.sizeToContent = function() {
        canvas.contentSize.x = 0;
        canvas.contentSize.y = 0;
        for (var i = 0; i < canvas.renderObjects.length; i++) {

            //Objects are only counted if they keep a lowerRight value

            if (canvas.renderObjects[i].lowerRight) {
                canvas.stretchContentSize(canvas.renderObjects[i].lowerRight.x,canvas.renderObjects[i].lowerRight.y);
            }
        }
        canvas.contentSize.x += canvas.contentSizePadding.x;
        canvas.contentSize.y += canvas.contentSizePadding.y;

        //Grow without animating

        canvas.stretchToContent(canvas.contentSize.x,canvas.contentSize.y);

        //Animate in from content size

        var stretchTimer = window.setInterval(function() {
            var delta = new point(canvas.contentSize.x-canvas.size.x,canvas.contentSize.y-canvas.size.y);
            canvas.size.x += (delta.x)/8;
            canvas.size.y += (delta.y)/8;
            if (Math.abs(delta.x) + Math.abs(delta.y) < 5) {

                //If we're within a certain threshold, cancel the timer

                canvas.size.x = canvas.contentSize.x;
                canvas.size.y = canvas.contentSize.y;
                window.clearInterval(stretchTimer);
            }

            //Updates the size of our window without clearing drawings

            canvas.draw();
        },30);
    }

    //Grows to fit content, much faster than looping all elements every frame
    
    canvas.stretchContentSize = function(x,y) {
        if (canvas.contentSize.x < x + canvas.contentSizePadding.x) canvas.contentSize.x = x + canvas.contentSizePadding.x;
        if (canvas.contentSize.y < y + canvas.contentSizePadding.y) canvas.contentSize.y = y + canvas.contentSizePadding.y;
    }

    //Gets called by items as they move around, so has to be fast

    canvas.stretchToContent = function(x,y) {
        canvas.stretchContentSize(x,y);
        if (canvas.contentSize.x > canvas.size.x) canvas.size.x = canvas.contentSize.x;
        if (canvas.contentSize.y > canvas.size.y) canvas.size.y = canvas.contentSize.y;
        canvas.draw();
    }
}
