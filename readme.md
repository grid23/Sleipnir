#23.sleipnir
( current version : v0.1.1 )


Sleipnir is a Javascript framework that aims to make easier for developers to organize their front-end website architecture.

While still in its early youth and under heavy development, the milestone 0.1.0 should be ready enough to power a prototype site for testing.



## some key concepts
Sleipnir...
- has a strong orientation towards Class based code.
- is 100% event based (everything implements a base EventEmitter class)
- thinks we should load & design everything in an async fashion
- obeys to the more-and-more-forgotten rule of separating html, css and js
- doesn't try to change the way JavaScript feels & looks

*( more code example and a small doc coming soon... )*



## How the start of a sleipnir-powered project might look like
```javascript
sleipnir(function(){
		var MyClassA = new sleipnir.core.Klass(function(_){
			var publicStaticProperty = this.publicStaticProperty = "foo";
			var privateStaticProperty = "bar";
			var publicStaticMethod = this.publicStaticMethod = function(){};
			var privateStaticMethod = function(){};

			return {
				_construct: function(){},
				methodA: function(){},
				popertyA: "foo"
			}
		});

		var MyClassB = new Sleipnir.core.Klass(MyClassA, function(_){
			return {
				_construct: function(){
					var args = _.to.array(arguments)
					console.log(this.propertyA + this.propertyB)
				},
				methodB: function(){},
				propertyB: "bar"
				}
		});

		sleipnir(function(){
			var a = new MyClassA;
			var b = new MyClassB;
		});
}, false);
```

## An equivalent code in vanillaJS, in a perfect world where every browsers work the same
```javascript
(function(){
		var slice = Array.prototype.slice;
		var MyClassA = (function(){
			var MyClassA = function(){}

			var publicStaticProperty = MyClassA.publicStaticProperty = "foo";
			var privateStaticProperty = "bar";
			var publicStaticMethod = MyClassA.publicStaticMethod = function(){};
			var privateStaticMethod = function(){};

			MyClassA.prototype = {
				methodA: function(){},
				propertyA: "foo"
			};

			return MyClassA;
		}());

		var MyClassB = function(){
			var args = slice.call(arguments)
			console.log(this.propertyA + this.propertyB);
		};
		MyClassB.prototype = new MyClassA;
		MyClassB.prototype.constructor = MyClassB;
		MyClassB.prototype.methodB = function(){};
		MyClassB.prototype.propertyB = "bar";

		var onstart = function(){
			var a = new MyClassA;
			var b = new MyClassB;
		};

		if ( document.readyState === "complete" ) {
			onstart();
		} else {
			window.addEventListener('DOMContentLoaded', onstart);
		}
}());
```



## The sleipnir function

The sleipnir wrapper function is used to control when things are done, and permits the loading of many resources as dependencies before the function is invoked.
You can load external or inline scripts/css/images.

The sleipnir wrapper function takes another function as its main argument. That function will be invoked when those conditions are met:
- *as soon as the DOM is ready* ( DOMContentLoaded, with fallback on onload ) 
- if sleipnir is loaded async'ly from the 23.sleipnir.boot.js and DOMContentLoaded has already been fired, *as soon as possible*
- the wrapper takes an optional last boolean argument, if set at false, *as soon as possible* (eg., do not wait for DOMContentLoaded)
- if dependencies are requested, *as soon as all dependencies are loaded*, with DOMContentLoaded being waited for in the same fashion as previously stated

The passed function will be invoked with two arguments :
- error : if an error has occured while loading dependencies, you will know
- _ : helpers library

```javascript
sleipnir(function(err, _){
	console.log('fire at DOMContentLoaded');
});
```
```javascript
sleipnir(function(err, _){
	console.log('fire ASAP');
}, false);
```
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded, or DOMContentLoaded is fired, whichever happens last');
});
```
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded');
},false);
```

You can load as many dependencies as needed, of many kinds, examples :
```javascript
sleipnir('fileA.js', function(err){ if ( err ) throw new Error;
	console.log("a single js file");
})

sleipnir('fileA.js', "fileB.css", function(err){ if ( err ) throw new Error;
	console.log("two external files, one js, one css");
});

sleipnir("<scr"+"ipt>window.x = \"x\"</scr"+"ipt>", function(err){ if ( err ) throw new Error;
	console.log("inline script file, ugly, but hey");
});

sleipnir("<style>body{background:black;}</style>", function(err){ if ( err ) throw new Error;
	console.log("inline css file");
});
```

By default, the files are placed after the last element of the same type in the webpage, but you can override that
```javascript
var targetNode = document.getElementByTagName('style')[0]
sleipnir({type:"css", value:"<style>body{background:black;}</style>", sibling:targetNode, position:"before"}, function(err){ if ( err ) throw new Error;
	console.log("inline css file");
});
```

One very important rule is that all resources are uniques.
The following example will only result in one jQuery file being loaded, one http request, and the three calls use to the same Promise based sleipnir.data.Script instance that is used for that file.
Note that filea.js is not the same as filea.js?v=2
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded');
});

sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded');
	
	sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
		console.log('fire whenever jquery is loaded');
	});
});

```

**Notes :**
- In modern browsers, if you pass an inline striing of code, it will be transformed as a blob file, which is awesome and is easier to manipulate (events).
- There is no way right now to get your created nodes in the sleipnir invoked callback, but it's planned in the future (a way to do that for the moment is to use sleipnir.data.{CSS,Script}).
- loading of images is not very well supported right now, but can still be used as a preloading thing.


## sleipnir.core

*(coming soon)*

**sleipnir.core.Klass**

**sleipnir.core.EventEmitter**

**sleipnir.core.EventChanneler**

**sleipnir.core.Promise**

**sleipnir.core.Deferrer**

**sleipnir.core.VariableSet**


## sleipnir.data

*(coming soon)*

**sleipnir.data.Script**

**sleipnir.data.CSS**

**sleipnir.data.IMG**


## sleipnir.env

*(coming soon, and not implemented right now!)*

**sleipnir.env.browser**

**sleipnir.env.device**

**sleipnir.env.url**

**sleipnir.env.cookie**

















## LICENSE

DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
Version 2, December 2004 

Copyright (C) 2004 Sam Hocevar <sam@hocevar.net> 

Everyone is permitted to copy and distribute verbatim or modified 
copies of this license document, and changing it is allowed as long 
as the name is changed.

DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 

0. You just DO WHAT THE FUCK YOU WANT TO.

This program is free software. It comes without any warranty, to
the extent permitted by applicable law. You can redistribute it
and/or modify it under the terms of the Do What The Fuck You Want
To Public License, Version 2, as published by Sam Hocevar. See
http://sam.zoy.org/wtfpl/COPYING for more details.