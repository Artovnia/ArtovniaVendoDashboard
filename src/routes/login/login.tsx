import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Heading,
  Hint,
  Input,
  Text,
} from '@medusajs/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as z from 'zod';

import { Form } from '../../components/common/form';
import { LanguageSwitcher } from '../../components/common/language-switcher/language-switcher';
import AvatarBox from '../../components/common/logo-box/avatar-box';
import { useDashboardExtension } from '../../extensions';
import { useSignInWithEmailPass } from '../../hooks/api';
import { isFetchError } from '../../lib/is-fetch-error';
import { useBackendHealth } from '../../hooks/use-backend-health';

const LoginSchema = (t: any) => z.object({
  email: z.string().email({ message: t('auth.validation.invalidEmail') }),
  password: z.string().min(1, { message: t('auth.validation.passwordRequired') }),
});

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getWidgets } = useDashboardExtension();
  const { isHealthy, isChecking, refresh } = useBackendHealth({
    checkOnMount: true,
    autoRetry: true,
    retryInterval: 15000,
  });

  const from = '/dashboard';

  const form = useForm<z.infer<ReturnType<typeof LoginSchema>>>({
    resolver: zodResolver(LoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutateAsync, isPending } =
    useSignInWithEmailPass();

  const handleSubmit = form.handleSubmit(
    async ({ email, password }) => {
      await mutateAsync(
        {
          email,
          password,
        },
        {
          onError: (error) => {
            if (isFetchError(error)) {
              if (error.status === 401) {
                form.setError('email', {
                  type: 'manual',
                  message: error.message,
                });

                return;
              }
            }

            // Check if this is a network error (backend down)
            const isNetworkError = 
              error.message === 'Failed to fetch' ||
              error.message?.includes('ERR_CONNECTION_REFUSED') ||
              error.message?.includes('NetworkError');
            
            if (isNetworkError) {
              form.setError('root.serverError', {
                type: 'manual',
                message: t('auth.errors.serverUnavailable', 'Serwer jest obecnie niedostępny. Spróbuj ponownie później.'),
              });
            } else {
              form.setError('root.serverError', {
                type: 'manual',
                message: error.message,
              });
            }
          },
          onSuccess: () => {
            setTimeout(() => {
              navigate(from, { replace: true });
            }, 1000);
          },
        }
      );
    }
  );

  const serverError =
    form.formState.errors?.root?.serverError?.message;
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message;

  // Show maintenance banner when backend is down
  const showMaintenanceBanner = isHealthy === false;

  return (
    <div className='bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center relative'>
      <div className='absolute top-4 right-4 z-10'>
        <LanguageSwitcher />
      </div>
      <div className='m-4 flex w-full max-w-[280px] flex-col items-center'>
        <AvatarBox />
        
        {/* Maintenance Banner */}
        {showMaintenanceBanner && (
          <Alert
            className='mb-4 w-full'
            variant='warning'
          >
            <div className='flex flex-col gap-2'>
              <Text size='small' weight='plus'>
                {t('auth.maintenance.title', 'Serwer niedostępny')}
              </Text>
              <Text size='small' className='text-ui-fg-subtle'>
                {t('auth.maintenance.description', 'Serwer jest obecnie w trakcie konserwacji. Logowanie może być niemożliwe.')}
              </Text>
              <Button
                variant='secondary'
                size='small'
                onClick={() => refresh()}
                isLoading={isChecking}
                className='mt-1'
              >
                {t('auth.maintenance.retry', 'Sprawdź ponownie')}
              </Button>
            </div>
          </Alert>
        )}
        <div className='mb-4 flex flex-col items-center'>
          <Heading>{t('auth.login.title')}</Heading>
          <Text
            size='small'
            className='text-ui-fg-subtle text-center'
          >
            {t('auth.login.subtitle')}
          </Text>
        </div>
        <div className='flex w-full flex-col gap-y-3'>
          {getWidgets('login.before').map(
            (Component, i) => {
              return <Component key={i} />;
            }
          )}
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className='flex w-full flex-col gap-y-6'
            >
              <div className='flex flex-col gap-y-1'>
                <Form.Field
                  control={form.control}
                  name='email'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            autoComplete='email'
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t('auth.login.emailPlaceholder')}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name='password'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{}</Form.Label>
                        <Form.Control>
                          <Input
                            type='password'
                            autoComplete='current-password'
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t('auth.login.passwordPlaceholder')}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
              </div>
              {validationError && (
                <div className='text-center'>
                  <Hint
                    className='inline-flex'
                    variant={'error'}
                  >
                    {validationError}
                  </Hint>
                </div>
              )}
              {serverError && (
                <Alert
                  className='bg-ui-bg-base items-center p-2'
                  dismissible
                  variant='error'
                >
                  {serverError}
                </Alert>
              )}
              <Button
                className='w-full'
                type='submit'
                isLoading={isPending}
              >
                {t('auth.login.submitButton')}
              </Button>
            </form>
          </Form>
          {getWidgets('login.after').map((Component, i) => {
            return <Component key={i} />;
          })}
        </div>
        <span className='text-ui-fg-muted txt-small my-6'>
          {t('auth.login.forgotPassword')}{' '}
          <Link
            key='reset-password-link'
            to='/reset-password'
            className='text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none'
          >
            {t('auth.login.resetPassword')}
          </Link>
        </span>
        {__DISABLE_SELLERS_REGISTRATION__ === 'false' && (
          <span className='text-ui-fg-muted txt-small'>
            {t('auth.login.noAccount')}{' '}
            <Link
              to='/register'
              className='text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none'
            >
              {t('auth.login.registerLink')}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
};
