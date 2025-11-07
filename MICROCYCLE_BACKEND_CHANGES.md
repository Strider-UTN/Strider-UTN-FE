# Cambios en el Backend para Microciclos

## 1. Cambios en la Entidad Microcycle

Agregar los campos `Name` y `Description` a la entidad `Microcycle`:

```csharp
public class Microcycle
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // ✅ NUEVO
    public string? Description { get; set; } // ✅ NUEVO (opcional)
    public int WeekNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Sessions { get; set; } // Calculado automáticamente desde TrainingSessions
    public decimal Volume { get; set; } // Calculado automáticamente desde TrainingSessions
    public MicrocycleIntensity Intensity { get; set; }
    public MicrocycleFocus? Focus { get; set; }
    public int MesocycleId { get; set; }
    public int PeriodId { get; set; }
    
    // Navigation properties
    public Mesocycle Mesocycle { get; set; } = null!;
    public Period Period { get; set; } = null!;
    public ICollection<TrainingSession> TrainingSessions { get; set; } = new List<TrainingSession>();
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

## 2. Cambios en los DTOs

### 2.1. UpdateMicrocycleDto

```csharp
public class UpdateMicrocycleDto
{
    public string Name { get; set; } = string.Empty; // ✅ NUEVO
    public string? Description { get; set; } // ✅ NUEVO (opcional)
    // Sessions y Volume NO deben estar aquí - se calculan automáticamente
    public MicrocycleIntensity Intensity { get; set; }
    public MicrocycleFocus? Focus { get; set; }
}
```

### 2.2. MicrocycleResponseDto

```csharp
public class MicrocycleResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // ✅ NUEVO
    public string? Description { get; set; } // ✅ NUEVO (opcional)
    public int WeekNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Sessions { get; set; } // Calculado automáticamente
    public decimal Volume { get; set; } // Calculado automáticamente
    public MicrocycleIntensity Intensity { get; set; }
    public MicrocycleFocus? Focus { get; set; }
    public int MesocycleId { get; set; }
    public int PeriodId { get; set; }
    public int TrainingSessionsCount { get; set; } // Cantidad real de sesiones asignadas
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

## 3. Cambios en el Servicio (MicrocycleService)

### 3.1. UpdateAsync - Actualizar para incluir Name y Description

```csharp
public async Task<MicrocycleResponseDto> UpdateAsync(int id, UpdateMicrocycleDto dto, int coachId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(id, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    if (!await ValidateMicrocycleAccessAsync(id, coachId, cancellationToken))
        throw new UnauthorizedException("No tienes permisos para actualizar este microciclo");

    // Actualizar campos editables
    microcycle.Name = dto.Name;
    microcycle.Description = dto.Description;
    microcycle.Intensity = dto.Intensity;
    microcycle.Focus = dto.Focus;
    
    // NO actualizar Sessions y Volume - se calculan automáticamente
    // Recalcular volumen y sesiones antes de guardar
    await RecalculateVolumeAndSessionsAsync(microcycle.Id, cancellationToken);

    var updatedMicrocycle = await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);
    return MapToMicrocycleResponseDto(updatedMicrocycle);
}
```

### 3.2. Nuevo método: RecalculateVolumeAndSessionsAsync

```csharp
/// <summary>
/// Recalcula el volumen y la cantidad de sesiones de un microciclo basándose en las sesiones asignadas
/// </summary>
private async Task RecalculateVolumeAndSessionsAsync(int microcycleId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    // Obtener todas las sesiones del microciclo con sus intervalos
    var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycleId, cancellationToken);

    // Calcular cantidad de sesiones
    microcycle.Sessions = sessions.Count();

    // Calcular volumen total
    decimal totalVolumeKm = 0;
    foreach (var session in sessions)
    {
        if (session.Intervals != null && session.Intervals.Any())
        {
            decimal sessionVolumeMeters = 0;
            foreach (var interval in session.Intervals)
            {
                // Distancia total = distancia del intervalo * repeticiones
                sessionVolumeMeters += interval.Distance * interval.Repetitions;
            }
            // Convertir de metros a kilómetros
            totalVolumeKm += sessionVolumeMeters / 1000m;
        }
    }

    microcycle.Volume = totalVolumeKm;
}
```

### 3.3. Actualizar MapToMicrocycleResponseDto

```csharp
private MicrocycleResponseDto MapToMicrocycleResponseDto(Microcycle microcycle)
{
    // Recalcular volumen y sesiones antes de mapear
    // (Esto debería hacerse automáticamente, pero por seguridad lo hacemos aquí también)
    
    return new MicrocycleResponseDto
    {
        Id = microcycle.Id,
        Name = microcycle.Name, // ✅ NUEVO
        Description = microcycle.Description, // ✅ NUEVO
        WeekNumber = microcycle.WeekNumber,
        StartDate = microcycle.StartDate,
        EndDate = microcycle.EndDate,
        Sessions = microcycle.Sessions, // Calculado automáticamente
        Volume = microcycle.Volume, // Calculado automáticamente
        Intensity = microcycle.Intensity,
        Focus = microcycle.Focus,
        MesocycleId = microcycle.MesocycleId,
        PeriodId = microcycle.PeriodId,
        TrainingSessionsCount = microcycle.TrainingSessions?.Count ?? 0,
        CreatedAt = microcycle.CreatedAt,
        UpdatedAt = microcycle.UpdatedAt
    };
}
```

### 3.4. Actualizar GetByIdAsync para recalcular antes de devolver

```csharp
public async Task<MicrocycleResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(id, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    // Recalcular volumen y sesiones antes de devolver
    await RecalculateVolumeAndSessionsAsync(id, cancellationToken);
    
    // Obtener el microciclo actualizado
    microcycle = await _microcycleRepository.GetByIdAsync(id, cancellationToken);
    
    return MapToMicrocycleResponseDto(microcycle);
}
```

### 3.5. Actualizar GetByMesocycleIdAsync para recalcular antes de devolver

```csharp
public async Task<IEnumerable<MicrocycleResponseDto>> GetByMesocycleIdAsync(int mesocycleId, CancellationToken cancellationToken = default)
{
    var microcycles = await _microcycleRepository.GetByMesocycleIdAsync(mesocycleId, cancellationToken);
    
    // Recalcular volumen y sesiones para cada microciclo
    foreach (var microcycle in microcycles)
    {
        await RecalculateVolumeAndSessionsAsync(microcycle.Id, cancellationToken);
    }
    
    // Obtener los microciclos actualizados
    microcycles = await _microcycleRepository.GetByMesocycleIdAsync(mesocycleId, cancellationToken);
    
    return microcycles.Select(MapToMicrocycleResponseDto);
}
```

## 4. Cambios en el Controller (MicrocycleController)

### 4.1. Remover o deshabilitar el endpoint DELETE

```csharp
// ❌ REMOVER o comentar este endpoint
// Los microciclos NO se pueden eliminar desde el menú
// Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo

// DELETE: api/Microcycles/{id}
// [HttpDelete("{id}")]
// public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
// {
//     var coachId = _jwtService.GetCurrentUserId();
//     if (!coachId.HasValue) return Unauthorized();
//     var result = await _microcycleService.DeleteAsync(id, coachId.Value, cancellationToken);
//     if (!result) return NotFound();
//     return NoContent();
// }
```

## 5. Cambios en MesocycleService - Creación de Microciclos

Cuando se crean microciclos automáticamente al crear un mesociclo, se debe asignar un nombre por defecto:

```csharp
// En MesocycleService.CreateWithAutoMicrocyclesAsync
for (int i = 0; i < dto.WeeksCount; i++)
{
    var microcycle = new Microcycle
    {
        Name = $"Semana {i + 1}", // ✅ NUEVO - Nombre por defecto
        Description = null, // ✅ NUEVO - Sin descripción por defecto
        WeekNumber = i + 1,
        StartDate = startDate.AddDays(i * 7),
        EndDate = startDate.AddDays((i + 1) * 7 - 1),
        Sessions = 0, // Se calculará automáticamente
        Volume = 0, // Se calculará automáticamente
        Intensity = MicrocycleIntensity.Medium, // Valor por defecto
        Focus = null,
        MesocycleId = mesocycle.Id,
        PeriodId = periodId
    };
    
    microcycles.Add(microcycle);
}
```

## 6. Migración de Base de Datos

Necesitarás crear una migración para agregar las columnas `Name` y `Description` a la tabla `Microcycles`:

```sql
ALTER TABLE "Microcycles" 
ADD COLUMN "Name" TEXT NOT NULL DEFAULT 'Semana {WeekNumber}',
ADD COLUMN "Description" TEXT NULL;
```

O usando Entity Framework:

```bash
dotnet ef migrations add AddNameAndDescriptionToMicrocycle
dotnet ef database update
```

## 7. Resumen de Cambios

### Campos Agregados:
- ✅ `Name` (string, requerido) - Nombre del microciclo
- ✅ `Description` (string?, opcional) - Descripción del microciclo

### Campos Readonly (calculados automáticamente):
- ✅ `Sessions` - Se calcula contando las sesiones asignadas
- ✅ `Volume` - Se calcula sumando el volumen de todas las sesiones

### Endpoints Afectados:
- ✅ `PUT /api/Microcycles/{id}` - Ahora acepta `Name` y `Description`, pero NO `Sessions` ni `Volume`
- ❌ `DELETE /api/Microcycles/{id}` - Removido o deshabilitado

### Validaciones:
- `Name` es requerido y no puede estar vacío
- `Description` es opcional
- `Sessions` y `Volume` se calculan automáticamente y no se pueden editar manualmente

