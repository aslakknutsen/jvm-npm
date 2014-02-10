// Make the native require function look in our local directory
// for modules loaded with NativeRequire.require()
var cwd = [java.lang.System.getProperty('user.dir'), 
           'src/test/javascript/specs'].join('/');

require.pushLoadPath(cwd);

// Load the NPM module loader into the global scope
load('src/main/javascript/npm_modules.js');

// Tell require where it's root is
require.root = cwd;

describe("NativeRequire", function() {

  it("should be a global object", function(){
    expect(typeof NativeRequire).toBe('object');
  });

  it("should expose DynJS' builtin require() function", function(){
    expect(typeof NativeRequire.require).toBe('function');
    var f = NativeRequire.require('./lib/native_test_module');
    expect(f).toBe("Foo!");
    expect(NativeRequire.require instanceof org.dynjs.runtime.builtins.Require)
      .toBe(true);
  });

});

describe("NPM global require()", function() {

  it("should be a function", function() {
    expect(typeof require).toBe('function');
  });

  it("should have a resolve() property that is a function", function() {
    expect(typeof require.resolve).toBe('function');
  });

  it("should have a cache property that is an Object", function() {
    expect(typeof require.cache).toBe('object');
  });

  it("should have an extensions property that is an Object", function() {
    expect(typeof require.extensions).toBe('object');
  });

  it("should find and load files with a .js extension", function() {
    // Ensure that the npm require() is not using NativeRequire
    var that=this;
    NativeRequire.require = function() {
      that.fail("NPM require() should not use DynJS native require");
    };
    expect(require('./lib/native_test_module')).toBe("Foo!");
  });

  it("should throw an Error if a file can't be found", function() {
    expect(function() {require('./not_found.js');}).toThrow(new Error('Cannot find module ./not_found.js'));
    try {
      require('./not_found.js');
    } catch(e) {
      expect(e.code).toBe('MODULE_NOT_FOUND');
    }
  });

  it("should support nested requires", function() {
    var outer = require('./lib/outer');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should support an ID with an extension", function() {
    var outer = require('./lib/outer.js');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should return the a .json file as a JSON object", function() {
    var json = require('./lib/some_data.json');
    expect(json.description).toBe("This is a JSON file");
    expect(json.data).toEqual([1,2,3]);
  });

  it("should cache modules in require.cache", function() {
    var outer = require('./lib/outer.js');
    expect(require.cache[outer.filename]).toBe(outer);
  });

  describe("folders as modules", function() {
    it("should find package.json in a module folder", function() {
      var package = require('./lib/other_package');
      expect(package.flavor).toBe('cool ranch');
      expect(package.subdir).toBe([cwd, 'lib/other_package/lib/subdir'].join('/'));
    });

    it("should find index.js in a directory, if no package.json exists", function() {
      var package = require('./lib/my_package');
      expect(package.data).toBe('Hello!');
    });
  });

});

describe("NPM Module execution context", function() {

  it("should have a __dirname property", function() {
    var top = require('./lib/simple_module');
    expect(top.dirname).toBe([cwd, 'lib'].join('/'));
  });

  it("should have a __filename property", function() {
    var top = require('./lib/simple_module');
    expect(top.filename).toBe([cwd, 'lib/simple_module.js'].join('/'));
  });

  it("should not expose private module functions globally", function() {
    var top = require('./lib/simple_module');
    expect(top.privateFunction).toBe(undefined);
  });

  it("should have a parent property", function() {
    var outer = require('./lib/outer');
    expect(outer.innerParent.id).toBe([cwd, 'lib/outer.js'].join('/'));
  });

  it("should have a filename property", function() {
    var outer = require('./lib/outer');
    expect(outer.filename).toBe([cwd, 'lib/outer.js'].join('/'));
  });

  it("should have a children property", function() {
    var outer = require('./lib/outer');
    expect(outer.children.length).toBe(1);
    expect(outer.children[0].id).toBe([cwd, 'lib/sub/inner.js'].join('/'));
  });

  it("should support setting the 'free' exports variable", function() {
    var modExports = require('./lib/mod_exports');
    expect(modExports.data).toBe("Hello!");
  });

});


