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

import { Document, Packer, Paragraph, ImageRun, HeadingLevel, AlignmentType, PageBreak, TextRun } from 'docx'
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

  // Add separate loading states for each button
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    try {
      setIsLoading(true);
      const charts = await captureCharts();

      // Create PowerPoint presentation
      const pptx = new pptxgen();

      // Title Slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText("ESG Performance Analysis", {
        x: 0.5,
        y: 1.5,
        w: '90%',
        h: 1.5,
        fontSize: 44,
        color: '363636',
        bold: true,
        align: 'center'
      });

      titleSlide.addText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 0.5,
        y: 3.5,
        fontSize: 20,
        color: '666666',
        align: 'center'
      });

      // Scores Overview Slide
      const scoresSlide = pptx.addSlide();
      scoresSlide.addText("ESG Scores Overview", {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        color: '363636',
        bold: true
      });

      const scoreData = [
        ["Category", "Score", "Grade", "Level"],
        ["Environmental", data.scores.environment_score, data.scores.environment_grade, data.scores.environment_level],
        ["Social", data.scores.social_score, data.scores.social_grade, data.scores.social_level],
        ["Governance", data.scores.governance_score, data.scores.governance_grade, data.scores.governance_level],
        ["Total", data.scores.total_score, data.scores.total_grade, data.scores.total_level]
      ];

      scoresSlide.addTable(scoreData, {
        x: 0.5,
        y: 1.5,
        w: 9,
        colW: [2.5, 2, 2, 2.5],
        fontSize: 16,
        border: { pt: 1, color: "666666" },
        align: "center"
      });

      // Add chart slides
      for (const chart of charts) {
        const slide = pptx.addSlide();
        
        // Add title
        slide.addText(chart.title, {
          x: 0.5,
          y: 0.5,
          fontSize: 24,
          color: '363636',
          bold: true
        });

        // Add chart image
        slide.addImage({
          data: chart.imageData,
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 4.5
        });

        // Add analysis text
        slide.addText(getAnalysisText(chart.title, data), {
          x: 0.5,
          y: 6,
          w: 9,
          fontSize: 14,
          color: '666666',
          bullet: true
        });
      }

      // Recommendations Slide
      const recomSlide = pptx.addSlide();
      recomSlide.addText("Key Recommendations", {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        color: '363636',
        bold: true
      });

      const recommendations = getRecommendations(data);
      recomSlide.addText(recommendations, {
        x: 0.5,
        y: 1.5,
        w: 9,
        fontSize: 16,
        color: '666666',
        bullet: true,
        lineSpacing: 40
      });

      // Save or email the presentation
      if (emailAddress) {
        const pptxBuffer = await pptx.write('base64');
        await sendEmail(emailAddress, pptxBuffer);
        message.success('Report sent successfully to ' + emailAddress);
      } else {
        await pptx.writeFile('ESG_Performance_Report.pptx');
        message.success('Report downloaded successfully');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleDirectDownload = async () => {
    try {
      setIsDownloading(true);
      const file = await generateWord();
      const fileName = `ESG_Report.docx`;
      saveAs(file, fileName);
      message.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      message.error("Failed to generate report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const captureCharts = async () => {
    const chartElements = document.querySelectorAll('.highcharts-container');
    const chartData = [];

    for (const element of chartElements) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: null,
          logging: false
        });
        
        const title = element.closest('.rt-Card')?.querySelector('.rt-Heading')?.textContent || 'Chart';
        
        chartData.push({
          title: title,
          imageData: canvas.toDataURL('image/png')
        });
      } catch (error) {
        console.error('Error capturing chart:', error);
      }
    }

    return chartData;
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
            // Title Page
            new Paragraph({
              text: "ESG Performance Analysis Report",
              heading: HeadingLevel.TITLE,
              spacing: { before: 300, after: 300 },
              alignment: AlignmentType.CENTER
            }),
            
            // Executive Summary
            new Paragraph({
              text: "Executive Summary",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: `This report provides a comprehensive analysis of the organization's Environmental, Social, and Governance (ESG) performance. The analysis covers key metrics across all three ESG dimensions, with detailed breakdowns of energy consumption, emissions, workforce diversity, and governance structures.`,
              spacing: { after: 200 }
            }),

            // Scores Overview
            new Paragraph({
              text: "ESG Scores Overview",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Environmental Score: ${data.scores.environment_score} (Grade ${data.scores.environment_grade})\n`,
                  bold: true
                }),
                new TextRun({
                  text: `Social Score: ${data.scores.social_score} (Grade ${data.scores.social_grade})\n`,
                  bold: true
                }),
                new TextRun({
                  text: `Governance Score: ${data.scores.governance_score} (Grade ${data.scores.governance_grade})\n`,
                  bold: true
                }),
                new TextRun({
                  text: `Overall ESG Score: ${data.scores.total_score} (Grade ${data.scores.total_grade})`,
                  bold: true
                })
              ],
              spacing: { after: 200 }
            })
          ]
        }]
      });

      // Add sections for each chart with analysis
      for (const chart of charts) {
        try {
          // Add section heading
          doc.addSection({
            children: [
              new Paragraph({
                text: chart.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
              }),
              
              // Add analysis text based on chart type
              new Paragraph({
                text: getChartAnalysis(chart.title, data),
                spacing: { before: 100, after: 100 }
              }),
              
              // Add chart image
              new Paragraph({
                children: [
                  new ImageRun({
                    data: chart.imageData,
                    transformation: {
                      width: 600,
                      height: 400
                    }
                  })
                ],
                spacing: { after: 200 }
              })
            ]
          });
        } catch (error) {
          console.error('Error adding chart section:', error);
        }
      }

      // Add recommendations section
      doc.addSection({
        children: [
          new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: generateRecommendations(data),
            spacing: { after: 200 }
          })
        ]
      });

      return await Packer.toBlob(doc);
    } catch (error) {
      console.error('Error generating Word document:', error);
      throw error;
    }
  };

  // Helper function to generate analysis text for each chart
  const getChartAnalysis = (chartTitle, data) => {
    switch (chartTitle) {
      case 'Indirect Energy Consumption':
        return `Analysis of indirect energy consumption shows ${getEnergyTrend(data.environmental.energy.breakdown.indirect)}. This indicates ${getEnergyImplication(data.environmental.energy.breakdown.indirect)}.`;
      
      case 'Renewable Energy Sources':
        return `The organization's renewable energy adoption ${getRenewablesTrend(data.environmental.energy.breakdown.renewable)}. This demonstrates ${getRenewablesImplication(data.environmental.energy.breakdown.renewable)}.`;
      
      case 'Emissions by Scope':
        return `Carbon emissions across all scopes show ${getEmissionsTrend(data.environmental.emissions)}. Key areas for improvement include ${getEmissionsRecommendation(data.environmental.emissions)}.`;
      
      // Add more cases for other chart types
      
      default:
        return 'Detailed analysis of the metrics shows important trends in ESG performance.';
    }
  };

  // Helper function to generate recommendations
  const generateRecommendations = (data) => {
    const recommendations = [];
    
    // Environmental recommendations
    if (data.scores.environment_score < 400) {
      recommendations.push("• Implement more aggressive energy efficiency measures");
      recommendations.push("• Increase renewable energy adoption");
      recommendations.push("• Develop comprehensive emissions reduction strategy");
    }
    
    // Social recommendations
    if (data.scores.social_score < 400) {
      recommendations.push("• Enhance diversity and inclusion programs");
      recommendations.push("• Strengthen employee development initiatives");
      recommendations.push("• Improve workplace safety measures");
    }
    
    // Governance recommendations
    if (data.scores.governance_score < 400) {
      recommendations.push("• Strengthen board independence");
      recommendations.push("• Enhance transparency in reporting");
      recommendations.push("• Implement stronger risk management frameworks");
    }
    
    return recommendations.join("\n");
  };

  const handleSendReport = async () => {
    if (!emailAddress) {
      message.error("Please enter an email address.");
      return;
    }

    try {
      setIsEmailSending(true);
      const file = await generateWord();

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        try {
          const templateParams = {
            to_email: emailAddress,
            message: `ESG Report generated on ${new Date().toLocaleDateString()}`,
            attachment: base64data,
            filename: `ESG_Report.docx`
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
      setIsEmailSending(false);
    }
  };

  const handlePredictiveAnalysisClick = () => {
    navigate('/predictive-analysis', { 
      state: { data: esgData }, // Pass the current data
      replace: false // Don't replace the history entry
    });
  };

  // Helper function for analysis text
  const getAnalysisText = (chartTitle, data) => {
    const analysis = [];
    
    switch (chartTitle) {
      case 'Environmental Metrics':
        analysis.push(`Total energy consumption shows ${getTrend(data.environmental?.energy?.total)} trend`);
        analysis.push(`Emissions performance is ${getEmissionsStatus(data.environmental?.emissions)}`);
        analysis.push(`Resource utilization efficiency is ${getResourceEfficiency(data.environmental)}`);
        break;

      case 'Social Metrics':
        analysis.push(`Employee diversity metrics indicate ${getDiversityStatus(data.social)}`);
        analysis.push(`Workforce development shows ${getWorkforceStatus(data.social)}`);
        analysis.push(`Community engagement level is ${getCommunityStatus(data.social)}`);
        break;

      case 'Governance Metrics':
        analysis.push(`Board composition reflects ${getBoardStatus(data.governance)}`);
        analysis.push(`Corporate policies demonstrate ${getPolicyStatus(data.governance)}`);
        analysis.push(`Risk management framework is ${getRiskStatus(data.governance)}`);
        break;

      default:
        analysis.push('Detailed analysis of metrics shows important trends in ESG performance');
    }

    return analysis;
  };

  // Helper function for recommendations
  const getRecommendations = (data) => {
    const recommendations = [];

    // Environmental recommendations
    if (data.scores.environment_score < 500) {
      recommendations.push("Implement energy efficiency initiatives");
      recommendations.push("Increase renewable energy adoption");
      recommendations.push("Develop comprehensive emissions reduction strategy");
    }

    // Social recommendations
    if (data.scores.social_score < 500) {
      recommendations.push("Enhance diversity and inclusion programs");
      recommendations.push("Strengthen employee development initiatives");
      recommendations.push("Improve workplace safety measures");
    }

    // Governance recommendations
    if (data.scores.governance_score < 500) {
      recommendations.push("Strengthen board independence");
      recommendations.push("Enhance transparency in reporting");
      recommendations.push("Implement stronger risk management frameworks");
    }

    return recommendations;
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
                onClick={handlePredictiveAnalysisClick}
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
            if (!isEmailSending && !isDownloading) {
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
                  if (!isEmailSending && !isDownloading) {
                    setOpenDialog(false)
                    setGeneratedFile(null)
                  }
                }}
                disabled={isEmailSending || isDownloading}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: (isEmailSending || isDownloading) ? '#999999' : '#000000',
                  padding: '0 20px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (isEmailSending || isDownloading) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Cancel
              </Button>
              <Button
                key="send"
                onClick={handleSendReport}
                disabled={isEmailSending || isDownloading}
                style={{
                  backgroundColor: isEmailSending ? '#4b5563' : '#2563eb',
                  color: '#ffffff',
                  padding: '0 20px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isEmailSending ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isEmailSending ? (
                  <>
                    <span className="loading-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Report'
                )}
              </Button>
              <Button
                key="download"
                onClick={handleDirectDownload}
                disabled={isEmailSending || isDownloading}
                style={{
                  backgroundColor: isDownloading ? '#4b5563' : '#2563eb',
                  color: '#ffffff',
                  padding: '0 20px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isDownloading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Downloading...
                  </>
                ) : (
                  'Download Report'
                )}
              </Button>
            </div>
          }
          width={500}
          closable={!isEmailSending && !isDownloading}
          maskClosable={!isEmailSending && !isDownloading}
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
                disabled={isEmailSending || isDownloading}
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


