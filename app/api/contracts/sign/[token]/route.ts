import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        id,
        document_file_name,
        document_url,
        status,
        applicant_id,
        users_profile!applicant_id (
          full_name,
          email
        )
      `)
      .eq('signing_token', token)
      .single()

    if (error || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract has already been signed' }, { status: 400 })
    }

    if (contract.status === 'draft') {
      return NextResponse.json({ error: 'Contract has not been sent yet' }, { status: 400 })
    }

    // Mark as viewed if currently sent
    if (contract.status === 'sent') {
      await supabase
        .from('contracts')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
        })
        .eq('signing_token', token)
    }

    const applicant = (contract as any).users_profile || { full_name: 'Unknown', email: '' }

    return NextResponse.json({
      contract: {
        id: contract.id,
        document_file_name: contract.document_file_name,
        document_url: contract.document_url,
        status: contract.status === 'sent' ? 'viewed' : contract.status,
        applicant_name: applicant.full_name,
        applicant_email: applicant.email,
      },
    })
  } catch (error: any) {
    console.error('Error fetching contract for signing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select(`
        id,
        status,
        opportunity_id,
        document_file_name,
        document_url,
        applicant_id,
        users_profile!applicant_id (
          full_name,
          email
        )
      `)
      .eq('signing_token', token)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract has already been signed' }, { status: 400 })
    }

    if (contract.status === 'draft') {
      return NextResponse.json({ error: 'Contract has not been sent yet' }, { status: 400 })
    }

    const body = await request.json()
    const { signature_data_url } = body

    if (!signature_data_url) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const signerIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const signerUserAgent = request.headers.get('user-agent') || 'unknown'
    const signedAt = new Date().toISOString()
    const applicant = (contract as any).users_profile || { full_name: 'Unknown', email: '' }

    // --- Embed signature onto PDF ---
    let signedDocumentUrl: string | null = null

    try {
      // Fetch the original PDF
      const pdfResponse = await fetch(contract.document_url)
      if (!pdfResponse.ok) throw new Error('Failed to fetch original PDF')
      const pdfBytes = await pdfResponse.arrayBuffer()

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]
      const { width: pageWidth, height: pageHeight } = lastPage.getSize()

      // Embed the signature image
      const signatureBase64 = signature_data_url.replace(/^data:image\/\w+;base64,/, '')
      const signatureBytes = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0))
      const signatureImage = await pdfDoc.embedPng(signatureBytes)

      // Scale signature to reasonable size (max 200px wide, proportional height)
      const sigMaxWidth = 200
      const sigAspect = signatureImage.width / signatureImage.height
      const sigWidth = Math.min(sigMaxWidth, signatureImage.width)
      const sigHeight = sigWidth / sigAspect

      // Position: bottom-left area of last page, above the audit text
      const sigX = 50
      const sigY = 80

      lastPage.drawImage(signatureImage, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      })

      // Add signature line
      lastPage.drawLine({
        start: { x: sigX, y: sigY - 2 },
        end: { x: sigX + sigWidth + 20, y: sigY - 2 },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4),
      })

      // Add audit text below signature
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontSize = 8
      const signedDate = new Date(signedAt)
      const dateStr = signedDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })

      const auditLines = [
        `Electronically signed by ${applicant.full_name} (${applicant.email})`,
        `Date: ${dateStr}`,
        `IP: ${signerIp}`,
        `Document: ${contract.document_file_name}`,
      ]

      auditLines.forEach((line, i) => {
        lastPage.drawText(line, {
          x: sigX,
          y: sigY - 14 - i * 12,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
      })

      // Add "SIGNED" watermark text in top-right corner
      const labelFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      lastPage.drawText('SIGNED', {
        x: pageWidth - 100,
        y: pageHeight - 30,
        size: 14,
        font: labelFont,
        color: rgb(0.13, 0.55, 0.13),
      })

      // Save the modified PDF
      const signedPdfBytes = await pdfDoc.save()

      // Upload to Supabase Storage
      const signedFileName = `signed-${Date.now()}-${contract.document_file_name}`
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(signedFileName, signedPdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        console.error('Failed to upload signed PDF:', uploadError)
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('contracts')
          .getPublicUrl(signedFileName)
        signedDocumentUrl = urlData.publicUrl
      }
    } catch (pdfError: any) {
      // Log but don't fail the signing — the signature is still recorded in the DB
      console.error('Failed to embed signature onto PDF:', pdfError)
    }

    // Update contract record
    const updateData: Record<string, any> = {
      status: 'signed',
      signature_data_url,
      signed_at: signedAt,
      signer_ip: signerIp,
      signer_user_agent: signerUserAgent,
    }

    if (signedDocumentUrl) {
      updateData.signed_document_url = signedDocumentUrl
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contract.id)

    if (updateError) {
      throw updateError
    }

    // Auto-advance the opportunity to "lease_signed"
    if (contract.opportunity_id) {
      await supabase
        .from('opportunities')
        .update({ stage: 'lease_signed' })
        .eq('id', contract.opportunity_id)
    }

    return NextResponse.json({
      success: true,
      signed_document_url: signedDocumentUrl,
    })
  } catch (error: any) {
    console.error('Error signing contract:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sign contract' },
      { status: 500 }
    )
  }
}
