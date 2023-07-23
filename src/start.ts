import { MetaverseServer } from "./MetaverseServer";

const server = new MetaverseServer();

void server.configure().then(() =>{
    server.start();
});