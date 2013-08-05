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
        
    }]);
