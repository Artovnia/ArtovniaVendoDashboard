import { useTranslation } from 'react-i18next'
import { Badge } from '@medusajs/ui'
import { CheckCircleSolid, XCircleSolid } from '@medusajs/icons'

interface ConnectionStatusBadgeProps {
  isConnected: boolean
}

export function ConnectionStatusBadge({ isConnected }: ConnectionStatusBadgeProps) {
  const { t } = useTranslation()
  
  return (
    <Badge color={isConnected ? 'green' : 'grey'} className="flex items-center gap-1">
      {isConnected ? (
        <>
          <CheckCircleSolid className="w-3 h-3" />
          {t('baselinker.connected', { defaultValue: 'Connected' })}
        </>
      ) : (
        <>
          <XCircleSolid className="w-3 h-3" />
          {t('baselinker.notConnected', { defaultValue: 'Not Connected' })}
        </>
      )}
    </Badge>
  )
}

export default ConnectionStatusBadge
