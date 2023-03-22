(function(e) {
    "use strict";
    if (typeof exports === "object" && typeof exports.nodeName !== "string") {
        e(require("jquery"))
    } else if (typeof define === "function" && define.amd) {
        define(["jquery"], e)
    } else {
        e(jQuery)
    }
})(function(t) {
    "use strict";
    var r = function(e) {
        e = e || "once";
        if (typeof e !== "string") {
            throw new TypeError("The jQuery Once id parameter must be a string")
        }
        return e
    };
    t.fn.once = function(e) {
        var n = "jquery-once-" + r(e);
        return this.filter(function() {
            return t(this).data(n) !== true
        }).data(n, true)
    };
    t.fn.removeOnce = function(e) {
        return this.findOnce(e).removeData("jquery-once-" + r(e))
    };
    t.fn.findOnce = function(e) {
        var n = "jquery-once-" + r(e);
        return this.filter(function() {
            return t(this).data(n) === true
        })
    }
});;
(function() {
    var settingsElement = document.querySelector('head > script[type="application/json"][data-drupal-selector="drupal-settings-json"], body > script[type="application/json"][data-drupal-selector="drupal-settings-json"]');
    window.drupalSettings = {};
    if (settingsElement !== null) {
        window.drupalSettings = JSON.parse(settingsElement.textContent);
    }
})();;
window.Drupal = {
    behaviors: {},
    locale: {}
};
(function(Drupal, drupalSettings, drupalTranslations, console, Proxy, Reflect) {
    Drupal.throwError = function(error) {
        setTimeout(function() {
            throw error;
        }, 0);
    };
    Drupal.attachBehaviors = function(context, settings) {
        context = context || document;
        settings = settings || drupalSettings;
        var behaviors = Drupal.behaviors;
        Object.keys(behaviors || {}).forEach(function(i) {
            if (typeof behaviors[i].attach === 'function') {
                try {
                    behaviors[i].attach(context, settings);
                } catch (e) {
                    Drupal.throwError(e);
                }
            }
        });
    };
    Drupal.detachBehaviors = function(context, settings, trigger) {
        context = context || document;
        settings = settings || drupalSettings;
        trigger = trigger || 'unload';
        var behaviors = Drupal.behaviors;
        Object.keys(behaviors || {}).forEach(function(i) {
            if (typeof behaviors[i].detach === 'function') {
                try {
                    behaviors[i].detach(context, settings, trigger);
                } catch (e) {
                    Drupal.throwError(e);
                }
            }
        });
    };
    Drupal.checkPlain = function(str) {
        str = str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return str;
    };
    Drupal.formatString = function(str, args) {
        var processedArgs = {};
        Object.keys(args || {}).forEach(function(key) {
            switch (key.charAt(0)) {
                case '@':
                    processedArgs[key] = Drupal.checkPlain(args[key]);
                    break;
                case '!':
                    processedArgs[key] = args[key];
                    break;
                default:
                    processedArgs[key] = Drupal.theme('placeholder', args[key]);
                    break;
            }
        });
        return Drupal.stringReplace(str, processedArgs, null);
    };
    Drupal.stringReplace = function(str, args, keys) {
        if (str.length === 0) {
            return str;
        }
        if (!Array.isArray(keys)) {
            keys = Object.keys(args || {});
            keys.sort(function(a, b) {
                return a.length - b.length;
            });
        }
        if (keys.length === 0) {
            return str;
        }
        var key = keys.pop();
        var fragments = str.split(key);
        if (keys.length) {
            for (var i = 0; i < fragments.length; i++) {
                fragments[i] = Drupal.stringReplace(fragments[i], args, keys.slice(0));
            }
        }
        return fragments.join(args[key]);
    };
    Drupal.t = function(str, args, options) {
        options = options || {};
        options.context = options.context || '';
        if (typeof drupalTranslations !== 'undefined' && drupalTranslations.strings && drupalTranslations.strings[options.context] && drupalTranslations.strings[options.context][str]) {
            str = drupalTranslations.strings[options.context][str];
        }
        if (args) {
            str = Drupal.formatString(str, args);
        }
        return str;
    };
    Drupal.url = function(path) {
        return drupalSettings.path.baseUrl + drupalSettings.path.pathPrefix + path;
    };
    Drupal.url.toAbsolute = function(url) {
        var urlParsingNode = document.createElement('a');
        try {
            url = decodeURIComponent(url);
        } catch (e) {}
        urlParsingNode.setAttribute('href', url);
        return urlParsingNode.cloneNode(false).href;
    };
    Drupal.url.isLocal = function(url) {
        var absoluteUrl = Drupal.url.toAbsolute(url);
        var protocol = window.location.protocol;
        if (protocol === 'http:' && absoluteUrl.indexOf('https:') === 0) {
            protocol = 'https:';
        }
        var baseUrl = protocol + '//' + window.location.host + drupalSettings.path.baseUrl.slice(0, -1);
        try {
            absoluteUrl = decodeURIComponent(absoluteUrl);
        } catch (e) {}
        try {
            baseUrl = decodeURIComponent(baseUrl);
        } catch (e) {}
        return absoluteUrl === baseUrl || absoluteUrl.indexOf(baseUrl + '/') === 0;
    };
    Drupal.formatPlural = function(count, singular, plural, args, options) {
        args = args || {};
        args['@count'] = count;
        var pluralDelimiter = drupalSettings.pluralDelimiter;
        var translations = Drupal.t(singular + pluralDelimiter + plural, args, options).split(pluralDelimiter);
        var index = 0;
        if (typeof drupalTranslations !== 'undefined' && drupalTranslations.pluralFormula) {
            index = count in drupalTranslations.pluralFormula ? drupalTranslations.pluralFormula[count] : drupalTranslations.pluralFormula.default;
        } else if (args['@count'] !== 1) {
            index = 1;
        }
        return translations[index];
    };
    Drupal.encodePath = function(item) {
        return window.encodeURIComponent(item).replace(/%2F/g, '/');
    };
    Drupal.deprecationError = function(_ref) {
        var message = _ref.message;
        if (drupalSettings.suppressDeprecationErrors === false && typeof console !== 'undefined' && console.warn) {
            console.warn('[Deprecation] ' + message);
        }
    };
    Drupal.deprecatedProperty = function(_ref2) {
        var target = _ref2.target,
            deprecatedProperty = _ref2.deprecatedProperty,
            message = _ref2.message;
        if (!Proxy || !Reflect) {
            return target;
        }
        return new Proxy(target, {
            get: function get(target, key) {
                for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                    rest[_key - 2] = arguments[_key];
                }
                if (key === deprecatedProperty) {
                    Drupal.deprecationError({
                        message: message
                    });
                }
                return Reflect.get.apply(Reflect, [target, key].concat(rest));
            }
        });
    };
    Drupal.theme = function(func) {
        if (func in Drupal.theme) {
            var _Drupal$theme;
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }
            return (_Drupal$theme = Drupal.theme)[func].apply(_Drupal$theme, args);
        }
    };
    Drupal.theme.placeholder = function(str) {
        return '<em class="placeholder">' + Drupal.checkPlain(str) + '</em>';
    };
})(Drupal, window.drupalSettings, window.drupalTranslations, window.console, window.Proxy, window.Reflect);;
if (window.jQuery) {
    jQuery.noConflict();
}
document.documentElement.className += ' js';
(function(Drupal, drupalSettings) {
    var domReady = function domReady(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            var listener = function listener() {
                callback();
                document.removeEventListener('DOMContentLoaded', listener);
            };
            document.addEventListener('DOMContentLoaded', listener);
        }
    };
    domReady(function() {
        Drupal.attachBehaviors(document, drupalSettings);
    });
})(Drupal, window.drupalSettings);;
/*! picturefill - v3.0.2 - 2016-02-12
 * https://scottjehl.github.io/picturefill/
 * Copyright (c) 2016 https://github.com/scottjehl/picturefill/blob/master/Authors.txt; Licensed MIT
 */
! function(a) {
    var b = navigator.userAgent;
    a.HTMLPictureElement && /ecko/.test(b) && b.match(/rv\:(\d+)/) && RegExp.$1 < 45 && addEventListener("resize", function() {
        var b, c = document.createElement("source"),
            d = function(a) {
                var b, d, e = a.parentNode;
                "PICTURE" === e.nodeName.toUpperCase() ? (b = c.cloneNode(), e.insertBefore(b, e.firstElementChild), setTimeout(function() {
                    e.removeChild(b)
                })) : (!a._pfLastSize || a.offsetWidth > a._pfLastSize) && (a._pfLastSize = a.offsetWidth, d = a.sizes, a.sizes += ",100vw", setTimeout(function() {
                    a.sizes = d
                }))
            },
            e = function() {
                var a, b = document.querySelectorAll("picture > img, img[srcset][sizes]");
                for (a = 0; a < b.length; a++) d(b[a])
            },
            f = function() {
                clearTimeout(b), b = setTimeout(e, 99)
            },
            g = a.matchMedia && matchMedia("(orientation: landscape)"),
            h = function() {
                f(), g && g.addListener && g.addListener(f)
            };
        return c.srcset = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", /^[c|i]|d$/.test(document.readyState || "") ? h() : document.addEventListener("DOMContentLoaded", h), f
    }())
}(window),
function(a, b, c) {
    "use strict";

    function d(a) {
        return " " === a || "	" === a || "\n" === a || "\f" === a || "\r" === a
    }

    function e(b, c) {
        var d = new a.Image;
        return d.onerror = function() {
            A[b] = !1, ba()
        }, d.onload = function() {
            A[b] = 1 === d.width, ba()
        }, d.src = c, "pending"
    }

    function f() {
        M = !1, P = a.devicePixelRatio, N = {}, O = {}, s.DPR = P || 1, Q.width = Math.max(a.innerWidth || 0, z.clientWidth), Q.height = Math.max(a.innerHeight || 0, z.clientHeight), Q.vw = Q.width / 100, Q.vh = Q.height / 100, r = [Q.height, Q.width, P].join("-"), Q.em = s.getEmValue(), Q.rem = Q.em
    }

    function g(a, b, c, d) {
        var e, f, g, h;
        return "saveData" === B.algorithm ? a > 2.7 ? h = c + 1 : (f = b - c, e = Math.pow(a - .6, 1.5), g = f * e, d && (g += .1 * e), h = a + g) : h = c > 1 ? Math.sqrt(a * b) : a, h > c
    }

    function h(a) {
        var b, c = s.getSet(a),
            d = !1;
        "pending" !== c && (d = r, c && (b = s.setRes(c), s.applySetCandidate(b, a))), a[s.ns].evaled = d
    }

    function i(a, b) {
        return a.res - b.res
    }

    function j(a, b, c) {
        var d;
        return !c && b && (c = a[s.ns].sets, c = c && c[c.length - 1]), d = k(b, c), d && (b = s.makeUrl(b), a[s.ns].curSrc = b, a[s.ns].curCan = d, d.res || aa(d, d.set.sizes)), d
    }

    function k(a, b) {
        var c, d, e;
        if (a && b)
            for (e = s.parseSet(b), a = s.makeUrl(a), c = 0; c < e.length; c++)
                if (a === s.makeUrl(e[c].url)) {
                    d = e[c];
                    break
                }
        return d
    }

    function l(a, b) {
        var c, d, e, f, g = a.getElementsByTagName("source");
        for (c = 0, d = g.length; d > c; c++) e = g[c], e[s.ns] = !0, f = e.getAttribute("srcset"), f && b.push({
            srcset: f,
            media: e.getAttribute("media"),
            type: e.getAttribute("type"),
            sizes: e.getAttribute("sizes")
        })
    }

    function m(a, b) {
        function c(b) {
            var c, d = b.exec(a.substring(m));
            return d ? (c = d[0], m += c.length, c) : void 0
        }

        function e() {
            var a, c, d, e, f, i, j, k, l, m = !1,
                o = {};
            for (e = 0; e < h.length; e++) f = h[e], i = f[f.length - 1], j = f.substring(0, f.length - 1), k = parseInt(j, 10), l = parseFloat(j), X.test(j) && "w" === i ? ((a || c) && (m = !0), 0 === k ? m = !0 : a = k) : Y.test(j) && "x" === i ? ((a || c || d) && (m = !0), 0 > l ? m = !0 : c = l) : X.test(j) && "h" === i ? ((d || c) && (m = !0), 0 === k ? m = !0 : d = k) : m = !0;
            m || (o.url = g, a && (o.w = a), c && (o.d = c), d && (o.h = d), d || c || a || (o.d = 1), 1 === o.d && (b.has1x = !0), o.set = b, n.push(o))
        }

        function f() {
            for (c(T), i = "", j = "in descriptor";;) {
                if (k = a.charAt(m), "in descriptor" === j)
                    if (d(k)) i && (h.push(i), i = "", j = "after descriptor");
                    else {
                        if ("," === k) return m += 1, i && h.push(i), void e();
                        if ("(" === k) i += k, j = "in parens";
                        else {
                            if ("" === k) return i && h.push(i), void e();
                            i += k
                        }
                    }
                else if ("in parens" === j)
                    if (")" === k) i += k, j = "in descriptor";
                    else {
                        if ("" === k) return h.push(i), void e();
                        i += k
                    }
                else if ("after descriptor" === j)
                    if (d(k));
                    else {
                        if ("" === k) return void e();
                        j = "in descriptor", m -= 1
                    }
                m += 1
            }
        }
        for (var g, h, i, j, k, l = a.length, m = 0, n = [];;) {
            if (c(U), m >= l) return n;
            g = c(V), h = [], "," === g.slice(-1) ? (g = g.replace(W, ""), e()) : f()
        }
    }

    function n(a) {
        function b(a) {
            function b() {
                f && (g.push(f), f = "")
            }

            function c() {
                g[0] && (h.push(g), g = [])
            }
            for (var e, f = "", g = [], h = [], i = 0, j = 0, k = !1;;) {
                if (e = a.charAt(j), "" === e) return b(), c(), h;
                if (k) {
                    if ("*" === e && "/" === a[j + 1]) {
                        k = !1, j += 2, b();
                        continue
                    }
                    j += 1
                } else {
                    if (d(e)) {
                        if (a.charAt(j - 1) && d(a.charAt(j - 1)) || !f) {
                            j += 1;
                            continue
                        }
                        if (0 === i) {
                            b(), j += 1;
                            continue
                        }
                        e = " "
                    } else if ("(" === e) i += 1;
                    else if (")" === e) i -= 1;
                    else {
                        if ("," === e) {
                            b(), c(), j += 1;
                            continue
                        }
                        if ("/" === e && "*" === a.charAt(j + 1)) {
                            k = !0, j += 2;
                            continue
                        }
                    }
                    f += e, j += 1
                }
            }
        }

        function c(a) {
            return k.test(a) && parseFloat(a) >= 0 ? !0 : l.test(a) ? !0 : "0" === a || "-0" === a || "+0" === a ? !0 : !1
        }
        var e, f, g, h, i, j, k = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i,
            l = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i;
        for (f = b(a), g = f.length, e = 0; g > e; e++)
            if (h = f[e], i = h[h.length - 1], c(i)) {
                if (j = i, h.pop(), 0 === h.length) return j;
                if (h = h.join(" "), s.matchesMedia(h)) return j
            }
        return "100vw"
    }
    b.createElement("picture");
    var o, p, q, r, s = {},
        t = !1,
        u = function() {},
        v = b.createElement("img"),
        w = v.getAttribute,
        x = v.setAttribute,
        y = v.removeAttribute,
        z = b.documentElement,
        A = {},
        B = {
            algorithm: ""
        },
        C = "data-pfsrc",
        D = C + "set",
        E = navigator.userAgent,
        F = /rident/.test(E) || /ecko/.test(E) && E.match(/rv\:(\d+)/) && RegExp.$1 > 35,
        G = "currentSrc",
        H = /\s+\+?\d+(e\d+)?w/,
        I = /(\([^)]+\))?\s*(.+)/,
        J = a.picturefillCFG,
        K = "position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)",
        L = "font-size:100%!important;",
        M = !0,
        N = {},
        O = {},
        P = a.devicePixelRatio,
        Q = {
            px: 1,
            "in": 96
        },
        R = b.createElement("a"),
        S = !1,
        T = /^[ \t\n\r\u000c]+/,
        U = /^[, \t\n\r\u000c]+/,
        V = /^[^ \t\n\r\u000c]+/,
        W = /[,]+$/,
        X = /^\d+$/,
        Y = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,
        Z = function(a, b, c, d) {
            a.addEventListener ? a.addEventListener(b, c, d || !1) : a.attachEvent && a.attachEvent("on" + b, c)
        },
        $ = function(a) {
            var b = {};
            return function(c) {
                return c in b || (b[c] = a(c)), b[c]
            }
        },
        _ = function() {
            var a = /^([\d\.]+)(em|vw|px)$/,
                b = function() {
                    for (var a = arguments, b = 0, c = a[0]; ++b in a;) c = c.replace(a[b], a[++b]);
                    return c
                },
                c = $(function(a) {
                    return "return " + b((a || "").toLowerCase(), /\band\b/g, "&&", /,/g, "||", /min-([a-z-\s]+):/g, "e.$1>=", /max-([a-z-\s]+):/g, "e.$1<=", /calc([^)]+)/g, "($1)", /(\d+[\.]*[\d]*)([a-z]+)/g, "($1 * e.$2)", /^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/gi, "") + ";"
                });
            return function(b, d) {
                var e;
                if (!(b in N))
                    if (N[b] = !1, d && (e = b.match(a))) N[b] = e[1] * Q[e[2]];
                    else try {
                        N[b] = new Function("e", c(b))(Q)
                    } catch (f) {}
                return N[b]
            }
        }(),
        aa = function(a, b) {
            return a.w ? (a.cWidth = s.calcListLength(b || "100vw"), a.res = a.w / a.cWidth) : a.res = a.d, a
        },
        ba = function(a) {
            if (t) {
                var c, d, e, f = a || {};
                if (f.elements && 1 === f.elements.nodeType && ("IMG" === f.elements.nodeName.toUpperCase() ? f.elements = [f.elements] : (f.context = f.elements, f.elements = null)), c = f.elements || s.qsa(f.context || b, f.reevaluate || f.reselect ? s.sel : s.selShort), e = c.length) {
                    for (s.setupRun(f), S = !0, d = 0; e > d; d++) s.fillImg(c[d], f);
                    s.teardownRun(f)
                }
            }
        };
    o = a.console && console.warn ? function(a) {
        console.warn(a)
    } : u, G in v || (G = "src"), A["image/jpeg"] = !0, A["image/gif"] = !0, A["image/png"] = !0, A["image/svg+xml"] = b.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1"), s.ns = ("pf" + (new Date).getTime()).substr(0, 9), s.supSrcset = "srcset" in v, s.supSizes = "sizes" in v, s.supPicture = !!a.HTMLPictureElement, s.supSrcset && s.supPicture && !s.supSizes && ! function(a) {
        v.srcset = "data:,a", a.src = "data:,a", s.supSrcset = v.complete === a.complete, s.supPicture = s.supSrcset && s.supPicture
    }(b.createElement("img")), s.supSrcset && !s.supSizes ? ! function() {
        var a = "data:image/gif;base64,R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==",
            c = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
            d = b.createElement("img"),
            e = function() {
                var a = d.width;
                2 === a && (s.supSizes = !0), q = s.supSrcset && !s.supSizes, t = !0, setTimeout(ba)
            };
        d.onload = e, d.onerror = e, d.setAttribute("sizes", "9px"), d.srcset = c + " 1w," + a + " 9w", d.src = c
    }() : t = !0, s.selShort = "picture>img,img[srcset]", s.sel = s.selShort, s.cfg = B, s.DPR = P || 1, s.u = Q, s.types = A, s.setSize = u, s.makeUrl = $(function(a) {
        return R.href = a, R.href
    }), s.qsa = function(a, b) {
        return "querySelector" in a ? a.querySelectorAll(b) : []
    }, s.matchesMedia = function() {
        return a.matchMedia && (matchMedia("(min-width: 0.1em)") || {}).matches ? s.matchesMedia = function(a) {
            return !a || matchMedia(a).matches
        } : s.matchesMedia = s.mMQ, s.matchesMedia.apply(this, arguments)
    }, s.mMQ = function(a) {
        return a ? _(a) : !0
    }, s.calcLength = function(a) {
        var b = _(a, !0) || !1;
        return 0 > b && (b = !1), b
    }, s.supportsType = function(a) {
        return a ? A[a] : !0
    }, s.parseSize = $(function(a) {
        var b = (a || "").match(I);
        return {
            media: b && b[1],
            length: b && b[2]
        }
    }), s.parseSet = function(a) {
        return a.cands || (a.cands = m(a.srcset, a)), a.cands
    }, s.getEmValue = function() {
        var a;
        if (!p && (a = b.body)) {
            var c = b.createElement("div"),
                d = z.style.cssText,
                e = a.style.cssText;
            c.style.cssText = K, z.style.cssText = L, a.style.cssText = L, a.appendChild(c), p = c.offsetWidth, a.removeChild(c), p = parseFloat(p, 10), z.style.cssText = d, a.style.cssText = e
        }
        return p || 16
    }, s.calcListLength = function(a) {
        if (!(a in O) || B.uT) {
            var b = s.calcLength(n(a));
            O[a] = b ? b : Q.width
        }
        return O[a]
    }, s.setRes = function(a) {
        var b;
        if (a) {
            b = s.parseSet(a);
            for (var c = 0, d = b.length; d > c; c++) aa(b[c], a.sizes)
        }
        return b
    }, s.setRes.res = aa, s.applySetCandidate = function(a, b) {
        if (a.length) {
            var c, d, e, f, h, k, l, m, n, o = b[s.ns],
                p = s.DPR;
            if (k = o.curSrc || b[G], l = o.curCan || j(b, k, a[0].set), l && l.set === a[0].set && (n = F && !b.complete && l.res - .1 > p, n || (l.cached = !0, l.res >= p && (h = l))), !h)
                for (a.sort(i), f = a.length, h = a[f - 1], d = 0; f > d; d++)
                    if (c = a[d], c.res >= p) {
                        e = d - 1, h = a[e] && (n || k !== s.makeUrl(c.url)) && g(a[e].res, c.res, p, a[e].cached) ? a[e] : c;
                        break
                    }
            h && (m = s.makeUrl(h.url), o.curSrc = m, o.curCan = h, m !== k && s.setSrc(b, h), s.setSize(b))
        }
    }, s.setSrc = function(a, b) {
        var c;
        a.src = b.url, "image/svg+xml" === b.set.type && (c = a.style.width, a.style.width = a.offsetWidth + 1 + "px", a.offsetWidth + 1 && (a.style.width = c))
    }, s.getSet = function(a) {
        var b, c, d, e = !1,
            f = a[s.ns].sets;
        for (b = 0; b < f.length && !e; b++)
            if (c = f[b], c.srcset && s.matchesMedia(c.media) && (d = s.supportsType(c.type))) {
                "pending" === d && (c = d), e = c;
                break
            }
        return e
    }, s.parseSets = function(a, b, d) {
        var e, f, g, h, i = b && "PICTURE" === b.nodeName.toUpperCase(),
            j = a[s.ns];
        (j.src === c || d.src) && (j.src = w.call(a, "src"), j.src ? x.call(a, C, j.src) : y.call(a, C)), (j.srcset === c || d.srcset || !s.supSrcset || a.srcset) && (e = w.call(a, "srcset"), j.srcset = e, h = !0), j.sets = [], i && (j.pic = !0, l(b, j.sets)), j.srcset ? (f = {
            srcset: j.srcset,
            sizes: w.call(a, "sizes")
        }, j.sets.push(f), g = (q || j.src) && H.test(j.srcset || ""), g || !j.src || k(j.src, f) || f.has1x || (f.srcset += ", " + j.src, f.cands.push({
            url: j.src,
            d: 1,
            set: f
        }))) : j.src && j.sets.push({
            srcset: j.src,
            sizes: null
        }), j.curCan = null, j.curSrc = c, j.supported = !(i || f && !s.supSrcset || g && !s.supSizes), h && s.supSrcset && !j.supported && (e ? (x.call(a, D, e), a.srcset = "") : y.call(a, D)), j.supported && !j.srcset && (!j.src && a.src || a.src !== s.makeUrl(j.src)) && (null === j.src ? a.removeAttribute("src") : a.src = j.src), j.parsed = !0
    }, s.fillImg = function(a, b) {
        var c, d = b.reselect || b.reevaluate;
        a[s.ns] || (a[s.ns] = {}), c = a[s.ns], (d || c.evaled !== r) && ((!c.parsed || b.reevaluate) && s.parseSets(a, a.parentNode, b), c.supported ? c.evaled = r : h(a))
    }, s.setupRun = function() {
        (!S || M || P !== a.devicePixelRatio) && f()
    }, s.supPicture ? (ba = u, s.fillImg = u) : ! function() {
        var c, d = a.attachEvent ? /d$|^c/ : /d$|^c|^i/,
            e = function() {
                var a = b.readyState || "";
                f = setTimeout(e, "loading" === a ? 200 : 999), b.body && (s.fillImgs(), c = c || d.test(a), c && clearTimeout(f))
            },
            f = setTimeout(e, b.body ? 9 : 99),
            g = function(a, b) {
                var c, d, e = function() {
                    var f = new Date - d;
                    b > f ? c = setTimeout(e, b - f) : (c = null, a())
                };
                return function() {
                    d = new Date, c || (c = setTimeout(e, b))
                }
            },
            h = z.clientHeight,
            i = function() {
                M = Math.max(a.innerWidth || 0, z.clientWidth) !== Q.width || z.clientHeight !== h, h = z.clientHeight, M && s.fillImgs()
            };
        Z(a, "resize", g(i, 99)), Z(b, "readystatechange", e)
    }(), s.picturefill = ba, s.fillImgs = ba, s.teardownRun = u, ba._ = s, a.picturefillCFG = {
        pf: s,
        push: function(a) {
            var b = a.shift();
            "function" == typeof s[b] ? s[b].apply(s, a) : (B[b] = a[0], S && s.fillImgs({
                reselect: !0
            }))
        }
    };
    for (; J && J.length;) a.picturefillCFG.push(J.shift());
    a.picturefill = ba, "object" == typeof module && "object" == typeof module.exports ? module.exports = ba : "function" == typeof define && define.amd && define("picturefill", function() {
        return ba
    }), s.supPicture || (A["image/webp"] = e("image/webp", "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA=="))
}(window, document);;
(function() {
    'use strict';
    Drupal.behaviors.quicklink = {
        attach: function attachQuicklink(context, settings) {
            var debug = settings.quicklink.debug;

            function hydrateQuicklinkConfig() {
                settings.quicklink.quicklinkConfig = settings.quicklink.quicklinkConfig || {};
                settings.quicklink.ignoredSelectorsLog = settings.quicklink.ignoredSelectorsLog || [];
                var quicklinkConfig = settings.quicklink.quicklinkConfig;
                quicklinkConfig.ignores = [];
                for (var i = 0; i < settings.quicklink.url_patterns_to_ignore.length; i++) {
                    var pattern = settings.quicklink.url_patterns_to_ignore[i];
                    (function(i, pattern) {
                        if (pattern.length) {
                            quicklinkConfig.ignores.push(function(uri, elem) {
                                var ruleName = 'Pattern found in href. See ignored selectors log.';
                                var ruleFunc = uri.includes(pattern);
                                outputDebugInfo(ruleFunc, ruleName, uri, elem, pattern);
                                return ruleFunc;
                            });
                        }
                    })(i, pattern);
                }
                if (settings.quicklink.ignore_admin_paths) {
                    var adminLinkContainerPatterns = settings.quicklink.admin_link_container_patterns.join();
                    quicklinkConfig.ignores.push(function(uri, elem) {
                        var ruleName = 'Exists in admin element container.';
                        var ruleFunc = elem.matches(adminLinkContainerPatterns);
                        outputDebugInfo(ruleFunc, ruleName, uri, elem);
                        return ruleFunc;
                    });
                }
                if (settings.quicklink.ignore_ajax_links) {
                    quicklinkConfig.ignores.push(function(uri, elem) {
                        var ruleName = 'Link has "use-ajax" CSS class.';
                        var ruleFunc = elem.classList.contains('use-ajax');
                        outputDebugInfo(ruleFunc, ruleName, uri, elem);
                        return ruleFunc;
                    });
                    quicklinkConfig.ignores.push(function(uri, elem) {
                        var ruleName = 'Link has "/ajax" in url.';
                        var ruleFunc = uri.includes('/ajax');
                        outputDebugInfo(ruleFunc, ruleName, uri, elem);
                        return ruleFunc;
                    });
                }
                if (settings.quicklink.ignore_file_ext) {
                    quicklinkConfig.ignores.push(function(uri, elem) {
                        var ruleName = 'Contains file extension at end of href.';
                        var ruleFunc = uri.match(/(\.[^\/]{1,5}\?)|(\.[^\/]{1,5}$)/);
                        outputDebugInfo(ruleFunc, ruleName, uri, elem);
                        return ruleFunc;
                    });
                }
                quicklinkConfig.ignores.push(function(uri, elem) {
                    var ruleName = 'Contains noprefetch attribute.';
                    var ruleFunc = elem.hasAttribute('noprefetch');
                    outputDebugInfo(ruleFunc, ruleName, uri, elem);
                    return ruleFunc;
                });
                quicklinkConfig.ignores.push(function(uri, elem) {
                    var ruleName = 'Contains download attribute.';
                    var ruleFunc = elem.hasAttribute('download');
                    outputDebugInfo(ruleFunc, ruleName, uri, elem);
                    return ruleFunc;
                });
                quicklinkConfig.origins = (settings.quicklink.allowed_domains) ? settings.quicklink.allowed_domains : false;
                quicklinkConfig.urls = (settings.quicklink.prefetch_only_paths) ? settings.quicklink.prefetch_only_paths : false;
            }

            function outputDebugInfo(ruleFunc, ruleName, uri, elem, pattern) {
                if (debug && ruleFunc) {
                    var debugMessage = ruleName + ' Link ignored.';
                    var thisLog = {};
                    var urlPattern = pattern || false;
                    elem.classList.add('quicklink-ignore');
                    elem.textContent += '🚫';
                    elem.dataset.quicklinkMatch = debugMessage;
                    thisLog.ruleName = ruleName;
                    thisLog.uri = uri;
                    thisLog.elem = elem;
                    thisLog.message = debugMessage;
                    if (urlPattern) {
                        thisLog.urlPattern = urlPattern;
                    }
                    (function(thisLog) {
                        settings.quicklink.ignoredSelectorsLog.push(thisLog);
                    })(thisLog);
                }
            }

            function loadQuicklink() {
                var urlParams = new URLSearchParams(window.location.search);
                var noprefetch = urlParams.get('noprefetch') !== null || window.location.hash === '#noprefetch';
                if (noprefetch && debug) {
                    console.info('The "noprefetch" parameter or hash exists in the URL. Quicklink library not loaded.');
                }
                return window.quicklink && !noprefetch;
            }
            if (!settings.quicklink.quicklinkConfig) {
                hydrateQuicklinkConfig();
            }
            settings.quicklink.quicklinkConfig.el = (settings.quicklink.selector) ? context.querySelector(settings.quicklink.selector) : context;
            if (debug) {
                console.info('Quicklink config object', settings.quicklink.quicklinkConfig);
                console.info('Quicklink module debug log', settings.quicklink.debug_log);
                console.info('Quicklink ignored selectors', settings.quicklink.ignoredSelectorsLog);
            }
            if (loadQuicklink()) {
                quicklink(settings.quicklink.quicklinkConfig);
            }
        }
    };
})();;
(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.dBlazy = factory();
    }
})(this, function() {
    'use strict';
    var dBlazy = {};
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }
    dBlazy.matches = function(elem, selector) {
        if (elem.matches(selector)) {
            return true;
        }
        return false;
    };
    dBlazy.pixelRatio = function() {
        return window.devicePixelRatio || 1;
    };
    dBlazy.windowWidth = function() {
        return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || window.screen.width;
    };
    dBlazy.windowSize = function() {
        return {
            width: this.windowWidth,
            height: window.innerHeight
        };
    };
    dBlazy.activeWidth = function(dataset, mobileFirst) {
        var me = this;
        var keys = Object.keys(dataset);
        var xs = keys[0];
        var xl = keys[keys.length - 1];
        var pr = (me.windowWidth() * me.pixelRatio());
        var ww = mobileFirst ? me.windowWidth() : pr;
        var mw = function(w) {
            return mobileFirst ? parseInt(w) <= ww : parseInt(w) >= ww;
        };
        var data = keys.filter(mw).map(function(v) {
            return dataset[v];
        })[mobileFirst ? 'pop' : 'shift']();
        return typeof data === 'undefined' ? dataset[ww >= xl ? xl : xs] : data;
    };
    dBlazy.equal = function(el, str) {
        return el !== null && el.nodeName.toLowerCase() === str;
    };
    dBlazy.closest = function(el, selector) {
        var parent;
        while (el) {
            parent = el.parentElement;
            if (parent && parent.matches(selector)) {
                return parent;
            }
            el = parent;
        }
        return null;
    };
    dBlazy.extend = Object.assign || function(out) {
        out = out || {};
        for (var i = 1, len = arguments.length; i < len; i++) {
            if (!arguments[i]) {
                continue;
            }
            for (var key in arguments[i]) {
                if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
                    out[key] = arguments[i][key];
                }
            }
        }
        return out;
    };
    dBlazy.forEach = function(collection, callback, scope) {
        var proto = Object.prototype;
        if (proto.toString.call(collection) === '[object Object]') {
            for (var prop in collection) {
                if (proto.hasOwnProperty.call(collection, prop)) {
                    callback.call(scope, collection[prop], prop, collection);
                }
            }
        } else if (collection) {
            for (var i = 0, len = collection.length; i < len; i++) {
                callback.call(scope, collection[i], i, collection);
            }
        }
    };
    dBlazy.hasClass = function(el, name) {
        if (el.classList) {
            return el.classList.contains(name);
        } else {
            return el.className.indexOf(name) !== -1;
        }
    };
    dBlazy.attr = function(el, attr, def) {
        def = def || '';
        return el !== null && el.hasAttribute(attr) ? el.getAttribute(attr) : def;
    };
    dBlazy.setAttr = function(el, attr, remove) {
        if (el && el.hasAttribute('data-' + attr)) {
            var dataAttr = el.getAttribute('data-' + attr);
            if (attr === 'src') {
                el.src = dataAttr;
            } else {
                el.setAttribute(attr, dataAttr);
            }
            if (remove) {
                el.removeAttribute('data-' + attr);
            }
        }
    };
    dBlazy.setAttrs = function(el, attrs, remove) {
        var me = this;
        me.forEach(attrs, function(src) {
            me.setAttr(el, src, remove);
        });
    };
    dBlazy.setAttrsWithSources = function(el, attr, remove) {
        var me = this;
        var parent = el.parentNode || null;
        var isPicture = parent && me.equal(parent, 'picture');
        var targets = isPicture ? parent.getElementsByTagName('source') : el.getElementsByTagName('source');
        attr = attr || (isPicture ? 'srcset' : 'src');
        if (targets.length) {
            me.forEach(targets, function(source) {
                me.setAttr(source, attr, remove);
            });
        }
    };
    dBlazy.isDecoded = function(img) {
        if ('decoded' in img) {
            return img.decoded;
        }
        return img.complete;
    };
    dBlazy.decode = function(img) {
        var me = this;
        if (me.isDecoded(img)) {
            return Promise.resolve(img);
        }
        if ('decode' in img) {
            return img.decode();
        }
        return new Promise(function(resolve, reject) {
            img.onload = function() {
                resolve(img);
            };
            img.onerror = reject();
        });
    };
    dBlazy.updateBg = function(el, mobileFirst) {
        var me = this;
        var backgrounds = me.parse(el.getAttribute('data-backgrounds'));
        if (backgrounds) {
            var bg = me.activeWidth(backgrounds, mobileFirst);
            if (bg && bg !== 'undefined') {
                el.style.backgroundImage = 'url("' + bg.src + '")';
                if (bg.ratio && !el.classList.contains('b-noratio')) {
                    el.style.paddingBottom = bg.ratio + '%';
                }
            }
        }
    };
    dBlazy.removeAttrs = function(el, attrs) {
        this.forEach(attrs, function(attr) {
            el.removeAttribute('data-' + attr);
        });
    };
    dBlazy.binding = function(which, el, eventName, fn, params) {
        if (el && typeof fn === 'function') {
            var defaults = {
                capture: false,
                passive: true
            };
            var extras;
            if (typeof params === 'boolean') {
                extras = params;
            } else {
                extras = params ? this.extend(defaults, params) : defaults;
            }
            var bind = function(e) {
                if (el.attachEvent) {
                    el[(which === 'bind' ? 'attach' : 'detach') + 'Event']('on' + e, fn, extras);
                } else {
                    el[(which === 'bind' ? 'add' : 'remove') + 'EventListener'](e, fn, extras);
                }
            };
            if (eventName.indexOf(' ') > 0) {
                this.forEach(eventName.split(' '), bind);
            } else {
                bind(eventName);
            }
        }
    };
    dBlazy.onoff = function(which, elm, eventName, childEl, callback, params) {
        params = params || {
            capture: true,
            passive: false
        };
        var bind = function(e) {
            var t = e.target;
            e.delegateTarget = elm;
            while (t && t !== this) {
                if (dBlazy.matches(t, childEl)) {
                    callback.call(t, e);
                }
                t = t.parentNode;
            }
        };
        this.binding(which === 'on' ? 'bind' : 'unbind', elm, eventName, bind, params);
    };
    dBlazy.on = function(elm, eventName, childEl, callback, params) {
        this.onoff('on', elm, eventName, childEl, callback, params);
    };
    dBlazy.off = function(elm, eventName, childEl, callback, params) {
        this.onoff('off', elm, eventName, childEl, callback, params);
    };
    dBlazy.bindEvent = function(el, eventName, fn, params) {
        this.binding('bind', el, eventName, fn, params);
    };
    dBlazy.unbindEvent = function(el, eventName, fn, params) {
        this.binding('unbind', el, eventName, fn, params);
    };
    dBlazy.once = function(fn) {
        var result;
        var ran = false;
        return function proxy() {
            if (ran) {
                return result;
            }
            ran = true;
            result = fn.apply(this, arguments);
            fn = null;
            return result;
        };
    };
    dBlazy.parse = function(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return false;
        }
    };
    dBlazy.animate = function(el, animation) {
        var me = this;
        var props = ['animation', 'animation-duration', 'animation-delay', 'animation-iteration-count'];
        animation = animation || el.dataset.animation;
        el.classList.add('animated', animation);
        me.forEach(['Duration', 'Delay', 'IterationCount'], function(key) {
            if ('animation' + key in el.dataset) {
                el.style['animation' + key] = el.dataset['animation' + key];
            }
        });
        var cn = me.closest(el, '.media');
        cn = cn === null ? el : cn;
        var blur = cn.querySelector('.b-blur--tmp');

        function animationEnd() {
            me.removeAttrs(el, props);
            el.classList.add('is-b-animated');
            el.classList.remove('animated', animation);
            me.forEach(props, function(key) {
                el.style.removeProperty(key);
            });
            if (blur !== null && blur.parentNode !== null) {
                blur.parentNode.removeChild(blur);
            }
            me.unbindEvent(el, 'animationend', animationEnd);
        }
        me.bindEvent(el, 'animationend', animationEnd);
    };
    dBlazy.clearLoading = function(el) {
        var me = this;
        var loaders = [el, me.closest(el, '[class*="loading"]')];
        this.forEach(loaders, function(loader) {
            if (loader !== null) {
                loader.className = loader.className.replace(/(\S+)loading/g, '');
            }
        });
    };
    dBlazy.throttle = function(fn, minDelay, scope) {
        var lastCall = 0;
        return function() {
            var now = +new Date();
            if (now - lastCall < minDelay) {
                return;
            }
            lastCall = now;
            fn.apply(scope, arguments);
        };
    };
    dBlazy.resize = function(c, t) {
        window.onresize = function() {
            window.clearTimeout(t);
            t = window.setTimeout(c, 200);
        };
        return c;
    };
    dBlazy.trigger = function(elm, eventName, custom, param) {
        var event;
        var data = {
            detail: custom || {}
        };
        if (typeof param === 'undefined') {
            data.bubbles = true;
            data.cancelable = true;
        }
        if (typeof window.CustomEvent === 'function') {
            event = new CustomEvent(eventName, data);
        } else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, data);
        }
        elm.dispatchEvent(event);
    };
    return dBlazy;
});;
(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([window.dBlazy], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(window.dBlazy);
    } else {
        root.Bio = factory(window.dBlazy);
    }
})(this, function(dBlazy) {
    'use strict';
    var _doc = document;
    var _db = dBlazy;
    var _bioTick = 0;
    var _revTick = 0;
    var _disconnected = false;
    var _observed = false;

    function Bio(options) {
        var me = this;
        me.options = _db.extend({}, me.defaults, options || {});
        _disconnected = false;
        _observed = false;
        init(me);
    }
    var _proto = Bio.prototype;
    _proto.constructor = Bio;
    _proto.count = 0;
    _proto.counted = -1;
    _proto.erCounted = 0;
    _proto._er = -1;
    _proto._ok = 1;
    _proto.defaults = {
        root: null,
        decode: false,
        disconnect: false,
        error: false,
        success: false,
        intersecting: false,
        observing: false,
        successClass: 'b-loaded',
        selector: '.b-lazy',
        errorClass: 'b-error',
        bgClass: 'b-bg',
        rootMargin: '0px',
        threshold: [0]
    };
    _proto.load = function(elms) {
        var me = this;
        if (me.isValid(elms)) {
            me.intersecting(elms);
        } else {
            _db.forEach(elms, function(el) {
                if (me.isValid(el)) {
                    me.intersecting(el);
                }
            });
        }
        if (!_disconnected) {
            me.disconnect();
        }
    };
    _proto.isLoaded = function(el) {
        return el.classList.contains(this.options.successClass);
    };
    _proto.isValid = function(el) {
        return typeof el === 'object' && typeof el.length === 'undefined' && !this.isLoaded(el);
    };
    _proto.prepare = function() {};
    _proto.revalidate = function(force) {
        var me = this;
        if ((force === true || me.count !== me.counted) && (_revTick < me.counted)) {
            _disconnected = false;
            me.elms = (me.options.root || _doc).querySelectorAll(me.options.selector);
            me.observe();
            _revTick++;
        }
    };
    _proto.intersecting = function(el) {
        var me = this;
        if (typeof me.options.intersecting === 'function') {
            me.options.intersecting(el, me.options);
        }
        _db.trigger(el, 'bio.intersecting', {
            options: me.options
        });
        me.lazyLoad(el);
        me.counted++;
        if (!_disconnected) {
            me.observer.unobserve(el);
        }
    };
    _proto.lazyLoad = function(el) {};
    _proto.success = function(el, status, parent) {
        var me = this;
        if (typeof me.options.success === 'function') {
            me.options.success(el, status, parent, me.options);
        }
        if (me.erCounted > 0) {
            me.erCounted--;
        }
    };
    _proto.error = function(el, status, parent) {
        var me = this;
        if (typeof me.options.error === 'function') {
            me.options.error(el, status, parent, me.options);
        }
        me.erCounted++;
    };
    _proto.loaded = function(el, status, parent) {
        var me = this;
        el.classList.add(status === me._ok ? me.options.successClass : me.options.errorClass);
        me[status === me._ok ? 'success' : 'error'](el, status, parent);
    };
    _proto.observe = function() {
        var me = this;
        _bioTick = me.elms.length;
        _db.forEach(me.elms, function(entry) {
            if (!me.isLoaded(entry)) {
                me.observer.observe(entry);
            }
        });
    };
    _proto.observing = function(entries, observer) {
        var me = this;
        me.entries = entries;
        if (_disconnected) {
            return;
        }
        _db.forEach(entries, function(entry) {
            if (typeof me.options.observing === 'function') {
                me.options.observing(entry, observer, me.options);
            }
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
                if (!me.isLoaded(entry.target)) {
                    me.intersecting(entry.target);
                }
                _bioTick--;
            }
        });
        me.disconnect();
    };
    _proto.disconnect = function(force) {
        var me = this;
        if (me.erCounted > 0 && !force) {
            return;
        }
        if (((_bioTick === 0 || me.count === me.counted) && me.options.disconnect) || force) {
            me.observer.disconnect();
            me.count = 0;
            me.elms = null;
            _disconnected = true;
        }
    };
    _proto.destroy = function(force) {
        var me = this;
        me.disconnect(force);
        me.observer = null;
    };
    _proto.disconnected = function() {
        return _disconnected;
    };
    _proto.reinit = function() {
        _disconnected = false;
        _observed = false;
        init(this);
    };

    function init(me) {
        var config = {
            rootMargin: me.options.rootMargin,
            threshold: me.options.threshold
        };
        me.elms = (me.options.root || _doc).querySelectorAll(me.options.selector + ':not(.' + me.options.successClass + ')');
        me.count = me.elms.length;
        me.windowWidth = _db.windowWidth();
        me.prepare();
        me.observer = new IntersectionObserver(me.observing.bind(me), config);
        if (!_observed) {
            me.observe();
            _observed = true;
        }
    }
    return Bio;
});;