import { Router } from 'express';

import Department from '../Models/mdlDepartment';
import Position from '../Models/mdlPosition';
import User from '../Models/mdlUser';
import { resBase } from '../Responses/resBase';
import rtFtSelectList from '../RouteFilters/rtFtSelectList';
import { createSelectListObject } from '../Utilities/utlSelectList';
import rtFtJwt from '../RouteFilters/rtFtJwt';

const rtSelectList = Router();

// user
rtSelectList.get('/user', [rtFtJwt, rtFtSelectList], async (request, response) => {
  // convert request query
  const show = parseInt(request.query.show);

  // search user
  const repoUsers = await User.find({ _id: { $ne: request.user._id }, name: { $regex: request.query.search, $options: 'i' } }).limit(show);

  // convert to select list models
  const repoUserVMs = repoUsers.map((user) => createSelectListObject(user._id, user.name));

  return resBase(repoUserVMs, response);
});

// department
rtSelectList.get('/department', rtFtSelectList, async (request, response) => {
  // convert request query
  const show = parseInt(request.query.show);

  // search department
  const repoDepartments = await Department.find({ name: { $regex: request.query.search, $options: 'i' } }).limit(show);

  // convert to select list models
  const repoDepartmentVMs = repoDepartments.map((department) => createSelectListObject(department._id, department.name));

  return resBase(repoDepartmentVMs, response);
});

// position
rtSelectList.get('/position', rtFtSelectList, async (request, response) => {
  // convert request query
  const show = parseInt(request.query.show);

  // search position
  const repoPositions = await Position.find({ name: { $regex: request.query.search, $options: 'i' } }).limit(show);

  // convert to select list models
  const repoPositionVMs = repoPositions.map((position) => createSelectListObject(position._id, position.name));

  return resBase(repoPositionVMs, response);
});

export default rtSelectList;
