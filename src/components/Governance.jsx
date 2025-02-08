/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react'
import { Heading, Box, Card, Flex, Text, Tabs, Grid } from '@radix-ui/themes'
import { useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const Governance = ({ data }) => {
    const [activeTab, setActiveTab] = useState('board')

    // Score Display Chart Configuration
    const getScoreDisplayConfig = (score, grade, level) => ({
        chart: {
            type: 'column',
            height: 100,
            backgroundColor: 'transparent'
        },
        title: {
            text: `Grade: ${grade}`,
            align: 'center',
            style: { fontSize: '14px' }
        },
        subtitle: {
            text: `Level: ${level}`,
            align: 'center'
        },
        credits: {
            enabled: false
        },
        xAxis: {
            labels: { enabled: false },
            lineWidth: 0,
            tickWidth: 0
        },
        yAxis: {
            min: 0,
            max: 1000,
            title: { text: null },
            gridLineWidth: 0,
            labels: { enabled: false }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            enabled: true,
            formatter: function() {
                return `<b>Score: ${this.y}</b>`;
            }
        },
        plotOptions: {
            column: {
                borderRadius: 5,
                colorByPoint: false,
                colors: ['#4169E1'],
                dataLabels: {
                    enabled: true,
                    format: '{y}',
                    style: {
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }
                }
            }
        },
        series: [{
            name: 'Score',
            data: [score],
            color: '#4169E1'
        }]
    });

    const getResponsiveChartConfig = (baseConfig) => ({
        ...baseConfig,
        chart: {
            ...baseConfig.chart,
            height: window.innerWidth < 768 ? '200px' : '300px',
        },
        xAxis: {
            ...baseConfig.xAxis,
            labels: {
                ...baseConfig.xAxis.labels,
                rotation: window.innerWidth < 768 ? -45 : 0,
                style: {
                    fontSize: window.innerWidth < 768 ? '10px' : '12px',
                },
            },
        },
    });

    // Board Composition Chart (Stacked Column)
    const getBoardCompositionConfig = (boardData) => ({
        chart: {
            type: 'column',
            height: '300px'
        },
        title: {
            text: 'Board Composition Trends'
        },
        xAxis: {
            categories: boardData.total.years
        },
        yAxis: {
            title: { text: 'Number of Directors' },
            min: 0,
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold'
                }
            }
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        ${this.series.name}: ${this.y}<br/>
                        Total: ${this.point.stackTotal}`
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderRadius: 5
            }
        },
        series: [{
            name: 'Internal Directors',
            data: boardData.internal.values,
            color: '#4169E1'
        }, {
            name: 'Outside Directors',
            data: boardData.outside.values,
            color: '#32CD32'
        }]
    })

    // Board Diversity Chart
    const getBoardDiversityConfig = (diversityData) => ({
        chart: {
            type: 'column',
            height: '300px'
        },
        title: {
            text: 'Board Diversity'
        },
        xAxis: {
            categories: diversityData.women.years
        },
        yAxis: {
            title: { text: 'Number of Directors' },
            min: 0
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        ${this.series.name}: ${this.y}`
            }
        },
        plotOptions: {
            column: {
                grouping: true,
                borderRadius: 5
            }
        },
        series: [{
            name: 'Women Directors',
            data: diversityData.women.values,
            color: '#FF69B4'
        }, {
            name: 'Foreign Nationals',
            data: diversityData.foreignNationals.values,
            color: '#9370DB'
        }]
    })

    // Director Compensation Chart
    const getDirectorCompensationConfig = (compensationData) => ({
        chart: {
            type: 'area',
            height: '300px'
        },
        title: {
            text: 'Director Compensation Trends'
        },
        xAxis: {
            categories: compensationData.internal.years
        },
        yAxis: {
            title: { 
                text: compensationData.internal.unit
            },
            labels: {
                formatter: function() {
                    return this.value.toLocaleString()
                }
            }
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        ${this.series.name}: ${this.y.toLocaleString()} ${compensationData.internal.unit}`
            }
        },
        plotOptions: {
            area: {
                fillOpacity: 0.5,
                marker: {
                    enabled: true,
                    symbol: 'circle',
                    radius: 4
                }
            }
        },
        series: [{
            name: 'Internal Directors',
            data: compensationData.internal.values,
            color: '#DAA520'
        }, {
            name: 'Outside Directors',
            data: compensationData.outside.values,
            color: '#20B2AA'
        }]
    })

    // Executive Officers Compensation Chart
    const getExecutiveCompConfig = (execData) => ({
        chart: {
            type: 'column',
            height: '300px'
        },
        title: {
            text: 'Executive Officer Compensation'
        },
        subtitle: {
            text: execData.notes?.general || ''
        },
        xAxis: {
            categories: execData.years
        },
        yAxis: {
            title: { 
                text: execData.unit
            },
            labels: {
                formatter: function() {
                    return this.value.toLocaleString()
                }
            }
        },
        tooltip: {
            formatter: function() {
                const count = execData.notes?.count?.[this.x] || '';
                return `<b>${this.x}</b><br/>
                        Compensation: ${this.y.toLocaleString()} ${execData.unit}<br/>
                        Number of Officers: ${count}`
            }
        },
        plotOptions: {
            column: {
                colorByPoint: true,
                borderRadius: 5
            }
        },
        series: [{
            name: 'Executive Officers',
            data: execData.values
        }]
    })

    return (
        <Card size="3">
            <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                    <div>
                        <Heading size="6" style={{ color: 'var(--accent-9)' }}>
                            Governance Metrics
                        </Heading>
                        <Text size="2" color="gray" style={{ marginTop: '-12px' }}>
                            Analyze board composition, diversity, and compensation metrics
                        </Text>
                    </div>
                    {data?.scores?.governance_score && (
                        <div style={{ width: '150px', height: '100px' }}>
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={getScoreDisplayConfig(
                                    data.scores.governance_score,
                                    data.scores.governance_grade,
                                    data.scores.governance_level
                                )}
                            />
                        </div>
                    )}
                </Flex>

                <Tabs.Root defaultValue="board" onValueChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Trigger value="board">Board Structure</Tabs.Trigger>
                        <Tabs.Trigger value="compensation">Compensation</Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="board">
                            <Grid columns="2" gap="4">
                                {data?.governance?.boardComposition && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getBoardCompositionConfig(data.governance.boardComposition)}
                                        />
                                    </Card>
                                )}
                                {data?.governance?.boardComposition?.diversity && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getBoardDiversityConfig(data.governance.boardComposition.diversity)}
                                        />
                                    </Card>
                                )}
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="compensation">
                            <Grid columns="2" gap="4">
                                {data?.governance?.compensation?.directors && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getDirectorCompensationConfig(data.governance.compensation.directors)}
                                        />
                                    </Card>
                                )}
                                {data?.governance?.compensation?.executiveOfficers && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getExecutiveCompConfig(data.governance.compensation.executiveOfficers)}
                                        />
                                    </Card>
                                )}
                            </Grid>
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            </Flex>
        </Card>
    )
}

export default Governance 