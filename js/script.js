let map, infoWindow;
const CLIENT_ID = 'PPQL3RL2BOIYIHH01BVFM24CPEYEKY5EC0PYJ3A2YBI3AVNG';
const CLIENT_SECRET = 'ZE310M1TKIDJ4OADJEP0BCPOXOGTZOCESI4WFY2JHNAN5FYX';
const CATEGORY_ID = '4bf58dd8d48988d17f941735';
const VERSION = '20130815';

let bounds;

// A callback function for google map API
function initMap() {
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

// Model for theater data
let Theater = function () {
  this.visible = ko.observable(true);
  this.name = ko.observable('');
  this.address = ko.observable();
  this.openNow = ko.observable();
  this.lat = ko.observable();
  this.lng = ko.observable();
  this.googleRating = ko.observable();
  this.url = ko.observable();
  this.movies = ko.observableArray();
  this.marker = '';
};

let ViewModel = function () {

  let self = this;

  this.searchLocation = ko.observable('');
  this.filterTheater = ko.observable();
  this.location = ko.observable('');
  this.theater = ko.observable(new Theater());
  this.theaterList = ko.observableArray([]);
  this.errorMsg = ko.observable('');

  // Autocomplete for user's search query
  new google.maps.places.Autocomplete(document.getElementById('search-text'));

  // Initial location setup
  this.loadInitialData = function () {
    this.searchLocation('Times Sqaure, New York City');
    this.retrieveTheatersNearby();
  };

  // Retrieve theaters nearby based on search-text
  this.retrieveTheatersNearby = function () {
    this.errorMsg('');

    // Get theaters near the location using google apis (geocode and places)
    this.searchLocation(document.getElementById('search-text').value);
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
                  self.theaterList.push(new Theater());
                  self.theaterList()[i].lat(place.geometry.location.lat());
                  self.theaterList()[i].lng(place.geometry.location.lng());
                  if (place.name) {
                    self.theaterList()[i].name(place.name);
                  }
                  if (place.vicinity) {
                    self.theaterList()[i].address(place.vicinity);
                  }
                  if (place.opening_hours) {
                    if (place.opening_hours.open_now) {
                      self.theaterList()[i].openNow(true);
                    } else {
                      self.theaterList()[i].openNow(false);
                    }
                  } else {
                    self.theaterList()[i].openNow(null);
                  }
                  if (place.rating) {
                    self.theaterList()[i].googleRating(place.rating);
                  }

                  self.theaterList()[i].marker = createMarker('img/movie-icon.png', place.geometry.location);
                  bounds.extend(self.theaterList()[i].marker.position);

                  // Add click listener on marker
                  self.theaterList()[i].marker.addListener('click', self.populateTheaterData);

                  // Add mouseover listener on marker
                  self.theaterList()[i].marker.addListener('mouseover', startBounceMarker);

                  // Add mouseout listener on marker
                  self.theaterList()[i].marker.addListener('mouseout', stopBounceMarker);
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
  this.filterTheaterList = function () {
    infoWindow.close();
    let string = self.filterTheater().toUpperCase();
    this.theaterList().forEach(function (theater) {
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
      if (self.theaterList()[i].lat() == marker.position.lat() && self.theaterList()[i].lng() == marker.position.lng()) {

        marker.setAnimation(google.maps.Animation.BOUNCE);
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
        if (self.theaterList()[i].address()) {
          content += '<div id="theater-addr"><em>' + self.theaterList()[i].address() + '</em></div>';
          self.theater().address(self.theaterList()[i].address());
        }
        if (self.theaterList()[i].openNow() !== null) {
          if (self.theaterList()[i].openNow()) {
            content += '<div id="theater-open">' + 'Open Now' + '</div>';
            self.theater().openNow(true);
          } else {
            content += '<div id="theater-close">' + 'Closed' + '</div>';
            self.theater().openNow(false);
          }
        }
        if (self.theaterList()[i].googleRating()) {
          content += '<div>' + '<i class="fa fa-google" aria-hidden="true"></i>';
          content += ' Rating: ' + self.theaterList()[i].googleRating() + '</div>';
          self.theater().googleRating(self.theaterList()[i].googleRating());
        }

        self.theater().lat(self.theaterList()[i].lat());
        self.theater().lng(self.theaterList()[i].lng());

        // Foursquare API call to get Venue ID
        $.ajax({
          url: 'https://api.foursquare.com/v2/venues/search?v=' + VERSION +'&redius=10&categoryId=' +
          CATEGORY_ID + '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&ll=' +
          self.theater().lat() + ',' + self.theater().lng(),
          dataType: 'json',
          success: function (response) {
            if (response.response.venues[0].id) {
              let venueId = response.response.venues[0].id;

              // Retrieve URL of Movie Theater website
              if (response.response.venues[0].url) {
                content += '<div><a target="_blank" href=' + response.response.venues[0].url + '>' +
                response.response.venues[0].url + '</a></div>';
                self.theater().url(response.response.venues[0].url);
              }
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
          },
          error: function (e, status, error) {
            let obj = JSON.parse(e.responseText);
            self.errorMsg('Foursquare data is unavailable. Due to: ' + obj.meta.errorType);
          }
        });

        content += '</div>';

        infoWindow.setContent(content);
        infoWindow.open(map, marker);

        // Stop marker BOUNCE animation
        window.setTimeout(function () {
          marker.setAnimation(google.maps.Animation.null);
        }, 1400);
      }
    }

  };

  // Close infowindow
  self.closeInfoWindow = function () {
    this.setMarker = null;
  }

  // Reset theater info
  this.clearTheaterInfo = function () {
    self.theater().visible(false);
    self.theater().movies.removeAll();
    self.theater().name('');
    self.theater().address('');
    self.theater().openNow('');
    self.theater().lat('');
    self.theater().lng('');
    self.theater().googleRating('');
    self.theater().url('');
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

// Open infoWindow on marker click event
function openInfoWindow() {
  alert("hello");
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

// Function to open sidebar
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
    document.getElementById("myOverlay").style.display = "block";
}

// Function to close sidebar
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
    document.getElementById("myOverlay").style.display = "none";
}

// Function to guve Accordion effect to list
function htmlAccordions(id) {
    let x = document.getElementById(id);
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else {
        x.className = x.className.replace(" w3-show", "");
    }
}
