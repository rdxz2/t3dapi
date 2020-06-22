class StrmProjectProjectRoom {
  constructor(projectCode) {
    // project room identifier
    this.name = projectCode;

    // list of client currently online client in this project room
    this.clients = new Map();
  }

  // START -- ROOM CLIENT MANAGEMENT

  // add subscribing client
  addClient(client, name) {
    // user model
    const user = { name };

    // insert user as subscribing client
    this.clients.set(client.id, { client, user });
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
    return Array.from(this.clients.values()).map((client) => client.user.name);
  }

  // END -- ROOM CLIENT MANAGEMENT

  // START -- TO DO MANAGEMENT

  // a client has joined this room
  broadcastJoined(sender, name) {
    this._broadcastToAllClients(sender, 'joined', name);
  }

  // a client is leaving this room
  broadcastLeaved(sender, name) {
    this._broadcastToAllClients(sender, 'leaved', name);
  }

  // to do created
  broadcastToDoCreated(sender, toDo) {
    this._broadcastToAllClients(sender, 'todo_created', toDo);
  }

  // broadcast something to all client in this room
  _broadcastToAllClients(sender, emitName, data) {
    Array.from(this.clients.entries())
      .filter(([id, client]) => id !== sender.id)
      .forEach(([id, client]) => client.client.emit(emitName, data));
  }

  // END -- TO DO MANAGEMENT
}

export default StrmProjectProjectRoom;
