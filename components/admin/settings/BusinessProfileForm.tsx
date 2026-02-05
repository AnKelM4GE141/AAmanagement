'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import LogoUpload from './LogoUpload'

interface BusinessSettings {
  id?: string
  business_name: string
  logo_url: string | null
  primary_email: string
  primary_phone: string
  address: string
  timezone: string
}

export default function BusinessProfileForm() {
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: 'AA Portal',
    logo_url: null,
    primary_email: '',
    primary_phone: '',
    address: '',
    timezone: 'America/New_York',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/settings/business')
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setSuccessMessage('Settings saved successfully')
      // Reload the page after 1 second to update the sidebar with new business name
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogoUpload(logoUrl: string) {
    setSettings({ ...settings, logo_url: logoUrl })
    setSuccessMessage('Logo uploaded successfully. Click "Save Changes" to apply.')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Business Logo
        </label>
        <LogoUpload
          currentLogoUrl={settings.logo_url}
          onUploadSuccess={handleLogoUpload}
        />
      </div>

      {/* Business Name */}
      <Input
        label="Business Name"
        value={settings.business_name}
        onChange={(e) =>
          setSettings({ ...settings, business_name: e.target.value })
        }
        required
        placeholder="AA Portal"
      />

      {/* Primary Email */}
      <Input
        label="Primary Email"
        type="email"
        value={settings.primary_email}
        onChange={(e) =>
          setSettings({ ...settings, primary_email: e.target.value })
        }
        placeholder="contact@example.com"
      />

      {/* Primary Phone */}
      <Input
        label="Primary Phone"
        type="tel"
        value={settings.primary_phone}
        onChange={(e) =>
          setSettings({ ...settings, primary_phone: e.target.value })
        }
        placeholder="(555) 123-4567"
      />

      {/* Address */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Address
        </label>
        <textarea
          id="address"
          rows={3}
          value={settings.address}
          onChange={(e) =>
            setSettings({ ...settings, address: e.target.value })
          }
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="123 Main St, City, State 12345"
        />
      </div>

      {/* Timezone */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Timezone
        </label>
        <select
          id="timezone"
          value={settings.timezone}
          onChange={(e) =>
            setSettings({ ...settings, timezone: e.target.value })
          }
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="America/Anchorage">Alaska Time (AKT)</option>
          <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}
