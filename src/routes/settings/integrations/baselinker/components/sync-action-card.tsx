import { Button, Text } from '@medusajs/ui'

interface SyncActionCardProps {
  title: string
  description: string
  buttonText: string
  onClick: () => void
  isLoading?: boolean
  icon?: React.ReactNode
}

export function SyncActionCard({
  title,
  description,
  buttonText,
  onClick,
  isLoading,
  icon,
}: SyncActionCardProps) {
  return (
    <div className="rounded-lg border border-ui-border-base p-4">
      <Text className="font-medium">{title}</Text>
      <Text className="text-sm text-ui-fg-subtle mb-3">{description}</Text>
      <Button size="small" onClick={onClick} isLoading={isLoading}>
        {icon}
        {buttonText}
      </Button>
    </div>
  )
}

export default SyncActionCard
