import './style.css';
import { getPopularMovies, searchMovies, getGenres, getFilteredMovies, fetchMovies } from './api.js';
import { debounce } from './utils.js';

const apiKey = import.meta.env.VITE_TMDB_KEY;
console.log('API key:', apiKey); // Controleer of de key correct wordt gelogd
if (!apiKey) {
  console.error('API key is missing. Please check your .env file.');
}
const baseUrl = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p/w300';

// 1. Root-element
const app = document.getElementById('app');

// 2. Verwijs naar bestaande container voor films
const movieContainer = document.getElementById('movie-list');

// 3. Fetch populaire films
async function loadPopularMovies() {
  try {
    const movies = await getPopularMovies();
    if (!movies.length) {
      console.warn('No movies returned from the API.');
      movieContainer.innerHTML = '<p>No movies available at the moment.</p>';
      return;
    }
    renderMovies(movies);
  } catch (err) {
    console.error('Error fetching popular movies:', err);
    movieContainer.innerHTML = '<p>Sorry, something went wrong while loading the movies.</p>';
  }
}

// Test getPopularMovies()
getPopularMovies().then(movies => {
  console.log('Populaire films:', movies); // Controleer of de films correct worden gelogd
});

// 4. Render-functie
function renderMovies(movies) {
  movieContainer.innerHTML = ''; // leegmaken
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    const isFavorite = favorites.some(fav => fav.id === movie.id);
    card.innerHTML = `
      <img
        src="${movie.poster_path ? imageBase + movie.poster_path : ''}"
        alt="${movie.title} poster"
        loading="lazy"
      />
      <h3>${movie.title}</h3>
      <p>${movie.overview.slice(0, 100)}…</p>
      <button class="favorite-btn">${isFavorite ? '★' : '☆'}</button>
    `;
    card.querySelector('.favorite-btn').addEventListener('click', () => toggleFavorite(movie));
    movieContainer.appendChild(card);
  });
}

// 5. Thema
const themeToggle = document.getElementById('theme-toggle');

// Load theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeToggle.checked = true;
} else {
  document.body.classList.remove('dark');
  themeToggle.checked = false;
}

// Add event listener for theme toggle
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
});

// 6. Kick-off
loadPopularMovies();

// 7. Zoekfunctionaliteit
const searchInput = document.getElementById('search');
searchInput.addEventListener(
  'input',
  debounce(async (e) => {
    const query = e.target.value.trim();
    if (!query) return loadPopularMovies(); // terug naar populairste als leeg
    const results = await searchMovies(query);
    renderMovies(results);
  }, 300)
);

// 8. Genres laden
async function loadGenres() {
  const genreSelect = document.getElementById('genre-filter');
  try {
    const genres = await getGenres();
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Fout bij laden van genres:', err);
  }
}

// 9. Filters toepassen
document.getElementById('apply-filters').addEventListener('click', async () => {
  const genreId = document.getElementById('genre-filter').value;
  const year = document.getElementById('year-filter').value;
  try {
    const filteredMovies = await getFilteredMovies(genreId, year);
    renderMovies(filteredMovies);
  } catch (err) {
    console.error('Fout bij toepassen van filters:', err);
    movieContainer.innerHTML = '<p>Sorry, er ging iets mis bij het toepassen van de filters.</p>';
  }
});

// 10. Favorieten beheren
const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function toggleFavorite(movie) {
  const index = favorites.findIndex(fav => fav.id === movie.id);
  if (index === -1) {
    favorites.push(movie);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  const favoritesContainer = document.getElementById('favorites-container');
  favoritesContainer.innerHTML = '';
  favorites.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img
        src="${movie.poster_path ? imageBase + movie.poster_path : ''}"
        alt="${movie.title} poster"
        loading="lazy"
      />
      <h3>${movie.title}</h3>
    `;
    favoritesContainer.appendChild(card);
  });
}

// 11. Kick-off
loadGenres();
renderFavorites();

async function displayMovies() {
  const movies = await fetchMovies();
  const movieList = document.getElementById('movie-list');
  movieList.innerHTML = ''; // Clear existing content

  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>Rating: ${movie.vote_average}</p>
    `;
    movieList.appendChild(movieCard);
  });
}

displayMovies();