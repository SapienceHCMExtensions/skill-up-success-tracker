import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DATABASE_ENTITIES, DatabaseEntity, DatabaseField } from "@/types/workflow"

interface DatabaseEntitySelectorProps {
  value?: string
  onValueChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function DatabaseEntitySelector({ 
  value, 
  onValueChange, 
  label = "Database Entity",
  placeholder = "Select entity..."
}: DatabaseEntitySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {DATABASE_ENTITIES.map((entity) => (
            <SelectItem key={entity.table} value={entity.table}>
              {entity.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface DatabaseFieldSelectorProps {
  entityType?: string
  value?: string
  onValueChange: (value: string) => void
  label?: string
  placeholder?: string
  fieldTypes?: string[]
}

export function DatabaseFieldSelector({ 
  entityType,
  value, 
  onValueChange, 
  label = "Field",
  placeholder = "Select field...",
  fieldTypes
}: DatabaseFieldSelectorProps) {
  const entity = DATABASE_ENTITIES.find(e => e.table === entityType)
  const availableFields = entity?.fields.filter(field => 
    !fieldTypes || fieldTypes.includes(field.type)
  ) || []

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={!entity}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableFields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label} ({field.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface EntityFieldDisplayProps {
  entityType?: string
  fieldName?: string
}

export function EntityFieldDisplay({ entityType, fieldName }: EntityFieldDisplayProps) {
  const entity = DATABASE_ENTITIES.find(e => e.table === entityType)
  const field = entity?.fields.find(f => f.name === fieldName)

  if (!entity || !field) {
    return null
  }

  return (
    <div className="text-xs text-muted-foreground">
      {entity.label}.{field.label}
    </div>
  )
}

export function getEntityField(entityType: string, fieldName: string): DatabaseField | undefined {
  const entity = DATABASE_ENTITIES.find(e => e.table === entityType)
  return entity?.fields.find(f => f.name === fieldName)
}

export function getEntity(entityType: string): DatabaseEntity | undefined {
  return DATABASE_ENTITIES.find(e => e.table === entityType)
}