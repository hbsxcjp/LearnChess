<?php
$con = mysqli_connect("localhost","webuser","POKMsJT9");
if (!$con){
  die('Connect Failed: ' . mysqli_connect_error());//连接错误
}
die('Connect Success!');
?>
