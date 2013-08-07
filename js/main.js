angular.module('ColorChaos', ['ColorChaos.controllers', 'ColorChaos.services', 'ColorChaos.directives', 'firebase', 'LocalStorageModule'])
	.config(['$routeProvider', function($routeProvider) { // Set up URL page routing
		$routeProvider.
			when('/', {templateUrl: 'partials/main.html', controller: 'ColorGrid'}). // Main page
            when('/jukebox', {templateUrl: 'partials/jukebox.html', controller: 'Jukebox'}). // Jukebox page
		    otherwise({redirectTo: ''}); // Redirect to main page if none of the above match
	}]);