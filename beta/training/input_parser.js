/**
 * Input Parser Module
 * Shared parsing logic for simulator input strings.
 */
(function (scope) {
    /**
     * Parse a weight configuration string
     * @param {string} str - Input string in format (d;d;d;m;a;a;a;...;Tactic;TacLvl;Coach)
     * @returns {Object|null} Parsed configuration or null if invalid
     */
    function parseWeights(str) {
        const clean = str.replace(/[()]/g, '').trim();
        const rawParts = clean.split(';');
        const parts = rawParts.map(p => parseFloat(p));
        if (parts.length < 7) return null;

        // 1. Extract weights (indices 0-6)
        const weights = {
            defLeft: parts[0],
            defCenter: parts[1],
            defRight: parts[2],
            mid: parts[3],
            attLeft: parts[4],
            attCenter: parts[5],
            attRight: parts[6]
        };

        // 2. Extract training options (indices 7-13)
        let trainingOpts = null;
        if (parts.length >= 8) {
            trainingOpts = {
                trainSpForGk: (parts[7] > 0),
                targetSpLevel: parts[7] || 0,

                trainSpForCd: (parts[8] > 0),
                targetSpCdLevel: parts[8] || 0,

                trainSpForWb: (parts[9] > 0),
                targetSpWbLevel: parts[9] || 0,

                trainSpForMidFwd: (parts[10] > 0),
                targetMidFwdSpLevel: parts[10] || 0,

                trainPassForDef: (parts[11] > 0),
                targetPassLevel: parts[11] || 0,

                trainScoreForDef: (parts[12] > 0),
                targetScoreDefLevel: parts[12] || 0,

                trainScoreForMid: (parts[13] > 0),
                targetScoreMidLevel: parts[13] || 0
            };
        }

        // 3. Tactic parsing (Index 14 / 15th value)
        let tactic = 'Normal';
        if (rawParts.length >= 15) {
            const parsedTactic = rawParts[14].trim().toUpperCase();
            if (['NORMAL', 'AOW', 'AIM', 'AOD', 'CA', 'LS', 'PC', 'PS', 'PRESSING'].includes(parsedTactic)) {
                tactic = parsedTactic;
            }
        }

        // 4. Tactic Level parsing (Index 15 / 16th value)
        let tacticLevel = 20;
        if (rawParts.length >= 16) {
            const parsedLevel = parseFloat(rawParts[15]);
            if (!isNaN(parsedLevel)) {
                tacticLevel = parsedLevel;
            }
        }

        // 5. Coach Type parsing (Index 16 / 17th value)
        let coachType = 'Neutral';
        if (rawParts.length >= 17) {
            const rawCoach = rawParts[16].trim().toLowerCase();
            if (rawCoach.startsWith('def')) coachType = 'Defensive';
            else if (rawCoach.startsWith('att') || rawCoach.startsWith('off')) coachType = 'Offensive';
            else if (rawCoach.startsWith('neu') || rawCoach.startsWith('nor')) coachType = 'Neutral';
        }

        // 6. Formation parsing (Index 17 / 18th value)
        let formation = '352'; // Default
        if (rawParts.length >= 18) {
            const rawFormation = rawParts[17].trim();
            if (['253', '343', '352', '433', '442', '451', '532', '541', '550'].includes(rawFormation)) {
                formation = rawFormation;
            }
        }

        // 7. PNF (Powerful Normal Forward) parsing
        // Check if any of the remaining parts is 'PNF'
        let forcePNF = false;
        for (let i = 18; i < rawParts.length; i++) {
            if (rawParts[i].trim().toUpperCase() === 'PNF') {
                forcePNF = true;
                break;
            }
        }

        return { weights, trainingOpts, tactic, tacticLevel, coachType, formation, forcePNF };
    }

    // Export
    scope.InputParser = { parseWeights };

})(window);
