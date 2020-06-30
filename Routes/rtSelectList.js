import { Router } from 'express';

import Department from '../Models/mdlDepartment';
import Position from '../Models/mdlPosition';
import User from '../Models/mdlUser';
import { resBase, resNotFound } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import rtFtSelectList from '../RouteFilters/rtFtSelectList';
import { createSelectListObject } from '../Utilities/utlSelectList';
import Project from '../Models/mdlProject';

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

// user (project)
rtSelectList.post('/projectuser/:projectCode', [rtFtJwt, rtFtSelectList], async (request, response) => {
  // search project
  const repoProject = await Project.findOne({ code: request.params.projectCode }).populate('collaborators', 'name').select();
  if (!repoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // get collaborators
  const collaborators = repoProject.collaborators.map((collaborator) => ({ id: collaborator.id, name: collaborator.name }));

  return resBase(collaborators, response);
});

export default rtSelectList;
