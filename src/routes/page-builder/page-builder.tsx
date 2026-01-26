import { SingleColumnPageSkeleton } from '../../components/common/skeleton'
import { useVendorPage } from '../../hooks/api/vendor-page'
import { PageBuilderContent } from './components/page-builder-content'
import { TemplateSelector } from './components/template-selector'

export const PageBuilder = () => {
  const { page, templates, isPending, isError, error } = useVendorPage()

  if (isPending) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (isError) {
    throw error
  }

  return (
    <div className="flex flex-col gap-y-3">
      {!page ? (
        <TemplateSelector templates={templates} />
      ) : (
        <PageBuilderContent page={page} templates={templates} />
      )}
    </div>
  )
}
