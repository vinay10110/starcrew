import {create} from 'zustand';

// Define the Zustand store
const useESGStore = create((set) => ({
    esgData: {
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
              },
              waste: {
                total: { years: [], values: [], unit: '' },
                recycled: { years: [], values: [], unit: '' },
                hazardous: {
                  total: { years: [], values: [], unit: '' },
                  recycled: { years: [], values: [], unit: '' }
                }
              },
              chemicals: {
                prtrSubstances: { years: [], values: [], unit: '' },
                voc: { years: [], values: [], unit: '' }
              }
            }
          },
          social: {
            employees: {
              global: {
                total: { years: [2019, 2020, 2021, 2022, 2023], values: [1000, 1100, 1250, 1400, 1500], unit: 'employees' }
              },
              olympusCorp: {
                total: { years: [], values: [], unit: '' },
                fullTime: {
                  total: { years: [], values: [], unit: '' },
                  byGender: {
                    men: {
                      total: { years: [], values: [], unit: '' },
                      byAge: {
                        twentiesAndYounger: { years: [], values: [], unit: '' },
                        thirties: { years: [], values: [], unit: '' },
                        forties: { years: [], values: [], unit: '' },
                        fiftyAndOlder: { years: [], values: [], unit: '' }
                      }
                    },
                    women: {
                      total: { years: [], values: [], unit: '' },
                      byAge: {
                        twentiesAndYounger: { years: [], values: [], unit: '' },
                        thirties: { years: [], values: [], unit: '' },
                        forties: { years: [], values: [], unit: '' },
                        fiftyAndOlder: { years: [], values: [], unit: '' }
                      }
                    }
                  }
                }
              },
              foreignEmployees: {
                olympusCorp: {
                  total: { years: [], values: [], unit: '' },
                  byGender: {
                    men: { years: [], values: [], unit: '' },
                    women: { years: [], values: [], unit: '' }
                  }
                }
              },
              managementRatios: {
                global: {
                  allEmployees: { years: [], values: [], unit: '' },
                  managementPositions: { years: [], values: [], unit: '' },
                  juniorManagement: { years: [], values: [], unit: '' },
                  topManagement: { years: [], values: [], unit: '' }
                }
              }
            }
          },
          governance: {
            boardComposition: {
              total: { years: [2019, 2020, 2021, 2022, 2023], values: [12, 14, 15, 15, 16], unit: 'members' },
              outside: { years: [], values: [], unit: '' },
              internal: { years: [], values: [], unit: '' },
              diversity: {
                women: { years: [], values: [], unit: '' },
                foreignNationals: { years: [], values: [], unit: '' }
              }
            },
            compensation: {
              directors: {
                internal: { years: [], values: [], unit: '', notes: {} },
                outside: { years: [], values: [], unit: '', notes: {} }
              },
              auditors: {
                internal: { years: [], values: [], unit: '' },
                outside: { years: [], values: [], unit: '' }
              },
              executiveOfficers: {
                years: [], 
                values: [], 
                unit: '',
                notes: {
                  count: {},
                  general: ''
                }
              }
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
    }, // Initial state for ESG data

    setESGData: (data) => {
        console.log('Setting ESG Data in Store:', data);
        set((state) => {
            console.log('Previous State:', state.esgData);
            return { esgData: data };
        });
        console.log('New State:', useESGStore.getState().esgData);
    },

    getESGData: () => {
        const state = useESGStore.getState();
        console.log('Getting ESG Data from Store:', state.esgData);
        return state.esgData;
    },

    calculateScores: (data) => {
        // Calculate individual scores
        const environmentalScore = calculateEnvironmentalScore(data.environmental);
        const socialScore = calculateSocialScore(data.social);
        const governanceScore = calculateGovernanceScore(data.governance);

        // Update the store with calculated scores
        set({
            esgData: {
                environmental: environmentalScore,
                social: socialScore,
                governance: governanceScore,
                total: environmentalScore + socialScore + governanceScore
            }
        });
    }
}));

// Example calculation functions
const calculateEnvironmentalScore = (data) => {
    // Implement your calculation logic
    return data ? data.energy?.total?.values?.[0] || 0 : 0;
};

const calculateSocialScore = (data) => {
    // Implement your calculation logic
    return data ? data.employees?.global?.total?.values?.[0] || 0 : 0;
};

const calculateGovernanceScore = (data) => {
    // Implement your calculation logic
    return data ? data.boardComposition?.total?.values?.[0] || 0 : 0;
};

export default useESGStore; 