/* Services */

angular.module('ColorChaos.services', [])
    .factory('utility', function() {
        var hexes = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        return {
            generate: function() {
                var hexColor = '';
                for(var i = 0; i<6; i++) {
                    var index = Math.floor(Math.random()*16)
                    hexColor = hexColor + hexes[index];
                }
                return hexColor;
            },
            rgbToHex: function rgbToHex(r, g, b) {
                if (r > 255 || g > 255 || b > 255)
                    throw "Invalid color component";
                return ((r << 16) | (g << 8) | b).toString(16);
            }
        }
});