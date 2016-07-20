<?php

namespace Tradewars\Http\Controllers;

use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Score extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
      return $this->byValue();
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

    public function byTitle()
    {

    }

    public function byValue()
    {
      $score = [];
      $i = 1;
      $universe = \Tradewars\Universe::find(1);
/*      $traders = $universe->traders()->orderBy('experience', 'desc')->get();
      foreach ($traders as $trader)
      {
        array_push($score, [ 'rank' => $i, 'experience' => $trader->experience, 'alignment' => $trader->alignment, 'corp' => null, 'name' => $trader->name, 'ship_type' => $trader->ship->first()->type->class ]);
        $i++;
      } */

      $traders = $universe->traders()->orderBy('experience', 'desc')->get(['id', 'ship_id', 'name', 'experience', 'alignment']);
      foreach ($traders as $trader)
      {
          $trader->rank = $i;
          $trader->ship = $trader->ship()->with('type')->where('id', $trader->ship_id)->first()->type->class;
          $i++;
      }

      return $traders;
    }
}
