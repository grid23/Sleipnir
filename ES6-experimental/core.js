(function(root){ "use strict"
    let ns = {}
      , version = ns.version = "ES6-0.5.alpha"
      
      , invoke = function(fn=function(){}, args=[], ctx=null){
            switch ( args.length ){
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
      
      , klass = ns.class = function(...args){
            let [descriptors, SuperClass] = [args.pop(), args[0]]
              , superPrototype = SuperClass ? SuperClass.prototype : {}
              
              , prototype = (function(){
                    if ( typeof descriptors == "function")
                      return descriptors(SuperClass)
                    return descriptors || {}
                }())
              
              , Class = prototype.hasOwnProperty('constructor') ? (function(){
                    let constructor = prototype.constructor
                    delete prototype.constructor
                    return constructor
                }()) : function(){}
              
              Object.defineProperties(Class, {
                  prototype: { value: Object.create(superPrototype, prototype) }
                , constructor: { value: Class }
              })
              
              Class.create = function(...args){
                  let F = klass(Class, {
                      constructor: function(){
                          return invoke(Class, args, this)
                      }
                  })
                  return new F
              }
              
              Class.extend = function(prototype={}){
                  return klass(Class, prototype)
              }
            
            return Class
        }
      
      , EventEmitter = ns.EventEmitter = klass({
            on: {
                value: function(type="", handler=function(){}){
                    let events = this._events || Object.defineProperty(this, "_events", { value: {} })._events
                      , handlers = events[type]
                    
                    if ( !handlers )
                      events[type] = handler
                    else
                      if ( typeof handlers == "function" )
                        events[type] = [handlers, handler]
                      else
                        handlers.push(handler)
                    
                    return this
                }
            }
          , off: {
                value: function(type="", handler=function(){}){
                    let events = this._events || {}
                      , handlers = events[type]
                      , idx
                    
                    if ( typeof handlers == "function" && handlers === handler )
                      delete events[type]
                    
                    if ( Array.isArray(handlers) )
                      while ( idx = handlers.indexOf(handler), !!~idx )
                        handlers.splice(idx, 1)
                    
                    return this
                }
            }
          , emit: {
                value: function(type="", ...args){
                    let events = this._events || {}
                      , handlers = events[type]
                    
                    if ( type == "error" && (args[0] instanceof Error) && !handlers )
                      throw args[0]
                    
                    if ( !handlers )
                      return
                    else
                      if ( typeof handlers == "function")
                        invoke(handlers, args)
                      else for ( let [i, fn] of Iterator(handlers) )
                        invoke(fn, args)
                    
                    return this
                }
            }
        })
      
      , Model = ns.Model = klass(EventEmitter, function(){
            function filiation(root, str, overwrite){
                let curr = root
                  , lvls = [k for (k of str.split("."))]
                  , child = lvls.pop()
                
                for ( let [i, k] of Iterator(lvls) )
                  if ( (curr[k] && curr[k].constructor === Object) || !!overwrite )
                    curr = curr[k] = curr[k] || {}
                  else 
                    return curr = {}, curr[child] = undefined, [curr, curr[child]]
                
                return [curr, child]
            }
            
            function output(o, ...args){
                let type = typeof o
                if ( !!~["string, number, boolean"].indexOf(type) )
                  return o
                else if ( type == "function" )
                  return secure(invoke(o, args, args[0]))
                else if ( o )
                  return JSON.parse(JSON.stringify(o))
            }
            
            return {
                constructor: function(...args){
                    let model = this
                    
                    for ( let [i, arg] of Iterator(args) )
                      invoke(Model.prototype.set, [arg], model)
                    
                    return model
                }
              , set: {
                    value: function(key, value){
                        let model = this
                          , data = model._data || Object.defineProperty(model, "_data", { writable: true, value: {} })._data
                          , parent, child
                        
                        if ( arguments.length == 1 ) {
                            if ( typeof key == "string" )
                              try { key = JSON.parse(key) }
                              catch(e){ model.emit('error', e) }
                            
                            for ( let [k, v] of Iterator(key) )
                                model.set(k, v)
                            return model
                        }
                        
                        if ( value && value.constructor === Object ) {
                            for ( let [k, v] of Iterator(value) )
                                model.set(key+'.'+k, v)
                            return model
                        }
                        
                        [parent, child] = filiation(data, key, true)
                        
                        parent.watch(child, function(k, ov, nv){
                            let hook = (this._hooks || {})[key]
                              , fv = output(hook ? invoke(hook, [nv], model) : nv, model, k, ov)
                            
                            if ( fv !== ov )
                              model.emit(key+':set', nv, ov),
                              model.emit('set', key, nv, ov)
                            
                            return fv
                        })
                        
                        parent[child] = value
                        
                        return model
                    }
                }
              , get: {
                    value: function(key){
                        let model = this
                          , data = model._data || {}
                          , [parent, child] = filiation(data, key, false)
                        
                        return output(parent[child], this)
                    }
                }
            }
        })
    
    root.sleipnir = ns
}(this))