import axios from 'axios';
import promisify from 'es6-promisify';
import { $ } from './bling';

const getUserCurrentCoords = () => {
  var coords = {}

  const success = (pos) => {
    coords.lat = parseFloat(pos.coords.latitude);
    coords.lng = parseFloat(pos.coords.longitude);
  }

  const error = (pos) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  const options = {
    enableHighAccuracy: true,
    timout: 5000,
    maximumAge: 0
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
  return coords;
}


function loadPlaces(map, lat = 43.2, lng = -79.8 ) {

  // This endpoint will query our dabase and return an 
  // aggregation of stores near the provided lat and lng
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        alert('no places found!');
        return;
      };

      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      })

      // When someone clicks on a marker, show the corresponding info
      markers.forEach(marker => marker.addListener('click', function() {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
          </div>
        `

        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }))

      // Zoom map to fit all markers perfectly
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    })
}

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 10
}

async function makeMap(mapDiv) {
  if (!mapDiv) { return; }

  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng())
  })
}

export default makeMap;
