// ============================================================================
// TRAINING SESSION ATHLETE REPOSITORY
// ============================================================================
// Repository para gestionar la relación muchos-a-muchos entre TrainingSession y Athletes

using Microsoft.EntityFrameworkCore;

namespace Strider.Application.Repositories
{
    // ============================================================================
    // INTERFACE
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
    // IMPLEMENTATION
    // ============================================================================
    public class TrainingSessionAthleteRepository : ITrainingSessionAthleteRepository
    {
        private readonly ApplicationDbContext _context;

        public TrainingSessionAthleteRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TrainingSessionAthlete?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessionAthletes
                .Include(tsa => tsa.TrainingSession)
                .Include(tsa => tsa.Athlete)
                .FirstOrDefaultAsync(tsa => tsa.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<TrainingSessionAthlete>> GetByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessionAthletes
                .Include(tsa => tsa.Athlete)
                .Where(tsa => tsa.TrainingSessionId == trainingSessionId)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<TrainingSessionAthlete>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessionAthletes
                .Include(tsa => tsa.TrainingSession)
                    .ThenInclude(ts => ts.Microcycle)
                .Include(tsa => tsa.TrainingSession)
                    .ThenInclude(ts => ts.Planning)
                .Where(tsa => tsa.AthleteId == athleteId)
                .ToListAsync(cancellationToken);
        }

        public async Task<TrainingSessionAthlete> CreateAsync(TrainingSessionAthlete trainingSessionAthlete, CancellationToken cancellationToken = default)
        {
            trainingSessionAthlete.AssignedAt = DateTime.UtcNow;
            _context.TrainingSessionAthletes.Add(trainingSessionAthlete);
            await _context.SaveChangesAsync(cancellationToken);
            return trainingSessionAthlete;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var trainingSessionAthlete = await GetByIdAsync(id, cancellationToken);
            if (trainingSessionAthlete == null) return false;

            _context.TrainingSessionAthletes.Remove(trainingSessionAthlete);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> DeleteByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default)
        {
            var trainingSessionAthletes = await GetByTrainingSessionIdAsync(trainingSessionId, cancellationToken);
            _context.TrainingSessionAthletes.RemoveRange(trainingSessionAthletes);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> DeleteByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default)
        {
            var trainingSessionAthletes = await GetByAthleteIdAsync(athleteId, cancellationToken);
            _context.TrainingSessionAthletes.RemoveRange(trainingSessionAthletes);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int trainingSessionId, int athleteId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessionAthletes
                .AnyAsync(tsa => tsa.TrainingSessionId == trainingSessionId && tsa.AthleteId == athleteId, cancellationToken);
        }

        public async Task<int> CreateMultipleAsync(IEnumerable<TrainingSessionAthlete> trainingSessionAthletes, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            foreach (var tsa in trainingSessionAthletes)
            {
                tsa.AssignedAt = now;
            }

            _context.TrainingSessionAthletes.AddRange(trainingSessionAthletes);
            await _context.SaveChangesAsync(cancellationToken);
            return trainingSessionAthletes.Count();
        }
    }
}

// ============================================================================
// NOTA SOBRE LA ENTIDAD TrainingSessionAthlete
// ============================================================================
//
// Esta entidad representa la relación muchos-a-muchos entre TrainingSession y Athletes.
// La estructura real incluye:
//
// - Id: Identificador único
// - TrainingSessionId: Relación con TrainingSession
// - AthleteId: Relación con User (atleta)
// - Status: Estado de la sesión para este atleta (Pending, Completed, etc.)
// - CompletedAt: Fecha de completación
// - ActualDistance, ActualDuration, ActualAvgPace, ActualAvgHR, ActualMaxHR: 
//   Datos reales del entrenamiento cuando el atleta completa la sesión
// - AssignedAt: Fecha de asignación (equivalente a CreatedAt)
//
// Asegúrate de tener esta entidad definida en tu ApplicationDbContext como:
// public DbSet<TrainingSessionAthlete> TrainingSessionAthletes { get; set; }

