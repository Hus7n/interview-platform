import http from "http";
import app from "./app.js";
import { setupSocket } from "./socket/socket.js";
import { startScheduler } from "./scheduler/scheduler.js";
import { env } from "./config/env.js";
import { testConnection } from "./db.js";


const server = http.createServer(app);
setupSocket(server);

async function startServer(){
    try{
        await testConnection();
        startScheduler();
        server.listen(env.port,() =>{
            console.log(`Server running on port ${env.port}`);
        })

    }catch(error){
        console.log(error);
        process.exit(1);
    }
}

startServer();