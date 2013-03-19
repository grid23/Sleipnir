(function(root){ "use strict"
    var 
        sleipnir = {}
      , version = sleipnir.version = "ES5-0.5.6"
      
      , noop = function(){}
      
      , toString = sleipnir.toType = (function(){
            var toString = Object.prototype.toString
            
            return function(o){
                return toString.call(o)
            }
        }())
      , isArray = sleipnir.isArray = Array.isArray || function(o){ return toString(o) === "[object Array]" }
      , slice = sleipnir.slice = (function(){ 
            var slice = Array.prototype.slice
            return function(o, i){
                return slice.call(o, i)
            }
        }())
        
      , invoke = sleipnir.invoke = function(fn, args, ctx){
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
      
      , klass = sleipnir.class = function(){
            var SuperClass = arguments.length == 2 ? arguments[0] : null
              , superPrototype = SuperClass ? SuperClass.prototype : {}
        
              , descriptors = (function(prototype){
                    if ( typeof prototype == "function" )
                      return prototype(SuperClass)
                    return prototype || {}
                }( arguments[arguments.length-1] ))
        
              , Class = descriptors.hasOwnProperty("constructor") ? (function(){
                    var constructor = descriptors.constructor.value || descriptors.constructor
                    delete descriptors.constructor
                    return constructor
                }()) : function(){}
              
              
              Object.defineProperties(Class, {
                  prototype: { value: Object.create(superPrototype, descriptors) }
                , constructor: { value: Class }
              })
              
              Class.create = function(fn){
                  var args, scope
                  
                  if ( typeof fn == "function" && fn.name === "scope" )
                    scope = fn(),
                    args = isArray(scope) ? scope : [scope]
                  else
                    args = arguments
                  
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
        
      , singleton = sleipnir.singleton = function(){
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
      
      , errors = {
            StopIterationError: klass(Error, {
                constructor: function(message){
                    this.name = "StopIteration"
                    this.message = message || ""
                }
            })
        }
      
      , EventEmitter = sleipnir.EventEmitter = klass(function(){
            
            function Pipe(prefix, emitter){
                this.prefix = prefix + ":"
                this.emitter = emitter
            }
            
            return {
                emit: {
                    value: function(type){
                        var events = this._events || Object.defineProperty(this, "_events", { value: {} })._events
                          , pipes = this._pipes || Object.defineProperty(this, "_pipes", { value: [] })._pipes
                          , listeners = events[type], _arr
                          , args = arguments.length > 1 ? slice(arguments, 1) : []
                          , i, l
                        
                        if ( typeof type != "string" )
                          return this.emit('error', new TypeError("invalid argument 0"))
                        
                        if ( type == "error" && !listeners )
                            if ( arguments[1] instanceof Error )
                              throw arguments[1]
                            else
                              throw new Error( arguments[1] )
                        
                        if ( listeners )
                          if ( typeof listeners.handleEvent == "function")
                            invoke(listeners.handleEvent, args, listeners)
                          else if ( typeof listeners == "function" )
                            invoke(listeners, args)
                          else {
                            _arr = [].concat(listeners) //copy array to prevent manipulation of the listeners during the loop
                            for ( i = 0, l = _arr.length; i<l; i++ )
                              if ( typeof _arr[i].handleEvent == "function" )
                                invoke(_arr[i].hendleEvent, args, _arr[i])
                              else
                                invoke(_arr[i], args)
                          }
                        for ( i = 0, l = pipes.length; i<l; i++ )
                          invoke(EventEmitter.prototype.emit, [pipes[i].prefix+type].concat(args), pipes[i].emitter)
                        
                        return this
                    }
                }
                
              , on: {
                    value: function(type, fn){
                        var events = this._events || Object.defineProperty(this, "_events", { value: {} })._events
                          , listeners = events[type]
                        
                        if ( !fn || (typeof fn != "function" && typeof fn.handleEvent != "function")  )
                          return this.emit('error', new TypeError("invalid argument 1"))
                        
                        if ( !listeners || listeners === Object.prototype[type] )
                          events[type] = fn
                        else if ( typeof listeners == "function" || typeof listeners.handleEvent == "function" )
                          events[type] = [events[type], fn]
                        else
                          listeners.push(fn)
                        
                        return this
                    }
                }
              , once: {
                    value: function(type, fn){
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
                }
                
              , off: {
                    value: function(type, fn){
                        var events = this._events || Object.defineProperty(this, "_events", { value: {} })._events
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
                }
                
              , listeners: {
                    value: function(type){
                        var events = this._events || Object.defineProperty(this, "_events", { value: {} })._events
                        , listeners = events[type]
                        
                        if ( !listeners )
                          return []
                        
                        if ( typeof listeners == "function" )
                          return [listeners]
                        
                        return listeners
                    }
                }
                
              , pipe: {
                    value: function(prefix, emitter){
                        var pipes = this._pipes || Object.defineProperty(this, "_pipes", { value: [] })._pipes
                        
                        if ( !prefix || typeof prefix != "string" )
                          this.emit('error', new TypeError('invalid argument 0'))
                        
                        if ( !emitter || !(emitter instanceof EventEmitter) )
                          this.emit('error', new TypeError('invalid argument 1'))
                        
                        pipes.push( new Pipe(prefix, emitter) )
                        
                        return this
                    }
                }
              /*, unpipe: {
                    value: function(prefix, emitter){
                        var pipes = this._pipes || Object.defineProperty(this, "_pipes", { value: [] })._pipes
                          , i = 0, l = pipes.length
                        
                        return this
                    }
                }*/ //TODO
                
              , toString: {
                    value: function(){
                        return "[object EventEmitter]"
                    }
                }
            }
        })
      
      , Promise = sleipnir.Promise = (function(){
            
            var 
                Promise = klass(EventEmitter, {
                    then: {
                        value: function(onresolve, onreject, onprogress){
                            var state = this._state || Object.defineProperty(this, "_state", { configurable: true, value: -1 })._state
                              , _yield = this._yield || null
                              , output = new Promise
                            
                            if ( state == 1 && typeof onresolve == "function" )
                              invoke(onresolve, _yield, null)
                            if ( state == 0 && typeof onreject == "function" )
                              invoke(onreject, _yield, null)
                            
                            if ( state == -1 ) {
                              if ( typeof onresolve == "function" )
                                this.once("resolve", function(){
                                    invoke(onresolve, arguments)
                                    output.resolve()
                                })
                              if ( typeof onreject == "function" )
                                this.once("reject", function(){
                                    invoke(onreject, arguments)
                                    output.reject()
                                })
                              if ( typeof onprogress == "function" )
                                this.on("progress", function(){
                                    invoke(onprogress, arguments)
                                    output.progress()
                                })
                            }
                            
                            return this
                        }
                    }
                    
                  , resolve: {
                        value: function(){
                            var args = arguments.length ? slice(arguments) : []
                            
                            if ( this._state !== 1 )
                              try {
                                Object.defineProperty(this, "_state", { configurable: false, value: 1 })
                                Object.defineProperty(this, '_yield', { configurable: false, value: args })
                              } catch (e) {
                                return this.emit('error', e)
                              }
                            
                            return invoke(EventEmitter.prototype.emit, ["resolve"].concat(args), this )
                        }
                    }
                  , reject: {
                        value: function(){
                            var args = arguments.length ? slice(arguments) : []
                            
                            if ( this._state !== 0 )
                              try {
                                Object.defineProperty(this, "_state", { configurable: false, value: 0 })
                                Object.defineProperty(this, '_yield', { configurable: false, value: args })
                              } catch (e) {
                                return this.emit('error', e)
                              }
                            
                            return invoke(EventEmitter.prototype.emit, ["reject"].concat(args), this )
                        }
                    }
                  , progress: {
                        value: function(){
                            var args = arguments.length ? slice(arguments) : []
                            
                            if ( this._state !== -1 )
                              try {
                                Object.defineProperty(this, "_state", { configurable: true, value: -1 })
                              } catch (e) {
                                return this.emit('error', e)
                              }
                            
                            if ( this._state == -1 )
                              return invoke(EventEmitter.prototype.emit, ["progress"].concat(args), this )
                        }
                    }
                    
                  , status: {
                        get: function(){
                            return this._state || -1
                        }
                    }
                  , yield: {
                        get: function(){
                            return isArray(this._yield) ? [].concat(this._yield) : null
                        }
                    }
                    
                  , valueOf: {
                        value: function(){
                            return this.status
                        }
                    }
                  , toString: {
                        value: function(){
                            return "[object Promise]"
                        }
                    }
                })
            
              , Group = klass(Promise, {
                    constructor: function(){
                        var self = this
                          , promises, i, l
                        
                        Object.defineProperties(this, {
                            _promises: { value: [] }
                          , _yield: { configurable: true, value: [] }
                          , _state: { configurable: true, value: -1 }
                          , _closed: { configurable: true, value: 0 }
                        })
                        
                        if ( !arguments.length )
                          return this.reject(null)
                        else if ( arguments.length == 1)
                          promises = isArray(arguments[0]) ? arguments[0] : [arguments[0]]
                        else
                          promises = slice(arguments)
                        
                        for ( i = 0, l = promises.length; i<l; i++ )
                          if ( !(promises[i] instanceof Promise) )
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
                        
                        Object.defineProperty(this, "_closed", { configurable: false, value: 1 })
                    }
                    
                  , progress: {
                        value: function(prom, data){
                            var self = this, args
                              , promises = this._promises || []
                              , i, l, inprogress = 0
                            
                            if ( !this._closed )
                              return args = slice(arguments), setTimeout(function(){
                                  invoke(Group.prototype.progress, args, self)
                              }, 0)
                            
                            for ( i = 0, l = promises.length; i<l; i++)
                              switch ( promises[i].status ) {
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
                    }
                })
              
              , Sequence = klass(Promise, {
                    constructor: {
                        value: function(){
                            var callbacks = isArray(arguments[0]) ? arguments[0] : slice(arguments)
                              , main, output, iterator, ite, i
                            
                            main = output = new Promise
                            
                            iterator = new Iterator(callbacks)
                            
                            for ( i in ite = iterator.enum)
                              if ( typeof ite[i][1] != "function" )
                                this.emit("error", new TypeError("invalid argument"))
                              else
                                output = output.then(ite[i][1])
                            
                            return main
                        }
                    }
                })
            
            Promise.group = function(){
                var args = arguments
                  , F = function(){
                    return invoke(Group, args, this)
                }
                F.prototype = Group.prototype
                return new F
            }
            
            Promise.sequence = function(){
                var args = arguments
                  , F = function(){
                    return invoke(Sequence, args, this)
                }
                F.prototype = Sequence.prototype
                return new F
            }
            
            return Promise
        }())
      
      , Invoker = sleipnir.Invoker = klass(function(){
            var rargs = /^function(?:[^\(]*)\(([^\)]*)/
            
            return {
                constructor: function(rules){
                    if ( rules )
                      this.rules(rules)
                }
              , rules: {
                    value: function(rules){
                        var ite, r
                          , _rules = this._rules || Object.defineProperty(this, "_rules", { value: {} })._rules
                        
                        if ( rules )
                          for ( r in ite = new Iterator(rules).enum )
                            _rules[ite[r][0]] = ite[r][1]
                        
                        return this
                    }
                }
              , apply: {
                    value: function(fn, args, ctx){
                        var rules = this._rules || {}
                          , res, i, l, a, _a=0, v
                          , args = slice(args || [])
                        
                        if ( typeof fn != "function" )
                          this.emit("error", new TypeError("invalid argument 0, function expected"))
                        
                        if ( !isArray(args) )
                          this.emit("error", new TypeError("invalid argument 1, arguments or array expected"))
                        
                        res = ([].concat(fn.toString().match(rargs))[1] || "").split(",")
                        
                        for ( i = 0, l = res.length; i < l; i++ )
                          if ( a = res[i].trim(), v = rules[a] && rules.hasOwnProperty(a) ? rules[a] : undefined, v )
                            res[i] = v
                          else
                            res[i] = args[_a++] 
                        
                        for ( i = _a, l = args.length; i < l; i++)
                          res.push(args[i])
                        
                        return invoke(fn, res, ctx)
                    }
                }
              , construct: {
                    value: function(fn, args){
                        var invoker = this
                        function F(){
                            invoker.apply(fn, args, this)
                        }
                        F.prototype = fn.prototype
                        
                        return new F
                    }
                }
            }
        }())
      
      , Iterator = sleipnir.Iterator = klass(EventEmitter, {
            constructor: function(range, opt_keys){
                if ( !range )
                  return this.emit('error', new TypeError('missing arguments 0 when constructing new Iterator object'))
                
                var self = this
                  , opt_keys = !!arguments[1]
                  , keys, i, l
                
                try { keys = Object.keys(range) }
                catch(e){
                  keys = []
                  setTimeout( function(){ self.emit('error', e) }, 0)
                }
              
                Object.defineProperties(this, {
                    _pointer: { writable: true, value: -1 }
                  , _current: { writable: true, value: null }
                  , _range: { value: [] }
                })
                
                for ( i = 0, l = keys.length; i<l; i++ )
                  this._range.length += 1,
                  this._range[i] = opt_keys ? [ keys[i] ] : [ keys[i], range[keys[i]] ]
            }
            
          , onstopiteration: { writable: true, value: null }
          , next: {
                value: function(){
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
            }
            
          , enum: {
                get: function(){
                    return [].concat(this._range || [])
                }
            }
          , length: {
                get: function(){
                    return (this._range || []).length
                }
            }
            
          , valueOf: {
                value: function(){
                    return this.length
                }
            }
          , toString: {
                value: function(){
                    return "[object Iterator]"
                }
            }
        })
      
      , Router = sleipnir.Router = klass(EventEmitter, function(){
            function dDispatcher(r, c){ return r === c }
            function eNext(){
                var self = this
                setTimeout(function(){
                  self.emit('error', "next() invoked on a non-last route handler (manage your routes handlers carefully)")
                }, 0)
            }
            
            return {
                constructor: function(routes, dispatcher){
                    var dispatcher = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : dDispatcher
                      , routes = arguments[0] && arguments[0].constructor == Object ? arguments[0] : null
                    
                    Object.defineProperties(this, {
                        _routes: { value: {} }
                      , _dispatcher: { writable: true, value: dispatcher }
                    })
                    
                    if ( routes )
                      this.when(routes)
                }
                
              , onstopiteration: { writable: true, value: null }
              , dispatch: {
                    value: function(){
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
                                  for ( i = 0, l = handler.length -1; i<l; i++ )
                                    _next = function(){ invoke(eNext, [], self) },
                                    invoker.apply(handler[i], args, self)
                                  return _next = next, invoker.apply(handler[l], args, self)
                                }
                            }
                            
                          , next = function(){
                                var iteration, hit
                                
                                try {
                                  iteration = iterator.next()
                                  hit = iteration[0] === "*" ? true : invoke(self._dispatcher, [iteration[0]].concat(route, args), null) //* always hit
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
                }
                
              , when: {
                    value: function(rule, handler){
                        var k, i, l
                        if ( arguments.length == 1 ){
                            for ( k = Object.keys(rule) , i = 0, l = k.length  ; i<l; i++ )
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
                }
              , length: {
                    get: function(){
                        return Object.keys( (this._routes || {}) ).length
                    }
                }
                
              , valueOf: {
                    value: function(){
                        return this.length
                    }
                }
              , toString: {
                    value: function(){
                        return "[object Router]"
                    }
                }
            }
        })
      
      , Model = sleipnir.Model = klass(EventEmitter, {
            constructor: function(){
                if ( arguments.length )
                  invoke(Model.prototype.set, arguments, this)
            }
            
          , set: {
                value: function(key, value){
                    var data = this._data || Object.defineProperty(this, "_data", { value: {} })._data
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
            }
          , _fromHash: {
                value: function(hash, root){
                    var self = this
                      , iterator = new Iterator(hash), ite, i
                      , root = !!root ? root+'.' : ""
                    
                    for ( i in ite = iterator.enum )
                      self.set(root + ite[i][0], ite[i][1])
                    
                    return this
                }
            }
          , _fromJSON: {
                value: function(json){
                    var hash
                    
                    try {
                        hash = JSON.parse(json)
                    } catch(e) {
                        return this.emit('error', e)
                    }
                    
                    return this._fromHash(hash)
                }
            }
          
          , _hooks: { configurable: true,
                value: null
            }
          , hook: {
                value: function(name, hook){
                    var hooks
                    
                    if ( arguments.length == 1 && name && name.constructor == Object )
                      return (function(hash, self){
                          var iterator = new Iterator(hash), ite, i
                          
                          for ( i in ite = iterator.enum )
                            self.hook(ite[i][0], ite[i][1])
                          
                          return self
                      }(name, this))
                    
                    hooks = this._hooks || Object.defineProperty(this, "_hooks", { value: {} })._hooks
                    
                    if ( typeof name != "string" )
                      return this.emit('error', new TypeError('invalid argument 0'))
                    
                    if ( arguments.length == 1 )
                      return hooks[name]
                    
                    if ( typeof hook != "function" )
                      return this.emit('error', new TypeError('invalid argument 1'))
                    
                    hooks[name] = hook
                    
                    return this
                }
            }
            
          , get: {
                value: function(key){
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
            }
            
          , keys: {
                get: function(){
                    var data = this._data.hash || {}
                      , keys = Object.keys(data)
                    
                    return keys
                }
            }
          , length: {
                get: function(){
                    return this.keys.length
                }
            }
            
          , valueOf: {
                value: function(){
                    return this.length
                }
            }
          , toString: {
                value: function(){
                    return "[object Model]"
                }
            }
        })
      
      , Collection = sleipnir.Collection = klass(EventEmitter, {
            constructor: function(){
                if ( arguments.length )
                  invoke(Collection.prototype.add, arguments, this)
            }
            
          , _Model: { writable: true, value: Model }
          , model: {
                set: function(M){
                    if ( !( new M instanceof Model) )
                      this.emit('error', new TypeError('invalid model'))
                    
                    this._Model = M
                }
              , get: function(){
                    return this._Model
                }
            }
            
          , add: {
                value: function(model){
                    var self = this
                      , models = this._models || Object.defineProperty(this, "_models", { value: [] })._models
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
                      if ( adds[i] instanceof Model )
                        (function(model){
                            if ( !~models.indexOf(model) )
                              model.pipe("models", self),
                              models.push(model)
                        }(adds[i]))
                      else if ( adds[i] instanceof Collection )
                        this.add( (adds[i]._models || []) )
                      else if ( adds[i] && adds[i].constructor === Object )
                        this._fromHash(adds[i])
                      else if ( typeof adds[i] == "string" )
                        this._fromJSON(adds[i])
                      else
                        setTimeout(function(){ self.emit('error', new TypeError("invalid object in models/collections list") ) }, 0) //non-blocking
                      
                      return this
                }
            }
          , _fromHash: {
                value: function(o){
                    var self = this
                      , Model = this._Model
                      , model = new Model
                    
                    model.on('error', function(err){ self.add(err) }) //trigger error in .add()
                    model.set(o)
                    
                    return this.add(model)
                }
            }
          , _fromJSON: {
                value: function(json){
                    var hash
                    
                    try {
                      hash = JSON.parse(json)
                    } catch(e) {
                        return this.add(e) //trigger error in .add()
                    }
                    
                    return this.add(hash)
                }
            }
          , remove: {
                value: function(){
                    var models = this._models || Object.defineProperty(this, "_models", { value: [] })._models
                      , hits = invoke(Collection.prototype.find, arguments, this)
                      , removed = []
                      , idx
                    
                    while ( hits.length )
                      if ( idx = models.indexOf(hits.shift()), !!~idx )
                        removed = models.splice(idx, 1)
                    
                    return removed
                }
            }
            
          , find: {
                value: function(){
                    var models = this._models || []
                      , iterator = new Iterator(models), ite, i
                      , hits = [], hit, attributes = [], queries = [], l
                      
                      
                      if ( !arguments.length )
                        return this.emit('error', new TypeError("empty search query"))
                      
                      if ( arguments[0] === "*" )
                        return this.models
                      
                      if ( arguments.length > 1 )
                        attributes = slice(arguments)
                      else
                        attributes = isArray(arguments[0]) ? arguments[0] : [arguments[0]]
                      
                      for ( i = 0, l = attributes.length; i<l; i++ )
                        (function(attr){
                            var iterator = new Iterator(attr), ite, i
                            
                            for ( i in ite = iterator.enum )
                              queries.push(ite[i])
                        }(attributes[i]))
                      
                      for ( i in ite = iterator.enum ) {
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
            }
          , subset: {
                value: function(){
                    var hits = invoke(Collection.prototype.find, arguments, this)
                    return new Collection(hits)
                }
            }
          , sort: {
                value: function(){
                    if ( isArray(this._models) )
                      invoke(Array.prototype.sort, arguments, this._models )
                    return this
                }
            }
            
          , set: {
                value: function(){
                    var models = this._models || []
                      , iterator = new Iterator(models), ite, i
                    
                    for ( i in ite = iterator.enum )
                      invoke(Model.prototype.set, arguments, ite[i][1])
                    
                    return this
                }
            }
            
          , get: {
                value: function(){
                    var models = this._models || []
                      , hits = []
                      , iterator = new Iterator(models), ite, i
                    
                    for ( i in ite = iterator.enum )
                      hits.push( invoke(Model.prototype.get, arguments, ite[i][1]) )
                    
                    return hits
                }
            }
            
          , models: {
                get: function(){
                    var models = this._models || []
                    
                    return [].concat(models)
                }
            }
          , length: {
                get: function(){
                    var models = this._models || []
                    return models.length
                }
            }
            
          , valueOf: {
                value: function(){
                    return this.length
                }
            }
          , toString: {
                value: function(){
                    return "[object Collection]"
                }
            }
        })
    
    Object.defineProperty(root, "namespace", { enumerable: true, value: (function(){
        var ctx = root
          , definer = function define(key, value){ return Object.defineProperty(ctx, key, { enumerable: true, value: value })[key] }
          , invoker = new Invoker({
                $: sleipnir
              , $sleipnir: sleipnir
              , $def: definer
              , $define: definer
            })
        return function(name, scope){
            var pctx = ctx
            
            if ( typeof name != "string" || typeof scope != "function" )
              throw new Error("invalid argument(s)")
            
            ctx = Object.create(null, { toString: { value: function(){ return "namespace" } } })
            invoker.apply(scope)
            Object.defineProperty(pctx, name, { enumerable: true, value: ctx })
            ctx = pctx
        }
    }()) })
    
    Object.defineProperty(root, "sleipnir", { value: sleipnir })
}(window))

