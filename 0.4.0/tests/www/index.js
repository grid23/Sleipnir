(function(root, $){ "use strict"
    var
        document = root.document
      , domLoading = root.performance ? root.performance.timing.domLoading : + new Date
      , docElt, head, body
      
      , controllers = {}
      , models = {}
      , views = {}
    
    controllers.Device = $.singleton($.EventEmitter, {
        constructor: {
            value: function(){
                var model = this.model = new models.Device
                
                model.pipe("device", this)
            }
        }
    })
    models.Device = $.class($.Model, {
        _hooks: { value: {} }
    })
    
    controllers.DomReady = $.singleton($.Promise, {
        constructor: {
            value : function(){
                var self = this
                  , main = function(){
                        if ( self.status === 1 )
                              return
                        
                        docElt = document.documentElement
                        head = document.head || document.getElementsByTagName('head')[0]
                        body = document.body || document.getElementsByTagName('body')[0]
                        
                        self.resolve( +(new Date) )
                    }
                
                if ( document.readyState ) {
                  if ( document.readyState == "complete" )
                    return main()
                } else setTimeout(main, 0)
                
                root.addEventListener('DOMContentLoaded', main)
                root.addEventListener('load', main)
                document.addEventListener('readystatechange', function(){
                  if ( document.readyState == "complete" )
                    main()
                })
            }
        }
    })
    
    controllers.Logger = $.singleton($.EventEmitter, function(){
        function Log(type, value){
            this.type = type
            this.value = value
            this.timestamp = + new Date
        }
        
        return {
            constructor: {
                value: function(){
                    Object.defineProperties(this, {
                        "_console": { value: (function(){
                            var noop = function(){}
                            
                            try {
                                console.log("")
                            } catch(e){
                                return { log: noop, error: noop, debug: noop }
                            }
                            return console
                        }()) }
                      , "_history": { value: [] }
                    })
                }
            }
          , _console: { configurable: true, value: null }  
          
          , _history: { configurable: true, value: null }
          , history: { enumerable: true,
                get: function(){
                    return [].concat(this._history)
                }
            }
          
          , log: { enumerable: true,
                value: function(){
                    this._history.push( new Log("log", arguments) )
                    this._console.log.apply(null, arguments)
                    return this
                }
            }
          , info: { enumerable: true,
                value: function(){
                    this._history.push( new Log("info", arguments) )
                    return this
                }
            }
          , list: { enumerable: true, 
                value: function(start, handler){
                    var self = this
                      , start = typeof start == "number" ? start : 0
                      , handler = typeof arguments[arguments.length-1] == "function" ? arguments[arguments.length-1] : function(i, l){ self._console[l.type].apply(root, l.value) }
                      , history = start ? this.history.splice(start) : this.history
                      , iterator = new $.Iterator(history, function(e){}), ite
                    
                    while ( ite = iterator.next() )
                      handler.apply(null, ite)
                    
                    return this
                }
            }
        }
    })
    
    controllers.Stylesheets = $.singleton($.EventEmitter, function(){
        return {
          
        }
    })
    
    controllers.Viewport = $.singleton($.EventEmitter, function(){
        return {
            constructor: function(){
                var model = this.model = new models.Viewport
                
                model.pipe("viewport", this)
            }
        }
    })
    models.Viewport = $.class($.Model, {
        _hooks: { value: {} }
    })
    
    controllers.App = $.singleton($.EventEmitter, {
        channels: { enumerable: true, value: {} }
      , device: { enumerable: true, value: new controllers.Device }
      , domReady: { enumerable: true, value: new controllers.DomReady }
      , logger: { enumerable: true, value: new controllers.Logger }
      , routers: { enumerable: true, value: {} }
      , viewport: { enumerable: true, value: new controllers.Viewport }
    })
    
    controllers.App.controllers = controllers
    controllers.App.models = models
    controllers.App.views = views
    
    root.Saddle = controllers.App
}(window, sleipnir))