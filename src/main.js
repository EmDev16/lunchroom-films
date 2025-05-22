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

// State
let currentMovies = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Helper
function isFav() {
  return document.getElementById('favorites-toggle').checked;
}

// 3. Fetch populaire films
let currentPage = 1; // Houd bij welke pagina momenteel wordt weergegeven

async function loadPopularMovies() {
  try {
    const movies = await getPopularMovies(currentPage);
    if (!movies.length) {
      console.warn('No movies returned from the API.');
      movieContainer.innerHTML = '<p>No movies available at the moment.</p>';
      return;
    }
    currentMovies = movies;
    renderMovies(movies);
    document.getElementById('load-more').classList.remove('hidden'); // Maak de knop zichtbaar
  } catch (err) {
    console.error('Error fetching popular movies:', err);
    movieContainer.innerHTML = '<p>Sorry, something went wrong while loading the movies.</p>';
  }
}

async function loadMoreMovies() {
  if (isFav()) return; // Niet laden in favorietenmodus
  try {
    currentPage++; // Verhoog de pagina
    const sortValue = document.getElementById('sort-dropdown').value || 'release_date.desc'; // Standaard sorteeroptie
    const genreId = document.getElementById('genre-filter').value; // Haal het geselecteerde genre op
    const year = document.getElementById('year-filter').value; // Haal het geselecteerde jaar op
    const extraFilters = {};

    // Voeg extra filters toe voor unreleased/released
    const today = new Date().toISOString().split('T')[0]; // Dynamische huidige datum
    if (currentStatus === 'unreleased') {
      extraFilters.release_date_gte = today; // Alleen toekomstige films vanaf vandaag
      sortValue = 'release_date.asc'; // Sorteer oplopend (van vandaag naar toekomst)
    } else if (currentStatus === 'released') {
      extraFilters.release_date_lte = today; // Alleen reeds uitgebrachte films tot vandaag
      sortValue = 'release_date.desc'; // Sorteer aflopend (van vandaag naar verleden)
    }

    const moreMovies = await getFilteredMovies(genreId, year, sortValue, extraFilters, currentPage); // Haal meer films op met de juiste filters
    const uniqueMovies = moreMovies.filter(
      (movie) => !currentMovies.some((currentMovie) => currentMovie.id === movie.id)
    ); // Vermijd dubbele films

    if (!uniqueMovies.length) {
      console.warn('No more unique movies to load.');
      document.getElementById('load-more').classList.add('hidden'); // Verberg de knop als er geen unieke films meer zijn
      return;
    }

    renderMovies(uniqueMovies, true); // Voeg de nieuwe unieke films toe aan de weergave
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
  if (!append) {
    movieContainer.innerHTML = ''; // Leegmaken tenzij we films toevoegen
    currentMovies = []; // Reset de huidige lijst als we niet toevoegen
  }
  currentMovies = [...currentMovies, ...movies]; // Voeg nieuwe films toe aan de huidige lijst
  // Favorietenmelding tonen/verbergen
  const favMsg = document.getElementById('favorites-empty-message');
  if (isFav() && favorites.length === 0) {
    favMsg && (favMsg.style.display = '');
  } else {
    favMsg && (favMsg.style.display = 'none');
  }
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
      <p><strong>Rating:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
    `;
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Voorkom dat de klik op de ster de overlay opent
      toggleFavorite(movie);
      favoriteBtn.classList.toggle('active', favorites.some(fav => fav.id === movie.id));
      // Direct updaten van favorietenlijst indien in favorieten-modus
      if (isFav()) renderMovies(favorites);
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
document.getElementById('apply-filters').addEventListener('click', applyFilters);

// Voeg een eventlistener toe aan de "Reset filters" knop
document.getElementById('reset-filters').addEventListener('click', () => {
  document.getElementById('genre-filter').value = ''; // Reset genre filter
  document.getElementById('year-filter').value = ''; // Reset jaar filter
  document.getElementById('status-toggle').textContent = 'All'; // Reset "Status" toggle
  currentStatus = 'all'; // Reset status
  document.getElementById('sort-dropdown').value = ''; // Reset sortering
  loadPopularMovies(); // Laad de populairste films opnieuw
});

// Voeg een eventlistener toe aan de "Status" toggle
const statusToggle = document.getElementById('status-toggle');
let currentStatus = 'all'; // Mogelijke waarden: 'all', 'released', 'unreleased'

// Voeg een klikgebeurtenis toe aan de status-knop
statusToggle.addEventListener('click', () => {
  if (currentStatus === 'all') {
    currentStatus = 'released';
    statusToggle.textContent = 'Released';
  } else if (currentStatus === 'released') {
    currentStatus = 'unreleased';
    statusToggle.textContent = 'Unreleased';
  } else {
    currentStatus = 'all';
    statusToggle.textContent = 'All';
  }
});

async function applyFilters() {
  const genreId = document.getElementById('genre-filter').value;
  const year = document.getElementById('year-filter').value; // Haal het geselecteerde jaar op
  let sortValue = document.getElementById('sort-dropdown').value || 'release_date.desc'; // Standaard sorteeroptie
  const extraFilters = {};

  // Voeg extra filters toe op basis van de huidige status
  const today = new Date().toISOString().split('T')[0]; // Dynamische huidige datum
  if (currentStatus === 'unreleased') {
    extraFilters.release_date_gte = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]; // Vanaf morgen
    sortValue = 'release_date.asc'; // Sorteer oplopend (van morgen naar toekomst)
  } else if (currentStatus === 'released') {
    extraFilters.release_date_lte = today; // Tot vandaag
    sortValue = 'release_date.desc'; // Sorteer aflopend (van vandaag naar verleden)
  }
  // Voor "All" zijn er geen extra filters nodig

  // Voeg een filter toe voor het jaartal
  if (year) {
    extraFilters.primary_release_year = year; // Filter op het geselecteerde jaar
  }

  try {
    currentPage = 1; // Reset naar de eerste pagina
    showLoadingIndicator(true); // Toon laadindicator
    const filteredMovies = await fetchAllMovies(genreId, year, sortValue, extraFilters); // Haal gefilterde en gesorteerde films op
    currentMovies = filteredMovies; // Update de huidige lijst
    renderMovies(currentMovies); // Toon de gefilterde en gesorteerde films
    document.getElementById('load-more').classList.remove('hidden'); // Zorg dat de "Meer laden" knop zichtbaar blijft
  } catch (err) {
    console.error('Fout bij toepassen van filters:', err);
    movieContainer.innerHTML = '<p>Sorry, er ging iets mis bij het toepassen van de filters.</p>';
  } finally {
    showLoadingIndicator(false); // Verberg laadindicator
  }
}

async function fetchAllMovies(genreId, year, sortValue, extraFilters) {
  let allMovies = [];
  let page = 1;
  let hasMore = true;
  const maxPages = 5; // Limiteer het aantal pagina's om de UX te verbeteren

  while (hasMore && page <= maxPages) {
    const params = new URLSearchParams({
      api_key: import.meta.env.VITE_TMDB_KEY,
      with_genres: genreId || '',
      sort_by: sortValue || 'popularity.desc',
      page
    });

    // Voeg extra filters toe voor unreleased/released
    if (extraFilters.release_date_gte) {
      params.set('release_date.gte', extraFilters.release_date_gte);
    }
    if (extraFilters.release_date_lte) {
      params.set('release_date.lte', extraFilters.release_date_lte);
    }

    // Voeg het jaartal filter toe
    if (extraFilters.primary_release_year) {
      params.set('primary_release_year', extraFilters.primary_release_year);
    }

    const res = await fetch(`https://api.themoviedb.org/3/discover/movie?${params}`);
    if (!res.ok) {
      throw new Error(`Fout bij ophalen films: ${res.status}`);
    }

    const data = await res.json();

    if (data.results.length === 0) {
      hasMore = false;
    } else {
      allMovies = [...allMovies, ...data.results];
      page++;
    }
  }

  return allMovies;
}

function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (show) {
    if (!loadingIndicator) {
      const indicator = document.createElement('div');
      indicator.id = 'loading-indicator';
      indicator.textContent = 'Laden...';
      indicator.style.textAlign = 'center';
      indicator.style.margin = '1rem 0';
      movieContainer.appendChild(indicator);
    }
  } else {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// 10. Favorieten beheren
function toggleFavorite(movie) {
  const index = favorites.findIndex(fav => fav.id === movie.id);
  if (index === -1) {
    favorites.push(movie);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites)); // Sla favorieten op
  // Bij favorietenmodus: direct updaten
  if (isFav()) renderMovies(favorites);
}

// Voeg een klikgebeurtenis toe aan de "Favorieten" toggle
document.getElementById('favorites-toggle').addEventListener('change', () => {
  const favoritesToggleLabel = document.getElementById('favorites-toggle-label');
  if (isFav()) {
    renderMovies(favorites);
    document.getElementById('load-more').classList.add('hidden'); // Verberg de "Meer laden" knop
    favoritesToggleLabel.textContent = 'Alle films'; // Verander tekst naar "Alle films"
  } else {
    currentPage = 1; // Reset naar de eerste pagina
    loadPopularMovies(); // Laad de volledige lijst opnieuw
    favoritesToggleLabel.textContent = 'Favorieten'; // Verander tekst naar "Favorieten"
  }
});

// Voeg een klikgebeurtenis toe aan de scroll-to-top knop
document.getElementById('scroll-top-btn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Voeg een eventlistener toe aan de sorteer-dropdown
document.getElementById('sort-dropdown').addEventListener('change', () => {
  applyFilters(); // Pas filters opnieuw toe bij wijziging van de sorteeroptie
});

// 11. Kick-off
loadGenres();
document.getElementById('load-more').addEventListener('click', loadMoreMovies);