-- Supabase Storage RLS Policies
-- Updated to match bucket names with spaces

-- ============================================
-- Business Assets Bucket Policies
-- ============================================

-- Allow public to view business assets
CREATE POLICY "Public can view business assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'business assets');

-- Only admins can upload/update business assets
CREATE POLICY "Admins can upload business assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business assets'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update business assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business assets'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete business assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business assets'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- ============================================
-- Property Documents Bucket Policies
-- ============================================

-- Admins can view all property documents
CREATE POLICY "Admins can view property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Tenants can view documents for their property
CREATE POLICY "Tenants can view own property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property documents'
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
  bucket_id = 'property documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Only admins can update property documents
CREATE POLICY "Admins can update property documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Only admins can delete property documents
CREATE POLICY "Admins can delete property documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property documents'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- ============================================
-- Maintenance Photos Bucket Policies
-- ============================================

-- Admins can view all maintenance photos
CREATE POLICY "Admins can view maintenance photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance photos'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);

-- Tenants can view photos for their maintenance requests
CREATE POLICY "Tenants can view own maintenance photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance photos'
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
  bucket_id = 'maintenance photos'
  AND auth.uid() IN (
    SELECT user_id FROM tenants WHERE status = 'active'
  )
);

-- Admins can manage all photos
CREATE POLICY "Admins can manage maintenance photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'maintenance photos'
  AND auth.uid() IN (
    SELECT id FROM users_profile WHERE role = 'admin'
  )
);
