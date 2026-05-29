import Dfinery, {
  DFEvent,
  DFEventProperty,
  DFIdentity,
  DFUserProfile,
  DFGender,
  DFLogLevel,
} from "@igaworks/dfinery-web-sdk"

declare const process: {
  env?: {
    DFN_PLAYGROUND_ENV?: string;
    DFN_PLAYGROUND_SERVICE_ID?: string;
  };
};

type RouteName = "home" | "product" | "cart";
type LogKind = "action" | "success" | "error" | "trace";

type LogEntry = {
  at: string;
  kind: LogKind;
  title: string;
  detail?: string;
};

type NetworkRecord = {
  id: string;
  at: string;
  method: string;
  url: string;
  requestBody?: string;
  status?: number;
  statusText?: string;
  responseAt?: string;
  responseBody?: string;
  expanded: boolean;
};

type ExampleState = {
  mode: "spa";
  apiEnvironment: string;
  route: RouteName;
  serviceId: string;
  runId: string;
  identity: string;
  initialized: boolean;
  initCalls: number;
  counters: {
    actions: number;
    traces: number;
    network: number;
    errors: number;
  };
  logs: LogEntry[];
  network: NetworkRecord[];
};

type IdentityKey = typeof DFIdentity[keyof typeof DFIdentity];
type IdentityField = {
  id: string;
  label: string;
  key: IdentityKey;
  inputType: "text" | "email" | "tel";
  defaultValue: () => string;
};
type IdentityActionMode = "setIdentity" | "setIdentities";
type ProfileValueKind = "string" | "number" | "boolean" | "date";
type ProfileField = {
  id: string;
  label: string;
  key: typeof DFUserProfile[keyof typeof DFUserProfile];
  kind: ProfileValueKind;
  defaultValue: string;
};
type ProfileActionMode = "setUserProfile" | "setUserProfiles";

declare global {
  interface Window {
    __dfnNpmPlayground: ExampleState;
  }
}

const appElement = document.getElementById("app");
if (!appElement) {
  throw new Error("Missing #app");
}
const app = appElement;
const TRANSPORT_XHR = 1 as const;
let networkSequence = 0;
let activeIdentityAction: IdentityActionMode = "setIdentity";
let activeProfileAction: ProfileActionMode = "setUserProfile";
let customProfileSequence = 0;

const params = new URLSearchParams(window.location.search);
const state: ExampleState = {
  mode: "spa",
  apiEnvironment: process.env?.DFN_PLAYGROUND_ENV || "local",
  route: normalizeRoute(window.location.hash.replace(/^#\/?/, "") || "home"),
  serviceId: params.get("serviceId") || process.env?.DFN_PLAYGROUND_SERVICE_ID || "gou080",
  runId: params.get("runId") || "manual-" + new Date().toISOString().replace(/[:.]/g, "-"),
  identity: "",
  initialized: false,
  initCalls: 0,
  counters: { actions: 0, traces: 0, network: 0, errors: 0 },
  logs: [],
  network: [],
};

window.__dfnNpmPlayground = state;

function normalizeRoute(route: string): RouteName {
  if (route === "product" || route === "cart") return route;
  return "home";
}

function now(): string {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

function prettyJsonString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed.charAt(0))) return null;
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

function toText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return prettyJsonString(value) || value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host + parsed.pathname;
  } catch {
    return url;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getInput(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("Missing input #" + id);
  }
  return element;
}

function getSelect(id: string): HTMLSelectElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error("Missing select #" + id);
  }
  return element;
}

function addLog(kind: LogKind, title: string, detail?: unknown): void {
  if (kind === "action") state.counters.actions += 1;
  if (kind === "trace") state.counters.traces += 1;
  if (kind === "error") state.counters.errors += 1;
  state.logs.unshift({ at: now(), kind, title, detail: toText(detail) });
  state.logs = state.logs.slice(0, 120);
  renderDynamic();
}

function addNetwork(record: Omit<NetworkRecord, "id" | "expanded">): string {
  const id = "network-" + (++networkSequence);
  const networkRecord = { ...record, id, expanded: false };
  state.network.unshift(networkRecord);
  state.network = state.network.slice(0, 60);
  state.counters.network += 1;
  renderDynamic();
  return id;
}

function updateNetwork(id: string, patch: Partial<NetworkRecord>): void {
  const record = state.network.find((entry) => entry.id === id);
  if (!record) return;
  Object.assign(record, patch);
  renderDynamic();
}

function toggleNetwork(id: string): void {
  const record = state.network.find((entry) => entry.id === id);
  if (!record) return;
  record.expanded = !record.expanded;
  renderDynamic();
}

function networkStatus(record: NetworkRecord): string {
  if (record.status === undefined) return "pending";
  const label = record.statusText ? " " + record.statusText : "";
  return String(record.status) + label;
}

function networkStatusClass(record: NetworkRecord): string {
  if (record.status === undefined) return "pending";
  if (record.status === 0 && record.statusText === "queued") return "pending";
  if (record.status >= 200 && record.status < 300) return "ok";
  return "error";
}

function installNetworkMonitor(): void {
  const xhrPrototype = XMLHttpRequest.prototype as any;
  const originalOpen = xhrPrototype.open;
  const originalSend = xhrPrototype.send;
  const originalBeacon = navigator.sendBeacon?.bind(navigator);

  xhrPrototype.open = function open(method: string, url: string | URL, ...rest: unknown[]) {
    this.__dfnMethod = method;
    this.__dfnUrl = String(url);
    return originalOpen.call(this, method, url, ...rest);
  };

  xhrPrototype.send = function send(body?: Document | XMLHttpRequestBodyInit | null) {
    const url = this.__dfnUrl || "";
    const method = this.__dfnMethod || "GET";
    if (url.includes("dfinery.ai")) {
      const networkId = addNetwork({ at: now(), method, url, requestBody: typeof body === "string" ? body : undefined });
      this.addEventListener("loadend", () => {
        const responseBody = typeof this.responseText === "string" ? this.responseText : undefined;
        updateNetwork(networkId, {
          status: this.status || 0,
          statusText: this.statusText || "",
          responseAt: now(),
          responseBody,
        });
      }, { once: true });
    }
    return originalSend.call(this, body);
  };

  if (originalBeacon) {
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null): boolean => {
      const originalUrl = String(url);
      if (originalUrl.includes("dfinery.ai")) {
        const networkId = addNetwork({ at: now(), method: "BEACON", url: originalUrl, requestBody: typeof data === "string" ? data : undefined });
        updateNetwork(networkId, { status: 0, statusText: "queued", responseAt: now() });
      }
      return originalBeacon(url, data);
    };
  }
}

function phoneValue(): string {
  return "010" + state.runId.replace(/\D/g, "").slice(-8).padStart(8, "0");
}

const identityFields: IdentityField[] = [
  { id: "identityExternalId", label: "external_id", key: DFIdentity.EXTERNAL_ID, inputType: "text", defaultValue: () => "npm-spa-" + state.runId },
  { id: "identityEmail", label: "email", key: DFIdentity.EMAIL, inputType: "email", defaultValue: () => "npm-spa+" + state.runId + "@example.com" },
  { id: "identityPhoneNo", label: "phone_no", key: DFIdentity.PHONE_NO, inputType: "tel", defaultValue: phoneValue },
  { id: "identityKakaoUserId", label: "kakao_user_id", key: DFIdentity.KAKAO_USER_ID, inputType: "text", defaultValue: () => "kakao-" + state.runId },
  { id: "identityLineUserId", label: "line_user_id", key: DFIdentity.LINE_USER_ID, inputType: "text", defaultValue: () => "line-" + state.runId },
  { id: "identityUnifiedId", label: "unified_id", key: DFIdentity.UNIFIED_ID, inputType: "text", defaultValue: () => "" },
];

const profileFields: ProfileField[] = [
  { id: "profileName", label: "df_name", key: DFUserProfile.NAME, kind: "string", defaultValue: "NPM SPA" },
  { id: "profileGender", label: "df_gender", key: DFUserProfile.GENDER, kind: "string", defaultValue: DFGender.OTHER },
  { id: "profileMembership", label: "df_membership", key: DFUserProfile.MEMBERSHIP, kind: "string", defaultValue: "manual" },
  { id: "profileBirth", label: "df_birth", key: DFUserProfile.BIRTH, kind: "date", defaultValue: "1990-01-01" },
];

function readIdentityEntries(): Array<[IdentityKey, string]> {
  return identityFields
    .map((field) => [field.key, getInput(field.id).value.trim()] as [IdentityKey, string])
    .filter((entry) => entry[1] !== "");
}

function selectedIdentityField(): IdentityField {
  const selectedKey = (document.querySelector<HTMLInputElement>('input[name="identityKey"]:checked')?.value || DFIdentity.EXTERNAL_ID) as IdentityKey;
  return identityFields.find((field) => field.key === selectedKey) || identityFields[0];
}

function profileValue(field: ProfileField): unknown {
  if (field.id === "profileGender") return getSelect(field.id).value;
  return parseProfileValue(field.kind, getInput(field.id).value);
}

function parseProfileValue(kind: ProfileValueKind, rawValue: string): unknown {
  if (kind === "number") {
    const value = Number(rawValue);
    if (Number.isNaN(value)) {
      throw new Error("Invalid number profile value: " + rawValue);
    }
    return value;
  }
  if (kind === "boolean") return rawValue === "true";
  if (kind === "date") {
    if (!rawValue) return "";
    return rawValue;
  }
  return rawValue;
}

function selectedProfileValue(): [string, unknown] {
  const selected = document.querySelector<HTMLInputElement>('input[name="profileKey"]:checked')?.value || DFUserProfile.NAME;
  if (selected.startsWith("custom:")) {
    const rowId = selected.slice("custom:".length);
    return readCustomProfileRow(rowId);
  }
  const field = profileFields.find((entry) => entry.key === selected) || profileFields[0];
  return [field.key, profileValue(field)];
}

function profilePayload(): Record<string, unknown> {
  const profiles: Record<string, unknown> = {};
  for (const field of profileFields) {
    profiles[field.key] = profileValue(field);
  }
  for (const row of document.querySelectorAll<HTMLElement>("[data-custom-profile-row]")) {
    const rowId = row.getAttribute("data-custom-profile-row") || "";
    const key = getInput("customProfileKey-" + rowId).value.trim();
    const rawValue = getInput("customProfileValue-" + rowId).value;
    if (!key || !rawValue) continue;
    const kind = getSelect("customProfileType-" + rowId).value as ProfileValueKind;
    profiles[key] = parseProfileValue(kind, rawValue);
  }
  return profiles;
}

function readCustomProfileRow(rowId: string): [string, unknown] {
  const key = getInput("customProfileKey-" + rowId).value.trim();
  if (!key) throw new Error("Custom user profile key is required.");
  const kind = getSelect("customProfileType-" + rowId).value as ProfileValueKind;
  return [key, parseProfileValue(kind, getInput("customProfileValue-" + rowId).value)];
}

function renderIdentityRows(): string {
  return identityFields.map((field, index) => `
    <div class="field-row">
      <label class="radio-cell singular-picker"><input type="radio" name="identityKey" value="${escapeHtml(field.key)}"${index === 0 ? " checked" : ""}></label>
      <label>${escapeHtml(field.label)}<input id="${field.id}" type="${field.inputType}" value="${escapeHtml(field.defaultValue())}"></label>
    </div>
  `).join("");
}

function renderProfileRows(): string {
  return profileFields.map((field, index) => {
    const control = field.id === "profileGender"
      ? `<select id="${field.id}">
          <option value="${DFGender.MALE}">${DFGender.MALE}</option>
          <option value="${DFGender.FEMALE}">${DFGender.FEMALE}</option>
          <option value="${DFGender.NON_BINARY}">${DFGender.NON_BINARY}</option>
          <option value="${DFGender.OTHER}" selected>${DFGender.OTHER}</option>
        </select>`
      : `<input id="${field.id}" type="${field.kind === "date" ? "date" : "text"}" value="${escapeHtml(field.defaultValue)}">`;
    return `
      <div class="field-row">
        <label class="radio-cell singular-picker"><input type="radio" name="profileKey" value="${escapeHtml(field.key)}"${index === 0 ? " checked" : ""}></label>
        <label>${escapeHtml(field.label)}${control}</label>
      </div>
    `;
  }).join("");
}

function renderCustomProfileRow(rowId: number): string {
  return `
    <div class="field-row custom-profile-row" data-custom-profile-row="${rowId}">
      <label class="radio-cell singular-picker"><input type="radio" name="profileKey" value="custom:${rowId}"></label>
      <label>custom key<input id="customProfileKey-${rowId}" placeholder="custom_profile_key"></label>
      <label>type<select id="customProfileType-${rowId}">
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="date">date</option>
      </select></label>
      <label>value<input id="customProfileValue-${rowId}" placeholder="custom value"></label>
      <button type="button" class="danger" data-remove-custom-profile="${rowId}">Remove</button>
    </div>
  `;
}

function addCustomProfileRow(): void {
  const rows = document.getElementById("customProfileRows");
  if (!rows) return;
  customProfileSequence += 1;
  rows.insertAdjacentHTML("beforeend", renderCustomProfileRow(customProfileSequence));
  const radio = document.querySelector<HTMLInputElement>(`input[name="profileKey"][value="custom:${customProfileSequence}"]`);
  if (radio) radio.checked = true;
}

function showIdentityEditor(mode: IdentityActionMode): void {
  activeIdentityAction = mode;
  document.getElementById("identityEditor")?.classList.remove("hidden");
  document.getElementById("identityEditor")?.classList.toggle("plural-mode", mode === "setIdentities");
  document.getElementById("profileEditor")?.classList.add("hidden");
  const label = document.getElementById("identitySubmitLabel");
  if (label) label.textContent = mode;
}

function showProfileEditor(mode: ProfileActionMode): void {
  activeProfileAction = mode;
  document.getElementById("profileEditor")?.classList.remove("hidden");
  document.getElementById("profileEditor")?.classList.toggle("plural-mode", mode === "setUserProfiles");
  document.getElementById("identityEditor")?.classList.add("hidden");
  const label = document.getElementById("profileSubmitLabel");
  if (label) label.textContent = mode;
}

async function runAction(name: string, action: () => Promise<unknown> | unknown): Promise<void> {
  addLog("action", name);
  try {
    const result = await action();
    addLog("success", name + " complete", result);
  } catch (error) {
    addLog("error", name + " failed", error instanceof Error ? error.message : String(error));
  }
}

async function logCustomConcurrency(count: number): Promise<Record<string, unknown>> {
  const properties = {
    string: "value",
    int: 123,
  };
  const results = await Promise.all(Array.from({ length: count }, () => (
    Dfinery.logEvent("custom", { ...properties })
      .then(() => "fulfilled" as const)
      .catch(() => "rejected" as const)
  )));
  return {
    eventName: "custom",
    requested: count,
    completed: results.filter((result) => result === "fulfilled").length,
    rejected: results.filter((result) => result === "rejected").length,
  };
}

function logRouteEvent(route: RouteName): void {
  if (route === "product") {
    const item = {
      [DFEventProperty.ITEM_ID]: "상품번호",
      [DFEventProperty.ITEM_NAME]: "상품이름",
      [DFEventProperty.ITEM_PRICE]: 5000,
      [DFEventProperty.ITEM_DISCOUNT]: 500,
      [DFEventProperty.ITEM_QUANTITY]: 5,
      [DFEventProperty.ITEM_CATEGORY1]: "식품",
      [DFEventProperty.ITEM_CATEGORY2]: "과자",
    };

    const itemList = [item];

    const properties = {
      [DFEventProperty.ITEMS]: itemList,
    };
    Dfinery.logEvent(DFEvent.VIEW_PRODUCT_DETAILS, properties);
    return;
  }

  if (route === "cart") {
    const item = {
      [DFEventProperty.ITEM_ID]: "상품번호",
      [DFEventProperty.ITEM_NAME]: "상품이름",
      [DFEventProperty.ITEM_PRICE]: 5000,
      [DFEventProperty.ITEM_DISCOUNT]: 500,
      [DFEventProperty.ITEM_QUANTITY]: 5,
      [DFEventProperty.ITEM_CATEGORY1]: "식품",
      [DFEventProperty.ITEM_CATEGORY2]: "과자",
    };

    const itemList = [item];

    const properties = {
      [DFEventProperty.ITEMS]: itemList,
    };

    Dfinery.logEvent(DFEvent.VIEW_CART, properties);
    return;
  }

  const properties = {
    key: "value",
  };
  Dfinery.logEvent(DFEvent.VIEW_HOME, properties);
}

function goSpaRoute(route: RouteName): void {
  state.route = route;
  window.history.pushState({}, "", "#" + route);
  renderDynamic();
  void runAction("spa route " + route, () => logRouteEvent(route));
}

function renderShell(): void {
  app.innerHTML = `
    <div class="shell">
      <header>
        <h1>Dfinery npm SPA Example</h1>
        <div class="badges">
          <span class="badge">env <strong id="envValue"></strong></span>
          <span class="badge">mode <strong id="modeValue"></strong></span>
          <span class="badge">route <strong id="routeValue"></strong></span>
          <span class="badge">sdk <strong id="initValue"></strong></span>
        </div>
      </header>
      <main>
        <section>
          <div class="panel-head"><h2>Controls</h2><button id="clearLogs">Clear</button></div>
          <div class="panel-body">
            <div class="button-grid">
              <button id="setIdentity">setIdentity</button>
              <button id="setIdentities">setIdentities</button>
              <button id="setUserProfile">setUserProfile</button>
              <button id="setUserProfiles">setUserProfiles</button>
            </div>
            <div id="identityEditor" class="editor-panel hidden">
              <div class="editor-head">
                <h3>Identity</h3>
                <button id="submitIdentity" class="primary" type="button"><span id="identitySubmitLabel">setIdentity</span></button>
              </div>
              <div class="field-list">${renderIdentityRows()}</div>
            </div>
            <div id="profileEditor" class="editor-panel hidden">
              <div class="editor-head">
                <h3>User Profile</h3>
                <button id="submitProfile" class="primary" type="button"><span id="profileSubmitLabel">setUserProfile</span></button>
              </div>
              <div class="field-list">${renderProfileRows()}</div>
              <div class="custom-profile-head">
                <h3>Custom User Profile</h3>
                <button id="addCustomProfile" type="button">Add</button>
              </div>
              <div id="customProfileRows" class="field-list"></div>
            </div>
            <div class="button-grid">
              <button id="onInitialized">onInitialized</button>
              <button id="getCookieId">getCookieId</button>
              <button id="isSDKEnabled">isSDKEnabled</button>
              <button id="installTrace">debug.traceListener</button>
              <button id="runQueuedFunctions">runQueuedFunctions</button>
              <button id="remainQueuedFunctions">remainQueuedFunctions</button>
              <button id="disableSDK" class="warn">disableSDK</button>
              <button id="enableSDK" class="warn">enableSDK</button>
              <button id="resetIdentity" class="danger">resetIdentity</button>
            </div>
          </div>
        </section>
        <section>
          <div class="panel-head"><h2>API Surface</h2></div>
          <div class="panel-body">
            <div class="summary">
              <div><span>init</span><strong id="initCount">0</strong></div>
              <div><span>actions</span><strong id="actionCount">0</strong></div>
              <div><span>traces</span><strong id="traceCount">0</strong></div>
              <div><span>network</span><strong id="networkCount">0</strong></div>
              <div><span>errors</span><strong id="errorCount">0</strong></div>
            </div>
            <div class="route-surface">
              <p class="route-title" id="routeTitle"></p>
              <p class="route-meta" id="routeMeta"></p>
              <div class="button-grid compact">
                <button id="spaHome">SPA Home</button>
                <button id="spaProduct">SPA Product</button>
                <button id="spaCart">SPA Cart</button>
              </div>
            </div>
            <div class="button-grid compact" id="eventButtons"></div>
            <ul id="logList" class="log-list"></ul>
          </div>
        </section>
        <section>
          <div class="panel-head"><h2>Network</h2></div>
          <div class="panel-body">
            <ul id="networkList" class="network-list"></ul>
          </div>
        </section>
      </main>
    </div>
  `;
  customProfileSequence = 0;
  renderEventButtons();
  bindControls();
  renderDynamic();
}

function renderEventButtons(): void {
  const eventButtons = document.getElementById("eventButtons");
  if (!eventButtons) return;
  eventButtons.innerHTML = `
    <button id="eventLogin" data-event="LOGIN">${escapeHtml(DFEvent.LOGIN)}</button>
    <button id="eventLogout" data-event="LOGOUT">${escapeHtml(DFEvent.LOGOUT)}</button>
    <button id="eventSignUp" data-event="SIGN_UP">${escapeHtml(DFEvent.SIGN_UP)}</button>
    <button id="eventPurchase" data-event="PURCHASE">${escapeHtml(DFEvent.PURCHASE)}</button>
    <button id="eventRefund" data-event="REFUND">${escapeHtml(DFEvent.REFUND)}</button>
    <button id="eventViewHome" data-event="VIEW_HOME">${escapeHtml(DFEvent.VIEW_HOME)}</button>
    <button id="eventViewProductDetails" data-event="VIEW_PRODUCT_DETAILS">${escapeHtml(DFEvent.VIEW_PRODUCT_DETAILS)}</button>
    <button id="eventAddToCart" data-event="ADD_TO_CART">${escapeHtml(DFEvent.ADD_TO_CART)}</button>
    <button id="eventAddToWishlist" data-event="ADD_TO_WISHLIST">${escapeHtml(DFEvent.ADD_TO_WISHLIST)}</button>
    <button id="eventViewSearchResult" data-event="VIEW_SEARCH_RESULT">${escapeHtml(DFEvent.VIEW_SEARCH_RESULT)}</button>
    <button id="eventShareProduct" data-event="SHARE_PRODUCT">${escapeHtml(DFEvent.SHARE_PRODUCT)}</button>
    <button id="eventViewList" data-event="VIEW_LIST">${escapeHtml(DFEvent.VIEW_LIST)}</button>
    <button id="eventViewCart" data-event="VIEW_CART">${escapeHtml(DFEvent.VIEW_CART)}</button>
    <button id="eventRemoveCart" data-event="REMOVE_CART">${escapeHtml(DFEvent.REMOVE_CART)}</button>
    <button id="eventAddPaymentInfo" data-event="ADD_PAYMENT_INFO">${escapeHtml(DFEvent.ADD_PAYMENT_INFO)}</button>
    <button id="eventCustomInt" data-event="CUSTOM_INT">custom_int</button>
    <button id="eventCustomDouble" data-event="CUSTOM_DOUBLE">custom_double</button>
    <button id="eventCustomBool" data-event="CUSTOM_BOOL">custom_bool</button>
    <button id="eventCustomDate" data-event="CUSTOM_DATE">custom_date</button>
    <button id="eventCustomStr" data-event="CUSTOM_STR">custom_str</button>
    <button id="eventCustomIntArray" data-event="CUSTOM_INT_ARRAY">custom_int_array</button>
    <button id="eventCustomStrArray" data-event="CUSTOM_STR_ARRAY">custom_str_array</button>
    <button id="eventCustomDoubleArray" data-event="CUSTOM_DOUBLE_ARRAY">custom_double_array</button>
    <button id="eventCustomConcurrency10" data-event="CUSTOM_CONCURRENCY_10">custom x10</button>
    <button id="eventCustomConcurrency100" data-event="CUSTOM_CONCURRENCY_100">custom x100</button>
    <button id="eventCustomConcurrency1000" data-event="CUSTOM_CONCURRENCY_1000">custom x1000</button>
  `;
}

function renderDynamic(): void {
  const byId = (id: string) => document.getElementById(id);
  const setText = (id: string, value: string) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };
  setText("envValue", state.apiEnvironment);
  setText("modeValue", state.mode);
  setText("routeValue", state.route);
  setText("initValue", state.initialized ? "ready" : "booting");
  setText("initCount", String(state.initCalls));
  setText("actionCount", String(state.counters.actions));
  setText("traceCount", String(state.counters.traces));
  setText("networkCount", String(state.counters.network));
  setText("errorCount", String(state.counters.errors));
  setText("routeTitle", "SPA / " + state.route.toUpperCase());
  setText("routeMeta", "service=" + state.serviceId + " identity=" + (state.identity || "not set"));

  const logList = byId("logList");
  if (logList) {
    logList.innerHTML = state.logs.map((entry) => `
      <li class="log-row log-${entry.kind}">
        <span class="log-time">${escapeHtml(entry.at)}</span>
        <span class="log-kind">${escapeHtml(entry.kind)}</span>
        <span class="log-title">${escapeHtml(entry.title)}</span>
        ${entry.detail ? `<pre>${escapeHtml(entry.detail)}</pre>` : ""}
      </li>
    `).join("");
  }

  const networkList = byId("networkList");
  if (networkList) {
    networkList.innerHTML = state.network.map((entry) => `
      <li class="network-row network-${networkStatusClass(entry)}">
        <button type="button" class="network-toggle" data-network-id="${escapeHtml(entry.id)}" aria-expanded="${entry.expanded ? "true" : "false"}">
          <span>${escapeHtml(entry.at)}</span>
          <strong>${escapeHtml(entry.method)}</strong>
          <em>${escapeHtml(networkStatus(entry))}</em>
          <code>${escapeHtml(shortUrl(entry.url))}</code>
        </button>
        ${entry.expanded ? `
          <div class="network-detail">
            <div>
              <span>Request</span>
              <code>${escapeHtml(entry.method + " " + entry.url)}</code>
              ${entry.requestBody ? `<pre>${escapeHtml(toText(entry.requestBody))}</pre>` : `<pre>(empty)</pre>`}
            </div>
            <div>
              <span>Response</span>
              <code>${escapeHtml(entry.responseAt ? entry.responseAt + " " + networkStatus(entry) : "pending")}</code>
              ${entry.responseBody !== undefined ? `<pre>${escapeHtml(toText(entry.responseBody))}</pre>` : `<pre>(pending)</pre>`}
            </div>
          </div>
        ` : ""}
      </li>
    `).join("");
  }
}

function bindControls(): void {
  document.getElementById("clearLogs")?.addEventListener("click", () => {
    state.logs = [];
    state.network = [];
    state.counters = { actions: 0, traces: 0, network: 0, errors: 0 };
    renderDynamic();
  });
  document.getElementById("networkList")?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const toggle = target?.closest("[data-network-id]") as HTMLElement | null;
    if (toggle) toggleNetwork(toggle.getAttribute("data-network-id") || "");
  });
  document.getElementById("setIdentity")?.addEventListener("click", () => {
    showIdentityEditor("setIdentity");
  });
  document.getElementById("setIdentities")?.addEventListener("click", () => {
    showIdentityEditor("setIdentities");
  });
  document.getElementById("submitIdentity")?.addEventListener("click", () => {
    if (activeIdentityAction === "setIdentity") {
      void runAction("setIdentity", () => {
        const field = selectedIdentityField();
        const value = getInput(field.id).value.trim();
        state.identity = value;
        return Dfinery.setIdentity(field.key, value || null);
      });
      return;
    }
    void runAction("setIdentities", () => {
      const identities = Object.fromEntries(readIdentityEntries()) as Partial<Record<IdentityKey, string | null>>;
      state.identity = identities[DFIdentity.EXTERNAL_ID] || "";
      return Dfinery.setIdentities(identities);
    });
  });
  document.getElementById("setUserProfile")?.addEventListener("click", () => {
    showProfileEditor("setUserProfile");
  });
  document.getElementById("setUserProfiles")?.addEventListener("click", () => {
    showProfileEditor("setUserProfiles");
  });
  document.getElementById("submitProfile")?.addEventListener("click", () => {
    if (activeProfileAction === "setUserProfile") {
      void runAction("setUserProfile", () => {
        const [key, value] = selectedProfileValue();
        return Dfinery.setUserProfile(key, value);
      });
      return;
    }
    void runAction("setUserProfiles", () => Dfinery.setUserProfiles(profilePayload()));
  });
  document.getElementById("addCustomProfile")?.addEventListener("click", addCustomProfileRow);
  document.getElementById("customProfileRows")?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const removeButton = target?.closest("[data-remove-custom-profile]") as HTMLElement | null;
    if (!removeButton) return;
    const rowId = removeButton.getAttribute("data-remove-custom-profile");
    document.querySelector(`[data-custom-profile-row="${rowId}"]`)?.remove();
  });
  document.getElementById("onInitialized")?.addEventListener("click", () => {
    void runAction("onInitialized", () => Dfinery.onInitialized(() => addLog("success", "onInitialized callback")));
  });
  document.getElementById("getCookieId")?.addEventListener("click", () => {
    void runAction("getCookieId", () => Dfinery.getCookieId());
  });
  document.getElementById("isSDKEnabled")?.addEventListener("click", () => {
    void runAction("isSDKEnabled", () => Dfinery.isSDKEnabled());
  });
  document.getElementById("installTrace")?.addEventListener("click", () => {
    void runAction("debug.traceListener", () => Dfinery.debug.traceListener((message: string, logLevel?: number) => {
      addLog("trace", message, { logLevel, source: "debug.traceListener" });
    }));
  });
  document.getElementById("runQueuedFunctions")?.addEventListener("click", () => {
    void runAction("runQueuedFunctions", () => Dfinery.runQueuedFunctions());
  });
  document.getElementById("remainQueuedFunctions")?.addEventListener("click", () => {
    void runAction("remainQueuedFunctions", () => Dfinery.remainQueuedFunctions());
  });
  document.getElementById("disableSDK")?.addEventListener("click", () => {
    void runAction("disableSDK", () => Dfinery.disableSDK());
  });
  document.getElementById("enableSDK")?.addEventListener("click", () => {
    void runAction("enableSDK", () => Dfinery.enableSDK());
  });
  document.getElementById("resetIdentity")?.addEventListener("click", () => {
    void runAction("resetIdentity", () => {
      state.identity = "";
      return Dfinery.resetIdentity();
    });
  });
  document.getElementById("spaHome")?.addEventListener("click", () => goSpaRoute("home"));
  document.getElementById("spaProduct")?.addEventListener("click", () => goSpaRoute("product"));
  document.getElementById("spaCart")?.addEventListener("click", () => goSpaRoute("cart"));
  document.getElementById("eventLogin")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.LOGIN, async () => {
      await Dfinery.setIdentity(DFIdentity.EXTERNAL_ID, "TestUserId");
      return Dfinery.logEvent(DFEvent.LOGIN);
    });
  });
  document.getElementById("eventLogout")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.LOGOUT, () => {
      return Dfinery.logEvent(DFEvent.LOGOUT);
    });
  });
  document.getElementById("eventSignUp")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.SIGN_UP, () => {
      const properties = {
        [DFEventProperty.SIGN_CHANNEL]: "Kakao",
      };
      return Dfinery.logEvent(DFEvent.SIGN_UP, properties);
    });
  });
  document.getElementById("eventPurchase")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.PURCHASE, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 6,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
        [DFEventProperty.PAYMENT_METHOD]: "BankTransfer",
        [DFEventProperty.ORDER_ID]: "Order-123",
        [DFEventProperty.TOTAL_PURCHASE_AMOUNT]: 30000,
        [DFEventProperty.DELIVERY_CHARGE]: 2500,
        [DFEventProperty.DISCOUNT]: 3000,
      };

      return Dfinery.logEvent(DFEvent.PURCHASE, properties);
    });
  });
  document.getElementById("eventRefund")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.REFUND, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };
      return Dfinery.logEvent(DFEvent.REFUND, properties);
    });
  });
  document.getElementById("eventViewHome")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.VIEW_HOME, () => {
      const properties = {
        key: "value",
      };
      return Dfinery.logEvent(DFEvent.VIEW_HOME, properties);
    });
  });
  document.getElementById("eventViewProductDetails")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.VIEW_PRODUCT_DETAILS, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };
      return Dfinery.logEvent(DFEvent.VIEW_PRODUCT_DETAILS, properties);
    });
  });
  document.getElementById("eventAddToCart")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.ADD_TO_CART, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };
      return Dfinery.logEvent(DFEvent.ADD_TO_CART, properties);
    });
  });
  document.getElementById("eventAddToWishlist")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.ADD_TO_WISHLIST, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };
      return Dfinery.logEvent(DFEvent.ADD_TO_WISHLIST, properties);
    });
  });
  document.getElementById("eventViewSearchResult")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.VIEW_SEARCH_RESULT, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 16000,
        [DFEventProperty.ITEM_DISCOUNT]: 700,
        [DFEventProperty.ITEM_QUANTITY]: 10,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
        [DFEventProperty.KEYWORD]: "사또밥",
      };

      return Dfinery.logEvent(DFEvent.VIEW_SEARCH_RESULT, properties);
    });
  });
  document.getElementById("eventShareProduct")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.SHARE_PRODUCT, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
        [DFEventProperty.SHARING_CHANNEL]: "Facebook",
      };

      return Dfinery.logEvent(DFEvent.SHARE_PRODUCT, properties);
    });
  });
  document.getElementById("eventViewList")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.VIEW_LIST, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };

      return Dfinery.logEvent(DFEvent.VIEW_LIST, properties);
    });
  });
  document.getElementById("eventViewCart")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.VIEW_CART, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };

      return Dfinery.logEvent(DFEvent.VIEW_CART, properties);
    });
  });
  document.getElementById("eventRemoveCart")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.REMOVE_CART, () => {
      const item = {
        [DFEventProperty.ITEM_ID]: "상품번호",
        [DFEventProperty.ITEM_NAME]: "상품이름",
        [DFEventProperty.ITEM_PRICE]: 5000,
        [DFEventProperty.ITEM_DISCOUNT]: 500,
        [DFEventProperty.ITEM_QUANTITY]: 5,
        [DFEventProperty.ITEM_CATEGORY1]: "식품",
        [DFEventProperty.ITEM_CATEGORY2]: "과자",
      };

      const itemList = [item];

      const properties = {
        [DFEventProperty.ITEMS]: itemList,
      };
      return Dfinery.logEvent(DFEvent.REMOVE_CART, properties);
    });
  });
  document.getElementById("eventAddPaymentInfo")?.addEventListener("click", () => {
    void runAction("logEvent " + DFEvent.ADD_PAYMENT_INFO, () => {
      const properties = {
        key: "value",
      };
      return Dfinery.logEvent(DFEvent.ADD_PAYMENT_INFO, properties);
    });
  });
  document.getElementById("eventCustomInt")?.addEventListener("click", () => {
    void runAction("logEvent custom_int", () => {
      const properties = {
        int: 123,
      };
      return Dfinery.logEvent("custom_int", properties);
    });
  });
  document.getElementById("eventCustomDouble")?.addEventListener("click", () => {
    void runAction("logEvent custom_double", () => {
      const properties = {
        double: 123.45,
      };
      return Dfinery.logEvent("custom_double", properties);
    });
  });
  document.getElementById("eventCustomBool")?.addEventListener("click", () => {
    void runAction("logEvent custom_bool", () => {
      const properties = {
        bool: true,
      };
      return Dfinery.logEvent("custom_bool", properties);
    });
  });
  document.getElementById("eventCustomDate")?.addEventListener("click", () => {
    void runAction("logEvent custom_date", () => {
      const properties = {
        date: new Date("2026-05-26T00:00:00.000Z"),
      };
      return Dfinery.logEvent("custom_date", properties);
    });
  });
  document.getElementById("eventCustomStr")?.addEventListener("click", () => {
    void runAction("logEvent custom_str", () => {
      const properties = {
        string: "value",
      };
      return Dfinery.logEvent("custom_str", properties);
    });
  });
  document.getElementById("eventCustomIntArray")?.addEventListener("click", () => {
    void runAction("logEvent custom_int_array", () => {
      const properties = {
        int_array: [1, 2, 3],
      };
      return Dfinery.logEvent("custom_int_array", properties);
    });
  });
  document.getElementById("eventCustomStrArray")?.addEventListener("click", () => {
    void runAction("logEvent custom_str_array", () => {
      const properties = {
        str_array: ["value1", "value2", "value3"],
      };
      return Dfinery.logEvent("custom_str_array", properties);
    });
  });
  document.getElementById("eventCustomDoubleArray")?.addEventListener("click", () => {
    void runAction("logEvent custom_double_array", () => {
      const properties = {
        double_array: [1.1, 2.2, 3.3],
      };
      return Dfinery.logEvent("custom_double_array", properties);
    });
  });
  document.getElementById("eventCustomConcurrency10")?.addEventListener("click", () => {
    void runAction("logEvent custom x10", () => logCustomConcurrency(10));
  });
  document.getElementById("eventCustomConcurrency100")?.addEventListener("click", () => {
    void runAction("logEvent custom x100", () => logCustomConcurrency(100));
  });
  document.getElementById("eventCustomConcurrency1000")?.addEventListener("click", () => {
    void runAction("logEvent custom x1000", () => logCustomConcurrency(1000));
  });
}

async function initSdkOnce(): Promise<void> {
  state.initCalls += 1;
  addLog("action", "init " + state.serviceId);
  void Dfinery.onInitialized(() => addLog("success", "initial onInitialized callback"));
  await Dfinery.init(state.serviceId, {
    logEnable: true,
    logLevel: DFLogLevel.INFO,
    shareSubdomainCookie: true,
    transport: TRANSPORT_XHR,
    traceListener(message: string, logLevel?: number) {
      addLog("trace", message, { logLevel });
    },
  });
  state.initialized = Dfinery.isInitialized;
  addLog(state.initialized ? "success" : "error", "init completed", { isInitialized: Dfinery.isInitialized });
  renderDynamic();
}

window.addEventListener("popstate", () => {
  state.route = normalizeRoute(window.location.hash.replace(/^#\/?/, ""));
  renderDynamic();
});

installNetworkMonitor();
renderShell();
void initSdkOnce().catch((error) => {
  state.initialized = false;
  addLog("error", "init failed", error instanceof Error ? error.message : String(error));
  renderDynamic();
});
