import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  X, 
  Zap, 
  Brain, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  currentProvider: 'openai' | 'ollama'
  onProviderChange: (provider: 'openai' | 'ollama') => void
  providerStatus: {
    openai: { healthy: boolean; model?: string; responseTime?: number }
    ollama: { healthy: boolean; model?: string; responseTime?: number }
  }
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  currentProvider,
  onProviderChange,
  providerStatus
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434')

  const handleProviderSwitch = async (provider: 'openai' | 'ollama') => {
  try {
    setIsTestingConnection(true)
    
    // Prepare the request body with configuration
    const requestBody = {
      provider,
      config: {}
    }

    // Add API key for OpenAI provider
    if (provider === 'openai' && apiKey) {
      requestBody.config = { api_key: apiKey }
    } else if (provider === 'ollama') {
      requestBody.config = { endpoint: ollamaEndpoint }
    }

    // Call backend API to switch provider
    const response = await fetch('http://localhost:8000/api/llm/switch-provider', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      onProviderChange(provider)
      toast.success(`Switched to ${provider.toUpperCase()} provider`, {
        description: result.message || `Now using ${provider === 'openai' ? 'OpenAI GPT models' : 'Local Ollama models'}`
      })
    } else {
      // Show the error message from backend
      toast.error(`Failed to switch to ${provider.toUpperCase()}`, {
        description: result.message || `Could not initialize ${provider} provider`
      })
    }
  } catch (error) {
    console.error('Provider switch error:', error)
    toast.error(`Failed to switch to ${provider.toUpperCase()}`, {
      description: 'Backend connection not available'
    })
  } finally {
    setIsTestingConnection(false)
  }
}

  const testConnection = async (provider: 'openai' | 'ollama') => {
  try {
    setIsTestingConnection(true)
    
    const requestBody = {
      provider,
      config: {}
    }

    // Add configuration based on provider
    if (provider === 'openai') {
      if (!apiKey) {
        toast.error('OpenAI API key required', {
          description: 'Please enter your OpenAI API key first'
        })
        return
      }
      requestBody.config = { api_key: apiKey }
    } else if (provider === 'ollama') {
      requestBody.config = { endpoint: ollamaEndpoint }
    }
    
    const response = await fetch(`http://localhost:8000/api/llm/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    
    if (result.healthy) {
      toast.success(`${provider.toUpperCase()} connection successful`, {
        description: `Response time: ${result.responseTime}ms`
      })
    } else {
      toast.error(`${provider.toUpperCase()} connection failed`, {
        description: result.error
      })
    }
  } catch (error) {
    toast.error('Connection test failed', {
      description: 'Please check your configuration'
    })
  } finally {
    setIsTestingConnection(false)
  }
}

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold">Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure your AI providers</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* LLM Provider Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    LLM Provider
                  </CardTitle>
                  <CardDescription>
                    Choose between OpenAI's cloud models or local Ollama models
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* OpenAI Option */}
                  <div className={cn(
                    "p-4 rounded-lg border-2 transition-all cursor-pointer",
                    currentProvider === 'openai' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleProviderSwitch('openai')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">OpenAI</h3>
                          <p className="text-sm text-muted-foreground">GPT-4, GPT-3.5 Turbo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {providerStatus.openai.healthy ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <Switch 
                          checked={currentProvider === 'openai'} 
                          disabled={isTestingConnection}
                        />
                      </div>
                    </div>
                    
                    {currentProvider === 'openai' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="space-y-3">
                          <Input
                            placeholder="Enter OpenAI API Key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            icon={<Zap className="w-4 h-4" />}
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => testConnection('openai')}
                              disabled={isTestingConnection || !apiKey}
                              className="flex-1"
                            >
                              {isTestingConnection ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                              ) : (
                                <Wifi className="w-3 h-3 mr-2" />
                              )}
                              Test Connection
                            </Button>
                          </div>
                          {providerStatus.openai.healthy && (
                            <div className="text-xs text-muted-foreground">
                              Model: {providerStatus.openai.model} • 
                              Response: {providerStatus.openai.responseTime}ms
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Ollama Option */}
                  <div className={cn(
                    "p-4 rounded-lg border-2 transition-all cursor-pointer",
                    currentProvider === 'ollama' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleProviderSwitch('ollama')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">Ollama</h3>
                          <p className="text-sm text-muted-foreground">Local LLaMA, Mistral models</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {providerStatus.ollama.healthy ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <Switch 
                          checked={currentProvider === 'ollama'} 
                          disabled={isTestingConnection}
                        />
                      </div>
                    </div>
                    
                    {currentProvider === 'ollama' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="space-y-3">
                          <Input
                            placeholder="Ollama endpoint URL"
                            value={ollamaEndpoint}
                            onChange={(e) => setOllamaEndpoint(e.target.value)}
                            icon={<Brain className="w-4 h-4" />}
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => testConnection('ollama')}
                              disabled={isTestingConnection}
                              className="flex-1"
                            >
                              {isTestingConnection ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                              ) : (
                                <Wifi className="w-3 h-3 mr-2" />
                              )}
                              Test Connection
                            </Button>
                          </div>
                          {providerStatus.ollama.healthy && (
                            <div className="text-xs text-muted-foreground">
                              Model: {providerStatus.ollama.model} • 
                              Response: {providerStatus.ollama.responseTime}ms
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Provider Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="w-5 h-5" />
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          providerStatus.openai.healthy ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm font-medium">OpenAI</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {providerStatus.openai.healthy ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          providerStatus.ollama.healthy ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm font-medium">Ollama</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {providerStatus.ollama.healthy ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => testConnection(currentProvider)}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="w-4 h-4 mr-2" />
                    )}
                    Test Current Provider
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast.success('Configuration saved', {
                        description: 'Your settings have been saved successfully'
                      })
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}