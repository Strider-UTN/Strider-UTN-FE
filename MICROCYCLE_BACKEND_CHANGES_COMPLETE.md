# Cambios Completos del Backend para Microciclos

## 1. Cambios en la Entidad Microcycle

Agregar los campos `Name` y `Description` a la entidad `Microcycle`:

```csharp
[Table("Microcycles")]
public class Microcycle
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // ✅ NUEVO
    public string? Description { get; set; } // ✅ NUEVO (opcional)
    public int WeekNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Sessions { get; set; } // Calculado automáticamente desde TrainingSessions
    public decimal Volume { get; set; } // en kilómetros - Calculado automáticamente desde TrainingSessions
    public MicrocycleIntensity Intensity { get; set; } = MicrocycleIntensity.Medium;
    public MicrocycleFocus? Focus { get; set; }
    
    // Relación con Mesocycle (REQUERIDA - un microciclo pertenece a un solo mesociclo)
    public int MesocycleId { get; set; }
    public Mesocycle Mesocycle { get; set; } = null!;
    
    // Relaciones con sesiones de entrenamiento
    public ICollection<TrainingSession> TrainingSessions { get; set; } = new List<TrainingSession>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

## 2. Cambios en los DTOs

### 2.1. UpdateMicrocycleDto

```csharp
public class UpdateMicrocycleDto
{
    public string Name { get; set; } = string.Empty; // ✅ NUEVO
    public string? Description { get; set; } // ✅ NUEVO (opcional)
    // Sessions y Volume NO deben estar aquí - se calculan automáticamente desde las sesiones
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
    public int Sessions { get; set; } // Calculado automáticamente desde TrainingSessions
    public decimal Volume { get; set; } // Calculado automáticamente desde TrainingSessions
    public MicrocycleIntensity Intensity { get; set; }
    public MicrocycleFocus? Focus { get; set; }
    public int MesocycleId { get; set; }
    public int TrainingSessionsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

---

## 3. Cambios en MesocycleService

### 3.1. Agregar dependencia ITrainingSessionRepository al constructor

```csharp
public class MesocycleService : IMesocycleService
{
    private readonly IMesocycleRepository _mesocycleRepository;
    private readonly IMicrocycleRepository _microcycleRepository;
    private readonly ITrainingSessionRepository _trainingSessionRepository; // ✅ NUEVO
    private readonly IPlanningRepository _planningRepository;
    private readonly IPeriodRepository _periodRepository;
    private readonly IMapper _mapper;

    public MesocycleService(
        IMesocycleRepository mesocycleRepository,
        IMicrocycleRepository microcycleRepository,
        ITrainingSessionRepository trainingSessionRepository, // ✅ NUEVO
        IPlanningRepository planningRepository,
        IPeriodRepository periodRepository,
        IMapper mapper)
    {
        _mesocycleRepository = mesocycleRepository;
        _microcycleRepository = microcycleRepository;
        _trainingSessionRepository = trainingSessionRepository; // ✅ NUEVO
        _planningRepository = planningRepository;
        _periodRepository = periodRepository;
        _mapper = mapper;
    }
```

### 3.2. Actualizar CreateWithAutoMicrocyclesAsync

```csharp
// En el método CreateWithAutoMicrocyclesAsync, actualizar la creación de microciclos:
for (int week = 1; week <= dto.WeeksCount; week++)
{
    var weekStartDate = currentDate;
    var weekEndDate = currentDate.AddDays(6);

    var microcycle = new Microcycle
    {
        Name = $"Semana {week}", // ✅ NUEVO - Nombre por defecto
        Description = null, // ✅ NUEVO - Sin descripción por defecto
        WeekNumber = week,
        StartDate = weekStartDate,
        EndDate = weekEndDate,
        Sessions = 0, // Se calculará automáticamente
        Volume = 0, // Se calculará automáticamente
        Intensity = MicrocycleIntensity.Medium,
        Focus = null,
        MesocycleId = createdMesocycle.Id,
    };

    var createdMicrocycle = await microcycleRepository.CreateAsync(microcycle, cancellationToken);
    microcycles.Add(createdMicrocycle);

    currentDate = currentDate.AddDays(7);
}
```

### 3.3. Actualizar UpdateAsync completo

```csharp
public async Task<MesocycleResponseDto> UpdateAsync(
    int id,
    UpdateMesocycleDto dto,
    int coachId,
    CancellationToken cancellationToken = default)
{
    var mesocycle = await _mesocycleRepository.GetByIdAsync(id, cancellationToken);
    if (mesocycle == null)
        throw new NotFoundException("Mesociclo no encontrado");

    if (!await ValidateMesocycleAccessAsync(id, coachId, cancellationToken))
        throw new UnauthorizedException("No tienes permisos para actualizar este mesociclo");

    // Obtener microciclos actuales del mesociclo
    var existingMicrocycles = await _microcycleRepository.GetByMesocycleIdAsync(id, cancellationToken);

    // Validar que no se puedan eliminar microciclos con sesiones
    if (dto.WeeksCount < mesocycle.WeeksCount)
    {
        var weeksToRemove = mesocycle.WeeksCount - dto.WeeksCount;
        // Obtener los microciclos que se eliminarían (los últimos)
        var microcyclesToRemove = existingMicrocycles
            .OrderByDescending(m => m.WeekNumber)
            .Take(weeksToRemove)
            .ToList();

        // Verificar si alguno de estos microciclos tiene sesiones
        var microcyclesWithSessions = new List<int>();
        foreach (var microcycle in microcyclesToRemove)
        {
            var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycle.Id, cancellationToken);
            if (sessions.Any())
            {
                microcyclesWithSessions.Add(microcycle.WeekNumber);
            }
        }

        if (microcyclesWithSessions.Any())
        {
            var minWeeksRequired = mesocycle.WeeksCount - microcyclesWithSessions.Count;
            throw new ValidationException(
                $"No se pueden eliminar las semanas {string.Join(", ", microcyclesWithSessions)} " +
                $"porque contienen sesiones de entrenamiento. " +
                $"Debe mantener al menos {minWeeksRequired} semanas."
            );
        }
    }

    // Actualizar propiedades del mesociclo
    mesocycle.Name = dto.Name;
    mesocycle.StartDate = dto.StartDate;
    mesocycle.EndDate = dto.EndDate;
    mesocycle.WeeksCount = dto.WeeksCount;
    mesocycle.Objective = dto.Objective;
    mesocycle.Status = dto.Status;
    mesocycle.PeriodId = dto.PeriodId;

    var updatedMesocycle = await _mesocycleRepository.UpdateAsync(mesocycle, cancellationToken);

    // Gestionar microciclos según el cambio en WeeksCount
    if (dto.WeeksCount != existingMicrocycles.Count())
    {
        await SyncMicrocyclesForMesocycleAsync(
            updatedMesocycle,
            existingMicrocycles.ToList(),
            cancellationToken);
    }

    // Contar microciclos actualizados
    var currentMicrocycles = await _microcycleRepository.GetByMesocycleIdAsync(id, cancellationToken);
    return MapToMesocycleResponseDto(updatedMesocycle, currentMicrocycles.Count());
}
```

### 3.4. Agregar método SyncMicrocyclesForMesocycleAsync

```csharp
private async Task SyncMicrocyclesForMesocycleAsync(
    Mesocycle mesocycle,
    List<Microcycle> existingMicrocycles,
    CancellationToken cancellationToken)
{
    var currentCount = existingMicrocycles.Count;
    var targetCount = mesocycle.WeeksCount;

    if (targetCount > currentCount)
    {
        // Agregar microciclos faltantes
        var weeksToAdd = targetCount - currentCount;
        var lastWeekNumber = existingMicrocycles.Any()
            ? existingMicrocycles.Max(m => m.WeekNumber)
            : 0;

        // Calcular la fecha de inicio del próximo microciclo
        var lastMicrocycle = existingMicrocycles
            .OrderByDescending(m => m.WeekNumber)
            .FirstOrDefault();

        var currentDate = lastMicrocycle != null
            ? lastMicrocycle.EndDate.AddDays(1)
            : mesocycle.StartDate;

        for (int week = 1; week <= weeksToAdd; week++)
        {
            var weekNumber = lastWeekNumber + week;
            var weekStartDate = currentDate;
            var weekEndDate = currentDate.AddDays(6);

            var newMicrocycle = new Microcycle
            {
                Name = $"Semana {weekNumber}", // ✅ NUEVO - Nombre por defecto
                Description = null, // ✅ NUEVO - Sin descripción por defecto
                WeekNumber = weekNumber,
                StartDate = weekStartDate,
                EndDate = weekEndDate,
                Sessions = 0, // Se calculará automáticamente
                Volume = 0, // Se calculará automáticamente
                Intensity = MicrocycleIntensity.Medium,
                Focus = null,
                MesocycleId = mesocycle.Id
            };

            await _microcycleRepository.CreateAsync(newMicrocycle, cancellationToken);
            currentDate = currentDate.AddDays(7);
        }
    }
    else if (targetCount < currentCount)
    {
        // Eliminar microciclos sobrantes (los últimos)
        // NOTA: Ya validamos que no tengan sesiones en UpdateAsync
        var weeksToRemove = currentCount - targetCount;
        var microcyclesToRemove = existingMicrocycles
            .OrderByDescending(m => m.WeekNumber)
            .Take(weeksToRemove)
            .ToList();

        foreach (var microcycle in microcyclesToRemove)
        {
            await _microcycleRepository.DeleteAsync(microcycle.Id, cancellationToken);
        }
    }
}
```

---

## 4. Cambios en MicrocycleService

### 4.1. Actualizar GetByIdAsync

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

### 4.2. Actualizar GetByMesocycleIdAsync

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

### 4.3. Actualizar GetByPeriodIdAsync

```csharp
public async Task<IEnumerable<MicrocycleResponseDto>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default)
{
    var microcycles = await _microcycleRepository.GetByPeriodIdAsync(periodId, cancellationToken);
    
    // Recalcular volumen y sesiones para cada microciclo
    foreach (var microcycle in microcycles)
    {
        await RecalculateVolumeAndSessionsAsync(microcycle.Id, cancellationToken);
    }
    
    // Obtener los microciclos actualizados
    microcycles = await _microcycleRepository.GetByPeriodIdAsync(periodId, cancellationToken);
    
    return microcycles.Select(MapToMicrocycleResponseDto);
}
```

### 4.4. Actualizar UpdateAsync

```csharp
public async Task<MicrocycleResponseDto> UpdateAsync(int id, UpdateMicrocycleDto dto, int coachId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(id, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    if (!await ValidateMicrocycleAccessAsync(id, coachId, cancellationToken))
        throw new UnauthorizedException("No tienes permisos para actualizar este microciclo");

    // Validar que el nombre no esté vacío
    if (string.IsNullOrWhiteSpace(dto.Name))
        throw new ValidationException("El nombre del microciclo es requerido");

    // Actualizar campos editables
    microcycle.Name = dto.Name.Trim();
    microcycle.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
    microcycle.Intensity = dto.Intensity;
    microcycle.Focus = dto.Focus;
    
    // NO actualizar Sessions y Volume - se calculan automáticamente
    // Recalcular volumen y sesiones antes de guardar
    await RecalculateVolumeAndSessionsAsync(microcycle.Id, cancellationToken);

    var updatedMicrocycle = await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);
    return MapToMicrocycleResponseDto(updatedMicrocycle);
}
```

### 4.5. Agregar método RecalculateVolumeAndSessionsAsync

```csharp
/// <summary>
/// Recalcula el volumen y la cantidad de sesiones de un microciclo basándose en las sesiones asignadas
/// </summary>
private async Task RecalculateVolumeAndSessionsAsync(int microcycleId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    // Obtener todas las sesiones del microciclo para contar
    var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycleId, cancellationToken);

    // Calcular cantidad de sesiones
    microcycle.Sessions = sessions.Count();

    // Calcular volumen total usando el método del repository
    var totalVolumeKm = await _microcycleRepository.CalculateTotalVolumeAsync(microcycleId, cancellationToken);

    // Actualizar el volumen del microciclo
    microcycle.Volume = totalVolumeKm;
    
    // Guardar los cambios
    await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);
}
```

### 4.6. Actualizar RecalculateVolumeAsync

```csharp
public async Task<decimal> RecalculateVolumeAsync(int microcycleId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    // Usar el método del repository que calcula el volumen sumando las distancias de los intervalos
    var totalVolume = await _microcycleRepository.CalculateTotalVolumeAsync(microcycleId, cancellationToken);

    // Actualizar el volumen del microciclo
    microcycle.Volume = totalVolume;
    
    // También recalcular sesiones
    var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycleId, cancellationToken);
    microcycle.Sessions = sessions.Count();

    await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);
    return totalVolume;
}
```

### 4.7. Actualizar MapToMicrocycleResponseDto

```csharp
private MicrocycleResponseDto MapToMicrocycleResponseDto(Microcycle microcycle)
{
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
        TrainingSessionsCount = microcycle.TrainingSessions?.Count ?? 0,
        CreatedAt = microcycle.CreatedAt,
        UpdatedAt = microcycle.UpdatedAt
    };
}
```

---

## 5. Cambios en MicrocycleController

### 5.1. Comentar/Remover el endpoint DELETE

```csharp
// ❌ DELETE endpoint removido - Los microciclos NO se pueden eliminar desde el menú
// Solo se eliminan automáticamente al ajustar la cantidad de semanas en el mesociclo
// DELETE: api/Microcycle/{id}
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

---

## 6. Cambios en OnModelCreating (Entity Framework Configuration)

Agregar la configuración para los nuevos campos `Name` y `Description` en el `modelBuilder`:

```csharp
modelBuilder.Entity<Microcycle>(entity =>
{
    entity.HasKey(e => e.Id);

    // ✅ NUEVO - Configuración para Name
    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(200);

    // ✅ NUEVO - Configuración para Description
    entity.Property(e => e.Description)
        .HasMaxLength(1000); // Opcional, sin IsRequired()

    entity.Property(e => e.WeekNumber)
        .IsRequired();

    entity.Property(e => e.StartDate)
        .IsRequired();

    entity.Property(e => e.EndDate)
        .IsRequired();

    entity.Property(e => e.Sessions)
        .IsRequired();

    entity.Property(e => e.Volume)
        .IsRequired()
        .HasColumnType("decimal(10,2)");

    entity.Property(e => e.Intensity)
        .IsRequired()
        .HasMaxLength(50)
        .HasConversion<string>();

    entity.Property(e => e.Focus)
        .HasConversion<int>();

    entity.Property(e => e.MesocycleId)
        .IsRequired();

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    entity.Property(e => e.UpdatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación con Mesocycle (REQUERIDA - un microciclo pertenece a un solo mesociclo)
    entity.HasOne(e => e.Mesocycle)
        .WithMany(e => e.Microcycles)
        .HasForeignKey(e => e.MesocycleId)
        .OnDelete(DeleteBehavior.Cascade);

    // Relación con TrainingSessions (REQUERIDA - todas las sesiones están dentro de un microciclo)
    entity.HasMany(e => e.TrainingSessions)
        .WithOne(e => e.Microcycle)
        .HasForeignKey(e => e.MicrocycleId)
        .OnDelete(DeleteBehavior.Cascade);

    // Índices
    entity.HasIndex(e => e.MesocycleId);
    entity.HasIndex(e => e.StartDate);
    entity.HasIndex(e => e.EndDate);
});
```

---

## 7. Migración de Base de Datos

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

**Nota importante**: Si ya tienes microciclos en la base de datos, necesitarás actualizar los valores de `Name` para los registros existentes. Puedes hacerlo con un script SQL:

```sql
-- Actualizar nombres de microciclos existentes basándose en WeekNumber
UPDATE "Microcycles"
SET "Name" = 'Semana ' || "WeekNumber"
WHERE "Name" IS NULL OR "Name" = '';
```

---

## 8. Resumen de Cambios

### Campos Agregados:
- ✅ `Name` (string, requerido) - Nombre del microciclo
- ✅ `Description` (string?, opcional) - Descripción del microciclo

### Campos Readonly (calculados automáticamente):
- ✅ `Sessions` - Se calcula contando las sesiones asignadas
- ✅ `Volume` - Se calcula sumando el volumen de todas las sesiones usando `CalculateTotalVolumeAsync`

### Endpoints Afectados:
- ✅ `PUT /api/Microcycle/{id}` - Ahora acepta `Name` y `Description`, pero NO `Sessions` ni `Volume`
- ❌ `DELETE /api/Microcycle/{id}` - Removido o deshabilitado

### Validaciones:
- `Name` es requerido y no puede estar vacío
- `Description` es opcional
- `Sessions` y `Volume` se calculan automáticamente y no se pueden editar manualmente
- No se pueden eliminar microciclos que tengan sesiones asignadas

---

## 9. Orden de Aplicación

1. **Primero**: Actualizar la entidad `Microcycle` agregando `Name` y `Description`
2. **Segundo**: Actualizar la configuración de Entity Framework en `OnModelCreating` para `Name` y `Description`
3. **Tercero**: Actualizar los DTOs (`UpdateMicrocycleDto` y `MicrocycleResponseDto`)
4. **Cuarto**: Crear y aplicar la migración de base de datos
5. **Quinto**: Actualizar `MesocycleService` (constructor, `CreateWithAutoMicrocyclesAsync`, `UpdateAsync`, agregar `SyncMicrocyclesForMesocycleAsync`)
6. **Sexto**: Actualizar `MicrocycleService` (todos los métodos mencionados)
7. **Séptimo**: Actualizar `MicrocycleController` (comentar DELETE endpoint)

---

## 10. Notas Importantes

- Los microciclos se crean automáticamente con `Name = "Semana {weekNumber}"` por defecto
- `Sessions` y `Volume` se recalculan automáticamente cada vez que se obtiene un microciclo
- Los microciclos solo se pueden eliminar ajustando `WeeksCount` en el mesociclo, no desde el menú
- Si un microciclo tiene sesiones asignadas, no se puede eliminar al reducir `WeeksCount`

