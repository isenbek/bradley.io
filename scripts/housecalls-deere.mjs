#!/usr/bin/env node
// John Deere sandbox integration helper (month-one step 1 of docs/DEERE.md
// in the isenbek/housecalls container). Credentials and tokens live in
// data/housecalls/deere.json, inside the gitignored PII-firewall path,
// and never in the repo, the ledger, or the public site.
//
// usage:
//   node scripts/housecalls-deere.mjs init --id <applicationId> --secret <secret>
//   node scripts/housecalls-deere.mjs auth-url
//   node scripts/housecalls-deere.mjs exchange --code <authorizationCode>
//   node scripts/housecalls-deere.mjs refresh
//   node scripts/housecalls-deere.mjs orgs
//   node scripts/housecalls-deere.mjs --selftest

import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONF = path.join(ROOT, "data", "housecalls", "deere.json");

export const WELL_KNOWN =
  "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/.well-known/oauth-authorization-server";
export const AUTHORIZE_URL =
  "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize";
export const TOKEN_URL =
  "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token";
export const SANDBOX_API = "https://sandboxapi.deere.com/platform";
export const DEFAULT_SCOPES = ["org1", "ag1", "eq1", "offline_access"];
export const DEFAULT_REDIRECT =
  "https://bradley.io/api/housecalls/deere/callback";
const ACCEPT = "application/vnd.deere.axiom.v3+json";

export function buildAuthUrl({ clientId, redirectUri, scopes, state }) {
  if (!clientId) throw new Error("clientId required");
  if (!redirectUri) throw new Error("redirectUri required");
  const q = new URLSearchParams({
    response_type: "code",
    scope: (scopes && scopes.length ? scopes : DEFAULT_SCOPES).join(" "),
    client_id: clientId,
    state: state || "missing-state",
    redirect_uri: redirectUri,
  });
  return `${AUTHORIZE_URL}?${q}`;
}

// The org list tells us, per org, whether the grower has enabled our
// application: a "connections" rel means NOT yet enabled and the user
// must be sent there in a browser. Returns { enabled, needsConnection,
// connectionsUrl } from a GET /organizations response body.
export function readOrgAccess(body) {
  const orgs = body?.values ?? [];
  const enabled = [];
  const needsConnection = [];
  let connectionsUrl = null;
  for (const org of orgs) {
    const rels = (org.links ?? []).map((l) => l.rel);
    const conn = (org.links ?? []).find((l) => l.rel === "connections");
    if (conn) {
      needsConnection.push(org.name ?? org.id);
      connectionsUrl = connectionsUrl ?? conn.uri;
    } else if (rels.length) {
      enabled.push(org.name ?? org.id);
    }
  }
  return { enabled, needsConnection, connectionsUrl };
}

export function tokenExpiry(nowMs, expiresInSeconds) {
  // refresh 5 minutes early so a long export never dies mid-pull
  return nowMs + Math.max(0, expiresInSeconds - 300) * 1000;
}

function loadConf() {
  if (!existsSync(CONF)) {
    console.error(`no ${path.relative(ROOT, CONF)}; run init first`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONF, "utf8"));
}

function saveConf(conf) {
  writeFileSync(CONF, JSON.stringify(conf, null, 2) + "\n");
  chmodSync(CONF, 0o600);
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function tokenRequest(conf, params) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: conf.application_id,
      client_secret: conf.secret,
      ...params,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`token endpoint ${res.status}:`, JSON.stringify(body));
    process.exit(1);
  }
  conf.tokens = {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? conf.tokens?.refresh_token,
    expires_at: tokenExpiry(Date.now(), body.expires_in ?? 43200),
  };
  saveConf(conf);
  return conf;
}

async function ensureToken(conf) {
  if (!conf.tokens?.access_token) {
    console.error("no tokens yet; run auth-url then exchange");
    process.exit(1);
  }
  if (Date.now() >= conf.tokens.expires_at) {
    if (!conf.tokens.refresh_token) {
      console.error("token expired and no refresh token; re-run auth-url");
      process.exit(1);
    }
    console.error("access token expired; refreshing");
    conf = await tokenRequest(conf, {
      grant_type: "refresh_token",
      refresh_token: conf.tokens.refresh_token,
      scope: conf.scopes.join(" "),
    });
  }
  return conf;
}

function selftest() {
  let pass = 0;
  let fail = 0;
  const t = (name, fn) => {
    try {
      fn();
      pass++;
    } catch (e) {
      fail++;
      console.error(`FAIL ${name}: ${e.message}`);
    }
  };
  const eq = (a, b) => {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  };

  t("auth url carries all five params", () => {
    const u = new URL(
      buildAuthUrl({
        clientId: "abc",
        redirectUri: DEFAULT_REDIRECT,
        scopes: null,
        state: "s1",
      }),
    );
    eq(u.origin + u.pathname, AUTHORIZE_URL);
    eq(u.searchParams.get("response_type"), "code");
    eq(u.searchParams.get("client_id"), "abc");
    eq(u.searchParams.get("state"), "s1");
    eq(u.searchParams.get("redirect_uri"), DEFAULT_REDIRECT);
    eq(u.searchParams.get("scope"), DEFAULT_SCOPES.join(" "));
  });
  t("auth url refuses a missing client id", () => {
    let threw = false;
    try {
      buildAuthUrl({ redirectUri: DEFAULT_REDIRECT });
    } catch {
      threw = true;
    }
    if (!threw) throw new Error("did not throw");
  });
  t("custom scopes override the default set", () => {
    const u = new URL(
      buildAuthUrl({
        clientId: "abc",
        redirectUri: DEFAULT_REDIRECT,
        scopes: ["ag3", "files"],
        state: "s",
      }),
    );
    eq(u.searchParams.get("scope"), "ag3 files");
  });
  t("readOrgAccess splits enabled from needs-connection", () => {
    const r = readOrgAccess({
      values: [
        {
          name: "Enabled Farm",
          links: [{ rel: "fields", uri: "https://x/fields" }],
        },
        {
          name: "Locked Farm",
          links: [{ rel: "connections", uri: "https://conn/x" }],
        },
      ],
    });
    eq(r.enabled, ["Enabled Farm"]);
    eq(r.needsConnection, ["Locked Farm"]);
    eq(r.connectionsUrl, "https://conn/x");
  });
  t("readOrgAccess tolerates an empty body", () => {
    eq(readOrgAccess({}), {
      enabled: [],
      needsConnection: [],
      connectionsUrl: null,
    });
  });
  t("token expiry refreshes five minutes early", () => {
    eq(tokenExpiry(1000, 43200), 1000 + 42900 * 1000);
    eq(tokenExpiry(1000, 100), 1000);
  });

  console.log(`deere selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === "--selftest") return selftest();

  if (cmd === "init") {
    const id = arg("id");
    const secret = arg("secret");
    if (!id || !secret) {
      console.error("usage: init --id <applicationId> --secret <secret>");
      process.exit(1);
    }
    saveConf({
      application_id: id,
      secret,
      redirect_uri: arg("redirect") ?? DEFAULT_REDIRECT,
      scopes: DEFAULT_SCOPES,
    });
    console.log(`saved ${path.relative(ROOT, CONF)} (mode 600); next: auth-url`);
    return;
  }

  if (cmd === "auth-url") {
    const conf = loadConf();
    conf.state = randomBytes(8).toString("hex");
    saveConf(conf);
    console.log("open this in a browser, sign in as the Deere account,");
    console.log("allow access, then run exchange with the code shown:\n");
    console.log(
      buildAuthUrl({
        clientId: conf.application_id,
        redirectUri: conf.redirect_uri,
        scopes: conf.scopes,
        state: conf.state,
      }),
    );
    return;
  }

  if (cmd === "exchange") {
    const code = arg("code");
    if (!code) {
      console.error("usage: exchange --code <authorizationCode>");
      process.exit(1);
    }
    const conf = loadConf();
    await tokenRequest(conf, {
      grant_type: "authorization_code",
      code,
      redirect_uri: conf.redirect_uri,
    });
    console.log("tokens saved; next: orgs");
    return;
  }

  if (cmd === "refresh") {
    const conf = loadConf();
    if (!conf.tokens?.refresh_token) {
      console.error("no refresh token; re-run auth-url");
      process.exit(1);
    }
    await tokenRequest(conf, {
      grant_type: "refresh_token",
      refresh_token: conf.tokens.refresh_token,
      scope: conf.scopes.join(" "),
    });
    console.log("token refreshed");
    return;
  }

  if (cmd === "orgs") {
    let conf = loadConf();
    conf = await ensureToken(conf);
    const res = await fetch(`${SANDBOX_API}/organizations`, {
      headers: {
        accept: ACCEPT,
        authorization: `Bearer ${conf.tokens.access_token}`,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`GET /organizations ${res.status}:`, JSON.stringify(body));
      process.exit(1);
    }
    const { enabled, needsConnection, connectionsUrl } = readOrgAccess(body);
    console.log(`organizations visible: ${(body.values ?? []).length}`);
    if (enabled.length) console.log(`enabled for this app: ${enabled.join(", ")}`);
    if (needsConnection.length) {
      console.log(`need a connection: ${needsConnection.join(", ")}`);
      console.log(`send the signed-in user here to enable:\n${connectionsUrl}`);
    }
    return;
  }

  console.error(
    "usage: init --id --secret | auth-url | exchange --code | refresh | orgs | --selftest",
  );
  process.exit(1);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
