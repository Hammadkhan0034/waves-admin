import { FileText } from 'lucide-react'
import { adminLegalPagesApi } from '../../api/admin'
import { ContentPageEditor } from './ContentPageEditor'

export default function TermsAndConditions() {
  return (
    <ContentPageEditor
      pageKey="terms-and-conditions"
      title="Terms and Conditions"
      subtitle="Manage the terms and conditions shown to users in the mobile app"
      cardTitle="Terms and Conditions Content"
      icon={FileText}
      contentPlaceholder="Enter terms and conditions content…"
      saveLabel="Save Terms and Conditions"
      successMessage="Terms and conditions saved"
      errorMessage="Failed to save terms and conditions"
      fetchPage={() => adminLegalPagesApi.getTermsAndConditions()}
      updatePage={(body) => adminLegalPagesApi.updateTermsAndConditions(body)}
    />
  )
}
