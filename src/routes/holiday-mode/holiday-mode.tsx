import { useEffect, useState } from 'react';
import {
  Button,
  Container,
  DatePicker,
  Heading,
  Switch,
  Text,
  Textarea,
  toast
} from '@medusajs/ui';
import { useHolidayMode, useUpdateHolidayMode } from '../../hooks/api/holiday-mode';
import { useMe } from '../../hooks/api/users';
import { useForm } from 'react-hook-form';
import { HolidayModeDetails } from './components/holiday-mode-details';

interface HolidayModeFormValues {
  is_holiday_mode: boolean;
  holiday_start_date: Date | null;
  holiday_end_date: Date | null;
  holiday_message: string;
}

export const HolidayMode = () => {
  const { seller, isLoading: isLoadingUser } = useMe();
  
  // State to control whether to show form or details view
  const [showForm, setShowForm] = useState(true);
  
  // We use the useMe hook which gives us the seller directly
  const { holidayMode, isLoading: isLoadingHoliday, refetch } = useHolidayMode();
  const { mutateAsync: updateHolidayMode, isPending: isSubmitting } = useUpdateHolidayMode();
  
  const isLoading = isLoadingUser || isLoadingHoliday;
  
  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HolidayModeFormValues>({
    defaultValues: {
      is_holiday_mode: false,
      holiday_start_date: null,
      holiday_end_date: null,
      holiday_message: '',
    },
  });
  
  const isEnabled = watch('is_holiday_mode');

  // Initialize form from API data
  useEffect(() => {
    if (holidayMode) {
      setValue('is_holiday_mode', holidayMode.is_holiday_mode);
      setValue('holiday_start_date', holidayMode.holiday_start_date ? new Date(holidayMode.holiday_start_date) : null);
      setValue('holiday_end_date', holidayMode.holiday_end_date ? new Date(holidayMode.holiday_end_date) : null);
      setValue('holiday_message', holidayMode.holiday_message || '');
    }
  }, [holidayMode, setValue]);
  
  // Handle switching to edit mode
  const handleEdit = () => {
    setShowForm(true);
  };

  // Form submission handler
  const onSubmit = async (data: HolidayModeFormValues) => {
    if (!seller?.id) {
      toast.error('Nie można zaktualizować ustawień - brak identyfikatora sprzedawcy');
      return;
    }
    
    try {
      await updateHolidayMode({
        enabled: data.is_holiday_mode,
        startDate: data.holiday_start_date ? data.holiday_start_date.toISOString() : null,
        endDate: data.holiday_end_date ? data.holiday_end_date.toISOString() : null,
        message: data.holiday_message,
      });
      
      // Refresh holiday mode data
      await refetch();
      
      toast.success('Ustawienia trybu wakacyjnego zostały pomyślnie zaktualizowane');
      
      // Switch to details view after successful update
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update holiday mode:', error);
      toast.error('Nie udało się zaktualizować ustawień trybu wakacyjnego');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Text>Ładowanie...</Text></div>;
  }
  
  if (!seller?.id) {
    return (
      <div className="p-6 border rounded-lg bg-ui-bg-base">
        <Text className="text-ui-fg-subtle">Nie można załadować ustawień trybu wakacyjnego. Nie znaleziono identyfikatora sprzedawcy.</Text>
        {seller && (
          <div className="mt-4 p-3 border-t border-ui-border-base">
            <Text className="text-xs text-ui-fg-muted">Debug info: {JSON.stringify(seller)}</Text>
          </div>
        )}
      </div>
    );
  }
  
  // If not showing form and we have holiday mode data, show the details view
  if (!showForm && holidayMode) {
    return <HolidayModeDetails holidayMode={holidayMode} onEdit={handleEdit} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Container className="border rounded-lg shadow-sm bg-ui-bg-base">
        <div className="px-6 pt-6 pb-4">
          <Heading level="h2">Tryb wakacyjny</Heading>
          <Text className="text-ui-fg-subtle mt-2">
            Ustaw sklep w tryb wakacyjny, gdy planowany jest twój wyjazd lub przerwa w działalności.
          </Text>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6 p-2">
            <div>
              <Text className="font-medium">Włącz tryb wakacyjny</Text>
              <Text className="text-ui-fg-subtle text-sm">
                Kiedy tryb wakacyjny jest włączony, klienci będą widzieć komunikat o twoim tymczasowym zamknięciu.
              </Text>
            </div>
            <Switch
              {...register('is_holiday_mode')}
              checked={isEnabled}
              onCheckedChange={(checked) => setValue('is_holiday_mode', checked)}
            />
          </div>
          
          {isEnabled && (
            <div className="grid gap-y-4">
              <div>
                <Text className="font-medium mb-2 block">
                  Data początkowa*
                </Text>
                <DatePicker 
                  {...register('holiday_start_date', { 
                    required: isEnabled ? "Data początkowa jest wymagana" : false 
                  })}
                  value={watch('holiday_start_date')}
                  onChange={(date) => setValue('holiday_start_date', date)}
                />
                {errors.holiday_start_date && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.holiday_start_date.message}
                  </Text>
                )}
              </div>
              
              <div>
                <Text className="font-medium mb-2 block">
                  Data końcowa
                </Text>
                <DatePicker 
                  {...register('holiday_end_date')}
                  value={watch('holiday_end_date')}
                  onChange={(date) => setValue('holiday_end_date', date)}
                />
              </div>
              
              <div>
                <Text className="font-medium mb-2 block">
                  Wiadomość dla klientów
                </Text>
                <Textarea 
                  {...register('holiday_message')}
                  placeholder="Wpisz wiadomość, która będzie wyświetlana klientom podczas twojej nieobecności"
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-ui-border-base flex justify-end">
          <Button 
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
          >
            Zapisz
          </Button>
        </div>
      </Container>
    </form>
  );
};
