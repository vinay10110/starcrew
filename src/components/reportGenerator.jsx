/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';


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

const generatePDF = async (captures) => {
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
    for (const capture of Object.values(captures)) {
        // Calculate dimensions to fit page width
        const aspectRatio = capture.height / capture.width;
        const imageWidth = pageWidth - (margin * 2);
        const imageHeight = imageWidth * aspectRatio;

        // Add new page if needed
        if (yOffset + imageHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yOffset = margin;
        }

        // Add image
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

export const generateReport = async (format = 'pdf') => {
    try {
        // Capture all sections
        const captures = {
            environmental: await captureSection('environmental-section'),
            social: await captureSection('social-section'),
            governance: await captureSection('governance-section')
        };

        // Generate document based on format
        if (format === 'pdf') {
            const pdf = await generatePDF(captures);
            return pdf.output('blob');
        } else if (format === 'docx') {
            const docx = await generateDOCX(captures);
            return new Blob([docx], { 
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            });
        }

        throw new Error('Unsupported format');
    } catch (error) {
        console.error('Report generation failed:', error);
        throw error;
    }
};