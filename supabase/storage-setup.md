# Supabase Storage Setup Guide

This guide explains how to set up the required Supabase Storage buckets for the CRM system.

## Required Buckets

### 1. business-assets (Public)
**Purpose:** Store business logos and branding materials
**Access:** Public read access
**Settings:**
- Name: `business-assets`
- Public: Yes
- File size limit: 2MB (recommended for logos)
- Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/webp

**RLS Policy:**
```sql
-- Allow public to view business assets
CREATE POLICY "Public can view business assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-assets');

-- Only admins can upload/update business assets
CREATE POLICY "Admins can upload business assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-assets'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update business assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-assets'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete business assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-assets'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);
```

### 2. property-documents (Authenticated)
**Purpose:** Store property-specific documents (lease templates, rules, inspection reports, etc.)
**Access:** Authenticated users only
**Settings:**
- Name: `property-documents`
- Public: No
- File size limit: 10MB
- Allowed MIME types: application/pdf, image/png, image/jpeg, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

**RLS Policy:**
```sql
-- Admins can view all property documents
CREATE POLICY "Admins can view property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Tenants can view documents for their property
CREATE POLICY "Tenants can view own property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents'
  AND auth.uid() IN (
    SELECT tenants.user_id
    FROM tenants
    JOIN property_documents ON property_documents.property_id = tenants.property_id
    WHERE property_documents.file_url LIKE '%' || storage.objects.name || '%'
    AND tenants.status = 'active'
  )
);

-- Only admins can upload property documents
CREATE POLICY "Admins can upload property documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Only admins can update property documents
CREATE POLICY "Admins can update property documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Only admins can delete property documents
CREATE POLICY "Admins can delete property documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);
```

### 3. maintenance-photos (Authenticated)
**Purpose:** Store photos attached to maintenance requests
**Access:** Authenticated users only
**Settings:**
- Name: `maintenance-photos`
- Public: No
- File size limit: 5MB per image
- Allowed MIME types: image/png, image/jpeg, image/webp

**RLS Policy:**
```sql
-- Admins can view all maintenance photos
CREATE POLICY "Admins can view maintenance photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance-photos'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Tenants can view photos for their maintenance requests
CREATE POLICY "Tenants can view own maintenance photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance-photos'
  AND auth.uid() IN (
    SELECT tenants.user_id
    FROM tenants
    JOIN maintenance_requests ON maintenance_requests.tenant_id = tenants.id
    JOIN maintenance_request_photos ON maintenance_request_photos.request_id = maintenance_requests.id
    WHERE maintenance_request_photos.photo_url LIKE '%' || storage.objects.name || '%'
  )
);

-- Tenants can upload photos to their maintenance requests
CREATE POLICY "Tenants can upload maintenance photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance-photos'
  AND auth.uid() IN (
    SELECT user_id FROM tenants WHERE status = 'active'
  )
);

-- Admins can manage all photos
CREATE POLICY "Admins can manage maintenance photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'maintenance-photos'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);
```

## Setup Instructions

### Step 1: Create Buckets
1. Go to Supabase Dashboard
2. Navigate to Storage section
3. Click "New bucket"
4. For each bucket:
   - Enter the bucket name
   - Set Public/Private according to the settings above
   - Configure file size limits
   - Save

### Step 2: Apply RLS Policies
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the RLS policies for each bucket
3. Run the SQL queries
4. Verify policies are created in the Storage → Policies section

### Step 3: Test Upload
1. Test uploading a file to each bucket
2. Verify RLS policies work by:
   - Logging in as admin and uploading to all buckets
   - Logging in as tenant and trying to upload to restricted buckets
   - Checking file access permissions

## File Naming Convention

### Business Assets
Format: `logo-{timestamp}.{ext}`
Example: `logo-1705689600000.png`

### Property Documents
Format: `property-{propertyId}/{documentType}-{timestamp}.{ext}`
Example: `property-abc123/lease-template-1705689600000.pdf`

### Maintenance Photos
Format: `request-{requestId}/{timestamp}.{ext}`
Example: `request-xyz789/1705689600000.jpg`

## URL Structure

Files can be accessed via:
- Public bucket: `https://{project_id}.supabase.co/storage/v1/object/public/{bucket}/{file_path}`
- Private bucket: Use signed URL from Supabase client

Example:
```typescript
// Public file (logo)
const publicUrl = supabase.storage
  .from('business-assets')
  .getPublicUrl('logo-1705689600000.png')

// Private file (document) - requires authentication
const { data, error } = await supabase.storage
  .from('property-documents')
  .createSignedUrl('property-abc123/lease-template.pdf', 60) // 60 seconds
```

## Maintenance

### Regular Cleanup
- Remove unused logos when business profile is updated
- Delete maintenance photos when requests are completed and archived (after 1 year)
- Remove property documents when property is deleted (handled by CASCADE)

### Monitoring
- Monitor storage usage in Supabase Dashboard
- Set up alerts for storage quota (Supabase free tier: 1GB, Pro: 100GB)
- Review file sizes and optimize images if needed

## Notes
- All file uploads should be validated on the server side
- Images should be optimized before upload (compressed, appropriate dimensions)
- Consider implementing virus scanning for uploaded files in production
- Implement file size checks in the application layer as well as storage settings
