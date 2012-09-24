;

/*
* @name 23.sleipnir
* @autor Benjamin Moulin, hello@grid23.net
*
*/

(function(root){ "use strict"
    var document = root.document
      , location = root.location
      , navigator = root.navigator
      , performance = root.performance

      , domReady = 0

      , rscript = /<(script).*>([\s\S]*)<\/\1>/i
      , rscripturl = /\.js($|\?\S*$)/
      , rstyle = /<(style).*>([\s\S]*)<\/\1>/i
      , rstyleurl = /\.css($|\?\S*$)/
      , rbase64 = /^(image\/(.*);base64.*)$/i
      , rimgurl = /\.gif|jpg|png|jpeg($|\?\S*$)/

      , URL = root.URL || root.webkitURL || false
      , hasBlob = (root.Blob && URL && URL.createObjectURL ) && true || false
      
      , noop = function(){}
      
      , body, head, docElt

      , ns = {}
      , core = ns.core = {}
      , data = ns.data = {}
      , dom = ns.dom = {}
      , env = ns.env = {}

      , version = ns.version = "0.2.5a02"

      , _ = ns.utils = (function(){
            var slice = Array.prototype.slice
              , toString = Object.prototype.toString
              , isNative = function(fn){
                    return typeof fn == "function" && fn.toString().match(/\s\[native code\]\s/)
                }
              , helpers = {}
              
              , is = helpers.is = {
                    "arguments" : function(o){
                        return toString.call(o) == "[object Arguments]"
                    }
                  , "array" : (function(){
                        if ( isNative(Array.isArray) )
                          return function(o){ return Array.isArray(o) }
                        return function(o){ return o instanceof Array || toString.call(o) == "[object Array]" }
                    }())
                  , "boolean" : function(o){
                        return toString.call(o) == "[object Boolean]"
                    }
                  , "fn" : function(o){ // "function" would cause "identifier expected" error in crappy crap old-ie
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
                        return typeof o == "object" && o && o.constructor === Object
                    }
                  , "primitive" : function(){} //todo
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
                  
              , to = helpers.to = { 
                    array : function(o){ //todo, complete
                        if ( toString.call(o) == "[object Arguments]" )
                          return slice.call(o)
                        return []
                    }
                }
                    
              , keys = helpers.keys = (function(){
                    if ( isNative(Object.keys) )
                      return function(o){
                          return Object.keys(o)
                      }
                    return function(o){
                        var _arr = []
                        for ( var k in o ) if ( o.hasOwnProperty(k) )
                          _arr.push(k)
                        return _arr
                    }
                }())
                  
              , indexOf = helpers.indexOf = (function(){
                    var arrIndexof = (function(){
                        if ( !isNative(Array.prototype.indexOf) )
                          return function(arr, val){ return arr.indexOf(val) }
                        return function(arr, val){
                            for ( var i=0, l=arr.length; i<l; i++)
                              if ( arr[i] === val )
                                return i
                            return -1
                        }
                    }())
                    return function(o, val){
                        if ( is.array(o) )
                          return arrIndexOf(o, val)
                        else if ( is.string(o) )
                          return o.indexOf(val)
                        throw new Error('sleipnir.utils.indexOf : bad argument type')
                    }
                }())
                    
              , trim = helpers.trim = (function(){
                    if ( isNative(String.prototype.trim) )
                      return function(o){
                            return o.trim()
                      }
                    return function(){
                          return o.replace(/^\s+/g,'').replace(/\s+$/g,'')
                    }
                }())
              
              , mix = helpers.mix = function mix(){
                    var o
                    if ( is.object(arguments[0]) )
                      o = {}
                    else if ( is.array(arguments[0]) )
                      o = []
                    else
                      throw new Error('bad argument type')
    
                    for (var i=0, l=arguments.length; i<l; i++)  if ( (arguments[i]).constructor === (o).constructor  )
                      (function(t){
                          for ( var p in t ) if ( t.hasOwnProperty(p) ) {
                            if ( is.object(t[p]) || is.array(t[p]) ) {
                              if ( !is.object(o[p]) && !is.array(o[p]) ) o[p] = mix(t[p])
                              else o[p] = mix(o[p], t[p])
                            }
                            else
                              o[p] = t[p]
                            }
                      }(arguments[i]))
                    return o
                }
                
            return helpers
        }())
        
        /*
        * A function that makes it easy to create classes and manage inheritance
        * @name sleipnir.core.klass
        */
      , klass = core.klass = (function(_){
            return function(Ancestor, properties, singleton){
                var args = _.to.array(arguments)
                  , singleton = false, properties, Ancestor, Heir

                if ( _.is.boolean(args[args.length-1]) )
                  singleton = !!args.pop()

                properties = args.pop()
                Ancestor = args[0]

                Heir = function(){
                    var length = arguments.length
                    if ( !Heir.prototype._construct ) return this
                    if ( length == 0 )
                      Heir.prototype._construct.call(this)
                    else if ( length == 1 )
                      Heir.prototype._construct.call(this, arguments[0])
                    else if ( length == 2 )
                      Heir.prototype._construct.call(this, arguments[0], arguments[1])
                    else if ( length == 3 )
                      Heir.prototype._construct.call(this, arguments[0], arguments[1], arguments[2])
                    else
                      Heir.prototype._construct.apply(this, arguments)
                }

                if ( Ancestor ) for ( var i=0, k=_.keys(Ancestor.prototype), l=k.length; i<l; i++ )
                  Heir.prototype[k[i]] = Ancestor.prototype[k[i]]

                for ( var i=0, p=properties.call(Heir, _, Ancestor), k=_.keys(p), l=k.length; i<l; i++ )
                  Heir.prototype[k[i]] = p[k[i]]

                Heir.prototype.constructor = Heir.prototype._construct
                
                Heir.extend = function(fn){
                    var singleton = _.is.object(arguments[arguments.length-1]) && arguments[arguments.length-1] || false
                    return klass(Heir, fn, singleton)
                }
                
                Heir.create = function(){
                    return new Heir
                }
                
                if ( singleton )
                  return new Heir
                return Heir
            }
        }(_))
        
        /*
        * An EventEmitter class, that broadcasts events, that other objects can wait for & listen
        * @name sleipnir.core.EventEmitter
        */
      , EventEmitter = core.EventEmitter = klass(function(_){
            var EventHandler = this.EventHandler = klass(function(){
                    return {
                        _construct : function(handler, runs, parent){
                            this.handler = handler
                            this.runs = runs || Infinity
                            this.USE_RUNS = !!runs
                            this.parent = parent
                        }
                      , fire : function(args){
                            var length = args.length
                              , handler = this.handler
                              , context = this.parent
                              , runsError = false

                            if ( this.USE_RUNS )
                              if ( this.runs > 0 )
                                this.runs = this.runs-1
                              else
                                return
                            
                            if ( length == 1 )
                              return handler.call(context)
                            else if ( length == 2 )
                              return handler.call(context, args[1])
                            else if ( length == 3 )
                              return handler.call(context, args[1], args[2])
                            else if ( length == 4 )
                              return handler.call(context, args[1], args[2], args[3])
                            for ( var i=1, arr=[], l=length; i<l; i++ )
                                arr.push(args[i])
                            return handler.apply(context, arr)
                        }
                      , is : function(fn){
                            return this.handler === fn
                        }
                    }
                })

            return {
                _construct : function(){
                    this._eeEvents = {}
                }
              , on: function(eventName, eventCallback, eventRuns){
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
        })
        
       /*
       * An EventChanneler is a special EventEmitter that can pipe other EventEmitter instances events through a channel
       * @name sleipnir.core.EventChanneler
       */
      , EventChanneler = core.EventChanneler = klass(EventEmitter, function(_, supr){
            return {
                _construct: function(){
                    supr.call(this)
                }
              , pipe: function(channelName, ee){
                    if ( !ee._eeEvents && !ee.emit ) // let EventChanneler.pipe pass
                        throw new Error('target must be a valid EventEmitter')

                    var self = this

                    ee._eeChannels = ee._eeChannels || {}
                    ee._eeChannels[channelName] = ee._eeChannels[channelName] || []
                    ee._eeChannels[channelName].push(this)

                    ee.emit = function(eventName){
                        var args = _.to.array(arguments)

                        args.shift()

                        /* useful ?
                        args.unshift({
                            source: ee
                          , type: eventName
                          , arguments: args
                          , timestamp: +(new Date)
                        })
                        */


                        EventEmitter.prototype.emit.apply(ee, arguments)

                        for ( var i=0, keys=_.keys(this._eeChannels), l=keys.length; i<l; i++ )
                          (function(channelName, channelers){
                              for ( var i=0, l=channelers.length; i<l; i++)
                                EventChanneler.prototype.emit.apply(channelers[i], [channelName+"."+eventName].concat(args))
                          }([keys[i]], (this._eeChannels[keys[i]]) || []) )

                        return this
                    }
                    return this
                  }
                , unpipe: function(channelName, ee){
                      if ( !ee._eeEvents && !ee.emit )
                        throw new Error('target must be a valid EventEmitter')
                      if ( !ee._eeChannels.hasOwnProperty(channelName) ) return this

                      var idx = _.indexOf(ee._eeChannels[channelName], this)
                      if ( idx >= 0 )
                        ee._eeChannels[channelName].splice(idx, 1)

                      return this
                  }
            }
        })
        
        /*
        * An abstract class that only describes a "promise" mechanism.
        * Classes that inherit Promise must control when resolve() or reject() is invoked.
        * @name sleipnir.core.Promise
        */
      , Promise = core.Promise = klass(EventEmitter, function(_, supr){
            return {
                _construct: function(){
                    supr.call(this)
                }
              , status: -1
              , then: function(onresolveHandler, onrejectHandler /*, onprogressHandler*/){
                    if ( this.status == 1 && onresolveHandler )
                      return onresolveHandler(), this
                    if ( this.status == 0 && onrejectHandler )
                      return onrejectHandler(), this
                    if ( onresolveHandler) this.once('promise.resolved', onresolveHandler)
                    if ( onrejectHandler) this.once('promise.rejected', onrejectHandler)
                    /*if ( onprogressHandler) this.once('promise.progress', onprogressHandler)*/

                    return this
                }
              , resolve: function(){
                    var args
                    this.status = 1
                    if ( !arguments.length )
                      this.emit('promise.resolved')
                    else
                      args = _.to.array(arguments),
                      args.unshift('promise.resolved'),
                      this.emit.apply(this, args)
                    return this
                }
              , reject: function(){
                    var args
                    this.status = 0
                    if ( !arguments.length )
                      this.emit('promise.rejected')
                    else
                      args = _.to.array(arguments),
                      args.unshift('promise.rejected'),
                      this.emit.apply(this, args)
                    return this
                }
            }
        })

        /*
        * An abstract class that only describes a "deferring" mechanism of multiple "promises".
        * Classes that inherit Deferrer must control when resolve() or reject() is invoked.
        * @name sleipnir.core.Deferrer
        */
      , Deferrer = core.Deferrer = klass(EventEmitter, function(_, supr){
            var getPercent = function(n, of){
                    if ( !of ) return 0
                    return n/of*100
                }
            return {
                _construct: function(){
                    supr.call(this)
                    this.promises = []
                    this.promises.resolvable = 0
                    this.promises.unresolvable = 0
                    this.promises.status = -1
                    this.yields = []
                }
              , then: function(onresolveHandler, onrejectHandler, onprogressHandler){
                    if ( this.status == 1 && onresolveHandler )
                      return onresolveHandler(), this
                    
                    if ( this.status == 0 && onrejectHandler )
                      return onrejectHandler(), this
                    
                    if ( this.status >= 0 )
                      return this
                    
                    if ( onresolveHandler) this.once('deferrer.resolved', onresolveHandler)
                    if ( onrejectHandler) this.once('deferrer.rejected', onrejectHandler)
                    if ( onprogressHandler) this.once('deferrer.progress', onprogressHandler)
                    return this
                }
              , or: function(onrejectHandler){
                    if ( !onrejectHandler)  return this
                    if ( this.status === 0 )
                      return onrejectHandler(), this
                    this.once('deferrer.rejected', onrejectHandler)
                    return this
                }
              , progress: function(onprogressHandler){
                    if ( !onprogressHandler ) return this 
                    this.once('deferrer.progress', onprogressHandler)
                    return this
                }
              , resolve: function(){
                    var args
                    this.promises.status = 1
                    if ( !arguments.length && !this.yields.length )
                      this.emit('deferrer.resolved')
                    else
                      args = _.to.array(arguments),
                      args.unshift('deferrer.resolved'),
                      args.push(this.yields),
                      this.emit.apply(this, args)
                    return this
                }
              , reject: function(){
                    var args
                    this.promises.status = 0
                    if ( !arguments.length && !this.yields.length )
                      this.emit('deferrer.rejected')
                    else
                      args = _.to.array(arguments),
                      args.unshift('deferrer.rejected'),
                      args.push(this.yields),
                      this.emit.apply(this, args)
                    return this
                }
              , onprogress: function(){
                    var percent = getPercent( this.promises.resolvable + this.promises.unresolvable, this.promises.length)

                    if ( percent != 100 )
                      this.emit('deferrer.progress', percent )
                    else
                      if ( !this.promises.unresolvable ) {
                        this.resolve()
                      }
                      else
                        this.reject()
                    return this
                }
            }
        })
        
        /*
        * A class that store key->values in an evented fashion
        * @name sleipnir.data.Model
        * @alias sleipnir.mvc.Model
        */
      , Model = data.Model = klass(EventEmitter, function(_, supr){
            this.create = function(variables){
                return new Model(variables)
            }
            
            var Variable = klass(function(_, supr){
                return {
                    _construct: function(name, value, parent){
                        var args = _.to.array(arguments)
                        this.parent = args.pop()
                        this.name = args.shift()

                        if ( args.length )
                          this.set( args[0] )
                    }
                  , status: 0
                  , set: function(value){
                        var ovalue = this.value
                        
                        if ( ovalue === value ) return
                        
                        this.value = value
                        
                        
                        if ( this.status == 0 )
                          this.parent.emit(this.name+'.add', this.value),
                          this.parent.emit('add', this.name, this.value),
                          this.status = 1

                        this.parent.emit(this.name+'.change', this.value, ovalue)
                        this.parent.emit('change', this.name, this.value, ovalue)
                    }
                  , get: function(){
                        /* useful ?
                        this.parent.emit(this.name+'.get', this.value)
                        this.parent.emit('get', this.name, this.value)
                        */
                        return this.value
                    }
                  , remove: function(){
                        this.parent.emit(this.name+'.change', null, this.value)
                        this.parent.emit('change', this.name, null, this.value)
                        this.parent.emit(this.name+'.remove')
                        this.parent.emit('remove', this.name)
                        this.status = 0
                    }
                }
            })

            return {
                _construct: function(variables){
                    supr.call(this)
                    
                    var self = this
                    
                    this.variables = {}
                    
                    if ( variables ) for ( var v in variables ) if ( variables.hasOwnProperty(v) )
                      this.variables[v] = new Variable(variables[v].name, variables[v].value, this)
                    
                    this.emit('create', this)
                }
              , set: function(name, value){
                    if ( !this.variables.hasOwnProperty(name) )
                      this.variables[name] = new Variable(name, value, this)
                    else
                      this.variables[name].set(value)
                    return this
                }
              , get: function(name){
                    if ( !this.variables.hasOwnProperty(name) )
                      this.variables[name] = new Variable(name, this)
                    return this.variables[name].get()
                }
              , remove: function(name){
                    if ( this.variables.hasOwnProperty(name) )
                      this.variables[name].remove()
                      delete this.variables[name]
                    return this
                }
              , toJSON: function(){ //return a json
                    
                }
              , fromJSON: function(){ //update from a json
                    this.emit('update')
                }
              , serialize: function(){ //serialize... 
                    
                }
              , sync: function(){ //sync with a server
                    this.emit('update')
                }

            }
        })
        
        /*
        * A class that can hold multiple sleipnir.data.Model instances, and pipe all their events through a specific channel
        * @name sleipnir.core.Collection
        */
      , Collection = data.Collection = klass(EventChanneler, function(_, supr){
            this.create = function(){
                return new Collection
            }
        
            return {
                _construct: function(){
                    supr.call(this)
                    var _models
                    
                    this.models = []
                    
                    if ( arguments.length == 1 && _.is.array(arguments[0]) )
                      _models = arguments[0]
                    else
                      _models = arguments
                    for ( var i=0, l=_models.length; i<l; i++ )
                      this.add(_models[i])
                }
              , add: function(model){
                    this.models.push(model)
                    this.pipe('models', model)
                    return this
                }
              , remove: function(model){
                    var idx = _.indexOf(this.models, model)
                    if ( !~idx ) return this
                    this.unpipe('models', this.models[idx]),
                    this.models.splice(idx, 1)
                    return this
                }
            }
        })

        , Router = ns.core.Router = klass(Collection, function(_, supr){
            this.create = function(){
                return new Router
            }
            
            this.set = function(state, title, url){
                env.url.push(state, title, url)
                return this
            }
            
            var Route = new klass(Model, function(_, supr){
                    var types = this.types = {
                          "/": "path"
                        , "?": "search"
                        , "#": "hash"
                      }
                    , paths = this.paths = {
                          "/": function(o){ return new RegExp('^'+o) }
                        , "?": function(o){ return new RegExp(o.slice(1)) }
                        , "#": function(o){ return new RegExp(o.slice(1)) }
                      }
                         
                    return {
                        _construct: function(_path, name){
                            supr.call(this)
                            
                            var self = this
                              , operator = _path.slice(0,1)
                              , type = types[operator]
                              , path = paths[operator](_path)
                            
                            this.set('type', type)
                            this.set('path', path)
                            this.set('name', name)
                            this.set('match', null)
                            
                            env.url.on(type+'.change', function(){
                                self.test()
                            })
                        }
                      , status: 0
                      , data: null
                      , test: function(){
                            var val = env.url.get(this.get('type'))
                              , match = val.match(this.get('path'))
                              , name = this.get('name')
                            
                            if ( !match ) {
                              if ( this.status == 1)
                                this.emit('exit', name, match),
                                this.emit(name+'.exit', name, match),
                                this.status = 0
                              return
                            }
                            if ( this.status == 0 || match !== this.get('match') )
                              this.set('match', match),
                              this.status = 1,
                              this.emit('enter', name, match),
                              this.emit(name+'.enter', match)
                        }
                    }
                })
            
            return {
                _construct: function(){
                    supr.call(this)
                    this.pipe('url', env.url)
                    this.routes = {}
                }
              , on: function(){
                    var args = _.to.array(arguments)
                      , eventName = args.shift()
                      , match = eventName.match(/routes\.([^\.]*)\.(enter|exit)/)
                      , name = match && match[1] || eventName
                      , action = match && match[2] || null 
                      , wait = _.is.boolean( args[args.length-1] ) && !args.pop() || true
                      , handler = _.is.fn( args[args.length-1] ) && args.pop() || noop
                      , dependencies = args
                      , route = this.routes[name]
                    
                    if ( !match )
                      return EventEmitter.prototype.on.apply(this, arguments), this
                    
                    EventEmitter.prototype.on.call(this, eventName, function(matches){
                        
                        route = route || route[name] // should exist now
                        
                        if ( action === "enter" && !route) {
                          if ( dependencies.length )
                            new ResourceLoader(dependencies).then(function(data){
                                route.data = data
                                sleipnir(function(err, _){
                                    handler(err, _, data, matches)
                                }, wait)
                            }).or(function(){
                                handler(new Error('sleipnir: error loading one of the requested resources'), _)
                            })
                          else
                            sleipnir(function(err, _, data){
                                handler(err, _, data, matches)
                            }, wait)
                        }
                        else
                          sleipnir(function(err, _, data){
                              handler(err, _, route.data, matches)
                          })
                    })
                    
                    if ( route )
                      route.test()
                    return this
                }
              , when: function(){
                    if ( !arguments.length || (arguments.length == 1 && !_.is.object(arguments[0])) )
                      throw new Error("sleipnir.router#set error: bad argument")
                    
                    var self = this
                      , routes = {}
                    
                    if ( arguments.length > 1 )
                      routes[arguments[0]] = arguments[1]
                    else
                      routes = arguments[0]
                    
                    for ( var i=0, keys=_.keys(routes), l=keys.length; i<l; i++ )
                      (function(route, name){
                          self.models.push( route )
                          self.pipe('routes', route)
                          self.routes[name] = route
                      }( new Route(keys[i], routes[keys[i]]), routes[keys[i]] ))
                    
                    return this
                }
            }
        })

        /*
        * An utility class that provides a mechanism to place nodes on dom
        * @name sleipnir.dom.Usher
        */
      , Usher = dom.Usher = klass(Promise, function(_, supr){
            this.create = function(node, targetNode, actionType){
                return new Usher(node, targetNode, actionType)
            }
            
            var types = {
                    1: "append"
                  , 2: "prepend"
                  , 3: "insertBefore"
                  , 4: "insertAfter"
                  , 5: "replaceWith"
                }

            return {
                _construct: function(node, targetNode, actionType){
                    supr.call(this)
                    if ( !_.is.element(node) || !_.is.element(targetNode) )
                        this.reject()
                    this.node = node
                    this.targetNode = targetNode
                    this.actionType = actionType || 1

                    this[types[this.actionType]]()
                }
              , append: function(){
                    this.targetNode.appendChild(this.node)
                    this.resolve()
                }
              , prepend: function(){
                    this.targetNode.insertBefore(this.node, this.targetNode.childNodes[0])
                    this.resolve()
                }
              , insertBefore: function(){ 
                    this.targetNode.parentNode.insertBefore(this.node, this.targetNode)
                    this.resolve()
                }
              , insertAfter: function(){
                    var nsibling = this.targetNode.nextSibling
                    if ( nsibling ) // old ie could fail if node nextSibling does not exist
                      this.targetNode.parentNode.insertBefore(this.node, nsibling)
                    else
                      this.targetNode.parentNode.appendChild(this.node)
                    this.resolve()
                }
              , replaceWith: function(){
                    this.targetNode.parentNode.replaceChild(this.node, this.targetNode)
                    this.resolve()
                }
            }
        })

      , DomResource = dom.DomResource = klass(Promise, function(_, supr){ //base for dom.{CSS, Script, IMG}
            this.create = function(file, parameters, handler){
                return new DomResource(file, parameters, handler)
            }
            
            return {
                _construct: function(file, parameters, handler){
                    var self=this
                      , args = _.to.array(arguments)
                      , handler = _.is.fn(args[args.length-1]) && args.pop() || null
                      , file = args.shift()
                      , parameters = args.length && args[0] || {}
                    
                    supr.call(this)
                    
                    setTimeout(function(){
                        var node, match, fileText, fileUrl, inline
                          , position = self.position = (parameters.position && parameters.position.node) && parameters.position || self.defaultPosition
                          , onsuccess = function(){ self.resolve(self.node) }
                          , onerror = function(){ self.reject(self.node) }
                       
                       if ( match = file.match(self.rinline), match )
                          inline = true,
                          fileText = match[2]
                        else
                          inline = false,
                          fileUrl = file
                        
                        if ( hasBlob && inline )
                            node = self.getBlobNode(fileText, onsuccess, onerror),
                            inline = false // treated now as an external file
                        else if ( inline )
                            node = self.getInlineNode(fileText)
                        else
                            node = self.getExternalNode(fileUrl, onsuccess, onerror)
                        
                        self.node = node 
                        
                        if ( position )
                          new Usher(node, position.node, position.type).then(function(){
                             if ( inline )
                                self.resolve(node)
                          }, function(){
                              self.reject(node)
                          })
                        else
                          if ( inline )
                            self.resolve(node)
                    }, 0)
                    
                    if ( handler )
                      this.then(handler)
                }
              , rinline: /.^/
              , defaultPosition: null
              , position: null
              , getInlineNode: function(){}
              , getBlobNode: function(){}
              , getExternalNode: function(){}
            }
        })
        
      , Script = dom.Script = klass(DomResource, function(_, supr){
            this.create = function(file, params, handler){
                return new Script(file, params, handler)
            }
            
            var defaultPosition = {
                    node: head || document.head
                  , type: 1 //append
                }
            
            return {
                rinline: rscript
              , _construct: function(file, params, handler){
                    this.defaultPosition = defaultPosition
                    supr.call(this, file, params, handler)
                }
              , getInlineNode: function(script){
                    var node = document.createElement('script')
                    node.type = "text/javascript"
                    node.innerHTML = script
                    return node
                }
              , getBlobNode: function(script, onsuccess, onerror){
                    var blob, blobUrl, node
                    blob = new Blob([script], {"type": "text\/javascript"})
                    blobUrl = URL.createObjectURL(blob)
                    node = document.createElement('script')
                    node.type = "text/javascript"
                    node.async = true
                    node.onload = node.onreadystatechange = function(){
                        if ( node.readyState && "complete, loaded".indexOf(node.readyState) <0 ) return
                        node.onreadystatechange = null
                        node.onload = null
                        onsuccess()
                    }
                    node.onerror = onerror
                    node.src = blobUrl
                    return node
                }
              , getExternalNode: function(script, onsuccess, onerror){
                    var node = document.createElement('script')
                    node.type = "text/javascript"
                    node.async = true
                    node.onload = node.onreadystatechange = function(){
                        if ( node.readyState && "complete, loaded".indexOf(node.readyState) <0 ) return
                        node.onreadystatechange = null
                        node.onload = null
                        onsuccess()
                    }
                    node.onerror = onerror
                    node.src = script
                    return node
                }
            }
        })
        
      , CSS = dom.CSS = klass(DomResource, function(_, supr){
            this.create = function(file, params, handler){
                return new CSS(file, params, handler)
            }
            
            var oldIE = document.createStyleSheet && true || false
              , defaultPosition = {
                  node: head || document.head
                , type: 1 //append
              }
            
            return {
                rinline: rstyle
              , _construct: function(file, params, handler){
                    this.defaultPosition = defaultPosition
                    supr.call(this, file, params, handler)
                }
              , getInlineNode: function(cssText, onsuccess, onerror, oldIE){
                    var node
                    if ( oldIE )
                      node = document.createStyleSheet(),
                      node.cssText = cssText
                    else
                      node = document.createElement('style'),
                      node.type = "text/css",
                      node.innerHTML = cssText
                    return node
                }
              , getBlobNode: function(cssText, onsuccess, onerror){
                    var blob, blobUrl, URL = root.URL || root.webkitURL, node
                
                    blob = new Blob([cssText], {"type": "text\/css"})
                    blobUrl = URL.createObjectURL(blob)
                    node = document.createElement('link')
                    node.rel = "stylesheet"
                    node.type = "text/css"
                    node.onload = node.onreadystatechange = function(){
                        if ( node.readyState && "complete, loaded".indexOf(node.readyState) <0 ) return
                        node.onreadystatechange = null
                        node.onload = null
                        onsuccess()
                    }
                    node.onerror = onerror
                    node.href = blobUrl
                    return node
                }
              , getExternalNode: function(cssURL, onsuccess, onerror){
                    var node = document.createElement('link')
                    node.rel = "stylesheet"
                    node.type = "text/css"
                    node.onload = node.onreadystatechange = function(){
                        if ( node.readyState && "complete, loaded".indexOf(node.readyState) <0 ) return
                        node.onreadystatechange = null
                        node.onload = null
                        onsuccess()
                    }
                    node.onerror = onerror
                    node.href = cssURL
                    return node
                }
            }
        })
      
      , IMG = dom.IMG = klass(DomResource, function(_, supr){
            this.create = function(file, params, handler){
                return new IMG(file, params, handler)
            }
            
            return {
                rinline: rbase64
              , _construct: function(file, params, handler){
                    supr.call(this, file, params, handler)
                }
              , getInlineNode: function(img){
                    var node = new Image
                    node.src = img
                    return node
                }
              , getBlobNode: function(img, type, onsuccess, onerror){
                    var node, blob, bloburl
                    blob = new Blob([script], {"type": type})
                    blobUrl = URL.createObjectURL(blob)
                    node = new Image
                    node.onload = onsuccess
                    node.onerror = onerror
                    node.src = blobUrl
                    return node
                }
              , getExternalNode: function(img, onsuccess, onerror){
                    var node = new Image
                    node.onload = onsuccess
                    node.onerror = onerror
                    node.src = img
                    return node
                }
            }
        })

      , ResourceLoader = core.ResourceLoader = klass(Deferrer, function(_, supr){
            this.create = function(resources){
                return new ResourceLoader(resources)
            }
            
            function defineResourceType(o){
                var name, value, promise
                  , isObj = _.is.object(o)
                  , inList = resourceList.get([( isObj && o.value || o )])

                if ( inList )
                  return inList

                if ( isObj )
                  switch ( o.type ){
                      case "js":
                          if  ( o.parameters )
                            promise = new Script(o.value, o.parameters) 
                          else
                            promise = new Script(o.value)
                            break
                      case "css":
                            if  ( o.parameters )
                              promise =  new CSS(o.value, o.parameters)
                          promise = new CSS(o.value)
                          break
                      case "img":
                          if  ( o.parameters )
                            promise =  new IMG(o.value, o.parameters)
                          promise = new IMG(o.value)
                          break
                      default:
                        if ( promise )
                          value = o.value
                        else
                          throw new Error('ResourceLoader Error : badly formatted resource description')
                        break
                  }
                else if ( o.match(rscript) || o.match(rscripturl) )
                  value = o,
                  promise = new Script(o)

                else if ( o.match(rstyle) || o.match(rstyleurl) )
                  value = o,
                  promise = new CSS(o)

                else if ( o.match(rbase64) || o.match(rimgurl))
                  value = o,
                  promise = new IMG(o)
                else
                  throw new Error('ResourceLoader Error : unable to define type of resource')

                resourceList.set(value, promise)

                return promise
            }


            var resourceList = this.resourceList = new Model

            return {
                _construct: function(){
                      supr.call(this)

                      var self = this
                        , promises = _.is.array( arguments[0] ) && arguments[0] || _.to.array(arguments)
                      
                      for ( var i=0, l=promises.length; i<l; i++ )
                        this.promises[i] = defineResourceType( promises[i] ),
                        (function(promise, i){
                            setTimeout(function(){
                                promise.then(function(data){
                                    self.yields[i] = data
                                    self.promises.resolvable++
                                    self.onprogress()
                                }, function(){
                                    self.promises.unresolvable++
                                    self.onprogress()
                                })
                            }, 0)
                        }(this.promises[i], i))

                      if ( !arguments.length )
                        setTimeout(function(){
                            self.resolve()
                        }, 0)
                }
            }
        })

      , urlMask = env.url = klass(Model, function(_, supr){
            var history = root.history || {
                    pushState: function(){}
                  , replaceState: function(){}
                }
                
              , unserializeURL = function(href){
                    var items = href.slice(1).split(/&amp;|&/)
                      , _obj = {}
                    for ( var i=0, l=items.length; i<l; i++ )
                      (function(item){
                          var item = item.split('=')
                            , name = unescape( item.shift() )
                            , value = unescape( item.join('=') )
                          _obj[name] = value
                      }(items[i]))
                    return _obj
                }
            
            return {
                _construct: function(){
                    supr.call(this)
                    
                    var self = this
                    
                    root.addEventListener('popstate', function(){
                        self.update()
                    })
                    
                    root.addEventListener('hashchange', function(){
                        self.update()
                    })
                    
                    this.update()
                }
              , update: function(){
                    if ( this.get('href') === location.href )
                      return this
                    
                    this.set('href', location.href )
                    this.set('protocol', location.protocol.slice(0, -1))
                    this.set('port', location.port)
                    this.set('host', location.host)
                    this.set('path', location.pathname)
                    this.set('search', location.search)
                    this.set('hash', location.hash)
                    this.set('queries', unserializeURL(location.search))
                    
                    return this
                }
              , replace: function(state, title, url){
                    history.replaceState(state, title, url)
                    this.update()
                    return this
                }
              , push: function(state, title, url){
                    history.pushState(state, title, url)
                    this.update()
                    return this
                }
            }
        }, true)

      , domReadyListener = klass(EventEmitter, function(){ //singleton
            return {
                _construct: function(){
                    EventEmitter.call(this)
                    var self = this
                      , onready = function(){
                            if ( domReady )
                              return
                            domReady++
                            body = document.body
                            head = document.head
                            docElt = document.documentElement
                            self.emit('domready')
                        }

                    // test to know if the document is already loaded
                    // attach listeners for document readyness otherwise and in some other cases ( ff 3.5 )

                    if ( document.readyState ) {
                      if ( document.readyState == 'complete' )
                        return onready()
                    }
                    else if ( root.addEventListener ) // target old not-ie-browsers without document.readyState ( ff 3.5 )
                      setTimeout(onready, 0)  // will fire after document is ready

                    if ( root.addEventListener )
                        root.addEventListener('DOMContentLoaded', onready),
                        root.addEventListener('load', onready)
                    else
                        root.attachEvent('onload', onready),
                        (function scrollcheck(){
                            try {
                              document.documentElement.doScroll('left');
                            } catch(e) {
                                setTimeout(scrollcheck, 16)
                                return
                            }
                            onready()
                        }())

                    document.onreadystatechange = function(){
                        if ( document.readyState !== 'complete' )
                          return
                        document.onreadystatechange = null
                        onready()
                    }

                }
            }
        }, true)

      , sleipnir = root.sleipnir = (function(_){
            var sleipnir = function(){
                    if ( !arguments.length ) return ns

                    var args = _.to.array(arguments)
                      , wait = _.is.boolean( args[args.length-1] ) && !args.pop() || true
                      , handler = _.is.fn( args[args.length-1] ) && args.pop() || noop
                      , dependencies = args
                    
                    if ( dependencies.length )
                      return new ResourceLoader(dependencies).then(function(data){
                          sleipnir(function(err, _){
                              handler(err, _, data)
                          }, wait)
                      }).or(function(){
                          handler(new Error('sleipnir: error loading one of the requested resources'), _)
                      }), ns

                    if ( domReady || !wait )
                      return handler(null, _), ns

                    return domReadyListener.on('domready', function(){
                        handler(null, _)
                    }), ns
                }

            for ( var k in ns ) if ( ns.hasOwnProperty(k) )
              sleipnir[k] = ns[k]  

            return sleipnir
        }(_))
}(this))
;