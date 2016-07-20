<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Cache;
use Input;
use Log;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

use Fhaculty\Graph\Graph;
use Graphp\Algorithms\ShortestPath\Dijkstra;

class Ship extends Controller
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

        $task = $request->input('task');

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
          return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!$trader = $universe->traders()->where('user_id', $this->user_id)->first())
            return response()->json(['error' => 'Trader Not Found'], 404);

        if ($task == 'replacementship')
        {

            $ship_manufacturer = $request->input('replacement_ship_manufacturer');
            $ship_name = $request->input('replacement_ship_name');

            $this->validate($request, [
              'replacement_ship_manufacturer' => 'required|exists:manufacturers,id',
              'replacement_ship_name' => 'required',
            ]);

            $user = \Tradewars\User::find($this->user_id);
            $sector = $universe->sectors()->where('number', 1)->firstOrFail();
            $replacement_ship = \Tradewars\ShipType::where('is_escapepod', false)->where('has_escapepod', false)->firstOrFail();
            $ship = $universe->ships()->save(new \Tradewars\Ship(['name' => $ship_name, 'manufacturer_id' => $ship_manufacturer, 'fighters' => $universe->initial_fighters, 'holds' => $universe->initial_holds]));

            $trader->sector_id = $sector->id;
            $ship->sector_id = $sector->id;

            $ship->trader_id = $trader->id;

            $ship->ship_id = $replacement_ship->id;
            $trader->ship_id = $ship->id;

            $ship->planet_id = null;
            $trader->planet_id = null;

            $trader->save();
            $user->ship()->save($ship);

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'sellship')
        {

            $sector_id = $request->input('sector_id');

            $trade_id = $request->input('trade_id');
            $trade_value_check = $request->input('trade_value');

            $this->validate($request, [
              'sector_id' => 'required|integer|exists:sectors,id',
              'trade_id' => 'integer|exists:ships,id',
              'trade_value' => 'integer',
            ]);

            if (!$sector = $universe->sectors()->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Sector mismatch'], 422);

            if (!$trade = $trader->ship()->with('type')->where('id', $trade_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if ($trader->sector_id !== $trade->sector_id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            Log::info('selling [' . $trade->id . '] ' . $trade->name . ' ' . $trade->type->class);

            // calculate value
            $trade_value = Ship::totalTradeInPrice($universe, $trade);

            if ($trade_value != $trade_value_check)
                return response()->json(['error' => 'Trade-in Value Mismatch [' . $trade_value . ' vs ' . $trade_value_check . ']'], 422);

            $trader->credits += $trade_value;

            $trade->delete();
            $trader->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'buynewship')
        {

            $sector_id = $request->input('sector_id');

            $trade_id = $request->input('trade_id');
            $trade_value_check = $request->input('trade_value');

            $ship_id = $request->input('ship_id');
            $ship_name = $request->input('ship_name');
            $ship_password = $request->input('ship_password');

            $this->validate($request, [
              'sector_id' => 'required|integer|exists:sectors,id',
              'trade_id' => 'integer|exists:ships,id',
              'trade_value' => 'integer',
              'ship_id' => 'required|integer|exists:ship_types,id',
              'ship_name' => 'required',
            ]);

            if (!$sector = $universe->sectors()->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Sector mismatch'], 422);

            // handle trade in
            if ($trade_id && $trade = $trader->ship()->with('type')->where('id', $trade_id)->first())
            {

                if ($trader->sector_id !== $trade->sector_id)
                    return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

                // calculate value
                $trade_value = Ship::totalTradeInPrice($universe, $trade);

                if ($trade_value != $trade_value_check)
                    return response()->json(['error' => 'Trade-in Value Mismatch [' . $trade_value . ' vs ' . $trade_value_check . ']'], 422);

                $trader->credits += $trade_value;

            }
            else if ($trade_id !== null && $trade_id > 0)
                return response()->json(['error' => 'Ship Not Found'], 404);

            // create new ship
            $manufacturer = \Tradewars\Manufacturer::get([id])->random(1);
            $ship_type = \Tradewars\ShipType::where('id', $ship_id)->firstOrFail();

            if ($ship_type->cost_hold + $ship_type->cost_drive + $ship_type->cost_computer + $ship_type->cost_hull > $trader->credits)
                return response()->json(['error' => 'You can not afford it!'], 422);
            $trader->credits -= $ship_type->cost_hold + $ship_type->cost_drive + $ship_type->cost_computer + $ship_type->cost_hull;

            $ship = $universe->ships()->save(new \Tradewars\Ship(['name' => $ship_name, 'password' => $ship_password, 'manufacturer_id' => $manufacturer->id, 'holds' => $ship_type->init_holds]));

            $ship->sector_id = $sector->id;
            $ship->trader_id = $trader->id;
            $ship->ship_id = $ship_type->id;

            if ($trade)
            {
                Log::info('deleting "' . $trade->id);
                $trade->delete();
                $trader->ship_id = $ship->id;
            }

            $ship->number = Ship::findLowestNumber($universe);

            $trader->save();
            \Tradewars\User::find($this->user_id)->ship()->save($ship);

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'changeregistration')
        {

            $ship_id = $request->input('ship_id');
            $ship_name = $request->input('ship_name');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'ship_name' => 'required'
            ]);

            if (!$ship = $trader->ship()->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if ($trader->credits < 5000)
                return response()->json(['error' => '"You don\'t have the credits!"'], 422);

            $trader->credits -= 5000;
            $trader->save();

            $ship->name = $ship_name;
            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'changepassword')
        {

            $ship_id = $request->input('ship_id');
            $ship_password = $request->input('ship_password');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id'
            ]);

            if (!$ship = $trader->ship()->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            $ship->password = $ship_password;
            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'jettison')
        {

            $ship_id = $request->input('ship_id');
            $sector_id = $request->input('sector_id');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'sector_id' => 'required|integer|exists:sectors,id'
            ]);

            if (!$ship = $trader->ship()->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if (!$sector = $universe->sectors()->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            if ($sector->cluster == 'The Federation')
                return response()->json(['error' => 'The Federation does not allow cargo dumping in FedSpace (No Littering!).'], 422);

            if ($ship->colonists > 0 && $trader->cols_jettisoned_since_extern == 0)
            {
                $trader->alignment -= $ship->colonists;
                $trader->cols_jettisoned_since_extern = true;
                $trader->save();
            }

            $ship->colonists = 0;
            $ship->fuel = 0;
            $ship->organics = 0;
            $ship->equipment = 0;

            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        elseif ($task == 'buyholds')
        {

            $quantity = $request->input('quantity');

            $ship_id = $request->input('ship_id');
            $sector_id = $request->input('sector_id');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'sector_id' => 'required|integer|exists:sectors,id',
                'quantity' => 'required|integer'
            ]);


            if (!$ship = $trader->ship()->with('type')->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);
            
            if (!$sector = $universe->sectors()->with('warps')->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);
            
            if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            $min = 150;
            $max = 250;

            $day_diff = $universe->created_at->diffInDays(\Carbon\Carbon::now()) - 1;
            $cycle = $day_diff % 18;

            $cph = 0;
            if ($cycle <= 9)
                $cph = floor($max - ((( $max - $min ) / 9 ) * $cycle ));
            else
                $cph = floor($min + ((( $max - $min ) / 9 ) * $cycle ));

            $holds = $ship->holds + $quantity;

            $cost = floor(( $cph * $holds ) + (( 20 * $holds ) * ( $holds - 1 ) / 2)) - floor(( $cph * $ship->holds) + (( 20 * $ship->holds ) * ($ship->holds - 1) / 2));

            //return response()->json(['error' => 'day_diff: ' . $day_diff . ', cycle: ' . $cycle . ', cph: ' . $cph . ', cost: ' . $cost], 422);

            if ($cost > $trader->credits)
                return response()->json(['error' => 'You don\'t have enough money.'], 422);

            if ($holds > $ship->type->max_holds)
                return response()->json(['error' => 'You are limited to <span class="ansi-bright-yellow-fg">' . $ship->type->max_holds . '</span> holds.'], 422);

            $trader->credits -= $cost;
            $ship->holds += $quantity;

            $trader->save();
            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        elseif ($task == 'buyfighters')
        {

            $quantity = $request->input('quantity');

            $ship_id = $request->input('ship_id');
            $sector_id = $request->input('sector_id');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'sector_id' => 'required|integer|exists:sectors,id',
                'quantity' => 'required|integer'
            ]);


            if (!$ship = $trader->ship()->with('type')->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if (!$sector = $universe->sectors()->with('warps')->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            $cost = 166 * $quantity;

            if ($cost > $trader->credits)
               return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money. The most you can buy is ' . floor($trader->credits / 166) . '.</span>'], 422);

            if ($ship->fighters + $quantity > $ship->type->max_fighters)
                return response()->json(['error' => '<span class="ansi-bright-red-fg ansi-bright-black-bg">Your squadron is limited to ' . $ship->type->max_fighters . ' fighters.</span>'], 422);

            $trader->credits -= $cost;
            $ship->fighters += $quantity;

            $trader->save();
            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        elseif ($task == 'buyshields')
        {

            $quantity = $request->input('quantity');

            $ship_id = $request->input('ship_id');
            $sector_id = $request->input('sector_id');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'sector_id' => 'required|integer|exists:sectors,id',
                'quantity' => 'required|integer'
            ]);


            if (!$ship = $trader->ship()->with('type')->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if (!$sector = $universe->sectors()->with('warps')->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            $cost = 183 * $quantity;

            if ($cost > $trader->credits)
               return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money. The most you can buy is ' . floor($trader->credits / 183) . '.</span>'], 422);

            if ($ship->shields + $quantity > $ship->type->max_shields)
                return response()->json(['error' => '<span class="ansi-bright-red-fg ansi-bright-black-bg">Your ship is structurally limited to ' . $ship->type->max_shields . ' shield points.</span>'], 422);

            $trader->credits -= $cost;
            $ship->shields += $quantity;

            $trader->save();
            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        elseif ($task == 'buyhardware')
        {

            $item = $request->input('item');
            $quantity = $request->input('quantity');

            $ship_id = $request->input('ship_id');
            $sector_id = $request->input('sector_id');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'sector_id' => 'required|integer|exists:sectors,id',
                'quantity' => 'required|integer',
                'item' => 'required|in:detonators,beacons,corbomite,cloaks,probes,planetscan,class_1_mines,class_2_mines,photons,scanner,disruptors,genesis,transwarp,psychic'
            ]);

            if (!$ship = $trader->ship()->with('type')->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if (!$sector = $universe->sectors()->with('warps')->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            switch ($item)
            {
                case 'detonators':
                    if ($ship->detonators + $quantity > $ship->type->max_detonators)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_detonators . '</span> Atomic Detonators.'], 422);
                    if ($quantity * 15000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->detonators += $quantity;
                    $trader->credits -= 15000 * $quantity;
                    break;
                case 'beacons':
                    if ($ship->beacons + $quantity > $ship->type->max_beacons)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_beacons . '</span> Beacons.'], 422);
                    if ($quantity * 100 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->beacons += $quantity;
                    $trader->credits -= 100 * $quantity;
                    break;
                case 'corbomite':
                    if ($ship->corbomite + $quantity > $ship->type->max_corbomite)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_corbomite. '</span> Corbomite Transducers.'], 422);
                    if ($quantity * 1000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->corbomite += $quantity;
                    $trader->credits -= 1000 * $quantity;
                    break;
                case 'cloaks':
                    if ($ship->cloaks + $quantity > $ship->type->max_cloak)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_cloak. '</span> Cloaking units.'], 422);
                    if ($quantity * 25000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->cloaks += $quantity;
                    $trader->credits -= 25000 * $quantity;
                    break;
                case 'probes':
                    if ($ship->probes + $quantity > $ship->type->max_probes)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_probes. '</span> Cloaking units.'], 422);
                    if ($quantity * 3000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->probes += $quantity;
                    $trader->credits -= 3000 * $quantity;
                    break;
                case 'planetscan':
                    if ($ship->planetscan == 1)
                        return response()->json(['error' => 'You don\'t need two!'], 422);
                    if ($ship->type->allow_planetscan == 0)
                        return response()->json(['error' => 'Sorry, your ship is not equipped for a Planet Scanner!'], 422);
                    if (30000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->planetscan = true;
                    $trader->credits -= 30000;
                    break;
                case 'class_2_mines':
                    if ($ship->class_2_mines + $quantity > $ship->type->max_mines)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_mines . '</span> Limpet Mines.'], 422);
                    if ($quantity * 10000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->class_2_mines += $quantity;
                    $trader->credits -= 10000 * $quantity;
                    break;
                case 'photons':
                    if ($ship->photons + $quantity > $ship->type->max_photons)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_photons. '</span> Photon Missiles.'], 422);
                    if ($quantity * 40000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->photons += $quantity;
                    $trader->credits -= 40000 * $quantity;
                    break;
                case 'scanner':
                    if ($quantity == 1 && !$ship->type->allow_densityscan)
                        return response()->json(['error' => 'Sorry, your ship is not equipped for a Long Range Scanner!'], 422);
                    if ($quantity == 2 && !$ship->type->allow_holographicscan)
                        return response()->json(['error' => 'Sorry, your ship can only carry a Density Scanner.'], 422);

                    if (($quantity == 2 && $ship->scanner == 2) || ($quantity == 1 && $ship->scanner >= 1))
                        return response()->json(['error' => 'You don\'t need two!'], 422);

                    switch ($quantity)
                    {
                        case 1:
                            if (2000 > $trader->credits)
                                return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                            $ship->scanner = 1;
                            $trader->credits -= 2000;
                            break;
                        case 2:
                            if (25000 > $trader->credits)
                                return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                            $ship->scanner = 2;
                            $trader->credits -= 25000;
                            break;
                    }
                    break;
                case 'disruptors':
                    if ($ship->disruptors + $quantity > $ship->type->max_disruptors)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_disruptors. '</span> Mine Disruptors.'], 422);
                    if ($quantity * 6000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->disruptors += $quantity;
                    $trader->credits -= 6000 * $quantity;
                    break;
                case 'genesis':
                    if ($ship->genesis + $quantity > $ship->type->max_genesis)
                        return response()->json(['error' => 'Your ship can only carry <span class="ansi-bright-yellow-fg">' . $ship->type->max_genesis. '</span> Genesis Torpedoes.'], 422);
                    if ($quantity * 20000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);
                    $ship->genesis += $quantity;
                    $trader->credits -= 20000 * $quantity;
                    break;
                case 'transwarp':
                    if (!$ship->type->allow_transwarp)
                        return response()->json(['error' => 'Sorry, your ship is not equipped for a TransWarp Drive!'], 422);
                    if ((($quantity == 2 || $quantity == 3) && $ship->transwarp == 2) || ($quantity == 1 && $ship->transwarp >= 1))
                        return response()->json(['error' => 'You don\'t need two!'], 422);

                    if ($quantity == 3 && $ship->transwarp == 0)
                        return response()->json(['error' => 'You need to OWN a Type A TransWarp drive before it can be upgraded...'], 422);

                    switch ($quantity) 
                    {
                        case 1:
                            if (50000 > $trader->credits)
                                return response()->json(['error' => 'Sign, another poor trader. Come back when you have the cash!'], 422);
                            $ship->transwarp = 1;
                            $trader->credits -= 50000;
                            break;
                        case 2:
                            if (80000 > $trader->credits)
                                return response()->json(['error' => 'Sign, another poor trader. Come back when you have the cash!'], 422);
                            $ship->transwarp = 2;
                            $trader->credits -= 80000;
                            break;
                        case 3:
                            if (40000 > $trader->credits)
                                return response()->json(['error' => 'Sign, another poor trader. Come back when you have the cash!'], 422);
                            $ship->transwarp = 2;
                            $trader->credits -= 40000;
                            break;
                    }
                    break;
                case 'psychic':
                    if ($ship->psychic)
                        return response()->json(['error' => 'You don\'t need two!'], 422);

                    if (10000 > $trader->credits)
                        return response()->json(['error' => '<span class="ansi-bright-cyan-fg">You don\'t have enough money.</span>'], 422);

                    $ship->psychic = 1;
                    $trader->credits -= 10000;
                    break;
            }

            $ship->save();
            $trader->save();

            return response()->json(['status' => 'ok'], 200);

        }
        elseif ($task == 'attack')
        {

            $ship_id = $request->input('ship_id');
            $target_id = $request->input('target_id');
            $sector_id = $request->input('sector_id');
            $fighters = $request->input('fighters');
            $offense = $request->input('offense');
            $defense = $request->input('defense');
            $random = $request->input('random');

            $this->validate($request, [
                'ship_id' => 'required|integer|exists:ships,id',
                'target_id' => 'required|integer|exists:ships,id',
                'sector_id' => 'required|integer|exists:sectors,id',
                'fighters' => 'required|integer',
                'offense' => 'required',
                'defense' => 'required',
                'random' => 'required'
            ]);

            if (!$ship = $trader->ship()->with('type')->where('id', $ship_id)->first())
                return response()->json(['error' => 'Ship Not Found'], 404);

            if (!$target = $universe->ships()->with('type')->where('id', $target_id)->first())
                return response()->json(['error' => 'Target Not Found'], 404);

            if ($target->trader_id !== null)
                $target_trader = $universe->traders()->where('id', $target->trader_id)->where('ship_id', $target->id)->first();

            if (!$sector = $universe->sectors()->with('warps')->where('id', $sector_id)->first())
                return response()->json(['error' => 'Sector Not Found'], 404);

            if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
                return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

            if ($fighters > $ship->fighters)
                return response()->json(['error' => 'You don\'t have that many fighters.'], 422);

            if ($random < .5 || $random > 2.75)
                return response()->json(['error' => 'Variable out of bounds.'], 422);

            if (floor(($target->shields + $target->fighters) * $target->type->defensive_odds) != $defense)
                return response()->json(['error' => 'Calculation checksum mismatch (1).'], 422);

            if (floor($fighters * $ship->type->offensive_odds * $random) != $offense)
                return response()->json(['error' => 'Calculation checksum mismatch (offense ' . $offense . ' vs ' . floor($fighters * $ship->type->offensive_odds * $random) . ')'], 422);

            if ($sector->cluster == 'The Federation' && (!$target_trader || $target_trader->alignment >= 0))
                return response()->json(['error' => 'The Federation does not allow piracy in Federation space!'], 422);

            // destroyed
            if ($offense > $defense || $offense == $defense)
            {

                if ($offense > $defense)
                {
                    $figsLost = floor($defense / $random);
                    $ship->fighters -= $figsLost;
                    $oath = null;
                }
                elseif ($offense == $defense)
                {
                    $ship->fighters -= $fighters;
                    $target->fighters = 0;
                    $target->shields = 0;
                    $target->user_id = $trader->user_id;
                    $target->trader_id = $trader->id;
                    $target->password = null;
                    $target->save();

                    if ($target_trader)
                    {
                        $target_trader->ship_id = null;
                        $target_trader->save();
                    }
                }

                if ($target_trader)
                {

                    $target_trader->deaths++;
                    $trader->credits += $target_trader->credits;  
                    $credits = $target_trader->credits;

                    if ($target->type->has_escapepod && $target_trader->deaths_since_extern < 3)
                    {
                        $manufacturer_id = $target->manufacturer_id;
                        $podBase = \Tradewars\ShipType::where('is_escapepod', true)->firstOrFail();
                        $pod = $universe->ships()->save(new \Tradewars\Ship(['name' => 'Galileo', 'fighters' => 1, 'shields' => 30, 'holds' => 1, 'scanner' => 1]));
                        $pod->manufacturer_id = $manufacturer_id;

                        // find new sector
                        $warp_to = $target_trader->sector_id;
                        foreach ($sector->warps as $warp)
                        {
                            // do not flee to an adjacent sector with fighters that are not yours
                            if ($warp->fighters->quantity > 0 && $warp->fighters->trader_id != $target_trader->id)
                                continue;
                            $warp_to = $warp->id;
                        }

                        $pod->ship_id = $podBase->id;
                        $pod->trader_id = $target_trader->id;
                        $target_trader->ship_id = $pod->id;
                        $pod->sector_id = $target_trader->sector_id = $warp_to;
                        \Tradewars\User::find($target_trader->user_id)->ship()->save($pod);

                        $target_trader->deaths_since_extern++;
                        $experience = floor($target_trader->experience * .1);
                        $target_trader->experience *= .9;

                        if (rand(0,1) === 1)
                            $oath = '<br /><span class="ansi-yellow-fg">' . Ship::getOath($trader->name, $target_trader->name) . '.</span>';

                    }
                    else
                    {

                        $target_trader->deaths_since_extern = 3;
                        $target_trader->ship_id = null;
                        $experience = floor($target_trader->experience / 2);
                        $alignment = floor($target_trader->alignment / 2);
                        $target_trader->experience /= 2;
                        $target_trader->alignment /= 2;
                        $target_trader->credits = $universe->initial_credits;

                    }

                    $target_trader->save();

                }

                $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '<span class="ansi-bright-red-fg ansi-bright-black-bg"> DESTROYED </span>' . $target_trader->name . '\'s</span> ' . $target->type->class . '!' . ($oath ? $oath : '')]));

                // TODO send mail to target letting them know about this heinous crime

                if ($offense > $defense)
                {

                    $target->delete();

                    if ($sector->cluster != 'The Federation')
                    {
                        $sector->navhaz = ($sector->navhaz + 1 > 100 ? 100 : $sector->navhaz + 1);
                        $sector->save();
                    }
                }

            }
            // plinked
            else
            {

                $ship->fighters -= $fighters;
                if ($target->shields > $offense)
                    $target->shields -= $offense;
                else
                {
                    $offense -= $target->shields;
                    $target->shields = 0;
                    $target->fighters -= $offense;
                }
                $target->save();

            }

            $ship->save();

            return response()->json(['status' => 'ok', 'experience' => $experience, 'alignment' => $alignment, 'credits' => $credits, 'oath' => $oath], 200);

       }

        return response()->json(['error' => 'Task not found'], 422);

    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!$trader = $universe->traders()->where('user_id', $this->user_id)->first())
            return response()->json(['error' => 'Trader Not Found'], 404);

        if ($id == 'active')
        {

            $ships = $universe->ships()->with(['type' => function($query) {
                $query->addSelect(['id', 'class']);
            }])->with(['sector' => function($query) {
                $query->addSelect(['id', 'number']);
            }])->where('trader_id', $trader->id)->orderBy('number', 'asc')->get(['id', 'ship_id', 'sector_id', 'number', 'name', 'fighters', 'shields']);

            $thisSector = $universe->sectors()->where('id', $trader->sector_id)->first(['number'])->number;

            foreach ($ships as $ship)
            {

                $graph = new Graph();
                $vertices = Cache::rememberForever('universe_' . $universe->id . '_vertices_cache', function() use ($graph, $universe) {

                    $sectors = $universe->sectors()->with('warps')->get();
                    $vertices = [];
                    $edges = [];
                    foreach ($sectors as $sector)
                        $vertices[$sector->number] = $graph->createVertex($sector->number);

                    foreach ($sectors as $sector)
                        foreach ($sector->warps as $warp)
                            $edges[$sector->number] = $vertices[$sector->number]->createEdgeTo($vertices[$warp->number])->setWeight(1);

                    return $vertices;
                });

                $path = new Dijkstra($vertices[$thisSector]);

                try
                {
                    $ship->hops = $path->getDistance($vertices[$ship->sector->number]);
                }
                catch (\OutOfBoundsException $e)
                {
                    $ship->hops = null;
                }

            }

            return $ships;

        }
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

    public function holdBaseCost($universe)
    {
        $min = 150;
        $max = 250;

        $day_diff = $universe->created_at->diffInDays(\Carbon\Carbon::now());
        $cycle = $day_diff % 18;

        Log::info('day_diff: ' . $day_diff . ', cycle: ' . $cycle);

        $cph = 0;
        if ($cycle <= 9)
            return floor($max - ((( $max - $min ) / 9 ) * $cycle ));
        else
            return floor($min + ((( $max - $min ) / 9 ) * $cycle ));
    }

    public function calcHoldCosts($base, $holds)
    {
        return ($base * $holds) + ((20 * $holds) * ($holds - 1) / 2);
    }

    public function totalTradeInPrice($universe, $trade)
    {
        $trade_value = 0;
        $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->type->cost_hull);
        $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->type->cost_drive);
        $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->type->cost_computer);
        $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, Ship::calcHoldCosts(Ship::holdBaseCost($universe), $trade->holds));

        Log::info(Ship::tradeInPrice($trade->ports, $trade->kills, Ship::calcHoldCosts(Ship::holdBaseCost($universe), $trade->holds)));

        if ($trade->fighters > 0)
        {
            $multiplier = ($trade->kills * 5) + $trade->ports;
            if ($multiplier <= 30)
                $multiplier = 30;
            $magic = ((-.16 * $multiplier) + 148.8);
            $trade_value += ($magic <= 16 ? $trade->fighters * 16 : $trade->fighters * $magic - 1);
        }

        if ($trade->shields > 0)
        {
            $multiplier = ($trade->kills * 5) + $trade->ports;
            if ($multiplier <= 30)
                $multiplier = 30;
            $magic = ((-.16 * $multiplier) + 148.8) / 2;
                $trade_value += ($magic <= 8 ? $trade->shields * 8 : $trade->shields * $magic - 1);
        }

        if ($trade->genesis > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->genesis * $universe->genesis_cost);
        if ($trade->class_1_mines > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->class_1_mines * $universe->armid_cost);
        if ($trade->class_2_mines > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->class_2_mines * $universe->limpet_cost);
        if ($trade->beacons > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->beacons * $universe->beacon_cost);
        if ($trade->transwarp > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, ($trade->transwarp == 1 ? $universe->transwarp_1_cost : $universe->transwarp_2_cost));
        if ($trade->psychic > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $universe->psychic_cost);
        if ($trade->planetscan > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $universe->planetscan_cost);
        if ($trade->detonators > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->detonators * $universe->detonator_cost);
        if ($trade->corbomite > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->corbomite * $universe->corbomite_cost);
        if ($trade->probes > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->probes * $universe->probe_cost);
        if ($trade->photons > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->photons * $universe->photon_cost);
        if ($trade->cloaks > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->cloaks * $universe->cloak_cost);
        if ($trade->disruptors > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, $trade->disruptors * $universe->disruptor_cost);
        if ($trade->scanner > 0)
            $trade_value += Ship::tradeInPrice($trade->ports, $trade->kills, ($trade->scanner == 1 ? $universe->densityscan_cost : $universe->holoscan_cost));
        return $trade_value;
    }

    public function tradeInPrice($ports, $kills, $initial)
    {
        $multiplier = ($kills * 5) + $ports;
        if ($multiplier <= 30)
            $multiplier = 30;

        $magic = ((-.001 * $multiplier) + .93);
        if ($magic <= .1)
            return ($initial == 0 ? 0 : $initial * .1);
        else
            return ($initial == 0 ? 0 : ($initial * $magic) - 1);
    }

    public function findLowestNumber($universe)
    {
        $min = 1;
        foreach ($universe->ships()->orderBy('number', 'asc')->get(['number']) as $ship)
        {
            if ($min < $ship->number)
                return $min;
            else
                $min++;
        }
        return $min;
    }

    public function getOath($attacker, $attackee)
    {

        $oaths = [
            '"You\'re mother was a Denebian Slime Devil, @", screams #',
            '"I think I\'ll have you stuffed and mounted @", exclaims #',
            '"I WILL kill you someday, @", swears #',
            '"Go suck a rock, @, you make me sick!", swears #',
            '"The Dark Side has finally taken you, @", a ghostly voice says',
            '"I\'m going to mine your home planet @", warns #',
            '"The good people of the Universe will rise against you, @!", screams #',
            '"@, go lay down", sputters #',
            '"Eat hot photons, @, you slug-infested worm!", cries #',
            '"I hope you fall into the black hole @!", shouts #',
            '"I don\'t get mad, @, I get even", states #',
            '"May your ship self destruct @!", says #, as he smiles knowingly',
            '"Don\'t ever forget to look behind you, @", yells #',
            '"Someday, Death will come for you, @", screams #',
            '"I\'m going to have your eyes for lunch someday @!", growls #',
            '"Death is the Bride of the Warrior. Your mother was a trout, @", slings #',
            '"Look behind you, @, I\'ll be there!", pledges #',
            '"You wanna try that again, @?", asks #',
            '"This is gonna bring you some serious bad karma, @", yells #',
            '"Yea, well I can still out drink you, @!", laughs #',
            '"Delusions of grandeur again, @? Don\'t get cocky", admonishes #',
            '"I\'m gonna tell the Ferrengi where you are @!", threatens #',
            '"Can\'t you just be nice, @? Just once?", asks #',
            '"This universe ain\'t big enough for the two of us @", extolls #',
            '"Nice shootin\', @.  You\'re dead.", swears #',
            '"Why don\'t you just go away, @?", cries #',
            '"War-mongering, flat-headed, Ferringi-loving scum!", cries #',
            '"@, your mother was a Cabal reject", spits #',
            '"Stand up, @, and take a load off your mind!", taunts #',
            '"Geez, @, we just can\'t take you anywhere", # states',
            '"May you choke on your own bile, @!", curses #',
            '"May the fleas of 1000 camels infest your armpits, @", cries #',
            '"How did you do that?  Ram me with your nose, @?", asks #',
            '"What a dweeb you are, @", calls #',
            '"Here, blow THIS up, @!", cries #',
            '"@ is in sector 351!", shouts #',
            '"@ is in sector 460!", shouts #',
            '"@ is in sector 85!", shouts #',
            '"@ is in sector 116!", shouts #',
            '"@ is in sector 125!", shouts #',
            '"@ is in sector 145!", shouts #',
            '"@ is in sector 324!", shouts #',
            '"@ is in sector 449!", shouts #',
            '"I\'ve been killed by better Ferrengi than you, @!", swears #',
            '"Killed by a slime-lover named @! How embarrassing!", cries #',
            '"You can\'t run forever @!  I\'ll get you!", cries #',
            '"Get a real name, @!", taunts #',
            '"I hope you have many well-hidden children, @. You\'ll need them!", cries #',
            '"Get a life, @. You\'re gonna need an extra", pledges #',
            '"Hey, @!  Do you still drool?", asks #',
            '"Play nice @!", whines #',
            '"Hey, @. Still being abused by your wife, eh?", laughs #',
            '"Better run while you can, @!  Death calls your name", says #',
            '"@, why don\'t you like me?  Your mother did!", asks #',
            '"Quit being an asshole, @!", berates #',
            '"You are so illiterate, your parents couldn\'t have been married!", laughs #',
            '"@, your ass is MINE!", # screams',
            '"@, why don\'t you just go &*%! off, eh?", cries #',
            '"I now know why your wife likes me better, @", # chuckles',
            '"Your wife didn\'t like being blown up with me, @!", taunts #',
        ];

        $oath = $oaths[mt_rand(0, count($oaths) - 1)];
        return str_replace(['@', '#'], [$attacker, $attackee], $oath);

    }

}
