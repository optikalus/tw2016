<?php

namespace Tradewars\Console\Commands;

use Illuminate\Console\Command;

class BigBang extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tradewars:bigbang {name : The name of the universe} {--sectors=1000 : The number of sectors in the universe}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'If you wish to make an apple pie from scratch, you must first invent the universe.';

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

      $minNeighbors = 1;
      $maxNeighbors = 6;
      $minSectorsPerCluster = 2;
      $maxSectorsPerCluster = 7;
      $portDensityMax = .40;
      $portDensityInit = .95;

      $fedspaceMap[1] = [2, 3, 4, 5, 6, 7];
      $fedspaceMap[2] = [1, 3, 7, 8, 9, 10];
      $fedspaceMap[3] = [1, 2, 4];
      $fedspaceMap[4] = [1, 3, 5];
      $fedspaceMap[5] = [1, 4, 6];
      $fedspaceMap[6] = [1, 5, 7];
      $fedspaceMap[7] = [1, 2, 6, 8];
      $fedspaceMap[8] = [2, 7];
      $fedspaceMap[9] = [2, 10];
      $fedspaceMap[10] = [2, 9];

      $name = $this->argument('name');
      $sectors = $this->option('sectors');
      $this->info(sprintf('Creating %d sector universe with name "%s"', $sectors, $name));

      $universe = \Tradewars\Universe::find(1);
/*      $universe = new \Tradewars\Universe;
      $universe->name = $name;
      $universe->sectors = $sectors;
      $universe->terra_cols = 30000;
      $universe->terra_cols_max = 100000;
      $universe->terra_cols_regen = .75;
      $universe->save();

      // Populate the universe
      for ($i = 1; $i <= $sectors; $i++)
        $universe->sectors()->save(new \Tradewars\Sector(['number' => $i]));

      // First 10 sectors belong to The Federation
      $this->info('Creating FedSpace');
      $fedspace = $universe->sectors()->where('number', '<=', 10)->get();
      foreach ($fedspace as $fs)
      {
        $fs->cluster = 'The Federation';
        $fs->beacon = 'FedSpace, FedLaw Enforced';
        $fs->save();

        $warps = $universe->sectors()->whereIn('number', $fedspaceMap[$fs->number])->get();
        foreach ($warps as $warp)
        {
          $fs->warps()->attach($warp->id);
        }
      }

      $this->info('Creating sector clusters');
      // get cluster names from db
      $clusters = \Tradewars\ClusterNames::all();
      foreach ($clusters as $cluster)
      {
        $clusterSectors = [];
        $sectorsInCluster = $universe->sectors()->where('cluster', '')->get()->random(rand($minSectorsPerCluster, $maxSectorsPerCluster));

        foreach ($sectorsInCluster as $clusterSector)
          array_push($clusterSectors, $clusterSector->id);

        $this->info(sprintf('  Found %d sectors for cluster %s', count($clusterSectors), $cluster->name));

        $adjacencyList = [];

        $i = 0;
        for ($i = 0; $i < count($clusterSectors); $i++)
          $adjacencyList[$clusterSectors[$i]] = [];

        for ($i = 1; $i < count($clusterSectors); $i++)
        {
          $sectorFrom = $clusterSectors[$i];
          $sectorTo = $clusterSectors[rand(0,$i - 1)];
          $adjacencyList[$sectorFrom][$sectorTo] = $adjacencyList[$sectorTo][$sectorFrom] = true;

          $sector = \Tradewars\Sector::find($sectorFrom);
          $sector->cluster = $cluster->name;
          $sector->save();
          $sector->warps()->attach($sectorTo);

          $sector = \Tradewars\Sector::find($sectorTo);
          $sector->cluster = $cluster->name;
          $sector->save();
          $sector->warps()->attach($sectorFrom);
        }

        $i -= 1;
        for (; $i < rand(count($clusterSectors) - 2, (count($clusterSectors) - 1) * 1.5); $i++)
        {
          $sectorFrom = $clusterSectors[rand(0,count($clusterSectors) - 1)];
          $sectorTo = $clusterSectors[rand(0,count($clusterSectors) - 1)];
          if ($sectorFrom === $sectorTo)
            $i -= 1;
          elseif (isset($adjacencyList[$sectorFrom][$sectorTo]))
            $i -= 1;
          else
          {
            $adjacencyList[$sectorFrom][$sectorTo] = $adjacencyList[$sectorTo][$sectorFrom] = true;

            $sector = \Tradewars\Sector::find($sectorFrom);
            $sector->cluster = $cluster->name;
            $sector->save();
            $sector->warps()->attach($sectorTo);

            $sector = \Tradewars\Sector::find($sectorTo);
            $sector->cluster = $cluster->name;
            $sector->save();
            $sector->warps()->attach($sectorFrom);
          }

        }

      }

      // bind the rest of the sectors together.
      $universeSectors = [];
      $sectorsInUniverse = $universe->sectors()->get();
      foreach ($sectorsInUniverse as $universeSector)
        array_push($universeSectors, $universeSector->id);

      shuffle($universeSectors);

      $adjacencyList = [];

      $i = 0;
      for (; $i < count($universeSectors); $i++)
        $adjacencyList[$universeSectors[$i]] = [];

      $this->info('========== PASS 1 ==========');

      for ($i = 1; $i < count($universeSectors); $i++)
      {
        $sectorFrom = $universeSectors[$i];
        $sectorTo = $universeSectors[rand(0, $i - 1)];

        $sectorFromWarps = \Tradewars\Sector::find($sectorFrom)->warps;
        $sectorToWarps = \Tradewars\Sector::find($sectorTo)->warps;

        // make sure either sector has < $maxNeighbors warps
        if (count($sectorFromWarps) < $maxNeighbors && count($sectorToWarps) < $maxNeighbors)
        {
          $adjacencyList[$sectorFrom][$sectorTo] = $adjacencyList[$sectorTo][$sectorFrom] = true;

          $this->info(sprintf('Binding %d to %d', $sectorFrom, $sectorTo));

          $sector = \Tradewars\Sector::find($sectorFrom);
          $sector->warps()->attach($sectorTo);

          $sector = \Tradewars\Sector::find($sectorTo);
          $sector->warps()->attach($sectorFrom);
        }
        // retry if sectorToWarps exceeds maxNeighbors
        elseif (count($sectorToWarps) >= $maxNeighbors)
        {
          $i--;
          continue;
        }
      }

      $i -= 1;
      for (; $i < ((count($universeSectors) - 1) * 1.5); $i++)
      {
        $sectorFrom = $universeSectors[rand(0, count($universeSectors) - 1)];
        $sectorTo = $universeSectors[rand(0, count($universeSectors) - 1)];
        if ($sectorFrom === $sectorTo)
          $i -= 1;
        elseif (isset($adjacencyList[$sectorFrom][$sectorTo]))
          $i -= 1;
        elseif (count(\Tradewars\Sector::find($sectorFrom)->warps) >= $maxNeighbors)
          $i -= 1;
        elseif (count(\Tradewars\Sector::find($sectorTo)->warps) >= $maxNeighbors)
          $i -= 1;
        else
        {

          $adjacencyList[$sectorFrom][$sectorTo] = $adjacencyList[$sectorTo][$sectorFrom] = true;

          $this->info(sprintf('Binding %d to %d', $sectorFrom, $sectorTo));

          $sector = \Tradewars\Sector::find($sectorFrom);
          $sector->warps()->attach($sectorTo);
      
          $sector = \Tradewars\Sector::find($sectorTo);
          $sector->warps()->attach($sectorFrom);

        }
      }

*/
      // Add fedspace port 0
      $sector = $universe->sectors()->where('number', 1)->firstOrFail();
//      $sector->port()->save(new \Tradewars\Port(['name' => 'Sol', 'class' => 0]));
      $sector->planet()->save(new \Tradewars\Planet(['name' => 'Terra', 'class' => 0]));
/*
      $classZeroSectors = $universe->sectors()->where('number', '>', 10)->get()->random(2);
      $i = 0;
      foreach ($classZeroSectors as $sector)
      {
        $sector->port()->save(new \Tradewars\Port(['name' => ($i == 0 ? 'Alpha Centauri' : 'Rylos'), 'class' => 0]));
        $i++;
      }
      // Add stardock
      $sector = $universe->sectors()->has('warps', 6)->where('cluster', '')->get()->random(1);
      $sector->port()->save(new \Tradewars\Port(['name' => 'Stargate Alpha I', 'class' => 9, 'credits' => 0, 'fuel' => 1250, 'organics' => 1250, 'equipment' => 1250, 'fuel_prod' => 300, 'organics_prod' => 300, 'equipment_prod' => 300, 'fuel_mcic' => -80, 'organics_mcic' => -50, 'equipment_mcic' => -35]));
      $sector->cluster = 'The Federation';
      $sector->beacon = 'FedSpace, FedLaw Enforced';
      $sector->save();

      // Create starports
      // loop through port classes
      for ($portClass = 1; $portClass <= 8; $portClass++)
      {

        $this->info(sprintf('Generating class %d ports.', $portClass));

        // grab sectors for this port class
        switch ($portClass)
        {
          case 1:
          case 2:
          case 3:
            $portSectors = $universe->sectors()->has('port', '<', 1)->get()->random((($sectors * $portDensityMax) * $portDensityInit) * .2);
            break;
          case 4:
          case 5:
          case 6:
            $portSectors = $universe->sectors()->has('port', '<', 1)->get()->random((($sectors * $portDensityMax) * $portDensityInit) * .1);
            break;
          case 7:
          case 8:
            $portSectors = $universe->sectors()->has('port', '<', 1)->get()->random((($sectors * $portDensityMax) * $portDensityInit) * .05);
            break;
        } 

        $this->info('Walking through sectors and creating ports.');

        foreach ($portSectors as $sector)
        {

          $oreProd = rand(75,300);
          $orgProd = rand(75,300);
          $equProd = rand(75,300);

          switch ($portClass)
          {
            case 1: // BBS
              $oreOnHand = 0;
              $orgOnHand = 0;
              $equOnHand = $equProd * 10;
              $oreMaxChangeInCost = rand(40,90);
              $oreMaxChangeInCost = $oreMaxChangeInCost - ($oreMaxChangeInCost * 2);
              $orgMaxChangeInCost = rand(30,75);
              $orgMaxChangeInCost = $orgMaxChangeInCost - ($orgMaxChangeInCost * 2);
              $equMaxChangeInCost = rand(20,65);
              break;
            case 2: // BSB
              $oreOnHand = 0;
              $orgOnHand = $orgProd * 10;
              $equOnHand = 0;
              $oreMaxChangeInCost = rand(40,90);
              $oreMaxChangeInCost = $oreMaxChangeInCost - ($oreMaxChangeInCost * 2);
              $orgMaxChangeInCost = rand(30,75);
              $equMaxChangeInCost = rand(20,65);
              $equMaxChangeInCost = $equMaxChangeInCost - ($equMaxChangeInCost * 2);
              break;
            case 3: // SBB
              $oreOnHand = $oreProd * 10;
              $orgOnHand = 0;
              $equOnHand = 0;
              $oreMaxChangeInCost = rand(40,90);
              $orgMaxChangeInCost = rand(30,75);
              $orgMaxChangeInCost = $orgMaxChangeInCost - ($orgMaxChangeInCost * 2);
              $equMaxChangeInCost = rand(20,65);
              $equMaxChangeInCost = $equMaxChangeInCost - ($equMaxChangeInCost * 2);
              break;
            case 4: // SSB
              $oreOnHand = $oreProd * 10;
              $orgOnHand = $orgProd * 10;
              $equOnHand = 0;
              $oreMaxChangeInCost = rand(40,90);
              $orgMaxChangeInCost = rand(30,75);
              $equMaxChangeInCost = rand(20,65);
              $equMaxChangeInCost = $equMaxChangeInCost - ($equMaxChangeInCost * 2);
              break;
            case 5: // SBS
              $oreOnHand = $oreProd * 10;
              $orgOnHand = 0;
              $equOnHand = $equProd * 10;
              $oreMaxChangeInCost = rand(40,90);
              $orgMaxChangeInCost = rand(30,75);
              $orgMaxChangeInCost = $orgMaxChangeInCost - ($orgMaxChangeInCost * 2);
              $equMaxChangeInCost = rand(20,65);
              break;
            case 6: // BSS
              $oreOnHand = 0;
              $orgOnHand = $orgProd * 10;
              $equOnHand = $equProd * 10;
              $oreMaxChangeInCost = rand(40,90);
              $oreMaxChangeInCost = $oreMaxChangeInCost - ($oreMaxChangeInCost * 2);
              $orgMaxChangeInCost = rand(30,75);
              $equMaxChangeInCost = rand(20,65);
              break;
            case 7: // SSS
              $oreOnHand = $oreProd * 10;
              $orgOnHand = $orgProd * 10;
              $equOnHand = $equProd * 10;
              $oreMaxChangeInCost = rand(40,90);
              $orgMaxChangeInCost = rand(30,75);
              $equMaxChangeInCost = rand(20,65);
              break;
            case 8: // BBB
              $oreOnHand = 0;
              $orgOnHand = 0;
              $equOnHand = 0;
              $oreMaxChangeInCost = rand(40,90);
              $oreMaxChangeInCost = $oreMaxChangeInCost - ($oreMaxChangeInCost * 2);
              $orgMaxChangeInCost = rand(30,75);
              $orgMaxChangeInCost = $orgMaxChangeInCost - ($orgMaxChangeInCost * 2);
              $equMaxChangeInCost = rand(20,65);
              $equMaxChangeInCost = $equMaxChangeInCost - ($equMaxChangeInCost * 2);
              break;
          }

          // name the port
          $portNames = \Tradewars\PortNames::all()->random(1);
          $portName = $portNames->name;

          $portNamePrefixes = ['New', 'Great'];
          $portNameSuffixes = ['II', 'III', 'IV', 'Alpha', 'Beta', 'Minor', 'Major', 'Outpost', 'Annex', 'Primus', 'Station'];

          while (count($universe->sectors()->whereHas('port', function ($query) use ($portName) { $query->where('name', $portName); })->get()) > 0)
          {
            $portName = (rand(1, 10) > 7 ? $portNamePrefixes[rand(0, count($portNamePrefixes) - 1)] . ' ' : '') . $portName . (rand(1, 10) > 7 ? ' ' . $portNameSuffixes[rand(0, count($portNameSuffixes) - 1)] : '' );
          }

          $sector->port()->save(new \Tradewars\Port(['name' => $portName, 'class' => $portClass, 'credits' => 0, 'fuel' => $oreOnHand, 'organics' => $orgOnHand, 'equipment' => $equOnHand, 'fuel_prod' => $oreProd, 'organics_prod' => $orgProd, 'equipment_prod' => $equProd, 'fuel_mcic' => $oreMaxChangeInCost, 'organics_mcic' => $orgMaxChangeInCost, 'equipment_mcic' => $equMaxChangeInCost]));

        } 


      }

 */

    }

}
