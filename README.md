# Hattrick Match Simulator Toolkit

[![Netlify Status](https://api.netlify.com/api/v1/badges/b5c777e3-085e-400e-94e8-809460b372f6/deploy-status)](https://joosep.netlify.app/)
> **Live Demo:** [https://joosep.netlify.app/](https://joosep.netlify.app/)

A comprehensive suite of web-based tools for simulating and analyzing matches in the [Hattrick](https://www.hattrick.org) online football manager game.

## Project Overview

This toolkit provides Monte Carlo simulation-based analysis for Hattrick matches, including possession calculation, special event prediction, tactic effectiveness, and man-marking scenarios.

## File Structure

### Core Engine

| File | Purpose |
|------|---------|
| `simulator.js` | **Core simulation engine** - Contains all match simulation logic including stamina calculations, special event probabilities, tactic rates, possession calculations, and the Monte Carlo simulation algorithm. Used by all HTML tools. |

### Web Applications

| File | Purpose |
|------|---------|
| `index.html` | **Main Match Simulator** - Primary UI for simulating matches between two teams. Allows manual input of team ratings (midfield, defense, attack), tactics, stamina, and player specialties. Runs simulations and displays expected goals, win probabilities, and score distributions. |
| `index_via_chpp.html` | **CHPP-Integrated Simulator** - Enhanced version of the main simulator that can auto-populate team data from the Hattrick CHPP API using OAuth authentication. Fetches match details, lineups, and player data automatically. |

### Simulator Tools (`/Simulator tool`)

| File | Purpose |
|------|---------|
| `Simulator tool/3vs3_tool.html` | **3vs3 Lineup Analyzer** - Tool for comparing multiple lineup configurations (A, B, C) for both home and away teams. Useful for planning different tactical scenarios within a single match. |
| `Simulator tool/man_marking.html` | **Man-Marking Calculator** - Calculates the impact of man-marking assignments on team ratings. Helps determine optimal marker-target combinations and the resulting rating penalties. |
| `Simulator tool/matrix_tool.html` | **Man-Marking Matrix Analyzer** - Advanced tool that simulates all possible man-marking combinations to find the optimal marking strategy. Generates a decision matrix for strategic planning. |
| `Simulator tool/substitution_tool.html` | **Substitution Planner** - Advanced scenario planner for substitutions. Allows modeling of mid-match tactical changes and their impact on expected match outcomes. |

### Training Planner Suite (`/Training planner`)

A dedicated suite for long-term team optimization and training planning.

| File | Purpose |
|------|---------|
| `Training planner/training_planner.html` | **Main Planner UI** - comprehensive tool for planning long-term training schedules, visualizing skill progression, and optimizing positions. |
| `Training planner/training_data.js` | **Training Logic** - Contains training speed formulas, skill contribution matrices, and optimization algorithms. |
| `Training planner/lineup_engine.js` | **Rating Engine** - Replicates Hattrick's rating formulas to calculate sector ratings from player skills. |
| `Training planner/simulator_lib.js` | **Optimized Simulator** - An optimized version of the core match simulator used for heavy-duty batch simulations in the planner. |
| `Training planner/meta_simulator.js` | **Batch / Tournament Simulator** - High-level controller for running large numbers of simulations (e.g. for A/B testing). |
| `Training planner/team_generator.js` | **Team Generator** - Generates optimized "virtual" teams based on sector weights for simulation purposes. |

### API Integration

| File | Purpose |
|------|---------|
| `chpp-api.js` | **CHPP API Client** - Module for interacting with Hattrick's CHPP (Certified Hattrick Product Program) API. Handles OAuth 1.0a authentication, fetches match details/lineups/player data, and parses XML responses. Includes position mapping and specialty counting logic. |

## Key Concepts

### Input Parameters

- **Midfield Rating**: Team midfield strength (determines possession)
- **Defense/Attack Ratings**: Right/Center/Left sector ratings
- **ISP (Indirect Set Pieces)**: Defensive and attacking set piece skills
- **Tactics**: Normal, Pressing, Counter-attacks (CA), Attack in Middle (AIM), Attack on Wings (AOW), Long Shots (LS), Play Creatively (PC)
- **Tactic Level**: Effectiveness of the chosen tactic (1-20)
- **Stamina**: Average team stamina affecting late-game performance
- **Specialties**: Player specialty counts by position (Quick, Head, Technical, Powerful, Unpredictable, etc.)

### Simulation Output

- Expected goals for both teams
- Win/Draw/Loss probabilities
- Score distribution matrix
- Special event breakdown

### Special Events (SE)

The simulator models various special events including:
- Corner attacks (regular and header)
- Experience-based forward events
- Quick/Technical/Head specialty attacks
- Unpredictable player events
- Winger opportunities
- Counter-attack triggers (NTCA)
- PNF (Powerful Non-Forward) and PDIM events

### Stamina System

Uses pre-computed stamina tables for Normal and Pressing tactics, modeling player fatigue across 24 time slots (including extra time).

## Technology Stack

- **Frontend**: Vanilla HTML/JavaScript with TailwindCSS for styling
- **No build step required**: All files are standalone and can be opened directly in a browser
- **CHPP Integration**: OAuth 1.0a for Hattrick API access

## Usage

1. Open any `.html` file directly in a web browser
2. Enter team ratings and configuration
3. Click "Run Simulations" to execute Monte Carlo simulation
4. Review results including win probabilities and expected scores

For CHPP integration (`index_via_chpp.html`):
1. Configure OAuth credentials
2. Enter a Match ID
3. Click "Load Match Data" to auto-populate from the API

## Architecture Notes

- All HTML tools import `simulator.js` via inline `<script>` tag (no ES modules in main pages)
- `chpp-api.js` uses ES module exports for use with the CHPP-integrated simulator
- Simulation uses configurable iteration counts (typically 10,000+ for accuracy)
- State management is handled locally within each HTML page
