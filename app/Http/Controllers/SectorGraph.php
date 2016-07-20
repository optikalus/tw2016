<?php

namespace Tradewars\Http\Controllers;

use Illuminate\Http\Request;
use Cache;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;
use Fhaculty\Graph\Graph;
use Graphp\Algorithms\ShortestPath\Dijkstra;

class SectorGraph extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($fromSector=1,$toSector=1000)
    {

      $graph = new Graph();

      $universe = \Tradewars\Universe::find(1);

      $vertices = Cache::rememberForever('universe_' . $universe->id . '_vertices_cache', function() use ($graph, $universe) {
      
        $sectors = $universe->sectors()->get();
        $vertices = [];
        $edges = [];
        foreach ($sectors as $sector)
          $vertices[$sector->number] = $graph->createVertex($sector->number);

        foreach ($sectors as $sector)
          foreach (\Tradewars\Sector::find($sector->id)->warps as $warp)
            $edges[$sector->number] = $vertices[$sector->number]->createEdgeTo($vertices[$warp->number])->setWeight(1);

        return $vertices;
      });

      echo "<pre>\n";

      $path = new Dijkstra($vertices[$fromSector]);

      try
      {
        $hops = $path->getDistance($vertices[$toSector]);
      }
      catch (\OutOfBoundsException $e)
      {
        printf("*** Error - No route within 20 warps from sector %d to sector %d\n", $fromSector, $toSector);
        return;
      }

      printf("The shortest path (%d hops, %d turns) from sector %d to sector %d is:\n", $hops, $hops * 3, $fromSector, $toSector); 

      print $fromSector;
      $warppath = $path->getEdgesTo($vertices[$toSector]);
      foreach ($warppath as $warp)
        printf(' > %d', $warp->getVertexEnd()->getId());

      return;
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
