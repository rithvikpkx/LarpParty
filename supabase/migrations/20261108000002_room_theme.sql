-- The UI style the host picked for this room. Phones follow it unless they
-- choose their own. Null = whatever each device last used.
-- Valid ids live in src/themes/registry.ts and are checked by the server action.
alter table public.rooms add column theme text check (theme is null or theme ~ '^[a-z0-9]{2,16}$');
