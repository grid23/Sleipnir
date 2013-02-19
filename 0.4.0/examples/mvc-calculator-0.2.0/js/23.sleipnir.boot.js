;
(function(w){ "use strict"
    var document = w.document
      , s = document.createElement('script')
      , _p = document.getElementsByTagName('script')
      , p, src = "23.sleipnir.core.js"
      , slice = Array.prototype.slice
      , sleipnirq = []
      , sleipnir = w.sleipnir = function(fn){
            sleipnirq.push( slice.call(arguments) )
        }
    for ( var i=0, l=_p.length; i<l; i++ )
      if ( _p[i].src.match(/23.sleipnir.boot.js/) )
        p = _p[i],
        src = p.getAttribute('data-src') || src
    if ( !p )
      p = _p[0]
    s.async = true
    s.type = "text/javascript"
    s.onload = s.onreadystatechange = function(){
        if ( s.readyState && !~"complete, loaded".indexOf(s.readyState) )
            return
        s.onreadystatechange = null
        s.onload = null
        for ( var i=0, l=sleipnirq.length; i<l; i++ )
          w.sleipnir.apply(null, sleipnirq[i])
    }
    s.onerror = function(e){
        throw new Error('Failed to load sleipnir.core')
    }
    s.src = src
    p.parentNode.insertBefore(s, p.nextSibling)
}(window))
;