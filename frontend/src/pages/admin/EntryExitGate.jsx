import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Keyboard,
  LogIn,
  LogOut,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Car,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function EntryExitGate() {
  const [gateMode, setGateMode] = useState('entry'); // 'entry' or 'exit'
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [recentGateLogs, setRecentGateLogs] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef(null);

  const fetchRecentLogs = async () => {
    try {
      const res = await api.get('/engineering/audit-logs?limit=8');
      if (res.data.success) {
        // filter for entry/exit events
        const gateLogs = res.data.logs.filter(
          l => l.action === 'VEHICLE_ENTRY_RECORDED' || l.action === 'VEHICLE_EXIT_RECORDED'
        );
        setRecentGateLogs(gateLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  // Manage Camera scanner
  useEffect(() => {
    if (activeTab !== 'camera' || successResult) {
      stopScanner();
      return;
    }

    let isMounted = true;
    async function startScanner() {
      try {
        setCameraError('');
        const qrCode = new Html5Qrcode('gate-terminal-camera');
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (isMounted) {
              handleVerify(decodedText, 'qr_scan');
            }
          },
          (err) => {}
        );
      } catch (err) {
        if (isMounted) {
          setCameraError('Camera access unavailable. Switched to manual booking ID input.');
          setActiveTab('manual');
        }
      }
    }

    const t = setTimeout(startScanner, 250);
    return () => {
      clearTimeout(t);
      stopScanner();
      isMounted = false;
    };
  }, [activeTab, successResult, gateMode]);

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
        fetchRecentLogs();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gate verification rejected. Please check booking reference.');
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-black text-slate-900">Campus Gate Verification Terminal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan QR codes from faculty mobile screens or input Booking IDs to authorize vehicle entry and exit.
        </p>
      </div>

      {/* Main Terminal Controller */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setGateMode('entry');
              setSuccessResult(null);
              setError('');
            }}
            className={`py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              gateMode === 'entry'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="h-4 w-4" />
            GATE IN: Vehicle Entry
          </button>

          <button
            type="button"
            onClick={() => {
              setGateMode('exit');
              setSuccessResult(null);
              setError('');
            }}
            className={`py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              gateMode === 'exit'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogOut className="h-4 w-4" />
            GATE OUT: Vehicle Exit
          </button>
        </div>

        {/* Success Card */}
        {successResult ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 animate-in fade-in">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-emerald-950">
                {successResult.mode === 'entry' ? 'ENTRY AUTHORIZED • GATE OPEN' : 'EXIT AUTHORIZED • GATE OPEN'}
              </h3>
              <p className="text-xs text-emerald-700 mt-1">{successResult.message}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-xs text-left max-w-md mx-auto space-y-2 border border-emerald-100 shadow-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Bay:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {successResult.data.slot_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Faculty Member:</span>
                <span className="font-bold text-slate-800">{successResult.data.faculty_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-mono text-brand-600 font-bold">{successResult.data.booking_id}</span>
              </div>
              {successResult.data.duration_hours && (
                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold">
                  <span className="text-slate-700">Total Duration:</span>
                  <span className="text-emerald-600">{successResult.data.duration_hours} hours</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessResult(null);
                  setError('');
                  setManualCode('');
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Scan Next Vehicle
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Method Tabs */}
            <div className="flex border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-3 font-bold border-b-2 flex items-center justify-center gap-2 transition ${
                  activeTab === 'camera'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Camera className="h-4 w-4" />
                Live Camera Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 font-bold border-b-2 flex items-center justify-center gap-2 transition ${
                  activeTab === 'manual'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Keyboard className="h-4 w-4" />
                Manual Booking ID Entry
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Camera View */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video max-w-lg mx-auto flex items-center justify-center border border-slate-800 shadow-inner">
                  <div id="gate-terminal-camera" className="w-full h-full" />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs">
                      <RefreshCw className="h-8 w-8 animate-spin text-brand-400 mb-2" />
                      <span className="font-bold">Authorizing pass with backend gate system...</span>
                    </div>
                  )}
                </div>
                {cameraError && (
                  <p className="text-xs text-amber-600 text-center font-medium">{cameraError}</p>
                )}
                <p className="text-xs text-slate-400 text-center">
                  Direct camera towards the QR pass displayed on faculty smartphone.
                </p>
              </div>
            )}

            {/* Manual Text Input View */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="max-w-md mx-auto space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Booking ID / Reference Passcode
                  </label>
                  <input
                    type="text"
                    placeholder="PE-20261104-XXXX"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-mono text-base uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50 text-center tracking-widest font-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className={`w-full py-3 rounded-2xl text-white font-bold text-xs transition shadow-md disabled:opacity-50 ${
                    gateMode === 'entry' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {loading ? 'Validating...' : `Authorize ${gateMode === 'entry' ? 'Gate Entry' : 'Gate Exit'}`}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Recent Gate Operations Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">Live Gate Access Log</h3>
        <div className="divide-y divide-slate-100">
          {recentGateLogs.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No recent gate activity.</div>
          ) : (
            recentGateLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black uppercase text-[9px] px-2 py-0.5 rounded-full ${
                      log.action === 'VEHICLE_ENTRY_RECORDED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {log.action === 'VEHICLE_ENTRY_RECORDED' ? 'ENTRY' : 'EXIT'}
                  </span>
                  <span className="font-mono font-bold text-slate-800">{log.record_id}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

