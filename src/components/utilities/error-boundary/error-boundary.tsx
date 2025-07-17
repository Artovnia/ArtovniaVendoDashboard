import { ExclamationCircle } from '@medusajs/icons';
import { Text, Button } from '@medusajs/ui';
import {
  Navigate,
  useLocation,
  useRouteError,
  Link
} from 'react-router-dom';

import { isFetchError } from '../../../lib/is-fetch-error';

// Define interface for our custom error structure
interface CustomError {
  error?: string;
  details?: string;
  serverDown?: boolean;
}

export const ErrorBoundary = () => {
  const error = useRouteError();
  const location = useLocation();

  console.log({ error });

  let code: number | null = null;
  let isSessionExpired = false;
  let isConnectionRefused = false;
  let customErrorMessage: string | undefined;

  // Check if it's our custom error structure
  const customError = error as CustomError;
  if (customError && typeof customError === 'object') {
    if (customError.error) {
      customErrorMessage = customError.error;
      if (customErrorMessage.includes('Session expired')) {
        isSessionExpired = true;
      }
      if (customError.serverDown) {
        isConnectionRefused = true;
      }
    }
  }

  // Handle session expiration detected in the error boundary
  if (isSessionExpired) {
    // Clear authentication data if not already cleared
    window.localStorage.removeItem('medusa_auth_token');
    
    return (
      <Navigate
        to='/login'
        state={{ from: location }}
        replace
      />
    );
  }

  if (isFetchError(error)) {
    if (error.status === 401) {
      // Clear authentication data if not already cleared
      window.localStorage.removeItem('medusa_auth_token');
      
      return (
        <Navigate
          to='/login'
          state={{ from: location }}
          replace
        />
      );
    }

    code = error.status ?? null;
  }

  /**
   * Log error in development mode.
   *
   * react-router-dom will sometimes swallow the error,
   * so this ensures that we always log it.
   */
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }

  let title: string;
  let message: string;

  // Handle connection refused errors specifically
  if (isConnectionRefused) {
    title = 'Błąd połączenia';
    message = 'Nie można połączyć się z serwerem. Serwer może być wyłączony lub twoja sesja mogła wygasnąć.';
  } else {
    // Handle other error types
    switch (code) {
      case 400:
        title = 'Nieprawidłowe zapytanie';
        message = 'Zapytanie zawiera nieprawidłowe dane lub parametry.';
        break;
      case 404:
        title = 'Nie znaleziono';
        message = 'Nie znaleziono żądanego zasobu.';
        break;
      case 500:
        title = 'Błąd serwera';
        message = 'Wystąpił wewnętrzny błąd serwera. Prosimy spróbować ponownie później.';
        break;
      default:
        title = customErrorMessage ? 'Błąd' : 'Wystąpił nieoczekiwany błąd';
        message = customErrorMessage || 'Wystąpił nieoczekiwany błąd podczas renderowania tej strony.';
        break;
    }
  }

  return (
    <div className='flex size-full min-h-[calc(100vh-57px-24px)] items-center justify-center'>
      <div className='flex flex-col gap-y-6'>
        <div className='text-ui-fg-subtle flex flex-col items-center gap-y-3'>
          <ExclamationCircle />
          <div className='flex flex-col items-center justify-center gap-y-1'>
            <Text
              size='small'
              leading='compact'
              weight='plus'
            >
              {title}
            </Text>
            <Text
              size='small'
              className='text-ui-fg-muted text-balance text-center'
            >
              {message}
            </Text>
            
            {/* Add retry button for connection issues */}
            {isConnectionRefused && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => window.location.reload()}
                >
                  Spróbuj ponownie
                </Button>
              </div>
            )}
            
            {/* Add login button for session expiration */}
            {code === 401 && (
              <div className="mt-4">
                <Link to="/login">
                  <Button
                    variant="secondary"
                    size="small"
                  >
                    Zaloguj się ponownie
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
