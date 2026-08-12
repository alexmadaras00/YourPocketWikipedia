// ── Pocketpedia configuration ─────────────────────────────────────────────────
// Copy this file to config.js and fill in your Google Sheets CSV URLs.
//
// How to get the URLs:
//  1. Open your Google Sheet
//  2. File → Share → Publish to web
//  3. Select the "Tours" tab → CSV format → Publish → Copy URL
//  4. Repeat for the "Stops" tab
//
// "Tours" sheet columns (row 1 is header):
//   id | title | theme | description | coverImageUrl | durationMinutes | distanceKm | instagramPostUrl
//
// "Stops" sheet columns (row 1 is header):
//   id | tourId | name | description | latitude | longitude | photoUrl | audioUrl | order

window.POCKETPEDIA_CONFIG = {
  TOURS_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?gid=0&format=csv',
  STOPS_URL: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?gid=YOUR_STOPS_GID&format=csv',
};
