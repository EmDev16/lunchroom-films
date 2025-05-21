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
let currentMovies = []; // Houd de laatst opgehaalde films bij (populair, gefilterd of favorieten)
let originalMovies = []; // Houd de originele volgorde bij voor reset
let currentSort = ''; // Houd de huidige sorteeroptie bij
let releasedFilter = 'all'; // 'all', 'released', 'unreleased'
const releasedToggle = document.getElementById('released-toggle');

// Helper om knopstatus en tekst te updaten
function updateReleasedToggleUI() {
  if (releasedFilter === 'all') {
    releasedToggle.classList.remove('active');
    releasedToggle.textContent = 'Alle';
    releasedToggle.title = 'Toon alle films';
  } else if (releasedFilter === 'unreleased') {
    releasedToggle.classList.add('active');
    releasedToggle.textContent = 'Unreleased';
    releasedToggle.title = 'Toon alleen films die nog niet zijn uitgebracht';
  } else if (releasedFilter === 'released') {
    releasedToggle.classList.add('active');
    releasedToggle.textContent = 'Released';
    releasedToggle.title = 'Toon alleen films die al zijn uitgebracht';
  }
}

// Toggle tussen alle -> unreleased -> released -> alle
releasedToggle.addEventListener('click', () => {
  if (releasedFilter === 'all') {
    releasedFilter = 'unreleased';
  } else if (releasedFilter === 'unreleased') {
    releasedFilter = 'released';
  } else {
    releasedFilter = 'all';
  }
  updateReleasedToggleUI();
});

// Zet de juiste UI bij laden
updateReleasedToggleUI();

async function loadPopularMovies(page = 1, sort = '', extra = {}) {
  try {
    const movies = await getFilteredMovies('', '', sort, extra, page);
    if (page === 1) {
      currentMovies = movies;
      originalMovies = [...movies];
      renderMovies(movies);
    } else {
      currentMovies = [...currentMovies, ...movies];
      originalMovies = [...currentMovies];
      renderMovies(currentMovies);
    }
    document.getElementById('load-more').classList.remove('hidden'); // Maak de knop zichtbaar
  } catch (err) {
    console.error('Error fetching popular movies:', err);
    movieContainer.innerHTML = '<p>Sorry, something went wrong while loading the movies.</p>';
  }
}

async function loadMoreMovies() {
  currentPage++;
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const todayStr = todayObj.toISOString().slice(0, 10);
  // Morgen berekenen
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(todayObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

  let extra = {};
  let sort = currentSort;
  if (releasedFilter === 'unreleased') {
    extra = { release_date_gte: tomorrowStr };
    sort = 'release_date.desc';
  } else if (releasedFilter === 'released') {
    extra = { release_date_lte: todayStr };
    sort = 'release_date.desc';
  }
  await loadPopularMovies(currentPage, sort, extra);
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
      <p><strong>Rating:</strong> ${typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A'}</p>
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

// Sorteerfunctie
function sortMovies(movies, sortValue) {
  let sorted = [...movies];
  switch (sortValue) {
    case 'popularity.desc':
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      break;
    case 'release_date.desc':
      sorted.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
      break;
    case 'release_date.asc':
      sorted.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
      break;
    case 'vote_average.desc':
      sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      break;
    case 'vote_average.asc':
      sorted.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
      break;
    case 'title.asc':
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'title.desc':
      sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      break;
    default:
      // Geen sortering, originele volgorde
      sorted = [...originalMovies];
  }
  return sorted;
}

// Sorteer event listener
const sortDropdown = document.getElementById('sort-dropdown');
sortDropdown.addEventListener('change', async () => {
  const value = sortDropdown.value;
  currentSort = value;
  currentPage = 1;
  if (isFav()) {
    // Sorteer favorieten lokaal
    const sorted = value ? sortMovies(favorites, value) : [...favorites];
    currentMovies = sorted;
    originalMovies = [...favorites];
    renderMovies(sorted);
  } else {
    // Haal gesorteerde films van de API
    await loadPopularMovies(1, value);
  }
});

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
    <p><strong>Rating:</strong> ${typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A'}</p>
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
  if (!query) return loadPopularMovies(1, currentSort); // terug naar populairste als leeg
  try {
    const results = await searchMovies(query);
    currentMovies = results;
    originalMovies = [...results];
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
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const todayStr = todayObj.toISOString().slice(0, 10);
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(todayObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

  if (isFav()) {
    let filtered = [...favorites];
    if (genreId) {
      filtered = filtered.filter(movie =>
        movie.genre_ids && movie.genre_ids.includes(Number(genreId))
      );
    }
    if (year) {
      filtered = filtered.filter(movie =>
        movie.release_date && movie.release_date.startsWith(year)
      );
    }
    if (releasedFilter === 'unreleased') {
      filtered = filtered.filter(movie =>
        movie.release_date && new Date(movie.release_date) >= tomorrowObj
      );
    } else if (releasedFilter === 'released') {
      filtered = filtered.filter(movie =>
        movie.release_date && new Date(movie.release_date) <= todayObj
      );
    }
    const value = sortDropdown.value;
    const sorted = value ? sortMovies(filtered, value) : filtered;
    currentMovies = sorted;
    originalMovies = [...filtered];
    renderMovies(sorted);
  } else {
    try {
      let extra = {};
      let sort = currentSort;
      if (releasedFilter === 'unreleased') {
        extra = { release_date_gte: tomorrowStr };
        sort = 'release_date.desc';
      } else if (releasedFilter === 'released') {
        extra = { release_date_lte: todayStr };
        sort = 'release_date.desc';
      }
      let filteredMovies = await getFilteredMovies(genreId, year, sort, extra);
      // Filter lokaal na op zekerheid
      if (releasedFilter === 'unreleased') {
        filteredMovies = filteredMovies.filter(movie =>
          movie.release_date && new Date(movie.release_date) >= tomorrowObj
        );
      } else if (releasedFilter === 'released') {
        filteredMovies = filteredMovies.filter(movie =>
          movie.release_date && new Date(movie.release_date) <= todayObj
        );
      }
      currentMovies = filteredMovies;
      originalMovies = [...filteredMovies];
      renderMovies(filteredMovies);
    } catch (err) {
      console.error('Fout bij toepassen van filters:', err);
      movieContainer.innerHTML = '<p>Sorry, er ging iets mis bij het toepassen van de filters.</p>';
    }
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
    const value = sortDropdown.value;
    const sorted = value ? sortMovies(favorites, value) : [...favorites];
    currentMovies = sorted;
    originalMovies = [...favorites];
    renderMovies(sorted);
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
  sortDropdown.value = ''; // Reset sorteeroptie
  currentSort = '';
  if (isFav()) {
    document.body.classList.add('favorites-only');
    currentMovies = [...favorites];
    originalMovies = [...favorites];
    renderMovies(favorites);
    document.getElementById('load-more').classList.add('hidden');
    favoritesToggleLabel.textContent = 'Alle films';
  } else {
    document.body.classList.remove('favorites-only');
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const todayStr = todayObj.toISOString().slice(0, 10);
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(todayObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

    let extra = {};
    let sort = currentSort;
    if (releasedFilter === 'unreleased') {
      extra = { release_date_gte: tomorrowStr };
      sort = 'release_date.desc';
    } else if (releasedFilter === 'released') {
      extra = { release_date_lte: todayStr };
      sort = 'release_date.desc';
    }
    loadPopularMovies(1, sort, extra);
    document.getElementById('load-more').classList.remove('hidden');
    favoritesToggleLabel.textContent = 'Favorieten';
  }
});

// Reset filters knop functionaliteit
document.getElementById('reset-filters').addEventListener('click', () => {
  document.getElementById('genre-filter').value = '';
  document.getElementById('year-filter').value = '';
  releasedFilter = 'all';
  updateReleasedToggleUI();
  if (isFav()) {
    currentMovies = [...favorites];
    originalMovies = [...favorites];
    renderMovies(favorites);
  } else {
    loadPopularMovies(1, currentSort, {});
  }
});