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
import AvatarBox from '../../components/common/logo-box/avatar-box';
import { useSignUpWithEmailPass } from '../../hooks/api';
import { isFetchError } from '../../lib/is-fetch-error';
import { useState } from 'react';

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name should be a string' }),
  email: z.string().email({ message: 'Invalid email' }),
  password: z
    .string()
    .min(2, { message: 'Password should be a string' }),
  confirmPassword: z.string().min(2, {
    message: 'Confirm Password should be a string',
  }),
  tax_id: z.string().optional(),
  product_description: z.string().min(1, { message: 'Please describe what you want to sell' }),
  portfolio_link: z.string().refine(val => !val || val.startsWith('http'), { message: 'Must be a valid URL or empty' }).optional(),
});

export const Register = () => {
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
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
          message:
            'Password and Confirm Password not matched',
        });
        form.setError('confirmPassword', {
          type: 'manual',
          message:
            'Password and Confirm Password not matched',
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

            form.setError('root.serverError', {
              type: 'manual',
              message: error.message,
            });
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
      <div className='bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center'>
        <div className='mb-4 flex flex-col items-center'>
          <Heading>Dziękujemy za rejestrację!</Heading>
          <Text
            size='small'
            className='text-ui-fg-subtle text-center mt-2 max-w-[320px]'
          >
            Musisz poczekać na zatwierdzenie przez administratora. Email z potwierdzeniem zostanie wysłany do Ciebie po akceptacji.
          </Text>

          <Link to='/login'>
            <Button className='mt-8'>
            Powrót do logowania
            </Button>
          </Link>
        </div>
      </div>
    );

  return (
    <div className='bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center'>
      <div className='m-4 flex w-full max-w-[280px] flex-col items-center'>
        <AvatarBox />
        <div className='mb-4 flex flex-col items-center'>
          <Heading>Rejestracja sprzedawcy</Heading>
          <Text
            size='small'
            className='text-ui-fg-subtle text-center'
          >
            Wypełnij formularz rejestracji sprzedawcy
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
                            placeholder='Nazwa firmy'
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
                            placeholder='Potwierdź hasło'
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
                            placeholder='Tax ID / NIP (opcjonalne)'
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
                        <Form.Label>Opis produktu *</Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            className='bg-ui-bg-field-component'
                            placeholder='Opis produktu'
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
                            placeholder='Link do porfolio (opcjonalne)'
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
                Zarejestruj się
              </Button>
            </form>
          </Form>
        </div>
        <span className='text-ui-fg-muted txt-small my-6'>
          Masz już konto? {' '}
          <Link
            to='/login'
            className='text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none'
          >
            Zaloguj się
          </Link>
        </span>
      </div>
    </div>
  );
};
