/* Controllers */

angular.module('ColorChaos.controllers', [])
	.controller('ColorGrid', ['$scope', '$timeout', 'utility', function($scope, $timeout, utility) {
        
        $scope.yourChanges = 0; // Tracking how many pixels you've changed
        
        // Set up some globals
        var pixSize = 10, overPixel = [], overColor = '', mouseDown = 0;

        // Create a reference to the pixel data for our drawing.
        var pixelDataRef = new Firebase('https://color-chaos.firebaseio.com');

        // Set up our canvas
        var myCanvas = document.getElementById('canvas1');
        var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        myContext.fillStyle = '#222222'; // Fill the canvas with gray
        myContext.fillRect(0,0,960,800);
        if(myContext == null) {
            alert('Your browser is really old. Get a new one bro');
        }

        // Keep track of if the mouse is up or down.
        myCanvas.onmousedown = function() { mouseDown = 1; return false; };
        myCanvas.onmouseout = myCanvas.onmouseup = function() {
            mouseDown = 0; 
        };

        // Disable text selection.
        myCanvas.onselectstart = function() { return false; };

        // Draw a pixel of random color on the mouse's position
        var drawOnMouseDown = function(e) {
            if (!mouseDown) return;

            var offset = jQuery('canvas').offset();
            var x1 = Math.floor((e.pageX - offset.left) / pixSize),
                y1 = Math.floor((e.pageY - offset.top) / pixSize);
            
            // Write the pixel into Firebase, or if we are drawing white, remove the pixel.
            var randomColor = utility.generate();
            overColor = randomColor;
            pixelDataRef.child(x1 + ":" + y1).set(randomColor);

        };

        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            // Get pixel location
            var offset = jQuery('canvas').offset();
            var x = Math.floor((e.pageX - offset.left) / pixSize),
                y = Math.floor((e.pageY - offset.top) / pixSize);
            // If the pixel location has changed
            if(overPixel[0] != x || overPixel[1] != y) {
                dimPixel(); // Dim the last pixel
                overPixel = [x,y]; // Update the pixel location we're now over
                var overRGB = myContext.getImageData(x*pixSize,y*pixSize,1,1).data; // Update the color we're now over
                overColor = '#' + ("000000" + utility.rgbToHex(overRGB[0],overRGB[1],overRGB[2])).slice(-6);
                highlightPixel(overRGB); // Highlight this pixel
            }
        };
        
        // Dim the pixel after leaving it
        var dimPixel = function() {
            myContext.fillStyle = overColor; // Set color from overColor, which hasn't updated yet
            myContext.fillRect(overPixel[0] * pixSize, overPixel[1] * pixSize, pixSize, pixSize);
        }
        
        // Highlight the pixel underneath the mouse
        var highlightPixel = function(rgb) {
            var highlighted = [];
            for(var i = 0; i<3; i++) { // Brighten the color
                highlighted[i] = rgb[i] + 20;
                if(highlighted[i] > 255) {
                    highlighted[i] = 255;
                }
            }
            // Draw the highlighted color pixel
            myContext.fillStyle = '#' + ("000000" + utility.rgbToHex(highlighted[0],highlighted[1],highlighted[2])).slice(-6);
            myContext.fillRect(overPixel[0] * pixSize, overPixel[1] * pixSize, pixSize, pixSize);
        }
        
        jQuery(myCanvas).mouseout(dimPixel);
        jQuery(myCanvas).mousedown(drawOnMouseDown);
        jQuery(myCanvas).mousemove(onMouseMove);

        // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
        // Note that child_added events will be fired for initial pixel data as well.
        var drawPixel = function(snapshot) {
            var coords = snapshot.name().split(":");
            myContext.fillStyle = "#" + snapshot.val();
            myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
            $timeout(function() {
                $scope.yourChanges++; // Update change count
            })
        };
        var clearPixel = function(snapshot) {
            var coords = snapshot.name().split(":");
            myContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        };
        pixelDataRef.on('child_added', drawPixel);
        pixelDataRef.on('child_changed', drawPixel);
        pixelDataRef.on('child_removed', clearPixel);

    }]);

// firebase drawing demo
//
//// Set up some globals
//var pixSize = 4, lastPoint = null, currentColor = "fc5", mouseDown = 0;
//
//// Create a reference to the pixel data for our drawing.
//var pixelDataRef = getFirebase();
//
//// Add clear handler
//$('#clear').click(function() {
//    $('#drawing-canvas').get(0).getContext('2d').clearRect(0, 0, 100, 150);
//    pixelDataRef.set(null);
//});
//
//// Set up our canvas
//var myCanvas = document.getElementById('drawing-canvas');
//var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
//if (myContext == null) {
//    alert("You must use a browser that supports HTML5 Canvas to run this demo.");
//}
//
//// Keep track of if the mouse is up or down.
//myCanvas.onmousedown = function () { mouseDown = 1; return false; };
//myCanvas.onmouseout = myCanvas.onmouseup = function () {
//    mouseDown = 0, lastPoint = null;
//};
//
//// Disable text selection.
//myCanvas.onselectstart = function() { return false; };
//
//// Draw a line from the mouse's last position to its current position.
//var drawLineOnMouseMove = function(e) {
//    if (!mouseDown) return;
//
//    // Bresenham's line algorithm. We use this to ensure smooth lines are drawn.
//    var offset = $('canvas').offset();
//    var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
//        y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
//    var x0 = (lastPoint == null) ? x1 : lastPoint[0];
//    var y0 = (lastPoint == null) ? y1 : lastPoint[1];
//    var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
//    var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
//    while (true) {
//        // Write the pixel into Firebase, or if we are drawing white, remove the pixel.
//        pixelDataRef.child(x0 + ":" + y0).set(currentColor === "fff" ? null : currentColor);
//
//        if (x0 == x1 && y0 == y1) break;
//        var e2 = 2 * err;
//        if (e2 > -dy) {
//            err = err - dy;
//            x0 = x0 + sx;
//        }
//        if (e2 < dx) {
//            err = err + dx;
//            y0 = y0 + sy;
//        }
//    }
//    lastPoint = [x1, y1];
//}
//$(myCanvas).mousemove(drawLineOnMouseMove);
//$(myCanvas).mousedown(drawLineOnMouseMove);
//
//// Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
//// Note that child_added events will be fired for initial pixel data as well.
//var drawPixel = function(snapshot) {
//    var coords = snapshot.name().split(":");
//    myContext.fillStyle = "#" + snapshot.val();
//    myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
//}
//var clearPixel = function(snapshot) {
//    var coords = snapshot.name().split(":");
//    myContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
//}
//pixelDataRef.on('child_added', drawPixel);
//pixelDataRef.on('child_changed', drawPixel);
//pixelDataRef.on('child_removed', clearPixel);