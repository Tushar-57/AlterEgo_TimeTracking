import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Heart, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  Settings, 
  Moon, 
  Sun,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  MessageSquare,
  User,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  currentAgent?: string
  onAgentChange?: (agent: string) => void
  isDarkMode?: boolean
  onToggleTheme?: () => void
  currentView?: string
  onViewChange?: (view: string) => void
}

const agents = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    icon: Brain,
    description: 'Main coordination agent',
    color: 'from-blue-500 to-purple-600',
    status: 'active'
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: Zap,
    description: 'Task and goal management',
    color: 'from-yellow-500 to-orange-600',
    status: 'active'
  },
  {
    id: 'health',
    name: 'Health',
    icon: Heart,
    description: 'Wellness and habits',
    color: 'from-green-500 to-emerald-600',
    status: 'active'
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: DollarSign,
    description: 'Budget and expenses',
    color: 'from-emerald-500 to-teal-600',
    status: 'active'
  },
  {
    id: 'scheduling',
    name: 'Scheduling',
    icon: Calendar,
    description: 'Calendar management',
    color: 'from-purple-500 to-pink-600',
    status: 'active'
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: BookOpen,
    description: 'Reflection and insights',
    color: 'from-indigo-500 to-blue-600',
    status: 'active'
  }
]

const navigationItems = [
  {
    id: 'chat',
    name: 'Chat',
    icon: MessageSquare,
    path: '/chat'
  },
  {
    id: 'knowledge',
    name: 'Knowledge Base',
    icon: Database,
    path: '/knowledge'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    path: '/analytics'
  },
  {
    id: 'activity',
    name: 'Activity',
    icon: Activity,
    path: '/activity'
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: User,
    path: '/profile'
  }
]

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  collapsed = false,
  onToggleCollapse,
  currentAgent = 'orchestrator',
  onAgentChange,
  isDarkMode = false,
  onToggleTheme,
  currentView = 'chat',
  onViewChange
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "h-full bg-card border-r border-border flex flex-col relative",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-sm">AI Ecosystem</h1>
                  <p className="text-xs text-muted-foreground">Agent Hub</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
            >
              Navigation
            </motion.h2>
          )}
        </AnimatePresence>
        
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onViewChange?.(item.id)}
              className={cn(
                "w-full justify-start h-9",
                collapsed && "justify-center px-0",
                currentView === item.id && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 text-sm"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
            >
              AI Agents
            </motion.h2>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {agents.map((agent) => {
            const Icon = agent.icon
            const isActive = currentAgent === agent.id
            const isHovered = hoveredAgent === agent.id

            return (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "p-3 cursor-pointer transition-all duration-200 border",
                    isActive && "border-primary bg-primary/5",
                    !isActive && "hover:bg-accent/50",
                    collapsed && "p-2"
                  )}
                  onClick={() => onAgentChange?.(agent.id)}
                  onMouseEnter={() => setHoveredAgent(agent.id)}
                  onMouseLeave={() => setHoveredAgent(null)}
                >
                  <div className={cn(
                    "flex items-center gap-3",
                    collapsed && "justify-center"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      agent.color,
                      isActive && "shadow-lg"
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm truncate">
                              {agent.name}
                            </h3>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              agent.status === 'active' ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center gap-2",
          collapsed && "justify-center"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-8 w-8"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          
          <AnimatePresence mode="wait">
            {!collapsed && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    // This will be handled by the parent component
                    const event = new CustomEvent('openSettings')
                    window.dispatchEvent(event)
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  <p className="text-xs text-muted-foreground">
                    v1.0.0
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}