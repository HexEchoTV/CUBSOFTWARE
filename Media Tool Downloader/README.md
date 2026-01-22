# YouTube & Spotify to MP3 Downloader

Fast music downloader that extracts audio at the highest quality (320kbps). Supports YouTube, YouTube Music, and Spotify.

## Requirements

- Python 3.12
- FFmpeg (for audio conversion)
- yt-dlp (for YouTube)
- spotdl (for Spotify)

**All automatically installed!**

## Quick Start (Windows)

Just run:
```bash
download.bat <URL>
```

## Usage

**YouTube video:**
```bash
python downloader.py https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**YouTube playlist:**
```bash
python downloader.py https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```

**YouTube Music playlist:**
```bash
python downloader.py https://music.youtube.com/playlist?list=OLAK5uy_n2UB4DG_BsOmVWgAUZ7XlD7IokelMlmMQ
```

**Spotify track:**
```bash
python downloader.py https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
```

**Spotify playlist:**
```bash
python downloader.py https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
```

**Using the batch file:**
```bash
download.bat <ANY_URL>
```

## Output

- **Single tracks:** `downloads/Artist - Title.mp3`
- **Playlists:** `downloads/Playlist Name/Artist - Title.mp3`

## Features

- **320kbps MP3** (highest quality)
- **Proper ID3 tags** - Artist, Title, Album metadata
- **Album artwork** embedded in MP3 files
- **Multiple sources:**
  - YouTube videos
  - YouTube Music
  - Spotify tracks & playlists
- **Playlist support** - Download entire playlists automatically
- **Auto-skip** unavailable tracks
- **Organized folders** for playlists
- **No API keys required**
