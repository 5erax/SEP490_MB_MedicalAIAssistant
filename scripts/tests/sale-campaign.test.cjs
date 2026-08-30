// Run: node --test scripts/tests/sale-campaign.test.cjs
// Exercises the real TS modules with in-memory network, native, and hook
// dependencies. No PayOS transaction or backend data is created by this suite.
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const compiled = new Map();

function createLoader(mocks = {}, globals = {}) {
  const modules = new Map();
  function load(request) {
    if (Object.hasOwn(mocks, request)) return mocks[request];
    if (!request.startsWith("@/")) return require(request);
    const base = path.join(root, request.slice(2));
    const file = [base + ".ts", base + ".tsx"].find(fs.existsSync);
    if (!file) throw new Error(`No fixture module for ${request}`);
    if (modules.has(file)) return modules.get(file).exports;
    if (!compiled.has(file)) {
      compiled.set(file, ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        fileName: file,
      }).outputText);
    }
    const module = { exports: {} };
    modules.set(file, module);
    const names = Object.keys(globals);
    const run = vm.runInThisContext(`(function(require,module,exports,${names.join(",")}){${compiled.get(file)}\n})`, { filename: file });
    run(load, module, module.exports, ...Object.values(globals));
    return module.exports;
  }
  return load;
}

function offer(overrides = {}) {
  return {
    plan: { id: "plan-1", planName: "Gói kiểm tra", price: 20000, durationInDays: 30, quotas: [{ quotaCode: "SERVICE_CREDIT", limitValue: 2 }] },
    originalPrice: 20000, effectivePrice: 20000, baseCredit: 2, bonusCredit: 0, grantedCredit: 2, offer: null,
    ...overrides,
  };
}
function sale(overrides = {}) {
  return offer({ effectivePrice: 15000, bonusCredit: 1, grantedCredit: 3,
    offer: { offerId: "offer-1", campaignId: "campaign-1", campaignName: "Ưu đãi thử nghiệm", badgeText: "Ưu đãi tháng này", remainingRedemptions: 4 },
    ...overrides });
}
const utils = createLoader()("@/src/utils/subscriptionOffers");

test("no-sale snapshot explicitly sends null offer, displayed price and credits", () => {
  assert.deepEqual(utils.getPricingSnapshot(offer()), { expectedOfferId: null, expectedEffectivePrice: 20000, expectedGrantedCredit: 2 });
  for (const value of [undefined, null, NaN, Infinity, -1]) {
    assert.equal(utils.getPricingSnapshot(offer({ effectivePrice: value })), null);
    assert.equal(utils.getPricingSnapshot(offer({ grantedCredit: value })), null);
  }
});

function hookHarness(options = {}) {
  const states = [], effects = [], timers = new Map(), listeners = [], requests = [], opened = [], toasts = [], navigations = [];
  let timerId = 0, pending = null, clearedSession = false;
  const native = { AppState: { currentState: "active", addEventListener: (_, cb) => {
    listeners.push(cb);
    return { remove: () => listeners.splice(listeners.indexOf(cb), 1) };
  } }, Platform: { OS: "android" } };
  const fakeReact = {
    useState: (initial) => { const index = states.length; states.push(initial); return [initial, (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }]; },
    useRef: (initial) => ({ current: initial }), useMemo: (fn) => fn(), useCallback: (fn) => fn, useEffect: (fn) => effects.push(fn),
  };
  const apiRequest = async (url, config = {}) => {
    requests.push({ url, ...config });
    if (url.endsWith("/offers")) {
      if (options.offersError) throw options.offersError;
      return { data: options.fetchOffers ? await options.fetchOffers() : (options.latest ?? [offer()]) };
    }
    if (url.endsWith("/checkout")) {
      if (options.checkoutError) throw options.checkoutError;
      return { data: { paymentId: "payment-1", paymentUrl: "https://example.test/checkout", orderCode: "123" } };
    }
    if (url.includes("reconcile")) {
      if (options.reconcileResult) return { data: options.reconcileResult };
      throw new Error("Use the payment-detail fallback in this fixture");
    }
    if (url.includes("/payments/") && !url.includes("reconcile")) return { data: { statusName: options.paymentStatus ?? "Pending" } };
    return { data: [] };
  };
  const load = createLoader({
    react: fakeReact,
    "react-native": native,
    "@react-navigation/native": { useIsFocused: () => options.focused !== false },
    "expo-router": { router: { push: (url) => navigations.push(url) } },
    "expo-web-browser": { openBrowserAsync: async (url) => opened.push(url) },
    "@/src/api/client": { apiRequest },
    "@/src/hooks/useToast": { useToast: () => ({ showToast: (item) => toasts.push(item) }) },
    "@/src/providers": { useAuth: () => ({ session: { accessToken: "fixture-token" }, clearSession: async () => { clearedSession = true; }, setSession: async () => {} }) },
    "@/src/services/authService": { authService: { refresh: async () => ({}) }, normalizeAuthSession: () => null },
    "@/src/services/subscriptionUsageService": { subscriptionUsageApi: { getUsage: async () => { requests.push({ url: "usage" }); } } },
    "@/src/services/paymentCheckoutStorage": {
      getPendingPaymentCheckout: async () => pending,
      setPendingPaymentCheckout: async (next) => { pending = next; },
      clearPendingPaymentCheckout: async () => { pending = null; },
    },
  }, {
    setInterval: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearInterval: (id) => timers.delete(id),
  });
  const hook = load("@/src/hooks/useSubscription").useSubscription();
  return { hook, states, effects, timers, listeners, requests, opened, toasts, navigations,
    service: load("@/src/services/subscriptionService"),
    get checkoutRequests() { return requests.filter((r) => r.url.endsWith("/checkout")); },
    get offerRequests() { return requests.filter((r) => r.url.endsWith("/offers")); },
    get clearedSession() { return clearedSession; },
  };
}
async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }

test("matching no-sale preflight opens PayOS with a strict mobile snapshot", async () => {
  const h = hookHarness();
  await h.hook.startCheckout(offer(), false);
  assert.equal(h.checkoutRequests.length, 1);
  assert.deepEqual(h.checkoutRequests[0].data, { planId: "plan-1", autoRenew: false, clientType: "mobile", expectedOfferId: null, expectedEffectivePrice: 20000, expectedGrantedCredit: 2 });
  assert.equal(h.opened.length, 1);
  assert.equal(h.offerRequests[0].requiresAuth, true);
});

test("matching sale sends the chosen server offer, price and total credits", async () => {
  const h = hookHarness({ latest: [sale()] });
  await h.hook.startCheckout(sale(), true);
  assert.equal(h.checkoutRequests[0].data.expectedOfferId, "offer-1");
  assert.equal(h.checkoutRequests[0].data.expectedEffectivePrice, 15000);
  assert.equal(h.checkoutRequests[0].data.expectedGrantedCredit, 3);
  assert.equal(h.checkoutRequests[0].data.autoRenew, true);
});

const staleCases = [
  ["sale created or slot released", offer(), sale()],
  ["last sale slot reserved by someone else", sale(), offer()],
  ["same offer repriced", sale(), sale({ effectivePrice: 18000 })],
  ["same offer credits changed", sale(), sale({ grantedCredit: 4 })],
  ["offer identity changed at the same price", sale(), sale({ offer: { ...sale().offer, offerId: "offer-2" } })],
  ["normal price changed", offer(), offer({ effectivePrice: 18000 })],
  ["base credit changed", offer(), offer({ baseCredit: 4, grantedCredit: 4 })],
  ["plan removed", offer(), null],
];
for (const [name, displayed, latest] of staleCases) {
  test(`stale preflight: ${name} updates cards without checkout or browser`, async () => {
    const h = hookHarness({ latest: latest ? [latest] : [] });
    await h.hook.startCheckout(displayed, false);
    assert.equal(h.checkoutRequests.length, 0);
    assert.equal(h.opened.length, 0);
    assert.equal(h.toasts[0].type, "warning");
    assert.deepEqual(h.states[0], latest ? [latest] : []);
  });
}

for (const errors of [["SALE_OFFER_UNAVAILABLE"], "SALE_OFFER_UNAVAILABLE"]) {
  test(`409 sale conflict (${typeof errors}) reloads offers and never auto retries`, async () => {
    const h = hookHarness({ latest: [sale()], checkoutError: { status: 409, payload: { errors } } });
    await h.hook.startCheckout(sale(), false);
    assert.equal(h.checkoutRequests.length, 1);
    assert.equal(h.offerRequests.length, 2);
    assert.equal(h.opened.length, 0);
    assert.equal(h.toasts[0].title, "Bảng giá đã thay đổi");
    assert.ok(h.states.some((s) => s?.status === "idle"));
  });
}

test("preflight failure never falls back to legacy checkout", async () => {
  const h = hookHarness({ offersError: new Error("offline") });
  await h.hook.startCheckout(offer(), false);
  assert.equal(h.checkoutRequests.length, 0);
  assert.equal(h.opened.length, 0);
  assert.ok(h.states.some((s) => s?.status === "error"));
});

test("expired checkout session returns to login instead of creating payment", async () => {
  const h = hookHarness({ checkoutError: { status: 401 } });
  await h.hook.startCheckout(offer(), false);
  assert.equal(h.clearedSession, true);
  assert.equal(h.navigations.length, 1);
  assert.equal(h.opened.length, 0);
});

test("double tap during preflight creates only one checkout", async () => {
  let resolve;
  const gate = new Promise((done) => { resolve = done; });
  const h = hookHarness({ fetchOffers: () => gate });
  const first = h.hook.startCheckout(offer(), false);
  await h.hook.startCheckout(offer(), false);
  assert.equal(h.offerRequests.length, 1);
  resolve([offer()]);
  await first;
  assert.equal(h.checkoutRequests.length, 1);
});

for (const paymentStatus of ["Paid", "Cancelled", "Failed", "Expired"]) {
  test(`${paymentStatus} refreshes offers after payment polling`, async () => {
    const h = hookHarness({ paymentStatus });
    await h.hook.startCheckout(offer(), false);
    await flush();
    assert.ok(h.offerRequests.length >= 2);
    if (paymentStatus === "Paid") assert.ok(h.requests.some((r) => r.url === "usage"));
  });
}

for (const paymentStatus of ["Paid", "Cancelled", "Failed", "Expired"]) {
  test(`${paymentStatus} from PayOS reconciliation also refreshes offers`, async () => {
    const h = hookHarness({ reconcileResult: { paymentStatus, isPaid: paymentStatus === "Paid", isActive: paymentStatus === "Paid" } });
    await h.hook.startCheckout(offer(), false);
    await flush();
    assert.ok(h.offerRequests.length >= 2);
  });
}

for (const session of [null, { accessToken: "fixture-token" }]) {
  test(`offers auth interceptor works with ${session ? "authenticated" : "anonymous"} pricing`, async () => {
    let intercept;
    createLoader({
      axios: { create: () => ({ interceptors: { request: { use: (fn) => { intercept = fn; } }, response: { use: () => {} } } }) },
      "@/src/config/env": { env: { apiBaseUrl: "https://example.test" } },
      "@/src/utils/errors": { getErrorMessage: () => "error" },
      "@/src/services/sessionStorage": { getStoredSession: async () => session },
    })("@/src/api/client");
    const request = await intercept({ requiresAuth: true, headers: {} });
    assert.equal(request.headers.Authorization, session ? "Bearer fixture-token" : undefined);
  });
}

test("15-second refresh is silent, pauses in background, resumes on foreground, and cleans up", async () => {
  const h = hookHarness();
  const cleanups = h.effects.map((fn) => fn());
  await flush();
  const timer = [...h.timers.values()].find((t) => t.ms === 15000);
  assert.ok(timer);
  const before = h.offerRequests.length;
  timer.fn();
  assert.equal(h.states[1], false, "silent refresh must not show a skeleton");
  await flush();
  assert.equal(h.offerRequests.length, before + 1);
  h.listeners.forEach((cb) => cb("background"));
  timer.fn();
  await flush();
  assert.equal(h.offerRequests.length, before + 1);
  h.listeners.forEach((cb) => cb("active"));
  await flush();
  assert.equal(h.offerRequests.length, before + 2);
  cleanups.forEach((cleanup) => cleanup?.());
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.length, 0);
});

test("older offers response cannot overwrite the newer response", async () => {
  const pending = [];
  const h = hookHarness({ fetchOffers: () => new Promise((resolve) => pending.push(resolve)) });
  const old = h.hook.reloadPlans();
  const fresh = h.hook.reloadPlans();
  pending[1]([sale()]);
  await fresh;
  pending[0]([offer()]);
  assert.equal(await old, null);
  assert.deepEqual(h.states[0], [sale()]);
});

test("inactive screen has no offer timer", () => {
  const h = hookHarness({ focused: false });
  const cleanups = h.effects.map((fn) => fn());
  assert.equal([...h.timers.values()].filter((t) => t.ms === 15000).length, 0);
  cleanups.forEach((cleanup) => cleanup?.());
});

test("invalid snapshot is rejected by service without making a request", async () => {
  const h = hookHarness();
  await assert.rejects(h.service.userSubscriptionsApi.checkout(offer({ effectivePrice: undefined })), /chưa hợp lệ/);
  assert.equal(h.requests.length, 0);
});

function uiLoader(payment) {
  let stateIndex = 0;
  const states = [payment, false, ""];
  return createLoader({
    react: { useState: () => [states[stateIndex++], () => {}], useEffect: () => {} },
    "react-native": { StyleSheet: { create: (s) => s }, Platform: { select: (s) => s.default }, View: "View", ActivityIndicator: "Loading", Modal: "Modal", Pressable: "Pressable", ScrollView: "ScrollView" },
    "lucide-react-native": new Proxy({}, { get: (_, key) => `Icon-${key}` }),
    "@/src/components/ui": { AppText: "Text", Badge: "Badge", Button: "Button", Card: "Card", LoadingState: "Loading" },
    "@/src/services/subscriptionService": {},
    "@/src/api/client": {},
    "./PaymentStatusBadge": { PaymentStatusBadge: "PaymentStatusBadge" },
  });
}
function nodes(element) {
  if (element == null || typeof element === "boolean") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (typeof element !== "object") return [element];
  if (typeof element.type === "function") return nodes(element.type(element.props));
  return [element, ...nodes(element.props?.children)];
}
function uiFacts(tree) {
  const all = nodes(tree);
  return {
    text: all.filter((n) => typeof n === "string" || typeof n === "number").join(""),
    strikes: all.filter((n) => typeof n === "object" && [n.props?.style].flat(Infinity).some((s) => s?.textDecorationLine === "line-through")),
  };
}

for (const [name, item, expectedStrikes, total] of [
  ["no sale", offer(), 0, 2],
  ["price-only", sale({ bonusCredit: 0, grantedCredit: 2 }), 1, 2],
  ["bonus-only", sale({ effectivePrice: 20000, bonusCredit: 4, grantedCredit: 6 }), 0, 6],
  ["combo", sale(), 1, 3],
]) {
  test(`plan card renders ${name} using server price and total credits`, () => {
    const { PaidPlanCard } = uiLoader()("@/src/components/subscription/PlanCard");
    const facts = uiFacts(PaidPlanCard({ planOffer: item, actionLabel: "Mua", onAction: () => {} }));
    assert.match(facts.text, new RegExp(`Tổng nhận: ${total} lượt`));
    assert.equal(facts.strikes.length, expectedStrikes);
    assert.ok(facts.text.includes(item.effectivePrice.toLocaleString("vi-VN")));
    if (item.bonusCredit > 0) assert.ok(facts.text.includes(`+${item.bonusCredit} lượt khuyến mãi`));
    if (item.offer) assert.ok(facts.text.includes(item.offer.badgeText));
  });
}

test("unlimited sale does not invent remaining slots", () => {
  const { PaidPlanCard } = uiLoader()("@/src/components/subscription/PlanCard");
  const item = sale({ offer: { ...sale().offer, remainingRedemptions: null } });
  assert.ok(!uiFacts(PaidPlanCard({ planOffer: item })).text.includes("suất ưu đãi"));
});

for (const amount of [15000, 20000]) {
  test(`payment history displays saved bonus/total with amount ${amount}`, () => {
    const payment = { id: "payment-1", amount, originalAmount: 20000, discountAmount: 20000 - amount, saleCampaignName: "Đợt sale đã lưu", baseCredit: 2, bonusCredit: 3, grantedCredit: 5 };
    const { PaymentDetailSheet } = uiLoader(payment)("@/src/components/payment/PaymentDetailSheet");
    const facts = uiFacts(PaymentDetailSheet({ paymentId: payment.id, visible: true }));
    assert.ok(facts.text.includes("Đợt sale đã lưu"));
    assert.ok(facts.text.includes("+3 lượt"));
    assert.ok(facts.text.includes("Tổng lượt theo giao dịch5 lượt"));
    assert.equal(facts.strikes.length, amount < 20000 ? 1 : 0);
    assert.equal(facts.text.includes("Giảm giá"), amount < 20000);
  });
}
