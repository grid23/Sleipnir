###PROJECT
- the ES5 and ES6 versions were lagging behind. As a consequence, they are removed from the repository, and the plan is to mix them with the 0.6.x branch

###ES3-0.5.11

- CORE :
  - {Model, Collection}::iterator added
  - Iterator::length added
  - {Model, Collection}::{length, enumerate} streamlined
  - Model regroups all recent key changes into a single update event
  - klass : if you use a private scope in your class, an additional "statics" arguments is send alongside Super. You can use it to define public static properties of the class ( `klass(function(Super, statics){ statics.publicstatic = "foobar"; return {} })` )
  - Promise : Promise, Promise.Group & Promise.Sequence should now be Promise/A compliant  or near
  - Promise.sequence is now a function that returns a predefined suite of function/promises, the passed arguments, are the data passed to the first fn/promise ( `var seq = sleipnir.Promise.sequence(function(x){ return x*x }, function(x){ return x*2 }); seq(10).then(function(total){ console.log(total); })` logs: 200
  - fix: sleipnir.objectify now works with a single key/value pair
  - internal iterators use inside sleipnir has changed to use for ( ; i<length; i++ ) instead of for ( k in o ) loops, for safety concern when sleipnir runs in an environment where the Array.prototype has been augmented :-(
  - namespace and define in namespaces return their value ( meaning you can assign it to a variable )
  - namespace, if the namespace scope returns an Object ( ie, class ), that Object is returned as the value of the namespace
  
- SADDLE : saddle is a kind-of addon for all dom-related stuff ( View, html parser, etc... )
  - saddle alpha ES3-0.0.a0 appears!