###ES3-0.5.12
  - Router: when multiple handlers are attached to a given route, the `$next` argument now works exactly like for handlers of different routes ( you have to call $next to let the router invoke the next handler)
  - Router: the default dispatcher function is now a static public method of the class Router, instead of a private one.
  - namespace: $def/$define returns its value (so you can assign it to a local var)
  - namespace: if the function used as a scope returns a value, that value is assigned as the namespace value instead (which is both useful and error prone :-)