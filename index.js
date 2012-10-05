var util = require('util');
var stream = require('stream');
var SmileConstants = require('./Constants');

function SmileParser(stream) {
  this.stream = stream;
  this.inputPtr = 0;
}

/**
 * Helper method called when it looks like input might contain the signature;
 * and it is necessary to detect and handle signature to get configuration
 * information it might have.
 * 
 * @return True if valid signature was found and handled; false if not
 */
SmileParser.prototype.handleSignature = function(consumeFirstByte){
  if(consumeFirstByte) ++ this._inputPtr;

  if(this._inputBuffer[this._inputPtr] != SmileConstants.HEADER_BYTE_2){
    this.emit('error', "Malformed content: signature not valid, starts with 0x3a but followed by 0x" + this._inputBuffer[this._inputPtr].toStrin(16));
    return false;
  }
};

module.exports = SmileParser;

