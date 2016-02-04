"use strict";

var assert = require("chai");
var abpAdDomains = require("../src/abpAdDomains.js");

describe('AdDomains', function() {
  describe('#adDomains', function() {

    it("should exist", function() {
      assert.isDefined(undefined, abpAdDomains);
    });
  
    it("should contain adDomains", function() {
      assert.isDefined(adDomains);
    });

    it("should be an array", function() {
      assert.isArray(adDomains);
    });

    it("should be longer than zero", function() {
      assert.assert(adDomains.length > 0);
    });

  });
});
