# Maintenance verification, October 2026

A failed decode previously rejected an entire upload batch; successful conversions
were lost, and the uncaught promise prevented input reset. Rendering also created
fresh preview URLs without releasing them. Four converter regressions were first
reproduced failing: URL cleanup after success, decode/context failure, and accepting
a null PNG output. The converter now rejects failed encoding and always releases
its source URL, including drawing/encoding exceptions.

The upload and drop paths now share settled batch conversion. Valid images remain
available when another file is corrupt. PNG previews own one URL per mounted result;
delete, clear and unmount release it. Clearing discards a pending batch. Late results
after unmount cannot create preview resources. Terminal WEBP extensions are replaced
case-insensitively, ZIP paths are sanitized, and output names remain unique across
batches. ZIP errors are caught. Files and converted payloads stay local.

The existing product restriction for mobile Android, iPhone and mobile-web launch
platforms remains. A desktop launch with unrelated `mobile_android` text in another
query field no longer accidentally disables conversion. Init/ad rejection fails open.

## Dependencies and checks

Compatible React 19.3, VKUI 8.4.1, Bridge 3, Vite 8, plugin-legacy 8, ESLint 10 and
Vitest 5. TypeScript is held at 6.0.3 within typescript-eslint's <6.1 peer range;
the registry's TypeScript 7 is not forced past that contract. Native browser UUIDs
replace the otherwise unused UUID package and obsolete stub types. The existing
legacy build target is retained. Modern VKUI component names and Bridge types are
updated without changing hosting identifiers or asset contents.

The old lock could not reconcile its ESLint 8 tree with current compatible peers.
A fresh npm lock resolves cleanly, without force or legacy-peer-deps. Local lint,
application/configuration types,10 Node utility tests,4 React lifecycle tests and
production build pass. Full approved npm audit reports zero vulnerabilities on
2026-10-03. Install/CI explicitly disables implicit audit and lifecycle scripts.
The legacy build retains a large-chunk warning; no warning threshold was weakened.

Six browser cases use canvas-generated WebP fixtures, validate actual PNG signatures,
size and pixels, inspect both colliding ZIP outputs, exercise partial failure/retry
and retain the mobile-host restriction. Only host Bridge calls are mocked; external
requests are blocked and no user files or real uploads are used. Final browser and
container results are established by exact-head CI.

Docker moves Node20 to current LTS24.21.0 and Nginx to stable1.30.5, using verified
official multi-platform image digests. CI builds the production image, checks Nginx
configuration, and serves it only on loopback for an HTTP smoke check. Local Docker
is unavailable; container verification therefore runs in CI. Original artwork is
preserved, including the large icon omitted from the local snapshot.

Native VK host ads, insets and device-specific downloads remain release checks.
No merge, deployment or production service was used.
