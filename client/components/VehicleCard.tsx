import { Vehicle } from '@/lib/api/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Users, 
  Settings2, 
  Fuel, 
  CarFront,
  Briefcase,
  Check,
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
    <Card className="group overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-xl rounded-2xl bg-card">
      {/* Image Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60">
        {vehicle.thumbnail ? (
          <Image
            src={vehicle.thumbnail}
            alt={`${vehicle.brand} ${vehicle.mark}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <CarFront className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Category Badge */}
        {vehicle.group && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm text-foreground">
              {vehicle.group}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardHeader className="p-4 pb-3">
        {vehicle.type && (
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            {vehicle.type}
          </p>
        )}
        <h3 className="text-lg font-bold text-foreground leading-snug">
          {vehicle.brand} {vehicle.mark}
        </h3>
        <p className="text-sm text-muted-foreground">
          {vehicle.year}{vehicle.body_type ? ` • ${vehicle.body_type}` : ''}
        </p>
      </CardHeader>

      {/* Features - Only show if we have features */}
      {features.length > 0 && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg"
              >
                <feature.icon className="w-3.5 h-3.5 text-primary/60" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Price & Action */}
      <CardFooter className="p-4 pt-3 border-t border-border/30 bg-muted/5">
        <div className="flex flex-col w-full gap-3">
          <div className="flex items-end justify-between w-full">
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Price per day</span>
              <span className="text-xl font-bold text-foreground">
                {vehicle.currency} {parseFloat(vehicle.price.toString()).toLocaleString()}
              </span>
            </div>
            
            {vehicle.total_price && parseFloat(vehicle.total_price) > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Total</span>
                <span className="text-sm font-semibold text-foreground">
                  {vehicle.currency} {parseFloat(vehicle.total_price.toString()).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {onBook && (
            <Button 
              onClick={() => onBook(vehicle)} 
              className="w-full h-11 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Select Vehicle
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

