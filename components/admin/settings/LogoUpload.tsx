'use client'

import { useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface LogoUploadProps {
  currentLogoUrl: string | null
  onUploadSuccess: (url: string) => void
}

export default function LogoUpload({
  currentLogoUrl,
  onUploadSuccess,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, SVG, or WebP.')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum size is 2MB.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadFile(file)
  }

  async function uploadFile(file: File) {
    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      onUploadSuccess(data.url)
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      setError(err.message)
      setPreviewUrl(currentLogoUrl)
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemoveLogo() {
    setPreviewUrl(null)
    onUploadSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-start space-x-4">
        {/* Logo Preview */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Business logo"
                className="h-20 w-20 object-contain rounded-lg border-2 border-gray-200 bg-white p-2"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remove logo"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="h-20 w-20 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Button and Info */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
          />
          <label htmlFor="logo-upload">
            <Button
              type="button"
              variant="secondary"
              isLoading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </label>
          <p className="mt-2 text-xs text-gray-600">
            PNG, JPG, SVG, or WebP. Max 2MB. Recommended: 200x200px
          </p>
        </div>
      </div>
    </div>
  )
}
