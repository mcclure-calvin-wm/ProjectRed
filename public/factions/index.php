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

function getFactions($conn) {
    $sql = 'SELECT * FROM factions ORDER BY name';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array())) {
        while ($row = $stmt->fetch()) {
            $members = getFactionMemberCount($conn, $row['id']);
            echo '<li class="product">
                 <div class="product-img product-cat">
                    <img class="product-img" src="../' . $row['image'] . '"/>
                 </div>
                 <div class="product-detail product-cat">
                     <span class="product-name">The ' . $row['name'] . ' Family</span><br><br>
                     <span class="product-name">Members: ' . $members . '</span><br>
                 </div>
                 <div class="product-rate product-cat">
                    <div style="width: 128px; height: 128px;">
                        <form method="post" action="">
                            <input type="hidden" name="id" value="' . $row['id'] . '"/>
                            <input class="btn-black" type="submit" name="request" value="JOIN"/>
                        </form>
                    </div>
                 </div>
             </li>';
        }
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

function requestFaction($conn, $id) {
    deleteRequests($conn);
    if(!deleteMemberships($conn)) return;
    $token = getToken();
    $sql = 'INSERT INTO factions_requests (factions_id, users_id) (SELECT ?, u.id FROM users u WHERE u.token = ?)';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($id, $token))) {

    }
}

function deleteRequests($conn) {
    $token = getToken();
    $sql = 'DELETE FROM factions_requests WHERE users_id = (SELECT u.id FROM users u WHERE u.token = ?)';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token))) {
    }
}

function deleteMemberships($conn) {
    $token = getToken();
    $sql = 'DELETE FROM factions_users WHERE users_id = (SELECT u.id FROM users u WHERE u.token = ?) AND rank != "owner"';
    $stmt = $conn->prepare($sql);
    if($stmt->execute(array($token))) {
        return true;
    }
    else {
        return false;
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

if(isset($_POST['request'])) {
    $id = $_POST['id'];
    requestFaction($dbh, $id);
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
        <?php
        getFactions($dbh);
        ?>
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