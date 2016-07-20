<?php

namespace Tradewars\Http\Controllers;

use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class SectorMap extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
      return $this->show(1);
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
      $universe = \Tradewars\Universe::find(1);
      $sector = $universe->sectors()->where('number', $id)->firstOrFail();
      $warps = $sector->warps;
      $port = $sector->port;
      $planets = $sector->planets;
      $fighters = $sector->fighters;
      $mines = $sector->mines;
      return view('sectormap')
        ->with('sector', $sector)
        ->with('warps', $warps)
        ->with('port', $port)
        ->with('planets', $planets)
        ->with('fighters', $fighters)
        ->with('mines', $mines);
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
