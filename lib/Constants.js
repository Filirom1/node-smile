/*
/**********************************************************
/* Format header: put smile on your data...
/**********************************************************
 */

// First byte of data header (0x3A)
exports.HEADER_BYTE_1 =  ':'.charCodeAt(0);

// Second byte of data header (0x29)
exports.HEADER_BYTE_2 =  ')'.charCodeAt(0);

// Third byte of data header
exports.HEADER_BYTE_3 = '\n'.charCodeAt(0);

/**
 * Current version consists of four zero bits (nibble)
 */
exports.HEADER_VERSION_0 = 0x0;

/**
 * Fourth byte of data header; contains version nibble, may
 * have flags
 */
exports.HEADER_BYTE_4 = (exports.HEADER_VERSION_0 << 4);

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
