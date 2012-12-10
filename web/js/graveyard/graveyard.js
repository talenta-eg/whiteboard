//Used to be in staticObjects.js
function canvasTextBox(x,y,text) {
    //setup our variables
    this.pos = new point(x,y);
    this.text = text;

    renderObjects.push(this);

    this.draw = function(ctx) {
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(this.text,this.pos.x,this.pos.y);
    }

    this.delete = function() {
        var index = renderObjects.indexOf(this);
        //Remove ourselves only if we are still in the array
        if (index != -1) renderObjects.splice(index, 1);
    }
}

function handleMouseMove(evt) {
    for (int i = 0; i < canvases.length; i++) {
        canvases[i].mouseX = evt.clientX-canvases[i].canvasOffsetLeft;
        canvases[i].mouseY = evt.clientY-canvases[i].canvasOffsetTop;
        canvases[i].onMouseMoved();
        //Checking whether the mouse is contained in the canvas or not
        if (canvases[i].mouseX > 0 && 
            canvases[i].mouseX < canvases[i].canvasWidth &&
            canvases[i].mouseY > 0 &&
            canvases[i].mouseY < canvases[i].canvasWidth) {
                if (canvases[i].mouseDown) {
                    canvases[i].onMouseMoved();
                }
                else {
                    canvases[i].mouseDown = true;
                    //Mouse is entering the canvas clicked
                    canvases[i].onMouseDown();
                }
        }
        else if (canvases[i].mouseDown) {
            canvases[i].mouseDown = false;
            canvases[i].onMouseUp();
        }
    }
}
