const makeStrmProjectHandler = (client, projectRoomManager) => {
  // client joining project room
  async function handleJoin(data, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode, true);

      // register this client to the project room
      selectedProjectRoom.addClient(client, data.name);

      // broadcast if this client is joining the server
      selectedProjectRoom.broadcastJoined(data.name);

      // get currently joined clients
      const currentlyOnlineClients = selectedProjectRoom.getOnlineClients();

      callback(null, currentlyOnlineClients);
    } catch (error) {
      callback(error);
    }
  }

  // client leaving project room
  async function handleLeave(projectCode, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(projectCode);

      // uregister this client from all project rooms
      const removedClients = projectRoomManager.removeClient(client);

      // broadcast if this client is leaving the selected room
      selectedProjectRoom.broadcastLeaved(removedClients[0].deletedClient.user.name);

      callback(null, removedClients);
    } catch (error) {
      callback(error);
    }
  }

  // client creating project
  async function handleCreateToDo({ projectCode, toDoDescription } = {}, callback) {}

  // client marking to do as completed

  // client marking to do as important

  // client changing to do priority

  // client disconnected from project room
  function handleDisconnect() {
    // unregister this client from all project rooms
    const removedClients = projectRoomManager.removeClient(client);

    // broadcast each room for the leaving client
    removedClients.forEach((removedClient) => removedClient.projectRoom.broadcastLeaved(removedClient.deletedClient.user.name));
  }

  // return above functions
  return { handleJoin, handleLeave, handleCreateToDo, handleDisconnect };
};

export default makeStrmProjectHandler;
