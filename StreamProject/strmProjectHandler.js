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
  async function handleTodoCreating(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast newly created to do
      selectedProjectRoom.broadcastTodoCreated(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client toggling to do completed
  async function handleTodoCompleteToggling(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast toggled to do complete
      selectedProjectRoom.broadcastTodoCompleteToggled(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client toggling to do important
  async function handleTodoImportantToggling(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast toggled to do important
      selectedProjectRoom.broadcastTodoImportantToggled(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client creating to do tag
  async function handleTodoTagCreating(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast newly created tag
      selectedProjectRoom.broadcastTodoTagCreated(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client deleting to do tag
  async function handleTodoTagDeleting(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast newly deleted tag
      selectedProjectRoom.broadcastTodoTagDeleted(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client editing to do description
  async function handleTodoDescriptionEditing(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast edited description
      selectedProjectRoom.broadcastTodoDescriptionEdited(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client editing to do detail
  async function handleTodoDetailEditing(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast edited detail
      selectedProjectRoom.broadcastTodoDetailEdited(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client changing to do priority
  async function handleTodoPriorityEditing(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast edited priority
      selectedProjectRoom.broadcastTodoPriorityEdited(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client commenting a to do
  async function handleTodoCommenting(data = { projectCode: '' }, callback) {
    try {
      // search project room
      const selectedProjectRoom = await projectRoomManager.getProjectRoomByCode(data.projectCode);

      // broadcast commented to do
      selectedProjectRoom.broadcastTodoCommented(client, data);
    } catch (error) {
      callback(error);
    }
  }

  // client marking to do as completed

  // client marking to do as important

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
  return {
    handleJoin,
    handleLeave,
    handleTodoCreating,
    handleTodoCompleteToggling,
    handleTodoImportantToggling,
    handleDisconnect,
    handleTodoTagCreating,
    handleTodoTagDeleting,
    handleTodoDescriptionEditing,
    handleTodoDetailEditing,
    handleTodoPriorityEditing,
    handleTodoCommenting,
  };
};

export default makeStrmProjectHandler;
