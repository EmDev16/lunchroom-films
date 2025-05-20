const API_KEY = import.meta.env.VITE_TMDB_KEY; // Zorg dat deze waarde correct is
console.log('Using API Key:', API_KEY); // Log the API key for debugging
const BASE_URL = 'https://api.themoviedb.org/3';

export async function fetchMovies() {
  try {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    if (response.status === 401) {
      console.error('Invalid API Key. Please check your .env file.');
      return [];
    }
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Failed to fetch movies:', error.message);
    return [];
  }
}

export async function getPopularMovies(page = 1) {
  const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=nl-BE&page=${page}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.results;
  } catch (err) {
    console.error('Fout bij ophalen populaire films:', err);
    return [];
  }
}

export async function searchMovies(query) {
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=nl-BE&query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.results;
  } catch (err) {
    console.error('Fout bij zoeken naar films:', err);
    return [];
  }
}

export async function getGenres() {
  const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=nl-BE`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.genres; // [{id: 28, name: "Action"}, ...]
  } catch (err) {
    console.error('Fout bij ophalen genres:', err);
    return [];
  }
}

export async function getFilteredMovies(genreId = '', year = '', page = 1) {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=nl-BE&page=${page}&with_genres=${genreId}&primary_release_year=${year}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.results;
  } catch (err) {
    console.error('Fout bij ophalen gefilterde films:', err);
    return [];
  }
}