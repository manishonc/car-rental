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
  Snowflake,
  Check
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  vehicle: Vehicle;
  onBook?: (vehicle: Vehicle) => void;
  isLoading?: boolean;
}

export function VehicleCard({ vehicle, onBook, isLoading }: VehicleCardProps) {
  // Safe defaults for features
  const features = [
    { icon: Users, label: `${vehicle.number_seats} Seats`, value: vehicle.number_seats },
    { icon: Settings2, label: vehicle.transmission, value: vehicle.transmission },
    { icon: Fuel, label: vehicle.fuel, value: vehicle.fuel },
    // Only show bags if we have data > 0
    ...(vehicle.large_bags > 0 || vehicle.small_bags > 0 ? [{
      icon: Briefcase,
      label: `${vehicle.large_bags + vehicle.small_bags} Bags`,
      value: vehicle.large_bags + vehicle.small_bags
    }] : []),
  ];

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg rounded-xl bg-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50">
        {vehicle.thumbnail ? (
          <Image
            src={vehicle.thumbnail}
            alt={`${vehicle.brand} ${vehicle.mark}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/30">
            <CarFront className="w-20 h-20" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm text-foreground hover:bg-white/100">
            {vehicle.group}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col h-full">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{vehicle.type}</p>
              <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                {vehicle.brand} {vehicle.mark}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {vehicle.year} • {vehicle.body_type}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-2 flex-grow">
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <feature.icon className="w-4 h-4 text-primary/70 shrink-0" />
                <span className="truncate">{feature.label}</span>
              </div>
            ))}
            {/* Mileage limit if exists */}
            {vehicle.mileage_limit && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
               <span className="w-4 h-4 flex items-center justify-center font-bold text-primary/70 text-[10px] border border-primary/30 rounded-full shrink-0">KM</span>
               <span className="truncate">{vehicle.mileage_limit}</span>
             </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 pt-0 mt-auto border-t border-border/40 bg-muted/5">
          <div className="flex flex-col w-full gap-4 pt-4">
            <div className="flex items-end justify-between w-full">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Price per day</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">
                    {vehicle.currency} {parseFloat(vehicle.price.toString()).toLocaleString()}
                  </span>
                </div>
              </div>
              
              {vehicle.total_price && (
                <div className="flex flex-col items-end text-right">
                   <span className="text-xs text-muted-foreground">Total</span>
                   <span className="text-sm font-semibold">
                      {vehicle.currency} {parseFloat(vehicle.total_price.toString()).toLocaleString()}
                   </span>
                </div>
              )}
            </div>

            {onBook && (
              <Button 
                onClick={() => onBook(vehicle)} 
                className="w-full h-11 text-base font-medium shadow-md hover:shadow-lg transition-all" 
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
      </div>
    </Card>
  );
}
