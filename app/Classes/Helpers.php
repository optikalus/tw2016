<?php

namespace Tradewars\Classes;

use Auth;

class Helpers {

  public function resolvePortClass($class)
  {
    switch ($class)
    {
      case 0:
        return 'Special';
      case 1:
        return 'BBS';
      case 2:
        return 'BSB';
      case 3:
        return 'SBB';
      case 4:
        return 'SSB';
      case 5:
        return 'SBS';
      case 6:
        return 'BSS';
      case 7:
        return 'SSS';
      case 8:
        return 'BBB';
      case 9:
        return 'Special';
      default:
        return '';
    }
  }

  public function resolvePlanetClass($class)
  {
    switch ($class)
    {
      case 0:
        return 'M';
      case 1:
        return 'K';
      case 2:
        return 'O';
      case 3:
        return 'L';
      case 4:
        return 'C';
      case 5:
        return 'H';
      case 6:
        return 'U';
      default:
        return '';
    }
  }

  public function fighterMode($mode)
  {
    switch ($mode)
    {
      case 0:
        return 'Defensive';
      case 1:
        return 'Offensive';
      case 2:
        return 'Toll';
      default:
        return '';
    }
  }

  public function mineType($type)
  {
    switch ($type)
    {
      case 0:
        return 'Armid';
      case 1:
        return 'Limpet';
      default:
        return '';
    }
  }

  public function resolveOwner($user_id)
  {
    if (Auth::user()->id === $user_id)
      return 'yours';

    return \Tradewars\User::find($user_id)->username;
  }

  public function getShipEmptyHolds($ship)
  {
    return $ship->holds - $ship->fuel - $ship->organics - $ship->equipment - $ship->colonists;
  }

  public function portCalcDefense($class, $fuel, $fuel_prod, $organics, $organics_prod, $equipment, $equipment_prod)
  {
    $min = ($fuel_prod + $organics_prod + $equipment_prod) / 10;
    $max = $min * 1.5;
    $diff = $max - $min;
    if ($diff == 0)
      return 0;
    $avg = 0;
    for ($i = 0; $i < 3; $i++) {
      $thisItem = substr(Helpers::resolvePortClass($port->class), $i, 1);
      switch ($i)
      {
        case 0:
          if ($thisItem == 'S')
              $avg += ($fuel == 0 ? 0 : $fuel_prod * 10 / $fuel);
          else
              $avg += ($fuel_prod * 10 - $fuel == 0 ? 0 : $fuel_prod * 10 / ($fuel_prod * 10 - $fuel));
          break;
        case 1:
          if ($thisItem == 'S')
              $avg += ($organics == 0 ? 0 : $organics_prod * 10 / $organics);
          else
              $avg += ($organics_prod * 10 - $organics == 0 ? 0 : $organics_prod * 10 / ($organics_prod * 10 - $organics));
          break;
        case 2:
          if ($thisItem == 'S')
              $avg += ($equipment == 0 ? 0 : $equipment_prod * 10 / $equipment);
          else
              $avg += ($equipment_prod * 10 - $equipment == 0 ? 0 : $equipment_prod * 10 / ($equipment_prod * 10 - $equipment));
          break;
      }
    }
    $avg = $avg / 3;
    return round($min + ($diff * ($avg / 100)));
  }

}
