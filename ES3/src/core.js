(function(root){ "use strict"
    var ns = {}
      , version = ns.version = "ES3-0.5.5"

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

      , serialize = ns.serialize = function(){
            var args = arguments.length > 1 && arguments || arguments[0]
              , iterator = new IteratorSafe(args), ite
              , str = []

            while ( ite = iterator.next() )
              str.push( encodeURIComponent(ite[0]) +"="+ encodeURIComponent(ite[1]) )

            return str.join("&").replace(/%20/g, "+")
        }
      , objectify = ns.objectify = function(str){
            var o = {}
              , pairs = str.split(/&amp;|&/g)
              , iterator = new IteratorSafe(pairs), ite

            while ( ite = iterator.next() )
              (function(pair, o){
                  var pair = decodeURIComponent(pair.replace(/\+/g, "%20")) 
                    , idx = pair.indexOf("=")
                    , key = pair.split("=", 1)
                    , value = pair.slice(idx+1)

                  o[key] = value
              }(ite[1], o))

            return o
        }

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

              , prototype = (function(properties){
                    if ( typeof properties == "function" )
                      return properties(SuperClass)
                    return properties || {}
                }( arguments[arguments.length-1] ))

              , Class = prototype.hasOwnProperty("constructor") ? (function(){
                    var constructor = prototype.constructor
                    delete prototype.constructor
                    return constructor
                }()) : function(){}

              Class.prototype = {}
              for ( var k in superPrototype )
                Class.prototype[k] = superPrototype[k]


              for ( var k in prototype )
                Class.prototype[k] = prototype[k]

              Class.prototype.constructor = Class

              Class.create = function(){
                  var args = arguments
                  function F(){
                      return invoke(Class, args, this)
                  }
                  F.prototype = Class.prototype

                  return new F
              }

              Class.extend = function(prototype){
                  return klass(Class, prototype)
              }

            return Class
        }

      , singleton = ns.singleton = function(){
            var C, F, fn, instance, output
            
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
                    var events = this._events = this._events || {}
                      , pipes = this._pipes = this._pipes || []
                      , listeners = events[type], _arr
                      , args = arguments.length > 1 ? slice(arguments, 1) : []
                      , i, l

                    if ( typeof type != "string" )
                      return this.emit('error', new TypeError("invalid argument 0"))

                    if ( type == "error" && !listeners )
                        if ( arguments[1] instanceof Error || arguments[1]._isError )
                          throw arguments[1]
                        else
                          throw new Error( arguments[1] )

                    if ( listeners )
                      if ( typeof listeners == "function" )
                        invoke(listeners, args)
                      else {
                        _arr = [].concat(listeners) //copy array to prevent manipulation of the listeners during the loop
                        for ( i = 0, l = _arr.length; i<l; i++ )
                          invoke(_arr[i], args)
                      }
                    for ( i = 0, l = pipes.length; i<l; i++ )
                      invoke(EventEmitter.prototype.emit, [pipes[i].prefix+type].concat(args), pipes[i].emitter)

                    return this
                }

              , on: function(type, fn){
                    var events = this._events = this._events || {}
                      , listeners = events[type]

                    if ( !fn || typeof fn != "function" )
                      return this.emit('error', new TypeError("invalid argument 1"))

                    if ( !listeners )
                      events[type] = fn
                    else if ( typeof listeners == "function" )
                      events[type] = [events[type], fn]
                    else
                      listeners.push(fn)

                    return this
                }
              , once: function(type, fn){
                    var self = this, _f

                    if ( !fn || typeof fn != "function" )
                      return this.emit('error', new TypeError("missing/bad arguments[1]"))

                    _f = function(){
                        invoke(fn, arguments, null)
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

                        if ( typeof fn == "function" && !!listeners )
                          if ( listeners == fn )
                            delete events[type]
                          else {
                            while ( idx = indexOf(listeners, fn), !!~idx )
                              events[type].splice(idx, 1)

                            if ( !events[type].length )
                              delete events[type]
                          }

                        if ( fn == "*" )
                          delete events[type]

                        return this
                }

              , listeners: function(type){
                    var events = this._events = this._events || {}
                    , listeners = events[type]

                    if ( !listeners )
                      return []

                    if ( typeof listeners == "function" )
                      return [listeners]

                    return listeners
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
              , unpipe: function(prefix, emitter){} //TODO
            }
        })

      , Promise = ns.Promise = (function(){
            var Promise = klass(EventEmitter, {
                    _isPromise: true
                  , then: function(onresolve, onreject, onprogress){
                        var state = this._state || -1
                          , _yield = this._yield || null
                          , oPromise = new Promise

                        if ( state == 1 && typeof onresolve == "function" )
                          invoke(onresolve, _yield, null)
                        if ( state == 0 && typeof onreject == "function" )
                          invoke(onreject, _yield, null)

                        if ( state == -1 ) {
                          if ( typeof onresolve == "function" )
                            this.once("resolve", function(){
                                invoke(onresolve, arguments)
                                oPromise.resolve()
                            })
                          if ( typeof onreject == "function" )
                            this.once("reject", function(){
                                invoke(onreject, arguments)
                                oPromise.reject()
                            })
                          if ( typeof onprogress == "function" )
                            this.on("progress", function(){
                                invoke(onprogress, arguments)
                                oPromise.progress()
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

              , Sequence = klass(Promise, {
                    constructor: function(){
                        var promises = isArray(arguments[0]) ? arguments[0] : slice(arguments)
                          , main, output, iterator, ite

                        main = output = new Promise

                        iterator = new IteratorSafe(promises)

                        while ( ite = iterator.next() )
                          if ( typeof ite[1] != "function" )
                            this.emit("error", new TypeError("invalid argument"))
                          else
                            output = output.then(ite[1])

                        return main
                    }
                })

            Promise.group = function(){
                var args = arguments

                function F(){ return invoke(Group, args, this) }
                F.prototype = Group.prototype

                return new F
            }

            Promise.sequence = function(){
                var args = arguments

                function F(){ return invoke(Sequence, args, this) }
                F.prototype = Sequence.prototype

                return new F
            }

            return Promise
        }())

      , Iterator = ns.Iterator = klass(EventEmitter, {
            constructor: function(range, opt_keys, opt_onstopiteration){
                if ( !range )
                  return this.emit('error', new TypeError('missing arguments 0 when constructing new Iterator object'))

                var self = this
                  , opt_onstopiteration = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : null
                  , opt_keys = typeof arguments[1] != "function" ? !!arguments[1] : false
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

                if ( opt_onstopiteration )
                  this.onstopiteration = opt_onstopiteration
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
        })

      , IteratorSafe = ns.IteratorSafe = klass(Iterator, function(Super){
            return {
                constructor: function(){
                    invoke(Super, arguments, this)
                }
              , onstopiteration: function(){
                    invoke(this.emit, ["stopiteration"].concat(arguments), this)
                }
            }
        })

      , Router = ns.Router = klass(EventEmitter, {
            constructor: function(routes, dispatcher){
                  var dispatcher = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : function(){ return false }
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
                    , args = slice(arguments)
                    , iterator = new Iterator(this._routes)

                    , handle = function(iteration){
                          var handler, i, l

                          handler = iteration[1]
                          if ( typeof handler == "function" )
                            return invoke(handler, [next].concat(args), self)
                          else {
                            for ( i = 0, l = handler.length -1; i<l; i++ )
                              invoke(handler[i], [function(){
                                  setTimeout(function(){ // throw error, without breaking the function stack (non-critical error)
                                    self.emit('error', "next() invoked on a non-last route handler (manage your routes handlers carefully)")
                                  }, 0)
                              }].concat(args), self)
                            return invoke(handler[l], [next].concat(args), self)
                          }
                      }

                    , next = function(){
                          var iteration, hit

                          try {
                            iteration = iterator.next()
                            hit = iteration[0] === "*" ? true : invoke(self._dispatcher, [iteration[0]].concat(args), null) //* always hit
                          } catch(e){
                            if ( e instanceof errors.StopIterationError && typeof self.onstopiteration == "function" )
                              return invoke(self.onstopiteration, [e].concat(args), self)

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

                  if ( this._routes[rule] == undefined )
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
            , enumerate: function(){
                  var data = this._routes || {}
                    , copy = {}
                    , iterator = new IteratorSafe(data), ite

                  while (ite = iterator.next())
                    copy[ite[0]] = this.route(ite[0])

                  return copy
              }
        })

      , Model = ns.Model = klass(EventEmitter, {
            constructor: function(){
                if ( arguments.length )
                  invoke(Model.prototype.set, arguments, this)
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
                  value = [].concat(value)

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
                  , iterator = new IteratorSafe(hash), iteration //ignore stopIteration errors completly
                  , root = !!root ? root+'.' : ""

                while ( iteration = iterator.next() )
                  (function(){
                      self.set(root + iteration[0], iteration[1])
                  }())

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
                      var iterator = new IteratorSafe(hash), ite

                      while (ite = iterator.next() )
                        return self.hook(ite[0], ite[1])
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
          , enumerate: function(){
                var data = this._data || {}
                  , copy = {}
                  , iterator = new IteratorSafe(data), ite

                while (ite = iterator.next())
                  copy[ite[0]] = ite[1]

                return copy
            }
          , length: function(){
                var data = this._data || {}
                  , iterator = new IteratorSafe(data, true)
                  , l = 0

                while ( iterator.next() )
                  l++

                return l
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
          , Model: function(M){
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
                var self = this
                  , models = this._models || []
                  , iterator = new IteratorSafe(models), ite
                  , hits = [], hit, attributes = [], queries = [],  i, l


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
                        var iterator = new IteratorSafe(attr), ite

                        iterator.on('error', function(err){ self.emit('error', err)})

                        while ( ite = iterator.next() )
                          queries.push(ite)
                    }(attributes[i]))

                  while ( ite = iterator.next() ) {
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
                            }(ite[1]))

                      if ( hit )
                        hits.push(ite[1])
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
                  , iterator = new IteratorSafe(models), iteration

                while ( iteration = iterator.next() )
                  invoke(Model.prototype.set, arguments, iteration[1])

                return this
            }
          , get: function(){
                var models = this._models || []
                  , hits = []
                  , iterator = new IteratorSafe(models), iteration

                while ( iteration = iterator.next() )
                  hits.push( invoke(Model.prototype.get, arguments, iteration[1]) )

                return hits
            }
          , enumerate: function(){
              var data = this._models || []
                , copy = {}
                , iterator = new IteratorSafe(data), ite

              while (ite = iterator.next())
                copy[ite[0]] = ite[1]

              return copy
          }
          , length: function(){
                return (this._models || []).length
            }
        })
    
    root.sleipnir = function(a){
        if ( typeof a === "function" )
          return invoke(a, [ns])
        if ( ns.hasOwnProperty(a) )
          return ns[a]
    }
    
    ;(function(sleipnir){
        for ( var k in ns ) if ( ns.hasOwnProperty(k) )
          sleipnir[k] = ns[k]
    }(root.sleipnir))
}(this))
