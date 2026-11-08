# BoilerMafia spec

Online Werewolf with a scripted narrator. The Host screen is narrator-only and is never a player.

## Roles

| Role     | Team       | Night action                                                  |
| -------- | ---------- | ------------------------------------------------------------- |
| Werewolf | Werewolves | Vote with the pack on a villager to kill. Sees packmates.     |
| Doctor   | Village    | Protect one alive player (self allowed). Locked once chosen.  |
| Seer     | Village    | Learn whether one other alive player is a werewolf. Locked.   |
| Villager | Village    | None.                                                         |

Role counts come from settings. Everyone not assigned a special role is a Villager. Roles are shuffled with the server's RNG.

## Settings

| Setting        | Default | Range                        |
| -------------- | ------- | ---------------------------- |
| minPlayers     | 5       | 3 to maxPlayers              |
| maxPlayers     | 12      | minPlayers to 20             |
| werewolves     | 2       | 1 to 6                       |
| doctors        | 1       | 0 to 3                       |
| seers          | 1       | 0 to 3                       |
| revealSeconds  | 15      | 5 to 60                      |
| nightSeconds   | 45      | 15 to 180                    |
| daySeconds     | 120     | 30 to 600                    |

Start is refused unless: player count is within [minPlayers, maxPlayers]; werewolves + doctors + seers <= players; and werewolves are strictly fewer than half the players (otherwise wolves win instantly).

## Phases

```
reveal ──► night ──► dawn ──► day ──► verdict ──► night (round + 1)
                       │                  │
                       └──► over ◄────────┘   (when a team has won)
```

- **reveal**: each phone shows its role. Ends when every player sends `ready`, the timer expires, or the host advances.
- **night**: narrator script on host. Wolves, Doctor, Seer act on phones. Ends as soon as every alive action-role player has acted, the timer expires, or the host advances.
  - Kill target: plurality of wolf votes. A tie is broken randomly. No wolf votes means no kill.
  - If the Doctor protected the target, nobody dies.
  - Seer gets their result immediately and privately.
- **dawn**: narrator announces who died (and their role), or that nobody died. Saves are not announced. Lasts `DAWN_SECONDS` (12) or until the host advances.
- **day**: alive players discuss and vote on their phones for an alive player or `skip`. Votes can change. Ends when every alive player has voted, the timer expires, or the host advances.
  - Unique highest vote count on a player eliminates them. A tie for the top, or `skip` on top, eliminates nobody.
- **verdict**: narrator announces the result. Lasts `VERDICT_SECONDS` (12) or until the host advances.
- **over**: winner shown, all roles revealed.

Win check runs after each death. Village wins when no werewolves are alive. Werewolves win when alive werewolves >= alive non-werewolves. The game shows the death's narration (dawn/verdict) before moving to `over`.

A dead player's role is revealed publicly when they die.

## Intents

| Intent                          | Who                     | When                         |
| ------------------------------- | ----------------------- | ---------------------------- |
| `{ type: "ready" }`             | any player              | reveal                       |
| `{ type: "nightAction", target }` | alive Werewolf/Doctor/Seer | night                   |
| `{ type: "vote", target }`      | alive player; target is an alive player or `"skip"` | day |
| `{ type: "advance" }`           | host only               | any phase except over        |

Illegal intents throw: dead players acting, wrong phase, Villager night action, Werewolf targeting a Werewolf, Seer targeting self, Doctor/Seer changing a locked choice, voting for a dead player, non-host `advance`.

## State

Public (every device): phase, round, player order, alive list, deadline, ready list, role counts, last night result, current votes, last verdict, revealed roles, winner.

Private (that phone only): role, packmates (wolves), this night's target, pack votes (wolves see each other's picks), seer results.

## Edge cases

- **Disconnects**: timers keep the game moving. A player who never acts simply doesn't act.
- **Refresh**: state is in the database; the phone resubscribes and renders the same screen.
- **All of a role dead**: they're no longer awaited at night.
- **No votes cast**: nobody eliminated.
- **Tie at night**: random among tied targets.
- **Late intents**: an intent arriving after the phase moved on is rejected with a friendly message.
- **Minimum**: 3 players (1 wolf, 2 others) is the smallest legal game.
