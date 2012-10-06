var chai = require("chai");
var buffertools = require("buffertools");
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var EventEmitter = require('events').EventEmitter;
var Parser = require("../lib/Parser");
var expect = chai.expect;
chai.use(sinonChai);

describe('HandleSignature', function(){
  it('Should emit an error if starting with a wrong signature', function(){
    var buffer = new Buffer(":( xxxx");
    var emiter = new Parser();
    var spy = sinon.spy();
    emiter.on('error', spy);
    //emiter.on('error', function(){ console.log(arguments); });
    emiter.parseBuffer(buffer);
    expect(spy).to.have.been.called;
  })
})
