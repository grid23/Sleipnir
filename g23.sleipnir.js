(function(root){
    var 
        _Sleipnir = root.Sleipnir
      , Sleipnir = root.Sleipnir = {}

      , document = root.document

      , $ = (function(){
            var
                slice = Array.prototype.slice
              , unshift = Array.prototype.unshift
              , toString = Object.prototype.toString

              , is = (function(){
                    var isNative = function(fn){
                        return typeof fn == "function" && fn.toString().match(/\s\[native code\]\s/)
                    }
                    return {
                        "arguments" : function(o){
                            return toString.call(o) == "[object Arguments]"
                        }
                      , "array" : (function(){
                            if ( isNative(Array.isArray) )
                              return function(o){ return Array.isArray(o) }
                            return function(o){ return toString.call(o) == "[object Array]" }
                        }())
                      , "boolean" : function(o){
                            return toString.call(o) == "[object Boolean]"
                        }
                      , "function" : function(o){
                            return typeof o == "function"
                        }
                      , "element" : function(o){
                            return (o instanceof HTMLElement)
                        }
                      , "null" : function(o){
                            return o === null
                        }
                      , "number" : function(o){
                            return typeof o == "number" || toString.call(o) == ["object Number"]
                        }
                      , "object" : function(o){
                            return typeof o == "object" && ( o instanceof Object )
                        }
                      , "primitive" : function(){}
                      , "regexp" : function(o){
                            return toString.call(o) == "[object Regexp]"
                        }
                      , "string" : function(o){
                            return typeof o == "string" || toString.call(o) == "[object String]"
                        }
                      , "undefined" : function(o){
                            return typeof o == "undefined"
                        }
                    }
                }())
            return {
                is : is

              , args : {
                    toArray : function(args, from, to){
                        return slice.call(args, from, to)
                    }
                  , unshift : function(args, add){
                        var arr = slice.call(args)
                        arr.unshift(add) 
                        return arr
                    }
                }

              , mix : function mix(){
                    var o
                    if ( is.array(arguments[0]) )
                      o = []
                    else if ( is.object(arguments[0]) )
                      o = {}
                    else
                      throw new Error('bad argument type')

                    for (var i=0, l=arguments.length; i<l; i++)  if ( (arguments[i]).constructor === (o).constructor  )
                      (function(t){
                          for ( var p in t ) if ( t.hasOwnProperty(p) ) {
                            if ( is.object(t[p]) || is.array(t[p]) )
                              o[p] = mix(t[p])
                            else
                              o[p] = t[p]
                            }
                      }(arguments[i]))
                    console.dir(o)
                    return o
                }
                
              , addEventListener : (function(){
                    if ( root.addEventListener )
                      return function(el, ev, fn, c){
                          return el.addEventListener(ev, fn, !!c)
                      }
                    return function(el, ev, fn){
                          return el.attachEvent('on'+ev, function(e){
                              var e = e || root.event
                              e.target = e.srcElement
                              e.relatedTarget = e.boundElement
                              e.isImmediatePropagationStopped = e.isImmediatePropagationStopped || false
                              e.preventDefault = e.preventDefault || function(){
                                  e.returnValue = false
                              }
                              e.stopPropagation = e.stopPropagation || function(){
                                  e.cancelBubble = true
                              }
                              e.stopImmediatePropagation = e.stopImmediatePropagation || function(){
                                e.stopPropagation()
                                e.isImmediatePropagationStopped = true
                              }
                              if ( !e.isImmediatePropagationStopped )
                                fn(e)
                          })
                    }
                }())
              , removeEventListener : (function(){
                    if ( root.removeEventListener )
                      return function(object, listener, fn, capture){
                          return object.removeEventListener(listener, fn)
                      }
                    return function(){
                        return object.detachEvent('on'+listener, fn)
                    }
                }())
            }
        }())


      , EventEmitter = (function(){
            var
                setImmediate = (function(){
                    var queue = []
                      , hasSI = !!(root.setImmediate || root.msSetImmediate)
                      , hasPM = root.addEventListener && root.postMessage

                    if ( !hasSI && hasPM )
                      root.addEventListener('message', function(e){
                          if ( e.data === "__events_immediate__" ) if (queue.length)
                            queue.shift()() // take the first fn from the array and execute it
                      }, false)

                    return root.setImmediate || root.msSetImmediate ||
                           (function(){
                               if ( hasPM )
                                 return function(fn){
                                     queue.push(fn)
                                     root.postMessage('__events_immediate__', root.location.href)
                                 }
                               return function(fn){
                                   setTimeout(fn, 0)
                               }
                           }())
                }())
              , EventEmitter = function(){
                    this._eeEvents = {}
                }
              , EventEmitterProto = EventEmitter.prototype = {
                    on: function(eventName, eventCallback, eventRuns){
                        this._eeEvents[eventName] = this._eeEvents[eventName] || []
                        this._eeEvents[eventName].push(new EventHandler(eventCallback, eventRuns, this))
                        return this
                    }
                  , once: function(eventName, eventCallback){
                        return this.on(eventName, eventCallback, 1)
                    }
                  , off: function(eventName, eventCallback, all){
                        var event = this._eeEvents[eventName]
                        if ( !event )
                          return this
                        for ( var i=0, l=event.length; i<l; i++ )
                          if ( event[i].is(eventCallback) ){
                            event.splice(i,1)
                            if (!!all)
                              return this.off(eventName, eventCallback)
                            return this
                          }
                        return this
                    }
                  , emit: function(eventName){
                        var event = this._eeEvents[eventName]
                        if ( !event )
                          return this
                        for ( var i=0, l=event.length; i<l; i++ )
                          event[i].fire(arguments)
                        return this
                    }
                }

              , EventHandler = EventEmitter.EventHandler = function(handler, runs, parent){
                    this.handler = handler
                    this.runs = runs || Infinity
                    this.USE_RUNS = !!runs || false
                    this.parent = parent
                }
              , EventHandlerProto = EventHandler.prototype = {
                    fire : function(args){
                        var length = args.length
                          , handler = this.handler
                          , context = this.parent
                        if ( this.USE_RUNS ) {
                          if ( !this.runs ) return
                          this.runs--
                        }
                        if ( length == 1 )
                          return setImmediate( function(){ handler.call(context) } )
                        if ( length == 2 )
                          return setImmediate( function(){ handler.call(context, args[1]) } )
                        if ( length == 3 )
                          return setImmediate( function(){ handler.call(context, args[1], args[2]) } )
                        if ( length == 4 )
                          return setImmediate( function(){ handler.call(context, args[1], args[2], args[3]) } )
                        for ( var i=1, arr=[], l=length; i<l; i++ )
                            arr.push(args[i])
                        return setImmediate( function(){ handler.apply(context, arr) } )
                    }
                  , is : function(fn){
                        return this.handler === fn
                    }
                }
            return EventEmitter
        }())


      , Module = Sleipnir.Module = (function($){
            var inherit = function(scope, heritage){
                    for ( var i=0, l=heritage.length; i<l; i++ )
                      if ( $.is.array(heritage[i]) )
                        heritage[i][0].apply(scope, heritage[i].slice(1))
                      else
                        heritage[i].call(scope)
                }
              , DNA = function(ee, self, heritage){
                    var mixins = [ee.prototype]
                    for ( var i=0, l=heritage.length; i<l; i++ )
                      if ( $.is.array(heritage[i]) )
                        mixins.push((heritage[i][0].prototype || {}))
                      else
                        mixins.push((heritage[i].prototype || {}))
                    mixins.push(self || {})
                    return $.mix.apply(null, mixins)
                }
            return function(){
                var heritage = $.args.toArray(arguments) //all objects are instance of EventEmitter
                  , Egg = function(){
                        EventEmitter.call(this)
                        inherit(this, heritage)
                        if ( !arguments.length )
                          self._construct()
                        else if ( arguments.length == 1)
                          self._construct.call(this, arguments[0])
                        else if ( arguments.length == 2)
                          self._construct.call(this, arguments[0], arguments[1])
                        else
                          self._construct.apply(this, arguments)
                    }
                  , self = heritage.pop().call(Egg, $)
                  , EggProto = Egg.prototype = DNA(EventEmitter, self, heritage)

                return Egg
            }
        }($))
}(this))