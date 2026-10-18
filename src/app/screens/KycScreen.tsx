import React, { useState, useRef, useEffect } from 'react';
import type { KycRecord, IdType } from '../../types/index.ts';
import { dbEngine, CURRENT_INVESTOR } from '../../services/mockDatabase.ts';
import { validateKycCompleteness } from '../../services/tradingEngine.ts';
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  CheckCircle2,
  FileText,
  PenTool,
  Upload,
  User,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface KycScreenProps {
  kycRecord?: KycRecord;
  onKycUpdated: (record: KycRecord) => void;
}

export const KycScreen: React.FC<KycScreenProps> = ({ kycRecord, onKycUpdated }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [fullName, setFullName] = useState(kycRecord?.fullName || CURRENT_INVESTOR.name);
  const [idType, setIdType] = useState<IdType>(kycRecord?.idType || 'NATIONAL_ID');
  const [idNumber, setIdNumber] = useState(kycRecord?.idNumber || 'CI-00482910381');
  const [nationality, setNationality] = useState(kycRecord?.nationality || 'Ivoirienne');
  const [dateOfBirth, setDateOfBirth] = useState(kycRecord?.dateOfBirth || '1988-06-14');
  const [residentialAddress, setResidentialAddress] = useState(
    kycRecord?.residentialAddress || 'Cocody Riviera 3, Abidjan'
  );

  // Document uploads & previews
  const [idFrontImage, setIdFrontImage] = useState<string>(
    kycRecord?.idFrontImage ||
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'
  );
  const [selfieImage, setSelfieImage] = useState<string>(
    kycRecord?.selfieImage ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
  );

  // Biometric simulator state
  const [isCapturingSelfie, setIsCapturingSelfie] = useState(false);
  const [livenessScore, setLivenessScore] = useState<number>(98.2);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(Boolean(kycRecord?.signatureDataUrl));
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>(kycRecord?.signatureDataUrl || '');

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canvas drawing handlers
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && signatureDataUrl && !hasDrawnSignature) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = signatureDataUrl;
      }
    }
  }, [step]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureDataUrl(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
    setSignatureDataUrl('');
  };

  const handleSimulateSelfieCapture = () => {
    setIsCapturingSelfie(true);
    setTimeout(() => {
      setIsCapturingSelfie(false);
      setLivenessScore(98.8);
      setSelfieImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80');
    }, 1200);
  };

  const handleSubmitKyc = () => {
    setValidationErrors([]);
    const validation = validateKycCompleteness({
      fullName,
      idNumber,
      idFrontImage,
      selfieImage,
      signatureDataUrl: signatureDataUrl || 'data:image/svg+xml;utf8,<svg><path d="M10 10 L50 50"/></svg>',
    });

    if (!validation.isValid) {
      setValidationErrors(validation.missingFields);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const record = dbEngine.submitKyc({
        fullName,
        idType,
        idNumber,
        nationality,
        dateOfBirth,
        residentialAddress,
        idFrontImage,
        selfieImage,
        signatureDataUrl: signatureDataUrl || 'data:image/svg+xml;utf8,<svg><path d="M10 10 L50 50"/></svg>',
      });
      setIsSubmitting(false);
      onKycUpdated(record);
      setStep(4);
    }, 800);
  };

  return (
    <div className="flex flex-col space-y-4 px-4 py-2">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-100">Procédure KYC Réglementaire</h1>
        <p className="text-[11px] text-slate-400">
          Agrément AMF-UMOA (BCEAO / CREPMF) · Validation SGI
        </p>
      </div>

      {/* Status Card if Already Submitted or Verified */}
      {kycRecord && (
        <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
          kycRecord.status === 'VERIFIED'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : kycRecord.status === 'SUBMITTED'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              {kycRecord.status === 'VERIFIED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {kycRecord.status === 'SUBMITTED' && <Clock className="w-4 h-4 text-amber-400" />}
              {kycRecord.status === 'REJECTED' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              Statut: {kycRecord.status === 'VERIFIED' ? 'Compte Titres Validé' : kycRecord.status === 'SUBMITTED' ? 'En attente de revue SGI' : 'Pièces demandées'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">Dossier: {kycRecord.id}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {kycRecord.status === 'VERIFIED'
              ? `Votre identité a été vérifiée par ${kycRecord.reviewedBy || 'la SGI'}. Vous bénéficiez de plafonds de négociation illimités.`
              : 'Vos pièces justificatives (CNI/Passeport, selfie biométrique et signature) sont transmises à la société de gestion SGI Boom Capital.'}
          </p>
        </div>
      )}

      {/* Multi-step progress bar */}
      <div className="flex items-center justify-between px-2 text-[11px]">
        {[
          { num: 1, label: 'Pièce ID' },
          { num: 2, label: 'Selfie' },
          { num: 3, label: 'Signature' },
          { num: 4, label: 'Statut' },
        ].map(s => (
          <div
            key={s.num}
            onClick={() => setStep(s.num as any)}
            className={`flex flex-col items-center cursor-pointer transition-colors ${
              step === s.num ? 'text-amber-400 font-bold' : step > s.num ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 border ${
              step === s.num
                ? 'bg-amber-500/20 border-amber-400 text-amber-400 font-bold'
                : step > s.num
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Identity & ID document */}
      {step === 1 && (
        <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Étape 1 : Identité & Justificatif Officiel</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Nom Complet (selon pièce d'identité)</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Type de Document</label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value as IdType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="NATIONAL_ID">Carte Nationale (CNI)</option>
                <option value="PASSPORT">Passeport CEDEAO</option>
                <option value="RESIDENCE_PERMIT">Carte de Séjour</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Numéro du Document</label>
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Photo Recto de la Pièce d'Identité</label>
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-32 flex items-center justify-center group">
              <img
                src={idFrontImage}
                alt="Pièce d'identité recto"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] font-semibold text-white bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Document Chargé</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Continuer vers le Selfie Biométrique
          </button>
        </div>
      )}

      {/* Step 2: Biometric Selfie Capture */}
      {step === 2 && (
        <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Étape 2 : Liveness & Selfie Biométrique</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Prenez une photo de votre visage sans lunettes ni couvre-chef pour certifier la concordance avec la CNI.
          </p>

          {/* Camera Frame Simulator */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/50 bg-slate-950 h-52 flex flex-col items-center justify-center p-2">
            <img
              src={selfieImage}
              alt="Selfie biométrique"
              className="w-full h-full object-cover rounded-xl"
            />
            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-44 rounded-[50%] border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-end justify-center pb-2">
                <span className="text-[9px] font-mono text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full">
                  Aligner le visage
                </span>
              </div>
            </div>

            {isCapturingSelfie && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-amber-400 space-y-2">
                <RefreshCw className="w-7 h-7 animate-spin" />
                <span className="text-xs font-mono font-bold">Vérification de vitalité 3D...</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Score de Vitalité Biométrique:</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">
              {livenessScore}% (Conforme AMF)
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSimulateSelfieCapture}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Reprendre la Photo</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Passer à la Signature
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Interactive Signature Pad */}
      {step === 3 && (
        <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-slate-800 pb-2">
            <PenTool className="w-4 h-4 text-amber-400" />
            <span>Étape 3 : Signature Électronique Réglementaire</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Signez avec votre doigt ou la souris à l'intérieur du cadre ci-dessous :
          </p>

          {/* Interactive HTML5 Canvas Pad */}
          <div className="rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={340}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 touch-none cursor-crosshair bg-slate-950"
            />
            {!hasDrawnSignature && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-600 font-medium">
                Dessinez votre signature ici
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearSignature}
              className="text-xs text-slate-400 hover:text-rose-400 underline"
            >
              Effacer la signature
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Certificat AES-256 eIDAS compliant
            </span>
          </div>

          {validationErrors.length > 0 && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              Veuillez compléter : {validationErrors.join(', ')}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700"
            >
              Retour
            </button>
            <button
              onClick={handleSubmitKyc}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmission SGI...' : 'Soumettre le Dossier à la SGI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Submission Confirmation */}
      {step === 4 && (
        <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Dossier KYC Transmis à la SGI</h3>
            <p className="text-xs text-slate-400 mt-1">
              Votre dossier est désormais en tête de file sur le portail administrateur de SGI Boom Capital.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Investisseur</span>
              <span className="text-white font-bold">{fullName}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pièce ({idType})</span>
              <span className="text-white">{idNumber}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Vitalité Faciale</span>
              <span className="text-emerald-400">98.8% Validé</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Signature</span>
              <span className="text-emerald-400">Enregistrée</span>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
          >
            Consulter ou Mettre à jour les Informations
          </button>
        </div>
      )}
    </div>
  );
};
