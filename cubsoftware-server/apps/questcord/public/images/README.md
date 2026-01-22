# Website Images

Add these images to make your website look amazing:

## Required Images

### 1. `compass-icon.png` (Hero Section)
- **Size**: 80x80px or larger (square)
- **Style**: Cartoon compass or map icon
- **Suggestions**:
  - Animated compass with cardinal directions
  - Fantasy-style treasure map icon
  - Quest marker icon
- **Background**: Transparent PNG

### 2. `quest-example.png` (What is QuestCord Section)
- **Size**: 500x600px or similar aspect ratio
- **Content**: Screenshot of Discord quest interface
- **Suggestions**:
  - Screenshot of `/quests` command showing quest list
  - Multiple quest types displayed
  - Include the interactive buttons

### 3. `activity-example.png` (Live Activity Section)
- **Size**: 500x600px or similar aspect ratio
- **Content**: Screenshot showing activity feed or stats
- **Suggestions**:
  - Multiple activity entries
  - Different quest completions
  - Boss defeats
  - Level ups

### 4. `leaderboard-example.png` (Leaderboard Section)
- **Size**: 500x600px or similar aspect ratio
- **Content**: Screenshot of leaderboard
- **Suggestions**:
  - Top players with medals
  - Score displays
  - `/leaderboard` command output

## Temporary Placeholders

Until you add your images, the website will show colored placeholder images with text. The `onerror` handler ensures the site won't break if images are missing.

## How to Add Images

1. Take screenshots of your Discord bot in action
2. Crop and resize to recommended dimensions
3. Save as PNG files with the exact names above
4. Upload to this directory (`public/images/`)
5. Restart the web server: `pm2 restart questcord`

## Tips

- Use high-quality screenshots with Discord dark mode
- Ensure text is readable in screenshots
- Add a subtle border or shadow in image editor for polish
- Keep file sizes under 500KB for fast loading
