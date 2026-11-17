import React from 'react';
import Modal from '../common/Modal';
import { Download, Printer, QrCode, ShieldCheck, MapPin, Calendar, Clock } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, booking }) {
  if (!booking) return null;

  const handleDownload = () => {
    if (!booking.qr_code_image) return;
    const link = document.createElement('a');
    link.href = booking.qr_code_image;
    link.download = `ParkEase-Pass-${booking.booking_id}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Parking Gate Pass"
      maxWidth="max-w-md"
    >
      <div className="text-center space-y-4">
        {/* Pass Card Container */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 text-left relative overflow-hidden">
          {/* Subtle watermark background */}
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
            <QrCode className="w-48 h-48 text-white" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
                ParkEase E-Pass
              </span>
              <h4 className="text-sm font-bold text-white">Faculty Parking Authorization</h4>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3" />
              VALIDATED
            </span>
          </div>

          {/* QR Code Presentation */}
          <div className="bg-white p-3 rounded-2xl mx-auto w-48 shadow-inner mb-4">
            {booking.qr_code_image ? (
              <img
                src={booking.qr_code_image}
                alt={`QR code for ${booking.booking_id}`}
                className="w-full h-auto object-contain rounded-lg"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg">
                <QrCode className="h-16 w-16 text-slate-400" />
              </div>
            )}
            <p className="text-slate-800 font-mono font-bold text-center text-xs mt-2">
              {booking.booking_id}
            </p>
          </div>

          {/* Pass Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Allocated Bay</span>
              <span className="font-mono text-base font-extrabold text-brand-400">{booking.slot_number}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Campus Area</span>
              <span className="font-bold text-white truncate block">{booking.area_name || booking.area_code}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Faculty Member</span>
              <span className="font-semibold text-slate-200 truncate block">{booking.faculty_name || 'Faculty Member'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Faculty ID</span>
              <span className="font-mono text-slate-300">{booking.faculty_id || 'FAC-MEMBER'}</span>
            </div>
          </div>

          {/* Time Window */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Window:</span>
            <span className="font-medium text-slate-200">
              {new Date(booking.start_time).toLocaleDateString()} {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="h-4 w-4" />
            Print Pass
          </button>
        </div>
      </div>
    </Modal>
  );
}

