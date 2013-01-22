///////////////////////////////////////////////////////////////////////////
/////////////////////// Dealing with Input ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

//Gets called on page load

function initializeInput() {

    //This code registers functions to be fired when certain events happen.
    //ie This first one registers handleKeyDown on a keydown event. I don't
    //fully understand the false as the third parameter, but it works ;)

    window.addEventListener('mousemove',handleMouseMove,false);
    window.addEventListener('mousedown',handleMouseDown,false);
    window.addEventListener('mouseup',handleMouseUp,false);
    for (var i = 0; i < canvases.length; i++) {
        canvases[i].canvasElm.addEventListener('mousedown',canvases[i].onCanvasMouseDown,false);
        canvases[i].canvasElm.addEventListener('dblclick',canvases[i].onCanvasDoubleClick,false);
    }
}

//General mouse update formula

function updateCanvasMousePositions(evt) {

    //evt contains tons of information. clientX and clientY are the mouse pos
    //relative to the top left hand corner of the canvas, counting positively
    //to the right and down.

    for (var i = 0; i < canvases.length; i++) {
        var scrollSum = new point();
        scrollSum.x = canvases[i].canvasElm.parentNode.scrollLeft;
        scrollSum.y = canvases[i].canvasElm.parentNode.scrollTop;

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
        canvases[i].position = elementPosition(canvases[i].canvasElm);
        canvases[i].mouseX = (evt.clientX)-(canvases[i].position.x)+scrollSum.x;
        canvases[i].mouseY = (evt.clientY)-(canvases[i].position.y)+scrollSum.y;
    }
}

//When the mouse is moved, we update our record of it's position, then 
//redraw the screen.

function handleMouseMove(evt) {
    updateCanvasMousePositions(evt);
    for (var i = 0; i < canvases.length; i++) {
        //We don't want to crash if there's no onMouseMoved specified
        if (canvases[i].onMouseMoved) canvases[i].onMouseMoved();
    }
}

//When the mouse is pressed, we update our record of it's position (seems
//like it would be unnecessary, but sometimes funky shit happens with events,
//so it's better safe than sorry), update our record of whether or not the
//user is clicking.

function handleMouseDown(evt) {
    updateCanvasMousePositions(evt);
    for (var i = 0; i < canvases.length; i++) {
        if (canvases[i].onMouseDown) canvases[i].onMouseDown();
        canvases[i].mouseDown = true;
    }
}

//handleMouseUp is very similar to handleMouseDown. Record mouse position,
//update clicking state.

function handleMouseUp(evt) {
    updateCanvasMousePositions(evt);
    for (var i = 0; i < canvases.length; i++) {
        if (canvases[i].onMouseUp) canvases[i].onMouseUp();
        canvases[i].mouseDown = true;
    }
}
