#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const registerPath = new URL(
  '../config/dependency-advisories.json',
  import.meta.url,
);
const severities = ['low', 'moderate', 'high', 'critical'];

async function loadRegister() {
  const raw = await readFile(registerPath, 'utf8');
  const register = JSON.parse(raw);
  const byId = new Map();

  for (const entry of register.advisories) {
    for (const field of [
      'id',
      'package',
      'severity',
      'exposure',
      'mitigation',
      'owner',
      'reviewBy',
    ]) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
        throw new Error(
          `config/dependency-advisories.json entry ${entry.id ?? '<unknown>'} is missing required field "${field}".`,
        );
      }
    }

    if (severities.indexOf(entry.severity) === -1) {
      throw new Error(
        `config/dependency-advisories.json entry ${entry.id} has unknown severity "${entry.severity}".`,
      );
    }

    if (Number.isNaN(Date.parse(entry.reviewBy))) {
      throw new Error(
        `config/dependency-advisories.json entry ${entry.id} has an invalid reviewBy date "${entry.reviewBy}".`,
      );
    }

    if (byId.has(entry.id)) {
      throw new Error(
        `config/dependency-advisories.json lists advisory ${entry.id} twice.`,
      );
    }

    byId.set(entry.id, entry);
  }

  return byId;
}

async function readAuditAdvisories() {
  let stdout;

  try {
    stdout = execFileSync('npm', ['audit', '--json', '--audit-level=low'], {
      encoding: 'utf8',
      shell: true,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    // npm audit exits non-zero whenever it reports an advisory, so the report
    // still has to be read from the failure output.
    stdout = typeof error.stdout === 'string' ? error.stdout : '';
  }

  if (stdout.trim() === '') {
    throw new Error(
      'npm audit returned no output, so advisories cannot be verified.',
    );
  }

  const audit = JSON.parse(stdout);
  const advisories = new Map();

  for (const vulnerability of Object.values(audit.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via === 'string') {
        continue;
      }

      const id = String(via.source);

      if (!advisories.has(id)) {
        advisories.set(id, {
          id,
          package: vulnerability.name,
          severity: via.severity,
          title: via.title,
        });
      }
    }
  }

  return advisories;
}

function formatAdvisories(advisories) {
  return advisories
    .map(
      (advisory) =>
        `  ${advisory.severity.padEnd(8)} ${advisory.id}  ${advisory.package}  ${advisory.title}`,
    )
    .join('\n');
}

const register = await loadRegister();
const advisories = await readAuditAdvisories();

const unreviewed = [...advisories.values()].filter(
  (advisory) => !register.has(advisory.id),
);
const stale = [...register.values()].filter(
  (entry) => !advisories.has(entry.id),
);
const expired = [...register.values()].filter(
  (entry) => Date.parse(entry.reviewBy) < Date.now(),
);

let failed = false;

if (unreviewed.length > 0) {
  failed = true;
  console.error(
    `npm audit reported ${unreviewed.length} advisory(ies) with no entry in config/dependency-advisories.json:\n${formatAdvisories(unreviewed)}\n\n` +
      'Add each one with an owner, exposure analysis, mitigation, and review date, or remove it by upgrading.',
  );
}

if (stale.length > 0) {
  failed = true;
  console.error(
    `config/dependency-advisories.json contains ${stale.length} entry(ies) that npm audit no longer reports:\n${formatAdvisories(stale)}\n\n` +
      'Delete these entries as part of the change that resolved them.',
  );
}

if (expired.length > 0) {
  failed = true;
  console.error(
    `The following accepted advisories are past their reviewBy date:\n${formatAdvisories(expired)}\n\n` +
      'Re-assess exposure, then update reviewBy or remove the entry.',
  );
}

if (failed) {
  process.exit(1);
}

console.log(
  `Dependency advisory policy passed: ${advisories.size} known advisory(ies), all reviewed and within their review window.`,
);
