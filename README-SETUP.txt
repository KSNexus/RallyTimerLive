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

V2.2 HOTFIX:
- Removed the blocking "Rally sent to players" popup.
- Admin active rally +/- buttons now support hold-to-adjust.
- Single tap still adjusts by 1 second.
- Holding starts auto-repeat after 0.5 seconds and repeats every 0.1 seconds.
- Hold-to-adjust applies only to admin active rally timer controls.
- Player March timer no longer uses traffic light colours.
- Player March timer is visible immediately using the player's march time.
- Player March timer starts counting down only after SEND reaches 00:00.

V2.3 HOTFIX:
- Admin rally +/- adjustment now changes by 0.5 seconds per click/hold tick.
- Added a visual-only UTC clock to the Admin login panel.
- UTC offset adjusts in 0.5 second intervals and supports hold-to-adjust.
- Added Set UTC button.
- Admin cannot unlock until UTC has been set.
- After admin unlock, adjusted live UTC clock appears above Active Rally Instances.
- UTC stores only a visual offset and remains a live clock.
- UTC does not affect rally/player calculations, phases, or auto-delete timing.
- Admin login now persists after closing/reopening browser using localStorage.

V2.4 HOTFIX:
- Admin active rallies now show Enemy Rally Hit UTC timestamp.
- Player active rallies now show Rally Send Time UTC timestamp.
- Both UTC timestamps use the visual UTC offset and are display-only.
- Player March Time Adjust panel replaced with Send Offset panel.
- Player login march time remains stored and remains used in calculations.
- Send Offset adjusts active rally SEND countdowns only.
- Send Offset changes in 0.5 second steps.
- Positive Send Offset delays the send countdown; negative Send Offset makes it earlier.

V2.5 HOTFIX:
- Admin Enemy Rally Hit timestamp is now calculated/stored when Send is clicked.
- Admin Enemy Rally Hit timestamp no longer live-updates while adjusting rally time.
- Admin Enemy Rally Hit line moved below the rally control buttons.
- Player Rally Send Time is cached locally and does not live-update every second.
- Player Rally Send Time refreshes when the player presses Set on Send Offset.
