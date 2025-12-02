import { Check } from '@medusajs/icons';
import { Button, clx, Heading } from '@medusajs/ui';
import { Link } from 'react-router-dom';

export const OnboardingRow = ({
  label,
  state,
  link,
  buttonLabel,
  disabled = false,
}: {
  label: string;
  state: boolean;
  link: string;
  buttonLabel: string;
  disabled?: boolean;
}) => {
  return (
    <div className='flex justify-between py-2'>
      <div className='flex items-center gap-3'>
        <div
          className={clx(
            'border w-6 h-6 rounded-full flex items-center justify-center',
            {
              'border-dashed ': !state,
              'border-current': state,
              'opacity-50': disabled,
            }
          )}
        >
          {state && <Check />}
        </div>
        <Heading className={clx('text-sm', { 'opacity-50': disabled })}>
          {label}
        </Heading>
      </div>
      {disabled ? (
        <Button className='min-w-20' disabled>
          {buttonLabel}
        </Button>
      ) : (
        <Link to={link}>
          <Button className='min-w-20'>{buttonLabel}</Button>
        </Link>
      )}
    </div>
  );
};
