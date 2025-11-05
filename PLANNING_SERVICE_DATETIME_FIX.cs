// ============================================================================
// SOLUCIÓN PARA ERROR DE DATETIME CON POSTGRESQL
// ============================================================================
// Este archivo muestra cómo corregir el problema de DateTime con Kind=Unspecified
// en PlanningService y otros servicios relacionados.

// ============================================================================
// MÉTODOS HELPER PARA CONVERTIR FECHAS A UTC (MANTIENE LA FECHA SELECCIONADA)
// ============================================================================
// Agregar estos métodos helper al PlanningService:

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

// ============================================================================
// CORRECCIÓN EN PlanningService.CreateAsync
// ============================================================================

public async Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
{
    var planning = new Planning
    {
        Name = dto.Name,
        Description = dto.Description,
        StartDate = ToUtcDate(dto.StartDate), // ✅ Mantiene la fecha seleccionada, como UTC medianoche
        EndDate = ToUtcDate(dto.EndDate), // ✅ Mantiene la fecha seleccionada, como UTC medianoche
        Status = dto.Status,
        CoachId = coachId
    };

    var createdPlanning = await _planningRepository.CreateAsync(planning, cancellationToken);

    // ... resto del código sin cambios
}

// ============================================================================
// CORRECCIÓN EN PlanningService.UpdateAsync
// ============================================================================

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
    planning.EndDate = ToUtcDate(dto.EndDate); // ✅ Mantiene la fecha seleccionada
    planning.Status = dto.Status;

    var updatedPlanning = await _planningRepository.UpdateAsync(planning, cancellationToken);
    return MapToPlanningResponseDto(updatedPlanning);
}

// ============================================================================
// CORRECCIÓN EN MesocycleService.CreateWithAutoMicrocyclesAsync
// ============================================================================

public async Task<MesocycleResponseDto> CreateWithAutoMicrocyclesAsync(
    CreateMesocycleDto dto, 
    int planningId, 
    int periodId, 
    int coachId, 
    CancellationToken cancellationToken = default)
{
    // ... validaciones existentes ...

    var endDate = ToUtc(dto.StartDate.AddDays((dto.WeeksCount * 7) - 1)); // ✅ Convertir a UTC

    var mesocycle = new Mesocycle
    {
        Name = dto.Name,
        PlanningId = planningId,
        PeriodId = periodId,
        StartDate = ToUtc(dto.StartDate), // ✅ Convertir a UTC
        EndDate = endDate, // ✅ Ya convertido arriba
        WeeksCount = dto.WeeksCount,
        // ... resto
    };

    // Al crear microciclos:
    var currentDate = ToUtcDate(dto.StartDate); // ✅ Mantiene la fecha

    for (int week = 1; week <= dto.WeeksCount; week++)
    {
        var weekStartDate = ToUtcDate(currentDate); // ✅ Mantiene la fecha
        var weekEndDate = ToUtcDate(currentDate.AddDays(6)); // ✅ Mantiene la fecha

        var microcycle = new Microcycle
        {
            MesocycleId = mesocycle.Id,
            PeriodId = periodId,
            WeekNumber = week,
            StartDate = weekStartDate, // ✅ Ya en UTC
            EndDate = weekEndDate, // ✅ Ya en UTC
            // ... resto
        };
        
        currentDate = currentDate.AddDays(7);
    }
}

// ============================================================================
// CORRECCIÓN EN TrainingSessionService.CreateWithAutoMicrocycleDetectionAsync
// ============================================================================

public async Task<TrainingSessionResponseDto> CreateWithAutoMicrocycleDetectionAsync(
    CreateTrainingSessionDto dto, 
    int coachId, 
    CancellationToken cancellationToken = default)
{
    // Parsear la fecha y convertir a UTC medianoche (mantiene la fecha seleccionada)
    var sessionDate = ToUtcDate(DateTime.Parse(dto.Date)); // ✅ Mantiene la fecha seleccionada

    var microcycle = await _microcycleRepository.GetByPlanningIdAndDateAsync(
        dto.PlanningId, sessionDate, cancellationToken);

    // ... resto del código sin cambios
}

// ============================================================================
// NOTA: Si el DTO recibe strings desde el frontend
// ============================================================================
// Si CreatePlanningDto tiene StartDate y EndDate como string, entonces:

public async Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
{
    // Parsear strings y convertir a UTC medianoche (mantiene la fecha seleccionada)
    var startDate = ToUtcDate(DateTime.Parse(dto.StartDate));
    var endDate = string.IsNullOrEmpty(dto.EndDate) 
        ? null 
        : (DateTime?)ToUtcDate(DateTime.Parse(dto.EndDate));

    var planning = new Planning
    {
        Name = dto.Name,
        Description = dto.Description,
        StartDate = startDate,
        EndDate = endDate,
        Status = dto.Status,
        CoachId = coachId
    };
    // ... resto del código
}

