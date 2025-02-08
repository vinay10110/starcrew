/* eslint-disable no-unused-vars */
import { Container, Heading, Text, Button, Flex, Theme, Box } from '@radix-ui/themes'
import { Modal, Input, Form } from 'antd'
import { UserOutlined, LockOutlined, GoogleOutlined, MailOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { MoonIcon, SunIcon, UploadIcon } from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import ESGFileConverter from '../components/fileConverter'
import { supabase } from '../components/supabaseClient'

const LandingPage = () => {
    const [file, setFile] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const [isSignInOpen, setIsSignInOpen] = useState(false)
    const [isSignUpOpen, setIsSignUpOpen] = useState(false)
    const [form] = Form.useForm()

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

    const handleGoogleSignIn = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            })

            if (error) throw error
        } catch (error) {
            console.error('Error signing in with Google:', error)
            setError('Failed to sign in with Google. Please try again.')
        }
    }

    const handleEmailSignIn = async (values) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })
            if (error) throw error
            setIsSignInOpen(false)
            navigate('/dashboard')
        } catch (error) {
            console.error('Error signing in:', error)
            setError('Failed to sign in. Please check your credentials.')
        }
    }

    const handleEmailSignUp = async (values) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
            })
            if (error) throw error
            setIsSignUpOpen(false)
            setError('Please check your email to verify your account.')
        } catch (error) {
            console.error('Error signing up:', error)
            setError('Failed to sign up. Please try again.')
        }
    }

    const modalStyle = {
        header: {
            textAlign: 'center',
            marginBottom: '24px'
        },
        divider: {
            margin: '16px 0',
            textAlign: 'center',
            color: '#888',
            position: 'relative'
        },
        googleButton: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)'
        },
        switchText: {
            textAlign: 'center',
            marginTop: '16px'
        },
        link: {
            color: 'var(--accent-9)',
            cursor: 'pointer',
            marginLeft: '4px'
        }
    }

    const switchToSignUp = () => {
        setIsSignInOpen(false)
        form.resetFields()
        setIsSignUpOpen(true)
    }

    const switchToSignIn = () => {
        setIsSignUpOpen(false)
        form.resetFields()
        setIsSignInOpen(true)
    }

    return (
        <Theme appearance={isDarkMode ? 'dark' : 'light'}>
            <Box style={{ minHeight: '100vh' }}>
                {/* Auth Modals */}
                <Modal
                    title={<Heading size="4" style={modalStyle.header}>Sign In</Heading>}
                    open={isSignInOpen}
                    onCancel={() => setIsSignInOpen(false)}
                    footer={null}
                    width={400}
                >
                    <Form
                        form={form}
                        onFinish={handleEmailSignIn}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Please input your email!' }]}
                        >
                            <Input 
                                prefix={<MailOutlined style={{ color: '#888' }} />}
                                placeholder="Email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password 
                                prefix={<LockOutlined style={{ color: '#888' }} />}
                                placeholder="Password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary"
                                style={{ width: '100%', height: '40px' }} 
                                onClick={() => form.submit()}
                            >
                                <UserOutlined /> Sign In
                            </Button>
                        </Form.Item>

                        <div style={modalStyle.divider}>
                            <Text size="2">OR</Text>
                        </div>

                        <Button 
                            style={modalStyle.googleButton}
                            onClick={handleGoogleSignIn}
                            icon={<GoogleOutlined style={{ fontSize: '16px' }} />}
                        >
                            Continue with Google
                        </Button>

                        <div style={modalStyle.switchText}>
                            <Text size="2">
                                Don&apos;t have an account?
                                <Text 
                                    as="span" 
                                    style={modalStyle.link}
                                    onClick={switchToSignUp}

                                >
                                    Sign up
                                </Text>
                            </Text>
                        </div>
                    </Form>
                </Modal>

                <Modal
                    title={<Heading size="4" style={modalStyle.header}>Create Account</Heading>}
                    open={isSignUpOpen}
                    onCancel={() => setIsSignUpOpen(false)}
                    footer={null}
                    width={400}
                >
                    <Form
                        form={form}
                        onFinish={handleEmailSignUp}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input 
                                prefix={<MailOutlined style={{ color: '#888' }} />}
                                placeholder="Email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Please input your password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' }
                            ]}
                        >
                            <Input.Password 
                                prefix={<LockOutlined style={{ color: '#888' }} />}
                                placeholder="Password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary"
                                style={{ width: '100%', height: '40px' }} 
                                onClick={() => form.submit()}
                            >
                                <UserOutlined /> Sign Up
                            </Button>
                        </Form.Item>

                        <div style={modalStyle.divider}>
                            <Text size="2">OR</Text>
                        </div>

                        <Button 
                            style={modalStyle.googleButton}
                            onClick={handleGoogleSignIn}
                            icon={<GoogleOutlined style={{ fontSize: '16px' }} />}
                        >
                            Continue with Google
                        </Button>

                        <div style={modalStyle.switchText}>
                            <Text size="2">
                                Already have an account?
                                <Text 
                                    as="span" 
                                    style={modalStyle.link}
                                    onClick={switchToSignIn}
                                >
                                    Sign in
                                </Text>
                            </Text>
                        </div>
                    </Form>
                </Modal>

                {/* Theme Toggle and Auth Buttons */}
                <Box style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <Flex gap="2" align="center">
                        <Button variant="soft" onClick={() => setIsSignInOpen(true)}>
                            Sign In
                        </Button>
                        <Button variant="solid" onClick={() => setIsSignUpOpen(true)}>
                            Sign Up
                        </Button>
                        <Button variant="soft" onClick={() => setIsDarkMode(!isDarkMode)}>
                            {isDarkMode ? <SunIcon /> : <MoonIcon />}
                        </Button>
                    </Flex>
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

                      
                    </Flex>
                </Container>
            </Box>
        </Theme>
    )
}

export default LandingPage