import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  Tag,
  Calendar,
  User,
  Brain,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface KnowledgeEntry {
  entry_id: string
  user_id: string
  entry_type: 'preference' | 'interaction' | 'pattern' | 'insight'
  entry_sub_type: string
  category: string
  title: string
  content: string
  metadata: Record<string, any>
  tags: string[]
  created_at: string
  updated_at: string
}

interface UserPreferences {
  user_id: string
  productivity: Record<string, any>
  health: Record<string, any>
  finance: Record<string, any>
  journal: Record<string, any>
  llm_provider: Record<string, any>
  general: Record<string, any>
}

interface KnowledgeStats {
  total_entries: number
  entries_by_type: Record<string, number>
  entries_by_category: Record<string, number>
  last_updated: string
  embedding_model: string
}

interface KnowledgeBaseViewerProps {
  className?: string
  onEditPreferences?: () => void
  onAddPreference?: () => void
}

export const KnowledgeBaseViewer: React.FC<KnowledgeBaseViewerProps> = ({
  className,
  onEditPreferences,
  onAddPreference
}) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data on component mount
  useEffect(() => {
    loadKnowledgeData()
  }, [])

  const loadKnowledgeData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load entries, preferences, and stats in parallel
      const [entriesRes, preferencesRes, statsRes] = await Promise.all([
        fetch('/api/knowledge/entries').catch(() => null),
        fetch('/api/knowledge/preferences').catch(() => null),
        fetch('/api/knowledge/stats').catch(() => null)
      ])

      if (entriesRes && entriesRes.ok) {
        const entriesData = await entriesRes.json()
        setEntries(entriesData)
      }

      if (preferencesRes && preferencesRes.ok) {
        const preferencesData = await preferencesRes.json()
        setPreferences(preferencesData)
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error('Failed to load knowledge data:', err)
      setError('Failed to load knowledge base data')
      
      // Use empty arrays as fallback - the real data should come from the API
      console.warn('Using fallback demo data - API may not be available')
      setEntries([])
      setStats({
        total_entries: 0,
        entries_by_type: {},
        entries_by_category: {},
        last_updated: new Date().toISOString(),
        embedding_model: 'unknown'
      })
      
      // Set empty preferences as fallback
      setPreferences(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter entries based on search and filters
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
    const matchesType = selectedType === 'all' || entry.entry_type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const categories = ['all', ...new Set(entries.map(e => e.category))]
  const types = ['all', 'preference', 'interaction', 'pattern', 'insight']

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'preference': return User
      case 'interaction': return Brain
      case 'pattern': return TrendingUp
      case 'insight': return BarChart3
      default: return Database
    }
  }

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'preference': return 'from-blue-500 to-blue-600'
      case 'interaction': return 'from-green-500 to-green-600'
      case 'pattern': return 'from-purple-500 to-purple-600'
      case 'insight': return 'from-orange-500 to-orange-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">
            View and manage your AI agent's learned preferences and patterns
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <Button 
            onClick={loadKnowledgeData} 
            variant="ghost" 
            size="icon"
            disabled={isLoading}
            className="gap-2"
            title="Refresh data"
          >
            <Database className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={onAddPreference} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Preference</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button onClick={onEditPreferences} className="gap-2">
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Preferences</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_entries}</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.entries_by_type.preference || 0}</p>
                <p className="text-sm text-muted-foreground">Preferences</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.entries_by_type.pattern || 0}</p>
                <p className="text-sm text-muted-foreground">Patterns</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Date(stats.last_updated).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">Last Updated</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries, tags, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredEntries.map((entry, index) => {
            const Icon = getEntryIcon(entry.entry_type)
            const colorClass = getEntryColor(entry.entry_type)
            
            return (
              <motion.div
                key={entry.entry_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      colorClass
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg break-words">{entry.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {entry.entry_type}
                            </Badge>
                            {entry.entry_sub_type && (
                              <Badge variant="outline" className="text-xs">
                                {entry.entry_sub_type}
                              </Badge>
                            )}
                            <span>•</span>
                            <span className="break-words">{entry.category}</span>
                            <span>•</span>
                            <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              // Show entry details in a modal or expand inline
                              console.log('View entry:', entry.entry_id)
                              alert(`Entry Details:\n\nTitle: ${entry.title}\nContent: ${entry.content}\nTags: ${entry.tags.join(', ')}`)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              if (entry.entry_type === 'preference' && onEditPreferences) {
                                onEditPreferences()
                              } else {
                                console.log('Edit entry:', entry.entry_id)
                                alert(`Edit functionality for ${entry.entry_type} entries coming soon!`)
                              }
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 break-words whitespace-pre-wrap">
                        {entry.content.length > 300 
                          ? `${entry.content.substring(0, 300)}...` 
                          : entry.content
                        }
                      </p>
                      
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {filteredEntries.length === 0 && (
          <Card className="p-8 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your knowledge base is empty. Start interacting with agents to build your knowledge base.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}