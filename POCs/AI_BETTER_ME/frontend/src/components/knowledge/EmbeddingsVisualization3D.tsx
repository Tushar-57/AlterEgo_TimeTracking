import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    X,
    RotateCcw,
    Info,
    Search,
    Box
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface EmbeddingPoint {
    entry_id: string
    title: string
    content: string
    category: string
    entry_type: string
    tags: string[]
    position_3d: [number, number, number]
    created_at: string
    updated_at: string
}

interface EmbeddingDetails {
    entry: {
        entry_id: string
        title: string
        content: string
        category: string
        entry_type: string
        tags: string[]
        metadata: Record<string, any>
        created_at: string
        updated_at: string
    }
    embedding_info: {
        has_embedding: boolean
        embedding_dimension: number
        embedding_preview: number[] | null
    }
    similar_entries: Array<{
        entry_id: string
        title: string
        similarity_score: number
        category: string
        entry_type: string
    }>
    statistics: {
        content_length: number
        tag_count: number
        metadata_keys: string[]
    }
}

// Simplified 2D visualization for now to avoid Three.js complexity
const EmbeddingPoint: React.FC<{
    point: EmbeddingPoint
    isSelected: boolean
    isHighlighted: boolean
    onClick: (point: EmbeddingPoint) => void
    colorScheme: string
    position: { x: number; y: number }
}> = ({ point, isSelected, isHighlighted, onClick, colorScheme, position }) => {
    const [hovered, setHovered] = useState(false)

    const getColor = () => {
        if (isSelected) return '#ff6b6b'
        if (isHighlighted) return '#4ecdc4'

        switch (colorScheme) {
            case 'category':
                const categoryColors: Record<string, string> = {
                    'productivity': '#3b82f6',
                    'health': '#10b981',
                    'finance': '#f59e0b',
                    'journal': '#8b5cf6',
                    'system': '#6b7280',
                    'interaction': '#ec4899'
                }
                return categoryColors[point.category] || '#6b7280'

            case 'type':
                const typeColors: Record<string, string> = {
                    'preference': '#3b82f6',
                    'interaction': '#10b981',
                    'insight': '#f59e0b',
                    'pattern': '#8b5cf6'
                }
                return typeColors[point.entry_type] || '#6b7280'

            case 'age':
                const age = Date.now() - new Date(point.created_at).getTime()
                const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
                const ratio = Math.min(age / maxAge, 1)
                return `hsl(${240 - ratio * 120}, 70%, 50%)` // Blue to red gradient

            default:
                return '#6b7280'
        }
    }

    return (
        <div
            className="absolute cursor-pointer transition-all duration-200"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onClick(point)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                className={`w-4 h-4 rounded-full transition-all duration-200 ${isSelected || isHighlighted ? 'animate-pulse' : ''
                    } ${hovered ? 'scale-150' : 'scale-100'}`}
                style={{
                    backgroundColor: getColor(),
                    boxShadow: hovered || isSelected || isHighlighted
                        ? `0 0 20px ${getColor()}`
                        : `0 0 5px ${getColor()}`
                }}
            />

            {hovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-background border border-border rounded-lg p-2 shadow-lg max-w-xs z-10">
                    <h4 className="font-semibold text-sm truncate">{point.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{point.content}</p>
                    <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{point.category}</Badge>
                        <Badge variant="secondary" className="text-xs">{point.entry_type}</Badge>
                    </div>
                </div>
            )}
        </div>
    )
}

interface EmbeddingsVisualization3DProps {
    isOpen: boolean
    onClose: () => void
}

export const EmbeddingsVisualization3D: React.FC<EmbeddingsVisualization3DProps> = ({
    isOpen,
    onClose
}) => {
    const [points, setPoints] = useState<EmbeddingPoint[]>([])
    const [selectedPoint, setSelectedPoint] = useState<EmbeddingPoint | null>(null)
    const [selectedDetails, setSelectedDetails] = useState<EmbeddingDetails | null>(null)
    const [highlightedPoints, setHighlightedPoints] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [colorScheme, setColorScheme] = useState<string>('category')
    const [showLabels, setShowLabels] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [types, setTypes] = useState<string[]>([])

    // Load embeddings data when component opens
    useEffect(() => {
        if (isOpen) {
            loadEmbeddingsData()
        }
    }, [isOpen])

    // Filter points based on search and filters
    const filteredPoints = points.filter(point => {
        const matchesSearch = searchQuery === '' ||
            point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            point.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            point.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory = categoryFilter === 'all' || point.category === categoryFilter
        const matchesType = typeFilter === 'all' || point.entry_type === typeFilter

        return matchesSearch && matchesCategory && matchesType
    })

    const loadEmbeddingsData = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/knowledge/embeddings/visualization')
            if (response.ok) {
                const data = await response.json()
                setPoints(data)

                // Extract unique categories and types
                const uniqueCategories = [...new Set(data.map((p: EmbeddingPoint) => p.category))] as string[]
                const uniqueTypes = [...new Set(data.map((p: EmbeddingPoint) => p.entry_type))] as string[]
                setCategories(uniqueCategories)
                setTypes(uniqueTypes)

                if (data.length === 0) {
                    toast.info('No embeddings available yet. Add some knowledge entries first!')
                } else {
                    toast.success(`Loaded ${data.length} embeddings for visualization`)
                }
            } else {
                throw new Error('Failed to load embeddings data')
            }
        } catch (error) {
            console.error('Failed to load embeddings:', error)
            toast.error('Failed to load embeddings data')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePointClick = async (point: EmbeddingPoint) => {
        setSelectedPoint(point)

        try {
            const response = await fetch(`/api/knowledge/embeddings/${point.entry_id}/details`)
            if (response.ok) {
                const details = await response.json()
                setSelectedDetails(details)

                // Highlight similar entries
                const similarIds = new Set(details.similar_entries.map((e: any) => e.entry_id)) as Set<string>
                setHighlightedPoints(similarIds)
            }
        } catch (error) {
            console.error('Failed to load point details:', error)
            toast.error('Failed to load embedding details')
        }
    }

    const resetView = () => {
        setSelectedPoint(null)
        setSelectedDetails(null)
        setHighlightedPoints(new Set())
        setSearchQuery('')
        setCategoryFilter('all')
        setTypeFilter('all')
    }

    if (!isOpen) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex z-50"
        >
            {/* Main 3D View */}
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-white">
                            <div className="animate-spin w-12 h-12 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
                            <p>Loading embeddings visualization...</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                        {filteredPoints.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-white">
                                    <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-semibold mb-2">No Embeddings Available</h3>
                                    <p className="text-gray-300 mb-4 max-w-md">
                                        The knowledge base doesn't have any embeddings yet.
                                        Add some knowledge entries and they will appear here as interactive points.
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Each point represents a piece of knowledge, positioned based on semantic similarity.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* 2D Visualization Canvas */}
                                <div className="absolute inset-0">
                                    {filteredPoints.map((point) => {
                                        // Convert 3D position to 2D for simplified visualization
                                        const x = ((point.position_3d[0] + 50) / 100) * window.innerWidth * 0.6
                                        const y = ((point.position_3d[1] + 50) / 100) * window.innerHeight * 0.8

                                        return (
                                            <EmbeddingPoint
                                                key={point.entry_id}
                                                point={point}
                                                isSelected={selectedPoint?.entry_id === point.entry_id}
                                                isHighlighted={highlightedPoints.has(point.entry_id)}
                                                onClick={handlePointClick}
                                                colorScheme={colorScheme}
                                                position={{ x: Math.max(50, Math.min(x, window.innerWidth * 0.6 - 50)), y: Math.max(50, Math.min(y, window.innerHeight - 100)) }}
                                            />
                                        )
                                    })}
                                </div>

                                {/* Grid background */}
                                <div className="absolute inset-0 opacity-10">
                                    <svg width="100%" height="100%">
                                        <defs>
                                            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#grid)" />
                                    </svg>
                                </div>

                                {/* Connection lines for similar entries */}
                                {selectedPoint && highlightedPoints.size > 0 && (
                                    <svg className="absolute inset-0 pointer-events-none">
                                        {Array.from(highlightedPoints).map(highlightedId => {
                                            const highlightedPoint = filteredPoints.find(p => p.entry_id === highlightedId)
                                            if (!highlightedPoint) return null

                                            const selectedX = ((selectedPoint.position_3d[0] + 50) / 100) * window.innerWidth * 0.6
                                            const selectedY = ((selectedPoint.position_3d[1] + 50) / 100) * window.innerHeight * 0.8
                                            const highlightedX = ((highlightedPoint.position_3d[0] + 50) / 100) * window.innerWidth * 0.6
                                            const highlightedY = ((highlightedPoint.position_3d[1] + 50) / 100) * window.innerHeight * 0.8

                                            return (
                                                <line
                                                    key={highlightedId}
                                                    x1={Math.max(50, Math.min(selectedX, window.innerWidth * 0.6 - 50))}
                                                    y1={Math.max(50, Math.min(selectedY, window.innerHeight - 100))}
                                                    x2={Math.max(50, Math.min(highlightedX, window.innerWidth * 0.6 - 50))}
                                                    y2={Math.max(50, Math.min(highlightedY, window.innerHeight - 100))}
                                                    stroke="#4ecdc4"
                                                    strokeWidth="2"
                                                    opacity="0.6"
                                                    strokeDasharray="5,5"
                                                />
                                            )
                                        })}
                                    </svg>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onClose}
                        className="bg-black/50 hover:bg-black/70 text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={resetView}
                        className="bg-black/50 hover:bg-black/70 text-white"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                </div>

                {/* Info Overlay */}
                <div className="absolute top-4 right-4 text-white text-sm bg-black/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4" />
                        <span>Knowledge Base Visualization (2D)</span>
                    </div>
                    <div className="text-xs space-y-1">
                        <div>Total: {points.length} embeddings</div>
                        <div>Visible: {filteredPoints.length} embeddings</div>
                        {selectedPoint && <div>Selected: {selectedPoint.title}</div>}
                        {highlightedPoints.size > 0 && <div>Similar: {highlightedPoints.size} entries</div>}
                    </div>
                </div>
            </div>

            {/* Side Panel */}
            <div className="w-96 bg-background border-l border-border overflow-y-auto">
                <div className="p-4 space-y-4">
                    {/* Search and Filters */}
                    <Card className="p-4">
                        <h3 className="font-semibold mb-3">Filters & Search</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search embeddings..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {types.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* Visualization Settings */}
                    <Card className="p-4">
                        <h3 className="font-semibold mb-3">Visualization</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Color Scheme</label>
                                <Select value={colorScheme} onValueChange={setColorScheme}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="category">By Category</SelectItem>
                                        <SelectItem value="type">By Type</SelectItem>
                                        <SelectItem value="age">By Age</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Show Labels</label>
                                <Switch
                                    checked={showLabels}
                                    onCheckedChange={setShowLabels}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Selected Point Details */}
                    {selectedPoint && selectedDetails && (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">Selected Embedding</h3>

                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-medium text-sm">{selectedDetails.entry.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {selectedDetails.entry.content.length > 150
                                            ? selectedDetails.entry.content.substring(0, 150) + '...'
                                            : selectedDetails.entry.content
                                        }
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline">{selectedDetails.entry.category}</Badge>
                                    <Badge variant="secondary">{selectedDetails.entry.entry_type}</Badge>
                                    {selectedDetails.entry.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                </div>

                                <div className="text-xs space-y-1">
                                    <div>Dimension: {selectedDetails.embedding_info.embedding_dimension}</div>
                                    <div>Content Length: {selectedDetails.statistics.content_length}</div>
                                    <div>Tags: {selectedDetails.statistics.tag_count}</div>
                                    <div>Created: {new Date(selectedDetails.entry.created_at).toLocaleDateString()}</div>
                                </div>

                                {selectedDetails.similar_entries.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-sm mb-2">Similar Entries</h5>
                                        <div className="space-y-1">
                                            {selectedDetails.similar_entries.map(similar => (
                                                <div key={similar.entry_id} className="text-xs p-2 bg-muted rounded">
                                                    <div className="font-medium">{similar.title}</div>
                                                    <div className="text-muted-foreground">
                                                        Similarity: {(similar.similarity_score * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </motion.div>
    )
}