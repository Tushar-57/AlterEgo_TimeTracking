import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Zap, Brain, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  content: string | any  // Allow any type but convert to string during rendering
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  agent?: string
  reasoning?: string | AgentThinking
  isStreaming?: boolean
}

interface AgentThinking {
  steps?: Array<{
    agent: string
    action: string
    result?: string
    timestamp?: Date
  }>
  finalAgent?: string
  classification?: {
    agent_type: string
    confidence: number
    reason: string
  }
  handoff?: {
    from: string
    to: string
    reason: string
  }
  error?: string
}

interface ChatInterfaceProps {
  className?: string
  onSendMessage?: (message: string) => void
  messages?: Message[]
  isLoading?: boolean
  currentAgent?: string
  currentProvider?: 'openai' | 'ollama'
}

const agentIcons = {
  orchestrator: Brain,
  productivity: Zap,
  health: Sparkles,
  finance: Settings,
  general: Bot,
}

const AgentThinkingDisplay = ({ thinking }: { thinking: AgentThinking }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2 border rounded-lg bg-slate-50 dark:bg-slate-900/50 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Agent Thinking Process
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3"
          >
            {thinking.classification && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                <div className="font-medium text-sm text-blue-800 dark:text-blue-200">Intent Classification</div>
                <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Routed to: <span className="font-medium capitalize">{thinking.classification.agent_type}</span>
                  <span className="ml-2 opacity-75">({Math.round(thinking.classification.confidence * 100)}% confidence)</span>
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">{thinking.classification.reason}</div>
              </div>
            )}

            {thinking.handoff && (
              <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-4 border-purple-400">
                <div className="font-medium text-sm text-purple-800 dark:text-purple-200">Agent Handoff</div>
                <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                  {thinking.handoff.from} → {thinking.handoff.to}
                </div>
                <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">{thinking.handoff.reason}</div>
              </div>
            )}

            {thinking.steps && thinking.steps.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm text-slate-700 dark:text-slate-300">Processing Steps:</div>
                {thinking.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded border">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {step.agent} Agent
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {step.action}
                      </div>
                      {step.result && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">
                          {step.result}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {thinking.finalAgent && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-400">
                <div className="font-medium text-sm text-green-800 dark:text-green-200">Final Response</div>
                <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                  Generated by: <span className="font-medium capitalize">{thinking.finalAgent} Agent</span>
                </div>
              </div>
            )}

            {thinking.error && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-400">
                <div className="font-medium text-sm text-red-800 dark:text-red-200">Error</div>
                <div className="text-xs text-red-600 dark:text-red-300 mt-1">{thinking.error}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-4">
    <div className="flex space-x-1">
      <div className="typing-indicator"></div>
      <div className="typing-indicator"></div>
      <div className="typing-indicator"></div>
    </div>
    <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
  </div>
)

const MessageBubble = React.forwardRef<HTMLDivElement, { message: Message; isLast: boolean }>(({ message, isLast: _ }, ref) => {
  const isUser = message.role === 'user'
  const AgentIcon = message.agent ? agentIcons[message.agent as keyof typeof agentIcons] || Bot : Bot

  // Parse reasoning to structured format
  const parseReasoning = (reasoning: string | AgentThinking | undefined): AgentThinking | null => {
    if (!reasoning) return null
    
    if (typeof reasoning === 'object') {
      return reasoning
    }
    
    if (typeof reasoning === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(reasoning)
        return parsed
      } catch {
        // If not JSON, check for specific patterns and create structured thinking
        const thinking: AgentThinking = {}
        
        // Look for agent mentions
        const agentMatch = reasoning.match(/(\w+)\s+agent/i)
        if (agentMatch) {
          thinking.finalAgent = agentMatch[1].toLowerCase()
        }
        
        // Look for classification patterns
        const classificationMatch = reasoning.match(/classified as (\w+)/i)
        if (classificationMatch) {
          thinking.classification = {
            agent_type: classificationMatch[1].toLowerCase(),
            confidence: 0.8,
            reason: reasoning
          }
        }
        
        // Look for handoff patterns
        const handoffMatch = reasoning.match(/handoff from (\w+) to (\w+)/i)
        if (handoffMatch) {
          thinking.handoff = {
            from: handoffMatch[1],
            to: handoffMatch[2],
            reason: reasoning
          }
        }
        
        // If it looks like an error
        if (reasoning.toLowerCase().includes('error') || reasoning.toLowerCase().includes('failed')) {
          thinking.error = reasoning
        }
        
        return Object.keys(thinking).length > 0 ? thinking : null
      }
    }
    
    return null
  }

  const structuredThinking = parseReasoning(message.reasoning)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-3 p-4 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <AgentIcon className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Agent Name */}
        {!isUser && message.agent && (
          <div className="text-xs text-muted-foreground mb-1 capitalize flex items-center gap-2">
            <span>{message.agent} Agent</span>
            {(() => {
              let reasoningText = '';
              if (typeof message.reasoning === 'string') {
                reasoningText = message.reasoning;
              } else if (message.reasoning && typeof message.reasoning === 'object') {
                reasoningText = JSON.stringify(message.reasoning);
              }
              return reasoningText.includes('openai') ? (
                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                  OpenAI
                </span>
              ) : null;
            })()}
            {(() => {
              let reasoningText = '';
              if (typeof message.reasoning === 'string') {
                reasoningText = message.reasoning;
              } else if (message.reasoning && typeof message.reasoning === 'object') {
                reasoningText = JSON.stringify(message.reasoning);
              }
              return reasoningText.includes('ollama') ? (
                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                  Ollama
                </span>
              ) : null;
            })()}
          </div>
        )}

        {/* Message Bubble */}
        <Card className={cn(
          "p-3 shadow-md transition-all duration-200",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-card hover:shadow-lg",
          message.isStreaming && "animate-pulse"
        )}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ children, className }) => (
                  <code className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-mono",
                    isUser ? "bg-primary-foreground/20" : "bg-muted",
                    className
                  )}>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className={cn(
                    "p-3 rounded-lg overflow-x-auto text-xs",
                    isUser ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {children}
                  </pre>
                ),
              }}
            >
              {(() => {
                const content = message.content
                if (typeof content === 'string') {
                  return content
                } else if (content && typeof content === 'object') {
                  console.warn('Message content is object, converting to string:', content)
                  return JSON.stringify(content, null, 2)
                } else {
                  console.warn('Message content is unexpected type:', typeof content, content)
                  return String(content || 'No content')
                }
              })()}
            </ReactMarkdown>
          </div>
        </Card>

        {/* Reasoning (if available) */}
        {message.reasoning && (
          structuredThinking ? (
            <AgentThinkingDisplay thinking={structuredThinking} />
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground max-w-full"
            >
              <div className="font-medium mb-1">💭 Agent Reasoning:</div>
              <div>
                {typeof message.reasoning === 'string'
                  ? message.reasoning
                  : <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(message.reasoning, null, 2)}</pre>
                }
              </div>
            </motion.div>
          )
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </motion.div>
  )
})

MessageBubble.displayName = "MessageBubble"

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className,
  onSendMessage,
  messages = [],
  isLoading = false,
  currentAgent = 'orchestrator',
  currentProvider = 'openai'
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage?.(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">AI Agent Ecosystem</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {currentAgent} Agent Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Provider Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground font-medium capitalize">
              {currentProvider}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 floating-animation">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to AI Agent Ecosystem</h3>
              <p className="text-muted-foreground max-w-md">
                Start a conversation with your AI agents. They can help with productivity, health, finance, and more!
              </p>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
              />
            ))
          )}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Type your message..."
              className="resize-none min-h-[44px] pr-12"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-11 w-11 shrink-0"
            variant="gradient"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {(() => {
            const getQuickActions = (agent: string) => {
              switch (agent) {
                case 'productivity':
                  return [
                    "📋 Add a new task",
                    "📊 Show my productivity stats",
                    "🎯 Review my goals",
                    "⚡ What should I focus on?"
                  ]
                case 'health':
                  return [
                    "❤️ Health check-in",
                    "💪 Log a workout",
                    "😴 Track my sleep",
                    "🥗 Meal planning help"
                  ]
                case 'finance':
                  return [
                    "💰 Add an expense",
                    "📈 Financial summary",
                    "🎯 Budget review",
                    "💡 Savings tips"
                  ]
                case 'scheduling':
                  return [
                    "📅 Check my calendar",
                    "⏰ Schedule a meeting",
                    "🔄 Reschedule conflicts",
                    "⚡ Time optimization"
                  ]
                case 'journal':
                  return [
                    "📝 Daily reflection",
                    "😊 Mood check-in",
                    "🎉 Celebrate achievement",
                    "💭 Weekly review"
                  ]
                default:
                  return [
                    "❓ What can you help me with?",
                    "🤖 Show available agents",
                    "📊 System status",
                    "💡 Get suggestions"
                  ]
              }
            }
            
            return getQuickActions(currentAgent).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="whitespace-nowrap text-xs hover:bg-primary/10 transition-colors"
                onClick={() => {
                  setInputValue(suggestion.replace(/^[^\s]+ /, '')) // Remove emoji prefix
                  // Auto-send the message
                  setTimeout(() => {
                    if (!isLoading) {
                      onSendMessage?.(suggestion.replace(/^[^\s]+ /, ''))
                      setInputValue('')
                    }
                  }, 100)
                }}
              >
                {suggestion}
              </Button>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}