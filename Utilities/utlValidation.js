// get joi validation error message
export const getValidationErrorMessage = (validationError) => (validationError ? validationError.details[0].message : '');
