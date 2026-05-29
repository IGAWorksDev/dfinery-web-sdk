(function () {
  "use strict";

  var body = document.body;
  var params = new URLSearchParams(window.location.search);
  var route = body.getAttribute("data-route") || "home";
  var defaultSdk = body.getAttribute("data-default-sdk") || "latest";
  var defaultServiceId = window.__dfnCdnMpaDefaultServiceId || "gou080";
  var serviceId = params.get("serviceId") || defaultServiceId;
  var runId = params.get("runId") || "manual-" + new Date().toISOString().replace(/[:.]/g, "-");
  var sdkMode = params.get("sdk") || defaultSdk;
  var sdkUrl = window.__dfnCdnMpaSdkUrl || "";
  var apiEnvironment = window.__dfnCdnMpaEnvironment || "source";
  var TRANSPORT_XHR = 1;
  var networkSequence = 0;
  var activeIdentityAction = "setIdentity";
  var activeProfileAction = "setUserProfile";
  var customProfileSequence = 0;
  var state = {
    mode: "cdn-mpa",
    apiEnvironment: apiEnvironment,
    route: route,
    serviceId: serviceId,
    runId: runId,
    sdkMode: sdkMode,
    sdkUrl: sdkUrl,
    identity: "",
    initialized: false,
    sdkLoaded: false,
    initCalls: 0,
    counters: { actions: 0, traces: 0, network: 0, errors: 0 },
    logs: [],
    network: []
  };

  window.__dfnCdnMpaPlayground = state;

  function now() {
    return new Date().toLocaleTimeString("ko-KR", { hour12: false });
  }

  function prettyJsonString(value) {
    var trimmed = value.trim();
    if (!trimmed || ["{", "["].indexOf(trimmed.charAt(0)) === -1) return null;
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch (error) {
      return null;
    }
  }

  function toText(value) {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return prettyJsonString(value) || value;
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  function shortUrl(url) {
    try {
      var parsed = new URL(url);
      return parsed.host + parsed.pathname;
    } catch (error) {
      return url;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getInput(id) {
    var element = byId(id);
    if (!element) {
      throw new Error("Missing input #" + id);
    }
    return element;
  }

  function getSelect(id) {
    var element = byId(id);
    if (!element) {
      throw new Error("Missing select #" + id);
    }
    return element;
  }

  function addLog(kind, title, detail) {
    if (kind === "action") state.counters.actions += 1;
    if (kind === "trace") state.counters.traces += 1;
    if (kind === "error") state.counters.errors += 1;
    state.logs.unshift({ at: now(), kind: kind, title: title, detail: toText(detail) });
    state.logs = state.logs.slice(0, 120);
    renderDynamic();
  }

  function addNetwork(record) {
    var id = "network-" + (++networkSequence);
    var networkRecord = Object.assign({}, record, { id: id, expanded: false });
    state.network.unshift(networkRecord);
    state.network = state.network.slice(0, 60);
    state.counters.network += 1;
    renderDynamic();
    return id;
  }

  function updateNetwork(id, patch) {
    var record = state.network.find(function (entry) {
      return entry.id === id;
    });
    if (!record) return;
    Object.assign(record, patch);
    renderDynamic();
  }

  function toggleNetwork(id) {
    var record = state.network.find(function (entry) {
      return entry.id === id;
    });
    if (!record) return;
    record.expanded = !record.expanded;
    renderDynamic();
  }

  function networkStatus(record) {
    if (record.status === undefined) return "pending";
    return String(record.status) + (record.statusText ? " " + record.statusText : "");
  }

  function networkStatusClass(record) {
    if (record.status === undefined) return "pending";
    if (record.status === 0 && record.statusText === "queued") return "pending";
    if (record.status >= 200 && record.status < 300) return "ok";
    return "error";
  }

  function installNetworkMonitor() {
    var xhrPrototype = XMLHttpRequest.prototype;
    var originalOpen = xhrPrototype.open;
    var originalSend = xhrPrototype.send;
    var originalBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;

    xhrPrototype.open = function open(method, url) {
      this.__dfnMethod = method;
      this.__dfnUrl = String(url);
      return originalOpen.apply(this, arguments);
    };

    xhrPrototype.send = function send(bodyValue) {
      var url = this.__dfnUrl || "";
      var method = this.__dfnMethod || "GET";
      if (url.indexOf("dfinery.ai") !== -1) {
        var networkId = addNetwork({ at: now(), method: method, url: url, requestBody: typeof bodyValue === "string" ? bodyValue : undefined });
        this.addEventListener("loadend", function () {
          var responseBody = typeof this.responseText === "string" ? this.responseText : undefined;
          updateNetwork(networkId, {
            status: this.status || 0,
            statusText: this.statusText || "",
            responseAt: now(),
            responseBody: responseBody
          });
        }, { once: true });
      }
      return originalSend.apply(this, arguments);
    };

    if (originalBeacon) {
      navigator.sendBeacon = function sendBeacon(url, data) {
        var originalUrl = String(url);
        if (originalUrl.indexOf("dfinery.ai") !== -1) {
          var networkId = addNetwork({ at: now(), method: "BEACON", url: originalUrl, requestBody: typeof data === "string" ? data : undefined });
          updateNetwork(networkId, { status: 0, statusText: "queued", responseAt: now() });
        }
        return originalBeacon(url, data);
      };
    }
  }

  function ensureSdk() {
    if (!window.Dfinery) {
      throw new Error("window.Dfinery is not available. Check the inline snippet and SDK URL.");
    }
    return window.Dfinery;
  }

  function phoneValue() {
    return "010" + state.runId.replace(/\D/g, "").slice(-8).padStart(8, "0");
  }

  function identityFields() {
    return [
      { id: "identityExternalId", label: "external_id", key: window.DFIdentity.EXTERNAL_ID, inputType: "text", defaultValue: "cdn-mpa-" + state.runId },
      { id: "identityEmail", label: "email", key: window.DFIdentity.EMAIL, inputType: "email", defaultValue: "cdn-mpa+" + state.runId + "@example.com" },
      { id: "identityPhoneNo", label: "phone_no", key: window.DFIdentity.PHONE_NO, inputType: "tel", defaultValue: phoneValue() },
      { id: "identityKakaoUserId", label: "kakao_user_id", key: window.DFIdentity.KAKAO_USER_ID, inputType: "text", defaultValue: "kakao-" + state.runId },
      { id: "identityLineUserId", label: "line_user_id", key: window.DFIdentity.LINE_USER_ID, inputType: "text", defaultValue: "line-" + state.runId },
      { id: "identityUnifiedId", label: "unified_id", key: window.DFIdentity.UNIFIED_ID, inputType: "text", defaultValue: "" }
    ];
  }

  function profileFields() {
    return [
      { id: "profileName", label: "df_name", key: window.DFUserProfile.NAME, kind: "string", defaultValue: "CDN MPA" },
      { id: "profileGender", label: "df_gender", key: window.DFUserProfile.GENDER, kind: "string", defaultValue: window.DFGender.OTHER },
      { id: "profileMembership", label: "df_membership", key: window.DFUserProfile.MEMBERSHIP, kind: "string", defaultValue: "manual" },
      { id: "profileBirth", label: "df_birth", key: window.DFUserProfile.BIRTH, kind: "date", defaultValue: "1990-01-01" }
    ];
  }

  function readIdentityEntries() {
    return identityFields().reduce(function (identity, field) {
      var value = getInput(field.id).value.trim();
      if (value) identity[field.key] = value;
      return identity;
    }, {});
  }

  function selectedIdentityField() {
    var selected = document.querySelector('input[name="identityKey"]:checked');
    var selectedKey = selected ? selected.value : window.DFIdentity.EXTERNAL_ID;
    return identityFields().find(function (field) {
      return field.key === selectedKey;
    }) || identityFields()[0];
  }

  function parseProfileValue(kind, rawValue) {
    if (kind === "number") {
      var value = Number(rawValue);
      if (Number.isNaN(value)) {
        throw new Error("Invalid number profile value: " + rawValue);
      }
      return value;
    }
    if (kind === "boolean") return rawValue === "true";
    if (kind === "date") return rawValue || "";
    return rawValue;
  }

  function profileValue(field) {
    if (field.id === "profileGender") return getSelect(field.id).value;
    return parseProfileValue(field.kind, getInput(field.id).value);
  }

  function readCustomProfileRow(rowId) {
    var key = getInput("customProfileKey-" + rowId).value.trim();
    if (!key) throw new Error("Custom user profile key is required.");
    return [key, parseProfileValue(getSelect("customProfileType-" + rowId).value, getInput("customProfileValue-" + rowId).value)];
  }

  function selectedProfileValue() {
    var selected = document.querySelector('input[name="profileKey"]:checked');
    var selectedValue = selected ? selected.value : window.DFUserProfile.NAME;
    if (selectedValue.indexOf("custom:") === 0) {
      return readCustomProfileRow(selectedValue.slice("custom:".length));
    }
    var field = profileFields().find(function (entry) {
      return entry.key === selectedValue;
    }) || profileFields()[0];
    return [field.key, profileValue(field)];
  }

  function profilePayload() {
    var profile = {};
    profileFields().forEach(function (field) {
      profile[field.key] = profileValue(field);
    });
    document.querySelectorAll("[data-custom-profile-row]").forEach(function (row) {
      var rowId = row.getAttribute("data-custom-profile-row") || "";
      var key = getInput("customProfileKey-" + rowId).value.trim();
      var rawValue = getInput("customProfileValue-" + rowId).value;
      if (!key || !rawValue) return;
      profile[key] = parseProfileValue(getSelect("customProfileType-" + rowId).value, rawValue);
    });
    return profile;
  }

  function renderIdentityRows() {
    return identityFields().map(function (field, index) {
      return [
        '<div class="field-row">',
        '<label class="radio-cell singular-picker"><input type="radio" name="identityKey" value="', escapeHtml(field.key), '"', index === 0 ? " checked" : "", "></label>",
        "<label>", escapeHtml(field.label), '<input id="', field.id, '" type="', field.inputType, '" value="', escapeHtml(field.defaultValue), '"></label>',
        "</div>"
      ].join("");
    }).join("");
  }

  function renderProfileRows() {
    return profileFields().map(function (field, index) {
      var control = field.id === "profileGender" ? [
        '<select id="', field.id, '">',
        '<option value="', window.DFGender.MALE, '">', window.DFGender.MALE, "</option>",
        '<option value="', window.DFGender.FEMALE, '">', window.DFGender.FEMALE, "</option>",
        '<option value="', window.DFGender.NON_BINARY, '">', window.DFGender.NON_BINARY, "</option>",
        '<option value="', window.DFGender.OTHER, '" selected>', window.DFGender.OTHER, "</option>",
        "</select>"
      ].join("") : [
        '<input id="', field.id, '" type="', field.kind === "date" ? "date" : "text", '" value="', escapeHtml(field.defaultValue), '">'
      ].join("");
      return [
        '<div class="field-row">',
        '<label class="radio-cell singular-picker"><input type="radio" name="profileKey" value="', escapeHtml(field.key), '"', index === 0 ? " checked" : "", "></label>",
        "<label>", escapeHtml(field.label), control, "</label>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderCustomProfileRow(rowId) {
    return [
      '<div class="field-row custom-profile-row" data-custom-profile-row="', rowId, '">',
      '<label class="radio-cell singular-picker"><input type="radio" name="profileKey" value="custom:', rowId, '"></label>',
      '<label>custom key<input id="customProfileKey-', rowId, '" placeholder="custom_profile_key"></label>',
      '<label>type<select id="customProfileType-', rowId, '">',
      '<option value="string">string</option>',
      '<option value="number">number</option>',
      '<option value="boolean">boolean</option>',
      '<option value="date">date</option>',
      "</select></label>",
      '<label>value<input id="customProfileValue-', rowId, '" placeholder="custom value"></label>',
      '<button type="button" class="danger" data-remove-custom-profile="', rowId, '">Remove</button>',
      "</div>"
    ].join("");
  }

  function addCustomProfileRow() {
    var rows = byId("customProfileRows");
    if (!rows) return;
    customProfileSequence += 1;
    rows.insertAdjacentHTML("beforeend", renderCustomProfileRow(customProfileSequence));
    var radio = document.querySelector('input[name="profileKey"][value="custom:' + customProfileSequence + '"]');
    if (radio) radio.checked = true;
  }

  function showIdentityEditor(mode) {
    activeIdentityAction = mode;
    byId("identityEditor").classList.remove("hidden");
    byId("identityEditor").classList.toggle("plural-mode", mode === "setIdentities");
    byId("profileEditor").classList.add("hidden");
    byId("identitySubmitLabel").textContent = mode;
  }

  function showProfileEditor(mode) {
    activeProfileAction = mode;
    byId("profileEditor").classList.remove("hidden");
    byId("profileEditor").classList.toggle("plural-mode", mode === "setUserProfiles");
    byId("identityEditor").classList.add("hidden");
    byId("profileSubmitLabel").textContent = mode;
  }

  function runAction(name, action) {
    addLog("action", name);
    try {
      var result = action();
      if (result && typeof result.then === "function") {
        result.then(function (value) {
          addLog("success", name + " complete", value);
        }).catch(function (error) {
          addLog("error", name + " failed", error && error.message ? error.message : String(error));
        });
      } else {
        addLog("success", name + " complete", result);
      }
    } catch (error) {
      addLog("error", name + " failed", error && error.message ? error.message : String(error));
    }
  }

  function logCustomConcurrency(count) {
    var Dfinery = ensureSdk();
    var properties = {};
    properties["string"] = "value";
    properties["int"] = 123;
    return Promise.all(Array.from({ length: count }, function () {
      return Dfinery.logEvent("custom", Object.assign({}, properties))
        .then(function () { return "fulfilled"; })
        .catch(function () { return "rejected"; });
    })).then(function (results) {
      return {
        eventName: "custom",
        requested: count,
        completed: results.filter(function (result) { return result === "fulfilled"; }).length,
        rejected: results.filter(function (result) { return result === "rejected"; }).length
      };
    });
  }

  function queryString() {
    var query = "?serviceId=" + encodeURIComponent(state.serviceId) + "&runId=" + encodeURIComponent(state.runId);
    if (params.get("sdkUrl")) {
      query += "&sdkUrl=" + encodeURIComponent(params.get("sdkUrl"));
    } else {
      query += "&sdk=" + encodeURIComponent(state.sdkMode);
    }
    return query;
  }

  function renderShell() {
    document.getElementById("app").innerHTML = [
      '<div class="shell">',
      "  <header>",
      "    <h1>Dfinery CDN Snippet MPA</h1>",
      '    <div class="badges">',
      '      <span class="badge">env <strong id="envValue"></strong></span>',
      '      <span class="badge">mode <strong id="modeValue"></strong></span>',
      '      <span class="badge">route <strong id="routeValue"></strong></span>',
      '      <span class="badge">sdk <strong id="initValue"></strong></span>',
      "    </div>",
      "  </header>",
      "  <main>",
      "    <section>",
      '      <div class="panel-head"><h2>Controls</h2><button id="clearLogs">Clear</button></div>',
      '      <div class="panel-body">',
      '        <div class="button-grid">',
      '          <button id="setIdentity">setIdentity</button>',
      '          <button id="setIdentities">setIdentities</button>',
      '          <button id="setUserProfile">setUserProfile</button>',
      '          <button id="setUserProfiles">setUserProfiles</button>',
      "        </div>",
      '        <div id="identityEditor" class="editor-panel hidden">',
      '          <div class="editor-head">',
      "            <h3>Identity</h3>",
      '            <button id="submitIdentity" class="primary" type="button"><span id="identitySubmitLabel">setIdentity</span></button>',
      "          </div>",
      '          <div class="field-list">', renderIdentityRows(), "</div>",
      "        </div>",
      '        <div id="profileEditor" class="editor-panel hidden">',
      '          <div class="editor-head">',
      "            <h3>User Profile</h3>",
      '            <button id="submitProfile" class="primary" type="button"><span id="profileSubmitLabel">setUserProfile</span></button>',
      "          </div>",
      '          <div class="field-list">', renderProfileRows(), "</div>",
      '          <div class="custom-profile-head">',
      "            <h3>Custom User Profile</h3>",
      '            <button id="addCustomProfile" type="button">Add</button>',
      "          </div>",
      '          <div id="customProfileRows" class="field-list"></div>',
      "        </div>",
      '        <div class="button-grid">',
      '          <button id="onInitialized">onInitialized</button>',
      '          <button id="getCookieId">getCookieId</button>',
      '          <button id="isSDKEnabled">isSDKEnabled</button>',
      '          <button id="installTrace">debug.traceListener</button>',
      '          <button id="runQueuedFunctions">runQueuedFunctions</button>',
      '          <button id="remainQueuedFunctions">remainQueuedFunctions</button>',
      '          <button id="disableSDK" class="warn">disableSDK</button>',
      '          <button id="enableSDK" class="warn">enableSDK</button>',
      '          <button id="resetIdentity" class="danger">resetIdentity</button>',
      "        </div>",
      "      </div>",
      "    </section>",
      "    <section>",
      '      <div class="panel-head"><h2>API Surface</h2></div>',
      '      <div class="panel-body">',
      '        <div class="summary">',
      '          <div><span>init</span><strong id="initCount">0</strong></div>',
      '          <div><span>actions</span><strong id="actionCount">0</strong></div>',
      '          <div><span>traces</span><strong id="traceCount">0</strong></div>',
      '          <div><span>network</span><strong id="networkCount">0</strong></div>',
      '          <div><span>errors</span><strong id="errorCount">0</strong></div>',
      "        </div>",
      '        <div class="route-surface">',
      '          <p class="route-title" id="routeTitle"></p>',
      '          <p class="route-meta" id="routeMeta"></p>',
      '          <div class="nav-list">',
      '            <a class="nav-link" id="mpaHome" href="./home.html">MPA Home</a>',
      '            <a class="nav-link" id="mpaProduct" href="./product.html">MPA Product</a>',
      '            <a class="nav-link" id="mpaCart" href="./cart.html">MPA Cart</a>',
      "          </div>",
      "        </div>",
      '        <div class="button-grid compact" id="eventButtons"></div>',
      '        <ul id="logList" class="log-list"></ul>',
      "      </div>",
      "    </section>",
      "    <section>",
      '      <div class="panel-head"><h2>Network</h2></div>',
      '      <div class="panel-body"><ul id="networkList" class="network-list"></ul></div>',
      "    </section>",
      "  </main>",
      "</div>"
    ].join("");
    customProfileSequence = 0;
    renderEventButtons();
    bindControls();
    renderDynamic();
  }

  function renderEventButtons() {
    var eventButtons = byId("eventButtons");
    if (!eventButtons || !window.DFEvent) return;
    eventButtons.innerHTML = [
      '<button id="eventLogin" data-event="LOGIN">' + escapeHtml(window.DFEvent.LOGIN) + "</button>",
      '<button id="eventLogout" data-event="LOGOUT">' + escapeHtml(window.DFEvent.LOGOUT) + "</button>",
      '<button id="eventSignUp" data-event="SIGN_UP">' + escapeHtml(window.DFEvent.SIGN_UP) + "</button>",
      '<button id="eventPurchase" data-event="PURCHASE">' + escapeHtml(window.DFEvent.PURCHASE) + "</button>",
      '<button id="eventRefund" data-event="REFUND">' + escapeHtml(window.DFEvent.REFUND) + "</button>",
      '<button id="eventViewHome" data-event="VIEW_HOME">' + escapeHtml(window.DFEvent.VIEW_HOME) + "</button>",
      '<button id="eventViewProductDetails" data-event="VIEW_PRODUCT_DETAILS">' + escapeHtml(window.DFEvent.VIEW_PRODUCT_DETAILS) + "</button>",
      '<button id="eventAddToCart" data-event="ADD_TO_CART">' + escapeHtml(window.DFEvent.ADD_TO_CART) + "</button>",
      '<button id="eventAddToWishlist" data-event="ADD_TO_WISHLIST">' + escapeHtml(window.DFEvent.ADD_TO_WISHLIST) + "</button>",
      '<button id="eventViewSearchResult" data-event="VIEW_SEARCH_RESULT">' + escapeHtml(window.DFEvent.VIEW_SEARCH_RESULT) + "</button>",
      '<button id="eventShareProduct" data-event="SHARE_PRODUCT">' + escapeHtml(window.DFEvent.SHARE_PRODUCT) + "</button>",
      '<button id="eventViewList" data-event="VIEW_LIST">' + escapeHtml(window.DFEvent.VIEW_LIST) + "</button>",
      '<button id="eventViewCart" data-event="VIEW_CART">' + escapeHtml(window.DFEvent.VIEW_CART) + "</button>",
      '<button id="eventRemoveCart" data-event="REMOVE_CART">' + escapeHtml(window.DFEvent.REMOVE_CART) + "</button>",
      '<button id="eventAddPaymentInfo" data-event="ADD_PAYMENT_INFO">' + escapeHtml(window.DFEvent.ADD_PAYMENT_INFO) + "</button>",
      '<button id="eventCustomInt" data-event="CUSTOM_INT">custom_int</button>',
      '<button id="eventCustomDouble" data-event="CUSTOM_DOUBLE">custom_double</button>',
      '<button id="eventCustomBool" data-event="CUSTOM_BOOL">custom_bool</button>',
      '<button id="eventCustomDate" data-event="CUSTOM_DATE">custom_date</button>',
      '<button id="eventCustomStr" data-event="CUSTOM_STR">custom_str</button>',
      '<button id="eventCustomIntArray" data-event="CUSTOM_INT_ARRAY">custom_int_array</button>',
      '<button id="eventCustomStrArray" data-event="CUSTOM_STR_ARRAY">custom_str_array</button>',
      '<button id="eventCustomDoubleArray" data-event="CUSTOM_DOUBLE_ARRAY">custom_double_array</button>',
      '<button id="eventCustomConcurrency10" data-event="CUSTOM_CONCURRENCY_10">custom x10</button>',
      '<button id="eventCustomConcurrency100" data-event="CUSTOM_CONCURRENCY_100">custom x100</button>',
      '<button id="eventCustomConcurrency1000" data-event="CUSTOM_CONCURRENCY_1000">custom x1000</button>'
    ].join("");
  }

  function renderDynamic() {
    function setText(id, value) {
      var element = byId(id);
      if (element) element.textContent = value;
    }
    setText("envValue", state.apiEnvironment);
    setText("modeValue", state.mode);
    setText("routeValue", state.route);
    setText("initValue", state.initialized ? "ready" : "queued");
    setText("initCount", String(state.initCalls));
    setText("actionCount", String(state.counters.actions));
    setText("traceCount", String(state.counters.traces));
    setText("networkCount", String(state.counters.network));
    setText("errorCount", String(state.counters.errors));
    setText("routeTitle", "MPA / " + state.route.toUpperCase());
    setText("routeMeta", "service=" + state.serviceId + " identity=" + (state.identity || "not set"));

    var query = queryString();
    var homeLink = byId("mpaHome");
    var productLink = byId("mpaProduct");
    var cartLink = byId("mpaCart");
    if (homeLink) homeLink.href = "./home.html" + query;
    if (productLink) productLink.href = "./product.html" + query;
    if (cartLink) cartLink.href = "./cart.html" + query;

    var logList = byId("logList");
    if (logList) {
      logList.innerHTML = state.logs.map(function (entry) {
        return [
          '<li class="log-row log-', escapeHtml(entry.kind), '">',
          '<span class="log-time">', escapeHtml(entry.at), "</span>",
          '<span class="log-kind">', escapeHtml(entry.kind), "</span>",
          '<span class="log-title">', escapeHtml(entry.title), "</span>",
          entry.detail ? "<pre>" + escapeHtml(entry.detail) + "</pre>" : "",
          "</li>"
        ].join("");
      }).join("");
    }

    var networkList = byId("networkList");
    if (networkList) {
      networkList.innerHTML = state.network.map(function (entry) {
        return [
          '<li class="network-row network-', networkStatusClass(entry), '">',
          '<button type="button" class="network-toggle" data-network-id="', escapeHtml(entry.id), '" aria-expanded="', entry.expanded ? "true" : "false", '">',
          "<span>", escapeHtml(entry.at), "</span>",
          "<strong>", escapeHtml(entry.method), "</strong>",
          "<em>", escapeHtml(networkStatus(entry)), "</em>",
          "<code>", escapeHtml(shortUrl(entry.url)), "</code>",
          "</button>",
          entry.expanded ? [
            '<div class="network-detail">',
            "<div>",
            "<span>Request</span>",
            "<code>", escapeHtml(entry.method + " " + entry.url), "</code>",
            entry.requestBody ? "<pre>" + escapeHtml(toText(entry.requestBody)) + "</pre>" : "<pre>(empty)</pre>",
            "</div>",
            "<div>",
            "<span>Response</span>",
            "<code>", escapeHtml(entry.responseAt ? entry.responseAt + " " + networkStatus(entry) : "pending"), "</code>",
            entry.responseBody !== undefined ? "<pre>" + escapeHtml(toText(entry.responseBody)) + "</pre>" : "<pre>(pending)</pre>",
            "</div>",
            "</div>"
          ].join("") : "",
          "</li>"
        ].join("");
      }).join("");
    }
  }

  function bindControls() {
    byId("clearLogs").addEventListener("click", function () {
      state.logs = [];
      state.network = [];
      state.counters = { actions: 0, traces: 0, network: 0, errors: 0 };
      renderDynamic();
    });
    byId("networkList").addEventListener("click", function (event) {
      var toggle = event.target && event.target.closest ? event.target.closest("[data-network-id]") : null;
      if (toggle) toggleNetwork(toggle.getAttribute("data-network-id") || "");
    });
    byId("setIdentity").addEventListener("click", function () {
      showIdentityEditor("setIdentity");
    });
    byId("setIdentities").addEventListener("click", function () {
      showIdentityEditor("setIdentities");
    });
    byId("submitIdentity").addEventListener("click", function () {
      if (activeIdentityAction === "setIdentity") {
        runAction("setIdentity", function () {
          var field = selectedIdentityField();
          var value = getInput(field.id).value.trim();
          state.identity = value;
          return ensureSdk().setIdentity(field.key, value || null);
        });
        return;
      }
      runAction("setIdentities", function () {
        var identities = readIdentityEntries();
        state.identity = identities[window.DFIdentity.EXTERNAL_ID] || "";
        return ensureSdk().setIdentities(identities);
      });
    });
    byId("setUserProfile").addEventListener("click", function () {
      showProfileEditor("setUserProfile");
    });
    byId("setUserProfiles").addEventListener("click", function () {
      showProfileEditor("setUserProfiles");
    });
    byId("submitProfile").addEventListener("click", function () {
      if (activeProfileAction === "setUserProfile") {
        runAction("setUserProfile", function () {
          var entry = selectedProfileValue();
          return ensureSdk().setUserProfile(entry[0], entry[1]);
        });
        return;
      }
      runAction("setUserProfiles", function () {
        return ensureSdk().setUserProfiles(profilePayload());
      });
    });
    byId("addCustomProfile").addEventListener("click", addCustomProfileRow);
    byId("customProfileRows").addEventListener("click", function (event) {
      var removeButton = event.target && event.target.closest ? event.target.closest("[data-remove-custom-profile]") : null;
      if (!removeButton) return;
      var rowId = removeButton.getAttribute("data-remove-custom-profile");
      var row = document.querySelector('[data-custom-profile-row="' + rowId + '"]');
      if (row) row.remove();
    });
    byId("onInitialized").addEventListener("click", function () {
      runAction("onInitialized", function () {
        return ensureSdk().onInitialized(function () {
          addLog("success", "manual onInitialized callback");
        });
      });
    });
    byId("getCookieId").addEventListener("click", function () {
      runAction("getCookieId", function () {
        return ensureSdk().getCookieId();
      });
    });
    byId("isSDKEnabled").addEventListener("click", function () {
      runAction("isSDKEnabled", function () {
        return ensureSdk().isSDKEnabled();
      });
    });
    byId("installTrace").addEventListener("click", function () {
      runAction("debug.traceListener", function () {
        var sdk = ensureSdk();
        if (!sdk.debug || !sdk.debug.traceListener) {
          throw new Error("Dfinery.debug.traceListener is available after the SDK bundle has loaded.");
        }
        return sdk.debug.traceListener(function (message, logLevel) {
          addLog("trace", message, { logLevel: logLevel, source: "debug.traceListener" });
        });
      });
    });
    byId("runQueuedFunctions").addEventListener("click", function () {
      runAction("runQueuedFunctions", function () {
        return ensureSdk().runQueuedFunctions();
      });
    });
    byId("remainQueuedFunctions").addEventListener("click", function () {
      runAction("remainQueuedFunctions", function () {
        return ensureSdk().remainQueuedFunctions();
      });
    });
    byId("disableSDK").addEventListener("click", function () {
      runAction("disableSDK", function () {
        return ensureSdk().disableSDK();
      });
    });
    byId("enableSDK").addEventListener("click", function () {
      runAction("enableSDK", function () {
        return ensureSdk().enableSDK();
      });
    });
    byId("resetIdentity").addEventListener("click", function () {
      runAction("resetIdentity", function () {
        state.identity = "";
        return ensureSdk().resetIdentity();
      });
    });
    byId("eventLogin").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.LOGIN, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFIdentity = window.DFIdentity;
        async function DfineryLogin() {
          await Dfinery.setIdentity(DFIdentity.EXTERNAL_ID, "TestUserId");
          Dfinery.logEvent(DFEvent.LOGIN);
        }
        return DfineryLogin();
      });
    });
    byId("eventLogout").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.LOGOUT, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        Dfinery.logEvent(DFEvent.LOGOUT);
      });
    });
    byId("eventSignUp").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.SIGN_UP, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const properties = {};
        properties[DFEventProperty.SIGN_CHANNEL] = "Kakao";
        Dfinery.logEvent(DFEvent.SIGN_UP, properties);
      });
    });
    byId("eventPurchase").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.PURCHASE, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 6;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        properties[DFEventProperty.PAYMENT_METHOD] = "BankTransfer";
        properties[DFEventProperty.ORDER_ID] = "Order-123";
        properties[DFEventProperty.TOTAL_PURCHASE_AMOUNT] = 30000;
        properties[DFEventProperty.DELIVERY_CHARGE] = 2500;
        properties[DFEventProperty.DISCOUNT] = 3000;

        Dfinery.logEvent(DFEvent.PURCHASE, properties);
      });
    });
    byId("eventRefund").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.REFUND, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        Dfinery.logEvent(DFEvent.REFUND, properties);
      });
    });
    byId("eventViewHome").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.VIEW_HOME, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        const properties = {};
        properties["key"] = "value";
        Dfinery.logEvent(DFEvent.VIEW_HOME, properties);
      });
    });
    byId("eventViewProductDetails").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.VIEW_PRODUCT_DETAILS, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        Dfinery.logEvent(DFEvent.VIEW_PRODUCT_DETAILS, properties);
      });
    });
    byId("eventAddToCart").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.ADD_TO_CART, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        Dfinery.logEvent(DFEvent.ADD_TO_CART, properties);
      });
    });
    byId("eventAddToWishlist").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.ADD_TO_WISHLIST, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        Dfinery.logEvent(DFEvent.ADD_TO_WISHLIST, properties);
      });
    });
    byId("eventViewSearchResult").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.VIEW_SEARCH_RESULT, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 16000;
        item[DFEventProperty.ITEM_DISCOUNT] = 700;
        item[DFEventProperty.ITEM_QUANTITY] = 10;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        properties[DFEventProperty.KEYWORD] = "사또밥";

        Dfinery.logEvent(DFEvent.VIEW_SEARCH_RESULT, properties);
      });
    });
    byId("eventShareProduct").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.SHARE_PRODUCT, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        properties[DFEventProperty.SHARING_CHANNEL] = "Facebook";

        Dfinery.logEvent(DFEvent.SHARE_PRODUCT, properties);
      });
    });
    byId("eventViewList").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.VIEW_LIST, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;

        Dfinery.logEvent(DFEvent.VIEW_LIST, properties);
      });
    });
    byId("eventViewCart").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.VIEW_CART, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;

        Dfinery.logEvent(DFEvent.VIEW_CART, properties);
      });
    });
    byId("eventRemoveCart").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.REMOVE_CART, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        var DFEventProperty = window.DFEventProperty;
        const item = {};
        item[DFEventProperty.ITEM_ID] = "상품번호";
        item[DFEventProperty.ITEM_NAME] = "상품이름";
        item[DFEventProperty.ITEM_PRICE] = 5000;
        item[DFEventProperty.ITEM_DISCOUNT] = 500;
        item[DFEventProperty.ITEM_QUANTITY] = 5;
        item[DFEventProperty.ITEM_CATEGORY1] = "식품";
        item[DFEventProperty.ITEM_CATEGORY2] = "과자";

        const itemList = [];
        itemList.push(item);

        const properties = {};
        properties[DFEventProperty.ITEMS] = itemList;
        Dfinery.logEvent(DFEvent.REMOVE_CART, properties);
      });
    });
    byId("eventAddPaymentInfo").addEventListener("click", function () {
      runAction("logEvent " + window.DFEvent.ADD_PAYMENT_INFO, function () {
        var Dfinery = ensureSdk();
        var DFEvent = window.DFEvent;
        const properties = {};
        properties["key"] = "value";
        Dfinery.logEvent(DFEvent.ADD_PAYMENT_INFO, properties);
      });
    });
    byId("eventCustomInt").addEventListener("click", function () {
      runAction("logEvent custom_int", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["int"] = 123;
        Dfinery.logEvent("custom_int", properties);
      });
    });
    byId("eventCustomDouble").addEventListener("click", function () {
      runAction("logEvent custom_double", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["double"] = 123.45;
        Dfinery.logEvent("custom_double", properties);
      });
    });
    byId("eventCustomBool").addEventListener("click", function () {
      runAction("logEvent custom_bool", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["bool"] = true;
        Dfinery.logEvent("custom_bool", properties);
      });
    });
    byId("eventCustomDate").addEventListener("click", function () {
      runAction("logEvent custom_date", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["date"] = new Date("2026-05-26T00:00:00.000Z");
        Dfinery.logEvent("custom_date", properties);
      });
    });
    byId("eventCustomStr").addEventListener("click", function () {
      runAction("logEvent custom_str", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["string"] = "value";
        Dfinery.logEvent("custom_str", properties);
      });
    });
    byId("eventCustomIntArray").addEventListener("click", function () {
      runAction("logEvent custom_int_array", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["int_array"] = [1, 2, 3];
        Dfinery.logEvent("custom_int_array", properties);
      });
    });
    byId("eventCustomStrArray").addEventListener("click", function () {
      runAction("logEvent custom_str_array", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["str_array"] = ["value1", "value2", "value3"];
        Dfinery.logEvent("custom_str_array", properties);
      });
    });
    byId("eventCustomDoubleArray").addEventListener("click", function () {
      runAction("logEvent custom_double_array", function () {
        var Dfinery = ensureSdk();
        const properties = {};
        properties["double_array"] = [1.1, 2.2, 3.3];
        Dfinery.logEvent("custom_double_array", properties);
      });
    });
    byId("eventCustomConcurrency10").addEventListener("click", function () {
      runAction("logEvent custom x10", function () {
        return logCustomConcurrency(10);
      });
    });
    byId("eventCustomConcurrency100").addEventListener("click", function () {
      runAction("logEvent custom x100", function () {
        return logCustomConcurrency(100);
      });
    });
    byId("eventCustomConcurrency1000").addEventListener("click", function () {
      runAction("logEvent custom x1000", function () {
        return logCustomConcurrency(1000);
      });
    });
  }

  function initSdkForDocument() {
    var sdk = ensureSdk();
    state.initCalls += 1;
    addLog("action", "init " + state.serviceId);
    sdk.onInitialized(function () {
      state.initialized = true;
      state.sdkLoaded = true;
      addLog("success", "onInitialized callback", {
        cookieId: sdk.getCookieId ? sdk.getCookieId() : null
      });
      renderDynamic();
    });
    sdk.init(state.serviceId, {
      logEnable: true,
      logLevel: window.DFLogLevel.INFO,
      shareSubdomainCookie: true,
      transport: TRANSPORT_XHR,
      traceListener: function (message, logLevel) {
        addLog("trace", message, { logLevel: logLevel });
      }
    });
    addLog("success", "init invoked through snippet");
  }

  window.__dfnCdnMpaOnSdkLoad = function () {
    state.sdkLoaded = true;
    addLog("success", "hosted SDK script loaded", state.sdkUrl);
    renderDynamic();
  };

  installNetworkMonitor();
  renderShell();
  runAction("snippet bootstrap", function () {
    return {
      sdkMode: state.sdkMode,
      sdkUrl: state.sdkUrl,
      queuedMethods: window.Dfinery && window.Dfinery.queue ? window.Dfinery.queue.length : null
    };
  });
  initSdkForDocument();
}());
