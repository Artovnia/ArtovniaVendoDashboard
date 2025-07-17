import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * A simple component that redirects to the payout/create route
 * Used to handle legacy routes that previously pointed to simplified-payout-form
 */
const RedirectToCreate = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/payout/create', { replace: true });
  }, [navigate]);
  
  return null;
};

export default RedirectToCreate;
