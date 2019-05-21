/**
 * Simple node class for keeping track of the bare minimum required for rendering.
 */

define([],
function () {

    class Node {
        constructor(id, color, text, x, y){
            this.id = id;
            this.color = color;
            this.text = text;
            this.offset = {};
            this.offset.x = x;
            this.offset.y = y;
            this.parent = null;
            this.child = null;
        }

        copy(){
            return new Node(this.id, this.color, this.text, this.offset.x, this.offset.y);
        }

        equals(node) {
            var thisClass = this;
            if (node.id != thisClass.id) {
                return false;
            }
            if (node.color != thisClass.color) {
                return false;
            }
            if (node.parent != thisClass.parent) {
                return false;
            }
            if (node.child != thisClass.child) {
                return false;
            }
            return true;
        }
    }

    return Node;
});