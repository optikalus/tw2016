<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class ClusterNames extends Model
{
  protected $table = 'clusternames';
  protected $fillable = ['name'];
  public $timestamps = false;
}
