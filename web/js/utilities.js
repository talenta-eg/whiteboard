///////////////////////////////////////////////////////////////////////////
////////////////////////////// Utilities //////////////////////////////////
///////////////////////////////////////////////////////////////////////////

var Utilities = {};

Utilities.getNumericStyleProperty = function(style, prop){
    return parseInt(style.getPropertyValue(prop),10) ;
}

Utilities.elementBorders = function(e) {
    var top = 0, bottom = 0, left = 0, right = 0;
    var style = getComputedStyle(e,null) ;

    //Get the borders

    top = Utilities.getNumericStyleProperty(style,"border-top-width") ;
    left = Utilities.getNumericStyleProperty(style,"border-left-width") ;
    bottom = Utilities.getNumericStyleProperty(style,"border-bottom-width") ;
    right = Utilities.getNumericStyleProperty(style,"border-right-width") ;
    
    //Add the padding

    top += Utilities.getNumericStyleProperty(style,"padding-top") ;
    left += Utilities.getNumericStyleProperty(style,"padding-left") ;
    bottom += Utilities.getNumericStyleProperty(style,"padding-bottom") ;
    right += Utilities.getNumericStyleProperty(style,"padding-right") ;

    //Return the result as an anonymous object
    
    return { top: top, bottom: bottom, left: left, right: right };
}

Utilities.elementShadows = function(e) {

    //TODO: Make this return the shadow size by parsing the CSS

    return { x:0,y:0 };
}

Utilities.elementPosition = function(e) {
    var x = 0, y = 0;
    var inner = true ;

    //Do this for this and all parent elements

    do {

        //Add the position of this layer element

        x += e.offsetLeft;
        y += e.offsetTop;

        //Get border

        var style = getComputedStyle(e,null) ;
        var borderTop = Utilities.getNumericStyleProperty(style,"border-top-width") ;
        var borderLeft = Utilities.getNumericStyleProperty(style,"border-left-width") ;
        y += borderTop ;
        x += borderLeft ;

        //Get padding, but only if this is the first element we check

        if (inner){
          var paddingTop = Utilities.getNumericStyleProperty(style,"padding-top") ;
          var paddingLeft = Utilities.getNumericStyleProperty(style,"padding-left") ;
          y += paddingTop ;
          x += paddingLeft ;
        }
        inner = false ;
    } while (e = e.offsetParent);

    //Return the result as an anonymous object

    return { x: x, y: y };
}

Utilities.elementSpace = function(e) {
    var x = 0, y = 0;
    
    //Get the height of the parent element

    var parentStyle = getComputedStyle(e.parentNode);
    x = Utilities.getNumericStyleProperty(parentStyle,"width");
    y = Utilities.getNumericStyleProperty(parentStyle,"height");
    
    //Account for borders

    var borders = Utilities.elementBorders(e);
    y -= borders.top + borders.bottom;
    x -= borders.left + borders.right;

    return { x: x, y: y };
}

Utilities.elementSize = function(e) {
    var x = 0, y = 0;
    
    //Get the offset (absolute) size

    x += e.parentNode.offsetWidth;
    y += e.parentNode.offsetHeight;

    //Account for borders

    var borders = elementBorders(e);
    y -= borders.top + borders.bottom;
    x -= borders.left + borders.right;

    return { x: x, y: y };
}
