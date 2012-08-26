#23.sleipnir.core

Sleipnir is a Javascript framework that aims to make easier for developers to organize their front-end website architecture.

While still in its early youth and under heavy development, the milestone 0.1.0 should be ready enough to power a prototype site for testing.


## some key concepts
Sleipnir...
- has a strong orientation towards Class based code.
- is 100% event based (everything implements a base EventEmitter class)
- doesn't try to change the way JavaScript feels & looks


*( more code example and a small doc coming soon... )*


## How the start of a sleipnir-powered project might look like
```javascript
sleipnir(function(){
  	var MyClassA = new sleipnir.core.Klass(sleipnir.core.EventEmitter, function(_){
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
		
		var MyClassB = new Sleipnir.core.Klass(MyClassA, function(){
				return {
						_construct: function(){
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
				console.log(this.propertyA + this.propertyB);
		};
		MyClassB.prototype = new MyClassA;
		MyClassB.prototype.constructor = MyClassB;
		MyClassB.prototype.methodB = function(){};
		MyClassB.prototype.propertyB = "bar";
		
		window.addEventListener('DOMContentLoaded', function(){
				var a = new MyClassA;
				var b = new MyClassB;
		});
}());
```