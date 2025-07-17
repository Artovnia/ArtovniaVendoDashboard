import { Button, Container, Heading, Text } from '@medusajs/ui';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface HolidayModeDetailsProps {
  holidayMode: {
    is_holiday_mode: boolean;
    holiday_start_date: string | Date | null;
    holiday_end_date: string | Date | null;
    holiday_message: string | null;
    status?: string;
  };
  onEdit: () => void;
}

export const HolidayModeDetails = ({ holidayMode, onEdit }: HolidayModeDetailsProps) => {
  // Format dates for display
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Nie ustawiono';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'PPP', { locale: pl });
    } catch (error) {
      return 'Nieprawidłowa data';
    }
  };
  
  const startDate = formatDate(holidayMode.holiday_start_date);
  const endDate = formatDate(holidayMode.holiday_end_date);
  
  // Determine current status and style
  const getStatusInfo = () => {
    if (!holidayMode.is_holiday_mode) {
      return { 
        label: 'Wyłączony', 
        className: 'bg-gray-100 text-gray-700'
      };
    }
    
    const now = new Date();
    const start = holidayMode.holiday_start_date ? new Date(holidayMode.holiday_start_date) : null;
    const end = holidayMode.holiday_end_date ? new Date(holidayMode.holiday_end_date) : null;
    
    if (start && now < start) {
      return { 
        label: 'Zaplanowany', 
        className: 'bg-amber-100 text-amber-700'
      };
    }
    
    if (end && now > end) {
      return { 
        label: 'Zakończony', 
        className: 'bg-gray-100 text-gray-700'
      };
    }
    
    if ((start && now >= start) && (!end || now <= end)) {
      return { 
        label: 'Aktywny', 
        className: 'bg-green-100 text-green-700'
      };
    }
    
    return { 
      label: 'Włączony', 
      className: 'bg-green-100 text-green-700'
    };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <Container className="bg-ui-bg-base rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <Heading level="h2">Szczegóły trybu wakacyjnego</Heading>
        <Button onClick={onEdit} variant="secondary">Edytuj</Button>
      </div>
      
      <div className="grid gap-y-4">
        <div className="flex items-center gap-x-2">
          <Text className="font-medium">Status:</Text>
          <span className={`px-2 py-1 rounded-full text-sm ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div>
          <Text className="font-medium">Tryb wakacyjny:</Text>
          <Text>{holidayMode.is_holiday_mode ? 'Włączony' : 'Wyłączony'}</Text>
        </div>
        
        <div>
          <Text className="font-medium">Data początkowa:</Text>
          <Text>{startDate}</Text>
        </div>
        
        <div>
          <Text className="font-medium">Data końcowa:</Text>
          <Text>{endDate}</Text>
        </div>
        
        <div>
          <Text className="font-medium">Wiadomość dla klientów:</Text>
          <div className="mt-1 p-4 border rounded-md bg-gray-50">
            {holidayMode.holiday_message ? (
              <Text>{holidayMode.holiday_message}</Text>
            ) : (
              <Text className="text-ui-fg-subtle italic">Brak wiadomości</Text>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};
