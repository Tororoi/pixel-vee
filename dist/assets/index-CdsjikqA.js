var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _a2, _t, _n2, _e, _s2, _o2, _i2, _r2, _a3, _c2, _u2, _l2, _f2, _h2, _p2, _ir_instances, d_fn, m_fn, v_fn, g_fn, y_fn, b_fn, _t2, _n3, _e2, _s3, _o3, _i3, _r3, _a4, _c3, _u3, _l3, _f3, _h3, _p3, _d2, _m2, _mc_instances, v_fn2, g_fn2, y_fn2, b_fn2, x_fn, S_fn, C_fn, w_fn, _b, _t3, _n4, _e3, _s4, _o4, _i4, _r4, _t4, _n5, _e4, _s5, _un_instances, o_fn, i_fn, _c4;
(function() {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) n(s);
  new MutationObserver((s) => {
    for (const a of s) if (a.type === "childList") for (const l of a.addedNodes) l.tagName === "LINK" && l.rel === "modulepreload" && n(l);
  }).observe(document, { childList: true, subtree: true });
  function o(s) {
    const a = {};
    return s.integrity && (a.integrity = s.integrity), s.referrerPolicy && (a.referrerPolicy = s.referrerPolicy), s.crossOrigin === "use-credentials" ? a.credentials = "include" : s.crossOrigin === "anonymous" ? a.credentials = "omit" : a.credentials = "same-origin", a;
  }
  function n(s) {
    if (s.ep) return;
    s.ep = true;
    const a = o(s);
    fetch(s.href, a);
  }
})();
const wl = false;
var Oi = Array.isArray, Ml = Array.prototype.indexOf, Gr = Array.prototype.includes, dn = Array.from, kl = Object.defineProperty, Rr = Object.getOwnPropertyDescriptor, Li = Object.getOwnPropertyDescriptors, Pl = Object.prototype, _l = Array.prototype, as = Object.getPrototypeOf, Vs = Object.isExtensible;
const Ti = () => {
};
function Ol(e) {
  for (var t = 0; t < e.length; t++) e[t]();
}
function Ii() {
  var e, t, o = new Promise((n, s) => {
    e = n, t = s;
  });
  return { promise: o, resolve: e, reject: t };
}
function ls(e, t) {
  if (Array.isArray(e)) return e;
  if (!(Symbol.iterator in e)) return Array.from(e);
  const o = [];
  for (const n of e) if (o.push(n), o.length === t) break;
  return o;
}
const Ne = 2, qr = 4, fn = 8, Xi = 1 << 24, Tt = 16, kt = 32, sr = 64, Dn = 128, yt = 512, Ae = 1024, $e = 2048, It = 4096, je = 8192, dt = 16384, Or = 32768, Vn = 1 << 25, wr = 65536, $n = 1 << 17, Ll = 1 << 18, Jr = 1 << 19, Tl = 1 << 20, Ot = 1 << 25, Mr = 65536, Gn = 1 << 21, ho = 1 << 22, tr = 1 << 23, br = Symbol("$state"), Il = Symbol("legacy props"), Xl = Symbol(""), Kt = new class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "StaleReactionError");
    __publicField(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
  }
}(), El = !!((_a2 = globalThis.document) == null ? void 0 : _a2.contentType) && globalThis.document.contentType.includes("xml");
function Bl(e) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function zl() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Yl(e, t, o) {
  throw new Error("https://svelte.dev/e/each_key_duplicate");
}
function Al(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Rl() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Kl(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Dl() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Vl(e) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function $l() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Gl() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function ql() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Ul() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
const Hl = 1, Nl = 2, Ei = 4, Wl = 8, jl = 16, Fl = 1, Jl = 2, Zl = 4, Ql = 8, ec = 16, tc = 1, rc = 2, Re = Symbol(), Bi = "http://www.w3.org/1999/xhtml", oc = "http://www.w3.org/2000/svg", nc = "http://www.w3.org/1998/Math/MathML";
function sc() {
  console.warn("https://svelte.dev/e/derived_inert");
}
function ic() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
function zi(e) {
  return e === this.v;
}
function Yi(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function Ai(e) {
  return !Yi(e, this.v);
}
let Zr = false, ac = false;
function lc() {
  Zr = true;
}
let Ie = null;
function Ur(e) {
  Ie = e;
}
function Oe(e, t = false, o) {
  Ie = { p: Ie, i: false, c: null, e: null, s: e, x: null, r: ve, l: Zr && !t ? { s: null, u: null, $: [] } : null };
}
function Le(e) {
  var t = Ie, o = t.e;
  if (o !== null) {
    t.e = null;
    for (var n of o) ta(n);
  }
  return t.i = true, Ie = t.p, {};
}
function Qr() {
  return !Zr || Ie !== null && Ie.l === null;
}
let Br = [];
function cc() {
  var e = Br;
  Br = [], Ol(e);
}
function rr(e) {
  if (Br.length === 0) {
    var t = Br;
    queueMicrotask(() => {
      t === Br && cc();
    });
  }
  Br.push(e);
}
function Ri(e) {
  var t = ve;
  if (t === null) return ge.f |= tr, e;
  if ((t.f & Or) === 0 && (t.f & qr) === 0) throw e;
  Qt(e, t);
}
function Qt(e, t) {
  for (; t !== null; ) {
    if ((t.f & Dn) !== 0) {
      if ((t.f & Or) === 0) throw e;
      try {
        t.b.error(e);
        return;
      } catch (o) {
        e = o;
      }
    }
    t = t.parent;
  }
  throw e;
}
const uc = -7169;
function Te(e, t) {
  e.f = e.f & uc | t;
}
function cs(e) {
  (e.f & yt) !== 0 || e.deps === null ? Te(e, Ae) : Te(e, It);
}
function Ki(e) {
  if (e !== null) for (const t of e) (t.f & Ne) === 0 || (t.f & Mr) === 0 || (t.f ^= Mr, Ki(t.deps));
}
function Di(e, t, o) {
  (e.f & $e) !== 0 ? t.add(e) : (e.f & It) !== 0 && o.add(e), Ki(e.deps), Te(e, Ae);
}
let Bo = false;
function dc(e) {
  var t = Bo;
  try {
    return Bo = false, [e(), Bo];
  } finally {
    Bo = t;
  }
}
const fr = /* @__PURE__ */ new Set();
let xe = null, Ct = null, qn = null, bn = false, zr = null, Uo = null;
var $s = 0;
let fc = 1;
const _ir = class _ir {
  constructor() {
    __privateAdd(this, _ir_instances);
    __publicField(this, "id", fc++);
    __publicField(this, "current", /* @__PURE__ */ new Map());
    __publicField(this, "previous", /* @__PURE__ */ new Map());
    __privateAdd(this, _t, /* @__PURE__ */ new Set());
    __privateAdd(this, _n2, /* @__PURE__ */ new Set());
    __privateAdd(this, _e, /* @__PURE__ */ new Set());
    __privateAdd(this, _s2, /* @__PURE__ */ new Map());
    __privateAdd(this, _o2, /* @__PURE__ */ new Map());
    __privateAdd(this, _i2, null);
    __privateAdd(this, _r2, []);
    __privateAdd(this, _a3, []);
    __privateAdd(this, _c2, /* @__PURE__ */ new Set());
    __privateAdd(this, _u2, /* @__PURE__ */ new Set());
    __privateAdd(this, _l2, /* @__PURE__ */ new Map());
    __privateAdd(this, _f2, /* @__PURE__ */ new Set());
    __publicField(this, "is_fork", false);
    __privateAdd(this, _h2, false);
    __privateAdd(this, _p2, /* @__PURE__ */ new Set());
  }
  skip_effect(t) {
    __privateGet(this, _l2).has(t) || __privateGet(this, _l2).set(t, { d: [], m: [] }), __privateGet(this, _f2).delete(t);
  }
  unskip_effect(t, o = (n) => this.schedule(n)) {
    var n = __privateGet(this, _l2).get(t);
    if (n) {
      __privateGet(this, _l2).delete(t);
      for (var s of n.d) Te(s, $e), o(s);
      for (s of n.m) Te(s, It), o(s);
    }
    __privateGet(this, _f2).add(t);
  }
  capture(t, o, n = false) {
    t.v !== Re && !this.previous.has(t) && this.previous.set(t, t.v), (t.f & tr) === 0 && (this.current.set(t, [o, n]), Ct == null ? void 0 : Ct.set(t, o)), this.is_fork || (t.v = o);
  }
  activate() {
    xe = this;
  }
  deactivate() {
    xe = null, Ct = null;
  }
  flush() {
    try {
      bn = true, xe = this, __privateMethod(this, _ir_instances, v_fn).call(this);
    } finally {
      $s = 0, qn = null, zr = null, Uo = null, bn = false, xe = null, Ct = null, xr.clear();
    }
  }
  discard() {
    for (const t of __privateGet(this, _n2)) t(this);
    __privateGet(this, _n2).clear(), __privateGet(this, _e).clear(), fr.delete(this);
  }
  register_created_effect(t) {
    __privateGet(this, _a3).push(t);
  }
  increment(t, o) {
    let n = __privateGet(this, _s2).get(o) ?? 0;
    if (__privateGet(this, _s2).set(o, n + 1), t) {
      let s = __privateGet(this, _o2).get(o) ?? 0;
      __privateGet(this, _o2).set(o, s + 1);
    }
  }
  decrement(t, o, n) {
    let s = __privateGet(this, _s2).get(o) ?? 0;
    if (s === 1 ? __privateGet(this, _s2).delete(o) : __privateGet(this, _s2).set(o, s - 1), t) {
      let a = __privateGet(this, _o2).get(o) ?? 0;
      a === 1 ? __privateGet(this, _o2).delete(o) : __privateGet(this, _o2).set(o, a - 1);
    }
    __privateGet(this, _h2) || n || (__privateSet(this, _h2, true), rr(() => {
      __privateSet(this, _h2, false), this.flush();
    }));
  }
  transfer_effects(t, o) {
    for (const n of t) __privateGet(this, _c2).add(n);
    for (const n of o) __privateGet(this, _u2).add(n);
    t.clear(), o.clear();
  }
  oncommit(t) {
    __privateGet(this, _t).add(t);
  }
  ondiscard(t) {
    __privateGet(this, _n2).add(t);
  }
  on_fork_commit(t) {
    __privateGet(this, _e).add(t);
  }
  run_fork_commit_callbacks() {
    for (const t of __privateGet(this, _e)) t(this);
    __privateGet(this, _e).clear();
  }
  settled() {
    return (__privateGet(this, _i2) ?? __privateSet(this, _i2, Ii())).promise;
  }
  static ensure() {
    if (xe === null) {
      const t = xe = new _ir();
      bn || (fr.add(xe), rr(() => {
        xe === t && t.flush();
      }));
    }
    return xe;
  }
  apply() {
    {
      Ct = null;
      return;
    }
  }
  schedule(t) {
    var _a5;
    if (qn = t, ((_a5 = t.b) == null ? void 0 : _a5.is_pending) && (t.f & (qr | fn | Xi)) !== 0 && (t.f & Or) === 0) {
      t.b.defer_effect(t);
      return;
    }
    for (var o = t; o.parent !== null; ) {
      o = o.parent;
      var n = o.f;
      if (zr !== null && o === ve && (ge === null || (ge.f & Ne) === 0)) return;
      if ((n & (sr | kt)) !== 0) {
        if ((n & Ae) === 0) return;
        o.f ^= Ae;
      }
    }
    __privateGet(this, _r2).push(o);
  }
};
_t = new WeakMap();
_n2 = new WeakMap();
_e = new WeakMap();
_s2 = new WeakMap();
_o2 = new WeakMap();
_i2 = new WeakMap();
_r2 = new WeakMap();
_a3 = new WeakMap();
_c2 = new WeakMap();
_u2 = new WeakMap();
_l2 = new WeakMap();
_f2 = new WeakMap();
_h2 = new WeakMap();
_p2 = new WeakMap();
_ir_instances = new WeakSet();
d_fn = function() {
  return this.is_fork || __privateGet(this, _o2).size > 0;
};
m_fn = function() {
  for (const n of __privateGet(this, _p2)) for (const s of __privateGet(n, _o2).keys()) {
    for (var t = false, o = s; o.parent !== null; ) {
      if (__privateGet(this, _l2).has(o)) {
        t = true;
        break;
      }
      o = o.parent;
    }
    if (!t) return true;
  }
  return false;
};
v_fn = function() {
  var _a5, _b2;
  if ($s++ > 1e3 && (fr.delete(this), pc()), !__privateMethod(this, _ir_instances, d_fn).call(this)) {
    for (const c of __privateGet(this, _c2)) __privateGet(this, _u2).delete(c), Te(c, $e), this.schedule(c);
    for (const c of __privateGet(this, _u2)) Te(c, It), this.schedule(c);
  }
  const t = __privateGet(this, _r2);
  __privateSet(this, _r2, []), this.apply();
  var o = zr = [], n = [], s = Uo = [];
  for (const c of t) try {
    __privateMethod(this, _ir_instances, g_fn).call(this, c, o, n);
  } catch (u) {
    throw Gi(c), u;
  }
  if (xe = null, s.length > 0) {
    var a = _ir.ensure();
    for (const c of s) a.schedule(c);
  }
  if (zr = null, Uo = null, __privateMethod(this, _ir_instances, d_fn).call(this) || __privateMethod(this, _ir_instances, m_fn).call(this)) {
    __privateMethod(this, _ir_instances, y_fn).call(this, n), __privateMethod(this, _ir_instances, y_fn).call(this, o);
    for (const [c, u] of __privateGet(this, _l2)) $i(c, u);
  } else {
    __privateGet(this, _s2).size === 0 && fr.delete(this), __privateGet(this, _c2).clear(), __privateGet(this, _u2).clear();
    for (const c of __privateGet(this, _t)) c(this);
    __privateGet(this, _t).clear(), Gs(n), Gs(o), (_a5 = __privateGet(this, _i2)) == null ? void 0 : _a5.resolve();
  }
  var l = xe;
  if (__privateGet(this, _r2).length > 0) {
    const c = l ?? (l = this);
    __privateGet(c, _r2).push(...__privateGet(this, _r2).filter((u) => !__privateGet(c, _r2).includes(u)));
  }
  l !== null && (fr.add(l), __privateMethod(_b2 = l, _ir_instances, v_fn).call(_b2));
};
g_fn = function(t, o, n) {
  t.f ^= Ae;
  for (var s = t.first; s !== null; ) {
    var a = s.f, l = (a & (kt | sr)) !== 0, c = l && (a & Ae) !== 0, u = c || (a & je) !== 0 || __privateGet(this, _l2).has(s);
    if (!u && s.fn !== null) {
      l ? s.f ^= Ae : (a & qr) !== 0 ? o.push(s) : wo(s) && ((a & Tt) !== 0 && __privateGet(this, _u2).add(s), Nr(s));
      var d = s.first;
      if (d !== null) {
        s = d;
        continue;
      }
    }
    for (; s !== null; ) {
      var f = s.next;
      if (f !== null) {
        s = f;
        break;
      }
      s = s.parent;
    }
  }
};
y_fn = function(t) {
  for (var o = 0; o < t.length; o += 1) Di(t[o], __privateGet(this, _c2), __privateGet(this, _u2));
};
b_fn = function() {
  var _a5, _b2, _c5;
  for (const f of fr) {
    var t = f.id < this.id, o = [];
    for (const [p, [h, y]] of this.current) {
      if (f.current.has(p)) {
        var n = f.current.get(p)[0];
        if (t && h !== n) f.current.set(p, [h, y]);
        else continue;
      }
      o.push(p);
    }
    var s = [...f.current.keys()].filter((p) => !this.current.has(p));
    if (s.length === 0) t && f.discard();
    else if (o.length > 0) {
      if (t) for (const p of __privateGet(this, _f2)) f.unskip_effect(p, (h) => {
        var _a6;
        (h.f & (Tt | ho)) !== 0 ? f.schedule(h) : __privateMethod(_a6 = f, _ir_instances, y_fn).call(_a6, [h]);
      });
      f.activate();
      var a = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
      for (var c of o) Vi(c, s, a, l);
      l = /* @__PURE__ */ new Map();
      var u = [...f.current.keys()].filter((p) => this.current.has(p) ? this.current.get(p)[0] !== p : true);
      for (const p of __privateGet(this, _a3)) (p.f & (dt | je | $n)) === 0 && us(p, u, l) && ((p.f & (ho | Tt)) !== 0 ? (Te(p, $e), f.schedule(p)) : __privateGet(f, _c2).add(p));
      if (__privateGet(f, _r2).length > 0) {
        f.apply();
        for (var d of __privateGet(f, _r2)) __privateMethod(_a5 = f, _ir_instances, g_fn).call(_a5, d, [], []);
        __privateSet(f, _r2, []);
      }
      f.deactivate();
    }
  }
  for (const f of fr) __privateGet(f, _p2).has(this) && (__privateGet(f, _p2).delete(this), __privateGet(f, _p2).size === 0 && !__privateMethod(_b2 = f, _ir_instances, d_fn).call(_b2) && (f.activate(), __privateMethod(_c5 = f, _ir_instances, v_fn).call(_c5)));
};
let ir = _ir;
function pc() {
  try {
    Dl();
  } catch (e) {
    Qt(e, qn);
  }
}
let Rt = null;
function Gs(e) {
  var t = e.length;
  if (t !== 0) {
    for (var o = 0; o < t; ) {
      var n = e[o++];
      if ((n.f & (dt | je)) === 0 && wo(n) && (Rt = /* @__PURE__ */ new Set(), Nr(n), n.deps === null && n.first === null && n.nodes === null && n.teardown === null && n.ac === null && sa(n), (Rt == null ? void 0 : Rt.size) > 0)) {
        xr.clear();
        for (const s of Rt) {
          if ((s.f & (dt | je)) !== 0) continue;
          const a = [s];
          let l = s.parent;
          for (; l !== null; ) Rt.has(l) && (Rt.delete(l), a.push(l)), l = l.parent;
          for (let c = a.length - 1; c >= 0; c--) {
            const u = a[c];
            (u.f & (dt | je)) === 0 && Nr(u);
          }
        }
        Rt.clear();
      }
    }
    Rt = null;
  }
}
function Vi(e, t, o, n) {
  if (!o.has(e) && (o.add(e), e.reactions !== null)) for (const s of e.reactions) {
    const a = s.f;
    (a & Ne) !== 0 ? Vi(s, t, o, n) : (a & (ho | Tt)) !== 0 && (a & $e) === 0 && us(s, t, n) && (Te(s, $e), ds(s));
  }
}
function us(e, t, o) {
  const n = o.get(e);
  if (n !== void 0) return n;
  if (e.deps !== null) for (const s of e.deps) {
    if (Gr.call(t, s)) return true;
    if ((s.f & Ne) !== 0 && us(s, t, o)) return o.set(s, true), true;
  }
  return o.set(e, false), false;
}
function ds(e) {
  xe.schedule(e);
}
function $i(e, t) {
  if (!((e.f & kt) !== 0 && (e.f & Ae) !== 0)) {
    (e.f & $e) !== 0 ? t.d.push(e) : (e.f & It) !== 0 && t.m.push(e), Te(e, Ae);
    for (var o = e.first; o !== null; ) $i(o, t), o = o.next;
  }
}
function Gi(e) {
  Te(e, Ae);
  for (var t = e.first; t !== null; ) Gi(t), t = t.next;
}
function hc(e) {
  let t = 0, o = ar(0), n;
  return () => {
    vs() && (m(o), ys(() => (t === 0 && (n = Mo(() => e(() => or(o)))), t += 1, () => {
      rr(() => {
        t -= 1, t === 0 && (n == null ? void 0 : n(), n = void 0, or(o));
      });
    })));
  };
}
var vc = wr | Jr;
function yc(e, t, o, n) {
  new mc(e, t, o, n);
}
class mc {
  constructor(t, o, n, s) {
    __privateAdd(this, _mc_instances);
    __publicField(this, "parent");
    __publicField(this, "is_pending", false);
    __publicField(this, "transform_error");
    __privateAdd(this, _t2);
    __privateAdd(this, _n3, null);
    __privateAdd(this, _e2);
    __privateAdd(this, _s3);
    __privateAdd(this, _o3);
    __privateAdd(this, _i3, null);
    __privateAdd(this, _r3, null);
    __privateAdd(this, _a4, null);
    __privateAdd(this, _c3, null);
    __privateAdd(this, _u3, 0);
    __privateAdd(this, _l3, 0);
    __privateAdd(this, _f3, false);
    __privateAdd(this, _h3, /* @__PURE__ */ new Set());
    __privateAdd(this, _p3, /* @__PURE__ */ new Set());
    __privateAdd(this, _d2, null);
    __privateAdd(this, _m2, hc(() => (__privateSet(this, _d2, ar(__privateGet(this, _u3))), () => {
      __privateSet(this, _d2, null);
    })));
    var _a5;
    __privateSet(this, _t2, t), __privateSet(this, _e2, o), __privateSet(this, _s3, (a) => {
      var l = ve;
      l.b = this, l.f |= Dn, n(a);
    }), this.parent = ve.b, this.transform_error = s ?? ((_a5 = this.parent) == null ? void 0 : _a5.transform_error) ?? ((a) => a), __privateSet(this, _o3, Co(() => {
      __privateMethod(this, _mc_instances, b_fn2).call(this);
    }, vc));
  }
  defer_effect(t) {
    Di(t, __privateGet(this, _h3), __privateGet(this, _p3));
  }
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!__privateGet(this, _e2).pending;
  }
  update_pending_count(t, o) {
    __privateMethod(this, _mc_instances, C_fn).call(this, t, o), __privateSet(this, _u3, __privateGet(this, _u3) + t), !(!__privateGet(this, _d2) || __privateGet(this, _f3)) && (__privateSet(this, _f3, true), rr(() => {
      __privateSet(this, _f3, false), __privateGet(this, _d2) && Hr(__privateGet(this, _d2), __privateGet(this, _u3));
    }));
  }
  get_effect_pending() {
    return __privateGet(this, _m2).call(this), m(__privateGet(this, _d2));
  }
  error(t) {
    if (!__privateGet(this, _e2).onerror && !__privateGet(this, _e2).failed) throw t;
    (xe == null ? void 0 : xe.is_fork) ? (__privateGet(this, _i3) && xe.skip_effect(__privateGet(this, _i3)), __privateGet(this, _r3) && xe.skip_effect(__privateGet(this, _r3)), __privateGet(this, _a4) && xe.skip_effect(__privateGet(this, _a4)), xe.on_fork_commit(() => {
      __privateMethod(this, _mc_instances, w_fn).call(this, t);
    })) : __privateMethod(this, _mc_instances, w_fn).call(this, t);
  }
}
_t2 = new WeakMap();
_n3 = new WeakMap();
_e2 = new WeakMap();
_s3 = new WeakMap();
_o3 = new WeakMap();
_i3 = new WeakMap();
_r3 = new WeakMap();
_a4 = new WeakMap();
_c3 = new WeakMap();
_u3 = new WeakMap();
_l3 = new WeakMap();
_f3 = new WeakMap();
_h3 = new WeakMap();
_p3 = new WeakMap();
_d2 = new WeakMap();
_m2 = new WeakMap();
_mc_instances = new WeakSet();
v_fn2 = function() {
  try {
    __privateSet(this, _i3, vt(() => __privateGet(this, _s3).call(this, __privateGet(this, _t2))));
  } catch (t) {
    this.error(t);
  }
};
g_fn2 = function(t) {
  const o = __privateGet(this, _e2).failed;
  o && __privateSet(this, _a4, vt(() => {
    o(__privateGet(this, _t2), () => t, () => () => {
    });
  }));
};
y_fn2 = function() {
  const t = __privateGet(this, _e2).pending;
  t && (this.is_pending = true, __privateSet(this, _r3, vt(() => t(__privateGet(this, _t2)))), rr(() => {
    var o = __privateSet(this, _c3, document.createDocumentFragment()), n = nr();
    o.append(n), __privateSet(this, _i3, __privateMethod(this, _mc_instances, S_fn).call(this, () => vt(() => __privateGet(this, _s3).call(this, n)))), __privateGet(this, _l3) === 0 && (__privateGet(this, _t2).before(o), __privateSet(this, _c3, null), Sr(__privateGet(this, _r3), () => {
      __privateSet(this, _r3, null);
    }), __privateMethod(this, _mc_instances, x_fn).call(this, xe));
  }));
};
b_fn2 = function() {
  try {
    if (this.is_pending = this.has_pending_snippet(), __privateSet(this, _l3, 0), __privateSet(this, _u3, 0), __privateSet(this, _i3, vt(() => {
      __privateGet(this, _s3).call(this, __privateGet(this, _t2));
    })), __privateGet(this, _l3) > 0) {
      var t = __privateSet(this, _c3, document.createDocumentFragment());
      bs(__privateGet(this, _i3), t);
      const o = __privateGet(this, _e2).pending;
      __privateSet(this, _r3, vt(() => o(__privateGet(this, _t2))));
    } else __privateMethod(this, _mc_instances, x_fn).call(this, xe);
  } catch (o) {
    this.error(o);
  }
};
x_fn = function(t) {
  this.is_pending = false, t.transfer_effects(__privateGet(this, _h3), __privateGet(this, _p3));
};
S_fn = function(t) {
  var o = ve, n = ge, s = Ie;
  Et(__privateGet(this, _o3)), bt(__privateGet(this, _o3)), Ur(__privateGet(this, _o3).ctx);
  try {
    return ir.ensure(), t();
  } catch (a) {
    return Ri(a), null;
  } finally {
    Et(o), bt(n), Ur(s);
  }
};
C_fn = function(t, o) {
  var _a5;
  if (!this.has_pending_snippet()) {
    this.parent && __privateMethod(_a5 = this.parent, _mc_instances, C_fn).call(_a5, t, o);
    return;
  }
  __privateSet(this, _l3, __privateGet(this, _l3) + t), __privateGet(this, _l3) === 0 && (__privateMethod(this, _mc_instances, x_fn).call(this, o), __privateGet(this, _r3) && Sr(__privateGet(this, _r3), () => {
    __privateSet(this, _r3, null);
  }), __privateGet(this, _c3) && (__privateGet(this, _t2).before(__privateGet(this, _c3)), __privateSet(this, _c3, null)));
};
w_fn = function(t) {
  __privateGet(this, _i3) && (nt(__privateGet(this, _i3)), __privateSet(this, _i3, null)), __privateGet(this, _r3) && (nt(__privateGet(this, _r3)), __privateSet(this, _r3, null)), __privateGet(this, _a4) && (nt(__privateGet(this, _a4)), __privateSet(this, _a4, null));
  var o = __privateGet(this, _e2).onerror;
  let n = __privateGet(this, _e2).failed;
  var s = false, a = false;
  const l = () => {
    if (s) {
      ic();
      return;
    }
    s = true, a && Ul(), __privateGet(this, _a4) !== null && Sr(__privateGet(this, _a4), () => {
      __privateSet(this, _a4, null);
    }), __privateMethod(this, _mc_instances, S_fn).call(this, () => {
      __privateMethod(this, _mc_instances, b_fn2).call(this);
    });
  }, c = (u) => {
    try {
      a = true, o == null ? void 0 : o(u, l), a = false;
    } catch (d) {
      Qt(d, __privateGet(this, _o3) && __privateGet(this, _o3).parent);
    }
    n && __privateSet(this, _a4, __privateMethod(this, _mc_instances, S_fn).call(this, () => {
      try {
        return vt(() => {
          var d = ve;
          d.b = this, d.f |= Dn, n(__privateGet(this, _t2), () => u, () => l);
        });
      } catch (d) {
        return Qt(d, __privateGet(this, _o3).parent), null;
      }
    }));
  };
  rr(() => {
    var u;
    try {
      u = this.transform_error(t);
    } catch (d) {
      Qt(d, __privateGet(this, _o3) && __privateGet(this, _o3).parent);
      return;
    }
    u !== null && typeof u == "object" && typeof u.then == "function" ? u.then(c, (d) => Qt(d, __privateGet(this, _o3) && __privateGet(this, _o3).parent)) : c(u);
  });
};
function gc(e, t, o, n) {
  const s = Qr() ? pn : fs;
  var a = e.filter((h) => !h.settled);
  if (o.length === 0 && a.length === 0) {
    n(t.map(s));
    return;
  }
  var l = ve, c = bc(), u = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((h) => h.promise)) : null;
  function d(h) {
    c();
    try {
      n(h);
    } catch (y) {
      (l.f & dt) === 0 && Qt(y, l);
    }
    tn();
  }
  if (o.length === 0) {
    u.then(() => d(t.map(s)));
    return;
  }
  var f = qi();
  function p() {
    Promise.all(o.map((h) => xc(h))).then((h) => d([...t.map(s), ...h])).catch((h) => Qt(h, l)).finally(() => f());
  }
  u ? u.then(() => {
    c(), p(), tn();
  }) : p();
}
function bc() {
  var e = ve, t = ge, o = Ie, n = xe;
  return function(a = true) {
    Et(e), bt(t), Ur(o), a && (e.f & dt) === 0 && (n == null ? void 0 : n.activate(), n == null ? void 0 : n.apply());
  };
}
function tn(e = true) {
  Et(null), bt(null), Ur(null), e && (xe == null ? void 0 : xe.deactivate());
}
function qi() {
  var e = ve, t = e.b, o = xe, n = t.is_rendered();
  return t.update_pending_count(1, o), o.increment(n, e), (s = false) => {
    t.update_pending_count(-1, o), o.decrement(n, e, s);
  };
}
function pn(e) {
  var t = Ne | $e;
  return ve !== null && (ve.f |= Jr), { ctx: Ie, deps: null, effects: null, equals: zi, f: t, fn: e, reactions: null, rv: 0, v: Re, wv: 0, parent: ve, ac: null };
}
function xc(e, t, o) {
  let n = ve;
  n === null && zl();
  var s = void 0, a = ar(Re), l = !ge, c = /* @__PURE__ */ new Map();
  return Tc(() => {
    var _a5;
    var u = ve, d = Ii();
    s = d.promise;
    try {
      Promise.resolve(e()).then(d.resolve, d.reject).finally(tn);
    } catch (y) {
      d.reject(y), tn();
    }
    var f = xe;
    if (l) {
      if ((u.f & Or) !== 0) var p = qi();
      if (n.b.is_rendered()) (_a5 = c.get(f)) == null ? void 0 : _a5.reject(Kt), c.delete(f);
      else {
        for (const y of c.values()) y.reject(Kt);
        c.clear();
      }
      c.set(f, d);
    }
    const h = (y, v = void 0) => {
      if (p) {
        var g = v === Kt;
        p(g);
      }
      if (!(v === Kt || (u.f & dt) !== 0)) {
        if (f.activate(), v) a.f |= tr, Hr(a, v);
        else {
          (a.f & tr) !== 0 && (a.f ^= tr), Hr(a, y);
          for (const [x, b] of c) {
            if (c.delete(x), x === f) break;
            b.reject(Kt);
          }
        }
        f.deactivate();
      }
    };
    d.promise.then(h, (y) => h(null, y || "unknown"));
  }), ea(() => {
    for (const u of c.values()) u.reject(Kt);
  }), new Promise((u) => {
    function d(f) {
      function p() {
        f === s ? u(a) : d(s);
      }
      f.then(p, p);
    }
    d(s);
  });
}
function R(e) {
  const t = pn(e);
  return la(t), t;
}
function fs(e) {
  const t = pn(e);
  return t.equals = Ai, t;
}
function Sc(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var o = 0; o < t.length; o += 1) nt(t[o]);
  }
}
function ps(e) {
  var t, o = ve, n = e.parent;
  if (!Gt && n !== null && (n.f & (dt | je)) !== 0) return sc(), e.v;
  Et(n);
  try {
    e.f &= ~Mr, Sc(e), t = fa(e);
  } finally {
    Et(o);
  }
  return t;
}
function Ui(e) {
  var t = ps(e);
  if (!e.equals(t) && (e.wv = ua(), (!(xe == null ? void 0 : xe.is_fork) || e.deps === null) && (xe !== null ? xe.capture(e, t, true) : e.v = t, e.deps === null))) {
    Te(e, Ae);
    return;
  }
  Gt || (Ct !== null ? (vs() || (xe == null ? void 0 : xe.is_fork)) && Ct.set(e, t) : cs(e));
}
function Cc(e) {
  var _a5, _b2;
  if (e.effects !== null) for (const t of e.effects) (t.teardown || t.ac) && ((_a5 = t.teardown) == null ? void 0 : _a5.call(t), (_b2 = t.ac) == null ? void 0 : _b2.abort(Kt), t.teardown = Ti, t.ac = null, vo(t, 0), ms(t));
}
function Hi(e) {
  if (e.effects !== null) for (const t of e.effects) t.teardown && Nr(t);
}
let Un = /* @__PURE__ */ new Set();
const xr = /* @__PURE__ */ new Map();
let Ni = false;
function ar(e, t) {
  var o = { f: 0, v: e, reactions: null, equals: zi, rv: 0, wv: 0 };
  return o;
}
function se(e, t) {
  const o = ar(e);
  return la(o), o;
}
function wc(e, t = false, o = true) {
  var _a5;
  const n = ar(e);
  return t || (n.equals = Ai), Zr && o && Ie !== null && Ie.l !== null && ((_a5 = Ie.l).s ?? (_a5.s = [])).push(n), n;
}
function N(e, t, o = false) {
  ge !== null && (!wt || (ge.f & $n) !== 0) && Qr() && (ge.f & (Ne | Tt | ho | $n)) !== 0 && (mt === null || !Gr.call(mt, e)) && ql();
  let n = o ? Me(t) : t;
  return Hr(e, n, Uo);
}
function Hr(e, t, o = null) {
  if (!e.equals(t)) {
    xr.set(e, Gt ? t : e.v);
    var n = ir.ensure();
    if (n.capture(e, t), (e.f & Ne) !== 0) {
      const s = e;
      (e.f & $e) !== 0 && ps(s), Ct === null && cs(s);
    }
    e.wv = ua(), Wi(e, $e, o), Qr() && ve !== null && (ve.f & Ae) !== 0 && (ve.f & (kt | sr)) === 0 && (ht === null ? Xc([e]) : ht.push(e)), !n.is_fork && Un.size > 0 && !Ni && Mc();
  }
  return t;
}
function Mc() {
  Ni = false;
  for (const e of Un) (e.f & Ae) !== 0 && Te(e, It), wo(e) && Nr(e);
  Un.clear();
}
function or(e) {
  N(e, e.v + 1);
}
function Wi(e, t, o) {
  var n = e.reactions;
  if (n !== null) for (var s = Qr(), a = n.length, l = 0; l < a; l++) {
    var c = n[l], u = c.f;
    if (!(!s && c === ve)) {
      var d = (u & $e) === 0;
      if (d && Te(c, t), (u & Ne) !== 0) {
        var f = c;
        Ct == null ? void 0 : Ct.delete(f), (u & Mr) === 0 && (u & yt && (c.f |= Mr), Wi(f, It, o));
      } else if (d) {
        var p = c;
        (u & Tt) !== 0 && Rt !== null && Rt.add(p), o !== null ? o.push(p) : ds(p);
      }
    }
  }
}
function Me(e) {
  if (typeof e != "object" || e === null || br in e) return e;
  const t = as(e);
  if (t !== Pl && t !== _l) return e;
  var o = /* @__PURE__ */ new Map(), n = Oi(e), s = se(0), a = $t, l = (c) => {
    if ($t === a) return c();
    var u = ge, d = $t;
    bt(null), Hs(a);
    var f = c();
    return bt(u), Hs(d), f;
  };
  return n && o.set("length", se(e.length)), new Proxy(e, { defineProperty(c, u, d) {
    (!("value" in d) || d.configurable === false || d.enumerable === false || d.writable === false) && $l();
    var f = o.get(u);
    return f === void 0 ? l(() => {
      var p = se(d.value);
      return o.set(u, p), p;
    }) : N(f, d.value, true), true;
  }, deleteProperty(c, u) {
    var d = o.get(u);
    if (d === void 0) {
      if (u in c) {
        const f = l(() => se(Re));
        o.set(u, f), or(s);
      }
    } else N(d, Re), or(s);
    return true;
  }, get(c, u, d) {
    var _a5;
    if (u === br) return e;
    var f = o.get(u), p = u in c;
    if (f === void 0 && (!p || ((_a5 = Rr(c, u)) == null ? void 0 : _a5.writable)) && (f = l(() => {
      var y = Me(p ? c[u] : Re), v = se(y);
      return v;
    }), o.set(u, f)), f !== void 0) {
      var h = m(f);
      return h === Re ? void 0 : h;
    }
    return Reflect.get(c, u, d);
  }, getOwnPropertyDescriptor(c, u) {
    var d = Reflect.getOwnPropertyDescriptor(c, u);
    if (d && "value" in d) {
      var f = o.get(u);
      f && (d.value = m(f));
    } else if (d === void 0) {
      var p = o.get(u), h = p == null ? void 0 : p.v;
      if (p !== void 0 && h !== Re) return { enumerable: true, configurable: true, value: h, writable: true };
    }
    return d;
  }, has(c, u) {
    var _a5;
    if (u === br) return true;
    var d = o.get(u), f = d !== void 0 && d.v !== Re || Reflect.has(c, u);
    if (d !== void 0 || ve !== null && (!f || ((_a5 = Rr(c, u)) == null ? void 0 : _a5.writable))) {
      d === void 0 && (d = l(() => {
        var h = f ? Me(c[u]) : Re, y = se(h);
        return y;
      }), o.set(u, d));
      var p = m(d);
      if (p === Re) return false;
    }
    return f;
  }, set(c, u, d, f) {
    var _a5;
    var p = o.get(u), h = u in c;
    if (n && u === "length") for (var y = d; y < p.v; y += 1) {
      var v = o.get(y + "");
      v !== void 0 ? N(v, Re) : y in c && (v = l(() => se(Re)), o.set(y + "", v));
    }
    if (p === void 0) (!h || ((_a5 = Rr(c, u)) == null ? void 0 : _a5.writable)) && (p = l(() => se(void 0)), N(p, Me(d)), o.set(u, p));
    else {
      h = p.v !== Re;
      var g = l(() => Me(d));
      N(p, g);
    }
    var x = Reflect.getOwnPropertyDescriptor(c, u);
    if ((x == null ? void 0 : x.set) && x.set.call(f, d), !h) {
      if (n && typeof u == "string") {
        var b = o.get("length"), O = Number(u);
        Number.isInteger(O) && O >= b.v && N(b, O + 1);
      }
      or(s);
    }
    return true;
  }, ownKeys(c) {
    m(s);
    var u = Reflect.ownKeys(c).filter((p) => {
      var h = o.get(p);
      return h === void 0 || h.v !== Re;
    });
    for (var [d, f] of o) f.v !== Re && !(d in c) && u.push(d);
    return u;
  }, setPrototypeOf() {
    Gl();
  } });
}
var qs, ji, Fi, Ji;
function kc() {
  if (qs === void 0) {
    qs = window, ji = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, o = Text.prototype;
    Fi = Rr(t, "firstChild").get, Ji = Rr(t, "nextSibling").get, Vs(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Vs(o) && (o.__t = void 0);
  }
}
function nr(e = "") {
  return document.createTextNode(e);
}
function Lt(e) {
  return Fi.call(e);
}
function So(e) {
  return Ji.call(e);
}
function z(e, t) {
  return Lt(e);
}
function Ve(e, t = false) {
  {
    var o = Lt(e);
    return o instanceof Comment && o.data === "" ? So(o) : o;
  }
}
function X(e, t = 1, o = false) {
  let n = e;
  for (; t--; ) n = So(n);
  return n;
}
function Pc(e) {
  e.textContent = "";
}
function Zi() {
  return false;
}
function Qi(e, t, o) {
  return document.createElementNS(t ?? Bi, e, void 0);
}
function hs(e) {
  var t = ge, o = ve;
  bt(null), Et(null);
  try {
    return e();
  } finally {
    bt(t), Et(o);
  }
}
function _c(e) {
  ve === null && (ge === null && Kl(), Rl()), Gt && Al();
}
function Oc(e, t) {
  var o = t.last;
  o === null ? t.last = t.first = e : (o.next = e, e.prev = o, t.last = e);
}
function Nt(e, t) {
  var o = ve;
  o !== null && (o.f & je) !== 0 && (e |= je);
  var n = { ctx: Ie, deps: null, nodes: null, f: e | $e | yt, first: null, fn: t, last: null, next: null, parent: o, b: o && o.b, prev: null, teardown: null, wv: 0, ac: null };
  xe == null ? void 0 : xe.register_created_effect(n);
  var s = n;
  if ((e & qr) !== 0) zr !== null ? zr.push(n) : ir.ensure().schedule(n);
  else if (t !== null) {
    try {
      Nr(n);
    } catch (l) {
      throw nt(n), l;
    }
    s.deps === null && s.teardown === null && s.nodes === null && s.first === s.last && (s.f & Jr) === 0 && (s = s.first, (e & Tt) !== 0 && (e & wr) !== 0 && s !== null && (s.f |= wr));
  }
  if (s !== null && (s.parent = o, o !== null && Oc(s, o), ge !== null && (ge.f & Ne) !== 0 && (e & sr) === 0)) {
    var a = ge;
    (a.effects ?? (a.effects = [])).push(s);
  }
  return n;
}
function vs() {
  return ge !== null && !wt;
}
function ea(e) {
  const t = Nt(fn, null);
  return Te(t, Ae), t.teardown = e, t;
}
function Xt(e) {
  _c();
  var t = ve.f, o = !ge && (t & kt) !== 0 && (t & Or) === 0;
  if (o) {
    var n = Ie;
    (n.e ?? (n.e = [])).push(e);
  } else return ta(e);
}
function ta(e) {
  return Nt(qr | Tl, e);
}
function Lc(e) {
  ir.ensure();
  const t = Nt(sr | Jr, e);
  return (o = {}) => new Promise((n) => {
    o.outro ? Sr(t, () => {
      nt(t), n(void 0);
    }) : (nt(t), n(void 0));
  });
}
function ra(e) {
  return Nt(qr, e);
}
function Tc(e) {
  return Nt(ho | Jr, e);
}
function ys(e, t = 0) {
  return Nt(fn | t, e);
}
function pe(e, t = [], o = [], n = []) {
  gc(n, t, o, (s) => {
    Nt(fn, () => e(...s.map(m)));
  });
}
function Co(e, t = 0) {
  var o = Nt(Tt | t, e);
  return o;
}
function vt(e) {
  return Nt(kt | Jr, e);
}
function oa(e) {
  var t = e.teardown;
  if (t !== null) {
    const o = Gt, n = ge;
    Us(true), bt(null);
    try {
      t.call(null);
    } finally {
      Us(o), bt(n);
    }
  }
}
function ms(e, t = false) {
  var o = e.first;
  for (e.first = e.last = null; o !== null; ) {
    const s = o.ac;
    s !== null && hs(() => {
      s.abort(Kt);
    });
    var n = o.next;
    (o.f & sr) !== 0 ? o.parent = null : nt(o, t), o = n;
  }
}
function Ic(e) {
  for (var t = e.first; t !== null; ) {
    var o = t.next;
    (t.f & kt) === 0 && nt(t), t = o;
  }
}
function nt(e, t = true) {
  var o = false;
  (t || (e.f & Ll) !== 0) && e.nodes !== null && e.nodes.end !== null && (na(e.nodes.start, e.nodes.end), o = true), Te(e, Vn), ms(e, t && !o), vo(e, 0);
  var n = e.nodes && e.nodes.t;
  if (n !== null) for (const a of n) a.stop();
  oa(e), e.f ^= Vn, e.f |= dt;
  var s = e.parent;
  s !== null && s.first !== null && sa(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function na(e, t) {
  for (; e !== null; ) {
    var o = e === t ? null : So(e);
    e.remove(), e = o;
  }
}
function sa(e) {
  var t = e.parent, o = e.prev, n = e.next;
  o !== null && (o.next = n), n !== null && (n.prev = o), t !== null && (t.first === e && (t.first = n), t.last === e && (t.last = o));
}
function Sr(e, t, o = true) {
  var n = [];
  ia(e, n, true);
  var s = () => {
    o && nt(e), t && t();
  }, a = n.length;
  if (a > 0) {
    var l = () => --a || s();
    for (var c of n) c.out(l);
  } else s();
}
function ia(e, t, o) {
  if ((e.f & je) === 0) {
    e.f ^= je;
    var n = e.nodes && e.nodes.t;
    if (n !== null) for (const c of n) (c.is_global || o) && t.push(c);
    for (var s = e.first; s !== null; ) {
      var a = s.next;
      if ((s.f & sr) === 0) {
        var l = (s.f & wr) !== 0 || (s.f & kt) !== 0 && (e.f & Tt) !== 0;
        ia(s, t, l ? o : false);
      }
      s = a;
    }
  }
}
function gs(e) {
  aa(e, true);
}
function aa(e, t) {
  if ((e.f & je) !== 0) {
    e.f ^= je, (e.f & Ae) === 0 && (Te(e, $e), ir.ensure().schedule(e));
    for (var o = e.first; o !== null; ) {
      var n = o.next, s = (o.f & wr) !== 0 || (o.f & kt) !== 0;
      aa(o, s ? t : false), o = n;
    }
    var a = e.nodes && e.nodes.t;
    if (a !== null) for (const l of a) (l.is_global || t) && l.in();
  }
}
function bs(e, t) {
  if (e.nodes) for (var o = e.nodes.start, n = e.nodes.end; o !== null; ) {
    var s = o === n ? null : So(o);
    t.append(o), o = s;
  }
}
let Ho = false, Gt = false;
function Us(e) {
  Gt = e;
}
let ge = null, wt = false;
function bt(e) {
  ge = e;
}
let ve = null;
function Et(e) {
  ve = e;
}
let mt = null;
function la(e) {
  ge !== null && (mt === null ? mt = [e] : mt.push(e));
}
let tt = null, ct = 0, ht = null;
function Xc(e) {
  ht = e;
}
let ca = 1, yr = 0, $t = yr;
function Hs(e) {
  $t = e;
}
function ua() {
  return ++ca;
}
function wo(e) {
  var t = e.f;
  if ((t & $e) !== 0) return true;
  if (t & Ne && (e.f &= ~Mr), (t & It) !== 0) {
    for (var o = e.deps, n = o.length, s = 0; s < n; s++) {
      var a = o[s];
      if (wo(a) && Ui(a), a.wv > e.wv) return true;
    }
    (t & yt) !== 0 && Ct === null && Te(e, Ae);
  }
  return false;
}
function da(e, t, o = true) {
  var n = e.reactions;
  if (n !== null && !(mt !== null && Gr.call(mt, e))) for (var s = 0; s < n.length; s++) {
    var a = n[s];
    (a.f & Ne) !== 0 ? da(a, t, false) : t === a && (o ? Te(a, $e) : (a.f & Ae) !== 0 && Te(a, It), ds(a));
  }
}
function fa(e) {
  var _a5;
  var t = tt, o = ct, n = ht, s = ge, a = mt, l = Ie, c = wt, u = $t, d = e.f;
  tt = null, ct = 0, ht = null, ge = (d & (kt | sr)) === 0 ? e : null, mt = null, Ur(e.ctx), wt = false, $t = ++yr, e.ac !== null && (hs(() => {
    e.ac.abort(Kt);
  }), e.ac = null);
  try {
    e.f |= Gn;
    var f = e.fn, p = f();
    e.f |= Or;
    var h = e.deps, y = xe == null ? void 0 : xe.is_fork;
    if (tt !== null) {
      var v;
      if (y || vo(e, ct), h !== null && ct > 0) for (h.length = ct + tt.length, v = 0; v < tt.length; v++) h[ct + v] = tt[v];
      else e.deps = h = tt;
      if (vs() && (e.f & yt) !== 0) for (v = ct; v < h.length; v++) ((_a5 = h[v]).reactions ?? (_a5.reactions = [])).push(e);
    } else !y && h !== null && ct < h.length && (vo(e, ct), h.length = ct);
    if (Qr() && ht !== null && !wt && h !== null && (e.f & (Ne | It | $e)) === 0) for (v = 0; v < ht.length; v++) da(ht[v], e);
    if (s !== null && s !== e) {
      if (yr++, s.deps !== null) for (let g = 0; g < o; g += 1) s.deps[g].rv = yr;
      if (t !== null) for (const g of t) g.rv = yr;
      ht !== null && (n === null ? n = ht : n.push(...ht));
    }
    return (e.f & tr) !== 0 && (e.f ^= tr), p;
  } catch (g) {
    return Ri(g);
  } finally {
    e.f ^= Gn, tt = t, ct = o, ht = n, ge = s, mt = a, Ur(l), wt = c, $t = u;
  }
}
function Ec(e, t) {
  let o = t.reactions;
  if (o !== null) {
    var n = Ml.call(o, e);
    if (n !== -1) {
      var s = o.length - 1;
      s === 0 ? o = t.reactions = null : (o[n] = o[s], o.pop());
    }
  }
  if (o === null && (t.f & Ne) !== 0 && (tt === null || !Gr.call(tt, t))) {
    var a = t;
    (a.f & yt) !== 0 && (a.f ^= yt, a.f &= ~Mr), a.v !== Re && cs(a), Cc(a), vo(a, 0);
  }
}
function vo(e, t) {
  var o = e.deps;
  if (o !== null) for (var n = t; n < o.length; n++) Ec(e, o[n]);
}
function Nr(e) {
  var t = e.f;
  if ((t & dt) === 0) {
    Te(e, Ae);
    var o = ve, n = Ho;
    ve = e, Ho = true;
    try {
      (t & (Tt | Xi)) !== 0 ? Ic(e) : ms(e), oa(e);
      var s = fa(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = ca;
      var a;
      wl && ac && (e.f & $e) !== 0 && e.deps;
    } finally {
      Ho = n, ve = o;
    }
  }
}
function m(e) {
  var t = e.f, o = (t & Ne) !== 0;
  if (ge !== null && !wt) {
    var n = ve !== null && (ve.f & dt) !== 0;
    if (!n && (mt === null || !Gr.call(mt, e))) {
      var s = ge.deps;
      if ((ge.f & Gn) !== 0) e.rv < yr && (e.rv = yr, tt === null && s !== null && s[ct] === e ? ct++ : tt === null ? tt = [e] : tt.push(e));
      else {
        (ge.deps ?? (ge.deps = [])).push(e);
        var a = e.reactions;
        a === null ? e.reactions = [ge] : Gr.call(a, ge) || a.push(ge);
      }
    }
  }
  if (Gt && xr.has(e)) return xr.get(e);
  if (o) {
    var l = e;
    if (Gt) {
      var c = l.v;
      return ((l.f & Ae) === 0 && l.reactions !== null || ha(l)) && (c = ps(l)), xr.set(l, c), c;
    }
    var u = (l.f & yt) === 0 && !wt && ge !== null && (Ho || (ge.f & yt) !== 0), d = (l.f & Or) === 0;
    wo(l) && (u && (l.f |= yt), Ui(l)), u && !d && (Hi(l), pa(l));
  }
  if (Ct == null ? void 0 : Ct.has(e)) return Ct.get(e);
  if ((e.f & tr) !== 0) throw e.v;
  return e.v;
}
function pa(e) {
  if (e.f |= yt, e.deps !== null) for (const t of e.deps) (t.reactions ?? (t.reactions = [])).push(e), (t.f & Ne) !== 0 && (t.f & yt) === 0 && (Hi(t), pa(t));
}
function ha(e) {
  if (e.v === Re) return true;
  if (e.deps === null) return false;
  for (const t of e.deps) if (xr.has(t) || (t.f & Ne) !== 0 && ha(t)) return true;
  return false;
}
function Mo(e) {
  var t = wt;
  try {
    return wt = true, e();
  } finally {
    wt = t;
  }
}
function Bc(e) {
  if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
    if (br in e) Hn(e);
    else if (!Array.isArray(e)) for (let t in e) {
      const o = e[t];
      typeof o == "object" && o && br in o && Hn(o);
    }
  }
}
function Hn(e, t = /* @__PURE__ */ new Set()) {
  if (typeof e == "object" && e !== null && !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let n in e) try {
      Hn(e[n], t);
    } catch {
    }
    const o = as(e);
    if (o !== Object.prototype && o !== Array.prototype && o !== Map.prototype && o !== Set.prototype && o !== Date.prototype) {
      const n = Li(o);
      for (let s in n) {
        const a = n[s].get;
        if (a) try {
          a.call(e);
        } catch {
        }
      }
    }
  }
}
const zc = ["touchstart", "touchmove"];
function Yc(e) {
  return zc.includes(e);
}
const oo = Symbol("events"), va = /* @__PURE__ */ new Set(), Nn = /* @__PURE__ */ new Set();
function Ac(e, t, o, n = {}) {
  function s(a) {
    if (n.capture || Wn.call(t, a), !a.cancelBubble) return hs(() => o == null ? void 0 : o.call(this, a));
  }
  return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? rr(() => {
    t.addEventListener(e, s, n);
  }) : t.addEventListener(e, s, n), s;
}
function St(e, t, o, n, s) {
  var a = { capture: n, passive: s }, l = Ac(e, t, o, a);
  (t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && ea(() => {
    t.removeEventListener(e, l, a);
  });
}
function Y(e, t, o) {
  (t[oo] ?? (t[oo] = {}))[e] = o;
}
function ze(e) {
  for (var t = 0; t < e.length; t++) va.add(e[t]);
  for (var o of Nn) o(e);
}
let Ns = null;
function Wn(e) {
  var _a5, _b2;
  var t = this, o = t.ownerDocument, n = e.type, s = ((_a5 = e.composedPath) == null ? void 0 : _a5.call(e)) || [], a = s[0] || e.target;
  Ns = e;
  var l = 0, c = Ns === e && e[oo];
  if (c) {
    var u = s.indexOf(c);
    if (u !== -1 && (t === document || t === window)) {
      e[oo] = t;
      return;
    }
    var d = s.indexOf(t);
    if (d === -1) return;
    u <= d && (l = u);
  }
  if (a = s[l] || e.target, a !== t) {
    kl(e, "currentTarget", { configurable: true, get() {
      return a || o;
    } });
    var f = ge, p = ve;
    bt(null), Et(null);
    try {
      for (var h, y = []; a !== null; ) {
        var v = a.assignedSlot || a.parentNode || a.host || null;
        try {
          var g = (_b2 = a[oo]) == null ? void 0 : _b2[n];
          g != null && (!a.disabled || e.target === a) && g.call(a, e);
        } catch (x) {
          h ? y.push(x) : h = x;
        }
        if (e.cancelBubble || v === t || v === null) break;
        a = v;
      }
      if (h) {
        for (let x of y) queueMicrotask(() => {
          throw x;
        });
        throw h;
      }
    } finally {
      e[oo] = t, delete e.currentTarget, bt(f), Et(p);
    }
  }
}
const Rc = ((_b = globalThis == null ? void 0 : globalThis.window) == null ? void 0 : _b.trustedTypes) && globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function Kc(e) {
  return (Rc == null ? void 0 : Rc.createHTML(e)) ?? e;
}
function ya(e) {
  var t = Qi("template");
  return t.innerHTML = Kc(e.replaceAll("<!>", "<!---->")), t.content;
}
function Wr(e, t) {
  var o = ve;
  o.nodes === null && (o.nodes = { start: e, end: t, a: null, t: null });
}
function re(e, t) {
  var o = (t & tc) !== 0, n = (t & rc) !== 0, s, a = !e.startsWith("<!>");
  return () => {
    s === void 0 && (s = ya(a ? e : "<!>" + e), o || (s = Lt(s)));
    var l = n || ji ? document.importNode(s, true) : s.cloneNode(true);
    if (o) {
      var c = Lt(l), u = l.lastChild;
      Wr(c, u);
    } else Wr(l, l);
    return l;
  };
}
function Dc(e, t, o = "svg") {
  var n = !e.startsWith("<!>"), s = `<${o}>${n ? e : "<!>" + e}</${o}>`, a;
  return () => {
    if (!a) {
      var l = ya(s), c = Lt(l);
      a = Lt(c);
    }
    var u = a.cloneNode(true);
    return Wr(u, u), u;
  };
}
function Vc(e, t) {
  return Dc(e, t, "svg");
}
function yo() {
  var e = document.createDocumentFragment(), t = document.createComment(""), o = nr();
  return e.append(t, o), Wr(t, o), e;
}
function F(e, t) {
  e !== null && e.before(t);
}
function Fe(e, t) {
  var o = t == null ? "" : typeof t == "object" ? `${t}` : t;
  o !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = o, e.nodeValue = `${o}`);
}
function $c(e, t) {
  return Gc(e, t);
}
const zo = /* @__PURE__ */ new Map();
function Gc(e, { target: t, anchor: o, props: n = {}, events: s, context: a, intro: l = true, transformError: c }) {
  kc();
  var u = void 0, d = Lc(() => {
    var f = o ?? t.appendChild(nr());
    yc(f, { pending: () => {
    } }, (y) => {
      Oe({});
      var v = Ie;
      a && (v.c = a), s && (n.$$events = s), u = e(y, n) || {}, Le();
    }, c);
    var p = /* @__PURE__ */ new Set(), h = (y) => {
      for (var v = 0; v < y.length; v++) {
        var g = y[v];
        if (!p.has(g)) {
          p.add(g);
          var x = Yc(g);
          for (const M of [t, document]) {
            var b = zo.get(M);
            b === void 0 && (b = /* @__PURE__ */ new Map(), zo.set(M, b));
            var O = b.get(g);
            O === void 0 ? (M.addEventListener(g, Wn, { passive: x }), b.set(g, 1)) : b.set(g, O + 1);
          }
        }
      }
    };
    return h(dn(va)), Nn.add(h), () => {
      var _a5;
      for (var y of p) for (const x of [t, document]) {
        var v = zo.get(x), g = v.get(y);
        --g == 0 ? (x.removeEventListener(y, Wn), v.delete(y), v.size === 0 && zo.delete(x)) : v.set(y, g);
      }
      Nn.delete(h), f !== o && ((_a5 = f.parentNode) == null ? void 0 : _a5.removeChild(f));
    };
  });
  return qc.set(u, d), u;
}
let qc = /* @__PURE__ */ new WeakMap();
class xs {
  constructor(t, o = true) {
    __publicField(this, "anchor");
    __privateAdd(this, _t3, /* @__PURE__ */ new Map());
    __privateAdd(this, _n4, /* @__PURE__ */ new Map());
    __privateAdd(this, _e3, /* @__PURE__ */ new Map());
    __privateAdd(this, _s4, /* @__PURE__ */ new Set());
    __privateAdd(this, _o4, true);
    __privateAdd(this, _i4, (t) => {
      if (__privateGet(this, _t3).has(t)) {
        var o = __privateGet(this, _t3).get(t), n = __privateGet(this, _n4).get(o);
        if (n) gs(n), __privateGet(this, _s4).delete(o);
        else {
          var s = __privateGet(this, _e3).get(o);
          s && (__privateGet(this, _n4).set(o, s.effect), __privateGet(this, _e3).delete(o), s.fragment.lastChild.remove(), this.anchor.before(s.fragment), n = s.effect);
        }
        for (const [a, l] of __privateGet(this, _t3)) {
          if (__privateGet(this, _t3).delete(a), a === t) break;
          const c = __privateGet(this, _e3).get(l);
          c && (nt(c.effect), __privateGet(this, _e3).delete(l));
        }
        for (const [a, l] of __privateGet(this, _n4)) {
          if (a === o || __privateGet(this, _s4).has(a)) continue;
          const c = () => {
            if (Array.from(__privateGet(this, _t3).values()).includes(a)) {
              var d = document.createDocumentFragment();
              bs(l, d), d.append(nr()), __privateGet(this, _e3).set(a, { effect: l, fragment: d });
            } else nt(l);
            __privateGet(this, _s4).delete(a), __privateGet(this, _n4).delete(a);
          };
          __privateGet(this, _o4) || !n ? (__privateGet(this, _s4).add(a), Sr(l, c, false)) : c();
        }
      }
    });
    __privateAdd(this, _r4, (t) => {
      __privateGet(this, _t3).delete(t);
      const o = Array.from(__privateGet(this, _t3).values());
      for (const [n, s] of __privateGet(this, _e3)) o.includes(n) || (nt(s.effect), __privateGet(this, _e3).delete(n));
    });
    this.anchor = t, __privateSet(this, _o4, o);
  }
  ensure(t, o) {
    var n = xe, s = Zi();
    if (o && !__privateGet(this, _n4).has(t) && !__privateGet(this, _e3).has(t)) if (s) {
      var a = document.createDocumentFragment(), l = nr();
      a.append(l), __privateGet(this, _e3).set(t, { effect: vt(() => o(l)), fragment: a });
    } else __privateGet(this, _n4).set(t, vt(() => o(this.anchor)));
    if (__privateGet(this, _t3).set(n, t), s) {
      for (const [c, u] of __privateGet(this, _n4)) c === t ? n.unskip_effect(u) : n.skip_effect(u);
      for (const [c, u] of __privateGet(this, _e3)) c === t ? n.unskip_effect(u.effect) : n.skip_effect(u.effect);
      n.oncommit(__privateGet(this, _i4)), n.ondiscard(__privateGet(this, _r4));
    } else __privateGet(this, _i4).call(this, n);
  }
}
_t3 = new WeakMap();
_n4 = new WeakMap();
_e3 = new WeakMap();
_s4 = new WeakMap();
_o4 = new WeakMap();
_i4 = new WeakMap();
_r4 = new WeakMap();
function rt(e, t, o = false) {
  var n = new xs(e), s = o ? wr : 0;
  function a(l, c) {
    n.ensure(l, c);
  }
  Co(() => {
    var l = false;
    t((c, u = 0) => {
      l = true, a(u, c);
    }), l || a(-1, null);
  }, s);
}
const Uc = Symbol("NaN");
function Hc(e, t, o) {
  var n = new xs(e), s = !Qr();
  Co(() => {
    var a = t();
    a !== a && (a = Uc), s && a !== null && typeof a == "object" && (a = {}), n.ensure(a, o);
  });
}
function jn(e, t) {
  return t;
}
function Nc(e, t, o) {
  for (var n = [], s = t.length, a, l = t.length, c = 0; c < s; c++) {
    let p = t[c];
    Sr(p, () => {
      if (a) {
        if (a.pending.delete(p), a.done.add(p), a.pending.size === 0) {
          var h = e.outrogroups;
          Fn(e, dn(a.done)), h.delete(a), h.size === 0 && (e.outrogroups = null);
        }
      } else l -= 1;
    }, false);
  }
  if (l === 0) {
    var u = n.length === 0 && o !== null;
    if (u) {
      var d = o, f = d.parentNode;
      Pc(f), f.append(d), e.items.clear();
    }
    Fn(e, t, !u);
  } else a = { pending: new Set(t), done: /* @__PURE__ */ new Set() }, (e.outrogroups ?? (e.outrogroups = /* @__PURE__ */ new Set())).add(a);
}
function Fn(e, t, o = true) {
  var n;
  if (e.pending.size > 0) {
    n = /* @__PURE__ */ new Set();
    for (const l of e.pending.values()) for (const c of l) n.add(e.items.get(c).e);
  }
  for (var s = 0; s < t.length; s++) {
    var a = t[s];
    if (n == null ? void 0 : n.has(a)) {
      a.f |= Ot;
      const l = document.createDocumentFragment();
      bs(a, l);
    } else nt(t[s], o);
  }
}
var Ws;
function Je(e, t, o, n, s, a = null) {
  var l = e, c = /* @__PURE__ */ new Map(), u = (t & Ei) !== 0;
  if (u) {
    var d = e;
    l = d.appendChild(nr());
  }
  var f = null, p = fs(() => {
    var M = o();
    return Oi(M) ? M : M == null ? [] : dn(M);
  }), h, y = /* @__PURE__ */ new Map(), v = true;
  function g(M) {
    (O.effect.f & dt) === 0 && (O.pending.delete(M), O.fallback = f, Wc(O, h, l, t, n), f !== null && (h.length === 0 ? (f.f & Ot) === 0 ? gs(f) : (f.f ^= Ot, no(f, null, l)) : Sr(f, () => {
      f = null;
    })));
  }
  function x(M) {
    O.pending.delete(M);
  }
  var b = Co(() => {
    h = m(p);
    for (var M = h.length, w = /* @__PURE__ */ new Set(), C = xe, k = Zi(), _ = 0; _ < M; _ += 1) {
      var L = h[_], E = n(L, _), I = v ? null : c.get(E);
      I ? (I.v && Hr(I.v, L), I.i && Hr(I.i, _), k && C.unskip_effect(I.e)) : (I = jc(c, v ? l : Ws ?? (Ws = nr()), L, E, _, s, t, o), v || (I.e.f |= Ot), c.set(E, I)), w.add(E);
    }
    if (M === 0 && a && !f && (v ? f = vt(() => a(l)) : (f = vt(() => a(Ws ?? (Ws = nr()))), f.f |= Ot)), M > w.size && Yl(), !v) if (y.set(C, w), k) {
      for (const [P, A] of c) w.has(P) || C.skip_effect(A.e);
      C.oncommit(g), C.ondiscard(x);
    } else g(C);
    m(p);
  }), O = { effect: b, items: c, pending: y, outrogroups: null, fallback: f };
  v = false;
}
function ro(e) {
  for (; e !== null && (e.f & kt) === 0; ) e = e.next;
  return e;
}
function Wc(e, t, o, n, s) {
  var _a5, _b2, _c5, _d3, _e5, _f4, _g, _h4, _i5;
  var a = (n & Wl) !== 0, l = t.length, c = e.items, u = ro(e.effect.first), d, f = null, p, h = [], y = [], v, g, x, b;
  if (a) for (b = 0; b < l; b += 1) v = t[b], g = s(v, b), x = c.get(g).e, (x.f & Ot) === 0 && ((_b2 = (_a5 = x.nodes) == null ? void 0 : _a5.a) == null ? void 0 : _b2.measure(), (p ?? (p = /* @__PURE__ */ new Set())).add(x));
  for (b = 0; b < l; b += 1) {
    if (v = t[b], g = s(v, b), x = c.get(g).e, e.outrogroups !== null) for (const I of e.outrogroups) I.pending.delete(x), I.done.delete(x);
    if ((x.f & je) !== 0 && (gs(x), a && ((_d3 = (_c5 = x.nodes) == null ? void 0 : _c5.a) == null ? void 0 : _d3.unfix(), (p ?? (p = /* @__PURE__ */ new Set())).delete(x))), (x.f & Ot) !== 0) if (x.f ^= Ot, x === u) no(x, null, o);
    else {
      var O = f ? f.next : u;
      x === e.effect.last && (e.effect.last = x.prev), x.prev && (x.prev.next = x.next), x.next && (x.next.prev = x.prev), Ft(e, f, x), Ft(e, x, O), no(x, O, o), f = x, h = [], y = [], u = ro(f.next);
      continue;
    }
    if (x !== u) {
      if (d !== void 0 && d.has(x)) {
        if (h.length < y.length) {
          var M = y[0], w;
          f = M.prev;
          var C = h[0], k = h[h.length - 1];
          for (w = 0; w < h.length; w += 1) no(h[w], M, o);
          for (w = 0; w < y.length; w += 1) d.delete(y[w]);
          Ft(e, C.prev, k.next), Ft(e, f, C), Ft(e, k, M), u = M, f = k, b -= 1, h = [], y = [];
        } else d.delete(x), no(x, u, o), Ft(e, x.prev, x.next), Ft(e, x, f === null ? e.effect.first : f.next), Ft(e, f, x), f = x;
        continue;
      }
      for (h = [], y = []; u !== null && u !== x; ) (d ?? (d = /* @__PURE__ */ new Set())).add(u), y.push(u), u = ro(u.next);
      if (u === null) continue;
    }
    (x.f & Ot) === 0 && h.push(x), f = x, u = ro(x.next);
  }
  if (e.outrogroups !== null) {
    for (const I of e.outrogroups) I.pending.size === 0 && (Fn(e, dn(I.done)), (_e5 = e.outrogroups) == null ? void 0 : _e5.delete(I));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (u !== null || d !== void 0) {
    var _ = [];
    if (d !== void 0) for (x of d) (x.f & je) === 0 && _.push(x);
    for (; u !== null; ) (u.f & je) === 0 && u !== e.fallback && _.push(u), u = ro(u.next);
    var L = _.length;
    if (L > 0) {
      var E = (n & Ei) !== 0 && l === 0 ? o : null;
      if (a) {
        for (b = 0; b < L; b += 1) (_g = (_f4 = _[b].nodes) == null ? void 0 : _f4.a) == null ? void 0 : _g.measure();
        for (b = 0; b < L; b += 1) (_i5 = (_h4 = _[b].nodes) == null ? void 0 : _h4.a) == null ? void 0 : _i5.fix();
      }
      Nc(e, _, E);
    }
  }
  a && rr(() => {
    var _a6, _b3;
    if (p !== void 0) for (x of p) (_b3 = (_a6 = x.nodes) == null ? void 0 : _a6.a) == null ? void 0 : _b3.apply();
  });
}
function jc(e, t, o, n, s, a, l, c) {
  var u = (l & Hl) !== 0 ? (l & jl) === 0 ? wc(o, false, false) : ar(o) : null, d = (l & Nl) !== 0 ? ar(s) : null;
  return { v: u, i: d, e: vt(() => (a(t, u ?? o, d ?? s, c), () => {
    e.delete(n);
  })) };
}
function no(e, t, o) {
  if (e.nodes) for (var n = e.nodes.start, s = e.nodes.end, a = t && (t.f & Ot) === 0 ? t.nodes.start : o; n !== null; ) {
    var l = So(n);
    if (a.before(n), n === s) return;
    n = l;
  }
}
function Ft(e, t, o) {
  t === null ? e.effect.first = o : t.next = o, o === null ? e.effect.last = t : o.prev = t;
}
function Ss(e, t, o = false, n = false, s = false, a = false) {
  var l = e, c = "";
  if (o) var u = e;
  pe(() => {
    var d = ve;
    if (c !== (c = t() ?? "")) {
      if (o) {
        d.nodes = null, u.innerHTML = c, c !== "" && Wr(Lt(u), u.lastChild);
        return;
      }
      if (d.nodes !== null && (na(d.nodes.start, d.nodes.end), d.nodes = null), c !== "") {
        var f = n ? oc : s ? nc : void 0, p = Qi(n ? "svg" : s ? "math" : "template", f);
        p.innerHTML = c;
        var h = n || s ? p : p.content;
        if (Wr(Lt(h), h.lastChild), n || s) for (; Lt(h); ) l.before(Lt(h));
        else l.before(h);
      }
    }
  });
}
function ma(e, t, ...o) {
  var n = new xs(e);
  Co(() => {
    const s = t() ?? null;
    n.ensure(s, s && ((a) => s(a, ...o)));
  }, wr);
}
function rn(e, t, o) {
  ra(() => {
    var n = Mo(() => t(e, o == null ? void 0 : o()) || {});
    if (o && (n == null ? void 0 : n.update)) {
      var s = false, a = {};
      ys(() => {
        var l = o();
        Bc(l), s && Yi(a, l) && (a = l, n.update(l));
      }), s = true;
    }
    if (n == null ? void 0 : n.destroy) return () => n.destroy();
  });
}
function ga(e) {
  var t, o, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var s = e.length;
    for (t = 0; t < s; t++) e[t] && (o = ga(e[t])) && (n && (n += " "), n += o);
  } else for (o in e) e[o] && (n && (n += " "), n += o);
  return n;
}
function Fc() {
  for (var e, t, o = 0, n = "", s = arguments.length; o < s; o++) (e = arguments[o]) && (t = ga(e)) && (n && (n += " "), n += t);
  return n;
}
function pt(e) {
  return typeof e == "object" ? Fc(e) : e ?? "";
}
const js = [...` 	
\r\f\xA0\v\uFEFF`];
function Jc(e, t, o) {
  var n = e == null ? "" : "" + e;
  if (t && (n = n ? n + " " + t : t), o) {
    for (var s of Object.keys(o)) if (o[s]) n = n ? n + " " + s : s;
    else if (n.length) for (var a = s.length, l = 0; (l = n.indexOf(s, l)) >= 0; ) {
      var c = l + a;
      (l === 0 || js.includes(n[l - 1])) && (c === n.length || js.includes(n[c])) ? n = (l === 0 ? "" : n.substring(0, l)) + n.substring(c + 1) : l = c;
    }
  }
  return n === "" ? null : n;
}
function Fs(e, t = false) {
  var o = t ? " !important;" : ";", n = "";
  for (var s of Object.keys(e)) {
    var a = e[s];
    a != null && a !== "" && (n += " " + s + ": " + a + o);
  }
  return n;
}
function xn(e) {
  return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Zc(e, t) {
  if (t) {
    var o = "", n, s;
    if (Array.isArray(t) ? (n = t[0], s = t[1]) : n = t, e) {
      e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
      var a = false, l = 0, c = false, u = [];
      n && u.push(...Object.keys(n).map(xn)), s && u.push(...Object.keys(s).map(xn));
      var d = 0, f = -1;
      const g = e.length;
      for (var p = 0; p < g; p++) {
        var h = e[p];
        if (c ? h === "/" && e[p - 1] === "*" && (c = false) : a ? a === h && (a = false) : h === "/" && e[p + 1] === "*" ? c = true : h === '"' || h === "'" ? a = h : h === "(" ? l++ : h === ")" && l--, !c && a === false && l === 0) {
          if (h === ":" && f === -1) f = p;
          else if (h === ";" || p === g - 1) {
            if (f !== -1) {
              var y = xn(e.substring(d, f).trim());
              if (!u.includes(y)) {
                h !== ";" && p++;
                var v = e.substring(d, p).trim();
                o += " " + v + ";";
              }
            }
            d = p + 1, f = -1;
          }
        }
      }
    }
    return n && (o += Fs(n)), s && (o += Fs(s, true)), o = o.trim(), o === "" ? null : o;
  }
  return e == null ? null : String(e);
}
function te(e, t, o, n, s, a) {
  var l = e.__className;
  if (l !== o || l === void 0) {
    var c = Jc(o, n, a);
    c == null ? e.removeAttribute("class") : e.className = c, e.__className = o;
  } else if (a && s !== a) for (var u in a) {
    var d = !!a[u];
    (s == null || d !== !!s[u]) && e.classList.toggle(u, d);
  }
  return a;
}
function Sn(e, t = {}, o, n) {
  for (var s in o) {
    var a = o[s];
    t[s] !== a && (o[s] == null ? e.style.removeProperty(s) : e.style.setProperty(s, a, n));
  }
}
function qt(e, t, o, n) {
  var s = e.__style;
  if (s !== t) {
    var a = Zc(t, n);
    a == null ? e.removeAttribute("style") : e.style.cssText = a, e.__style = t;
  } else n && (Array.isArray(n) ? (Sn(e, o == null ? void 0 : o[0], n[0]), Sn(e, o == null ? void 0 : o[1], n[1], "important")) : Sn(e, o, n));
  return n;
}
const Qc = Symbol("is custom element"), eu = Symbol("is html"), tu = El ? "progress" : "PROGRESS";
function kr(e, t) {
  var o = ws(e);
  o.value === (o.value = t ?? void 0) || e.value === t && (t !== 0 || e.nodeName !== tu) || (e.value = t ?? "");
}
function Cs(e, t) {
  var o = ws(e);
  o.checked !== (o.checked = t ?? void 0) && (e.checked = t);
}
function ee(e, t, o, n) {
  var s = ws(e);
  s[t] !== (s[t] = o) && (t === "loading" && (e[Xl] = o), o == null ? e.removeAttribute(t) : typeof o != "string" && ru(e).includes(t) ? e[t] = o : e.setAttribute(t, o));
}
function ws(e) {
  return e.__attributes ?? (e.__attributes = { [Qc]: e.nodeName.includes("-"), [eu]: e.namespaceURI === Bi });
}
var Js = /* @__PURE__ */ new Map();
function ru(e) {
  var t = e.getAttribute("is") || e.nodeName, o = Js.get(t);
  if (o) return o;
  Js.set(t, o = []);
  for (var n, s = e, a = Element.prototype; a !== s; ) {
    n = Li(s);
    for (var l in n) n[l].set && o.push(l);
    s = as(s);
  }
  return o;
}
function Zs(e, t) {
  return e === t || (e == null ? void 0 : e[br]) === t;
}
function Ye(e = {}, t, o, n) {
  var s = Ie.r, a = ve;
  return ra(() => {
    var l, c;
    return ys(() => {
      l = c, c = [], Mo(() => {
        e !== o(...c) && (t(e, ...c), l && Zs(o(...l), e) && t(null, ...l));
      });
    }), () => {
      let u = a;
      for (; u !== s && u.parent !== null && u.parent.f & Vn; ) u = u.parent;
      const d = () => {
        c && Zs(o(...c), e) && t(null, ...c);
      }, f = u.teardown;
      u.teardown = () => {
        d(), f == null ? void 0 : f();
      };
    };
  }), e;
}
function Ue(e, t, o, n) {
  var _a5;
  var s = !Zr || (o & Jl) !== 0, a = (o & Ql) !== 0, l = (o & ec) !== 0, c = n, u = true, d = () => (u && (u = false, c = l ? Mo(n) : n), c);
  let f;
  if (a) {
    var p = br in e || Il in e;
    f = ((_a5 = Rr(e, t)) == null ? void 0 : _a5.set) ?? (p && t in e ? (M) => e[t] = M : void 0);
  }
  var h, y = false;
  a ? [h, y] = dc(() => e[t]) : h = e[t], h === void 0 && n !== void 0 && (h = d(), f && (s && Vl(), f(h)));
  var v;
  if (s ? v = () => {
    var M = e[t];
    return M === void 0 ? d() : (u = true, M);
  } : v = () => {
    var M = e[t];
    return M !== void 0 && (c = void 0), M === void 0 ? c : M;
  }, s && (o & Zl) === 0) return v;
  if (f) {
    var g = e.$$legacy;
    return (function(M, w) {
      return arguments.length > 0 ? ((!s || !w || g || y) && f(w ? v() : M), M) : v();
    });
  }
  var x = false, b = ((o & Fl) !== 0 ? pn : fs)(() => (x = false, v()));
  a && m(b);
  var O = ve;
  return (function(M, w) {
    if (arguments.length > 0) {
      const C = w ? m(b) : s && a ? Me(M) : M;
      return N(b, C), x = true, c !== void 0 && (c = C), M;
    }
    return Gt && x || (O.f & dt) !== 0 ? b.v : m(b);
  });
}
function ur(e) {
  Ie === null && Bl(), Zr && Ie.l !== null ? ou(Ie).m.push(e) : Xt(() => {
    const t = Mo(e);
    if (typeof t == "function") return t;
  });
}
function ou(e) {
  var t = e.l;
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
const nu = document.querySelector(".canvas-layers"), su = document.getElementById("tooltip"), iu = document.querySelector(".nav"), au = document.getElementById("top-menu"), lu = document.querySelector(".tool-options"), cu = document.getElementById("file-submenu"), uu = document.getElementById("save"), du = document.getElementById("drawing-upload"), fu = document.getElementById("import"), pu = document.getElementById("export"), hu = document.getElementById("edit-submenu"), vu = document.getElementById("canvas-size"), yu = document.getElementById("select-all"), mu = document.getElementById("deselect"), gu = document.getElementById("cut-selection"), bu = document.getElementById("copy-selection"), xu = document.getElementById("paste-selection"), Su = document.getElementById("delete-selection"), Cu = document.getElementById("flip-horizontal"), wu = document.getElementById("flip-vertical"), Mu = document.getElementById("rotate-right"), ku = document.getElementById("settings-btn"), Pu = document.querySelector(".settings-container"), _u = document.getElementById("tooltips-toggle"), Ou = document.getElementById("grid-toggle"), Lu = document.querySelector(".grid-spacing-spin"), Tu = document.getElementById("grid-spacing"), Iu = document.getElementById("cursor-preview-toggle"), Xu = document.querySelector(".save-container"), Eu = document.querySelector("#save-interface"), Bu = document.querySelector("#save-file-name"), zu = document.querySelector("#savefile-size"), Yu = document.querySelector("#save-advanced-options"), Au = document.querySelector("#cancel-save-button"), Ru = document.querySelector(".export-container"), Ku = document.querySelector(".toolbox"), Du = document.getElementById("undo"), Vu = document.getElementById("redo"), $u = document.querySelector(".recenter"), Gu = document.querySelector(".clear"), qu = document.querySelector(".zoom"), ba = document.querySelector(".tools"), Uu = ["brush", "colorMask", "fill", "curve", "ellipse", "select", "eyedropper", "grab", "move"], xa = {};
Uu.forEach((e) => {
  xa[`${e}Btn`] = (ba == null ? void 0 : ba.querySelector(`#${e}`)) ?? null;
});
const Hu = document.querySelector("#brush"), Nu = document.querySelector(".swatch"), Wu = document.querySelector(".back-swatch"), ju = document.querySelector(".color-switch"), Fu = document.querySelector(".dither-picker-container"), Ju = document.querySelector(".picker-container"), Zu = document.getElementById("confirm-btn"), Qu = document.getElementById("cancel-btn"), ed = document.getElementById("newcolor-btn"), td = document.querySelector(".sidebar"), rd = document.querySelector(".brush-container"), od = document.querySelector("#line-weight"), nd = document.querySelector(".brush-preview"), sd = document.querySelector("#brush-preview"), id = document.querySelector("#brush-size"), ad = document.querySelector(".brush-stamp"), ld = document.querySelector(".modes-container"), cd = document.querySelector(".palette-interface"), ud = document.querySelector(".palette-container"), dd = document.querySelector(".palette-colors"), fd = document.querySelector(".palette-edit"), pd = document.querySelector(".palette-remove"), hd = document.querySelector(".palette-presets-btn"), vd = document.querySelector(".palette-presets-list"), yd = document.querySelector(".layers-interface"), md = document.querySelector("#file-upload"), gd = document.querySelector(".add-layer"), bd = document.querySelector("#delete-layer"), xd = document.querySelector(".layers"), Sd = document.querySelector(".layer-settings"), Cd = document.querySelector(".vectors"), wd = document.querySelector(".vectors-interface"), Md = document.querySelector(".vector-settings"), kd = document.querySelector("#vector-dither-picker"), Pd = document.getElementById("stamp-editor"), _d = document.getElementById("stamp-editor-canvas"), Od = document.getElementById("stamp-preview-canvas"), Ld = document.getElementById("stamp-editor-apply-btn"), Td = document.getElementById("stamp-editor-clear-btn"), Id = document.getElementById("stamp-draw-btn"), Xd = document.getElementById("stamp-erase-btn"), Ed = document.getElementById("stamp-move-btn"), Bd = document.getElementById("stamp-mirror-h-btn"), zd = document.getElementById("stamp-mirror-v-btn"), Yd = document.getElementById("custom-brush-type-btn"), Ad = document.querySelector(".size-container"), Rd = document.querySelector(".dimensions-form"), Kd = document.getElementById("canvas-width"), Dd = document.getElementById("canvas-height"), Vd = document.getElementById("cancel-resize-button"), $d = document.getElementById("anchor-grid"), Gd = document.querySelector(".vector-transform-ui-container"), qd = document.querySelector(".vector-transform-modes"), T = { canvasLayers: nu, tooltip: su, navBar: iu, topMenu: au, toolOptions: lu, fileSubMenu: cu, saveBtn: uu, openSaveBtn: du, importBtn: fu, exportBtn: pu, editSubMenu: hu, canvasSizeBtn: vu, selectAllBtn: yu, deselectBtn: mu, cutBtn: gu, copyBtn: bu, pasteBtn: xu, deleteBtn: Su, flipHorizontalBtn: Cu, flipVerticalBtn: wu, rotateBtn: Mu, settingsBtn: ku, settingsContainer: Pu, tooltipBtn: _u, gridBtn: Ou, gridSpacingSpinBtn: Lu, gridSpacing: Tu, cursorPreviewBtn: Iu, saveContainer: Xu, saveAsForm: Eu, saveAsFileName: Bu, fileSizePreview: zu, advancedOptionsContainer: Yu, cancelSaveBtn: Au, exportContainer: Ru, toolboxContainer: Ku, undoBtn: Du, redoBtn: Vu, recenterBtn: $u, clearBtn: Gu, zoomContainer: qu, toolsContainer: ba, ...xa, toolBtn: Hu, ditherPickerContainer: Fu, swatch: Nu, backSwatch: Wu, colorSwitch: ju, colorPickerContainer: Ju, confirmBtn: Zu, cancelBtn: Qu, newColorBtn: ed, sidebarContainer: td, brushContainer: rd, lineWeight: od, brushDisplay: nd, brushPreview: sd, brushSlider: id, brushStamp: ad, modesContainer: ld, paletteInterfaceContainer: cd, paletteContainer: ud, paletteColors: dd, paletteEditBtn: fd, paletteRemoveBtn: pd, palettePresetsBtn: hd, palettePresetsList: vd, uploadBtn: md, newLayerBtn: gd, deleteLayerBtn: bd, layersContainer: xd, layersInterfaceContainer: yd, layerSettingsContainer: Sd, vectorsThumbnails: Cd, vectorsInterfaceContainer: wd, vectorSettingsContainer: Md, vectorDitherPickerContainer: kd, stampEditorContainer: Pd, stampEditorCanvas: _d, stampPreviewCanvas: Od, stampEditorApplyBtn: Ld, stampEditorClearBtn: Td, stampDrawBtn: Id, stampEraseBtn: Xd, stampMoveBtn: Ed, stampMirrorHBtn: Bd, stampMirrorVBtn: zd, customBrushTypeBtn: Yd, sizeContainer: Ad, dimensionsForm: Rd, canvasWidth: Kd, canvasHeight: Dd, canvasSizeCancelBtn: Vd, anchorGrid: $d, vectorTransformUIContainer: Gd, vectorTransformModeContainer: qd };
function Ud(e, t, o, n) {
  const s = [];
  let a = Math.floor(e / 2), l = 4 - 2 * a;
  l = (5 - 4 * a) / 4;
  let c = 0, u = a, d = a, f = a;
  for (p(d, f, c, u); c < u; ) c++, l >= 0 ? (u--, l += 2 * (c - u) + 1) : l += 2 * c + 1, p(d, f, c, u);
  function p(h, y, v, g) {
    function x(w, C) {
      let k = w + t;
      const L = C + o << 16 | k;
      n.has(L) || (n.add(L), s.push({ x: w, y: C }));
    }
    const b = e % 2 === 0 ? 2 * v : 2 * v + 1, O = e % 2 === 0 ? 2 * g : 2 * g + 1, M = e % 2 === 0 ? 1 : 0;
    for (let w = 0; w < b; w++) x(h - v + w, y - g);
    for (let w = 0; w < O; w++) x(h - g + w, y - v);
    for (let w = 0; w < O; w++) x(h - g + w, y + v - M);
    for (let w = 0; w < b; w++) x(h - v + w, y + g - M);
  }
  return s;
}
function Hd(e, t, o, n) {
  const s = [];
  for (let a = 0; a < e; a++) for (let l = 0; l < e; l++) {
    const c = a + o << 16 | l + t;
    n.has(c) || (s.push({ x: l, y: a }), n.add(c));
  }
  return s;
}
function Nd(e, t, o, n) {
  const s = [];
  for (const { x: a, y: l } of e) {
    const c = l + o << 16 | a + t;
    n.has(c) || s.push({ x: a, y: l });
  }
  return s;
}
function Sa(e, t) {
  const o = /* @__PURE__ */ new Set(), n = e(t, 0, 0, o), s = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], a = { "0,0": n, pixelSet: new Set(n.map((l) => l.y << 16 | l.x)) };
  for (const [l, c] of s) a[`${l},${c}`] = Nd(n, l, c, o);
  return a;
}
function Wd(e) {
  return Sa(Ud, e);
}
function jd(e) {
  return Sa(Hd, e);
}
function Qs(e) {
  let t = {};
  if (e === "circle") for (let o = 1; o <= 32; o++) t[o] = Wd(o);
  else if (e === "square") for (let o = 1; o <= 32; o++) t[o] = jd(o);
  return t;
}
const lr = Me({ pixels: [] }), mr = { pixelSet: /* @__PURE__ */ new Set(), colorMap: /* @__PURE__ */ new Map() }, gt = { circle: Qs("circle"), square: Qs("square"), custom: null }, Fd = ["0,0", "1,0", "1,1", "0,1", "-1,1", "-1,0", "-1,-1", "0,-1", "1,-1"];
function Jd() {
  const e = lr.pixels, t = {};
  for (const o of Fd) t[o] = e;
  return t.pixelSet = mr.pixelSet, t;
}
function Ms() {
  gt.custom = Jd();
}
Ms();
const mo = "translate", Kr = "rotate", cr = "scale", Mt = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24, 28, 32], Zd = 20, er = 8, Yr = 1024, No = ["line", "quadCurve", "cubicCurve"], Ca = (e, t, o, n) => {
  for (let s = Mt.length - 1; s >= 0; s--) {
    const a = Mt[s];
    if (e * a <= o * 0.5 && t * a <= n * 0.85) return a;
  }
  return Mt[0];
}, Ut = (e, t, o, n, s) => {
  const a = Math.floor(o / 2), l = !n.cvs || e >= n.cvs.width + a || e < -a, c = !n.cvs || t >= n.cvs.height + a || t < -a;
  return !!(l || c || s.xMin !== null && (e >= s.xMax + o / 2 || e < s.xMin - o / 2 || t >= s.yMax + o / 2 || t < s.yMin - o / 2));
};
function ei(e, t) {
  return Math.max(t, e);
}
function ti(e, t) {
  return e !== null ? Math.min(t, e) : t;
}
const wa = document.querySelector(".bg-canvas"), Qd = wa.getContext("2d", { desynchronized: true }), Ma = document.getElementById("vector-gui-canvas"), ka = Ma.getContext("2d", { desynchronized: true }), Pa = document.getElementById("selection-gui-canvas"), _a = Pa.getContext("2d", { desynchronized: true }), Oa = document.getElementById("resize-overlay-canvas"), La = Oa.getContext("2d", { desynchronized: true }), Ta = document.getElementById("cursor-canvas"), Ia = Ta.getContext("2d", { desynchronized: true }), Xa = document.createElement("canvas"), ef = Xa.getContext("2d", { willReadFrequently: true }), Ea = document.createElement("canvas"), tf = Ea.getContext("2d", { willReadFrequently: true }), Ba = document.createElement("canvas"), rf = Ba.getContext("2d", { willReadFrequently: true }), i = Me({ vectorGuiCVS: Ma, vectorGuiCTX: ka, selectionGuiCVS: Pa, selectionGuiCTX: _a, resizeOverlayCVS: Oa, resizeOverlayCTX: La, cursorCVS: Ta, cursorCTX: Ia, backgroundCVS: wa, backgroundCTX: Qd, offScreenCVS: Xa, offScreenCTX: ef, previewCVS: Ea, previewCTX: tf, thumbnailCVS: Ba, thumbnailCTX: rf, sharpness: null, zoom: null, zoomAtLastDraw: null, layers: [], activeLayerCount: 0, currentLayer: null, tempLayer: null, pastedLayer: null, hiddenLayer: null, bgColor: "rgba(131, 131, 131, 0.5)", borderColor: "black", pointerEvent: "none", sizePointerState: "none", xOffset: null, yOffset: null, previousXOffset: null, previousYOffset: null, subPixelX: null, subPixelY: null, previousSubPixelX: null, previousSubPixelY: null, zoomPixelX: null, zoomPixelY: null, gui: { lineWidth: null, renderRadius: null, collisionRadius: null } });
i.offScreenCVS.width = 128;
i.offScreenCVS.height = 128;
i.previewCVS.width = i.offScreenCVS.width;
i.previewCVS.height = i.offScreenCVS.height;
i.thumbnailCVS.width = 600;
i.thumbnailCVS.height = 256;
i.sharpness = window.devicePixelRatio;
i.vectorGuiCVS.width = i.vectorGuiCVS.offsetWidth * i.sharpness;
i.vectorGuiCVS.height = i.vectorGuiCVS.offsetHeight * i.sharpness;
i.selectionGuiCVS.width = i.selectionGuiCVS.offsetWidth * i.sharpness;
i.selectionGuiCVS.height = i.selectionGuiCVS.offsetHeight * i.sharpness;
i.resizeOverlayCVS.width = i.resizeOverlayCVS.offsetWidth * i.sharpness;
i.resizeOverlayCVS.height = i.resizeOverlayCVS.offsetHeight * i.sharpness;
i.cursorCVS.width = i.cursorCVS.offsetWidth * i.sharpness;
i.cursorCVS.height = i.cursorCVS.offsetHeight * i.sharpness;
i.backgroundCVS.width = i.backgroundCVS.offsetWidth * i.sharpness;
i.backgroundCVS.height = i.backgroundCVS.offsetHeight * i.sharpness;
i.zoom = Ca(i.offScreenCVS.width, i.offScreenCVS.height, i.vectorGuiCVS.offsetWidth, i.vectorGuiCVS.offsetHeight);
i.zoomAtLastDraw = i.zoom;
i.gui = { lineWidth: i.zoom <= 8 ? 0.5 / i.zoom : 0.5 / 8, renderRadius: 4, collisionRadius: i.zoom <= 6 ? 1 : 0.5 };
ka.scale(i.sharpness * i.zoom, i.sharpness * i.zoom);
_a.scale(i.sharpness * i.zoom, i.sharpness * i.zoom);
La.scale(i.sharpness * i.zoom, i.sharpness * i.zoom);
Ia.scale(i.sharpness * i.zoom, i.sharpness * i.zoom);
i.backgroundCTX.scale(i.sharpness * i.zoom, i.sharpness * i.zoom);
i.thumbnailCTX.scale(i.sharpness, i.sharpness);
T.canvasWidth && (T.canvasWidth.value = i.offScreenCVS.width);
T.canvasHeight && (T.canvasHeight.value = i.offScreenCVS.height);
T.gridSpacing && (T.gridSpacing.value = 8);
const B = Me({ primary: { swatch: T.swatch, color: { color: "rgba(0,0,0,1)", r: 0, g: 0, b: 0, a: 255 } }, secondary: { swatch: T.backSwatch, color: { color: "rgba(255,255,255,1)", r: 255, g: 255, b: 255, a: 255 } }, palette: [{ color: "rgba(0,0,0,1)", r: 0, g: 0, b: 0, a: 255 }, { color: "rgba(255,255,255,1)", r: 255, g: 255, b: 255, a: 255 }], activePaletteIndex: null, selectedPaletteIndex: null, paletteMode: "select", currentPreset: "1bit", customPalettes: {} });
T.swatch && (T.swatch.color = B.primary.color);
T.backSwatch && (T.backSwatch.color = B.secondary.color);
const of = [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22], [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]], nf = of.flat(), Ze = Array.from({ length: 64 }, (e, t) => ({ width: 8, height: 8, data: nf.map((o) => o < t + 1 ? 1 : 0) }));
function hn(e, t, o, n = 0, s = 0) {
  let a = ((t + n) % 8 + 8) % 8, l = ((o + s) % 8 + 8) % 8;
  return e.data[l * 8 + a] === 1;
}
function on(e, t, o, n) {
  const { layer: s, customContext: a, isPreview: l, boundaryBox: c, maskSet: u, seenPixelsSet: d, excludeFromSet: f, currentColor: p, currentModes: h, brushSize: y, customStampColorMap: v } = n;
  let g = 0, x = 0, b = s.ctx;
  if (a ? b = a : l && (b = s.onscreenCtx, g = i.xOffset, x = i.yOffset), v || (b.fillStyle = p.color), Ut(e, t, y, s, c)) return;
  const O = Math.ceil(e - y / 2), M = Math.ceil(t - y / 2);
  for (const w of o) {
    const C = O + w.x, k = M + w.y;
    if (!Ut(C, k, 0, s, c) && !(u && !u.has(k << 16 | C))) {
      if (d) {
        if (d.has(k << 16 | C)) continue;
        f || d.add(k << 16 | C);
      }
      ((h == null ? void 0 : h.eraser) || (h == null ? void 0 : h.inject)) && b.clearRect(C + g, k + x, 1, 1), (h == null ? void 0 : h.eraser) || (v && (b.fillStyle = v.get(`${w.x},${w.y}`) ?? p.color), b.fillRect(C + g, k + x, 1, 1));
    }
  }
}
function Pr(e, t, o, n) {
  const { layer: s, customContext: a, isPreview: l, boundaryBox: c, maskSet: u, seenPixelsSet: d, excludeFromSet: f, currentColor: p, currentModes: h, brushSize: y, ditherPattern: v, twoColorMode: g, secondaryColor: x, ditherOffsetX: b, ditherOffsetY: O } = n;
  let M = 0, w = 0, C = s.ctx;
  if (a ? C = a : l && (C = s.onscreenCtx, M = i.xOffset, w = i.yOffset), Ut(e, t, y, s, c)) return;
  const k = Math.ceil(e - y / 2), _ = Math.ceil(t - y / 2);
  for (const L of o) {
    const E = k + L.x, I = _ + L.y;
    if (Ut(E, I, 0, s, c) || u && !u.has(I << 16 | E)) continue;
    if (d) {
      if (d.has(I << 16 | E)) continue;
      f || d.add(I << 16 | E);
    }
    hn(v, E, I, b, O) ? (((h == null ? void 0 : h.eraser) || (h == null ? void 0 : h.inject)) && C.clearRect(E + M, I + w, 1, 1), (h == null ? void 0 : h.eraser) || (C.fillStyle = p.color, C.fillRect(E + M, I + w, 1, 1))) : g && x && (((h == null ? void 0 : h.eraser) || (h == null ? void 0 : h.inject)) && C.clearRect(E + M, I + w, 1, 1), (h == null ? void 0 : h.eraser) || (C.fillStyle = x.color, C.fillRect(E + M, I + w, 1, 1)));
  }
}
function vn(e, t, o, n) {
  const { layer: s, customContext: a, isPreview: l, boundaryBox: c, maskSet: u, seenPixelsSet: d, excludeFromSet: f, currentColor: p, currentModes: h, brushSize: y, twoColorMode: v, secondaryColor: g, ditherOffsetX: x, ditherOffsetY: b, densityMap: O, buildUpSteps: M } = n;
  let w = 0, C = 0, k = s.ctx;
  if (a ? k = a : l && (k = s.onscreenCtx, w = i.xOffset, C = i.yOffset), Ut(e, t, y, s, c)) return;
  const _ = Math.ceil(e - y / 2), L = Math.ceil(t - y / 2);
  for (const E of o) {
    const I = _ + E.x, P = L + E.y;
    if (Ut(I, P, 0, s, c) || u && !u.has(P << 16 | I)) continue;
    if (d) {
      if (d.has(P << 16 | I)) continue;
      f || d.add(P << 16 | I);
    }
    const A = O && O[P * s.cvs.width + I] || 0, G = Math.min(A, M.length - 1), K = Ze[M[G]];
    hn(K, I, P, x, b) ? (((h == null ? void 0 : h.eraser) || (h == null ? void 0 : h.inject)) && k.clearRect(I + w, P + C, 1, 1), (h == null ? void 0 : h.eraser) || (k.fillStyle = p.color, k.fillRect(I + w, P + C, 1, 1))) : v && (((h == null ? void 0 : h.eraser) || (h == null ? void 0 : h.inject)) && k.clearRect(I + w, P + C, 1, 1), (h == null ? void 0 : h.eraser) || (k.fillStyle = g.color, k.fillRect(I + w, P + C, 1, 1)));
  }
}
function ko(e, t, o, n, s) {
  let a = {};
  return Math.abs(e - o) > Math.abs(t - n) ? (a.x = Math.sign(Math.cos(s)), a.y = Math.tan(s) * Math.sign(Math.cos(s)), a.long = Math.abs(e - o)) : (a.x = Math.tan(Math.PI / 2 - s) * Math.sign(Math.cos(Math.PI / 2 - s)), a.y = Math.sign(Math.cos(Math.PI / 2 - s)), a.long = Math.abs(t - n)), a;
}
function Pe(e, t) {
  return Math.atan2(t, e);
}
function Ht(e, t, o, n) {
  let s = e - o, a = t - n;
  return (s < -1 || s > 1 || a < -1 || a > 1) && (s = 0, a = 0), `${s},${a}`;
}
function za(e, t, o, n, s) {
  const { brushStamp: a, seenPixelsSet: l, ditherPattern: c } = s, u = l ? new Set(l) : /* @__PURE__ */ new Set(), d = { ...s, seenPixelsSet: u };
  let f = Pe(o - e, n - t), p = ko(e, t, o, n, f), h = e, y = t, v = "0,0";
  for (let g = 0; g < p.long; g++) {
    let x = { x: Math.round(e + p.x * g), y: Math.round(t + p.y * g) };
    v = Ht(x.x, x.y, h, y), c ? Pr(x.x, x.y, a[v], d) : on(x.x, x.y, a[v], d), h = x.x, y = x.y;
  }
  v = Ht(o, n, h, y), c ? Pr(o, n, a[v], d) : on(o, n, a[v], d);
}
function Wt(e) {
  return { layer: null, customContext: null, isPreview: false, boundaryBox: null, maskSet: null, brushStamp: null, brushSize: 1, currentColor: null, currentModes: null, seenPixelsSet: null, excludeFromSet: false, ditherPattern: null, twoColorMode: false, secondaryColor: null, ditherOffsetX: 0, ditherOffsetY: 0, densityMap: null, buildUpSteps: null, customStampColorMap: null, ...e };
}
function sf(e, t) {
  let o = [{ x: "px1", y: "py1" }];
  t || S.drawControlPoints(e, o, false), S.drawControlPoints(e, o, true, t);
}
function Ya(e, t) {
  const o = t ?? r.selection.boundaryBox;
  e.save(), e.beginPath(), e.rect(i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height), e.rect(i.xOffset + o.xMin, i.yOffset + o.yMin, o.xMax - o.xMin, o.yMax - o.yMin), e.clip("evenodd"), e.fillStyle = "rgba(0, 0, 0, 0.1)", e.fillRect(i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height), e.restore();
}
function jt(e = 0.5) {
  return i.zoom <= 8 ? e / i.zoom : e / 8;
}
function af() {
  return 0.5 / i.zoom;
}
function Pt(e, t, o, n) {
  e.lineWidth = t * 3, e.strokeStyle = o, e.stroke(), e.lineWidth = t, e.strokeStyle = n, e.stroke();
}
function Dr(e, t, o, n, s, a, l) {
  const c = jt();
  e.vectorGuiCTX.beginPath(), e.vectorGuiCTX.moveTo(t + n + 0.5, o + s + 0.5), e.vectorGuiCTX.lineTo(t + a + 0.5, o + l + 0.5), Pt(e.vectorGuiCTX, c, "black", "white");
}
function Po(e, t, o, n, s) {
  return e >= o - s && e <= o + s && t >= n - s && t <= n + s;
}
function ri(e, t, o, n, s, a) {
  return e >= o && e <= s && t >= n && t <= a;
}
function Lr(e) {
  var _a5;
  return i.xOffset + (((_a5 = e == null ? void 0 : e.layer) == null ? void 0 : _a5.x) ?? 0) + (r.canvas.cropOffsetX ?? 0);
}
function Tr(e) {
  var _a5;
  return i.yOffset + (((_a5 = e == null ? void 0 : e.layer) == null ? void 0 : _a5.y) ?? 0) + (r.canvas.cropOffsetY ?? 0);
}
function lf(e) {
  var _a5;
  return (((_a5 = e == null ? void 0 : e.layer) == null ? void 0 : _a5.x) ?? 0) + (r.canvas.cropOffsetX ?? 0);
}
function cf(e) {
  var _a5;
  return (((_a5 = e == null ? void 0 : e.layer) == null ? void 0 : _a5.y) ?? 0) + (r.canvas.cropOffsetY ?? 0);
}
function _o() {
  return r.cursor.x - r.canvas.cropOffsetX;
}
function Oo() {
  return r.cursor.y - r.canvas.cropOffsetY;
}
function uf(e, t) {
  var _a5;
  const { px1: o, py1: n, px2: s, py2: a, px3: l, py3: c, px4: u, py4: d } = e, f = Lr(t), p = Tr(t), h = (t == null ? void 0 : t.modes) ?? ((_a5 = r.vector.all[r.vector.currentIndex]) == null ? void 0 : _a5.modes) ?? r.tool.current.modes, y = h == null ? void 0 : h.cubicCurve, v = h == null ? void 0 : h.quadCurve;
  y && Number.isInteger(u) ? (Dr(i, f, p, o, n, l, c), Dr(i, f, p, s, a, u, d)) : (y || v) && Number.isInteger(l) && Dr(i, f, p, o, n, l, c);
  const g = [{ x: "px1", y: "py1" }, { x: "px2", y: "py2" }, ...v || y ? [{ x: "px3", y: "py3" }] : [], ...y ? [{ x: "px4", y: "py4" }] : []];
  t || S.drawControlPoints(e, g, false), S.drawControlPoints(e, g, true, t);
}
function df(e, t) {
  var _a5;
  const { px1: o, py1: n, px2: s, py2: a, px3: l, py3: c, px4: u, py4: d } = e, f = Lr(t), p = Tr(t), h = jt();
  i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.moveTo(f + o + 0.5, p + n + 0.5);
  const y = (t == null ? void 0 : t.modes) ?? ((_a5 = r.vector.all[r.vector.currentIndex]) == null ? void 0 : _a5.modes) ?? r.tool.current.modes, v = y == null ? void 0 : y.cubicCurve, g = y == null ? void 0 : y.quadCurve;
  if (v && Number.isInteger(u)) i.vectorGuiCTX.bezierCurveTo(f + l + 0.5, p + c + 0.5, f + u + 0.5, p + d + 0.5, f + s + 0.5, p + a + 0.5);
  else if ((v || g) && Number.isInteger(l)) i.vectorGuiCTX.quadraticCurveTo(f + l + 0.5, p + c + 0.5, f + s + 0.5, p + a + 0.5);
  else if (Number.isInteger(s)) i.vectorGuiCTX.lineTo(f + s + 0.5, p + a + 0.5);
  else return;
  Pt(i.vectorGuiCTX, h, "black", "white");
}
function ff(e, t) {
  const { px1: o, py1: n, px2: s, py2: a, px3: l, py3: c } = e, u = Lr(t), d = Tr(t);
  Number.isInteger(l) ? (Dr(i, u, d, o, n, l, c), Dr(i, u, d, o, n, s, a)) : Number.isInteger(s) && Dr(i, u, d, o, n, s, a);
  let f = [{ x: "px1", y: "py1" }, { x: "px2", y: "py2" }, { x: "px3", y: "py3" }];
  t || S.drawControlPoints(e, f, false), S.drawControlPoints(e, f, true, t);
}
function pf(e, t) {
  const { px1: o, py1: n, px2: s, py2: a, px3: l, py3: c, x1Offset: u, y1Offset: d } = e, f = Lr(t), p = Tr(t), h = jt(), y = 20 * h;
  function v(g, x) {
    const b = f + g + 0.5, O = p + x + 0.5, M = y / 3;
    i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.arc(b, O, M * 0.625, 0, 2 * Math.PI), i.vectorGuiCTX.lineWidth = h * 2, i.vectorGuiCTX.strokeStyle = "black", i.vectorGuiCTX.stroke(), i.vectorGuiCTX.fillStyle = "red", i.vectorGuiCTX.fill();
  }
  i.vectorGuiCTX.setLineDash([1, 1]), i.vectorGuiCTX.beginPath(), Number.isInteger(s) && (i.vectorGuiCTX.moveTo(f + o + 0.5 + u / 2, p + n + 0.5 + d / 2), i.vectorGuiCTX.lineTo(f + s + 0.5 + u / 2, p + a + 0.5 + d / 2)), Number.isInteger(l) && (i.vectorGuiCTX.moveTo(f + o + 0.5 + u / 2, p + n + 0.5 + d / 2), i.vectorGuiCTX.lineTo(f + l + 0.5 + u / 2, p + c + 0.5 + d / 2)), Pt(i.vectorGuiCTX, h, "black", "red"), i.vectorGuiCTX.setLineDash([]), Number.isInteger(s) && (v(o + u / 2, n + d / 2), v(s + u / 2, a + d / 2)), Number.isInteger(l) && v(l + u / 2, c + d / 2);
}
function hf(e, t) {
  const { px1: o, py1: n, px3: s, radA: a, radB: l, angle: c, x1Offset: u, y1Offset: d } = e, f = Lr(t), p = Tr(t), h = jt();
  let y = a + u / 2 > 0 ? a + u / 2 : 0, v = l + d / 2 > 0 ? l + d / 2 : 0;
  Number.isInteger(s) || (v = y), i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.ellipse(f + o + 0.5 + u / 2, p + n + 0.5 + d / 2, y, v, c + 4 * Math.PI, 0, c + 2 * Math.PI), Pt(i.vectorGuiCTX, h, "black", "white");
}
function vf(e, t) {
  const o = [{ x: "px1", y: "py1" }, { x: "px2", y: "py2" }, { x: "px3", y: "py3" }, { x: "px4", y: "py4" }], n = [{ x: "px0", y: "py0" }];
  t || (S.drawControlPoints(e, o, false), S.drawControlPoints(e, n, false)), S.drawControlPoints(e, o, true, t), S.drawControlPoints(e, n, true, t);
}
function yf(e, t) {
  const { px1: o, py1: n, px2: s, py2: a, px3: l, py3: c, px4: u, py4: d } = e;
  if (!Number.isInteger(l)) return;
  const f = Lr(t), p = Tr(t), h = jt();
  i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.moveTo(f + o + 0.5, p + n + 0.5), i.vectorGuiCTX.lineTo(f + s + 0.5, p + a + 0.5), i.vectorGuiCTX.lineTo(f + l + 0.5, p + c + 0.5), i.vectorGuiCTX.lineTo(f + u + 0.5, p + d + 0.5), i.vectorGuiCTX.closePath(), Pt(i.vectorGuiCTX, h, "black", "white");
}
function He(e, t, o, n, s) {
  e.vectorProperties[n] = t - e.layer.x, e.vectorProperties[s] = o - e.layer.y;
}
function mf(e, t, o, n, s) {
  var _a5;
  let a = 0, l = 0, c = 0;
  if (!["px1", "px2"].includes(t.xKey) && (a = e.vectorProperties[s.xKey] - e.vectorProperties[t.xKey], l = e.vectorProperties[s.yKey] - e.vectorProperties[t.yKey], !((_a5 = o.align) == null ? void 0 : _a5.active))) {
    const u = Pe(a, l), d = n[e.index], f = d[s.xKey] - d[t.xKey], p = d[s.yKey] - d[t.yKey], h = Pe(f, p);
    c = u - h;
  }
  return { currentDeltaX: a, currentDeltaY: l, currentDeltaAngle: c };
}
function gf(e, t, o, n, s, a, l, c, u, d) {
  var _a5, _b2, _c5, _d3, _e5, _f4, _g, _h4;
  let f, p, h, y;
  if (c.px1 ? (f = "px1", p = "py1", h = "px3", y = "py3") : c.px2 && (f = "px2", p = "py2", l.modes.quadCurve ? (h = "px3", y = "py3") : (h = "px4", y = "py4")), f) {
    if (["px1", "px2"].includes(a)) {
      if (He(l, e, t, f, p), (_a5 = d.hold) == null ? void 0 : _a5.active) {
        const v = u[f] - u[h], g = u[p] - u[y];
        He(l, e - v, t - g, h, y);
      }
    } else if (["px3", "px4"].includes(a) && (((_b2 = d.align) == null ? void 0 : _b2.active) || ((_c5 = d.hold) == null ? void 0 : _c5.active) || ((_d3 = d.equal) == null ? void 0 : _d3.active))) {
      const v = u[f] - u[h], g = u[p] - u[y];
      let x;
      ((_e5 = d.equal) == null ? void 0 : _e5.active) ? x = Math.sqrt(o ** 2 + n ** 2) : x = Math.sqrt(v ** 2 + g ** 2);
      let b;
      ((_f4 = d.align) == null ? void 0 : _f4.active) ? b = Pe(o, n) + Math.PI : ((_g = d.hold) == null ? void 0 : _g.active) ? b = Pe(v, g) + s : ((_h4 = d.equal) == null ? void 0 : _h4.active) && (b = Pe(v, g));
      const O = o - Math.round(Math.cos(b) * x), M = n - Math.round(Math.sin(b) * x);
      He(l, e + O, t + M, h, y);
    }
  }
}
function go(e, t) {
  if (!e) throw new Error(t || "Assertion failed");
}
function Wo(e, t, o, n, s, a, l) {
  let c = [], u = s - o, d = a - n, f = e - o, p = t - n, h, y, v, g, x = f * d - p * u;
  if (go(f * u <= 0 && p * d <= 0, "sign of gradient must not change"), u * u + d * d > f * f + p * p && (s = e, e = u + o, a = t, t = d + n, x = -x), x != 0) for (f += u, f *= u = e < s ? 1 : -1, p += d, p *= d = t < a ? 1 : -1, h = 2 * f * p, f *= f, p *= p, x * u * d < 0 && (f = -f, p = -p, h = -h, x = -x), y = 4 * d * x * (o - e) + f - h, v = 4 * u * x * (t - n) + p - h, f += f, p += p, g = y + v + h; v < y; ) {
    if (c.push({ x: e, y: t, color: l }), e == s && t == a) return c;
    n = 2 * g < y, 2 * g > v && (e += u, y -= h, g += v += p), n && (t += d, v -= h, g += y += f);
  }
  let b = Pe(s - e, a - t), O = ko(e, t, s, a, b);
  for (let M = 0; M < O.long; M++) {
    let w = { x: Math.round(e + O.x * M), y: Math.round(t + O.y * M) };
    c.push({ x: w.x, y: w.y, color: "rgba(0,255,30,1)" });
  }
  return c.push({ x: s, y: a, color: l }), c;
}
function bf(e, t, o, n, s, a, l, c, u) {
  let d = [], f, p, h, y = 1, v = e < l ? 1 : -1, g = t < c ? 1 : -1, x = -Math.abs(e + o - s - l), b = x - 4 * v * (o - s), O = v * (e - o - s + l), M = -Math.abs(t + n - a - c), w = M - 4 * g * (n - a), C = g * (t - n - a + c), k, _, L, E, I, P, A, G, K, D, $, H = 0.01;
  if (go((o - e) * (s - l) < H && ((l - e) * (o - s) < H || O * O < b * x + H), "Curve constraint violation"), go((n - t) * (a - c) < H && ((c - t) * (n - a) < H || C * C < w * M + H), "Curve constraint violation"), b == 0 && w == 0) return Wo(e, t, 3 * o - e >> 1, 3 * n - t >> 1, l, c, u);
  o = (o - e) * (o - e) + (n - t) * (n - t) + 1, s = (s - l) * (s - l) + (a - c) * (a - c) + 1;
  do {
    k = b * C - O * w, _ = b * M - x * w, L = O * M - x * C, D = k * (k + _ - 3 * L) + _ * _, f = D > 0 ? 1 : Math.floor(Math.sqrt(1 + 1024 / o)), k *= f, _ *= f, L *= f, D *= f * f, P = 9 * (k + _ + L) / 8, E = 8 * (b - w), G = 27 * (8 * k * (C * C - w * M) + D * (w + 2 * C + M)) / 64 - w * w * (P - w), K = 27 * (8 * k * (O * O - b * x) - D * (b + 2 * O + x)) / 64 - b * b * (P + b), I = 3 * (3 * k * (3 * C * C - w * w - 2 * w * M) - w * (3 * _ * (w + C) + w * E)) / 4, A = 3 * (3 * k * (3 * O * O - b * b - 2 * b * x) - b * (3 * _ * (b + O) + b * E)) / 4, P = b * w * (6 * k + 6 * _ - 3 * L + E), _ = w * w, E = b * b, P = 3 * (P + 9 * f * (E * C * M - O * x * _) - 18 * O * C * k) / 8, D < 0 && (G = -G, K = -K, I = -I, A = -A, P = -P, _ = -_, E = -E), k = 6 * w * _, _ = -6 * b * _, L = 6 * w * E, E = -6 * b * E, G += P, D = G + K, K += P;
    e: for ($ = 0, p = h = f; e != l && t != c; ) {
      d.push({ x: e, y: t, color: u });
      do {
        if ($ == 0 && (G > P || K < P) || $ == 1 && (G > 0 || K < 0)) break e;
        if (n = 2 * D - K, 2 * D >= G) p--, D += G += I, K += P += _, A += L, I += k;
        else if (n > 0) break e;
        n <= 0 && (h--, D += K += A, G += P += L, I += _, A += E);
      } while (p > 0 && h > 0);
      2 * p <= f && (e += v, p += f), 2 * h <= f && (t += g, h += f), $ == 0 && G < 0 && K > 0 && ($ = 1);
    }
    I = e, e = l, l = I, v = -v, O = -O, A = t, t = c, c = A, g = -g, C = -C, o = s;
  } while (y--);
  let J = Pe(l - e, c - t), Z = ko(e, t, l, c, J);
  for (let V = 0; V < Z.long; V++) {
    let Q = { x: Math.round(e + Z.x * V), y: Math.round(t + Z.y * V) };
    d.push({ x: Q.x, y: Q.y, color: "rgba(0,255,30,1)" });
  }
  return d.push({ x: l, y: c, color: u }), d;
}
function Ar(e, t, o, n, s, a, l) {
  let c = [];
  var u = s - o, d = a - n, f = e - s, p = t - a, h = e - o, y = t - n, v = h * d + y * u, g = h * d - y * u, x;
  if (go(h * u <= 0 && y * d <= 0), g != 0 && l > 0) {
    if (u * u + d * d > h * h + y * y && (s = e, e -= f, a = t, t -= p, g = -g), h = 2 * (4 * l * u * h + f * f), y = 2 * (4 * l * d * y + p * p), u = e < s ? 1 : -1, d = t < a ? 1 : -1, v = -2 * u * d * (2 * l * v + f * p), g * u * d < 0 && (h = -h, y = -y, v = -v, g = -g), f = 4 * l * (o - e) * d * g + h / 2 + v, p = 4 * l * (t - n) * u * g + y / 2 + v, l < 0.5 && (p > v || f < v)) return g = (l + 1) / 2, l = Math.sqrt(l), v = 1 / (l + 1), u = Math.floor((e + 2 * l * o + s) * v / 2 + 0.5), d = Math.floor((t + 2 * l * n + a) * v / 2 + 0.5), f = Math.floor((l * o + e) * v + 0.5), p = Math.floor((n * l + t) * v + 0.5), c = [...c, ...Ar(e, t, f, p, u, d, g)], f = Math.floor((l * o + s) * v + 0.5), p = Math.floor((n * l + a) * v + 0.5), c = [...c, ...Ar(u, d, f, p, s, a, g)], c;
    x = f + p - v;
    do {
      if (c.push({ x: e, y: t }), e == s && t == a) return c;
      o = 2 * x > p, n = 2 * (x + y) < -p, (2 * x < f || n) && (t += d, p += v, x += f += h), (2 * x > f || o) && (e += u, f += v, x += p += y);
    } while (p <= v && f >= v);
  }
  let b = Pe(s - e, a - t), O = ko(e, t, s, a, b);
  for (let M = 0; M < O.long; M++) {
    let w = { x: Math.round(e + O.x * M), y: Math.round(t + O.y * M) };
    c.push({ x: w.x, y: w.y });
  }
  return c.push({ x: s, y: a }), c;
}
function xf(e, t, o, n, s, a) {
  let l = [], c = e - o, u = t - n, d = e - 2 * o + s, f;
  c * (s - o) > 0 && (u * (a - n) > 0 && Math.abs((t - 2 * n + a) * c / d) > Math.abs(u) && (e = s, s = c + o, t = a, a = u + n), d = (e - o) / d, f = (1 - d) * ((1 - d) * t + 2 * d * n) + d * d * a, d = (e * s - o * o) * d / (e - o), c = Math.floor(d + 0.5), u = Math.floor(f + 0.5), f = (n - t) * (d - e) / (o - e) + t, l = [...l, ...Wo(e, t, c, Math.floor(f + 0.5), c, u, "rgba(255,0,0,255)")], f = (n - a) * (d - s) / (o - s) + a, e = o = c, t = u, n = Math.floor(f + 0.5)), (t - n) * (a - n) > 0 && (d = t - 2 * n + a, d = (t - n) / d, f = (1 - d) * ((1 - d) * e + 2 * d * o) + d * d * s, d = (t * a - n * n) * d / (t - n), c = Math.floor(f + 0.5), u = Math.floor(d + 0.5), f = (o - e) * (d - t) / (n - t) + e, l = [...l, ...Wo(e, t, Math.floor(f + 0.5), u, c, u, "rgba(0,255,0,255)")], f = (o - s) * (d - a) / (n - a) + s, e = c, o = Math.floor(f + 0.5), t = n = u), l = [...l, ...Wo(e, t, o, n, s, a, "rgba(0,0,255,255)")];
  const p = /* @__PURE__ */ new Set();
  return l = l.filter((h) => {
    let y = h.y << 16 | h.x;
    return p.has(y) ? false : (p.add(y), true);
  }), l;
}
function Sf(e, t, o, n, s, a, l, c) {
  let u = [], d = 0, f = 0, p = e + o - s - l, h = p - 4 * (o - s), y = e - o - s + l, v = y + 4 * (o + s), g = t + n - a - c, x = g - 4 * (n - a), b = t - n - a + c, O = b + 4 * (n + a), M = e, w, C, k, _ = t, L, E, I, P = y * y - h * p, A, G = Array(5).fill(0);
  for (h === 0 ? Math.abs(p) < 2 * Math.abs(y) && (G[d++] = p / (2 * y)) : P > 0 && (A = Math.sqrt(P), P = (y - A) / h, Math.abs(P) < 1 && (G[d++] = P), P = (y + A) / h, Math.abs(P) < 1 && (G[d++] = P)), P = b * b - x * g, x === 0 ? Math.abs(g) < 2 * Math.abs(b) && (G[d++] = g / (2 * b)) : P > 0 && (A = Math.sqrt(P), P = (b - A) / x, Math.abs(P) < 1 && (G[d++] = P), P = (b + A) / x, Math.abs(P) < 1 && (G[d++] = P)), f = 1; f < d; f++) (P = G[f - 1]) > G[f] && (G[f - 1] = G[f], G[f] = P, f = 0);
  P = -1, G[d] = 1;
  let K = ["rgba(216,24,24,255)", "rgba(35,199,197,255)", "rgba(255,0,255,255)", "rgba(255,213,0,255)", "rgba(35,101,199,255)"];
  for (f = 0; f <= d; f++) A = G[f], w = (P * (P * y - 2 * p) - A * (P * (P * h - 2 * y) + p) + v) / 8 - M, L = (P * (P * b - 2 * g) - A * (P * (P * x - 2 * b) + g) + O) / 8 - _, C = (A * (A * y - 2 * p) - P * (A * (A * h - 2 * y) + p) + v) / 8 - M, E = (A * (A * b - 2 * g) - P * (A * (A * x - 2 * b) + g) + O) / 8 - _, M -= k = (A * (A * (3 * y - A * h) - 3 * p) + v) / 8, _ -= I = (A * (A * (3 * b - A * x) - 3 * g) + O) / 8, l = Math.trunc(k + 0.5), c = Math.trunc(I + 0.5), M !== 0 && (w *= M = (e - l) / M, C *= M), _ !== 0 && (L *= _ = (t - c) / _, E *= _), (e !== l || t !== c) && (u = [...u, ...bf(e, t, e + w, t + L, e + C, t + E, l, c, K[f])]), e = l, t = c, M = k, _ = I, P = A;
  const D = /* @__PURE__ */ new Set();
  return u = u.filter(($) => {
    let H = $.y << 16 | $.x;
    return D.has(H) ? false : (D.add(H), true);
  }), u;
}
function Cf(e, t, o, n) {
  let s = [], a = Math.abs(o - e), l = Math.abs(n - t), c = l & 1, u = 4 * (1 - a) * l * l, d = 4 * (c + 1) * a * a, f = u + d + c * a * a, p;
  e > o && (e = o, o += a), t > n && (t = n), t += l + 1 >> 1, n = t - c, a = 8 * a * a, c = 8 * l * l;
  do
    s.push({ x: o, y: t }), s.push({ x: e, y: t }), s.push({ x: e, y: n }), s.push({ x: o, y: n }), p = 2 * f, p <= d && (t++, n--, f += d += a), (p >= u || 2 * f > d) && (e++, o--, f += u += c);
  while (e <= o);
  for (; t - n <= l; ) s.push({ x: e - 1, y: t }), s.push({ x: o + 1, y: t++ }), s.push({ x: e - 1, y: n }), s.push({ x: o + 1, y: n-- });
  const h = /* @__PURE__ */ new Set();
  return s = s.filter((y) => {
    let v = y.y << 16 | y.x;
    return h.has(v) ? false : (h.add(v), true);
  }), s;
}
function Cr(e, t, o, n, s, a, l) {
  let c = o * o, u = n * n, d = Math.sin(s), f = (c - u) * d;
  c = Math.sqrt(c - f * d), u = Math.sqrt(u + f * d), o = Math.floor(c + 0.5), n = Math.floor(u + 0.5), f = f * o * n / (c * u), f = 4 * f * Math.cos(s);
  let p = e - o, h = t - n, y = e + o + a, v = t + n + l, g = y - p, x = v - h, b = g * x;
  return b != 0 && (b = (b - f) / (b + b)), b <= 1 && b >= 0 || (y = y - a, v = v - l, g = y - p, x = v - h, b = g * x, b != 0 && (b = (b - f) / (b + b))), go(b <= 1 && b >= 0), g = Math.floor(g * b + 0.5), x = Math.floor(x * b + 0.5), { weight: b, leftTangentX: p, leftTangentY: h + x, topTangentX: p + g, topTangentY: h, rightTangentX: y, rightTangentY: v - x, bottomTangentX: y - g, bottomTangentY: v };
}
function wf(e, t, o, n, s, a, l, c, u, d, f, p) {
  const h = () => Yo(1 - e, t, o, t, s, n, s, d, f), y = () => Yo(e, n, s, a, s, a, l, d, f), v = () => Yo(1 - e, a, l, a, u, c, u, d, f), g = () => Yo(e, c, u, t, u, t, o, d, f);
  let x, b, O, M, w, C;
  switch (true) {
    case p <= Math.PI / 2: {
      w = v(), C = y();
      break;
    }
    case p <= Math.PI: {
      w = g(), C = v();
      break;
    }
    case p <= 3 * Math.PI / 2: {
      w = h(), C = g();
      break;
    }
    case p <= 2 * Math.PI: {
      w = y(), C = h();
      break;
    }
  }
  return w.minorRadius > C.minorRadius ? (x = Math.round(w.majorX), b = Math.round(w.majorY), O = Math.round(C.minorX), M = Math.round(C.minorY)) : (x = Math.round(w.minorX), b = Math.round(w.minorY), O = Math.round(C.majorX), M = Math.round(C.majorY)), { px2: x, py2: b, px3: O, py3: M };
}
function oi(e, t, o, n = 1e-5, s = true) {
  const a = (Math.sqrt(5) + 1) / 2;
  let l = t - (t - e) / a, c = e + (t - e) / a;
  for (; Math.abs(l - c) > n; ) (s ? o(l) > o(c) : o(l) < o(c)) ? t = c : e = l, l = t - (t - e) / a, c = e + (t - e) / a;
  return (t + e) / 2;
}
function Cn(e, t, o, n, s, a, l, c) {
  const u = Math.sqrt(c), d = 1 - e, f = d * d + 2 * u * d * e + e * e, p = (d * d * t + 2 * u * d * e * n + e * e * a) / f, h = (d * d * o + 2 * u * d * e * s + e * e * l) / f;
  return { x: p, y: h };
}
function Yo(e, t, o, n, s, a, l, c, u) {
  const d = (v) => {
    const g = Cn(v, t, o, n, s, a, l, e);
    return Math.sqrt((g.x - c) ** 2 + (g.y - u) ** 2);
  }, f = oi(0, 1, d, 1e-5, true), p = oi(0, 1, d, 1e-5, false), h = Cn(f, t, o, n, s, a, l, e), y = Cn(p, t, o, n, s, a, l, e);
  return { majorRadius: d(f), majorX: h.x, majorY: h.y, minorRadius: d(p), minorX: y.x, minorY: y.y };
}
function Mf(e, t, o, n, s, a, l, c, u) {
  if (e === 0.5) return Cf(t, s, a, u);
  let d = [];
  d = [...d, ...Ar(t, o, t, s, n, s, 1 - e)], d = [...d, ...Ar(t, o, t, u, c, u, e)], d = [...d, ...Ar(a, l, a, u, c, u, 1 - e)], d = [...d, ...Ar(a, l, a, s, n, s, e)];
  const f = /* @__PURE__ */ new Set();
  return d = d.filter((p) => {
    let h = p.y << 16 | p.x;
    return f.has(h) ? false : (f.add(h), true);
  }), d;
}
function kf(e, t, o, n) {
  let s = Math.round(e + o * Math.cos(n)), a = Math.round(t + o * Math.sin(n));
  return { x: s, y: a };
}
function Jn(e, t, o, n, s, a) {
  let l = Pe(o - e, n - t);
  return kf(e, t, a, l + s);
}
function Pf(e, t, o) {
  const n = Math.tan(o), s = n !== 0 ? -1 / n : 9e7, a = 7 - s * 7, l = s * e + a;
  return o = o % (2 * Math.PI), t > l ? o <= Math.PI && o > 0 ? 0 : 1 : o <= Math.PI && o > 0 ? 1 : 0;
}
function jr(e, t, o, n, s = false, a = false) {
  const l = t.width, c = t.height, u = n * Math.PI / 180, d = Math.cos(u), f = Math.sin(u), p = Math.round(Math.abs(l * d) + Math.abs(c * f)), h = Math.round(Math.abs(l * f) + Math.abs(c * d)), y = Math.abs(o.xMax - o.xMin), v = Math.abs(o.yMax - o.yMin);
  if (e.ctx.clearRect(0, 0, e.cvs.width, e.cvs.height), y === 0 || v === 0) return;
  const g = new ImageData(p, h), x = l / 2, b = c / 2, O = p / 2, M = h / 2;
  for (let C = 0; C < c; C++) for (let k = 0; k < l; k++) {
    const _ = k - x, L = C - b;
    let E = d * _ - f * L + O, I = f * _ + d * L + M;
    (n === 90 || n === 180) && (E -= 1), (n === 180 || n === 270) && (I -= 1);
    const P = Math.round(E), A = Math.round(I);
    if (P >= 0 && P < p && A >= 0 && A < h) {
      const G = (A * p + P) * 4, K = (C * l + k) * 4;
      for (let D = 0; D < 4; D++) g.data[G + D] = t.data[K + D];
    }
  }
  const w = new ImageData(y, v);
  for (let C = 0; C < v; C++) for (let k = 0; k < y; k++) {
    let _ = Math.floor(k / (y / p)), L = Math.floor(C / (v / h));
    s && (_ = p - 1 - _), a && (L = h - 1 - L);
    const E = (L * p + _) * 4, I = (C * y + k) * 4;
    for (let P = 0; P < 4; P++) w.data[I + P] = g.data[E + P];
  }
  e.ctx.putImageData(w, Math.min(o.xMin, o.xMax), Math.min(o.yMin, o.yMax));
}
function _f(e) {
  const { px1: t, py1: o, radA: n, radB: s, angle: a, x1Offset: l, y1Offset: c } = e, u = a, d = Math.cos(u), f = Math.sin(u), p = Math.sqrt(n * n * d * d + s * s * f * f), h = Math.sqrt(n * n * f * f + s * s * d * d), y = Math.round(t - p), v = Math.round(t + p + l), g = Math.round(o - h), x = Math.round(o + h + c);
  return { xMin: y, yMin: g, xMax: v, yMax: x };
}
function Of(e, t, o, n, s = false, a = false) {
  const l = Math.abs(o.xMax - 1 - o.xMin), c = Math.abs(o.yMax - 1 - o.yMin), u = Math.abs(n.xMax - 1 - n.xMin), d = Math.abs(n.yMax - 1 - n.yMin);
  if (l === 0 || c === 0) return;
  const f = u / l, p = d / c, h = n.xMin - o.xMin * f, y = n.yMin - o.yMin * p;
  for (let g in t) {
    let x = { ...t[g] }, b = e[g];
    if (x.tool === "ellipse") {
      if (v(b, x, "leftTangentX", "leftTangentY", f, p, h, y, s, a), v(b, x, "topTangentX", "topTangentY", f, p, h, y, s, a), v(b, x, "rightTangentX", "rightTangentY", f, p, h, y, s, a), v(b, x, "bottomTangentX", "bottomTangentY", f, p, h, y, s, a), x.angle % Math.PI / 2 === 0) {
        v(b, x, "px1", "py1", f, p, h, y, s, a), v(b, x, "px2", "py2", f, p, h, y, s, a), v(b, x, "px3", "py3", f, p, h, y, s, a);
        let O = b.vectorProperties.px2 - b.vectorProperties.px1, M = b.vectorProperties.py2 - b.vectorProperties.py1;
        b.vectorProperties.radA = Math.sqrt(O * O + M * M);
        let w = b.vectorProperties.px3 - b.vectorProperties.px1, C = b.vectorProperties.py3 - b.vectorProperties.py1;
        b.vectorProperties.radB = Math.sqrt(w * w + C * C);
      } else {
        const O = Math.round(b.vectorProperties.leftTangentX + (b.vectorProperties.rightTangentX - b.vectorProperties.leftTangentX) / 2), M = Math.round(b.vectorProperties.topTangentY + (b.vectorProperties.bottomTangentY - b.vectorProperties.topTangentY) / 2), { px2: w, py2: C, px3: k, py3: _ } = wf(b.vectorProperties.weight, b.vectorProperties.leftTangentX, b.vectorProperties.leftTangentY, b.vectorProperties.topTangentX, b.vectorProperties.topTangentY, b.vectorProperties.rightTangentX, b.vectorProperties.rightTangentY, b.vectorProperties.bottomTangentX, b.vectorProperties.bottomTangentY, O, M, x.angle);
        b.vectorProperties.px1 = O, b.vectorProperties.py1 = M, b.vectorProperties.px2 = w, b.vectorProperties.py2 = C, b.vectorProperties.px3 = k, b.vectorProperties.py3 = _;
        let L = w - O, E = C - M;
        b.vectorProperties.radA = Math.sqrt(L * L + E * E);
        let I = k - O, P = _ - M;
        b.vectorProperties.radB = Math.sqrt(I * I + P * P);
        let A = Pe(L, E);
        for (; A < 0; ) A += 2 * Math.PI;
        b.vectorProperties.angle = A;
      }
      b.vectorProperties.x1Offset = (b.vectorProperties.rightTangentX - b.vectorProperties.leftTangentX) % 2 === 0 ? 0 : -1, b.vectorProperties.y1Offset = (b.vectorProperties.bottomTangentY - b.vectorProperties.topTangentY) % 2 === 0 ? 0 : -1, b.vectorProperties.unifiedOffset = b.vectorProperties.x1Offset * b.vectorProperties.y1Offset;
    } else v(b, x, "px1", "py1", f, p, h, y, s, a), v(b, x, "px2", "py2", f, p, h, y, s, a), v(b, x, "px3", "py3", f, p, h, y, s, a), v(b, x, "px4", "py4", f, p, h, y, s, a), Object.hasOwn(x, "px0") && (b.vectorProperties.px0 = Math.round((b.vectorProperties.px1 + b.vectorProperties.px3) / 2), b.vectorProperties.py0 = Math.round((b.vectorProperties.py1 + b.vectorProperties.py3) / 2));
  }
  function v(g, x, b, O, M, w, C, k, _, L) {
    if (x[b] != null) {
      let E = x[b] + g.layer.x, I = x[O] + g.layer.y, P = E * M + C, A = I * w + k;
      _ && (P = n.xMax - P + n.xMin), L && (A = n.yMax - A + n.yMin), P = Math.round(P), A = Math.round(A), He(g, P, A, b, O);
    }
  }
}
function Lf(e) {
  let t = 0, o = 0;
  const n = e.length;
  for (let l = 0; l < n; l++) t += e[l][0], o += e[l][1];
  const s = Math.round(t / n), a = Math.round(o / n);
  return [s, a];
}
function ni(e, t, o, n, s) {
  for (const [a, l] of Object.entries(t)) {
    const c = o[parseInt(a)];
    if ([1, 2, 3, 4].forEach((d) => {
      const f = `px${d}`, p = `py${d}`;
      l[f] != null && l[p] != null && He(c, l[f] + n + e.x, l[p] + s + e.y, f, p);
    }), "px0" in l && (c.vectorProperties.px0 = Math.round((c.vectorProperties.px1 + c.vectorProperties.px3) / 2), c.vectorProperties.py0 = Math.round((c.vectorProperties.py1 + c.vectorProperties.py3) / 2)), l.tool === "ellipse") {
      const d = Cr(c.vectorProperties.px1, c.vectorProperties.py1, c.vectorProperties.radA, c.vectorProperties.radB, c.vectorProperties.angle, c.vectorProperties.x1Offset, c.vectorProperties.y1Offset);
      c.vectorProperties.weight = d.weight, c.vectorProperties.leftTangentX = d.leftTangentX, c.vectorProperties.leftTangentY = d.leftTangentY, c.vectorProperties.topTangentX = d.topTangentX, c.vectorProperties.topTangentY = d.topTangentY, c.vectorProperties.rightTangentX = d.rightTangentX, c.vectorProperties.rightTangentY = d.rightTangentY, c.vectorProperties.bottomTangentX = d.bottomTangentX, c.vectorProperties.bottomTangentY = d.bottomTangentY;
    }
  }
}
function si(e, t, o, n, s, a, l, c, u) {
  const d = Pe(n - c, s - u), f = Pe(a - c, l - u), p = d - f;
  for (const [h, y] of Object.entries(t)) {
    const v = o[h];
    for (let g = 1; g <= 4; g++) if (y[`px${g}`] != null && y[`py${g}`] != null) {
      const x = `px${g}`, b = `py${g}`, O = Math.cos(p), M = Math.sin(p), w = y[x] + e.x, C = y[b] + e.y, k = Math.floor(O * (w - c) - M * (C - u) + c), _ = Math.floor(M * (w - c) + O * (C - u) + u);
      He(v, k, _, x, b);
    }
    if ("px0" in y && (v.vectorProperties.px0 = Math.round((v.vectorProperties.px1 + v.vectorProperties.px3) / 2), v.vectorProperties.py0 = Math.round((v.vectorProperties.py1 + v.vectorProperties.py3) / 2)), y.tool === "ellipse") {
      for (v.vectorProperties.angle = Pe(v.vectorProperties.px2 - v.vectorProperties.px1, v.vectorProperties.py2 - v.vectorProperties.py1); v.vectorProperties.angle < 0; ) v.vectorProperties.angle += 2 * Math.PI;
      v.vectorProperties.radA = Math.sqrt((v.vectorProperties.px1 - v.vectorProperties.px2) ** 2 + (v.vectorProperties.py1 - v.vectorProperties.py2) ** 2), v.vectorProperties.radB = Math.sqrt((v.vectorProperties.px1 - v.vectorProperties.px3) ** 2 + (v.vectorProperties.py1 - v.vectorProperties.py3) ** 2);
      const g = Cr(v.vectorProperties.px1, v.vectorProperties.py1, v.vectorProperties.radA, v.vectorProperties.radB, v.vectorProperties.angle, v.vectorProperties.x1Offset, v.vectorProperties.y1Offset);
      v.vectorProperties.weight = g.weight, v.vectorProperties.leftTangentX = g.leftTangentX, v.vectorProperties.leftTangentY = g.leftTangentY, v.vectorProperties.topTangentX = g.topTangentX, v.vectorProperties.topTangentY = g.topTangentY, v.vectorProperties.rightTangentX = g.rightTangentX, v.vectorProperties.rightTangentY = g.rightTangentY, v.vectorProperties.bottomTangentX = g.bottomTangentX, v.vectorProperties.bottomTangentY = g.bottomTangentY;
    }
  }
}
function ks(e, t) {
  const o = [];
  return e.forEach((n) => {
    const s = t[n].vectorProperties;
    for (let a = 1; a <= 4; a++) if (s[`px${a}`] != null && s[`py${a}`] != null) {
      const l = `px${a}`, c = `py${a}`;
      o.push([s[l], s[c]]);
    }
  }), Lf(o);
}
function Tf(e, t) {
  let [o, n, s, a] = [null, null, null, null];
  for (const c of e) {
    const u = t[c], d = [], f = [];
    if (u.vectorProperties.tool === "ellipse") {
      const p = _f(u.vectorProperties);
      d.push(p.xMin, p.xMax), f.push(p.yMin, p.yMax);
    } else for (let p = 1; p <= 4; p++) u.vectorProperties[`px${p}`] != null && u.vectorProperties[`py${p}`] != null && (d.push(u.vectorProperties[`px${p}`]), f.push(u.vectorProperties[`py${p}`]));
    o = Math.min(o ?? 1 / 0, ...d), n = Math.max(n ?? -1 / 0, ...d), s = Math.min(s ?? 1 / 0, ...f), a = Math.max(a ?? -1 / 0, ...f);
  }
  let l = t[e.values().next().value].layer;
  return o += l.x, n += l.x, s += l.y, a += l.y, { xMin: o, xMax: n, yMin: s, yMax: a };
}
function wn(e) {
  r.vector.transformMode = e, S.render();
}
function If() {
  S.mother.rotationOrigin.x = r.vector.shapeCenterX, S.mother.rotationOrigin.y = r.vector.shapeCenterY, r.cursor.clicked && r.vector.grabStartAngle !== null && (S.mother.newRotation = Pe(S.mother.rotationOrigin.x - (r.cursor.x - r.canvas.cropOffsetX), S.mother.rotationOrigin.y - (r.cursor.y - r.canvas.cropOffsetY)) - r.vector.grabStartAngle + S.mother.currentRotation);
}
function Xf(e, t) {
  const o = S.selectedPoint.xKey === "rotationx", n = !o && Po(r.cursor.x, r.cursor.y, e.rotationx + r.canvas.cropOffsetX, e.rotationy + r.canvas.cropOffsetY, t), s = o || n;
  return s && (S.setCollision({ x: "rotationx", y: "rotationy" }), i.vectorGuiCVS.style.cursor = r.cursor.clicked ? "grabbing" : "grab"), s;
}
function Ef(e, t, o, n, s) {
  const l = Math.round(96);
  i.vectorGuiCTX.beginPath();
  for (let c = 0; c <= l; c++) {
    const u = c / l, d = u * 2 * 2 * Math.PI, f = n + u * (s - n), p = e + Math.cos(d) * f, h = t + Math.sin(d) * f;
    c === 0 ? i.vectorGuiCTX.moveTo(p, h) : i.vectorGuiCTX.lineTo(p, h);
  }
  Pt(i.vectorGuiCTX, o * 2, "black", "white");
}
function Bf(e, t, o) {
  i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.arc(e, t, o * 6, 0, 2 * Math.PI), i.vectorGuiCTX.lineWidth = o * 4, i.vectorGuiCTX.strokeStyle = "black", i.vectorGuiCTX.stroke(), i.vectorGuiCTX.fillStyle = "white", i.vectorGuiCTX.fill();
}
function zf(e, t, o, n) {
  const s = n + o * 8, a = o * 12, l = o * 12, c = o * 2, u = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [d, f] of u) {
    const p = -f, h = d, y = { x: e + d * (s + a), y: t + f * (s + a) }, v = { x: e + d * s + p * l, y: t + f * s + h * l }, g = { x: e + d * s - p * l, y: t + f * s - h * l };
    i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.moveTo((g.x + y.x) / 2, (g.y + y.y) / 2), i.vectorGuiCTX.arcTo(y.x, y.y, v.x, v.y, c), i.vectorGuiCTX.arcTo(v.x, v.y, g.x, g.y, c), i.vectorGuiCTX.arcTo(g.x, g.y, y.x, y.y, c), i.vectorGuiCTX.closePath(), i.vectorGuiCTX.fillStyle = "white", i.vectorGuiCTX.fill(), i.vectorGuiCTX.lineWidth = o * 2, i.vectorGuiCTX.strokeStyle = "black", i.vectorGuiCTX.stroke();
  }
}
function Yf() {
  If();
  const e = jt(0.5), t = 48 * e, o = { rotationx: S.mother.rotationOrigin.x, rotationy: S.mother.rotationOrigin.y }, n = i.xOffset + o.rotationx + r.canvas.cropOffsetX + 0.5, s = i.yOffset + o.rotationy + r.canvas.cropOffsetY + 0.5, a = e, l = t - e * 2, c = Xf(o, t * 0.75);
  i.vectorGuiCTX.save(), i.vectorGuiCTX.lineCap = "round", Ef(n, s, e, a, l), Bf(n, s, e), c && zf(n, s, e, l), i.vectorGuiCTX.restore();
}
function Lo() {
  const e = Tf(r.vector.selectedIndices, r.vector.all), { cropOffsetX: t, cropOffsetY: o } = r.canvas;
  r.selection.properties.px1 = e.xMin + t, r.selection.properties.py1 = e.yMin + o, r.selection.properties.px2 = e.xMax + 1 + t, r.selection.properties.py2 = e.yMax + 1 + o, r.selection.setBoundaryBox(r.selection.properties);
}
let nn = 0, uo = 0, Vr = null;
function Af() {
  return 1 / (2 * Math.max(1, Math.round(i.zoom / 20)));
}
let ii = null, ai = null, li = null, ci = null;
function Rf(e) {
  const t = new Path2D(), o = i.xOffset, n = i.yOffset;
  for (const s of e) {
    const a = s & 65535, l = s >> 16 & 65535;
    e.has(l - 1 << 16 | a) || (t.moveTo(o + a, n + l), t.lineTo(o + a + 1, n + l)), e.has(l + 1 << 16 | a) || (t.moveTo(o + a + 1, n + l + 1), t.lineTo(o + a, n + l + 1)), e.has(l << 16 | a - 1) || (t.moveTo(o + a, n + l + 1), t.lineTo(o + a, n + l)), e.has(l << 16 | a + 1) || (t.moveTo(o + a + 1, n + l), t.lineTo(o + a + 1, n + l + 1));
  }
  return t;
}
let Zn = _r;
function Aa() {
  uo = Af(), nn = (nn + uo * 0.03125) % 1, Vr = requestAnimationFrame(Aa), Zn();
}
function Ra(e = _r) {
  if (Vr !== null) {
    e !== _r && (Zn = e);
    return;
  }
  Zn = e, Vr = requestAnimationFrame(Aa);
}
function Ps() {
  Vr !== null && (cancelAnimationFrame(Vr), Vr = null);
}
function Kf(e, t, o = null) {
  e.lineWidth = t * 4, e.strokeStyle = "black", o ? e.stroke(o) : e.stroke(), e.lineWidth = t * 2, e.strokeStyle = "white", o ? e.stroke(o) : e.stroke();
}
function _s(e, t = 1 / i.zoom, o = null) {
  e.lineWidth = t, e.setLineDash([uo, uo]), e.strokeStyle = "white", e.lineDashOffset = nn, o ? e.stroke(o) : e.stroke(), e.strokeStyle = "black", e.lineDashOffset = nn + uo, o ? e.stroke(o) : e.stroke(), e.setLineDash([]);
}
function Df() {
  const e = r.selection.maskSet;
  if (!e || e.size === 0) return;
  const t = i.selectionGuiCTX;
  t.save(), (e !== ai || i.xOffset !== li || i.yOffset !== ci) && (ai = e, li = i.xOffset, ci = i.yOffset, ii = Rf(e)), _s(t, void 0, ii), t.restore();
}
function Vf(e) {
  const t = i.selectionGuiCTX, o = jt();
  if (t.save(), t.lineCap = "round", r.selection.boundaryBox.xMax !== null && (t.beginPath(), t.rect(i.xOffset + r.selection.boundaryBox.xMin, i.yOffset + r.selection.boundaryBox.yMin, r.selection.boundaryBox.xMax - r.selection.boundaryBox.xMin, r.selection.boundaryBox.yMax - r.selection.boundaryBox.yMin), !i.pastedLayer && i.currentLayer.type !== "reference" ? _s(t) : Kf(t, o)), e) {
    const n = i.zoom <= 4 ? 8 / i.zoom : 1.5, s = [{ x: "px1", y: "py1" }, { x: "px2", y: "py2" }, { x: "px3", y: "py3" }, { x: "px4", y: "py4" }, { x: "px5", y: "py5" }, { x: "px6", y: "py6" }, { x: "px7", y: "py7" }, { x: "px8", y: "py8" }];
    Ka(r.selection.boundaryBox, s, n / 2, true, 0.5);
  }
  t.restore();
}
function _r() {
  const e = i.selectionGuiCTX;
  if (e.clearRect(0, 0, i.selectionGuiCVS.width, i.selectionGuiCVS.height), r.selection.boundaryBox.xMax !== null) if (Ra(), !r.selection.maskSet && !r.canvas.resizeOverlayActive && Ya(e), r.selection.maskSet) Df();
  else {
    const o = r.tool.current.name === "select" || r.tool.current.name === "move" && i.pastedLayer || i.currentLayer.type === "reference" || r.vector.transformMode === cr;
    Vf(o);
  }
  else r.canvas.resizeOverlayActive || Ps();
}
function Ka(e, t, o, n = false, s = 0, a = null, l = i.selectionGuiCTX) {
  const { xMin: c, yMin: u, xMax: d, yMax: f } = e, p = c + (d - c) / 2, h = u + (f - u) / 2;
  r.cursor.x >= c && r.cursor.x < d && r.cursor.y >= u && r.cursor.y < f && S.setCollision({ x: "px9", y: "py9" });
  const y = [{ x: c, y: u }, { x: p, y: u }, { x: d, y: u }, { x: d, y: h }, { x: d, y: f }, { x: p, y: f }, { x: c, y: f }, { x: c, y: h }];
  for (const v of t) {
    const g = y[t.indexOf(v)];
    $f(v, g, o, n, s, a, e, l);
  }
  Gf();
}
function $f(e, t, o, n, s, a, l, c) {
  let u = r.tool.touch ? o * 2 : o;
  const d = a ? a.layer.x : 0, f = a ? a.layer.y : 0;
  n && (Po(r.cursor.x, r.cursor.y, t.x - s + d, t.y - s + f, u * 2.125) || ["px2", "px6"].includes(e.x) && ri(r.cursor.x, r.cursor.y, l.xMin + u * 2, t.y - s + f - u * 2, l.xMax - u * 2 - 1, t.y - s + f + u * 2) || ["px4", "px8"].includes(e.x) && ri(r.cursor.x, r.cursor.y, t.x - s + d - u * 2, l.yMin + u * 2, t.x - s + d + u * 2, l.yMax - u * 2 - 1) ? (u = o * 2.125, S.setCollision(e)) : S.selectedPoint.xKey === e.x && !a && S.setCollision(e));
  const p = i.zoom <= 8 ? 1 / i.zoom : 1 / 8, h = i.xOffset + d + t.x - s + 0.5, y = i.yOffset + f + t.y - s + 0.5;
  ["px1", "px3", "px5", "px7"].includes(e.x) ? (c.beginPath(), c.rect(h - u, y - u, u * 2, u * 2), c.lineWidth = p * 2, c.strokeStyle = "black", c.stroke(), c.fillStyle = "white", c.fill()) : ["px2", "px4", "px6", "px8"].includes(e.x) && (u *= Math.sqrt(2), c.beginPath(), c.moveTo(h - u, y), c.lineTo(h, y - u), c.lineTo(h + u, y), c.lineTo(h, y + u), c.closePath(), c.lineWidth = p * 2, c.strokeStyle = "black", c.stroke(), c.fillStyle = "white", c.fill());
}
function Gf() {
  if (!S.selectedCollisionPresent) {
    i.vectorGuiCVS.style.cursor = r.tool.current.cursor;
    return;
  }
  const e = S.collidedPoint.xKey;
  ["px1", "px5"].includes(e) ? i.vectorGuiCVS.style.cursor = "nwse-resize" : ["px3", "px7"].includes(e) ? i.vectorGuiCVS.style.cursor = "nesw-resize" : ["px2", "px6"].includes(e) ? i.vectorGuiCVS.style.cursor = "ns-resize" : ["px4", "px8"].includes(e) ? i.vectorGuiCVS.style.cursor = "ew-resize" : e === "px9" && (i.vectorGuiCVS.style.cursor = "move");
}
function qf(e = null) {
  e === 1 && (e = null);
  let t = Math.ceil(i.layers[0].onscreenCvs.width / i.sharpness / i.zoom), o = Math.ceil(i.layers[0].onscreenCvs.height / i.sharpness / i.zoom), n = i.xOffset < 0 ? -i.xOffset : 0, s = Math.min(n + t, i.offScreenCVS.width), a = i.yOffset < 0 ? -i.yOffset : 0, l = Math.min(a + o, i.offScreenCVS.height);
  const c = af();
  i.vectorGuiCTX.beginPath();
  for (let u = n; u <= s; u++) i.vectorGuiCTX.moveTo(i.xOffset + u, i.yOffset + a), i.vectorGuiCTX.lineTo(i.xOffset + u, i.yOffset + l);
  for (let u = a; u <= l; u++) i.vectorGuiCTX.moveTo(i.xOffset + n, i.yOffset + u), i.vectorGuiCTX.lineTo(i.xOffset + s, i.yOffset + u);
  if (Pt(i.vectorGuiCTX, c, "rgba(0,0,0,0.3)", "rgba(255,255,255,0.5)"), e) {
    n -= n % e, a -= a % e, i.vectorGuiCTX.beginPath();
    for (let u = n; u <= s; u += e) i.vectorGuiCTX.moveTo(i.xOffset + u, i.yOffset + a), i.vectorGuiCTX.lineTo(i.xOffset + u, i.yOffset + l);
    for (let u = a; u <= l; u += e) i.vectorGuiCTX.moveTo(i.xOffset + n, i.yOffset + u), i.vectorGuiCTX.lineTo(i.xOffset + s, i.yOffset + u);
    Pt(i.vectorGuiCTX, c * 1.5, "rgba(0,0,0,0.3)", "rgba(255,255,255,0.5)");
  }
}
function Uf(e, t, o = false, n = null) {
  for (let s of t) {
    const a = { x: e[s.x], y: e[s.y] };
    a.x == null || a.y == null || Jf(s, a, o, n);
  }
  Qf();
}
function Hf(e, t, o, n) {
  return Po(r.cursor.x, r.cursor.y, t, o, n) ? (S.setCollision(e), { isActive: true }) : { isActive: false };
}
function Nf(e, t, o, n, s) {
  if (!Po(r.cursor.x, r.cursor.y, t, o, n)) return { isActive: false };
  if (e.x === "px1" || e.x === "px2") {
    r.vector.collidedIndex = s.index, S.setOtherVectorCollision(e);
    let a = null;
    if (S.selectedPoint.xKey ? a = S.selectedPoint : S.collidedPoint.xKey && (a = S.collidedPoint), ["px1", "px2"].includes(a == null ? void 0 : a.xKey)) {
      if (S.addLinkedVector(s, e.x, a), r.tool.clickCounter === 0) return { isActive: true };
    } else if (!S.selectedPoint.xKey && r.tool.clickCounter === 0) return { isActive: true };
  } else if ((e.x === "px3" || e.x === "px4") && !S.selectedPoint.xKey && (r.vector.collidedIndex = s.index, r.tool.clickCounter === 0)) return { isActive: true };
  return { isActive: false };
}
function Wf(e, t, o, n) {
  var _a5;
  if (!n) return;
  const s = (_a5 = r.vector.all[r.vector.currentIndex]) == null ? void 0 : _a5.modes;
  S.collidedPoint.xKey === "px3" && (t === r.vector.properties.px1 + r.canvas.cropOffsetX && o === r.vector.properties.py1 + r.canvas.cropOffsetY && S.addLinkedVector(n, e.x, { xKey: "px1", yKey: "py1" }), (s == null ? void 0 : s.quadCurve) && t === r.vector.properties.px2 + r.canvas.cropOffsetX && o === r.vector.properties.py2 + r.canvas.cropOffsetY && S.addLinkedVector(n, e.x, { xKey: "px2", yKey: "py2" })), S.collidedPoint.xKey === "px4" && t === r.vector.properties.px2 + r.canvas.cropOffsetX && o === r.vector.properties.py2 + r.canvas.cropOffsetY && S.addLinkedVector(n, e.x, { xKey: "px2", yKey: "py2" });
}
function jf(e, t, o, n) {
  const s = o * 0.55;
  i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.moveTo(e - o, t), i.vectorGuiCTX.lineTo(e - s, t), i.vectorGuiCTX.moveTo(e + s, t), i.vectorGuiCTX.lineTo(e + o, t), i.vectorGuiCTX.moveTo(e, t - o), i.vectorGuiCTX.lineTo(e, t - s), i.vectorGuiCTX.moveTo(e, t + s), i.vectorGuiCTX.lineTo(e, t + o), i.vectorGuiCTX.lineCap = "square", Pt(i.vectorGuiCTX, n, "black", "white"), i.vectorGuiCTX.lineCap = "butt", i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.arc(e, t, o * 0.2, 0, 2 * Math.PI), i.vectorGuiCTX.lineWidth = n * 2, i.vectorGuiCTX.strokeStyle = "black", i.vectorGuiCTX.stroke(), i.vectorGuiCTX.fillStyle = "white", i.vectorGuiCTX.fill();
}
function Ff(e, t, o, n, s, a, l, c, u) {
  s ? (i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.arc(e, t, o * 1.5, 0, 2 * Math.PI), i.vectorGuiCTX.lineWidth = n * 2, i.vectorGuiCTX.strokeStyle = "black", i.vectorGuiCTX.stroke(), i.vectorGuiCTX.fillStyle = "white", i.vectorGuiCTX.fill()) : S.selectedPoint.xKey === a.x || Po(r.cursor.x, r.cursor.y, l, c, u) || (i.vectorGuiCTX.beginPath(), i.vectorGuiCTX.arc(e, t, o * 1.5, 0, 2 * Math.PI), Pt(i.vectorGuiCTX, n, "black", "white"));
}
function Jf(e, t, o, n) {
  const s = i.gui.renderRadius * i.gui.lineWidth * (o ? 1 : 3), a = i.gui.collisionRadius, l = lf(n), c = cf(n), u = t.x + l, d = t.y + c;
  let f = false;
  o && (S.selectedPoint.xKey === e.x && !n ? (f = true, S.setCollision(e)) : n ? f = Nf(e, u, d, a, n).isActive : f = Hf(e, u, d, a).isActive, Wf(e, u, d, n));
  const p = jt(), h = Lr(n), y = Tr(n), v = t.x + h + 0.5, g = t.y + y + 0.5;
  f ? jf(v, g, s * 5, p) : Ff(v, g, s, p, o, e, u, d, a);
}
function Zf() {
  var _a5, _b2;
  const e = ["px1", "px2"];
  return !!(S.selectedCollisionPresent && r.vector.currentIndex !== null && e.includes(S.collidedPoint.xKey) && ((_a5 = r.vector.all[r.vector.currentIndex]) == null ? void 0 : _a5.vectorProperties.tool) === "curve" || r.vector.collidedIndex !== null && e.includes(S.otherCollidedKeys.xKey) && ((_b2 = r.vector.all[r.vector.collidedIndex]) == null ? void 0 : _b2.vectorProperties.tool) === "curve");
}
function Qf() {
  var _a5, _b2, _c5;
  if (!S.selectedCollisionPresent && !r.vector.collidedIndex) {
    if (r.vector.selectedIndices.size > 0 && r.tool.current.type === "vector") {
      i.vectorGuiCVS.style.cursor = "move";
      return;
    }
    i.vectorGuiCVS.style.cursor = ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.eraser) ? "none" : r.cursor.clicked ? r.tool.current.activeCursor : r.tool.current.cursor;
    return;
  }
  if (r.tool.current.name !== "move") r.tool.clickCounter !== 0 ? i.vectorGuiCVS.style.cursor = "move" : ((_c5 = (_b2 = r.tool.current.options) == null ? void 0 : _b2.chain) == null ? void 0 : _c5.active) && Zf() ? i.vectorGuiCVS.style.cursor = r.tool.current.cursor : r.cursor.clicked ? i.vectorGuiCVS.style.cursor = "grabbing" : i.vectorGuiCVS.style.cursor = "grab";
  else {
    const e = S.collidedPoint.xKey;
    ["px1", "px4"].includes(e) ? i.vectorGuiCVS.style.cursor = "nwse-resize" : ["px2", "px3"].includes(e) && (i.vectorGuiCVS.style.cursor = "nesw-resize");
  }
}
const S = { grid: false, gridSpacing: 8, showCursorPreview: true, mother: { x: null, y: null, newRotation: 0, currentRotation: 0, rotationOrigin: { x: null, y: null } }, selectedCollisionPresent: false, collidedPoint: { xKey: null, yKey: null }, selectedPoint: { xKey: null, yKey: null }, otherCollidedKeys: { xKey: null, yKey: null }, linkedVectors: {}, drawControlPoints: Uf, resetCollision() {
  this.selectedCollisionPresent = false, this.collidedPoint = { xKey: null, yKey: null };
}, setCollision(e) {
  this.selectedCollisionPresent = true, this.collidedPoint.xKey = e.x, this.collidedPoint.yKey = e.y;
}, resetOtherVectorCollision() {
  r.vector.collidedIndex = null, this.otherCollidedKeys = { xKey: null, yKey: null };
}, setOtherVectorCollision(e) {
  this.otherCollidedKeys.xKey = e.x, this.otherCollidedKeys.yKey = e.y;
}, resetLinkedVectors() {
  this.selectedPoint.xKey || (this.linkedVectors = {});
}, addLinkedVector(e, t, o) {
  if (!(this.selectedPoint.xKey || ["fill", "ellipse"].includes(e.vectorProperties.tool) || ["fill", "ellipse"].includes(r.vector.properties.tool))) {
    if (this.linkedVectors[e.index] || (this.linkedVectors[e.index] = {}), e.modes.quadCurve) {
      if (t === "px2" && this.linkedVectors[e.index].px1) return;
      t === "px1" && this.linkedVectors[e.index].px2 && delete this.linkedVectors[e.index].px2;
    }
    this.linkedVectors[e.index].linkingPoint = o, this.linkedVectors[e.index][t] = true;
  }
}, removeLinkedVector(e) {
  delete this.linkedVectors[e.index];
}, render: rp, reset: ep, setVectorProperties: tp };
function ep() {
  r.vector.properties = {}, r.vector.setCurrentIndex(null), S.render();
}
function tp(e) {
  if (e.layer === i.currentLayer) {
    r.vector.properties = { ...e.vectorProperties };
    const t = e.layer.x, o = e.layer.y;
    r.vector.properties.px1 += t, r.vector.properties.py1 += o, r.vector.properties.px2 !== void 0 && (r.vector.properties.px2 += t, r.vector.properties.py2 += o), r.vector.properties.px3 !== void 0 && (r.vector.properties.px3 += t, r.vector.properties.py3 += o), r.vector.properties.px4 !== void 0 && (r.vector.properties.px4 += t, r.vector.properties.py4 += o), r.vector.setCurrentIndex(e.index);
  }
}
function rp() {
  var _a5, _b2, _c5, _d3;
  if (i.vectorGuiCTX.clearRect(0, 0, i.vectorGuiCVS.width / i.zoom, i.vectorGuiCVS.height / i.zoom), i.cursorCTX.clearRect(0, 0, i.cursorCVS.width / i.zoom, i.cursorCVS.height / i.zoom), i.vectorGuiCTX.imageSmoothingEnabled = false, i.currentLayer.type === "reference" && i.currentLayer.img) {
    S.resetCollision();
    let e = i.zoom <= 8 ? 1 / i.zoom : 1 / 8;
    r.selection.properties.px1 = i.currentLayer.x - e, r.selection.properties.py1 = i.currentLayer.y - e, r.selection.properties.px2 = i.currentLayer.x + i.currentLayer.img.width * i.currentLayer.scale + e, r.selection.properties.py2 = i.currentLayer.y + i.currentLayer.img.height * i.currentLayer.scale + e, r.selection.setBoundaryBox(r.selection.properties);
  }
  if (((_a5 = r.tool.current.options.displayVectors) == null ? void 0 : _a5.active) || ((_b2 = r.tool.current.options.equal) == null ? void 0 : _b2.active) || ((_c5 = r.tool.current.options.align) == null ? void 0 : _c5.active) || ((_d3 = r.tool.current.options.link) == null ? void 0 : _d3.active) || r.vector.selectedIndices.size > 0 && r.tool.current.type === "vector" ? op(i.currentLayer) : r.tool.current.type === "vector" && np(), r.vector.selectedIndices.size > 0 && r.vector.shapeCenterX !== null) switch (r.vector.transformMode) {
    case Kr:
      Yf();
      break;
  }
  _r(), i.zoom >= 4 && S.grid && qf(S.gridSpacing);
}
function Qn(e, t = null) {
  switch (e.tool) {
    case "fill":
      sf(e, t);
      break;
    case "curve":
      uf(e, t);
      break;
    case "ellipse":
      ff(e, t), (e.x1Offset || e.y1Offset) && pf(e, t);
      break;
    case "polygon":
      vf(e, t);
      break;
  }
}
function es(e, t = null) {
  switch (e.tool) {
    case "fill":
      break;
    case "curve":
      df(e, t);
      break;
    case "ellipse":
      hf(e, t);
      break;
    case "polygon":
      yf(e, t);
      break;
  }
}
function op(e) {
  var _a5;
  let t = null;
  r.vector.currentIndex !== null && (t = r.vector.all[r.vector.currentIndex]);
  for (let o of Object.values(r.vector.all)) !o.removed && o.layer === e && r.timeline.undoStack.includes(o.action) && (o.vectorProperties.tool === r.tool.current.name && r.vector.selectedIndices.size === 0 || r.vector.selectedIndices.has(o.index)) && es(o.vectorProperties, o);
  r.vector.selectedIndices.size > 0 && !r.vector.selectedIndices.has(r.vector.currentIndex) || es(r.vector.properties), !((_a5 = r.tool.current.options.displayPaths) == null ? void 0 : _a5.active) && r.vector.selectedIndices.size === 0 && i.vectorGuiCTX.clearRect(i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height), S.resetCollision(), r.vector.selectedIndices.size > 0 && !r.vector.selectedIndices.has(r.vector.currentIndex) || Qn(r.vector.properties), S.resetOtherVectorCollision(), S.resetLinkedVectors();
  for (let o of Object.values(r.vector.all)) !o.removed && o.layer === e && r.timeline.undoStack.includes(o.action) && (o.vectorProperties.tool === r.tool.current.name && r.vector.selectedIndices.size === 0 || r.vector.selectedIndices.has(o.index)) && o !== t && Qn(o.vectorProperties, o);
}
function np() {
  var _a5;
  es(r.vector.properties), ((_a5 = r.tool.current.options.displayPaths) == null ? void 0 : _a5.active) || i.vectorGuiCTX.clearRect(i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height), S.resetCollision(), Qn(r.vector.properties);
}
function sp(e, t, o) {
  e.data[t] = o.r, e.data[t + 1] = o.g, e.data[t + 2] = o.b, e.data[t + 3] = o.a;
}
function Ao(e, t, o, n) {
  let s = e.data[t], a = e.data[t + 1], l = e.data[t + 2], c = e.data[t + 3];
  return s === o.r && a === o.g && l === o.b && c === o.a;
}
function Da(e, t, o) {
  let n = {}, s = (o * e.width + t) * 4;
  return n.r = e.data[s], n.g = e.data[s + 1], n.b = e.data[s + 2], n.a = e.data[s + 3], n.color = `rgba(${n.r},${n.g},${n.b},${n.a / 255})`, n;
}
function ip(e, t, o, n, s, a, l) {
  const c = Be(e, ne.__wbindgen_malloc), u = Ce, d = ne.build_color_mask(c, u, t, o, n, s, a, l);
  var f = vp(d[0], d[1]).slice();
  return ne.__wbindgen_free(d[0], d[1] * 4, 4), f;
}
function ap(e, t, o) {
  var n = Be(e, ne.__wbindgen_malloc), s = Ce;
  ne.flip_horizontal(n, s, e, t, o);
}
function lp(e, t, o) {
  var n = Be(e, ne.__wbindgen_malloc), s = Ce;
  ne.flip_vertical(n, s, e, t, o);
}
function cp(e, t, o, n, s, a, l, c, u, d, f, p, h) {
  var y = Be(e, ne.__wbindgen_malloc), v = Ce;
  return ne.flood_fill(y, v, e, t, o, n, s, a, l, c, u, d, f, p, h) !== 0;
}
function up(e, t, o, n, s, a, l, c, u, d, f, p, h, y, v, g, x, b, O) {
  var M = Be(e, ne.__wbindgen_malloc), w = Ce;
  const C = vr(t, ne.__wbindgen_malloc), k = Ce, _ = vr(s, ne.__wbindgen_malloc), L = Ce, E = Be(a, ne.__wbindgen_malloc), I = Ce, P = Be(l, ne.__wbindgen_malloc), A = Ce, G = Be(c, ne.__wbindgen_malloc), K = Ce, D = Be(u, ne.__wbindgen_malloc), $ = Ce, H = Be(d, ne.__wbindgen_malloc), J = Ce, Z = Be(f, ne.__wbindgen_malloc), V = Ce, Q = Be(p, ne.__wbindgen_malloc), le = Ce, de = Be(h, ne.__wbindgen_malloc), ce = Ce, j = Be(y, ne.__wbindgen_malloc), W = Ce, he = Be(v, ne.__wbindgen_malloc), me = Ce, be = vr(g, ne.__wbindgen_malloc), ke = Ce, _e5 = vr(x, ne.__wbindgen_malloc), Xe = Ce, Ee = vr(b, ne.__wbindgen_malloc), q = Ce;
  ne.render_buildup_segment(M, w, e, C, k, o, n, _, L, E, I, P, A, G, K, D, $, H, J, Z, V, Q, le, de, ce, j, W, he, me, be, ke, _e5, Xe, Ee, q, O);
}
function dp(e, t, o, n, s, a, l, c, u, d, f, p, h, y, v, g, x, b) {
  var O = Be(e, ne.__wbindgen_malloc), M = Ce;
  const w = vr(n, ne.__wbindgen_malloc), C = Ce, k = vr(s, ne.__wbindgen_malloc), _ = Ce;
  ne.render_dither_stroke(O, M, e, t, o, w, C, k, _, a, l, c, u, d, f, p, h, y, v, g, x, b);
}
function fp(e, t, o, n, s) {
  const a = Be(e, ne.__wbindgen_malloc), l = Ce;
  var c = Be(t, ne.__wbindgen_malloc), u = Ce;
  ne.rotate_90(a, l, c, u, t, o, n, s);
}
function pp(e, t, o, n, s) {
  var a = Be(e, ne.__wbindgen_malloc), l = Ce;
  ne.translate_and_wrap(a, l, e, t, o, n, s);
}
function hp(e, t, o, n, s) {
  var a = Be(e, ne.__wbindgen_malloc), l = Ce;
  ne.translate_without_wrap(a, l, e, t, o, n, s);
}
function Va() {
  return { __proto__: null, "./pixel_vee_wasm_bg.js": { __proto__: null, __wbg___wbindgen_copy_to_typed_array_9e08990f20659111: function(t, o, n) {
    new Uint8Array(n.buffer, n.byteOffset, n.byteLength).set(yp(t, o));
  }, __wbindgen_init_externref_table: function() {
    const t = ne.__wbindgen_externrefs, o = t.grow(4);
    t.set(0, void 0), t.set(o + 0, void 0), t.set(o + 1, null), t.set(o + 2, true), t.set(o + 3, false);
  } } };
}
function vp(e, t) {
  return e = e >>> 0, $a().subarray(e / 4, e / 4 + t);
}
function yp(e, t) {
  return e = e >>> 0, Ga().subarray(e / 1, e / 1 + t);
}
let so = null;
function $a() {
  return (so === null || so.byteLength === 0) && (so = new Uint32Array(ne.memory.buffer)), so;
}
let io = null;
function Ga() {
  return (io === null || io.byteLength === 0) && (io = new Uint8Array(ne.memory.buffer)), io;
}
function vr(e, t) {
  const o = t(e.length * 4, 4) >>> 0;
  return $a().set(e, o / 4), Ce = e.length, o;
}
function Be(e, t) {
  const o = t(e.length * 1, 1) >>> 0;
  return Ga().set(e, o / 1), Ce = e.length, o;
}
let Ce = 0, ne;
function qa(e, t) {
  return ne = e.exports, so = null, io = null, ne.__wbindgen_start(), ne;
}
async function mp(e, t) {
  if (typeof Response == "function" && e instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function") try {
      return await WebAssembly.instantiateStreaming(e, t);
    } catch (s) {
      if (e.ok && o(e.type) && e.headers.get("Content-Type") !== "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", s);
      else throw s;
    }
    const n = await e.arrayBuffer();
    return await WebAssembly.instantiate(n, t);
  } else {
    const n = await WebAssembly.instantiate(e, t);
    return n instanceof WebAssembly.Instance ? { instance: n, module: e } : n;
  }
  function o(n) {
    switch (n) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}
function gp(e) {
  if (ne !== void 0) return ne;
  e !== void 0 && (Object.getPrototypeOf(e) === Object.prototype ? { module: e } = e : console.warn("using deprecated parameters for `initSync()`; pass a single object instead"));
  const t = Va();
  e instanceof WebAssembly.Module || (e = new WebAssembly.Module(e));
  const o = new WebAssembly.Instance(e, t);
  return qa(o);
}
async function Ua(e) {
  if (ne !== void 0) return ne;
  e !== void 0 && (Object.getPrototypeOf(e) === Object.prototype ? { module_or_path: e } = e : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), e === void 0 && (e = new URL("/assets/pixel_vee_wasm_bg-BymSSQyR.wasm", import.meta.url));
  const t = Va();
  (typeof e == "string" || typeof Request == "function" && e instanceof Request || typeof URL == "function" && e instanceof URL) && (e = fetch(e));
  const { instance: o, module: n } = await mp(await e, t);
  return qa(o);
}
const bp = Object.freeze(Object.defineProperty({ __proto__: null, build_color_mask: ip, default: Ua, flip_horizontal: ap, flip_vertical: lp, flood_fill: cp, initSync: gp, render_buildup_segment: up, render_dither_stroke: dp, rotate_90: fp, translate_and_wrap: pp, translate_without_wrap: hp }, Symbol.toStringTag, { value: "Module" }));
let ao = null;
async function xp() {
  return ao || (await Ua(), ao = bp, ao);
}
function Os() {
  return ao;
}
function Ha(e, t, o) {
  const { boundaryBox: n, layer: s, currentModes: a, customContext: l } = o;
  let { currentColor: c } = o;
  if (Ut(e, t, 0, s, n)) return;
  let u = ei(n.xMin, 0), d = ti(n.xMax, s.cvs.width), f = ei(n.yMin, 0), p = ti(n.yMax, s.cvs.height), h = s.ctx;
  l && (h = l);
  const y = d - u, v = p - f;
  let g = h.getImageData(u, f, y, v), x = Da(g, e - u, t - f);
  if ((a == null ? void 0 : a.eraser) && (c = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }), c.color === x.color) return;
  const b = Os();
  if (b) b.flood_fill(g.data, y, v, e - u, t - f, x.r, x.g, x.b, x.a, c.r, c.g, c.b, c.a);
  else {
    const O = [[e - u, t - f]];
    let M, w, C, k, _;
    for (; O.length; ) {
      const L = O.pop();
      for (M = L[0], w = L[1], C = (w * y + M) * 4; w >= 0 && Ao(g, C, x); ) w--, C -= y * 4;
      for (C += y * 4, w++, k = false, _ = false; w < v && Ao(g, C, x); ) sp(g, C, c), M > 0 && (Ao(g, C - 4, x) ? k || (O.push([M - 1, w]), k = true) : k && (k = false)), M < y - 1 && (Ao(g, C + 4, x) ? _ || (O.push([M + 1, w]), _ = true) : _ && (_ = false)), w++, C += y * 4;
    }
  }
  h.putImageData(g, u, f);
}
function sn(e, t) {
  const { brushStamp: o, ditherPattern: n } = t, a = { ...t, seenPixelsSet: /* @__PURE__ */ new Set() };
  let l = Math.floor(e[0].x), c = Math.floor(e[0].y);
  for (const { x: u, y: d } of e) {
    let f = Math.floor(u), p = Math.floor(d), h = Ht(f, p, l, c);
    n ? Pr(f, p, o[h], a) : on(f, p, o[h], a), l = f, c = p;
  }
}
function jo(e, t, o, n, s, a, l, c, u, d) {
  const f = Mf(e, t, o, n, s, a, l, c, u);
  sn(f, d);
}
function Ro(e, t, o, n, s) {
  const a = Math.abs(o - e), l = Math.abs(n - t), c = e < o ? 1 : -1, u = t < n ? 1 : -1;
  let d = a - l;
  for (; e !== o || t !== n; ) {
    s(e, t);
    const f = 2 * d;
    f > -l && (d -= l, e += c), f < a && (d += a, t += u);
  }
  s(e, t);
}
function Na(e, t, o, n, s, a, l, c, u) {
  const d = [], f = /* @__PURE__ */ new Set();
  function p(h, y) {
    const v = y << 16 | h & 65535;
    f.has(v) || (f.add(v), d.push({ x: h, y }));
  }
  Ro(e, t, o, n, p), Ro(o, n, s, a, p), Ro(s, a, l, c, p), Ro(l, c, e, t, p), d.length > 0 && sn(d, u);
}
function lo(e, t, o, n, s, a, l, c, u, d) {
  if (u === 1) za(e, t, o, n, d);
  else if (u === 2) {
    let f = xf(e, t, s, a, o, n);
    sn(f, d);
  } else if (u === 3) {
    let f = Sf(e, t, s, a, l, c, o, n);
    sn(f, d);
  }
}
function Sp(e, t, o, n, s, a) {
  const l = t.x + s, c = t.y + a, u = n ?? t.ctx, d = Os();
  d ? Cp(d, e, t, o, u, l, c, s, a) : wp(e, t, o, u, l, c, s, a);
}
function Cp(e, t, o, n, s, a, l, c, u) {
  var _a5;
  const d = i.offScreenCVS.width, f = i.offScreenCVS.height, p = [], h = [], y = [], v = [], g = [], x = [], b = [], O = [], M = [], w = [], C = [], k = [], _ = [], L = [];
  for (const P of t) {
    const A = P.layer.x + c, G = P.layer.y + u;
    for (const J of P.buildUpDensityDelta ?? []) {
      const Z = (J & 65535) + A, V = (J >>> 16 & 65535) + G;
      Z >= 0 && Z < d && V >= 0 && V < f && p.push(V << 16 | Z);
    }
    p.push(4294967295), h.push(P.color.r), y.push(P.color.g), v.push(P.color.b), g.push(P.color.a);
    const K = P.secondaryColor;
    x.push(K ? K.r : 0), b.push(K ? K.g : 0), O.push(K ? K.b : 0), M.push(K ? K.a : 0), w.push(((_a5 = P.modes) == null ? void 0 : _a5.twoColor) && K ? 1 : 0);
    const D = P.buildUpSteps ?? [15, 31, 47, 63];
    for (const J of D) C.push(J);
    k.push(D.length);
    const $ = (((P.ditherOffsetX ?? 0) + P.recordedLayerX - a) % 8 + 8) % 8, H = (((P.ditherOffsetY ?? 0) + P.recordedLayerY - l) % 8 + 8) % 8;
    _.push($), L.push(H);
  }
  const E = n.get(o) ?? new Int32Array(d * f), I = s.getImageData(0, 0, d, f);
  e.render_buildup_segment(I.data, E, d, f, new Uint32Array(p), new Uint8Array(h), new Uint8Array(y), new Uint8Array(v), new Uint8Array(g), new Uint8Array(x), new Uint8Array(b), new Uint8Array(O), new Uint8Array(M), new Uint8Array(w), new Uint8Array(C), new Uint32Array(k), new Int32Array(_), new Int32Array(L), false), s.putImageData(I, 0, 0);
}
function wp(e, t, o, n, s, a, l, c) {
  var _a5;
  const u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
  for (const h of e) {
    if (!h.buildUpDensityDelta) continue;
    const y = h.layer.x + l, v = h.layer.y + c;
    for (const g of h.buildUpDensityDelta) {
      const x = (g & 65535) + y, O = (g >>> 16 & 65535) + v << 16 | x;
      u.set(O, (u.get(O) ?? 0) + 1), d.set(O, h);
    }
  }
  const f = o.get(t), p = i.offScreenCVS.width;
  for (const [h, y] of u) {
    const v = h & 65535, g = h >>> 16 & 65535, x = d.get(h), b = x.buildUpSteps ?? [15, 31, 47, 63], M = (f && f[g * p + v] || 0) + y, w = Math.min(M - 1, b.length - 1), C = Ze[b[w]], k = (((x.ditherOffsetX ?? 0) + x.recordedLayerX - s) % 8 + 8) % 8, _ = (((x.ditherOffsetY ?? 0) + x.recordedLayerY - a) % 8 + 8) % 8;
    hn(C, v, g, k, _) ? (n.fillStyle = x.color.color, n.fillRect(v, g, 1, 1)) : ((_a5 = x.modes) == null ? void 0 : _a5.twoColor) && x.secondaryColor && (n.fillStyle = x.secondaryColor.color, n.fillRect(v, g, 1, 1));
  }
}
function Mp(e, t = null, o = 0, n = 0) {
  var _a5;
  const s = e.layer.x + o, a = e.layer.y + n, l = { ...e.boundaryBox };
  l.xMax !== null && (l.xMin += s, l.xMax += s, l.yMin += a, l.yMax += a);
  for (let c = 0; c < e.vectorIndices.length; c++) {
    const u = r.vector.all[e.vectorIndices[c]];
    if (u.hidden || u.removed) continue;
    const d = u.vectorProperties, f = u.recordedLayerX, p = u.recordedLayerY, h = (((u.ditherOffsetX ?? 0) + f - s) % 8 + 8) % 8, y = (((u.ditherOffsetY ?? 0) + p - a) % 8 + 8) % 8, v = Wt({ layer: u.layer, customContext: t, boundaryBox: l, currentColor: u.color, currentModes: u.modes, brushStamp: gt[u.brushType][u.brushSize], brushSize: u.brushSize, ditherPattern: Ze[u.ditherPatternIndex ?? 63], twoColorMode: ((_a5 = u.modes) == null ? void 0 : _a5.twoColor) ?? false, secondaryColor: u.secondaryColor ?? null, ditherOffsetX: h, ditherOffsetY: y });
    switch (d.tool) {
      case "fill": {
        Ha(d.px1 + s, d.py1 + a, v);
        break;
      }
      case "curve": {
        const g = u.modes.cubicCurve ? 3 : u.modes.quadCurve ? 2 : 1;
        lo(d.px1 + s, d.py1 + a, d.px2 + s, d.py2 + a, d.px3 + s, d.py3 + a, d.px4 + s, d.py4 + a, g, v);
        break;
      }
      case "ellipse":
        jo(d.weight, d.leftTangentX + s, d.leftTangentY + a, d.topTangentX + s, d.topTangentY + a, d.rightTangentX + s, d.rightTangentY + a, d.bottomTangentX + s, d.bottomTangentY + a, v);
        break;
      case "polygon":
        Na(d.px1 + s, d.py1 + a, d.px2 + s, d.py2 + a, d.px3 + s, d.py3 + a, d.px4 + s, d.py4 + a, v);
        break;
    }
  }
}
function kp(e, t = null, o = null, n = null, s = null, a = 0, l = 0) {
  var _a5, _b2;
  if (e == null ? void 0 : e.boundaryBox) switch (e.tool) {
    case "brush": {
      const c = e.layer.x + a, u = e.layer.y + l, d = { ...e.boundaryBox };
      d.xMax !== null && (d.xMin += c, d.xMax += c, d.yMin += u, d.yMax += u);
      let f = /* @__PURE__ */ new Set(), p = null;
      e.maskArray && (p = new Set(e.maskArray.map((_) => _.y + u << 16 | _.x + c)));
      let h = e.points[0].x + c, y = e.points[0].y + u, v = "0,0";
      const g = ((_a5 = e.modes) == null ? void 0 : _a5.buildUpDither) ?? false, x = e.buildUpSteps ?? [15, 31, 47, 63], b = g ? null : Ze[e.ditherPatternIndex ?? 63], O = e.recordedLayerX, M = e.recordedLayerY, w = (((e.ditherOffsetX ?? 0) + O - c) % 8 + 8) % 8, C = (((e.ditherOffsetY ?? 0) + M - u) % 8 + 8) % 8, k = Wt({ layer: e.layer, customContext: t, boundaryBox: d, currentColor: e.color, currentModes: e.modes, maskSet: p, seenPixelsSet: f, twoColorMode: ((_b2 = e.modes) == null ? void 0 : _b2.twoColor) ?? false, secondaryColor: e.secondaryColor, ditherOffsetX: w, ditherOffsetY: C, ditherPattern: b, densityMap: s, buildUpSteps: x });
      for (const _ of e.points) {
        v = Ht(_.x + c, _.y + u, h, y);
        const L = e.brushType === "custom";
        k.brushSize = L ? 32 : _.brushSize;
        const E = L ? e.customStampEntry[v] : gt[e.brushType][_.brushSize][v];
        g ? vn(_.x + c, _.y + u, E, k) : Pr(_.x + c, _.y + u, E, k), h = _.x + c, y = _.y + u;
      }
      break;
    }
    case "fill":
    case "curve":
    case "ellipse":
    case "polygon":
    case "vectorPaste":
      Mp(e, t, a, l);
      break;
    case "cut": {
      const c = e.layer.x, u = e.layer.y, d = { ...e.boundaryBox };
      d.xMax !== null && (d.xMin += c + a, d.xMax += c + a, d.yMin += u + l, d.yMax += u + l);
      let f = t || e.layer.ctx;
      if (e.maskSet && e.maskSet.length > 0) {
        const p = e.boundaryBox.xMin + (e.originalLayerX ?? 0), h = e.boundaryBox.yMin + (e.originalLayerY ?? 0), y = d.xMax - d.xMin, v = d.yMax - d.yMin, g = f.getImageData(d.xMin, d.yMin, y, v), { data: x } = g;
        for (const b of e.maskSet) {
          const O = (b & 65535) - p, M = (b >> 16 & 65535) - h;
          if (O >= 0 && O < y && M >= 0 && M < v) {
            const w = (M * y + O) * 4;
            x[w] = x[w + 1] = x[w + 2] = x[w + 3] = 0;
          }
        }
        f.putImageData(g, d.xMin, d.yMin);
      } else f.clearRect(d.xMin, d.yMin, d.xMax - d.xMin, d.yMax - d.yMin);
      break;
    }
    case "paste": {
      const c = e.layer.x, u = e.layer.y, d = { ...e.boundaryBox };
      d.xMax !== null && (d.xMin += c + a, d.xMax += c + a, d.yMin += u + l, d.yMax += u + l);
      const f = e === o;
      e.confirmed ? (t || e.layer.ctx).drawImage(e.canvas, d.xMin, d.yMin, d.xMax - d.xMin, d.yMax - d.yMin) : i.tempLayer === i.currentLayer && f && e.layer.ctx.drawImage(e.canvas, d.xMin, d.yMin, d.xMax - d.xMin, d.yMax - d.yMin);
      break;
    }
    case "transform": {
      if (i.tempLayer === i.currentLayer && e.pastedImageKey === r.clipboard.currentPastedImageKey && e === n) {
        const c = e.layer.x, u = e.layer.y, d = { ...e.boundaryBox };
        d.xMax !== null && (d.xMin += c + a, d.xMax += c + a, d.yMin += u + l, d.yMax += u + l), jr(e.layer, r.clipboard.pastedImages[e.pastedImageKey].imageData, d, e.transformationRotationDegrees % 360, e.isMirroredHorizontally, e.isMirroredVertically);
      }
      break;
    }
  }
}
function ui() {
  let e = document.createElement("canvas"), t = e.getContext("2d", { willReadFrequently: true });
  return e.width = i.offScreenCVS.width, e.height = i.offScreenCVS.height, r.timeline.savedBetweenActionImages.push({ cvs: e, ctx: t }), t;
}
function Pp(e, t, o = false) {
  var _a5;
  let n = null, s = 1;
  const a = t ? new Map(t.map((v, g) => [v, g])) : null;
  t && (o ? n = ui() : s = t[0]);
  let l = null, c = null;
  for (let v = r.timeline.undoStack.length - 1; v >= 0; v--) {
    const g = r.timeline.undoStack[v];
    if (l === null && g.tool === "paste" && !g.confirmed && (l = g), c === null && g.tool === "transform" && (c = g), l !== null && c !== null) break;
  }
  const u = /* @__PURE__ */ new Map(), d = r.canvas.cropOffsetX, f = r.canvas.cropOffsetY;
  let p = [], h = null;
  function y() {
    if (p.length === 0) return;
    Sp(p, h, u, n, d, f);
    const v = i.offScreenCVS.width, g = i.offScreenCVS.height;
    for (const x of p) {
      if (!x.buildUpDensityDelta) continue;
      u.has(x.layer) || u.set(x.layer, new Int32Array(v * g));
      const b = u.get(x.layer), O = x.layer.x + d, M = x.layer.y + f;
      for (const w of x.buildUpDensityDelta) {
        const C = (w & 65535) + O, k = (w >>> 16 & 65535) + M;
        C >= 0 && C < v && k >= 0 && k < g && (b[k * v + C] += 1);
      }
    }
    p = [], h = null;
  }
  for (let v = s; v < r.timeline.undoStack.length; v++) {
    let g = r.timeline.undoStack[v];
    if (e && g.layer !== e) continue;
    if (a && a.has(v)) {
      let b = a.get(v);
      g.layer.ctx.drawImage(r.timeline.savedBetweenActionImages[b].cvs, 0, 0), o && (n = null);
    }
    const x = ie[g.tool];
    if (!g.hidden && !g.removed && ["raster", "vector"].includes(x.type)) {
      const b = g.tool === "brush" && ((_a5 = g.modes) == null ? void 0 : _a5.buildUpDither);
      if (!a && b) h !== null && h !== g.layer && y(), p.push(g), h = g.layer;
      else {
        y();
        let O = null;
        if (b && (u.has(g.layer) || u.set(g.layer, new Int32Array(i.offScreenCVS.width * i.offScreenCVS.height)), O = u.get(g.layer)), kp(g, n, l, c, O, d, f), b && g.buildUpDensityDelta) {
          const M = u.get(g.layer), w = g.layer.x + d, C = g.layer.y + f, k = i.offScreenCVS.width, _ = i.offScreenCVS.height;
          for (const L of g.buildUpDensityDelta) {
            const E = (L & 65535) + w, I = (L >>> 16 & 65535) + C;
            E >= 0 && E < k && I >= 0 && I < _ && (M[I * k + E] += 1);
          }
        }
      }
    }
    if (a) {
      if (a.has(v)) if (o) n = ui();
      else {
        let b = t[a.get(v) + 1];
        b && (v = b - 1);
      }
      if (v === t[t.length - 1] && !o) {
        g.layer.ctx.drawImage(r.timeline.savedBetweenActionImages[r.timeline.savedBetweenActionImages.length - 1].cvs, 0, 0);
        break;
      } else v === r.timeline.undoStack.length - 1 && o && g.layer.ctx.drawImage(r.timeline.savedBetweenActionImages[r.timeline.savedBetweenActionImages.length - 1].cvs, 0, 0);
    }
  }
  y();
}
let Mn = null, kn = null;
function Ko(e) {
  Mn = e, kn === null && (kn = requestAnimationFrame(() => {
    kn = null, U(Mn), Mn = null;
  }));
}
function _p(e) {
  e.onscreenCtx.save(), !e.removed && !e.hidden && (e.type === "reference" ? (e.onscreenCtx.globalAlpha = e.opacity, e.onscreenCtx.drawImage(e.img, i.xOffset + e.x * i.offScreenCVS.width / i.offScreenCVS.width, i.yOffset + e.y * i.offScreenCVS.width / i.offScreenCVS.width, e.img.width * e.scale, e.img.height * e.scale)) : (e.onscreenCtx.beginPath(), e.onscreenCtx.rect(i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height), e.onscreenCtx.clip(), e.onscreenCtx.globalAlpha = e.opacity, e.onscreenCtx.drawImage(e.cvs, i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height))), e.onscreenCtx.restore();
}
function di(e) {
  e.onscreenCtx.imageSmoothingEnabled = false, e.onscreenCtx.clearRect(0, 0, e.onscreenCvs.width / i.zoom, e.onscreenCvs.height / i.zoom), _p(e), e.onscreenCtx.beginPath(), e.onscreenCtx.rect(i.xOffset - 1, i.yOffset - 1, i.offScreenCVS.width + 2, i.offScreenCVS.height + 2), e.onscreenCtx.lineWidth = 2, e.onscreenCtx.strokeStyle = i.borderColor, e.onscreenCtx.stroke();
}
function Op() {
  i.backgroundCTX.clearRect(0, 0, i.backgroundCVS.width / i.zoom, i.backgroundCVS.height / i.zoom), i.backgroundCTX.fillStyle = i.bgColor, i.backgroundCTX.fillRect(0, 0, i.backgroundCVS.width / i.zoom, i.backgroundCVS.height / i.zoom), i.backgroundCTX.clearRect(i.xOffset, i.yOffset, i.offScreenCVS.width, i.offScreenCVS.height);
}
function Wa(e = null) {
  e ? e.type === "raster" && e.ctx.clearRect(0, 0, i.offScreenCVS.width, i.offScreenCVS.height) : i.layers.forEach((t) => {
    t.type === "raster" && t.ctx.clearRect(0, 0, i.offScreenCVS.width, i.offScreenCVS.height);
  });
}
function U(e = null, t = false, o = null, n = false) {
  t && r.timeline.undoStack.length > 0 && (Wa(e), Pp(e, o, n)), Op(), e ? di(e) : i.layers.forEach((s) => {
    di(s);
  });
}
function ja(e, t, o = 0, n = 0) {
  i.offScreenCVS.width = e, i.offScreenCVS.height = t, i.previewCVS.width = e, i.previewCVS.height = t;
  const s = i.sharpness * i.zoom;
  i.vectorGuiCTX.setTransform(s, 0, 0, s, 0, 0), i.selectionGuiCTX.setTransform(s, 0, 0, s, 0, 0), i.resizeOverlayCTX.setTransform(s, 0, 0, s, 0, 0), i.cursorCTX.setTransform(s, 0, 0, s, 0, 0), i.layers.forEach((a) => {
    a.onscreenCtx.setTransform(s, 0, 0, s, 0, 0);
  }), i.backgroundCTX.setTransform(s, 0, 0, s, 0, 0), i.xOffset = Math.round(i.xOffset - o), i.yOffset = Math.round(i.yOffset - n), i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset, i.subPixelX = null, i.subPixelY = null, i.zoomPixelX = null, i.zoomPixelY = null, i.layers.forEach((a) => {
    a.type === "raster" && (a.cvs.width !== i.offScreenCVS.width || a.cvs.height !== i.offScreenCVS.height) && (a.cvs.width = i.offScreenCVS.width, a.cvs.height = i.offScreenCVS.height);
  });
}
const Ls = (e, t, o = 0, n = 0) => {
  ja(e, t, o, n), U(null, true), S.render();
};
function To(e, t, o) {
  return e ? Array.from(e).map((n) => {
    const s = (n & 65535) - t, a = (n >> 16) - o;
    return { x: s, y: a };
  }) : null;
}
function Lp(e) {
  const t = /* @__PURE__ */ new Set(), o = i.currentLayer.ctx.getImageData(0, 0, i.currentLayer.cvs.width, i.currentLayer.cvs.height);
  if (e.a < 255) {
    const u = document.createElement("canvas");
    u.width = 1, u.height = 1;
    const d = u.getContext("2d", { willReadFrequently: true });
    d.fillStyle = `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a / 255})`, d.fillRect(0, 0, 1, 1);
    const f = d.getImageData(0, 0, 1, 1).data;
    e = { color: `rgba(${f[0]}, ${f[1]}, ${f[2]}, ${f[3] / 255})`, r: f[0], g: f[1], b: f[2], a: f[3] };
  }
  const { r: n, g: s, b: a, a: l } = e, c = Os();
  if (c) {
    const u = c.build_color_mask(o.data, i.currentLayer.cvs.width, i.currentLayer.cvs.height, n, s, a, l);
    for (const d of u) t.add(d);
  } else {
    const { data: u, width: d } = o;
    let f = 0, p = 0;
    for (let h = 0; h < u.length; h += 4) u[h] === n && u[h + 1] === s && u[h + 2] === a && u[h + 3] === l && t.add(p << 16 | f), ++f === d && (f = 0, p++);
  }
  return t;
}
const xt = "http://www.w3.org/2000/svg";
let Tp = 0;
function an(e, t = 0, o = 0) {
  const n = `dtp-${Tp++}`, s = document.createElementNS(xt, "svg");
  s.setAttribute("viewBox", "0 0 8 8"), s.setAttribute("shape-rendering", "crispEdges"), s.classList.add("dither-grid-svg");
  const a = document.createElementNS(xt, "defs"), l = document.createElementNS(xt, "pattern");
  l.setAttribute("id", n), l.setAttribute("patternUnits", "userSpaceOnUse"), l.setAttribute("x", String(-t)), l.setAttribute("y", String(-o)), l.setAttribute("width", "8"), l.setAttribute("height", "8"), l.classList.add("dither-tile-pattern");
  const c = document.createElementNS(xt, "rect");
  c.setAttribute("x", "0"), c.setAttribute("y", "0"), c.setAttribute("width", "8"), c.setAttribute("height", "8"), c.setAttribute("fill", "none"), c.classList.add("dither-bg-rect"), l.appendChild(c);
  let u = "";
  for (let h = 0; h < 8; h++) {
    let y = -1;
    for (let v = 0; v < 8; v++) e.data[h * 8 + v] === 1 ? y === -1 && (y = v) : y !== -1 && (u += `M${y} ${h + 0.5}h${v - y}`, y = -1);
    y !== -1 && (u += `M${y} ${h + 0.5}h${8 - y}`);
  }
  const d = document.createElementNS(xt, "path"), f = B.primary.color.color;
  d.setAttribute("stroke", f), d.setAttribute("d", u), d.classList.add("dither-on-path"), l.appendChild(d), a.appendChild(l), s.appendChild(a);
  const p = document.createElementNS(xt, "rect");
  return p.setAttribute("x", "0"), p.setAttribute("y", "0"), p.setAttribute("width", "8"), p.setAttribute("height", "8"), p.setAttribute("fill", `url(#${n})`), s.appendChild(p), s;
}
function Vt(e, t, o) {
  e.querySelectorAll(".dither-tile-pattern").forEach((n) => {
    n.setAttribute("x", String(-t)), n.setAttribute("y", String(-o));
  });
}
let Ip = 0;
function Xp() {
  const e = `dor-${Ip++}`, t = document.createElementNS(xt, "svg");
  t.setAttribute("viewBox", "0 0 8 8"), t.setAttribute("shape-rendering", "crispEdges"), t.classList.add("dither-offset-svg");
  const o = document.createElementNS(xt, "defs"), n = document.createElementNS(xt, "pattern");
  n.setAttribute("id", e), n.setAttribute("patternUnits", "userSpaceOnUse"), n.setAttribute("x", "0"), n.setAttribute("y", "0"), n.setAttribute("width", "8"), n.setAttribute("height", "8"), n.classList.add("dither-offset-ring-pattern");
  const s = ["rgb(255,255,255)", "rgb(131,131,131)", "rgb(61,61,61)", "rgb(31,31,31)", "rgb(0,0,0)"], a = ["", "", "", "", ""];
  for (let c = 0; c < 8; c++) {
    const u = Math.min(c, 8 - c), d = [[], [], [], [], []];
    let f = -1, p = -1;
    for (let h = 0; h <= 8; h++) {
      const y = h < 8 ? Math.max(Math.min(h, 8 - h), u) : -1;
      y !== f && (p !== -1 && d[f].push([p, h]), p = h < 8 ? h : -1, f = y);
    }
    for (let h = 0; h <= 4; h++) for (const [y, v] of d[h]) a[h] += `M${y} ${c + 0.5}h${v - y}`;
  }
  for (let c = 0; c <= 4; c++) {
    const u = document.createElementNS(xt, "path");
    u.setAttribute("stroke", s[c]), u.setAttribute("d", a[c]), n.appendChild(u);
  }
  o.appendChild(n), t.appendChild(o);
  const l = document.createElementNS(xt, "rect");
  return l.setAttribute("x", "0"), l.setAttribute("y", "0"), l.setAttribute("width", "8"), l.setAttribute("height", "8"), l.setAttribute("fill", `url(#${e})`), t.appendChild(l), t;
}
function bo(e, t, o) {
  const n = e.querySelector(".dither-offset-ring-pattern");
  n && (n.setAttribute("x", String(-t)), n.setAttribute("y", String(-o)));
  const s = e.querySelectorAll(".dither-offset-values span");
  s.length === 2 && (s[0].textContent = `X: ${t}`, s[1].textContent = `Y: ${o}`);
}
function Ep() {
  var _a5;
  const e = B.primary.color.color, t = B.secondary.color.color, n = ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.twoColor) ?? false ? t : "none";
  document.querySelectorAll(".dither-bg-rect").forEach((s) => {
    s.setAttribute("fill", n);
  }), document.querySelectorAll(".dither-on-path").forEach((s) => {
    s.setAttribute("stroke", e);
  });
}
const st = () => {
  var _a5;
  if ((_a5 = i.currentLayer) == null ? void 0 : _a5.removed) {
    const e = i.layers.find((t) => t.type === "raster" && !t.removed);
    e && (i.currentLayer = e);
  }
  i.activeLayerCount = i.layers.filter((e) => !e.removed && !e.isPreview && e.type === "raster").length;
};
function ts() {
  i.layers.includes(i.tempLayer) && (i.layers.splice(i.layers.indexOf(i.tempLayer), 1), T.canvasLayers.removeChild(i.tempLayer.onscreenCvs), i.tempLayer.inactiveTools.forEach((e) => {
    T[`${e}Btn`] && (T[`${e}Btn`].disabled = false, T[`${e}Btn`].classList.remove("deactivate-paste"));
  }), i.currentLayer = i.pastedLayer, i.pastedLayer = null, i.currentLayer.inactiveTools.forEach((e) => {
    T[`${e}Btn`] && (T[`${e}Btn`].disabled = true);
  }));
}
function Bp(e) {
  if (typeof e != "object" || e === null) return false;
  for (let t in e) if (!/^\d+$/.test(t)) return false;
  return true;
}
function zp(e) {
  let t = [], o = [];
  e.metadata ? (e.metadata.version ? (["1.0", "1.1", "1.2"].includes(e.metadata.version) || o.push("metadata.version"), ["1.1", "1.2"].includes(e.metadata.version) && (e.vectors ? Bp(e.vectors) || o.push("vectors") : t.push("vectors"))) : t.push("metadata.version"), (!e.metadata.application || e.metadata.application !== "Pixel V") && o.push("metadata.application"), e.metadata.timestamp || t.push("metadata.timestamp")) : t.push("metadata"), e.layers ? Array.isArray(e.layers) || o.push("layers") : t.push("layers"), e.history ? Array.isArray(e.history) || o.push("history") : t.push("history");
  let n = [];
  return t.length > 0 && n.push("Missing properties: " + t.join(", ")), o.length > 0 && n.push("Invalid properties: " + o.join(", ")), n.length > 0 ? { valid: false, message: "The JSON file is not a valid Pixel Vee save file. " + n.join(", ") } : { valid: true };
}
function Yp(e, t, o, n) {
  let s = JSON.parse(JSON.stringify(e));
  for (let a = s.length - 1; a >= 0; a--) {
    const l = s[a];
    l.isPreview || l.removed && !t && !n || l.type === "reference" && !t && !o ? s.splice(a, 1) : (l.type === "reference" && delete l.img, l.type === "raster" && (delete l.cvs, delete l.ctx), delete l.onscreenCvs, delete l.onscreenCtx);
  }
  return s;
}
function Ap(e, t, o, n) {
  let s = JSON.parse(JSON.stringify(t));
  const a = new Set(e.map((l) => l.index));
  for (const l in s) {
    const c = s[l];
    (c.layer.removed || c.removed) && !o && !n || !a.has(c.action.index) ? delete s[l] : (c.layer = { id: c.layer.id }, c.action = { index: c.action.index });
  }
  return s;
}
function Rp(e, t, o) {
  return !t && !o ? null : JSON.parse(JSON.stringify(e));
}
function Kp(e, t, o, n) {
  let s;
  try {
    s = JSON.parse(JSON.stringify(e));
  } catch (l) {
    console.error("#1: ", l);
    for (let c = 0; c < e.length; c++) {
      const u = e[c];
      delete u.snapshot;
    }
    console.warn("try without snapshots: ");
    try {
      s = JSON.parse(JSON.stringify(e));
    } catch (c) {
      console.error("#2: ", c);
    }
  }
  let a;
  for (let l = s.length - 1; l >= 0; l--) {
    const c = s[l];
    if (["paste", "vectorPaste"].includes(c.tool) && !a) a = l, c.confirmed || s.splice(l, s.length - l);
    else if ((c.layer.removed || c.removed) && !t && !n) s.splice(l, 1);
    else if (c.layer.type === "reference" && !t && !o) s.splice(l, 1);
    else {
      if (c.layer && (c.layer = { id: c.layer.id }), (c == null ? void 0 : c.pastedLayer) && (c.pastedLayer = { id: c.pastedLayer.id }), c == null ? void 0 : c.points) {
        let u = [];
        for (let d = 0; d < c.points.length; d++) {
          const f = c.points[d];
          u.push(f.x, f.y, f.brushSize);
        }
        c.points = u;
      }
      delete c.snapshot;
    }
  }
  return s;
}
function yn(e = false, t = false) {
  i.offScreenCTX.clearRect(0, 0, i.offScreenCVS.width, i.offScreenCVS.height), i.offScreenCTX.imageSmoothingEnabled = false, i.layers.forEach((o) => {
    !o.hidden && !o.removed && o.opacity > 0 && (!o.isPreview || t) && (i.offScreenCTX.save(), i.offScreenCTX.globalAlpha = o.opacity, o.type === "raster" ? i.offScreenCTX.drawImage(o.cvs, 0, 0, i.offScreenCVS.width, i.offScreenCVS.height) : e && o.type === "reference" && i.offScreenCTX.drawImage(o.img, o.x, o.y, o.img.width * o.scale, o.img.height * o.scale), i.offScreenCTX.restore());
  });
}
function Fa() {
  let e = document.createElement("canvas"), t = e.getContext("2d", { willReadFrequently: true });
  e.width = i.offScreenCVS.width, e.height = i.offScreenCVS.height;
  let o = document.createElement("canvas"), n = o.getContext("2d", { desynchronized: true });
  o.className = "onscreen-canvas", T.canvasLayers.appendChild(o), o.width = o.offsetWidth * i.sharpness, o.height = o.offsetHeight * i.sharpness, n.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0);
  let s = i.layers.reduce((a, l) => l.id > a ? l.id : a, 0);
  return { id: s + 1, type: "raster", title: `Layer ${s + 1}`, cvs: e, ctx: t, onscreenCvs: o, onscreenCtx: n, x: 0, y: 0, scale: 1, opacity: 1, inactiveTools: [], hidden: false, removed: false };
}
function Ja(e) {
  let t = document.createElement("canvas"), o = t.getContext("2d", { desynchronized: true });
  t.className = "onscreen-canvas", T.canvasLayers.insertBefore(t, T.canvasLayers.children[0]), t.width = t.offsetWidth * i.sharpness, t.height = t.offsetHeight * i.sharpness, o.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0);
  let n = i.offScreenCVS.width / e.width > i.offScreenCVS.height / e.height ? i.offScreenCVS.height / e.height : i.offScreenCVS.width / e.width, s = i.layers.reduce((a, l) => l.id > a ? l.id : a, 0);
  return { id: s + 1, type: "reference", title: `Reference ${s + 1}`, img: e, dataUrl: e.src, onscreenCvs: t, onscreenCtx: o, x: 0, y: 0, scale: n, opacity: 1, inactiveTools: ["brush", "fill", "curve", "ellipse", "select"], hidden: false, removed: false };
}
function Za() {
  let e = document.createElement("canvas"), t = e.getContext("2d", { willReadFrequently: true });
  e.width = i.offScreenCVS.width, e.height = i.offScreenCVS.height;
  let o = document.createElement("canvas"), n = o.getContext("2d", { desynchronized: true });
  return o.className = "onscreen-canvas", { id: 0, type: "raster", title: "Preview Layer", cvs: e, ctx: t, onscreenCvs: o, onscreenCtx: n, x: 0, y: 0, scale: 1, opacity: 1, inactiveTools: ["brush", "fill", "curve", "ellipse", "select"], hidden: false, removed: false, isPreview: true };
}
const Dp = Object.freeze(Object.defineProperty({ __proto__: null, consolidateLayers: yn, createPreviewLayer: Za, createRasterLayer: Fa, createReferenceLayer: Ja }, Symbol.toStringTag, { value: "Module" })), Qa = "1.2";
function Ts() {
  const { preserveHistory: e, includePalette: t, includeReferenceLayers: o, includeRemovedActions: n } = r.ui.saveSettings;
  let s = Yp(i.layers, e, o, n), a = Ap(r.timeline.undoStack, r.vector.all, e, n), l = Rp(B.palette, e, t), c = Kp(r.timeline.undoStack, e, o, n);
  yn();
  let u = JSON.stringify({ metadata: { version: Qa, application: "Pixel V", timestamp: Date.now(), backupImage: i.offScreenCVS.toDataURL() }, layers: s, vectors: a, palette: l, history: c, canvasProperties: { width: i.offScreenCVS.width, height: i.offScreenCVS.height, cropOffsetX: r.canvas.cropOffsetX, cropOffsetY: r.canvas.cropOffsetY }, customBrushStamp: lr.pixels.length > 0 ? lr.pixels : null, selectProperties: r.selection.properties });
  return new Blob([u], { type: "application/json" });
}
function Is() {
  return new Promise((e) => {
    setTimeout(() => {
      let t = Ts();
      const o = t.size / 1e6, n = t.size / 1e3, s = o > 1 ? `${o.toFixed(1)} MB` : `${n.toFixed(0)} KB`;
      e(s);
    }, 0);
  });
}
function Xs() {
  return T.fileSizePreview && (T.fileSizePreview.innerText = "Calculating..."), Is().then((e) => {
    T.fileSizePreview && (T.fileSizePreview.innerText = e);
  });
}
function el() {
  const e = Ts(), t = URL.createObjectURL(e), o = document.createElement("a");
  o.href = t, o.download = r.ui.saveSettings.saveAsFileName + ".pxv", document.body.appendChild(o), o.click(), document.body.removeChild(o), URL.revokeObjectURL(t);
}
async function Vp(e) {
  let t;
  try {
    t = JSON.parse(e);
  } catch (s) {
    console.error(s), alert(s);
    return;
  }
  let o = zp(t);
  if (!o.valid) {
    console.error(o.message), alert(o.message);
    return;
  }
  T.canvasLayers.innerHTML = "", i.layers = [], r.timeline.undoStack = [], r.clearRedoStack(), r.timeline.clearPoints(), r.clipboard.pastedImages = {}, r.vector.all = {}, r.vector.highestKey = 0, r.vector.savedProperties = {}, r.timeline.clearActiveIndexes(), r.timeline.clearSavedBetweenActionImages(), r.deselect(), S.reset(), t.metadata.version === "1.0" && (t.vectors = {}), t.metadata.version === "1.1" && t.canvasProperties && (t.canvasProperties.cropOffsetX = 0, t.canvasProperties.cropOffsetY = 0);
  let n = [];
  t.layers.forEach((s) => {
    if (s.type === "raster") {
      let c = document.createElement("canvas"), u = c.getContext("2d", { willReadFrequently: true });
      c.width = i.offScreenCVS.width, c.height = i.offScreenCVS.height, s.cvs = c, s.ctx = u;
    }
    let a = document.createElement("canvas"), l = a.getContext("2d", { willReadFrequently: true });
    if (a.className = "onscreen-canvas", T.canvasLayers.appendChild(a), a.width = a.offsetWidth * i.sharpness, a.height = a.offsetHeight * i.sharpness, l.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), s.onscreenCvs = a, s.onscreenCtx = l, s.type === "reference" && s.dataUrl) {
      let c = new Image();
      c.src = s.dataUrl;
      let u = new Promise((d, f) => {
        c.onload = () => {
          s.img = c, d();
        }, c.onerror = f;
      });
      n.push(u);
    }
    i.layers.push(s);
  }), i.currentLayer = i.layers[i.layers.length - 1], t.palette && (B.activePaletteIndex = null, B.selectedPaletteIndex = null, B.palette = t.palette), t.history.forEach((s, a) => {
    if (s.index || (s.index = a), s == null ? void 0 : s.pastedLayer) {
      let l = i.layers.find((c) => c.id === s.pastedLayer.id);
      l && (s.pastedLayer = l);
    }
    if (s.layer.id === 0) s.layer = i.tempLayer;
    else {
      let l = i.layers.find((c) => c.id === s.layer.id);
      l && (s.layer = l);
    }
    if (t.metadata.version !== Qa && $p(t, s), s == null ? void 0 : s.points) {
      let l = [];
      for (let c = 0; c < s.points.length; c += 3) l.push({ x: s.points[c], y: s.points[c + 1], brushSize: s.points[c + 2] });
      s.points = l;
    }
    if (s == null ? void 0 : s.canvas) {
      let l = document.createElement("canvas");
      l.width = s.canvasProperties.width, l.height = s.canvasProperties.height;
      let c = l.getContext("2d", { willReadFrequently: true }), u = new Image();
      u.src = s.canvasProperties.dataUrl;
      let d = new Promise((f, p) => {
        u.onload = () => {
          c.drawImage(u, 0, 0), r.clipboard.pastedImages[s.pastedImageKey] = { imageData: c.getImageData(0, 0, s.canvasProperties.width, s.canvasProperties.height) }, f();
        }, u.onerror = p;
      });
      n.push(d), s.canvas = l;
    }
    r.timeline.undoStack.push(s);
  });
  for (let s in t.vectors) {
    let a = t.vectors[s], l = i.layers.find((c) => c.id === a.layer.id);
    if (l && (a.layer = l, r.timeline.undoStack[a.action.index])) {
      if (a.action = r.timeline.undoStack[a.action.index], r.vector.all[s] = a, a.vectorProperties.tool) ln.includes(a.vectorProperties.tool) && (a.vectorProperties.tool = "curve");
      else {
        const c = a.vectorProperties.type;
        c && (ln.includes(c) ? (a.vectorProperties.tool = "curve", "line" in a.modes || (a.modes.line = c === "line", a.modes.quadCurve = c === "quadCurve", a.modes.cubicCurve = c === "cubicCurve")) : a.vectorProperties.tool = c);
      }
      a.recordedLayerX === void 0 && (a.recordedLayerX = a.layer.x ?? 0), a.recordedLayerY === void 0 && (a.recordedLayerY = a.layer.y ?? 0), Number(s) > r.vector.highestKey && (r.vector.highestKey = Number(s));
    }
  }
  await Promise.all(n), t.selectProperties && t.selectProperties.px1 !== null && (r.selection.properties = { ...t.selectProperties }, r.selection.setBoundaryBox(r.selection.properties)), t.canvasProperties && (r.canvas.cropOffsetX = t.canvasProperties.cropOffsetX ?? 0, r.canvas.cropOffsetY = t.canvasProperties.cropOffsetY ?? 0), t.customBrushStamp && Array.isArray(t.customBrushStamp) && (lr.pixels = t.customBrushStamp, mr.pixelSet = new Set(t.customBrushStamp.map(({ x: s, y: a }) => a << 16 | s)), Ms()), t.canvasProperties ? Ls(t.canvasProperties.width, t.canvasProperties.height) : (U(null, true), S.render()), st();
}
const ln = ["line", "quadCurve", "cubicCurve"];
function $p(e, t) {
  var _a5, _b2, _c5, _d3, _e5, _f4;
  if (e.metadata.version === "1.1" && (ln.includes(t.tool) && (t.tool = "curve"), t.tool === "modify" && t.processedActions)) for (const o of t.processedActions) for (const n of ["from", "to"]) {
    const s = o[n];
    s && !s.tool && s.type && (s.tool = ln.includes(s.type) ? "curve" : s.type);
  }
  if (e.metadata.version === "1.0") {
    if (t.properties) {
      if ((_a5 = t.properties) == null ? void 0 : _a5.vectorProperties) {
        if (t.properties.vectorProperties.type = t.tool.name, t.properties.vectorProperties.type === "ellipse") {
          t.properties.vectorProperties.unifiedOffset = t.properties.vectorProperties.offset, delete t.properties.vectorProperties.offset;
          let n = Cr(t.properties.vectorProperties.px1, t.properties.vectorProperties.py1, t.properties.vectorProperties.radA, t.properties.vectorProperties.radB, t.properties.vectorProperties.angle, t.properties.vectorProperties.x1Offset, t.properties.vectorProperties.y1Offset);
          t.properties.vectorProperties.weight = n.weight, t.properties.vectorProperties.leftTangentX = n.leftTangentX, t.properties.vectorProperties.leftTangentY = n.leftTangentY, t.properties.vectorProperties.topTangentX = n.topTangentX, t.properties.vectorProperties.topTangentY = n.topTangentY, t.properties.vectorProperties.rightTangentX = n.rightTangentX, t.properties.vectorProperties.rightTangentY = n.rightTangentY, t.properties.vectorProperties.bottomTangentX = n.bottomTangentX, t.properties.vectorProperties.bottomTangentY = n.bottomTangentY;
        }
        r.vector.highestKey += 1;
        let o = r.vector.highestKey;
        e.vectors[o] = { index: o, action: { index: t.index }, layer: t.layer, modes: { ...t.modes }, color: { ...t.color }, brushSize: t.tool.brushSize, brushType: t.tool.brushType, vectorProperties: { ...t.properties.vectorProperties }, hidden: t.hidden, removed: t.removed }, t.vectorIndices = [o], delete t.modes, delete t.color;
      }
      if (((_b2 = t.properties) == null ? void 0 : _b2.points) && (t.points = t.properties.points), t.tool.name === "line") {
        r.vector.highestKey += 1;
        let o = r.vector.highestKey;
        e.vectors[o] = { index: o, action: { index: t.index }, layer: t.layer, modes: { ...t.modes }, color: { ...t.color }, brushSize: t.tool.brushSize, brushType: t.tool.brushType, vectorProperties: { type: "line", px1: t.properties.px1, py1: t.properties.py1, px2: t.properties.px2, py2: t.properties.py2 }, hidden: t.hidden, removed: t.removed }, t.vectorIndices = [o];
      }
      if (((_c5 = t.properties) == null ? void 0 : _c5.maskArray) && (t.maskArray = t.properties.maskArray), ((_d3 = t.properties) == null ? void 0 : _d3.boundaryBox) && (t.boundaryBox = t.properties.boundaryBox), t.tool.name === "select" && (t.selectedVectorIndices = []), ((_e5 = t.properties) == null ? void 0 : _e5.moddedActionIndex) && (t.moddedActionIndex = t.properties.moddedActionIndex), (_f4 = t.properties) == null ? void 0 : _f4.processedActions) {
        t.moddedVectorIndex = e.history[t.moddedActionIndex].vectorIndices[0], t.processedActions = t.properties.processedActions;
        for (let o of t.processedActions) o.moddedVectorIndex = e.history[o.moddedActionIndex].vectorIndices[0];
      }
      t.properties.from && (t.from = t.properties.from), t.properties.to && (t.to = t.properties.to), delete t.properties;
    }
    t.tool.brushSize && (t.brushSize = t.tool.brushSize, t.brushType = t.tool.brushType), t.tool = t.tool.name;
  }
}
const Gp = Object.freeze(Object.defineProperty({ __proto__: null, computeFileSizePreview: Is, loadDrawing: Vp, prepareDrawingForSave: Ts, saveDrawing: el, setSaveFilesizePreview: Xs }, Symbol.toStringTag, { value: "Module" }));
function qp(e, t) {
  if (e.tool === "resize") {
    U(null, true), st(), r.reset(), S.render();
    return;
  }
  let o = null;
  for (let a = r.timeline.undoStack.length - 1; a >= 0; a--) if (r.timeline.undoStack[a].layer === e.layer) {
    o = r.timeline.undoStack[a];
    break;
  }
  const n = r.timeline.undoStack[r.timeline.undoStack.length - 1];
  if (r.selection.properties = { ...n.selectProperties }, r.selection.setBoundaryBox(r.selection.properties), r.selection.maskSet = n.maskSet ? new Set(n.maskSet) : null, r.vector.selectedIndices = new Set(n.selectedVectorIndices), r.vector.selectedIndices.size > 0 ? (r.ui.vectorTransformOpen = true, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "flex"), r.vector.transformMode === cr && Lo()) : (r.ui.vectorTransformOpen = false, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "none")), n.currentVectorIndex !== null && S.setVectorProperties(r.vector.all[n.currentVectorIndex]), o == null ? void 0 : o.snapshot) {
    Wa(o.layer);
    let a = new Image();
    a.src = o.snapshot, a.onload = function() {
      o.layer.ctx.drawImage(a, 0, 0), U(o.layer), e.tool === "paste" && e.confirmed && t === "to" && ts(), st(), r.reset(), S.render();
    };
  } else {
    if (e.layer.type === "reference") U(e.layer);
    else if (U(e.layer, true), o) {
      let a = o.layer.type === "raster" ? o.layer.cvs.toDataURL() : null;
      o.snapshot = a;
    }
    e.tool === "paste" && e.confirmed && t === "to" && ts(), st(), r.reset(), S.render();
  }
}
function tl() {
  const { xMin: e, yMin: t, xMax: o, yMax: n } = r.selection.boundaryBox, s = o - e, a = n - t, l = document.createElement("canvas");
  l.width = s, l.height = a;
  const c = l.getContext("2d", { willReadFrequently: true });
  if (r.selection.maskSet) {
    const u = i.currentLayer.ctx.getImageData(e, t, s, a), d = c.createImageData(s, a), f = u.data, p = d.data;
    for (const h of r.selection.maskSet) {
      const y = h & 65535, v = h >> 16 & 65535, g = y - e, b = ((v - t) * s + g) * 4;
      p[b] = f[b], p[b + 1] = f[b + 1], p[b + 2] = f[b + 2], p[b + 3] = f[b + 3];
    }
    c.putImageData(d, 0, 0);
  } else c.drawImage(i.currentLayer.cvs, e, t, s, a, 0, 0, s, a);
  r.clipboard.select.selectProperties = { ...r.selection.properties }, r.clipboard.select.boundaryBox = { ...r.selection.boundaryBox }, r.clipboard.select.canvas = l, r.clipboard.select.imageData = i.currentLayer.ctx.getImageData(e, t, s, a), r.clipboard.select.vectors = {}, r.clipboard.select.layerX = i.currentLayer.x, r.clipboard.select.layerY = i.currentLayer.y;
}
function rl() {
  let e = {};
  if (r.vector.selectedIndices.forEach((t) => {
    let o = r.vector.all[t];
    e[t] = { ...o };
  }), r.vector.selectedIndices.size === 0) {
    let t = r.vector.all[r.vector.currentIndex];
    e[r.vector.currentIndex] = { ...t };
  }
  r.clipboard.select.selectProperties = { ...r.selection.properties }, r.clipboard.select.boundaryBox = { xMin: null, yMin: null, xMax: null, yMax: null }, r.clipboard.select.canvas = null, r.clipboard.select.vectors = e;
}
function Up(e) {
  if (e && tl(), r.selection.maskSet) {
    const { xMin: t, yMin: o, xMax: n, yMax: s } = r.selection.boundaryBox, a = n - t, l = s - o, c = i.currentLayer.ctx.getImageData(t, o, a, l), { data: u } = c;
    for (const d of r.selection.maskSet) {
      const f = (d & 65535) - t, h = (((d >> 16 & 65535) - o) * a + f) * 4;
      u[h] = u[h + 1] = u[h + 2] = u[h + 3] = 0;
    }
    i.currentLayer.ctx.putImageData(c, t, o);
  } else {
    const { xMin: t, yMin: o, xMax: n, yMax: s } = r.selection.boundaryBox;
    i.currentLayer.ctx.clearRect(t, o, n - t, s - o);
  }
}
function Es(e, t, o, n) {
  S.reset(), i.tempLayer.cvs.width = t.cvs.width, i.tempLayer.cvs.height = t.cvs.height;
  let s = t.onscreenCvs.nextSibling;
  s ? T.canvasLayers.insertBefore(i.tempLayer.onscreenCvs, s) : T.canvasLayers.appendChild(i.tempLayer.onscreenCvs), i.tempLayer.onscreenCvs.width = i.tempLayer.onscreenCvs.offsetWidth * i.sharpness, i.tempLayer.onscreenCvs.height = i.tempLayer.onscreenCvs.offsetHeight * i.sharpness, i.tempLayer.onscreenCtx.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.tempLayer.x = t.x, i.tempLayer.y = t.y, i.tempLayer.opacity = t.opacity, i.layers.splice(i.layers.indexOf(t) + 1, 0, i.tempLayer), t.inactiveTools.forEach((a) => {
    T[`${a}Btn`] && (T[`${a}Btn`].disabled = false);
  }), i.pastedLayer = t, i.currentLayer = i.tempLayer, i.currentLayer.inactiveTools.forEach((a) => {
    T[`${a}Btn`] && T[`${a}Btn`].classList.add("deactivate-paste");
  }), r.selection.properties = { ...e.selectProperties }, r.selection.properties.px1 += o, r.selection.properties.px2 += o, r.selection.properties.py1 += n, r.selection.properties.py2 += n, r.selection.setBoundaryBox(r.selection.properties), ol(e, i.tempLayer, o, n), S.render();
}
function Hp(e, t) {
  const o = t.x, n = t.y;
  ol(e, t, o, n);
}
function ol(e, t, o, n) {
  const { boundaryBox: s } = e;
  t.ctx.drawImage(e.canvas, s.xMin + o, s.yMin + n, s.xMax - s.xMin, s.yMax - s.yMin);
}
function Io() {
  if (r.tool.current.brushType === "custom") return { entry: gt.custom, brushSize: 32 };
  const e = r.tool.current.brushSize;
  return { entry: gt[r.tool.current.brushType][e], brushSize: e };
}
function Bt() {
  var _a5, _b2, _c5, _d3;
  switch (r.tool.current.name) {
    case "grab":
      break;
    case "eyedropper":
      Pn(0.5);
      break;
    case "select":
      break;
    case "move":
      break;
    default:
      if (!S.selectedCollisionPresent && !r.vector.collidedIndex && r.vector.selectedIndices.size === 0) {
        const e = r.tool.current.ditherPatternIndex !== void 0 && r.tool.current.ditherPatternIndex < 63 || (((_a5 = r.tool.current.modes) == null ? void 0 : _a5.buildUpDither) ?? false);
        ((_b2 = r.tool.current.modes) == null ? void 0 : _b2.eraser) ? (S.showCursorPreview && (e ? pi() : fi()), Pn(0.5)) : S.showCursorPreview ? e ? ((_c5 = r.tool.current.modes) == null ? void 0 : _c5.inject) ? pi() : Wp() : ((_d3 = r.tool.current.modes) == null ? void 0 : _d3.inject) ? fi() : Np() : Pn(0.5);
      } else jp();
  }
}
function fi() {
  U(i.currentLayer);
  const { entry: e, brushSize: t } = Io();
  on(r.cursor.x, r.cursor.y, e["0,0"], Wt({ layer: i.currentLayer, isPreview: true, excludeFromSet: true, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet, seenPixelsSet: r.selection.seenPixelsSet, brushSize: t }));
}
function pi() {
  var _a5, _b2;
  U(i.currentLayer);
  const { entry: e, brushSize: t } = Io(), o = e["0,0"], n = Wt({ layer: i.currentLayer, isPreview: true, excludeFromSet: true, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet, seenPixelsSet: r.selection.seenPixelsSet, brushSize: t, ditherPattern: Ze[r.tool.current.ditherPatternIndex], twoColorMode: ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.twoColor) ?? false, secondaryColor: B.secondary.color, ditherOffsetX: r.tool.current.ditherOffsetX ?? 0, ditherOffsetY: r.tool.current.ditherOffsetY ?? 0, densityMap: r.tool.current._buildUpDensityMap, buildUpSteps: r.tool.current.buildUpSteps });
  ((_b2 = r.tool.current.modes) == null ? void 0 : _b2.buildUpDither) ? vn(r.cursor.x, r.cursor.y, o, n) : Pr(r.cursor.x, r.cursor.y, o, n);
}
function Np() {
  const { entry: e, brushSize: t } = Io(), o = e["0,0"], n = Math.ceil(r.cursor.x - t / 2), s = Math.ceil(r.cursor.y - t / 2);
  i.cursorCTX.fillStyle = B.primary.color.color;
  for (const a of o) {
    const l = n + a.x, c = s + a.y;
    Ut(l, c, 0, i.currentLayer, r.selection.boundaryBox) || r.selection.maskSet && !r.selection.maskSet.has(c << 16 | l) || i.cursorCTX.fillRect(l + i.xOffset, c + i.yOffset, 1, 1);
  }
}
function Wp() {
  var _a5, _b2;
  const { entry: e, brushSize: t } = Io(), o = e["0,0"], n = Math.ceil(r.cursor.x - t / 2), s = Math.ceil(r.cursor.y - t / 2), a = ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.twoColor) ?? false, l = r.tool.current.ditherOffsetX ?? 0, c = r.tool.current.ditherOffsetY ?? 0, u = ((_b2 = r.tool.current.modes) == null ? void 0 : _b2.buildUpDither) ?? false, d = u ? r.tool.current._buildUpDensityMap : null, f = r.tool.current.buildUpSteps, p = u ? null : Ze[r.tool.current.ditherPatternIndex];
  for (const h of o) {
    const y = n + h.x, v = s + h.y;
    if (Ut(y, v, 0, i.currentLayer, r.selection.boundaryBox) || r.selection.maskSet && !r.selection.maskSet.has(v << 16 | y)) continue;
    let g;
    if (u) {
      const x = d ? d.get(v << 16 | y) ?? 0 : 0, b = Math.min(x, f.length - 1);
      g = Ze[f[b]];
    } else g = p;
    hn(g, y, v, l, c) ? (i.cursorCTX.fillStyle = B.primary.color.color, i.cursorCTX.fillRect(y + i.xOffset, v + i.yOffset, 1, 1)) : a && (i.cursorCTX.fillStyle = B.secondary.color.color, i.cursorCTX.fillRect(y + i.xOffset, v + i.yOffset, 1, 1));
  }
}
function jp() {
  var _a5, _b2;
  S.showCursorPreview && (((_a5 = r.tool.current.modes) == null ? void 0 : _a5.eraser) || ((_b2 = r.tool.current.modes) == null ? void 0 : _b2.inject)) && U(i.currentLayer);
}
function Pn(e) {
  const t = jt(e), { entry: o, brushSize: n } = Io();
  let s = Math.floor(n / 2), a = t / 2;
  const l = o.pixelSet;
  i.vectorGuiCTX.beginPath();
  for (const c of o["0,0"]) {
    const u = r.cursor.x + i.xOffset + c.x - s, d = r.cursor.y + i.yOffset + c.y - s, f = l.has(c.y - 1 << 16 | c.x), p = l.has(c.y << 16 | c.x + 1), h = l.has(c.y + 1 << 16 | c.x), y = l.has(c.y << 16 | c.x - 1);
    f || (i.vectorGuiCTX.moveTo(u, d - a), i.vectorGuiCTX.lineTo(u + 1, d - a)), p || (i.vectorGuiCTX.moveTo(u + 1 + a, d), i.vectorGuiCTX.lineTo(u + 1 + a, d + 1)), h || (i.vectorGuiCTX.moveTo(u, d + 1 + a), i.vectorGuiCTX.lineTo(u + 1, d + 1 + a)), y || (i.vectorGuiCTX.moveTo(u - a, d), i.vectorGuiCTX.lineTo(u - a, d + 1));
  }
  Pt(i.vectorGuiCTX, t, "black", "white");
}
function Bs(e = true) {
  if (i.currentLayer.type === "raster" && !i.currentLayer.isPreview && (r.selection.boundaryBox.xMax !== null || r.vector.currentIndex !== null || r.vector.selectedIndices.size > 0)) {
    if (r.selection.boundaryBox.xMax !== null) {
      Up(e);
      const t = { ...r.selection.boundaryBox };
      t.xMax !== null && (t.xMin -= i.currentLayer.x, t.xMax -= i.currentLayer.x, t.yMin -= i.currentLayer.y, t.yMax -= i.currentLayer.y), Se({ tool: ie.cut.name, layer: i.currentLayer, properties: { boundaryBox: t, originalLayerX: i.currentLayer.x, originalLayerY: i.currentLayer.y } }), r.clearRedoStack(), U(i.currentLayer), S.render();
    } else if (r.vector.currentIndex !== null || r.vector.selectedIndices.size > 0) {
      e && rl();
      let t = [];
      r.vector.selectedIndices.size > 0 ? (r.vector.selectedIndices.forEach((o) => {
        r.vector.all[o].removed = true;
      }), t = Array.from(r.vector.selectedIndices)) : (r.vector.all[r.vector.currentIndex].removed = true, t = [r.vector.currentIndex]), r.deselect(), U(i.currentLayer, true), Se({ tool: ie.remove.name, layer: i.currentLayer, properties: { vectorIndices: t, from: false, to: true } }), r.clearRedoStack(), S.render();
    }
  }
}
function rs() {
  var _a5, _b2, _c5;
  if (i.currentLayer.type === "raster" && !i.currentLayer.isPreview && (r.clipboard.select.canvas || Object.keys(r.clipboard.select.vectors).length > 0)) {
    const e = r.clipboard.select.layerX ?? 0, t = r.clipboard.select.layerY ?? 0, o = { ...r.clipboard.select.boundaryBox };
    o.xMax !== null && (o.xMin -= e, o.xMax -= e, o.yMin -= t, o.yMax -= t);
    const n = { ...r.clipboard.select.selectProperties };
    if (n.px2 !== null && (n.px1 -= e, n.px2 -= e, n.py1 -= t, n.py2 -= t), r.clipboard.select.canvas) {
      const s = { ...r.clipboard.select, boundaryBox: o, selectProperties: n };
      Es(s, i.currentLayer, i.currentLayer.x, i.currentLayer.y);
      let a = null;
      r.clipboard.select.canvas && (r.clipboard.highestPastedImageKey += 1, a = r.clipboard.highestPastedImageKey), r.clipboard.select.imageData && (r.clipboard.pastedImages[a] = { imageData: r.clipboard.select.imageData }, r.clipboard.currentPastedImageKey = a), r.vector.clearSelected(), r.ui.vectorTransformOpen = false, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "none"), Se({ tool: ie.paste.name, layer: i.currentLayer, properties: { confirmed: false, boundaryBox: o, selectProperties: n, pastedImageKey: a, canvas: r.clipboard.select.canvas, canvasProperties: { dataUrl: (_a5 = r.clipboard.select.canvas) == null ? void 0 : _a5.toDataURL(), width: (_b2 = r.clipboard.select.canvas) == null ? void 0 : _b2.width, height: (_c5 = r.clipboard.select.canvas) == null ? void 0 : _c5.height }, pastedLayer: i.pastedLayer } }), r.clearRedoStack(), U(i.currentLayer), De("move"), st();
    } else if (Object.keys(r.clipboard.select.vectors).length > 0) {
      const s = JSON.parse(JSON.stringify(r.clipboard.select.vectors));
      for (const [l, c] of Object.entries(s)) {
        c.layer = i.currentLayer;
        const u = r.vector.nextKey();
        c.index = u, delete s[l], s[u] = c, r.vector.all[u] = c;
      }
      r.vector.clearSelected();
      const a = Object.keys(s);
      a.forEach((l) => {
        r.vector.addSelected(parseInt(l));
      }), r.vector.selectedIndices.size > 0 ? (r.ui.vectorTransformOpen = true, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "flex"), r.vector.transformMode === cr && Lo()) : (r.ui.vectorTransformOpen = false, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "none")), Se({ tool: ie.vectorPaste.name, layer: i.currentLayer, properties: { boundaryBox: o, selectProperties: n, vectorIndices: a } }), a.forEach((l) => {
        r.vector.all[l].action = r.timeline.currentAction;
      }), r.clearRedoStack(), U(i.currentLayer, true), st(), S.render();
    }
  }
}
function nl() {
  let e = null;
  for (let t = r.timeline.undoStack.length - 1; t >= 0; t--) if (r.timeline.undoStack[t].tool === "paste" && !r.timeline.undoStack[t].confirmed) {
    e = r.timeline.undoStack[t];
    break;
  }
  if (i.currentLayer.type === "raster" && e) {
    const t = i.tempLayer.x, o = i.tempLayer.y, n = { ...r.selection.boundaryBox }, s = { ...r.selection.properties }, a = document.createElement("canvas");
    a.width = n.xMax - n.xMin, a.height = n.yMax - n.yMin, a.getContext("2d").drawImage(i.currentLayer.cvs, n.xMin, n.yMin, a.width, a.height, 0, 0, a.width, a.height), n.xMax !== null && (n.xMin -= i.pastedLayer.x, n.xMax -= i.pastedLayer.x, n.yMin -= i.pastedLayer.y, n.yMax -= i.pastedLayer.y), s.px2 !== null && (s.px1 -= i.pastedLayer.x, s.px2 -= i.pastedLayer.x, s.py1 -= i.pastedLayer.y, s.py2 -= i.pastedLayer.y), Hp({ boundaryBox: n, canvas: a }, i.pastedLayer), ts(), Se({ tool: ie.paste.name, layer: i.currentLayer, properties: { confirmed: true, preConfirmXOffset: t, preConfirmYOffset: o, boundaryBox: n, selectProperties: s, pastedImageKey: r.clipboard.currentPastedImageKey, canvas: a, canvasProperties: { dataUrl: a == null ? void 0 : a.toDataURL(), width: a == null ? void 0 : a.width, height: a == null ? void 0 : a.height } } }), r.clearRedoStack(), r.clipboard.currentPastedImageKey = null, r.transform.rotationDegrees = 0, r.transform.isMirroredHorizontally = false, r.transform.isMirroredVertically = false, S.render(), U(i.currentLayer), st();
  }
}
function sl() {
  i.currentLayer.type === "raster" && (r.selection.boundaryBox.xMax !== null || r.vector.currentIndex !== null || r.vector.selectedIndices.size > 0) && (r.selection.boundaryBox.xMax !== null ? tl() : rl());
}
function Fp() {
  i.pastedLayer || i.currentLayer.type === "raster" && !i.currentLayer.isPreview && (r.deselect(), r.selection.properties.px1 = 0, r.selection.properties.py1 = 0, r.selection.properties.px2 = i.currentLayer.cvs.width, r.selection.properties.py2 = i.currentLayer.cvs.height, r.selection.setBoundaryBox(r.selection.properties), Se({ tool: ie.select.name, layer: i.currentLayer, properties: { deselect: false } }), r.clearRedoStack(), S.render());
}
function Jp(e) {
  if (!r.vector.selectedIndices.has(e)) {
    r.vector.addSelected(e), r.ui.vectorTransformOpen = true, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "flex"), r.vector.transformMode === cr && Lo(), Se({ tool: ie.select.name, layer: i.currentLayer, properties: { deselect: false } }), r.clearRedoStack();
    const [t, o] = ks(r.vector.selectedIndices, r.vector.all);
    r.vector.shapeCenterX = t + i.currentLayer.x, r.vector.shapeCenterY = o + i.currentLayer.y, S.mother.newRotation = 0, S.mother.currentRotation = 0;
  }
}
function Zp(e) {
  if (r.vector.selectedIndices.has(e)) {
    r.vector.removeSelected(e), r.vector.selectedIndices.size === 0 ? (r.ui.vectorTransformOpen = false, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "none"), r.deselect()) : r.vector.selectedIndices.size > 0 && r.vector.transformMode === cr && Lo(), Se({ tool: ie.select.name, layer: i.currentLayer, properties: { deselect: false } }), r.clearRedoStack();
    const [t, o] = ks(r.vector.selectedIndices, r.vector.all);
    r.vector.shapeCenterX = t + i.currentLayer.x, r.vector.shapeCenterY = o + i.currentLayer.y, S.mother.newRotation = 0, S.mother.currentRotation = 0;
  }
}
function Xo() {
  !i.currentLayer.isPreview && (r.selection.boundaryBox.xMax !== null || r.vector.selectedIndices.size > 0 || r.vector.currentIndex !== null) && (r.deselect(), Se({ tool: ie.select.name, layer: i.currentLayer, properties: {} }), r.clearRedoStack(), S.render());
}
function il() {
  Bs(false);
}
function De(e = null, t = null) {
  var _a5, _b2, _c5, _d3;
  const o = (t == null ? void 0 : t.id) ?? e;
  if (o && ie[o]) {
    if ((_b2 = (_a5 = i.currentLayer) == null ? void 0 : _a5.inactiveTools) == null ? void 0 : _b2.includes(o)) if (i.currentLayer.isPreview) nl();
    else return;
    ((_c5 = r.tool.current) == null ? void 0 : _c5.name) !== o && (r.tool.current = ie[o]), r.tool.selectedName = o;
    for (const [, n] of Object.entries(hr)) if (n.tools.includes(o)) {
      n.activeTool = o;
      break;
    }
    U(i.currentLayer), ((_d3 = r.tool.current.modes) == null ? void 0 : _d3.eraser) ? i.vectorGuiCVS.style.cursor = "none" : i.vectorGuiCVS.style.cursor = r.tool.current.cursor, ["fill", "curve", "ellipse", "polygon", "move"].includes(ie[o].name) || r.vector.selectedIndices.size > 0 && Xo(), S.reset(), r.reset(), Bt();
  }
}
function Jt(e = null, t = null) {
  var _a5, _b2;
  const o = (t == null ? void 0 : t.id) ?? e;
  if (!o) return;
  const n = (_a5 = r.tool.current) == null ? void 0 : _a5.modes;
  if (!n || n[o] === void 0) return;
  const s = r.tool.selectedName, a = (_b2 = ie[s]) == null ? void 0 : _b2.modes;
  function l(c, u) {
    n[c] = u, a && (a[c] = u);
  }
  if (n[o]) {
    if (No.includes(o)) return;
    l(o, false);
  } else l(o, true), o === "eraser" && n.inject ? l("inject", false) : o === "inject" && n.eraser && l("eraser", false), No.includes(o) && No.forEach((c) => {
    c !== o && l(c, false);
  });
  n.eraser ? i.vectorGuiCVS.style.cursor = "none" : i.vectorGuiCVS.style.cursor = r.tool.current.cursor, Bt();
}
function Qp(e, t) {
  e.processedActions.forEach((o) => {
    const n = r.vector.all[o.moddedVectorIndex];
    n.vectorProperties = { ...o[t] };
  });
}
function eh(e) {
  let t = e.upToIndex, o = 0;
  r.timeline.undoStack.forEach((n) => {
    o > t || (o++, n.layer === i.currentLayer && (n.removed = !n.removed, n.vectorIndices && n.vectorIndices.forEach((s) => {
      r.vector.all[s].removed = !r.vector.all[s].removed;
    })));
  });
}
function th(e, t) {
  if (t === "from") i.layers.splice(i.layers.indexOf(i.tempLayer), 1), T.canvasLayers.removeChild(i.tempLayer.onscreenCvs), i.tempLayer.inactiveTools.forEach((o) => {
    T[`${o}Btn`] && (T[`${o}Btn`].disabled = false, T[`${o}Btn`].classList.remove("deactivate-paste"));
  }), i.currentLayer = e.pastedLayer, i.pastedLayer = null, i.currentLayer.inactiveTools.forEach((o) => {
    T[`${o}Btn`] && (T[`${o}Btn`].disabled = true);
  });
  else if (t === "to") {
    const o = { ...e.selectProperties };
    o.px1 += e.pastedLayer.x, o.px2 += e.pastedLayer.x, o.py1 += e.pastedLayer.y, o.py2 += e.pastedLayer.y;
    const n = { ...e.boundaryBox };
    n.xMin += e.pastedLayer.x, n.xMax += e.pastedLayer.x, n.yMin += e.pastedLayer.y, n.yMax += e.pastedLayer.y;
    const s = { selectProperties: o, boundaryBox: n, canvas: e.canvas };
    Es(s, e.pastedLayer, 0, 0), r.clipboard.currentPastedImageKey = e.pastedImageKey, De("move");
  }
}
function rh(e, t, o) {
  var _a5;
  if (o === "from") {
    const n = { selectProperties: e.selectProperties, boundaryBox: e.boundaryBox, canvas: e.canvas };
    let s = e.layer.x, a = e.layer.y;
    Es(n, e.layer, s, a), ((_a5 = t == null ? void 0 : t.tool) == null ? void 0 : _a5.name) === "move" && (i.currentLayer.x = t.to.x, i.currentLayer.y = t.to.y), r.clipboard.currentPastedImageKey = e.pastedImageKey, De("move");
  }
}
function oh(e, t) {
  let o = e[t].x - e.layer.x, n = e[t].y - e.layer.y;
  e.layer.x = e[t].x, e.layer.y = e[t].y, e.layer.scale = e[t].scale, r.vector.properties.px1 && (r.vector.properties.px1 += o, r.vector.properties.py1 += n), r.vector.properties.px2 && (r.vector.properties.px2 += o, r.vector.properties.py2 += n), r.vector.properties.px3 && (r.vector.properties.px3 += o, r.vector.properties.py3 += n), r.vector.properties.px4 && (r.vector.properties.px4 += o, r.vector.properties.py4 += n);
}
function nh(e, t, o) {
  if (o === "from") {
    const n = { ...t.selectProperties };
    n.px1 += t.layer.x, n.px2 += t.layer.x, n.py1 += t.layer.y, n.py2 += t.layer.y, r.selection.properties = { ...n }, r.selection.setBoundaryBox(r.selection.properties), t.tool === "transform" && (jr(t.layer, r.clipboard.pastedImages[t.pastedImageKey].imageData, r.selection.boundaryBox, t.transformationRotationDegrees % 360, t.isMirroredHorizontally, t.isMirroredVertically), r.transform.rotationDegrees = t.transformationRotationDegrees, r.transform.isMirroredHorizontally = t.isMirroredHorizontally, r.transform.isMirroredVertically = t.isMirroredVertically);
  } else if (o === "to") {
    const n = { ...e.selectProperties };
    n.px1 += e.layer.x, n.px2 += e.layer.x, n.py1 += e.layer.y, n.py2 += e.layer.y, r.selection.properties = { ...n }, r.selection.setBoundaryBox(r.selection.properties), jr(e.layer, r.clipboard.pastedImages[e.pastedImageKey].imageData, r.selection.boundaryBox, e.transformationRotationDegrees % 360, e.isMirroredHorizontally, e.isMirroredVertically), r.transform.rotationDegrees = e.transformationRotationDegrees, r.transform.isMirroredHorizontally = e.isMirroredHorizontally, r.transform.isMirroredVertically = e.isMirroredVertically;
  }
}
function sh(e, t) {
  const o = e[t], n = o.cropOffsetX - r.canvas.cropOffsetX, s = o.cropOffsetY - r.canvas.cropOffsetY;
  r.canvas.cropOffsetX = o.cropOffsetX, r.canvas.cropOffsetY = o.cropOffsetY, oe.ditherOffsetX = ((oe.ditherOffsetX - n) % 8 + 8) % 8, oe.ditherOffsetY = ((oe.ditherOffsetY - s) % 8 + 8) % 8;
  const a = document.querySelector(".dither-picker-container");
  a && Vt(a, oe.ditherOffsetX, oe.ditherOffsetY);
  const l = document.querySelector(".dither-preview");
  l && Vt(l, oe.ditherOffsetX, oe.ditherOffsetY);
  const c = document.querySelector(".dither-offset-control");
  if (c && bo(c.parentElement, oe.ditherOffsetX, oe.ditherOffsetY), r.selection.properties.px1 !== null && (r.selection.properties.px1 += n, r.selection.properties.py1 += s, r.selection.properties.px2 += n, r.selection.properties.py2 += s, r.selection.setBoundaryBox(r.selection.properties)), r.selection.maskSet) {
    const u = /* @__PURE__ */ new Set(), d = o.width, f = o.height;
    for (const p of r.selection.maskSet) {
      const h = (p & 65535) + n, y = (p >> 16 & 65535) + s;
      h >= 0 && h < d && y >= 0 && y < f && u.add(y << 16 | h);
    }
    r.selection.maskSet = u;
  }
  ja(o.width, o.height, n, s);
}
function al(e, t, o) {
  var _a5;
  let n = t[t.length - 1];
  S.reset();
  let s = o === "from" && t.length > 1 ? t[t.length - 2] : null;
  if (o === "from" && t.length > 1 && s.tool === "modify" && (s = t[s.moddedActionIndex]), n.tool === "modify") Qp(n, o);
  else if (n.tool === "changeMode") {
    r.vector.all[n.moddedVectorIndex].modes = { ...n[o] };
    const a = o === "from" ? n.fromVectorProperties : n.toVectorProperties;
    a && Object.assign(r.vector.all[n.moddedVectorIndex].vectorProperties, a);
  } else n.tool === "changeDitherPattern" ? r.vector.all[n.moddedVectorIndex].ditherPatternIndex = n[o] : n.tool === "changeDitherOffset" ? (r.vector.all[n.moddedVectorIndex].ditherOffsetX = n[o].x, r.vector.all[n.moddedVectorIndex].ditherOffsetY = n[o].y) : n.tool === "changeBrushSize" ? r.vector.all[n.moddedVectorIndex].brushSize = n[o] : n.tool === "changeColor" ? r.vector.all[n.moddedVectorIndex].color = { ...n[o] } : n.tool === "remove" ? ((_a5 = n.vectorIndices) == null ? void 0 : _a5.length) > 0 && n.vectorIndices.forEach((a) => {
    r.vector.all[a].removed = n[o];
  }) : n.tool === "clear" ? eh(n) : n.tool === "addLayer" ? o === "from" ? n.layer.removed = true : o === "to" && (n.layer.removed = false) : n.tool === "removeLayer" ? o === "from" ? n.layer.removed = false : o === "to" && (n.layer.removed = true) : n.tool === "paste" ? n.confirmed ? rh(n, s, o) : th(n, o) : n.tool === "move" ? oh(n, o) : n.tool === "transform" ? nh(n, s, o) : n.tool === "resize" && sh(n, o);
  e.push(t.pop()), qp(n, o), r.ui.saveDialogOpen && Xs();
}
function ll() {
  r.timeline.undoStack.length > 1 && al(r.timeline.redoStack, r.timeline.undoStack, "from");
}
function cl() {
  r.timeline.redoStack.length >= 1 && al(r.timeline.undoStack, r.timeline.redoStack, "to");
}
function Se(e) {
  const { tool: t, layer: o, properties: n } = e;
  let s = o.type === "raster" ? o.cvs.toDataURL() : null;
  r.timeline.currentAction = { index: r.timeline.undoStack.length, tool: t, layer: o, ...n, selectProperties: { ...r.selection.properties }, maskSet: r.selection.maskSet ? Array.from(r.selection.maskSet) : null, selectedVectorIndices: Array.from(r.vector.selectedIndices), currentVectorIndex: r.vector.currentIndex, hidden: false, removed: false, snapshot: s }, r.timeline.undoStack.push(r.timeline.currentAction), r.ui.saveDialogOpen && Xs();
}
function ih() {
  var _a5, _b2, _c5, _d3, _e5, _f4, _g, _h4;
  let e = "0,0";
  switch (i.pointerEvent) {
    case "pointerdown": {
      ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.colorMask) && (r.selection.maskSet = Lp(B.secondary.color, i.currentLayer)), r.selection.pointsSet = /* @__PURE__ */ new Set(), r.selection.seenPixelsSet = /* @__PURE__ */ new Set(), ((_b2 = r.tool.current.modes) == null ? void 0 : _b2.buildUpDither) && Fr();
      const t = r.tool.current.brushType === "custom";
      oe._strokeCtx = Wt({ layer: i.currentLayer, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet, seenPixelsSet: r.selection.seenPixelsSet, brushStamp: t ? gt.custom : gt[r.tool.current.brushType][r.tool.current.brushSize], brushSize: t ? 32 : r.tool.current.brushSize, ditherPattern: Ze[r.tool.current.ditherPatternIndex], twoColorMode: (_c5 = r.tool.current.modes) == null ? void 0 : _c5.twoColor, secondaryColor: B.secondary.color, ditherOffsetX: r.tool.current.ditherOffsetX, ditherOffsetY: r.tool.current.ditherOffsetY, densityMap: oe._buildUpDensityMap, buildUpSteps: r.tool.current.buildUpSteps, customStampColorMap: null }), oe._previewStrokeCtx = { ...oe._strokeCtx, isPreview: true, excludeFromSet: true }, $r(r.cursor.x, r.cursor.y, e), r.tool.lineStartX = r.cursor.x, r.tool.lineStartY = r.cursor.y, r.drawing.lastDrawnX = r.cursor.x, r.drawing.lastDrawnY = r.cursor.y, r.drawing.waitingPixelX = r.cursor.x, r.drawing.waitingPixelY = r.cursor.y, Ko(i.currentLayer);
      break;
    }
    case "pointermove":
      ((_d3 = r.tool.current.options.line) == null ? void 0 : _d3.active) ? (U(i.currentLayer), za(r.tool.lineStartX, r.tool.lineStartY, r.cursor.x, r.cursor.y, { ...oe._strokeCtx, isPreview: true })) : vi() ? (yi(), Ko(i.currentLayer)) : ((_e5 = r.tool.current.modes) == null ? void 0 : _e5.perfect) ? lh() : (e = Ht(r.cursor.x, r.cursor.y, r.cursor.prevX, r.cursor.prevY), $r(r.cursor.x, r.cursor.y, e), Ko(i.currentLayer));
      break;
    case "pointerup": {
      vi() && yi(), $r(r.cursor.x, r.cursor.y, e), Ko(i.currentLayer);
      let t = To(r.selection.maskSet, i.currentLayer.x + r.canvas.cropOffsetX, i.currentLayer.y + r.canvas.cropOffsetY);
      const o = { ...r.selection.boundaryBox };
      o.xMax !== null && (o.xMin -= i.currentLayer.x + r.canvas.cropOffsetX, o.xMax -= i.currentLayer.x + r.canvas.cropOffsetX, o.yMin -= i.currentLayer.y + r.canvas.cropOffsetY, o.yMax -= i.currentLayer.y + r.canvas.cropOffsetY);
      const n = { modes: { ...r.tool.current.modes }, color: { ...B.primary.color }, secondaryColor: { ...B.secondary.color }, brushSize: r.tool.current.brushType === "custom" ? 32 : r.tool.current.brushSize, brushType: r.tool.current.brushType, customStampEntry: r.tool.current.brushType === "custom" ? gt.custom : null, ditherPatternIndex: r.tool.current.ditherPatternIndex, ditherOffsetX: ((r.tool.current.ditherOffsetX + r.canvas.cropOffsetX) % 8 + 8) % 8, ditherOffsetY: ((r.tool.current.ditherOffsetY + r.canvas.cropOffsetY) % 8 + 8) % 8, recordedLayerX: i.currentLayer.x, recordedLayerY: i.currentLayer.y, points: r.timeline.points, maskArray: t, boundaryBox: o };
      if ((_f4 = r.tool.current.modes) == null ? void 0 : _f4.buildUpDither) {
        const s = i.currentLayer.x + r.canvas.cropOffsetX, a = i.currentLayer.y + r.canvas.cropOffsetY;
        n.buildUpDensityDelta = [...r.selection.seenPixelsSet].map((l) => {
          const c = (l & 65535) - s;
          return (l >>> 16 & 65535) - a << 16 | c;
        }), n.buildUpSteps = [...r.tool.current.buildUpSteps];
      }
      Se({ tool: oe.name, layer: i.currentLayer, properties: n }), ((_g = r.tool.current.modes) == null ? void 0 : _g.buildUpDither) && Fr(), ((_h4 = r.tool.current.modes) == null ? void 0 : _h4.colorMask) && (r.selection.maskSet = null);
      break;
    }
  }
}
function ah(e, t) {
  const o = t << 16 | e;
  r.selection.pointsSet.has(o) || (r.timeline.addPoint({ x: e - i.currentLayer.x - r.canvas.cropOffsetX, y: t - i.currentLayer.y - r.canvas.cropOffsetY, brushSize: r.tool.current.brushType === "custom" ? 32 : r.tool.current.brushSize }), r.selection.pointsSet.add(o));
}
function $r(e, t, o) {
  var _a5;
  ah(e, t);
  const n = oe._strokeCtx.brushStamp[o];
  ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.buildUpDither) ? vn(e, t, n, oe._strokeCtx) : Pr(e, t, n, oe._strokeCtx);
}
function hi() {
  var _a5;
  let e = Ht(r.cursor.x, r.cursor.y, r.drawing.lastDrawnX, r.drawing.lastDrawnY);
  const t = oe._previewStrokeCtx.brushStamp[e];
  ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.buildUpDither) ? vn(r.cursor.x, r.cursor.y, t, oe._previewStrokeCtx) : Pr(r.cursor.x, r.cursor.y, t, oe._previewStrokeCtx);
}
function vi() {
  return Math.abs(r.cursor.x - r.cursor.prevX) > 1 || Math.abs(r.cursor.y - r.cursor.prevY) > 1 || r.tool.lineStartX !== null && r.tool.lineStartY !== null;
}
function yi() {
  let e = r.tool.lineStartX !== null ? r.tool.lineStartX : r.cursor.prevX, t = r.tool.lineStartY !== null ? r.tool.lineStartY : r.cursor.prevY, o = Pe(r.cursor.x - e, r.cursor.y - t), n = ko(e, t, r.cursor.x, r.cursor.y, o), s = e, a = t, l = "0,0";
  for (let c = 0; c < n.long; c++) {
    const u = Math.round(e + n.x * c), d = Math.round(t + n.y * c);
    l = Ht(u, d, s, a), $r(u, d, l), s = u, a = d;
  }
  r.tool.lineStartX = null, r.tool.lineStartY = null, l = Ht(r.cursor.x, r.cursor.y, s, a), $r(r.cursor.x, r.cursor.y, l);
}
function lh() {
  let e = "0,0";
  Math.abs(r.cursor.x - r.drawing.lastDrawnX) > 1 || Math.abs(r.cursor.y - r.drawing.lastDrawnY) > 1 ? (e = Ht(r.drawing.waitingPixelX, r.drawing.waitingPixelY, r.drawing.lastDrawnX, r.drawing.lastDrawnY), $r(r.drawing.waitingPixelX, r.drawing.waitingPixelY, e), r.drawing.lastDrawnX = r.drawing.waitingPixelX, r.drawing.lastDrawnY = r.drawing.waitingPixelY, r.drawing.waitingPixelX = r.cursor.x, r.drawing.waitingPixelY = r.cursor.y, U(i.currentLayer), hi()) : (r.drawing.waitingPixelX = r.cursor.x, r.drawing.waitingPixelY = r.cursor.y, U(i.currentLayer), hi());
}
const mi = { "2x2": [15, 31, 47, 63], "4x4": [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63], "8x8": Array.from({ length: 64 }, (e, t) => t) }, oe = { name: "brush", fn: ih, brushSize: 1, brushType: "circle", brushDisabled: false, ditherPatternIndex: 63, ditherOffsetX: 0, ditherOffsetY: 0, options: { line: { active: false } }, modes: { eraser: false, inject: false, perfect: false, colorMask: false, twoColor: false, buildUpDither: false }, buildUpMode: "custom", buildUpSteps: [7, 15, 23, 31, 39, 47, 55, 63], _customBuildUpSteps: [7, 15, 23, 31, 39, 47, 55, 63], buildUpActiveStepSlot: null, _buildUpDensityMap: null, _buildUpResetAtIndex: 0, _strokeCtx: null, _previewStrokeCtx: null, type: "raster", cursor: "crosshair", activeCursor: "crosshair" };
function Fr() {
  var _a5;
  const e = i.currentLayer, t = i.offScreenCVS.width, o = i.offScreenCVS.height, n = new Int32Array(t * o), s = oe._buildUpResetAtIndex ?? 0;
  for (let a = s; a < r.timeline.undoStack.length; a++) {
    const l = r.timeline.undoStack[a];
    if (l.tool === "brush" && ((_a5 = l.modes) == null ? void 0 : _a5.buildUpDither) && l.layer === e && l.buildUpDensityDelta) {
      const c = e.x + r.canvas.cropOffsetX, u = e.y + r.canvas.cropOffsetY;
      for (const d of l.buildUpDensityDelta) {
        const f = (d & 65535) + c, p = (d >>> 16 & 65535) + u;
        f >= 0 && f < t && p >= 0 && p < o && (n[p * t + f] += 1);
      }
    }
  }
  oe._buildUpDensityMap = n;
}
function ch() {
  if (S.selectedCollisionPresent && r.tool.clickCounter === 0) {
    uh();
    return;
  }
  switch (i.pointerEvent) {
    case "pointerdown":
      r.tool.clickCounter += 1, r.vector.clearSelected(), r.ui.vectorTransformOpen = false, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "none"), r.selection.properties.px1 = r.cursor.x, r.selection.properties.py1 = r.cursor.y, r.selection.properties.px2 = r.cursor.x, r.selection.properties.py2 = r.cursor.y, r.selection.setBoundaryBox(r.selection.properties);
      break;
    case "pointermove":
      r.selection.properties.px2 = r.cursor.x, r.selection.properties.py2 = r.cursor.y, r.selection.setBoundaryBox(r.selection.properties);
      break;
    case "pointerup":
      r.tool.clickCounter = 0, r.selection.normalize(), r.selection.setBoundaryBox(r.selection.properties), Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { deselect: false } });
      break;
  }
}
function uh() {
  switch (i.pointerEvent) {
    case "pointerdown":
      S.selectedPoint = { xKey: S.collidedPoint.xKey, yKey: S.collidedPoint.yKey }, r.cursor.prevX = r.cursor.x, r.cursor.prevY = r.cursor.y, gi();
      break;
    case "pointermove":
      S.selectedPoint.xKey && gi();
      break;
    case "pointerup":
      r.selection.normalize(), r.selection.setBoundaryBox(r.selection.properties), Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { deselect: false } }), S.selectedPoint = { xKey: null, yKey: null };
      break;
  }
}
function gi() {
  switch (S.selectedPoint.xKey) {
    case "px1":
      r.selection.properties.px1 = r.cursor.x, r.selection.properties.py1 = r.cursor.y;
      break;
    case "px2":
      r.selection.properties.py1 = r.cursor.y;
      break;
    case "px3":
      r.selection.properties.px2 = r.cursor.x, r.selection.properties.py1 = r.cursor.y;
      break;
    case "px4":
      r.selection.properties.px2 = r.cursor.x;
      break;
    case "px5":
      r.selection.properties.px2 = r.cursor.x, r.selection.properties.py2 = r.cursor.y;
      break;
    case "px6":
      r.selection.properties.py2 = r.cursor.y;
      break;
    case "px7":
      r.selection.properties.px1 = r.cursor.x, r.selection.properties.py2 = r.cursor.y;
      break;
    case "px8":
      r.selection.properties.px1 = r.cursor.x;
      break;
    case "px9": {
      const e = r.cursor.x - r.cursor.prevX, t = r.cursor.y - r.cursor.prevY;
      r.selection.properties.px1 += e, r.selection.properties.py1 += t, r.selection.properties.px2 += e, r.selection.properties.py2 += t;
      break;
    }
  }
  r.selection.setBoundaryBox(r.selection.properties);
}
const dh = { name: "select", fn: ch, brushSize: 1, brushType: "circle", brushDisabled: true, options: {}, modes: {}, type: "utility", cursor: "default", activeCursor: "default" }, ue = { ArrowLeft: false, ArrowRight: false, MetaLeft: false, MetaRight: false, Space: false, AltLeft: false, AltRight: false, ShiftLeft: false, ShiftRight: false, KeyA: false, KeyB: false, KeyC: false, KeyD: false, KeyE: false, KeyF: false, KeyG: false, KeyH: false, KeyI: false, KeyJ: false, KeyK: false, KeyL: false, KeyM: false, KeyN: false, KeyO: false, KeyP: false, KeyQ: false, KeyR: false, KeyS: false, KeyT: false, KeyU: false, KeyV: false, KeyW: false, KeyX: false, KeyY: false, KeyZ: false };
function fh(e, t, o = null) {
  const n = i.currentLayer.ctx.getImageData(0, 0, i.offScreenCVS.width, i.offScreenCVS.height), { data: s, width: a, height: l } = n, c = (t * a + e) * 4, u = s[c], d = s[c + 1], f = s[c + 2], p = s[c + 3], h = o !== null && o.has(t << 16 | e), y = /* @__PURE__ */ new Set(), v = [t * a + e], g = new Uint8Array(a * l);
  for (g[t * a + e] = 1; v.length > 0; ) {
    const x = v.pop(), b = x % a, O = x / a | 0, M = x * 4;
    if (p === 0) {
      if (s[M + 3] !== 0) continue;
    } else if (s[M] !== u || s[M + 1] !== d || s[M + 2] !== f || s[M + 3] !== p) continue;
    if (o !== null && o.has(O << 16 | b) !== h) continue;
    y.add(O << 16 | b);
    const w = [b > 0 ? x - 1 : -1, b < a - 1 ? x + 1 : -1, O > 0 ? x - a : -1, O < l - 1 ? x + a : -1];
    for (const C of w) C !== -1 && !g[C] && (g[C] = 1, v.push(C));
  }
  return y;
}
function ph(e) {
  let t = 1 / 0, o = 1 / 0, n = -1 / 0, s = -1 / 0;
  for (const a of e) {
    const l = a & 65535, c = a >> 16 & 65535;
    l < t && (t = l), l > n && (n = l), c < o && (o = c), c > s && (s = c);
  }
  return { xMin: t, yMin: o, xMax: n + 1, yMax: s + 1 };
}
function hh() {
  switch (i.pointerEvent) {
    case "pointerdown": {
      const e = r.cursor.x, t = r.cursor.y, o = i.offScreenCVS.width, n = i.offScreenCVS.height;
      if (e < 0 || e >= o || t < 0 || t >= n) return;
      const s = ue.ShiftLeft || ue.ShiftRight, a = ue.AltLeft || ue.AltRight, l = (s || a) && r.selection.maskSet ? r.selection.maskSet : null, c = fh(e, t, l);
      let u = false;
      if (s && r.selection.maskSet) {
        const d = new Set(r.selection.maskSet);
        for (const f of c) d.has(f) || (u = true, d.add(f));
        u && (r.selection.maskSet = d);
      } else if (a && r.selection.maskSet) {
        const d = new Set(r.selection.maskSet);
        for (const f of c) d.has(f) && (u = true, d.delete(f));
        u && (r.selection.maskSet = d.size > 0 ? d : null);
      } else {
        const d = r.selection.maskSet;
        if (c.size === 0) u = d !== null && d.size > 0;
        else if (d === null || d.size !== c.size) u = true;
        else for (const f of c) if (!d.has(f)) {
          u = true;
          break;
        }
        r.selection.maskSet = c.size > 0 ? c : null;
      }
      if (r.selection.maskSet) {
        const d = ph(r.selection.maskSet);
        r.selection.properties.px1 = d.xMin, r.selection.properties.py1 = d.yMin, r.selection.properties.px2 = d.xMax, r.selection.properties.py2 = d.yMax, r.selection.setBoundaryBox(r.selection.properties);
      } else r.selection.resetProperties(), r.selection.setBoundaryBox(r.selection.properties);
      if (!u) break;
      Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { deselect: false } }), U(i.currentLayer);
      break;
    }
  }
}
const vh = { name: "magicWand", fn: hh, brushSize: 1, brushType: "circle", brushDisabled: true, options: {}, modes: {}, type: "utility", cursor: "default", activeCursor: "default" };
function Eo(e) {
  let t = [];
  for (let o in r.vector.savedProperties) {
    let n = { ...r.vector.savedProperties[o] }, s = r.vector.all[o], a = { ...s.vectorProperties };
    t.push({ moddedActionIndex: s.action.index, moddedVectorIndex: o, from: n, to: a });
  }
  r.vector.savedProperties = {}, r.timeline.clearActiveIndexes(), r.timeline.clearSavedBetweenActionImages(), Se({ tool: ie.modify.name, layer: e.layer, properties: { moddedActionIndex: e.action.index, moddedVectorIndex: e.index, processedActions: t } });
}
function yh(e, t, o) {
  Se({ tool: ie.changeDitherPattern.name, layer: e.layer, properties: { moddedActionIndex: e.action.index, moddedVectorIndex: e.index, from: t, to: o } });
}
function mh(e, t, o) {
  Se({ tool: ie.changeDitherOffset.name, layer: e.layer, properties: { moddedActionIndex: e.action.index, moddedVectorIndex: e.index, from: t, to: o } });
}
function gh(e, t, o) {
  Se({ tool: ie.changeBrushSize.name, layer: e.layer, properties: { moddedActionIndex: e.action.index, moddedVectorIndex: e.index, from: t, to: o } });
}
function bh(e, t) {
  let o = { ...t }, n = { ...e.color };
  Se({ tool: ie.changeColor.name, layer: e.layer, properties: { moddedActionIndex: e.action.index, moddedVectorIndex: e.index, from: o, to: n } });
}
function xh(e) {
  Se({ tool: ie.remove.name, layer: e.layer, properties: { vectorIndices: [e.index], from: false, to: true } });
}
function ul(e, t, o, n = null, s = null) {
  Se({ tool: ie.changeMode.name, layer: e.layer, properties: { moddedActionIndex: e.actionIndex, moddedVectorIndex: e.index, from: t, to: o, fromVectorProperties: n, toVectorProperties: s } });
}
function Sh(e, t) {
  const o = { ...e.modes }, n = { px3: e.vectorProperties.px3, py3: e.vectorProperties.py3, px4: e.vectorProperties.px4, py4: e.vectorProperties.py4 };
  No.forEach((l) => {
    e.modes[l] = l === t;
  });
  const s = e.vectorProperties;
  (t === "quadCurve" || t === "cubicCurve") && (s.px3 == null || s.py3 == null) && (s.px3 = Math.round((s.px1 + s.px2) / 2), s.py3 = Math.round((s.py1 + s.py2) / 2)), t === "cubicCurve" && (s.px4 == null || s.py4 == null) && (s.px4 = Math.round((s.px1 + s.px2) / 2), s.py4 = Math.round((s.py1 + s.py2) / 2));
  const a = { px3: e.vectorProperties.px3, py3: e.vectorProperties.py3, px4: e.vectorProperties.px4, py4: e.vectorProperties.py4 };
  if (r.vector.currentIndex === e.index) {
    const l = e.layer.x, c = e.layer.y;
    e.vectorProperties.px3 !== void 0 && (r.vector.properties.px3 = e.vectorProperties.px3 + l, r.vector.properties.py3 = e.vectorProperties.py3 + c), e.vectorProperties.px4 !== void 0 && (r.vector.properties.px4 = e.vectorProperties.px4 + l, r.vector.properties.py4 = e.vectorProperties.py4 + c);
  }
  U(e.layer, true), ul(e, o, { ...e.modes }, n, a), r.clearRedoStack(), S.render();
}
function Ch(e) {
  let t = r.timeline.undoStack.length - 1, o = 0;
  r.timeline.undoStack.forEach((n) => {
    o > t || (o++, n.layer === e && (n.removed = true, n.vectorIndices && n.vectorIndices.forEach((s) => {
      r.vector.all[s].removed = true;
    })));
  }), Se({ tool: ie.clear.name, layer: e, properties: { upToIndex: t } });
}
function wh(e) {
  let [t, o, n, s] = [null, null, null, null];
  const a = new Set(r.vector.selectedIndices);
  a.size === 0 && a.add(r.vector.currentIndex);
  for (const d of a) {
    const f = r.vector.all[d], p = [], h = [];
    for (let y = 1; y <= 4; y++) f.vectorProperties[`px${y}`] != null && f.vectorProperties[`py${y}`] != null && (p.push(f.vectorProperties[`px${y}`]), h.push(f.vectorProperties[`py${y}`]));
    t = Math.min(t ?? 1 / 0, ...p), o = Math.max(o ?? -1 / 0, ...p), n = Math.min(n ?? 1 / 0, ...h), s = Math.max(s ?? -1 / 0, ...h);
  }
  const l = (t + o) / 2, c = (n + s) / 2;
  let u;
  for (const d of a) {
    const f = r.vector.all[d];
    u = f, r.vector.savedProperties[d] = { ...f.vectorProperties, modes: { ...f.modes } };
    for (let p = 1; p <= 4; p++) if (f.vectorProperties[`px${p}`] != null && f.vectorProperties[`py${p}`] != null) {
      const h = `px${p}`, y = `py${p}`;
      let v = f.vectorProperties[h], g = f.vectorProperties[y];
      e ? v = Math.round(2 * l) - f.vectorProperties[h] : g = Math.round(2 * c) - f.vectorProperties[y], He(f, v, g, h, y);
    }
    "px0" in f.vectorProperties && (f.vectorProperties.px0 = Math.round((f.vectorProperties.px1 + f.vectorProperties.px3) / 2), f.vectorProperties.py0 = Math.round((f.vectorProperties.py1 + f.vectorProperties.py3) / 2)), d === r.vector.currentIndex && S.setVectorProperties(f);
  }
  U(i.currentLayer, true), Eo(u), r.clearRedoStack(), S.render();
}
function Mh(e) {
  const t = new Set(r.vector.selectedIndices);
  if (t.size === 0 && t.add(r.vector.currentIndex), r.vector.shapeCenterX === null) {
    const [a, l] = ks(t, r.vector.all);
    r.vector.shapeCenterX = a + i.currentLayer.x, r.vector.shapeCenterY = l + i.currentLayer.y;
  }
  const o = r.vector.shapeCenterX, n = r.vector.shapeCenterY;
  let s;
  for (const a of t) {
    const l = r.vector.all[a];
    s = l, r.vector.savedProperties[a] = { ...l.vectorProperties, modes: { ...l.modes } };
    for (let c = 1; c <= 4; c++) if (l.vectorProperties[`px${c}`] != null && l.vectorProperties[`py${c}`] != null) {
      const u = `px${c}`, d = `py${c}`;
      let f = l.vectorProperties[u], p = l.vectorProperties[d];
      const h = e * Math.PI / 180, y = Math.cos(h), v = Math.sin(h);
      f = Math.floor(y * (l.vectorProperties[u] - o) - v * (l.vectorProperties[d] - n) + o), p = Math.floor(v * (l.vectorProperties[u] - o) + y * (l.vectorProperties[d] - n) + n), He(l, f, p, u, d);
    }
    "px0" in l.vectorProperties && (l.vectorProperties.px0 = Math.round((l.vectorProperties.px1 + l.vectorProperties.px3) / 2), l.vectorProperties.py0 = Math.round((l.vectorProperties.py1 + l.vectorProperties.py3) / 2)), a === r.vector.currentIndex && S.setVectorProperties(l);
  }
  U(i.currentLayer, true), Eo(s), r.clearRedoStack(), S.render();
}
function zs() {
  const e = { ...r.selection.boundaryBox }, t = document.createElement("canvas");
  t.width = e.xMax - e.xMin, t.height = e.yMax - e.yMin, t.getContext("2d").putImageData(i.currentLayer.ctx.getImageData(e.xMin, e.yMin, e.xMax - e.xMin, e.yMax - e.yMin), 0, 0), e.xMax !== null && (e.xMin -= i.currentLayer.x, e.xMax -= i.currentLayer.x, e.yMin -= i.currentLayer.y, e.yMax -= i.currentLayer.y);
  const n = { ...r.selection.properties };
  r.selection.properties.px2 !== null && (n.px1 -= i.currentLayer.x, n.px2 -= i.currentLayer.x, n.py1 -= i.currentLayer.y, n.py2 -= i.currentLayer.y), Se({ tool: ie.transform.name, layer: i.currentLayer, properties: { boundaryBox: e, selectProperties: n, pastedImageKey: r.clipboard.currentPastedImageKey, transformationRotationDegrees: r.transform.rotationDegrees, isMirroredHorizontally: r.transform.isMirroredHorizontally, isMirroredVertically: r.transform.isMirroredVertically } }), r.clearRedoStack();
}
function cn(e) {
  if (i.currentLayer.isPreview) {
    const t = { ...r.selection.boundaryBox };
    e ? (t.xMin = r.selection.boundaryBox.xMax, t.xMax = r.selection.boundaryBox.xMin, r.transform.isMirroredHorizontally = !r.transform.isMirroredHorizontally) : (t.yMin = r.selection.boundaryBox.yMax, t.yMax = r.selection.boundaryBox.yMin, r.transform.isMirroredVertically = !r.transform.isMirroredVertically), jr(i.currentLayer, r.clipboard.pastedImages[r.clipboard.currentPastedImageKey].imageData, t, r.transform.rotationDegrees % 360, r.transform.isMirroredHorizontally, r.transform.isMirroredVertically), zs(), U(i.currentLayer);
  } else (r.vector.currentIndex !== null || r.vector.selectedIndices.size > 0) && wh(e);
}
function dl() {
  if (i.currentLayer.isPreview) {
    const e = (t) => {
      const { xMin: o, xMax: n, yMin: s, yMax: a } = t, l = Math.floor((o + n) / 2), c = Math.floor((s + a) / 2), u = n - o, d = a - s, f = l - Math.floor(d / 2), p = l + Math.ceil(d / 2), h = c - Math.floor(u / 2), y = c + Math.ceil(u / 2);
      return { px1: f, px2: p, py1: h, py2: y };
    };
    r.selection.properties = e(r.selection.boundaryBox), r.selection.setBoundaryBox(r.selection.properties), r.transform.rotationDegrees += 90, r.transform.isMirroredHorizontally && (r.transform.rotationDegrees += 180), r.transform.isMirroredVertically && (r.transform.rotationDegrees += 180), jr(i.currentLayer, r.clipboard.pastedImages[r.clipboard.currentPastedImageKey].imageData, r.selection.boundaryBox, r.transform.rotationDegrees % 360, r.transform.isMirroredHorizontally, r.transform.isMirroredVertically), zs(), S.render(), U(i.currentLayer);
  } else (r.vector.currentIndex !== null || r.vector.selectedIndices.size > 0) && Mh(90);
}
function _n(e, t = false) {
  for (const [o, n] of Object.entries(S.linkedVectors)) {
    const { currentDeltaX: s, currentDeltaY: a, currentDeltaAngle: l } = mf(e, S.selectedPoint, r.tool.current.options, r.vector.savedProperties, n.linkingPoint);
    let c = r.cursor.x - r.canvas.cropOffsetX, u = r.cursor.y - r.canvas.cropOffsetY;
    const d = r.vector.all[o];
    if (t) r.vector.savedProperties[o] = { ...d.vectorProperties, modes: { ...d.modes } };
    else if (!r.vector.savedProperties[o]) continue;
    const f = r.vector.savedProperties[o];
    gf(c, u, s, a, l, S.selectedPoint.xKey, d, n, f, r.tool.current.options);
  }
}
function kh(e, t, o, n, s, a) {
  const l = `px${s}`, c = `py${s}`, u = `px${a}`, d = `py${a}`, f = n[l] - n[u], p = n[c] - n[d];
  r.vector.properties[u] = t - f, r.vector.properties[d] = o - p, He(e, t - f, o - p, u, d);
}
function Fo(e, t, o) {
  const n = r.vector.savedProperties[r.vector.currentIndex];
  let s, a;
  if (n.modes.cubicCurve) switch (s = parseInt(S.selectedPoint.xKey[2]), s) {
    case 1:
      a = 3;
      break;
    case 2:
      a = 4;
      break;
    default:
      a = s;
  }
  else n.modes.quadCurve ? (s = parseInt(S.selectedPoint.xKey[2]), a = 3) : (s = parseInt(S.selectedPoint.xKey[2]), a = s === 1 ? 2 : 1);
  kh(e, t, o, n, s, a);
}
let fo = [];
function Ph() {
  const e = ["px1", "px2"];
  if (S.selectedCollisionPresent && r.vector.currentIndex !== null && e.includes(S.collidedPoint.xKey)) {
    const t = r.vector.all[r.vector.currentIndex];
    if (t && t.vectorProperties.tool === "curve") return { x: t.vectorProperties[S.collidedPoint.xKey] + t.layer.x, y: t.vectorProperties[S.collidedPoint.yKey] + t.layer.y };
  }
  if (r.vector.collidedIndex !== null && e.includes(S.otherCollidedKeys.xKey)) {
    const t = r.vector.all[r.vector.collidedIndex];
    if (t && t.vectorProperties.tool === "curve") return { x: t.vectorProperties[S.otherCollidedKeys.xKey] + t.layer.x, y: t.vectorProperties[S.otherCollidedKeys.yKey] + t.layer.y };
  }
  return null;
}
function _h(e) {
  var _a5, _b2, _c5, _d3, _e5, _f4, _g;
  let t = r.vector.all[r.vector.collidedIndex];
  if (["fill", "ellipse"].includes(t.vectorProperties.tool) || ["fill", "ellipse"].includes(e.vectorProperties.tool)) return;
  let o = t.vectorProperties[S.otherCollidedKeys.xKey] + t.layer.x, n = t.vectorProperties[S.otherCollidedKeys.yKey] + t.layer.y;
  if (r.vector.properties[S.selectedPoint.xKey] = o, r.vector.properties[S.selectedPoint.yKey] = n, He(e, o, n, S.selectedPoint.xKey, S.selectedPoint.yKey), ((_a5 = r.tool.current.options.hold) == null ? void 0 : _a5.active) && Fo(e, o, n), !(((_b2 = r.tool.current.options.align) == null ? void 0 : _b2.active) || ((_c5 = r.tool.current.options.equal) == null ? void 0 : _c5.active)) || !["px1", "px2"].includes(S.selectedPoint.xKey)) return;
  if (r.tool.current.modes.line) {
    if (t.modes.line || t.vectorProperties.tool !== "curve") return;
    const M = S.selectedPoint.xKey === "px1" ? "px2" : "px1", w = S.selectedPoint.yKey === "py1" ? "py2" : "py1", C = r.vector.properties[M], k = r.vector.properties[w], _ = C - o, L = k - n, E = Math.sqrt(_ ** 2 + L ** 2);
    if (E === 0) return;
    const I = S.otherCollidedKeys.xKey, P = S.otherCollidedKeys.yKey, A = I === "px1" || t.modes.quadCurve ? "px3" : "px4", G = I === "px1" || t.modes.quadCurve ? "py3" : "py4";
    r.vector.savedProperties[t.index] = { ...t.vectorProperties, modes: { ...t.modes } };
    const K = t.vectorProperties[A] - t.vectorProperties[I], D = t.vectorProperties[G] - t.vectorProperties[P], $ = ((_d3 = r.tool.current.options.equal) == null ? void 0 : _d3.active) ? E : Math.sqrt(K ** 2 + D ** 2), H = ((_e5 = r.tool.current.options.align) == null ? void 0 : _e5.active) ? Pe(_, L) + Math.PI : Pe(K, D);
    He(t, o + Math.round(Math.cos(H) * $), n + Math.round(Math.sin(H) * $), A, G);
    return;
  }
  let s, a, l, c;
  S.selectedPoint.xKey === "px1" ? (s = "px1", a = "py1", l = "px3", c = "py3") : (s = "px2", a = "py2", e.modes.quadCurve ? (l = "px3", c = "py3") : (l = "px4", c = "py4"));
  const u = r.vector.savedProperties[e.index], d = u[s] - u[l], f = u[a] - u[c], p = r.vector.properties[l] - r.vector.properties[s], h = r.vector.properties[c] - r.vector.properties[a];
  let y, v;
  S.otherCollidedKeys.xKey === "px1" ? (y = t.vectorProperties.px3 - t.vectorProperties.px1, v = t.vectorProperties.py3 - t.vectorProperties.py1) : S.otherCollidedKeys.xKey === "px2" && (t.modes.quadCurve ? (y = t.vectorProperties.px3 - t.vectorProperties.px2, v = t.vectorProperties.py3 - t.vectorProperties.py2) : (y = t.vectorProperties.px4 - t.vectorProperties.px2, v = t.vectorProperties.py4 - t.vectorProperties.py2));
  const g = ((_f4 = r.tool.current.options.equal) == null ? void 0 : _f4.active) ? Math.sqrt(y ** 2 + v ** 2) : Math.sqrt(d ** 2 + f ** 2), x = ((_g = r.tool.current.options.align) == null ? void 0 : _g.active) ? Pe(y, v) + Math.PI : Pe(p, h), b = -Math.round(Math.cos(x) * g), O = -Math.round(Math.sin(x) * g);
  r.vector.properties[l] = r.vector.properties[s] - b, r.vector.properties[c] = r.vector.properties[a] - O, He(e, r.vector.properties[l], r.vector.properties[c], l, c);
}
function Oh(e) {
  var _a5, _b2;
  if (fo = [], !((_a5 = r.tool.current.options.align) == null ? void 0 : _a5.active) && !((_b2 = r.tool.current.options.equal) == null ? void 0 : _b2.active)) return;
  const t = S.selectedPoint.xKey;
  if (!["px1", "px2"].includes(t)) return;
  const o = t === "px1" ? "px2" : "px1", n = t === "px1" ? "py2" : "py1", s = e.vectorProperties[o] + e.layer.x, a = e.vectorProperties[n] + e.layer.y;
  for (const [l, c] of Object.entries(S.linkedVectors)) {
    const u = r.vector.all[l];
    if (!u || u.modes.line || u.vectorProperties.tool !== "curve") continue;
    let d, f, p;
    if (c.px1) d = "px1", f = "px3", p = "py3";
    else if (c.px2) d = "px2", f = u.modes.quadCurve ? "px3" : "px4", p = u.modes.quadCurve ? "py3" : "py4";
    else continue;
    fo.push({ vector: u, lineJunctionXKey: t, curveEndpointXKey: d, curveHandleXKey: f, curveHandleYKey: p }), r.vector.savedProperties[u.index] || (r.vector.savedProperties[u.index] = { ...u.vectorProperties, modes: { ...u.modes } });
  }
  for (const l of Object.values(r.vector.all)) if (!(l.index === e.index || l.removed || l.modes.line || l.vectorProperties.tool !== "curve")) for (const [c, u] of [["px1", "py1"], ["px2", "py2"]]) {
    const d = l.vectorProperties[c] + l.layer.x, f = l.vectorProperties[u] + l.layer.y;
    if (d === s && f === a) {
      const p = c === "px1" || l.modes.quadCurve ? "px3" : "px4", h = c === "px1" || l.modes.quadCurve ? "py3" : "py4";
      fo.push({ vector: l, lineJunctionXKey: o, curveEndpointXKey: c, curveHandleXKey: p, curveHandleYKey: h }), r.vector.savedProperties[l.index] || (r.vector.savedProperties[l.index] = { ...l.vectorProperties, modes: { ...l.modes } });
      break;
    }
  }
}
function On(e) {
  var _a5, _b2, _c5;
  if (!fo.length) return;
  const t = e.vectorProperties.px1 + e.layer.x, o = e.vectorProperties.py1 + e.layer.y, n = e.vectorProperties.px2 + e.layer.x, s = e.vectorProperties.py2 + e.layer.y, a = n - t, l = s - o, c = Math.sqrt(a ** 2 + l ** 2);
  if (c === 0) return;
  const u = S.selectedPoint.xKey;
  for (const { vector: d, lineJunctionXKey: f, curveEndpointXKey: p, curveHandleXKey: h, curveHandleYKey: y } of fo) {
    const v = r.vector.savedProperties[d.index];
    if (!v || ((_a5 = r.tool.current.options.hold) == null ? void 0 : _a5.active) && u !== f) continue;
    const g = f === "px1" ? t : n, x = f === "px1" ? o : s, b = f === "px1" ? a : -a, O = f === "px1" ? l : -l, M = ((_b2 = r.tool.current.options.equal) == null ? void 0 : _b2.active) && u !== f, w = p.replace("px", "py"), C = v[h] - v[p], k = v[y] - v[w], _ = M ? c : Math.sqrt(C ** 2 + k ** 2), L = ((_c5 = r.tool.current.options.align) == null ? void 0 : _c5.active) ? Pe(b, O) + Math.PI : Pe(C, k);
    He(d, g + Math.round(Math.cos(L) * _), x + Math.round(Math.sin(L) * _), h, y);
  }
}
function Ys(e, t) {
  var _a5, _b2;
  const o = Object.keys(t).map((a) => r.vector.all[a].action.index);
  let n = Math.min(...o), s = [];
  for (let a = n; a < r.timeline.undoStack.length; a++) {
    let l = r.timeline.undoStack[a];
    l.layer === e.layer && (l.tool === "fill" || l.tool === "cut" || ((_a5 = l == null ? void 0 : l.modes) == null ? void 0 : _a5.eraser) || ((_b2 = l == null ? void 0 : l.modes) == null ? void 0 : _b2.inject) || o.includes(a)) && s.push(a);
  }
  return s;
}
function Lh() {
  let e = r.vector.all[r.vector.selectedIndices.values().next().value];
  switch (i.pointerEvent) {
    case "pointerdown": {
      r.tool.clickCounter += 1, r.tool.grabStartX = r.cursor.x, r.tool.grabStartY = r.cursor.y, r.vector.grabStartShapeCenterX = r.vector.shapeCenterX, r.vector.grabStartShapeCenterY = r.vector.shapeCenterY, S.reset(), r.vector.savedProperties = {}, r.vector.selectedIndices.forEach((t) => {
        const o = r.vector.all[t], n = o.vectorProperties;
        r.vector.savedProperties[t] = { ...n, modes: { ...o.modes } };
      }), r.timeline.activeIndexes = Ys(e, r.vector.savedProperties), r.vector.transformMode === Kr && (r.vector.grabStartAngle = Pe(r.vector.shapeCenterX - (r.tool.grabStartX - r.canvas.cropOffsetX), r.vector.shapeCenterY - (r.tool.grabStartY - r.canvas.cropOffsetY))), U(e.layer, true, r.timeline.activeIndexes, true);
      break;
    }
    case "pointermove": {
      if (r.vector.transformMode === Kr) si(e.layer, r.vector.savedProperties, r.vector.all, r.cursor.x - r.canvas.cropOffsetX, r.cursor.y - r.canvas.cropOffsetY, r.tool.grabStartX - r.canvas.cropOffsetX, r.tool.grabStartY - r.canvas.cropOffsetY, r.vector.shapeCenterX, r.vector.shapeCenterY);
      else if (r.vector.transformMode === mo) {
        const t = r.cursor.x - r.tool.grabStartX, o = r.cursor.y - r.tool.grabStartY;
        ni(e.layer, r.vector.savedProperties, r.vector.all, t, o), r.vector.shapeCenterX = r.vector.grabStartShapeCenterX + t, r.vector.shapeCenterY = r.vector.grabStartShapeCenterY + o;
      }
      U(e.layer, true, r.timeline.activeIndexes);
      break;
    }
    case "pointerup": {
      if (r.vector.transformMode === Kr) si(e.layer, r.vector.savedProperties, r.vector.all, r.cursor.x - r.canvas.cropOffsetX, r.cursor.y - r.canvas.cropOffsetY, r.tool.grabStartX - r.canvas.cropOffsetX, r.tool.grabStartY - r.canvas.cropOffsetY, r.vector.shapeCenterX, r.vector.shapeCenterY), S.mother.currentRotation = S.mother.newRotation, r.vector.grabStartAngle = null;
      else if (r.vector.transformMode === mo) {
        const t = r.cursor.x - r.tool.grabStartX, o = r.cursor.y - r.tool.grabStartY;
        ni(e.layer, r.vector.savedProperties, r.vector.all, t, o), r.vector.shapeCenterX = r.vector.grabStartShapeCenterX + t, r.vector.shapeCenterY = r.vector.grabStartShapeCenterY + o;
      }
      r.vector.grabStartShapeCenterX = null, r.vector.grabStartShapeCenterY = null, r.tool.clickCounter = 0, U(e.layer, true, r.timeline.activeIndexes), Eo(e), S.selectedPoint = { xKey: null, yKey: null };
      break;
    }
  }
}
function Th() {
  let e = r.vector.all[r.vector.selectedIndices.values().next().value];
  switch (i.pointerEvent) {
    case "pointerdown":
      S.selectedPoint = { xKey: S.collidedPoint.xKey, yKey: S.collidedPoint.yKey }, r.selection.previousBoundaryBox = { ...r.selection.boundaryBox }, S.reset(), r.vector.savedProperties = {}, r.vector.selectedIndices.forEach((t) => {
        const o = r.vector.all[t], n = o.vectorProperties;
        r.vector.savedProperties[t] = { ...n, modes: { ...o.modes } };
      }), r.timeline.activeIndexes = Ys(e, r.vector.savedProperties), U(e.layer, true, r.timeline.activeIndexes, true);
      break;
    case "pointermove": {
      fl();
      let t = false, o = false;
      S.selectedPoint.xKey !== "px9" && ((r.selection.boundaryBox.xMax === r.selection.previousBoundaryBox.xMin || r.selection.boundaryBox.xMin === r.selection.previousBoundaryBox.xMax) && (t = !t), (r.selection.boundaryBox.yMax === r.selection.previousBoundaryBox.yMin || r.selection.boundaryBox.yMin === r.selection.previousBoundaryBox.yMax) && (o = !o));
      const n = r.canvas.cropOffsetX, s = r.canvas.cropOffsetY, a = { xMin: r.selection.previousBoundaryBox.xMin - n, yMin: r.selection.previousBoundaryBox.yMin - s, xMax: r.selection.previousBoundaryBox.xMax - n, yMax: r.selection.previousBoundaryBox.yMax - s }, l = { xMin: r.selection.boundaryBox.xMin - n, yMin: r.selection.boundaryBox.yMin - s, xMax: r.selection.boundaryBox.xMax - n, yMax: r.selection.boundaryBox.yMax - s };
      Of(r.vector.all, r.vector.savedProperties, a, l, t, o), U(e.layer, true, r.timeline.activeIndexes);
      break;
    }
    case "pointerup":
      r.selection.normalize(), r.selection.setBoundaryBox(r.selection.properties), U(e.layer, true, r.timeline.activeIndexes), Eo(e), S.selectedPoint = { xKey: null, yKey: null };
      break;
  }
}
function Ih() {
  switch (i.pointerEvent) {
    case "pointerdown":
      S.selectedPoint = { xKey: S.collidedPoint.xKey, yKey: S.collidedPoint.yKey }, r.vector.shapeCenterX = r.cursor.x - r.canvas.cropOffsetX, r.vector.shapeCenterY = r.cursor.y - r.canvas.cropOffsetY;
      break;
    case "pointermove":
      r.vector.shapeCenterX = r.cursor.x - r.canvas.cropOffsetX, r.vector.shapeCenterY = r.cursor.y - r.canvas.cropOffsetY;
      break;
    case "pointerup":
      r.vector.shapeCenterX = r.cursor.x - r.canvas.cropOffsetX, r.vector.shapeCenterY = r.cursor.y - r.canvas.cropOffsetY, S.selectedPoint = { xKey: null, yKey: null };
      break;
  }
}
function fl() {
  switch (S.selectedPoint.xKey) {
    case "px1":
      r.selection.properties.px1 = r.cursor.x, r.selection.properties.py1 = r.cursor.y;
      break;
    case "px2":
      r.selection.properties.py1 = r.cursor.y;
      break;
    case "px3":
      r.selection.properties.px2 = r.cursor.x, r.selection.properties.py1 = r.cursor.y;
      break;
    case "px4":
      r.selection.properties.px2 = r.cursor.x;
      break;
    case "px5":
      r.selection.properties.px2 = r.cursor.x, r.selection.properties.py2 = r.cursor.y;
      break;
    case "px6":
      r.selection.properties.py2 = r.cursor.y;
      break;
    case "px7":
      r.selection.properties.px1 = r.cursor.x, r.selection.properties.py2 = r.cursor.y;
      break;
    case "px8":
      r.selection.properties.px1 = r.cursor.x;
      break;
    case "px9": {
      const e = r.cursor.x - r.cursor.prevX, t = r.cursor.y - r.cursor.prevY;
      r.selection.properties.px1 += e, r.selection.properties.py1 += t, r.selection.properties.px2 += e, r.selection.properties.py2 += t;
      break;
    }
  }
  r.selection.setBoundaryBox(r.selection.properties);
}
function Xh() {
  switch (i.pointerEvent) {
    case "pointerdown":
      r.tool.grabStartX = i.currentLayer.x, r.tool.grabStartY = i.currentLayer.y, r.tool.startScale = i.currentLayer.scale, S.render(), S.selectedCollisionPresent && Ln();
      break;
    case "pointermove":
      if (S.selectedPoint.xKey) Ln();
      else {
        const e = r.cursor.x - r.cursor.prevX, t = r.cursor.y - r.cursor.prevY;
        if (i.currentLayer.x += e, i.currentLayer.y += t, r.selection.properties.px2 !== null && (r.selection.properties.px1 += e, r.selection.properties.px2 += e, r.selection.properties.py1 += t, r.selection.properties.py2 += t, r.selection.setBoundaryBox(r.selection.properties)), r.selection.maskSet && (e !== 0 || t !== 0)) {
          const o = /* @__PURE__ */ new Set(), n = i.offScreenCVS.width, s = i.offScreenCVS.height;
          for (const a of r.selection.maskSet) {
            const l = (a & 65535) + e, c = (a >> 16 & 65535) + t;
            l >= 0 && l < n && c >= 0 && c < s && o.add(c << 16 | l);
          }
          r.selection.maskSet = o;
        }
        U(i.currentLayer, true);
      }
      break;
    case "pointerup":
      S.selectedPoint.xKey ? Ln() : (U(i.currentLayer, true), Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { from: { x: r.tool.grabStartX, y: r.tool.grabStartY, scale: r.tool.startScale }, to: { x: i.currentLayer.x, y: i.currentLayer.y, scale: i.currentLayer.scale } } }));
      break;
  }
}
function Ln() {
  switch (i.pointerEvent) {
    case "pointerdown":
      S.selectedCollisionPresent && (S.selectedPoint = { xKey: S.collidedPoint.xKey, yKey: S.collidedPoint.yKey }, i.currentLayer.type === "raster" && (r.selection.previousBoundaryBox = { ...r.selection.boundaryBox }));
      break;
    case "pointermove":
      if (S.selectedPoint.xKey) {
        if (i.currentLayer.type === "reference") Eh();
        else if (i.currentLayer.type === "raster" && i.currentLayer.isPreview) {
          fl();
          let e = r.transform.isMirroredHorizontally, t = r.transform.isMirroredVertically;
          S.selectedPoint.xKey !== "px9" && ((r.selection.boundaryBox.xMax === r.selection.previousBoundaryBox.xMin || r.selection.boundaryBox.xMin === r.selection.previousBoundaryBox.xMax) && (e = !r.transform.isMirroredHorizontally), (r.selection.boundaryBox.yMax === r.selection.previousBoundaryBox.yMin || r.selection.boundaryBox.yMin === r.selection.previousBoundaryBox.yMax) && (t = !r.transform.isMirroredVertically)), jr(i.currentLayer, r.clipboard.pastedImages[r.clipboard.currentPastedImageKey].imageData, r.selection.boundaryBox, r.transform.rotationDegrees % 360, e, t);
        }
        U(i.currentLayer);
      }
      break;
    case "pointerup":
      S.selectedPoint.xKey && (i.currentLayer.type === "reference" ? Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { from: { x: r.tool.grabStartX, y: r.tool.grabStartY, scale: r.tool.startScale }, to: { x: i.currentLayer.x, y: i.currentLayer.y, scale: i.currentLayer.scale } } }) : i.currentLayer.type === "raster" && i.currentLayer.isPreview && ((r.selection.boundaryBox.xMax === r.selection.previousBoundaryBox.xMin || r.selection.boundaryBox.xMin === r.selection.previousBoundaryBox.xMax) && (r.transform.isMirroredHorizontally = !r.transform.isMirroredHorizontally), (r.selection.boundaryBox.yMax === r.selection.previousBoundaryBox.yMin || r.selection.boundaryBox.yMin === r.selection.previousBoundaryBox.yMax) && (r.transform.isMirroredVertically = !r.transform.isMirroredVertically), r.selection.normalize(), r.selection.setBoundaryBox(r.selection.properties), zs()), U(i.currentLayer), S.selectedPoint = { xKey: null, yKey: null });
      break;
  }
}
function Eh() {
  switch (S.selectedPoint.xKey) {
    case "px1": {
      let t = (r.tool.grabStartX + i.currentLayer.img.width * r.tool.startScale - r.cursor.x) / i.currentLayer.img.width, o = i.currentLayer.img.height * r.tool.startScale - i.currentLayer.img.height * t;
      i.currentLayer.scale = t, i.currentLayer.x = r.cursor.x, i.currentLayer.y = r.tool.grabStartY + o;
      break;
    }
    case "px2": {
      let t = (r.tool.grabStartY + i.currentLayer.img.height * r.tool.startScale - r.cursor.y) / i.currentLayer.img.height, o = i.currentLayer.img.width * r.tool.startScale - i.currentLayer.img.width * t;
      i.currentLayer.scale = t, i.currentLayer.x = r.tool.grabStartX + o / 2, i.currentLayer.y = r.cursor.y;
      break;
    }
    case "px3": {
      let t = (r.cursor.x - r.tool.grabStartX) / i.currentLayer.img.width, o = i.currentLayer.img.height * r.tool.startScale - i.currentLayer.img.height * t;
      i.currentLayer.scale = t, i.currentLayer.y = r.tool.grabStartY + o;
      break;
    }
    case "px4": {
      let t = (r.cursor.x - r.tool.grabStartX) / i.currentLayer.img.width, o = i.currentLayer.img.height * r.tool.startScale - i.currentLayer.img.height * t;
      i.currentLayer.scale = t, i.currentLayer.y = r.tool.grabStartY + o / 2;
      break;
    }
    case "px5": {
      let e = r.cursor.x - r.tool.grabStartX, t = r.cursor.y - r.tool.grabStartY;
      i.currentLayer.scale = i.offScreenCVS.width / i.currentLayer.img.width > i.offScreenCVS.height / i.currentLayer.img.height ? t / i.currentLayer.img.height : e / i.currentLayer.img.width;
      break;
    }
    case "px6": {
      let t = (r.cursor.y - r.tool.grabStartY) / i.currentLayer.img.height, o = i.currentLayer.img.width * r.tool.startScale - i.currentLayer.img.width * t;
      i.currentLayer.scale = t, i.currentLayer.x = r.tool.grabStartX + o / 2;
      break;
    }
    case "px7": {
      let e = r.tool.grabStartX + i.currentLayer.img.width * r.tool.startScale - r.cursor.x, t = r.cursor.y - r.tool.grabStartY;
      i.currentLayer.scale = i.offScreenCVS.width / i.currentLayer.img.width > i.offScreenCVS.height / i.currentLayer.img.height ? t / i.currentLayer.img.height : e / i.currentLayer.img.width, i.currentLayer.x = r.cursor.x;
      break;
    }
    case "px8": {
      let t = (r.tool.grabStartX + i.currentLayer.img.width * r.tool.startScale - r.cursor.x) / i.currentLayer.img.width, o = i.currentLayer.img.height * r.tool.startScale - i.currentLayer.img.height * t;
      i.currentLayer.scale = t, i.currentLayer.x = r.cursor.x, i.currentLayer.y = r.tool.grabStartY + o / 2;
      break;
    }
    case "px9": {
      i.currentLayer.x += r.cursor.x - r.cursor.prevX, i.currentLayer.y += r.cursor.y - r.cursor.prevY;
      break;
    }
  }
}
const Bh = { name: "move", fn: Xh, brushSize: 1, brushType: "circle", brushDisabled: true, options: {}, modes: {}, type: "utility", cursor: "move", activeCursor: "move" };
function po(e, t, o = 0) {
  var _a5;
  const n = t ?? e.forceCircle;
  e.angle = Pe(e.px2 - e.px1, e.py2 - e.py1), ((_a5 = r.tool.current.options.useSubpixels) == null ? void 0 : _a5.active) ? e.unifiedOffset = Pf(i.subPixelX, i.subPixelY, e.angle + o) : e.unifiedOffset = 0;
  const s = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  for (; e.angle < 0; ) e.angle += 2 * Math.PI;
  let a = Math.floor((e.angle + o + Math.PI / 2 + Math.PI / 8) / (Math.PI / 4)) % 8, l = s[a];
  if (n) e.x1Offset = -e.unifiedOffset, e.y1Offset = -e.unifiedOffset;
  else switch (l) {
    case "N":
      e.y1Offset = -e.unifiedOffset;
      break;
    case "NE":
      e.x1Offset = -e.unifiedOffset, e.y1Offset = -e.unifiedOffset;
      break;
    case "E":
      e.x1Offset = -e.unifiedOffset;
      break;
    case "SE":
      e.x1Offset = -e.unifiedOffset, e.y1Offset = -e.unifiedOffset;
      break;
    case "S":
      e.y1Offset = -e.unifiedOffset;
      break;
    case "SW":
      e.x1Offset = -e.unifiedOffset, e.y1Offset = -e.unifiedOffset;
      break;
    case "W":
      e.x1Offset = -e.unifiedOffset;
      break;
    case "NW":
      e.x1Offset = -e.unifiedOffset, e.y1Offset = -e.unifiedOffset;
      break;
  }
}
function zh(e, t, o, n, s) {
  t !== "px1" && (e[t] = n, e[o] = s);
  let a = e.px2 - e.px1, l = e.py2 - e.py1, c = e.px3 - e.px1, u = e.py3 - e.py1;
  if (t === "px1") e[t] = n, e[o] = s, e.px2 = e.px1 + a, e.py2 = e.py1 + l, e.px3 = e.px1 + c, e.py3 = e.py1 + u;
  else if (t === "px2") {
    e.radA = Math.sqrt(a * a + l * l), e.forceCircle && (e.radB = e.radA);
    let f = Jn(e.px1, e.py1, e.px2, e.py2, -Math.PI / 2, e.radB);
    e.px3 = f.x, e.py3 = f.y, po(e, e.forceCircle, 0);
  } else if (t === "px3") {
    e.radB = Math.sqrt(c * c + u * u), e.forceCircle && (e.radA = e.radB);
    let f = Jn(e.px1, e.py1, e.px3, e.py3, Math.PI / 2, e.radA);
    e.px2 = f.x, e.py2 = f.y, po(e, e.forceCircle, 1.5 * Math.PI);
  }
  let d = Cr(e.px1, e.py1, e.radA, e.radB, e.angle, e.x1Offset, e.y1Offset);
  e.weight = d.weight, e.leftTangentX = d.leftTangentX, e.leftTangentY = d.leftTangentY, e.topTangentX = d.topTangentX, e.topTangentY = d.topTangentY, e.rightTangentX = d.rightTangentX, e.rightTangentY = d.rightTangentY, e.bottomTangentX = d.bottomTangentX, e.bottomTangentY = d.bottomTangentY;
}
function Tn(e, t, o) {
  zh(r.vector.properties, S.selectedPoint.xKey, S.selectedPoint.yKey, t, o), e.vectorProperties = { ...r.vector.properties }, e.vectorProperties.px1 -= e.layer.x, e.vectorProperties.py1 -= e.layer.y, e.vectorProperties.px2 -= e.layer.x, e.vectorProperties.py2 -= e.layer.y, e.vectorProperties.px3 -= e.layer.x, e.vectorProperties.py3 -= e.layer.y, e.vectorProperties.leftTangentX -= e.layer.x, e.vectorProperties.leftTangentY -= e.layer.y, e.vectorProperties.topTangentX -= e.layer.x, e.vectorProperties.topTangentY -= e.layer.y, e.vectorProperties.rightTangentX -= e.layer.x, e.vectorProperties.rightTangentY -= e.layer.y, e.vectorProperties.bottomTangentX -= e.layer.x, e.vectorProperties.bottomTangentY -= e.layer.y;
}
function In(e = false) {
  var _a5;
  return Wt({ layer: i.currentLayer, isPreview: e, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet, brushStamp: gt[r.tool.current.brushType][r.tool.current.brushSize], brushSize: r.tool.current.brushSize, ditherPattern: Ze[r.tool.current.ditherPatternIndex], twoColorMode: ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.twoColor) ?? false, secondaryColor: B.secondary.color, ditherOffsetX: r.tool.current.ditherOffsetX ?? 0, ditherOffsetY: r.tool.current.ditherOffsetY ?? 0 });
}
function Yh() {
  if (mn()) return;
  const e = _o(), t = Oo(), { cropOffsetX: o, cropOffsetY: n } = r.canvas;
  switch (i.pointerEvent) {
    case "pointerdown":
      switch (r.tool.clickCounter += 1, r.tool.clickCounter > 2 && (r.tool.clickCounter = 1), r.tool.clickCounter) {
        case 1:
          S.reset(), r.vector.properties.tool = r.tool.current.name, r.vector.properties.px1 = e, r.vector.properties.py1 = t, r.vector.properties.forceCircle = true;
          break;
      }
      if (r.tool.clickCounter === 1) {
        r.vector.properties.px2 = e, r.vector.properties.py2 = t;
        let s = r.vector.properties.px2 - r.vector.properties.px1, a = r.vector.properties.py2 - r.vector.properties.py1;
        r.vector.properties.radA = Math.sqrt(s * s + a * a);
      }
      po(r.vector.properties), U(i.currentLayer), r.vector.properties = { ...r.vector.properties, ...Cr(r.vector.properties.px1, r.vector.properties.py1, r.vector.properties.radA, r.vector.properties.radA, r.vector.properties.angle, r.vector.properties.x1Offset, r.vector.properties.y1Offset) }, jo(r.vector.properties.weight, r.vector.properties.leftTangentX + o, r.vector.properties.leftTangentY + n, r.vector.properties.topTangentX + o, r.vector.properties.topTangentY + n, r.vector.properties.rightTangentX + o, r.vector.properties.rightTangentY + n, r.vector.properties.bottomTangentX + o, r.vector.properties.bottomTangentY + n, In(true));
      break;
    case "pointermove":
      if (r.cursor.x + i.subPixelX !== r.cursor.prevX + i.previousSubPixelX || r.cursor.y + i.subPixelY !== r.cursor.prevY + i.previousSubPixelY) {
        if (r.tool.clickCounter === 1) {
          r.vector.properties.px2 = e, r.vector.properties.py2 = t;
          let s = r.vector.properties.px2 - r.vector.properties.px1, a = r.vector.properties.py2 - r.vector.properties.py1;
          r.vector.properties.radA = Math.sqrt(s * s + a * a);
        }
        po(r.vector.properties), U(i.currentLayer), r.vector.properties = { ...r.vector.properties, ...Cr(r.vector.properties.px1, r.vector.properties.py1, r.vector.properties.radA, r.vector.properties.radA, r.vector.properties.angle, r.vector.properties.x1Offset, r.vector.properties.y1Offset) }, jo(r.vector.properties.weight, r.vector.properties.leftTangentX + o, r.vector.properties.leftTangentY + n, r.vector.properties.topTangentX + o, r.vector.properties.topTangentY + n, r.vector.properties.rightTangentX + o, r.vector.properties.rightTangentY + n, r.vector.properties.bottomTangentX + o, r.vector.properties.bottomTangentY + n, In(true));
      }
      break;
    case "pointerup":
      if (r.tool.clickCounter === 1) {
        let s = r.vector.properties.px2 - r.vector.properties.px1, a = r.vector.properties.py2 - r.vector.properties.py1;
        r.vector.properties.radA = Math.sqrt(s * s + a * a);
        let l = Jn(r.vector.properties.px1, r.vector.properties.py1, r.vector.properties.px2, r.vector.properties.py2, -Math.PI / 2, r.vector.properties.radA);
        r.vector.properties.px3 = l.x, r.vector.properties.py3 = l.y;
        let c = r.vector.properties.px3 - r.vector.properties.px1, u = r.vector.properties.py3 - r.vector.properties.py1;
        r.vector.properties.radB = Math.sqrt(c * c + u * u), po(r.vector.properties), r.vector.properties = { ...r.vector.properties, ...Cr(r.vector.properties.px1, r.vector.properties.py1, r.vector.properties.radA, r.vector.properties.radB, r.vector.properties.angle, r.vector.properties.x1Offset, r.vector.properties.y1Offset) }, jo(r.vector.properties.weight, r.vector.properties.leftTangentX + o, r.vector.properties.leftTangentY + n, r.vector.properties.topTangentX + o, r.vector.properties.topTangentY + n, r.vector.properties.rightTangentX + o, r.vector.properties.rightTangentY + n, r.vector.properties.bottomTangentX + o, r.vector.properties.bottomTangentY + n, In(false));
        let d = To(r.selection.maskSet, i.currentLayer.x + r.canvas.cropOffsetX, i.currentLayer.y + r.canvas.cropOffsetY);
        const f = { ...r.selection.boundaryBox };
        f.xMax !== null && (f.xMin -= i.currentLayer.x + r.canvas.cropOffsetX, f.xMax -= i.currentLayer.x + r.canvas.cropOffsetX, f.yMin -= i.currentLayer.y + r.canvas.cropOffsetY, f.yMax -= i.currentLayer.y + r.canvas.cropOffsetY);
        const p = r.vector.nextKey();
        r.vector.setCurrentIndex(p), Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { maskArray: d, boundaryBox: f, vectorIndices: [p] } }), r.vector.all[p] = { index: p, action: r.timeline.currentAction, layer: i.currentLayer, modes: { ...r.tool.current.modes }, color: { ...B.primary.color }, secondaryColor: { ...B.secondary.color }, ditherPatternIndex: r.tool.current.ditherPatternIndex, ditherOffsetX: ((r.tool.current.ditherOffsetX + r.canvas.cropOffsetX) % 8 + 8) % 8, ditherOffsetY: ((r.tool.current.ditherOffsetY + r.canvas.cropOffsetY) % 8 + 8) % 8, recordedLayerX: i.currentLayer.x, recordedLayerY: i.currentLayer.y, brushSize: r.tool.current.brushSize, brushType: r.tool.current.brushType, vectorProperties: { ...r.vector.properties, px1: r.vector.properties.px1 - i.currentLayer.x, py1: r.vector.properties.py1 - i.currentLayer.y, px2: r.vector.properties.px2 - i.currentLayer.x, py2: r.vector.properties.py2 - i.currentLayer.y, px3: r.vector.properties.px3 - i.currentLayer.x, py3: r.vector.properties.py3 - i.currentLayer.y, weight: r.vector.properties.weight, leftTangentX: r.vector.properties.leftTangentX - i.currentLayer.x, leftTangentY: r.vector.properties.leftTangentY - i.currentLayer.y, topTangentX: r.vector.properties.topTangentX - i.currentLayer.x, topTangentY: r.vector.properties.topTangentY - i.currentLayer.y, rightTangentX: r.vector.properties.rightTangentX - i.currentLayer.x, rightTangentY: r.vector.properties.rightTangentY - i.currentLayer.y, bottomTangentX: r.vector.properties.bottomTangentX - i.currentLayer.x, bottomTangentY: r.vector.properties.bottomTangentY - i.currentLayer.y }, hidden: false, removed: false }, r.reset(), U(i.currentLayer), S.render();
      }
      break;
  }
}
const Ah = { name: "ellipse", fn: Yh, brushSize: 1, brushType: "circle", brushDisabled: false, ditherPatternIndex: 63, ditherOffsetX: 0, ditherOffsetY: 0, options: { useSubpixels: { active: true, tooltip: `Toggle use subpixels. 

Use subpixels to control handling of origin point for radii. Determines odd or even length bounding box for ellipse.` }, displayPaths: { active: false, tooltip: `Toggle Paths. 

Show paths for ellipse.` } }, modes: { eraser: false, inject: false, twoColor: false }, type: "vector", cursor: "crosshair", activeCursor: "crosshair" };
function Rh(e = false) {
  var _a5;
  return Wt({ layer: i.currentLayer, isPreview: e, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet, brushStamp: gt[r.tool.current.brushType][r.tool.current.brushSize], brushSize: r.tool.current.brushSize, ditherPattern: Ze[r.tool.current.ditherPatternIndex], twoColorMode: ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.twoColor) ?? false, secondaryColor: B.secondary.color, ditherOffsetX: r.tool.current.ditherOffsetX ?? 0, ditherOffsetY: r.tool.current.ditherOffsetY ?? 0 });
}
function Xn() {
  let e = r.cursor.x - r.canvas.cropOffsetX, t = r.cursor.y - r.canvas.cropOffsetY;
  if (ue.ShiftLeft || ue.ShiftRight || r.vector.properties.forceSquare) {
    const s = e - r.vector.properties.px1, a = t - r.vector.properties.py1, l = Math.min(Math.abs(s), Math.abs(a));
    e = r.vector.properties.px1 + Math.sign(s) * l, t = r.vector.properties.py1 + Math.sign(a) * l;
  }
  const o = r.vector.properties.px1, n = r.vector.properties.py1;
  r.vector.properties.px2 = e, r.vector.properties.py2 = n, r.vector.properties.px3 = e, r.vector.properties.py3 = t, r.vector.properties.px4 = o, r.vector.properties.py4 = t, r.vector.properties.px0 = Math.round((o + e) / 2), r.vector.properties.py0 = Math.round((n + t) / 2);
}
function Kh(e) {
  const o = { px1: { fixedXKey: "px3", fixedYKey: "py3", adj1XKey: "px2", adj1YKey: "py2", adj2XKey: "px4", adj2YKey: "py4" }, px2: { fixedXKey: "px4", fixedYKey: "py4", adj1XKey: "px1", adj1YKey: "py1", adj2XKey: "px3", adj2YKey: "py3" }, px3: { fixedXKey: "px1", fixedYKey: "py1", adj1XKey: "px2", adj1YKey: "py2", adj2XKey: "px4", adj2YKey: "py4" }, px4: { fixedXKey: "px2", fixedYKey: "py2", adj1XKey: "px1", adj1YKey: "py1", adj2XKey: "px3", adj2YKey: "py3" } }[e];
  if (!o) return null;
  const n = r.vector.properties, s = n[o.fixedXKey], a = n[o.fixedYKey], l = n[o.adj1XKey] - s, c = n[o.adj1YKey] - a, u = Math.sqrt(l * l + c * c), d = n[o.adj2XKey] - s, f = n[o.adj2YKey] - a, p = Math.sqrt(d * d + f * f);
  return { ...o, d1x: u > 0 ? l / u : 0, d1y: u > 0 ? c / u : 0, d2x: p > 0 ? d / p : 0, d2y: p > 0 ? f / p : 0 };
}
function Dh(e, t, o, n, s, a, l = false) {
  const { fixedXKey: c, fixedYKey: u, adj1XKey: d, adj1YKey: f, adj2XKey: p, adj2YKey: h, d1x: y, d1y: v, d2x: g, d2y: x } = a, b = e[c], O = e[u], M = n - b, w = s - O;
  let C = M * y + w * v, k = M * g + w * x;
  if (l) {
    const _ = Math.min(Math.abs(C), Math.abs(k));
    C = Math.sign(C) * _, k = Math.sign(k) * _, e[t] = Math.round(b + C * y + k * g), e[o] = Math.round(O + C * v + k * x);
  } else e[t] = n, e[o] = s;
  e[d] = Math.round(b + C * y), e[f] = Math.round(O + C * v), e[p] = Math.round(b + k * g), e[h] = Math.round(O + k * x), e.px0 = Math.round((e[t] + b) / 2), e.py0 = Math.round((e[o] + O) / 2);
}
function Vh(e, t, o, n, s) {
  if (t === "px0") {
    const a = n - e.px0, l = s - e.py0;
    e.px0 = n, e.py0 = s, e.px1 += a, e.py1 += l, e.px2 += a, e.py2 += l, e.px3 += a, e.py3 += l, e.px4 += a, e.py4 += l;
  } else if (e.forceSquare) {
    let a = n, l = s;
    const c = a - e.px1, u = l - e.py1, d = Math.min(Math.abs(c), Math.abs(u));
    a = e.px1 + Math.sign(c) * d, l = e.py1 + Math.sign(u) * d, e.px2 = a, e.py2 = e.py1, e.px3 = a, e.py3 = l, e.px4 = e.px1, e.py4 = l, e.px0 = Math.round((e.px1 + a) / 2), e.py0 = Math.round((e.py1 + l) / 2);
  } else e[t] = n, e[o] = s, e.px0 = Math.round((e.px1 + e.px3) / 2), e.py0 = Math.round((e.py1 + e.py3) / 2);
}
function En(e, t, o) {
  var _a5, _b2;
  const n = ((_a5 = r.tool.current.options.uniform) == null ? void 0 : _a5.active) ? (_b2 = r.vector.savedProperties[r.vector.currentIndex]) == null ? void 0 : _b2.uniformCtx : null;
  n && S.selectedPoint.xKey !== "px0" ? Dh(r.vector.properties, S.selectedPoint.xKey, S.selectedPoint.yKey, t, o, n, r.vector.properties.forceSquare) : Vh(r.vector.properties, S.selectedPoint.xKey, S.selectedPoint.yKey, t, o), e.vectorProperties = { ...r.vector.properties }, e.vectorProperties.px0 -= e.layer.x, e.vectorProperties.py0 -= e.layer.y, e.vectorProperties.px1 -= e.layer.x, e.vectorProperties.py1 -= e.layer.y, e.vectorProperties.px2 -= e.layer.x, e.vectorProperties.py2 -= e.layer.y, e.vectorProperties.px3 -= e.layer.x, e.vectorProperties.py3 -= e.layer.y, e.vectorProperties.px4 -= e.layer.x, e.vectorProperties.py4 -= e.layer.y;
}
function Bn(e, t, o) {
  const n = r.vector.properties;
  Na(n.px1 + t, n.py1 + o, n.px2 + t, n.py2 + o, n.px3 + t, n.py3 + o, n.px4 + t, n.py4 + o, Rh(e));
}
function $h() {
  if (mn()) return;
  const e = _o(), t = Oo(), { cropOffsetX: o, cropOffsetY: n } = r.canvas;
  switch (i.pointerEvent) {
    case "pointerdown":
      S.reset(), r.vector.properties.tool = r.tool.current.name, r.vector.properties.px1 = e, r.vector.properties.py1 = t, Xn(), U(i.currentLayer), Bn(true, o, n);
      break;
    case "pointermove":
      (r.cursor.x !== r.cursor.prevX || r.cursor.y !== r.cursor.prevY) && (Xn(), U(i.currentLayer), Bn(true, o, n));
      break;
    case "pointerup": {
      Xn(), Bn(false, o, n);
      const s = To(r.selection.maskSet, i.currentLayer.x + r.canvas.cropOffsetX, i.currentLayer.y + r.canvas.cropOffsetY), a = { ...r.selection.boundaryBox };
      a.xMax !== null && (a.xMin -= i.currentLayer.x + r.canvas.cropOffsetX, a.xMax -= i.currentLayer.x + r.canvas.cropOffsetX, a.yMin -= i.currentLayer.y + r.canvas.cropOffsetY, a.yMax -= i.currentLayer.y + r.canvas.cropOffsetY);
      const l = r.vector.nextKey();
      r.vector.setCurrentIndex(l), Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { maskArray: s, boundaryBox: a, vectorIndices: [l] } });
      const c = i.currentLayer.x, u = i.currentLayer.y, d = r.vector.properties;
      r.vector.all[l] = { index: l, action: r.timeline.currentAction, layer: i.currentLayer, modes: { ...r.tool.current.modes }, color: { ...B.primary.color }, secondaryColor: { ...B.secondary.color }, ditherPatternIndex: r.tool.current.ditherPatternIndex, ditherOffsetX: ((r.tool.current.ditherOffsetX + r.canvas.cropOffsetX) % 8 + 8) % 8, ditherOffsetY: ((r.tool.current.ditherOffsetY + r.canvas.cropOffsetY) % 8 + 8) % 8, recordedLayerX: c, recordedLayerY: u, brushSize: r.tool.current.brushSize, brushType: r.tool.current.brushType, vectorProperties: { ...d, px0: d.px0 - c, py0: d.py0 - u, px1: d.px1 - c, py1: d.py1 - u, px2: d.px2 - c, py2: d.py2 - u, px3: d.px3 - c, py3: d.py3 - u, px4: d.px4 - c, py4: d.py4 - u }, hidden: false, removed: false }, r.reset(), U(i.currentLayer), S.render();
      break;
    }
  }
}
const Gh = { name: "polygon", fn: $h, brushSize: 1, brushType: "circle", brushDisabled: false, ditherPatternIndex: 63, ditherOffsetX: 0, ditherOffsetY: 0, options: { uniform: { active: false, tooltip: `Uniform. 

Maintain rectangular shape when adjusting corners.` }, displayPaths: { active: false, tooltip: `Toggle Paths. 

Show path for polygon.` } }, modes: { eraser: false, inject: false, twoColor: false }, type: "vector", cursor: "crosshair", activeCursor: "crosshair" };
function xo() {
  var _a5, _b2, _c5, _d3, _e5, _f4, _g, _h4, _i5, _j, _k, _l4, _m3;
  let e = r.vector.all[r.vector.currentIndex];
  const t = _o(), o = Oo();
  switch (i.pointerEvent) {
    case "pointerdown":
      S.selectedPoint = { xKey: S.collidedPoint.xKey, yKey: S.collidedPoint.yKey }, r.vector.savedProperties[r.vector.currentIndex] = { ...e.vectorProperties, modes: { ...e.modes } }, e.vectorProperties.tool === "ellipse" ? (!ue.ShiftLeft && !ue.ShiftRight && S.selectedPoint.xKey !== "px1" && (r.vector.properties.forceCircle = false, e.vectorProperties.forceCircle = false), S.selectedPoint.xKey === "px1" && (r.vector.properties.forceCircle = e.vectorProperties.forceCircle), Tn(e, t, o)) : e.vectorProperties.tool === "polygon" ? (!ue.ShiftLeft && !ue.ShiftRight && S.selectedPoint.xKey !== "px0" && (r.vector.properties.forceSquare = false, e.vectorProperties.forceSquare = false), ((_a5 = r.tool.current.options.uniform) == null ? void 0 : _a5.active) && S.selectedPoint.xKey !== "px0" && (r.vector.savedProperties[r.vector.currentIndex].uniformCtx = Kh(S.selectedPoint.xKey)), En(e, t, o)) : (r.vector.properties[S.collidedPoint.xKey] = t, r.vector.properties[S.collidedPoint.yKey] = o, He(e, t, o, S.selectedPoint.xKey, S.selectedPoint.yKey), ((_b2 = r.tool.current.options.hold) == null ? void 0 : _b2.active) && Fo(e, t, o), ((_c5 = r.tool.current.options.link) == null ? void 0 : _c5.active) && _n(e, true), ((_d3 = e.modes) == null ? void 0 : _d3.line) && (Oh(e), On(e))), r.timeline.activeIndexes = Ys(e, r.vector.savedProperties), U(e.layer, true, r.timeline.activeIndexes, true);
      break;
    case "pointermove":
      S.selectedPoint.xKey && (e.vectorProperties.tool === "ellipse" ? Tn(e, t, o) : e.vectorProperties.tool === "polygon" ? En(e, t, o) : (r.vector.properties[S.selectedPoint.xKey] = t, r.vector.properties[S.selectedPoint.yKey] = o, He(e, t, o, S.selectedPoint.xKey, S.selectedPoint.yKey), ((_e5 = r.tool.current.options.hold) == null ? void 0 : _e5.active) && Fo(e, t, o), ((_f4 = r.tool.current.options.link) == null ? void 0 : _f4.active) && _n(e), ((_g = e.modes) == null ? void 0 : _g.line) && On(e)), U(e.layer, true, r.timeline.activeIndexes));
      break;
    case "pointerup":
      S.selectedPoint.xKey && (e.vectorProperties.tool === "ellipse" ? Tn(e, t, o) : e.vectorProperties.tool === "polygon" ? En(e, t, o) : (r.vector.properties[S.selectedPoint.xKey] = t, r.vector.properties[S.selectedPoint.yKey] = o, He(e, t, o, S.selectedPoint.xKey, S.selectedPoint.yKey), ((_h4 = r.tool.current.options.hold) == null ? void 0 : _h4.active) && Fo(e, t, o), ((_i5 = r.tool.current.options.link) == null ? void 0 : _i5.active) && _n(e), ((_j = e.modes) == null ? void 0 : _j.line) && On(e), (((_k = r.tool.current.options.align) == null ? void 0 : _k.active) || ((_l4 = r.tool.current.options.equal) == null ? void 0 : _l4.active) || ((_m3 = r.tool.current.options.link) == null ? void 0 : _m3.active)) && Object.keys(r.vector.savedProperties).length === 1 && ["px1", "px2"].includes(S.selectedPoint.xKey) && r.vector.collidedIndex !== null && r.vector.currentIndex !== null && _h(e)), U(e.layer, true, r.timeline.activeIndexes), Eo(e), S.selectedPoint = { xKey: null, yKey: null });
      break;
  }
}
function mn() {
  if (r.vector.collidedIndex !== null && !S.selectedCollisionPresent && r.tool.clickCounter === 0) {
    let e = r.vector.all[r.vector.collidedIndex];
    S.setVectorProperties(e), S.render();
  }
  return (S.collidedPoint.xKey === "rotationx" && S.selectedPoint.xKey === null || S.selectedPoint.xKey === "rotationx") && r.tool.clickCounter === 0 ? (Ih(), true) : r.vector.transformMode === cr && r.vector.selectedIndices.size > 0 ? (Th(), true) : S.selectedCollisionPresent && r.tool.clickCounter === 0 && r.vector.currentIndex !== null ? (xo(), true) : r.vector.selectedIndices.size > 0 ? (Lh(), true) : false;
}
function qh() {
  if (mn()) return;
  const e = _o(), t = Oo(), { cropOffsetX: o, cropOffsetY: n } = r.canvas;
  switch (i.pointerEvent) {
    case "pointerdown": {
      S.reset(), r.vector.properties.tool = r.tool.current.name, r.vector.properties.px1 = e, r.vector.properties.py1 = t, Ha(r.vector.properties.px1 + o, r.vector.properties.py1 + n, Wt({ layer: i.currentLayer, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet }));
      let s = To(r.selection.maskSet, i.currentLayer.x + r.canvas.cropOffsetX, i.currentLayer.y + r.canvas.cropOffsetY);
      const a = { ...r.selection.boundaryBox };
      a.xMax !== null && (a.xMin -= i.currentLayer.x + r.canvas.cropOffsetX, a.xMax -= i.currentLayer.x + r.canvas.cropOffsetX, a.yMin -= i.currentLayer.y + r.canvas.cropOffsetY, a.yMax -= i.currentLayer.y + r.canvas.cropOffsetY), r.vector.highestKey += 1;
      let l = r.vector.highestKey;
      Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { maskArray: s, boundaryBox: a, vectorIndices: [l] } }), r.vector.all[l] = { index: l, action: r.timeline.currentAction, layer: i.currentLayer, modes: { ...r.tool.current.modes }, color: { ...B.primary.color }, brushSize: r.tool.current.brushSize, brushType: r.tool.current.brushType, vectorProperties: { ...r.vector.properties, px1: r.vector.properties.px1 - i.currentLayer.x, py1: r.vector.properties.py1 - i.currentLayer.y }, hidden: false, removed: false }, U(i.currentLayer), S.reset();
      break;
    }
    case "pointermove":
      break;
    case "pointerup":
      U(i.currentLayer);
      break;
  }
}
const Uh = { name: "fill", fn: qh, brushSize: 1, brushType: "circle", brushDisabled: true, options: { contiguous: { active: true } }, modes: { eraser: false }, type: "vector", cursor: "crosshair", activeCursor: "crosshair" };
function Hh() {
  const e = r.tool.current.modes;
  return e.cubicCurve ? "cubicCurve" : e.quadCurve ? "quadCurve" : "line";
}
function Do(e = false) {
  var _a5;
  return Wt({ layer: i.currentLayer, isPreview: e, boundaryBox: r.selection.boundaryBox, currentColor: B.primary.color, currentModes: r.tool.current.modes, maskSet: r.selection.maskSet, brushStamp: gt[r.tool.current.brushType][r.tool.current.brushSize], brushSize: r.tool.current.brushSize, ditherPattern: Ze[r.tool.current.ditherPatternIndex], twoColorMode: ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.twoColor) ?? false, secondaryColor: B.secondary.color, ditherOffsetX: r.tool.current.ditherOffsetX ?? 0, ditherOffsetY: r.tool.current.ditherOffsetY ?? 0 });
}
function Nh() {
  var _a5;
  const e = _o(), t = Oo(), o = Hh(), n = o === "cubicCurve" ? 3 : o === "quadCurve" ? 2 : 1, { cropOffsetX: s, cropOffsetY: a } = r.canvas;
  if (((_a5 = r.tool.current.options.chain) == null ? void 0 : _a5.active) && i.pointerEvent === "pointerdown" && r.tool.clickCounter === 0) {
    const l = Ph();
    if (l !== null) {
      r.tool.clickCounter += 1, S.reset(), r.vector.properties.tool = r.tool.current.name, r.vector.properties.px1 = l.x, r.vector.properties.py1 = l.y, r.vector.properties.px2 = l.x, r.vector.properties.py2 = l.y, U(i.currentLayer), lo(l.x + s, l.y + a, l.x + s, l.y + a, r.vector.properties.px3 + s, r.vector.properties.py3 + a, r.vector.properties.px4 + s, r.vector.properties.py4 + a, 1, Do(true));
      return;
    }
  }
  if (!mn()) switch (i.pointerEvent) {
    case "pointerdown":
      switch (r.tool.clickCounter += 1, r.tool.clickCounter > n && (r.tool.clickCounter = 1), r.tool.clickCounter) {
        case 1:
          S.reset(), r.vector.properties.tool = r.tool.current.name, r.vector.properties.px1 = e, r.vector.properties.py1 = t, r.vector.properties.px2 = e, r.vector.properties.py2 = t;
          break;
        case 2:
          r.vector.properties.px3 = e, r.vector.properties.py3 = t;
          break;
        case 3:
          r.vector.properties.px4 = e, r.vector.properties.py4 = t;
          break;
      }
      U(i.currentLayer), lo(r.vector.properties.px1 + s, r.vector.properties.py1 + a, r.vector.properties.px2 + s, r.vector.properties.py2 + a, r.vector.properties.px3 + s, r.vector.properties.py3 + a, r.vector.properties.px4 + s, r.vector.properties.py4 + a, r.tool.clickCounter, Do(true));
      break;
    case "pointermove":
      switch (r.tool.clickCounter) {
        case 1:
          r.vector.properties.px2 = e, r.vector.properties.py2 = t;
          break;
        case 2:
          r.vector.properties.px3 = e, r.vector.properties.py3 = t;
          break;
        case 3:
          r.vector.properties.px4 = e, r.vector.properties.py4 = t;
          break;
      }
      U(i.currentLayer), lo(r.vector.properties.px1 + s, r.vector.properties.py1 + a, r.vector.properties.px2 + s, r.vector.properties.py2 + a, r.vector.properties.px3 + s, r.vector.properties.py3 + a, r.vector.properties.px4 + s, r.vector.properties.py4 + a, r.tool.clickCounter, Do(true));
      break;
    case "pointerup":
      switch (r.tool.clickCounter) {
        case 1:
          r.vector.properties.px2 = e, r.vector.properties.py2 = t;
          break;
        case 2:
          r.vector.properties.px3 = e, r.vector.properties.py3 = t;
          break;
        case 3:
          r.vector.properties.px4 = e, r.vector.properties.py4 = t;
          break;
      }
      if (r.tool.clickCounter === n) {
        lo(r.vector.properties.px1 + s, r.vector.properties.py1 + a, r.vector.properties.px2 + s, r.vector.properties.py2 + a, r.vector.properties.px3 + s, r.vector.properties.py3 + a, r.vector.properties.px4 + s, r.vector.properties.py4 + a, r.tool.clickCounter, Do(false)), r.tool.clickCounter = 0;
        let l = To(r.selection.maskSet, i.currentLayer.x + r.canvas.cropOffsetX, i.currentLayer.y + r.canvas.cropOffsetY);
        const c = { ...r.selection.boundaryBox };
        c.xMax !== null && (c.xMin -= i.currentLayer.x + r.canvas.cropOffsetX, c.xMax -= i.currentLayer.x + r.canvas.cropOffsetX, c.yMin -= i.currentLayer.y + r.canvas.cropOffsetY, c.yMax -= i.currentLayer.y + r.canvas.cropOffsetY);
        const u = r.vector.nextKey();
        r.vector.setCurrentIndex(u), Se({ tool: r.tool.current.name, layer: i.currentLayer, properties: { maskArray: l, boundaryBox: c, vectorIndices: [u] } }), r.vector.all[u] = { index: u, action: r.timeline.currentAction, layer: i.currentLayer, modes: { ...r.tool.current.modes }, color: { ...B.primary.color }, secondaryColor: { ...B.secondary.color }, ditherPatternIndex: r.tool.current.ditherPatternIndex, ditherOffsetX: ((r.tool.current.ditherOffsetX + r.canvas.cropOffsetX) % 8 + 8) % 8, ditherOffsetY: ((r.tool.current.ditherOffsetY + r.canvas.cropOffsetY) % 8 + 8) % 8, recordedLayerX: i.currentLayer.x, recordedLayerY: i.currentLayer.y, brushSize: r.tool.current.brushSize, brushType: r.tool.current.brushType, vectorProperties: { ...r.vector.properties, px1: r.vector.properties.px1 - i.currentLayer.x, py1: r.vector.properties.py1 - i.currentLayer.y, px2: r.vector.properties.px2 - i.currentLayer.x, py2: r.vector.properties.py2 - i.currentLayer.y, px3: r.tool.current.modes.line ? null : r.vector.properties.px3 - i.currentLayer.x, py3: r.tool.current.modes.line ? null : r.vector.properties.py3 - i.currentLayer.y, px4: r.tool.current.modes.line || r.tool.current.modes.quadCurve ? null : r.vector.properties.px4 - i.currentLayer.x, py4: r.tool.current.modes.line || r.tool.current.modes.quadCurve ? null : r.vector.properties.py4 - i.currentLayer.y }, hidden: false, removed: false }, U(i.currentLayer), S.render();
      }
      break;
  }
}
const Wh = { name: "curve", fn: Nh, brushSize: 1, brushType: "circle", brushDisabled: false, ditherPatternIndex: 63, ditherOffsetX: 0, ditherOffsetY: 0, options: { chain: { active: false, tooltip: `Toggle Chain (7). 

Start a new vector from a colliding vector endpoint instead of adjusting it.` }, equal: { active: false, tooltip: `Toggle Equal Length (=). 

Ensures magnitude continuity of control handles for linked vectors.` }, align: { active: true, tooltip: `Toggle Align (A). 

Ensures tangential continuity by moving the control handle to the opposite angle for linked vectors.` }, hold: { active: false, tooltip: `Toggle Hold (H). 

Maintain relative angles of all control handles attached to selected control point.` }, link: { active: true, tooltip: `Toggle Linking (L). 

Connected control points of other vectors will move with selected control point.` }, displayPaths: { active: false, tooltip: `Toggle Paths. 

Show paths for vectors.` } }, modes: { line: true, quadCurve: false, cubicCurve: false, eraser: false, inject: false, twoColor: false }, type: "vector", cursor: "crosshair", activeCursor: "crosshair" }, zn = ({ red: e, green: t, blue: o }) => {
  let n = e / 255, s = t / 255, a = o / 255, l = Math.min(n, s, a), c = Math.max(n, s, a), u = c - l, d = 0, f = 0, p = 0;
  return u == 0 ? d = 0 : c == n ? d = (s - a) / u % 6 : c == s ? d = (a - n) / u + 2 : d = (n - s) / u + 4, d = Math.round(d * 60), d < 0 && (d += 360), p = (c + l) / 2, f = u == 0 ? 0 : u / (1 - Math.abs(2 * p - 1)), f = +(f * 100).toFixed(1), p = +(p * 100).toFixed(1), { hue: d, saturation: f, lightness: p };
}, pl = ({ hue: e, saturation: t, lightness: o }) => {
  let n = e, s = t / 100, a = o / 100, l = (1 - Math.abs(2 * a - 1)) * s, c = l * (1 - Math.abs(n / 60 % 2 - 1)), u = a - l / 2, d = 0, f = 0, p = 0;
  return 0 <= n && n < 60 ? (d = l, f = c, p = 0) : 60 <= n && n < 120 ? (d = c, f = l, p = 0) : 120 <= n && n < 180 ? (d = 0, f = l, p = c) : 180 <= n && n < 240 ? (d = 0, f = c, p = l) : 240 <= n && n < 300 ? (d = c, f = 0, p = l) : 300 <= n && n < 360 && (d = l, f = 0, p = c), d = Math.round((d + u) * 255), f = Math.round((f + u) * 255), p = Math.round((p + u) * 255), { red: d, green: f, blue: p };
}, jh = (e) => {
  let t = 0, o = 0, n = 0;
  return e.length == 4 ? (t = "0x" + e[1] + e[1], o = "0x" + e[2] + e[2], n = "0x" + e[3] + e[3]) : e.length == 7 && (t = "0x" + e[1] + e[2], o = "0x" + e[3] + e[4], n = "0x" + e[5] + e[6]), t = +t, o = +o, n = +n, { red: t, green: o, blue: n };
}, Yn = ({ red: e, green: t, blue: o }) => {
  let n = e.toString(16), s = t.toString(16), a = o.toString(16);
  return n.length == 1 && (n = "0" + n), s.length == 1 && (s = "0" + s), a.length == 1 && (a = "0" + a), "#" + n + s + a;
}, Vo = ({ red: e, green: t, blue: o }) => {
  const n = [e, t, o].map((a) => (a /= 255, a <= 0.03928 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2)), s = n[0] * 0.2126 + n[1] * 0.7152 + n[2] * 0.0722;
  return Math.round(s * 100, 2);
}, Fh = (e, t, o, n) => (e.x = Math.round(t.saturation * o / 100) - e.width / 2, e.y = Math.round(t.lightness * n / 100) - e.height / 2, e), bi = (e, t, o, n = 0) => {
  const { x: s, y: a, width: l, height: c } = t, u = n + 0.5;
  e.beginPath(), e.moveTo(s, a - u), e.lineTo(s + l, a - u), e.moveTo(s + l + u, a), e.lineTo(s + l + u, a + c), e.moveTo(s, a + c + u), e.lineTo(s + l, a + c + u), e.moveTo(s - u, a), e.lineTo(s - u, a + c), e.lineWidth = 1, e.strokeStyle = o, e.stroke(), e.closePath();
}, Jh = (e, t) => {
  const { x: o, y: n, width: s, height: a } = t;
  bi(e, t, "black"), bi(e, t, "white", 1), e.fillStyle = "white", e.fillRect(o - 1, n - 1, 1, 1), e.fillRect(o + s, n - 1, 1, 1), e.fillRect(o - 1, n + a, 1, 1), e.fillRect(o + s, n + a, 1, 1);
}, Zh = (e, t, o, n) => {
  for (let s = 0; s < o; s++) {
    const a = s / o * 100, l = e.createLinearGradient(0, 0, t, 0);
    l.addColorStop(0, `hsl(${n}, 0%, ${a}%)`), l.addColorStop(1, `hsl(${n}, 100%, ${a}%)`), e.fillStyle = l, e.fillRect(0, s, t, 1);
  }
};
function hl(e) {
  return (e % 360 + 360) % 360;
}
function xi(e, t, o) {
  return Math.max(t, Math.min(o, e));
}
function pr(e, t, o, n) {
  const { red: s, green: a, blue: l } = pl({ hue: hl(e), saturation: xi(t, 0, 100), lightness: xi(o, 0, 100) });
  return { r: s, g: a, b: l, a: n };
}
function $o(e, t, o) {
  return { r: Math.round(e.r + (t.r - e.r) * o), g: Math.round(e.g + (t.g - e.g) * o), b: Math.round(e.b + (t.b - e.b) * o), a: Math.round(e.a + (t.a - e.a) * o) };
}
function Qh(e, t) {
  const { hue: o, saturation: n, lightness: s } = e;
  function a(u, d, f) {
    let p = d - u;
    return p > 180 && (p -= 360), p < -180 && (p += 360), hl(u + p * f);
  }
  const l = 240, c = 30;
  return [pr(a(o, l, 0.3), n - 30, s - 36, t), pr(a(o, l, 0.2), n - 20, s - 24, t), pr(a(o, l, 0.1), n - 10, s - 12, t), pr(o, n, s, t), pr(a(o, c, 0.1), n + 10, s + 12, t), pr(a(o, c, 0.2), n + 20, s + 24, t), pr(a(o, c, 0.3), n + 30, s + 36, t)];
}
function ev(e, t, o) {
  return [e, $o(e, t, 1 / 3), $o(e, t, 2 / 3), t, $o(t, o, 1 / 3), $o(t, o, 2 / 3), o];
}
function tv(e, t, o, n) {
  return { r: e, g: t, b: o, a: n };
}
class rv {
  constructor(t, o, n, s) {
    this.initialColor = s, this.target = t, this.width = o, this.height = n, this.target.width = o, this.target.height = n, this.context = this.target.getContext("2d", { willReadFrequently: true }), this.pointerState = "none", this.pickerCircle = { x: 10, y: 10, width: 6, height: 6 }, this.clickedCanvas = false, this.hueRange = document.getElementById("hueslider"), this.alphaRange = document.getElementById("alphaslider"), this.rgbaContainer = document.getElementById("rgba-container"), this.r = document.getElementById("r"), this.g = document.getElementById("g"), this.b = document.getElementById("b"), this.a = document.getElementById("a"), this.hslContainer = document.getElementById("hsl-container"), this.h = document.getElementById("h"), this.s = document.getElementById("s"), this.l = document.getElementById("l"), this.hex = document.getElementById("hexcode"), this.lumi = document.getElementById("luminance"), this.oldcolor = document.getElementById("oldcolor-btn"), this.newcolor = document.getElementById("newcolor-btn"), this.confirmBtn = document.getElementById("confirm-btn"), this.cancelBtn = document.getElementById("cancel-btn"), this.colorRampsCollapsible = document.getElementById("color-ramps-collapsible"), this.customRampKeys = { start: null, mid: null, end: null }, this.selectedCustomKey = null, this.editingCustomKey = null, this.swatch = "swatch btn", this.rgb = { red: s.r, green: s.g, blue: s.b }, this.hsl = zn(this.rgb), this.alpha = s.a, this.hexcode = Yn(this.rgb), this.luminance = Vo(this.rgb);
  }
  propogateRGBColorSpace() {
    this.hsl = zn(this.rgb), this.hexcode = Yn(this.rgb), this.luminance = Vo(this.rgb), this.updateColor();
  }
  propogateHSLColorSpace() {
    this.rgb = pl(this.hsl), this.hexcode = Yn(this.rgb), this.luminance = Vo(this.rgb), this.updateColor();
  }
  propogateHexColorSpace() {
    this.rgb = jh(this.hexcode), this.hsl = zn(this.rgb), this.luminance = Vo(this.rgb), this.updateColor();
  }
  updateHue(t) {
    this.hsl.hue = +t.target.value, this.propogateHSLColorSpace();
  }
  updateAlpha(t) {
    this.alpha = t.target.value, this.a.value = t.target.value, this.hexcode = this.hex.value = this.hexcode, this.updateColor();
  }
  updateRGBA() {
    const t = +this.r.value, o = +this.g.value, n = +this.b.value;
    this.rgb = { red: t, green: o, blue: n }, this.alpha = +this.a.value, this.propogateRGBColorSpace();
  }
  updateHSL() {
    const t = +this.h.value, o = +this.s.value, n = +this.l.value;
    this.hsl = { hue: t, saturation: o, lightness: n }, this.propogateHSLColorSpace();
  }
  updateHex() {
    this.hexcode = this.hex.value, this.propogateHexColorSpace();
  }
  updateColor() {
    Zh(this.context, this.width, this.height, this.hsl.hue), this.pickerCircle = Fh(this.pickerCircle, this.hsl, this.width, this.height), Jh(this.context, this.pickerCircle);
    const { hue: t, saturation: o, lightness: n } = this.hsl, { red: s, green: a, blue: l } = this.rgb;
    document.documentElement.style.setProperty("--new-swatch-color", `${s},${a},${l}`), document.documentElement.style.setProperty("--new-swatch-alpha", `${this.alpha / 255}`), this.h.value = t, this.s.value = o, this.l.value = n, this.r.value = s, this.g.value = a, this.b.value = l, this.a.value = this.alpha, this.hex.value = this.hexcode, this.lumi.value = this.luminance, this.hueRange.value = this.hsl.hue, this.alphaRange.value = this.alpha, this.renderColorRamps();
  }
  renderRampRow(t, o, n = true) {
    t.innerHTML = "", o.forEach((s, a) => {
      const l = document.createElement("div");
      l.className = "swatch ramp-swatch", n && a === 3 && l.classList.add("ramp-base"), l.style.backgroundColor = `rgba(${s.r},${s.g},${s.b},${s.a / 255})`, l.rampColor = s, t.appendChild(l);
    });
  }
  renderColorRamps() {
    if (!this.colorRampsCollapsible) return;
    this.colorRampsCollapsible.querySelectorAll(".color-group").forEach((o) => {
      const n = o.dataset.group, s = o.querySelector(".ramp-swatches");
      if (!s) return;
      let a;
      switch (n) {
        case "shadow":
          a = Qh(this.hsl, this.alpha);
          break;
        case "custom": {
          this.editingCustomKey && (this.customRampKeys[this.editingCustomKey] = { r: this.rgb.red, g: this.rgb.green, b: this.rgb.blue, a: this.alpha });
          const { start: l, mid: c, end: u } = this.customRampKeys;
          if (!l || !c || !u) return;
          a = ev(l, c, u), this.renderRampRow(s, a);
          const d = { 0: "start", 3: "mid", 6: "end" };
          s.querySelectorAll(".ramp-swatch").forEach((f, p) => {
            const h = d[p];
            h && (f.classList.add("ramp-key"), f.dataset.key = h, f.classList.toggle("selected", h === this.selectedCustomKey), f.classList.toggle("active", h === this.editingCustomKey));
          });
          return;
        }
        default:
          return;
      }
      this.renderRampRow(s, a);
    });
  }
  handleIncrement(t) {
    const o = t.target.closest(".spin-btn");
    if (!o) return;
    const n = o.previousElementSibling;
    let s;
    switch (n) {
      case this.h:
        s = 359;
        break;
      case this.s:
      case this.l:
        s = 100;
        break;
      default:
        s = 255;
    }
    const a = Math.floor(+n.value);
    t.target.id === "inc" && a < s ? n.value = a + 1 : t.target.id === "dec" && a > 0 && (n.value = a - 1);
  }
  handleRGBIncrement(t) {
    this.pointerState === "pointerdown" && (this.handleIncrement(t), this.updateRGBA(t), window.setTimeout(() => this.handleRGBIncrement(t), 150));
  }
  handleHSLIncrement(t) {
    this.pointerState === "pointerdown" && (this.handleIncrement(t), this.updateHSL(t), window.setTimeout(() => this.handleHSLIncrement(t), 150));
  }
  handlePointerDown(t) {
    this.clickedCanvas = true;
    const { offsetX: o, offsetY: n } = t;
    this.selectSL(o, n);
  }
  handlePointerMove(t) {
    if (!this.clickedCanvas) return;
    const o = this.target.getBoundingClientRect(), n = o.left - document.documentElement.getBoundingClientRect().left, s = o.top - document.documentElement.getBoundingClientRect().top, { pageX: a, pageY: l } = t, c = a - n, u = l - s;
    this.selectSL(Math.min(Math.max(c, 0), this.width), Math.min(Math.max(u, 0), this.height));
  }
  handlePointerUp() {
    this.clickedCanvas = false;
  }
  selectSL(t, o) {
    this.hsl.saturation = Math.round(t / this.width * 100), this.hsl.lightness = Math.round(o / this.height * 100), this.propogateHSLColorSpace();
  }
  drawHueGrad() {
    this.hueRange.style.background = "linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)";
  }
  update(t) {
    if (this.initialColor = t, this.rgb = { red: t.r, green: t.g, blue: t.b }, this.alpha = t.a, this.customRampKeys.start === null) {
      const o = tv(t.r, t.g, t.b, t.a);
      this.customRampKeys = { start: o, mid: { ...o }, end: { ...o } };
    }
    this.propogateRGBColorSpace(), document.documentElement.style.setProperty("--old-swatch-color", `${t.r},${t.g},${t.b}`), document.documentElement.style.setProperty("--old-swatch-alpha", `${t.a / 255}`);
  }
  build() {
    this.drawHueGrad(), this.hueRange.addEventListener("input", (t) => {
      this.updateHue(t);
    }), this.alphaRange.addEventListener("input", (t) => {
      this.updateAlpha(t);
    }), this.target.addEventListener("pointerdown", (t) => {
      t.target.setPointerCapture(t.pointerId), this.handlePointerDown(t);
    }), this.target.addEventListener("pointermove", (t) => {
      this.handlePointerMove(t);
    }), this.target.addEventListener("pointerup", (t) => {
      this.handlePointerUp(t);
    }), this.rgbaContainer.addEventListener("pointerdown", (t) => {
      this.pointerState = t.type, this.handleRGBIncrement(t);
    }), this.rgbaContainer.addEventListener("pointerup", (t) => {
      this.pointerState = t.type;
    }), this.rgbaContainer.addEventListener("pointerout", (t) => {
      this.pointerState = t.type;
    }), this.rgbaContainer.addEventListener("change", (t) => {
      this.updateRGBA(t);
    }), this.hslContainer.addEventListener("pointerdown", (t) => {
      this.pointerState = t.type, this.handleHSLIncrement(t);
    }), this.hslContainer.addEventListener("pointerup", (t) => {
      this.pointerState = t.type;
    }), this.hslContainer.addEventListener("pointerout", (t) => {
      this.pointerState = t.type;
    }), this.hslContainer.addEventListener("change", (t) => {
      this.updateHSL(t);
    }), this.hex.addEventListener("change", (t) => {
      this.updateHex(t);
    }), this.oldcolor.addEventListener("pointerdown", () => {
      this.rgb = { red: this.initialColor.r, green: this.initialColor.g, blue: this.initialColor.b }, this.alpha = this.initialColor.a, this.propogateRGBColorSpace();
    }), this.colorRampsCollapsible && this.colorRampsCollapsible.addEventListener("click", (t) => {
      this.handleRampClick(t);
    });
  }
  handleRampClick(t) {
    var _a5;
    const o = t.target.closest(".ramp-swatch");
    if (!o || !o.rampColor) return;
    if (((_a5 = o.closest(".color-group")) == null ? void 0 : _a5.dataset.group) === "custom" && o.classList.contains("ramp-key")) {
      const d = o.dataset.key;
      if (this.editingCustomKey === d) this.editingCustomKey = null, this.selectedCustomKey = null;
      else if (this.selectedCustomKey === d) {
        this.editingCustomKey = d, this.renderColorRamps();
        return;
      } else this.selectedCustomKey = d, this.editingCustomKey = null;
      this.renderColorRamps();
    }
    const { r: a, g: l, b: c, a: u } = o.rampColor;
    this.rgb = { red: a, green: l, blue: c }, this.alpha = u, this.propogateRGBColorSpace();
  }
}
function ov() {
  let e = Math.floor(Math.random() * 256), t = Math.floor(Math.random() * 256), o = Math.floor(Math.random() * 256);
  return { color: `rgba(${e},${t},${o},1)`, r: e, g: t, b: o, a: 255 };
}
function vl(e) {
  let t = e.parentElement.getBoundingClientRect(), o = e.getBoundingClientRect();
  o.left - 2 < t.left && (e.style.left = "0px"), o.top - 2 < t.top && (e.style.top = "0px"), o.right + 2 > t.right && (e.style.left = t.width - o.width - 4 + "px"), o.bottom + 2 > t.bottom && (e.style.top = t.height - o.height - 4 + "px");
}
function fe(e) {
  const t = parseInt(e.slice(0, 2), 16), o = parseInt(e.slice(2, 4), 16), n = parseInt(e.slice(4, 6), 16);
  return { color: `rgba(${t},${o},${n},1)`, r: t, g: o, b: n, a: 255 };
}
const Jo = [{ id: "1bit", label: "1-Bit" }, { id: "gameboy", label: "GameBoy" }, { id: "pico8", label: "Pico-8" }, { id: "sweetie16", label: "Sweetie 16" }], co = { "1bit": [fe("000000"), fe("ffffff")], gameboy: [fe("0f380f"), fe("306230"), fe("8bac0f"), fe("9bbc0f")], pico8: [fe("000000"), fe("1d2b53"), fe("7e2553"), fe("008751"), fe("ab5236"), fe("5f574f"), fe("c2c3c7"), fe("fff1e8"), fe("ff004d"), fe("ffa300"), fe("ffec27"), fe("00e436"), fe("29adff"), fe("83769c"), fe("ff77a8"), fe("ffccaa")], sweetie16: [fe("1a1c2c"), fe("5d275d"), fe("b13e53"), fe("ef7d57"), fe("ffcd75"), fe("a7f070"), fe("38b764"), fe("257179"), fe("29366f"), fe("3b5dc9"), fe("41a6f6"), fe("73eff7"), fe("f4f4f4"), fe("94b0c2"), fe("566c86"), fe("333c57")] };
function As(e, t, o, n, s) {
  var _a5;
  if (n = parseInt(n), s === B.primary.swatch) B.primary.color.color = `rgba(${e},${t},${o},${n / 255})`, B.primary.color.r = e, B.primary.color.g = t, B.primary.color.b = o, B.primary.color.a = n, document.documentElement.style.setProperty("--primary-swatch-color", `${e},${t},${o}`), document.documentElement.style.setProperty("--primary-swatch-alpha", `${n / 255}`), We.update(B.primary.color);
  else if (s === B.secondary.swatch) B.secondary.color.color = `rgba(${e},${t},${o},${n / 255})`, B.secondary.color.r = e, B.secondary.color.g = t, B.secondary.color.b = o, B.secondary.color.a = n, document.documentElement.style.setProperty("--secondary-swatch-color", `${e},${t},${o}`), document.documentElement.style.setProperty("--secondary-swatch-alpha", `${n / 255}`);
  else {
    let a = { color: `rgba(${e},${t},${o},${n / 255})`, r: e, g: t, b: o, a: n };
    s.color = a, s.style && (s.style.backgroundColor = a.color);
    const l = (_a5 = s.querySelector) == null ? void 0 : _a5.call(s, ".swatch");
    if (l && (l.style.backgroundColor = a.color), s.vector) {
      let c = s.vector;
      if (s.isSecondaryColor) c.secondaryColor = a, U(c.layer, true), r.clearRedoStack();
      else {
        let u = { ...c.color };
        c.color = a, U(c.layer, true), bh(c, u), r.clearRedoStack();
      }
    }
    B.activePaletteIndex !== null && (B.activePaletteIndex > B.palette.length - 1 ? B.palette.push(a) : B.palette[B.activePaletteIndex] = s.color, yl(), B.activePaletteIndex = null);
  }
  B.selectedPaletteIndex = null, Ep();
}
function nv(e) {
  let t = ov();
  As(t.r, t.g, t.b, 255, e);
}
function Zt(e) {
  if (!We) return;
  We.swatch = e;
  const t = e.color;
  We.update(t), r.ui.colorPickerOpen = true, T.colorPickerContainer && (T.colorPickerContainer.style.display = "flex", T.colorPickerContainer.style.top = T.colorPickerContainer.offsetTop - 2 + "px", T.colorPickerContainer.style.pointerEvents = "auto", T.colorPickerContainer.offsetHeight !== 0 && vl(T.colorPickerContainer));
}
function os() {
  We && (We.selectedCustomKey = null, We.editingCustomKey = null, r.ui.colorPickerOpen = false, T.colorPickerContainer && (T.colorPickerContainer.style.display = "none"));
}
function sv() {
  if (!We) return;
  const { red: e, green: t, blue: o } = We.rgb, n = We.alpha;
  document.documentElement.style.setProperty("--old-swatch-color", `${e},${t},${o}`), document.documentElement.style.setProperty("--old-swatch-alpha", `${n / 255}`), As(e, t, o, n, We.swatch), os();
}
let We = null;
function iv(e) {
  We = e;
}
function av() {
  if (!We) return;
  const { red: e, green: t, blue: o } = We.rgb, n = We.alpha;
  B.palette.push({ color: `rgba(${e},${t},${o},${n / 255})`, r: e, g: t, b: o, a: n }), yl();
}
function yl() {
  var _a5;
  const e = B.currentPreset;
  if (e in co) {
    const t = ((_a5 = Jo.find((l) => l.id === e)) == null ? void 0 : _a5.label) ?? e, n = Object.keys(B.customPalettes).filter((l) => l.startsWith(`custom_${e}_`)).length + 1, s = `custom_${e}_${n}`, a = n === 1 ? `Custom (${t})` : `Custom (${t}) ${n}`;
    B.customPalettes[s] = { label: a, colors: B.palette.map((l) => ({ ...l })) }, B.currentPreset = s;
  } else e in B.customPalettes && (B.customPalettes[e].colors = B.palette.map((t) => ({ ...t })));
}
function lv() {
  function e(t, o) {
    let n = Da(r.drawing.colorLayerGlobal, t, o);
    As(n.r, n.g, n.b, n.a, B.primary.swatch);
  }
  switch (i.pointerEvent) {
    case "pointerdown":
      yn(true, true), r.drawing.colorLayerGlobal = i.offScreenCTX.getImageData(0, 0, i.offScreenCVS.width, i.offScreenCVS.height), e(r.cursor.x, r.cursor.y);
      break;
    case "pointermove":
      e(r.cursor.x, r.cursor.y);
      break;
  }
}
const cv = { name: "eyedropper", fn: lv, brushSize: 1, brushType: "circle", brushDisabled: true, options: {}, modes: {}, type: "utility", cursor: "none", activeCursor: "none" };
function uv() {
  switch (i.pointerEvent) {
    case "pointerdown":
      i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset, r.tool.grabStartX = r.cursor.x, r.tool.grabStartY = r.cursor.y;
      break;
    case "pointermove":
      i.xOffset = r.cursor.x - r.tool.grabStartX + i.previousXOffset, i.yOffset = r.cursor.y - r.tool.grabStartY + i.previousYOffset, U();
      break;
    case "pointerup":
      i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset;
      break;
    case "pointerout":
      i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset;
      break;
  }
}
const dv = { name: "grab", fn: uv, brushSize: 1, brushType: "circle", brushDisabled: true, options: {}, modes: {}, type: "utility", cursor: "grab", activeCursor: "grabbing" }, ie = { modify: { name: "modify", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, changeMode: { name: "changeMode", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, changeDitherPattern: { name: "changeDitherPattern", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, changeDitherOffset: { name: "changeDitherOffset", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, changeBrushSize: { name: "changeBrushSize", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, changeColor: { name: "changeColor", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, remove: { name: "remove", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, clear: { name: "clear", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "modify" }, brush: oe, select: dh, magicWand: vh, move: Bh, fill: Uh, curve: Wh, ellipse: Ah, polygon: Gh, addLayer: { name: "addLayer", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "settings" }, removeLayer: { name: "removeLayer", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "settings" }, cut: { name: "cut", fn: null, brushSize: null, brushType: null, brushDisabled: true, options: {}, modes: {}, type: "raster" }, paste: { name: "paste", fn: null, brushSize: null, brushType: null, brushDisabled: true, options: {}, modes: {}, type: "raster" }, vectorPaste: { name: "vectorPaste", fn: null, brushSize: null, brushType: null, brushDisabled: true, options: {}, modes: {}, type: "vector" }, transform: { name: "transform", fn: null, brushSize: null, brushType: null, brushDisabled: true, options: {}, modes: {}, type: "raster" }, resize: { name: "resize", fn: null, brushSize: null, brushType: null, brushDisabled: false, options: {}, modes: {}, type: "settings" }, eyedropper: cv, grab: dv }, hr = { shapeTools: { tools: ["ellipse", "polygon"], activeTool: "ellipse" }, selectionTools: { tools: ["select", "magicWand"], activeTool: "select" } }, fv = Me({ x: null, y: null, prevX: 0, prevY: 0, withOffsetX: null, withOffsetY: null, clicked: false, clickDisabled: false }), pv = Me({ current: null, selectedName: "brush", clickCounter: 0, lineStartX: null, lineStartY: null, grabStartX: null, grabStartY: null, startScale: null, touch: false });
var hv = ["forEach", "isDisjointFrom", "isSubsetOf", "isSupersetOf"], vv = ["difference", "intersection", "symmetricDifference", "union"], Si = false;
const _un = class _un extends Set {
  constructor(t) {
    super();
    __privateAdd(this, _un_instances);
    __privateAdd(this, _t4, /* @__PURE__ */ new Map());
    __privateAdd(this, _n5, se(0));
    __privateAdd(this, _e4, se(0));
    __privateAdd(this, _s5, $t || -1);
    if (t) {
      for (var o of t) super.add(o);
      __privateGet(this, _e4).v = super.size;
    }
    Si || __privateMethod(this, _un_instances, i_fn).call(this);
  }
  has(t) {
    var o = super.has(t), n = __privateGet(this, _t4), s = n.get(t);
    if (s === void 0) {
      if (!o) return m(__privateGet(this, _n5)), false;
      s = __privateMethod(this, _un_instances, o_fn).call(this, true), n.set(t, s);
    }
    return m(s), o;
  }
  add(t) {
    return super.has(t) || (super.add(t), N(__privateGet(this, _e4), super.size), or(__privateGet(this, _n5))), this;
  }
  delete(t) {
    var o = super.delete(t), n = __privateGet(this, _t4), s = n.get(t);
    return s !== void 0 && (n.delete(t), N(s, false)), o && (N(__privateGet(this, _e4), super.size), or(__privateGet(this, _n5))), o;
  }
  clear() {
    if (super.size !== 0) {
      super.clear();
      var t = __privateGet(this, _t4);
      for (var o of t.values()) N(o, false);
      t.clear(), N(__privateGet(this, _e4), 0), or(__privateGet(this, _n5));
    }
  }
  keys() {
    return this.values();
  }
  values() {
    return m(__privateGet(this, _n5)), super.values();
  }
  entries() {
    return m(__privateGet(this, _n5)), super.entries();
  }
  [Symbol.iterator]() {
    return this.keys();
  }
  get size() {
    return m(__privateGet(this, _e4));
  }
};
_t4 = new WeakMap();
_n5 = new WeakMap();
_e4 = new WeakMap();
_s5 = new WeakMap();
_un_instances = new WeakSet();
o_fn = function(t) {
  return $t === __privateGet(this, _s5) ? se(t) : ar(t);
};
i_fn = function() {
  Si = true;
  var t = _un.prototype, o = Set.prototype;
  for (const n of hv) t[n] = function(...s) {
    return m(__privateGet(this, _n5)), o[n].apply(this, s);
  };
  for (const n of vv) t[n] = function(...s) {
    m(__privateGet(this, _n5));
    var a = o[n].apply(this, s);
    return new _un(a);
  };
};
let un = _un;
const yv = Me({ properties: {}, all: {}, currentIndex: null, collidedIndex: null, selectedIndices: new un(), savedProperties: {}, transformMode: mo, highestKey: 0, redoStackHeld: {}, shapeCenterX: null, shapeCenterY: null, grabStartShapeCenterX: null, grabStartShapeCenterY: null, grabStartAngle: null, setCurrentIndex(e) {
  this.currentIndex = e;
}, nextKey() {
  return this.highestKey += 1, this.highestKey;
}, addSelected(e) {
  this.selectedIndices.add(e);
}, removeSelected(e) {
  this.selectedIndices.delete(e);
}, clearSelected() {
  this.selectedIndices.clear();
}, setTransformMode(e) {
  this.transformMode = e;
} }), mv = Me({ properties: { px1: null, py1: null, px2: null, py2: null }, boundaryBox: { xMin: null, yMin: null, xMax: null, yMax: null }, previousBoundaryBox: null, maskSet: null, seenPixelsSet: null, pointsSet: null, pixelPoints: null, cornersSet: null, resetProperties() {
  this.properties = { px1: null, py1: null, px2: null, py2: null }, this.maskSet = null;
}, normalize() {
  const { px1: e, py1: t, px2: o, py2: n } = { ...this.properties };
  this.properties.px1 = Math.min(e, o), this.properties.py1 = Math.min(t, n), this.properties.px2 = Math.max(o, e), this.properties.py2 = Math.max(n, t);
}, resetBoundaryBox() {
  this.boundaryBox = { xMin: null, yMin: null, xMax: null, yMax: null };
}, setBoundaryBox(e) {
  e.px1 !== null && e.py1 !== null && e.px2 !== null && e.py2 !== null ? (this.boundaryBox.xMin = Math.min(e.px1, e.px2), this.boundaryBox.yMin = Math.min(e.py1, e.py2), this.boundaryBox.xMax = Math.max(e.px2, e.px1), this.boundaryBox.yMax = Math.max(e.py2, e.py1)) : this.resetBoundaryBox();
} }), gv = Me({ undoStack: [], redoStack: [], currentAction: null, sanitizedUndoStack: [], activeIndexes: [], savedBetweenActionImages: [], points: [], clearPoints() {
  this.points = [];
}, addPoint(e) {
  this.points.push(e);
}, clearActiveIndexes() {
  this.activeIndexes = [];
}, clearSavedBetweenActionImages() {
  this.savedBetweenActionImages = [];
} }), bv = Me({ tooltipMessage: null, tooltipTarget: null, showTooltips: true, settingsOpen: false, canvasSizeOpen: false, exportOpen: false, colorPickerOpen: false, vectorTransformOpen: false, ditherPickerOpen: false, stampEditorOpen: false, dragging: false, dragX: null, dragY: null, dragTarget: null, dragSiblings: [], shortcuts: true, saveDialogOpen: false, saveSettings: { saveAsFileName: "my drawing", preserveHistory: true, includePalette: true, includeReferenceLayers: true, includeRemovedActions: true } }), xv = Me({ select: { boundaryBox: { xMin: null, yMin: null, xMax: null, yMax: null }, canvasBoundaryBox: { xMin: null, yMin: null, xMax: null, yMax: null }, selectProperties: { px1: null, py1: null, px2: null, py2: null }, canvas: null, imageData: null, vectors: {} }, pastedImages: {}, highestPastedImageKey: 0, currentPastedImageKey: null }), Sv = Me({ isMirroredHorizontally: false, isMirroredVertically: false, rotationDegrees: 0 }), Cv = Me({ lastDrawnX: null, lastDrawnY: null, waitingPixelX: null, waitingPixelY: null, colorLayerGlobal: null, localColorLayer: null }), wv = Me({ cropOffsetX: 0, cropOffsetY: 0, resizeOverlayActive: false }), r = { cursor: fv, tool: pv, vector: yv, selection: mv, timeline: gv, ui: bv, clipboard: xv, transform: Sv, drawing: Cv, canvas: wv, reset: kv, deselect: Pv, clearRedoStack: _v }, ot = r;
let At = null;
function Mv(e) {
  At = e;
}
function kv() {
  ot.tool.clickCounter = 0, ot.vector.properties.forceCircle && (ot.vector.properties.forceCircle = false);
}
function Pv() {
  ot.selection.resetProperties(), ot.selection.resetBoundaryBox(), ot.vector.properties = {}, At && (At.selectedPoint = { xKey: null, yKey: null }, At.resetCollision()), ot.vector.setCurrentIndex(null), ot.vector.clearSelected(), ot.ui.vectorTransformOpen = false, T.vectorTransformUIContainer && (T.vectorTransformUIContainer.style.display = "none"), At && (At.mother.newRotation = 0, At.mother.currentRotation = 0, At.mother.rotationOrigin.x = null, At.mother.rotationOrigin.y = null);
}
function _v() {
  ot.timeline.currentAction = null;
  for (const e of ot.timeline.redoStack) e.vectorIndices && ie[e.tool].type === "vector" && e.vectorIndices.forEach((t) => {
    delete ot.vector.all[t];
  }), e.pastedImageKey && e.tool === "paste" && !e.confirmed && delete ot.clipboard.pastedImages[e.pastedImageKey];
  ot.timeline.redoStack = [];
}
function Ov() {
  if (i.pastedLayer) return;
  let e, t = new Image();
  this.files && this.files[0] && (e = new FileReader(), e.onload = (o) => {
    t.src = o.target.result, t.onload = () => {
      const n = Ja(t);
      i.layers.unshift(n), Se({ tool: ie.addLayer.name, layer: n }), r.clearRedoStack(), st(), U();
    };
  }, e.readAsDataURL(this.files[0]));
}
function ml() {
  if (i.pastedLayer) return;
  const e = Fa();
  i.layers.push(e), Se({ tool: ie.addLayer.name, layer: e }), r.clearRedoStack(), st();
}
function Lv(e) {
  (i.activeLayerCount > 1 || e.type !== "raster") && (e.removed = true, e === i.currentLayer && (e.type === "reference" && r.deselect(), e.inactiveTools.forEach((t) => {
    T[`${t}Btn`] && (T[`${t}Btn`].disabled = false);
  }), i.currentLayer = i.layers.find((t) => t.type === "raster" && !t.removed), i.currentLayer.inactiveTools.forEach((t) => {
    T[`${t}Btn`] && (T[`${t}Btn`].disabled = true);
  }), S.reset()), Se({ tool: ie.removeLayer.name, layer: e }), r.clearRedoStack(), st());
}
const Tv = () => {
  i.vectorGuiCVS.width = i.vectorGuiCVS.offsetWidth * i.sharpness, i.vectorGuiCVS.height = i.vectorGuiCVS.offsetHeight * i.sharpness, i.vectorGuiCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.selectionGuiCVS.width = i.selectionGuiCVS.offsetWidth * i.sharpness, i.selectionGuiCVS.height = i.selectionGuiCVS.offsetHeight * i.sharpness, i.selectionGuiCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.resizeOverlayCVS.width = i.resizeOverlayCVS.offsetWidth * i.sharpness, i.resizeOverlayCVS.height = i.resizeOverlayCVS.offsetHeight * i.sharpness, i.resizeOverlayCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.cursorCVS.width = i.cursorCVS.offsetWidth * i.sharpness, i.cursorCVS.height = i.cursorCVS.offsetHeight * i.sharpness, i.cursorCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.layers.forEach((e) => {
    e.onscreenCvs.width = e.onscreenCvs.offsetWidth * i.sharpness, e.onscreenCvs.height = e.onscreenCvs.offsetHeight * i.sharpness, e.onscreenCtx.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0);
  }), i.backgroundCVS.width = i.backgroundCVS.offsetWidth * i.sharpness, i.backgroundCVS.height = i.backgroundCVS.offsetHeight * i.sharpness, i.backgroundCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), U(), T.toolboxContainer && (T.toolboxContainer.style.left = "", T.toolboxContainer.style.top = ""), T.sidebarContainer && (T.sidebarContainer.style.left = "", T.sidebarContainer.style.top = ""), T.colorPickerContainer && T.colorPickerContainer.offsetHeight !== 0 && vl(T.colorPickerContainer);
};
ml();
i.currentLayer = i.layers[0];
i.xOffset = Math.round((i.currentLayer.onscreenCvs.width / i.sharpness / i.zoom - i.offScreenCVS.width) / 2);
i.yOffset = Math.round((i.currentLayer.onscreenCvs.height / i.sharpness / i.zoom - i.offScreenCVS.height) / 2);
i.previousXOffset = i.xOffset;
i.previousYOffset = i.yOffset;
U(i.currentLayer);
i.tempLayer = Za();
window.addEventListener("resize", Tv);
const Iv = { tl: { x: "px1", y: "py1" }, t: { x: "px2", y: "py2" }, tr: { x: "px3", y: "py3" }, r: { x: "px4", y: "py4" }, br: { x: "px5", y: "py5" }, b: { x: "px6", y: "py6" }, bl: { x: "px7", y: "py7" }, l: { x: "px8", y: "py8" } }, Xv = { "top-left": [0, 0], top: [0.5, 0], "top-right": [1, 0], left: [0, 0.5], center: [0.5, 0.5], right: [1, 0.5], "bottom-left": [0, 1], bottom: [0.5, 1], "bottom-right": [1, 1] }, ae = { newWidth: 0, newHeight: 0, contentOffsetX: 0, contentOffsetY: 0, anchor: "top-left", dragHandle: null, prevCx: 0, prevCy: 0 };
function Rs() {
  const { newWidth: e, newHeight: t, contentOffsetX: o, contentOffsetY: n } = ae, s = i.xOffset - o, a = i.yOffset - n;
  return { left: s, top: a, right: s + e, bottom: a + t, newWidth: e, newHeight: t };
}
function Ev() {
  return Math.max(5, 8 / i.zoom);
}
function Bv() {
  const { left: e, top: t, right: o, bottom: n } = Rs(), s = (e + o) / 2, a = (t + n) / 2;
  return [{ id: "tl", x: e, y: t }, { id: "t", x: s, y: t }, { id: "tr", x: o, y: t }, { id: "r", x: o, y: a }, { id: "br", x: o, y: n }, { id: "b", x: s, y: n }, { id: "bl", x: e, y: n }, { id: "l", x: e, y: a }];
}
function zv(e, t) {
  const o = Ev(), { left: n, top: s, right: a, bottom: l } = Rs();
  for (const c of Bv()) if (["tl", "tr", "br", "bl"].includes(c.id) && Math.abs(e - c.x) <= o && Math.abs(t - c.y) <= o) return c.id;
  return Math.abs(t - s) <= o && e >= n - o && e <= a + o ? "t" : Math.abs(t - l) <= o && e >= n - o && e <= a + o ? "b" : Math.abs(e - n) <= o && t >= s - o && t <= l + o ? "l" : Math.abs(e - a) <= o && t >= s - o && t <= l + o ? "r" : e >= n && e <= a && t >= s && t <= l ? "move" : null;
}
function Yv(e, t, o) {
  let n = 0, s = 0;
  if (e === "l" || e === "tl" || e === "bl") {
    const a = ae.newWidth, l = Math.max(er, Math.min(Yr, a - t)), c = a - l;
    ae.contentOffsetX -= c, ae.newWidth = l, n = c;
  }
  if (e === "r" || e === "tr" || e === "br") {
    const a = ae.newWidth, l = Math.max(er, Math.min(Yr, a + t));
    ae.newWidth = l, n = l - a;
  }
  if (e === "t" || e === "tl" || e === "tr") {
    const a = ae.newHeight, l = Math.max(er, Math.min(Yr, a - o)), c = a - l;
    ae.contentOffsetY -= c, ae.newHeight = l, s = c;
  }
  if (e === "b" || e === "bl" || e === "br") {
    const a = ae.newHeight, l = Math.max(er, Math.min(Yr, a + o));
    ae.newHeight = l, s = l - a;
  }
  return e === "move" && (ae.contentOffsetX -= t, ae.contentOffsetY -= o, n = t, s = o), { effectiveDx: n, effectiveDy: s };
}
function Ks() {
  T.canvasWidth && (T.canvasWidth.value = Math.round(ae.newWidth)), T.canvasHeight && (T.canvasHeight.value = Math.round(ae.newHeight));
}
function Av() {
  const e = i.resizeOverlayCTX, t = i.resizeOverlayCVS, { left: o, top: n, right: s, bottom: a, newWidth: l, newHeight: c } = Rs(), u = i.zoom;
  e.save(), e.clearRect(0, 0, t.width, t.height);
  const d = { xMin: o - i.xOffset, yMin: n - i.yOffset, xMax: s - i.xOffset, yMax: a - i.yOffset };
  Ya(e, d), e.save(), e.lineCap = "round", e.beginPath(), e.rect(o, n, l, c), _s(e), e.restore();
  const f = [{ x: "px1", y: "py1" }, { x: "px2", y: "py2" }, { x: "px3", y: "py3" }, { x: "px4", y: "py4" }, { x: "px5", y: "py5" }, { x: "px6", y: "py6" }, { x: "px7", y: "py7" }, { x: "px8", y: "py8" }], p = u <= 4 ? 8 / u : 1.5;
  S.resetCollision(), Ka(d, f, p / 2, true, 0.5, null, i.resizeOverlayCTX), S.selectedCollisionPresent || (i.vectorGuiCVS.style.cursor = "default"), e.restore(), _r();
}
function Rv() {
  if (Ps(), r.canvas.resizeOverlayActive = true, ae.newWidth = i.offScreenCVS.width, ae.newHeight = i.offScreenCVS.height, ae.contentOffsetX = 0, ae.contentOffsetY = 0, ae.anchor = "top-left", ae.dragHandle = null, T.anchorGrid) {
    T.anchorGrid.querySelectorAll(".anchor-btn").forEach((t) => t.classList.remove("active"));
    const e = T.anchorGrid.querySelector('[data-anchor="top-left"]');
    e && e.classList.add("active");
  }
  Ks(), _r(), Ra(Av);
}
function ns() {
  Ps(), r.canvas.resizeOverlayActive = false, ae.dragHandle = null, i.resizeOverlayCTX.clearRect(0, 0, i.resizeOverlayCVS.width, i.resizeOverlayCVS.height), S.resetCollision(), _r(), i.vectorGuiCVS.style.cursor = r.tool.current.cursor;
}
function Kv(e) {
  const t = Math.floor(e.offsetX / i.zoom), o = Math.floor(e.offsetY / i.zoom);
  r.cursor.x = Math.round(t - i.previousXOffset), r.cursor.y = Math.round(o - i.previousYOffset);
  const n = zv(t, o);
  if (ae.dragHandle = n, ae.prevCx = t, ae.prevCy = o, n) {
    const s = Iv[n];
    S.selectedPoint = s ? { xKey: s.x, yKey: s.y } : { xKey: null, yKey: null }, e.target.setPointerCapture(e.pointerId);
  }
}
function Dv(e) {
  const t = Math.floor(e.offsetX / i.zoom), o = Math.floor(e.offsetY / i.zoom);
  r.cursor.x = Math.round(t - i.previousXOffset), r.cursor.y = Math.round(o - i.previousYOffset);
  const { dragHandle: n, prevCx: s, prevCy: a } = ae;
  if (n) {
    const l = t - s, c = o - a, { effectiveDx: u, effectiveDy: d } = Yv(n, l, c);
    ae.prevCx += u, ae.prevCy += d, Ks();
  }
}
function Vv(e) {
  ae.dragHandle = null, S.selectedPoint = { xKey: null, yKey: null };
  const t = Math.floor(e.offsetX / i.zoom), o = Math.floor(e.offsetY / i.zoom);
  r.cursor.x = Math.round(t - i.previousXOffset), r.cursor.y = Math.round(o - i.previousYOffset);
}
function $v(e) {
  ae.anchor = e;
}
function Go(e, t) {
  const o = Math.max(er, Math.min(Yr, Math.round(e) || er)), n = Math.max(er, Math.min(Yr, Math.round(t) || er)), [s, a] = Xv[ae.anchor] ?? [0, 0];
  ae.contentOffsetX = Math.round(ae.contentOffsetX + (o - ae.newWidth) * s), ae.contentOffsetY = Math.round(ae.contentOffsetY + (n - ae.newHeight) * a), ae.newWidth = o, ae.newHeight = n, Ks();
}
function Gv() {
  const e = Math.round(ae.newWidth), t = Math.round(ae.newHeight), o = Math.round(ae.contentOffsetX), n = Math.round(ae.contentOffsetY), s = i.offScreenCVS.width, a = i.offScreenCVS.height, l = r.canvas.cropOffsetX, c = r.canvas.cropOffsetY, u = l + o, d = c + n;
  ns(), T.sizeContainer && (T.sizeContainer.style.display = "none"), r.canvas.cropOffsetX = u, r.canvas.cropOffsetY = d, oe.ditherOffsetX = ((oe.ditherOffsetX - o) % 8 + 8) % 8, oe.ditherOffsetY = ((oe.ditherOffsetY - n) % 8 + 8) % 8;
  const f = document.querySelector(".dither-picker-container");
  f && Vt(f, oe.ditherOffsetX, oe.ditherOffsetY);
  const p = document.querySelector(".dither-preview");
  p && Vt(p, oe.ditherOffsetX, oe.ditherOffsetY);
  const h = document.querySelector(".dither-offset-control");
  if (h && bo(h.parentElement, oe.ditherOffsetX, oe.ditherOffsetY), Ls(e, t, o, n), r.selection.properties.px1 !== null && (r.selection.properties.px1 += o, r.selection.properties.py1 += n, r.selection.properties.px2 += o, r.selection.properties.py2 += n, r.selection.setBoundaryBox(r.selection.properties)), r.selection.maskSet) {
    const v = /* @__PURE__ */ new Set();
    for (const g of r.selection.maskSet) {
      const x = (g & 65535) + o, b = (g >> 16 & 65535) + n;
      x >= 0 && x < e && b >= 0 && b < t && v.add(b << 16 | x);
    }
    r.selection.maskSet = v;
  }
  const y = { index: r.timeline.undoStack.length, tool: "resize", layer: i.currentLayer, from: { width: s, height: a, cropOffsetX: l, cropOffsetY: c }, to: { width: e, height: t, cropOffsetX: u, cropOffsetY: d }, selectProperties: { ...r.selection.properties }, maskSet: r.selection.maskSet ? Array.from(r.selection.maskSet) : null, selectedVectorIndices: Array.from(r.vector.selectedIndices), currentVectorIndex: r.vector.currentIndex, hidden: false, removed: false, snapshot: null, boundaryBox: { xMin: 0, yMin: 0, xMax: e, yMax: t }, recordedCropOffsetX: u, recordedCropOffsetY: d };
  r.timeline.undoStack.push(y), r.timeline.currentAction = y;
}
const gl = (e, t) => {
  if (e && t) {
    T.tooltip.classList.remove("page-left"), T.tooltip.classList.remove("page-center");
    const o = t.getBoundingClientRect(), n = o.left + o.width / 2;
    let s = "left";
    window.innerWidth * (2 / 3) < n ? s = "right" : window.innerWidth / 3 < n && (s = "center"), T.tooltip.innerText = e;
    const a = T.tooltip.getBoundingClientRect();
    let l;
    s === "right" ? l = o.left - a.width : s === "center" ? l = o.left + o.width / 2 - a.width / 2 : l = o.left + o.width;
    const c = o.top + o.height + 16;
    s === "left" ? T.tooltip.classList.add("page-left") : s === "center" && T.tooltip.classList.add("page-center"), T.tooltip.style.top = c + "px", T.tooltip.style.left = l + "px";
  }
};
function bl() {
  r.ui.saveDialogOpen = true;
}
document.body.addEventListener("mouseover", (e) => {
  var _a5;
  r.tool.touch || (r.ui.tooltipMessage = (_a5 = e.target.dataset) == null ? void 0 : _a5.tooltip, i.currentLayer.isPreview && e.target.classList.contains("deactivate-paste") && (r.ui.tooltipMessage = r.ui.tooltipMessage + `

Cannot use with temporary pasted layer. Selecting will confirm pasted pixels.`), gl(r.ui.tooltipMessage, e.target), r.ui.showTooltips && r.ui.tooltipMessage ? T.tooltip.classList.add("visible") : T.tooltip.classList.remove("visible"));
});
document.body.addEventListener("click", (e) => {
  var _a5;
  if (!r.tool.touch) T.tooltip.classList.remove("visible");
  else {
    let t = r.ui.tooltipTarget;
    r.ui.tooltipMessage = (_a5 = e.target.dataset) == null ? void 0 : _a5.tooltip, r.ui.tooltipTarget = e.target, i.currentLayer.isPreview && e.target.classList.contains("deactivate-paste") && (r.ui.tooltipMessage = r.ui.tooltipMessage + `

Cannot use with temporary pasted layer. Selecting will confirm pasted pixels.`), gl(r.ui.tooltipMessage, e.target), r.ui.showTooltips && r.ui.tooltipMessage && r.ui.tooltipTarget !== t ? T.tooltip.classList.add("visible") : (T.tooltip.classList.remove("visible"), r.ui.tooltipTarget = null);
  }
});
function qv(e) {
  switch (e) {
    case "Enter":
      !r.cursor.clicked && i.pastedLayer && nl();
      break;
    case "Backspace":
      r.cursor.clicked || il();
      break;
    case "MetaLeft":
    case "MetaRight":
      break;
    case "Space":
      r.cursor.clicked || (r.tool.current = ie.grab, i.vectorGuiCVS.style.cursor = r.tool.current.cursor, U(i.currentLayer), S.render(), Bt());
      break;
    case "AltLeft":
    case "AltRight":
      !r.cursor.clicked && r.tool.selectedName !== "magicWand" && (r.tool.current = ie.eyedropper, i.vectorGuiCVS.style.cursor = r.tool.current.cursor, U(i.currentLayer), S.render(), Bt());
      break;
    case "ShiftLeft":
    case "ShiftRight":
      r.tool.selectedName === "brush" ? (ie.brush.options.line.active = true, r.tool.lineStartX = r.cursor.x, r.tool.lineStartY = r.cursor.y) : r.tool.selectedName === "ellipse" ? (r.vector.properties.forceCircle = true, S.selectedPoint.xKey && r.tool.clickCounter === 0 && S.selectedPoint.xKey !== "px1" && (xo(), S.render())) : r.tool.selectedName === "polygon" && (r.vector.properties.forceSquare = true, S.selectedPoint.xKey && r.tool.clickCounter === 0 && S.selectedPoint.xKey !== "px0" && (xo(), S.render()));
      break;
    case "Digit7":
      r.tool.selectedName === "curve" && (r.tool.current.options.chain.active = !r.tool.current.options.chain.active, ie.curve.options.chain.active = r.tool.current.options.chain.active, S.render());
      break;
    case "Equal":
      r.tool.selectedName === "curve" && (r.tool.current.options.equal.active = !r.tool.current.options.equal.active, ie.curve.options.equal.active = r.tool.current.options.equal.active, S.render());
      break;
    case "Slash":
      r.cursor.clicked || (De("curve"), Jt("line"));
      break;
    case "KeyA":
      r.tool.selectedName === "curve" && (r.tool.current.options.align.active = !r.tool.current.options.align.active, ie.curve.options.align.active = r.tool.current.options.align.active, S.render());
      break;
    case "KeyB":
      r.cursor.clicked || De("brush");
      break;
    case "KeyC":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight ? sl() : (De("curve"), Jt("cubicCurve")));
      break;
    case "KeyD":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight) && Xo();
      break;
    case "KeyE":
      r.cursor.clicked || Jt("eraser");
      break;
    case "KeyF":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight ? ue.ShiftLeft || ue.ShiftRight ? cn(false) : cn(true) : De("fill"));
      break;
    case "KeyG":
      r.cursor.clicked || (S.grid = !S.grid, S.render());
      break;
    case "KeyH":
      r.tool.selectedName === "curve" && (r.tool.current.options.hold.active = !r.tool.current.options.hold.active, ie.curve.options.hold.active = r.tool.current.options.hold.active);
      break;
    case "KeyI":
      r.cursor.clicked || Jt("inject");
      break;
    case "KeyJ":
      break;
    case "KeyK":
      r.cursor.clicked || (B.paletteMode = "edit");
      break;
    case "KeyL":
      r.tool.selectedName === "curve" && (r.tool.current.options.link.active = !r.tool.current.options.link.active, ie.curve.options.link.active = r.tool.current.options.link.active, S.render());
      break;
    case "KeyM":
      r.cursor.clicked || Jt("colorMask");
      break;
    case "KeyN":
      break;
    case "KeyO":
      r.cursor.clicked || De("ellipse");
      break;
    case "KeyP":
      r.cursor.clicked || De("polygon");
      break;
    case "KeyQ":
      r.cursor.clicked || (De("curve"), Jt("quadCurve"));
      break;
    case "KeyR":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight ? dl() : nv(B.primary.swatch));
      break;
    case "KeyS":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight ? bl() : De("select"));
      break;
    case "KeyT":
      !r.cursor.clicked && (ue.MetaLeft || ue.MetaRight) || (r.ui.showTooltips = !r.ui.showTooltips, r.ui.showTooltips && r.ui.tooltipMessage ? T.tooltip.classList.add("visible") : T.tooltip.classList.remove("visible"));
      break;
    case "KeyU":
      break;
    case "KeyV":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight ? rs() : De("curve"));
      break;
    case "KeyW":
      r.cursor.clicked || De("magicWand");
      break;
    case "KeyX":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight ? Bs() : B.paletteMode = "remove");
      break;
    case "KeyY":
      r.cursor.clicked || Jt("perfect");
      break;
    case "KeyZ":
      r.cursor.clicked || (ue.MetaLeft || ue.MetaRight) && (ue.ShiftLeft || ue.ShiftRight ? cl() : ll());
      break;
  }
}
function ss(e) {
  switch (e) {
    case "MetaLeft":
    case "MetaRight":
      break;
    case "Space":
      r.cursor.clicked || (r.tool.current = ie[r.tool.selectedName], i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset, S.render(), Bt(), Ci());
      break;
    case "AltLeft":
    case "AltRight":
      r.cursor.clicked || (r.tool.current = ie[r.tool.selectedName], S.render(), Bt(), Ci());
      break;
    case "ShiftLeft":
    case "ShiftRight":
      r.tool.current = ie[r.tool.selectedName], ie.brush.options.line.active = false, r.tool.current.name === "brush" && r.cursor.clicked && r.tool.current.fn(), r.vector.properties.forceCircle = false, r.vector.properties.forceSquare = false, r.tool.current.name === "ellipse" ? (S.selectedPoint.xKey || S.collidedPoint.xKey) && S.selectedPoint.xKey !== "px1" && r.cursor.clicked && (xo(), S.render()) : r.tool.current.name === "polygon" && (S.selectedPoint.xKey || S.collidedPoint.xKey) && S.selectedPoint.xKey !== "px0" && r.cursor.clicked && (xo(), S.render());
      break;
    case "KeyA":
      break;
    case "KeyB":
      break;
    case "KeyC":
      break;
    case "KeyD":
      break;
    case "KeyE":
      break;
    case "KeyF":
      break;
    case "KeyG":
      break;
    case "KeyH":
      break;
    case "KeyI":
      break;
    case "KeyJ":
      break;
    case "KeyK":
      r.cursor.clicked || (B.paletteMode = "select");
      break;
    case "KeyL":
      break;
    case "KeyM":
      break;
    case "KeyN":
      break;
    case "KeyO":
      break;
    case "KeyP":
      break;
    case "KeyQ":
      break;
    case "KeyR":
      break;
    case "KeyS":
      break;
    case "KeyT":
      break;
    case "KeyU":
      break;
    case "KeyV":
      break;
    case "KeyW":
      break;
    case "KeyX":
      r.cursor.clicked || (B.paletteMode = "select");
      break;
  }
}
function Ci() {
  var _a5;
  ((_a5 = r.tool.current.modes) == null ? void 0 : _a5.eraser) ? i.vectorGuiCVS.style.cursor = "none" : i.vectorGuiCVS.style.cursor = r.tool.current.cursor;
}
function xl(e, t, o) {
  i.zoom = e, i.xOffset = Math.round(t), i.yOffset = Math.round(o), i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset, i.vectorGuiCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.selectionGuiCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.resizeOverlayCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.cursorCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.layers.forEach((n) => {
    n.onscreenCtx.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0);
  }), i.backgroundCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.gui.lineWidth = i.zoom <= 8 ? 0.5 / i.zoom : 0.5 / 8, i.gui.collisionRadius = (i.zoom <= 8 ? 1 : 0.5) * (r.tool.touch ? 2 : 1), U(), S.render();
}
function Uv() {
  i.zoom = Ca(i.offScreenCVS.width, i.offScreenCVS.height, i.vectorGuiCVS.offsetWidth, i.vectorGuiCVS.offsetHeight), i.vectorGuiCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.selectionGuiCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.resizeOverlayCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.cursorCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.layers.forEach((e) => {
    e.onscreenCtx.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0);
  }), i.backgroundCTX.setTransform(i.sharpness * i.zoom, 0, 0, i.sharpness * i.zoom, 0, 0), i.xOffset = Math.round((i.currentLayer.onscreenCvs.width / i.sharpness / i.zoom - i.offScreenCVS.width) / 2), i.yOffset = Math.round((i.currentLayer.onscreenCvs.height / i.sharpness / i.zoom - i.offScreenCVS.height) / 2), i.previousXOffset = i.xOffset, i.previousYOffset = i.yOffset, i.gui.lineWidth = i.zoom <= 8 ? 0.5 / i.zoom : 0.5 / 8, i.gui.collisionRadius = (i.zoom <= 6 ? 1 : 0.5) * (r.tool.touch ? 2 : 1), U(), S.render();
}
function Hv(e, t) {
  let o;
  return function(...n) {
    const s = this;
    clearTimeout(o), o = setTimeout(() => {
      e.apply(s, n);
    }, t);
  };
}
const gn = (e) => {
  var _a5;
  const t = Math.floor(e.offsetX), o = Math.floor(e.offsetY), n = i.zoom, s = Math.floor(t / n), a = Math.floor(o / n);
  if (r.cursor.withOffsetX = s, r.cursor.withOffsetY = a, r.cursor.x = Math.round(s - i.previousXOffset), r.cursor.y = Math.round(a - i.previousYOffset), (_a5 = r.tool.current.options.useSubpixels) == null ? void 0 : _a5.active) {
    const l = n / 16;
    i.subPixelX = Math.floor((t - s * n) / l), i.subPixelY = Math.floor((o - a * n) / l);
  }
};
function Nv(e) {
  e.repeat || document.activeElement.tagName === "INPUT" && document.activeElement.type === "text" || (["KeyD", "KeyF", "KeyR", "KeyS"].includes(e.code) && (ue.MetaLeft || ue.MetaRight) && e.preventDefault(), r.ui.shortcuts && (ue[e.code] = true, qv(e.code)));
}
function Wv(e) {
  ue[e.code] = false, ss(e.code);
}
let Xr = 0, Zo = false, Qo = 0;
const jv = Hv(() => {
  Xr = 0, Zo = false, Qo = 0;
}, 300);
function Fv(e) {
  let t = e.deltaY;
  e.deltaMode === 1 ? t *= 40 : e.deltaMode === 2 && (t *= 800);
  const o = Math.sign(t);
  o !== 0 && Qo !== 0 && o !== Qo && (Xr = 0, Zo = false), Qo = o, Xr += t, jv();
  const n = Zo ? Zd : 1;
  if (Math.abs(Xr) < n) return;
  const s = Math.sign(Xr);
  Xr = 0, Zo = true, gn(e);
  let a = Mt.findIndex((y) => y >= i.zoom);
  a === -1 && (a = Mt.length - 1);
  const l = a + (s < 0 ? -1 : 1);
  if (l < 0 || l >= Mt.length) return;
  const c = Mt[l], u = c / i.zoom, d = r.cursor.withOffsetX / u, f = r.cursor.withOffsetY / u, p = d - r.cursor.x, h = f - r.cursor.y;
  xl(c, p, h);
}
function Jv(e) {
  var _a5, _b2;
  if (r.canvas.resizeOverlayActive) {
    Kv(e);
    return;
  }
  if (e.target.setPointerCapture(e.pointerId), i.pointerEvent = "pointerdown", r.cursor.clicked = true, !r.cursor.clickDisabled) {
    if (i.vectorGuiCVS.style.cursor = r.tool.current.activeCursor, gn(e), r.tool.touch && S.render(), U(i.currentLayer), i.currentLayer.hidden && T.layersContainer) for (let t = 0; t < T.layersContainer.children.length; t += 1) T.layersContainer.children[t].layerObj === i.currentLayer && ((_a5 = T.layersContainer.children[t].querySelector(".hide")) == null ? void 0 : _a5.classList.add("warning"));
    r.tool.current.fn(), r.cursor.prevX = r.cursor.x, r.cursor.prevY = r.cursor.y, S.render(), (r.tool.current.name === "brush" && ((_b2 = r.tool.current.modes) == null ? void 0 : _b2.eraser) || r.tool.current.name === "eyedropper") && Bt();
  }
}
function Zv(e) {
  var _a5, _b2, _c5, _d3;
  if (r.canvas.resizeOverlayActive) {
    Dv(e);
    return;
  }
  if (r.cursor.clickDisabled && r.cursor.clicked) return;
  i.pointerEvent = "pointermove", r.cursor.clickDisabled = false, i.zoomAtLastDraw = i.zoom;
  const t = ((_a5 = e.getCoalescedEvents) == null ? void 0 : _a5.call(e)) ?? [e];
  let o = false;
  for (const n of t) {
    gn(n);
    const s = r.cursor.prevX !== r.cursor.x || r.cursor.prevY !== r.cursor.y, a = ((_b2 = r.tool.current.options.useSubpixels) == null ? void 0 : _b2.active) && (i.previousSubPixelX !== i.subPixelX || i.previousSubPixelY !== i.subPixelY);
    (s || a) && (o = true, r.cursor.clicked && r.tool.current.fn(), r.cursor.prevX = r.cursor.x, r.cursor.prevY = r.cursor.y, i.previousSubPixelX = i.subPixelX, i.previousSubPixelY = i.subPixelY);
  }
  o && (S.render(), r.cursor.clicked ? (r.tool.current.name === "brush" && ((_c5 = r.tool.current.modes) == null ? void 0 : _c5.eraser) || r.tool.current.name === "eyedropper") && Bt() : r.tool.current.name === "curve" && !((_d3 = r.tool.current.modes) == null ? void 0 : _d3.line) && r.tool.clickCounter > 0 || Bt());
}
function Qv(e) {
  var _a5;
  if (r.canvas.resizeOverlayActive) {
    Vv(e);
    return;
  }
  if (i.pointerEvent = "pointerup", !(r.cursor.clickDisabled || !r.cursor.clicked)) {
    if (r.cursor.clicked = false, i.vectorGuiCVS.style.cursor = r.tool.current.cursor, gn(e), i.currentLayer.hidden && T.layersContainer) for (let t = 0; t < T.layersContainer.children.length; t += 1) T.layersContainer.children[t].layerObj === i.currentLayer && ((_a5 = T.layersContainer.children[t].querySelector(".hide")) == null ? void 0 : _a5.classList.remove("warning"));
    r.tool.current.fn(), r.timeline.currentAction && (r.selection.pointsSet = null, r.selection.seenPixelsSet = null, r.timeline.clearPoints(), r.clearRedoStack()), r.tool.current.name !== r.tool.selectedName && (!ue.AltLeft && !ue.AltRight && r.tool.current.name === "eyedropper" && ss("AltLeft"), !ue.Space && r.tool.current.name === "grab" && ss("Space")), i.pointerEvent = "none", e.targetTouches || (S.render(), ["brush", "colorMask", "eyedropper"].includes(r.tool.current.name) && Bt());
  }
}
function ey(e) {
  !r.tool.touch && r.tool.clickCounter === 0 && (U(i.currentLayer), S.render(), i.pointerEvent = "none");
}
function ty(e) {
  r.tool.touch = true, i.gui.renderRadius *= 2, i.gui.collisionRadius *= 2;
}
function ry(e) {
  e.type;
}
document.addEventListener("keydown", Nv);
document.addEventListener("keyup", Wv);
i.vectorGuiCVS.addEventListener("wheel", Fv, { passive: true });
i.vectorGuiCVS.addEventListener("pointermove", Zv);
i.vectorGuiCVS.addEventListener("pointerdown", Jv);
i.vectorGuiCVS.addEventListener("pointerup", Qv);
i.vectorGuiCVS.addEventListener("pointerout", ey);
i.vectorGuiCVS.addEventListener("touchstart", ty, { passive: true });
i.vectorGuiCVS.addEventListener("mousedown", ry);
const oy = "5";
typeof window < "u" && ((_c4 = window.__svelte ?? (window.__svelte = {})).v ?? (_c4.v = /* @__PURE__ */ new Set())).add(oy);
function Sl(e, t = document.body) {
  return t.appendChild(e), { update(o) {
    o.appendChild(e);
  }, destroy() {
    e.remove();
  } };
}
const ny = "modulepreload", sy = function(e) {
  return "/" + e;
}, wi = {}, Mi = function(t, o, n) {
  let s = Promise.resolve();
  if (o && o.length > 0) {
    let l = function(d) {
      return Promise.all(d.map((f) => Promise.resolve(f).then((p) => ({ status: "fulfilled", value: p }), (p) => ({ status: "rejected", reason: p }))));
    };
    document.getElementsByTagName("link");
    const c = document.querySelector("meta[property=csp-nonce]"), u = (c == null ? void 0 : c.nonce) || (c == null ? void 0 : c.getAttribute("nonce"));
    s = l(o.map((d) => {
      if (d = sy(d), d in wi) return;
      wi[d] = true;
      const f = d.endsWith(".css"), p = f ? '[rel="stylesheet"]' : "";
      if (document.querySelector(`link[href="${d}"]${p}`)) return;
      const h = document.createElement("link");
      if (h.rel = f ? "stylesheet" : ny, f || (h.as = "script"), h.crossOrigin = "", h.href = d, u && h.setAttribute("nonce", u), document.head.appendChild(h), f) return new Promise((y, v) => {
        h.addEventListener("load", y), h.addEventListener("error", () => v(new Error(`Unable to preload CSS for ${d}`)));
      });
    }));
  }
  function a(l) {
    const c = new Event("vite:preloadError", { cancelable: true });
    if (c.payload = l, window.dispatchEvent(c), !c.defaultPrevented) throw l;
  }
  return s.then((l) => {
    for (const c of l || []) c.status === "rejected" && a(c.reason);
    return t().catch(a);
  });
};
var iy = re('<label class="toggle"><input type="checkbox"/> <span class="checkmark"></span> </label>'), ay = re('<div class="tool-options"></div>'), ly = re('<div class="tool-options"></div>'), cy = re('<div id="options" class="nav"><div class="nav-menu" style="align-self: stretch"><div class="title"><a href="https://github.com/Tororoi/pixel-vee" target="_blank" rel="noreferrer" aria-label="Visit the Github Repo in a new tab"><img src="/pixel-vee.png" alt="Github Repo"/></a></div> <ul role="menu" aria-label="functions" id="top-menu"><li role="menuitem" aria-haspopup="true" class="menu-folder" tabindex="0"><span class="menu-folder-title">File</span> <ul role="menu" id="file-submenu"><li role="menuitem" class="open-save"><label for="drawing-upload" data-tooltip="Open saved drawing">Open</label> <input type="file" accept=".pxv" id="drawing-upload"/></li> <li role="menuitem" id="save" data-tooltip="Open dialog box to download file with current progress">Save As... (Cmd + S)</li> <li role="menuitem"><label for="import" data-tooltip="Import image">Import</label> <input type="file" accept="image/*" id="import"/></li> <li role="menuitem" id="export" data-tooltip="Download as .png">Export</li></ul></li> <li role="menuitem" aria-haspopup="true" class="menu-folder" tabindex="0"><span class="menu-folder-title">Edit</span> <ul role="menu" id="edit-submenu"><li role="menuitem" id="canvas-size" data-tooltip="Open dialog box to resize canvas area">Resize Canvas...</li> <li role="menuitem" id="select-all" data-tooltip="Select entire canvas (Cmd + A)">Select All (Cmd + A)</li> <li role="menuitem" id="deselect" data-tooltip="Deselect selection area (Cmd + D)">Deselect (Cmd + D)</li> <li role="menuitem" id="cut-selection" data-tooltip="Cut selection (Cmd + X)">Cut (Cmd + X)</li> <li role="menuitem" id="copy-selection" data-tooltip="Copy selection (Cmd + C)">Copy (Cmd + C)</li> <li role="menuitem" id="paste-selection" data-tooltip="Paste copied selection (Cmd + V)">Paste (Cmd + V)</li> <li role="menuitem" id="delete-selection" data-tooltip="Delete selection (Backspace)">Clear (Backspace)</li> <li role="menuitem" id="flip-horizontal" data-tooltip="Flip selection horizontally (Cmd + F)">Flip Horizontal (Cmd + F)</li> <li role="menuitem" id="flip-vertical" data-tooltip="Flip selection vertically (Cmd + Shift + F)">Flip Vertical (Cmd + Shift + F)</li> <li role="menuitem" id="rotate-right" data-tooltip="Rotate selection 90 degrees clockwise (Cmd + R)">Rotate Right (Cmd + R)</li></ul></li></ul></div> <div class="nav-items"><!> <div class="settings"><button type="button" class="gear" id="settings-btn" aria-label="Open settings menu" data-tooltip="Open settings menu"></button></div></div></div>');
function uy(e, t) {
  Oe(t, true);
  function o(q) {
    let we = q.replace(/([A-Z])/g, " $1");
    return (we.charAt(0).toUpperCase() + we.slice(1)).trim();
  }
  const n = R(() => !!i.pastedLayer), s = R(() => r.selection.boundaryBox.xMin !== null), a = R(() => r.vector.currentIndex !== null || r.vector.selectedIndices.size > 0), l = R(() => !m(n) && (m(s) || m(a))), c = R(() => !m(n) && (r.clipboard.select.canvas !== null || Object.keys(r.clipboard.select.vectors).length > 0)), u = R(() => m(n) || m(a)), d = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.name) ?? "";
  }), f = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.options) ?? {};
  }), p = R(() => ["curve", "ellipse", "polygon", "select"].includes(m(d)));
  function h(q, we) {
    var _a5;
    if (r.tool.current.options[q]) {
      r.tool.current.options[q].active = we;
      const ye = ie[r.tool.selectedName];
      ((_a5 = ye == null ? void 0 : ye.options) == null ? void 0 : _a5[q]) && (ye.options[q].active = we);
    }
    S.render();
  }
  function y(q) {
    var _a5;
    if (!((_a5 = q.target.files) == null ? void 0 : _a5[0])) return;
    const we = new FileReader();
    we.onload = (ye) => {
      Mi(async () => {
        const { loadDrawing: Qe } = await Promise.resolve().then(() => Gp);
        return { loadDrawing: Qe };
      }, void 0).then(({ loadDrawing: Qe }) => Qe(ye.target.result));
    }, we.readAsText(q.target.files[0]), q.target.value = null;
  }
  function v(q) {
    var _a5;
    if (!((_a5 = q.target.files) == null ? void 0 : _a5[0])) return;
    const we = new FileReader(), ye = new Image();
    we.onload = (Qe) => {
      ye.src = Qe.target.result, ye.onload = () => {
        const Ke = document.createElement("canvas");
        Ke.width = ye.width, Ke.height = ye.height;
        const at = Ke.getContext("2d", { willReadFrequently: true });
        at.drawImage(ye, 0, 0);
        const et = { ...r.clipboard.select };
        et.selectProperties = { ...r.clipboard.select.selectProperties }, r.clipboard.select.selectProperties = { px1: 0, py1: 0, px2: ye.width, py2: ye.height }, r.clipboard.select.boundaryBox = { xMin: 0, yMin: 0, xMax: ye.width, yMax: ye.height }, r.clipboard.select.canvas = Ke, r.clipboard.select.imageData = at.getImageData(0, 0, ye.width, ye.height), rs(), r.clipboard.select = et;
      };
    }, we.readAsDataURL(q.target.files[0]), q.target.value = null;
  }
  function g() {
    Mi(async () => {
      const { consolidateLayers: q } = await Promise.resolve().then(() => Dp);
      return { consolidateLayers: q };
    }, void 0).then(({ consolidateLayers: q }) => {
      q(), r.ui.exportOpen = true;
    });
  }
  function x() {
    m(n) || (r.ui.canvasSizeOpen = true, Rv());
  }
  function b() {
    r.ui.settingsOpen = !r.ui.settingsOpen;
  }
  function O() {
    const q = document.activeElement;
    (q == null ? void 0 : q.classList.contains("menu-folder")) && (q.classList.contains("active") ? q.classList.remove("active") : q.classList.add("active"));
  }
  function M(q) {
    q.currentTarget.classList.remove("active");
  }
  function w(q) {
    (q.key === "Enter" || q.key === " ") && q.currentTarget.click();
  }
  var C = cy(), k = z(C), _ = X(z(k), 2), L = z(_), E = X(z(L), 2), I = z(E), P = X(z(I), 2), A = X(I, 2), G = X(A, 2), K = X(z(G), 2), D = X(G, 2), $ = X(L, 2), H = X(z($), 2), J = z(H), Z = X(J, 2), V = X(Z, 2), Q = X(V, 2), le = X(Q, 2), de = X(le, 2), ce = X(de, 2), j = X(ce, 2), W = X(j, 2), he = X(W, 2), me = X(k, 2), be = z(me);
  {
    var ke = (q) => {
      var we = ay();
      Je(we, 21, () => Object.entries(m(f)), ([ye, Qe]) => ye, (ye, Qe) => {
        var Ke = R(() => ls(m(Qe), 2));
        let at = () => m(Ke)[0], et = () => m(Ke)[1];
        var lt = iy(), zt = z(lt), _t5 = X(zt, 3);
        pe((ft) => {
          ee(lt, "for", `${at() ?? ""}-toggle`), ee(lt, "id", at()), ee(lt, "data-tooltip", et().tooltip), ee(zt, "id", `${at() ?? ""}-toggle`), Cs(zt, !!et().active), Fe(_t5, ` ${ft ?? ""}`);
        }, [() => o(at())]), Y("change", zt, (ft) => h(at(), ft.target.checked)), F(ye, lt);
      }), F(q, we);
    }, _e5 = (q) => {
      var we = ly();
      F(q, we);
    };
    rt(be, (q) => {
      m(p) ? q(ke) : q(_e5, -1);
    });
  }
  var Xe = X(be, 2), Ee = z(Xe);
  pe(() => {
    te(G, 1, `import-image${m(n) ? " disabled" : ""}`), K.disabled = m(n), te(J, 1, pt(m(n) ? "disabled" : "")), te(Z, 1, pt(m(n) ? "disabled" : "")), te(V, 1, pt(m(l) ? "" : "disabled")), te(Q, 1, pt(m(l) ? "" : "disabled")), te(le, 1, pt(m(l) ? "" : "disabled")), te(de, 1, pt(m(c) ? "" : "disabled")), te(ce, 1, pt(m(l) ? "" : "disabled")), te(j, 1, pt(m(u) ? "" : "disabled")), te(W, 1, pt(m(u) ? "" : "disabled")), te(he, 1, pt(m(u) ? "" : "disabled"));
  }), Y("click", _, O), Y("keydown", _, O), St("blur", L, M), Y("change", P, y), Y("click", P, (q) => {
    q.target.value = null;
  }), Y("click", A, function(...q) {
    bl == null ? void 0 : bl.apply(this, q);
  }), Y("keydown", A, w), Y("change", K, v), Y("click", D, g), Y("keydown", D, w), St("blur", $, M), Y("click", J, x), Y("keydown", J, w), Y("click", Z, function(...q) {
    var _a5;
    (_a5 = m(n) ? void 0 : Fp) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", Z, w), Y("click", V, function(...q) {
    var _a5;
    (_a5 = m(l) ? Xo : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", V, w), Y("click", Q, function(...q) {
    var _a5;
    (_a5 = m(l) ? Bs : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", Q, w), Y("click", le, function(...q) {
    var _a5;
    (_a5 = m(l) ? sl : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", le, w), Y("click", de, function(...q) {
    var _a5;
    (_a5 = m(c) ? rs : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", de, w), Y("click", ce, function(...q) {
    var _a5;
    (_a5 = m(l) ? il : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", ce, w), Y("click", j, function(...q) {
    var _a5;
    (_a5 = m(u) ? () => cn(true) : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", j, w), Y("click", W, function(...q) {
    var _a5;
    (_a5 = m(u) ? () => cn(false) : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", W, w), Y("click", he, function(...q) {
    var _a5;
    (_a5 = m(u) ? dl : void 0) == null ? void 0 : _a5.apply(this, q);
  }), Y("keydown", he, w), Y("click", Ee, b), F(e, C), Le();
}
ze(["click", "keydown", "change"]);
const dy = (e) => {
  if (!e || e.dataset.dragInitialized) return;
  e.dataset.dragInitialized = "true";
  const t = e.querySelector(".dragger");
  t && (t.addEventListener("pointerdown", (o) => vy(o, e)), t.addEventListener("pointerup", ki), t.addEventListener("pointerout", ki), t.addEventListener("pointermove", yy));
}, fy = (e, t) => {
  const o = e.querySelector(".collapse-checkbox"), n = e.querySelector(".collapsible");
  o && n && o.addEventListener("click", () => {
    o.checked ? (e.style.minHeight = "20px", e.style.flexGrow = "0", n.style.display = "none") : (e.style.minHeight = "", e.style.flexGrow = "", n.style.display = "flex");
  });
};
function py() {
  const e = r.ui.dragTarget.parentElement, t = e.children;
  let o = Array.from(t);
  o.sort((s, a) => {
    let l = window.getComputedStyle(s), c = window.getComputedStyle(a), u = parseInt(l.order, 10) || 0, d = parseInt(c.order, 10) || 0;
    return u - d;
  });
  let n = 0;
  r.ui.dragTarget.className.includes("dialog-box") && (n = 2);
  for (let s = 0; s < o.length; s++) {
    let a = {}, l = o[s].getBoundingClientRect();
    a.height = l.height, a.top = o[s].offsetTop - n, a.element = o[s], r.ui.dragSiblings.push(a);
  }
  e.style.height = e.offsetHeight + "px", e.style.background = "white";
  for (let s = 0; s < r.ui.dragSiblings.length; s++) r.ui.dragSiblings[s].element.style.position = "absolute", r.ui.dragSiblings[s].element.style.top = r.ui.dragSiblings[s].top + "px", r.ui.dragSiblings[s].element.style.height = r.ui.dragSiblings[s].height + "px";
}
function hy(e) {
  let t = 0;
  for (let n = 0; n < r.ui.dragSiblings.length; n++) r.ui.dragSiblings[n].element === r.ui.dragTarget && (t = n);
  let o = 0;
  r.ui.dragTarget.className.includes("dialog-box") && (o = 2);
  for (let n = 0; n < r.ui.dragSiblings.length; n++) if (r.ui.dragSiblings[n].element !== r.ui.dragTarget) {
    let s = e.clientY - r.ui.dragY;
    if (s > r.ui.dragSiblings[n].top - 10 && s < r.ui.dragSiblings[n].top + 10) {
      let l = r.ui.dragSiblings[t];
      r.ui.dragSiblings.splice(t, 1), r.ui.dragSiblings.splice(n, 0, l);
      let c = 0;
      for (let u = 0; u < r.ui.dragSiblings.length; u++) r.ui.dragSiblings[u].element.style.order = u + 1, r.ui.dragSiblings[u].element !== r.ui.dragTarget && (r.ui.dragSiblings[u].element.style.top = c + "px", r.ui.dragSiblings[u].top = c), c += r.ui.dragSiblings[u].height + 2 * o;
      break;
    }
  }
}
const vy = (e, t) => {
  t.className.includes("locked") || (e.target.setPointerCapture(e.pointerId), r.ui.dragging = true, r.ui.dragTarget = t, r.ui.dragTarget && (r.ui.dragTarget.classList.add("dragging"), r.ui.dragX = e.clientX - r.ui.dragTarget.offsetLeft, r.ui.dragY = e.clientY - r.ui.dragTarget.offsetTop, r.ui.dragTarget.className.includes("h-drag") || py()));
}, ki = () => {
  if (r.ui.dragging = false, r.ui.dragTarget) {
    if (r.ui.dragTarget.classList.remove("dragging"), !r.ui.dragTarget.className.includes("free")) {
      const e = r.ui.dragTarget.parentElement;
      if (!r.ui.dragTarget.className.includes("h-drag")) {
        const t = e.children;
        let o = Array.from(t);
        o.sort((n, s) => {
          let a = window.getComputedStyle(n), l = window.getComputedStyle(s), c = parseInt(a.order, 10) || 0, u = parseInt(l.order, 10) || 0;
          return c - u;
        }), e.style.background = "";
        for (let n = 0; n < o.length; n++) o[n] !== r.ui.dragTarget && (o[n].style.zIndex = "", o[n].style.top = "", o[n].style.height = "", o[n].style.position = "relative");
      }
      r.ui.dragTarget.style.top = "", r.ui.dragTarget.style.height = "", r.ui.dragTarget.style.maxHeight = "", r.ui.dragTarget.style.position = "relative", e.style.height = "";
    }
    r.ui.dragSiblings = [], r.ui.dragTarget = null;
  }
}, yy = (e) => {
  if (r.ui.dragTarget) {
    const t = r.ui.dragTarget.parentElement;
    r.ui.dragTarget.className.includes("h-drag") || (hy(e), r.ui.dragTarget.style.maxHeight = r.ui.dragTarget.offsetHeight + "px"), r.ui.dragTarget.style.position = "absolute", r.ui.dragTarget.className.includes("h-drag") && (r.ui.dragTarget.style.left = Math.round(e.clientX - r.ui.dragX) + "px"), r.ui.dragTarget.className.includes("v-drag") && (r.ui.dragTarget.style.top = Math.round(e.clientY - r.ui.dragY) + "px");
    let o = t, n = o.getBoundingClientRect();
    for (; o.parentElement && n.width === 0 && n.height === 0; ) o = o.parentElement, n = o.getBoundingClientRect();
    let s = r.ui.dragTarget.getBoundingClientRect(), a = 0;
    r.ui.dragTarget.className.includes("dialog-box") && (a = 2), r.ui.dragTarget.className.includes("h-drag") && (s.left - a < n.left && (r.ui.dragTarget.style.left = "0px"), s.right + a > n.right && (r.ui.dragTarget.style.left = n.width - s.width - 2 * a + "px")), r.ui.dragTarget.className.includes("v-drag") && (s.top - a < n.top && (r.ui.dragTarget.style.top = "0px"), s.bottom + a > n.bottom && (r.ui.dragTarget.style.top = n.height - s.height - 2 * a + "px"));
  }
};
var my = re('<button type="button" class="close-btn" aria-label="Close" data-tooltip="Close"></button>'), gy = re('<label class="collapse-btn" data-tooltip="Collapse/ Expand"><input type="checkbox" aria-label="Collapse or Expand" class="collapse-checkbox"/> <span class="arrow"></span></label>'), by = re('<div><div class="header dragger"><div><div class="grip"></div></div> <!></div> <div class="collapsible"><!></div></div>');
function it(e, t) {
  Oe(t, true);
  let o = Ue(t, "class", 3, ""), n = Ue(t, "style", 3, void 0), s = Ue(t, "collapsible", 3, false), a = Ue(t, "onclose", 3, null), l = Ue(t, "locked", 3, false), c = Ue(t, "ref", 15, null);
  ur(() => {
    if (c()) return dy(c()), s() && fy(c()), () => {
      var _a5;
      (_a5 = c()) == null ? true : delete _a5.dataset.dragInitialized;
    };
  });
  var u = by(), d = z(u), f = z(d), p = X(f), h = X(p);
  {
    var y = (b) => {
      var O = my();
      Y("click", O, function(...M) {
        var _a5;
        (_a5 = a()) == null ? void 0 : _a5.apply(this, M);
      }), F(b, O);
    }, v = (b) => {
      var O = gy();
      F(b, O);
    };
    rt(h, (b) => {
      a() ? b(y) : s() && b(v, 1);
    });
  }
  var g = X(d, 2), x = z(g);
  ma(x, () => t.children ?? Ti), Ye(u, (b) => c(b), () => c()), pe(() => {
    te(u, 1, `dialog-box ${o() ?? ""}`), qt(u, n()), te(f, 1, `drag-btn${l() ? " locked" : ""}`), Fe(p, ` ${t.title ?? ""} `);
  }), F(e, u), Le();
}
ze(["click"]);
var xy = re('<button type="button"></button>'), Sy = re('<div class="tool-group-popout"></div>'), Cy = re('<div><button type="button"></button> <!></div>'), wy = re('<button type="button"></button>'), My = re('<button type="button"></button>'), ky = re('<div class="btn-pair"><button type="button" class="tool undo custom-shape" id="undo" aria-label="Undo (Cmd + Z)" data-tooltip="Undo (Cmd + Z)"></button> <button type="button" class="tool redo custom-shape" id="redo" aria-label="Redo (Cmd + Shift + Z)" data-tooltip="Redo (Cmd + Shift + Z)"></button></div> <div class="btn-pair"><button type="button" class="tool recenter custom-shape" aria-label="Recenter Canvas" data-tooltip="Recenter Canvas"></button> <button type="button" aria-label="Clear Canvas" data-tooltip="Clear Canvas"></button></div> <div class="zoom btn-pair"><button type="button" id="minus" class="zoombtn minus" aria-label="Zoom Out (Mouse Wheel)" data-tooltip="Zoom Out (Mouse Wheel)"></button> <button type="button" id="plus" class="zoombtn plus" aria-label="Zoom In (Mouse Wheel)" data-tooltip="Zoom In (Mouse Wheel)"></button></div> <div class="tools"><h4>Tools</h4> <div class="columns"><div class="column"></div> <div class="column"></div></div></div>', 1);
function Py(e, t) {
  Oe(t, true);
  const o = ["brush", "fill", "curve", "shapeTools", "selectionTools"], n = ["eyedropper", "grab", "move"];
  let s = se(null);
  const a = R(() => r.tool.selectedName), l = R(() => !!i.pastedLayer);
  let c = Me(Object.fromEntries(Object.entries(hr).map(([M, w]) => [M, w.activeTool])));
  Xt(() => {
    for (const [M, w] of Object.entries(hr)) if (w.tools.includes(m(a))) {
      c[M] = m(a);
      break;
    }
  });
  function u() {
    ll(), oe.modes.buildUpDither && Fr();
  }
  function d() {
    cl(), oe.modes.buildUpDither && Fr();
  }
  function f() {
    Uv();
  }
  function p() {
    i.pastedLayer || (i.currentLayer.ctx.clearRect(0, 0, i.offScreenCVS.width, i.offScreenCVS.height), r.selection.pointsSet = null, r.selection.seenPixelsSet = null, r.timeline.clearPoints(), S.reset(), r.reset(), Ch(i.currentLayer), r.clearRedoStack(), U(i.currentLayer));
  }
  function h(M) {
    const w = M.target.closest(".zoombtn");
    if (!w) return;
    let C = Mt.findIndex((G) => G >= i.zoom);
    C === -1 && (C = Mt.length - 1);
    const k = w.id === "minus" ? C - 1 : C + 1;
    if (k < 0 || k >= Mt.length) return;
    const _ = Mt[k], L = _ / i.zoom, E = (i.xOffset + i.offScreenCVS.width / 2) / L, I = (i.yOffset + i.offScreenCVS.height / 2) / L, P = E - i.offScreenCVS.width / 2, A = I - i.offScreenCVS.height / 2;
    xl(_, P, A);
  }
  function y(M) {
    for (const [, w] of Object.entries(hr)) if (w.tools.includes(M)) {
      w.activeTool = M;
      break;
    }
    De(M), N(s, null);
  }
  function v(M) {
    const w = hr[M];
    De(w.activeTool), N(s, m(s) === M ? null : M, true);
  }
  const g = { brush: "Brush (B)", fill: "Fill (F)", curve: "Curve (V)", eyedropper: "Eyedropper (Hold Alt)", grab: "Grab (Hold Space)", move: "Move" }, x = { ...g }, b = { shapeTools: "Shapes", selectionTools: "Select (S)" }, O = { ellipse: { label: "Ellipse (O) Hold Shift to maintain circle", tooltip: `Ellipse (O)

Hold Shift to maintain circle` }, polygon: { label: "Polygon (P) Hold Shift to maintain square", tooltip: `Polygon (P)

Hold Shift to maintain square` }, select: { label: "Select (S)", tooltip: "Select (S)" }, magicWand: { label: "Magic Wand (W)", tooltip: "Magic Wand (W)" } };
  it(e, { title: "Toolbox", class: "toolbox h-drag free locked", collapsible: true, locked: true, children: (M, w) => {
    var C = ky(), k = Ve(C), _ = z(k), L = X(_, 2), E = X(k, 2), I = z(E), P = X(I, 2), A = X(E, 2), G = z(A), K = X(G, 2), D = X(A, 2), $ = X(z(D), 2), H = z($);
    Je(H, 20, () => o, (Z) => Z, (Z, V) => {
      var Q = yo(), le = Ve(Q);
      {
        var de = (j) => {
          const W = R(() => hr[V]), he = R(() => c[V]), me = R(() => m(W).tools.includes(m(a))), be = R(() => m(me) ? m(a) : m(he)), ke = R(() => m(s) === V);
          var _e5 = Cy(), Xe = z(_e5), Ee = X(Xe, 2);
          {
            var q = (we) => {
              var ye = Sy();
              Je(ye, 20, () => m(W).tools, (Qe) => Qe, (Qe, Ke) => {
                const at = R(() => O[Ke] ?? { label: Ke, tooltip: Ke });
                var et = xy();
                pe(() => {
                  te(et, 1, `tool ${Ke ?? ""}${m(a) === Ke ? " selected" : ""}`), ee(et, "id", Ke), ee(et, "aria-label", m(at).label), ee(et, "data-tooltip", m(at).tooltip);
                }), Y("click", et, () => y(Ke)), F(Qe, et);
              }), F(we, ye);
            };
            rt(Ee, (we) => {
              m(ke) && we(q);
            });
          }
          pe(() => {
            te(_e5, 1, `tool-group${m(ke) ? " open" : ""}`), ee(_e5, "data-group", V), te(Xe, 1, `tool-group-btn ${m(be) ?? ""}${m(me) ? " selected" : ""}`), ee(Xe, "data-group", V), ee(Xe, "aria-label", b[V] ?? V), ee(Xe, "data-tooltip", b[V] ?? V);
          }), Y("click", Xe, () => v(V)), F(j, _e5);
        }, ce = (j) => {
          var W = wy();
          pe(() => {
            te(W, 1, `tool ${V ?? ""}${m(a) === V ? " selected" : ""}`), ee(W, "id", V), ee(W, "aria-label", g[V] ?? V), ee(W, "data-tooltip", x[V] ?? V);
          }), Y("click", W, () => y(V)), F(j, W);
        };
        rt(le, (j) => {
          hr[V] ? j(de) : j(ce, -1);
        });
      }
      F(Z, Q);
    });
    var J = X(H, 2);
    Je(J, 20, () => n, (Z) => Z, (Z, V) => {
      var Q = My();
      pe(() => {
        te(Q, 1, `tool ${V ?? ""}${m(a) === V ? " selected" : ""}`), ee(Q, "id", V), ee(Q, "aria-label", g[V] ?? V), ee(Q, "data-tooltip", x[V] ?? V);
      }), Y("click", Q, () => y(V)), F(Z, Q);
    }), pe(() => te(P, 1, `tool clear custom-shape${m(l) ? " disabled" : ""}`)), Y("click", _, u), Y("click", L, d), Y("click", I, f), Y("click", P, p), Y("click", G, h), Y("click", K, h), F(M, C);
  }, $$slots: { default: true } }), Le();
}
ze(["click"]);
lc();
const Dt = Me({ ditherVectorTarget: null }), ut = 32, qe = 10, _y = "#333333", Ge = /* @__PURE__ */ new Map();
let qo = false, Er = "draw", An = "draw", Rn = 0, Kn = 0;
const Oy = () => [T.stampDrawBtn, T.stampEraseBtn, T.stampMoveBtn];
function eo() {
  const e = T.stampEditorCanvas;
  if (!e) return;
  const t = e.getContext("2d");
  t.clearRect(0, 0, e.width, e.height);
  for (const [o, n] of Ge) {
    const [s, a] = o.split(",").map(Number);
    t.fillStyle = n, t.fillRect(s * qe, a * qe, qe, qe);
  }
  t.strokeStyle = _y, t.lineWidth = 0.5;
  for (let o = 0; o <= ut; o++) t.beginPath(), t.moveTo(o * qe, 0), t.lineTo(o * qe, ut * qe), t.stroke(), t.beginPath(), t.moveTo(0, o * qe), t.lineTo(ut * qe, o * qe), t.stroke();
}
function to() {
  const e = T.stampPreviewCanvas;
  if (!e) return;
  const t = e.getContext("2d");
  t.clearRect(0, 0, e.width, e.height);
  for (const [o, n] of Ge) {
    const [s, a] = o.split(",").map(Number);
    t.fillStyle = n, t.fillRect(s, a, 1, 1);
  }
}
function Pi(e, t, o) {
  const n = Math.floor(e / qe), s = Math.floor(t / qe);
  if (n < 0 || n >= ut || s < 0 || s >= ut) return;
  const a = `${n},${s}`;
  o === "erase" ? Ge.delete(a) : Ge.set(a, B.primary.color.color), eo(), to();
}
function Ly(e, t) {
  if (e === 0 && t === 0) return;
  const o = /* @__PURE__ */ new Map();
  for (const [n, s] of Ge) {
    const [a, l] = n.split(",").map(Number), c = ((a + e) % ut + ut) % ut, u = ((l + t) % ut + ut) % ut;
    o.set(`${c},${u}`, s);
  }
  Ge.clear();
  for (const [n, s] of o) Ge.set(n, s);
  eo(), to();
}
function Ty() {
  const e = /* @__PURE__ */ new Map();
  for (const [t, o] of Ge) {
    const [n, s] = t.split(",").map(Number);
    e.set(`${ut - 1 - n},${s}`, o);
  }
  Ge.clear();
  for (const [t, o] of e) Ge.set(t, o);
  eo(), to();
}
function Iy() {
  const e = /* @__PURE__ */ new Map();
  for (const [t, o] of Ge) {
    const [n, s] = t.split(",").map(Number);
    e.set(`${n},${ut - 1 - s}`, o);
  }
  Ge.clear();
  for (const [t, o] of e) Ge.set(t, o);
  eo(), to();
}
function _i(e) {
  const t = T.stampEditorCanvas.getBoundingClientRect(), o = T.stampEditorCanvas.width / t.width, n = T.stampEditorCanvas.height / t.height;
  return { ex: (e.clientX - t.left) * o, ey: (e.clientY - t.top) * n };
}
function en(e, t) {
  Er = t;
  for (const o of Oy()) o == null ? void 0 : o.classList.remove("selected");
  e == null ? void 0 : e.classList.add("selected"), T.stampEditorCanvas.style.cursor = t === "move" ? "grab" : "crosshair";
}
function Xy() {
  en(T.stampDrawBtn, "draw"), Ge.clear();
  for (const [e, t] of mr.colorMap) Ge.set(e, t);
  r.ui.stampEditorOpen = true, eo(), to();
}
function Ey() {
  lr.pixels = [], mr.pixelSet = /* @__PURE__ */ new Set(), mr.colorMap = /* @__PURE__ */ new Map();
  for (const [e, t] of Ge) {
    const [o, n] = e.split(",").map(Number);
    lr.pixels.push({ x: o, y: n }), mr.pixelSet.add(n << 16 | o), mr.colorMap.set(e, t);
  }
  Ms(), r.ui.stampEditorOpen = false;
}
function By() {
  Ge.clear(), eo(), to();
}
function zy() {
  var _a5, _b2, _c5, _d3, _e5, _f4, _g;
  const e = T.stampEditorCanvas;
  e && (e.addEventListener("pointerdown", (t) => {
    t.preventDefault(), qo = true, e.setPointerCapture(t.pointerId);
    const { ex: o, ey: n } = _i(t);
    Er === "move" ? (Rn = Math.floor(o / qe), Kn = Math.floor(n / qe), e.style.cursor = "grabbing") : (An = t.button === 2 ? "erase" : Er, Pi(o, n, An));
  }), e.addEventListener("pointermove", (t) => {
    if (!qo) return;
    const { ex: o, ey: n } = _i(t);
    if (Er === "move") {
      const s = Math.floor(o / qe), a = Math.floor(n / qe), l = s - Rn, c = a - Kn;
      (l !== 0 || c !== 0) && (Ly(l, c), Rn = s, Kn = a);
    } else Pi(o, n, An);
  }), e.addEventListener("pointerup", () => {
    qo = false, Er === "move" && (e.style.cursor = "grab");
  }), e.addEventListener("pointercancel", () => {
    qo = false, Er === "move" && (e.style.cursor = "grab");
  }), e.addEventListener("contextmenu", (t) => t.preventDefault()), (_a5 = T.stampDrawBtn) == null ? void 0 : _a5.addEventListener("click", () => en(T.stampDrawBtn, "draw")), (_b2 = T.stampEraseBtn) == null ? void 0 : _b2.addEventListener("click", () => en(T.stampEraseBtn, "erase")), (_c5 = T.stampMoveBtn) == null ? void 0 : _c5.addEventListener("click", () => en(T.stampMoveBtn, "move")), (_d3 = T.stampMirrorHBtn) == null ? void 0 : _d3.addEventListener("click", Ty), (_e5 = T.stampMirrorVBtn) == null ? void 0 : _e5.addEventListener("click", Iy), (_f4 = T.stampEditorApplyBtn) == null ? void 0 : _f4.addEventListener("click", Ey), (_g = T.stampEditorClearBtn) == null ? void 0 : _g.addEventListener("click", By));
}
var Yy = re('<button type="button" class="dither-preview btn" data-tooltip="Click to select dither pattern"></button>');
function Ay(e, t) {
  Oe(t, true);
  const o = R(() => {
    var _a5;
    const s = Ze[t.tool.ditherPatternIndex ?? 63], a = t.tool.ditherOffsetX ?? 0, l = t.tool.ditherOffsetY ?? 0, c = ((_a5 = t.tool.modes) == null ? void 0 : _a5.twoColor) ?? false, u = an(s, a, l);
    if (c) {
      const d = u.querySelector(".dither-bg-rect");
      d && d.setAttribute("fill", B.secondary.color.color);
    }
    return new XMLSerializer().serializeToString(u);
  });
  var n = Yy();
  Ss(n, () => m(o), true), Y("click", n, function(...s) {
    var _a5;
    (_a5 = t.onclick) == null ? void 0 : _a5.apply(this, s);
  }), F(e, n), Le();
}
ze(["click"]);
var Ry = Vc('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges" style="display:block;width:64px;height:64px"><path fill="rgba(255,255,255,255)"></path></svg>'), Ky = re('<div class="brush-preview btn" role="button" tabindex="0" data-tooltip="Click to switch brush"><!></div> <div class="brush-size"><span id="line-weight"> </span></div> <input type="range" class="slider" id="brush-size" min="1" max="32"/>', 1), Dy = re('<button type="button"></button>'), Vy = re('<div class="stamp-options"><span class="modes-title">Stamp</span> <div class="stamp-type-row"><button type="button" id="custom-brush-type-btn" aria-label="Custom Stamp" data-tooltip="Custom Stamp"></button></div></div>'), $y = re('<div class="dither-options"><span class="modes-title">Dither</span> <!></div>'), Gy = re('<!> <span class="modes-title">Modes</span> <div class="modes-container"></div> <div class="stamp-dither-row"><!> <!></div>', 1);
function qy(e, t) {
  Oe(t, true);
  const o = ["eyedropper", "grab", "move", "select", "magicWand", "fill"], n = ["brush", "curve", "ellipse", "polygon"], s = ["brush"], a = ["brush", "curve", "ellipse", "polygon"], l = { line: { cls: "line", label: "Line", tools: ["curve"] }, quadCurve: { cls: "quadCurve", label: "Quadratic Curve", tools: ["curve"] }, cubicCurve: { cls: "cubicCurve", label: "Cubic Curve", tools: ["curve"] }, eraser: { cls: "eraser", label: "Eraser (E)", tools: ["brush", "curve", "ellipse", "polygon"] }, inject: { cls: "inject", label: "Inject (I)", tools: ["brush", "curve", "ellipse", "polygon"] }, perfect: { cls: "perfect", label: "Pixel Perfect (Y)", tools: ["brush"] }, colorMask: { cls: "colorMask", label: "Color Mask (M)", tools: ["brush"] } }, c = R(() => r.tool.current), u = R(() => {
    var _a5;
    return ((_a5 = m(c)) == null ? void 0 : _a5.name) ?? "";
  }), d = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.brushSize) ?? 1;
  }), f = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.brushType) ?? "circle";
  }), p = R(() => !o.includes(m(u))), h = R(() => a.includes(m(u))), y = R(() => s.includes(m(u))), v = R(() => n.includes(m(u))), g = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.brushDisabled) ?? false;
  }), x = R(() => m(f) === "custom"), b = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.modes) ?? {};
  });
  function O(I) {
    var _a5, _b2;
    if (!I) return null;
    const P = I.brushType ?? "circle", A = I.brushSize ?? 1, K = ((_b2 = (_a5 = gt[P]) == null ? void 0 : _a5[A]) == null ? void 0 : _b2["0,0"]) ?? (P === "custom" ? lr.pixels : null);
    if (!K || K.length === 0) return null;
    const D = 2;
    let $, H, J, Z;
    if (P === "custom") {
      $ = Math.min(...K.map((j) => j.x)), H = Math.min(...K.map((j) => j.y));
      const de = Math.max(...K.map((j) => j.x)), ce = Math.max(...K.map((j) => j.y));
      J = de - $ + 1, Z = ce - H + 1;
    } else $ = 0, H = 0, J = A, Z = A;
    const V = (64 - J * D) / 2, Q = (64 - Z * D) / 2;
    let le = "";
    for (const de of K) {
      const ce = V + (de.x - $) * D, j = Q + (de.y - H) * D;
      le += `M${ce} ${j}h${D}v${D}h${-D}z`;
    }
    return le;
  }
  const M = R(() => O(r.tool.current));
  function w(I, P) {
    m(c)[I] = P;
    const A = ie[r.tool.selectedName];
    A && (A[I] = P);
  }
  function C() {
    const I = m(c).brushType;
    I === "circle" ? w("brushType", "square") : I === "square" ? w("brushType", lr.pixels.length === 0 ? "circle" : "custom") : w("brushType", "circle");
  }
  function k(I) {
    w("brushSize", parseInt(I.target.value));
  }
  function _(I) {
    var _a5, _b2;
    Jt(I), I === "buildUpDither" && !((_b2 = (_a5 = r.tool.current) == null ? void 0 : _a5.modes) == null ? void 0 : _b2.buildUpDither) && Fr();
  }
  function L() {
    w("brushType", "custom"), r.ui.stampEditorOpen ? r.ui.stampEditorOpen = false : Xy();
  }
  function E() {
    r.ui.ditherPickerOpen ? r.ui.ditherPickerOpen = false : (Dt.ditherVectorTarget = null, r.ui.ditherPickerOpen = true);
  }
  it(e, { title: "Brush", class: "brush-container draggable v-drag settings-box smooth-shift", collapsible: true, children: (I, P) => {
    var A = yo(), G = Ve(A);
    {
      var K = (D) => {
        var $ = Gy(), H = Ve($);
        {
          var J = (j) => {
            var W = Ky(), he = Ve(W), me = z(he);
            {
              var be = (q) => {
                var we = Ry(), ye = z(we);
                pe(() => ee(ye, "d", m(M))), F(q, we);
              };
              rt(me, (q) => {
                m(M) && q(be);
              });
            }
            var ke = X(he, 2), _e5 = z(ke), Xe = z(_e5), Ee = X(ke, 2);
            pe(() => {
              Fe(Xe, `${(m(x) ? 32 : m(d)) ?? ""}px`), kr(Ee, m(x) ? 32 : m(d)), Ee.disabled = m(g) || m(x);
            }), Y("click", he, C), Y("keydown", he, (q) => {
              (q.key === "Enter" || q.key === " ") && C();
            }), Y("input", Ee, k), F(j, W);
          };
          rt(H, (j) => {
            m(h) && j(J);
          });
        }
        var Z = X(H, 4);
        Je(Z, 21, () => Object.entries(l), ([j, W]) => j, (j, W) => {
          var he = R(() => ls(m(W), 2));
          let me = () => m(he)[0], be = () => m(he)[1];
          var ke = yo(), _e5 = Ve(ke);
          {
            var Xe = (q) => {
              const we = R(() => m(b)[me()] ?? false);
              var ye = Dy();
              pe(() => {
                ee(ye, "id", me()), te(ye, 1, `mode ${be().cls ?? ""}${m(we) ? " selected" : ""}`), ee(ye, "aria-label", be().label), ee(ye, "data-tooltip", be().label);
              }), Y("click", ye, () => _(me())), F(q, ye);
            }, Ee = R(() => be().tools.includes(m(u)));
            rt(_e5, (q) => {
              m(Ee) && q(Xe);
            });
          }
          F(j, ke);
        });
        var V = X(Z, 2), Q = z(V);
        {
          var le = (j) => {
            var W = Vy(), he = X(z(W), 2), me = z(he);
            pe(() => te(me, 1, `mode stamp${m(x) ? " active" : ""}`)), Y("click", me, L), F(j, W);
          };
          rt(Q, (j) => {
            m(y) && j(le);
          });
        }
        var de = X(Q, 2);
        {
          var ce = (j) => {
            var W = $y(), he = X(z(W), 2);
            Ay(he, { get tool() {
              return m(c);
            }, onclick: E }), F(j, W);
          };
          rt(de, (j) => {
            m(v) && m(c) && j(ce);
          });
        }
        F(D, $);
      };
      rt(G, (D) => {
        m(p) && D(K);
      });
    }
    F(I, A);
  }, $$slots: { default: true } }), Le();
}
ze(["click", "keydown", "input"]);
var Uy = re('<li role="option"> </li>'), Hy = re('<li role="option"> </li>'), Ny = re('<button type="button"><div class="swatch"></div></button>'), Wy = re('<div class="colors"><div class="primary swatch btn" role="button" tabindex="0" data-tooltip="Primary Swatch  (R) to randomize  Click to open Color Picker"><div class="swatch-color"></div></div> <div class="secondary back-swatch btn" role="button" tabindex="0" data-tooltip="Secondary Swatch  Click to open Color Picker"><div class="swatch-color"></div></div></div> <button type="button" class="switch color-switch custom-shape" id="color-switch" aria-label="Switch primary/ secondary colors" data-tooltip="Switch primary/ secondary colors"></button> <div class="palette-container"><div class="palette-tools"><button type="button" aria-label="Edit Palette Color (Hold K)" data-tooltip="Edit Palette Color (Hold K)"></button> <button type="button" aria-label="Remove Palette Color (Hold X)" data-tooltip="Remove Palette Color (Hold X)"></button></div> <div><button type="button" class="palette-presets-btn" aria-label="Palette Presets" data-tooltip="Palette Presets"> </button> <ul class="palette-presets-list" role="listbox"><!> <!></ul></div> <div class="palette-colors"><!> <button type="button" class="add-color plus" aria-label="Add Color" data-tooltip="Add current primary color to palette"></button></div></div>', 1);
function jy(e, t) {
  Oe(t, true);
  let o = se(null), n = se(null), s = se(false);
  const a = R(() => [...B.palette]), l = R(() => B.paletteMode), c = R(() => B.currentPreset), u = R(() => ({ ...B.customPalettes })), d = R(() => {
    var _a5, _b2;
    return m(c) in co ? ((_a5 = Jo.find((C) => C.id === m(c))) == null ? void 0 : _a5.label) ?? m(c) : ((_b2 = m(u)[m(c)]) == null ? void 0 : _b2.label) ?? m(c);
  }), f = R(() => B.selectedPaletteIndex);
  ur(() => {
    m(o) && (m(o).color = B.primary.color, B.primary.swatch = m(o)), m(n) && (m(n).color = B.secondary.color, B.secondary.swatch = m(n));
  }), Xt(() => {
    if (!m(s)) return;
    function C() {
      N(s, false);
    }
    return document.addEventListener("click", C), () => document.removeEventListener("click", C);
  });
  function p() {
    var _a5;
    const C = B.currentPreset;
    if (C in co) {
      const k = ((_a5 = Jo.find((P) => P.id === C)) == null ? void 0 : _a5.label) ?? C, L = Object.keys(B.customPalettes).filter((P) => P.startsWith(`custom_${C}_`)).length + 1, E = `custom_${C}_${L}`, I = L === 1 ? `Custom (${k})` : `Custom (${k}) ${L}`;
      B.customPalettes[E] = { label: I, colors: B.palette.map((P) => ({ ...P })) }, B.currentPreset = E;
    } else C in B.customPalettes && (B.customPalettes[C].colors = B.palette.map((k) => ({ ...k })));
  }
  function h(C) {
    C.stopPropagation(), Zt(B.primary.swatch);
  }
  function y(C) {
    C.stopPropagation(), Zt(B.secondary.swatch);
  }
  function v(C) {
    C.stopPropagation();
    const k = { ...B.primary.color };
    B.primary.color = B.secondary.color, B.primary.swatch && (B.primary.swatch.color = B.secondary.color), document.documentElement.style.setProperty("--primary-swatch-color", `${B.primary.color.r},${B.primary.color.g},${B.primary.color.b}`), document.documentElement.style.setProperty("--primary-swatch-alpha", `${B.primary.color.a / 255}`), B.secondary.color = k, B.secondary.swatch && (B.secondary.swatch.color = k), document.documentElement.style.setProperty("--secondary-swatch-color", `${k.r},${k.g},${k.b}`), document.documentElement.style.setProperty("--secondary-swatch-alpha", `${k.a / 255}`);
  }
  function g() {
    B.paletteMode = B.paletteMode === "edit" ? "select" : "edit";
  }
  function x() {
    B.paletteMode = B.paletteMode === "remove" ? "select" : "remove";
  }
  function b(C) {
    C.stopPropagation(), N(s, !m(s));
  }
  function O(C) {
    if (C in co) B.palette = co[C].map((k) => ({ ...k }));
    else if (C in B.customPalettes) B.palette = B.customPalettes[C].colors.map((k) => ({ ...k }));
    else return;
    B.currentPreset = C, N(s, false);
  }
  function M(C, k) {
    if (B.paletteMode === "edit") B.activePaletteIndex = k, Zt({ color: C });
    else if (B.paletteMode === "remove") B.palette.splice(k, 1), p(), B.paletteMode = "select";
    else if (k === B.selectedPaletteIndex) B.activePaletteIndex = k, Zt({ color: C });
    else {
      const { r: _, g: L, b: E, a: I } = C;
      document.documentElement.style.setProperty("--primary-swatch-color", `${_},${L},${E}`), document.documentElement.style.setProperty("--primary-swatch-alpha", `${I / 255}`), B.primary.color = C, B.primary.swatch && (B.primary.swatch.color = C), B.selectedPaletteIndex = k;
    }
  }
  function w(C) {
    C.stopPropagation(), B.activePaletteIndex = B.palette.length, Zt({ color: B.primary.color });
  }
  {
    let C = R(() => m(s) ? "z-index: 201" : void 0);
    it(e, { title: "Palette", class: "palette-interface draggable v-drag settings-box smooth-shift", get style() {
      return m(C);
    }, collapsible: true, children: (k, _) => {
      var L = Wy(), E = Ve(L), I = z(E);
      Ye(I, (W) => N(o, W), () => m(o));
      var P = X(I, 2);
      Ye(P, (W) => N(n, W), () => m(n));
      var A = X(E, 2), G = X(A, 2), K = z(G), D = z(K), $ = X(D, 2), H = X(K, 2), J = z(H), Z = z(J), V = X(J, 2), Q = z(V);
      Je(Q, 17, () => Jo, (W) => W.id, (W, he) => {
        var me = Uy(), be = z(me);
        pe(() => {
          ee(me, "aria-selected", m(c) === m(he).id), ee(me, "data-id", m(he).id), te(me, 1, pt(m(c) === m(he).id ? "selected" : "")), Fe(be, m(he).label);
        }), Y("click", me, (ke) => {
          ke.stopPropagation(), O(m(he).id);
        }), Y("keydown", me, (ke) => {
          (ke.key === "Enter" || ke.key === " ") && (ke.stopPropagation(), O(m(he).id));
        }), F(W, me);
      });
      var le = X(Q, 2);
      Je(le, 17, () => Object.entries(m(u)), ([W, he]) => W, (W, he) => {
        var me = R(() => ls(m(he), 2));
        let be = () => m(me)[0], ke = () => m(me)[1];
        var _e5 = Hy(), Xe = z(_e5);
        pe(() => {
          ee(_e5, "aria-selected", m(c) === be()), ee(_e5, "data-id", be()), te(_e5, 1, pt(m(c) === be() ? "selected" : "")), Fe(Xe, ke().label);
        }), Y("click", _e5, (Ee) => {
          Ee.stopPropagation(), O(be());
        }), Y("keydown", _e5, (Ee) => {
          (Ee.key === "Enter" || Ee.key === " ") && (Ee.stopPropagation(), O(be()));
        }), F(W, _e5);
      });
      var de = X(H, 2), ce = z(de);
      Je(ce, 17, () => m(a), jn, (W, he, me) => {
        var be = Ny();
        ee(be, "aria-label", `Color ${me + 1}`);
        var ke = z(be);
        pe(() => {
          te(be, 1, `palette-color${me === m(f) ? " selected" : ""}`), ee(be, "data-tooltip", m(he).color), qt(ke, `background-color: ${m(he).color ?? ""}; width: 100%; height: 100%`);
        }), Y("click", be, () => M(m(he), me)), F(W, be);
      });
      var j = X(ce, 2);
      pe(() => {
        te(D, 1, `palette-edit${m(l) === "edit" ? " selected" : ""}`), te($, 1, `palette-remove${m(l) === "remove" ? " selected" : ""}`), te(H, 1, `palette-presets${m(s) ? " open" : ""}`), Fe(Z, m(d));
      }), Y("click", I, h), Y("keydown", I, (W) => {
        (W.key === "Enter" || W.key === " ") && h(W);
      }), Y("click", P, y), Y("keydown", P, (W) => {
        (W.key === "Enter" || W.key === " ") && y(W);
      }), Y("click", A, v), Y("click", D, g), Y("click", $, x), Y("click", J, b), Y("click", j, w), F(k, L);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["click", "keydown"]);
var Fy = re('<div><div class="header"><div class="drag-btn locked"><div class="grip"></div></div> <button type="button" class="close-btn" aria-label="Close" data-tooltip="Close"></button></div> <!></div>');
function Cl(e, t) {
  Oe(t, true);
  let o = Ue(t, "class", 3, ""), n = Ue(t, "excludeClasses", 19, () => []), s = Ue(t, "excludeSelectors", 19, () => []), a = se(null);
  ur(() => {
    function p(h) {
      !m(a) || m(a).contains(h.target) || n().some((y) => h.target.classList.contains(y)) || s().some((y) => h.target.closest(y)) || t.onclose();
    }
    return document.addEventListener("pointerdown", p), () => document.removeEventListener("pointerdown", p);
  });
  var l = Fy(), c = z(l), u = X(z(c)), d = X(u), f = X(c, 2);
  ma(f, () => t.children), rn(l, (p, h) => Sl == null ? void 0 : Sl(p, h), () => document.body), Ye(l, (p) => N(a, p), () => m(a)), pe(() => {
    te(l, 1, `${o() ?? ""} dialog-box`), qt(l, `display:flex; position:fixed; top:${t.pos.top ?? ""}px; left:${t.pos.left ?? ""}px; transform:translateY(-50%); z-index:1000`), Fe(u, ` ${t.title ?? ""} `);
  }), Y("click", d, function(...p) {
    var _a5;
    (_a5 = t.onclose) == null ? void 0 : _a5.apply(this, p);
  }), F(e, l), Le();
}
ze(["click"]);
var Jy = re('<div class="layer-name-label"><label for="layer-name" class="input-label">Name</label> <input id="layer-name" type="text" maxlength="12"/></div> <div class="layer-opacity-label"><span class="input-label">Opacity: <span style="display:inline-block;min-width:3ch;text-align:right"> </span></span> <input type="range" class="slider" min="0" max="255"/></div>', 1);
function Zy(e, t) {
  Oe(t, true);
  let o = Ue(t, "layer", 15);
  const n = o().title ?? "";
  let s = se(Me(Math.round((o().opacity ?? 1) * 255)));
  function a(c) {
    o(o().title = c.target.value.slice(0, 12), true), st();
  }
  function l(c) {
    const u = parseInt(c.target.value);
    N(s, u, true), o(o().opacity = u / 255, true), U(o());
  }
  Cl(e, { class: "layer-settings", get pos() {
    return t.pos;
  }, get onclose() {
    return t.onclose;
  }, title: "Layer Settings", excludeClasses: ["gear"], children: (c, u) => {
    var d = Jy(), f = Ve(d), p = X(z(f), 2), h = X(f, 2), y = z(h), v = X(z(y)), g = z(v), x = X(y, 2);
    pe(() => {
      ee(p, "placeholder", n), Fe(g, m(s)), kr(x, m(s));
    }), Y("input", p, a), Y("input", x, l), F(c, d);
  }, $$slots: { default: true } }), Le();
}
ze(["input"]);
var Qy = re('<div role="button" tabindex="0"><button type="button"></button> <span class="layer-title"> </span> <button type="button" aria-label="Layer Settings" data-tooltip="Layer Settings"></button></div>'), em = re('<div class="layers-control"><button type="button" class="add-layer" aria-label="New Layer" data-tooltip="New Layer"></button> <label for="file-upload" aria-label="Add Reference Layer" data-tooltip="Add Reference Layer"></label> <input type="file" id="file-upload" accept="image/*"/> <button type="button" id="delete-layer" class="trash" aria-label="Delete Layer" data-tooltip="Delete Layer"></button></div> <div class="layers-container"><div class="layers"></div></div> <!>', 1);
function tm(e, t) {
  Oe(t, true);
  let o = se(null), n = se(null), s = se(Me({ top: 0, left: 0 })), a = se(null);
  const l = R(() => !!i.pastedLayer), c = R(() => i.layers.filter((M) => !M.removed && !M.isPreview)), u = R(() => {
    var _a5;
    return !m(l) && (i.activeLayerCount > 1 || ((_a5 = i.currentLayer) == null ? void 0 : _a5.type) !== "raster");
  }), d = R(() => i.currentLayer);
  function f() {
    m(l) || ml();
  }
  function p(M) {
    var _a5;
    ((_a5 = M.target.files) == null ? void 0 : _a5[0]) && (Ov.call(m(o)), M.target.value = null);
  }
  function h() {
    if (m(l)) return;
    const M = i.currentLayer;
    Lv(M), U(M);
  }
  function y(M) {
    var _a5, _b2;
    m(l) || M !== i.currentLayer && (i.currentLayer.type === "reference" && r.deselect(), (_a5 = i.currentLayer.inactiveTools) == null ? void 0 : _a5.forEach((w) => {
      T[`${w}Btn`] && (T[`${w}Btn`].disabled = false);
    }), i.currentLayer = M, (_b2 = i.currentLayer.inactiveTools) == null ? void 0 : _b2.forEach((w) => {
      T[`${w}Btn`] && (T[`${w}Btn`].disabled = true);
    }), S.reset(), S.render(), M.type === "reference" && De("move"), st(), U(M));
  }
  function v(M, w) {
    M.stopPropagation(), w.hidden = !w.hidden, U(w);
  }
  function g(M, w) {
    if (M.stopPropagation(), m(n) === w) N(n, null);
    else {
      const C = M.currentTarget.getBoundingClientRect();
      N(s, { top: C.top + C.height / 2, left: C.right + 16 }, true), N(n, w);
    }
  }
  function x(M, w) {
    if (m(l)) {
      M.preventDefault();
      return;
    }
    N(a, i.layers.indexOf(w), true), M.dataTransfer.setData("text", String(m(a)));
  }
  function b(M) {
    M.preventDefault();
  }
  function O(M, w) {
    var _a5, _b2, _c5, _d3;
    M.preventDefault();
    const C = parseInt(M.dataTransfer.getData("text")), k = i.layers[C], _ = i.layers.indexOf(w);
    k !== w && (i.layers.splice(C, 1), i.layers.splice(_, 0, k), (_a5 = T.canvasLayers) == null ? void 0 : _a5.removeChild(k.onscreenCvs), _ >= ((_b2 = T.canvasLayers) == null ? void 0 : _b2.children.length) ? (_c5 = T.canvasLayers) == null ? void 0 : _c5.appendChild(k.onscreenCvs) : (_d3 = T.canvasLayers) == null ? void 0 : _d3.insertBefore(k.onscreenCvs, T.canvasLayers.children[_]), st());
  }
  {
    let M = R(() => m(l) ? " disabled" : "");
    it(e, { title: "Layers", get class() {
      return `layers-interface draggable v-drag settings-box smooth-shift${m(M) ?? ""}`;
    }, collapsible: true, children: (w, C) => {
      var k = em(), _ = Ve(k), L = z(_), E = X(L, 2), I = X(E, 2);
      Ye(I, ($) => N(o, $), () => m(o));
      var P = X(I, 2), A = X(_, 2), G = z(A);
      Je(G, 21, () => m(c), ($) => $.id ?? $.title, ($, H) => {
        const J = R(() => m(H).hidden), Z = R(() => m(H) === m(d)), V = R(() => m(n) === m(H));
        var Q = Qy(), le = z(Q), de = X(le, 2), ce = z(de), j = X(de, 2);
        pe(() => {
          te(Q, 1, `layer ${m(H).type ?? ""}${m(Z) ? " selected" : ""}`), ee(Q, "draggable", !m(l)), te(le, 1, `hide ${m(J) ? "eyeclosed" : "eyeopen"}`), ee(le, "aria-label", m(J) ? "Show Layer" : "Hide Layer"), ee(le, "data-tooltip", m(J) ? "Show Layer" : "Hide Layer"), Fe(ce, m(H).title), te(j, 1, `gear${m(V) ? " active" : ""}`);
        }), St("dragstart", Q, (W) => x(W, m(H))), St("dragover", Q, b), St("drop", Q, (W) => O(W, m(H))), Y("click", Q, () => y(m(H))), Y("keydown", Q, (W) => {
          (W.key === "Enter" || W.key === " ") && y(m(H));
        }), Y("click", le, (W) => v(W, m(H))), Y("click", j, (W) => g(W, m(H))), F($, Q);
      });
      var K = X(A, 2);
      {
        var D = ($) => {
          var H = yo(), J = Ve(H);
          Hc(J, () => m(n), (Z) => {
            Zy(Z, { get pos() {
              return m(s);
            }, onclose: () => {
              N(n, null);
            }, get layer() {
              return m(n);
            }, set layer(V) {
              N(n, V);
            } });
          }), F($, H);
        };
        rt(K, ($) => {
          m(n) && $(D);
        });
      }
      pe(() => {
        L.disabled = m(l), te(E, 1, `reference${m(l) ? " disabled" : ""}`), I.disabled = m(l), P.disabled = !m(u);
      }), Y("click", L, f), Y("change", I, p), Y("click", I, ($) => {
        $.target.value = null;
      }), Y("click", P, h), F(w, k);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["click", "change", "keydown"]);
const rm = (e, t) => {
  var _a5, _b2;
  return !e.removed && !((_a5 = e.layer) == null ? void 0 : _a5.removed) && t.has(e.action) && (e.layer === i.currentLayer || e.layer === i.pastedLayer && ((_b2 = i.currentLayer) == null ? void 0 : _b2.isPreview));
};
function om(e, t) {
  const o = t.ditherOffsetX ?? 0, n = t.ditherOffsetY ?? 0;
  return an(e, o, n);
}
var nm = re("<canvas></canvas>");
function sm(e, t) {
  Oe(t, true);
  let o = se(null);
  Xt(() => {
    var _a5, _b2;
    const s = m(o);
    if (!s) return;
    const a = s.getContext("2d"), l = t.vector.index === r.vector.currentIndex || r.vector.selectedIndices.has(t.vector.index), c = 32, u = i.thumbnailCVS.width / i.sharpness / (i.offScreenCVS.width + c), d = i.thumbnailCVS.height / i.sharpness / (i.offScreenCVS.height + c), f = Math.min(u, d), p = (i.thumbnailCVS.width / 2 - f * i.offScreenCVS.width * i.sharpness / 2) / i.sharpness, h = (i.thumbnailCVS.height / 2 - f * i.offScreenCVS.height * i.sharpness / 2) / i.sharpness;
    a.setTransform(i.sharpness, 0, 0, i.sharpness, 0, 0), a.clearRect(0, 0, i.thumbnailCVS.width, i.thumbnailCVS.height), a.lineWidth = 3, a.fillStyle = l ? "rgb(0, 0, 0)" : "rgb(51, 51, 51)", a.fillRect(0, 0, i.thumbnailCVS.width, i.thumbnailCVS.height), a.clearRect(p, h, f * i.offScreenCVS.width, f * i.offScreenCVS.height), a.strokeStyle = "black", a.beginPath();
    const y = t.vector.vectorProperties, v = (((_a5 = t.vector.layer) == null ? void 0 : _a5.x) ?? 0) + r.canvas.cropOffsetX, g = (((_b2 = t.vector.layer) == null ? void 0 : _b2.y) ?? 0) + r.canvas.cropOffsetY, x = f * (y.px1 + v), b = f * (y.py1 + g), O = f * (y.px2 + v), M = f * (y.py2 + g), w = f * (y.px3 + v), C = f * (y.py3 + g), k = f * (y.px4 + v), _ = f * (y.py4 + g);
    switch (y.tool) {
      case "fill":
        a.arc(x + 0.5 + p, b + 0.5 + h, 1, 0, 2 * Math.PI, true);
        break;
      case "curve": {
        const L = t.vector.modes ?? {};
        a.moveTo(x + 0.5 + p, b + 0.5 + h), L.cubicCurve ? a.bezierCurveTo(w + 0.5 + p, C + 0.5 + h, k + 0.5 + p, _ + 0.5 + h, O + 0.5 + p, M + 0.5 + h) : L.quadCurve ? a.quadraticCurveTo(w + 0.5 + p, C + 0.5 + h, O + 0.5 + p, M + 0.5 + h) : a.lineTo(O + 0.5 + p, M + 0.5 + h);
        break;
      }
      case "ellipse": {
        const L = f * (y.leftTangentX + v) + p, E = f * (y.leftTangentY + g) + h, I = f * (y.rightTangentX + v) + p, P = f * (y.rightTangentY + g) + h, A = f * (y.topTangentX + v) + p, G = f * (y.topTangentY + g) + h, K = f * (y.bottomTangentX + v) + p, D = f * (y.bottomTangentY + g) + h, $ = (L + I) / 2, H = (G + D) / 2, J = Math.sqrt((I - L) ** 2 + (P - E) ** 2) / 2, Z = Math.sqrt((K - A) ** 2 + (D - G) ** 2) / 2, V = Pe(I - L, P - E);
        a.ellipse($, H, J, Z, V, 0, 2 * Math.PI);
        break;
      }
      case "polygon":
        a.moveTo(x + 0.5 + p, b + 0.5 + h), a.lineTo(O + 0.5 + p, M + 0.5 + h), a.lineTo(w + 0.5 + p, C + 0.5 + h), a.lineTo(k + 0.5 + p, _ + 0.5 + h), a.closePath();
        break;
    }
    a.globalCompositeOperation = "xor", a.stroke(), a.globalCompositeOperation = "source-over";
  });
  var n = nm();
  Ye(n, (s) => N(o, s), () => m(o)), pe(() => {
    ee(n, "width", i.thumbnailCVS.width), ee(n, "height", i.thumbnailCVS.height);
  }), F(e, n), Le();
}
var im = re('<button type="button"></button>'), am = re('<div class="vector-settings-modes"></div> <div class="vector-settings-color-row"><span>Primary</span> <button type="button" class="actionColor primary-color" aria-label="Primary Color" data-tooltip="Primary Color"><div class="swatch"></div></button></div> <div class="vector-settings-color-row"><span>Secondary</span> <button type="button" class="actionColor secondary-color" aria-label="Secondary Color" data-tooltip="Secondary Color"><div class="swatch"></div></button></div> <div class="vector-settings-dither-row"><span>Dither</span> <button type="button" class="vector-dither-preview" aria-label="Select dither pattern" data-tooltip="Select dither pattern"></button></div> <div class="vector-settings-brush-row"><span> </span> <input type="range" class="slider" min="1" max="32"/></div>', 1);
function lm(e, t) {
  Oe(t, true);
  let o = Ue(t, "vector", 15);
  const n = R(() => {
    var _a5, _b2;
    const C = Ze[o().ditherPatternIndex ?? 63];
    if (!C) return "";
    const k = ((_a5 = o().modes) == null ? void 0 : _a5.twoColor) ?? false, _ = om(C, o());
    if (k) {
      const L = _.querySelector(".dither-bg-rect");
      L && L.setAttribute("fill", ((_b2 = o().secondaryColor) == null ? void 0 : _b2.color) ?? "rgba(0,0,0,0)");
    }
    return new XMLSerializer().serializeToString(_);
  });
  function s(C) {
    const k = ["line", "quadCurve", "cubicCurve"].includes(C);
    if (k && o().modes[C]) return;
    if (k) {
      Sh(o(), C);
      return;
    }
    const _ = { ...o().modes };
    o(o().modes[C] = !o().modes[C], true), o().modes[C] && (C === "eraser" && o().modes.inject ? o(o().modes.inject = false, true) : C === "inject" && o().modes.eraser && o(o().modes.eraser = false, true));
    const L = { ...o().modes };
    U(o().layer, true), ul(o(), _, L), r.clearRedoStack(), S.render();
  }
  function a(C) {
    C.stopPropagation(), Zt({ color: o().color, vector: o(), isSecondaryColor: false });
  }
  function l(C) {
    C.stopPropagation(), o().secondaryColor || o(o().secondaryColor = { r: 0, g: 0, b: 0, a: 0, color: "rgba(0,0,0,0)" }, true), Zt({ color: o().secondaryColor, vector: o(), isSecondaryColor: true });
  }
  let c = 1;
  function u() {
    c = o().brushSize ?? 1;
  }
  function d(C) {
    o(o().brushSize = parseInt(C.target.value), true), U(o().layer, true);
  }
  function f(C) {
    const k = parseInt(C.target.value);
    c !== k && (gh(o(), c, k), r.clearRedoStack());
  }
  function p() {
    if (r.ui.ditherPickerOpen && Dt.ditherVectorTarget === o()) Dt.ditherVectorTarget = null, r.ui.ditherPickerOpen = false;
    else {
      Dt.ditherVectorTarget = o();
      const C = o().ditherOffsetX ?? 0, k = o().ditherOffsetY ?? 0;
      if (T.ditherPickerContainer) {
        Vt(T.ditherPickerContainer, C, k);
        const _ = T.ditherPickerContainer.querySelector(".dither-offset-control-wrap");
        _ && bo(_, C, k);
      }
      r.ui.ditherPickerOpen = true;
    }
  }
  const h = R(() => ({ ...o().modes ?? {} })), y = R(() => {
    var _a5;
    return (_a5 = o().color) == null ? void 0 : _a5.color;
  }), v = R(() => {
    var _a5;
    return ((_a5 = o().secondaryColor) == null ? void 0 : _a5.color) ?? "rgba(0,0,0,0)";
  }), g = R(() => {
    var _a5;
    return (_a5 = o().vectorProperties) == null ? void 0 : _a5.tool;
  }), x = R(() => m(g) === "curve"), b = ["line", "quadCurve", "cubicCurve"], O = ["eraser", "inject", "twoColor"], M = R(() => m(x) ? [...b, ...O] : O), w = R(() => o().brushSize ?? 1);
  Cl(e, { class: "vector-settings", get pos() {
    return t.pos;
  }, get onclose() {
    return t.onclose;
  }, title: "Vector Settings", excludeClasses: ["gear"], excludeSelectors: [".dither-picker-container", ".picker-container"], children: (C, k) => {
    var _ = am(), L = Ve(_);
    Je(L, 20, () => m(M), (Q) => Q, (Q, le) => {
      var de = im();
      pe(() => {
        te(de, 1, `mode ${le ?? ""}${m(h)[le] ? " selected" : ""}`), ee(de, "aria-label", le), ee(de, "data-tooltip", le);
      }), Y("click", de, () => s(le)), F(Q, de);
    });
    var E = X(L, 2), I = X(z(E), 2), P = z(I), A = X(E, 2), G = X(z(A), 2), K = z(G), D = X(A, 2), $ = X(z(D), 2);
    Ss($, () => m(n), true);
    var H = X(D, 2), J = z(H), Z = z(J), V = X(J, 2);
    pe(() => {
      qt(P, `background-color: ${m(y) ?? ""}`), qt(K, `background-color: ${m(v) ?? ""}`), Fe(Z, `Size: ${m(w) ?? ""}px`), kr(V, m(w));
    }), Y("click", I, a), Y("click", G, l), Y("click", $, p), Y("pointerdown", V, u), Y("input", V, d), Y("change", V, f), F(C, _);
  }, $$slots: { default: true } }), Le();
}
ze(["click", "pointerdown", "input", "change"]);
var cm = re('<div role="button" tabindex="0"><!> <div class="left"><button type="button"></button> <button type="button" class="actionColor primary-color" aria-label="Action Color" data-tooltip="Action Color"><div class="swatch"></div></button> <button type="button"></button> <button type="button" class="trash" aria-label="Remove Vector" data-tooltip="Remove Vector"></button></div> <button type="button" aria-label="Vector Settings" data-tooltip="Vector Settings"></button></div>'), um = re('<div class="vectors-container"><div class="vectors"></div></div> <!>', 1);
function dm(e, t) {
  Oe(t, true);
  let o = se(null), n = se(Me({ top: 0, left: 0 }));
  const s = R(() => !!i.pastedLayer), a = R(() => {
    const y = new Set(r.timeline.undoStack);
    return Object.values(r.vector.all).filter((v) => rm(v, y));
  }), l = R(() => r.vector.currentIndex), c = R(() => r.vector.selectedIndices);
  function u(y, v) {
    var _a5, _b2;
    if (m(s)) {
      y.preventDefault();
      return;
    }
    ue.ShiftLeft || ue.ShiftRight ? r.vector.selectedIndices.has(v.index) ? Zp(v.index) : Jp(v.index) : r.vector.selectedIndices.size > 0 && Xo(), v.index !== r.vector.currentIndex && (De(v.vectorProperties.tool), S.setVectorProperties(v), (_a5 = i.currentLayer.inactiveTools) == null ? void 0 : _a5.forEach((g) => {
      T[`${g}Btn`] && (T[`${g}Btn`].disabled = false);
    }), i.currentLayer = v.layer, (_b2 = i.currentLayer.inactiveTools) == null ? void 0 : _b2.forEach((g) => {
      T[`${g}Btn`] && (T[`${g}Btn`].disabled = true);
    })), S.render(), st();
  }
  function d(y, v) {
    y.stopPropagation(), v.hidden = !v.hidden, U(v.layer, true);
  }
  function f(y, v) {
    y.stopPropagation(), v.removed = true, r.vector.currentIndex === v.index && S.reset(), U(v.layer, true), xh(v), r.clearRedoStack();
  }
  function p(y, v) {
    if (y.stopPropagation(), m(o) === v) N(o, null);
    else {
      const g = y.currentTarget.getBoundingClientRect();
      N(n, { top: g.top + g.height / 2, left: g.right + 16 }, true), N(o, v);
    }
  }
  function h(y, v) {
    y.stopPropagation(), Zt({ color: v.color, vector: v, isSecondaryColor: false });
  }
  {
    let y = R(() => m(s) ? " disabled" : "");
    it(e, { title: "Vectors", get class() {
      return `vectors-interface draggable v-drag settings-box smooth-shift${m(y) ?? ""}`;
    }, collapsible: true, children: (v, g) => {
      var x = um(), b = Ve(x), O = z(b);
      Je(O, 21, () => m(a), (C) => C.index, (C, k) => {
        const _ = R(() => m(k).hidden), L = R(() => m(k).index === m(l) || m(c).has(m(k).index)), E = R(() => {
          var _a5;
          return ((_a5 = m(k).vectorProperties) == null ? void 0 : _a5.tool) ?? "";
        }), I = R(() => m(o) === m(k));
        var P = cm(), A = z(P);
        sm(A, { get vector() {
          return m(k);
        } });
        var G = X(A, 2), K = z(G), D = X(K, 2), $ = z(D), H = X(D, 2), J = X(H, 2), Z = X(G, 2);
        pe(() => {
          var _a5;
          te(P, 1, `vector${m(L) ? " selected" : ""}`), te(K, 1, `tool ${m(E) ?? ""}`), ee(K, "aria-label", m(E)), ee(K, "data-tooltip", m(E)), qt($, `background-color: ${((_a5 = m(k).color) == null ? void 0 : _a5.color) ?? ""}`), te(H, 1, `hide ${m(_) ? "eyeclosed" : "eyeopen"}`), ee(H, "aria-label", m(_) ? "Show Vector" : "Hide Vector"), ee(H, "data-tooltip", m(_) ? "Show Vector" : "Hide Vector"), te(Z, 1, `gear${m(I) ? " active" : ""}`);
        }), Y("click", P, (V) => u(V, m(k))), Y("keydown", P, (V) => {
          (V.key === "Enter" || V.key === " ") && u(V, m(k));
        }), Y("click", K, (V) => V.stopPropagation()), Y("click", D, (V) => h(V, m(k))), Y("click", H, (V) => d(V, m(k))), Y("click", J, (V) => f(V, m(k))), Y("click", Z, (V) => p(V, m(k))), F(C, P);
      });
      var M = X(b, 2);
      {
        var w = (C) => {
          lm(C, { get pos() {
            return m(n);
          }, onclose: () => {
            N(o, null);
          }, get vector() {
            return m(o);
          }, set vector(k) {
            N(o, k);
          } });
        };
        rt(M, (C) => {
          m(o) && C(w);
        });
      }
      F(v, x);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["click", "keydown"]);
var fm = re("<!> <!> <!> <!>", 1);
function pm(e) {
  it(e, { title: "Tools", class: "sidebar h-drag free locked", collapsible: true, locked: true, children: (t, o) => {
    var n = fm(), s = Ve(n);
    qy(s, {});
    var a = X(s, 2);
    jy(a, {});
    var l = X(a, 2);
    tm(l, {});
    var c = X(l, 2);
    dm(c, {}), F(t, n);
  }, $$slots: { default: true } });
}
var hm = re('<span role="group"><span data-action="inc" class="channel-btn"><span class="spin-content">+</span></span><span data-action="dec" class="channel-btn"><span class="spin-content">-</span></span></span>');
function is(e, t) {
  Oe(t, true);
  let o = Ue(t, "value", 15), n = Ue(t, "class", 3, "");
  function s(l) {
    var _a5, _b2;
    const c = l.target.dataset.action || ((_a5 = l.target.closest("[data-action]")) == null ? void 0 : _a5.dataset.action);
    let u = Math.floor(+o());
    c === "inc" && u < t.max ? u++ : c === "dec" && u > t.min && u--, o(u), (_b2 = t.onspin) == null ? void 0 : _b2.call(t, u);
  }
  var a = hm();
  pe(() => te(a, 1, `spin-btn${n() ? " " + n() : ""}`)), Y("pointerdown", a, s), F(e, a), Le();
}
ze(["pointerdown"]);
var vm = re('<label class="toggle"><input type="checkbox"/> <span class="checkmark"></span> <span> </span></label>');
function gr(e, t) {
  let o = Ue(t, "labelId", 3, void 0), n = Ue(t, "tooltip", 3, void 0), s = Ue(t, "name", 3, void 0);
  var a = vm(), l = z(a), c = X(l, 4), u = z(c);
  pe(() => {
    ee(a, "for", t.id), ee(a, "id", o()), ee(a, "data-tooltip", n()), ee(l, "id", t.id), ee(l, "name", s()), Cs(l, t.checked), Fe(u, t.label);
  }), Y("change", l, function(...d) {
    var _a5;
    (_a5 = t.onchange) == null ? void 0 : _a5.apply(this, d);
  }), F(e, a);
}
ze(["change"]);
var ym = re('<div class="settings-interface"><div class="settings-group"><div class="settings-section-header">Display</div> <div class="settings-options"><!> <!> <div class="grid-spacing-container"><label for="grid-spacing"><span>Subgrid Spacing:&nbsp;</span> <input type="number" id="grid-spacing" min="1" max="64"/> <!></label></div> <!></div></div></div>');
function mm(e, t) {
  Oe(t, true);
  const o = R(() => r.ui.settingsOpen);
  let n = se(Me(S.grid ?? false)), s = se(Me(S.gridSpacing ?? 8));
  Xt(() => {
    m(o) && (N(n, S.grid ?? false, true), N(s, S.gridSpacing ?? 8, true));
  });
  function a() {
    r.ui.settingsOpen = false;
  }
  function l(f) {
    r.ui.showTooltips = f.target.checked;
  }
  function c(f) {
    N(n, f.target.checked, true), S.grid = m(n), S.render();
  }
  function u(f) {
    let p = parseInt(f.target.value);
    p < 1 ? p = 1 : p > 64 && (p = 64), N(s, p, true), S.gridSpacing = p, S.render();
  }
  function d(f) {
    S.showCursorPreview = f.target.checked;
  }
  {
    let f = R(() => m(o) ? "flex" : "none");
    it(e, { title: "Settings", class: "settings-container draggable v-drag h-drag free", get style() {
      return `display: ${m(f) ?? ""}`;
    }, onclose: a, children: (p, h) => {
      var y = ym(), v = z(y), g = X(z(v), 2), x = z(g);
      gr(x, { id: "tooltips-toggle", labelId: "tooltips", label: "Tooltips", get checked() {
        return r.ui.showTooltips;
      }, onchange: l, tooltip: "Toggle tooltips (T)" });
      var b = X(x, 2);
      gr(b, { id: "grid-toggle", labelId: "grid", label: "Grid", get checked() {
        return m(n);
      }, onchange: c, tooltip: "Toggle grid (G)\\n\\nDisplays at higher zoom levels only." });
      var O = X(b, 2), M = z(O), w = X(z(M), 2), C = X(w, 2);
      is(C, { min: 1, max: 64, class: "grid-spacing-spin", onspin: (_) => {
        S.gridSpacing = _, S.render();
      }, get value() {
        return m(s);
      }, set value(_) {
        N(s, _, true);
      } });
      var k = X(O, 2);
      {
        let _ = R(() => S.showCursorPreview ?? true);
        gr(k, { id: "cursor-preview-toggle", labelId: "cursor-preview", label: "Cursor Preview", get checked() {
          return m(_);
        }, onchange: d, tooltip: "Show brush color preview under cursor instead of an outline" });
      }
      pe(() => kr(w, m(s))), Y("input", w, u), F(p, y);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["input"]);
var gm = re('<button type="button"></button>'), bm = re('<form class="dimensions-form"><div class="inputs"><label for="canvas-width">Width: <span class="input"><input type="number" id="canvas-width" min="8" max="1024"/> <!></span></label> <label for="canvas-height">Height: <span class="input"><input type="number" id="canvas-height" min="8" max="1024"/> <!></span></label></div> <div class="anchor-section"><span class="anchor-label">Anchor:</span> <div class="anchor-grid" id="anchor-grid"></div></div> <div class="buttons-container"><button type="submit" id="update-size" class="update-size" aria-label="Update Canvas Size">Submit</button> <button type="button" id="cancel-resize-button" class="update-size" aria-label="Close canvas resize dialog box">Cancel</button></div></form>');
function xm(e, t) {
  Oe(t, true);
  const o = 8, n = 1024, s = ["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"];
  let a = se(null), l = se(null), c = se(null), u = se("top-left"), d = se(Me(i.offScreenCVS.width)), f = se(Me(i.offScreenCVS.height)), p = false, h = false;
  const y = R(() => r.ui.canvasSizeOpen);
  let v = false;
  Xt(() => {
    const _ = m(y);
    _ && !v && (N(d, i.offScreenCVS.width, true), N(f, i.offScreenCVS.height, true), N(u, "top-left")), v = _;
  }), Xt(() => {
    r.canvas.resizeOverlayActive && (p || N(d, ae.newWidth, true), h || N(f, ae.newHeight, true));
  }), ur(() => {
    T.canvasWidth = m(a), T.canvasHeight = m(l), T.anchorGrid = m(c);
  });
  function g(_) {
    N(d, _.target.value, true), r.canvas.resizeOverlayActive && Go(+m(d), +m(f));
  }
  function x(_) {
    N(f, _.target.value, true), r.canvas.resizeOverlayActive && Go(+m(d), +m(f));
  }
  function b(_) {
    let L = +_.target.value;
    L > n ? L = n : L < o && (L = o), N(d, L, true), p = false;
  }
  function O(_) {
    let L = +_.target.value;
    L > n ? L = n : L < o && (L = o), N(f, L, true), h = false;
  }
  function M(_) {
    N(u, _, true), $v(_);
  }
  function w(_) {
    _.preventDefault(), r.canvas.resizeOverlayActive ? Gv() : Ls(+m(d), +m(f)), r.ui.canvasSizeOpen = false;
  }
  function C() {
    ns(), r.ui.canvasSizeOpen = false;
  }
  function k() {
    ns(), r.ui.canvasSizeOpen = false;
  }
  {
    let _ = R(() => m(y) ? "flex" : "none");
    it(e, { title: "Canvas Size", class: "size-container draggable v-drag h-drag free", get style() {
      return `display: ${m(_) ?? ""}`;
    }, onclose: k, children: (L, E) => {
      var I = bm(), P = z(I), A = z(P), G = X(z(A)), K = z(G);
      Ye(K, (ce) => N(a, ce), () => m(a));
      var D = X(K, 2);
      is(D, { min: o, max: n, onspin: (ce) => {
        r.canvas.resizeOverlayActive && Go(ce, +m(f));
      }, get value() {
        return m(d);
      }, set value(ce) {
        N(d, ce, true);
      } });
      var $ = X(A, 2), H = X(z($)), J = z(H);
      Ye(J, (ce) => N(l, ce), () => m(l));
      var Z = X(J, 2);
      is(Z, { min: o, max: n, onspin: (ce) => {
        r.canvas.resizeOverlayActive && Go(+m(d), ce);
      }, get value() {
        return m(f);
      }, set value(ce) {
        N(f, ce, true);
      } });
      var V = X(P, 2), Q = X(z(V), 2);
      Je(Q, 20, () => s, (ce) => ce, (ce, j) => {
        var W = gm();
        pe(() => {
          te(W, 1, `anchor-btn${m(u) === j ? " active" : ""}`), ee(W, "data-anchor", j), ee(W, "aria-label", `Anchor ${j ?? ""}`);
        }), Y("click", W, () => M(j)), F(ce, W);
      }), Ye(Q, (ce) => N(c, ce), () => m(c));
      var le = X(V, 2), de = X(z(le), 2);
      pe(() => {
        kr(K, m(d)), kr(J, m(f));
      }), St("submit", I, w), Y("input", K, g), St("focus", K, () => {
        p = true;
      }), St("blur", K, b), Y("input", J, x), St("focus", J, () => {
        h = true;
      }), St("blur", J, O), Y("click", de, C), F(L, I);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["input", "click"]);
function Sm(e, t) {
  const o = document.createElement("span");
  o.style.visibility = "hidden", o.style.position = "absolute", o.style.font = t, o.textContent = e, o.innerHTML = e.replace(/ /g, "&nbsp;"), document.body.appendChild(o);
  const n = o.offsetWidth;
  return document.body.removeChild(o), n;
}
var Cm = re('<form id="save-interface" class="save-interface"><div class="save-setting"><label for="save-file-name" class="save-file-name-label"><span class="input-label">Save As:</span> <input type="text" id="save-file-name" name="save-file-name" placeholder="my drawing" maxlength="24"/> <span>.pxv</span></label></div> <div id="filesize-preview" class="save-setting"><span>Filesize:&nbsp;</span> <span id="savefile-size"> </span></div> <div class="save-setting"><!></div> <div id="save-advanced-options"><div class="save-setting"><!></div> <div class="save-setting"><!></div> <div class="save-setting"><!></div></div> <div class="save-buttons"><button type="submit" id="save-button" class="btn" aria-label="Save offline as a .pxv file" data-tooltip="Save offline as a .pxv file">Save</button> <button type="button" id="cancel-save-button" class="btn" aria-label="Close save dialog box">Cancel</button></div></form>');
function wm(e, t) {
  Oe(t, true);
  let o = se("");
  const n = R(() => r.ui.saveDialogOpen), s = R(() => r.ui.saveSettings);
  Xt(() => {
    m(n) && (m(s).preserveHistory, m(s).includePalette, m(s).includeReferenceLayers, m(s).includeRemovedActions, N(o, "Calculating..."), Is().then((y) => {
      N(o, y, true);
    }));
  });
  function a() {
    r.ui.saveDialogOpen = false;
  }
  function l(y) {
    r.ui.saveSettings.saveAsFileName = y.target.value;
    const v = Sm(y.target.value, "16px '04Font'") + 2;
    y.target.style.width = v + "px";
  }
  function c(y) {
    r.ui.saveSettings.preserveHistory = y.target.checked;
  }
  function u(y) {
    r.ui.saveSettings.includePalette = y.target.checked;
  }
  function d(y) {
    r.ui.saveSettings.includeReferenceLayers = y.target.checked;
  }
  function f(y) {
    r.ui.saveSettings.includeRemovedActions = y.target.checked;
  }
  function p(y) {
    y.preventDefault(), el(), r.ui.saveDialogOpen = false;
  }
  const h = R(() => m(s).preserveHistory);
  {
    let y = R(() => m(n) ? "flex" : "none");
    it(e, { title: "Save Options", class: "save-container v-drag h-drag free", get style() {
      return `display: ${m(y) ?? ""}`;
    }, onclose: a, children: (v, g) => {
      var x = Cm(), b = z(x), O = z(b), M = X(z(O), 2), w = X(b, 2), C = X(z(w), 2), k = z(C), _ = X(w, 2), L = z(_);
      gr(L, { id: "preserve-history-toggle", labelId: "preserve-history", name: "preserve-history", label: "Preserve Entire History", get checked() {
        return m(s).preserveHistory;
      }, onchange: c, tooltip: "Preserve all actions in history, palette, and reference images" });
      var E = X(_, 2), I = z(E), P = z(I);
      gr(P, { id: "include-palette-toggle", labelId: "include-palette", name: "include-palette", label: "Palette", get checked() {
        return m(s).includePalette;
      }, onchange: u, tooltip: "Save colors in palette" });
      var A = X(I, 2), G = z(A);
      gr(G, { id: "include-reference-layers-toggle", labelId: "include-reference-layers", name: "include-reference-layers", label: "Reference Layers", get checked() {
        return m(s).includeReferenceLayers;
      }, onchange: d, tooltip: "Save all reference images, including any transformations applied to them." });
      var K = X(A, 2), D = z(K);
      gr(D, { id: "include-removed-actions-toggle", labelId: "include-removed-actions", name: "include-removed-actions", label: "Removed Actions", get checked() {
        return m(s).includeRemovedActions;
      }, onchange: f, tooltip: "If a layer or vector was trashed or layer was cleared, those actions are still recoverable by using undo. If you're certain those actions won't be missed, you can remove them permanently by unchecking this box." });
      var $ = X(E, 2), H = X(z($), 2);
      pe(() => {
        kr(M, m(s).saveAsFileName ?? ""), Fe(k, m(o)), te(E, 1, `advanced-options${m(h) ? " disabled" : ""}`);
      }), St("submit", x, p), Y("input", M, l), Y("click", H, a), F(v, x);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["input", "click"]);
var Mm = re('<button type="button" class="btn"> </button>'), km = re('<div id="export-interface" class="export-interface"></div>');
function Pm(e, t) {
  Oe(t, true);
  const o = [1, 2, 4, 8], n = R(() => r.ui.exportOpen);
  function s() {
    r.ui.exportOpen = false;
  }
  function a(l) {
    yn();
    const c = document.createElement("canvas");
    c.width = i.offScreenCVS.width * l, c.height = i.offScreenCVS.height * l;
    const u = c.getContext("2d");
    u.imageSmoothingEnabled = false, u.drawImage(i.offScreenCVS, 0, 0, c.width, c.height);
    const d = document.createElement("a");
    d.style.display = "none", d.href = c.toDataURL(), d.download = "pixelvee.png", document.body.appendChild(d), d.click(), document.body.removeChild(d);
  }
  {
    let l = R(() => m(n) ? "flex" : "none");
    it(e, { title: "Export", class: "export-container v-drag h-drag free", get style() {
      return `display: ${m(l) ?? ""}`;
    }, onclose: s, children: (c, u) => {
      var d = km();
      Je(d, 20, () => o, (f) => f, (f, p) => {
        var h = Mm(), y = z(h);
        pe(() => Fe(y, `${p ?? ""}x`)), Y("click", h, () => a(p)), F(f, h);
      }), F(c, d);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["click"]);
var _m = re('<div id="vector-transform-ui-interface" class="vector-transform-ui-interface"><div class="vector-transform-modes"><button type="button" id="translate" aria-label="Translate" data-tooltip="Translate"></button> <button type="button" id="rotate" aria-label="Rotate" data-tooltip="Rotate"></button> <button type="button" id="scale" aria-label="Scale" data-tooltip="Scale"></button></div></div>');
function Om(e, t) {
  Oe(t, true);
  const o = R(() => r.ui.vectorTransformOpen), n = R(() => r.vector.transformMode);
  function s() {
    Xo();
  }
  function a() {
    r.selection.resetProperties(), r.selection.resetBoundaryBox(), wn(mo);
  }
  function l() {
    r.selection.resetProperties(), r.selection.resetBoundaryBox(), wn(Kr);
  }
  function c() {
    Lo(), wn(cr);
  }
  {
    let u = R(() => m(o) ? "flex" : "none");
    it(e, { title: "Transform", class: "vector-transform-ui-container v-drag h-drag free", get style() {
      return `display: ${m(u) ?? ""}`;
    }, onclose: s, children: (d, f) => {
      var p = _m(), h = z(p), y = z(h), v = X(y, 2), g = X(v, 2);
      pe(() => {
        te(y, 1, `transform-mode tool move custom-shape${m(n) === mo ? " selected" : ""}`), te(v, 1, `transform-mode tool rotate custom-shape${m(n) === Kr ? " selected" : ""}`), te(g, 1, `transform-mode tool scale custom-shape${m(n) === cr ? " selected" : ""}`);
      }), Y("click", y, a), Y("click", v, l), Y("click", g, c), F(d, p);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["click"]);
var Lm = re('<div id="color-ramps-section"><div class="ramps-header">Color Ramps <label class="collapse-btn"><input type="checkbox" class="collapse-checkbox"/> <span class="arrow"></span></label></div> <div id="color-ramps-collapsible"><div class="color-group" data-group="shadow"><div class="ramp-label">Shadow / Highlight</div> <div class="ramp-row"><div class="ramp-swatches"></div></div></div> <div class="color-group" data-group="custom"><div class="ramp-label">Custom Ramp</div> <div class="ramp-row"><div class="ramp-swatches"></div></div></div></div></div> <div class="picker-interface"><div id="left"><div id="picker"><canvas id="color-picker" width="250" height="250"></canvas> <div class="slider-container"><input type="range" id="hueslider" class="picker-slider" min="0" max="359" value="0"/> <input type="range" id="alphaslider" class="picker-slider" min="0" max="255" value="255"/></div></div> <div id="buttons"><button type="button" class="btn" id="confirm-btn">OK</button> <button type="button" class="btn" id="cancel-btn">Cancel</button></div></div> <div id="right"><div id="colors"><div class="color"><h5>New</h5> <button type="button" class="swatch" id="newcolor-btn" aria-label="New color \u2013 click to add to palette"><div class="swatch-color" id="newcolor"></div> <div id="newcolor-plus"></div></button></div> <div class="color"><h5>Old</h5> <button type="button" class="swatch" id="oldcolor-btn" aria-label="Old color"><div class="swatch-color" id="oldcolor"></div></button></div></div> <div id="rgbahsl"><div class="channel-container" id="rgba-container"><label>R <input type="number" id="r" min="0" max="255" value="0"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label> <label>G <input type="number" id="g" min="0" max="255" value="0"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label> <label>B <input type="number" id="b" min="0" max="255" value="0"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label> <label>A <input type="number" id="a" min="0" max="255" value="255"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label></div> <div class="channel-container" id="hsl-container"><label>H <input type="number" id="h" min="0" max="359" value="0"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label> <label>S <input type="number" id="s" min="0" max="100" value="0"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label> <label>L <input type="number" id="l" min="0" max="100" value="0"/> <div class="spin-btn"><button type="button" class="channel-btn" id="inc"><span class="spin-content">+</span></button><button type="button" class="channel-btn" id="dec"><span class="spin-content">-</span></button></div></label></div></div> <div id="hex"><label>Hex <input type="text" id="hexcode" value="000000"/></label></div> <div id="lumi"><label>Lumi <input type="text" id="luminance" readonly="" value="0"/></label></div></div></div>', 1);
function Tm(e, t) {
  Oe(t, true);
  let o = se(null), n = se(false);
  const s = R(() => r.ui.colorPickerOpen);
  ur(() => {
    if (m(o)) {
      const a = new rv(m(o), 250, 250, B.primary.color);
      a.build(), iv(a);
    }
  });
  {
    let a = R(() => m(s) ? "flex" : "none");
    it(e, { title: "Color Picker", class: "picker-container v-drag h-drag free", get style() {
      return `display: ${m(a) ?? ""}`;
    }, get onclose() {
      return os;
    }, children: (l, c) => {
      var u = Lm(), d = Ve(u), f = z(d), p = X(z(f)), h = z(p), y = X(f, 2), v = X(d, 2), g = z(v), x = z(g), b = z(x);
      Ye(b, (E) => N(o, E), () => m(o));
      var O = X(x, 2), M = z(O), w = X(M, 2), C = X(g, 2), k = z(C), _ = z(k), L = X(z(_), 2);
      pe(() => {
        Cs(h, m(n)), qt(y, `display: ${m(n) ? "none" : "flex"}`);
      }), Y("change", h, (E) => {
        N(n, E.target.checked, true);
      }), Y("click", M, function(...E) {
        sv == null ? void 0 : sv.apply(this, E);
      }), Y("click", w, function(...E) {
        os == null ? void 0 : os.apply(this, E);
      }), Y("click", L, function(...E) {
        av == null ? void 0 : av.apply(this, E);
      }), F(l, u);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["change", "click"]);
var Im = re('<button type="button"></button>'), Xm = re('<button type="button"></button>'), Em = re('<div class="dither-controls"><button type="button" id="dither-ctrl-two-color" aria-label="Two-Color" data-tooltip="Two-Color"></button> <button type="button" id="dither-ctrl-build-up" aria-label="Build-Up Dither" data-tooltip="Build-Up Dither  Automatically increase dither density on overlapping strokes"></button> <div class="dither-offset-control-wrap"><div class="dither-offset-control" data-tooltip="Drag to set dither offset"></div> <div class="dither-offset-values"><span> </span><span> </span></div></div></div> <div class="build-up-steps"><span class="build-up-steps-label">Build-Up Steps</span> <div class="build-up-mode-selector"><button type="button" data-tooltip="Custom build-up steps">Custom</button> <button type="button" data-tooltip="4 steps from a 2x2 Bayer Matrix">2\xD72</button> <button type="button" data-tooltip="16 steps from a 4x4 Bayer Matrix">4\xD74</button> <button type="button" data-tooltip="64 steps from an 8x8 Bayer Matrix">8\xD78</button></div> <div class="build-up-step-slots"><!></div> <button type="button" id="dither-ctrl-build-up-reset" class="btn build-up-reset-btn" data-tooltip="Reset build-up density">Reset Density Map</button></div> <div class="dither-grid"></div>', 1);
function Bm(e, t) {
  Oe(t, true);
  const o = ["brush", "curve", "ellipse", "polygon"];
  let n = se(null);
  const s = R(() => r.ui.ditherPickerOpen), a = R(() => Dt.ditherVectorTarget), l = R(() => {
    var _a5, _b2;
    return ((_a5 = m(a)) == null ? void 0 : _a5.ditherPatternIndex) ?? ((_b2 = r.tool.current) == null ? void 0 : _b2.ditherPatternIndex);
  }), c = R(() => {
    var _a5, _b2, _c5;
    return !!(m(a) ? (_a5 = m(a).modes) == null ? void 0 : _a5.twoColor : (_c5 = (_b2 = r.tool.current) == null ? void 0 : _b2.modes) == null ? void 0 : _c5.twoColor);
  }), u = R(() => {
    var _a5, _b2;
    return !m(a) && !!((_b2 = (_a5 = r.tool.current) == null ? void 0 : _a5.modes) == null ? void 0 : _b2.buildUpDither);
  }), d = R(() => {
    var _a5;
    return !m(a) && ((_a5 = r.tool.current) == null ? void 0 : _a5.name) === "brush";
  }), f = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.buildUpMode) ?? "custom";
  }), p = R(() => {
    var _a5;
    return [...((_a5 = r.tool.current) == null ? void 0 : _a5.buildUpSteps) ?? [15, 31, 47, 63]];
  }), h = R(() => {
    var _a5;
    return ((_a5 = r.tool.current) == null ? void 0 : _a5.buildUpActiveStepSlot) ?? null;
  }), y = R(() => {
    var _a5;
    return ((_a5 = m(a) ?? r.tool.current) == null ? void 0 : _a5.ditherOffsetX) ?? 0;
  }), v = R(() => {
    var _a5;
    return ((_a5 = m(a) ?? r.tool.current) == null ? void 0 : _a5.ditherOffsetY) ?? 0;
  });
  Xt(() => {
    const L = m(y), E = m(v);
    if (!m(n)) return;
    m(n).querySelectorAll(".dither-tile-pattern").forEach((P) => {
      P.setAttribute("x", String(-L)), P.setAttribute("y", String(-E));
    });
    const I = m(n).querySelector(".dither-offset-ring-pattern");
    I && (I.setAttribute("x", String(-L)), I.setAttribute("y", String(-E)));
  }), Xt(() => {
    if (!m(n)) return;
    const L = B.primary.color.color, E = B.secondary.color.color, I = m(c) ? E : "none";
    m(n).querySelectorAll(".dither-bg-rect").forEach((P) => P.setAttribute("fill", I)), m(n).querySelectorAll(".dither-on-path").forEach((P) => P.setAttribute("stroke", L));
  });
  function g(L, E) {
    L.appendChild(an(E));
  }
  function x(L) {
    L.appendChild(Xp());
  }
  function b() {
    Dt.ditherVectorTarget = null, r.ui.ditherPickerOpen = false;
  }
  function O() {
    var _a5, _b2;
    const L = Dt.ditherVectorTarget;
    if (L) {
      L.modes || (L.modes = {}), L.modes.twoColor = !L.modes.twoColor, U(L.layer, true);
      return;
    }
    if (!o.includes((_a5 = r.tool.current) == null ? void 0 : _a5.name)) return;
    const E = !r.tool.current.modes.twoColor;
    r.tool.current.modes.twoColor = E;
    const I = r.tool.selectedName;
    ((_b2 = ie[I]) == null ? void 0 : _b2.modes) && (ie[I].modes.twoColor = E);
  }
  function M() {
    var _a5;
    if (((_a5 = r.tool.current) == null ? void 0 : _a5.name) !== "brush") return;
    const L = !r.tool.current.modes.buildUpDither;
    r.tool.current.modes.buildUpDither = L, oe.modes.buildUpDither = L, r.tool.current.modes.buildUpDither ? Fr() : (oe._buildUpDensityMap = /* @__PURE__ */ new Map(), r.tool.current.buildUpActiveStepSlot = null, oe.buildUpActiveStepSlot = null);
  }
  function w() {
    var _a5;
    ((_a5 = r.tool.current) == null ? void 0 : _a5.name) === "brush" && (oe._buildUpResetAtIndex = r.timeline.undoStack.length, oe._buildUpDensityMap = /* @__PURE__ */ new Map());
  }
  function C(L) {
    var _a5;
    if (((_a5 = r.tool.current) == null ? void 0 : _a5.name) === "brush") if (r.tool.current.buildUpMode === "custom" && L !== "custom" && (oe._customBuildUpSteps = [...r.tool.current.buildUpSteps]), r.tool.current.buildUpMode = L, oe.buildUpMode = L, L === "custom") {
      const E = [...oe._customBuildUpSteps];
      r.tool.current.buildUpSteps = E, oe.buildUpSteps = E;
    } else {
      const E = mi[L] ? [...mi[L]] : r.tool.current.buildUpSteps;
      r.tool.current.buildUpSteps = E, oe.buildUpSteps = E;
    }
  }
  function k(L, E = 0, I = 0) {
    return new XMLSerializer().serializeToString(an(L, E, I));
  }
  function _(L) {
    if (!r.tool.current) return;
    const E = r.tool.current.buildUpActiveStepSlot === L ? null : L;
    r.tool.current.buildUpActiveStepSlot = E, oe.buildUpActiveStepSlot = E;
  }
  ur(() => {
    var _a5;
    if (!m(n)) return;
    const L = m(n);
    T.ditherPickerContainer = L, (_a5 = L.querySelector(".dither-grid")) == null ? void 0 : _a5.addEventListener("click", (E) => {
      var _a6;
      const I = E.target.closest(".dither-grid-btn");
      if (!I) return;
      const P = parseInt(I.dataset.patternIndex), A = Dt.ditherVectorTarget;
      if (A) {
        const D = A.ditherPatternIndex;
        A.ditherPatternIndex = P, U(A.layer, true), D !== P && (yh(A, D, P), r.clearRedoStack());
        return;
      }
      if (!o.includes((_a6 = r.tool.current) == null ? void 0 : _a6.name)) return;
      const G = r.tool.selectedName, K = ie[G];
      if (r.tool.current.buildUpActiveStepSlot != null) {
        const D = r.tool.current.buildUpActiveStepSlot;
        r.tool.current.buildUpSteps[D] = P, r.tool.current.buildUpActiveStepSlot = null, K && (K.buildUpSteps[D] = P, K.buildUpActiveStepSlot = null);
      } else r.tool.current.ditherPatternIndex = P, K && (K.ditherPatternIndex = P);
    }), L.addEventListener("pointerdown", (E) => {
      var _a6, _b2, _c5;
      const I = E.target.closest(".dither-offset-control");
      if (!I) return;
      const P = Dt.ditherVectorTarget;
      if (!P && !o.includes((_a6 = r.tool.current) == null ? void 0 : _a6.name)) return;
      I.setPointerCapture(E.pointerId);
      const A = E.clientX, G = E.clientY;
      if (P) {
        const K = ((_b2 = P.layer) == null ? void 0 : _b2.x) ?? 0, D = ((_c5 = P.layer) == null ? void 0 : _c5.y) ?? 0, $ = P.recordedLayerX ?? K, H = P.recordedLayerY ?? D, J = (((P.ditherOffsetX ?? 0) + $ - K) % 8 + 8) % 8, Z = (((P.ditherOffsetY ?? 0) + H - D) % 8 + 8) % 8, V = { x: P.ditherOffsetX ?? 0, y: P.ditherOffsetY ?? 0 }, Q = (le) => {
          const de = ((J - Math.round((le.clientX - A) / 4)) % 8 + 8) % 8, ce = ((Z - Math.round((le.clientY - G) / 4)) % 8 + 8) % 8;
          P.ditherOffsetX = ((de - $ + K) % 8 + 8) % 8, P.ditherOffsetY = ((ce - H + D) % 8 + 8) % 8, U(P.layer, true), Vt(L, P.ditherOffsetX, P.ditherOffsetY);
          const j = document.querySelector(".vector-dither-preview");
          j && Vt(j, P.ditherOffsetX, P.ditherOffsetY), bo(I.parentElement, P.ditherOffsetX, P.ditherOffsetY);
        };
        I.addEventListener("pointermove", Q), I.addEventListener("pointerup", () => {
          I.removeEventListener("pointermove", Q);
          const le = { x: P.ditherOffsetX ?? 0, y: P.ditherOffsetY ?? 0 };
          (V.x !== le.x || V.y !== le.y) && (mh(P, V, le), r.clearRedoStack());
        }, { once: true });
      } else {
        const K = r.tool.current, D = ie[r.tool.selectedName], $ = K.ditherOffsetX ?? 0, H = K.ditherOffsetY ?? 0;
        let J = $, Z = H;
        const V = (Q) => {
          const le = (($ - Math.round((Q.clientX - A) / 4)) % 8 + 8) % 8, de = ((H - Math.round((Q.clientY - G) / 4)) % 8 + 8) % 8;
          J = le, Z = de, D && (D.ditherOffsetX = le, D.ditherOffsetY = de), Vt(L, le, de);
          const ce = document.querySelector(".dither-preview");
          ce && Vt(ce, le, de), bo(I.parentElement, le, de);
        };
        I.addEventListener("pointermove", V), I.addEventListener("pointerup", () => {
          I.removeEventListener("pointermove", V), K.ditherOffsetX = J, K.ditherOffsetY = Z, D && (D.ditherOffsetX = J, D.ditherOffsetY = Z);
        }, { once: true });
      }
    });
  });
  {
    let L = R(() => m(s) ? "flex" : "none");
    it(e, { title: "Dither Pattern", class: "dither-picker-container draggable v-drag h-drag free", get style() {
      return `display: ${m(L) ?? ""}`;
    }, collapsible: true, onclose: b, get ref() {
      return m(n);
    }, set ref(E) {
      N(n, E, true);
    }, children: (E, I) => {
      var P = Em(), A = Ve(P), G = z(A);
      let K;
      var D = X(G, 2);
      let $, H;
      var J = X(D, 2), Z = z(J);
      rn(Z, (lt) => x == null ? void 0 : x(lt));
      var V = X(Z, 2), Q = z(V), le = z(Q), de = X(Q), ce = z(de), j = X(A, 2);
      let W;
      var he = X(z(j), 2), me = z(he);
      let be;
      var ke = X(me, 2);
      let _e5;
      var Xe = X(ke, 2);
      let Ee;
      var q = X(Xe, 2);
      let we;
      var ye = X(he, 2), Qe = z(ye);
      {
        var Ke = (lt) => {
          var zt = yo(), _t5 = Ve(zt);
          Je(_t5, 17, () => m(p), jn, (ft, Ir, dr) => {
            var Yt = Im();
            let Ds;
            ee(Yt, "data-step-slot", dr), Ss(Yt, () => k(Ze[m(Ir)], m(y), m(v)), true), pe(() => {
              Ds = te(Yt, 1, "build-up-step-btn", null, Ds, { selected: dr === m(h) }), ee(Yt, "data-tooltip", `Step ${dr + 1}: pattern ${m(Ir) + 1}/64`), ee(Yt, "aria-label", `Step ${dr + 1}: pattern ${m(Ir) + 1}/64`);
            }), Y("click", Yt, () => _(dr)), F(ft, Yt);
          }), F(lt, zt);
        };
        rt(Qe, (lt) => {
          m(f) === "custom" && lt(Ke);
        });
      }
      var at = X(ye, 2), et = X(j, 2);
      Je(et, 21, () => Ze, jn, (lt, zt, _t5) => {
        var ft = Xm();
        let Ir;
        ee(ft, "data-pattern-index", _t5), ee(ft, "data-tooltip", _t5 === 31 ? "32/64: Checkerboard" : `${_t5 + 1}/64`), ee(ft, "aria-label", _t5 === 31 ? "32/64: Checkerboard" : `${_t5 + 1}/64`), rn(ft, (dr, Yt) => g == null ? void 0 : g(dr, Yt), () => m(zt)), pe(() => Ir = te(ft, 1, "dither-grid-btn", null, Ir, { selected: _t5 === m(l) })), F(lt, ft);
      }), pe(() => {
        K = te(G, 1, "dither-toggle twoColor", null, K, { selected: m(c) }), $ = te(D, 1, "dither-toggle buildUpDither", null, $, { selected: m(u) }), H = qt(D, "", H, { display: m(d) ? "" : "none" }), Fe(le, `X: ${m(y) ?? ""}`), Fe(ce, `Y: ${m(v) ?? ""}`), W = qt(j, "", W, { display: m(u) ? "flex" : "none" }), be = te(me, 1, "build-up-mode-btn", null, be, { selected: m(f) === "custom" }), _e5 = te(ke, 1, "build-up-mode-btn", null, _e5, { selected: m(f) === "2x2" }), Ee = te(Xe, 1, "build-up-mode-btn", null, Ee, { selected: m(f) === "4x4" }), we = te(q, 1, "build-up-mode-btn", null, we, { selected: m(f) === "8x8" });
      }), Y("click", G, O), Y("click", D, M), Y("click", me, () => C("custom")), Y("click", ke, () => C("2x2")), Y("click", Xe, () => C("4x4")), Y("click", q, () => C("8x8")), Y("click", at, w), F(E, P);
    }, $$slots: { default: true } });
  }
  Le();
}
ze(["click"]);
var zm = re('<div class="stamp-editor-interface"><canvas id="stamp-editor-canvas" width="320" height="320"></canvas> <div class="stamp-editor-footer"><div class="stamp-editor-tools"><div class="stamp-tool-group"><button id="stamp-draw-btn" type="button" class="stamp-tool brush selected" aria-label="Draw" data-tooltip="Draw"></button> <button id="stamp-erase-btn" type="button" class="stamp-tool eraser" aria-label="Erase" data-tooltip="Erase"></button> <button id="stamp-move-btn" type="button" class="stamp-tool move" aria-label="Move" data-tooltip="Move"></button></div> <div class="stamp-tool-group"><button id="stamp-mirror-h-btn" type="button" class="stamp-tool mirrorX" aria-label="Mirror Horizontal" data-tooltip="Mirror Horizontal"></button> <button id="stamp-mirror-v-btn" type="button" class="stamp-tool mirrorY" aria-label="Mirror Vertical" data-tooltip="Mirror Vertical"></button> <button id="stamp-editor-clear-btn" type="button" class="stamp-tool clear" aria-label="Clear" data-tooltip="Clear"></button></div></div> <div class="stamp-editor-preview-col"><canvas id="stamp-preview-canvas" width="32" height="32"></canvas> <button id="stamp-editor-apply-btn" type="button">Apply</button></div></div></div>');
function Ym(e, t) {
  Oe(t, true);
  let o = se(null);
  const n = R(() => r.ui.stampEditorOpen);
  let s = se(null), a = se(null), l = se(null), c = se(null), u = se(null), d = se(null), f = se(null), p = se(null), h = se(null);
  ur(() => {
    T.stampEditorContainer = m(o), T.stampEditorCanvas = m(s), T.stampPreviewCanvas = m(a), T.stampEditorApplyBtn = m(l), T.stampEditorClearBtn = m(c), T.stampDrawBtn = m(u), T.stampEraseBtn = m(d), T.stampMoveBtn = m(f), T.stampMirrorHBtn = m(p), T.stampMirrorVBtn = m(h), zy();
  });
  function y() {
    r.ui.stampEditorOpen = false;
  }
  {
    let v = R(() => m(n) ? "flex" : "none");
    it(e, { title: "Stamp Editor", class: "stamp-editor-container draggable v-drag h-drag free", get style() {
      return `display: ${m(v) ?? ""}`;
    }, onclose: y, get ref() {
      return m(o);
    }, set ref(g) {
      N(o, g, true);
    }, children: (g, x) => {
      var b = zm(), O = z(b);
      Ye(O, ($) => N(s, $), () => m(s));
      var M = X(O, 2), w = z(M), C = z(w), k = z(C);
      Ye(k, ($) => N(u, $), () => m(u));
      var _ = X(k, 2);
      Ye(_, ($) => N(d, $), () => m(d));
      var L = X(_, 2);
      Ye(L, ($) => N(f, $), () => m(f));
      var E = X(C, 2), I = z(E);
      Ye(I, ($) => N(p, $), () => m(p));
      var P = X(I, 2);
      Ye(P, ($) => N(h, $), () => m(h));
      var A = X(P, 2);
      Ye(A, ($) => N(c, $), () => m(c));
      var G = X(w, 2), K = z(G);
      Ye(K, ($) => N(a, $), () => m(a));
      var D = X(K, 2);
      Ye(D, ($) => N(l, $), () => m(l)), F(g, b);
    }, $$slots: { default: true } });
  }
  Le();
}
var Am = re('<div style="display:contents"><!> <!> <!> <!> <!> <!> <!> <!> <!> <!></div>'), Rm = re("<!> <!>", 1);
function Km(e, t) {
  Oe(t, true);
  let o = se(null);
  ur(() => {
    N(o, document.querySelector(".page"), true);
  });
  var n = Rm(), s = Ve(n);
  uy(s, {});
  var a = X(s, 2);
  {
    var l = (c) => {
      var u = Am(), d = z(u);
      Py(d, {});
      var f = X(d, 2);
      pm(f);
      var p = X(f, 2);
      mm(p, {});
      var h = X(p, 2);
      xm(h, {});
      var y = X(h, 2);
      wm(y, {});
      var v = X(y, 2);
      Pm(v, {});
      var g = X(v, 2);
      Om(g, {});
      var x = X(g, 2);
      Tm(x, {});
      var b = X(x, 2);
      Bm(b, {});
      var O = X(b, 2);
      Ym(O, {}), rn(u, (M, w) => Sl == null ? void 0 : Sl(M, w), () => m(o)), F(c, u);
    };
    rt(a, (c) => {
      m(o) && c(l);
    });
  }
  F(e, n), Le();
}
Mv(S);
r.tool.current = ie.brush;
r.tool.selectedName = "brush";
xp().then(() => {
  $c(Km, { target: document.getElementById("root") });
});
