(function(root){ "use strict"
    var
        document = root.document
      , location = root.location
      , navigator = root.navigator
      , performance = root.performance
      
      , domReady = 0
      , body, head, docElt
      
        // regexps
      , rscript = /<(script).*>([\s\S]*)<\/\1>/i
      , rscripturl = /\.js($|\?\S*$)/
      , rstyle = /<(style).*>([\s\S]*)<\/\1>/i
      , rstyleurl = /\.css($|\?\S*$)/
      , rbase64 = /^(image\/(.*);base64.*)$/i
      , rimgurl = /\.gif|jpg|png|jpeg($|\?\S*$)/
        
        // feature detection
      , URL = root.URL || root.webkitURL || false
      , hasBlob = (root.Blob && URL && URL.createObjectURL ) && true || false
        
        //empty fn
      , noop = function(){}
      
        // namespace
      , ns = {}
      , version = ns.version = "0.4.0a01"
      , core = ns.core = {}
      , data = ns.data = {}
      , dom = ns.dom = {}
      , env = ns.env = {}
      , utils = ns.utils = {}
      
      
        // UTILS
        
      , _ = (function(){
            var u = ns.utils
              , slice = Array.prototype.slice
              , toString = Object.prototype.toString
            
              , is = u.is = {
                    "arguments" : function(o){
                        return toString.call(o) == "[object Arguments]"
                    }
                  , "array" : function(o){
                        return Array.isArray(o)
                    }
                  , "boolean" : function(o){
                        return toString.call(o) == "[object Boolean]"
                    }
                  , "function" : function(o){
                        return typeof o == "function"
                    }
                  , "element" : function(o){
                        return o instanceof Element
                    }
                  , "map" : function(o){
                        return (typeof o == "object" && o && o.constructor === Object)
                    }
                  , "NaN" : function(o){
                        return o !== o
                    }
                  , "null" : function(o){
                        return o === null
                    }
                  , "number" : function(o){
                        return typeof o == "number" || toString.call(o) == ["object Number"]
                    }
                  , "primitive" : function(o){
                        return toString.call(o).match(/String|Number/) && typeof o == "object"
                    }
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
                
                , to = u.to = {
                      array: function(o){ // todo, more stuff
                          if ( is.arguments(o) )
                            return slice.call(o)
                          else if ( is.string(o) )
                            return o.split('')
                      }
                  }
                
                , mix = u.mix = function mix(){
                      var o
                      if ( is.map(arguments[0]) )
                        o = {}
                      else if ( is.array(arguments[0]) )
                        o = []
                      else
                        throw new Error('bad argument type')
                  
                      for (var i=0, l=arguments.length; i<l; i++)  if ( (arguments[i]).constructor === (o).constructor  )
                        (function(t){
                            for ( var p in t ) if ( t.hasOwnProperty(p) ) {
                              if ( is.map(t[p]) || is.array(t[p]) ) {
                                if ( !is.map(o[p]) && !is.array(o[p]) ) o[p] = mix(t[p])
                                else o[p] = mix(o[p], t[p])
                              }
                              else
                                o[p] = t[p]
                              }
                        }(arguments[i]))
                      return o
                  }
                
                , serialize = u.serialize = function serialize(o, osep, ksep){
                      var str = []
                        , osep = u.is.string(osep) && osep || "&"
                        , ksep = u.is.string(ksep) && ksep || "="
                                            
                      for ( var i=0, k=Object.keys(o), l=k.length; i<l; i++ )
                        (function(k, v){
                            if ( u.is.null(v) || u.is.undefined(v) || u.is.NaN(v) ) return
                            
                            if ( u.is.array(v) || u.is.map(v) )
                              return str.push([k, serialize(v, "|", "=")].join(ksep))
                            
                            str.push([k, v].join(ksep))
                        }(k[i], o[k[i]]))
                      
                      return str.join(osep)
                  }
        }())
      
      , klass = ns.class = (function(){
      
            var __proto = (function(){
                    var o = Object.create(null)
                    Object.defineProperty(o, '__define__', { value: function(key, val){ return Object.defineProperty(this, key, val) } })
                    Object.defineProperty(o, 'isPrototypeOf', { value: function(x){ return Object.prototype.isPrototypeOf.call(this, x) } })
                    return o
                }())
        
            return function(){
                var args = ns.utils.to.array(arguments)
                  , singleton = false, properties, Super, Heir, supr, prototype
                  , i, p, k, l
        
                if ( ns.utils.is.boolean(args[args.length-1]) )
                  singleton = args.pop()
        
                properties = args.pop()
        
                Super = args[0]
                supr = Super && function(){
                    var _construct = Super.prototype._construct
                      , length = arguments.length
                      , args
                    
                    if ( !_construct || !length ) return
                    
                    if ( arguments.length == 1 )
                      return Super.prototype._construct.call(arguments[0])
                    
                    var args = ns.utils.to.array(arguments)
                      , heir = args.shift()
                    return Super.prototype._construct.apply(heir, args)
                } || noop
        
        
                Heir = function(){
                    if ( this._construct )
                      this._construct.apply(this, arguments)
                }
                
                prototype = (function(){
                    var o = Object.create( (Super && Super.prototype || __proto) )
                    for ( i=0, p=(ns.utils.is.function(properties) && properties.call(Heir, supr, ns.utils) || properties), k=Object.keys(p), l=k.length; i<l; i++ )
                        (function(key, value){
                            var userDefined = (ns.utils.is.map(value) && ( value.hasOwnProperty("configurable") || value.hasOwnProperty("enumerable") || value.hasOwnProperty("writable") || value.hasOwnProperty("set") || value.hasOwnProperty("get")) )
                            
                            if ( !userDefined )
                              return Object.defineProperty(o, key, {
                                  configurable: true
                                , enumerable: true
                                , writable: true
                                , value: value
                              })
                            
                            return Object.defineProperty(o, key, value) 
                        }(k[i], p[k[i]]))
                    return o
                }())
        
                Heir.prototype = prototype
                Heir.prototype.constructor = Heir
                
                Heir.create = Heir.create || function(){
                    if ( !arguments.length )
                      return new Heir
                    
                    var args = ns.utils.to.array(arguments)
                      , _args = [], _fn
                    
                    for ( var i=0, l=arguments.length; i<l; i++ )
                      _args.push("arg"+i)
                    
                    _args.join(', ')
                    args.unshift(Heir)
                    _fn = new Function("Heir, " + _args, "return new Heir("+ _args +")")
                    
                    return _fn.apply(null, args)
                }
                Heir.extend = Heir.extend || function(properties){
                    var singleton = ns.utils.is.boolean(arguments[arguments.length-1]) && arguments[arguments.length-1] || false
                    return klass(Heir, properties, singleton)
                }
                Heir.toString = function(){
                    return Heir.prototype._construct && Heir.prototype._construct.toString() || noop.toString()
                }
                
                if ( singleton )
                  return new Heir
                return Heir
            }
        }())
        
      , EventEmitter = core.EventEmitter = klass(function(){
            var EventHandler = klass({
                    _construct : {enumerable:false, value: function(handler, runs, parent){
                        this.handler = handler
                        this.runs = runs || Infinity
                        this.USE_RUNS = !!runs
                        this.parent = parent
                    }}
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
                })
            
            return {
                _construct: {enumerable: false, value: function(){
                    this.__define__('__eeEvents__', { value: {} })
                    this.__define__('__eePipes__', { value: {} })
                    this.__define__('__eeModel__', { value: {values:{}, status:{}} })
                    this.__define__('__eventEmitter__', { value: true })
                }}
              , on: function(eventName, eventCallback, eventRuns){
                    this.emit('listener.add', eventName, eventCallback, eventRuns)
                    this.__eeEvents__[eventName] = this.__eeEvents__[eventName] || []
                    this.__eeEvents__[eventName].push(new EventHandler(eventCallback, eventRuns, this))
                    return this
                }
              , once: function(eventName, eventCallback){
                    return this.on(eventName, eventCallback, 1)
                }
              , off: function(eventName, eventCallback){
                    var event = this.__eeEvents__[eventName]
                    if ( !event )
                      return this
                    for ( var i=0, l=event.length; i<l; i++ )
                      if ( event[i].is(eventCallback) ){
                        event.splice(i,1)
                        this.emit("listener.remove", eventName, eventCallback)
                        if (!!all)
                          return this.off(eventName, eventCallback)
                        return this
                      }
                    return this
                }
              , emit: function(eventName){
                    var self = this
                      , event = this.__eeEvents__[eventName]
                      , args
                      
                    
                    if ( event )
                      for ( var i=0, l=event.length; i<l; i++ )
                        event[i].fire(arguments)
                    
                    args = ns.utils.to.array(arguments)
                    args.shift()
                    
                    for ( var i=0, pipes=this.__eePipes__, k=Object.keys(pipes), l=k.length; i<l; i++ )
                        (function(channelName, channelers){
                            for ( var i=0, l=channelers.length; i<l; i++ )
                                EventEmitter.prototype.emit.apply(channelers[i], [channelName+"."+eventName].concat([self], args))
                        }( k[i], pipes[k[i]] ))
                    
                    return this
                }
              , pipe: function(channelName, ee){
                    if ( !ee.__eventEmitter__ ) return
                    (ee.__eePipes__[channelName] = ee.__eePipes__[channelName] || []).push(this)
                    this.emit('pipe.add', channelName, ee)
                    return this
                }
              , unpipe: function(channelName, ee){
                    var idx
                    if ( !ee.__eventEmitter__ || !ee.__eePipes__.hasOwnProperty(channelName) ) return this
                    
                    if ( idx = ee.__eePipes[channelName].indexOf(this), !!~idx )
                      ee.__eePipes[channelName].splice(idx, 1),
                      this.emit('pipe.remove', channelName, ee)
                      
                    return this
                }
              , set: function(key, value, enumerable){
                    var self = this
                      , enumerable = ns.utils.is.boolean(enumerable) ? enumerable : true
                      
                      , okey = (this.__eeModel__.values[key] = this.__eeModel__.values[key] || null)
                      , ostatus = (this.__eeModel__.status[key] = this.__eeModel__.status[key] || 0)
                    
                    if ( !ostatus )
                      this.emit(key+'.add'),
                      this.emit("property.add", key),
                      ostatus = 1
                    
                    Object.defineProperty(this, key, {
                        configurable: false
                      , enumerable: enumerable
                      , set: function(nval){
                            var oval = self.__eeModel__.values[key]
                            if ( nval === oval ) return
                            
                            self.emit(key+'.change', nval, oval)
                            self.emit("property.change", key, nval, oval)
                            self.__eeModel__.values[key] = nval
                            return
                        }
                      , get: function(){
                            return self.__eeModel__.values[key]
                        }
                    })
                    
                    if ( value )
                      this[key] = value
                    
                    return this
                }
            }
        })
      
      , Promise = core.Promise = klass(EventEmitter, function(supr){
            return {
                _construct: {enumerable: false, value: function(){
                    supr(this)
                    this.__define__('__status__', { writable: true, value: -1 })
                    this.__define__('__prefix__', { value: "promise", writable:true })
                    this.__define__('__isPromise__', { value: true })
                }}
              , then: function(onresolveHandler, onrejectHandler, onprogressHandler){
                    if ( this.__status__ == 1 && onresolveHandler)
                      return onresolveHandler(), this
                    
                    if ( this.__status__ == 0 && onrejectHandler)
                      return onrejectHandler(), this
                    
                    if ( onresolveHandler) this.once(this.__prefix__+'.resolved', onresolveHandler)
                    if ( onrejectHandler) this.once(this.__prefix__+'.rejected', onrejectHandler)
                    if ( onprogressHandler) this.on(this.__prefix__+'.progress', onprogressHandler)
                    return this
                }
              , or: function(onrejectHandler){
                    if ( !onrejectHandler)  return this
                    if ( this.__status__ == 0 )
                      return onrejectHandler(), this
                    this.once(this.__prefix__+'.rejected', onrejectHandler)
                    return this
                }
              , onprogress: function(onprogressHandler){
                    this.on(this.__prefix__+'.progress', onprogressHandler)
                    return this
                }
              , resolve: function(data){
                    var event = this.__prefix__+'.resolved'
                      , data = data || null
                    
                    this.__status__ = 1
                    
                    this.emit(event, data)
                    return this
                }
              , reject: function(data){
                    var event = this.__prefix__+'.rejected'
                      , data = data || null
                    
                    this.__status__ = 0
                    
                    this.emit(event, data)
                    return this
                }
              , progress: function(){
                    var args
                    if ( !arguments.length )
                      this.emit(this.__prefix__+'.progress')
                    else
                      args = ns.utils.to.array(arguments),
                      args.unshift(this.__prefix__+'.progress'),
                      this.emit.apply(this, args)
                    return this
                }
            }
        })
        
      , Deferrer = core.Deferrer = klass(Promise, function(supr){
            var getPercent = function(n, of){
                if ( !of ) return 0
                return n/of*100
            }
            
            return {
                _construct: {enumerable: false, value: function(promises){
                    var self = this
                      , _promises = ns.utils.is.array(arguments[0]) && arguments[0] || ns.utils.to.array(arguments)
                    
                    supr(this)
                    this.__define__("__promises__", { value: [] })
                    this.__define__('__yield__', { value: [] })
                    this.__prefix__ = "deferrer"
                    
                    this.set('_resolved', 0, false)
                    this.set('_rejected', 0, false)
                    this.set('_percent', 0, false)
                    
                    for ( var i=0, l=_promises.length; i<l; i++)
                        (function(promise, i){ if ( !promise.__isPromise__ ) return
                            self.__promises__.push(promise)
                            promise.then(function(data){
                                if ( data )
                                  self.__yield__[i] = data
                                self._resolved++
                                self.progress()
                            }, function(data){
                                if ( data )
                                  self.__yield__[i] = data
                                self._rejected++
                                self.progress()
                            })
                        }(_promises[i], i))
                }}
              , progress: function(){
                    this._percent = getPercent( this._resolved + this._rejected, this.__promises__.length)
                    
                    this.emit(this.__prefix__+'.progress', this._percent )
                    
                    if ( this._percent == 100 )
                      if ( !this._rejected ) {
                        this.resolve(this.__yield__)
                      }
                      else
                        this.reject(this.__yield__)
                    return this
                }
            }
        })
      
      , Model = data.Model = klass(EventEmitter, function(supr){
            return {
                _construct: {enumerable: false, value: function(variables){
                    supr(this)
                    var self = this
                    
                    this.__define__('__isModel__', { value: true })
                    
                    if ( variables )
                      for ( var i=0, k=Object.keys(variables), l=k.length; i<l; i++ )
                        if ( variables.hasOwnProperty(k[i]) )
                          this.set(k[i]),
                          this[k[i]] = variables[k[i]]
                    
                    this.emit('create', this)
                }}
              , toJSON: function(){
                    return JSON.stringify(this.__eeModel__.values)
                }
              , fromJSON: function(json){
                    var json = JSON.parse(json)
                    
                    for ( var i=0, k=Object.keys(json), l=k.length; i<l; i++ ){
                      if ( !this.__eeModel__.values.hasOwnProperty(k[i]))
                        this.set(k[i])
                      this[k[i]] = json[k[i]]
                    }
                    return this
                }
              , serialize: function(ksep, osep){
                    return ns.utils.serialize(this.__eeModel__.values, ksep, osep)
                }
            }
        })
      
      , Collection = data.Collection = klass(EventEmitter, function(supr){
            var arrayMethods = ['reverse', 'filter', "forEach", 'every', 'map', 'some', 'reduce', 'reduceRight']
              , proto = {
                _construct: {enumerable: false, value: function(){
                    supr(this)
                    
                    var self = this
                      , _models
                    
                    this.__define__('__models__', { value: [] })
                    this.__define__('__isCollection__', { value: true })
                    
                    if ( arguments.length == 1 && ns.utils.is.array(arguments[0]) )
                      _models = arguments[0]
                    else
                      _models = arguments
                    
                    for ( var i=0, l=_models.length; i<l; i++ )
                      if ( _models[i].__isModel__ )
                        this.add( _models[i] )
                      else
                        this.add( new Model(_models[i]) )
                }}
              , add: function(model){
                    if ( !model.__isModel__ )
                      throw new Error("sleipnir.data.Collection : argument must be a valid Model instance")
                    this.__models__.push(model)
                    this.pipe('models', model)
                    return this
                }
              , remove: function(model){
                    var idx
                    if ( idx = this.__models__.indexOf(model), !~idx ) return this
                    this.unpipe('models', this.__models__[idx]),
                    this.__models__.splice(idx, 1)
                    return this
                }
              , find: function(search, all){
                    
                }
              , findAll: function(search){
                    return this.find(search, true)
                }
              , toJSON: function(osep, ksep){
                    var arr = []
                      , models = this.__models__
                    
                    for ( var i=0, l=models.length; i<l; i++ )
                      arr.push( models[i].__eeModel__.values )
                    
                    return JSON.stringify(arr)
                    
                }
              , fromJSON: function(json, model){
                    var json = JSON.parse(json)
                      , model = model || Model
                    
                    for ( var i=0, k=Object.keys(json), l=k.length; i<l; i++ )
                      this.add(new Model( json[k[i]] ))
                    
                    return this
                }
            }
            
            for ( var i=0, k=arrayMethods, l=k.length; i<l; i++ )
              (function(method){
                proto[method] = function(){ return Array.prototype[method].apply(this.__models__, arguments) }
              }( k[i] ))
            
            return proto
        })
        
        /* DOM */

      , Usher = dom.Usher = klass(Promise, function(supr){
            var fns = { 
                    appendChild : function(targetNode, node){
                            targetNode.appendChild(node)
                        }
                  , prependChild : function(targetNode, node){
                            var child = targetNode.childNodes[0]
                            if (child)
                              targetNode.insertBefore(node, child)
                            else
                              targetNode.appendChild(node)
                        }
                  , insertBefore : function(targetNode, node){
                            targetNode.parentNode.insertBefore(node, targetNode)
                        }
                  , insertAfter : function(targetNode, node){
                            var sibling = targetNode.nextSibling
                            if (sibling)
                              targetNode.parentNode.insertBefore(node, sibling)
                            else
                              targetNode.parentNode.appendChild(node)
                        }
                  , replaceWith : function(targetNode, node){
                            this.targetNode.parentNode.replaceChild(this.node, this.targetNode)
                        }
                }
            
            return {
                _construct: {enumerable: false, value: function(node, targetNode, method){
                    supr(this)
                    
                    if ( !ns.utils.is.element(node) || !ns.utils.is.element(targetNode) )
                      this.reject()

                    this.__define__("__node__", { value: node })
                    this.__define__("__targetNode__", { value: targetNode })
                    this.__define__("__method__", { value: ns.utils.is.string(method) && method || "appendChild" })
                    
                    ;(fns[this.__method__] || noop)(this.__targetNode__, this.__node__)
                    this.resolve()
                }}
            }
        })
      
      , DomResource = klass(Promise, function(supr){
            return {
                _construct: {enumerable: false, value: function(file, parameters, handler){
                    supr(this)
                    
                    var self=this
                      , args = ns.utils.to.array(arguments)
                      , handler = ns.utils.is.function(args[args.length-1]) && args.pop() || null
                      , file = args.shift()
                      , parameters = args.length && args[0] || {}
                    
                    setTimeout(function(){
                            var node, match, fileText, fileUrl, inline
                              , position = self.position = (parameters.position && parameters.position.node) && parameters.position || self.__defaultPosition__
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
                    }}
                  , rinline: { enumerable: false, writable: true, value: /.^/ }
                  , defaultPosition: { enumerable: false, writable: true, value: null }
                  , position: { enumerable: false, writable: true, value: null }
                  , getInlineNode: { enumerable: false, writable: true, value: noop }
                  , getBlobNode: { enumerable: false, writable: true, value: noop }
                  , getExternalNode: { enumerable: false, writable: true, value: noop}
            }
        })
        
      , Script = dom.Script = klass(DomResource, {
            rinline: rscript
          , __defaultPosition__ : {
                node: head || document.head
              , type: "appendChild" //append
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
        })
        
      , CSS = dom.CSS = klass(DomResource, {
            rinline: rstyle
          , defaultPosition: {
                node: head || document.head
              , type: "appendChild" //append
            }
          , getInlineNode: function(cssText, onsuccess, onerror, oldIE){
                var node
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
        })
      
      , IMG = dom.IMG = klass(DomResource, {
            rinline: rbase64
          , _construct: function(file, params, handler){
                if ( params )
                  supr(this, file, params, handler)
                else
                  supr(this, file, handler)
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
        })
      
      , ResourceLoader = klass(Deferrer, function(supr){
            function defineResourceType(o){
                var name, value, promise
                  , isObj = ns.utils.is.map(o)
                  , inList = resourceList[( isObj && o.value || o )]
        
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
              , require = ns.require = function(){
                    var args = ns.utils.to.array(arguments) 
                      , handler = ns.utils.is.function(args[args.length-1]) && args.pop() || null
                      , resources = ns.utils.is.array(args[0]) && args[0] || args
                    return new ResourceLoader(resources, handler)
                }

            return {
                _construct: {enumerable: false, value: function(){
                      var self = this
                        , args = ns.utils.to.array(arguments)
                        , handler = ns.utils.is.function(args[args.length-1]) && args.pop() || null
                        , promises = ns.utils.is.array( args[0] ) && args[0] || args
                        , _arr = []
                      
                      for ( var i=0, l=promises.length; i<l; i++ )
                        _arr[i] = defineResourceType( promises[i] )
                      
                      supr(this, _arr)
                      
                      if ( handler )
                        this.then(handler)
        
                      if ( !arguments.length )
                        setTimeout(function(){
                            self.resolve(null)
                        }, 0)
                }}
            }
        })
      
      
        /* ENVIRONMENT */
      
      , urlMask = env.url = klass(Model, function(supr){
            var history = root.history || {
                    pushState: function(){
                        //todo
                    }
                  , replaceState: function(){
                        //todo
                    }
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
                _construct:{enumerable:false, value: function(){
                    var self = this
                    supr(this)
                    
                    this.set('href')
                    this.set('protocol')
                    this.set('port')
                    this.set('host')
                    this.set('path')
                    this.set('search')
                    this.set('hash')
                    this.set('queries')
                    
                    root.addEventListener('popstate', function(){
                        self.update()
                    })
                    root.addEventListener('hashchange', function(){
                        self.update()
                    })
                    this.update()
                }}
              , update: function(){
                    if ( this.get('href') === location.href )
                      return this
                    
                    this.href = location.href
                    this.protocol = location.protocol.slice(0, -1)
                    this.port = location.port
                    this.host = location.host
                    this.path = location.pathname
                    this.search = location.search
                    this.hash = location.hash
                    this.queries = unserializeURL(location.search)
                    
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
        })
      
        // WRAPPER
        
      , domReadyListener = klass(EventEmitter, function(supr){
            return {
                _construct: {enumerable:false, value: function(){
                    supr(this)
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
                      
                      if ( document.readyState ) {
                          if ( document.readyState == 'complete')
                            return onready()
                      }
                      else
                        setTimeout(onready, 0)
                      
                      root.addEventListener('DOMContentLoaded', onready)
                      root.addEventListener('load', onready)
                      document.addEventListener('readystatechange', function(){
                          if ( document.readyState !== "complete" )
                            return
                          onready()
                      })
                }}
            }
        }, true)
      
      , sleipnir = root.sleipnir = (function(){
            var sleipnir = function(){
                if ( !arguments.length ) return ns
            
                var args = ns.utils.to.array(arguments)
                  , wait = ns.utils.is.boolean( args[args.length-1] ) && !args.pop() || true
                  , handler = ns.utils.is.function( args[args.length-1] ) && args.pop() || noop
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
                  return handler(null, ns.utils), ns
            
                return domReadyListener.on('domready', function(){
                    handler(null, ns.utils)
                }), ns
            }
            
            for ( var i=0, k=Object.keys(ns), l=k.length; i<l; i++ )
              sleipnir[k[i]] = ns[k[i]]
            
            return sleipnir
        }())
}(this))