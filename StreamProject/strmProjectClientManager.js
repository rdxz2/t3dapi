// class StrmProjectClientManager {
//   constructor() {
//     this.clients = new Map();
//   }

//   addClient(client) {
//     this.clients.set(client.id, client);
//   }

//   removeClient(client) {
//     this.clients.delete(client.id);
//   }

//   getClient(client) {
//     const selectedClient = this.clients.get(client.id);

//     if (selectedClient) return selectedClient;

//     this.addClient(client);

//     return client;
//   }
// }

// export default StrmProjectClientManager;
