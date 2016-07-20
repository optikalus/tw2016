<?php

namespace Tradewars\Console\Commands;

use Illuminate\Console\Command;
use Cache;
use Fhaculty\Graph\Graph;
use Graphp\Algorithms\ShortestPath\Dijkstra;

class ValidateUniverse extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tradewars:validate {name : The name of the universe}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate the universe.';

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

      $graph = new Graph();

      $universeName = $this->argument('name');
      $universe = \Tradewars\Universe::where('name', $universeName)->firstOrFail();

      $this->info(sprintf('Universe %s [%d] found.', $universe->name, $universe->id));

      $vertices = Cache::rememberForever('universe_' . $universe->id . '_vertices_cache', function() use ($graph, $universe) {

        $sectors = $universe->sectors()->get();
        $this->info(sprintf('%d sectors found.', count($sectors)));
        $vertices = [];
        $edges = [];
        foreach ($sectors as $sector)
          $vertices[$sector->number] = $graph->createVertex($sector->number);

        foreach ($sectors as $sector)
          foreach (\Tradewars\Sector::find($sector->id)->warps as $warp)
            $edges[$sector->number] = $vertices[$sector->number]->createEdgeTo($vertices[$warp->number])->setWeight(1);

        return $vertices;
      });

      $this->info('Graph acquired. Processing..');

      $bar = $this->output->createProgressBar($universe->sectors * $universe->sectors);

      for ($i = 1; $i <= $universe->sectors; $i++)
      {
        for ($j = 1; $j <= $universe->sectors; $j++)
        {
          if ($i === $j)
          {
            $bar->advance();
            continue;
          }
          $path = new Dijkstra($vertices[$i]);
          //$this->info(sprintf('Hops from sector %d to %d: %d', $i, $j, $path->getDistance($vertices[$j])));
          try
          {
            if ($path->getDistance($vertices[$j]) > 0)
            {
              $bar->advance();
              continue;
            }
          }
          catch(\OutOfBoundsException $e)
          {
            $bar->advance();
            $this->info(sprintf('  ERROR: %d to %d is unroutable!', $i, $j));
          }
        }
      }

      $bar->finish();

    }
}
