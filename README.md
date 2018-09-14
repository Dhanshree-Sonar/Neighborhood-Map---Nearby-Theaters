# Neighborhood Map - Nearby Theaters

This site is a helpful resource to obtain a list of theaters nearby any location. The user needs to enter the location to obtain the list of theaters nearby. The user can click the marker or list items to retrieve particular theater information. In addition, it has movie list on sidebar along with online booking links.

## Prerequisites
- Internet connection
- Google API Key [Google Documentation](https://developers.google.com/maps/documentation/javascript/get-api-key)
- Foursquare Client ID and Client Secret [Foursquare Documentation](https://developer.foursquare.com/docs/api/getting-started)

## How to run

1. Clone the repository to your local directory or download it
    - Clone command: `$ git clone https://github.com/Dhanshree-Sonar/Neighborhood-Map---Nearby-Theaters.git`
    - Open index.html using your choice of browser
2. You can visit Github hosted version [Click here](https://dhanshree-sonar.github.io/Neighborhood-Map---Nearby-Theaters/)

## Website functionality

1. Initially website loads theaters nearby 'Times Square, NYC'. It uses Google Map to show theater locations.
2. It displays list of theaters on the sidebar and creates Google Markers on the Google Map.
3. User can search for new location with the help of `Search Location` functionality.
4. Selected location will appear below Search bar.
5. User can use `Filter Theaters`  functionality to filter the list of theaters. Only filtered list items and markers will be visible.
6. When user clicks the marker or theater from the list, It opens:
    - Google InfoWindow on Map: It has data such as Theater Name, Address, Open or Closed Status and Ratings retrieved using Google API.
    - Theater name on sidebar: You can click the name to open theater's website.
    - Movie List on sidebar: This list has movie names and `FANDANGO` links for online booking. The data is retrieved using Foursquare API. Provided link to visit foursquare page for corresponding theater.
7. If user encounters any error, it will be shown at the top on the sidebar.

## Built with

1. HTML
2. JavaScript
3. CSS
4. [Knockout JS](http://knockoutjs.com/documentation/introduction.html)
5. [Google APIs](https://developers.google.com/maps/documentation/javascript/tutorial)
6. [Foursquare APIs](https://developer.foursquare.com/docs)
7. [W3.CSS template](https://www.w3schools.com/w3css/default.asp)
8. [Fontawesome](http://fontawesome.io)
