# lunchroom-films
## Projectbeschrijving
Lunchroom Films is een interactieve single-page applicatie (SPA) waarmee gebruikers:
- Populaire en gezochte films uit The Movie Database (TMDb) kunnen verkennen
- Films kunnen filteren op genre en jaar
- Films kunnen doorzoeken met een live zoek­functie (debounce)
- Favoriete films kunnen opslaan en beheren (LocalStorage)
- Te­recht­kunnen in een licht- of donker­theme, met voorkeuren bewaard
- Responsief en visueel aantrekkelijk kunnen navigeren

## Functionaliteiten

1. Dataverzameling & weergave
- getPopularMovies() haalt 20+ films op via TMDb API
- Filmkaarten tonen poster, titel, rating
2. Interactiviteit
- Live zoekbalk met debounce
- Genre- en jaar­filter
- Sorteermogelijkheid (later uitbreiden)
3.  Personalisatie
- “★” knop om favorieten te togglen
- Favorieten persist in LocalStorage
- Thema­keuze (light/dark) persist in LocalStorage
4. User Experience
- Responsive grid met CSS Grid & Flexbox
- Hover- & focus­effecten op cards
- Fout- en loading­meldingen

## Gebruikte API’s
  TMDb API
    Basis­endpoint: https://api.themoviedb.org/3
    Documentatie: https://developers.themoviedb.org/3

## Troubleshooting
1. Ensure the `.env` file contains a valid `VITE_TMDB_KEY`.
2. Check the browser console for API errors or warnings.
3. Verify network requests using browser developer tools.
4. If movies are not displayed, check the API response in `src/api.js`.
5. Log the API key in `src/main.js` and `src/api.js` to ensure it's being used correctly.
