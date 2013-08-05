/* Controllers */

angular.module('ColorChaos.controllers', [])
	.controller('ColorGrid', ['$scope', '$timeout', 'angularFire', 'randomColor', function($scope, $timeout, angularFire, randomColor) {

        $scope.fireColors = {};
        $scope.yourChanges = 0;
        
        var getColors = angularFire('https://color-chaos.firebaseio.com', $scope, 'fireColors', {});
        getColors.then(function() {
            console.log($scope.fireColors);
            
            $scope.initFirebase = function() {
                if(!$scope.fireColors.hasOwnProperty('colors1')) {
                    console.log('initiating firebase!');
                    $scope.fireColors.colors1 = randomColor.initFirebase(80,96); // rows,cols - use 96 cols @ 10px
                }
            }
            $scope.$watch('fireColors', function() {
                console.log('watch event!');
            })
            $scope.changeColor = function(row,index) {
                var edited = randomColor.generate();
                console.log('changing color',row,index,'to',edited);
                $scope.fireColors.colors1[row].colors[index] = edited;
                $scope.yourChanges++;
            }
        })
        
    }])
    .controller('ColorGridLocal', ['$scope', '$timeout', 'randomColor', function($scope, $timeout, randomColor) {

        
        
        // Set up some globals
        var pixSize = 10, lastPoint = null, mouseDown = 0;

        // Create a reference to the pixel data for our drawing.
        var pixelDataRef = new Firebase('https://color-chaos.firebaseio.com');

        // Set up our canvas
        var myCanvas = document.getElementById('canvas1');
        var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        if(myContext == null) {
            alert('Your browser is really old. Get a new one bro');
        }

        // Keep track of if the mouse is up or down.
        myCanvas.onmousedown = function() { mouseDown = 1; return false; };
        myCanvas.onmouseout = myCanvas.onmouseup = function() {
            mouseDown = 0; 
            lastPoint = null;
        };

        // Disable text selection.
        myCanvas.onselectstart = function() { return false; };

        // Draw a line from the mouse's last position to its current position.
        var drawOnMouseDown = function(e) {
            if (!mouseDown) return;

            // Bresenham's line algorithm. We use this to ensure smooth lines are drawn.
            var offset = $('canvas').offset();
            console.log(e.pageX, e.pageY);
            var x1 = Math.floor((e.pageX - offset.left) / pixSize),
                y1 = Math.floor((e.pageY - offset.top) / pixSize);
            
            // Write the pixel into Firebase, or if we are drawing white, remove the pixel.
            pixelDataRef.child(x1 + ":" + y1).set(randomColor.generate());

        };
        $(myCanvas).mousedown(drawOnMouseDown);

        // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
        // Note that child_added events will be fired for initial pixel data as well.
        var drawPixel = function(snapshot) {
            var coords = snapshot.name().split(":");
            myContext.fillStyle = "#" + snapshot.val();
            myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
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