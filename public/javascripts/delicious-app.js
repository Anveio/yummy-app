import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from'./modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxFavorite from './modules/favorite';

// Stuff for the Google Maps API
autocomplete( $('#address'), $('#lat'), $('#lng') );

// Make the search bar more pleasant to use
typeAhead( $('.search') );

makeMap( $('#map') );

const favoriteForms = $$('form.heart');
favoriteForms.on('submit', ajaxFavorite);