// ============================================================================
// SERVICE IMPLEMENTATIONS
// ============================================================================
// Nota: Estas implementaciones asumen que tienes los repositorios y DTOs configurados
//
// IMPORTANTE SOBRE VOLUMEN:
// - TrainingSession NO tiene un campo Volume, se calcula dinámicamente
// - El volumen de una sesión = suma de (Distance * Repetitions) de todos los intervalos
// - El volumen se convierte de metros a kilómetros (÷ 1000)
// - El volumen del microciclo = suma de los volúmenes de todas sus sesiones

using AutoMapper;

namespace Strider.Application.Services
{
    // ============================================================================
    // 1. PLANNING SERVICE
    // ============================================================================
    public class PlanningService : IPlanningService
    {
        private readonly IPlanningRepository _planningRepository;
        private readonly IPlanningAthleteRepository _planningAthleteRepository;
        private readonly ITrainingGroupService _trainingGroupService; // Asumiendo que existe
        private readonly IMapper _mapper;

        public PlanningService(
            IPlanningRepository planningRepository,
            IPlanningAthleteRepository planningAthleteRepository,
            ITrainingGroupService trainingGroupService,
            IMapper mapper)
        {
            _planningRepository = planningRepository;
            _planningAthleteRepository = planningAthleteRepository;
            _trainingGroupService = trainingGroupService;
            _mapper = mapper;
        }

        public async Task<PlanningResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdWithDetailsAsync(id, cancellationToken);
            if (planning == null)
                throw new NotFoundException("Planificación no encontrada");

            return MapToPlanningResponseDto(planning);
        }

        public async Task<IEnumerable<PlanningResponseDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var plannings = await _planningRepository.GetAllAsync(cancellationToken);
            return plannings.Select(MapToPlanningResponseDto);
        }

        public async Task<IEnumerable<PlanningResponseDto>> GetByCoachIdAsync(int coachId, CancellationToken cancellationToken = default)
        {
            var plannings = await _planningRepository.GetByCoachIdAsync(coachId, cancellationToken);
            return plannings.Select(MapToPlanningResponseDto);
        }

        public async Task<PlanningResponseDto> CreateAsync(CreatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = new Planning
            {
                Name = dto.Name,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = dto.Status,
                CoachId = coachId
            };

            var createdPlanning = await _planningRepository.CreateAsync(planning, cancellationToken);

            // Asignar atletas individuales
            if (dto.AthleteIds != null && dto.AthleteIds.Any())
            {
                await AssignAthletesAsync(createdPlanning.Id, dto.AthleteIds, coachId, cancellationToken);
            }

            // Asignar atletas desde grupos
            if (dto.GroupIds != null && dto.GroupIds.Any())
            {
                foreach (var groupId in dto.GroupIds)
                {
                    await AssignAthletesFromGroupAsync(createdPlanning.Id, groupId, coachId, cancellationToken);
                }
            }

            return MapToPlanningResponseDto(createdPlanning);
        }

        public async Task<PlanningResponseDto> UpdateAsync(int id, UpdatePlanningDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(id, cancellationToken);
            if (planning == null)
                throw new NotFoundException("Planificación no encontrada");

            if (planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para actualizar esta planificación");

            planning.Name = dto.Name;
            planning.Description = dto.Description;
            planning.StartDate = dto.StartDate;
            planning.EndDate = dto.EndDate;
            planning.Status = dto.Status;

            var updatedPlanning = await _planningRepository.UpdateAsync(planning, cancellationToken);
            return MapToPlanningResponseDto(updatedPlanning);
        }

        public async Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(id, cancellationToken);
            if (planning == null) return false;

            if (planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para eliminar esta planificación");

            return await _planningRepository.DeleteAsync(id, cancellationToken);
        }

        public async Task<bool> AssignAthletesAsync(int planningId, IEnumerable<int> athleteIds, int coachId, CancellationToken cancellationToken = default)
        {
            if (!await ValidatePlanningAccessAsync(planningId, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para asignar atletas a esta planificación");

            var planningAthletes = new List<PlanningAthlete>();
            foreach (var athleteId in athleteIds)
            {
                if (!await _planningAthleteRepository.ExistsAsync(planningId, athleteId, cancellationToken))
                {
                    planningAthletes.Add(new PlanningAthlete
                    {
                        PlanningId = planningId,
                        AthleteId = athleteId
                    });
                }
            }

            if (planningAthletes.Any())
            {
                await _planningAthleteRepository.CreateMultipleAsync(planningAthletes, cancellationToken);
            }

            return true;
        }

        public async Task<bool> RemoveAthleteAsync(int planningId, int athleteId, int coachId, CancellationToken cancellationToken = default)
        {
            if (!await ValidatePlanningAccessAsync(planningId, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para eliminar atletas de esta planificación");

            var planningAthletes = await _planningAthleteRepository.GetByPlanningIdAsync(planningId, cancellationToken);
            var planningAthlete = planningAthletes.FirstOrDefault(pa => pa.AthleteId == athleteId);

            if (planningAthlete == null)
                return false;

            return await _planningAthleteRepository.DeleteAsync(planningAthlete.Id, cancellationToken);
        }

        public async Task<bool> AssignAthletesFromGroupAsync(int planningId, int groupId, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
            if (planning == null || planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para asignar atletas a esta planificación");

            var groupMembers = await _trainingGroupService.GetGroupMembersAsync(groupId, cancellationToken);
            var activeAthletes = groupMembers
                .Where(m => m.Status == "active")
                .Select(m => m.UserId)
                .ToList();

            if (!activeAthletes.Any())
                throw new ValidationException("El grupo no tiene atletas activos");

            var existingAssignments = await _planningAthleteRepository.GetByPlanningIdAsync(planningId, cancellationToken);
            var existingAthleteIds = existingAssignments.Select(a => a.AthleteId).ToHashSet();
            var newAthletes = activeAthletes.Where(id => !existingAthleteIds.Contains(id)).ToList();

            if (!newAthletes.Any())
                throw new ValidationException("Todos los atletas del grupo ya están asignados a esta planificación");

            var planningAthletes = newAthletes.Select(athleteId => new PlanningAthlete
            {
                PlanningId = planningId,
                AthleteId = athleteId
            }).ToList();

            await _planningAthleteRepository.CreateMultipleAsync(planningAthletes, cancellationToken);
            return true;
        }

        public async Task<bool> ValidatePlanningAccessAsync(int planningId, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
            return planning != null && planning.CoachId == coachId;
        }

        public async Task<bool> ValidatePlanningExistsAsync(int planningId, CancellationToken cancellationToken = default)
        {
            return await _planningRepository.ExistsAsync(planningId, cancellationToken);
        }

        public async Task<IEnumerable<PlanningResponseDto>> GetByAthleteIdAsync(int athleteId, CancellationToken cancellationToken = default)
        {
            var plannings = await _planningRepository.GetByAthleteIdAsync(athleteId, cancellationToken);
            return plannings.Select(MapToPlanningResponseDto);
        }

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

        private PlanningResponseDto MapToPlanningResponseDto(Planning planning)
        {
            return new PlanningResponseDto
            {
                Id = planning.Id,
                Name = planning.Name,
                Description = planning.Description,
                StartDate = planning.StartDate,
                EndDate = planning.EndDate,
                Status = planning.Status,
                CoachId = planning.CoachId,
                CoachName = planning.Coach?.Name ?? string.Empty,
                AthletesCount = planning.PlanningAthletes?.Count ?? 0,
                MesocyclesCount = planning.Mesocycles?.Count ?? 0,
                PeriodsCount = planning.Periods?.Count ?? 0,
                CreatedAt = planning.CreatedAt,
                UpdatedAt = planning.UpdatedAt
            };
        }
    }

    // ============================================================================
    // 2. PERIOD SERVICE
    // ============================================================================
    public class PeriodService : IPeriodService
    {
        private readonly IPeriodRepository _periodRepository;
        private readonly IPlanningRepository _planningRepository;
        private readonly IMapper _mapper;

        public PeriodService(
            IPeriodRepository periodRepository,
            IPlanningRepository planningRepository,
            IMapper mapper)
        {
            _periodRepository = periodRepository;
            _planningRepository = planningRepository;
            _mapper = mapper;
        }

        public async Task<PeriodResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var period = await _periodRepository.GetByIdAsync(id, cancellationToken);
            if (period == null)
                throw new NotFoundException("Período no encontrado");

            return MapToPeriodResponseDto(period);
        }

        public async Task<IEnumerable<PeriodResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            var periods = await _periodRepository.GetByPlanningIdAsync(planningId, cancellationToken);
            return periods.Select(MapToPeriodResponseDto);
        }

        public async Task<PeriodResponseDto> CreateAsync(CreatePeriodDto dto, int planningId, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
            if (planning == null || planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para crear períodos en esta planificación");

            var period = new Period
            {
                Name = dto.Name,
                StartWeek = dto.StartWeek,
                EndWeek = dto.EndWeek,
                Objective = dto.Objective,
                Status = dto.Status,
                PlanningId = planningId
            };

            var createdPeriod = await _periodRepository.CreateAsync(period, cancellationToken);
            return MapToPeriodResponseDto(createdPeriod);
        }

        public async Task<PeriodResponseDto> UpdateAsync(int id, UpdatePeriodDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            var period = await _periodRepository.GetByIdAsync(id, cancellationToken);
            if (period == null)
                throw new NotFoundException("Período no encontrado");

            if (!await ValidatePeriodAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para actualizar este período");

            period.Name = dto.Name;
            period.StartWeek = dto.StartWeek;
            period.EndWeek = dto.EndWeek;
            period.Objective = dto.Objective;
            period.Status = dto.Status;

            var updatedPeriod = await _periodRepository.UpdateAsync(period, cancellationToken);
            return MapToPeriodResponseDto(updatedPeriod);
        }

        public async Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default)
        {
            if (!await ValidatePeriodAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para eliminar este período");

            return await _periodRepository.DeleteAsync(id, cancellationToken);
        }

        public async Task<bool> ValidatePeriodAccessAsync(int periodId, int coachId, CancellationToken cancellationToken = default)
        {
            var period = await _periodRepository.GetByIdAsync(periodId, cancellationToken);
            if (period == null || !period.PlanningId.HasValue) return false;

            var planning = await _planningRepository.GetByIdAsync(period.PlanningId.Value, cancellationToken);
            return planning != null && planning.CoachId == coachId;
        }

        private PeriodResponseDto MapToPeriodResponseDto(Period period)
        {
            return new PeriodResponseDto
            {
                Id = period.Id,
                Name = period.Name,
                StartWeek = period.StartWeek,
                EndWeek = period.EndWeek,
                Objective = period.Objective,
                Status = period.Status,
                PlanningId = period.PlanningId,
                MesocyclesCount = period.Mesocycles?.Count ?? 0,
                MicrocyclesCount = period.Microcycles?.Count ?? 0,
                CreatedAt = period.CreatedAt,
                UpdatedAt = period.UpdatedAt
            };
        }
    }

    // ============================================================================
    // 3. MESOCYCLE SERVICE
    // ============================================================================
    public class MesocycleService : IMesocycleService
    {
        private readonly IMesocycleRepository _mesocycleRepository;
        private readonly IMicrocycleRepository _microcycleRepository;
        private readonly IPlanningRepository _planningRepository;
        private readonly IPeriodRepository _periodRepository;
        private readonly IMapper _mapper;

        public MesocycleService(
            IMesocycleRepository mesocycleRepository,
            IMicrocycleRepository microcycleRepository,
            IPlanningRepository planningRepository,
            IPeriodRepository periodRepository,
            IMapper mapper)
        {
            _mesocycleRepository = mesocycleRepository;
            _microcycleRepository = microcycleRepository;
            _planningRepository = planningRepository;
            _periodRepository = periodRepository;
            _mapper = mapper;
        }

        public async Task<MesocycleResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var mesocycle = await _mesocycleRepository.GetByIdWithMicrocyclesAsync(id, cancellationToken);
            if (mesocycle == null)
                throw new NotFoundException("Mesociclo no encontrado");

            return MapToMesocycleResponseDto(mesocycle);
        }

        public async Task<IEnumerable<MesocycleResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            var mesocycles = await _mesocycleRepository.GetByPlanningIdWithMicrocyclesAsync(planningId, cancellationToken);
            return mesocycles.Select(MapToMesocycleResponseDto);
        }

        public async Task<MesocycleResponseDto> CreateAsync(CreateMesocycleDto dto, int planningId, int coachId, CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
            if (planning == null || planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para crear mesociclos en esta planificación");

            var endDate = dto.StartDate.AddDays((dto.WeeksCount * 7) - 1);

            var mesocycle = new Mesocycle
            {
                Name = dto.Name,
                StartDate = dto.StartDate,
                EndDate = endDate,
                WeeksCount = dto.WeeksCount,
                Objective = dto.Objective,
                Status = dto.Status,
                PlanningId = planningId,
                PeriodId = dto.PeriodId
            };

            var createdMesocycle = await _mesocycleRepository.CreateAsync(mesocycle, cancellationToken);
            return MapToMesocycleResponseDto(createdMesocycle);
        }

        public async Task<MesocycleResponseDto> CreateWithAutoMicrocyclesAsync(
            CreateMesocycleDto dto,
            int planningId,
            int periodId,
            int coachId,
            CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(planningId, cancellationToken);
            if (planning == null || planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para crear mesociclos en esta planificación");

            var period = await _periodRepository.GetByIdAsync(periodId, cancellationToken);
            if (period == null || period.PlanningId != planningId)
                throw new NotFoundException("Período no encontrado o no pertenece a esta planificación");

            var endDate = dto.StartDate.AddDays((dto.WeeksCount * 7) - 1);
            var hasOverlap = await _mesocycleRepository.HasOverlappingDatesAsync(
                planningId, dto.StartDate, endDate, null, cancellationToken);
            if (hasOverlap)
                throw new ValidationException("El mesociclo se superpone con otro mesociclo existente");

            if (dto.WeeksCount <= 0 || dto.WeeksCount > 52)
                throw new ValidationException("El número de semanas debe estar entre 1 y 52");

            var mesocycle = new Mesocycle
            {
                Name = dto.Name,
                StartDate = dto.StartDate,
                EndDate = endDate,
                WeeksCount = dto.WeeksCount,
                Objective = dto.Objective,
                Status = dto.Status,
                PlanningId = planningId,
                PeriodId = dto.PeriodId
            };

            var createdMesocycle = await _mesocycleRepository.CreateAsync(mesocycle, cancellationToken);

            // Crear microciclos automáticamente
            var microcycles = new List<Microcycle>();
            var currentDate = dto.StartDate;

            for (int week = 1; week <= dto.WeeksCount; week++)
            {
                var weekStartDate = currentDate;
                var weekEndDate = currentDate.AddDays(6);

                var microcycle = new Microcycle
                {
                    WeekNumber = week,
                    StartDate = weekStartDate,
                    EndDate = weekEndDate,
                    Sessions = 0,
                    Volume = 0,
                    Intensity = MicrocycleIntensity.Medium,
                    Focus = null,
                    MesocycleId = createdMesocycle.Id,
                    PeriodId = periodId
                };

                var createdMicrocycle = await _microcycleRepository.CreateAsync(microcycle, cancellationToken);
                microcycles.Add(createdMicrocycle);

                currentDate = currentDate.AddDays(7);
            }

            return MapToMesocycleResponseDto(createdMesocycle, microcycles.Count);
        }

        public async Task<MesocycleResponseDto> UpdateAsync(int id, UpdateMesocycleDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            var mesocycle = await _mesocycleRepository.GetByIdAsync(id, cancellationToken);
            if (mesocycle == null)
                throw new NotFoundException("Mesociclo no encontrado");

            if (!await ValidateMesocycleAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para actualizar este mesociclo");

            mesocycle.Name = dto.Name;
            mesocycle.StartDate = dto.StartDate;
            mesocycle.EndDate = dto.EndDate;
            mesocycle.WeeksCount = dto.WeeksCount;
            mesocycle.Objective = dto.Objective;
            mesocycle.Status = dto.Status;
            mesocycle.PeriodId = dto.PeriodId;

            var updatedMesocycle = await _mesocycleRepository.UpdateAsync(mesocycle, cancellationToken);
            return MapToMesocycleResponseDto(updatedMesocycle);
        }

        public async Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default)
        {
            if (!await ValidateMesocycleAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para eliminar este mesociclo");

            return await _mesocycleRepository.DeleteAsync(id, cancellationToken);
        }

        public async Task<bool> ValidateMesocycleAccessAsync(int mesocycleId, int coachId, CancellationToken cancellationToken = default)
        {
            var mesocycle = await _mesocycleRepository.GetByIdAsync(mesocycleId, cancellationToken);
            if (mesocycle == null) return false;

            var planning = await _planningRepository.GetByIdAsync(mesocycle.PlanningId, cancellationToken);
            return planning != null && planning.CoachId == coachId;
        }

        public async Task<bool> ValidateNoDateOverlapAsync(int planningId, DateTime startDate, DateTime endDate, int? excludeMesocycleId = null, CancellationToken cancellationToken = default)
        {
            return !await _mesocycleRepository.HasOverlappingDatesAsync(planningId, startDate, endDate, excludeMesocycleId, cancellationToken);
        }

        private MesocycleResponseDto MapToMesocycleResponseDto(Mesocycle mesocycle, int? microcyclesCount = null)
        {
            return new MesocycleResponseDto
            {
                Id = mesocycle.Id,
                Name = mesocycle.Name,
                StartDate = mesocycle.StartDate,
                EndDate = mesocycle.EndDate,
                Objective = mesocycle.Objective,
                WeeksCount = mesocycle.WeeksCount,
                Status = mesocycle.Status,
                PlanningId = mesocycle.PlanningId,
                PeriodId = mesocycle.PeriodId,
                MicrocyclesCount = microcyclesCount ?? mesocycle.Microcycles?.Count ?? 0,
                CreatedAt = mesocycle.CreatedAt,
                UpdatedAt = mesocycle.UpdatedAt
            };
        }
    }

    // ============================================================================
    // 4. MICROCYCLE SERVICE
    // ============================================================================
    public class MicrocycleService : IMicrocycleService
    {
        private readonly IMicrocycleRepository _microcycleRepository;
        private readonly ITrainingSessionRepository _trainingSessionRepository;
        private readonly IMesocycleRepository _mesocycleRepository;
        private readonly IPlanningRepository _planningRepository;
        private readonly IMapper _mapper;

        public MicrocycleService(
            IMicrocycleRepository microcycleRepository,
            ITrainingSessionRepository trainingSessionRepository,
            IMesocycleRepository mesocycleRepository,
            IPlanningRepository planningRepository,
            IMapper mapper)
        {
            _microcycleRepository = microcycleRepository;
            _trainingSessionRepository = trainingSessionRepository;
            _mesocycleRepository = mesocycleRepository;
            _planningRepository = planningRepository;
            _mapper = mapper;
        }

        public async Task<MicrocycleResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var microcycle = await _microcycleRepository.GetByIdAsync(id, cancellationToken);
            if (microcycle == null)
                throw new NotFoundException("Microciclo no encontrado");

            return MapToMicrocycleResponseDto(microcycle);
        }

        public async Task<IEnumerable<MicrocycleResponseDto>> GetByMesocycleIdAsync(int mesocycleId, CancellationToken cancellationToken = default)
        {
            var microcycles = await _microcycleRepository.GetByMesocycleIdAsync(mesocycleId, cancellationToken);
            return microcycles.Select(MapToMicrocycleResponseDto);
        }

        public async Task<IEnumerable<MicrocycleResponseDto>> GetByPeriodIdAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var microcycles = await _microcycleRepository.GetByPeriodIdAsync(periodId, cancellationToken);
            return microcycles.Select(MapToMicrocycleResponseDto);
        }

        public async Task<MicrocycleResponseDto> UpdateAsync(int id, UpdateMicrocycleDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            var microcycle = await _microcycleRepository.GetByIdAsync(id, cancellationToken);
            if (microcycle == null)
                throw new NotFoundException("Microciclo no encontrado");

            if (!await ValidateMicrocycleAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para actualizar este microciclo");

            microcycle.Sessions = dto.Sessions;
            microcycle.Volume = dto.Volume;
            microcycle.Intensity = dto.Intensity;
            microcycle.Focus = dto.Focus;

            var updatedMicrocycle = await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);
            return MapToMicrocycleResponseDto(updatedMicrocycle);
        }

        public async Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default)
        {
            if (!await ValidateMicrocycleAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para eliminar este microciclo");

            return await _microcycleRepository.DeleteAsync(id, cancellationToken);
        }

        public async Task<decimal> RecalculateVolumeAsync(int microcycleId, CancellationToken cancellationToken = default)
        {
            var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
            if (microcycle == null)
                throw new NotFoundException("Microciclo no encontrado");

            // Obtener todas las sesiones del microciclo con sus intervalos
            var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycleId, cancellationToken);

            decimal totalVolumeKm = 0;

            foreach (var session in sessions)
            {
                // Calcular volumen de la sesión sumando las distancias de los intervalos
                if (session.Intervals != null && session.Intervals.Any())
                {
                    decimal sessionVolumeMeters = 0;
                    foreach (var interval in session.Intervals)
                    {
                        // Distancia total = distancia del intervalo * repeticiones
                        sessionVolumeMeters += interval.Distance * interval.Repetitions;
                    }

                    // Convertir de metros a kilómetros y sumar al total
                    totalVolumeKm += sessionVolumeMeters / 1000m;
                }
            }

            // Actualizar el volumen del microciclo
            microcycle.Volume = totalVolumeKm;
            await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);

            return totalVolumeKm;
        }

        public async Task<bool> UpdateVolumeAutomaticallyAsync(int microcycleId, CancellationToken cancellationToken = default)
        {
            await RecalculateVolumeAsync(microcycleId, cancellationToken);
            return true;
        }

        public async Task<bool> ValidateMicrocycleAccessAsync(int microcycleId, int coachId, CancellationToken cancellationToken = default)
        {
            var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
            if (microcycle == null) return false;

            var mesocycle = await _mesocycleRepository.GetByIdAsync(microcycle.MesocycleId, cancellationToken);
            if (mesocycle == null) return false;

            var planning = await _planningRepository.GetByIdAsync(mesocycle.PlanningId, cancellationToken);
            return planning != null && planning.CoachId == coachId;
        }

        private MicrocycleResponseDto MapToMicrocycleResponseDto(Microcycle microcycle)
        {
            return new MicrocycleResponseDto
            {
                Id = microcycle.Id,
                WeekNumber = microcycle.WeekNumber,
                StartDate = microcycle.StartDate,
                EndDate = microcycle.EndDate,
                Sessions = microcycle.Sessions,
                Volume = microcycle.Volume,
                Intensity = microcycle.Intensity,
                Focus = microcycle.Focus,
                MesocycleId = microcycle.MesocycleId,
                PeriodId = microcycle.PeriodId,
                TrainingSessionsCount = microcycle.TrainingSessions?.Count ?? 0,
                CreatedAt = microcycle.CreatedAt,
                UpdatedAt = microcycle.UpdatedAt
            };
        }
    }

    // ============================================================================
    // 5. TRAINING SESSION SERVICE
    // ============================================================================
    public class TrainingSessionService : ITrainingSessionService
    {
        private readonly ITrainingSessionRepository _trainingSessionRepository;
        private readonly IMicrocycleRepository _microcycleRepository;
        private readonly IPlanningRepository _planningRepository;
        private readonly IMicrocycleService _microcycleService;
        private readonly ITrainingSessionAthleteRepository _trainingSessionAthleteRepository;
        private readonly IMapper _mapper;

        public TrainingSessionService(
            ITrainingSessionRepository trainingSessionRepository,
            IMicrocycleRepository microcycleRepository,
            IPlanningRepository planningRepository,
            IMicrocycleService microcycleService,
            ITrainingSessionAthleteRepository trainingSessionAthleteRepository,
            ITrainingIntervalRepository trainingIntervalRepository,
            IMapper mapper)
        {
            _trainingSessionRepository = trainingSessionRepository;
            _microcycleRepository = microcycleRepository;
            _planningRepository = planningRepository;
            _microcycleService = microcycleService;
            _trainingSessionAthleteRepository = trainingSessionAthleteRepository;
            _trainingIntervalRepository = trainingIntervalRepository;
            _mapper = mapper;
        }

        public async Task<TrainingSessionResponseDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var session = await _trainingSessionRepository.GetByIdWithAthletesAsync(id, cancellationToken);
            if (session == null)
                throw new NotFoundException("Sesión de entrenamiento no encontrada");

            return MapToTrainingSessionResponseDto(session);
        }

        public async Task<IEnumerable<TrainingSessionResponseDto>> GetByPlanningIdAsync(int planningId, CancellationToken cancellationToken = default)
        {
            var sessions = await _trainingSessionRepository.GetByPlanningIdAsync(planningId, cancellationToken);
            return sessions.Select(MapToTrainingSessionResponseDto);
        }

        public async Task<IEnumerable<TrainingSessionResponseDto>> GetByMicrocycleIdAsync(int microcycleId, CancellationToken cancellationToken = default)
        {
            var sessions = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycleId, cancellationToken);
            return sessions.Select(MapToTrainingSessionResponseDto);
        }

        public async Task<TrainingSessionResponseDto> CreateAsync(CreateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            // Este método requiere que se pase el MicrocycleId explícitamente
            // Para la creación automática, usar CreateWithAutoMicrocycleDetectionAsync
            throw new NotImplementedException("Use CreateWithAutoMicrocycleDetectionAsync instead");
        }

        public async Task<TrainingSessionResponseDto> CreateWithAutoMicrocycleDetectionAsync(
            CreateTrainingSessionDto dto,
            int coachId,
            CancellationToken cancellationToken = default)
        {
            var planning = await _planningRepository.GetByIdAsync(dto.PlanningId, cancellationToken);
            if (planning == null)
                throw new NotFoundException("Planificación no encontrada");

            if (planning.CoachId != coachId)
                throw new UnauthorizedException("No tienes permisos para crear sesiones en esta planificación");

            var sessionDate = DateTime.Parse(dto.Date);
            var microcycle = await _microcycleRepository.GetByPlanningIdAndDateAsync(
                dto.PlanningId, sessionDate, cancellationToken);

            if (microcycle == null)
                throw new ValidationException(
                    $"No se encontró un microciclo para la fecha {dto.Date:yyyy-MM-dd} en la planificación. " +
                    $"Asegúrate de que la fecha esté dentro del rango de algún microciclo de la planificación.");

            if (sessionDate < microcycle.StartDate || sessionDate > microcycle.EndDate)
                throw new ValidationException(
                    $"La fecha {dto.Date:yyyy-MM-dd} no está dentro del rango del microciclo " +
                    $"({microcycle.StartDate:yyyy-MM-dd} - {microcycle.EndDate:yyyy-MM-dd})");

            var trainingSession = new TrainingSession
            {
                PlanningId = dto.PlanningId,
                MicrocycleId = microcycle.Id,
                Date = sessionDate,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                Notes = dto.Notes,
                CreatedByUserId = coachId
            };

            var createdSession = await _trainingSessionRepository.CreateAsync(trainingSession, cancellationToken);

            // Crear intervalos si existen
            if (dto.Intervals != null && dto.Intervals.Any())
            {
                var intervals = new List<TrainingInterval>();
                foreach (var intervalDto in dto.Intervals)
                {
                    var interval = new TrainingInterval
                    {
                        TrainingSessionId = createdSession.Id,
                        Type = intervalDto.Type,
                        Repetitions = intervalDto.Repetitions,
                        Distance = intervalDto.Distance,
                        TargetTime = intervalDto.TargetTime,
                        RecoveryTime = intervalDto.RecoveryTime,
                        PaceType = intervalDto.PaceType,
                        Pace = intervalDto.Pace,
                        Vo2MaxPercentage = intervalDto.Vo2MaxPercentage,
                        Description = intervalDto.Description,
                        Intensity = intervalDto.Intensity,
                        TrainingMode = intervalDto.TrainingMode,
                        Duration = intervalDto.Duration,
                        TargetSpeed = intervalDto.TargetSpeed,
                        OrderIndex = intervalDto.OrderIndex
                    };
                    intervals.Add(interval);
                }
                await _trainingIntervalRepository.CreateMultipleAsync(intervals, cancellationToken);
            }

            // Calcular y actualizar volumen de la sesión basado en los intervalos
            await RecalculateSessionVolumeAsync(createdSession.Id, cancellationToken);

            // Asignar atletas a la sesión
            if (dto.AthleteIds != null && dto.AthleteIds.Any())
            {
                foreach (var athleteId in dto.AthleteIds)
                {
                    var sessionAthlete = new TrainingSessionAthlete
                    {
                        TrainingSessionId = createdSession.Id,
                        AthleteId = athleteId,
                        Status = SessionStatus.Pending // Estado inicial
                    };
                    await _trainingSessionAthleteRepository.CreateAsync(sessionAthlete, cancellationToken);
                }
            }

            // Recalcular volumen del microciclo automáticamente
            await _microcycleService.UpdateVolumeAutomaticallyAsync(microcycle.Id, cancellationToken);

            // Actualizar contador de sesiones del microciclo
            var sessionsCount = await _trainingSessionRepository.GetByMicrocycleIdAsync(microcycle.Id, cancellationToken);
            microcycle.Sessions = sessionsCount.Count();
            await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);

            return MapToTrainingSessionResponseDto(createdSession);
        }

        public async Task<TrainingSessionResponseDto> UpdateAsync(int id, UpdateTrainingSessionDto dto, int coachId, CancellationToken cancellationToken = default)
        {
            var session = await _trainingSessionRepository.GetByIdAsync(id, cancellationToken);
            if (session == null)
                throw new NotFoundException("Sesión de entrenamiento no encontrada");

            if (!await ValidateSessionAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para actualizar esta sesión");

            session.Name = dto.Name;
            session.Description = dto.Description;
            session.Date = dto.Date;
            session.Category = dto.Category;
            session.Notes = dto.Notes;

            var updatedSession = await _trainingSessionRepository.UpdateAsync(session, cancellationToken);

            // Recalcular volumen de la sesión basado en los intervalos
            await RecalculateSessionVolumeAsync(session.Id, cancellationToken);

            // Recalcular volumen del microciclo automáticamente
            await _microcycleService.UpdateVolumeAutomaticallyAsync(session.MicrocycleId, cancellationToken);

            return MapToTrainingSessionResponseDto(updatedSession);
        }

        public async Task<bool> DeleteAsync(int id, int coachId, CancellationToken cancellationToken = default)
        {
            var session = await _trainingSessionRepository.GetByIdAsync(id, cancellationToken);
            if (session == null) return false;

            if (!await ValidateSessionAccessAsync(id, coachId, cancellationToken))
                throw new UnauthorizedException("No tienes permisos para eliminar esta sesión");

            var microcycleId = session.MicrocycleId;
            var result = await _trainingSessionRepository.DeleteAsync(id, cancellationToken);

            // Recalcular volumen del microciclo después de eliminar
            if (result)
            {
                await _microcycleService.UpdateVolumeAutomaticallyAsync(microcycleId, cancellationToken);
            }

            return result;
        }

        public async Task<bool> ValidateSessionAccessAsync(int sessionId, int coachId, CancellationToken cancellationToken = default)
        {
            var session = await _trainingSessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null) return false;

            var planning = await _planningRepository.GetByIdAsync(session.PlanningId, cancellationToken);
            return planning != null && planning.CoachId == coachId;
        }

        public async Task<bool> ValidateDateInMicrocycleRangeAsync(int microcycleId, DateTime date, CancellationToken cancellationToken = default)
        {
            var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
            if (microcycle == null) return false;

            return date >= microcycle.StartDate && date <= microcycle.EndDate;
        }

        public async Task<IEnumerable<TrainingSessionResponseDto>> GetByAthleteIdAsync(int athleteId, int? planningId = null, CancellationToken cancellationToken = default)
        {
            var sessions = await _trainingSessionRepository.GetByAthleteIdAsync(athleteId, planningId, cancellationToken);
            return sessions.Select(MapToTrainingSessionResponseDto);
        }

        /// <summary>
        /// Recalcula el volumen de una sesión sumando las distancias de todos sus intervalos
        /// </summary>
        public async Task<decimal> RecalculateSessionVolumeAsync(int sessionId, CancellationToken cancellationToken = default)
        {
            var session = await _trainingSessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                throw new NotFoundException("Sesión de entrenamiento no encontrada");

            // Obtener todos los intervalos de la sesión
            var intervals = await _trainingIntervalRepository.GetByTrainingSessionIdAsync(sessionId, cancellationToken);

            // Calcular volumen total: sumar todas las distancias (en metros) y convertir a kilómetros
            decimal totalDistanceMeters = 0;
            foreach (var interval in intervals)
            {
                // Distancia total = distancia del intervalo * repeticiones
                totalDistanceMeters += interval.Distance * interval.Repetitions;
            }

            // Convertir de metros a kilómetros
            decimal totalVolumeKm = totalDistanceMeters / 1000m;

            // Actualizar el volumen de la sesión (si tiene el campo)
            // Si TrainingSession no tiene Volume, podemos almacenarlo en un campo calculado o agregarlo
            // Por ahora, lo devolvemos para que se use en el cálculo del microciclo
            return totalVolumeKm;
        }

        private TrainingSessionResponseDto MapToTrainingSessionResponseDto(TrainingSession session)
        {
            // Calcular volumen de la sesión sumando las distancias de los intervalos
            decimal sessionVolume = 0;
            if (session.Intervals != null && session.Intervals.Any())
            {
                decimal totalDistanceMeters = session.Intervals
                    .Sum(i => i.Distance * i.Repetitions);
                sessionVolume = totalDistanceMeters / 1000m; // Convertir de metros a kilómetros
            }

            return new TrainingSessionResponseDto
            {
                Id = session.Id,
                Name = session.Name,
                Description = session.Description,
                Date = session.Date,
                Category = session.Category,
                PlanningId = session.PlanningId,
                MicrocycleId = session.MicrocycleId,
                AthleteIds = session.Athletes?.Select(a => a.AthleteId).ToList() ?? new List<int>(),
                Notes = session.Notes,
                Volume = sessionVolume, // Volumen calculado dinámicamente desde intervalos (km)
                Intervals = session.Intervals?.Select(i => MapToTrainingIntervalResponseDto(i)).OrderBy(i => i.OrderIndex).ToList(),
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt
            };
        }

        private TrainingIntervalResponseDto MapToTrainingIntervalResponseDto(TrainingInterval interval)
        {
            return new TrainingIntervalResponseDto
            {
                Id = interval.Id,
                Type = interval.Type,
                Repetitions = interval.Repetitions,
                Distance = interval.Distance, // en metros
                TargetTime = interval.TargetTime,
                RecoveryTime = interval.RecoveryTime,
                PaceType = interval.PaceType,
                Pace = interval.Pace,
                Vo2MaxPercentage = interval.Vo2MaxPercentage,
                Description = interval.Description,
                Intensity = interval.Intensity,
                TrainingMode = interval.TrainingMode,
                Duration = interval.Duration,
                TargetSpeed = interval.TargetSpeed,
                OrderIndex = interval.OrderIndex
            };
        }
    }
}

