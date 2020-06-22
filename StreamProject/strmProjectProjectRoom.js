class StrmProjectProjectRoom {
  constructor(projectCode) {
    // project room identifier
    this.name = projectCode;

    // list of client currently online client in this project room
    this.clients = new Map();
  }

  // START -- CLIENT MANAGEMENT

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
    const deletedClient = this.clients.get(client.id);

    // if client not found in this room then return empty
    if (!deletedClient) return null;

    // delete the client
    this.clients.delete(client.id);

    return { projectRoom: this, deletedClient };
  }

  // get all currently online clients
  getOnlineClients() {
    return Array.from(this.clients.values()).map((client) => client.user.name);
  }

  // END -- CLIENT MANAGEMENT

  // START -- TO DO MANAGEMENT

  // a client has joined this room
  broadcastJoined(name) {
    this.clients.forEach((client) => client.client.emit('joined', name));
  }

  // a client is leaving this room
  broadcastLeaved(name) {
    this.clients.forEach((client) => client.client.emit('leaved', name));
  }

  // END -- TO DO MANAGEMENT
}

export default StrmProjectProjectRoom;
