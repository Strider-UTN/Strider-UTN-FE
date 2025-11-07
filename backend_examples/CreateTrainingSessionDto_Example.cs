// Ejemplo de DTO con DateTime en lugar de string:

using System.Text.Json.Serialization;
using StriderWebApi.Converters;

public class CreateTrainingSessionDto
{
    public string Name { get; set; }
    public string? Description { get; set; }
    
    // Opción 1: Usar el converter globalmente configurado en Program.cs
    public DateTime Date { get; set; }
    
    // Opción 2: Si prefieres especificar el converter solo en este DTO:
    // [JsonConverter(typeof(UtcDateTimeConverter))]
    // public DateTime Date { get; set; }
    
    public string Category { get; set; }
    public string? Notes { get; set; }
    public int PlanningId { get; set; }
    public int[] AthleteIds { get; set; }
    public List<CreateTrainingIntervalDto> Intervals { get; set; }
}

