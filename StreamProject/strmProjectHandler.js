const makeStrmProjectHandler = (client, projectRoomManager) => {
  // client joining project room
  async function handleJoin(data, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode, true);

      // register this client to the project room
      selectedProjectRoom.addClient(client, data.id, data.name);

      // broadcast if this client is joining the server
      selectedProjectRoom.broadcastJoined(client, data.id, data.name);

      // get currently online clients
      const currentlyOnlineClients = selectedProjectRoom.getOnlineClients();

      // send currently online clients
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
      const removedClient = removedClients[0].removedClient;

      // broadcast if this client is leaving the selected room
      selectedProjectRoom.broadcastLeaved(client, removedClient.id, removedClient.name);
    } catch (error) {
      callback(error);
    }
  }

  // client creating project
  async function handleTodoCreating(todo = { projectCode: '', description: '', priority: 0 }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(todo.projectCode);

      // broadcast newly created to do
      selectedProjectRoom.broadcastTodoCreated(client, todo);
    } catch (error) {
      callback(error);
    }
  }

  // client marking to do as completed

  // client marking to do as important

  // client changing to do priority

  // client disconnected from project room
  function handleDisconnect() {
    // unregister this client from all project rooms
    const removedClients = projectRoomManager.removeClient(client) || [];
    if (!removedClients.length) return;

    try {
      // broadcast each room for the leaving client
      removedClients.forEach((removedClient) => (removedClient.removedClient && removedClient.projectRoom ? removedClient.projectRoom.broadcastLeaved(client, removedClient.removedClient.id, removedClient.removedClient.name) : {}));
    } catch (error) {
      console.error(error);
    }
  }

  // return above functions
  return { handleJoin, handleLeave, handleTodoCreating, handleDisconnect };
};

export default makeStrmProjectHandler;
