(function(root, $){ "use strict"
    var
        reference = "AnalyticsBy55"
      , ns = root[reference]
        
      , document = root.document
      , navigator = root.navigator
        
      , performance = root.performance
      , domLoading = performance ? performance.timing.domLoading : + new Date
      
      , docElt, head, body
      
      , controllers = {}
      , models = {}
      , views = {}
    
    /* internal logger */
    controllers.Logger = $.singleton($.EventEmitter, {})
    
    /* piloting bug/history reports */
    controllers.Reporter = $.singleton($.EventEmitter, {})
    models.Reporter = $.class($.Model, {
        _hooks: {
            value: {}
        }
    })
    
    /* */
    controllers.UAReady = $.singleton($.Promise, {
        constructor: {
            value: function(){
                var self = this
                  , main = function(){
                        var ua, spoofedua, queue
                        
                        if ( self.status === 1 )
                          return
                        
                        if ( !ns.r )
                          return setTimeout(main, 16)
                        
                        ua = ns.ua
                        queue = ns.q
                        delete root[reference]
                        
                        self.resolve(+(new Date), ua, queue)
                    }
                
                if ( ns )
                  main()
            }
        }
    })
    
    /* domReady management */
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
    
    /* piloting storage */
    controllers.Store = $.class($.EventEmitter, {})
    models.Store = $.class($.Model, {
        _hooks: {
            value: {}
        }
    })
    
    /* piloting cookies */
    controllers.Cookie = $.class($.EventEmitter, {})
    models.Cookie = $.class($.Model, {
        _hooks: {
            value: {}
        }
    })
    
    /* resource loading */
    controllers.Resource = (function(){
        var Resource = $.class($.EventEmitter, {})
          , Script = Resource.Script = $.class(Resource, {})
          , Stylesheet = Resource.Stylesheet = $.class(Resource, {})
          , Image = Resource.Image = $.class(Resource, {})
        
        return Resource
    }())
    
    /* piloting GA trackers */
    controllers.Tracker = $.class($.EventEmitter, {})
    models.Tracker = $.class($.Model, {
        _hooks: {
            value: {}
        }
    })
    
    /* piloting GTM dataLayer */
    controllers.DataLayer = $.class($.EventEmitter, {})
    models.DataLayer = $.class($.Model, {
        _hooks: {
            value: {}
        }
    })
    
    /* piloting options of the cathedral */
    controllers.Config = $.singleton($.EventEmitter, {})
    models.Config = $.class($.Model, {
        _hooks: {
            value: {}
        }
    })
    
    /* */
    controllers.Cathedral = $.singleton($.EventEmitter, {
        constructor: {
            value: function(){
                var self = this
                  , ua = new controllers.UAReady
                  , spoofedua
                ua.then(function(ts, ua, queue){
                    root[root['GoogleAnalyticsObject']] = spoofedua = function(){
                        console.log('spy', arguments)
                        
                        return ua.apply(root, arguments)
                    }
                    
                    ns = root[reference] = self
                    
                    while ( queue.length )
                      spoofedua.apply(root, queue.shift())
                })
            }
        }
    })
    
    
    new controllers.Cathedral
}(window, sleipnir))


/*
(function(root, $){
    var 
        slice = (function(){
            var slice = Array.prototype.slice
            return function(o, i){
                return slice.call(o, i)
            }
        }())
      , isArray = Array.isArray
      
      , config = new $.Model
      
      , appRouter = new $.Router({
            "function": function(next, command, args){
                return command.apply(null, args)
            }
          , "string": function(next, command, args){
                if ( args[0] && args[0].constructor === Object )
                  return (function(o){
                      var k, i, l, args
                      for ( i = 0, k = Object.keys(o), l = k.length; i<l; i++ )
                        args = isArray(o[k[i]]) ? [k[i]].concat(o[k[i]]) : [k[i], o[k[i]]],
                        serviceRouter.dispatch( command, args )
                  }(args[0]))
                else
                  return serviceRouter.dispatch(command, args)
            }
        }, function(route, command, args){
            if ( typeof command == route )
              return true
        })
        
      , serviceRouter = new $.Router({
            "config": function(next, command, args){
                if ( !args.length )
                  throw new TypeError("no arguments passed")
                
                if ( args[0] && args[0].constructor === Object )
                  return (function(o){
                      var k, i, l, key, args
                      for ( i = 0, k = Object.keys(o), l = k.length; i<l; i++ )
                        args = isArray(o[k[i]]) ? o[k[i]] : [o[k[i]]],
                        configRouter.dispatch( args.shift(), args )
                  }(args[0]))
                else
                  return configRouter.dispatch( args.shift(), args ) 
            }
        }, function(route, command, args){
            if ( command === route )
              return true
        })
      
      , configRouter = new $.Router({
            "string": function(next, command, args){
                config.set(command, args[0])
            }
        }, function(route, command, args){
            if ( typeof command == route )
              return true 
        })
        
      , proxy = function(){
            var command = arguments[0]
              , args = slice(arguments, 1)
            
            return appRouter.dispatch(command, args)
        }
      
    config.once('change>socialTracking', function(v){
        if ( v === true )
          console.log('socialTracking is engaged')
    })
    
    config.once('change>scrollTracking', function(v){
        if ( v === true )
          console.log('scrollTracking is engaged')
    })
    
    root.protocat = proxy
}(window, sleipnir))

*/