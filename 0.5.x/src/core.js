(function(root){ "use strict"
    var ns = {}
      , version = ns.version = "ES3-0.5.12"

      , noop = function(){}

      , toType = ns.toType = (function(){
            var toString = Object.prototype.toString

            return function(o){
                return toString.call(o)
            }
        }())
      , isArray = ns.isArray = Array.isArray || function(o){ return toType(o) === "[object Array]" }
      , slice = ns.slice = (function(){ 
            var slice = Array.prototype.slice
            return function(o, i){
                return slice.call(o, i)
            }
        }())
      , indexOf = ns.indexOf = (function(){
            if ( Array.prototype.indexOf )
              return function(a, s){
                  return a.indexOf(s)
              }
            return function(a, s){
                var i, l
                for ( i = 0, l = a.length; i<l; i++ )
                  if ( a[i] === s )
                    return i
                  return -1
            }
        }())
      , trim = ns.trim = (function(){
            if ( String.prototype.trim )
              return function(str){
                  return str.trim()
              }
            return function(str){
                return str.replace(/^\s+|\s+$/g, "")
            }
        }())
      , enumerate = ns.enumerate = Object.keys || function(o){
            var k, arr = []
            for ( k in o ) if ( o.hasOwnProperty(k) )
              arr.push(k)
            return arr
        }
      , JSON = ns.JSON = root.JSON || (function(){
            // JSON2.JS by Douglas Crockford
           var JSON = {}
           ;(function(){"use strict";function f(t){return 10>t?"0"+t:t}function quote(t){return escapable.lastIndex=0,escapable.test(t)?'"'+t.replace(escapable,function(t){var e=meta[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+t+'"'}function str(t,e){var r,n,o,f,u,p=gap,i=e[t];switch(i&&"object"==typeof i&&"function"==typeof i.toJSON&&(i=i.toJSON(t)),"function"==typeof rep&&(i=rep.call(e,t,i)),typeof i){case"string":return quote(i);case"number":return isFinite(i)?i+"":"null";case"boolean":case"null":return i+"";case"object":if(!i)return"null";if(gap+=indent,u=[],"[object Array]"===Object.prototype.toString.apply(i)){for(f=i.length,r=0;f>r;r+=1)u[r]=str(r,i)||"null";return o=0===u.length?"[]":gap?"[\n"+gap+u.join(",\n"+gap)+"\n"+p+"]":"["+u.join(",")+"]",gap=p,o}if(rep&&"object"==typeof rep)for(f=rep.length,r=0;f>r;r+=1)"string"==typeof rep[r]&&(n=rep[r],o=str(n,i),o&&u.push(quote(n)+(gap?": ":":")+o));else for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(o=str(n,i),o&&u.push(quote(n)+(gap?": ":":")+o));return o=0===u.length?"{}":gap?"{\n"+gap+u.join(",\n"+gap)+"\n"+p+"}":"{"+u.join(",")+"}",gap=p,o}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;"function"!=typeof JSON.stringify&&(JSON.stringify=function(t,e,r){var n;if(gap="",indent="","number"==typeof r)for(n=0;r>n;n+=1)indent+=" ";else"string"==typeof r&&(indent=r);if(rep=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw Error("JSON.stringify");return str("",{"":t})}),"function"!=typeof JSON.parse&&(JSON.parse=function(text,reviver){function walk(t,e){var r,n,o=t[e];if(o&&"object"==typeof o)for(r in o)Object.prototype.hasOwnProperty.call(o,r)&&(n=walk(o,r),void 0!==n?o[r]=n:delete o[r]);return reviver.call(t,e,o)}var j;if(text+="",cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})),/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return j=eval("("+text+")"),"function"==typeof reviver?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}())
           return JSON
        }())

      , hasObjectCreate = typeof Object.create == "function"
      , inherit = function(object){
          if(hasObjectCreate) return Object.create(object)
          function K(){}
          K.prototype = object
          return new K()
        }

      , serialize = ns.serialize = function(){
            var args = arguments.length > 1 && arguments || arguments[0]
              , iterator = new Iterator(args), ite = iterator.enumerate(), i = 0, l = ite.length
              , str = []

            for ( ; i < l; i++ )
              str.push( encodeURIComponent(ite[i][0]) +"="+ encodeURIComponent(ite[i][1]) )

            return str.join("&").replace(/%20/g, "+")
        }
      , objectify = ns.objectify = (function(){
            var ramp = /&amp;|&/g

            return function(str){
                var o = {}
                  , pairs = !!~ str.search(ramp) ? str.split(ramp) : str.length ? [str] : []
                  , iterator = new Iterator(pairs), ite = iterator.enumerate(), i = 0, l = ite.length

                for ( ; i < l; i++ )
                  (function(pair, o){
                      var pair = decodeURIComponent(pair.replace(/\+/g, "%20")) 
                        , idx = pair.indexOf("=")
                        , key = pair.split("=", 1)
                        , value = pair.slice(idx+1)

                      o[key] = value
                  }(ite[i][1], o))

                return o
            }
        }())

      , invoke = ns.invoke = function(fn, args, ctx){
            if ( typeof fn != "function" )
              throw new TypeError("argument 0 must be a valid function")

            var args = args || []
              , ctx = ctx || null

            switch( args.length ) {
                case 0:
                  return fn.call(ctx)
                case 1:
                  return fn.call(ctx, args[0])
                case 2:
                  return fn.call(ctx, args[0], args[1])
                case 3:
                  return fn.call(ctx, args[0], args[1], args[2])
                default:
                  return fn.apply(ctx, args)
            }
        }

      , klass = ns.klass = function(){
            var SuperClass = arguments.length == 2 ? arguments[0] : null
              , superPrototype = SuperClass ? SuperClass.prototype : {}
              , statics = {}
              , k

              , prototype = (function(properties){
                    if ( typeof properties == "function" )
                      return properties(SuperClass, statics)
                    return properties || {}
                }( arguments[arguments.length-1] ))

              , Class = prototype.hasOwnProperty("constructor") ? (function(){
                    var constructor = prototype.constructor
                    delete prototype.constructor
                    return constructor
                }()) : function(){}

              Class.prototype = inherit(superPrototype)

              for ( k in prototype ) if ( prototype.hasOwnProperty(k) )
                Class.prototype[k] = prototype[k]

              Class.prototype.constructor = Class

              Class.create = function(){
                  var self = inherit(this.prototype)
                    , contructor = this
                  if(contructor) {
                    contructor.apply(self, arguments)
                  }
                  return self
              }

              Class.extend = function(prototype){
                  return klass(Class, prototype)
              }

              for ( k in statics ) 
                if ( statics.hasOwnProperty(k) && !Class.hasOwnProperty(k) )
                  Class[k] = statics[k]

            return Class
        }

      , singleton = ns.singleton = function(){
            var C, F, k, fn, instance, output

            C = invoke(klass, arguments, null)

            fn = function(){
                var args = arguments

                if ( instance )
                  return output

                F = function(){
                    instance = this
                    output = invoke(C, args, this)
                    return output
                }
                F.prototype = C.prototype

                return new F
            }

            for ( k in C ) if ( C.hasOwnProperty(k) )
              fn[k] = C[k]

            fn.create = function(){
                return invoke(fn, arguments)
            }

            return fn
        }

      , errors = ns.errors = {
            StopIterationError: klass(Error, {
                constructor: function(message){
                    this.name = "StopIteration"
                    this.message = message || ""
                }
              , _isError: true
            })
        }

      , EventEmitter = ns.EventEmitter = klass(function(){

            function Pipe(prefix, emitter){
                this.prefix = prefix + ":"
                this.emitter = emitter
            }

            return {
                _isEventEmitter: true
              , emit: function(type){
                    var ee = this
                      , events = this._events = this._events || {}
                      , pipes = this._pipes = this._pipes || []
                      , listeners = events[type], _arr
                      , args = arguments.length > 1 ? slice(arguments, 1) : []
                      , i, l
                      , invoker = new Invoker({ $event: type })

                    if ( typeof type != "string" )
                      return this.emit('error', new TypeError("invalid argument 0"))

                    if ( type == "error" && !listeners )
                        if ( arguments[1] instanceof Error || arguments[1]._isError )
                          throw arguments[1]
                        else
                          throw new Error( arguments[1] )

                    if ( listeners )
                      if ( typeof listeners.handleEvent == "function" )
                        invoker.apply(listeners.handleEvent, args, listeners)
                      else if ( typeof listeners == "function" )
                        invoker.apply(listeners, args, ee)
                      else {
                        _arr = [].concat(listeners) //copy array to prevent manipulation of the listeners during the loop
                        for ( i = 0, l = _arr.length; i<l; i++ )
                          if ( typeof _arr[i].handleEvent == "function" )
                            invoker.apply(_arr[i].handleEvent, args, _arr[i])
                          else
                            invoker.apply(_arr[i], args, ee)
                      }

                    for ( i = 0, l = pipes.length; i<l; i++ )
                      invoke(EventEmitter.prototype.emit, [pipes[i].prefix+type].concat(args), pipes[i].emitter)

                    return this
                }

              , on: function(type, fn){
                    var events = this._events = this._events || {}
                      , listeners = events[type]

                    if ( !fn || (typeof fn != "function" && typeof fn.handleEvent != "function") )
                      return this.emit('error', new TypeError("invalid argument 1"))

                    if ( !listeners || listeners === Object.prototype[type] )
                      events[type] = fn
                    else if ( typeof listeners == "function" || typeof listeners.handleEvent == "function" )
                      events[type] = [events[type], fn]
                    else
                      listeners.push(fn)

                    return this
                }
              , once: function(type, fn){
                    var self = this, _f

                    if ( !fn || (typeof fn != "function" && typeof fn.handleEvent != "function") )
                        return this.emit('error', new TypeError("missing/bad arguments[1]"))

                    _f = function(){
                        var _fn, _ctx

                        if ( typeof fn.handleEvent == "function" )
                          _fn = fn.handleEvent, _ctx = fn
                        else
                          _fn = fn, _ctx = null

                        invoke(_fn, arguments, _ctx)
                        self.off(type, _f) 
                    }

                    return this.on(type, _f)
                }
              , off: function(type, fn){
                    var events = this._events = this._events || {}
                          , listeners = events[type]
                          , idx

                        if ( !type || typeof type != "string" )
                          return this.emit('error', new TypeError("invalid argument 0") )

                        if ( fn === "*" || !fn )
                          delete events[type]

                        if ( typeof fn == "function")
                          if ( listeners )
                            if ( listeners === fn )
                              delete events[type]
                            else {
                              while ( idx = indexOf(listeners, fn), !!~idx )
                                events[type].splice(idx, 1)

                              if ( !events[type].length )
                                delete events[type]
                            }

                        return this
                }

              , listeners: function(type){
                    var events = this._events = this._events || {}
                    , listeners = events[type]

                    if ( isArray(listeners) )
                      return listeners

                    return !!listeners ? [listeners] : []
                }

              , pipe: function(prefix, emitter){
                    var pipes = this._pipes = this._pipes || []

                    if ( !prefix || typeof prefix != "string" )
                      this.emit('error', new TypeError('invalid argument 0'))

                    if ( !emitter || !(emitter._isEventEmitter) )
                      this.emit('error', new TypeError('invalid argument 1'))

                    pipes.push( new Pipe(prefix, emitter) )

                    return this
                }
              //, unpipe: function(prefix, emitter){} //TODO
            }
        })

      , Promise = ns.Promise = (function(){
            var Promise = klass(EventEmitter, {
                    _isPromise: true
                  , then: function(onresolve, onreject, onprogress){
                        var state = this._state || -1
                          , _yield = this._yield || null
                          , oPromise = new Promise
                          , rv

                        if ( state == 1 && typeof onresolve == "function" ) {
                          rv = invoke(onresolve, _yield, null)
                          if ( rv && rv._isPromise )
                            rv.then(function(){
                                invoke(oPromise.resolve, arguments, oPromise)
                            })
                          else
                            oPromise.resolve(rv)
                        }
                        else if ( state == 0 && typeof onreject == "function" ) {
                          rv = invoke(onreject, _yield, null)
                          if ( rv && rv._isPromise )
                            rv.then(null, function(){
                                invoke(oPromise.reject, arguments, oPromise)
                            })
                          else
                            oPromise.reject(rv)
                        }

                        if ( state == -1 ) {
                          if ( typeof onresolve == "function" )
                            this.once("resolve", function(){
                                rv = invoke(onresolve, arguments)
                                if ( rv && rv._isPromise )
                                  rv.then(function(){
                                    invoke(oPromise.resolve, arguments, oPromise)
                                  })
                                else
                                  oPromise.resolve(rv)
                            })
                          if ( typeof onreject == "function" )
                            this.once("reject", function(){
                                rv = invoke(onreject, arguments)
                                if ( rv && rv._isPromise )
                                  rv.then(null, function(){
                                      invoke(oPromise.reject, arguments, oPromise)
                                  })
                                else
                                  oPromise.reject(rv)
                            })
                          if ( typeof onprogress == "function" )
                            this.on("progress", function(){
                                invoke(onprogress, arguments)
                                invoke(oPromise.progress, arguments, oPromise)
                            })
                        }

                        return oPromise
                    }
                  , resolve: function(){
                        var args = arguments.length ? slice(arguments) : []

                        if ( this._state === 0 )
                          return this.emit('error', new TypeError)

                        if ( this._state !== 1 )
                          this._state = 1,
                          this._yield = args

                        return invoke(EventEmitter.prototype.emit, ["resolve"].concat(args), this )
                    }
                  , reject: function(){
                        var args = arguments.length ? slice(arguments) : []

                        if ( this._state === 1 )
                          return this.emit('error', new TypeError)

                        if ( this._state !== 0 )
                          this._state = 0,
                          this._yield = args

                        return invoke(EventEmitter.prototype.emit, ["reject"].concat(args), this )
                    }
                  , progress: function(){
                        var args = arguments.length ? slice(arguments) : []

                        if ( this._state !== -1 )
                          return this.emit('error', new TypeError)

                        return invoke(EventEmitter.prototype.emit, ["progress"].concat(args), this )
                    }
                  , status: function(){
                        return this._state || -1
                    }
                  , yield: function(){
                        return isArray(this._yield) ? [].concat(this._yield) : []
                    }
                })

              , Group = klass(Promise, {
                    constructor: function(){
                        var self = this
                          , promises, i, l

                        this._promises = []
                        this._yield = []
                        this._state = -1
                        this._closed = 0

                        if ( !arguments.length )
                          return this.reject(null)
                        else if ( arguments.length == 1)
                          promises = isArray(arguments[0]) ? arguments[0] : [arguments[0]]
                        else
                          promises = slice(arguments)

                        for ( i = 0, l = promises.length; i<l; i++ )
                          if ( !(promises[i]._isPromise) )
                            setTimeout(function(){ self.emit('error', new TypeError('invalid promise')) }, 0) //non-blocking error
                          else
                            (function(prom, i){
                                self._promises[i] = prom
                                prom.then(function(data){
                                    self._yield[i] = data
                                    self.progress(prom, data)
                                }, function(data){
                                    self._yield[i] = data
                                    self.reject(prom)
                                })
                            }(promises[i], i))

                        this._closed = 1
                    }
                  , progress: function(prom, data){
                        var self = this, args 
                          , promises = this._promises || []
                          , i, l, inprogress = 0

                        if ( !this._closed )
                          return args = slice(arguments), setTimeout(function(){
                              invoke(Group.prototype.progress, args, self)
                          }, 0)

                        for ( i = 0, l = promises.length; i<l; i++)
                          switch ( promises[i].status() ) {
                              case -1:
                                  inprogress++
                                  break
                              case 0:
                                return this.reject(this._yield)
                          }

                          if ( !inprogress )
                            invoke(Promise.prototype.resolve, this._yield, this)
                          else
                            invoke(EventEmitter.prototype.emit, ["progress"].concat([prom, data]), this)

                          return this
                    }
                })

            Promise.group = function(){
                var args = arguments

                function F(){ return invoke(Group, args, this) }
                F.prototype = Group.prototype

                return new F
            }

            Promise.sequence = function(){
                var fns = isArray(arguments[0]) ? arguments[0] : slice(arguments)
                  , l = fns.length

                return function(fns, l){
                    return function(){
                        var promise = new Promise
                          , output = promise
                          , args = slice(arguments)
                          , i = 0

                        for ( ; i < l; i++ )
                          if ( typeof fns[i] == "function" )
                            output = output.then(fns[i])
                          else
                            promise.emit("error", new TypeError("invalid argument"))

                        setTimeout(function(){
                            invoke(promise.resolve, args, promise)
                        }, 0)

                        return output
                    }
                }(fns, l)
            }

            return Promise
        }())

      , Invoker = ns.Invoker = klass(function(){
            var rargs = /^function(?:[^\(]*)\(([^\)]*)/

            return {
                constructor: function(rules){
                    if ( rules )
                      this.rules(rules)
                }
              , rules: function(rules){
                    var ite = new Iterator(rules).enumerate(), i = 0, l = ite.length

                    this._rules = {}

                    if ( rules )
                      for ( ; i < l; i++  )
                        this._rules[ite[i][0]] = ite[i][1]

                    return this
                }
              , apply: function(fn, args, ctx){
                    var rules = this._rules || {}
                      , res, i, l, a, _a=0, v
                      , args = slice(args || [])

                    if ( typeof fn != "function" )
                      this.emit("error", new TypeError("invalid argument 0, function expected"))

                    if ( !isArray(args) )
                      this.emit("error", new TypeError("invalid argument 1, arguments or array expected"))

                    res = ([].concat(fn.toString().match(rargs))[1] || "").split(",")

                    for ( i = 0, l = res.length; i < l; i++ )
                      if ( a = trim(res[i]), v = rules.hasOwnProperty(a) ? rules[a] : undefined, v )
                        res[i] = v
                      else
                        res[i] = args[_a++] 

                    for ( i = _a, l = args.length; i < l; i++)
                      res.push(args[i])

                    return invoke(fn, res, ctx)
                }
              , construct: function(fn, args){
                    var invoker = this
                    function F(){
                        invoker.apply(fn, args, this)
                    }
                    F.prototype = fn.prototype

                    return new F
                }
            }
        }())

      , Iterator = ns.Iterator = klass(EventEmitter, {
            constructor: function(range, opt_keys){
                if ( !range )
                  return this.emit('error', new TypeError('missing arguments 0 when constructing new Iterator object'))

                var self = this
                  , opt_keys = !!arguments[1]
                  , keys, i, l

                try { keys = enumerate(range) }
                catch(e){
                  keys = []
                  setTimeout( function(){ self.emit('error', e) }, 0)
                }

                this._pointer = -1
                this._current = null
                this._range = []

                for ( i = 0, l = keys.length; i<l; i++ )
                  this._range.length += 1,
                  this._range[i] = opt_keys ? [ keys[i] ] : [ keys[i], range[keys[i]] ]
            }
          , _isIterator: true

          , onstopiteration: null
          , next: function(){
                var next = this._pointer + 1
                  , current

                if ( next >= this._range.length )
                  return (function(self){
                      var err = new errors.StopIterationError

                      if ( typeof self.onstopiteration == "function" )
                        return self.onstopiteration(err)
                      return self.emit('error', err)
                  }(this))
                else
                  this._pointer = next

                current = this._current = this._range[next]
                return current
            }
          , length: function(){
                return this._range.length
            }
          , enumerate: function(){
                return [].concat(this._range || [])
            }
        })

      , Router = ns.Router = klass(EventEmitter, function(Super, statics){
            statics.defaultDispatcher = function(r, c){ return r === c }

            return {
                constructor: function(routes, dispatcher){
                      var dispatcher = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : Router.defaultDispatcher
                        , routes = arguments[0] && arguments[0].constructor == Object ? arguments[0] : null

                      this._routes = {}
                      this._dispatcher = dispatcher

                      if ( routes )
                        this.when(routes)
                  }
                , _isRouter: true
                , onstopiteration: null
                , dispatch: function(){
                      var self = this
                        , route = arguments[0]
                        , args = slice(arguments, 1)
                        , iterator = new Iterator(this._routes)
                        , _next, invoker = new Invoker({ $route: route, $next: function(){ return invoke(_next, [], self) } })

                        , handle = function(iteration){
                              var handler, i, l

                              handler = iteration[1]
                              if ( typeof handler == "function" )
                                return _next = next, invoker.apply(handler, args, self)
                              else {
                                i = -1, l = handler.length - 1
                                
                                _next = function(){
                                    if ( ++i < l )
                                      invoker.apply(handler[i], args, self)
                                    else
                                      _next = next,
                                      invoker.apply(handler[l], args, self)
                                }
                                
                                _next()
                              }
                          }

                        , next = function(){
                              var iteration, hit

                              try {
                                iteration = iterator.next()
                                hit = iteration[0] === "*" ? true : invoke(self._dispatcher, [iteration[0]].concat([route].concat(args)), null) //* always hit
                              } catch(e){
                                if ( e instanceof errors.StopIterationError && typeof self.onstopiteration == "function" )
                                  return _next = undefined, invoker.apply(self.onstopiteration, [e].concat(route, args), self)

                                return self.emit('error', e)
                              }

                              if ( !hit )
                                return next()
                              else
                                return handle(iteration)
                          }

                      return next()
                  }
                , when: function(rule, handler){
                      var k, i, l
                      if ( arguments.length == 1 ){
                          for ( k = enumerate(rule) , i = 0, l = k.length  ; i<l; i++ )
                            this.when(k[i], rule[k[i]])
                          return this
                      }

                      if ( typeof handler != "function" )
                        this.emit('error', new TypeError("argument 1 is expected to be a function"))

                      if ( !this._routes[rule] || this._routes[rule] === Object.prototype[rule] )
                        this._routes[rule] = handler
                      else if ( typeof this._routes[rule] == "function" )
                        this._routes[rule] = [this._routes[rule], handler]
                      else
                        this._routes[rule].push(handler)

                      return this
                  }
                , route: function(rule){
                      var route = (this._routes || {})[rule]

                      if ( isArray(route) )
                        route = [].concat[route]

                      return route
                  }
                , routes: function(){
                      var data = this._routes || {}
                        , copy = {}
                        , iterator = new Iterator(data), ite = iterator.enumerate(), i = 0, l = ite.length

                      for ( ; i < l; i++ )
                        copy[ite[i][0]] = this.route(ite[i][0])

                      return copy
                  }
              }
        })

      , Model = ns.Model = klass(EventEmitter, {
            constructor: function(){
                var model = this
                if ( arguments.length )
                  invoke(Model.prototype.set, arguments, this)

                this._update = {
                    keys: []
                  , timer: null
                }

                this.on('change', function(key){
                    var keys = model._update.keys

                    if ( !~indexOf(keys, key) )
                      keys.push(key)

                    clearTimeout(model._update.timer)
                    model._update.timer = setTimeout(function(){
                        model.emit('update', keys)
                        keys.splice(0, keys.length)
                    }, 0)
                })
            }
          , _isModel: true
          , set: function(key, value){
                var data = this._data = this._data || {}
                  , hook, ov

                if ( arguments.length == 1 )
                  if ( typeof key == "string" )
                    return this._fromJSON(key)
                  else
                    return this._fromHash(key)

                if ( typeof key != "string" )
                  return this.emit('error', new TypeError("invalid argument 0"))

                if ( value && value.constructor === Object )
                  return this._fromHash(value, key)

                hook = (this._hooks || {})[key] || null
                ov = data[key]

                if ( typeof value == "function" )
                  value = invoke(value, [this])

                if ( typeof hook == "function" )
                  value = invoke(hook, [value], this)

                if ( isArray(value) )
                  value = JSON.parse(JSON.stringify(value))

                if ( !data.hasOwnProperty(key) )
                  this.emit("add>"+key, value),
                  this.emit("add", key, value)

                data[key] = value

                this.emit("change>"+key, value, ov)
                this.emit("change", key, value, ov)

                return this
            }
          , _fromHash: function(hash, root){
                var self = this
                  , iterator = new Iterator(hash), ite = iterator.enumerate(), i = 0, l = ite.length
                  , root = !!root ? root+'.' : ""

                for ( ; i < l; i++ )
                  self.set(root + ite[i][0], ite[i][1])

                return this
            }
          , _fromJSON: function(json){
                var hash

                try {
                    hash = JSON.parse(json)
                } catch(e) {
                    return this.emit('error', e)
                }

                return this._fromHash(hash)
            }

          , hooks: null
          , hook: function(name, hook){
                var hooks

                if ( arguments.length == 1 && name && name.constructor == Object )
                  return (function(hash, self){
                      var iterator = new Iterator(hash), ite = iterator.enumerate(), i = 0, l = ite.length

                      for ( ; i < l; i++ )
                        self.hook(ite[i][0], ite[i][1])

                      return self
                  }(name, this))

                hooks = this._hooks = this._hooks || {}

                if ( typeof name != "string" )
                  return this.emit('error', new TypeError('invalid argument 0'))

                if ( arguments.length == 1 )
                  return hooks[name]

                if ( typeof hook != "function" )
                  return this.emit('error', new TypeError('invalid argument 1'))

                hooks[name] = hook

                return this
            }
          , get: function(key){
                var self = this
                  , data = this._data || {}
                  , keys, i, l, hits = []

                if ( !arguments.length )
                  return null

                if ( arguments.length == 1 )
                  if ( typeof key == "string")
                    return data[key]
                  else
                    keys = [key]

                if ( arguments.length > 1 )
                  keys = slice(arguments)

                for ( i = 0, l = keys.length; i<l; i++ ) {
                  if ( typeof keys[i] != "string" )
                    if ( typeof keys[i] == "number" )
                      keys[i] = keys[i].toString()
                    else
                      keys[i] = "",
                      setTimeout(function(){ self.emit('error', new TypeError("invalid key")) }, 0)

                  hits.push( this.get(keys[i]) )
                }

                return hits
            }
          , iterator: function(){
                return new Iterator(this._data || {})
            }
          , enumerate: function(){
                return this.iterator().enumerate()
            }
          , length: function(){
                var data = this._data || {}
                  , iterator = new Iterator(data, true)

                return iterator.length()
            }
          , serialize: function(){
                return serialize( this._data || {} )
            }
        })

      , Collection = ns.Collection = klass(EventEmitter, {
            constructor: function(){
                if ( arguments.length )
                  invoke(Collection.prototype.add, arguments, this)
            }
          , _isCollection: true
          , _Model: Model
          , model: function(M){
                if ( !M )
                  return this._Model

                if ( !(new M)._isModel )
                  this.emit('error', new TypeError('invalid model'))

                this._Model = M
                return this
            }
          , models: function(){
              var models = this._models || []

              return [].concat(models)
            }

          , add: function(model){
                var self = this
                  , models = this._models = this._models || []
                  , adds, i, l

                if ( !arguments.length )
                  return this
                else if ( arguments.length > 1 )
                  adds = slice(arguments)
                else if ( arguments.length == 1 )
                  if ( isArray(model) )
                    adds = model
                  else
                    adds = [model]

                for ( i = 0, l = adds.length; i<l; i++ )
                  if ( adds[i]._isModel )
                    (function(model){
                        if ( !~indexOf(models, model) )
                          model.pipe("models", self),
                          models.push(model)
                    }(adds[i]))
                  else if ( adds[i]._isCollection && isArray(adds[i]._models) )
                    this.add(adds[i]._models)
                  else if ( adds[i] && adds[i].constructor === Object )
                    this._fromHash(adds[i])
                  else if ( typeof adds[i] == "string" )
                    this._fromJSON(adds[i])
                  else
                    setTimeout(function(){ self.emit('error', new TypeError("invalid object in models/collections list") ) }, 0) //non-blocking

                  return this
            }
          , _fromHash: function(o){
                var self = this
                  , Model = this._Model
                  , model = new Model

                model.on('error', function(err){ self.add(err) }) //trigger error in .add()
                model.set(o)

                return this.add(model)
            }
          , _fromJSON: function(json){
                var hash

                try {
                  hash = JSON.parse(json)
                } catch(e) {
                    return this.add(e) //trigger error in .add()
                }

                return this.add(hash)
            }

          , remove: function(){
                var models = this._models || []
                  , hits = invoke(Collection.prototype.find, arguments, this)
                  , removed = []
                  , idx

                while ( hits.length )
                  if ( idx = indexOf(models, hits.shift()), !!~idx )
                    removed = models.splice(idx, 1)

                return removed
            }

          , find: function(){
                var models = this._models || []
                  , iterator = new Iterator(models), ite = iterator.enumerate()
                  , hits = [], hit, attributes = [], queries = []
                  , i, l


                  if ( !arguments.length )
                    return this.emit('error', new TypeError("empty search query"))

                  if ( arguments[0] === "*" )
                    return [].concat(this._models)

                  if ( arguments.length > 1 )
                    attributes = slice(arguments)
                  else
                    attributes = isArray(arguments[0]) ? arguments[0] : [arguments[0]]

                  for ( i = 0, l = attributes.length; i<l; i++ )
                    (function(attr){
                        var iterator = new Iterator(attr), ite = iterator.enumerate(), i = 0, l = ite.length

                        for ( ; i < l; i++ )
                          queries.push(ite[i])
                    }(attributes[i]))


                  for ( i = 0, l = ite.length; i < l; i++ ) {
                      hit = (function(model){
                                var i, l, key, value, hit

                                for ( i = 0, l = queries.length; i<l; i++ ) {
                                    key = queries[i][0]
                                    value = queries[i][1]
                                    hit = typeof value == "function" ? value(model.get(key)) : model.get(key) == value

                                    if ( !hit )
                                      return false
                                }
                                return true
                            }(ite[i][1]))

                      if ( hit )
                        hits.push(ite[i][1])
                  }

                  return hits
            }
          , subset: function(){
                var hits = invoke(Collection.prototype.find, arguments, this)
                return new Collection(hits)
            }
          , sort: function(){
                if ( isArray(this._models) )
                  invoke(Array.prototype.sort, arguments, this._models )
                return this
            }

          , set: function(){
                var models = this._models || []
                  , iterator = new Iterator(models), ite = iterator.enumerate(), i = 0, l = ite.length

                for ( ; i < l; i++ )
                  invoke(Model.prototype.set, arguments, ite[i][1])

                return this
            }
          , get: function(){
                var models = this._models || []
                  , hits = []
                  , iterator = new Iterator(models), ite = iterator.enumerate(), i = 0, l = ite.length

                for ( ; i < l; i++ )
                  hits.push( invoke(Model.prototype.get, arguments, ite[i][1]) )

                return hits
            }
          , iterator: function(){
                return new Iterator(this._models||[])
            }
          , enumerate: function(){
                return this.iterator().enumerate()
          }
          , length: function(){
                return (this._models || []).length
            }
        })

    root.namespace = (function(){
        var ctx = root
          , definer = function define(key, value){
                if ( ctx.hasOwnProperty(key) )
                  throw new TypeError("trying to overwrite an existing property")

                ctx[key] = value

                return value
            }
          , invoker = new Invoker({
                $: ns
              , $sleipnir: ns
              , $def: definer
              , $define: definer
            })
          , getContext = function(str){
                var path = str.split(".")
            }

        return function(name, scope){
            var pctx = ctx, rv

            if ( ctx.hasOwnProperty(name) )
              throw new TypeError("trying to overwrite an existing property")

            if ( typeof name != "string" || typeof scope != "function" )
              throw new Error("invalid argument(s)")

            ctx = {}
            rv = invoker.apply(scope)

            if ( rv )
              ctx = rv

            pctx[name] = ctx
            ctx = pctx

            return pctx[name]
        }
    }())

    root.sleipnir = ns
}(this))
