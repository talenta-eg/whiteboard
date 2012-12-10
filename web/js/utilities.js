///////////////////////////////////////////////////////////////////////////
////////////////////////////// Utilities //////////////////////////////////
///////////////////////////////////////////////////////////////////////////

function getNumericStyleProperty(style, prop){
    return parseInt(style.getPropertyValue(prop),10) ;
}

function elementBorders(e) {
    var top = 0, bottom = 0, left = 0, right = 0;
    var style = getComputedStyle(e,null) ;

    //Get the borders

    top = getNumericStyleProperty(style,"border-top-width") ;
    left = getNumericStyleProperty(style,"border-left-width") ;
    bottom = getNumericStyleProperty(style,"border-bottom-width") ;
    right = getNumericStyleProperty(style,"border-right-width") ;
    
    //Add the padding

    top += getNumericStyleProperty(style,"padding-top") ;
    left += getNumericStyleProperty(style,"padding-left") ;
    bottom += getNumericStyleProperty(style,"padding-bottom") ;
    right += getNumericStyleProperty(style,"padding-right") ;

    //Return the result as an anonymous object
    
    return { top: top, bottom: bottom, left: left, right: right };
}

function elementShadows(e) {

    //TODO: Make this return the shadow size by parsing the CSS

    return { x:0,y:0 };
}

function elementPosition(e) {
    var x = 0, y = 0;
    var inner = true ;

    //Do this for this and all parent elements

    do {

        //Add the position of this layer element

        x += e.offsetLeft;
        y += e.offsetTop;

        //Get border

        var style = getComputedStyle(e,null) ;
        var borderTop = getNumericStyleProperty(style,"border-top-width") ;
        var borderLeft = getNumericStyleProperty(style,"border-left-width") ;
        y += borderTop ;
        x += borderLeft ;

        //Get padding, but only if this is the first element we check

        if (inner){
          var paddingTop = getNumericStyleProperty(style,"padding-top") ;
          var paddingLeft = getNumericStyleProperty(style,"padding-left") ;
          y += paddingTop ;
          x += paddingLeft ;
        }
        inner = false ;
    } while (e = e.offsetParent);

    //Return the result as an anonymous object

    return { x: x, y: y };
}

function elementSpace(e) {
    var x = 0, y = 0;
    
    //Get the height of the parent element

    var parentStyle = getComputedStyle(e.parentNode);
    x = getNumericStyleProperty(parentStyle,"width");
    y = getNumericStyleProperty(parentStyle,"height");
    
    //Account for borders

    var borders = elementBorders(e);
    y -= borders.top + borders.bottom;
    x -= borders.left + borders.right;

    return { x: x, y: y };
}

function elementSize(e) {
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
