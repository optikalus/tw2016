<?php

namespace Tradewars\Http\Controllers;

use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Greuler extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function getIndex()
    {

      $clusters = \Tradewars\ClusterNames::all();

      return view('greuler')
        ->with('clusters', $clusters);

    }

    public function getClusterPoints($cluster='')
    {
      $clusters = \Tradewars\ClusterNames::all();
      $universe = \Tradewars\Universe::find(1);
      $sectors = $universe->sectors()->where('cluster', $cluster)->get();

      $nodes = [];
      $links = [];

      foreach ($sectors as $sector)
        foreach (\Tradewars\Sector::find($sector->number)->warps as $warps)
        {
          if (!in_array('{id: ' . $sector->number . '}', $nodes)) 
            array_push($nodes, '{id: ' . $sector->number . '}');
          array_push($links, '{source: ' . $sector->number . ', target: ' . $warps->pivot->sector_id_warp . '}');
          //array_push($sectorArray, ['sector' => $sector->number, 'warp' => $warps->pivot->sector_id_warp]);
        }

      return view('greuler')
        ->with('clusters', $clusters)
        ->with('selectedCluster', $cluster)
        ->with('nodes', implode(',', $nodes))
        ->with('links', implode(',', $links));
      //return response()->json($sectorArray);
    }

}
