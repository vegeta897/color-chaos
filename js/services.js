/* Services */

angular.module('ColorChaos.services', [])
    .factory('randomColor', function() {
        var hexes = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        return {
            generate: function() {
                var hexColor = '#';
                for(var i = 0; i<6; i++) {
                    var index = Math.floor(Math.random()*16)
                    hexColor = hexColor + hexes[index];
                }
                return hexColor;
            },
            initFirebase: function(rows,cols) {
                var fireObject = {};
                for(var i = 0; i<rows; i++) {
                    var rowColors = [];
                    for(var j = 0; j<cols; j++) {
                        rowColors.push('#222222');
                    }
                    fireObject['row'+i] = {};
                    fireObject['row'+i].name = 'row'+i;
                    fireObject['row'+i].colors = rowColors;
                }
                return fireObject;
            }
        }
});