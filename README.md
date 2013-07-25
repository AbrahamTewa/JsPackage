JsPackage
=========

JsPackage is a javascript framework for Object Oriented Programmation. It allow the creation of classes (simple, herited and abstract), packages (including nested package), interfaces and namespace. Classes and packages can have public and privates attributes, methods and constants (classes can also get protected elements).
JsPackage only uses standard javascript elements : it's compatible with all navigators that integrages Javascript 1.8.. It has been tested successfully on :

  * Firefox
  * Google Chrome
  * IE 9+
  * Node.js

Safari and Opera have one or several issue that make JsPackage not fully compatible.

### Documentation ###

  * Website   : www.jspackage.net (in construction)
  * Reference : wiki.jspackage.net

### Integration ###
In the client side, just call the file as a javascript file

    <script type="text/javascript" src="JsPackage.js"></script>

In Node.js, call only once the file, preferably in your main script :

    require('./JsPackage.js');

The script will create several global objects : 
  * Class
  * Descriptor
  * Definition
  * Interface
  * JsPackage
  * Package
  * Namespace

### Code example ###
The following examples will work on browsers and node.js :

    var Item = Class({
         name           : Private.Attribute   // describe a private attribute
       , description    : Private             // an element is an attribute by default
       , getName        : Public.Method({     // describe a public method
            return this.name;
         })
       , getDescription : function(){         // a function is by default a public method
            return this.description;
         }
       , $ : {
          initialization : function(name, description) {
             this.name = name;
             this.description = description;
          }
         }
    })
    
    var Section = Class({
         title : Private
       , items : Private
       , getItems : function() {
       	    return this.items.slice(0);
         }
       , getTtle : function() {
            return this.title;
         }
       , addItem : function(name, description) {
            var item = new Item(name, description);
            this.items.push(item);
         }
       , $ : {
            initialization : function(title) {
               this.title = title;
               this.items = [];
            }
         }
    });
    
    var section = new Section('Articles');
    
    section.addItem('Javascript', 'Javascript was create in 1995');
    section.addItem('HTML' , 'HTML was created in 1991');
    
