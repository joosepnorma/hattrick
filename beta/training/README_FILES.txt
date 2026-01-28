Overview of Files in Training Planner
======================================

This folder contains tools and libraries for the Hattrick Training Planner and Match Simulator.

Core Libraries:
---------------
1. training_data.js
   - Training speed formulas and skill contribution matrices.
   - Defines how each skill contributes to sector ratings for each position.
   - Contains the training optimization logic (optimizeTraining, optimizeAllPositions).

2. lineup_engine.js
   - Calculates sector ratings (Def/Mid/Att) from player lineups.
   - Implements Hattrick rating formulas with coefficients for:
     - Overcrowding, Team Spirit, Confidence, Stamina Share
     - Tactic modifiers (AOW, AIM, CA, PC, LS)
     - Coach type (Neutral, Offensive, Defensive)

3. simulator_lib.js
   - Match simulation engine with event generation.
   - Contains data tables for stamina, pressing, and tactics.
   - Handles Special Events, chance generation, and goal probabilities.

4. team_generator.js
   - Generates optimized teams based on sector weights.
   - Bridges training_data.js (optimization) and lineup_engine.js (ratings).
   - Configures virtual players trained for 192 weeks from age 17.

5. meta_simulator.js
   - High-level simulation controller for batch/tournament simulations.
   - Uses team_generator.js and simulator_lib.js to run many matches.

6. input_parser.js
   - Shared parsing logic for simulator input strings.
   - Parses weight configurations, training options, tactics, and coach type.

User Interface Files:
---------------------
1. training_planner.html
   - Primary UI for the Training Planner.
   - Input: Sector weights, player age/skills, training preferences.
   - Output: Best positions, training distribution, skill gains.

2. lineup_test.html
   - UI for testing lineup_engine.js calculations.
   - Allows manual input of player skills and displays sector ratings.

3. mass_sim.html
   - Batch simulator UI for testing training weight combinations.
   - Input Format: (d;d;d;m;a;a;a;...;Tactic;TacLvl;Coach)
   - Runs tournament simulations and ranks configurations.

4. meta_sim_test.html
   - Similar to mass_sim.html but with 4 configurable team slots.
   - Best for A/B testing specific configurations.

Data/Documentation Files:
-------------------------
- contributions.txt: Raw position contribution data.
- guidelines.txt: Simulator guidelines and Hattrick mechanics notes.

Utility:
--------
- start_server.py: Simple HTTP server for local development (python -m http.server).
