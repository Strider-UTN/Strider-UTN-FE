// ============================================================================
// SOLUCIÓN: RecalculateVolumeAsync corregido
// ============================================================================
// Reemplaza el método actual en MicrocycleService

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

// ============================================================================
// ALTERNATIVA: Usar el método del repository (más eficiente)
// ============================================================================
// Si prefieres, puedes usar directamente el método del repository que ya hace esto:

public async Task<decimal> RecalculateVolumeAsync(int microcycleId, CancellationToken cancellationToken = default)
{
    var microcycle = await _microcycleRepository.GetByIdAsync(microcycleId, cancellationToken);
    if (microcycle == null)
        throw new NotFoundException("Microciclo no encontrado");

    // Usar el método del repository que calcula el volumen sumando las distancias de los intervalos
    var totalVolume = await _microcycleRepository.CalculateTotalVolumeAsync(microcycleId, cancellationToken);

    // Actualizar el volumen del microciclo
    microcycle.Volume = totalVolume;
    await _microcycleRepository.UpdateAsync(microcycle, cancellationToken);

    return totalVolume;
}

