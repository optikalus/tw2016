<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Universes extends Controller
{

    public function __construct()
    {
      $this->middleware('auth');
      $this->user_id = Auth::user()->id;
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
      //$universeData = [];
      //$universes = \Tradewars\Universe::get(['id', 'name', 'sectors', 'turns_per_day', 'terra_cols_max', 'created_at', 'initial_fighters', 'initial_credits', 'initial_holds', 'inactive_days', 'max_players', 'max_ports', 'max_planets', 'max_planets_per_sector', 'max_traders_per_corp', 'photon_duration']);
      $universes = \Tradewars\Universe::get();

      foreach ($universes as $universe)
      {
        $universe_user = $universe->traders()->where('user_id', $this->user_id)->first();
        $universe->traders = $universe->traders()->count();
        $universe->traders_good = $universe->traders()->where('alignment', '>=', 0)->count();
        $universe->ships = $universe->ships()->count();
        $universe->planets = $universe->planets()->count();
        $universe->planets_with_citadels = $universe->planets()->where('citadel', '>', 0)->count();
        $universe->ports = $universe->ports()->count();
        $universe->fighters = $universe->fighters()->count();
        $universe->mines = $universe->mines()->count();
        $universe->user_has_trader = ($universe_user ? true : false);
        $universe->user_login_delay = ($universe_user->deaths_since_extern >= 3 ? 1 : 0);
        $universe->cols_jettisoned = $universe_user->cols_jettisoned_since_extern;
        $universe->turns_remaining = ($universe_user && $universe_user->turns ? $universe_user->turns : 0);
        $universe->stardock = $universe->ports()->with(['sector' => function($query) {
          $query->addSelect(['id', 'number']);
        }])->where('class', 9)->get(['sector_id']);
        $universe->banged = $universe->created_at;
      }
      return ['config' => ['username' => \Tradewars\User::find($this->user_id)->username, 'titles' => \Tradewars\Title::orderBy('experience')->get(['title','experience','alignment']), 'ranks' => \Tradewars\Rank::get(['rank','alignment']), 'manufacturers' => \Tradewars\Manufacturer::get(['id', 'name']), 'initial_ship' => \Tradewars\ShipType::where('is_escapepod', false)->first(['class']), 'replacement_ship' => \Tradewars\ShipType::where('is_escapepod', false)->where('has_escapepod', false)->first(['class']), 'planet_types' => \Tradewars\PlanetType::get(), 'ship_types' => \Tradewars\ShipType::get()], 'universe' => $universes];
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
        $this->validate($request, [
            'id' => 'required|integer|exists:universes'
        ]);

        $request->session()->put('universe', $request->input('id'));

        return response()->json(['status' => 'ok'], 200);
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
