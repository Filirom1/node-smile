var assert = require("chai").assert;
var buffertools = require("buffertools");
var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;
var Parser = require("../lib/Parser");


describe('HandleSignature', function(){
  it('Should emit an error if starting with a wrong signature', function(){
    var buffer = new Buffer(":( xxxx");
    var emiter = new Parser();
    var spy = sinon.spy();
    emiter.on('error', spy);
    emiter.parseBuffer(buffer);
    assert.calledWith('error');
  })
})
