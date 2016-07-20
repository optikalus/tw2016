<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Log extends Controller
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

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        return $universe->logs()->where('created_at', '>=', \Carbon\Carbon::today())->get();
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

        if ($task == 'postannouncement')
        {

            $announcement = $request->input('announcement');

            $this->validate($request, [
                'announcement' => 'required'
            ]);

            $universe->logs()->save(new \Tradewars\Log(['message' => '<span class="ansi-bright-cyan-fg">' . $trader->name . '</span> posted this universal announcement:<br /><span class="ansi-blue-fg">' . $announcement . '</span>']));

            return response()->json(['status' => 'ok'], 200);

        }

    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id, Request $request)
    {
        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if ($id == 'search')
        {

            $q = $request->input('q');

            if (preg_match('/^\d+\/\d+\/\d+$/', $q))
              return $universe->logs()->where('created_at', '>=', \Carbon\Carbon::parse($q)->subYears(28)->toDateTimeString())->get();
            else
              return $universe->logs()->where('message', 'like', '%'.$q.'%')->get();

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
