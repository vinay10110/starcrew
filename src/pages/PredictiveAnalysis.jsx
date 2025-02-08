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
    const [selectedMetric, setSelectedMetric] = useState('environmental');
    const [selectedSubMetric, setSelectedSubMetric] = useState('energy.total');
    const esgData = useESGStore((state) => state.esgData);
    const navigate = useNavigate();

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
            title: { text: 'ESG Predictive Analysis' },
            xAxis: { categories: [...predictions.historical.map(d => d.year), ...predictions.predicted.map(d => d.year)] },
            yAxis: { title: { text: 'Value' } },
            series: [
                { name: 'Historical', data: predictions.historical.map(d => d.value), color: 'blue' },
                { name: 'Prediction', data: [...Array(predictions.historical.length).fill(null), ...predictions.predicted.map(d => d.value)], color: 'red', dashStyle: 'dash' }
            ]
        };
    };

    return (
        <div style={{ padding: '20px' }}>
            <Button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>Back</Button>
            <Card title='ESG Predictive Analysis'>
                <Select style={{ width: 200 }} value={selectedMetric} onChange={value => setSelectedMetric(value)} options={getMetricOptions()} />
                <Select style={{ width: 300, marginLeft: '10px' }} value={selectedSubMetric} onChange={value => setSelectedSubMetric(value)}
                    options={getMetricOptions().find(m => m.value === selectedMetric).subMetrics} />
                <Button type='primary' onClick={makePrediction} loading={loading} style={{ marginLeft: '10px' }}>Predict</Button>
                {loading && <Spin style={{ marginTop: 20 }} />}
                {error && <Alert message='Error' description={error} type='error' style={{ marginTop: 20 }} showIcon />}
                {predictions && <HighchartsReact highcharts={Highcharts} options={getChartOptions()} />}
            </Card>
        </div>
    );
};

export default PredictiveAnalysis;
