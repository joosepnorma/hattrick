/**
 * CHPP API Module for Hattrick Match Simulator
 * 
 * This module handles fetching and parsing data from the Hattrick CHPP API.
 * Requires valid OAuth tokens for authentication.
 */

const CHPP_API_BASE_URL = 'https://chpp.hattrick.org/chppxml.ashx';

/**
 * Data type mappings from CHPP API to simulator format
 */
const TACTIC_MAP = {
    0: 'Normal',
    1: 'Pressing',
    2: 'CA',      // Counter-attacks
    3: 'AIM',     // Attack in the middle
    4: 'AOW',     // Attack on wings
    7: 'PC',      // Play creatively
    8: 'LS'       // Long shots
};

const SPECIALTY_MAP = {
    0: null,              // No specialty
    1: 'Technical',
    2: 'Quick',
    3: 'Powerful',
    4: 'Unpredictable',
    5: 'Head',
    6: 'Resilient',
    8: 'Support'
};

/**
 * Position category definitions for specialty counting
 * Maps RoleID to position category for specialty assignment
 */
const POSITION_CATEGORIES = {
    // Offensive positions for _off specialties: Forwards, Wingers AND Midfielders
    offensive: [106, 107, 108, 109, 110, 111, 112, 113],
    // Inner Midfielders only
    innerMidfield: [107, 108, 109],
    // Wingers only
    wingers: [106, 110],
    // Forwards only
    forwards: [111, 112, 113],
    // Defensive positions: Defenders and Wing Backs
    defensive: [101, 102, 103, 104, 105],
    // Forward and Winger positions (for Unpredictable FW/W)
    fw_winger: [106, 110, 111, 112, 113]
};

/**
 * MatchBehaviourID constants
 */
const BEHAVIOUR = {
    NORMAL: 0,
    OFFENSIVE: 1,
    DEFENSIVE: 2,
    TOWARDS_MIDDLE: 3,
    TOWARDS_WING: 4
};

/**
 * Convert CHPP MatchRating (1-80) to decimal rating
 * CHPP uses quarter sub-levels: value 17 = (17/4) = 4.25 which maps to skill levels
 * @param {number} matchRating - CHPP match rating (1-80)
 * @returns {number} Decimal rating for simulator
 */
function convertMatchRating(matchRating) {
    // CHPP ratings are in "sub-levels" where each level has 4 sub-levels
    // Example: 33 = "very low excellent" = 8.25 on skill scale
    // Rating 1 = disastrous (level 1), Rating 80 = divine+
    return (matchRating / 4).toFixed(1);
}

/**
 * Fetch match details from CHPP API
 * @param {number} matchId - The match ID to fetch
 * @param {string} sourceSystem - 'hattrick' or 'youth'
 * @param {Object} oauthParams - OAuth parameters for authentication
 * @returns {Promise<Object>} Parsed match details
 */
async function fetchMatchDetails(matchId, sourceSystem, oauthParams) {
    const params = new URLSearchParams({
        file: 'matchdetails',
        version: '3.1',
        matchID: matchId,
        sourceSystem: sourceSystem
    });
    
    const response = await makeOAuthRequest(`${CHPP_API_BASE_URL}?${params}`, oauthParams);
    const xmlText = await response.text();
    return parseMatchDetailsXML(xmlText);
}

/**
 * Fetch match lineup for a specific team
 * @param {number} matchId - The match ID
 * @param {number} teamId - The team ID
 * @param {string} sourceSystem - 'hattrick' or 'youth'
 * @param {Object} oauthParams - OAuth parameters
 * @returns {Promise<Object>} Parsed lineup data
 */
async function fetchMatchLineup(matchId, teamId, sourceSystem, oauthParams) {
    const params = new URLSearchParams({
        file: 'matchlineup',
        version: '2.1',
        matchID: matchId,
        teamID: teamId,
        sourceSystem: sourceSystem
    });
    
    const response = await makeOAuthRequest(`${CHPP_API_BASE_URL}?${params}`, oauthParams);
    const xmlText = await response.text();
    return parseMatchLineupXML(xmlText);
}

/**
 * Fetch player details
 * @param {number} playerId - The player ID
 * @param {Object} oauthParams - OAuth parameters
 * @returns {Promise<Object>} Parsed player details
 */
async function fetchPlayerDetails(playerId, oauthParams) {
    const params = new URLSearchParams({
        file: 'playerdetails',
        version: '3.1',
        playerID: playerId
    });
    
    const response = await makeOAuthRequest(`${CHPP_API_BASE_URL}?${params}`, oauthParams);
    const xmlText = await response.text();
    return parsePlayerDetailsXML(xmlText);
}

/**
 * Parse matchdetails XML response
 * @param {string} xmlText - Raw XML response
 * @returns {Object} Parsed match data
 */
function parseMatchDetailsXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const getTextContent = (parent, tagName) => {
        const el = parent.querySelector(tagName);
        return el ? el.textContent : null;
    };
    
    const getNumericContent = (parent, tagName) => {
        const value = getTextContent(parent, tagName);
        return value ? parseFloat(value) : null;
    };
    
    const parseTeam = (teamElement, isHome) => {
        const prefix = isHome ? 'Home' : 'Away';
        return {
            teamId: getNumericContent(teamElement, `${prefix}TeamID`),
            teamName: getTextContent(teamElement, `${prefix}TeamName`),
            goals: getNumericContent(teamElement, `${prefix}Goals`),
            formation: getTextContent(teamElement, 'Formation'),
            tacticType: getNumericContent(teamElement, 'TacticType'),
            tacticSkill: getNumericContent(teamElement, 'TacticSkill'),
            ratings: {
                midfield: getNumericContent(teamElement, 'RatingMidfield'),
                rightDef: getNumericContent(teamElement, 'RatingRightDef'),
                midDef: getNumericContent(teamElement, 'RatingMidDef'),
                leftDef: getNumericContent(teamElement, 'RatingLeftDef'),
                rightAtt: getNumericContent(teamElement, 'RatingRightAtt'),
                midAtt: getNumericContent(teamElement, 'RatingMidAtt'),
                leftAtt: getNumericContent(teamElement, 'RatingLeftAtt'),
                ispDef: getNumericContent(teamElement, 'RatingIndirectSetPiecesDef'),
                ispAtt: getNumericContent(teamElement, 'RatingIndirectSetPiecesAtt')
            }
        };
    };
    
    const match = xmlDoc.querySelector('Match');
    const homeTeam = match.querySelector('HomeTeam');
    const awayTeam = match.querySelector('AwayTeam');
    
    const getError = () => {
        const error = xmlDoc.querySelector('Error');
        return error ? getTextContent(error, 'ErrorText') : null;
    };
    
    const errorText = getError();
    if (errorText) throw new Error(errorText);
    
    return {
        matchId: getNumericContent(match, 'MatchID'),
        matchType: getNumericContent(match, 'MatchType'),
        matchDate: getTextContent(match, 'MatchDate'),
        homeTeam: parseTeam(homeTeam, true),
        awayTeam: parseTeam(awayTeam, false)
    };
}

/**
 * Parse matchlineup XML response
 * @param {string} xmlText - Raw XML response
 * @returns {Object} Parsed lineup data
 */
function parseMatchLineupXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const getTextContent = (parent, tagName) => {
        const el = parent.querySelector(tagName);
        return el ? el.textContent : null;
    };
    
    const getNumericContent = (parent, tagName) => {
        const value = getTextContent(parent, tagName);
        return value ? parseFloat(value) : null;
    };
    
    const team = xmlDoc.querySelector('Team');
    const startingLineup = team ? team.querySelector('StartingLineup') : null;
    
    if (!team || !startingLineup) {
        const error = xmlDoc.querySelector('Error');
        if (error) throw new Error(getTextContent(error, 'ErrorText'));
        throw new Error('Invalid MatchLineup XML');
    }

    const players = Array.from(startingLineup.querySelectorAll('Player'));
    
    const lineup = players.map(player => ({
        playerId: getNumericContent(player, 'PlayerID'),
        roleId: getNumericContent(player, 'RoleID'),
        firstName: getTextContent(player, 'FirstName'),
        lastName: getTextContent(player, 'LastName'),
        behaviour: getNumericContent(player, 'Behaviour')
    })).filter(p => p.roleId >= 100 && p.roleId <= 113); // Only field players
    
    return {
        teamId: getNumericContent(team, 'TeamID'),
        teamName: getTextContent(team, 'TeamName'),
        experienceLevel: getNumericContent(team, 'ExperienceLevel'),
        lineup: lineup
    };
}

/**
 * Parse playerdetails XML response
 * @param {string} xmlText - Raw XML response
 * @returns {Object} Parsed player data
 */
function parsePlayerDetailsXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const getTextContent = (parent, tagName) => {
        const el = parent.querySelector(tagName);
        return el ? el.textContent : null;
    };
    
    const getNumericContent = (parent, tagName) => {
        const value = getTextContent(parent, tagName);
        return value ? parseFloat(value) : null;
    };
    
    const player = xmlDoc.querySelector('Player');
    
    if (!player) {
         const error = xmlDoc.querySelector('Error');
        if (error) throw new Error(getTextContent(error, 'ErrorText'));
        throw new Error('Invalid PlayerDetails XML');
    }
    
    return {
        playerId: getNumericContent(player, 'PlayerID'),
        firstName: getTextContent(player, 'FirstName'),
        lastName: getTextContent(player, 'LastName'),
        specialty: getNumericContent(player, 'Specialty'),
        stamina: getNumericContent(player, 'StaminaSkill')
    };
}

/**
 * OAuth 1.0a signed request helper (stub - needs implementation)
 * @param {string} url - Request URL
 * @param {Object} oauthParams - OAuth credentials
 * @returns {Promise<Response>} Fetch response
 */
async function makeOAuthRequest(url, oauthParams) {
    // NOTE: This is a placeholder. OAuth 1.0a requires signature generation.
    // You'll need to implement proper OAuth signing or use a library like oauth-1.0a
    // 
    // Required OAuth parameters:
    // - oauth_consumer_key
    // - oauth_token
    // - oauth_signature_method (HMAC-SHA1)
    // - oauth_timestamp
    // - oauth_nonce
    // - oauth_version (1.0)
    // - oauth_signature (computed)
    
   // For now, attempting a direct fetch which will likely fail without a proxy or actual OAuth implementation
   // In a real browser environment, this will hit CORS or Auth errors against the Hattrick API directly.
   // Ideally, this should go through a proxy that handles OAuth.
   
    console.warn('Making request without OAuth signature (STUB). API will likely reject this.');
    
    // Attempt fetch - this will likely fail due to CORS/Auth
    return fetch(url);
}

/**
 * Count specialties by position category
 * @param {Array} players - Array of player objects with roleId, specialty, and behaviour
 * @returns {Object} Specialty counts for simulator form
 */
function countSpecialtiesByPosition(players) {
    const counts = {
        Quick_off: 0,
        Head_off: 0,
        Tech_off: 0,
        Unpr_IM: 0,
        Unpr_FW_W: 0,
        Quick_def: 0,
        Head_def: 0,
        Unpr_def: 0,
        PNF: 0,            // Powerful Normal Forwards
        PDIM: 0,           // Powerful Defensive Inner Midfielders
        Tech_def: 0
    };
    
    players.forEach(player => {
        const specialty = player.specialty;
        const roleId = player.roleId;
        const behaviour = player.behaviour;
        
        if (!specialty || specialty === 0) return;
        
        // Position checks
        const isOffensive = POSITION_CATEGORIES.offensive.includes(roleId);  // FW + W + IM
        const isDefensive = POSITION_CATEGORIES.defensive.includes(roleId);  // Defenders
        const isInnerMidfield = POSITION_CATEGORIES.innerMidfield.includes(roleId);  // IM only
        const isFwWinger = POSITION_CATEGORIES.fw_winger.includes(roleId);  // FW + W
        const isForward = POSITION_CATEGORIES.forwards.includes(roleId);  // FW only
        
        switch (specialty) {
            case 2: // Quick
                if (isOffensive) counts.Quick_off++;  // FW, W, and IM
                if (isDefensive) counts.Quick_def++;
                break;
            case 5: // Head
                if (isOffensive) counts.Head_off++;  // FW, W, and IM
                if (isDefensive) counts.Head_def++;
                break;
            case 1: // Technical
                if (isOffensive) counts.Tech_off++;  // FW, W, and IM
                if (isDefensive) counts.Tech_def++;
                break;
            case 4: // Unpredictable
                if (isInnerMidfield) counts.Unpr_IM++;
                if (isFwWinger) counts.Unpr_FW_W++;
                if (isDefensive) counts.Unpr_def++;
                break;
            case 3: // Powerful
                // PNF: Powerful players in Forward positions with Normal behaviour
                if (isForward && behaviour === BEHAVIOUR.NORMAL) {
                    counts.PNF++;
                }
                // PDIM: Powerful players in Inner Midfield with Defensive behaviour
                if (isInnerMidfield && behaviour === BEHAVIOUR.DEFENSIVE) {
                    counts.PDIM++;
                }
                break;
        }
    });
    
    return counts;
}

export {
    fetchMatchDetails,
    fetchMatchLineup,
    fetchPlayerDetails,
    convertMatchRating,
    countSpecialtiesByPosition,
    TACTIC_MAP,
    SPECIALTY_MAP,
    POSITION_CATEGORIES
};
