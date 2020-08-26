const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");

const port = 4001;

const app = express();

const server = http.createServer(app);

const io = socketIo(server);

let interval;

const connectionOptions = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'Voting',
    port: 3308
};


//Connect to database
var connection = mysql.createConnection(connectionOptions);

connection.connect(function (err) {
    // in case of error
    if (err) {
        console.log(err.code);
        console.log(err.fatal);
    }
});


//Socket connection
io.on("connection", (socket) => {
    console.log("New client connected");
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(() => getDataAndEmit(socket), 1000);
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        clearInterval(interval);
    });
});


//Parse response to easier to read json, used my getDataAndEmit
function parser(response) {
    let json = {};
    if (Object.keys(response).length === 0) {
        json['Dog'] = 0;
        json['Cat'] = 0;
        return json;
    } else if (Object.keys(response).length === 1) {
        if (response[0].animal === 'Dog') {
            json['Dog'] = response[0].count;
            json['Cat'] = 0;
            return json;
        } else if (response[0].animal === 'Cat'){
            json['Cat'] = response[0].count;
            json['Dog'] = 0;
            return json;
        }
    } else {
        json['Dog'] = response[1].count;
        json['Cat'] = response[0].count;
        return json;
    }
}


//Emit data throw socket to frontend
const getDataAndEmit = socket => {


    $query = 'select animal, count(*) as count FROM votes GROUP BY animal ORDER BY animal';

    connection.query($query, function (err, response) {
        if (err) {
            console.log("An error ocurred performing the query.");
            return;
        }
        let responseParsed = parser(response);

        console.log(responseParsed);

        io.sockets.emit("FromAPI", responseParsed);
    });

};

server.listen(port, () => console.log(`Listening on port ${port}`));