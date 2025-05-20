import './style.css';
import { getPopularMovies } from './api.js';

const apiKey = import.meta.env.VITE_TMDB_KEY;
const baseUrl = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p/w300';

// 1. Root-element
const app = document.getElementById('app');

// 2. Maak container voor films
const movieContainer = document.createElement('div');
movieContainer.id = 'movie-list';
app.appendChild(movieContainer);

// 3. Fetch populaire films
async function loadPopularMovies() {
  try {
    const movies = await getPopularMovies();
    renderMovies(movies);
  } catch (err) {
    console.error('Fout bij ophalen populaire films:', err);
    movieContainer.innerHTML = '<p>Sorry, er ging iets mis bij het laden van de films.</p>';
  }
}

// 4. Render-functie
function renderMovies(movies) {
  movieContainer.innerHTML = ''; // leegmaken
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img
        src="${movie.poster_path ? imageBase + movie.poster_path : ''}"
        alt="${movie.title}"
        loading="lazy"
      />
      <h3>${movie.title}</h3>
      <p>${movie.overview.slice(0, 100)}…</p>
    `;
    movieContainer.appendChild(card);
  });
}

// 5. Thema
const themeToggle = document.getElementById('theme-toggle');

// Load theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeToggle.checked = true;
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