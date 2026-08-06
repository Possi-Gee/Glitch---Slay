import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface MapLinkButtonProps {
  lat: number;
  lng: number;
  label?: string;
}

export function MapLinkButton({ lat, lng, label = 'Open in Google Maps' }: MapLinkButtonProps) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  
  return (
    <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => window.open(url, '_blank')}
    >
      <MapPin className="h-4 w-4" />
      {label}
    </Button>
  );
}