import { useLoaderData, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TwoColumnPage } from '../../../components/layout/pages';
import { useDashboardExtension } from '../../../extensions';
import { ReviewGeneralSection } from './components/review-general-section';
import { requestLoader } from './loader';
import { TwoColumnPageSkeleton } from '../../../components/common/skeleton';
import { useRequest } from '../../../hooks/api';

export const RequestDetail = () => {
  const { t } = useTranslation();
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof requestLoader>
  >;

  const { id } = useParams();
  const { request, isLoading, isError, error } = useRequest(
    id!,
    { fields: '*' },
    { initialData }
  ) as any;

  const { getWidgets } = useDashboardExtension();
  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>{t('requests.detail.loading')}</p>
        <TwoColumnPageSkeleton
          mainSections={2}
          sidebarSections={3}
          showJSON
          showMetadata
        />
      </div>
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets('campaign.details.after'),
        before: getWidgets('campaign.details.before'),
        sideAfter: getWidgets(
          'campaign.details.side.after'
        ),
        sideBefore: getWidgets(
          'campaign.details.side.before'
        ),
      }}
      hasOutlet
      showJSON
      showMetadata
      data={request}
    >
      <TwoColumnPage.Main>
        <ReviewGeneralSection />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>Sidebar</TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
