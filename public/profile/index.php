<?php
require_once('../connect.php');

function getToken() {
    if (isset($_COOKIE['token'])) {
        return $_COOKIE['token'];
    }
    else {
        header('location:/login/');
    }
}

function getInventory($conn) {
    $empty = false;
    $token = getToken();
    $sql = 'SELECT p.name, p.price, p.image, p.id FROM users u LEFT JOIN inventory i ON u.id = i.users_id LEFT JOIN products p ON i.products_id = p.id WHERE u.token = ? ORDER BY p.name';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token))) {
        while ($row = $stmt->fetch()) {
            if($row['id'] != null) {
                echo '<li class="product">
                         <div class="product-img product-cat">
                            <img class="product-img" src="../' . $row['image'] . '"/>
                         </div>
                         <div class="product-detail product-cat">
                             <span class="product-name">' . $row['name'] . '</span><br>
                         </div>
                         <div class="product-rate product-cat">
                               <form method="post" action="/profile/">
                                    <input type="hidden" name="id" value="' . $row['id'] . '"/>
                                    <input class="select" type="submit" name="submit" value=" "/>
                                </form>
                         </div>
                     </li>';
            }
            else {
                echo '<li class="product">
                        <div class="product-detail product-cat">
                            <span>Your inventory is empty...</span>
                        </div>
                      </li><br>';
            }
        }
    }
    return !$empty;
}

function changeSprite($conn, $pid) {
    $token = getToken();
    $sql = 'UPDATE users u LEFT JOIN inventory i ON u.id = i.users_id LEFT JOIN products p ON i.products_id = p.id SET u.sprite = p.content WHERE u.token = ? AND i.products_id = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token, $pid))) {

    }
}

function getFactionRequests($conn) {
    $token = getToken();
    $sql = 'SELECT uu.id, uu.username, uu.sprite FROM users u LEFT JOIN factions_users fu ON u.id = fu.users_id AND fu.rank = "owner" LEFT JOIN factions_requests fr ON fu.factions_id = fr.factions_id LEFT JOIN users uu ON fr.users_id = uu.id WHERE u.token = ?';
    $stmt = $conn->prepare($sql);
    if($stmt->execute(array($token))) {
        $requests = '<span class="red" style="font-size: 24pt">Requests</span>';
        while ($row = $stmt->fetch()) {
            if($row['id'] != null) {
                $username = $row['username'];
                $sprite = $row['sprite'];
                $requests .= '<div class="client-list">
                                    <img width="64" height="96" src="../res/preview/' . substr($sprite, 0, -4) . 'pre.png">
                                    <div>
                                        <span>' . $username .  '</span>
                                        <form method="post" action="">
                                            <input type="hidden" name="id" value="' . $row['id'] . '"/>
                                            <input class="btn-black" type="submit" name="accept" value="ACCEPT"/>
                                        </form>
                                    </div>
                                </div>';
            }
        }
        echo $requests;
    }
}

function getFactionMembers($conn) {
    $token = getToken();
    $sql = 'SELECT uu.id, uu.username, uu.sprite FROM users u LEFT JOIN factions_users fu ON u.id = fu.users_id AND fu.rank = "owner" LEFT JOIN factions_users fuu ON fu.factions_id = fuu.factions_id LEFT JOIN users uu ON fuu.users_id = uu.id WHERE u.token = ? AND uu.id != fu.users_id';
    $stmt = $conn->prepare($sql);
    if($stmt->execute(array($token))) {
        $members = '<span class="red" style="font-size: 24pt">Members</span>';
        while ($row = $stmt->fetch()) {
            if($row['id'] != null) {
                $username = $row['username'];
                $sprite = $row['sprite'];
                $members .= '
                    <div class="client-list">
                        <img width="64" height="96" src="../res/preview/' . substr($sprite, 0, -4) . 'pre.png">
                        <div>
                            <span>' . $username .  '</span>
                            <form method="post" action="">
                                <input type="hidden" name="id" value="' . $row['id'] . '"/>
                                <input class="btn-black" type="submit" name="kick" value="KICK"/>
                            </form>
                        </div>
                    </div>';
            }
        }
        echo $members;
    }
}

function joinFaction($conn, $id) {
    deleteRequests($conn, $id);
    deleteMemberships($conn, $id);
    $token = getToken();
    $sql = 'INSERT INTO factions_users (factions_id, users_id) (SELECT fu.factions_id, ? FROM users u LEFT JOIN factions_users fu ON u.id = fu.users_id AND fu.rank = "owner" WHERE u.token = ?)';
    $stmt = $conn->prepare($sql);
    if($stmt->execute(array($id, $token))) {
    }
}

function calculateFactionPower($conn, $id) {
    $power = getFactionMemberCount($conn, $id) * 100;
    $sql = 'UPDATE factions SET power = ? WHERE id = ?';
    $stmt = $conn->prepare($sql);
    if($stmt->execute(array($power, $id))) {
    }
}

function getFactionMemberCount($conn, $id) {
    $sql = 'SELECT * FROM factions_users WHERE factions_id = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($id))) {
        $count = 0;
        while ($row = $stmt->fetch()) {
            if($row['id'] != null) $count++;
        }
        return $count;
    }
}

function deleteRequests($conn, $id) {
    $sql = 'DELETE FROM factions_requests WHERE users_id = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($id))) {
    }
}

function deleteMemberships($conn, $id) {
    $sql = 'DELETE FROM factions_users WHERE users_id = ? AND rank != "owner"';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($id))) {
    }
}

function getAccountProfile($conn) {
    $token = getToken();
    $sql = 'SELECT username, sprite, money, rank FROM users WHERE token = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token))) {
        while ($row = $stmt->fetch()) {
            $username = $row['username'];
            $sprite = $row['sprite'];
            $money = $row['money'];
            $rank = ucfirst($row['rank']);
            echo '<div class="client-list">
                        <img width="64" height="96" src="../res/preview/' . substr($sprite, 0, -4) . 'pre.png">
                        <div>
                            <span>Username: ' . $username .  '</span>&nbsp;&nbsp;&nbsp;<span>Rank: ' . $rank . '</span><br>
                            <span>Balance: $' . $money .  '</span>
                        </div>
                    </div>';
        }
    }
}

function getAccountName($conn) {
    $token = getToken();
    $sql = 'SELECT username FROM users WHERE token = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token))) {
        while ($row = $stmt->fetch()) {
            $username = ucfirst($row['username']);
            echo '<a href="/profile/">'.$username.'\'s Profile</a>';
        }
    }
}
if(isset($_POST['accept'])) {
    $id = $_POST['id'];
    joinFaction($dbh, $id);
}
if(isset($_POST['kick'])) {
    $id = $_POST['id'];
    deleteMemberships($dbh, $id);
}
if(isset($_POST['submit'])) {
    $pid = $_POST['id'];
    changeSprite($dbh, $pid);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="theme-color" content="#c80000">
    <meta charset="UTF-8">
    <title>Settings</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body onscroll="toggleHeader()">
<div class="header">
    <img class="logo" src="../res/logo.png"/>
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
    <img class="top" src="../res/button/top.png" onclick="scrollToTop()"/>
</div>

<div class="content">
    <ul class="products">
        <div>
            <li class="product" style="font-weight: bold; margin-bottom: 0; background-color: #c80000;">
                <span style="font-size: 32pt;">Account</span>
            </li><br>
            <li class="product">
                <?php
                getAccountProfile($dbh);
                ?>
            </li>
        </div>
        <div>
            <li class="product" style="font-weight: bold; margin-bottom: 0; background-color: #c80000;">
                <span style="font-size: 32pt;">Faction</span>
            </li><br>
            <li class="product" style="height: 640px; overflow-y: scroll">
                <?php
                getFactionMembers($dbh);
                ?>
            </li>
            <li class="product" style="height: 640px; overflow-y: scroll">
                <?php
                getFactionRequests($dbh);
                ?>
            </li>
        </div>
        <div>
            <li class="product" style="font-weight: bold; margin-bottom: 0; background-color: #c80000;">
                <span style="font-size: 32pt;">Inventory</span>
            </li><br>
            <?php
            getInventory($dbh);
            ?>
        </div>
    </ul>
</div>

<script>
    function scrollToTop() {
        window.scrollTo(0,0);
    }

    function toggleHeader() {
        var header = document.getElementsByClassName("header")[0];
        var minHeader = document.getElementsByClassName("min-header")[0];
        var scroll = window.scrollY;
        if(scroll > header.clientHeight) {
            header.style.display = "none";
            minHeader.style.display = "block";
        }
        else {
            header.style.display = "block";
            minHeader.style.display = "none";
        }
    }

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
</body>
</html>
