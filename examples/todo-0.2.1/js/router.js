console.log('a')

var A = sleipnir.core.klass(function(){
        var a = "x"
        return {
            _construct: function(){
                this.test()
            }
          , test: function(){
                console.log(a)
            }
        }
    })
  , B = sleipnir.core.klass(A, function(_, supr){
        var a = "y"
        return {
            _construct:function(){
                supr.call(this)
            }
          , test: function(){
              console.log(a)
          }
        }
    })
    
var a = new B
a.test()