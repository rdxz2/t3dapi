import StrmProjectProjectRoom from './strmProjectProjectRoom';
import Project from '../Models/mdlProject';

class StrmProjectProjectRoomManager {
  constructor() {
    // project rooms (in memory)
    // name - StrmProjectProjectRoom
    this.projectRooms = new Map();
  }

  // create new project room
  createProjectRoom(projectCode) {
    this.projectRooms.set(projectCode, new StrmProjectProjectRoom(projectCode));
  }

  // remove target client from every project room
  removeClient(client) {
    return Array.from(this.projectRooms.values()).map((projectRoom) => {
      // remove client
      const removedClient = projectRoom.removeClient(client);

      // if room is empty then delete it
      if (projectRoom.clients.size <= 0) this.projectRooms.delete(projectRoom.name);

      // return the removed client
      return removedClient;
    });
  }

  // get project room
  async getProjectRoomByCode(projectCode, isClientJoining = false) {
    // try to get project room
    const selectedProjectRoom = this.projectRooms.get(projectCode);

    // if found then just return this project room
    if (selectedProjectRoom) return selectedProjectRoom;

    // if user is not joining this room then throw an error
    if (!isClientJoining) throw new Error(`project room ${projectCode} not found`);

    // search project
    const repoProject = await Project.findOne({ code: projectCode }).select('-_id code');
    if (!repoProject) return null;

    // add to memory
    this.createProjectRoom(repoProject.code);

    // re-get project room (should be available now)
    return this.projectRooms.get(projectCode);
  }

  // get online clients for each project room
  getProjectRoomsOnlineClients(projectRoomCodes = []) {
    // get the corresponding project room
    const selectedProjectRooms = projectRoomCodes.map((projectRoomCode) => {
      // get project room
      const selectedProjectRoom = this.projectRooms.get(projectRoomCode);

      // if project room is not found then return empty
      if (!selectedProjectRoom) return null;

      return { projectRoomName: selectedProjectRoom.name, onlineClientsCount: selectedProjectRoom.clients.size };
    });

    // filter found project rooms
    return selectedProjectRooms.filter((selectedProjectRoom) => !!selectedProjectRoom);
  }
}

export default StrmProjectProjectRoomManager;
