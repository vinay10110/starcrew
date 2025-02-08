// Scoring weights and thresholds
const WEIGHTS = {
    ENVIRONMENTAL: {
        ENERGY: 150,
        EMISSIONS: 150,
        WATER: 100,
        WASTE: 100
    },
    SOCIAL: {
        EMPLOYEES: 200,
        DIVERSITY: 150,
        MANAGEMENT: 150
    },
    GOVERNANCE: {
        BOARD_COMPOSITION: 200,
        BOARD_DIVERSITY: 150,
        COMPENSATION: 150
    }
};

// Environmental Score Calculation
function calculateEnvironmentalScore(environmentalData) {
    try {
        let score = 0;
        
        // Energy Management (0-200 points)
        if (environmentalData.energy?.total) {
            const energyReduction = calculateReduction(environmentalData.energy.total.values);
            const renewablePercentage = calculateRenewablePercentage(environmentalData);
            score += Math.min(WEIGHTS.ENVIRONMENTAL.ENERGY, 
                (energyReduction * 100) + (renewablePercentage * 100));
        }

        // Emissions Management (0-200 points)
        if (environmentalData.emissions?.total) {
            const emissionsReduction = calculateReduction(environmentalData.emissions.total.values);
            score += Math.min(WEIGHTS.ENVIRONMENTAL.EMISSIONS, emissionsReduction * 200);
        }

        // Water Management (0-150 points)
        if (environmentalData.water?.consumption?.total) {
            const waterReduction = calculateReduction(environmentalData.water.consumption.total.values);
            score += Math.min(WEIGHTS.ENVIRONMENTAL.WATER, waterReduction * 150);
        }

        // Waste Management (0-150 points)
        if (environmentalData.waste) {
            const wasteRecyclingRate = calculateRecyclingRate(environmentalData.waste);
            score += Math.min(WEIGHTS.ENVIRONMENTAL.WASTE, wasteRecyclingRate * 150);
        }

        const finalScore = Math.round(score);
        return {
            score: finalScore,
            grade: calculateGrade(finalScore),
            level: calculateLevel(calculateGrade(finalScore))
        };
    } catch (error) {
        console.error('Error calculating environmental score:', error);
        return { score: 0, grade: 'N/A', level: 'N/A' };
    }
}

// Social Score Calculation
function calculateSocialScore(socialData) {
    try {
        let score = 0;

        // Employee Management (0-300 points)
        if (socialData.employees?.global?.total) {
            const employeeRetention = calculateRetention(socialData.employees.global.total.values);
            score += Math.min(WEIGHTS.SOCIAL.EMPLOYEES, employeeRetention * 300);
        }

        // Diversity (0-200 points)
        if (socialData.employees?.olympusCorp?.fullTime?.byGender) {
            const genderDiversity = calculateGenderDiversity(socialData);
            score += Math.min(WEIGHTS.SOCIAL.DIVERSITY, genderDiversity * 200);
        }

        // Management Ratios (0-200 points)
        if (socialData.employees?.managementRatios?.global) {
            const managementDiversity = calculateManagementDiversity(socialData);
            score += Math.min(WEIGHTS.SOCIAL.MANAGEMENT, managementDiversity * 200);
        }

        const finalScore = Math.round(score);
        return {
            score: finalScore,
            grade: calculateGrade(finalScore),
            level: calculateLevel(calculateGrade(finalScore))
        };
    } catch (error) {
        console.error('Error calculating social score:', error);
        return { score: 0, grade: 'N/A', level: 'N/A' };
    }
}

// Governance Score Calculation
function calculateGovernanceScore(governanceData) {
    try {
        let score = 0;

        // Board Composition (0-300 points)
        if (governanceData.boardComposition?.total) {
            const boardIndependence = calculateBoardIndependence(governanceData);
            score += Math.min(WEIGHTS.GOVERNANCE.BOARD_COMPOSITION, boardIndependence * 300);
        }

        // Board Diversity (0-200 points)
        if (governanceData.boardComposition?.diversity) {
            const boardDiversity = calculateBoardDiversity(governanceData);
            score += Math.min(WEIGHTS.GOVERNANCE.BOARD_DIVERSITY, boardDiversity * 200);
        }

        // Compensation Structure (0-200 points)
        if (governanceData.compensation) {
            const compensationStructure = calculateCompensationStructure(governanceData);
            score += Math.min(WEIGHTS.GOVERNANCE.COMPENSATION, compensationStructure * 200);
        }

        const finalScore = Math.round(score);
        return {
            score: finalScore,
            grade: calculateGrade(finalScore),
            level: calculateLevel(calculateGrade(finalScore))
        };
    } catch (error) {
        console.error('Error calculating governance score:', error);
        return { score: 0, grade: 'N/A', level: 'N/A' };
    }
}

// Helper Functions
function calculateReduction(values) {
    if (!Array.isArray(values) || values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return first > last ? (first - last) / first : 0;
}

function calculateRenewablePercentage(environmentalData) {
    const totalEnergy = environmentalData.energy.total.values[environmentalData.energy.total.values.length - 1];
    const renewable = Object.values(environmentalData.energy.breakdown.renewable).reduce((sum, source) => {
        return sum + source.values[source.values.length - 1];
    }, 0);
    return renewable / totalEnergy;
}

function calculateRecyclingRate(wasteData) {
    const totalWaste = wasteData.total.values[wasteData.total.values.length - 1];
    const recycledWaste = wasteData.recycled.values[wasteData.recycled.values.length - 1];
    return recycledWaste / totalWaste;
}

function calculateGenderDiversity(socialData) {
    const totalEmployees = socialData.employees.olympusCorp.fullTime.total.values[
        socialData.employees.olympusCorp.fullTime.total.values.length - 1
    ];
    const womenEmployees = socialData.employees.olympusCorp.fullTime.byGender.women.total.values[
        socialData.employees.olympusCorp.fullTime.byGender.women.total.values.length - 1
    ];
    return womenEmployees / totalEmployees;
}

function calculateManagementDiversity(socialData) {
    const managementRatio = socialData.employees.managementRatios.global.managementPositions.values[
        socialData.employees.managementRatios.global.managementPositions.values.length - 1
    ];
    return managementRatio ? managementRatio / 100 : 0;
}

function calculateBoardIndependence(governanceData) {
    const totalBoard = governanceData.boardComposition.total.values[
        governanceData.boardComposition.total.values.length - 1
    ];
    const outsideDirectors = governanceData.boardComposition.outside.values[
        governanceData.boardComposition.outside.values.length - 1
    ];
    return outsideDirectors / totalBoard;
}

function calculateBoardDiversity(governanceData) {
    const totalBoard = governanceData.boardComposition.total.values[
        governanceData.boardComposition.total.values.length - 1
    ];
    const womenDirectors = governanceData.boardComposition.diversity.women.values[
        governanceData.boardComposition.diversity.women.values.length - 1
    ];
    const foreignDirectors = governanceData.boardComposition.diversity.foreignNationals.values[
        governanceData.boardComposition.diversity.foreignNationals.values.length - 1
    ];
    return (womenDirectors + foreignDirectors) / (totalBoard * 2);
}

function calculateCompensationStructure(governanceData) {
    // Simplified compensation structure score based on presence of different compensation types
    let score = 0;
    if (governanceData.compensation.directors) score += 0.4;
    if (governanceData.compensation.executiveOfficers) score += 0.3;
    if (governanceData.compensation.auditors) score += 0.3;
    return score;
}

function calculateGrade(score) {
    if (score >= 1500) return 'AAA';
    if (score >= 1400) return 'AA';
    if (score >= 1300) return 'A';
    if (score >= 1200) return 'BBB';
    if (score >= 1100) return 'BB';
    if (score >= 1000) return 'B';
    if (score >= 900) return 'CCC';
    if (score >= 800) return 'CC';
    return 'C';
}

function calculateLevel(grade) {
    switch(grade) {
        case 'AAA':
        case 'AA':
        case 'A':
            return 'High';
        case 'BBB':
        case 'BB':
            return 'Medium';
        case 'B':
        case 'CCC':
        case 'CC':
        case 'C':
            return 'Low';
        default:
            return 'N/A';
    }
}

function calculateRetention(values) {
    if (!Array.isArray(values) || values.length < 2) return 0;
    
    // Calculate year-over-year retention rates
    let retentionRates = [];
    for (let i = 1; i < values.length; i++) {
        const previousYear = values[i - 1];
        const currentYear = values[i];
        
        // Only calculate if previous year had employees
        if (previousYear > 0) {
            // If current year has more or equal employees, consider it 100% retention
            // Otherwise calculate the retention rate
            const retentionRate = currentYear >= previousYear ? 
                1 : currentYear / previousYear;
            retentionRates.push(retentionRate);
        }
    }

    // Calculate average retention rate
    if (retentionRates.length === 0) return 0;
    const averageRetention = retentionRates.reduce((sum, rate) => sum + rate, 0) / retentionRates.length;

    // Return a value between 0 and 1
    return Math.min(1, Math.max(0, averageRetention));
}

// Calculate Total ESG Score
function calculateESGScore(data) {
    const environmental = calculateEnvironmentalScore(data.environmental);
    const social = calculateSocialScore(data.social);
    const governance = calculateGovernanceScore(data.governance);

    // Sum the scores instead of averaging
    const totalScore = environmental.score + social.score + governance.score;
    const totalGrade = calculateGrade(totalScore);
    const totalLevel = calculateLevel(totalGrade);

    return {
        environmental: {
            score: environmental.score,
            grade: environmental.grade,
            level: environmental.level
        },
        social: {
            score: social.score,
            grade: social.grade,
            level: social.level
        },
        governance: {
            score: governance.score,
            grade: governance.grade,
            level: governance.level
        },
        totalScore,
        totalGrade,
        totalLevel
    };
}

export {
    calculateESGScore,
    calculateEnvironmentalScore,
    calculateSocialScore,
    calculateGovernanceScore,
    calculateGrade,
    calculateLevel
}; 