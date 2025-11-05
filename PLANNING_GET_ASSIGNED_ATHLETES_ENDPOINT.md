# Endpoint: Obtener Atletas Asignados a una Planificación

## 1. Repository (PlanningAthleteRepository)

El método `GetByPlanningIdAsync` ya existe en `PlanningAthleteRepository`:

```csharp
public async Task<IEnumerable<PlanningAthlete>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
{
    return await _context.PlanningAthletes
        .Include(pa => pa.Athlete)
        .Where(pa => pa.PlanningId == planningId)
        .ToListAsync(cancellationToken);
}
```

## 2. Service Interface (IPlanningService)

Agregar el método a la interfaz:

```csharp
/// <summary>
/// Obtiene los atletas asignados a una planificación
/// </summary>
Task<IEnumerable<PlanningAthleteResponseDto>> GetAssignedAthletesAsync(int planningId, int coachId, CancellationToken cancellationToken = default);
```

## 3. Service Implementation (PlanningService)

Agregar el método al servicio:

```csharp
public async Task<IEnumerable<PlanningAthleteResponseDto>> GetAssignedAthletesAsync(int planningId, int coachId, CancellationToken cancellationToken = default)
{
    // Validar que el coach tenga acceso a esta planificación
    var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
    if (planning == null)
        throw new NotFoundException("Planificación no encontrada");

    if (planning.CoachId != coachId)
        throw new UnauthorizedException("No tienes permisos para ver los atletas de esta planificación");

    // Obtener los atletas asignados
    var planningAthletes = await _planningAthleteRepository.GetByPlanningIdAsync(planningId, cancellationToken);

    // Mapear a DTOs
    return planningAthletes.Select(pa => new PlanningAthleteResponseDto
    {
        Id = pa.Id,
        AthleteId = pa.AthleteId,
        AthleteName = pa.Athlete?.Name ?? string.Empty,
        AthleteEmail = pa.Athlete?.Email ?? string.Empty,
        PlanningId = pa.PlanningId,
        AssignedAt = pa.CreatedAt
    });
}
```

## 4. DTO (PlanningAthleteResponseDto)

Crear el DTO en el archivo de DTOs:

```csharp
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

## 5. Controller (PlanningController)

Agregar el endpoint al controller:

```csharp
// GET: api/Planning/{id}/athletes
[HttpGet("{id}/athletes")]
public async Task<ActionResult<IEnumerable<PlanningAthleteResponseDto>>> GetAssignedAthletes(int id, CancellationToken cancellationToken)
{
    var coachId = _jwtService.GetCurrentUserId();
    if (!coachId.HasValue) return Unauthorized();
    
    var athletes = await _planningService.GetAssignedAthletesAsync(id, coachId.Value, cancellationToken);
    return Ok(athletes);
}
```

## 6. Frontend Service (planningService.ts)

Agregar el método al servicio del frontend:

```typescript
/**
 * Obtiene los atletas asignados a una planificación
 */
static async getAssignedAthletes(planningId: number): Promise<PlanningAthleteResponseDto[]> {
  try {
    const { data } = await apiClient.get<PlanningAthleteResponseDto[]>(`/api/Planning/${planningId}/athletes`);
    return data;
  } catch (error) {
    console.error('Error al obtener atletas asignados:', error);
    throw error;
  }
}
```

## 7. Frontend Type (planningTypes.ts)

Agregar el tipo:

```typescript
export interface PlanningAthleteResponseDto {
  id: number; // ID de PlanningAthlete
  athleteId: number;
  athleteName: string;
  athleteEmail: string;
  planningId: number;
  assignedAt: string;
}
```

