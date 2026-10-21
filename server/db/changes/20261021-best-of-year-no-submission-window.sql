-- Best of Year contests take no submissions, so create them with no submission window. Apply after
-- 20261019-best-of-year-prompt.sql.

-- 1. Insert the contest directly instead of calling add_contest, which requires a submission
-- window. A Best of Year contest has no categories, so the insert is all add_contest did for it.
CREATE OR REPLACE FUNCTION create_best_of_year_contest(p_year integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_contest_id VARCHAR;
    v_contest_date DATE;
    v_contest_name VARCHAR;
    v_contest_prompt VARCHAR;
    v_vote_start TIMESTAMPTZ;
    v_vote_end TIMESTAMPTZ;
BEGIN
    -- 1. Default to current year if input is NULL
    IF p_year IS NULL THEN
        p_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    END IF;

    -- 2. Construct IDs and Names based on the year
    -- Example: best24
    v_contest_id := 'best' || RIGHT(p_year::text, 2);
    -- Example: Best of 2024
    v_contest_name := 'Best of ' || p_year::text;
    -- Markdown, shown on the contest page.
    -- Describes the best_of_year view's selection: update it if the view changes.
    v_contest_prompt := 'Vote for the best flag of ' || p_year::text || '. The entries are every '
        || 'contest''s top three finishers this year, plus the best entry from each of the year''s '
        || 'top 30 contestants.';

    -- 3. Define the Schedule. There is no submission window: the entries come from the
    -- best_of_year view.
    v_contest_date := make_date(p_year, 12, 23);

    -- Vote Start: Dec 23rd @ 9PM PST
    v_vote_start := (v_contest_date || ' 21:00:00')::TIMESTAMPTZ AT TIME ZONE 'America/Los_Angeles';

    -- Vote End: Dec 27th @ 9PM PST
    v_vote_end := (make_date(p_year, 12, 27) || ' 21:00:00')::TIMESTAMPTZ AT TIME ZONE 'America/Los_Angeles';

    -- 4. Create the contest
    INSERT INTO contests (
        id,
        name,
        date,
        year_end,
        prompt,
        submission_start,
        submission_end,
        vote_start,
        vote_end
    )
    VALUES (
        v_contest_id,
        v_contest_name,
        v_contest_date,
        TRUE,
        v_contest_prompt,
        NULL,
        NULL,
        v_vote_start,
        v_vote_end
    );

    -- 5. Populate contest_entries from the best_of_year view
    INSERT INTO contest_entries (contest_id, entry_id)
    SELECT
        v_contest_id,
        entry_id
    FROM
        best_of_year
    ON CONFLICT (contest_id, entry_id) DO NOTHING;

    RAISE NOTICE 'Contest % created for year % and populated with entries.', v_contest_id, p_year;

END;
$function$;

-- 2. add_contest has no callers left.
DROP FUNCTION IF EXISTS add_contest(
    character varying,
    character varying,
    character varying,
    character varying,
    boolean,
    timestamp with time zone,
    timestamp with time zone,
    timestamp with time zone,
    timestamp with time zone,
    text[]
);

-- 3. Backfill: clear the placeholder submission windows of existing Best of Year contests.
UPDATE contests
SET submission_start = NULL, submission_end = NULL
WHERE year_end AND submission_start IS NOT NULL;
