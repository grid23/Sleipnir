# SleipnirJS

## dirty demo
    var MyModule = new Sleipnir.Module(function($){
    
        this.publicStaticProperty = "public static property"
        var privateStaticProperty = "private static property"
        
        // $ is a helper library
        
        return {
            _construct : function(){
                // constructor
                console.log( privateStaticProperty )
            }
          , myPublicPropertyA : "a"
          , myPublicPropertyB : "b"
        }
    });
    
    var MyModuleBis = new Sleipnir.Module(MyModule, function($){
        return {
            _construct : function(){}
          , myPublicPropertyB : "not b"
          , myPublicPropertyC : "c"
        }
    })
    
    var mymodule = new MyModule // logs "private static property"
    var mymodulebis = new MyModuleBis // logs "private static property"
    
    mymodule.myPublicPropertyB // b
    mymodule.myPublicPropertyC // undefined
    
    mymodulebis.myPublicPropertyA // a
    mymodulebis.myPublicPropertyB // not b
    mymodulebis.myPublicPropertyC // c
    
    MyModule.publicStaticProperty // public static property
    mymodule.publicStaticProperty // undefined
    MyModuleBis.publicStaticProperty // undefined