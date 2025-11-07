# Cambios Completos del Frontend para Microciclos

## Resumen de Cambios

Se han actualizado los componentes del frontend para integrar con el backend los nuevos campos `name` y `description` en los microciclos, y hacer que `sessions` y `volume` sean readonly (calculados automáticamente).

---

## 1. Cambios en los Tipos TypeScript

### 1.1. `src/components/types/microcycleTypes.ts`

**Actualizar la interfaz `Microcycle`:**

```typescript
export interface Microcycle {
  id: string;
  name: string; // ✅ NUEVO - Nombre del microciclo
  description?: string; // ✅ NUEVO - Descripción del microciclo (opcional)
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: number; // Calculado automáticamente desde TrainingSessions
  volume: number; // Calculado automáticamente desde TrainingSessions
  intensity: 'baja' | 'media' | 'alta';
  focus: string;
  trainingSessions?: TrainingSession[];
  completedSessions?: number;
  actualVolume?: number;
}
```

---

## 2. Cambios en el Servicio

### 2.1. `src/services/microcycleService.ts`

**Actualizar `MicrocycleResponseDto`:**

```typescript
export interface MicrocycleResponseDto {
  id: number;
  name: string; // ✅ NUEVO - Nombre del microciclo
  description?: string; // ✅ NUEVO - Descripción del microciclo (opcional)
  weekNumber: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  sessions: number; // Calculado automáticamente desde TrainingSessions
  volume: number; // Calculado automáticamente desde TrainingSessions
  intensity: 'baja' | 'media' | 'alta';
  focus?: string;
  mesocycleId: number; // ID del mesociclo
  trainingSessionsCount: number; // Cantidad real de sesiones asignadas
  createdAt: string;
  updatedAt: string;
}
```

**Agregar `UpdateMicrocycleDto`:**

```typescript
export interface UpdateMicrocycleDto {
  name: string; // ✅ NUEVO - Nombre del microciclo (requerido)
  description?: string; // ✅ NUEVO - Descripción del microciclo (opcional)
  // Sessions y Volume NO deben estar aquí - se calculan automáticamente desde las sesiones
  intensity: 'baja' | 'media' | 'alta';
  focus?: string;
}
```

**Agregar métodos al servicio:**

```typescript
/**
 * Obtiene un microciclo por su ID
 * @param microcycleId ID del microciclo
 */
static async getMicrocycleById(microcycleId: number): Promise<MicrocycleResponseDto> {
  try {
    // GET: api/Microcycle/{id}
    const { data } = await apiClient.get<MicrocycleResponseDto>(`/api/Microcycle/${microcycleId}`);
    return data;
  } catch (error) {
    console.error(`Error al obtener microciclo ${microcycleId}:`, error);
    throw error;
  }
}

/**
 * Actualiza un microciclo
 * @param microcycleId ID del microciclo
 * @param dto Datos para actualizar el microciclo
 */
static async updateMicrocycle(microcycleId: number, dto: UpdateMicrocycleDto): Promise<MicrocycleResponseDto> {
  try {
    // PUT: api/Microcycle/{id}
    const { data } = await apiClient.put<MicrocycleResponseDto>(`/api/Microcycle/${microcycleId}`, dto);
    
    toast.success('Microciclo actualizado exitosamente', {
      description: 'Los cambios se han guardado correctamente.'
    });
    
    return data;
  } catch (error) {
    console.error(`Error al actualizar microciclo ${microcycleId}:`, error);
    toast.error('Error al actualizar el microciclo', {
      description: 'No se pudieron guardar los cambios.'
    });
    throw error;
  }
}
```

**Actualizar `deleteMicrocycle` (marcar como deprecated):**

```typescript
/**
 * Elimina un microciclo
 * NOTA: Los microciclos NO se pueden eliminar desde el menú
 * Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo
 * @param microcycleId ID del microciclo a eliminar
 * @deprecated Los microciclos no se pueden eliminar manualmente
 */
static async deleteMicrocycle(microcycleId: number): Promise<void> {
  try {
    // DELETE: api/Microcycle/{id}
    // NOTA: Este endpoint está deshabilitado en el backend
    await apiClient.delete(`/api/Microcycle/${microcycleId}`);
    
    toast.success('Microciclo eliminado exitosamente');
  } catch (error) {
    console.error(`Error al eliminar microciclo ${microcycleId}:`, error);
    toast.error('Error al eliminar el microciclo', {
      description: 'Los microciclos solo se pueden eliminar ajustando la cantidad de semanas en el mesociclo.'
    });
    throw error;
  }
}
```

---

## 3. Cambios en los Componentes

### 3.1. `src/components/EditMicrocycleModal.tsx`

**Actualizar la interfaz `Microcycle`:**

```typescript
interface Microcycle {
  id: string;
  name: string; // ✅ NUEVO - Nombre del microciclo
  description?: string; // ✅ NUEVO - Descripción del microciclo (opcional)
  weekNumber: number;
  startDate: string;
  endDate: string;
  focus: string;
  intensity: 'baja' | 'media' | 'alta';
  volume: number; // Calculado automáticamente - readonly
  sessions: number; // Calculado automáticamente - readonly
  notes?: string;
}
```

**Actualizar `handleSave`:**

```typescript
const handleSave = async () => {
  setIsLoading(true);
  
  try {
    // Validaciones básicas
    if (!formData.name.trim()) {
      toast.error('El nombre del microciclo es obligatorio');
      return;
    }

    if (!formData.focus.trim()) {
      toast.error('El enfoque del microciclo es obligatorio');
      return;
    }

    // Guardar cambios (sessions y volume se calculan automáticamente en el backend)
    onSave(formData);
  } catch (error) {
    toast.error('Error al guardar los cambios del microciclo');
  } finally {
    setIsLoading(false);
  }
};
```

**Agregar campos de nombre y descripción al formulario:**

```tsx
{/* Información básica */}
<div className="space-y-4">
  {/* ✅ NUEVO - Nombre del microciclo */}
  <div className="space-y-2">
    <Label htmlFor="name">Nombre del Microciclo *</Label>
    <Input
      id="name"
      type="text"
      value={formData.name}
      onChange={(e) => handleInputChange('name', e.target.value)}
      placeholder="Ej: Semana 1, Semana de Base, etc."
      className="w-full"
      maxLength={200}
    />
    <p className="text-xs text-muted-foreground">
      Este nombre se mostrará de forma destacada en las tarjetas del microciclo
    </p>
  </div>

  {/* ✅ NUEVO - Descripción del microciclo */}
  <div className="space-y-2">
    <Label htmlFor="description">Descripción</Label>
    <Textarea
      id="description"
      placeholder="Descripción breve del microciclo (opcional)"
      value={formData.description || ''}
      onChange={(e) => handleInputChange('description', e.target.value)}
      className="min-h-20"
      maxLength={1000}
    />
    <p className="text-xs text-muted-foreground">
      Esta descripción se mostrará en gris más tenue debajo del nombre
    </p>
  </div>
</div>
```

**Hacer `sessions` y `volume` readonly:**

```tsx
{/* Métricas (Readonly - Calculadas automáticamente) */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="volume">Volumen (km)</Label>
    <Input
      id="volume"
      type="number"
      min="0"
      step="0.1"
      value={formData.volume.toFixed(2)}
      className="w-full bg-muted cursor-not-allowed"
      readOnly
      disabled
    />
    <p className="text-xs text-muted-foreground">
      Calculado automáticamente desde las sesiones asignadas
    </p>
  </div>

  <div className="space-y-2">
    <Label htmlFor="sessions">Número de Sesiones</Label>
    <Input
      id="sessions"
      type="number"
      min="1"
      max="14"
      value={formData.sessions}
      className="w-full bg-muted cursor-not-allowed"
      readOnly
      disabled
    />
    <p className="text-xs text-muted-foreground">
      Calculado automáticamente desde las sesiones asignadas
    </p>
  </div>
</div>
```

---

### 3.2. `src/components/MicrocycleCard.tsx`

**Actualizar la visualización del nombre y descripción:**

```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <div className="flex-1 min-w-0">
      {/* ✅ NUEVO - Nombre del microciclo (más grande y con más peso) */}
      <CardTitle className="text-lg font-semibold truncate">
        {microcycle.name || `Semana ${microcycle.weekNumber}`}
      </CardTitle>
      {/* ✅ NUEVO - Descripción (gris más tenue) */}
      {microcycle.description && (
        <CardDescription className="text-sm text-muted-foreground/70 mt-1">
          {microcycle.description}
        </CardDescription>
      )}
      {/* Fecha del microciclo */}
      <CardDescription className="text-xs mt-1">
        {formatDateRange(microcycle.startDate, microcycle.endDate)}
      </CardDescription>
    </div>
    <Badge className={getIntensityColor(microcycle.intensity)} variant="outline">
      {microcycle.intensity}
    </Badge>
  </div>
</CardHeader>
```

**Remover el botón de eliminar (los microciclos no se pueden eliminar desde el menú):**

```tsx
{/* ❌ REMOVIDO - Los microciclos NO se pueden eliminar desde el menú */}
{/* Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo */}
```

**Actualizar la interfaz `MicrocycleCardProps`:**

```typescript
interface MicrocycleCardProps {
  microcycle: Microcycle;
  mockTrainingSessions: TrainingSession[];
  onViewCalendar: (microcycle: Microcycle) => void;
  onCreateSession?: (microcycleId: string, date: string) => void;
  onEditMicrocycle?: (microcycle: Microcycle) => void;
  onDeleteMicrocycle?: (microcycleId: string) => void; // Opcional - Los microciclos NO se pueden eliminar desde el menú
}
```

---

### 3.3. `src/components/MacrocycleView.tsx`

**Actualizar `convertMicrocycleToFrontend`:**

```typescript
// Convertir microciclo del backend al formato del frontend
const convertMicrocycleToFrontend = (microcycle: MicrocycleResponseDto): Microcycle => {
  return {
    id: microcycle.id.toString(),
    name: microcycle.name, // ✅ NUEVO
    description: microcycle.description, // ✅ NUEVO
    weekNumber: microcycle.weekNumber,
    startDate: microcycle.startDate,
    endDate: microcycle.endDate,
    sessions: microcycle.sessions, // Calculado automáticamente desde TrainingSessions
    volume: microcycle.volume, // Calculado automáticamente desde TrainingSessions
    intensity: microcycle.intensity || 'media', // Valor del backend o por defecto
    focus: microcycle.focus || `Semana ${microcycle.weekNumber}`
  };
};
```

**Actualizar `handleSaveMicrocycle` para usar el servicio del backend:**

```typescript
const handleSaveMicrocycle = async (updatedMicrocycle: Microcycle) => {
  if (!editingMicrocycle) return;
  
  try {
    // Convertir datos del frontend al formato del backend
    const updateDto = {
      name: updatedMicrocycle.name.trim(),
      description: updatedMicrocycle.description?.trim() || undefined,
      intensity: updatedMicrocycle.intensity,
      focus: updatedMicrocycle.focus || undefined
    };

    // Actualizar en el backend
    await MicrocycleService.updateMicrocycle(Number(updatedMicrocycle.id), updateDto);

    // Recargar microciclos del mesociclo para obtener los datos actualizados
    const mesocycleId = editingMicrocycle.mesocycle.id;
    setLoadedMicrocycles(prev => {
      const newMap = new Map(prev);
      newMap.delete(mesocycleId);
      return newMap;
    });
    
    // Recargar microciclos si el mesociclo está expandido
    if (expandedMesocycles.has(mesocycleId)) {
      await loadMicrocyclesForMesocycle(mesocycleId);
    }

    setEditingMicrocycle(null);
  } catch (error) {
    // El error ya fue manejado por el servicio
    console.error('Error al actualizar microciclo:', error);
  }
};
```

**Actualizar la visualización de microciclos en la lista:**

```tsx
<div className="min-w-0 flex-1">
  {/* ✅ NUEVO - Nombre del microciclo (más grande y con más peso) */}
  <div className="flex items-center gap-2">
    <span className="font-semibold text-base">
      {microcycle.name || `Semana ${microcycle.weekNumber}`}
    </span>
    <Badge 
      variant="outline" 
      className={`text-xs ${
        microcycle.intensity === 'alta' ? 'border-red-200 text-red-700 bg-red-50' :
        microcycle.intensity === 'media' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
        'border-green-200 text-green-700 bg-green-50'
      }`}
    >
      {microcycle.intensity}
    </Badge>
  </div>
  {/* ✅ NUEVO - Descripción (gris más tenue) */}
  {microcycle.description && (
    <p className="text-sm text-muted-foreground/70 mt-1">
      {microcycle.description}
    </p>
  )}
  <p className="text-sm text-muted-foreground mt-1">
    {formatLocalDate(microcycle.startDate, { 
      day: '2-digit', 
      month: 'short' 
    })} - {formatLocalDate(microcycle.endDate, { 
      day: '2-digit', 
      month: 'short' 
    })}
  </p>
</div>
```

---

## 4. Resumen de Cambios

### Campos Agregados:
- ✅ `name` (string, requerido) - Nombre del microciclo
- ✅ `description` (string?, opcional) - Descripción del microciclo

### Campos Readonly (calculados automáticamente):
- ✅ `sessions` - Se calcula contando las sesiones asignadas
- ✅ `volume` - Se calcula sumando el volumen de todas las sesiones

### Funcionalidades Actualizadas:
- ✅ **EditMicrocycleModal**: Agregados campos para `name` y `description`, `sessions` y `volume` ahora son readonly
- ✅ **MicrocycleCard**: Muestra `name` de forma destacada y `description` en gris más tenue
- ✅ **MacrocycleView**: Mapea correctamente los datos del backend y actualiza microciclos usando el servicio
- ✅ **MicrocycleService**: Agregados métodos `getMicrocycleById` y `updateMicrocycle`

### Funcionalidades Removidas:
- ❌ **Botón de eliminar microciclo**: Los microciclos NO se pueden eliminar desde el menú
- ❌ **Edición manual de `sessions` y `volume`**: Estos campos se calculan automáticamente

---

## 5. Orden de Aplicación

1. **Primero**: Actualizar tipos TypeScript (`microcycleTypes.ts`)
2. **Segundo**: Actualizar servicio (`microcycleService.ts`)
3. **Tercero**: Actualizar `EditMicrocycleModal.tsx`
4. **Cuarto**: Actualizar `MicrocycleCard.tsx`
5. **Quinto**: Actualizar `MacrocycleView.tsx`

---

## 6. Notas Importantes

- Los microciclos se crean automáticamente con `name = "Semana {weekNumber}"` por defecto
- `sessions` y `volume` se recalculan automáticamente cada vez que se obtiene un microciclo
- Los microciclos solo se pueden eliminar ajustando `WeeksCount` en el mesociclo, no desde el menú
- El nombre se muestra de forma destacada (más grande y con más peso) en las tarjetas
- La descripción se muestra en gris más tenue debajo del nombre

