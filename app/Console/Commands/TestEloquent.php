<?php

namespace Tradewars\Console\Commands;

use Illuminate\Console\Command;

class TestEloquent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tradewars:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'omg why wont you work';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {

        $user = \Tradewars\User::find(1);
        $universe = \Tradewars\Universe::find(1);
        $initial_ship = \Tradewars\ShipType::where('is_escapepod', false)->firstOrFail();

        //$trader = $universe->traders()->save(new \Tradewars\Trader(['name' => 'Lord Nikon', 'credits' => $universe->initial_credits]));
        $trader = $user->trader()->first();

        $this->info($trader->name);

        //$ship = $universe->ships()->save(new \Tradewars\Ship(['name' => 'Oh Ship', 'fighters' => $universe->initial_fighters, 'holds' => $universe->initial_holds]));
        $ship = $user->ship()->first();

        $this->info($ship->name);

        $ship->trader()->associate($trader);
        $ship->type()->associate($initial_ship);
        $trader->ship_id = $ship->id;

        //$planet = $universe->planets()->save(new \Tradewars\Planet(['name' => 'Water World']));
        $planet = $user->planet()->first();

        $planet->type()->associate(\Tradewars\PlanetType::find(1));
        $this->info($planet->name);
        $planet->trader()->associate($trader);
        $trader->planet_id = $planet->id;
        $ship->planet_id = $planet->id;

        $user->trader()->save($trader);
        $user->ship()->save($ship);
        $user->planet()->save($planet);

        // find a random unoccupied sector
        $sector = $universe->sectors()->has('planet', '<', 1)->has('fighters', '<', 1)->has('mines', '<', 1)->has('trader', '<', 1)->has('ship', '<', 1)->where('cluster', '!=', 'The Federation')->get()->random(1);

        $trader->sector_id = $sector->id;
        $trader->save();

        $planet->sector_id = $sector->id;
        $planet->save();

        $ship->sector_id = $sector->id;
        $ship->save();


    }
}
