var http = require('http');
var fs = require('fs');
var mysql = require('mysql');
var jsonfile = require('jsonfile');

var app = http.createServer(function(req, res) {

}).listen(8000, '0.0.0.0');

function verifyAccount(token, success, fail) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('SELECT * FROM users WHERE token = ?', [token], function(err, rows) {
        if(!err && rows.length > 0) {
            var user = rows[0];
            connection.query('SELECT f.id, f.name, f.color, f.spawnx, f.spawny, fu.rank FROM factions_users fu LEFT JOIN factions f ON fu.factions_id = f.id WHERE fu.users_id = ?', [user.id], function(err, rows) {
                if(!err && rows.length > 0) {
                    user.faction = rows[0].name;
                    user.factionid = rows[0].id;
                    user.factionrank = rows[0].rank;
                    user.color = rows[0].color;
                    user.spawnx = rows[0].spawnx;
                    user.spawny = rows[0].spawny;
                    success(user);
                }
                else {
                    success(user);
                }
            });
            connection.end();
        }
        else {
            fail();
        }
    });
}

function updateAccount(username, x, y, rank) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('UPDATE users SET x = ?, y = ?, rank = ? WHERE username = ?', [x, y, rank, username], function(err, rows) {
        if(!err) {

        }
        else {

        }
    });

    connection.end();
}

var clients = [];
var hits = [];

var npcs = [];
var npcsArray = jsonfile.readFileSync('data/npcs.json').npcs;
for(var i = 0; i < npcsArray.length; i++) {
    var npc = npcsArray[i];
    npcs.push(new NPC(npcs.length - 1, npc.factionid, npc.x, npc.y));
}

var world = jsonfile.readFileSync('data/world.json').world;
var territory = jsonfile.readFileSync('data/territory.json').territory;
var sessionId = 0;

var io = require('socket.io').listen(app);

io.set('origins', 'localhost:* 192.168.0.29:* mmo.gammarush.com:*');

io.on('connection', function(socket) {
    var newClient = new Client(socket, sessionId);
    socket.emit('login_player', {id: newClient.id});

    socket.on('init_player', function(data) {
        verifyAccount(data.token, function(database) {
            newClient.username = database.username;
            newClient.x = database.x;
            newClient.y = database.y;
            newClient.sprite = database.sprite;
            newClient.rank = database.rank;
            newClient.faction = database.faction || "";
            newClient.factionid = database.factionid || 0;
            newClient.factionrank = database.factionrank || 'member';
            newClient.color = database.color;
            newClient.spawnx = database.spawnx || 0;
            newClient.spawny = database.spawny || 0;

            if(newClient.rank == 'banned') {
                socket.emit('ban_player');
                return;
            }
            for(var i = 0; i < clients.length; i++) {
                var client = clients[i];
                if(client.username == newClient.username) {
                    socket.emit('kick_player');
                    return;
                }
            }

            log('[' + socket.handshake.address + '] ' + newClient.username + ' has joined the game');
            socket.emit('chat', {username: '<span class="server">SERVER</span>', message: 'Welcome to the Project<span class="red">Red</span> Server!'});

            socket.emit('init_player', {id: newClient.id, x: newClient.x, y: newClient.y, dir: newClient.dir, username: newClient.username, sprite: newClient.sprite, faction: newClient.faction, factionid: newClient.factionid, color: newClient.color});
            socket.broadcast.emit('init_client', {id: newClient.id, x: newClient.x, y: newClient.y, dir: newClient.dir, username: newClient.username, sprite: newClient.sprite, faction: newClient.faction, factionid: newClient.factionid, color: newClient.color});

            socket.emit('init_territory', {territory: territory});

            for(var i = 0; i < clients.length; i++) {
                var client = clients[i];
                socket.emit('init_client', {id: client.id, x: client.x, y: client.y, dir: client.dir, username: client.username, sprite: client.sprite, faction: client.faction, color: client.color});
            }

            for(var i = 0; i < npcs.length; i++) {
                var npc = npcs[i];
                socket.emit('init_npc', {id: npc.id, factionid: npc.factionid, x: npc.x, y: npc.y, dir: npc.dir});
            }

            io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">A wild ' + newClient.username + '['+ newClient.faction + '] appeared!</span>'});

            clients.push(newClient);
            sessionId++;
        },
        function() {
            socket.emit('kick_player');
        });
    });

    socket.on('disconnect', function() {
        for(var i = 0; i < clients.length; i++) {
            var client = clients[i];
            if(client.socket == socket) {
                updateAccount(client.username, client.x, client.y, client.rank);
                log(client.username + ' has left the game');
                io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">' + client.username + ' has left the game</span>'});
                socket.broadcast.emit('delete_client', {username: client.username});
                clients.splice(i, 1);
            }
        }
    });

    socket.on('dir_client', function(data) {
        for(var i = 0; i < clients.length; i++) {
            var client = clients[i];
            if(client.socket == socket) client.dir = data.dir;
        }
        socket.broadcast.emit('dir_client', data);
    });

    socket.on('move_client', function(data) {
        for(var i = 0; i < clients.length; i++) {
            var client = clients[i];
            if(client.socket == socket) {
                client.x = data.waypointx * 16;
                client.y = data.waypointy * 16;
            }
        }
        socket.broadcast.emit('move_client', data);
    });

    socket.on('kill_client', function(data) {
        for(var i = 0; i < clients.length; i++) {
            var client = clients[i];
            if(client.username == data.username) {
                var x, y;
                if(client.spawnx == 0 && client.spawny == 0) {
                    var random = Math.floor(Math.random() * 3);
                    if(random == 0) {
                        x = 1392;
                        y = 4704;
                    }
                    else if(random == 1) {
                        x = 1520;
                        y = 3712;
                    }
                    else {
                        x = 1376;
                        y = 1776;
                    }
                }
                else {
                    x = client.spawnx;
                    y = client.spawny;
                }

                client.x = x;
                client.y = y;
                client.socket.emit('warp_player', {x: x, y: y});
                client.socket.broadcast.emit('warp_client', {id: client.id, x: x, y: y});
                if(data.attacker != '') io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">' + data.username + ' was killed by ' + data.attacker + '</span>'});
                //else io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">' + data.username + ' was killed</span>'});

                for(var j = 0; j < hits.length; j++) {
                    var hit = hits[j];
                    if(hit.target == data.username && hit.owner != data.attacker) {
                        io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="orange">The $' + hit.amount + ' hit on ' + hit.target + ' has been claimed!</span>'});
                        give(data.attacker, hit.amount);
                        give(hit.owner, -hit.amount);
                        hits.splice(j);
                    }
                }

                if(data.attacker != '') {
                    if(client.factionrank == 'owner') {
                        give(data.attacker, 300);
                        for(var j = 0; j < clients.length; j++) {
                            var attacker = clients[j];
                            if(attacker.username == data.attacker) {
                                if(attacker.factionid != 0) giveFactionPower(attacker.factionid, 50);
                            }
                        }
                        giveFactionPower(client.factionid, -25);
                    }
                    else give(data.attacker, 100);
                    give(data.username, -50);
                }

            }
        }
    });

    socket.on('kill_npc', function(data) {
        for(var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            if(npc.id == data.id) {
                npc.x = npc.spawnx;
                npc.y = npc.spawny;
                io.sockets.emit('warp_npc', {id: npc.id, x: npc.x, y: npc.y});
            }
        }
    });

    socket.on('init_projectile', function(data) {
        io.sockets.emit('init_projectile', data);
    });

    socket.on('chat', function(data) {
        var username = "";
        var rank = "member";
        var message = data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        for(var i = 0; i < clients.length; i++) {
            var client = clients[i];
            if (client.socket == socket) {
                username = client.username;
                rank = client.rank;
            }
        }
        if(message.charAt(0) == "/") {
            var end = message.indexOf(" ");
            if(end == -1) end = message.length;
            var command = message.slice(1, end).toLowerCase();
            if(rank == "admin") {
                if(command == 'balance') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    clientname = clientname.split(" ")[0];
                    balance(clientname, socket);
                }
                if(command == 'ban') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    clientname = clientname.split(" ")[0];
                    ban(clientname);
                }
                if(command == 'give') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    var amount = clientname.split(" ")[1];
                    clientname = clientname.split(" ")[0];
                    give(clientname, amount);
                }
                if(command == 'kick') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    clientname = clientname.split(" ")[0];
                    kick(clientname);
                }

                if(command == 'pardon') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    clientname = clientname.split(" ")[0];
                    pardon(clientname);
                }

                if(command == 'say') {
                    var string = message.slice(message.indexOf(" ") + 1);
                    io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: string});
                }

                if(command == 'teleport') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    var clientname1 = clientname.split(" ")[0];
                    var clientname2 = clientname.split(" ")[1];

                    for(var i = 0; i < clients.length; i++) {
                        if(clients[i].username == clientname1) {
                            var client1 = clients[i];
                            for(var j = 0; j < clients.length; j++) {
                                if(clients[j].username == clientname2) {
                                    var client2 = clients[j];
                                    client1.x = client2.x;
                                    client1.y = client2.y;
                                    client1.socket.emit('warp_player', {x: client2.x, y: client2.y});
                                    client1.socket.broadcast.emit('warp_client', {id: client.id, x: client2.x, y: client2.y});
                                }
                            }

                        }
                    }
                }
            }
            else {
                if(command == 'balance') {
                    balance(username, socket);
                }
                if(command == 'teleport') {
                    var clientname = message.slice(message.indexOf(" ") + 1);
                    clientname = clientname.split(" ")[0];

                    for(var i = 0; i < clients.length; i++) {
                        if(clients[i].username == username) {
                            var client1 = clients[i];
                            for(var j = 0; j < clients.length; j++) {
                                if(clients[j].username == clientname) {
                                    var client2 = clients[j];
                                    if(client1.faction == client2.faction && client1.faction != "") {
                                        client1.x = client2.x;
                                        client1.y = client2.y;
                                        client1.socket.emit('warp_player', {x: client2.x, y: client2.y});
                                        client1.socket.broadcast.emit('warp_client', {id: client.id, x: client2.x, y: client2.y});
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if(command == 'bribe') {
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client = clients[i];
                        if(client.factionrank == 'owner') {
                            var id = client.factionid;
                            var x = Math.floor(client.x / 16);
                            var y = Math.floor(client.y / 16);
                            if(id != 0 && territory[y][x] == id) bribe(id, x, y, socket);
                        }
                    }
                }
            }

            if(command == 'claim') {
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client = clients[i];
                        if(client.factionrank == 'owner') {
                            var id = client.factionid;
                            var x = Math.floor(client.x / 16);
                            var y = Math.floor(client.y / 16);
                            if(id != 0) claim(id, x, y);
                        }
                    }
                }
            }

            if(command == 'dispute') {
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client = clients[i];
                        var id = client.factionid;
                        var x = Math.floor(client.x / 16);
                        var y = Math.floor(client.y / 16);
                        if(id != 0) dispute(id, x, y);
                    }
                }
            }

            if(command == 'faction') {
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client = clients[i];
                        getFactionInfo(client.factionid, socket);
                    }
                }
            }

            if(command == 'hit') {
                var data = message.slice(message.indexOf(" ") + 1);
                var target = data.split(" ")[0];
                var amount = parseInt(data.split(" ")[1]);
                amount = Math.floor(amount / 50) * 50;
                if(amount <= 0) return;
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client1 = clients[i];
                        for(var j = 0; j < clients.length; j++) {
                            if(clients[j].username == target) {
                                var client2 = clients[j];
                                if((client1.faction != client2.faction || client1.faction == "") && client1.username != client2.username) {
                                    hit(client1, client2, amount);
                                }
                            }
                        }
                    }
                }
            }

            if(command == 'home') {
                for(var i = 0; i < clients.length; i++) {
                    if (clients[i].username == username) {
                        var client = clients[i];
                        var id = client.factionid;
                        if(id != 0) {
                            client.x = client.spawnx;
                            client.y = client.spawny;
                            client.socket.emit('warp_player', {x: client.spawnx, y: client.spawny});
                            client.socket.broadcast.emit('warp_client', {id: client.id, x: client.spawnx, y: client.spawny});
                        }
                    }
                }
            }

            if(command == 'list') {
                var list = '<span class="yellow">People Online: ' + clients.length + '</span><br>';
                for(var i=0; i<clients.length; i++) {
                    list += (i + 1) + '. ' + clients[i].username + '<br>';
                }
                socket.emit('chat', {username: '<span class="server">SERVER</span>', message: list});
            }

            if(command == 'setspawn') {
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client = clients[i];
                        var id = client.factionid;
                        var x = Math.floor(client.x / 16);
                        var y = Math.floor(client.y / 16);
                        if(territory[y][x] == id || territory[y][x] == 0) {
                            client.spawnx = x * 16;
                            client.spawny = y * 16;
                        }
                    }
                }
            }

            if(command == 'transfer') {
                var data = message.slice(message.indexOf(" ") + 1);
                var amount = parseInt(data.split(" ")[0]);
                amount = Math.floor(amount / 50) * 50;
                if(amount <= 0) return;
                for(var i = 0; i < clients.length; i++) {
                    if(clients[i].username == username) {
                        var client = clients[i];
                        transfer(client.factionid, username, amount, socket);
                    }
                }
            }

        }
        else {
            if(rank == 'admin') username = '<span class="admin">' + username + '</span>';
            io.sockets.emit('chat', {username: username, message: message});
        }
    });
});

function update() {
    for(var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        var exit = false;
        for(var j = 0; j < clients.length; j++) {
            var client = clients[j];
            if(client.factionid != npc.factionid || npc.factionid == 0) {
                if(!exit) {
                    var dx = Math.floor(npc.x / 16) - Math.floor(client.x / 16);
                    var dy = Math.floor(npc.y / 16) - Math.floor(client.y / 16);
                    if(dx == 0 && dy != 0 && Math.abs(dy) < 15) {
                        var dir = dy / Math.abs(dy);

                        if(Math.abs(dy) < 5) io.sockets.emit('init_projectile', {x: npc.x, y: npc.y, dirx: 0, diry: -dir, owner: 'npc-' + npc.id});

                        for(var k = 0; k < Math.abs(dy); k++) {
                            if(world[Math.floor(npc.y / 16) - k * dir][Math.floor(npc.x / 16)] != 0 || territory[Math.floor(npc.y / 16) - k * dir][Math.floor(npc.x / 16)] != npc.factionid) exit = true;
                        }
                        if(!exit) {
                            for(var k = 0; k < npcs.length; k++) {
                                var npc1 = npcs[k];
                                if(npc.id != npc1.id && npc.x == npc1.x && npc.y -16 * dir == npc1.y) exit = true;
                            }
                            if(!exit) {
                                io.sockets.emit('move_npc', {id: npc.id, x: npc.x, y: npc.y, waypointx: Math.floor(npc.x / 16), waypointy: Math.floor(npc.y / 16) - dir});
                                npc.y -= 16 * dir;

                                exit = true;
                            }
                        }
                        if(dir == 1) npc.dir = 0;
                        else npc.dir = 2;
                    }
                    else if(dy == 0 && dx != 0 && Math.abs(dx) < 15) {
                        var dir = dx / Math.abs(dx);

                        if(Math.abs(dx) < 5) io.sockets.emit('init_projectile', {x: npc.x, y: npc.y, dirx: -dir, diry: 0, owner: 'npc-' + npc.id});

                        for(var k = 0; k < Math.abs(dx); k++) {
                            if(world[Math.floor(npc.y / 16)][Math.floor(npc.x / 16) - k * dir] != 0 || territory[Math.floor(npc.y / 16)][Math.floor(npc.x / 16) - k * dir] != npc.factionid) exit = true;
                        }
                        if(!exit) {
                            for(var k = 0; k < npcs.length; k++) {
                                var npc1 = npcs[k];
                                if(npc.id != npc1.id && npc.x - 16 * dir == npc1.x && npc.y == npc1.y) exit = true;
                            }
                            if(!exit) {
                                io.sockets.emit('move_npc', {id: npc.id, x: npc.x, y: npc.y, waypointx: Math.floor(npc.x / 16) - dir, waypointy: Math.floor(npc.y / 16)});
                                npc.x -= 16 * dir;

                                exit = true;
                            }
                        }
                        if(dir == 1) npc.dir = 3;
                        else npc.dir = 1;
                    }
                    io.sockets.emit('dir_npc', {id: npc.id, dir: npc.dir});
                }
            }
        }
        if(!exit) {
            var random = Math.floor(Math.random() * 4);
            if(random == 0 && world[Math.floor(npc.y / 16) - 1][Math.floor(npc.x / 16)] == 0 && territory[Math.floor(npc.y / 16) - 1][Math.floor(npc.x / 16)] == npc.factionid) {
                io.sockets.emit('move_npc', {id: npc.id, x: npc.x, y: npc.y, waypointx: Math.floor(npc.x / 16), waypointy: Math.floor(npc.y / 16) - 1});
                npc.y -= 16;
            }
            if(random == 1 && world[Math.floor(npc.y / 16)][Math.floor(npc.x / 16) + 1] == 0 && territory[Math.floor(npc.y / 16)][Math.floor(npc.x / 16) + 1] == npc.factionid) {
                io.sockets.emit('move_npc', {id: npc.id, x: npc.x, y: npc.y, waypointx: Math.floor(npc.x / 16) + 1, waypointy: Math.floor(npc.y / 16)});
                npc.x += 16;
            }
            if(random == 2 && world[Math.floor(npc.y / 16) + 1][Math.floor(npc.x / 16)] == 0 && territory[Math.floor(npc.y / 16) + 1][Math.floor(npc.x / 16)] == npc.factionid) {
                io.sockets.emit('move_npc', {id: npc.id, x: npc.x, y: npc.y, waypointx: Math.floor(npc.x / 16), waypointy: Math.floor(npc.y / 16) + 1});
                npc.y += 16;
            }
            if(random == 3 && world[Math.floor(npc.y / 16)][Math.floor(npc.x / 16) - 1] == 0 && territory[Math.floor(npc.y / 16)][Math.floor(npc.x / 16) - 1] == npc.factionid) {
                io.sockets.emit('move_npc', {id: npc.id, x: npc.x, y: npc.y, waypointx: Math.floor(npc.x / 16) - 1, waypointy: Math.floor(npc.y / 16)});
                npc.x -= 16;
            }
            npc.dir = random;
            io.sockets.emit('dir_npc', {id: npc.id, dir: npc.dir});
        }
    }
}

setInterval(update, 350);

function Client(socket, id) {
    this.socket = socket;
    this.x = 0;
    this.y = 0;
    this.dir = 2;
    this.id = id;
    this.username = "";
    this.sprite = "";
    this.rank = "member";
    this.faction = "";
    this.factionid = 0;
    this.factioncolor = "black";
    this.spawnx = 0;
    this.spawny = 0;
}

function NPC(id, factionid, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.dir = 2;
    this.factionid = factionid;
    this.spawnx = x;
    this.spawny = y;
}

function Hit(owner, target, amount) {
    this.owner = owner;
    this.target = target;
    this.amount = amount;
}

function log(string) {
    var date = new Date();
    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    console.log('[' + time + '] ' + string);
}

function balance(username, socket) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('SELECT money FROM users WHERE username = ?', [username], function(err, rows) {
        if(!err && rows.length > 0) {
            var amount = rows[0].money;
            if(socket != null) socket.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">' + username + '\'s balance is $' + amount + '</span>'});
        }
        else {

        }
    });

    connection.end();
}

function ban(username) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('UPDATE users SET rank = "banned" WHERE username = ?', [username], function(err, rows) {
        if(!err) {
            for(var i = 0; i < clients.length; i++) {
                var client = clients[i];
                if(client.username == username) {
                    client.rank = "banned";
                    client.socket.emit('ban_player');
                }
            }
            log(username + ' banned');
        }
        else {

        }
    });

    connection.end();
}

function bribe(id, x, y, socket) {
    if(x < 0 || y < 0 || x >= 450 || y >= 450) return;
    if(world[y-1][x-1] != 0 || world[y-1][x] != 0 || world[y-1][x+1] != 0 || world[y][x-1] != 0 || world[y][x] != 0 || world[y][x+1] != 0 || world[y+1][x-1] != 0 || world[y+1][x] != 0 || world[y+1][x+1] != 0) return;
    if(territory[y][x] == id) {
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'projectreddb'
        });
        connection.connect();

        connection.query('SELECT money, power FROM factions WHERE id = ?', [id], function(err, rows) {
            if(!err && rows.length > 0) {
                var balance = rows[0].money;
                var power = rows[0].power;
                if(balance >= 50000 && power >= 2500) {
                    var npc = new NPC(npcs.length - 1, id, x * 16, y * 16);
                    npcs.push(npc);

                    giveFactionMoney(id, -50000);
                    giveFactionPower(id, -2500);

                    var npcsArray = [];
                    for(var i = 0; i < npcs.length; i++) {
                        npcsArray.push({factionid: npcs[i].factionid, x: npcs[i].spawnx, y: npcs[i].spawny});
                    }
                    jsonfile.writeFileSync('npcs.json', {
                        npcs: npcsArray
                    });

                    io.sockets.emit('init_npc', {id: npc.id, factionid: npc.factionid, x: npc.x, y: npc.y, dir: npc.dir});
                    socket.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="orange">An officer has been bribed!</span>'});
                }
            }
            else {

            }
        });

        connection.end();

    }
}

function claim(id, x, y) {
    if(x < 0 || y < 0 || x >= 450 || y >= 450) return;
    if(territory[y][x] == 0) {
        if(territory[y-1][x] == id || territory[y][x-1] == id || territory[y+1][x] == id || territory[y][x+1] == id) {
            var connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'root',
                database: 'projectreddb'
            });
            connection.connect();

            connection.query('SELECT money, power FROM factions WHERE id = ?', [id], function(err, rows) {
                if(!err && rows.length > 0) {
                    var balance = rows[0].money;
                    var power = rows[0].power;
                    if(balance >= 200 && power >= 500) {
                        territory[y][x] = id;
                        giveFactionMoney(id, -200);
                        giveFactionPower(id, 25);
                        jsonfile.writeFileSync('territory.json', {
                            territory: territory
                        });
                        io.sockets.emit('edit_territory', {id: id, x: x, y: y});
                    }
                }
                else {

                }
            });

            connection.end();

        }
    }
}

function dispute(id, x, y) {
    if(x < 0 || y < 0 || x >= 450 || y >= 450) return;
    if(territory[y][x] != 0 && territory != id) {
        if(territory[y-1][x] == id || territory[y][x-1] == id || territory[y+1][x] == id || territory[y][x+1] == id) {
            var connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'root',
                database: 'projectreddb'
            });
            connection.connect();

            connection.query('SELECT money, power FROM factions WHERE id = ?', [id], function(err, rows) {
                if(!err && rows.length > 0) {
                    var balance1 = parseInt(rows[0].money);
                    var power1 = parseInt(rows[0].power);
                    var id2 = territory[y][x];
                    connection.query('SELECT money, power FROM factions WHERE id = ?', [id2], function(err, rows) {
                        if (!err && rows.length > 0) {
                            var balance2 = parseInt(rows[0].money);
                            var power2 = parseInt(rows[0].power);
                            if(power1 > power2 && balance1 >= 400 && power1 >= 100) {
                                territory[y][x] = id;
                                giveFactionMoney(id, -400);
                                giveFactionPower(id, -100);
                                jsonfile.writeFileSync('data.json', {
                                    territory: territory
                                });
                                io.sockets.emit('edit_territory', {id: id, x: x, y: y});
                            }
                        }
                        else {

                        }
                    });
                    connection.end();
                }
                else {

                }
            });
        }
    }
}

function getFactionInfo(id, socket) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('SELECT * FROM factions WHERE id = ?', [id], function(err, rows) {
        if(!err && rows.length > 0) {
            var name = rows[0].name;
            var money = rows[0].money;
            var power = rows[0].power;
            socket.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">' + name + ' Family:<br>Money: $' + money + '<br>Power: ' + power + '</span>'});
        }
    });

    connection.end();
}

function give(username, amount) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('UPDATE users SET money = GREATEST(money + ?, 0) WHERE username = ?', [amount, username], function(err, rows) {
        if(!err) {
            for(var i = 0; i < clients.length; i++) {
                var client = clients[i];
                if(client.username == username) {
                    if (amount >= 0) client.socket.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="green">You have received $' + amount + '</span>'});
                    else client.socket.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="red">You have lost $' + -amount + '</span>'});
                }
            }
            log(username + ' given money');
        }
        else {

        }
    });

    connection.end();
}

function hit(owner, target, amount) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('SELECT money FROM users WHERE username = ?', [owner.username], function(err, rows) {
        if(!err && rows.length > 0) {
            var balance = rows[0].money;
            if(balance >= amount) {
                hits.push(new Hit(owner.username, target.username, amount));
                io.sockets.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="orange">A $' + amount + ' hit has been placed on ' + target.username + '!</span>'});
            }
        }
        else {

        }
    });

    connection.end();
}

function kick(username) {
    for(var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if(client.username == username) {
            client.socket.emit('kick_player');
            client.socket.broadcast.emit('delete_client', {username: client.username});
            client.socket.broadcast.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="yellow">' + client.username + ' has left the game</span>'});
            clients.splice(i, 1);
            log(username + ' kicked');
        }
    }
}

function pardon(username) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('UPDATE users SET rank = "member" WHERE username = ?', [username], function(err, rows) {
        if(!err) {
            log(username + ' pardoned');
        }
        else {

        }
    });

    connection.end();
}

function giveFactionMoney(id, amount) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('UPDATE factions SET money = GREATEST(money + ?, 0) WHERE id = ?', [amount, id], function(err, rows) {
        if(!err) {

        }
        else {

        }
    });

    connection.end();
}

function giveFactionPower(id, amount) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('UPDATE factions SET power = GREATEST(power + ?, 0) WHERE id = ?', [amount, id], function(err, rows) {
        if(!err) {

        }
        else {

        }
    });

    connection.end();
}

function transfer(id, username, amount, socket) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectreddb'
    });
    connection.connect();

    connection.query('SELECT money FROM users WHERE username = ?', [username], function(err, rows) {
        if(!err && rows.length > 0) {
            var balance = rows[0].money;
            log(balance);
            if(balance >= amount) {
                connection.query('UPDATE factions SET money = GREATEST(money + ?, 0) WHERE id = ?', [amount, id], function(err, rows) {
                    if (!err) {
                        give(username, -amount);
                        if(socket != null) socket.emit('chat', {username: '<span class="server">SERVER</span>', message: '<span class="orange">$' + amount + ' transferred to your faction</span>'});
                    }
                    else {
                        console.log(err);
                    }
                });
                connection.end();
            }
        }
        else {

        }
    });
}