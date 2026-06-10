Kingshot Rally Timer - New Countdown Build V1

Admin PIN: NEX26

Collections used:
- players
- rallyProfiles
- activeRallies
- sentRallies

Core logic:
1. Admin presses GO from a rally profile.
2. An active rally starts with a visible 05:00 countdown.
3. Admin adjusts that timer to match the in-game rally timer.
4. Admin presses Send.
5. Enemy Hit Time = Current Visible Rally Timer + Enemy March Time.
6. Player Hit Time = Player March Time + 00:01.
7. Player Send Countdown = Enemy Hit Time - Player Hit Time.

Firebase:
- Replace firebase-config.js with your new Firebase web app config.
- Use FIRESTORE-RULES.txt for quick open testing rules.
- These rules are open for testing only. Lock them down before public use.


HOTFIX V1.2:
- Rebuilt Send to Players logic as live shared rally data.
- Admin Send stores Enemy Hit End Time, not player-specific fixed countdowns.
- Player page calculates SEND countdown live every second:
  Enemy Hit Countdown - (Player March Time + 00:01)
- New players now see already-sent active rallies after login.
- Changing March Time immediately recalculates the player countdown.
- Rally profile colour is assigned once when the profile is created.
- Multiple active rallies from the same profile keep the same colour.
