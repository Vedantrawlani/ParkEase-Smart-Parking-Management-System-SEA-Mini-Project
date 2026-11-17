import React from 'react';
import { Car, Zap, Accessibility, Crown, Lock } from 'lucide-react';

export default function SlotCard({ slot, onSelect, isSelected }) {
  // Status Theme Mapping (Strictly from SRS)
  // Available - Green, Occupied - Red, Reserved - Blue, Unavailable - Grey
  const statusConfig = {
    available: {
      label: 'Available',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cardBorder: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/20',
      indicatorBg: 'bg-emerald-500',
      actionText: 'Click to Reserve',
      cursor: 'cursor-pointer hover:-translate-y-1 hover:shadow-md'
    },
    occupied: {
      label: 'Occupied',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      cardBorder: 'border-rose-200 bg-rose-50/20',
      indicatorBg: 'bg-rose-500',
      actionText: 'Vehicle Parked',
      cursor: 'cursor-not-allowed opacity-90'
    },
    reserved: {
      label: 'Reserved',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      cardBorder: 'border-blue-200 bg-blue-50/20',
      indicatorBg: 'bg-blue-500',
      actionText: 'Allocated/Booked',
      cursor: 'cursor-not-allowed opacity-90'
    },
    unavailable: {
      label: 'Unavailable',
      badgeBg: 'bg-slate-200 text-slate-700 border-slate-300',
      cardBorder: 'border-slate-200 bg-slate-50',
      indicatorBg: 'bg-slate-400',
      actionText: 'Maintenance',
      cursor: 'cursor-not-allowed opacity-60'
    }
  };

  const currentTheme = statusConfig[slot.status] || statusConfig.available;

  const renderTypeIcon = () => {
    switch (slot.slot_type) {
      case 'ev_charging':
        return <Zap className="h-3.5 w-3.5 text-amber-500" title="EV Fast Charging Station" />;
      case 'disabled':
        return <Accessibility className="h-3.5 w-3.5 text-indigo-500" title="Accessible Parking Bay" />;
      case 'vip_faculty':
        return <Crown className="h-3.5 w-3.5 text-yellow-600" title="Dean/Senior Faculty Reserved" />;
      default:
        return <Car className="h-3.5 w-3.5 text-slate-400" title="Standard 4-Wheeler Slot" />;
    }
  };

  const getTypeName = () => {
    switch (slot.slot_type) {
      case 'ev_charging': return 'EV Charging';
      case 'disabled': return 'Accessible';
      case 'vip_faculty': return 'Faculty VIP';
      default: return 'Standard';
    }
  };

  return (
    <div
      onClick={() => {
        if (slot.status === 'available' && onSelect) {
          onSelect(slot);
        }
      }}
      className={`relative rounded-2xl p-4 border-2 transition-all duration-200 ${currentTheme.cardBorder} ${currentTheme.cursor} ${
        isSelected ? 'ring-4 ring-brand-400 ring-offset-2' : ''
      }`}
    >
      {/* Top Bar: Slot ID and Status Indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm font-black text-slate-900 tracking-tight">
          {slot.slot_number}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentTheme.badgeBg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${currentTheme.indicatorBg}`}></span>
          {currentTheme.label}
        </span>
      </div>

      {/* Center Icon and Visual Parking Bay */}
      <div className="py-2 flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1">
          {renderTypeIcon()}
        </div>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {getTypeName()}
        </span>
      </div>

      {/* Footer Info: Area Code & Action */}
      <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">{slot.area_code || slot.area_name}</span>
        <span className={`text-[10px] font-bold ${slot.status === 'available' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
          {currentTheme.actionText}
        </span>
      </div>
    </div>
  );
}

