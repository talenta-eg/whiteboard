///////////////////////////////////////////////////////////////////////////
///////////////////////////// Todo Manager ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

function todoManager() {

    this.todoItems = new Array();

    var uber = this;

    this.updateList = function() {

        //Make the list element

        if (uber.todoItems.length > 0) {
            hideInstructions();
        } else {
            showInstructions();
        }

        for (var i = 0; i < uber.todoItems.length; i++) {
            if (uber.todoItems[i].canDo && !uber.todoItems[i].done) {
            }
            if (uber.todoItems[i].done) {
                uber.todoItems[i].div.className = "todoItemBox done";
            }
        }
    }

}
