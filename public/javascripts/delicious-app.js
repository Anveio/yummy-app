import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from'./modules/autocomplete';
import typeAhead from './modules/typeAhead';

// Stuff for the Google Maps API
autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );