# lunchroom-films
Lunchroom Films is een interactieve single-page applicatie (SPA) waarmee gebruikers:
Populaire en gezochte films uit The Movie Database (TMDb) kunnen verkennen, Films kunnen filteren op genre en jaar, Films kunnen doorzoeken met een live zoek­functie (debounce), Favoriete films kunnen opslaan en beheren (LocalStorage), Te­recht­kunnen in een licht- of donker­theme, met voorkeuren bewaard, Responsief en visueel aantrekkelijk kunnen navigeren


## Troubleshooting
1. Ensure the `.env` file contains a valid `VITE_TMDB_KEY`.
2. Check the browser console for API errors or warnings.
3. Verify network requests using browser developer tools.
4. If movies are not displayed, check the API response in `src/api.js`.
5. Log the API key in `src/main.js` and `src/api.js` to ensure it's being used correctly.
