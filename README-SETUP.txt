Kingshot Rally Timer - V2 Live Logic

Admin PIN: NEX26

Clarified game logic:
- Enemy rally shows a visible 5:00 countdown.
- After that visible rally timer ends, the enemy march begins.
- Enemy march time is hidden in-game and stored in the rally profile.
- Player solo marches are instant; they only use the player's march time.

Admin flow:
1. Create rally profile with enemy march time.
2. Press GO from a profile.
3. App creates active rally with a visible 05:00 countdown.
4. Adjust that countdown to match the in-game rally timer.
5. Press Send.

Stored sent rally data:
- rallyEndMs = when the visible 5:00 rally timer ends
- enemyMarchSeconds = measured hidden enemy march time
- enemyHitEndMs = rallyEndMs + enemyMarchSeconds

Player live equation:
Player SEND countdown =
enemyHitEndMs - current time - (player march time + 1 second)

This means:
- New players logging in after Send can still see active sent rallies.
- Changing player march time recalculates the countdown live.
- Rally colours are stored on the profile, so the same profile keeps the same colour.

V2.1 PHASE HOTFIX:
- Admin active rally timer no longer uses traffic light colours; it stays on the profile colour.
- Removed descriptive text under the active rally name.
- Admin active rallies now show Rally and March timers.
- Enemy March timer begins when visible rally timer reaches 00:00.
- Rally +/- adjustment buttons disable once march phase begins.
- Admin active rally auto-deletes after enemy march timer reaches 00:00.
- Player rallies now show Send and March timers.
- Player March timer begins when Send reaches 00:00.
- Player rally rows auto-hide 2 seconds after the player's march timer reaches 00:00.
