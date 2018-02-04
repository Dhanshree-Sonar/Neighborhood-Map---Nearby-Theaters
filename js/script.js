let map, infoWindow;
const CLIENT_ID = 'PPQL3RL2BOIYIHH01BVFM24CPEYEKY5EC0PYJ3A2YBI3AVNG';
const CLIENT_SECRET = 'ZE310M1TKIDJ4OADJEP0BCPOXOGTZOCESI4WFY2JHNAN5FYX';
const CATEGORY_ID = '4bf58dd8d48988d17f941735';
const VERSION = '20130815';

let bounds;

// A callback function for google map API
function initMap() {
  'use strict';
  map = new google.maps.Map(document.getElementById('map'),{
    center: {lat: 40.7413549,lng: -73.99802439999996},
    zoom: 13
  });

  infoWindow = new google.maps.InfoWindow({
    maxWidth: 200
  });

  bounds = new google.maps.LatLngBounds();

  ko.applyBindings(new ViewModel());
}

// Alert the user if google maps isn't working
function googleError() {
  document.getElementsByClassName('map-error')[0].innerHTML = "<h2>Google Maps is not loading. Please try refreshing the page later.</h2>";
}


// Model for theater data
const Theater = function () {
  this.visible = ko.observable(true);
  this.name = ko.observable('');
  this.address = '';
  this.openNow = '';
  this.lat = '';
  this.lng = '';
  this.googleRating = '';
  this.url = ko.observable();
  this.movies = ko.observableArray();
  this.marker = '';
  this.foursquareUrl = ko.observable();
};

let ViewModel = function () {
  'use strict';
  let self = this;

  self.searchLocation = ko.observable('');
  self.filterTheater = ko.observable();
  self.location = ko.observable('');
  self.theater = ko.observable(new Theater());
  self.theaterList = ko.observableArray([]);
  self.errorMsg = ko.observable('');

  // Autocomplete for user's search query
  new google.maps.places.Autocomplete(document.getElementById('search-text'));

  // Initial location setup
  self.loadInitialData = function () {
    self.searchLocation('Times Square, New York City');
    self.retrieveTheatersNearby();
  };

  // Retrieve theaters nearby based on search-text
  self.retrieveTheatersNearby = function () {
    self.errorMsg('');
    self.sidebarClose();

    // Get theaters near the location using google apis (geocode and places)
    self.searchLocation(document.getElementById('search-text').value);
    if (self.searchLocation() !== '') {
      // Initialize the geocoder.
      let geocoder = new google.maps.Geocoder();
      let formatted_address = '';

      // Retrieve the lat lng of the entered address
      geocoder.geocode({address: self.searchLocation()}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          formatted_address = results[0].formatted_address;

          let position = results[0].geometry.location;
          let marker = createMarker('img/current-location-icon.png', results[0].geometry.location);

          // Retrieve theaters nearby specified position
          let service = new google.maps.places.PlacesService(map);
          service.nearbySearch({
            location: position,
            radius: '10000',
            type: ['movie_theater']
          }, function (results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              // Check if any theater is available nearby
              if (results.length !== 0) {
                // Clear previous location related data
                self.theaterList.destroyAll();
                self.theaterList.removeAll();
                self.clearTheaterInfo();
                self.filterTheater('');
                bounds = new google.maps.LatLngBounds();

                self.location(formatted_address);

                for (let i = 0; i < results.length; i++) {
                  let place = results[i];

                  //Create new theater for every retrieved theater
                  let theaterToAdd = new Theater();
                  theaterToAdd.lat = place.geometry.location.lat();
                  theaterToAdd.lng = place.geometry.location.lng();
                  if (place.name) {
                    theaterToAdd.name(place.name);
                  }
                  if (place.vicinity) {
                    theaterToAdd.address = place.vicinity;
                  }
                  if (place.opening_hours) {
                    if (place.opening_hours.open_now) {
                      theaterToAdd.openNow = true;
                    } else {
                      theaterToAdd.openNow = false;
                    }
                  } else {
                    theaterToAdd.openNow = null;
                  }
                  if (place.rating) {
                    theaterToAdd.googleRating = place.rating;
                  }

                  theaterToAdd.marker = createMarker('img/movie-icon.png', place.geometry.location);
                  bounds.extend(theaterToAdd.marker.position);

                  // Add click listener on marker
                  theaterToAdd.marker.addListener('click', self.populateTheaterData);

                  // Add mouseover listener on marker
                  theaterToAdd.marker.addListener('mouseover', startBounceMarker);

                  // Add mouseout listener on marker
                  theaterToAdd.marker.addListener('mouseout', stopBounceMarker);

                  self.theaterList.push(theaterToAdd);
                }
                map.fitBounds(bounds);
              } else {
                self.errorMsg('No theater found around 10 miles redius! Please try to search different location.');
              }
            } else {
              self.errorMsg('Could not retrieve theater list form Google.');
            }
          });
        } else {
          self.errorMsg('Could not find the location. Try entering more specific place.');
        }
      });

    } else {
      self.errorMsg('Please enter location to search movie theaters around!');
    }
  };

  // Filter list whenever user enters a text
  self.filterTheaterList = function () {
    infoWindow.close();
    let string = self.filterTheater().toUpperCase();
    self.theaterList().forEach(function (theater) {
      if (theater.name().toUpperCase().indexOf(string) > -1) {
        theater.visible(true);
        theater.marker.setMap(map);
      } else {
        theater.visible(false);
        theater.marker.setMap(null);
      }
    });
  };

  // Populate theater data using google infoWindow and DOM element
  self.populateTheaterData = function () {

    // Check whether List's click event or Marker's click event is calling function
    var marker;
    if (typeof(this.position) == 'undefined') {
      marker = this.marker;
    } else {
      marker = this;
    }

    for (var i = 0; i < self.theaterList().length; i++) {
      if (self.theaterList()[i].lat == marker.position.lat() && self.theaterList()[i].lng == marker.position.lng()) {

        marker.setAnimation(google.maps.Animation.DROP);
        self.errorMsg('');
        self.clearTheaterInfo();
        let content = '<div>';

        // Check if window is not aleary Open
        if(infoWindow.marker !== marker) {
          infoWindow.marker = marker;
          infoWindow.setContent('');
        }

        // Clear marker if window is closed
        infoWindow.addListener('closeclick', self.closeInfoWindow);

        if (self.theaterList()[i].name()) {
          content += '<div id="theater-name">' + self.theaterList()[i].name() + '</div>';
          self.theater().name(self.theaterList()[i].name());
        }
        if (self.theaterList()[i].address) {
          content += '<div class="theater-addr"><em>' + self.theaterList()[i].address + '</em></div>';
          self.theater().address = self.theaterList()[i].address;
        }
        if (self.theaterList()[i].openNow !== null) {
          if (self.theaterList()[i].openNow) {
            content += '<div class="theater-open">' + 'Open Now' + '</div>';
            self.theater().openNow = true;
          } else {
            content += '<div class="theater-close">' + 'Closed' + '</div>';
            self.theater().openNow = false;
          }
        }
        if (self.theaterList()[i].googleRating) {
          content += '<div>' + '<i class="fa fa-google" aria-hidden="true"></i>';
          content += ' Rating: ' + self.theaterList()[i].googleRating + '</div>';
          self.theater().googleRating = self.theaterList()[i].googleRating;
        }

        self.theater().lat = self.theaterList()[i].lat;
        self.theater().lng = self.theaterList()[i].lng;

        // Foursquare API call to get Venue ID
        $.ajax({
          url: 'https://api.foursquare.com/v2/venues/search?v=' + VERSION +'&redius=10&categoryId=' +
          CATEGORY_ID + '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&ll=' +
          self.theater().lat + ',' + self.theater().lng,
          dataType: 'json',
          success: self.getVenueID,
          error: self.foursquareErrorHandling
        });

        content += '</div>';

        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      }
    }

  };

  // Close infowindow
  self.closeInfoWindow = function () {
    this.setMarker = null;
  };

  // Reset theater info
  self.clearTheaterInfo = function () {
    self.theater().visible(false);
    self.theater().movies.removeAll();
    self.theater().name('');
    self.theater().address = '';
    self.theater().openNow = '';
    self.theater().lat = '';
    self.theater().lng = '';
    self.theater().googleRating = '';
    self.theater().url('');
    self.theater().foursquareUrl('');
  };

  // Get venue ID using foursquare API
  self.getVenueID = function (response) {
    if (response.response.venues[0].id) {
      let venueId = response.response.venues[0].id;

      // Retrieve URL of Movie Theater website
      if (response.response.venues[0].url) {
        self.theater().url(response.response.venues[0].url);
      }

      // Retrieve Foursquare url for venue
      $.ajax({
        url: 'https://api.foursquare.com/v2/venues/' + venueId + '?client_id=' +
          CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=' + VERSION,
        dataType: 'json',
        success: function (response) {
          if (response.response.venue.canonicalUrl) {
            self.theater().foursquareUrl(response.response.venue.canonicalUrl);
          }
        },
        error: self.foursquareErrorHandling
      });

      // Foursquare API call to get Events at Venue
      $.ajax({
        url: 'https://api.foursquare.com/v2/venues/' + venueId + '/events?client_id=' +
          CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=' + VERSION,
        dataType: 'json',
        success: function (response) {
          let items = response.response.events.items;
          if (items.length > 1) {
            for (let i = 1; i < items.length; i++) {
              if (items[i].name) {
                let movie = [];
                movie.push(items[i].name);
                if (items[i].url) {
                  movie.push(items[i].url);
                }
                self.theater().movies.push(movie);
              }
            }
          } else {
            self.errorMsg('No Foursquare Movie data available for this theater.');
          }
        },
        error: function (e) {
          let obj = JSON.parse(e.responseText);
          self.errorMsg('Foursquare data is unavailable. Due to: ' + obj.meta.errorType);
        }
      });
    } else {
      self.errorMsg('Foursquare venue ID for this theater is unavailable!');
    }
  };

  // Displaying Foursquare API error message
  self.foursquareErrorHandling = function (e) {
    if (e.responseText === 'undefined' || e.responseText === '') {
      self.errorMsg('Foursquare data is unavailable. No Response from Foursqaure.');
    } else {
      let obj = JSON.parse(e.responseText);
      var error = '';

      switch (obj.meta.code) {
        case 400:
          error = 'Foursquare request failed! Due to: ' + obj.meta.errorType.toUpperCase();
          error += '. May be you are unauthorized to make the request due to expired/missing credentials.';
          break;
        case 429:
          error = 'Foursquare request failed! Due to: ' + obj.meta.errorType.toUpperCase();
          error += '. This app has exceeded the daily call quota set by Foursquare.';
          break;
        case 403:
          error = 'Foursquare request failed! Due to: ' + obj.meta.errorType.toUpperCase();
          error += '. May be you are attempting to access unauthorized information.';
          break;
        case 404:
          error = 'Foursquare request failed! Due to: ' + obj.meta.errorType.toUpperCase();
          error += '. Requesting URL not found. It has been removed or does not exist.';
          break;
        case 500:
          error = 'Foursquare request failed! Due to: ' + obj.meta.errorType.toUpperCase();
          error += '. Foursquare server has timed out. Please try later.';
          break;
        default:
          error = 'Foursquare request failed! Due to: ' + obj.meta.errorType.toUpperCase();
      }
      self.errorMsg(error);
    }
  };

  // Function to open sidebar
  self.sidebarOpen = function () {
    document.getElementById("sidebar").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  };

  // Function to close sidebar
  self.sidebarClose = function () {
    document.getElementById("sidebar").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  };

  // Funtion to show/hide movie list
  self.showHideMovieList = function () {
    let x = document.getElementById('movie-list');
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else {
        x.className = x.className.replace(" w3-show", "");
    }
  };

};

// Bound the map marker on mouseover event
function startBounceMarker() {
  this.setAnimation(google.maps.Animation.BOUNCE);
}

// Bound the map marker on mouseover event
function stopBounceMarker() {
  this.setAnimation(google.maps.Animation.null);
}

// Create a google marker
function createMarker(imageURL, position) {
  let icon = new google.maps.MarkerImage(
    imageURL,
    new google.maps.Size(71, 71),
    new google.maps.Point(0, 0),
    new google.maps.Point(17, 34),
    new google.maps.Size(25, 25));

  let marker = new google.maps.Marker({
    position: position,
    animation: google.maps.Animation.DROP,
    icon: icon,
    map: map,
    // Attributions help users find your site again.
    attribution: {
      source: 'Google Maps JavaScript API',
      webUrl: 'https://developers.google.com/maps/'
    }
  });

  return marker;
}
