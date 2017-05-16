import axios from 'axios';
import { $ } from './bling';

function ajaxFavorite (e) {
  e.preventDefault();
  axios
    .post(this.action)
    .then(res => {
      const isFavorited = this.heart.classList.toggle('heart__button--hearted');
      $('.heart-count').textContent = res.data.favorites.length;

      if (isFavorited) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => {
          this.heart.classList.remove('heart__button--float'),
          2500
        })
      }
    })
    .catch(e => console.error("ERROR: " + e.error))
}

export default ajaxFavorite;