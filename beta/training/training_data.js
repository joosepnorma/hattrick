/**
 * Training Data Module for Hattrick Training Planner
 * Contains contribution matrices and training speed formulas
 */

// =============================================================================
// SKILL AND SECTOR DEFINITIONS
// =============================================================================

const SKILLS = ['Keeper', 'Defending', 'Playmaking', 'Winger', 'Passing', 'Scoring', 'SetPieces'];
const SECTORS = ['RDef', 'CDef', 'LDef', 'Mid', 'RAtt', 'CAtt', 'LAtt'];

// Training types map to skill indices
const TRAINING_TYPES = {
    GK: 0,      // Keeper
    Def: 1,     // Defending
    PM: 2,      // Playmaking
    Wing: 3,    // Winger
    Pass: 4,    // Passing
    Score: 5,   // Scoring
    SP: 6       // Set Pieces
};

// =============================================================================
// POSITION CONTRIBUTION MATRICES
// Schema: [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt] for each skill
// =============================================================================

const CONTRIBUTION_MATRICES = {
    // Goalkeeper
    'GK': {
        Keeper: [0.504, 0.424, 0.504, 0.000, 0.000, 0.000, 0.000],  // GK_GK_Skill
        Defending: [0.223, 0.191, 0.223, 0.000, 0.000, 0.000, 0.000],  // GK_Def_Skill
        Playmaking: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Winger: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Wingback Normal (Right - use mirror for Left)
    'WB': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.731, 0.191, 0.000, 0.000, 0.000, 0.000, 0.000],  // WB_Right_Normal
        Playmaking: [0.000, 0.000, 0.000, 0.050, 0.000, 0.000, 0.000],  // WB_Normal
        Winger: [0.000, 0.000, 0.000, 0.000, 0.369, 0.000, 0.000],  // Wingback Normal (73%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Wingback Towards Middle
    'WB_TM': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.607, 0.341, 0.000, 0.000, 0.000, 0.000, 0.000],  // WB_Right_TM
        Playmaking: [0.000, 0.000, 0.000, 0.089, 0.000, 0.000, 0.000],  // WB_TM
        Winger: [0.000, 0.000, 0.000, 0.000, 0.222, 0.000, 0.000],  // Wingback TM (44%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Wingback Offensive
    'WB_O': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.607, 0.191, 0.000, 0.000, 0.000, 0.000, 0.000],  // WB_Right_Offensive
        Playmaking: [0.000, 0.000, 0.000, 0.089, 0.000, 0.000, 0.000],  // WB_Offensive
        Winger: [0.000, 0.000, 0.000, 0.000, 0.424, 0.000, 0.000],  // Wingback Offensive (84%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Wingback Defensive
    'WB_D': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.803, 0.223, 0.000, 0.000, 0.000, 0.000, 0.000],  // WB_Right_Defensive
        Playmaking: [0.000, 0.000, 0.000, 0.050, 0.000, 0.000, 0.000],  // WB_Defensive
        Winger: [0.000, 0.000, 0.000, 0.000, 0.269, 0.000, 0.000],  // Wingback Defensive (53%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Central Defender Normal
    'CD': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.223, 0.504, 0.223, 0.000, 0.000, 0.000, 0.000],  // CD_Middle_Normal
        Playmaking: [0.000, 0.000, 0.000, 0.089, 0.000, 0.000, 0.000],  // CD_Normal
        Winger: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Central Defender Offensive
    'CD_O': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.171, 0.369, 0.171, 0.000, 0.000, 0.000, 0.000],  // CD_Middle_Offensive (corrected)
        Playmaking: [0.000, 0.000, 0.000, 0.125, 0.000, 0.000, 0.000],  // CD_Offensive
        Winger: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Central Defender Towards Wing (Right variant - mirror for Left)
    'CD_TW': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.657, 0.341, 0.000, 0.000, 0.000, 0.000, 0.000],  // CD_Right_TW
        Playmaking: [0.000, 0.000, 0.000, 0.050, 0.000, 0.000, 0.000],  // CD_TW
        Winger: [0.000, 0.000, 0.000, 0.000, 0.158, 0.000, 0.000],  // CD TW (31%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.035, 0.000, 0.000],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Inner Midfielder Normal (Central, without overcrowding)
    'IM': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.089, 0.223, 0.089, 0.000, 0.000, 0.000, 0.000],  // IM_Middle_Normal
        Playmaking: [0.000, 0.000, 0.000, 0.312, 0.000, 0.000, 0.000],  // IM_Normal (Tier 1 - The King)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.089, 0.159, 0.089],  // IM_Middle_Normal
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.125, 0.000],  // IM Normal: CAtt 0.125
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Inner Midfielder Offensive (Central, from CSV)
    'IM_O': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.050, 0.089, 0.050, 0.000, 0.000, 0.000, 0.000],  // IM_Middle_Offensive
        Playmaking: [0.000, 0.000, 0.000, 0.283, 0.000, 0.000, 0.000],  // IM_Offensive (Tier 2)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.125, 0.253, 0.125],  // IM_Middle_Offensive
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.159, 0.000],  // IM Offensive: CAtt 0.159
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Inner Midfielder Defensive (Central, from CSV)
    'IM_D': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.125, 0.283, 0.125, 0.000, 0.000, 0.000, 0.000],  // IM_Middle_Defensive
        Playmaking: [0.000, 0.000, 0.000, 0.283, 0.000, 0.000, 0.000],  // IM_Defensive (Tier 2)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.050, 0.089, 0.050],  // IM_Middle_Defensive
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.089, 0.000],  // IM Defensive: CAtt 0.089
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Inner Midfielder Towards Wing (Right variant, from CSV)
    'IM_TW': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.191, 0.191, 0.000, 0.000, 0.000, 0.000, 0.000],  // IM_Right_TW
        Playmaking: [0.000, 0.000, 0.000, 0.283, 0.000, 0.000, 0.000],  // IM_TW (Tier 2)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.369, 0.000, 0.000],  // IM TW (73%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.191, 0.125, 0.000],  // IM_Right_TW
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Winger Normal (Right variant, without overcrowding)
    'W': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.283, 0.125, 0.000, 0.000, 0.000, 0.000, 0.000],  // Winger_Right_Normal
        Playmaking: [0.000, 0.000, 0.000, 0.159, 0.000, 0.000, 0.000],  // Winger_Normal (Tier 4)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.504, 0.000, 0.000],  // Winger Normal (100%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.159, 0.089, 0.000],  // Winger_Right_Normal
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Winger Towards Middle (Right variant, without overcrowding)
    'W_TM': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.253, 0.125, 0.000, 0.000, 0.000, 0.000, 0.000],  // Winger_Right_TM
        Playmaking: [0.000, 0.000, 0.000, 0.191, 0.000, 0.000, 0.000],  // Winger_TM (Tier 3)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.451, 0.000, 0.000],  // Winger TM (89%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.125, 0.089, 0.000],  // Winger_Right_TM
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Winger Offensive (Right variant, without overcrowding)
    'W_O': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.191, 0.089, 0.000, 0.000, 0.000, 0.000, 0.000],  // Winger_Right_Offensive
        Playmaking: [0.000, 0.000, 0.000, 0.089, 0.000, 0.000, 0.000],  // Winger_Offensive (Tier 6)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.607, 0.000, 0.000],  // Winger Offensive (120%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.191, 0.089, 0.000],  // Winger_Right_Offensive
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Winger Defensive (Right variant, without overcrowding)
    'W_D': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.504, 0.125, 0.000, 0.000, 0.000, 0.000, 0.000],  // Winger_Right_Defensive
        Playmaking: [0.000, 0.000, 0.000, 0.089, 0.000, 0.000, 0.000],  // Winger_Defensive (Tier 6)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.424, 0.000, 0.000],  // Winger Defensive (84%)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.125, 0.050, 0.000],  // Winger_Right_Defensive
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Forward Normal (Central, from CSV)
    'FW': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Playmaking: [0.000, 0.000, 0.000, 0.089, 0.000, 0.000, 0.000],  // FW_Normal (Tier 6)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.158, 0.000, 0.158],  // FW Normal (31% both sides)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.089, 0.191, 0.089],  // FW_Normal
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.191, 0.504, 0.191],  // FW Normal: RAtt 0.191, CAtt 0.504, LAtt 0.191
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Forward Defensive (Central, without overcrowding)
    'FW_D': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Playmaking: [0.000, 0.000, 0.000, 0.125, 0.000, 0.000, 0.000],  // FW_Defensive (Tier 5)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.089, 0.000, 0.089],  // FW Defensive (18% both sides)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.191, 0.283, 0.191],  // FW_Defensive
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.089, 0.283, 0.089],  // FW Defensive: RAtt 0.089, CAtt 0.283, LAtt 0.089
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Forward Towards Wing (Right variant, without overcrowding)
    'FW_TW': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Playmaking: [0.000, 0.000, 0.000, 0.050, 0.000, 0.000, 0.000],  // FW_TW (Tier 7)
        Winger: [0.000, 0.000, 0.000, 0.000, 0.396, 0.000, 0.166],  // FW TW (79% right, 31% left)
        Passing: [0.000, 0.000, 0.000, 0.000, 0.125, 0.125, 0.050],  // FW_TW_Right
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.312, 0.340, 0.125],  // FW TW Right: RAtt 0.312, CAtt 0.340, LAtt 0.125
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    },

    // Forward Technical Defensive (without overcrowding)
    'FW_TD': {
        Keeper: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Defending: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000],
        Playmaking: [0.000, 0.000, 0.000, 0.164, 0.000, 0.000, 0.000],
        Winger: [0.000, 0.000, 0.000, 0.000, 0.103, 0.000, 0.103],
        Passing: [0.000, 0.000, 0.000, 0.000, 0.323, 0.315, 0.323],
        Scoring: [0.000, 0.000, 0.000, 0.000, 0.103, 0.333, 0.103],
        SetPieces: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000]
    }
};

// Position display names
const POSITION_NAMES = {
    'GK': 'Goalkeeper',
    'WB': 'Wingback',
    'WB_TM': 'Wingback (Towards Middle)',
    'WB_O': 'Wingback (Offensive)',
    'WB_D': 'Wingback (Defensive)',
    'CD': 'Central Defender',
    'CD_O': 'Central Defender (Offensive)',
    'CD_TW': 'Central Defender (Towards Wing)',
    'IM': 'Inner Midfielder',
    'IM_O': 'Inner Midfielder (Offensive)',
    'IM_D': 'Inner Midfielder (Defensive)',
    'IM_TW': 'Inner Midfielder (Towards Wing)',
    'W': 'Winger',
    'W_TM': 'Winger (Towards Middle)',
    'W_O': 'Winger (Offensive)',
    'W_D': 'Winger (Defensive)',
    'FW': 'Forward',
    'FW_D': 'Forward (Defensive)',
    'FW_TW': 'Forward (Towards Wing)',
    'FW_TD': 'Forward (Technical Defensive)'
};

// =============================================================================
// TRAINING SPEED FORMULAS
// From training_speed.txt (Workout 2.0)
// =============================================================================

// Training speed coefficients by training type (base percentage per week)
// From Schum data - these are the ORIGINAL correct values
const TRAINING_COEFFICIENTS = {
    GK: 0.0510,     // 5.10%
    Def: 0.0288,    // 2.88%
    PM: 0.0336,     // 3.36%
    Wing: 0.0480,   // 4.80%
    Pass: 0.0360,   // 3.60%
    Score: 0.0324,  // 3.24%
    SP: 0.1470      // 14.70%
};

// Background training coefficients
const BACKGROUND_TRAINING = {
    Def: 0.0048,    // 0.48%
    PM: 0.0042,     // 0.42%
    Wing: 0.0060,   // 0.60%
    Pass: 0.0060,   // 0.60%
    Score: 0.0054   // 0.54%
};

// Coach level coefficients
const COACH_COEFFICIENTS = {
    4: 0.7343,
    5: 0.8324,
    6: 0.9200,
    7: 1.0000,
    8: 1.0375
};

// Assistant sum coefficients (sum of all assistant levels, 0-10)
const ASSISTANT_COEFFICIENTS = {
    0: 1.000,
    1: 1.035,
    2: 1.070,
    3: 1.105,
    4: 1.140,
    5: 1.175,
    6: 1.210,
    7: 1.245,
    8: 1.280,
    9: 1.315,
    10: 1.350
};

/**
 * Calculate the skill level function f(lvl) for training speed
 * @param {number} skillLevel - Current skill level
 * @returns {number} Training speed multiplier
 */
function getSkillLevelMultiplier(skillLevel) {
    if (skillLevel < 9) {
        return 16.289 * Math.exp(-0.1396 * skillLevel);
    } else {
        return (54.676 / skillLevel) - 1.438;
    }
}

/**
 * Calculate DropLevel - skill drop during training at high levels
 * From Schum data: DropLevel = DropL + DropLA
 * 
 * IMPORTANT: Schum uses "calculation scale" where Solid=6 (Excellent=7)
 * Our system uses "display scale" where Solid=7 (Excellent=8)
 * So we need to subtract 1 from our skill level before applying the formula
 * 
 * Formula: DropL = a*L³ + b*L² + c*L + d for L >= 14 (calc scale)
 * In display scale: drops start at level 15 ("titanic" / "kolossalno")
 * For L > 20 (calc scale) / 21 (display): use (L + 0.39) instead of L
 * 
 * @param {number} skillLevel - Current skill level (display scale, Solid=7)
 * @param {number} age - Player age (for DropLA component)
 * @returns {number} Skill drop amount per training week
 */
function getDropLevel(skillLevel, age = 17, trainingType = 'PM') {
    // Skill-specific max levels based on official HT data
    const MAX_SKILL_LEVELS = {
        GK: 22,   // GK can reach 21, caps at 22
        Def: 21,   // Def stops at ~20.8
        PM: 21,   // PM stops at 21
        Wing: 22,   // Wing can reach 21, caps at 22
        Pass: 21,   // Pass stops at ~20.8
        Score: 21,   // Score stops at ~20.8
        SP: 26    // SP can reach 25, caps at 26
    };

    // Skill-specific calibration factors (lower = faster training at high levels)
    // Fine-tuned to match official HT Training Estimator data (iteration 2)
    const CALIBRATION_FACTORS = {
        GK: 0.18,  // 89w → lvl 20 (was 0.27, still -0.29)
        Def: 0.22,  // 169w → lvl 20 (was 0.32, still -0.32)
        PM: 0.50,  // 154w → lvl 20 ✓
        Wing: 0.20,  // 96w → lvl 20 (was 0.28, still -0.23)
        Pass: 0.45,  // 140w → lvl 20 ✓
        Score: 0.48,  // 163w → lvl 20 ✓
        SP: 0.08   // 29w → lvl 20 (was 0.17, still -0.41)
    };

    const maxLevel = MAX_SKILL_LEVELS[trainingType] || 21;
    const calibrationFactor = CALIBRATION_FACTORS[trainingType] || 0.50;

    // Hard cap at max level - training completely stops
    if (skillLevel >= maxLevel) {
        return 1.0;
    }

    // Convert from display scale (Solid=7) to calculation scale (Solid=6)
    const L_calc = skillLevel - 1;

    // Skill-specific drop start thresholds (calc scale) to balance lvl 20 vs 21 accuracy
    const DROP_START_THRESHOLDS = {
        GK: 15,   // Start drops later for fast skills (display 16)
        Wing: 15,   // Start drops later for fast skills (display 16)
        SP: 17,   // SP starts drops even later (display 18)
        // All others default to 14 (display 15)
    };
    const dropStartLevel = DROP_START_THRESHOLDS[trainingType] || 14;

    // In calculation scale, drops start at skill-specific threshold
    if (L_calc < dropStartLevel) {
        return 0;
    }

    // DropL coefficients from Schum (for calculation scale)
    const a = 0.000006111;
    const b = 0.000808;
    const c = -0.026017;
    const d = 0.192775;

    // For levels above 20 (calc scale), add 0.39 to the level
    let L = L_calc;
    if (L > 20) {
        L = L + 0.39;
    }

    // Calculate theoretical DropL with skill-specific calibration
    const theoreticalDropL = a * Math.pow(L, 3) + b * Math.pow(L, 2) + c * L + d;
    let dropL = theoreticalDropL * calibrationFactor;

    // POST-LEVEL-20 SLOWDOWN: Additional multiplier to slow training after level 20
    // This addresses the overshoot at level 21+ for all skills
    // Training slows dramatically after lvl 20 to approach the skill cap
    if (skillLevel > 20) {
        // Progressive slowdown: more aggressive as skill approaches max
        const levelAbove20 = skillLevel - 20;
        const slowdownMultiplier = 1 + (levelAbove20 * 3.0);  // 1x at 20, 4x at 21, 7x at 22...
        dropL = dropL * slowdownMultiplier;
    }

    // DropLA (age-based additional drop) for players 31+
    let dropLA = 0;
    if (age >= 31) {
        const dropLACoeffs = {
            31: { m: 0.00031, n: -0.00434 },
            32: { m: 0.00118, n: -0.01625 },
            33: { m: 0.00264, n: -0.03551 },
            34: { m: 0.00468, n: -0.06086 },
            35: { m: 0.00732, n: -0.09104 },
            36: { m: 0.01066, n: -0.12554 },
            37: { m: 0.01460, n: -0.16021 }
        };
        const ageKey = Math.min(Math.floor(age), 37);
        const coeffs = dropLACoeffs[ageKey];
        if (coeffs) {
            let levelForDropLA = L_calc;
            if (L_calc > 20) {
                levelForDropLA = L_calc + 1;
            }
            dropLA = coeffs.m * levelForDropLA + coeffs.n;
        }
    }

    return Math.max(0, dropL + dropLA);
}

/**
 * Calculate age coefficient K(age) = 54 / (Age + 37)
 * @param {number} age - Player age (e.g., 17.5 for 17 years 8 weeks)
 * @returns {number} Age coefficient
 */
function getAgeCoefficient(age) {
    return 54 / (age + 37);
}

/**
 * Calculate weekly skill gain from training
 * T = f(lvl) * K(coach) * K(assist) * K(int) * K(stam) * K(train) * K(age) * K(time)
 * 
 * From Schum: Training = T - DropLevel, Training >= 0
 * 
 * @param {number} currentSkill - Current skill level
 * @param {string} trainingType - Training type (GK, Def, PM, Wing, Pass, Score, SP)
 * @param {number} age - Player age
 * @param {Object} params - Training parameters
 * @returns {number} Weekly skill gain (capped at 1.0, never negative)
 */
function calculateWeeklySkillGain(currentSkill, trainingType, age, params = {}) {
    const {
        coachLevel = 7,
        assistantSum = 10,
        intensity = 100,
        staminaShare = 5,
        playingTime = 1.0,  // 1.0 = full slot 90min, 0.5 = half slot
        trainingSpeedMultiplier = 1.0 // Bonus multiplier (e.g., 1.25 for GK SP)
    } = params;

    const f_lvl = getSkillLevelMultiplier(currentSkill);
    const k_coach = COACH_COEFFICIENTS[coachLevel] || 1.0;
    const k_assist = ASSISTANT_COEFFICIENTS[assistantSum] || 1.0;
    const k_int = intensity / 100;
    const k_stam = 1 - (staminaShare / 100);
    const k_train = TRAINING_COEFFICIENTS[trainingType] || 0;
    const k_age = getAgeCoefficient(age);
    const k_time = playingTime;

    // Raw training gain
    const T = f_lvl * k_coach * k_assist * k_int * k_stam * k_train * k_age * k_time * trainingSpeedMultiplier;

    // Apply DropLevel (skill drops at high levels, skill-specific)
    const dropLevel = getDropLevel(currentSkill, age, trainingType);

    // Training = T - DropLevel, but never negative, and capped at 1.0
    const gain = Math.max(0, T - dropLevel);

    return Math.min(gain, 1.0);
}

/**
 * Simulate training over multiple weeks
 * @param {number} startSkill - Starting skill level
 * @param {string} trainingType - Training type
 * @param {number} startAge - Starting age
 * @param {number} weeks - Number of weeks
 * @param {Object} params - Training parameters
 * @returns {number} Final skill level
 */
function simulateTraining(startSkill, trainingType, startAge, weeks, params = {}) {
    let skill = startSkill;
    let age = startAge;

    for (let i = 0; i < weeks; i++) {
        const gain = calculateWeeklySkillGain(skill, trainingType, age, params);
        skill += gain;
        age += 1 / 16; // 1 week = 1/16 of a year (16 weeks per season)
    }

    return skill;
}

// =============================================================================
// SKILL SCORE CALCULATION
// SS = W * P * (s - 1)
// =============================================================================

/**
 * Calculate normalized weights from user input
 * @param {Object} userWeights - User weight inputs
 * @returns {Array} Normalized weight vector [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
 */
function calculateWeights(userWeights) {
    const {
        defLeft = 1, defCenter = 1, defRight = 1,
        mid = 1,
        attLeft = 1, attCenter = 1, attRight = 1
    } = userWeights;

    const total = defLeft + defCenter + defRight + mid + attLeft + attCenter + attRight;
    if (total === 0) return [0, 0, 0, 0, 0, 0, 0];

    return [
        defRight / total,   // RDef
        defCenter / total,  // CDef
        defLeft / total,    // LDef
        mid / total,        // Mid
        attRight / total,   // RAtt
        attCenter / total,  // CAtt
        attLeft / total     // LAtt
    ];
}
/**
 * Calculate Skill Score for a position given skills and weights
 * SS = Σ(effectiveWeight × Σ(contribution × (skillValue - 1)))
 * 
 * Base multipliers are applied ON TOP of user weights:
 * - Midfield has a base 3x multiplier (PM_weight=3 from HT_U21.ipynb)
 * - User weight 10 → effective weight 30
 * 
 * @param {string} position - Position key (e.g., 'IM', 'CD_O')
 * @param {Object} skills - Player skills {Keeper, Defending, Playmaking, Winger, Passing, Scoring, SetPieces}
 * @param {Array} weights - Weight vector [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
 * @returns {number} Skill Score
 */
function calculateSkillScore(position, skills, weights) {
    const P = CONTRIBUTION_MATRICES[position];
    if (!P) return 0;

    // Base sector multipliers (applied on top of user weights)
    // Index: [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
    const BASE_SECTOR_MULTIPLIERS = [1, 1, 1, 3, 1, 1, 1];  // Midfield gets 3x

    let score = 0;

    // For each sector (weighted)
    for (let sectorIdx = 0; sectorIdx < 7; sectorIdx++) {
        const userWeight = weights[sectorIdx];
        if (userWeight === 0) continue;

        // Apply base multiplier on top of user weight
        const effectiveWeight = userWeight * BASE_SECTOR_MULTIPLIERS[sectorIdx];

        // Sum contributions from all skills to this sector
        let sectorContribution = 0;
        for (const skillName of SKILLS) {
            const skillValue = skills[skillName] || 1;
            const contribution = P[skillName]?.[sectorIdx] || 0;
            sectorContribution += contribution * (skillValue - 1);
        }

        score += effectiveWeight * sectorContribution;
    }

    return score;
}

/**
 * Calculate marginal value of training a skill for one week
 * @param {string} position - Position key
 * @param {Object} currentSkills - Current player skills
 * @param {string} trainingType - Training type to test
 * @param {number} age - Current age
 * @param {Array} weights - Sector weights
 * @param {Object} params - Training parameters
 * @returns {Object} {gain: skill gain, scoreDelta: SS improvement}
 */
function calculateMarginalValue(position, currentSkills, trainingType, age, weights, params) {
    const skillName = getSkillNameFromTrainingType(trainingType);
    const currentSkill = currentSkills[skillName] || 1;

    // Calculate skill gain for one week
    const skillGain = calculateWeeklySkillGain(currentSkill, trainingType, age, params);

    // Create new skills object with the gain
    const newSkills = { ...currentSkills };
    newSkills[skillName] = currentSkill + skillGain;

    // Calculate score delta
    const currentScore = calculateSkillScore(position, currentSkills, weights);
    const newScore = calculateSkillScore(position, newSkills, weights);

    return {
        trainingType,
        skillName,
        skillGain,
        scoreDelta: newScore - currentScore,
        newSkillLevel: newSkills[skillName]
    };
}

/**
 * Map training type to skill name
 */
function getSkillNameFromTrainingType(trainingType) {
    const mapping = {
        'GK': 'Keeper',
        'Def': 'Defending',
        'PM': 'Playmaking',
        'Wing': 'Winger',
        'Pass': 'Passing',
        'Score': 'Scoring',
        'SP': 'SetPieces'
    };
    return mapping[trainingType];
}

// =============================================================================
// GREEDY OPTIMIZATION ALGORITHM
// =============================================================================

/**
 * Find optimal training path using greedy algorithm
 * @param {string} position - Position to optimize for
 * @param {Object} startingSkills - Starting skill levels
 * @param {number} startingAge - Starting age
 * @param {number} weeks - Number of training weeks
 * @param {Array} weights - Sector weights
 * @param {Object} params - Training parameters
 * @returns {Object} Optimization result with training path and final skills
 */
function optimizeTraining(position, startingSkills, startingAge, weeks, weights, params = {}) {
    // Determine which training types are relevant for this position
    const relevantTraining = getRelevantTrainingTypes(position);

    let currentSkills = { ...startingSkills };
    let currentAge = startingAge;
    const trainingPath = [];

    // SP Training Logic for GK (Train SP first with bonus)
    const trainSpForGk = (position === 'GK' && params.trainSpForGk);
    let spWeeks = 0;

    if (trainSpForGk) {
        console.log(`[TrainingData] Optimizing GK with SP training first. Target: ${params.targetSpLevel}`);
        const targetSp = params.targetSpLevel || 20;
        // Optimization: Pre-calculate Weeks needed for SP with 25% bonus
        const spParam = { ...params, trainingSpeedMultiplier: 1.25 }; // Add multiplier support to weekly gain

        // Simulate SP training until target is reached
        let tempSp = startingSkills.SetPieces || 5;
        let tempAge = startingAge;

        while (tempSp < targetSp && spWeeks < weeks) {
            const gain = calculateWeeklySkillGain(tempSp, 'SP', tempAge, spParam);
            tempSp += gain;
            tempAge += 1 / 16;
            spWeeks++;
        }
        console.log(`[TrainingData] SP Weeks Required: ${spWeeks}, Final SP: ${tempSp.toFixed(2)}`);

        // Update starting state for the greedy optimization
        currentSkills.SetPieces = tempSp;
        currentAge += spWeeks / 16;
        currentSkills.SetPieces = tempSp;
        currentAge += spWeeks / 16;
    }

    // CD SP Training Logic
    const trainSpForCd = (position.startsWith('CD') && params.trainSpForCd);
    let spCdWeeks = 0;

    if (trainSpForCd) {
        console.log(`[TrainingData] Optimizing CD with SP training. Target: ${params.targetSpCdLevel}`);
        const targetSp = params.targetSpCdLevel || 20;
        const spParam = { ...params }; // Standard speed

        let tempSp = startingSkills.SetPieces || 5;
        let tempAge = currentAge;

        while (tempSp < targetSp && (spWeeks + spCdWeeks) < weeks) {
            const gain = calculateWeeklySkillGain(tempSp, 'SP', tempAge, spParam);
            tempSp += gain;
            tempAge += 1 / 16;
            spCdWeeks++;
        }
        console.log(`[TrainingData] CD SP Weeks Required: ${spCdWeeks}, Final SP: ${tempSp.toFixed(2)}`);

        currentSkills.SetPieces = tempSp;
        currentAge += spCdWeeks / 16;
    }

    // WB SP Training Logic
    const trainSpForWb = (position.startsWith('WB') && params.trainSpForWb);
    let spWbWeeks = 0;

    if (trainSpForWb) {
        console.log(`[TrainingData] Optimizing WB with SP training. Target: ${params.targetSpWbLevel}`);
        const targetSp = params.targetSpWbLevel || 20;
        const spParam = { ...params }; // Standard speed

        let tempSp = startingSkills.SetPieces || 5;
        let tempAge = currentAge;

        while (tempSp < targetSp && (spWeeks + spCdWeeks + spWbWeeks) < weeks) {
            const gain = calculateWeeklySkillGain(tempSp, 'SP', tempAge, spParam);
            tempSp += gain;
            tempAge += 1 / 16;
            spWbWeeks++;
        }
        console.log(`[TrainingData] WB SP Weeks Required: ${spWbWeeks}, Final SP: ${tempSp.toFixed(2)}`);

        currentSkills.SetPieces = tempSp;
        currentAge += spWbWeeks / 16;
    }

    // Defender Passing Logic
    // Fix: Use startsWith to include variants like WB_TM, CD_TW etc.
    const trainPassForDef = ((position.startsWith('CD') || position.startsWith('WB')) && params.trainPassForDef);
    let passWeeks = 0;

    if (trainPassForDef) {
        console.log(`[TrainingData] Optimizing ${position} with Passing training first. Target: ${params.targetPassLevel}`);
        const targetPass = params.targetPassLevel || 15;
        // No special bonus for passing (standard speed)
        const passParam = { ...params };

        let tempPass = startingSkills.Passing || 5;
        let tempAge = currentAge; // Start specifically after SP (if any)

        while (tempPass < targetPass && (spWeeks + spCdWeeks + spWbWeeks + passWeeks) < weeks) {
            const gain = calculateWeeklySkillGain(tempPass, 'Pass', tempAge, passParam);
            tempPass += gain;
            tempAge += 1 / 16;
            passWeeks++;
        }
        console.log(`[TrainingData] Passing Weeks Required: ${passWeeks}, Final Passing: ${tempPass.toFixed(2)}`);

        // Update starting state for the greedy optimization
        currentSkills.Passing = tempPass;
        currentAge += passWeeks / 16;
    }

    // Scoring Training Logic (Defenders)
    const trainScoreForDef = ((position.startsWith('CD') || position.startsWith('WB')) && params.trainScoreForDef);
    let scoreWeeks = 0;

    if (trainScoreForDef) {
        console.log(`[TrainingData] Optimizing ${position} with Scoring training (Def). Target: ${params.targetScoreDefLevel}`);
        const targetScore = params.targetScoreDefLevel || 15;
        const scoreParam = { ...params };

        let tempScore = startingSkills.Scoring || 5;
        let tempAge = currentAge;

        while (tempScore < targetScore && (spWeeks + spCdWeeks + spWbWeeks + passWeeks + scoreWeeks) < weeks) {
            const gain = calculateWeeklySkillGain(tempScore, 'Score', tempAge, scoreParam);
            tempScore += gain;
            tempAge += 1 / 16;
            scoreWeeks++;
        }
        console.log(`[TrainingData] Def Scoring Weeks Required: ${scoreWeeks}, Final Scoring: ${tempScore.toFixed(2)}`);

        currentSkills.Scoring = tempScore;
        currentAge += scoreWeeks / 16;
    }

    // Scoring Training Logic (Midfielders)
    // Note: Winger (W) is a midfielder for this purpose, but Wingback (WB) is a defender.
    const isMidfielder = position.startsWith('IM') || (position.startsWith('W') && !position.startsWith('WB'));
    const trainScoreForMid = (isMidfielder && params.trainScoreForMid);

    if (trainScoreForMid) {
        console.log(`[TrainingData] Optimizing ${position} with Scoring training (Mid). Target: ${params.targetScoreMidLevel}`);
        const targetScore = params.targetScoreMidLevel || 15;
        const scoreParam = { ...params };

        let tempScore = startingSkills.Scoring || 5;
        let tempAge = currentAge;

        while (tempScore < targetScore && (spWeeks + spCdWeeks + spWbWeeks + passWeeks + scoreWeeks) < weeks) {
            const gain = calculateWeeklySkillGain(tempScore, 'Score', tempAge, scoreParam);
            tempScore += gain;
            tempAge += 1 / 16;
            scoreWeeks++;
        }
        console.log(`[TrainingData] Mid Scoring Weeks Required: ${scoreWeeks}, Final Scoring: ${tempScore.toFixed(2)}`);

        currentSkills.Scoring = tempScore;
        currentAge += scoreWeeks / 16;
    }    // Mid/Fwd SP Logic
    // Note: Winger (W) is considered Mid/Fwd here.
    const isMidFwd = position.startsWith('IM') || (position.startsWith('W') && !position.startsWith('WB')) || position.startsWith('FW');
    const trainSpForMidFwd = (isMidFwd && params.trainSpForMidFwd);
    let spMidFwdWeeks = 0;

    if (trainSpForMidFwd) {
        console.log(`[TrainingData] Optimizing Mid/Fwd SP. Target: ${params.targetMidFwdSpLevel}`);
        const targetSp = params.targetMidFwdSpLevel || 15;
        // Standard speed (no bonus)
        const spParam = { ...params };

        let tempSp = startingSkills.SetPieces || 5;
        let tempAge = currentAge;

        while (tempSp < targetSp && (spWeeks + spCdWeeks + spWbWeeks + passWeeks + scoreWeeks + spMidFwdWeeks) < weeks) {
            const gain = calculateWeeklySkillGain(tempSp, 'SP', tempAge, spParam);
            tempSp += gain;
            tempAge += 1 / 16;
            spMidFwdWeeks++;
        }
        console.log(`[TrainingData] Mid/Fwd SP Weeks Required: ${spMidFwdWeeks}, Final SP: ${tempSp.toFixed(2)}`);

        currentSkills.SetPieces = tempSp;
        currentAge += spMidFwdWeeks / 16;
    }

    const availableWeeks = weeks - spWeeks - spCdWeeks - spWbWeeks - passWeeks - scoreWeeks - spMidFwdWeeks;

    for (let week = 0; week < availableWeeks; week++) {
        let bestTraining = null;
        let bestValue = -Infinity;

        // Test each relevant training type
        for (const trainingType of relevantTraining) {
            const result = calculateMarginalValue(
                position, currentSkills, trainingType, currentAge, weights, params
            );

            if (result.scoreDelta > bestValue) {
                bestValue = result.scoreDelta;
                bestTraining = result;
            }
        }

        if (bestTraining) {
            // Apply the best training
            currentSkills[bestTraining.skillName] = bestTraining.newSkillLevel;
            currentSkills[bestTraining.skillName] = bestTraining.newSkillLevel;
            trainingPath.push({
                week: week + 1 + spWeeks + spCdWeeks + spWbWeeks + passWeeks + scoreWeeks + spMidFwdWeeks, // Offset by all prior phases
                training: bestTraining.trainingType,
                skillGain: bestTraining.skillGain,
                scoreDelta: bestTraining.scoreDelta
            });
        }

        currentAge += 1 / 16;
    }

    // Construct prioritized path segments
    const priorPaths = [];

    // 1. GK SP
    if (spWeeks > 0) {
        let gkSkill = startingSkills.SetPieces || 5;
        let gkAge = startingAge;
        const gkParam = { ...params, trainingSpeedMultiplier: 1.25 };
        for (let i = 0; i < spWeeks; i++) {
            const gain = calculateWeeklySkillGain(gkSkill, 'SP', gkAge, gkParam);
            priorPaths.push({
                week: i + 1,
                training: 'SP',
                skillGain: gain,
                scoreDelta: 0
            });
            gkSkill += gain;
            gkAge += 1 / 16;
        }
    }

    // 2. CD SP
    if (spCdWeeks > 0) {
        let cdSkill = startingSkills.SetPieces || 5;
        let cdAge = startingAge + (spWeeks / 16);
        const cdParam = { ...params };

        for (let i = 0; i < spCdWeeks; i++) {
            const gain = calculateWeeklySkillGain(cdSkill, 'SP', cdAge, cdParam);
            priorPaths.push({
                week: priorPaths.length + 1,
                training: 'SP',
                skillGain: gain,
                scoreDelta: 0
            });
            cdSkill += gain;
            cdAge += 1 / 16;
        }
    }

    // 3. WB SP
    if (spWbWeeks > 0) {
        let wbSkill = startingSkills.SetPieces || 5;
        let wbAge = startingAge + ((spWeeks + spCdWeeks) / 16);
        const wbParam = { ...params };
        for (let i = 0; i < spWbWeeks; i++) {
            const gain = calculateWeeklySkillGain(wbSkill, 'SP', wbAge, wbParam);
            priorPaths.push({
                week: priorPaths.length + 1,
                training: 'SP',
                skillGain: gain,
                scoreDelta: 0
            });
            wbSkill += gain;
            wbAge += 1 / 16;
        }
    }

    // 4. Passing (Def)
    if (passWeeks > 0) {
        let passSkill = startingSkills.Passing || 5;
        let passAge = startingAge + ((spWeeks + spCdWeeks + spWbWeeks) / 16);
        const passParam = { ...params };
        for (let i = 0; i < passWeeks; i++) {
            const gain = calculateWeeklySkillGain(passSkill, 'Pass', passAge, passParam);
            priorPaths.push({
                week: priorPaths.length + 1,
                training: 'Pass',
                skillGain: gain,
                scoreDelta: 0
            });
            passSkill += gain;
            passAge += 1 / 16;
        }
    }

    // 5. Scoring (Def/Mid)
    if (scoreWeeks > 0) {
        let scoreSkill = startingSkills.Scoring || 5;
        let scoreAge = startingAge + ((spWeeks + spCdWeeks + spWbWeeks + passWeeks) / 16);
        const scoreParam = { ...params };
        for (let i = 0; i < scoreWeeks; i++) {
            const gain = calculateWeeklySkillGain(scoreSkill, 'Score', scoreAge, scoreParam);
            priorPaths.push({
                week: priorPaths.length + 1,
                training: 'Score',
                skillGain: gain,
                scoreDelta: 0
            });
            scoreSkill += gain;
            scoreAge += 1 / 16;
        }
    }

    // 6. Mid/Fwd SP
    if (spMidFwdWeeks > 0) {
        let midFwdSkill = startingSkills.SetPieces || 5;
        // Start age: after all above
        let midFwdAge = startingAge + ((spWeeks + spCdWeeks + spWbWeeks + passWeeks + scoreWeeks) / 16);
        const midFwdParam = { ...params };
        for (let i = 0; i < spMidFwdWeeks; i++) {
            const gain = calculateWeeklySkillGain(midFwdSkill, 'SP', midFwdAge, midFwdParam);
            priorPaths.push({
                week: priorPaths.length + 1,
                training: 'SP',
                skillGain: gain,
                scoreDelta: 0
            });
            midFwdSkill += gain;
            midFwdAge += 1 / 16;
        }
    }

    // Combine paths
    // Note: The 'week' property in trainingPath (greedy) was already offset by ALL prioritized weeks.
    // So we just prepend priorPaths.
    trainingPath.unshift(...priorPaths);

    const finalScore = calculateSkillScore(position, currentSkills, weights);

    return {
        position,
        positionName: POSITION_NAMES[position],
        startingSkills,
        finalSkills: currentSkills,
        finalScore,
        trainingPath,
        trainingSummary: summarizeTrainingPath(trainingPath)
    };
}

/**
 * Get training types relevant for a position
 */
function getRelevantTrainingTypes(position) {
    const P = CONTRIBUTION_MATRICES[position];
    const relevant = new Set();

    // Check which skills have non-zero contributions
    if (hasContribution(P, 'Keeper')) relevant.add('GK');
    if (hasContribution(P, 'Defending')) relevant.add('Def');
    if (hasContribution(P, 'Playmaking')) relevant.add('PM');
    if (hasContribution(P, 'Winger')) relevant.add('Wing');
    if (hasContribution(P, 'Passing')) relevant.add('Pass');
    if (hasContribution(P, 'Scoring')) relevant.add('Score');
    // SetPieces usually not relevant for rating optimization

    return Array.from(relevant);
}

/**
 * Check if a skill has any contribution for a position
 */
function hasContribution(matrix, skillName) {
    const contributions = matrix[skillName];
    if (!contributions) return false;
    return contributions.some(v => v > 0);
}

/**
 * Summarize training path into counts
 */
function summarizeTrainingPath(path) {
    const counts = {};
    for (const entry of path) {
        counts[entry.training] = (counts[entry.training] || 0) + 1;
    }
    return counts;
}

// =============================================================================
// POSITION VARIANT SELECTION
// Auto-select variant that maximizes Skill Score based on weights
// =============================================================================

/**
 * Available variants for each base position
 */
const POSITION_VARIANTS = {
    'GK': ['GK'],
    'WB': ['WB', 'WB_TM', 'WB_O', 'WB_D'],
    'CD': ['CD', 'CD_O', 'CD_TW'],
    'IM': ['IM', 'IM_O', 'IM_D', 'IM_TW'],
    'W': ['W', 'W_TM', 'W_O', 'W_D'],
    'FW': ['FW', 'FW_D', 'FW_TW', 'FW_TD']
};

/**
 * Find the optimal position variant that maximizes Skill Score
 * @param {string} basePosition - Base position code (GK, WB, CD, IM, W, FW)
 * @param {string} side - Position side (Left, Middle, Right)
 * @param {Object} skills - Player skills {Keeper, Defending, ...}
 * @param {Array} weights - Normalized weight vector [RDef, CDef, LDef, Mid, RAtt, CAtt, LAtt]
 * @param {boolean} allowTDF - Whether to allow Technical Defensive Forwards (default true)
 * @returns {Object} { variant: optimal variant code, score: skill score }
 */
function findOptimalVariant(basePosition, side, skills, weights, allowTDF = true) {
    const variants = POSITION_VARIANTS[basePosition] || [basePosition];

    // GK has no variants
    if (variants.length === 1) {
        return { variant: basePosition, score: calculateSkillScore(basePosition, skills, weights) };
    }

    let bestVariant = basePosition;
    let bestScore = -Infinity;

    for (const variant of variants) {
        // Skip TDF if disabled
        if (!allowTDF && variant === 'FW_TD') {
            continue;
        }

        // Skip positional variants that don't make sense for the side
        // CD_TW is "towards wing" - only makes sense on Left/Right CD slots
        // IM_TW is "towards wing" - only makes sense on Left/Right IM slots
        // FW_TW is "towards wing" - only makes sense on Left/Right FW slots
        if (variant.endsWith('_TW') && side === 'Middle') {
            continue; // Skip towards-wing variants for middle positions
        }

        const score = calculateSkillScore(variant, skills, weights);
        if (score > bestScore) {
            bestScore = score;
            bestVariant = variant;
        }
    }

    return { variant: bestVariant, score: bestScore };
}

/**
 * Optimize training for all positions and return sorted resultscore
 * @param {Object} startingSkills - Starting skill levels
 * @param {number} startingAge - Starting age
 * @param {number} weeks - Number of training weeks
 * @param {Object} userWeights - User sector weights
 * @param {Object} params - Training parameters
 */
function optimizeAllPositions(startingSkills, startingAge, weeks, userWeights, params = {}) {
    const weights = calculateWeights(userWeights);
    const results = [];

    for (const position of Object.keys(CONTRIBUTION_MATRICES)) {
        const result = optimizeTraining(position, startingSkills, startingAge, weeks, weights, params);
        results.push(result);
    }

    // Sort by final score descending
    results.sort((a, b) => b.finalScore - a.finalScore);

    return results;
}

// Export for use in HTML
if (typeof window !== 'undefined') {
    window.TrainingData = {
        SKILLS,
        SECTORS,
        TRAINING_TYPES,
        CONTRIBUTION_MATRICES,
        POSITION_NAMES,
        POSITION_VARIANTS,
        TRAINING_COEFFICIENTS,
        COACH_COEFFICIENTS,
        ASSISTANT_COEFFICIENTS,
        calculateWeights,
        calculateSkillScore,
        calculateWeeklySkillGain,
        simulateTraining,
        optimizeTraining,
        optimizeAllPositions,
        findOptimalVariant,
        getSkillLevelMultiplier,
        getAgeCoefficient
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SKILLS,
        SECTORS,
        TRAINING_TYPES,
        CONTRIBUTION_MATRICES,
        POSITION_NAMES,
        POSITION_VARIANTS,
        TRAINING_COEFFICIENTS,
        COACH_COEFFICIENTS,
        ASSISTANT_COEFFICIENTS,
        calculateWeights,
        calculateSkillScore,
        calculateWeeklySkillGain,
        simulateTraining,
        optimizeTraining,
        optimizeAllPositions,
        findOptimalVariant,
        getSkillLevelMultiplier,
        getAgeCoefficient
    };
}
