# Security Policy

## Supported Versions

The latest published minor version receives security fixes.

## Reporting a Vulnerability

Report vulnerabilities privately through GitHub's [security advisory](https://github.com/NellowTCS/vite-plugin-seo-meta/security/advisories/new) form. Do not open a public issue for a suspected vulnerability.

Include:

- Affected version(s).
- A minimal reproduction.
- The impact and any known exploitation.
- Suggested remediation, if you have one.

You should expect an acknowledgement within 72 hours and a status update within 7 days.

## Scope and Threat Model

This plugin runs at build time, inside your Vite build. Its threat model is therefore about not introducing new injection sinks from data the build does not control.

Configuration values are trusted, because they are added by the developer who runs the build.
