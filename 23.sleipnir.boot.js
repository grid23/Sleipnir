;
(function(w){ "use strict"
    var document = w.document
      , s = document.createElement('script')
      , p = document.getElementsByTagName('script')[0]
      , slice = Array.prototype.slice
      , sleipnirq = []
      , sleipnir = w.sleipnir = function(fn){
            sleipnirq.push( slice.call(arguments) )
        }
    s.async=true
    s.type= "text/javascript"
    s.onload = s.onreadystatechange = function(){
        if ( s.readyState && !~"complete, loaded".indexOf( s.readyState ) )
            return
        s.onreadystatechange = null
        s.onload = null

        for ( var i=0, l=sleipnirq.length; i<l; i++ )
          w.sleipnir.apply(null, sleipnirq[i])
    }
    s.onerror = function(e){
        throw new Error('Failed to load sleipnir.core')
    }
    s.src = "23.sleipnir.core.js"
    p.parentNode.insertBefore(s, p.nextSibling)
}(window))
;