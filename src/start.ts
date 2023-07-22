import { MetaverseServer } from "./MetaverseServer";

const server = new MetaverseServer();

server.configure().then(() =>{
    server.start();
});