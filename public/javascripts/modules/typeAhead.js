import axios from 'axios';
import dompurify from 'dompurify';


const searchResultsHTML = (stores) => {
  return stores.map(store => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `
  }).join('')
}

const handleSearchBarNavigation = (e, search) => {
  const activeClass = 'search__result--active';
  const current = search.querySelector(`.${activeClass}`);
  const items = search.querySelectorAll('.search__result');
  let next;

  if (e.keyCode === 40 && current) {
    next = current.nextElementSibling || items[0]; // For DOWN presses after the first
  } else if (e.keyCode === 40) { // For first DOWN press
    next = items[0];
  } else if (e.keyCode === 38 && current) { // For UP presses after the first
    next = current.previousElementSibling || items[items.length-1];
  } else if (e.keyCode === 38) { // For first UP press
    next = items[items.length-1];
  } else if (e.keyCode === 13 && current.href) { // For ENTER press
    return window.location = current.href;
  } else {
    // Do nothing if keypress is not UP, DOWN, or ENTER
    return;
  }

  if (current) {
    current.classList.remove(activeClass);
  }

  next.classList.add(activeClass);
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    if(!this.value) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if(res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }

        searchResults.innerHTML =
          dompurify.sanitize(`<div class="search__result">
          No results for '${this.value}' 
          </div>`);
      })
  })

  // Handle keyboard inputs
  searchInput.on('keyup', (e) => {
    handleSearchBarNavigation(e, search);
  })
}

export default typeAhead