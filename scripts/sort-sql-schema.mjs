#!/usr/bin/env node
/**
 * Sort SQL schema dump for better comparison
 * Usage: node scripts/sort-sql-schema.mjs schema.sql
 */
import { readFileSync, writeFileSync } from 'node:fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/sort-sql-schema.mjs <schema-file.sql>');
  process.exit(1);
}

console.log(`Sorting ${filePath}...`);

const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Parse SQL statements
const statements = {
  constraints: [],
  extensions: [],
  foreignKeys: [],
  functions: [],
  indexes: [],
  other: [],
  sequences: [],
  tables: [],
};

let currentStatement = [];
let currentType = null;
let inFunction = false;

for (const line of lines) {
  // Skip empty lines when not building a statement
  if (!currentStatement.length && !line.trim()) {
    continue;
  }

  // Detect statement type
  if (line.startsWith('CREATE EXTENSION')) {
    currentType = 'extensions';
    currentStatement = [line];
    // Check if single-line statement
    if (line.trim().endsWith(';')) {
      statements[currentType].push(currentStatement.join('\n'));
      currentStatement = [];
      currentType = null;
    }
  } else if (line.startsWith('CREATE SEQUENCE')) {
    currentType = 'sequences';
    currentStatement = [line];
    // Check if single-line statement (most sequences are)
    if (line.trim().endsWith(';')) {
      statements[currentType].push(currentStatement.join('\n'));
      currentStatement = [];
      currentType = null;
    }
  } else if (line.match(/^CREATE (OR REPLACE )?FUNCTION/)) {
    currentType = 'functions';
    currentStatement = [line];
    inFunction = true;
  } else if (line.startsWith('CREATE TABLE')) {
    currentType = 'tables';
    currentStatement = [line];
  } else if (line.match(/^CREATE (UNIQUE )?INDEX/)) {
    currentType = 'indexes';
    currentStatement = [line];
    // Check if single-line statement (most indexes are)
    if (line.trim().endsWith(';')) {
      statements[currentType].push(currentStatement.join('\n'));
      currentStatement = [];
      currentType = null;
    }
  } else if (line.startsWith('ALTER TABLE')) {
    // Check if it's a FOREIGN KEY constraint
    const isForeignKey = line.includes('FOREIGN KEY') || line.includes('REFERENCES');
    currentType = isForeignKey ? 'foreignKeys' : 'constraints';
    currentStatement = [line];
    // Check if single-line statement (most constraints are)
    if (line.trim().endsWith(';')) {
      statements[currentType].push(currentStatement.join('\n'));
      currentStatement = [];
      currentType = null;
    }
  } else if (currentStatement.length > 0) {
    // Continue current statement
    currentStatement.push(line);

    // Detect end of statement
    const trimmed = line.trim();
    if (inFunction) {
      // Functions end with $$; or $_$; or similar
      if (trimmed.endsWith('$;') || trimmed.endsWith('$$;') || trimmed.endsWith('$_$;')) {
        statements[currentType].push(currentStatement.join('\n'));
        currentStatement = [];
        currentType = null;
        inFunction = false;
      }
    } else if (trimmed === ');' || trimmed.endsWith(';')) {
      // Other statements end with ; or );
      // Check if we're building a FOREIGN KEY constraint (multiline)
      if (currentType === 'constraints') {
        const fullStatement = currentStatement.join('\n');
        if (fullStatement.includes('FOREIGN KEY') || fullStatement.includes('REFERENCES')) {
          // Move to foreignKeys category
          statements.foreignKeys.push(fullStatement);
        } else {
          statements.constraints.push(fullStatement);
        }
      } else {
        statements[currentType].push(currentStatement.join('\n'));
      }
      currentStatement = [];
      currentType = null;
    }
  } else if (line.trim()) {
    // Standalone line (not part of a statement) - skip it
    // statements.other.push(line);
  }
}

// Sort each category alphabetically
const sortByFirstLine = (a, b) => {
  const nameA = a.split('\n')[0].toLowerCase();
  const nameB = b.split('\n')[0].toLowerCase();
  return nameA.localeCompare(nameB);
};

statements.extensions.sort(sortByFirstLine);
statements.functions.sort(sortByFirstLine);
statements.sequences.sort(sortByFirstLine);
statements.tables.sort(sortByFirstLine);
statements.indexes.sort(sortByFirstLine);
statements.constraints.sort(sortByFirstLine);
statements.foreignKeys.sort(sortByFirstLine);

// Rebuild sorted content
const sortedContent = [
  // Extensions first
  ...statements.extensions,
  '',
  // Functions
  ...statements.functions,
  '',
  // Sequences (before tables, as tables may depend on them)
  ...statements.sequences,
  '',
  // Tables
  ...statements.tables,
  '',
  // Indexes
  ...statements.indexes,
  '',
  // Constraints (PRIMARY KEY, UNIQUE, CHECK, etc.)
  ...statements.constraints,
  '',
  // Foreign Keys (after other constraints, as they need unique constraints)
  ...statements.foreignKeys,
  '',
  // Other
  ...statements.other,
].join('\n');

writeFileSync(filePath, sortedContent, 'utf-8');

console.log(`✓ Sorted ${filePath}`);
console.log(`  Extensions: ${statements.extensions.length}`);
console.log(`  Functions: ${statements.functions.length}`);
console.log(`  Sequences: ${statements.sequences.length}`);
console.log(`  Tables: ${statements.tables.length}`);
console.log(`  Indexes: ${statements.indexes.length}`);
console.log(`  Constraints: ${statements.constraints.length}`);
console.log(`  Foreign Keys: ${statements.foreignKeys.length}`);
