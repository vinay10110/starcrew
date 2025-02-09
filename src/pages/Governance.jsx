/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { useESGStore } from '../stores/esgStore';
import { Text } from '@chakra-ui/react';

const getBoardDiversityConfig = (data) => {
  // Add null check and default values
  const years = data?.governance?.boardComposition?.diversity?.years || [];
  const values = data?.governance?.boardComposition?.diversity?.values || [];

  return {
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Board Diversity Trend',
        },
      },
    },
    data: {
      labels: years,
      datasets: [
        {
          label: 'Diversity Percentage',
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    },
  };
};

const Governance = () => {
  const esgData = useESGStore((state) => state.esgData);
  
  // Add null check for esgData
  if (!esgData || !esgData.governance) {
    return (
      <div>
        <Text>No governance data available</Text>
      </div>
    );
  }

  const boardDiversityConfig = getBoardDiversityConfig(esgData);
  
  // ... rest of the component ...
};
