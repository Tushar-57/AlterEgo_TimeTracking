import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  X,
  Save,
  Tag,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Validation schema for manual preference addition
const addPreferenceSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  key: z.string().min(1, 'Key is required').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Key must be a valid identifier'),
  valueType: z.enum(['string', 'number', 'boolean', 'array', 'date']),
  value: z.any(),
  description: z.string().optional()
})

type AddPreferenceFormData = z.infer<typeof addPreferenceSchema>

interface ManualPreferenceAdderProps {
  isOpen: boolean
  onClose: () => void
  onPreferenceAdded?: () => void
}

export const ManualPreferenceAdder: React.FC<ManualPreferenceAdderProps> = ({
  isOpen,
  onClose,
  onPreferenceAdded
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [customCategory, setCustomCategory] = useState('')
  const [arrayValue, setArrayValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<AddPreferenceFormData>({
    resolver: zodResolver(addPreferenceSchema),
    defaultValues: {
      category: '',
      key: '',
      valueType: 'string',
      value: '',
      description: ''
    }
  })

  const valueType = watch('valueType')
  const selectedCategory = watch('category')

  // Load available categories when component opens
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge/preferences/categories')
      if (response.ok) {
        const categoryList = await response.json()
        setCategories(categoryList)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Failed to load preference categories')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: AddPreferenceFormData) => {
    setIsSaving(true)
    try {
      // Process value based on type
      let processedValue = data.value
      
      switch (data.valueType) {
        case 'number':
          processedValue = parseFloat(data.value)
          if (isNaN(processedValue)) {
            toast.error('Invalid number value')
            return
          }
          break
        case 'boolean':
          processedValue = data.value === true || data.value === 'true'
          break
        case 'array':
          processedValue = arrayValue.split(',').map(item => item.trim()).filter(Boolean)
          break
        case 'date':
          processedValue = data.value
          break
        default:
          processedValue = String(data.value)
      }

      const category = selectedCategory === 'custom' ? customCategory : selectedCategory

      const response = await fetch('/api/knowledge/preferences/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          key: data.key,
          value: processedValue,
          description: data.description
        })
      })

      if (response.ok) {
        toast.success('Preference added successfully!')
        onPreferenceAdded?.()
        reset()
        setArrayValue('')
        setCustomCategory('')
        onClose()
      } else {
        throw new Error('Failed to add preference')
      }
    } catch (error) {
      console.error('Failed to add preference:', error)
      toast.error('Failed to add preference')
    } finally {
      setIsSaving(false)
    }
  }

  const renderValueInput = () => {
    switch (valueType) {
      case 'string':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Value</label>
            <Input
              {...register('value')}
              placeholder="Enter string value"
            />
          </div>
        )
      
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Value</label>
            <Input
              type="number"
              step="any"
              {...register('value')}
              placeholder="Enter number value"
            />
          </div>
        )
      
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Value</label>
            <Switch
              checked={watch('value') === true}
              onCheckedChange={(checked) => setValue('value', checked, { shouldDirty: true })}
            />
          </div>
        )
      
      case 'array':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Value (Array)</label>
            <Input
              value={arrayValue}
              onChange={(e) => {
                setArrayValue(e.target.value)
                setValue('value', e.target.value, { shouldDirty: true })
              }}
              placeholder="item1, item2, item3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate items with commas
            </p>
            {arrayValue && (
              <div className="flex flex-wrap gap-1 mt-2">
                {arrayValue.split(',').map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      
      case 'date':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Value</label>
            <Input
              type="date"
              {...register('value')}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  const getValueTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return <Type className="w-4 h-4" />
      case 'number': return <Hash className="w-4 h-4" />
      case 'boolean': return <ToggleLeft className="w-4 h-4" />
      case 'array': return <Tag className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Add Custom Preference
            </h2>
            <p className="text-muted-foreground">
              Add a new preference to customize your AI agent's behavior
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Preference Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => setValue('category', value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Create New Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Custom Category Input */}
                  {selectedCategory === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">New Category Name</label>
                      <Input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>
                  )}

                  {/* Key Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Key</label>
                    <Input
                      {...register('key')}
                      placeholder="preference_key"
                    />
                    {errors.key && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.key.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Use lowercase letters, numbers, and underscores only
                    </p>
                  </div>

                  {/* Value Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Value Type</label>
                    <Select
                      value={valueType}
                      onValueChange={(value) => setValue('valueType', value as any, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">
                          <div className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Text
                          </div>
                        </SelectItem>
                        <SelectItem value="number">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Number
                          </div>
                        </SelectItem>
                        <SelectItem value="boolean">
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="w-4 h-4" />
                            True/False
                          </div>
                        </SelectItem>
                        <SelectItem value="array">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            List
                          </div>
                        </SelectItem>
                        <SelectItem value="date">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Value Input */}
                <div className="mt-4">
                  {renderValueInput()}
                </div>

                {/* Description */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <Textarea
                    {...register('description')}
                    placeholder="Describe what this preference controls..."
                    rows={3}
                  />
                </div>
              </Card>

              {/* Preview */}
              {isDirty && (
                <Card className="p-4 bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Preview</h4>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{selectedCategory === 'custom' ? customCategory : selectedCategory}</Badge>
                      <span>→</span>
                      <code className="bg-background px-2 py-1 rounded text-xs">{watch('key')}</code>
                      <span>:</span>
                      {getValueTypeIcon(valueType)}
                      <span className="capitalize">{valueType}</span>
                    </div>
                    {watch('description') && (
                      <p className="text-xs mt-2 italic">{watch('description')}</p>
                    )}
                  </div>
                </Card>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {isDirty && 'Ready to add preference'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving || !isDirty}
              className="gap-2"
            >
              {isSaving ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Add Preference
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}