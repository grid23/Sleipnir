# sleipnir.class

## what are classes ?

In javaScript (JS), everything is an object and as a consequence, JS has strong capabilities as an object-oriented language.
That said, JS use a *class-less*, *prototype-based* programming style, which differs from other popular languages.

When we speak of classes in JS, we are actually referring to means of emulating how other languages work.

A class can be seen as a model, from which we create multiple objects (or *instances* of a class).

In JS, a class is defined by a function called a *constructor* and its *prototype*.


Nothing distinguish a constructor from a common function, and so, as a convention, we give class names have a capital first letter to give a visual clue about their nature.
```javascript
var MyClass = function(){}; // a constructor - is it a function, is it an object?
```

The prototype is a list of of properties (variables called *properties*, and functions called *methods*) shared by all instances.
We define those properties and methods on the *prototype* of our class.
```javascript
var MyClass = function(){};
MyClass.prototype.foo = "bar"; // property
MyClass.prototype.hello = function(){ // method
  console.log('hello world');
};
```

To create an instance object of our class, we invoke the constructor with the *new* operator (instances are not to have a capital first letter in their name).
An instance works as a **regular JS object**, meaning we can add new keys to a single instance whenever we want.

```javascript
var MyClass = function(){};
MyClass.prototype.hello = function(){
  console.log('hello world');
};

var obj = new MyClass();
obj.bar = "foo"

obj.hello() // logs "hello world"
console.log(obj.bar) // logs "foo"
```

Inside the constructor and the methods, *this* refers to the **current instance**.
We can then overwrite value of properties on an instance level.
```javascript
var MyClass = function(word){
    if ( word ) {
      this.word = word; // overwrite the instance value of MyClass.prototype.word
    }
};
MyClass.prototype.word = "world";
MyClass.prototype.hello = function(){
  console.log('hello ' + this.word);
};

var obj = new MyClass("Europa");
var obj2 = new MyClass(); // we do not pass an argument for "this.word", so the default value in the prototype will be used instead
obj.hello(); // logs "hello Europa"
obj2.hello(); // logs "hello world"
```

A class can have **static** properties and methods. Those are properties and methods that are not passed to instances.
Instead they are available through the class itself, as mere object keys.
```javascript
var MyClass = function(word){
    if ( word ) {
      this.word = word;
    }
};
MyClass.prototype.word = "world";
MyClass.prototype.hello = function(){
  console.log( MyClass.capitalize('hello ' + this.word) );
};
MyClass.capitalize = function(str){
  return str.toUpperCase()
}

var obj = new MyClass("Europa");
obj.hello(); // logs "HELLO EUROPA"
```

Until now, we have seen only **public** properties and methods and **public static** ones. This means, they are freely available to any external use.
But, it would be a good idea to have secret ones, as sometimes you don't want to expose internal mechanisms, for esthetic or security sake.

They are called **private static properties** and must answer to strict rules : 
- they **must** be readable and writable from within the public methods, 
- they **must not** be readable and certainly not writable from an outside manipulation.

Unfortunately, JS offers no native way to do that.
One common solution is to rely on a **closure** to provide a secure closed space, where you can store variables and functions to act as private properties and methods.
```javascript
var MyClass = (function(){ // start of an IIFE ( immediatly-invoked function expression used as a closure
    var instances = 0; // private static property
    var MyClass = function(word){
        instances++; // each time we create an instance, we will increment the value
        if ( word ) {
          this.word = word;
        }
    };
    MyClass.prototype.word = "world";
    MyClass.prototype.hello = function(){
      console.log( MyClass.capitalize('hello ' + this.word) );
    };
    MyClass.capitalize = function(str){
      return str.toUpperCase();
    }
    return MyClass; // returns the local MyClass
}()); // end of the IIFE

var obj = new MyClass();
obj.hello() // logs either "HELLO WORLD"
console.log(obj.instances) // undefined
console.log(MyClass.instances) // undefined

// trying to access privateStaticProperty from the outside
obj.hello = function(){
    console.log(instances) // you won't reach the scope of the original variable
}
obj.hello() // undefined
```

JS often offers many possible ways to achieve the same goal.

The **module pattern** yields a similar result than the class described earlier.
A big con of this pattern is that for each pseudo-instance you will create, you will actually copy an entire set of new object, keys, functions that need to be stored in memory, where a prototype in a class is shared amongst all instances, resulting in a minimal footprint in memory.
```javascript
var helloWorld = (function(){
    var instances = 0;
    var capitalize = function(str){
        return str.toUpperCase();
    };

    return function(word){
        instances++;
        return {
            word: word ? word : "world",
            hello: function(){
                console.log(capitalize('hello ' + this.word)) //this refers to the current object
            }
        }
    }
}())

var obj = helloWorld("usa")
obj.hello() // logs "HELLO USA"
```

In ES5, new handy features have been added to offer more control over objects and their prototype.
Unlike the module pattern above, the new ES5 Object.create() works exactly like a class. What we have here are real instances of a base class-less object prototype.
```javascript
var helloWorld = (function(){
    var instances = 0;
    var capitalize = function(str){
        return str.toUpperCase();
    };
    var helloworld = Object.create(null, {
        word: {value:"world"},
        hello: {value: function(){
            console.log(capitalize('hello ' + this.word)) //this refers to the current object
        }}
    });

    return function(word){
        instances++;
        return Object.create(helloworld, {
            word: {value: word ? word : helloworld.word}
        })
    }
}());

var obj = helloWorld("europa")
obj.hello() // logs "HELLO EUROPA"
```
The last example mixes Object.create with a module pattern construct, which is a common practice.
We can do better: we can mix classes with Object.create.
```javascript

var MyClass = (function(){
    var instances = 0;
    var MyClass = function(word){
        instances++;
        if ( word ) {
            this.word = word;
        }
    };
    MyClass.prototype = Object.create(null, {
        word: {value: "world"},
        hello: {value: function(){
            console.log(MyClass.capitalize('hello ' + this.word));
        }}
    })
    MyClass.capitalize = function(str){
        return str.toUpperCase()
    }
    return MyClass;
}())

var obj = new MyClass("africa")
obj.hello() // logs "HELLO AFRICA"
```


## classes in sleipnir
### sleipnir.class( *opt_superclass*, prototype, *opt_singleton* )

Sleipnir adds syntactic sugar for class definition, through the sleipnir.class function, and uses a mix of classes and new ES5 features.

Sleipnir.class takes 1 to 3 arguments.

If only 1 argument is given, sleipnir.class waits for an object to serve as the class prototype.
Inside that prototype object, the method _construct will serve as the class constructor, in place of the native constructor function.
```javascript
var MyClass = sleipnir.class({
    _construct: {enumerable: false, value: function(word){
        this.word = word
    }}
  , word: "world"
  , hello: function(){
        console.log('hello ' + this.word)
    }
})
```

You can also pass a function that returns an object ; it will be invoked by sleipnir with different arguments that we'll see later.

This construct offers a convenient closed scope/closure for you to use. Inside that closed scope, *this* refers to the class itself.
You can safely define private & static properties and methods there, and you should then probably always use this construct.

```javascript
var MyClass = sleipnir.class(function(supr, _){
    
    var instances = 0;
    
    var capitalize = this.capitalize = function(str){ // this refers to MyClass
        return str.toUpperCase();
    }
    
    return {
        _construct: {enumerable: false, value: function(word){
            instances++;
            if ( word ) {
              this.word = word; // this refers to the current instance
            }
        }}
      , word: "world"
      , hello: function(){
            console.log( capitalize('hello ' + this.word) ) // this refers to the current instance
        }
    }
})
```

To create an instance of a class, we can use the *new* operator or the alternative *create* static method which is automatically added to each class.
```javascript
var obj = new MyClass('Europa');
var obj2 = MyClass.create('Asia');
```