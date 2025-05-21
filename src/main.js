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
let currentPage = 1; // Houd bij welke pagina momenteel wordt weergegeven

async function loadPopularMovies() {
  try {
    const movies = await getPopularMovies();
    if (!movies.length) {
      console.warn('No movies returned from the API.');
      movieContainer.innerHTML = '<p>No movies available at the moment.</p>';
      return;
    }
    renderMovies(movies);
    document.getElementById('load-more').classList.remove('hidden'); // Maak de knop zichtbaar
  } catch (err) {
    console.error('Error fetching popular movies:', err);
    movieContainer.innerHTML = '<p>Sorry, something went wrong while loading the movies.</p>';
  }
}

async function loadMoreMovies() {
  try {
    currentPage++; // Verhoog de pagina
    const movies = await getPopularMovies(currentPage);
    if (!movies.length) {
      console.warn('No more movies to load.');
      document.getElementById('load-more').classList.add('hidden'); // Verberg de knop als er geen films meer zijn
      return;
    }
    renderMovies(movies, true); // Voeg films toe aan de bestaande lijst
  } catch (err) {
    console.error('Error loading more movies:', err);
  }
}

// Test getPopularMovies()
getPopularMovies().then(movies => {
  console.log('Populaire films:', movies); // Controleer of de films correct worden gelogd
});

// 4. Render-functie
function renderMovies(movies, append = false) {
  if (!append) movieContainer.innerHTML = ''; // Leegmaken tenzij we films toevoegen
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    const isFavorite = favorites.some(fav => fav.id === movie.id);
    card.innerHTML = `
      <button class="favorite-btn${isFavorite ? ' active' : ''}" aria-label="Voeg toe aan favorieten">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/>
        </svg>
      </button>
      <img
        src="${movie.poster_path ? imageBase + movie.poster_path : '/fallback.jpg'}"
        alt="${movie.title} poster"
        loading="lazy"
      />
      <h3>${movie.title}</h3>
      <p><strong>Release Date:</strong> ${movie.release_date || 'Unknown'}</p>
      <p><strong>Rating:</strong> ${movie.vote_average || 'N/A'}</p>
    `;
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Voorkom dat de klik op de ster de overlay opent
      toggleFavorite(movie);
      favoriteBtn.classList.toggle('active', favorites.some(fav => fav.id === movie.id));
    });
    card.addEventListener('click', () => openOverlay(movie)); // Open overlay bij klik op de kaart
    movieContainer.appendChild(card);
  });
}

function openOverlay(movie) {
  const overlay = document.getElementById('overlay');
  const overlayDetails = document.getElementById('overlay-details');
  const overview = movie.overview || 'Geen beschrijving beschikbaar.'; // Fallback-tekst
  overlayDetails.innerHTML = `
    <img
      src="${movie.poster_path ? imageBase + movie.poster_path : '/fallback.jpg'}"
      alt="${movie.title} poster"
      loading="lazy"
    />
    <h2>${movie.title}</h2>
    <p><strong>Release Date:</strong> ${movie.release_date || 'Unknown'}</p>
    <p><strong>Rating:</strong> ${movie.vote_average || 'N/A'}</p>
    <p>${overview}</p>
  `;
  overlay.classList.remove('hidden'); // Maak overlay zichtbaar
}

function closeOverlay() {
  const overlay = document.getElementById('overlay');
  overlay.classList.add('hidden'); // Verberg overlay
}

// Voeg een klikgebeurtenis toe aan de overlay-container
document.getElementById('overlay').addEventListener('click', (e) => {
  if (e.target.id === 'overlay') { // Controleer of op de achtergrond is geklikt
    closeOverlay();
  }
});

// Sluitknop blijft werken
document.getElementById('close-overlay').addEventListener('click', closeOverlay);

// 5. Thema
const themeToggle = document.getElementById('theme-toggle');

// Voeg een klikgebeurtenis toe aan de knop om het thema te toggelen
document.getElementById('theme-toggle-label').addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark'); // Toggle de donkere modus
  localStorage.setItem('theme', isDark ? 'dark' : 'light'); // Sla de voorkeur op
  document.getElementById('theme-toggle-label').textContent = isDark ? 'Lichter thema' : 'Donker thema'; // Update de knoptekst
});

// Stel het thema in op basis van de opgeslagen voorkeur
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('theme-toggle-label').textContent = 'Lichter thema';
} else {
  document.body.classList.remove('dark');
  document.getElementById('theme-toggle-label').textContent = 'Donker thema';
}

// 6. Kick-off
loadPopularMovies();

// 7. Zoekfunctionaliteit
const searchInput = document.getElementById('search');
const debouncedSearch = debounce(async (e) => {
  const query = e.target.value.trim();
  if (!query) return loadPopularMovies(); // terug naar populairste als leeg
  try {
    const results = await searchMovies(query);
    renderMovies(results);
  } catch (err) {
    console.error('Error during search:', err);
    movieContainer.innerHTML = '<p>Sorry, something went wrong while searching for movies.</p>';
  }
}, 300);

searchInput.addEventListener('input', debouncedSearch);

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
  if (isFav()) {
    renderMovies(favorites);
  }
}

// 11. Kick-off
loadGenres();

// Voeg een klikgebeurtenis toe aan de "Load More"-knop
document.getElementById('load-more').addEventListener('click', loadMoreMovies);

// Functie om te bepalen of alleen favorieten getoond moeten worden
function isFav() {
  return document.getElementById('favorites-toggle').checked;
}

// Event listener voor de favorieten-toggle
const favoritesToggleLabel = document.getElementById('favorites-toggle-label');
document.getElementById('favorites-toggle').addEventListener('change', () => {
  if (isFav()) {
    document.body.classList.add('favorites-only');
    renderMovies(favorites);
    document.getElementById('load-more').classList.add('hidden');
    favoritesToggleLabel.textContent = 'Alle films';
  } else {
    document.body.classList.remove('favorites-only');
    loadPopularMovies();
    document.getElementById('load-more').classList.remove('hidden');
    favoritesToggleLabel.textContent = 'Favorieten';
  }
});