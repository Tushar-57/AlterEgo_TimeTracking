import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Settings, BarChart3, Eye, Box, UserPlus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { KnowledgeBaseViewer } from './KnowledgeBaseViewer'
import { PreferencesEditor } from './PreferencesEditor'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { ManualPreferenceAdder } from './ManualPreferenceAdder'
import { Advanced3DVisualization } from './Advanced3DVisualization'
import { cn } from '@/lib/utils'

interface KnowledgeManagementProps {
  className?: string
}

export const KnowledgeManagement: React.FC<KnowledgeManagementProps> = ({
  className
}) => {
  const [activeTab, setActiveTab] = useState('viewer')
  const [isPreferencesEditorOpen, setIsPreferencesEditorOpen] = useState(false)
  const [isManualPreferenceAdderOpen, setIsManualPreferenceAdderOpen] = useState(false)
  const [isEmbeddingsVisualizationOpen, setIsEmbeddingsVisualizationOpen] = useState(false)

  const handleEditPreferences = () => {
    setIsPreferencesEditorOpen(true)
  }

  const handleAddManualPreference = () => {
    setIsManualPreferenceAdderOpen(true)
  }

  const handleOpenEmbeddingsVisualization = () => {
    setIsEmbeddingsVisualizationOpen(true)
  }

  const handlePreferencesSaved = () => {
    // Refresh the knowledge base viewer when preferences are saved
    // This could trigger a re-fetch of data in the viewer component
    console.log('Preferences saved, refreshing knowledge base...')
  }

  const handlePreferenceAdded = () => {
    // Refresh data when a new preference is added
    console.log('New preference added, refreshing knowledge base...')
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="viewer" className="gap-2">
            <Eye className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="visualization" className="gap-2">
            <Box className="w-4 h-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="viewer" className="h-full overflow-y-auto p-6 max-h-[calc(100vh-200px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <KnowledgeBaseViewer 
                onEditPreferences={handleEditPreferences}
                onAddPreference={handleAddManualPreference}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="h-full overflow-y-auto p-6 max-h-[calc(100vh-200px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="visualization" className="h-full overflow-y-auto p-6 max-h-[calc(100vh-200px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">3D Embeddings Visualization</h2>
                <p className="text-muted-foreground mb-6">
                  Explore your knowledge base embeddings in an immersive 3D space. Each sphere represents a piece of knowledge, positioned based on semantic similarity with interactive connections.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Interactive Features</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Drag to rotate, scroll to zoom, right-click to pan</li>
                    <li>• Hover over spheres to see detailed tooltips</li>
                    <li>• Click spheres to see full details and connections</li>
                    <li>• Similar entries are connected with lines</li>
                    <li>• Adjustable node size, connections, and animations</li>
                    <li>• Filter by category, type, or search terms</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Understanding the Visualization</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Closer points have more similar meanings</li>
                    <li>• Clusters indicate related topics</li>
                    <li>• Isolated points may be unique concepts</li>
                    <li>• Position is determined by AI embeddings</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={handleOpenEmbeddingsVisualization}
                className="w-full md:w-auto gap-2"
                size="lg"
              >
                <Box className="w-5 h-5" />
                Open 3D Visualization
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="settings" className="h-full overflow-y-auto p-6 max-h-[calc(100vh-200px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">Knowledge Base Settings</h2>
                <p className="text-muted-foreground mb-6">
                  Configure how your AI agents learn and store information about your preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Management</h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleEditPreferences}
                      className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Edit Preferences</p>
                          <p className="text-sm text-muted-foreground">
                            Modify your personal preferences and settings
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleAddManualPreference}
                      className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Add Custom Preference</p>
                          <p className="text-sm text-muted-foreground">
                            Manually add new preferences and settings
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Export Data</p>
                          <p className="text-sm text-muted-foreground">
                            Download your knowledge base and preferences
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Import Data</p>
                          <p className="text-sm text-muted-foreground">
                            Import knowledge base from a backup file
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Privacy & Security</h3>
                  <div className="space-y-2">
                    <button className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Clear All Data</p>
                          <p className="text-sm text-muted-foreground">
                            Remove all stored preferences and interactions
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Data Retention</p>
                          <p className="text-sm text-muted-foreground">
                            Configure how long data is stored
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        {isPreferencesEditorOpen && (
          <PreferencesEditor
            isOpen={isPreferencesEditorOpen}
            onClose={() => setIsPreferencesEditorOpen(false)}
            onSave={handlePreferencesSaved}
          />
        )}
        
        {isManualPreferenceAdderOpen && (
          <ManualPreferenceAdder
            isOpen={isManualPreferenceAdderOpen}
            onClose={() => setIsManualPreferenceAdderOpen(false)}
            onPreferenceAdded={handlePreferenceAdded}
          />
        )}
        
        {isEmbeddingsVisualizationOpen && (
          <Advanced3DVisualization
            isOpen={isEmbeddingsVisualizationOpen}
            onClose={() => setIsEmbeddingsVisualizationOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}