/**
 * Homegrown Engine for Hattrick Training Planner
 * Optimizes weekly training choices for a fixed squad of 12 players.
 */

const FORMATION_SLOTS = {
    '253': ['GK', 'WB', 'WB', 'IM_Side', 'IM_Side', 'IM_Mid', 'W', 'W', 'FW', 'FW', 'FW'],
    '343': ['GK', 'WB', 'WB', 'CD', 'IM_Side', 'IM_Side', 'W', 'W', 'FW', 'FW', 'FW'],
    '352': ['GK', 'WB', 'WB', 'CD', 'IM_Side', 'IM_Side', 'IM_Mid', 'W', 'W', 'FW', 'FW'],
    '433': ['GK', 'WB', 'WB', 'CD', 'CD', 'IM_Mid', 'W', 'W', 'FW', 'FW', 'FW'], // 4-3-3: 2 W, 1 IM (Middle)
    '442': ['GK', 'WB', 'WB', 'CD', 'CD', 'IM_Side', 'IM_Side', 'W', 'W', 'FW', 'FW'],
    '451': ['GK', 'WB', 'WB', 'CD', 'CD', 'IM_Side', 'IM_Side', 'IM_Mid', 'W', 'W', 'FW'],
    '532': ['GK', 'WB', 'WB', 'CD', 'CD', 'CD', 'IM_Side', 'IM_Side', 'IM_Mid', 'FW', 'FW'], // 5-3-2 with 3 IMs implies NO Wingers usually? Or 2 Wingers 1 IM? Standard is 3 IMs for midfield.
    '541': ['GK', 'WB', 'WB', 'CD', 'CD', 'CD', 'IM_Side', 'IM_Side', 'W', 'W', 'FW'],
    '550': ['GK', 'WB', 'WB', 'CD', 'CD', 'CD', 'IM_Side', 'IM_Side', 'IM_Mid', 'W', 'W']
    // Note: 5-3-2 usually interpreted as 3 IMs (balanced) or 2 W + 1 IM (CA). 
    // We assume 3 IMs for max midfield rating potential unless specified.
};

class HGEngine {
    constructor(weights, weeks = 208, staminaShare = 10, formation = '352', coachType = 'Neutral') {
        this.weights = weights; // { defLeft, defCenter, defRight, mid, attLeft, attCenter, attRight }
        this.weeks = weeks;
        this.staminaShare = staminaShare;
        this.formation = formation;
        this.coachType = coachType;

        // Validate formation
        if (this.formation !== 'Auto' && !FORMATION_SLOTS[this.formation]) {
            console.warn(`Formation ${formation} not found, defaulting to 352`);
            this.formation = '352';
        }

        // Slot definitions (Generalized: { count, efficiency, skill? })
        this.trainingSlots = {
            'GK': [{ count: 2, efficiency: 1.0 }],
            'Def': [{ count: 10, efficiency: 1.0 }],
            'Def_Ext': [{ count: 12, efficiency: 0.45, skill: 'Defending' }],
            'PM': [{ count: 6, efficiency: 1.0 }, { count: 4, efficiency: 0.5 }],
            'Wing': [{ count: 4, efficiency: 1.0 }, { count: 4, efficiency: 0.5 }],
            'Wing_Ext': [{ count: 10, efficiency: 0.60, skill: 'Winger' }],
            'Pass': [{ count: 16, efficiency: 1.0 }],
            'Score': [{ count: 6, efficiency: 1.0 }],
            'Score_Ext': [
                { count: 12, efficiency: 0.45, skill: 'Scoring' },
                { count: 12, efficiency: 0.13, skill: 'SetPieces' }
            ],
            'SP': [{ count: 22, efficiency: 1.0 }]
        };

        // Initialize players
        this.players = this.initializeSquad();

        // Cache training types keys
        this.trainingTypes = Object.keys(this.trainingSlots);

        // NEW: Valid variants for each Slot Type
        this.positionVariants = {
            'GK': ['GK'],
            'WB': ['WB', 'WB_TM', 'WB_O', 'WB_D'],
            'CD': ['CD', 'CD_O', 'CD_TW'],
            'IM': ['IM', 'IM_O', 'IM_D', 'IM_TW'],
            'W': ['W', 'W_TM', 'W_O', 'W_D'],
            'FW': ['FW', 'FW_D', 'FW_TW', 'FW_TD']
        };

        // Penalties (from LineupEngine)
        this.COEFFICIENTS = {
            OVERCROWDING: {
                CD: { 1: 1.000, 2: 0.964, 3: 0.900 },
                IM: { 1: 1.000, 2: 0.935, 3: 0.825 },
                FW: { 1: 1.000, 2: 0.933, 3: 0.865 }
            },
            COACH: {
                Neutral: { Def: 1.000, Att: 1.000 },
                Offensive: { Def: 0.880, Att: 1.074 },
                Defensive: { Def: 1.128, Att: 0.882 }
            }
        };
    }

    initializeSquad() {
        const players = [];

        // 2x 19yo GKs (Level 14 GK, others 5)
        for (let i = 0; i < 2; i++) {
            players.push({
                id: `GK-${i + 1}`,
                name: `Goalkeeper ${i + 1}`,
                age: 19.0,
                skills: {
                    Keeper: 14, Defending: 5, Playmaking: 5, Winger: 5, Passing: 5, Scoring: 5, SetPieces: 5
                },
                bestPosition: 'GK',
                isGK: true
            });
        }

        // 10x 17yo Field Players (All 5)
        for (let i = 0; i < 10; i++) {
            players.push({
                id: `FP-${i + 1}`,
                name: `Player ${i + 1}`,
                age: 17.0,
                skills: {
                    Keeper: 1, Defending: 5, Playmaking: 5, Winger: 5, Passing: 5, Scoring: 5, SetPieces: 5
                },
                bestPosition: 'IM', // Initial guess
                isGK: false
            });
        }

        return players;
    }

    /**
     * Run the full simulation
     */
    run() {
        const log = [];
        let factorVector = calculateWeights(this.weights); // Renamed to avoid confusion

        // Apply Coach Multipliers to Weights
        // If coach improves defense by 12.8%, then valid points in defense are worth 12.8% more to the final rating?
        // Yes, contribution * skill * coach = rating. 
        // Our optimization target is Sum(rating * userWeight).
        // So effectively we can multiply the userWeight by the coach multiplier.

        const coachMult = this.COEFFICIENTS.COACH[this.coachType] || this.COEFFICIENTS.COACH.Neutral;

        // factorVector is array [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
        // Indices: 0, 1, 2 (Def); 3 (Mid); 4, 5, 6 (Att)

        factorVector[0] *= coachMult.Def;
        factorVector[1] *= coachMult.Def;
        factorVector[2] *= coachMult.Def;
        // Midfield usually usually unaffected by Coach Type? Standard is Def/Att trade-off. 
        // Hattrick Wiki says: "Defensive coach: +Defense, -Attack. Offensive: +Attack, -Defense." Midfield is unchanged.

        factorVector[4] *= coachMult.Att;
        factorVector[5] *= coachMult.Att;
        factorVector[6] *= coachMult.Att;

        // AUTO FORMATION SELECTION (Static)
        // If Auto, we verify which formation yields the best "Penalized Score" with the starting squad
        // and lock it for the entire simulation.
        if (this.formation === 'Auto') {
            let bestFmt = '352';
            let maxScore = -Infinity;

            const formations = Object.keys(FORMATION_SLOTS);

            // Backup current formation
            const originalFmt = 'Auto';

            formations.forEach(fmt => {
                this.formation = fmt; // Temporarily set
                const res = this.getBestLineup(factorVector, this.players);

                // Calculate Penalized Score
                let cdCount = 0, imCount = 0, fwCount = 0;
                res.roster.forEach(r => {
                    if (r.slot.startsWith('CD')) cdCount++;
                    if (r.slot.startsWith('IM')) imCount++;
                    if (r.slot.startsWith('FW')) fwCount++;
                });

                // Cap counts
                cdCount = Math.min(cdCount, 3);
                imCount = Math.min(imCount, 3);
                fwCount = Math.min(fwCount, 3);

                const penCD = this.COEFFICIENTS.OVERCROWDING.CD[cdCount] || 1.0;
                const penIM = this.COEFFICIENTS.OVERCROWDING.IM[imCount] || 1.0;
                const penFW = this.COEFFICIENTS.OVERCROWDING.FW[fwCount] || 1.0;

                let penalizedScore = 0;
                res.roster.forEach(r => {
                    let multiplier = 1.0;
                    if (r.slot.startsWith('CD')) multiplier = penCD;
                    if (r.slot.startsWith('IM')) multiplier = penIM;
                    if (r.slot.startsWith('FW')) multiplier = penFW;
                    penalizedScore += r.score * multiplier;
                });

                if (penalizedScore > maxScore) {
                    maxScore = penalizedScore;
                    bestFmt = fmt;
                }
                console.log(`Auto Check: Formation ${fmt}, Raw: ${res.totalScore.toFixed(1)}, Penalized: ${penalizedScore.toFixed(1)}`);
            });

            this.formation = bestFmt; // Lock in the winner
            console.log(`Auto-selected formation: ${bestFmt} with score ${maxScore.toFixed(2)}`);
        }

        // Lock the lineup positions for the entire simulation
        const initialBest = this.getBestLineup(factorVector, this.players);
        this.fixedRoster = initialBest.roster;

        for (let week = 1; week <= this.weeks; week++) {
            const bestChoice = this.optimizeWeek(factorVector, week);

            // Only apply and log training if beneficial training was found
            if (bestChoice.type) {
                this.applyTraining(bestChoice);
                log.push({
                    week: week,
                    trainingType: bestChoice.type,
                    gain: bestChoice.totalGain,
                    trainees: bestChoice.trainees.map(t => t.id)
                });
            } else {
                // Still apply aging even when no training is selected
                for (const p of this.players) {
                    p.age += 1 / 16;
                }
            }
        }

        const finalLineup = this.getBestLineup(factorVector, this.players);

        return {
            log: log,
            finalPlayers: this.players,
            lineup: finalLineup.roster,
            formation: finalLineup.formationName || this.formation // Use the one chosen by logic
        };
    }

    /**
     * Find the best training type for this week
     * Strategy: Maximize the gain in the BEST LINEUP SCORE (using current Formation)
     */
    optimizeWeek(weights, week) {
        let bestType = null;
        let maxNetGain = 0;  // Only accept training with positive net gain
        let bestTrainees = [];

        // 1. Calculate Baseline Score and Current Roles
        const baselineScore = this.getLineupScore(this.fixedRoster, this.players, weights);

        // Map Player ID -> Assigned Slot
        const roleMap = {};
        this.fixedRoster.forEach(r => roleMap[r.playerId] = r.slot);

        // Evaluate each training type
        for (const type of this.trainingTypes) {

            let effects = this.trainingSlots[type];
            const playerUpdates = new Map(); // PlayerIndex -> { SkillName: Gain }

            effects.forEach(effect => {
                const skillName = effect.skill || getSkillNameFromTrainingType(type);

                const candidates = this.players.map(p => {
                    let evalPos = roleMap[p.id];
                    if (!evalPos) {
                        evalPos = this.getBestPositionForPlayer(p, weights);
                    }

                    // Hack: Map Extended types to Standard types for gain calculation
                    let calcType = type;
                    if (effect.skill === 'Defending') calcType = 'Def';
                    if (effect.skill === 'Winger') calcType = 'Wing';
                    if (effect.skill === 'Scoring') calcType = 'Score';
                    if (effect.skill === 'SetPieces') calcType = 'SP';
                    if (!effect.skill) calcType = type;

                    const marginal = calculateMarginalValue(
                        evalPos, p.skills, calcType, p.age, weights,
                        { staminaShare: this.staminaShare, intensity: 100 }
                    );

                    return {
                        playerIndex: this.players.indexOf(p),
                        gain: marginal.skillGain,
                        scoreDelta: marginal.scoreDelta,
                    };
                });

                // Sort candidates by potential improvement
                candidates.sort((a, b) => b.scoreDelta - a.scoreDelta);

                // Select trainees for THIS effect
                let count = effect.count;
                let efficiency = effect.efficiency;

                for (let i = 0; i < count && i < candidates.length; i++) {
                    const c = candidates[i];
                    if (!playerUpdates.has(c.playerIndex)) {
                        playerUpdates.set(c.playerIndex, {});
                    }
                    const updates = playerUpdates.get(c.playerIndex);
                    updates[skillName] = (updates[skillName] || 0) + (c.gain * efficiency);
                }
            });

            // 4. Simulate Training and Measure TEAM Impact
            const tempPlayers = this.fastDeepCopy(this.players);

            // Apply all updates
            playerUpdates.forEach((gains, pIndex) => {
                const p = tempPlayers[pIndex];
                Object.keys(gains).forEach(sName => {
                    p.skills[sName] += gains[sName];
                });
            });

            // Calculate New Team Score
            const newTeamTotalScore = this.getLineupScore(this.fixedRoster, tempPlayers, weights);
            const netGain = newTeamTotalScore - baselineScore;

            if (netGain > maxNetGain) {
                maxNetGain = netGain;
                bestType = type;

                bestTrainees = [];
                playerUpdates.forEach((gains, pIndex) => {
                    bestTrainees.push({
                        player: this.players[pIndex],
                        updates: gains
                    });
                });
            }
        }

        return {
            type: bestType,
            totalGain: maxNetGain,
            trainees: bestTrainees
        };
    }

    applyTraining(choice) {
        // Apply training gains
        for (const trainee of choice.trainees) {
            const p = trainee.player;
            Object.keys(trainee.updates).forEach(skillName => {
                p.skills[skillName] += trainee.updates[skillName];
            });
        }

        // Apply aging
        for (const p of this.players) {
            p.age += 1 / 16;
        }
    }

    getBestPositionForPlayer(player, weights) {
        // Updated: Search ALL variants of 3-5-2 roles (and others)
        let maxSS = -1;
        let bestPos = 'IM';

        const allVariants = [
            ...this.positionVariants.GK,
            ...this.positionVariants.WB,
            ...this.positionVariants.CD,
            ...this.positionVariants.IM,
            ...this.positionVariants.W,
            ...this.positionVariants.FW
        ];

        for (const pos of allVariants) {
            if (player.isGK && pos !== 'GK') continue;
            if (!player.isGK && pos === 'GK') continue;

            const ss = calculateSkillScore(pos, player.skills, weights);
            if (ss > maxSS) {
                maxSS = ss;
                bestPos = pos;
            }
        }
        return bestPos;
    }

    getBestLineup(weights, squad) {
        // Get slots for current formation
        const slots = FORMATION_SLOTS[this.formation] || FORMATION_SLOTS['352'];

        // 1. Calculate Matrix: Score for every Player in every Variant
        // We separate specialized IM slots for strict constraint handling

        const matrix = [];

        squad.forEach((p) => {
            const row = {};

            if (p.isGK) {
                row['GK'] = { score: calculateSkillScore('GK', p.skills, weights), variant: 'GK' };
            } else {
                row['GK'] = { score: -1, variant: null };

                // Slots types to check
                const slotTypes = ['WB', 'CD', 'IM_Side', 'IM_Mid', 'W', 'FW'];

                slotTypes.forEach(slotType => {
                    let constraints = [];
                    // Define valid variants for this specific slot type
                    if (slotType === 'IM_Mid') {
                        // Central IM cannot be TW
                        constraints = ['IM', 'IM_O', 'IM_D'];
                    } else if (slotType === 'IM_Side') {
                        constraints = ['IM', 'IM_O', 'IM_D', 'IM_TW'];
                    } else {
                        // Standard lookup
                        constraints = this.positionVariants[slotType] || [];
                    }

                    let bestVarScore = -1;
                    let bestVar = null;

                    constraints.forEach(variant => {
                        const s = calculateSkillScore(variant, p.skills, weights);
                        if (s > bestVarScore) {
                            bestVarScore = s;
                            bestVar = variant;
                        }
                    });

                    if (bestVar) {
                        row[slotType] = { score: bestVarScore, variant: bestVar };
                    } else {
                        row[slotType] = { score: -1, variant: null };
                    }
                });
            }
            matrix.push({ id: p.id, name: p.name, scores: row });
        });

        // Generate Candidates
        const candidates = [];
        matrix.forEach(p => {
            slots.forEach((targetSlot, slotIdx) => {
                const data = p.scores[targetSlot];
                if (data && data.score > -1) {
                    candidates.push({
                        playerId: p.id,
                        playerName: p.name,
                        targetSlot: targetSlot, // 'IM_Mid'
                        slotId: `${targetSlot}_${slotIdx}`,
                        score: data.score,
                        variant: data.variant // 'IM_O'
                    });
                }
            });
        });

        // Sort descending
        candidates.sort((a, b) => b.score - a.score);

        const assignedPlayers = new Set();
        const filledSlots = new Set();
        const roster = [];
        let totalScore = 0;

        // Greedy Fill
        for (const cand of candidates) {
            if (!assignedPlayers.has(cand.playerId) && !filledSlots.has(cand.slotId)) {
                assignedPlayers.add(cand.playerId);
                filledSlots.add(cand.slotId);

                roster.push({
                    playerId: cand.playerId,
                    playerName: cand.playerName,
                    slot: cand.variant, // "IM_TW"
                    role: cand.targetSlot, // "IM_Side"
                    score: cand.score
                });

                totalScore += cand.score;
            }
            if (roster.length === 11) break;
        }

        return { roster, totalScore };
    }

    /**
     * Calculate score of a fixed roster with updated player skills
     */
    getLineupScore(roster, players, weights) {
        let totalScore = 0;
        const playerMap = new Map(players.map(p => [p.id, p]));

        roster.forEach(r => {
            const p = playerMap.get(r.playerId);
            if (p) {
                // Roster contains 'slot' which is the variant (e.g. 'IM', 'IM_TW')
                totalScore += calculateSkillScore(r.slot, p.skills, weights);
            }
        });
        return totalScore;
    }

    fastDeepCopy(players) {
        return players.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            skills: { ...p.skills },
            bestPosition: p.bestPosition,
            isGK: p.isGK
        }));
    }
}
