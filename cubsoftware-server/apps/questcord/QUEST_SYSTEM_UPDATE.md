# QuestCord Interactive Quest System Update

## Changes Made

### ✅ Removed `/complete` Command
The old `/complete <number>` command has been completely removed. Users no longer manually complete quests.

### ✅ New Interactive Quest System

#### Updated `/quests` Command
- Shows all available quests with **clickable buttons**
- Each quest displays its type emoji (🗡️ 🌿 🗺️ 📦 💬)
- Click "Accept Quest" button to start the quest
- Different quest types have different mechanics

#### Quest Types & Mechanics

| Type | Emoji | Mechanic | Description |
|------|-------|----------|-------------|
| **Combat** | 🗡️ | Button Mashing | Click "Attack!" repeatedly to defeat the enemy (10-30 clicks depending on difficulty) within 30 seconds |
| **Gathering** | 🌿 | Timer-based | Wait 30-120 seconds (based on difficulty) while resources are gathered - auto-completes |
| **Exploration** | 🗺️ | Multi-step Journey | Click "Continue Journey" through 5 locations to reach your destination |
| **Delivery** | 📦 | Timer-based | Wait 20-60 seconds (based on difficulty) while traveling - auto-completes |
| **Social** | 💬 | Instant | Completes immediately upon acceptance |

### ✅ Updated Commands

#### `/help`
- Removed references to `/complete`
- Added information about interactive quest tasks
- Updated quest flow instructions

#### `/tutorial`
- Added "Interactive Questing System" section
- Explains all 5 quest types
- Removed `/complete` instructions

#### `/travel`
- Improved description
- Added explanation of how to travel between servers
- Better formatting

### ✅ Auto-Completion
- Quests automatically complete when the task is finished
- No manual completion required
- Rewards are automatically granted

### ✅ New Files Created

1. **src/bot/utils/questInteractions.js**
   - Handles all quest button interactions
   - Implements different quest mechanics
   - Auto-completion logic
   - Level-up and reward calculations

2. **src/bot/events/interactionCreate.js** (Updated)
   - Now handles button interactions
   - Routes quest buttons to appropriate handlers
   - Error handling for interactions

---

## How It Works

### User Flow

1. User runs `/quests` in a server
2. Bot displays available quests with "Accept Quest" buttons
3. User clicks a button to accept a quest
4. Quest-specific interaction begins:
   - **Combat**: Spam click "Attack!" button
   - **Gathering**: Wait for timer
   - **Exploration**: Click through locations
   - **Delivery**: Wait for delivery
   - **Social**: Instant complete
5. Quest auto-completes when finished
6. Rewards are automatically granted

### Technical Implementation

```javascript
// Quest acceptance
accept_quest_{questId} button → handleQuestAccept()

// Quest-specific handlers
combat_attack_{questId} → handleCombatAttack()
explore_continue_{questId}_{step} → handleExplorationContinue()

// Timer-based quests
setTimeout() → auto-completion after time expires
```

---

## Testing the New System

### Step 1: Deploy Commands
```bash
npm run deploy
```

### Step 2: Restart Bot
```bash
pm2 restart questcord
```

### Step 3: Test Each Quest Type

#### Test Combat Quest
1. Run `/quests`
2. Accept a combat quest (🗡️)
3. Click "Attack!" button rapidly
4. Should complete after required clicks

#### Test Gathering Quest
1. Run `/quests`
2. Accept a gathering quest (🌿)
3. Wait for the timer
4. Should auto-complete

#### Test Exploration Quest
1. Run `/quests`
2. Accept an exploration quest (🗺️)
3. Click "Continue Journey" 5 times
4. Should complete after all locations

#### Test Delivery Quest
1. Run `/quests`
2. Accept a delivery quest (📦)
3. Wait for the delivery timer
4. Should auto-complete

#### Test Social Quest
1. Run `/quests`
2. Accept a social quest (💬)
3. Should complete instantly

---

## Benefits of New System

✅ **More Engaging** - Interactive tasks instead of instant completion
✅ **Variety** - Different mechanics for different quest types
✅ **Better UX** - Visual buttons instead of typing commands
✅ **Auto-completion** - No need to remember to complete quests
✅ **Intuitive** - Click buttons, see progress, get rewards
✅ **Scalable** - Easy to add new quest types in the future

---

## Deployment Commands

```bash
# On VPS
cd ~/QuestCord-v3

# Pull latest code
git pull

# Install dependencies (if needed)
npm install

# Deploy slash commands
npm run deploy

# Restart bot
pm2 restart questcord

# View logs
pm2 logs questcord
```

---

## Files Modified

### Updated:
- `src/bot/commands/quests.js` - Added buttons and interactive UI
- `src/bot/commands/help.js` - Removed `/complete` references
- `src/bot/commands/tutorial.js` - Added quest type explanations
- `src/bot/commands/travel.js` - Improved description
- `src/bot/events/interactionCreate.js` - Added button handling

### Created:
- `src/bot/utils/questInteractions.js` - Quest interaction logic

### Deleted:
- `src/bot/commands/complete.js` - No longer needed

---

## Known Issues / Future Enhancements

### Potential Enhancements:
- Add quest progress tracking in database
- Add ability to cancel active quests
- Add quest cooldowns
- Add more quest types (puzzle, riddle, trivia)
- Add quest chains/storylines
- Add rare/legendary quests

### Notes:
- Timer-based quests use `setTimeout()` - if bot restarts during timer, quest will be lost
- Consider adding persistence for active quests in future update
- Button interactions expire after 15 minutes (Discord limitation)

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs questcord`
2. Check Discord reporting channel for errors
3. Verify commands are deployed: `npm run deploy`
4. Restart bot: `pm2 restart questcord`

---

**The quest system is now fully interactive and engaging! Users will love the variety of mechanics! 🎮**
