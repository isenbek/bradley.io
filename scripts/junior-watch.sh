#!/usr/bin/env bash
# =============================================================================
# TEMPORARY — watch for Armando's Pi 5 coming up on the wg-pi5 tunnel.
#
# Emits ONE LINE PER STATE CHANGE on stdout (so it works as a Monitor source)
# and is quiet otherwise, apart from a heartbeat so silence stays legible.
#
# Three independent signals, in the order they should land:
#   handshake  — WireGuard saw the peer. Authoritative: it works even if the
#                Pi's firewall drops ICMP, and it proves keys + endpoint.
#   ping       — ICMP to 10.10.0.2. Needs the OpenWrt firewall to allow input
#                on the wg zone, so its absence is NOT proof of a problem.
#   ssh        — port 22 open. This is the one that means "I can start work".
#
# Run:  ./scripts/junior-watch.sh
# Env:  INTERVAL (default 10s), HEARTBEAT (default 900s)
# =============================================================================
set -uo pipefail

IFACE="${IFACE:-wg-pi5}"
PEER_IP="${PEER_IP:-10.10.0.2}"
PEER_KEY="${PEER_KEY:-6K5RFNZEujcnxAYBUCD/TSym1YstFllNF+lzq1XxNXU=}"
INTERVAL="${INTERVAL:-10}"
HEARTBEAT="${HEARTBEAT:-900}"

ts() { date '+%H:%M:%S'; }

hs_state=0      # 0 = never seen, 1 = up
ping_state=0
ssh_state=0
started=$(date +%s)
last_beat=$started

# Latest-handshake epoch for our peer, or 0. `wg show` needs root.
handshake_epoch() {
  sudo -n wg show "$IFACE" latest-handshakes 2>/dev/null \
    | awk -v k="$PEER_KEY" '$1 == k { print $2; found=1 } END { if (!found) print 0 }'
}

peer_endpoint() {
  sudo -n wg show "$IFACE" endpoints 2>/dev/null \
    | awk -v k="$PEER_KEY" '$1 == k { print $2 }'
}

echo "[$(ts)] watching $IFACE for $PEER_IP (peer ${PEER_KEY:0:12}...) — handshake, ping, ssh"

while true; do
  now=$(date +%s)

  # --- handshake ---
  epoch="$(handshake_epoch)"
  [[ -z "$epoch" ]] && epoch=0
  if [[ "$epoch" -gt 0 ]]; then
    age=$(( now - epoch ))
    # WireGuard rekeys every ~2min with keepalive; >180s means it went away.
    if [[ $age -lt 180 && $hs_state -eq 0 ]]; then
      hs_state=1
      echo "[$(ts)] ✅ HANDSHAKE — the Pi is on the tunnel (endpoint $(peer_endpoint), ${age}s ago)"
    elif [[ $age -ge 180 && $hs_state -eq 1 ]]; then
      hs_state=0
      echo "[$(ts)] ⚠️  handshake went stale (${age}s) — the Pi dropped off"
    fi
  fi

  # --- icmp ---
  if rtt=$(ping -c1 -W2 "$PEER_IP" 2>/dev/null | grep -o 'time=[0-9.]* ms'); then
    if [[ $ping_state -eq 0 ]]; then
      ping_state=1
      echo "[$(ts)] ✅ PING — $PEER_IP responding (${rtt#time=})"
    fi
  elif [[ $ping_state -eq 1 ]]; then
    ping_state=0
    echo "[$(ts)] ⚠️  ping to $PEER_IP stopped responding"
  fi

  # --- ssh ---
  if timeout 3 bash -c "echo > /dev/tcp/$PEER_IP/22" 2>/dev/null; then
    if [[ $ssh_state -eq 0 ]]; then
      ssh_state=1
      echo "[$(ts)] ✅ SSH — port 22 open on $PEER_IP. Ready to work: ssh root@$PEER_IP"
    fi
  elif [[ $ssh_state -eq 1 ]]; then
    ssh_state=0
    echo "[$(ts)] ⚠️  ssh port 22 closed again on $PEER_IP"
  fi

  # --- heartbeat, so a quiet watch is distinguishable from a dead one ---
  if [[ $(( now - last_beat )) -ge $HEARTBEAT ]]; then
    last_beat=$now
    mins=$(( (now - started) / 60 ))
    echo "[$(ts)] …still waiting (${mins}m) — handshake=$hs_state ping=$ping_state ssh=$ssh_state"
  fi

  sleep "$INTERVAL"
done
