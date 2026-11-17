import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import api from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, AlertCircle, CheckCircle, RefreshCw, LogIn, LogOut } from 'lucide-react';

export default function QRScannerModal({
  isOpen,
  onClose,
  defaultMode = 'entry', // 'entry' or 'exit'
  onVerificationSuccess
}) {
  const [gateMode, setGateMode] = useState(defaultMode);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    setGateMode(defaultMode);
    setError('');
    setSuccessResult(null);
    setManualCode('');
    setCameraError('');
  }, [isOpen, defaultMode]);

  // Manage Camera Scanner lifecycle
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || successResult) {
      stopScanner();
      return;
    }

    let isMounted = true;

    async function startScanner() {
      try {
        setCameraError('');
        const qrCode = new Html5Qrcode('qr-reader-target');
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isMounted) {
              handleVerify(decodedText, 'qr_scan');
            }
          },
          (errorMessage) => {
            // scanning frames
          }
        );
      } catch (err) {
        if (isMounted) {
          console.warn('Camera initialization notice:', err);
          setCameraError('Camera access unavailable or permission denied. Please switch to Manual Code Entry.');
          setActiveTab('manual');
        }
      }
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
      isMounted = false;
    };
  }, [isOpen, activeTab, successResult]);

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
          html5QrCodeRef.current = null;
        });
      } catch (e) {
        html5QrCodeRef.current = null;
      }
    }
  };

  const handleVerify = async (codeToVerify, method = 'manual_code') => {
    if (!codeToVerify || loading) return;

    setLoading(true);
    setError('');
    stopScanner();

    try {
      const endpoint = gateMode === 'entry' ? '/sessions/entry' : '/sessions/exit';
      const payload = {
        qr_data: codeToVerify,
        booking_id: typeof codeToVerify === 'string' && codeToVerify.startsWith('PE-') ? codeToVerify.trim() : undefined,
        method
      };

      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        setSuccessResult({
          mode: gateMode,
          data: res.data.session || res.data.summary,
          message: res.data.message
        });

        if (onVerificationSuccess) {
          onVerificationSuccess(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Invalid or expired pass.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError('Please enter a valid Booking ID.');
      return;
    }
    handleVerify(manualCode.trim(), 'manual_code');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={gateMode === 'entry' ? 'Gate Verification: Vehicle Entry' : 'Gate Verification: Vehicle Exit'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Mode Selector Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setGateMode('entry');
              setSuccessResult(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              gateMode === 'entry' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Vehicle Entry
          </button>
          <button
            type="button"
            onClick={() => {
              setGateMode('exit');
              setSuccessResult(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              gateMode === 'exit' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            Vehicle Exit
          </button>
        </div>

        {/* Success Card Result */}
        {successResult ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="h-6 w-6" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-emerald-950">
                {successResult.mode === 'entry' ? 'Entry Authorized!' : 'Exit Authorized!'}
              </h4>
              <p className="text-xs text-emerald-700 mt-1">{successResult.message}</p>
            </div>

            <div className="bg-white/90 rounded-xl p-3 text-left text-xs space-y-1.5 border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Number:</span>
                <span className="font-mono font-bold text-slate-900">{successResult.data.slot_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Faculty:</span>
                <span className="font-semibold text-slate-800">{successResult.data.faculty_name}</span>
              </div>
              {successResult.data.duration_hours && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Duration:</span>
                  <span className="font-bold text-emerald-600">{successResult.data.duration_hours} hrs</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessResult(null);
                  setError('');
                  setManualCode('');
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white"
              >
                Scan Next Vehicle
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Input Method Selector */}
            <div className="flex border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2 font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'camera'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                Camera QR Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'manual'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Keyboard className="h-3.5 w-3.5" />
                Manual Booking ID
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Camera View */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center border border-slate-800">
                  <div id="qr-reader-target" className="w-full h-full" />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs">
                      <RefreshCw className="h-6 w-6 animate-spin text-brand-400 mb-2" />
                      <span>Validating pass with gate controller...</span>
                    </div>
                  )}
                </div>
                {cameraError && (
                  <p className="text-[11px] text-amber-600 text-center font-medium">{cameraError}</p>
                )}
                <p className="text-[11px] text-slate-400 text-center">
                  Point camera at the faculty member's QR code pass on their mobile screen.
                </p>
              </div>
            )}

            {/* Manual Text Input View */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Booking ID / Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PE-20261104-A103"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Format: PE-YYYYMMDD-XXXX
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Verifying...' : `Verify ${gateMode === 'entry' ? 'Gate Entry' : 'Gate Exit'}`}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

