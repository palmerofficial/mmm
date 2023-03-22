(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([window.dBlazy, window.Bio], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(window.dBlazy, window.Bio);
    } else {
        root.BioMedia = factory(window.dBlazy, window.Bio);
    }
})(this, function(dBlazy, Bio) {
    'use strict';
    var _db = dBlazy;
    var _bio = Bio;
    var _src = 'src';
    var _srcSet = 'srcset';
    var _bgSrc = 'data-src';
    var _dataSrc = 'data-src';
    var _dataSrcset = 'data-srcset';
    var _bgSources = [_src];
    var _imgSources = [_srcSet, _src];

    function BioMedia(options) {
        return _bio.apply(this, arguments);
    }
    var _proto = BioMedia.prototype = Object.create(Bio.prototype);
    _proto.constructor = BioMedia;
    _proto.lazyLoad = (function(_bio) {
        return function(el) {
            if (el.hasAttribute('data-bio-hit')) {
                return;
            }
            var me = this;
            var parent = el.parentNode;
            var isImage = _db.equal(el, 'img');
            var isBg = typeof el.src === 'undefined' && el.classList.contains(me.options.bgClass);
            var isPicture = parent && _db.equal(parent, 'picture');
            var isVideo = _db.equal(el, 'video');
            if (isPicture) {
                _db.setAttrsWithSources(el, _srcSet, true);
                _db.setAttr(el, _src, true);
                me.loaded(el, me._ok);
            } else if (isVideo) {
                _db.setAttrsWithSources(el, _src, true);
                el.load();
                me.loaded(el, me._ok);
            } else {
                if (isImage || isBg) {
                    me.setImage(el, isBg);
                } else {
                    if (el.getAttribute(_dataSrc) && el.hasAttribute(_src)) {
                        _db.setAttr(el, _src, true);
                        me.loaded(el, me._ok);
                    }
                }
            }
            el.setAttribute('data-bio-hit', 1);
            return _bio.apply(this, arguments);
        };
    })(_proto.lazyLoad);
    _proto.setImage = function(el, isBg) {
        var me = this;
        var img = new Image();
        var isResimage = el.hasAttribute(_dataSrcset);
        var applyAttrs = function() {
            if (isBg) {
                me.setBg(el);
            } else {
                _db.setAttrs(el, _imgSources, false);
            }
        };
        var load = function(ok) {
            applyAttrs();
            me.loaded(el, ok ? me._ok : me._er);
            if (ok) {
                _db.removeAttrs(el, isBg ? _bgSources : _imgSources);
            }
        };
        _db.decode(img).then(function() {
            load(true);
        }).catch(function() {
            load(isResimage);
            if (!isResimage) {
                el.removeAttribute('data-bio-hit');
            }
        }).finally(function() {
            _db.trigger(el, 'bio.finally', {
                options: me.options
            });
        });
        if ('decode' in img) {
            img.decoding = 'async';
        }
        img.src = el.getAttribute(isBg ? _bgSrc : _dataSrc);
        if (isResimage) {
            img.srcset = el.getAttribute(_dataSrcset);
        }
    };
    _proto.setBg = function(el) {
        if (el.hasAttribute(_bgSrc)) {
            el.style.backgroundImage = 'url("' + el.getAttribute(_bgSrc) + '")';
            el.removeAttribute(_src);
        }
    };
    return BioMedia;
});;
(function(Drupal, drupalSettings, _db, window, document) {
    'use strict';
    var _dataAnimation = 'data-animation';
    var _dataDimensions = 'data-dimensions';
    var _dataBg = 'data-backgrounds';
    var _dataRatio = 'data-ratio';
    var _isNativeExecuted = false;
    var _resizeTick = 0;
    Drupal.blazy = Drupal.blazy || {
        context: null,
        init: null,
        instances: [],
        items: [],
        windowWidth: 0,
        blazySettings: drupalSettings.blazy || {},
        ioSettings: drupalSettings.blazyIo || {},
        revalidate: false,
        options: {},
        globals: function() {
            var me = this;
            var commons = {
                success: me.clearing.bind(me),
                error: me.clearing.bind(me),
                selector: '.b-lazy',
                errorClass: 'b-error',
                successClass: 'b-loaded'
            };
            return _db.extend(me.blazySettings, me.ioSettings, commons);
        },
        clearing: function(el) {
            var me = this;
            var cn = _db.closest(el, '.media');
            var an = _db.closest(el, '[' + _dataAnimation + ']');
            _db.clearLoading(el);
            me.reevaluate(el);
            me.updateContainer(el, cn);
            if (an !== null || me.has(el, _dataAnimation)) {
                _db.animate(an !== null ? an : el);
            }
            _db.trigger(el, 'blazy.done', {
                options: me.options
            });
            if (!_isNativeExecuted) {
                _db.trigger(me.context, 'blazy.native', {
                    options: me.options
                });
                _isNativeExecuted = true;
            }
        },
        isLoaded: function(el) {
            return el !== null && el.classList.contains(this.options.successClass);
        },
        reevaluate: function(el) {
            var me = this;
            var ie = el.classList.contains('b-responsive') && el.hasAttribute('data-pfsrc');
            if (me.init !== null && _db.hasClass(el, me.options.errorClass) && !_db.hasClass(el, 'b-checked')) {
                el.classList.add('b-checked');
                window.setTimeout(function() {
                    if (me.has(el, _dataBg)) {
                        _db.updateBg(el, me.options.mobileFirst);
                    } else {
                        me.init.load(el);
                    }
                }, 100);
            }
            if (window.picturefill && ie) {
                window.picturefill({
                    reevaluate: true,
                    elements: [el]
                });
            }
        },
        has: function(el, attribute) {
            return el !== null && el.hasAttribute(attribute);
        },
        contains: function(el, name) {
            return el !== null && el.classList.contains(name);
        },
        updateContainer: function(el, cn) {
            var me = this;
            var isPicture = _db.equal(el.parentNode, 'picture') && me.has(cn, _dataDimensions);
            window.setTimeout(function() {
                if (me.isLoaded(el)) {
                    (me.contains(cn, 'media') ? cn : el).classList.add('is-b-loaded');
                    if (isPicture) {
                        me.updatePicture(el, cn);
                    }
                    if (me.has(el, _dataBg)) {
                        _db.updateBg(el, me.options.mobileFirst);
                    }
                }
            });
        },
        updatePicture: function(el, cn) {
            var me = this;
            var pad = Math.round(((el.naturalHeight / el.naturalWidth) * 100), 2);
            cn.style.paddingBottom = pad + '%';
            if (me.instances.length > 0) {
                var picture = function(elm) {
                    if (!('blazyInstance' in elm) && !('blazyUniform' in elm)) {
                        return;
                    }
                    if ((elm.blazyInstance === cn.blazyInstance) && (_resizeTick > 1 || !('isBlazyPicture' in elm))) {
                        _db.trigger(elm, 'blazy.uniform.' + elm.blazyInstance, {
                            pad: pad
                        });
                        elm.isBlazyPicture = true;
                    }
                };
                _db.forEach(me.instances, function(elm) {
                    Drupal.debounce(picture(elm), 201, true);
                }, me.context);
            }
        },
        fixMissingDataUri: function() {
            var me = this;
            var doc = me.context;
            var sel = me.options.selector + '[src^="image"]:not(.' + me.options.successClass + ')';
            var els = doc.querySelector(sel) === null ? [] : doc.querySelectorAll(sel);
            var fixDataUri = function(img) {
                var src = img.getAttribute('src');
                if (src.indexOf('base64') !== -1 || src.indexOf('svg+xml') !== -1) {
                    img.setAttribute('src', src.replace('image', 'data:image'));
                }
            };
            if (els.length > 0) {
                _db.forEach(els, fixDataUri);
            }
        },
        updateRatio: function(cn) {
            var me = this;
            var el = _db.closest(cn, '.blazy');
            var dimensions = _db.parse(cn.getAttribute(_dataDimensions));
            if (!dimensions) {
                me.updateFallbackRatio(cn);
                return;
            }
            var isPicture = cn.querySelector('picture') !== null && _resizeTick > 0;
            var pad = _db.activeWidth(dimensions, isPicture);
            cn.blazyInstance = el !== null && 'blazyInstance' in el ? el.blazyInstance : null;
            if (pad !== 'undefined') {
                cn.style.paddingBottom = pad + '%';
            }
            if (_resizeTick > 0 && (isPicture || me.has(cn, _dataBg))) {
                me.updateContainer((isPicture ? cn.querySelector('img') : cn), cn);
            }
        },
        updateFallbackRatio: function(cn) {
            if (!cn.hasAttribute('style') && cn.hasAttribute(_dataRatio)) {
                cn.style.paddingBottom = cn.getAttribute(_dataRatio) + '%';
            }
        },
        doNativeLazy: function() {
            var me = this;
            if (!me.isNativeLazy()) {
                return;
            }
            var doc = me.context;
            var sel = me.options.selector + '[loading]:not(.' + me.options.successClass + ')';
            me.items = doc.querySelector(sel) === null ? [] : doc.querySelectorAll(sel);
            if (me.items.length === 0) {
                return;
            }
            var onNativeEvent = function(e) {
                var el = e.target;
                var er = e.type === 'error';
                el.classList.add(me.options[er ? 'errorClass' : 'successClass']);
                me.clearing(el);
                _db.unbindEvent(el, e.type, onNativeEvent);
            };
            var doNative = function(el) {
                _db.setAttrs(el, ['srcset', 'src'], true);
                _db.setAttrsWithSources(el, false, true);
                if (me.contains(el, 'b-blur')) {
                    el.removeAttribute('loading');
                } else {
                    el.classList.add(me.options.successClass);
                    _db.bindEvent(el, 'load', onNativeEvent);
                    _db.bindEvent(el, 'error', onNativeEvent);
                }
            };
            var onNative = function() {
                _db.forEach(me.items, doNative);
            };
            _db.bindEvent(me.context, 'blazy.native', onNative, {
                once: true
            });
        },
        isNativeLazy: function() {
            return 'loading' in HTMLImageElement.prototype;
        },
        isIo: function() {
            return this.ioSettings && this.ioSettings.enabled && 'IntersectionObserver' in window;
        },
        isRo: function() {
            return 'ResizeObserver' in window;
        },
        isBlazy: function() {
            return !this.isIo() && 'Blazy' in window;
        },
        forEach: function(context) {
            var blazies = context.querySelectorAll('.blazy:not(.blazy--on)');
            if (blazies.length > 0) {
                _db.forEach(blazies, doBlazy, context);
            }
            initBlazy(context);
        },
        run: function(opts) {
            return this.isIo() ? new BioMedia(opts) : new Blazy(opts);
        },
        afterInit: function() {
            var me = this;
            var doc = me.context;
            var rObserver = false;
            var ratioItems = doc.querySelector('.media--ratio') === null ? [] : doc.querySelectorAll('.media--ratio');
            var shouldLoop = ratioItems.length > 0;
            var loopRatio = function(entries) {
                me.windowWidth = _db.windowWidth();
                if (!me.isNativeLazy() && (me.isBlazy() || me.revalidate)) {
                    me.init.revalidate(true);
                }
                if (shouldLoop) {
                    _db.forEach(entries, function(entry) {
                        me.updateRatio('target' in entry ? entry.target : entry);
                    }, doc);
                }
                _resizeTick++;
                return false;
            };
            var checkRatio = function() {
                return me.isRo() ? new ResizeObserver(loopRatio) : loopRatio(ratioItems);
            };
            rObserver = checkRatio();
            if (rObserver) {
                if (shouldLoop) {
                    _db.forEach(ratioItems, function(entry) {
                        rObserver.observe(entry);
                    }, doc);
                }
            } else {
                _db.bindEvent(window, 'resize', Drupal.debounce(checkRatio, 200, true));
            }
        }
    };
    var initBlazy = function(context) {
        var me = Drupal.blazy;
        var documentElement = context instanceof HTMLDocument ? context : _db.closest(context, 'html');
        var opts = {};
        opts.mobileFirst = opts.mobileFirst || false;
        documentElement = documentElement || document;
        if (!document.documentElement.isSameNode(documentElement)) {
            opts.root = documentElement;
        }
        me.options = _db.extend({}, me.globals(), opts);
        me.context = documentElement;
        var scrollElms = '#drupal-modal, .is-b-scroll';
        if (me.options.container) {
            scrollElms += ', ' + me.options.container.trim();
        }
        me.options.container = scrollElms;
        me.fixMissingDataUri();
        me.doNativeLazy();
        me.init = me.run(me.options);
        me.afterInit();
    };

    function doBlazy(elm) {
        var me = Drupal.blazy;
        var dataAttr = elm.getAttribute('data-blazy');
        var opts = (!dataAttr || dataAttr === '1') ? {} : (_db.parse(dataAttr) || {});
        var isUniform = me.contains(elm, 'blazy--field') || me.contains(elm, 'block-grid') || me.contains(elm, 'blazy--uniform');
        var instance = (Math.random() * 10000).toFixed(0);
        var eventId = 'blazy.uniform.' + instance;
        var localItems = elm.querySelector('.media--ratio') === null ? [] : elm.querySelectorAll('.media--ratio');
        me.options = _db.extend(me.options, opts);
        me.revalidate = me.revalidate || elm.classList.contains('blazy--revalidate');
        elm.classList.add('blazy--on');
        elm.blazyInstance = instance;
        if (isUniform) {
            elm.blazyUniform = true;
        }
        me.instances.push(elm);
        var swapRatio = function(e) {
            var pad = e.detail.pad || 0;
            if (pad > 10) {
                _db.forEach(localItems, function(cn) {
                    cn.style.paddingBottom = pad + '%';
                }, elm);
            }
        };
        if (isUniform && localItems.length > 0) {
            _db.bindEvent(elm, eventId, swapRatio);
        }
    }
    Drupal.behaviors.blazy = {
        attach: function(context) {
            context = context || document;
            if ('length' in context) {
                context = context[0];
            }
            _db.once(Drupal.blazy.forEach(context));
        }
    };
}(Drupal, drupalSettings, dBlazy, this, this.document));;
(function(Drupal) {
    'use strict';
    Drupal.behaviors.addToAny = {
        attach: function(context, settings) {
            if (context !== document && window.a2a) {
                a2a.init_all();
            }
        }
    };
})(Drupal);;
(function($) {
    Drupal.behaviors.dataLayer = {
        langPrefixes: function langPrefixes() {
            var languages = Drupal.settings.dataLayer.languages,
                langList = [];
            for (var lang in languages) {
                if (languages[lang].prefix !== '') {
                    langList.push(languages[lang].prefix);
                }
            }
            return langList;
        },
        attach: function() {
            return
        }
    };
})(jQuery);;
(function($, Drupal, drupalSettings) {
    'use strict';
    Drupal.google_analytics = {};
    $(document).ready(function() {
        $(document.body).on('mousedown keyup touchstart', function(event) {
            $(event.target).closest('a,area').each(function() {
                if (Drupal.google_analytics.isInternal(this.href)) {
                    if ($(this).is('.colorbox') && (drupalSettings.google_analytics.trackColorbox)) {} else if (drupalSettings.google_analytics.trackDownload && Drupal.google_analytics.isDownload(this.href)) {
                        gtag('event', Drupal.google_analytics.getDownloadExtension(this.href).toUpperCase(), {
                            event_category: 'Downloads',
                            event_label: Drupal.google_analytics.getPageUrl(this.href),
                            transport_type: 'beacon'
                        });
                    } else if (Drupal.google_analytics.isInternalSpecial(this.href)) {
                        gtag('config', drupalSettings.google_analytics.account, {
                            page_path: Drupal.google_analytics.getPageUrl(this.href),
                            transport_type: 'beacon'
                        });
                    }
                } else {
                    if (drupalSettings.google_analytics.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
                        gtag('event', 'Click', {
                            event_category: 'Mails',
                            event_label: this.href.substring(7),
                            transport_type: 'beacon'
                        });
                    } else if (drupalSettings.google_analytics.trackOutbound && this.href.match(/^\w+:\/\//i)) {
                        if (drupalSettings.google_analytics.trackDomainMode !== 2 || (drupalSettings.google_analytics.trackDomainMode === 2 && !Drupal.google_analytics.isCrossDomain(this.hostname, drupalSettings.google_analytics.trackCrossDomains))) {
                            gtag('event', 'Click', {
                                event_category: 'Outbound links',
                                event_label: this.href,
                                transport_type: 'beacon'
                            });
                        }
                    }
                }
            });
        });
        if (drupalSettings.google_analytics.trackUrlFragments) {
            window.onhashchange = function() {
                gtag('config', drupalSettings.google_analytics.account, {
                    page_path: location.pathname + location.search + location.hash
                });
            };
        }
        if (drupalSettings.google_analytics.trackColorbox) {
            $(document).on('cbox_complete', function() {
                var href = $.colorbox.element().attr('href');
                if (href) {
                    gtag('config', drupalSettings.google_analytics.account, {
                        page_path: Drupal.google_analytics.getPageUrl(href)
                    });
                }
            });
        }
    });
    Drupal.google_analytics.isCrossDomain = function(hostname, crossDomains) {
        return $.inArray(hostname, crossDomains) > -1 ? true : false;
    };
    Drupal.google_analytics.isDownload = function(url) {
        var isDownload = new RegExp('\\.(' + drupalSettings.google_analytics.trackDownloadExtensions + ')([\?#].*)?$', 'i');
        return isDownload.test(url);
    };
    Drupal.google_analytics.isInternal = function(url) {
        var isInternal = new RegExp('^(https?):\/\/' + window.location.host, 'i');
        return isInternal.test(url);
    };
    Drupal.google_analytics.isInternalSpecial = function(url) {
        var isInternalSpecial = new RegExp('(\/go\/.*)$', 'i');
        return isInternalSpecial.test(url);
    };
    Drupal.google_analytics.getPageUrl = function(url) {
        var extractInternalUrl = new RegExp('^(https?):\/\/' + window.location.host, 'i');
        return url.replace(extractInternalUrl, '');
    };
    Drupal.google_analytics.getDownloadExtension = function(url) {
        var extractDownloadextension = new RegExp('\\.(' + drupalSettings.google_analytics.trackDownloadExtensions + ')([\?#].*)?$', 'i');
        var extension = extractDownloadextension.exec(url);
        return (extension === null) ? '' : extension[1];
    };
})(jQuery, Drupal, drupalSettings);
(function($) {
    $(document).ready(function() {
        $('.content iframe.video-filter').wrap('<div class="yt-wrapper"></div>');
        $('iframe[src*="youtube.com"]').attr('src', function() {
            return this.src + '&rel=0&autohide=0&modestbranding=1&showinfo=0&iv_load_policy=3';
        });
    });
    $(document).ready(function() {
        if ($('.sidebarRight').css('float') == 'left') {
            $('.gallery-wrapper .view-content').hover(function() {
                $('.gallery-wrapper .view-content').wrap('<div class="gallery-ads-wrapper"></div>');
                $('<div class="gallery-ads-right"></div>').appendTo('.gallery-wrapper .view-content');
                $('<div class="gallery-ads-bottom"></div>').appendTo('.gallery-wrapper .view-content');
            }, function() {
                $('.gallery-wrapper .view-content').unwrap();
                $('.gallery-ads-bottom').remove();
                $('.gallery-ads-right').remove();
            });
        }
    });

    function externalLinks() {
        for (var c = document.getElementsByTagName("a"), a = 0; a < c.length; a++) {
            var b = c[a];
            b.getAttribute("href") && b.hostname !== location.hostname && (b.target = "_blank")
        }
    };
    externalLinks();
    $(document).ready(function() {
        $('.news-body p').each(function() {
            var $this = $(this);
            if ($this.html().replace(/\s|&nbsp;/g, '').length == 0)
                $this.remove();
        });
    });
    $(document).ready(function() {
        $('#div-gpt-ad-1465467936753-0').mouseover(function() {
            $('#div-gpt-ad-1465467936753-0 iframe').css("height", "410px");
        });
        $('#div-gpt-ad-1465467936753-0').mouseout(function() {
            $('#div-gpt-ad-1465467936753-0 iframe').delay(500).queue(function(next) {
                $(this).css("height", "90px");
                next();
            });
        });
        $('#div-gpt-ad-1465467936753-1').mouseover(function() {
            $('#div-gpt-ad-1465467936753-1').css("overflow", "visible");
        });
        $('#div-gpt-ad-1465467936753-1').mouseout(function() {
            $('#div-gpt-ad-1465467936753-1').delay(500).queue(function(next2) {
                $(this).css("overflow", "hidden");
                next2();
            });
        });
    });
    $(document).ready(function() {
        $(".list-view-icon").click(function(event) {
            if ($(".video-list").hasClass("artist-video-list")) {
                $(".video-list").addClass("list-view");
                $(".video-list").removeClass("artist-video-list");
                event.preventDefault();
            }
            event.preventDefault();
        });
        $(".grid-view-icon").click(function(event) {
            if (!$(".video-list").hasClass("artist-video-list")) {
                $(".video-list").addClass("artist-video-list");
                $(".video-list").removeClass("list-view");
                event.preventDefault();
            }
            event.preventDefault();
        });
        $('.mobile-menu').click(function() {
            $('.mobile-menu').toggleClass('mobile-menu-text-toggle');
            $('#block-mainmenu-2').toggleClass('menu-block-1');
            return false;
        });
        $('.mobile-search').click(function() {
            $('#block-exposedformsearchpage-1-3').toggleClass('view-search-mobile');
            return false;
        });
    });
    $(document).ready(function() {
        if ($('.sidebarRight').css('float') == 'left') {
            $('.x90-responsive-wrapper').html('');
            $('.ad-mobile').html('');
            $('.front .pane-block-46').appendTo('.view-display-id-block_7 .news-list li:nth-child(4)');
            $('.not-front #block-kenyans-block-18').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(3)');
            $('.not-front #block-kenyans-block-39').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(7)');
            $('.not-front #block-ke300x250articles3-desktop').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(11)');
            $('.not-front #block-ke300x250articles4').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(15)');
            $('.not-front #block-kenyans-block-39').appendTo('.news-article p:nth-of-type(5)');
            $('.not-front #block-parallaxerdt').appendTo('.news-article p:nth-of-type(4)');
            $('.front #block-kenyans-block-18').appendTo('.front #block-kenyans-system-main .elections-tracker-block');
            $('.front #block-kenyans-block-39').appendTo('.front #block-kenyans-system-main .news-list-top li:nth-child(3)');
            $('.front #block-ke300x250articles3-desktop').appendTo('.front #block-kenyans-system-main .news-list-top li:nth-child(7)');
            $('.front #block-ke300x250articles4').appendTo('.front #block-kenyans-system-main .news-list-bottom li:nth-child(4)');
            $('.not-front #block-betikawidget').prependTo('.news-article p:nth-of-type(4)');
            $('.not-front .article-ad-3').appendTo('.news-article p:nth-of-type(11)');
            $('.page-news .article-ad-4').appendTo('.page-news .news-list-secondary li.other-news:nth-child(5)');
            $('.not-front .article-ad-4').appendTo('.news-article p:nth-of-type(15)');
            $('.not-front #block-views-block-top-100-block-1').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-2').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-3').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-4').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-5').prependTo('.not-front .layout .social-wrapper');
            $('#block-kenyans-block-24').sticky({
                topSpacing: 10,
                zIndex: 100,
                stopper: ".site-info",
                stickyClass: false
            });
        }
    });
    $(document).ready(function() {
        if ($('.sidebarRight').css('float') == 'none') {
            $('.social-bar .twitter .social-text').text('Tweet');
            $('.social-bar .gplus .social-text').text('G+');
            $('.social-bar .email .social-text').text('Email');
            $('.not-front #block-kenyans-system-main .block .article-ad-1-mobile').appendTo('.news-article p:nth-of-type(3)');
            $('.not-front #block-ke300x250articles1mobile').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(3)');
            $('.not-front #block-kemobile300x2503-2').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(6)');
            $('.not-front #block-kenyans-block-44').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(9)');
            $('.not-front #block-ke300x250articlempu3').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(12)');
            $('.not-front #block-ke300x250articles4mobile').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(15)');
            $('.not-front #block-kemediumrect4-2').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(18)');
            $('.front .pane-block-47').appendTo('.view-display-id-block_7 .news-list li:nth-child(4)');
            $('.front .pane-block-48').appendTo('.view-display-id-block_8 .news-list li:nth-child(4)');
            $('.not-front .pane-block-47').appendTo('.pane-news-panel-pane-5 .news-list li:nth-child(4)');
            $('.not-front .pane-block-48').appendTo('.pane-news-panel-pane-2 .news-list li:nth-child(4)');
            $('.sidebarRight').appendTo('.front #mini-panel-home3 .pane-all-videos');
            $('.sidebarRight').appendTo('.node-type-news .pane-news-panel-pane-5');
            $('.block-ad-mobile3').appendTo('.news-list-bottom li:nth-child(6)');
            $('.block-ad-mobile3').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(12)');
            $('.front #block-ke300x250articles1mobile').appendTo('.front .elections-tracker-block');
            $('.front #block-kenyans-block-44').appendTo('.front #block-kenyans-system-main .news-list-top li:nth-child(2)');
            $('.front #block-kemobile300x2502-2').appendTo('.front #block-kenyans-system-main .news-list-top li:nth-child(5)')
            $('.front #block-ke300x250articlempu3').appendTo('.front #block-kenyans-system-main .news-list-bottom li:nth-child(1)');
            $('.front #block-ke300x250articles4mobile').appendTo('.front #block-kenyans-system-main .news-list-bottom li:nth-child(4)');
            $('.front #block-kemobile300x2503-2').appendTo('.front #block-kenyans-system-main .news-list-bottom li:nth-child(7)');
            $('.front #block-kemediumrect4-2').appendTo('.front #block-kenyans-system-main .news-list-bottom li:nth-child(10)');
            $('.front #block-kemediumrect5').appendTo('.front #block-kenyans-system-main .news-list-bottom li:nth-child(13)');
            $('.not-front #block-ke300x250articles1mobile').appendTo('.news-article p:nth-of-type(2)');
            $('.not-front #block-kenyans-block-44').appendTo('.news-article p:nth-of-type(5)');
            $('.not-front .article-ad-3').appendTo('.news-article p:nth-of-type(11)');
            $('.not-front #block-kemobile300x2502-2').appendTo('.page-news .social-wrapper');
            $('.not-front #block-kemobile300x2502-2').appendTo('.news-article p:nth-of-type(8)');
            $('.not-front #block-parallaxermobile').appendTo('.news-article p:nth-of-type(4)');
            $('.sidebarRight #block-exposedformsearchpage-1-2').removeAttr('id').addClass('removethis');
            $('.not-front #block-views-block-top-100-block-1').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-2').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-3').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-4').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-views-block-top-100-block-5').prependTo('.not-front .layout .social-wrapper');
            $('.not-front #block-kemediumrect4').prependTo('.news-article p:nth-of-type(1)');
            $('.not-front #block-betikawidgetmobile').prependTo('.news-article p:nth-of-type(5)');
            $('.not-front #block-betikawidget').prependTo('.news-article p:nth-of-type(5)');
            $('.page-news #block-kemediumrect4-2').prependTo('.page-news .news-list-secondary li.other-news:nth-child(1)');
            $('.page-news #block-kemobile300x2503-2').appendTo('.page-news .news-list-secondary li.other-news:nth-child(3)');
            $('.page-news #block-ke300x250articles4mobile').appendTo('.page-news .news-list-secondary li.other-news:nth-child(6)');
            $('.page-news #block-kemediumrect5').appendTo('.page-news .news-list-secondary li.other-news:nth-child(9)');
            $('.not-front #block-kemobile300x2502-2').appendTo('.news-article p:nth-of-type(14)');
            $('.not-front #block-ke300x250articles4mobile').appendTo('.news-article p:nth-of-type(17)');
            $('.not-front #block-kemediumrect4-2').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(18)');
            $('.not-front #block-kemediumrect5').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(21)');
            $('.not-front #block-kemediumrect6').appendTo('.not-front #block-kenyans-system-main .news-list li:nth-child(24)');
            $('.not-front #block-kemediumrect4-2').appendTo('.news-article p:nth-of-type(21)');
            $('.not-front #block-kemediumrect5').appendTo('.news-article p:nth-of-type(25)');
            $('.not-front #block-kemediumrect6').appendTo('.news-article p:nth-of-type(29)');
            $('.ad-leaderboard').html('');
            $('.ad-leaderboard-large').html('');
            $('.bg-skin').html('');
            $('.ad-desktop').html('');
            $('#colorbox').html('');
            $('#cboxOverlay').css('display', 'none');
            $('#colorbox').css('display', 'none');
        }
    });
    $(document).ready(function() {
        if ($('.news-article p:nth-of-type(19)').length) {
            $('.not-front .article-ad-4').appendTo('.news-article p:nth-of-type(17)');
        } else {
            $('.page-news #block-ke300x250articles4').prependTo('.page-news .news-list-secondary .read-more');
        }
    });
    $(document).ready(function() {
        if ($('.sidebarRight').css('float') == 'none' && $('.article-ad').css('float') == 'none') {}
    });
})(jQuery);;
var element = document.getElementsByClassName("exclude_news_ads").length;
var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];
googletag.cmd.push(function() {
    var mappingbgskin = googletag.sizeMapping().addSize([992, 0], [
        [1, 1],
        [1340, 800]
    ]).addSize([768, 0], []).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingfloater = googletag.sizeMapping().addSize([992, 0], [1, 1]).addSize([768, 0], []).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingfloatermobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], [1, 1]).addSize([320, 0], [1, 1]).addSize([0, 0], [1, 1]).build();
    var mappingsliderdesktop = googletag.sizeMapping().addSize([992, 0], [1, 1]).addSize([768, 0], []).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingslidermobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], [1, 1]).addSize([320, 0], [1, 1]).addSize([0, 0], [1, 1]).build();
    var mappingpbuttonmobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], [
        [150, 150],
        [100, 100]
    ]).addSize([320, 0], [
        [150, 150],
        [100, 100]
    ]).addSize([0, 0], [
        [150, 150],
        [100, 100]
    ]).build();
    var mappingpbuttondesktop = googletag.sizeMapping().addSize([992, 0], [
        [150, 150],
        [100, 100]
    ]).addSize([768, 0], []).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingtopleaderboardad = googletag.sizeMapping().addSize([992, 0], [728, 90]).addSize([768, 0], [728, 90]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingmenuleaderboardlargead = googletag.sizeMapping().addSize([992, 0], [970, 90]).addSize([768, 0], [728, 90]).addSize([480, 0], []).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappinganchor = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [
        [320, 50],
        [300, 50]
    ]).addSize([320, 0], [
        [320, 50],
        [300, 50]
    ]).addSize([0, 0], [
        [320, 50],
        [300, 50],
        [320, 100]
    ]).build();
    var mappingmaininner = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmobilempu1 = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmobilempu1inner = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmobilempu2 = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmobilempu3 = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmpuad1 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingmpuad2 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingmpuad3 = googletag.sizeMapping().addSize([992, 0], [
        [300, 600],
        [300, 250]
    ]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingmpuad4 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmpuad5 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingmpuad6 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingarticlempu1 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingarticlempu1mobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingarticlempu2 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingarticlempu2mobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingarticlempu3 = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingarticlempu3desktop = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingarticlempu4 = googletag.sizeMapping().addSize([992, 0], [300, 250]).addSize([768, 0], [300, 250]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappingarticlempu4mobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappinginput1desktop = googletag.sizeMapping().addSize([992, 0], [728, 90]).addSize([768, 0], [728, 90]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappinginput1mobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappinginput2desktop = googletag.sizeMapping().addSize([992, 0], [728, 90]).addSize([768, 0], [728, 90]).addSize([320, 0], []).addSize([0, 0], []).build();
    var mappinginput2mobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [300, 250]).addSize([320, 0], [300, 250]).addSize([0, 0], [300, 250]).build();
    var mappingoddsdesktop = googletag.sizeMapping().addSize([992, 0], [700, 200]).addSize([768, 0], [700, 200]).addSize([480, 0], [320, 200]).addSize([320, 0], [320, 200]).addSize([0, 0], [320, 200]).build();
    var mappingoddsmobile = googletag.sizeMapping().addSize([992, 0], []).addSize([768, 0], []).addSize([480, 0], [320, 200]).addSize([320, 0], [320, 200]).addSize([0, 0], [320, 200]).build();
    console.log(element);
    if (element > 0) {
        console.log('Found');
        googletag.defineSlot('/72379320/KE-TopLeaderboard', [728, 90], 'div-gpt-ad-1462461665695-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingtopleaderboardad).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineOutOfPageSlot('/72379320/KE-Background_Skin', 'div-gpt-ad-1462889861242-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingbgskin).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineOutOfPageSlot('/72379320/Interstitial_Floater', 'div-gpt-ad-1492131425263-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingfloater).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/Interstitial-Mobile', 'div-gpt-ad-1498675843274-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingfloatermobile).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/Slider-Desktop', 'div-gpt-ad-1525471213381-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingsliderdesktop).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/Slider-Mobile', 'div-gpt-ad-1525471213381-1').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingslidermobile).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/KE-Web-Interstitial-Mobile', googletag.enums.OutOfPageFormat.INTERSTITIAL);
        googletag.defineSlot('/72379320/KE-MenuLeaderboard-Large', [970, 90], 'div-gpt-ad-1462461665695-3').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmenuleaderboardlargead).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect1', [300, 250], 'div-gpt-ad-1462461665695-8').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmpuad1).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-300x250-Articles', [300, 250], 'div-gpt-ad-1462461665695-4').setTargeting('mainexcludeads', ['TRUE']).addService(googletag.companionAds()).defineSizeMapping(mappingarticlempu1).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-300x250-Articles-1-Mobile', [300, 250], 'div-gpt-ad-1583443522603-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu1mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/ke_p_button_desktop', [
            [150, 150],
            [100, 100]
        ], 'div-gpt-ad-1626852363421-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingpbuttondesktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/ke_p_button_mobile', [
            [150, 150],
            [100, 100]
        ], 'div-gpt-ad-1626852546442-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingpbuttonmobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Anchor', [300, 250], 'div-gpt-ad-1603397652665-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappinganchor).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE_Odds_Desktop', [
            [700, 200],
            [320, 200]
        ], 'div-gpt-ad-1629918987648-0').setTargeting('mainexcludeads', ['excludeadshere']).defineSizeMapping(mappingoddsdesktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE_Odds_Mobile', [320, 200], 'div-gpt-ad-1629920531867-0').setTargeting('mainexcludeads', ['excludeadshere']).defineSizeMapping(mappingoddsmobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-main-inner', [300, 250], 'div-gpt-ad-1660106426673-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmaininner).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-2', [300, 250], 'div-gpt-ad-1506580564732-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu2).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Mobile-300x250-1-Inner', [300, 250], 'div-gpt-ad-1658351969411-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmobilempu1inner).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-2-Inner', [300, 250], 'div-gpt-ad-1507750963468-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu2mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect2', [300, 250], 'div-gpt-ad-1462461665695-9').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmpuad2).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect3', [300, 250], 'div-gpt-ad-1462461665695-10').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmpuad3).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-3', [
            [300, 250],
            [320, 100]
        ], 'div-gpt-ad-1507752217570-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu3).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-3_desktop', [
            [300, 250],
            [320, 100]
        ], 'div-gpt-ad-1583448127604-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu3desktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-4', [300, 250], 'div-gpt-ad-1583453336573-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu4).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-4-Mobile', [300, 250], 'div-gpt-ad-1583453586472-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingarticlempu4mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Mobile-300x250-1', [320, 100], 'div-gpt-ad-1462461665695-5').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmobilempu1).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-Mobile-300x250-2', [300, 250], 'div-gpt-ad-1462461665695-6').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmobilempu2).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-Mobile-300x250-3', [
            [300, 250],
            [320, 100]
        ], 'div-gpt-ad-1462461665695-7').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmobilempu3).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect4', [300, 250], 'div-gpt-ad-1624055231321-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmpuad4).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect5', [300, 250], 'div-gpt-ad-1634249126750-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmpuad5).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect6', [300, 250], 'div-gpt-ad-1634249284142-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappingmpuad5).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input1-Desktop', [728, 90], 'div-gpt-ad-1621540676338-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappinginput1desktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input1-Mobile', [300, 250], 'div-gpt-ad-1621541476572-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappinginput1mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input2-Desktop', [728, 90], 'div-gpt-ad-1621541645740-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappinginput2desktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input2-Mobile', [300, 250], 'div-gpt-ad-1621541762961-0').setTargeting('mainexcludeads', ['TRUE']).defineSizeMapping(mappinginput2mobile).addService(googletag.pubads());
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    } else {
        console.log('Not Found');
        googletag.defineSlot('/72379320/KE-TopLeaderboard', [728, 90], 'div-gpt-ad-1462461665695-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingtopleaderboardad).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineOutOfPageSlot('/72379320/KE-Background_Skin', 'div-gpt-ad-1462889861242-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingbgskin).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineOutOfPageSlot('/72379320/Interstitial_Floater', 'div-gpt-ad-1492131425263-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingfloater).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/Interstitial-Mobile', 'div-gpt-ad-1498675843274-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingfloatermobile).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/Slider-Desktop', 'div-gpt-ad-1525471213381-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingsliderdesktop).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/Slider-Mobile', 'div-gpt-ad-1525471213381-1').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingslidermobile).addService(googletag.pubads());
        googletag.defineOutOfPageSlot('/72379320/KE-Web-Interstitial-Mobile', googletag.enums.OutOfPageFormat.INTERSTITIAL);
        googletag.defineSlot('/72379320/KE-MenuLeaderboard-Large', [970, 90], 'div-gpt-ad-1462461665695-3').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmenuleaderboardlargead).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect1', [300, 250], 'div-gpt-ad-1462461665695-8').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmpuad1).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-300x250-Articles', [300, 250], 'div-gpt-ad-1462461665695-4').setTargeting('mainexcludeads', ['FALSE']).addService(googletag.companionAds()).defineSizeMapping(mappingarticlempu1).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-300x250-Articles-1-Mobile', [300, 250], 'div-gpt-ad-1583443522603-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu1mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/ke_p_button_desktop', [
            [150, 150],
            [100, 100]
        ], 'div-gpt-ad-1626852363421-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingpbuttondesktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/ke_p_button_mobile', [
            [150, 150],
            [100, 100]
        ], 'div-gpt-ad-1626852546442-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingpbuttonmobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Anchor', [300, 250], 'div-gpt-ad-1603397652665-0').defineSizeMapping(mappinganchor).setTargeting('mainexcludeads', ['FALSE']).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE_Odds_Desktop', [
            [700, 200],
            [320, 200]
        ], 'div-gpt-ad-1629918987648-0').defineSizeMapping(mappingoddsdesktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE_Odds_Mobile', [320, 200], 'div-gpt-ad-1629920531867-0').defineSizeMapping(mappingoddsmobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-main-inner', [300, 250], 'div-gpt-ad-1660106426673-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmaininner).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-2', [300, 250], 'div-gpt-ad-1506580564732-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu2).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Mobile-300x250-1-Inner', [300, 250], 'div-gpt-ad-1658351969411-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmobilempu1inner).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-2-Inner', [300, 250], 'div-gpt-ad-1507750963468-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu2mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect2', [300, 250], 'div-gpt-ad-1462461665695-9').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmpuad2).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect3', [300, 250], 'div-gpt-ad-1462461665695-10').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmpuad3).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-3', [
            [300, 250],
            [320, 100]
        ], 'div-gpt-ad-1507752217570-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu3).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-3_desktop', [
            [300, 250],
            [320, 100]
        ], 'div-gpt-ad-1583448127604-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu3desktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-4', [300, 250], 'div-gpt-ad-1583453336573-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu4).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-300x250-Articles-4-Mobile', [300, 250], 'div-gpt-ad-1583453586472-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingarticlempu4mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Mobile-300x250-1', [320, 100], 'div-gpt-ad-1462461665695-5').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmobilempu1).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-Mobile-300x250-2', [300, 250], 'div-gpt-ad-1462461665695-6').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmobilempu2).addService(googletag.pubads().setTargeting("gender", ["male", "female"]));
        googletag.defineSlot('/72379320/KE-Mobile-300x250-3', [
            [300, 250],
            [320, 100]
        ], 'div-gpt-ad-1462461665695-7').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmobilempu3).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect4', [300, 250], 'div-gpt-ad-1624055231321-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmpuad4).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect5', [300, 250], 'div-gpt-ad-1634249126750-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmpuad5).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-MediumRect6', [300, 250], 'div-gpt-ad-1634249284142-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappingmpuad5).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input1-Desktop', [728, 90], 'div-gpt-ad-1621540676338-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappinginput1desktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input1-Mobile', [300, 250], 'div-gpt-ad-1621541476572-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappinginput1mobile).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input2-Desktop', [728, 90], 'div-gpt-ad-1621541645740-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappinginput2desktop).addService(googletag.pubads());
        googletag.defineSlot('/72379320/KE-Input2-Mobile', [300, 250], 'div-gpt-ad-1621541762961-0').setTargeting('mainexcludeads', ['FALSE']).defineSizeMapping(mappinginput2mobile).addService(googletag.pubads());
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    }
});;
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(function($) {
    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;
    var defaults = {
            topSpacing: 0,
            bottomSpacing: 0,
            className: 'is-sticky',
            wrapperClassName: 'sticky-wrapper',
            center: false,
            getWidthFrom: '',
            widthFromWrapper: true,
            responsiveWidth: false,
            zIndex: 'inherit'
        },
        $window = $(window),
        $document = $(document),
        sticked = [],
        windowHeight = $window.height(),
        scroller = function() {
            var scrollTop = $window.scrollTop(),
                documentHeight = $document.height(),
                dwh = documentHeight - windowHeight,
                extra = (scrollTop > dwh) ? dwh - scrollTop : 0;
            for (var i = 0, l = sticked.length; i < l; i++) {
                var s = sticked[i],
                    elementTop = s.stickyWrapper.offset().top,
                    etse = elementTop - s.topSpacing - extra;
                s.stickyWrapper.css('height', s.stickyElement.outerHeight());
                if (scrollTop <= etse) {
                    if (s.currentTop !== null) {
                        s.stickyElement.css({
                            'width': '',
                            'position': '',
                            'top': '',
                            'z-index': ''
                        });
                        s.stickyElement.parent().removeClass(s.className);
                        s.stickyElement.trigger('sticky-end', [s]);
                        s.currentTop = null;
                    }
                } else {
                    var newTop = documentHeight - s.stickyElement.outerHeight() -
                        s.topSpacing - s.bottomSpacing - scrollTop - extra;
                    if (newTop < 0) {
                        newTop = newTop + s.topSpacing;
                    } else {
                        newTop = s.topSpacing;
                    }
                    if (s.currentTop !== newTop) {
                        var newWidth;
                        if (s.getWidthFrom) {
                            padding = s.stickyElement.innerWidth() - s.stickyElement.width();
                            newWidth = $(s.getWidthFrom).width() - padding || null;
                        } else if (s.widthFromWrapper) {
                            newWidth = s.stickyWrapper.width();
                        }
                        if (newWidth == null) {
                            newWidth = s.stickyElement.width();
                        }
                        s.stickyElement.css('width', newWidth).css('position', 'fixed').css('top', newTop).css('z-index', s.zIndex);
                        s.stickyElement.parent().addClass(s.className);
                        if (s.currentTop === null) {
                            s.stickyElement.trigger('sticky-start', [s]);
                        } else {
                            s.stickyElement.trigger('sticky-update', [s]);
                        }
                        if (s.currentTop === s.topSpacing && s.currentTop > newTop || s.currentTop === null && newTop < s.topSpacing) {
                            s.stickyElement.trigger('sticky-bottom-reached', [s]);
                        } else if (s.currentTop !== null && newTop === s.topSpacing && s.currentTop < newTop) {
                            s.stickyElement.trigger('sticky-bottom-unreached', [s]);
                        }
                        s.currentTop = newTop;
                    }
                    var stickyWrapperContainer = s.stickyWrapper.parent();
                    var unstick = (s.stickyElement.offset().top + s.stickyElement.outerHeight() >= stickyWrapperContainer.offset().top + stickyWrapperContainer.outerHeight()) && (s.stickyElement.offset().top <= s.topSpacing);
                    if (unstick) {
                        s.stickyElement.css('position', 'absolute').css('top', '').css('bottom', 0).css('z-index', '');
                    } else {
                        s.stickyElement.css('position', 'fixed').css('top', newTop).css('bottom', '').css('z-index', s.zIndex);
                    }
                }
            }
        },
        resizer = function() {
            windowHeight = $window.height();
            for (var i = 0, l = sticked.length; i < l; i++) {
                var s = sticked[i];
                var newWidth = null;
                if (s.getWidthFrom) {
                    if (s.responsiveWidth) {
                        newWidth = $(s.getWidthFrom).width();
                    }
                } else if (s.widthFromWrapper) {
                    newWidth = s.stickyWrapper.width();
                }
                if (newWidth != null) {
                    s.stickyElement.css('width', newWidth);
                }
            }
        },
        methods = {
            init: function(options) {
                return this.each(function() {
                    var o = $.extend({}, defaults, options);
                    var stickyElement = $(this);
                    var stickyId = stickyElement.attr('id');
                    var wrapperId = stickyId ? stickyId + '-' + defaults.wrapperClassName : defaults.wrapperClassName;
                    var wrapper = $('<div></div>').attr('id', wrapperId).addClass(o.wrapperClassName);
                    stickyElement.wrapAll(function() {
                        if ($(this).parent("#" + wrapperId).length == 0) {
                            return wrapper;
                        }
                    });
                    var stickyWrapper = stickyElement.parent();
                    if (o.center) {
                        stickyWrapper.css({
                            width: stickyElement.outerWidth(),
                            marginLeft: "auto",
                            marginRight: "auto"
                        });
                    }
                    if (stickyElement.css("float") === "right") {
                        stickyElement.css({
                            "float": "none"
                        }).parent().css({
                            "float": "right"
                        });
                    }
                    o.stickyElement = stickyElement;
                    o.stickyWrapper = stickyWrapper;
                    o.currentTop = null;
                    sticked.push(o);
                    methods.setWrapperHeight(this);
                    methods.setupChangeListeners(this);
                });
            },
            setWrapperHeight: function(stickyElement) {
                var element = $(stickyElement);
                var stickyWrapper = element.parent();
                if (stickyWrapper) {
                    stickyWrapper.css('height', element.outerHeight());
                }
            },
            setupChangeListeners: function(stickyElement) {
                if (window.MutationObserver) {
                    var mutationObserver = new window.MutationObserver(function(mutations) {
                        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
                            methods.setWrapperHeight(stickyElement);
                        }
                    });
                    mutationObserver.observe(stickyElement, {
                        subtree: true,
                        childList: true
                    });
                } else {
                    if (window.addEventListener) {
                        stickyElement.addEventListener('DOMNodeInserted', function() {
                            methods.setWrapperHeight(stickyElement);
                        }, false);
                        stickyElement.addEventListener('DOMNodeRemoved', function() {
                            methods.setWrapperHeight(stickyElement);
                        }, false);
                    } else if (window.attachEvent) {
                        stickyElement.attachEvent('onDOMNodeInserted', function() {
                            methods.setWrapperHeight(stickyElement);
                        });
                        stickyElement.attachEvent('onDOMNodeRemoved', function() {
                            methods.setWrapperHeight(stickyElement);
                        });
                    }
                }
            },
            update: scroller,
            unstick: function(options) {
                return this.each(function() {
                    var that = this;
                    var unstickyElement = $(that);
                    var removeIdx = -1;
                    var i = sticked.length;
                    while (i-- > 0) {
                        if (sticked[i].stickyElement.get(0) === that) {
                            splice.call(sticked, i, 1);
                            removeIdx = i;
                        }
                    }
                    if (removeIdx !== -1) {
                        unstickyElement.unwrap();
                        unstickyElement.css({
                            'width': '',
                            'position': '',
                            'top': '',
                            'float': '',
                            'z-index': ''
                        });
                    }
                });
            }
        };
    if (window.addEventListener) {
        window.addEventListener('scroll', scroller, false);
        window.addEventListener('resize', resizer, false);
    } else if (window.attachEvent) {
        window.attachEvent('onscroll', scroller);
        window.attachEvent('onresize', resizer);
    }
    $.fn.sticky = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.sticky');
        }
    };
    $.fn.unstick = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.unstick.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.sticky');
        }
    };
    $(function() {
        setTimeout(scroller, 0);
    });
}));;