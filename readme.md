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

## the sleipnir function

The sleipnir wrapper function takes another function as an argument. That function will be executed in those conditions :
- as soon as the DOM is ready ( DOMContentLoaded, with fallback on onload ) 
- if sleipnir is loaded async'ly from the 23.sleipnir.boot.js and DOMContentLoaded has already been fired, as soon as possible
- the wrapper takes an optional last boolean argument, if set at false, as soon as possible (eg., do not wait for DOMContentLoaded)
- if dependencies are requested, as soon as all dependencies are loaded, with DOMContentLoaded being waited for in the same fashion as previously stated

The passed function will be invoked with two arguments :
- error : if an error has occured while loading dependencies, you will know
- _ : helpers library

```javascript
sleipnir(function(err, _){
	console.log('fire at DOMContentLoader');
});
```
```javascript
sleipnir(function(err, _){
	console.log('fire ASAP');
}, false);
```
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.') }
	console.log('fire whenever jquery is loaded, or DOMContentLoaded is fired, whichever happens last');
});
```
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.') }
	console.log('fire whenever jquery is loaded');
},false);
```




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