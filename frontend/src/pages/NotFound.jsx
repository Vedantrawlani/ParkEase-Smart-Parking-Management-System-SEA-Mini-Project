import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="h-16 w-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <Car className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 font-mono">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-1">Parking Slot Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1">
        The page or resource you are looking for does not exist in the ParkEase system.
      </p>
      <Link
        to="/"
        className="mt-6 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition shadow-md flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}

