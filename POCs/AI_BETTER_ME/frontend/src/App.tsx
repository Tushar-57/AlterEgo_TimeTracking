import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Sidebar } from '@/components/layout/Sidebar'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { KnowledgeManagement } from '@/components/knowledge/KnowledgeManagement'
import { cn } from '@/lib/utils'
import './globals.css'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  agent?: string
  reasoning?: string
  isStreaming?: boolean
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentAgent, setCurrentAgent] = useState('orchestrator')
  const [currentView, setCurrentView] = useState('chat')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<'openai' | 'ollama'>('ollama')  // Default to Ollama
  const [providerStatus, setProviderStatus] = useState({
    openai: { healthy: false, model: 'gpt-4', responseTime: 0 },
    ollama: { healthy: false, model: 'llama3.2:3b', responseTime: 0 }
  })

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  // Settings panel event listener
  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true)
    window.addEventListener('openSettings', handleOpenSettings)
    return () => window.removeEventListener('openSettings', handleOpenSettings)
  }, [])

  // Load provider status on mount with retry logic
  useEffect(() => {
    const loadProviderStatus = async (retryCount = 0) => {
      try {
        const response = await fetch('http://localhost:8000/api/llm/status', {  // Fixed endpoint
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setCurrentProvider(data.current_provider || 'ollama')  // Default to Ollama
          
          // Update provider status based on response
          setProviderStatus({
            openai: {
              healthy: data.providers?.openai?.healthy || false,
              model: data.providers?.openai?.model || 'gpt-3.5-turbo',
              responseTime: data.providers?.openai?.responseTime || 0
            },
            ollama: {
              healthy: data.providers?.ollama?.healthy || false,
              model: data.providers?.ollama?.model || 'llama3.2:3b',
              responseTime: data.providers?.ollama?.responseTime || 0
            }
          })
          console.log('✅ Provider status loaded successfully:', data)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('Failed to load provider status:', error)
        
        // Retry up to 3 times with increasing delay
        if (retryCount < 3) {
          console.log(`🔄 Retrying provider status load (attempt ${retryCount + 1}/3)...`)
          setTimeout(() => loadProviderStatus(retryCount + 1), (retryCount + 1) * 1000)
          return
        }
        
        // Final fallback - check if Ollama is available locally
        console.log('📱 Using fallback provider status detection')
        fetch('http://localhost:11434/api/tags')
          .then(response => response.json())
          .then(() => {
            setProviderStatus({
              openai: { healthy: false, model: 'gpt-3.5-turbo', responseTime: 0 },
              ollama: { healthy: true, model: 'llama3.2:3b', responseTime: 450 }
            })
            setCurrentProvider('ollama')
          })
          .catch(() => {
            setProviderStatus({
              openai: { healthy: false, model: 'gpt-3.5-turbo', responseTime: 0 },
              ollama: { healthy: false, model: 'llama3.2:3b', responseTime: 0 }
            })
          })
      }
    }
    
    // Add a small delay to ensure backend is ready
    setTimeout(() => loadProviderStatus(), 500)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleProviderChange = async (provider: 'openai' | 'ollama') => {
    setCurrentProvider(provider)
    
    // Add a system message about the provider switch
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content: `🔄 Switched to **${provider.toUpperCase()}** provider. ${
        provider === 'openai' 
          ? 'Now using OpenAI\'s cloud-based models for enhanced capabilities.' 
          : 'Now using local Ollama models for privacy-focused AI interactions.'
      }`,
      role: 'system',
      timestamp: new Date(),
      agent: currentAgent
    }
    
    setMessages(prev => [...prev, systemMessage])
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          agent: currentAgent,
          conversation_id: 'demo-conversation'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Ensure content is always a string
        let responseContent = data.response
        if (typeof responseContent !== 'string') {
          if (responseContent && typeof responseContent === 'object') {
            responseContent = JSON.stringify(responseContent, null, 2)
          } else {
            responseContent = String(responseContent || 'No response received')
          }
        }
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: responseContent,
          role: 'assistant',
          timestamp: new Date(),
          agent: data.agent || currentAgent,
          reasoning: data.reasoning
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Demo response when backend is not available
      const demoResponse: Message = {
        id: `demo-${Date.now()}`,
        content: `Hello! I'm the **${currentAgent}** agent. I'm currently I had to switch to demo mode since the backend is chilling somewhere with connected yet. 
        Here's what I can help you with once fully connected:
        ${currentAgent === 'orchestrator' ? `
        - 🧠 **Coordinate** between different AI agents
        - 🎯 **Route** your requests to the right specialist
        - 📊 **Provide** unified insights across all domains
        - 🔄 **Manage** complex multi-step workflows
        ` : currentAgent === 'productivity' ? `
        - ⚡ **Track** your tasks and goals
        - 📈 **Analyze** your productivity patterns  
        - 🎯 **Suggest** optimizations for your workflow
        - 📋 **Integrate** with your task management tools
        ` : currentAgent === 'health' ? `
        - ❤️ **Monitor** your wellness metrics
        - 🏃 **Track** your fitness activities
        - 😴 **Analyze** your sleep patterns
        - 🥗 **Suggest** healthy lifestyle changes
        ` : currentAgent === 'finance' ? `
        - 💰 **Track** your expenses and income
        - 📊 **Analyze** your spending patterns
        - 🎯 **Help** with budgeting and financial goals
        - 📈 **Provide** investment insights
        ` : `
        - 🤖 **Assist** with general queries
        - 💡 **Provide** helpful suggestions
        - 🔍 **Search** for information
        - 📝 **Help** with various tasks
        `}

      Try switching between different agents using the sidebar to see how each one specializes in different areas, or just trust me, and let me do my Orchestration Job!`,
        role: 'assistant',
        timestamp: new Date(),
        agent: currentAgent,
        reasoning: `Selected ${currentAgent} agent based on current context. Providing demo capabilities overview.`
      }

      setMessages(prev => [...prev, demoResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgentChange = (agentId: string) => {
    setCurrentAgent(agentId)
    
    // Add system message about agent switch
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content: `Switched to **${agentId}** agent. This agent specializes in ${
        agentId === 'orchestrator' ? 'coordinating between different specialized agents to give the best answer to your query.' :
        agentId === 'productivity' ? 'task management, goal tracking, and productivity optimization' :
        agentId === 'health' ? 'wellness tracking, fitness monitoring, and healthy lifestyle guidance' :
        agentId === 'finance' ? 'expense tracking, budgeting, and financial planning' :
        agentId === 'scheduling' ? 'calendar management and appointment scheduling' :
        agentId === 'journal' ? 'reflection facilitation and personal insights' :
        'general assistance and information'
      }.`,
      role: 'system',
      timestamp: new Date(),
      agent: agentId
    }
    
    setMessages(prev => [...prev, systemMessage])
  }

  return (
    <div className={cn(
      "h-screen flex bg-background text-foreground transition-colors duration-300",
      isDarkMode && "dark"
    )}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentAgent={currentAgent}
        onAgentChange={handleAgentChange}
        currentView={currentView}
        onViewChange={setCurrentView}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ 
          marginLeft: 0,
          width: '100%'
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-w-0"
      >
        {/* Main Content */}
        {currentView === 'chat' && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            currentAgent={currentAgent}
            currentProvider={currentProvider}
            className="flex-1"
          />
        )}
        
        {currentView === 'knowledge' && (
          <KnowledgeManagement className="flex-1" />
        )}
        
        {currentView === 'analytics' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Analytics</h2>
              <p className="text-muted-foreground">Analytics view coming soon...</p>
            </div>
          </div>
        )}
        
        {currentView === 'activity' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Activity</h2>
              <p className="text-muted-foreground">Activity view coming soon...</p>
            </div>
          </div>
        )}
        
        {currentView === 'profile' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Profile</h2>
              <p className="text-muted-foreground">Profile view coming soon...</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentProvider={currentProvider}
        onProviderChange={handleProviderChange}
        providerStatus={providerStatus}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        theme={isDarkMode ? 'dark' : 'light'}
        richColors
        closeButton
      />
    </div>
  )
}

export default App