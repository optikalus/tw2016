<html>
<head>
  <title>Grueler</title>
  <script src="//code.jquery.com/jquery-1.11.3.min.js"></script>
  <script src="//code.jquery.com/jquery-migrate-1.2.1.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.js"></script>
  <script src="http://marvl.infotech.monash.edu/webcola/cola.v3.min.js"></script>
  <script src="/greuler.min.js"></script>
</head>
<body>

<select id="cluster">
<option name="The Federation">The Federation</option>
@foreach ($clusters as $cluster)
<option name="{{ $cluster->name }}" @if (isset($selectedCluster) && $selectedCluster == $cluster->name) selected @endif>{{ $cluster->name }}</option>
@endforeach
</select>
<button id="changecluster" type="button">View</button>

<div id="greulerdisplay"></div>

  <script>
    $('#changecluster').click(function() {
      setTimeout(function() { window.location = '/greuler/cluster/' + $('#cluster').val(); }, 0);
    });

@if (isset($nodes))
/*      var nodes = [];
      var nodesTemp = [];
      var links = [];
      for (var i in data) {
        if (nodesTemp.indexOf(data[i].sector) < 0)
          nodesTemp.push(data[i].sector);
        links.push({'source': data[i].sector, 'target': data[i].warp});
      }
      for (i=0; i < nodesTemp.length; i++) {
        nodes.push({'id': nodesTemp[i]});
      }
 */
      instance = greuler({
        target: '#greulerdisplay',
        width: 2560,
        height: 1440,
        //data: greuler.Graph.random({connected: true})
        data: {
          nodes: [{{ $nodes }}],
          links: [{{ $links }}]
        }
      });
      instance.update();
@endif
  </script>
</body>
</html>
