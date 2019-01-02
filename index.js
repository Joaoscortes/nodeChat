const mongodb = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;
var express = require('express');

var app = express();

var server = app.listen(3000, () => {
    console.log('server is running on port', server.address().port);
});
app.use(express.static(__dirname));

// Mongodb Url
const url = 'MONGO URL';

const dbName = 'mongochat';

mongodb.connect(url,{ useNewUrlParser: true }, function (err, client) {
    if (err) {
        throw err;
    }
    console.log('MongoDB Connected!!!');

    const db = client.db(dbName);

    io.on('connection', socket => {
        let chat = db.collection('chats');

        sendStatus = function (status) {
            socket.emit('status', status);
        }

        chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
            if (err) {
                throw err;
            }

            socket.emit('msg', res);
        });

        socket.on('input', function (data) {
            let name = data.name;
            let message = data.message;

            if (name == '' || message == '') {
                sendStatus('Please enter a name and message');
            } else {
                chat.insertOne({ name: name, message: message }, function () {
                    io.emit('msg', [data]);

                    sendStatus({
                        message: 'Message Sent',
                        clear: true
                    })
                })
            }
        })

        socket.on('clear', function (data) {
            chat.deleteMany({}, function () {
                socket.emit('cleared');
            })
        })
    })
})