class StrmProjectProjectRoom {
  constructor(projectCode) {
    // project room identifier
    this.name = projectCode;

    // list of client currently online client in this project room
    this.clients = new Map();
  }

  // START -- ROOM CLIENT MANAGEMENT

  // add subscribing client (with user id & user name (not username))
  addClient(client, id, name) {
    // insert user as subscribing client
    this.clients.set(client.id, { client, id, name });
  }

  // remove leaving client
  removeClient(client) {
    // get deleted client
    const removedClient = this.clients.get(client.id);

    // if client not found in this room then return empty
    if (!removedClient) return null;

    // delete the client
    this.clients.delete(client.id);

    return removedClient;
  }

  // get all currently online clients (name only)
  getOnlineClients() {
    return Array.from(this.clients.values()).map((client) => ({ id: client.id, name: client.name }));
  }

  // END -- ROOM CLIENT MANAGEMENT

  // START -- TO DO MANAGEMENT

  // a client has joined this room
  broadcastJoined(clientSender, id, name) {
    this._broadcastToAllClients(clientSender, 'joined', { id, name });
  }

  // a client is leaving this room
  broadcastLeaved(clientSender, id, name) {
    this._broadcastToAllClients(clientSender, 'leaved', { id, name });
  }

  // to do created
  broadcastTodoCreated(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'todo_created', data);
  }

  // tag created
  broadcastTodoTagCreated(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'todotag_created', data);
  }

  // tag deleted
  broadcastTodoTagDeleted(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'todotag_deletd', data);
  }

  // description edited
  broadcastTodoDescriptionEdited(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'tododesc_edited', data);
  }

  // detail edited
  broadcastTodoDetailEdited(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'tododetail_edited', data);
  }

  // priority edited
  broadcastTodoPriorityEdited(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'todoprio_edited', data);
  }

  // to do commented
  broadcastTodoCommented(clientSender, data) {
    this._broadcastToAllClients(clientSender, 'todo_commented', data);
  }

  // broadcast something to all client in this room
  // // except the sender
  _broadcastToAllClients(clientSender, emitName, data) {
    Array.from(this.clients.entries())
      // .filter(([id, client]) => id !== clientSender.id)
      .forEach(([id, client]) => client.client.emit(emitName, data));
  }

  // END -- TO DO MANAGEMENT
}

export default StrmProjectProjectRoom;
