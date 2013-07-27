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
* @typedef {Class} Class
*/

/**
 * @namespace JsPackage
 */
(function (parameters) {
   "use strict";

   /**
   * This object will be use to determine the accessibility of the different members of 
   * @typedef {object} DeclarationProperty
   * @memberof JsPackage
   */

   var globalThis, globalName, debugMode, defaultNamespaces, onerror, Class, Constants, Core;

   globalThis        = parameters.parent;
   globalName        = '' + parameters.name;
   debugMode         = parameters.debug === undefined ? false : !!parameters.debug;
   onerror           = parameters.onerror;

   if (debugMode) {
      console.log('JsPackage : ' + globalName + ' in debugMode');
   }

   /**
   * An authorization list is used to list all objects that can access the currect package/class/instance private/protected environment.
   * @typedef {array} JsPackage.AuthorizationList
   */

   /*----------------------------------------------------------------------------------------------
   |                                 Package interne : Class
   |-----------------------------------------------------------------------------------------------
   | Description
   |
   |    Ce package permet la création de classe et de leurs instances.
   |
   |-----------------------------------------------------------------------------------------------
   | Création d'une classe
   |
   |    La création d'une classe est faite par la fonction "newClass". Cette fonction reçoit entre
   | paramètre la définition de la classe. Elle va convertir la définition en définition standard
   | et ensuite faire appel à "createClass", en lui fournissant la définition standard ouverte
   | (cad, l'objet "me" de la définition).
   |    "createClass" va alors créer l'objet "me" de la classe, ainsi que les différents environ-
   | nements de la classe :
   |        . publicEnv
   |        . thisEnv
   |        . selfEnv
   |        . superEnv
   |
   | Pour la description de ces différents environnements, voir la section "Description des
   | environnements" plus loin.
   |
   | Pour chacun de ces environnements, il va créer des variables listants les propriétés de
   | visibilité des attributs et méthodes. On va à chaque fois préciser si l'on peut ajouter les
   | attributs/méthodes publiques, privés et protégés, et si on peut les surcharger ou non.
   | Ces objets possède aussi une propriété "include", valorisé initialement à "true". Cet
   | attribut permettra de filtrer par la suite les obejts "properties" à traiter.
   | Ces variables sont respectivemenets :
   |        . publicProperties
   |        . thisProperties
   |        . selfProperties
   |        . superProperties
   |
   | Ces 4 objets vont être enregistrés dans un tableau : listProperties.
   |
   | On va ensuite créer la variable "levels". Il s'agira d'un tableau simple dont le seul élément
   | à l'initialisation sera "me". Le rôle de level sera discuté plus loin.
   |
   | On va vérifier ensuite si la classe hérite des propriétés d'une autre classe. Si oui, alors
   | on va appeler la méthode "extendClass" en lui fournissant la classe étendue, "listProperties"
   | et "levels".
   |
   | "extendClass" est une fonction qui ressemble fortement à "createClass". Son rôle est cependant
   | tout autre. Elle va commencer par créer l'objet "me" de la classe fournie en paramètre.
   | Elle va créer de la même manière les variables publicProperties, thisProperties,
   | selfProperties et superProperties correspondant à ces différents environnements. Cette fois
   | cependant, ces objets vont être ajoutés à "listProperties" reçu en paramètre. Leurs attributs
   | "include" est valorisé à ce moment là à "true".
   | De la même manière que "createClass", on va vérifier si la classe hérite d'une autre classe.
   | si c'est le cas, on appelera "extendClass" avec la classe héritée, "listProperties" et
   | "levels".
   | Si ce n'est pas le cas, on va alors s'occuper de déclarer les propriétés à notre classe.
   | héritante.
   | On va pour celà appeler la fonction "Core.declare", à laquelle on va fournir pour chaque
   | propriété de la classe héritante, son nom et sa description. "Core.declare" recevera aussi
   | "listProperties" et le "thisEnv" de la propriété.
   | "Core.declare" va alors parcourir chaque objets de "listProperties" et déterminer s'il faut
   | ou non y ajouter la propriété passée en paramètre.
   | Exemple :
   |   Si la propriété est privée et que l'élement 0 de "listProperties" indique de ne pas
   | ajouter les objets privés (addPrivate = false), alors on ajoutera pas la propriété à
   | l'environnement associé.
   |
   | A noter qu'en réalité, on ajoute un "alias" vers la propriété (qui elle n'existe que sur un
   | seul thisEnv).
   |
   |---------------------------------------------------------------------------------------------*/
   /**
    * The namespace Class contains all the function for class creation.
    * @namespace Class
    * @memberof JsPackage
    * @access private
    */
   Class                 = (function () {
         
      /**
      * <p>Create a new class from a definition. The definition have been validated.</p>
      * First, the {@link JsPackage.Class.ClassMe|me} environment of the class will be created. Then, we create the extended environment
      * using the {@link JsPackage.Class.extendedClass}.
      * @function createClass
      * @returns {Class} Newly created class
      * @memberof JsPackage.Class
      * @access private
      * @param {DefinitionMe} definition Definition of the function. The definition has been validated at this point.
      * @property {JsPackage.Class.ClassMe} me "Me" of the class.
      * @property {JsPackage.DeclarationProperty[]} listProperties List of all declaration properties of the class and the child classes.
      * @property {Descriptor} publicInitialization This variable is used to determine class can be instanciable in public or not. It's determine by the visibility of the initialization function of the definition.
      * @property {JsPackage.DeclarationProperty} privateProperties Declaration property of the private environment of the class
      * @property {JsPackage.DeclarationProperty} protectedProperties Declaration property of the protected environment of the class
      * @property {JsPackage.DeclarationProperty} publicProperties Declaration property of the public environment of the class
      * @property {JsPackage.DeclarationProperty} selfProperties Declaration property of the self environment of the class
      */
      var createClass             = function (definition) {

         var env, id, listProperties, listAncestry, me, meExtends, name, newFct, protectedProperties, publicInitialization, publicProperties, selfProperties, thisProperties, openExtend;

         /**
         * {@link JsPackage.me|me} object of classes
         * @class ClassMe
         * @memberof JsPackage
         * @access public
         */
         me             = { 
                            /**
                            * List all the authorized {@link Class|classes} and {@link Package|packages} that can access to the private or protected environment of the class or his instance.
                            * @member {JsPackage.AuthorizationList} authorizationList
                            * @memberof JsPackage.Class.ClassMe
                            */
                            authorizationList    : {}
                            /**
                            * Opened definition of the class
                            * @member {DefinitionMe} Definition
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , definition           : definition
                            /**
                            * Determine if the parent is enumerable (true) of not (false)
                            * @member {boolean} enumerable
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , enumerable           : definition.enumerable
                            /**
                            * Class extended by the current class.
                            * @member {Class} extends
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , extends              : definition.extends
                            /**
                            * Initialization function called after instanciation
                            * @function initialization
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , initialization       : definition.initialization
                            /**
                            * List of the interfaces implemented by the class
                            * @member {Class[]} implements
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , implements           : definition.implements
                            /**
                            * <p>Determine weither or not the class is an abstract class.</p>
                            * <p>This value depends on the $.abstract field of the definition of the class</p>
                            * @function isAbstract
                            * @memberof JsPackage.Class.ClassMe
                            * @returns {boolean} true: the class is an abstract class, false otherwise
                            */
                          , isAbstract           : definition.isAbstract
                            /**
                            * <p>Determine weither or not the class is an final class.</p>
                            * <p>This value depends on the $.final field of the definition of the class</p>
                            * @function isFinal
                            * @memberof JsPackage.Class.ClassMe
                            * @returns {boolean} true: the class is final, false otherwise
                            */
                          , isFinal              : definition.isFinal
                            /**
                            * @member {Class[]} levels
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , levels               : []
                            /**
                            * Name of the classs. All "Me" object must have this property
                            * @member {string} name
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , name                 : definition.name
                            /**
                            * Parent of the class. All "Me" object must have this property
                            * @member {NamespaceLike} Parent
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , parent         : definition.parent
                            /**
                            * Name of the class. This property is called by the get function {@link Class.name} in private environment
                            * @member {string} privateName
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , privateName    : undefined
                            /**
                            * Parent of the class. This property is called by the get function {@link Class.parent} in private environment
                            * @member {string} privateParent
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , privateParent  : undefined
                            /**
                            * Protected environment of the class
                            * @member {ClassProtectedEnv} protectedEnv
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , protectedEnv   : {}
                            /**
                            * This function will be use as a false prototype of the class : Instance will be created with this function, allowing the use of "instanceof" standard function.
                            * @member {function} prototype
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , prototype      : function() {}
                            /**
                            * Name of the class. This property is called by the get function {@link Class.name} in public environment
                            * @member {string} publicName
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , publicName     : undefined
                            /**
                            * Parent of the class. This property is called by the get function {@link Class.parent} in public environment
                            * @member {NamespaceLike} publicParent
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , publicParent   : undefined
                            /**
                            * Self environment of the class.
                            * @member {ClassSelfEnv} selfEnv
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , selfEnv        : {}
                            /**
                            * Super environment of the class
                            * @member {ClassSuperEnv} superEnv
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , superEnv       : undefined
                            /**
                            * toString function used to represent class.
                            * @function toString
                            * @memberof JsPackage.Class.ClassMe
                            * @returns {string} String representation of the class
                            */
                          , toString       : function() { return 'Class : Me'; }
                            /**
                            * Constant representing the class.
                            * @member {string} type
                            * @memberof JsPackage.Class.ClassMe
                            */
                          , type           : Constants.CLASS};

         /**
         * ID of the class
         * @member {number} id
         * @memberof JsPackage.Class.ClassMe
         */
         me.id               = Core.getNewId(me);

         /**
         * Determine if the current class has instanciate the given parameter object.
         * @func classOf
         * @memberof JsPackage.Class.ClassMe
         * @param {object} object to test
         * @returns {boolean} true: the class is the one who instanciate the object. False otherwise
         */
         me.classOf          = fct.classOf(me);
         /**
         * Determine if the current class is a parent of the object
         * @func parentOf
         * @memberof JsPackage.Class.ClassMe
         * @param {object} object to test
         * @returns {boolean} true: the class is parent of the instance, false otherwise
         */
         me.parentOf         = fct.parentOf(me);
         /**
          <p>Return the parent of the class. This function will be use as a get property in the private environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPrivateParent
         * @memberof JsPackage.Class.ClassMe
         * @param {object} object to test
         * @returns {NamespaceLike} parent of the class. undefined if their is no parent.
         */
         me.getPrivateParent = Core.fct.getValue(me, 'privateParent');
         
         /**
          <p>Return the parent of the class. This function will be use as a get property in the public environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPublicParent
         * @memberof JsPackage.Class.ClassMe
         * @param {object} object to test
         * @returns {NamespaceLike} parent of the class. undefined if their is no parent.
         */
         me.getPublicParent  = Core.fct.getValue(me, 'publicParent');
         /**
          <p>Return the parent name of the class in the parent object. This function will be use as a get property in the private environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPrivateName
         * @memberof JsPackage.Class.ClassMe
         * @param {object} object to test
         * @returns {string} the class name in parent object. undefined if their is no parents.
         */
         me.getPrivateName   = Core.fct.getValue(me, 'privateName');
         /**
          <p>Return the parent name of the class in the parent object. This function will be use as a get property in the public environnment.</p>
          <p>This function must exist because at the creation of the class, the parent is not yet fixed :
          the parent is fixed once it is sealed. Before that, it's not even sure that the class will be a member of the parent object</p>
         * @func getPublicName
         * @memberof JsPackage.Class.ClassMe
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
         * @memberof JsPackage.Class.ClassMe
         */
         me.new                      = newFct;
         /**
         * Public environment of the class
         * @member {ClassPublicEnvironment} publicEnv
         * @memberof JsPackage.Class.ClassMe
         */
         me.publicEnv                = publicInitialization;
         /**
         * Private environment of the class
         * @member {ClassPrivateEnvironment} thisEnv
         * @memberof JsPackage.Class.ClassMe
         */
         me.thisEnv                  = fct.getThisEnv(me);
         /**
         * Return a copy of the ClassMe.{@link JsPackage.Class.ClassMe.ancestry|ancestry}.
         * @member {Class[]} getAncestry
         * @memberof JsPackage.Class.ClassMe
         */
         me.getAncestry              = fct.getAncestry(me);
         /**
         * Public environment of the class
         * @member {Class} Class
         * @memberof JsPackage.Class.ClassMe
         */
         me.Class                    = me.publicEnv;

         me.protectedEnv.toString    = me.publicEnv.toString;
         me.selfEnv.toString         = me.selfEnv.toString;

         me.publicEnv.prototype      = me.prototype.prototype;

         // Propriétés des environnements
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
            * @memberof JsPackage.Class.ClassMe
            */
            me.ancestry = { me           : openExtend.ancestry.me.slice(0)
                          , publicEnv    : openExtend.ancestry.publicEnv.slice(0)};

            me.ancestry.me.unshift(openExtend);
            me.ancestry.publicEnv.unshift(openExtend.Class);

            me.superEnv  = openExtend.protectedEnv;
            me.rootId    = openExtend.rootId;
         }
         else {
            me.ancestry  = {me:[], publicEnv:[]};
            me.rootId    = me.id;
         }

         me.authorizationList[me.id] = 'private';

         thisProperties.include    = false;
         selfProperties.addPrivate = true;

         for(name in me.definition.staticEnv) {
            Core.declare ( definition.staticEnv[name] // descriptor
                         , name                       // name
                         , me.thisEnv                 // thisEnv
                         , listProperties             // listEnv
                         , true);                     // isStatic
         }

         me.thisEnv.$       = { _patteBlanche      : Core.fct._patteBlanche(me)
                              , Class              : me.thisEnv
                              , classOf            : me.classOf
                              , contextClass       : me.publicEnv
                              , definition         : me.definition.privateEnv
                              , extends            : me.extends
                              , id                 : me.id
                              , implements         : me.implements
                              , isAbstract         : fct.isAbstract(me)
                              , isFinal            : fct.isFinal(me)
                              , getAncestry        : me.getAncestry
                              , new                : me.new
                              , parentOf           : me.parentOf
                              , Public             : me.publicEnv
                              , Self               : me.selfEnv
                              , Super              : me.superEnv
                              , this               : true
                              , toString           : fct.ClassToString(me.thisEnv, 'private')
                              , type               : me.type};

         me.protectedEnv.$  = { _patteBlanche      : Core.fct._patteBlanche(me)
                              , Class              : me.Class
                              , classOf            : me.classOf
                              , contextClass       : me.publicEnv
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
                              , contextClass       : me.publicEnv
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

         jsObject.defineProperty(me.thisEnv.$     , 'parent', { get : me.getPrivateParent });
         jsObject.defineProperty(me.selfEnv.$     , 'parent', { get : me.getPrivateParent });
         jsObject.defineProperty(me.publicEnv.$   , 'parent', { get : me.getPublicParent  });
         jsObject.defineProperty(me.protectedEnv.$, 'parent', { get : me.getPublicParent  });

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

/*         if (me.protectedEnv !== undefined)
            me.protectedEnv.$.toString = fct.ClassToString(me, 'protected');*/

         // On scèlle l'ensemble des environnements

         if (debugMode) {
            me.thisEnv.$.debug   = { publicEnv  : me.publicEnv
                                   , privateEnv : me.thisEnv
                                   , selfEnv    : me.selfEnv
                                   , superEnv   : openExtend !== undefined ? openExtend.protectedEnv : undefined};

            me.publicEnv.$.debug = me.thisEnv.$.debug;
            me.selfEnv.$.debug   = me.thisEnv.$.debug;
         }

         for(env in listProperties) {
            Core.sealEnv(listProperties[env].env);
         }

         return me.publicEnv;

      };

     /**
      * Create a classe using a Definition object receive in parameter.
      * The definition must be an open definition.
      * @func createObject
      * @memberof JsPackage.Class
      * @access private
      * @param {Class} cls Class use to create the object
      * @returns {Instance} Instance created
      */
      var createObject            = function (cls) {

         var classMe, listEnv, me, meExtends, name, protectedEnv, publicEnv, selfEnv, superEnv, thisEnv;

         classMe         = Core.getObject(cls.id);

         // Création de l'objet Me
         me              = { Class          : classMe.publicEnv
                           , classMe        : classMe
                           , definition     : classMe.definition
                           , extends        : classMe.definition.extends
                           , initialization : classMe.initialization
                           , levels         : []
                           , meExtends      : classMe.definition.extends !== undefined ? classMe.definition.extends.$._open(Core.beacon) : undefined
                           , privateParent  : classMe.privateParent
                           , publicParent   : classMe.publicParent
                           , protectedEnv   : {}
                           , publicEnv      : new classMe.prototype()
                           , selfEnv        : {}
                           , type           : Constants.OBJECT
                           };

         me.getPrivateParent = Core.fct.getValue(me, 'privateParent');
         me.getPublicParent  = Core.fct.getValue(me, 'publicParent');

         me.getPrivateName   = Core.fct.getValue(me, 'privateName');
         me.getPublicName    = Core.fct.getValue(me, 'publicName');

         // Création de l'environnement "this"
         me.thisEnv      = Core.getThisEnv(me);

         //Définition des différents environnements
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

         // Ajout de Me à la liste des ancêtres
         me.levels.push(me);

         // Si la classe est une classe étendue, alors on va créer les objets parents
         if (me.extends !== undefined) {
            meExtends   = extendObject(me.extends, listEnv, me.levels, me);

            /* Création de la liste des ancêtres :
               - On récupère la liste des ancêtres de la classe parente
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

         // Déclaration des attributs et des méthodes statiques
         for(name in me.definition.staticEnv) {
            /* Note : les descriptor ont déjà tous été définis (dans createClass).
            thisEnv n'a donc pas de sens ici.*/
            Core.declare ( me.definition.staticEnv[name] // descriptor
                         , name                          // name
                         , {}                            // thisEnv
                         , listEnv                       // listEnv
                         , true);                        // isStatic
         }

         thisEnv.include    = false;

         // Déclaration des attributs et méthodes
         for(name in me.definition.objectEnv) {
            Core.declare ( me.definition.objectEnv[name]// descriptor
                         , name                         // name
                         , me.thisEnv                   // thisEnv
                         , listEnv                      // listEnv
                         , false);                      // isStatic
         }

         // Création de $
         me.thisEnv.$    = { _patteBlanche  : Core.fct._patteBlanche(me)
                           , Class          : classMe.thisEnv
                           , contextClass   : classMe.publicEnv
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
                           , contextClass   : classMe.publicEnv
                           , initialization : undefined
                           , parent         : classMe.privateParent
                           , Public         : me.publicEnv
                           , Self           : me.selfEnv
                           , Super          : me.thisEnv.$.Super
                           , type           : me.type};

         me.protectedEnv.$ = { _patteBlanche  : Core.fct._patteBlanche(me)
                             , Class          : classMe.thisEnv
                             , contextClass   : classMe.publicEnv
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
      * @memberof JsPackage.Class
      * @access private
      * @param {Class} cls Class use to create the object
      * @param {JsPackage.DeclarationProperty[]} listEnv List of all declaration properties 
      * @param levels
      * @param context
      * @returns {Instance} Instance created
      */
      var extendClass             = function(cls, listEnv, levels, context) {
         var classMe, listAncestry, me, name, openClass, selfEnv, thisEnv;

         // On récupère l'objet "Me" de la classe finale (celle créee par createClass)
         classMe        = Core.getObject(cls.$.id);

         context.authorizationList[classMe.id] = 'protected';

         // Création de l'objet Me de la classe courante
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
                          , contextClass  : context.publicEnv
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

         // Si la classe courante à une classe parente, alors on la crée
         if (me.extends !== undefined) {
            extendClass(me.extends, listEnv, levels, context);
         }

         thisEnv.include     = false; // On l'exclu car il va servir de thisEnv juste après

         for(name in me.definition.staticEnv) {
            /* Note : thisEnv et selfEnv sont indépendant dans les classes parentes :
               Si on surcharge une méthode de thisEnv, selfEnv ne doit pas changer
            */
            Core.declare ( me.definition.staticEnv[name] // descriptor
                         , name                          // name
                         , me.thisEnv                    // thisEnv
                         , listEnv                       // listEnv
                         , true);                        // isStatic
         }

         // Dans les étapes suviantes, les attributs publiques et protégés devront être surchargés
         thisEnv.include    = true;

         return;

      };

     /**
      * This function extend a object with the parent classes
      * The definition must be an open definition.
      * @func extendObject
      * @memberof JsPackage.Class
      * @param {Class} cls Class use to create the object
      * @param {JsPackage.DeclarationProperty[]} listEnv List of all declaration properties 
      * @param levels
      * @param parentMe
      * @returns {Instance} Instance created
      * @access private
      */
      var extendObject            = function (cls, listEnv, levels, parentMe) {
         var classMe, me, meExtends, name, openClass, protectedEnv, selfEnv, superEnv, thisEnv;

         // Récupération de l'objet Me de la classe finale
         classMe        = Core.getObject(cls.$.id);

         // Création de Me de l'objet
         me             = { Class        : classMe.publicEnv
                          , classMe      : classMe
                          , definition   : classMe.definition
                          , extends      : classMe.definition.extends
                          , levels       : levels
                          , protectedEnv : {}
                          , selfEnv      : {}
                          , thisEnv      : {}
                          , type         : Constants.OBJECT};

         //Définition des différents environnements. Cf. Core.declare
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

         // Si l'objet la classe courante à elle aussi une clase parente, alors il faut créer l'objet parent
         if (me.extends !== undefined) {
            meExtends            = extendObject(me.definition.extends, listEnv, levels, parentMe);

            /* Création de la liste des ancêtres :
               - On récupère la liste des ancêtres de la classe parente
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

         // Ajouts des propriétés statiques
         for(name in me.definition.staticEnv) {
            /* Note : les descriptor ont déjà tous été définis (dans createClass).
            thisEnv n'a donc pas de sens ici.*/
            Core.declare ( me.definition.staticEnv[name]   // descriptor
                         , name                            // name
                         , {}                              // thisEnv
                         , listEnv                         // listEnv
                         , true);                          // isStatic
         }

         thisEnv.include     = false;

         // Ajouts des propriétés non statiques
         for(name in me.definition.objectEnv) {
            Core.declare ( me.definition.objectEnv[name] // descriptor
                         , name                          // name
                         , me.thisEnv                    // thisEnv
                         , listEnv                       // listEnv
                         , false);                       // isStatic
         }

         me.thisEnv.$      = { Class          : me.Class
                             , contextClass   : parentMe.Class
                             , isOpen         : function () { return false; } //TODO : optimiser
                             , initialization : fct.getInitialization(me)
                             , parent         : classMe.privateParent
                             , Public         : parentMe.publicEnv
                             , Self           : me.selfEnv
                             , Super          : me.superMe !== undefined ? me.superMe.protectedEnv : undefined
                             , this           : true
                             , type           : me.type};

         me.selfEnv.$      = { Class          : me.Class
                             , contextClass   : parentMe.Class
                             , initialization : me.thisEnv.$.initialization
                             , parent         : classMe.privateParent
                             , Public         : parentMe.publicEnv
                             , Self           : me.selfEnv
                             , Super          : me.thisEnv.$.Super
                             , type           : me.type
                             };

         me.protectedEnv.$ = { Class          : me.Class
                             , contextClass   : me.Class
                             , initialization : me.thisEnv.$.initialization
                             , parent         : classMe.publicParent
                             , Public         : parentMe.publicEnv
                             , Super          : me.thisEnv.$.Super
                             , type           : me.type };

         // Dans les étapes suviantes, les attributs publiques et protégés devront être surchargés
         thisEnv.addPrivate   = false;
         thisEnv.include      = true;
         selfEnv.include      = false;
         protectedEnv.include = false;

         return me;

      };

      /**
      @namespace fct
      @memberof JsPackage.Class
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
         |   Crée une fonction retournant la liste des ancêtres de la classe.
         |
         |-----------------------------------------------------------------------------------------
         | Paramètre :
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
         |   Crée une fonction "getNewObject". Cette fonction permet de créer une nouvelle instance
         | de la classe.
         |
         |-----------------------------------------------------------------------------------------
         | Paramètre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var getNewObject              = function (me) {
            var init;
            if (me.initialization !== undefined) {
               init = me.initialization.getValue();
               return function () {
                  // Cette fonction doit être appelée en utilisant l'opérateur "new" (on impose la
                  // syntaxe). Si ce n'est pas le cas, alors on retourne undefined.
                  // On détecte l'appel via "new" parce que dans le cas contraire, "this" === undefined.
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
         |   Crée une nouvelle fonction "isAbstract" pour chaque classes. Cette fonction permet de
         | déterminer si la classe est une classe abstraite ou non.
         |
         |-----------------------------------------------------------------------------------------
         | Paramètre :
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
         |   Crée une nouvelle fonction "isFinal" pour chaque classes. Cette fonction permet de
         | déterminer si la classe est une classe finale ou non.
         |
         |-----------------------------------------------------------------------------------------
         | Paramètre :
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
         |   Crée une nouvelle fonction "_ProtectedReturn" pour chaque classes. Elle a rôle de
         |   retourner une l'objet "Me" si elle reçoit Core.beacon en paramètre.
         |
         |-----------------------------------------------------------------------------------------
         | Paramètre :
         |   me : Objet "Me" de la classe
         |
         |---------------------------------------------------------------------------------------*/
         var _ProtectedReturn          = function (me) {
            return function (b) {
               // Si on reçoit autre chose que Core.beacon, on retourne undefined
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

         // Valeurs par défaut
         definition = { $ : { toSeal : true
                              , parent : undefined
                            , name   : undefined }};

         definition = Core.merge(arguments, definition);

         definition = Definition.new(definition, {$:{sealed:false}}).$._open(Core.beacon);

         // On vérifie que la définition est valide pour une classe.
         validateDefinition(definition);

         // On scelle la définition
         definition.publicEnv.$.seal();

         return createClass(definition);
      };
      /*-------------------------------------------------------------------------------------------
      |                          Definition Private validateDefinition
      |--------------------------------------------------------------------------------------------
      |
      | Description :
      |   Valide la définition pour la création de classe.
      |   Cette fonction est appelée par la fonction Definition.validateDefinition
      |
      |--------------------------------------------------------------------------------------------
      | Paramètres :
      |   . definition : définition, ouverte, à valider.
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
    * @memberof JsPackage
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
      * @memberof JsPackage.Core
      * @param {Descriptor} descriptor Descriptor of the member
      * @param {string} name Name of the member
      * @param {ClassThisEnv|InstanceThisEnv|PackageThisEnv} thisEnv Private environment of the object
      * @param {JsPackage.DeclarationProperty} listEnv Environment inwich the member will be added
      * @param {boolean} isStatic Determin weither (true) or not (false) the member is a static member
      */
      var declare                 = function (descriptor, name, thisEnv, listEnv, isStatic) {
         var add, allowed, alreadyDefined, desc, env, i, property;

         if (isStatic && (descriptor.property !== undefined)) {
            /* Les membres statiques sont crées par la classe et leur propriétées sont conservées
                dans le descripteur. De fait, on a pas à calculer leur propriétés, juste les
               rechercher*/
            property    = descriptor.property;
         }
         else {
            if (descriptor.isMethod)
               property = declareMethod(thisEnv, name, descriptor);
            else
               property = declareAttribute(thisEnv, name, descriptor);

            if (isStatic)
               // Si la propriété est statique, on la conserve
               descriptor.property = property;
         }

         // Ajout de la propriété dans tout les environnements
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
      | Vérifie si l'objet "object" à défini la propriété "property". Cela ne vérifie pas si la
      | propriété à une valeur.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . object   : Objet à annalyser
      |   . property : Nom de la propriété à tester
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  true  : la propriété est définie
      |  false : la propriété n'est pas définie
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
      | Cette fonction est appelée par les fonctions "newObject" (ex: newClass, newDefinition,
      | ...).
      | Elle reçoit en paramètre la liste des arguments passé en paramètre de ces fonctions.
      | Elle va ensuite vérifier qu'il s'agit d'objets utilisables comme définition, ou des
      | définitions, et ensuite merger l'ensemble de ces objets dans une nouvelle définition
      | via la fonction Core.merge. Seront mergé aussi les éléments de '$'.
      | Notes :
      |   . Si un des paramètres est undefined, alors on considère que c'est une définition
      |     vide ({}).
      |   . Si un des paramètres n'est pas compatible avec une définition (cad non un objet
      |     ou une fonction), alors l'erreur Errors.InvalidDefinition est levée.
      | Note : l'objet retournée n'est PAS une instance de Definition. Il s'agit juste d'une
      | objet classique.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . definitionList : Liste des objets définitions
      |
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  L'objet nouvellement crée
      |
      |-----------------------------------------------------------------------------------------
      | Exception:
      |  InvalidDefinition : au moins un élément de definitionList n'est pas utilisable comme
      |     définition.
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
      |   Crée une nouvelle fonction "this" pour chaque class, package.
      |
      |--------------------------------------------------------------------------------------------
      | Paramètre :
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
      | Vérifie que la proprieté "property" de l'objet "object" n'est pas une proprieté
      | dynamique.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . object   : Objet à annalyser
      |   . property : Nom de la propriété à tester
      |-----------------------------------------------------------------------------------------
      | Retour:
      |  true  : la propriété est dynamique
      |  false : la propriété n'est pas dynamique
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
                                   , Constants         : Constants.publicEnv
                                   , Errors            : Namespace.new(Errors)
                                   , Object            : jsObject
                                   , GlobalContext     : globalThis
                                     // Méthodes
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

         Class      .namespace.Core = publicEnv;
         Definition .namespace.Core = publicEnv;
         Descriptor .namespace.Core = publicEnv;
         Interface  .namespace.Core = publicEnv;
         Namespace  .namespace.Core = publicEnv;
         Package    .namespace.Core = publicEnv;

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
      | Merge les propriétés de plusieurs objets. Si "intoTheFirst" égale true alors l'ensemble
      | sera mergé dans le premier élément. Sinon, dans un  nouvel élément.
      | Le merge se fait du premier élément de la liste (index 0) au dernier élément.
      | L'élément le plus à droite (cad qui a le plus grand indice dans le tableau) écrasera
      | les propriétés des autres s'il les définie.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments:
      |   . args         : Liste des objets à merger
      |   . intoTheFirst : Décide si oui (true) ou non (false) les éléments doivent être insérés
      |     dans le premier élément ou non.
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
      | Ouvre un objet. Cette fonction est appelée par les méthodes des packages et les classes
      | qui souhaitent acceder aux éléments privés et protégés des objets.
      | Cette fonction repose sur la variable "authorizationList" des classes et des packages.
      | Il s'agit d'un objet contenant les autorisations d'accès aux environements privés et
      | protégés des classes et des packages. Chaque clé de l'objet correspond à des
      | classes et des packages dont ont à l'accès aux environnements privés ou protégés
      | Chaque valeur correspond à l'autorisation en question : 'protégé' ou 'privé'.
      | Lorsque openObject reçoit un objet à ouvrir, il va vérifier si le rootId de cet objet est
      | dans cette liste. Si c'est n'est pas le cas, c'est que l'on a aucun accès particulier avec
      | l'objet : on le rend tel-quel alors.
      | Si c'est le cas, dans le cas d'un package, on retournera directement l'environnement
      | privé : les packages aux accès aux environnements privés de ces pères et fils.
      | Si c'est une classe, alors on recherche son ID dans la liste des autorisation. S'il n'est
      | pas présent, alors on s'interessera à son père de la même manière.
      | Une fois que l'on a trouvé, on regarde l'autorisation (valeur).
      | On retourne alors l'environnement privé ou protégé du niveau trouvé.
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
      | Scèle un environnement et l'objet "$".
      |
      | Si toSeal est false, alors seul "$" sera scellé.
      |
      | Si seal$ est false, alors on ne cherche pas à sceller les différents éléments de "$" car
      | ils auront déjà été scellé (sur Safari, le mode strict interdit de modifier un élément déjà
      | scellé).
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
      | L'objet standard "Object" peut-être écrasé via une simple commande (ex : Object=1). De
      | fait, il faut "sécuriser" les fonctions de "Object". Un écrasement empêcherait, dans le
      | meilleur des cas, le fonctionnement correct de Class-Object, mais dans le pire des cas,
      | on peut imaginer que Object à été remplacé par un faux, avec des fonctions qui simule
      | celle de Object. Dit autrement, le fait que "Object" soit écrasable est un trou de
      | sécurité. La "parade" est donc de copier toute ces fonctions dans un objet interne à
      | ClassObject : jsObject. Ainsi, au lieu d'appeler "Object", on appelera "jsObject".
      | Note : on aurait pu se contenter de "fixer" Object via la fonction "seal". Mais, cela
      | reviendrait à modifier le un comportement standard, ce qui n'est pas acceptable.
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
   |    Ce package permet la création de Definition.
   |
   |-----------------------------------------------------------------------------------------------
   | Éléments privés du package :
   |
   |    +--------------------+---------------+--------------------------------------------------+
   |    |        Nom         |     Type      |                  Description                     |
   |    +--------------------+---------------+--------------------------------------------------+
   |    | cloneDefinition    | fonction      | Clone une définition                             |
   |    +--------------------+---------------+--------------------------------------------------+
   |    | createDefinition   | fonction      | Créer une définition                             |
   |    +--------------------+---------------+--------------------------------------------------+
   |    | convertDefinition  | fonction      | Créer une instance d'une classe                  |
   |    +--------------------+---------------+--------------------------------------------------+
   |
   |-----------------------------------------------------------------------------------------------
   | Création d'une définition
   |
   |    La création d'une définition est faite à partir de la fonction newDefinition.
   |    Cette fonction reçoit en paramètre :
   |      . Soit un objet, qui est converti en définition par createDefinition
   |      . Soit une autre définition, dont on retournera alors le clone, non scellé
   |
   |-----------------------------------------------------------------------------------------------
   | Structure d'une définition
   | Une définition est composé d'un objet "me". La partie publique de la définition correspond à
   | l'objet me.publicEnv.
   | Voici la structure d'une définition :
   |
   |   |-me
   |   |   |-number id                       : ID de la définition.
   |   |   |-Class/Interface extends         : Classe ou interface étendue par la définition.
   |   |   |-function initialization         : Fonction d'initialization de la classe.
   |   |   |-[Interface] interfaces          : Liste des interfaces implémentées.
   |   |   |-boolean isAbstract              : défini si oui (true) ou non (false), la définition
   |   |   |                                   correspond à un objet abstrait (classe ou interface).
   |   |   |-boolean isAbstract              : défini si oui (true) ou non (false), la définition
   |   |   |                                   correspond à un objet final.
   |   |   |-boolean isSealed                : défini si oui (true) ou non (false) la définition est
   |   |   |                                   scellée.
   |   |   |-Descriptor restrict             : Descripteur restreignant l'exécution de la classe.
   |   |   |-Object objectEnv                : Liste de tout les attributs et méthodes objet
   |   |   |-Object publicEnv                : Liste de toute les propriétés de la définition.
   |   |   |-Descriptor restrict             : Restreint la création d'instance de classe.
   |   |   |-Object staticEnv                : Liste de tout les attributs et méthodes statiques
   |   |   |-setParam                        : Défini un paramètre de la définition. Cette fonction
   |   |   |                                   lève une exception si elle est appelée alors que la
   |   |   |                                   définition est scellée.
   |   |   |-string type                     : Type d'objet. Ici : Constant.DEFINITION.
   |
   | Format de me.publiEnv.$ :
   |
   | me.publicEnv.$
   |   |- boolean abstract                   : retourne me.isAbstract. Lève une exception si mit à
   |   |                                       jour alors que la définition est scellée.
   |   |                                       jour alors que la définition est scellée.
   |   |- Class/Interface extends            : retourne me.extends. Lève une exception si mit à
   |   |                                       jour alors que la définition est scellée.
   |   |- boolean final                      : retourne me.isFinal. Lève une exception si mit à
   |   |                                       jour alors que la définition est scellée.
   |   |- number id                          : retourne me.id. Lecture-seule.
   |   |- [Interface] implements             : retourne me.interfaces. Lève une exception si mit à
   |   |                                       jour alors que la définition est scellée.
   |   |- boolean isSealed ()                : retourne true si la définition est scellée, false
   |   |                                       sinon.
   |   |- seal()                             : scelle la définition.
   |   |- validate([string whatFor])         : valide la définition.
   |   |- string type                        : retourne me.type.
   |
   |---------------------------------------------------------------------------------------------*/
   /**
    * @namespace Definition
    * @memberof JsPackage
    */
   var Definition            = (function () {

      /*-------------------------------------------------------------------------------------------
      |                          Definition Private cloneDefinition
      |--------------------------------------------------------------------------------------------
      |
      | Description :
      |   Clone la définition reçue en paramètre.
      |   La définition retournée n'est pas scellée.
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
      |   Crée une définition à partir d'un objet Definition reçu en paramètre.
      |
      |------------------------------------------------------------------------------------------*/
      var createDefinition        = function (objectDefinition) {

         var desc, i, name, newDef, me, obj, parent, parameters, visibility;

         // Si objectDefinition est déjà une définition, alors on retourne un clone.
         if (isDefinition(objectDefinition))
            return objectDefinition.$.clone();

         // Création de l'objet me
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

         // Ajouts des propriétés
         for(name in objectDefinition) {
            if (name !== '$')
               me.publicEnv[name] = objectDefinition[name];
         }

         // Ajout des paramètres de création.
         // On ne fait que les copier
         // les paramètres seront "normalisés" par la fonction "seal".
         // Les paramètres sont :
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

         // TODO : vérification faites au mauvais endroit : on doit vérifier lorsque l'on scèlle la définition

         // Vérification des paramètres
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

         // Vérification du paramètre : implements
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
      |   Contrôle et vérifie la définition de classe passée en paramètre.
      |
      |   Format de la définition de classe :
      |     . La définition de classe est un dictionnaire.
      |     . Chaque entrée du dictionnaire correspond à la définition d'un attribut ou d'une
      |       méthode de la classe.
      |        . La clé correspond au nom de l'attribut/méthode
      |           . Le premier carractère doit être une lettre
      |           . Elle doit être composé que de carractères alphanumériques et du
      |             carractère underscore "_".
      |           . Le nom respect d'une de ces conditions entrainera une exception :
      |             Exception : nonValidName
      |        . La valeur correspond à la définition
      |     . Il y a trois format de définitions d'attributs/méthodes reconnus:
      |       . La valeur est le résultat des fonctions fournissant les propriétés de l'attribut/
      |         méthode (private, public, ...). Il s'agit là de condition idéales : l'objectif
      |         de "convertDefinition" sera de convertir les deux autres formats en celui-ci.
      |       . La valeur est un dictionnaire composé de deux éléments :
      |         . Un élément dont la clé est "define": La valeur est le résultat des fonctions
      |           fournissant les propriétés de l'attribut/méthode (private/public). Si cet
      |           cet élément est obligatoire.
      |         . Au choix :
      |            . Un élément dont la clé est "Method": La valeur est la fonction servant de
      |              méthode. Cela déterminera alors une méthode. Si les propriétés définies
      |              dans "define" déclare un attribut, alors l'exception suivante sera levée:
      |              Exception : uncoherentProperties
      |            . Un élément dont la clé est "value": Cet élément détermine un attribut. Si
      |              les propriétés définies dans "define" déclare une méthode, l'exception
      |              "uncoherentProperties" sera levée.
      |       . Dans tout les autres cas, la valeur déterminera si on à affaire à un attribut
      |         ou une méthode. Si l'objet est une fonction, alors on considéreras que cette
      |         propriété de la classe est une méthode publique non-statique. La fonction
      |         passée en paramètre constituera la méthode.
      |         Sinon, on considéreras la propriéé comme un attribut publique non-statique.
      |         Dans le cas où on à affaire à un dictionnaire, c'est la clé "define" et son
      |         contenu qui permettra de faire la différence entre un dictionnaire "classique"
      |         et une déclaration.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . oldDef : définition à convertir. La définition ne sera pas modifiée, y comprit
      |      si le format est incorrect.
      |
      |----------------------------------------------------------------------------------------
      | Retour :
      |   Nouvelle définition, correspondant à la définition passée en paramètre convertie.
      |
      |-----------------------------------------------------------------------------------------
      | Exceptions :
      |
      |-----------------------------------------------------------------------------------------
      | TODO :
      |   Vérifier que les méthodes/attributs respects l'héritage : si le père défini une méthode,
      |  et que le fils veut l'écraser, il doit l'écraser avec une méthode aussi. Idem pour les
      |  attributs, pour les constantes, la visibilité.
      |   Vérifier que les méthodes/attributs écraser ne sont pas écrit comme "Final" par le père
      |   ou un ancêtre.
      |
      |---------------------------------------------------------------------------------------*/
      var convertDefinition       = function (oldDef) {
         var descriptor,def,extend,extendDefinition,extendedProperty,invalid,name,newDef,object;

         // TODO : vérifier que "init" est une fonction statique
         // TODO : "prototype", "length", "name", "arguments" et "caller" ne sont pas utilisables comme propriétés statiques
         // TODO : vérifier que les propriétés soit cohérente avec le type de l'objet

         newDef = getNew$(oldDef);

         // Vérifications dans le cas où on la classe hérite d'une autre classe
         if (newDef.extends !== undefined) {
            newDef.Public.$.extends = newDef.extends;
            newDef.extends          = Core.getObject(newDef.extends.$.id);
            extendDefinition        = newDef.extends.definition;
         }

         extend = newDef.extends !== undefined;

         for(name in oldDef) {

            if (name != Constants.$ ) {

               descriptor = Descriptor.convertDescriptor(name, oldDef); // Note : si le descripteur est déjà standard, il sera cloné
               // A cette étape, descriptor est déjà scellé

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
               // l'environnement privé de la définition.
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
         | Ajoute un paramètre à l'objet me de la définition.
         |
         |-----------------------------------------------------------------------------------------
         | Arguments :
         |   . object : l'objet à tester
         |
         |-----------------------------------------------------------------------------------------
         | Retour
         |   (aucun)
         |
         |-----------------------------------------------------------------------------------------
         | Exceptions :
         |   . Errors.SealedObject : impossible de modifier un paramètre car la définition est
         |     scellée.
         |
         |-----------------------------------------------------------------------------------------
         | Visibilité :
         |   . Privée
         | Cette fonction n'est utilisé que par les fonctions "set_*" des définitions.
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
      | Valide l'attribut "define" de l'objet reçu en paramètre. Cette fonction est créée
      | uniquement pour mieux découper la fonction convertDefinition.
      |
      |-----------------------------------------------------------------------------------------
      | Arguments :
      |   . object : l'objet à tester
      |
      |-----------------------------------------------------------------------------------------
      | Retour
      |   . true  : l'objet a une propriété 'define' valide
      |   . false : l'objet n'a pas une propriété 'define' valide
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
      |   Scèlle la définition reçue en paramètre.
      |   Fonction à utiliser en interne uniquement. Aucun contrôle n'est fait sur les paramètres
      | d'entrées uniquement.
      |--------------------------------------------------------------------------------------------
      | Parmaètres
      |   . definition : Définition à valider. La définition doit être ouverte
      |   . whatFor    : Pour quel type d'usage on doit valider la définition. Valeurs acceptées :
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
               definition.initialization = Public.Static.Method(definition.initialization);
         }

         // On vérifie ici que la définition public est modifiable
         for(property in definition.publicEnv) {

            p = jsObject.getOwnPropertyDescriptor(definition.publicEnv, property);

            if (!p.configurable || !p.writable) {
               onerror(new Errors.InvalidDefinition());
            }
         }

         /* Les derniers contrôles ont été effectués : maintenant
          on scelle la définition. */
         definition.isSealed = true;

         // On ajoute les nouvelles description.
         // Si la description existaient déjà, on vérifie qu'elle est compatible
         // Note : bcn est valorisé uniquement lorsque l'on crée un clone pour étendre une définition.
         // Dans ce cas, privateEnv, protectedEnv et publicEnv ne doivent pas contenir les définitions.
         // Seul les environnements compilés doivent les contenir.
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
      |   Valide la définition reçue en paramètre.
      |   La fonction ne modifie pas la définition. Elle retourne une liste d'erreur, ou undefined
      |   si aucune erreur n'a été trouvée.
      |--------------------------------------------------------------------------------------------
      | Parmaètres
      |   . definition : Définition à valider. La définition doit être ouverte
      |   . whatFor    : Pour quel type d'usage on doit valider la définition. Valeurs acceptées :
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

         // Vérification de l'objet étendu
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
   |    Ce package permet la création de descripteurs
   |
   |-----------------------------------------------------------------------------------------------
   | Création d'un descripteur
   |
   |    La création d'une définition est faite à partir de la fonction newDescriptor.
   |    Cette fonction reçoit en paramètre :
   |      . Soit un objet, qui correspond à la valeur du descripteur
   |      . Soit un lien
   |
   |-----------------------------------------------------------------------------------------------
   | Correspondance
   |
   |  type :
   |     . 1 : attribut
   |     . 2 : variable
   |     . 3 : méthode
   |     . 4 : fonction
   |     . 6 : classe
   |
   |---------------------------------------------------------------------------------------------*/
   var Descriptor            = (function () {

      var maxID                   = 0;

      /*----------------------------------------------------------------------------------------
      |                                   isDescriptor
      |-----------------------------------------------------------------------------------------
      | Description :
      |   Vérifie si la propriété passée en paramètre est standard ou non.
      |   Seule une propriété standard à accès à la variable interne Core.beacon.
      |   On appel la fonction "checkStandard" de la propriété. Cette fonction retourne un id.
      |   "checkStandard" à enregistré dans Core.beacon une référence d'elle même. Donc, il
      |   ne reste plus qu'à comparer cette référence avec l'objet passé en paramètre de
      |   isDescriptor. Normalement, ils sont les mêmes. Sinon, c'est que la propriété
      |   n'est pas standard.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . name       : Nom de l'attribut/méthode
      |    . definition : Définition de l'attribut/méthode
      |
      |-----------------------------------------------------------------------------------------
      | Retour :
      |   Nouvelle définition, correspondant à la définition passée en paramètre convertie.
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
      var fct_Class               = function ()    { this.setParam('Type'      ,    6); return this.Public;};

      var fct_isAttribute         = function ()    { return this.Type===1||this.Type===2; };
      var fct_isMethod            = function ()    { return this.Type===3||this.Type===4; };
      var fct_isClass             = function ()    { return this.Type===6;                };

      // Visibilité
      var fct_Public              = function ()    { this.setParam('visibility',    1); return this.Public;};
      var fct_Protected           = function ()    { this.setParam('visibility',    2); return this.Public;};
      var fct_Private             = function ()    { this.setParam('visibility',    3); return this.Public;};

      var fct_isPublic            = function ()    { return this.visibility === 1;        };
      var fct_isProtected         = function ()    { return this.visibility === 2;        };
      var fct_isPrivate           = function ()    { return this.visibility === 3;        };

      // Propriétés
      var fct_Abstract            = function ()    { this.setParam('isAbstract', true); return this.Public;};
      var fct_Constant            = function ()    { this.setParam('isConstant', true); return this.Public;};
      var fct_Final               = function ()    { this.setParam('isFinal'   , true); return this.Public;};
      var fct_Static              = function ()    { this.setParam('isStatic'  , true); return this.Public;};

      var fct_isAbstract          = function (val) { if (arguments.length > 0) { this.setParam('isAbstract', val)   ; return this.Public;} return this.isAbstract; };
      var fct_isFinal             = function (val) { if (arguments.length > 0) { this.setParam('isFinal', val)      ; return this.Public;} return this.isFinal;    };
      var fct_isConstant          = function (val) { if (arguments.length > 0) { this.setParam('isConstant', !!val) ; return this.Public;} return this.isConstant; };
      var fct_isStatic            = function (val) { if (arguments.length > 0) { this.setParam('isStatic', val)     ; return this.Public;} return this.isStatic;   };

      // Autres propriétés et fonctions
      var fct_isSealed            = function ()    { return this.isSealed;                };
      var fct_set                 = function (val) { this.setParam('value'     ,  val); this.setParam('isValueSetted', true); return this.Public; };
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
      |   Tout les aspects sont testés.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . Descriptor obj     : Descripteur à tester.
      |    . boolean testValue  : Indique si oui (true) ou non (false) on doit aussi tester les
      |                           valeurs. Défaut : true.
      |
      |-----------------------------------------------------------------------------------------
      | Retour :
      |   Nouvelle définition, correspondant à la définition passée en paramètre convertie.
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
         desc.Class         = this.Class;
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
      |   Converti la définition d'un attribut ou d'une méthode au format standard.
      |   Aucun contrôle n'est fait sur les valeurs.
      |
      |-----------------------------------------------------------------------------------------
      | Parametres :
      |    . oldDesc : Description à convertir
      |
      |-----------------------------------------------------------------------------------------
      | Retour :
      |    . Si oldDesc est un descripteur, alors on va retourner son clone.
      |    . Sinon, on retourne un paramètre publique, non statique, dont le type dépend du type
      |      de oldDesc :
      |      . Si oldDesc est une classe, alors on déclarera une classe
      |      . si oldDesc est une fonction, alors on déclarera une méthode
      |      . sinon, on déclare un attribut.
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
                    , Type         : 1          // 1: Attribute, 2: Variable, 3:Method, 4:Function
                    , value        : undefined
                    , visibility   : 1
                    , id           : maxID++};        // 1: public, 2:protected, 3:private

         set_bind = fct_set.bind(me);

         me.Public = set_bind;

         dp(me.Public, 'Abstract'          , {get:fct_Abstract           .bind(me), set:function(val) {this.Abstract     ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Attribute'         , {get:fct_Attribute          .bind(me), set:function(val) {this.Attribute    ; set_bind(val);}, enumerable:true, configurable:false});
         dp(me.Public, 'Class'             , {get:fct_Class              .bind(me), set:function(val) {this.Class        ; set_bind(val);}, enumerable:true, configurable:false});
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
         dp(me.Public, 'isClass'           , {value:fct_isClass          .bind(me), writable:false, enumerable:true});
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

   var Errors                = {
        AccessViolation        : function(name)    { this.name=globalName+'.AccessViolation'       ; this.message='Try to access to a reserved function';                                  }
      , InvalidDefinition      : function(message) { this.name=globalName+'.InvalidDefinition'     ; this.message = message;                                                              }
      , InvalidContext         : function(message) { this.name=globalName+'.InvalidContext'        ; this.message = message;                                                              }
      , DescriptorSealed       : function()        { this.name=globalName+'.DescriptorSealed'      ; this.message='Try to modify a sealed descriptor';                                     }
      , ObjectIsNotExtendable  : function()        { this.name=globalName+'.ObjectIsNotExtendable' ; this.message='Object is not extandable (use Definition, Class, Interface or Package)';}
      , ExtendAnFinalClass     : function()        { this.name=globalName+'.ExtendAnFinalClass'    ; this.message='Try to extend an finaled class';                                        }
      , ExtendedProprertyError : function()        { this.name=globalName+'.ExtendedProprertyError';                                                                                      }
      , OnParameterOnly        : function()        { this.name=globalName+'.OnParameterOnly'       ; this.message='Only one parameter accepted';                                          }
      , ObjectIsNotAClass      : function()        { this.name=globalName+'.ObjectIsNotAClass'     ; this.message='Expected a class';                                                     }
      , InvalidName            : function(n)       { this.name=globalName+'.InvalidName'           ; this.message='Not a valid name : '+n;                                             }
      , InvalidType            : function(o)       { this.name=globalName+'.InvalidName'           ; this.message='Not a valid type'; this.object = o;                                    }
      , NotInstanciableClass   : function(cl)      { this.name=globalName+'.NotInstanciableClass'  ; this.message='The class is not instanciable';                                        }
      , NotAUniqueName         : function(n)       { this.name=globalName+'.NotAUniqueName'        ; this.message='The name is not unique : "'+n+'"';                                     }
      , SealedObject           : function(object)  { this.name=globalName+'.SealedObject'          ; this.message='The object is sealed : it cannot be extended';                         }
      , IncompatibleExtension  : function(name, desc1, desc2) {
         this.name='IncompatibleExtension' ;
         this.message='"'+name+'" property ('+desc1.toString(true)+') cant\'t be extend by a '+desc1.toString(true)+' property';
         console.log(this.message);
         }
      , $                      : {seal : true}
   };

   var Interface             = (function() {

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
                          , Public        : me.Public
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
      |    Vérifie que la classe fournie en paramètre implémente l'interface.
      |
      |--------------------------------------------------------------------------------------------
      | Paramètres
      |
      |   . obj : publicEnv de la classe dont on souhaite vérifier les implémenetations
      |   . me  : Me de l'interface
      |
      |------------------------------------------------------------------------------------------*/
      var checkImplementation     = function(obj, me) {

         var i, interfaces;

         // On récupère la liste des interfaces
         interfaces = obj.$.implements;

         // Si aucune interfaces n'est implémentées, alors on retourne false
         if (interfaces === undefined)
            return false;

         // On recherche notre interface parmis la liste des interfaces implémentées
         for(i in interfaces) {
            if (interfaces[i] == me.publicEnv)
               return true;
         }

         // Si on a rien trouvé, alors c'est que notre interface n'est pas implémentées
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

               // Vérification sur la visibilité
               // L'attribut ne peut-être privé
               if (descOBJ.isPrivate())
                  return false;

               // Les propriétés ITF protégés peuvent être implémenté par des propriétés publiques.*
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

         // Valeurs par défaut
         definition = { $ : { parent : undefined
                            , name   : undefined }};

         definition = Core.merge(arguments, definition);

         openDefinition = Definition.new(definition, {$:{sealed:false}}).$._open(Core.beacon);

         // On vérifie que la définition est valide pour une classe.
         validateDefinition(openDefinition);

         // On scelle la définition
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

   var Namespace             = (function() {

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


         // Ajout les membres de la définition au namespace
         for(name in definition) {
            if (name === '$') continue;
            addValue = false;

            // Les descripteurs sont définis différement
            if (Descriptor.isDescriptor(definition[name])) {
               //on ajoute simplement la valeur définie par le descripteur.
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
      | Valide la définition reçue en paramètre lors de la création du namespace.
      |
      |--------------------------------------------------------------------------------------------
      | Critères de validité
      |
      |   . La définition doit être un objet ou une fonction
      |   . Aucun élément "toString" ne doit être défini
      |   . Aucun élément "$" ne doit être défini, ou doit être un objet.
      |   . Si $ est défini :
      |      . Si $.object est défini, alors ce doit être un objet ou une fonction.
      |      . si $.global est défini, il faut que $.name le soit aussi.
      |      . si $.global et $.name sont définis, il faut que globalThis[name] ne soit pas
      |        définis, ou alors qu'il soit configurable et writable.
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
               // $.object doit être un objet ou une fonction
               if (typeof(definition.$.object) !== 'object' && typeof(definition.$.object) !== 'function')
                  onerror(new Errors.InvalidDefinition('$.object must be an object or a function'));

               for(name in definition) {

                  property = jsObject.getOwnPropertyDescriptor(definition.$.object, name);

                  /* Si dans $.object il exite déjà un membre avec le même nom,
                  on ne lèvera une exception que si ca valeur est différente de celle
                  de la définition. Dans le cas d'un lien, alors on devra vérifier que
                  les liens sont égaux */
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
      | Critères de validité
      |
      |   . La définition doit être un objet ou une fonction
      |   . Aucun élément "toString" ne doit être défini
      |   . Aucun élément "$" ne doit être défini, ou doit être un objet.
      |   . Si $ est défini :
      |      . Si $.object est défini, alors ce doit être un objet ou une fonction.
      |      . si $.global est défini, il faut que $.name le soit aussi.
      |      . si $.global et $.name sont définis, il faut que globalThis[name] ne soit pas
      |        définis, ou alors qu'il soit configurable et writable.
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

         // Valeurs par défaut
         definition = { $ : { object : {}
                            , parent : globalThis
                            , name   : undefined
                            , seal   : true     }};

         definition = Core.merge(arguments, definition);

         // Les descripteurs sont clonés pour ne pas les modifier directement.
         for(name in definition) {
            if (Descriptor.isDescriptor(definition[name]))
               definition[name] = definition[name].clone().seal();
         }

         // On vérifie que la définition est valide pour un namespace.
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

   var Package               = (function() {

      var createPackage           = function(me) {
         var env, id, listEnv, listAncestry, name, newFct, publicEnv, selfEnv, superEnv, thisEnv;
         var parent;

         me.isSealed         = true;
         me.thisEnv          = Core.getThisEnv(me);
         me._ProtectedReturn = fct._ProtectedReturn(me);

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

         me.authorizationList = {};

         me.authorizationList[me.id] = 'private';

         if (me.parent !== undefined) {
            parent = me.parent.getValue();
            if (Package.isPackage(parent)) {
               if (parent.$.isSealed())
                  me.authorizationList = parent.$._open(Core.beacon).authorizationList;
            }
         }

         for(name in me.definition.objectEnv) {

            if (!me.definition.objectEnv[name].isPublic)
               delete(me.publicEnv[name]);

            if (Class.isClass(me.definition.objectEnv[name].value)) {
               // Le parent déclaré de la classe doit être le package lui même
               // sinon, on considère la classe comme indépendante
               if (me.definition.objectEnv[name].value.$._open(Core.beacon).parent.getValue() === me.publicEnv) {
                  declareClass(me, name);
                  continue;
               }
            }
            else if (isPackage(me.definition.objectEnv[name].value)) {
               if (me.definition.objectEnv[name].value.$._open(Core.beacon).parent.getValue() === me.publicEnv) {
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

         // On scèlle l'ensemble des environnements
         Core.sealEnv(me.thisEnv  , true, true);
         Core.sealEnv(me.publicEnv, true, false); // "me.publicEnv.$" est déjà scellé

         return me.publicEnv;

      };

      var declareClass            = function(me, name) {

         var classMe, desc;

         desc                  = me.definition.objectEnv[name];
         classMe               = desc.value.$._open(Core.beacon);
         classMe.privateParent = me.thisEnv;
         classMe.privateName   = name;

         if (classMe.parent.isPublic()) {
            classMe.publicParent  = me.publicEnv;
            classMe.publicName    = name;
         }

         Core.mergeAuthorization(me.authorizationList, classMe.authorizationList);
         classMe.authorizationList = me.authorizationList;

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

         if (packageMe.parent.isPublic()) {
            packageMe.publicParent  = me.publicEnv;
            packageMe.publicName    = name;
         }

         Core.mergeAuthorization(me.authorizationList, packageMe.authorizationList);
         packageMe.authorizationList = me.authorizationList;

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

      };

      var fct                     = (function () {

         var add                       = function(me) {

            return function(name, obj, p_enumerable, p_fixed) {

               var prop_public, prop_this;

               if (me.isSealed)
                  return undefined;

               // On vérifie qu'une propriété de même nom n'est pas fixée dans l'environnement publique
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

         var isSealed                  = function(me) {
            return function() {
               return me.isSealed;
            };
         };

         var seal                      = function(me, definition) {
            return function() {
               var name, properties;

               if (jsObject.isSealed(me.publicEnv) || jsObject.isFrozen(me.publicEnv))
                  onerror(new Errors.InvalidDefinition());

               me.definition = { $ : definition.$ };

               for(name in me.publicEnv) {

                  if (name === '$') continue;

                  properties = jsObject.getOwnPropertyDescriptor(me.publicEnv, name);

                  if ((!properties.writable || !properties.configurable) && !Class.isClass(me.publicEnv[name]))
                     onerror(new Errors.InvalidDefinition());

                  me.definition[name] = me.publicEnv[name];
               }

               me.definition.$.seal = true;
               me.definition = Definition.new(me.definition).$._open(Core.beacon);
               // On scelle la définition
               me.definition.publicEnv.$.seal();

               return createPackage(me);
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

         // Valeurs par défaut
         definition = { $ : { seal   : true
                            , parent : undefined
                            , name   : undefined }};

         definition = Core.merge(arguments, definition);

         // $.seal est n'est pas un attribut des définitions.
         // Comme on crée un package, $.seal s'adresse donc au package.
         seal = definition.$.seal === undefined ? true : !!definition.$.seal;

         me                  = { definition    : undefined
                               , privateParent : undefined
                               , publicParent  : undefined
                               , privateName   : undefined
                               , publicName    : undefined
                               , publicEnv     : {}
                               , isSealed      : false
                               , type          : Constants.PACKAGE};

         me._patteBlanche    = Core.fct._patteBlanche(me);

         me.id               = Core.getNewId(me);

         me.seal             = fct.seal(me, definition);

         me.publicEnv.$      = { _open         : fct._ProtectedReturn(me)
                               , _patteBlanche : me._patteBlanche
                               , definition    : undefined
                               , id            : me.id
                               , isSealed      : fct.isSealed(me)
                               , name          : undefined
                               , Public        : true
                               , seal          : me.seal
                               , toString      : fct.toString(me.publicEnv, 'public')
                               , type          : me.type };

         me.publicEnv.$._patteBlanche = me._patteBlanche;

         me.name             = definition.$.name;
         if (definition.$.parent === undefined)
            me.parent           = Descriptor.new()(globalThis);
         else
            me.parent           = Descriptor.isDescriptor(definition.$.parent) ? definition.$.parent : Descriptor.new()(definition.$.parent);

         me.getPrivateParent = Core.fct.getValue(me, 'privateParent');
         me.getPublicParent  = Core.fct.getValue(me, 'publicParent');

         me.getPrivateName   = Core.fct.getValue(me, 'privateName');
         me.getPublicName    = Core.fct.getValue(me, 'publicName');

         jsObject.defineProperty(me.publicEnv.$   , 'parent', { get : me.getPublicParent  });
         jsObject.defineProperty(me.publicEnv.$   , 'name'  , { get : me.getPublicName    });

         if (me.name !== undefined)
            Core.declareToParent(me);

         // Si le package ne doit pas être scellé (paramètre $.seal = false)
         // alors on créer seulement le publicEnv
         if (!seal) {

            for(name in definition) {
               if (name === '$') continue;
               me.publicEnv[name] = definition[name];
            }

            Core.sealEnv(me.publicEnv, false); // On scelle "$", mais pas le publicEnv qui changera par la suite.
            jsObject.preventExtensions(me.publicEnv);

            return me.publicEnv;
         }

         definition.$.seal = true;
         definition = Definition.new(definition).$._open(Core.beacon);
         me.definition  = definition;
         // On scelle la définition
         definition.publicEnv.$.seal();

         return createPackage(me);
      };

      var maxID                        = 0;
      newPackage.isPackage             = isPackage;
      newPackage.new                   = newPackage;
      newPackage.$                     = 'Package';

      return { isPackage : isPackage
             , new       : newPackage
             , namespace : newPackage};

   })();

   var jsObject = Core.secureObject();
   var publicEnv;

   Core.initialize();

})( { parent            : this.window === undefined ? global : this
    , name              : 'JsPackage'
    , debug             : true
    , onerror           : function(error) {
		"use strict";
        throw error;
      }
   });