-- ADR-005: MVP exposes a single private teacher workspace, not institution management.

create or replace function public.ensure_personal_workspace()
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_workspace public.organizations;
  profile_name text;
  generated_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select o.* into existing_workspace
  from public.organizations o
  join public.memberships m on m.organization_id = o.id
  where m.user_id = auth.uid() and m.status = 'active'
  order by m.created_at asc
  limit 1;

  if found then
    return existing_workspace;
  end if;

  select display_name into profile_name from public.profiles where id = auth.uid();
  generated_slug := 'teacher-' || replace(auth.uid()::text, '-', '');

  insert into public.organizations (name, slug)
  values (coalesce(nullif(trim(profile_name), ''), 'مساحة عملي') || ' — مساحة العمل', generated_slug)
  returning * into existing_workspace;

  insert into public.memberships (organization_id, user_id, role, status)
  values (existing_workspace.id, auth.uid(), 'teacher', 'active');

  insert into public.audit_events (organization_id, actor_id, action, resource_type, resource_id, metadata)
  values (existing_workspace.id, auth.uid(), 'create', 'workspace', existing_workspace.id, '{"source":"automatic-personal-workspace"}'::jsonb);

  return existing_workspace;
end;
$$;

revoke all on function public.ensure_personal_workspace() from public;
grant execute on function public.ensure_personal_workspace() to authenticated;
