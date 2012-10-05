var util = require('util');
var stream = require('stream');
var through = require('through');
_ = require('underscore');
var buffertools = require("buffertools");
var SmileConstants = require('./Constants');
var JsonToken = require('./JsonToken');
var WritableBufferStream = buffertools.WritableBufferStream;

var NO_STRINGS = "";

var NR_UNKNOWN = "???"

function SmileParser() {
  this.inputPtr = 0;

  //TODO implement
  this._parsingContext = {
    inObject: function(){ return false }
  };

  return _.extend(this, through(this.parseBuffer, this.end));
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
    this.emit('error', "Malformed content: signature not valid, starts with 0x3a but followed by 0x" + this._inputBuffer[this._inputPtr].toString(16) + ", not 0x29");
    return false;
  }

  if(this._inputBuffer[this._inputPtr] != SmileConstants.HEADER_BYTE_3){
    this.emit('error', "Malformed content: signature not valid, starts with 0x3a, 0x29, but followed by 0x" + this._inputBuffer[this._inputPtr].toString(16) + ", not 0xA");
    return false;
  }

  var ch = _inputBuffer[_inputPtr++];
  var versionBits = (ch >> 4) & 0x0F;

  if (versionBits != SmileConstants.HEADER_VERSION_0) {
    this.emit('error', "Header version number bits (0x" + versionBits.toString(16) +") indicate unrecognized version; only 0x0 handled by parser");
    return false;
  }

  // can avoid tracking names, if explicitly disabled
  if ((ch & SmileConstants.HEADER_BIT_HAS_SHARED_NAMES) == 0) {
    this._seenNames = null;
    this._seenNameCount = -1;
  }

  // conversely, shared string values must be explicitly enabled
  if ((ch & SmileConstants.HEADER_BIT_HAS_SHARED_STRING_VALUES) != 0) {
    this._seenStringValues = NO_STRINGS;
    this._seenStringValueCount = 0;
  }
  this._mayContainRawBinary = ((ch & SmileConstants.HEADER_BIT_HAS_RAW_BINARY) != 0);
  return true;
};


SmileParser.prototype.nextToken = function(){
  this._numTypesValid = NR_UNKNOWN;

  // For longer tokens (text, binary), we'll only read when requested
  if (this._tokenIncomplete) {
    this._skipIncomplete();
  }

  this._tokenInputTotal = this._currInputProcessed + this._inputPtr;

  // also: clear any data retained so far
  this._binaryValue = null;

  // Two main modes: values, and field names.
  if (this._parsingContext.inObject() && this._currToken != JsonToken.FIELD_NAME) {
    return (this._currToken = this._handleFieldName());
  }

  var ch = this._inputBuffer[this._inputPtr++];
  this._typeByte = ch;
  switch ((ch >> 5) & 0x7) {
    case 0: // short shared string value reference
      if (ch == 0) { // important: this is invalid, don't accept
      this.emit("error", "Invalid token byte 0x00");
    }
    return this._handleSharedString(ch - 1);
    case 1: // simple literals, numbers
      {
      var typeBits = ch & 0x1F;
      if (typeBits < 4) {
        switch (typeBits) {
          case 0x00:
            this._textBuffer.resetWithEmpty();
          return (this._currToken = JsonToken.VALUE_STRING);
          case 0x01:
            return (this._currToken = JsonToken.VALUE_NULL);
          case 0x02: // false
            return (this._currToken = JsonToken.VALUE_FALSE);
          default: // 0x03 == true
            return (this._currToken = JsonToken.VALUE_TRUE);
        }
      }
      // next 3 bytes define subtype
      if (typeBits < 8) { // VInt (zigzag), BigInteger
        if ((typeBits & 0x3) <= 0x2) { // 0x3 reserved (should never occur)
          this._tokenIncomplete = true;
          this._numTypesValid = 0;
          return (this._currToken = JsonToken.VALUE_NUMBER_INT);
        }
        break;
      }
      if (typeBits < 12) { // floating-point
        var subtype = typeBits & 0x3;
        if (subtype <= 0x2) { // 0x3 reserved (should never occur)
          this._tokenIncomplete = true;
          this._numTypesValid = 0;
          this._got32BitFloat = (subtype == 0);
          return (this._currToken = JsonToken.VALUE_NUMBER_FLOAT);
        }
        break;
      }
      if (typeBits == 0x1A) { // == 0x3A == ':' -> possibly header signature for next chunk?
        if (this.handleSignature(false, false)) {
          /* Ok, now; end-marker and header both imply doc boundary and a
           * 'null token'; but if both are seen, they are collapsed.
           * We can check this by looking at current token; if it's null,
           * need to get non-null token
           */
          if (this._currToken == null) {
            return this.nextToken();
          }
          return (this._currToken = null);
        }
      }
      this.emit("error", "Unrecognized token byte 0x3A (malformed segment header?");
    }
    // and everything else is reserved, for now
    break;
    case 2: // tiny ASCII
    // fall through
    case 3: // short ASCII
    // fall through
    case 4: // tiny Unicode
    // fall through
    case 5: // short Unicode
      // No need to decode, unless we have to keep track of back-references (for shared string values)
      this._currToken = JsonToken.VALUE_STRING;
      if (this._seenStringValueCount >= 0) { // shared text values enabled
        this._addSeenStringValue();
      } else {
        this._tokenIncomplete = true;
      }
    return this._currToken;
    case 6: // small integers; zigzag encoded
      this._numberInt = SmileUtil.zigzagDecode(ch & 0x1F);
      this._numTypesValid = NR_INT;
      return (this._currToken = JsonToken.VALUE_NUMBER_INT);
    case 7: // binary/long-text/long-shared/start-end-markers
      switch (ch & 0x1F) {
      case 0x00: // long variable length ASCII
        case 0x04: // long variable length unicode
        this._tokenIncomplete = true;
      return (this._currToken = JsonToken.VALUE_STRING);
      case 0x08: // binary, 7-bit
        this._tokenIncomplete = true;
      return (this._currToken = JsonToken.VALUE_EMBEDDED_OBJECT);
      case 0x0C: // long shared string
        case 0x0D:
        case 0x0E:
        case 0x0F:
          if (this._inputPtr >= this._inputEnd) {
          this.loadMoreGuaranteed();
      }
      return this._handleSharedString(((ch & 0x3) << 8) + (this._inputBuffer[this._inputPtr++] & 0xFF));
      case 0x18: // START_ARRAY
        this._parsingContext = this._parsingContext.createChildArrayContext(-1, -1);
      return (this._currToken = JsonToken.START_ARRAY);
      case 0x19: // END_ARRAY
        if (!this._parsingContext.inArray()) {
        this._reportMismatchedEndMarker(']', '}');
      }
      this._parsingContext = this._parsingContext.getParent();
      return (this._currToken = JsonToken.END_ARRAY);
      case 0x1A: // START_OBJECT
        this._parsingContext = this._parsingContext.createChildObjectContext(-1, -1);
      return (this._currToken = JsonToken.START_OBJECT);
      case 0x1B: // not used in this mode; would be END_OBJECT
        this.emit("error", "Invalid type marker byte 0xFB in value mode (would be END_OBJECT in key mode)");
      case 0x1D: // binary, raw
        this._tokenIncomplete = true;
      return (this._currToken = JsonToken.VALUE_EMBEDDED_OBJECT);
      case 0x1F: // 0xFF, end of content
        return (this._currToken = null);
    }
    break;
  }
  // If we get this far, type byte is corrupt
  this.emit("error", "Invalid type marker byte 0x"+Integer.toHexString(ch & 0xFF)+" for expected value token");
  return null;
}

SmileParser.prototype.parseBuffer = function(buffer){
  this._inputBuffer = buffer;
  var outputBufferStream = new WritableBufferStream();
  while(this.inputPtr < this._inputBuffer.length){
    outputBufferStream.write(this.nextToken());
  }
  this.emit('data', outputBufferStream.getBuffer());
  return this;
}

module.exports = SmileParser;

