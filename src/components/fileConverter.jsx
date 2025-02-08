/* eslint-disable no-unused-vars */
import * as XLSX from 'xlsx';
import useESGStore from '../store/useESGStore'; // Import the Zustand store
import { calculateESGScore } from './scoreCalculator';

class ESGFileConverter {
  static async convertFile(file) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'json') {
        throw new Error('Only JSON files are supported');
      }

      // Read and parse JSON file
      const fileContent = await this.readFile(file);
      const rawData = JSON.parse(fileContent);

      // Transform into standard ESG structure
      const convertedData = this.convertToESGFormat(rawData);

      // Update the Zustand store
      const { setESGData } = useESGStore.getState();
      setESGData(convertedData);

      return {
        success: true,
        data: convertedData
      };

    } catch (error) {
      return {
        success: false,
        error: `Conversion failed: ${error.message}`
      };
    }
  }

  static async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  static convertToESGFormat(data) {
    // Initialize the standard ESG structure
    const esgStructure = {
      environmental: {
        energy: {
          total: { years: [], values: [], unit: '' },
          breakdown: {
            direct: {
              cityGas: { years: [], values: [], unit: '' },
              lpg: { years: [], values: [], unit: '' },
              lng: { years: [], values: [], unit: '' },
              heavyFuelOil: { years: [], values: [], unit: '' },
              kerosene: { years: [], values: [], unit: '' },
              dieselFuel: { years: [], values: [], unit: '' },
              gasoline: { years: [], values: [], unit: '' }
            },
            indirect: {
              electricity: { years: [], values: [], unit: '' },
              hotWater: { years: [], values: [], unit: '' },
              steam: { years: [], values: [], unit: '' },
              districtHeat: { years: [], values: [], unit: '' }
            },
            renewable: {
              greenElectricity: { years: [], values: [], unit: '' },
              solarPower: { years: [], values: [], unit: '' },
              solarHeat: { years: [], values: [], unit: '' }
            }
          }
        },
        emissions: {
          total: { years: [], values: [], unit: '' },
          scope1: { years: [], values: [], unit: '' },
          scope2: { years: [], values: [], unit: '' },
          scope3: {
            categories: {
              purchasedGoods: { years: [], values: [], unit: '' },
              capitalGoods: { years: [], values: [], unit: '' },
              fuelEnergy: { years: [], values: [], unit: '' }
            }
          }
        },
        water: {
          consumption: {
            total: { years: [], values: [], unit: '' },
            groundwater: { years: [], values: [], unit: '' },
            pipedWater: { years: [], values: [], unit: '' }
          },
          discharge: {
            total: { years: [], values: [], unit: '' },
            publicWaters: { years: [], values: [], unit: '' },
            sewage: { years: [], values: [], unit: '' }
          }
        }
      },
      social: {
        employees: {
          global: {
            total: { years: [], values: [], unit: '' }
          }
        }
      },
      governance: {
        boardComposition: {
          total: { years: [], values: [], unit: '' },
          outside: { years: [], values: [], unit: '' },
          internal: { years: [], values: [], unit: '' },
          diversity: {}
        },
        compensation: {
          directors: {},
          auditors: {},
          executiveOfficers: {}
        },
        metadata: {
          transitionNote: '',
          references: []
        }
      },
      scores: {
        environmental: 0,
        social: 0,
        governance: 0,
        total: 0,
        environment_score: 0,
        environment_grade: '',
        environment_level: '',
        social_score: 0,
        social_grade: '',
        social_level: '',
        governance_score: 0,
        governance_grade: '',
        governance_level: '',
        total_score: 0,
        total_grade: '',
        total_level: ''
      }
    };

    // If data is already in ESG format, return it
    if (data?.environmental && data?.social && data?.governance) {
      // Calculate scores before returning
      const scores = calculateESGScore(data);
      data.scores = {
        environmental: scores.environmental.score,
        social: scores.social.score,
        governance: scores.governance.score,
        total: scores.totalScore,
        environment_score: scores.environmental.score,
        environment_grade: scores.environmental.grade,
        environment_level: scores.environmental.level,
        social_score: scores.social.score,
        social_grade: scores.social.grade,
        social_level: scores.social.level,
        governance_score: scores.governance.score,
        governance_grade: scores.governance.grade,
        governance_level: scores.governance.level,
        total_score: scores.totalScore,
        total_grade: scores.totalGrade,
        total_level: scores.totalLevel
      };
      return data;
    }

    // Helper function to map data recursively
    const mapDataToESG = (source, target) => {
      if (!source) return;

      Object.keys(target).forEach(key => {
        if (source[key] !== undefined) {
          if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
            mapDataToESG(source[key], target[key]);
          } else {
            target[key] = source[key];
          }
        }
      });
    };

    try {
      // Map the data to ESG structure
      mapDataToESG(data, esgStructure);

      // Calculate scores after mapping
      const scores = calculateESGScore(esgStructure);
      esgStructure.scores = {
        environmental: scores.environmental.score,
        social: scores.social.score,
        governance: scores.governance.score,
        total: scores.totalScore,
        environment_score: scores.environmental.score,
        environment_grade: scores.environmental.grade,
        environment_level: scores.environmental.level,
        social_score: scores.social.score,
        social_grade: scores.social.grade,
        social_level: scores.social.level,
        governance_score: scores.governance.score,
        governance_grade: scores.governance.grade,
        governance_level: scores.governance.level,
        total_score: scores.totalScore,
        total_grade: scores.totalGrade,
        total_level: scores.totalLevel
      };

      return esgStructure;
    } catch (error) {
      return esgStructure;
    }
  }
}

export default ESGFileConverter;
