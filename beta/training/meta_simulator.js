/**
 * MetaSimulator
 * Orchestrates the Phase 3 Tournament.
 */
(function (scope) {
    // Weight Profiles (Default / Phase 3 scenarios)
    const DEFAULT_PROFILES = [
        {
            name: 'Equal (50/50/50)',
            weights: {
                defLeft: 50, defCenter: 50, defRight: 50,
                mid: 50,
                attLeft: 50, attCenter: 50, attRight: 50
            }
        },
        {
            name: 'Defense Heavy (70/40/40)',
            weights: {
                defLeft: 70, defCenter: 70, defRight: 70,
                mid: 40,
                attLeft: 40, attCenter: 40, attRight: 40
            }
        },
        {
            name: 'Midfield Heavy (40/70/40)',
            weights: {
                defLeft: 40, defCenter: 40, defRight: 40,
                mid: 70,
                attLeft: 40, attCenter: 40, attRight: 40
            }
        },
        {
            name: 'Attack Heavy (40/40/70)',
            weights: {
                defLeft: 40, defCenter: 40, defRight: 40,
                mid: 40,
                attLeft: 70, attCenter: 70, attRight: 70
            }
        }
    ];

    class MetaSimulator {
        /**
         * Run a round-robin tournament
         * Usage:
         *   runTournament(callback) -> Default profiles, Default options
         *   runTournament(options, callback) -> Default profiles, Custom options
         *   runTournament(profiles, matches/options, callback) -> Custom profiles
         */
        static async runTournament(arg1, arg2, arg3) {
            let profiles = DEFAULT_PROFILES;
            let options = { matchesPerPair: 10000, teamSpiritLevel: 4.5, confidenceLevel: 4 };
            let progressCallback = null;

            // Scenario 1: runTournament(callback)
            if (typeof arg1 === 'function') {
                progressCallback = arg1;
            }
            // Scenario 2: runTournament(options, callback)
            else if (typeof arg1 === 'object' && !Array.isArray(arg1) && arg1 !== null) {
                options = { ...options, ...arg1 };
                if (typeof arg2 === 'function') progressCallback = arg2;
            }
            // Scenario 3: runTournament(profiles, matches/options, callback)
            else if (Array.isArray(arg1)) {
                profiles = arg1;
                if (typeof arg2 === 'number') {
                    options.matchesPerPair = arg2;
                } else if (typeof arg2 === 'object' && arg2 !== null) {
                    options = { ...options, ...arg2 };
                }
                if (typeof arg3 === 'function') progressCallback = arg3;
                if (typeof arg2 === 'function') progressCallback = arg2;
            }

            if (!scope.TeamGenerator || !scope.Simulator) {
                console.error("Missing dependencies");
                return null;
            }

            // 1. Generate Teams
            if (progressCallback) progressCallback("Generating teams...");
            const teams = [];

            // Performance: Cache teams by profile hash to avoid regenerating identical configs
            const teamCache = new Map();
            const hashProfile = (p, opts) => JSON.stringify([
                p.weights, opts, p.tactic || 'Normal',
                p.tacticLevel ?? 20, p.coachType || 'Neutral',
                p.formation || options.formation || '352',
                options.trainingWeeks || 192,
                options.teamSpiritLevel, options.confidenceLevel
            ]);

            for (const profile of profiles) {
                // Pass TS Level and Confidence Level to TeamGenerator
                // Determine training options for this team
                // Priority: profile-specific options > global options
                const trainingOpts = {
                    ...(profile.trainingOpts || {
                        trainSpForGk: options.trainSpForGk,
                        targetSpLevel: options.targetSpLevel,
                        trainPassForDef: options.trainPassForDef,
                        targetPassLevel: options.targetPassLevel,
                        trainSpForOutfield: options.trainSpForOutfield,
                        targetSpOutfieldLevel: options.targetSpOutfieldLevel,
                        trainScoreForDef: options.trainScoreForDef,
                        targetScoreDefLevel: options.targetScoreDefLevel,
                        trainScoreForMid: options.trainScoreForMid,
                        targetScoreMidLevel: options.targetScoreMidLevel
                    }),
                    allowTDF: options.allowTDF, // Always apply global TDF setting (or merge if per-profile optimization supported later)
                    forcePNF: profile.forcePNF // PNF from Profile parsing
                };

                // Check cache first
                const cacheKey = hashProfile(profile, trainingOpts);
                let simTeam = teamCache.get(cacheKey);
                let rawTeam;

                if (!simTeam) {
                    // Cache miss - generate new team
                    rawTeam = scope.TeamGenerator.createTeam(
                        profile.weights,
                        profile.name,
                        options.teamSpiritLevel,
                        options.confidenceLevel,
                        trainingOpts,
                        profile.tactic || 'Normal',
                        profile.tacticLevel !== undefined ? profile.tacticLevel : 20,
                        profile.coachType || 'Neutral',
                        profile.formation || options.formation || '352',
                        options.trainingWeeks || 192
                    );
                    simTeam = scope.Simulator.precomputeRatings(rawTeam);
                    teamCache.set(cacheKey, { raw: rawTeam, sim: simTeam });
                } else {
                    // Cache hit - reuse team (but update name for display)
                    rawTeam = { ...simTeam.raw, name: profile.name };
                    simTeam = { ...simTeam.sim, name: profile.name };
                }

                teams.push({
                    id: teams.length,
                    profile: profile,
                    raw: rawTeam,
                    sim: simTeam,
                    stats: { g: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 }
                });
            }

            // 2. Run Round Robin
            const matchesPerPair = options.matchesPerPair || 10000;
            const pairs = [];
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    pairs.push([i, j]);
                }
            }

            // Track Head-to-Head
            const headToHead = {};
            for (const [idxA, idxB] of pairs) {
                const idA = teams[idxA].id;
                const idB = teams[idxB].id;
                headToHead[`${idA}-${idB}`] = {
                    teamA: teams[idxA],
                    teamB: teams[idxB],
                    w: 0, d: 0, l: 0
                };
            }

            let matchesPlayed = 0;

            for (const [idxA, idxB] of pairs) {
                const teamA = teams[idxA];
                const teamB = teams[idxB];
                const h2h = headToHead[`${teamA.id}-${teamB.id}`];

                if (progressCallback) progressCallback(`Simulating ${teamA.profile.name} vs ${teamB.profile.name}...`);

                const batchSize = Math.max(10, Math.min(1000, Math.floor(matchesPerPair / 10)));

                // Deterministic Home/Away logic
                // Phase 1 (First half of matches): Team A is Home
                // Phase 2 (Second half of matches): Team B is Home
                const halfMatches = Math.floor(matchesPerPair / 2);

                for (let m = 0; m < matchesPerPair; m += batchSize) {
                    const count = Math.min(batchSize, matchesPerPair - m);

                    for (let k = 0; k < count; k++) {
                        const matchIndex = m + k;
                        let home, away;
                        let simHomeStats, simAwayStats;

                        // Determine Home Team based on match index (Deterministic)
                        // If odd number of matches, extra match goes to Team A (arbitrary choice, or we could alternate)
                        const isHomeA = matchIndex < halfMatches;

                        if (options.enableHomeAwayMode) {
                            home = isHomeA ? teamA : teamB;
                            away = isHomeA ? teamB : teamA;

                            // Create lightweight Home version with boosted Midfield
                            // Standard Hattrick Home Advantage is ~1.19-1.20x to midfield
                            const HOME_MULTIPLIER = 1.20;

                            // Clone sim object to avoid mutating the cached version
                            // We only need to boost midfield and recalculate its power
                            simHomeStats = { ...home.sim };
                            simHomeStats.midfield = home.sim.midfield * HOME_MULTIPLIER;
                            simHomeStats.base_midfield = home.sim.base_midfield * HOME_MULTIPLIER;
                            simHomeStats.midfield_pow3 = Math.pow(simHomeStats.midfield, 3);

                            // Away team uses standard Neutral/Away ratings
                            simAwayStats = away.sim;

                        } else {
                            // Neutral Mode (Original)
                            // We still assign a "Home" team for kits/stats, but NO rating boost.
                            // We can use the same deterministic split for consistency, or keep random.
                            // Let's use deterministic for consistency.
                            home = isHomeA ? teamA : teamB;
                            away = isHomeA ? teamB : teamA;
                            simHomeStats = home.sim;
                            simAwayStats = away.sim;
                        }

                        const result = scope.Simulator.simulateMatch(simHomeStats, simAwayStats, 'league');

                        const scoreHome = result.normal_time_score[0];
                        const scoreAway = result.normal_time_score[1];

                        // Update stats
                        home.stats.g++; away.stats.g++;
                        home.stats.gf += scoreHome; home.stats.ga += scoreAway;
                        away.stats.gf += scoreAway; away.stats.ga += scoreHome;

                        let winner = null;
                        if (scoreHome > scoreAway) {
                            winner = home;
                            home.stats.w++; away.stats.l++; home.stats.pts += 3;
                        } else if (scoreHome < scoreAway) {
                            winner = away;
                            away.stats.w++; home.stats.l++; away.stats.pts += 3;
                        } else {
                            home.stats.d++; away.stats.d++; home.stats.pts += 1; away.stats.pts += 1;
                        }

                        // Update H2H
                        if (winner === h2h.teamA) h2h.w++;
                        else if (winner === h2h.teamB) h2h.l++;
                        else h2h.d++;
                    }

                    matchesPlayed += count;
                }
            }

            // 3. Finish
            if (progressCallback) progressCallback("Tournament Complete!");

            // Sort by points
            teams.sort((a, b) => b.stats.pts - a.stats.pts);

            return { teams, headToHead };
        }
    }

    scope.MetaSimulator = MetaSimulator;

})(window);
