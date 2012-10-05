/**
 * Constants used by {@link SmileGenerator} and {@link SmileParser}
 */
/*
/**********************************************************
/* Thresholds
/**********************************************************
*/

/**
 * Encoding has special "short" forms for value Strings that can
 * be represented by 64 bytes of UTF-8 or less.
 */
exports.MAX_SHORT_VALUE_STRING_BYTES = 64;

/**
 * Encoding has special "short" forms for field names that can
 * be represented by 64 bytes of UTF-8 or less.
 */
exports.MAX_SHORT_NAME_ASCII_BYTES = 64;

/**
 * Maximum byte length for short non-ASCII names is slightly
 * less due to having to reserve bytes 0xF8 and above (but
 * we get one more as values 0 and 1 are not valid)
 */
exports.MAX_SHORT_NAME_UNICODE_BYTES = 56;

/**
 * Longest back reference we use for field names is 10 bits; no point
 * in keeping much more around
 */
exports.MAX_SHARED_NAMES = 1024;

/**
 * Longest back reference we use for short shared String values is 10 bits,
 * so up to (1 << 10) values to keep track of.
 */
exports.MAX_SHARED_STRING_VALUES = 1024;

/**
 * Also: whereas we can refer to names of any length, we will only consider
 * text values that are considered "tiny" or "short" (ones encoded with
 * length prefix); this value thereby has to be maximum length of Strings
 * that can be encoded as such.
 */
exports.MAX_SHARED_STRING_LENGTH_BYTES = 65;

/**
 * And to make encoding logic tight and simple, we can always
 * require that output buffer has this amount of space
 * available before encoding possibly short String (3 bytes since
 * longest UTF-8 encoded Java char is 3 bytes).
 * Two extra bytes need to be reserved as well; first for token indicator,
 * and second for terminating null byte (in case it's not a short String after all)
 */
exports.MIN_BUFFER_FOR_POSSIBLE_SHORT_STRING = 1 + (3 * 65);

/*
/**********************************************************
/* Byte markers
/**********************************************************
*/

/**
 * We need a byte marker to denote end of variable-length Strings. Although
 * null byte is commonly used, let's try to avoid using it since it can't
 * be embedded in Web Sockets content (similarly, 0xFF can't). There are
 * multiple candidates for bytes UTF-8 can not have; 0xFC is chosen to
 * allow reasonable ordering (highest values meaning most significant
 * framing function; 0xFF being end-of-content and so on)
 */
exports.INT_MARKER_END_OF_STRING = 0xFC;

exports.BYTE_MARKER_END_OF_STRING = (byte) INT_MARKER_END_OF_STRING;

/**
 * In addition we can use a marker to allow simple framing; splitting
 * of physical data (like file) into distinct logical sections like
 * JSON documents. 0xFF makes sense here since it is also used
 * as end marker for Web Sockets.
 */
exports.BYTE_MARKER_END_OF_CONTENT = (byte) 0xFF;

/*
/**********************************************************
/* Format header: put smile on your data...
/**********************************************************
*/

/**
 * First byte of data header
 */
exports.HEADER_BYTE_1 = (byte) ':';

/**
 * Second byte of data header
 */
exports.HEADER_BYTE_2 = (byte) ')';

/**
 * Third byte of data header
 */
exports.HEADER_BYTE_3 = (byte) '\n';

/**
 * Current version consists of four zero bits (nibble)
 */
exports.HEADER_VERSION_0 = 0x0;

/**
 * Fourth byte of data header; contains version nibble, may
 * have flags
 */
exports.HEADER_BYTE_4 = (HEADER_VERSION_0 << 4);

/**
 * Indicator bit that indicates whether encoded content may
 * have Shared names (back references to recently encoded field
 * names). If no header available, must be
 * processed as if this was set to true.
 * If (and only if) header exists, and value is 0, can parser
 * omit storing of seen names, as it is guaranteed that no back
 * references exist.
 */
exports.HEADER_BIT_HAS_SHARED_NAMES = 0x01;

/**
 * Indicator bit that indicates whether encoded content may
 * have shared String values (back references to recently encoded
 * 'short' String values, where short is defined as 64 bytes or less).
 * If no header available, can be assumed to be 0 (false).
 * If header exists, and bit value is 1, parsers has to store up
 * to 1024 most recently seen distinct short String values.
 */
exports.HEADER_BIT_HAS_SHARED_STRING_VALUES = 0x02;

/**
 * Indicator bit that indicates whether encoded content may
 * contain raw (unquoted) binary values.
 * If no header available, can be assumed to be 0 (false).
 * If header exists, and bit value is 1, parser can not assume that
 * specific byte values always have default meaning (specifically,
 * content end marker 0xFF and header signature can be contained
 * in binary values)
 *<p>
 * Note that this bit being true does not automatically mean that
 * such raw binary content indeed exists; just that it may exist.
 * This because header is written before any binary data may be
 * written.
 */
exports.HEADER_BIT_HAS_RAW_BINARY = 0x04;

/*
/**********************************************************
/* Type prefixes: 3 MSB of token byte
/**********************************************************
*/

// Shared strings are back references for last 63 short (< 64 byte) string values
// NOTE: 0x00 is reserved, not used with current version (may be used in future)
exports.TOKEN_PREFIX_SHARED_STRING_SHORT = 0x00;
// literals are put between 0x20 and 0x3F to reserve markers (smiley), along with ints/doubles
//exports.TOKEN_PREFIX_MISC_NUMBERS = 0x20;

exports.TOKEN_PREFIX_TINY_ASCII = 0x40;
exports.TOKEN_PREFIX_SMALL_ASCII = 0x60;
exports.TOKEN_PREFIX_TINY_UNICODE = 0x80;
exports.TOKEN_PREFIX_SHORT_UNICODE = 0xA0;

// Small ints are 4-bit (-16 to +15) integer constants
exports.TOKEN_PREFIX_SMALL_INT = 0xC0;

// And misc types have empty at the end too, to reserve 0xF8 - 0xFF
exports.TOKEN_PREFIX_MISC_OTHER = 0xE0;

/*
/**********************************************************
/* Token literals, normal mode
/**********************************************************
*/

// First, non-structured literals

exports.TOKEN_LITERAL_EMPTY_STRING = 0x20;
exports.TOKEN_LITERAL_NULL = 0x21;
exports.TOKEN_LITERAL_FALSE = 0x22;
exports.TOKEN_LITERAL_TRUE = 0x23;

// And then structured literals

exports.TOKEN_LITERAL_START_ARRAY = (byte) 0xF8;
exports.TOKEN_LITERAL_END_ARRAY = (byte) 0xF9;
exports.TOKEN_LITERAL_START_OBJECT = (byte) 0xFA;
exports.TOKEN_LITERAL_END_OBJECT = (byte) 0xFB;

/*
/**********************************************************
/* Subtype constants for misc text/binary types
/**********************************************************
*/

/**
 * Type (for misc, other) used
 * for regular integral types (byte/short/int/long)
 */
exports.TOKEN_MISC_INTEGER = 0x24;

/**
 * Type (for misc, other) used
 * for regular floating-point types (float, double)
 */
exports.TOKEN_MISC_FP = 0x28;

/**
 * Type (for misc, other) used for
 * variable length UTF-8 encoded text, when it is known to only contain ASCII chars.
 * Note: 2 LSB are reserved for future use; must be zeroes for now
 */
exports.TOKEN_MISC_LONG_TEXT_ASCII = 0xE0;

/**
 * Type (for misc, other) used
 * for variable length UTF-8 encoded text, when it is NOT known to only contain ASCII chars
 * (which means it MAY have multi-byte characters)
 * Note: 2 LSB are reserved for future use; must be zeroes for now
 */
exports.TOKEN_MISC_LONG_TEXT_UNICODE = 0xE4;

/**
 * Type (for misc, other) used
 * for "safe" (encoded by only using 7 LSB, giving 8/7 expansion ratio).
 * This is usually done to ensure that certain bytes are never included
 * in encoded data (like 0xFF)
 * Note: 2 LSB are reserved for future use; must be zeroes for now
 */
exports.TOKEN_MISC_BINARY_7BIT = 0xE8;

/**
 * Type (for misc, other) used for shared String values where index
 * does not fit in "short" reference range (which is 0 - 30). If so,
 * 2 LSB from here and full following byte are used to get 10-bit
 * index. Values
 */
exports.TOKEN_MISC_SHARED_STRING_LONG = 0xEC;

/**
 * Raw binary data marker is specifically chosen as separate from
 * other types, since it can have significant impact on framing
 * (or rather fast scanning based on structure and framing markers).
 */
exports.TOKEN_MISC_BINARY_RAW = 0xFD;

/*
/**********************************************************
/* Modifiers for numeric entries
/**********************************************************
*/

/**
 * Numeric subtype (2 LSB) for {@link #TOKEN_MISC_INTEGER},
 * indicating 32-bit integer (int)
 */
exports.TOKEN_MISC_INTEGER_32 = 0x00;

/**
 * Numeric subtype (2 LSB) for {@link #TOKEN_MISC_INTEGER},
 * indicating 32-bit integer (long)
 */
exports.TOKEN_MISC_INTEGER_64 = 0x01;

/**
 * Numeric subtype (2 LSB) for {@link #TOKEN_MISC_INTEGER},
 * indicating {@link java.math.BigInteger} type.
 */
exports.TOKEN_MISC_INTEGER_BIG = 0x02;

// Note: type 3 (0xF3) reserved for future use

/**
 * Numeric subtype (2 LSB) for {@link #TOKEN_MISC_FP},
 * indicating 32-bit IEEE single precision floating point number.
 */
exports.TOKEN_MISC_FLOAT_32 = 0x00;

/**
 * Numeric subtype (2 LSB) for {@link #TOKEN_MISC_FP},
 * indicating 64-bit IEEE double precision floating point number.
 */
exports.TOKEN_MISC_FLOAT_64 = 0x01;

/**
 * Numeric subtype (2 LSB) for {@link #TOKEN_MISC_FP},
 * indicating {@link java.math.BigDecimal} type.
 */
exports.TOKEN_MISC_FLOAT_BIG = 0x02;

// Note: type 3 (0xF7) reserved for future use

/*
/**********************************************************
/* Token types for keys
/**********************************************************
*/

/**
 * Let's use same code for empty key as for empty String value
 */
exports.TOKEN_KEY_EMPTY_STRING = 0x20;

exports.TOKEN_PREFIX_KEY_SHARED_LONG = 0x30;

exports.TOKEN_KEY_LONG_STRING = 0x34;

exports.TOKEN_PREFIX_KEY_SHARED_SHORT = 0x40;

exports.TOKEN_PREFIX_KEY_ASCII = 0x80;

exports.TOKEN_PREFIX_KEY_UNICODE = 0xC0;

/*
/**********************************************************
/* Basic UTF-8 decode/encode table
/**********************************************************
*/

/**
 * Additionally we can combine UTF-8 decoding info into similar
 * data table.
 * Values indicate "byte length - 1"; meaning -1 is used for
 * invalid bytes, 0 for single-byte codes, 1 for 2-byte codes
 * and 2 for 3-byte codes.
 */
var table = [];
for (var c = 128; c < 256; ++c) {
  var code;

  // We'll add number of bytes needed for decoding
  if ((c & 0xE0) == 0xC0) { // 2 bytes (0x0080 - 0x07FF)
    code = 1;
  } else if ((c & 0xF0) == 0xE0) { // 3 bytes (0x0800 - 0xFFFF)
    code = 2;
  } else if ((c & 0xF8) == 0xF0) {
    // 4 bytes; double-char with surrogates and all...
    code = 3;
  } else {
    // And -1 seems like a good "universal" error marker...
    code = -1;
  }
  table[c] = code;
}
exports.sUtf8UnitLengths = table;
