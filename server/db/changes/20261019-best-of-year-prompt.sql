-- add_contest now requires a prompt, so create_best_of_year_contest passes one instead of NULL.
-- Also drops the hardcoded vexillology_contests. prefixes, so it follows the search path, and
-- fails cleanly if add_contest writes the contest to a different schema.
CREATE OR REPLACE FUNCTION create_best_of_year_contest(p_year integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_contest_id VARCHAR;
    v_contest_date DATE;
    v_contest_name VARCHAR;
    v_contest_prompt VARCHAR;
    v_sub_start TIMESTAMPTZ;
    v_sub_end TIMESTAMPTZ;
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
    -- add_contest requires a prompt. Markdown, shown on the contest page.
    -- Describes the best_of_year view's selection: update it if the view changes.
    v_contest_prompt := 'Vote for the best flag of ' || p_year::text || '. The entries are every '
        || 'contest''s top three finishers this year, plus the best entry from each of the year''s '
        || 'top 30 contestants.';

    -- 3. Define the Schedule
    -- Based on your example, the "Date" is Dec 23rd.
    v_contest_date := make_date(p_year, 12, 23);

    -- Submission Start: Nov 30th @ 9PM PST
    v_sub_start := (make_date(p_year, 11, 30) || ' 21:00:00')::TIMESTAMPTZ AT TIME ZONE 'America/Los_Angeles';

    -- Submission End: Dec 16th @ 9PM PST
    v_sub_end := (make_date(p_year, 12, 16) || ' 21:00:00')::TIMESTAMPTZ AT TIME ZONE 'America/Los_Angeles';

    -- Vote Start: Dec 23rd @ 9PM PST
    v_vote_start := (v_contest_date || ' 21:00:00')::TIMESTAMPTZ AT TIME ZONE 'America/Los_Angeles';

    -- Vote End: Dec 27th @ 9PM PST
    v_vote_end := (make_date(p_year, 12, 27) || ' 21:00:00')::TIMESTAMPTZ AT TIME ZONE 'America/Los_Angeles';

    -- 4. Call existing add_contest function
    PERFORM add_contest(
        p_name := v_contest_name,
        p_date := v_contest_date::VARCHAR,
        p_prompt := v_contest_prompt,
        p_id := v_contest_id,
        p_year_end := TRUE,
        p_submission_start := v_sub_start,
        p_submission_end := v_sub_end,
        p_vote_start := v_vote_start,
        p_vote_end := v_vote_end,
        p_categories := NULL
    );

    -- add_contest's body may still name a fixed schema. If the contest didn't land in this
    -- one, raise, which rolls back whatever add_contest wrote elsewhere.
    IF NOT EXISTS (SELECT 1 FROM contests WHERE id = v_contest_id) THEN
        RAISE EXCEPTION 'add_contest did not create contest % in schema %', v_contest_id, current_schema();
    END IF;

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
