/**
 * Writes the database schema (no data) to server/db/schema.sql, so the schema can be read
 * from the repo instead of only from the database. Schema changes are still made directly
 * against the database; rerun this afterwards and commit the result.
 *
 * Built from the catalog rather than pg_dump so it needs no local Postgres client tools.
 * The output is a reference: it is ordered so it would restore, but it isn't tested as a
 * restore script.
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

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  process.stderr.write(
    'DATABASE_URL is not set; see the usage note at the top of this file.\n',
  );
  process.exit(1);
}

const db = pgp({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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

const dumpSequences = async () => {
  const sequences = await db.any(
    `SELECT schemaname AS schema, sequencename AS name, data_type AS type,
       start_value AS start, increment_by AS increment
     FROM pg_sequences
     WHERE schemaname IN ($1:csv)
     ORDER BY 1, 2`,
    [SCHEMAS],
  );
  return sequences.map(
    ({
      schema, name, type, start, increment,
    }) => `CREATE SEQUENCE ${qualified(
      schema,
      name,
    )} AS ${type} START ${start} INCREMENT ${increment};`,
  );
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
    `SELECT pg_get_indexdef(i.indexrelid) AS definition
     FROM pg_index i
     JOIN pg_class c ON c.oid = i.indexrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ($1:csv)
       AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid)
     ORDER BY n.nspname, c.relname`,
    [SCHEMAS],
  );
  return indexes.map(({ definition }) => `${definition};`);
};

const dumpFunctions = async () => {
  const functions = await db.any(
    `SELECT pg_get_functiondef(p.oid) AS definition
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
  return functions.map(({ definition }) => `${definition.trim()};`);
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

  return ordered.map(({
    schema, name, kind, definition,
  }) => {
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
    `SELECT pg_get_triggerdef(t.oid) AS definition
     FROM pg_trigger t
     JOIN pg_class c ON c.oid = t.tgrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ($1:csv) AND NOT t.tgisinternal
     ORDER BY n.nspname, c.relname, t.tgname`,
    [SCHEMAS],
  );
  return triggers.map(({ definition }) => `${definition};`);
};

const section = (title, statements) => (statements.length ? `-- ${title}\n\n${statements.join('\n\n')}\n` : '');

(async () => {
  try {
    const { creates, foreignKeys } = await dumpTables();
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
      section('Sequences', await dumpSequences()),
      section('Tables', creates),
      section('Foreign keys', foreignKeys),
      section('Functions', await dumpFunctions()),
      section('Views', await dumpViews()),
      // After the views, since materialized views carry indexes too.
      section('Indexes', await dumpIndexes()),
      section('Triggers', await dumpTriggers()),
    ].join('\n');

    fs.writeFileSync(OUTPUT, `${output.trimEnd()}\n`);
    process.stdout.write(`Wrote ${path.relative(process.cwd(), OUTPUT)}\n`);
  } finally {
    pgp.end();
  }
})().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
