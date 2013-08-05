/* Controllers */

angular.module('ColorChaos.controllers', [])
	.controller('ColorGrid', ['$scope', '$timeout', '$filter', 'utility', function($scope, $timeout, $filter, utility) {
        
        $scope.yourChanges = 0; // Tracking how many pixels you've changed
        $scope.lastColors = []; // Tracking your last colors
        
        // Set up some globals
        var pixSize = 10, overPixel = [], mouseDown = 0;

        // Create a reference to the pixel data for our canvas
        var pixelDataRef = new Firebase('https://color-chaos.firebaseio.com');

        // Set up our canvas
        var myCanvas = document.getElementById('canvas1');
        var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        myContext.fillStyle = '#222222'; // Fill the canvas with gray
        myContext.fillRect(0,0,960,800);
        if(myContext == null) {
            alert('Your browser is really old. Get a new one bro');
        }
        var overCanvas = document.getElementById('canvas2'); // Define overCanvas for pixel highlighting
        var overContext = overCanvas.getContext ? overCanvas.getContext('2d') : null;
        jQuery(overCanvas).offset(jQuery(myCanvas).offset()); // Set its position to match the real canvas
        
        // Keep track of if the mouse is up or down
        overCanvas.onmousedown = function() { mouseDown = 1; return false; };
        overCanvas.onmouseout = overCanvas.onmouseup = function() {
            mouseDown = 0; 
        };

        // Disable text selection.
        myCanvas.onselectstart = function() { return false; };

        // Add the drawn pixel color to the lastColors array
        var addLastColor = function(color) {
            if($scope.lastColors.length >= 24) { // Don't exceed 24 last colors
                $scope.lastColors.pop();
            }
            $scope.lastColors.unshift('#'+color);
        }
        
        // Draw a pixel of random color on the mouse's position
        var drawOnMouseDown = function() {
            if (!mouseDown) return; // If the mouse button is down, cancel
            
            // Write the pixel into Firebase
            var randomColor = utility.generate();
            addLastColor(randomColor); // Add to last colors
            pixelDataRef.child(overPixel[0] + ":" + overPixel[1]).set(randomColor);
        };
        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            // Get pixel location
            var offset = jQuery(overCanvas).offset();
            var x = Math.floor((e.pageX - offset.left) / pixSize),
                y = Math.floor((e.pageY - offset.top) / pixSize);
            // If the pixel location has changed
            if(overPixel[0] != x || overPixel[1] != y) {
                dimPixel(); // Dim the last pixel
                overPixel = [x,y]; // Update the pixel location we're now over
                highlightPixel(); // Highlight this pixel
            }
        };
        // Dim the pixel after leaving it
        var dimPixel = function() {
            overContext.clearRect(overPixel[0] * pixSize, overPixel[1] * pixSize, pixSize, pixSize);
        };
        // Highlight the pixel underneath the mouse
        var highlightPixel = function() {
            // Draw the highlighted color pixel
            overContext.fillStyle = "rgba(255, 255, 255, 0.15)";
            overContext.fillRect(overPixel[0] * pixSize, overPixel[1] * pixSize, pixSize, pixSize);
        };
        // When the mouse button is pressed (on the overCanvas)
        var overMouseDown = function() {
            jQuery(myCanvas).mousedown(); // Echo the event to the real canvas
        };
        
        jQuery(overCanvas).mousemove(onMouseMove);
        jQuery(overCanvas).mouseout(dimPixel);
        jQuery(overCanvas).mousedown(overMouseDown); // Will send to real canvas
        jQuery(myCanvas).mousedown(drawOnMouseDown);

        // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately
        // Note that child_added events will be fired for initial pixel data as well
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
            myContext.fillStyle = '#222222'; // Canvas bg color
            myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        };
        pixelDataRef.on('child_added', drawPixel);
        pixelDataRef.on('child_changed', drawPixel);
        pixelDataRef.on('child_removed', clearPixel);

        // Save canvas as PNG image
        $scope.saveToImg = function() {
            console.log('saving!');
            var timestamp = $filter('date')(new Date(), 'yy-MM-dd_H:mm:ss');
            myCanvas.toBlob(function(blob) {
                saveAs(blob, 'canvas-'+timestamp+'.png');
            })
        }
        
        
    }]);