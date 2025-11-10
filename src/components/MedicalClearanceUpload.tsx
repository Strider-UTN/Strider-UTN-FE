import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface MedicalClearance {
  hasValidClearance: boolean;
  certificateFile?: string;
  certificateFileName?: string;
  uploadDate?: string;
  expirationDate?: string;
}

interface MedicalClearanceUploadProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  currentClearance: MedicalClearance;
  onSave: (clearance: MedicalClearance) => void;
}

export function MedicalClearanceUpload({
  isOpen,
  onClose,
  athleteName,
  currentClearance,
  onSave
}: MedicalClearanceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(currentClearance.hasValidClearance);
  const [isUploading, setIsUploading] = useState(false);
  const [validationMode, setValidationMode] = useState<'automatic' | 'manual'>('automatic');
  const [uploadDate, setUploadDate] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');

  // Calcular fechas automáticamente cuando se sube un archivo
  useEffect(() => {
    if (selectedFile && validationMode === 'automatic') {
      const now = new Date();
      
      // Formatear fecha de carga para input type="date" (YYYY-MM-DD)
      setUploadDate(now.toISOString().split('T')[0]);
    }
  }, [selectedFile, validationMode]);

  // Calcular fecha de vencimiento automáticamente basándose en la fecha de último chequeo
  useEffect(() => {
    if (uploadDate && validationMode === 'automatic') {
      const checkupDate = new Date(uploadDate);
      const expiration = new Date(checkupDate);
      expiration.setFullYear(expiration.getFullYear() + 1);
      
      // Formatear fecha de vencimiento para input type="date" (YYYY-MM-DD)
      setExpirationDate(expiration.toISOString().split('T')[0]);
    }
  }, [uploadDate, validationMode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo (imágenes y PDFs)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato no válido. Solo se permiten imágenes (JPG, PNG, HEIC) o PDF');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande. Máximo 10MB');
        return;
      }

      setSelectedFile(file);

      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    if (!selectedFile && !currentClearance.certificateFile) {
      toast.error('Por favor sube un certificado antes de guardar');
      return;
    }

    if (validationMode === 'automatic' && selectedFile && !expirationDate) {
      toast.error('Por favor establece una fecha de vencimiento');
      return;
    }

    setIsUploading(true);

    // Simular subida del archivo
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedClearance: MedicalClearance = {
      hasValidClearance: validationMode === 'automatic' ? true : isValid,
      certificateFile: selectedFile ? URL.createObjectURL(selectedFile) : currentClearance.certificateFile,
      certificateFileName: selectedFile ? selectedFile.name : currentClearance.certificateFileName,
      uploadDate: selectedFile ? new Date(uploadDate).toISOString() : currentClearance.uploadDate,
      expirationDate: validationMode === 'automatic' && selectedFile 
        ? new Date(expirationDate).toISOString() 
        : currentClearance.expirationDate
    };

    onSave(updatedClearance);
    setIsUploading(false);
    
    if (validationMode === 'automatic' && selectedFile) {
      toast.success('Apto físico actualizado correctamente', {
        description: `Válido hasta el ${new Date(expirationDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
      });
    } else {
      toast.success('Apto físico actualizado correctamente');
    }
    
    onClose();
  };

  const handleViewCurrentCertificate = () => {
    if (currentClearance.certificateFile) {
      window.open(currentClearance.certificateFile, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestión de Apto Físico</DialogTitle>
          <DialogDescription>
            {athleteName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado actual */}
          {currentClearance.certificateFile && !selectedFile && (
            <div className="p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">Certificado Actual</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentClearance.certificateFileName || 'certificado-apto-fisico.pdf'}
                  </p>
                  <div className="space-y-1 mt-2">
                    {currentClearance.uploadDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Subido el {new Date(currentClearance.uploadDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    {currentClearance.expirationDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vence el {new Date(currentClearance.expirationDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={
                      currentClearance.hasValidClearance
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {currentClearance.hasValidClearance ? 'Vigente' : 'No vigente'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewCurrentCertificate}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
              </div>
            </div>
          )}

          {/* Subir nuevo archivo */}
          <div className="space-y-3">
            <Label>
              {selectedFile || currentClearance.certificateFile ? 'Reemplazar Certificado' : 'Subir Certificado'}
            </Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="certificate-upload"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/heic,application/pdf"
                  onChange={handleFileSelect}
                />
                <label htmlFor="certificate-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">
                    Haz clic para subir o arrastra el archivo aquí
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos permitidos: JPG, PNG, HEIC, PDF (máx. 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {previewUrl ? (
                    <div className="flex-shrink-0">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modo de validación */}
          {selectedFile && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <Label>Modo de Validación</Label>
              <RadioGroup value={validationMode} onValueChange={(value) => setValidationMode(value as 'automatic' | 'manual')}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="automatic" id="automatic" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="automatic" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="font-medium">Automático (Recomendado)</span>
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      El certificado se marcará como vigente automáticamente. Fecha de vencimiento: +1 año desde la fecha de carga.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="manual" id="manual" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="manual" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium">Manual</span>
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tú decides si el certificado es válido o no.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Fechas - Solo visible en modo automático con archivo seleccionado */}
          {validationMode === 'automatic' && selectedFile && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Fechas del Certificado
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-date" className="text-sm">
                    Fecha de Último Chequeo
                  </Label>
                  <Input
                    id="upload-date"
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fecha en la que se realizó el chequeo médico
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration-date" className="text-sm">
                    Fecha de Vencimiento
                  </Label>
                  <Input
                    id="expiration-date"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se calcula automáticamente (+1 año desde el último chequeo)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Validez automática calculada</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes ajustar las fechas si es necesario antes de guardar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de validez - Solo visible en modo manual */}
          {validationMode === 'manual' && !selectedFile && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <Label>Estado del Apto Físico</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isValid ? 'Certificado Vigente' : 'Certificado No Vigente'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isValid 
                        ? 'El atleta puede entrenar normalmente'
                        : 'El atleta necesita renovar su apto físico'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isValid}
                  onCheckedChange={setIsValid}
                />
              </div>
            </div>
          )}

          {validationMode === 'manual' && selectedFile && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <Label>Estado del Apto Físico</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isValid ? 'Certificado Vigente' : 'Certificado No Vigente'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isValid 
                        ? 'El atleta puede entrenar normalmente'
                        : 'El atleta necesita renovar su apto físico'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isValid}
                  onCheckedChange={setIsValid}
                />
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> {validationMode === 'automatic' 
                ? 'Al usar el modo automático, el sistema asignará automáticamente una fecha de vencimiento de 1 año desde la fecha de carga.'
                : 'Revisa el certificado antes de marcarlo como vigente. Es tu responsabilidad verificar que el apto físico sea válido para la actividad deportiva.'
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isUploading}
            className="bg-accent hover:bg-accent/90"
          >
            {isUploading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
