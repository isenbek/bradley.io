#!/usr/bin/env bash
# Mirror bradleyio public/data to cjgaldescom so cjgaldes.com serves the same feed.
# Invoked at the tail of bradleyio cron chains. Safe to run anytime — rsync is idempotent.
set -u
# ai-pilot-data.json is held back (2026-10-02): pipeline 2.0.0 publishes null
# where a cost could not be computed, and cjgaldes.com's /ai-pilot page calls
# .toFixed on those fields and would crash for real visitors. That site keeps
# its last copy until its three components are patched and it is rebuilt
# (components/ai-pilot/TypeRatings.tsx, TokenEconomy.tsx, types.ts); then
# remove this exclude.
rsync -a --exclude ai-pilot-data.json /home/bisenbek/projects/bradleyio/public/data/ /home/bisenbek/projects/cjgaldescom/public/data/
