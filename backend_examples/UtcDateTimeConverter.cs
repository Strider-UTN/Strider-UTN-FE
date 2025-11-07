using System.Text.Json;
using System.Text.Json.Serialization;

namespace StriderWebApi.Converters
{
    /// <summary>
    /// Converter para parsear fechas ISO como UTC explícitamente
    /// </summary>
    public class UtcDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var dateString = reader.GetString();
            if (string.IsNullOrEmpty(dateString))
                return default;
            
            // Parsear como UTC explícitamente usando RoundtripKind para preservar el 'Z'
            if (DateTime.TryParse(dateString, null, System.Globalization.DateTimeStyles.RoundtripKind, out var date))
            {
                // Asegurar que el DateTime tenga Kind=UTC
                if (date.Kind == DateTimeKind.Utc)
                    return date;
                
                // Si no es UTC, convertir o especificar como UTC
                if (date.Kind == DateTimeKind.Local)
                    return date.ToUniversalTime();
                
                // Si es Unspecified, asumir que es UTC (viene de string ISO con 'Z')
                return DateTime.SpecifyKind(date, DateTimeKind.Utc);
            }
            
            // Si falla el parseo, intentar parsear como fecha local y convertir a UTC
            if (DateTime.TryParse(dateString, out var localDate))
            {
                return localDate.Kind == DateTimeKind.Utc 
                    ? localDate 
                    : DateTime.SpecifyKind(localDate, DateTimeKind.Utc);
            }
            
            throw new JsonException($"No se pudo parsear la fecha: {dateString}");
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Escribir como ISO string UTC
            writer.WriteStringValue(value.Kind == DateTimeKind.Utc 
                ? value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") 
                : value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
        }
    }
}

