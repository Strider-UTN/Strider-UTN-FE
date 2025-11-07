// Ejemplo de uso en TrainingSessionService:

// Ya no necesitas parsear manualmente, el DTO ya tiene DateTime
// Pero asegúrate de que tenga Kind=UTC antes de usarlo:

public async Task<TrainingSessionResponseDto> CreateWithAutoMicrocycleDetectionAsync(
    CreateTrainingSessionDto dto, 
    int coachId, 
    CancellationToken cancellationToken)
{
    // Asegurar que la fecha tenga Kind=UTC
    var sessionDate = dto.Date.Kind == DateTimeKind.Utc 
        ? dto.Date 
        : DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
    
    // O usar un helper method:
    // var sessionDate = ToUtcDate(dto.Date);
    
    var microcycle = await microcycleRepository.GetByPlanningIdAndDateAsync(
        dto.PlanningId, sessionDate, cancellationToken);
    
    // ... resto del código ...
}

// Helper method opcional (más robusto):
private static DateTime ToUtcDate(DateTime date)
{
    if (date.Kind == DateTimeKind.Utc)
        return date;
    
    if (date.Kind == DateTimeKind.Local)
        return date.ToUniversalTime();
    
    // Si es Unspecified, asumir que es UTC
    return DateTime.SpecifyKind(date, DateTimeKind.Utc);
}

