import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
    OrbitControls,
    Text,
    Html,
    Line,
    Sphere,
    Environment,
    Stats
} from '@react-three/drei'
import * as THREE from 'three'
import {
    X,
    RotateCcw,
    Info,
    Search,
    Settings,
    Maximize2,
    Minimize2,
    Box
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'

// Color scheme helper function
const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
        'productivity': '#4a9eff',
        'health': '#00d084',
        'finance': '#ffb347',
        'journal': '#a855f7',
        'system': '#64748b',
        'interaction': '#f472b6'
    }
    return categoryColors[category] || '#64748b'
}

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
    similarities?: Array<{
        target_id: string
        similarity: number
    }>
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

// 3D Node Component
const EmbeddingNode: React.FC<{
    point: EmbeddingPoint
    isSelected: boolean
    isHighlighted: boolean
    onClick: (point: EmbeddingPoint) => void
    onHover: (point: EmbeddingPoint | null) => void
    colorScheme: string
    nodeSize: number
    showLabels: boolean
}> = ({ point, isSelected, isHighlighted, onClick, onHover, colorScheme, nodeSize, showLabels }) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    // Stable positioning - no continuous animation that causes resets
    useFrame(() => {
        if (meshRef.current) {
            // Only animate scale for selected/highlighted/hovered states
            let targetScale = nodeSize
            if (isSelected) {
                targetScale = nodeSize * 1.8
            } else if (isHighlighted) {
                targetScale = nodeSize * 1.4
            } else if (hovered) {
                targetScale = nodeSize * 1.2
            }

            // Smooth scale transition without position changes
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })

    const getColor = () => {
        if (isSelected) return '#ff4444'
        if (isHighlighted) return '#44ffaa'

        switch (colorScheme) {
            case 'category':
                return getCategoryColor(point.category)

            case 'type':
                const typeColors: Record<string, string> = {
                    'preference': '#4a9eff',
                    'interaction': '#00d084',
                    'insight': '#ffb347',
                    'pattern': '#a855f7'
                }
                return typeColors[point.entry_type] || '#64748b'

            case 'age':
                const age = Date.now() - new Date(point.created_at).getTime()
                const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
                const ratio = Math.min(age / maxAge, 1)
                return `hsl(${200 - ratio * 80}, 80%, 60%)` // Cyan to blue gradient

            default:
                return '#64748b'
        }
    }

    return (
        <group position={[point.position_3d[0], point.position_3d[1], point.position_3d[2]]}>
            {/* Invisible larger hover area for easier interaction */}
            <Sphere
                args={[1.5, 8, 8]}
                visible={false}
                onClick={() => onClick(point)}
                onPointerOver={(e) => {
                    e.stopPropagation()
                    // Clear any pending hide timeout
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current)
                        hoverTimeoutRef.current = null
                    }
                    if (!hovered) {
                        setHovered(true)
                        onHover(point)
                    }
                    document.body.style.cursor = 'pointer'
                }}
                onPointerOut={(e) => {
                    e.stopPropagation()
                    setHovered(false)
                    document.body.style.cursor = 'auto'
                    // Longer delay to prevent flickering when mouse moves slightly
                    hoverTimeoutRef.current = setTimeout(() => {
                        onHover(null)
                    }, 400)
                }}
                onPointerMove={(e) => {
                    e.stopPropagation()
                    // Keep tooltip visible when mouse moves within the node
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current)
                        hoverTimeoutRef.current = null
                    }
                    if (!hovered) {
                        setHovered(true)
                        onHover(point)
                    }
                }}
            />

            {/* Visible node */}
            <Sphere
                ref={meshRef}
                args={[0.8, 16, 16]}
            >
                <meshBasicMaterial
                    color={getColor()}
                    transparent
                    opacity={hovered || isSelected || isHighlighted ? 1.0 : 0.8}
                />
            </Sphere>

            {/* Outer glow ring for selected/highlighted nodes */}
            {(isSelected || isHighlighted) && (
                <Sphere args={[1.2, 16, 16]}>
                    <meshBasicMaterial
                        color={getColor()}
                        transparent
                        opacity={0.3}
                        side={THREE.BackSide}
                    />
                </Sphere>
            )}

            {/* Enhanced 3D Labels */}
            {showLabels && (
                <group>
                    <Text
                        position={[0, 1.8, 0]}
                        fontSize={0.8}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.1}
                        outlineColor="black"
                    >
                        {point.title.length > 15 ? point.title.substring(0, 15) + '...' : point.title}
                    </Text>
                    {/* Category indicator below title */}
                    <Text
                        position={[0, 1.3, 0]}
                        fontSize={0.4}
                        color={getCategoryColor(point.category)}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="black"
                    >
                        {point.category.toUpperCase()}
                    </Text>
                </group>
            )}
        </group>
    )
}

// Connection Lines Component
const ConnectionLines: React.FC<{
    points: EmbeddingPoint[]
    selectedPoint: EmbeddingPoint | null
    similarityThreshold: number
    showAllConnections: boolean
}> = ({ points, selectedPoint, similarityThreshold, showAllConnections }) => {
    // Robust similarity calculation
    const calcSimilarity = (a: EmbeddingPoint, b: EmbeddingPoint) => {
        let similarity = 0
        if (a.category && b.category && a.category === b.category) similarity += 0.5
        const tagsA = Array.isArray(a.tags) ? a.tags : []
        const tagsB = Array.isArray(b.tags) ? b.tags : []
        const commonTags = tagsA.filter(tag => tagsB.includes(tag)).length
        if (tagsA.length > 0 && tagsB.length > 0) {
            similarity += (commonTags / Math.max(tagsA.length, tagsB.length)) * 0.5
        }
        return similarity
    }

    const connections = useMemo(() => {
        const lines: Array<{
            start: [number, number, number]
            end: [number, number, number]
            strength: number
            color: string
        }> = []

        if (showAllConnections) {
            // Show all connections above threshold
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const point1 = points[i]
                    const point2 = points[j]
                    const similarity = calcSimilarity(point1, point2)
                    if (similarity >= similarityThreshold) {
                        lines.push({
                            start: point1.position_3d,
                            end: point2.position_3d,
                            strength: similarity,
                            color: similarity > 0.7 ? '#4ecdc4' : '#6b7280'
                        })
                    }
                }
            }
        } else if (selectedPoint) {
            // Show connections from selected point to similar points
            points.forEach(point => {
                if (point.entry_id !== selectedPoint.entry_id) {
                    const similarity = calcSimilarity(selectedPoint, point)
                    if (similarity >= similarityThreshold) {
                        lines.push({
                            start: selectedPoint.position_3d,
                            end: point.position_3d,
                            strength: similarity,
                            color: similarity > 0.7 ? '#4ecdc4' : '#6b7280'
                        })
                    }
                }
            })
        }
        return lines
    }, [points, selectedPoint?.entry_id, similarityThreshold, showAllConnections])

    return (
        <>
            {connections.map((connection, index) => (
                <Line
                    key={index}
                    points={[connection.start, connection.end]}
                    color={connection.strength > 0.7 ? '#44ffaa' : '#4a9eff'}
                    transparent
                    opacity={connection.strength > 0.7 ? 0.8 : 0.4}
                />
            ))}
        </>
    )
}

// Professional Hover Tooltip System
const HoverTooltip: React.FC<{
    point: EmbeddingPoint | null
    position: THREE.Vector3 | null
}> = ({ point, position }) => {
    const tooltipRef = useRef<THREE.Group>(null)
    const { camera } = useThree()
    const [isVisible, setIsVisible] = useState(false)

    // Enhanced tooltip positioning and sizing logic
    useFrame(() => {
        if (tooltipRef.current && position && camera) {
            // Always face the camera
            tooltipRef.current.lookAt(camera.position)

            // Calculate distance for intelligent scaling
            const distance = camera.position.distanceTo(new THREE.Vector3(position.x, position.y, position.z))

            // Much more aggressive scaling for distant nodes
            // Base scale starts at 2.0, goes up to 8.0 for very distant nodes
            const baseScale = 2.0
            const maxScale = 10.0
            const scaleFactor = Math.max(baseScale, Math.min(maxScale, (distance / 20) * baseScale))

            tooltipRef.current.scale.setScalar(scaleFactor)

            // Fade in/out animation
            if (!isVisible && point) {
                setIsVisible(true)
            }
        }
    })

    // Reset visibility when point changes
    useEffect(() => {
        if (!point) {
            setIsVisible(false)
        }
    }, [point])

    if (!point || !position) return null

    return (
        <group ref={tooltipRef} position={[position.x, position.y + 2.5, position.z]}>
            <Html
                center
                distanceFactor={30}
                zIndexRange={[1000, 0]}
                pointerEvents="none"
                transform={false}
                sprite
            >
                <div
                    className={`bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white rounded-2xl shadow-2xl border border-gray-500/50 backdrop-blur-xl pointer-events-none transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                    style={{
                        width: '380px',
                        padding: '24px',
                        transform: 'translate(-50%, -100%)',
                        marginBottom: '16px',
                        boxShadow: `
                            0 32px 64px -12px rgba(0, 0, 0, 0.9),
                            0 0 0 1px rgba(255, 255, 255, 0.1),
                            inset 0 1px 0 rgba(255, 255, 255, 0.1)
                        `,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.95) 100%)'
                    }}
                >
                    {/* Header with title and category indicator */}
                    <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-xl text-white leading-tight flex-1 pr-3">
                            {point.title}
                        </h4>
                        <div
                            className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: getCategoryColor(point.category) }}
                        />
                    </div>

                    {/* Content with better typography */}
                    <p className="text-base text-gray-200 mb-4 leading-relaxed font-medium">
                        {point.content.length > 180 ? point.content.substring(0, 180) + '...' : point.content}
                    </p>

                    {/* Enhanced badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge
                            variant="outline"
                            className="text-sm font-semibold px-3 py-1.5 rounded-full border-2"
                            style={{
                                backgroundColor: `${getCategoryColor(point.category)}20`,
                                borderColor: `${getCategoryColor(point.category)}60`,
                                color: '#ffffff'
                            }}
                        >
                            📁 {point.category}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="text-sm font-semibold bg-purple-500/30 text-purple-100 border-purple-400/60 px-3 py-1.5 rounded-full border-2"
                        >
                            🔖 {point.entry_type}
                        </Badge>
                    </div>

                    {/* Enhanced metadata */}
                    <div className="text-sm text-gray-300 space-y-2 border-t border-gray-700/50 pt-3">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-400 text-base">📅</span>
                            <span className="font-medium">{new Date(point.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-green-400 text-base mt-0.5">🏷️</span>
                            <div className="flex-1">
                                <div className="flex flex-wrap gap-1">
                                    {point.tags.slice(0, 5).map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-block bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded text-xs font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {point.tags.length > 5 && (
                                        <span className="inline-block bg-gray-600/50 text-gray-400 px-2 py-0.5 rounded text-xs">
                                            +{point.tags.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional arrow with glow */}
                    <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: '14px solid transparent',
                            borderRight: '14px solid transparent',
                            borderTop: '14px solid rgba(0, 0, 0, 0.95)',
                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
                        }}
                    />
                </div>
            </Html>
        </group>
    )
}

// Main 3D Scene Component
const Scene3D: React.FC<{
    points: EmbeddingPoint[]
    selectedPoint: EmbeddingPoint | null
    hoveredPoint: EmbeddingPoint | null
    onPointClick: (point: EmbeddingPoint) => void
    onPointHover: (point: EmbeddingPoint | null) => void
    colorScheme: string
    nodeSize: number
    showLabels: boolean
    showConnections: boolean
    showAllConnections: boolean
    similarityThreshold: number
    animationSpeed: number
}> = ({
    points,
    selectedPoint,
    hoveredPoint,
    onPointClick,
    onPointHover,
    colorScheme,
    nodeSize,
    showLabels,
    showConnections,
    showAllConnections,
    similarityThreshold }) => {
        const { camera } = useThree()
        const groupRef = useRef<THREE.Group>(null)
        const [hoveredPosition, setHoveredPosition] = useState<THREE.Vector3 | null>(null)

        // Auto-fit camera only once when points first load
        useEffect(() => {
            if (points.length > 0) {
                const box = new THREE.Box3()
                points.forEach(point => {
                    box.expandByPoint(new THREE.Vector3(...point.position_3d))
                })

                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())
                const maxDim = Math.max(size.x, size.y, size.z)

                // Only set camera position once, don't continuously update
                if (camera.position.length() < 10) { // Only if camera hasn't been moved by user
                    camera.position.set(center.x + maxDim * 1.5, center.y + maxDim, center.z + maxDim * 1.5)
                    camera.lookAt(center)
                }
            }
        }, [points.length]) // Only depend on points.length, not the full points array

        // Remove auto-rotation to prevent constant resets

        // Update hovered position for tooltip - stable version
        useEffect(() => {
            if (hoveredPoint) {
                const position = new THREE.Vector3(...hoveredPoint.position_3d)
                setHoveredPosition(position)
            } else {
                setHoveredPosition(null)
            }
        }, [hoveredPoint?.entry_id]) // Only update when the hovered point ID changes

        const highlightedPoints = useMemo(() => {
            if (!selectedPoint) return new Set<string>()

            const highlighted = new Set<string>()
            points.forEach(point => {
                if (point.entry_id !== selectedPoint.entry_id) {
                    let similarity = 0
                    if (point.category === selectedPoint.category) similarity += 0.5
                    const commonTags = point.tags.filter(tag => selectedPoint.tags.includes(tag)).length
                    if (point.tags.length > 0 && selectedPoint.tags.length > 0) {
                        similarity += (commonTags / Math.max(point.tags.length, selectedPoint.tags.length)) * 0.5
                    }

                    if (similarity >= similarityThreshold) {
                        highlighted.add(point.entry_id)
                    }
                }
            })

            return highlighted
        }, [selectedPoint?.entry_id, points.length, similarityThreshold]) // Only recalculate when necessary

        return (
            <>
                {/* Lighting for dark theme */}
                <ambientLight intensity={0.2} />
                <pointLight position={[20, 20, 20]} intensity={0.5} color="#ffffff" />
                <pointLight position={[-20, -20, -20]} intensity={0.3} color="#4a9eff" />

                {/* Dark environment */}
                <Environment preset="night" />

                {/* Main group with all nodes */}
                <group ref={groupRef}>
                    {points.map((point) => (
                        <EmbeddingNode
                            key={point.entry_id}
                            point={point}
                            isSelected={selectedPoint?.entry_id === point.entry_id}
                            isHighlighted={highlightedPoints.has(point.entry_id)}
                            onClick={onPointClick}
                            onHover={onPointHover}
                            colorScheme={colorScheme}
                            nodeSize={nodeSize}
                            showLabels={showLabels}
                        />
                    ))}

                    {/* Connection lines */}
                    {showConnections && (
                        <ConnectionLines
                            points={points}
                            selectedPoint={selectedPoint}
                            similarityThreshold={similarityThreshold}
                            showAllConnections={showAllConnections}
                        />
                    )}
                </group>

                {/* Hover tooltip */}
                <HoverTooltip point={hoveredPoint} position={hoveredPosition} />
            </>
        )
    }

// Main Component
interface Advanced3DVisualizationProps {
    isOpen: boolean
    onClose: () => void
}

export const Advanced3DVisualization: React.FC<Advanced3DVisualizationProps> = ({
    isOpen,
    onClose
}) => {
    const [points, setPoints] = useState<EmbeddingPoint[]>([])
    const [processedPoints, setProcessedPoints] = useState<EmbeddingPoint[]>([])
    const [selectedPoint, setSelectedPoint] = useState<EmbeddingPoint | null>(null)
    const [hoveredPoint, setHoveredPoint] = useState<EmbeddingPoint | null>(null)
    const [selectedDetails, setSelectedDetails] = useState<EmbeddingDetails | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [colorScheme, setColorScheme] = useState<string>('category')
    const [showLabels, setShowLabels] = useState(false)
    const [showConnections, setShowConnections] = useState(true)
    const [showAllConnections, setShowAllConnections] = useState(false)
    const [nodeSize, setNodeSize] = useState(1)
    const [similarityThreshold, setSimilarityThreshold] = useState(0.3)
    const [animationSpeed, setAnimationSpeed] = useState(1)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [types, setTypes] = useState<string[]>([])
    const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
    const hoverStabilityRef = useRef<NodeJS.Timeout | null>(null)

    // Stable hover handler to prevent flickering
    const handlePointHover = (point: EmbeddingPoint | null) => {
        if (hoverStabilityRef.current) {
            clearTimeout(hoverStabilityRef.current)
        }

        if (point) {
            // Immediately show hover
            setHoveredPoint(point)
        } else {
            // Delay hiding to prevent flickering
            hoverStabilityRef.current = setTimeout(() => {
                setHoveredPoint(null)
            }, 150)
        }
    }

    // Load embeddings data when component opens
    useEffect(() => {
        if (isOpen) {
            loadEmbeddingsData()
        }
    }, [isOpen])

    // Cleanup hover timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverStabilityRef.current) {
                clearTimeout(hoverStabilityRef.current)
            }
        }
    }, [])

    // Process points to create proper clustering and spacing
    const processPointsForVisualization = (rawPoints: EmbeddingPoint[]): EmbeddingPoint[] => {
        if (rawPoints.length === 0) return []

        // Group points by category for clustering
        const categoryGroups: Record<string, EmbeddingPoint[]> = {}
        rawPoints.forEach(point => {
            if (!categoryGroups[point.category]) {
                categoryGroups[point.category] = []
            }
            categoryGroups[point.category].push(point)
        })

        const processedPoints: EmbeddingPoint[] = []
        const categories = Object.keys(categoryGroups)
        const clusterRadius = 30
        const nodeSpacing = 8

        categories.forEach((category, categoryIndex) => {
            const categoryPoints = categoryGroups[category]

            // Position each category cluster in a circle around the origin
            const angle = (categoryIndex / categories.length) * Math.PI * 2
            const clusterCenterX = Math.cos(angle) * clusterRadius
            const clusterCenterZ = Math.sin(angle) * clusterRadius
            const clusterCenterY = (Math.random() - 0.5) * 10 // Some vertical variation

            // Arrange points within each cluster
            categoryPoints.forEach((point, pointIndex) => {
                const pointsInCluster = categoryPoints.length
                const pointAngle = (pointIndex / pointsInCluster) * Math.PI * 2
                const distance = Math.sqrt(pointsInCluster) * nodeSpacing

                const x = clusterCenterX + Math.cos(pointAngle) * distance + (Math.random() - 0.5) * 5
                const y = clusterCenterY + (Math.random() - 0.5) * 10
                const z = clusterCenterZ + Math.sin(pointAngle) * distance + (Math.random() - 0.5) * 5

                processedPoints.push({
                    ...point,
                    position_3d: [x, y, z]
                })
            })
        })

        return processedPoints
    }

    // Process points when raw points change
    useEffect(() => {
        if (points.length > 0) {
            const processed = processPointsForVisualization(points)
            setProcessedPoints(processed)
        }
    }, [points])

    // Filter points based on search and filters
    const filteredPoints = processedPoints.filter(point => {
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
                    toast.success(`Loaded ${data.length} embeddings for 3D visualization`)
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
            }
        } catch (error) {
            console.error('Failed to load point details:', error)
            toast.error('Failed to load embedding details')
        }
    }

    const resetView = () => {
        setSelectedPoint(null)
        setSelectedDetails(null)
        setHoveredPoint(null)
        setSearchQuery('')
        setCategoryFilter('all')
        setTypeFilter('all')
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    if (!isOpen) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/95 flex z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}
        >
            {/* Main View Area */}
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-white">
                            <div className="animate-spin w-12 h-12 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
                            <p>Loading visualization...</p>
                        </div>
                    </div>
                ) : filteredPoints.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-white">
                            <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                                <Settings className="w-full h-full" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Embeddings Available</h3>
                            <p className="text-gray-300 mb-4 max-w-md">
                                The knowledge base doesn't have any embeddings yet.
                                Add some knowledge entries and they will appear here.
                            </p>
                        </div>
                    </div>
                ) : viewMode === 'graph' ? (
                    <Canvas
                        camera={{ position: [80, 50, 80], fov: 60 }}
                        gl={{ antialias: true, alpha: false }}
                        onCreated={({ gl, scene }) => {
                            gl.setClearColor('#0a0a0a')
                            scene.fog = new THREE.Fog('#0a0a0a', 100, 300)
                        }}
                    >
                        <Suspense fallback={null}>
                            <Scene3D
                                points={filteredPoints}
                                selectedPoint={selectedPoint}
                                hoveredPoint={hoveredPoint}
                                onPointClick={handlePointClick}
                                onPointHover={handlePointHover}
                                colorScheme={colorScheme}
                                nodeSize={nodeSize}
                                showLabels={showLabels}
                                showConnections={showConnections}
                                showAllConnections={showAllConnections}
                                similarityThreshold={similarityThreshold}
                                animationSpeed={animationSpeed}
                            />
                            <OrbitControls
                                enablePan
                                enableZoom
                                enableRotate
                                maxDistance={300}
                                minDistance={20}
                                dampingFactor={0.05}
                                enableDamping
                            />
                            {showStats && <Stats />}
                        </Suspense>
                    </Canvas>
                ) : (
                    // List View
                    <div className="flex h-full bg-gray-900">
                        {/* Left Panel - List of Embeddings */}
                        <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
                            <div className="p-4">
                                <h3 className="text-white font-semibold mb-4">Knowledge Embeddings ({filteredPoints.length})</h3>
                                <div className="space-y-2">
                                    {filteredPoints.map((point) => (
                                        <div
                                            key={point.entry_id}
                                            onClick={() => handlePointClick(point)}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedPoint?.entry_id === point.entry_id
                                                ? 'bg-blue-600/30 border border-blue-500'
                                                : 'bg-gray-800 hover:bg-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-white font-medium text-sm mb-1">{point.title}</h4>
                                                    <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                                                        {point.content.length > 100
                                                            ? point.content.substring(0, 100) + '...'
                                                            : point.content
                                                        }
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
                                                            {point.category}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
                                                            {point.entry_type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="ml-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{
                                                            backgroundColor: getCategoryColor(point.category)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Details */}
                        <div className="w-1/2 overflow-y-auto">
                            <div className="p-4">
                                {selectedPoint && selectedDetails ? (
                                    <div className="text-white">
                                        <h3 className="font-semibold mb-4">Embedding Details</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-medium text-lg mb-2">{selectedDetails.entry.title}</h4>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {selectedDetails.entry.content}
                                                </p>
                                            </div>

                                            <div>
                                                <h5 className="font-medium mb-2">Metadata</h5>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-gray-400">Category:</span>
                                                        <span className="ml-2 text-blue-300">{selectedDetails.entry.category}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Type:</span>
                                                        <span className="ml-2 text-purple-300">{selectedDetails.entry.entry_type}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Content Length:</span>
                                                        <span className="ml-2">{selectedDetails.statistics.content_length}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Tags:</span>
                                                        <span className="ml-2">{selectedDetails.statistics.tag_count}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Embedding Dim:</span>
                                                        <span className="ml-2">{selectedDetails.embedding_info.embedding_dimension}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Created:</span>
                                                        <span className="ml-2">{new Date(selectedDetails.entry.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h5 className="font-medium mb-2">Tags</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedDetails.entry.tags.map(tag => (
                                                        <Badge key={tag} variant="outline" className="text-xs bg-gray-700 text-gray-300">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedDetails.similar_entries.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium mb-2">Similar Entries</h5>
                                                    <div className="space-y-2">
                                                        {selectedDetails.similar_entries.map(similar => (
                                                            <div key={similar.entry_id} className="p-2 bg-gray-800 rounded text-xs">
                                                                <div className="font-medium">{similar.title}</div>
                                                                <div className="text-gray-400">
                                                                    Similarity: {(similar.similarity_score * 100).toFixed(1)}% • {similar.category}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 mt-8">
                                        <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Select an embedding from the list to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Overlay */}
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

                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="bg-black/50 hover:bg-black/70 text-white"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>
                </div>

                {/* Graph/List Toggle - Top Right */}
                <div className="absolute top-4 right-4 flex gap-2 mb-4">
                    <div className="bg-black/80 rounded-lg p-1 border border-gray-700">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('graph')}
                            className={viewMode === 'graph' ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                        >
                            📊 Graph
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                        >
                            📋 List
                        </Button>
                    </div>
                </div>

                {/* Legend Panel - Only show in graph mode */}
                {viewMode === 'graph' && (
                    <div className="absolute top-16 right-4 text-white text-sm bg-black/80 rounded-lg p-4 min-w-[200px] border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4" />
                            <span className="font-semibold">Legend</span>
                        </div>

                        {/* Statistics */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2">STATISTICS</div>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-blue-400">📊 {points.length} memories</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-400">📄 {categories.length} categories</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-purple-400">🔗 {showConnections ? 'Connected' : 'Isolated'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Node Types */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2">NODES</div>
                            <div className="text-xs space-y-1">
                                {categories.slice(0, 4).map(category => (
                                    <div key={category} className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: getCategoryColor(category) }}
                                        ></div>
                                        <span className="capitalize">{category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2">STATUS</div>
                            <div className="text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <span>Selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span>Similar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                    <span>Default</span>
                                </div>
                            </div>
                        </div>

                        {/* Connections */}
                        <div>
                            <div className="text-xs text-gray-400 mb-2">CONNECTIONS</div>
                            <div className="text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-green-400"></div>
                                    <span>Strong</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-blue-400"></div>
                                    <span>Weak</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Panel */}
            <div className={`bg-background border-l border-border overflow-y-auto ${isFullscreen ? 'w-80' : 'w-96'}`}>
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

                        <div className="space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium mb-2">Node Size</label>
                                <Slider
                                    value={[nodeSize]}
                                    onValueChange={(value) => setNodeSize(value[0])}
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                    className="w-full"
                                />
                                <div className="text-xs text-muted-foreground mt-1">{nodeSize.toFixed(1)}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Similarity Threshold</label>
                                <Slider
                                    value={[similarityThreshold]}
                                    onValueChange={(value) => setSimilarityThreshold(value[0])}
                                    min={0.1}
                                    max={0.9}
                                    step={0.1}
                                    className="w-full"
                                />
                                <div className="text-xs text-muted-foreground mt-1">{(similarityThreshold * 100).toFixed(0)}%</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Animation Speed</label>
                                <Slider
                                    value={[animationSpeed]}
                                    onValueChange={(value) => setAnimationSpeed(value[0])}
                                    min={0}
                                    max={3}
                                    step={0.1}
                                    className="w-full"
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    {animationSpeed === 0 ? 'Paused' : `${animationSpeed.toFixed(1)}x`}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Show Labels</label>
                                    <Switch
                                        checked={showLabels}
                                        onCheckedChange={setShowLabels}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Show Connections</label>
                                    <Switch
                                        checked={showConnections}
                                        onCheckedChange={setShowConnections}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">All Connections</label>
                                    <Switch
                                        checked={showAllConnections}
                                        onCheckedChange={setShowAllConnections}
                                        disabled={!showConnections}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Performance Stats</label>
                                    <Switch
                                        checked={showStats}
                                        onCheckedChange={setShowStats}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Selected Point Details */}
                    {selectedPoint && selectedDetails && (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">Selected Node</h3>

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
                                    {selectedDetails.entry.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                    {selectedDetails.entry.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">+{selectedDetails.entry.tags.length - 3}</Badge>
                                    )}
                                </div>

                                <div className="text-xs space-y-1">
                                    <div>Embedding Dimension: {selectedDetails.embedding_info.embedding_dimension}</div>
                                    <div>Content Length: {selectedDetails.statistics.content_length}</div>
                                    <div>Tags: {selectedDetails.statistics.tag_count}</div>
                                    <div>Created: {new Date(selectedDetails.entry.created_at).toLocaleDateString()}</div>
                                </div>

                                {selectedDetails.similar_entries.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-sm mb-2">Similar Entries</h5>
                                        <div className="space-y-1">
                                            {selectedDetails.similar_entries.map(similar => (
                                                <div key={similar.entry_id} className="text-xs p-2 bg-muted rounded border">
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

                    {/* Instructions */}
                    <Card className="p-4">
                        <h3 className="font-semibold mb-3">Controls</h3>
                        <div className="text-xs space-y-2 text-muted-foreground">
                            <div>• <strong>Mouse:</strong> Rotate view</div>
                            <div>• <strong>Scroll:</strong> Zoom in/out</div>
                            <div>• <strong>Right-click + drag:</strong> Pan</div>
                            <div>• <strong>Click point:</strong> Select and show details</div>
                            <div>• <strong>Hover point:</strong> Quick info</div>
                            <div>• <strong>Settings:</strong> Customize visualization</div>
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    )
}