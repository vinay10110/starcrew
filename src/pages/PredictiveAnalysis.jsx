/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Card, Button, Select, Spin, Alert } from 'antd';
import useESGStore from '../store/useESGStore';
import { useNavigate, useLocation } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ArrowLeftOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const PageContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StyledCard = styled(Card)`
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: var(--gray-1);

  .ant-card-head {
    padding: 16px 24px;
    border-bottom: 1px solid var(--gray-5);
    
    .ant-card-head-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--gray-12);
    }
  }

  @media (max-width: 768px) {
    .ant-card-head-title {
      font-size: 1.1rem;
    }
  }
`;

const BackButton = styled(Button)`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(-4px);
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const StyledSelect = styled(Select)`
  min-width: 200px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PredictButton = styled(Button)`
  background: linear-gradient(to right, var(--accent-9), var(--accent-10));
  border: none;
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ChartContainer = styled.div`
  margin-top: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--gray-2);
  padding: 16px;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 40px 0;
`;

const PredictiveAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState(null);
    const [error, setError] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('environmental');
    const [selectedSubMetric, setSelectedSubMetric] = useState('energy.total');
    const esgData = useESGStore((state) => state.esgData);
    const setESGData = useESGStore((state) => state.setESGData);
    const user = useESGStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.data) {
            setESGData(location.state.data);
        }
        else if (!esgData) {
            navigate('/', { replace: true });
        }
    }, [location.state, esgData, setESGData, navigate]);

    const getMetricOptions = () => [
        { 
            value: 'environmental', 
            label: 'Environmental Metrics',
            subMetrics: [
                { value: 'energy.total', label: 'Total Energy' },
                { value: 'emissions.total', label: 'Total Emissions' },
                { value: 'water.consumption.total', label: 'Water Consumption' }
            ]
        },
        { 
            value: 'social', 
            label: 'Social Metrics',
            subMetrics: [
                { value: 'employees.global.total', label: 'Global Employees' }
            ]
        },
        { 
            value: 'governance', 
            label: 'Governance Metrics',
            subMetrics: [
                { value: 'boardComposition.total', label: 'Total Board Members' }
            ]
        }
    ];

    const getDataFromPath = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

    const prepareData = (data, metric, subMetric) => {
        try {
            const metricData = getDataFromPath(data[metric], subMetric);
            if (!metricData) return [];

            return metricData.years.map((year, index) => ({
                year,
                value: parseFloat(metricData.values[index]) || 0
            }));
        } catch (error) {
            return [];
        }
    };

    const makePrediction = async () => {
        setLoading(true);
        setError(null);
        try {
            const historicalData = prepareData(esgData, selectedMetric, selectedSubMetric);
            if (historicalData.length < 5) throw new Error('At least 5 years of data required.');

            const values = historicalData.map(d => d.value);
            const sequenceLength = 3;
            const X = [];
            const y = [];

            for (let i = 0; i < values.length - sequenceLength; i++) {
                X.push(values.slice(i, i + sequenceLength));
                y.push(values[i + sequenceLength]);
            }

            const xsTensor = tf.tensor2d(X);
            const ysTensor = tf.tensor1d(y);

            const model = tf.sequential();
            model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [sequenceLength] }));
            model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
            model.add(tf.layers.dense({ units: 1 }));

            model.compile({ optimizer: tf.train.adam(), loss: 'meanSquaredError' });
            await model.fit(xsTensor, ysTensor, { epochs: 150, batchSize: 8 });

            let futureValues = [...values.slice(-sequenceLength)];
            let predictionsArray = [];
            const startYear = 2025;
            const endYear = 2029;

            for (let year = startYear; year <= endYear; year++) {
                const inputTensor = tf.tensor2d([futureValues.slice(-sequenceLength)]);
                const prediction = model.predict(inputTensor).dataSync()[0];
                predictionsArray.push({ year: `FY${year}`, value: prediction });
                futureValues.push(prediction);
            }

            setPredictions({ historical: historicalData, predicted: predictionsArray });
            model.dispose();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getChartOptions = () => {
        if (!predictions) return {};

        return {
            chart: {
                type: 'line',
                style: {
                    fontFamily: 'inherit'
                },
                backgroundColor: 'transparent'
            },
            title: { 
                text: 'ESG Predictive Analysis',
                style: {
                    fontSize: '16px',
                    fontWeight: '600'
                }
            },
            xAxis: {
                categories: [...predictions.historical.map(d => d.year), ...predictions.predicted.map(d => d.year)],
                labels: {
                    style: {
                        color: 'var(--gray-11)'
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Value',
                    style: {
                        color: 'var(--gray-11)'
                    }
                },
                gridLineColor: 'var(--gray-4)'
            },
            series: [
                {
                    name: 'Historical',
                    data: predictions.historical.map(d => d.value),
                    color: 'var(--accent-9)',
                    marker: {
                        symbol: 'circle'
                    }
                },
                {
                    name: 'Prediction',
                    data: [...Array(predictions.historical.length).fill(null), ...predictions.predicted.map(d => d.value)],
                    color: 'var(--accent-11)',
                    dashStyle: 'dash',
                    marker: {
                        symbol: 'diamond'
                    }
                }
            ],
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            align: 'center',
                            verticalAlign: 'bottom',
                            layout: 'horizontal'
                        }
                    }
                }]
            }
        };
    };

    const handleBack = () => {
        navigate('/dashboard', { 
            state: { data: esgData },
            replace: true 
        });
    };

    return (
        <PageContainer>
            <BackButton onClick={handleBack}>
                <ArrowLeftOutlined /> Back to Dashboard
            </BackButton>
            
            <StyledCard title='ESG Predictive Analysis'>
                <ControlsContainer>
                    <StyledSelect 
                        value={selectedMetric} 
                        onChange={value => setSelectedMetric(value)} 
                        options={getMetricOptions()} 
                    />
                    <StyledSelect 
                        value={selectedSubMetric} 
                        onChange={value => setSelectedSubMetric(value)}
                        options={getMetricOptions().find(m => m.value === selectedMetric).subMetrics} 
                    />
                    <PredictButton onClick={makePrediction} loading={loading}>
                        Predict
                    </PredictButton>
                </ControlsContainer>

                {loading && (
                    <LoadingContainer>
                        <Spin size="large" />
                    </LoadingContainer>
                )}

                {error && (
                    <Alert 
                        message="Error" 
                        description={error} 
                        type="error" 
                        showIcon 
                        style={{ marginTop: 20 }} 
                    />
                )}

                {predictions && (
                    <ChartContainer>
                        <HighchartsReact 
                            highcharts={Highcharts} 
                            options={getChartOptions()} 
                        />
                    </ChartContainer>
                )}
            </StyledCard>
        </PageContainer>
    );
};

export default PredictiveAnalysis;
