
window.initMap = function() {
  angular.module('BridgesMap').run(function($state) {
    $state.go('tab.map', {});
  });
};

angular.module('BridgesMap', ['ionic', 'BridgesMap.controllers', 'BridgesMap.services'])

.run(function($ionicPlatform, Location) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar
    // above the keyboard for form inputs).
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // Start location watch service
    Location.enableWatch();
  });
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })
    .state('tab.map', {
      url: '/map',
      views: {
        'map': {
          templateUrl: 'templates/map.html',
          controller: 'MapCtrl'
        }
      }
    })
    .state('tab.list', {
      url: '/list',
      views: {
        'list': {
          templateUrl: 'templates/list.html',
          controller: 'ListCtrl'
        }
      }
    })
    .state('tab.list-detail', {
      resolve: {
        data: function($stateParams, Bridges) {
          return Bridges.getById($stateParams.id).then(function(data) {
            return data;
          });
        }
      },
      url: '/list/:id',
      views: {
        'list': {
          templateUrl: 'templates/list-detail.html',
          controller: 'ListDetailCtrl'
        }
      }
    })
    .state('tab.about', {
      url: '/about',
      views: {
        'about': {
          templateUrl: 'templates/about.html',
          controller: 'AboutCtrl'
        }
      }
    });
  $urlRouterProvider.otherwise('/tab/map');
});
