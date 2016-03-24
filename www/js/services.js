angular.module('BridgesMap.services', [])

.factory('Bridges', function($http, $q, $rootScope, Location) {
  var bridges = {};
  var bridgesInRange = {};
  var lastLat;
  var lastLon;
  var lastRange;

  var getBridgesInRange = function(lat, lon, range) {
    if (!lat || !lon || !range) {
      return;
    }
//TODO: limit to 3 decimal places of precision
    var serviceUrl = "http://" + bridgesConfig.hostname + ":" + bridgesConfig.port + "/bridges?lon=" + lon + "&lat=" + lat + "&range=" + range;
    $http.get(serviceUrl).success(function(data) {
      if (data.hasOwnProperty("status") && data.hasOwnProperty("results") && data.status == "ok") {
        bridgesInRange = {};
        data.results.forEach(function(item) {
          if (!item.hasOwnProperty("_id")) {
            return;
          }
          if (!bridges.hasOwnProperty(item._id)) {
            bridges[item._id] = item;
          }
          bridgesInRange[item._id] = item;
        });
        lastLat = lat;
        lastLon = lon;
        lastRange = range;
        $rootScope.$broadcast('Bridges.change', bridges);
      }
    });
  };

  var getById = function(id) {
    var promise;
    var serviceUrl = "http://" + bridgesConfig.hostname + ":" + bridgesConfig.port + "/bridges/" + id;

    if (bridges.hasOwnProperty(id) && bridges[id].fetchStatus) {
      promise = $q.defer();
      promise.resolve(bridges[id]);
      return promise.promise;
    }
    return $http.get(serviceUrl).then(function(data) {
      if (data.status && data.status == 200 && data.hasOwnProperty("data") && data.data.hasOwnProperty("results")) {
        bridges[id] = data.data.results[0];
        bridges[id].fetchStatus = 1;
        return bridges[id];
      }
    }, function(err) {
      return $q.reject("Could not fetch bridge data.");
    });
  };

  $rootScope.$on('Location.change', function(event, data) {
    getBridgesInRange(data.lat, data.lon, 1600);
  });

  return {
    get: function() {
      return bridges;
    },
    getById: getById,
    getInRange: function() {
      return bridgesInRange;
    }
  };
})

.factory('Location', function($rootScope) {
  var lastLocation;
  var currentLocation = {lat: 0, lon: 0};
  var positionTimeout = 1000;
  var watch;

  var locationSuccess = function(point) {
    currentLocation = {"lat": point.coords.latitude, "lon": point.coords.longitude};
    $rootScope.$broadcast('Location.change', currentLocation);
  }

  var locationError = function(err) {
    if (err.code == 1) {
//TODO
//      $scope.showMessage("You must provide your location to find nearby bridges.", "warning");
    }
  };

  return {
    enableWatch: function() {
      if (watch) {
        navigator.geolocation.clearWatch(watch);
        watch = false;
      }
      var watchOptions = {enableHighAccuracy: true, timeout: positionTimeout};
      watch = navigator.geolocation.watchPosition(locationSuccess, locationError, watchOptions)
    },
    get: function() {
      return currentLocation;
    }
  };
});
