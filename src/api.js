const BASE_URL = 'https://api.themoviedb.org/3';
const apiKey = import.meta.env.VITE_TMDB_KEY;

export async function getPopularMovies(page = 1) {
  const url = `${BASE_URL}/movie/popular?api_key=${apiKey}&language=nl-BE&page=${page}`;
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
  const url = `${BASE_URL}/search/movie?api_key=${apiKey}&language=nl-BE&query=${encodeURIComponent(query)}`;
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