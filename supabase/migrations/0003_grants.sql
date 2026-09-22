-- ritmo — table-level grants
--
-- RLS policies (0002) control which ROWS a role can see. They don't matter
-- until the role also has base GRANT access to touch the table at all —
-- that's what was missing, causing a blanket 403 on every table regardless
-- of the RLS logic.

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- So this also applies automatically to any table added in a future migration.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- exercises is the one read-only/public table — authenticated can SELECT
-- (granted above), but should not be able to write to it from the client.
revoke insert, update, delete on exercises from authenticated;
