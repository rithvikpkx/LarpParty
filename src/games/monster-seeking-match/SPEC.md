# Monster Seeking Match

A secret-dating party game for 3–12 players, with a narrator-only host. Everyone plays every round; there is no elimination. The highest total score wins, with ties shared.

## Settings and phases

Default to four rounds, with a choice of three to eight. Each round has 90 seconds of texting and 30 seconds to choose a date. A short public results phase follows; the host may advance it, and a deadline advances it automatically. After the final results, reveal the roles and final standings. Server time determines deadlines; late actions are rejected.

Before round one, randomly assign each player a secret role: Vampire, Werewolf, Ghost, or Serial Flirt. Roles may repeat; everyone remains eligible to win on total points. The role reveal remains private until the end.

## Texting and dating

Players may send a message to another player during texting, up to six messages per round, or twelve for a Serial Flirt. Messages are nonempty, limited to 200 characters, and delivered only to sender and recipient during texting. All current-round messages are shown publicly during the results; tell players this before they send anything. The server validates the sender, recipient, phase, deadline and allowance. Reset allowances and conversations each round.

During dating each player chooses one other player, and may change that choice until the phase ends. A missing choice is treated as no date. Choices remain private until resolution. End a phase early only when all players have locked their choices, or let the deadline expire; disconnected players do not block progress. The host may advance a phase.

## Resolution

- A mutual choice gives each participant 100 base points; all other choices give zero base points.
- A Werewolf's base points are tripled on odd rounds and zero on even rounds.
- A Ghost gains 100 bonus points when they chose someone who did not choose them back; no choice is not a rejection.
- A Vampire in a mutual match steals half of their date's points for that round, rounded down. Calculate base and role bonuses first, then calculate all Vampire transfers simultaneously from those pre-transfer scores, so two Vampires exchange equal amounts and order cannot change the result.
- Add round scores to totals. During the public results, show each message and then each player's date choice in lock-in order, including mutual matches, rejections, and missed choices; reveal the leaderboard afterward. Each item gets five seconds and the scoreboard gets twelve seconds; the host can advance early. Roles remain hidden until the final reveal, though scores may allow players to infer them. The lock-in order changes presentation only: a date still requires both people to choose each other.

## Intents and state

Intents are `ready`, `message(recipient, text)`, `chooseDate(player)`, `lockDate`, and host-only `advance`. Reject invalid targets, self-targeting, actions in the wrong phase, messages over the limit, and changes after locking. Use the existing engine context for randomness and server time.

Public state contains the phase, round, deadline, player order, standings, readiness and lock counts, and resolved round results. Each private state contains the role, sent and received conversations, remaining message allowance, date choice, and lock status. Messages and choices become public only after dating resolves; never put an unresolved message or choice in public state or in an unrelated player's private row.

## Edge cases and verification

Test role assignment, private message isolation and limits, invalid and late intents, changing and locking dates, disconnects and no choice, each role's scoring, simultaneous Vampire transfers, ties, timer advancement, and refresh/reconnect. Verify the full host-and-phone flow against a running Supabase instance before calling the game usable.
