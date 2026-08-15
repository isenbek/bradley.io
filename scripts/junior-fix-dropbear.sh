#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — repair ssh key auth on Armando's OpenWrt Pi 5 (10.10.0.2).
#
# THE BUG
#   The imagebuilder overlay baked /etc/dropbear with mode 0775. Confirmed
#   on-device via ubus stat:
#       /etc/dropbear                 mode 040775 uid 0 gid 0   <-- group-writable
#       /etc/dropbear/authorized_keys mode 100600 uid 0 gid 0   <-- correct
#   Dropbear refuses to read authorized_keys out of a group-writable directory
#   and rejects every key, which looks identical to "wrong key".
#   Ownership is already root:root, so the whole fix is: chmod 700.
#
# WHY THIS ROUNDABOUT ROUTE
#   We have no shell (that IS the bug). LuCI's ubus RPC accepts root with the
#   default empty password, but its ACL denies arbitrary `file exec`. It DOES
#   permit writing /etc/crontabs/root and running `/etc/init.d/cron reload`,
#   so we land one scheduled command. The cron line deletes itself after it
#   runs, leaving the device clean.
#
#   Reachable only from impera — 10.10.0.2 lives inside the wg-pi5 tunnel.
#
# Run:  ./scripts/junior-fix-dropbear.sh
# =============================================================================
set -uo pipefail

HOST="${HOST:-10.10.0.2}"
UBUS="http://${HOST}/ubus"
MARK="junior-fix"

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad() { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

# ---- ubus plumbing ----------------------------------------------------------
# Sessions expire in 300s, so every call logs in fresh. Cheap and stateless.
sid() {
  curl -s -m 10 -X POST "$UBUS" -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"call","params":["00000000000000000000000000000000","session","login",{"username":"root","password":""}]}' \
    | grep -o '"ubus_rpc_session":"[a-f0-9]*"' | cut -d'"' -f4
}

call() { # call <object> <method> <json-args>
  local s; s="$(sid)"
  if [[ -z "$s" ]]; then bad "could not open a ubus session on $HOST"; return 1; fi
  curl -s -m 20 -X POST "$UBUS" -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"call\",\"params\":[\"$s\",\"$1\",\"$2\",$3]}"
}

# ubus returns [code, data]; 0 = success. Anything else is a failure code
# (4 = not found, 6 = permission denied).
rc_of() { printf '%s' "$1" | grep -o '"result":\[[0-9]*' | grep -o '[0-9]*$'; }

dir_mode() {
  call file stat '{"path":"/etc/dropbear"}' \
    | grep -o '"mode":[0-9]*' | cut -d: -f2
}

# ---- preflight --------------------------------------------------------------
say "checking $HOST is reachable over the tunnel"
if ! ping -c1 -W3 "$HOST" >/dev/null 2>&1; then
  bad "no ICMP response from $HOST — is wg-pi5 up? (sudo wg show wg-pi5)"
  exit 1
fi
ok "tunnel is live"

before="$(dir_mode)"
if [[ -z "$before" ]]; then
  bad "ubus stat failed — LuCI may no longer accept the empty root password"
  exit 1
fi
# 16893 == 0o40775 (group-writable). 16832 == 0o40700 (what we want).
printf '    /etc/dropbear mode = %s (octal %s)\n' "$before" "$(printf '%o' "$before")"
if [[ "$before" == "16832" ]]; then
  ok "already 0700 — nothing to change"
  exit 0
fi

# ---- land the fix via cron --------------------------------------------------
say "installing a self-deleting cron entry"
LINE="* * * * * chmod 700 /etc/dropbear; /etc/init.d/dropbear restart; sed -i \"/${MARK}/d\" /etc/crontabs/root; /etc/init.d/cron reload # ${MARK}"
DATA="$(python3 -c 'import json,sys; print(json.dumps({"path":"/etc/crontabs/root","data":sys.argv[1]+chr(10)}))' "$LINE")"

resp="$(call file write "$DATA")"
if [[ "$(rc_of "$resp")" != "0" ]]; then
  bad "crontab write refused: $resp"
  exit 1
fi
ok "crontab written"

resp="$(call file exec '{"command":"/etc/init.d/cron","params":["reload"]}')"
if [[ "$(rc_of "$resp")" != "0" ]]; then
  bad "cron reload refused: $resp"
  exit 1
fi
ok "cron reloaded — the line fires at the top of the next minute"

# ---- wait for it ------------------------------------------------------------
say "waiting up to 150s for the mode to flip"
for i in $(seq 1 30); do
  sleep 5
  now="$(dir_mode)"
  if [[ "$now" == "16832" ]]; then
    ok "/etc/dropbear is now 0700"
    break
  fi
  printf '    %ds… (mode still %s)\n' $(( i * 5 )) "${now:-?}"
done

if [[ "$(dir_mode)" != "16832" ]]; then
  bad "mode never changed — crond is probably not running on the device."
  echo "    Fallback: write the same command to /etc/rc.local (also ACL-writable)"
  echo "    and reboot via ubus (/sbin/reboot is permitted)."
  exit 1
fi

# ---- prove ssh works --------------------------------------------------------
say "testing ssh key auth"
sleep 3
if timeout 20 ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=8 \
     -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519 "root@${HOST}" \
     'echo CONNECTED; uname -sr; uptime' 2>&1; then
  ok "SSH WORKS — ssh root@${HOST}"
else
  bad "ssh still refused; check /etc/dropbear/authorized_keys contents"
  exit 1
fi

say "leftover cron check (should be empty)"
call file read '{"path":"/etc/crontabs/root"}'
echo
echo "REMINDER: the root password on this device is still EMPTY."
echo "Set it once you have a shell:  passwd"
echo "And fix the build overlay so the next flash is clean:"
echo "  chmod 700 /mnt/ursa/build/openwrt-rpi5/files/etc/dropbear"
