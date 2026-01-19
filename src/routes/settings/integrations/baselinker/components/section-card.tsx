import { Heading, Text } from '@medusajs/ui'

interface SectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: SectionCardProps) {
  return (
    <div className="rounded-lg border border-ui-border-base">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div>
          <Heading level="h2">{title}</Heading>
          {description && <Text className="text-sm text-ui-fg-subtle">{description}</Text>}
        </div>
        {action}
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

export default SectionCard
