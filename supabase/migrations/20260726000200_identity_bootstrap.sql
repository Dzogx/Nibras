-- Sprint 1: secure user bootstrap and organization creation.
-- The function creates only the caller's first organization and membership.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'مستخدم جديد')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.create_organization_with_owner(organization_name text, organization_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  created_organization public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(organization_name)) < 2 or char_length(trim(organization_name)) > 200 then
    raise exception 'Invalid organization name';
  end if;
  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid organization slug';
  end if;

  insert into public.organizations (name, slug)
  values (trim(organization_name), organization_slug)
  returning * into created_organization;

  insert into public.memberships (organization_id, user_id, role, status)
  values (created_organization.id, auth.uid(), 'school_manager', 'active');

  insert into public.audit_events (organization_id, actor_id, action, resource_type, resource_id)
  values (created_organization.id, auth.uid(), 'create', 'organization', created_organization.id);

  return created_organization;
end;
$$;

revoke all on function public.create_organization_with_owner(text, text) from public;
grant execute on function public.create_organization_with_owner(text, text) to authenticated;
