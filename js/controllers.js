/* Controllers */

angular.module('ColorChaos.controllers', [])
	.controller('ColorGrid', ['$scope', '$timeout', '$filter', 'utility', function($scope, $timeout, $filter, utility) {
        
        $scope.yourChanges = 0; // Tracking how many pixels you've changed
        $scope.lastColors = []; // Tracking your last colors
        $scope.overPixel = ['-','-']; // Tracking your coordinates
        var pixSize = 10, mouseDown = 0;

        // Create a reference to the pixel data for our canvas
        var pixelDataRef = new Firebase('https://color-chaos.firebaseio.com/canvas1');
        
        // Get the totalDrawn Amount
        var getTotalDrawn = function() {
            pixelDataRef.child('meta').once('value', function(data) {
                $scope.$apply(function() {
                    $scope.allChanges = parseInt(data.val().totalDrawn);
                    var utcSeconds = data.val().lastDrawn;
                    $scope.lastChange = new Date(utcSeconds);
                });
            });
        };
        getTotalDrawn();
        
        
        // Set up our canvas
        var myCanvas = document.getElementById('canvas1');
        var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        myContext.fillStyle = '#222222'; // Fill the canvas with gray
        myContext.fillRect(0,0,960,800);
        if(myContext == null) {
            alert('Your browser is really old. Get a new one bro');
        }
        
        // Align canvas positions
        var alignCanvases = function() {
            jQuery(overCanvas).offset(jQuery(myCanvas).offset()); // Set overCanvas offset to main canvas offset
        };

        var overCanvas = document.getElementById('canvas2'); // Define overCanvas for pixel highlighting
        var overContext = overCanvas.getContext ? overCanvas.getContext('2d') : null;
        $timeout(function(){
            alignCanvases();
        }, 500); // Set its position to match the real canvas
        
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
        };
        
        // Draw a pixel of random color on the mouse's position
        var drawOnMouseDown = function() {
            if (!mouseDown) return; // If the mouse button is down, cancel
            dimPixel(); // Dim the pixel being drawn on
            // Write the pixel into Firebase
            var randomColor = utility.generate();
            pixelDataRef.child('pixels').child($scope.overPixel[0] + ":" + $scope.overPixel[1]).set(randomColor);
            pixelDataRef.child('meta').child('totalDrawn').set($scope.allChanges+1);
            pixelDataRef.child('meta').child('lastDrawn').set(new Date().getTime());
            $scope.$apply(function() {
                addLastColor(randomColor); // Add to last colors
                $scope.yourChanges++; // Update change count
                getTotalDrawn();
            });
        };
        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            // Get pixel location
            var offset = jQuery(overCanvas).offset();
            var x = Math.floor((e.pageX - offset.left) / pixSize),
                y = Math.floor((e.pageY - offset.top) / pixSize);
            // If the pixel location has changed
            if($scope.overPixel[0] != x || $scope.overPixel[1] != y) {
                dimPixel(); // Dim the last pixel
                $scope.$apply(function() {
                    $scope.overPixel = [x,y]; // Update the pixel location we're now over
                });
                highlightPixel(); // Highlight this pixel
            }
        };
        // Dim the pixel after leaving it
        var dimPixel = function() {
            if($scope.overPixel[0] != '-') {
                overContext.clearRect($scope.overPixel[0] * pixSize, $scope.overPixel[1] * pixSize, pixSize, pixSize);
            }
        };
        var onMouseOut = function() {
            dimPixel();
            $scope.$apply(function() {
                $scope.overPixel = ['-','-'];
            });
        };
        
        // Highlight the pixel underneath the mouse
        var highlightPixel = function() {
            // Draw the highlighted color pixel
            overContext.fillStyle = "rgba(255, 255, 255, 0.15)";
            overContext.fillRect($scope.overPixel[0] * pixSize, $scope.overPixel[1] * pixSize, pixSize, pixSize);
        };
        // When the mouse button is pressed (on the overCanvas)
        var overMouseDown = function() {
            jQuery(myCanvas).mousedown(); // Echo the event to the real canvas
        };
        
        jQuery(overCanvas).mousemove(onMouseMove);
        jQuery(overCanvas).mouseout(onMouseOut);
        jQuery(overCanvas).mousedown(overMouseDown); // Will send to real canvas
        jQuery(myCanvas).mousedown(drawOnMouseDown);
        jQuery(window).resize(alignCanvases); // Re-align canvases on window resize

        // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately
        // Note that child_added events will be fired for initial pixel data as well
        var drawPixel = function(snapshot) {
            getTotalDrawn();
            var coords = snapshot.name().split(":");
            myContext.fillStyle = "#" + snapshot.val();
            myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        };
        // Erase a pixel
        var clearPixel = function(snapshot) {
            var coords = snapshot.name().split(":");
            myContext.fillStyle = '#222222'; // Canvas bg color
            myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        };
        // Firebase listeners
        pixelDataRef.child('pixels').on('child_added', drawPixel);
        pixelDataRef.child('pixels').on('child_changed', drawPixel);
        pixelDataRef.child('pixels').on('child_removed', clearPixel);

        // Save canvas as PNG image
        $scope.saveToImg = function() {
            console.log('saving!');
            var timestamp = $filter('date')(new Date(), 'yy-MM-dd_H:mm:ss');
            myCanvas.toBlob(function(blob) {
                saveAs(blob, 'canvas-'+timestamp+'.png');
            })
        }
        
        
    }]);