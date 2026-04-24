#!/usr/bin/env bash
# Mirror bradleyio public/data to cjgaldescom so cjgaldes.com serves the same feed.
# Invoked at the tail of bradleyio cron chains. Safe to run anytime — rsync is idempotent.
set -u
rsync -a /home/bisenbek/projects/bradleyio/public/data/ /home/bisenbek/projects/cjgaldescom/public/data/
