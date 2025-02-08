/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react'
import { Heading, Box, Grid, Card, Flex, Text, Tabs } from '@radix-ui/themes'
import {  useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const Environmental = ({ data }) => {
    const [activeTab, setActiveTab] = useState('energy')

    const getLatestYear = (years) => years[years.length - 1]

    
    const getEnergyTotalConfig = (energyTotal) => ({
        chart: {
            type: 'area',
            height: '300px'
        },
        title: {
            text: 'Total Energy Consumption'
        },
        xAxis: {
            categories: energyTotal.years
        },
        yAxis: {
            title: { text: energyTotal.unit },
            min: 0
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        Energy: ${this.y.toLocaleString()} ${energyTotal.unit}`
            }
        },
        plotOptions: {
            area: {
                fillOpacity: 0.5,
                marker: {
                    enabled: true,
                    radius: 4
                }
            }
        },
        series: [{
            name: 'Total Energy',
            data: energyTotal.values,
            color: '#4169E1'
        }]
    })

    const getEnergyDirectConfig = (directEnergy) => {
        const categories = Object.keys(directEnergy)
        const series = categories.map(category => ({
            name: category.replace(/([A-Z])/g, ' $1').trim(),
            data: directEnergy[category].values
        }))

        return {
            chart: {
                type: 'column',
                height: '300px'
            },
            title: {
                text: 'Direct Energy Breakdown'
            },
            xAxis: {
                categories: directEnergy[categories[0]].years
            },
            yAxis: {
                title: { text: 'MWh' },
                stackLabels: {
                    enabled: true,
                    style: { fontWeight: 'bold' }
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: { enabled: false }
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tooltip = `<b>${this.x}</b><br/>`
                    this.points.forEach(point => {
                        tooltip += `${point.series.name}: ${point.y.toLocaleString()} MWh<br/>`
                    })
                    return tooltip
                }
            },
            series: series
        }
    }

    const getEnergyIndirectConfig = (indirectEnergy) => {
        const categories = Object.keys(indirectEnergy)
        const series = categories.map(category => ({
            name: category.replace(/([A-Z])/g, ' $1').trim(),
            data: indirectEnergy[category].values
        }))

        return {
            chart: {
                type: 'column',
                height: '300px'
            },
            title: {
                text: 'Indirect Energy Consumption'
            },
            xAxis: {
                categories: indirectEnergy[categories[0]].years
            },
            yAxis: {
                title: { text: 'MWh' },
                stackLabels: {
                    enabled: true,
                    style: { fontWeight: 'bold' }
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: { enabled: false }
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tooltip = `<b>${this.x}</b><br/>`
                    this.points.forEach(point => {
                        tooltip += `${point.series.name}: ${point.y.toLocaleString()} MWh<br/>`
                    })
                    return tooltip
                }
            },
            series: series
        }
    }

    // Renewable Energy Chart
    const getRenewableEnergyConfig = (renewableEnergy) => {
        const categories = Object.keys(renewableEnergy)
        const series = categories.map(category => ({
            name: category.replace(/([A-Z])/g, ' $1').trim(),
            data: renewableEnergy[category].values
        }))

        return {
            chart: {
                type: 'area',
                height: '300px'
            },
            title: {
                text: 'Renewable Energy Sources'
            },
            xAxis: {
                categories: renewableEnergy[categories[0]].years
            },
            yAxis: {
                title: { text: 'MWh' },
                stackLabels: {
                    enabled: true,
                    style: { fontWeight: 'bold' }
                }
            },
            plotOptions: {
                area: {
                    stacking: 'normal',
                    marker: {
                        enabled: true,
                        radius: 4
                    }
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tooltip = `<b>${this.x}</b><br/>`
                    this.points.forEach(point => {
                        tooltip += `${point.series.name}: ${point.y.toLocaleString()} MWh<br/>`
                    })
                    return tooltip
                }
            },
            series: series
        }
    }

    // Emissions Charts Configuration
    const getEmissionsTotalConfig = (emissionsTotal) => ({
        chart: {
            type: 'area',
            height: '300px'
        },
        title: {
            text: 'Total Emissions'
        },
        xAxis: {
            categories: emissionsTotal.years
        },
        yAxis: {
            title: {
                text: emissionsTotal.unit
            }
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        Emissions: ${this.y.toLocaleString()} ${emissionsTotal.unit}`
            }
        },
        plotOptions: {
            area: {
                fillOpacity: 0.5,
                marker: {
                    enabled: true,
                    radius: 4
                }
            }
        },
        series: [{
            name: 'Total Emissions',
            data: emissionsTotal.values,
            color: '#8B0000'
        }]
    })

    const getScopeBreakdownConfig = (scope1, scope2, scope3) => {
        return {
            chart: {
                type: 'column',
                height: '300px'
            },
            title: {
                text: 'Emissions by Scope'
            },
            xAxis: {
                categories: scope1.years
            },
            yAxis: {
                title: { text: scope1.unit },
                stackLabels: {
                    enabled: true,
                    style: { fontWeight: 'bold' }
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tooltip = `<b>${this.x}</b><br/>`
                    this.points.forEach(point => {
                        tooltip += `${point.series.name}: ${point.y.toLocaleString()} ${scope1.unit}<br/>`
                    })
                    return tooltip
                }
            },
            series: [{
                name: 'Scope 1',
                data: scope1.values,
                color: '#FF4500'
            }, {
                name: 'Scope 2',
                data: scope2.values,
                color: '#FF8C00'
            }, {
                name: 'Scope 3',
                data: Object.values(scope3.categories).reduce((acc, curr) => {
                    return acc.map((val, idx) => val + curr.values[idx])
                }, new Array(5).fill(0)),
                color: '#FFD700'
            }]
        }
    }

    // Resources Charts Configuration
    const getWaterConsumptionConfig = (waterData) => {
        return {
            chart: {
                type: 'column',
                height: '300px'
            },
            title: {
                text: 'Water Consumption by Source'
            },
            xAxis: {
                categories: waterData.total.years
            },
            yAxis: {
                title: { text: waterData.total.unit },
                stackLabels: {
                    enabled: true,
                    style: { fontWeight: 'bold' }
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    let tooltip = `<b>${this.x}</b><br/>`
                    this.points.forEach(point => {
                        tooltip += `${point.series.name}: ${point.y.toLocaleString()} ${waterData.total.unit}<br/>`
                    })
                    return tooltip
                }
            },
            series: [{
                name: 'Ground Water',
                data: waterData.groundwater.values,
                color: '#4682B4'
            }, {
                name: 'Piped Water',
                data: waterData.pipedWater.values,
                color: '#20B2AA'
            }]
        }
    }

    const getWasteConfig = (wasteData) => ({
        chart: {
            type: 'column',
            height: '300px'
        },
        title: {
            text: 'Waste Generation and Recycling'
        },
        xAxis: {
            categories: wasteData.total.years
        },
        yAxis: {
            title: { text: wasteData.total.unit }
        },
        tooltip: {
            shared: true,
            formatter: function() {
                let tooltip = `<b>${this.x}</b><br/>`
                this.points.forEach(point => {
                    tooltip += `${point.series.name}: ${point.y.toLocaleString()} ${wasteData.total.unit}<br/>`
                })
                return tooltip
            }
        },
        plotOptions: {
            column: {
                grouping: true
            }
        },
        series: [{
            name: 'Total Waste',
            data: wasteData.total.values,
            color: '#CD853F'
        }, {
            name: 'Recycled Waste',
            data: wasteData.recycled.values,
            color: '#228B22'
        }]
    })

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

    return (
        <Card size="3" style={{ marginBottom: '32px' }}>
            <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                    <div>
                        <Heading size="6" style={{ color: 'var(--accent-9)' }}>
                            Environmental Metrics
                        </Heading>
                        <Text size="2" color="gray">
                            Comprehensive view of environmental impact metrics
                        </Text>
                    </div>
                    {data?.scores?.environment_score && (
                        <div style={{ width: '150px', height: '100px' }}>
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={getScoreDisplayConfig(
                                    data.scores.environment_score,
                                    data.scores.environment_grade,
                                    data.scores.environment_level
                                )}
                            />
                        </div>
                    )}
                </Flex>
                
                <Tabs.Root defaultValue="energy" onValueChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Trigger value="energy">Energy</Tabs.Trigger>
                        <Tabs.Trigger value="emissions">Emissions</Tabs.Trigger>
                        <Tabs.Trigger value="resources">Resources</Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="energy">
                            <Grid columns="2" gap="4">
                                {data?.environmental?.energy?.total && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getEnergyTotalConfig(data.environmental.energy.total)}
                                        />
                                    </Card>
                                )}
                                {data?.environmental?.energy?.breakdown?.direct && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getEnergyDirectConfig(data.environmental.energy.breakdown.direct)}
                                        />
                                    </Card>
                                )}
                                {data?.environmental?.energy?.breakdown?.indirect && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getEnergyIndirectConfig(data.environmental.energy.breakdown.indirect)}
                                        />
                                    </Card>
                                )}
                                {data?.environmental?.energy?.breakdown?.renewable && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getRenewableEnergyConfig(data.environmental.energy.breakdown.renewable)}
                                        />
                                    </Card>
                                )}
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="emissions">
                            <Grid columns="2" gap="4">
                                {data?.environmental?.emissions?.total && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getEmissionsTotalConfig(data.environmental.emissions.total)}
                                        />
                                    </Card>
                                )}
                                {data?.environmental?.emissions?.scope1 && 
                                 data?.environmental?.emissions?.scope2 && 
                                 data?.environmental?.emissions?.scope3 && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getScopeBreakdownConfig(
                                                data.environmental.emissions.scope1,
                                                data.environmental.emissions.scope2,
                                                data.environmental.emissions.scope3
                                            )}
                                        />
                                    </Card>
                                )}
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="resources">
                            <Grid columns="2" gap="4">
                                {data?.environmental?.water?.consumption && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getWaterConsumptionConfig(data.environmental.water.consumption)}
                                        />
                                    </Card>
                                )}
                                {data?.environmental?.waste && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getWasteConfig(data.environmental.waste)}
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

export default Environmental 