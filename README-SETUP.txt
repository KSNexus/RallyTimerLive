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
