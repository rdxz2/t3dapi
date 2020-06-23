import { Router } from 'express';

import Department from '../Models/mdlDepartment';
import Position from '../Models/mdlPosition';
import User from '../Models/mdlUser';
import { resBase } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import rtFtSelectList from '../RouteFilters/rtFtSelectList';
import { createSelectListObject } from '../Utilities/utlSelectList';

const rtSelectList = Router();

// department
rtSelectList.post('/departmentRegister', rtFtSelectList, async (request, response) => {
  // search department
  const repoDepartments = await Department.find({ name: { $regex: request.body.search, $options: 'i' } }).limit(parseInt(request.body.show));

  // convert to select list models
  const repoDepartmentVMs = repoDepartments.map((department) => createSelectListObject(department._id, department.name));

  return resBase(repoDepartmentVMs, response);
});

// position
rtSelectList.post('/positionRegister', rtFtSelectList, async (request, response) => {
  // search position
  const repoPositions = await Position.find({ name: { $regex: request.body.search, $options: 'i' } }).limit(parseInt(request.body.show));

  // convert to select list models
  const repoPositionVMs = repoPositions.map((position) => createSelectListObject(position._id, position.name));

  return resBase(repoPositionVMs, response);
});

// user
rtSelectList.post('/user', [rtFtJwt, rtFtSelectList], async (request, response) => {
  // search user
  const repoUsers = await User.find({ _id: { $ne: request.user.id }, name: { $regex: request.body.search, $options: 'i' } }).limit(parseInt(request.body.show));

  // convert to select list models
  const repoUserVMs = repoUsers.map((user) => createSelectListObject(user._id, user.name));

  return resBase(repoUserVMs, response);
});

export default rtSelectList;
