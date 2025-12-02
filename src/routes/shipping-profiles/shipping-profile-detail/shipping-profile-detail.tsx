import { useLoaderData, useParams } from 'react-router-dom';

import { SingleColumnPageSkeleton } from '../../../components/common/skeleton';
import { useShippingProfile } from '../../../hooks/api/shipping-profiles';
import { ShippingProfileGeneralSection } from './components/shipping-profile-general-section';

import { SingleColumnPage } from '../../../components/layout/pages';
import { useDashboardExtension } from '../../../extensions';
import { shippingProfileLoader } from './loader';

export const ShippingProfileDetail = () => {
  const { shipping_profile_id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingProfileLoader>
  >;


  const result = useShippingProfile(shipping_profile_id!, undefined, {
    initialData,
  });

  
  const { shipping_profile, isLoading, isError, error } = result;

  const { getWidgets } = useDashboardExtension();

  if (isLoading) {
    return <SingleColumnPageSkeleton sections={1} />;
  }

  if (isError) {
    throw error;
  }

  // If shipping_profile is undefined or null, show a message
  if (!shipping_profile) {
    console.error('Shipping profile is undefined or null');
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Shipping Profile Not Found</h2>
        <p>The shipping profile could not be loaded. Please try again later.</p>
      </div>
    );
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets(
          'shipping_profile.details.before'
        ),
        after: getWidgets('shipping_profile.details.after'),
      }}
      showMetadata
      showJSON
      data={shipping_profile}
    >
      <ShippingProfileGeneralSection
        profile={shipping_profile}
      />
    </SingleColumnPage>
  );
};
