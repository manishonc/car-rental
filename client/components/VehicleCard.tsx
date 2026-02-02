import { Vehicle } from '@/lib/api/types';
import {
  Loader2,
  Users,
  Settings2,
  Fuel,
  CarFront,
  Briefcase,
  Gauge
} from 'lucide-react';
import Image from 'next/image';

interface VehicleCardProps {
  vehicle: Vehicle;
  onBook?: (vehicle: Vehicle) => void;
  isLoading?: boolean;
}

export function VehicleCard({ vehicle, onBook, isLoading }: VehicleCardProps) {
  // Build features array - only include items with valid data
  const features = [
    vehicle.number_seats > 0 && {
      icon: Users,
      label: `${vehicle.number_seats} Seats`
    },
    vehicle.transmission && {
      icon: Settings2,
      label: vehicle.transmission
    },
    vehicle.fuel && {
      icon: Fuel,
      label: vehicle.fuel
    },
    (vehicle.large_bags > 0 || vehicle.small_bags > 0) && {
      icon: Briefcase,
      label: `${vehicle.large_bags + vehicle.small_bags} Bags`
    },
    vehicle.mileage_limit && {
      icon: Gauge,
      label: vehicle.mileage_limit
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string }[];

  return (
    <div className="surface-card rounded-[2rem] p-6 flex flex-col group relative overflow-hidden">
      {/* Header: Title + Price side by side */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900 leading-tight">
            {vehicle.brand} {vehicle.mark}
          </h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
            {vehicle.type || vehicle.group || `${vehicle.year}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-slate-900">
            {vehicle.currency} {parseFloat(vehicle.price.toString()).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">/day</p>
        </div>
      </div>

      {/* Image Container - rounded inside card */}
      <div className="relative h-48 w-full bg-slate-100 rounded-2xl mb-6 overflow-hidden">
        {vehicle.thumbnail ? (
          <Image
            src={vehicle.thumbnail}
            alt={`${vehicle.brand} ${vehicle.mark}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <CarFront className="w-16 h-16 text-slate-300" />
          </div>
        )}
      </div>

      {/* Specs Row */}
      {features.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 border-t border-slate-100 pt-4 overflow-hidden">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 shrink-0"
            >
              <feature.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[7rem]">{feature.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total Price (if available) */}
      {vehicle.total_price && parseFloat(vehicle.total_price) > 0 && (
        <div className="mb-4 text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-900">{vehicle.currency} {parseFloat(vehicle.total_price.toString()).toLocaleString()}</span>
        </div>
      )}

      {/* Select Button */}
      {onBook && (
        <button
          type="button"
          onClick={() => onBook(vehicle)}
          disabled={isLoading}
          className="w-full py-3 rounded-xl border border-slate-200 text-slate-900 font-semibold hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none mt-auto"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            'Select'
          )}
        </button>
      )}
    </div>
  );
}
