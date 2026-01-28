import { Button, Container, Heading, Text, toast } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { useCreateVendorPage, TemplateDefinition } from '../../../hooks/api/vendor-page'

interface TemplateSelectorProps {
  templates?: Record<string, TemplateDefinition>
}

const TEMPLATE_ICONS: Record<string, string> = {
  minimal: '🎯',
  story: '📖',
  gallery: '🖼️',
  artisan: '🎨',
}

export const TemplateSelector = ({ templates }: TemplateSelectorProps) => {
  const { t } = useTranslation()
  const { mutateAsync: createPage, isPending } = useCreateVendorPage()

  const handleSelectTemplate = async (templateKey: string) => {
    try {
      await createPage(templateKey)
      toast.success(t('pagebuilder.templateSelector.pageCreated'))
    } catch (error) {
      toast.error(t('pagebuilder.templateSelector.pageCreationFailed'))
      console.error('Error creating page:', error)
    }
  }

  if (!templates) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">{t('pagebuilder.templateSelector.title')}</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          {t('pagebuilder.templateSelector.description')}
        </Text>
      </div>

      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">{t('pagebuilder.templateSelector.selectTemplate')}</Heading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(templates).map(([key, template]) => (
            <div
              key={key}
              className="border rounded-lg p-4 hover:border-ui-border-interactive transition-colors cursor-pointer"
              onClick={() => !isPending && handleSelectTemplate(key)}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{TEMPLATE_ICONS[key] || '📄'}</div>
                <div className="flex-1">
                  <Heading level="h3" className="mb-1">
                    {template.name_pl || template.name}
                  </Heading>
                  <Text className="text-ui-fg-subtle text-sm">
                    {template.description_pl || template.description}
                  </Text>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.allowedBlocks.slice(0, 4).map((block) => (
                      <span
                        key={block}
                        className="text-xs bg-ui-bg-subtle px-2 py-0.5 rounded"
                      >
                        {block.replace('_', ' ')}
                      </span>
                    ))}
                    {template.allowedBlocks.length > 4 && (
                      <span className="text-xs text-ui-fg-subtle">
                        {t('pagebuilder.templateSelector.moreBlocks', { count: template.allowedBlocks.length - 4 })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="small"
                className="mt-3 w-full"
                isLoading={isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectTemplate(key)
                }}
              >
                {t('pagebuilder.templateSelector.select')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}
