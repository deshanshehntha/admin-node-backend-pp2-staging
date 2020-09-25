"use strict";

var port;
var nodeType;

process.argv.forEach(function (val, index, array) {
    if(index === 2) {
        port = 0;
    } else if(index === 3) {
        nodeType = "1"
    } else if(index === 4 ) {
        global.globalString = "A1"
    }
});

const socketIo = require("socket.io");
const axios = require("axios");
const mongoose = require('mongoose');
const ip = require("ip")

const SERVER_ID = "03S"
var cors = require('cors');

const UserStore = require("./Util/Datastores/clientDataStore");
const ConnectedNodeStore = require("./Util/Datastores/connectedNodeStore")
const SmartContractRunner = require("./SmartContract/runner/SmartContractRunner")
const HalfNodeConnectionStore = require("./Util/Datastores/halfnodeConnectionStore");
const ElectionResultDataStore = require("./Util/Datastores/electionResultDataStore")
/** Initiate Logging sequence */

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/1debug.log', {flags: 'w'});
var log_stdout = process.stdout;

console.log = function (d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};
/** express initialization */


const express = require("express");
const http = require("http");
const index = require("./index");

const app = express();
app.use(index);
app.use(cors());
app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


/*
* Initiate the routes
 */
const testFirebaseRoutes = require("./Routes/test.routes");

//define the routes for app
app.use('/api/test', testFirebaseRoutes);

const firebase_app = require('./Util/firebase.config');

//firebase reference
const testRef = firebase_app.database().ref("/sessions/");
const keyRef = firebase_app.database().ref("/keys/");



const server = http.createServer(app);
server.listen(port, () => console.log(`Create Listening on port ${server.address().port}`));

var globalClientSocket;

global.io = require('socket.io')(server);

    global.io.on('connection', function (socket) {
        console.log("Connected Socket = " + socket.id);

        socket.on('authenticate', (data) => {
                const _key = data.token;
                console.log(_key);
                var auth;

                const query = testRef.orderByChild("token").equalTo(_key);

                query.on('value',(snapshot) => {
                    auth = snapshot.val();
                    if(auth !== null) {
                        console.log("Auth request")

                        socket.emit('authenticated');

                    } else {
                        console.log("Unauthorized request")
                        socket.emit('unauthorized',"Unauthorized Token");
                        socket.disconnect()
                    }
                })

        });

        socket.on('client_connection_request', function (data) {
            console.log("client connection request" + data.ip + " " + data.customId);
            UserStore.add(socket.id, data.customId, data.ip, Date.now(), data.cluster);
            const address = leadershipSelectionAlgorithm(socket.id);
            if(SmartContractRunner.getAllContracts().length !== 0) {
                socket.emit('get_all_election_contracts', SmartContractRunner.getAllContracts());
            }
            socket.emit('redirect_url', address);
            ConnectedNodeStore.removeAll();
        });


        socket.on('own_client', function () {
            console.log("My client conected")
        });

        socket.on('disconnect', function () {
            console.log("Disconnected Socket = " + socket.id);
            UserStore.remove(socket.id);
            HalfNodeConnectionStore.remove(socket.id)
            ConnectedNodeStore.removeAll();
        });


        socket.on('server_client', function (data) {
            // console.log("SERVER node id" + data)

        });

        socket.on('test_data', function () {
            socket.emit('test_get_info', UserStore.getAll());
            console.log("Pushed" + UserStore.getAll())
        });

        socket.on('getting_connected_node_details', function (data) {
            console.log("Node connection details | url : " + data.url + " Connection Data : " + data.childNodes);
            console.log(data);
            ConnectedNodeStore.add(data.url, data.childNodes, data.cluster);
        });

        socket.on('getting_connected_node_details_from_half_node', function (data) {
            console.log("Half Node connection details | url : " + data.url + " Connection Data : " + data.childNodes);
            ConnectedNodeStore.combineLists(data.url, data.childNodes );
        });

        socket.on('connected_to_directed_node', function (data) {
            // ConnectedNodeStore.removeAll();
            // io.emit('requesting_connection_details');
        });

        socket.on('half_node_connection', function (data) {
            console.log("connected to a half node");
            console.log(data);
            HalfNodeConnectionStore.add(socket.id,"",data,Date.now())
        });

        socket.on('eventToEmit', function(data, callback){
            console.log(data);
            callback('error', data.data);
        });

        socket.on('client_voted', async function(data, callback){
            if(nodeType === "2") {
                global.clientSocket .emit("client_voted",data)
            } else {

                let voteArr = [];
                voteArr = data.record.data;
                console.log("voted array");
                console.log(data.record.data);
                const id = voteArr[0].conId

                const halfNode = mainClusterNodeSelectionAlgorithm()

                const result = await validateRecord(halfNode, data.publicKey);
                if(result) {
                    await SmartContractRunner.addToRecordDataPool(data.record, id).then(async () => {
                        await SmartContractRunner.mineBlocks(id);
                    });
                    await SmartContractRunner.calculateResults(id)
                    global.io.emit("all_election_results", ElectionResultDataStore.getResults())
                    callback('error', "start_mining");
                } else {
                    callback('error', "error validating the public key");

                }

            }
        });

        socket.on('validate_vote_request', async function(data){
            console.log("Vote validating request recieved.... |" + data);
            await keyRef.orderByChild("publicKey").equalTo(data).once("value", snapshot => {
                if (snapshot.exists()) {
                    socket.emit('validation_result', true);
                } else {
                    socket.emit('validation_result', false);
                }
            });
        });

        socket.on('new_amendment_added_by_a_user', function (data) {
            console.log("new amendment added");
            console.log(data);
            global.io.emit('new_amendment_added_by_a_user', data)
        })

        socket.on('update_active_amendment', function (data) {
            console.log("validated amendment recieved and resending");
            console.log(data);
            global.io.emit('update_active_amendment', data)
        })
        socket.on('remove_rejected_amendment', function (data) {
            console.log("remove this invalid amendment from all the stores");
            console.log(data);
            global.io.emit('remove_rejected_amendment', data)
        })



    });




    if(nodeType === "2") {
        var socket1 = require('socket.io-client')("http://localhost:4003/", {
            forceNew: true
        });

        global.clientSocket = socket1;

        socket1.on('connect', function () {
            console.log("connected to main node");
            socket1.emit("half_node_connection",ip.address()+":"+port)
        });

        socket1.on('requesting_connection_details', async function () {
            console.log("main node asking connection details");
            global.io.emit('requesting_connection_details');
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await delay(5000);

            socket1.emit('getting_connected_node_details_from_half_node', { "url" : global.globalString, "childNodes" : ConnectedNodeStore.getConnectionDetails()});
        });

        socket1.on('new_election_created', function (data) {
            io.emit('new_election_created',data);
        });
        socket1.on('all_election_results', function (data) {
            io.emit('all_election_results',data);
        });

        socket1.on('new_amendment_added_by_a_user', function (data) {
        })

        socket1.on('disconnect', function () {
        });
    }

    async function validateRecord(url, data) {
        console.log("Validate this key...|" + data);
        const key = data;
        var result;

        var socket2 = require('socket.io-client')("" + url + "", {
            forceNew: true
        });

            await new Promise(resolve => {
                socket2.on('connect', async function (data) {

                console.log("Vote validating process started....Intializing connection");
                socket2.emit('validate_vote_request', key);

                socket2.on('validation_result', answer => {
                    resolve(answer);
                    console.log(answer);
                    result = answer;
                });
            });
            });



        return result;

    }


    function leadershipSelectionAlgorithm(socketId) {

    if(UserStore.getAll().length <= 2 ){
        console.log("Kept the connection" + UserStore.getAll().length);
            return 1;
    } else {
        UserStore.remove(socketId);
        var byDate = UserStore.getAll().slice(0);
        byDate.sort(function(a,b) {
            return a.timestamp - b.timestamp;
        });
        console.log('by date:');
        console.log(byDate);

        byDate[0].timestamp = Date.now();
        console.log(byDate[0].url);
        return byDate[0].url;
    }

}

function mainClusterNodeSelectionAlgorithm() {

    var byDate = HalfNodeConnectionStore.getAll().slice(0);
    byDate.sort(function(a,b) {
        return a.timestamp - b.timestamp;
    });
    byDate[0].timestamp = Date.now();
    console.log(byDate[0].url);
    return byDate[0].url;
}


