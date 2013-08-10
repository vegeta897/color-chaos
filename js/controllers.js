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
        var pixSize = 10, mouseDown = 0, grabbing = false, erasing = false, keyPressed = false, keyUpped = true, colorToPlace = '', pinging = false;
        
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
        // Attempt to get lastPixel from localstorage
        if(localStorageService.get('lastPixel')) {
            $scope.lastPixel = localStorageService.get('lastPixel');
        }
        // Attempt to get verticalHistory from localstorage
        if(localStorageService.get('verticalHistory')) {
            $scope.verticalHistory = localStorageService.get('verticalHistory');
            if($scope.verticalHistory == 'true') { $scope.verticalHistory = true; }
        }
        // Clear the localstorage
        $scope.clearCache = function() {
            localStorageService.clearAll();
            $scope.authed = false;
            $scope.password = '';
        };
        // Update localstorage when an option is changed
        $scope.onOptionChange = function() {
            localStorageService.set('verticalHistory', $scope.verticalHistory);
        };
        
        // Set up our canvas
        var myCanvas = document.getElementById('canvas1');
        var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
        myContext.fillStyle = '#222222'; // Fill the canvas with gray
        myContext.fillRect(0,0,960,800);
        
        jQuery('body').on('contextmenu', '#highlightCanvas', function(e){ // Prevent right-click on canvas
            return false; 
        });
        
        // Align canvas positions
        var alignCanvases = function() {
            jQuery(highCanvas).offset(jQuery(myCanvas).offset()); // Set highCanvas offset to main canvas offset
            jQuery(pingCanvas).offset(jQuery(myCanvas).offset()); // Set pingCanvas offset to main canvas offset
        };

        var highCanvas = document.getElementById('highlightCanvas'); // Define highCanvas for pixel highlighting
        var pingCanvas = document.getElementById('pingCanvas'); // Define pingCanvas for pinging
        var highContext = highCanvas.getContext ? highCanvas.getContext('2d') : null;
        var pingContext = pingCanvas.getContext ? pingCanvas.getContext('2d') : null;
        $timeout(function(){ alignCanvases(); }, 500); // Set its position to match the real canvas
        
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
        
        // Keep track of if the mouse is up or down
        highCanvas.onmousedown = function() { 
            mouseDown = 1; 
            if(event.which == 2) {
                erasing = true;
            }
            return false; 
        };
        highCanvas.onmouseout = highCanvas.onmouseup = function() {
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
        // Checks if there are kept pixels, hides clear button if there are none
        var checkEmptyKept = function() {
            var count = 0;
            for(var key in $scope.keptPixels) {
                if($scope.keptPixels.hasOwnProperty(key)) {
                    count++;
                    break;
                }
            }
            $scope.keeping = (count > 0); // Keeping is true if the count is greater than 0
        };
        checkEmptyKept();
        
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
            checkEmptyKept();
            localStorageService.set('keptPixels', JSON.stringify($scope.keptPixels));
            $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
        };
        // Highlight pixel on canvas when hovering over pool
        $scope.hoverKept = function(colorId) {
            var coords = colorId.split(":");
            highContext.strokeStyle = '#FFFFFF';
            highContext.strokeRect(coords[0]*pixSize-0.5,coords[1]*pixSize-0.5,pixSize+1,pixSize+1);
            highContext.strokeStyle = '#000000';
            highContext.strokeRect(coords[0]*pixSize+0.5,coords[1]*pixSize+0.5,pixSize-1,pixSize-1);
        };
        // Dim pixel on canvas when hovering off pool
        $scope.unhoverKept = function(colorId) {
            var coords = colorId.split(":");
            highContext.clearRect(coords[0]*pixSize-1,coords[1]*pixSize-1,pixSize+2,pixSize+2);
        };
        
        var drawOnMouseDown = function() {
            // If the mouse button is down or the password is incorrect, cancel
            if (jQuery.sha256($scope.password) != '7fff319b30405ee286b1baf1d433ccfd53fecd100f8e46c7b1177da800930e69') return;
            if(event.which == 3) { event.preventDefault(); return; } // If right click pressed
            if(erasing) {
                fireRef.child('pixels').child($scope.overPixel[0] + ":" + $scope.overPixel[1]).set(null);
                return;
            }
            document.getElementById('highlightCanvas').style.cursor = 'none'; // Hide cursor
            dimPixel(); // Dim the pixel being drawn on
            // Write the pixel into Firebase
            var randomColor = {hex:'222222'};
            if(!grabbing) { // If we don't have a color grabbed
                if(event.which == 1) { // If left click pressed
                    for(var i=0; i<3; i++) {
                        randomColor = utility.generate($scope.keptPixels);
                        addLastColor(randomColor);
                    }
                }
                if($scope.overPixel[0] != '-') {
                    if(keyPressed) {
                        for(var k=0; k<3; k++) {
                            randomColor = utility.generate($scope.keptPixels);
                            addLastColor(randomColor);
                        }
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
                    localStorageService.set('lastPixel', JSON.stringify($scope.lastPixel));
                }
            }
            localStorageService.set('keptPixels', JSON.stringify($scope.keptPixels));
            
            $scope.yourChanges++; // Update change count
            localStorageService.set('yourChanges', $scope.yourChanges);
            fireRef.child('meta').child('totalDrawn').once('value', function(realTotal) {
                fireRef.child('meta').child('totalDrawn').set(realTotal.val()+1);
            });
            fireRef.child('meta').child('lastDrawn').set(new Date().getTime());
            grabbing = false;
        };
        
        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            // Get pixel location
            var offset = jQuery(highCanvas).offset();
            var x = Math.floor((e.pageX - offset.left) / pixSize),
                y = Math.floor((e.pageY - offset.top) / pixSize);
            // If the pixel location has changed
            if($scope.overPixel[0] != x || $scope.overPixel[1] != y) {
                document.getElementById('highlightCanvas').style.cursor = 'default'; // Show cursor
                dimPixel(); // Dim the previous pixel
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
                highContext.clearRect($scope.overPixel[0] * pixSize, $scope.overPixel[1] * pixSize, pixSize, pixSize);
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
            highContext.fillStyle = 'rgba(255, 255, 255, 0.15)';
            highContext.fillRect($scope.overPixel[0] * pixSize, $scope.overPixel[1] * pixSize, pixSize, pixSize);
        };

        // Ping a pixel
        var ping = function() {
            if(pinging || $scope.overPixel[0] == '-') { return; }
            pinging = $scope.overPixel;
            fireRef.child('meta').child('pings').child(pinging[0] + ":" + pinging[1]).set(true);
            $timeout(function(){unPing()},1600); // Keep ping for 5 seconds
        };
        // Un-ping a pixel
        var unPing = function() {
            fireRef.child('meta').child('pings').child(pinging[0] + ":" + pinging[1]).set(null);
            pinging = false;
        };
        var drawPing = function(snapshot) {
            var coords = snapshot.name().split(":");
            var my_gradient = pingContext.createRadialGradient(
                coords[0]*pixSize + pixSize/2, coords[1]*pixSize + pixSize/2, 15,
                coords[0]*pixSize + pixSize/2, coords[1]*pixSize + pixSize/2, 0
            );
            my_gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
            my_gradient.addColorStop(0.2, "rgba(255, 255, 255, 1)");
            my_gradient.addColorStop(0.4, "rgba(255, 255, 255, 0)");
            my_gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            pingContext.fillStyle = my_gradient;
            pingContext.beginPath();
            pingContext.arc(coords[0]*pixSize + pixSize/2, coords[1]*pixSize + pixSize/2, 15, 0, 2 * Math.PI, false);
            var cycle = 0;
            function fadePing() {
                if(Math.round(cycle/2) == cycle/2) {
                    pingContext.fill();
                } else {
                    pingContext.clearRect(coords[0] * pixSize - 15 + pixSize/2, coords[1] * pixSize - 15 + pixSize/2, 30, 30);
                }
                cycle++;
                if(cycle >= 8) {
                    clearInterval(pingInt);
                }
            }
            var pingInt = setInterval(function(){fadePing()},200);
            dimPixel();
        };
        var hidePing = function(snapshot) {
            var coords = snapshot.name().split(":");
            pingContext.clearRect(coords[0] * pixSize - 15 + pixSize/2, coords[1] * pixSize - 15 + pixSize/2, 30, 30);
        };
        
        // When the mouse button is pressed (on the highCanvas)
        var overMouseDown = function() {
            jQuery(myCanvas).mousedown(); // Echo the event to the real canvas
        };
        
        jQuery(highCanvas).mousemove(onMouseMove);
        jQuery(highCanvas).mouseout(onMouseOut);
        jQuery(highCanvas).mousedown(overMouseDown); // Will send to real canvas
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
            $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
            myContext.fillStyle = '#222222'; // Canvas bg color
            myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        };
        // Firebase listeners
        fireRef.child('pixels').on('child_added', drawPixel);
        fireRef.child('pixels').on('child_changed', drawPixel);
        fireRef.child('pixels').on('child_removed', clearPixel);
        fireRef.child('meta').child('lastDrawn').on('value', getTotalDrawn);
        fireRef.child('meta').child('totalDrawn').on('value', getTotalDrawn);
        fireRef.child('meta').child('pings').on('child_added', drawPing);
        fireRef.child('meta').child('pings').on('child_removed', hidePing);

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
                case 65:
                    ping();
                    break;
                case 81: // Q
                    keyPressed = true;
                    jQuery(myCanvas).mousedown();
                    break;
                case 87: // W
                    break;
                case 67: // C
                    keyPressed = true;
                    jQuery(myCanvas).mousedown();
                    break;
                case 86: // V
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