/* Services */

angular.module('ColorChaos.services', [])
    .factory('utility', function() {
        var hexes = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        return {
            generateLight: function() {
                var hexColor = '';
                var bit2 = true;
                for(var i = 0; i<6; i++) {
                    var index = 0;
                    if(bit2) {
                        index = Math.floor(Math.random()*11+5)
                        bit2 = false;
                    } else {
                        index = Math.floor(Math.random()*16)
                        bit2 = true;
                    }
                    hexColor = hexColor + hexes[index];
                }
                console.log(hexColor);
                return hexColor;
            },
            generateDark: function() {
                var hexColor = '';
                var bit2 = true;
                for(var i = 0; i<6; i++) {
                    var index = 0;
                    if(bit2) {
                        index = Math.floor(Math.random()*5)
                        bit2 = false;
                    } else {
                        index = Math.floor(Math.random()*16)
                        bit2 = true;
                    }
                    hexColor = hexColor + hexes[index];
                }
                console.log(hexColor);
                return hexColor;
            },
            rgbToHex: function rgbToHex(r, g, b) {
                if (r > 255 || g > 255 || b > 255)
                    throw "Invalid color component";
                return ((r << 16) | (g << 8) | b).toString(16);
            }
        }
});