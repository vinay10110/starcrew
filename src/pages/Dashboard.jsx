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
import { Modal, Input, Form, Select } from 'antd'
import Environmental from "../components/Environmental.jsx"
import Social from "../components/Social.jsx"
import Governance from "../components/Governance.jsx"
import industriesData from "../assets/csvjson.json"
import useESGStore from "../store/useESGStore"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
    // Implement file upload logic here
    console.log("Uploading new file...")
  }

  const handleCompareClick = () => {
    console.log('Compare button clicked')
    console.log('Current data:', data)
    console.log('Industries data:', industriesData)
    
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

  const generatePDF = async (chartContainers) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const titles = ['Environmental Performance', 'Social Performance', 'Governance Performance'];
    const sections = ['environmental', 'social', 'governance'];

    // Add title page
    pdf.setFontSize(24);
    pdf.text('ESG Performance Report', 105, 30, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(new Date().toLocaleDateString(), 105, 40, { align: 'center' });
    pdf.addPage();

    // Add each section
    for (let i = 0; i < sections.length; i++) {
        const container = chartContainers[sections[i]];
        
        // Add section title
        pdf.setFontSize(16);
        pdf.text(titles[i], 20, 20);
        
        try {
            // Create a clone of the container to avoid style interference
            const clone = container.cloneNode(true);
            document.body.appendChild(clone);
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '-9999px';
            
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                width: container.offsetWidth,
                height: container.offsetHeight
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdf.internal.pageSize.getWidth() - 40; // 20mm margins
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);

            if (i < sections.length - 1) {
                pdf.addPage();
            }
        } catch (error) {
            console.error(`Error capturing section ${sections[i]}:`, error);
        }
    }

    return pdf.output('blob');
  };

  const generateWord = async (chartContainers) => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "ESG Performance Report",
                    heading: HeadingLevel.TITLE,
                    spacing: { before: 300, after: 300 },
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    text: new Date().toLocaleDateString(),
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 800 }
                }),
                new Paragraph({
                    children: [new PageBreak()]
                })
            ]
        }]
    });

    const titles = ['Environmental Performance', 'Social Performance', 'Governance Performance'];
    const sections = ['environmental', 'social', 'governance'];

    for (let i = 0; i < sections.length; i++) {
        const container = chartContainers[sections[i]];
        
        try {
            // Create a clone of the container to avoid style interference
            const clone = container.cloneNode(true);
            document.body.appendChild(clone);
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '-9999px';

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                width: container.offsetWidth,
                height: container.offsetHeight
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const base64Data = imgData.split(',')[1];
            const binaryData = atob(base64Data);
            const byteArray = new Uint8Array(binaryData.length);
            
            for (let j = 0; j < binaryData.length; j++) {
                byteArray[j] = binaryData.charCodeAt(j);
            }

            doc.addSection({
                properties: {},
                children: [
                    new Paragraph({
                        text: titles[i],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: byteArray,
                                transformation: {
                                    width: 550,
                                    height: 300
                                }
                            })
                        ],
                        spacing: { after: 200 }
                    }),
                    ...(i < sections.length - 1 ? [
                        new Paragraph({
                            children: [new PageBreak()]
                        })
                    ] : [])
                ]
            });
        } catch (error) {
            console.error(`Error capturing section ${sections[i]}:`, error);
        }
    }

    return await Packer.toBlob(doc);
  };

  return (
    <Theme appearance={isDarkMode ? "dark" : "light"}>
      <Box className="dashboard">
        <Flex justify="between" align="center" p="4">
          <Heading size="6">ESG Dashboard</Heading>
          <Flex gap="4">
            <Button variant="soft" onClick={handleNewFileUpload}>
              <UploadIcon />
              Upload New File
            </Button>
            <Button variant="soft" onClick={handleCompareClick}>
              <BarChartIcon />
              Compare Industry
            </Button>
            <Button variant="soft" onClick={() => setOpenDialog(true)}>
              <FileTextIcon />
              Generate Report
            </Button>
            <Button variant="soft" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </Button>
          </Flex>
        </Flex>

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
          `}
        </style>
      </Box>
    </Theme>
  )
}

export default Dashboard


