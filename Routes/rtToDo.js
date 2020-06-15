import { Router } from 'express';
import { resBase } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';

const rtToDo = Router();

// get all
rtToDo.get('/:projectCode', rtFtJwt, (request, response) => {
  return resBase('not implemented', response);
});

// create
rtToDo.post('/:projectCode', rtFtJwt, (request, response) => {
  return resBase('not implemented', response);
});

// edit

export default rtToDo;
