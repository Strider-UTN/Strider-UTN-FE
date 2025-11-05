# Solución: Error de DateTime con PostgreSQL

## Problema
PostgreSQL no acepta `DateTime` con `Kind=Unspecified` en campos `timestamp with time zone`. Solo acepta UTC.

**Error:**
```
Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported.
```

**Importante:** El frontend envía fechas como "YYYY-MM-DD" (sin hora). Necesitamos asegurarnos de que se guarden como **la fecha seleccionada a medianoche UTC** para que no cambie la fecha al mostrarse.

## Solución

### Método Helper (Recomendado)

Este método asegura que la fecha se mantenga igual (solo la fecha, sin hora) pero se guarde como UTC medianoche:

```csharp
/// <summary>
/// Convierte una fecha a UTC medianoche, manteniendo la misma fecha (solo la fecha, sin hora)
/// Esto asegura que la fecha seleccionada por el usuario se mantenga igual al mostrarse
/// </summary>
private static DateTime ToUtcDate(DateTime dateTime)
{
    // Si ya es UTC, solo asegurarnos de que sea medianoche
    if (dateTime.Kind == DateTimeKind.Utc)
    {
        return new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 0, 0, 0, DateTimeKind.Utc);
    }
    
    // Si es Local, tomar solo la fecha (sin hora) y convertir a UTC medianoche
    if (dateTime.Kind == DateTimeKind.Local)
    {
        var dateOnly = dateTime.Date; // Extrae solo la fecha, sin hora
        return new DateTime(dateOnly.Year, dateOnly.Month, dateOnly.Day, 0, 0, 0, DateTimeKind.Utc);
    }
    
    // Si es Unspecified (viene del frontend como string), tomar solo la fecha y especificar como UTC medianoche
    // Esto mantiene la fecha exacta que el usuario seleccionó
    var date = dateTime.Date; // Extrae solo la fecha (Y/M/D), ignora hora
    return new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
}

private static DateTime? ToUtcDate(DateTime? dateTime)
{
    if (!dateTime.HasValue)
        return null;
    
    return ToUtcDate(dateTime.Value);
}
```

### Uso en PlanningService.CreateAsync

```csharp
public async Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
{
    var planning = new Planning
    {
        Name = dto.Name,
        Description = dto.Description,
        StartDate = ToUtcDate(dto.StartDate), // ✅ Mantiene la fecha seleccionada, pero como UTC medianoche
        EndDate = ToUtcDate(dto.EndDate),     // ✅ Mantiene la fecha seleccionada, pero como UTC medianoche
        Status = dto.Status,
        CoachId = coachId
    };

    var createdPlanning = await _planningRepository.CreateAsync(planning, cancellationToken);
    // ... resto del código sin cambios
}
```

### Uso en PlanningService.UpdateAsync

```csharp
public async Task<PlanningResponseDto> UpdateAsync(int id, UpdatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
{
    var planning = await _planningRepository.GetByIdAsync(id, cancellationToken);
    if (planning == null)
        throw new NotFoundException("Planificación no encontrada");

    if (planning.CoachId != coachId)
        throw new UnauthorizedException("No tienes permisos para actualizar esta planificación");

    planning.Name = dto.Name;
    planning.Description = dto.Description;
    planning.StartDate = ToUtcDate(dto.StartDate); // ✅ Mantiene la fecha seleccionada
    planning.EndDate = ToUtcDate(dto.EndDate);     // ✅ Mantiene la fecha seleccionada
    planning.Status = dto.Status;

    var updatedPlanning = await _planningRepository.UpdateAsync(planning, cancellationToken);
    return MapToPlanningResponseDto(updatedPlanning);
}
```

### Aplicar en otros servicios

Aplica la misma solución en:
- `MesocycleService.CreateWithAutoMicrocyclesAsync` - para `StartDate` y `EndDate` del mesociclo y microciclos
- `TrainingSessionService.CreateWithAutoMicrocycleDetectionAsync` - para la fecha de la sesión
- Cualquier otro lugar donde se creen entidades con fechas

### Ejemplo completo para MesocycleService

```csharp
// En CreateWithAutoMicrocyclesAsync
var endDate = ToUtcDate(dto.StartDate.AddDays((dto.WeeksCount * 7) - 1));

var mesocycle = new Mesocycle
{
    Name = dto.Name,
    StartDate = ToUtcDate(dto.StartDate),
    EndDate = endDate,
    // ... resto
};

// Al crear microciclos
var currentDate = ToUtcDate(dto.StartDate);

for (int week = 1; week <= dto.WeeksCount; week++)
{
    var weekStartDate = ToUtcDate(currentDate);
    var weekEndDate = ToUtcDate(currentDate.AddDays(6));
    
    var microcycle = new Microcycle
    {
        StartDate = weekStartDate,
        EndDate = weekEndDate,
        // ... resto
    };
    
    currentDate = currentDate.AddDays(7);
}
```

### Ejemplo para TrainingSessionService

```csharp
// En CreateWithAutoMicrocycleDetectionAsync
var sessionDate = ToUtcDate(DateTime.Parse(dto.Date));

var trainingSession = new TrainingSession
{
    Name = dto.Name,
    Date = sessionDate,
    // ... resto
};
```

## ¿Por qué esta solución mantiene la fecha correcta?

1. **El frontend envía:** "2024-01-15" (string sin hora)
2. **ASP.NET Core lo parsea como:** `DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Unspecified)`
3. **Nuestro método `ToUtcDate` extrae solo la fecha:** `DateTime.Date` = `2024-01-15 00:00:00`
4. **Lo convierte a UTC medianoche:** `DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc)`
5. **Resultado:** La fecha se mantiene igual (2024-01-15) pero ahora es UTC válido para PostgreSQL
6. **Al mostrarse en el frontend:** Se muestra "2024-01-15" porque la hora es 00:00:00 UTC

**Importante:** Esta solución NO cambia la fecha, solo asegura que se guarde como UTC medianoche, manteniendo exactamente la fecha que el usuario seleccionó.

