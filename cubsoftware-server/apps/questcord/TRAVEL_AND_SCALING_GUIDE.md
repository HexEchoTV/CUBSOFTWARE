# QuestCord Travel & Progressive Difficulty Guide

## 🗺️ How Travel Works

### Current System:
The `/travel` command shows you all Discord servers you're in that have QuestCord enabled.

**To quest in another server:**
1. Run `/travel` to see available servers
2. **Manually navigate** to that Discord server (click it in your server list)
3. Run `/quests` in that server
4. Complete quests there

**Important:** Discord doesn't allow bots to "teleport" users between servers. Users must manually click to go to other servers.

### What `/travel` Shows:
- Server name
- Member count
- Total quests completed in that server
- Your current location (marked with [CURRENT])

### Finding New Servers:
To quest in MORE servers:
1. Join Discord servers that have QuestCord
2. Server owners must run `/optin` to enable quests
3. The server will then appear in your `/travel` list

---

## 📈 Progressive Difficulty System (NEW!)

### Quest Scaling by Level:

| Level Range | Quest Distribution | Description |
|-------------|-------------------|-------------|
| **1-4** | 3 Easy, 1 Medium | Beginner adventurer - learning the ropes |
| **5-14** | 1 Easy, 2 Medium, 1 Hard | Gaining experience |
| **15-29** | 2 Medium, 2 Hard | Experienced quester |
| **30-49** | 1 Medium, 3 Hard | Veteran explorer |
| **50+** | 4 Hard | Legendary hero |

### Reward Scaling:
- **Base Rewards**: Currency and gems from quest template
- **Level Bonus**: +5% per level
- **Example**:
  - Level 1: 100 currency quest = 100 (base)
  - Level 10: 100 currency quest = 150 (1.5x)
  - Level 20: 100 currency quest = 200 (2x)
  - Level 50: 100 currency quest = 350 (3.5x)

### Combat Quest Scaling:
- **Base Clicks**: Easy=10, Medium=20, Hard=30
- **Level Bonus**: +1 click per 5 levels
- **Time Limit**: 30s base + 5s per 10 levels
- **Example (Level 25, Hard quest)**:
  - Clicks needed: 30 + (25÷5) = 35 clicks
  - Time limit: 30 + (25÷10×5) = 40 seconds

### Gathering Quest Scaling:
- **Base Time**: Easy=30s, Medium=60s, Hard=120s
- **Level Reduction**: -10% per 10 levels (max 50%)
- **Example (Level 30, Hard quest)**:
  - Base time: 120s
  - Reduction: 30% (level 30)
  - Actual time: 84 seconds

### Delivery Quest Scaling:
- **Base Time**: Easy=20s, Medium=40s, Hard=60s
- **Level Reduction**: -10% per 10 levels (max 50%)
- **Example (Level 50, Medium quest)**:
  - Base time: 40s
  - Reduction: 50% (level 50, capped)
  - Actual time: 20 seconds

### XP Bonuses:
- **Low-level bonus**: Extra XP for doing hard quests at low levels
  - Level <5 doing Medium: +25% XP
  - Level <10 doing Hard: +50% XP

---

## 🎮 Autocomplete Features

### Currently Available:
Most commands use Discord's built-in option types which provide autocomplete:

1. **`/admin`** - User selection autocomplete
2. **`/attack`** - No options needed
3. **`/balance`** - No options needed
4. **`/boss`** - No options needed
5. **`/help`** - Has quick action buttons
6. **`/leaderboard`** - No options needed
7. **`/optin/optout`** - No options needed
8. **`/profile`** - User option with autocomplete
9. **`/quests`** - Uses interactive buttons
10. **`/rank`** - No options needed
11. **`/restart`** - String option for reason
12. **`/travel`** - Shows list in embed
13. **`/tutorial`** - No options needed

### Button-Based Commands:
Instead of autocomplete, these use **interactive buttons** (better UX):
- `/quests` - Click "Accept Quest" buttons
- `/help` - Quick action buttons

---

## 💡 Tips for Faster Progression

### Maximize Quests Per Day:
1. Complete all 5 quests in your main server
2. Run `/travel` to see other servers
3. Go to each server and complete 5 more quests
4. Repeat for all servers you're in

**Example**: If you're in 5 servers with QuestCord:
- 5 servers × 5 quests = **25 quests per day!**

### Focus on Higher Difficulty:
- Hard quests give 2x rewards vs easy quests
- As you level up, hard quests become easier (less time)
- But rewards keep scaling up!

### Level Up Efficiently:
- Do hard quests for maximum XP
- Low-level players get bonus XP on hard quests
- Higher level = better quest rewards

---

## 🔮 Potential Future Enhancements

### Travel System:
- Server discovery system
- Public server directory
- Server invite links in `/travel`
- Quest hub/portal concept
- Cross-server leaderboards

### Difficulty Scaling:
- Prestige system (reset level for bonuses)
- Mythic quests (level 100+)
- Dynamic difficulty based on performance
- Quest modifiers (extra hard, speed run, etc.)

---

## 📊 Example Progression

### Level 1 Player:
- Quest distribution: 3 Easy, 1 Medium
- Easy quest rewards: 100 currency (base)
- Combat clicks: 10 (easy), 20 (medium)
- Total daily potential: ~1,500 currency (5 quests × average)

### Level 25 Player:
- Quest distribution: 2 Medium, 2 Hard
- Hard quest rewards: 500 × 2.25 = 1,125 currency
- Combat clicks: 35 (hard quest)
- Total daily potential: ~4,500 currency

### Level 50 Player:
- Quest distribution: 4 Hard
- Hard quest rewards: 500 × 3.5 = 1,750 currency
- Combat clicks: 40 (hard quest)
- Gathering time: 50% faster
- Total daily potential: ~8,000+ currency

**More servers = Exponentially more rewards!**

---

## Summary

✅ **Travel**: Shows available servers, navigate manually
✅ **Scaling**: Quests get progressively harder AND more rewarding
✅ **Autocomplete**: Built into Discord's user/option selectors
✅ **Buttons**: Better UX than autocomplete for quest selection
✅ **Progression**: Level up → Better quests → Faster completion → More rewards

The system rewards both **leveling up** (better individual rewards) and **server diversity** (more quest opportunities)!
