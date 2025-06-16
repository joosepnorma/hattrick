// --- Full Hattrick Simulator Engine in JavaScript ---
        
export const TACTIC_RATES = { CA: { 1: 0.01, 2: 0.02, 3: 0.03, 4: 0.05, 5: 0.06, 6: 0.07, 7: 0.10, 8: 0.07, 9: 0.11, 10: 0.13, 11: 0.16, 12: 0.19, 13: 0.22, 14: 0.25, 15: 0.29, 16: 0.32, 17: 0.34, 18: 0.35, 19: 0.37, 20: 0.38, 21: 0.39, 22: 0.41, 23: 0.42, 24: 0.43, 25: 0.43, 26: 0.43, 27: 0.44, 28: 0.43, 29: 0.45, 30: 0.47 }, Pressing: { 1: 0.01, 2: 0.02, 3: 0.03, 4: 0.04, 5: 0.05, 6: 0.06, 7: 0.08, 8: 0.10, 9: 0.12, 10: 0.15, 11: 0.17, 12: 0.19, 13: 0.22, 14: 0.25, 15: 0.28, 16: 0.32, 17: 0.36, 18: 0.40, 19: 0.45, 20: 0.50 }, LS_Conv: { 2: 0.05, 5: 0.05, 6: 0.06, 7: 0.06, 8: 0.09, 9: 0.15, 10: 0.14, 11: 0.16, 12: 0.16, 13: 0.19, 14: 0.18, 15: 0.20, 16: 0.20, 17: 0.20, 18: 0.21, 19: 0.22, 20: 0.24, 21: 0.24, 22: 0.25, 23: 0.25, 24: 0.25, 25: 0.27, 26: 0.26, 27: 0.28, 29: 0.33 }, LS_Goal: { 2: 0.039, 3: 0.050, 4: 0.065, 5: 0.088, 6: 0.108, 7: 0.138, 8: 0.162, 9: 0.184, 10: 0.226, 11: 0.257, 12: 0.292, 13: 0.336, 14: 0.378, 15: 0.417, 16: 0.463, 17: 0.520, 18: 0.557, 19: 0.595, 20: 0.610, 21: 0.629, 22: 0.649, 23: 0.662, 24: 0.692, 25: 0.684, 26: 0.682, 27: 0.684, 28: 0.644, 29: 0.809, 30: 0.800 } };
const BASELINE_CA_RATE = TACTIC_RATES['CA'][18];
const CA_DYNAMIC_RATES = [ [0.34, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.44, 0.23, 0.0, 0.0, 0.0, 0.0, 0.0], [0.49, 0.31, 0.19, 0.0, 0.0, 0.0, 0.0], [0.50, 0.34, 0.18, 0.14, 0.0, 0.0, 0.0], [0.50, 0.35, 0.29, 0.13, 0.11, 0.0, 0.0], [0.49, 0.39, 0.33, 0.19, 0.09, 0.0, 0.0], [0.42, 0.41, 0.34, 0.26, 0.1, 0.13, 0.0], [0.49, 0.45, 0.36, 0.31, 0.2, 0.08, 0.0] ];
const AOW_DYNAMIC_RATES = {14: [0.49,0.23,0.15,0.50,0.50], 16: [0.58,0.32,0.17,0.15,0.00], 18: [0.63,0.33,0.25,0.21,0.11], 20: [0.69,0.33,0.21,0.21,0.25], 22: [0.73,0.37,0.22,0.19,0.27], 24: [0.71,0.37,0.23,0.18,0.00], 26: [0.72,0.39,0.24,0.23,0.00], 28: [0.73,0.44,0.27,0.24,0.00], 30: [0.70,0.49,0.29,0.25,0.00]};
const AIM_DYNAMIC_RATES = {18: [0.43,0.23,0.19,0.11], 20: [0.48,0.23,0.12,0.00], 22: [0.51,0.26,0.20,0.06], 24: [0.52,0.26,0.18,0.10], 26: [0.54,0.29,0.19,0.15], 28: [0.55,0.31,0.16,0.06], 30: [0.54,0.29,0.22,0.22]};
const SE_XG_RATES = {
    'Quick_off': 0.36,        // Updated from Quick_Off 36%
    'Head_off': 0.36,         // Updated from Head_Off 36%
    'Tech_off': 0.33,         // Updated from Tech_Off 33%
    'Unpr_IM': 0.26,          // Updated from Unpr_IM 26%
    'Unpr_FW_W': 0.27,        // Updated from Unpr_FW_W 27%
    'Quick_def': 0.0,         // From QuickStop GoalConv 0.0%
    'Head_def': 0.47,         // Updated from Head_Def 47%
    'Unpr_def': 0.37,         // Updated from Unpr_Def 37% (attacker scores)
    'Tech_def': 0.0,          // No data for defender scoring, assumed 0.0%
    'PNF': 0.60,              // Unchanged
    'PDIM': 0.15,             // Unchanged
    'Corner': 0.39,           // Updated from CornerAnyone 39%
    'Experienced Fwd': 0.219, // From ExperienceFwd GoalConv 21.9%
    'Inexperienced Def': -0.107,// From InexpDef GoalConv 10.7% (negative as defender has SE, attacker scores)
    'Tired Def': 0.0          // Unchanged
};
// Add a placeholder XG for AnyPlayer if it's a new generic event type
SE_XG_RATES['NonSpecSE_XG'] = 0.52; // Updated from NonSpecSE 52%

const SE_GENERATION_CHANCE_PER_SLOT = 0.05;
const MAX_SE_PER_NORMAL_GAME_DEFAULT = 5;
const MAX_SE_PER_ET_PERIOD = 2; // Cap for extra time SEs

const SE_EVENT_WEIGHTS_CONFIG = {
    'Head_Off':    { initial_players: 0,  weight_per_player: 12 },
    'Head_Def':    { initial_players: 0,  weight_per_player: 5  },
    'Quick_Off':   { initial_players: 0,  weight_per_player: 21 },
    'Tech_Off':    { initial_players: 0,  weight_per_player: 10 },
    'Unpr_Def':    { initial_players: 0,  weight_per_player: 13 },
    'Unpr_IM':     { initial_players: 0,  weight_per_player: 10 },
    'Unpr_FW_W':   { initial_players: 0,  weight_per_player: 11 },
    'CornerAnyone':{ initial_players: 1, weight_per_player: 40 },
    'NonSpecSE':   { initial_players: 1, weight_per_player: 20 }
};

// Mapping from SE_EVENT_WEIGHTS_CONFIG keys to SE_XG_RATES keys and specialty keys (used in home_specs/away_specs)
const SE_KEY_MAPPINGS = {
    'Head_Off':     { xg_key: 'Head_off', spec_key: 'Head_off' },
    'Head_Def':     { xg_key: 'Head_def', spec_key: 'Head_def' },
    'Quick_Off':    { xg_key: 'Quick_off', spec_key: 'Quick_off' },
    'Tech_Off':     { xg_key: 'Tech_off', spec_key: 'Tech_off' },
    'Unpr_Def':     { xg_key: 'Unpr_def', spec_key: 'Unpr_def' },
    'Unpr_IM':      { xg_key: 'Unpr_IM', spec_key: 'Unpr_IM' },
    'Unpr_FW_W':    { xg_key: 'Unpr_FW_W', spec_key: 'Unpr_FW_W' },
    'CornerAnyone': { xg_key: 'Corner', spec_key: 'Corner' },
    'NonSpecSE':    { xg_key: 'NonSpecSE_XG', spec_key: 'NonSpecSE_Spec' } // 'NonSpecSE_Spec' is a placeholder
};

const SE_TIMING_PROBABILITY = [0.042, 0.048, 0.053, 0.057, 0.068, 0.079, 0.084, 0.038, 0.034, 0.043, 0.050, 0.057, 0.062, 0.050, 0.045];
const IFK_CONVERSION_RATES = { "-23": 0.0, "-22": 0.002, "-21": 0.004, "-20": 0.002, "-19": 0.015, "-18": 0.026, "-17": 0.042, "-16": 0.037, "-15": 0.075, "-14": 0.075, "-13": 0.088, "-12": 0.107, "-11": 0.119, "-10": 0.145, "-9": 0.16, "-8": 0.178, "-7": 0.175, "-6": 0.213, "-5": 0.231, "-4": 0.262, "-3": 0.276, "-2": 0.316, "-1": 0.394, "0": 0.455, "1": 0.541, "2": 0.589, "3": 0.63, "4": 0.672, "5": 0.682, "6": 0.685, "7": 0.728, "8": 0.729, "9": 0.765, "10": 0.781, "11": 0.776, "12": 0.793, "13": 0.841, "14": 0.824, "15": 0.859, "16": 0.839, "17": 0.906, "18": 0.912, "19": 0.929, "20": 0.93, "21": 0.959, "22": 0.896, "23": 0.891, "24": 0.926, "25": 0.875, "26": 0.889, "27": 0.928 };
const PK_CONVERSION_RATES = { 8: 0.74, 9: 0.57, 10: 0.49, 11: 0.45, 12: 0.42, 13: 0.39, 14: 0.30 };
const PDIM_TRIGGER_RATES = {1: 0.10, 2: 0.16, 3: 0.20};
const PDIM_SUCCESS_RATE = 0.625;
const PNF_TRIGGER_RATES = {1: 0.10, 2: 0.16, 3: 0.20};

const NTCA_TECH_DEF_TRIGGER_RATES = { // Num Tech_def players : trigger_chance
    // ... (rest of the rates)
    0: 0.0,
    1: 0.017,    // 1.7%
    2: 0.02025,  // 2.025%
    3: 0.0235,   // 2.35%
    4: 0.02675,  // 2.675%
    5: 0.030     // 3.0% (and above)
};
const NTCA_FORMATION_SUCCESS_RATE = 0.9;

// Data from the provided table for PC tactic effects
// Indices for effect_type_idx:
// 0: Overall SE Freq Multiplier (from "SE Freq vs '2 Others'")
// 1: SE% Team Share (from "SE% Team") - Not directly used in this logic, but kept for reference
// 2: SE Freq Multiplier for PC Team (from "SE Freq Team vs '2 Others'")
// 3: SE Freq Multiplier for Opponent of PC Team (from "SE Freq Opp vs '2 Others'")
const PC_LEVEL_DATA = {
    // level: [OverallSEFreqVsNormal, SEPercentForPCTeam, SEFreqForPCTeamVsNormal, SEFreqForOppVsNormal]
    0:  [1.00, 0.50, 1.00, 1.00], // PC Level 0 behaves as Normal for SEs
    7:  [1.51, 0.50, 1.51, 1.51], // Represents <8, adjusted for min 50% share
    8:  [1.65, 0.50, 1.65, 1.65], // Adjusted for min 50% share
    9:  [1.67, 0.51, 1.70, 1.64],
    10: [1.75, 0.53, 1.86, 1.65],
    11: [1.85, 0.55, 2.04, 1.66],
    12: [1.93, 0.55, 2.13, 1.72],
    13: [1.99, 0.56, 2.24, 1.73],
    14: [2.05, 0.58, 2.36, 1.73],
    15: [2.15, 0.59, 2.54, 1.76],
    16: [2.21, 0.59, 2.63, 1.80],
    17: [2.32, 0.61, 2.84, 1.79],
    18: [2.46, 0.63, 3.11, 1.80],
    19: [2.56, 0.65, 3.32, 1.79],
    20: [2.75, 0.66, 3.60, 1.90],
    21: [3.02, 0.67, 4.05, 2.00],
    22: [3.30, 0.67, 4.44, 2.16]  // Represents >21
};

const getPcLevelValue = (level, effect_type_idx) => {
    if (level === 0) return PC_LEVEL_DATA[0][effect_type_idx];
    let key_level = level;
    if (level < 8) key_level = 7;
    else if (level > 21) key_level = 22;
    
    const values = PC_LEVEL_DATA[key_level];
    // Should always find a value due to mapping, but as a fallback:
    return values ? values[effect_type_idx] : PC_LEVEL_DATA[10][effect_type_idx]; 
};

// Table for Long Shots Pressed %
// Rows: LS Skill of attacker, Columns: Pressing Skill of defender
const LS_PRESSED_CHANCE_TABLE = {
    // Pressing Skill: '<7', '7', '8', '9', '10', '11', '12', '13+'
    '<7':  [0.65, 0.77, 0.88, 0.86, 0.68, 0.87, 1.00, 0.50],
    '7':   [0.66, 0.67, 0.69, 0.55, 0.72, 0.54, 0.83, 0.83],
    '10':  [0.57, 0.62, 0.60, 0.64, 0.61, 0.57, 0.73, 0.70],
    '14':  [0.49, 0.56, 0.54, 0.53, 0.60, 0.60, 0.56, 0.71],
    '16':  [0.51, 0.51, 0.54, 0.55, 0.56, 0.57, 0.69, 0.67],
    '18':  [0.47, 0.51, 0.54, 0.53, 0.57, 0.54, 0.58, 0.62],
    '20':  [0.45, 0.50, 0.52, 0.50, 0.53, 0.58, 0.59, 0.59],
    '22':  [0.47, 0.50, 0.50, 0.51, 0.56, 0.54, 0.58, 0.55],
    '24+': [0.49, 0.51, 0.46, 0.46, 0.49, 0.54, 0.53, 0.54]
};

const getLsPressedChance = (lsSkill, pressingSkill) => {
    const lsSkillKeys = ['<7', '7', '10', '14', '16', '18', '20', '22', '24+'];
    const pressingSkillKeys = ['<7', '7', '8', '9', '10', '11', '12', '13+']; // Column indices

    const mapSkillToKey = (skill, keys, isMaxPlus = false) => {
        if (skill < 7) return keys[0]; // '<7'
        for (let i = 1; i < keys.length; i++) {
            if (isMaxPlus && i === keys.length - 1 && skill >= parseInt(keys[i-1])) return keys[i]; // For '24+' or '13+'
            if (skill <= parseInt(keys[i])) return keys[i];
        }
        return keys[keys.length - 1]; // Default to max key if somehow above
    };

    const lsRowKey = mapSkillToKey(lsSkill, lsSkillKeys.map(k => k.replace('+', '')), true);
    const pressColKey = mapSkillToKey(pressingSkill, pressingSkillKeys.map(k => k.replace('+', '')), true);
    
    const pressColIndex = pressingSkillKeys.indexOf(pressColKey);

    if (LS_PRESSED_CHANCE_TABLE[lsRowKey] && pressColIndex !== -1) {
        return LS_PRESSED_CHANCE_TABLE[lsRowKey][pressColIndex] || 0.53; // Default to overall average if lookup fails
    }
    return 0.53; // Overall average as a fallback
};

// Helper function to get NTCA trigger rate
const getNtcaTriggerRate = (techDefCount) => {
    if (techDefCount <= 0) return 0.0;
    if (techDefCount >= 5) return NTCA_TECH_DEF_TRIGGER_RATES[5];
    return NTCA_TECH_DEF_TRIGGER_RATES[techDefCount] || 0.0;
};

// PC_SE_COUNT_DISTRIBUTION, NORMAL_SE_COUNT_DISTRIBUTION, and old SE_EVENT_FREQUENCIES are no longer used.

export const precomputeRatings = (teamData) => {
    const computedData = {
        name: teamData.name, attitude: teamData.attitude,
        tactic: teamData.tactic || 'Normal', tactic_level: teamData.tactic_level || 0,
        base_midfield: teamData.midfield, specialties: teamData.specialties || {},
        isp_att: teamData.isp_att || 10, isp_def: teamData.isp_def || 10,
        midfield_pow3: Math.pow(teamData.midfield, 3),
        attack_pow3_5: {
            right: Math.pow(teamData.r_attack, 3.5),
            central: Math.pow(teamData.c_attack, 3.5),
            left: Math.pow(teamData.l_attack, 3.5)
        },
        defense_pow3_5: {
            right: Math.pow(teamData.r_defense, 3.5),
            central: Math.pow(teamData.c_defense, 3.5),
            left: Math.pow(teamData.l_defense, 3.5)
        }
    };
    let ca_modifier = 0;
    if (computedData.tactic === 'CA') {
        const team_base_rate = TACTIC_RATES['CA'][computedData.tactic_level] || 0;
        ca_modifier = BASELINE_CA_RATE > 0 ? team_base_rate / BASELINE_CA_RATE : 0;
    }
    computedData.ca_modifier = ca_modifier;
    return computedData;
};

const getDynamicRate = (ratesTable, level, priors) => {
    const levelKeys = Object.keys(ratesTable).map(Number).sort((a,b)=>a-b);
    let row_key = levelKeys[0];
    for (const key of levelKeys) {
        if (level <= key) { row_key = key; break; }
    }
    if (level > levelKeys[levelKeys.length-1]) {
        row_key = levelKeys[levelKeys.length-1];
    }
    const rate_list = ratesTable[row_key];
    const col_idx = Math.min(priors, rate_list.length - 1);
    return rate_list[col_idx];
};

const _getChanceType = (attacker, state, is_home) => {
    const aim_conv = is_home ? state.home_aim_conv : state.away_aim_conv;
    const aow_conv = is_home ? state.home_aow_conv : state.away_aow_conv;
    
    const chance_roll = Math.random();
    let initial_type;
    if (chance_roll < 0.13) return ['set_piece', false];
    else if (chance_roll < 0.49) initial_type = 'central';
    else if (chance_roll < 0.745) initial_type = 'left';
    else initial_type = 'right';
    
    let final_type = initial_type;
    const { tactic, tactic_level: level } = attacker;
    
    if (tactic === 'LS') {
        if (Math.random() < (TACTIC_RATES.LS_Conv[level] || 0)) return ['long_shot', true];
    } else if (tactic === 'AIM' && ['left', 'right'].includes(initial_type)) {
        if (Math.random() < getDynamicRate(AIM_DYNAMIC_RATES, level, aim_conv)) final_type = 'central';
    } else if (tactic === 'AOW' && initial_type === 'central') {
        if (Math.random() < getDynamicRate(AOW_DYNAMIC_RATES, level, aow_conv)) final_type = Math.random() < 0.5 ? 'left' : 'right';
    }
    return [final_type, final_type !== initial_type];
};

const _resolveAttack = (chance_type, attacker_team, defender_team, mods) => {
    if (chance_type === 'long_shot') {
        // Check if the defender is using Pressing tactic
        if (defender_team.tactic === 'Pressing' && defender_team.tactic_level > 0) {
            const lsSkill = attacker_team.tactic_level; // LS skill is the tactic_level of the LS tactic
            const pressingSkill = defender_team.tactic_level;
            const pressed_chance = getLsPressedChance(lsSkill, pressingSkill);
            if (Math.random() < pressed_chance) {
                return false; // Long Shot is pressed, no goal
            }
        }
        // If not pressed, or defender not using Pressing, proceed to goal conversion
        return Math.random() < (TACTIC_RATES.LS_Goal[attacker_team.tactic_level] || 0);
    }

    const defense_map = { right: 'left', central: 'central', left: 'right' };
    const attack_sector = chance_type;
    const defense_sector = defense_map[attack_sector];
    const attack_rating = mods.attacker_is_home ? attacker_team.attack_pow3_5[attack_sector] * mods.home_attack_mod : attacker_team.attack_pow3_5[attack_sector] * mods.away_attack_mod;
    const defense_rating = mods.attacker_is_home ? defender_team.defense_pow3_5[defense_sector] * mods.away_defense_mod : defender_team.defense_pow3_5[defense_sector] * mods.home_defense_mod;
    return Math.random() < (0.92 * attack_rating) / (attack_rating + defense_rating + 1e-9);
};

const _resolveSetPiece = (attacker, defender) => {
    let goal_prob = 0;
    if (Math.random() < 0.33) { // IFK
        const diff = attacker.isp_att - defender.isp_def;
        const closest_key = Object.keys(IFK_CONVERSION_RATES).reduce((a, b) => Math.abs(parseInt(b) - diff) < Math.abs(parseInt(a) - diff) ? b : a);
        goal_prob = IFK_CONVERSION_RATES[closest_key];
    } else { // DFK/PK
        const def_isp = defender.isp_def;
        const closest_key = Object.keys(PK_CONVERSION_RATES).reduce((a, b) => Math.abs(parseInt(b) - def_isp) < Math.abs(parseInt(a) - def_isp) ? b : a);
        goal_prob = PK_CONVERSION_RATES[closest_key];
    }
    return Math.random() < goal_prob;
};

// Helper to roll against a probability distribution array for SE counts
const rollDistribution = (distArray) => {
    const roll = Math.random();
    let cumulativeProb = 0;
    for (let i = 0; i < distArray.length; i++) {
        cumulativeProb += distArray[i];
        if (roll < cumulativeProb) {
            return i; // Returns the index, which is the number of SEs (0 SEs, 1 SE, etc.)
        }
    }
    return distArray.length - 1; // Fallback if probabilities don't sum to 1 (should be rare)
};

const _runMatchPeriod = (chance_slots, home_team, away_team, initial_state, num_se_override) => {
    const state = {...initial_state};
    const { midfield_pow3: home_mid, specialties: home_specs } = home_team;
    const { midfield_pow3: away_mid, specialties: away_specs } = away_team;
    const home_has_weaker_midfield = home_team.base_midfield < away_team.base_midfield;    
    let press_chance = 0;
    if (home_team.tactic === 'Pressing') {
        press_chance += (TACTIC_RATES.Pressing[home_team.tactic_level] || 0);
    }
    if (away_team.tactic === 'Pressing') {
        press_chance += (TACTIC_RATES.Pressing[away_team.tactic_level] || 0);
    }

    const home_is_pc = home_team.tactic === 'PC';
    const away_is_pc = away_team.tactic === 'PC';
    const home_pc_level = home_is_pc ? home_team.tactic_level : 0;
    const away_pc_level = away_is_pc ? away_team.tactic_level : 0;

    let se_generated_this_period = 0;
    let base_max_se_this_period = state.is_extra_time ? MAX_SE_PER_ET_PERIOD : MAX_SE_PER_NORMAL_GAME_DEFAULT;
    if (home_is_pc || away_is_pc) { // PC increases max SE cap by 1
        base_max_se_this_period += 1;
    }
    const max_se_for_this_period = (num_se_override !== undefined) ? num_se_override : base_max_se_this_period;

    let current_se_generation_chance = SE_GENERATION_CHANCE_PER_SLOT;
    let se_generation_multiplier = 1.0;

    if (home_is_pc && away_is_pc) {
        const home_pc_factor = getPcLevelValue(home_pc_level, 0); // Index 0 is OverallSEFreqVsNormal
        const away_pc_factor = getPcLevelValue(away_pc_level, 0); // Index 0 is OverallSEFreqVsNormal
        // Sum the increases: (1 + (home_factor-1) + (away_factor-1)) = home_factor + away_factor - 1
        se_generation_multiplier = home_pc_factor + away_pc_factor - 1.0;
    } else if (home_is_pc) {
        se_generation_multiplier = getPcLevelValue(home_pc_level, 0);
    } else if (away_is_pc) {
        se_generation_multiplier = getPcLevelValue(away_pc_level, 0);
    }
    current_se_generation_chance *= se_generation_multiplier;

    for(let i=0; i < chance_slots.length; i++) {
        // Phase A: Special Event Generation Attempt
        if (se_generated_this_period < max_se_for_this_period && Math.random() < current_se_generation_chance) {
            se_generated_this_period++;
            state.se_count++; 

            // 1. SE Type Selection
            const event_pool = [];
            const weights = [];
            for (const [event_name_config, config_params] of Object.entries(SE_EVENT_WEIGHTS_CONFIG)) {
                const mapping = SE_KEY_MAPPINGS[event_name_config];
                if (!mapping) continue; 

                const home_spec_players = mapping.spec_key ? (home_specs[mapping.spec_key] || 0) : 0;
                const away_spec_players = mapping.spec_key ? (away_specs[mapping.spec_key] || 0) : 0;

                let effective_count_for_weighting;
                if (event_name_config === 'CornerAnyone' || event_name_config === 'NonSpecSE') {
                    effective_count_for_weighting = config_params.initial_players;
                } else {
                    effective_count_for_weighting = config_params.initial_players + home_spec_players + away_spec_players;
                }
                
                const current_event_weight = effective_count_for_weighting * config_params.weight_per_player;

                if (current_event_weight > 0) {
                    event_pool.push(event_name_config);
                    weights.push(current_event_weight);
                }
            }

            if (event_pool.length > 0) {
                const total_weight = weights.reduce((a, b) => a + b, 0);
                let random_num = Math.random() * total_weight;
                let chosen_event_config_key = event_pool[event_pool.length - 1]; // Fallback
                for (let j = 0; j < weights.length; j++) {
                    if (random_num < weights[j]) {
                        chosen_event_config_key = event_pool[j];
                        break;
                    }
                    random_num -= weights[j];
                }

                // Increment SE type count *after* the type is chosen
                state.se_type_counts[chosen_event_config_key] = (state.se_type_counts[chosen_event_config_key] || 0) + 1;
                // console.log(`[DEBUG] SE Generated: ${chosen_event_config_key}, current se_type_counts:`, JSON.parse(JSON.stringify(state.se_type_counts)));

                const chosen_event_mapping = SE_KEY_MAPPINGS[chosen_event_config_key];
                const chosen_event_xg_key = chosen_event_mapping.xg_key;
                const chosen_event_spec_key = chosen_event_mapping.spec_key;

                // 2. SE Attacker Determination
                let se_attacker = null;
                let prob_home_gets_se;

                const home_val_for_dist = chosen_event_spec_key ? (home_specs[chosen_event_spec_key] || 0) : 0;
                const away_val_for_dist = chosen_event_spec_key ? (away_specs[chosen_event_spec_key] || 0) : 0;

                let home_pull, away_pull;

                if (chosen_event_config_key === 'CornerAnyone' || chosen_event_config_key === 'Head_Def') {
                    home_pull = home_mid;
                    away_pull = away_mid;
                } else if (chosen_event_config_key === 'NonSpecSE') {
                    home_pull = 0.5;
                    away_pull = 0.5;
                } else { // Player-count driven SEs
                    home_pull = Math.pow(home_val_for_dist + 1, 3);
                    away_pull = Math.pow(away_val_for_dist + 1, 3);
                }
                
                // Apply PC multipliers to pulls
                if (home_is_pc && away_is_pc) {
                    home_pull *= getPcLevelValue(home_pc_level, 2);
                    away_pull *= getPcLevelValue(away_pc_level, 2);
                } else if (home_is_pc) {
                    home_pull *= getPcLevelValue(home_pc_level, 2);
                    away_pull *= getPcLevelValue(home_pc_level, 3); // Opponent effect
                } else if (away_is_pc) {
                    away_pull *= getPcLevelValue(away_pc_level, 2);
                    home_pull *= getPcLevelValue(away_pc_level, 3); // Opponent effect
                }

                const total_pull = home_pull + away_pull;
                if (total_pull < 1e-9) { // Avoid division by zero or if pulls are tiny
                    prob_home_gets_se = 0.5; // Fallback
                } else {
                    prob_home_gets_se = home_pull / total_pull;
                }
                
                se_attacker = Math.random() < prob_home_gets_se ? home_team : away_team;

                if (se_attacker) {
                    let se_goal_prob = SE_XG_RATES[chosen_event_xg_key] || 0;
                    const se_defender = (se_attacker === home_team) ? away_team : home_team;

                    if (chosen_event_xg_key === 'Quick_off') {
                        const quick_def_count = se_defender.specialties['Quick_def'] || 0;
                        const reduction_per_player = 0.225; // 22.5% reduction per Quick_def player
                        const total_reduction_factor = Math.min(1.0, quick_def_count * reduction_per_player); // Cap at 100%
                        se_goal_prob *= (1.0 - total_reduction_factor);
                    }
                    
                    if (Math.random() < Math.abs(se_goal_prob)) {
                        const is_neg_event = se_goal_prob < 0; // Handles events like Inexperienced Def
                        const scoring_team_home = (se_attacker === home_team && !is_neg_event) || (se_attacker === away_team && is_neg_event);
                        state[scoring_team_home ? 'home_score' : 'away_score']++;
                        state[scoring_team_home ? 'home_se_goals' : 'away_se_goals']++;
                        state.se_type_goal_counts[chosen_event_config_key] = (state.se_type_goal_counts[chosen_event_config_key] || 0) + 1;
                        // console.log(`[DEBUG] SE Goal: ${chosen_event_config_key}, current se_type_goal_counts:`, JSON.parse(JSON.stringify(state.se_type_goal_counts)));
                    }
                }
                // SE processed (or attempted). Normal chance will also be processed for this slot.
            }
        }
        // Phase B: Regular Chance
        if (press_chance > 0 && Math.random() < press_chance) continue;
        let attacker_is_home = null;
        const slot = chance_slots[i];
        if (slot === 'open') { attacker_is_home = Math.random() >= (away_mid / (home_mid + away_mid + 1e-9)); }
        else {
            const is_home_slot = (slot === 'home');
            const [stronger, weaker] = home_mid >= away_mid ? [home_mid, away_mid] : [away_mid, home_mid];
            if (Math.random() >= (weaker / (weaker + stronger + 1e-9))) {
                if ((home_mid >= away_mid) === is_home_slot) attacker_is_home = is_home_slot;
            } else {
                if ((home_mid < away_mid) === is_home_slot) attacker_is_home = is_home_slot;
            }
        }
        if (attacker_is_home === null) continue;
        
        const attacker = attacker_is_home ? home_team : away_team;
        const defender = attacker_is_home ? away_team : home_team;
        
        const pdim_count = defender.specialties.PDIM || 0;
        if (pdim_count > 0 && Math.random() < (PDIM_TRIGGER_RATES[pdim_count] || 0)) {
            if (Math.random() < PDIM_SUCCESS_RATE) continue;
        }

        const [chance_type, converted] = _getChanceType(attacker, state, attacker_is_home);
        if(converted) { state[`${attacker_is_home ? 'home' : 'away'}_${attacker.tactic.toLowerCase()}_conv`]++; }
        
        const goal_diff = state.home_score - state.away_score;
        const mods = { attacker_is_home, home_attack_mod: 1.0, home_defense_mod: 1.0, away_attack_mod: 1.0, away_defense_mod: 1.0 };
        if (Math.abs(goal_diff) >= 2) {
            const penalty = 1 - (0.09 * (Math.min(Math.abs(goal_diff), 8) - 1));
            const boost = 1 + (0.075 * (Math.min(Math.abs(goal_diff), 8) - 1));
            if(goal_diff > 0 && home_team.attitude !== 'MOTS') { mods.home_attack_mod = penalty; mods.home_defense_mod = boost; }
            else if(goal_diff < 0 && away_team.attitude !== 'MOTS') { mods.away_attack_mod = penalty; mods.away_defense_mod = boost; }
        }
        
        const goal_scored = chance_type === 'set_piece' ? _resolveSetPiece(attacker, defender) : _resolveAttack(chance_type, attacker, defender, mods);
        
        if (goal_scored) {
            state[attacker_is_home ? 'home_score' : 'away_score']++;
            if (chance_type === 'set_piece') {
                state[attacker_is_home ? 'home_sp_goals' : 'away_sp_goals']++;
            } else if (chance_type === 'long_shot') {
                state[attacker_is_home ? 'home_ls_goals' : 'away_ls_goals']++;
            } else { // Normal attack (left, central, right) from direct chance
                if (chance_type === 'left') state[attacker_is_home ? 'home_l_attack_goals' : 'away_l_attack_goals']++;
                else if (chance_type === 'central') state[attacker_is_home ? 'home_c_attack_goals' : 'away_c_attack_goals']++;
                else if (chance_type === 'right') state[attacker_is_home ? 'home_r_attack_goals' : 'away_r_attack_goals']++;
            }
        } else {
            if (chance_type !== 'set_piece') {
                state[attacker_is_home ? 'away_opp_miss' : 'home_opp_miss']++;
                let pnf_scored_this_chance = false;
                const pnf_count = attacker.specialties.PNF || 0;
                if (pnf_count > 0 && Math.random() < (PNF_TRIGGER_RATES[pnf_count] || 0)) {
                     if (Math.random() < SE_XG_RATES.PNF) { 
                         state[attacker_is_home ? 'home_score' : 'away_score']++; 
                         state[attacker_is_home ? 'home_pnf_goals' : 'away_pnf_goals']++;
                         pnf_scored_this_chance = true;
                     }
                }

                if (pnf_scored_this_chance) {
                    continue; // PNF scored, so this slot's action is done.
                }

                // NTCA (Non-Tactical Counter Attack / Tech CA) Check:
                // Only if PNF didn't score and it's a normal chance (not long_shot, not set_piece).
                // The 'chance_type !== 'set_piece'' is already true from the outer if.
                if (chance_type !== 'long_shot') {
                    const tech_def_count = defender.specialties.Tech_def || 0;
                    if (tech_def_count > 0) {
                        const ntca_trigger_prob = getNtcaTriggerRate(tech_def_count);
                        if (Math.random() < ntca_trigger_prob) { // NTCA triggered
                            if (Math.random() < NTCA_FORMATION_SUCCESS_RATE) { // NTCA formed
                                const ntca_attacker_team = defender;
                                const ntca_defender_team = attacker;
                                // NTCAs are sudden, use original missed chance type, no goal_diff mods.
                                const ntca_attack_mods = {
                                    attacker_is_home: !attacker_is_home, // Roles are flipped
                                    home_attack_mod: 1.0, home_defense_mod: 1.0,
                                    away_attack_mod: 1.0, away_defense_mod: 1.0
                                };
                                if (_resolveAttack(chance_type, ntca_attacker_team, ntca_defender_team, ntca_attack_mods)) {
                                    state[!attacker_is_home ? 'home_score' : 'away_score']++; // Score for the NTCA attacker
                                    // Attribute NTCA goal to the correct attack sector
                                    if (chance_type === 'left') state[!attacker_is_home ? 'home_l_attack_goals' : 'away_l_attack_goals']++;
                                    else if (chance_type === 'central') state[!attacker_is_home ? 'home_c_attack_goals' : 'away_c_attack_goals']++;
                                    else if (chance_type === 'right') state[!attacker_is_home ? 'home_r_attack_goals' : 'away_r_attack_goals']++;
                                }
                                continue; // NTCA was formed and resolved (scored or missed), skip tactical CA.
                            }
                        }
                    }
                }

                // Tactical CA Check (only if PNF didn't score AND NTCA didn't form and resolve)
                if (defender.tactic === 'CA' && ((home_has_weaker_midfield && !attacker_is_home) || (!home_has_weaker_midfield && attacker_is_home))) {
                    const [missed, succ, ca_tactic_modifier] = !attacker_is_home ? [state.home_opp_miss, state.home_ca_succ, home_team.ca_modifier] : [state.away_opp_miss, state.away_ca_succ, away_team.ca_modifier];
                    const [row, col] = [Math.min(missed - 1, 7), Math.min(succ, 6)];
                    if (Math.random() < CA_DYNAMIC_RATES[row][col] * ca_tactic_modifier) {
                        const tactical_ca_mods = { ...mods, attacker_is_home: !attacker_is_home }; // Apply original goal_diff mods
                        if (_resolveAttack(chance_type, defender, attacker, tactical_ca_mods)) {
                            state[!attacker_is_home ? 'home_score' : 'away_score']++; // Score for tactical CA
                            // Attribute CA goal to the correct attack sector
                            if (chance_type === 'left') state[!attacker_is_home ? 'home_l_attack_goals' : 'away_l_attack_goals']++;
                            else if (chance_type === 'central') state[!attacker_is_home ? 'home_c_attack_goals' : 'away_c_attack_goals']++;
                            else if (chance_type === 'right') state[!attacker_is_home ? 'home_r_attack_goals' : 'away_r_attack_goals']++;
                            state[!attacker_is_home ? 'home_ca_succ' : 'away_ca_succ']++; // Increment tactical CA success
                        }
                    }
                }
            }
        }
    }
    // console.log(`[DEBUG] Exiting _runMatchPeriod. se_count: ${state.se_count}, se_type_counts:`, JSON.parse(JSON.stringify(state.se_type_counts)), `home_se_goals: ${state.home_se_goals}, away_se_goals: ${state.away_se_goals}`);
    return state;
};

export const simulateMatch = (home_team, away_team, match_type = 'league', custom_conditions = {}) => {
    const {
        home_chances = 5, 
        shared_chances = 5,
        away_chances = 5,
        num_se_override, // Can be undefined, _runMatchPeriod will handle it
        start_home_goals = 0,
        start_away_goals = 0
    } = custom_conditions;

    const initial_sim_state = {
        'home_score': start_home_goals, 'away_score': start_away_goals,
        // These counters should always start at 0 for the simulation period itself,
        // regardless of starting scores.
        'home_ca_succ': 0, 'away_ca_succ': 0, 
        'home_opp_miss': 0, 'away_opp_miss': 0, 
        'se_count': 0, 
        'home_aim_conv': 0, 'away_aim_conv': 0, 
        'home_aow_conv': 0, 'away_aow_conv': 0,
        // Goal type counters
        'home_l_attack_goals': 0, 'home_c_attack_goals': 0, 'home_r_attack_goals': 0,
        'home_sp_goals': 0, 'home_se_goals': 0, 'home_pnf_goals': 0, 'home_ls_goals': 0,
        'away_l_attack_goals': 0, 'away_c_attack_goals': 0, 'away_r_attack_goals': 0,
        'away_sp_goals': 0, 'away_se_goals': 0, 'away_pnf_goals': 0, 'away_ls_goals': 0,
        'is_extra_time': false, // Flag for _runMatchPeriod to know context for SE cap
        'se_type_counts': {}, 'se_type_goal_counts': {} // For detailed SE type tracking
    }; 

    const normal_time_chance_slots = [
        ...Array(home_chances).fill('home'),
        ...Array(shared_chances).fill('open'),
        ...Array(away_chances).fill('away')
    ];

    const nt_state = _runMatchPeriod(
        normal_time_chance_slots,
        home_team, away_team, 
        {...initial_sim_state}, // Pass a copy for normal time
        num_se_override // Pass the SE override for normal time
    );

    let state_for_details = nt_state;
    const result = { 
        normal_time_score: [nt_state.home_score, nt_state.away_score], 
        extra_time_score: null, 
        pk_winner: null,
        goal_details: {},
        simulated_se_events_count: 0, 
        simulated_se_goals_count: 0,
        se_type_counts: {},
        se_type_goal_counts: {}
    };

    if (match_type === 'cup' && nt_state.home_score === nt_state.away_score) {
        // For ET, pass a copy of nt_state so its counters continue to accumulate
        // ET uses default chance slots and no SE override (tactic-based SEs for ET)
        const et_chance_slots = ['home', 'away', 'open', 'open'];
        const et_state = _runMatchPeriod(
            et_chance_slots, 
            home_team, away_team, 
            {...nt_state, is_extra_time: true}, // Pass accumulated state and set ET flag
            undefined // No SE override for extra time
        );
        result.extra_time_score = [et_state.home_score, et_state.away_score];
        state_for_details = et_state; // Use ET state for final goal details if ET was played
        if (et_state.home_score === et_state.away_score) {
            result.pk_winner = _runPenaltyShootout(home_team, away_team);
        }
    }

    // Populate goal_details from the final state of the match (nt_state or et_state)
    result.goal_details = {
        home_l_attack_goals: state_for_details.home_l_attack_goals, home_c_attack_goals: state_for_details.home_c_attack_goals, home_r_attack_goals: state_for_details.home_r_attack_goals,
        home_sp_goals: state_for_details.home_sp_goals, home_se_goals: state_for_details.home_se_goals, home_pnf_goals: state_for_details.home_pnf_goals, home_ls_goals: state_for_details.home_ls_goals,
        away_l_attack_goals: state_for_details.away_l_attack_goals, away_c_attack_goals: state_for_details.away_c_attack_goals, away_r_attack_goals: state_for_details.away_r_attack_goals,
        away_sp_goals: state_for_details.away_sp_goals, away_se_goals: state_for_details.away_se_goals, away_pnf_goals: state_for_details.away_pnf_goals, away_ls_goals: state_for_details.away_ls_goals,
    };

    // console.log(`[DEBUG] In simulateMatch, state_for_details.se_count: ${state_for_details.se_count}, state_for_details.se_type_counts:`, JSON.parse(JSON.stringify(state_for_details.se_type_counts || {})));
    // Populate total SE counts and detailed SE type counts from the final state
    result.simulated_se_events_count = state_for_details.se_count;
    result.simulated_se_goals_count = state_for_details.home_se_goals + state_for_details.away_se_goals;
    result.se_type_counts = state_for_details.se_type_counts || {};
    result.se_type_goal_counts = state_for_details.se_type_goal_counts || {};

    // console.log(`[DEBUG] Exiting simulateMatch. result.simulated_se_events_count: ${result.simulated_se_events_count}, result.se_type_counts:`, JSON.parse(JSON.stringify(result.se_type_counts || {})));
    return result;
};

// Penalty Shootout Logic (ensured it exists)
const _runPenaltyShootout = (home_team, away_team) => {
    let home_pk_score = 0, away_pk_score = 0;
    let home_momentum = 1.0, away_momentum = 1.0; 
    for(let i=0; i<5; i++){
        if (Math.random() < (0.79 + (home_team.isp_att - away_team.isp_def) * 0.01) * home_momentum) { home_pk_score++; home_momentum=1.1; away_momentum=1.0; } else { home_momentum=1.0; away_momentum=1.1; }
        if (Math.random() < (0.79 + (away_team.isp_att - home_team.isp_def) * 0.01) * away_momentum) { away_pk_score++; away_momentum=1.1; home_momentum=1.0; } else { away_momentum=1.0; home_momentum=1.1; }
    }
    if(home_pk_score === away_pk_score){ 
        while(home_pk_score === away_pk_score){
            const home_scored_sd = Math.random() < (0.79 + (home_team.isp_att - away_team.isp_def) * 0.01) * home_momentum;
            const away_scored_sd = Math.random() < (0.79 + (away_team.isp_att - home_team.isp_def) * 0.01) * away_momentum;
            if(home_scored_sd !== away_scored_sd){
                if(home_scored_sd) home_pk_score++; else away_pk_score++;
            }
        }
    }
    return home_pk_score > away_pk_score ? 'home' : 'away';
};