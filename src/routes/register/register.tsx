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
import { Link } from 'react-router-dom';
import * as z from 'zod';

import { Form } from '../../components/common/form';
import { LanguageSwitcher } from '../../components/common/language-switcher/language-switcher';
import AvatarBox from '../../components/common/logo-box/avatar-box';
import { useSignUpWithEmailPass } from '../../hooks/api';
import { isFetchError } from '../../lib/is-fetch-error';
import { useState } from 'react';
import { useBackendHealth } from '../../hooks/use-backend-health';

const RegisterSchema = (t: any) => z.object({
  name: z
    .string()
    .min(2, { message: t('auth.validation.nameMinLength') }),
  email: z.string().email({ message: t('auth.validation.invalidEmail') }),
  password: z
    .string()
    .min(2, { message: t('auth.validation.passwordMinLength') }),
  confirmPassword: z.string().min(2, {
    message: t('auth.validation.confirmPasswordMinLength'),
  }),
  tax_id: z.string().optional(),
  product_description: z.string().min(1, { message: t('auth.validation.productDescriptionRequired') }),
  portfolio_link: z.string().refine(val => !val || val.startsWith('http'), { message: t('auth.validation.invalidUrl') }).optional(),
});

export const Register = () => {
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();
  const { isHealthy, isChecking, refresh } = useBackendHealth({
    checkOnMount: true,
    autoRetry: true,
    retryInterval: 15000,
  });

  const form = useForm<z.infer<ReturnType<typeof RegisterSchema>>>({
    resolver: zodResolver(RegisterSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      tax_id: '',
      product_description: '',
      portfolio_link: '',
    },
  });

  const { mutateAsync, isPending } =
    useSignUpWithEmailPass();

  const handleSubmit = form.handleSubmit(
    async ({ name, email, password, confirmPassword, tax_id, product_description, portfolio_link }) => {
      if (password !== confirmPassword) {
        form.setError('password', {
          type: 'manual',
          message: t('auth.validation.passwordMismatch'),
        });
        form.setError('confirmPassword', {
          type: 'manual',
          message: t('auth.validation.passwordMismatch'),
        });

        return null;
      }

      await mutateAsync(
        {
          name,
          email,
          password,
          confirmPassword,
          tax_id,
          product_description,
          portfolio_link,
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
            setSuccess(true);
          },
        }
      );
    }
  );

  const serverError =
    form.formState.errors?.root?.serverError?.message;
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.name?.message ||
    form.formState.errors.confirmPassword?.message;

  if (success)
    return (
      <div className='bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center relative'>
        <div className='absolute top-4 right-4 z-10'>
          <LanguageSwitcher />
        </div>
        <div className='mb-4 flex flex-col items-center'>
          <Heading>{t('auth.register.successTitle')}</Heading>
          <Text
            size='small'
            className='text-ui-fg-subtle text-center mt-2 max-w-[320px]'
          >
            {t('auth.register.successMessage')}
          </Text>

          <Link to='/login'>
            <Button className='mt-8'>
              {t('auth.register.backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    );

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
                {t('auth.maintenance.description', 'Serwer jest obecnie w trakcie konserwacji. Rejestracja może być niemożliwa.')}
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
          <Heading>{t('auth.register.title')}</Heading>
          <Text
            size='small'
            className='text-ui-fg-subtle text-center'
          >
            {t('auth.register.subtitle')}
          </Text>
        </div>
        <div className='flex w-full flex-col gap-y-3'>
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className='flex w-full flex-col gap-y-6'
            >
              <div className='flex flex-col gap-y-2'>
                <Form.Field
                  control={form.control}
                  name='name'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            {...field}
                            className='bg-ui-bg-field-component mb-2'
                            placeholder={t('auth.register.companyNamePlaceholder')}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name='email'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t('fields.email')}
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
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t(
                              'fields.password'
                            )}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{}</Form.Label>
                        <Form.Control>
                          <Input
                            type='password'
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t('auth.register.confirmPasswordPlaceholder')}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name='tax_id'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{}</Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            className='bg-ui-bg-field-component mt-4'
                            placeholder={t('auth.register.taxIdPlaceholder')}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name='product_description'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t('auth.register.productDescriptionLabel')}</Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t('auth.register.productDescriptionPlaceholder')}
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name='portfolio_link'
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{}</Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder={t('auth.register.portfolioLinkPlaceholder')}
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
                {t('auth.register.submitButton')}
              </Button>
            </form>
          </Form>
        </div>
        <span className='text-ui-fg-muted txt-small my-6'>
          {t('auth.register.hasAccount')} {' '}
          <Link
            to='/login'
            className='text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none'
          >
            {t('auth.register.loginLink')}
          </Link>
        </span>
      </div>
    </div>
  );
};
