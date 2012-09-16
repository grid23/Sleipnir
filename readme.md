#23.sleipnir 0.2.2

Sleipnir is a Javascript framework that aims to make easier for developers to organize their front-end website architecture.
While still in its early youth and under heavy development, the milestone 0.2.0 should be ready enough to power a website.

## key concepts
- 100% event based
- 100% OOP
- MVC ready
- provides core classes you can and are encouraged to build upon, and it's freaking easy!
- manages resources loading and dependencies with ease
- looks and feel like real JavaScript
- no UI-binding, obeys to the more-and-more-forgotten rule of separating HTML, CSS and JS


## roadmap
- 0.3.x : JSDOC, jasmine tests, env.{cookie, device, browser}
- 0.2.x : mvc components, env.url, router

## changelog
### 0.2.2
- dom.{Script, CSS, IMG} have been unified through a superclass dom.DomResource, meaning more shared code, yeah.
- core.Deferrer  instances can now save data of the core.Promise instances they're managing
- The sleipnir wrapper function now returns that data opening the way to more awesome stuff in the near future (for now, each nodes of the resources being loaded)
- added an example, a calculator written in a MVC fashion

### 0.2.1
- code cleaning
- sleipnir.core.ConditionSet disappeared

### 0.2.0
- sleipnir.core.klass lost its capital K
- mvc components appeared : sleipnir.mvc.{Collection, Model}

## How the start of a sleipnir-powered project might look like
```javascript
sleipnir(function(){
		var MyClassA = sleipnir.core.klass(function(_, supr){
			var publicStaticProperty = this.publicStaticProperty = "foo";
			var privateStaticProperty = "bar";
			var publicStaticMethod = this.publicStaticMethod = function(){};
			var privateStaticMethod = function(){};

			return {
				_construct: function(){
						console.log('instance created');
				},
				methodA: function(){},
				propertyA: "foo"
			}
		});

		var MyClassB = sleipnir.core.klass(MyClassA, function(_, supr){
			return {
				_construct: function(){
					supr.call(this)
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
			var MyClassA = function(){
					console.log('instance created');
			}

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
			MyClassA.call(this)
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

## how to use

If you're using 23.sleipnir.boot.js, sleipnir loads itself asynchronously; any use of the sleipnir wrapper will be queued and delayed until the 23.sleipnir.core.js is loaded.

```html
<script src="path/to/23.sleipnir.boot.js" data-src="path/to/23.sleipnir.core.js"></script>
<script>sleipnir('path/to/app.js', false)</script>
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
- data : an array containing all the data yielded during the loading of resources.

```javascript
sleipnir(function(err, _, data){
	console.log('fire at DOMContentLoaded');
});
```
```javascript
sleipnir(function(err, _, data){
	console.log('fire ASAP');
}, false);
```
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _, data){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded, or DOMContentLoaded is fired, whichever happens last');
	console.log('jquery node is', data[0])
});
```
```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _, data){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded');
	console.log('jquery node is', data[0])
},false);
```

You can load as many dependencies as needed, of many kinds, examples :
```javascript
sleipnir('fileA.js', function(err, _, data){ if ( err ) throw new Error;
	console.log("a single js file", data[0]);
})

sleipnir('fileA.js', "fileB.css", function(err, _, data){ if ( err ) throw new Error;
	console.log("two external files, one js", data[0], "one css", data[1]);
});

sleipnir("<scr"+"ipt>window.x = \"x\"</scr"+"ipt>", function(err, _, data){ if ( err ) throw new Error;
	console.log("inline script file, ugly, but hey", data[0]);
});

sleipnir("<style>body{background:black;}</style>", function(err, _, data){ if ( err ) throw new Error;
	console.log("inline css file", data[0]);
});
```

By default, css and script files are placed at the bottom of the head node, but it can be overrided
```javascript
var targetNode = document.getElementByTagName('style')[0]
sleipnir({type:"css", value:"<style>body{background:black;}</style>", position:{node:targetNode, type:3}}, function(err, _, data){ if ( err ) throw new Error;
	console.log("inline css file", data[0]);
});

//type corresponds to :
// 1: "append", 2: "prepend", 3: "insertBefore", 4: "insertAfter", 5: "replaceWith"
```

By default, image files are not placed on DOM at all, but you get the nodes at your disposal
```javascript
var images = ['path/to/img1.png', 'path/to/img2.png', 'path/to/img3.png']
sleipnir(images, function(err, _, data){ if ( err ) throw new Error;
	console.log("images nodes are available in data", data);
});
```

It can be overrided.
```javascript
var targetNode = document.getElementById('foo');
sleipnir({ type:"img", value:"path/to/img.png", position:{node:, type:1}}, function(err, _, data){ if ( err ) throw new Error;
	console.log("image node stile available in data", data[0]);
});
```

One very important rule is that all resources are unique.

The following example will only result in one jQuery file being loaded, one http request, as the three calls use to the same Promise based sleipnir.dom.Script instance.

Note that filea.js is not the same as filea.js?v=2

```javascript
sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded');
});

sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
	console.log('fire whenever jquery is loaded');
	
	sleipnir('//code.jquery.com/jquery.min.js', function(err, _){ if ( err ) { throw new Error('Houston, we have a problem.'); }
		console.log('jquery has been loaded long ago, no delay');
	});
});

```

**Notes :**
- In modern browsers, if you pass an inline tag, it will be transformed as a blob file, which is awesome and is easier to manipulate (events for onload, onerror).


## sleipnir.core

*(coming soon)*

**sleipnir.core.klass**

**sleipnir.core.EventEmitter**

**sleipnir.core.EventChanneler** implements sleipnir.core.EventEmitter

**sleipnir.core.Promise** implements sleipnir.core.EventEmitter

**sleipnir.core.Deferrer** implements sleipnir.core.EventEmitter

**sleipnir.core.ResourceLoader** implements sleipnir.core.Deferrer

## slepnir.data

*(coming soon)*

**sleipnir.data.Model** implements sleipnir.core.EventEmitter

## sleipnir.mvc

*(coming soon)*

**sleipnir.mvc.Collection** implements sleipnir.core.EventChanneler

**sleipnir.mvc.Model** see *sleipnir.core.Model*

## sleipnir.dom

*(coming soon)*

**sleipnir.dom.DomResource** implements sleipnir.core.Promise

**sleipnir.dom.Usher** implements sleipnir.core.Promise

**sleipnir.dom.Script** implements sleipnir.dom.DomResource

**sleipnir.dom.CSS** implements sleipnir.core.DomResource

**sleipnir.dom.IMG** implements sleipnir.core.DomResource


## sleipnir.env

*(coming soon, and not implemented right now!)*

**sleipnir.env.browser** instance of sleipnir.data.Model

**sleipnir.env.device** instance of sleipnir.data.Model

**sleipnir.env.url** instance of sleipnir.data.Model

**sleipnir.env.cookie** instance of sleipnir.data.Model

















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