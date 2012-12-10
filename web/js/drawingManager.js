///////////////////////////////////////////////////////////////////////////
////////////////////////// Drawing Manager ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

function canvas(id,update) {

    //These variables will hold the HTML5 canvas stuff

    this.ctx;
    this.canvasElm;

    //This is useful for wiping the page efficiently, we don't want to have to
    //go and get the width and height from the DOM every frame.

    this.canvasWidth;
    this.canvasHeight;
    this.canvasOffsetTop;
    this.canvasOffsetLeft;

    //Obviously, these are the state of the current input.

    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;

    //Our guess as to how many pixels to leave for the scrollbars

    this.scrollBarSize = 25;

    //This is the object currently occupying the mouse

    this.currentlyDraggingObject;

    //Here's the array that will render stuff to the canvas. Just add objects with
    //a draw() function to this, and they will end up on the canvas

    this.renderObjects = new Array();

    //Initialize the canvas element

    this.ctx = document.getElementById(id).getContext('2d'); // 2  
    this.canvasElm = document.getElementById(id);  

    //This lets us stretch the canvas to fit our content on it

    this.contentSize = new point(0,0);
    this.absoluteContentSize = new point(0,0);

    this.contentSizePadding = new point(50,50);

    this.size = elementSpace(this.canvasElm);
    this.size.x -= this.scrollBarSize;
    this.size.y -= this.scrollBarSize;

    //Set it to visually scale to fill the parent div

    this.canvasElm.style.width = this.size.x+'px';
    this.canvasElm.style.height = this.size.y+'px';

    //Scale the pixels to match actual size

    this.canvasElm.width = this.canvasElm.offsetWidth;
    this.canvasElm.height = this.canvasElm.offsetWidth;

    this.canvasWidth = this.canvasElm.offsetWidth;
    this.canvasHeight = this.canvasElm.offsetHeight;
    this.canvasOffsetTop = elementPosition(this.canvasElm).y;
    this.canvasOffsetLeft = elementPosition(this.canvasElm).x;

    canvases.push(this);

    var stretchTimer = null;

    //Hack to hold onto 'this' when in functions

    var uber = this;

    //Shrinks or grows to fit content

    this.sizeToContent = function() {
        uber.absoluteContentSize.x = 0;
        uber.absoluteContentSize.y = 0;

        //Each object that keeps a lowerRight point gets counted

        for (var i = 0; i < uber.renderObjects.length; i++) {
            if (uber.renderObjects[i].lowerRight) {

                //Scale the content size based on the position

                if (uber.renderObjects[i].lowerRight.x > uber.absoluteContentSize.x) {
                    uber.absoluteContentSize.x = uber.renderObjects[i].lowerRight.x;
                }
                if (uber.renderObjects[i].lowerRight.y > uber.absoluteContentSize.y) {
                    uber.absoluteContentSize.y = uber.renderObjects[i].lowerRight.y;
                }
            }
        }
        uber.absoluteContentSize.x += uber.contentSizePadding.x;
        uber.absoluteContentSize.y += uber.contentSizePadding.y;
        var delta = new point(uber.absoluteContentSize.x-uber.contentSize.x,uber.absoluteContentSize.y-uber.contentSize.y);
        if (Math.abs(delta.x) + Math.abs(delta.y) > 5 && stretchTimer == null) {
            stretchTimer = window.setInterval(uber.stretchContentTimed,30);
        }

        //Don't bother animating, just jump there

        else if (stretchTimer == null) {
            uber.contentSize.x = uber.absoluteContentSize.x;
            uber.contentSize.y = uber.absoluteContentSize.y;
        }
    }

    //Grows to fit content, much faster than looping all elements every frame

    this.stretchToContent = function(x,y) {
        if (uber.contentSize.x < x + uber.contentSizePadding.x) uber.contentSize.x = x + uber.contentSizePadding.x;
        if (uber.contentSize.y < y + uber.contentSizePadding.y) uber.contentSize.y = y + uber.contentSizePadding.y;

        //Copy the data over to absolute, just in case

        uber.absoluteContentSize.x = uber.contentSize.x;
        uber.absoluteContentSize.y = uber.contentSize.y;
    }

    this.stretchContentTimed = function() {
        var delta = new point(uber.absoluteContentSize.x-uber.contentSize.x,uber.absoluteContentSize.y-uber.contentSize.y);
        uber.contentSize.x += (delta.x)/8;
        uber.contentSize.y += (delta.y)/8;
        if (Math.abs(delta.x) + Math.abs(delta.y) < 15) {
            uber.contentSize.x = uber.absoluteContentSize.x;
            uber.contentSize.y = uber.absoluteContentSize.y;
            window.clearInterval(stretchTimer);

            //Not sure this is necessary

            stretchTimer = null;
        }
        uber.draw();
    }

    this.resetCanvas = function() {

        //Clear the screen, so we don't draw over our old drawings

        uber.size = elementSpace(this.canvasElm);
        uber.size.x -= uber.scrollBarSize;
        uber.size.y -= uber.scrollBarSize;
        if (uber.contentSize.x > uber.size.x) {
            uber.size.x = uber.contentSize.x;
        }
        if (uber.contentSize.y > uber.size.y) {
            uber.size.y = uber.contentSize.y;
        }

        //Set pixels in the canvas

        uber.canvasElm.width = uber.size.x;
        uber.canvasElm.height = uber.size.y;

        //Set the number of pixels in the canvas reference variables

        uber.canvasWidth = uber.size.x;
        uber.canvasHeight = uber.size.y;

        //Set display size

        uber.canvasElm.style.width = uber.size.x+"px";
        uber.canvasElm.style.height = uber.size.y+"px";

        uber.canvasOffsetTop = elementPosition(uber.canvasElm).y;
        uber.canvasOffsetLeft = elementPosition(uber.canvasElm).x;

    }

    this.draw = function() {

        //Clears the canvas

        uber.resetCanvas();

        //This will draw the whole window

        for (var i = 0; i < uber.renderObjects.length; i++) {

            //Each object handles how it is drawn to the screen. To remove
            //an object from the screen, just remove it from this array, and
            //next frame it won't get rendered.

            if (uber.renderObjects[i].draw) {
                uber.renderObjects[i].draw(uber.ctx);
            }
        }
    }

    this.updateCanvas = function() {
        update();
        uber.draw();
    }

    this.containsMouse = function() {
        return (uber.mouseX > 0) && (uber.mouseY > 0) && (uber.mouseX < uber.canvasWidth) && (uber.mouseY < uber.canvasHeight);
    }

    window.addEventListener('resize',this.draw,false);
}

