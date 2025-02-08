/* eslint-disable no-unused-vars */
import { Container, Heading, Text, Button, Flex, Theme, Box } from '@radix-ui/themes'
import { Modal, Input, Form, Select, message } from 'antd'
import { UserOutlined, LockOutlined, GoogleOutlined, MailOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { MoonIcon, SunIcon, UploadIcon } from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import ESGFileConverter from '../components/fileConverter'
import { supabase } from '../components/supabaseClient'
import { motion } from 'framer-motion'
import styled from '@emotion/styled'

// Styled components for the modals
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    padding: 32px;
    background: var(--gray-1);
    
    @media (max-width: 480px) {
      padding: 24px;
      margin: 10px;
    }
  }

  .ant-modal-close {
    top: 24px;
    right: 24px;
  }

  .ant-input-affix-wrapper {
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--gray-6);
    background: var(--gray-2);
    transition: all 0.2s ease;

    &:hover, &:focus {
      border-color: var(--accent-8);
    }
  }

  .ant-btn {
    height: 44px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .ant-btn-primary {
    background: var(--accent-9);
    border: none;

    &:hover {
      background: var(--accent-10);
    }
  }

  .ant-form-item-label > label {
    font-weight: 500;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: var(--gray-9);
  }

  @media (max-width: 480px) {
    .ant-form-item {
      margin-bottom: 16px;
    }

    .ant-input-affix-wrapper {
      padding: 8px 12px;
    }
  }
`;

const GoogleButton = styled(Button)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--gray-2);
  border: 1px solid var(--gray-6);
  color: var(--gray-12);
  height: 44px;
  border-radius: 8px;
  margin-top: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background: var(--gray-3);
    border-color: var(--gray-7);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .anticon {
    font-size: 18px;
    color: var(--gray-11);
  }
`;

const Divider = styled.div`
  margin: 24px 0;
  text-align: center;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 45%;
    height: 1px;
    background: var(--gray-6);
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
`;

const SwitchText = styled.div`
  text-align: center;
  margin-top: 24px;
`;

const LinkText = styled(Text)`
  color: var(--accent-9);
  cursor: pointer;
  margin-left: 4px;
  font-weight: 500;

  &:hover {
    color: var(--accent-10);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
  }
`;

const AuthButton = styled(Button)`
  min-width: 120px;
  height: 40px;
  transition: all 0.3s ease;
  background: ${props => props.variant === 'solid' ? 
    'linear-gradient(to right, var(--accent-9), var(--accent-10))' : 
    'var(--gray-3)'};
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-weight: 500;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: ${props => props.variant === 'solid' ? 
      'linear-gradient(to right, var(--accent-10), var(--accent-11))' : 
      'var(--gray-4)'};
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 480px) {
    width: 100%;
    min-width: unset;
  }
`;

const ThemeToggle = styled(Button)`
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-3);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--gray-4);
  }

  @media (max-width: 480px) {
    position: absolute;
    top: 20px;
    right: 20px;
  }
`;

const HeaderButtons = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    position: relative;
    top: 0;
    right: 0;
    justify-content: center;
    padding: 16px;
  }
`;

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
    const [user, setUser] = useState(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

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
        if (!user) {
            message.warning("Please sign in to upload files")
            setIsSignInOpen(true)
            return
        }
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        setFile(droppedFile)
    }

    const handleFileSelect = (e) => {
        if (!user) {
            message.warning("Please sign in to upload files")
            setIsSignInOpen(true)
            return
        }
        const selectedFile = e.target.files[0]
        setFile(selectedFile)
    }

    const handleAnalyzeReport = async () => {
        if (!user) {
            message.warning("Please sign in to analyze reports")
            setIsSignInOpen(true)
            return
        }

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
                    redirectTo: `${window.location.origin}/dashboard`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            })

            if (error) throw error

            // No need to manually navigate - OAuth redirect will handle this
            setIsSignInOpen(false)
            setIsSignUpOpen(false)
        } catch (error) {
            console.error('Error signing in with Google:', error)
            message.error('Failed to sign in with Google. Please try again.')
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
            form.resetFields()
            message.success('Successfully signed in!')
            navigate('/dashboard')
        } catch (error) {
            console.error('Error signing in:', error)
            message.error('Invalid email or password')
        }
    }

    const handleEmailSignUp = async (values) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`
                }
            })
            
            if (error) throw error
            
            setIsSignUpOpen(false)
            form.resetFields()
            Modal.success({
                title: 'Registration Successful',
                content: 'Please check your email to verify your account.',
                onOk: () => setError(null)
            })
        } catch (error) {
            console.error('Error signing up:', error)
            message.error(error.message || 'Failed to sign up. Please try again.')
        }
    }

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            setUser(null)
            message.success('Successfully signed out!')
        } catch (error) {
            console.error('Error signing out:', error)
            message.error('Failed to sign out. Please try again.')
        }
    }

    const openSignIn = () => {
        if (user) {
            Modal.info({
                title: 'Already Signed In',
                content: 'You are already signed in to your account.',
            });
            return;
        }
        setIsSignInOpen(true);
    }

    const openSignUp = () => {
        if (user) {
            Modal.info({
                title: 'Already Signed In',
                content: 'Please sign out first to create a new account.',
            });
            return;
        }
        setIsSignUpOpen(true);
    }

    return (
        <Theme appearance={isDarkMode ? 'dark' : 'light'}>
            <Box style={{ 
                height: '100vh', 
                background: 'var(--gray-1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Theme Toggle and Auth Buttons */}
                <HeaderButtons>
                    <ButtonContainer>
                        {user ? (
                            <AuthButton 
                                variant="soft" 
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </AuthButton>
                        ) : (
                            <>
                                <AuthButton 
                                    variant="soft" 
                                    onClick={openSignIn}
                                >
                                    Sign In
                                </AuthButton>
                                <AuthButton 
                                    variant="solid" 
                                    onClick={openSignUp}
                                >
                                    Sign Up
                                </AuthButton>
                            </>
                        )}
                    </ButtonContainer>
                    <ThemeToggle 
                        variant="soft" 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                        {isDarkMode ? <SunIcon /> : <MoonIcon />}
                    </ThemeToggle>
                </HeaderButtons>

                {/* Auth Modals */}
                <StyledModal
                    title={
                        <Heading 
                            size="4" 
                            style={{ 
                                textAlign: 'center', 
                                marginBottom: '24px',
                                color: 'var(--gray-12)'
                            }}
                        >
                            Welcome Back
                        </Heading>
                    }
                    open={isSignInOpen}
                    onCancel={() => {
                        setIsSignInOpen(false);
                        form.resetFields();
                    }}
                    footer={null}
                    width={window.innerWidth > 480 ? 400 : '95%'}
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
                                prefix={<MailOutlined />}
                                placeholder="Email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password 
                                prefix={<LockOutlined />}
                                placeholder="Password"
                            />
                        </Form.Item>

                        <Form.Item style={{ textAlign: 'center' }}>
                            <AuthButton type="primary" htmlType="submit">
                                Sign In
                            </AuthButton>
                        </Form.Item>

                        <Divider>
                            <Text size="2" style={{ color: 'var(--gray-11)', padding: '0 10px' }}>
                                OR
                            </Text>
                        </Divider>

                        <GoogleButton onClick={handleGoogleSignIn}>
                            <GoogleOutlined style={{ fontSize: '18px' }} />
                            Continue with Google
                        </GoogleButton>

                        <SwitchText>
                            <Text size="2" style={{ color: 'var(--gray-11)' }}>
                                Dont have an account?
                                <LinkText 
                                    as="span"
                                    onClick={() => {
                                        setIsSignInOpen(false);
                                        setIsSignUpOpen(true);
                                    }}
                                >
                                    Sign up
                                </LinkText>
                            </Text>
                        </SwitchText>
                    </Form>
                </StyledModal>

                <StyledModal
                    title={
                        <Heading 
                            size="4" 
                            style={{ 
                                textAlign: 'center', 
                                marginBottom: '24px',
                                color: 'var(--gray-12)'
                            }}
                        >
                            Create Account
                        </Heading>
                    }
                    open={isSignUpOpen}
                    onCancel={() => {
                        setIsSignUpOpen(false);
                        form.resetFields();
                    }}
                    footer={null}
                    width={window.innerWidth > 480 ? 400 : '95%'}
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
                                prefix={<MailOutlined />}
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
                                prefix={<LockOutlined />}
                                placeholder="Password"
                            />
                        </Form.Item>

                        <Form.Item style={{ textAlign: 'center' }}>
                            <AuthButton type="primary" htmlType="submit">
                                Sign Up
                            </AuthButton>
                        </Form.Item>

                        <Divider>
                            <Text size="2" style={{ color: 'var(--gray-11)', padding: '0 10px' }}>
                                OR
                            </Text>
                        </Divider>

                        <GoogleButton onClick={handleGoogleSignIn}>
                            <GoogleOutlined style={{ fontSize: '18px' }} />
                            Continue with Google
                        </GoogleButton>

                        <SwitchText>
                            <Text size="2" style={{ color: 'var(--gray-11)' }}>
                                Already have an account?
                                <LinkText 
                                    as="span"
                                    onClick={() => {
                                        setIsSignUpOpen(false);
                                        setIsSignInOpen(true);
                                        form.resetFields();
                                    }}
                                >
                                    Sign in
                                </LinkText>
                            </Text>
                        </SwitchText>
                    </Form>
                </StyledModal>

                {/* Main Content */}
                <Flex 
                    direction="column" 
                    style={{ 
                        flex: 1,
                        height: '100%',
                        position: 'relative'
                    }}
                >
                    {/* Animated Background Pattern */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 1.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 50% 50%, var(--accent-3) 0%, transparent 70%)',
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Content Container */}
                    <Flex 
                        direction="column" 
                        align="center" 
                        justify="center" 
                        style={{ 
                            flex: 1,
                            padding: '0 20px',
                            position: 'relative'
                        }}
                    >
                        {/* Hero Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            style={{ marginBottom: '40px', textAlign: 'center' }}
                        >
                            <Heading 
                                size="9" 
                                style={{
                                    background: 'linear-gradient(to right, var(--accent-9), var(--accent-11))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '16px'
                                }}
                            >
                                ESG Dashboard
                            </Heading>
                            <Text 
                                size="5" 
                                style={{ 
                                    maxWidth: '600px',
                                    color: 'var(--gray-11)',
                                    lineHeight: '1.4'
                                }}
                            >
                                Transform your ESG data into actionable insights
                            </Text>
                        </motion.div>

                        {/* Upload Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            style={{ 
                                width: '100%',
                                maxWidth: '600px',
                                margin: '0 auto'
                            }}
                        >
                            <Box
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    border: `2px dashed ${isDragging ? 'var(--accent-9)' : 'var(--gray-6)'}`,
                                    borderRadius: '16px',
                                    padding: '40px',
                                    textAlign: 'center',
                                    backgroundColor: isDragging ? 'var(--accent-2)' : 'var(--gray-2)',
                                    transition: 'all 0.3s ease',
                                    cursor: user ? 'pointer' : 'not-allowed',
                                    opacity: user ? 1 : 0.8
                                }}
                            >
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="fileInput"
                                    accept=".csv,.xlsx,.xls,.json"
                                    disabled={!user}
                                />
                                <label htmlFor="fileInput" style={{ cursor: user ? 'pointer' : 'not-allowed' }}>
                                    <Flex direction="column" gap="3" align="center">
                                        <motion.div
                                            whileHover={user ? { scale: 1.05 } : {}}
                                            whileTap={user ? { scale: 0.95 } : {}}
                                            style={{
                                                background: user ? 'var(--accent-3)' : 'var(--gray-4)',
                                                borderRadius: '50%',
                                                width: '56px',
                                                height: '56px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '12px'
                                            }}
                                        >
                                            <UploadIcon width={24} height={24} style={{ color: user ? 'var(--accent-9)' : 'var(--gray-8)' }} />
                                        </motion.div>
                                        {!user ? (
                                            <>
                                                <Text size="3" weight="medium" style={{ color: 'var(--gray-11)' }}>
                                                    Please sign in to upload files
                                                </Text>
                                                <Button 
                                                    variant="soft" 
                                                    onClick={() => setIsSignInOpen(true)}
                                                    style={{ marginTop: '8px' }}
                                                >
                                                    Sign In
                                                </Button>
                                            </>
                                        ) : file ? (
                                            <Text size="3" weight="medium" style={{ color: 'var(--accent-11)' }}>
                                                Selected file: {file.name}
                                            </Text>
                                        ) : (
                                            <>
                                                <Text size="3" weight="medium">
                                                    Drag and drop your file here or click to select
                                                </Text>
                                                <Text size="2" color="gray">
                                                    Supported formats: CSV, Excel, JSON
                                                </Text>
                                            </>
                                        )}
                                    </Flex>
                                </label>
                            </Box>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Text color="red" size="2" align="center" style={{ marginTop: '12px' }}>
                                        {error}
                                    </Text>
                                </motion.div>
                            )}

                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Text size="2" color="gray" align="center" style={{ marginTop: '12px' }}>
                                        Processing your file...
                                    </Text>
                                </motion.div>
                            )}

                            {file && !isProcessing && user && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Flex justify="center" style={{ marginTop: '20px' }}>
                                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            <Button 
                                                size="3" 
                                                variant="solid"
                                                onClick={handleAnalyzeReport}
                                                style={{
                                                    background: 'var(--accent-9)',
                                                    transition: 'all 0.2s ease',
                                                    padding: '0 32px',
                                                    height: '44px'
                                                }}
                                            >
                                                Analyze Report
                                            </Button>
                                        </motion.div>
                                    </Flex>
                                </motion.div>
                            )}
                        </motion.div>
                    </Flex>
                </Flex>
            </Box>
        </Theme>
    )
}

export default LandingPage