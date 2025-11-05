# Métodos Backend para Planificaciones - Controller, Service y Repository

## Resumen de Lógica de Negocio

### Flujo de Creación:
1. **Crear Planificación**: Se crea sin mesociclos (solo con datos básicos y asignación de atletas).
2. **Agregar Mesociclo**: Al agregar un mesociclo con cantidad de semanas, se crean automáticamente los microciclos (1 por semana).
3. **Microciclos Automáticos**: Cada microciclo se crea con:
   - `WeekNumber` (1, 2, 3, ... según la semana dentro del mesociclo)
   - `StartDate` y `EndDate` calculadas automáticamente
   - `Volume` inicial en 0 (se calcula automáticamente después basado en las sesiones del microciclo)
   - Debe asignarse a un período (requerido)

---

## 1. Repository Interfaces

### 1.1. `IPlanningRepository`

```csharp
public interface IPlanningRepository
{
    // CRUD básico
    Task<Planning?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Planning>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Planning>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default);
    Task<Planning> CreateAsync(Planning planning, CancellationToken cancellationToken = default);
    Task<Planning> UpdateAsync(Planning planning, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);

    // Búsquedas específicas
    Task<IEnumerable<Planning>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Planning>> GetActivePlanningsAsync(int coachId, CancellationToken cancellationToken = default);
    Task<Planning?> GetByIdWithDetailsAsync(int id, CancellationToken cancellationToken = default); // Incluye mesociclos, períodos, etc.
}
```

### 1.2. `IPeriodRepository`

```csharp
public interface IPeriodRepository
{
    // CRUD básico
    Task<Period?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Period>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Period>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<Period> CreateAsync(Period period, CancellationToken cancellationToken = default);
    Task<Period> UpdateAsync(Period period, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);

    // Búsquedas específicas
    Task<IEnumerable<Period>> GetPeriodsWithMesocyclesAsync(int planningId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Period>> GetPeriodsWithMicrocyclesAsync(int planningId, CancellationToken cancellationToken = default);
}
```

### 1.3. `IMesocycleRepository`

```csharp
public interface IMesocycleRepository
{
    // CRUD básico
    Task<Mesocycle?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Mesocycle>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Mesocycle>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<Mesocycle> CreateAsync(Mesocycle mesocycle, CancellationToken cancellationToken = default);
    Task<Mesocycle> UpdateAsync(Mesocycle mesocycle, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);

    // Búsquedas específicas
    Task<IEnumerable<Mesocycle>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default);
    Task<Mesocycle?> GetByIdWithMicrocyclesAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Mesocycle>> GetByPlanningIdWithMicrocyclesAsync(int planningId, CancellationToken cancellationToken = default);
    Task<bool> HasOverlappingDatesAsync(int planningId, DateTime startDate, DateTime endDate, int? excludeMesocycleId = null, CancellationToken cancellationToken = default);
}
```

### 1.4. `IMicrocycleRepository`

```csharp
public interface IMicrocycleRepository
{
    // CRUD básico
    Task<Microcycle?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Microcycle>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Microcycle>> GetByMesocycleIdAsync(int mesocycleId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Microcycle>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default);
    Task<Microcycle> CreateAsync(Microcycle microcycle, CancellationToken cancellationToken = default);
    Task<Microcycle> UpdateAsync(Microcycle microcycle, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);

    // Búsquedas específicas
    Task<Microcycle?> GetByPlanningIdAndDateAsync(int planningId, DateTime date, CancellationToken cancellationToken = default);
    Task<IEnumerable<Microcycle>> GetByPeriodIdWithSessionsAsync(int periodId, CancellationToken cancellationToken = default);
    Task<decimal> CalculateTotalVolumeAsync(int microcycleId, CancellationToken cancellationToken = default); // Calcula volumen basado en sesiones
    Task<bool> UpdateVolumeAsync(int microcycleId, decimal volume, CancellationToken cancellationToken = default);
}
```

### 1.5. `IPlanningAthleteRepository`

```csharp
public interface IPlanningAthleteRepository
{
    // CRUD básico
    Task<PlanningAthlete?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<PlanningAthlete>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<IEnumerable<PlanningAthlete>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default);
    Task<PlanningAthlete> CreateAsync(PlanningAthlete planningAthlete, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int planningId, int athleteId, CancellationToken cancellationToken = default);

    // Operaciones masivas
    Task<int> CreateMultipleAsync(IEnumerable<PlanningAthlete> planningAthletes, CancellationToken cancellationToken = default);
    Task<bool> DeleteByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<bool> DeleteByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default);
}
```

### 1.6. `ITrainingSessionRepository`

```csharp
public interface ITrainingSessionRepository
{
    // CRUD básico
    Task<TrainingSession?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSession>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSession>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSession>> GetByMicrocycleIdAsync(int microcycleId, CancellationToken cancellationToken = default);
    Task<TrainingSession> CreateAsync(TrainingSession trainingSession, CancellationToken cancellationToken = default);
    Task<TrainingSession> UpdateAsync(TrainingSession trainingSession, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);

    // Búsquedas específicas
    Task<IEnumerable<TrainingSession>> GetByDateRangeAsync(int planningId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSession>> GetByDateAsync(int planningId, DateTime date, CancellationToken cancellationToken = default);
    Task<TrainingSession?> GetByIdWithAthletesAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSession>> GetByAthleteIdAsync(int athleteId, int? planningId = null, CancellationToken cancellationToken = default);
}
```

---

## 2. Service Interfaces

### 2.1. `IPlanningService`

```csharp
public interface IPlanningService
{
    // CRUD básico
    Task<PlanningResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<PlanningResponseDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PlanningResponseDto>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default);
    Task<IEnumerable<PlanningResponseDto>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default);
    Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<PlanningResponseDto> UpdateAsync(int id, UpdatePlanningDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

    // Asignación de atletas
    Task<bool> AssignAthletesAsync(int planningId, IEnumerable<int> athleteIds, int coachId, CancellationToken cancellationToken = default);
    Task<bool> RemoveAthleteAsync(int planningId, int athleteId, int coachId, CancellationToken cancellationToken = default);
    Task<bool> AssignAthletesFromGroupAsync(int planningId, int groupId, int coachId, CancellationToken cancellationToken = default); // Crea relaciones individuales
    Task<IEnumerable<PlanningAthleteResponseDto>> GetAssignedAthletesAsync(int planningId, int coachId, CancellationToken cancellationToken = default); // Obtiene los atletas asignados a una planificación

    // Validaciones
    Task<bool> ValidatePlanningAccessAsync(int planningId, int coachId, CancellationToken cancellationToken = default);
    Task<bool> ValidatePlanningExistsAsync(int planningId, CancellationToken cancellationToken = default);
}
```

### 2.2. `IPeriodService`

```csharp
public interface IPeriodService
{
    // CRUD básico
    Task<PeriodResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<PeriodResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<PeriodResponseDto> CreateAsync(CreatePeriodDto dto, int planningId, int coachId, CancellationToken cancellationToken = default);
    Task<PeriodResponseDto> UpdateAsync(int id, UpdatePeriodDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

    // Validaciones
    Task<bool> ValidatePeriodAccessAsync(int periodId, int coachId, CancellationToken cancellationToken = default);
}
```

### 2.3. `IMesocycleService`

```csharp
public interface IMesocycleService
{
    // CRUD básico
    Task<MesocycleResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<MesocycleResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<MesocycleResponseDto> CreateAsync(CreateMesocycleDto dto, int planningId, int coachId, CancellationToken cancellationToken = default);
    Task<MesocycleResponseDto> UpdateAsync(int id, UpdateMesocycleDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

    // Funcionalidad especial: Crear mesociclo con microciclos automáticos
    Task<MesocycleResponseDto> CreateWithAutoMicrocyclesAsync(CreateMesocycleDto dto, int planningId, int periodId, int coachId, CancellationToken cancellationToken = default);

    // Validaciones
    Task<bool> ValidateMesocycleAccessAsync(int mesocycleId, int coachId, CancellationToken cancellationToken = default);
    Task<bool> ValidateNoDateOverlapAsync(int planningId, DateTime startDate, DateTime endDate, int? excludeMesocycleId = null, CancellationToken cancellationToken = default);
}
```

### 2.4. `IMicrocycleService`

```csharp
public interface IMicrocycleService
{
    // CRUD básico
    Task<MicrocycleResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<MicrocycleResponseDto>> GetByMesocycleIdAsync(int mesocycleId, CancellationToken cancellationToken = default);
    Task<IEnumerable<MicrocycleResponseDto>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default);
    Task<MicrocycleResponseDto> UpdateAsync(int id, UpdateMicrocycleDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

    // Funcionalidad especial
    Task<decimal> RecalculateVolumeAsync(int microcycleId, CancellationToken cancellationToken = default); // Recalcula volumen basado en sesiones
    Task<bool> UpdateVolumeAutomaticallyAsync(int microcycleId, CancellationToken cancellationToken = default); // Actualiza volumen automáticamente

    // Validaciones
    Task<bool> ValidateMicrocycleAccessAsync(int microcycleId, int coachId, CancellationToken cancellationToken = default);
}
```

### 2.5. `ITrainingSessionService`

```csharp
public interface ITrainingSessionService
{
    // CRUD básico
    Task<TrainingSessionResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSessionResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSessionResponseDto>> GetByMicrocycleIdAsync(int microcycleId, CancellationToken cancellationToken = default);
    Task<IEnumerable<TrainingSessionResponseDto>> GetByAthleteIdAsync(int athleteId, int? planningId = null, CancellationToken cancellationToken = default);
    Task<TrainingSessionResponseDto> CreateAsync(CreateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<TrainingSessionResponseDto> UpdateAsync(int id, UpdateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

    // Funcionalidad especial: Identificación automática de microciclo
    Task<TrainingSessionResponseDto> CreateWithAutoMicrocycleDetectionAsync(CreateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default);

    // Validaciones
    Task<bool> ValidateSessionAccessAsync(int sessionId, int coachId, CancellationToken cancellationToken = default);
    Task<bool> ValidateDateInMicrocycleRangeAsync(int microcycleId, DateTime date, CancellationToken cancellationToken = default);
}
```

---

## 3. DTOs (Data Transfer Objects)

### 3.1. Planning DTOs

```csharp
// Request DTOs
public class CreatePlanningDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public PlanningStatus Status { get; set; } = PlanningStatus.Draft;
    public IEnumerable<int> AthleteIds { get; set; } = new List<int>(); // Atletas individuales
    public IEnumerable<int>? GroupIds { get; set; } // Opcional: grupos para facilitar asignación (se convierten a athleteIds en el servicio)
}

public class UpdatePlanningDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public PlanningStatus Status { get; set; }
}

// Response DTOs
public class PlanningResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public PlanningStatus Status { get; set; }
    public int CoachId { get; set; }
    public string CoachName { get; set; } = string.Empty;
    public int AthletesCount { get; set; }
    public int MesocyclesCount { get; set; }
    public int PeriodsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO de respuesta para un atleta asignado a una planificación
/// </summary>
public class PlanningAthleteResponseDto
{
    public int Id { get; set; } // ID de PlanningAthlete
    public int AthleteId { get; set; }
    public string AthleteName { get; set; } = string.Empty;
    public string AthleteEmail { get; set; } = string.Empty;
    public int PlanningId { get; set; }
    public DateTime AssignedAt { get; set; }
}
```

### 3.2. Period DTOs

```csharp
// Request DTOs
public class CreatePeriodDto
{
    public string Name { get; set; } = string.Empty;
    public int StartWeek { get; set; }
    public int EndWeek { get; set; }
    public string? Objective { get; set; }
    public PeriodStatus Status { get; set; } = PeriodStatus.Planning;
}

public class UpdatePeriodDto
{
    public string Name { get; set; } = string.Empty;
    public int StartWeek { get; set; }
    public int EndWeek { get; set; }
    public string? Objective { get; set; }
    public PeriodStatus Status { get; set; }
}

// Response DTOs
public class PeriodResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StartWeek { get; set; }
    public int EndWeek { get; set; }
    public string? Objective { get; set; }
    public PeriodStatus Status { get; set; }
    public int? PlanningId { get; set; }
    public int MesocyclesCount { get; set; }
    public int MicrocyclesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 3.3. Mesocycle DTOs

```csharp
// Request DTOs
public class CreateMesocycleDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public int WeeksCount { get; set; } // IMPORTANTE: Define cuántos microciclos crear automáticamente
    public string? Objective { get; set; }
    public MesocycleStatus Status { get; set; } = MesocycleStatus.Planning;
    public int? PeriodId { get; set; } // Opcional: puede asignarse a un período
}

public class UpdateMesocycleDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int WeeksCount { get; set; }
    public string? Objective { get; set; }
    public MesocycleStatus Status { get; set; }
    public int? PeriodId { get; set; }
}

// Response DTOs
public class MesocycleResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Objective { get; set; }
    public int WeeksCount { get; set; }
    public MesocycleStatus Status { get; set; }
    public int PlanningId { get; set; }
    public int? PeriodId { get; set; }
    public int MicrocyclesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 3.4. Microcycle DTOs

```csharp
// Request DTOs (NO hay CreateMicrocycleDto porque se crean automáticamente)
public class UpdateMicrocycleDto
{
    public int Sessions { get; set; }
    public decimal Volume { get; set; } // Se actualiza automáticamente, pero puede ajustarse manualmente
    public MicrocycleIntensity Intensity { get; set; }
    public MicrocycleFocus? Focus { get; set; }
}

// Response DTOs
public class MicrocycleResponseDto
{
    public int Id { get; set; }
    public int WeekNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Sessions { get; set; }
    public decimal Volume { get; set; }
    public MicrocycleIntensity Intensity { get; set; }
    public MicrocycleFocus? Focus { get; set; }
    public int MesocycleId { get; set; }
    public int PeriodId { get; set; }
    public int TrainingSessionsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 3.5. TrainingSession DTOs

```csharp
// Request DTOs
public class CreateTrainingSessionDto
{
    public int PlanningId { get; set; } // REQUERIDO - contexto de planificación
    public string Date { get; set; } = string.Empty; // REQUERIDO - fecha de la sesión (ISO string)
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TrainingSessionCategory Category { get; set; } = TrainingSessionCategory.Training;
    public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
    public IEnumerable<CreateTrainingIntervalDto>? Intervals { get; set; }
    public string? Notes { get; set; }
    public string? Volume { get; set; }
    public string? Intensity { get; set; }
}

public class UpdateTrainingSessionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public TrainingSessionCategory Category { get; set; }
    public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
    public IEnumerable<CreateTrainingIntervalDto>? Intervals { get; set; }
    public string? Notes { get; set; }
    public string? Volume { get; set; }
    public string? Intensity { get; set; }
}

// Response DTOs
public class TrainingSessionResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public TrainingSessionCategory Category { get; set; }
    public int PlanningId { get; set; }
    public int MicrocycleId { get; set; }
    public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
    public IEnumerable<TrainingIntervalResponseDto>? Intervals { get; set; }
    public string? Notes { get; set; }
    public string? Volume { get; set; }
    public string? Intensity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

---

## 4. Service Implementations (Lógica de Negocio)

### 4.1. `MesocycleService.CreateWithAutoMicrocyclesAsync`

**Lógica crítica**: Crear mesociclo y generar microciclos automáticamente (1 por semana).

```csharp
public async Task<MesocycleResponseDto> CreateWithAutoMicrocyclesAsync(
    CreateMesocycleDto dto, 
    int planningId, 
    int periodId, 
    int coachId,
    CancellationToken cancellationToken = default)
{
    // 1. Validar permisos
    var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
    if (planning == null || planning.CoachId != coachId)
        throw new UnauthorizedException("No tienes permisos para crear mesociclos en esta planificación");

    // 2. Validar que el período existe y pertenece a la planificación
    var period = await _periodRepository.GetByIdAsync(periodId, cancellationToken);
    if (period == null || period.PlanningId != planningId)
        throw new NotFoundException("Período no encontrado o no pertenece a esta planificación");

    // 3. Validar que no hay superposición de fechas con otros mesociclos
    var endDate = dto.StartDate.AddDays((dto.WeeksCount * 7) - 1);
    var hasOverlap = await _mesocycleRepository.HasOverlappingDatesAsync(
        planningId, dto.StartDate, endDate, null, cancellationToken);
    if (hasOverlap)
        throw new ValidationException("El mesociclo se superpone con otro mesociclo existente");

    // 4. Validar que WeeksCount es válido
    if (dto.WeeksCount <= 0 || dto.WeeksCount > 52)
        throw new ValidationException("El número de semanas debe estar entre 1 y 52");

    // 5. Crear el mesociclo
    var mesocycle = new Mesocycle
    {
        Name = dto.Name,
        StartDate = dto.StartDate,
        EndDate = endDate, // Calculado automáticamente: StartDate + (WeeksCount * 7) - 1
        WeeksCount = dto.WeeksCount,
        Objective = dto.Objective,
        Status = dto.Status,
        PlanningId = planningId,
        PeriodId = dto.PeriodId // Opcional - puede asignarse después
    };

    var createdMesocycle = await _mesocycleRepository.CreateAsync(mesocycle, cancellationToken);

    // 6. Crear microciclos automáticamente (1 por semana)
    var microcycles = new List<Microcycle>();
    var currentDate = dto.StartDate;

    for (int week = 1; week <= dto.WeeksCount; week++)
    {
        var weekStartDate = currentDate;
        var weekEndDate = currentDate.AddDays(6); // Semana completa de 7 días (lunes a domingo)

        var microcycle = new Microcycle
        {
            WeekNumber = week, // 1, 2, 3, ..., WeeksCount
            StartDate = weekStartDate, // Calculado automáticamente
            EndDate = weekEndDate, // Calculado automáticamente: StartDate + 6 días
            Sessions = 0, // Inicialmente 0, se actualizará cuando se agreguen sesiones
            Volume = 0, // Inicialmente 0, se calculará automáticamente basado en las sesiones
            Intensity = MicrocycleIntensity.Medium, // Valor por defecto
            Focus = null, // Se puede establecer después manualmente
            MesocycleId = createdMesocycle.Id,
            PeriodId = periodId // REQUERIDO - todos los microciclos deben pertenecer a un período
        };

        var createdMicrocycle = await _microcycleRepository.CreateAsync(microcycle, cancellationToken);
        microcycles.Add(createdMicrocycle);

        // Avanzar a la siguiente semana
        currentDate = currentDate.AddDays(7);
    }

    // 7. Mapear a DTO y retornar
    return MapToMesocycleResponseDto(createdMesocycle, microcycles.Count);
}
```

**Ejemplo de cálculo automático de fechas**:
- Mesociclo: `StartDate = 2024-01-01`, `WeeksCount = 4`
- Microciclo 1: `StartDate = 2024-01-01`, `EndDate = 2024-01-07` (semana 1)
- Microciclo 2: `StartDate = 2024-01-08`, `EndDate = 2024-01-14` (semana 2)
- Microciclo 3: `StartDate = 2024-01-15`, `EndDate = 2024-01-21` (semana 3)
- Microciclo 4: `StartDate = 2024-01-22`, `EndDate = 2024-01-28` (semana 4)

### 4.2. `MicrocycleService.RecalculateVolumeAsync`

**Lógica**: Recalcular el volumen total de un microciclo basado en las sesiones.

```csharp
public async Task<decimal> RecalculateVolumeAsync(int microcycleId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    // Obtener todas las sesiones del microciclo
    var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycleId, cancellationToken);

    // Calcular volumen total sumando el volumen de cada sesión
    decimal totalVolume = 0;
    foreach (var session in sessions)
    {
        // Si la sesión tiene volumen en string, parsearlo
        if (!string.IsNullOrEmpty(session.Volume))
        {
            // Parsear formato como "10.5 km" o "10.5"
            var volumeStr = session.Volume.Replace(" km", "").Replace("km", "").Trim();
            if (decimal.TryParse(volumeStr, out decimal sessionVolume))
            {
                totalVolume += sessionVolume;
            }
        }
    }

    // Actualizar el volumen del microciclo
    microcycle.Volume = totalVolume;
    await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);

    return totalVolume;
}
```

### 4.3. `MicrocycleService.UpdateVolumeAutomaticallyAsync`

**Lógica**: Se ejecuta automáticamente cuando se crea/actualiza/elimina una sesión.

```csharp
public async Task<bool> UpdateVolumeAutomaticallyAsync(int microcycleId, CancellationToken cancellationToken = default)
{
    var volume = await RecalculateVolumeAsync(microcycleId, cancellationToken);
    return true;
}
```

### 4.4. `TrainingSessionService.CreateWithAutoMicrocycleDetectionAsync`

**Lógica**: Crear sesión identificando automáticamente el microciclo.

```csharp
public async Task<TrainingSessionResponseDto> CreateWithAutoMicrocycleDetectionAsync(
    CreateTrainingSessionDto dto, 
    int coachId,
    CancellationToken cancellationToken = default)
{
    // 1. Validar que la planificación existe y el usuario tiene permisos
    var planning = await _planningRepository.GetByIdAsync(dto.PlanningId, cancellationToken);
    if (planning == null)
        throw new NotFoundException("Planificación no encontrada");

    if (planning.CoachId != coachId)
        throw new UnauthorizedException("No tienes permisos para crear sesiones en esta planificación");

    // 2. Buscar el microciclo que contiene la fecha dentro de esta planificación
    var sessionDate = DateTime.Parse(dto.Date);
    var microcycle = await _microcycleRepository.GetByPlanningIdAndDateAsync(
        dto.PlanningId, sessionDate, cancellationToken);

    if (microcycle == null)
        throw new ValidationException(
            $"No se encontró un microciclo para la fecha {dto.Date:yyyy-MM-dd} en la planificación. " +
            $"Asegúrate de que la fecha esté dentro del rango de algún microciclo de la planificación.");

    // 3. Validar que la fecha está dentro del rango del microciclo
    if (sessionDate < microcycle.StartDate || sessionDate > microcycle.EndDate)
        throw new ValidationException(
            $"La fecha {dto.Date:yyyy-MM-dd} no está dentro del rango del microciclo " +
            $"({microcycle.StartDate:yyyy-MM-dd} - {microcycle.EndDate:yyyy-MM-dd})");

    // 4. Crear la sesión
    var trainingSession = new TrainingSession
    {
        PlanningId = dto.PlanningId,
        MicrocycleId = microcycle.Id, // Identificado automáticamente
        Date = sessionDate,
        Name = dto.Name,
        Description = dto.Description,
        Category = dto.Category,
        Notes = dto.Notes,
        Volume = dto.Volume,
        Intensity = dto.Intensity
    };

    var createdSession = await _trainingSessionRepository.CreateAsync(trainingSession, cancellationToken);

    // 5. Asignar atletas a la sesión
    if (dto.AthleteIds != null && dto.AthleteIds.Any())
    {
        foreach (var athleteId in dto.AthleteIds)
        {
            var sessionAthlete = new TrainingSessionAthlete
            {
                TrainingSessionId = createdSession.Id,
                AthleteId = athleteId
            };
            await _trainingSessionAthleteRepository.CreateAsync(sessionAthlete, cancellationToken);
        }
    }

    // 6. Crear intervalos si existen
    if (dto.Intervals != null && dto.Intervals.Any())
    {
        // Lógica para crear intervalos
        // (depende de cómo esté estructurada la entidad TrainingInterval)
    }

    // 7. Recalcular volumen del microciclo automáticamente
    await _microcycleService.UpdateVolumeAutomaticallyAsync(microcycle.Id, cancellationToken);

    // 8. Actualizar contador de sesiones del microciclo
    var sessionsCount = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycle.Id, cancellationToken);
    microcycle.Sessions = sessionsCount.Count();
    await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);

    return MapToTrainingSessionResponseDto(createdSession);
}
```

**Nota sobre el volumen**: El volumen se actualiza automáticamente cada vez que se crea, actualiza o elimina una sesión. El campo `Volume` del microciclo se recalcula sumando el volumen de todas las sesiones del microciclo.

### 4.5. `PlanningService.AssignAthletesFromGroupAsync`

**Lógica**: Asignar atletas de un grupo creando relaciones individuales.

```csharp
public async Task<bool> AssignAthletesFromGroupAsync(int planningId, int groupId, int coachId, CancellationToken cancellationToken = default)
{
    // 1. Validar permisos
    var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
    if (planning == null || planning.CoachId != coachId)
        throw new UnauthorizedException("No tienes permisos para asignar atletas a esta planificación");

    // 2. Obtener todos los miembros activos del grupo
    var groupMembers = await _trainingGroupService.GetGroupMembersAsync(groupId, cancellationToken);
    var activeAthletes = groupMembers
        .Where(m => m.Status == "active")
        .Select(m => m.UserId)
        .ToList();

    if (!activeAthletes.Any())
        throw new ValidationException("El grupo no tiene atletas activos");

    // 3. Filtrar atletas que ya están asignados
    var existingAssignments = await _planningAthleteRepository.GetByPlanningIdAsync(planningId, cancellationToken);
    var existingAthleteIds = existingAssignments.Select(a => a.AthleteId).ToHashSet();
    var newAthletes = activeAthletes.Where(id => !existingAthleteIds.Contains(id)).ToList();

    if (!newAthletes.Any())
        throw new ValidationException("Todos los atletas del grupo ya están asignados a esta planificación");

    // 4. Crear relaciones individuales para cada atleta
    var planningAthletes = newAthletes.Select(athleteId => new PlanningAthlete
    {
        PlanningId = planningId,
        AthleteId = athleteId
    }).ToList();

    await _planningAthleteRepository.CreateMultipleAsync(planningAthletes, cancellationToken);

    return true;
}
```

---

## 5. Controller Endpoints

### 5.1. `PlanningsController`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlanningsController : ControllerBase
{
    private readonly IPlanningService _planningService;
    private readonly ICurrentUserService _currentUserService;

    // GET: api/Plannings
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlanningResponseDto>>> GetAll()
    {
        var coachId = _currentUserService.GetUserId();
        var plannings = await _planningService.GetByCoachIdAsync(coachId);
        return Ok(plannings);
    }

    // GET: api/Plannings/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<PlanningResponseDto>> GetById(int id)
    {
        var planning = await _planningService.GetByIdAsync(id);
        if (planning == null) return NotFound();
        return Ok(planning);
    }

    // POST: api/Plannings
    [HttpPost]
    public async Task<ActionResult<PlanningResponseDto>> Create([FromBody] CreatePlanningDto dto)
    {
        var coachId = _currentUserService.GetUserId();
        var planning = await _planningService.CreateAsync(dto, coachId);
        return CreatedAtAction(nameof(GetById), new { id = planning.Id }, planning);
    }

    // PUT: api/Plannings/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<PlanningResponseDto>> Update(int id, [FromBody] UpdatePlanningDto dto)
    {
        var coachId = _currentUserService.GetUserId();
        var planning = await _planningService.UpdateAsync(id, dto, coachId);
        return Ok(planning);
    }

    // DELETE: api/Plannings/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _planningService.DeleteAsync(id, coachId);
        if (!result) return NotFound();
        return NoContent();
    }

    // POST: api/Plannings/{id}/athletes
    [HttpPost("{id}/athletes")]
    public async Task<IActionResult> AssignAthletes(int id, [FromBody] AssignAthletesDto dto)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _planningService.AssignAthletesAsync(id, dto.AthleteIds, coachId);
        if (!result) return BadRequest();
        return Ok();
    }

    // POST: api/Plannings/{id}/athletes/from-group/{groupId}
    [HttpPost("{id}/athletes/from-group/{groupId}")]
    public async Task<IActionResult> AssignAthletesFromGroup(int id, int groupId)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _planningService.AssignAthletesFromGroupAsync(id, groupId, coachId);
        if (!result) return BadRequest();
        return Ok();
    }

    // DELETE: api/Plannings/{id}/athletes/{athleteId}
    [HttpDelete("{id}/athletes/{athleteId}")]
    public async Task<IActionResult> RemoveAthlete(int id, int athleteId)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _planningService.RemoveAthleteAsync(id, athleteId, coachId);
        if (!result) return NotFound();
        return NoContent();
    }

    // GET: api/Plannings/athlete/{athleteId}
    [HttpGet("athlete/{athleteId}")]
    public async Task<ActionResult<IEnumerable<PlanningResponseDto>>> GetByAthleteId(int athleteId)
    {
        var plannings = await _planningService.GetByAthleteIdAsync(athleteId);
        return Ok(plannings);
    }
}
```

### 5.2. `PeriodsController`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PeriodsController : ControllerBase
{
    private readonly IPeriodService _periodService;
    private readonly ICurrentUserService _currentUserService;

    // GET: api/Periods/planning/{planningId}
    [HttpGet("planning/{planningId}")]
    public async Task<ActionResult<IEnumerable<PeriodResponseDto>>> GetByPlanningId(int planningId, CancellationToken cancellationToken)
    {
        var periods = await _periodService.GetByPlanningIdAsync(planningId, cancellationToken);
        return Ok(periods);
    }

    // GET: api/Periods/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<PeriodResponseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var period = await _periodService.GetByIdAsync(id, cancellationToken);
        if (period == null) return NotFound();
        return Ok(period);
    }

    // POST: api/Periods/planning/{planningId}
    [HttpPost("planning/{planningId}")]
    public async Task<ActionResult<PeriodResponseDto>> Create(int planningId, [FromBody] CreatePeriodDto dto, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var period = await _periodService.CreateAsync(dto, planningId, coachId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = period.Id }, period);
    }

    // PUT: api/Periods/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<PeriodResponseDto>> Update(int id, [FromBody] UpdatePeriodDto dto, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var period = await _periodService.UpdateAsync(id, dto, coachId, cancellationToken);
        return Ok(period);
    }

    // DELETE: api/Periods/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _periodService.DeleteAsync(id, coachId, cancellationToken);
        if (!result) return NotFound();
        return NoContent();
    }
}
```

### 5.3. `MesocyclesController`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MesocyclesController : ControllerBase
{
    private readonly IMesocycleService _mesocycleService;
    private readonly ICurrentUserService _currentUserService;

    // GET: api/Mesocycles/planning/{planningId}
    [HttpGet("planning/{planningId}")]
    public async Task<ActionResult<IEnumerable<MesocycleResponseDto>>> GetByPlanningId(int planningId, CancellationToken cancellationToken)
    {
        var mesocycles = await _mesocycleService.GetByPlanningIdAsync(planningId, cancellationToken);
        return Ok(mesocycles);
    }

    // GET: api/Mesocycles/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<MesocycleResponseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var mesocycle = await _mesocycleService.GetByIdAsync(id, cancellationToken);
        if (mesocycle == null) return NotFound();
        return Ok(mesocycle);
    }

    // POST: api/Mesocycles/planning/{planningId}/period/{periodId}
    // IMPORTANTE: Este endpoint crea el mesociclo y genera automáticamente los microciclos
    [HttpPost("planning/{planningId}/period/{periodId}")]
    public async Task<ActionResult<MesocycleResponseDto>> CreateWithAutoMicrocycles(
        int planningId, 
        int periodId, 
        [FromBody] CreateMesocycleDto dto,
        CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var mesocycle = await _mesocycleService.CreateWithAutoMicrocyclesAsync(
            dto, planningId, periodId, coachId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = mesocycle.Id }, mesocycle);
    }

    // PUT: api/Mesocycles/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<MesocycleResponseDto>> Update(int id, [FromBody] UpdateMesocycleDto dto, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var mesocycle = await _mesocycleService.UpdateAsync(id, dto, coachId, cancellationToken);
        return Ok(mesocycle);
    }

    // DELETE: api/Mesocycles/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _mesocycleService.DeleteAsync(id, coachId, cancellationToken);
        if (!result) return NotFound();
        return NoContent();
    }
}
```

### 5.4. `MicrocyclesController`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MicrocyclesController : ControllerBase
{
    private readonly IMicrocycleService _microcycleService;
    private readonly ICurrentUserService _currentUserService;

    // GET: api/Microcycles/mesocycle/{mesocycleId}
    [HttpGet("mesocycle/{mesocycleId}")]
    public async Task<ActionResult<IEnumerable<MicrocycleResponseDto>>> GetByMesocycleId(int mesocycleId, CancellationToken cancellationToken)
    {
        var microcycles = await _microcycleService.GetByMesocycleIdAsync(mesocycleId, cancellationToken);
        return Ok(microcycles);
    }

    // GET: api/Microcycles/period/{periodId}
    [HttpGet("period/{periodId}")]
    public async Task<ActionResult<IEnumerable<MicrocycleResponseDto>>> GetByPeriodId(int periodId, CancellationToken cancellationToken)
    {
        var microcycles = await _microcycleService.GetByPeriodIdAsync(periodId, cancellationToken);
        return Ok(microcycles);
    }

    // GET: api/Microcycles/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<MicrocycleResponseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var microcycle = await _microcycleService.GetByIdAsync(id, cancellationToken);
        if (microcycle == null) return NotFound();
        return Ok(microcycle);
    }

    // PUT: api/Microcycles/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<MicrocycleResponseDto>> Update(int id, [FromBody] UpdateMicrocycleDto dto, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var microcycle = await _microcycleService.UpdateAsync(id, dto, coachId, cancellationToken);
        return Ok(microcycle);
    }

    // POST: api/Microcycles/{id}/recalculate-volume
    [HttpPost("{id}/recalculate-volume")]
    public async Task<ActionResult<decimal>> RecalculateVolume(int id, CancellationToken cancellationToken)
    {
        var volume = await _microcycleService.RecalculateVolumeAsync(id, cancellationToken);
        return Ok(new { volume });
    }

    // DELETE: api/Microcycles/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _microcycleService.DeleteAsync(id, coachId, cancellationToken);
        if (!result) return NotFound();
        return NoContent();
    }
}
```

### 5.5. `TrainingSessionsController`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrainingSessionsController : ControllerBase
{
    private readonly ITrainingSessionService _trainingSessionService;
    private readonly ICurrentUserService _currentUserService;

    // GET: api/TrainingSessions/planning/{planningId}
    [HttpGet("planning/{planningId}")]
    public async Task<ActionResult<IEnumerable<TrainingSessionResponseDto>>> GetByPlanningId(int planningId)
    {
        var sessions = await _trainingSessionService.GetByPlanningIdAsync(planningId);
        return Ok(sessions);
    }

    // GET: api/TrainingSessions/microcycle/{microcycleId}
    [HttpGet("microcycle/{microcycleId}")]
    public async Task<ActionResult<IEnumerable<TrainingSessionResponseDto>>> GetByMicrocycleId(int microcycleId)
    {
        var sessions = await _trainingSessionService.GetByMicrocycleIdAsync(microcycleId);
        return Ok(sessions);
    }

    // GET: api/TrainingSessions/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<TrainingSessionResponseDto>> GetById(int id)
    {
        var session = await _trainingSessionService.GetByIdAsync(id);
        if (session == null) return NotFound();
        return Ok(session);
    }

    // POST: api/TrainingSessions
    // IMPORTANTE: Este endpoint identifica automáticamente el microciclo basado en PlanningId + Date
    [HttpPost]
    public async Task<ActionResult<TrainingSessionResponseDto>> Create([FromBody] CreateTrainingSessionDto dto)
    {
        var coachId = _currentUserService.GetUserId();
        var session = await _trainingSessionService.CreateWithAutoMicrocycleDetectionAsync(dto, coachId);
        return CreatedAtAction(nameof(GetById), new { id = session.Id }, session);
    }

    // PUT: api/TrainingSessions/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<TrainingSessionResponseDto>> Update(int id, [FromBody] UpdateTrainingSessionDto dto)
    {
        var coachId = _currentUserService.GetUserId();
        var session = await _trainingSessionService.UpdateAsync(id, dto, coachId);
        return Ok(session);
    }

    // DELETE: api/TrainingSessions/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var coachId = _currentUserService.GetUserId();
        var result = await _trainingSessionService.DeleteAsync(id, coachId);
        if (!result) return NotFound();
        return NoContent();
    }

    // GET: api/TrainingSessions/athlete/{athleteId}
    [HttpGet("athlete/{athleteId}")]
    public async Task<ActionResult<IEnumerable<TrainingSessionResponseDto>>> GetByAthleteId(
        int athleteId, 
        [FromQuery] int? planningId = null)
    {
        var sessions = await _trainingSessionService.GetByAthleteIdAsync(athleteId, planningId);
        return Ok(sessions);
    }
}
```

---

## 6. DTOs Auxiliares

```csharp
public class AssignAthletesDto
{
    public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
}

public class CreateTrainingIntervalDto
{
    // Estructura según cómo se definan los intervalos
    // (depende de la entidad TrainingInterval)
}
```

---

## 7. Notas Importantes sobre la Implementación

### 7.1. Creación Automática de Microciclos

Cuando se crea un mesociclo:
1. Se calcula `EndDate` automáticamente: `StartDate + (WeeksCount * 7) - 1`
2. Se crean `WeeksCount` microciclos automáticamente
3. Cada microciclo tiene:
   - `WeekNumber`: 1, 2, 3, ..., `WeeksCount`
   - `StartDate`: Primera semana = `mesocycle.StartDate`, siguientes semanas = `StartDate + (weekNumber - 1) * 7`
   - `EndDate`: `StartDate + 6 días` (semana completa)
   - `Volume`: 0 inicialmente
   - `PeriodId`: Requerido (se pasa al crear el mesociclo)

### 7.2. Cálculo Automático de Volumen

El volumen de un microciclo se calcula automáticamente:
- **Trigger**: Cuando se crea, actualiza o elimina una sesión de entrenamiento
- **Método**: Suma el volumen de todas las sesiones del microciclo
- **Formato**: Las sesiones pueden tener volumen en formato string (ej: "10.5 km") que se parsea

### 7.3. Identificación Automática de Microciclo

Al crear una sesión de entrenamiento:
1. Se pasa `PlanningId` + `Date`
2. El backend busca el microciclo que contiene esa fecha dentro de la planificación
3. Valida que la fecha esté dentro del rango del microciclo
4. Asigna automáticamente el `MicrocycleId`

### 7.4. Asignación de Atletas

- **Individual**: Se crean relaciones `PlanningAthlete` una por una
- **Desde grupo**: Si se selecciona un grupo, se obtienen todos los atletas activos del grupo y se crean relaciones individuales para cada uno
- **No duplicados**: Se valida que un atleta no esté asignado dos veces a la misma planificación

---

## 8. Resumen de Endpoints

### Plannings
- `GET /api/Plannings` - Obtener todas las planificaciones del coach
- `GET /api/Plannings/{id}` - Obtener planificación por ID
- `POST /api/Plannings` - Crear planificación (sin mesociclos)
- `PUT /api/Plannings/{id}` - Actualizar planificación
- `DELETE /api/Plannings/{id}` - Eliminar planificación
- `POST /api/Plannings/{id}/athletes` - Asignar atletas individuales
- `POST /api/Plannings/{id}/athletes/from-group/{groupId}` - Asignar atletas desde grupo
- `DELETE /api/Plannings/{id}/athletes/{athleteId}` - Eliminar asignación de atleta
- `GET /api/Plannings/athlete/{athleteId}` - Obtener planificaciones de un atleta

### Periods
- `GET /api/Periods/planning/{planningId}` - Obtener períodos de una planificación
- `GET /api/Periods/{id}` - Obtener período por ID
- `POST /api/Periods/planning/{planningId}` - Crear período
- `PUT /api/Periods/{id}` - Actualizar período
- `DELETE /api/Periods/{id}` - Eliminar período

### Mesocycles
- `GET /api/Mesocycles/planning/{planningId}` - Obtener mesociclos de una planificación
- `GET /api/Mesocycles/{id}` - Obtener mesociclo por ID
- `POST /api/Mesocycles/planning/{planningId}/period/{periodId}` - **Crear mesociclo con microciclos automáticos**
- `PUT /api/Mesocycles/{id}` - Actualizar mesociclo
- `DELETE /api/Mesocycles/{id}` - Eliminar mesociclo

### Microcycles
- `GET /api/Microcycles/mesocycle/{mesocycleId}` - Obtener microciclos de un mesociclo
- `GET /api/Microcycles/period/{periodId}` - Obtener microciclos de un período
- `GET /api/Microcycles/{id}` - Obtener microciclo por ID
- `PUT /api/Microcycles/{id}` - Actualizar microciclo
- `POST /api/Microcycles/{id}/recalculate-volume` - Recalcular volumen manualmente
- `DELETE /api/Microcycles/{id}` - Eliminar microciclo

### TrainingSessions
- `GET /api/TrainingSessions/planning/{planningId}` - Obtener sesiones de una planificación
- `GET /api/TrainingSessions/microcycle/{microcycleId}` - Obtener sesiones de un microciclo
- `GET /api/TrainingSessions/{id}` - Obtener sesión por ID
- `POST /api/TrainingSessions` - **Crear sesión (identifica microciclo automáticamente)**
- `PUT /api/TrainingSessions/{id}` - Actualizar sesión
- `DELETE /api/TrainingSessions/{id}` - Eliminar sesión
- `GET /api/TrainingSessions/athlete/{athleteId}` - Obtener sesiones de un atleta

