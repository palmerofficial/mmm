Drupal.debounce = function(func, wait, immediate) {
    var timeout = void 0;
    var result = void 0;
    return function() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }
        var context = this;
        var later = function later() {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
        }
        return result;
    };
};;
window.matchMedia || (window.matchMedia = function() {
    "use strict";
    var e = window.styleMedia || window.media;
    if (!e) {
        var t = document.createElement("style"),
            i = document.getElementsByTagName("script")[0],
            n = null;
        t.type = "text/css";
        t.id = "matchmediajs-test";
        i.parentNode.insertBefore(t, i);
        n = "getComputedStyle" in window && window.getComputedStyle(t, null) || t.currentStyle;
        e = {
            matchMedium: function(e) {
                var i = "@media " + e + "{ #matchmediajs-test { width: 1px; } }";
                if (t.styleSheet) {
                    t.styleSheet.cssText = i
                } else {
                    t.textContent = i
                }
                return n.width === "1px"
            }
        }
    }
    return function(t) {
        return {
            matches: e.matchMedium(t || "all"),
            media: t || "all"
        }
    }
}());;