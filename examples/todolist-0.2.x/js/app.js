sleipnir(function(){
    var router = new sleipnir.core.Router
    
    router.when({
        "/": "*"
      , "/www/([^\/]*)/([^\/]*)/([^\/]*)" : "service"
      , "?display=([^&]*)": "display"
      , "?show=([^&]*)": "show"
      , "?id=([^&]*)": "id"
    })
    
    router.on('routes.*.enter', "js/app.js", function(err, _, data){
        //load main app files
        console.log(arguments)
    })
    
    router.on('routes.service.enter', function(err, _, data, matches){
        console.log('service', matches[1], matches[2], matches[3])
    })
    
    router.on("routes.display.enter", function(err, _, data, matches){
        console.log("enter route display with value", matches[1])
    })
    
    router.on("routes.display.exit", function(err, _, data, matches){
        console.log("exit route display with value", matches[1])
    })
    
    router.on("routes.show.enter", function(err, _, data, matches){
        console.log("enter route show with value", matches[1])
    })
    
    router.on("routes.id.enter", function(err, _, data, matches){
        console.log("enter route id with id", matches[1])
    })
}, false)