# Tech Stack

Hosting: Vercel + hostinger domain (rithvik.si/larpparty)
Web Framework: Next.js
Database: Supabase

Any other things that may be needed can be suggest. Open to additions.

# General Functionality

The flow (at the beginning. Simple MVP):

- User opens website (rithvik.si/larpparty). No login.
- They see multiple cards of all the available games to play
- They click a game, the game opens and they start playing. (rithvik.si/larpparty/<game-name>)

The design should be minimal, intuitive, and good-looking. Lean toward Apple design.

# Final Vision

2 classes of games - fun games and tournament games.

The game described below like Werewolf at Night would fit under the fun games to select from directly on the website.
The other option would be to select the tournament. This would have a set of less complicated games, from which a subset would be randomly chosen to have the players play. An example of a game that would fit this style would be Krillion.

# Dev Phases

- First, we want to build out an MVP. The MVP is just a list of clickable mini games that users can play in their browser. One game on this list is enough for this first dev phase. This phase is done when there is a url that users can visit, and there is a card for a mini game (werewolf game) and they can click the game to start playing.

- Second, we want to move it into the final vision which is where the entire website itself becomes a game instead of just a list of games. Refer to the final vision section for more context on that.

# Desired Architecture

- 3 people working on this with their own coding agents.
- Keep general architecture modular to work on it in a team of 3.
- Maintain high separation of concern to maximize developoment velocity within the team.

# Games

Describing the Fun Games that are in the website-

1. BoilerMafia - Online version of Werewolf at night with narrator that makes the game flow. Creates a server that hosts the game and lets every individual scan a qr code with their phones to play along.

2. Monster Seeking Match (Flirting & Dating Social Deduction)Vibe: Monster Seeking Monster style secret dating, texting, and emotional betrayal.The Hook: Everyone is assigned a hidden monster identity with unique win conditions and secret night powers, competing over 4-5 simulated "in-game days."Step-by-Step Scenario & Flow:Role Reveal: Players receive private monster cards on their phones (e.g., Vampire, Werewolf, Ghost, Serial Flirt).Texting Phase Scenario: A 90-second timer begins. Players use their phone chat interface to send private DMs to other players.Scenario A (Standard Player): Can send up to 3 messages to test trust or coordinate dates.Scenario B (Serial Flirt): Can send up to 6 messages to maximize social reach.Date Night Phase Scenario: Every player's phone displays a selection wheel of all alive players. They must tap one player to "ask out on a date."Resolution & Scoring Scenarios:Mutual Match Scenario: Player A chooses Player B AND Player B chooses Player A $\rightarrow$ Both earn base points (+100 pts).Vampire Power Scenario: If a Vampire successfully matches, their secret ability triggers, stealing 50% of their date's total points earned that round.Werewolf Power Scenario: Points are multiplied by $3\times$ on odd-numbered rounds, but drop to $0$ points on even-numbered rounds regardless of matching.Ghost Power Scenario (Rejection Rule): The Ghost intentionally tries to get rejected. If they choose a player who does not choose them back, the Ghost earns a massive +100 bonus points.Leaderboard Update: The main screen displays a dynamic score ticker tracking standings across all rounds.

3. Signal Faker
   Vibe: Inspired by Jackbox Fakin' It. The Hook: A physical gesture and prompt game where everyone knows the real instruction except one hidden impostor who must desperately blend in. Step-by-Step Scenario & Flow: Secret Prompt Distribution: The server assigns roles. All humans receive an identical physical prompt, while the Impostor receives a generic safe prompt. Category Scenarios: Scenario A (Hand Gesture): Prompt: "Raise your hand if you have ever failed a driving test." (Impostor sees: "Raise your hand when the timer hits zero"). Scenario B (Number Count): Prompt: "Hold up fingers for how many siblings you have." (Impostor sees: "Hold up 1, 2, or 3 fingers"). Scenario C (Point Out): Prompt: "Point directly at the person who takes the longest to reply to texts." (Impostor sees: "Point at the person sitting to your immediate left"). Countdown & Physical Action Scenario: The main screen triggers a loud 3-2-1 audio countdown. All players must physically execute their action in real life simultaneously. Edge Case & Disconnection: If a player's phone loses connection during the countdown, their avatar on the main screen defaults to a neutral resting pose so they don't accidentally spoil the impostor. Interrogation & Voting Scenario: A 30-second timer starts immediately after the action. Players debate who hesitated or looked confused. Phones display a grid of all players; everyone taps their suspected impostor. The player with the most votes is unmasked.

4. Push the Button
   Vibe: Fast-paced emergency testing under severe time pressure. The Hook: Players complete rapid drawing or rating prompts where humans receive standard prompts and aliens receive subtly nudged variations designed to create anomalies. Step-by-Step Scenario & Flow: Asymmetrical Prompt Assignment: The server designates one player as the hidden Alien. Scenario Example: Humans get: "Rate how delicious raw broccoli is on a scale of 1 to 10." Alien gets: "Rate how delicious chocolate fudge cake is on a scale of 1 to 10." Submission Phase: Players use their phone touchscreens to input their ratings or quick doodles before a 20-second progress bar runs out. Display Matrix Scenario: The main screen displays all responses side-by-side in a public data grid (e.g., Player 1: 2/10, Player 2: 3/10, Player 3: 9/10). Emergency Deliberation & Button Push Scenario: Players analyze the grid. If someone notices a glaring outlier (like the 9/10 rating), any player can physically slam the large on-screen "Push the Button" trigger. Resolution Scenario: The game pauses, and the group locks in a final accusation against the suspected alien. If correct, humans win points; if wrong, the alien steals the match.

5. Shy Guy SaysVibe: Rapid reaction-elimination inspired by Mario Party.The Hook: A strict 1200ms timing challenge testing quick reflexes against host flag fakes.Step-by-Step Scenario & Flow:The Signal Scenario: The main screen displays an animated host character holding up two flags.The Fake-Out Scenario: The host raises a RED flag halfway up, pauses, pulls it back down instantly (testing who taps early), and then fully raises a WHITE flag.Player Interaction: Every player's phone displays two massive color buttons (RED and WHITE).Timing & Elimination Engine:The server logs the exact server timestamp when the correct flag is locked ($T_{signal}$).When a player taps, the phone transmits $T_{tap}$ and the button*pressed.Elimination Rule: If $(T*{tap} - T\_{signal} > 1200\text{ms})$ OR $(\text{button\_pressed} \neq \text{correct\_flag})$, the player is instantly eliminated for that round (is_alive = false), and their avatar on the main screen slumps over. The game repeats rapid-fire rounds until only one surviving champion remains.

# Personal Goals for the team

To learn how to make a website with agentic tools and while following software engineering principles. Also, to stay deeply familiar with the codebase without getting bogged down in specific technical details. Ask us to write high-level and important pieces of code that are integral to building a strong technical understanding of the codebase. Examples: Simple database migrations so that we are forced to think about the specific fields and data base layout for the project. Make sure to provide resources and help so that we can quickly get onboarded with quickly syntax and any other details needed to be known.
