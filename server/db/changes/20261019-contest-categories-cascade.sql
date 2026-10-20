-- Let a contest's categories follow it when the Manage Contests page renames an upcoming
-- contest's id (renameContestId) or deletes it. vexillology_contests_staging already has this.
BEGIN;

ALTER TABLE contest_categories DROP CONSTRAINT IF EXISTS contest_categories_fk;

ALTER TABLE contest_categories
  ADD CONSTRAINT contest_categories_fk FOREIGN KEY (contest_id) REFERENCES contests(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;
