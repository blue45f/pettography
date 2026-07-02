# BGM assets

Tracks are used under the Pixabay Content License (free for commercial use, no
attribution required). Not for standalone redistribution.

- `moonpetal-garden.mp3` — "Moonpetal Garden (Cottagecore Folk, Female Vocals)" by
  MoonpetalMedia — <https://pixabay.com/music/folk-moonpetal-garden-cottagecore-folk-song-with-female-vocals-548574/>
- `mornings-whisper.mp3` — "Mornings Whisper (Indie Folk, Male Vocal)" by kaazoom —
  <https://pixabay.com/music/indie-pop-mornings-whisper-indie-folk-love-song-male-vocal-509675/>

`playlist.json` is the runtime contract consumed by the web app (same-origin) and the
Apps in Toss mini app (cross-origin from `https://pettography.vercel.app`, CORS headers
configured in `vercel.json`). Schema:
`{ "tracks": [{ "src", "title", "artist", "license", "creditUrl" }] }`.
If this file is absent or empty, the BGM feature hides itself entirely.
