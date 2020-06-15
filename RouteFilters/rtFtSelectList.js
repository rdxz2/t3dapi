import { resValidationError } from '../Responses/resBase';
import { vldtSelectList } from '../Validations/vldtSelectList';

const rtFtSelectList = (request, response, next) => {
  // validate model
  const { error: errorValidation } = vldtSelectList(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  next();
};

export default rtFtSelectList;
