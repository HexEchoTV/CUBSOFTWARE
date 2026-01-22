# StreamerBot Commands - Future Development Plans

**Last Updated:** 2026-01-06
**Status:** Planning & Development Phase

---

## 🚧 Existing Features - Not Yet Finished

The following features exist in the repository but are **not yet completed** and require further development:

### Currency Games (In Progress)
- [ ] **Dungeon** - `Currency/Games/Dungeon/`
- [ ] **Explore** - `Currency/Games/Explore/`
- [ ] **Fish** - `Currency/Games/Fish/`
- [ ] **Flip** - `Currency/Games/Flip/`
- [ ] **Forage** - `Currency/Games/Forage/`
- [ ] **Gamble** - `Currency/Games/Gamble/`
- [ ] **Heist** - `Currency/Games/Heist/`
- [ ] **Hunt** - `Currency/Games/Hunt/`
- [ ] **Ladder** - `Currency/Games/Ladder/`
- [ ] **Limbo** - `Currency/Games/Limbo/`
- [ ] **Match** - `Currency/Games/Match/`
- [ ] **Mine** - `Currency/Games/Mine/`
- [ ] **Mines** - `Currency/Games/Mines/`
- [ ] **Pet** - `Currency/Games/Pet/`
- [ ] **Pickpocket** - `Currency/Games/Pickpocket/`
- [ ] **Quest** - `Currency/Games/Quest/`
- [ ] **Race** - `Currency/Games/Race/`
- [ ] **Roulette** - `Currency/Games/Roulette/`
- [ ] **Search** - `Currency/Games/Search/`
- [ ] **Slots** - `Currency/Games/Slots/`
- [ ] **Spin** - `Currency/Games/Spin/`
- [ ] **Streak** - `Currency/Games/Streak/`
- [ ] **Tower** - `Currency/Games/Tower/`
- [ ] **Trivia** - `Currency/Games/Trivia/`
- [ ] **Vault** - `Currency/Games/Vault/`
- [ ] **Wheel** - `Currency/Games/Wheel/`

**Total Unfinished Games:** 26

### Utility Commands (In Progress)
- [ ] **Commands List** - `Utilities/Commands-List/`
- [ ] **Karaoke** - `Utilities/Karaoke/`
- [ ] **Multi-Twitch** - `Utilities/Multi-Twitch/`
- [ ] **Quotes** - `Utilities/Quotes/`
- [ ] **Stream Info** - `Utilities/Stream-Info/`
- [ ] **Uptime** - `Utilities/Uptime/`
- [ ] **Watchtime** - `Utilities/Watchtime/`

**Total Unfinished Utilities:** 7

---

## 🎯 New Features - Planned Development

The following are **brand new features** planned for implementation. See `IMPLEMENTATION-PLAN.md` for detailed step-by-step development guide.

### Phase 1: Core Infrastructure
- [ ] **Configuration Extensions** - Add config variables for all new features
- [ ] **Database Schema** - Plan and implement new global/user variables

### Phase 2: Interactive Overlay Games ⭐ **Priority**
- [ ] **Maze Game** - Chat-controlled maze with channel point queue
  - 5 unique maps
  - Wall collision detection
  - Queued movement system
  - Contributor reward splitting
  - OBS browser source integration
  - Mod controls (!mazestart, !mazestop, etc.)

- [ ] **Snake Game** - Classic snake controlled by chat
  - Channel point queue system
  - Real-time multiplayer control
  - Score-based rewards
  - Weighted contributor distribution
  - High score tracking
  - Mod controls (!snakestart, !snakestop, etc.)

### Phase 3: Community Engagement Features
- [ ] **Random Viewer Picker** - Giveaway and random selection system
  - Multiple winner support
  - Weighted by watchtime/subs
  - Currency entry fee option
  - Bot/mod filtering

- [ ] **Achievement System** - 30+ unlockable achievements
  - Achievement categories (Social, Loyalty, Games, Currency, Special)
  - Rarity tiers (Common, Uncommon, Rare, Epic, Legendary)
  - Progress tracking
  - Unlock notifications
  - Currency rewards
  - Profile showcase

- [ ] **Chat Wars / Team Battles** - Team-based competition system
  - 2-4 team support (Red, Blue, Green, Yellow)
  - Timed battle events
  - Multiple challenge types (trivia, math, emote spam, donations)
  - Real-time scoreboard
  - Team rewards and MVP bonuses

- [ ] **Counting Game** - Community counting challenge
  - Sequential counting (1, 2, 3...)
  - Reset on errors
  - Milestone rewards (100, 500, 1000)
  - High score tracking
  - Culprit detection

- [ ] **Word Chain Game** - Last letter word chain
  - Word validation
  - Chain length tracking
  - Record tracking
  - Periodic rewards
  - Dictionary integration (optional)

### Phase 4: Raiding & Networking Features
- [ ] **Enhanced Raid Handler** - Advanced raid detection and response
  - Fetch raider stats via Twitch API
  - Custom welcome messages with stats
  - Currency bonuses for raiders
  - Raid history tracking
  - Discord logging with embeds

- [ ] **Auto-Raid Rotation** - Automated raid target selection
  - Streamer rotation list
  - Priority weighting system
  - Live status checking
  - Auto-raid on stream end
  - Manual raid commands

- [ ] **Squad/Team Stats** - Twitch Teams integration
  - Show live team members
  - Multi-stream links
  - Team statistics
  - Live status tracking

### Phase 5: Moderation & Analytics
- [ ] **Advanced Mod Tools** - Enhanced moderation system
  - Warning/strike system
  - Auto-timeout on strikes
  - Timeout reason library
  - Mod action logging
  - Warning history tracking

- [ ] **Viewer Stats Dashboard** - Comprehensive user profiles
  - Aggregate stats (watchtime, currency, games, achievements)
  - Profile command (!profile @user)
  - Comparison system (!compare user1 user2)
  - Percentile rankings
  - Personal bests

### Phase 6: Stream Analytics & Goals
- [ ] **Goal Tracker System** - Multi-goal tracking
  - Follower/sub/bit goals
  - Custom currency goals
  - Progress tracking
  - Milestone celebrations
  - OBS overlay integration

- [ ] **Stream Stats Command** - Session statistics
  - New followers/subs/bits
  - Peak viewer count
  - Top chatters
  - Currency distributed
  - Games played
  - Auto-reset per stream

### Phase 7: Economy Enhancement
- [ ] **Stock Market Simulator** - Virtual stock trading
  - 5-10 virtual stocks
  - Price fluctuation engine
  - Buy/sell commands
  - Portfolio tracking
  - Market events (bull/bear markets, crashes, booms)
  - Stock leaderboards

### Phase 8: Testing & Documentation
- [ ] **Comprehensive Testing** - Test all features
- [ ] **User Documentation** - README files for all features
- [ ] **Configuration Templates** - Document all new variables
- [ ] **Main README Update** - Update with new features

---

## 📊 Development Statistics

### Current Status
- **Existing Features (Unfinished):** 33
- **New Features (Planned):** 15
- **Total Development Tasks:** 48
- **Implementation Steps (New Features):** 52

### Priority Levels
- 🔴 **High Priority:** Interactive Overlay Games (Maze, Snake)
- 🟡 **Medium Priority:** Community Engagement, Achievements
- 🟢 **Low Priority:** Stock Market, Advanced Stats

### Estimated Timeline
- **Phase 1 (Infrastructure):** 1-2 hours
- **Phase 2 (Games):** 6-8 hours
- **Phase 3 (Community):** 5-6 hours
- **Phase 4 (Raiding):** 3-4 hours
- **Phase 5 (Moderation):** 3-4 hours
- **Phase 6 (Analytics):** 2-3 hours
- **Phase 7 (Economy):** 3-4 hours
- **Phase 8 (Testing/Docs):** 2-3 hours

**Total Estimated Time:** 25-35 hours

---

## 🎮 Feature Breakdown by Category

### Interactive Games (2 new + 26 unfinished = 28 total)
- Maze Game *(new)*
- Snake Game *(new)*
- Dungeon, Explore, Fish, Flip, Forage, Gamble, Heist, Hunt, Ladder, Limbo, Match, Mine, Mines, Pet, Pickpocket, Quest, Race, Roulette, Search, Slots, Spin, Streak, Tower, Trivia, Vault, Wheel *(unfinished)*

### Community Engagement (5 new)
- Random Viewer Picker
- Achievement System
- Chat Wars / Team Battles
- Counting Game
- Word Chain Game

### Moderation & Analytics (2 new + 7 unfinished utilities = 9 total)
- Advanced Mod Tools *(new)*
- Viewer Stats Dashboard *(new)*
- Commands List, Karaoke, Multi-Twitch, Quotes, Stream Info, Uptime, Watchtime *(unfinished)*

### Raiding & Networking (3 new)
- Enhanced Raid Handler
- Auto-Raid Rotation
- Squad/Team Stats

### Stream Analytics (2 new)
- Goal Tracker System
- Stream Stats Command

### Economy (1 new)
- Stock Market Simulator

---

## 🔄 Development Workflow

1. **Planning Phase** ✅ COMPLETED
   - Created IMPLEMENTATION-PLAN.md
   - Created FUTURE-PLANS.md
   - Identified unfinished features

2. **Infrastructure Phase** ⏳ PENDING
   - Update ConfigSetup.cs
   - Plan database schema

3. **Feature Development** ⏳ PENDING
   - Implement new features (phases 2-7)
   - Complete unfinished features

4. **Testing Phase** ⏳ PENDING
   - Test all features
   - Fix bugs
   - Optimize performance

5. **Documentation Phase** ⏳ PENDING
   - Create README files
   - Update main README
   - Create setup guides

6. **Release Phase** ⏳ PENDING
   - Final testing
   - GitHub release
   - Community announcement

---

## 📝 Notes

### Unfinished Features
The features listed as "not yet finished" have folders/files in the repository but may be:
- Incomplete implementations
- Missing documentation
- Not fully tested
- Missing integration with other systems
- Placeholder code only

**Action Items for Unfinished Features:**
- Review each folder
- Assess completion status
- Determine what needs to be finished
- Prioritize based on community demand
- Complete or document as deprecated

### New Features
All new features have detailed step-by-step plans in `IMPLEMENTATION-PLAN.md`. Each step includes:
- File paths
- Code structure
- Implementation details
- Dependencies
- Testing requirements

---

## 🚀 Getting Started

### To Work on Unfinished Features:
1. Choose a feature from the "Existing Features - Not Yet Finished" list
2. Review the existing code in that folder
3. Identify what's missing or broken
4. Complete the implementation
5. Test thoroughly
6. Create documentation
7. Mark as complete ✅

### To Work on New Features:
1. Open `IMPLEMENTATION-PLAN.md`
2. Start with Phase 1 (Infrastructure)
3. Follow step-by-step instructions
4. Complete each step sequentially within a phase
5. Mark steps as complete in IMPLEMENTATION-PLAN.md
6. Update this file's checkboxes as features finish

---

## 🎯 Next Actions

**Immediate Next Steps:**
1. Complete Phase 1 (Infrastructure) - Required for all new features
2. Decide priority: New features OR finish existing features first
3. Begin implementation following IMPLEMENTATION-PLAN.md
4. Update checklists in both files as progress is made

**Ask yourself:**
- Which features will provide the most value to the community?
- Which features are easiest to complete quickly (quick wins)?
- Which features depend on others (prioritize dependencies first)?

---

## 💬 Questions & Feedback

If you have questions about any planned feature or want to suggest modifications:
- Open a GitHub Issue
- Join the Discord community
- Comment directly in this file

---

**Ready to build something amazing!** 🎉

Choose a feature and let's get started!
