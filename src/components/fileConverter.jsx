/* eslint-disable no-unused-vars */
import * as XLSX from 'xlsx';
import useESGStore from '../store/useESGStore'; // Import the Zustand store
import { calculateESGScore } from './scoreCalculator';
import { supabase } from './supabaseClient';

class ESGFileConverter {
  static async convertFile(file, userEmail) {
    try {
      if (!file || !userEmail) {
        throw new Error('No file or user email provided');
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let rawData;
      let jsonContent;

      if (fileExtension !== 'json') {
        throw new Error('Please upload a JSON file');
      }

      jsonContent = await this.readFile(file);
      try {
        rawData = JSON.parse(jsonContent);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }

      const standardizedData = this.convertToESGFormat(rawData);

      try {
        const { data: existingData, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .eq('email', userEmail)
          .eq('filename', file.name);

        if (fetchError) {
          throw new Error(`Failed to check existing data: ${fetchError.message}`);
        }

        if (!existingData || existingData.length === 0) {
          const insertData = {
            email: userEmail,
            filename: file.name,
            data: standardizedData,
            created_at: new Date().toISOString()
          };

          const { data: insertedData, error: uploadError } = await supabase
            .from('reports')
            .insert([insertData])
            .select();

          if (uploadError) {
            throw new Error(`Failed to save data: ${uploadError.message}`);
          }

          return {
            success: true,
            data: standardizedData,
            isNewUpload: true
          };
        } else {
          return {
            success: true,
            data: existingData[0].data,
            isNewUpload: false
          };
        }
      } catch (dbError) {
        throw new Error(`Database operation failed: ${dbError.message}`);
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
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

  static async csvToJson(file) {
    try {
      const csvContent = await this.readFile(file);
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(header => header.trim().toLowerCase());

      return {
        headers: headers,
        rows: lines.slice(1).map(line => line.split(',').map(item => item.trim()))
      };

    } catch (error) {
      throw new Error(`CSV reading failed: ${error.message}`);
    }
  }

  static async excelToJson(file) {
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const rawData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              raw: false,
              defval: ''
            });

            const headers = rawData[0].map(h => h?.toLowerCase() || '');
            const jsonData = rawData.slice(1).map(row => {
              const rowData = {};
              headers.forEach((header, index) => {
                if (header) {
                  const value = row[index];
                  rowData[header] = isNaN(value) ? value : Number(value);
                }
              });
              return rowData;
            });

            resolve({
              headers: headers,
              rows: jsonData
            });

          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
        
        reader.readAsBinaryString(file);
      });

      return data;

    } catch (error) {
      throw new Error(`Excel reading failed: ${error.message}`);
    }
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
