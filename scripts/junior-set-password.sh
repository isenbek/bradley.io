#!/usr/bin/env bash
# =============================================================================
# Rotate the root password on Armando's Pi 5 to a strong generated one.
#
# Replaces the placeholder "password" set during setup. Generates the password
# locally from openssl's CSPRNG (NOT the hotbits TRNG — that pool is scarce and
# this doesn't warrant it), sets it over the tunnel, verifies the shadow hash
# changed, and prints the credential exactly once.
#
# Format is 4 words + digits + symbol: long enough to be strong, still typeable
# by hand at a console or into LuCI, which matters on a box whose recovery path
# is "plug a laptop into eth0".
#
# Run:  ./scripts/junior-set-password.sh
# Env:  WORDS (default 4), HOST, KEY
# =============================================================================
set -uo pipefail

HOST="${HOST:-10.10.0.2}"
KEY="${KEY:-$HOME/.ssh/id_ed25519_cbrouter}"
WORDS="${WORDS:-4}"

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=8
     -o IdentitiesOnly=yes -i "$KEY" "root@${HOST}")

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad() { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

# ---- generate ---------------------------------------------------------------
# Prefer a real wordlist; fall back to random base64 if the host has none.
gen() {
  local dict
  for d in /usr/share/dict/words /usr/share/dict/american-english; do
    [[ -r "$d" ]] && dict="$d" && break
  done
  if [[ -n "${dict:-}" ]]; then
    # 4-8 char lowercase words only, no apostrophes/proper nouns
    local words
    words=$(grep -x "[a-z]\{4,8\}" "$dict" \
      | shuf --random-source=/dev/urandom -n "$WORDS" \
      | paste -sd- -)
    printf '%s-%02d%s\n' "$words" "$(( RANDOM % 100 ))" \
      "$(printf '%s' '!@#$%&*' | fold -w1 | shuf --random-source=/dev/urandom -n1)"
  else
    openssl rand -base64 18 | tr -d '/+='
  fi
}

PW="$(gen)"
if [[ -z "$PW" ]]; then bad "password generation failed"; exit 1; fi

# ---- apply ------------------------------------------------------------------
say "connecting to $HOST"
if ! timeout 20 "${SSH[@]}" true 2>/dev/null; then
  bad "cannot ssh to $HOST — is wg-pi5 up? (sudo wg show wg-pi5)"
  exit 1
fi

before=$(timeout 15 "${SSH[@]}" 'grep "^root:" /etc/shadow | cut -d: -f2' 2>/dev/null)

say "setting root password"
# Passed on stdin, never as an argv (argv is visible in the remote process list).
if ! printf '%s\n%s\n' "$PW" "$PW" \
     | timeout 20 "${SSH[@]}" 'passwd root >/dev/null 2>&1'; then
  bad "passwd failed"
  exit 1
fi

after=$(timeout 15 "${SSH[@]}" 'grep "^root:" /etc/shadow | cut -d: -f2' 2>/dev/null)
if [[ -z "$after" || "$after" == "$before" ]]; then
  bad "shadow hash did not change — password NOT rotated"
  exit 1
fi
ok "root password rotated (hash ${after:0:12}…)"

cat <<EOF

────────────────────────────────────────────────────────────
  NEW ROOT PASSWORD for the Pi 5 (10.10.0.2 / 10.0.0.76)

      ${PW}

  Save it now — this is the only time it is printed.
  Works for ssh and for LuCI.
────────────────────────────────────────────────────────────
EOF
