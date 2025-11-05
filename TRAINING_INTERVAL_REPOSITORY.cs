// ============================================================================
// TRAINING INTERVAL REPOSITORY IMPLEMENTATION
// ============================================================================
// Nota: Esta implementación asume que tienes ApplicationDbContext configurado
// y que la entidad TrainingInterval está correctamente mapeada.

using Microsoft.EntityFrameworkCore;

namespace Strider.Application.Repositories
{
    // ============================================================================
    // TRAINING INTERVAL REPOSITORY
    // ============================================================================
    public class TrainingIntervalRepository : ITrainingIntervalRepository
    {
        private readonly ApplicationDbContext _context;

        public TrainingIntervalRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TrainingInterval?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingIntervals
                .Include(i => i.TrainingSession)
                .Include(i => i.TrainingTemplate)
                .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<TrainingInterval>> GetByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingIntervals
                .Where(i => i.TrainingSessionId == trainingSessionId)
                .OrderBy(i => i.OrderIndex)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<TrainingInterval>> GetByTrainingTemplateIdAsync(int templateId, CancellationToken cancellationToken = default)
        {
            return await _context.TrainingIntervals
                .Where(i => i.TrainingTemplateId == templateId)
                .OrderBy(i => i.OrderIndex)
                .ToListAsync(cancellationToken);
        }

        public async Task<TrainingInterval> CreateAsync(TrainingInterval interval, CancellationToken cancellationToken = default)
        {
            interval.CreatedAt = DateTime.UtcNow;
            _context.TrainingIntervals.Add(interval);
            await _context.SaveChangesAsync(cancellationToken);
            return interval;
        }

        public async Task<int> CreateMultipleAsync(IEnumerable<TrainingInterval> intervals, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            foreach (var interval in intervals)
            {
                interval.CreatedAt = now;
            }

            _context.TrainingIntervals.AddRange(intervals);
            await _context.SaveChangesAsync(cancellationToken);
            return intervals.Count();
        }

        public async Task<TrainingInterval> UpdateAsync(TrainingInterval interval, CancellationToken cancellationToken = default)
        {
            interval.UpdatedAt = DateTime.UtcNow;
            _context.TrainingIntervals.Update(interval);
            await _context.SaveChangesAsync(cancellationToken);
            return interval;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var interval = await GetByIdAsync(id, cancellationToken);
            if (interval == null) return false;

            _context.TrainingIntervals.Remove(interval);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> DeleteByTrainingSessionIdAsync(int trainingSessionId, CancellationToken cancellationToken = default)
        {
            var intervals = await GetByTrainingSessionIdAsync(trainingSessionId, cancellationToken);
            _context.TrainingIntervals.RemoveRange(intervals);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}

