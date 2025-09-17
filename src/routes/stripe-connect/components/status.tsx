import { CheckCircleSolid, ExclamationCircle, ClockSolid, ExclamationCircleSolid } from '@medusajs/icons';

interface StatusProps {
  status: string;
}

export const Status = ({ status }: StatusProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return {
          icon: <CheckCircleSolid className='w-4 h-4' />,
          label: 'Połączone',
          className: 'bg-ui-tag-green-bg text-ui-tag-green-text border-ui-tag-green-border'
        };
      case 'pending':
      case 'restricted':
        return {
          icon: <ClockSolid className='w-4 h-4' />,
          label: 'Oczekuje',
          className: 'bg-ui-tag-orange-bg text-ui-tag-orange-text border-ui-tag-orange-border'
        };
      case 'restricted_soon':
        return {
          icon: <ExclamationCircleSolid className='w-4 h-4' />,
          label: 'Wymaga akcji',
          className: 'bg-ui-tag-orange-bg text-ui-tag-orange-text border-ui-tag-orange-border'
        };
      case 'rejected':
        return {
          icon: <ExclamationCircleSolid className='w-4 h-4' />,
          label: 'Odrzucone',
          className: 'bg-ui-tag-red-bg text-ui-tag-red-text border-ui-tag-red-border'
        };
      case 'not connected':
      default:
        return {
          icon: <ExclamationCircle className='w-4 h-4' />,
          label: 'Niepołączone',
          className: 'bg-ui-tag-neutral-bg text-ui-tag-neutral-text border-ui-tag-neutral-border'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
      {statusConfig.icon}
      {statusConfig.label}
    </span>
  );
};

