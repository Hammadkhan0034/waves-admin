import { HelpCircle } from 'lucide-react'
import { adminLegalPagesApi } from '../../api/admin'
import { ContentPageEditor } from './ContentPageEditor'

export default function HelpCenter() {
  return (
    <ContentPageEditor
      pageKey="help-center"
      title="Help Center"
      subtitle="Manage help center content shown to users in the mobile app"
      cardTitle="Help Center Content"
      icon={HelpCircle}
      versionHint="Optional version label for tracking content updates."
      contentPlaceholder="Enter help center content…"
      saveLabel="Save Help Center"
      successMessage="Help center saved"
      errorMessage="Failed to save help center"
      fetchPage={() => adminLegalPagesApi.getHelpCenter()}
      updatePage={(body) => adminLegalPagesApi.updateHelpCenter(body)}
      showVersion={false}
    />
  )
}
