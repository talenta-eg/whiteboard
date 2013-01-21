//
//********** HTML5 CANVAS OF AWESOMENESS *************
//******************** by kw *************************
//

var keys = [];
var canvases = new Array();

//Here's the stuff for managing the interface

var workflowPage;

var workflowCanvas;

var todoManager;

function onWorkflowMouseDown() {
}

function onWorkflowMouseUp() {
}

function onWorkflowCanvasDoubleClick() {
    new todoItem(workflowCanvas,todoManager,workflowCanvas.mouseX,workflowCanvas.mouseY,"Double click me!",true);
}

function onWorkflowMouseMoved() {
    workflowCanvas.updateCanvas();
}

function onKeyDown(key) {
}

function onKeyUp(key) {
}

function initializeCanvases() {
}

//Gets called everytime a change needs to be rendered on the whiteboard. Right now, it's an empty callback

function updateWhiteboard() {
}

//Gets called everytime a change needs to be rendered on the workflow. Right now, it's an empty callback

function updateWorkflow() {
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// On Load Flowchart //////////////////////////////
///////////////////////////////////////////////////////////////////////////

function onLoad() {

    //Hello there Git. I know you see me.

    workflowPage = document.getElementById("wfpage");

    //Initialize the canvases

    workflowCanvas = new canvas('workflow',updateWorkflow,'workflowparent');

    //Initialize the todoManager

    todoManager = new todoManager();

    initializeCanvases();

    //Hook mouse movements

    workflowCanvas.onMouseDown = onWorkflowMouseDown;
    workflowCanvas.onMouseMoved = onWorkflowMouseMoved;
    workflowCanvas.onMouseUp = onWorkflowMouseUp;
    workflowCanvas.onCanvasDoubleClick = onWorkflowCanvasDoubleClick;

    //Call other initializations

    initializeInput();

    //Get our network plugged in
    
    NetworkManager.initialize();
}

//Add a listener to initialize the page when everything has loaded

document.addEventListener("DOMContentLoaded", onLoad,false);
