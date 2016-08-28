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

function addProduct($conn, $pid) {
    $token = getToken();
    $sql = 'INSERT INTO orders_products (orders_id, products_id) (SELECT o.id, ? FROM users u LEFT JOIN orders o ON u.id = o.users_id AND o.status = "new" WHERE u.token = ?)';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($pid, $token))) {

    }
}

function deleteProduct($conn, $pid) {
    $token = getToken();
    $sql = 'DELETE op FROM users u LEFT JOIN orders o ON u.id = o.users_id AND o.status = "new" LEFT JOIN orders_products op ON o.id = op.orders_id WHERE u.token = ? AND op.id = ?';
    $stmt = $conn->prepare($sql);
    if ($stmt->execute(array($token, $pid))) {

    }
}

function getProducts($conn) {
    $empty = false;
    $token = getToken();
    $sql = 'SELECT p.name, p.price, p.image, op.id FROM users u LEFT JOIN orders o ON u.id = o.users_id AND o.status = "new" LEFT JOIN orders_products op ON o.id = op.orders_id LEFT JOIN products p ON op.products_id = p.id WHERE u.token = ?';
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
                             <span class="product-price"><b>$' . $row['price'] . '</b></span>
                         </div>
                         <div class="product-rate product-cat">
                               <form method="post" action="/cart/">
                                    <input type="hidden" name="id" value="' . $row['id'] . '"/>
                                    <input class="delete" type="submit" name="delete" value=" "/>
                                </form>
                         </div>
                     </li><br>';
            }
            else {
                $empty = true;
                echo '<li class="product">
                        <div class="product-detail product-cat">
                            <span>Your cart is empty...</span>
                        </div>
                      </li><br>';
            }
        }
    }
    return !$empty;
}

function getAccountName($conn) {
    $token = null;
    if (isset($_COOKIE['token'])) {
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

if(isset($_POST['submit'])) {
    $pid = $_POST['id'];
    addProduct($dbh, $pid);
}

if(isset($_POST['delete'])) {
    $pid = $_POST['id'];
    deleteProduct($dbh, $pid);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="theme-color" content="#c80000">
    <meta charset="UTF-8">
    <title>Cart</title>
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
    <ul class="products" style="text-align: center; margin: 0;">
        <?php
            if(getProducts($dbh)) {
                echo '<li class="product">
                            <div class="product-cat"><a href="/shop">Back to Shop</a></div>
                            <div class="product-rate product-cat">
                                <form method="post" action="/checkout/">
                                    <input type="submit" class="btn-black" name="submit" value="Checkout"/>
                                </form>
                            </div>
                        </li>';
            }
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
                if (elements[i].classList.contains("show")) elements[i].classList.remove("show");
            }
        }
    };
</script>
</body>
</html>