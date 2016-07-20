<?php

require_once(__DIR__.'/../vendor/autoload.php');

$server = new Hoa\Websocket\Server(new Hoa\Socket\Server('tcp://127.0.0.1:2002'));

$server->on('message', function( Hoa\Core\Event\Bucket $bucket ) {
    $data = $bucket->getData();
    if ($data['message'] == 'ping')
      $bucket->getSource()->send('pong');
    else
      $bucket->getSource()->broadcast($data['message']);
    return;
});

$server->run();

?>
