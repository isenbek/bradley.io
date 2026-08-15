#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — give Armando local (LAN-side) ssh + LuCI access to the Pi 5.
#
# THE SITUATION
#   eth0 picked up 10.0.0.76/24 from Armando's home router via DHCP, but the
#   image assigns eth0 to the **wan** zone, and OpenWrt's wan zone defaults to
#   input='REJECT'. So from his laptop the Pi looks dead on every port. The
#   'lan' zone exists but only covers the 192.168.99.1 recovery alias.
#
#   Also, the first-boot script set dropbear PasswordAuth='off' and
#   RootPasswordAuth='off', so only keys work — and Armando's key isn't on the
#   box. Since he'll log in as root with a password, both must be re-enabled.
#
# WHAT THIS DOES
#   1. dropbear: PasswordAuth + RootPasswordAuth -> on
#   2. firewall: ACCEPT tcp/22 and tcp/80 on the wan zone, but ONLY from
#      src_ip 10.0.0.0/24 (his LAN). Not open to the internet, and the Pi
#      sits behind his router's NAT besides.
#   3. restarts firewall + dropbear, then prints the result
#
#   Rules are named Junior-* and are removed/recreated on every run, so this
#   is idempotent and trivial to reverse:
#       uci show firewall | grep Junior
#
# ⚠️  The root password is currently "password". These rules make the box
#    reachable from the LAN with it. Change it before this outlives the setup.
#
# Run:  ./scripts/junior-local-access.sh
# =============================================================================
set -uo pipefail

HOST="${HOST:-10.10.0.2}"
KEY="${KEY:-$HOME/.ssh/id_ed25519_cbrouter}"
LANNET="${LANNET:-10.0.0.0/24}"

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=8
     -o IdentitiesOnly=yes -i "$KEY" "root@${HOST}")

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad() { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

say "connecting to $HOST over the tunnel"
if ! timeout 20 "${SSH[@]}" true 2>/dev/null; then
  bad "cannot ssh to $HOST — is wg-pi5 up? (sudo wg show wg-pi5)"
  exit 1
fi
ok "connected"

say "applying dropbear + firewall changes"
timeout 60 "${SSH[@]}" LANNET="$LANNET" 'sh -s' <<'REMOTE' 2>&1
set -e

# ---- 1. dropbear: allow password login -------------------------------------
uci set dropbear.@dropbear[0].PasswordAuth="on"
uci set dropbear.@dropbear[0].RootPasswordAuth="on"
uci commit dropbear

# ---- 2. firewall: drop any previous Junior-* rules, then re-add -------------
# Delete by index descending so the list doesn't reshuffle under us.
idxs=$(uci show firewall | sed -n "s/^firewall\.@rule\[\([0-9]*\)\]\.name='Junior-.*/\1/p" | sort -rn)
for i in $idxs; do uci delete firewall.@rule[$i]; done

add_rule() {  # add_rule <suffix> <port>
  s=$(uci add firewall rule)
  uci set firewall.$s.name="Junior-$1"
  uci set firewall.$s.src="wan"
  uci set firewall.$s.src_ip="$LANNET"
  uci set firewall.$s.proto="tcp"
  uci set firewall.$s.dest_port="$2"
  uci set firewall.$s.target="ACCEPT"
}
add_rule ssh 22
add_rule luci 80
uci commit firewall

# ---- 3. restart ------------------------------------------------------------
/etc/init.d/firewall restart >/dev/null 2>&1
/etc/init.d/dropbear restart >/dev/null 2>&1
sleep 2

echo "--- dropbear ---"
uci show dropbear | grep -E "PasswordAuth"
echo "--- Junior rules ---"
uci show firewall | grep "Junior" || echo "(none — something went wrong)"
echo "--- listening ---"
netstat -ltn 2>/dev/null | grep -E ":22 |:80 " || true
echo "--- lan address ---"
ip -4 -br addr show eth0
REMOTE

rc=$?
echo
if [[ $rc -ne 0 ]]; then
  bad "remote block exited $rc — check the output above"
  exit 1
fi
ok "applied"

# ---- verify from impera's side (still via the tunnel) ----------------------
say "sanity check over the tunnel"
timeout 10 "${SSH[@]}" 'echo ssh-still-works' 2>&1

cat <<'EOF'

────────────────────────────────────────────────────────────
  ARMANDO — from any machine on your home network:

    LuCI  →  http://10.0.0.76
    SSH   →  ssh root@10.0.0.76      (password: password)

  Login for both is  root / password
────────────────────────────────────────────────────────────

If the browser times out, confirm the Pi still holds that DHCP lease:
    ip -4 -br addr show eth0     (run over the tunnel from impera)
A reboot of the home router can hand it a different address — worth a
static lease once things settle.
EOF
