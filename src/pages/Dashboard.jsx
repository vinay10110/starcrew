/* eslint-disable no-unused-vars */
import React, { useState } from "react"
import { Container, Heading, Box, Flex, Button, Theme, Text, ScrollArea, Card, Badge } from "@radix-ui/themes"
import { useLocation, Navigate, useNavigate } from "react-router-dom"
import {
  MoonIcon,
  SunIcon,
  FileTextIcon,
  UploadIcon,
  BarChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross2Icon,
} from "@radix-ui/react-icons"
import { Modal, Input, Form, Select, message } from 'antd'
import Environmental from "../components/Environmental.jsx"
import Social from "../components/Social.jsx"
import Governance from "../components/Governance.jsx"
import industriesData from "../assets/csvjson.json"
import useESGStore from "../store/useESGStore"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import emailjs from 'emailjs-com'
import Highcharts from 'highcharts'

import { Document, Packer, Paragraph, ImageRun, HeadingLevel, AlignmentType, PageBreak } from 'docx'
import { saveAs } from 'file-saver'

// Import Ant Design CSS
import 'antd/dist/reset.css'

const Dashboard = () => {
  const location = useLocation()
  const data = location.state?.data
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [showComparison, setShowComparison] = React.useState(false)
  const [comparisonData, setComparisonData] = React.useState({})
  const navigate = useNavigate()
  const { esgData, calculateScores } = useESGStore()
  const [currentPage, setCurrentPage] = React.useState(1)
  const companiesPerPage = 20
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [exportFormat, setExportFormat] = React.useState("pdf")
  const [emailAddress, setEmailAddress] = React.useState("")
  const [openDialog, setOpenDialog] = React.useState(false)
  const [generatedFile, setGeneratedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Add this function to calculate total score
  const calculateTotalScore = (data) => {
    if (!data || !data.scores) return null;
    
    return {
      total: data.scores.total_score,
      environmental: data.scores.environment_score,
      social: data.scores.social_score,
      governance: data.scores.governance_score,
      environmentGrade: data.scores.environment_grade,
      socialGrade: data.scores.social_grade,
      governanceGrade: data.scores.governance_grade,
      totalGrade: data.scores.total_grade,
      totalLevel: data.scores.total_level
    }
  }

  // If no data is present, redirect to home
  if (!data) {
    return <Navigate to="/" replace />
  }

  const handleNewFileUpload = () => {
    navigate('/');
  }

  const handleCompareClick = () => {

    
    const userScores = {
      total: data.scores.total_score,
      environmental: data.scores.environment_score,
      social: data.scores.social_score,
      governance: data.scores.governance_score,
      environmentGrade: data.scores.environment_grade,
      socialGrade: data.scores.social_grade,
      governanceGrade: data.scores.governance_grade,
      totalGrade: data.scores.total_grade
    }

    console.log('User scores:', userScores)

    const companiesWithScores = industriesData
      .map(company => ({
        name: company.name,
        industry: company.industry,
        totalScore: company.total_score,
        environmentScore: company.environment_score,
        socialScore: company.social_score,
        governanceScore: company.governance_score,
        environmentGrade: company.environment_grade,
        socialGrade: company.social_grade,
        governanceGrade: company.governance_grade,
        totalGrade: company.total_grade
      }))
      .sort((a, b) => b.totalScore - a.totalScore)

    const userRank = companiesWithScores.findIndex(company => company.totalScore < userScores.total)
    const actualRank = userRank === -1 ? companiesWithScores.length : userRank
    const percentile = ((actualRank / companiesWithScores.length) * 100).toFixed(1)

    console.log('Setting comparison data')
    setComparisonData({
      userScore: userScores.total,
      userGrades: {
        E: userScores.environmentGrade,
        S: userScores.socialGrade,
        G: userScores.governanceGrade,
        Total: userScores.totalGrade
      },
      rank: actualRank + 1,
      percentile,
      allCompanies: companiesWithScores,
      totalCompanies: companiesWithScores.length
    })

    console.log('Setting show comparison to true')
    setShowComparison(true)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Calculate pagination
  const indexOfLastCompany = currentPage * companiesPerPage
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage
  const currentCompanies = comparisonData.allCompanies?.slice(indexOfFirstCompany, indexOfLastCompany)
  const totalPages = Math.ceil((comparisonData.allCompanies?.length || 0) / companiesPerPage)

  const getGradeColor = (grade) => {
    const colors = {
        'AAA': 'green',
        'AA': 'blue',
        'A': 'cyan',
        'BBB': 'yellow',
        'BB': 'orange',
        'B': 'red'
    };
    return colors[grade] || 'gray';
  };

  const handleGenerateReport = async () => {
    let file
    if (exportFormat === 'pdf') {
        file = await generatePDF()
    } else {
        file = await generateWord()
    }
    setGeneratedFile(file)
  }

  const handleDirectDownload = async () => {
    try {
        setIsLoading(true);

        // Get chart containers
        const chartContainers = {
            environmental: document.getElementById('environmental-section'),
            social: document.getElementById('social-section'),
            governance: document.getElementById('governance-section')
        };

        if (!chartContainers.environmental || !chartContainers.social || !chartContainers.governance) {
            throw new Error('Could not find chart containers');
        }

        // Wait for charts to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate and download file
        let file;
        if (exportFormat === 'pdf') {
            file = await generatePDF(chartContainers);
        } else {
            file = await generateWord(chartContainers);
        }

        const fileName = `ESG_Report_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        saveAs(file, fileName);

    } catch (error) {
        console.error('Error during download:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const captureCharts = async () => {
    const charts = [];
    
    // Get all Highcharts instances
    if (Highcharts.charts) {
      Highcharts.charts.forEach(chart => {
        if (chart) {
          try {
            // Export chart as PNG with optimized settings
            const imageData = chart.toDataURL({
              format: 'png',
              width: 800,
              scale: 1
            });
            
            charts.push({
              title: chart.title ? chart.title.textStr : 'Chart',
              imageData: imageData
            });
          } catch (error) {
            console.error('Error capturing chart:', error);
          }
        }
      });
    }
    
    return charts;
  };

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      const charts = await captureCharts();
      
      if (charts.length === 0) {
        throw new Error('No charts found to generate report');
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      let yOffset = margin;

      // Add title
      pdf.setFontSize(20);
      pdf.text('ESG Report', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 40;

      // Add date
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yOffset);
      yOffset += 30;

      // Add each chart
      for (const chart of charts) {
        // Check if we need a new page
        if (yOffset + 300 > pageHeight) {
          pdf.addPage();
          yOffset = margin;
        }

        // Add chart title
        pdf.setFontSize(14);
        pdf.text(chart.title, margin, yOffset);
        yOffset += 20;

        // Add chart image
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (imgWidth * 0.6);
        
        try {
          pdf.addImage(chart.imageData, 'PNG', margin, yOffset, imgWidth, imgHeight);
          yOffset += imgHeight + 30;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const generateWord = async () => {
    try {
      const charts = await captureCharts();
      
      if (charts.length === 0) {
        throw new Error('No charts found to generate report');
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "ESG Report",
              heading: HeadingLevel.TITLE,
              spacing: { before: 300, after: 300 },
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              text: new Date().toLocaleDateString(),
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 }
            })
          ]
        }]
      });

      // Add each chart
      for (const chart of charts) {
        try {
          const binaryString = window.atob(chart.imageData.split(',')[1]);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          doc.addSection({
            properties: {},
            children: [
              new Paragraph({
                text: chart.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 }
              }),
              new Paragraph({
                children: [
                  new ImageRun({
                    data: bytes,
                    transformation: {
                      width: 500,
                      height: 300
                    }
                  })
                ],
                spacing: { after: 200 }
              })
            ]
          });
        } catch (error) {
          console.error('Error adding chart to Word document:', error);
        }
      }

      return await Packer.toBlob(doc);
    } catch (error) {
      console.error('Error generating Word document:', error);
      throw error;
    }
  };

  const handleSendReport = async () => {
    if (!emailAddress) {
      message.error("Please enter an email address.");
      return;
    }

    try {
      setIsLoading(true);
      const file = exportFormat === 'pdf' ? await generatePDF() : await generateWord();

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        try {
          const templateParams = {
            to_email: emailAddress,
            message: `ESG Report generated on ${new Date().toLocaleDateString()}`,
            attachment: base64data,
            filename: `ESG_Report.${exportFormat}`
          };

          await emailjs.send(
            'your_service_id',
            'your_template_id',
            templateParams,
            'your_user_id'
          );

          message.success("Email sent successfully!");
          setOpenDialog(false);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          message.error(
            emailError.status === 413 
              ? "File is too large to send via email. Please use the download option." 
              : "Failed to send email. Please try downloading instead."
          );
        }
      };
    } catch (error) {
      console.error("Failed to generate report:", error);
      message.error("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Theme appearance={isDarkMode ? "dark" : "light"}>
      <Box className="dashboard">
        <Box
          style={{
            backgroundColor: 'var(--accent-2)',
            padding: '16px 24px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid var(--gray-6)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <Flex justify="between" align="center" wrap="wrap">
            <Heading size="6" style={{ color: 'var(--accent-9)', flex: '1 1 auto' }}>
              ESG Dashboard
            </Heading>
            <Flex gap="4" wrap="wrap" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
              <Button variant="soft" onClick={handleNewFileUpload} style={{ display: 'flex', alignItems: 'center' }}>
                <UploadIcon />
                <Text style={{ marginLeft: '8px' }}>Upload New File</Text>
              </Button>
              <Button variant="soft" onClick={handleCompareClick} style={{ display: 'flex', alignItems: 'center' }}>
                <BarChartIcon />
                <Text style={{ marginLeft: '8px' }}>Compare Industry</Text>
              </Button>
              <Button variant="soft" onClick={() => setOpenDialog(true)} style={{ display: 'flex', alignItems: 'center' }}>
                <FileTextIcon />
                <Text style={{ marginLeft: '8px' }}>Generate Report</Text>
              </Button>
              <Button variant="soft" onClick={() => setIsDarkMode(!isDarkMode)} style={{ display: 'flex', alignItems: 'center' }}>
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
                <Text style={{ marginLeft: '8px' }}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Text>
              </Button>
              <Button 
                type="primary"
                onClick={() => navigate('/predictive-analysis')}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <BarChartIcon />
                <Text style={{ marginLeft: '8px' }}>Predictive Analysis</Text>
              </Button>
            </Flex>
          </Flex>
        </Box>

        <Container size="4" style={{ padding: "40px 20px" }}>
          <div id="environmental-section">
            <Environmental data={data} />
          </div>
          <div id="social-section">
            <Social data={data} />
          </div>
          <div id="governance-section">
            <Governance data={data} />
          </div>
        </Container>

        {/* Industry Comparison Sidebar */}
        {showComparison && (
          <Box
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '400px',
              height: '100vh',
              background: 'var(--gray-1)',
              borderLeft: '1px solid var(--gray-6)',
              padding: '20px',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            <Flex justify="between" align="center" mb="4">
              <Heading size="4">Industry Comparison</Heading>
              <Button 
                variant="ghost" 
                onClick={() => setShowComparison(false)}
              >
                <Cross2Icon />
              </Button>
            </Flex>

            <ScrollArea style={{ height: 'calc(100vh - 80px)' }}>
              {/* User's Performance Card */}
              <Card 
                style={{ 
                  backgroundColor: 'var(--accent-3)', 
                  border: '2px solid var(--accent-6)',
                  marginBottom: '24px'
                }}
              >
                <Flex direction="column" gap="2">
                  <Text size="4" weight="bold">Your Performance</Text>
                  <Flex justify="between" align="center">
                    <Text>Rank: #{comparisonData.rank} of {comparisonData.totalCompanies}</Text>
                    <Text weight="bold">Score: {comparisonData.userScore}</Text>
                  </Flex>
                  <Flex gap="1" justify="end">
                    <Badge color={getGradeColor(comparisonData.userGrades?.E)}>
                      E: {comparisonData.userGrades?.E}
                    </Badge>
                    <Badge color={getGradeColor(comparisonData.userGrades?.S)}>
                      S: {comparisonData.userGrades?.S}
                    </Badge>
                    <Badge color={getGradeColor(comparisonData.userGrades?.G)}>
                      G: {comparisonData.userGrades?.G}
                    </Badge>
                  </Flex>
                  <Text size="2" color="gray">
                    Top {comparisonData.percentile}% of companies
                  </Text>
                </Flex>
              </Card>

              {/* Companies List */}
              <Box mb="4">
                <Text size="4" weight="bold" mb="3">All Companies (Ranked)</Text>
                {currentCompanies?.map((company, index) => (
                  <Card 
                    key={company.name}
                    style={{
                      backgroundColor: 
                        indexOfFirstCompany + index < 3 
                          ? 'var(--accent-2)' 
                          : 'var(--gray-2)',
                      marginBottom: '8px'
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Flex gap="2" align="center">
                          <Text weight="bold">
                            #{indexOfFirstCompany + index + 1} {company.name}
                          </Text>
                          {indexOfFirstCompany + index < 3 && (
                            <Badge color="gold" variant="soft">
                              Top {indexOfFirstCompany + index + 1}
                            </Badge>
                          )}
                        </Flex>
                        <Text size="2" color="gray">Industry: {company.industry}</Text>
                      </Flex>
                      <Flex direction="column" align="end" gap="1">
                        <Text weight="bold">Score: {company.totalScore}</Text>
                        <Flex gap="1">
                          <Badge color={getGradeColor(company.environmentGrade)}>
                            E: {company.environmentGrade}
                          </Badge>
                          <Badge color={getGradeColor(company.socialGrade)}>
                            S: {company.socialGrade}
                          </Badge>
                          <Badge color={getGradeColor(company.governanceGrade)}>
                            G: {company.governanceGrade}
                          </Badge>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Box>

              {/* Pagination Controls */}
              <Flex gap="2" justify="center" align="center" mt="4">
                <Button 
                  variant="soft" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon />
                </Button>
                <Text>
                  Page {currentPage} of {totalPages}
                </Text>
                <Button 
                  variant="soft" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon />
                </Button>
              </Flex>
            </ScrollArea>
          </Box>
        )}

        {/* Updated Ant Design Modal */}
        <Modal
          title={
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: 600,
              color: '#000000'
            }}>
              Generate Report
            </Text>
          }
          open={openDialog}
          onCancel={() => {
            if (!isLoading) {
                setOpenDialog(false)
                setGeneratedFile(null)
            }
          }}
          footer={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '12px 0'
            }}>
              <Button 
                key="cancel"
                onClick={() => {
                    if (!isLoading) {
                        setOpenDialog(false)
                        setGeneratedFile(null)
                    }
                }}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: isLoading ? '#999999' : '#000000',
                  padding: '0 20px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Cancel
              </Button>
              <Button
                key="send"
                onClick={handleSendReport}
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#4b5563' : '#2563eb',
                  color: '#ffffff',
                  padding: '0 20px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? (
                    <>
                        <span className="loading-spinner"></span>
                        Processing...
                    </>
                ) : (
                    'Send Report'
                )}
              </Button>
              <Button
                key="download"
                onClick={handleDirectDownload}
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#4b5563' : '#2563eb',
                  color: '#ffffff',
                  padding: '0 20px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? (
                    <>
                        <span className="loading-spinner"></span>
                        Processing...
                    </>
                ) : (
                    `Download ${exportFormat.toUpperCase()}`
                )}
              </Button>
            </div>
          }
          width={500}
          closable={!isLoading}
          maskClosable={!isLoading}
          style={{
            top: 20
          }}
        >
          <Form 
            layout="vertical"
            style={{
              padding: '20px 0'
            }}
          >
            <Form.Item 
              label={
                <Text style={{ 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000'
                }}>
                  Export Format
                </Text>
              }
              style={{ marginBottom: 24 }}
            >
              <Select
                value={exportFormat}
                onChange={(value) => setExportFormat(value)}
                options={[
                  { value: 'pdf', label: 'PDF' },
                  { value: 'word', label: 'Word Document' }
                ]}
                disabled={isLoading}
                style={{ 
                  width: '100%',
                  height: '36px'
                }}
              />
            </Form.Item>
            
            <Form.Item 
              label={
                <Text style={{ 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000'
                }}>
                  Email Address
                </Text>
              }
              extra="Note: For large reports, please use the download option."
              style={{ marginBottom: 24 }}
            >
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter your email"
                style={{
                  height: '36px',
                  borderRadius: '6px'
                }}
              />
            </Form.Item>
          </Form>

          <div style={{ marginTop: '16px', color: 'var(--gray-11)' }}>
            <Text size="2">
              * Email delivery is limited to files under 5MB. For larger reports, please use the download option.
            </Text>
          </div>
        </Modal>

        {/* Regular style tag instead of jsx */}
        <style>
          {`
            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            @media (max-width: 768px) {
              .dashboard {
                padding: 8px;
              }
              .dashboard .ant-btn {
                flex: 1 1 100%;
                margin-bottom: 8px;
              }
              .dashboard .ant-btn:last-child {
                margin-bottom: 0;
              }
            }
          `}
        </style>
      </Box>
    </Theme>
  )
}

export default Dashboard


