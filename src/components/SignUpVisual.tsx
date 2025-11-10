import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import runnerImage from '@/assets/LoginImage.jpg';

export function SignUpVisual() {
  return (
    <div className="relative h-full overflow-hidden w-full">
      {/* Imagen de fondo de runner */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={runnerImage}
          alt="Corredor profesional observando dashboard holográfico de Strider mostrando 12,4km recorridos, VO₂ MAX de 52, pace de 4:37/km y gráficos de rendimiento en tiempo real"
          className="w-full h-full object-cover"
        />
        {/* Overlay sutil para mejorar contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10"></div>
      </div>
      

    </div>
  );
}