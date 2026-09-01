import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import type { LegalPage } from '../../api/admin'
import { formatDate } from '../../utils'

type LegalPagePayload = Pick<LegalPage, 'title' | 'content' | 'version' | 'isPublished'>

interface ContentPageEditorProps {
  pageKey: string
  title: string
  subtitle: string
  cardTitle: string
  icon: LucideIcon
  versionHint?: string
  contentPlaceholder: string
  saveLabel: string
  successMessage: string
  errorMessage: string
  fetchPage: () => Promise<{ data: LegalPage }>
  updatePage: (body: LegalPagePayload) => Promise<{ data: LegalPage }>
  showVersion?: boolean
}

export function ContentPageEditor({
  pageKey,
  title,
  subtitle,
  cardTitle,
  icon: Icon,
  versionHint = 'Bump the version when users need to re-accept this content.',
  contentPlaceholder,
  saveLabel,
  successMessage,
  errorMessage,
  fetchPage,
  updatePage,
  showVersion = true,
}: ContentPageEditorProps) {
  const qc = useQueryClient()
  const [pageTitle, setPageTitle] = useState('')
  const [content, setContent] = useState('')
  const [version, setVersion] = useState('1.0')
  const [isPublished, setIsPublished] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'legal-pages', pageKey],
    queryFn: fetchPage,
  })

  useEffect(() => {
    const page = data?.data
    if (!page) return
    setPageTitle(page.title)
    setContent(page.content)
    setVersion(page.version)
    setIsPublished(page.isPublished)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePage({ title: pageTitle, content, version, isPublished }),
    onSuccess: () => {
      toast.success(successMessage)
      qc.invalidateQueries({ queryKey: ['admin', 'legal-pages', pageKey] })
    },
    onError: () => toast.error(errorMessage),
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title={title} subtitle={subtitle} />

      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Icon className="w-4 h-4 text-brand-600" />
              {cardTitle}
            </h3>
          </CardHeader>
          <CardBody className="space-y-5">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-1 ${showVersion ? 'md:grid-cols-2' : ''} gap-4`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  {showVersion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Version
                      </label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="1.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">{versionHint}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Published</p>
                    <p className="text-xs text-gray-500">
                      When unpublished, the public API will not return this page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublished((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isPublished ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isPublished ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Content
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Supports markdown or HTML. This is what users see in the app.
                  </p>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={22}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono leading-relaxed"
                    placeholder={contentPlaceholder}
                  />
                </div>

                {data?.data?.updatedAt && (
                  <p className="text-xs text-gray-500">
                    Last updated: {formatDate(data.data.updatedAt)}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {isPublished ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Visible to users via API
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hidden from public API
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !pageTitle.trim() || !content.trim()}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {saveLabel}
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
