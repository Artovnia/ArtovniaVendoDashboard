import { useTranslation } from 'react-i18next'
import { Text } from '@medusajs/ui'

interface ImportingContentProps {
  isComplete: boolean
  importResult: { successful: number; failed: number } | null
  isImporting: boolean
}

export function ImportingContent({
  isComplete,
  importResult,
  isImporting,
}: ImportingContentProps) {
  const { t } = useTranslation()

  if (isImporting) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <svg 
          className="h-12 w-12 animate-spin text-ui-fg-muted" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <Text className="mt-4 text-lg font-medium">
          {t('baselinker.import.importing', { defaultValue: 'Importing products...' })}
        </Text>
        <Text className="text-ui-fg-subtle">
          {t('baselinker.import.pleaseWait', { defaultValue: 'Please wait, this may take a few minutes.' })}
        </Text>
      </div>
    )
  }

  if (isComplete && importResult) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <svg 
          className="h-16 w-16 text-ui-fg-interactive" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
        <Text className="mt-4 text-2xl font-semibold text-ui-fg-base">
          {t('baselinker.import.complete', { defaultValue: 'Import Complete!' })}
        </Text>
        <Text className="mt-2 text-ui-fg-subtle">
          {t('baselinker.import.successMessage', {
            defaultValue: `Successfully imported ${importResult.successful} products.`,
            count: importResult.successful,
          })}
        </Text>
        {importResult.failed > 0 && (
          <Text className="mt-1 text-amber-600">
            {t('baselinker.import.failedMessage', {
              defaultValue: `${importResult.failed} products failed to import.`,
              count: importResult.failed,
            })}
          </Text>
        )}
      </div>
    )
  }

  return null
}
