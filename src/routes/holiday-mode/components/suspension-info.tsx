import { useState, useEffect } from 'react';
import {
  Heading,
  Text,
  Badge,
  clx,
} from '@medusajs/ui';
import { useMe } from '../../../hooks/api/users';
import { useSuspensionStatus } from '../../../hooks/api/suspension';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export const SuspensionInfo = () => {
  const { seller } = useMe();
  const vendorId = seller?.id || '';
  const { suspensionStatus, isLoading } = useSuspensionStatus(vendorId);
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie określono';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: pl });
    } catch (e) {
      return 'Nieprawidłowa data';
    }
  };

  // Get status badge based on suspension state
  const getSuspensionBadge = () => {
    if (!suspensionStatus?.is_suspended) {
      return <Badge className="bg-green-100 text-green-800">Aktywny</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800">Zawieszony</Badge>;
  };
  
  if (isLoading || !suspensionStatus) {
    return <div className="flex justify-center p-12"><Text>Ładowanie...</Text></div>;
  }

  return (
    <div className="border bg-ui-bg-base mt-6 rounded-lg">
      <div className="px-6 pt-6 pb-4 border-b bg-ui-bg-base">
        <Heading level="h2">Status zawieszenia</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          Informacje o statusie konta i ewentualnych zawieszeniach.
        </Text>
      </div>
      
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Text className="font-medium">Status konta</Text>
          <div>
            {getSuspensionBadge()}
          </div>
        </div>
        
        {suspensionStatus?.is_suspended && suspensionStatus && (
          <div className="grid gap-y-4 mt-4 border-t border-ui-border-base pt-4">
            {suspensionStatus.suspension_reason && (
              <div>
                <Text className="font-medium mb-1 block">Powód zawieszenia</Text>
                <Text className="text-ui-fg-subtle">
                  {suspensionStatus.suspension_reason}
                </Text>
              </div>
            )}
            
            {suspensionStatus.suspended_at && (
              <div>
                <Text className="font-medium mb-1 block">Data zawieszenia</Text>
                <Text className="text-ui-fg-subtle">
                  {formatDate(suspensionStatus.suspended_at)}
                </Text>
              </div>
            )}
            
            {suspensionStatus.suspension_expires_at && (
              <div>
                <Text className="font-medium mb-1 block">Data wygaśnięcia zawieszenia</Text>
                <Text className="text-ui-fg-subtle">
                  {formatDate(suspensionStatus.suspension_expires_at)}
                </Text>
              </div>
            )}
            
            <div className="p-4 bg-ui-bg-base rounded border border-ui-border-base mt-2">
              <Text className="text-ui-fg-subtle">
                Twoje konto zostało zawieszone przez administrację. Kontakt w sprawie zawieszenia: <a href="mailto:sayuri.platform@gmail.com" className="underline">sayuri.platform@gmail.com lub wiadomości do admina</a>
              </Text>
            </div>
          </div>
        )}
        
        {!suspensionStatus?.is_suspended && (
          <div className="p-4 bg-ui-bg-base rounded border border-ui-border-base mt-2">
            <Text className="text-ui-fg-subtle">
              Twoje konto jest aktywne. Nie ma żadnych ograniczeń ani zawieszeń.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
