import { Button, Container, Heading, Text } from '@medusajs/ui';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  // Format dates for display
  const formatDate = (date: string | Date | null): string => {
    if (!date) return t('holidayMode.details.notSet', 'Not set');
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Use current language locale
      const locale = i18n.language === 'pl' ? pl : enUS;
      return format(dateObj, 'PPP', { locale });
    } catch (error) {
      return t('holidayMode.details.invalidDate', 'Invalid date');
    }
  };
  
  const startDate = formatDate(holidayMode.holiday_start_date);
  const endDate = formatDate(holidayMode.holiday_end_date);
  
  // Determine current status and style
  const getStatusInfo = (): { label: string; className: string } => {
    if (!holidayMode.is_holiday_mode) {
      return { 
        label: t('general.disabled', 'Disabled'), 
        className: 'bg-gray-100 text-gray-700'
      };
    }
    
    const now = new Date();
    const start = holidayMode.holiday_start_date ? new Date(holidayMode.holiday_start_date) : null;
    const end = holidayMode.holiday_end_date ? new Date(holidayMode.holiday_end_date) : null;
    
    if (start && now < start) {
      return { 
        label: t('holidayMode.status.planned', 'Planned'), 
        className: 'bg-amber-100 text-amber-700'
      };
    }
    
    if (end && now > end) {
      return { 
        label: t('holidayMode.status.ended', 'Ended'), 
        className: 'bg-gray-100 text-gray-700'
      };
    }
    
    if ((start && now >= start) && (!end || now <= end)) {
      return { 
        label: t('general.active', 'Active'), 
        className: 'bg-green-100 text-green-700'
      };
    }
    
    return { 
      label: t('general.enabled', 'Enabled'), 
      className: 'bg-green-100 text-green-700'
    };
  };
  
  const statusInfo = getStatusInfo();

  return (
    <Container className="bg-ui-bg-base rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <Heading level="h2">{t('holidayMode.details.title', 'Holiday Mode Details')}</Heading>
        <Button onClick={onEdit} variant="secondary">{t('holidayMode.details.edit', 'Edit')}</Button>
      </div>
      
      <div className="grid gap-y-4">
        <div className="flex items-center gap-x-2">
          <Text className="font-medium">{t('holidayMode.status.status', 'Status')}:</Text>
          <span className={`px-2 py-1 rounded-full text-sm ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div>
          <Text className="font-medium">{t('holidayMode.details.holidayMode', 'Holiday Mode')}:</Text>
          <Text>
            {holidayMode.is_holiday_mode 
              ? t('general.enabled', 'Enabled') 
              : t('general.disabled', 'Disabled')}
          </Text>
        </div>
        
        <div>
          <Text className="font-medium">{t('holidayMode.details.startDate', 'Start date')}:</Text>
          <Text>{startDate}</Text>
        </div>
        
        <div>
          <Text className="font-medium">{t('holidayMode.details.endDate', 'End date')}:</Text>
          <Text>{endDate}</Text>
        </div>
        
        <div>
          <Text className="font-medium">{t('holidayMode.details.message', 'Message for customers')}:</Text>
          <div className="mt-1 p-4 border rounded-md bg-gray-50">
            {holidayMode.holiday_message ? (
              <Text>{holidayMode.holiday_message}</Text>
            ) : (
              <Text className="text-ui-fg-subtle italic">{t('holidayMode.details.noMessage', 'No message')}</Text>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};
