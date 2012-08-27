;
(function(root){ "use strict"
    var document = root.document
      , navigator = root.navigator

      , domReady = 0

      , rscript = /<(script).*>([\s\S]*)<\/\1>/i
      , rscripturl = /\.js($|\?\S*$)/
      , rstyle = /<(style).*>([\s\S]*)<\/\1>/i
      , rstyleurl = /\.css($|\?\S*$)/
      , rbase64 = /^(image\/(.*);base64.*)$/i
      , rimgurl = /\.gif|jpg|png|jpeg($|\?\S*$)/

      , body, head, docElt

      , ns = {}
      , core = ns.core = {}
      , env = ns.env = {}
      , data = ns.data = {}

      , version = ns.version = "0.1.2a01"

      , _ = ns.utils = (function(){
            var slice = Array.prototype.slice
              , toString = Object.prototype.toString
              , isNative = function(fn){
                    return typeof fn == "function" && fn.toString().match(/\s\[native code\]\s/)
                }
              , helpers = {
                    is : {
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
                  , to : { 
                        array : function(o){
                            if ( toString.call(o) == "[object Arguments]" )
                              return slice.call(o)
                            return []
                        }
                    }
                  , keys : (function(){
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
                  , in : {
                        array : function(arr, val){
                            for ( var i=0, l=arr.length; i<l; i++)
                              if ( arr[i] === val )
                                return i
                            return -1
                        }
                    }
                  , trim : (function(){
                        if ( isNative(String.prototype.trim) )
                          return function(o){
                                return o.trim()
                          }
                        return function(){
                              return o.replace(/^\s+/g,'').replace(/\s+$/g,'')
                        }
                    }())
                  , mix : function mix(){
                        var o
                        if ( helpers.is.object(arguments[0]) )
                          o = {}
                        else if ( helpers.is.array(arguments[0]) )
                          o = []
                        else
                          throw new Error('bad argument type')

                        for (var i=0, l=arguments.length; i<l; i++)  if ( (arguments[i]).constructor === (o).constructor  )
                          (function(t){
                              for ( var p in t ) if ( t.hasOwnProperty(p) ) {
                                if ( helpers.is.object(t[p]) || helpers.is.array(t[p]) ) {
                                  if ( !helpers.is.object(o[p]) && !helpers.is.array(o[p]) ) o[p] = mix(t[p])
                                  else o[p] = mix(o[p], t[p])
                                }
                                else
                                  o[p] = t[p]
                                }
                          }(arguments[i]))
                        return o
                    }
                }
            return helpers
        }())

      , Klass = core.Klass = (function(_){
            var noop = function(){}
              , slice = Array.prototype.slice
              , toString = Object.prototype.toString
              , keys = (function(){
                    if ( Object.keys ) return function(o){ return Object.keys(o) }
                    return function(o){ 
                        var _arr = [], k
                        for ( k in o ) if ( o.hasOwnProperty(k) )
                          _arr.push(k)
                        return _arr
                    }
                }())

            return function(Ancestor, properties, singleton){
                var args = slice.call(arguments)
                  , singleton = false, properties, Ancestor, Heir

                if ( toString.call(args[args.length-1]) == '[object Boolean]' )
                  singleton = !!args.pop()

                properties = args.pop()
                Ancestor = args[0]

                Heir = function(){
                    if ( !Heir.prototype._construct ) return this
                    if ( arguments.length == 0 )
                      Heir.prototype._construct.call(this)
                    else if ( arguments.length == 1 )
                      Heir.prototype._construct.call(this, arguments[0])
                    else if ( arguments.length == 2 )
                      Heir.prototype._construct.call(this, arguments[0], arguments[1])
                    else if ( arguments.length == 3 )
                      Heir.prototype._construct.call(this, arguments[0], arguments[1], arguments[2])
                    else
                      Heir.prototype._construct.apply(this, arguments)
                }

                if ( Ancestor ) for ( var i=0, k=keys(Ancestor.prototype), l=k.length; i<l; i++ )
                  Heir.prototype[k[i]] = Ancestor.prototype[k[i]]

                for ( var i=0, p=properties.call(Heir, _, Heir), k=keys(p), l=k.length; i<l; i++ )
                  Heir.prototype[k[i]] = p[k[i]]

                Heir.prototype.constructor = Heir.prototype._construct

                if ( singleton )
                  return new Heir
                return Heir
            }
        }(_))

      , EventEmitter = core.EventEmitter = new Klass(function(){

            var EventHandler = this.EventHandler = new Klass(function(){
                    return {
                        _construct : function(handler, params, parent){
                            var params = params || {}
                            this.handler = handler
                            this.runs = params.runs || Infinity
                            this.filters = params.filters || null
                            this.USE_RUNS = !!params.runs
                            this.USE_FILTERS = !!params.filters
                            this.parent = parent
                        }
                      , fire : function(args){
                            var length = args.length
                              , handler = this.handler
                              , context = this.parent
                              , runsError = false
                              , filterError = false

                            if ( this.USE_RUNS ) {
                              if ( !this.runs )
                                runsError = true,
                                this.runs = this.runs-1
                              if ( runsError )
                                return
                            }

                            if ( this.USE_FILTERS ) {
                              for ( var i=0, l=this.filters.length; i<l; i++ )
                                if ( !this.filters[i].test() )
                                  filterError = true
                              if ( filterError )
                                return
                            }

                            if ( length == 1 ) {
                              return handler.call(context)
                            }
                            if ( length == 2 )
                              return handler.call(context, args[1])
                            if ( length == 3 )
                              return handler.call(context, args[1], args[2])
                            if ( length == 4 )
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
              , Filter = new Klass(function(_){

                    return {
                        _construct: function(){
                            if ( arguments.length === 1 && _.is.fn(arguments[0]) )
                               (function(){}())
                        }
                      , test: function(){

                        }
                    }
                })


            return {
                _construct : function(){
                    this._eeEvents = {}
                }
              , on: function(eventName, eventCallback, eventParams){
                    this._eeEvents[eventName] = this._eeEvents[eventName] || []
                    this._eeEvents[eventName].push(new EventHandler(eventCallback, eventParams, this))
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

      , EventChanneler = core.EventChanneler = new Klass(EventEmitter, function(_){

            return {
                _construct: function(){
                    EventEmitter.call(this)
                }
              , pipe: function(channelName, ee){
                    if ( !ee._eeEvents && !ee.emit )
                        throw new Error('target must be a valid EventEmitter')

                    var self = this

                    ee._eeChannels = ee._eeChannels || {}
                    ee._eeChannels[channelName] = ee._eeChannels[channelName] || []
                    ee._eeChannels[channelName].push(this)

                    ee.emit = function(eventName){
                        var args = _.to.array(arguments), event 

                        args.shift()

                        event = {
                            source: ee
                          , type: eventName
                          , arguments: args
                          , timestamp: +(new Date)
                        }

                        EventEmitter.prototype.emit.apply(ee, arguments)

                        for ( var i=0, keys=_.keys(this._eeChannels), l=keys.length; i<l; i++ )
                          (function(channelName, channelers){
                              for ( var i=0, l=channelers.length; i<l; i++)
                                channelers[i].emit(channelName, event)
                          }([keys[i]], (this._eeChannels[keys[i]]) || []) )

                        return this
                    }
                    return this
                  }
                , unpipe: function(channelName, ee){
                      if ( !ee._eeEvents && !ee.emit )
                        throw new Error('target must be a valid EventEmitter')
                      if ( !ee._eeChannels.hasOwnProperty(channelName) ) return this

                      var idx = _.in.array(ee._eeChannels[channelName], this)
                      if ( idx >= 0 )
                        ee._eeChannels[channelName].splice(idx, 1)

                      return this
                  }
            }
        })

      , Promise = core.Promise = new Klass(EventEmitter, function(){

            return {
                _construct: function(handler){
                    EventEmitter.call(this)
                }
              , status: -1
              , then: function(onresolveHandler, onrejectHandler, onprogressHandler){
                    if ( this.status === 1 )
                      return onresolveHandler(), this
                    if ( this.status === 0 )
                      return onrejectHandler(), this
                    if ( onresolveHandler) this.once('promise.resolved', onresolveHandler)
                    if ( onrejectHandler) this.once('promise.rejected', onrejectHandler)
                    if ( onprogressHandler) this.once('promise.progress', onprogressHandler)

                    return this
                }
              , resolve: function(){
                    this.status = 1
                    this.emit('promise.resolved')
                    return this
                }
              , reject: function(){
                    this.status = 0
                    this.emit('promise.rejected')
                    return this
                }
              , progress: function(){
                    this.emit('promise.progress')
                    return this
                }
            }
        })

      , Deferrer = core.Deferrer = new Klass(EventEmitter, function(_){
            var getPercent = function(n, of){
                    if ( !of ) return 0
                    return n/of*100
                }
            return {
                _construct: function(){
                    EventEmitter.call(this)
                    this.promises = []
                    this.promises.resolvable = 0
                    this.promises.unresolvable = 0
                    this.promises.status = -1
                }
              , then: function(onresolveHandler, onrejectHandler, onprogressHandler){
                    if ( this.status === 1 )
                      return onresolveHandler(), this
                    if ( this.status === 0 )
                      return onrejectHandler(), this
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
                    this.promises.status = 1
                    this.emit('deferrer.resolved')
                    return this
                }
              , reject: function(){
                    this.promises.status = 0
                    this.emit('deferrer.rejected')
                    return this
                }
              , onprogress: function(){
                    var percent = getPercent( this.promises.resolvable + this.promises.unresolvable, this.promises.length)

                    if ( percent != 100 )
                      this.emit('deferrer.progress', percent )
                    else
                      if ( !this.promises.unresolvable )
                        this.resolve()
                      else
                        this.reject()
                    return this
                }
            }
        })

      , VariableSet = core.VariableSet = new Klass(EventEmitter, function(){

            var Variable = new Klass(function(_){
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
                        this.value = value

                        if ( this.status == 0 )
                          this.parent.emit(this.name+'.add', this.value),
                          this.status = 1

                        this.parent.emit(this.name+'.change', this.value, ovalue)
                    }
                  , get: function(){
                        this.parent.emit(this.name+'.get', this.value)
                        return this.value
                    }
                  , remove: function(){
                        this.parent.emit(this.name+'.change', null, this.value)
                        this.parent.emit(this.name+'.remove')
                        this.status = 0
                    }
                }
            })

            return {
                _construct: function(variables){
                    EventEmitter.call(this)
                    this.variables = {}

                    if ( !variables ) return
                    for ( var v in variables ) if ( variables.hasOwnProperty(v) )
                      this.variables[v] = new Variable(variables[v].name, variables[v].value, this)
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
            }
        })

      , Usher = data.Usher = new Klass(Promise, function(_){

            var types = {
                    1: "append"
                  , 2: "prepend"
                  , 3: "insertBefore"
                  , 4: "insertAfter"
                  , 5: "replaceWith"
                }

            return {
                _construct: function(node, targetNode, actionType){
                    Promise.call(this)
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

      , CSS = data.CSS = new Klass(Promise, function(_){

            function getInlineNode(cssText, onsuccess, onerror, oldIE){
                var node
                if ( oldIE )
                  node = document.createStyleSheet(),
                  node.cssText = cssText,
                  node.onerror = onerror
                else
                  node = document.createElement('style'),
                  node.type = "text/css",
                  node.textContent = cssText
                return node
            }

            function getInlineBlobNode(cssText, onsuccess, onerror){
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

            function getExternalNode(cssURL, onsuccess, onerror){
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

            return {
                _construct: function(css, parameters, handler){ 
                    var self=this
                      , args = _.to.array(arguments)
                      , handler = _.is.fn(args[args.length-1]) && args.pop() || null
                      , css = args.shift()
                      , parameters = args.length && args[0] || {}
                      , oldIE=false

                    Promise.call(this)

                    this.node = null

                    oldIE = this._oldIE = document.createStyleSheet && true || false

                    setTimeout(function(){ //kind of async'ing
                        var node, match, cssText, cssUrl, hasBlob=false, URL, inline=false
                          , position = (parameters.position && parameters.position.selector) && parameters.position || {
                                selector: head || document.head
                              , type: 1 //append
                            }
                          , onsuccess = function(){ self.resolve() }
                          , onerror = function(){ self.reject() }

                        URL = root.URL || root.webkitURL
                        hasBlob = (root.Blob && URL.createObjectURL ) && true || false

                        if ( match = css.match(rstyle), match )
                          inline = true,
                          cssText = match[2]
                        else
                          inline = false,
                          cssUrl = css

                        if ( hasBlob && inline )
                            node = getInlineBlobNode(cssText, onsuccess, onerror),
                            inline = false // treated now as an external file
                        else if ( inline )
                            node = getInlineNode(cssText, oldIE)
                        else
                            node = getExternalNode(cssUrl, onsuccess, onerror)

                        self.node = node

                        new Usher(node, position.selector, position.type).then(function(){
                           if ( inline )
                              self.resolve()
                        }, function(){
                            self.reject()
                        })

                    }, 0)

                    if ( handler )
                      this.then(handler)
                }
              , resolve: function(){
                    this.status = 1
                    this.emit('promise.resolved', this.node)
                    return this
                }
              , reject: function(){
                    this.status = 0
                    this.emit('promise.rejected', this.node)
                    return this
                }
            }
        })


      , Script = data.Script = new Klass(Promise, function(_){


            function getInlineBlobScriptNode(script, onsuccess, onerror){
                var blob, blobUrl, URL = root.URL || root.webkitURL, node

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

            function getInlineScriptNode(script){
                var node = document.createElement('script')
                node.type = "text/javascript"
                node.innerHTML = script
                return node
            }

            function getExternalScriptNode(script, onsuccess, onerror){
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

            return {
                _construct: function(script, parameters, handler){
                    var self = this
                      , args = _.to.array(arguments)
                      , handler = _.is.fn(args[args.length-1]) && args.pop() || null
                      , script = args.shift()
                      , parameters = args.length && args[0] || {}

                    Promise.call(this)
                    this.node = null

                    setTimeout(function(){
                        var match, node, scriptText, scriptUrl, inline=false, URL, hasBlob
                          , onsuccess = function(){ self.resolve() }
                          , onerror = function(){ self.reject() }
                          , position = (parameters.position && parameters.position.selector) && parameters.position || {
                                selector: head || document.head
                              , type: 1 //append
                            }
                        URL = root.URL || root.webkitURL
                        hasBlob = (root.Blob && URL.createObjectURL ) && true || false

                        if ( match = script.match(rscript), match )
                            scriptText = match[2],
                            inline = true
                        else
                            scriptUrl = script

                        if ( hasBlob && inline )
                          node = getInlineBlobScriptNode(scriptText, onsuccess, onerror),
                          inline = false
                        else if ( inline )
                          node = getInlineScriptNode(scriptText)
                        else
                          node = getExternalScriptNode(scriptUrl, onsuccess, onerror)

                        self.node = node

                        new Usher(node, position.selector, position.type).then(function(){
                           if ( inline )
                              self.resolve()
                        }, function(){
                            //self.reject()
                        })
                    }, 0)

                    if ( handler )
                      this.then(handler)
                }
              , resolve: function(){
                    this.status = 1
                    this.emit('promise.resolved', this.node)
                    return this
                }
              , reject: function(){
                    this.status = 0
                    this.emit('promise.rejected', this.node)
                    return this
                }
            }
        })

      , IMG = new Klass(Promise, function(_){

            function getInlineImgNode(img){
                var node = new Image
                node.src = img
                return node
            }

            function getInlineBlobImgNode(img, type, onsuccess, onerror){
                var node, blob, bloburl
                blob = new Blob([script], {"type": type})
                blobUrl = URL.createObjectURL(blob)
                node = new Image
                node.onload = onsuccess
                node.onerror = onerror
                node.src = blobUrl
                return node
            }

            function getExternalImgNode(img, onsuccess, onerror){
                var node = new Image
                node.onload = onsuccess
                node.onerror = onerror
                node.src = img
                return node
            }


            return {
                _construct: function(image, parameters, handler){
                    var self = this
                      , args = _.to.array(arguments)
                      , handler = _.is.fn(args[args.length-1]) && args.pop() || null
                      , image = args.shift()
                      , parameters = args.length && args[0] || {}

                    setTimeout(function(){
                        var match, inline=false, hasBlob=false, URL, node
                          , onsuccess = function(){ self.resolve() }
                          , onerror = function(){ self.reject() }
                          , position = (parameters.position && parameters.position.selector) && parameters.position || {
                              selector: head || document.head
                            , type: 1 //append
                          }

                        URL = root.URL || root.webkitURL
                        hasBlob = (root.Blob && URL.createObjectURL ) && true || false

                        if ( match = image.match('rbase64'), match )
                            imgSRC = "data:"+image,
                            imgType = match[2],
                            inline = true
                        else
                            imgSRC = image

                        if ( inline & hasBlob )
                          node = getInlineBlobImgNode(imgSRC, imgType, onsuccess, onerror),
                          inline = false
                        else if ( inline )
                          node = getInlineImgNode(imgSRC)
                        else
                          node = getExternalImgNode(imgSRC, onsuccess, onerror)

                        self.node = node

                        // todo, manage how images are handled
                        //new Usher(node, position.selection, position.type).then(function(){
                           if ( inline )
                              self.resolve()
                        //})
                    }, 0)

                    if ( handler )
                      this.then(handler)
                }
              , resolve: function(){
                    this.status = 1
                    this.emit('promise.resolved', this.node)
                    return this
                }
              , reject: function(){
                    this.status = 0
                    this.emit('promise.rejected', this.node)
                    return this
                }
            }
        })

      , ResourceLoader = core.ResourceLoader = new Klass(Deferrer, function(_){

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
                      case "css":
                            if  ( o.parameters )
                              promise =  new CSS(o.value, o.parameters)
                          promise = new CSS(o.value)
                      case "img":
                          if  ( o.parameters )
                            promise =  new IMG(o.value, o.parameters)
                          promise = new IMG(o.value)
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


            var resourceList = this.resourceList = new VariableSet

            return {
                _construct: function(){
                      Deferrer.call(this)

                      var self = this
                        , promises = _.is.array( arguments[0] ) && arguments[0] || _.to.array(arguments)

                      for ( var i=0, l=promises.length; i<l; i++ )
                        this.promises[i] = defineResourceType( promises[i] ),
                        (function(promise){
                            setTimeout(function(){
                                promise.then(function(){
                                    self.promises.resolvable++
                                    self.onprogress()
                                }, function(){
                                    self.promises.unresolvable++
                                    self.onprogress()
                                })
                            }, 0)
                        }(this.promises[i]))

                      if ( !arguments.length )
                        setTimeout(function(){
                            self.resolve()
                        }, 0)
                }
            }
        })

      , ConditionSet = core.ConditionSet = new Klass(Deferrer, function(_){

            var Filter = new Klass(Promise, function(_){

                    var filters = {
                             0: "customfnFilter"
                  /*text*/ , 1: "match", 2: "contains", 3: "startswith", 4: "endswith", 5: "regexp"
               /*numeric*/ , 6: "equal", 7: "greater", 8: "lesser", 9: "greaterOrEqual", 10: "lesserOrEqual"
                         }

                    return {
                        _construct: function(params){
                            Promise.call(this)
                            if ( _.is.fn(arguments[0]) )
                              console.log()
                            else if ( !_.is.object(params) || !params.type || !params.pattern || !params.varaiable || !params.value )
                              this.reject()

                        }
                      , customfn: function(){

                        }
                      , customfnFilter: function(){

                        }
                      , match: function(){

                        }
                      , contains: function(){

                        }
                      , startswith: function(){

                        }
                      , endswith: function(){

                        }
                      , regexp: function(){

                        }
                      , equal: function(){

                        }
                      , greater: function(){

                        }
                      , lesser: function(){

                        }
                      , greaterOrEqual: function(){

                        }
                      , lesserOrEqual: function(){

                        }
                    }
                })

            return {
                _construct: function(){
                    Deferrer.call(this)
                    var self = this
                      , filterList, customfn

                    filterList = _.is.array(arguments[0]) && arguments[0] || _.to.array(arguments)

                    for ( var i=0,l=filterList.length; i<l; i++ )
                        (function(promise){
                            setTimeout(function(){
                                promise.then(function(){
                                    self.promises.resolvable++
                                    self.onprogress()
                                }, function(){
                                    self.promises.unresolvable++
                                    self.onprogress()
                                })
                            }, 0)
                        }(this.promises[i]))

                        if (!arguments.length)
                          setTimeout(function(){
                              self.resolve()
                          }, 0)
                }
            }
        })

      , deviceMask = env.device = new Klass(VariableSet, function(){ //singleton

            var retina = ( root.devicePixelRatio || 1 ) >= 1.5


            return {
                _construct: function(){
                    VariableSet.call(this)

                    this.set('retina', retina)
                    this.set('hidpi', retina)
                }
            }
        }, true)

      , browserMask = env.browser = new Klass(VariableSet, function(){ //singleton

            return {
                _construct: function(){
                    VariableSet.call(this)
                }
            }
        }, true)

      , urlMask = env.url = new Klass(VariableSet, function(){ //singleton

            return {
                _construct: function(){
                    VariableSet.call(this)
                }
            }
        }, true)

      , cookieMask = env.cookie = new Klass(VariableSet, function(){ //singleton

            return {
                _construct: function(){
                    VariableSet.call(this)
                }
            }
        }, true)

      , domReadyListener = new Klass(EventEmitter, function(){ //singleton
            return {
                _construct: function(){
                    EventEmitter.call(this)
                    domReady = 0
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

            var noop = function(){}
              , sleipnir = function(){
                    if ( !arguments.length ) return ns

                    var args = _.to.array(arguments)
                      , wait = _.is.boolean( args[args.length-1] ) && !args.pop() || true
                      , handler = _.is.fn( args[args.length-1] ) && args.pop() || noop
                      , dependencies = args

                    if ( dependencies.length )
                      return new ResourceLoader(dependencies).then(function(){
                          sleipnir(handler, wait)
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


/*

*/