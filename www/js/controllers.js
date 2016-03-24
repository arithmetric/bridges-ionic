angular.module('BridgesMap.controllers', [])

.controller('MapCtrl', function($interpolate, $scope, $templateCache, Bridges, Location) {
  var map;
  var selfMarker;
  var rangeCircle;
  var mapMarkers = {};
  var infoWindow;

  var range = 1600;

  var closeInfoWindow = function() {
    if (infoWindow) {
      infoWindow.close();
      infoWindow = 0;
    }
  };

  var showInfoWindow = function() {
    closeInfoWindow();

    var markup = '<a class="item item-icon-right ion-chevron-right calm" href="#/tab/list/{{_id}}">' +
        '<div class="road-crossing bridge-info-part">' +
          '<div class="info">{{road}}</div>' +
          '<div class="info">{{crossing}}</div>' +
          '<label>Road / Crossing</label>' +
        '</div>' +
      '</a>';

    //$scope.infoWindowBridge = this.bridge;
    infoWindow = new google.maps.InfoWindow({
      content: $interpolate(markup)(this.bridge),
      disableAutoPan: true
    });
    infoWindow.open(map, this);
  };


  var updateMap = function() {
    if (!window.google || !google.maps) {
      window.initMap = function() {
        updateMap();
      };
      return;
    }
    var latlon = Location.get();
    var pos = new google.maps.LatLng(latlon.lat, latlon.lon);
    if (map) {
      google.maps.event.trigger(map, 'resize');
      selfMarker.setPosition(pos);
      rangeCircle.setCenter(pos);
      rangeCircle.setRadius(range);
      map.panTo(pos);
      map.fitBounds(rangeCircle.getBounds());
    }
    else {
      var mapStyles =
        [
          {
            "featureType": "poi.business",
            "elementType": "geometry",
            "stylers": [
              { "visibility": "on" }
            ]
          },{
            "featureType": "poi.place_of_worship",
            "elementType": "geometry",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "poi.school",
            "elementType": "geometry",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "poi.sports_complex",
            "elementType": "geometry",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "poi.government",
            "elementType": "geometry",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "administrative",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "poi.medical",
            "elementType": "geometry",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "transit.station",
            "elementType": "labels",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "landscape",
            "elementType": "labels",
            "stylers": [
              { "visibility": "off" }
            ]
          }
        ],
        mapOptions = {
          center: pos,
          disableDefaultUI: true,
          disableDoubleClickZoom: true,
          draggable: false,
          keyboardShortcuts: false,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          scrollwheel: false,
          styles: mapStyles,
          zoom: 14
        },
        mapDiv = document.getElementById("map-container");
      map = new google.maps.Map(mapDiv, mapOptions);
      selfMarker = new google.maps.Marker({
        position: pos,
        icon: {
          origin: new google.maps.Point(168, 0),
          size: new google.maps.Size(14, 14),
          url: "/img/glyphicons-halflings.png"
        },
        clickable: false,
        map: map
      });
      rangeCircle = new google.maps.Circle({
        strokeColor: "#ffffff",
        strokeOpacity: 0.72,
        strokeWeight: 1,
        fillColor: "#ffffff",
        fillOpacity: 0.24,
        map: map,
        clickable: false,
        center: pos,
        radius: range
      });
      google.maps.event.addListener(map, "click", closeInfoWindow);
      window.addEventListener('resize', updateMap);
    }
  };

  var removeMarkers = function() {
    if (mapMarkers) {
      angular.forEach(mapMarkers, function(marker, idx) {
        marker.setMap(null);
        delete mapMarkers[idx];
      });
    }
    mapMarkers = {};
  };

  var removeMarker = function(item) {
    item.marker.setMap(null);
    delete mapMarkers[item._id];
  };

  var addMarker = function(item) {
    if (item.point && item.point.coordinates && item.point.coordinates.length == 2) {
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(item.point.coordinates[1], item.point.coordinates[0]),
        animation: google.maps.Animation.DROP,
        map: map,
        title: item.road + " / " + item.crossing + " (" + item.yearBuilt + ")"
      });
      marker.bridge = item;
      google.maps.event.addListener(marker, "click", showInfoWindow);
      mapMarkers[item._id] = marker;
      return marker;
    }
  };

  var updateMapData = function() {
    var bridges = Bridges.get(),
      bridge;
    $scope.bridges = bridges;
    angular.forEach(bridges, function(item, key) {
      if (!item.hasOwnProperty("_id")) {
        return;
      }
      //TODO Check if bridge is on map
      // If not on map, and marker exists, remove marker
      if (0 == 1 && mapMarkers.hasOwnProperty(item._id)) {
        removeMarker(item);
      }
      // If on map with no marker, add marker
      if (!mapMarkers.hasOwnProperty(item._id)) {
        mapMarkers[item._id] = addMarker(item);
      }
    });
  };

  $scope.$on('Location.change', function() {
    updateMap();
  });

  $scope.$on('Bridges.change', function() {
    updateMapData();
  });

  $scope.$on("$ionicView.beforeEnter", function() {
    closeInfoWindow();
  });

  updateMap();
})

.controller('ListCtrl', function($scope, Bridges) {
  function updateList() {
    $scope.bridges = Bridges.getInRange();
    $scope.numBridges = $scope.bridges ? Object.keys($scope.bridges).length : 0;
  }

  $scope.$on('Bridges.change', updateList);
  updateList();
})

.controller('ListDetailCtrl', function($scope, data) {
  $scope.bridge = data;
  if ($scope.bridge) {
    if ($scope.bridge.adt && $scope.bridge.adtTrucks) {
      $scope.bridge.adtTrucksNum = Math.floor($scope.bridge.adtTrucks * $scope.bridge.adt / 100);
    }
    if ($scope.bridge.inspectDate) {
      var inspectYear = $scope.bridge.inspectDate.substr(-2);
      var inspectMonth = $scope.bridge.inspectDate.substr(0, $scope.bridge.inspectDate.length - 2);
      var d = new Date();
      d.setFullYear((inspectYear < 70) ? parseInt(inspectYear, 10) + 2000 : parseInt(inspectYear, 10) + 1900);
      d.setMonth(inspectMonth - 1);
      $scope.bridge.inspectDateObj = d;
    }
  }
})

.controller('AboutCtrl', function($scope) {
  $scope.openUrl = function(url) {
    cordova.InAppBrowser.open(url, '_system');
  };
});
