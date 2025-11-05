// ============================================================================
// CONTROLLER IMPLEMENTATIONS
// ============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Strider.API.Controllers
{
    // ============================================================================
    // 1. PLANNING CONTROLLER
    // ============================================================================
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlanningController : ControllerBase
    {
        private readonly IPlanningService _planningService;
        private readonly IJwtService _jwtService;

        public PlanningController(
            IPlanningService planningService,
            IJwtService jwtService)
        {
            _planningService = planningService;
            _jwtService = jwtService;
        }

        // GET: api/Planning
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlanningResponseDto>>> GetAll(CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var plannings = await _planningService.GetByCoachIdAsync(coachId.Value, cancellationToken);
            return Ok(plannings);
        }

        // GET: api/Planning/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PlanningResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var planning = await _planningService.GetByIdAsync(id, cancellationToken);
            if (planning == null) return NotFound();
            return Ok(planning);
        }

        // POST: api/Planning
        [HttpPost]
        public async Task<ActionResult<PlanningResponseDto>> Create([FromBody] CreatePlanningDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var planning = await _planningService.CreateAsync(dto, coachId.Value, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = planning.Id }, planning);
        }

        // PUT: api/Planning/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<PlanningResponseDto>> Update(int id, [FromBody] UpdatePlanningDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var planning = await _planningService.UpdateAsync(id, dto, coachId.Value, cancellationToken);
            return Ok(planning);
        }

        // DELETE: api/Planning/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _planningService.DeleteAsync(id, coachId.Value, cancellationToken);
            if (!result) return NotFound();
            return NoContent();
        }

        // POST: api/Planning/{id}/athletes
        [HttpPost("{id}/athletes")]
        public async Task<IActionResult> AssignAthletes(int id, [FromBody] AssignAthletesDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _planningService.AssignAthletesAsync(id, dto.AthleteIds, coachId.Value, cancellationToken);
            if (!result) return BadRequest();
            return Ok();
        }

        // POST: api/Planning/{id}/athletes/from-group/{groupId}
        [HttpPost("{id}/athletes/from-group/{groupId}")]
        public async Task<IActionResult> AssignAthletesFromGroup(int id, int groupId, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _planningService.AssignAthletesFromGroupAsync(id, groupId, coachId.Value, cancellationToken);
            if (!result) return BadRequest();
            return Ok();
        }

        // GET: api/Planning/{id}/athletes
        [HttpGet("{id}/athletes")]
        public async Task<ActionResult<IEnumerable<PlanningAthleteResponseDto>>> GetAssignedAthletes(int id, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            
            var athletes = await _planningService.GetAssignedAthletesAsync(id, coachId.Value, cancellationToken);
            return Ok(athletes);
        }

        // DELETE: api/Planning/{id}/athletes/{athleteId}
        [HttpDelete("{id}/athletes/{athleteId}")]
        public async Task<IActionResult> RemoveAthlete(int id, int athleteId, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _planningService.RemoveAthleteAsync(id, athleteId, coachId.Value, cancellationToken);
            if (!result) return NotFound();
            return NoContent();
        }

        // GET: api/Planning/athlete/{athleteId}
        [HttpGet("athlete/{athleteId}")]
        public async Task<ActionResult<IEnumerable<PlanningResponseDto>>> GetByAthleteId(int athleteId, CancellationToken cancellationToken)
        {
            var plannings = await _planningService.GetByAthleteIdAsync(athleteId, cancellationToken);
            return Ok(plannings);
        }
    }

    // ============================================================================
    // 2. PERIOD CONTROLLER
    // ============================================================================
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PeriodController : ControllerBase
    {
        private readonly IPeriodService _periodService;
        private readonly IJwtService _jwtService;

        public PeriodController(
            IPeriodService periodService,
            IJwtService jwtService)
        {
            _periodService = periodService;
            _jwtService = jwtService;
        }

        // GET: api/Period/planning/{planningId}
        [HttpGet("planning/{planningId}")]
        public async Task<ActionResult<IEnumerable<PeriodResponseDto>>> GetByPlanningId(int planningId, CancellationToken cancellationToken)
        {
            var periods = await _periodService.GetByPlanningIdAsync(planningId, cancellationToken);
            return Ok(periods);
        }

        // GET: api/Period/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PeriodResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var period = await _periodService.GetByIdAsync(id, cancellationToken);
            if (period == null) return NotFound();
            return Ok(period);
        }

        // POST: api/Period/planning/{planningId}
        [HttpPost("planning/{planningId}")]
        public async Task<ActionResult<PeriodResponseDto>> Create(int planningId, [FromBody] CreatePeriodDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var period = await _periodService.CreateAsync(dto, planningId, coachId.Value, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = period.Id }, period);
        }

        // PUT: api/Period/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<PeriodResponseDto>> Update(int id, [FromBody] UpdatePeriodDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var period = await _periodService.UpdateAsync(id, dto, coachId.Value, cancellationToken);
            return Ok(period);
        }

        // DELETE: api/Period/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _periodService.DeleteAsync(id, coachId.Value, cancellationToken);
            if (!result) return NotFound();
            return NoContent();
        }
    }

    // ============================================================================
    // 3. MESOCYCLE CONTROLLER
    // ============================================================================
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MesocycleController : ControllerBase
    {
        private readonly IMesocycleService _mesocycleService;
        private readonly IJwtService _jwtService;

        public MesocycleController(
            IMesocycleService mesocycleService,
            IJwtService jwtService)
        {
            _mesocycleService = mesocycleService;
            _jwtService = jwtService;
        }

        // GET: api/Mesocycle/planning/{planningId}
        [HttpGet("planning/{planningId}")]
        public async Task<ActionResult<IEnumerable<MesocycleResponseDto>>> GetByPlanningId(int planningId, CancellationToken cancellationToken)
        {
            var mesocycles = await _mesocycleService.GetByPlanningIdAsync(planningId, cancellationToken);
            return Ok(mesocycles);
        }

        // GET: api/Mesocycle/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MesocycleResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var mesocycle = await _mesocycleService.GetByIdAsync(id, cancellationToken);
            if (mesocycle == null) return NotFound();
            return Ok(mesocycle);
        }

        // POST: api/Mesocycle/planning/{planningId}/period/{periodId}
        // IMPORTANTE: Este endpoint crea el mesociclo y genera automáticamente los microciclos
        [HttpPost("planning/{planningId}/period/{periodId}")]
        public async Task<ActionResult<MesocycleResponseDto>> CreateWithAutoMicrocycles(
            int planningId,
            int periodId,
            [FromBody] CreateMesocycleDto dto,
            CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var mesocycle = await _mesocycleService.CreateWithAutoMicrocyclesAsync(
                dto, planningId, periodId, coachId.Value, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = mesocycle.Id }, mesocycle);
        }

        // PUT: api/Mesocycle/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<MesocycleResponseDto>> Update(int id, [FromBody] UpdateMesocycleDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var mesocycle = await _mesocycleService.UpdateAsync(id, dto, coachId.Value, cancellationToken);
            return Ok(mesocycle);
        }

        // DELETE: api/Mesocycle/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _mesocycleService.DeleteAsync(id, coachId.Value, cancellationToken);
            if (!result) return NotFound();
            return NoContent();
        }
    }

    // ============================================================================
    // 4. MICROCYCLE CONTROLLER
    // ============================================================================
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MicrocycleController : ControllerBase
    {
        private readonly IMicrocycleService _microcycleService;
        private readonly IJwtService _jwtService;

        public MicrocycleController(
            IMicrocycleService microcycleService,
            IJwtService jwtService)
        {
            _microcycleService = microcycleService;
            _jwtService = jwtService;
        }

        // GET: api/Microcycle/mesocycle/{mesocycleId}
        [HttpGet("mesocycle/{mesocycleId}")]
        public async Task<ActionResult<IEnumerable<MicrocycleResponseDto>>> GetByMesocycleId(int mesocycleId, CancellationToken cancellationToken)
        {
            var microcycles = await _microcycleService.GetByMesocycleIdAsync(mesocycleId, cancellationToken);
            return Ok(microcycles);
        }

        // GET: api/Microcycle/period/{periodId}
        [HttpGet("period/{periodId}")]
        public async Task<ActionResult<IEnumerable<MicrocycleResponseDto>>> GetByPeriodId(int periodId, CancellationToken cancellationToken)
        {
            var microcycles = await _microcycleService.GetByPeriodIdAsync(periodId, cancellationToken);
            return Ok(microcycles);
        }

        // GET: api/Microcycle/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MicrocycleResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var microcycle = await _microcycleService.GetByIdAsync(id, cancellationToken);
            if (microcycle == null) return NotFound();
            return Ok(microcycle);
        }

        // PUT: api/Microcycle/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<MicrocycleResponseDto>> Update(int id, [FromBody] UpdateMicrocycleDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var microcycle = await _microcycleService.UpdateAsync(id, dto, coachId.Value, cancellationToken);
            return Ok(microcycle);
        }

        // POST: api/Microcycle/{id}/recalculate-volume
        [HttpPost("{id}/recalculate-volume")]
        public async Task<ActionResult<decimal>> RecalculateVolume(int id, CancellationToken cancellationToken)
        {
            var volume = await _microcycleService.RecalculateVolumeAsync(id, cancellationToken);
            return Ok(new { volume });
        }

        // DELETE: api/Microcycle/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _microcycleService.DeleteAsync(id, coachId.Value, cancellationToken);
            if (!result) return NotFound();
            return NoContent();
        }
    }

    // ============================================================================
    // 5. TRAINING SESSION CONTROLLER
    // ============================================================================
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TrainingSessionController : ControllerBase
    {
        private readonly ITrainingSessionService _trainingSessionService;
        private readonly IJwtService _jwtService;

        public TrainingSessionController(
            ITrainingSessionService trainingSessionService,
            IJwtService jwtService)
        {
            _trainingSessionService = trainingSessionService;
            _jwtService = jwtService;
        }

        // GET: api/TrainingSession/planning/{planningId}
        [HttpGet("planning/{planningId}")]
        public async Task<ActionResult<IEnumerable<TrainingSessionResponseDto>>> GetByPlanningId(int planningId, CancellationToken cancellationToken)
        {
            var sessions = await _trainingSessionService.GetByPlanningIdAsync(planningId, cancellationToken);
            return Ok(sessions);
        }

        // GET: api/TrainingSession/microcycle/{microcycleId}
        [HttpGet("microcycle/{microcycleId}")]
        public async Task<ActionResult<IEnumerable<TrainingSessionResponseDto>>> GetByMicrocycleId(int microcycleId, CancellationToken cancellationToken)
        {
            var sessions = await _trainingSessionService.GetByMicrocycleIdAsync(microcycleId, cancellationToken);
            return Ok(sessions);
        }

        // GET: api/TrainingSession/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingSessionResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var session = await _trainingSessionService.GetByIdAsync(id, cancellationToken);
            if (session == null) return NotFound();
            return Ok(session);
        }

        // POST: api/TrainingSession
        // IMPORTANTE: Este endpoint identifica automáticamente el microciclo basado en PlanningId + Date
        [HttpPost]
        public async Task<ActionResult<TrainingSessionResponseDto>> Create([FromBody] CreateTrainingSessionDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var session = await _trainingSessionService.CreateWithAutoMicrocycleDetectionAsync(dto, coachId.Value, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = session.Id }, session);
        }

        // PUT: api/TrainingSession/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<TrainingSessionResponseDto>> Update(int id, [FromBody] UpdateTrainingSessionDto dto, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var session = await _trainingSessionService.UpdateAsync(id, dto, coachId.Value, cancellationToken);
            return Ok(session);
        }

        // DELETE: api/TrainingSession/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var coachId = _jwtService.GetCurrentUserId();
            if (!coachId.HasValue) return Unauthorized();
            var result = await _trainingSessionService.DeleteAsync(id, coachId.Value, cancellationToken);
            if (!result) return NotFound();
            return NoContent();
        }

        // GET: api/TrainingSession/athlete/{athleteId}
        [HttpGet("athlete/{athleteId}")]
        public async Task<ActionResult<IEnumerable<TrainingSessionResponseDto>>> GetByAthleteId(
            int athleteId,
            [FromQuery] int? planningId = null,
            CancellationToken cancellationToken = default)
        {
            var sessions = await _trainingSessionService.GetByAthleteIdAsync(athleteId, planningId, cancellationToken);
            return Ok(sessions);
        }
    }
}

