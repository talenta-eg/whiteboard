var Widget = {};

/**
 * A widget that is just an editable text box
 */
Widget.textWidget = function(parentDiv,todo,text) {
    todo.text = text;
    todo.editable = true;

    //Create the editable text box

    todo.textBox = document.createElement('div');
    todo.textBox.className = "todoItemContent";
    todo.textBox.innerHTML = todo.text;
    parentDiv.appendChild(todo.textBox);

    //This is the callback that makeEditable gives us, so we can know when the
    //editable text is being touched by the user, and respond accordingly

    todo.onEditStateChange = function(editing) {
        todo.draggable = !editing;
        if (!editing) {
            todo.text = todo.textBox.innerHTML;
            todo.todoManager.updateList(todo);

            //Tell NetworkManager that we've been edited
            NetworkManager.itemEdited(todo.id,todo.textBox.text);
        }
        //Update the lines on the screen, because this often resizes the box
        todo.updateLinks();
        todo.canvas.draw();
    }

    //Add the editable text box behavior to this widget

    todo.cleanupFunctions.push(makeEditable(todo,todo.textBox,todo.onDelete,todo.onEditStateChange));

    todo.ignoreNetworkSetText = function(text) {
        todo.text = text;
        todo.textBox.innerHTML = text;
        todo.todoManager.updateList(todo);

        //This is the hidden variable in makeEditable to save what text to use
        //TODO: This is totally a hack, need a cleaner interface with makeEditable
        //so that this isn't necessary

        todo.textBox.text = text;

        //Update the lines on the screen position, because text change often resizes the box

        todo.updateLinks();
        todo.canvas.draw();
    }

    todo.setText = function(text) {
        todo.ignoreNetworkSetText(text);

        //Alert the network of the change
        NetworkManager.itemEdited(todo.id,todo.textBox.text);
    }
}

