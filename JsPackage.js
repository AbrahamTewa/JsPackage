/*
The MIT License (MIT)

Copyright (c) 2012-2013 Abraham TEWA

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


/*global console:false */

/**
 * A number, or a string containing a number.
 * @typedef {Definition} Definition
 * @access public
 */

/**
* Class are created using
* @typedef {Object} Instance
* @access public
*/

/**
* @typedef {object|Namespace|Package} NamespaceLike
*/

/**
* @typedef {object} Namespace
*/

/**
* @typedef {object} Package
*/

/**
* @typedef {object} Class
*/
/**
* @namespace
* @name main
**/
(function (parameters) {
   "use strict";

   /**
   * This object will be use to determine the accessibility of the different members of an environment.
   * @typedef {object} DeclarationProperty
   * @memberof main
   * @property {boolean} addPrivate        - Determine weither (true) or not (false) private members must be added to the environment
   * @property {boolean} addProtected      - Determine weither (true) or not (false) protected members must be added to the environment
   * @property {boolean} addPublic         - Determine weither (true) or not (false) public members must be added to the environment
   * @property {main.Environment} env      - Environment in wich members will be added
   * @property {boolean} include           - Determine weither (true) or not (false) the current DeclarationProperty must be used
   * @property {boolean} overridePrivate   - Determine weither (true) or not (false) private members must be overrided in the environment
   * @property {boolean} overrideProtected - Determine weither (true) or not (false) protected members must be overrided in the environment
   * @property {boolean} overridePublic    - Determine weither (true) or not (false) public members must be overrided in the environment
   */

   /**
   Environment of a class or package. An environment will contains private, public or protected attribute, according to a
   {@link main.DeclarationProperty}
   * @typedef {object} Environment
   * @memberof main
   * @property {string} toString           - Return the string representation of the environment. The string representation will indicate if we are in a public or private environment.
   * @property {object} $                  - Contains informations and methods to manipulate the environment.
   */

   /**
   * Protected environment of classes. This environment contains all public and protected static properties of the class.
   * @typedef ClassProtectedEnv
   * @type {main.Environment}
   * @memberof main
   */
   var globalThis, globalName, debugMode, defaultNamespaces, onerror, Class, Constants, Core;
   var Definition, Descriptor, Errors, Interface, Namespace, Package, jsObject, publicEnv, Version;
   var version;

   /**
   * Context in wich JsPackage will be added. This is given in parameter when the file is called.
   * By default, this is the "window" object in browser, howether, "global" for Node.js environment.
   * @name globalThis
   * @variable
   * @type object
   * @default this.window === undefined ? global : this
   * @memberof main
   */
   globalThis        = parameters.parent;

   /**
   * Name of JsPackage in the context (see {@link main.globalThis}).
   * @variable
   * @name globalName
   * @type string
   * @default 'JsPackage'
   * @memberof main
   */
   globalName        = '' + parameters.name; // The given name must be a string
   debugMode         = parameters.debug === undefined ? false : !!parameters.debug;
   onerror           = parameters.onerror;

   if (debugMode) {
      console.log('JsPackage : ' + globalName + ' in debugMode');
   }

   /**
   * An authorization list is used to list all objects that can access the currect package/class/instance private/protected environment.
   * @typedef {array} main.AuthorizationList
   */

   /*----------------------------------------------------------------------------------------------
   |                                 Package interne : Class
   |-----------------------------------------------------------------------------------------------
   | Description
   |
   |    Ce package permet la cr�ation de classe et de leurs instances.
   |
   |-----------------------------------------------------------------------------------------------
   | Cr�ation d'une classe
   |
   |    La cr�ation d'une classe est faite par la fonction "newClass". Cette fonction re�oit entre
   | param�tre la d�finition de la classe. Elle va convertir la d�finition en d�finition standard
   | et ensuite faire appel � "createClass", en lui fournissant la d�finition standard ouverte
   | (cad, l'objet "me" de la d�finition).
   |    "createClass" va alors cr�er l'objet "me" de la classe, ainsi que les diff�rents environ-
   | nements de la classe :
   |        . publicEnv
   |        . thisEnv
   |        . selfEnv
   |        . superEnv
   |
   | Pour la description de ces diff�rents environnements, voir la section "Description des
   | environnements" plus loin.
   |
   | Pour chacun de ces environnements, il va cr�er des variables listants les propri�t�s de
   | visibilit� des attributs et m�thodes. On va � chaque fois pr�ciser si l'on peut ajouter les
   | attributs/m�thodes publiques, priv�s et prot�g�s, et si on peut les surcharger ou non.
   | Ces objets poss�de aussi une propri�t� "include", valoris� initialement � "true". Cet
   | attribut permettra de filtrer par la suite les obejts "properties" � traiter.
   | Ces variables sont respectivemenets :
   |        . publicProperties
   |        . thisProperties
   |        . selfProperties
   |        . superProperties
   |
   | Ces 4 objets vont �tre enregistr�s dans un tableau : listProperties.
   |
   | On va ensuite cr�er la variable "levels". Il s'agira d'un tableau simple dont le seul �l�ment
   | � l'initialisation sera "me". Le r�le de level sera discut� plus loin.
   |
   | On va v�rifier ensuite si la classe h�rite des propri�t�s d'une autre classe. Si oui, alors
   | on va appeler la m�thode "extendClass" en lui fournissant la classe �tendue, "listProperties"
   | et "levels".
   |
   | "extendClass" est une fonction qui ressemble fortement � "createClass". Son r�le est cependant
   | tout autre. Elle va commencer par cr�er l'objet "me" de la classe fournie en param�tre.
   | Elle va cr�er de la m�me mani�re les variables publicProperties, thisProperties,
   | selfProperties et superProperties correspondant � ces diff�rents environnements. Cette fois
   | cependant, ces objets vont �tre ajout�s � "listProperties" re�u en param�tre. Leurs attributs
   | "include" est valoris� � ce moment l� � "true".
   | De la m�me mani�re que "createClass", on va v�rifier si la classe h�rite d'une autre classe.
   | si c'est le cas, on appelera "extendClass" avec la classe h�rit�e, "listProperties" et
   | "levels".
   | Si ce n'est pas le cas, on va alors s'occuper de d�clarer les propri�t�s � notre classe.
   | h�ritante.
   | On va pour cel� appeler la fonction "Core.declare", � laquelle on va fournir pour chaque
   | propri�t� de la classe h�ritante, son nom et sa description. "Core.declare" recevera aussi
   | "listProperties" et le "thisEnv" de la propri�t�.
   | "Core.declare" va alors parcourir chaque objets de "listProperties" et d�terminer s'il faut
   | ou non y ajouter la propri�t� pass�e en param�tre.
   | Exemple :
   |   Si la propri�t� est priv�e et que l'�lement 0 de "listProperties" indique de ne pas
   | ajouter les objets priv�s (addPrivate = false), alors on ajoutera pas la propri�t� �
   | l'environnement associ�.
   |
   | A noter qu'en r�alit�, on ajoute un "alias" vers la propri�t� (qui elle n'existe que sur un
   | seul thisEnv).
   |
   |---------------------------------------------------------------------------------------------*/
   /**
    * The namespace Class contains all the function for class creation.
    * @namespace
    * @name Class
    * @memberof main
    * @access private
    */
   Class                 = (function () {

      /**
      * <p>Create a new class from a definition. The definition have been validated.</p>
      * First, the {@link main.Class.ClassMe|me} environment of the class will be created. Then, we create the extended environment
      * using the {@link main.Class.extendedClass}.
      * @function createClass
      * @returns {Class} Newly created class
      * @memberof main.Class
      * @access private
      * @param {DefinitionMe} definition Definition of the function. The definition has been validated at this point.
      * @property {main.Class.ClassMe} me "Me" of the class.
      * @property {main.DeclarationProperty[]} listProperties List of all declaration properties of the class and the child classes.
      * @property {Descriptor} publicInitialization This variable is used to determine class can be instanciable in public or not. It's determine by the visibility of the initialization function of the definition.
      * @property {main.DeclarationProperty} privateProperties Declaration property of the private environment of the class
      * @property {main.DeclarationProperty} protectedProperties Declaration property of the protected environment of the class
      * @property {main.DeclarationProperty} publicProperties Declaration property of the public environment of the class
      * @property {main.DeclarationProperty} selfProperties Declaration property of the self environment of the class
      */
      var createClass             = function (definition) {

         var env, id, listProperties, listAncestry, me, meExtends, name, newFct, protectedProperties, publicInitialization, publicProperties, selfProperties, thisProperties, openExtend;

         /**
         * {@link main.me|me} object of classes
         * @class ClassMe
         * @memberof main.Class
         * @access public
         */
         me             = {
                            /**
                            * List all the authorized {@link Class|classes} and {@link Package|packages} that can access to the private or protected environment of the class or his instance.
                            * @member {main.AuthorizationList} authorizationList
                            * @memberof main.Class.ClassMe
                            */
                            authorizationList    : {}
                            /**
                            * Opened definition of the class
                            * @member {DefinitionMe} definition
                            * @memberof main.Class.ClassMe
                            */
                          , definition           : definition
                            /**
                            * Determine if the parent is enumerable (true) of not (false)
                            * @member {boolean} enumerable
                            * @memberof main.Class.ClassMe
                            */
                          , enumerable           : definition.enumerable
                            /**
                            * Class extended by the current class.
                            * @member {Class} extends
                            * @memberof main.Class.ClassMe
                            */
                          , extends              : definition.extends
                            /**
                            * Initialization function called after instanciation
                            * @function initialization
                            * @memberof main.Class.ClassMe
                            */
                          , initialization       : definition.initialization
                            /**
                            * List of the interfaces implemented by the class
                            * @member {Class[]} implements
                            * @memberof main.Class.ClassMe
                            */
                          , implements           : definition.implements
                            /**
                            * <p>Determine weither or not the class is an abstract class.</p>
                            * <p>This value depends on the $.abstract field of the definition of the class</p>
                            * @function isAbstract
                            * @memberof main.Class.ClassMe
                            * @returns {boolean} true: the class is an abstract class, false otherwise
                            */
                          , isAbstract           : definition.isAbstract
                            /**
                            * <p>Determine weither or not the class is an final class.</p>
                            * <p>This value depends on the $.final field of the definition of the class</p>
                            * @function isFinal
                            * @memberof main.Class.ClassMe
                            * @returns {boolean} true: the class is final, false otherwise
                            */
                          , isFinal              : definition.isFinal
                            /**
                            * @member {Class[]} levels
                            * @memberof main.Class.ClassMe
                            */
                          , levels               : []
                            /**
                            * Name of the classs. All "Me" object must have this property
                            * @member {string} name
                            * @memberof main.Class.ClassMe
                            */
                          , name                 : definition.name
                            /**
                            * Parent of the class. All "Me" object must have this property
                            * @member {NamespaceLike} Parent
                            * @memberof main.Class.ClassMe
                            */
                          , parent         : definition.parent
                            /**
                            * Name of the class. This property is called by the get function {@link Class.name} in private environment
                            * @member {string} privateName
                            * @memberof main.Class.ClassMe
                            */
                          , privateName    : undefined
                            /**
                            * Parent of the class. This property is called by the get function {@link Class.parent} in private environment
                            * @member {string} privateParent
                            * @memberof main.Class.ClassMe
                            */
                          , privateParent  : undefined
                            /**
                            * Protected environment of the class
                            * @member {ClassProtectedEnv} protectedEnv
                            * @memberof main.Class.ClassMe
                            */
                          , protectedEnv   : {}
                            /**
                            * This function will be use as a false prototype of the class : Instance will be created with this function, allowing the use of "instanceof" standard function.
                            * @member {function} prototype
                            * @memberof main.Class.ClassMe
                            */
                          , prototype      : function() {}
                            /**
                            * Name of the class. This property is called by the get function {@link Class.name} in public environment
                            * @member {string} publicName
                            * @memberof main.Class.ClassMe
                            */
                          , publicName     : undefined
                            /**
                            * Parent of the class. This property is called by the get function {@link Class.parent} in public environment
                            * @member {NamespaceLike} publicParent
                            * @memberof main.Class.ClassMe
                            */
                          , publicParent   : undefined
                            /**
                            * Self environment of the class.
                            * @member {ClassSelfEnv} selfEnv
                            * @memberof main.Class.ClassMe
                            */
                          , selfEnv        : {}
                            /**
                            * Super environment of the class
                            * @member {ClassSuperEnv} superEnv
                            * @memberof main.Class.ClassMe
                            */
                          , superEnv       : undefined
                            /**
                            * toString function used to represent class.
                            * @function toString
                            * @memberof main.Class.ClassMe
                            * @returns {string} String representation of the class
                            */
                          , toString       : function() { return 'Class : Me'; }
                            /**
                            * Constant representing the class.
                            * @member {string} type
                            * @memberof main.Class.ClassMe
                            */
                          , type           : Constants.CLASS};

         /**
         * ID of the class
         * @member {number} id
         * @memberof main.Class.ClassMe
         */
         me.id               = Core.getNewId(me);

         /**
         * Determine if the current class has instanciate the given parameter object.
         * @func classOf
         * @memberof main.Class.ClassMe
         * @param {object} object to test
         * @returns {boolean} true: the class is the one who instanciate the object. False otherwise
         */
         me.classOf          = fct.classOf(me);
         /**
         * Determine if the current class is a parent of the object
         * @func parentOf
         * @memberof main.Class.ClassMe
         * @param {object} object to test
         * @returns {boolean} true: the class is parent of the instance, false otherwise
         */
         me.parentOf         = fct.parentOf(me);
         /**
          <p>Return the parent of the class. This function will be use as a get property in the private environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPrivateParent
         * @memberof main.Class.ClassMe
         * @param {object} object to test
         * @returns {NamespaceLike} parent of the class. undefined if their is no parent.
         */
         me.getPrivateParent = Core.fct.getValue(me, 'privateParent');

         /**
          <p>Return the parent of the class. This function will be use as a get property in the public environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPublicParent
         * @memberof main.Class.ClassMe
         * @param {object} object to test
         * @returns {NamespaceLike} parent of the class. undefined if their is no parent.
         */
         me.getPublicParent  = Core.fct.getValue(me, 'publicParent');
         /**
          <p>Return the parent name of the class in the parent object. This function will be use as a get property in the private environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPrivateName
         * @memberof main.Class.ClassMe
         * @param {object} object to test
         * @returns {string} the class name in parent object. undefined if their is no parents.
         */
         me.getPrivateName   = Core.fct.getValue(me, 'privateName');
         /**
          <p>Return the parent name of the class in the parent object. This function will be use as a get property in the public environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPublicName
         * @memberof main.Class.ClassMe
         * @param {object} object to test
         * @returns {string} the class name in parent object. undefined if their is no parents.
         */
         me.getPublicName    = Core.fct.getValue(me, 'publicName');

         newFct              = fct.getNewObject(me);
         // If we have a initialization function, then we use it to create the public environment.
         if (me.definition.initialization !== undefined) {

            // "initialization" is a descriptor describing a method. Is visibility determine who can
            // instanciate the function
            if (me.initialization.isPublic())
               publicInitialization    = newFct;
            else
               publicInitialization    = fct.notInstanciableFunction(me);
         }
         else {
            me.initialization    = undefined;
            publicInitialization = newFct;
         }

         // The current class can access is one private environment
         me.authorizationList[me.id] = 'private';

         /**
         * Initialization function of the class
         * @member {function} new
         * @memberof main.Class.ClassMe
         */
         me.new                      = newFct;
         /**
         * Public environment of the class
         * @member {Class} publicEnv
         * @memberof main.Class.ClassMe
         */
         me.publicEnv                = publicInitialization;
         /**
         * Private environment of the class
         * @member {ClassPrivateEnvironment} thisEnv
         * @memberof main.Class.ClassMe
         */
         me.thisEnv                  = fct.getThisEnv(me);
         /**
         * Return a copy of the ClassMe.{@link main.Class.ClassMe.ancestry|ancestry}.
         * @member {Class[]} getAncestry
         * @memberof main.Class.ClassMe
         */
         me.getAncestry              = fct.getAncestry(me);
         /**
         * Public environment of the class
         * @member {Class} Class
         * @memberof main.Class.ClassMe
         */
         me.Class                    = me.publicEnv;

         me.protectedEnv.toString    = me.publicEnv.toString;
         me.selfEnv.toString         = me.selfEnv.toString;

         me.publicEnv.prototype      = me.prototype.prototype;

         // Properties of the environment
         protectedProperties = { env                  : me.protectedEnv
                               , addPrivate           : false
                               , addProtected         : true
                               , addPublic            : true
                               , include              : true
                               , overridePrivate      : false
                               , overrideProtected    : true
                               , overridePublic       : true };

         publicProperties    = { env                  : me.publicEnv
                               , addPrivate           : false
                               , addProtected         : false
                               , addPublic            : true
                               , include              : true
                               , overridePrivate      : false
                               , overrideProtected    : false
                               , overridePublic       : true };

         selfProperties      = { env                  : me.selfEnv
                               , addPrivate           : false
                               , addProtected         : true
                               , addPublic            : true
                               , include              : true
                               , overridePrivate      : false
                               , overrideProtected    : true
                               , overridePublic       : true };

         thisProperties      = { env                  : me.thisEnv
                               , addPrivate           : false
                               , addProtected         : true
                               , addPublic            : true
                               , include              : true
                               , overridePrivate      : false
                               , overrideProtected    : true
                               , overridePublic       : true };

         listProperties      = [protectedProperties, publicProperties, selfProperties, thisProperties];

         me.levels.push(me);

         // Creating the extended environment
         if (me.extends !== undefined) {
            extendClass(me.extends, listProperties, me.levels, me);
            openExtend  = me.extends.$._open(Core.beacon);
            /** Contains the ancesters of the class.
            This list is build :<ul>
              <li>by retreiving the list of ancesters of the parent class</li>
              <li>copying this list</li>
              <li>adding parent class</li></ul>
            * @member {ClassAncestryList} ancestry
            * @memberof main.Class.ClassMe
            */
            me.ancestry = { me           : openExtend.ancestry.me.slice(0)
                          , publicEnv    : openExtend.ancestry.publicEnv.slice(0)};

            me.ancestry.me.unshift(openExtend);
            me.ancestry.publicEnv.unshift(openExtend.Class);

            me.superEnv  = openExtend.protectedEnv;
            /** ID of topest ancester of the Class.
            * @member {number} rootId
            * @memberof main.Class.ClassMe
            */
            me.rootId    = openExtend.rootId;
         }
         else {
            me.ancestry  = {me:[], publicEnv:[]};
            me.rootId    = me.id;
         }

         me.authorizationList[me.id] = 'private';

         thisProperties.include    = false;
         selfProperties.addPrivate = true;

         // Adding all static members of the definition in the class
         for(name in me.definition.staticEnv) {
            Core.declare ( definition.staticEnv[name] // descriptor
                         , name                       // name
                         , me.thisEnv                 // thisEnv
                         , listProperties             // listEnv
                         , true);                     // isStatic
         }

         /**
         * @class
         * @name Class$
         * @memberof Class
         */
         me.thisEnv.$       = { /** Internal function used by JsPackage to determine weither or not the object has been created by JsPackage.
                                  * @method _patteBlanche
                                  * @memberof Class$
                                */
                                _patteBlanche      : Core.fct._patteBlanche(me)
                                /** This attribute return the current class, always with the highest visibility level accessible.
                                  * @member {Class} Class
                                  * @memberof Class$
                                  */
                              , Class              : me.thisEnv
                                /** @see {@link main.Class.ClassMe|classOf}
                                  * @member {Class} classOf
                                  * @memberof Class$
                                  */
                              , classOf            : me.classOf
                                /** Definition of the class.
                                  * @see {@link main.Class.ClassMe|definition}
                                  * @member {Definition} definition
                                  * @memberof Class$
                                  */
                              , definition         : me.definition.privateEnv
                                /** Extended Class
                                  * @see {@link main.Class.ClassMe|extends}
                                  * @member {Class} extends
                                  * @memberof Class$
                                  */
                              , extends            : me.extends
                                /** Id of the class
                                  * @see {@link main.Class.ClassMe.id|ClassMe.id}
                                  * @member {number} id
                                  * @memberof Class$
                                  */
                              , id                 : me.id
                                /** Interfaces implemented by the class. Return the value of {@link main.Class.ClassMe.implements}.
                                  * @see {@link main.Class.ClassMe.implements|ClassMe.implements}
                                  * @member {Interface[]} implements
                                  * @memberof Class$
                                  * @todo This must be a get function that return a copy of the list
                                  */
                              , implements         : me.implements
                                /** Determine if the class is an abstract class. Return the value of {@link main.Class.ClassMe.isAbstract}.
                                  * @method isAbstract
                                  * @returns {boolean} true: The class is an abstract class<br>false: The class is not an abstract class
                                  * @memberof Class$
                                  */
                              , isAbstract         : fct.isAbstract(me)
                                /** Determine if the class is an final class. Return the value of {@link main.Class.ClassMe.isFinal}.
                                  * @method isFinal
                                  * @returns {boolean} true: The class is final<br>false: The class is not final
                                  * @memberof Class$
                                  */
                              , isFinal            : fct.isFinal(me)
                                /** Return the list of ancestry classes of the current class
                                  * @method getAncestry
                                  * @returns {Class[]}
                                  * @memberof Class$
                                  */
                              , getAncestry        : me.getAncestry
                                /** Function that create a new instance. In public/protected environment, this function is usable only if the class is publicly instanciable.
                                  * @see {@link main.Class.ClassMe.new}
                                  * @method new
                                  * @returns {Instance}
                                  * @memberof Class$
                                  */
                              , new                : me.new
                                /** Determine if the class is a parent class of the Class.
                                  * @see {@link main.Class.ClassMe.parentOf|ClassMe.parentOf}
                                  * @method parentOf
                                  * @param {Class} Class to test
                                  * @returns {boolean} true: The class is a parent<br>false: The class is not a parent
                                  * @memberof Class$
                                  */
                              , parentOf           : me.parentOf
                                /** Public environment of the class
                                  * @see {@link main.Class.ClassMe.publicEnv|ClassMe.publicEnv}
                                  * @member {Class} Public
                                  * @memberof Class$
                                  */
                              , Public             : me.publicEnv
                                /** Self environment of the class
                                  * @see {@link main.Class.ClassMe.selfEnv|ClassMe.selfEnv}
                                  * @member {Class} Self
                                  * @memberof Class$
                                  * @access Private
                                  */
                              , Self               : me.selfEnv
                                /** Super environment of the class
                                  * @see {@link main.Class.ClassMe.Super|ClassMe.Super}
                                  * @member {Class} Super
                                  * @memberof Class$
                                  * @access Protected
                                  */
                              , Super              : me.superEnv
                              , this               : true
                                /** toString function of the class
                                  * @see {@link main.Class.ClassMe.toString|ClassMe.toString}
                                  * @method {Class} toString
                                  * @returns {string} Representation of the class. The representation depends on the current visibility.
                                  * @memberof Class$
                                  */
                              , toString           : fct.ClassToString(me.thisEnv, 'private')
                              /** Type of the object. Value:CLASS
                                  * @see {@link main.Class.ClassMe.type|ClassMe.type}
                                  * @constant {string} type
                                  * @memberof Class$
                                  */
                              , type               : me.type};

         me.protectedEnv.$  = { _patteBlanche      : Core.fct._patteBlanche(me)
                              , Class              : me.Class
                              , classOf            : me.classOf
                              , definition         : me.definition.publicEnv
                              , extends            : me.extends
                              , id                 : me.id
                              , implements         : me.implements
                              , isAbstract         : fct.isAbstract(me)
                              , isFinal            : fct.isFinal(me)
                              , getAncestry        : me.getAncestry
                              , new                : publicInitialization
                              , parentOf           : me.parentOf
                              , Public             : me.publicEnv
                              , Super              : me.superEnv
                              , this               : false
                              , toString           : fct.ClassToString(me.thisEnv, 'super')
                              , type               : me.type};

         me.publicEnv.$     = { _patteBlanche      : Core.fct._patteBlanche(me)
                              , _open              : fct._ProtectedReturn(me)
                              , Class              : me.Class
                              , classOf            : me.classOf
                              , definition         : me.definition.publicEnv
                              , extends            : me.extends
                              , id                 : me.id
                              , implements         : me.implements
                              , isAbstract         : fct.isAbstract(me)
                              , isFinal            : fct.isFinal(me)
                              , getAncestry        : me.getAncestry
                              , new                : publicInitialization
                              , parentOf           : me.parentOf
                              , Public             : me.publicEnv
                              , toString           : fct.ClassToString(me.publicEnv, 'public')
                              , type               : me.type };

         me.selfEnv.$       = { _patteBlanche      : Core.fct._patteBlanche(me)
                              , Class              : me.thisEnv
                              , classOf            : me.classOf
                              , definition         : me.definition.publicEnv
                              , extends            : me.extends
                              , id                 : me.id
                              , implements         : me.implements
                              , isAbstract         : fct.isAbstract(me)
                              , isFinal            : fct.isFinal(me)
                              , getAncestry        : me.getAncestry
                              , new                : fct.getNewObject(me)
                              , parentOf           : me.parentOf
                              , Public             : me.publicEnv
                              , Super              : me.superEnv
                              , type               : me.type
                              , toString           : fct.ClassToString(me.selfEnv, 'self')
                              , Self               : true};

        /** Parent of the class.
          <p>Once the class created, the parent of the class is not yet fixed : if the parent is a package, then the
          package must be sealed. Until the package is unsealed, the parent will be "undefined" : this prevent
          any class to declare itself into a package.</p>
          <p>Each environment doesn't see the same package environment : {@link main.Class.ClassMe.thisEnv|thisEnv}
          and {@link main.Class.ClassMe.selfEnv|selfEnv} see the private environment of the package, other environments
          seeing the public environment.</p>
          * @see {@link memberof Class$.name}
          * @see {@link main.Class.ClassMe.getPrivateParent|ClassMe.getPrivateParent}
          * @see {@link main.Class.ClassMe.getPublicParent|ClassMe.getPublicParent}
          * @member {NamespaceLike} parent
          * @memberof Class$
          */
         jsObject.defineProperty(me.thisEnv.$     , 'parent', { get : me.getPrivateParent });
         jsObject.defineProperty(me.selfEnv.$     , 'parent', { get : me.getPrivateParent });
         jsObject.defineProperty(me.publicEnv.$   , 'parent', { get : me.getPublicParent  });
         jsObject.defineProperty(me.protectedEnv.$, 'parent', { get : me.getPublicParent  });

        /** <p>Name of the class.</p>
        <p>Follow the same rules than {@link memberof Class$.parent}.
          * @see {@link memberof Class$.parent}
          * @see {@link main.Class.ClassMe.getPrivateName|ClassMe.getPrivateName}
          * @see {@link main.Class.ClassMe.getPublicName|ClassMe.getPublicName}
          * @member {string} name
          * @memberof Class$
          */
         jsObject.defineProperty(me.thisEnv.$     , 'name'  , { get : me.getPrivateName   });
         jsObject.defineProperty(me.selfEnv.$     , 'name'  , { get : me.getPrivateName   });
         jsObject.defineProperty(me.publicEnv.$   , 'name'  , { get : me.getPublicName    });
         jsObject.defineProperty(me.protectedEnv.$, 'name'  , { get : me.getPublicName    });

         if (me.definition.initialization !== undefined) {

            me.thisEnv.$.new                 = me.new;
            me.selfEnv.$.new                 = me.selfEnv.$.new;

            if (me.definition.initialization.isPublic()) {
               me.publicEnv.$.new            = me.new;
            }
         }
         else {
            me.publicEnv.$.new = me.new;
         }

         if (me.name !== undefined)
            Core.declareToParent(me);

         // In debug mode, we add a object in all environment that give access to public, private, self and super environment.
         if (debugMode) {

           /** Contains all the environments (public, private, self and super) of the class. This member is accessible only in debug mode.
             * @member {object} debug
             * @memberof Class$
             */
            me.thisEnv.$.debug   = { publicEnv  : me.publicEnv
                                   , privateEnv : me.thisEnv
                                   , selfEnv    : me.selfEnv
                                   , superEnv   : openExtend !== undefined ? openExtend.protectedEnv : undefined};

            me.publicEnv.$.debug = me.thisEnv.$.debug;
            me.selfEnv.$.debug   = me.thisEnv.$.debug;
         }

         // Sealing all the environments
         for(env in listProperties) {
            Core.sealEnv(listProperties[env].env);
         }

         return me.publicEnv;

      };

     /**
      * Create a classe using a Definition object receive in parameter.
      * The definition must be an open definition.
      * @func createObject
      * @memberof main.Class
      * @access private
      * @param {Class} cls Class use to create the object
      * @returns {Instance} Instance created
      */
      var createObject            = function (cls) {

         var classMe, listEnv, me, meExtends, name, protectedEnv, publicEnv, selfEnv, superEnv, thisEnv;

         classMe         = Core.getObject(cls.id);

         /**
         * {@link main.me|me} object of classes
         * @class InstanceMe
         * @memberof main.Class
         * @access private
         */
         me              = { /** Class of the instance
                               * @member {Class} Class
                               * @memberof main.Class.InstanceMe
                               */
                             Class          : classMe.publicEnv
                             /** classMe of the class instance
                               * @member {main.Class.ClassMe} classMe
                               * @memberof main.Class.InstanceMe
                               */
                           , classMe        : classMe
                             /** Definition of the class.
                               * @see {@link main.Class.ClassMe.definition|ClassMe.definition}
                               * @member {DefinitionMe} definition
                               * @memberof main.Class.InstanceMe
                               */
                           , definition     : classMe.definition
                             /** Class extended by the class
                               * @see {@link main.Class.ClassMe.definition|ClassMe.definition}
                               * @member {Class} extends
                               * @memberof main.Class.InstanceMe
                               */
                           , extends        : classMe.extends
                             /** Initialization function of the class
                               * @see {@link main.Class.ClassMe.initialization|ClassMe.initialization}
                               * @member {function} initialization
                               * @memberof main.Class.InstanceMe
                               */
                           , initialization : classMe.initialization
                             /**
                               * @member {array} levels
                               * @memberof main.Class.InstanceMe
                               */
                           , levels         : []
                             /** ClassMe of the extended class
                               * @member {ClassMe} meExtends
                               * @memberof main.Class.InstanceMe
                               */
                           , meExtends      : classMe.definition.extends !== undefined ? classMe.definition.extends.$._open(Core.beacon) : undefined
                             /** Parent of the class. This is the value accessible from private environment.
                               * @member {NamespaceLike} privateParent
                               * @memberof main.Class.InstanceMe
                               */
                           , privateParent  : classMe.privateParent
                             /** Parent of the class. This is the value accessible from public environment.
                               * @member {NamespaceLike} publicParent
                               * @memberof main.Class.InstanceMe
                               */
                           , publicParent   : classMe.publicParent
                             /** Protected environment of the instance
                               * @member {InstanceProtectedEnvironment} protectedEnv
                               * @memberof main.Class.InstanceMe
                               */
                           , protectedEnv   : {}
                             /** Public environment of the instance
                               * @member {Instance} protectedEnv
                               * @memberof main.Class.InstanceMe
                               */
                           , publicEnv      : new classMe.prototype()
                             /** Self environment of the instance
                               * @member {InstanceProtectedEnvironment} selfEnv
                               * @memberof main.Class.InstanceMe
                               */
                           , selfEnv        : {}
                             /** String representing the type of object : INSTANCE
                               * @constant {string} type
                               * @memberof main.Class.InstanceMe
                               */
                           , type           : Constants.OBJECT
                           };

         me.getPrivateParent = Core.fct.getValue(me, 'privateParent');
         me.getPublicParent  = Core.fct.getValue(me, 'publicParent');

         me.getPrivateName   = Core.fct.getValue(me, 'privateName');
         me.getPublicName    = Core.fct.getValue(me, 'publicName');

         // Cr�ation de l'environnement "this"
         me.thisEnv      = Core.getThisEnv(me);

         //D�finition des diff�rents environnements
         protectedEnv    = { env                  : me.protectedEnv
                           , addPrivate           : false
                           , addProtected         : true
                           , addPublic            : true
                           , include              : true
                           , overridePrivate      : false
                           , overrideProtected    : true
                           , overridePublic       : true };

         publicEnv       = { env                  : me.publicEnv
                           , addPrivate           : false
                           , addProtected         : false
                           , addPublic            : true
                           , include              : true
                           , overrideProtected    : false
                           , overridePrivate      : false
                           , overridePublic       : true };

         selfEnv         = { env                  : me.selfEnv
                           , addPrivate           : false
                           , addProtected         : true
                           , addPublic            : true
                           , include              : true
                           , overridePrivate      : false
                           , overrideProtected    : true
                           , overridePublic       : true };

         thisEnv         = { env                  : me.thisEnv
                           , addPrivate           : false
                           , addProtected         : true
                           , addPublic            : true
                           , include              : true
                           , overridePrivate      : false
                           , overrideProtected    : true
                           , overridePublic       : true };

         listEnv         = [protectedEnv, publicEnv, selfEnv, thisEnv];

         // Ajout de Me � la liste des anc�tres
         me.levels.push(me);

         // Si la classe est une classe �tendue, alors on va cr�er les objets parents
         if (me.extends !== undefined) {
            meExtends   = extendObject(me.extends, listEnv, me.levels, me);

            /* Cr�ation de la liste des anc�tres :
               - On r�cup�re la liste des anc�tres de la classe parente
               - On copie la liste
               - On y ajoute la classe parente */
            me.ancestry = { me : meExtends.ancestry.me.slice(0) };

            me.ancestry.me.unshift(meExtends);

            me.superMe  = meExtends;
         }
         else {
            me.ancestry = {me:[]};
         }

         selfEnv.addPrivate = true;
         thisEnv.addPrivate = true;

         // D�claration des attributs et des m�thodes statiques
         for(name in me.definition.staticEnv) {
            /* Note : les descriptor ont d�j� tous �t� d�finis (dans createClass).
            thisEnv n'a donc pas de sens ici.*/
            Core.declare ( me.definition.staticEnv[name] // descriptor
                         , name                          // name
                         , {}                            // thisEnv
                         , listEnv                       // listEnv
                         , true);                        // isStatic
         }

         thisEnv.include    = false;

         // D�claration des attributs et m�thodes
         for(name in me.definition.objectEnv) {
            Core.declare ( me.definition.objectEnv[name]// descriptor
                         , name                         // name
                         , me.thisEnv                   // thisEnv
                         , listEnv                      // listEnv
                         , false);                      // isStatic
         }

         // Cr�ation de $
         me.thisEnv.$    = { _patteBlanche  : Core.fct._patteBlanche(me)
                           , Class          : classMe.thisEnv
                           , initialization : undefined
                           , isOpen         : function () { return false; } //TODO : optimiser
                           , parent         : classMe.privateParent
                           , Public         : me.publicEnv
                           , Self           : me.selfEnv
                           , Super          : me.superMe !== undefined ? me.superMe.protectedEnv : undefined
                           , this           : true
                           , type           : me.type};

         me.selfEnv.$    = { _patteBlanche  : Core.fct._patteBlanche(me)
                           , Class          : classMe.thisEnv
                           , initialization : undefined
                           , parent         : classMe.privateParent
                           , Public         : me.publicEnv
                           , Self           : me.selfEnv
                           , Super          : me.thisEnv.$.Super
                           , type           : me.type};

         me.protectedEnv.$ = { _patteBlanche  : Core.fct._patteBlanche(me)
                             , Class          : classMe.thisEnv
                             , initialization : undefined
                             , parent         : classMe.publicParent
                             , Public         : me.publicEnv
                             , Self           : me.selfEnv
                             , Super          : me.thisEnv.$.Super
                             , type           : me.type};

         me.publicEnv.$  = { _patteBlanche : Core.fct._patteBlanche(me)
                           , Class         : classMe.publicEnv
                           , parent         : classMe.publicParent
                           , Public        : me.publicEnv
                           , Super         : me.superMe !== undefined ? me.superMe.publicEnv : undefined
                           , type          : me.type};


         me.publicEnv.$.toString    = fct.InstanceToString(me, 'public');
         me.protectedEnv.$.toString = fct.InstanceToString(me, 'super');
         me.thisEnv.$.toString      = fct.InstanceToString(me, 'this');
         me.selfEnv.$.toString      = fct.InstanceToString(me, 'self');

         if (me.initialization !== undefined) {

            me.thisEnv.$.initialization = me.initialization.getValue();
            me.selfEnv.$.initialization = me.thisEnv.$.initialization;

            if (me.initialization.isPublic()) {
               me.publicEnv.$.initialization = me.thisEnv.$.initialization;
            }
         }

         if (debugMode) {
            me.thisEnv.$.debug   = { publicEnv  : me.publicEnv
                                   , privateEnv : me.thisEnv
                                   , selfEnv    : me.selfEnv
                                   , superEnv   : meExtends !== undefined ? meExtends.protectedEnv : undefined };

            me.publicEnv.$.debug = me.thisEnv.$.debug;
            me.selfEnv.$.debug   = me.thisEnv.$.debug;
         }

         Core.sealEnv(me.publicEnv   , true, true);
         Core.sealEnv(me.selfEnv     , true, true);
         Core.sealEnv(me.protectedEnv, true, false);
         Core.sealEnv(me.thisEnv     , true, true);

         return me;
      };

     /**
      * This function extend a class
      * The definition must be an open definition.
      * @func extendClass
      * @memberof main.Class
      * @access private
      * @param {Class} cls Class use to create the object
      * @param {main.DeclarationProperty[]} listEnv List of all declaration properties
      * @param levels
      * @param context
      * @returns {Instance} Instance created
      */
      var extendClass             = function(cls, listEnv, levels, context) {
         var classMe, listAncestry, me, name, openClass, selfEnv, thisEnv;

         // On r�cup�re l'objet "Me" de la classe finale (celle cr�ee par createClass)
         classMe        = Core.getObject(cls.$.id);

         context.authorizationList[classMe.id] = 'protected';

         // Cr�ation de l'objet Me de la classe courante
         me             = { Class        : classMe.publicEnv
                          , context      : context
                          , definition   : classMe.definition
                          , extends      : classMe.definition.extends
                          , levels       : levels
                          , name         : classMe.name
                          , type         : Constants.CLASS};

         me.thisEnv     = Core.getThisEnv(me);

         me.thisEnv.$   = { _patteBlanche : classMe.thisEnv.$._patteBlanche
                          , Class         : classMe.thisEnv.$.Class
                          , classOf       : classMe.classOf
                          , definition    : classMe.thisEnv.$.definition
                          , extends       : classMe.thisEnv.$.extends
                          , id            : classMe.thisEnv.$.id
                          , implements    : classMe.thisEnv.$.implements
                          , isAbstract    : classMe.thisEnv.$.isAbstract
                          , isFinal       : classMe.thisEnv.$.isFinal
                          , getAncestry   : classMe.thisEnv.$.getAncestry
                          , new           : classMe.thisEnv.$.new
                          , parentOf      : classMe.parentOf
                          , Public        : classMe.thisEnv.$.Public
                          , Self          : classMe.thisEnv.$.Self
                          , Super         : classMe.thisEnv.$.Super
                          , this          : classMe.thisEnv.$.this
                          , toString      : Core.fct.toString(me)
                          , type          : classMe.thisEnv.$.type };

         thisEnv        = { env                  : me.thisEnv
                          , include              : true
                          , addPrivate           : false
                          , addPublic            : true
                          , addProtected         : true
                          , overrideProtected    : true
                          , overridePrivate      : false
                          , overridePublic       : true };

         listEnv.push(thisEnv);

         levels.push(me);

         jsObject.defineProperty(me.thisEnv.$     , 'parent', { get : classMe.getPrivateParent });
         jsObject.defineProperty(me.thisEnv.$     , 'name'  , { get : classMe.getPrivateName   });

         // Si la classe courante � une classe parente, alors on la cr�e
         if (me.extends !== undefined) {
            extendClass(me.extends, listEnv, levels, context);
         }

         thisEnv.include     = false; // On l'exclu car il va servir de thisEnv juste apr�s

         for(name in me.definition.staticEnv) {
            /* Note : thisEnv et selfEnv sont ind�pendant dans les classes parentes :
               Si on surcharge une m�thode de thisEnv, selfEnv ne doit pas changer
            */
            Core.declare ( me.definition.staticEnv[name] // descriptor
                         , name                          // name
                         , me.thisEnv                    // thisEnv
                         , listEnv                       // listEnv
                         , true);                        // isStatic
         }

         // Dans les �tapes suviantes, les attributs publiques et prot�g�s devront �tre surcharg�s
         thisEnv.include    = true;

         return;

      };

     /**
      * This function extend a object with the parent classes
      * The definition must be an open definition.
      * @func extendObject
      * @memberof main.Class
      * @param {Class} cls Class use to create the object
      * @param {main.DeclarationProperty[]} listEnv List of all declaration properties
      * @param levels
      * @param parentMe
      * @returns {Instance} Instance created
      * @access private
      */
      var extendObject            = function (cls, listEnv, levels, parentMe) {
         var classMe, me, meExtends, name, openClass, protectedEnv, selfEnv, superEnv, thisEnv;

         // R�cup�ration de l'objet Me de la classe finale
         classMe        = Core.getObject(cls.$.id);

         // Cr�ation de Me de l'objet
         me             = { Class        : classMe.publicEnv
                          , classMe      : classMe
                          , definition   : classMe.definition
                          , extends      : classMe.definition.extends
                          , levels       : levels
                          , protectedEnv : {}
                          , selfEnv      : {}
                          , thisEnv      : {}
                          , type         : Constants.OBJECT};

         //D�finition des diff�rents environnements. Cf. Core.declare
         protectedEnv    = { env                  : me.protectedEnv
                           , addPrivate           : false
                           , addProtected         : true
                           , addPublic            : true
                           , include              : true
                           , overridePrivate      : false
                           , overrideProtected    : true
                           , overridePublic       : true };

         selfEnv        = { env                  : me.selfEnv
                          , include              : true
                          , addPrivate           : false
                          , addPublic            : true
                          , addProtected         : true
                          , overrideProtected    : true
                          , overridePrivate      : false
                          , overridePublic       : true };

         thisEnv        = { env                  : me.thisEnv
                          , include              : true
                          , addPrivate           : false
                          , addProtected         : true
                          , addPublic            : true
                          , overridePrivate      : false
                          , overrideProtected    : true
                          , overridePublic       : true };

         listEnv.push(protectedEnv);
         listEnv.push(selfEnv);
         listEnv.push(thisEnv);

         levels.push(me);

         // Si l'objet la classe courante � elle aussi une clase parente, alors il faut cr�er l'objet parent
         if (me.extends !== undefined) {
            meExtends            = extendObject(me.definition.extends, listEnv, levels, parentMe);

            /* Cr�ation de la liste des anc�tres :
               - On r�cup�re la liste des anc�tres de la classe parente
               - On copie la liste
               - On y ajoute la classe parente */
            me.ancestry = { me           : meExtends.ancestry.me.slice(0) };

            me.ancestry.me.unshift(meExtends);

            me.superMe           = meExtends;
         }
         else {
            me.ancestry = {me:[]};
         }

         selfEnv.addPrivate   = true;

         // Ajouts des propri�t�s statiques
         for(name in me.definition.staticEnv) {
            /* Note : les descriptor ont d�j� tous �t� d�finis (dans createClass).
            thisEnv n'a donc pas de sens ici.*/
            Core.declare ( me.definition.staticEnv[name]   // descriptor
                         , name                            // name
                         , {}                              // thisEnv
                         , listEnv                         // listEnv
                         , true);                          // isStatic
         }

         thisEnv.include     = false;

         // Ajouts des propri�t�s non statiques
         for(name in me.definition.objectEnv) {
            Core.declare ( me.definition.objectEnv[name] // descriptor
                         , name                          // name
                         , me.thisEnv                    // thisEnv
                         , listEnv                       // listEnv
                         , false);                       // isStatic
         }

         me.thisEnv.$      = { Class          : me.Class
                             , isOpen         : function () { return false; } //TODO : optimiser
                             , initialization : fct.getInitialization(me)
                             , parent         : classMe.privateParent
                             , Public         : parentMe.publicEnv
                             , Self           : me.selfEnv
                             , Super          : me.superMe !== undefined ? me.superMe.protectedEnv : undefined
                             , this           : true
                             , type           : me.type};

         me.selfEnv.$      = { Class          : me.Class
                             , initialization : me.thisEnv.$.initialization
                             , parent         : classMe.privateParent
                             , Public         : parentMe.publicEnv
                             , Self           : me.selfEnv
                             , Super          : me.thisEnv.$.Super
                             , type           : me.type
                             };

         me.protectedEnv.$ = { Class          : me.Class
                             , initialization : me.thisEnv.$.initialization
                             , parent         : classMe.publicParent
                             , Public         : parentMe.publicEnv
                             , Super          : me.thisEnv.$.Super
                             , type           : me.type };

         // Dans les �tapes suviantes, les attributs publiques et prot�g�s devront �tre surcharg�s
         thisEnv.addPrivate   = false;
         thisEnv.include      = true;
         selfEnv.include      = false;
         protectedEnv.include = false;

         return me;

      };

      /**
      @namespace fct
      @memberof main.Class
      */
      var fct                     = (function () {

         var ClassToString             = function(env, level) {
            return function() {
               return (level !== undefined ? '('+level+') ' : '') + 'Class' + (env.name !== undefined ? ' : '+env.name : '');
            };
         };

         var classOf                   = function(me) {
            return function() {

               var i, instanceMe, result;

               if (arguments.length === 0)
                  return false;

               if (arguments.length === 1) {
                  instanceMe = Core.getMe(arguments[0]);
                  return !instanceMe ? false : instanceMe.classMe === me;
               }

               result = [];

               for(i in arguments) {
                  instanceMe = Core.getMe(arguments[i]);
                  result.push(!instanceMe ? false : instanceMe.classMe === me);
               }

               return result;

            };
         };

         /*----------------------------------------------------------------------------------------
         |                                 Fonction : getAncestry
         |-----------------------------------------------------------------------------------------
         | Description :
         |   Cr�e une fonction retournant la liste des anc�tres de la classe.
         |
         |-----------------------------------------------------------------------------------------
         | Param�tre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var getAncestry               = function (me) {
            return function () {
               return me.ancestry.publicEnv.slice(0);
            };
         };

         var getInitialization         = function(me) {
            if (me.classMe.initialization === undefined)
               return undefined;

            return function() {
               me.classMe.initialization.getValue().apply(me.thisEnv, arguments);
            };
         };

         /*----------------------------------------------------------------------------------------
         |                                 Fonction : getNewObject
         |-----------------------------------------------------------------------------------------
         | Description :
         |   Cr�e une fonction "getNewObject". Cette fonction permet de cr�er une nouvelle instance
         | de la classe.
         |
         |-----------------------------------------------------------------------------------------
         | Param�tre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var getNewObject              = function (me) {
            var init;
            if (me.initialization !== undefined) {
               init = me.initialization.getValue();
               return function () {
                  // Cette fonction doit �tre appel�e en utilisant l'op�rateur "new" (on impose la
                  // syntaxe). Si ce n'est pas le cas, alors on retourne undefined.
                  // On d�tecte l'appel via "new" parce que dans le cas contraire, "this" === undefined.
                  if (this === undefined)
                     return undefined;
                  var obj = createObject(me);
                  init.apply(obj.thisEnv, arguments);
                  return obj.publicEnv;
               };
            }
            else {
               return function () {
                  if (this === undefined)
                     return undefined;
                  var obj = createObject(me);
                  return obj.publicEnv;
               };
            }
         };

         var getThisEnv                = function(me) {
            var init;
            if (me.initialization !== undefined) {
               init = me.initialization.getValue();
            }
            return function() {
               if (this === undefined)
                  return Core.openObject(me, arguments[0]);

               var obj = createObject(me);

               if (init !== undefined)
                  init.apply(obj.thisEnv, arguments);

               return obj.publicEnv;
            };
         };

         /*----------------------------------------------------------------------------------------
         |                                 Fonction : isAbstract
         |-----------------------------------------------------------------------------------------
         | Description :
         |   Cr�e une nouvelle fonction "isAbstract" pour chaque classes. Cette fonction permet de
         | d�terminer si la classe est une classe abstraite ou non.
         |
         |-----------------------------------------------------------------------------------------
         | Param�tre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var isAbstract                = function (me) {
            return function() {
               return me.isAbstract;
            };
         };

         var InstanceToString          = function(env, level) {
            return function() {
               return (level !== undefined ? '('+level+') ' : '') + 'Instance';
            };
         };

         /*----------------------------------------------------------------------------------------
         |                                 Fonction : isFinal
         |-----------------------------------------------------------------------------------------
         | Description :
         |   Cr�e une nouvelle fonction "isFinal" pour chaque classes. Cette fonction permet de
         | d�terminer si la classe est une classe finale ou non.
         |
         |-----------------------------------------------------------------------------------------
         | Param�tre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var isFinal                   = function (me) {
            return function() {
               return me.isFinal;
            };
         };

         var notInstanciableFunction   = function(me) {
            return function() {
               onerror(new Errors.NotInstanciableClass());
            };
         };

         var parentOf                  = function(me) {
            return function() {

               var i, instanceMe, j, parentOf, result;

               if (arguments.length === 0)
                  return false;

               if (arguments.length === 1) {
                  instanceMe = Core.getMe(arguments[0]);

                  if (!instanceMe)
                     return false;

                  if (instanceMe.classMe === me)
                     return true;

                  for(j in instanceMe.ancestry.me) {

                     if (instanceMe.ancestry.me[j].classMe === me)
                        return true;
                  }

                  return false;
               }

               result = [];

               for(i in arguments) {
                  parentOf = false;
                  instanceMe = Core.getMe(arguments[i]);

                  if (!instanceMe)
                     parentOf = false;
                  else if (instanceMe.classMe === me) {
                     parentOf = true;
                  }
                  else {
                     for(j in instanceMe.ancestry.me) {
                        if (instanceMe.ancestry.me[j].classMe === me)
                           parentOf = true;
                     }
                  }

                  result.push(parentOf);
               }

               return result;

            };
         };

         /*----------------------------------------------------------------------------------------
         |                                 Fonction : _ProtectedReturn
         |-----------------------------------------------------------------------------------------
         | Description :
         |   Cr�e une nouvelle fonction "_ProtectedReturn" pour chaque classes. Elle a r�le de
         |   retourner une l'objet "Me" si elle re�oit Core.beacon en param�tre.
         |
         |-----------------------------------------------------------------------------------------
         | Param�tre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var _ProtectedReturn          = function (me) {
            return function (b) {
               // Si on re�oit autre chose que Core.beacon, on retourne undefined
               if (b != Core.beacon) {
                  return undefined;
               }
               return me;
            };
         };

         return { classOf                 : classOf
                , ClassToString           : ClassToString
                , getAncestry             : getAncestry
                , getInitialization       : getInitialization
                , getNewObject            : getNewObject
                , getThisEnv              : getThisEnv
                , InstanceToString        : InstanceToString
                , isAbstract              : isAbstract
                , isFinal                 : isFinal
                , notInstanciableFunction : notInstanciableFunction
                , parentOf                : parentOf
                , _ProtectedReturn        : _ProtectedReturn };
      })();

      var isClass                 = function (obj) {

         var e, me;

         try {
            if (obj.$ === undefined)
               return false;

            if (obj.$.id === undefined)
               return false;

            me = Core.getObject(obj.$.id);

            if (me === undefined)
               return false;

            return me.publicEnv === obj && me.type === Constants.CLASS;
         }
         catch (e) {
            return false;
         }
      };

      var newClass                = function () {

         var definition;

         // Valeurs par d�faut
         definition = { $ : { toSeal : true
                              , parent : undefined
                            , name   : undefined }};

         definition = Core.merge(arguments, definition);

         definition = Definition.new(definition, {$:{sealed:false}}).$._open(Core.beacon);

         // On v�rifie que la d�finition est valide pour une classe.
         validateDefinition(definition);

         // On scelle la d�finition
         definition.publicEnv.$.seal();

         return createClass(definition);
      };
      /*-------------------------------------------------------------------------------------------
      |                          Definition Private validateDefinition
      |--------------------------------------------------------------------------------------------
      |
      | Description :
      |   Valide la d�finition pour la cr�ation de classe.
      |   Cette fonction est appel�e par la fonction Definition.validateDefinition
      |
      |--------------------------------------------------------------------------------------------
      | Param�tres :
      |   . definition : d�finition, ouverte, � valider.
      |
      |------------------------------------------------------------------------------------------*/
      var validateDefinition      = function (definition) {

         var desc, error, i, interfaces, itf, message, name, parent;

         if (definition.extends !== undefined) {
            parent  = definition.extends.$._open(Core.beacon);

            if (parent.isFinal)
               onerror(new Errors.InvalidDefinition('Cannot extend a final Class'));
          }

         for(name in definition.publicEnv) {
            if (name === '$') continue;
            desc = definition.publicEnv[name];
            if (Descriptor.isDescriptor(desc)) {
               if (desc.isConstant() && !desc.isStatic()) {
                  onerror(new Errors.InvalidDefinition('Constant attribute must be static'));
               }

               if (!definition.isAbstract && desc.isMethod() && !desc.isValueSetted())
                  onerror(new Errors.InvalidDefinition('No function define for the method : '+name));
            }
         }

         return;
      };

      var maxID                   = 0;

      newClass.isClass = isClass;
      newClass.new     = newClass;

      return { new                : newClass
             , isClass            : isClass
             , namespace          : newClass
             , validateDefinition : validateDefinition
             };
   })();

   Constants             = {
        DEFINITION        : 'Definition'
      , DESCRIPTOR        : 'Descriptor'
      , CLASS             : 'Class'
      , INTERFACE         : 'Interface'
      , OBJECT            : 'Instance'
      , PACKAGE           : 'Package'
      , NAMESPACE         : 'Namespace'
      , $                 : '$'
      , mainNamespaceName : 'ClassAndPackageObjectCore'
      , public        : {
            Class : {
               $ : {
                  interfaces : 'interfaces'
               }
            }
        }
   };

   /**
    * This namespace regroup all common functions of JsPackage
    * @namespace Core
    * @memberof main
    * @access private
    */
   Core                  = (function () {

      var beacon                  = {0:0};
      var maxID                   = 0;
      var beaconID                = 1;
      var listObjects             = {};

      var createPackage           = function (definition) {
         var def = Definition.convertDefinition(definition, Constants.PACKAGE);
         return Package.createPackage(def);
      };

      /**
      * <p>This function declare in all environments present in listEnv the member describe by descriptor.</p>
      * @function declare
      * @memberof main.Core
      * @param {Descriptor} descriptor Descriptor of the member
      * @param {string} name Name of the member
      * @param {ClassThisEnv|InstanceThisEnv|PackageThisEnv} thisEnv Private environment of the object
      * @param {main.DeclarationProperty} listEnv Environment inwich the member will be added
      * @param {boolean} isStatic Determin weither (true) or not (false) the member is a static member
      */
      var declare                 = function (descriptor, name, thisEnv, listEnv, isStatic) {
         var add, allowed, alreadyDefined, desc, env, i, property;

         if (isStatic && (descriptor.property !== undefined)) {
            /* Les membres statiques sont cr�es par la classe et leur propri�t�es sont conserv�es
                dans le descripteur. De fait, on a pas � calculer leur propri�t�s, juste les
               rechercher*/
            property    = descriptor.property;
         }
         else {
            if (descriptor.isMethod)
               property = declareMethod(thisEnv, name, descriptor);
            else
               property = declareAttribute(thisEnv, name, descriptor);

            if (isStatic)
               // Si la propri�t� est statique, on la conserve
               descriptor.property = property;
         }

         // Ajout de la propri�t� dans tout les environnements
         for(i in listEnv) {
            desc = listEnv[i];
            if (desc.include) {
               env  = desc.env;
               add  = false;
               alreadyDefined = jsObject.getOwnPropertyDescriptor(env, name) !== undefined;

               if (descriptor.isPrivate && desc.addPrivate)
                  add = !(alreadyDefined && !desc.overridePrivate);
               else if (descriptor.isPublic && desc.addPublic)
                  add = !(alreadyDefined && !desc.overridePublic);
               else if (descriptor.isProtected && desc.addProtected)
                  add = !(alreadyDefined && !desc.overrideProtected);

               if (add) {
                  jsObject.defineProperty(env, name, property);
               }
/*               else {
                  delete(env, name);
               }*/
            }
         }
      };

      var declareAttribute        = function (thisEnv, name, descriptor) {
         var isConstant, property;
         isConstant = descriptor.isConstant;
         jsObject.defineProperty(thisEnv, name, { writable     : !isConstant
                                                , enumerable   : true
                                                , configurable : true
                                                , value        : descriptor.value});

         property = { get          : function ()    { return thisEnv[name]; }
                    , configurable : true
                    , enumerable   : true};

         if (!isConstant) {
            property.set = function (val) { thisEnv[name] = val;  };
         }

         return property;
      };

      var declareMethod           = function (thisEnv, name, descriptor) {
         var Method, GetMethod;

         Method    = descriptor.value;

         GetMethod = function () { return Method.apply(thisEnv, arguments); };

         jsObject.defineProperty(thisEnv, name, { writable     : false
                                                , enumerable   : true
                                                , configurable : true
                                                , value        : GetMethod});

         return { value        : GetMethod
                , configurable : true
                , enumerable   : true};
      };

      var declareToParent         = function(me) {

         var addPublicEnv, desc, parent, properties, openParent;

         parent = me.parent;

         if (me.parent === undefined) {
            desc   = Descriptor.new();
            parent = globalThis;
         }
         else {
            desc   = parent;
            parent = desc.getValue();
         }

         if (me.type === Constants.CLASS || me.type === Constants.PACKAGE) {
            me.privateParent = parent;
            me.privateName   = me.name;
            if (desc.isPublic()) {
               me.publicParent = parent;
               me.publicName   = me.name;
            }
         }

         if (Package.isPackage(parent)) {

            if (parent.$.isSealed())
               onerror(new Errors.SealedObject(parent));

            properties = jsObject.getOwnPropertyDescriptor(parent, me.name);

            if (properties === undefined)
               onerror(new Errors.InvalidDefinition(me.type +' "'+me.name+'" not defined in package'));

            if (!properties.writable || !properties.configurable)
               onerror(new Errors.InvalidDefinition('"'+me.name+'" isn\'t configurable or writable'));

            // Si la valeur est un descripteur, alors on y ajoute la valeur
            if (Descriptor.isDescriptor(parent[me.name])) {
               parent[me.name].set(me.publicEnv);
               return;
            }
            else {
               parent[me.name] = me.publicEnv;
            }

            return;
         }

         jsObject.defineProperty(parent, me.name, { enumerable   : true
                                                  , configurable : false
                                                  , writable     : false
                                                  , value        : me.publicEnv});

      };

      var fct                     = (function () {

         var _patteBlanche   = function (me) {
            return function () {
                var id;
                id = ++beaconID;
                beacon[id] = me;
                return id;
            };
         };

         var alias         = function(me, name, settable, enumerable) {

            var get, set;

            get = function() {
               return me[name];
            };

            if (settable) {
               set = function(value) {
                  if (me.isSealed)
                     return;
                  me[name] = value;
               };
            }

            return { configurable : false
                   , enumerable   : enumerable
                   , get          : get
                   , set          : set};
         };

         var toString        = function (me) {
            return function () {
               var str;
               if (me.name === undefined)
                  str = me.type;
               else
                  str = me.type + ' : ' + me.name;
               return str;
            };
         };

         var value           = function(value, enumerable) {
            return { configurable : false
                   , enumerable   : enumerable === undefined ? true : enumerable
                   , value        : value
                   , writable     : false};
         };

         var getValue        = function(object, name) {
            return function() { return object[name]; };
         };

         return { _patteBlanche : _patteBlanche
                , alias         : alias
                , getValue      : getValue
                , toString      : toString
                , value         : value};
      })();

      var hasNonDymanicProperty   = function (object, name, valueType) {

         if (!hasProperty(object, name))
            return false;

         if (isDynamicValue(object, name))
            return false;

         if (valueType !== undefined)
            if (typeof(object[name]) != valueType)
               return false;

         return true;
      };

      /*----------------------------------------------------------------------------------------
      |                                        hasProperty
      |-----------------------------------------------------------------------------------------
      |
      | V�rifie si l'objet "object" � d�fini la propri�t� "property". Cela ne v�rifie pas si la
      | propri�t� � une valeur.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . object   : Objet � annalyser
      |   . property : Nom de la propri�t� � tester
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  true  : la propri�t� est d�finie
      |  false : la propri�t� n'est pas d�finie
      |
      |-----------------------------------------------------------------------------------------
      | Exemple :
      |
      | a = {};
      | console.log(hasProperty(a, 'test'); // false
      |
      | a.test = undefined;
      | console.log(hasProperty(a, 'test'); // true
      |
      |---------------------------------------------------------------------------------------*/
      var hasProperty             = function (object, property) {
         return jsObject.getOwnPropertyNames(object).indexOf(property) != -1;
      };

      var getMe                   = function (obj) {

         var e, id, result, type;

         if (obj === null || (typeof(obj) !== 'object' && typeof(obj) !== 'function')) return false;

         if (obj.$ === undefined)
            return false;

         id = obj.$._patteBlanche();

         try {
            result = beacon[id].publicEnv === obj ? beacon[id] : false;
         }
         catch(e) {
            result = false;
         }

         beacon[id] = undefined;

         return result;

      };

      /*----------------------------------------------------------------------------------------
      |                                       getDefinition
      |-----------------------------------------------------------------------------------------
      |
      | Cette fonction est appel�e par les fonctions "newObject" (ex: newClass, newDefinition,
      | ...).
      | Elle re�oit en param�tre la liste des arguments pass� en param�tre de ces fonctions.
      | Elle va ensuite v�rifier qu'il s'agit d'objets utilisables comme d�finition, ou des
      | d�finitions, et ensuite merger l'ensemble de ces objets dans une nouvelle d�finition
      | via la fonction Core.merge. Seront merg� aussi les �l�ments de '$'.
      | Notes :
      |   . Si un des param�tres est undefined, alors on consid�re que c'est une d�finition
      |     vide ({}).
      |   . Si un des param�tres n'est pas compatible avec une d�finition (cad non un objet
      |     ou une fonction), alors l'erreur Errors.InvalidDefinition est lev�e.
      | Note : l'objet retourn�e n'est PAS une instance de Definition. Il s'agit juste d'une
      | objet classique.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . definitionList : Liste des objets d�finitions
      |
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  L'objet nouvellement cr�e
      |
      |-----------------------------------------------------------------------------------------
      | Exception:
      |  InvalidDefinition : au moins un �l�ment de definitionList n'est pas utilisable comme
      |     d�finition.
      |
      |---------------------------------------------------------------------------------------*/
      var getDefinition           = function(definitionList) {

         var def, i;

         for(i in definitionList) {
            def = definitionList[i];
            if (def === undefined) continue;
            if (!Definition.isDefinition(def) && typeof(def) !== 'object' && typeof(def)!=='function')
               onerror(new Errors.InvalidDefinition('Not a definition object'));
         }

         return Core.merge(definitionList);
      };

      var getNewId                = function(me) {
         var id;
         id = maxID++;

         listObjects[id] = me;

         return id;
      };

      var getObject               = function(id) {
         return listObjects[id];
      };

      /*-------------------------------------------------------------------------------------------
      |                                 Fonction : getThisEnv
      |--------------------------------------------------------------------------------------------
      | Description :
      |   Cr�e une nouvelle fonction "this" pour chaque class, package.
      |
      |--------------------------------------------------------------------------------------------
      | Param�tre :
      |   me : Objet "Me" de la classe
      |
      |------------------------------------------------------------------------------------------*/
      var getThisEnv              = function (me) {
         return function (obj) {
            return Core.openObject(me, obj);
         };
      };

      /*----------------------------------------------------------------------------------------
      |                                       isDynamicValue
      |-----------------------------------------------------------------------------------------
      |
      | V�rifie que la propriet� "property" de l'objet "object" n'est pas une propriet�
      | dynamique.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . object   : Objet � annalyser
      |   . property : Nom de la propri�t� � tester
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  true  : la propri�t� est dynamique
      |  false : la propri�t� n'est pas dynamique
      |
      |-----------------------------------------------------------------------------------------
      | Exemple :
      |
      | a = {};
      | a.test1 = 10;
      | Object.defineProperty(a, 'test2', {get : function() { return 1 });
      |
      | console.log(hasProperty(a, 'test1'); // false
      | console.log(hasProperty(a, 'test2'); // true
      |
      |---------------------------------------------------------------------------------------*/
      var isDynamicValue          = function (object, property) {
         return jsObject.getOwnPropertyDescriptor(object, property).get !== undefined;
      };

      var initialize              = function () {
         initializeErrors();
         initializeNamespaces();
         initializeGlobalThis(globalThis);
      };

      var initializeErrors        = function () {
         var error, name;
         for(name in Errors) {
            if (name === '$') continue;
            error = Errors[name];
            error.prototype          = new Error();
            error.prototype.constructor = error;
         }
      };

      var initializeGlobalThis    = function (env) {

         // Descripteurs
         jsObject.defineProperty(env, 'Public'    , { get   : function () {return Descriptor.new().Public;    }});
         jsObject.defineProperty(env, 'Protected' , { get   : function () {return Descriptor.new().Protected; }});
         jsObject.defineProperty(env, 'Private'   , { get   : function () {return Descriptor.new().Private;   }});
         jsObject.defineProperty(env, 'Static'    , { get   : function () {return Descriptor.new().Static;    }});
         jsObject.defineProperty(env, 'Constant'  , { get   : function () {return Descriptor.new().Constant;  }});
         jsObject.defineProperty(env, 'Attribute' , { get   : function () {return Descriptor.new().Attribute; }});
         jsObject.defineProperty(env, 'Method'    , { get   : function () {return Descriptor.new().Method;    }});
         jsObject.defineProperty(env, 'Final'     , { get   : function () {return Descriptor.new().Final;     }});

      };

      var initializeNamespaces    = function () {

         var token;

         Class.namespace      = Namespace.new({ $ : { global      : true
                                                    , name        : 'Class'
                                                    , object      : Class.namespace
                                                    , seal        : false
                                                    , sealable    : false}});

         Definition.namespace = Namespace.new({ $ : { global      : true
                                                    , name        : 'Definition'
                                                    , object      : Definition.namespace
                                                    , seal        : false
                                                    , sealable    : false}});

         Descriptor.namespace = Namespace.new({ $ : { global      : true
                                                    , name        : 'Descriptor'
                                                    , object      : Descriptor.namespace
                                                    , seal        : false
                                                    , sealable    : false}});

         Interface.namespace  = Namespace.new({ $ : { global      : true
                                                    , name        : 'Interface'
                                                    , object      : Interface.namespace
                                                    , seal        : false
                                                    , sealable    : false}});

         Namespace.namespace  = Namespace.new({ $ : { global      : true
                                                    , name        : 'Namespace'
                                                    , object      : Namespace.namespace
                                                    , seal        : false
                                                    , sealable    : false}});

         Package.namespace    = Namespace.new({ $ : { global      : true
                                                    , name        : 'Package'
                                                    , object      : Package.namespace
                                                    , seal        : false
                                                    , sealable    : false}});

         token = {};

         publicEnv = Namespace.new({ // Constructeurs
                                     Class             : Descriptor.new().set(Class.namespace     )
                                   , Definition        : Descriptor.new().set(Definition.namespace)
                                   , Descriptor        : Descriptor.new().set(Descriptor.namespace)
                                   , Interface         : Descriptor.new().set(Interface.namespace )
                                   , Namespace         : Descriptor.new().set(Namespace.namespace )
                                   , Package           : Descriptor.new().set(Package.namespace   )
                                     // Constantes et listes
                                   , errors            : Namespace.new(Errors)
                                   , Object            : jsObject
                                   , globalContext     : globalThis
                                   , version           : version
                                     // Methods
                                   , convertDefinition : Definition.convertDefinition
                                   , declareInto       : initialiseInto_public
                                   , isDescriptor      : Descriptor.isDescriptor
                                   , isClass           : Class.isClass
                                   , isDefinition      : Definition.isDefinition
                                   , isInterface       : Interface.isInterface
                                   , isNamespace       : Namespace.isNamespace
                                   , isPackage         : Package.isPackage
                                   , $                 : { global : true
                                                         , name   : globalName
                                                         , seal   : true}});

         Class      .namespace.Core    = publicEnv;
         Definition .namespace.Core    = publicEnv;
         Descriptor .namespace.Core    = publicEnv;
         Interface  .namespace.Core    = publicEnv;
         Namespace  .namespace.Core    = publicEnv;
         Package    .namespace.Core    = publicEnv;

         Class      .namespace.Version = Version;

         publicEnv.$.seal();
      };

      var initialiseInto_public   = function(env) {

         initializeGlobalThis(env);

         jsObject.defineProperty(env, 'Class'     , { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv.Class});

         jsObject.defineProperty(env, 'Namespace' , { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv.Namespace});

         jsObject.defineProperty(env, 'Package'   , { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv.Package});

         jsObject.defineProperty(env, 'Definition', { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv.Definition});

         jsObject.defineProperty(env, 'Descriptor', { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv.Descriptor});

         jsObject.defineProperty(env, 'Interface' , { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv.Interface});

         jsObject.defineProperty(env, globalName  , { enumerable   : true
                                                    , writable     : false
                                                    , configurable : false
                                                    , value        : publicEnv});

      };

      /*----------------------------------------------------------------------------------------
      |                                       merge
      |-----------------------------------------------------------------------------------------
      |
      | Merge les propri�t�s de plusieurs objets. Si "intoTheFirst" �gale true alors l'ensemble
      | sera merg� dans le premier �l�ment. Sinon, dans un  nouvel �l�ment.
      | Le merge se fait du premier �l�ment de la liste (index 0) au dernier �l�ment.
      | L'�l�ment le plus � droite (cad qui a le plus grand indice dans le tableau) �crasera
      | les propri�t�s des autres s'il les d�finie.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . args         : Liste des objets � merger
      |   . intoTheFirst : D�cide si oui (true) ou non (false) les �l�ments doivent �tre ins�r�s
      |     dans le premier �l�ment ou non.
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  Objet correspondant au merge
      |
      |---------------------------------------------------------------------------------------*/
      var merge                   = function(args, defaultValues) {

         var i, merge, name, obj;

         if (defaultValues) {
            merge = defaultValues;
         }
         else {
            merge = {$:{}};
         }

         for(i=0;i<args.length;i++) {
            obj = args[i];
            if (obj === undefined) continue;
            for(name in obj) {
               if (name !== '$')
                  merge[name] = obj[name];
            }
            if (obj.$ !== undefined) {
               for(name in obj.$) {
                  merge.$[name] = obj.$[name];
               }
            }
         }
         return merge;
      };

      var mergeAuthorization      = function(mainAuthz, authz) {

         var id;

         for(id in authz) {
            if (mainAuthz[id] === 'private')
               continue;

            mainAuthz[id] = authz[id];
         }

      };

      /*-------------------------------------------------------------------------------------------
      |                                      openObject
      |--------------------------------------------------------------------------------------------
      |
      | Ouvre un objet. Cette fonction est appel�e par les m�thodes des packages et les classes
      | qui souhaitent acceder aux �l�ments priv�s et prot�g�s des objets.
      | Cette fonction repose sur la variable "authorizationList" des classes et des packages.
      | Il s'agit d'un objet contenant les autorisations d'acc�s aux environements priv�s et
      | prot�g�s des classes et des packages. Chaque cl� de l'objet correspond � des
      | classes et des packages dont ont � l'acc�s aux environnements priv�s ou prot�g�s
      | Chaque valeur correspond � l'autorisation en question : 'prot�g�' ou 'priv�'.
      | Lorsque openObject re�oit un objet � ouvrir, il va v�rifier si le rootId de cet objet est
      | dans cette liste. Si c'est n'est pas le cas, c'est que l'on a aucun acc�s particulier avec
      | l'objet : on le rend tel-quel alors.
      | Si c'est le cas, dans le cas d'un package, on retournera directement l'environnement
      | priv� : les packages aux acc�s aux environnements priv�s de ces p�res et fils.
      | Si c'est une classe, alors on recherche son ID dans la liste des autorisation. S'il n'est
      | pas pr�sent, alors on s'interessera � son p�re de la m�me mani�re.
      | Une fois que l'on a trouv�, on regarde l'autorisation (valeur).
      | On retourne alors l'environnement priv� ou prot�g� du niveau trouv�.
      |
      |------------------------------------------------------------------------------------------*/
      var openObject              = function (me, obj) {
         var ancestry, authz, level, i, objMe, tmpClass;

         objMe = Core.getMe(obj);

         if (!objMe)
            return obj;

         switch(me.type) {
            case Constants.CLASS:
               authz = me.authorizationList;
               break;
            case Constants.OBJECT:
               authz = me.classMe.authorizationList;
               break;
            case Constants.PACKAGE:
               authz = me.authorizationList;
               break;
         }

         if (objMe.type === Constants.CLASS|| objMe.type === Constants.OBJECT) {

            if (objMe.type === Constants.CLASS)
               tmpClass = objMe;
            else if (objMe.type === Constants.OBJECT)
               tmpClass = objMe.classMe;

            if (authz[tmpClass.rootId] === undefined)
               return obj;

            level = 0;

            do {
               if (authz[tmpClass.id] === 'private')
                  return objMe.levels[level].thisEnv;

               if (authz[tmpClass.id] === 'protected')
                  return objMe.levels[level].protectedEnv;

               tmpClass = tmpClass.extends;
               level += 1;
            }
            while (tmpClass !== undefined);

            return obj;
         }
         if (objMe.type === Constants.PACKAGE) {
            if (authz[objMe.id] === 'private')
               return objMe.thisEnv;

            return obj;
         }
      };

      /*-------------------------------------------------------------------------------------------
      |                                     sealEnv
      |--------------------------------------------------------------------------------------------
      | Sc�le un environnement et l'objet "$".
      |
      | Si toSeal est false, alors seul "$" sera scell�.
      |
      | Si seal$ est false, alors on ne cherche pas � sceller les diff�rents �l�ments de "$" car
      | ils auront d�j� �t� scell� (sur Safari, le mode strict interdit de modifier un �l�ment d�j�
      | scell�).
      |
      |------------------------------------------------------------------------------------------*/

      var sealEnv                 = function (env, toSeal, seal$) {
         var name;

         toSeal = toSeal===undefined ? true : toSeal;
         seal$  = seal$ === undefined? true : seal$;

         if (env.$ !== undefined) {

            if (seal$) {
               for(name in env.$) {
                  jsObject.defineProperty(env.$, name, {writable : false, enumerable : (name==='toString'||name[0]==='_' ? false : true) });
               }
            }

            jsObject.defineProperty(env, '$', {writable : false, enumerable:false});
            jsObject.seal(env.$);
         }

         if (toSeal)
            jsObject.seal(env);
      };

      /*----------------------------------------------------------------------------------------
      |                                     secureObject
      |-----------------------------------------------------------------------------------------
      |
      | L'objet standard "Object" peut-�tre �cras� via une simple commande (ex : Object=1). De
      | fait, il faut "s�curiser" les fonctions de "Object". Un �crasement emp�cherait, dans le
      | meilleur des cas, le fonctionnement correct de Class-Object, mais dans le pire des cas,
      | on peut imaginer que Object � �t� remplac� par un faux, avec des fonctions qui simule
      | celle de Object. Dit autrement, le fait que "Object" soit �crasable est un trou de
      | s�curit�. La "parade" est donc de copier toute ces fonctions dans un objet interne �
      | ClassObject : jsObject. Ainsi, au lieu d'appeler "Object", on appelera "jsObject".
      | Note : on aurait pu se contenter de "fixer" Object via la fonction "seal". Mais, cela
      | reviendrait � modifier le un comportement standard, ce qui n'est pas acceptable.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments :
      |  (aucun)
      |
      |-----------------------------------------------------------------------------------------
      | Retour
      |  (aucun)
      |
      |---------------------------------------------------------------------------------------*/
      var secureObject            = function () {
         var obj = {};
         var properties = Object.getOwnPropertyNames(Object);
         for(var o in properties) {
            obj[properties[o]] = Object[properties[o]];
            Object.defineProperty(obj, properties[o], { writable : false });
         }
         Object.seal(obj);
         return obj;
      };

      var is

      return { beacon                : beacon
             , createPackage         : createPackage
             , declare               : declare
             , declareToParent       : declareToParent
             , fct                   : fct
             , getDefinition         : getDefinition
             , getObject             : getObject
             , getMe                 : getMe
             , getNewId              : getNewId
             , getThisEnv            : getThisEnv
             , hasNonDymanicProperty : hasNonDymanicProperty
             , hasProperty           : hasProperty
             , initialize            : initialize
             , isDynamicValue        : isDynamicValue
             , merge                 : merge
             , mergeAuthorization    : mergeAuthorization
             , publicEnv             : publicEnv
             , openObject            : openObject
             , sealEnv               : sealEnv
             , secureObject          : secureObject};

   })();

   /*----------------------------------------------------------------------------------------------
   |                                 Package interne : Definition
   |-----------------------------------------------------------------------------------------------
   | Description
   |
   |    Ce package permet la cr�ation de Definition.
   |
   |-----------------------------------------------------------------------------------------------
   | �l�ments priv�s du package :
   |
   |    +--------------------+---------------+--------------------------------------------------+
   |    |        Nom         |     Type      |                  Description                     |
   |    +--------------------+---------------+--------------------------------------------------+
   |    | cloneDefinition    | fonction      | Clone une d�finition                             |
   |    +--------------------+---------------+--------------------------------------------------+
   |    | createDefinition   | fonction      | Cr�er une d�finition                             |
   |    +--------------------+---------------+--------------------------------------------------+
   |    | convertDefinition  | fonction      | Cr�er une instance d'une classe                  |
   |    +--------------------+---------------+--------------------------------------------------+
   |
   |-----------------------------------------------------------------------------------------------
   | Cr�ation d'une d�finition
   |
   |    La cr�ation d'une d�finition est faite � partir de la fonction newDefinition.
   |    Cette fonction re�oit en param�tre :
   |      . Soit un objet, qui est converti en d�finition par createDefinition
   |      . Soit une autre d�finition, dont on retournera alors le clone, non scell�
   |
   |-----------------------------------------------------------------------------------------------
   | Structure d'une d�finition
   | Une d�finition est compos� d'un objet "me". La partie publique de la d�finition correspond �
   | l'objet me.publicEnv.
   | Voici la structure d'une d�finition :
   |
   |   |-me
   |   |   |-number id                       : ID de la d�finition.
   |   |   |-Class/Interface extends         : Classe ou interface �tendue par la d�finition.
   |   |   |-function initialization         : Fonction d'initialization de la classe.
   |   |   |-[Interface] interfaces          : Liste des interfaces impl�ment�es.
   |   |   |-boolean isAbstract              : d�fini si oui (true) ou non (false), la d�finition
   |   |   |                                   correspond � un objet abstrait (classe ou interface).
   |   |   |-boolean isAbstract              : d�fini si oui (true) ou non (false), la d�finition
   |   |   |                                   correspond � un objet final.
   |   |   |-boolean isSealed                : d�fini si oui (true) ou non (false) la d�finition est
   |   |   |                                   scell�e.
   |   |   |-Descriptor restrict             : Descripteur restreignant l'ex�cution de la classe.
   |   |   |-Object objectEnv                : Liste de tout les attributs et m�thodes objet
   |   |   |-Object publicEnv                : Liste de toute les propri�t�s de la d�finition.
   |   |   |-Descriptor restrict             : Restreint la cr�ation d'instance de classe.
   |   |   |-Object staticEnv                : Liste de tout les attributs et m�thodes statiques
   |   |   |-setParam                        : D�fini un param�tre de la d�finition. Cette fonction
   |   |   |                                   l�ve une exception si elle est appel�e alors que la
   |   |   |                                   d�finition est scell�e.
   |   |   |-string type                     : Type d'objet. Ici : Constant.DEFINITION.
   |
   | Format de me.publiEnv.$ :
   |
   | me.publicEnv.$
   |   |- boolean abstract                   : retourne me.isAbstract. L�ve une exception si mit �
   |   |                                       jour alors que la d�finition est scell�e.
   |   |                                       jour alors que la d�finition est scell�e.
   |   |- Class/Interface extends            : retourne me.extends. L�ve une exception si mit �
   |   |                                       jour alors que la d�finition est scell�e.
   |   |- boolean final                      : retourne me.isFinal. L�ve une exception si mit �
   |   |                                       jour alors que la d�finition est scell�e.
   |   |- number id                          : retourne me.id. Lecture-seule.
   |   |- [Interface] implements             : retourne me.interfaces. L�ve une exception si mit �
   |   |                                       jour alors que la d�finition est scell�e.
   |   |- boolean isSealed ()                : retourne true si la d�finition est scell�e, false
   |   |                                       sinon.
   |   |- seal()                             : scelle la d�finition.
   |   |- validate([string whatFor])         : valide la d�finition.
   |   |- string type                        : retourne me.type.
   |
   |---------------------------------------------------------------------------------------------*/
   /**
    * @namespace Definition
    * @memberof main
    */
   Definition            = (function () {

      /*-------------------------------------------------------------------------------------------
      |                          Definition Private cloneDefinition
      |--------------------------------------------------------------------------------------------
      |
      | Description :
      |   Clone la d�finition re�ue en param�tre.
      |   La d�finition retourn�e n'est pas scell�e.
      |
      |------------------------------------------------------------------------------------------*/
      var cloneDefinition         = function (me) {
         var def, desc, itf, n, name, parameters;

         def = createDefinition({$ : {sealed : false}});

         for(name in me.publicEnv) {
            def[name] = me.publicEnv[name];
         }

         parameters = ['abstract', 'extends', 'Final', 'implements', 'parent'];

         for(n in parameters) {
            name = parameters[n];
            def.$[name] = me.publicEnv.$[name];
         }

         // initialization est un descripteur
         if (def.$.initialization !== undefined) {
            def.$.initialization = def.$.initialization.clone();
         }

         // parent est un descripteur
         if (def.$.parent !== undefined)
            def.$.parent = def.$.parent.clone();

         for(itf in me.interfaces) {
            def.$.implements(me.interfaces[itf]);
         }

         return def;
      };

      /*-------------------------------------------------------------------------------------------
      |                               Fonction : createDefinition
      |--------------------------------------------------------------------------------------------
      |
      | Description :
      |   Cr�e une d�finition � partir d'un objet Definition re�u en param�tre.
      |
      |------------------------------------------------------------------------------------------*/
      var createDefinition        = function (objectDefinition) {

         var desc, i, name, newDef, me, obj, parent, parameters, visibility;

         // Si objectDefinition est d�j� une d�finition, alors on retourne un clone.
         if (isDefinition(objectDefinition))
            return objectDefinition.$.clone();

         // Cr�ation de l'objet me
         me                         = { isSealed      : false
                                      , objectEnv     : {}
                                      , publicEnv     : {}
                                      , staticEnv     : {}
                                      , setParam      : fct.setParam
                                      , type          : Constants.DEFINITION
                                      , toString      : function() {return 'Definition : me';}};

         me.id                      = Core.getNewId(me);
         me._open                   = fct._open(me);
         me.publicEnv.$             = { _open              : me._open
                                      , clone              : fct.clone(me, me.publicEnv)
                                      , definition         : me.publicEnv
                                      , id                 : me.id
                                      , isSealed           : fct.isSealed(me)
                                      , Public             : me.publicEnv
                                      , seal               : fct.seal(me)
                                      , toString           : function() {return 'Definition';}
                                      , type               : me.type
                                      , validate           : fct.validate(me)};

         // Ajouts des propri�t�s
         for(name in objectDefinition) {
            if (name !== '$')
               me.publicEnv[name] = objectDefinition[name];
         }

         // Ajout des param�tres de cr�ation.
         // On ne fait que les copier
         // les param�tres seront "normalis�s" par la fonction "seal".
         // Les param�tres sont :
         parameters = ['abstract', 'extends', 'Final', 'implements', 'initialization', 'name', 'parent', 'restrict'];

         for(i in parameters) {
            name = parameters[i];
            jsObject.defineProperty(me.publicEnv.$, name , { configurable : false
                                                           , enumerable   : true
                                                           , get          : fct['get_'+name](me)
                                                           , set          : fct['set_'+name](me)});

            if (objectDefinition.$ !== undefined) {
               me.publicEnv.$[name] = objectDefinition.$[name];
            }
         }

         // TODO : v�rification faites au mauvais endroit : on doit v�rifier lorsque l'on sc�lle la d�finition

         // V�rification des param�tres
         if (me.publicEnv.$.parent !== undefined) {

            if (Descriptor.isDescriptor(me.publicEnv.$.parent)) {
               desc   = me.publicEnv.$.parent.clone();
               parent = me.publicEnv.$.parent.getValue();
            }
            else {
               parent = me.publicEnv.$.parent;
               desc = Public.set(parent);
            }

            if (!Package.isPackage(parent) && typeof(parent) !== 'object' && typeof(parent) !== 'function')
               onerror(new Errors.InvalidPackage(parent));

            desc.seal();
            me.publicEnv.$.parent = desc;
         }

         // V�rification du param�tre : implements
         if (me.publicEnv.$.implements !== undefined) {

            if (!(me.publicEnv.$.implements instanceof Array))
               me.publicEnv.$.implements = [me.publicEnv.$.implements];

            for(i in me.publicEnv.$.implements) {

               if (!Interface.isInterface(me.publicEnv.$.implements[i]))
                  onerror(new Errors.InvalidDefinition('Not a valid interface', me.publicEnv.$.implements[i]));
            }
         }
         else
            me.publicEnv.$.implements = [];

         jsObject.defineProperty(me.publicEnv, '$', { writable     : false
                                                    , configurable : false
                                                    , enumerable   : false});

         jsObject.seal(me.publicEnv.$);

         if (objectDefinition.$ !== undefined) {
            if (objectDefinition.$.sealed === undefined || objectDefinition.$.sealed)
               sealDefinition(me);
         }
         else
            sealDefinition(me);

         return me.publicEnv;

      };

      /*----------------------------------------------------------------------------------------
      |                                   convertDefinition
      |-----------------------------------------------------------------------------------------
      | Description :
      |
      |   Contr�le et v�rifie la d�finition de classe pass�e en param�tre.
      |
      |   Format de la d�finition de classe :
      |     . La d�finition de classe est un dictionnaire.
      |     . Chaque entr�e du dictionnaire correspond � la d�finition d'un attribut ou d'une
      |       m�thode de la classe.
      |        . La cl� correspond au nom de l'attribut/m�thode
      |           . Le premier carract�re doit �tre une lettre
      |           . Elle doit �tre compos� que de carract�res alphanum�riques et du
      |             carract�re underscore "_".
      |           . Le nom respect d'une de ces conditions entrainera une exception :
      |             Exception : nonValidName
      |        . La valeur correspond � la d�finition
      |     . Il y a trois format de d�finitions d'attributs/m�thodes reconnus:
      |       . La valeur est le r�sultat des fonctions fournissant les propri�t�s de l'attribut/
      |         m�thode (private, public, ...). Il s'agit l� de condition id�ales : l'objectif
      |         de "convertDefinition" sera de convertir les deux autres formats en celui-ci.
      |       . La valeur est un dictionnaire compos� de deux �l�ments :
      |         . Un �l�ment dont la cl� est "define": La valeur est le r�sultat des fonctions
      |           fournissant les propri�t�s de l'attribut/m�thode (private/public). Si cet
      |           cet �l�ment est obligatoire.
      |         . Au choix :
      |            . Un �l�ment dont la cl� est "Method": La valeur est la fonction servant de
      |              m�thode. Cela d�terminera alors une m�thode. Si les propri�t�s d�finies
      |              dans "define" d�clare un attribut, alors l'exception suivante sera lev�e:
      |              Exception : uncoherentProperties
      |            . Un �l�ment dont la cl� est "value": Cet �l�ment d�termine un attribut. Si
      |              les propri�t�s d�finies dans "define" d�clare une m�thode, l'exception
      |              "uncoherentProperties" sera lev�e.
      |       . Dans tout les autres cas, la valeur d�terminera si on � affaire � un attribut
      |         ou une m�thode. Si l'objet est une fonction, alors on consid�reras que cette
      |         propri�t� de la classe est une m�thode publique non-statique. La fonction
      |         pass�e en param�tre constituera la m�thode.
      |         Sinon, on consid�reras la propri�� comme un attribut publique non-statique.
      |         Dans le cas o� on � affaire � un dictionnaire, c'est la cl� "define" et son
      |         contenu qui permettra de faire la diff�rence entre un dictionnaire "classique"
      |         et une d�claration.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . oldDef : d�finition � convertir. La d�finition ne sera pas modifi�e, y comprit
      |      si le format est incorrect.
      |
      |----------------------------------------------------------------------------------------
      | Retour :
      |   Nouvelle d�finition, correspondant � la d�finition pass�e en param�tre convertie.
      |
      |-----------------------------------------------------------------------------------------
      | Exceptions :
      |
      |-----------------------------------------------------------------------------------------
      | TODO :
      |   V�rifier que les m�thodes/attributs respects l'h�ritage : si le p�re d�fini une m�thode,
      |  et que le fils veut l'�craser, il doit l'�craser avec une m�thode aussi. Idem pour les
      |  attributs, pour les constantes, la visibilit�.
      |   V�rifier que les m�thodes/attributs �craser ne sont pas �crit comme "Final" par le p�re
      |   ou un anc�tre.
      |
      |---------------------------------------------------------------------------------------*/
      var convertDefinition       = function (oldDef) {
         var descriptor,def,extend,extendDefinition,extendedProperty,invalid,name,newDef,object;

         // TODO : v�rifier que "init" est une fonction statique
         // TODO : "prototype", "length", "name", "arguments" et "caller" ne sont pas utilisables comme propri�t�s statiques
         // TODO : v�rifier que les propri�t�s soit coh�rente avec le type de l'objet

         newDef = getNew$(oldDef);

         // V�rifications dans le cas o� on la classe h�rite d'une autre classe
         if (newDef.extends !== undefined) {
            newDef.Public.$.extends = newDef.extends;
            newDef.extends          = Core.getObject(newDef.extends.$.id);
            extendDefinition        = newDef.extends.definition;
         }

         extend = newDef.extends !== undefined;

         for(name in oldDef) {

            if (name != Constants.$ ) {

               descriptor = Descriptor.convertDescriptor(name, oldDef); // Note : si le descripteur est d�j� standard, il sera clon�
               // A cette �tape, descriptor est d�j� scell�

               if (extend) {

                  extendedProperty = undefined;

                  if (extendDefinition.Static[name] !== undefined) {
                     extendedProperty = extendDefinition.Static[name];
                  }
                  else if (extendDefinition.Object[name] !== undefined) {
                     extendedProperty = extendDefinition.Object[name];
                  }

                  if (extendedProperty !== undefined) {

                     if (extendedProperty.isFinal())
                        onerror(new Errors.finalPropertyExtended());

                     if (descriptor.isStatic() != extendedProperty.isStatic()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isMethod() != extendedProperty.isMethod()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isAttribute() != extendedProperty.isAttribute()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isClass() != extendedProperty.isClass()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isPrivate() != extendedProperty.isPrivate()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isProtected() != extendedProperty.isProtected()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isPublic() != extendedProperty.isPublic()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                     if (descriptor.isConstant() != extendedProperty.isConstant()) {
                        onerror(new Errors.ExtendedProprertyError());
                     }

                  }

               }

               newDef.All[name] = descriptor;

               if (descriptor.isStatic())
                  newDef.Static[name] = descriptor;
               else
                  newDef.Object[name] = descriptor;

               if (descriptor.isPublic())
                  newDef.Public[name] = descriptor;
            }
         }

         return newDef;

      };

      var fct                     = (function () {

         var _open                     = function (me) {
            return function (bcn) {
               if (bcn != Core.beacon)
                  onerror(new Errors.AccessViolation());
               return me;
            };
         };

         var clone                     = function (me, env) {
            return function (bcn) {
               // L'appel avec bcn est fait uniquement par la fonction
               // createDefinition : dans cette fonction, on va copier aussi
               // l'environnement priv� de la d�finition.
               return cloneDefinition(me);
            };
         };

         var seal                      = function(me) {
            return function() {
               return sealDefinition(me);
            };
         };

         var get_abstract              = function (me) {
            return function() {
               return me.isAbstract;
            };
         };

         var get_extends               = function (me) {
            return function() {
               return me.extends;
            };
         };

         var get_Final                 = function (me) {
            return function() {
               return me.isFinal;
            };
         };

         var get_implements            = function (me) {
            return function() {
               return me.implements;
            };
         };

         var get_initialization        = function (me) {
            return function() {
               return me.initialization;
            };
         };

         var get_name                  = function (me) {
            return function() {
               return me.name;
            };
         };

         var get_parent                = function (me) {
            return function() {
               return me.parent;
            };
         };

         var get_restrict              = function (me) {
            return function() {
               return me.restrict;
            };
         };

         var isSealed                  = function(me) {
            return function() {
               return me.isSealed;
            };
         };

         var set_abstract              = function (me) {
            return function (isAbstract) {
               me.setParam('isAbstract', isAbstract);
            };
         };

         var set_extends               = function (me) {
            return function(cl) {
               me.setParam('extends', cl);
            };
         };

         var set_Final                 = function (me) {
            return function (isFinal) {
               me.setParam('isFinal', isFinal);
            };
         };

         var set_fixed                 = function (me) {
            return function (isFixed) {
               me.setParam('isFixed', isFixed);
            };
         };

         var set_implements            = function (me) {
            return function (itf) {
               me.setParam('implements', itf);
            };
         };

         var set_initialization        = function(me) {
            return function(initialization) {
               me.setParam('initialization', initialization);
            };
         };

         var set_name                  = function(me) {
            return function(name) {
               me.setParam('name', name);
            };
         };

         var set_parent                = function(me) {
            return function(parent) {
               me.setParam('parent', parent);
            };
         };

         var set_restrict              = function(me) {
            return function(restriction) {
               me.setParam('restriction', restriction);
            };
         };

         /*----------------------------------------------------------------------------------------
         |                                      setParam
         |-----------------------------------------------------------------------------------------
         |
         | Ajoute un param�tre � l'objet me de la d�finition.
         |
         |-----------------------------------------------------------------------------------------
         | Arguments :
         |   . object : l'objet � tester
         |
         |-----------------------------------------------------------------------------------------
         | Retour
         |   (aucun)
         |
         |-----------------------------------------------------------------------------------------
         | Exceptions :
         |   . Errors.SealedObject : impossible de modifier un param�tre car la d�finition est
         |     scell�e.
         |
         |-----------------------------------------------------------------------------------------
         | Visibilit� :
         |   . Priv�e
         | Cette fonction n'est utilis� que par les fonctions "set_*" des d�finitions.
         |
         |---------------------------------------------------------------------------------------*/
         var setParam                  = function(name, value) {
            if (this.isSealed)
               onerror(new Errors.SealedObject());

            this[name] = value;
         };

         var validate                  = function(me) {
            return function(whatFor) {
               return validateDefinition(me, whatFor);
            };
         };

         return { _open              : _open
                , clone              : clone
                , get_abstract       : get_abstract
                , get_extends        : get_extends
                , get_Final          : get_Final
                , get_implements     : get_implements
                , get_initialization : get_initialization
                , get_name           : get_name
                , get_parent         : get_parent
                , get_restrict       : get_restrict
                , isSealed           : isSealed
                , seal               : seal
                , set_abstract       : set_abstract
                , set_extends        : set_extends
                , set_Final          : set_Final
                , set_implements     : set_implements
                , set_initialization : set_initialization
                , set_name           : set_name
                , set_parent         : set_parent
                , set_restrict       : set_restrict
                , setParam           : setParam
                , validate           : validate};
      })();

      /*----------------------------------------------------------------------------------------
      |                                     valid$
      |-----------------------------------------------------------------------------------------
      |
      | Valide l'attribut "define" de l'objet re�u en param�tre. Cette fonction est cr��e
      | uniquement pour mieux d�couper la fonction convertDefinition.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments :
      |   . object : l'objet � tester
      |
      |-----------------------------------------------------------------------------------------
      | Retour
      |   . true  : l'objet a une propri�t� 'define' valide
      |   . false : l'objet n'a pas une propri�t� 'define' valide
      |
      |---------------------------------------------------------------------------------------*/
      var getNew$                 = function (object) {

         var i;
         var name;
         var classObject;
         var list;
         var new$, old$;

         new$ = { All     : {}
                , extends : undefined
                , final   : false
                , Object  : {}
                , parent  : undefined
                , Public  : { $ : {}}
                , Static  : {}
                };

         if (!Core.hasProperty(object, Constants.$)) {
            return new$;
         }

         old$ = object[Constants.$];

         if (typeof(old$) != 'object') {
            onerror(new Errors.defineIsNotAnObject());
         }

         list         = { extends : 'class'
                        , Package : 'package'};

         for(name in old$) {

            new$[name] = old$[name];

            if (old$[name] === undefined)
               continue;

            if (list[name] == 'class') {
               if (!Class.isClass(new$[name]))
                  onerror(new Errors.invalidDefineProperty(name));
            }
            else if (list[name] == 'package') {
               if (!Core.isPackage(new$[name]))
                  onerror(new Errors.invalidDefineProperty(name));
            }
            else if (list[name] !== undefined) {
               if (typeof(new$[name]) != list[name])
                  onerror(new Errors.invalidDefineProperty(name));
            }
         }

         return new$;
      };

      var isDefinition            = function (obj) {

         var e, o;

         try {
            if (typeof(obj) !== 'object')
               return false;

            if (obj.$ === undefined)
               return false;

            o = Core.getObject(obj.$.id);

            if (o=== undefined)
               return false;

            if (o.publicEnv    === obj) return true;
            if (o.protectedEnv === obj) return true;
            if (o.privateEnv   === obj) return true;
         }
         catch(e) {
            null;
         };

         return false;

      };

      var isUsuableDefinition     = function (definition) {

         var name;

         if (jsObject.isSealed(definition))
            return false;

         if (jsObject.isFrozen(definition))
            return false;

         if (!jsObject.isExtensible(definition))
            return false;

         for(name in definition) {
            if (!jsObject.getOwnPropertyDescriptor(definition, name).configurable)
               return false;
         }

         return true;
      };

      var newDefinition           = function() {
         var definition;

         definition = Core.getDefinition(arguments);
         return createDefinition(definition);
      };

      /*-------------------------------------------------------------------------------------------
      |                               Fonction : sealDefinition
      |--------------------------------------------------------------------------------------------
      | Description :
      |   Sc�lle la d�finition re�ue en param�tre.
      |   Fonction � utiliser en interne uniquement. Aucun contr�le n'est fait sur les param�tres
      | d'entr�es uniquement.
      |--------------------------------------------------------------------------------------------
      | Parma�tres
      |   . definition : D�finition � valider. La d�finition doit �tre ouverte
      |   . whatFor    : Pour quel type d'usage on doit valider la d�finition. Valeurs accept�es :
      |      . undefined
      |      . Constants.CLASS
      |      . Constants.INTERFACE
      |      . Constants.PACKAGE
      |------------------------------------------------------------------------------------------*/
      var sealDefinition          = function(definition, whatFor) {

         var desc, errors, name, p, parameterList, property;

         if (definition.isSealed)
            return;

         validateDefinition(definition, whatFor);

         // boolean $.isAbstract [=false]
         definition.isAbstract = !!definition.isAbstract;

         // boolean $.isFinal [=false]
         definition.isFinal = !!definition.isFinal;

         // [interfaces] $.implements []
         if (typeof(definition.implements) !== typeof([]) && definition.implements !== undefined)
            definition.implements = [definition.implements];

         // Descriptor $.initialization
         if (definition.initialization !== undefined) {
            if (Descriptor.isDescriptor(definition.initialization))
               definition.initialization = definition.initialization.clone();
            else
               definition.initialization = Descriptor.new().Static.Method(definition.initialization);
         }

         // On v�rifie ici que la d�finition public est modifiable
         for(property in definition.publicEnv) {

            p = jsObject.getOwnPropertyDescriptor(definition.publicEnv, property);

            if (!p.configurable || !p.writable) {
               onerror(new Errors.InvalidDefinition());
            }
         }

         /* Les derniers contr�les ont �t� effectu�s : maintenant
          on scelle la d�finition. */
         definition.isSealed = true;

         // On ajoute les nouvelles description.
         // Si la description existaient d�j�, on v�rifie qu'elle est compatible
         // Note : bcn est valoris� uniquement lorsque l'on cr�e un clone pour �tendre une d�finition.
         // Dans ce cas, privateEnv, protectedEnv et publicEnv ne doivent pas contenir les d�finitions.
         // Seul les environnements compil�s doivent les contenir.
         for(name in definition.publicEnv) {
            if (name == '$') continue;

            desc = Descriptor.convertDescriptor(definition.publicEnv[name]).seal();

            if (desc.isStatic())
               definition.staticEnv[name]        = desc._open(Core.beacon);
            else
               definition.objectEnv[name]        = desc._open(Core.beacon);

            jsObject.defineProperty(definition.publicEnv, name, { writable     : false
                                                                , configurable : false
                                                                , enumerable   : true
                                                                , value        : desc });
         }

         jsObject.seal(definition.publicEnv  );
         jsObject.seal(definition.publicEnv.$);

         return definition.publicEnv;
      };

      /*-------------------------------------------------------------------------------------------
      |                            public Object validateDefinition
      |--------------------------------------------------------------------------------------------
      | Description :
      |   Valide la d�finition re�ue en param�tre.
      |   La fonction ne modifie pas la d�finition. Elle retourne une liste d'erreur, ou undefined
      |   si aucune erreur n'a �t� trouv�e.
      |--------------------------------------------------------------------------------------------
      | Parma�tres
      |   . definition : D�finition � valider. La d�finition doit �tre ouverte
      |   . whatFor    : Pour quel type d'usage on doit valider la d�finition. Valeurs accept�es :
      |      . undefined
      |      . Constants.CLASS
      |      . Constants.INTERFACE
      |      . Constants.PACKAGE
      |------------------------------------------------------------------------------------------*/
      var validateDefinition         = function(definition, whatFor) {

         var errors;

         if (definition.isSealed)
            return;

         errors     = { $ : {}};

         // V�rification de l'objet �tendu
         if (definition.extends !== undefined) {
            if (!Class.isClass(definition.extends) && !Interface.isInterface(definition.extends))
               onerror(new Errors.InvalidDefinition('Extend object must be a Class or a Interface'));
         }

         if (definition.restrict !== undefined)
            if (!Descriptor.isDescriptor(definition.restrict))
               onerror(new Errors.InvalidDefinition('$.restrict must be a descriptor'));

         if (whatFor === Constants.CLASS)
            Class.validateDefinition(definition);

         if (whatFor === Constants.INTERFACE)
            Interface.validateDefinition(definition);

         return;
      };

      var validateDefinition_public = function(definition) {
         if (Definition.isDefinition(definition))
            return validateDefinition(definition.$._open(Core.beacon));
      };

      var _open                     = function (bcn) {
         if (bcn != Core.beacon)
            onerror(new Errors.AccessViolation());

         return this.me;
      };

      var maxID = 0;

      newDefinition.validateDefinition = validateDefinition_public;
      newDefinition.convertDefinition  = convertDefinition;
      newDefinition.isDefinition       = isDefinition;
      newDefinition.new                = newDefinition;
      newDefinition.$                  = 'Definition';

      return { convertDefinition   : convertDefinition
             , isDefinition        : isDefinition
             , isUsuableDefinition : isUsuableDefinition
             , new                 : newDefinition
             , namespace           : newDefinition};

   })();

   /*----------------------------------------------------------------------------------------------
   |                                 Package interne : Descriptor
   |-----------------------------------------------------------------------------------------------
   | Description
   |
   |    Ce package permet la cr�ation de descripteurs
   |
   |-----------------------------------------------------------------------------------------------
   | Cr�ation d'un descripteur
   |
   |    La cr�ation d'une d�finition est faite � partir de la fonction newDescriptor.
   |    Cette fonction re�oit en param�tre :
   |      . Soit un objet, qui correspond � la valeur du descripteur
   |      . Soit un lien
   |
   |-----------------------------------------------------------------------------------------------
   | Correspondance
   |
   |  type :
   |     . 1 : attribut
   |     . 2 : variable
   |     . 3 : m�thode
   |     . 4 : fonction
   |     . 6 : classe
   |
   |---------------------------------------------------------------------------------------------*/
   Descriptor            = (function () {

      var maxID                   = 0;

      /*----------------------------------------------------------------------------------------
      |                                   isDescriptor
      |-----------------------------------------------------------------------------------------
      | Description :
      |   V�rifie si la propri�t� pass�e en param�tre est standard ou non.
      |   Seule une propri�t� standard � acc�s � la variable interne Core.beacon.
      |   On appel la fonction "checkStandard" de la propri�t�. Cette fonction retourne un id.
      |   "checkStandard" � enregistr� dans Core.beacon une r�f�rence d'elle m�me. Donc, il
      |   ne reste plus qu'� comparer cette r�f�rence avec l'objet pass� en param�tre de
      |   isDescriptor. Normalement, ils sont les m�mes. Sinon, c'est que la propri�t�
      |   n'est pas standard.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . name       : Nom de l'attribut/m�thode
      |    . definition : D�finition de l'attribut/m�thode
      |
      |-----------------------------------------------------------------------------------------
      | Retour :
      |   Nouvelle d�finition, correspondant � la d�finition pass�e en param�tre convertie.
      |
      |-----------------------------------------------------------------------------------------
      | Exceptions :
      |
      |---------------------------------------------------------------------------------------*/
      var isDescriptor      = function (property) {

         var stdProp;

         try {
            if (typeof(property) !=='function') return false;

            if (!Core.hasProperty(property, 'checkStandard'))
               return false;

            var id = property.checkStandard(maxID++);

            stdProp = Core.beacon[id];
            delete(Core.beacon[id]);
            if (stdProp.Public != property)
               return false;
         }
         catch(e) {
            return false;
         }

         return true;

      };

      // Type
      var fct_Attribute           = function ()    { this.setParam('Type'      ,    1); return this.Public;};
      var fct_Variable            = function ()    { this.setParam('Type'      ,    2); return this.Public;};
      var fct_Method              = function ()    { this.setParam('Type'      ,    3); return this.Public;};
      var fct_Function            = function ()    { this.setParam('Type'      ,    4); return this.Public;};

      var fct_isAttribute         = function ()    { return this.Type===0 ? undefined : this.Type===1||this.Type===2; };
      var fct_isMethod            = function ()    { return this.Type===0 ? undefined : this.Type===3||this.Type===4; };

      // Visibility
      var fct_Public              = function ()    { this.setParam('visibility',    1); return this.Public;};
      var fct_Protected           = function ()    { this.setParam('visibility',    2); return this.Public;};
      var fct_Private             = function ()    { this.setParam('visibility',    3); return this.Public;};

      var fct_isPublic            = function ()    { return this.visibility === 1;        };
      var fct_isProtected         = function ()    { return this.visibility === 2;        };
      var fct_isPrivate           = function ()    { return this.visibility === 3;        };

      // Properties
      var fct_Abstract            = function ()    { this.setParam('isAbstract', true); return this.Public;};
      var fct_Constant            = function ()    { this.setParam('isConstant', true); return this.Public;};
      var fct_Final               = function ()    { this.setParam('isFinal'   , true); return this.Public;};
      var fct_Static              = function ()    { this.setParam('isStatic'  , true); return this.Public;};

      var fct_isAbstract          = function (val) { if (arguments.length > 0) { this.setParam('isAbstract', val)   ; return this.Public;} return this.isAbstract; };
      var fct_isFinal             = function (val) { if (arguments.length > 0) { this.setParam('isFinal', val)      ; return this.Public;} return this.isFinal;    };
      var fct_isConstant          = function (val) { if (arguments.length > 0) { this.setParam('isConstant', !!val) ; return this.Public;} return this.isConstant; };
      var fct_isStatic            = function (val) { if (arguments.length > 0) { this.setParam('isStatic', val)     ; return this.Public;} return this.isStatic;   };

      // Other properties and attributes
      var fct_isSealed            = function ()    { return this.isSealed;                };
      var fct_set                 = function (val) {
         this.setParam('value'     ,  val);
         this.setParam('isValueSetted', true);
         if (this.Type === 0) {
            this.setParam('Type', typeof(val)==='function' ? 3 : 1);
         }
         return this.Public;
      };

      var fct_isValueSetted       = function (val) { if (arguments.length > 0) { this.setParam('isValueSetted', val); } return this.isValueSetted;};
      var fct_toString            = function (hideValue)    {
         var chn;
         switch (this.visibility) {
            case 1:
               chn = 'Public';
               break;
            case 2:
               chn = 'Protected';
               break;
            case 3:
               chn = 'Private';
               break;
         }

         switch (this.Type) {
            case 1:
               chn += '.Attribute';
               break;
            case 2:
               chn += '.Variable';
               break;
            case 3:
               chn += '.Method';
               break;
            case 4:
               chn += '.Function';
               break;
         }

         if (this.isStatic)
            chn += '.Static';

         if (this.isFinal)
            chn += '.Final';

         if (this.isConstant)
            chn += '.Constant';

         if (this.value != this.isValueSetted && !hideValue) {
            chn += '('+this.value+')';
         }

         return chn;

      };

      var fct_setParam            = function (param, value) {
         if (this.isSealed)
            onerror(new Errors.DescriptorSealed());

         this[param] = value;
      };

      var fct_open                = function (bcn)    {
         if (bcn !== Core.beacon)
            onerror(new Errors.AccessViolation());
         return this;
      };

      var fct_checkStandard       = function(id)  { Core.beacon[id] = this; return id; };
      var fct_get                 = function()    { return this.value;              };
      var fct_seal                = function(bcn, from, name)    {
         this.isSealed    = true;
         this.isPrivate   = this.visibility === 3;
         this.isProtected = this.visibility === 2;
         this.isPublic    = this.visibility === 1;
         this.isAttribute = this.Type===1||this.Type===2;
         this.isMethod    = this.Type===3||this.Type===4;
         return this.Public;
      };
      /*----------------------------------------------------------------------------------------
      |                                   fct_equals
      |-----------------------------------------------------------------------------------------
      | Description :
      |   Compare deux descripteurs.
      |   Tout les aspects sont test�s.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . Descriptor obj     : Descripteur � tester.
      |    . boolean testValue  : Indique si oui (true) ou non (false) on doit aussi tester les
      |                           valeurs. D�faut : true.
      |
      |-----------------------------------------------------------------------------------------
      | Retour :
      |   Nouvelle d�finition, correspondant � la d�finition pass�e en param�tre convertie.
      |
      |-----------------------------------------------------------------------------------------
      | Exceptions :
      |
      |---------------------------------------------------------------------------------------*/
      var fct_equals              = function(obj, testValue) {
         if (!isDescriptor(obj)) {
            return false;
         }

         obj = obj._open(Core.beacon);

         if (obj.visibility !== this.visibility)
            return false;

         if (obj.isConstant !== this.isConstant)
            return false;

         if (obj.isStatic   !== this.isStatic)
            return false;

         if ((obj.Type==1 || obj.Type==2) && !(this.Type==1 ||this.Type==2))
            return false;

         if ((obj.Type==3 || obj.Type==4) && !(this.Type==3 ||this.Type==4))
            return false;

         testValue = testValue === undefined ? true : testValue;

         if (testValue)
            return this.value == obj.value;

         return true;
      };

      var fct_clone               = function() {
         var desc           = createDescriptor(true);
         desc.definitionOf  = this.definitionOf;
         desc.isConstant    = this.isConstant;
         desc.isFinal       = this.isFinal;
         desc.isSealed      = false;
         desc.isStatic      = this.isStatic;
         desc.isValueSetted = this.isValueSetted;
         desc.Package       = this.Package;
         desc.property      = this.property;
         desc.Public        = this.Public;
         desc.Type          = this.Type;
         desc.value         = this.value;
         desc.visibility    = this.visibility;
         return desc.Public;
      };

      var fct_isPropertyDefined   = function(bcn) {
         if (bcn != Core.beacon) {
            onerror(Errors.AccessViolation());
            return;
         }
         return this.property !== undefined;
      };

      var fct_getProperty         = function(bcn) {
         if (bcn != Core.beacon) {
            onerror(Errors.AccessViolation());
            return;
         }
         return this.property;
      };

      var fct_setProperty         = function(bcn, property) {
         if (bcn != Core.beacon) {
            onerror(Errors.AccessViolation());
            return;
         }
         this.property = property;
      };

      /*----------------------------------------------------------------------------------------
      |                                   convertDescriptor
      |-----------------------------------------------------------------------------------------
      | Description :
      |   Converti la d�finition d'un attribut ou d'une m�thode au format standard.
      |   Aucun contr�le n'est fait sur les valeurs.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . oldDesc : Description � convertir
      |
      |-----------------------------------------------------------------------------------------
      | Retour :
      |    . Si oldDesc est un descripteur, alors on va retourner son clone.
      |    . Sinon, on retourne un param�tre publique, non statique, dont le type d�pend du type
      |      de oldDesc :
      |      . Si oldDesc est une classe, alors on d�clarera une classe
      |      . si oldDesc est une fonction, alors on d�clarera une m�thode
      |      . sinon, on d�clare un attribut.
      |
      |-----------------------------------------------------------------------------------------
      | Exceptions :
      |   (aucune)
      |---------------------------------------------------------------------------------------*/
      var convertDescriptor       = function (oldDesc) {
         var newDesc;

         if (isDescriptor(oldDesc)) {
            newDesc = oldDesc.Clone;
         }
         else {
            newDesc = newDescriptor();

            if (Class.isClass(oldDesc))
               newDesc.Public.Class.set(oldDesc);
            else if (typeof(oldDesc) == 'function')
               newDesc.Public.Method.set(oldDesc);
            else
               newDesc.Public.Attribute.set(oldDesc);
         }

         return newDesc;
      };

      var createDescriptor        = function(returnMe) {

         var dp, me, set_bind;

         dp       = jsObject.defineProperty;


         me       = { definitionOf : undefined
                    , isConstant   : false
                    , isFinal      : false
                    , isStatic     : false
                    , Package      : false
                    , property     : undefined
                    , isSealed     : false
                    , setParam     : fct_setParam
                    , Type         : 0          // 0: Non défini, 1: Attribute, 2: Variable, 3:Method, 4:Function
                    , value        : undefined
                    , visibility   : 1
                    , id           : maxID++};        // 1: public, 2:protected, 3:private

         set_bind = fct_set.bind(me);

         me.Public = set_bind;

         dp(me.Public, 'Abstract'          , {get:fct_Abstract           .bind(me), set:function(val) {this.Abstract     ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Attribute'         , {get:fct_Attribute          .bind(me), set:function(val) {this.Attribute    ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Clone'             , {get:fct_clone              .bind(me), set:function(val) {this.Clone        ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Constant'          , {get:fct_Constant           .bind(me), set:function(val) {this.Constant     ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Final'             , {get:fct_Final              .bind(me), set:function(val) {this.Final        ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Function'          , {get:fct_Function           .bind(me), set:function(val) {this.Function     ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Method'            , {get:fct_Method             .bind(me), set:function(val) {this.Method       ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Private'           , {get:fct_Private            .bind(me), set:function(val) {this.Private      ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Protected'         , {get:fct_Protected          .bind(me), set:function(val) {this.Protected    ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Public'            , {get:fct_Public             .bind(me), set:function(val) {this.Public       ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Static'            , {get:fct_Static             .bind(me), set:function(val) {this.Static       ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Variable'          , {get:fct_Variable           .bind(me), set:function(val) {this.Variable     ; set_bind(val);}, enumerable:true, configurable:false});

         dp(me.Public, 'checkStandard'     , {value:fct_checkStandard    .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'clone'             , {value:fct_clone            .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'equals'            , {value:fct_equals           .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'getValue'          , {value:fct_get              .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isAbstract'        , {value:fct_isAbstract       .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isAttribute'       , {value:fct_isAttribute      .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isConstant'        , {value:fct_isConstant       .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isFinal'           , {value:fct_isFinal          .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isFunction'        , {value:fct_isMethod         .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isMethod'          , {value:fct_isMethod         .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isPrivate'         , {value:fct_isPrivate        .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isProtected'       , {value:fct_isProtected      .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isPublic'          , {value:fct_isPublic         .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isSealed'          , {value:fct_isSealed         .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isStatic'          , {value:fct_isStatic         .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isValueSetted'     , {value:fct_isValueSetted    .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'isVariable'        , {value:fct_isAttribute      .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'seal'              , {value:fct_seal             .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'set'               , {value:fct_set              .bind(me), writable:false, enumerable:true});
         dp(me.Public, 'toString'          , {value:fct_toString         .bind(me), writable:false, enumerable:true});

         dp(me.Public, '_isPropertyDefined', {value:fct_isPropertyDefined.bind(me), writable:false, enumerable:false});
         dp(me.Public, '_open'             , {value:fct_open             .bind(me), writable:false, enumerable:false});
         dp(me.Public, '_getProperty'      , {value:fct_getProperty      .bind(me), writable:false, enumerable:false});
         dp(me.Public, '_setProperty'      , {value:fct_setProperty      .bind(me), writable:false, enumerable:false});

         me._getProperty       = fct_getProperty;
         me._isPropertyDefined = fct_isPropertyDefined;
         me._setProperty       = fct_setProperty;


         jsObject.seal(me.Public);

         if (returnMe) {
            return me;
         }

         return me.Public;
      };

      var newDescriptor           = function() {
         return createDescriptor(false);
      };

      newDescriptor.convert       = convertDescriptor;
      newDescriptor.isDescriptor  = isDescriptor;
      newDescriptor.new           = newDescriptor;
      newDescriptor.$             = 'Descriptor';

      return { convertDescriptor  : convertDescriptor
             , isDescriptor       : isDescriptor
             , namespace          : newDescriptor
             , new                : newDescriptor};
   })();

   Errors                = {
        AccessViolation        : function(name)    { this.name=globalName+'.Errors.AccessViolation'       ; this.message='Try to access to a reserved function';                                  }
      , InvalidDefinition      : function(message) { this.name=globalName+'.Errors.InvalidDefinition'     ; this.message = message;                                                               }
      , InvalidContext         : function(message) { this.name=globalName+'.Errors.InvalidContext'        ; this.message = message;                                                               }
      , DescriptorSealed       : function()        { this.name=globalName+'.Errors.DescriptorSealed'      ; this.message='Try to modify a sealed descriptor';                                     }
      , ObjectIsNotExtendable  : function()        { this.name=globalName+'.Errors.ObjectIsNotExtendable' ; this.message='Object is not extandable (use Definition, Class, Interface or Package)';}
      , ExtendAnFinalClass     : function()        { this.name=globalName+'.Errors.ExtendAnFinalClass'    ; this.message='Try to extend an finaled class';                                        }
      , ExtendedProprertyError : function()        { this.name=globalName+'.Errors.ExtendedProprertyError';                                                                                       }
      , OnParameterOnly        : function()        { this.name=globalName+'.Errors.OnParameterOnly'       ; this.message='Only one parameter accepted';                                           }
      , ObjectIsNotAClass      : function()        { this.name=globalName+'.Errors.ObjectIsNotAClass'     ; this.message='Expected a class';                                                      }
      , InvalidName            : function(n)       { this.name=globalName+'.Errors.InvalidName'           ; this.message='Not a valid name : '+n;                                                 }
      , InvalidType            : function(o)       { this.name=globalName+'.Errors.InvalidName'           ; this.message='Not a valid type'; this.object = o;                                     }
      , NotInstanciableClass   : function(cl)      { this.name=globalName+'.Errors.NotInstanciableClass'  ; this.message='The class is not instanciable';                                         }
      , NotAUniqueName         : function(n)       { this.name=globalName+'.Errors.NotAUniqueName'        ; this.message='The name is not unique : "'+n+'"';                                      }
      , SealedObject           : function(object)  { this.name=globalName+'.Errors.SealedObject'          ; this.message='The object is sealed : it cannot be extended';                          }
      , NotSealablePackage     : function(pkg)     { this.name=globalName+'.Errors.NotSealablePackage'    ; this.message='The package is not sealable';                                           }
      , IncompatibleExtension  : function(name, desc1, desc2) {
         this.name='IncompatibleExtension' ;
         this.message='"'+name+'" property ('+desc1.toString(true)+') cant\'t be extend by a '+desc1.toString(true)+' property';
         console.log(this.message);
         }
      , $                      : {seal : true}
   };

   Interface             = (function() {

      var createInterface         = function(definition) {

         var me, name, publicEnv;

         me                 = { definition : definition
                              , name       : definition.name
                              , parent     : definition.parent
                              , publicEnv  : {}
                              , type       : Constants.INTERFACE};

         me.id = Core.getNewId(me);

         for(name in me.definition.publicEnv) {
            me.publicEnv[name] = me.definition.publicEnv[name];
         }

         me.publicEnv.$ = { _patteBlanche : Core.fct._patteBlanche(me)
                          , id            : me.id
                          , implementedBy : fct.implementedBy(me)
                          , isCompatible  : fct.isCompatible(me)
                          , type          : me.type
         };

         jsObject.defineProperty(me.publicEnv.$     , 'parent', Core.fct.alias(me, name, false, false));
         jsObject.defineProperty(me.publicEnv.$     , 'name'  , { get : me.getPrivateName   });

         if (me.name !== undefined)
            Core.declareToParent(me);

         Core.sealEnv(me.publicEnv);

         return me.publicEnv;
      };

      var fct                     = (function() {
         var implementedBy             = function(me) {
            return function(c) {
               if (!Class.isClass(c))
                  onerror(Errors.ObjectIsNotAClass(c));
               return checkImplementation(c, me);
            };
         };

         var isCompatible              = function(me) {

            return function(obj) {
               if (obj.$ === undefined)
                  return false;

               if (obj.$.definition === undefined)
                  return false;

               return checkCompatibility(obj.$.definition, me);
            };

         };

         return { implementedBy : implementedBy
                , isCompatible  : isCompatible};
      })();

      /*-------------------------------------------------------------------------------------------
      |                                   checkImplementation
      |--------------------------------------------------------------------------------------------
      | Description
      |
      |    V�rifie que la classe fournie en param�tre impl�mente l'interface.
      |
      |--------------------------------------------------------------------------------------------
      | Param�tres
      |
      |   . obj : publicEnv de la classe dont on souhaite v�rifier les impl�menetations
      |   . me  : Me de l'interface
      |
      |------------------------------------------------------------------------------------------*/
      var checkImplementation     = function(obj, me) {

         var i, interfaces;

         // On r�cup�re la liste des interfaces
         interfaces = obj.$.implements;

         // Si aucune interfaces n'est impl�ment�es, alors on retourne false
         if (interfaces === undefined)
            return false;

         // On recherche notre interface parmis la liste des interfaces impl�ment�es
         for(i in interfaces) {
            if (interfaces[i] == me.publicEnv)
               return true;
         }

         // Si on a rien trouv�, alors c'est que notre interface n'est pas impl�ment�es
         return false;
      };

      var checkCompatibility      = function(definition, me) {

         var descITF, descOBJ, name;

         for(name in me.Public) {

            if (name !== '$') {
               descITF = me.Public[name];
               descOBJ = definition[name];

               if (descOBJ === undefined)
                  return false;

               // V�rification sur la visibilit�
               // L'attribut ne peut-�tre priv�
               if (descOBJ.isPrivate())
                  return false;

               // Les propri�t�s ITF prot�g�s peuvent �tre impl�ment� par des propri�t�s publiques.*
               // L'inverse n'est pas possible.
               if (descOBJ.isProtected() && descITF.isPublic())
                  return false;
            }

         }

         return true;

      };

      var isInterface             = function(obj) {

         var me, e;

         try {
            if (obj.$ === undefined)
               return false;

            me = Core.getObject(obj.$.id);

            if ( me === undefined)
               return false;

            return me.publicEnv === obj && me.type === Constants.INTERFACE;
         }
         catch(e) {
            return false;
         }

      };

      var newInterface            = function() {
         var definition, openDefinition;

         // Valeurs par d�faut
         definition = { $ : { parent : undefined
                            , name   : undefined }};

         definition = Core.merge(arguments, definition);

         openDefinition = Definition.new(definition, {$:{sealed:false}}).$._open(Core.beacon);

         // On v�rifie que la d�finition est valide pour une classe.
         validateDefinition(openDefinition);

         // On scelle la d�finition
         openDefinition.publicEnv.$.seal();

         return createInterface(openDefinition);
      };

      var validateDefinition      = function(definition) {

         var desc, message, name;

         for(name in definition.openEnv) {

            if (name==='$') continue;

            desc = definition.openEnv[name];
            if (desc.isPrivate) {
               message = '"' + name + '" is private';
               break;
            }

            if (desc.isClass) {
               message = '"'+name+'" is a Class';
               break;
            }

            if (desc.isPackage) {
               message = '"'+name+'" is a Package';
               break;
            }

            if (desc.isInterface) {
               message = '"'+name+'" is an Interface';
               break;
            }
         }

         if (message !== undefined)
            return { error:true, message:message, descriptor:name };

         return {error:false};

      };

      newInterface.isInterface    = isInterface;
      newInterface.new            = newInterface;
      newInterface.$              = 'Interface';

      return { isInterface        : isInterface
             , new                : newInterface
             , validateDefinition : validateDefinition
             , namespace          : newInterface};

   })();

   Namespace             = (function() {

      var createNamespace         = function(definition) {

         var addValue, me, name, value;

         me                  = { name      : definition.$.name
                               , parent    : definition.$.parent
                               , publicEnv : definition.$.object
                               , type      : Constants.NAMESPACE};

         me.id = Core.getNewId(me);

         me.isSealed         = fct.isSealed(me);
         me.publicEnv        = me.publicEnv;

         me.publicEnv.$      = { _open       : fct._open(me)
                               , add         : fct.add(me)
                               , parent      : fct.getGlobal(me)
                               , id          : me.id
                               , isSealed    : me.isSealed
                               , name        : me.name
                               , namespace   : me.publicEnv
                               , seal        : fct.seal(me)
                               , type        : me.type};

         jsObject.defineProperty(me.publicEnv, 'toString', { value        : Core.fct.toString(me)
                                                           , writable     : false
                                                           , configurable : false});


         // Ajout les membres de la d�finition au namespace
         for(name in definition) {
            if (name === '$') continue;
            addValue = false;

            // Les descripteurs sont d�finis diff�rement
            if (Descriptor.isDescriptor(definition[name])) {
               //on ajoute simplement la valeur d�finie par le descripteur.
               addValue = true;
               value    = definition[name].getValue();
            }
            else {
               addValue = true;
               value    = definition[name];
            }

            if (addValue) {
               // Ajout de la valeur, si on doit en ajouter une
               jsObject.defineProperty(me.publicEnv, name, Core.fct.value(value));
            }
         }

         Core.sealEnv(me.publicEnv, false);

         if (definition.$.seal)
            me.publicEnv.$.seal();

         if (me.name !== undefined)
            Core.declareToParent(me);

         return me.publicEnv;
      };

      var declare                 = function(me) {
         var id, uniqueName;

         if (me.uniqueName !== undefined) {
            try {
               jsObject.defineProperty(uniqueNames, me.uniqueName, { value        : me
                                                                   , writable     : false
                                                                   , configurable : false});
            }
            catch(err) {
               onerror(new Errors.NotAUniqueName(me.uniqueName));
            }
            return;
         }

         id = me.id;

         while(true) {
            uniqueName = 'Namespace'+id;
            try {
               jsObject.defineProperty(uniqueNames, uniqueName, { value        : me
                                                                , writable     : false
                                                                , configurable : false});
               break;
            }
            catch(e) {
               id += 1;
            }
         }

         me.uniqueName = uniqueName;
      };

      var fct                     = (function() {

         var _open                     = function(me) {
            return function(bcn) {
               return Core.beacon === bcn ? me : undefined;
            };
         };

         var add                       = function(me) {
            return function(name, object, enumerable, fixed) {

               if (me.objectList[name] !== undefined)
                  return false;

               // boolean enumerable
               // default : true
               enumerable = enumerable === undefined ? true : !!enumerable;

               // boolean fixed
               // default : true
               fixed      = fixed === undefined ? true : !!fixed;

               jsObject.defineProperty(me.objectList, name, { enumerable   : enumerable
                                                            , value        : object
                                                            , writable     : false
                                                            , configurable : !fixed});
               return me.publicEnv.$;
            };
         };

         var getGlobal                 = function(me) {
            return function() {
               return me.global;
            };
         };

         var isSealed                  = function(me) {
            return function() {
               return jsObject.isSealed(me.publicEnv);
            };
         };

         var seal                      = function(me) {
            return function() {
               jsObject.seal(me.publicEnv);
               return me.publicEnv.$;
            };
         };

         return { _open     : _open
                , add       : add
                , getGlobal : getGlobal
                , isSealed  : isSealed
                , seal      : seal};

      })();

      var isNamespace             = function(obj) {
         var e, me;
         try {

            if (obj.$ === undefined)
               return false;

            if (obj.$.id === undefined)
               return false;

            me = Core.getObject(obj.$.id);

            if (me === undefined)
               return false;

            return me.publicEnv === obj && me.type === Constants.NAMESPACE;
         }
         catch(e) {
            return false;
         }
      };

      /* ------------------------------------------------------------------------------------------
      |                                     validateDefinition
      |--------------------------------------------------------------------------------------------
      |
      | Description
      | Valide la d�finition re�ue en param�tre lors de la cr�ation du namespace.
      |
      |--------------------------------------------------------------------------------------------
      | Crit�res de validit�
      |
      |   . La d�finition doit �tre un objet ou une fonction
      |   . Aucun �l�ment "toString" ne doit �tre d�fini
      |   . Aucun �l�ment "$" ne doit �tre d�fini, ou doit �tre un objet.
      |   . Si $ est d�fini :
      |      . Si $.object est d�fini, alors ce doit �tre un objet ou une fonction.
      |      . si $.global est d�fini, il faut que $.name le soit aussi.
      |      . si $.global et $.name sont d�finis, il faut que globalThis[name] ne soit pas
      |        d�finis, ou alors qu'il soit configurable et writable.
      |
      |------------------------------------------------------------------------------------------*/
      var validateDefinition      = function(definition) {

         var error, name, object, property, tested, value;

         if (typeof(definition) !== 'object' && typeof(definition) !== 'function')
            onerror(new Errors.InvalidDefinition('Invalid type for namespace object'));

         if (jsObject.getOwnPropertyDescriptor(definition, 'toString') !== undefined)
            onerror(new Errors.InvalidDefinition('toString not allowed in a namespace'));

         property = jsObject.getOwnPropertyDescriptor(definition, '$');

         if ( property!== undefined)
            if (typeof(property.value) !== 'object')
               onerror(new Errors.InvalidDefinition('$ must be undefined or must be an object'));

         if (definition.$ !== undefined) {

            if (definition.$.object !== undefined) {
               // $.object doit �tre un objet ou une fonction
               if (typeof(definition.$.object) !== 'object' && typeof(definition.$.object) !== 'function')
                  onerror(new Errors.InvalidDefinition('$.object must be an object or a function'));

               for(name in definition) {

                  property = jsObject.getOwnPropertyDescriptor(definition.$.object, name);

                  /* Si dans $.object il exite d�j� un membre avec le m�me nom,
                  on ne l�vera une exception que si ca valeur est diff�rente de celle
                  de la d�finition. Dans le cas d'un lien, alors on devra v�rifier que
                  les liens sont �gaux */
                  if (property !== undefined) {
                     if (!property.configurable || !property.writable) {
                        if (definition[name] !== property.value)
                           onerror(new Errors.InvalidDefinition('\''+name+'\' already defined in $.object'));
                     }
                  }
               }
            }

            if (definition.$.global !== undefined) {

               try {
                  error = jsObject.getOwnPropertyNames(Constants);
               }
               catch (error) {
                  onerror(new Errors.InvalidDefinition('parent is not a valid object'));
               }

               if (definition.$.name === '' || definition.$.name === undefined)
                  onerror(new Errors.InvalidDefinition('"name" must be defined if you want the namespace to be global'));

               property = jsObject.getOwnPropertyDescriptor(globalThis, definition.$.name);

               if (property !== undefined) {
                  if (!property.configurable || !property.writable) {
                     onerror(new Errors.InvalidDefinition('Name already use in the global context'));
                  }
               }
            }
         }
      };

      /* ------------------------------------------------------------------------------------------
      |                                     validateNamespace
      |--------------------------------------------------------------------------------------------
      |
      | Description
      | Valide le namespace
      |
      |--------------------------------------------------------------------------------------------
      | Crit�res de validit�
      |
      |   . La d�finition doit �tre un objet ou une fonction
      |   . Aucun �l�ment "toString" ne doit �tre d�fini
      |   . Aucun �l�ment "$" ne doit �tre d�fini, ou doit �tre un objet.
      |   . Si $ est d�fini :
      |      . Si $.object est d�fini, alors ce doit �tre un objet ou une fonction.
      |      . si $.global est d�fini, il faut que $.name le soit aussi.
      |      . si $.global et $.name sont d�finis, il faut que globalThis[name] ne soit pas
      |        d�finis, ou alors qu'il soit configurable et writable.
      |
      |------------------------------------------------------------------------------------------*/
      var validateNamespace       = function(me) {
		var name, property;
         for(name in me.publicEnv) {
            if (definition.$ === undefined) continue;
            if (definition.$.object !== undefined) {
               property = jsObject.getOwnPropertyDescriptor(definition.$.object, name);
               if (property !== undefined)
                  if (!property.configurable)
                     onerror(new Errors.InvalidDefinition('"' + name +'" isn\' configurable'));
            }
         }
      };

      var newNamespace            = function() {

         var definition, name;

         // Valeurs par d�faut
         definition = { $ : { object : {}
                            , parent : globalThis
                            , name   : undefined
                            , seal   : true     }};

         definition = Core.merge(arguments, definition);

         // Les descripteurs sont clon�s pour ne pas les modifier directement.
         for(name in definition) {
            if (Descriptor.isDescriptor(definition[name]))
               definition[name] = definition[name].clone().seal();
         }

         // On v�rifie que la d�finition est valide pour un namespace.
         validateDefinition(definition);

         definition.$.parent = Descriptor.new().Public(definition.$.parent);

         return createNamespace(definition);

      };

      var uniqueNames             = {};

      newNamespace.isNamespace = isNamespace;
      newNamespace.new         = newNamespace;
      newNamespace.$           = {};

      return { new         : newNamespace
             , isNamespace : isNamespace
             , namespace   : newNamespace};

   })();

   Package               = (function() {

      var createPackage           = function(me) {
         var env, id, listEnv, listAncestry, name, newFct, publicEnv, selfEnv, superEnv, thisEnv, packageMe;
         var parent;

         me.isSealed          = true;
         me.thisEnv           = Core.getThisEnv(me);
         me._ProtectedReturn  = fct._ProtectedReturn(me);
         me.authorizationList = {};
         
         me.authorizationList[me.id] = 'private';

         me.thisEnv.$   = { _open         : me._ProtectedReturn
                          , _patteBlanche : me._patteBlanche
                          , definition    : me.definition.privateEnv
                          , id            : me.id
                          , isSealed      : fct.isSealed(me)
                          , name          : me.definition.name
                          , Public        : me.publicEnv
                          , seal          : me.seal
                          , this          : true
                          , toString      : fct.toString(me.publicEnv, 'private')
                          , type          : me.type};

         publicEnv      = { env                  : me.publicEnv
                          , addPrivate           : false
                          , addPublic            : true
                          , overridePublic       : true
                          , include              : true};
         listEnv        = [publicEnv];

         // Declaration of the elements of the package
         for(name in me.definition.objectEnv) {

            if (!me.definition.objectEnv[name].isPublic)
               delete(me.publicEnv[name]);

            if (Class.isClass(me.definition.objectEnv[name].value)) {
               // The parent of the class must be the package itselfs (publicEnv)
               // otherwise, the class is considered as independant.
               if (me.definition.objectEnv[name].value.$._open(Core.beacon).parent.getValue() === me.publicEnv) {
                  declareClass(me, name);
                  continue;
               }
            }
            
            else if (isPackage(me.definition.objectEnv[name].value)) {
               packageMe = me.definition.objectEnv[name].value.$._open(Core.beacon);
               
               // If the package parent is us, then we must associate him with us
               if (packageMe.parent.getValue() === me.publicEnv) {

                  // If the package is not sealed, then we sealed it
                  if (!packageMe.isSealed)
                     sealPackage(packageMe);

                  declarePackage(me, name);
                  continue;
               }
            }
            Core.declare ( me.definition.objectEnv[name] // descriptor
                         , name                          // name
                         , me.thisEnv                    // thisEnv
                         , listEnv                       // listEnv
                         , false);                       // isStatic
         }

         jsObject.defineProperty(me.thisEnv.$     , 'parent', { get : me.getPrivateParent });
         jsObject.defineProperty(me.thisEnv.$     , 'name'  , { get : me.getPrivateName   });

         Core.sealEnv(me.thisEnv  , true, true);
         Core.sealEnv(me.publicEnv, true, false); // "me.publicEnv.$" is already sealed

         return me.publicEnv;

      };

      var declareClass            = function(me, name) {

         var classMe, desc;

         desc                      = me.definition.objectEnv[name];
         classMe                   = desc.value.$._open(Core.beacon);
         classMe.privateParent     = me.thisEnv;
         classMe.privateName       = name;
         
         Core.mergeAuthorization(me.authorizationList, classMe.authorizationList);         
         classMe.authorizationList = me.authorizationList;

         if (classMe.parent.isPublic()) {
            classMe.publicParent  = me.publicEnv;
            classMe.publicName    = name;
         }

         jsObject.defineProperty(me.thisEnv, name, { value        : classMe.thisEnv
                                                   , writable     : false
                                                   , configurable : false
                                                   , enumerable   : true});

         if (desc.isPublic)
            jsObject.defineProperty(me.publicEnv, name, { value        : classMe.publicEnv
                                                        , writable     : false
                                                        , configurable : false
                                                        , enumerable   : true});
         else
            delete(me.publicEnv[name]);

      };

      var declarePackage          = function(me, name) {

         var packageMe, desc;

         desc                    = me.definition.objectEnv[name];
         packageMe               = desc.value.$._open(Core.beacon);
         packageMe.privateParent = me.thisEnv;
         packageMe.privateName   = name;
         
         Core.mergeAuthorization(me.authorizationList, packageMe.authorizationList);         
         packageMe.authorizationList = me.authorizationList;

         if (packageMe.parent.isPublic()) {
            packageMe.publicParent  = me.publicEnv;
            packageMe.publicName    = name;
         }

         jsObject.defineProperty(me.thisEnv, name, { value        : packageMe.thisEnv
                                                   , writable     : false
                                                   , configurable : false
                                                   , enumerable   : true});

         if (desc.isPublic)
            jsObject.defineProperty(me.publicEnv, name, { value        : packageMe.publicEnv
                                                        , writable     : false
                                                        , configurable : false
                                                        , enumerable   : true});
         else
            delete(me.publicEnv[name]);

         if (!packageMe.isSealed)
            sealPackage(packageMe);

      };

      var fct                     = (function () {

         var add                       = function(me) {

            return function(name, obj, p_enumerable, p_fixed) {

               var prop_public, prop_this;

               if (me.isSealed)
                  return undefined;

               // On v�rifie qu'une propri�t� de m�me nom n'est pas fix�e dans l'environnement publique
               prop_public = jsObject.getOwnPropertyDescriptor(me.publicEnv, name);
               if (prop_public !== undefined) {
                  if (!prop_public.writable && !prop_public.configurable) {
                     return undefined;
                  }
                  prop_public = false;
               }
               else {
                  prop_public = true;
               }

               prop_this = jsObject.getOwnPropertyDescriptor(me.thisEnv, name);
               if (prop_this !== undefined) {
                  if (!prop_this.writable && !prop_this.configurable) {
                     return undefined;
                  }
                  prop_this = false;
               }
               else {
                  prop_this = true;
               }

               // boolean p_enumerable
               // Default : true
               p_enumerable = p_enumerable === undefined ? true : !!p_enumerable;

               // boolean p_fixed
               // Default : true
               p_fixed = p_fixed === undefined ? true : !!p_fixed;

               // On ne fait des modifictions que si l'on peut ajouter aux deux environnments
               if (!prop_public)
                  jsObject.defineProperty(me.publicEnv, name, { writable : true });

               if (!prop_this)
                  jsObject.defineProperty(me.thisEnv, name, { writable : true });

               jsObject.defineProperty ( me.publicEnv, name, { value        : obj
                                                             , writable     : false
                                                             , configurable : !p_fixed
                                                             , enumerable   : p_enumerable });

               jsObject.defineProperty ( me.thisEnv, name, { value        : obj
                                                           , writable     : false
                                                           , configurable : !p_fixed
                                                           , enumerable   : p_enumerable });
            };

         };
         
         var getDefinition             = function(me) {
            return function() {
               return me.definition;
            };
         };

         var isSealed                  = function(me) {
            return function() {
               return me.isSealed;
            };
         };

         var isSealable                = function(me) {
            return function() {
               return isSealablePackage(me, {});
            };
         };

        /**
         * Seal the package.
         * @func seal
         * @param {me} "Me" object of the package to seal
         * @param {definition} definition of the package
         * @memberof main.Package.fct
         */
         var seal                      = function(me) {
            return function() {
               var list;
      
               // If package already sealed, then return
               if (me.isSealed)
                  return undefined;
      
               list = {};
      
               if (!isSealablePackage(me, list)) {
                  throw new Errors.NotSealablePackage();
               };
      
               makeDefinition(me, {});
               
               sealPackage(me);
            };
         };

         var toString                  = function(env, level) {
            return function() {
               return (level !== undefined ? '('+level+') ' : '') + 'Package' + (env.name !== undefined ? ' : '+env.name : '');
            };
         };

         var _ProtectedReturn          = function (me) {
            return function (b) {
               if (b != Core.beacon) {
                  onerror(new Errors.AccessViolation());
                  return;
               }
               return me;
            };
         };

         return { _ProtectedReturn : _ProtectedReturn
                , add              : add
                , isSealed         : isSealed
                , isSealable       : isSealable
                , getDefinition    : getDefinition
                , seal             : seal
                , toString         : toString};
      })();

      var isPackage                    = function(obj) {

         var e, me, publicEnv;
         try {

            if (obj === undefined)
               return false;

            if (obj.$ === undefined)
               return false;

            me = Core.getObject(obj.$.id);

            if (me === undefined)
               return false;

            return me.publicEnv === obj && me.type === Constants.PACKAGE;
         }
         catch(e) {
            return false;
         }

         return true;

      };

      var newPackage                   = function() {

         var definition, desc, me, name, seal;

         // Default values
         definition = { $ : { seal   : true
                            , parent : undefined
                            , name   : undefined }};

         // Merging the definition with the default values
         definition = Core.merge(arguments, definition);

         // Creation of "me" object
         me                  = { definition    : undefined
                               , name          : definition.$.name
                               , privateParent : undefined
                               , publicParent  : undefined
                               , privateName   : undefined
                               , publicName    : undefined
                               , publicEnv     : {}
                               , isSealed      : false
                               , type          : Constants.PACKAGE};

         me._patteBlanche    = Core.fct._patteBlanche(me);
         me.id               = Core.getNewId(me);
         me.seal             = fct.seal(me);
         me.publicEnv.$      = { _open         : fct._ProtectedReturn(me)
                               , _patteBlanche : me._patteBlanche
                               , id            : me.id
                               , isSealed      : fct.isSealed(me)
                               , isSealable    : fct.isSealable(me)
                               , name          : undefined
                               , Public        : true
                               , seal          : me.seal
                               , toString      : fct.toString(me.publicEnv, 'public')
                               , type          : me.type };

         jsObject.defineProperty(me.publicEnv.$     , 'definition', { get : fct.getDefinition() });

         me.publicEnv.$._patteBlanche = me._patteBlanche;

         if (definition.$.parent === undefined)
            me.parent           = Descriptor.new()(globalThis);
         else
            me.parent           = Descriptor.isDescriptor(definition.$.parent) ? definition.$.parent : Descriptor.new()(definition.$.parent);

         // Si le parent est un package, alors on ne scèlle pas.
         if (isPackage(me.parent.getValue()))
            definition.$.seal = false;

         // $.seal is not a definition attribute
         // Has we create a package, seal refers then to the package
         seal = definition.$.seal === undefined ? true : !!definition.$.seal;

         me.getPrivateParent = Core.fct.getValue(me, 'privateParent');
         me.getPublicParent  = Core.fct.getValue(me, 'publicParent');

         me.getPrivateName   = Core.fct.getValue(me, 'privateName');
         me.getPublicName    = Core.fct.getValue(me, 'publicName');

         jsObject.defineProperty(me.publicEnv.$   , 'parent', { get : me.getPublicParent  });
         jsObject.defineProperty(me.publicEnv.$   , 'name'  , { get : me.getPublicName    });

         if (me.name !== undefined)
            Core.declareToParent(me);

         // If the package is not to seal, then we create only the public environment
         if (!seal) {

            for(name in definition) {
               if (name === '$') continue;
               me.publicEnv[name] = definition[name];
            }

            Core.sealEnv(me.publicEnv, false); // Sealing "$", but not the public environment that will change after
            jsObject.preventExtensions(me.publicEnv);

            return me.publicEnv;
         }

         definition.$.seal = true;
         definition = Definition.new(definition).$._open(Core.beacon);
         me.definition  = definition;
         // Sealing definition
         definition.publicEnv.$.seal();

         return createPackage(me, {});
      };

      /**
       * Determine weither or not the package is sealable.
       * A Package is sealable if :
       *    - It's already sealed
       *    - Or each of his child package and his parent package respect the following rules :
       *      - a parent package musn't be sealed
       *      - and a child package musn't be sealed
       * A child is detected as so if :
       *    - he declare a package as a parent
       *    - and has a valid name
       *    - and in the parent package, the name is a descriptor, with no value
       * @function isSealablePackage
       * @memberof Core.Package
       * @access private
       */
      var isSealablePackage            = function(me, liste) {

         var properties, parent, pkg, name, desc,obj, value, cl;

         if (me.isSealed)
            return true;

         if (liste[me.id] !== undefined)
            return true;

         liste[me.id] = me;

         parent = me.parent.getValue(); // In "me" object

         // Checking if we are well defined in the package parent
         if (isPackage(parent)) {
            if (parent.$.isSealed())
               return false;

            // The package must have been declared in the parent package.
            // In the package parent, the declaration is an empty descriptor (public or private)
            desc = parent[me.name];

            if (!Descriptor.isDescriptor(desc))
               return false;

            if (desc.isProtected() || desc.isStatic() || (desc.getValue() !== undefined && desc.getValue() !== me.publicEnv))
               return false;
               
            if (!isSealablePackage(Core.getMe(parent), liste))
               return false;
         };

         // Checking all members
         for(name in me.publicEnv) {
            properties = jsObject.getOwnPropertyDescriptor(me.publicEnv, name);

            if (!properties.writable || !properties.configurable || properties.get !== undefined ||properties.set !== undefined) {
               return false
            };

            value = me.publicEnv[name];

            if (Descriptor.isDescriptor(value)) {
               if (value.isProtected() || value.isStatic())
                  return false;
               value = value.getValue();
            };

            if (isPackage(value)) {
               if (!isSealablePackage(Core.getMe(value), liste)) {
                  return false;
               };
            }
            else if (Class.isClass(value)) {
               cl = Core.getMe(value);
               if (cl.parent === me.publicEnv) {
                  if (me.publicEnv[cl.name] !== cl)
                     return false;
                  liste[cl.id] = cl;
               };
            };
         };

         return true;
      };

      var sealPackage                  = function(me) {
         return createPackage(me, {});
      };

      var makeDefinition               = function(me, list) {

         var definition, name;

         if (list[me.id] !== undefined)
            return;

         list[me.id] = me;

         definition = {};

         for(name in me.publicEnv) {
            definition[name] = Descriptor.isDescriptor(me.publicEnv[name]) ? me.publicEnv[name] : Descriptor.new().Public(me.publicEnv[name]);

            if (isPackage(definition[name].getValue())) {
               makeDefinition(Core.getMe(definition[name].getValue()), list);
            };
         };

         
         definition = Definition.new(definition).$._open(Core.beacon);
         me.definition  = definition;
         // Sealing definition
         definition.publicEnv.$.seal();

         if (me.parent !== undefined)
            if (isPackage(me.parent.getValue()))
               makeDefinition(Core.getMe(me.parent), list);
      };

      var getAuthorizationList = function (me, auth, first) {

         var meObject;

         first = first === undefined ? true : first;

         if (auth[me.id] !== undefined)
            return true;

         auth[me.id] = {object:me.publicEnv, visibility:'private'};

         // Sealing or frozing the public environment is illegal
         if (jsObject.isSealed(me.publicEnv) || jsObject.isFrozen(me.publicEnv))
            onerror(new Errors.InvalidDefinition());

         for(name in me.publicEnv) {

            if (name === '$') continue;

            properties = jsObject.getOwnPropertyDescriptor(me.publicEnv, name);


            if ((!properties.writable || !properties.configurable) && !Class.isClass(me.publicEnv[name]))
               onerror(new Errors.InvalidDefinition());

            if (Class.isClass(me.publicEnv[name])) {
               if(me.publicEnv[name].$.parent === me.publicEnv) {
                  auth[me.id] = {me:Core.getMe(me.publicEnv[name]), visibility:'private'};
               };
            };

            // Package authorization will be added only if the parent package is us
            if (isPackage(me.publicEnv[name])) {

               meObject   = Core.getMe(me.publicEnv[name]);

               if (meObject.parent === me.publicEnv) {
                  if (meObject.isSealed)
                     getAuthorizationList(Core.getMe(me.publicEnv[name]), auth, false);
                  else
                     auth[me.id] = {object:me.publicEnv[name], visibility:'private'};
               }
            };

            me.definition[name] = me.publicEnv[name];

         };

         if (!first)
            return;



      };

      var maxID                        = 0;
      newPackage.isPackage             = isPackage;
      newPackage.new                   = newPackage;
      newPackage.$                     = 'Package';

      return { isPackage : isPackage
             , new       : newPackage
             , namespace : newPackage};

   })();

   jsObject = Core.secureObject();
   publicEnv;

   /**
   * Version of JsPackage
   * @variable version
   * @type string
   * @memberof main
   **/
   Version           = Class.new({
        major    : Descriptor.new().Private
      , minor    : Descriptor.new().Private
      , revision : Descriptor.new().Private
      , $ : { initialization : function(major, minor, revision) {
            this.major    = major;
            this.minor    = minor;
            this.revision = revision;
         }}
      , getMajor    : function() { return this.major    }
      , getMinor    : function() { return this.minor    }
      , getRevision : function() { return this.revision }
      , toString    : function() { return '' + this.major + '.'+this.minor + '.' + this.revision }
   });
   
   version = new Version(0, 5, 1);

   Core.initialize();

})( { parent            : this.window === undefined ? global : this
    , name              : 'JsPackage'
    , debug             : true
    , onerror           : function(error) {
        throw error;
      }
   });