angular.module('ColorChaos', ['ColorChaos.controllers', 'ColorChaos.services', 'ColorChaos.directives', 'firebase', 'LocalStorageModule'])
	.config(['$routeProvider', function($routeProvider) { // Set up URL page routing
		$routeProvider.
			when('/', {templateUrl: 'partials/main.html', controller: 'ColorGridLocal'}). // Main page
		    otherwise({redirectTo: ''}); // Redirect to main page if none of the above match
	}]);