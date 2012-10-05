/* Some notes on implementation:
*
* - Entries are to be ordered such that start/end array/object
* markers come first, then field name marker (if any), and
* finally scalar value tokens. This is assumed by some
* typing checks.
*/

/**
* NOT_AVAILABLE can be returned if {@link JsonParser}
* implementation can not currently return the requested
* token (usually next one), or even if any will be
* available, but that may be able to determine this in
* future. This is the case with non-blocking parsers --
* they can not block to wait for more data to parse and
* must return something.
*/
exports.NOT_AVAILABLE = "NA";

    /**
* START_OBJECT is returned when encountering '{'
* which signals starting of an Object value.
*/
exports.START_OBJECT = "{";

    /**
* START_OBJECT is returned when encountering '}'
* which signals ending of an Object value
*/
exports.END_OBJECT = "}";

    /**
* START_OBJECT is returned when encountering '['
* which signals starting of an Array value
*/
exports.START_ARRAY = "[";

    /**
* START_OBJECT is returned when encountering ']'
* which signals ending of an Array value
*/
exports.END_ARRAY = "]";

    /**
* FIELD_NAME is returned when a String token is encountered
* as a field name (same lexical value, different function)
*/
exports.FIELD_NAME = "FN";

    /**
* Placeholder token returned when the input source has a concept
* of embedded Object that are not accessible as usual structure
* (of starting with {@link #START_OBJECT}, having values, ending with
* {@link #END_OBJECT}), but as "raw" objects.
*<p>
* Note: this token is never returned by regular JSON readers, but
* only by readers that expose other kinds of source (like
* <code>JsonNode</code>-based JSON trees, Maps, Lists and such).
*/
exports.VALUE_EMBEDDED_OBJECT = "VEO"

    /**
* VALUE_STRING is returned when a String token is encountered
* in value context (array element, field value, or root-level
* stand-alone value)
*/
exports.VALUE_STRING = "VS";

    /**
* VALUE_NUMBER_INT is returned when an integer numeric token is
* encountered in value context: that is, a number that does
* not have floating point or exponent marker in it (consists
* only of an optional sign, followed by one or more digits)
*/
exports.VALUE_NUMBER_INT = "VNI";

    /**
* VALUE_NUMBER_INT is returned when a numeric token other
* that is not an integer is encountered: that is, a number that does
* have floating point or exponent marker in it, in addition
* to one or more digits.
*/
exports.VALUE_NUMBER_FLOAT = "VNF";

    /**
* VALUE_TRUE is returned when encountering literal "true" in
* value context
*/
exports.VALUE_TRUE = true;

    /**
* VALUE_FALSE is returned when encountering literal "false" in
* value context
*/
exports.VALUE_FALSE = "false";

    /**
* VALUE_NULL is returned when encountering literal "null" in
* value context
*/
exports.VALUE_NULL = null;
