/* Controllers */

angular.module('ColorChaos.controllers', [])
	.controller('ColorGrid', ['$scope', '$timeout', '$filter', 'localStorageService', 'utility', function($scope, $timeout, $filter, localStorageService, utility) {
        
        $scope.yourChanges = 0; // Tracking how many pixels you've changed
        $scope.lastColors = []; // Tracking your last colors
        $scope.overPixel = ['-','-']; // Tracking your coordinates'
        $scope.lastPixel = ['-','-']; // Tracking last pixel placed coordinates
        $scope.password = '';
        $scope.keptPixels = {}; // Tracking pixels kept
        $scope.keeping = false;
        var pixSize = 10, mouseDown = 0, grabbing = false, erasing = false, keyPressed = false, keyUpped = true, colorToPlace = '';
        
        // Authentication
        $scope.authenticate = function() {
            if(jQuery.sha256($scope.password) === '7fff319b30405ee286b1baf1d433ccfd53fecd100f8e46c7b1177da800930e69') {
                localStorageService.set('password', $scope.password);
                localStorageService.set()
                $scope.authed = true;
            }
        };
     //   localStorageService.remove('keptPixels');
        // Attempt auth if user has a password in his localstorage
        if(localStorageService.get('password')) {
            $scope.password = localStorageService.get('password');
            $scope.authenticate(); // Check for auth
        }
        // Attempt to get yourChanges count from localstorage
        if(localStorageService.get('yourChanges')) {
            $scope.yourChanges = localStorageService.get('yourChanges');
        }
        // Attempt to get keptPixels from localstorage
        if(localStorageService.get('keptPixels')) {
            $scope.keptPixels = localStorageService.get('keptPixels');
        }
        // Clear the localstorage
        $scope.clearCache = function() {
            localStorageService.clearAll();
            $scope.authed = false;
            $scope.password = '';
        };

        // Create a reference to the pixel data for our canvas
        var fireRef = new Firebase('https://color-chaos.firebaseio.com/canvas1');
        
        // Get the totalDrawn Amount
        var getTotalDrawn = function() {
            fireRef.child('meta').once('value', function(data) {
                $timeout(function() {
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
        
        jQuery('body').on('contextmenu', '#canvas2', function(e){ // Prevent right-click on canvas
            return false; 
        });
        
        // Align canvas positions
        var alignCanvases = function() {
            jQuery(overCanvas).offset(jQuery(myCanvas).offset()); // Set overCanvas offset to main canvas offset
        };

        var overCanvas = document.getElementById('canvas2'); // Define overCanvas for pixel highlighting
        var overContext = overCanvas.getContext ? overCanvas.getContext('2d') : null;
        $timeout(function(){ alignCanvases(); }, 500); // Set its position to match the real canvas
           
        // Keep track of if the mouse is up or down
        overCanvas.onmousedown = function() { 
            mouseDown = 1; 
            if(event.which == 2) {
                erasing = true;
            }
            return false; 
        };
        overCanvas.onmouseout = overCanvas.onmouseup = function() {
            if(event.which == 2) {
                erasing = false;
            }
            mouseDown = 0; 
        };

        // Disable text selection.
        myCanvas.onselectstart = function() { return false; };

        // Add the drawn pixel color to the lastColors array
        var addLastColor = function(color) {
            $timeout(function() {
                if($scope.lastColors.length >= 24) { // Don't exceed 24 last colors
                    $scope.lastColors.pop();
                }
                $scope.lastColors.unshift(color);
            });
        };

        $scope.grabColor = function(c) {
            if(typeof c == 'number') {
                if($scope.lastColors[c]) {
                    grabbing = true;
                    colorToPlace = $scope.lastColors[c];
                    jQuery(myCanvas).mousedown();
                }
            } else {
                for(var i = 0; i<$scope.lastColors.length; i++) {
                    if($scope.lastColors[i] == c) {
                        grabbing = true;
                        colorToPlace = c;
                        jQuery(myCanvas).mousedown();
                        break;
                    }
                }
            }
        };
        // Clear out kept pixels pool
        $scope.clearKept = function() {
            $scope.keptPixels = {};
            localStorageService.set('keptPixels', JSON.stringify($scope.keptPixels));
            $scope.keeping = false;
            $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
        };
        // Remove the clicked color from the pool
        $scope.removeKept = function(colorId) {
            $scope.unhoverKept(colorId); // Dim the pixel
            delete $scope.keptPixels[colorId];
            localStorageService.set('keptPixels', JSON.stringify($scope.keptPixels));
            $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
        };
        // Highlight pixel on canvas when hovering over pool
        $scope.hoverKept = function(colorId) {
            var coords = colorId.split(":");
            overContext.strokeStyle = '#FFFFFF';
            overContext.strokeRect(coords[0]*pixSize-0.5,coords[1]*pixSize-0.5,pixSize+1,pixSize+1);
            overContext.strokeStyle = '#000000';
            overContext.strokeRect(coords[0]*pixSize+0.5,coords[1]*pixSize+0.5,pixSize-1,pixSize-1);
        };
        // Dim pixel on canvas when hovering off pool
        $scope.unhoverKept = function(colorId) {
            var coords = colorId.split(":");
            overContext.clearRect(coords[0]*pixSize-1,coords[1]*pixSize-1,pixSize+2,pixSize+2);
        };
        
        var drawOnMouseDown = function() {
            // If the mouse button is down or the password is incorrect, cancel
            if (jQuery.sha256($scope.password) != '7fff319b30405ee286b1baf1d433ccfd53fecd100f8e46c7b1177da800930e69') return; 
            dimPixel(); // Dim the pixel being drawn on
            document.getElementById('canvas2').style.cursor = 'none'; // Hide cursor
            // Write the pixel into Firebase
            var randomColor = {hex:'222222'};
            if(!grabbing) { // If we don't have a color grabbed
                switch(event.which) { // Figure out which mouse button we're pressing
                    case 1:
                        // left
                        for(var i=0; i<3; i++) {
                            randomColor = utility.generateLight($scope.keptPixels);
                            addLastColor(randomColor);
                        }
                        break;
                    case 2:
                        event.preventDefault();
                        // middle
                        break;
                    case 3:
                        event.preventDefault();
                        // right
                        for(var j=0; j<3; j++) {
                            randomColor = utility.generateDark($scope.keptPixels);
                            addLastColor(randomColor);
                        }
                        break;
                    default:
                        // empty
                }
                if($scope.overPixel[0] != '-') {
                    switch(keyPressed) {
                        case 'light':
                            for(var k=0; k<3; k++) {
                                randomColor = utility.generateLight($scope.keptPixels);
                                addLastColor(randomColor);
                            }
                            break;
                        case 'dark':
                            for(var l=0; l<3; l++) {
                                randomColor = utility.generateDark($scope.keptPixels);
                                addLastColor(randomColor);
                            }
                            break;
                        default:
                        //empty
                    }
                    keyPressed = false;
                } else {
                    return;
                }
                colorToPlace = randomColor;
            }
            if(($scope.lastPixel[0] != $scope.overPixel[0] || $scope.lastPixel[1] != $scope.overPixel[1]) && !grabbing) // If we're on a new pixel
            {
                $scope.lastColors = [];
            }
            if(event.which != 2) {
                $scope.keeping = true;
            }
            if(grabbing) {
                fireRef.child('pixels').child($scope.lastPixel[0] + ":" + $scope.lastPixel[1]).set(colorToPlace.hex);
                if(colorToPlace.hasOwnProperty('hsv')) {
                    $scope.keptPixels[$scope.lastPixel[0] + ":" + $scope.lastPixel[1]] = colorToPlace;
                    $scope.keptPixels[$scope.lastPixel[0] + ":" + $scope.lastPixel[1]].id = $scope.lastPixel[0] + ":" + $scope.lastPixel[1];
                }
            } else {
                fireRef.child('pixels').child($scope.overPixel[0] + ":" + $scope.overPixel[1]).set(colorToPlace.hex);
                if(colorToPlace.hasOwnProperty('hsv')) {
                    $scope.keptPixels[$scope.overPixel[0] + ":" + $scope.overPixel[1]] = colorToPlace;
                    $scope.keptPixels[$scope.overPixel[0] + ":" + $scope.overPixel[1]].id = $scope.overPixel[0] + ":" + $scope.overPixel[1];
                    $scope.lastPixel = [$scope.overPixel[0],$scope.overPixel[1]];
                }
            }
            localStorageService.set('keptPixels', JSON.stringify($scope.keptPixels));
            if(!erasing) {
                $scope.yourChanges++; // Update change count
                localStorageService.set('yourChanges', $scope.yourChanges);
                fireRef.child('meta').child('totalDrawn').once('value', function(realTotal) {
                    fireRef.child('meta').child('totalDrawn').set(realTotal.val()+1);
                });
            } else {
                delete $scope.keptPixels[$scope.overPixel[0] + ":" + $scope.overPixel[1]];
                localStorageService.set('keptPixels', JSON.stringify($scope.keptPixels));
                $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
            }
            fireRef.child('meta').child('lastDrawn').set(new Date().getTime());
            grabbing = false;
        };
        
        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            // Get pixel location
            var offset = jQuery(overCanvas).offset();
            var x = Math.floor((e.pageX - offset.left) / pixSize),
                y = Math.floor((e.pageY - offset.top) / pixSize);
            // If the pixel location has changed
            if($scope.overPixel[0] != x || $scope.overPixel[1] != y) {
                document.getElementById('canvas2').style.cursor = 'default'; // Show cursor
                dimPixel(); // Dim the last pixel
                $scope.$apply(function() {
                    if($scope.keptPixels.hasOwnProperty($scope.overPixel[0] + ":" + $scope.overPixel[1])) {
                        $scope.keptPixels[$scope.overPixel[0] + ":" + $scope.overPixel[1]].hover = false;
                    }
                    if($scope.keptPixels.hasOwnProperty(x + ":" + y)) {
                        $scope.keptPixels[x + ":" + y].hover = true;
                    }
                    
                    $scope.overPixel = [x,y]; // Update the pixel location we're now over
                });
                if(erasing) {
                    jQuery(myCanvas).mousedown();
                }
                highlightPixel(); // Highlight this pixel
            }
        };
        // Dim the pixel after leaving it
        var dimPixel = function() {
            if($scope.overPixel[0] != '-') {
                overContext.clearRect($scope.overPixel[0] * pixSize, $scope.overPixel[1] * pixSize, pixSize, pixSize);
            }
        };
        // When the mouse leaves the canvas
        var onMouseOut = function() {
            dimPixel();
            $scope.$apply(function() {
                $scope.overPixel = ['-','-'];
            });
        };
        
        // Highlight the pixel underneath the mouse
        var highlightPixel = function() {
            // Draw the highlighted color pixel
            overContext.fillStyle = 'rgba(255, 255, 255, 0.15)';
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
        fireRef.child('pixels').on('child_added', drawPixel);
        fireRef.child('pixels').on('child_changed', drawPixel);
        fireRef.child('pixels').on('child_removed', clearPixel);
        fireRef.child('meta').on('child_changed', getTotalDrawn);

        // Save canvas as PNG image
        $scope.saveToImg = function() {
            var timestamp = $filter('date')(new Date(), 'yy-MM-dd_H:mm:ss');
            myCanvas.toBlob(function(blob) {
                saveAs(blob, 'canvas-'+timestamp+'.png');
            })
        };
        
        var onKeyDown = function(e) {
            if(!keyUpped) { return; }
            keyUpped = false;
            switch (e.which) {
                case 49: // 49 to 57 and 48 are number keys
                    $scope.grabColor(0);
                    break;
                case 50:
                    $scope.grabColor(1);
                    break;
                case 51:
                    $scope.grabColor(2);
                    break;
                case 52:
                    $scope.grabColor(3);
                    break;
                case 53:
                    $scope.grabColor(4);
                    break;
                case 54:
                    $scope.grabColor(5);
                    break;
                case 55:
                    $scope.grabColor(6);
                    break;
                case 56:
                    $scope.grabColor(7);
                    break;
                case 57:
                    $scope.grabColor(8);
                    break;
                case 48:
                    $scope.grabColor(9);
                    break;
                case 81: // Q
                    keyPressed = 'light';
                    jQuery(myCanvas).mousedown();
                    break;
                case 87: // W
                    keyPressed = 'dark';
                    jQuery(myCanvas).mousedown();
                    break;
                case 67: // C
                    keyPressed = 'light';
                    jQuery(myCanvas).mousedown();
                    break;
                case 86: // V
                    keyPressed = 'dark';
                    jQuery(myCanvas).mousedown();
                    break;
            }
        };

        jQuery(window).keydown(onKeyDown);
        jQuery(window).keyup(function() { keyUpped = true; })
        
    }])
    .controller('Jukebox', ['$scope', '$timeout', 'localStorageService', 'utility', function($scope, $timeout, localStorageService, utility) {

        // Create a reference to the pixel data for our canvas
        var fireRef = new Firebase('https://color-chaos.firebaseio.com/canvas1');
        
        var addToPlaylist = function() {
            fireRef.child('playlist').once('value', function(data) {
                if(Object.keys(data.val()).length > 0) {
                    $scope.playlist = data.val();
                    var firstVid;
                    for(var vid in $scope.playlist) {
                        var utcSeconds = $scope.playlist[vid].addedOn;
                        $scope.playlist[vid].addedOn = new Date(utcSeconds);
                        if(!firstVid) { firstVid = $scope.playlist[vid]; }
                    }
                    $scope.nowPlaying = firstVid;
                }
            });
        };

        var waitForPlayer = function() {
            checkPlayerReady();
        };

        var checkPlayerReady = function() {
            if(ytplayer) {
                console.log('player ready');
                console.log('not playing!');
                //    ytplayer.playVideo();
            } else {
                console.log('waiting more');
                $timeout(waitForPlayer,200);
            }

        };

        checkPlayerReady();

        fireRef.child('playlist').on('child_added', addToPlaylist);

        $scope.addVideo = function(url) {

            var re = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            if (url.match(re)) {
                fireRef.child('playlist').push({
                    url: url,
                    addedOn: new Date().getTime()
                });
            }
            $scope.videoInputText = ''; // Blank out input
        };
    }]);