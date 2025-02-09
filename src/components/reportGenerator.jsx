/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import React, { useState } from "react";
import { Container, Heading, Box, Flex, Button, Theme, Text, Modal, Input, Form, Dialog } from "@radix-ui/themes";
import emailjs from 'emailjs-com';


// Utility function to capture a specific section
const captureSection = async (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) {
        throw new Error(`Section ${sectionId} not found`);
    }

    try {
        const canvas = await html2canvas(section, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            // Ensure charts are fully rendered
            onclone: (document) => {
                // Give charts time to render in the cloned document
                return new Promise(resolve => setTimeout(resolve, 1000));
            }
        });

        return {
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height
        };
    } catch (error) {
        console.error(`Failed to capture ${sectionId}:`, error);
        throw error;
    }
};

const captureAllSections = async (sectionIds) => {
    const captures = {};

    for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId);
        if (!section) {
            console.warn(`Section ${sectionId} not found`);
            continue;
        }

        // Capture each tab within the section
        const tabs = section.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
            tab.click(); // Activate the tab
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for rendering

            const canvas = await html2canvas(section, {
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            captures[`${sectionId}-${tab.textContent}`] = {
                dataUrl: canvas.toDataURL('image/png'),
                width: canvas.width,
                height: canvas.height
            };
        }
    }

    return captures;
};

const generatePDF = async (sectionIds) => {
    const captures = await captureAllSections(sectionIds);
    const pdf = new jsPDF('p', 'px', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yOffset = margin;

    // Add title
    pdf.setFontSize(24);
    pdf.text('ESG Report', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 40;

    // Add date
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yOffset);
    yOffset += 30;

    // Add each section
    for (const [key, capture] of Object.entries(captures)) {
        const aspectRatio = capture.height / capture.width;
        const imageWidth = pageWidth - (margin * 2);
        const imageHeight = imageWidth * aspectRatio;

        if (yOffset + imageHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yOffset = margin;
        }

        pdf.addImage(
            capture.dataUrl,
            'PNG',
            margin,
            yOffset,
            imageWidth,
            imageHeight
        );
        yOffset += imageHeight + 20;
    }

    return pdf;
};

const generateDOCX = async (captures) => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: 'ESG Report',
                    heading: 'Title'
                }),
                new Paragraph({
                    text: `Generated on: ${new Date().toLocaleDateString()}`
                }),
                ...Object.entries(captures).map(([sectionId, capture]) => {
                    const imageData = capture.dataUrl.split(',')[1];
                    return new Paragraph({
                        children: [
                            new ImageRun({
                                data: Buffer.from(imageData, 'base64'),
                                transformation: {
                                    width: 550,
                                    height: (550 * capture.height) / capture.width
                                }
                            })
                        ]
                    });
                })
            ]
        }]
    });

    return await Packer.toBuffer(doc);
};

const Dashboard = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [emailAddress, setEmailAddress] = useState("");
    const [exportFormat, setExportFormat] = useState("pdf");

    const handleSendReport = async () => {
        if (!emailAddress) {
            alert("Please enter an email address.");
            return;
        }

        try {
            const sectionIds = ['environmental-section', 'social-section', 'governance-section'];
            const pdfBlob = await generatePDF(sectionIds);

            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];

                const templateParams = {
                    to_email: emailAddress,
                    report: base64data,
                };

                await emailjs.send(
                    'service_4c4lrys',
                    'template_v3omh7d',
                    templateParams,
                    'M05VUeah4EtYTrOsP'
                );

                alert("Report sent successfully!");
                setIsDialogOpen(false);
            };
        } catch (error) {
            console.error("Failed to send report:", error);
            alert("Failed to send report.");
        }
    };

    return (
        <Theme appearance="light">
            <Box className="dashboard">
                <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Dialog.Trigger>
                        <Button>Generate Report</Button>
                    </Dialog.Trigger>

                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Generate Report</Dialog.Title>
                        
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Export Format
                                </Text>
                                <select 
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--gray-6)'
                                    }}
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="docx">DOCX</option>
                                </select>
                            </Box>

                            <Box>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Email Address
                                </Text>
                                <input
                                    type="email"
                                    value={emailAddress}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                    placeholder="Enter your email"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--gray-6)'
                                    }}
                                />
                            </Box>

                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button variant="soft" color="gray">
                                        Cancel
                                    </Button>
                                </Dialog.Close>
                                <Button onClick={() => handleSendReport()}>
                                    Send Report
                                </Button>
                                <Button onClick={() => {/* Your download logic */}}>
                                    Download {exportFormat.toUpperCase()}
                                </Button>
                            </Flex>
                        </Flex>
                    </Dialog.Content>
                </Dialog.Root>
            </Box>
        </Theme>
    );
};

export default Dashboard;