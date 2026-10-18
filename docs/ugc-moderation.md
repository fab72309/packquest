# PackQuest content safety review

Use this procedure for every row in `public.content_safety_reports` with `status = 'open'`.

## Review

1. Sign in to the PackQuest Supabase project with an authorized project-owner account.
2. Open **SQL Editor** and inspect open reports. The table is not available through the public Data API; only a privileged project operator can read it.

```sql
select id, created_at, family_id, child_profile_id, mission_id, mission_item_id,
       reporter_role, reported_role, reported_content, reason, status
from public.content_safety_reports
where status = 'open'
order by created_at;
```

3. Assess the reported text against `public/ugc-guidelines.html`. Do not contact a child directly. Use the published support address and involve the parent or another appropriate adult when safe.
4. Record the action and close or escalate the report. Keep the child-initiated block in place unless the review has resolved the safety concern.

```sql
update public.content_safety_reports
set status = 'reviewed', reviewed_at = now(), review_action = 'Describe the moderation decision'
where id = 'REPORT_UUID' and status = 'open';
```

## Restoring a child-blocked conversation

Only after review determines it is safe to resume, clear the child block for that profile. This does not enable messages; a parent must separately read the current policy and enable them again in the app.

```sql
update public.child_profiles
set help_interactions_paused_at = null,
    help_interactions_paused_by = null,
    updated_at = now()
where id = 'CHILD_PROFILE_UUID'
  and help_interactions_paused_by = 'child';
```

Every report is a separate case. Do not close a report before recording the action. Account deletion removes the family's reports through the schema's cascade rules.
