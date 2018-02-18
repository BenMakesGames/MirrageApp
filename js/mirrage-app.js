/**
 * @requires jQuery
 * @requires jQuery.mobile
 * @requires jQuery.mobile.swipeupdown https://github.com/blackdynamo/jquerymobile-swipeupdown
 * @requires jQuery.ba-throttle-debounce https://github.com/cowboy/jquery-throttle-debounce
 * @requires Sugar
 */
class MirrageApp
{
    get id() { return 'Mirrage.App'; }

    constructor(settings)
    {
        let _this = this;

        this.config = {
            maxNavStackSize: 10,
            overrideConsole: false,
        };

        jQuery.extend(true, this.config, settings.config);

        this.navStack = [];
        this.pages = {};
        this.dialogs = {};
        this.services = {};

        this.$page = jQuery('#Page');
        this.$loadingThrobber = jQuery('#LoadingThrobber');
        this.$refreshThrobber = jQuery('#RefreshThrobber');

        this.renderer = settings.renderer;

        this.currentPage = null;
        this.currentDialog = null;

        this.inited = [];

        function init()
        {
            _this.overrideConsoleLog();
            _this.attachEventHandlers();

            _this.loadComponents(settings)
                .then(() => {
                    if(typeof settings.startup !== 'function')
                        throw 'app settings must include a "startup" property, and it must be a function.';

                    settings.startup(_this);
                })
                .catch(() => {
                    throw 'loadComponents failed.';
                })
            ;
        }

        // ready?
        jQuery(function() {
            if(!!window.cordova)
                document.addEventListener('deviceready', init);
            else
                init();
        });
    }

    /**
     * @param {string} name
     * @returns {*}
     */
    getService(name)
    {
        if(typeof this.services[name] !== 'undefined')
            return this.services[name];
        else
        {
            window.console.log('Warning: tried to get Service "' + name + '", but no such Service exists.');
            return null;
        }
    }

    /**
     * @private
     */
    overrideConsoleLog()
    {
        let _this = this;

        if(_this.config.overrideConsole)
        {
            let oldLog = window.console.log;
            window.console.log = function(message) {
                try
                {
                    if(typeof message === 'undefined')
                        _this.flash('[TEST] undefined');
                    else if(message === null)
                        _this.flash('[TEST] null');
                    else if(message.constructor === Number || message.constructor === Boolean || message.constructor === String || message.constructor === Symbol)
                        _this.flash('[TEST] ' + message);
                    else
                        _this.flash('[TEST] ' + JSON.stringify(message));
                }
                catch(e)
                {
                    _this.flash('[TEST] tried to Flash a console.log message, but encountered an exception while doing so.');
                }

                oldLog.apply(window.console, arguments);
            };
        }
    }

    /**
     * @private
     */
    attachEventHandlers()
    {
        let _this = this;

        let $html = jQuery('html');

        // device back button:
        document.addEventListener('backbutton', function() {
            _this.navBack()
                .catch(() => {
                    navigator.app.exitApp();
                })
            ;
        });

        // support detection on touch events
        this.supportTouch = (window.Modernizr && Modernizr.touch === true) || (function () {
            return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
        })();

        // events names based on browser support
        this.touchEvents = (function () {
            if (_this.supportTouch) {
                return {
                    start: 'touchstart.pulltorefresh',
                    move: 'touchmove.pulltorefresh',
                    end: 'touchend.pulltorefresh'
                };
            }

            let events = {
                start: 'mousedown.pulltorefresh',
                move: 'mousemove.pulltorefresh',
                end: 'mouseup.pulltorefresh'
            };

            if (!!(window.navigator.msPointerEnabled)) {
                events = {
                    start: 'MSPointerDown.pulltorefresh',
                    move: 'MSPointerMove.pulltorefresh',
                    end: 'MSPointerUp.pulltorefresh'
                };
            }

            if (!!(window.navigator.pointerEnabled)) {
                events = {
                    start: 'pointerdown.pulltorefresh',
                    move: 'pointermove.pulltorefresh',
                    end: 'pointerup.pulltorefresh'
                };
            }

            return events;
        })();

        // register click handlers
        jQuery('body')
            .on('click', '[data-page]', function(e) {
                e.preventDefault();

                let $link = jQuery(this);
                let navPromise;

                if($link.data('pageArgs'))
                    navPromise = _this.navTo($link.data('page'), JSON.parse($link.data('pageArgs')));
                else
                    navPromise = _this.navTo($link.data('page'));
            })
            .on('click', '[data-back]', function(e) {
                e.preventDefault();

                _this.navBack();
            })

            .on('click', '[data-dialog]', function(e) {
                e.preventDefault();

                let $this = jQuery(this);

                _this.openDialog($this.data('dialog'), $this.data());
            })
            .on('click', '[data-close-dialog]', function(e) {
                e.preventDefault();

                _this.closeDialog();
            })
            .on('click', 'dialog', function(e) {
                if (e.target !== this)
                    return;

                _this.closeDialog();
            })

            .on('click', '[data-scroll-to]', function(e) {
                e.preventDefault();

                let id = jQuery(this).data('scrollTo');

                let oldTop = $html.scrollTop();
                let newTop = jQuery('#' + id).offset().top - jQuery('body > header').height();
                let scrollTime = Math.sqrt(Math.abs(newTop - oldTop)) * 20;

                $html.animate({
                    scrollTop: newTop
                }, scrollTime);
            })
        ;

        jQuery(window).on('resize', jQuery.debounce(100, function(e) {
            window.console.log('orientation change, or resize');

            if(_this.currentPage !== null && typeof _this.currentPage.resize !== 'undefined')
            {
                let pageResizePromise = new Promise((resolve, reject) => {
                    _this.currentPage.resize(resolve, reject);
                });
            }

            if(_this.currentDialog !== null && typeof _this.currentDialog.resize !== 'undefined')
            {
                let dialogResizePromise = new Promise((resolve, reject) => {
                    _this.currentDialog.resize(resolve, reject);
                });
            }
        }));

        let actionHandlers = [ 'submit', 'click', 'change' ];

        actionHandlers.forEach((a) => {
            jQuery('body').on(a, '[data-action-' + a + ']', function(e) {
                e.preventDefault();

                let $this = jQuery(this);

                _this.callAction($this.attr('data-action-' + a), $this, e);
            });
        });

        this.$flash = jQuery('#Flash');

        this.$flash.on('click', function(e) {
            e.preventDefault();
            _this.clearFlash();
        });
    }

    /**
     * @private
     * @returns {Promise}
     */
    loadComponents(components)
    {
        let _this = this;

        if(typeof components.pages !== 'undefined' && components.pages.constructor === Array)
        {
            components.pages.forEach(function(page)
            {
                if(typeof page.id === 'undefined')
                    throw 'A page does not have an id attribute or getter :\'(';

                _this.pages[page.id] = page;
                _this.pages[page.id].app = _this;
            });
        }
        else
            window.console.log('Warning: project contains no Pages!');

        if(typeof components.dialogs !== 'undefined' && components.dialogs.constructor === Array)
        {
            components.dialogs.forEach(function(dialog) {
                let $dialog = jQuery('<dialog id="' + dialog.id.replace(/[^A-Z0-9_-]+/gi, '-') + '" />');
                jQuery('body').append($dialog);

                _this.dialogs[dialog.id] = dialog;
                _this.dialogs[dialog.id].app = _this;
            });
        }

        let serviceInits = [];

        if(typeof components.services !== 'undefined' && components.services.constructor === Array)
        {
            components.services.forEach(function(service) {
                _this.services[service.id] = service;
                _this.services[service.id].app = _this;

                if(typeof _this.renderer.loadService !== 'undefined')
                    _this.renderer.loadService(_this.services[service.id]);

                if(typeof _this.services[service.id].init !== 'undefined')
                    serviceInits.push(new Promise((resolve, reject) => { _this.services[service.id].init(resolve, reject); }));
            });
        }

        return new Promise((resolve, reject) => {
            Promise.all(serviceInits)
                .then(() => { resolve(); })
                .catch(() => {
                    window.console.log('Warning: failed to initialize one or more Services!');
                    reject();
                })
            ;
        });
    }

    showRefreshThrobber()
    {
        this.$refreshThrobber.css('display', 'block');
    }

    hideRefreshThrobber()
    {
        this.$refreshThrobber.css('display', 'none');
    }

    /**
     * @param {string} page
     * @param {object} args
     * @returns {Promise}
     */
    navTo(page, args)
    {
        let _this = this;

        return new Promise((resolve, reject) => {

            if(typeof _this.pages[page] === 'undefined')
            {
                window.console.log('Warning: tried to navigate to Page ' + page + ', but no such Page exists.');
                reject();
                return;
            }

            // close all open dialogs & flash messages
            this.closeDialog();
            this.clearFlash();

            let initPromise = null;

            if(_this.inited.indexOf(page) === -1)
            {
                _this.inited.push(page);

                if(typeof _this.pages[page].init !== 'undefined')
                {
                    _this.$loadingThrobber.css('display', 'block');
                    initPromise = new Promise((resolve, reject) => { _this.pages[page].init(resolve, reject); });
                }
            }

            if(!_this.topOfNavStackIs(page, args))
            {
                _this.navStack.push({
                    id: page,
                    args: args,
                });
            }

            if(_this.navStack.length > _this.config.maxNavStackSize)
                _this.navStack.splice(0, _this.navStack.length - _this.config.maxNavStackSize);

            if(initPromise === null)
            {
                _this.nav(page, args)
                    .then(() => { resolve(); })
                    .catch(() => { reject(); })
                ;
            }
            else
            {
                initPromise
                    .then(function() {
                        _this.nav(page, args)
                            .then(() => { resolve(); })
                            .catch(() => { reject(); })
                        ;
                    })
                    .catch(function(r) {
                        window.console.log('Notice: caught Promise rejection while calling a page\'s init() method:');
                        window.console.log(r);
                        reject();
                    })
                ;
            }
        });
    }

    /**
     * @private
     * @returns {Promise}
     */
    nav(pageId, args)
    {
        return new Promise((resolve, reject) => {
            let _this = this;
            let openPromise = null;
            let $element = jQuery('#' + pageId.replace(/[^A-Z0-9_-]+/gi, '-'));

            _this.currentPage = _this.pages[pageId];

            // we don't check for type === 'function', because we WANT to throw the dev an error if they try to call
            // a string or something. that's probably a mistake on the dev's part; hiding that mistake would be
            // frustrating.
            if(typeof _this.pages[pageId].open !== 'undefined')
            {
                _this.$loadingThrobber.css('display', 'block');
                openPromise = new Promise((resolve, reject) => { _this.pages[pageId].open(resolve, reject, args); });
            }

            jQuery('body')
                .removeClass(function(index, className) {
                    return (className.match (/(^|\s)Page-\S+/g) || []).join(' ');
                })
                .addClass('Page-' + _this.pages[pageId].id.replace(/[^A-Z0-9_-]+/gi, '-'))
            ;

            if(openPromise === null)
            {
                _this.navDone(_this.pages[pageId]);
                resolve();
            }
            else
            {
                openPromise
                    .then(() => {
                        _this.navDone(_this.pages[pageId]);
                        resolve();
                    })
                    .catch(function(r) {
                        window.console.log('Notice: Caught a Promise rejection while calling a page "' + pageId + '"\'s open() method:');
                        window.console.log(r);
                        reject();
                    })
                ;
            }
        });
    }

    /**
     * @private
     * @returns {boolean}
     */
    topOfNavStackIs(pageId, args)
    {
        if(this.navStack.length === 0) return false;

        let top = this.navStack[this.navStack.length - 1];

        if(top.id !== pageId) return false;

        // TODO: this solution works EXCEPT when properties are in a different order, which is a little wonky...
        return JSON.stringify(args) === JSON.stringify(top.args);
    }

    redrawPage()
    {
        this.drawPage(this.currentPage, jQuery('#' + this.currentPage.id.replace(/[^A-Z0-9_-]+/gi, '-')));

        if(typeof this.currentPage.afterRender !== 'undefined')
            this.currentPage.afterRender();
    }

    /**
     * @returns {Promise}
     */
    reloadPage()
    {
        return this.navBack(0);
    }

    /**
     * @param {object} page
     * @private
     */
    drawPage(page)
    {
        let _this = this;

        this.$page.attr('class', page.id.replace(/[^A-Z0-9_-]+/gi, '-'));

        if(typeof page.template !== 'undefined')
        {
            let $template = this.renderer.createTemplate(page.template);

            let data = typeof page.data !== 'undefined' ? page.data : {};

            Object.assign(data, {
                app: {
                    config: this.config,
                }
            });

            this.$page.html(this.renderer.renderTemplate($template, data));
        }
        else
        {
            window.console.log('Warning: Page "' + page.id + '" has no template.');
            // what should we do with a page that has no template??
        }

        if(typeof page.refresh === 'undefined')
        {
            this.uninstallPullToRefresh();
        }
        else
        {
            this.pullToRefresh();
            this.$page.on('refresh.pulltorefresh', function($e) {
                _this.showRefreshThrobber();
                let p = new Promise((resolve, reject) => {
                    page.refresh(resolve, reject);
                });

                p
                    .then(function() {
                        _this.hideRefreshThrobber();
                    })
                    .catch(function(r) {
                        window.console.log('Notice: caught a Promise rejection while calling a page\'s refresh() method:')
                        window.console.log(r);
                    })
                ;
            });
        }
    }

    drawDialog(dialog, $dialog)
    {
        if(typeof dialog.template !== 'undefined')
        {
            let $template = this.renderer.createTemplate(dialog.template);

            let data = typeof dialog.data !== 'undefined' ? dialog.data : {};

            Object.assign(data, {
                app: {
                    config: this.config,
                }
            });

            let $div = jQuery('<div>');
            $div.html(this.renderer.renderTemplate($template, data));
            $dialog.html($div);
        }
        else
        {
            window.console.log('Warning: Dialog "' + dialog.id + '" has no template.');
        }

        if(typeof dialog.afterRender !== 'undefined')
            dialog.afterRender();
    }

    /**
     * @param {object} page
     * @private
     */
    navDone(page)
    {
        this.drawPage(page);

        // scroll to top
        window.scrollTo(0, 0);

        // we don't check for type === 'function', because we WANT to throw the dev an error if they try to call
        // a string or something. that's probably a mistake on the dev's part; hiding that mistake would be
        // frustrating.
        if(typeof page.afterRender !== 'undefined')
            page.afterRender();

        Object.values(this.services).forEach(function(s) {
            if(typeof s.navDone !== 'undefined')
                s.navDone(page);
        });

        // hide the loading throbber
        this.$loadingThrobber.css('display', 'none');
    }

    /**
     * @returns {Promise}
     */
    navBack(distance)
    {
        if(typeof distance === 'undefined') distance = 1;
        if(distance < 0) distance = 0;

        return new Promise((resolve, reject) => {

            // close all open dialogs & flash messages
            this.closeDialog();
            this.clearFlash();

            if(this.navStack.length <= distance)
            {
                window.console.log('Warning: Cannot go back ' + distance + ' pages - the nav history only contains ' + this.navStack.length + ' items.');
                reject();
                return;
            }

            let page = this.navStack[this.navStack.length - distance - 1];

            if(distance > 0) this.navStack.splice(-distance);

            this.nav(page.id, page.args).then(() => resolve).catch(() => reject);
        });
    }

    /**
     * @param {string} action
     * @param {jQuery} $element
     * @param {Event} event
     * @private
     */
    callAction(action, $element, event)
    {
        if(action.indexOf(':') >= 0)
        {
            let serviceName = action.substr(0, action.indexOf(':'));
            let methodName = action.substr(action.indexOf(':') + 1);

            let service = this.getService(serviceName);

            if(service === null)
                window.console.log('Warning: tried to call Action "' + methodName + '" on Service "' + serviceName + '", but no such Service exists.');
            else if(typeof service[methodName] !== 'undefined')
                service[methodName]($element, event);
            else
                window.console.log('Warning: tried to call Action "' + methodName + '" on Service "' + serviceName + '", but no such Action on that Service.');
        }
        else if(this.currentDialog !== null)
        {
            // we don't check for type === 'function', because we WANT to throw the dev an error if they try to call
            // a string or something. that's probably a mistake on the dev's part; hiding that mistake would be
            // frustrating.
            if(typeof this.currentDialog[action] !== 'undefined')
                this.currentDialog[action]($element, event);
            else
                window.console.log('Warning: tried to call Action "' + action + '", but there is no such Action on Dialog "' + this.currentDialog.id + '".');
        }
        else
        {
            if(typeof this.currentPage[action] !== 'undefined')
                this.currentPage[action]($element, event);
            else
                window.console.log('Warning: tried to call Action "' + action + '", but there is no such Action on Page "' + this.currentPage.id + '".');
        }
    }

    /**
     * @param {string} dialogId
     * @param args
     */
    openDialog(dialogId, args)
    {
        if(!this.dialogs.hasOwnProperty(dialogId))
        {
            window.console.log('Warning: tried to open Dialog "' + dialogId + '", but no such Dialog exists.');
            return;
        }

        let _this = this;
        let dialog = this.dialogs[dialogId];
        let $dialog = jQuery('#' + dialogId.replace(/[^A-Z0-9_-]+/gi, '-'));

        this.currentDialog = dialog;

        // we don't check for type === 'function', because we WANT to throw the dev an error if they try to call
        // a string or something. that's probably a mistake on the dev's part; hiding that mistake would be
        // frustrating.
        if(typeof dialog.open !== 'undefined')
        {
            let openPromise = new Promise((resolve, reject) => {
                _this.dialogs[dialogId].open(resolve, reject, args);
            });

            openPromise
                .then(() => {
                    _this.drawDialog(dialog, $dialog);
                    $dialog.addClass('open');
                })
                .catch((r) => {
                    window.console.log('Warning: error while opening Dialog "' + dialogId + '".');
                    window.console.log(r);
                })
            ;
        }
        else
        {
            _this.drawDialog(dialog, $dialog);
            $dialog.addClass('open');
        }
    }

    closeDialog()
    {
        this.currentDialog = null;
        jQuery('dialog.open').removeClass('open');
    }

    /**
     * @param {string} message
     */
    flash(message)
    {
        if(this.$flash.is(':visible'))
            this.$flash.append('<p>' + message + '</p>');
        else
            this.$flash.css('display', 'block').html('<p>' + message + '</p>');
    }

    clearFlash()
    {
        this.$flash.css('display', 'none').empty();
    }

    /**
     * @private
     */
    uninstallPullToRefresh()
    {
        this.$page
            .off(this.touchEvents.start)
            .off(this.touchEvents.move)
            .off(this.touchEvents.end)
            .off('mousedown.pulltorefresh')
        ;

        jQuery(document)
            .off('mousemove.pulltorefresh')
            .off('mouseup.pulltorefresh')
        ;
    }

    /**
     * @private
     */
    pullToRefresh()
    {
        let $element = this.$page;

        let options = {
            sensibility: 5, // number of pixels to each call of "move" event
            refresh: 60, // value in pixels to fire "refresh" event
            lockRefresh: false, // indicates that the user can pull up to get the value "refresh"
            autoInit: true, // indicates that the "PullToRefresh" object must be built on startup "plugin"
            resetSpeed: '100ms', // speed of reset animation in milliseconds
        };

        let $document = jQuery(document);

        let flags = {
            prevented: false,
            touching: false,
            pulling: false,
            isTouch: false,
        };

        let positions = {
            startY: 0,
            startX: 0,
            currentY : 0,
            currentX : 0,
            lastStep: 0,
        };

        $element
            .on(this.touchEvents.start, onTouchStart)
            .on(this.touchEvents.move, onTouchMove)
            .on(this.touchEvents.end, onTouchEnd)
            .on('mousedown.pulltorefresh', onTouchStart)
        ;

        $document
            .on('mousemove.pulltorefresh', $element, onTouchMove)
            .on('mouseup.pulltorefresh', $element, onTouchEnd)
        ;

        /**
         * Method to transform the Element in pixels
         * @param {CSSProperties} style .style of Element
         * @param {int} value value of tranformation
         * @method
         */
        function transform(style, value)
        {
            style.webkitTransform = 'translate(0, ' + value + 'px) translateZ(0)';

            style.msTransform =
                style.MsTransform =
                    style.MozTransform =
                        style.OTransform =
                            style.transform = 'translateY(' + value + 'px)';
        }


        /**
         * Method to set a transition on Element
         * @param {CSSProperies} style .style of Element
         * @param {string} ms css value to duration of transition
         * @method
         */
        function transition(style, ms)
        {
            style.webkitTransitionDuration =
                style.MozTransitionDuration =
                    style.msTransitionDuration =
                        style.OTransitionDuration =
                            style.transitionDuration = ms;
        }

        /**
         * Method to get x and y axis from event
         * @param {MouseEvent|TouchEvent} event Event by mousedown or touchstart
         * @param {Boolean} isTouchEvent flag to indicate a touch event
         * @return {object} Object with x and y values like "{x: 1, y: 1}"
         * @method
         */
        function getAxis(event, isTouchEvent)
        {
            return {
                x: isTouchEvent ? (event.targetTouches || event.originalEvent.targetTouches)[0].pageX : (event.pageX || event.clientX),
                y: isTouchEvent ? (event.targetTouches || event.originalEvent.targetTouches)[0].pageY : (event.pageY || event.clientY)
            };
        }

        /**
         * method to listen event start
         * @param {MouseEvent|TouchEvent} event Original event fired by DOM
         * @method
         */
        function onTouchStart(event)
        {
            let
                isTouchEvent = event.type === 'touchstart',
                axis = getAxis(event, isTouchEvent)
            ;

            // only move $element if $document do not have scroll
            if ($document.scrollTop() > 0)
                return true;

            // if not left click, cancel
            if(!isTouchEvent && event.which !== 1)
                return;

            flags.isTouch = isTouchEvent;
            flags.touching = true;

            positions.startY = axis.y;
            positions.startX = axis.x;
            positions.currentY = axis.y;
            positions.currentX = axis.x;

            $element.trigger('start.pulltorefresh', [axis.y]);

            transition($element[0].style, "0ms");
        }

        /**
         * Method to listen the movement of element
         * @param {MouseEvent|TouchEvent} event Original move event fired by DOM
         * @method
         */
        function onTouchMove(event)
        {
            let
                isTouchEvent = event.type === 'touchmove',
                delta,
                step,
                percentage,
                axis
            ;

            // if not touched or hasTouchEvent and the eventType is a desktop event cancel the move
            if(!(flags.touching) || (flags.isTouch && event.type === 'mousemove'))
                return;

            // detect if element has click
            if(!flags.prevented && event.target && (event.target.click || event.target.onclick))
            {
                jQuery(event.target).off('click');

                setTimeout(
                    () => { jQuery(event.target).on('click'); },
                    0
                );

                flags.prevented = true;
            }

            // get axis pair
            axis = getAxis(event, isTouchEvent);
            positions.currentY = axis.y;
            positions.currentX = axis.x;

            // get variation of position between start y axis and current y axis
            delta = (axis.y - positions.startY);

            // ignore pulling up
            if(delta <= 0)
                return;

            if(delta > 20)
                flags.pulling = true;

            if(delta >= options.refresh)
                $element.addClass('pullWillRefresh');
            else
                $element.removeClass('pullWillRefresh');

            // current step, necessary to define if call move event
            step = parseInt(delta / options.sensibility, 10);

            // if is a next step, fire event and inform the perncentage of pull
            if(positions.lastStep != step)
            {
                percentage = parseInt((delta * 100) / options.refresh, 10);
                $element.trigger('move.pulltorefresh', percentage);
                positions.lastStep = step;
            }

            // finally tranform element to current touch position
            if(delta > options.refresh)
            {
                // don't go over the max refresh pull
                transform($element[0].style, options.refresh);
                positions.startY = positions.currentY - options.refresh;
            }
            else
                transform($element[0].style, delta);

            event.stopPropagation();
            event.preventDefault();
        }

        /**
         * Method to listen the end of touch event
         * @param {MouseEvent|TouchEvent} event Original end event fired by DOM
         * @method
         */
        function onTouchEnd(event)
        {
            if(flags.pulling)
            {
                flags.prevented = false;

                // get variation of position between start y axis and current y axis
                let delta = (positions.currentY - positions.startY);

                // fires the refresh event if necessary and not has been triggered before
                if(delta >= options.refresh)
                {
                    // fire refresh event
                    $element.trigger('refresh.pulltorefresh', positions.currentY);
                }

                transition($element[0].style, options.resetSpeed);
                transform($element[0].style, 0);
            }

            flags.touching = false;
            flags.pulling = false;
            flags.isTouch = false;
            positions.startY = false;

            $element.removeClass('pullWillRefresh');
        }
    }
}