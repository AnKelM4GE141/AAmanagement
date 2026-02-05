'use client'

import { useState, useEffect, useRef } from 'react'
import SignatureCanvas, { SignatureCanvasHandle } from '@/components/contracts/SignatureCanvas'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface ContractData {
  id: string
  document_file_name: string
  document_url: string
  status: string
  applicant_name: string
  applicant_email: string
}

export default function SigningView({ token }: { token: string }) {
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signed, setSigned] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false)
  const signatureRef = useRef<SignatureCanvasHandle>(null)
  const signingAreaRef = useRef<HTMLDivElement>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/contracts/sign/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setContract(data.contract)
        }
      })
      .catch(() => setError('Failed to load contract'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async () => {
    if (!signatureRef.current) return

    if (signatureRef.current.isEmpty()) {
      setError('Please draw your signature before submitting')
      return
    }

    setError(null)
    setSubmitting(true)

    const sigDataUrl = signatureRef.current.toDataURL()

    try {
      const res = await fetch(`/api/contracts/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data_url: sigDataUrl,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSignatureDataUrl(sigDataUrl)
        setSignedDocumentUrl(data.signed_document_url || null)
        setSigned(true)
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      }
    } catch {
      setError('Failed to submit signature. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSignatureFullscreen = () => {
    if (!signingAreaRef.current) return
    if (!document.fullscreenElement) {
      signingAreaRef.current.requestFullscreen().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    }
  }

  const togglePdfFullscreen = () => {
    if (!pdfContainerRef.current) return
    if (!document.fullscreenElement) {
      pdfContainerRef.current.requestFullscreen().then(() => setIsPdfFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsPdfFullscreen(false))
    }
  }

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === signingAreaRef.current)
      setIsPdfFullscreen(!!document.fullscreenElement && document.fullscreenElement === pdfContainerRef.current)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  if (signed && contract) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Contract Signed Successfully</h2>
          <p className="text-slate-600">
            Signed by {contract.applicant_name} on{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Signed Agreement View */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">
              Signed Agreement — {contract.document_file_name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Signed
              </span>
              {signedDocumentUrl && (
                <a
                  href={signedDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download Signed PDF
                </a>
              )}
            </div>
          </div>
          <iframe
            src={signedDocumentUrl || contract.document_url}
            className="w-full"
            style={{ height: '60vh', minHeight: '400px' }}
            title="Signed Lease Agreement"
          />
          {signedDocumentUrl && (
            <div className="px-4 py-2 bg-green-50 border-t border-green-100">
              <p className="text-xs text-green-700 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Your signature has been embedded into the document
              </p>
            </div>
          )}
        </div>

        {/* Signature Record */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-700">Your Signature</h3>
          </div>
          <div className="p-6">
            <div className="max-w-md mx-auto">
              {signatureDataUrl && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <img
                    src={signatureDataUrl}
                    alt="Your signature"
                    className="w-full h-auto"
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div className="border-t border-slate-300 mt-4 pt-2 text-center">
                <p className="text-sm text-slate-600">{contract.applicant_name}</p>
                <p className="text-xs text-slate-400">
                  Electronically signed on{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          This electronic signature is legally binding. A copy of this signed agreement has been recorded
          and your signature has been embedded into the PDF document.
        </p>
      </div>
    )
  }

  if (!contract) return null

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lease Agreement</h1>
        <p className="text-slate-600 mt-1">
          {contract.document_file_name} — for {contract.applicant_name}
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* PDF Viewer */}
      <div
        ref={pdfContainerRef}
        className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${
          isPdfFullscreen ? 'flex flex-col h-screen' : ''
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Document Preview</h3>
          <button
            type="button"
            onClick={togglePdfFullscreen}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            {isPdfFullscreen ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                </svg>
                Exit Full Screen
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Full Screen
              </>
            )}
          </button>
        </div>
        <iframe
          src={contract.document_url}
          className={`w-full ${isPdfFullscreen ? 'flex-1' : ''}`}
          style={isPdfFullscreen ? {} : { height: '70vh', minHeight: '500px' }}
          title="Lease Agreement PDF"
        />
      </div>

      {/* Signature Area */}
      <div
        ref={signingAreaRef}
        className={`bg-white rounded-lg shadow-sm border border-slate-200 ${
          isFullscreen ? 'p-6 flex flex-col h-screen' : ''
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Sign Below</h3>
          <button
            type="button"
            onClick={toggleSignatureFullscreen}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            {isFullscreen ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                </svg>
                Exit Full Screen
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Full Screen
              </>
            )}
          </button>
        </div>

        <div className={`p-4 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
          <p className="text-sm text-slate-600 mb-3">
            Draw your signature in the box below using your finger or stylus.
          </p>

          <div
            className={`border-2 border-dashed border-slate-300 rounded-lg bg-white relative ${
              isFullscreen ? 'flex-1 min-h-0' : 'h-64 sm:h-80'
            }`}
          >
            <SignatureCanvas ref={signatureRef} className="w-full h-full" />
            {/* Signature line */}
            <div className="absolute bottom-8 left-8 right-8 border-b border-slate-300 pointer-events-none" />
            <span className="absolute bottom-2 left-8 text-xs text-slate-400 pointer-events-none">Signature</span>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signatureRef.current?.undo()}
              >
                Undo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signatureRef.current?.clear()}
              >
                Clear
              </Button>
            </div>
            <Button
              variant="primary"
              size="lg"
              isLoading={submitting}
              onClick={handleSubmit}
            >
              Submit Signature
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            By signing above, you agree to the terms of the lease agreement.
            Your signature, IP address, and timestamp will be recorded as a legal record.
          </p>
        </div>
      </div>
    </div>
  )
}
