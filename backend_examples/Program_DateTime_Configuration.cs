// En Program.cs, agregar la configuración del converter:

using StriderWebApi.Converters;

// ... resto del código ...

builder.Services.Configure<JsonOptions>(options =>
{
    // Agregar el converter para DateTime
    options.SerializerOptions.Converters.Add(new UtcDateTimeConverter());
    
    // Otras configuraciones si las necesitas
    // options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// ... resto del código ...

