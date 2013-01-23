//
//********** HTML5 CANVAS OF AWESOMENESS *************
//******************** by kw *************************
//

//Here's the stuff for managing the interface

var workflowCanvas;

var todoManager;

function onWorkflowMouseDown() {
}

function onWorkflowMouseUp() {
}

function hideInstructions() {
    document.getElementById("instructions").style.display = "none";
}

function showInstructions() {
    document.getElementById("instructions").style.display = "block";
}

function onWorkflowCanvasDoubleClick() {
    hideInstructions();
    new TodoItem.basicTodoItem(workflowCanvas,todoManager,workflowCanvas.mouseX,workflowCanvas.mouseY,"Double click me!",true);
}

function onWorkflowMouseMoved() {
    workflowCanvas.draw();
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// On Load Flowchart //////////////////////////////
///////////////////////////////////////////////////////////////////////////

function onLoad() {

    //Initialize the canvases

    workflowCanvas = new Canvas.todoCanvas('workflow');

    //Initialize the todoManager

    todoManager = new TodoManager.manager();

    //Hook mouse movements

    workflowCanvas.onMouseDown = onWorkflowMouseDown;
    workflowCanvas.onMouseMoved = onWorkflowMouseMoved;
    workflowCanvas.onMouseUp = onWorkflowMouseUp;
    workflowCanvas.onCanvasDoubleClick = onWorkflowCanvasDoubleClick;

    //Get our network plugged in
    
    NetworkManager.initialize();
}

//Add a listener to initialize the page when everything has loaded

document.addEventListener("DOMContentLoaded", onLoad,false);
