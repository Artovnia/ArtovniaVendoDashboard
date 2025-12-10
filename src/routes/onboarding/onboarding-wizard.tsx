import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Heading, Text, Button, ProgressTabs } from '@medusajs/ui'
import { useOnboarding, useUpdateOnboarding, useLogout } from '../../hooks/api'
import { useTranslation } from 'react-i18next'
import { CheckCircleSolid, XCircle, ArrowRightOnRectangle } from '@medusajs/icons'
import { LanguageSwitcher } from '../../components/common/language-switcher/language-switcher'
import { queryClient } from '../../lib/query-client'

/**
 * OnboardingWizard - Fullscreen step-by-step onboarding flow
 * 
 * Forces vendors to complete all steps in order:
 * 1. Store Information
 * 2. Locations & Shipping
 * 3. Stripe Connect
 * 4. Add Products
 */
export const OnboardingWizard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { onboarding, isPending } = useOnboarding()
  const { mutateAsync: updateOnboarding } = useUpdateOnboarding()
  const { mutateAsync: logoutMutation } = useLogout()

  // Recalculate onboarding status on mount
  useEffect(() => {
    updateOnboarding()
  }, [])

  // Handle logout
  const handleLogout = async () => {
    await logoutMutation(undefined, {
      onSuccess: () => {
        queryClient.clear()
        navigate('/login', { replace: true })
      },
    })
  }

  // Determine current step based on completion status
  const getCurrentStep = () => {
    if (!onboarding?.store_information) return 0
    if (!onboarding?.locations_shipping) return 1
    if (!onboarding?.stripe_connection) return 2
    if (!onboarding?.products) return 3
    return 4 // All complete
  }

  const currentStep = getCurrentStep()

  // Define steps configuration
  const steps = [
    {
      key: 'store_information',
      title: t('dashboard.onboarding.steps.storeInfo'),
      description: t('dashboard.onboarding.stepDescriptions.storeInfo'),
      completed: onboarding?.store_information || false,
      route: '/settings/store',
      buttonLabel: onboarding?.store_information 
        ? t('dashboard.onboarding.buttons.edit') 
        : t('dashboard.onboarding.buttons.setup'),
    },
    {
      key: 'locations_shipping',
      title: t('dashboard.onboarding.steps.locationsShipping'),
      description: t('dashboard.onboarding.stepDescriptions.locationsShipping'),
      completed: onboarding?.locations_shipping || false,
      route: '/settings/locations/batch-setup',
      buttonLabel: onboarding?.locations_shipping 
        ? t('dashboard.onboarding.buttons.edit') 
        : t('dashboard.onboarding.buttons.setup'),
      disabled: !onboarding?.store_information,
    },
    {
      key: 'stripe_connection',
      title: t('dashboard.onboarding.steps.stripeConnect'),
      description: t('dashboard.onboarding.stepDescriptions.stripeConnect'),
      completed: onboarding?.stripe_connection || false,
      route: '/stripe-connect',
      buttonLabel: onboarding?.stripe_connection 
        ? t('dashboard.onboarding.buttons.manage') 
        : t('dashboard.onboarding.buttons.setup'),
      disabled: !onboarding?.locations_shipping,
    },
    {
      key: 'products',
      title: t('dashboard.onboarding.steps.addProducts'),
      description: t('dashboard.onboarding.stepDescriptions.addProducts'),
      completed: onboarding?.products || false,
      route: '/products/create',
      buttonLabel: onboarding?.products 
        ? t('dashboard.onboarding.buttons.add') 
        : t('dashboard.onboarding.buttons.add'),
      disabled: !onboarding?.stripe_connection,
    },
  ]

  const handleStepClick = (route: string, disabled: boolean) => {
    if (!disabled) {
      navigate(route)
    }
  }

  const handleFinish = () => {
    navigate('/')
  }

  if (isPending) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='animate-spin'>⏳</div>
      </div>
    )
  }

  // If all steps complete, show completion screen
  if (currentStep === 4) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-ui-bg-subtle relative'>
        {/* Top Bar with Language Switcher and Logout */}
        <div className='absolute top-0 left-0 right-0 z-10 bg-ui-bg-base border-b border-ui-border-base'>
          <div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Text size='small' weight='plus' className='text-ui-fg-subtle'>
                {t('dashboard.onboarding.wizard.title', 'Konfiguracja sklepu')}
              </Text>
            </div>
            <div className='flex items-center gap-4'>
              <LanguageSwitcher />
              <Button
                variant='transparent'
                size='small'
                onClick={handleLogout}
                className='text-ui-fg-subtle hover:text-ui-fg-base'
              >
                <ArrowRightOnRectangle className='mr-2' />
                {t('app.menus.actions.logout', 'Wyloguj')}
              </Button>
            </div>
          </div>
        </div>

        <Container className='max-w-2xl p-8'>
          <div className='text-center'>
            <CheckCircleSolid className='mx-auto h-16 w-16 text-ui-fg-interactive mb-4' />
            <Heading level='h1' className='mb-2'>
              {t('dashboard.onboarding.complete.title', 'Gratulacje!')}
            </Heading>
            <Text className='text-ui-fg-subtle mb-6'>
              {t('dashboard.onboarding.complete.description', 'Twój sklep jest gotowy do sprzedaży. Możesz teraz zarządzać swoimi produktami i zamówieniami.')}
            </Text>
            <Button size='large' onClick={handleFinish}>
              {t('dashboard.onboarding.complete.button', 'Przejdź do panelu')}
            </Button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen bg-ui-bg-subtle relative'>
      {/* Top Bar with Language Switcher and Logout */}
      <div className='absolute top-0 left-0 right-0 z-10 bg-ui-bg-base border-b border-ui-border-base'>
        <div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Text size='small' weight='plus' className='text-ui-fg-subtle'>
              {t('dashboard.onboarding.wizard.title', 'Konfiguracja sklepu')}
            </Text>
          </div>
          <div className='flex items-center gap-4'>
            <LanguageSwitcher />
            <Button
              variant='transparent'
              size='small'
              onClick={handleLogout}
              className='text-ui-fg-subtle hover:text-ui-fg-base'
            >
              <ArrowRightOnRectangle className='mr-2' />
              {t('app.menus.actions.logout', 'Wyloguj')}
            </Button>
          </div>
        </div>
      </div>

      <div className='w-full max-w-5xl mx-auto py-8 px-4 pt-20'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <Heading level='h1' className='mb-2'>
            {t('dashboard.onboarding.wizard.heading', 'Witaj w Artovnia!')}
          </Heading>
          <Text className='text-ui-fg-subtle'>
            {t('dashboard.onboarding.wizard.description', 'Przejdź przez 4 proste kroki, aby rozpocząć sprzedaż')}
          </Text>
        </div>

        {/* Progress Indicator */}
        <div className='mb-8'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            {steps.map((step, index) => (
              <div key={step.key} className='flex items-center'>
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${step.completed 
                      ? 'bg-ui-fg-interactive text-white' 
                      : index === currentStep 
                        ? 'bg-ui-button-inverted text-ui-fg-interactive border-2 border-ui-fg-interactive' 
                        : 'bg-ui-bg-base text-ui-fg-muted border-2 border-ui-border-base'
                    }
                  `}
                >
                  {step.completed ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      w-16 h-0.5 mx-2
                      ${step.completed ? 'bg-ui-fg-interactive' : 'bg-ui-border-base'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className='text-center text-sm text-ui-fg-subtle'>
            {t('dashboard.onboarding.progress.stepCounter', { current: currentStep + 1, total: steps.length })}
          </div>
        </div>

        {/* Steps List */}
        <Container className='divide-y p-0'>
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`
                p-6 transition-all
                ${index === currentStep ? 'bg-ui-bg-highlight' : ''}
                ${step.disabled ? 'opacity-50' : ''}
              `}
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    {step.completed ? (
                      <CheckCircleSolid className='h-6 w-6 text-ui-fg-interactive' />
                    ) : step.disabled ? (
                      <XCircle className='h-6 w-6 text-ui-fg-muted' />
                    ) : (
                      <div className='h-6 w-6 rounded-full border-2 border-ui-fg-interactive' />
                    )}
                    <Heading level='h3' className='text-lg'>
                      {step.title}
                    </Heading>
                  </div>
                  <Text className='text-ui-fg-subtle text-sm ml-9'>
                    {step.description}
                  </Text>
                  {step.disabled && (
                    <Text className='text-ui-fg-error text-xs ml-9 mt-1'>
                      {t('dashboard.onboarding.progress.disabledMessage')}
                    </Text>
                  )}
                </div>
                <Button
                  variant={index === currentStep ? 'primary' : 'secondary'}
                  size='base'
                  disabled={step.disabled}
                  onClick={() => handleStepClick(step.route, step.disabled || false)}
                >
                  {step.buttonLabel}
                </Button>
              </div>
            </div>
          ))}
        </Container>

        {/* Help Text */}
        <div className='mt-6 text-center'>
          <Text className='text-ui-fg-subtle text-sm'>
            {t('dashboard.onboarding.help.text')} <a href='mailto:sayuri.platform@gmail.com' className='text-ui-fg-interactive hover:underline'>sayuri.platform@gmail.com</a>
          </Text>
        </div>
      </div>
    </div>
  )
}
