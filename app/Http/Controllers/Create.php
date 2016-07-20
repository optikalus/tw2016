<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Input;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Create extends Controller
{

    public function __construct(Request $request)
    {
        $this->middleware('auth');
        $this->user_id = Auth::user()->id;
        $this->universe_id = $request->session()->get('universe');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
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
        $name = $request->input('name');
        $ship_manufacturer = $request->input('initial_ship_manufacturer');
        $ship_name = $request->input('initial_ship_name');
        $planet_class = $request->input('initial_planet_class');
        $planet_name = $request->input('initial_planet_name');

        $this->validate($request, [
          'name' => 'required',
          'initial_ship_manufacturer' => 'required|exists:manufacturers,id',
          'initial_ship_name' => 'required',
          'initial_planet_class' => 'required|exists:planet_types,id',
          'initial_planet_name' => 'required'
        ]);

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
          return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!\Tradewars\User::where('username', $name)->where('id', '<>', $this->user_id)->first() && !$universe->traders()->where('name', $name)->first())
        {
          $user = \Tradewars\User::find($this->user_id);
          $initial_ship = \Tradewars\ShipType::where('is_escapepod', false)->firstOrFail();
          $initial_sector = $universe->sectors()->has('planets', '<', 1)->has('traders', '<', 1)->has('ships', '<', 1)->has('fighters', '<', 1)->has('mines', '<', 1)->where('cluster', '!=', 'The Federation')->get()->random(1);

          $trader = $universe->traders()->save(new \Tradewars\Trader(['name' => $name, 'credits' => $universe->initial_credits, 'turns' => $universe->turns_per_day]));
          $planet = $universe->planets()->save(new \Tradewars\Planet(['name' => $planet_name]));
          $ship = $universe->ships()->save(new \Tradewars\Ship(['name' => $ship_name, 'manufacturer_id' => $ship_manufacturer, 'fighters' => $universe->initial_fighters, 'holds' => $universe->initial_holds]));

          $trader->sector_id = $initial_sector->id;
          $planet->sector_id = $initial_sector->id;
          $ship->sector_id = $initial_sector->id;

          $planet->trader_id = $trader->id;
          $ship->trader_id = $trader->id;

          $ship->ship_id = $initial_ship->id;
          $trader->ship_id = $ship->id;

          $trader->planet_id = $planet->id;
          $ship->planet_id = $planet->id;

          $planet->class_id = $planet_class;

          $user->trader()->save($trader);
          $user->ship()->save($ship);
          $user->planet()->save($planet);

          return response()->json(['status' => 'ok'], 200);
        }
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

    /**
     * Check availability of requested alias
     *
     * @param str $name
     * @return \Illuminate\Http\Response
     */
    public function checkName(Request $request)
    {
        $name = $request->input('name');
        $available = false;

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
          return response()->json(['error' => 'Invalid Universe ID'], 422);

        // name cannot be an existing username
        if (!\Tradewars\User::where('username', $name)->where('id', '<>', $this->user_id)->first())
          $available = true;

        // name also cannot be an existing trader name
        if ($available && $universe->traders()->where('name', $name)->first())
          $available = false;

        return response()->json(['status' => ($available ? 'available' : 'unavailable')], 200);
    }
}
