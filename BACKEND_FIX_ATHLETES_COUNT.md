# Fix: athletesCount muestra 0 en GET después de crear planificación

## Problema

Cuando se crea una planificación con atletas asignados:
- ✅ La respuesta inmediata de `Create` muestra `athletesCount: 1` (correcto)
- ❌ Pero cuando se hace `GET /api/Planning`, muestra `athletesCount: 0` (incorrecto)

## Causa

El problema está en el repositorio `PlanningRepository`. Los métodos `GetByCoachIdAsync`, `GetAllAsync`, y `GetByIdAsync` **no incluyen** la relación `PlanningAthletes` en la consulta.

Cuando `MapToPlanningResponseDto` intenta acceder a `planning.PlanningAthletes?.Count`, la colección es `null` porque no se cargó desde la base de datos, resultando en `athletesCount = 0`.

## Solución

Agregar los `Include` necesarios en los métodos del repositorio:

### Antes (incorrecto):
```csharp
public async Task<IEnumerable<Planning>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default)
{
    return await _context.Plannings
        .Include(p => p.Coach)
        .Where(p => p.CoachId == coachId)
        .ToListAsync(cancellationToken);
}
```

### Después (correcto):
```csharp
public async Task<IEnumerable<Planning>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default)
{
    return await _context.Plannings
        .Include(p => p.Coach)
        .Include(p => p.PlanningAthletes) // ✅ Incluir para contar atletas
        .Include(p => p.Mesocycles)       // ✅ Incluir para contar mesociclos
        .Include(p => p.Periods)           // ✅ Incluir para contar períodos
        .Where(p => p.CoachId == coachId)
        .ToListAsync(cancellationToken);
}
```

## Métodos que necesitan actualización

1. ✅ `GetByIdAsync` - Agregar includes
2. ✅ `GetAllAsync` - Agregar includes
3. ✅ `GetByCoachIdAsync` - Agregar includes
4. ✅ `GetActivePlanningsAsync` - Agregar includes

**Nota:** `GetByIdWithDetailsAsync` ya tiene los includes correctos, no necesita cambios.

## Cambios aplicados

Los cambios ya están aplicados en `PLANNING_REPOSITORIES.cs`. Ahora todas las consultas incluyen las relaciones necesarias para calcular correctamente:
- `AthletesCount` (desde `PlanningAthletes`)
- `MesocyclesCount` (desde `Mesocycles`)
- `PeriodsCount` (desde `Periods`)

