//
//********** HTML5 CANVAS OF AWESOMENESS *************
//******************** by kw *************************
//

var keys = [];
var canvases = new Array();

//Here's the stuff for managing the interface

var whiteboardPage;
var workflowPage;

var whiteboardCanvas;
var workflowCanvas;

var todoManager;

var currentLine;
var currentFlowLine;

//These all get called by inputManager.js

function onWhiteboardMouseDown() {
}

function onWhiteboardCanvasMouseDown() {
    currentLine = new complexLine(whiteboardCanvas,whiteboardCanvas.mouseX,whiteboardCanvas.mouseY);
}

function onWhiteboardCanvasDoubleClick() {
    new dynamicTextBox(whiteboardCanvas,whiteboardCanvas.mouseX,whiteboardCanvas.mouseY,"Hello");
}

function onWhiteboardMouseUp() {
    currentLine = null;
}

function onWhiteboardMouseMoved() {
    if (!whiteboardCanvas.containsMouse()) currentLine = null;

    if (currentLine) currentLine.addPoint(whiteboardCanvas.mouseX,whiteboardCanvas.mouseY);
    whiteboardCanvas.updateCanvas();
}

function onWorkflowMouseDown() {
}

function onWorkflowMouseUp() {
}

function onWorkflowCanvasDoubleClick() {
    new todoItem(workflowCanvas,todoManager,workflowCanvas.mouseX,workflowCanvas.mouseY,"Double click me!");
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

//Toggle between the whiteboard context and the planner

function toggle() {
    if (whiteboardPage.style.display == "none") {
        whiteboardPage.style.display = "";
        workflowPage.style.display = "none";

        //Need to update size since been hidden

        whiteboardCanvas.draw();
    }
    else {
        whiteboardPage.style.display = "none";
        workflowPage.style.display = "";

        //Need to update size since been hidden

        workflowCanvas.draw();
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// On Load Flowchart //////////////////////////////
///////////////////////////////////////////////////////////////////////////

function onLoad() {

    whiteboardPage = document.getElementById("wbpage");
    workflowPage = document.getElementById("wfpage");

    //Initialize the canvases

    whiteboardCanvas = new canvas('whiteboard',updateWhiteboard,'whiteboardparent');
    workflowCanvas = new canvas('workflow',updateWorkflow,'workflowparent');

    //Initialize the todoManager

    todoManager = new todoManager();

    initializeCanvases();

    //Hook mouse movements

    whiteboardCanvas.onMouseDown = onWhiteboardMouseDown;
    whiteboardCanvas.onMouseMoved = onWhiteboardMouseMoved;
    whiteboardCanvas.onMouseUp = onWhiteboardMouseUp;
    whiteboardCanvas.onCanvasMouseDown = onWhiteboardCanvasMouseDown;
    whiteboardCanvas.onCanvasDoubleClick = onWhiteboardCanvasDoubleClick;

    workflowCanvas.onMouseDown = onWorkflowMouseDown;
    workflowCanvas.onMouseMoved = onWorkflowMouseMoved;
    workflowCanvas.onMouseUp = onWorkflowMouseUp;
    workflowCanvas.onCanvasDoubleClick = onWorkflowCanvasDoubleClick;

    //Call other initializations

    initializeInput();
}

//Add a listener to initialize the page when everything has loaded

document.addEventListener("DOMContentLoaded", onLoad,false);
