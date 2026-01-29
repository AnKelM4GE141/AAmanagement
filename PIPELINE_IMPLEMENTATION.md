# Multi-Pipeline System Implementation

## What Was Built

A complete GoHighLevel-style pipeline management system where admins can:
- Create multiple custom pipelines
- Add/remove/edit/reorder stages within each pipeline
- Switch between pipelines via dropdown
- Drag opportunities between stages
- Set default pipeline

## Setup Instructions

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Open `/supabase/pipelines-schema.sql`
3. Copy entire contents and paste into SQL Editor
4. Click "Run"
5. Verify:
   - Tables created: `pipelines`, `pipeline_stages`
   - Default pipeline created with 8 stages
   - `opportunities` table updated with `pipeline_id` and `stage_id` columns

### Step 2: Files Created

**Components:**
- `OpportunitiesView.tsx` - Main view with pipeline selector
- `PipelineManager.tsx` - Modal to manage pipelines
- `PipelineEditor.tsx` - Edit stages within a pipeline
- Updated `OpportunityKanban.tsx` - Now pipeline-aware
- Updated `OpportunityColumn.tsx` - Dynamic based on pipeline stages
- Updated `CreateOpportunityModal.tsx` - Select pipeline when creating

**API Routes Needed:**
Create these files in `/app/api/admin/pipelines/`:

1. `route.ts` - GET (list) and POST (create) pipelines
2. `[id]/route.ts` - GET (single) and DELETE pipeline
3. `[id]/set-default/route.ts` - PATCH to set default
4. `[id]/stages/route.ts` - POST to add stage
5. `[id]/stages/[stageId]/route.ts` - PATCH/DELETE stage
6. `[id]/stages/reorder/route.ts` - POST to reorder stages

Also update:
7. `/app/api/admin/opportunities/route.ts` - Work with pipeline_id/stage_id

## Features

### Pipeline Management
- Click "Manage Pipelines" button
- See list of all pipelines
- Create new pipeline
- Edit pipeline stages (add/remove/rename/reorder/change colors)
- Delete pipeline
- Set default pipeline

### Pipeline Selection
- Dropdown at top of Opportunities page
- Switch between different pipelines
- Kanban board updates dynamically

### Stage Customization
- 9 color options: Gray, Blue, Yellow, Green, Indigo, Red, Purple, Pink, Orange
- Drag to reorder stages
- Edit stage names
- Add unlimited stages
- Remove stages (opportunities move to first stage)

### Opportunity Management
- Select pipeline when creating opportunity
- Drag opportunities between stages
- Opportunities stay with their pipeline

## Use Cases

**Different Marketing Campaigns:**
- "Apartment Leasing" pipeline
- "Referral Program" pipeline
- "Corporate Housing" pipeline
- "Student Housing" pipeline

**Each pipeline can have custom stages:**
- Lead → Inquiry → Tour → Application → Approved → Signed
- Or: Referral → Contacted → Meeting → Closed → Won

## Next Steps

The system is ready for multiple pipelines! Just need to create the remaining API route files (I can provide those next if needed).
