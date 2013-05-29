(function(root, document, $){ "use strict"

    var ns = {}
      , version = ns.version = "0.0.a01"

      , domReady = ns.ready = $.Promise.create()
      , docHead = null
      , docElt = null
      , docBody = null


      , browser = {
            hasBlob: (function(){
                var blob, src

                try {
                  blob = Blob([""], {type: "text/plain"})
                  src = URL.createObjectURL(blob)
                  URL.revokeObjectURL(src)
                } catch(e){
                  return false
                }

                return true
            }())
        }

      , addEventListener = ns.addEventListener = (function(){
            if ( window.addEventListener )
                return function(el, ev, fn, c){
                    return el.addEventListener(ev, fn, !!c)
                }
            return function(el, ev, fn){
                return el.attachEvent('on'+ev, function(e){
                    var e = e || window.event
                    e.target = e.target || e.srcElement
                    e.relatedTarget = e.relatedTarget || e.fromElement || e.toElement
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
      , removeEventListener = ns.removeEventListener = (function(){
            if ( window.removeEventListener)
              return function(el, ev, fn, c){
                  return el.removeEventListener(ev, fn, !!c)
              }
            return function(el, ev, fn){
                el.detachEvent(ev, fn)
            }
        }())

      , NodeExpression = ns.NodeExpression = (function(){
            var rrepeat = /(?![\{\[])\*(?![\]\}])/
              , rvars = /{{([\w\.]*)}}/g
              , operators = {
                "^": function type(stream, pile, node, handlers){
                    node(pile.splice(0, pile.length).join(""))
                }
              , "#": function id(stream, pile, node, handlers){
                    var id = pile.splice(0, pile.length).join("")
                    handlers.push(function(node){
                        node.id = id
                    })
                }
              , ".": function classname(stream, pile, node, handlers){
                    var classname = pile.splice(0, pile.length).join("")
                    handlers.push(function(node){
                        var curr = node.className

                        if ( !curr.length) {
                          node.className = classname
                        } else {
                          node.className += " "+classname
                        }
                    })
                }
              , "]": function attribute(stream, pile, node, handlers){
                    var attrStr = capture('[', ']', stream, [], 0)
                      , idx = attrStr.search("=")
                      , key = attrStr.split("=")[0]
                      , value = attrStr.slice(idx+1).replace(/"|'/g, "")

                    handlers.push(function(node){
                        node.setAttribute(key, value)
                    })
                }
              , "}": function textcontent(stream, pile, node, handlers){
                    var content = capture('{', '}', stream, [], 0)
                      , textNode = document.createTextNode("")

                    handlers.push(function(node, view, data){

                        if ( node.nodeType === 3 || !node.tagName)
                          textContent(content, node, view, data)
                        else
                          textContent(content, textNode, view, data),
                          node.appendChild(textNode)
                    })
                }
              , "$": function assignement(stream, pile, node, handlers){
                    var ref = pile.splice(0, pile.length).join("")
                      , view = this

                    if ( view && view._isView )
                      handlers.push(function(node){
                        if ( !view._elements[ref] )
                          view._elements[ref] = node
                        else
                          if ( isArray(view._elements[ref]) )
                            view._elements[ref].push(node)
                          else
                            view._elements[ref] = [view._elements[ref], node]
                    })
                }
            }

            function textContent(text, node, view, data){
                var str = text
                  , hit, vars = []
                  , iterator, ite, i, l
                  , _var

                while ( hit = rvars.exec(str), hit )
                  if ( !~$.indexOf(vars, hit[1]) )
                    vars.push(hit[1])

                if ( vars.length ) {
                    data.once("update", function(keys){
                        var i, l, hit

                        if ( !node ) return

                        for ( i = 0, l = keys.length; i<l; i++ )
                          if ( !!~$.indexOf(vars, keys[i]) ) {
                            hit = true
                            break
                          }

                        if ( hit )
                          setTimeout(function(){
                            textContent(text, node, view, data)
                          }, 0)
                    })

                  for ( iterator = new $.Iterator(vars), ite = iterator.enumerate(), i = 0, l = ite.length; i < l; i++ )
                    _var = ite[i][1],
                    str = str.replace("{{"+_var+"}}", data.get(_var) || "{{"+_var+"}}")

                  }

                  node.nodeValue = str
            }

            function capture(cchar, ochar, stream, buffer, ignore){
                var ite = stream.next()
                  , operand = ite[1]

                if ( operand === ochar )
                  ignore += 1

                if ( operand === cchar )
                  if ( !ignore )
                    return buffer.join("")
                  else
                    ignore -= 1

                buffer.unshift(operand)
                return $.invoke(capture, [cchar, ochar, stream, buffer, ignore])
            }

            function read(stream, pile, node, handlers){
                var ite = stream.next()
                  , operand = ite[1]

                if ( operators.hasOwnProperty(operand) )
                  $.invoke(operators[operand], arguments, this)
                else
                  pile.unshift(operand)

                return $.invoke(read, arguments, this)
            }

            return {
                parse: function(expression, o, forcedata){
                    var root
                      , view = o && o._isView ? o : null
                      , data = forcedata ? forcedata : view  ? view._data : o && (o._isCollection || o._isModel) ? o : new $.Model(o||{})
                      , r, m, i, l
                      , buffer, expr = []
                      , stream, pile = []
                      , handlers = []
                      , _node, node = function(type){
                            if ( type )
                              if ( _node )
                                throw new TypeError("node already defined")
                              else
                                _node = type !== "text" ? document.createElement(type) : document.createTextNode("")
                            return _node
                        }

                    if ( r = rrepeat.exec(expression), r && data._isCollection ) { 
                      root = document.createDocumentFragment()
                      buffer = expression.slice(0, r.index)
                      expression = buffer + expression.slice(r.index+1)
                      for ( i = 0, m = data.models(), l = m.length; i<l; i++ )
                        root.appendChild( NodeExpression.parse(expression, view, m[i]) )

                      return root
                    }

                    try {
                        buffer = ("^"+expression).split("")

                        while ( buffer.length )
                          expr.push(buffer.pop())

                        stream = new $.Iterator(expr)

                        $.invoke(read, [stream, pile, node, handlers], view)
                    } catch( err ){
                        if ( !(err instanceof $.errors.StopIterationError) )
                          if ( view )
                            view.emit("error", err)
                          else
                            throw err
                    }

                    if ( handlers.length )
                      for ( i = 0, l = handlers.length; i<l; i++ )
                        $.invoke(handlers[i], [_node, view, data])

                    return _node
                }
            }
        }())

      , HTMLExpression = ns.HTMLExpression = (function(){
            var operators = {
                    "+": function sibling(stream, pile, context){
                        var expression = pile.length ? pile.splice(0, pile.length).join("") : ""
                          , node

                        if ( expression )
                          node = NodeExpression.parse(expression, this),
                          context().appendChild(node)
                    }
                  , ">": function parent(stream, pile, context){
                        var expression = pile.length ? pile.splice(0, pile.length).join("") : ""
                          , node = NodeExpression.parse(expression, this)
                        context().appendChild(node)
                        context(node)
                    }
                  , "(": function group(stream, pile, context){
                        var expression = capture(")", "(", stream, [], 0)
                        context().appendChild( HTMLExpression.parse(expression, this) )
                    }
                  , "[": function skipAttributes(stream, pile, context){
                        pile.push("[")
                        $.invoke(skip, ["]", "[", stream, pile, 0])
                    }
                  , "{": function skipText(stream, pile, context){
                        pile.push("{")
                        $.invoke(skip, ["}", "{", stream, pile, 0])
                    }
                }

            function read(stream, pile, context){
                var ite = stream.next()
                  , operand = ite[1]

                if ( operators.hasOwnProperty(operand) )
                  $.invoke(operators[operand], arguments, this)
                else
                  pile.push(operand)

                return $.invoke(read, arguments, this)
            }

            function skip(cchar, ochar, stream, pile, ignore){
                var ite = stream.next()
                  , operand = ite[1]

                pile.push(operand)

                if ( operand === ochar )
                  ignore += 1

                if ( operand === cchar )
                  if ( !ignore )
                    return
                  else
                    ignore -= 1

                return $.invoke(skip, [cchar, ochar, stream, pile, ignore])
            }

            function capture(cchar, ochar, stream, buffer, ignore){
                var ite = stream.next()
                  , operand = ite[1]

                if ( operand === ochar )
                  ignore += 1

                if ( operand === cchar )
                  if ( !ignore )
                    return buffer.join("")
                  else
                    ignore -= 1

                buffer.push(operand)
                return $.invoke(capture, [cchar, ochar, stream, buffer, ignore])
            }

            return {
                parse: function(expression, o){
                    var root = document.createDocumentFragment()
                      , view = o && o._isView ? o : null
                      , data = view ? view._data : o && (o._isModel || o._isCollection) ? o : new $.Model(o||{})
                      , parent = root
                      , context = function(node){
                            if ( node )
                              parent = node
                            return parent
                        }
                      , pile = []
                      , stream = new $.Iterator( (expression+"+").split("") )

                    try {
                      $.invoke(read, [stream, pile, context], view||data)
                    } catch ( err ){
                        if ( !(err instanceof $.errors.StopIterationError) )
                          if ( view )
                            view.emit("error", err)
                          else
                            throw err
                    }

                    return root
                }
            }
        }())

      , View = ns.View = $.klass($.EventEmitter, {
            _isView: true
          , constructor: function(template, data){
                this._template = typeof template == "string" ? template : ""
                this._data = data && ( data._isModel || data._isCollection ) ? data : new this._Model(data||{})
                this._elements = {}
                this._fragment = HTMLExpression.parse(this._template, this)

                if ( this._DOMEvents )
                  this.DOMEvent(this._DOMEvents)
            }
          , _Model: $.Model
          , model: function(_Model){
                var test = new $._model

                if ( test._isModel )
                  this._Model = _Model

                return this
            }
          , _fragmentStatus: 1
          , html: function(){
                if ( !this._fragmentStatus )
                  this.emit("error", new Error("template fragment already requested"))

                this._fragmentStatus = 0
                return this._fragment
            }
          , clone: function(){
                var view = new View(this._template, this._data)
                return view
            }
          , element: function(name){
                return $.isArray(this._elements[name]) ? [].concat(this._elements[name]) : this._elements[name]
            }
          , DOMEvent: function(eltRef, event, handler, capture){
                var view = this
                  , elt, k, c

                if ( arguments.length <= 2 && eltRef && eltRef.constructor === Object ) {
                  c = !!arguments[1]
                  for ( k in eltRef )
                    (function(eltRef, events){
                        var k
                        for (k in events)
                          view.DOMEvent(eltRef, k, events[k], c)
                    }(k, eltRef[k]))
                }
                else
                  if ( elt = view.element(eltRef), elt )
                    (function(elt, handler, view){
                        var events = event.split(" ")
                          , i = 0, l = events.length

                        for ( ; i < l; i++ )
                          addEventListener(elt, events[i], function(e){
                              $.invoke(handler, [e, view], view)
                          }, !!capture)
                    }(elt, handler, view))

                return view
            }
        })

      , Style = ns.StyleSheet = $.Promise.extend(function(Super){

            var rcsssplit = /^([^{]*){(.*)(?=})/
              , mode = (function(){
                    var node

                    if ( browser.hasBlob )
                      return 0x1
                    else {
                        try {
                            node = document.createElement('style')
                            node.innerText = node.textContent = node.textContent = ""
                            node = null
                        } catch(e) {
                            return 0x4
                        }
                        return 0x2
                    }
                }())

            return {
                constructor: function(expression, rules, handler){
                    var sheet = this
                      , expression = expression || ""
                      , rules = rules || []
                      , node, blob, src
                      , onload = function(){
                            sheet._sheet = node.sheet
                            sheet._sheetstatus = 1
                            sheet.resolve(sheet, node)
                        }

                    $.invoke(Super, [], this)

                    if ( mode === 0x1 )
                      blob = Blob(rules, {type: "text/css"}),
                      src = URL.createObjectURL(blob),
                      node = this.node = NodeExpression.parse("link"+expression),
                      node.rel = "stylesheet",
                      node.addEventListener("load", onload),
                      node.href = src
                    else if ( mode === 0x2 )
                      node = this.node = NodeExpression.parse("style"+expression),
                      node.innerText = node.textContent = rules.join('\n\r')
                    else if ( mode === 0x4 )
                      document.createStyleSheet(),
                      node = { sheet: document.styleSheets[document.styleSheets.length-1] },
                      node.sheet.cssText = rules.join('')

                    if ( handler )
                      sheet.then(function(sheet, node){
                          $.invoke(handler, [sheet, node], sheet)
                      })

                    if ( mode !== 0x4 )
                      domReady.then(function(){
                          docHead.appendChild(node)
                      })

                    if ( mode !== 0x1 )
                      setTimeout(onload, 0)
                }
              , _sheetstatus: 0
              , set: function(key, selector, cssText){
                    var sheet = this
                      , stylesheet = sheet._sheet
                      , rules = sheet._rules = sheet._rules || {}
                      , hasRule = rules.hasOwnProperty(key) ? true : false
                      , idx = hasRule ? rules[key] : (stylesheet.cssRules||stylesheet.rules).length
                      , cssText = cssText || ""

                    if ( mode !== 0x4 )
                        hasRule ? stylesheet.deleteRule(idx) : rules[key] = idx,
                        stylesheet.insertRule(selector + "{" + cssText +"}", idx)
                    else
                        hasRule ? stylesheet.removeRule(idx) : rules[key] = idx,
                        stylesheet.addRule(selector, cssText, idx)

                    return sheet
                }
              , get: function(key){
                    var sheet = this
                      , stylesheet = sheet._sheet
                      , rules = sheet._rules || {}

                    if ( rules.hasOwnProperty(key) )
                      return (stylesheet.cssRules||stylesheet.rules)[rules[key]].style
                }
              , rule: function(rule, selector, cssText){
                    var sheet = this, k

                    if ( arguments.length == 1)
                      if ( rule && rule.constructor === Object ) {
                        for ( k in rule )
                          sheet.set(k, rule[k])
                        return
                      } else return sheet.get(rule)

                    sheet.set(rule, selector, cssText)
                    return sheet.get(rule)
                }
            }
        })

      , Transition = ns.Transition = $.klass($.EventEmitter, function(Super, statics){

            var transitionStyleSheet = statics.styleSheet = new Style("#sleipFX-transitions"),
                CSSTransition = statics.CSSTransition = "getComputedStyle" in root  && "DOMStringMap" in root && "TransitionEvent" in root ? 0x1 : "WebKitTransitionEvent" in root ? 0x2 : 0,
                transitionCssProperty = statics.transitionCssProperty = CSSTransition & 0x1 ? "transition" : CSSTransition & 0x2 ? "-webkit-transition" : "",
                transitionEndEvent = statics.transitionEndEvent = CSSTransition & 0x1 ? "transitionend" : CSSTransition & 0x2 ? "webkitTransitionEnd" : "",
                gcs = !!root.getComputedStyle,
                testStyles = gcs ? root.getComputedStyle(document.createElement("div")) : document.documentElement.currentStyle,
                uid = 0

            statics.transitionShim = function(elt, properties, done){
                var transition = this
                  , elt, k


                for ( k in properties ) if ( properties.hasOwnProperty(k) )
                    elt.style[k] = properties[k]

                done()
            }

            return {
                constructor: function(){
                    var transition = this
                      , args = $.slice(arguments)
                      , _shim = transition._shim = typeof args[args.length-1] == "function" ? args.pop() : Transition.transitionShim
                      , _properties = transition._properties = transition._properties || []
                      , props, k
                      , name, selector, cssTextArr = [], cssText

                    transition._transits = {}

                    if ( args.length == 1 && args[0] && args[0].constructor === Object )
                      props = args[0]
                    else if ( args.length == 2 )
                      props = {},
                      props[args[0]] = args[1]

                    for ( k in props ) if ( props.hasOwnProperty(k) )
                      (function(prop, set){
                          var a

                          if ( (gcs ? testStyles.getPropertyValue(prop) : testStyles[prop] ) == undefined ){
                              delete props[prop]
                              return
                          }

                          a = [prop]

                          _properties.push(prop)

                          if ( typeof set == "number" )
                            a.push( set.toString()+"s" )
                          else if ( typeof set == "string" )
                            a = a.concat( set.split(" ") )
                          else if ( set && set.constructor === Object ){
                              a.push( (set.duration||0).toString() )
                              if ( set.hasOwnProperty("timingFunction") )
                                a.push( set.timingFunction )
                              if ( set.hasOwnProperty("delay") )
                                a.push( set.delay.toString() )
                          }

                          cssTextArr.push(a.join(" "))
                      }(k, props[k]))

                    name = transition.uid = "sleipFX-trans-"+(++uid)
                    selector = transition.cssSelector = "."+name
                    cssText = transition.cssText = transitionCssProperty + ":" + cssTextArr.join(", ")

                    transitionStyleSheet.then(function(sheet){
                        sheet.rule(name, selector, cssText)
                        transition.cssRule = sheet.rule(name)
                    })
                }
              , animate: (function(){
                    if ( !CSSTransition )
                      return function(elt, params, then){
                          var transition = this
                            , params = params || {}
                            , _attributes = transition._attributes || []
                            , shim = transition._shim
                            , promise = new $.Promise
                            , output = promise
                            , done = function(){
                                  setTimeout(function(){
                                      promise.resolve()
                                  }, 0)
                              }

                          if ( typeof params == "string" )
                            params = (function(str){
                                var params = {}
                                  , i = 0, l = _attributes.length

                                for ( ; i<l; i++ )
                                  params[_attributes[i]] =  str

                                return params
                            }(params))

                          if ( typeof then == "function" )
                            output = promise.then(then)

                          $.invoke( shim, [elt, params, done], transition )

                          return output
                      }

                    return function(elt, props, callback){
                        var transition = this
                          , elt = elt, props = props || {}
                          , transitId = +(new Date)
                          , computedStyle = root.getComputedStyle(elt)
                          , callback = callback
                          , promise = new $.Promise
                          , output = promise
                          , _properties = transition._properties || []
                          , propsAnimating = []
                          , k

                        if ( elt.dataset.transitId ) {
                            return transition._transits[elt.dataset.transitId].then(function(){
                                return $.invoke(transition.animate, [elt, props, callback], transition)
                            })
                        }

                        elt.dataset.transitId = transitId
                        transition._transits[transitId] = output

                        if ( !(elt instanceof Node) || elt.nodeType != 1 )
                          throw Error

                        if ( typeof props == "string" )
                          props = (function(str){
                              var props = {}
                                , i = 0, l = _properties.length

                              for ( ; i<l; i++ )
                                props[_properties[i]] = str

                              return props
                          }(props))

                        if ( typeof callback == "function" )
                            output = promise.then(callback)

                        for ( k in props ) if ( props.hasOwnProperty(k) )
                          if ( !!~$.indexOf(_properties, k) )
                            (function(prop){
                                var curr

                                if ( typeof computedStyle.getPropertyValue(prop) == "undefined" ) {
                                  delete props[k]
                                  return
                                }

                                curr = computedStyle.getPropertyValue(prop)
                                elt.style.setProperty(prop, props[prop]) 

                                if ( curr !== computedStyle.getPropertyValue(prop) )
                                  propsAnimating.push(prop)

                                elt.style.setProperty(prop, curr)
                            }(k))

                        setTimeout(function(){
                            var events = propsAnimating.length
                            elt.className += " "+transition.uid

                            setTimeout(function(){

                                addEventListener(elt, transitionEndEvent, function trans(e){
                                    if ( e.target !== elt )
                                      return

                                    if ( --events )
                                      return

                                    removeEventListener(elt, transitionEndEvent, trans)

                                    elt.className = elt.className.replace(" "+transition.uid, "")

                                    delete transition._transits[elt.dataset.transitId]
                                    delete elt.dataset.transitId

                                    setTimeout(function(){
                                        promise.resolve()
                                    }, 16)

                                })

                                for ( k in props ) if ( props.hasOwnProperty(k) )
                                  elt.style.setProperty(k, props[k])
                            }, 16)

                        }, 16)

                        return output
                    }


                    return function(elt, params, then){
                        var transition = this
                          , elt = elt || null
                          , params = params || {}
                          , promise = new $.Promise
                          , output = promise
                          , _attributes = transition._attributes || []
                          , k

                        if ( typeof params == "string" )
                          params = (function(str){
                              var params = {}
                                , i = 0, l = _attributes.length

                              for ( ; i<l; i++ )
                                params[_attributes[i]] = str

                              return params
                          }(params))

                        if ( typeof then == "function" )
                          output = promise.then(then)

                        elt.className += " "+transition.uid

                        setTimeout(function(){
                              var events = 0
                                , start = function(){
                                      events++
                                  }
                                , end = function(){
                                      events--

                                      if ( events > 0 )
                                        return

                                      removeEventListener(elt, transitionStartEvent, start)
                                      removeEventListener(elt, transitionEndEvent, end)

                                      elt.className = elt.className.replace(" "+transition.uid, "")

                                      setTimeout(function(){
                                          promise.resolve()
                                      }, 16)
                                  }

                              addEventListener(elt, transitionStartEvent, start)
                              addEventListener(elt, transitionEndEvent, end)

                              for ( k in params ) if ( params.hasOwnProperty(k) )
                                elt.style[k] = params[k]
                        }, 16)

                        return output
                    }
                }())
            }
        })


      , main = function(){
            if ( domReady.status() !== -1 )
              return

            docElt = document.documentElement
            docHead = document.getElementsByTagName("head")[0]
            docBody = document.getElementsByTagName("body")[0]

            domReady.resolve({
                documentElement: docElt
              , head: docHead
              , body: docBody
            })
        }

    $.dom = ns

    if ( document.readyState ){
      if ( document.readyState == "complete" )
        main()
    } else
      setTimeout(main, 0)

    addEventListener(window, "DOMContentLoaded", main)
    addEventListener(window, "load", main)
    addEventListener(document, "readystatechange", function(){
        if ( document.readyState === "complete" )
          main()
    })
}(window, document, sleipnir))
