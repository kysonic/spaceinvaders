/* */ 
"format global";
"exports $traceurRuntime";
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return ;
  }
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $Object.defineProperties;
  var $defineProperty = $Object.defineProperty;
  var $freeze = $Object.freeze;
  var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $Object.getOwnPropertyNames;
  var $keys = $Object.keys;
  var $hasOwnProperty = $Object.prototype.hasOwnProperty;
  var $toString = $Object.prototype.toString;
  var $preventExtensions = Object.preventExtensions;
  var $seal = Object.seal;
  var $isExtensible = Object.isExtensible;
  var $apply = Function.prototype.call.bind(Function.prototype.apply);
  function $bind(operand, thisArg, args) {
    var argArray = [thisArg];
    for (var i = 0; i < args.length; i++) {
      argArray[i + 1] = args[i];
    }
    var func = $apply(Function.prototype.bind, operand, argArray);
    return func;
  }
  function $construct(func, argArray) {
    var object = new ($bind(func, null, argArray));
    return object;
  }
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var privateNames = $create(null);
  function isPrivateName(s) {
    return privateNames[s];
  }
  function createPrivateName() {
    var s = newUniqueString();
    privateNames[s] = true;
    return s;
  }
  var CONTINUATION_TYPE = Object.create(null);
  function createContinuation(operand, thisArg, argsArray) {
    return [CONTINUATION_TYPE, operand, thisArg, argsArray];
  }
  function isContinuation(object) {
    return object && object[0] === CONTINUATION_TYPE;
  }
  var isTailRecursiveName = null;
  function setupProperTailCalls() {
    isTailRecursiveName = createPrivateName();
    Function.prototype.call = initTailRecursiveFunction(function call(thisArg) {
      var result = tailCall(function(thisArg) {
        var argArray = [];
        for (var i = 1; i < arguments.length; ++i) {
          argArray[i - 1] = arguments[i];
        }
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
    Function.prototype.apply = initTailRecursiveFunction(function apply(thisArg, argArray) {
      var result = tailCall(function(thisArg, argArray) {
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
  }
  function initTailRecursiveFunction(func) {
    if (isTailRecursiveName === null) {
      setupProperTailCalls();
    }
    func[isTailRecursiveName] = true;
    return func;
  }
  function isTailRecursive(func) {
    return !!func[isTailRecursiveName];
  }
  function tailCall(func, thisArg, argArray) {
    var continuation = argArray[0];
    if (isContinuation(continuation)) {
      continuation = $apply(func, thisArg, continuation[3]);
      return continuation;
    }
    continuation = createContinuation(func, thisArg, argArray);
    while (true) {
      if (isTailRecursive(func)) {
        continuation = $apply(func, continuation[2], [continuation]);
      } else {
        continuation = $apply(func, continuation[2], continuation[3]);
      }
      if (!isContinuation(continuation)) {
        return continuation;
      }
      func = continuation[1];
    }
  }
  function construct() {
    var object;
    if (isTailRecursive(this)) {
      object = $construct(this, [createContinuation(null, null, arguments)]);
    } else {
      object = $construct(this, arguments);
    }
    return object;
  }
  var $traceurRuntime = {
    initTailRecursiveFunction: initTailRecursiveFunction,
    call: tailCall,
    continuation: createContinuation,
    construct: construct
  };
  (function() {
    function nonEnum(value) {
      return {
        configurable: true,
        enumerable: false,
        value: value,
        writable: true
      };
    }
    var method = nonEnum;
    var symbolInternalProperty = newUniqueString();
    var symbolDescriptionProperty = newUniqueString();
    var symbolDataProperty = newUniqueString();
    var symbolValues = $create(null);
    function isShimSymbol(symbol) {
      return typeof symbol === 'object' && symbol instanceof SymbolValue;
    }
    function typeOf(v) {
      if (isShimSymbol(v))
        return 'symbol';
      return typeof v;
    }
    function Symbol(description) {
      var value = new SymbolValue(description);
      if (!(this instanceof Symbol))
        return value;
      throw new TypeError('Symbol cannot be new\'ed');
    }
    $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(Symbol.prototype, 'toString', method(function() {
      var symbolValue = this[symbolDataProperty];
      return symbolValue[symbolInternalProperty];
    }));
    $defineProperty(Symbol.prototype, 'valueOf', method(function() {
      var symbolValue = this[symbolDataProperty];
      if (!symbolValue)
        throw TypeError('Conversion from symbol to string');
      if (!getOption('symbols'))
        return symbolValue[symbolInternalProperty];
      return symbolValue;
    }));
    function SymbolValue(description) {
      var key = newUniqueString();
      $defineProperty(this, symbolDataProperty, {value: this});
      $defineProperty(this, symbolInternalProperty, {value: key});
      $defineProperty(this, symbolDescriptionProperty, {value: description});
      freeze(this);
      symbolValues[key] = this;
    }
    $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(SymbolValue.prototype, 'toString', {
      value: Symbol.prototype.toString,
      enumerable: false
    });
    $defineProperty(SymbolValue.prototype, 'valueOf', {
      value: Symbol.prototype.valueOf,
      enumerable: false
    });
    var hashProperty = createPrivateName();
    var hashPropertyDescriptor = {value: undefined};
    var hashObjectProperties = {
      hash: {value: undefined},
      self: {value: undefined}
    };
    var hashCounter = 0;
    function getOwnHashObject(object) {
      var hashObject = object[hashProperty];
      if (hashObject && hashObject.self === object)
        return hashObject;
      if ($isExtensible(object)) {
        hashObjectProperties.hash.value = hashCounter++;
        hashObjectProperties.self.value = object;
        hashPropertyDescriptor.value = $create(null, hashObjectProperties);
        $defineProperty(object, hashProperty, hashPropertyDescriptor);
        return hashPropertyDescriptor.value;
      }
      return undefined;
    }
    function freeze(object) {
      getOwnHashObject(object);
      return $freeze.apply(this, arguments);
    }
    function preventExtensions(object) {
      getOwnHashObject(object);
      return $preventExtensions.apply(this, arguments);
    }
    function seal(object) {
      getOwnHashObject(object);
      return $seal.apply(this, arguments);
    }
    freeze(SymbolValue.prototype);
    function isSymbolString(s) {
      return symbolValues[s] || privateNames[s];
    }
    function toProperty(name) {
      if (isShimSymbol(name))
        return name[symbolInternalProperty];
      return name;
    }
    function removeSymbolKeys(array) {
      var rv = [];
      for (var i = 0; i < array.length; i++) {
        if (!isSymbolString(array[i])) {
          rv.push(array[i]);
        }
      }
      return rv;
    }
    function getOwnPropertyNames(object) {
      return removeSymbolKeys($getOwnPropertyNames(object));
    }
    function keys(object) {
      return removeSymbolKeys($keys(object));
    }
    function getOwnPropertySymbols(object) {
      var rv = [];
      var names = $getOwnPropertyNames(object);
      for (var i = 0; i < names.length; i++) {
        var symbol = symbolValues[names[i]];
        if (symbol) {
          rv.push(symbol);
        }
      }
      return rv;
    }
    function getOwnPropertyDescriptor(object, name) {
      return $getOwnPropertyDescriptor(object, toProperty(name));
    }
    function hasOwnProperty(name) {
      return $hasOwnProperty.call(this, toProperty(name));
    }
    function getOption(name) {
      return global.$traceurRuntime.options[name];
    }
    function defineProperty(object, name, descriptor) {
      if (isShimSymbol(name)) {
        name = name[symbolInternalProperty];
      }
      $defineProperty(object, name, descriptor);
      return object;
    }
    function polyfillObject(Object) {
      $defineProperty(Object, 'defineProperty', {value: defineProperty});
      $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
      $defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
      $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
      $defineProperty(Object, 'freeze', {value: freeze});
      $defineProperty(Object, 'preventExtensions', {value: preventExtensions});
      $defineProperty(Object, 'seal', {value: seal});
      $defineProperty(Object, 'keys', {value: keys});
    }
    function exportStar(object) {
      for (var i = 1; i < arguments.length; i++) {
        var names = $getOwnPropertyNames(arguments[i]);
        for (var j = 0; j < names.length; j++) {
          var name = names[j];
          if (isSymbolString(name))
            continue;
          (function(mod, name) {
            $defineProperty(object, name, {
              get: function() {
                return mod[name];
              },
              enumerable: true
            });
          })(arguments[i], names[j]);
        }
      }
      return object;
    }
    function isObject(x) {
      return x != null && (typeof x === 'object' || typeof x === 'function');
    }
    function toObject(x) {
      if (x == null)
        throw $TypeError();
      return $Object(x);
    }
    function checkObjectCoercible(argument) {
      if (argument == null) {
        throw new TypeError('Value cannot be converted to an Object');
      }
      return argument;
    }
    function polyfillSymbol(global, Symbol) {
      if (!global.Symbol) {
        global.Symbol = Symbol;
        Object.getOwnPropertySymbols = getOwnPropertySymbols;
      }
      if (!global.Symbol.iterator) {
        global.Symbol.iterator = Symbol('Symbol.iterator');
      }
      if (!global.Symbol.observer) {
        global.Symbol.observer = Symbol('Symbol.observer');
      }
    }
    function setupGlobals(global) {
      polyfillSymbol(global, Symbol);
      global.Reflect = global.Reflect || {};
      global.Reflect.global = global.Reflect.global || global;
      polyfillObject(global.Object);
    }
    setupGlobals(global);
    global.$traceurRuntime = {
      call: tailCall,
      checkObjectCoercible: checkObjectCoercible,
      construct: construct,
      continuation: createContinuation,
      createPrivateName: createPrivateName,
      defineProperties: $defineProperties,
      defineProperty: $defineProperty,
      exportStar: exportStar,
      getOwnHashObject: getOwnHashObject,
      getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
      getOwnPropertyNames: $getOwnPropertyNames,
      initTailRecursiveFunction: initTailRecursiveFunction,
      isObject: isObject,
      isPrivateName: isPrivateName,
      isSymbolString: isSymbolString,
      keys: $keys,
      options: {},
      setupGlobals: setupGlobals,
      toObject: toObject,
      toProperty: toProperty,
      typeof: typeOf
    };
  })();
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
(function() {
  function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (opt_scheme) {
      out.push(opt_scheme, ':');
    }
    if (opt_domain) {
      out.push('//');
      if (opt_userInfo) {
        out.push(opt_userInfo, '@');
      }
      out.push(opt_domain);
      if (opt_port) {
        out.push(':', opt_port);
      }
    }
    if (opt_path) {
      out.push(opt_path);
    }
    if (opt_queryData) {
      out.push('?', opt_queryData);
    }
    if (opt_fragment) {
      out.push('#', opt_fragment);
    }
    return out.join('');
  }
  ;
  var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var ComponentIndex = {
    SCHEME: 1,
    USER_INFO: 2,
    DOMAIN: 3,
    PORT: 4,
    PATH: 5,
    QUERY_DATA: 6,
    FRAGMENT: 7
  };
  function split(uri) {
    return (uri.match(splitRe));
  }
  function removeDotSegments(path) {
    if (path === '/')
      return '/';
    var leadingSlash = path[0] === '/' ? '/' : '';
    var trailingSlash = path.slice(-1) === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length)
            out.pop();
          else
            up++;
          break;
        default:
          out.push(segment);
      }
    }
    if (!leadingSlash) {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function joinAndCanonicalizePath(parts) {
    var path = parts[ComponentIndex.PATH] || '';
    path = removeDotSegments(path);
    parts[ComponentIndex.PATH] = path;
    return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
  }
  function canonicalizeUrl(url) {
    var parts = split(url);
    return joinAndCanonicalizePath(parts);
  }
  function resolveUrl(base, url) {
    var parts = split(url);
    var baseParts = split(base);
    if (parts[ComponentIndex.SCHEME]) {
      return joinAndCanonicalizePath(parts);
    } else {
      parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
    }
    for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
      if (!parts[i]) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[ComponentIndex.PATH][0] == '/') {
      return joinAndCanonicalizePath(parts);
    }
    var path = baseParts[ComponentIndex.PATH];
    var index = path.lastIndexOf('/');
    path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
    parts[ComponentIndex.PATH] = path;
    return joinAndCanonicalizePath(parts);
  }
  function isAbsolute(name) {
    if (!name)
      return false;
    if (name[0] === '/')
      return true;
    var parts = split(name);
    if (parts[ComponentIndex.SCHEME])
      return true;
    return false;
  }
  $traceurRuntime.canonicalizeUrl = canonicalizeUrl;
  $traceurRuntime.isAbsolute = isAbsolute;
  $traceurRuntime.removeDotSegments = removeDotSegments;
  $traceurRuntime.resolveUrl = resolveUrl;
})();
(function(global) {
  'use strict';
  var $__1 = $traceurRuntime,
      canonicalizeUrl = $__1.canonicalizeUrl,
      resolveUrl = $__1.resolveUrl,
      isAbsolute = $__1.isAbsolute;
  var moduleInstantiators = Object.create(null);
  var baseURL;
  if (global.location && global.location.href)
    baseURL = resolveUrl(global.location.href, './');
  else
    baseURL = '';
  function UncoatedModuleEntry(url, uncoatedModule) {
    this.url = url;
    this.value_ = uncoatedModule;
  }
  function ModuleEvaluationError(erroneousModuleName, cause) {
    this.message = this.constructor.name + ': ' + this.stripCause(cause) + ' in ' + erroneousModuleName;
    if (!(cause instanceof ModuleEvaluationError) && cause.stack)
      this.stack = this.stripStack(cause.stack);
    else
      this.stack = '';
  }
  ModuleEvaluationError.prototype = Object.create(Error.prototype);
  ModuleEvaluationError.prototype.constructor = ModuleEvaluationError;
  ModuleEvaluationError.prototype.stripError = function(message) {
    return message.replace(/.*Error:/, this.constructor.name + ':');
  };
  ModuleEvaluationError.prototype.stripCause = function(cause) {
    if (!cause)
      return '';
    if (!cause.message)
      return cause + '';
    return this.stripError(cause.message);
  };
  ModuleEvaluationError.prototype.loadedBy = function(moduleName) {
    this.stack += '\n loaded by ' + moduleName;
  };
  ModuleEvaluationError.prototype.stripStack = function(causeStack) {
    var stack = [];
    causeStack.split('\n').some((function(frame) {
      if (/UncoatedModuleInstantiator/.test(frame))
        return true;
      stack.push(frame);
    }));
    stack[0] = this.stripError(stack[0]);
    return stack.join('\n');
  };
  function beforeLines(lines, number) {
    var result = [];
    var first = number - 3;
    if (first < 0)
      first = 0;
    for (var i = first; i < number; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function afterLines(lines, number) {
    var last = number + 1;
    if (last > lines.length - 1)
      last = lines.length - 1;
    var result = [];
    for (var i = number; i <= last; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function columnSpacing(columns) {
    var result = '';
    for (var i = 0; i < columns - 1; i++) {
      result += '-';
    }
    return result;
  }
  function UncoatedModuleInstantiator(url, func) {
    UncoatedModuleEntry.call(this, url, null);
    this.func = func;
  }
  UncoatedModuleInstantiator.prototype = Object.create(UncoatedModuleEntry.prototype);
  UncoatedModuleInstantiator.prototype.getUncoatedModule = function() {
    if (this.value_)
      return this.value_;
    try {
      var relativeRequire;
      if (typeof $traceurRuntime !== undefined && $traceurRuntime.require) {
        relativeRequire = $traceurRuntime.require.bind(null, this.url);
      }
      return this.value_ = this.func.call(global, relativeRequire);
    } catch (ex) {
      if (ex instanceof ModuleEvaluationError) {
        ex.loadedBy(this.url);
        throw ex;
      }
      if (ex.stack) {
        var lines = this.func.toString().split('\n');
        var evaled = [];
        ex.stack.split('\n').some(function(frame) {
          if (frame.indexOf('UncoatedModuleInstantiator.getUncoatedModule') > 0)
            return true;
          var m = /(at\s[^\s]*\s).*>:(\d*):(\d*)\)/.exec(frame);
          if (m) {
            var line = parseInt(m[2], 10);
            evaled = evaled.concat(beforeLines(lines, line));
            evaled.push(columnSpacing(m[3]) + '^');
            evaled = evaled.concat(afterLines(lines, line));
            evaled.push('= = = = = = = = =');
          } else {
            evaled.push(frame);
          }
        });
        ex.stack = evaled.join('\n');
      }
      throw new ModuleEvaluationError(this.url, ex);
    }
  };
  function getUncoatedModuleInstantiator(name) {
    if (!name)
      return ;
    var url = ModuleStore.normalize(name);
    return moduleInstantiators[url];
  }
  ;
  var moduleInstances = Object.create(null);
  var liveModuleSentinel = {};
  function Module(uncoatedModule) {
    var isLive = arguments[1];
    var coatedModule = Object.create(null);
    Object.getOwnPropertyNames(uncoatedModule).forEach((function(name) {
      var getter,
          value;
      if (isLive === liveModuleSentinel) {
        var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
        if (descr.get)
          getter = descr.get;
      }
      if (!getter) {
        value = uncoatedModule[name];
        getter = function() {
          return value;
        };
      }
      Object.defineProperty(coatedModule, name, {
        get: getter,
        enumerable: true
      });
    }));
    Object.preventExtensions(coatedModule);
    return coatedModule;
  }
  var ModuleStore = {
    normalize: function(name, refererName, refererAddress) {
      if (typeof name !== 'string')
        throw new TypeError('module name must be a string, not ' + typeof name);
      if (isAbsolute(name))
        return canonicalizeUrl(name);
      if (/[^\.]\/\.\.\//.test(name)) {
        throw new Error('module name embeds /../: ' + name);
      }
      if (name[0] === '.' && refererName)
        return resolveUrl(refererName, name);
      return canonicalizeUrl(name);
    },
    get: function(normalizedName) {
      var m = getUncoatedModuleInstantiator(normalizedName);
      if (!m)
        return undefined;
      var moduleInstance = moduleInstances[m.url];
      if (moduleInstance)
        return moduleInstance;
      moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
      return moduleInstances[m.url] = moduleInstance;
    },
    set: function(normalizedName, module) {
      normalizedName = String(normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, (function() {
        return module;
      }));
      moduleInstances[normalizedName] = module;
    },
    get baseURL() {
      return baseURL;
    },
    set baseURL(v) {
      baseURL = String(v);
    },
    registerModule: function(name, deps, func) {
      var normalizedName = ModuleStore.normalize(name);
      if (moduleInstantiators[normalizedName])
        throw new Error('duplicate module named ' + normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
    },
    bundleStore: Object.create(null),
    register: function(name, deps, func) {
      if (!deps || !deps.length && !func.length) {
        this.registerModule(name, deps, func);
      } else {
        this.bundleStore[name] = {
          deps: deps,
          execute: function() {
            var $__0 = arguments;
            var depMap = {};
            deps.forEach((function(dep, index) {
              return depMap[dep] = $__0[index];
            }));
            var registryEntry = func.call(this, depMap);
            registryEntry.execute.call(this);
            return registryEntry.exports;
          }
        };
      }
    },
    getAnonymousModule: function(func) {
      return new Module(func.call(global), liveModuleSentinel);
    },
    getForTesting: function(name) {
      var $__0 = this;
      if (!this.testingPrefix_) {
        Object.keys(moduleInstances).some((function(key) {
          var m = /(traceur@[^\/]*\/)/.exec(key);
          if (m) {
            $__0.testingPrefix_ = m[1];
            return true;
          }
        }));
      }
      return this.get(this.testingPrefix_ + name);
    }
  };
  var moduleStoreModule = new Module({ModuleStore: ModuleStore});
  ModuleStore.set('@traceur/src/runtime/ModuleStore', moduleStoreModule);
  ModuleStore.set('@traceur/src/runtime/ModuleStore.js', moduleStoreModule);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
  };
  $traceurRuntime.ModuleStore = ModuleStore;
  global.System = {
    register: ModuleStore.register.bind(ModuleStore),
    registerModule: ModuleStore.registerModule.bind(ModuleStore),
    get: ModuleStore.get,
    set: ModuleStore.set,
    normalize: ModuleStore.normalize
  };
  $traceurRuntime.getModuleImpl = function(name) {
    var instantiator = getUncoatedModuleInstantiator(name);
    return instantiator && instantiator.getUncoatedModule();
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
System.registerModule("traceur-runtime@0.0.87/src/runtime/async.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/async.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var $createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $create = Object.create;
  var thisName = $createPrivateName();
  var argsName = $createPrivateName();
  var observeName = $createPrivateName();
  function AsyncGeneratorFunction() {}
  function AsyncGeneratorFunctionPrototype() {}
  AsyncGeneratorFunction.prototype = AsyncGeneratorFunctionPrototype;
  AsyncGeneratorFunctionPrototype.constructor = AsyncGeneratorFunction;
  $defineProperty(AsyncGeneratorFunctionPrototype, 'constructor', {enumerable: false});
  var AsyncGeneratorContext = function AsyncGeneratorContext(observer) {
    var $__0 = this;
    this.decoratedObserver = $traceurRuntime.createDecoratedGenerator(observer, (function() {
      $__0.done = true;
    }));
    this.done = false;
    this.inReturn = false;
  };
  ($traceurRuntime.createClass)(AsyncGeneratorContext, {
    throw: function(error) {
      if (!this.inReturn) {
        throw error;
      }
    },
    yield: function(value) {
      if (this.done) {
        this.inReturn = true;
        throw undefined;
      }
      var result;
      try {
        result = this.decoratedObserver.next(value);
      } catch (e) {
        this.done = true;
        throw e;
      }
      if (result === undefined) {
        return ;
      }
      if (result.done) {
        this.done = true;
        this.inReturn = true;
        throw undefined;
      }
      return result.value;
    },
    yieldFor: function(observable) {
      var ctx = this;
      return $traceurRuntime.observeForEach(observable[$traceurRuntime.toProperty(Symbol.observer)].bind(observable), function(value) {
        if (ctx.done) {
          this.return();
          return ;
        }
        var result;
        try {
          result = ctx.decoratedObserver.next(value);
        } catch (e) {
          ctx.done = true;
          throw e;
        }
        if (result === undefined) {
          return ;
        }
        if (result.done) {
          ctx.done = true;
        }
        return result;
      });
    }
  }, {});
  AsyncGeneratorFunctionPrototype.prototype[Symbol.observer] = function(observer) {
    var observe = this[observeName];
    var ctx = new AsyncGeneratorContext(observer);
    $traceurRuntime.schedule((function() {
      return observe(ctx);
    })).then((function(value) {
      if (!ctx.done) {
        ctx.decoratedObserver.return(value);
      }
    })).catch((function(error) {
      if (!ctx.done) {
        ctx.decoratedObserver.throw(error);
      }
    }));
    return ctx.decoratedObserver;
  };
  $defineProperty(AsyncGeneratorFunctionPrototype.prototype, Symbol.observer, {enumerable: false});
  function initAsyncGeneratorFunction(functionObject) {
    functionObject.prototype = $create(AsyncGeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = AsyncGeneratorFunctionPrototype;
    return functionObject;
  }
  function createAsyncGeneratorInstance(observe, functionObject) {
    for (var args = [],
        $__2 = 2; $__2 < arguments.length; $__2++)
      args[$__2 - 2] = arguments[$__2];
    var object = $create(functionObject.prototype);
    object[thisName] = this;
    object[argsName] = args;
    object[observeName] = observe;
    return object;
  }
  function observeForEach(observe, next) {
    return new Promise((function(resolve, reject) {
      var generator = observe({
        next: function(value) {
          return next.call(generator, value);
        },
        throw: function(error) {
          reject(error);
        },
        return: function(value) {
          resolve(value);
        }
      });
    }));
  }
  function schedule(asyncF) {
    return Promise.resolve().then(asyncF);
  }
  var generator = Symbol();
  var onDone = Symbol();
  var DecoratedGenerator = function DecoratedGenerator(_generator, _onDone) {
    this[generator] = _generator;
    this[onDone] = _onDone;
  };
  ($traceurRuntime.createClass)(DecoratedGenerator, {
    next: function(value) {
      var result = this[generator].next(value);
      if (result !== undefined && result.done) {
        this[onDone].call(this);
      }
      return result;
    },
    throw: function(error) {
      this[onDone].call(this);
      return this[generator].throw(error);
    },
    return: function(value) {
      this[onDone].call(this);
      return this[generator].return(value);
    }
  }, {});
  function createDecoratedGenerator(generator, onDone) {
    return new DecoratedGenerator(generator, onDone);
  }
  $traceurRuntime.initAsyncGeneratorFunction = initAsyncGeneratorFunction;
  $traceurRuntime.createAsyncGeneratorInstance = createAsyncGeneratorInstance;
  $traceurRuntime.observeForEach = observeForEach;
  $traceurRuntime.schedule = schedule;
  $traceurRuntime.createDecoratedGenerator = createDecoratedGenerator;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/classes.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/classes.js";
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $getOwnPropertyDescriptor = $traceurRuntime.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $traceurRuntime.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $__0 = Object,
      getOwnPropertyNames = $__0.getOwnPropertyNames,
      getOwnPropertySymbols = $__0.getOwnPropertySymbols;
  function superDescriptor(homeObject, name) {
    var proto = $getPrototypeOf(homeObject);
    do {
      var result = $getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = $getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      if (!descriptor.get)
        return descriptor.value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  function getDescriptors(object) {
    var descriptors = {};
    var names = getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      descriptors[name] = $getOwnPropertyDescriptor(object, name);
    }
    var symbols = getOwnPropertySymbols(object);
    for (var i = 0; i < symbols.length; i++) {
      var symbol = symbols[i];
      descriptors[$traceurRuntime.toProperty(symbol)] = $getOwnPropertyDescriptor(object, $traceurRuntime.toProperty(symbol));
    }
    return descriptors;
  }
  function createClass(ctor, object, staticObject, superClass) {
    $defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
    } else {
      ctor.prototype = object;
    }
    $defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return $defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/destructuring.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/destructuring.js";
  function iteratorToArray(iter) {
    var rv = [];
    var i = 0;
    var tmp;
    while (!(tmp = iter.next()).done) {
      rv[i++] = tmp.value;
    }
    return rv;
  }
  $traceurRuntime.iteratorToArray = iteratorToArray;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/generators.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/generators.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $create = Object.create;
  var $TypeError = TypeError;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var ST_NEWBORN = 0;
  var ST_EXECUTING = 1;
  var ST_SUSPENDED = 2;
  var ST_CLOSED = 3;
  var END_STATE = -2;
  var RETHROW_STATE = -3;
  function getInternalError(state) {
    return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
  }
  var RETURN_SENTINEL = {};
  function GeneratorContext() {
    this.state = 0;
    this.GState = ST_NEWBORN;
    this.storedException = undefined;
    this.finallyFallThrough = undefined;
    this.sent_ = undefined;
    this.returnValue = undefined;
    this.oldReturnValue = undefined;
    this.tryStack_ = [];
  }
  GeneratorContext.prototype = {
    pushTry: function(catchState, finallyState) {
      if (finallyState !== null) {
        var finallyFallThrough = null;
        for (var i = this.tryStack_.length - 1; i >= 0; i--) {
          if (this.tryStack_[i].catch !== undefined) {
            finallyFallThrough = this.tryStack_[i].catch;
            break;
          }
        }
        if (finallyFallThrough === null)
          finallyFallThrough = RETHROW_STATE;
        this.tryStack_.push({
          finally: finallyState,
          finallyFallThrough: finallyFallThrough
        });
      }
      if (catchState !== null) {
        this.tryStack_.push({catch: catchState});
      }
    },
    popTry: function() {
      this.tryStack_.pop();
    },
    maybeUncatchable: function() {
      if (this.storedException === RETURN_SENTINEL) {
        throw RETURN_SENTINEL;
      }
    },
    get sent() {
      this.maybeThrow();
      return this.sent_;
    },
    set sent(v) {
      this.sent_ = v;
    },
    get sentIgnoreThrow() {
      return this.sent_;
    },
    maybeThrow: function() {
      if (this.action === 'throw') {
        this.action = 'next';
        throw this.sent_;
      }
    },
    end: function() {
      switch (this.state) {
        case END_STATE:
          return this;
        case RETHROW_STATE:
          throw this.storedException;
        default:
          throw getInternalError(this.state);
      }
    },
    handleException: function(ex) {
      this.GState = ST_CLOSED;
      this.state = END_STATE;
      throw ex;
    },
    wrapYieldStar: function(iterator) {
      var ctx = this;
      return {
        next: function(v) {
          return iterator.next(v);
        },
        throw: function(e) {
          var result;
          if (e === RETURN_SENTINEL) {
            if (iterator.return) {
              result = iterator.return(ctx.returnValue);
              if (!result.done) {
                ctx.returnValue = ctx.oldReturnValue;
                return result;
              }
              ctx.returnValue = result.value;
            }
            throw e;
          }
          if (iterator.throw) {
            return iterator.throw(e);
          }
          iterator.return && iterator.return();
          throw $TypeError('Inner iterator does not have a throw method');
        }
      };
    }
  };
  function nextOrThrow(ctx, moveNext, action, x) {
    switch (ctx.GState) {
      case ST_EXECUTING:
        throw new Error(("\"" + action + "\" on executing generator"));
      case ST_CLOSED:
        if (action == 'next') {
          return {
            value: undefined,
            done: true
          };
        }
        if (x === RETURN_SENTINEL) {
          return {
            value: ctx.returnValue,
            done: true
          };
        }
        throw x;
      case ST_NEWBORN:
        if (action === 'throw') {
          ctx.GState = ST_CLOSED;
          if (x === RETURN_SENTINEL) {
            return {
              value: ctx.returnValue,
              done: true
            };
          }
          throw x;
        }
        if (x !== undefined)
          throw $TypeError('Sent value to newborn generator');
      case ST_SUSPENDED:
        ctx.GState = ST_EXECUTING;
        ctx.action = action;
        ctx.sent = x;
        var value;
        try {
          value = moveNext(ctx);
        } catch (ex) {
          if (ex === RETURN_SENTINEL) {
            value = ctx;
          } else {
            throw ex;
          }
        }
        var done = value === ctx;
        if (done)
          value = ctx.returnValue;
        ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
        return {
          value: value,
          done: done
        };
    }
  }
  var ctxName = createPrivateName();
  var moveNextName = createPrivateName();
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  $defineProperty(GeneratorFunctionPrototype, 'constructor', nonEnum(GeneratorFunction));
  GeneratorFunctionPrototype.prototype = {
    constructor: GeneratorFunctionPrototype,
    next: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'next', v);
    },
    throw: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', v);
    },
    return: function(v) {
      this[ctxName].oldReturnValue = this[ctxName].returnValue;
      this[ctxName].returnValue = v;
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', RETURN_SENTINEL);
    }
  };
  $defineProperties(GeneratorFunctionPrototype.prototype, {
    constructor: {enumerable: false},
    next: {enumerable: false},
    throw: {enumerable: false},
    return: {enumerable: false}
  });
  Object.defineProperty(GeneratorFunctionPrototype.prototype, Symbol.iterator, nonEnum(function() {
    return this;
  }));
  function createGeneratorInstance(innerFunction, functionObject, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new GeneratorContext();
    var object = $create(functionObject.prototype);
    object[ctxName] = ctx;
    object[moveNextName] = moveNext;
    return object;
  }
  function initGeneratorFunction(functionObject) {
    functionObject.prototype = $create(GeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = GeneratorFunctionPrototype;
    return functionObject;
  }
  function AsyncFunctionContext() {
    GeneratorContext.call(this);
    this.err = undefined;
    var ctx = this;
    ctx.result = new Promise(function(resolve, reject) {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  }
  AsyncFunctionContext.prototype = $create(GeneratorContext.prototype);
  AsyncFunctionContext.prototype.end = function() {
    switch (this.state) {
      case END_STATE:
        this.resolve(this.returnValue);
        break;
      case RETHROW_STATE:
        this.reject(this.storedException);
        break;
      default:
        this.reject(getInternalError(this.state));
    }
  };
  AsyncFunctionContext.prototype.handleException = function() {
    this.state = RETHROW_STATE;
  };
  function asyncWrap(innerFunction, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new AsyncFunctionContext();
    ctx.createCallback = function(newState) {
      return function(value) {
        ctx.state = newState;
        ctx.value = value;
        moveNext(ctx);
      };
    };
    ctx.errback = function(err) {
      handleCatch(ctx, err);
      moveNext(ctx);
    };
    moveNext(ctx);
    return ctx.result;
  }
  function getMoveNext(innerFunction, self) {
    return function(ctx) {
      while (true) {
        try {
          return innerFunction.call(self, ctx);
        } catch (ex) {
          handleCatch(ctx, ex);
        }
      }
    };
  }
  function handleCatch(ctx, ex) {
    ctx.storedException = ex;
    var last = ctx.tryStack_[ctx.tryStack_.length - 1];
    if (!last) {
      ctx.handleException(ex);
      return ;
    }
    ctx.state = last.catch !== undefined ? last.catch : last.finally;
    if (last.finallyFallThrough !== undefined)
      ctx.finallyFallThrough = last.finallyFallThrough;
  }
  $traceurRuntime.asyncWrap = asyncWrap;
  $traceurRuntime.initGeneratorFunction = initGeneratorFunction;
  $traceurRuntime.createGeneratorInstance = createGeneratorInstance;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/relativeRequire.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/relativeRequire.js";
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return ;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/spread.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/spread.js";
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  $traceurRuntime.spread = spread;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/type-assertions.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/type-assertions.js";
  var types = {
    any: {name: 'any'},
    boolean: {name: 'boolean'},
    number: {name: 'number'},
    string: {name: 'string'},
    symbol: {name: 'symbol'},
    void: {name: 'void'}
  };
  var GenericType = function GenericType(type, argumentTypes) {
    this.type = type;
    this.argumentTypes = argumentTypes;
  };
  ($traceurRuntime.createClass)(GenericType, {}, {});
  var typeRegister = Object.create(null);
  function genericType(type) {
    for (var argumentTypes = [],
        $__1 = 1; $__1 < arguments.length; $__1++)
      argumentTypes[$__1 - 1] = arguments[$__1];
    var typeMap = typeRegister;
    var key = $traceurRuntime.getOwnHashObject(type).hash;
    if (!typeMap[key]) {
      typeMap[key] = Object.create(null);
    }
    typeMap = typeMap[key];
    for (var i = 0; i < argumentTypes.length - 1; i++) {
      key = $traceurRuntime.getOwnHashObject(argumentTypes[i]).hash;
      if (!typeMap[key]) {
        typeMap[key] = Object.create(null);
      }
      typeMap = typeMap[key];
    }
    var tail = argumentTypes[argumentTypes.length - 1];
    key = $traceurRuntime.getOwnHashObject(tail).hash;
    if (!typeMap[key]) {
      typeMap[key] = new GenericType(type, argumentTypes);
    }
    return typeMap[key];
  }
  $traceurRuntime.GenericType = GenericType;
  $traceurRuntime.genericType = genericType;
  $traceurRuntime.type = types;
  return {};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/runtime-modules.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/runtime-modules.js";
  System.get("traceur-runtime@0.0.87/src/runtime/relativeRequire.js");
  System.get("traceur-runtime@0.0.87/src/runtime/spread.js");
  System.get("traceur-runtime@0.0.87/src/runtime/destructuring.js");
  System.get("traceur-runtime@0.0.87/src/runtime/classes.js");
  System.get("traceur-runtime@0.0.87/src/runtime/async.js");
  System.get("traceur-runtime@0.0.87/src/runtime/generators.js");
  System.get("traceur-runtime@0.0.87/src/runtime/type-assertions.js");
  return {};
});
System.get("traceur-runtime@0.0.87/src/runtime/runtime-modules.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/utils.js";
  var $ceil = Math.ceil;
  var $floor = Math.floor;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $pow = Math.pow;
  var $min = Math.min;
  var toObject = $traceurRuntime.toObject;
  function toUint32(x) {
    return x >>> 0;
  }
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function isCallable(x) {
    return typeof x === 'function';
  }
  function isNumber(x) {
    return typeof x === 'number';
  }
  function toInteger(x) {
    x = +x;
    if ($isNaN(x))
      return 0;
    if (x === 0 || !$isFinite(x))
      return x;
    return x > 0 ? $floor(x) : $ceil(x);
  }
  var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
  function toLength(x) {
    var len = toInteger(x);
    return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
  }
  function checkIterable(x) {
    return !isObject(x) ? undefined : x[Symbol.iterator];
  }
  function isConstructor(x) {
    return isCallable(x);
  }
  function createIteratorResultObject(value, done) {
    return {
      value: value,
      done: done
    };
  }
  function maybeDefine(object, name, descr) {
    if (!(name in object)) {
      Object.defineProperty(object, name, descr);
    }
  }
  function maybeDefineMethod(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  function maybeDefineConst(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  function maybeAddFunctions(object, functions) {
    for (var i = 0; i < functions.length; i += 2) {
      var name = functions[i];
      var value = functions[i + 1];
      maybeDefineMethod(object, name, value);
    }
  }
  function maybeAddConsts(object, consts) {
    for (var i = 0; i < consts.length; i += 2) {
      var name = consts[i];
      var value = consts[i + 1];
      maybeDefineConst(object, name, value);
    }
  }
  function maybeAddIterator(object, func, Symbol) {
    if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
      return ;
    if (object['@@iterator'])
      func = object['@@iterator'];
    Object.defineProperty(object, Symbol.iterator, {
      value: func,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var polyfills = [];
  function registerPolyfill(func) {
    polyfills.push(func);
  }
  function polyfillAll(global) {
    polyfills.forEach((function(f) {
      return f(global);
    }));
  }
  return {
    get toObject() {
      return toObject;
    },
    get toUint32() {
      return toUint32;
    },
    get isObject() {
      return isObject;
    },
    get isCallable() {
      return isCallable;
    },
    get isNumber() {
      return isNumber;
    },
    get toInteger() {
      return toInteger;
    },
    get toLength() {
      return toLength;
    },
    get checkIterable() {
      return checkIterable;
    },
    get isConstructor() {
      return isConstructor;
    },
    get createIteratorResultObject() {
      return createIteratorResultObject;
    },
    get maybeDefine() {
      return maybeDefine;
    },
    get maybeDefineMethod() {
      return maybeDefineMethod;
    },
    get maybeDefineConst() {
      return maybeDefineConst;
    },
    get maybeAddFunctions() {
      return maybeAddFunctions;
    },
    get maybeAddConsts() {
      return maybeAddConsts;
    },
    get maybeAddIterator() {
      return maybeAddIterator;
    },
    get registerPolyfill() {
      return registerPolyfill;
    },
    get polyfillAll() {
      return polyfillAll;
    }
  };
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Map.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Map.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      maybeAddIterator = $__0.maybeAddIterator,
      registerPolyfill = $__0.registerPolyfill;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var deletedSentinel = {};
  function lookupIndex(map, key) {
    if (isObject(key)) {
      var hashObject = getOwnHashObject(key);
      return hashObject && map.objectIndex_[hashObject.hash];
    }
    if (typeof key === 'string')
      return map.stringIndex_[key];
    return map.primitiveIndex_[key];
  }
  function initMap(map) {
    map.entries_ = [];
    map.objectIndex_ = Object.create(null);
    map.stringIndex_ = Object.create(null);
    map.primitiveIndex_ = Object.create(null);
    map.deletedCount_ = 0;
  }
  var Map = function Map() {
    var $__10,
        $__11;
    var iterable = arguments[0];
    if (!isObject(this))
      throw new TypeError('Map called on incompatible type');
    if ($hasOwnProperty.call(this, 'entries_')) {
      throw new TypeError('Map can not be reentrantly initialised');
    }
    initMap(this);
    if (iterable !== null && iterable !== undefined) {
      var $__5 = true;
      var $__6 = false;
      var $__7 = undefined;
      try {
        for (var $__3 = void 0,
            $__2 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
          var $__9 = $__3.value,
              key = ($__10 = $__9[$traceurRuntime.toProperty(Symbol.iterator)](), ($__11 = $__10.next()).done ? void 0 : $__11.value),
              value = ($__11 = $__10.next()).done ? void 0 : $__11.value;
          {
            this.set(key, value);
          }
        }
      } catch ($__8) {
        $__6 = true;
        $__7 = $__8;
      } finally {
        try {
          if (!$__5 && $__2.return != null) {
            $__2.return();
          }
        } finally {
          if ($__6) {
            throw $__7;
          }
        }
      }
    }
  };
  ($traceurRuntime.createClass)(Map, {
    get size() {
      return this.entries_.length / 2 - this.deletedCount_;
    },
    get: function(key) {
      var index = lookupIndex(this, key);
      if (index !== undefined)
        return this.entries_[index + 1];
    },
    set: function(key, value) {
      var objectMode = isObject(key);
      var stringMode = typeof key === 'string';
      var index = lookupIndex(this, key);
      if (index !== undefined) {
        this.entries_[index + 1] = value;
      } else {
        index = this.entries_.length;
        this.entries_[index] = key;
        this.entries_[index + 1] = value;
        if (objectMode) {
          var hashObject = getOwnHashObject(key);
          var hash = hashObject.hash;
          this.objectIndex_[hash] = index;
        } else if (stringMode) {
          this.stringIndex_[key] = index;
        } else {
          this.primitiveIndex_[key] = index;
        }
      }
      return this;
    },
    has: function(key) {
      return lookupIndex(this, key) !== undefined;
    },
    delete: function(key) {
      var objectMode = isObject(key);
      var stringMode = typeof key === 'string';
      var index;
      var hash;
      if (objectMode) {
        var hashObject = getOwnHashObject(key);
        if (hashObject) {
          index = this.objectIndex_[hash = hashObject.hash];
          delete this.objectIndex_[hash];
        }
      } else if (stringMode) {
        index = this.stringIndex_[key];
        delete this.stringIndex_[key];
      } else {
        index = this.primitiveIndex_[key];
        delete this.primitiveIndex_[key];
      }
      if (index !== undefined) {
        this.entries_[index] = deletedSentinel;
        this.entries_[index + 1] = undefined;
        this.deletedCount_++;
        return true;
      }
      return false;
    },
    clear: function() {
      initMap(this);
    },
    forEach: function(callbackFn) {
      var thisArg = arguments[1];
      for (var i = 0; i < this.entries_.length; i += 2) {
        var key = this.entries_[i];
        var value = this.entries_[i + 1];
        if (key === deletedSentinel)
          continue;
        callbackFn.call(thisArg, value, key, this);
      }
    },
    entries: $traceurRuntime.initGeneratorFunction(function $__12() {
      var i,
          key,
          value;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return [key, value];
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__12, this);
    }),
    keys: $traceurRuntime.initGeneratorFunction(function $__13() {
      var i,
          key,
          value;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return key;
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__13, this);
    }),
    values: $traceurRuntime.initGeneratorFunction(function $__14() {
      var i,
          key,
          value;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return value;
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__14, this);
    })
  }, {});
  Object.defineProperty(Map.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Map.prototype.entries
  });
  function polyfillMap(global) {
    var $__9 = global,
        Object = $__9.Object,
        Symbol = $__9.Symbol;
    if (!global.Map)
      global.Map = Map;
    var mapPrototype = global.Map.prototype;
    if (mapPrototype.entries === undefined)
      global.Map = Map;
    if (mapPrototype.entries) {
      maybeAddIterator(mapPrototype, mapPrototype.entries, Symbol);
      maybeAddIterator(Object.getPrototypeOf(new global.Map().entries()), function() {
        return this;
      }, Symbol);
    }
  }
  registerPolyfill(polyfillMap);
  return {
    get Map() {
      return Map;
    },
    get polyfillMap() {
      return polyfillMap;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Map.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Set.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Set.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      maybeAddIterator = $__0.maybeAddIterator,
      registerPolyfill = $__0.registerPolyfill;
  var Map = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Map.js").Map;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  function initSet(set) {
    set.map_ = new Map();
  }
  var Set = function Set() {
    var iterable = arguments[0];
    if (!isObject(this))
      throw new TypeError('Set called on incompatible type');
    if ($hasOwnProperty.call(this, 'map_')) {
      throw new TypeError('Set can not be reentrantly initialised');
    }
    initSet(this);
    if (iterable !== null && iterable !== undefined) {
      var $__7 = true;
      var $__8 = false;
      var $__9 = undefined;
      try {
        for (var $__5 = void 0,
            $__4 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__7 = ($__5 = $__4.next()).done); $__7 = true) {
          var item = $__5.value;
          {
            this.add(item);
          }
        }
      } catch ($__10) {
        $__8 = true;
        $__9 = $__10;
      } finally {
        try {
          if (!$__7 && $__4.return != null) {
            $__4.return();
          }
        } finally {
          if ($__8) {
            throw $__9;
          }
        }
      }
    }
  };
  ($traceurRuntime.createClass)(Set, {
    get size() {
      return this.map_.size;
    },
    has: function(key) {
      return this.map_.has(key);
    },
    add: function(key) {
      this.map_.set(key, key);
      return this;
    },
    delete: function(key) {
      return this.map_.delete(key);
    },
    clear: function() {
      return this.map_.clear();
    },
    forEach: function(callbackFn) {
      var thisArg = arguments[1];
      var $__2 = this;
      return this.map_.forEach((function(value, key) {
        callbackFn.call(thisArg, key, key, $__2);
      }));
    },
    values: $traceurRuntime.initGeneratorFunction(function $__12() {
      var $__13,
          $__14;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__13 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__14 = $__13[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__14.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__14.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__14.value;
            default:
              return $ctx.end();
          }
      }, $__12, this);
    }),
    entries: $traceurRuntime.initGeneratorFunction(function $__15() {
      var $__16,
          $__17;
      return $traceurRuntime.createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__16 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__17 = $__16[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__17.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__17.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__17.value;
            default:
              return $ctx.end();
          }
      }, $__15, this);
    })
  }, {});
  Object.defineProperty(Set.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  Object.defineProperty(Set.prototype, 'keys', {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  function polyfillSet(global) {
    var $__11 = global,
        Object = $__11.Object,
        Symbol = $__11.Symbol;
    if (!global.Set)
      global.Set = Set;
    var setPrototype = global.Set.prototype;
    if (setPrototype.values) {
      maybeAddIterator(setPrototype, setPrototype.values, Symbol);
      maybeAddIterator(Object.getPrototypeOf(new global.Set().values()), function() {
        return this;
      }, Symbol);
    }
  }
  registerPolyfill(polyfillSet);
  return {
    get Set() {
      return Set;
    },
    get polyfillSet() {
      return polyfillSet;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Set.js" + '');
System.registerModule("traceur-runtime@0.0.87/node_modules/rsvp/lib/rsvp/asap.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/node_modules/rsvp/lib/rsvp/asap.js";
  var len = 0;
  function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      scheduleFlush();
    }
  }
  var $__default = asap;
  var browserGlobal = (typeof window !== 'undefined') ? window : {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
  function useNextTick() {
    return function() {
      process.nextTick(flush);
    };
  }
  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, {characterData: true});
    return function() {
      node.data = (iterations = ++iterations % 2);
    };
  }
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function() {
      channel.port2.postMessage(0);
    };
  }
  function useSetTimeout() {
    return function() {
      setTimeout(flush, 1);
    };
  }
  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];
      callback(arg);
      queue[i] = undefined;
      queue[i + 1] = undefined;
    }
    len = 0;
  }
  var scheduleFlush;
  if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else {
    scheduleFlush = useSetTimeout();
  }
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Promise.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Promise.js";
  var async = System.get("traceur-runtime@0.0.87/node_modules/rsvp/lib/rsvp/asap.js").default;
  var registerPolyfill = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js").registerPolyfill;
  var promiseRaw = {};
  function isPromise(x) {
    return x && typeof x === 'object' && x.status_ !== undefined;
  }
  function idResolveHandler(x) {
    return x;
  }
  function idRejectHandler(x) {
    throw x;
  }
  function chain(promise) {
    var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
    var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
    var deferred = getDeferred(promise.constructor);
    switch (promise.status_) {
      case undefined:
        throw TypeError;
      case 0:
        promise.onResolve_.push(onResolve, deferred);
        promise.onReject_.push(onReject, deferred);
        break;
      case +1:
        promiseEnqueue(promise.value_, [onResolve, deferred]);
        break;
      case -1:
        promiseEnqueue(promise.value_, [onReject, deferred]);
        break;
    }
    return deferred.promise;
  }
  function getDeferred(C) {
    if (this === $Promise) {
      var promise = promiseInit(new $Promise(promiseRaw));
      return {
        promise: promise,
        resolve: (function(x) {
          promiseResolve(promise, x);
        }),
        reject: (function(r) {
          promiseReject(promise, r);
        })
      };
    } else {
      var result = {};
      result.promise = new C((function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
      }));
      return result;
    }
  }
  function promiseSet(promise, status, value, onResolve, onReject) {
    promise.status_ = status;
    promise.value_ = value;
    promise.onResolve_ = onResolve;
    promise.onReject_ = onReject;
    return promise;
  }
  function promiseInit(promise) {
    return promiseSet(promise, 0, undefined, [], []);
  }
  var Promise = function Promise(resolver) {
    if (resolver === promiseRaw)
      return ;
    if (typeof resolver !== 'function')
      throw new TypeError;
    var promise = promiseInit(this);
    try {
      resolver((function(x) {
        promiseResolve(promise, x);
      }), (function(r) {
        promiseReject(promise, r);
      }));
    } catch (e) {
      promiseReject(promise, e);
    }
  };
  ($traceurRuntime.createClass)(Promise, {
    catch: function(onReject) {
      return this.then(undefined, onReject);
    },
    then: function(onResolve, onReject) {
      if (typeof onResolve !== 'function')
        onResolve = idResolveHandler;
      if (typeof onReject !== 'function')
        onReject = idRejectHandler;
      var that = this;
      var constructor = this.constructor;
      return chain(this, function(x) {
        x = promiseCoerce(constructor, x);
        return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
      }, onReject);
    }
  }, {
    resolve: function(x) {
      if (this === $Promise) {
        if (isPromise(x)) {
          return x;
        }
        return promiseSet(new $Promise(promiseRaw), +1, x);
      } else {
        return new this(function(resolve, reject) {
          resolve(x);
        });
      }
    },
    reject: function(r) {
      if (this === $Promise) {
        return promiseSet(new $Promise(promiseRaw), -1, r);
      } else {
        return new this((function(resolve, reject) {
          reject(r);
        }));
      }
    },
    all: function(values) {
      var deferred = getDeferred(this);
      var resolutions = [];
      try {
        var makeCountdownFunction = function(i) {
          return (function(x) {
            resolutions[i] = x;
            if (--count === 0)
              deferred.resolve(resolutions);
          });
        };
        var count = 0;
        var i = 0;
        var $__6 = true;
        var $__7 = false;
        var $__8 = undefined;
        try {
          for (var $__4 = void 0,
              $__3 = (values)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
            var value = $__4.value;
            {
              var countdownFunction = makeCountdownFunction(i);
              this.resolve(value).then(countdownFunction, (function(r) {
                deferred.reject(r);
              }));
              ++i;
              ++count;
            }
          }
        } catch ($__9) {
          $__7 = true;
          $__8 = $__9;
        } finally {
          try {
            if (!$__6 && $__3.return != null) {
              $__3.return();
            }
          } finally {
            if ($__7) {
              throw $__8;
            }
          }
        }
        if (count === 0) {
          deferred.resolve(resolutions);
        }
      } catch (e) {
        deferred.reject(e);
      }
      return deferred.promise;
    },
    race: function(values) {
      var deferred = getDeferred(this);
      try {
        for (var i = 0; i < values.length; i++) {
          this.resolve(values[i]).then((function(x) {
            deferred.resolve(x);
          }), (function(r) {
            deferred.reject(r);
          }));
        }
      } catch (e) {
        deferred.reject(e);
      }
      return deferred.promise;
    }
  });
  var $Promise = Promise;
  var $PromiseReject = $Promise.reject;
  function promiseResolve(promise, x) {
    promiseDone(promise, +1, x, promise.onResolve_);
  }
  function promiseReject(promise, r) {
    promiseDone(promise, -1, r, promise.onReject_);
  }
  function promiseDone(promise, status, value, reactions) {
    if (promise.status_ !== 0)
      return ;
    promiseEnqueue(value, reactions);
    promiseSet(promise, status, value);
  }
  function promiseEnqueue(value, tasks) {
    async((function() {
      for (var i = 0; i < tasks.length; i += 2) {
        promiseHandle(value, tasks[i], tasks[i + 1]);
      }
    }));
  }
  function promiseHandle(value, handler, deferred) {
    try {
      var result = handler(value);
      if (result === deferred.promise)
        throw new TypeError;
      else if (isPromise(result))
        chain(result, deferred.resolve, deferred.reject);
      else
        deferred.resolve(result);
    } catch (e) {
      try {
        deferred.reject(e);
      } catch (e) {}
    }
  }
  var thenableSymbol = '@@thenable';
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function promiseCoerce(constructor, x) {
    if (!isPromise(x) && isObject(x)) {
      var then;
      try {
        then = x.then;
      } catch (r) {
        var promise = $PromiseReject.call(constructor, r);
        x[thenableSymbol] = promise;
        return promise;
      }
      if (typeof then === 'function') {
        var p = x[thenableSymbol];
        if (p) {
          return p;
        } else {
          var deferred = getDeferred(constructor);
          x[thenableSymbol] = deferred.promise;
          try {
            then.call(x, deferred.resolve, deferred.reject);
          } catch (r) {
            deferred.reject(r);
          }
          return deferred.promise;
        }
      }
    }
    return x;
  }
  function polyfillPromise(global) {
    if (!global.Promise)
      global.Promise = Promise;
  }
  registerPolyfill(polyfillPromise);
  return {
    get Promise() {
      return Promise;
    },
    get polyfillPromise() {
      return polyfillPromise;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Promise.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/StringIterator.js", [], function() {
  "use strict";
  var $__2;
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/StringIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      createIteratorResultObject = $__0.createIteratorResultObject,
      isObject = $__0.isObject;
  var toProperty = $traceurRuntime.toProperty;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var iteratedString = Symbol('iteratedString');
  var stringIteratorNextIndex = Symbol('stringIteratorNextIndex');
  var StringIterator = function StringIterator() {
    ;
  };
  ($traceurRuntime.createClass)(StringIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
    value: function() {
      var o = this;
      if (!isObject(o) || !hasOwnProperty.call(o, iteratedString)) {
        throw new TypeError('this must be a StringIterator object');
      }
      var s = o[toProperty(iteratedString)];
      if (s === undefined) {
        return createIteratorResultObject(undefined, true);
      }
      var position = o[toProperty(stringIteratorNextIndex)];
      var len = s.length;
      if (position >= len) {
        o[toProperty(iteratedString)] = undefined;
        return createIteratorResultObject(undefined, true);
      }
      var first = s.charCodeAt(position);
      var resultString;
      if (first < 0xD800 || first > 0xDBFF || position + 1 === len) {
        resultString = String.fromCharCode(first);
      } else {
        var second = s.charCodeAt(position + 1);
        if (second < 0xDC00 || second > 0xDFFF) {
          resultString = String.fromCharCode(first);
        } else {
          resultString = String.fromCharCode(first) + String.fromCharCode(second);
        }
      }
      o[toProperty(stringIteratorNextIndex)] = position + resultString.length;
      return createIteratorResultObject(resultString, false);
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), Object.defineProperty($__2, Symbol.iterator, {
    value: function() {
      return this;
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), $__2), {});
  function createStringIterator(string) {
    var s = String(string);
    var iterator = Object.create(StringIterator.prototype);
    iterator[toProperty(iteratedString)] = s;
    iterator[toProperty(stringIteratorNextIndex)] = 0;
    return iterator;
  }
  return {get createStringIterator() {
      return createStringIterator;
    }};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/String.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/String.js";
  var createStringIterator = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/StringIterator.js").createStringIterator;
  var $__1 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill;
  var $toString = Object.prototype.toString;
  var $indexOf = String.prototype.indexOf;
  var $lastIndexOf = String.prototype.lastIndexOf;
  function startsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (isNaN(pos)) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    return $indexOf.call(string, searchString, pos) == start;
  }
  function endsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var pos = stringLength;
    if (arguments.length > 1) {
      var position = arguments[1];
      if (position !== undefined) {
        pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
          pos = 0;
        }
      }
    }
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchLength;
    if (start < 0) {
      return false;
    }
    return $lastIndexOf.call(string, searchString, start) == start;
  }
  function includes(search) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    if (search && $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (pos != pos) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    if (searchLength + start > stringLength) {
      return false;
    }
    return $indexOf.call(string, searchString, pos) != -1;
  }
  function repeat(count) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var n = count ? Number(count) : 0;
    if (isNaN(n)) {
      n = 0;
    }
    if (n < 0 || n == Infinity) {
      throw RangeError();
    }
    if (n == 0) {
      return '';
    }
    var result = '';
    while (n--) {
      result += string;
    }
    return result;
  }
  function codePointAt(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= size) {
      return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
    return first;
  }
  function raw(callsite) {
    var raw = callsite.raw;
    var len = raw.length >>> 0;
    if (len === 0)
      return '';
    var s = '';
    var i = 0;
    while (true) {
      s += raw[i];
      if (i + 1 === len)
        return s;
      s += arguments[++i];
    }
  }
  function fromCodePoint(_) {
    var codeUnits = [];
    var floor = Math.floor;
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
      return '';
    }
    while (++index < length) {
      var codePoint = Number(arguments[index]);
      if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
      if (codePoint <= 0xFFFF) {
        codeUnits.push(codePoint);
      } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xD800;
        lowSurrogate = (codePoint % 0x400) + 0xDC00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
    }
    return String.fromCharCode.apply(null, codeUnits);
  }
  function stringPrototypeIterator() {
    var o = $traceurRuntime.checkObjectCoercible(this);
    var s = String(o);
    return createStringIterator(s);
  }
  function polyfillString(global) {
    var String = global.String;
    maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
    maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
    maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
  }
  registerPolyfill(polyfillString);
  return {
    get startsWith() {
      return startsWith;
    },
    get endsWith() {
      return endsWith;
    },
    get includes() {
      return includes;
    },
    get repeat() {
      return repeat;
    },
    get codePointAt() {
      return codePointAt;
    },
    get raw() {
      return raw;
    },
    get fromCodePoint() {
      return fromCodePoint;
    },
    get stringPrototypeIterator() {
      return stringPrototypeIterator;
    },
    get polyfillString() {
      return polyfillString;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/String.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/ArrayIterator.js", [], function() {
  "use strict";
  var $__2;
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/ArrayIterator.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      toObject = $__0.toObject,
      toUint32 = $__0.toUint32,
      createIteratorResultObject = $__0.createIteratorResultObject;
  var ARRAY_ITERATOR_KIND_KEYS = 1;
  var ARRAY_ITERATOR_KIND_VALUES = 2;
  var ARRAY_ITERATOR_KIND_ENTRIES = 3;
  var ArrayIterator = function ArrayIterator() {
    ;
  };
  ($traceurRuntime.createClass)(ArrayIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
    value: function() {
      var iterator = toObject(this);
      var array = iterator.iteratorObject_;
      if (!array) {
        throw new TypeError('Object is not an ArrayIterator');
      }
      var index = iterator.arrayIteratorNextIndex_;
      var itemKind = iterator.arrayIterationKind_;
      var length = toUint32(array.length);
      if (index >= length) {
        iterator.arrayIteratorNextIndex_ = Infinity;
        return createIteratorResultObject(undefined, true);
      }
      iterator.arrayIteratorNextIndex_ = index + 1;
      if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
        return createIteratorResultObject(array[index], false);
      if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
        return createIteratorResultObject([index, array[index]], false);
      return createIteratorResultObject(index, false);
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), Object.defineProperty($__2, Symbol.iterator, {
    value: function() {
      return this;
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), $__2), {});
  function createArrayIterator(array, kind) {
    var object = toObject(array);
    var iterator = new ArrayIterator;
    iterator.iteratorObject_ = object;
    iterator.arrayIteratorNextIndex_ = 0;
    iterator.arrayIterationKind_ = kind;
    return iterator;
  }
  function entries() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
  }
  function keys() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
  }
  function values() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
  }
  return {
    get entries() {
      return entries;
    },
    get keys() {
      return keys;
    },
    get values() {
      return values;
    }
  };
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Array.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Array.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/ArrayIterator.js"),
      entries = $__0.entries,
      keys = $__0.keys,
      jsValues = $__0.values;
  var $__1 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      checkIterable = $__1.checkIterable,
      isCallable = $__1.isCallable,
      isConstructor = $__1.isConstructor,
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill,
      toInteger = $__1.toInteger,
      toLength = $__1.toLength,
      toObject = $__1.toObject;
  function from(arrLike) {
    var mapFn = arguments[1];
    var thisArg = arguments[2];
    var C = this;
    var items = toObject(arrLike);
    var mapping = mapFn !== undefined;
    var k = 0;
    var arr,
        len;
    if (mapping && !isCallable(mapFn)) {
      throw TypeError();
    }
    if (checkIterable(items)) {
      arr = isConstructor(C) ? new C() : [];
      var $__5 = true;
      var $__6 = false;
      var $__7 = undefined;
      try {
        for (var $__3 = void 0,
            $__2 = (items)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
          var item = $__3.value;
          {
            if (mapping) {
              arr[k] = mapFn.call(thisArg, item, k);
            } else {
              arr[k] = item;
            }
            k++;
          }
        }
      } catch ($__8) {
        $__6 = true;
        $__7 = $__8;
      } finally {
        try {
          if (!$__5 && $__2.return != null) {
            $__2.return();
          }
        } finally {
          if ($__6) {
            throw $__7;
          }
        }
      }
      arr.length = k;
      return arr;
    }
    len = toLength(items.length);
    arr = isConstructor(C) ? new C(len) : new Array(len);
    for (; k < len; k++) {
      if (mapping) {
        arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
      } else {
        arr[k] = items[k];
      }
    }
    arr.length = len;
    return arr;
  }
  function of() {
    for (var items = [],
        $__9 = 0; $__9 < arguments.length; $__9++)
      items[$__9] = arguments[$__9];
    var C = this;
    var len = items.length;
    var arr = isConstructor(C) ? new C(len) : new Array(len);
    for (var k = 0; k < len; k++) {
      arr[k] = items[k];
    }
    arr.length = len;
    return arr;
  }
  function fill(value) {
    var start = arguments[1] !== (void 0) ? arguments[1] : 0;
    var end = arguments[2];
    var object = toObject(this);
    var len = toLength(object.length);
    var fillStart = toInteger(start);
    var fillEnd = end !== undefined ? toInteger(end) : len;
    fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
    fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
    while (fillStart < fillEnd) {
      object[fillStart] = value;
      fillStart++;
    }
    return object;
  }
  function find(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg);
  }
  function findIndex(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg, true);
  }
  function findHelper(self, predicate) {
    var thisArg = arguments[2];
    var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
    var object = toObject(self);
    var len = toLength(object.length);
    if (!isCallable(predicate)) {
      throw TypeError();
    }
    for (var i = 0; i < len; i++) {
      var value = object[i];
      if (predicate.call(thisArg, value, i, object)) {
        return returnIndex ? i : value;
      }
    }
    return returnIndex ? -1 : undefined;
  }
  function polyfillArray(global) {
    var $__10 = global,
        Array = $__10.Array,
        Object = $__10.Object,
        Symbol = $__10.Symbol;
    var values = jsValues;
    if (Symbol && Symbol.iterator && Array.prototype[Symbol.iterator]) {
      values = Array.prototype[Symbol.iterator];
    }
    maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
    maybeAddFunctions(Array, ['from', from, 'of', of]);
    maybeAddIterator(Array.prototype, values, Symbol);
    maybeAddIterator(Object.getPrototypeOf([].values()), function() {
      return this;
    }, Symbol);
  }
  registerPolyfill(polyfillArray);
  return {
    get from() {
      return from;
    },
    get of() {
      return of;
    },
    get fill() {
      return fill;
    },
    get find() {
      return find;
    },
    get findIndex() {
      return findIndex;
    },
    get polyfillArray() {
      return polyfillArray;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Array.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Object.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Object.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill;
  var $__1 = $traceurRuntime,
      defineProperty = $__1.defineProperty,
      getOwnPropertyDescriptor = $__1.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      isPrivateName = $__1.isPrivateName,
      keys = $__1.keys;
  function is(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    return left !== left && right !== right;
  }
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      var props = source == null ? [] : keys(source);
      var p = void 0,
          length = props.length;
      for (p = 0; p < length; p++) {
        var name = props[p];
        if (isPrivateName(name))
          continue;
        target[name] = source[name];
      }
    }
    return target;
  }
  function mixin(target, source) {
    var props = getOwnPropertyNames(source);
    var p,
        descriptor,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      if (isPrivateName(name))
        continue;
      descriptor = getOwnPropertyDescriptor(source, props[p]);
      defineProperty(target, props[p], descriptor);
    }
    return target;
  }
  function polyfillObject(global) {
    var Object = global.Object;
    maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
  }
  registerPolyfill(polyfillObject);
  return {
    get is() {
      return is;
    },
    get assign() {
      return assign;
    },
    get mixin() {
      return mixin;
    },
    get polyfillObject() {
      return polyfillObject;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Object.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Number.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Number.js";
  var $__0 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      isNumber = $__0.isNumber,
      maybeAddConsts = $__0.maybeAddConsts,
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill,
      toInteger = $__0.toInteger;
  var $abs = Math.abs;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
  var EPSILON = Math.pow(2, -52);
  function NumberIsFinite(number) {
    return isNumber(number) && $isFinite(number);
  }
  ;
  function isInteger(number) {
    return NumberIsFinite(number) && toInteger(number) === number;
  }
  function NumberIsNaN(number) {
    return isNumber(number) && $isNaN(number);
  }
  ;
  function isSafeInteger(number) {
    if (NumberIsFinite(number)) {
      var integral = toInteger(number);
      if (integral === number)
        return $abs(integral) <= MAX_SAFE_INTEGER;
    }
    return false;
  }
  function polyfillNumber(global) {
    var Number = global.Number;
    maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
    maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
  }
  registerPolyfill(polyfillNumber);
  return {
    get MAX_SAFE_INTEGER() {
      return MAX_SAFE_INTEGER;
    },
    get MIN_SAFE_INTEGER() {
      return MIN_SAFE_INTEGER;
    },
    get EPSILON() {
      return EPSILON;
    },
    get isFinite() {
      return NumberIsFinite;
    },
    get isInteger() {
      return isInteger;
    },
    get isNaN() {
      return NumberIsNaN;
    },
    get isSafeInteger() {
      return isSafeInteger;
    },
    get polyfillNumber() {
      return polyfillNumber;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Number.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/fround.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/fround.js";
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__0 = Math,
      LN2 = $__0.LN2,
      abs = $__0.abs,
      floor = $__0.floor,
      log = $__0.log,
      min = $__0.min,
      pow = $__0.pow;
  function packIEEE754(v, ebits, fbits) {
    var bias = (1 << (ebits - 1)) - 1,
        s,
        e,
        f,
        ln,
        i,
        bits,
        str,
        bytes;
    function roundToEven(n) {
      var w = floor(n),
          f = n - w;
      if (f < 0.5)
        return w;
      if (f > 0.5)
        return w + 1;
      return w % 2 ? w + 1 : w;
    }
    if (v !== v) {
      e = (1 << ebits) - 1;
      f = pow(2, fbits - 1);
      s = 0;
    } else if (v === Infinity || v === -Infinity) {
      e = (1 << ebits) - 1;
      f = 0;
      s = (v < 0) ? 1 : 0;
    } else if (v === 0) {
      e = 0;
      f = 0;
      s = (1 / v === -Infinity) ? 1 : 0;
    } else {
      s = v < 0;
      v = abs(v);
      if (v >= pow(2, 1 - bias)) {
        e = min(floor(log(v) / LN2), 1023);
        f = roundToEven(v / pow(2, e) * pow(2, fbits));
        if (f / pow(2, fbits) >= 2) {
          e = e + 1;
          f = 1;
        }
        if (e > bias) {
          e = (1 << ebits) - 1;
          f = 0;
        } else {
          e = e + bias;
          f = f - pow(2, fbits);
        }
      } else {
        e = 0;
        f = roundToEven(v / pow(2, 1 - bias - fbits));
      }
    }
    bits = [];
    for (i = fbits; i; i -= 1) {
      bits.push(f % 2 ? 1 : 0);
      f = floor(f / 2);
    }
    for (i = ebits; i; i -= 1) {
      bits.push(e % 2 ? 1 : 0);
      e = floor(e / 2);
    }
    bits.push(s ? 1 : 0);
    bits.reverse();
    str = bits.join('');
    bytes = [];
    while (str.length) {
      bytes.push(parseInt(str.substring(0, 8), 2));
      str = str.substring(8);
    }
    return bytes;
  }
  function unpackIEEE754(bytes, ebits, fbits) {
    var bits = [],
        i,
        j,
        b,
        str,
        bias,
        s,
        e,
        f;
    for (i = bytes.length; i; i -= 1) {
      b = bytes[i - 1];
      for (j = 8; j; j -= 1) {
        bits.push(b % 2 ? 1 : 0);
        b = b >> 1;
      }
    }
    bits.reverse();
    str = bits.join('');
    bias = (1 << (ebits - 1)) - 1;
    s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
    e = parseInt(str.substring(1, 1 + ebits), 2);
    f = parseInt(str.substring(1 + ebits), 2);
    if (e === (1 << ebits) - 1) {
      return f !== 0 ? NaN : s * Infinity;
    } else if (e > 0) {
      return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
    } else if (f !== 0) {
      return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
    } else {
      return s < 0 ? -0 : 0;
    }
  }
  function unpackF32(b) {
    return unpackIEEE754(b, 8, 23);
  }
  function packF32(v) {
    return packIEEE754(v, 8, 23);
  }
  function fround(x) {
    if (x === 0 || !$isFinite(x) || $isNaN(x)) {
      return x;
    }
    return unpackF32(packF32(Number(x)));
  }
  return {get fround() {
      return fround;
    }};
});
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/Math.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/Math.js";
  var jsFround = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/fround.js").fround;
  var $__1 = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      registerPolyfill = $__1.registerPolyfill,
      toUint32 = $__1.toUint32;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__2 = Math,
      abs = $__2.abs,
      ceil = $__2.ceil,
      exp = $__2.exp,
      floor = $__2.floor,
      log = $__2.log,
      pow = $__2.pow,
      sqrt = $__2.sqrt;
  function clz32(x) {
    x = toUint32(+x);
    if (x == 0)
      return 32;
    var result = 0;
    if ((x & 0xFFFF0000) === 0) {
      x <<= 16;
      result += 16;
    }
    ;
    if ((x & 0xFF000000) === 0) {
      x <<= 8;
      result += 8;
    }
    ;
    if ((x & 0xF0000000) === 0) {
      x <<= 4;
      result += 4;
    }
    ;
    if ((x & 0xC0000000) === 0) {
      x <<= 2;
      result += 2;
    }
    ;
    if ((x & 0x80000000) === 0) {
      x <<= 1;
      result += 1;
    }
    ;
    return result;
  }
  function imul(x, y) {
    x = toUint32(+x);
    y = toUint32(+y);
    var xh = (x >>> 16) & 0xffff;
    var xl = x & 0xffff;
    var yh = (y >>> 16) & 0xffff;
    var yl = y & 0xffff;
    return xl * yl + (((xh * yl + xl * yh) << 16) >>> 0) | 0;
  }
  function sign(x) {
    x = +x;
    if (x > 0)
      return 1;
    if (x < 0)
      return -1;
    return x;
  }
  function log10(x) {
    return log(x) * 0.434294481903251828;
  }
  function log2(x) {
    return log(x) * 1.442695040888963407;
  }
  function log1p(x) {
    x = +x;
    if (x < -1 || $isNaN(x)) {
      return NaN;
    }
    if (x === 0 || x === Infinity) {
      return x;
    }
    if (x === -1) {
      return -Infinity;
    }
    var result = 0;
    var n = 50;
    if (x < 0 || x > 1) {
      return log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        result -= pow(x, i) / i;
      } else {
        result += pow(x, i) / i;
      }
    }
    return result;
  }
  function expm1(x) {
    x = +x;
    if (x === -Infinity) {
      return -1;
    }
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return exp(x) - 1;
  }
  function cosh(x) {
    x = +x;
    if (x === 0) {
      return 1;
    }
    if ($isNaN(x)) {
      return NaN;
    }
    if (!$isFinite(x)) {
      return Infinity;
    }
    if (x < 0) {
      x = -x;
    }
    if (x > 21) {
      return exp(x) / 2;
    }
    return (exp(x) + exp(-x)) / 2;
  }
  function sinh(x) {
    x = +x;
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return (exp(x) - exp(-x)) / 2;
  }
  function tanh(x) {
    x = +x;
    if (x === 0)
      return x;
    if (!$isFinite(x))
      return sign(x);
    var exp1 = exp(x);
    var exp2 = exp(-x);
    return (exp1 - exp2) / (exp1 + exp2);
  }
  function acosh(x) {
    x = +x;
    if (x < 1)
      return NaN;
    if (!$isFinite(x))
      return x;
    return log(x + sqrt(x + 1) * sqrt(x - 1));
  }
  function asinh(x) {
    x = +x;
    if (x === 0 || !$isFinite(x))
      return x;
    if (x > 0)
      return log(x + sqrt(x * x + 1));
    return -log(-x + sqrt(x * x + 1));
  }
  function atanh(x) {
    x = +x;
    if (x === -1) {
      return -Infinity;
    }
    if (x === 1) {
      return Infinity;
    }
    if (x === 0) {
      return x;
    }
    if ($isNaN(x) || x < -1 || x > 1) {
      return NaN;
    }
    return 0.5 * log((1 + x) / (1 - x));
  }
  function hypot(x, y) {
    var length = arguments.length;
    var args = new Array(length);
    var max = 0;
    for (var i = 0; i < length; i++) {
      var n = arguments[i];
      n = +n;
      if (n === Infinity || n === -Infinity)
        return Infinity;
      n = abs(n);
      if (n > max)
        max = n;
      args[i] = n;
    }
    if (max === 0)
      max = 1;
    var sum = 0;
    var compensation = 0;
    for (var i = 0; i < length; i++) {
      var n = args[i] / max;
      var summand = n * n - compensation;
      var preliminary = sum + summand;
      compensation = (preliminary - sum) - summand;
      sum = preliminary;
    }
    return sqrt(sum) * max;
  }
  function trunc(x) {
    x = +x;
    if (x > 0)
      return floor(x);
    if (x < 0)
      return ceil(x);
    return x;
  }
  var fround,
      f32;
  if (typeof Float32Array === 'function') {
    f32 = new Float32Array(1);
    fround = function(x) {
      f32[0] = Number(x);
      return f32[0];
    };
  } else {
    fround = jsFround;
  }
  ;
  function cbrt(x) {
    x = +x;
    if (x === 0)
      return x;
    var negate = x < 0;
    if (negate)
      x = -x;
    var result = pow(x, 1 / 3);
    return negate ? -result : result;
  }
  function polyfillMath(global) {
    var Math = global.Math;
    maybeAddFunctions(Math, ['acosh', acosh, 'asinh', asinh, 'atanh', atanh, 'cbrt', cbrt, 'clz32', clz32, 'cosh', cosh, 'expm1', expm1, 'fround', fround, 'hypot', hypot, 'imul', imul, 'log10', log10, 'log1p', log1p, 'log2', log2, 'sign', sign, 'sinh', sinh, 'tanh', tanh, 'trunc', trunc]);
  }
  registerPolyfill(polyfillMath);
  return {
    get clz32() {
      return clz32;
    },
    get imul() {
      return imul;
    },
    get sign() {
      return sign;
    },
    get log10() {
      return log10;
    },
    get log2() {
      return log2;
    },
    get log1p() {
      return log1p;
    },
    get expm1() {
      return expm1;
    },
    get cosh() {
      return cosh;
    },
    get sinh() {
      return sinh;
    },
    get tanh() {
      return tanh;
    },
    get acosh() {
      return acosh;
    },
    get asinh() {
      return asinh;
    },
    get atanh() {
      return atanh;
    },
    get hypot() {
      return hypot;
    },
    get trunc() {
      return trunc;
    },
    get fround() {
      return fround;
    },
    get cbrt() {
      return cbrt;
    },
    get polyfillMath() {
      return polyfillMath;
    }
  };
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/Math.js" + '');
System.registerModule("traceur-runtime@0.0.87/src/runtime/polyfills/polyfills.js", [], function() {
  "use strict";
  var __moduleName = "traceur-runtime@0.0.87/src/runtime/polyfills/polyfills.js";
  var polyfillAll = System.get("traceur-runtime@0.0.87/src/runtime/polyfills/utils.js").polyfillAll;
  polyfillAll(Reflect.global);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
    polyfillAll(global);
  };
  return {};
});
System.get("traceur-runtime@0.0.87/src/runtime/polyfills/polyfills.js" + '');

(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  function dedupe(deps) {
    var newDeps = [];
    for (var i = 0, l = deps.length; i < l; i++)
      if (indexOf.call(newDeps, deps[i]) == -1)
        newDeps.push(deps[i])
    return newDeps;
  }

  function register(name, deps, declare, execute) {
    if (typeof name != 'string')
      throw "System.register provided no module name";

    var entry;

    // dynamic
    if (typeof declare == 'boolean') {
      entry = {
        declarative: false,
        deps: deps,
        execute: execute,
        executingRequire: declare
      };
    }
    else {
      // ES6 declarative
      entry = {
        declarative: true,
        deps: deps,
        declare: declare
      };
    }

    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry; 

    entry.deps = dedupe(entry.deps);

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }

  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;
      exports[name] = value;

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          var importerIndex = indexOf.call(importerModule.dependencies, module);
          importerModule.setters[importerIndex](exports);
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    if (!module.setters || !module.execute)
      throw new TypeError("Invalid System.register form for " + entry.name);

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = { 'default': depEntry.module.exports, __useDefault: true };
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    var module = entry.module.exports;

    if (!module || !entry.declarative && module.__esModule !== true)
      module = { 'default': module, __useDefault: true };

    // return the defined module object
    return modules[name] = module;
  };

  return function(mains, declare) {

    var System;
    var System = {
      register: register, 
      get: load, 
      set: function(name, module) {
        modules[name] = module; 
      },
      newModule: function(module) {
        return module;
      },
      global: global 
    };
    System.set('@empty', {});

    declare(System);

    for (var i = 0; i < mains.length; i++)
      load(mains[i]);
  }

})(typeof window != 'undefined' ? window : global)
/* (['mainModule'], function(System) {
  System.register(...);
}); */

(['src/js/main'], function(System) {

(function() {
function define(){};  define.amd = {};
(function(a) {
  function b(a) {
    for (var b = a.length,
        c = new Array(b),
        d = 0; b > d; d++)
      c[d] = a[d];
    return c;
  }
  function c(a, b) {
    if (ka && b.stack && "object" == typeof a && null !== a && a.stack && -1 === a.stack.indexOf(oa)) {
      for (var c = [],
          e = b; e; e = e.source)
        e.stack && c.unshift(e.stack);
      c.unshift(a.stack);
      var f = c.join("\n" + oa + "\n");
      a.stack = d(f);
    }
  }
  function d(a) {
    for (var b = a.split("\n"),
        c = [],
        d = 0,
        g = b.length; g > d; d++) {
      var h = b[d];
      e(h) || f(h) || !h || c.push(h);
    }
    return c.join("\n");
  }
  function e(a) {
    var b = h(a);
    if (!b)
      return !1;
    var c = b[0],
        d = b[1];
    return c === ma && d >= na && Bc >= d;
  }
  function f(a) {
    return -1 !== a.indexOf("(module.js:") || -1 !== a.indexOf("(node.js:");
  }
  function g() {
    if (ka)
      try {
        throw new Error;
      } catch (a) {
        var b = a.stack.split("\n"),
            c = b[0].indexOf("@") > 0 ? b[1] : b[2],
            d = h(c);
        if (!d)
          return ;
        return ma = d[0], d[1];
      }
  }
  function h(a) {
    var b = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(a);
    if (b)
      return [b[1], Number(b[2])];
    var c = /at ([^ ]+):(\d+):(?:\d+)$/.exec(a);
    if (c)
      return [c[1], Number(c[2])];
    var d = /.*@(.+):(\d+)$/.exec(a);
    return d ? [d[1], Number(d[2])] : void 0;
  }
  function i(a) {
    var b = [];
    if (!Xa(a))
      return b;
    Wa.nonEnumArgs && a.length && Ya(a) && (a = ab.call(a));
    var c = Wa.enumPrototypes && "function" == typeof a,
        d = Wa.enumErrorProps && (a === Ra || a instanceof Error);
    for (var e in a)
      c && "prototype" == e || d && ("message" == e || "name" == e) || b.push(e);
    if (Wa.nonEnumShadows && a !== Sa) {
      var f = a.constructor,
          g = -1,
          h = Da;
      if (a === (f && f.prototype))
        var i = a === Ta ? Na : a === Ra ? Ia : Oa.call(a),
            j = Va[i];
      for (; ++g < h; )
        e = Ca[g], j && j[e] || !Pa.call(a, e) || b.push(e);
    }
    return b;
  }
  function j(a, b, c) {
    for (var d = -1,
        e = c(a),
        f = e.length; ++d < f; ) {
      var g = e[d];
      if (b(a[g], g, a) === !1)
        break;
    }
    return a;
  }
  function k(a, b) {
    return j(a, b, i);
  }
  function l(a) {
    return "function" != typeof a.toString && "string" == typeof(a + "");
  }
  function m(a, b, c, d) {
    if (a === b)
      return 0 !== a || 1 / a == 1 / b;
    var e = typeof a,
        f = typeof b;
    if (a === a && (null == a || null == b || "function" != e && "object" != e && "function" != f && "object" != f))
      return !1;
    var g = Oa.call(a),
        h = Oa.call(b);
    if (g == Ea && (g = La), h == Ea && (h = La), g != h)
      return !1;
    switch (g) {
      case Ga:
      case Ha:
        return +a == +b;
      case Ka:
        return a != +a ? b != +b : 0 == a ? 1 / a == 1 / b : a == +b;
      case Ma:
      case Na:
        return a == String(b);
    }
    var i = g == Fa;
    if (!i) {
      if (g != La || !Wa.nodeClass && (l(a) || l(b)))
        return !1;
      var j = !Wa.argsObject && Ya(a) ? Object : a.constructor,
          n = !Wa.argsObject && Ya(b) ? Object : b.constructor;
      if (!(j == n || Pa.call(a, "constructor") && Pa.call(b, "constructor") || ja(j) && j instanceof j && ja(n) && n instanceof n || !("constructor" in a && "constructor" in b)))
        return !1;
    }
    c || (c = []), d || (d = []);
    for (var o = c.length; o--; )
      if (c[o] == a)
        return d[o] == b;
    var p = 0,
        q = !0;
    if (c.push(a), d.push(b), i) {
      if (o = a.length, p = b.length, q = p == o)
        for (; p--; ) {
          var r = b[p];
          if (!(q = m(a[p], r, c, d)))
            break;
        }
    } else
      k(b, function(b, e, f) {
        return Pa.call(f, e) ? (p++, q = Pa.call(a, e) && m(a[e], b, c, d)) : void 0;
      }), q && k(a, function(a, b, c) {
        return Pa.call(c, b) ? q = --p > -1 : void 0;
      });
    return c.pop(), d.pop(), q;
  }
  function n() {
    try {
      return Za.apply(this, arguments);
    } catch (a) {
      return _a.e = a, _a;
    }
  }
  function o(a) {
    if (!ja(a))
      throw new TypeError("fn must be a function");
    return Za = a, n;
  }
  function p(a) {
    throw a;
  }
  function q(a, b) {
    for (var c = new Array(a),
        d = 0; a > d; d++)
      c[d] = b();
    return c;
  }
  function r(a, b) {
    this.id = a, this.value = b;
  }
  function t(a) {
    this.observer = a, this.a = [], this.isStopped = !1;
  }
  function u() {
    this._s = s;
  }
  function v() {
    this._s = s, this._l = s.length, this._i = 0;
  }
  function w(a) {
    this._a = a;
  }
  function x(a) {
    this._a = a, this._l = B(a), this._i = 0;
  }
  function y(a) {
    return "number" == typeof a && X.isFinite(a);
  }
  function z(b) {
    var c,
        d = b[wa];
    if (!d && "string" == typeof b)
      return c = new u(b), c[wa]();
    if (!d && b.length !== a)
      return c = new w(b), c[wa]();
    if (!d)
      throw new TypeError("Object is not iterable");
    return b[wa]();
  }
  function A(a) {
    var b = +a;
    return 0 === b ? b : isNaN(b) ? b : 0 > b ? -1 : 1;
  }
  function B(a) {
    var b = +a.length;
    return isNaN(b) ? 0 : 0 !== b && y(b) ? (b = A(b) * Math.floor(Math.abs(b)), 0 >= b ? 0 : b > Ub ? Ub : b) : b;
  }
  function C(a, b) {
    this.observer = a, this.parent = b;
  }
  function D(a, b) {
    return ca(a) || (a = tb), new Wb(b, a);
  }
  function E(a, b) {
    return new tc(function(c) {
      var d = new mb,
          e = new nb;
      return e.setDisposable(d), d.setDisposable(a.subscribe(function(a) {
        c.onNext(a);
      }, function(a) {
        try {
          var d = b(a);
        } catch (f) {
          return c.onError(f);
        }
        ia(d) && (d = mc(d));
        var g = new mb;
        e.setDisposable(g), g.setDisposable(d.subscribe(c));
      }, function(a) {
        c.onCompleted(a);
      })), e;
    }, a);
  }
  function F(a, b) {
    var c = this;
    return new tc(function(d) {
      var e = 0,
          f = a.length;
      return c.subscribe(function(c) {
        if (f > e) {
          var g,
              h = a[e++];
          try {
            g = b(c, h);
          } catch (i) {
            return d.onError(i);
          }
          d.onNext(g);
        } else
          d.onCompleted();
      }, function(a) {
        d.onError(a);
      }, function() {
        d.onCompleted();
      });
    }, c);
  }
  function G() {
    return !1;
  }
  function H() {
    return [];
  }
  function I(a, b, c) {
    var d = Ba(b, c, 3);
    return a.map(function(b, c) {
      var e = d(b, c, a);
      return ia(e) && (e = mc(e)), (za(e) || ya(e)) && (e = Vb(e)), e;
    }).concatAll();
  }
  function J(a, b, c) {
    this.observer = a, this.selector = b, this.source = c, this.i = 0, this.isStopped = !1;
  }
  function K(a, b, c) {
    var d = Ba(b, c, 3);
    return a.map(function(b, c) {
      var e = d(b, c, a);
      return ia(e) && (e = mc(e)), (za(e) || ya(e)) && (e = Vb(e)), e;
    }).mergeAll();
  }
  function L(a, b, c) {
    this.observer = a, this.predicate = b, this.source = c, this.i = 0, this.isStopped = !1;
  }
  function M(a, b, c) {
    if (a.addEventListener)
      return a.addEventListener(b, c, !1), ib(function() {
        a.removeEventListener(b, c, !1);
      });
    throw new Error("No listener found");
  }
  function N(a, b, c) {
    var d = new fb;
    if ("[object NodeList]" === Object.prototype.toString.call(a))
      for (var e = 0,
          f = a.length; f > e; e++)
        d.add(N(a.item(e), b, c));
    else
      a && d.add(M(a, b, c));
    return d;
  }
  function O(a, b) {
    return new tc(function(c) {
      return b.scheduleWithAbsolute(a, function() {
        c.onNext(0), c.onCompleted();
      });
    });
  }
  function P(a, b, c) {
    return new tc(function(d) {
      var e = a,
          f = qb(b);
      return c.scheduleRecursiveWithAbsoluteAndState(0, e, function(a, b) {
        if (f > 0) {
          var g = c.now();
          e += f, g >= e && (e = g + f);
        }
        d.onNext(a), b(a + 1, e);
      });
    });
  }
  function Q(a, b) {
    return new tc(function(c) {
      return b.scheduleWithRelative(qb(a), function() {
        c.onNext(0), c.onCompleted();
      });
    });
  }
  function R(a, b, c) {
    return a === b ? new tc(function(a) {
      return c.schedulePeriodicWithState(0, b, function(b) {
        return a.onNext(b), b + 1;
      });
    }) : Qb(function() {
      return P(c.now() + a, b, c);
    });
  }
  function S(a, b, c) {
    return new tc(function(d) {
      var e,
          f = !1,
          g = new nb,
          h = null,
          i = [],
          j = !1;
      return e = a.materialize().timestamp(c).subscribe(function(a) {
        var e,
            k;
        "E" === a.value.kind ? (i = [], i.push(a), h = a.value.exception, k = !j) : (i.push({
          value: a.value,
          timestamp: a.timestamp + b
        }), k = !f, f = !0), k && (null !== h ? d.onError(h) : (e = new mb, g.setDisposable(e), e.setDisposable(c.scheduleRecursiveWithRelative(b, function(a) {
          var b,
              e,
              g,
              k;
          if (null === h) {
            j = !0;
            do
              g = null, i.length > 0 && i[0].timestamp - c.now() <= 0 && (g = i.shift().value), null !== g && g.accept(d);
 while (null !== g);
            k = !1, e = 0, i.length > 0 ? (k = !0, e = Math.max(0, i[0].timestamp - c.now())) : f = !1, b = h, j = !1, null !== b ? d.onError(b) : k && a(e);
          }
        }))));
      }), new fb(e, g);
    }, a);
  }
  function T(a, b, c) {
    return Qb(function() {
      return S(a, b - c.now(), c);
    });
  }
  function U(a, b) {
    return new tc(function(c) {
      function d() {
        g && (g = !1, c.onNext(f)), e && c.onCompleted();
      }
      var e,
          f,
          g;
      return new fb(a.subscribe(function(a) {
        g = !0, f = a;
      }, c.onError.bind(c), function() {
        e = !0;
      }), b.subscribe(d, c.onError.bind(c), d));
    }, a);
  }
  function V(a, b, c) {
    return new tc(function(d) {
      function e(a, b) {
        j[b] = a;
        var e;
        if (g[b] = !0, h || (h = g.every(da))) {
          if (f)
            return void d.onError(f);
          try {
            e = c.apply(null, j);
          } catch (k) {
            return void d.onError(k);
          }
          d.onNext(e);
        }
        i && j[1] && d.onCompleted();
      }
      var f,
          g = [!1, !1],
          h = !1,
          i = !1,
          j = new Array(2);
      return new fb(a.subscribe(function(a) {
        e(a, 0);
      }, function(a) {
        j[1] ? d.onError(a) : f = a;
      }, function() {
        i = !0, j[1] && d.onCompleted();
      }), b.subscribe(function(a) {
        e(a, 1);
      }, function(a) {
        d.onError(a);
      }, function() {
        i = !0, e(!0, 1);
      }));
    }, a);
  }
  var W = {
    "boolean": !1,
    "function": !0,
    object: !0,
    number: !1,
    string: !1,
    undefined: !1
  },
      X = W[typeof window] && window || this,
      Y = W[typeof exports] && exports && !exports.nodeType && exports,
      Z = W[typeof module] && module && !module.nodeType && module,
      $ = Z && Z.exports === Y && Y,
      _ = W[typeof global] && global;
  !_ || _.global !== _ && _.window !== _ || (X = _);
  var aa = {
    internals: {},
    config: {Promise: X.Promise},
    helpers: {}
  },
      ba = aa.helpers.noop = function() {},
      ca = (aa.helpers.notDefined = function(a) {
        return "undefined" == typeof a;
      }, aa.helpers.isScheduler = function(a) {
        return a instanceof aa.Scheduler;
      }),
      da = aa.helpers.identity = function(a) {
        return a;
      },
      ea = (aa.helpers.pluck = function(a) {
        return function(b) {
          return b[a];
        };
      }, aa.helpers.just = function(a) {
        return function() {
          return a;
        };
      }, aa.helpers.defaultNow = Date.now),
      fa = aa.helpers.defaultComparer = function(a, b) {
        return $a(a, b);
      },
      ga = aa.helpers.defaultSubComparer = function(a, b) {
        return a > b ? 1 : b > a ? -1 : 0;
      },
      ha = (aa.helpers.defaultKeySerializer = function(a) {
        return a.toString();
      }, aa.helpers.defaultError = function(a) {
        throw a;
      }),
      ia = aa.helpers.isPromise = function(a) {
        return !!a && "function" == typeof a.then;
      },
      ja = (aa.helpers.asArray = function() {
        return Array.prototype.slice.call(arguments);
      }, aa.helpers.not = function(a) {
        return !a;
      }, aa.helpers.isFunction = function() {
        var a = function(a) {
          return "function" == typeof a || !1;
        };
        return a(/x/) && (a = function(a) {
          return "function" == typeof a && "[object Function]" == Oa.call(a);
        }), a;
      }());
  aa.config.longStackSupport = !1;
  var ka = !1;
  try {
    throw new Error;
  } catch (la) {
    ka = !!la.stack;
  }
  var ma,
      na = g(),
      oa = "From previous event:",
      pa = aa.EmptyError = function() {
        this.message = "Sequence contains no elements.", Error.call(this);
      };
  pa.prototype = Error.prototype;
  var qa = aa.ObjectDisposedError = function() {
    this.message = "Object has been disposed", Error.call(this);
  };
  qa.prototype = Error.prototype;
  var ra = aa.ArgumentOutOfRangeError = function() {
    this.message = "Argument out of range", Error.call(this);
  };
  ra.prototype = Error.prototype;
  var sa = aa.NotSupportedError = function(a) {
    this.message = a || "This operation is not supported", Error.call(this);
  };
  sa.prototype = Error.prototype;
  var ta = aa.NotImplementedError = function(a) {
    this.message = a || "This operation is not implemented", Error.call(this);
  };
  ta.prototype = Error.prototype;
  var ua = aa.helpers.notImplemented = function() {
    throw new ta;
  },
      va = aa.helpers.notSupported = function() {
        throw new sa;
      },
      wa = "function" == typeof Symbol && Symbol.iterator || "_es6shim_iterator_";
  X.Set && "function" == typeof(new X.Set)["@@iterator"] && (wa = "@@iterator");
  var xa = aa.doneEnumerator = {
    done: !0,
    value: a
  },
      ya = aa.helpers.isIterable = function(b) {
        return b[wa] !== a;
      },
      za = aa.helpers.isArrayLike = function(b) {
        return b && b.length !== a;
      };
  aa.helpers.iterator = wa;
  var Aa,
      Ba = aa.internals.bindCallback = function(a, b, c) {
        if ("undefined" == typeof b)
          return a;
        switch (c) {
          case 0:
            return function() {
              return a.call(b);
            };
          case 1:
            return function(c) {
              return a.call(b, c);
            };
          case 2:
            return function(c, d) {
              return a.call(b, c, d);
            };
          case 3:
            return function(c, d, e) {
              return a.call(b, c, d, e);
            };
        }
        return function() {
          return a.apply(b, arguments);
        };
      },
      Ca = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"],
      Da = Ca.length,
      Ea = "[object Arguments]",
      Fa = "[object Array]",
      Ga = "[object Boolean]",
      Ha = "[object Date]",
      Ia = "[object Error]",
      Ja = "[object Function]",
      Ka = "[object Number]",
      La = "[object Object]",
      Ma = "[object RegExp]",
      Na = "[object String]",
      Oa = Object.prototype.toString,
      Pa = Object.prototype.hasOwnProperty,
      Qa = Oa.call(arguments) == Ea,
      Ra = Error.prototype,
      Sa = Object.prototype,
      Ta = String.prototype,
      Ua = Sa.propertyIsEnumerable;
  try {
    Aa = !(Oa.call(document) == La && !({toString: 0} + ""));
  } catch (la) {
    Aa = !0;
  }
  var Va = {};
  Va[Fa] = Va[Ha] = Va[Ka] = {
    constructor: !0,
    toLocaleString: !0,
    toString: !0,
    valueOf: !0
  }, Va[Ga] = Va[Na] = {
    constructor: !0,
    toString: !0,
    valueOf: !0
  }, Va[Ia] = Va[Ja] = Va[Ma] = {
    constructor: !0,
    toString: !0
  }, Va[La] = {constructor: !0};
  var Wa = {};
  !function() {
    var a = function() {
      this.x = 1;
    },
        b = [];
    a.prototype = {
      valueOf: 1,
      y: 1
    };
    for (var c in new a)
      b.push(c);
    for (c in arguments)
      ;
    Wa.enumErrorProps = Ua.call(Ra, "message") || Ua.call(Ra, "name"), Wa.enumPrototypes = Ua.call(a, "prototype"), Wa.nonEnumArgs = 0 != c, Wa.nonEnumShadows = !/valueOf/.test(b);
  }(1);
  var Xa = aa.internals.isObject = function(a) {
    var b = typeof a;
    return a && ("function" == b || "object" == b) || !1;
  },
      Ya = function(a) {
        return a && "object" == typeof a ? Oa.call(a) == Ea : !1;
      };
  Qa || (Ya = function(a) {
    return a && "object" == typeof a ? Pa.call(a, "callee") : !1;
  });
  {
    var Za,
        $a = aa.internals.isEqual = function(a, b) {
          return m(a, b, [], []);
        },
        _a = {e: {}},
        ab = ({}.hasOwnProperty, Array.prototype.slice),
        bb = this.inherits = aa.internals.inherits = function(a, b) {
          function c() {
            this.constructor = a;
          }
          c.prototype = b.prototype, a.prototype = new c;
        },
        cb = aa.internals.addProperties = function(a) {
          for (var b = [],
              c = 1,
              d = arguments.length; d > c; c++)
            b.push(arguments[c]);
          for (var e = 0,
              f = b.length; f > e; e++) {
            var g = b[e];
            for (var h in g)
              a[h] = g[h];
          }
        };
    aa.internals.addRef = function(a, b) {
      return new tc(function(c) {
        return new fb(b.getDisposable(), a.subscribe(c));
      });
    };
  }
  r.prototype.compareTo = function(a) {
    var b = this.value.compareTo(a.value);
    return 0 === b && (b = this.id - a.id), b;
  };
  var db = aa.internals.PriorityQueue = function(a) {
    this.items = new Array(a), this.length = 0;
  },
      eb = db.prototype;
  eb.isHigherPriority = function(a, b) {
    return this.items[a].compareTo(this.items[b]) < 0;
  }, eb.percolate = function(a) {
    if (!(a >= this.length || 0 > a)) {
      var b = a - 1 >> 1;
      if (!(0 > b || b === a) && this.isHigherPriority(a, b)) {
        var c = this.items[a];
        this.items[a] = this.items[b], this.items[b] = c, this.percolate(b);
      }
    }
  }, eb.heapify = function(a) {
    if (+a || (a = 0), !(a >= this.length || 0 > a)) {
      var b = 2 * a + 1,
          c = 2 * a + 2,
          d = a;
      if (b < this.length && this.isHigherPriority(b, d) && (d = b), c < this.length && this.isHigherPriority(c, d) && (d = c), d !== a) {
        var e = this.items[a];
        this.items[a] = this.items[d], this.items[d] = e, this.heapify(d);
      }
    }
  }, eb.peek = function() {
    return this.items[0].value;
  }, eb.removeAt = function(b) {
    this.items[b] = this.items[--this.length], this.items[this.length] = a, this.heapify();
  }, eb.dequeue = function() {
    var a = this.peek();
    return this.removeAt(0), a;
  }, eb.enqueue = function(a) {
    var b = this.length++;
    this.items[b] = new r(db.count++, a), this.percolate(b);
  }, eb.remove = function(a) {
    for (var b = 0; b < this.length; b++)
      if (this.items[b].value === a)
        return this.removeAt(b), !0;
    return !1;
  }, db.count = 0;
  var fb = aa.CompositeDisposable = function() {
    var a,
        b,
        c = [];
    if (Array.isArray(arguments[0]))
      c = arguments[0], b = c.length;
    else
      for (b = arguments.length, c = new Array(b), a = 0; b > a; a++)
        c[a] = arguments[a];
    for (a = 0; b > a; a++)
      if (!kb(c[a]))
        throw new TypeError("Not a disposable");
    this.disposables = c, this.isDisposed = !1, this.length = c.length;
  },
      gb = fb.prototype;
  gb.add = function(a) {
    this.isDisposed ? a.dispose() : (this.disposables.push(a), this.length++);
  }, gb.remove = function(a) {
    var b = !1;
    if (!this.isDisposed) {
      var c = this.disposables.indexOf(a);
      -1 !== c && (b = !0, this.disposables.splice(c, 1), this.length--, a.dispose());
    }
    return b;
  }, gb.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = !0;
      for (var a = this.disposables.length,
          b = new Array(a),
          c = 0; a > c; c++)
        b[c] = this.disposables[c];
      for (this.disposables = [], this.length = 0, c = 0; a > c; c++)
        b[c].dispose();
    }
  };
  var hb = aa.Disposable = function(a) {
    this.isDisposed = !1, this.action = a || ba;
  };
  hb.prototype.dispose = function() {
    this.isDisposed || (this.action(), this.isDisposed = !0);
  };
  var ib = hb.create = function(a) {
    return new hb(a);
  },
      jb = hb.empty = {dispose: ba},
      kb = hb.isDisposable = function(a) {
        return a && ja(a.dispose);
      },
      lb = hb.checkDisposed = function(a) {
        if (a.isDisposed)
          throw new qa;
      },
      mb = aa.SingleAssignmentDisposable = function() {
        function a() {
          this.isDisposed = !1, this.current = null;
        }
        var b = a.prototype;
        return b.getDisposable = function() {
          return this.current;
        }, b.setDisposable = function(a) {
          var b = this.isDisposed;
          if (!b) {
            var c = this.current;
            this.current = a;
          }
          c && c.dispose(), b && a && a.dispose();
        }, b.dispose = function() {
          if (!this.isDisposed) {
            this.isDisposed = !0;
            var a = this.current;
            this.current = null;
          }
          a && a.dispose();
        }, a;
      }(),
      nb = aa.SerialDisposable = mb,
      ob = (aa.RefCountDisposable = function() {
        function a(a) {
          this.disposable = a, this.disposable.count++, this.isInnerDisposed = !1;
        }
        function b(a) {
          this.underlyingDisposable = a, this.isDisposed = !1, this.isPrimaryDisposed = !1, this.count = 0;
        }
        return a.prototype.dispose = function() {
          this.disposable.isDisposed || this.isInnerDisposed || (this.isInnerDisposed = !0, this.disposable.count--, 0 === this.disposable.count && this.disposable.isPrimaryDisposed && (this.disposable.isDisposed = !0, this.disposable.underlyingDisposable.dispose()));
        }, b.prototype.dispose = function() {
          this.isDisposed || this.isPrimaryDisposed || (this.isPrimaryDisposed = !0, 0 === this.count && (this.isDisposed = !0, this.underlyingDisposable.dispose()));
        }, b.prototype.getDisposable = function() {
          return this.isDisposed ? jb : new a(this);
        }, b;
      }(), aa.internals.ScheduledItem = function(a, b, c, d, e) {
        this.scheduler = a, this.state = b, this.action = c, this.dueTime = d, this.comparer = e || ga, this.disposable = new mb;
      });
  ob.prototype.invoke = function() {
    this.disposable.setDisposable(this.invokeCore());
  }, ob.prototype.compareTo = function(a) {
    return this.comparer(this.dueTime, a.dueTime);
  }, ob.prototype.isCancelled = function() {
    return this.disposable.isDisposed;
  }, ob.prototype.invokeCore = function() {
    return this.action(this.scheduler, this.state);
  };
  var pb = aa.Scheduler = function() {
    function a(a, b, c, d) {
      this.now = a, this._schedule = b, this._scheduleRelative = c, this._scheduleAbsolute = d;
    }
    function b(a, b) {
      return b(), jb;
    }
    var c = a.prototype;
    return c.schedule = function(a) {
      return this._schedule(a, b);
    }, c.scheduleWithState = function(a, b) {
      return this._schedule(a, b);
    }, c.scheduleWithRelative = function(a, c) {
      return this._scheduleRelative(c, a, b);
    }, c.scheduleWithRelativeAndState = function(a, b, c) {
      return this._scheduleRelative(a, b, c);
    }, c.scheduleWithAbsolute = function(a, c) {
      return this._scheduleAbsolute(c, a, b);
    }, c.scheduleWithAbsoluteAndState = function(a, b, c) {
      return this._scheduleAbsolute(a, b, c);
    }, a.now = ea, a.normalize = function(a) {
      return 0 > a && (a = 0), a;
    }, a;
  }(),
      qb = pb.normalize;
  !function(a) {
    function b(a, b) {
      function c(b) {
        e(b, function(b) {
          var d = !1,
              e = !1,
              g = a.scheduleWithState(b, function(a, b) {
                return d ? f.remove(g) : e = !0, c(b), jb;
              });
          e || (f.add(g), d = !0);
        });
      }
      var d = b[0],
          e = b[1],
          f = new fb;
      return c(d), f;
    }
    function c(a, b, c) {
      function d(b) {
        f(b, function(b, e) {
          var f = !1,
              h = !1,
              i = a[c](b, e, function(a, b) {
                return f ? g.remove(i) : h = !0, d(b), jb;
              });
          h || (g.add(i), f = !0);
        });
      }
      var e = b[0],
          f = b[1],
          g = new fb;
      return d(e), g;
    }
    function d(a, b) {
      a(function(c) {
        b(a, c);
      });
    }
    a.scheduleRecursive = function(a) {
      return this.scheduleRecursiveWithState(a, function(a, b) {
        a(function() {
          b(a);
        });
      });
    }, a.scheduleRecursiveWithState = function(a, c) {
      return this.scheduleWithState([a, c], b);
    }, a.scheduleRecursiveWithRelative = function(a, b) {
      return this.scheduleRecursiveWithRelativeAndState(b, a, d);
    }, a.scheduleRecursiveWithRelativeAndState = function(a, b, d) {
      return this._scheduleRelative([a, d], b, function(a, b) {
        return c(a, b, "scheduleWithRelativeAndState");
      });
    }, a.scheduleRecursiveWithAbsolute = function(a, b) {
      return this.scheduleRecursiveWithAbsoluteAndState(b, a, d);
    }, a.scheduleRecursiveWithAbsoluteAndState = function(a, b, d) {
      return this._scheduleAbsolute([a, d], b, function(a, b) {
        return c(a, b, "scheduleWithAbsoluteAndState");
      });
    };
  }(pb.prototype), function() {
    pb.prototype.schedulePeriodic = function(a, b) {
      return this.schedulePeriodicWithState(null, a, b);
    }, pb.prototype.schedulePeriodicWithState = function(a, b, c) {
      if ("undefined" == typeof X.setInterval)
        throw new sa;
      b = qb(b);
      var d = a,
          e = X.setInterval(function() {
            d = c(d);
          }, b);
      return ib(function() {
        X.clearInterval(e);
      });
    };
  }(pb.prototype);
  var rb,
      sb = pb.immediate = function() {
        function a(a, b) {
          return b(this, a);
        }
        return new pb(ea, a, va, va);
      }(),
      tb = pb.currentThread = function() {
        function a() {
          for (; c.length > 0; ) {
            var a = c.dequeue();
            !a.isCancelled() && a.invoke();
          }
        }
        function b(b, d) {
          var e = new ob(this, b, d, this.now());
          if (c)
            c.enqueue(e);
          else {
            c = new db(4), c.enqueue(e);
            var f = o(a)();
            if (c = null, f === _a)
              return p(f.e);
          }
          return e.disposable;
        }
        var c,
            d = new pb(ea, b, va, va);
        return d.scheduleRequired = function() {
          return !c;
        }, d;
      }(),
      ub = (aa.internals.SchedulePeriodicRecursive = function() {
        function a(a, b) {
          b(0, this._period);
          try {
            this._state = this._action(this._state);
          } catch (c) {
            throw this._cancel.dispose(), c;
          }
        }
        function b(a, b, c, d) {
          this._scheduler = a, this._state = b, this._period = c, this._action = d;
        }
        return b.prototype.start = function() {
          var b = new mb;
          return this._cancel = b, b.setDisposable(this._scheduler.scheduleRecursiveWithRelativeAndState(0, this._period, a.bind(this))), b;
        }, b;
      }(), ba),
      vb = function() {
        var a,
            b = ba;
        if ("WScript" in this)
          a = function(a, b) {
            WScript.Sleep(b), a();
          };
        else {
          if (!X.setTimeout)
            throw new sa;
          a = X.setTimeout, b = X.clearTimeout;
        }
        return {
          setTimeout: a,
          clearTimeout: b
        };
      }(),
      wb = vb.setTimeout,
      xb = vb.clearTimeout;
  !function() {
    function b() {
      if (!X.postMessage || X.importScripts)
        return !1;
      var a = !1,
          b = X.onmessage;
      return X.onmessage = function() {
        a = !0;
      }, X.postMessage("", "*"), X.onmessage = b, a;
    }
    var c = 0,
        d = new Array(1e3),
        e = RegExp("^" + String(Oa).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/toString| for [^\]]+/g, ".*?") + "$"),
        f = "function" == typeof(f = _ && $ && _.setImmediate) && !e.test(f) && f,
        g = "function" == typeof(g = _ && $ && _.clearImmediate) && !e.test(g) && g;
    if ("function" == typeof f)
      rb = f, ub = g;
    else if ("undefined" != typeof process && "[object process]" === {}.toString.call(process))
      rb = process.nextTick;
    else if (b()) {
      var h = "ms.rx.schedule" + Math.random(),
          i = function(b) {
            if ("string" == typeof b.data && b.data.substring(0, h.length) === h) {
              var c = b.data.substring(h.length),
                  e = d[c];
              e(), d[c] = a;
            }
          };
      X.addEventListener ? X.addEventListener("message", i, !1) : X.attachEvent("onmessage", i, !1), rb = function(a) {
        var b = c++;
        d[b] = a, X.postMessage(h + b, "*");
      };
    } else if (X.MessageChannel) {
      var j = new X.MessageChannel;
      j.port1.onmessage = function(b) {
        var c = b.data,
            e = d[c];
        e(), d[c] = a;
      }, rb = function(a) {
        var b = c++;
        d[b] = a, j.port2.postMessage(b);
      };
    } else
      "document" in X && "onreadystatechange" in X.document.createElement("script") ? rb = function(a) {
        var b = X.document.createElement("script");
        b.onreadystatechange = function() {
          a(), b.onreadystatechange = null, b.parentNode.removeChild(b), b = null;
        }, X.document.documentElement.appendChild(b);
      } : (rb = function(a) {
        return wb(a, 0);
      }, ub = xb);
  }();
  var yb = pb.timeout = pb["default"] = function() {
    function a(a, b) {
      var c = this,
          d = new mb,
          e = rb(function() {
            d.isDisposed || d.setDisposable(b(c, a));
          });
      return new fb(d, ib(function() {
        ub(e);
      }));
    }
    function b(a, b, c) {
      var d = this,
          e = pb.normalize(b);
      if (0 === e)
        return d.scheduleWithState(a, c);
      var f = new mb,
          g = wb(function() {
            f.isDisposed || f.setDisposable(c(d, a));
          }, e);
      return new fb(f, ib(function() {
        xb(g);
      }));
    }
    function c(a, b, c) {
      return this.scheduleWithRelativeAndState(a, b - this.now(), c);
    }
    return new pb(ea, a, b, c);
  }(),
      zb = aa.Notification = function() {
        function a(a, b, c, d, e, f) {
          this.kind = a, this.value = b, this.exception = c, this._accept = d, this._acceptObservable = e, this.toString = f;
        }
        return a.prototype.accept = function(a, b, c) {
          return a && "object" == typeof a ? this._acceptObservable(a) : this._accept(a, b, c);
        }, a.prototype.toObservable = function(a) {
          var b = this;
          return ca(a) || (a = sb), new tc(function(c) {
            return a.scheduleWithState(b, function(a, b) {
              b._acceptObservable(c), "N" === b.kind && c.onCompleted();
            });
          });
        }, a;
      }(),
      Ab = zb.createOnNext = function() {
        function a(a) {
          return a(this.value);
        }
        function b(a) {
          return a.onNext(this.value);
        }
        function c() {
          return "OnNext(" + this.value + ")";
        }
        return function(d) {
          return new zb("N", d, null, a, b, c);
        };
      }(),
      Bb = zb.createOnError = function() {
        function a(a, b) {
          return b(this.exception);
        }
        function b(a) {
          return a.onError(this.exception);
        }
        function c() {
          return "OnError(" + this.exception + ")";
        }
        return function(d) {
          return new zb("E", null, d, a, b, c);
        };
      }(),
      Cb = zb.createOnCompleted = function() {
        function a(a, b, c) {
          return c();
        }
        function b(a) {
          return a.onCompleted();
        }
        function c() {
          return "OnCompleted()";
        }
        return function() {
          return new zb("C", null, null, a, b, c);
        };
      }(),
      Db = aa.internals.Enumerator = function(a) {
        this._next = a;
      };
  Db.prototype.next = function() {
    return this._next();
  }, Db.prototype[wa] = function() {
    return this;
  };
  var Eb = aa.internals.Enumerable = function(a) {
    this._iterator = a;
  };
  Eb.prototype[wa] = function() {
    return this._iterator();
  }, Eb.prototype.concat = function() {
    var a = this;
    return new tc(function(b) {
      var c,
          d = a[wa](),
          e = new nb,
          f = sb.scheduleRecursive(function(a) {
            if (!c) {
              try {
                var f = d.next();
              } catch (g) {
                return b.onError(g);
              }
              if (f.done)
                return b.onCompleted();
              var h = f.value;
              ia(h) && (h = mc(h));
              var i = new mb;
              e.setDisposable(i), i.setDisposable(h.subscribe(function(a) {
                b.onNext(a);
              }, function(a) {
                b.onError(a);
              }, a));
            }
          });
      return new fb(e, f, ib(function() {
        c = !0;
      }));
    });
  }, Eb.prototype.catchError = function() {
    var a = this;
    return new tc(function(b) {
      var c,
          d = a[wa](),
          e = new nb,
          f = sb.scheduleRecursiveWithState(null, function(a, f) {
            if (!c) {
              try {
                var g = d.next();
              } catch (h) {
                return observer.onError(h);
              }
              if (g.done)
                return void(null !== a ? b.onError(a) : b.onCompleted());
              var i = g.value;
              ia(i) && (i = mc(i));
              var j = new mb;
              e.setDisposable(j), j.setDisposable(i.subscribe(function(a) {
                b.onNext(a);
              }, f, function() {
                b.onCompleted();
              }));
            }
          });
      return new fb(e, f, ib(function() {
        c = !0;
      }));
    });
  }, Eb.prototype.catchErrorWhen = function(a) {
    var b = this;
    return new tc(function(c) {
      var d,
          e,
          f = new wc,
          g = new wc,
          h = a(f),
          i = h.subscribe(g),
          j = b[wa](),
          k = new nb,
          l = sb.scheduleRecursive(function(a) {
            if (!d) {
              try {
                var b = j.next();
              } catch (h) {
                return c.onError(h);
              }
              if (b.done)
                return void(e ? c.onError(e) : c.onCompleted());
              var i = b.value;
              ia(i) && (i = mc(i));
              var l = new mb,
                  m = new mb;
              k.setDisposable(new fb(m, l)), l.setDisposable(i.subscribe(function(a) {
                c.onNext(a);
              }, function(b) {
                m.setDisposable(g.subscribe(a, function(a) {
                  c.onError(a);
                }, function() {
                  c.onCompleted();
                })), f.onNext(b);
              }, function() {
                c.onCompleted();
              }));
            }
          });
      return new fb(i, k, l, ib(function() {
        d = !0;
      }));
    });
  };
  var Fb,
      Gb = Eb.repeat = function(a, b) {
        return null == b && (b = -1), new Eb(function() {
          var c = b;
          return new Db(function() {
            return 0 === c ? xa : (c > 0 && c--, {
              done: !1,
              value: a
            });
          });
        });
      },
      Hb = Eb.of = function(a, b, c) {
        if (b)
          var d = Ba(b, c, 3);
        return new Eb(function() {
          var c = -1;
          return new Db(function() {
            return ++c < a.length ? {
              done: !1,
              value: b ? d(a[c], c, a) : a[c]
            } : xa;
          });
        });
      },
      Ib = aa.Observer = function() {},
      Jb = Ib.create = function(a, b, c) {
        return a || (a = ba), b || (b = ha), c || (c = ba), new Lb(a, b, c);
      },
      Kb = aa.internals.AbstractObserver = function(a) {
        function b() {
          this.isStopped = !1, a.call(this);
        }
        return bb(b, a), b.prototype.next = ua, b.prototype.error = ua, b.prototype.completed = ua, b.prototype.onNext = function(a) {
          this.isStopped || this.next(a);
        }, b.prototype.onError = function(a) {
          this.isStopped || (this.isStopped = !0, this.error(a));
        }, b.prototype.onCompleted = function() {
          this.isStopped || (this.isStopped = !0, this.completed());
        }, b.prototype.dispose = function() {
          this.isStopped = !0;
        }, b.prototype.fail = function(a) {
          return this.isStopped ? !1 : (this.isStopped = !0, this.error(a), !0);
        }, b;
      }(Ib),
      Lb = aa.AnonymousObserver = function(a) {
        function b(b, c, d) {
          a.call(this), this._onNext = b, this._onError = c, this._onCompleted = d;
        }
        return bb(b, a), b.prototype.next = function(a) {
          this._onNext(a);
        }, b.prototype.error = function(a) {
          this._onError(a);
        }, b.prototype.completed = function() {
          this._onCompleted();
        }, b;
      }(Kb),
      Mb = aa.Observable = function() {
        function a(a) {
          if (aa.config.longStackSupport && ka) {
            try {
              throw new Error;
            } catch (b) {
              this.stack = b.stack.substring(b.stack.indexOf("\n") + 1);
            }
            var d = this;
            this._subscribe = function(b) {
              var e = b.onError.bind(b);
              return b.onError = function(a) {
                c(a, d), e(a);
              }, a.call(d, b);
            };
          } else
            this._subscribe = a;
        }
        return Fb = a.prototype, Fb.subscribe = Fb.forEach = function(a, b, c) {
          return this._subscribe("object" == typeof a ? a : Jb(a, b, c));
        }, Fb.subscribeOnNext = function(a, b) {
          return this._subscribe(Jb("undefined" != typeof b ? function(c) {
            a.call(b, c);
          } : a));
        }, Fb.subscribeOnError = function(a, b) {
          return this._subscribe(Jb(null, "undefined" != typeof b ? function(c) {
            a.call(b, c);
          } : a));
        }, Fb.subscribeOnCompleted = function(a, b) {
          return this._subscribe(Jb(null, null, "undefined" != typeof b ? function() {
            a.call(b);
          } : a));
        }, a;
      }(),
      Nb = aa.internals.ScheduledObserver = function(a) {
        function b(b, c) {
          a.call(this), this.scheduler = b, this.observer = c, this.isAcquired = !1, this.hasFaulted = !1, this.queue = [], this.disposable = new nb;
        }
        return bb(b, a), b.prototype.next = function(a) {
          var b = this;
          this.queue.push(function() {
            b.observer.onNext(a);
          });
        }, b.prototype.error = function(a) {
          var b = this;
          this.queue.push(function() {
            b.observer.onError(a);
          });
        }, b.prototype.completed = function() {
          var a = this;
          this.queue.push(function() {
            a.observer.onCompleted();
          });
        }, b.prototype.ensureActive = function() {
          var a = !1,
              b = this;
          !this.hasFaulted && this.queue.length > 0 && (a = !this.isAcquired, this.isAcquired = !0), a && this.disposable.setDisposable(this.scheduler.scheduleRecursive(function(a) {
            var c;
            if (!(b.queue.length > 0))
              return void(b.isAcquired = !1);
            c = b.queue.shift();
            try {
              c();
            } catch (d) {
              throw b.queue = [], b.hasFaulted = !0, d;
            }
            a();
          }));
        }, b.prototype.dispose = function() {
          a.prototype.dispose.call(this), this.disposable.dispose();
        }, b;
      }(Kb),
      Ob = aa.ObservableBase = function(a) {
        function b(a) {
          return a && ja(a.dispose) ? a : ja(a) ? ib(a) : jb;
        }
        function c(a, c) {
          var d = c[0],
              e = c[1],
              f = o(e.subscribeCore).call(e, d);
          return f !== _a || d.fail(_a.e) ? void d.setDisposable(b(f)) : p(_a.e);
        }
        function d(a) {
          var b = new uc(a),
              d = [b, this];
          return tb.scheduleRequired() ? tb.scheduleWithState(d, c) : c(null, d), b;
        }
        function e() {
          a.call(this, d);
        }
        return bb(e, a), e.prototype.subscribeCore = ua, e;
      }(Mb),
      Pb = function(a) {
        function b(b) {
          this.source = b, a.call(this);
        }
        return bb(b, a), b.prototype.subscribeCore = function(a) {
          return this.source.subscribe(new t(a));
        }, b;
      }(Ob);
  t.prototype.onNext = function(a) {
    this.isStopped || this.a.push(a);
  }, t.prototype.onError = function(a) {
    this.isStopped || (this.isStopped = !0, this.observer.onError(a));
  }, t.prototype.onCompleted = function() {
    this.isStopped || (this.isStopped = !0, this.observer.onNext(this.a), this.observer.onCompleted());
  }, t.prototype.dispose = function() {
    this.isStopped = !0;
  }, t.prototype.fail = function(a) {
    return this.isStopped ? !1 : (this.isStopped = !0, this.observer.onError(a), !0);
  }, Fb.toArray = function() {
    return new Pb(this);
  }, Mb.create = Mb.createWithDisposable = function(a, b) {
    return new tc(a, b);
  };
  var Qb = Mb.defer = function(a) {
    return new tc(function(b) {
      var c;
      try {
        c = a();
      } catch (d) {
        return _b(d).subscribe(b);
      }
      return ia(c) && (c = mc(c)), c.subscribe(b);
    });
  },
      Rb = Mb.empty = function(a) {
        return ca(a) || (a = sb), new tc(function(b) {
          return a.schedule(function() {
            b.onCompleted();
          });
        });
      },
      Sb = function(a) {
        function b(b, c, d) {
          this.iterable = b, this.mapper = c, this.scheduler = d, a.call(this);
        }
        return bb(b, a), b.prototype.subscribeCore = function(a) {
          var b = new Tb(a, this);
          return b.run();
        }, b;
      }(Ob),
      Tb = function() {
        function a(a, b) {
          this.observer = a, this.parent = b;
        }
        return a.prototype.run = function() {
          function a(a, b) {
            try {
              var f = c.next();
            } catch (g) {
              return d.onError(g);
            }
            if (f.done)
              return d.onCompleted();
            var h = f.value;
            if (e)
              try {
                h = e(h, a);
              } catch (g) {
                return d.onError(g);
              }
            d.onNext(h), b(a + 1);
          }
          var b = Object(this.parent.iterable),
              c = z(b),
              d = this.observer,
              e = this.parent.mapper;
          return this.parent.scheduler.scheduleRecursiveWithState(0, a);
        }, a;
      }(),
      Ub = Math.pow(2, 53) - 1;
  u.prototype[wa] = function() {
    return new v(this._s);
  }, v.prototype[wa] = function() {
    return this;
  }, v.prototype.next = function() {
    return this._i < this._l ? {
      done: !1,
      value: this._s.charAt(this._i++)
    } : xa;
  }, w.prototype[wa] = function() {
    return new x(this._a);
  }, x.prototype[wa] = function() {
    return this;
  }, x.prototype.next = function() {
    return this._i < this._l ? {
      done: !1,
      value: this._a[this._i++]
    } : xa;
  };
  var Vb = Mb.from = function(a, b, c, d) {
    if (null == a)
      throw new Error("iterable cannot be null.");
    if (b && !ja(b))
      throw new Error("mapFn when provided must be a function");
    if (b)
      var e = Ba(b, c, 2);
    return ca(d) || (d = tb), new Sb(a, e, d);
  },
      Wb = function(a) {
        function b(b, c) {
          this.args = b, this.scheduler = c, a.call(this);
        }
        return bb(b, a), b.prototype.subscribeCore = function(a) {
          var b = new C(a, this);
          return b.run();
        }, b;
      }(Ob);
  C.prototype.run = function() {
    function a(a, e) {
      d > a ? (b.onNext(c[a]), e(a + 1)) : b.onCompleted();
    }
    var b = this.observer,
        c = this.parent.args,
        d = c.length;
    return this.parent.scheduler.scheduleRecursiveWithState(0, a);
  };
  {
    var Xb = Mb.fromArray = function(a, b) {
      return ca(b) || (b = tb), new Wb(a, b);
    };
    Mb.never = function() {
      return new tc(function() {
        return jb;
      });
    };
  }
  Mb.of = function() {
    for (var a = arguments.length,
        b = new Array(a),
        c = 0; a > c; c++)
      b[c] = arguments[c];
    return new Wb(b, tb);
  }, Mb.ofWithScheduler = function(a) {
    for (var b = arguments.length,
        c = new Array(b - 1),
        d = 1; b > d; d++)
      c[d - 1] = arguments[d];
    return new Wb(c, a);
  }, Mb.pairs = function(a, b) {
    return b || (b = aa.Scheduler.currentThread), new tc(function(c) {
      var d = Object.keys(a),
          e = d.length;
      return b.scheduleRecursiveWithState(0, function(b, f) {
        if (e > b) {
          var g = d[b];
          c.onNext([g, a[g]]), f(b + 1);
        } else
          c.onCompleted();
      });
    });
  };
  var Yb = function(a) {
    function b(b, c, d) {
      this.start = b, this.count = c, this.scheduler = d, a.call(this);
    }
    return bb(b, a), b.prototype.subscribeCore = function(a) {
      var b = new Zb(a, this);
      return b.run();
    }, b;
  }(Ob),
      Zb = function() {
        function a(a, b) {
          this.observer = a, this.parent = b;
        }
        return a.prototype.run = function() {
          function a(a, e) {
            c > a ? (d.onNext(b + a), e(a + 1)) : d.onCompleted();
          }
          var b = this.parent.start,
              c = this.parent.count,
              d = this.observer;
          return this.parent.scheduler.scheduleRecursiveWithState(0, a);
        }, a;
      }();
  Mb.range = function(a, b, c) {
    return ca(c) || (c = tb), new Yb(a, b, c);
  }, Mb.repeat = function(a, b, c) {
    return ca(c) || (c = tb), $b(a, c).repeat(null == b ? -1 : b);
  };
  var $b = Mb["return"] = Mb.just = function(a, b) {
    return ca(b) || (b = sb), new tc(function(c) {
      return b.schedule(function() {
        c.onNext(a), c.onCompleted();
      });
    });
  };
  Mb.returnValue = function() {
    return $b.apply(null, arguments);
  };
  var _b = Mb["throw"] = Mb.throwError = function(a, b) {
    return ca(b) || (b = sb), new tc(function(c) {
      return b.schedule(function() {
        c.onError(a);
      });
    });
  };
  Mb.throwException = function() {
    return Mb.throwError.apply(null, arguments);
  }, Fb["catch"] = Fb.catchError = Fb.catchException = function(a) {
    return "function" == typeof a ? E(this, a) : ac([this, a]);
  };
  var ac = Mb.catchError = Mb["catch"] = Mb.catchException = function() {
    var a = [];
    if (Array.isArray(arguments[0]))
      a = arguments[0];
    else
      for (var b = 0,
          c = arguments.length; c > b; b++)
        a.push(arguments[b]);
    return Hb(a).catchError();
  };
  Fb.combineLatest = function() {
    for (var a = arguments.length,
        b = new Array(a),
        c = 0; a > c; c++)
      b[c] = arguments[c];
    return Array.isArray(b[0]) ? b[0].unshift(this) : b.unshift(this), bc.apply(this, b);
  };
  var bc = Mb.combineLatest = function() {
    for (var a = arguments.length,
        b = new Array(a),
        c = 0; a > c; c++)
      b[c] = arguments[c];
    var d = b.pop();
    return Array.isArray(b[0]) && (b = b[0]), new tc(function(a) {
      function c(b) {
        if (h[b] = !0, i || (i = h.every(da))) {
          try {
            var c = d.apply(null, k);
          } catch (e) {
            return a.onError(e);
          }
          a.onNext(c);
        } else
          j.filter(function(a, c) {
            return c !== b;
          }).every(da) && a.onCompleted();
      }
      function e(b) {
        j[b] = !0, j.every(da) && a.onCompleted();
      }
      for (var f = b.length,
          g = function() {
            return !1;
          },
          h = q(f, g),
          i = !1,
          j = q(f, g),
          k = new Array(f),
          l = new Array(f),
          m = 0; f > m; m++)
        !function(d) {
          var f = b[d],
              g = new mb;
          ia(f) && (f = mc(f)), g.setDisposable(f.subscribe(function(a) {
            k[d] = a, c(d);
          }, function(b) {
            a.onError(b);
          }, function() {
            e(d);
          })), l[d] = g;
        }(m);
      return new fb(l);
    }, this);
  };
  Fb.concat = function() {
    for (var a = [],
        b = 0,
        c = arguments.length; c > b; b++)
      a.push(arguments[b]);
    return a.unshift(this), cc.apply(null, a);
  };
  var cc = Mb.concat = function() {
    var a;
    if (Array.isArray(arguments[0]))
      a = arguments[0];
    else {
      a = new Array(arguments.length);
      for (var b = 0,
          c = arguments.length; c > b; b++)
        a[b] = arguments[b];
    }
    return Hb(a).concat();
  };
  Fb.concatAll = Fb.concatObservable = function() {
    return this.merge(1);
  };
  var dc = function(a) {
    function b(b, c) {
      this.source = b, this.maxConcurrent = c, a.call(this);
    }
    return bb(b, a), b.prototype.subscribeCore = function(a) {
      var b = new fb;
      return b.add(this.source.subscribe(new ec(a, this.maxConcurrent, b))), b;
    }, b;
  }(Ob),
      ec = function() {
        function a(a, b, c) {
          this.o = a, this.max = b, this.g = c, this.done = !1, this.q = [], this.activeCount = 0, this.isStopped = !1;
        }
        function b(a, b) {
          this.parent = a, this.sad = b, this.isStopped = !1;
        }
        return a.prototype.handleSubscribe = function(a) {
          var c = new mb;
          this.g.add(c), ia(a) && (a = mc(a)), c.setDisposable(a.subscribe(new b(this, c)));
        }, a.prototype.onNext = function(a) {
          this.isStopped || (this.activeCount < this.max ? (this.activeCount++, this.handleSubscribe(a)) : this.q.push(a));
        }, a.prototype.onError = function(a) {
          this.isStopped || (this.isStopped = !0, this.o.onError(a));
        }, a.prototype.onCompleted = function() {
          this.isStopped || (this.isStopped = !0, this.done = !0, 0 === this.activeCount && this.o.onCompleted());
        }, a.prototype.dispose = function() {
          this.isStopped = !0;
        }, a.prototype.fail = function(a) {
          return this.isStopped ? !1 : (this.isStopped = !0, this.o.onError(a), !0);
        }, b.prototype.onNext = function(a) {
          this.isStopped || this.parent.o.onNext(a);
        }, b.prototype.onError = function(a) {
          this.isStopped || (this.isStopped = !0, this.parent.o.onError(a));
        }, b.prototype.onCompleted = function() {
          if (!this.isStopped) {
            this.isStopped = !0;
            var a = this.parent;
            a.g.remove(this.sad), a.q.length > 0 ? a.handleSubscribe(a.q.shift()) : (a.activeCount--, a.done && 0 === a.activeCount && a.o.onCompleted());
          }
        }, b.prototype.dispose = function() {
          this.isStopped = !0;
        }, b.prototype.fail = function(a) {
          return this.isStopped ? !1 : (this.isStopped = !0, this.parent.o.onError(a), !0);
        }, a;
      }();
  Fb.merge = function(a) {
    return "number" != typeof a ? fc(this, a) : new dc(this, a);
  };
  var fc = Mb.merge = function() {
    var a,
        b,
        c = [],
        d = arguments.length;
    if (arguments[0])
      if (ca(arguments[0]))
        for (a = arguments[0], b = 1; d > b; b++)
          c.push(arguments[b]);
      else
        for (a = sb, b = 0; d > b; b++)
          c.push(arguments[b]);
    else
      for (a = sb, b = 1; d > b; b++)
        c.push(arguments[b]);
    return Array.isArray(c[0]) && (c = c[0]), D(a, c).mergeAll();
  },
      gc = aa.CompositeError = function(a) {
        this.name = "NotImplementedError", this.innerErrors = a, this.message = "This contains multiple errors. Check the innerErrors", Error.call(this);
      };
  gc.prototype = Error.prototype, Mb.mergeDelayError = function() {
    var a;
    if (Array.isArray(arguments[0]))
      a = arguments[0];
    else {
      var b = arguments.length;
      a = new Array(b);
      for (var c = 0; b > c; c++)
        a[c] = arguments[c];
    }
    var d = D(null, a);
    return new tc(function(a) {
      function b() {
        0 === g.length ? a.onCompleted() : a.onError(1 === g.length ? g[0] : new gc(g));
      }
      var c = new fb,
          e = new mb,
          f = !1,
          g = [];
      return c.add(e), e.setDisposable(d.subscribe(function(d) {
        var e = new mb;
        c.add(e), ia(d) && (d = mc(d)), e.setDisposable(d.subscribe(function(b) {
          a.onNext(b);
        }, function(a) {
          g.push(a), c.remove(e), f && 1 === c.length && b();
        }, function() {
          c.remove(e), f && 1 === c.length && b();
        }));
      }, function(a) {
        g.push(a), f = !0, 1 === c.length && b();
      }, function() {
        f = !0, 1 === c.length && b();
      })), c;
    });
  };
  var hc = function(a) {
    function b(b) {
      this.source = b, a.call(this);
    }
    return bb(b, a), b.prototype.subscribeCore = function(a) {
      var b = new fb,
          c = new mb;
      return b.add(c), c.setDisposable(this.source.subscribe(new ic(a, b))), b;
    }, b;
  }(Ob),
      ic = function() {
        function a(a, b) {
          this.o = a, this.g = b, this.isStopped = !1, this.done = !1;
        }
        function b(a, b, c) {
          this.parent = a, this.g = b, this.sad = c, this.isStopped = !1;
        }
        return a.prototype.onNext = function(a) {
          if (!this.isStopped) {
            var c = new mb;
            this.g.add(c), ia(a) && (a = mc(a)), c.setDisposable(a.subscribe(new b(this, this.g, c)));
          }
        }, a.prototype.onError = function(a) {
          this.isStopped || (this.isStopped = !0, this.o.onError(a));
        }, a.prototype.onCompleted = function() {
          this.isStopped || (this.isStopped = !0, this.done = !0, 1 === this.g.length && this.o.onCompleted());
        }, a.prototype.dispose = function() {
          this.isStopped = !0;
        }, a.prototype.fail = function(a) {
          return this.isStopped ? !1 : (this.isStopped = !0, this.o.onError(a), !0);
        }, b.prototype.onNext = function(a) {
          this.isStopped || this.parent.o.onNext(a);
        }, b.prototype.onError = function(a) {
          this.isStopped || (this.isStopped = !0, this.parent.o.onError(a));
        }, b.prototype.onCompleted = function() {
          if (!this.isStopped) {
            var a = this.parent;
            this.isStopped = !0, a.g.remove(this.sad), a.done && 1 === a.g.length && a.o.onCompleted();
          }
        }, b.prototype.dispose = function() {
          this.isStopped = !0;
        }, b.prototype.fail = function(a) {
          return this.isStopped ? !1 : (this.isStopped = !0, this.parent.o.onError(a), !0);
        }, a;
      }();
  Fb.mergeAll = Fb.mergeObservable = function() {
    return new hc(this);
  }, Fb.skipUntil = function(a) {
    var b = this;
    return new tc(function(c) {
      var d = !1,
          e = new fb(b.subscribe(function(a) {
            d && c.onNext(a);
          }, function(a) {
            c.onError(a);
          }, function() {
            d && c.onCompleted();
          }));
      ia(a) && (a = mc(a));
      var f = new mb;
      return e.add(f), f.setDisposable(a.subscribe(function() {
        d = !0, f.dispose();
      }, function(a) {
        c.onError(a);
      }, function() {
        f.dispose();
      })), e;
    }, b);
  }, Fb["switch"] = Fb.switchLatest = function() {
    var a = this;
    return new tc(function(b) {
      var c = !1,
          d = new nb,
          e = !1,
          f = 0,
          g = a.subscribe(function(a) {
            var g = new mb,
                h = ++f;
            c = !0, d.setDisposable(g), ia(a) && (a = mc(a)), g.setDisposable(a.subscribe(function(a) {
              f === h && b.onNext(a);
            }, function(a) {
              f === h && b.onError(a);
            }, function() {
              f === h && (c = !1, e && b.onCompleted());
            }));
          }, function(a) {
            b.onError(a);
          }, function() {
            e = !0, !c && b.onCompleted();
          });
      return new fb(g, d);
    }, a);
  }, Fb.takeUntil = function(a) {
    var b = this;
    return new tc(function(c) {
      return ia(a) && (a = mc(a)), new fb(b.subscribe(c), a.subscribe(function() {
        c.onCompleted();
      }, function(a) {
        c.onError(a);
      }, ba));
    }, b);
  }, Fb.withLatestFrom = function() {
    for (var a = arguments.length,
        b = new Array(a),
        c = 0; a > c; c++)
      b[c] = arguments[c];
    var d = b.pop(),
        e = this;
    if ("undefined" == typeof e)
      throw new Error("Source observable not found for withLatestFrom().");
    if ("function" != typeof d)
      throw new Error("withLatestFrom() expects a resultSelector function.");
    return Array.isArray(b[0]) && (b = b[0]), new tc(function(a) {
      for (var c = function() {
        return !1;
      },
          f = b.length,
          g = q(f, c),
          h = !1,
          i = new Array(f),
          j = new Array(f + 1),
          k = 0; f > k; k++)
        !function(c) {
          var d = b[c],
              e = new mb;
          ia(d) && (d = mc(d)), e.setDisposable(d.subscribe(function(a) {
            i[c] = a, g[c] = !0, h = g.every(da);
          }, a.onError.bind(a), function() {})), j[c] = e;
        }(k);
      var l = new mb;
      return l.setDisposable(e.subscribe(function(b) {
        var c,
            e = [b].concat(i);
        if (h) {
          try {
            c = d.apply(null, e);
          } catch (f) {
            return void a.onError(f);
          }
          a.onNext(c);
        }
      }, a.onError.bind(a), function() {
        a.onCompleted();
      })), j[f] = l, new fb(j);
    }, this);
  }, Fb.zip = function() {
    if (Array.isArray(arguments[0]))
      return F.apply(this, arguments);
    for (var a = arguments.length,
        b = new Array(a),
        c = 0; a > c; c++)
      b[c] = arguments[c];
    var d = this,
        e = b.pop();
    return b.unshift(d), new tc(function(a) {
      function c(b) {
        var c,
            f;
        if (h.every(function(a) {
          return a.length > 0;
        })) {
          try {
            f = h.map(function(a) {
              return a.shift();
            }), c = e.apply(d, f);
          } catch (g) {
            return void a.onError(g);
          }
          a.onNext(c);
        } else
          i.filter(function(a, c) {
            return c !== b;
          }).every(da) && a.onCompleted();
      }
      function f(b) {
        i[b] = !0, i.every(function(a) {
          return a;
        }) && a.onCompleted();
      }
      for (var g = b.length,
          h = q(g, H),
          i = q(g, G),
          j = new Array(g),
          k = 0; g > k; k++)
        !function(d) {
          var e = b[d],
              g = new mb;
          ia(e) && (e = mc(e)), g.setDisposable(e.subscribe(function(a) {
            h[d].push(a), c(d);
          }, function(b) {
            a.onError(b);
          }, function() {
            f(d);
          })), j[d] = g;
        }(k);
      return new fb(j);
    }, d);
  }, Mb.zip = function() {
    for (var a = arguments.length,
        b = new Array(a),
        c = 0; a > c; c++)
      b[c] = arguments[c];
    var d = b.shift();
    return d.zip.apply(d, b);
  }, Mb.zipArray = function() {
    var a;
    if (Array.isArray(arguments[0]))
      a = arguments[0];
    else {
      var b = arguments.length;
      a = new Array(b);
      for (var c = 0; b > c; c++)
        a[c] = arguments[c];
    }
    return new tc(function(b) {
      function c(a) {
        if (f.every(function(a) {
          return a.length > 0;
        })) {
          var c = f.map(function(a) {
            return a.shift();
          });
          b.onNext(c);
        } else if (g.filter(function(b, c) {
          return c !== a;
        }).every(da))
          return void b.onCompleted();
      }
      function d(a) {
        return g[a] = !0, g.every(da) ? void b.onCompleted() : void 0;
      }
      for (var e = a.length,
          f = q(e, function() {
            return [];
          }),
          g = q(e, function() {
            return !1;
          }),
          h = new Array(e),
          i = 0; e > i; i++)
        !function(e) {
          h[e] = new mb, h[e].setDisposable(a[e].subscribe(function(a) {
            f[e].push(a), c(e);
          }, function(a) {
            b.onError(a);
          }, function() {
            d(e);
          }));
        }(i);
      return new fb(h);
    });
  }, Fb.asObservable = function() {
    var a = this;
    return new tc(function(b) {
      return a.subscribe(b);
    }, this);
  }, Fb.dematerialize = function() {
    var a = this;
    return new tc(function(b) {
      return a.subscribe(function(a) {
        return a.accept(b);
      }, function(a) {
        b.onError(a);
      }, function() {
        b.onCompleted();
      });
    }, this);
  }, Fb.distinctUntilChanged = function(a, b) {
    var c = this;
    return b || (b = fa), new tc(function(d) {
      var e,
          f = !1;
      return c.subscribe(function(c) {
        var g = c;
        if (a)
          try {
            g = a(c);
          } catch (h) {
            return void d.onError(h);
          }
        if (f)
          try {
            var i = b(e, g);
          } catch (h) {
            return void d.onError(h);
          }
        f && i || (f = !0, e = g, d.onNext(c));
      }, function(a) {
        d.onError(a);
      }, function() {
        d.onCompleted();
      });
    }, this);
  }, Fb["do"] = Fb.tap = Fb.doAction = function(a, b, c) {
    var d = this,
        e = "function" == typeof a || "undefined" == typeof a ? Jb(a || ba, b || ba, c || ba) : a;
    return new tc(function(a) {
      return d.subscribe(function(b) {
        try {
          e.onNext(b);
        } catch (c) {
          a.onError(c);
        }
        a.onNext(b);
      }, function(b) {
        try {
          e.onError(b);
        } catch (c) {
          a.onError(c);
        }
        a.onError(b);
      }, function() {
        try {
          e.onCompleted();
        } catch (b) {
          a.onError(b);
        }
        a.onCompleted();
      });
    }, this);
  }, Fb.doOnNext = Fb.tapOnNext = function(a, b) {
    return this.tap("undefined" != typeof b ? function(c) {
      a.call(b, c);
    } : a);
  }, Fb.doOnError = Fb.tapOnError = function(a, b) {
    return this.tap(ba, "undefined" != typeof b ? function(c) {
      a.call(b, c);
    } : a);
  }, Fb.doOnCompleted = Fb.tapOnCompleted = function(a, b) {
    return this.tap(ba, null, "undefined" != typeof b ? function() {
      a.call(b);
    } : a);
  }, Fb["finally"] = Fb.ensure = function(a) {
    var b = this;
    return new tc(function(c) {
      var d;
      try {
        d = b.subscribe(c);
      } catch (e) {
        throw a(), e;
      }
      return ib(function() {
        try {
          d.dispose();
        } catch (b) {
          throw b;
        } finally {
          a();
        }
      });
    }, this);
  }, Fb.finallyAction = function(a) {
    return this.ensure(a);
  }, Fb.ignoreElements = function() {
    var a = this;
    return new tc(function(b) {
      return a.subscribe(ba, function(a) {
        b.onError(a);
      }, function() {
        b.onCompleted();
      });
    }, a);
  }, Fb.materialize = function() {
    var a = this;
    return new tc(function(b) {
      return a.subscribe(function(a) {
        b.onNext(Ab(a));
      }, function(a) {
        b.onNext(Bb(a)), b.onCompleted();
      }, function() {
        b.onNext(Cb()), b.onCompleted();
      });
    }, a);
  }, Fb.repeat = function(a) {
    return Gb(this, a).concat();
  }, Fb.retry = function(a) {
    return Gb(this, a).catchError();
  }, Fb.retryWhen = function(a) {
    return Gb(this).catchErrorWhen(a);
  }, Fb.scan = function() {
    var a,
        b,
        c = !1,
        d = this;
    return 2 === arguments.length ? (c = !0, a = arguments[0], b = arguments[1]) : b = arguments[0], new tc(function(e) {
      var f,
          g,
          h;
      return d.subscribe(function(d) {
        !h && (h = !0);
        try {
          f ? g = b(g, d) : (g = c ? b(a, d) : d, f = !0);
        } catch (i) {
          return void e.onError(i);
        }
        e.onNext(g);
      }, function(a) {
        e.onError(a);
      }, function() {
        !h && c && e.onNext(a), e.onCompleted();
      });
    }, d);
  }, Fb.skipLast = function(a) {
    if (0 > a)
      throw new ra;
    var b = this;
    return new tc(function(c) {
      var d = [];
      return b.subscribe(function(b) {
        d.push(b), d.length > a && c.onNext(d.shift());
      }, function(a) {
        c.onError(a);
      }, function() {
        c.onCompleted();
      });
    }, b);
  }, Fb.startWith = function() {
    var a,
        b = 0;
    arguments.length && ca(arguments[0]) ? (a = arguments[0], b = 1) : a = sb;
    for (var c = [],
        d = b,
        e = arguments.length; e > d; d++)
      c.push(arguments[d]);
    return Hb([Xb(c, a), this]).concat();
  }, Fb.takeLast = function(a) {
    if (0 > a)
      throw new ra;
    var b = this;
    return new tc(function(c) {
      var d = [];
      return b.subscribe(function(b) {
        d.push(b), d.length > a && d.shift();
      }, function(a) {
        c.onError(a);
      }, function() {
        for (; d.length > 0; )
          c.onNext(d.shift());
        c.onCompleted();
      });
    }, b);
  }, Fb.selectConcat = Fb.concatMap = function(a, b, c) {
    return ja(a) && ja(b) ? this.concatMap(function(c, d) {
      var e = a(c, d);
      return ia(e) && (e = mc(e)), (za(e) || ya(e)) && (e = Vb(e)), e.map(function(a, e) {
        return b(c, a, d, e);
      });
    }) : ja(a) ? I(this, a, c) : I(this, function() {
      return a;
    });
  };
  var jc = function(a) {
    function b(b, c, d) {
      this.source = b, this.selector = Ba(c, d, 3), a.call(this);
    }
    return bb(b, a), b.prototype.internalMap = function(a, c) {
      var d = this;
      return new b(this.source, function(b, c, e) {
        return a(d.selector(b, c, e), c, e);
      }, c);
    }, b.prototype.subscribeCore = function(a) {
      return this.source.subscribe(new J(a, this.selector, this));
    }, b;
  }(Ob);
  J.prototype.onNext = function(a) {
    if (!this.isStopped) {
      var b = o(this.selector).call(this, a, this.i++, this.source);
      return b === _a ? this.observer.onError(b.e) : void this.observer.onNext(b);
    }
  }, J.prototype.onError = function(a) {
    this.isStopped || (this.isStopped = !0, this.observer.onError(a));
  }, J.prototype.onCompleted = function() {
    this.isStopped || (this.isStopped = !0, this.observer.onCompleted());
  }, J.prototype.dispose = function() {
    this.isStopped = !0;
  }, J.prototype.fail = function(a) {
    return this.isStopped ? !1 : (this.isStopped = !0, this.observer.onError(a), !0);
  }, Fb.map = Fb.select = function(a, b) {
    var c = "function" == typeof a ? a : function() {
      return a;
    };
    return this instanceof jc ? this.internalMap(c, b) : new jc(this, c, b);
  }, Fb.pluck = function() {
    var b = arguments,
        c = arguments.length;
    if (0 === c)
      throw new Error("List of properties cannot be empty.");
    return this.map(function(d) {
      for (var e = d,
          f = 0; c > f; f++) {
        var g = e[b[f]];
        if ("undefined" == typeof g)
          return a;
        e = g;
      }
      return e;
    });
  }, Fb.selectMany = Fb.flatMap = function(a, b, c) {
    return ja(a) && ja(b) ? this.flatMap(function(c, d) {
      var e = a(c, d);
      return ia(e) && (e = mc(e)), (za(e) || ya(e)) && (e = Vb(e)), e.map(function(a, e) {
        return b(c, a, d, e);
      });
    }, c) : ja(a) ? K(this, a, c) : K(this, function() {
      return a;
    });
  }, Fb.selectSwitch = Fb.flatMapLatest = Fb.switchMap = function(a, b) {
    return this.select(a, b).switchLatest();
  }, Fb.skip = function(a) {
    if (0 > a)
      throw new ra;
    var b = this;
    return new tc(function(c) {
      var d = a;
      return b.subscribe(function(a) {
        0 >= d ? c.onNext(a) : d--;
      }, function(a) {
        c.onError(a);
      }, function() {
        c.onCompleted();
      });
    }, b);
  }, Fb.skipWhile = function(a, b) {
    var c = this,
        d = Ba(a, b, 3);
    return new tc(function(a) {
      var b = 0,
          e = !1;
      return c.subscribe(function(f) {
        if (!e)
          try {
            e = !d(f, b++, c);
          } catch (g) {
            return void a.onError(g);
          }
        e && a.onNext(f);
      }, function(b) {
        a.onError(b);
      }, function() {
        a.onCompleted();
      });
    }, c);
  }, Fb.take = function(a, b) {
    if (0 > a)
      throw new ra;
    if (0 === a)
      return Rb(b);
    var c = this;
    return new tc(function(b) {
      var d = a;
      return c.subscribe(function(a) {
        d-- > 0 && (b.onNext(a), 0 === d && b.onCompleted());
      }, function(a) {
        b.onError(a);
      }, function() {
        b.onCompleted();
      });
    }, c);
  }, Fb.takeWhile = function(a, b) {
    var c = this,
        d = Ba(a, b, 3);
    return new tc(function(a) {
      var b = 0,
          e = !0;
      return c.subscribe(function(f) {
        if (e) {
          try {
            e = d(f, b++, c);
          } catch (g) {
            return void a.onError(g);
          }
          e ? a.onNext(f) : a.onCompleted();
        }
      }, function(b) {
        a.onError(b);
      }, function() {
        a.onCompleted();
      });
    }, c);
  };
  var kc = function(a) {
    function b(b, c, d) {
      this.source = b, this.predicate = Ba(c, d, 3), a.call(this);
    }
    return bb(b, a), b.prototype.subscribeCore = function(a) {
      return this.source.subscribe(new L(a, this.predicate, this));
    }, b.prototype.internalFilter = function(a, c) {
      var d = this;
      return new b(this.source, function(b, c, e) {
        return d.predicate(b, c, e) && a(b, c, e);
      }, c);
    }, b;
  }(Ob);
  L.prototype.onNext = function(a) {
    if (!this.isStopped) {
      var b = o(this.predicate).call(this, a, this.i++, this.source);
      return b === _a ? this.observer.onError(b.e) : void(b && this.observer.onNext(a));
    }
  }, L.prototype.onError = function(a) {
    this.isStopped || (this.isStopped = !0, this.observer.onError(a));
  }, L.prototype.onCompleted = function() {
    this.isStopped || (this.isStopped = !0, this.observer.onCompleted());
  }, L.prototype.dispose = function() {
    this.isStopped = !0;
  }, L.prototype.fail = function(a) {
    return this.isStopped ? !1 : (this.isStopped = !0, this.observer.onError(a), !0);
  }, Fb.filter = Fb.where = function(a, b) {
    return this instanceof kc ? this.internalFilter(a, b) : new kc(this, a, b);
  }, Mb.fromCallback = function(a, b, c) {
    return function() {
      for (var d = [],
          e = 0,
          f = arguments.length; f > e; e++)
        d.push(arguments[e]);
      return new tc(function(e) {
        function f() {
          var a = arguments;
          if (c) {
            try {
              a = c(a);
            } catch (b) {
              return e.onError(b);
            }
            e.onNext(a);
          } else
            a.length <= 1 ? e.onNext.apply(e, a) : e.onNext(a);
          e.onCompleted();
        }
        d.push(f), a.apply(b, d);
      }).publishLast().refCount();
    };
  }, Mb.fromNodeCallback = function(a, b, c) {
    return function() {
      for (var d = arguments.length,
          e = new Array(d),
          f = 0; d > f; f++)
        e[f] = arguments[f];
      return new tc(function(d) {
        function f(a) {
          if (a)
            return void d.onError(a);
          for (var b = arguments.length,
              e = [],
              f = 1; b > f; f++)
            e[f - 1] = arguments[f];
          if (c) {
            try {
              e = c(e);
            } catch (g) {
              return d.onError(g);
            }
            d.onNext(e);
          } else
            e.length <= 1 ? d.onNext.apply(d, e) : d.onNext(e);
          d.onCompleted();
        }
        e.push(f), a.apply(b, e);
      }).publishLast().refCount();
    };
  }, aa.config.useNativeEvents = !1, Mb.fromEvent = function(a, b, c) {
    return a.addListener ? lc(function(c) {
      a.addListener(b, c);
    }, function(c) {
      a.removeListener(b, c);
    }, c) : aa.config.useNativeEvents || "function" != typeof a.on || "function" != typeof a.off ? new tc(function(d) {
      return N(a, b, function(a) {
        var b = a;
        if (c)
          try {
            b = c(arguments);
          } catch (e) {
            return d.onError(e);
          }
        d.onNext(b);
      });
    }).publish().refCount() : lc(function(c) {
      a.on(b, c);
    }, function(c) {
      a.off(b, c);
    }, c);
  };
  var lc = Mb.fromEventPattern = function(a, b, c) {
    return new tc(function(d) {
      function e(a) {
        var b = a;
        if (c)
          try {
            b = c(arguments);
          } catch (e) {
            return d.onError(e);
          }
        d.onNext(b);
      }
      var f = a(e);
      return ib(function() {
        b && b(e, f);
      });
    }).publish().refCount();
  },
      mc = Mb.fromPromise = function(a) {
        return Qb(function() {
          var b = new aa.AsyncSubject;
          return a.then(function(a) {
            b.onNext(a), b.onCompleted();
          }, b.onError.bind(b)), b;
        });
      };
  Fb.toPromise = function(a) {
    if (a || (a = aa.config.Promise), !a)
      throw new sa("Promise type not provided nor in Rx.config.Promise");
    var b = this;
    return new a(function(a, c) {
      var d,
          e = !1;
      b.subscribe(function(a) {
        d = a, e = !0;
      }, c, function() {
        e && a(d);
      });
    });
  }, Mb.startAsync = function(a) {
    var b;
    try {
      b = a();
    } catch (c) {
      return _b(c);
    }
    return mc(b);
  }, Fb.multicast = function(a, b) {
    var c = this;
    return "function" == typeof a ? new tc(function(d) {
      var e = c.multicast(a());
      return new fb(b(e).subscribe(d), e.connect());
    }, c) : new nc(c, a);
  }, Fb.publish = function(a) {
    return a && ja(a) ? this.multicast(function() {
      return new wc;
    }, a) : this.multicast(new wc);
  }, Fb.share = function() {
    return this.publish().refCount();
  }, Fb.publishLast = function(a) {
    return a && ja(a) ? this.multicast(function() {
      return new xc;
    }, a) : this.multicast(new xc);
  }, Fb.publishValue = function(a, b) {
    return 2 === arguments.length ? this.multicast(function() {
      return new zc(b);
    }, a) : this.multicast(new zc(a));
  }, Fb.shareValue = function(a) {
    return this.publishValue(a).refCount();
  }, Fb.replay = function(a, b, c, d) {
    return a && ja(a) ? this.multicast(function() {
      return new Ac(b, c, d);
    }, a) : this.multicast(new Ac(b, c, d));
  }, Fb.shareReplay = function(a, b, c) {
    return this.replay(null, a, b, c).refCount();
  };
  {
    var nc = aa.ConnectableObservable = function(a) {
      function b(b, c) {
        var d,
            e = !1,
            f = b.asObservable();
        this.connect = function() {
          return e || (e = !0, d = new fb(f.subscribe(c), ib(function() {
            e = !1;
          }))), d;
        }, a.call(this, function(a) {
          return c.subscribe(a);
        });
      }
      return bb(b, a), b.prototype.refCount = function() {
        var a,
            b = 0,
            c = this;
        return new tc(function(d) {
          var e = 1 === ++b,
              f = c.subscribe(d);
          return e && (a = c.connect()), function() {
            f.dispose(), 0 === --b && a.dispose();
          };
        });
      }, b;
    }(Mb),
        oc = Mb.interval = function(a, b) {
          return R(a, a, ca(b) ? b : yb);
        };
    Mb.timer = function(b, c, d) {
      var e;
      return ca(d) || (d = yb), c !== a && "number" == typeof c ? e = c : ca(c) && (d = c), b instanceof Date && e === a ? O(b.getTime(), d) : b instanceof Date && e !== a ? (e = c, P(b.getTime(), e, d)) : e === a ? Q(b, d) : R(b, e, d);
    };
  }
  Fb.delay = function(a, b) {
    return ca(b) || (b = yb), a instanceof Date ? T(this, a.getTime(), b) : S(this, a, b);
  }, Fb.debounce = Fb.throttleWithTimeout = function(a, b) {
    ca(b) || (b = yb);
    var c = this;
    return new tc(function(d) {
      var e,
          f = new nb,
          g = !1,
          h = 0,
          i = c.subscribe(function(c) {
            g = !0, e = c, h++;
            var i = h,
                j = new mb;
            f.setDisposable(j), j.setDisposable(b.scheduleWithRelative(a, function() {
              g && h === i && d.onNext(e), g = !1;
            }));
          }, function(a) {
            f.dispose(), d.onError(a), g = !1, h++;
          }, function() {
            f.dispose(), g && d.onNext(e), d.onCompleted(), g = !1, h++;
          });
      return new fb(i, f);
    }, this);
  }, Fb.throttle = function(a, b) {
    return this.debounce(a, b);
  }, Fb.timestamp = function(a) {
    return ca(a) || (a = yb), this.map(function(b) {
      return {
        value: b,
        timestamp: a.now()
      };
    });
  }, Fb.sample = Fb.throttleLatest = function(a, b) {
    return ca(b) || (b = yb), "number" == typeof a ? U(this, oc(a, b)) : U(this, a);
  }, Fb.timeout = function(a, b, c) {
    (null == b || "string" == typeof b) && (b = _b(new Error(b || "Timeout"))), ca(c) || (c = yb);
    var d = this,
        e = a instanceof Date ? "scheduleWithAbsolute" : "scheduleWithRelative";
    return new tc(function(f) {
      function g() {
        var d = h;
        l.setDisposable(c[e](a, function() {
          h === d && (ia(b) && (b = mc(b)), j.setDisposable(b.subscribe(f)));
        }));
      }
      var h = 0,
          i = new mb,
          j = new nb,
          k = !1,
          l = new nb;
      return j.setDisposable(i), g(), i.setDisposable(d.subscribe(function(a) {
        k || (h++, f.onNext(a), g());
      }, function(a) {
        k || (h++, f.onError(a));
      }, function() {
        k || (h++, f.onCompleted());
      })), new fb(j, l);
    }, d);
  }, Fb.throttleFirst = function(a, b) {
    ca(b) || (b = yb);
    var c = +a || 0;
    if (0 >= c)
      throw new RangeError("windowDuration cannot be less or equal zero.");
    var d = this;
    return new tc(function(a) {
      var e = 0;
      return d.subscribe(function(d) {
        var f = b.now();
        (0 === e || f - e >= c) && (e = f, a.onNext(d));
      }, function(b) {
        a.onError(b);
      }, function() {
        a.onCompleted();
      });
    }, d);
  };
  var pc = function(a) {
    function b(a) {
      var b = this.source.publish(),
          c = b.subscribe(a),
          d = jb,
          e = this.pauser.distinctUntilChanged().subscribe(function(a) {
            a ? d = b.connect() : (d.dispose(), d = jb);
          });
      return new fb(c, d, e);
    }
    function c(c, d) {
      this.source = c, this.controller = new wc, this.pauser = d && d.subscribe ? this.controller.merge(d) : this.controller, a.call(this, b, c);
    }
    return bb(c, a), c.prototype.pause = function() {
      this.controller.onNext(!1);
    }, c.prototype.resume = function() {
      this.controller.onNext(!0);
    }, c;
  }(Mb);
  Fb.pausable = function(a) {
    return new pc(this, a);
  };
  var qc = function(b) {
    function c(b) {
      var c,
          d = [],
          e = V(this.source, this.pauser.distinctUntilChanged().startWith(!1), function(a, b) {
            return {
              data: a,
              shouldFire: b
            };
          }).subscribe(function(e) {
            if (c !== a && e.shouldFire != c) {
              if (c = e.shouldFire, e.shouldFire)
                for (; d.length > 0; )
                  b.onNext(d.shift());
            } else
              c = e.shouldFire, e.shouldFire ? b.onNext(e.data) : d.push(e.data);
          }, function(a) {
            for (; d.length > 0; )
              b.onNext(d.shift());
            b.onError(a);
          }, function() {
            for (; d.length > 0; )
              b.onNext(d.shift());
            b.onCompleted();
          });
      return e;
    }
    function d(a, d) {
      this.source = a, this.controller = new wc, this.pauser = d && d.subscribe ? this.controller.merge(d) : this.controller, b.call(this, c, a);
    }
    return bb(d, b), d.prototype.pause = function() {
      this.controller.onNext(!1);
    }, d.prototype.resume = function() {
      this.controller.onNext(!0);
    }, d;
  }(Mb);
  Fb.pausableBuffered = function(a) {
    return new qc(this, a);
  };
  var rc = function(a) {
    function b(a) {
      return this.source.subscribe(a);
    }
    function c(c, d) {
      a.call(this, b, c), this.subject = new sc(d), this.source = c.multicast(this.subject).refCount();
    }
    return bb(c, a), c.prototype.request = function(a) {
      return null == a && (a = -1), this.subject.request(a);
    }, c;
  }(Mb),
      sc = function(a) {
        function b(a) {
          return this.subject.subscribe(a);
        }
        function c(c) {
          null == c && (c = !0), a.call(this, b), this.subject = new wc, this.enableQueue = c, this.queue = c ? [] : null, this.requestedCount = 0, this.requestedDisposable = jb, this.error = null, this.hasFailed = !1, this.hasCompleted = !1;
        }
        return bb(c, a), cb(c.prototype, Ib, {
          onCompleted: function() {
            this.hasCompleted = !0, this.enableQueue && 0 !== this.queue.length ? this.queue.push(aa.Notification.createOnCompleted()) : this.subject.onCompleted();
          },
          onError: function(a) {
            this.hasFailed = !0, this.error = a, this.enableQueue && 0 !== this.queue.length ? this.queue.push(aa.Notification.createOnError(a)) : this.subject.onError(a);
          },
          onNext: function(a) {
            var b = !1;
            0 === this.requestedCount ? this.enableQueue && this.queue.push(aa.Notification.createOnNext(a)) : (-1 !== this.requestedCount && 0 === this.requestedCount-- && this.disposeCurrentRequest(), b = !0), b && this.subject.onNext(a);
          },
          _processRequest: function(a) {
            if (this.enableQueue) {
              for (; this.queue.length >= a && a > 0 || this.queue.length > 0 && "N" !== this.queue[0].kind; ) {
                var b = this.queue.shift();
                b.accept(this.subject), "N" === b.kind ? a-- : (this.disposeCurrentRequest(), this.queue = []);
              }
              return {
                numberOfItems: a,
                returnValue: 0 !== this.queue.length
              };
            }
            return {
              numberOfItems: a,
              returnValue: !1
            };
          },
          request: function(a) {
            this.disposeCurrentRequest();
            var b = this,
                c = this._processRequest(a),
                a = c.numberOfItems;
            return c.returnValue ? jb : (this.requestedCount = a, this.requestedDisposable = ib(function() {
              b.requestedCount = 0;
            }), this.requestedDisposable);
          },
          disposeCurrentRequest: function() {
            this.requestedDisposable.dispose(), this.requestedDisposable = jb;
          }
        }), c;
      }(Mb);
  Fb.controlled = function(a) {
    return null == a && (a = !0), new rc(this, a);
  }, Fb.transduce = function(a) {
    function b(a) {
      return {
        init: function() {
          return a;
        },
        step: function(a, b) {
          return a.onNext(b);
        },
        result: function(a) {
          return a.onCompleted();
        }
      };
    }
    var c = this;
    return new tc(function(d) {
      var e = a(b(d));
      return c.subscribe(function(a) {
        try {
          e.step(d, a);
        } catch (b) {
          d.onError(b);
        }
      }, d.onError.bind(d), function() {
        e.result(d);
      });
    }, c);
  };
  var tc = aa.AnonymousObservable = function(a) {
    function b(a) {
      return a && ja(a.dispose) ? a : ja(a) ? ib(a) : jb;
    }
    function c(a, c) {
      var d = c[0],
          e = c[1],
          f = o(e)(d);
      return f !== _a || d.fail(_a.e) ? void d.setDisposable(b(f)) : p(_a.e);
    }
    function d(b, d) {
      function e(a) {
        var d = new uc(a),
            e = [d, b];
        return tb.scheduleRequired() ? tb.scheduleWithState(e, c) : c(null, e), d;
      }
      this.source = d, a.call(this, e);
    }
    return bb(d, a), d;
  }(Mb),
      uc = function(a) {
        function b(b) {
          a.call(this), this.observer = b, this.m = new mb;
        }
        bb(b, a);
        var c = b.prototype;
        return c.next = function(a) {
          var b = o(this.observer.onNext).call(this.observer, a);
          b === _a && (this.dispose(), p(b.e));
        }, c.error = function(a) {
          var b = o(this.observer.onError).call(this.observer, a);
          this.dispose(), b === _a && p(b.e);
        }, c.completed = function() {
          var a = o(this.observer.onCompleted).call(this.observer);
          this.dispose(), a === _a && p(a.e);
        }, c.setDisposable = function(a) {
          this.m.setDisposable(a);
        }, c.getDisposable = function() {
          return this.m.getDisposable();
        }, c.dispose = function() {
          a.prototype.dispose.call(this), this.m.dispose();
        }, b;
      }(Kb),
      vc = function(a, b) {
        this.subject = a, this.observer = b;
      };
  vc.prototype.dispose = function() {
    if (!this.subject.isDisposed && null !== this.observer) {
      var a = this.subject.observers.indexOf(this.observer);
      this.subject.observers.splice(a, 1), this.observer = null;
    }
  };
  var wc = aa.Subject = function(a) {
    function c(a) {
      return lb(this), this.isStopped ? this.hasError ? (a.onError(this.error), jb) : (a.onCompleted(), jb) : (this.observers.push(a), new vc(this, a));
    }
    function d() {
      a.call(this, c), this.isDisposed = !1, this.isStopped = !1, this.observers = [], this.hasError = !1;
    }
    return bb(d, a), cb(d.prototype, Ib.prototype, {
      hasObservers: function() {
        return this.observers.length > 0;
      },
      onCompleted: function() {
        if (lb(this), !this.isStopped) {
          this.isStopped = !0;
          for (var a = 0,
              c = b(this.observers),
              d = c.length; d > a; a++)
            c[a].onCompleted();
          this.observers.length = 0;
        }
      },
      onError: function(a) {
        if (lb(this), !this.isStopped) {
          this.isStopped = !0, this.error = a, this.hasError = !0;
          for (var c = 0,
              d = b(this.observers),
              e = d.length; e > c; c++)
            d[c].onError(a);
          this.observers.length = 0;
        }
      },
      onNext: function(a) {
        if (lb(this), !this.isStopped)
          for (var c = 0,
              d = b(this.observers),
              e = d.length; e > c; c++)
            d[c].onNext(a);
      },
      dispose: function() {
        this.isDisposed = !0, this.observers = null;
      }
    }), d.create = function(a, b) {
      return new yc(a, b);
    }, d;
  }(Mb),
      xc = aa.AsyncSubject = function(a) {
        function c(a) {
          return lb(this), this.isStopped ? (this.hasError ? a.onError(this.error) : this.hasValue ? (a.onNext(this.value), a.onCompleted()) : a.onCompleted(), jb) : (this.observers.push(a), new vc(this, a));
        }
        function d() {
          a.call(this, c), this.isDisposed = !1, this.isStopped = !1, this.hasValue = !1, this.observers = [], this.hasError = !1;
        }
        return bb(d, a), cb(d.prototype, Ib, {
          hasObservers: function() {
            return lb(this), this.observers.length > 0;
          },
          onCompleted: function() {
            var a,
                c;
            if (lb(this), !this.isStopped) {
              this.isStopped = !0;
              var d = b(this.observers),
                  c = d.length;
              if (this.hasValue)
                for (a = 0; c > a; a++) {
                  var e = d[a];
                  e.onNext(this.value), e.onCompleted();
                }
              else
                for (a = 0; c > a; a++)
                  d[a].onCompleted();
              this.observers.length = 0;
            }
          },
          onError: function(a) {
            if (lb(this), !this.isStopped) {
              this.isStopped = !0, this.hasError = !0, this.error = a;
              for (var c = 0,
                  d = b(this.observers),
                  e = d.length; e > c; c++)
                d[c].onError(a);
              this.observers.length = 0;
            }
          },
          onNext: function(a) {
            lb(this), this.isStopped || (this.value = a, this.hasValue = !0);
          },
          dispose: function() {
            this.isDisposed = !0, this.observers = null, this.exception = null, this.value = null;
          }
        }), d;
      }(Mb),
      yc = aa.AnonymousSubject = function(a) {
        function b(a) {
          return this.observable.subscribe(a);
        }
        function c(c, d) {
          this.observer = c, this.observable = d, a.call(this, b);
        }
        return bb(c, a), cb(c.prototype, Ib.prototype, {
          onCompleted: function() {
            this.observer.onCompleted();
          },
          onError: function(a) {
            this.observer.onError(a);
          },
          onNext: function(a) {
            this.observer.onNext(a);
          }
        }), c;
      }(Mb),
      zc = aa.BehaviorSubject = function(a) {
        function c(a) {
          return lb(this), this.isStopped ? (this.hasError ? a.onError(this.error) : a.onCompleted(), jb) : (this.observers.push(a), a.onNext(this.value), new vc(this, a));
        }
        function d(b) {
          a.call(this, c), this.value = b, this.observers = [], this.isDisposed = !1, this.isStopped = !1, this.hasError = !1;
        }
        return bb(d, a), cb(d.prototype, Ib, {
          getValue: function() {
            if (lb(this), this.hasError)
              throw this.error;
            return this.value;
          },
          hasObservers: function() {
            return this.observers.length > 0;
          },
          onCompleted: function() {
            if (lb(this), !this.isStopped) {
              this.isStopped = !0;
              for (var a = 0,
                  c = b(this.observers),
                  d = c.length; d > a; a++)
                c[a].onCompleted();
              this.observers.length = 0;
            }
          },
          onError: function(a) {
            if (lb(this), !this.isStopped) {
              this.isStopped = !0, this.hasError = !0, this.error = a;
              for (var c = 0,
                  d = b(this.observers),
                  e = d.length; e > c; c++)
                d[c].onError(a);
              this.observers.length = 0;
            }
          },
          onNext: function(a) {
            if (lb(this), !this.isStopped) {
              this.value = a;
              for (var c = 0,
                  d = b(this.observers),
                  e = d.length; e > c; c++)
                d[c].onNext(a);
            }
          },
          dispose: function() {
            this.isDisposed = !0, this.observers = null, this.value = null, this.exception = null;
          }
        }), d;
      }(Mb),
      Ac = aa.ReplaySubject = function(a) {
        function c(a, b) {
          return ib(function() {
            b.dispose(), !a.isDisposed && a.observers.splice(a.observers.indexOf(b), 1);
          });
        }
        function d(a) {
          var b = new Nb(this.scheduler, a),
              d = c(this, b);
          lb(this), this._trim(this.scheduler.now()), this.observers.push(b);
          for (var e = 0,
              f = this.q.length; f > e; e++)
            b.onNext(this.q[e].value);
          return this.hasError ? b.onError(this.error) : this.isStopped && b.onCompleted(), b.ensureActive(), d;
        }
        function e(b, c, e) {
          this.bufferSize = null == b ? f : b, this.windowSize = null == c ? f : c, this.scheduler = e || tb, this.q = [], this.observers = [], this.isStopped = !1, this.isDisposed = !1, this.hasError = !1, this.error = null, a.call(this, d);
        }
        var f = Math.pow(2, 53) - 1;
        return bb(e, a), cb(e.prototype, Ib.prototype, {
          hasObservers: function() {
            return this.observers.length > 0;
          },
          _trim: function(a) {
            for (; this.q.length > this.bufferSize; )
              this.q.shift();
            for (; this.q.length > 0 && a - this.q[0].interval > this.windowSize; )
              this.q.shift();
          },
          onNext: function(a) {
            if (lb(this), !this.isStopped) {
              var c = this.scheduler.now();
              this.q.push({
                interval: c,
                value: a
              }), this._trim(c);
              for (var d = 0,
                  e = b(this.observers),
                  f = e.length; f > d; d++) {
                var g = e[d];
                g.onNext(a), g.ensureActive();
              }
            }
          },
          onError: function(a) {
            if (lb(this), !this.isStopped) {
              this.isStopped = !0, this.error = a, this.hasError = !0;
              var c = this.scheduler.now();
              this._trim(c);
              for (var d = 0,
                  e = b(this.observers),
                  f = e.length; f > d; d++) {
                var g = e[d];
                g.onError(a), g.ensureActive();
              }
              this.observers.length = 0;
            }
          },
          onCompleted: function() {
            if (lb(this), !this.isStopped) {
              this.isStopped = !0;
              var a = this.scheduler.now();
              this._trim(a);
              for (var c = 0,
                  d = b(this.observers),
                  e = d.length; e > c; c++) {
                var f = d[c];
                f.onCompleted(), f.ensureActive();
              }
              this.observers.length = 0;
            }
          },
          dispose: function() {
            this.isDisposed = !0, this.observers = null;
          }
        }), e;
      }(Mb);
  aa.Pauser = function(a) {
    function b() {
      a.call(this);
    }
    return bb(b, a), b.prototype.pause = function() {
      this.onNext(!1);
    }, b.prototype.resume = function() {
      this.onNext(!0);
    }, b;
  }(wc), "function" == typeof define && "object" == typeof define.amd && define.amd ? (X.Rx = aa, System.register("github:Reactive-Extensions/RxJS@2.4.6/dist/rx.lite.min", [], false, function() {
    return aa;
  })) : Y && Z ? $ ? (Z.exports = aa).Rx = aa : Y.Rx = aa : X.Rx = aa;
  var Bc = g();
}).call(this);
})();
System.register("src/js/stages/Stage", [], function($__export) {
  "use strict";
  var __moduleName = "src/js/stages/Stage";
  var Stage;
  return {
    setters: [],
    execute: function() {
      Stage = (function() {
        var Stage = function Stage(game, type) {
          if (!game)
            console.error('You forgot send game object.');
          this.game = game;
          this.isStarted = false;
          this.subscriptors = {};
          this.canBeStart = type === 'dynamic';
          this.game.ctx.font = "30px Open Sans";
          this.game.ctx.fillStyle = '#00000';
        };
        return ($traceurRuntime.createClass)(Stage, {
          start: function() {
            if (!this.canBeStart)
              return console.error('Stage is not dynamically.');
            this.isStarted = true;
            this.loopSubscription = this.game.gameLoopStream.subscribe(this.render.bind(this), this.errorHandler.bind(this), this.onComplete.bind(this));
          },
          stop: function() {
            var $__0 = this;
            return new Promise((function(resolve, reject) {
              $__0.isStarted = false;
              if ($__0.loopSubscription && $__0.loopSubscription.dispose)
                $__0.loopSubscription.dispose();
              for (var key in $__0.subscriptors) {
                $__0.subscriptors[key].dispose();
              }
              resolve();
            }));
          },
          errorHandler: function(err) {
            console.error(err);
          },
          clear: function() {
            this.game.ctx.clearRect(0, 0, this.game.width, this.game.height);
          },
          preRender: function() {},
          render: function() {},
          update: function() {},
          onComplete: function() {}
        }, {});
      }());
      $__export('default', Stage);
    }
  };
});

System.register("src/js/stages/EndStage", ["src/js/stages/Stage", "src/js/stages/PlayStage"], function($__export) {
  "use strict";
  var __moduleName = "src/js/stages/EndStage";
  var Stage,
      PlayStage,
      EndStage;
  return {
    setters: [function($__m) {
      Stage = $__m.default;
    }, function($__m) {
      PlayStage = $__m.default;
    }],
    execute: function() {
      EndStage = (function($__super) {
        var EndStage = function EndStage(game, type) {
          $traceurRuntime.superConstructor(EndStage).call(this, game, type);
        };
        return ($traceurRuntime.createClass)(EndStage, {
          render: function() {
            this.clear();
            this.game.ctx.font = "30px Open Sans";
            this.game.ctx.textBaseline = "center";
            this.game.ctx.textAlign = "center";
            this.game.ctx.fillText("You are " + this.game.endMessage, this.game.width / 2, this.game.height / 2 - 40);
            this.game.ctx.font = "16px Open Sans";
            this.game.ctx.fillText("You scored: " + this.game.scores, this.game.width / 2, this.game.height / 2);
            this.game.ctx.fillText("Press 'Space' to start a new game.", this.game.width / 2, this.game.height / 2 + 20);
          },
          reset: function() {
            this.subscriptors.keyDown = this.game.keyDownStream.subscribe(this.keyDownHandler.bind(this), this.errorHandler);
            return this;
          },
          keyDownHandler: function(e) {
            if (e.which == 32) {
              this.stop();
              this.game.addStage(PlayStage, 'dynamic').reset().start();
            }
          }
        }, {}, $__super);
      }(Stage));
      $__export('default', EndStage);
    }
  };
});

System.register("src/js/gamers/Gamer", [], function($__export) {
  "use strict";
  var __moduleName = "src/js/gamers/Gamer";
  var Gamer;
  return {
    setters: [],
    execute: function() {
      Gamer = (function() {
        var Gamer = function Gamer(game, x, y, width, height) {
          if (!game)
            console.error('You forgot send game object.');
          this.game = game;
          this.x = x || 0;
          this.y = y || 0;
          this.width = width || 20;
          this.height = height || 20;
          this.color = '#000';
        };
        return ($traceurRuntime.createClass)(Gamer, {
          render: function() {
            this.setColor();
            this.game.ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
          },
          setColor: function() {
            this.game.ctx.fillStyle = this.color;
          },
          hitTest: function(object) {
            return (this.x < object.x + object.width && this.x + this.width > object.x && this.y < object.y + object.height && this.y + this.height > object.y);
          }
        }, {});
      }());
      $__export('default', Gamer);
    }
  };
});

System.register("src/js/gamers/Laser", ["src/js/gamers/Gamer"], function($__export) {
  "use strict";
  var __moduleName = "src/js/gamers/Laser";
  var Gamer,
      Laser;
  return {
    setters: [function($__m) {
      Gamer = $__m.default;
    }],
    execute: function() {
      Laser = (function($__super) {
        var Laser = function Laser(game, x, y, w, h, s) {
          $traceurRuntime.superConstructor(Laser).call(this, game, x, y, w, h);
          this.color = "red";
          this.speed = s || 7;
        };
        return ($traceurRuntime.createClass)(Laser, {}, {}, $__super);
      }(Gamer));
      $__export('default', Laser);
    }
  };
});

System.register("src/js/gamers/Bomb", ["src/js/gamers/Gamer"], function($__export) {
  "use strict";
  var __moduleName = "src/js/gamers/Bomb";
  var Gamer,
      Bomb;
  return {
    setters: [function($__m) {
      Gamer = $__m.default;
    }],
    execute: function() {
      Bomb = (function($__super) {
        var Bomb = function Bomb(game, x, y, w, h, s) {
          $traceurRuntime.superConstructor(Bomb).call(this, game, x, y, w, h);
          this.color = "blue";
          this.speed = s || 8;
        };
        return ($traceurRuntime.createClass)(Bomb, {}, {}, $__super);
      }(Gamer));
      $__export('default', Bomb);
    }
  };
});

System.register("src/js/Sounds", [], function($__export) {
  "use strict";
  var __moduleName = "src/js/Sounds";
  var Sounds;
  return {
    setters: [],
    execute: function() {
      Sounds = (function() {
        var Sounds = function Sounds() {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          if (!this.audioContext)
            console.error('Sorry. Your browser is not support audio technology.');
          this.source = this.audioContext.createBufferSource();
          this.sounds = {};
        };
        return ($traceurRuntime.createClass)(Sounds, {
          loadSound: function(name, url) {
            var $__0 = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = (function() {
              var audioData = xhr.response;
              $__0.audioContext.decodeAudioData(audioData, (function(buffer) {
                $__0.sounds[name] = {buffer: buffer};
              }), (function(e) {
                return "Error with decoding audio data" + e.err;
              }));
            });
            xhr.send();
            return this;
          },
          playSound: function(name) {
            if (this.sounds[name] === undefined || this.sounds[name] === null) {
              return ;
            }
            var source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name].buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
          }
        }, {});
      }());
      $__export('default', Sounds);
    }
  };
});

System.register("src/js/gamers/Ship", ["src/js/gamers/Gamer", "src/js/gamers/Laser"], function($__export) {
  "use strict";
  var __moduleName = "src/js/gamers/Ship";
  var Gamer,
      Laser,
      Ship;
  return {
    setters: [function($__m) {
      Gamer = $__m.default;
    }, function($__m) {
      Laser = $__m.default;
    }],
    execute: function() {
      Ship = (function($__super) {
        var Ship = function Ship(game, x, y, w, h, s) {
          var $__0;
          $traceurRuntime.superConstructor(Ship).call(this, game, x, y, w, h);
          this.speed = s || 10;
          this.img = new Image();
          this.img.onload = ($__0 = this, function() {
            $__0.game.ctx.drawImage($__0.img, $__0.x, $__0.y);
          });
          this.img.src = './src/images/ship.png';
        };
        return ($traceurRuntime.createClass)(Ship, {
          moveLeft: function() {
            this.x -= this.speed;
          },
          moveRight: function() {
            this.x += this.speed;
          },
          fire: function(stage) {
            stage.lasers.push(new Laser(this.game, this.x + 13, this.y, 2, 6));
            this.game.sounds.playSound('shoot');
          },
          render: function() {
            this.game.ctx.drawImage(this.img, this.x, this.y);
          }
        }, {}, $__super);
      }(Gamer));
      $__export('default', Ship);
    }
  };
});

System.register("src/js/gamers/Invader", ["src/js/gamers/Gamer", "src/js/gamers/Bomb"], function($__export) {
  "use strict";
  var __moduleName = "src/js/gamers/Invader";
  var Gamer,
      Bomb,
      Invader;
  return {
    setters: [function($__m) {
      Gamer = $__m.default;
    }, function($__m) {
      Bomb = $__m.default;
    }],
    execute: function() {
      Invader = (function($__super) {
        var Invader = function Invader(game, x, y, w, h) {
          var $__0;
          $traceurRuntime.superConstructor(Invader).call(this, game, x, y, w, h);
          this.vilocityX = 40;
          this.vilocityY = 0;
          this.img = new Image();
          this.img.onload = ($__0 = this, function() {
            $__0.game.ctx.drawImage($__0.img, $__0.x, $__0.y);
          });
          this.img.src = './src/images/invader.png';
        };
        return ($traceurRuntime.createClass)(Invader, {
          fire: function(stage) {
            stage.bombs.push(new Bomb(this.game, this.x, this.y, 6, 6));
            this.game.sounds.playSound('bang');
          },
          render: function() {
            this.game.ctx.drawImage(this.img, this.x, this.y);
          }
        }, {}, $__super);
      }(Gamer));
      $__export('default', Invader);
    }
  };
});

System.register("src/js/stages/PlayStage", ["src/js/stages/Stage", "src/js/stages/EndStage", "src/js/gamers/Ship", "src/js/gamers/Invader"], function($__export) {
  "use strict";
  var __moduleName = "src/js/stages/PlayStage";
  var Stage,
      EndStage,
      Ship,
      Invader,
      PlayStage;
  return {
    setters: [function($__m) {
      Stage = $__m.default;
    }, function($__m) {
      EndStage = $__m.default;
    }, function($__m) {
      Ship = $__m.default;
    }, function($__m) {
      Invader = $__m.default;
    }],
    execute: function() {
      PlayStage = (function($__super) {
        var PlayStage = function PlayStage(game, type, invadersCount) {
          $traceurRuntime.superConstructor(PlayStage).call(this, game, type);
          this.keyDownSubscription = game.keyDownStream.subscribe(this.keyDownHandler.bind(this), this.errorHandler);
          this.ship = new Ship(game, game.width / 2, game.gameBounds.bottom - 20, 30, 20);
          this.reset();
        };
        return ($traceurRuntime.createClass)(PlayStage, {
          reset: function() {
            this.game.scores = 0;
            this.game.lives = 3;
            this.lasers = [];
            this.bombs = [];
            this.invaders = [];
            this.invadersData = {
              lines: 10,
              rows: 5,
              speed: 100,
              velocity: {
                x: 100,
                y: 0
              },
              nextVelocity: {
                x: -100,
                y: 0
              },
              hits: {
                r: false,
                b: false,
                l: false
              },
              areDropping: false,
              currentDropDistance: 0
            };
            for (var i = 0; i < this.invadersData.rows; i++) {
              for (var j = 0; j < this.invadersData.lines; j++) {
                this.invaders.push(new Invader(this.game, (this.game.width / 2) + ((this.invadersData.lines / 2 - j) * 200 / this.invadersData.lines), (this.game.gameBounds.top + 20 + i * 16), 18, 14));
              }
            }
            return this;
          },
          preRender: function() {
            this.updateInvaders();
            this.updateLasers();
            this.updateBombs();
            this.gameEndCheck();
          },
          render: function() {
            this.preRender();
            this.clear();
            this.ship.render();
            this.invaders.forEach((function(invader) {
              return invader.render();
            }));
            this.lasers.forEach((function(laser) {
              return laser.render();
            }));
            this.bombs.forEach((function(bomb) {
              return bomb.render();
            }));
            this.renderInfo();
          },
          updateInvaders: function() {
            var $__0 = this;
            var dt = 1 / this.game.opts.fps;
            var id = this.invadersData;
            this.invaders.forEach((function(invader) {
              var newX = invader.x + id.velocity.x * dt;
              var newY = invader.y + id.velocity.y * dt;
              if (!id.hits.l && newX < $__0.game.gameBounds.left + 20) {
                id.hits.l = true;
              } else if (newX > $__0.game.gameBounds.right - 20) {
                id.hits.r = true;
              } else if (newY > $__0.game.gameBounds.bottom - 20) {
                id.hits.b = true;
              }
              invader.x = newX;
              invader.y = newY;
            }));
            if (id.areDropping) {
              id.currentDropDistance += id.velocity.y * dt;
              if (id.currentDropDistance >= 50) {
                id.areDropping = false;
                id.velocity = id.nextVelocity;
                id.currentDropDistance = 0;
                id.hits.l = false;
                id.hits.r = false;
              }
            }
            if (id.hits.l || id.hits.r) {
              id.velocity = {
                x: 0,
                y: id.speed
              };
              id.areDropping = true;
              id.nextVelocity = {
                x: id.hits.r ? -id.speed : id.speed,
                y: 0
              };
            }
            if (id.hits.b)
              this.game.lives = 0;
            var invader = this.invaders[Math.round(Math.random() * this.invaders.length)];
            if (Math.round(Math.random() * 1000) > 990) {
              if (invader && invader.fire)
                invader.fire(this);
            }
          },
          updateLasers: function() {
            var $__0 = this;
            var dt = 1 / this.game.opts.fps;
            this.lasers.forEach((function(laser, key) {
              laser.y -= laser.speed;
              if (laser.y < $__0.game.gameBounds.top + 20)
                $__0.lasers.splice(key, 1);
              $__0.invaders.forEach((function(invader, k) {
                if (laser.hitTest(invader)) {
                  $__0.lasers.splice(key, 1);
                  $__0.invaders.splice(k, 1);
                  $__0.game.sounds.playSound('kill');
                  $__0.game.scores += 5;
                }
              }));
            }));
          },
          updateBombs: function() {
            var $__0 = this;
            var dt = 1 / this.game.opts.fps;
            this.bombs.forEach((function(bomb, key) {
              bomb.y += bomb.speed;
              if (bomb.y > $__0.game.gameBounds.bottom)
                $__0.bombs.splice(key, 1);
              if (bomb.hitTest($__0.ship)) {
                $__0.bombs.splice(key, 1);
                $__0.game.sounds.playSound('explosion');
                $__0.game.lives--;
              }
            }));
          },
          keyDownHandler: function(e) {
            if (e.which == 32) {
              this.ship.fire(this);
            }
            if (e.which == 37 && this.ship.x > (this.game.gameBounds.left + 20)) {
              this.ship.moveLeft();
            }
            if (e.which == 39 && this.ship.x < (this.game.gameBounds.right - 20)) {
              this.ship.moveRight();
            }
          },
          gameEndCheck: function() {
            var $__0 = this;
            if (this.game.lives === 0) {
              this.stop().then((function() {
                $__0.game.endMessage = 'lose(';
                $__0.game.addStage(EndStage, 'static').reset().render();
              }));
            }
            if (this.invaders.length === 0) {
              this.stop().then((function() {
                $__0.game.endMessage = 'win!';
                $__0.game.addStage(EndStage, 'static').reset().render();
              }));
            }
          },
          renderInfo: function() {
            var textYpos = this.game.gameBounds.bottom + ((this.game.height - this.game.gameBounds.bottom) / 2) - 30 / 2;
            this.game.ctx.font = "14px Arial";
            this.game.ctx.fillStyle = '#000';
            var info = "Lives: " + this.game.lives;
            this.game.ctx.textAlign = "left";
            this.game.ctx.fillText(info, this.game.gameBounds.left + 20, textYpos);
            info = "Score: " + this.game.scores;
            this.game.ctx.textAlign = "right";
            this.game.ctx.fillText(info, this.game.gameBounds.right - 20, textYpos);
          }
        }, {}, $__super);
      }(Stage));
      $__export('default', PlayStage);
    }
  };
});

System.register("src/js/stages/WelcomeStage", ["src/js/stages/Stage", "src/js/stages/PlayStage"], function($__export) {
  "use strict";
  var __moduleName = "src/js/stages/WelcomeStage";
  var Stage,
      PlayStage,
      WelcomeStage;
  return {
    setters: [function($__m) {
      Stage = $__m.default;
    }, function($__m) {
      PlayStage = $__m.default;
    }],
    execute: function() {
      WelcomeStage = (function($__super) {
        var WelcomeStage = function WelcomeStage(game, type) {
          $traceurRuntime.superConstructor(WelcomeStage).call(this, game, type);
          this.subscriptors.keyDown = game.keyDownStream.subscribe(this.keyDownHandler.bind(this), this.errorHandler);
        };
        return ($traceurRuntime.createClass)(WelcomeStage, {
          render: function() {
            this.clear();
            this.game.ctx.textBaseline = "center";
            this.game.ctx.textAlign = "center";
            this.game.ctx.fillText("Space Invaders", this.game.width / 2, this.game.height / 2 - 40);
            this.game.ctx.font = "16px Open Sans";
            this.game.ctx.fillText("Press 'Space' to start.", this.game.width / 2, this.game.height / 2);
          },
          keyDownHandler: function(e) {
            if (e.which == 32) {
              this.game.addStage(PlayStage, 'dynamic').start();
              this.stop();
            }
          }
        }, {}, $__super);
      }(Stage));
      $__export('default', WelcomeStage);
    }
  };
});

System.register("src/js/Game", ["github:Reactive-Extensions/RxJS@2.4.6/dist/rx.lite.min", "src/js/stages/WelcomeStage", "src/js/Sounds"], function($__export) {
  "use strict";
  var __moduleName = "src/js/Game";
  var Rx,
      WelcomeStage,
      Sounds,
      Game;
  return {
    setters: [function($__m) {
      Rx = $__m.default;
    }, function($__m) {
      WelcomeStage = $__m.default;
    }, function($__m) {
      Sounds = $__m.default;
    }],
    execute: function() {
      Game = (function() {
        var Game = function Game(opts) {
          this.opts = opts;
          this.lives = 3;
          this.scores = 0;
          this.level = 1;
          this.stages = {};
          this.sounds = new Sounds().loadSound('shoot', './src/sounds/shoot.wav').loadSound('bang', './src/sounds/bang.wav').loadSound('explosion', './src/sounds/explosion.wav').loadSound('kill', './src/sounds/kill.wav');
          this.keyDownStream = Rx.Observable.fromEvent(document.body, 'keydown').filter((function(e) {
            return -1 != opts.controls.indexOf(e.which);
          })).map((function(e) {
            return {
              which: e.which,
              type: e.type
            };
          }));
          this.gameLoopStream = Rx.Observable.timer(1, 1000 / this.opts.fps).timestamp();
        };
        return ($traceurRuntime.createClass)(Game, {
          initialize: function(gameCanvas) {
            if (!gameCanvas)
              return console.error('Canvas is missing.');
            gameCanvas.width = 800;
            gameCanvas.height = 600;
            this.width = gameCanvas.width;
            this.height = gameCanvas.height;
            this.gameCanvas = gameCanvas;
            this.ctx = gameCanvas.getContext('2d');
            this.gameBounds = {
              left: 0,
              right: 800,
              top: 0,
              bottom: 600
            };
            return this;
          },
          start: function() {
            this.lives = 3;
            this.currentStage = this.addStage(WelcomeStage, 'static').render();
          },
          addStage: function(stage, type) {
            var name = stage.prototype.constructor.name;
            if (!this.stages[name]) {
              this.stages[name] = new stage(this, type);
            }
            return this.stages[name];
          }
        }, {});
      }());
      $__export('default', new Game({
        fps: 60,
        controls: [32, 37, 39]
      }));
    }
  };
});

System.register("src/js/main", ["src/js/Game"], function($__export) {
  "use strict";
  var __moduleName = "src/js/main";
  var Game,
      canvas;
  return {
    setters: [function($__m) {
      Game = $__m.default;
    }],
    execute: function() {
      canvas = document.getElementById('game-canvas');
      if (canvas.getContext) {
        Game.initialize(canvas).start();
      } else {
        alert('Sorry.Your browser not support canvas technology...');
      }
      $__export('default', {});
    }
  };
});

});
//# sourceMappingURL=bundle.js.map