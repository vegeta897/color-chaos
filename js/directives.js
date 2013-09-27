/* Directives and Filters */

angular.module('ColorChaos.directives', [])
    .directive('loginForm', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var userInput = element.children('#inputLoginUser');
                var passInput = element.children('#inputLoginPass');
                var loginButton = element.children('#loginSubmit'); // The log in button
                attrs.$observe('loginForm',function(){
                    var status = scope.authStatus;
                    if(status == '') { return; }
                    loginButton.removeClass('disabled'); // Remove disabled/error classes
                    userInput.removeClass('error');
                    passInput.removeClass('error');
                    switch(status) {
                        case 'notLogged':
                            passInput.val('');
                            break;
                        case 'logged':
                            break;
                        case 'logging':
                            break;
                        case 'badEmail':
                            userInput.addClass('error').focus();
                            break;
                        case 'badPass':
                            passInput.addClass('error').focus();
                            break;
                    }
                    if(status == 'badEmail' || status == 'badPass') {
                        if(jQuery.trim(userInput.val()) == '') { // User input blank
                            userInput.addClass('error');
                        }
                        if(jQuery.trim(passInput.val()) == '') { // Password input blank
                            passInput.addClass('error');
                        }
                    }
                });
            }
        };
    })
;