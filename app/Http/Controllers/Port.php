<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;
use Tradewars\Classes\Helpers;

class Port extends Controller
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

        $sector_id = $request->input('sector_id');
        $ship_id = $request->input('ship_id');
        $port_id = $request->input('port_id');
        $task = $request->input('task');

        $this->validate($request, [
            'ship_id' => 'required|integer|exists:ships,id',
            'task' => 'required'
        ]);

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!$trader = $universe->traders()->where('user_id', $this->user_id)->first())
            return response()->json(['error' => 'Trader Not Found'], 404);

        if (!$ship = $trader->ship()->where('id', $ship_id)->first())
            return response()->json(['error' => 'Ship Not Found'], 404);

        if (!$sector = $universe->sectors()->where('id', $sector_id)->first())
            return response()->json(['error' => 'Sector Not Found'], 404);

        if ($task != 'report' && !$port = $sector->port()->where('id', $port_id)->first())
            return response()->json(['error' => 'Port Not Found'], 404);

        if ($task == 'trade')
        {

            $item = $request->input('item');
            $quantity = $request->input('quantity');
            $offer = $request->input('offer');
            $exp = $request->input('exp');

            $this->validate($request, [
                'item' => 'required|in:fuel,organics,equipment',
                'quantity' => 'required|integer|min:0',
                'offer' => 'required|integer|min:0',
                'exp' => 'required|integer|in:0,1,2,5'
            ]);

            $thisItem = substr(Helpers::resolvePortClass($port->class), ($item == 'fuel' ? 0 : ($item == 'organics' ? 1 : 2)), 1);

            // validate holds
            switch ($item)
            {
                case 'fuel':
                    if ($thisItem == 'S' && $quantity > $port->fuel)
                        return response()->json(['error' => 'I\'m afraid we don\'t have enough inventory to fill that order...'], 422);
                    elseif ($thisItem == 'B' && $quantity > ($port->fuel_prod * 10 - $port->fuel))
                        return response()->json(['error' => 'That would put us over our stocking limits.'], 422);
                    elseif ($thisItem == 'B' && $quantity > $ship->fuel)
                        return response()->json(['error' => 'You don\'t have enough cargo to fill the order!'], 422);
                    break;
                case 'organics':
                    if ($thisItem == 'S' && $quantity > $port->organics)
                        return response()->json(['error' => 'I\'m afraid we don\'t have enough inventory to fill that order...'], 422);
                    elseif ($thisItem == 'B' && $quantity > ($port->organics_prod * 10 - $port->organics))
                        return response()->json(['error' => 'That would put us over our stocking limits.'], 422);
                    elseif ($thisItem == 'B' && $quantity > $ship->organics)
                        return response()->json(['error' => 'You don\'t have enough cargo to fill the order!'], 422);
                    break;
                case 'equipment':
                    if ($thisItem == 'S' && $quantity > $port->equipment)
                        return response()->json(['error' => 'I\'m afraid we don\'t have enough inventory to fill that order...'], 422);
                    elseif ($thisItem == 'B' && $quantity > ($port->equipment_prod * 10 - $port->equipment))
                        return response()->json(['error' => 'That would put us over our stocking limits.'], 422);
                    elseif ($thisItem == 'B' && $quantity > $ship->equipment)
                        return response()->json(['error' => 'You don\'t have enough cargo to fill the order!'], 422);
                    break;
            }

            if ($thisItem == 'S' && $quantity > Helpers::getShipEmptyHolds($ship))
                return response()->json(['error' => 'You don\'t have enough cargo space!'], 422);

            // TODO validate offer value + exp

            switch ($item)
            {
                case 'fuel':
                    $port->fuel = ($thisItem == 'S' ? $port->fuel - $quantity : $port->fuel + $quantity);
                    $ship->fuel = ($thisItem == 'S' ? $ship->fuel + $quantity : $ship->fuel - $quantity);
                    break;
                case 'organics':
                    $port->organics = ($thisItem == 'S' ? $port->organics - $quantity : $port->organics + $quantity);
                    $ship->organics = ($thisItem == 'S' ? $ship->organics + $quantity : $ship->organics - $quantity);
                    break;
                case 'equipment':
                    $port->equipment = ($thisItem == 'S' ? $port->equipment - $quantity : $port->equipment + $quantity);
                    $ship->equipment = ($thisItem == 'S' ? $ship->equipment + $quantity : $ship->equipment - $quantity);
                    break;
            }

            // TODO adjust port credits ?

            $trader->credits = ($thisItem == 'S' ? $trader->credits - $offer : $trader->credits + $offer);
            $trader->experience += $exp;

            $port->last_ship = $ship->name;
            $port->last_time = \Carbon\Carbon::now()->toDateTimeString();

            $trader->save();
            $ship->save();
            $port->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'destroy')
        {

            $base = $request->input('base');
            $fighters = $request->input('fighters');
            $figsLost = $request->input('figsLost');

            $this->validate($request, [
                'base' => 'required|numeric',
                'fighters' => 'required|integer',
                'figsLost' => 'required|integer'
            ]);

            if ($fighters > $ship->fighters)
                return response()->json(['error' => 'Insufficient number of fighters available.'], 422);

            $prodSub = floor(($fighters * $base * $ship->type->offensive_odds) / 10);
            $portDefenses = Helpers::portCalcDefense($port->class, $port->fuel, $port->fuel_prod, $port->organics, $port->organics_prod, $port->equipment, $port->equipment_prod);

            $port->fuel_prod -= $prodSub;
            $port->organics_prod -= $prodSub;
            $port->equipment_prod -= $prodSub;

            if ($port->fuel_prod < 0)
                $port->fuel_prod = 0;
            if ($port->organics_prod < 0)
                $port->organics_prod = 0;
            if ($port->equipment_prod < 0)
                $port->equipment_prod = 0;

            if ($port->fuel_prod * 10 < $port->fuel)
                $port->fuel = $port->fuel_prod * 10;
            if ($port->organics_prod * 10 < $port->organics)
                $port->organics = $port->organics_prod * 10;
            if ($port->equipment_prod * 10 < $port->equipment)
                $port->equipment = $port->equipment_prod * 10;

            if (Helpers::portCalcDefense($port->class, $port->fuel, $port->fuel_prod, $port->organics, $port->organics_prod, $port->equipment, $port->equipment_prod) <= 0)
            {
                $sector->navHaz += 25;
                $port->destroyed = true;
                $port->destroyed_at = \Carbon\Carbon::now()->toDateString();
                $trader->alignment -= 55;
                $trader->experience += 50;
                $ship->fighters -= $figsLost;
                $sector->save();
                $port->save();
                $trader->save();
                $ship->save();

                $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '</span><span class="ansi-bright-red-fg ansi-bright-black-bg"> DESTROYED </span>the Star Port in sector <span class="ansi-bright-yellow-fg">' . $sector->number . '</span>!']));

                return response()->json(['status' => 'ok'], 200);
            }
            else
                return response()->json(['error' => 'Miscalculation -- port has not been destroyed'], 422);

        }
        else if ($task == 'attack')
        {

            $base = $request->input('base');
            $fighters = $request->input('fighters');

            $this->validate($request, [
                'base' => 'required|numeric',
                'fighters' => 'required|integer'
            ]);

            if ($fighters > $ship->fighters)
                return response()->json(['error' => 'Insufficient number of fighters available.'], 422);

            $prodSub = floor(($fighters * $base * $ship->type->offensive_odds) / 10);
            $portDefenses = Helpers::portCalcDefense($port->class, $port->fuel, $port->fuel_prod, $port->organics, $port->organics_prod, $port->equipment, $port->equipment_prod);

            $port->fuel_prod -= $prodSub;
            $port->organics_prod -= $prodSub;
            $port->equipment_prod -= $prodSub;

            if ($port->fuel_prod < 0)
                $port->fuel_prod = 0;
            if ($port->organics_prod < 0)
                $port->organics_prod = 0;
            if ($port->equipment_prod < 0)
                $port->equipment_prod = 0;

            if ($port->fuel_prod * 10 < $port->fuel)
                $port->fuel = $port->fuel_prod * 10;
            if ($port->organics_prod * 10 < $port->organics)
                $port->organics = $port->organics_prod * 10;
            if ($port->equipment_prod * 10 < $port->equipment)
                $port->equipment = $port->equipment_prod * 10;

            $trader->alignment -= 5;
            $ship->fighters -= $fighters;

            $portResponse = Helpers::portCalcDefense($port->class, $port->fuel, $port->fuel_prod, $port->organics, $port->organics_prod, $port->equipment, $port->equipment_prod) * 5 * $base;

            $damage = floor($portResponse / $ship->type->defensive_odds);

            if ($ship->shields >= $damage)
                $ship->shields -= $damage;
            else
            {
                if ($ship->shields > 0)
                {
                    $ship->fighters += $ship->shields;
                    $ship->shields = 0;
                }
                $ship->fighters -= $damage;
            }

            $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '</span> was attacked by Star Port <span class="ansi-magenta-fg">' . $port->name . '</span>!']));

            if ($ship->fighters < 0)
            {

                $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '\'s</span> ' . $ship->type->class . ' was <span class="ansi-bright-red-fg ansi-bright-black-bg">destroyed</span> by Star Port <span class="ansi-magenta-fg">' . $port->name . '</span>!']));

                $trader->experience -= 25;

                $escapepod = $ship->type->has_escapepod;
                $manufacturer_id = $ship->manufacturer_id;

                $sector->navhaz += 1;
                $ship->delete();

                if ($escapepod && $trader->deaths_since_extern < 3)
                {
                    $pod = \Tradewars\ShipType::where('is_escapepod', true)->firstOrFail();

                    $ship = $universe->ships()->save(new \Tradewars\Ship(['name' => 'Galileo', 'fighters' => 1, 'shields' => 30, 'holds' => 1, 'scanner' => 1]));
                    $ship->manufacturer_id = $manufacturer_id;

                    // find new sector
                    $warp_to = $trader->sector_id;
                    foreach ($sector->warps as $warp)
                    {
                        // do not flee to an adjacent sector with fighters that are not yours
                        if ($warp->fighters->quantity > 0 && $warp->fighters->trader_id != $trader->id)
                            continue;
                        $warp_to = $warp->id;
                    }

                    $ship->ship_id = $pod->id;
                    $ship->trader_id = $trader->id;
                    $trader->ship_id = $ship->id;
                    $ship->sector_id = $trader->sector_id = $warp_to;
                    \Tradewars\User::find($this->user_id)->ship()->save($ship);

                    $trader->deaths_since_extern++;
                    $experience = floor($trader->experience * .1);
                    $trader->experience *= .9;

                }
                else
                {
                    $trader->deaths_since_extern = 3;
                    $experience = floor($trader->experience / 2);
                    $trader->experience /= 2;
                    $trader->alignment /= 2;
                    $trader->credits = $universe->initial_credits;
                }

                $trader->deaths++;

            }

            $sector->save();
            $port->save();
            $trader->save();
            $ship->save();
            return response()->json(['status' => 'ok', 'damage' => $damage, 'experience' => $experience], 200);

        }
        elseif ($task == 'report')
        {

            $sectorNumber = $request->input('sector');

            $this->validate($request, [
                'sector' => 'required|integer'
            ]);

            if ($sectorNumber > $universe->sectors)
                return response()->json(['error' => 'Sector out of bounds'], 422);

            if (!$sector = $universe->sectors()->where('number', $sectorNumber)->first())
                return response()->json(['error' => 'Sector Not Found'], 422);

            if (!$port = $sector->port()->first())
                return response()->json(['error' => 'I have no information about a port in that sector.'], 404);

            return $port;

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
}
