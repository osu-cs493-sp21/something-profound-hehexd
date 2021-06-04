/*
 * Perform data validation by verifying that it contains all required fields specified in given schema.
 * Return true if valid, false if not valid.
 * Fields can be found in the respective .js file in models.
 */
exports.validateAgainstSchema = function (obj, schema) {
    return obj && Object.keys(schema).every(
        field => !schema[field].required || obj[field] != undefined
    );
};

/*
 * Extract the fields from an object that are valid according ot a specified schema.
 * Extracted fields are either mandatory or optional
 * Return a new object containing all valid fields extracted from the original object.
 */

exports.extractValidFields = function (obj, schema) {
    let validObj = {};
    Object.keys(schema).forEach((field) => {
        if (obj[field] != undefined) {
            validObj[field] = obj[field];
        }
    });
    return validObj;
}