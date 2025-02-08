import { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Card, Button, Select, Spin, Alert } from 'antd';
import useESGStore from '../store/useESGStore';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const PredictiveAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState(null);
    const [error, setError] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('social');
    const [selectedSubMetric, setSelectedSubMetric] = useState('employees.global.total');
    const esgData = useESGStore((state) => state.esgData);
    const navigate = useNavigate();

    const getMetricOptions = () => {
        return [
            { 
                value: 'environmental', 
                label: 'Environmental Metrics',
                subMetrics: [
                    { value: 'energy.total', label: 'Total Energy' },
                    { value: 'energy.breakdown.direct.cityGas', label: 'City Gas Usage' },
                    { value: 'energy.breakdown.indirect.electricity', label: 'Electricity Usage' },
                    { value: 'emissions.total', label: 'Total Emissions' },
                    { value: 'emissions.scope1', label: 'Scope 1 Emissions' },
                    { value: 'emissions.scope2', label: 'Scope 2 Emissions' },
                    { value: 'water.consumption.total', label: 'Water Consumption' },
                    { value: 'water.discharge.total', label: 'Water Discharge' }
                ]
            },
            { 
                value: 'social', 
                label: 'Social Metrics',
                subMetrics: [
                    { value: 'employees.global.total', label: 'Global Employees' },
                    { value: 'employees.olympusCorp.total', label: 'Olympus Corp Employees' },
                    { value: 'employees.foreignEmployees.olympusCorp.total', label: 'Foreign Employees' },
                    { value: 'employees.managementRatios.global.allEmployees', label: 'Management Ratio' }
                ]
            },
            { 
                value: 'governance', 
                label: 'Governance Metrics',
                subMetrics: [
                    { value: 'boardComposition.total', label: 'Total Board Members' },
                    { value: 'boardComposition.outside', label: 'Outside Directors' },
                    { value: 'boardComposition.internal', label: 'Internal Directors' },
                    { value: 'boardComposition.diversity.women', label: 'Women on Board' },
                    { value: 'boardComposition.diversity.foreignNationals', label: 'Foreign Nationals on Board' }
                ]
            }
        ];
    };

    const getMetricLabel = (metric, subMetric) => {
        const metricOption = getMetricOptions().find(m => m.value === metric);
        if (!metricOption) return '';
        const subMetricOption = metricOption.subMetrics.find(sm => sm.value === subMetric);
        return subMetricOption ? subMetricOption.label : '';
    };

    const getDataFromPath = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const prepareData = (data, metric, subMetric) => {
        try {
            const metricData = getDataFromPath(data[metric], subMetric);
            if (!metricData) return [];

            return metricData.years.map((year, index) => ({
                year,
                value: parseFloat(metricData.values[index]) || 0
            }));
        } catch (error) {
            console.error('Error preparing data:', error);
            return [];
        }
    };

    const createSequences = (data, lookback = 2) => {
        const X = [];
        const y = [];
        const values = data.map(d => d.value);
        
        for (let i = 0; i < values.length - lookback; i++) {
            X.push(values.slice(i, i + lookback));
            y.push(values[i + lookback]);
        }
        
        return [X, y];
    };

    const makePrediction = async () => {
        setLoading(true);
        setError(null);
        try {
            const historicalData = prepareData(esgData, selectedMetric, selectedSubMetric);
            
            if (historicalData.length < 4) {
                throw new Error('Need at least 4 years of historical data for reliable predictions.');
            }

            // Get the values array
            const values = historicalData.map(d => d.value);
            
            // Use last 3 points for prediction
            const lastThreePoints = values.slice(-3);
            
            // Convert to tensors
            const xsTensor = tf.tensor2d([lastThreePoints], [1, 3]);
            const ysTensor = tf.tensor2d([values[values.length - 1]], [1, 1]);

            // Normalize the data
            const xsMin = xsTensor.min();
            const xsMax = xsTensor.max();
            const ysMin = ysTensor.min();
            const ysMax = ysTensor.max();

            const normalizedXs = xsTensor.sub(xsMin).div(xsMax.sub(xsMin));

            // Create and compile the model
            const model = tf.sequential();

            model.add(tf.layers.dense({
                units: 32,
                activation: 'relu',
                inputShape: [3]
            }));

            model.add(tf.layers.dense({
                units: 16,
                activation: 'relu'
            }));

            model.add(tf.layers.dense({
                units: 1
            }));

            model.compile({
                optimizer: tf.train.adam(0.01),
                loss: 'meanSquaredError'
            });

            // Train the model
            await model.fit(normalizedXs, tf.tensor2d([1], [1, 1]), {
                epochs: 100,
                verbose: 0
            });

            // Make prediction
            const prediction = model.predict(normalizedXs);
            const denormalizedPrediction = prediction
                .mul(ysMax.sub(ysMin))
                .add(ysMin);

            const predictedValue = await denormalizedPrediction.data()[0];
            const lastYear = parseInt(historicalData[historicalData.length - 1].year.replace('FY', ''));

            setPredictions({
                historical: historicalData,
                predicted: [{
                    year: `FY${lastYear + 1}`,
                    value: Math.max(0, predictedValue)
                }]
            });

            // Cleanup
            xsTensor.dispose();
            ysTensor.dispose();
            prediction.dispose();
            denormalizedPrediction.dispose();
            model.dispose();

        } catch (error) {
            console.error('Prediction error:', error);
            setError(error.message || 'Failed to generate predictions.');
        } finally {
            setLoading(false);
        }
    };

    const getChartOptions = () => {
        if (!predictions) return {};

        const historicalData = predictions.historical;
        const predictedData = predictions.predicted;

        // Create series data with proper connection
        const historicalSeries = historicalData.map(d => d.value);
        const predictionLine = [
            historicalData[historicalData.length - 1].value, // Last historical point
            predictedData[0].value // Prediction point
        ];

        return {
            title: {
                text: `${getMetricLabel(selectedMetric, selectedSubMetric)} - Trend and Predictions`
            },
            xAxis: {
                categories: [
                    ...historicalData.map(d => d.year),
                    predictedData[0].year
                ]
            },
            yAxis: {
                title: { 
                    text: getDataFromPath(esgData[selectedMetric], selectedSubMetric)?.unit || 'Value'
                },
                min: 0
            },
            series: [{
                name: 'Historical Data',
                data: historicalSeries,
                color: '#2f7ed8',
                marker: {
                    enabled: true
                },
                zIndex: 1
            }, {
                name: 'Predictions',
                data: Array(historicalData.length - 1).fill(null).concat(predictionLine),
                color: '#c42525',
                dashStyle: 'dash',
                marker: {
                    enabled: true,
                    radius: 4
                },
                zIndex: 0
            }],
            plotOptions: {
                series: {
                    marker: {
                        enabled: true
                    },
                    connectNulls: true
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    const unit = getDataFromPath(esgData[selectedMetric], selectedSubMetric)?.unit || '';
                    return `<b>${this.x}</b><br/>` +
                        this.points.map(point => 
                            `${point.series.name}: ${point.y.toFixed(2)} ${unit}`
                        ).join('<br/>');
                }
            },
            legend: {
                enabled: true,
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
            }
        };
    };

    return (
        <div style={{ padding: '20px' }}>
            <Button 
                onClick={() => navigate('/dashboard')} 
                style={{ marginBottom: '20px' }}
            >
                Back to Dashboard
            </Button>

            <Card title="ESG Predictive Analysis">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <Select
                        style={{ width: 200 }}
                        value={selectedMetric}
                        onChange={(value) => {
                            setSelectedMetric(value);
                            const firstSubMetric = getMetricOptions().find(m => m.value === value).subMetrics[0].value;
                            setSelectedSubMetric(firstSubMetric);
                            setPredictions(null);
                            setError(null);
                        }}
                        options={getMetricOptions()}
                    />
                    <Select
                        style={{ width: 300 }}
                        value={selectedSubMetric}
                        onChange={(value) => {
                            setSelectedSubMetric(value);
                            setPredictions(null);
                            setError(null);
                        }}
                        options={getMetricOptions()
                            .find(m => m.value === selectedMetric)
                            .subMetrics}
                    />
                    <Button 
                        type="primary" 
                        onClick={makePrediction}
                        loading={loading}
                    >
                        Generate Predictions
                    </Button>
                </div>

                {loading && <Spin style={{ marginTop: 20 }} />}
                
                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        style={{ marginTop: 20 }}
                        showIcon
                    />
                )}

                {predictions && (
                    <div style={{ marginTop: 20 }}>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={getChartOptions()}
                        />
                        <Alert
                            message="Prediction Methodology"
                            description="Predictions are based on historical trends and patterns in the data. Future values may vary based on actual company performance and external factors."
                            type="info"
                            style={{ marginTop: 20 }}
                            showIcon
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PredictiveAnalysis; 