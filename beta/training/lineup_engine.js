/**
 * Hattrick Lineup Simulator Engine (Node.js version)
 * Calculates sector ratings from a lineup of players.
 */

// ===================================
// 1. DATA & CONSTANTS
// ===================================

// Position Contribution Matrices - Defense values from defensive_contributions.txt
// Schema: [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
// Note: defensive_contributions.txt format [Left, Center, Right] maps to [LDef, CDef, RDef]
const _CONTRIBUTION_MATRICES = {
    // Goalkeeper - GK_GK_Skill and GK_Def_Skill
    'GK': { Keeper: [0.504, 0.424, 0.504, 0, 0, 0, 0], Defending: [0.223, 0.191, 0.223, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },

    // Wingback Right variants
    'WB': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.731, 0.191, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.050, 0, 0, 0], Winger: [0, 0, 0, 0, 0.369, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'WB_TM': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.607, 0.341, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.089, 0, 0, 0], Winger: [0, 0, 0, 0, 0.222, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'WB_O': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.607, 0.191, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.089, 0, 0, 0], Winger: [0, 0, 0, 0, 0.424, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'WB_D': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.803, 0.223, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.050, 0, 0, 0], Winger: [0, 0, 0, 0, 0.269, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },

    // Central Defenders - CD_Middle_Normal
    'CD': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.223, 0.504, 0.223, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.089, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    // CD_Right_Normal
    'CD_R': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.446, 0.504, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.117, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    // CD_Left_Normal
    'CD_L': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0, 0.504, 0.446, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.117, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    // CD_Middle_Offensive
    'CD_O': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.171, 0.369, 0.171, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.125, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    // CD_Right_TW
    'CD_TW': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.657, 0.341, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.050, 0, 0, 0], Winger: [0, 0, 0, 0, 0.158, 0, 0], Passing: [0, 0, 0, 0, 0.035, 0, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },

    // Inner Midfielders
    'IM': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.089, 0.223, 0.089, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.312, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0.089, 0.159, 0.089], Scoring: [0, 0, 0, 0, 0, 0.125, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'IM_O': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.050, 0.089, 0.050, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.283, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0.125, 0.253, 0.125], Scoring: [0, 0, 0, 0, 0, 0.159, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'IM_D': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.125, 0.283, 0.125, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.283, 0, 0, 0], Winger: [0, 0, 0, 0, 0, 0, 0], Passing: [0, 0, 0, 0, 0.050, 0.089, 0.050], Scoring: [0, 0, 0, 0, 0, 0.089, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'IM_TW': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.191, 0.191, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.283, 0, 0, 0], Winger: [0, 0, 0, 0, 0.369, 0, 0], Passing: [0, 0, 0, 0, 0.191, 0.125, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },

    // Wingers (Right variants)
    'W': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.283, 0.125, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.159, 0, 0, 0], Winger: [0, 0, 0, 0, 0.504, 0, 0], Passing: [0, 0, 0, 0, 0.159, 0.089, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'W_TM': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.253, 0.125, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.191, 0, 0, 0], Winger: [0, 0, 0, 0, 0.451, 0, 0], Passing: [0, 0, 0, 0, 0.125, 0.089, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'W_O': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.191, 0.089, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.089, 0, 0, 0], Winger: [0, 0, 0, 0, 0.607, 0, 0], Passing: [0, 0, 0, 0, 0.191, 0.089, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'W_D': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0.504, 0.125, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.089, 0, 0, 0], Winger: [0, 0, 0, 0, 0.424, 0, 0], Passing: [0, 0, 0, 0, 0.125, 0.050, 0], Scoring: [0, 0, 0, 0, 0, 0, 0], SetPieces: [0, 0, 0, 0, 0, 0, 0] },

    // Forwards (no defensive contributions)
    'FW': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0, 0, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.089, 0, 0, 0], Winger: [0, 0, 0, 0, 0.158, 0, 0.158], Passing: [0, 0, 0, 0, 0.089, 0.191, 0.089], Scoring: [0, 0, 0, 0, 0.191, 0.504, 0.191], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'FW_D': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0, 0, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.125, 0, 0, 0], Winger: [0, 0, 0, 0, 0.089, 0, 0.089], Passing: [0, 0, 0, 0, 0.191, 0.283, 0.191], Scoring: [0, 0, 0, 0, 0.089, 0.283, 0.089], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'FW_TW': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0, 0, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.050, 0, 0, 0], Winger: [0, 0, 0, 0, 0.396, 0, 0.166], Passing: [0, 0, 0, 0, 0.125, 0.125, 0.050], Scoring: [0, 0, 0, 0, 0.312, 0.340, 0.125], SetPieces: [0, 0, 0, 0, 0, 0, 0] },
    'FW_TD': { Keeper: [0, 0, 0, 0, 0, 0, 0], Defending: [0, 0, 0, 0, 0, 0, 0], Playmaking: [0, 0, 0, 0.164, 0, 0, 0], Winger: [0, 0, 0, 0, 0.103, 0, 0.103], Passing: [0, 0, 0, 0, 0.323, 0.315, 0.323], Scoring: [0, 0, 0, 0, 0.089, 0.283, 0.089], SetPieces: [0, 0, 0, 0, 0, 0, 0] }
};

// Coefficients
const COEFFICIENTS = {
    // Overcrowding Penalties (per-player multipliers based on count of same position type)
    // Source: The Unwritten Manual
    // These penalties apply PER PLAYER - with 2 FW, each FW gets 0.945 applied
    OVERCROWDING: {
        CD: { 1: 1.000, 2: 0.964, 3: 0.900 },  // -3.6% for 2, -10% for 3
        IM: { 1: 1.000, 2: 0.935, 3: 0.825 },  // -6.5% for 2, -17.5% for 3
        FW: { 1: 1.000, 2: 0.933, 3: 0.865 }   // -6.7% for 2, -13.5% for 3
    },

    // Midfield Multipliers
    MIDFIELD: {
        AWAY: 1.00,
        HOME: 1.20,
        DERBY: 1.10, // Away team only
        PIC: 0.84,
        NORMAL: 1.00,
        MOTS: 83 / 75, // ~1.106
        CA: 0.93,    // Counter Attack
        LS: 0.96     // Long Shots (affects Attack too)
    },

    // Coach Type Multipliers { Def, Att }
    COACH: {
        NEUTRAL: { Def: 1.000, Att: 1.000 },
        OFFENSIVE: { Def: 0.880, Att: 1.074 },
        DEFENSIVE: { Def: 1.128, Att: 0.882 }
    },

    // Team Confidence (Attack only)
    CONFIDENCE: {
        0: 0.80, // Non-existent
        1: 0.85, // Disastrous
        2: 0.90, // Wretched
        3: 0.95, // Poor
        4: 1.00, // Decent (Baseline)
        5: 1.05, // Strong
        6: 1.10, // Wonderful
        7: 1.15, // Slightly Exaggerated
        8: 1.20, // Exaggerated
        9: 1.25  // Completely Exaggerated
    },

    // Team Spirit (Midfield only) - using 'Composed' (4.5) as baseline index
    // Mapping exact values for PIC/Normal/MOTS based on "Composed" baseline
    // The simplified table provided relative multipliers:
    // Composed (4.5): PIC 0.87, Normal 1.00, MOTS 1.13
    // We will use a function to interpolate or lookup
    TEAM_SPIRIT: {
        // [PIC, Normal, MOTS] coefficients for specific levels
        // Source: User provided table
        10.5: [1.244, 1.481, 1.639],
        9.5: [1.189, 1.415, 1.566],
        8.5: [1.126, 1.340, 1.483],
        7.5: [1.061, 1.263, 1.398],
        6.5: [0.991, 1.180, 1.306],
        5.5: [0.919, 1.094, 1.211],
        4.5: [0.840, 1.000, 1.107],
        3.5: [0.752, 0.895, 0.990],
        2.5: [0.649, 0.773, 0.855],
        1.5: [0.528, 0.628, 0.695],
        0.5: [0.375, 0.447, 0.495]
    },

    // Tactics Modifiers
    // Tactics Modifiers
    TACTICS: {
        AOW: { CDef: 0.85 }, // Attack on Wing: Central Def -15%
        AIM: { SideDef: 0.85 }, // Attack in Middle: Side Def -15%
        PC: { Def: 0.93 },  // Play Creative: Defense -7%
        LS: { Att: 0.96, Mid: 0.96 },   // Long Shots: Att/Mid -4%
        CA: { Mid: 0.93 } // Counter Attacks: Mid -7%
    }
};

// ===================================
// 2. HELPER FUNCTIONS
// ===================================

function mirrorSector(sectorIdx) {
    // 0=RDef, 1=CDef, 2=LDef, 3=Mid, 4=RAtt, 5=CAtt, 6=LAtt
    // Mirror: 0<->2, 4<->6. 1,3,5 stay same.
    const map = { 0: 2, 2: 0, 4: 6, 6: 4 };
    return map[sectorIdx] !== undefined ? map[sectorIdx] : sectorIdx;
}

function getMirroredContribution(matrix) {
    // Returns a matrix where Left/Right sectors are swapped
    const mirrored = {};
    for (const skill in matrix) {
        mirrored[skill] = [
            matrix[skill][2], // RDef <- LDef
            matrix[skill][1], // CDef
            matrix[skill][0], // LDef <- RDef
            matrix[skill][3], // Mid
            matrix[skill][6], // RAtt <- LAtt
            matrix[skill][5], // CAtt
            matrix[skill][4]  // LAtt <- RAtt
        ];
    }
    return mirrored;
}

function getPositionMatrix(posCode) {
    if (_CONTRIBUTION_MATRICES[posCode]) {
        return _CONTRIBUTION_MATRICES[posCode];
    }

    // Check for "Left" variant by seeing if "Right" exists and mirroring
    // Standard names: WB (Right), Left WB -> map to WB mirrored
    // Names in our code: 'WB', 'WB_TM', etc. are RIGHT based.
    // If input is 'WB_Left', we assume it's 'WB' mirrored.

    // Actually, user likely provides just the standard code + side info.
    // For this engine, let's assume input 'posCode' is one of the valid keys.
    // If we need left/right logic, the caller should handle mapping 'Left WB' -> 'WB' + mirror flag.
    return null;
}

// ===================================
// 3. CORE CALCULATION
// ===================================

/**
 * Calculate ratings for a lineup
 * @param {Array} players - Array of player objects: { id, positionCode, side, skills: {Keeper, Defending...} }
 *   positionCode: 'CD', 'IM', 'W', 'FW', 'GK', 'WB'... (keys in matrix)
 *   side: 'Right', 'Left', 'Middle' (determines mirroring)
 * @param {Object} settings - Match settings: { homeAdvantage, matchType, teamSpirit, teamConfidence, coachType, tactic }
 */
function calculateLineupRatings(players, settings) {
    // Initialize sector sums
    // [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
    const sectorSums = [0, 0, 0, 0, 0, 0, 0];

    // Track central players for overcrowding
    // Positions considered central: CD, IM, FW
    const centralCounts = { CD: 0, IM: 0, FW: 0 };

    // 1. First pass: Count central players
    players.forEach(p => {
        const basePos = p.positionCode.split('_')[0]; // CD_O -> CD
        if (['CD', 'IM', 'FW'].includes(basePos) && p.side === 'Middle') {
            centralCounts[basePos]++;
        }
        // NOTE: Does a "Towards Wing" or "Offensive" CD count as central?
        // Usually YES, unless they are literally playing ON the wing.
        // Standard HT logic: "3 Central Defenders" = 3 players in CD slots.
        // We will assume input validates slot usage.
        // Refinement: Lineup slots 100-103 are CD, etc. For now rely on 'Middle' side flag or just position type.
        // Simplified: Any CD variant counts as CD.
        if (basePos === 'CD') centralCounts.CD++;
        if (basePos === 'IM') centralCounts.IM++;
        if (basePos === 'FW') centralCounts.FW++;
        // Wait, standard CD is central. CD_TW is still a central slot.
        // We need to be careful not to double count if logic above was weak.
        // Let's assume input array is exactly the 11 players on field.
    });

    // Reset counts for strict recounting based on simulation rules
    // Overcrowding applies to the position "class" (CD, IM, FW)
    centralCounts.CD = players.filter(p => p.positionCode.startsWith('CD')).length;
    centralCounts.IM = players.filter(p => p.positionCode.startsWith('IM')).length;
    centralCounts.FW = players.filter(p => p.positionCode.startsWith('FW')).length;

    // Cap counts at 3 for lookup (HT doesn't allow >3 in a sector)
    const cappedCounts = {
        CD: Math.min(centralCounts.CD, 3),
        IM: Math.min(centralCounts.IM, 3),
        FW: Math.min(centralCounts.FW, 3)
    };

    // Get per-player penalty for each position type
    const penalties = {
        CD: COEFFICIENTS.OVERCROWDING.CD[cappedCounts.CD] || 1.0,
        IM: COEFFICIENTS.OVERCROWDING.IM[cappedCounts.IM] || 1.0,
        FW: COEFFICIENTS.OVERCROWDING.FW[cappedCounts.FW] || 1.0
    };

    // 2. Second pass: Calculate individual contributions
    players.forEach(p => {
        let matrix = _CONTRIBUTION_MATRICES[p.positionCode];
        if (!matrix) return;

        // Apply mirroring for Left side players
        // Our matrices are Right-side based (RDef, RAtt, etc.)
        // Left side players contribute to LDef, LAtt.
        if (p.side === 'Left') {
            matrix = getMirroredContribution(matrix);
        }

        // Determine overcrowding penalty for this player
        const basePos = p.positionCode.split('_')[0];
        const playerPenalty = penalties[basePos] || 1.0; // GK, WB, W have no overcrowding

        // Sum contributions
        for (const skill in p.skills) {
            const level = p.skills[skill];
            if (!matrix[skill]) continue;

            for (let i = 0; i < 7; i++) {
                const rawContrib = matrix[skill][i] * level;

                // Apply per-player overcrowding penalty (same for all sectors)
                sectorSums[i] += rawContrib * playerPenalty;
            }
        }
    });

    // 3. Apply Team Multipliers
    // [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]

    // --- MIDFIELD (Idx 3) ---
    // Home/Away
    let midMult = (settings.isHome ? COEFFICIENTS.MIDFIELD.HOME : COEFFICIENTS.MIDFIELD.AWAY);
    // Tactic penalties on Midfield (Long Shots etc)
    if (settings.tactic === 'LS') midMult *= COEFFICIENTS.TACTICS.LS.Mid;
    if (settings.tactic === 'CA') midMult *= COEFFICIENTS.MIDFIELD.CA; // CA reduces mid

    // MOTS/PIC
    if (settings.matchType === 'MOTS') midMult *= COEFFICIENTS.MIDFIELD.MOTS;
    if (settings.matchType === 'PIC') midMult *= COEFFICIENTS.MIDFIELD.PIC;

    // Team Spirit
    // Lookup multiplier based on level and match type (PIC/Normal/MOTS)
    const tsLevel = settings.teamSpiritLevel !== undefined ? settings.teamSpiritLevel : 4.5;
    const matchType = settings.matchType || 'Normal'; // 'PIC', 'Normal', 'MOTS'

    // Find closest level if exact match missing (e.g. 4.0 -> use 4.5 or interpolate?)
    // User provided half-steps. Let's assume input matches key or find nearest?
    // Keys are strings "10.5", "9.5".
    // Let's use exact match for now, defaulting to 4.5 (Composed)
    const tsRow = COEFFICIENTS.TEAM_SPIRIT[tsLevel] || COEFFICIENTS.TEAM_SPIRIT[4.5];
    let tsMult = 1.0;

    if (tsRow) {
        if (matchType === 'PIC') tsMult = tsRow[0];
        else if (matchType === 'MOTS') tsMult = tsRow[2];
        else tsMult = tsRow[1]; // Normal
    } else {
        tsMult = 1.0; // Fallback
    }

    midMult *= tsMult;

    sectorSums[3] *= midMult;

    // --- DEFENSE (Idx 0, 1, 2) ---
    // Coach Effect
    let defMult = 1.0;
    if (settings.coachType === 'Defensive') defMult = COEFFICIENTS.COACH.DEFENSIVE.Def;
    if (settings.coachType === 'Offensive') defMult = COEFFICIENTS.COACH.OFFENSIVE.Def;

    // Tactic Penalties
    // PC reduces all def
    if (settings.tactic === 'PC') defMult *= COEFFICIENTS.TACTICS.PC.Def;

    sectorSums[0] *= defMult; // RDef
    sectorSums[1] *= defMult; // CDef
    sectorSums[2] *= defMult; // LDef

    // Specific Tactic Penalties
    if (settings.tactic === 'AOW') {
        sectorSums[1] *= COEFFICIENTS.TACTICS.AOW.CDef; // Central Def penalty
    }
    if (settings.tactic === 'AIM') {
        sectorSums[0] *= COEFFICIENTS.TACTICS.AIM.SideDef; // RDef penalty
        sectorSums[2] *= COEFFICIENTS.TACTICS.AIM.SideDef; // LDef penalty
    }


    // --- ATTACK (Idx 4, 5, 6) ---
    // Coach Effect
    let attMult = 1.0;
    if (settings.coachType === 'Defensive') attMult = COEFFICIENTS.COACH.DEFENSIVE.Att;
    if (settings.coachType === 'Offensive') attMult = COEFFICIENTS.COACH.OFFENSIVE.Att;

    // Confidence
    const confMult = COEFFICIENTS.CONFIDENCE[settings.confidenceLevel] || 1.0;
    attMult *= confMult;

    // Tactic Penalties
    if (settings.tactic === 'LS') attMult *= COEFFICIENTS.TACTICS.LS.Att;

    sectorSums[4] *= attMult; // RAtt
    sectorSums[5] *= attMult; // CAtt
    sectorSums[6] *= attMult; // LAtt

    return sectorSums;
}

// ===================================
// 4. SECTOR RATING PHYSICS ENGINE
// ===================================
// Based on guidelines.txt reverse-engineered formula
// Formula: physics_rating = SCALE_FACTOR * (raw_sum ^ EXPONENT)
// Then add floor and round to nearest 0.25

// Physics engine constants (same for all sectors)
const PHYSICS = {
    SCALE_FACTOR: 0.25,
    EXPONENT: 1.2,
    FLOOR: 0.75
};

/**
 * Apply Hattrick physics engine formula to a raw contribution sum
 * @param {number} rawSum - Sum of all player contributions to this sector
 * @returns {number} Physics-based rating (before floor/rounding)
 */
function applySectorPhysics(rawSum) {
    return PHYSICS.SCALE_FACTOR * Math.pow(rawSum, PHYSICS.EXPONENT);
}

/**
 * Calculate defense rating using Hattrick physics engine
 * @param {number} rawSum - Sum of all player contributions to this defense sector
 * @param {string} coachType - 'Neutral', 'Defensive', or 'Offensive'
 * @returns {number} Final defense rating (rounded to nearest 0.25)
 */
function calculateDefenseRating(rawSum, coachType = 'Neutral') {
    const COACH_MODIFIERS = {
        'Neutral': 1.0,
        'Defensive': 1.128,
        'Offensive': 0.88
    };

    // Inlined applySectorPhysics and roundHattrick for performance
    const physicsRating = PHYSICS.SCALE_FACTOR * Math.pow(rawSum, PHYSICS.EXPONENT);
    const coachMultiplier = COACH_MODIFIERS[coachType] || 1.0;
    const finalValue = PHYSICS.FLOOR + physicsRating * coachMultiplier;

    return 0.25 * Math.round(finalValue / 0.25);
}

/**
 * Calculate midfield rating using Hattrick physics engine
 * @param {number} rawSum - Sum of all player contributions to midfield
 * @returns {number} Final midfield rating (rounded to nearest 0.25)
 */
function calculateMidfieldRating(rawSum) {
    // Inlined applySectorPhysics and roundHattrick for performance
    const physicsRating = PHYSICS.SCALE_FACTOR * Math.pow(rawSum, PHYSICS.EXPONENT);
    const finalValue = PHYSICS.FLOOR + physicsRating;
    return 0.25 * Math.round(finalValue / 0.25);
}

/**
 * Calculate attack rating using Hattrick physics engine
 * @param {number} rawSum - Sum of all player contributions to this attack sector
 * @param {string} coachType - 'Neutral', 'Defensive', or 'Offensive'
 * @returns {number} Final attack rating (rounded to nearest 0.25)
 */
function calculateAttackRating(rawSum, coachType = 'Neutral') {
    const COACH_MODIFIERS = {
        'Neutral': 1.0,
        'Defensive': 0.882,
        'Offensive': 1.074
    };

    // Inlined applySectorPhysics and roundHattrick for performance
    const physicsRating = PHYSICS.SCALE_FACTOR * Math.pow(rawSum, PHYSICS.EXPONENT);
    const coachMultiplier = COACH_MODIFIERS[coachType] || 1.0;
    const finalValue = PHYSICS.FLOOR + physicsRating * coachMultiplier;

    return 0.25 * Math.round(finalValue / 0.25);
}

/**
 * Round to nearest 0.25 (Hattrick rating display format)
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
function roundHattrick(value) {
    return 0.25 * Math.round(value / 0.25);
}

// ===================================
// 5. RATING CONVERSION & DISPLAY
// ===================================

// Rating level names (1-indexed, where 1 = "disastrous", 20 = "divine+3")
const RATING_LEVELS = [
    '', // 0 - not used
    'disastrous',
    'wretched',
    'poor',
    'weak',
    'inadequate',
    'passable',
    'solid',
    'excellent',
    'formidable',
    'outstanding',
    'brilliant',
    'magnificent',
    'world class',
    'supernatural',
    'titanic',
    'extra-terrestrial',
    'mythical',
    'magical',
    'utopian',
    'divine',
    'divine+1',
    'divine+2',
    'divine+3'
];

// Sub-level names for the decimal part
const SUB_LEVELS = {
    0: '',          // .00
    0.25: '(low)',  // .25
    0.5: '',        // .50 - often displayed as base level
    0.75: '(high)'  // .75
};

/**
 * Convert numeric rating to display string
 * @param {number} rating - Rating value (e.g., 7.25)
 * @returns {string} Display string (e.g., "solid (low)")
 */
function getRatingName(rating) {
    const level = Math.floor(rating);
    const subLevel = rating - level;
    const levelName = RATING_LEVELS[level] || `level ${level}`;
    const subName = SUB_LEVELS[roundHattrick(subLevel)] || '';
    return subName ? `${levelName} ${subName}` : levelName;
}

/**
 * Convert rating to display format
 * Correct formula: Display = (RawValue - 1) / 4
 * Example: Raw 46.007 -> (46.007 - 1) / 4 = 11.25 (approximately Divine)
 * @param {number} value - Raw rating value
 * @returns {number} Display rating
 */
function convertRatingToDisplay(value) {
    return (value - 1) / 4;
}

// ===================================
// 6. COMPREHENSIVE RATING CALCULATOR
// ===================================

/**
 * Calculate all sector ratings for a lineup
 * This is the main entry point for getting complete team ratings
 * 
 * @param {Array} players - Array of player objects with skills and positions
 * @param {Object} settings - Match settings (coachType, isHome, tactic, etc.)
 * @returns {Object} Complete ratings object with all 7 sectors
 */
function calculateAllSectorRatings(players, settings = {}) {
    // Get raw sector sums with multipliers applied
    const sectorSums = calculateLineupRatings(players, settings);

    const coachType = settings.coachType || 'Neutral';

    // Calculate final ratings for each sector
    // Schema: [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
    const ratings = {
        defense: {
            right: calculateDefenseRating(sectorSums[0], coachType),
            center: calculateDefenseRating(sectorSums[1], coachType),
            left: calculateDefenseRating(sectorSums[2], coachType)
        },
        midfield: calculateMidfieldRating(sectorSums[3]),
        attack: {
            right: calculateAttackRating(sectorSums[4], coachType),
            center: calculateAttackRating(sectorSums[5], coachType),
            left: calculateAttackRating(sectorSums[6], coachType)
        },
        // Also include raw sums for debugging/analysis
        rawSums: {
            rightDef: sectorSums[0],
            centerDef: sectorSums[1],
            leftDef: sectorSums[2],
            midfield: sectorSums[3],
            rightAtt: sectorSums[4],
            centerAtt: sectorSums[5],
            leftAtt: sectorSums[6]
        }
    };

    // Add display names
    ratings.display = {
        defense: {
            right: getRatingName(ratings.defense.right),
            center: getRatingName(ratings.defense.center),
            left: getRatingName(ratings.defense.left)
        },
        midfield: getRatingName(ratings.midfield),
        attack: {
            right: getRatingName(ratings.attack.right),
            center: getRatingName(ratings.attack.center),
            left: getRatingName(ratings.attack.left)
        }
    };

    return ratings;
}

/**
 * Format ratings as a summary string for display
 * @param {Object} ratings - Ratings object from calculateAllSectorRatings
 * @returns {string} Formatted summary
 */
function formatRatingsSummary(ratings) {
    const lines = [
        '=== TEAM RATINGS ===',
        '',
        'DEFENSE:',
        `  Right:  ${ratings.defense.right.toFixed(2)} (${ratings.display.defense.right})`,
        `  Center: ${ratings.defense.center.toFixed(2)} (${ratings.display.defense.center})`,
        `  Left:   ${ratings.defense.left.toFixed(2)} (${ratings.display.defense.left})`,
        '',
        'MIDFIELD:',
        `  ${ratings.midfield.toFixed(2)} (${ratings.display.midfield})`,
        '',
        'ATTACK:',
        `  Right:  ${ratings.attack.right.toFixed(2)} (${ratings.display.attack.right})`,
        `  Center: ${ratings.attack.center.toFixed(2)} (${ratings.display.attack.center})`,
        `  Left:   ${ratings.attack.left.toFixed(2)} (${ratings.display.attack.left})`
    ];
    return lines.join('\n');
}

/**
 * Calculate Indirect Set Pieces (ISP) ratings
 * @param {Array} players - Array of 11 player objects (must include skills)
 * @returns {Object} { attack: number, defense: number }
 */
function calculateISPRatings(players) {
    // 1. Identify GK and Outfielders
    // players array should contain 11 players.
    // Based on Hattrick rules, GK is the player in the GK slot.
    // Our players have positionCode.

    let gk = null;
    const outfield = [];

    players.forEach(p => {
        // Check if position code starts with GK
        if (p.positionCode.startsWith('GK')) {
            gk = p;
        } else {
            outfield.push(p);
        }
    });

    // Fallback if no GK found (unlikely in valid team), use first player as GK?
    // Or if multiple GKs? (Should not happen in valid formation).
    // Let's assume standard valid lineup.

    if (!gk && players.length > 0) gk = players[0]; // Fallback

    // 2. Calculate Outfield Averages
    let sumScoring = 0;
    let sumDefending = 0;
    let sumSP = 0;
    let maxSP = 0;

    outfield.forEach(p => {
        const s = p.skills;
        sumScoring += s.Scoring || 0;
        sumDefending += s.Defending || 0;
        sumSP += s.SetPieces || 0;
        if ((s.SetPieces || 0) > maxSP) maxSP = s.SetPieces || 0;
    });

    const countOut = Math.max(outfield.length, 1); // Avoid division by zero
    const mAtt = sumScoring / countOut;
    const mDef = sumDefending / countOut;
    const mSP = sumSP / countOut;
    const SPshooter = maxSP;

    // 3. GK Stats
    const SPgk = gk ? (gk.skills.SetPieces || 0) : 0;
    const GKgk = gk ? (gk.skills.Keeper || 0) : 0;

    // 4. Formulas
    // ISP off = 0.5*mAtt + 0.3*mSP + 0.09*SPshooter
    const ispOff = 0.5 * mAtt + 0.3 * mSP + 0.09 * SPshooter;

    // ISP def = 0.4*mDef + 0.3*mSP + 0.1*SPgk + 0.08*GKgk
    const ispDef = 0.4 * mDef + 0.3 * mSP + 0.1 * SPgk + 0.08 * GKgk;

    return {
        attack: ispOff,
        defense: ispDef
    };
}


// Export for both Node.js and Browser
const LineupEngine = {
    // Data
    CONTRIBUTION_MATRICES: _CONTRIBUTION_MATRICES,
    COEFFICIENTS,
    PHYSICS,
    RATING_LEVELS,

    // Core calculation
    calculateLineupRatings,
    calculateAllSectorRatings,

    // Individual sector ratings
    calculateDefenseRating,
    calculateMidfieldRating,
    calculateAttackRating,
    applySectorPhysics,

    // Utilities
    roundHattrick,
    convertRatingToDisplay,
    getRatingName,
    formatRatingsSummary,

    // Helpers
    getMirroredContribution,
    getPositionMatrix,
    calculateISPRatings
};

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LineupEngine;
}

// Browser export
if (typeof window !== 'undefined') {
    window.LineupEngine = LineupEngine;
}

