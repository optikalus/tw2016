<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Cache;
use DB;
use Log;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

use Fhaculty\Graph\Graph;
use Graphp\Algorithms\ShortestPath\Dijkstra;

class Sector extends Controller
{

    public function __construct(Request $request)
    {
        $this->middleware('auth');
        $this->user_id = Auth::user()->id;
        $this->universe_id = $request->session()->get('universe');
        $this->lastExploredSector = null;
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

        if (!$sector = $universe->sectors()->with('warps')->where('id', $sector_id)->first())
            return response()->json(['error' => 'Sector Not Found'], 404);

        // make sure trader is in the same sector as planet_id
        if ($trader->sector_id !== $ship->sector_id || $trader->sector_id !== $sector->id)
            return response()->json(['error' => 'Trader/Ship/Sector mismatch'], 422);

        if ($task == 'getpath')
        {

            $sourceNumber = $request->input('source');
            $destinationNumber = $request->input('destination');

            $this->validate($request, [
                'source' => 'integer',
                'destination' => 'required|integer'
            ]);

            if ($destinationNumber > $universe->sectors)
                return response()->json(['error' => 'Destination out of bounds'], 422);

            if ($sourceNumber > $universe->sectors)
                return response()->json(['error' => 'Source out of bounds'], 422);

            if (!$destination = $universe->sectors()->where('number', $destinationNumber)->first())
                return response()->json(['error' => 'Destination Sector Not Found'], 422);

            if ($sourceNumber && !$source = $universe->sectors()->where('number', $sourceNumber)->first())
                return response()->json(['error' => 'Source Sector Not Found'], 422);

            if ($sourceNumber)
                $sector_id = $source->id;

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

            $path = new Dijkstra($vertices[($sourceNumber ? $source->id : $sector_id)]);

            try
            {
                $hops = $path->getDistance($vertices[$destination->number]);
            }
            catch (\OutOfBoundsException $e)
            {
                return response()->json(['error' => 'No route within 20 warps from sector <span class="ansi-bright-yellow-fg">' . $sector->number . '</span> to sector <span class="ansi-bright-yellow-fg">' . $destination->number . '</span>']);
            }

            $warps = [ $sector_id ];
            $warpPath = $path->getEdgesTo($vertices[$destination->number]);
            foreach ($warpPath as $warp)
                array_push($warps, $warp->getVertexEnd()->getId());

            return $warps;

        }
        else if ($task == 'getwarps')
        {

            $sectorNumber = $request->input('sector');

            $this->validate($request, [
                'sector' => 'required|integer'
            ]);

            if ($sectorNumber > $universe->sectors)
                return response()->json(['error' => 'Sector out of bounds'], 422);

            if (!$sector = $universe->sectors()->with('warps')->where('number', $sectorNumber)->first())
                return response()->json(['error' => 'Sector Not Found'], 422);

            $warps = [];

            foreach ($sector->warps as $warp)
                array_push($warps, $warp->number);

            return $warps;

        }
        else if ($task == 'move')
        {

            $destinationNumber = $request->input('destination');

            $this->validate($request, [
                'destination' => 'required|integer'
            ]);

            if ($destinationNumber > $universe->sectors)
                return response()->json(['error' => 'Destination out of bounds'], 422);

            // make sure destinationNumber is a valid adjacent warp
            $validatedWarp = false;
            foreach ($sector->warps as $warp)
                if ($warp->number == $destinationNumber)
                    $validatedWarp = $warp;

            if (!$validatedWarp)
                return response()->json(['error' => 'Could not find adjacent warp.'], 422);

            if (!$trader->explored)
                $trader->explored = json_encode([$validatedWarp->number]);
            else
            {
                $exploredSectors = json_decode($trader->explored);
                if (!in_array($validatedWarp->number, $exploredSectors))
                {
                    $this->lastExploredSector = $validatedWarp->number;
                    array_push($exploredSectors, $validatedWarp->number);
                    sort($exploredSectors);
                    $trader->explored = json_encode($exploredSectors);
                }
            }

            $trader->turns -= $ship->type->turns_per_warp;
            $trader->sector_id = $validatedWarp->id;
            $ship->sector_id = $validatedWarp->id;

            $trader->save();
            $ship->save();

            try
            {
                $client = new \Hoa\Websocket\Client(new \Hoa\Socket\Client('tcp://127.0.0.1:2002'));
                $client->connect();
                $client->send($trader->name . ' in ' . $ship->name . ' moved to sector ' . $destinationNumber . '!');
                $client->close();
            }
            catch (\Exception $e)
            {
                Log::info('Could not connect to websocket. ' . $e);
            }

            return $this->show('current', true);

        }
        else if ($task == 'holoScan')
        {

            if ($ship->scanner != 2)
                return response()->json(['error' => 'Ship does not have a Holographic Scanner!'], 422);

            if (!$trader->explored)
                $trader->explored = json_encode([$sector->number]);
            else
                $exploredSectors = json_decode($trader->explored);

            foreach ($sector->warps as $warp)
                if (!in_array($warp->number, $exploredSectors))
                    array_push($exploredSectors, $warp->number);

            sort($exploredSectors);

            $trader->turns -= 1;
            $trader->explored = json_encode($exploredSectors);
            $trader->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'beacon')
        {

            $message = $request->input('message');

            $this->validate($request, [
                'message' => 'required'
            ]);

            if ($ship->beacons == 0)
                return response()->json(['error' => 'You do not have any Marker Beacons.'], 422);

            if ($sector->beacon != '')
                $sector->beacon = null;
            else
                $sector->beacon = $message;

            $ship->beacons -= 1;

            $sector->save();
            $ship->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'destroybeacon')
        {

            if ($ship->fighters == 0)
                return response()->json(['error' => '<span class="ansi-bright-yellow-fg">You don\'t have any fighters.</span>'], 422);

            $ship->fighters -= 1;
            $sector->beacon = null;

            $sector->save();
            $ship->save();

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

        if ($id == 'current')
        {

            $sector = $universe->sectors()->with('warps')->where('id', $trader->sector_id)->first();

            if (!$trader->explored)
                $trader->explored = [$sector->number];
            else
                $trader->explored = json_decode($trader->explored);

            $ship = $trader->ship()->with('type')->with('manufacturer')->where('id', $trader->ship_id)->first();

            if ($trader->planet_id != null)
            {
                $planet = $universe->planets()->where('id', $trader->planet_id)->first();
                $planet->type;
                $planet->trader;
                return ['planet' => $planet, 'ship' => $ship, 'sector' => $sector];
            }

            $sector->load(['fighters.trader' => function ($query) {
                $query->addSelect(['id', 'name']);
            }]);

            $sector->load(['mines.trader' => function ($query) {
                $query->addSelect(['id', 'name']);
            }]);

            $sector->load(['port' => function ($query) {
                $query->select(['id', 'universe_id', 'sector_id', 'name', 'class', 'destroyed', 'last_ship', 'last_time', 'fuel', 'organics', 'equipment', 'fuel_prod', 'organics_prod', 'equipment_prod', 'fuel_mcic', 'organics_mcic', 'equipment_mcic']);
            }]);

            if ($sector->number == 1)
            {
                $terra = new \Tradewars\Planet;
                $terra->cols = $universe->terra_cols;
                $sector->terra = $terra;
            }
            else 
            {

                $sector->load(['planets' => function ($query) {
                    $query->select(['planets.id', 'planets.number', 'universe_id', 'sector_id', 'name', 'class', DB::raw('(CASE WHEN planets.citadel >= 5 THEN 1 ELSE 0 END) as shielded')])->join('planet_types', 'planets.class_id', '=', 'planet_types.id');
                }]);

            }

            if ($this->lastExploredSector == $sector->number)
                $sector->explored = false;
            else
                $sector->explored = true;

            $traders_sector = [];
            foreach ($universe->traders()->where('sector_id', $trader->sector_id)->where('id', '<>', $trader->id)->get(['ship_id']) as $trader_sector)
                array_push($traders_sector, $trader_sector->ship_id);
            $sector->traders = $universe->ships()->with(['type' => function ($query) {
                $query->addSelect(['id', 'class', 'defensive_odds']);
            }])->with(['manufacturer' => function ($query) {
                $query->addSelect(['id', 'name']);
            }])->with(['trader' => function ($query) {
                $query->addSelect(['id', 'name', 'alignment', 'experience']);
            }])->whereIn('id', $traders_sector)->get(['id', 'trader_id', 'ship_id', 'manufacturer_id', 'name', 'number', 'fighters', 'shields']);

            $manned_ships = [];
            foreach ($universe->traders()->where('sector_id', $trader->sector_id)->whereNotNull('ship_id')->get(['ship_id']) as $manned_ship)
                array_push($manned_ships, $manned_ship->ship_id);
            $ships = $universe->ships()->with(['type' => function ($query) {
                $query->addSelect(['id', 'class', 'defensive_odds']);
            }])->with(['manufacturer' => function ($query) {
                $query->addSelect(['id', 'name']);
            }])->with(['trader' => function ($query) {
                $query->addSelect(['id', 'name']);
            }])->whereNotIn('id', $manned_ships)->where('sector_id', $trader->sector_id)->get(['id', 'trader_id', 'ship_id', 'manufacturer_id', 'name', 'number', 'fighters', 'shields']);

            $replaceShips = collect();
            foreach ($ships as $sectorShip)
            {
                if ($sectorShip->trader_id == $trader->id)
                {
                    $replaceShips->push($universe->ships()->with('type')->with('manufacturer')->with(['trader' => function ($query) {
                        $query->addSelect(['id', 'name']);
                    }])->where('id', $sectorShip->id)->where('sector_id', $trader->sector_id)->where('trader_id', $trader->id)->first());
                }
                else
                    $replaceShips->push($sectorShip);
            }

            $sector->ships = $replaceShips;

            // build density scan results for warps
            if ($ship->scanner > 0)
            {

                foreach ($sector->warps as $warp)
                {

                    if (in_array($warp->number, $trader->explored))
                        $warp->explored = true;
                    else
                        $warp->explored = false;

                    $density = 0;
                    if ($warp->beacon != '')
                        $density += 1;

                    $warp->load(['fighters.trader' => function ($query) {
                        $query->addSelect(['id', 'name']);
                    }]);

                    $warp->load(['mines.trader' => function ($query) {
                        $query->addSelect(['id', 'name']);
                    }]);

                    foreach ($warp->mines as $mine)
                    {
                        if ($mine->type == 1)
                            $density += (10 * $mine->quantity);
                        else if ($mine->type == 2)
                        {
                            $warp->anomaly = true;
                            $density += (2 * $mine->quantity);
                        }
                    }
                    if ($warp->fighters->quantity)
                        $density += (5 * $warp->fighters->quantity);
                    if ($warp->navhaz)
                        $density += (21 * $warp->navhaz);
                    if ($warp->port) {
                        if ($warp->port->destroyed)
                          $density += 50;
                        else
                          $density += 100;
                    }

                    $warp->load(['planets' => function ($query) {
                        $query->select(['planets.id', 'planets.number', 'universe_id', 'sector_id', 'name', 'class', DB::raw('(CASE WHEN planets.citadel >= 5 THEN 1 ELSE 0 END) as shielded')])->join('planet_types', 'planets.class_id', '=', 'planet_types.id');
                    }]);

                    foreach ($warp->planets as $planet)
                        $density += 500;
                    if ($warp->number == 1) // add Terra
                        $density += 500;

                    if ($ship->scanner == 2)
                    {
                        $traders_sector = [];
                        foreach ($universe->traders()->where('sector_id', $warp->sector_id)->get(['ship_id']) as $trader_sector)
                        {
                            $density += 40;
                            array_push($traders_sector, $trader_sector->ship_id);
                        }
                        $warp->traders = $universe->ships()->with(['type' => function ($query) {
                            $query->addSelect(['id', 'class']);
                        }])->with(['manufacturer' => function ($query) {
                            $query->addSelect(['id', 'name']);
                        }])->with(['trader' => function ($query) {
                            $query->addSelect(['id', 'name', 'alignment', 'experience']);
                        }])->whereIn('id', $traders_sector)->get(['id', 'trader_id', 'ship_id', 'manufacturer_id', 'name', 'fighters']);

                        $manned_ships = [];
                        foreach ($universe->traders()->where('sector_id', $warp->sector_id)->whereNotNull('ship_id')->get(['ship_id']) as $manned_ship)
                            array_push($manned_ships, $manned_ship->ship_id);
                        $warp->ships = $universe->ships()->with(['type' => function ($query) {
                            $query->addSelect(['id', 'class']);
                        }])->with(['manufacturer' => function ($query) {
                            $query->addSelect(['id', 'name']);
                        }])->with(['trader' => function ($query) {
                            $query->addSelect(['id', 'name']);
                        }])->whereNotIn('id', $manned_ships)->where('sector_id', $trader->sector_id)->get(['id', 'trader_id', 'ship_id', 'manufacturer_id', 'name', 'fighters']);

                        foreach ($warp->ships as $thisWarpShip)
                            $density += 38;
                    }
                    else
                    {
                        foreach ($universe->traders()->where('sector_id', $warp->sector_id)->get(['ship_id']) as $trader_sector)
                            $density += 40;

                        $manned_ships = [];
                        foreach ($universe->traders()->where('sector_id', $warp->sector_id)->whereNotNull('ship_id')->get(['ship_id']) as $manned_ship)
                            array_push($manned_ships, $manned_ship->ship_id);
                        foreach ($universe->ships()->whereNotIn('id', $manned_ships)->where('sector_id', $warp->sector_id)->get(['id']) as $ships)
                            $density += 38;
                    }

                    $warp->density = $density;
                    $warp->warps = $warp->warps()->count();

                    // clean up
                    if ($ship->scanner == 1)
                    {
                        unset($warp->mines);
                        unset($warp->fighters);
                        unset($warp->port);
                        unset($warp->planets);
                    }
                }

            }
            else
            {

                foreach ($sector->warps as $warp)
                {

                    if (in_array($warp->number, $trader->explored))
                        $warp->explored = true;
                    else
                        $warp->explored = false;

                }

            }

            return ['ship' => $ship, 'trader' => $trader, 'sector' => $sector];
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
}
