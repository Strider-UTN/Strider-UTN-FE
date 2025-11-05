// ============================================================================
// INTERFACES Y DTOs FALTANTES
// ============================================================================
// Nota: Estas interfaces y DTOs complementan las clases de repositorios, servicios y controllers

namespace Strider.Application.Interfaces
{
    // ============================================================================
    // REPOSITORY INTERFACES
    // ============================================================================
    
    public interface IPlanningRepository { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IPeriodRepository { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IMesocycleRepository { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IMicrocycleRepository { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IPlanningAthleteRepository { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface ITrainingSessionRepository { /* Ver PLANNING_BACKEND_METHODS.md */ }
    
    // ============================================================================
    // TRAINING SESSION ATHLETE REPOSITORY INTERFACE
    // ============================================================================
    public interface ITrainingSessionAthleteRepository
    {
        Task<TrainingSessionAthlete?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingSessionAthlete>> GetByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingSessionAthlete>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default);
        Task<TrainingSessionAthlete> CreateAsync(TrainingSessionAthlete trainingSessionAthlete, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<bool> DeleteByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default);
        Task<bool> DeleteByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(int trainingSessionId, int athleteId, CancellationToken cancellationToken = default);
        Task<int> CreateMultipleAsync(IEnumerable<TrainingSessionAthlete> trainingSessionAthletes, CancellationToken cancellationToken = default);
    }
    
    // ============================================================================
    // TRAINING INTERVAL REPOSITORY INTERFACE
    // ============================================================================
    public interface ITrainingIntervalRepository
    {
        Task<TrainingInterval?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingInterval>> GetByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingInterval>> GetByTrainingTemplateIdAsync(int templateId, CancellationToken cancellationToken = default);
        Task<TrainingInterval> CreateAsync(TrainingInterval interval, CancellationToken cancellationToken = default);
        Task<int> CreateMultipleAsync(IEnumerable<TrainingInterval> intervals, CancellationToken cancellationToken = default);
        Task<TrainingInterval> UpdateAsync(TrainingInterval interval, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<bool> DeleteByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default);
    }

    // ============================================================================
    // SERVICE INTERFACES
    // ============================================================================
    
    public interface IPlanningService { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IPeriodService { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IMesocycleService { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface IMicrocycleService { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface ITrainingSessionService { /* Ver PLANNING_BACKEND_METHODS.md */ }
    public interface ITrainingGroupService { /* Asumiendo que existe */ }
    public interface ICurrentUserService { /* Para obtener el usuario actual */ }
}

namespace Strider.Application.DTOs
{
    // ============================================================================
    // DTOs COMPLEMENTARIOS
    // ============================================================================
    
    // DTOs de Planning ya definidos en PLANNING_BACKEND_METHODS.md
    
    // DTOs de TrainingInterval
    // NOTA: Los DTOs CreateTrainingIntervalDto y TrainingIntervalResponseDto ya están definidos
    // en el proyecto. No se duplican aquí para evitar conflictos.
    // 
    // CreateTrainingIntervalDto - Ya existe con validaciones
    // TrainingIntervalResponseDto - Ya existe
    //
    // Si necesitas un UpdateTrainingIntervalDto, puedes reutilizar CreateTrainingIntervalDto
    // o crear uno nuevo según tus necesidades.

    // Actualización de CreateTrainingSessionDto para incluir intervalos
    public class CreateTrainingSessionDto
    {
        public int PlanningId { get; set; }
        public string Date { get; set; } = string.Empty; // ISO string
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TrainingCategory Category { get; set; } = TrainingCategory.Training;
        public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
        public IEnumerable<CreateTrainingIntervalDto>? Intervals { get; set; } // NUEVO: Intervalos de la sesión
        public string? Notes { get; set; }
    }

    // Actualización de UpdateTrainingSessionDto
    public class UpdateTrainingSessionDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public TrainingCategory Category { get; set; }
        public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
        public IEnumerable<CreateTrainingIntervalDto>? Intervals { get; set; } // NUEVO: Intervalos de la sesión
        public string? Notes { get; set; }
    }

    // Actualización de TrainingSessionResponseDto para incluir volumen calculado e intervalos
    public class TrainingSessionResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public TrainingCategory Category { get; set; }
        public int PlanningId { get; set; }
        public int MicrocycleId { get; set; }
        public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
        public IEnumerable<TrainingIntervalResponseDto>? Intervals { get; set; } // NUEVO: Intervalos de la sesión
        public string? Notes { get; set; }
        public decimal Volume { get; set; } // NUEVO: Volumen calculado desde intervalos (en km)
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    // DTO auxiliar
    public class AssignAthletesDto
    {
        public IEnumerable<int> AthleteIds { get; set; } = new List<int>();
    }
}

// ============================================================================
// NOTA IMPORTANTE SOBRE VOLUMEN
// ============================================================================
//
// RECOMENDACIÓN: NO agregar el campo Volume a TrainingSession
//
// Razones:
// 1. **Precisión**: El volumen se calcula desde los intervalos (Distance * Repetitions)
//    lo que garantiza que siempre esté sincronizado con los datos reales
// 2. **Consistencia**: Evita que el volumen se desincronice si se modifican los intervalos
// 3. **Simplicidad**: No requiere mantener un campo adicional actualizado
// 4. **Flexibilidad**: Permite calcular el volumen de diferentes formas si es necesario
//
// Cálculo del volumen:
// - Volumen de una sesión = Suma de (Distance * Repetitions) de todos los intervalos ÷ 1000 (metros a km)
// - Volumen de un microciclo = Suma de los volúmenes de todas sus sesiones
//
// Implementación:
// - El volumen se calcula dinámicamente en el método MapToTrainingSessionResponseDto
// - El volumen del microciclo se recalcula automáticamente cuando se crea/actualiza/elimina una sesión
// - Se puede agregar un método RecalculateSessionVolumeAsync si se necesita calcularlo por separado

