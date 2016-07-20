<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Log;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Planet extends Controller
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

        $ship_id = $request->input('ship_id');
        $task = $request->input('task');

        $this->validate($request, [
            'ship_id' => 'required|integer|exists:ships,id',
            'task' => 'required'
        ]);

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!$trader = $universe->traders()->where('user_id', $this->user_id)->first())
            return response()->json(['error' => 'Trader Not Found'], 404);

        if (!$ship = $trader->ship()->with('type')->where('id', $ship_id)->first())
            return response()->json(['error' => 'Ship Not Found'], 404);

        if (!$sector = $universe->sectors()->with('warps')->where('id', $trader->sector_id)->first())
            return response()->json(['error' => 'Sector Not Found'], 404);

        $holdsFree = $ship->holds - ($ship->equipment + $ship->organics + $ship->fuel + $ship->colonists);

        // make sure trader is in the same sector as planet_id
        if ($trader->sector_id !== $ship->sector_id)
            return response()->json(['error' => 'Trader/Ship/Planet sector mismatch'], 422);

        if ($task == 'createplanet')
        {

            $planet_type = $request->input('planet_type');
            $planet_name = $request->input('planet_name');

            $this->validate($request, [
                'planet_type' => 'required|integer|exists:planet_types,id',
                'planet_name' => 'required'
            ]);

            if ($sector->number == 1)
                return response()->json(['error' => 'The intense traffic in sector 1 prohibits planetary construction.'], 422);

            if ($ship->genesis == 0)
                return response()->json(['error' => 'You don\'t have any Genesis Torpoedoes to launch!'], 422);

            $planet = $universe->planets()->save(new \Tradewars\Planet(['class_id' => $planet_type, 'name' => $planet_name]));
            $planet->trader_id = $trader->id;
            $planet->sector_id = $trader->sector_id;
            $planet->number = Planet::findLowestNumber($universe);
            $planet->created_by = $trader->name;

            $ship->genesis -= 1;
            $ship->save();

            $trader->experience += 25;
            $trader->alignment += ($trader->alignment >= 0 ? 10 : -10);
            $trader->save();

            $user = \Tradewars\User::find($this->user_id);
            $user->planet()->save($planet);

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'changepopulationterra' && $sector->number == 1)
        {

            $which = $request->input('which');
            $quantity = $request->input('quantity');

            $this->validate($request, [
                'which' => 'required|in:take,leave',
                'quantity' => 'required|integer|min:0'
            ]);

            if ($quantity == 0)
                return response()->json(['notice' => 'noop'], 422);

            switch ($which)
            {
                case 'take':
                    if ($holdsFree < $quantity)
                        return response()->json(['error' => 'You do not have that many free holds!'], 422);
                    if ($quantity > $universe->terra_cols)
                        return response()->json(['error' => 'There are not that many Colonists on Terra!'], 422);
                    $ship->colonists = $ship->colonists + $quantity;
                    $universe->terra_cols = $universe->terra_cols + $quantity;
                    break;
                case 'leave':
                    if ($ship->colonists < $quantity)
                        return response()->json(['error' => 'You do not have that many Colonists on board!'], 422);
                    if ($universe->terra_cols + $quantity > $universe->terra_cols_max)
                        return response()->json(['error' => 'Terra is too overcrowded!'], 422);
                    $ship->colonists -= $quantity;
                    $universe->terra_cols += $quantity;
                    break;
            }

            $ship->save();
            $universe->save();
            return response()->json(['status' => 'ok'], 200);
        }

        $planet_id = $request->input('planet_id');
        $this->validate($request, [
            'planet_id' => 'required|integer|exists:planets,id',
        ]);

        if (!$planet = $universe->planets()->where('id', $planet_id)->first())
            return response()->json(['error' => 'Planet Not Found'], 404);

        // make sure trader is in the same sector as planet_id
        if ($trader->sector_id !== $planet->sector_id)
            return response()->json(['error' => 'Trader/Ship/Planet sector mismatch'], 422);

        if ($task == 'land')
        {

            $trader->planet_id = $planet->id;
            $ship->planet_id = $planet->id;
            $trader->save();
            $ship->save();

            $planet->type;
            $planet->trader;
            return ['planet' => $planet, 'ship' => $ship, 'sector' => $sector];

        }
        else if ($task == 'leave')
        {
            $trader->planet_id = null;
            $ship->planet_id = null;
            $trader->save();
            $ship->save();
            return response()->json(['status' => 'ok'], 200);
        }
        else if ($task == 'leavefighters' || $task == 'takefighters')
        {

            $quantity = $request->input('quantity');

            $this->validate($request, [
                'quantity' => 'required|integer|min:0'
            ]);

            // fetch skeletons
            $ship->type;
            $planet->type;

            if ($task == 'leavefighters')
            {
                if ($ship->fighters < $quantity)
                    return response()->json(['error' => 'You do not have that many fighters!'], 422);
                if ($planet->fighters + $quantity > $planet->type->max_fighters)
                    return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_fighters) . ' fighters on this planet!'], 422);
                $ship->fighters -= $quantity;
                $planet->fighters += $quantity;
            }
            elseif ($task == 'takefighters')
            {
                if ($planet->fighters < $quantity)
                    return response()->json(['error' => 'This planet does not have that many fighters!'], 422);
                if ($ship->fighters + $quantity > $ship->type->max_fighters)
                    return response()->json(['error' => 'You can\t put more than ' . number_format($ship->type->max_fighters) . ' fighters on this ship!'], 422);
                $ship->fighters += $quantity;
                $planet->fighters -= $quantity;
            }
            $ship->save();
            $planet->save();

            return response()->json(['status' => 'ok'], 200);
        }
        else if ($task == 'takeallproduct')
        {

            $take = $request->input('take');

            if ($take['equipment'] > 0)
            {
                if ($take['equipment'] > $planet->equipment)
                    return response()->json(['error' => 'There is not that much equipment on this planet!'], 422);
                if ($take['equipment'] > $holdsFree)
                    return response()->json(['error' => 'You do not have that many free holds!'], 422);
                $ship->equipment += $take['equipment'];
                $planet->equipment -= $take['equipment'];
                $holdsFree -= $take['equipment'];
            }
            if ($take['organics'] > 0)
            {
                if ($take['organics'] > $planet->organics)
                    return response()->json(['error' => 'There is not that much organics on this planet!'], 422);
                if ($take['organics'] > $holdsFree)
                    return response()->json(['error' => 'You do not have that many free holds!'], 422);
                $ship->organics += $take['organics'];
                $planet->organics -= $take['organics'];
                $holdsFree -= $take['organics'];
            }
            if ($take['fuel'] > 0)
            {
                if ($take['fuel'] > $planet->fuel)
                    return response()->json(['error' => 'There is not that much fuel ore on this planet!'], 422);
                if ($take['fuel'] > $holdsFree)
                    return response()->json(['error' => 'You do not have that many free holds!'], 422);
                $ship->fuel += $take['fuel'];
                $planet->fuel -= $take['fuel'];
                $holdsFree -= $take['fuel'];
            }

            $ship->save();
            $planet->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'claimownership')
        {

            $planet->trader_id = $trader->id;
            $planet->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'changepopulation')
        {

            $quantity = $request->input('quantity');

            $this->validate($request, [
                'from' => 'required|in:fuel,organics,equipment',
                'to' => 'required|in:fuel,organics,equipment',
                'quantity' => 'required|integer|min:0'
            ]);

            // handle null action
            if ($request->input('from') == $request->input('to') || $quantity === 0)
                return response()->json(['status' => 'ok'], 200);

            switch ($request->input('from')) {
                case 'fuel':
                    if ($quantity > $planet->fuel_cols || $planet->fuel_cols - $quantity < 0)
                        return response()->json(['error' => 'There are not that many Colonists in that production group!'], 422);
                    break;
                case 'organics':
                    if ($quantity > $planet->organics_cols || $planet->organics_cols - $quantity < 0)
                        return response()->json(['error' => 'There are not that many Colonists in that production group!'], 422);
                    break;
                case 'equipment':
                    if ($quantity > $planet->equipment_cols || $planet->equipment_cols - $quantity < 0)
                        return response()->json(['error' => 'There are not that many Colonists in that production group!'], 422);
                    break;
            }

            switch ($request->input('to')) {
                case 'fuel':
                    if ($planet->fuel_cols + $quantity > $planet->type->max_cols_fuel)
                        return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_cols_fuel) . ' Colonists in that production group!'], 422);
                    break;
                case 'organics':
                    if ($planet->organics_cols + $quantity > $planet->type->max_cols_organics)
                        return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_cols_organics) . ' Colonists in that production group!'], 422);
                    break;
                case 'equipment':
                    if ($planet->equipment_cols + $quantity > $planet->type->max_cols_equipment)
                        return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_cols_equipment) . ' Colonists in that production group!'], 422);
                    break;

            }

            switch ($request->input('from')) {
                case 'fuel':
                    $planet->fuel_cols -= $quantity;
                    break;
                case 'organics':
                    $planet->organics_cols -= $quantity;
                    break;
                case 'equipment':
                    $planet->equipment_cols -= $quantity;
                    break;
            }
            switch ($request->input('to')) {
                case 'fuel':
                    $planet->fuel_cols += $quantity;
                    break;
                case 'organics':
                    $planet->organics_cols += $quantity;
                    break;
                case 'equipment':
                    $planet->equipment_cols += $quantity;
                    break;
            }

            $planet->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'changecolonists')
        {

            $quantity = $request->input('quantity');

            $this->validate($request, [
                'which' => 'required|in:take,leave',
                'group' => 'required|in:fuel,organics,equipment',
                'quantity' => 'required|integer|min:0'
            ]);

            // handle null action
            if ($quantity === 0)
                return response()->json(['status' => 'ok'], 200);

            switch ($request->input('which'))
            {
                case 'take':
                    if ($holdsFree < $quantity)
                        return response()->json(['error' => 'You do not have that many free holds! ' . $holdsFree . ' vs ' . $quantity ], 422);
                    switch ($request->input('group'))
                    {
                        case 'fuel':
                            if ($planet->fuel_cols - $quantity < 0)
                                return response()->json(['error' => 'There are not that many Colonists in that production group!'], 422);
                            $planet->fuel_cols -= $quantity;
                            break;
                        case 'organics':
                            if ($planet->organics_cols - $quantity < 0)
                                return response()->json(['error' => 'There are not that many Colonists in that production group!'], 422);
                            $planet->organics_cols -= $quantity;
                            break;
                        case 'equipment':
                            if ($planet->equipment_cols - $quantity < 0)
                                return response()->json(['error' => 'There are not that many Colonists in that production group!'], 422);
                            $planet->equipment_cols -= $quantity;
                            break;
                    }
                    $ship->colonists += $quantity;
                    break;
                case 'leave':
                    if ($ship->colonists < $quantity)
                        return response()->json(['error' => 'There are not have that many Colonists on your ship!'], 422);
                    switch ($request->input('group'))
                    {
                        case 'fuel':
                            if ($planet->fuel_cols + $quantity > $planet->type->max_cols_fuel)
                                return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_cols_fuel) . ' Colonists in that production group!'], 422);
                            $planet->fuel_cols += $quantity;
                            break;
                        case 'organics':
                            if ($planet->organics_cols + $quantity > $planet->type->max_cols_organics)
                                return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_cols_organics) . ' Colonists in that production group!'], 422);
                            $planet->organics_cols += $quantity;
                            break;
                        case 'equipment':
                            if ($planet->equipment_cols + $quantity > $planet->type->max_cols_equipment)
                                return response()->json(['error' => 'You can\'t put more than ' . number_format($planet->type->max_cols_equipment) . ' Colonists in that production group!'], 422);
                            $planet->equipment_cols += $quantity;
                            break;
                    }
                    $ship->colonists -= $quantity;
                    break;
            }

            $ship->save();
            $planet->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'changeproduct')
        {
            
            $quantity = $request->input('quantity');
            
            $this->validate($request, [
                'which' => 'required|in:take,leave',
                'group' => 'required|in:fuel,organics,equipment',
                'quantity' => 'required|integer|min:0'
            ]);
            
            // handle null action
            if ($quantity === 0)
                return response()->json(['status' => 'ok'], 200);
            
            switch ($request->input('which'))
            {   
                case 'take':
                    if ($holdsFree < $quantity)
                        return response()->json(['error' => 'You do not have that many free holds! ' . $holdsFree . ' vs ' . $quantity ], 422);
                    switch ($request->input('group'))
                    {   
                        case 'fuel':
                            if ($planet->fuel - $quantity < 0) 
                                return response()->json(['error' => 'There aren\'t that many on the planet!'], 422);
                            $planet->fuel -= $quantity;
                            $ship->fuel += $quantity;
                            break;
                        case 'organics':
                            if ($planet->organics - $quantity < 0)
                                return response()->json(['error' => 'There aren\'t that many on the planet!'], 422);
                            $planet->organics -= $quantity;
                            $ship->organics += $quantity;
                            break;
                        case 'equipment':
                            if ($planet->equipment - $quantity < 0)
                                return response()->json(['error' => 'There aren\'t that many on the planet!'], 422);
                            $planet->equipment -= $quantity;
                            $ship->equipment += $quantity;
                            break;
                    }
                    break;
                case 'leave':
                    switch ($request->input('group'))
                    {   
                        case 'fuel':
                            if ($ship->fuel < $quantity)
                                return response()->json(['error' => 'There aren\'t that many on your ship!'], 422);
                            if ($planet->fuel + $quantity > $planet->type->max_units_fuel)
                                return response()->json(['error' => 'They don\'t have room for that many on the planet!'], 422);
                            $planet->fuel += $quantity;
                            $ship->fuel -= $quantity;
                            break;
                        case 'organics':
                            if ($ship->organics < $quantity)
                                return response()->json(['error' => 'There aren\'t that many on your ship!'], 422);
                            if ($planet->organics + $quantity > $planet->type->max_units_organics)
                                return response()->json(['error' => 'They don\'t have room for that many on the planet!'], 422);
                            $planet->organics += $quantity;
                            $ship->organics -= $quantity;
                            break;
                        case 'equipment':
                            if ($ship->equipment < $quantity)
                                return response()->json(['error' => 'There aren\'t that many on your ship!'], 422);
                            if ($planet->equipment + $quantity > $planet->type->max_units_equipment)
                                return response()->json(['error' => 'They don\'t have room for that many on the planet!'], 422);
                            $planet->equipment += $quantity;
                            $ship->equipment -= $quantity;
                            break;
                    }
                    break;
            }
            
            $ship->save();
            $planet->save();
            
            return response()->json(['status' => 'ok'], 200);
        
        }
        else if ($task == 'destroy')
        {

            if ($ship->detonators === 0)
                return response()->json(['error' => 'You do not have any Atomic Detonators!'], 422);

            $experience = 0;
            $alignment = -1;

            $ship->detonators--;

            $sector->navhaz = ($sector->navhaz + 11 > 100 ? 100 : $sector->navhaz + 11);

            //$ship->planet_id = null;
            //$trader->planet_id = null;

            $figsDaily = (($planet->fuel_cols / $planet->type->col_to_fuel_ratio) + ($planet->organics_cols / $planet->type->col_to_organics_ratio) + ($planet->equipment_cols / $planet->type->col_to_equipment_ratio)) / $planet->type->col_to_fighter_ratio;

            $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '</span><span class="ansi-bright-red-fg ansi-bright-black-bg"> DESTROYED </span>the planet <span class="ansi-magenta-fg">' . $planet->name . '</span>!']));

            // will a Colonist attempt to defuse the detonator and cause a premature explosion
            if ($figsDaily > 300)
            {

                $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '</span> <span class="ansi-bright-red-fg">GOT BLOWN UP TOO!</span>']));

                //$trader->ship_id = null;
                //$trader->save();

                $escapepod = $ship->type->has_escapepod;
                $manufacturer_id = $ship->manufacturer_id;
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
                    $alignment = floor($trader->alignment / 2);
                    $trader->experience /= 2;
                    $trader->alignment /= 2;
                    $trader->credits = $universe->initial_credits;
                }

                $trader->deaths++;

                // TODO:
                // avoid sector, 

            }
            else
            {

                $experience = floor((50 * ($planet->citadel + 1)) + (($planet->fuel_cols + $planet->organics_cols + $planet->equipment_cols) / 200));

                $trader->experience += $experience;
                $trader->alignment += $alignment;

                // TODO: http://breakintochat.com/collections/magazines/door-world/1996-01-volume-1.11/ART21.TXT
                // calculate experience and alignment gains if other trader in planet's citadel

            }

            $trader->save();
            $ship->save();
            $sector->save();

            $planet->delete();

            return response()->json(['status' => 'ok', 'experience' => $experience, 'alignment' => $alignment], 200);

        }
        else if ($task == 'citadel')
        {

            switch ($planet->citadel)
            {
                case 0:
                    if ($planet->upgrade_completion > 0)
                        return response()->json(['error' => 'Be patient, your Citadel is not yet finished.'], 422);
                    if ($planet->fuel_cols + $planet->organics_cols + $planet->equipment_cols < $planet->type->citadel_level_1_cols)
                        return response()->json(['error' => 'You need <span class="ansi-bright-yellow-fg">' . number_format($planet->type->citadel_level_1_cols * 1000) . '</span> Colonists to build a citadel.'], 422);
                    if ($planet->fuel < $planet->type->citadel_level_1_fuel)
                        return response()->json(['error' => 'You need <span class="ansi-bright-yellow-fg">' . number_format($planet->type->citadel_level_1_fuel) . '</span> units of <span class="ansi-bright-cyan-fg">Fuel Ore</span> to build a citadel.'], 422);
                    if ($planet->organics < $planet->type->citadel_level_1_organics)
                        return response()->json(['error' => 'You need <span class="ansi-bright-yellow-fg">' . number_format($planet->type->citadel_level_1_organics) . '</span> units of <span class="ansi-bright-cyan-fg">Organics</span> to build a citadel.'], 422);
                    if ($planet->equipment < $planet->type->citadel_level_1_equipment)
                        return response()->json(['error' => 'You need <span class="ansi-bright-yellow-fg">' . number_format($planet->type->citadel_level_1_equipment) . '</span> units of <span class="ansi-bright-cyan-fg">Equipment</span> to build a citadel.'], 422);
                    $planet->fuel -= $planet->type->citadel_level_1_fuel;
                    $planet->organics -= $planet->type->citadel_level_1_organics;
                    $planet->equipment -= $planet->type->citadel_level_1_equipment;
                    $planet->upgrade_completion = $planet->type->citadel_level_1_days;
                    break;
                case 1:
                    if ($planet->upgrade_completion > 0)
                        return response()->json(['error' => 'You may not upgrade the Citadel while the Combat Control Computer is being built.'], 422);
                    break;
                case 2:
                    if ($planet->upgrade_completion > 0)
                        return response()->json(['error' => 'You may not upgrade the Citadel while the Quasar Cannon is being built.'], 422);
                    break;
                case 3:
                    if ($planet->upgrade_completion > 0)
                        return response()->json(['error' => 'You may not upgrade the Citadel while the Planetary TransWarp Drive is being built.'], 422);
                    break;
                case 4:
                    if ($planet->upgrade_completion > 0)
                        return response()->json(['error' => 'You may not upgrade the Citadel while the Planetary Defense Shielding is being built.'], 422);
                    break;
                case 5:
                    if ($planet->upgrade_completion > 0)
                        return response()->json(['error' => 'You may not upgrade the Citadel while the Planetary Interdictor Generator is being built.'], 422);
                    break;
                case 6:
                    return response()->json(['error' => 'This Citadel cannot be upgraded further.'], 422);
                    break;
            }

            $planet->save();
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

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!$trader = $universe->traders()->where('user_id', $this->user_id)->first())
            return response()->json(['error' => 'Trader Not Found'], 404);

        if ($id == 'personal')
        {

            $planets = $universe->planets()->with(['type' => function($query) {
                $query->addSelect(['id', 'class', 'desc', 'col_to_fuel_ratio', 'col_to_organics_ratio', 'col_to_equipment_ratio']);
            }])->with(['sector' => function($query) {
                $query->addSelect(['id', 'number']);
            }])->where('trader_id', $trader->id)->get(['sector_id', 'class_id', 'number', 'name', 'citadel', 'shields', 'fuel_cols', 'organics_cols', 'equipment_cols', 'fuel', 'organics', 'equipment', 'fighters', 'treasury']);

            return $planets;

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

    public function findLowestNumber($universe)
    {
        $min = 2;
        foreach ($universe->planets()->orderBy('number', 'asc')->get(['number']) as $planet)
        {
            if ($min < $ship->number)
                return $min;
            else
                $min++;
        }
        return $min;
    }

}
