// ============================================================================
// REPOSITORY IMPLEMENTATIONS
// ============================================================================
// Nota: Estas implementaciones asumen que tienes ApplicationDbContext configurado
// y que las entidades están correctamente mapeadas.

using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Strider.Application.Repositories
{
    // ============================================================================
    // 1. PLANNING REPOSITORY
    // ============================================================================
    public class PlanningRepository : IPlanningRepository
    {
        private readonly ApplicationDbContext _context;

        public PlanningRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Planning?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Plannings
                .Include(p => p.Coach)
                .Include(p => p.PlanningAthletes) // ✅ Incluir para contar atletas
                .Include(p => p.Mesocycles) // ✅ Incluir para contar mesociclos
                .Include(p => p.Periods) // ✅ Incluir para contar períodos
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Planning>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Plannings
                .Include(p => p.Coach)
                .Include(p => p.PlanningAthletes) // ✅ Incluir para contar atletas
                .Include(p => p.Mesocycles) // ✅ Incluir para contar mesociclos
                .Include(p => p.Periods) // ✅ Incluir para contar períodos
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Planning>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default)
        {
            return await _context.Plannings
                .Include(p => p.Coach)
                .Include(p => p.PlanningAthletes) // ✅ Incluir para contar atletas
                .Include(p => p.Mesocycles) // ✅ Incluir para contar mesociclos
                .Include(p => p.Periods) // ✅ Incluir para contar períodos
                .Where(p => p.CoachId == coachId)
                .ToListAsync(cancellationToken);
        }

        public async Task<Planning> CreateAsync(Planning planning, CancellationToken cancellationToken = default)
        {
            planning.CreatedAt = DateTime.UtcNow;
            planning.UpdatedAt = DateTime.UtcNow;
            _context.Plannings.Add(planning);
            await _context.SaveChangesAsync(cancellationToken);
            return planning;
        }

        public async Task<Planning> UpdateAsync(Planning planning, CancellationToken cancellationToken = default)
        {
            planning.UpdatedAt = DateTime.UtcNow;
            _context.Plannings.Update(planning);
            await _context.SaveChangesAsync(cancellationToken);
            return planning;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var planning = await GetByIdAsync(id, cancellationToken);
            if (planning == null) return false;

            _context.Plannings.Remove(planning);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Plannings.AnyAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Planning>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default)
        {
            return await _context.Plannings
                .Include(p => p.Coach)
                .Include(p => p.PlanningAthletes)
                .Where(p => p.PlanningAthletes.Any(pa => pa.AthleteId == athleteId))
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Planning>> GetActivePlanningsAsync(int coachId, CancellationToken cancellationToken = default)
        {
            return await _context.Plannings
                .Include(p => p.Coach)
                .Include(p => p.PlanningAthletes) // ✅ Incluir para contar atletas
                .Include(p => p.Mesocycles) // ✅ Incluir para contar mesociclos
                .Include(p => p.Periods) // ✅ Incluir para contar períodos
                .Where(p => p.CoachId == coachId && p.Status == PlanningStatus.Active)
                .ToListAsync(cancellationToken);
        }

        public async Task<Planning?> GetByIdWithDetailsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Plannings
                .Include(p => p.Coach)
                .Include(p => p.PlanningAthletes)
                    .ThenInclude(pa => pa.Athlete)
                .Include(p => p.Mesocycles)
                .Include(p => p.Periods)
                .Include(p => p.TrainingSessions)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }
    }

    // ============================================================================
    // 2. PERIOD REPOSITORY
    // ============================================================================
    public class PeriodRepository : IPeriodRepository
    {
        private readonly ApplicationDbContext _context;

        public PeriodRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Period?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Periods
                .Include(p => p.Planning)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Period>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Periods
                .Include(p => p.Planning)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Period>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.Periods
                .Include(p => p.Planning)
                .Where(p => p.PlanningId == planningId)
                .ToListAsync(cancellationToken);
        }

        public async Task<Period> CreateAsync(Period period, CancellationToken cancellationToken = default)
        {
            period.CreatedAt = DateTime.UtcNow;
            period.UpdatedAt = DateTime.UtcNow;
            _context.Periods.Add(period);
            await _context.SaveChangesAsync(cancellationToken);
            return period;
        }

        public async Task<Period> UpdateAsync(Period period, CancellationToken cancellationToken = default)
        {
            period.UpdatedAt = DateTime.UtcNow;
            _context.Periods.Update(period);
            await _context.SaveChangesAsync(cancellationToken);
            return period;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var period = await GetByIdAsync(id, cancellationToken);
            if (period == null) return false;

            _context.Periods.Remove(period);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Periods.AnyAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Period>> GetPeriodsWithMesocyclesAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.Periods
                .Include(p => p.Mesocycles)
                .Where(p => p.PlanningId == planningId)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Period>> GetPeriodsWithMicrocyclesAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.Periods
                .Include(p => p.Microcycles)
                .Where(p => p.PlanningId == planningId)
                .ToListAsync(cancellationToken);
        }
    }

    // ============================================================================
    // 3. MESOCYCLE REPOSITORY
    // ============================================================================
    public class MesocycleRepository : IMesocycleRepository
    {
        private readonly ApplicationDbContext _context;

        public MesocycleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Mesocycle?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles
                .Include(m => m.Planning)
                .Include(m => m.Period)
                .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Mesocycle>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles
                .Include(m => m.Planning)
                .Include(m => m.Period)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Mesocycle>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles
                .Include(m => m.Planning)
                .Include(m => m.Period)
                .Where(m => m.PlanningId == planningId)
                .ToListAsync(cancellationToken);
        }

        public async Task<Mesocycle> CreateAsync(Mesocycle mesocycle, CancellationToken cancellationToken = default)
        {
            mesocycle.CreatedAt = DateTime.UtcNow;
            mesocycle.UpdatedAt = DateTime.UtcNow;
            _context.Mesocycles.Add(mesocycle);
            await _context.SaveChangesAsync(cancellationToken);
            return mesocycle;
        }

        public async Task<Mesocycle> UpdateAsync(Mesocycle mesocycle, CancellationToken cancellationToken = default)
        {
            mesocycle.UpdatedAt = DateTime.UtcNow;
            _context.Mesocycles.Update(mesocycle);
            await _context.SaveChangesAsync(cancellationToken);
            return mesocycle;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var mesocycle = await GetByIdAsync(id, cancellationToken);
            if (mesocycle == null) return false;

            _context.Mesocycles.Remove(mesocycle);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles.AnyAsync(m => m.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Mesocycle>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles
                .Include(m => m.Planning)
                .Include(m => m.Period)
                .Where(m => m.PeriodId == periodId)
                .ToListAsync(cancellationToken);
        }

        public async Task<Mesocycle?> GetByIdWithMicrocyclesAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles
                .Include(m => m.Microcycles)
                .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Mesocycle>> GetByPlanningIdWithMicrocyclesAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.Mesocycles
                .Include(m => m.Microcycles)
                .Where(m => m.PlanningId == planningId)
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> HasOverlappingDatesAsync(int planningId, DateTime startDate, DateTime endDate, int? excludeMesocycleId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Mesocycles
                .Where(m => m.PlanningId == planningId &&
                    ((m.StartDate <= startDate && m.EndDate >= startDate) ||
                     (m.StartDate <= endDate && m.EndDate >= endDate) ||
                     (m.StartDate >= startDate && m.EndDate <= endDate)));

            if (excludeMesocycleId.HasValue)
            {
                query = query.Where(m => m.Id != excludeMesocycleId.Value);
            }

            return await query.AnyAsync(cancellationToken);
        }
    }

    // ============================================================================
    // 4. MICROCYCLE REPOSITORY
    // ============================================================================
    public class MicrocycleRepository : IMicrocycleRepository
    {
        private readonly ApplicationDbContext _context;

        public MicrocycleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Microcycle?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles
                .Include(m => m.Mesocycle)
                .Include(m => m.Period)
                .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Microcycle>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles
                .Include(m => m.Mesocycle)
                .Include(m => m.Period)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Microcycle>> GetByMesocycleIdAsync(int mesocycleId, CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles
                .Include(m => m.Mesocycle)
                .Include(m => m.Period)
                .Where(m => m.MesocycleId == mesocycleId)
                .OrderBy(m => m.WeekNumber)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Microcycle>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles
                .Include(m => m.Mesocycle)
                .Include(m => m.Period)
                .Where(m => m.PeriodId == periodId)
                .OrderBy(m => m.StartDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<Microcycle> CreateAsync(Microcycle microcycle, CancellationToken cancellationToken = default)
        {
            microcycle.CreatedAt = DateTime.UtcNow;
            microcycle.UpdatedAt = DateTime.UtcNow;
            _context.Microcycles.Add(microcycle);
            await _context.SaveChangesAsync(cancellationToken);
            return microcycle;
        }

        public async Task<Microcycle> UpdateAsync(Microcycle microcycle, CancellationToken cancellationToken = default)
        {
            microcycle.UpdatedAt = DateTime.UtcNow;
            _context.Microcycles.Update(microcycle);
            await _context.SaveChangesAsync(cancellationToken);
            return microcycle;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var microcycle = await GetByIdAsync(id, cancellationToken);
            if (microcycle == null) return false;

            _context.Microcycles.Remove(microcycle);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles.AnyAsync(m => m.Id == id, cancellationToken);
        }

        public async Task<Microcycle?> GetByPlanningIdAndDateAsync(int planningId, DateTime date, CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles
                .Include(m => m.Mesocycle)
                    .ThenInclude(me => me.Planning)
                .Where(m => m.Mesocycle.PlanningId == planningId &&
                    m.StartDate <= date && m.EndDate >= date)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<IEnumerable<Microcycle>> GetByPeriodIdWithSessionsAsync(int periodId, CancellationToken cancellationToken = default)
        {
            return await _context.Microcycles
                .Include(m => m.TrainingSessions)
                .Where(m => m.PeriodId == periodId)
                .ToListAsync(cancellationToken);
        }

        public async Task<decimal> CalculateTotalVolumeAsync(int microcycleId, CancellationToken cancellationToken = default)
        {
            // Obtener todas las sesiones del microciclo con sus intervalos
            var sessions = await _context.TrainingSessions
                .Include(s => s.Intervals)
                .Where(s => s.MicrocycleId == microcycleId)
                .ToListAsync(cancellationToken);

            decimal totalVolumeKm = 0;
            
            foreach (var session in sessions)
            {
                // Calcular volumen de la sesión sumando las distancias de los intervalos
                decimal sessionVolumeMeters = 0;
                foreach (var interval in session.Intervals)
                {
                    // Distancia total = distancia del intervalo * repeticiones
                    sessionVolumeMeters += interval.Distance * interval.Repetitions;
                }

                // Convertir de metros a kilómetros y sumar
                totalVolumeKm += sessionVolumeMeters / 1000m;
            }

            return totalVolumeKm;
        }

        public async Task<bool> UpdateVolumeAsync(int microcycleId, decimal volume, CancellationToken cancellationToken = default)
        {
            var microcycle = await GetByIdAsync(microcycleId, cancellationToken);
            if (microcycle == null) return false;

            microcycle.Volume = volume;
            await UpdateAsync(microcycle, cancellationToken);
            return true;
        }
    }

    // ============================================================================
    // 5. PLANNING ATHLETE REPOSITORY
    // ============================================================================
    public class PlanningAthleteRepository : IPlanningAthleteRepository
    {
        private readonly ApplicationDbContext _context;

        public PlanningAthleteRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PlanningAthlete?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.PlanningAthletes
                .Include(pa => pa.Planning)
                .Include(pa => pa.Athlete)
                .FirstOrDefaultAsync(pa => pa.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<PlanningAthlete>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.PlanningAthletes
                .Include(pa => pa.Athlete)
                .Where(pa => pa.PlanningId == planningId)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<PlanningAthlete>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default)
        {
            return await _context.PlanningAthletes
                .Include(pa => pa.Planning)
                .Where(pa => pa.AthleteId == athleteId)
                .ToListAsync(cancellationToken);
        }

        public async Task<PlanningAthlete> CreateAsync(PlanningAthlete planningAthlete, CancellationToken cancellationToken = default)
        {
            planningAthlete.CreatedAt = DateTime.UtcNow;
            _context.PlanningAthletes.Add(planningAthlete);
            await _context.SaveChangesAsync(cancellationToken);
            return planningAthlete;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var planningAthlete = await GetByIdAsync(id, cancellationToken);
            if (planningAthlete == null) return false;

            _context.PlanningAthletes.Remove(planningAthlete);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int planningId, int athleteId, CancellationToken cancellationToken = default)
        {
            return await _context.PlanningAthletes
                .AnyAsync(pa => pa.PlanningId == planningId && pa.AthleteId == athleteId, cancellationToken);
        }

        public async Task<int> CreateMultipleAsync(IEnumerable<PlanningAthlete> planningAthletes, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            foreach (var pa in planningAthletes)
            {
                pa.CreatedAt = now;
            }

            _context.PlanningAthletes.AddRange(planningAthletes);
            await _context.SaveChangesAsync(cancellationToken);
            return planningAthletes.Count();
        }

        public async Task<bool> DeleteByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            var planningAthletes = await GetByPlanningIdAsync(planningId, cancellationToken);
            _context.PlanningAthletes.RemoveRange(planningAthletes);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> DeleteByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default)
        {
            var planningAthletes = await GetByAthleteIdAsync(athleteId, cancellationToken);
            _context.PlanningAthletes.RemoveRange(planningAthletes);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }

    // ============================================================================
    // 6. TRAINING SESSION REPOSITORY
    // ============================================================================
    public class TrainingSessionRepository : ITrainingSessionRepository
    {
        private readonly ApplicationDbContext _context;

        public TrainingSessionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TrainingSession?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions
                .Include(s => s.Planning)
                .Include(s => s.Microcycle)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<TrainingSession>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions
                .Include(s => s.Planning)
                .Include(s => s.Microcycle)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<TrainingSession>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions
                .Include(s => s.Microcycle)
                .Where(s => s.PlanningId == planningId)
                .OrderBy(s => s.Date)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<TrainingSession>> GetByMicrocycleIdAsync(int microcycleId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions
                .Include(s => s.Intervals)
                .Where(s => s.MicrocycleId == microcycleId)
                .OrderBy(s => s.Date)
                .ToListAsync(cancellationToken);
        }

        public async Task<TrainingSession> CreateAsync(TrainingSession trainingSession, CancellationToken cancellationToken = default)
        {
            trainingSession.CreatedAt = DateTime.UtcNow;
            trainingSession.UpdatedAt = DateTime.UtcNow;
            _context.TrainingSessions.Add(trainingSession);
            await _context.SaveChangesAsync(cancellationToken);
            return trainingSession;
        }

        public async Task<TrainingSession> UpdateAsync(TrainingSession trainingSession, CancellationToken cancellationToken = default)
        {
            trainingSession.UpdatedAt = DateTime.UtcNow;
            _context.TrainingSessions.Update(trainingSession);
            await _context.SaveChangesAsync(cancellationToken);
            return trainingSession;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var trainingSession = await GetByIdAsync(id, cancellationToken);
            if (trainingSession == null) return false;

            _context.TrainingSessions.Remove(trainingSession);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions.AnyAsync(s => s.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<TrainingSession>> GetByDateRangeAsync(int planningId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions
                .Include(s => s.Microcycle)
                .Where(s => s.PlanningId == planningId &&
                    s.Date >= startDate && s.Date <= endDate)
                .OrderBy(s => s.Date)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<TrainingSession>> GetByDateAsync(int planningId, DateTime date, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingSessions
                .Include(s => s.Microcycle)
                .Where(s => s.PlanningId == planningId && s.Date.Date == date.Date)
                .ToListAsync(cancellationToken);
        }

        public async Task<TrainingSession?> GetByIdWithAthletesAsync(int id, CancellationToken cancellationToken = default)
        {
            var session = await _context.TrainingSessions
                .Include(s => s.Athletes)
                    .ThenInclude(a => a.Athlete)
                .Include(s => s.Intervals)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            // Ordenar intervalos por OrderIndex después de cargarlos
            if (session?.Intervals != null)
            {
                session.Intervals = session.Intervals.OrderBy(i => i.OrderIndex).ToList();
            }

            return session;
        }

        public async Task<IEnumerable<TrainingSession>> GetByAthleteIdAsync(int athleteId, int? planningId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.TrainingSessions
                .Include(s => s.Planning)
                .Include(s => s.Microcycle)
                .Include(s => s.Athletes)
                .Include(s => s.Intervals)
                .Where(s => s.Athletes.Any(a => a.AthleteId == athleteId));

            if (planningId.HasValue)
            {
                query = query.Where(s => s.PlanningId == planningId.Value);
            }

            return await query
                .OrderBy(s => s.Date)
                .ToListAsync(cancellationToken);
        }
    }

    // ============================================================================
    // 7. TRAINING SESSION ATHLETE REPOSITORY
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

