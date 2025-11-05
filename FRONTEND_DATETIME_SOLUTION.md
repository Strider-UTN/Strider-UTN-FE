# Solución: Enviar fechas con hora UTC desde el frontend

## Problema
PostgreSQL requiere fechas en UTC, pero cuando el frontend envía solo la fecha (ej: `"2025-11-28"`), ASP.NET Core puede parsearla como `DateTime` con `Kind=Unspecified`, lo cual causa error.

**Error:**
```
Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported.
```

## Solución: Enviar fechas con hora UTC desde el frontend

### ✅ Ventajas de esta solución:
1. **Más explícito**: El backend sabe exactamente qué hacer
2. **No depende del parsing del backend**: ASP.NET Core parsea correctamente ISO strings con UTC
3. **Mantiene la fecha seleccionada**: Al enviar `"2025-11-28T00:00:00Z"`, la fecha se mantiene igual
4. **Maneja null correctamente**: Si `endDate` es `null`, se envía como `null` en el JSON

### Implementación en el frontend

**Antes (causaba error):**
```typescript
const createDto: CreatePlanningDto = {
  startDate: formData.startDate, // "2025-11-28" (sin hora)
  endDate: formData.hasEndDate && formData.endDate ? formData.endDate : null, // "2025-11-30" o null
};
```

**Después (correcto):**
```typescript
// Convertir fechas a formato ISO con hora UTC (medianoche)
const startDateUtc = formData.startDate 
  ? new Date(`${formData.startDate}T00:00:00Z`).toISOString()
  : new Date().toISOString(); // Fallback (no debería pasar)

const endDateUtc = formData.hasEndDate && formData.endDate
  ? new Date(`${formData.endDate}T00:00:00Z`).toISOString()
  : null;

const createDto: CreatePlanningDto = {
  startDate: startDateUtc, // "2025-11-28T00:00:00.000Z" (con hora UTC)
  endDate: endDateUtc, // "2025-11-30T00:00:00.000Z" o null
};
```

### Ejemplo de payload

**Payload que fallaba:**
```json
{
  "startDate": "2025-11-28",
  "endDate": null
}
```

**Payload correcto:**
```json
{
  "startDate": "2025-11-28T00:00:00.000Z",
  "endDate": null
}
```

### ¿Cómo funciona con null?

- Si `endDate` es `null` en el frontend, se envía como `null` en el JSON
- ASP.NET Core deserializa `null` correctamente a `DateTime?` con valor `null`
- PostgreSQL acepta `null` sin problemas
- **No se necesita conversión especial para null**: `null` se mantiene como `null`

### En el backend

Con esta solución, el backend **NO necesita conversión adicional**:

```csharp
public async Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
{
    var planning = new Planning
    {
        Name = dto.Name,
        Description = dto.Description,
        StartDate = dto.StartDate, // ✅ Ya viene como UTC desde el frontend
        EndDate = dto.EndDate,     // ✅ Ya viene como UTC o null desde el frontend
        Status = dto.Status,
        CoachId = coachId
    };
    // ... resto del código sin cambios
}
```

ASP.NET Core automáticamente parsea:
- `"2025-11-28T00:00:00.000Z"` → `DateTime(2025, 11, 28, 0, 0, 0, DateTimeKind.Utc)` ✅
- `null` → `null` ✅

### Ventajas vs solución en el backend

| Aspecto | Frontend (UTC) | Backend (conversión) |
|---------|----------------|----------------------|
| **Claridad** | ✅ Más explícito | ⚠️ Depende del parsing |
| **Mantiene fecha** | ✅ Sí (medianoche UTC) | ✅ Sí (con método helper) |
| **Maneja null** | ✅ Sí (automático) | ✅ Sí (con método helper) |
| **Código backend** | ✅ Sin cambios | ⚠️ Necesita método helper |
| **Mantenibilidad** | ✅ Mejor | ⚠️ Más complejo |

### Recomendación

**✅ Usar esta solución (frontend con UTC)** porque:
1. Es más simple en el backend
2. Es más explícito y claro
3. Funciona automáticamente con null
4. No requiere cambios en el backend

