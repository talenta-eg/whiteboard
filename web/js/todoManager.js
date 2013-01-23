///////////////////////////////////////////////////////////////////////////
///////////////////////////// Todo Manager ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

var TodoManager = {};

TodoManager.manager = function() {

    this.todoItems = new Array();

    var uber = this;

    this.addTodo = function(todo) {
        uber.todoItems.push(todo);
        uber.updateList(todo);
    }

    this.removeTodo = function(todo) {

        //Remove all the links

        while (todo.upperLinks.length > 0) {
            todo.upperLinks[0].onDelete(false);
        }

        while (todo.lowerLinks.length > 0) {
            todo.lowerLinks[0].onDelete(false);
        }

        //Remove ourselves only if we are still in the array

        index = uber.todoItems.indexOf(todo);
        if (index != -1) uber.todoItems.splice(index, 1);

        //Update the todo list
        
        uber.updateList(todo);
    }

    this.updateList = function(todo) {

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
                //uber.todoItems[i].div.className = "todoItemBox done";
            }
        }
    }

    this.updateTodoItemDone = function(todo) {
        //Control who can and can't be done yet

        for (var i = 0; i < todo.lowerLinks.length; i++) {
            if (!todo.done && todo.lowerLinks[i].lowerItem.done) {

                //Delete todo arc as a contradiction, because you can't have an item that's
                //done with dependencies that are not done yet

                todo.lowerLinks[i].onDelete();
            }
            else {

                //Tell our lower items to check if they can get done yet, because we just
                //finished

                //We have to check all the items

                uber.updateItemCanDo(todo.lowerLinks[i].lowerItem);
            }
        }
    }

    this.removeLink = function(link,tellNetwork) {
        if (link.upperItem && link.lowerItem) {
            link.todoManager.removeLowerLink(link.upperItem,link);
            link.todoManager.removeUpperLink(link.lowerItem,link);

            //Let NetworkManager know about the our deletion

            if (tellNetwork) {
                NetworkManager.todoItemDependencyRemoved(link.upperItem.id,link.lowerItem.id);
            }
        }
        link.canvas.draw();
        if (link.deleteButton.parentNode) {
            link.deleteButton.parentNode.removeChild(link.deleteButton);
        }
    }

    this.updateItemCanDo = function(todo) {
        var canDo = true;
        for (var i = 0; i < todo.upperLinks.length; i++) {
            if (!todo.upperLinks[i].upperItem.done) {
                canDo = false;
                break;
            }
        }
        todo.setCanDo(canDo);
    }

    this.makeLinkReal = function(link) {
        uber.addLowerLink(link.upperItem,link);
        uber.addUpperLink(link.lowerItem,link);

        //Let NetworkManager know about the new link

        NetworkManager.todoItemDependencyLinked(link.upperItem.id,link.lowerItem.id);
    }

    this.addUpperLink = function(todo,link) {
        todo.upperLinks.push(link);
        if (!link.upperItem.done) {
            if (todo.done) {

                //Delete todo arc, because it's a contradiction to have a done item
                //with a dependency to an item that isn't done yet

                link.onDelete();
            }
            else {

                //Definately can't do todo todo now, because the item that we're newly
                //dependant on isn't done

                todo.setCanDo(false)
            }
        }
    }

    this.addLowerLink = function(todo,link) {
        todo.lowerLinks.push(link);
    }

    this.removeUpperLink = function(todo,link) {

        //Remove ourselves only if we are still in the array

        var index = todo.upperLinks.indexOf(link);
        if (index != -1) todo.upperLinks.splice(index, 1);

        //We're not sure whether todo means we can now be executed, so we
        //need to check all the remaining upper links

        uber.updateItemCanDo(todo);
    }

    this.removeLowerLink = function(todo,link) {

        //Remove ourselves only if we are still in the array

        var index = todo.lowerLinks.indexOf(link);
        if (index != -1) todo.lowerLinks.splice(index, 1);
    }
}
