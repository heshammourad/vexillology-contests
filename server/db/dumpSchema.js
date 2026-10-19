/**
 * Writes the database schema (no data) to server/db/schema.sql, so the schema can be read
 * from the repo instead of only from the database. Schema changes are still made directly
 * against the database; rerun this afterwards and commit the result.
 *
 * Built from the catalog rather than pg_dump so it needs no local Postgres client tools.
 * The output is a reference for reading, not a restore script. It isn't tested as one, and no
 * single ordering would always work: tables come before functions, so a column default that
 * calls a custom function would fail, and only enum types are dumped, not domains or
 * composite types.
 *
 * This repository is public, so function and view bodies are withheld by default: only the
 * objects in PUBLISHED_DEFINITIONS are written out in full. Every other function is reduced to
 * its signature, and every other view to its columns. A new function or view stays withheld
 * until someone decides it is safe to publish and adds it below. Moderation and ballot-validity
 * logic never goes on that list.
 *
 * Some tables, columns and objects shouldn't even be named here. Those are listed in the
 * gitignored server/db/dumpSchema.withheld.json (shape below), which the script needs in order
 * to run, so a fresh checkout can't write an unfiltered file by accident. Everything in that
 * file is left out of the output entirely:
 *   { "tables": ["schema.table"], "columns": ["schema.table.column"], "objects": ["schema.name"] }
 * "objects" are functions or views to drop entirely, rather than reduce to a signature.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL = heroku config:get DATABASE_URL -a vexillology-contests
 *   npm run dump-schema
 */

const fs = require('fs');
const path = require('path');

const pgp = require('pg-promise')();

const SCHEMAS = ['vexillology_contests_common', 'vexillology_contests'];
const OUTPUT = path.join(__dirname, 'schema.sql');

// Functions and views whose full definitions are safe to publish (see the header), as
// schema.name. A name that doesn't match exactly stays withheld.
const PUBLISHED_DEFINITIONS = new Set(
  [
    'add_contest',
    'annual_standings',
    'backup_data',
    'best_of_year',
    'copy_contest',
    'create_best_of_year_contest',
    'hall_of_fame',
    'has_user_permission',
    'update_vote_timestamp',
  ].map((name) => `vexillology_contests.${name}`),
);
const isPublished = (schema, name) => PUBLISHED_DEFINITIONS.has(`${schema}.${name}`);

const WITHHELD_FILE = path.join(__dirname, 'dumpSchema.withheld.json');
if (!fs.existsSync(WITHHELD_FILE)) {
  process.stderr.write(
    `${path.basename(
      WITHHELD_FILE,
    )} is missing; see the header of this file.\n`,
  );
  process.exit(1);
}
const withheld = JSON.parse(fs.readFileSync(WITHHELD_FILE, 'utf8'));
const withheldTables = new Set(withheld.tables ?? []);
const withheldColumns = new Set(withheld.columns ?? []);
const withheldObjects = new Set(withheld.objects ?? []);
const isWithheldTable = (schema, table) => withheldTables.has(`${schema}.${table}`);
const isWithheldColumn = (schema, table, column) => withheldColumns.has(`${schema}.${table}.${column}`);

// Every withheld table and column name, matched as a whole word wherever it appears. This is
// deliberately broad: a constraint, index, trigger or published body that names one, for any
// reason, is left out or reduced. The final check before writing applies the same test to the
// whole file.
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const withheldNamePatterns = [
  ...[...withheldTables].map((key) => key.split('.')[1]),
  ...[...withheldColumns].map((key) => key.split('.')[2]),
].map((name) => ({ name, pattern: new RegExp(`\\b${escapeRegExp(name)}\\b`) }));
const namesWithheld = (text) => withheldNamePatterns.some(({ pattern }) => pattern.test(text));

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  process.stderr.write(
    'DATABASE_URL is not set; see the usage note at the top of this file.\n',
  );
  process.exit(1);
}

// Same switch as the server (server/env.js): SSL unless DATABASE_SSL is 'false', so the script can
// also run against a local copy.
const db = pgp({
  connectionString: DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

const ident = (name) => pgp.as.name(name);
const qualified = (schema, name) => `${ident(schema)}.${ident(name)}`;

const dumpTypes = async () => {
  const enums = await db.any(
    `SELECT n.nspname AS schema, t.typname AS name,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
     FROM pg_type t
     JOIN pg_namespace n ON n.oid = t.typnamespace
     JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE n.nspname IN ($1:csv)
     GROUP BY 1, 2
     ORDER BY 1, 2`,
    [SCHEMAS],
  );
  return enums.map(
    ({ schema, name, labels }) => `CREATE TYPE ${qualified(schema, name)} AS ENUM (\n${labels
      .map((label) => `  ${pgp.as.text(label)}`)
      .join(',\n')}\n);`,
  );
};

// Identity columns create their own sequences, so those are left out. A serial column's
// sequence is created here and tied back to its column (OWNED BY) once the tables exist.
const dumpSequences = async () => {
  const sequences = await db.any(
    `SELECT s.schemaname AS schema, s.sequencename AS name, s.data_type AS type,
       s.start_value AS start, s.increment_by AS increment, s.min_value AS min,
       s.max_value AS max, s.cache_size AS cache, s.cycle,
       owner_ns.nspname AS "ownerSchema", owner.relname AS "ownerTable",
       a.attname AS "ownerColumn"
     FROM pg_sequences s
     JOIN pg_namespace n ON n.nspname = s.schemaname
     JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = s.sequencename AND c.relkind = 'S'
     LEFT JOIN pg_depend d ON d.objid = c.oid AND d.deptype = 'a'
       AND d.refclassid = 'pg_class'::regclass AND d.refobjsubid > 0
     LEFT JOIN pg_class owner ON owner.oid = d.refobjid
     LEFT JOIN pg_namespace owner_ns ON owner_ns.oid = owner.relnamespace
     LEFT JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
     WHERE s.schemaname IN ($1:csv)
       AND NOT EXISTS (
         SELECT 1 FROM pg_depend i WHERE i.objid = c.oid AND i.deptype = 'i'
       )
     ORDER BY 1, 2`,
    [SCHEMAS],
  );
  const kept = sequences.filter(
    ({ ownerSchema, ownerTable, ownerColumn }) => !ownerTable
      || !(
        isWithheldTable(ownerSchema, ownerTable)
        || isWithheldColumn(ownerSchema, ownerTable, ownerColumn)
      ),
  );
  const creates = kept.map(
    ({
      schema, name, type, start, increment, min, max, cache, cycle,
    }) => `CREATE SEQUENCE ${qualified(
      schema,
      name,
    )} AS ${type} START ${start} INCREMENT ${increment} MINVALUE ${min} MAXVALUE ${max} CACHE ${cache}${
      cycle ? ' CYCLE' : ''
    };`,
  );
  const ownedBy = kept
    .filter(({ ownerTable }) => ownerTable)
    .map(
      ({
        schema, name, ownerSchema, ownerTable, ownerColumn,
      }) => `ALTER SEQUENCE ${qualified(schema, name)} OWNED BY ${qualified(
        ownerSchema,
        ownerTable,
      )}.${ident(ownerColumn)};`,
    );
  return { creates, ownedBy };
};

const dumpTables = async () => {
  const columns = await db.any(
    `SELECT n.nspname AS schema, c.relname AS "table", a.attname AS "column",
       format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS "notNull",
       pg_get_expr(d.adbin, d.adrelid) AS "default", a.attidentity AS identity,
       a.attgenerated AS generated
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
     LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
     WHERE n.nspname IN ($1:csv) AND c.relkind IN ('r', 'p')
     ORDER BY 1, 2, a.attnum`,
    [SCHEMAS],
  );
  const constraints = await db.any(
    `SELECT n.nspname AS schema, c.relname AS "table", k.conname AS name,
       k.contype AS kind, pg_get_constraintdef(k.oid) AS definition
     FROM pg_constraint k
     JOIN pg_class c ON c.oid = k.conrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ($1:csv) AND k.contype <> 'n'
     ORDER BY 1, 2, k.conname`,
    [SCHEMAS],
  );

  const tables = new Map();
  columns.forEach((col) => {
    if (
      isWithheldTable(col.schema, col.table)
      || isWithheldColumn(col.schema, col.table, col.column)
    ) {
      return;
    }
    const key = qualified(col.schema, col.table);
    if (!tables.has(key)) {
      tables.set(key, []);
    }
    let line = `  ${ident(col.column)} ${col.type}`;
    if (col.generated === 's') {
      line += ` GENERATED ALWAYS AS (${col.default}) STORED`;
    } else if (col.identity) {
      line += ` GENERATED ${
        col.identity === 'a' ? 'ALWAYS' : 'BY DEFAULT'
      } AS IDENTITY`;
    } else if (col.default !== null) {
      line += ` DEFAULT ${col.default}`;
    }
    if (col.notNull) {
      line += ' NOT NULL';
    }
    tables.get(key).push(line);
  });

  // Foreign keys go after every table exists; everything else goes inline.
  const foreignKeys = [];
  constraints.forEach(({
    schema, table, name, kind, definition,
  }) => {
    const key = qualified(schema, table);
    if (isWithheldTable(schema, table) || namesWithheld(definition)) {
      return;
    }
    if (kind === 'f') {
      foreignKeys.push(
        `ALTER TABLE ${key} ADD CONSTRAINT ${ident(name)} ${definition};`,
      );
    } else if (tables.has(key)) {
      tables.get(key).push(`  CONSTRAINT ${ident(name)} ${definition}`);
    }
  });

  const creates = [...tables.entries()].map(
    ([key, lines]) => `CREATE TABLE ${key} (\n${lines.join(',\n')}\n);`,
  );
  return { creates, foreignKeys };
};

const dumpIndexes = async () => {
  const indexes = await db.any(
    `SELECT pg_get_indexdef(i.indexrelid) AS definition, n.nspname AS schema,
       t.relname AS "table", t.relkind AS kind
     FROM pg_index i
     JOIN pg_class c ON c.oid = i.indexrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_class t ON t.oid = i.indrelid
     WHERE n.nspname IN ($1:csv)
       -- Skip indexes a PK/UNIQUE/EXCLUDE constraint creates. A foreign key's conindid points
       -- at the unique index it references, which must still be dumped.
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint k
         WHERE k.conindid = i.indexrelid AND k.contype IN ('p', 'u', 'x')
       )
     ORDER BY n.nspname, c.relname`,
    [SCHEMAS],
  );
  // A withheld materialized view's indexes would point at a relation this file doesn't define.
  return indexes
    .filter(
      ({
        schema, table, kind, definition,
      }) => (kind !== 'm' || isPublished(schema, table))
        && !isWithheldTable(schema, table)
        && !namesWithheld(definition),
    )
    .map(({ definition }) => `${definition};`);
};

const dumpFunctions = async () => {
  const functions = await db.any(
    `SELECT n.nspname AS schema, p.proname AS name,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS result,
       pg_get_functiondef(p.oid) AS definition
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname IN ($1:csv)
       AND p.prokind IN ('f', 'p')
       AND NOT EXISTS (
         SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
       )
     ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)`,
    [SCHEMAS],
  );
  return functions
    .filter(({ schema, name }) => !withheldObjects.has(`${schema}.${name}`))
    .map(({
      schema, name, args, result, definition,
    }) => (isPublished(schema, name) && !namesWithheld(definition)
      ? `${definition.trim()};`
      : `-- ${qualified(schema, name)}(${args})${
        result ? ` RETURNS ${result}` : ''
      }: definition withheld`));
};

// Views can read other views (best_of_year reads annual_standings, which reads
// contests_summary), so they are emitted in dependency order.
const dumpViews = async () => {
  const views = await db.any(
    `SELECT c.oid, n.nspname AS schema, c.relname AS name, c.relkind AS kind,
       pg_get_viewdef(c.oid, true) AS definition
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ($1:csv) AND c.relkind IN ('v', 'm')
     ORDER BY 2, 3`,
    [SCHEMAS],
  );
  const dependencies = await db.any(
    `SELECT DISTINCT r.ev_class AS view, d.refobjid AS "dependsOn"
     FROM pg_rewrite r
     JOIN pg_depend d ON d.objid = r.oid
     WHERE d.refobjid <> r.ev_class AND r.ev_class IN ($1:csv)`,
    [views.length ? views.map(({ oid }) => oid) : [0]],
  );

  const byOid = new Map(views.map((view) => [view.oid, view]));
  const emitted = new Set();
  const ordered = [];
  const visit = (view) => {
    if (emitted.has(view.oid)) {
      return;
    }
    emitted.add(view.oid);
    dependencies
      .filter((dep) => dep.view === view.oid && byOid.has(dep.dependsOn))
      .forEach((dep) => visit(byOid.get(dep.dependsOn)));
    ordered.push(view);
  };
  views.forEach(visit);

  const columns = await db.any(
    `SELECT a.attrelid AS view, a.attname AS name,
       format_type(a.atttypid, a.atttypmod) AS type
     FROM pg_attribute a
     WHERE a.attrelid IN ($1:csv) AND a.attnum > 0 AND NOT a.attisdropped
     ORDER BY a.attrelid, a.attnum`,
    [views.length ? views.map(({ oid }) => oid) : [0]],
  );

  return ordered
    .filter(({ schema, name }) => !withheldObjects.has(`${schema}.${name}`))
    .map(({
      oid, schema, name, kind, definition,
    }) => {
      if (!isPublished(schema, name) || namesWithheld(definition)) {
        const columnList = columns
          .filter((col) => col.view === oid && !namesWithheld(col.name))
          .map((col) => `--   ${ident(col.name)} ${col.type}`)
          .join('\n');
        return `-- ${kind === 'm' ? 'MATERIALIZED VIEW' : 'VIEW'} ${qualified(
          schema,
          name,
        )}: definition withheld. Columns:\n${columnList}`;
      }
      const body = definition.trim().replace(/;$/, '');
      return kind === 'm'
        ? `CREATE MATERIALIZED VIEW ${qualified(
          schema,
          name,
        )} AS\n${body}\nWITH NO DATA;`
        : `CREATE VIEW ${qualified(schema, name)} AS\n${body};`;
    });
};

const dumpTriggers = async () => {
  const triggers = await db.any(
    `SELECT pg_get_triggerdef(t.oid) AS definition, n.nspname AS schema,
       c.relname AS "table"
     FROM pg_trigger t
     JOIN pg_class c ON c.oid = t.tgrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ($1:csv) AND NOT t.tgisinternal
     ORDER BY n.nspname, c.relname, t.tgname`,
    [SCHEMAS],
  );
  return triggers
    .filter(({ schema, table, definition }) => {
      const hidden = isWithheldTable(schema, table) || namesWithheld(definition);
      return !hidden;
    })
    .map(({ definition }) => `${definition};`);
};

const section = (title, statements) => (statements.length ? `-- ${title}\n\n${statements.join('\n\n')}\n` : '');

(async () => {
  try {
    const { creates, foreignKeys } = await dumpTables();
    const sequences = await dumpSequences();
    const output = [
      '-- Generated by server/db/dumpSchema.js (npm run dump-schema). Do not edit by hand:',
      '-- change the database, then rerun the script. Structure only, no data.',
      '',
      'SET check_function_bodies = false;',
      '',
      SCHEMAS.map(
        (schema) => `CREATE SCHEMA IF NOT EXISTS ${ident(schema)};`,
      ).join('\n'),
      '',
      section('Types', await dumpTypes()),
      section('Sequences', sequences.creates),
      section('Tables', creates),
      section('Sequence ownership', sequences.ownedBy),
      section('Foreign keys', foreignKeys),
      section('Functions', await dumpFunctions()),
      section('Views', await dumpViews()),
      // After the views, since materialized views carry indexes too.
      section('Indexes', await dumpIndexes()),
      section('Triggers', await dumpTriggers()),
    ].join('\n');

    // Last line of defence: if any withheld name survived the filters above, write nothing. The
    // report goes to this terminal only, as line numbers and names, never into the file.
    const leaks = output
      .split('\n')
      .flatMap((line, index) => withheldNamePatterns
        .filter(({ pattern }) => pattern.test(line))
        .map(({ name }) => `  line ${index + 1}: ${name}`));
    if (leaks.length) {
      throw new Error(
        `Refusing to write ${path.basename(
          OUTPUT,
        )}: withheld names would appear in it.\n${leaks.join('\n')}\n`
          + 'Take the object that names them off PUBLISHED_DEFINITIONS, or add it to "objects" in the '
          + 'withheld file.',
      );
    }

    fs.writeFileSync(OUTPUT, `${output.trimEnd()}\n`);
    process.stdout.write(`Wrote ${path.relative(process.cwd(), OUTPUT)}\n`);
  } finally {
    pgp.end();
  }
})().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
