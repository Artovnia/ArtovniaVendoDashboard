import { Switch, Text } from '@medusajs/ui'

interface SettingToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <Text className="font-medium text-ui-fg-base">{label}</Text>
        {description && <Text className="text-sm text-ui-fg-subtle">{description}</Text>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

export default SettingToggle
