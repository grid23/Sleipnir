sleipnir(function(err, _){ "use strict"      
      var eventBus = new sleipnir.core.EventChanneler
        
        , Broadcaster = sleipnir.core.Klass(sleipnir.core.EventEmitter, function(){
              
              var currTXT = ""
              eventBus.on('myapp.type', function(e, txt){
                  currTXT = txt
              })
              
              return {
                  _construct: function(){
                      sleipnir.core.EventEmitter.call(this)
                      
                      var self = this
                      this.node = document.createElement('input')
                      
                      this.node.type = "text"
                      this.node.placeholder = "type here..."
                      this.node.value = currTXT
                      this.node.classList.add('broadcaster')
                      
                      eventBus.pipe('myapp', this)
                      
                      this.node.addEventListener('keyup', function(){
                          setTimeout(function(){
                              self.onkeyup()
                          },0)
                      })
                      
                      eventBus.on('myapp.type', function(e, txt){
                          if ( e.source !== self )
                            self.ontype()
                      })
                  }
                , timer: null
                , onkeyup: function(){
                      var text = this.node.value
                      this.emit('type', text)
                  }
                , ontype: function(){
                    clearTimeout(this.timer)
                    var self = this
                    this.timer = setTimeout(function(){
                      self.node.value = currTXT
                    }, 0)
                }
              }
          })
        
        , Watcher = sleipnir.core.Klass(function(){
              
              var currTXT = ""
              eventBus.on('myapp.type', function(e, txt){
                  currTXT = txt
              })
              
              return {
                  _construct: function(){
                      var self = this
                        , node = this.node = document.createElement('p')
                      
                      node.classList.add("watcher")
                      node.textContent = currTXT
                      eventBus.on('myapp.type', function(){
                          self.ontype()
                      })
                  }
                , timer: null
                , ontype: function(){
                      clearTimeout(this.timer)
                      var self = this
                      this.timer = setTimeout(function(){
                        self.node.textContent = currTXT
                      }, 0)
                  }
              }
          })
      
      sleipnir(function(){
         var broadcaster = new Broadcaster(document.getElementById('broadcaster'))
           , broadcasterController = sleipnir.core.Klass(function(){
                 
                return {
                    _construct: function(){
                        var self = this
                        this.broadcasters = []
                        this.adder = document.getElementById('broadcaster-adder')
                        this.remover =  document.getElementById('broadcaster-remover')
                        this.targetNode = document.getElementById('broadcasters')
                        
                        this.adder.addEventListener('click', function(){
                            self.addBroadcaster()
                        })
                        
                        this.remover.addEventListener('click', function(){
                            self.removeBroadcaster()
                        })
                    }
                  , addBroadcaster: function(){
                        var broadcaster = new Broadcaster()
                        this.broadcasters.push( broadcaster )
                        this.targetNode.appendChild(broadcaster.node)
                    }
                  , removeBroadcaster: function(){
                        if ( !this.broadcasters.length )
                          return
                        var broadcaster = this.broadcasters.shift()
                        this.targetNode.removeChild(broadcaster.node)
                    }
                }
             }, true)
           , watcherController = sleipnir.core.Klass(function(){

                return {
                    _construct: function(){
                        var self = this
                        this.watchers = []
                        this.adder = document.getElementById('watcher-adder')
                        this.remover =  document.getElementById('watcher-remover')
                        this.targetNode = document.getElementById('watchers')
                        
                        this.adder.addEventListener('click', function(){
                            self.addWatcher()
                        })
                        
                        this.remover.addEventListener('click', function(){
                            self.removeWatcher()
                        })
                    }
                  , addWatcher: function(){
                        var watcher = new Watcher()
                        this.watchers.push( watcher )
                        this.targetNode.appendChild(watcher.node)
                    }
                  , removeWatcher: function(){
                        if ( !this.watchers.length )
                          return
                        var watcher = this.watchers.shift()
                        this.targetNode.removeChild(watcher.node)
                    }
                }
            }, true)
          
          broadcasterController.addBroadcaster()
          watcherController.addWatcher()
      })
}, false)