// create select list object (value - text pair)
export const createSelectListObject = (value, text) => ({ value, text });

// create select list objects (value - text pair)
export const createSelectListObjects = (inputs, valueString, textString, textStringSeparator = ' ', textSeparator = ' - ') =>
  inputs.map((input) => {
    // split text string to get all supplied text string
    const textStrings = textString.split(textStringSeparator);

    // construct text from input objects
    const text = textStrings.map((textStr) => input[textStr]).join(textSeparator);

    // create select list object
    return createSelectListObject(input[valueString], text);
  });
