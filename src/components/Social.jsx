/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Heading, Box, Card, Flex, Text, Tabs, Grid } from '@radix-ui/themes'
import { useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const Social = ({ data }) => {
    const [activeTab, setActiveTab] = useState('employees')

    // Global Employees Chart
    const getGlobalEmployeesConfig = (employees) => ({
        chart: {
            type: 'area',
            height: '300px'
        },
        title: {
            text: 'Global Employee Count'
        },
        xAxis: {
            categories: employees.years,
            title: { text: 'Years' }
        },
        yAxis: {
            title: { text: employees.unit },
            min: 0
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        Employees: ${this.y.toLocaleString()}`
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
            name: 'Global Employees',
            data: employees.values,
            color: '#4169E1'
        }]
    })

    // Olympus Corp Employee Breakdown
    const getOlympusEmployeesConfig = (olympusData) => {
        if (!olympusData?.fullTime?.total) {
            console.log('Missing olympusData structure:', olympusData);
            return {
                chart: {
                    type: 'column',
                    height: '300px'
                },
                title: {
                    text: 'Olympus Corp Employee Breakdown'
                },
                series: []
            };
        }

        return {
            chart: {
                type: 'column',
                height: '300px'
            },
            title: {
                text: 'Olympus Corp Employee Breakdown'
            },
            xAxis: {
                categories: olympusData.fullTime.total.years
            },
            yAxis: {
                title: { text: olympusData.fullTime.total.unit },
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
                            ${this.series.name}: ${this.y.toLocaleString()}<br/>
                            Total: ${this.point.stackTotal.toLocaleString()}`
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    borderRadius: 5
                }
            },
            series: [{
                name: 'Full-Time',
                data: olympusData.fullTime.total.values,
                color: '#32CD32'
            }, {
                name: 'Non-Full-Time',
                data: olympusData.nonFullTime?.total.values,
                color: '#FFD700'
            }]
        }
    }

    // Gender Distribution Chart
    const getGenderDistributionConfig = (fullTimeData) => {
        return {
            chart: {
                type: 'column',
                height: '300px'
            },
            title: {
                text: 'Gender Distribution (Full-Time)'
            },
            xAxis: {
                categories: fullTimeData.byGender.men.total.years
            },
            yAxis: {
                title: { text: fullTimeData.byGender.men.total.unit },
                stackLabels: {
                    enabled: true
                }
            },
            tooltip: {
                formatter: function() {
                    return `<b>${this.x}</b><br/>
                            ${this.series.name}: ${this.y.toLocaleString()}`
                }
            },
            plotOptions: {
                column: {
                    grouping: true,
                    borderRadius: 5
                }
            },
            series: [{
                name: 'Men',
                data: fullTimeData.byGender.men.total.values,
                color: '#4169E1'
            }, {
                name: 'Women',
                data: fullTimeData.byGender.women.total.values,
                color: '#FF69B4'
            }]
        }
    }

    // Foreign Employees Chart
    const getForeignEmployeesConfig = (foreignData) => ({
        chart: {
            type: 'line',
            height: '300px'
        },
        title: {
            text: 'Foreign Employees Trend'
        },
        xAxis: {
            categories: foreignData.total.years
        },
        yAxis: {
            title: { text: foreignData.total.unit }
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.x}</b><br/>
                        Foreign Employees: ${this.y.toLocaleString()}`
            }
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    symbol: 'diamond',
                    radius: 4
                }
            }
        },
        series: [{
            name: 'Total Foreign Employees',
            data: foreignData.total.values,
            color: '#9370DB'
        }, {
            name: 'Men',
            data: foreignData.byGender.men.values,
            color: '#4169E1'
        }, {
            name: 'Women',
            data: foreignData.byGender.women.values,
            color: '#FF69B4'
        }]
    })

    // Management Ratios Chart
    const getManagementRatiosConfig = (ratiosData) => ({
        chart: {
            type: 'column',
            height: '300px'
        },
        title: {
            text: 'Management Distribution'
        },
        xAxis: {
            categories: ['FY2024']
        },
        yAxis: {
            title: { text: ratiosData.allEmployees.unit },
            max: 100
        },
        tooltip: {
            formatter: function() {
                return `<b>${this.series.name}</b><br/>
                        ${this.y}%`
            }
        },
        plotOptions: {
            column: {
                colorByPoint: true,
                borderRadius: 5
            }
        },
        series: [{
            name: 'All Employees',
            data: [ratiosData.allEmployees.values[4]],
            color: '#4169E1'
        }, {
            name: 'Management Positions',
            data: [ratiosData.managementPositions.values[4]],
            color: '#32CD32'
        }, {
            name: 'Junior Management',
            data: [ratiosData.juniorManagement.values[4]],
            color: '#FFD700'
        }, {
            name: 'Top Management',
            data: [ratiosData.topManagement.values[4]],
            color: '#FF69B4'
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
        <Card size="3">
            <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                    <div>
                        <Heading size="6" style={{ color: 'var(--accent-9)' }}>
                            Social Metrics
                        </Heading>
                        <Text size="2" color="gray" style={{ marginTop: '-12px' }}>
                            Analyze employee demographics and diversity metrics
                        </Text>
                    </div>
                    {data?.scores?.social_score && (
                        <div style={{ width: '150px', height: '100px' }}>
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={getScoreDisplayConfig(
                                    data.scores.social_score,
                                    data.scores.social_grade,
                                    data.scores.social_level
                                )}
                            />
                        </div>
                    )}
                </Flex>

                <Tabs.Root defaultValue="employees" onValueChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Trigger value="employees">Employees</Tabs.Trigger>
                        <Tabs.Trigger value="diversity">Diversity</Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="employees">
                            <Grid columns="2" gap="4">
                                {data?.social?.employees?.global?.total && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getGlobalEmployeesConfig(data.social.employees.global.total)}
                                        />
                                    </Card>
                                )}
                                {data?.social?.employees?.olympusCorp && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getOlympusEmployeesConfig(data.social.employees.olympusCorp)}
                                        />
                                    </Card>
                                )}
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="diversity">
                            <Grid columns="2" gap="4">
                                {data?.social?.employees?.olympusCorp?.fullTime && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getGenderDistributionConfig(data.social.employees.olympusCorp.fullTime)}
                                        />
                                    </Card>
                                )}
                                {data?.social?.employees?.foreignEmployees?.olympusCorp && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getForeignEmployeesConfig(
                                                data.social.employees.foreignEmployees.olympusCorp
                                            )}
                                        />
                                    </Card>
                                )}
                                {data?.social?.employees?.managementRatios?.global && (
                                    <Card variant="classic">
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={getManagementRatiosConfig(
                                                data.social.employees.managementRatios.global
                                            )}
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

export default Social