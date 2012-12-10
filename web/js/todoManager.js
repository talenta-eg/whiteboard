///////////////////////////////////////////////////////////////////////////
///////////////////////////// Todo Manager ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

function todoManager() {

    var div = document.getElementById("todoList");

    this.todoItems = new Array();

    var uber = this;

    this.updateList = function() {

        //Clear the old list

        div.innerHTML = "";

        //Make the list element

        var list = document.createElement('list');
        for (var i = 0; i < uber.todoItems.length; i++) {
            if (uber.todoItems[i].canDo && !uber.todoItems[i].done) {

                //Create the list item

                var listItem = document.createElement('li');

                //Create the editable text box

                var textBox = document.createElement('div');
                textBox.className = "rounded textbox unselectable";
                textBox.innerHTML = uber.todoItems[i].text;
                listItem.appendChild(textBox);

                var todoItem = uber.todoItems[i];

                var cleanupEditable = makeEditable(uber.todoItems[i],textBox,uber.todoItems[i].onDelete,function(editing) {
                    todoItem.editable = !editing;
                    if (!editing) {
                        todoItem.setText(textBox.innerHTML);
                    }
                });

                //Create the done button

                var doneButton = document.createElement('button');
                doneButton.innerHTML = "Done";
                listItem.appendChild(doneButton);
                doneButton.onclick = uber.todoItems[i].toggleDone;

                //Create the delete button

                var deleteButton = document.createElement('button');
                deleteButton.innerHTML = "Delete";
                listItem.appendChild(deleteButton);
                deleteButton.onclick = uber.todoItems[i].onDelete;

                //Append list item

                list.appendChild(listItem);
            }
        }
        div.appendChild(list);
    }

}
