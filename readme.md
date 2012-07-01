# SleipnirJS

## dirty demo

    // we create a MyModule Class
    var MyModule = new Sleipnir.Module(function($){
    
        this.publicStaticProperty = "public static property"
        var privateStaticProperty = "private static property"
        
        // $ is a helper library, example : $.args.toArray() which transforms arguments as an array
        
        return {
            _construct : function(){
                // constructor function
                console.log( privateStaticProperty )
            }
          , myPublicPropertyA : "a"
          , myPublicPropertyB : "b"
        }
    });
    
    
    // we create a MyModuleBis Class, which inherits from our MyModule Class
    var MyModuleBis = new Sleipnir.Module(MyModule, function(){
        return {
            _construct : function(){}
          , myPublicPropertyB : "not b"
          , myPublicPropertyC : "c"
        }
    })
    
    // MyModuleTer will call the MyModule _construct with arguments 1,2,3 
    var MyModuleTer = new Sleipnir.Module([MyModule, 1,2,3], function(){
        return {
                _construct : function(){}
        }
    })
    
    var mymodule = new MyModule // logs "private static property"
    var mymodulebis = new MyModuleBis
    var mymodyleter = new MyModuleTer //logs "private static property"
    
    mymodule.myPublicPropertyB // b
    mymodule.myPublicPropertyC // undefined
    
    mymodulebis.myPublicPropertyA // a
    mymodulebis.myPublicPropertyB // not b
    mymodulebis.myPublicPropertyC // c
    
    MyModule.publicStaticProperty // public static property
    mymodule.publicStaticProperty // undefined
    MyModuleBis.publicStaticProperty // undefined