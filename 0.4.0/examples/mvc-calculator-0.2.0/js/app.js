sleipnir(function(){
    var logger = sleipnir.core.klass(sleipnir.core.EventChanneler, function(_, supr){
      
            var logi = -1
            
            return {
                _construct: function(){
                    supr.call(this)
                    this.node = document.getElementById('app-log')
                    
                    this.on('log.msg', function(e, msg){
                        this.log(msg)
                    })
                    
                    this.log('<strong>This is an example of a 23.sleipnir calculator app written in a pure MVC fashion (the Math can and will go terribly wrong :-)</strong>')
                }
              , log: function(msg){
                    var self = this
                      , e = document.createElement('p')
                      , msg = "<strong>"+ (++logi) +"</strong> " + msg
                    
                    e.innerHTML = msg
                    
                    setTimeout(function(){
                        var p = self.node
                          , s = p.childNodes[0]
                        p.insertBefore(e, s)
                    }, 0)
                }
            }
        }, true)
    
    var CalcUIController = sleipnir.core.klass(sleipnir.core.EventChanneler, function(_, supr){
            
            var rnum = /[0-9.]/
              , operations = {
                    "add": function(o, n){ return (o+n)+'' }
                  , "substract": function(o, n){ return (o-n)+'' }
                  , "multiply": function(o, n){ return (o*n)+'' }
                  , "divide": function(o, n){ return (o/n)+'' }
                }
            
            return {
                _construct: function(node){
                    supr.call(this)
                    logger.pipe('log', this)
                    
                    this.emit('msg', "CalcUIController instance init...")
                    
                    var self = this
                    this.model = new CalcModel
                    this.view = new CalcView(node, this.model)
                    
                    for ( var i=0, l=this.view.operators.length; i<l; i++ )
                      self.emit('msg', "Operator \"" + this.view.operators[i].value + "\" events piped through calcUIController on channel 'operators'"),
                      this.pipe('operators', this.view.operators[i])
                    
                    this.on('operators.click', function(e, value){
                        self.emit('msg', "CalcUIController reacts on operators.click event, updates CalcModel")
                        self.update(value)
                    })
                }
              , update: function(value){
                    var curr = this.model.get('currDisplayed')
                      , op
                      
                    if ( value.match(rnum) )
                      return this.model.set('currDisplayed', (curr !== "0" && curr || '')+''+value)
                    
                    if ( value === "=" )
                      return this.calculate()
                    else if ( value === 'C')
                      return this.reset()
                    else if ( value === 'n')
                      return this.opposite()
                    
                    else if ( value === "+" )
                      op = "add"
                    else if ( value === '-' )
                      op = "substract"
                    else if ( value === '/' )
                      op = "divide"
                    else if ( value === '*' )
                      op = "multiply"
                      
                      this.model.set('savedValue', curr),
                      this.model.set('currDisplayed', "0"),
                      this.model.set('currOperation', op)
                      
                }
              , opposite: function(){
                    var curr = this.model.get('currDisplayed')
                    if ( curr.charAt(0) === "0" )
                      return
                    if ( curr.charAt(0) === "-" )
                      curr = curr.slice(1)
                    else
                      curr = '-'+curr
                    this.model.set('currDisplayed', curr)
                    
                }
              , reset: function(){
                    this.model.set('savedValue', "0")
                    this.model.set('currDisplayed', "0")
                    this.model.set('currOperation', "add")
                }
              , calculate: function(){
                    var saved = parseFloat(this.model.get('savedValue'))
                      , curr = parseFloat(this.model.get('currDisplayed'))
                      , operation = this.model.get('currOperation')
                      , result = operations[operation](saved, curr)
                    this.model.set('savedValue', curr)
                    this.model.set('currDisplayed', result)
                }
            }
        })
      
      , CalcModel = sleipnir.core.klass(sleipnir.data.Model, function(_, supr){
            return {
                _construct: function(){
                    supr.call(this)
                    logger.pipe('log', this)
                    
                    this.emit('msg', "Model instance created...")
                    
                    this.set('savedValue', "0")
                    this.set('currDisplayed', "0")
                    this.set('currOperation', "add")
                }
            }
        })
      
      , CalcView = sleipnir.core.klass(sleipnir.core.EventEmitter, function(_, supr){
        
            var keyListener = this.calcKeyListener = sleipnir.core.klass(sleipnir.core.EventEmitter, function(_, supr){
                    return {
                        _construct: function(){
                            supr.call(this)
                            logger.pipe('log', this)
                            
                            var self = this
                            window.addEventListener('keypress', function(e){
                                var key = e.which
                                if ( key === 13 ) key = 61
                                self.emit('keypress', e, key)
                            })
                        }
                    }
                }, true)
                
              , Displayer = this.CaclDisplayer = sleipnir.core.klass(sleipnir.core.EventEmitter, function(_, supr){
                    return {
                        _construct: function(node){
                            supr.call(this)
                            logger.pipe('log', this)
                            
                            this.emit('msg', "CalcView.CalcDisplayer instance created...")
                            
                            var self = this
                            this.node = node
                            this.update("0")
                        }
                      , update: function(val){
                          this.emit('msg', "CalcView.CalcDisplayer updates its content...")
                          this.node.textContent = val
                      }
                    }
                })
                
              , Operator = this.CalcOperator = sleipnir.core.klass(sleipnir.core.EventEmitter, function(_, supr){
                    return {
                        _construct: function(node){
                            supr.call(this)
                            logger.pipe('log', this)
                            
                            var self = this
                            this.node = node
                            this.value = node.getAttribute('data-operator')
                            this.keyCode = this.value.charCodeAt(0)
                            
                            this.emit('msg', "CalcView.CalcOperator instance created for \"" + this.value + "\"...")
                            
                            keyListener.on('keypress', function(e, key){
                                if ( key !== self.keyCode )
                                  return
                                e.preventDefault()
                                self.emit('msg', "Operator \""+ self.value +"\" sends a click event")
                                self.emit('click', self.value)  
                            })
                            
                            node.addEventListener('click', function(e){
                                self.emit('msg', "Operator \""+ self.value +"\" sends a click event")
                                self.emit('click', self.value)
                            })
                        }
                    }
                })
            
            return {
                _construct: function(node, model){
                    supr.call(this)
                    logger.pipe('log', this)
                    
                    this.emit('msg', "CalcView instance created...")
                    
                    var self = this
                    this.node = node
                    this.model = model
                    
                    this.displayer = new Displayer(node.getElementsByClassName('calc-displayer')[0])
                    
                    this.operators = []
                    for ( var i=0, op=node.getElementsByClassName('calc-operator'), l=op.length; i<l; i++ )
                      this.operators.push( new Operator(op[i]) ),
                      (function(operator){
                          operator.on('click', function(){
                              self.emit('msg', "CalcView reacts on click event, toggle css class")
                              var classes = operator.node.classList
                              if ( !classes.contains("pressed") )
                                classes.add('pressed'),
                                setTimeout(function(){
                                    operator.node.classList.remove('pressed')
                                }, 100)
                          })
                      }(this.operators[i]))
                    
                    this.model.on('currDisplayed.change', function(val){
                        self.emit('msg', "CalcView detects a CalcModel change, call CalcView.CalcDisplayer for an update.")
                        self.displayer.update(val)
                    })
                }
              , timer: null
            }
        })
  
    sleipnir(function(){
        var calcs = document.getElementsByClassName('calc-app')
        for ( var i=0, l=calcs.length; i<l; i++ )
          new CalcUIController(calcs[i])
    })
}, false)