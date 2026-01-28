/**
 * TeamGenerator
 * Generates optimized teams based on training weights.
 * Bridges TrainingData (optimization) and LineupEngine (ratings).
 */
(function (scope) {
    // Configuration
    const CONFIG = {
        TRAINING_WEEKS: 192,
        STARTING_AGE: 17.0,
        STARTING_SKILL: 5, // Inadequate
        COACH_SKILL: 8, // Excellent (previously 5 which was Inadequate)
        DEFAULT_FORMATION: '352'
    };

    // Formation templates: [position, side]
    // Rules: X-Y-Z structure
    // X (Defense): WB Left + WB Right first, then CDs (Center if odd, then Left+Right)
    // Y (Midfield): W Left + W Right first, then IMs (Center if odd, then Left+Right)
    // Z (Attack): FW Left, then FW Right, then FW Middle (lone forwards use Left)
    const FORMATIONS = {
        // X=2: WB Left + WB Right
        '253': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Middle'], ['IM', 'Right'], ['W', 'Right'],
            ['FW', 'Left'], ['FW', 'Right'], ['FW', 'Middle']
        ],
        // X=3: WB Left + WB Right + CD Middle
        '352': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Middle'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Middle'], ['IM', 'Right'], ['W', 'Right'],
            ['FW', 'Left'], ['FW', 'Right']
        ],
        '343': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Middle'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Right'], ['W', 'Right'],
            ['FW', 'Left'], ['FW', 'Right'], ['FW', 'Middle']
        ],
        // X=4: WB Left + WB Right + CD Left + CD Right
        '442': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Left'], ['CD', 'Right'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Right'], ['W', 'Right'],
            ['FW', 'Left'], ['FW', 'Right']
        ],
        '433': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Left'], ['CD', 'Right'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Middle'], ['W', 'Right'],
            ['FW', 'Left'], ['FW', 'Right'], ['FW', 'Middle']
        ],
        '451': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Left'], ['CD', 'Right'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Middle'], ['IM', 'Right'], ['W', 'Right'],
            ['FW', 'Left']
        ],
        // X=5: WB Left + WB Right + CD Left + CD Middle + CD Right
        '550': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Left'], ['CD', 'Middle'], ['CD', 'Right'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Middle'], ['IM', 'Right'], ['W', 'Right']
        ],
        '532': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Left'], ['CD', 'Middle'], ['CD', 'Right'], ['WB', 'Right'],
            ['IM', 'Left'], ['IM', 'Middle'], ['IM', 'Right'],
            ['FW', 'Left'], ['FW', 'Right']
        ],
        '541': [
            ['GK', 'Middle'],
            ['WB', 'Left'], ['CD', 'Left'], ['CD', 'Middle'], ['CD', 'Right'], ['WB', 'Right'],
            ['W', 'Left'], ['IM', 'Left'], ['IM', 'Right'], ['W', 'Right'],
            ['FW', 'Left']
        ]
    };

    class TeamGenerator {
        /**
         * Create a team optimized for the given weights
         * @param {Object} weights - Sector weights (e.g. { defLeft: 50, ... })
         * @param {string} teamName - Name for the team
         * @param {number} teamSpiritLevel - Team Spirit Level (0.5 - 10.5), default 4.5
         * @param {number} confidenceLevel - Confidence Level (0-9), default 4 (Decent)
         * @param {Object} trainingOptions - Training options
         * @param {string} tactic - Tactic (Normal, AOW, AIM, CA, PC, LS)
         * @param {number} tacticLevel - Tactic Skill Level (0-20), default 20
         * @param {string} coachType - Coach Type (Neutral, Defensive, Offensive), default Neutral
         * @param {string} formation - Formation code (352, 442, etc.), default 352
         * @param {number} trainingWeeks - Number of training weeks (default 192)
         * @returns {Object} Team data compatible with Simulator
         */
        static createTeam(weights, teamName = 'Optimized Team', teamSpiritLevel = 4.5, confidenceLevel = 4, trainingOptions = {}, tactic = 'Normal', tacticLevel = 20, coachType = 'Neutral', formation = '352', trainingWeeks = 192) {
            if (!scope.TrainingData) {
                throw new Error("Missing dependency: TrainingData (training_data.js failed to load)");
            }
            if (!scope.LineupEngine) {
                throw new Error("Missing dependency: LineupEngine (lineup_engine.js failed to load)");
            }


            // 1. Optimize players for each position
            const optimizedPlayers = {};
            const positionsToTrain = ['GK', 'WB', 'CD', 'IM', 'W', 'FW'];

            // Normalize weights object to vector for Optimizer
            const weightVector = scope.TrainingData.calculateWeights(weights);

            positionsToTrain.forEach(pos => {
                const startingSkills = TeamGenerator.createStartingSkills(pos);
                // Merge static config with dynamic training options
                const params = {
                    coachLevel: CONFIG.COACH_SKILL,
                    ...trainingOptions
                };

                const optimizationResult = scope.TrainingData.optimizeTraining(
                    pos,
                    startingSkills,
                    CONFIG.STARTING_AGE,
                    trainingWeeks,
                    weightVector,
                    params
                );

                optimizedPlayers[pos] = optimizationResult.finalSkills;
            });

            // 2. Construct lineup based on formation with optimal variants
            const template = FORMATIONS[formation] || FORMATIONS[CONFIG.DEFAULT_FORMATION];
            const selectedVariants = {};  // Track which variants were selected

            // SPECIAL EVENTS CONFIGURATION
            // Specialties: 0=None, 1=Technical, 2=Powerful, 3=Quick, 4=Unpredictable, 5=Head
            const SPECS = { NONE: 0, TECHNICAL: 1, POWERFUL: 2, QUICK: 3, UNPREDICTABLE: 4, HEAD: 5 };

            // Hardcoded SE mapping
            // GK: None
            // CD, WB: Unpredictable
            // IM, W, FW: Quick (Default)
            // PNF: Powerful (Overridden if forced)

            let pnfAssigned = false; // Track if we assigned the PNF slot

            const lineup = template.map(([posCode, side]) => {
                const skills = optimizedPlayers[posCode];
                let variant;
                let specialty = SPECS.NONE;

                // Determine Specialty based on Base Position
                if (posCode === 'GK') {
                    specialty = SPECS.NONE;
                } else if (posCode === 'CD' || posCode === 'WB') {
                    specialty = SPECS.UNPREDICTABLE;
                } else if (posCode === 'IM' || posCode === 'W' || posCode === 'FW') {
                    specialty = SPECS.QUICK;
                }

                // PNF Logic (Force Powerful Normal Forward)
                // If PNF enabled, valid FW slot, and not yet assigned
                if (trainingOptions.forcePNF && posCode === 'FW' && !pnfAssigned) {
                    // Force Variant: Normal FW (no TW or Defensive)
                    // Note: findOptimalVariant might return FW_TW or FW_D based on weights.
                    // We must override this specific player to be a plain FW (or optimal Plain FW?)
                    // The user said: "can not be a defensive forward or a forward towards wing. They have to be a normal forward"
                    // So we force variant 'FW'. 

                    variant = 'FW';
                    specialty = SPECS.POWERFUL;
                    pnfAssigned = true;

                    // Log override?
                    // console.log("Assigned PNF to FW slot");
                } else {
                    // Normal optimization
                    const opt = scope.TrainingData.findOptimalVariant(posCode, side, skills, weightVector, trainingOptions.allowTDF);
                    variant = opt.variant;
                }

                // Track selected variant
                if (!selectedVariants[posCode]) selectedVariants[posCode] = [];
                selectedVariants[posCode].push(variant);

                return {
                    positionCode: variant,
                    side: side,
                    skills: skills,
                    specialty: specialty // Add specialty to player object
                };
            });

            // Calculate SE Summaries
            // U_def: Unpredictable WBs and CDs
            // Q_off: Quick Wingers, IMs, FWs
            // PNF: Has PNF?

            let count_U_def = 0;
            let count_Q_off = 0;
            let has_PNF = 0;

            lineup.forEach(p => {
                const spec = p.specialty;
                const pos = p.positionCode; // e.g. WB_TM, FW_D

                if (spec === SPECS.UNPREDICTABLE) {
                    // Validate it's a defensive role? (WB/CD)
                    if (pos.startsWith('WB') || pos.startsWith('CD')) {
                        count_U_def++;
                    }
                }
                if (spec === SPECS.QUICK) {
                    // Validate it's an offensive role? (W/IM/FW)
                    if (pos.startsWith('W') || pos.startsWith('IM') || pos.startsWith('FW')) {
                        count_Q_off++;
                    }
                }
                if (spec === SPECS.POWERFUL && pos.startsWith('FW')) {
                    has_PNF = 1;
                }
            });

            // 3. Calculate Ratings
            // Calculate base power (Neutral coach, no home advantage) for input to Simulator
            const ratings = scope.LineupEngine.calculateAllSectorRatings(lineup, {
                coachType: coachType, // Pass Coach Type
                isHome: false,
                confidenceLevel: confidenceLevel, // Pass Confidence Level
                tactic: tactic, // Pass Tactic to apply rating modifiers
                teamSpiritLevel: teamSpiritLevel
            });

            // 3.5 Calculate ISP Ratings
            const ispRatings = scope.LineupEngine.calculateISPRatings(lineup);

            // 4. Map to Simulator Format
            return {
                name: teamName,
                tactic: tactic, // Store tactic in team object for Simulator Events
                // Simulator uses 'midfield', 'r_att' etc.
                midfield: ratings.midfield,
                r_attack: ratings.attack.right,
                c_attack: ratings.attack.center,
                l_attack: ratings.attack.left,
                r_defense: ratings.defense.right,
                c_defense: ratings.defense.center,
                l_defense: ratings.defense.left,

                // ISP Ratings
                isp_att: ispRatings.attack,
                isp_def: ispRatings.defense,

                // Expose player data for analysis
                players: optimizedPlayers,
                selectedVariants: selectedVariants, // Which variants were auto-selected

                // SE Stats
                se_stats: {
                    u_def: count_U_def,
                    q_off: count_Q_off,
                    pnf: has_PNF
                },

                // Other stats
                tactic_level: tacticLevel, // Use user provided level (default 20)
                // Note: Simulator logic uses tactic_level for event generation probabilities.
                // Optimizers usually assume high skill. Let's default to a high level (e.g. 20) or 0 if Normal.
                // But LineupEngine doesn't calculate Tactic Switch Skill yet.
                // For simplified "mass sim", let's assume Tactic Skill 20 (Divine) if tactic != Normal.

                // Use a default stamina. Players trained 192 weeks are young (23), likely have decent stamina?
                stamina: 8.0 // Solid stamina average
            };
        }

        static createStartingSkills(pos) {
            // Basic starting skills (Inadequate=5)
            return {
                Keeper: 5,
                Defending: 5,
                Playmaking: 5,
                Winger: 5,
                Passing: 5,
                Scoring: 5,
                SetPieces: 5
            };
        }
    }

    scope.TeamGenerator = TeamGenerator;

})(window);
