import { Container, Heading, Text, Button, Flex, Theme, Box } from '@radix-ui/themes'
import { useState } from 'react'
import { MoonIcon, SunIcon, UploadIcon } from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import ESGFileConverter from '../utils/fileConverter'

const LandingPage = () => {
    const [file, setFile] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        setFile(droppedFile)
    }

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0]
        setFile(selectedFile)
    }

    const handleAnalyzeReport = async () => {
        if (!file) return

        setIsProcessing(true)
        setError(null)

        try {
            const result = await ESGFileConverter.convertFile(file)
            
            if (result.success) {
                navigate('/dashboard', { 
                    state: { 
                        data: result.data,
                        fileName: file.name 
                    } 
                })
            } else {
                setError(result.error || 'Failed to process file')
            }
        } catch (error) {
            console.error('Error processing file:', error)
            setError('Failed to process file. Please ensure it contains valid ESG data.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Theme appearance={isDarkMode ? 'dark' : 'light'}>
            <Box style={{ minHeight: '100vh' }}>
                {/* Theme Toggle Button */}
                <Box style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <Button variant="soft" onClick={() => setIsDarkMode(!isDarkMode)}>
                        {isDarkMode ? <SunIcon /> : <MoonIcon />}
                    </Button>
                </Box>

                {/* Hero Section */}
                <Box style={{
                    background: 'var(--accent-2)',
                    padding: '80px 0',
                    borderBottom: '1px solid var(--gray-5)'
                }}>
                    <Container size="3">
                        <Flex direction="column" gap="4" align="center">
                            <Heading size="9" align="center">ESG Dashboard</Heading>
                            <Text size="5" align="center" style={{ maxWidth: '600px' }}>
                                Transform your ESG data into actionable insights. Upload your files and let our AI-powered platform analyze your environmental, social, and governance metrics.
                            </Text>
                        </Flex>
                    </Container>
                </Box>

                {/* File Upload Section */}
                <Container size="2" style={{ padding: '60px 20px' }}>
                    <Flex direction="column" gap="4">
                        <Heading size="6" align="center">Upload Your ESG Report</Heading>
                        <Text align="center" size="4">
                            Upload your ESG report in CSV, Excel, or JSON format for instant analysis
                        </Text>
                        
                        <Box
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: `2px dashed ${isDragging ? 'var(--accent-9)' : 'var(--gray-6)'}`,
                                borderRadius: '8px',
                                padding: '40px',
                                textAlign: 'center',
                                backgroundColor: isDragging ? 'var(--accent-2)' : 'var(--gray-2)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                id="fileInput"
                                accept=".csv,.xlsx,.xls,.json"
                            />
                            <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
                                <Flex direction="column" gap="3" align="center">
                                    <UploadIcon width={24} height={24} />
                                    {file ? (
                                        <Text size="3">Selected file: {file.name}</Text>
                                    ) : (
                                        <>
                                            <Text size="3">Drag and drop your file here or click to select</Text>
                                            <Text size="2" color="gray">Supported formats: CSV, Excel, JSON</Text>
                                        </>
                                    )}
                                </Flex>
                            </label>
                        </Box>

                        {error && (
                            <Text color="red" size="2" align="center">
                                {error}
                            </Text>
                        )}

                        {isProcessing && (
                            <Text size="2" color="gray" align="center">
                                Processing your file...
                            </Text>
                        )}

                        {file && !isProcessing && (
                            <Flex justify="center">
                                <Button 
                                    size="3" 
                                    variant="solid"
                                    onClick={handleAnalyzeReport}
                                >
                                    Analyze Report
                                </Button>
                            </Flex>
                        )}

                        <Box style={{ marginTop: '20px' }}>
                            <Text size="2" align="center" color="gray">
                                Your file will be converted to our standardized ESG format for analysis.
                                The data will include environmental metrics (energy, emissions, water),
                                social metrics (employees), and governance metrics (board composition).
                            </Text>
                        </Box>
                    </Flex>
                </Container>
            </Box>
        </Theme>
    )
}

export default LandingPage