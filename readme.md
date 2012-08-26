#23.sleipnir.core

Sleipnir is a Javascript framework that aims to make easier for front-end developers to organize their front architecture.

While still in its beginning and under heavy development, the milestone 0.1.0 should be ready enough to start being used on a small scale or prototype site for testing.

Sleipnir has a big orientation towards Class based code.


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

## An equivalent code in vanillaJS, in a perfect world where every browser works the same
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
		MyClassB.prototyoe.methodB = function(){};
		MyClassB.prototype.propertyB = "bar";
		
		window.addEventListener('DOMContentLoaded', function(){
				var a = new MyClassA;
				var b = new MyClassB;
		});
}());
```