/*
 * # Semantic - Sidebar
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributor
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ( $, window, document, undefined ) {

"use strict";

$.fn.sidebar = function(parameters) {
  var
    $allModules    = $(this),
    $head          = $('head'),

    moduleSelector = $allModules.selector || '',

    time           = new Date().getTime(),
    performance    = [],

    query          = arguments[0],
    methodInvoked  = (typeof query == 'string'),
    queryArguments = [].slice.call(arguments, 1),

    requestAnimationFrame = window.requestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function(callback) { setTimeout(callback, 0); },

    returnedValue
  ;

  $allModules
    .each(function() {
      var
        settings        = ( $.isPlainObject(parameters) )
          ? $.extend(true, {}, $.fn.sidebar.settings, parameters)
          : $.extend({}, $.fn.sidebar.settings),

        selector        = settings.selector,
        className       = settings.className,
        namespace       = settings.namespace,
        error           = settings.error,

        eventNamespace  = '.' + namespace,
        moduleNamespace = 'module-' + namespace,

        $module         = $(this),
        $context        = $(settings.context),
        $style          = $('style[title=' + namespace + ']'),

        $sidebars       = $context.children(selector.sidebar),
        $pusher         = $context.children(selector.pusher),
        $page           = $pusher.children(selector.page),
        $fixed          = $pusher.find(selector.fixed),

        element         = this,
        instance        = $module.data(moduleNamespace),

        transitionEnd,

        module
      ;

      module      = {

        initialize: function() {
          module.debug('Initializing sidebar', $module);

          transitionEnd = module.get.transitionEvent();

          module.setup.context();

          // avoid locking rendering to change layout if included in onReady
          requestAnimationFrame(module.setup.layout);

          module.instantiate();
        },

        instantiate: function() {
          module.verbose('Storing instance of module', module);
          instance = module;
          $module
            .data(moduleNamespace, module)
          ;
        },

        destroy: function() {
          module.verbose('Destroying previous module for', $module);
          $module
            .off(eventNamespace)
            .removeData(moduleNamespace)
          ;
        },

        event: {
          clickaway: function(event) {
            if( $module.find(event.target).size() === 0 && $(event.target).filter($module).size() === 0 ) {
              module.verbose('User clicked on dimmed page');
              module.hide();
            }
          },
          scroll: function(event) {
            if( $module.find(event.target).size() === 0 && $(event.target).filter($module).size() === 0 ) {
              event.preventDefault();
            }
          }
        },

        bind: {
          clickaway: function() {
            if(settings.scrollLock) {
              $(window)
                .on('DOMMouseScroll' + eventNamespace, module.event.scroll)
              ;
            }
            $context
              .on('click' + eventNamespace, module.event.clickaway)
              .on('touchend' + eventNamespace, module.event.clickaway)
            ;
          }
        },
        unbind: {
          clickaway: function() {
            $context
              .off(eventNamespace)
            ;
            if(settings.scrollLock) {
              $(window).off('DOMMouseScroll' + eventNamespace);
            }
          }
        },

        refresh: function() {
          module.verbose('Refreshing selector cache');
          $context  = $(settings.context);
          $style    = $('style[title=' + namespace + ']');
          $sidebars = $context.children(selector.sidebar);
          $pusher   = $context.children(selector.pusher);
          $page     = $pusher.children(selector.page);
          $fixed    = $pusher.find(selector.fixed);
        },

        repaint: function() {
          module.verbose('Forcing repaint event');
          var fakeAssignment = $context[0].offsetWidth;
        },

        setup: {
          layout: function() {
            if( $context.find(selector.pusher).size() === 0 ) {
              module.debug('Adding wrapper element for sidebar');
              $pusher = $('<div class="pusher" />');
              $page   = $('<div class="page" />');
              $pusher.append($page);
              $context
                .children()
                  .not(selector.omitted)
                  .not($sidebars)
                  .wrapAll($pusher)
              ;
            }
            if($module.prevAll($page)[0] !== $page[0]) {
              module.debug('Moved sidebar to correct parent element');
              $module.detach().prependTo($context);
            }
            module.refresh();
          },
          context: function() {
            module.verbose('Adding pusshable class to wrapper');
            $context.addClass(className.pushable);
          }
        },

        attachEvents: function(selector, event) {
          var
            $toggle = $(selector)
          ;
          event = $.isFunction(module[event])
            ? module[event]
            : module.toggle
          ;
          if($toggle.size() > 0) {
            module.debug('Attaching sidebar events to element', selector, event);
            $toggle
              .off(eventNamespace)
              .on('click' + eventNamespace, event)
            ;
          }
          else {
            module.error(error.notFound);
          }
        },

        show: function(callback) {
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          module.debug('Showing sidebar', callback);
          if(module.is.closed()) {
            if(settings.overlay)  {
              settings.transition = 'overlay';
            }
            if(settings.transition !== 'overlay') {
              module.hideAll();
            }
            module.pushPage(function() {
              module.set.active();
              $.proxy(callback, element)();
              $.proxy(settings.onShow, element)();
            });
            $.proxy(settings.onChange, element)();
            $.proxy(settings.onVisible, element)();
          }
          else {
            module.debug('Sidebar is already visible');
          }
        },

        hide: function(callback) {
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          module.debug('Hiding sidebar', callback);
          if(module.is.visible()) {
            module.pullPage(function() {
              $.proxy(callback, element)();
              $.proxy(settings.onHidden, element)();
            });
            $.proxy(settings.onChange, element)();
            $.proxy(settings.onHide, element)();
          }
        },

        hideAll: function() {
          var
            $visibleSidebars = $sidebars.find('.' + className.visible)
          ;
          $visibleSidebars
            .sidebar('hide')
          ;
        },

        toggle: function() {
          module.verbose('Determining toggled direction');
          if(module.is.closed()) {
            module.show();
          }
          else {
            module.hide();
          }
        },

        pushPage: function(callback) {
          var
            $transition = (settings.transition == 'safe')
              ? $context
              : (settings.transition == 'overlay')
                ? $module
                : $pusher,
            transition
          ;
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          transition = function() {
            module.set.visible();
            module.set.transition();
            module.set.direction();
            requestAnimationFrame(function() {
              module.set.inward();
              module.set.pushed();
            });
          };
          $transition
            .on(transitionEnd, function(event) {
              if( event.target == $transition[0] ) {
                $transition.off(transitionEnd);
                module.remove.inward();
                module.bind.clickaway();
                $.proxy(callback, element)();
              }
            })
          ;
          module.verbose('Adding context push state', $context);
          if(settings.transition === 'overlay') {
            requestAnimationFrame(transition);
          }
          else {
            $module.scrollTop(0);
            if(module.is.mobile()) {
              window.scrollTo(0, 0);
            }
            module.remove.allVisible();
            requestAnimationFrame(transition);
          }
        },

        pullPage: function(callback) {
          var
            $transition = (settings.transition == 'safe')
              ? $context
              : (settings.transition == 'overlay')
                ? $module
                : $pusher
          ;
          callback = $.isFunction(callback)
            ? callback
            : function(){}
          ;
          module.verbose('Removing context push state', module.get.direction());
          module.unbind.clickaway();
          $transition
            .on(transitionEnd, function(event) {
              if( event.target == $transition[0] ) {
                $transition.off(transitionEnd);
                module.remove.transition();
                module.remove.direction();
                module.remove.outward();
                module.remove.visible();
                $.proxy(callback, element)();
              }
            })
          ;
          module.set.outward();
          module.remove.active();
          module.remove.pushed();
        },

        set: {
          active: function() {
            $context.addClass(className.active);
          },
          direction: function(direction) {
            direction = direction || module.get.direction();
            $context.addClass(className[direction]);
          },
          visible: function() {
            $module.addClass(className.visible);
          },
          transition: function(transition) {
            transition = transition || ( module.is.mobile() )
              ? settings.mobileTransition
              : settings.transition
            ;
            $context.addClass(transition);
          },
          inward: function() {
            $context.addClass(className.inward);
          },
          outward: function() {
            $context.addClass(className.outward);
          },
          pushed: function() {
            $context.addClass(className.pushed);
          }
        },
        remove: {
          active: function() {
            $context.removeClass(className.active);
          },
          visible: function() {
            $module.removeClass(className.visible);
          },
          allVisible: function() {
            if($sidebars.hasClass(className.visible)) {
              module.debug('Other sidebars visible, hiding');
              $sidebars.removeClass(className.visible);
            }
          },
          transition: function(transition) {
            transition = transition || ( module.is.mobile() )
              ? settings.mobileTransition
              : settings.transition
            ;
            $context.removeClass(transition);
          },
          pushed: function() {
            $context.removeClass(className.pushed);
          },
          inward: function() {
            $context.removeClass(className.inward);
          },
          outward: function() {
            $context.removeClass(className.outward);
          },
          direction: function(direction) {
            direction = direction || module.get.direction();
            $context.removeClass(className[direction]);
          }
        },

        get: {
          direction: function() {
            if($module.hasClass(className.top)) {
              return className.top;
            }
            else if($module.hasClass(className.right)) {
              return className.right;
            }
            else if($module.hasClass(className.bottom)) {
              return className.bottom;
            }
            else {
              return className.left;
            }
          },
          transitionEvent: function() {
            var
              element     = document.createElement('element'),
              transitions = {
                'transition'       :'transitionend',
                'OTransition'      :'oTransitionEnd',
                'MozTransition'    :'transitionend',
                'WebkitTransition' :'webkitTransitionEnd'
              },
              transition
            ;
            for(transition in transitions){
              if( element.style[transition] !== undefined ){
                return transitions[transition];
              }
            }
          }
        },

        is: {
          mobile: function() {
            var
              userAgent    = navigator.userAgent,
              mobileRegExp = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/,
              isMobile     = mobileRegExp.test(userAgent)
            ;
            if(isMobile) {
              module.verbose('Browser was found to be mobile', userAgent);
              return true;
            }
            else {
              module.verbose('Browser is not mobile, using regular transition', userAgent);
              return false;
            }
          },
          closed: function() {
            return !module.is.visible();
          },
          visible: function() {
            return $module.hasClass(className.visible);
          },
          vertical: function() {
            return $module.hasClass(className.top);
          },
          inward: function() {
            return $context.hasClass(className.inward);
          },
          outward: function() {
            return $context.hasClass(className.outward);
          },
          animating: function() {
            return module.is.inward() || module.is.outward();
          }
        },

        setting: function(name, value) {
          module.debug('Changing setting', name, value);
          if( $.isPlainObject(name) ) {
            $.extend(true, settings, name);
          }
          else if(value !== undefined) {
            settings[name] = value;
          }
          else {
            return settings[name];
          }
        },
        internal: function(name, value) {
          if( $.isPlainObject(name) ) {
            $.extend(true, module, name);
          }
          else if(value !== undefined) {
            module[name] = value;
          }
          else {
            return module[name];
          }
        },
        debug: function() {
          if(settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },
        verbose: function() {
          if(settings.verbose && settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },
        error: function() {
          module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
          module.error.apply(console, arguments);
        },
        performance: {
          log: function(message) {
            var
              currentTime,
              executionTime,
              previousTime
            ;
            if(settings.performance) {
              currentTime   = new Date().getTime();
              previousTime  = time || currentTime;
              executionTime = currentTime - previousTime;
              time          = currentTime;
              performance.push({
                'Element'        : element,
                'Name'           : message[0],
                'Arguments'      : [].slice.call(message, 1) || '',
                'Execution Time' : executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 100);
          },
          display: function() {
            var
              title = settings.name + ':',
              totalTime = 0
            ;
            time = false;
            clearTimeout(module.performance.timer);
            $.each(performance, function(index, data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if(moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if(console.table) {
                console.table(performance);
              }
              else {
                $.each(performance, function(index, data) {
                  console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },
        invoke: function(query, passedArguments, context) {
          var
            object = instance,
            maxDepth,
            found,
            response
          ;
          passedArguments = passedArguments || queryArguments;
          context         = element         || context;
          if(typeof query == 'string' && object !== undefined) {
            query    = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            $.each(query, function(depth, value) {
              var camelCaseValue = (depth != maxDepth)
                ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                : query
              ;
              if( $.isPlainObject( object[camelCaseValue] ) && (depth != maxDepth) ) {
                object = object[camelCaseValue];
              }
              else if( object[camelCaseValue] !== undefined ) {
                found = object[camelCaseValue];
                return false;
              }
              else if( $.isPlainObject( object[value] ) && (depth != maxDepth) ) {
                object = object[value];
              }
              else if( object[value] !== undefined ) {
                found = object[value];
                return false;
              }
              else {
                module.error(error.method, query);
                return false;
              }
            });
          }
          if ( $.isFunction( found ) ) {
            response = found.apply(context, passedArguments);
          }
          else if(found !== undefined) {
            response = found;
          }
          if($.isArray(returnedValue)) {
            returnedValue.push(response);
          }
          else if(returnedValue !== undefined) {
            returnedValue = [returnedValue, response];
          }
          else if(response !== undefined) {
            returnedValue = response;
          }
          return found;
        }
      }
    ;

    if(methodInvoked) {
      if(instance === undefined) {
        module.initialize();
      }
      module.invoke(query);
    }
    else {
      if(instance !== undefined) {
        module.destroy();
      }
      module.initialize();
    }
  });

  return (returnedValue !== undefined)
    ? returnedValue
    : this
  ;
};

$.fn.sidebar.settings = {

  name             : 'Sidebar',
  namespace        : 'sidebar',

  debug            : false,
  verbose          : false,
  performance      : false,

  workaround       : false,
  transition       : 'overlay',
  mobileTransition : 'slide along',
  context          : 'body',
  exclusive        : true,

  scrollLock       : false,

  onChange         : function(){},
  onShow           : function(){},
  onHide           : function(){},

  onHidden         : function(){},
  onVisible        : function(){},


  className        : {
    pushable : 'pushable',
    active   : 'active',
    visible  : 'visible',
    pushed   : 'pushed',
    inward   : 'show',
    outward  : 'hide'
  },

  selector: {
    sidebar : '.ui.sidebar',
    pusher  : '.pusher',
    fixed   : '.ui.fixed',
    page    : '.page',
    omitted : 'script, link, style, .ui.modal, .ui.nag, .ui.fixed'
  },

  error   : {
    method   : 'The method you called is not defined.',
    notFound : 'There were no elements that matched the specified selector'
  }

};

})( jQuery, window , document );