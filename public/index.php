<?php
require_once('connect.php');

if(!isset($_COOKIE['token'])) {
    header('location:/login/');
}

function getToken() {
    if(isset($_COOKIE['token'])) {
        return $_COOKIE['token'];
    }
    header('location:/login/');
    return null;
}

function getAccountName($conn) {
    $token = null;
    if(isset($_COOKIE['token'])) {
        $token = $_COOKIE['token'];
    }
    else {
        return;
    }
    $sql = 'SELECT username FROM users WHERE token = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token))) {
        while ($row = $stmt->fetch()) {
        $username = ucfirst($row['username']);
        echo '<a href="/profile/">'.$username.'\'s Profile</a>';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Project Red</title>
    <meta name="theme-color" content="#c80000">
    <link rel="stylesheet" href="css/style.css">
    <style>
        ul.menu {
            margin: 5%;
        }
        li.menu-option {
            text-align: left;
            list-style-type: none;
        }
    </style>
    <script type="text/javascript" src="js/engine/Engine.js"></script>
    <script type="text/javascript" src="js/engine/Vector.js"></script>
    <script type="text/javascript" src="js/engine/Entity.js"></script>
    <script type="text/javascript" src="js/engine/ServerSocket.js"></script>
</head>
<body>

<div class="header">
    <img class="logo" src="res/logo.png"/>
    <div class="dropdown-btn" onclick="toggleDropdown()">
        <div id="mainDropdown" class="dropdown-content">
            <a href="/">Home</a>
            <?php
            getAccountName($dbh);
            ?>
            <a href="/factions">Factions</a>
            <a href="/login">Login</a>
            <a href="/shop">Shop</a>
            <a href="/cart">Cart</a>
        </div>
    </div>
</div>

<div class="min-header">
    <a href="/">Home</a>
    <?php
    getAccountName($dbh);
    ?>
    <a href="/factions">Factions</a>
    <a href="/login">Login</a>
    <a href="/shop">Shop</a>
    <a href="/cart">Cart</a>
    <img class="top" src="res/button/top.png" onclick="scrollToTop()"/>
</div>

<div style="display: flex; background-color: rgba(0, 0, 0, .7);">
    <div id="textDiv" style="background-image: url('res/textbox.png'); background-size: 100% 100%; align-items: stretch; flex: 1; position: relative;">
        <div id="textWrap" style="position: absolute; width: 90%; height: 95%; margin: 5%; text-align: left; overflow-y: scroll;">
            <div class="text" id="textOutput"></div>
        </div>
    </div>
    <div style="align-items: stretch; flex: 3;">
        <canvas id="canvas"></canvas>
    </div>
    <div style="background-image: url('res/textbox.png'); background-size: 100% 100%; align-items: stretch; flex: 1; position: relative;">
        <div style="font-family: 'pokefont'; font-size: 36pt; padding-top: 8px;">Online:</div>
        <div id="clients-online" style="position: absolute; width: 90%; height: 88%; margin: 5%; margin-top: 0; text-align: left; overflow-y: scroll;">

        </div>
    </div>
</div>

<script>
    function toggleDropdown() {
        document.getElementById("mainDropdown").classList.toggle("show");
    }
    window.onclick = function(e) {
        if(!e.target.matches('.dropdown-btn')) {
            var elements = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].classList.contains('show')) elements[i].classList.remove('show');
            }
        }
    };
</script>

<script type="text/javascript" src="js/Game.js"></script>
<script type="text/javascript" src="js/Stats.js"></script>
<script type="text/javascript" src="js/World.js"></script>
</body>
</html>