# Signal Faker

Three to twelve players and a narrator-only host play three to five rounds (default three). Players act in the same physical room; phones show private instructions and the host screen runs the countdown. Highest score wins, with ties shared.

## Flow

Each round the server randomly selects one hidden Faker from players who have been Faker the fewest times, so roles rotate fairly. Everyone else receives the same real instruction; the Faker is told their role and receives a related hint without the exact instruction. The category rotates without repeats through hand signals, finger counts, pointing, facial expressions and written answers. Physical prompts have 25 seconds to read, with a shared final three-second countdown and a separate five-second action pause. For written answers, players have 45 seconds to submit or revise a short answer, then everyone sees the answers for 12 seconds. The server then starts a 35-second discussion, followed by a 30-second secret vote. Players may change their vote until they lock it. If everyone locks, voting ends early; players who disconnect or don't vote do not block the timer.

The host screen reveals the real and Faker instructions, votes, the most-voted suspect and the Faker. A unique vote leader is accused; a tie or no votes means no accusation. If the Faker is accused, each human earns 100 points; otherwise the Faker earns 150. The 25-second result advances to the next round, or to the final standings and role reveal after the last round. Host can advance phases; server time and injected randomness determine outcomes.

Phones cannot see other players' prompts or votes until results. A player may not vote for themselves. If the countdown screen is disconnected, the phone shows a neutral reconnect state; physical actions remain players' responsibility. Players and host should sit together so the action can be observed.

## Verification

Test role and prompt privacy, valid roles and prompt category, voting and lock rules, ties, no votes, both score outcomes, expiry and early completion, and repeated rounds. Check a host and several phones against Supabase before calling multiplayer verified.
