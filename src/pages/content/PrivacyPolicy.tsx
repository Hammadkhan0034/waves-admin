import { Shield } from 'lucide-react'
import { adminLegalPagesApi } from '../../api/admin'
import { ContentPageEditor } from './ContentPageEditor'

export default function PrivacyPolicy() {
  return (
    <ContentPageEditor
      pageKey="privacy-policy"
      title="Privacy Policy"
      subtitle="Manage the privacy policy shown to users in the mobile app"
      cardTitle="Privacy Policy Content"
      icon={Shield}
      contentPlaceholder="Enter privacy policy content…"
      saveLabel="Save Privacy Policy"
      successMessage="Privacy policy saved"
      errorMessage="Failed to save privacy policy"
      fetchPage={() => adminLegalPagesApi.getPrivacyPolicy()}
      updatePage={(body) => adminLegalPagesApi.updatePrivacyPolicy(body)}
    />
  )
}
