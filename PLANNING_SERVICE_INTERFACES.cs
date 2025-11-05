// ============================================================================
// SERVICE INTERFACES - ACTUALIZADAS CON GetByAthleteIdAsync
// ============================================================================
// Nota: Estas interfaces deben estar definidas en tu proyecto backend
// Agrega estos métodos a las interfaces existentes

namespace Strider.Application.Interfaces
{
    // ============================================================================
    // 1. IPlanningService
    // ============================================================================
    public interface IPlanningService
    {
        // CRUD básico
        Task<PlanningResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<PlanningResponseDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<IEnumerable<PlanningResponseDto>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default);
        Task<IEnumerable<PlanningResponseDto>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default); // NUEVO
        Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default);
        Task<PlanningResponseDto> UpdateAsync(int id, UpdatePlanningDto dto, int coachId, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

        // Asignación de atletas
        Task<bool> AssignAthletesAsync(int planningId, IEnumerable<int> athleteIds, int coachId, CancellationToken cancellationToken = default);
        Task<bool> RemoveAthleteAsync(int planningId, int athleteId, int coachId, CancellationToken cancellationToken = default);
        Task<bool> AssignAthletesFromGroupAsync(int planningId, int groupId, int coachId, CancellationToken cancellationToken = default);

        // Validaciones
        Task<bool> ValidatePlanningAccessAsync(int planningId, int coachId, CancellationToken cancellationToken = default);
        Task<bool> ValidatePlanningExistsAsync(int planningId, CancellationToken cancellationToken = default);
    }

    // ============================================================================
    // 2. ITrainingSessionService
    // ============================================================================
    public interface ITrainingSessionService
    {
        // CRUD básico
        Task<TrainingSessionResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingSessionResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingSessionResponseDto>> GetByMicrocycleIdAsync(int microcycleId, CancellationToken cancellationToken = default);
        Task<IEnumerable<TrainingSessionResponseDto>> GetByAthleteIdAsync(int athleteId, int? planningId = null, CancellationToken cancellationToken = default); // NUEVO
        Task<TrainingSessionResponseDto> CreateAsync(CreateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default);
        Task<TrainingSessionResponseDto> UpdateAsync(int id, UpdateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default);

        // Funcionalidad especial: Identificación automática de microciclo
        Task<TrainingSessionResponseDto> CreateWithAutoMicrocycleDetectionAsync(CreateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default);

        // Validaciones
        Task<bool> ValidateSessionAccessAsync(int sessionId, int coachId, CancellationToken cancellationToken = default);
        Task<bool> ValidateDateInMicrocycleRangeAsync(int microcycleId, DateTime date, CancellationToken cancellationToken = default);
    }
}

