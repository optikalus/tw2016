var el = $('#tradewars')
var lineHeight = 22
var pageTimer, progressBarTimer
var config, universe = []
var retina = window.devicePixelRatio > 1;

var autopilotPrompt = '<br /><span class="ansi-bright-cyan-fg">Stop in this sector <span class="ansi-bright-yellow-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="yes">Y</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="no">N</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="express">E</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="shipinfo">I</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="portreport">R</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="scan">S</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="display">D</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="port">P</a>,<a href="" class="ansi-bright-yellow-fg" data-attribute="menu">?</a>) (?=Help)</span> <span class="ansi-yellow-fg">[N]</span> ? </span> '
var sectorPrompt = '<br /><span class="ansi-magenta-fg show-entry">Command [<span class="ansi-bright-yellow-fg">TL=00:00:00</span>]<span class="ansi-bright-yellow-fg">:</span>[<span class="ansi-bright-cyan-fg">#SECTORNUMBER</span>] (<span class="ansi-bright-yellow-fg">?=Help</span>)? : '
var computerPrompt = '<br /><span class="ansi-magenta-fg show-entry">Computer command [<span class="ansi-bright-yellow-fg">TL=00:00:00</span>]<span class="ansi-bright-white-fg">:</span>[<span class="ansi-bright-cyan-fg">#SECTORNUMBER</span>] (<span class="ansi-bright-yellow-fg">?=Help</span>)? '
var planetPrompt = '<br /><span class="ansi-magenta-fg">Planet command <span class="ansi-bright-yellow-fg">(?=help)</span> [D]</span>'
var planetDestroyPrompt = '<span class="ansi-magenta-fg">Planetary Attack Command <span class="ansi-bright-yellow-fg">[Q]</span></span>'
var citadelPrompt = '<br /><span class="ansi-magenta-fg">Citadel command (<span class="ansi-bright-yellow-fg">?=Help</span>) ?</span> '
var starDockPrompt = '<br /><span class="ansi-magenta-fg">&lt;<span class="ansi-yellow-fg">StarDock</span>&gt; Where to? (<span class="ansi-bright-yellow-fg">?=Help</span>) </span>'
var bankPrompt = '<br /><span class="ansi-magenta-fg show-entry">&lt;<span class="ansi-yellow-fg">Galactic Bank</span>&gt; So, how can I help you Citizen? <span class="ansi-bright-yellow-fg">(?)</span> ? </span> '
var emporiumPrompt = '<span class="ansi-magenta-fg show-entry">&lt;<span class="ansi-yellow-fg">Hardware Emporium</span>&gt; So what are you looking for? <span class="ansi-bright-yellow-fg">(?)</span> ? </span> '
var libraryPrompt = '<span class="ansi-magenta-fg show-entry">&lt;<span class="ansi-yellow-fg">Libram Universitatus</span>&gt; Select an archive <span class="ansi-bright-yellow-fg">(?=List)</span> ? </span> '
var policePrompt = '<br /><span class="ansi-magenta-fg show-entry">&lt;<span class="ansi-yellow-fg">FedPolice</span>&gt; So, how can I help you Citizen? <span class="ansi-bright-yellow-fg">(?)</span> ? </span> '
var shipyardPrompt = '<br /><span class="ansi-magenta-fg show-entry">&lt;<span class="ansi-yellow-fg">Shipyards</span>&gt; Your option <span class="ansi-bright-yellow-fg">(?)</span> ? </span> '

var citadelNames = [ 'Citadel', 'Combat Control Computer', 'Quasar Cannon', 'Planetary TransWarp Drive', 'Planetary Defense Shielding', 'Planetary Interdictor Generator' ]

$.ajaxSetup({
  beforeSend: function(xhr) {
    xhr.setRequestHeader('X-XSRF-TOKEN', $('meta[name="csrf-token"]').attr('content'))
  }
})

moment.tz.setDefault('UTC')

var Tradewars = function() {

  var selectUniverse = function(id) {
    if (universe !== id)
      console.log('universe switch attempted')
    $.post('/universes/', { 'id': universe.id }, function(result) {
      if (result.status == 'ok')
        showIntroANSI(showMainMenu)
      else
        showUniverses()
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    })
  }

  var menuEventHandler = function(map) {
    var menuEvents = []
    var number = ''
    var max = ''
    window.scrollTo(0, document.body.scrollHeight)
    for (var i in map) {
      if (parseInt(map[i].max) >= 0)
        max = map[i].max
      menuEvents[map[i].attribute] = [ map[i].nextFunction, map[i].nextFunctionArgs, (map[i].noreset ? true : false)]
      $(document).on('click.handler', 'a[data-attribute="'+map[i].attribute+'"]', function(e) {
        e.preventDefault()
        if (!menuEvents[$(e.target).attr('data-attribute')][2])
          $(document).off('.handler')
        menuEvents[$(e.target).attr('data-attribute')][0].apply(null, menuEvents[$(e.target).attr('data-attribute')][1])
      })
    }

    // NOTE: keyup() can't handle extended characters (!@#$etc)
    $(document).on('keydown.handler', null, function(e) {
      if (e.which == 8) {
        e.preventDefault()
        if (parseInt(number) >= 0) {
          number = number.slice(0, -1)
          $('.show-entry').html($('.show-entry').html().slice(0, -1))
        }
      }
    })

    $(document).on('keypress.handler', null, function(e) {
      e.preventDefault()
      if (e.which >= 48 && e.which <= 57) {
        if ((max.toString() != '' && parseInt((number.toString() + (e.which - 48))) <= parseInt(max.toString())) || max.toString() == '') {
          $('.show-entry').append(e.which - 48)
          number = number.toString() + (e.which - 48)
        }
      }
      for (var i in map) {
        if (String.fromCharCode(e.which).toUpperCase().charCodeAt() == map[i].key && number == '') {
          if (!map[i].noreset)
            $(document).off('.handler')
          if (map[i].addbreak)
            el.append('<br />')
          $('.show-entry').removeClass('show-entry')
          map[i].nextFunction.apply(null, map[i].nextFunctionArgs)
        } else if (e.which == 13 && parseInt(number) >= 0 && map[i].number == number) {
          if (!map[i].noreset)
            $(document).off('.handler')
          if (map[i].addbreak)
            el.append('<br />')
          $('.show-entry').removeClass('show-entry')
          map[i].nextFunctionArgs.push(map[i].id)
          map[i].nextFunction.apply(null, map[i].nextFunctionArgs)
          number = ''
        }
      }
      if (e.which == 13 && parseInt(number) >= 0) {
        // find and execute Invalid Number text
        $('.show-entry').removeClass('show-entry')
        for (var i in map) {
          if (map[i].failure) {
            if (!map[i].noreset)
              $(document).off('.handler')
            if (map[i].addbreak)
              el.append('<br />')
            map[i].nextFunctionArgs.push(parseInt(number))
            map[i].nextFunction.apply(null, map[i].nextFunctionArgs)
          }
        }
        number = ''
        window.scrollTo(0, document.body.scrollHeight)
      }
    })
  }

  var showUniverses = function() {

    var universesArray = []

    $(document).on('click.select-universe', 'a[data-attribute="select-universe"]', function(e) {
      e.preventDefault()
      if (typeof universesArray[$(this).attr('data-id')] !== 'undefined') {
        selectUniverse(universe = universesArray[$(this).attr('data-id')])
        $(document).off('.select-universe')
      }
    })

    $(document).on('keyup.select-universe', null, function(e) {
      if (typeof universesArray[e.which] !== 'undefined') {
        selectUniverse(universe = universesArray[e.which])
        $(document).off('.select-universe')
      }
    })

/*    AnsiLove.render('/intro/select', function(canvas, sauce) {
      el.html(canvas)
    }, { 'bits': 9, '2x': (retina ? 1 : 0) }) */

    $.get('/universes/', function(result) {
      var menu = $('<dl></dl>').addClass('ansi-green-fg')
      var universes = result.universe
      config = result.config
      for (var i in universes) {
        universesArray[parseInt(i + 65)] = universes[i]
        menu.append($('<dt></dt>').html('&lt;<a href="" data-id="' + parseInt(i + 65) + '" data-attribute="select-universe">' + String.fromCharCode(i + 65) + '</a>&gt; ' + universes[i].name))
        menu.append($('<dd></dd>').addClass('ansi-white-fg').html('<span class="ansi-magenta-fg">Sectors:</span> ' + addCommas(universes[i].sectors) + ', <span class="ansi-magenta-fg">Traders: </span> ' + addCommas(universes[i].traders) + ', <span class="ansi-magenta-fg">Ships:</span> ' + addCommas(universes[i].ships) + ', <span class="ansi-magenta-fg">Planets: </span> ' + addCommas(universes[i].planets) + ', <span class="ansi-magenta-fg">Ports: </span> ' + addCommas(universes[i].ports) + ', <span class="ansi-magenta-fg">Created:</span> ' + $.format.prettyDate(universes[i].banged.date)))
      }
      el.html(menu)
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    })
  }

  var showIntroANSI = function(nextFunction) {
    var controller = AnsiLove.animate('/intro/', function(canvas, sauce) {
      el.html(canvas)
      controller.play(14400, function() { })
      pressAnyKey(nextFunction)
    }, { 'bits': 9, '2x': (retina ? 1 : 0) })
  }

  var pressAnyKey = function(nextFunction) {
    el.append('<br /><span class="ansi-magenta-fg">[Pause]</span>')
    pageTimer = setTimeout(function() { el.append('<span class="ansi-magenta-fg"> - <strong>[Press Space or Enter to continue]</strong></span>') }, 10000)
    $(document).one('keypress.anykey click.anykey', null, function(e) {
      clearTimeout(pageTimer)
      $(document).off('.anykey')
      nextFunction()
      window.scrollTo(0, document.body.scrollHeight)
    })
  }

  var booleanKey = function(affirmFunction, denyFunction, defaultKey) {
    window.scrollTo(0, document.body.scrollHeight)
    $(document).on('click.boolean', '.yes', function(e) {
      e.preventDefault()
      $(document).off('.boolean')
      el.append('<br />')
      affirmFunction()
    })
    $(document).on('click.boolean', '.no', function(e) {
      e.preventDefault()
      $(document).off('.boolean')
      el.append('<br />')
      denyFunction()
    })
    $(document).on('keypress.boolean', null, function(e) {
      e.preventDefault()
      switch (e.which) {
        case 121:
        case 89:
          // yes
          $(document).off('.boolean')
          el.append('<span class="ansi-bright-cyan-fg">Yes</span><br />')
          affirmFunction()
          break
        case 110:
        case 78:
          // no
          $(document).off('.boolean')
          el.append('<span class="ansi-bright-cyan-fg">No</span><br />')
          denyFunction()
          break
        case 13:
          if (typeof defaultKey == 'undefined')
            break
          $(document).off('.boolean')
          el.append('<span class="ansi-bright-cyan-fg">' + (defaultKey === false ? 'No' : 'Yes') + '</span><br />')
          el.append('<br />')
          if (defaultKey === false)
            denyFunction()
          else
            affirmFunction()
      }
    })
  }

  var showBooleanPrompt = function(defaultKey) {
    return ' (<a href="" class="ansi-bright-yellow-fg yes">Y</a><span class="ansi-bright-yellow-fg">/</span><a href="" class="ansi-bright-yellow-fg no">N</a>) [<span class="ansi-bright-cyan-fg">' + (defaultKey === true ? 'Y' : 'N' ) + '</span>] '
  }

  var showMainMenu = function() {

    menuEventHandler([
      { 'nextFunction': playGame, 'attribute': 'play', 'key': 'T'.charCodeAt() },
      { 'nextFunction': showHelp, 'nextFunctionArgs': [ showMainMenu ], 'attribute': 'help', 'key': 'I'.charCodeAt() },
      { 'nextFunction': showScoresByValue, 'nextFunctionArgs': [ showMainMenu ], 'attribute': 'scores', 'key': 'H'.charCodeAt() },
      { 'nextFunction': showUniverses, 'attribute': 'quit', 'key': 'x'.charCodeAt() }
    ])

    var menu = $('<ul></ul>').addClass('list-unstyled').addClass('ansi-bright-cyan-fg')
    menu.append($('<li></li>').html('<span class="ansi-cyan-fg">==<span class="ansi-bright-cyan-fg">-<span class="ansi-bright-white-fg">- Trade Wars 2015 -</span>-</span>==</span>'))
    menu.append($('<li></li>').html('<a href="" data-attribute="play">T</a> - Play Trade Wars 2015'))
    menu.append($('<li></li>').html('<a href="" data-attribute="help">I</a> - Introduction &amp; Help'))
    //menu.append($('<li></li>').html('<a href="" data-attribute="settings">S</a> - View Game Settings'))
    menu.append($('<li></li>').html('<a href="" data-attribute="scores">H</a> - High scores'))
    menu.append($('<li></li>').html('<a href="/" data-attribute="quit">X</a> - Exit'))

    el.append('<br /><br />').append(menu)

  }

  var playGame = function() {
    showLogPrompt('today')
  }

  var showLogPrompt = function(period) {
    if (period == 'today') {
      el.html('Show today\'s log?' + showBooleanPrompt())
      booleanKey(showLogTimestampPrompt, showWelcomeScreen, false)
    }
  }

  var showLogTimestampPrompt = function() {
    el.append('<span class="ansi-magenta-fg">Include time/date stamp?' + showBooleanPrompt())
    booleanKey(function() { showLog('today', true) }, function() { showLog('today', false) }, false) 
  }

  var showLog = function(period, timestamps) {
    el.html('<span class="ansi-bright-blue-fg">  -=-=-=-=-=-=-=-=-=- <span class="ansi-bright-cyan-fg">Trade Wars</span> <span class="ansi-bright-red-fg">2015</span> -=-=-=-=-=-=-=-=-=-</span>')
    $.get('/log/', function(result) {
      if (result.length == 0)
        el.append('<br />No log entries today.')
      for (var i in result) {
        if (timestamps)
          el.append('<br />' + getLogDate(result[i].created_at))
        el.append('<br />' + result[i].message)
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      pressAnyKey(showWelcomeScreen)
    })
  }

  var showWelcomeScreen = function() {
    el.html('Initializing...<br /><br />')
    el.append(' &nbsp; &nbsp; &nbsp; Hello <span class="ansi-bright-cyan-fg">' + config.username + '</span>, welcome to:<br /><br />')
    el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <span class="ansi-bright-yellow-fg">Trade Wars 2015</span><br /><br />')
    el.append('(C) Copyright 1986 John Pritchett.  All rights reserved.<br />')
    el.append(' &nbsp; &nbsp; Brought to you by EIS<br />')
    el.append(' &nbsp; &nbsp; Written by Gary Martin, Mary Ann Martin and John Pritchett<br />')

    if (universe.user_has_trader) {
      if (universe.user_login_delay)
        pressAnyKey(getOutLoser)
      else
        pressAnyKey(showMessages)
    } else {
      pressAnyKey(newUser)
    }
  }

  var getOutLoser = function() {
    el.append('<br /><br /><span class="ansi-bright-red-fg ansi-bright-black-bg">You destroyed your own ship!</span><br />You must wait for <span class="ansi-bright-yellow-fg">' + universe.user_login_delay + '</span> day(s) to get back in.<br />')
    pressAnyKey(showUniverses)  
  }

  var newUser = function() {
    el.append('<br /><br />You were not found in the player database.<br />')
    el.append('<span class="ansi-bright-white-fg ansi-blue-bg">Would you like to start a new character in this game?  (Type <span class="ansi-bright-yellow-fg ansi-black-bg"><a href="" data-attribute="yes">Y</a></span> or <span class="ansi-bright-yellow-fg ansi-black-bg"><a href="" class="no">N</a></span>)&nbsp;</span>')
    booleanKey(newUserName, showUniverses, false)
  }

  var newUserName = function() {
    el.append('<br /><br /><span class="ansi-bright-yellow-fg">Great!</span> You\'re on your way to becoming a Galactic Power!<br /><br />')
    el.append('Notice: If you don\'t play for <span class="ansi-bright-yellow-fg">30</span> days, your ship<br />')
    el.append('and your assets will be removed to make room for someone else.<br /><br />')
    el.append('<span class="ansi-bright-cyan-fg">Do you wish to make up a new Alias for your Trader Name,<br />or would you rather use your BBS name of <span class="ansi-bright-yellow-fg">' + config.username + '</span>?<br />')
    el.append('<span class="ansi-bright-yellow-fg">Use <span class="ansi-magenta-fg">(</span><span class="ansi-green-fg"><a href="" class="ansi-green-fg" data-attribute="newname">N</a></span><span class="ansi-magenta-fg">)</span>ew Name or <span class="ansi-magenta-fg">(</span><span class="ansi-green-fg"><a href="" class="ansi-green-fg" data-attribute="bbsname">B</a></span><span class="ansi-magenta-fg">)</span>BS Name <span class="ansi-bright-cyan-fg">[B]<span> ?</span>')

    $(document).on('click.nameselect', '.newname', function(e) {
      e.preventDefault()
      $(document).off('.nameselect')
      newUserNewName()
    })

    $(document).on('click.nameselect', '.bbsname', function(e) {
      e.preventDefault()
      $(document).off('.nameselect')
      config.name = config.username
      newUserShipName()
    })

    $(document).on('keyup.nameselect', null, function(e) {
      switch (e.which) {
        case 110:
        case 78:
          // newname
          $(document).off('.nameselect')
          newUserNewName()
          break
        case 13:
        case 98:
        case 66:
          // bbsname
          $(document).off('.nameselect')
          config.name = config.username
          newUserShipName()
          break
      }
    })
  }

  var newUserNewName = function() {
    $('#newUserNewName').html('')
    el.append('<br /><br /><form id="newUserNewName"><div class="form-group"><label for="name"><span class="ansi-magenta-fg">What Alias do you want to use?</span></label><input type="text" class="form-control ansi-magenta-fg" id="name"></div></form>')
    $('#newUserNewName #name').focus()
    $(document).on('submit.newuser', '#newUserNewName', function(e) {
      e.preventDefault()
      $(document).off('.newuser')
      $('#newUserNewName #name').blur()
      config.name = $('<div />').text($('#newUserNewName #name').val()).html()
      // check server for availability
      $.post('/create/checkname', { 'name': config.name }, function(result) {
        if (result.status == 'available') {
          el.append('<br />That alias would look like this in the game:<br />')
          el.append('<span class="ansi-bright-yellow-fg">Commander ' + config.name + ' is attacking with 10,000 fighters!</span><br /><br />')
          el.append(config.name + ' <span class="ansi-magenta-fg">is what you want? (<a href="" class="ansi-magenta-fg" data-attribute="yes">Y</a>/<a href="" class="ansi-magenta-fg" data-attribute="no">N</a>)')
          $('#newUserNewName').replaceWith(' <span class="ansi-magenta-fg">' + config.name + '</span><br />')
          booleanKey(newUserShipName, newUserNewName)
        } else {
          el.append('Sorry, you cannot use the name ' + config.name + ' as it is already in use.')
          newUserNewName()
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
        newUserNewName()
      })
    })
  }

  var newUserCreate = function() {
    // create user account on server with config.name
    $.post('/create/', { 'name': config.name, 'initial_ship_manufacturer': config.initial_ship_manufacturer.id, 'initial_ship_name': config.initial_ship_name, 'initial_planet_class': config.initial_planet_type.id, 'initial_planet_name': config.initial_planet_name }, function(result) {
      if (result.status == 'ok')
        getSectorData(displayCurrentSector)
      else
        newUser()
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
      newUser()
    })
  }

  var newUserShipName = function() {
    $('#newUserShipName').html('')
    config.initial_ship_manufacturer = getRandom(config.manufacturers)
    el.append('<br /><br /><span class="ansi-bright-red-fg ansi-bright-black-bg">Your ship is being initialized.</span><br /><br />')
    el.append('<span class="ansi-bright-cyan-fg">You must now christen your new ' + config.initial_ship_manufacturer.name + ' ' + config.initial_ship.class + '</span><br />')
    el.append('<span class="ansi-bright-cyan-fg">Choose a name carefully as you will have it for a while!</span><br /><br />')
    el.append('<form id="newUserShipName"><div class="form-group"><label for="name"><span class="ansi-bright-cyan-fg">What do you want to name your ship? (30 letters)</span></label><input type="text" class="form-control ansi-yellow-fg" id="name"></div></form>')
    $('#newUserShipName #name').focus()
    $(document).on('submit.newuser', '#newUserShipName', function(e) {
      e.preventDefault()
      $(document).off('.newuser')
      $('#newUserShipName #name').blur()
      config.initial_ship_name = $('<div />').text($('#newUserShipName #name').val()).html()
      el.append('<br />' + config.initial_ship_name + ' <span class="ansi-bright-cyan-fg">is what you want? (<a href="" class="ansi-cyan-fg" data-attribute="yes">Y</a>/<a href="" class="ansi-cyan-fg" data-attribute="no">N</a>)</span>')
      $('#newUserShipName').replaceWith(' <span class="ansi-yellow-fg">' + config.initial_ship_name + '</span><br />')
      booleanKey(newUserPlanetName, newUserShipName)
    })
  }

  var newUserPlanetName = function() {
    config.initial_planet_type = getRandom(config.planet_types)
    el.append('<br /><br />You will be started with your very own home planet. It\'s your option<br />to abandon it or to keep it and try to build it into a powerful base<br />of your own.<br /><br />')
    el.append('<form id="newUserPlanetName"><div class="form-group"><label for="name"><span class="ansi-magenta-fg">What do you want to name your home planet? (Class <span class="ansi-bright-white-fg ansi-blue-bg">' + config.initial_planet_type.class + '</span>, ' + config.initial_planet_type.desc + ')</span></label><input type="text" class="form-control ansi-yellow-fg" id="name"></div></form>')
    $('#newUserPlanetName #name').focus()
    $(document).on('submit.newuser', '#newUserPlanetName', function(e) {
      e.preventDefault()
      $(document).off('.newuser')
      $('#newUserPlanetName #name').blur()
      config.initial_planet_name = $('<div />').text($('#newUserPlanetName #name').val()).html()
      $('#newUserPlanetName').replaceWith(' <span class="ansi-yellow-fg">' + config.initial_planet_name + '</span><br />')
      newUserCreate()
    })
  }

  var showMessages = function() {
    el.append('<br /><br />')
    el.append('Searching for messages received since your last time on<span class="ansi-yellow-fg">:</span><br />')
    el.append('No messages received.')
    pressAnyKey(showHazSect)
  }

  var showHazSect = function() {
    el.append('<br /><br />')
    el.append('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;Scanning for Hazardous Sectors you have marked to Avoid&gt;</span><br /><br />')
    el.append('<span class="ansi-red-fg">No Sectors are currently being avoided.</span>')
    showTurnsAvail()
  }

  var showTurnsAvail = function() {
    el.append('<br /><br />')
    el.append('<span class="ansi-yellow-fg">You have <span class="ansi-bright-yellow-fg">' + universe.turns_remaining + '</span> turns this Stardate.</span>')
    getSectorData(displayCurrentSector)
  }

  var getSectorData = function(nextFunction) {
    $.get('/sector/current/', function(data) {
      nextFunction(data)
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    })
  }

  var displayCurrentSector = function(data) {
    if (!data.ship) {
      el.append('<br /><br /><span class="ansi-bright-yellow-fg">You managed to destroy your ship your last time on.<br /><br /><span class="ansi-bright-red-fg ansi-bright-black-bg">Your ship is being initialized.</span><br />')
      createReplacementShip()
    } else if (data.planet) {
      displayPlanet(data)
    } else {
      if (data.sector.navhaz > 0)
        el.append('<br /><br /><span class="ansi-bright-red-fg ansi-bright-black-bg">WARNING! WARNING!</span> Space Debris/Asteroids narrowly avoided!')
      displaySector(data)
      displaySectorCommand(data)
    }
  }

  var displaySector = function(data, sector) {
    if (!sector) {
      el.append('<br />')
      sector = data.sector
    }
    el.append('<br /><span class="ansi-bright-green-fg">Sector</span> &nbsp;<span class="ansi-bright-yellow-fg">:</span> <span class="ansi-bright-cyan-fg">' + sector.number + '</span> in ' + (sector.cluster != '' ? '<span class="ansi-bright-green-fg">' + sector.cluster : '<span class="ansi-blue-fg">uncharted space') + (sector.explored == false ? ' <span class="ansi-bright-black-fg">(unexplored)' : '') + '.<br />')
    if (sector.explored == false) {
      sector.explored = true
      data.trader.explored.push(sector.number)
    }
    if (sector.beacon)
      el.append('<span class="ansi-magenta-fg">Beacon</span> &nbsp;<span class="ansi-bright-yellow-fg">:</span> <span class="ansi-red-fg">' + sector.beacon + '</span><br />')
    if (sector.port) {
      if (sector.port.destroyed == true)
        el.append('<span class="ansi-magenta-fg">Ports</span> &nbsp; <span class="ansi-bright-yellow-fg">:</span> <span class="ansi-bright-red-fg ansi-bright-black-bg"> &lt;=-DANGER-=&gt; </span> &nbsp;<span class="ansi-bright-yellow-fg">Scanners indicate massive debris and heavy<br />&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; radiation due to recent destruction of the<br />&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; StarPort that occupied this sector. Safety<br />&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; officer advices immediate retreat from this sector.</span><br />')
      else
        el.append('<span class="ansi-magenta-fg">Ports</span> &nbsp; <span class="ansi-bright-yellow-fg">:</span> <span class="ansi-bright-cyan-fg">' + sector.port.name + '</span><span class="ansi-bright-yellow-fg">,</span> <span class="ansi-magenta-fg">Class <span class="ansi-bright-cyan-fg">' + sector.port.class + '</span> (<span class="ansi-green-fg">' + resolvePortClass(sector.port.class) + '</span>)<br />')
    }
    if (sector.number == 1) {
      el.append('<span class="ansi-magenta-fg">Planets</span> <span class="ansi-bright-yellow-fg">:</span> (<span class="ansi-bright-yellow-fg">M</span>) Terra<br />')
    } else if (sector.planets.length > 0) {
      el.append('<span class="ansi-magenta-fg">Planets</span> <span class="ansi-bright-yellow-fg">:</span> ')
      for (var i in sector.planets) {
        if (i > 0)
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ')
        if (sector.planets[i].shielded)
          el.append('<span class="ansi-bright-red-fg">&lt;&lt;&lt;&lt;</span> (<span class="ansi-bright-yellow-fg">' + sector.planets[i].class + '</span>) <span class="ansi-blue-fg">' + sector.planets[i].name + '</span> <span class="ansi-bright-red-fg">&gt;&gt;&gt;&gt;</span> (Shielded)<br />')
        else
          el.append('(<span class="ansi-bright-yellow-fg">' + sector.planets[i].class + '</span>) ' + sector.planets[i].name + '<br />')
      }
    }
    if (sector.traders.length > 0) {
      el.append('<span class="ansi-yellow-fg">Traders</span> <span class="ansi-bright-yellow-fg">:</span> ')
      for (var i in sector.traders) {
        if (i > 0)
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ')
        el.append((sector.traders[i].trader.alignment >= 0 ? '<span class="ansi-bright-cyan-fg">' : '<span class="ansi-red-fg">') + resolveTitle(sector.traders[i].trader.experience, sector.traders[i].trader.alignment) + ' ' + sector.traders[i].trader.name + '</span><span class="ansi-bright-yellow-fg">,</span> w/ <span class="ansi-bright-yellow-fg">' + sector.traders[i].fighters + '</span> ftrs<span class="ansi-bright-yellow-fg">,</span><br /> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;in <span class="ansi-cyan-fg">' + sector.traders[i].name + '</span> (' + sector.traders[i].manufacturer.name + ' ' + sector.traders[i].type.class + ')<br />')
      }
    }
    if (sector.ships.length > 0) {
      el.append('<span class="ansi-yellow-fg">Ships</span> &nbsp; <span class="ansi-bright-yellow-fg">:</span> ')
      for (var i in sector.ships) {
        if (i > 0)
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ')
        el.append('<span class="ansi-bright-cyan-fg">' + sector.ships[i].name + '</span> <span class="ansi-magenta-fg">[' + (sector.ships[i].trader == null ? '<span class="ansi-bright-red-fg">Abandoned</span>' : '<span class="ansi-red-fg">Owned by</span>') + ']' + (sector.ships[i].trader != null ? ' ' + sector.ships[i].trader.name : '') + '</span><span class="ansi-bright-yellow-fg">,</span> w/ <span class="ansi-bright-yellow-fg">' + sector.ships[i].fighters + '</span> ftrs<span class="ansi-bright-yellow-fg">,</span><br /> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;(' + sector.ships[i].manufacturer.name + ' ' + sector.ships[i].type.class + ')<br />')
      }
    }
    if (sector.fighters)
      el.append('<span class="ansi-magenta-fg">Fighters</span><span class="ansi-bright-yellow-fg">:</span> <span class="ansi-bright-cyan-fg">' + sector.fighters.quantity + '</span> ' + (sector.fighters.trader.id == data.trader.id ? '<span class="ansi-magenta-fg">(yours)</span>' : '<span class="ansi-bright-yellow-fg">(belong to ' + sector.fighters.trader.name + ')</span>') + ' <span class="ansi-yellow-fg">[' + resolveFighterMode(sector.fighters.mode) + ']</span><br />')
    if (sector.navhaz > 0)
      el.append('<span class="ansi-magenta-fg">NavHaz</span> &nbsp;<span class="ansi-bright-yellow-fg">:</span> <span class="ansi-bright-red-fg ansi-bright-black-bg">' + sector.navhaz + (sector.navhaz < 10 ? ' ' : '') + '</span><span class="ansi-magenta-fg">%</span> <span class="ansi-blue-fg">(<span class="ansi-cyan-fg">Space Debris/Asteroids</span>)</span><br />')
    if (sector.mines.length > 0) {
      el.append('<span class="ansi-magenta-fg">Mines</span> &nbsp <span class="ansi-bright-yellow-fg">:</span> ')
      for (var i in sector.mines) {
        if (i > 0)
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ')
        el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">' + sector.mines[i].quantity + (sector.mines[i].quantity < 10 ? ' ' : '') + '</span> <span class="ansi-magenta-fg">(<span class="ansi-green-fg">Type <span class="ansi-bright-yellow-fg">' + sector.mines[i].type + '</span> ' + resolveMineType(sector.mines[i].type) + '</span>)</span> ' + (sector.mines[i].trader.id == data.trader.id ? '<span class="ansi-magenta-fg">(yours)</span>' : '<span class="ansi-bright-yellow-fg">(belong to ' + sector.mines[i].trader.name + ')</span>') + '<br />')
      }
    }
    if (data.sector.number == sector.number)
      el.append('<span class="ansi-bright-green-fg">Warps to Sector(s)</span> <span class="ansi-bright-yellow-fg">:</span> ' + formatWarpsList(sector.warps) + '<br />')
    window.scrollTo(0, document.body.scrollHeight)
  }

  var displaySectorCommand = function(data) {
    el.append(sectorPrompt.replace('#SECTORNUMBER', data.sector.number))
    menuEventHandler([
      { 'nextFunction': function() { el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Re-Display&gt;</span>'); displaySector(data); displaySectorCommand(data); }, 'attribute': 'display', 'key': 'D'.charCodeAt() },
      { 'nextFunction': function() { el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Re-Display&gt;</span>'); displaySector(data); displaySectorCommand(data); }, 'attribute': 'display', 'key': 13 },
      (data.sector.number == 1 ? { 'nextFunction': landOnTerra, 'nextFunctionArgs': [ data ], 'attribute': 'land', 'key': 'L'.charCodeAt() } : { 'nextFunction': landOnPlanet, 'nextFunctionArgs': [ data ], 'attribute': 'land', 'key': 'L'.charCodeAt() }),
      { 'nextFunction': sectorScan, 'nextFunctionArgs': [ data ], 'attribute': 'scan', 'key': 'S'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': portDock, 'nextFunctionArgs': [ data ], 'attribute': 'dock', 'key': 'P'.charCodeAt() },
      { 'nextFunction': moveToSector, 'nextFunctionArgs': [ data ], 'failure': true, 'max': universe.sectors },
      { 'nextFunction': sectorMove, 'nextFunctionArgs': [ data ], 'attribute': 'move', 'key': 'M'.charCodeAt() },
      { 'nextFunction': releaseBeacon, 'nextFunctionArgs': [ data ], 'attribute': 'beacon', 'key': 'R'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': information, 'nextFunctionArgs': [ data, displaySectorCommand ], 'attribute': 'shipinfo', 'key': 'I'.charCodeAt() },
      { 'nextFunction': genesis, 'nextFunctionArgs': [ data ], 'attribute': 'genesis', 'key': 'U'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': jettison, 'nextFunctionArgs': [ data ], 'attribute': 'jettison', 'key': 'J'.charCodeAt() },
      { 'nextFunction': attack, 'nextFunctionArgs': [ data ], 'attribute': 'attack', 'key': 'A'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': sectorHelp, 'nextFunctionArgs': [ data ], 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': sectorMenu, 'nextFunctionArgs': [ data ], 'attribute': 'menu', 'key': 63, 'noreset': true },
      { 'nextFunction': sectorDocs, 'nextFunctionArgs': [ data ], 'attribute': 'docs', 'key': 'Z'.charCodeAt() },
      { 'nextFunction': viewStatus, 'nextFunctionArgs': [ data ], 'attribute': 'status', 'key': 'V'.charCodeAt() },
      { 'nextFunction': displayComputerCommand, 'nextFunctionArgs': [ data ], 'attribute': 'computer', 'key': 'C'.charCodeAt(), 'addbreak': true }
    ])
  }

  var attack = function(data, target, skipped) {

    if (!skipped)
      skipped = []

    if (!target) {

      if (skipped.length == 0)
        el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">&lt;Attack&gt;</span><br />')

      if (data.sector.beacon == '' && 
          data.sector.traders.length == 0 &&
          data.sector.ships.length == 0 &&
          skipped.length == 0) {

        el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">There is nothing here to attack.</span><br />')
        displaySectorCommand(data)

      } else if (data.ship.fighters == 0) {

        el.append('<span class="ansi-bright-yellow-fg">You don\'t have any fighters.</span><br />')
        displaySectorCommand(data)

      } else {

       if (data.sector.beacon != '' && data.sector.cluster !== 'The Federation' && skipped.indexOf('beacon') == -1) {
          el.append('<span class="ansi-magenta-fg">Destroy the Marker Beacon here? </span>')
          skipped.push('beacon')
          booleanKey(function() { destroyBeacon(data, skipped) }, function() { attack(data, null, skipped) }, false)
          return
        }

        if (data.sector.ships.length > 0) {
          for (var i in data.sector.ships) {
            if (skipped.map(function(e) { return e.ship }).indexOf(data.sector.ships[i].id) == -1) {
              if (data.sector.ships[i].trader == null)
                el.append('Attack <span class="ansi-bright-red-fg">Abandoned</span> ' + data.sector.ships[i].type.class + ' <span class="ansi-bright-yellow-fg">(<span class="ansi-bright-cyan-fg">' + addCommas(data.ship.fighters) + '<span class="ansi-bright-red-fg">-</span>' + data.sector.ships[i].fighters + '</span>)</span> ' + showBooleanPrompt(false))
              else
                el.append('Attack <span class="ansi-bright-cyan-fg">' + data.sector.ships[i].trader.name + '</span>\'s unmanned ' + data.sector.ships[i].type.class + ' <span class="ansi-bright-yellow-fg">(<span class="ansi-bright-cyan-fg">' + addCommas(data.ship.fighters) + '<span class="ansi-bright-red-fg">-</span>' + data.sector.ships[i].fighters + '</span>)</span> ' + showBooleanPrompt(false))
              skipped.push({'ship': data.sector.ships[i].id})
              booleanKey(function() { attackShip(data, data.sector.ships[i].id, null) }, function() { attack(data, target, skipped) }, false)
              return
            }
          }

        }

        if (data.sector.traders.length > 0) {
          for (var i in data.sector.traders) {
            if (skipped.map(function(e) { return e.trader }).indexOf(data.sector.traders[i].id) == -1) {
              el.append('Attack <span class="ansi-bright-' + (data.sector.traders[i].trader.alignment >= 0 ? 'cyan' : 'red') + '-fg">' + data.sector.traders[i].trader.name + '</span>\'s ' + data.sector.traders[i].type.class + ' <span class="ansi-bright-yellow-fg">(<span class="ansi-bright-cyan-fg">' + addCommas(data.ship.fighters) + '<span class="ansi-bright-red-fg">-</span>' + data.sector.traders[i].fighters + '</span>)</span> ' + showBooleanPrompt(false))
              skipped.push({'trader': data.sector.traders[i].id})
              booleanKey(function() { attackShip(data, data.sector.traders[i].id, data.sector.traders[i].trader.id) }, function() { attack(data, target, skipped) }, false)
              return
            }
          }
        }

        displaySectorCommand(data)

      }

    } else {

    }
  }

  var attackShip = function(data, ship_id, trader_id, fighters) {
    if (!fighters) {
      el.append('<span class="ansi-magenta-fg show-entry">How many fighters do you wish to use (<span class="ansi-bright-yellow-fg">0 to ' + addCommas((data.ship.fighters > data.ship.type.max_fighters_per_attack ? data.ship.type.max_fighters_per_attack : data.ship.fighters)) + '</span>) <span class="ansi-bright-yellow-fg">[0]</span>? </span>')
      menuEventHandler([
        { 'nextFunction': displaySectorCommand, 'nextFunctionArgs': [ data ], 'key': 13 },
        { 'nextFunction': attackShip, 'nextFunctionArgs': [ data, ship_id, trader_id ], 'failure': true, 'max': (data.ship.fighters > data.ship.type.max_fighters_per_attack ? data.ship.type.max_fighters_per_attack : data.ship.fighters), 'addbreak': true }
      ])
    } else {

      if (fighters > data.ship.fighters) {
        el.append('You do not have that many fighters.')
        return
      }

      var target
      if (trader_id !== null)
        target = data.sector.traders.filter(function(entry) { return entry.id === ship_id })[0]
      else
        target = data.sector.ships.filter(function(entry) { return entry.id === ship_id })[0]

      var random = Math.random() * 1.75 + .5
      var defense = Math.floor((target.shields + target.fighters) * target.type.defensive_odds)
      console.log('defense.. shields: ' + target.shields + ', fighters: ' + target.fighters + ', odds: ' + target.type.defensive_odds + ', total: ' + defense)
      var offense = Math.floor(fighters * data.ship.type.offensive_odds * random)
      console.log('offense.. fighters: ' + fighters + ', odds: ' + data.ship.type.offensive_odds + ', random: ' + random + ', total: ' + offense)

      if (data.sector.cluster == 'The Federation' && (!target.trader.alignment || target.trader.alignment >= 0)) {
        el.append('<br /><span class="ansi-bright-cyan-fg">A blaring message comes screaming across your sub-space radio:</span><br /><br />')
        el.append('<span class="ansi-bright-yellow-fg">"This is Captain Zyrain, of the StarShip Intrepid, your hostile<br />&nbsp;act has been noticed and I feel that I must inform you of the dire<br />&nbsp;consequences that you are asking for.  No space piracy will take place<br />&nbsp;in Federation space while I am commanding the Intrepid!<br /><br />&nbsp;Intrepid out..."</span><br /><br /><br />')
        el.append('<span class="ansi-bright-cyan-fg">You notice the un-Godly bulk of the Intrepid looming into view and think<br />twice about your aggressive actions.</span><br />')
        displaySectorCommand(data)
        return
      }

      if (target.shields > 0)
        el.append('<span class="ansi-bright-cyan-fg">Your fighters encounter a powerful force-shield around the enemy ship!<br />')

      // TODO handle exp/align increases / decreases from attacking / destroying players
      // TODO handle annoucing when player is promoted/demoted

      if (offense > defense) {
        $.post('/ship/', { 'task': 'attack', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'target_id': target.id, 'fighters': fighters, 'offense': offense, 'defense': defense, 'random': random }, function(result) {
          var controller = AnsiLove.animate('/ANSI/SHPBLUP.ANS', function(canvas, sauce) {
            el.html(canvas)
            controller.play(14400, function() {
              var figslost = Math.floor(defense / random)
              data.ship.fighters -= figslost
              if (data.sector.cluster != 'The Federation')
                data.sector.navhaz = (data.sector.navhaz + 1 > 100 ? 100 : data.sector.navhaz + 1)
              el.append('<br />You lost <span class="ansi-bright-yellow-fg">' + addCommas(figslost) + '</span> fighter(s), <span class="ansi-bright-yellow-fg">' + addCommas(data.ship.fighters) + '</span> remain.<br />')

              if (result.experience && target.alignment < 0)
                el.append('For defeating this villian you receive <span class="ansi-bright-yellow-fg">' + result.experience + '</span> experience point(s).<br />')

              // TODO handle promotion

              if (result.alignment)
                el.append('and your alignment went ' + (result.alignment >= 0 ? 'up' : 'down') + ' by <span class="ansi-bright-yellow-fg">' + result.alignment + '</span> point(s).<br />')

              if (result.credits)
                el.append('<span class="ansi-magenta-fg">You find <span class="ansi-bright-yellow-fg">' + target.trader.name + '\'s</span> credits worth <span class="ansi-bright-cyan-fg">' + result.credits + '</span>!<br />')

              el.append('<span class="ansi-bright-cyan-fg">Excellent, you have obliterated the target!<br />...In fact, TOO excellent! You can\'t salvage anything from it!<br />')

              if (result.oath)
                el.append(result.oath + '<br />')

              if (result.podded)
                el.append('An Escape Pod warps out of this sector!<br />')

              var indexes = $.map(data.sector.ships, function(obj, index) {
                if (obj.id == ship_id)
                  return index
              })
              data.sector.ships.splice(indexes[0], 1)
              displaySectorCommand(data)
            })
          }, { 'bits': 9, '2x': (retina ? 1 : 0) })
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
          displaySectorCommand(data)
        })
      } else if (offense == defense) {
        $.post('/ship/', { 'task': 'attack', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'target_id': target.id, 'fighters': fighters, 'offense': offense, 'defense': defense, 'random': random }, function(result) {
          data.ship.fighters -= fighters
          target.fighters = 0
          target.shields = 0
          target.user_id = data.trader.user_id
          target.trader_id = data.trader.id
          target.password = ''

          el.append('<br />You lost <span class="ansi-bright-yellow-fg">' + addCommas(fighters) + '</span> fighter(s), <span class="ansi-bright-yellow-fg">' + addCommas(data.ship.fighters) + '</span> remain.<br />')

          if (result.experience && target.alignment < 0)
            el.append('For defeating this villian you receive <span class="ansi-bright-yellow-fg">' + result.experience + '</span> experience point(s).<br />')

          // TODO handle promotion

          if (result.alignment)
            el.append('and your alignment went ' + (result.alignment >= 0 ? 'up' : 'down') + ' by <span class="ansi-bright-yellow-fg">' + result.alignment + '</span> point(s).<br />')

          if (result.credits)
            el.append('<span class="ansi-magenta-fg">You find <span class="ansi-bright-yellow-fg">' + target.trader.name + '\'s</span> credits worth <span class="ansi-bright-cyan-fg">' + result.credits + '</span>!<br />')

          if (result.oath)
            el.append(result.oath + '<br />')

          if (result.podded)
            el.append('An Escape Pod warps out of this sector!<br />')

          el.append('The ship is abandoned! Its all yours!<br />')
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          displaySectorCommand(data)
        })
      } else {
        $.post('/ship/', { 'task': 'attack', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'target_id': target.id, 'fighters': fighters, 'offense': offense, 'defense': defense, 'random': random }, function(result) {
          data.ship.fighters -= fighters
          target.fighters -= offense
          el.append('<br />You lost <span class="ansi-bright-yellow-fg">' + addCommas(fighters) + '</span> fighter(s), <span class="ansi-bright-yellow-fg">' + addCommas(data.ship.fighters) + '</span> remain.<br />')
          el.append('You destroyed <span class="ansi-bright-yellow-fg">' + addCommas(offense) + '</span> fighter(s), <span class="ansi-bright-yellow-fg">' + addCommas(target.fighters) + '</span> remain.<br />')
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          displaySectorCommand(data)
        })
      }
    }
  }

  var destroyBeacon = function(data, skipped) {
    $.post('/sector/', { 'task': 'destroybeacon', 'sector_id': data.sector.id, 'ship_id': data.ship.id }, function(result) {
      el.append('You launch a fighter which quickly destroys the Beacon (and itself)<br />')
      data.ship.fighters -= 1
      data.sector.beacon = ''
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      attack(data, null, skipped)
    })
  }

  var releaseBeacon = function(data, confirmed) {
    if (!confirmed) {
      if (data.ship.beacons == 0) {
        el.append('You do not have any Marker Beacons.<br />')
        displaySectorCommand(data)
      } else if (data.sector.cluster == 'The Federation') {
        el.append('The Federation does not allow beacons in their space.<br />')
        displaySectorCommand(data)
      } else {
        el.append('<span class="ansi-magenta-fg">Do you wish to launch a Marker Beacon here?</span> ' + showBooleanPrompt(false))
        booleanKey(function() { releaseBeacon(data, true) }, function() { displaySectorCommand(data) }, false)
      }
    } else {
      el.append('<form id="beacon"><div class="form-group"><label for="message">What message should be on this beacon? (41 chars)</label><input type="text" class="form-control" id="message"></div></form>')
      $('#beacon #message').focus()
      $(document).on('submit.beacon', '#beacon', function(e) {
        e.preventDefault()
        $(document).off('.beacon')
        $('#beacon #message').blur()
        var message = $('<div />').text($('#beacon #message').val()).html()
        $.post('/sector/', { 'task': 'beacon', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'message': $('#beacon #message').val() }, function(result) {
          $('#beacon').replaceWith('What message should be on this beacon? (41 chars)<br />-> ' + message + '<br />')
          if (result.status == 'ok') {
            el.append('Beacon Launched!<br />')
            if (data.sector.beacon != '') {
              el.append('Your beacon collides with the other one that was already here and both detonate!<br />')
              data.sector.beacon = '' 
            } else {
              data.sector.beacon = message
            }
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          displaySectorCommand(data)
        })
      })
    }
  }

  var displayComputerCommand = function(data) {
    el.append(computerPrompt.replace('#SECTORNUMBER', data.sector.number))
    menuEventHandler([
      { 'nextFunction': coursePlotter, 'nextFunctionArgs': [ data ], 'attribute': 'plotter', 'key': 'F'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': sectorWarps, 'nextFunctionArgs': [ data ], 'attribute': 'warps', 'key': 'I'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': knownUniverse, 'nextFunctionArgs': [ data ], 'attribute': 'explored', 'key': 'K'.charCodeAt() },
      { 'nextFunction': portReport, 'nextFunctionArgs': [ data ], 'attribute': 'report', 'key': 'R'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': computerQuit, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': announcement, 'nextFunctionArgs': [ data ], 'attribute': 'announce', 'key': 'A'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipSettings, 'nextFunctionArgs': [ data ], 'attribute': 'shipsettings', 'key': 'O'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipTime, 'nextFunctionArgs': [ data ], 'attribute': 'time', 'key': 'T'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipCatalog, 'nextFunctionArgs': [ data ], 'attribute': 'shipcatalog', 'key': 'C'.charCodeAt() },
      { 'nextFunction': searchLog, 'nextFunctionArgs': [ data ], 'attribute': 'dailylog', 'key': 'D'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': showEvilClasses, 'nextFunctionArgs': [ data ], 'attribute': 'evilclasses', 'key': 'E'.charCodeAt(), 'addbread': true },
      { 'nextFunction': showGoodClasses, 'nextFunctionArgs': [ data ], 'attribute': 'goodclasses', 'key': 'G'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': planetSpecs, 'nextFunctionArgs': [ data ], 'attribute': 'planetspecs', 'key': 'J'.charCodeAt() },
      { 'nextFunction': listTraders, 'nextFunctionArgs': [ data ], 'attribute': 'listtraders', 'key': 'L'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': listPlanets, 'nextFunctionArgs': [ data, 'personal' ], 'attribute': 'planets', 'key': 'Y'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': listShips, 'nextFunctionArgs': [ data ], 'attribute': 'activeships', 'key': 'Z'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': function() { el.append('<br /><div class="row"><div class="col-xs-9 text-center">' + data.ship.type.class + '</div></div><br />'); viewShipTable(data.ship.type); displayComputerCommand(data) }, 'attribute': 'scan', 'key': ';'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': computerHelp, 'nextFunctionArgs': [ data ], 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': computerMenu, 'nextFunctionArgs': [ data ], 'attribute': 'menu', 'key': 63, 'noreset': true },
    ])
  }

  var coursePlotter = function(data, from, to) {
    if (!from) {
      el.append('<span class="ansi-magenta-fg show-entry">What is the starting sector <span class="ansi-bright-cyan-fg">[' + data.sector.number + ']</span> ? </span>')
      menuEventHandler([
        { 'nextFunction': coursePlotter, 'nextFunctionArgs': [ data, data.sector.number ], 'key': 13, 'addbreak': true },
        { 'nextFunction': coursePlotter, 'nextFunctionArgs': [ data ], 'failure': true, 'max': universe.sectors, 'addbreak': true }
      ])
    } else if (!to) {
      el.append('<span class="ansi-magenta-fg show-entry">What is the destination sector? </span>')
      menuEventHandler([
        { 'nextFunction': coursePlotter, 'nextFunctionArgs': [ data, from ], 'failure': true, 'max': universe.sectors, 'addbreak': true }
      ])
    } else {
      el.append('<br /><span class="ansi-bright-blue-fg ansi-bright-black-bg processing">Computing shortest path...</span>')
      $.post('/sector/', { 'task': 'getpath', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'source': from, 'destination': to }, function(result) {
        $('.processing').removeClass('ansi-bright-black-bg processing').html('Computed.')
        var nextHop = ''
        el.append('<br /><br />The shortest path <span class="ansi-magenta-fg">(' + (result.length - 1) + ' hops, ' + ((result.length - 1) * data.ship.type.turns_per_warp) + ' turns)</span> from sector <span class="ansi-bright-yellow-fg">' + from + '</span> to sector <span class="ansi-bright-yellow-fg">' + to + '</span> is<span class="ansi-bright-yellow-fg">:</span><br />')
        for (var i in result) {
          if (i == 0)
            el.append('<span class="ansi-yellow-fg">' + result[i] + '</span>')
          else
            el.append((data.trader.explored.indexOf(result[i]) > -1 ? result[i] : '<span class="ansi-bright-red-fg">(' + result[i] + ')</span>'))
          if (i < result.length - 1)
            el.append(' <span class="ansi-bright-yellow-fg">&gt;</span> ')
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
      }).always(function() {
        el.append('<br /><br />')
        displayComputerCommand(data)
      })
    }
  }

  var sectorWarps = function(data, sector) {
    if (!sector) {
      el.append('<span class="ansi-magenta-fg show-entry">What sector do you wish to examine? [<span class="ansi-bright-yellow-fg">' + data.sector.number + '</span>] </span>')
      menuEventHandler([
        { 'nextFunction': sectorWarps, 'nextFunctionArgs': [ data, data.sector.number ], 'key': 13, 'addbreak': true },
        { 'nextFunction': sectorWarps, 'nextFunctionArgs': [ data ], 'failure': true, 'max': universe.sectors, 'addbreak': true }
      ])
    } else {
      if (data.trader.explored.indexOf(sector) == -1) {
        el.append('You have never visited sector <span class="ansi-bright-yellow-fg">' + sector + '</span>.<br />')
        displayComputerCommand(data)
      } else {
        $.post('/sector/', { 'task': 'getwarps', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'sector': sector }, function(result) {
          el.append('Sector <span class="ansi-bright-yellow-fg">' + sector + '</span> has warps to sector(s) <span class="ansi-bright-yellow-fg">:</span> ')
          for (var i in result.sort(function(a, b) { return a - b })) {
            el.append('<span class="ansi-bright-cyan-fg">' + result[i] + '</span>')
            if (i < result.length - 1)
              el.append(' - ')
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          el.append('<br />')
          displayComputerCommand(data)
        })
      }
    }
  }

  var portReport = function(data, sector) {
    if (!sector) {
      el.append('<span class="ansi-magenta-fg show-entry">What sector is the port in? <span class="ansi-bright-yellow-fg">[' + data.sector.number + ']</span> </span>')
      menuEventHandler([
        { 'nextFunction': portReport, 'nextFunctionArgs': [ data, data.sector.number ], 'key': 13, 'addbreak': true },
        { 'nextFunction': portReport, 'nextFunctionArgs': [ data ], 'failure': true, 'max': universe.sectors, 'addbreak': true }
      ])
    } else {
      if (data.trader.explored.indexOf(sector) == -1) {
        el.append('You have never visited sector <span class="ansi-bright-yellow-fg">' + sector + '</span>.<br />')
        displayComputerCommand(data)
      } else {
        $.post('/port/', { 'task': 'report', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'sector': sector }, function(result) {
          el.append('<br /><span class="ansi-bright-yellow-fg">Commerce report for <span class="ansi-bright-cyan-fg">' + result.name + '</span>: ' + getPortReportDate() + '</span><br /><br />')
          var table = $('<table>').addClass('table table-condensed port')
          table.append($('<thead>').addClass('ansi-green-fg').html('<tr><td>Items</td><td>Status</td><td>Trading</td><td>% of max</td><td>OnBoard</td></tr>'))
          table.append($('<tr>').html('<td class="ansi-bright-cyan-fg" style="text-align: left">Fuel Ore</td><td class="ansi-green-fg" style="text-align: left">' + (resolvePortClass(result.class, true).charAt(0) == 'S' ? 'Selling' : 'Buying') + '</td><td class="ansi-bright-cyan-fg">' + (resolvePortClass(result.class, true).charAt(0) == 'S' ? result.fuel : (result.fuel_prod * 10 - result.fuel)) + '</td><td class="ansi-green-fg">' + (resolvePortClass(result.class, true).charAt(0) == 'S' ? Math.floor(result.fuel / (result.fuel_prod * 10) * 100) : Math.floor((result.fuel_prod * 10 - result.fuel) / (result.fuel_prod * 10) * 100)) + '<span class="ansi-bright-red-fg">%</span></td><td class="ansi-cyan-fg">' + data.ship.fuel + '</td>'))
          table.append($('<tr>').html('<td class="ansi-bright-cyan-fg" style="text-align: left">Organics</td><td class="ansi-green-fg" style="text-align: left">' + (resolvePortClass(result.class, true).charAt(1) == 'S' ? 'Selling' : 'Buying') + '</td><td class="ansi-bright-cyan-fg">' + (resolvePortClass(result.class, true).charAt(1) == 'S' ? result.organics : (result.organics_prod * 10 - result.organics)) + '</td><td class="ansi-green-fg">' + (resolvePortClass(result.class, true).charAt(1) == 'S' ? Math.floor(result.organics / (result.organics_prod * 10) * 100) : Math.floor((result.organics_prod * 10 - result.organics) / (result.organics_prod * 10) * 100)) + '<span class="ansi-bright-red-fg">%</span></td><td class="ansi-cyan-fg">' + data.ship.organics + '</td>'))
          table.append($('<tr>').html('<td class="ansi-bright-cyan-fg" style="text-align: left">Equipment</td><td class="ansi-green-fg" style="text-align: left">' + (resolvePortClass(result.class, true).charAt(2) == 'S' ? 'Selling' : 'Buying') + '</td><td class="ansi-bright-cyan-fg">' + (resolvePortClass(result.class, true).charAt(2) == 'S' ? result.equipment : (result.equipment_prod * 10 - result.equipment)) + '</td><td class="ansi-green-fg">' + (resolvePortClass(result.class, true).charAt(2) == 'S' ? Math.floor(result.equipment / (result.equipment_prod * 10) * 100) : Math.floor((result.equipment_prod * 10 - result.equipment) / (result.equipment_prod * 10) * 100)) + '<span class="ansi-bright-red-fg">%</span></td><td class="ansi-cyan-fg">' + data.ship.equipment + '</td>'))
          var tableContainerRow = $('<div>').addClass('row')
          var tableContainer = $('<div>').addClass('col-xs-6')
          tableContainer.append(table)
          tableContainerRow.append(tableContainer)
          el.append(tableContainerRow)
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          displayComputerCommand(data)
        })
      }
    }
  }

  var announcement = function(data) {
    el.html('<form id="announcement"><div class="form-group"><label for="announcement"><span class="ansi-magenta-fg">Enter your general announcement now <span class="ansi-bright-yellow-fg">[155 chars]</span></span></label><input type="text" class="form-control ansi-white-fg" id="announce"></div></form>')
    $('#annoucement #announce').focus()
    $(document).on('submit.announce', '#announcement', function(e) {
      e.preventDefault()
      $(document).off('.announce')
      $('#announcement #announce').blur()
      var announcement = $('<div />').text($('#announcement #announce').val()).html()
      el.append('<br /><span class="ansi-bright-cyan-fg">--------------------------------------------------------------------------</span><br />' + announcement + '<br /><span class="ansi-bright-cyan-fg">--------------------------------------------------------------------------</span><br />')
      el.append('<br /><span class="ansi-magenta-fg">Is this what you want to send universally? ')
      $('#announcement').replaceWith('<span class="ansi-magenta-fg">Enter your general announcement now <span class="ansi-bright-yellow-fg">[155 chars]</span></span><br /><span class="ansi-white-fg">' + announcement + '</span><br />')
      booleanKey(function() { postAnnouncement(data, announcement) }, function() { displayComputerCommand(data) }, false) 
    })
  }

  var postAnnouncement = function(data, announcement) {
    $.post('/log/', { 'task': 'postannouncement', 'announcement': announcement }, function(result) {
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      displayComputerCommand(data)
    })
  }

  var shipSettings = function(data) {
    el.html('Your Ship\'s password is the only protection you have to keep<br />unauthorized personel from transporting onto your ship. Choose<br />a password that will not be guessed and be very careful who you<br />tell it to. Your last password was : <span class="ansi-bright-cyan-fg">' + (!data.ship.password ? '' : data.ship.password) + '</span><br /><br />')
    el.append('<form id="shippassword"><div class="form-group"><label for="password"><span class="ansi-magenta-fg">Enter a new password <span class="ansi-yellow-fg">(up to 10 chars)</span> : </span></label><input type="text" class="form-control ansi-bright-white-fg ansi-blue-bg" id="password" style="text-transform: uppercase"></div></form>')
    $('#shippassword #password').focus()
    $(document).on('submit.settings', '#shippassword', function(e) {
      e.preventDefault()
      $(document).off('.settings')
      $('#shippassword #password').blur()
      var password = $('<div />').text($('#shippassword #password').val()).html().toUpperCase()
      $.post('/ship/', { 'task': 'changepassword', 'ship_id': data.ship.id, 'ship_password': $('#shippassword #password').val().toUpperCase() }, function(result) {
        $('#shippassword').replaceWith('<span class="ansi-magenta-fg">Enter a new password <span class="ansi-yellow-fg">(up to 10 chars)</span> : </span><span class="ansi-bright-white-fg ansi-blue-bg">' + password + '</span><br />')
        if (result.status == 'ok') {
          el.append('<span class="ansi-bright-cyan-fg">Password changed to : <span class="ansi-bright-red-fg ansi-bright-black-bg">' + password + '</span></span><br />')
          data.ship.password = password
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
      }).always(function() {
        displayComputerCommand(data)
      })
    })
  }

  var shipTime = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">' + getPortReportDate() + '</span><br /><br />')
    displayComputerCommand(data)
  }

  var searchLog = function(data) {
    el.html('Enter the beginning date you wish to read from. Today is <span class="ansi-bright-yellow-fg">' + getDate(new Date()) + '</span><br />Use the format MM/DD/YY ie 04/01/02, or CR for all of the history.<br />Or you may enter any text to search for if it is 8 chars or less.<br />')
    el.append('<form id="searchlog"><div class="form-group"><label for="search"><span class="ansi-magenta-fg">Input search date : </span></label><input type="text" class="form-control ansi-magenta-fg" id="search"></div></form>')
    $('#searchlog #search').focus()
    $(document).on('submit.search', '#searchlog', function(e) {
      e.preventDefault()
      $(document).off('.search')
      $('#searchlog #search').blur()
      var query = $('<div />').text($('#searchlog #search').val()).html()
      $.get('/log/search', { 'q': $('#searchlog #search').val() }, function(result) {
        el.append('<br /><span class="ansi-bright-cyan-fg">Searching for the first occurence of <span class="ansi-bright-yellow-fg">"<span class="ansi-green-fg">' + query + '</span>"</span>.</span><br /><br />')
        el.append('<span class="ansi-magenta-fg">Include time/date stamp?' + showBooleanPrompt())
        $('#searchlog').replaceWith(' <span class="ansi-magenta-fg">Input search date : ' + query + '</span><br />')
        booleanKey(function() { searchLogResults(data, result, true) }, function() { searchLogResults(data, result, false) }, false) 
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
      })
    })
  }

  var searchLogResults = function(data, result, timestamps) {
    el.html('<span class="ansi-bright-blue-fg">  -=-=-=-=-=-=-=-=-=- <span class="ansi-bright-cyan-fg">Trade Wars</span> <span class="ansi-bright-red-fg">2015</span> -=-=-=-=-=-=-=-=-=-</span>')
    if (result.length == 0)
      el.append('<br />No log entries today.')
    for (var i in result) {
      if (timestamps)
        el.append('<br />' + getLogDate(result[i].created_at))
      el.append('<br />' + result[i].message)
    }
    el.append('<br />')
    displayComputerCommand(data)
  }

  var listTraders = function(data) {
    el.append('<br /><span class="ansi-magenta-fg">List by rank (<a href="" class="ansi-bright-yellow-fg" data-attribute="titles">T</a>)itles or by rank (<a href="" class="ansi-bright-yellow-fg" data-attribute="values">V</a>)alues (T,V, or Q to quit) ?')
    menuEventHandler([
      { 'nextFunction': displayComputerCommand, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': showScoresByValue, 'nextFunctionArgs': [ function() { displayComputerCommand(data) }, data.trader.id ], 'attribute': 'values', 'key': 'V'.charCodeAt() },
      { 'nextFunction': showScoresByTitle, 'nextFunctionArgs': [ function() { displayComputerCommand(data) }, data.trader.id ], 'attribute': 'titles', 'key': 'T'.charCodeAt() },

    ])
  }

  var listShips = function(data) {
    el.append('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;Active Ship Scan&gt;</span><br />')
    el.append('<div class="row"><div class="col-xs-9 ansi-bright-cyan-fg text-center">--&lt; Available Ship Scan &gt;--</div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row ansi-magenta-fg"><div class="col-xs-1 text-right">Ship</div><div class="col-xs-1 text-right">Sect</div><div class="col-xs-4">Name</div><div class="col-xs-1 text-right">Fighters</div><div class="col-xs-1 text-right">Shields</div><div class="col-xs-1">Hops</div><div class="col-xs-3">Type</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9" style="background-color: rgb(0,0,187); padding: 10px 0; margin: 5px 0"><hr style="border: 1px dashed white; height: 0px; margin: 0px" /></div></div>')
    $.get('/ship/active/', function(result) {
      for (var i in result) {
        el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-blue-fg text-right">' + result[i].number + '</div><div class="col-xs-1 ' + (data.ship.id == result[i].id ? 'ansi-bright-cyan-fg' : 'ansi-green-fg') + ' text-right">' + result[i].sector.number + (data.ship.id == result[i].id ? '<span class="ansi-bright-red-fg ansi-bright-black-bg" style="position:absolute; right: 5px">+</span>' : '') + '</div><div class="col-xs-4 ansi-bright-yellow-fg">' + result[i].name + '</div><div class="col-xs-1 ansi-bright-cyan-fg text-right">' + simplifyNumber(parseInt(result[i].fighters)) + '</div><div class="col-xs-1 ansi-yellow-fg text-right">' + simplifyNumber(parseInt(result[i].shields)) + '</div><div class="col-xs-1 ' + (data.ship.id == result[i].id ? 'ansi-green-fg' : 'ansi-red-fg') + ' text-right">' + result[i].hops + '</div><div class="col-xs-3">' + result[i].type.class + '</div></div></div></div>')
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() { 
      el.append('<br />')
      displayComputerCommand(data)
    })
  }

  var listPlanets = function(data, type) {
    el.html('<br /><div class="row"><div class="col-xs-9 ansi-bright-white-fg ansi-blue-bg text-center">Personal Planet Scan</div></div><br />')
    el.append('<div class="row"><div class="col-xs-9"><div class="row ansi-bright-cyan-fg"><div class="col-xs-1">Sector</div><div class="col-xs-2">Planet Name</div><div class="col-xs-1 text-right">Ore</div><div class="col-xs-1 text-right">Org</div><div class="col-xs-1 text-right">Equ</div><div class="col-xs-1 text-right">Ore</div><div class="col-xs-1 text-right">Org</div><div class="col-xs-1 text-right">Equ</div><div class="col-xs-1">Fighters</div><div class="col-xs-2 text-right">Citadel</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row ansi-bright-cyan-fg magentadashbottom"><div class="col-xs-1">Shields</div><div class="col-xs-2">Population</div><div class="col-xs-3 text-center">-=Productions=-</div><div class="col-xs-4 text-center">-=-=-=-=-On Hands-=-=-=-=-</div><div class="col-xs-2 text-right">Credits</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9 magentadashtop"></div></div>')
    $.get('/planet/personal/', function(result) {
      if (result.length === 0)
        el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">No Planets claimed</span><br />')
      else {
        var shieldsTotal = 0
        var populationTotal = 0
        var fuelProdTotal = 0
        var organicsProdTotal = 0
        var equipmentProdTotal = 0
        var fuelTotal = 0
        var organicsTotal = 0
        var equipmentTotal = 0
        var fightersTotal = 0
        var treasuryTotal = 0
        for (var i in result) {
          el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-magenta-fg text-right">' + result[i].sector.number + '</div><div class="col-xs-5 ansi-bright-cyan-fg"><span class="ansi-magenta-fg">#' + result[i].number + '</span> &nbsp; &nbsp; ' + result[i].name + '</div><div class="col-xs-4 ansi-magenta-fg">Class <span class="ansi-bright-white-fg ansi-blue-bg">' + result[i].type.class + '</span>, ' + result[i].type.desc + '</div><div class="col-xs-2 text-right">' + (result[i].citadel > 0 ? 'Level <span class="ansi-bright-yellow-fg">' + result[i].citadel + '</span>' : 'No Citadel') + '</div></div></div></div>')
          el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-red-fg text-right">' + (result[i].shields > 0 ? result[i].shields : '---') + '</div><div class="col-xs-2 ansi-bright-blue-fg">(' + simplifyNumber((parseInt(result[i].fuel_cols) + parseInt(result[i].organics_cols) + parseInt(result[i].equipment_cols)) * 1000) + ')</div><div class="col-xs-1 text-right">' + simplifyNumber(parseInt(result[i].fuel_cols) / parseInt(result[i].type.col_to_fuel_ratio)) + '</div><div class="col-xs-1 text-right">' + simplifyNumber(parseInt(result[i].organics_cols) / parseInt(result[i].type.col_to_organics_ratio)) + '</div><div class="col-xs-1 text-right">' + simplifyNumber(parseInt(result[i].equipment_cols) / parseInt(result[i].type.col_to_equipment_ratio)) + '</div><div class="col-xs-1 ansi-bright-yellow-fg text-right">' + simplifyNumber(result[i].fuel) + '</div><div class="col-xs-1 ansi-bright-yellow-fg text-right">' + simplifyNumber(result[i].organics) + '</div><div class="col-xs-1 ansi-bright-yellow-fg text-right">' + simplifyNumber(result[i].equipment) + '</div><div class="col-xs-1 ansi-bright-red-fg text-right">' + simplifyNumber(result[i].fighters) + '</div><div class="col-xs-2 ansi-magenta-fg text-right">' + simplifyNumber(result[i].treasury) + '</div></div></div></div>')
          shieldsTotal += parseInt(result[i].shields)
          populationTotal += ((parseInt(result[i].fuel_cols) + parseInt(result[i].organics_cols) + parseInt(result[i].equipment_cols)) * 1000)
          fuelProdTotal += (parseInt(result[i].fuel_cols) / parseInt(result[i].type.col_to_fuel_ratio))
          organicsProdTotal += (parseInt(result[i].organics_cols) / parseInt(result[i].type.col_to_organics_ratio))
          equipmentProdTotal += (parseInt(result[i].equipment_cols) / parseInt(result[i].type.col_to_equipment_ratio))
          fuelTotal += parseInt(result[i].fuel)
          organicsTotal += parseInt(result[i].organics)
          equipmentTotal += parseInt(result[i].equipment)
          fightersTotal += parseInt(result[i].fighters)
          treasuryTotal += parseInt(result[i].treasury)
        }
        el.append('<div class="row"><div class="col-xs-9"><div class="row magentadashbottom"><div class="col-xs-1"></div><div class="col-xs-2"></div><div class="col-xs-1"></div><div class="col-xs-1"></div><div class="col-xs-1"></div><div class="col-xs-1"></div><div class="col-xs-1"></div><div class="col-xs-1"></div><div class="col-xs-1"></div><div class="col-xs-2"></div></div></div></div>')
        el.append('<div class="row"><div class="col-xs-9"><div class="row magentadashtop"><div class="col-xs-1 ansi-bright-red-fg text-right">' + simplifyNumber(shieldsTotal) + '</div><div class="col-xs-2 ansi-bright-blue-fg">(' + simplifyNumber(populationTotal) + ')</div><div class="col-xs-1 text-right">' + simplifyNumber(fuelProdTotal) + '</div><div class="col-xs-1 text-right">' + simplifyNumber(organicsProdTotal) + '</div><div class="col-xs-1 text-right">' + simplifyNumber(equipmentProdTotal) + '</div><div class="col-xs-1 ansi-bright-yellow-fg text-right">' + simplifyNumber(fuelTotal) + '</div><div class="col-xs-1 ansi-bright-yellow-fg text-right">' + simplifyNumber(organicsTotal) + '</div><div class="col-xs-1 ansi-bright-yellow-fg text-right">' + simplifyNumber(equipmentTotal) + '</div><div class="col-xs-1 ansi-bright-red-fg text-right">' + simplifyNumber(fightersTotal) + '</div><div class="col-xs-2 ansi-magenta-fg text-right">' + simplifyNumber(treasuryTotal) + '</div></div></div></div>')
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      displayComputerCommand(data)
    })
  }

  var simplifyNumber = function(x) {
    if (x < 1000)
      return Math.floor(x)
    if (x >= 1000 && x < 1000000)
      return Math.floor(x / 1000) + 'T'
    if (x >= 1000000)
      return Math.floor(x / 1000000) + 'M'
    return x
  }

  var knownUniverse = function(data, which) {
    if (which == 'explored') {
      el.append('<br /><span class="ansi-magenta-fg">You have explored the following sectors:<br /><br />')
      var x = 0
      var row
      for (var i in data.trader.explored) {
        if (x == 0)
          row = $('<div></div>').addClass('row')
        if (x == 11) {
          el.append(row)
          x = 0
        } else {
          x++
        }
        row.append('<div class="col-xs-1 ansi-bright-green-fg text-right">' + data.trader.explored[i] + '</div>')
      }
      el.append(row)
      displayComputerCommand(data)
    } else if (which == 'unexplored') {
      el.append('<br /><span class="ansi-magenta-fg">You have NOT explored the following sectors:<br /><br />')

      var unexplored = []
      for (var i = 1; i <= universe.sectors; i++) {
        if (data.trader.explored.indexOf(i) == -1)
          unexplored.push(i)
      }

      var x = 0
      var row
      for (var i in unexplored) {
        if (x == 0)
          row = $('<div></div>').addClass('row')
        if (x == 11) {
          el.append(row)
          x = 0
        } else {
          x++
        }
        row.append('<div class="col-xs-1 ansi-bright-green-fg text-right">' + unexplored[i] + '</div>')
      }
      el.append(row)
      displayComputerCommand(data)
    } else {
      el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Your Known Universe&gt;</span><br /><br />')
      el.append('<span class="ansi-bright-cyan-fg">You have explored ' + (data.trader.explored.length / universe.sectors).toFixed(2) + '% of the known Universe.<br /><br />')
      el.append('Do you want to list your (<a href="" class="ansi-bright-yellow-fg" data-attribute="explored">E</a>)xplored or (<a href="" class="ansi-bright-yellow-fg" data-attribute="unexplored">U</a>)nexplored sectors? (E/U) ')
      menuEventHandler([
        { 'nextFunction': knownUniverse, 'nextFunctionArgs': [ data, 'explored' ], 'attribute': 'explored', 'key': 'E'.charCodeAt(), 'addbreak': true },
        { 'nextFunction': knownUniverse, 'nextFunctionArgs': [ data, 'unexplored' ], 'attribute': 'unexplored', 'key': 'U'.charCodeAt(), 'addbreak': true },
        { 'nextFunction': displayComputerCommand, 'nextFunctionArgs': [ data ], 'key': 13, 'addbreak': true }
      ])
    }
  }

  var planetSpecs = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Examine Planet Types&gt;</span><br /><br />')
    el.append('You call up the System Databanks and browse through Planetary specs.<br /><br />')
    el.append('<span class="ansi-magenta-fg">Which planet type are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
    planetSpecsMenu(data)
  }

  var planetSpecsList = function(data) {
    el.append('<br />')
    for (var i in config.planet_types) {
      var keyCode = (parseInt(i) + 65 >= 'Q'.charCodeAt() ? String.fromCharCode(parseInt(i) + 66) : String.fromCharCode(parseInt(i) + 65))
      el.append('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="' + keyCode + '">' + keyCode + '</a>&gt; Class <span class="ansi-bright-white-fg ansi-blue-bg">' + config.planet_types[i].class + '</span>,</span> ' + config.planet_types[i].desc + '<br />')
    }
    el.append('<br /><span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> To Leave<br /><br />')
    el.append('<span class="ansi-magenta-fg">Which planet type are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
    planetSpecsMenu(data)
  }

  var planetSpecsMenu = function(data) {
    var menuEvents = [
      { 'nextFunction': planetSpecsList, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 13, 'addbreak': true },
      { 'nextFunction': planetSpecsList, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 63, 'addbreak': true },
      { 'nextFunction': function() { el.append('You shut off the Vid Term.<br />'); displayComputerCommand(data) }, 'attribute': 'display', 'key': 'Q'.charCodeAt(), 'addbreak': true }
    ]
    for (var i in config.planet_types) {
      var keyCode = (parseInt(i) + 65 >= 'Q'.charCodeAt() ? (parseInt(i) + 66) : (parseInt(i) + 65))
      menuEvents.push({ 'nextFunction': viewPlanetSpecEntry, 'nextFunctionArgs': [ data, config.planet_types[i].id ], 'attribute': String.fromCharCode(keyCode), 'key': keyCode, 'noreset': true })
    }
    menuEventHandler(menuEvents)
  }

  var viewPlanetSpecEntry = function(data, id) {
    var planet = config.planet_types.filter(function(entry) { return entry.id === id })[0]
    controller = AnsiLove.render('/ANSI/PLANET' + planet.class + '.ANS', function(canvas, sauce) {
      el.html(canvas)
      el.append('<br /><br /><span class="ansi-magenta-fg">Which planet type are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
    }, { 'bits': 9, '2x': (retina ? 1 : 0) })
  }

  var shipCatalog = function(data, destination, nextHop, method, route, shipyard) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Examine Ship Stats&gt;</span><br /><br />')
    el.append('You call up the Ship Catalog and browse through Starship specs.<br /><br />')
    el.append('<span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
    shipCatalogMenu(data, destination, nextHop, method, route, shipyard)
  }

  var shipCatalogList = function(data, destination, nextHop, method, route, shipyard, purchase, tradeID, tradeValue) {
    el.append('<br />')
    var ships = config.ship_types.filter(function(entry) { return entry.deployment === 0 })
    if (purchase)
      ships = ships.filter(function(entry) { return entry.is_escapepod === 0 })
    for (var i in ships) {
      var keyCode = (parseInt(i) + 65 >= 'Q'.charCodeAt() ? String.fromCharCode(parseInt(i) + 66) : String.fromCharCode(parseInt(i) + 65))
      el.append('<div class="row"><div class="col-xs-3"><span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="' + keyCode + '">' + keyCode + '</a>&gt;</span> ' + ships[i].class + '</div>' + (purchase ? '<div class="col-xs-1 ' + (data.trader.credits + (tradeValue ? tradeValue : 0) < ships[i].cost_hold + ships[i].cost_drive + ships[i].cost_computer + ships[i].cost_hull ? 'ansi-bright-black-fg' : 'ansi-bright-green-fg') + ' text-right">' + addCommas(ships[i].cost_hold + ships[i].cost_drive + ships[i].cost_computer + ships[i].cost_hull) + '</div>' : '') + '</div>')
    }
    el.append('<br /><span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> To Leave<br /><br />')
    el.append('<span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
    shipCatalogMenu(data, destination, nextHop, method, route, shipyard, purchase, tradeID, tradeValue)
  }

  var shipCatalogMenu = function(data, destination, nextHop, method, route, shipyard, purchase, tradeID, tradeValue) {
    var menuEvents = [
      { 'nextFunction': shipCatalogList, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard, purchase, tradeID, tradeValue ], 'attribute': 'display', 'key': 13, 'addbreak': true },
      { 'nextFunction': shipCatalogList, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard, purchase, tradeID, tradeValue ], 'attribute': 'display', 'key': 63, 'addbreak': true },
      { 'nextFunction': function() { if (!purchase) { el.append('You shut off the Vid Term.<br />'); } if (shipyard) { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route); } else { displayComputerCommand(data); } }, 'attribute': 'display', 'key': 'Q'.charCodeAt(), 'addbreak': true }
    ]
    var ships = config.ship_types.filter(function(entry) { return entry.deployment === 0 })
    if (purchase)
      ships = ships.filter(function(entry) { return entry.is_escapepod === 0 })
    for (var i in ships) {
      var keyCode = (parseInt(i) + 65 >= 'Q'.charCodeAt() ? (parseInt(i) + 66) : (parseInt(i) + 65))
      if (purchase)
        menuEvents.push({ 'nextFunction': shipyardBuyNewShip, 'nextFunctionArgs': [ data, destination, nextHop, method, route, tradeID, tradeValue, ships[i].id ], 'attribute': String.fromCharCode(keyCode), 'key': keyCode })
      else
        menuEvents.push({ 'nextFunction': viewShipCatalogEntry, 'nextFunctionArgs': [ data, ships[i].id ], 'attribute': String.fromCharCode(keyCode), 'key': keyCode, 'noreset': true })
    }
    menuEventHandler(menuEvents)
  }

  var viewShipCatalogEntry = function(data, id) {
    var ship = config.ship_types.filter(function(entry) { return entry.id === id })[0]
    if (ship.ansi)
      controller = AnsiLove.render('/ANSI/' + ship.ansi, function(canvas, sauce) {
        el.html(canvas)
        viewShipTable(ship)
        el.append('<br /><span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
      }, { 'bits': 9, '2x': (retina ? 1 : 0) })
    else {
      el.html(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Ship Category #<span class="ansi-bright-yellow-fg">0</span> &nbsp; &nbsp; Ship Class : ' + ship.class + '<br /><br />')
      viewShipTable(ship)
      el.append('<br /><span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
    }
  }

  var viewShipTable = function(ship) {
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Basic Hold Cost<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.cost_hold) + '</div><div class="col-xs-3 text-right">Initial Holds<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.init_holds + '</div><div class="col-xs-3 text-right">Maximum Shields<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.max_shields) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Main Drive Cost<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.cost_drive) + '</div><div class="col-xs-3 text-right">Max Fighters<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.max_fighters) + '</div><div class="col-xs-3 text-right">Offensive Odds<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + parseFloat(ship.offensive_odds).toFixed(1) + '<span class="ansi-red-fg">:</span>1</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Computer Cost<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.cost_computer) + '</div><div class="col-xs-3 text-right">Turns Per Warp<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.turns_per_warp + '</div><div class="col-xs-3 text-right">Defensive Odds<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + parseFloat(ship.defensive_odds).toFixed(1) + '<span class="ansi-red-fg">:</span>1</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Ship Hull Cost<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.cost_hull) + '</div><div class="col-xs-3 text-right">Mine Max<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.max_mines + '</div><div class="col-xs-3 text-right">Beacon Max<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.max_beacons + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Ship Base Cost<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + addCommas(ship.cost_hold + ship.cost_drive + ship.cost_computer + ship.cost_hull) + '</div><div class="col-xs-3 text-right">Genesis Max<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.max_genesis + '</div><div class="col-xs-3 text-right">Long Range Scan<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + (ship.allow_densityscan ? 'Yes' : 'No') + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Max Figs Per Attack<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.max_fighters_per_attack + '</div><div class="col-xs-3 text-right">TransWarp Drive<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + (ship.allow_transwarp ? 'Yes' : 'No') + '</div><div class="col-xs-3 text-right">Planet Scanner<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + (ship.allow_planetscan ? 'Yes' : 'No') + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-3 text-right">Maximum Holds<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.max_holds + '</div><div class="col-xs-3 text-right">Transport Range<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + ship.transport_range + '</div><div class="col-xs-3 text-right">Photon Missiles<span class="ansi-bright-yellow-fg">:</span></div><div class="col-xs-1 text-right ansi-bright-cyan-fg">' + (ship.max_photons > 0 ? 'Yes' : 'No') + '</div></div></div></div>')
  }

  var showGoodClasses = function(data) {

    var titles = getTitles('positive')
    el.append('<div class="row"><div class="col-xs-9 text-center">The Good Guys</div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row greendash"><div class="col-xs-1 ansi-bright-yellow-fg">Rank</div><div class="col-xs-3 ansi-bright-yellow-fg text-center">Title</div><div class="col-xs-2 ansi-bright-yellow-fg text-right">Experience</div><div class="col-xs-1 ansi-bright-yellow-fg">Rank</div><div class="col-xs-3 ansi-bright-yellow-fg text-center">Title</div><div class="col-xs-2 ansi-bright-yellow-fg text-right">Experience</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">1</div><div class="col-xs-3">' + titles[1].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[1].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">12</div><div class="col-xs-3">' + titles[12].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[12].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">2</div><div class="col-xs-3">' + titles[2].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[2].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">13</div><div class="col-xs-3">' + titles[13].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[13].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">3</div><div class="col-xs-3">' + titles[3].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[3].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">14</div><div class="col-xs-3">' + titles[14].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[14].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">4</div><div class="col-xs-3">' + titles[4].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[4].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">15</div><div class="col-xs-3">' + titles[15].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[15].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">5</div><div class="col-xs-3">' + titles[5].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[5].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">16</div><div class="col-xs-3">' + titles[16].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[16].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">6</div><div class="col-xs-3">' + titles[6].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[6].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">17</div><div class="col-xs-3">' + titles[17].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[17].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">7</div><div class="col-xs-3">' + titles[7].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[7].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">18</div><div class="col-xs-3">' + titles[18].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[18].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">8</div><div class="col-xs-3">' + titles[8].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[8].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">19</div><div class="col-xs-3">' + titles[19].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[19].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">9</div><div class="col-xs-3">' + titles[9].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[9].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">20</div><div class="col-xs-3">' + titles[20].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[20].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">10</div><div class="col-xs-3">' + titles[10].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[10].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">21</div><div class="col-xs-3">' + titles[21].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[21].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">11</div><div class="col-xs-3">' + titles[11].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[11].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">22</div><div class="col-xs-3">' + titles[22].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[22].experience) + '</div></div></div></div>')
    displayComputerCommand(data)
  }

  var showEvilClasses = function(data) {
    var titles = getTitles('negative')
    el.append('<div class="row"><div class="col-xs-9 ansi-bright-red-fg text-center">The Bad Guys</div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row greendash"><div class="col-xs-1 ansi-bright-yellow-fg">Rank</div><div class="col-xs-3 ansi-bright-yellow-fg text-center">Title</div><div class="col-xs-2 ansi-bright-yellow-fg text-right">Experience</div><div class="col-xs-1 ansi-bright-yellow-fg">Rank</div><div class="col-xs-3 ansi-bright-yellow-fg text-center">Title</div><div class="col-xs-2 ansi-bright-yellow-fg text-right">Experience</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">1</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[1].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[1].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">12</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[12].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[12].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">2</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[2].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[2].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">13</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[13].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[13].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">3</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[3].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[3].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">14</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[14].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[14].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">4</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[4].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[4].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">15</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[15].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[15].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">5</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[5].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[5].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">16</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[16].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[16].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">6</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[6].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[6].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">17</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[17].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[17].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">7</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[7].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[7].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">18</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[18].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[18].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">8</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[8].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[8].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">19</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[19].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[19].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">9</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[9].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[9].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">20</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[20].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[20].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">10</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[10].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[10].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">21</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[21].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[21].experience) + '</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-yellow-fg ranks">11</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[11].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[11].experience) + '</div><div class="col-xs-1 ansi-bright-yellow-fg ranks">22</div><div class="col-xs-3 ansi-bright-red-fg">' + titles[22].title + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(titles[22].experience) + '</div></div></div></div>')
    displayComputerCommand(data)
  }

  var computerQuit = function(data) {
    el.append('<br /><span class="ansi-bright-cyan-fg">&lt;Computer deactivated&gt;</span><br />')
    displaySectorCommand(data)
  }

  var viewStatus = function(data) {
    el.html('<div class="col-xs-6 ansi-bright-red-fg text-center">Trade Wars 2015 Game Configuration and Status</div><br />')
    el.append('<br /> Initial Turns per day <span class="ansi-bright-cyan-fg">' + universe.turns_per_day + '</span>, fighters <span class="ansi-bright-cyan-fg">' + universe.initial_fighters + '</span>, credits <span class="ansi-bright-cyan-fg">' + universe.initial_credits + '</span>, holds <span class="ansi-bright-cyan-fg">' + universe.initial_holds + '</span>.<br />')
    el.append(' Inactive players will be deleted after <span class="ansi-bright-cyan-fg">30</span> days.<br />')
    el.append(' Maximum players <span class="ansi-bright-cyan-fg">' + universe.max_players + '</span>, sectors <span class="ansi-bright-cyan-fg">' + universe.sectors + '</span>, ports <span class="ansi-bright-cyan-fg">' + universe.max_ports + '</span>, planets <span class="ansi-bright-cyan-fg">' + universe.max_planets + '</span>.<br />')
    el.append(' The Maximum number of Planets per sector: <span class="ansi-bright-cyan-fg">' + universe.max_planets_per_sector + '</span>, Traders on a Corp: <span class="ansi-bright-cyan-fg">' + universe.max_traders_per_corp + '</sapn>,<br />')
    el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Ships per FedSpace Sector: <span class="ansi-bright-cyan-fg">5</span>.<br />')
    el.append('<br /> &nbsp; &nbsp; &nbsp; &nbsp; The StarDock is located in Sector <span class="ansi-bright-cyan-fg">' + universe.stardock[0].sector.number + '</span>.<br />')
    el.append(' &nbsp; &nbsp; &nbsp; &nbsp; Photon Missile Wave duration is <span class="ansi-bright-cyan-fg">' + universe.photon_duration + '</span> seconds.<br />')
    el.append(' &nbsp; &nbsp; &nbsp; &nbsp; Ver# <span class="ansi-bright-cyan-fg">403.9b</span> running under <span class="ansi-bright-cyan-fg">Laravel v5</span>.<br />')
    el.append(' &nbsp; &nbsp; &nbsp; &nbsp; This game is registered to <span class="ansi-bright-cyan-fg">Unknown</span>.<br />')

    var date = new Date(universe.banged.date)
    var diff = (((new Date()).getTime() - date.getTime()) / 1000)
    var day_diff = Math.floor(diff / 86400)

    el.append('<br /> &nbsp; &nbsp; &nbsp; &nbsp; This game has been running for <span class="ansi-bright-cyan-fg">' + day_diff + '</span> days.<br />')
    el.append('<br /><span class="ansi-bright-yellow-fg">-=-=-=-</span> <span class="ansi-magenta-fg">Current Stats for ' + getPortReportDate() + '</span> <span class="ansi-bright-yellow-fg">-=-=-=-</span><br />')
    el.append('<br /> <span class="ansi-bright-yellow-fg">' + universe.ports + '</span> ports are open for business and have a net worth of <span class="ansi-bright-yellow-fg">' + addCommas(123456) + '</span>.<br />')
    el.append(' <span class="ansi-bright-yellow-fg">' + universe.planets + '</span> planets exist in the universe, <span class="ansi-bright-yellow-fg">' + Math.round((universe.planets_with_citadels / universe.planets) * 100) + '</span>% have Citadels.<br />')
    el.append(' <span class="ansi-bright-yellow-fg">' + universe.traders + '</span> Traders (<span class="ansi-magenta-fg">' + Math.round((universe.traders_good / universe.traders) * 100) + '% Good</span>) and <span class="ansi-bright-yellow-fg">0</span> Aliens (<span class="ansi-magenta-fg">50% Good</span>) are active in the game.<br />')
    el.append(' <span class="ansi-bright-yellow-fg">' + addCommas(universe.fighters) + '</span> and <span class="ansi-bright-yellow-fg">' + addCommas(universe.mines) + '</span> Mines are in use throughout the Universe.<br />')
    el.append(' <span class="ansi-bright-yellow-fg">0</span> Corporations are in business.<br />')

    displaySectorCommand(data)
  }

  var sectorDocs = function(data) {
    el.append('<br /><span class="ansi-magenta-fg">Do you want instructions (Y/N) [N]? ')
    booleanKey(function() { gameDocs(); pressAnyKey(function() { displaySectorCommand(data) }) }, function() { displaySectorCommand(data) }, false)
  }

  var genesis = function(data) {
    if (data.ship.genesis == 0) {
      el.append('You don\'t have any Genesis Torpedoes to launch!<br />')
      displaySectorCommand(data)
    } else if (data.sector.number == 1) {
      el.append('The intense traffic in sector 1 prohibits planetary construction.<br />')
      displaySectorCommand(data)
    } else {
      el.append('You have <span class="ansi-bright-yellow-fg">' + data.ship.genesis + '</span> Genesis Torpedoes.<br />')
      el.append('<span class="ansi-magenta-fg">Do you wish to launch one ' + showBooleanPrompt(false))
      booleanKey(function() { launchGenesis(data) }, function() { displaySectorCommand(data) }, false)
    }
  }

  var launchGenesis = function(data) {
    var controller = AnsiLove.animate('/ANSI/GENESIS.ANS', function(canvas, sauce) {
      el.html(canvas)
      controller.play(14400, function() {
        el.append('<br />For building this planet you receive <span class="ansi-bright-yellow-fg">25</span> experience point(s).<br />')
        // TODO: if exp bumps into next class, show message
        el.append('and your alignment went ' + (data.trader.alignment >= 0 ? 'up' : 'down') + ' by <span class="ansi-bright-yellow-fg">10</span> point(s).<br /><br />')
        var planetType = getRandom(config.planet_types)
        el.append('<form id="newPlanet"><div class="form-group"><label for="name"><span class="ansi-magenta-fg">What do you want to name this planet? (Class <span class="ansi-bright-white-fg ansi-blue-bg">' + planetType.class + '</span>, ' + planetType.desc + ')</span></label><input type="text" class="form-control ansi-yellow-fg" id="name"></div></form>')
        $('#newPlanet #name').focus()
        $(document).on('submit.newPlanet', '#newPlanet', function(e) {
          e.preventDefault()
          $(document).off('.newPlanet')
          $('#newPlanet #name').blur()
          var name = $('<div />').text($('#newPlanet #name').val()).html()
          $('#newPlanet').replaceWith('<span class="ansi-magenta-fg">What do you want to name this planet? (Class <span class="ansi-bright-white-fg ansi-blue-bg">' + planetType.class + '</span>, ' + planetType.desc + ')</span><br /><span class="ansi-yellow-fg">' + name + '</span><br />')
          $.post('/planet/', { 'task': 'createplanet', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'planet_type': planetType.id, 'planet_name': name }, function(result) {
            getSectorData(displaySectorCommand)
          }).fail(function(result) {
            if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
              el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
            displaySectorCommand(data)
          })
        })
      })
    }, { 'bits': 9, '2x': (retina ? 1 : 0) })
  }

  var jettison = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Jettison Cargo&gt;</span><br /><br />')
    if (data.sector.cluster == 'The Federation') {
      el.append('<br />The Federation does not allow cargo dumping in FedSpace (No Littering!).<br />')
      displaySectorCommand(data)
    } else {
      if (data.ship.fuel > 0)
        el.append(' Fuel Ore<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.fuel + '</span><br />')
      if (data.ship.organics > 0)
        el.append(' Organics<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.organics + '</span><br />')
      if (data.ship.equipment > 0)
        el.append(' Equipment<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.equipment + '</span><br />')
      if (data.ship.colonists > 0)
        el.append(' Colonists<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.colonists + '</span><br />')
      el.append('<br /><span class="ansi-magenta-fg">Are you sure you want to jettison all cargo? (Y/N) ')
      booleanKey(function() { jettisonCargo(data) }, function() { displaySectorCommand(data) }, false)
    }
  }

  var jettisonCargo = function(data) {
    $.post('/ship/', { 'task': 'jettison', 'sector_id': data.sector.id, 'ship_id': data.ship.id }, function(result) {
      if (result.status == 'ok') {
        if (data.ship.fuel > 0)
          el.append('<span class="ansi-bright-yellow-fg">' + data.ship.fuel + '</span> holds of Fuel Ore jettisoned.<br />')
        if (data.ship.organics > 0)
          el.append('<span class="ansi-bright-yellow-fg">' + data.ship.organics + '</span> holds of Organics jettisoned.<br />')
        if (data.ship.equipment > 0)
          el.append('<span class="ansi-bright-yellow-fg">' + data.ship.equipment + '</span> holds of Equipment jettisoned.<br />')
        if (data.ship.colonists > 0 && universe.cols_jettisoned == 0) {
          el.append('<span class="ansi-bright-yellow-fg">' + data.ship.colonists + '</span> holds of Colonists jettisoned into deep space.<br />For killing these Colonists, your alignment went down by <span class="ansi-bright-yellow-fg">' + data.ship.colonists + '</span> point(s).<br />')
          universe.cols_jettisoned = 1
        }
        data.ship.colonists = 0
        data.ship.fuel = 0
        data.ship.organics = 0
        data.ship.equipment = 0
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
    }).always(function() {
      displaySectorCommand(data)
    })
  }

  var portAutopilotEnd = function(data, destination, nextHop, method, route) {
    el.append('<br /><span class="ansi-magenta-fg">Shutdown Autopilot and stay here?</span> <span class="ansi-bright-yellow-fg">(<a href="" class="ansi-bright-yellow-fg" data-id="yes">Y</a>/<a href="" class="ansi-bright-yellow-fg" data-id="no">N</a>) <span class="ansi-green-fg">[N]</span> ')
    booleanKey(function() { displaySectorCommand(data) }, function() { moveToSectorID(data, destination, nextHop, method, route) }, false)
  }

  var portDock = function(data, destination, nextHop, method, route) {
    if (!data.sector.port) {
      el.append('<br /><br /><span class="ansi-bright-red-fg">There is no port in this sector!</span>')
      displaySector(data)
      if (destination)
        portAutopilotEnd(data, destination, nextHop, method, route)
      else
        displaySectorCommand(data)
    } else if (data.sector.port.destroyed) {
      el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Port&gt;</span><br /><br />')
      el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">Docking...</span><br />')
      deductTurn(data)
      el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">Captain! Are you sure you want to port here?</span>')
      booleanKey(function() { portDestroyed(data) }, function() { if (destination) portAutopilotEnd(data, destination, nextHop, method, route); else displaySectorCommand(data); }, false)
    } else {
      el.append('<br /><br /><span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="attack">A</a>&gt;</span> Attack this Port<br />')
      if (data.sector.port.class == 9)
        el.append('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="stardock">S</a>&gt;</span> Land on <span class="ansi-yellow-fg">the StarDock</span><br />')
      el.append('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="trade">T</a>&gt;</span> Trade at this Port<br />')
      el.append('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> Quit, Nevermind<br /><br />')
      el.append('<span class="ansi-magenta-fg">Enter your choice <span class="ansi-bright-yellow-fg">[T]</span> ?</span> ')
      menuEvents = [
        { 'nextFunction': portAttack, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'attack', 'key': 'A'.charCodeAt() },
        { 'nextFunction': portTrade, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'attack', 'key': 'T'.charCodeAt() },
        { 'nextFunction': portTrade, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'attack', 'key': 13 },
        { 'nextFunction': (destination ? portAutopilotEnd : displaySectorCommand), 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'attack', 'key': 'Q'.charCodeAt(), 'addbreak': true }
      ]
      if (data.sector.port.class == 9)
        menuEvents.push({ 'nextFunction': starDock, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'stardock', 'key': 'S'.charCodeAt() })
      menuEventHandler(menuEvents)
    }
  }

  var starDock = function(data, destination, nextHop, method, route, docked) {
    if (!docked) {
      var controller = AnsiLove.render('/ANSI/STARLAND.ANS', function(canvas, sauce) {
        el.html(canvas)
        pressAnyKey(function() { starDock(data, destination, nextHop, method, route, true) })
      }, { 'bits': 9, '2x': (retina ? 1 : 0) })
    } else {
      var controller = AnsiLove.render('/ANSI/STARLND2.ANS', function(canvas, sauce) {
        el.html(canvas)
        deductTurn(data)
        el.append(starDockPrompt)
        starDockEvents(data, destination, nextHop, method, route)
      }, { 'bits': 9, '2x': (retina ? 1 : 0) })
    }
  }

  var starDockEvents = function(data, destination, nextHop, method, route) {
    menuEventHandler([
      { 'nextFunction': cineplex, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'cineplex', 'key': 'C'.charCodeAt() },
      { 'nextFunction': bank, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'bank', 'key': 'G'.charCodeAt() },
      { 'nextFunction': emporium, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'hardware', 'key': 'H'.charCodeAt() },
      { 'nextFunction': library, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'library', 'key': 'L'.charCodeAt() },
      { 'nextFunction': policeHQ, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'police', 'key': 'P'.charCodeAt() },
      { 'nextFunction': shipyards, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'shipyards', 'key': 'S'.charCodeAt() },
      { 'nextFunction': (destination ? function() { el.append('<br /><span class="ansi-magenta-fg">You return to your ship and blast off from the StarDock.</span><br />'); portAutopilotEnd(data, destination, nextHop, method, route) } : function() { el.append('<br /><span class="ansi-magenta-fg">You return to your ship and blast off from the StarDock.</span><br />'); displaySectorCommand(data) }), 'attribute': 'attack', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': starDockHelp, 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': starDockMenu, 'attribute': 'menu', 'key': 63, 'noreset': true },
      //{ 'nextFunction': function() { el.append('<br /><br /><span class="ansi-bright-cyan-fg">You wander about the port but find nothing but locked doors and deadends.<br />You do notice some rather rough looking characters lurking about the place.<br />Maybe its not such a good idea to wander about without knowing where its<br />safe to go?</span><br />br />' + starDockPrompt); }, 'failure': true, 'noreset': true }
    ])
  }

  var shipyards = function(data, destination, nextHop, method, route) {
    var controller = AnsiLove.render('/ANSI/SHIPYDOP.ANS', function(canvas, sauce) {
      el.html(canvas)
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      el.append(shipyardPrompt)
      shipyardEvents(data, destination, nextHop, method, route)
    }, { 'bits': 8, '2x': (retina ? 1 : 0) } )
  }

  var shipyardEvents = function(data, destination, nextHop, method, route) {
    menuEventHandler([
      { 'nextFunction': function() { el.append('You leave the shipyards.<br />' + starDockPrompt); starDockEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipyardMenu, 'nextFunctionArgs': [ data ], 'attribute': 'menu', 'key': 13, 'noreset': true, 'addbreak': true },
      { 'nextFunction': shipyardMenu, 'nextFunctionArgs': [ data ], 'attribute': 'menu', 'key': 63, 'noreset': true, 'addbreak': true },
      { 'nextFunction': shipyardHelp, 'nextFunctionArgs': [ data ], 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': shipyardBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'buy', 'key': 'B'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipyardSell, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'sell', 'key': 'S'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': portClass0Items, 'nextFunctionArgs': [ data, destination, nextHop, method, route, true ], 'attribute': 'port', 'key': 'P'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipyardRegistration, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'registration', 'key': 'R'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': shipCatalog, 'nextFunctionArgs': [ data, destination, nextHop, method, route, true ], 'attribute': 'examine', 'key': 'E'.charCodeAt() },
    ])
  }

  var shipyardBuy = function(data, destination, nextHop, method, route) {
    el.append('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;Buy a New Ship&gt;</span><br /><br />')
    el.append('You find a salesperson and ask about buying a new ship.<br /><br />')
    el.append('<span class="ansi-magenta-fg">Welcome to the \'yards\', you want to trade in that old ship? </span>')
    booleanKey(function() { shipyardTradeIn(data, destination, nextHop, method, route, data.ship) }, function() { el.append('Oh! Big spender eh? Okay, lets get you another ship.<br /><span class="ansi-magenta-fg">You ready to deal? </span>'); booleanKey(function() { el.append('<span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> '); shipCatalogMenu(data, destination, nextHop, method, route, true, true) }, function() { el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) }, false) }, false)
  }

  var shipyardSell = function(data, destination, nextHop, method, route) {
    el.append('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;Sell an old Ship&gt;</span><br /><br />')
    el.append('You flag down a used ship salesperson and get ready to deal.<br /><br />')
    shipyardSellShips(data, destination, nextHop, method, route)
  }

  var shipyardSellShips = function(data, destination, nextHop, method, route) {
    el.append('<div class="row"><div class="col-xs-9 ansi-bright-cyan-fg text-center">--&lt; Available Ships in Orbit &gt;--</div></div>')
    el.append('<div class="row"><div class="col-xs-9"><div class="row ansi-magenta-fg"><div class="col-xs-1 text-right">Ship</div><div class="col-xs-1" text-right>Sect</div><div class="col-xs-2">Name</div><div class="col-xs-2 text-right">Fighters</div><div class="col-xs-2 text-right">Shields</div><div class="col-xs-1 text-right">Hops</div><div class="col-xs-2">Type</div></div></div></div>')
    el.append('<div class="row"><div class="col-xs-9" style="background-color: rgb(0,0,187); padding: 10px 0; margin: 5px 0"><hr style="border: 1px dashed white; height: 0px; margin: 0px" /></div></div>')
    var ships = data.sector.ships.filter(function(entry) { return entry.trader_id === data.trader.id })
    if (ships.length == 0) {
      el.append('You do not own any other ships orbiting the Stardock!')
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
      el.append(shipyardPrompt)
      shipyardEvents(data, destination, nextHop, method, route)
    } else {
      for (var i in ships.sort(function(a, b) { return a.number - b.number })) {
        el.append('<div class="row"><div class="col-xs-9"><div class="row"><div class="col-xs-1 ansi-bright-blue-fg text-right">' + ships[i].number + '</div><div class="col-xs-1 ansi-bright-cyan-fg text-right">' + data.sector.number + '</div><div class="col-xs-2 ansi-bright-yellow-fg">' + ships[i].name + '</div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + simplifyNumber(parseInt(ships[i].fighters)) + '</div><div class="col-xs-2 ansi-yellow-fg text-right">' + simplifyNumber(parseInt(ships[i].shields)) + '</div><div class="col-xs-1 ansi-green-fg text-right">0</div><div class="col-xs-3">' + ships[i].type.class + '</div></div></div></div>')
      }
      el.append('<br /><span class="ansi-magenta-fg show-entry">Choose which ship to sell (Q=Quit) </span>')
      menuEventHandler([
        { 'nextFunction': function() { el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
        { 'nextFunction': function() { el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) }, 'key': 13, 'addbreak': true },
        { 'nextFunction': shipyardSellShip, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'failure': true }
      ])
    }
  }

  var shipyardSellShip = function(data, destination, nextHop, method, route, number) {
    var ship = data.sector.ships.filter(function(entry) { return entry.trader_id === data.trader.id })
    ship = ship.filter(function(entry) { return entry.number === number })[0]
    if (!ship) {
      el.append('<br />That is not an available ship.<br />')
      shipyardSellShips(data, destination, nextHop, method, route)
    } else {
      el.append('<br /><br />' + ship.name + '<br />')
      shipyardTradeIn(data, destination, nextHop, method, route, ship)
    }
  }

  var shipyardRegistration = function(data, destination, nextHop, method, route) {
    el.append('<br />You enter the Federation Ship Registrar\'s Office and sit down.<br />A clerk looks you over suspiciously and then holds out his hand.<br /><br />')
    el.append('<span class="ansi-magenta-fg">"That\'ll be <span class="ansi-bright-yellow-fg">5,000</span> creds to process a different ship name."<br />"Still interested?"</span> ')
    booleanKey(function() { if (data.trader.credits < 5000) { el.append('"You don\'t have the credits!"'); el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) } else shipyardChangeShipRegistration(data, destination, nextHop, method, route) }, function() { el.append('"Don\'t waste my time then!"'); el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) }, false)
  }

  var shipyardChangeShipRegistration = function(data, destination, nextHop, method, route) {
    el.append('<form id="changeshipregistration"><div class="form-group"><label for="name"><span class="ansi-magenta-fg">What do you want to name your ship? (30 chars)</span></label><input type="text" class="form-control ansi-yellow-fg" id="name"></div></form>')
    $('#changeshipregistration #name').focus()
    $(document).on('submit.registration', '#changeshipregistration', function(e) {
      e.preventDefault()
      $(document).off('.registration')
      $('#changeshipregistration #name').blur()
      var name = $('<div />').text($('#changeshipregistration #name').val()).html()
      $('#changeshipregistration').replaceWith('<span class="ansi-magenta-fg">What do you want to name your ship? (30 chars)</span><br /><span class="ansi-yellow-fg">' + name + '</span><br />')
      el.append('<br />' + name + ' <span class="ansi-bright-cyan-fg">is what you want? (<a href="" class="ansi-cyan-fg" data-attribute="yes">Y</a>/<a href="" class="ansi-cyan-fg" data-attribute="no">N</a>)</span> ')
      booleanKey(function() { shipyardChangeShipRegistrationComplete(data, destination, nextHop, method, route, name) }, function() { shipyardChangeShipRegistration(data, destination, nextHop, method, route) }, false)
    })
  }

  var shipyardChangeShipRegistrationComplete = function(data, destination, nextHop, method, route, name) {
    $.post('/ship/', { 'task': 'changeregistration', 'ship_id': data.ship.id, 'ship_name': name }, function(result) {
      if (result.status == 'ok') {
        data.trader.credits -= 5000
        data.ship.name = name
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
    }).always(function() {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
      el.append(shipyardPrompt)
      shipyardEvents(data, destination, nextHop, method, route)
    })
  }

  var shipyardTradeIn = function(data, destination, nextHop, method, route, ship) {
    el.append('"Here\'s what we\'ll offer for it":<br /><br />')

    var total = 0

    if (!ship.type.cost_hull)
      ship.type = config.ship_types.filter(function(entry) { return entry.id === ship.ship_id })[0]

    total += shipyardTradeInPrice(ship.ports, ship.kills, ship.type.cost_hull)
    el.append('<div class="row"><div class="col-xs-3">Ship Hull Value</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, ship.type.cost_hull)) + '</div></div>')

    var holdsCost = calcHoldCosts(holdBaseCost(), ship.holds)

    console.log(holdsCost + ', holds: ' + ship.holds + ', base: ' + holdBaseCost())

    total += shipyardTradeInPrice(ship.ports, ship.kills, holdsCost)
    el.append('<div class="row"><div class="col-xs-3">Ship Holds Value</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, holdsCost)) + '</div></div>')

    total += shipyardTradeInPrice(ship.ports, ship.kills, ship.type.cost_drive)
    el.append('<div class="row"><div class="col-xs-3">Main Drive Value</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, ship.type.cost_drive)) + '</div></div>')

    total += shipyardTradeInPrice(ship.ports, ship.kills, ship.type.cost_computer)
    el.append('<div class="row"><div class="col-xs-3">Computer Value</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, ship.type.cost_computer)) + '</div></div>')

    var fightersCost = 0
    if (ship.fighters > 0) {
      var multiplier = (ship.kills * 5) + ship.ports
      if (multiplier <= 30)
        multiplier = 30
      var magic = ((-.16 * multiplier) + 148.8)
      fightersCost = (magic <= 16 ? ship.fighters * 16 : ship.fighters * magic - 1) 
      total += fightersCost
      el.append('<div class="row"><div class="col-xs-3">Fighters</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(fightersCost) + '</div></div>')
    }

    var shieldsCost = 0
    if (ship.shields > 0) {
      var multiplier = (ship.kills * 5) + ship.ports
      if (multiplier <= 30)
        multiplier = 30
      var magic = ((-.16 * multiplier) + 148.8) / 2
      shieldsCost = (magic <= 8 ? ship.shields * 8 : ship.shields * magic - 1) 
      total += shieldsCost
      el.append('<div class="row"><div class="col-xs-3">Shields</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shieldsCost) + '</div></div>')
    }

    if (ship.genesis > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.genesis_cost * ship.genesis)
      el.append('<div class="row"><div class="col-xs-3">Genesis Torps</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.genesis_cost * ship.genesis)) + '</div></div>')
    }

    if (ship.class_1_mines > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.armid_cost * ship.class_1_mines)
      el.append('<div class="row"><div class="col-xs-3">Armid Mines</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.armid_cost * ship.class_1_mines)) + '</div></div>')
    }

    if (ship.class_2_mines > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.armid_cost * ship.class_2_mines)
      el.append('<div class="row"><div class="col-xs-3">Limpet Mines</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.armid_cost * ship.class_2_mines)) + '</div></div>')
    }

    if (ship.beacons > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.beacon_cost * ship.beacons)
      el.append('<div class="row"><div class="col-xs-3">Marker Beacons</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.beacon_cost * ship.beacons)) + '</div></div>')
    }

    if (ship.transwarp > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, (ship.transwarp == 1 ? universe.transwarp_1_cost : universe.transwarp_2_cost))
      el.append('<div class="row"><div class="col-xs-3">Type ' + ship.transwarp + ' TransWarp Drive</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, (ship.transwarp == 1 ? universe.transwarp_1_cost : universe.transwarp_2_cost))) + '</div></div>')
    }

    if (ship.psychic > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.psychic_cost)
      el.append('<div class="row"><div class="col-xs-3">Psychic Probe</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.psychic_cost)) + '</div></div>')
    }

    if (ship.planetscan > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.planetscan_cost)
      el.append('<div class="row"><div class="col-xs-3">Planet Scanner</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.planetscan_cost)) + '</div></div>')
    }

    if (ship.detonators > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.detonator_cost * ship.detonators)
      el.append('<div class="row"><div class="col-xs-3">Atomic Detonator</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.detonator_cost * ship.detonators)) + '</div></div>')
    }

    if (ship.corbomite > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.corbomite_cost * ship.corbomite)
      el.append('<div class="row"><div class="col-xs-3">Corbomite Devs.</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.corbomite_cost * ship.corbomite)) + '</div></div>')
    }

    if (ship.probes > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.probe_cost * ship.probes)
      el.append('<div class="row"><div class="col-xs-3">Ethereal Probes</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.probe_cost * ship.probes)) + '</div></div>')
    }

    if (ship.photons > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.photon_cost * ship.photons)
      el.append('<div class="row"><div class="col-xs-3">Photon Missiles</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.photon_cost * ship.photons)) + '</div></div>')
    }

    if (ship.cloaks > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.cloak_cost * ship.cloaks)
      el.append('<div class="row"><div class="col-xs-3">Cloaking Devices</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.cloak_cost * ship.cloaks)) + '</div></div>')
    }

    if (ship.disruptors > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, universe.disruptor_cost * ship.disruptors)
      el.append('<div class="row"><div class="col-xs-3">Mine Disruptors</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, universe.disruptor_cost * ship.disruptors)) + '</div></div>')
    }

    if (ship.scanner > 0) {
      total += shipyardTradeInPrice(ship.ports, ship.kills, (ship.scanner == 1 ? universe.densityscan_cost : universe.holoscan_cost))
      el.append('<div class="row"><div class="col-xs-3">' + (ship.scanner == 1 ? 'Density Scanner' : 'Holo Scanners') + '</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-cyan-fg text-right">' + addCommas(shipyardTradeInPrice(ship.ports, ship.kills, (ship.scanner == 1 ? universe.densityscan_cost : universe.holoscan_cost))) + '</div></div>')
    }

    el.append('<div class="row"><div class="col-xs-3"></div><div class="col-xs-3 ansi-white-fg text-right">===================</div></div>')
    el.append('<div class="row"><div class="col-xs-3">Trade-in Value</div><div class="col-xs-1 addseparator"></div><div class="col-xs-2 ansi-bright-red-fg text-right">' + addCommas(total) + '</div></div>')

    el.append('<br /><span class="ansi-magenta-fg">Still interested ? </span>')

    if (data.ship.id != ship.id)
      booleanKey(function() { shipyardSellShipID(data, destination, nextHop, method, route, ship, total) }, function() { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) }, false)
    else
      booleanKey(function() { el.append('<br /><span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> '); shipCatalogMenu(data, destination, nextHop, method, route, true, true, ship.id, total) }, function() { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) }, false)
  }

  var shipyardSellShipID = function(data, destination, nextHop, method, route, ship, tradeValue) {
    $.post('/ship/', { 'task': 'sellship', 'sector_id': data.sector.id, 'trade_id': ship.id, 'trade_value': tradeValue }, function(result) {
      if (result.status == 'ok') {
        el.append('The shipmaster takes possession of your ' + ship.type.class + ' and you are<br /><span class="ansi-bright-yellow-fg">' + addCommas(tradeValue) + '</span> credits richer!<br />')
        $.get('/sector/current/', function(data) {
          el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
          el.append(shipyardPrompt)
          shipyardEvents(data, destination, nextHop, method, route)
        })
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
      el.append(shipyardPrompt)
      shipyardEvents(data, destination, nextHop, method, route)
    })
  }

  var shipyardTradeInPrice = function(ports, kills, initial) {

    var multiplier = (kills * 5) + ports
    if (multiplier <= 30)
      multiplier = 30

    var magic = ((-.001 * multiplier) + .93)
    if (magic <= .1)
      return (initial == 0 ? 0 : initial * .1)
    else
      return (initial == 0 ? 0 : (initial * magic) - 1)

  }

  var shipyardBuyNewShip = function(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id) {
    var ships = config.ship_types.filter(function(entry) { return entry.deployment === 0 })
    ships = ships.filter(function(entry) { return entry.is_escapepod === 0 })
    for (var i in ships) {
      if (ships[i].id == ship_id) {
        el.append('<br />Ship Category #<span class="ansi-bright-yellow-fg">' + (parseInt(i) + 1) + '</span> &nbsp; Ship Class : ' + ships[i].class + '<br /><br />')
        el.append('The cost for one of those is <span class="ansi-bright-yellow-fg">' + addCommas(ships[i].cost_hold + ships[i].cost_drive + ships[i].cost_computer + ships[i].cost_hull) + '</span><br />')
        if (ships[i].cost_hold + ships[i].cost_drive + ships[i].cost_computer + ships[i].cost_hull > data.trader.credits + (tradeValue ? tradeValue : 0)) {
          el.append('<span class="ansi-bright-cyan-fg">You can not afford it!</span><br /><br />')
          el.append('<span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> ')
          shipCatalogMenu(data, destination, nextHop, method, route, true, true, data.ship.id, tradeValue)
        } else {
          el.append('<span class="ansi-magenta-fg">Want to buy it? </span>')
          booleanKey(function() { shipyardBuyNewShipName(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id) }, function() { el.append('Then don\'t waste my time!<br /><br />'); el.append('<span class="ansi-magenta-fg">Which ship are you interested in <span class="ansi-bright-yellow-fg">(?=List)</span> ?</span> '); shipCatalogMenu(data, destination, nextHop, method, route, true, true, data.ship.id, tradeValue) }, false)
        }
      }
    }
  }

  var shipyardBuyNewShipName = function(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id) {
    el.append('<form id="newShip"><div class="form-group"><label for="name"><span class="ansi-magenta-fg">What do you want to name this ship? (30 chars)</span></label><input type="text" class="form-control ansi-yellow-fg" id="name"></div></form>')
    $('#newShip #name').focus()
    $(document).on('submit.newShip', '#newShip', function(e) {
      e.preventDefault()
      $(document).off('.newShip')
      $('#newShip #name').blur()
      var name = $('<div />').text($('#newShip #name').val()).html()
      $('#newShip').replaceWith('<span class="ansi-magenta-fg">What do you want to name this ship? (30 chars)</span><br /><span class="ansi-yellow-fg">' + name + '</span><br />')
      el.append('<span class="ansi-magenta-fg">Do you want to set a password for this ship? (Y/N) </span>')
      booleanKey(function() { shipyardBuyNewShipPassword(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id, name) }, function() { shipyardBuyNewShipComplete(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id, name) }, false)
    })
  }

  var shipyardBuyNewShipPassword = function(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id, ship_name) {
    el.append('<form id="newShip"><div class="form-group"><label for="name"><span class="ansi-magenta-fg">Input Ship Password (10 chars)</span></label><input type="text" class="form-control ansi-yellow-fg" id="password"></div></form>')
    $('#newShip #password').focus()
    $(document).on('submit.newShip', '#newShip', function(e) {
      e.preventDefault()
      $(document).off('.newShip')
      $('#newShip #password').blur()
      var password = $('<div />').text($('#newShip #password').val()).html()
      $('#newShip').replaceWith('<span class="ansi-magenta-fg">Input Ship Password (10 chars) ' + password.toUpperCase() + '</span><br />')
      shipyardBuyNewShipComplete(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id, ship_name, password)
    })
  }

  var shipyardBuyNewShipComplete = function(data, destination, nextHop, method, route, tradeID, tradeValue, ship_id, ship_name, ship_password) {
    $.post('/ship/', { 'task': 'buynewship', 'sector_id': data.sector.id, 'trade_id': tradeID, 'trade_value': tradeValue, 'ship_id': ship_id, 'ship_name': ship_name, 'ship_password': ship_password }, function(result) {
      if (result.status == 'ok')
        $.get('/sector/current/', function(data) {
          if (!tradeID) {
            el.append('<br />Before you leave, the salesperson reminds you to move the<br />ship out of FedSpace as soon as possible, since the Feds<br />will repossess any unmanned ships left there overnight (no<br />littering!).')
            pressAnyKey(function() { el.append('<br /><br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route) })
            window.scrollTo(0, document.body.scrollHeight)
          } else {
            el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
            el.append(shipyardPrompt)
            shipyardEvents(data, destination, nextHop, method, route)
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
          el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
          el.append(shipyardPrompt)
          shipyardEvents(data, destination, nextHop, method, route)
        })
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
      el.append(shipyardPrompt)
      shipyardEvents(data, destination, nextHop, method, route)
    })
    window.scrollTo(0, document.body.scrollHeight)
  }

  var policeHQ = function(data, destination, nextHop, method, route) {
    if (data.trader.alignment >= 0) {
      var controller = AnsiLove.render('/ANSI/LIBRARY.ANS', function(canvas, sauce) {
        el.html(canvas)
        el.append('<br /><span class="ansi-bright-cyan-fg">The rather tough looking Sergeant at the front desk turns towards you.</span><br />')
        el.append(policePrompt)
        policeHQEvents(data, destination, nextHop, method, route)
      }, { 'bits': 8, '2x': (retina ? 1 : 0) } )
    } else {
      var controller = AnsiLove.render('/ANSI/POLICECL.ANS', function(canvas, sauce) {
        el.html(canvas)
        el.append(starDockPrompt)
        starDockEvents(data, destination, nextHop, method, route)
      }, { 'bits': 8, '2x': (retina ? 1 : 0) } )
    }
  }

  // TODO fedpolice bounties

  policeHQEvents = function(data, destination, nextHop, method, route) {
    menuEventHandler([
      { 'nextFunction': function() { el.append('You exit the Police Station.<br />' + starDockPrompt); starDockEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': policeMenu, 'attribute': 'menu', 'key': 13, 'noreset': true, 'addbreak': true },
      { 'nextFunction': policeMenu, 'attribute': 'menu', 'key': 63, 'noreset': true, 'addbreak': true },
      { 'nextFunction': policeHelp, 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': federalCommission, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'commission', 'key': 'A'.charCodeAt(), 'addbreak': true },
    ])
  }

  var claimReward = function(data, destination, nextHop, method, route) {
    el.append('So, you want to claim a reward eh? Just who is it you bagged?<br />')
    el.append('<form id="traderautocomplete"><div class="form-group"><label for="traders"><span class="ansi-magenta-fg">Which Trader ? (Full or Partial Name) - </span></label><input type="text" class="form-control ansi-magenta-fg" id="traders"></div></form>')
    var trader
    $('#traderautocomplete #traders').easyAutocomplete({
      'url': function(name) { return '/trader/search?q=' + name },
      'getValue': 'name',
      'requestDelay': 500,
      'theme': 'ansi',
      'list': {
        'match': {
          'enabled': true
        },
        onChooseEvent: function() {
          trader = $('#traderautocomplete #traders').getSelectedItemData()
          $('#traderautocomplete #traders').blur()
          $('#traderautocomplete').replaceWith('<span class="ansi-magenta-fg">Which Trader ? (Full or Partial Name) - ' + trader.name + '</span><br /><br />')
          el.append('<span class="ansi-magenta-fg show-entry">How many credits do you want to transfer? <span class="ansi-bright-yellow-fg">(' + addCommas((data.trader.balance + trader.balance > 500000 ? (500000 - trader.balance > data.trader.balance ? data.trader.balance : 500000 - trader.balance) : data.trader.balance)) + ')</span> </span>')
          menuEventHandler([
            { 'nextFunction': bankTransfer, 'nextFunctionArgs': [ data, destination, nextHop, method, route, trader.id ], 'failure': true, 'max': (data.trader.balance + trader.balance > 500000 ? (500000 - trader.balance > data.trader.balance ? data.trader.balance : 500000 - trader.balance) : data.trader.balance), 'addbreak': true },
            { 'nextFunction': bankTransfer, 'nextFunctionArgs': [ data, destination, nextHop, method, route, trader.id, (data.trader.balance + trader.balance > 500000 ? (500000 - trader.balance > data.trader.balance ? data.trader.balance : 500000 - trader.balance) : data.trader.balance) ], 'key': 13, 'addbreak': true }
          ])
        }
      }
    })
  }

  var federalCommission = function(data, destination, nextHop, method, route) {
    el.append('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;Apply for Federal Commission&gt;</span><br /><br />')
    if (data.trader.alignment >= 1000)
      el.append('You already are commissioned!<br />')
    else if (data.trader.alignment >= 500) {

      el.append('The Sergeans smiles warmly at you and ushers you into a side room<br />that you\'ve never been in before. Shortly a tall person with a<br />commanding presence enters the room.<br /><br />')
      el.append('<span class="ansi-bright-yellow-fg">"Congratulations! We\'ve had our eyes on you for some time now.<br /> Welcome to the ranks of the Federation!"</span><br /><br />')
      el.append('He then turns over to you the ship manuals for a Imperial Starship<br />and briefs you on command of one. He also outlines what the Federation<br />expects from you in return.<br /><br />')
      el.append('<span class="ansi-bright-yellow-fg">"From time to time we may call on you to help eradicate some problem<br /> Trader or help in the fight against the Ferrengi. We also expect you<br /> to maintain and even improve the already high standard that you have<br /> shown in the past! Do not drop below your new alignment or we will<br /> have to ah, um, *repossess* anything you might have gained from our<br /> help"</span><br /><br />')
      el.append('You leave this office with a new resolve to go forth and vanquish Evil!<br /><br />For joining the Federation your alignment becomes 1000!<br />')

      $.post('/trader/', { 'task': 'commission', 'sector_id': data.sector.id, 'ship_id': data.ship.id }, function(result) {
        if (result.status == 'ok')
          data.trader.alignment = 1000
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      })

    } else {

      el.append('The Sergeant scowls at you and declares you not worthy!<br />')
      if (data.trader.alignment < 100)
        el.append('<span class="ansi-bright-yellow-fg">"Try to not break any laws and defeat more villians!"</span><br />')
      else if (data.trader.alignment < 200)
        el.append('<span class="ansi-bright-yellow-fg">"You\'re going to have to work harder if you want to be commissioned!"</span><br />')
      else if (data.trader.alignment < 300)
        el.append('<span class="ansi-bright-yellow-fg">"You\'re definately improving now!"</span><br />')
      else if (data.trader.alignment < 400)
        el.append('<span class="ansi-bright-yellow-fg">"You still have a ways to go!"</span><br />')
      else
        el.append('<span class="ansi-bright-yellow-fg">"You\'re getting very close though, keep up the good work!"</span><br />')

    }

    el.append(policePrompt)
    policeHQEvents(data, destination, nextHop, method, route)

  }

  var library = function(data, destination, nextHop, method, route) {
    var controller = AnsiLove.render('/ANSI/LIBRARY.ANS', function(canvas, sauce) {
      el.html(canvas)
      el.append(libraryMenu)
      menuEventHandler([
        { 'nextFunction': libraryMenu, 'attribute': 'menu', 'key': 13, 'noreset': true },
        { 'nextFunction': libraryMenu, 'attribute': 'menu', 'key': 63, 'noreset': true },
      ])
    }, { 'bits': 8, '2x': (retina ? 1 : 0) } )
  }

  var emporium = function(data, destination, nextHop, method, route) {
    var controller = AnsiLove.render('/ANSI/EMPOROP.ANS', function(canvas, sauce) {
      el.html(canvas)
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      el.append(emporiumPrompt)
      emporiumEvents(data, destination, nextHop, method, route)
    }, { 'bits': 9, '2x': (retina ? 1 : 0) } )
  }

  var emporiumEvents = function(data, destination, nextHop, method, route) {
    menuEventHandler([
      { 'nextFunction': function() { el.append('See you later.<br />' + starDockPrompt); starDockEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporium, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'menu', 'key': 13 },
      { 'nextFunction': emporium, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'menu', 'key': 63 },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'detonators' ], 'attribute': 'detonators', 'key': 'A'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'beacons' ], 'attribute': 'beacons', 'key': 'B'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'corbomite' ], 'attribute': 'corbomite', 'key': 'C'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'cloaks' ], 'attribute': 'cloaks', 'key': 'D'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'probes' ], 'attribute': 'probes', 'key': 'E'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'planetscan' ], 'attribute': 'planetscan', 'key': 'F'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'class_2_mines' ], 'attribute': 'class_2_mines', 'key': 'L'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'class_1_mines' ], 'attribute': 'class_1_mines', 'key': 'M'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'photons' ], 'attribute': 'photons', 'key': 'P'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'scanner' ], 'attribute': 'scanner', 'key': 'R'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'disruptors' ], 'attribute': 'disruptors', 'key': 'S'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'genesis' ], 'attribute': 'genesis', 'key': 'T'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'transwarp' ], 'attribute': 'transwarp', 'key': 'W'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': emporiumProduct, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'psychic' ], 'attribute': 'psychic', 'key': 'Y'.charCodeAt(), 'addbreak': true }
    ])
  }

  var emporiumProduct = function(data, destination, nextHop, method, route, item) {
    switch (item) {
      case 'detonators':
        el.append('<br />We have the standard Nuerevy Atomic Detonator in stock, just<br />remember that these are VERY unstable! They have enough punch<br />to obliterate a planet, but they can just as easily blow you up!<br />We sell them for <span class="ansi-bright-yellow-fg">15,000</span> credits each.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Atomic Detonators', data.ship.detonators, data.ship.type.max_detonators, 15000)
        break
      case 'beacons':
        el.append('<br />We have the standard Sovremny Marker Beacon in stock, just<br />remember that these can be knocked out easily.<br />We sell them for <span class="ansi-bright-yellow-fg">100</span> credits each.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Beacons', data.ship.beacons, data.ship.type.max_beacons, 100)
        break
      case 'corbomite':
        el.append('<br />Corbomite Transducers can provide a VERY nasty shock to someone<br />trying to destroy your ship. Each Corbomite device in your ship<br />will cause a tremendous nuclear reaction equivalent to 20 battle<br />points when your ship is destroyed. They only cost <span class="ansi-bright-yellow-fg">1,000</span> credits<br />each and you can line every nook and cranny of your ship with them!<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Corbomite Transducers', data.ship.corbomite, data.ship.type.max_corbomite, 1000)
        break
      case 'cloaks':
        el.append('<br />Corellian Cloaking Devices do a very effective job of hiding you<br />from prying eyes. No one, not even your teammates, will be able<br />to find your ship when cloaked. This devices are only effective<br />when you\'re not moving though. You can engage them when you are<br />going to be sitting still for extended periods of time. Just<br />remember these self-powered devices only operate one time each.<br />These cost <span class="ansi-bright-yellow-fg">25,000</span> credits each.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Cloaking units', data.ship.cloaks, data.ship.type.max_cloak, 25000)
        break
      case 'probes':
        el.append('<br />We have Arrylex Ether Probes in stock. One of these will give<br />you a nice, detailed report along any course in Hyperspace. Don\'t<br />forget that they can be easily knocked out by hostile forces!<br />We sell them for <span class="ansi-bright-yellow-fg">3,000</span> credits each.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Probes', data.ship.probes, data.ship.type.max_probes, 3000)
        break
      case 'planetscan':
        if (data.ship.type.allow_planetscan) {
          el.append('<br />Planet Scanners can come in handy indeed! Many a Trader have<br />saved their hide by scanning a planet before trying to land on<br />it. A surprise blast from a Quasar Cannon can ruin your whole<br />day! These priceless units will give you a good idea about the<br />friendliness of a planet before you try to set down on it.<br /><br />')
          el.append('<span class="ansi-magenta-fg">I can let you have one for <span class="ansi-bright-yellow-fg">30,000</span> credits, interested? </span>')
          booleanKey(function() { emporiumProductBuy(data, destination, nextHop, method, route, item, 30000, 1) }, function() { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(emporiumPrompt); emporiumEvents(data, destination, nextHop, method, route) }, false)
        } else {
          el.append('<br />Sorry, your ship is not equipped for a Planet Scanner!<br />')
          el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
          el.append(emporiumPrompt)
          emporiumEvents(data, destination, nextHop, method, route)
        }
        break
      case 'class_1_mines':
        el.append('<br />We stock the traditional Armid Mines that do up to <span class="ansi-bright-yellow-fg">30</span> points of<br />damage. These cost <span class="ansi-bright-yellow-fg">1,000</span> credits each, but they are the smart<br />variety that won\'t seek you or your companions.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'mines', data.ship.class_1_mines, data.ship.type.max_mines, 1000)
        break
      case 'class_2_mines':
        el.append('<br />Ah yes! The revolutionary Marlin Limpet Mine! Quite a little beauty<br />these are. Just deploy them in a public area and wait for your competition<br />to sail through the sector. They attach noiselessly and are virtually<br />undetectable except by your personal scanner. We do, of course, offer<br />scanning services here at the Stardock and at Federation ports to clean<br />YOUR ship should you run afoul of these. They\'re quite a bargain<br />at only <span class="ansi-bright-yellow-fg">10,000</span> credits each.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'mines', data.ship.class_2_mines, data.ship.type.max_mines, 10000)
        break
      case 'photons':
        if (data.ship.type.max_photons > 0) {
          el.append('<br />The Photon Missile is a deadly offensive weapon indeed even though<br />it does no physical damage. More dangerous than a powerful attack,<br />the Photon Missile dampens the Alpha wave currents in most modern<br />equipment. When one of these jewels is detonated, your opponent\'s<br />defenses will be rendered USELESS! Please note that heavy shields<br />can block the Alpha wave effect of the Photon Missile. Unshielded<br />Ships and even planets can be rendered helpless with the blast of<br />one of these.<br /><br />We sell them for <span class="ansi-bright-cyan-fg">40,000</span> credits each.<br /><br />')
          emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Photon Missiles', data.ship.photons, data.ship.type.max_photons, 40000)
        } else {
          el.append('<br />Sorry, your ship is not equipped to handle Photon Missiles!<br />')
          el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
          el.append(emporiumPrompt)
          emporiumEvents(data, destination, nextHop, method, route)
        }
        break
      case 'scanner':
        if (data.ship.type.allow_densityscan) {
          el.append('<br />We have both the expensive IonStar Holographic Scanner and the cheaper<br />Gates Density Scanner in stock. The Density Scanner will only display<br />the relative density of the adjacent sectors whereas the Holographic<br />Scanners display as nice as if you were really there!<br /><br />')
          el.append('<span class="ansi-magenta-fg">The Holographic costs <span class="ansi-bright-yellow-fg">25,000</span> credits,<br />and the Density costs <span class="ansi-bright-yellow-fg">2,000</span> credits.<br /><br />Which would you like? <span class="ansi-bright-yellow-fg">(H/D/Quit)</span> ')
          menuEventHandler([
            { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, 25000, 2 ], 'attribute': 'holographic', 'key': 'H'.charCodeAt(), 'addbreak': true },
            { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, 2000, 1 ], 'attribute': 'density', 'key': 'D'.charCodeAt(), 'addbreak': true },
            { 'nextFunction': function() { el.append('Maybe some other time<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(emporiumPrompt); emporiumEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 13, 'addbreak': true },
            { 'nextFunction': function() { el.append('Maybe some other time<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(emporiumPrompt); emporiumEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
          ])
        } else {
          el.append('<br />Sorry, your ship is not equipped for a Long Range Scanner!<br />')
          el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
          el.append(emporiumPrompt)
          emporiumEvents(data, destination, nextHop, method, route)
        }
        break
      case 'disruptors':
        el.append('<br />Ever had one of those days? No matter where you went, Boom, Bash, you<br />kept running into someone\'s mines! Well these little Klygin Disruptors<br />can help you out! You merely launch one into an adjacent sector you know<br />has mines in it and these disruptors cause a reaction with the explosive<br />material in the mines. One of these can take out as many as 12 mines!<br />These cost <span class="ansi-bright-yellow-fg">6,000</span> credits each.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Mine Disruptors', data.ship.disruptors, data.ship.type.max_disruptors, 6000)
        break
      case 'genesis':
        el.append('<br />Planning on starting a colony eh? Well we have the traditional<br />Aldus Genesis Torpedo. They cost <span class="ansi-bright-yellow-fg">20,000</span> credits, but we think<br />thats pretty cheap for what you get.<br /><br />')
        emporiumProductPrompt(data, destination, nextHop, method, route, item, 'Genesis Torpedoes', data.ship.genesis, data.ship.type.max_genesis, 20000)
        break
      case 'transwarp':
        if (data.ship.type.allow_transwarp) {
          el.append('<br />Ah yes, the awesome Hyvarinen TransWarp Drive. Truly an incredible<br />piece of equipment. We have them in stock, of course and they come<br />with a full, money back guarantee. If they should ever blow you up,<br />just bring back the unused portion for a full refund.<br /><br />')
          el.append('<span class="ansi-magenta-fg">Type A: TransWarp a single ship, costs <span class="ansi-bright-yellow-fg">50,000</span> credits<br />Type B: TransWarp your ship plus a ship in tow, costs <span class="ansi-bright-yellow-fg">80,000</span> credits<br /><br />Upgrade Type A to Type B, costs <span class="ansi-bright-yellow-fg">40,000</span> credits<br /><br />Which would you like? <span class="ansi-bright-yellow-fg">(A/B/U/Quit)</span> </span>')
          menuEventHandler([
            { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, 50000, 1 ], 'attribute': 'type1', 'key': 'A'.charCodeAt(), 'addbreak': true },
            { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, 80000, 2 ], 'attribute': 'type2', 'key': 'B'.charCodeAt(), 'addbreak': true },
            { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, 40000, 3 ], 'attribute': 'upgrade', 'key': 'U'.charCodeAt(), 'addbreak': true },
            { 'nextFunction': function() { el.append('Maybe some other time<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(emporiumPrompt); emporiumEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 13, 'addbreak': true },
            { 'nextFunction': function() { el.append('Maybe some other time<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(emporiumPrompt); emporiumEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
          ])
        } else {
          el.append('<br />Sorry, your ship is not equipped for a TransWarp Drive!<br />')
          el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
          el.append(emporiumPrompt)
          emporiumEvents(data, destination, nextHop, method, route)
        }
        break
      case 'psychic':
        el.append('<br />Ah yes, the Trantorian Psychic Probe. Getting a little suspicious<br />about the prices you\'ve been getting at the Starports eh? Well<br />this jewel will let you know how close you really came to their<br />bottom dollar. These pay for themselves very quickly!<br /><br />')
        el.append('<span class="ansi-magenta-fg">I can let you have one for <span class="ansi-bright-yellow-fg">10,000</span> credits, interested? </span>')
        booleanKey(function() { emporiumProductBuy(data, destination, nextHop, method, route, item, 10000, 1) }, function() { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); el.append(emporiumPrompt); emporiumEvents(data, destination, nextHop, method, route) }, false)
        break
    }
  }

  var emporiumProductPrompt = function(data, destination, nextHop, method, route, item, itemName, cur, max, price) {
    el.append('How many ' + itemName + ' do you want <span class="ansi-bright-cyan-fg">(Max ' + ((max - cur) * price > data.trader.credits ? Math.floor(data.trader.credits / price) : max - cur) + ')</span> <span class="ansi-bright-yellow-fg">[0]</span> ? <span class="show-entry"></span>')
    menuEventHandler([
      { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, price ], 'failure': true, 'max': ((max - cur) * price > data.trader.credits ? Math.floor(data.trader.credits / price) : max - cur), 'addbreak': true },
      { 'nextFunction': emporiumProductBuy, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, price, 0 ], 'key': 13, 'addbreak': true }
    ])
  }

  var emporiumProductBuy = function(data, destination, nextHop, method, route, item, price, quantity) {
    if (quantity == 0) {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      el.append(emporiumPrompt)
      emporiumEvents(data, destination, nextHop, method, route)
      return
    }
    $.post('/ship/', { 'task': 'buyhardware', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'item': item, 'quantity': quantity }, function(result) {
      if (result.status == 'ok') {
        switch (item) {
          case 'detonators':
            data.ship.detonators += quantity
            data.trader.credits -= quantity * 15000
            break
          case 'beacons':
            data.ship.beacons += quantity
            data.trader.credits -= quantity * 100
            break
          case 'corbomite':
            data.ship.corbomite += quantity
            data.trader.credits -= quantity * 1000
            break
          case 'cloaks':
            data.ship.cloaks += quantity
            data.trader.credits -= quantity * 25000
            break
          case 'probes':
            data.ship.probes += quantity
            data.trader.credits -= quantity * 3000
            break
          case 'planetscan':
            el.append('Ok! We\'ll get that installed in your ship right away!<br />')
            data.ship.planetscan = 1
            data.trader.credits -= 30000
            break
          case 'class_1_mines':
            data.ship.class_1_mines += quantity
            data.trader.credits -= quantity * 10000
            break
          case 'class_2_mines':
            data.ship.class_2_mines += quantity
            data.trader.credits -= quantity * 1000
            break
          case 'photons':
            data.ship.photons += quantity
            data.trader.credits -= quantity * 25000
            break
          case 'scanner':
            el.append('Ok! We\'ll get that sent over to your ship, installation is free!<br />')
            data.ship.scanner = quantity
            break
          case 'disruptors':
            data.ship.disruptors += quantity
            data.trader.credits -= quantity * 6000
            break
          case 'genesis':
            data.ship.genesis += quantity
            data.trader.credits -= quantity * 20000
            break
          case 'transwarp':
            el.append('Ok! We\'ll get that installed in your ship right away!<br />')
            switch (quantity) {
              case 1:
                el.append('Don\'t forget, you\'ll need lots of Fuel Ore for this.<br />')
                data.ship.transwarp = 1
                data.trader.credits -= 50000
                break
              case 2:
                el.append('Don\'t forget, you\'ll need lots of Fuel Ore for this.<br />')
                data.ship.transwarp = 2
                data.trader.credits -= 80000
                break
              case 3:
                data.ship.transwarp = 2
                data.trader.credits -= 40000
                break
            }
            break
          case 'psychic':
            el.append('Ok! We\'ll get that installed in your ship right away!<br />')
            data.ship.psychic = 1
            data.trader.credits -= 10000
            break
        }
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      el.append(emporiumPrompt)
      emporiumEvents(data, destination, nextHop, method, route)
    })
  }

  var bank = function(data, destination, nextHop, method, route) {
    var controller = AnsiLove.render('/ANSI/GALABANK.ANS', function(canvas, sauce) {
      el.html(canvas)
      el.append('<br /><span class="ansi-bright-cyan-fg">An automated TellBorg turns towards you.</span><br /><br />')
      el.append(bankPrompt)
      bankEvents(data, destination, nextHop, method, route)
    }, { 'bits': 9, '2x': (retina ? 1 : 0)})
  }

  var bankEvents = function(data, destination, nextHop, method, route) {
    menuEventHandler([
      { 'nextFunction': function() { el.append('You leave the Galactic Bank<br />' + starDockPrompt); starDockEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': bankMenu, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'menu', 'key': 13, 'noreset': true },
      { 'nextFunction': bankMenu, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'menu', 'key': 63, 'noreset': true },
      { 'nextFunction': bankBalance, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'balance', 'key': 'E'.charCodeAt(), 'addbreak': true, 'noreset': true },
      { 'nextFunction': bankDeposit, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'balance', 'key': 'D'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': bankWithdraw, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'balance', 'key': 'W'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': bankTransfer, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'balance', 'key': 'T'.charCodeAt(), 'addbreak': true },
    ])
  }

  var bankBalance = function(data, destination, nextHop, method, route) {
    el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.balance) + '</span> credits in your account.<br />' + bankPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var bankTransfer = function(data, destination, nextHop, method, route, trader_id, amount) {
    if (trader_id && amount >= 0) {
      if (amount == 0) {
        el.append(bankPrompt)
        bankEvents(data, destination, nextHop, method, route)
      } else {
        $.post('/trader/', { 'task': 'bankTransfer', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'amount': amount, 'trader': trader_id }, function(result) {
          if (result.status == 'ok') {
            data.trader.balance -= amount
            el.append('<span class="ansi-bright-yellow-fg">' + addCommas(amount) + '</span> credits have been transferred from your account.<br />')
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
        }).always(function() {
          el.append(bankPrompt)
          bankEvents(data, destination, nextHop, method, route)
        })
      }
    } else {
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.balance) + '</span> credits in your account.<br /><br />')
      el.append('Who do you want to transfer money to?<br />')
      el.append('<form id="traderautocomplete"><div class="form-group"><label for="traders"><span class="ansi-magenta-fg">Which Trader ? (Full or Partial Name) - </span></label><input type="text" class="form-control ansi-magenta-fg" id="traders"></div></form>')
      var trader
      $('#traderautocomplete #traders').easyAutocomplete({
        'url': function(name) { return '/trader/search?q=' + name },
        'getValue': 'name',
        'requestDelay': 500,
        'theme': 'ansi',
        'list': {
          'match': {
            'enabled': true
          },
          onChooseEvent: function() {
            trader = $('#traderautocomplete #traders').getSelectedItemData()
            $('#traderautocomplete #traders').blur()
            $('#traderautocomplete').replaceWith('<span class="ansi-magenta-fg">Which Trader ? (Full or Partial Name) - ' + trader.name + '</span><br /><br />')
            el.append('<span class="ansi-magenta-fg show-entry">How many credits do you want to transfer? <span class="ansi-bright-yellow-fg">(' + addCommas((data.trader.balance + trader.balance > 500000 ? (500000 - trader.balance > data.trader.balance ? data.trader.balance : 500000 - trader.balance) : data.trader.balance)) + ')</span> </span>')
            menuEventHandler([
              { 'nextFunction': bankTransfer, 'nextFunctionArgs': [ data, destination, nextHop, method, route, trader.id ], 'failure': true, 'max': (data.trader.balance + trader.balance > 500000 ? (500000 - trader.balance > data.trader.balance ? data.trader.balance : 500000 - trader.balance) : data.trader.balance), 'addbreak': true },
              { 'nextFunction': bankTransfer, 'nextFunctionArgs': [ data, destination, nextHop, method, route, trader.id, (data.trader.balance + trader.balance > 500000 ? (500000 - trader.balance > data.trader.balance ? data.trader.balance : 500000 - trader.balance) : data.trader.balance) ], 'key': 13, 'addbreak': true }
            ])
          }
        }
      })
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var bankDeposit = function(data, destination, nextHop, method, route, amount) {
    if (amount >= 0) {
      $.post('/trader/', { 'task': 'bankDeposit', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'amount': amount }, function(result) {
        if (result.status == 'ok') {
          data.trader.credits -= amount
          data.trader.balance += amount
          el.append('<span class="ansi-bright-yellow-fg">' + addCommas(amount) + '</span> credits have been deposited in your account.')
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      }).always(function() {
        el.append(bankPrompt)
        bankEvents(data, destination, nextHop, method, route)
      })
    } else {
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.balance) + '</span> credits in your account.<br />')
      el.append('<span class="ansi-magenta-fg show-entry">How many credits do you want to deposit? <span class="ansi-bright-yellow-fg">(' + addCommas((data.trader.credits + data.trader.balance > 500000 ? 500000 - data.trader.balance : data.trader.credits)) + ')</span> </span>')
      menuEventHandler([
        { 'nextFunction': bankDeposit, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'failure': true, 'max': (data.trader.credits + data.trader.balance > 500000 ? 500000 - data.trader.balance : data.trader.credits), 'addbreak': true },
        { 'nextFunction': bankDeposit, 'nextFunctionArgs': [ data, destination, nextHop, method, route, (data.trader.credits + data.trader.balance > 500000 ? 500000 - data.trader.balance : data.trader.credits) ], 'key': 13, 'addbreak': true }
      ])
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var bankWithdraw = function(data, destination, nextHop, method, route, amount) {
    if (amount >= 0) {
      $.post('/trader/', { 'task': 'bankWithdraw', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'amount': amount }, function(result) {
        if (result.status == 'ok') {
          data.trader.credits += amount
          data.trader.balance -= amount
          el.append('<span class="ansi-bright-yellow-fg">' + addCommas(amount) + '</span> credits have been withdrawn from your account.')
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      }).always(function() {
        el.append(bankPrompt)
        bankEvents(data, destination, nextHop, method, route)
      })
    } else {
      el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.balance) + '</span> credits in your account.<br />')
      el.append('<span class="ansi-magenta-fg show-entry">How many credits do you want to withdraw? <span class="ansi-bright-yellow-fg">(' + addCommas(data.trader.balance) + ')</span> </span>')
      menuEventHandler([
        { 'nextFunction': bankWithdraw, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'failure': true, 'max': (data.trader.balance), 'addbreak': true },
        { 'nextFunction': bankWithdraw, 'nextFunctionArgs': [ data, destination, nextHop, method, route, (data.trader.balance) ], 'key': 13, 'addbreak': true }
      ])
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var cineplex = function(data, destination, nextHop, method, route, film) {
    if (film) {
      switch (film) {
        case 'vulcan':
          el.append('<br />You\'ll LOVE "Vulcan Thunder" hehheh<br />100 Credits Please <span class="ansi-magenta-fg">(Pay it? Y/N)</span> ')
          booleanKey(function() { var controller = AnsiLove.animate('/ANSI/VULCANTH.ANS', function(canvas, sauce) { el.html(canvas); controller.play(2400, function() { starDock(data, destination, nextHop, method, route, true); }); }, { 'bits': 9, '2x': (retina ? 1 : 0) }) }, function() { starDock(data, destination, nextHop, method, route, true) }, false)
          break
        case 'ferrengi':
          el.append('<br />"Ferrengi Nights" is sound out, sorry')
          setTimeout(function() { cineplex(data, destination, nextHop, method, route) }, 1000)
          break
        case 'startrek':
          el.append('<br />You\'ll LOVE "Star Trek XXV!" hehheh<br />100 Credits Please <span class="ansi-magenta-fg">(Pay it? Y/N)</span> ')
          booleanKey(function() { var controller = AnsiLove.animate('/ANSI/STARTREK.ANS', function(canvas, sauce) { el.html(canvas); controller.play(2400, function() { starDock(data, destination, nextHop, method, route, true); }); }, { 'bits': 9, '2x': (retina ? 1 : 0) }) }, function() { starDock(data, destination, nextHop, method, route, true) }, false)
          break
        case 'neutron':
          el.append('<br />No, "Lil\' Neutron" is sound out, Choose Again')
          setTimeout(function() { cineplex(data, destination, nextHop, method, route) }, 1000)
          break
        case 'debbie':
          el.append('<br />You\'ll LOVE "Debbie" everyone does<br />200 Credits Please <span class="ansi-magenta-fg">(Pay it? Y/N)</span> ')
          booleanKey(function() { var controller = AnsiLove.animate('/ANSI/DEBBIEDO.ANS', function(canvas, sauce) { el.html(canvas); controller.play(2400, function() { starDock(data, destination, nextHop, method, route, true); }); }, { 'bits': 9, '2x': (retina ? 1 : 0) }) }, function() { starDock(data, destination, nextHop, method, route, true) }, false)
          break
      }
    } else {
      var controller = AnsiLove.animate('/ANSI/CINEPLEX.ANS', function(canvas, sauce) {
        el.html(canvas)
        controller.play(115200000, function() { })
          menuEventHandler([
            { 'nextFunction': function() { el.append(starDockPrompt); starDockEvents(data, destination, nextHop, method, route) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt() },
            { 'nextFunction': cineplex, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'vulcan' ], 'attribute': 'vulcan', 'key': 'A'.charCodeAt() },
            { 'nextFunction': cineplex, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'ferrengi' ], 'attribute': 'ferrengi', 'key': 'B'.charCodeAt() },
            { 'nextFunction': cineplex, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'startrek' ], 'attribute': 'startrek', 'key': 'C'.charCodeAt() },
            { 'nextFunction': cineplex, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'neutron' ], 'attribute': 'neutron', 'key': 'D'.charCodeAt() },
            { 'nextFunction': cineplex, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'debbie' ], 'attribute': 'debbie', 'key': 'E'.charCodeAt() },
          ])
      }, { 'bits': 9, '2x': (retina ? 1 : 0) })
    }
  }

  var starDockMenu = function() {
    el.append('<br /><br /><div class="row"><div class="col-xs-3 text-center">Obvious places to go are<span class="ansi-bright-yellow-fg">:</span></div></div><br />')
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="cineplex">C</a>&gt;</span> <span class="ansi-bright-cyan-fg">The CinePlex Videon Theatres</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="bank">G</a>&gt;</span> <span class="ansi-bright-cyan-fg">The 2nd National Galactic Bank</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="hardware">H</a>&gt;</span> <span class="ansi-bright-cyan-fg">The Stellar Hardware Emporium</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="library">L</a>&gt;</span> <span class="ansi-bright-cyan-fg">The Libram Universitatus</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="police">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">The Federal Space Police HQ</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="shipyards">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">The Federation Shipyards</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="tavern">T</a>&gt;</span> <span class="ansi-bright-cyan-fg">The Lost Trader\'s Tavern</span>'))
    menu.append($('<li></li>').html('<br />'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="product">!</a>&gt;</span> <span class="ansi-yellow-fg">StarDock Help</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-yellow-fg">Return to your ship and leave</span>'))
    el.append(menu)
    el.append(starDockPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var bankMenu = function() {
    el.append('<br /><br /><div class="row"><div class="col-xs-2 text-center">The Galactic Bank<span class="ansi-bright-yellow-fg">:</span></div></div><br />')
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="deposit">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Make a Deposit</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="balance">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Examine Balance</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="transfer">T</a>&gt;</span> <span class="ansi-bright-cyan-fg">Transfer Funds</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="withdraw">W</a>&gt;</span> <span class="ansi-bright-cyan-fg">Withdraw Funds</span>'))
    menu.append($('<li></li>').html('<br />'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="product">!</a>&gt;</span> <span class="ansi-yellow-fg">StarDock Help</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-yellow-fg">Return to your ship and leave</span>'))
    el.append(menu)
    el.append(bankPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var libraryMenu = function() {
    el.append('<br /><br /><div class="row"><div class="col-xs-6 text-center">Main Index</div></div><br />')
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="aliens">A</a>&gt;</span> Archive of Alien Races'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="galactic">B</a>&gt;</span> Archive of Galactic Organizations'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="misc">C</a>&gt;</span> Miscellaneous Documents'))
    menu.append($('<li></li>').html('<br />'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> To Leave'))
    el.append(menu)
    el.append(libraryPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var policeMenu = function() {
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="commission">A</a>&gt;</span> <span class="ansi-bright-cyan-fg">Apply for a Federal Commission</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="claimreward">C</a>&gt;</span> <span class="ansi-bright-cyan-fg">Claim a Federation Reward</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="wanted">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Examine the Ten Most Wanted List</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="postreward">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Post a Reward on someone</span>'))
    menu.append($('<li></li>').html('<br />'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-yellow-fg">FedPolice Help</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-yellow-fg">Leave the Police Station</span>'))
    el.append(menu)
    el.append(policePrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var shipyardMenu = function(data) {
    el.append('<br /><div class="row"><div class="col-xs-3 text-center">The Federation Shipyards<span class="ansi-bright-yellow-fg">:</span></div></div><br />')
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="buy">B</a>&gt;</span> <span class="ansi-bright-cyan-fg">Buy a New Ship</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="sell">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">Sell extra Ships</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="examine">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Examine Ship Specs</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="port">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Buy Class 0 Items</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="registration">R</a>&gt;</span> <span class="ansi-bright-cyan-fg">Change Ship Registration</span>'))
    menu.append($('<li></li>').html('<br />'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-yellow-fg">Shipyards Help</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-yellow-fg">Leave the Shipyards</span>'))
    el.append(menu)
    el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
    el.append(shipyardPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var portDestroyed = function(data) {
    el.append('<br /><span class="ansi-bright-cyan-fg">CAPTAIN! Now you\'ve done it! Radiation levels are exceeding the<br />capacity of our shields. The mains have all shut down and we<br />can\'t get the trans warp drive to activate... This is it<br />Captain, we\'re all going to die!')
    data.trader.deaths_since_extern += 1
    ownShipDestroyed(data.trader.experience * .1, 0, data)
  }

  var portAttack = function(data, destination, nextHop, method, route) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Attack Port&gt;</span><br />')
    el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">All systems ready for assault on Star Port ' + data.sector.port.name + '</span><br />')
    el.append('<br /><span class="ansi-bright-red-fg">Attacks on Federation ports are prohibited!<br />')
    el.append('<br /><span class="ansi-bright-yellow-fg">Captain, you do realize what this will mean?<br />Are you sure you want to really destroy this port?')
    booleanKey(function() { portAttackDisplay(data, destination, nextHop, method, route) }, function() { el.append('<span class="ansi-magenta-fg">Your first officer smiles and says that he\'s glad you changed<br />your mind.</span><br />'); if (destination) portAutopilotEnd(data, destination, nextHop, method, route); else displaySectorCommand(data); }) 
  }

  var portAttackDisplay = function(data, destination, nextHop, method, route) {
    var defense = portCalcDefense(data.sector.port.class, data.sector.port.fuel, data.sector.port.fuel_prod, data.sector.port.organics, data.sector.port.organics_prod, data.sector.port.equipment, data.sector.port.equipment_prod)
    el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">Now scanning defensive structure and armament of port</span><br />')
    el.append('<br /><span class="ansi-bright-cyan-fg">This port has a defensive rating of ' + addCommas(defense) + '</span><br />')
    if (defense <= 80)
      el.append('<span class="ansi-magenta-fg">No shielding evident<span class="ansi-bright-yellow-fg">,</span> plasma lasers on dock.</span><br />')
    else if (defense < 85)
      el.append('<span class="ansi-magenta-fg">Class 1 shielding evident<span class="ansi-bright-yellow-fg">,</span> neutron laser array.</span><br />')
    else if (defense < 90)
      el.append('<span class="ansi-magenta-fg">Class 2 shielding evident<span class="ansi-bright-yellow-fg">,</span> Halos missile battery.</span><br />')
    else if (defense < 90)
      el.append('<span class="ansi-magenta-fg">Class 2 shielding evident<span class="ansi-bright-yellow-fg">,</span> Halos missile battery.</span><br />')
    else if (defense < 95)
      el.append('<span class="ansi-magenta-fg">Class 3 shielding evident<span class="ansi-bright-yellow-fg">,</span> Tri-phase matter-xmitter</span><br />')
    else if (defense < 100)
      el.append('<span class="ansi-magenta-fg">Class 4 shielding evident<span class="ansi-bright-yellow-fg">,</span> Sunstorm Ion battery.</span><br />')
    else if (defense < 102)
      el.append('<span class="ansi-magenta-fg">Class 5 shielding evident<span class="ansi-bright-yellow-fg">,</span> Touernik Starburst defenses.</span><br />')
    else
      el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">Captain!@!@! That\'s a massive port! We don\'t stand a chance!<br />You don\'t really want to do this do you?</span><br />')

    el.append('<br /><span class="ansi-bright-cyan-fg">The battle begins...<span><br />')

    el.append('<br /><span class="ansi-magenta-fg show-entry">You have <span class="ansi-bright-yellow-fg">' + data.ship.fighters + '</span> fighters and <span class="ansi-bright-yellow-fg">' + data.ship.shields + '</span> shields left.<br />How many fighters do you wish to use? ')

    menuEventHandler([
      { 'nextFunction': portAttackFigs, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'failure': true, 'max': (data.ship.type.max_fighters_per_attack > data.ship.fighters ? data.ship.fighters : data.ship.type.max_fighters_per_attack) }
    ])

    window.scrollTo(0, document.body.scrollHeight)
  }

  var portAttackFigs = function(data, destination, nextHop, method, route, fighters) {

    if (fighters == 0 || fighters > data.ship.fighters) {
      if (destination)
        portAutopilotEnd(data, destination, nextHop, method, route)
      else {
        el.append('<br />')
        displaySectorCommand(data)
      }
      return 
    }

    el.append('<br />For attacking this port your alignment went down by <span class="ansi-bright-yellow-fg">5</span> point(s).<br />')
    data.trader.alignment -= 5

    var base = Math.random() * 2 + 1 // random float between 1 and 3
    var prodSub = Math.floor((fighters * base * data.ship.type.offensive_odds) / 10)
    var portDefenses = portCalcDefense(data.sector.port.class, data.sector.port.fuel, data.sector.port.fuel_prod, data.sector.port.organics, data.sector.port.organics_prod, data.sector.port.equipment, data.sector.port.equipment_prod)

    var initialFuel = data.sector.port.fuel
    var initialFuelProd = data.sector.port.fuel_prod
    var initialOrganics = data.sector.port.organics
    var initialOrganicsProd = data.sector.port.organics_prod
    var initialEquipment = data.sector.port.equipment
    var initialEquipmentProd = data.sector.port.equipment_prod

    data.sector.port.fuel_prod -= prodSub
    data.sector.port.organics_prod -= prodSub
    data.sector.port.equipment_prod -= prodSub

    if (data.sector.port.fuel_prod < 0)
      data.sector.port.fuel_prod = 0
    if (data.sector.port.organics_prod < 0)
      data.sector.port.organics_prod = 0
    if (data.sector.port.equipment_prod < 0)
      data.sector.port.equipment_prod = 0

    if (data.sector.port.fuel_prod * 10 < data.sector.port.fuel)
      data.sector.port.fuel = data.sector.port.fuel_prod * 10
    if (data.sector.port.organics_prod * 10 < data.sector.port.organics)
      data.sector.port.organics = data.sector.port.organics_prod * 10
    if (data.sector.port.equipment_prod * 10 < data.sector.port.equipment)
      data.sector.port.equipment = data.sector.port.equipment_prod * 10

    if (portCalcDefense(data.sector.port.class, data.sector.port.fuel, data.sector.port.fuel_prod, data.sector.port.organics, data.sector.port.organics_prod, data.sector.port.equipment, data.sector.port.equipment_prod) <= 0) {
      var controller = AnsiLove.animate('/ANSI/STRPRTDS.ANS', function(canvas, sauce) {
        el.html(canvas)
        var figsLost
        // determine lowest number of figs to successfully destroy port
        for (var i = 1; i <= fighters; i++) {
          var thisProdSub = Math.floor((i * base * data.ship.type.offensive_odds) / 10)

          var thisFuelProd = (initialFuelProd - thisProdSub < 0 ? 0 : initialFuelProd - thisProdSub)
          var thisOrganicsProd = (initialOrganicsProd - thisProdSub < 0 ? 0 : initialOrganicsProd - thisProdSub)
          var thisEquipmentProd = (initialEquipmentProd - thisProdSub < 0 ? 0 : initialEquipmentProd - thisProdSub)

          var thisFuel = (thisFuelProd * 10 < initialFuel ? thisFuelProd * 10 : initialFuel)
          var thisOrganics = (thisOrganicsProd * 10 < initialOrganics ? thisOrganicsProd * 10 : initialOrganics)
          var thisEquipment = (thisEquipmentProd * 10 < initialEquipment ? thisEquipmentProd * 10 : initialEquipment)

          if (portCalcDefense(data.sector.port.class, thisFuel, thisFuelProd, thisOrganics, thisOrganicsProd, thisEquipment, thisEquipmentProd) <= 0) {
            figsLost = i
            break
          }
        }
        $.post('/port/', { 'task': 'destroy', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'port_id': data.sector.port.id, 'base': base, 'fighters': fighters, 'figsLost': figsLost }, function(result) {
          if (result.status == 'ok') {
            el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">You destroyed the Star Port!</span><br />')
            el.append('You lost <span class="ansi-bright-yellow-fg">' + figsLost + '</span> fighter(s)<br />')
            el.append('For destroying this StarPort you receive <span class="ansi-bright-yellow-fg">50</span> experience point(s).<br />')
            el.append('and your alignment went down by <span class="ansi-bright-yellow-fg">50</span> point(s).<br />')
            data.sector.navhaz += 25
            data.sector.port.destroyed = true
            data.trader.alignment -= 50
            data.trader.experience += 50
            data.ship.fighters -= figsLost
            if (destination)
              portAutopilotEnd(data, destination, nextHop, method, route)
            else
              displaySectorCommand(data)
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
          getSectorData(displayCurrentSector)
        })
        controller.play(14400, function() { })
      }, { 'bits': 8, '2x': (retina ? 1 : 0) })
    } else {
      data.ship.fighters -= fighters
      $.post('/port/', { 'task': 'attack', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'port_id': data.sector.port.id, 'base': base, 'fighters': fighters }, function(result) {
        if (result.status == 'ok') {
          el.append('You lost <span class="ansi-bright-yellow-fg">' + fighters + '</span> fighter(s)<br /><br />')
          el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">Incoming laser barrage from </span><span class="ansi-bright-yellow-fg">' + data.sector.port.name + '</span><br />')
          el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">The laser blasts rock your ship!</span><br />')
          el.append('The console reports damages of <span class="ansi-bright-yellow-fg">' + result.damage + '</span> battle points!<br />')
          if (data.ship.shields >= result.damage) {
            el.append('Your ship\'s shields absorb the brunt of the explosion!<br />')
            data.ship.shields -= result.damage 
            el.append('<br /><span class="ansi-magenta-fg show-entry">You have <span class="ansi-bright-yellow-fg">' + data.ship.fighters + '</span> fighters and <span class="ansi-bright-yellow-fg">' + data.ship.shields + '</span> shields left.<br />How many fighters do you wish to use? ')
            menuEventHandler([
              { 'nextFunction': portAttackFigs, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'failure': true, 'max': (data.ship.type.max_fighters_per_attack > data.ship.fighters ? data.ship.fighters : data.ship.type.max_fighters_per_attack) }
            ])
          } else if (result.damage > data.ship.fighters + data.ship.shields) {
            el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">Life Support knocked out! Energy generation shut down!</span><br /><br />')
            el.append('<span class="ansi-bright-cyan-fg">You rush to your escape pod and abandon ship.</span><br />');
            el.append('For getting blown up you LOSE <span class="ansi-bright-yellow-fg">25</span> experience point(s).<br />')
            data.trader.deaths_since_extern += 1
            ownShipDestroyed(result.experience, 0, data)
          } else {
            el.append('<span class="ansi-bright-yellow-fg">' + (result.damage - data.ship.shields) + '</span> K3-A Fighters destroyed by the blast!<br />')
            if (data.ship.shields > 0) {
              data.ship.fighters += data.ship.shields
              data.ship.shields = 0
            }
            data.ship.fighters -= result.damage 
            el.append('<br /><span class="ansi-magenta-fg show-entry">You have <span class="ansi-bright-yellow-fg">' + data.ship.fighters + '</span> fighters and <span class="ansi-bright-yellow-fg">' + data.ship.shields + '</span> shields left.<br />How many fighters do you wish to use? ')
            menuEventHandler([
              { 'nextFunction': portAttackFigs, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'failure': true, 'max': (data.ship.type.max_fighters_per_attack > data.ship.fighters ? data.ship.fighters : data.ship.type.max_fighters_per_attack) }
            ])
          }
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      })
      window.scrollTo(0, document.body.scrollHeight)
    }
  }

  var portCalcDefense = function(portClass, fuel, fuel_prod, organics, organics_prod, equipment, equipment_prod) {
    var min = (fuel_prod + organics_prod + equipment_prod) / 10
    var max = min * 1.5
    var diff = max - min
    if (diff == 0)
      return 0
    var avg = 0
    for (var i=0; i < 3; i++) { 
      var thisItem = resolvePortClass(portClass, true).charAt(i)
      switch (i) {
        case 0:
          avg += (thisItem == 'S' ? fuel_prod * 10 / fuel : fuel_prod * 10 / ( fuel_prod * 10 - fuel))
          break
        case 1:
          avg += (thisItem == 'S' ? organics_prod * 10 / organics : organics_prod * 10 / ( organics_prod * 10 - organics))
          break
        case 2:
          avg += (thisItem == 'S' ? equipment_prod * 10 / equipment : equipment_prod * 10 / ( equipment_prod * 10 - equipment))
          break
      }
    }
    avg = avg / 3
    return Math.round(min + (diff * (avg / 100)))
  }

  var portDockingLogTimeFormat = function(time) {
    var date = new Date(time)
    var diff = (((new Date()).getTime() - date.getTime()) / 1000)
    var day_diff = Math.floor(diff / 86400)
    if (diff < 60)
      return 'just left'
    else if (diff < 120)
      return 'docked <span class="ansi-bright-cyan-fg">1</span> minutes ago'
    else if (diff < 3600)
      return 'docked <span class="ansi-bright-cyan-fg">' + Math.floor(diff / 60) + '</span> minutes ago'
    else if (diff < 86400)
      return 'docked <span class="ansi-bright-cyan-fg">' + Math.floor(diff / 3600) + '</span> hours and <span class="ansi-bright-cyan-fg">' + Math.floor((diff - (Math.floor(diff / 3600) * 60 * 60)) / 60) + '</span> minutes ago'
    else if (day_diff >= 1)
      return 'docked <span class="ansi-bright-cyan-fg">' + day_diff + '</span> days(s) ago'
  }

  var portTrade = function(data, destination, nextHop, method, route) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Port&gt;</span><br />')
    el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">Docking...</span>')
    deductTurn(data)
    if (data.sector.port.class == 0) {
      el.append('You have <span class="ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      var controller = AnsiLove.render('/ANSI/PORTONE.ANS', function(canvas, sauce) {
        el.append(canvas)
        portClass0Items(data, destination, nextHop, method, route)
      }, { 'bits': 9, '2x': (retina ? 1 : 0) })
    } else {
      el.append('<br /><span class="ansi-bright-yellow-fg">Commerce report for <span class="ansi-bright-cyan-fg">' + data.sector.port.name + '</span>: ' + getPortReportDate() + '</span><br /><br />')
      el.append('<span class="ansi-magenta-fg">-=-=- &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Docking Log &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; -=-=-</span><br />')
      if (data.sector.port.last_ship)
        el.append('<span class="ansi-bright-cyan-fg">' + data.sector.port.last_ship + '</span> ' + portDockingLogTimeFormat(data.sector.port.last_time + '+000') + '.<br /><br />')
      else
        el.append('No current ship docking log on file.<br />For finding this neglected port you receive <span class="ansi-bright-yellow-fg">1</span> experience point(s).<br /><br />')
      var table = $('<table>').addClass('table table-condensed port')
      table.append($('<thead>').addClass('ansi-green-fg').html('<tr><td>Items</td><td>Status</td><td>Trading</td><td>% of max</td><td>OnBoard</td></tr>'))
      table.append($('<tr>').html('<td class="ansi-bright-cyan-fg" style="text-align: left">Fuel Ore</td><td class="ansi-green-fg" style="text-align: left">' + (resolvePortClass(data.sector.port.class, true).charAt(0) == 'S' ? 'Selling' : 'Buying') + '</td><td class="ansi-bright-cyan-fg">' + (resolvePortClass(data.sector.port.class, true).charAt(0) == 'S' ? data.sector.port.fuel : (data.sector.port.fuel_prod * 10 - data.sector.port.fuel)) + '</td><td class="ansi-green-fg">' + (resolvePortClass(data.sector.port.class, true).charAt(0) == 'S' ? Math.floor(data.sector.port.fuel / (data.sector.port.fuel_prod * 10) * 100) : Math.floor((data.sector.port.fuel_prod * 10 - data.sector.port.fuel) / (data.sector.port.fuel_prod * 10) * 100)) + '<span class="ansi-bright-red-fg">%</span></td><td class="ansi-cyan-fg">' + data.ship.fuel + '</td>'))
      table.append($('<tr>').html('<td class="ansi-bright-cyan-fg" style="text-align: left">Organics</td><td class="ansi-green-fg" style="text-align: left">' + (resolvePortClass(data.sector.port.class, true).charAt(1) == 'S' ? 'Selling' : 'Buying') + '</td><td class="ansi-bright-cyan-fg">' + (resolvePortClass(data.sector.port.class, true).charAt(1) == 'S' ? data.sector.port.organics : (data.sector.port.organics_prod * 10 - data.sector.port.organics)) + '</td><td class="ansi-green-fg">' + (resolvePortClass(data.sector.port.class, true).charAt(1) == 'S' ? Math.floor(data.sector.port.organics / (data.sector.port.organics_prod * 10) * 100) : Math.floor((data.sector.port.organics_prod * 10 - data.sector.port.organics) / (data.sector.port.organics_prod * 10) * 100)) + '<span class="ansi-bright-red-fg">%</span></td><td class="ansi-cyan-fg">' + data.ship.organics + '</td>'))
      table.append($('<tr>').html('<td class="ansi-bright-cyan-fg" style="text-align: left">Equipment</td><td class="ansi-green-fg" style="text-align: left">' + (resolvePortClass(data.sector.port.class, true).charAt(2) == 'S' ? 'Selling' : 'Buying') + '</td><td class="ansi-bright-cyan-fg">' + (resolvePortClass(data.sector.port.class, true).charAt(2) == 'S' ? data.sector.port.equipment : (data.sector.port.equipment_prod * 10 - data.sector.port.equipment)) + '</td><td class="ansi-green-fg">' + (resolvePortClass(data.sector.port.class, true).charAt(2) == 'S' ? Math.floor(data.sector.port.equipment / (data.sector.port.equipment_prod * 10) * 100) : Math.floor((data.sector.port.equipment_prod * 10 - data.sector.port.equipment) / (data.sector.port.equipment_prod * 10) * 100)) + '<span class="ansi-bright-red-fg">%</span></td><td class="ansi-cyan-fg">' + data.ship.equipment + '</td>'))
      var tableContainerRow = $('<div>').addClass('row')
      var tableContainer = $('<div>').addClass('col-xs-6')
      tableContainer.append(table)
      tableContainerRow.append(tableContainer)
      el.append(tableContainerRow)
      portItem(data, destination, nextHop, method, route, 'fuel', 'B', false)
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var portItem = function(data, destination, nextHop, method, route, item, cycle, successes) {
    var emptyHolds = getShipEmptyHolds(data)
    switch (item) {
      case 'fuel':
        var thisItem = resolvePortClass(data.sector.port.class, true).charAt(0);
        if ((thisItem == 'B' && (data.ship.fuel == 0 || data.sector.port.fuel >= data.sector.port.fuel_prod * 10)) || (thisItem == 'S' && (emptyHolds == 0 || data.sector.port.fuel == 0)) || thisItem != cycle) {
          portItem(data, destination, nextHop, method, route, 'organics', cycle, successes)
          break
        }
        el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-yellow-fg">' + emptyHolds + '</span> empty cargo holds.<br />')
        el.append('<br /><span class="ansi-magenta-fg">We are ' + (thisItem == 'S' ? 'selling' : 'buying') + ' up to <span class="ansi-bright-yellow-fg">' + (thisItem == 'S' ? data.sector.port.fuel : (data.sector.port.fuel_prod * 10 - data.sector.port.fuel)) + '</span>. You have <span class="ansi-bright-yellow-fg">' + data.ship.fuel + '</span> in your holds.<br />')
        el.append('<span class="ansi-magenta-fg show-entry">How many holds of <span class="ansi-bright-cyan-fg">Fuel Ore</span> do you want to ' + (thisItem == 'S' ? 'buy' : 'sell') + ' [<span class="ansi-bright-yellow-fg">' + (thisItem == 'S' ? portTradeCalc(data, 'fuel', true) : data.ship.fuel) + '</span>]? ')
        menuEventHandler([
          { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'fuel', cycle], 'failure': true, 'max': (thisItem == 'S' ? portTradeCalc(data, 'fuel', true) : data.ship.fuel), 'addbreak': true },
          { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'fuel', cycle, (thisItem == 'S' ? portTradeCalc(data, 'fuel', true) : data.ship.fuel) ], 'key': 13, 'addbreak': true },
        ])
        break
      case 'organics':
        var thisItem = resolvePortClass(data.sector.port.class, true).charAt(1);
        if ((thisItem == 'B' && (data.ship.organics == 0 || data.sector.port.organics >= data.sector.port.organics_prod * 10)) || (thisItem == 'S' && (emptyHolds == 0 || data.sector.port.organics == 0)) || thisItem != cycle) {
          portItem(data, destination, nextHop, method, route, 'equipment', cycle, successes)
          break
        }
        el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-yellow-fg">' + emptyHolds + '</span> empty cargo holds.<br />')
        el.append('<br /><span class="ansi-magenta-fg">We are ' + (thisItem == 'S' ? 'selling' : 'buying') + ' up to <span class="ansi-bright-yellow-fg">' + (thisItem == 'S' ? data.sector.port.organics : (data.sector.port.organics_prod * 10 - data.sector.port.organics)) + '</span>. You have <span class="ansi-bright-yellow-fg">' + data.ship.organics + '</span> in your holds.<br />')
        el.append('<span class="ansi-magenta-fg show-entry">How many holds of <span class="ansi-bright-cyan-fg">Organics</span> do you want to ' + (thisItem == 'S' ? 'buy' : 'sell') + ' [<span class="ansi-bright-yellow-fg">' + (thisItem == 'S' ? portTradeCalc(data, 'organics', true) : data.ship.organics) + '</span>]? ')
        menuEventHandler([
          { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'organics', cycle ], 'failure': true, 'max': (thisItem == 'S' ? portTradeCalc(data, 'organics', true) : data.ship.organics), 'addbreak': true },
          { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'organics', cycle, (thisItem == 'S' ? portTradeCalc(data, 'organics', true) : data.ship.organics) ], 'key': 13, 'addbreak': true },
        ])
        break
      case 'equipment':
        var thisItem = resolvePortClass(data.sector.port.class, true).charAt(2);
        if ((cycle == 'B' && thisItem == 'B' && (data.ship.equipment == 0 || data.sector.port.equipment >= data.sector.port.equipment_prod * 10)) || (cycle == 'B' && thisItem == 'S')) {
          portItem(data, destination, nextHop, method, route, 'fuel', 'S', successes)
          break
        }
        if ((thisItem == 'B' && (data.ship.equipment == 0 || data.sector.port.equipment >= data.sector.port.equipment_prod * 10)) || (thisItem == 'S' && (emptyHolds == 0 || data.sector.port.equipment == 0)) || (cycle == 'S' && thisItem == 'B')) {
          if (!successes)
            el.append('<span class="ansi-bright-cyan-fg">You don\'t have anything they want, and they don\'t have anything you can buy.</span><br />')
          el.append('<br />You have <span class="ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-cyan-fg">' + emptyHolds + '</span> empty cargo holds.<br />')
          if (destination)
            portAutopilotEnd(data, destination, nextHop, method, route)
          else
            displaySectorCommand(data)
          break
        }
        el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-yellow-fg">' + emptyHolds + '</span> empty cargo holds.<br />')
        el.append('<br /><span class="ansi-magenta-fg">We are ' + (thisItem == 'S' ? 'selling' : 'buying') + ' up to <span class="ansi-bright-yellow-fg">' + (thisItem == 'S' ? data.sector.port.equipment : (data.sector.port.equipment_prod * 10 - data.sector.port.equipment)) + '</span>. You have <span class="ansi-bright-yellow-fg">' + data.ship.equipment + '</span> in your holds.<br />')
        el.append('<span class="ansi-magenta-fg show-entry">How many holds of <span class="ansi-bright-cyan-fg">Equipment</span> do you want to ' + (thisItem == 'S' ? 'buy' : 'sell') + ' [<span class="ansi-bright-yellow-fg">' + (thisItem == 'S' ? portTradeCalc(data, 'equipment', true) : data.ship.equipment) + '</span>]? ')
        menuEventHandler([
          { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'equipment', cycle ], 'failure': true, 'max': (thisItem == 'S' ? portTradeCalc(data, 'equipment', true) : data.ship.equipment), 'addbreak': true },
          { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, 'equipment', cycle, (thisItem == 'S' ? portTradeCalc(data, 'equipment', true) : data.ship.equipment) ], 'key': 13, 'addbreak': true },
        ])
        break
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var portTradeHaggle = function(data, destination, nextHop, method, route, item, cycle, quantity, haggleCount, lastCounter, thisOffer) {

    var thisItem = resolvePortClass(data.sector.port.class, true).charAt( (item == 'fuel' ? 0 : (item == 'organics' ? 1 : 2)) )
    var thisItemInitCost = portTradeCalc(data, item)
    if (!haggleCount) {
      if (quantity == 0) {
        switch (item) {
          case 'fuel':
            portItem(data, destination, nextHop, method, route, 'organics', cycle, true)
            break
          case 'organics':
            portItem(data, destination, nextHop, method, route, 'equipment', cycle, true)
            break
          case 'equipment':
            if (cycle == 'B') {
              portItem(data, destination, nextHop, method, route, 'fuel', 'S', true)
              break
            }
            el.append('<br />You have <span class="ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-cyan-fg">' + getShipEmptyHolds(data) + '</span> empty cargo holds.<br />')
            if (destination)
              portAutopilotEnd(data, destination, nextHop, method, route)
            else
              displaySectorCommand(data)
            break
        }
        return
      }

      el.append('<span class="ansi-bright-cyan-fg">Agreed, <span class="ansi-bright-yellow-fg">' + addCommas(quantity) + '</span> units.</span><br />')
      var d = new Date()
      if (d.getDay() == 3 && Math.floor(Math.random() * 2) == 1)
        el.append('We\'re having a "hump day" special!<br />')
      lastCounter = Math.floor(((thisItemInitCost * (((Math.random() * 10) - 5) / 100)) + thisItemInitCost) * quantity)
    }

    var thisItemBestOffer = Math.floor((thisItem == 'S' ? lastCounter * .96 : lastCounter / .93))
    var thisItemMCIC = 0
    switch (item) {
      case 'fuel':
        thisItemMCIC = data.sector.port.fuel_mcic
        //thisItemBestOffer = Math.floor((thisItem == 'S' ? lastCounter / 1.1 : lastCounter * 1.1))
        break
      case 'organics':
        thisItemMCIC = data.sector.port.organics_mcic
        //thisItemBestOffer = Math.floor((thisItem == 'S' ? lastCounter / 1.15 : lastCounter * 1.15))
        break
      case 'equipment':
        thisItemMCIC = data.sector.port.equipment_mcic
        //thisItemBestOffer = Math.floor((thisItem == 'S' ? lastCounter / 1.2 : lastCounter * 1.2))
        break
    }

    var failedResponses = [ 
      'Get real ion-brain, make me a real offer.',
      'My patience grows short with you.',
      'So, you think I\'m as stupid as you look? Make a real offer.',
      'Quit playing around, you\'re wasting my time!',
      'HA! HA, ha hahahhah hehehe hhhohhohohohh! You choke me up!',
      'What do you take me for, a fool? Make a real offer!',
      'This is the big leagues Jr. Make a real offer.',
      'Make a real offer or get the h*ll out of here!',
      'I have much better things to do than waste my time. Try again.',
      'WHAT?!?@!? you must be crazy!'
    ]

    if (thisOffer === 0) {

      if (thisItem == 'S')
        el.append('<span class="ansi-bright-white-fg ansi-blue-bg">Nothing in this universe is free, my friend.</span><br />')
      else {
        el.append('<span class="ansi-bright-white-fg ansi-blue-bg">Thank you very much!</span><br />')
        // TODO remove holds
      }

      switch (item) {
        case 'fuel':
          portItem(data, destination, nextHop, method, route, 'organics', cycle, true)
          break
        case 'organics':
          portItem(data, destination, nextHop, method, route, 'equipment', cycle, true)
          break
        case 'equipment':
          if (cycle == 'B') {
            portItem(data, destination, nextHop, method, route, 'fuel', 'S', true)
            break
          }
          el.append('<br />You have <span class="ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-cyan-fg">' + getShipEmptyHolds(data) + '</span> empty cargo holds.<br />')
          if (destination)
            portAutopilotEnd(data, destination, nextHop, method, route)
          else
            displaySectorCommand(data)
          break
      }

    // reject offer if out of bounds
    } else if (thisItem == 'B' && (thisOffer > ((-.5 * thisItemMCIC + 99.4) / 100) * lastCounter || thisOffer < lastCounter / ((-.5 * thisItemMCIC + 99.4) / 100))) {
      var abortedResponses = [
        'Get lost creep, that junk isn\'t worth half that much!',
        'HA! You think me a fool? Thats insane! Get out of here!',
        'Swine, go peddle your wares somewhere else, you make me sick.',
        'I think you\'d better leave if you value your life!',
        'I see you are as stupid as you look, get lost...'
      ]
      el.append('<br /><span class="ansi-bright-cyan-fg">' + failedResponses[Math.floor(Math.random() * failedResponses.length)] + '</span><br />')
      el.append('<span class="ansi-magenta-fg show-entry">Your offer [<span class="ansi-bright-yellow-fg">' + addCommas(lastCounter) + '</span>] ? ')

      menuEventHandler([
        { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, cycle, quantity, haggleCount++, lastCounter ], 'failure': true, 'addbreak': true },
        { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, cycle, quantity, haggleCount++, lastCounter, lastCounter ], 'addbreak': true, 'key': 13 }
      ])

    // reject offer if out of bounds
    } else if (thisItem == 'S' && (thisOffer < ((-.44 * thisItemMCIC + 96) / 100) * lastCounter || thisOffer > lastCounter / ((-.44 * thisItemMCIC +96) / 100))) {
      var abortedResponses = [
        'HA! You crack me up. Now get lost.',
        'These are not free! Get lost.',
        'When you want to make a real offer, drop back by.',
        'Thief! I will not do business with you.',
        'How have you survived this long? Get lost, I\'m not interested.'
      ]
      el.append('<br /><span class="ansi-bright-cyan-fg">' + failedResponses[Math.floor(Math.random() * failedResponses.length)] + '</span><br />')
      el.append('<span class="ansi-magenta-fg show-entry">Your offer [<span class="ansi-bright-yellow-fg">' + addCommas(lastCounter) + '</span>] ? ')

      menuEventHandler([
        { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, cycle, quantity, haggleCount++, lastCounter ], 'failure': true, 'addbreak': true },
        { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, cycle, quantity, haggleCount++, lastCounter, lastCounter ], 'addbreak': true, 'key': 13 }
      ])

    // accept offer
    } else if ((thisItem == 'S' && thisOffer >= lastCounter * .96) || (thisItem == 'B' && thisOffer <= lastCounter / .94) || thisOffer == thisItemBestOffer) {
      var successResponsesSelling = [
        'You are a shrewd trader, they\'re all yours.',
        'I could have twice that much in the Androcan Empire, but they\'re yours.',
        'SOLD! Come back anytime!',
        'Cheapskate. Here, take them and leave me alone.',
        'Very well, we\'ll take that offer.',
        'I PAID more than that! But we\'ll sell them to you anyway.',
        '(Sign) Very well, pay up and take them away.',
        'I hate haggling, they\'re all yours.',
        'Agreed, and a pleasure doing business with you!',
        'You will put me out of business, I\'ll take your offer.'
      ]

      var successResponsesBuying = [
        'FINE, we\'ll take them, just leave!',
        'Very well, we\'ll buy them.',
        'You are a rogue! We\'ll take them anyway.',
        'If only more honest traders would port here, we\'ll take them though.',
        'You insult my intelligence, but we\'ll buy them anyway.',
        'You are robbing me, but we\'ll buy them anyway.',
        'Oh well, maybe I can sell these to some other fool, we\'ll take them.',
        'Agreed! We\'ll purchase them!',
        'You drive a hard bargain, but we\'ll take them.',
        'Done, we\'ll take the lot.'
      ]

      el.append((thisItem == 'S' ? successResponsesSelling[Math.floor(Math.random() * successResponsesSelling.length)] : successResponsesBuying[Math.floor(Math.random() * successResponsesBuying.length)]) + '<br />')

      var exp = 0
      if (thisOffer == thisItemBestOffer)
        exp = 5
      else if (thisItem == 'S' && thisOffer > lastCounter * .95 && thisOffer <= lastCounter * .96)
        exp = 2
      else if (thisItem == 'S' && thisOffer > lastCounter * .96 && thisOffer <= lastCounter * .97)
        exp = 1
      else if (thisItem == 'B' && thisOffer < lastCounter / .94 && thisOffer >= lastCounter / .95)
        exp = 2
      else if (thisItem == 'B' && thisOffer < lastCounter / .95 && thisOffer >= lastCounter / .96)
        exp = 1

      if (exp > 0)
        el.append('For your ' + (exp == 1 ? 'good' : (exp == 2 ? 'great' : 'exceptional')) + ' trading, you receive <span class="ansi-bright-yellow-fg">' + exp + '</span> experience point(s)<br />')

      $.post('/port/', { 'task': 'trade', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'port_id': data.sector.port.id, 'item': item, 'quantity': quantity, 'offer': thisOffer, 'exp': exp }, function(result) {
        if (result.status == 'ok') {
          switch (item) {
            case 'fuel':
              data.sector.port.fuel = (thisItem == 'S' ? data.sector.port.fuel - quantity : data.sector.port.fuel + quantity)
              data.ship.fuel = (thisItem == 'S' ? data.ship.fuel + quantity : data.ship.fuel - quantity)
              break
            case 'organics':
              data.sector.port.organics = (thisItem == 'S' ? data.sector.port.organics - quantity : data.sector.port.organics + quantity)
              data.ship.organics = (thisItem == 'S' ? data.ship.organics + quantity : data.ship.organics - quantity)
              break
            case 'equipment':
              data.sector.port.equipment = (thisItem == 'S' ? data.sector.port.equipment - quantity : data.sector.port.equipment + quantity)
              data.ship.equipment = (thisItem == 'S' ? data.ship.equipment + quantity : data.ship.equipment - quantity)
              break
          }
          data.trader.credits = (thisItem == 'S' ? data.trader.credits - thisOffer : data.trader.credits + thisOffer)
          data.trader.experience += exp
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      }).always(function() {
        switch (item) {
          case 'fuel':
            portItem(data, destination, nextHop, method, route, 'organics', cycle, true)
            break
          case 'organics':
            portItem(data, destination, nextHop, method, route, 'equipment', cycle, true)
            break
          case 'equipment':
            if (cycle == 'B') {
              portItem(data, destination, nextHop, method, route, 'fuel', 'S', true)
              break
            }
            el.append('<br />You have <span class="ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-cyan-fg">' + getShipEmptyHolds(data) + '</span> empty cargo holds.<br />')
            if (destination)
              portAutopilotEnd(data, destination, nextHop, method, route)
            else
              displaySectorCommand(data)
            break
        }
      })

    } else if (haggleCount == 10) { // final offer

      el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">We\'re not interested.</span><br />')

      switch (item) {
        case 'fuel':
          portItem(data, destination, nextHop, method, route, 'organics', cycle, true)
          break
        case 'organics':
          portItem(data, destination, nextHop, method, route, 'equipment', cycle, true)
          break
        case 'equipment':
          if (cycle == 'B') {
            portItem(data, destination, nextHop, method, route, 'fuel', 'S', true)
            break
          }
          el.append('<br />You have <span class="ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</span> credits and <span class="ansi-bright-cyan-fg">' + getShipEmptyHolds(data) + '</span> empty cargo holds.<br />')
          if (destination)
            portAutopilotEnd(data, destination, nextHop, method, route)
          else
            displaySectorCommand(data)
          break
      }

    // haggle
    } else {

      if (haggleCount) {
        var thisItemChangeInCost = lastCounter * (((-.13 * thisItemMCIC - .34) / 100) / haggleCount)
        lastCounter = Math.floor(lastCounter + thisItemChangeInCost)
      } else
        haggleCount = 1

      if ((haggleCount > 1 && Math.floor(Math.random() * 2) == 1) || haggleCount == 9) {
        el.append('<br />Our final offer is <span class="ansi-bright-yellow-fg">' + addCommas(lastCounter) + '</span> credits.<br />')
        haggleCount = 9
      } else
        el.append('<br />We\'ll ' + (thisItem == 'S' ? 'sell' : 'buy') + ' them for <span class="ansi-bright-yellow-fg">' + addCommas(lastCounter) + '</span> credits.<br />')
      el.append('<span class="ansi-magenta-fg show-entry">Your offer [<span class="ansi-bright-yellow-fg">' + addCommas(lastCounter) + '</span>] ? ')

      menuEventHandler([
        { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, cycle, quantity, ++haggleCount, lastCounter ], 'failure': true, 'addbreak': true },
        { 'nextFunction': portTradeHaggle, 'nextFunctionArgs': [ data, destination, nextHop, method, route, item, cycle, quantity, ++haggleCount, lastCounter, lastCounter ], 'addbreak': true, 'key': 13 }
      ])

    }

    window.scrollTo(0, document.body.scrollHeight)
  }

  var portTradeCalc = function(data, item, maxBuyHoldsCheck) {
    // base price for item
    // adjust mcic
    // adjust exp
    // adjust product on hand
    var cost
    var thisItem = resolvePortClass(data.sector.port.class, true).charAt( (item == 'fuel' ? 0 : (item == 'organics' ? 1 : 2)) )
    switch (item) {
      case 'fuel':
        var onHand = (thisItem == 'S' ? data.sector.port.fuel_prod * 10 / data.sector.port.fuel : data.sector.port.fuel_prod * 10 / ( data.sector.port.fuel_prod * 10 - data.sector.port.fuel))
        cost = (thisItem == 'S' ? Math.round(((-0.2375 * data.sector.port.fuel_mcic) + 28.75) * onHand) : Math.round(((-0.2375 * data.sector.port.fuel_mcic) + 28.75) / onHand))
        if (data.trader.experience < 1000)
          cost = (thisItem == 'S' ? cost + ((1 - (data.trader.experience / 1000)) * (cost * 3 - cost)) : cost - ((1 - (data.trader.experience / 1000)) * (cost - cost * .8)))
        break
      case 'organics':
        var onHand = (thisItem == 'S' ? data.sector.port.organics_prod * 10 / data.sector.port.organics : data.sector.port.organics_prod * 10 / ( data.sector.port.organics_prod * 10 - data.sector.port.organics))
        cost = (thisItem == 'S' ? Math.round(((-0.4875 * data.sector.port.organics_mcic) + 53.75) * onHand) : Math.round(((-0.4875 * data.sector.port.organics_mcic) + 53.75) / onHand))
        if (data.trader.experience < 1000)
          cost = (thisItem == 'S' ? cost + ((1 - (data.trader.experience / 1000)) * (cost * 1.5 - cost)) : cost - ((1 - (data.trader.experience / 1000)) * (cost - cost * .9)))
        break
      case 'equipment':
        var onHand = (thisItem == 'S' ? data.sector.port.equipment_prod * 10 / data.sector.port.equipment : data.sector.port.equipment_prod * 10 / ( data.sector.port.equipment_prod * 10 - data.sector.port.equipment))
        cost = (thisItem == 'S' ? Math.round(((-0.9 * data.sector.port.equipment_mcic) + 95) * onHand) : Math.round(((-0.9 * data.sector.port.equipment_mcic) + 95) / onHand))
        if (data.trader.experience < 1000)
          cost = (thisItem == 'S' ? cost + ((1 - (data.trader.experience / 1000)) * (cost * 1.15 - cost)) : cost - ((1 - (data.trader.experience / 1000)) * (cost - cost * .95)))
        break
    }

    if (maxBuyHoldsCheck) {
      var maxHolds = Math.floor(data.trader.credits / cost)
      return (maxHolds > getShipEmptyHolds(data) ? getShipEmptyHolds(data) : maxHolds)
    }

    return cost
  }

  var portPlanetaryTradeCalc = function(data, destination, nextHop, method, route, item) {
    // fixed rate; exp DOES NOT affect price
  }


  var portBuyClass0Item = function(data, destination, nextHop, method, route, shipyard, item) {
    switch(item) {
      case 'holds':
        var nextHold = nextHoldCost(data)
        el.append('<br />You have <span class="ansi-bright-yellow-fg">' + data.ship.holds + '</span> cargo holds.<br />Installing your next Cargo hold will cost <span class="ansi-bright-yellow-fg">' + nextHold + '</span> credits.<br />How many Cargo Holds do you want installed? <span class="show-entry"></span>')
        menuEventHandler([
          { 'nextFunction': buyHolds, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'failure': true, 'max': findMaxHoldsLimit(data), 'addbreak': true },
          { 'nextFunction': portClass0Items, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'key': 13 }
        ])
        break
      case 'fighters':
        el.append('<br />You have <span class="ansi-bright-yellow-fg">' + data.ship.fighters + '</span> fighters.<br />How many K-3A fighters do you want to buy <span class="ansi-bright-cyan-fg">(Max ' + (Math.floor(data.trader.credits / 166) > data.ship.type.max_fighters - data.ship.fighters ? data.ship.type.max_fighters - data.ship.fighters : Math.floor(data.trader.credits / 166)) + ')</span> <span class="ansi-bright-yellow-fg">[0]</span> ? <span class="show-entry"></span>')
        menuEventHandler([
          { 'nextFunction': buyFighters, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'failure': true, 'max': (Math.floor(data.trader.credits / 166) > data.ship.type.max_fighters - data.ship.fighters ? data.ship.type.max_fighters - data.ship.fighters : Math.floor(data.trader.credits / 166)), 'addbreak': true },
          { 'nextFunction': portClass0Items, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'key': 13 }
        ])
        break
      case 'shields':
        el.append('<br />You have <span class="ansi-bright-yellow-fg">' + data.ship.shields + '</span> shields.<br />How many shield armor points do you want to buy <span class="ansi-bright-cyan-fg">(Max ' + (Math.floor(data.trader.credits / 183) > data.ship.type.max_shields - data.ship.shields ? data.ship.type.max_shields - data.ship.shields : Math.floor(data.trader.credits / 183)) + ')</span> <span class="ansi-bright-yellow-fg">[0]</span> ? <span class="show-entry"></span>')
        menuEventHandler([
          { 'nextFunction': buyShields, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'failure': true, 'max': (Math.floor(data.trader.credits / 183) > data.ship.type.max_shields - data.ship.shields ? data.ship.type.max_shields - data.ship.shields : Math.floor(data.trader.credits / 183)), 'addbreak': true },
          { 'nextFunction': portClass0Items, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'key': 13 }
        ])
        break
    }
  }

  var buyHolds = function(data, destination, nextHop, method, route, shipyard, quantity) {
    if (quantity == 0) {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      portClass0Items(data, destination, nextHop, method, route, shipyard)
    } else {
      var base = holdBaseCost()
      var holds = data.ship.holds + quantity
      var total = calcHoldCosts(base, holds) - calcHoldCosts(base, data.ship.holds)
      el.append('<span class="ansi-magenta-fg">The cost for <span class="ansi-bright-yellow-fg">' + quantity + '</span> more holds is <span class="ansi-bright-cyan-fg">' + addCommas(total) + '</span> credits.</span><br />')
      el.append('Are you still interested in buying them? ')
      booleanKey(function() { buyHoldsComplete(data, destination, nextHop, method, route, shipyard, quantity) }, function() { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />'); portClass0Items(data, destination, nextHop, method, route, shipyard) }, false)
    }
  }

  var buyFighters = function(data, destination, nextHop, method, route, shipyard, quantity) {
    if (quantity == 0) {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      portClass0Items(data, destination, nextHop, method, route, shipyard)
    } else {
      $.post('/ship/', { 'task': 'buyfighters', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'quantity': quantity }, function(result) {
        if (result.status == 'ok') {
          data.ship.fighters += quantity
          data.trader.credits -= (quantity * 166)
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      }).always(function() {
        el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
        portClass0Items(data, destination, nextHop, method, route, shipyard)
      })
    }
  }

  var buyShields = function(data, destination, nextHop, method, route, shipyard, quantity) {
    if (quantity == 0) {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      portClass0Items(data, destination, nextHop, method, route, shipyard)
    } else {
      $.post('/ship/', { 'task': 'buyshields', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'quantity': quantity }, function(result) {
        if (result.status == 'ok') {
          data.ship.shields += quantity
          data.trader.credits -= (quantity * 183)
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
      }).always(function() {
        el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
        portClass0Items(data, destination, nextHop, method, route, shipyard)
      })
    }
  }

  var calcHoldCosts = function(base, holds) {
    return Math.floor((base * holds) + ((20 * holds) * (holds - 1) / 2))
  }

  var findMaxHoldsLimit = function(data) {
    var base = holdBaseCost()
    if (data.ship.holds == data.ship.type.max_holds)
      return 0
    var max = data.ship.type.max_holds - data.ship.holds
    var maxCost = calcHoldCosts(base, data.ship.type.max_holds) - calcHoldCosts(base, data.ship.holds)
    if (maxCost <= data.trader.credits)
      return max
    for (var i = max; i > data.ship.holds; i--)
      if (calcHoldCosts(base, i) - calcHoldCosts(base, data.ship.holds) <= data.trader.credits)
        return i
    return 0
  }

  var buyHoldsComplete = function(data, destination, nextHop, method, route, shipyard, quantity) {
    $.post('/ship/', { 'task': 'buyholds', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'quantity': quantity }, function(result) {
      if (result.status == 'ok') {
        var base = holdBaseCost()
        var holds = data.ship.holds + quantity
        var total = calcHoldCosts(base, holds) - calcHoldCosts(base, data.ship.holds)
        data.ship.holds += quantity
        data.trader.credits -= total
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append('<span class="ansi-bright-cyan-fg">' + result.responseJSON.error + '</span><br />')
    }).always(function() {
      el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.<br />')
      portClass0Items(data, destination, nextHop, method, route, shipyard)
    })
  }

  var portClass0Items = function(data, destination, nextHop, method, route, shipyard) {
    el.append('<br /><span class="ansi-bright-yellow-fg">Commerce report for: <span class="ansi-bright-cyan-fg">' + getPortReportDate() + '</span> &nbsp; You can buy:</span><br />')
    var prod = $('<div>')
    var nextHold = nextHoldCost(data)
    prod.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg"><span class="ansi-green-fg">A</span> &nbsp;Cargo Holds</div><div class="col-xs-3 addseperator ansi-magenta-fg"><span class="ansi-bright-cyan-fg">' + nextHold + '</span> credits / next hold</div><div class="col-xs-1 ansi-bright-cyan-fg text-right">' + findMaxHoldsLimit(data) + '</div></div>')
    prod.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg"><span class="ansi-green-fg">B</span> &nbsp;Fighters</div><div class="col-xs-3 addseperator ansi-magenta-fg"><span class="ansi-bright-cyan-fg">166</span> credits per fighter</div><div class="col-xs-1 ansi-bright-cyan-fg text-right">' + (Math.floor(data.trader.credits / 166) > data.ship.type.max_fighters - data.ship.fighters ? data.ship.type.max_fighters - data.ship.fighters : Math.floor(data.trader.credits / 166)) + '</div></div>')
    prod.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg"><span class="ansi-green-fg">C</span> &nbsp;Shield Points</div><div class="col-xs-3 addseperator ansi-magenta-fg"><span class="ansi-bright-cyan-fg">183</span> credits per point</div><div class="col-xs-1 ansi-bright-cyan-fg text-right">' + (Math.floor(data.trader.credits / 183) > data.ship.type.max_shields - data.ship.shields ? data.ship.type.max_shields - data.ship.shields : Math.floor(data.trader.credits / 183)) + '</div></div>')
    el.append(prod)
    el.append('<br /><span class="ansi-magenta-fg">Which item do you wish to buy? <span class="ansi-bright-yellow-fg">(A,B,C,Q,?)</span> ')
    menuEventHandler([
      { 'nextFunction': portBuyClass0Item, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard, 'holds' ], 'attribute': 'holds', 'key': 'A'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': portBuyClass0Item, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard, 'fighters' ], 'attribute': 'fighters', 'key': 'B'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': portBuyClass0Item, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard, 'shields' ], 'attribute': 'shields', 'key': 'C'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': portClass0Items, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'key': 13, 'addbreak': true },
      { 'nextFunction': portClass0Items, 'nextFunctionArgs': [ data, destination, nextHop, method, route, shipyard ], 'key': 63, 'addbreak': true },
      { 'nextFunction': function() { if (shipyard) { el.append('You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.'); el.append(shipyardPrompt); shipyardEvents(data, destination, nextHop, method, route); } else { if (destination) portAutopilotEnd(data, destination, nextHop, method, route); else displaySectorCommand(data, destination, nextHop, method, route); }}, 'key': 'Q'.charCodeAt(), 'addbreak': true }
    ])
    window.scrollTo(0, document.body.scrollHeight)
  }

  var nextHoldCost = function(data) {
    var base = holdBaseCost()
    var holds = data.ship.holds + 1
    return Math.floor(holds * 20 + base)
  }

  var holdBaseCost = function() {
    var min = 150
    var max = 250

    //var date = new Date(universe.banged.date)
    var date = moment(universe.banged.date)
    //var diff = (((new Date()).getTime() - date.getTime()) / 1000)
    var diff = ((moment().format('x') - date.format('x')) / 1000)
    var day_diff = Math.floor(diff / 86400)
    var cycle = day_diff % 18

    //console.log('day_diff: ' + day_diff + ', cycle: ' + cycle)

    var cph
    if (cycle <= 9)
      cph = max - (((max - min) / 9) * cycle)
    else
      cph = min + (((max - min) / 9) * cycle)

    return Math.floor(cph)

  }

  var information = function(data, nextFunction) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Info&gt;</span>')
    informationTable(data)
    nextFunction(data)
  }
  
  var informationTable = function(data) {
    var info = $('<br /><br /><div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Trader Name</div><div class="col-xs-10 addseparator">' + resolveTitle(data.trader.experience, data.trader.alignment) + ' ' + data.trader.name + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Rank and Exp</div><div class="col-xs-10 addseparator"><span class="ansi-bright-cyan-fg">' + addCommas(data.trader.experience) + '</span> points<span class="ansi-bright-yellow-fg">,</span> Alignment<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + addCommas(data.trader.alignment) + '</span> <span class="ansi-bright-red-fg">' + resolveRank(data.trader.alignment) + '</div></div>')
    if (data.trader.deaths > 0) info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Times Blown Up</div><div class="col-xs-10 addseparator">' + addCommas(data.trader.deaths) + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Ship Name</div><div class="col-xs-10 addseparator">' + data.ship.name + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Ship Info</div><div class="col-xs-10 addseparator">' + data.ship.manufacturer.name + ' ' + data.ship.type.class + ' <span class="ansi-magenta-fg">Ported<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + addCommas(data.ship.ports) + '</span> Kills<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + addCommas(data.ship.kills) + '</span></div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Date Built</div><div class="col-xs-10 addseparator">' + getDate(data.ship.created_at) + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Turns to Warp</div><div class="col-xs-10 addseparator">' + data.ship.type.turns_per_warp + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Current Sector</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + data.sector.number + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Turns left</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + data.trader.turns + '</div></div>')
    if (data.ship.holds > 0) info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Total Holds</div><div class="col-xs-10 addseparator"><span class="ansi-bright-cyan-fg">' + data.ship.holds + ' -</span> ' + (data.ship.fuel > 0 ? ' Fuel Ore<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.fuel + '</span> ' : '') + (data.ship.organics > 0 ? ' Organics<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.organics + '</span> ' : '') + (data.ship.equipment > 0 ? ' Equipment<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.equipment + '</span> ' : '') + (data.ship.colonists > 0 ? ' Colonists<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + data.ship.colonists + '</span> ' : '') + (getShipEmptyHolds(data) > 0 ? ' Empty<span class="ansi-bright-yellow-fg">=</span><span class="ansi-bright-cyan-fg">' + getShipEmptyHolds(data) + '</span>' : '') + '</div></div>')
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Fighters</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + (data.ship.fighters == 0 ? '<span class="ansi-bright-red-fg ansi-bright-black-bg">' + addCommas(data.ship.fighters) + '</span>' : addCommas(data.ship.fighters)) + '</div></div>')
    if (data.ship.shields > 0) info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Shield points</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + addCommas(data.ship.shields) + '</div></div>')
    if (data.ship.class_1_mines > 0 || data.ship_class_2_mines > 0) info.append('<div class="row">' + (data.ship.class_1_mines > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Armid Mines T1</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.class_1_mines + '</div>' : '') + (data.ship.class_2_mines > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Limpet Mines T2</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.class_2_mines + '</div>' : '') + '</div>')
    if (data.ship.beacons > 0) info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Marker Beacons</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + data.ship.beacons + '</div></div>')
    if (data.ship.photons > 0 || data.ship.genesis > 0) info.append('<div class="row">' + (data.ship.photons > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Photon Missiles</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.photons + '</div>' : '') + (data.ship.genesis > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Genesis Torps</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.genesis + '</div>' : '') + '</div>')
    if (data.ship.detonators > 0 || data.ship.corbomite > 0) info.append('<div class="row">' + (data.ship.detonators > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Atomic Detn.</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.detonators + '</div>' : '') + (data.ship.corbomite > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Corbomite Level</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.corbomite + '</div>' : '') + '</div>')
    if (data.ship.cloaks > 0 || data.ship.probes > 0) info.append('<div class="row">' + (data.ship.cloaks > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Cloaking Device</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.cloaks + '</div>' : '') + (data.ship.probes > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Ether Probes</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">' + data.ship.probes + '</div>' : '') + '</div>')
    if (data.ship.disruptors > 0) info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Mine Disruptors</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + data.ship.disruptors + '</div></div>')
    if (data.ship.psychic > 0 || data.ship.planetscan > 0) info.append('<div class="row">' + (data.ship.psychic > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Psychic Probe</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">Yes</div>' : '') + (data.ship.planetscan > 0 ? '<div class="col-xs-2 ansi-magenta-fg">Planet Scanner</div><div class="col-xs-4 addseparator ansi-bright-cyan-fg">Yes</div>' : '') + '</div>')
    if (data.ship.scanner > 0) info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">LongRange Scan</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + resolveScanner(data.ship.scanner) + '</div></div>')
    if (data.ship.transwarp > 0) info.append('<span class="ansi-magenta-fg">TransWarp Power</span><br /><div class="row"><div class="col-xs-2 ansi-magenta-fg"> &nbsp; (Type 1 Jump)</div><div class="col-xs-4 addseparator"><span class="ansi-bright-cyan-fg">' + resolveTransWarpPower(1, data) + '</span> hops</div></div>' + (data.ship.transwarp == 2 ? '<div class="row"><div class="col-xs-2 ansi-magenta-fg"> &nbsp; (Type 2 Jump)</div><div class="col-xs-4 addseparator"><span class="ansi-bright-cyan-fg">' + resolveTransWarpPower(2, data) + '</span> hops</div></div>' : ''))
    info.append('<div class="row"><div class="col-xs-2 ansi-magenta-fg">Credits</div><div class="col-xs-10 addseparator ansi-bright-cyan-fg">' + addCommas(data.trader.credits) + '</div></div>')
    el.append(info)
  }

  var resolveTransWarpPower = function(type, data) {
    return Math.floor(data.ship.fuel / (type * 3));
  }

  var resolveScanner = function(type) {
    switch (type) {
      case 0:
        return 'None'
      case 1:
        return 'Density Scanner'
      case 2:
        return 'Holographic Scanner'        
    }
  }

  var computerHelp = function(data) {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;COMPUTER MENU&gt;</span>')
    el.append('<pre>' + atob('Q09NUFVURVIgTUVOVQ0KDQpOYXZpZ2F0aW9uDQoNCiZsdDtGJmd0OyAgQ291cnNlIFBsb3R0ZXIuICBUaGlzIHdpbGwgc2hvdyB0aGUgbnVtYmVyIG9mIHR1cm5zIGFuZCBob3BzDQogICAgIGl0ICB3aWxsIHRha2UgdG8gZ2V0IGZyb20gYW55IHNlY3RvciBpbiB0aGUgdW5pdmVyc2UgdG8NCiAgICAgYW5vdGhlci4gIFlvdSBjYW4gdXNlIHRoaXMgdG9vbCB0byBhdm9pZCBhbnkgc3VycHJpc2UgYXMNCiAgICAgeW91IHRyYXZlbCBiZXR3ZWVuIHNlY3RvcnMuICBZb3Uga25vdyB0aGUgdW5pdmVyc2UgaXMNCiAgICAgZnVsbCBvZiB1bmV4cGxhaW5lZCBwaGVub21lbm9uIGFuZCBqdXN0IGJlY2F1c2UgeW91IGdvdA0KICAgICBmcm9tIHlvdXIgaG9tZSBzZWN0b3IgdG8gdGhpcyBzZWN0b3Igd2l0aCBhIGdyZWF0IHBvcnQgaW4NCiAgICAgZml2ZSBtb3ZlcyBkb2Vzbid0IG1lYW4geW91J2xsIGdldCBiYWNrIGluIGZpdmUgbW92ZXMuDQoNCiZsdDtJJmd0OyAgSW50ZXItU2VjdG9yIFdhcnBzLiAgVGhpcyBzZWxlY3Rpb24gd2lsbCBzaG93IHlvdSB0aGUNCiAgICAgd2FycHMgbGFuZXMgY29ubmVjdGVkIHRvIGFueSBzZWN0b3IgaW4gdGhlIHVuaXZlcnNlIHRoYXQNCiAgICAgeW91IGhhdmUgZXhwbG9yZWQuICBZb3UganVzdCBlbnRlciB0aGUgc2VjdG9yIG51bWJlciBhbmQNCiAgICAgdGhlIGNvbXB1dGVyIHdpbGwgc2hvdyB5b3UgZXZlcnkgc2VjdG9yIGRpcmVjdGx5IGxpbmtlZA0KICAgICB0byB0aGF0IHNlY3Rvci4gIFRoZSBjb21wdXRlciB3aWxsIG5vdCBoYXZlIGRhdGEgdG8NCiAgICAgZGlzcGxheSBmb3IgdGhvc2Ugc2VjdG9ycyB5b3UgaGF2ZSB5ZXQgdG8gZXhwbG9yZS4NCg0KJmx0O0smZ3Q7ICBZb3VyIEtub3duIFVuaXZlcnNlLiAgQXMgeW91IHRyYXZlbCB0aHJvdWdoIHNwYWNlLCB5b3UNCiAgICAgd2lsbCBiZSBjcmVhdGluZyB5b3VyIHBlcnNvbmFsIHRyYXZlbG9ndWUuICBUaGlzIHdpbGwNCiAgICAgc3RvcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlY3RvcnMgeW91J3ZlIGV4cGxvcmVkLg0KICAgICBZb3VyIGNvbXB1dGVyIHdpbGwgdXNlIHRoaXMgaW5mb3JtYXRpb24gdG8gZ2l2ZSB5b3UgeW91cg0KICAgICBQb3J0IFJlcG9ydHMgYW5kIEludGVyLVNlY3RvciBXYXJwcy4gIFlvdSBtYXkgd2lzaCB0byBzZWUNCiAgICAgd2hhdCBzZWN0b3JzIHlvdSBoYXZlIChvciBkb24ndCBoYXZlKSBpbiB5b3VyIHRyYXZlbG9ndWUuDQogICAgIFRoaXMgb3B0aW9uIHdpbGwgdGVsbCB5b3UuICBZb3Ugd2lsbCBzZWUgd2hhdCBwZXJjZW50YWdlDQogICAgIG9mIHRoZSB1bml2ZXJzZSB5b3UgaGF2ZSB2aXNpdGVkIGFuZCB0aGUgY29tcHV0ZXIgd2lsbA0KICAgICBhc2sgaWYgeW91IHdhbnQgdGhlIGxpc3Qgb2YgRXhwbG9yZWQgb3IgVW5leHBsb3JlZA0KICAgICBzZWN0b3JzLiAgV2hlbiB5b3UgcmVwbHksIHlvdSB3aWxsIGdldCBhIGxpc3Qgb2Ygc2VjdG9yDQogICAgIG51bWJlcnMuDQoNCiZsdDtSJmd0OyAgUG9ydCBSZXBvcnQuICBUaGlzIHJlcG9ydCBnaXZlcyB5b3UgcmVsYXRpdmVseSB1cC10by1kYXRlDQogICAgIGluZm9ybWF0aW9uIGFib3V0IGFueSBwb3J0IGxvY2F0ZWQgaW4gYSBzZWN0b3Igd2hpY2ggeW91DQogICAgIGhhdmUgZXhwbG9yZWQuICBBbGwgeW91IGhhdmUgdG8gZG8gaXMgZW50ZXIgdGhlIHNlY3Rvcg0KICAgICBudW1iZXIgaW4gd2hpY2ggdGhlIHBvcnQgaXMgbG9jYXRlZC4gIFlvdSB3aWxsIHNlZSBpdGVtcw0KICAgICBiZWluZyB0cmFkZWQgYXQgdGhlIHBvcnQsIHRoZSBzdGF0dXMgb2YgZWFjaCBvZiB0aG9zZQ0KICAgICBpdGVtcyAod2hldGhlciB0aGUgcG9ydCBpcyBidXlpbmcgdGhlbSBvciBzZWxsaW5nIHRoZW0pLA0KICAgICB0aGUgbnVtYmVyIG9mIHVuaXRzIHRoZSBwb3J0IGlzIHdpbGxpbmcgdG8gdHJhZGUgKGFuZA0KICAgICB3aGF0IHBlcmNlbnRhZ2Ugb2YgbWF4aW11bSB0aGF0IG51bWJlciByZXByZXNlbnRzKSBhbmQNCiAgICAgaG93IG1hbnkgb2YgZWFjaCBvZiB0aGUgY29tbW9kaXRpZXMgeW91IGhhdmUgaW4geW91cg0KICAgICBob2xkcy4gIElmIGZvciBzb21lIHJlYXNvbiB5b3UgZ2V0IHRoZSBtZXNzYWdlIHRoYXQgdGhlDQogICAgIGNvbXB1dGVyIGhhcyBubyBpbmZvcm1hdGlvbiBvbiB0aGF0IHBvcnQgYW5kIHlvdSBhcmUgc3VyZQ0KICAgICB0aGVyZSBpcyBhIHBvcnQgaW4gdGhlIHNlY3RvciB5b3UgaW5kaWNhdGVkLCB0aGVyZSBtYXkgYmUNCiAgICAgZW5lbXkgZm9yY2VzIGluIHRoYXQgc2VjdG9yIGludGVyZmVyaW5nIHdpdGggeW91cg0KICAgICBjb21wdXRlcidzIHNjYW4uDQoNCiZsdDtVJmd0OyAgVC1XYXJwIFByZWZlcmVuY2UuICBPbmNlIHlvdSBoYXZlIGEgVHJhbnNXYXJwIGRyaXZlLCB0aGlzDQogICAgIG9wdGlvbiB3aWxsIGxldCB5b3UgY2hvc2Ugd2hldGhlciBvciBub3QgeW91IHdhbnQgdG8gaGF2ZQ0KICAgICB0aGUgcHJvbXB0IHRvIHVzZSB0aGlzIGZlYXR1cmUgZWFjaCB0aW1lIHlvdSB0cnkgdG8gbW92ZSB0bw0KICAgICBhIG5vbi1hZGphY2VudCBzZWN0b3IuICBJZiB5b3Ugc2F5ICJZZXMiLCB5b3Ugd2lsbCBnZXQgdGhlDQogICAgIHByb21wdC4gIElmIHlvdSBzYXkgIk5vIiwgeW91IHdpbGwgc2ltcGx5IGdldCB0aGUgYXV0b3BpbG90DQogICAgIHByb21wdC4gIFRoZSBuZXh0IHRpbWUgeW91IHdhbnQgdG8gdXNlIHRoZSBUV2FycCBkcml2ZSwgeW91DQogICAgIHdpbGwgaGF2ZSB0byBnbyBpbnRvIHRoaXMgb3B0aW9uIHRvIHJlc3RhcnQgaXQuDQoNCiZsdDtWJmd0OyAgQXZvaWQgU2VjdG9ycy4gIFlvdSB3aWxsIHNvbWV0aW1lcyBmaW5kIHNlY3RvcnMNCiAgICAgY29udGFpbmluZyB0aGluZ3MgdGhhdCBhcmUgZGV0cmltZW50YWwgdG8geW91ciBzdWNjZXNzIGluDQogICAgIHRoZSBnYW1lLiAgVGhpcyBmdW5jdGlvbiB3aWxsIGF2b2lkIHRob3NlIHNlY3RvcnMgd2hlbg0KICAgICBkb2luZyBhbnkgY291cnNlIHBsb3R0aW5nLiAgWW91IGp1c3QgaGF2ZSB0byBlbnRlciB0aGUNCiAgICAgc2VjdG9yIG9yIHNlY3RvcnMgdG8gYmUgYnktcGFzc2VkIGJlZm9yZSB5b3UgdXNlIHRoZQ0KICAgICBjb21wdXRlciB0byBwbG90IGEgY291cnNlIG9yIHRvIGVzdGFibGlzaCBhIHJvdXRlIGZvcg0KICAgICB5b3VyIEF1dG9QaWxvdC4gIElmIHRoZSBjb21wdXRlciBlbmNvdW50ZXJzIGEgc2l0dWF0aW9uDQogICAgIHdoZXJlIHRoZXJlIGlzIG5vdCBwb3NzaWJsZSByb3V0ZSBiZXR3ZWVuIHRoZSBzZWN0b3JzIHlvdQ0KICAgICByZXF1ZXN0ZWQsIHRoZW4gYWxsIHZvaWRzIHdpbGwgYmUgY2xlYXJlZCBhbmQgd2lsbCBoYXZlDQogICAgIHRvIGJlIHJlLWVudGVyZWQgYmVmb3JlIGFueSBmdXR1cmUgY291cnNlIGNhbGN1bGF0aW9ucy4NCg0KJmx0O1gmZ3Q7ICBMaXN0IEN1cnJlbnQgQXZvaWRzLiAgV2hlbiB5b3Ugd2FudCB0byBzZWUganVzdCB3aGF0DQogICAgIHNlY3RvcnMgYXJlIGJlaW5nIGF2b2lkZWQgd2hlbiB0aGUgY29tcHV0ZXIgY2hhcnRzIHlvdXINCiAgICAgY291cnNlLCB1c2UgdGhpcyBzZWxlY3Rpb24uICBZb3UgY2FuIHVzZSB0aGlzIGluZm9ybWF0aW9uDQogICAgIHRvIGRldGVybWluZSBpZiB5b3Ugd2FudCB0byBtYWtlIGFueSBjaGFuZ2VzLiAgRHVlIHRvIHRoZQ0KICAgICBsaW1pdGVkIGZ1bmN0aW9uYWxpdHkgb2YgdGhpcyBtb2R1bGUgb2YgdGhlIGNvbXB1dGVyLCBpZg0KICAgICB5b3Ugd2FudCB0byByZW1vdmUgb25lIG9yIG1vcmUgYXZvaWRlZCBzZWN0b3JzIGZyb20gdGhlDQogICAgIGxpc3QsIHlvdSBtdXN0IGNsZWFyIHRoZSBlbnRpcmUgbGlzdCBhbmQgcmUtZW50ZXIgdGhlDQogICAgIHNlY3RvciBudW1iZXJzIHlvdSBzdGlsbCB3YW50IHRvIGJ5cGFzcy4NCg0KJmx0OyEmZ3Q7ICBDb21wdXRlciBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUgZG9jdW1lbnRhdGlvbg0KICAgICBkZXNjcmliaW5nIHRoZSBDb21wdXRlciBmdW5jdGlvbnMuDQoNCiZsdDtRJmd0OyAgRXhpdCBDb21wdXRlci4gIFRoaXMgb3B0aW9uIHdpbGwgcmV0dXJuIHlvdSB0byB0aGUgYnJpZGdlDQogICAgIG9mIHlvdXIgc2hpcC4NCg0KTWlzY2VsbGFuZW91cw0KDQombHQ7QSZndDsgIE1ha2UgQW5ub3VuY2VtZW50LiAgRG8geW91IGhhdmUgc29tZXRoaW5nIHlvdSB3YW50IHRvDQogICAgIHRlbGwgZXZlcnlvbmUgaW4gdGhlIGdhbWU/ICBJZiBzbywgcHJlcGFyZSB5b3VyDQogICAgIHByb2NsYW1hdGlvbiBhbmQgZW50ZXIgaXQuICBZb3Ugd2lsbCBoYXZlIDE1NSBjaGFyYWN0ZXJzDQogICAgIGZvciB5b3VyIGFubm91bmNlbWVudCBhbmQgaXQgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlDQogICAgIERhaWx5IExvZyBmb3IgZXZlcnlvbmUgdG8gcmVhZCBhcyB0aGV5IGVudGVyIHRoZSBnYW1lLg0KDQombHQ7QiZndDsgIEJlZ2luIFNlbGYtZGVzdHJ1Y3QgU2VxdWVuY2UuICBJZiB5b3UgaGF2ZSBtYW5hZ2VkIHRvDQogICAgIG1ha2UgYSByZWFsIG1lc3Mgb2YgdGhpbmdzIGFuZCB0aGUgb25seSB3YXkgdG8gY29udGludWUNCiAgICAgaXMgdG8gc3RhcnQgZnJvbSBzY3JhdGNoLCB0aGVuIGdvIGFoZWFkIGFuZCB1c2UgdGhpcw0KICAgICBjb21tYW5kLiAgWW91IHdpbGwgZXNjYXBlIGZyb20geW91ciBzaGlwIG1vbWVudHMgYmVmb3JlDQogICAgIGl0IHNlbGYtZGVzdHJ1Y3RzLiAgVGhpbmsgaXQgb3ZlciBjYXJlZnVsbHkgYmVmb3JlIHlvdQ0KICAgICBoaXQgdGhlIGJ1dHRvbi4gIFRoaXMgd2lsbCBub3Qgb25seSBkZXN0cm95IHlvdXIgc2hpcCBhbmQNCiAgICAgYWxsIGl0cyBpbnZlbnRvcnksIGJ1dCBpdCB3aWxsIGFsc28gYWZmZWN0IHlvdXIgcmFuayBhbmQNCiAgICAgYWxpZ25tZW50LiAgWW91ciBzcGlyaXQgdGFrZXMgdHdvIGRheXMgdG8gbWlncmF0ZSBiYWNrIHRvDQogICAgIFNlY3RvciAxLCBzbyB5b3Ugd29uJ3QgaGF2ZSBhbnkgdHVybnMgdGhlIGRheSBhZnRlciB5b3UNCiAgICAgc2VsZi1kZXN0cnVjdC4NCg0KJmx0O04mZ3Q7ICBQZXJzb25hbCBTZXR0aW5ncy4NCg0KICAgICBBTlNJIGdyYXBoaWNzDQoNCiAgICAgICBUb2dnbGVzIHRoZSBkaXNwbGF5IG9mIGNvbG9ycyBhbmQgQU5TSSBkaXNwbGF5cy4gIFR1cm5pbmcgaWYgb2ZmDQogICAgICAgd2lsbCByZXBsYWNlIHRoZSBkaXNwbGF5cyB3aXRoIHRleHQtb25seSBhbHRlcm5hdGl2ZXMuDQoNCiAgICAgQW5pbWF0aW9uIGRpc3BsYXkNCg0KICAgICAgIEJ5IHR1cm5pbmcgb2ZmIGFuaW1hdGlvbiwgbWFueSBvZiB0aGUgbG9uZ2VyIG1lbnVzIGFuZCBncmFwaGljcyB3aWxsDQogICAgICAgYmUgc2tpcHBlZCwgbWFraW5nIHRoZSBnYW1lIGRpc3BsYXkgZmFzdGVyLg0KDQogICAgIFBhZ2Ugb24gbWVzc2FnZQ0KDQogICAgICAgSWYgeW91IHdhbnQgdG8gcmVjZWl2ZSBhIGJlZXAgd2hlbiBzb21lb25lIHNlbmRzIHlvdSBhIG1lc3NhZ2UsIHR1cm4NCiAgICAgICB0aGlzIG9wdGlvbiBvbi4gIElmIHRoZSBiZWVwIGFubm95cyB5b3UsIHR1cm4gaXQgb2ZmLg0KDQogICAgIFN1Yi1zcGFjZSByYWRpbyBjaGFubmVsDQoNCiAgICAgICBTcGVjaWZ5IHdoaWNoIGNoYW5uZWwgKGlmIGFueSkgeW91IHdpc2ggdG8gdXNlIGZvciBzdWItc3BhY2UgcmFkaW8NCiAgICAgICB0cmFuc21pc3Npb24gYW5kIHJlY2VwdGlvbi4gIFNldHRpbmcgdGhpcyB0byAwIHR1cm5zIG9mZiB1c2Ugb2YgdGhlDQogICAgICAgcmFkaW8uDQoNCiAgICAgRmVkZXJhdGlvbiBjb21tLWxpbmsNCg0KICAgICAgIElmIHRoZSBjb21tLWxpbmsgbWVzc2FnZXMgYXJlIGp1c3QgZ2V0dGluZyBpbiB5b3VyIHdheSwgeW91IGNhbiB0dXJuDQogICAgICAgdGhlbSBvZmYgd2l0aCB0aGlzIG9wdGlvbi4NCg0KICAgICBSZWNlaXZlIHByaXZhdGUgaGFpbHMNCg0KICAgICAgIElmIHlvdSdkIHJhdGhlciBub3QgYmUgYm90aGVyZWQgYnkgb3RoZXIgVHJhZGVycywgeW91IGNhbiBkaXNhYmxlIHRoZQ0KICAgICAgIGhhaWxpbmcgbm90aWZpY2F0aW9uLiAgVXNlIHdpdGggY2F1dGlvbiwgYmVjYXVzZSB5b3UgbWlnaHQgbWlzcyBhbg0KICAgICAgIGltcG9ydGFudCBtZXNzYWdlIG5vdyBhbmQgdGhlbi4NCg0KICAgICBQZXJzaXN0ZW50IGluZm8gZGlzcGxheQ0KDQogICAgICAgSWYgdGhpcyBvcHRpb24gaXMgZW5hYmxlZCwgdGhlICJRdWljay1zdGF0cyIga2V5LCAmbHQ7LyZndDssIHdpbGwgdG9nZ2xlIHRoZQ0KICAgICAgIGRpc3BsYXkgb24gYW5kIG9mZi4gIFdoaWxlIG9uLCB0aGUgaW5mbyB3aWxsIGJlIGRpc3BsYXllZCBhdCB0aGUgdG9wDQogICAgICAgb2YgdGhlIHNjcmVlbi4NCg0KICAgICAgIElmIHRoaXMgb3B0aW9uIGlzIGRpc2FibGVkLCB0aGUgIlF1aWNrLXN0YXRzIiBrZXkgd2lsbCBzaW1wbHkgZGlzcGxheQ0KICAgICAgIHRoZSBpbmZvcm1hdGlvbiBvbiB0aGUgbmV4dCBmZXcgbGluZXMuDQoNCiAgICAgU2lsZW5jZSBBTEwgbWVzc2FnZXMNCg0KICAgICAgIElmIHlvdSBqdXN0IGRvbid0IGxpa2UgdG8gYmUgYm90aGVyZWQsIG9yIGlmIHlvdSdyZSB1c2luZyBzZW5zaXRpdmUNCiAgICAgICBzY3JpcHRzLCB5b3UgY2FuIHR1cm4gb2ZmIGFsbCBnYW1lIG1lc3NhZ2VzLiAgVGhpcyBpbmNsdWRlcyBhbGwNCiAgICAgICBtdWx0aXBsYXllciBub3RpZmljYXRpb25zIChQbGF5ZXIgZW50ZXJzIHNlY3RvciwgZXRjKSwgYW5kIGFueSBtZXNzYWdlcw0KICAgICAgIHNlbnQgYnkgb3RoZXIgcGxheWVycy4gIFlvdSdyZSBmbHlpbmcgYmxpbmQgaGVyZSwgc28gYmUgd2FybmVkLg0KDQombHQ7TyZndDsgIENoYW5nZSBTaGlwIFNldHRpbmdzLiAgVGhpcyBvcHRpb24gb2ZmZXJzIHlvdSBhbiBhZGRpdGlvbmFsDQogICAgIGxldmVsIG9mIHByb3RlY3Rpb24gZm9yIGFsbCB0aGUgc2hpcHMgeW91IG93bi4gIFRoaXMgbGV0cw0KICAgICB5b3UgZXN0YWJsaXNoIGEgcGFzc3dvcmQgdGhhdCBwbGF5ZXJzIHdpbGwgbmVlZCB0byBrbm93IHRvDQogICAgIGJlIGFibGUgdG8gdXNlIHlvdXIgc2hpcC4NCg0KJmx0O1AmZ3Q7ICBGaXJlIFBob3RvbiBNaXNzaWxlLiAgWW91IGNhbiBmaXJlIHlvdXIgUGhvdG9uIE1pc3NpbGUNCiAgICAgaW50byB0aGUgYWRqYWNlbnQgc2VjdG9yIGFuZCBydW4gaW4gdG8gZG8geW91ciBkYW1hZ2UuDQogICAgIFJlbWVtYmVyIHRoYXQgdGhlIHRpbWVyIGlzIHJ1bm5pbmcgYXMgc29vbiBhcyB0aGUgbWlzc2lsZQ0KICAgICBpcyBsYXVuY2hlZCBzbyBiZSBxdWljayENCg0KJmx0O00mZ3Q7ICBSZWFkIFlvdXIgTWFpbC4gIENoZWNrIHlvdXIgbWVzc2FnZXMuICBUaGlzIGdpdmVzIHlvdSBhIGNoYW5jZSB0bw0KICAgICB2aWV3IGFueSBuZXcgcGVyc29uYWwgbWVzc2FnZXMgY3VycmVudGx5IGxvZ2dlZCB3aXRoIHRoZSBHYWxhY3RpYw0KICAgICBNLkEuSS5MLiAoTXV0dWFsIEFuYWNocm9ub3VzIEludGVyY2hhbmdlIExvZykuICBUaGVzZSBtZXNzYWdlcyBhcmUNCiAgICAgb25seSByZW1vdmVkIGZyb20gdGhlIGxvZyBhZnRlciB5b3UgZXhpdCB0aGUgZ2FtZSBJRiBZT1UgSEFWRSBSRUFEDQogICAgIFRIRU0gSEVSRS4gIE1haWwgZ2VuZXJhdGVkIGJ5IFRyYWRlIFdhcnMgKG5vdCBwbGF5ZXJzKSB3aGlsZSB5b3UgYXJlDQogICAgIG9ubGluZSB3aWxsIGJlIGRpc3BsYXllZCB0byB5b3VyIHNjcmVlbiBpbiByZWFsLXRpbWUsIGFuZCBhbHNvIHBsYWNlZA0KICAgICBpbnRvIHlvdXIgbWFpbCB3aGVyZSB0aGV5IHdpbGwgcmVtYWluIHVudGlsIHJlYWQuDQoNCiZsdDtTJmd0OyAgU2VuZCBNYWlsLiAgTG9nIGEgbWVzc2FnZSB3aXRoIHRoZSBHTVMgKEdhbGFjdGljIE0uQS5JLkwuIFNlcnZpY2UpLg0KICAgICBXaGVuIHlvdSBuZWVkIHRvIGdldCBhIG1lc3NhZ2UgdG8gb25lIG9mIHRoZSBvdGhlciBwbGF5ZXJzLCB0aGlzIHdpbGwNCiAgICAgc2VydmUgeW91ciBuZWVkLiAgS2VlcCBlbnRlcmluZyB0aGUgbGluZXMgb2YgeW91ciBtZXNzYWdlIHVudGlsIHlvdQ0KICAgICBhcmUgZG9uZS4gIFRvIGNvbXBsZXRlIHlvdXIgbWVzc2FnZSwgc2ltcGx5IHByZXNzIHRoZSBlbnRlciBrZXkgb24gYQ0KICAgICBibGFuayBsaW5lLiAgWW91IGRvIG5vdCBuZWVkIHRvIGtub3cgdGhlIHBsYXllcidzIGVudGlyZSBuYW1lLiAgSWYgeW91DQogICAgIGhhdmUgcGFydCBvZiBpdCwgeW91ciBjb21wdXRlciB3aWxsIHNlYXJjaCB0aGUgR01TIGRhdGFiYXNlIGFuZCBwcm9tcHQNCiAgICAgeW91IHdoZW4gaXQgZmluZHMgYSBtYXRjaC4NCg0KJmx0O1QmZ3Q7ICBDdXJyZW50IFNoaXAgVGltZS4gIFRoaXMgd2lsbCBkaXNwbGF5IHRoZSB0aW1lIGFuZCBkYXRlDQogICAgIHN0b3JlZCBpbiB5b3VyIHNoaXAncyBjb21wdXRlci4gIChSZW1lbWJlciwgdGhlIGdhbWUNCiAgICAgYmVnYW4gaW4gdGhlIHllYXIgMjAwMi4pDQoNCiZsdDtXJmd0OyAgVXNlIE1pbmUgRGlzcnVwdGVyLiAgWW91IGFyZSBleHBsb3JpbmcgYSBuZXcgcmVnaW9uIG9mDQogICAgIHRoZSB1bml2ZXJzZSBhbmQgYXMgeW91IHNpbmdsZS1zdGVwIHlvdXIgd2F5IGFsb25nLCB5b3VyDQogICAgIHNjYW5uZXIgc2hvd3MgYSBudW1iZXIgb2YgbWluZXMgaW4gdGhlIG5leHQgc2VjdG9yLiAgU2VuZA0KICAgICBvbmUgb2YgdGhlIE1pbmUgRGlzcnVwdGVycyB5b3UgcHVyY2hhc2VkIGF0IHRoZSBIYXJkd2FyZQ0KICAgICBFbXBvcml1bSBpbnRvIHRoaXMgbWluZWQgc2VjdG9yIHNvIHlvdSBkb24ndCBoYXZlIHRvIHRha2UNCiAgICAgdGhlIGRhbWFnZSB0byB5b3VyIHNoaXAuICBUaGUgZGlzcnVwdGVycyB3aWxsIGFsc28gZGlzYXJtDQogICAgIGFueSBMaW1wZXQgbWluZXMgdGhhdCBtYXkgYmUgaW4gdGhlIHNlY3Rvci4gIElmIHRoZSBmaXJzdA0KICAgICBEaXNydXB0ZXIgZG9lc24ndCBkaXNhcm0gYWxsIHRoZSBtaW5lcywgeW91IGNhbiBzZW5kIGluDQogICAgIGFub3RoZXIuDQoNCkRpc3BsYXlzDQoNCiZsdDtDJmd0OyAgVmlldyBTaGlwIENhdGFsb2cuICBUaGlzIHRvb2wgbGV0cyB5b3UgdmlldyB0aGUNCiAgICAgc3BlY2lmaWNhdGlvbnMgZm9yIGFsbCB0aGUgYXZhaWxhYmxlIHNoaXBzIGluIHRoZSBnYW1lLg0KICAgICBZb3UgY2FuIGdldCBhIGxpc3Qgb2YgdGhlIHNoaXBzIGFuZCBjaG9vc2Ugd2hpY2ggZXZlciBvbmUNCiAgICAgc3RyaWtlcyB5b3VyIGZhbmN5LiAgVGhlIGRpc3BsYXkgd2lsbCBzaG93IHRoZSBmb2xsb3dpbmcNCiAgICAgaW5mb3JtYXRpb24gLQ0KDQogICAgICAgICAgICAgICBCYXNpYyBIb2xkIENvc3QNCiAgICAgICAgICAgICAgIE1haW4gRHJpdmUgQ29zdA0KICAgICAgICAgICAgICAgQ29tcHV0ZXIgQ29zdA0KICAgICAgICAgICAgICAgU2hpcCBIdWxsIENvc3QNCiAgICAgICAgICAgICAgIEJhc2UgQ29zdA0KICAgICAgICAgICAgICAgTWluaW11bSBhbmQgTWF4aW11bSBIb2xkcw0KICAgICAgICAgICAgICAgTWF4aW11bSBGaWdodGVycw0KICAgICAgICAgICAgICAgTWF4aW11bSBTaGllbGRzDQogICAgICAgICAgICAgICBOdW1iZXIgb2YgTW92ZXMgcGVyIERheQ0KICAgICAgICAgICAgICAgTWF4aW11bSBOdW1iZXIgb2YgTWluZXMNCiAgICAgICAgICAgICAgIE1heGltdW0gTnVtYmVyIG9mIEdlbmVzaXMgVG9ycGVkb2VzDQogICAgICAgICAgICAgICBPZmZlbnNpdmUgT2RkcyBmb3IgQ29tYmF0DQogICAgICAgICAgICAgICBNYXhpbXVtIE51bWJlciBvZiBNYXJrZXIgQmVhY29ucw0KICAgICAgICAgICAgICAgVHJhbnNXYXJwIERyaXZlIENhcGFiaWxpdHkNCiAgICAgICAgICAgICAgIExvbmcgUmFuZ2UgU2Nhbm5lciBDYXBhYmlsaXR5DQogICAgICAgICAgICAgICBQbGFuZXQgU2Nhbm5lciBDYXBhYmlsaXR5DQoNCiAgICAgSW4gYWRkaXRpb24gdG8gYWxsIHRoaXMgaW5mb3JtYXRpb24sIHRoZXJlIGlzIGEgYnJpZWYNCiAgICAgbmFycmF0aXZlIGFib3V0IHRoZSBjYXBhYmlsaXRpZXMgYW5kIHNob3J0Y29taW5ncyBvZiBlYWNoDQogICAgIG1vZGVsLg0KDQombHQ7RCZndDsgIFNjYW4gRGFpbHkgTG9nLiAgVGhpcyB3aWxsIHJlLWRpc3BsYXkgdGhlIERhaWx5IEpvdXJuYWwNCiAgICAgdGhhdCB5b3Ugc2VlIHdoZW4geW91IGVudGVyIHRoZSBnYW1lLg0KDQombHQ7RSZndDsgIEV2aWwgVHJhZGVyIENsYXNzLiAgVGhpcyBpcyBhIGRpc3BsYXkgb2YgdGhlIHRpdGxlcyB0bw0KICAgICB3aGljaCB5b3UgY2FuIGFzcGlyZSBpZiB5b3UgYXJlIG9mIG5lZ2F0aXZlIGFsaWdubWVudC4NCiAgICAgSXQgc2hvd3MgdGhlIGxldmVscywgdGl0bGVzIGFuZCB0aGUgbnVtYmVyIG9mIGV4cGVyaWVuY2UNCiAgICAgcG9pbnRzIG5lZWRlZCB0byBhdHRhaW4gdGhhdCBsZXZlbC4NCg0KJmx0O0cmZ3Q7ICBHb29kIFRyYWRlciBDbGFzcy4gIFRoaXMgaXMgYSBkaXNwbGF5IG9mIHRoZSB0aXRsZXMgdG8NCiAgICAgd2hpY2ggeW91IGNhbiBhc3BpcmUgaWYgeW91IGFyZSBvZiBwb3NpdGl2ZSBhbGlnbm1lbnQuDQogICAgIEl0IHNob3dzIHRoZSBsZXZlbHMsIHRpdGxlcyBhbmQgdGhlIG51bWJlciBvZiBleHBlcmllbmNlDQogICAgIHBvaW50cyBuZWVkZWQgdG8gYXR0YWluIHRoYXQgbGV2ZWwuDQoNCiZsdDtIJmd0OyAgQWxpZW4gVHJhZGVyIFJhbmtzLiAgWW91IHdpbGwgZW5jb3VudGVyIHRyYWRlcnMgZnJvbSBvdGhlcg0KICAgICBnYWxheGllcyBhcyB5b3UgbWFrZSB5b3VyIHdheSB0aHJvdWdoIHRoZSB1bml2ZXJzZS4gIFlvdQ0KICAgICBjYW4gaW50ZXJhY3Qgd2l0aCB0aGVzZSBjcmVhdHVyZXMgdGhlIHNhbWUgYXMgeW91IGRvIHdpdGgNCiAgICAgdGhlIFRyYWRlcnMgbmF0aXZlIHRvIHlvdXIgMTAwMCBzZWN0b3JzLiAgT2YgY291cnNlLA0KICAgICBhbGllbnMgYXJlIGVpdGhlciBnb29kIG9yIGJhZC4gIFRoZWlyIGFsaWdubWVudCAoZ29vZCBvcg0KICAgICBldmlsKSBjYW4gbWFrZSBhIGJpZyBkaWZmZXJlbmNlIGluIGhvdyB5b3Ugd2FudCB0bw0KICAgICBhc3NvY2lhdGUgKG9yIG5vdCBhc3NvY2lhdGUpIHdpdGggdGhlbS4gIFdoZW4geW91IHVzZQ0KICAgICB0aGlzIHNlbGVjdGlvbiwgeW91ciBjb21wdXRlciB3aWxsIHRlbGwgeW91IGV2ZXJ5dGhpbmcNCiAgICAgeW91IG5lZWQgdG8ga25vdy4NCg0KJmx0O0omZ3Q7ICBQbGFuZXRhcnkgU3BlY3MuICBUaGUgdXNlIG9mIHRoaXMgZGlzcGxheSBpcyB2ZXJ5IHNpbWlsYXIgdG8NCiAgICAgdGhhdCBvZiB0aGUgU2hpcCBDYXRhbG9nLiAgQSA/IHdpbGwgc2hvdyB5b3UgYSBsaXN0IG9mIGFsbA0KICAgICB0aGUgcGxhbmV0IHR5cGVzLiAgQ2hvb3NlIHRoZSBvbmUgeW91IHdvdWxkIGxpa2UgdG8ga25vdw0KICAgICBtb3JlIGFib3V0IGFuZCB0aGUgZGlzcGxheSB3aWxsIHByb2R1Y2UgYSBwaWN0dXJlIGFuZCBhDQogICAgIGJyaWVmIGRlc2NyaXB0aW9uIG9mIHRoZSBwbGFuZXQuICBJdCB3aWxsIGFsc28gZGV0YWlsIHNvbWUNCiAgICAgb2YgdGhlIHByb3MgYW5kIGNvbnMgb2YgdGhhdCBwbGFuZXQgdHlwZS4NCg0KJmx0O0wmZ3Q7ICBMaXN0IFRyYWRlciBSYW5rLiAgVGhpcyBjaG9pY2Ugd2lsbCBzaG93IHlvdSBhbGwgdGhlIHBsYXllcnMNCiAgICAgaW4gdGhlIGdhbWUgaW4gb3JkZXIgb2YgZXhwZXJpZW5jZS4gIFlvdXIgcHJvbXB0IHdpbGwgYXNrDQogICAgIGlmIHlvdSB3b3VsZCBsaWtlIHRoZSBsaXN0IHRvIHNob3cgdGhlIFRpdGxlcyBvZiB0aGUNCiAgICAgcGxheWVycyBvciB0aGVpciBWYWx1ZXMgaW4gRXhwZXJpZW5jZSBwb2ludHMuICBFYWNoDQogICAgIHRyYWRlciB3aWxsIGJlIGRpc3BsYXllZCB3aXRoIGhpcyBvciBoZXIgdGl0bGUgb3IgdmFsdWUsDQogICAgIHRoZSBudW1iZXIgb2YgdGhlIENvcnBvcmF0aW9uIHRvIHdoaWNoIGhlL3NoZSBiZWxvbmdzLA0KICAgICBhbmQgdGhlIHR5cGUgb2Ygc2hpcCBjdXJyZW50bHkgYmVpbmcgdXNlZC4NCg0KJmx0O1kmZ3Q7ICBQZXJzb25hbCBQbGFuZXRzLiAgSWYgeW91IGhhdmUgcGxhbmV0cyB0aGF0IHlvdSB3YW50IHRvDQogICAgIGtlZXAgYXMgcGVyc29uYWwsIHlvdSBjYW4gdmlldyB0aGVtIHVzaW5nIHRoaXMgb3B0aW9uIGp1c3QNCiAgICAgYXMgeW91IGNhbiB2aWV3IENvcnBvcmF0ZSBQbGFuZXRzIHVzaW5nIHRoZSAmbHQ7TCZndDsgb3B0aW9uIGluDQogICAgIHRoZSBDb3Jwb3JhdGlvbiBNZW51Lg0KDQombHQ7WiZndDsgIEFjdGl2ZSBTaGlwIFNjYW4uICBUaGlzIGRpc3BsYXkgd2lsbCBzaG93IGEgbGlzdCBvZiBhbGwgeW91cg0KICAgICBzaGlwcywgdGhlIHNoaXAgbnVtYmVyLCBsb2NhdGlvbiwgc2hpcCB0eXBlLCBmaWdodGVycyAmDQogICAgIHNoaWVsZHMgYW5kIHRoZSBudW1iZXIgb2YgaG9wcyB0byBnZXQgdG8gaXQu') + '</pre>')
    el.append(computerPrompt.replace('#SECTORNUMBER', data.sector.number))
  }

  var sectorHelp = function(data) {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;MAIN MENU&gt;</span>')
    el.append('<pre>' + atob('TmF2aWdhdGlvbg0KDQombHQ7RCZndDsgIFJlLWRpc3BsYXkgU2VjdG9yLiAgVGhpcyB3aWxsIHJlLWRpc3BsYXkgdGhlIGluZm9ybWF0aW9uDQogICAgIGFib3V0IHRoZSBzZWN0b3Igd2hlcmUgeW91IGFyZSBjdXJyZW50bHkgbG9jYXRlZC4NCiAgICAgSW5mb3JtYXRpb24gaW5jbHVkZXMgc2VjdG9yIG51bWJlciBhbmQgbmVidWxhZSBuYW1lLA0KICAgICBtYXJrZXIgYmVhY29ucywgcG9ydCBuYW1lIGFuZCBjbGFzcywgbWluZXMsIGZpZ2h0ZXJzLA0KICAgICBwbGFuZXRzIGFuZCBhbnkgb3RoZXIgc2hpcHMuICBOZXh0IHRvIHRoZSBjbGFzcyB5b3Ugd2lsbCBzZWUNCiAgICAgdGhyZWUgbGV0dGVycyBzaWduaWZ5aW5nIGhvdyB0aGUgcG9ydCB0cmFkZXMgaW4gdGhlDQogICAgIGNvbW1vZGl0aWVzLiAgRm9yIGV4YW1wbGUgYSBTU0Igd291bGQgaW5kaWNhdGUgdGhhdCB0aGUgcG9ydA0KICAgICBzZWxscyBGdWVsIE9yZSwgc2VsbHMgT3JnYW5pY3MgYW5kIGJ1eXMgRXF1aXBtZW50LiAgVGhlDQogICAgIGFkamFjZW50IHNlY3RvcnMgd2lsbCBhbHNvIGJlIHNob3duLiAgV2l0aCBhIGNvbG9yIGRpc3BsYXksDQogICAgIHRoZSBzZWN0b3JzIHlvdSBoYXZlIG5vdCB5ZXQgdmlzaXRlZCB3aWxsIHNob3cgdXAgaW4gcmVkLg0KDQombHQ7UCZndDsgIFBvcnQgYW5kIFRyYWRlLiAgVGhpcyB3aWxsIGFsbG93IHlvdSB0byBkb2NrIGF0IHRoZSBwb3J0DQogICAgIGluIHlvdXIgY3VycmVudCBzZWN0b3IuICBUaGlzIGlzIHRoZSBvbmx5IHdheSB0byB0cmFkZQ0KICAgICB5b3VyIGNvbW1vZGl0aWVzLiAgWW91IHdpbGwgaGF2ZSBzb21lIGNob2ljZXMgZm9yIHdoYXQNCiAgICAgYWN0aW9uIHlvdSB3b3VsZCBsaWtlIHRvIHRha2UgYXQgdGhlIHBvcnQuICBNb3N0IG9mIHRoZQ0KICAgICBjaG9pY2VzIGFyZSBzZWxmLWV4cGxhbmF0b3J5LiAgSWYgeW91IGFyZSBwbGF5aW5nIHRoZSBnYW1lDQogICAgIGFzIGFuIGV2aWwgdHJhZGVyLCB0aGUgY2hvaWNlcyB5b3Ugc2VlIHdpbGwgYmUgZGlmZmVyZW50IHRoYW4NCiAgICAgdGhleSB3b3VsZCBiZSBpZiB5b3Ugd2VyZSBwbGF5aW5nIHRoZSBnYW1lIGFzIGEgbGF3ZnVsIFBsYXllci4NCiAgICAgV2hlbiB5b3UgZG9jayBhdCB0aGUgcG9ydCwgeW91IHdpbGwgYmUgYWJsZSB0byBzZWUgdGhlIGRvY2tpbmcNCiAgICAgbG9nLiAgVGhpcyB3aWxsIHNob3cgeW91IHRoZSBuYW1lIG9mIHRoZSBsYXN0IHNoaXAgdG8gZG8gYnVzaW5lc3MNCiAgICAgdGhlcmUuICBJZiB0aGVyZSBpcyBhIHBsYW5ldCBpbiB0aGUgc2VjdG9yIHdpdGggdGhpcyBwb3J0LCB5b3UNCiAgICAgd2lsbCBiZSBhYmxlIHRvIG5lZ290aWF0ZSBhIFBsYW5ldGFyeSBUcmFkZSBBZ3JlZW1lbnQuICBUaGlzIGlzIGENCiAgICAgdHJhZGUgY29udHJhY3QgdGhhdCB3aWxsIGFsbG93IHlvdSB0byB0cmFkZSBvZmYgYWxsIHlvdXIgZXhjZXNzDQogICAgIGNvbW1vZGl0aWVzIHRvIHRoZSBwb3J0IHdpdGhvdXQgd2FzdGluZyB5b3VyIHR1cm5zIGhhdWxpbmcgb25lDQogICAgIHNoaXBsb2FkIGF0IGEgdGltZS4gIElmIHlvdSB3YW50IHRvIGJ1aWxkIGEgbmV3IFN0YXJwb3J0IGFuZCB0aGUNCiAgICAgdW5pdmVyc2UgaXMgZnVsbCBvciBpZiB5b3UgZGVjaWRlIHRoYXQgeW91ciBhZHZlcnNhcmllcyBoYXZlIHRvbw0KICAgICBiaWcgYW4gYWR2YW50YWdlIGFuZCB5b3UgbmVlZCB0byBnZXQgcmlkIG9mIHRoYXQgcG9ydCB0aGV5IGhhdmUNCiAgICAgYmVlbiB1c2luZywgeW91IGNhbiBhdHRhY2sgYW5kIGRlc3Ryb3kgYSBzdGFycG9ydC4gIFRoaXMgaXMgbmV2ZXINCiAgICAgYW4gZWFzeSB0YXNrLiAgVGhlIHN0YXJwb3J0cyBhcmUgdmVyeSBoZWF2aWx5IGFybWVkIGFuZCB3aWxsDQogICAgIHJldGFsaWF0ZSwgc28geW91IHdpbGwgbmVlZCB0byBoYXZlIHBsZW50eSBvZiBtaWxpdGFyeSBmb3JjZXMNCiAgICAgd2l0aCB5b3UgaWYgeW91IGRlY2lkZSB0byBwcm9jZWVkIHdpdGggdGhpcyBzZWxlY3Rpb24uDQoNCiZsdDtNJmd0OyAgTW92ZSB0byBhIFNlY3Rvci4gIFRoZSBzZWN0b3JzIGFkamFjZW50IHRvIHlvdXIgY3VycmVudA0KICAgICBsb2NhdGlvbiB3aWxsIGJlIGxpc3RlZCBhcyB3YXJwIGxhbmVzIGluIHRoZSBzZWN0b3INCiAgICAgZGlzcGxheS4gIFlvdSBjYW4gbW92ZSB0byBvbmUgb2YgdGhlbSwgb3IgeW91IGNhbiBjaG9vc2UNCiAgICAgYW55IG90aGVyIHNlY3RvciBpbiB0aGUgdW5pdmVyc2UuICBJZiB5b3UgZGVzaWduYXRlIGENCiAgICAgc2VjdG9yIHRoYXQgZG9lc24ndCBoYXZlIGEgZGlyZWN0IHdhcnAgbGFuZSwgeW91ciBzaGlwJ3MNCiAgICAgY29tcHV0ZXIgd2lsbCBwbG90IHlvdXIgY291cnNlLCBzaG93IHRoZSBwYXRoIGFuZCB0aGUgbnVtYmVyDQogICAgIG9mIGhvcHMgKGFuZCB0dXJucykgdGhlIHRyaXAgd2lsbCB1c2UsIGFuZCBhc2sgeW91IGlmIHlvdQ0KICAgICB3YW50IHRvIGVuZ2FnZSB5b3VyIEF1dG9QaWxvdC4gIFlvdSB3aWxsIGJlIGFibGUgdG8gdXNlIHRoZQ0KICAgICBBdXRvcGlsb3QgaW4gdGhyZWUgZGlmZmVyZW50IG1vZGVzLiAgVGhlIGRlZmF1bHQgaXMgQWxlcnQNCiAgICAgbW9kZS4gIFRoaXMgd2lsbCBzdXNwZW5kIHlvdXIgdHJhdmVsIGluIGFueSBzZWN0b3Igd2hlcmUNCiAgICAgdGhlcmUgaXMgYSBwbGFuZXQsIHBvcnQsIG5hdmFnYXRpb25hbCBoYXphcmQgb3Igb3RoZXINCiAgICAgdHJhZGVyLiAgT25jZSBhbGVydGVkIHRvIG9uZSBvZiB0aGVzZSBpdGVtcywgeW91IHdpbGwgYmUNCiAgICAgZ2l2ZW4gc2V2ZXJhbCBvcHRpb25zLiAgSXQgaXMgdXAgdG8geW91IHRvIG1ha2UgdGhlIGRlY2lzaW9uDQogICAgIHRoYXQgd2lsbCBiZXN0IHNlcnZlIHlvdSBvciB5b3VyIGNvcnBvcmF0aW9uLiAgVGhlIHNlY29uZA0KICAgICBtb2RlIGlzIEV4cHJlc3MuICBUaGlzIHNwZWVkcyB5b3UgdG8geW91ciBkZXN0aW5hdGlvbg0KICAgICBwcm92aWRlZCB0aGVyZSBhcmUgbm8gZW5lbXkgZm9yY2VzIGluIHlvdXIgcGF0aC4gIFRoZSB0aGlyZA0KICAgICBtb2RlIGlzIFNpbmdsZSBTdGVwLiAgVGhpcyB3YXMgZGV2ZWxvcGVkIGJ5IGFuIGVudGVycHJpc2luZw0KICAgICBncm91cCBvZiBwaW9uZWVycy4gIFRoZWlyIGdyb3VwIHdhcyBnZXR0aW5nIHNtYWxsZXIgZHVlIHRvDQogICAgIGJvbGQgZXhwbG9yYXRpb24gb2Ygc2VjdG9ycyBmaWxsZWQgd2l0aCBtaW5lcywgc28gdGhlDQogICAgIHN1cnZpdm9ycyBtYW51ZmFjdHVyZWQgYW4gQXV0b3BpbG90IHRoYXQgd291bGQgc3RvcCBpbiBlYWNoDQogICAgIHNlY3Rvci4gIFRoaXMgYWxsb3dlZCB0aGVtIHRvIHNjYW4gdGhlIG5leHQgc2VjdG9yIGZvcg0KICAgICBoYXphcmRzIGJlZm9yZSBwcm9jZWVkaW5nIGludG8gaXQuICBTZWxlY3QgdGhpcyBvcHRpb24gaWYNCiAgICAgeW91IGZlZWwgdGhlIG5lZWQgZm9yIGNhdXRpb24uDQoNCiZsdDtMJmd0OyAgTGFuZCBvbiBhIFBsYW5ldC4gIFRoaXMgb3B0aW9uIHdpbGwgZW5hYmxlIHlvdSB0byBjb2xvbml6ZQ0KICAgICB5b3VyIHBsYW5ldHMsIGJ1aWxkIGEgQ2l0YWRlbCBhbmQgZG8gYnVzaW5lc3MgdGhlcmUsIHBpY2sgdXANCiAgICAgdGhlIGZpZ2h0ZXJzIGJ1aWx0IGJ5IHlvdXIgY29sb25pc3RzIG9yIHBpY2sgdXAgdGhlDQogICAgIHByb2R1Y3Rpb24gb2YgRnVlbCBPcmUsIE9yZ2FuaWNzIGFuZC9vciBFcXVpcG1lbnQuICBZb3Ugd2lsbA0KICAgICBzZWUgYSBsaXN0IG9mIGFsbCB0aGUgcGxhbmV0cy4gIFNpbXBseSBlbnRlciB0aGUgbnVtYmVyIGZvcg0KICAgICB0aGUgb25lIHlvdSB3YW50IHRvIHZpc2l0LiAgSWYgeW91IGhhdmUgcHVyY2hhc2VkIGEgUGxhbmV0DQogICAgIFNjYW5uZXIgYXQgdGhlIEhhcmR3YXJlIEVtcG9yaXVtLCBpdCB3aWxsIGF1dG9tYXRpY2FsbHkNCiAgICAgcHJvdmlkZSB5b3Ugd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBwbGFuZXQuDQogICAgIFRoZSBQbGFuZXQgU2Nhbm5lciB3aWxsIGFsc28gYWxsb3cgeW91IHRvIGFib3J0IHRoZSBsYW5kaW5nDQogICAgIHByb2NlZHVyZSBpZiwgYWZ0ZXIgbG9va2luZyBhdCB0aGUgZGVmZW5zZXMsIHlvdSBmZWVsIHlvdQ0KICAgICBtYXkgbm90IGJlIGFibGUgdG8gbGFuZCBzdWNjZXNzZnVsbHkuICBUaGUgZGlzcGxheSwgb25jZSB5b3UNCiAgICAgaGF2ZSBsYW5kZWQsIHNob3dzIHRoZSBwbGFuZXQgbnVtYmVyLCBsb2NhdGlvbiwgbmFtZSwgY2xhc3MNCiAgICAgYW5kIGEgY2hhcnQgZGV0YWlsaW5nIHRoZSBjb21tb2RpdGllcywgcHJvZHVjdGlvbg0KICAgICByZXF1aXJlbWVudHMgYW5kIGN1cnJlbnQgaW52ZW50b3JpZXMuICBZb3Ugd2lsbCBhbHNvIHNlZSB0aGUNCiAgICAgY2l0YWRlbCBpbmZvcm1hdGlvbiBhbmQgYW55IHBsYW5ldGFyeSBkZWZlbnNlcy4NCg0KJmx0O1MmZ3Q7ICBMb25nIFJhbmdlIFNjYW4uICBJZiB5b3UgaGF2ZSBwdXJjaGFzZWQgYSBzY2FubmVyIGZyb20gdGhlDQogICAgIEhhcmR3YXJlIEVtcG9yaXVtLCB5b3UgY2FuIHVzZSBpdCB0byB2aWV3IGFkamFjZW50IHNlY3RvcnMuDQogICAgIEFsbCB0aGluZ3MgaW4gdGhlIFRyYWRlIFdhcnMgdW5pdmVyc2UgaGF2ZSBhIGRlbnNpdHkgdmFsdWUNCiAgICAgYW5kIHlvdSBjYW4gdXNlIHlvdXIgRGVuc2l0eSBTY2FubmVyIHRvIGRpc3BsYXkgdGhlIHJlbGF0aXZlDQogICAgIGRlbnNpdHkgb2YgdGhlIG5laWdoYm9yaW5nIHNlY3RvcnMgYW5kIGRldGVybWluZSBpZiB0aGVyZQ0KICAgICBhcmUgYW55IE5hdmFnYXRpb25hbCBIYXphcmRzLiAgWW91IHdpbGwgYWxzbyBiZSB3YXJuZWQgb2YNCiAgICAgYW55IG5vbi1zdGFuZGFyZCwgdW5kZWZpbmFibGUgbWFzcy4gIFlvdSBjYW4gdGhlbiB1c2UgdGhhdA0KICAgICBpbmZvcm1hdGlvbiB0byBkZXRlcm1pbmUgd2hhdCdzIG5leHQgZG9vci4gIElmIHlvdSBoYXZlIGENCiAgICAgSG9sb2dyYXBoaWMgU2Nhbm5lciwgeW91IHdpbGwgYmUgYWJsZSB0byBzZWUgcG9ydHMsIHBsYW5ldHMsDQogICAgIGhhemFyZHMgYW5kIG90aGVyIHBsYXllcnMgYWxsIGZvciBqdXN0IHRoZSBjb3N0IG9mIG9uZSB0dXJuLg0KDQombHQ7UiZndDsgIFJlbGVhc2UgQmVhY29uLiAgQ2hvb3NlIHRoaXMgd2hlbiB5b3Ugd2FudCB0byBsYXVuY2ggb25lDQogICAgIG9mIHRoZSBNYXJrZXIgQmVhY29ucyB5b3UgcHVyY2hhc2VkIGF0IHRoZSBIYXJkd2FyZQ0KICAgICBFbXBvcml1bS4gIFlvdSB3aWxsIG5lZWQgdG8gZGVjaWRlIHdoYXQgbWVzc2FnZSB5b3VyDQogICAgIGJlYWNvbiB3aWxsIHNlbmQgd2hlbiB5b3UgbGF1bmNoIGl0LiAoTGltaXQgNDEgY2hhcmFjdGVycykNCg0KJmx0O1cmZ3Q7ICBUb3cgU3BhY2VDcmFmdC4gIFRoaXMgb3B0aW9uIGxldHMgeW91IHRvZ2dsZSB5b3VyIHRyYWN0b3INCiAgICAgYmVhbSBvbiBhbmQgb2ZmLiAgVGhlIGNvbXB1dGVyIHdpbGwgYXNrIHlvdSB3aGljaCB0cmFkZXIgaW4NCiAgICAgeW91ciBjdXJyZW50IHNlY3RvciB5b3Ugd2lzaCB0byB0b3cuICBZb3UgY2FuIHRvdyBhbg0KICAgICB1bm1hbm5lZCBzaGlwIG9ubHkgaWYgeW91IG93biB0aGUgc2hpcCBhbmQga25vdyB0aGUgc2hpcCdzDQogICAgIHBhc3N3b3JkLiAgVGhlIGNvbXB1dGVyIHdpbGwgdGhlbiBjYWxjdWxhdGUgKHVzaW5nIHRoZSBzaXplDQogICAgIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgdHdvIHNoaXBzKSB0aGUgbnVtYmVyIG9mIHR1cm5zIHlvdQ0KICAgICB3aWxsIHVzZSBmb3IgZWFjaCBzZWN0b3IgeW91IHRvdyB0aGlzIHRyYWRlciBhbmQgaGlzL2hlcg0KICAgICBzaGlwLiAgWW91IGNhbiB0aGVuIHVzZSB0aGUgTW92ZSBvcHRpb24gdG8gZ28gdG8gYW4gYWRqYWNlbnQNCiAgICAgc2VjdG9yIG9yIHlvdSBjYW4gZW5nYWdlIHlvdXIgQXV0b1BpbG90IHRvIG1vdmUgeW91IGFuZCB5b3VyDQogICAgICJwYXNzZW5nZXIiLiAgVHlwZSAxIFRyYW5zV2FycCBkcml2ZXMgd2VyZSBub3QgbWFkZSB0byBiZSB1c2VkDQogICAgIGluIGNvbmp1bmN0aW9uIHdpdGggdHJhY3RvciBiZWFtcywgc28gaWYgeW91IHVzZSB5b3VyIFR5cGUgMQ0KICAgICBUcmFuc1dhcnAsIHRoZSB0cmFjdG9yIGJlYW0gd2lsbCBhdXRvbWF0aWNhbGx5IHNodXQgZG93bi4NCiAgICAgVHlwZSAyIFRyYW5zV2FycCBkcml2ZXMgY2FuIGJlIHVzZWQgd2l0aCBhIHNoaXAgaW4gdG93Lg0KICAgICBUaGUgcGVyc29uIHlvdSBhcmUgdG93aW5nIHdpbGwgbm90IGVudGVyIGEgc2VjdG9yIHVudGlsIHlvdQ0KICAgICBoYXZlIHNhZmVseSBlbnRlcmVkLiAgVGhlIHRyYWN0b3IgYmVhbSB3aWxsIGFjdCBhcyBhDQogICAgIHByb3RlY3RpdmUgc2hpZWxkIGFuZCB3aWxsIHNhZmVndWFyZCB0aGUgdG93ZWUgZnJvbSBhbnkNCiAgICAgZGFtYWdlIGZyb20gbWluZXMsIG9mZmVuc2l2ZSBmaWdodGVycyBvciBRdWFzYXIgY2Fubm9ucy4gIElmDQogICAgIHlvdXIgc2hpcCBpcyBkZXN0cm95ZWQsIHRoZSB0cmFjdG9yIGJlYW0gd2lsbCBhbHNvIGJlDQogICAgIGRlc3Ryb3llZCBhbmQgdGhlIHBlcnNvbiB5b3UgYXJlIHRvd2luZyB3aWxsIGJlIGxlZnQNCiAgICAgc3RyYW5kZWQuICBUbyBkaXNlbmdhZ2UgdGhlIGJlYW0gYXQgYW55IHBvaW50LCB1c2UgdGhpcw0KICAgICBvcHRpb24gYWdhaW4uDQoNCg0KJmx0O04mZ3Q7ICBNb3ZlIHRvIE5hdlBvaW50LiAgTmF2aWdhdGlvbiBQb2ludHMgYXJlIHNlY3RvcnMgb2YgcGFydGljdWxhcg0KICAgICByZWxldmFuY2UgdG8geW91IG9yIHlvdXIgY29ycG9yYXRpb24uICBUaGV5IGFyZSBhc3NpZ25lZCBmcm9tDQogICAgIHRoZSBtYWluIG1lbnUgd2l0aCB0aGUgIiZsdDtZJmd0OyBTZXQgTmF2UG9pbnRzIiBvcHRpb24uICBBbGwgTmF2IHVuaXRzDQogICAgIGFyZSBwcmUtcHJvZ3JhbW1lZCB3aXRoIGluZm8gb24gU2VjdG9yIDEgKFRlcnJhKSwgYW5kIChpZiB0aGUNCiAgICAgc3lzb3Agd2lzaGVzKSBTdGFyRG9jayBTZWN0b3IsIGFuZCB0aGVyZSBhcmUgZm91ciBvdGhlciBkZWZpbmFibGUNCiAgICAgcG9pbnRzLiAgTmF2aWdhdGlvbiBpbmZvIGlzIGF2YWlsYWJsZSBvbiBhbnkgc2VjdG9yIGluIEZlZFNwYWNlLA0KICAgICBvciBhbnkgc2VjdG9yIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgb2YgeW91ciBmaWdodGVycy4gIFRoaXMgaW5mbw0KICAgICBpbmNsdWRlcyBhbnkgcGxhbmV0IG9yIHBvcnQgZGV0YWlscyBmb3IgdGhhdCBzZWN0b3IuDQoNCkNvbXB1dGVyIGFuZCBJbmZvcm1hdGlvbg0KDQombHQ7QyZndDsgIE9uYm9hcmQgQ29tcHV0ZXIuICBUaGlzIGNvbW1hbmQgd2lsbCBhY3RpdmF0ZSB5b3VyIG9uLWJvYXJkDQogICAgIGNvbXB1dGVyLg0KDQombHQ7WCZndDsgIFRyYW5zcG9ydGVyIFBhZC4gIFRoZSBkaXNwbGF5IHdpbGwgc2hvdyB0aGUgdHJhbnNwb3J0IHJhbmdlDQogICAgIG9mIHlvdXIgc2hpcCBhbmQgYSBsaXN0IG9mIHNoaXBzIGFuZCB0aGVpciBsb2NhdGlvbnMgdG8NCiAgICAgd2hpY2ggeW91IGNhbiBiZWFtIHlvdXJzZWxmLiAgTWFrZSBzdXJlIHlvdSBrbm93IHRoZQ0KICAgICBwYXNzd29yZCENCg0KJmx0O0kmZ3Q7ICBTaGlwIEluZm9ybWF0aW9uLiAgVGhpcyB3aWxsIGRpc3BsYXkgeW91ciBzdGF0aXN0aWNzLg0KDQogICAgIFRyYWRlciBOYW1lLi4uLi4uWW91ciBhbGlhcyBpbiB0aGUgZ2FtZQ0KICAgICBSYW5rIGFuZCBFeHAuLi4uLlRoZSBleHBlcmllbmNlIHBvaW50cyB5b3UgaGF2ZQ0KICAgICAgICAgICAgICAgICAgICAgIGFjY3VtdWxhdGVkLCB0aGUgbnVtYmVyIG9mIGFsaWdubWVudA0KICAgICAgICAgICAgICAgICAgICAgIHBvaW50cyB5b3UgaGF2ZSBhY2N1bXVsYXRlZCBhbmQgdGhlDQogICAgICAgICAgICAgICAgICAgICAgdGl0bGUgeW91IGhhdmUgcmVjZWl2ZWQNCiAgICAgVGltZXMgQmxvd24gVXAuLi5UaGUgbnVtYmVyIG9mIHRpbWVzIHlvdXIgc2hpcCBoYXMgYmVlbg0KICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3llZA0KICAgICBTaGlwIE5hbWUuLi4uLi4uLlRoZSBuYW1lIG9mIHRoZSBzaGlwIHlvdSBhcmUgbm93IHVzaW5nDQogICAgIFNoaXAgSW5mby4uLi4uLi4uTWFudWZhY3R1cmVyIGFuZCBtb2RlbA0KICAgICAgICAgICAgICAgICAgICAgIFBvcnRlZCA9IFRoZSBudW1iZXIgb2YgdGltZXMgdGhpcyBzaGlwDQogICAgICAgICAgICAgICAgICAgICAgaGFzIGRvY2tlZCBhdCBhIFRyYWRpbmcgUG9ydA0KICAgICAgICAgICAgICAgICAgICAgIEtpbGxzID0gTnVtYmVyIG9mIG90aGVyIHBsYXllcidzIHNoaXBzDQogICAgICAgICAgICAgICAgICAgICAgZGVzdHJveWVkIGJ5IHRoaXMgc2hpcA0KICAgICBUdXJucyB0byBXYXJwLi4uLkhvdyBtYW55IHR1cm5zIHVzZWQgdG8gbW92ZSB0aGlzIHNoaXANCiAgICAgICAgICAgICAgICAgICAgICBvbmUgc2VjdG9yDQogICAgIERhdGUgQnVpbHQuLi4uLi4uVGhlIGRhdGUgdGhpcyBzaGlwIHdhcyBwdXJjaGFzZWQNCiAgICAgQ3VycmVudCBTZWN0b3IuLi5Zb3VyIGN1cnJlbnQgbG9jYXRpb24NCiAgICAgVHVybnMgdG8gV2FycC4uLi5UaGUgbnVtYmVyIG9mIHR1cm5zIHlvdSB3aWxsIHVzZQ0KICAgICAgICAgICAgICAgICAgICAgIG1vdmluZyB0aGlzIHNoaXAgdG8gYW4gYWRqYWNlbnQgc2VjdG9yDQogICAgIFR1cm5zIExlZnQuLi4uLi4uTnVtYmVyIG9mIHR1cm5zIHJlbWFpbmluZyBmb3IgdGhpcw0KICAgICAgICAgICAgICAgICAgICAgIHNoaXANCiAgICAgVG90YWwgSG9sZHMuLi4uLi5OdW1iZXIgb2YgaG9sZHMgdGhpcyBzaGlwIGlzIGNhcnJ5aW5nDQogICAgICAgICAgICAgICAgICAgICAgKFRoaXMgZGlzcGxheSBhbHNvIHNob3dzIHRoZSBicmVha2Rvd24NCiAgICAgICAgICAgICAgICAgICAgICAgb2YgdGhlIGNhcmdvIGluIHRoZSBob2xkcykNCg0KICAgICBBZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluY2x1ZGVzIGFsbCB0aGUgc3BlY2lhbCBlcXVpcG1lbnQNCiAgICAgeW91ciBzaGlwIGhhcyBhbmQgdGhlIG51bWJlciBvZiBjcmVkaXRzIHlvdSBoYXZlIG9uIHlvdXINCiAgICAgc2hpcC4NCg0KJmx0O1QmZ3Q7ICBDb3Jwb3JhdGUgTWVudS4gIFRoaXMgd2lsbCBnaXZlIHlvdSBpbmZvcm1hdGlvbiBhYm91dCBhbGwNCiAgICAgdGhlIGNvcnBvcmF0aW9ucyBpbiB0aGUgZ2FtZS4NCg0KJmx0O1UmZ3Q7ICBVc2UgR2VuZXNpcyBUb3JwZWRvLiAgSWYgeW91IGFyZSBjYXJyeWluZyBhIEdlbmVzaXMNCiAgICAgVG9ycGVkbywgeW91IHdpbGwgYmUgYWJsZSB0byBkZXRvbmF0ZSBpdCBhbmQgY3JlYXRlIG9uZSBvZg0KICAgICB0aGUgc2V2ZXJhbCB0eXBlcyBvZiBwbGFuZXRzIHVzaW5nIHRoaXMgY29tbWFuZC4gIFRoZXNlIHdpbGwNCiAgICAgY3JlYXRlIHlvdXIgbmV3IHdvcmxkIHF1aWNrbHkuICBZb3Ugd2lsbCBiZSBhZHZpc2VkIG9mIHRoZQ0KICAgICBwbGFuZXQgdHlwZSBiZWZvcmUgeW91IGhhdmUgdG8gbmFtZSBpdCBzbyB5b3UgY2FuIGFzc2lnbiBhbg0KICAgICBhcHByb3ByaWF0ZSBuYW1lLg0KDQombHQ7SiZndDsgIEpldHRpc29uIENhcmdvLiAgSWYgeW91ciBob2xkcyBhcmUgZnVsbCBvZiBzb21lIGNhcmdvIHlvdQ0KICAgICBqdXN0IGNhbid0IHVubG9hZCBvbiBhbnkgbmVhcmJ5IHBvcnQgb3IgcGxhbmV0LCB5b3UgbWF5DQogICAgIHVzZSB0aGlzIHNlbGVjdGlvbiB0byB1bmNlcmVtb25pb3VzbHkgZHVtcCB5b3VyIGhvbGRzDQogICAgIGludG8gc3BhY2UuICBSZW1lbWJlciB0aGF0IEZlZExhdyBwcm9oaWJpdHMgbGl0dGVyaW5nIGluDQogICAgIEZlZFNwYWNlLiAgRHVtcGluZyBob2xkcyBmaWxsZWQgd2l0aCBjb2xvbmlzdHMgd2lsbCBsZWF2ZQ0KICAgICBhIG5lZ2F0aXZlIGltcHJlc3Npb24gb24geW91ciBhbGlnbm1lbnQuDQoNCiZsdDtCJmd0OyAgSW50ZXJkaWN0IENvbnRyb2wuICBJZiB5b3UgYXJlIHBpbG90aW5nIGFuIEludGVyZGljdG9yDQogICAgIENydWlzZXIsIHVzZSB0aGlzIG9wdGlvbiB0byBzZXQgdGhlIGdlbmVyYXRvciBwb3dlcmluZyB0aGUNCiAgICAgSW50ZXJkaWN0b3Igb24gb3Igb2ZmLiAgSWYgaXQgaXMgb24sIGFuIGVuZW15IHdpbGwgbm90IGJlDQogICAgIGFibGUgdG8gd2FycCBvdXQgb2YgdGhlIHNlY3RvciBkdXJpbmcgYW4gYXR0YWNrLg0KDQpUYWN0aWNhbA0KDQombHQ7QSZndDsgIEF0dGFjayBFbmVteSBTcGFjZUNyYWZ0LiAgV2hlbiB5b3UgZW5jb3VudGVyIGFuIG9wcG9uZW50LA0KICAgICBvdGhlciBjcmVhdHVyZSBvciB1bm1hbm5lZCBzaGlwIGluIGEgc2VjdG9yIHlvdSBoYXZlIHRoZQ0KICAgICBvcHRpb24gb2YgZ29pbmcgb24gdGhlIG9mZmVuc2UgYW5kIGF0dGFja2luZy4gIFRoZQ0KICAgICBjb250cm9sbGVyIHdpbGwgYXNrIHlvdSBob3cgbWFueSBvZiB5b3VyIGZpZ2h0ZXJzIHlvdSB3YW50DQogICAgIHRvIHVzZSBpbiB0aGUgYXR0YWNrLiAgV2hlbiB5b3UgYXJlIG11Y2ggc3Ryb25nZXIgdGhhbiB5b3VyDQogICAgIG9wcG9uZW50LCB0aGVyZSBpcyBhIGNoYW5jZSB0aGF0IHRoZSBvcHBvbmVudCB3aWxsIHdhcnAgb3V0DQogICAgIG9mIHRoZSBzZWN0b3IuICBJZiB5b3UgYXJlIHZlcnkgY2FyZWZ1bCB3aXRoIHRoZSBhbW91bnQgb2YNCiAgICAgZmlyZXBvd2VyIHlvdSB1c2UgaW4geW91ciBhdHRhY2ssIHRoZXJlIG1heSBiZSBzaWduaWZpY2FudA0KICAgICBzYWx2YWdlIGF2YWlsYWJsZSBhZnRlciB5b3Ugd2luLiAgQXR0YWNraW5nIG90aGVycyBjYW4gKGFuZA0KICAgICBwcm9iYWJseSB3aWxsKSBhZmZlY3QgeW91ciBhbGlnbm1lbnQuICBJZiB5b3UgYXR0YWNrIGENCiAgICAgcGlyYXRlIG9yIGtub3duIHRlcnJvciB5b3Ugd2lsbCBnZXQgZ29vZCBwb2ludHMuICBPbiB0aGUNCiAgICAgb3RoZXIgaGFuZCwgaWYgeW91IGRlY2lkZSB0byBwaWNrIG9uIHNvbWUgZ29vZCBzb3VsIHlvdSB3aWxsDQogICAgIGdvIGRvd24gdGhlIGxhZGRlciBvZiByaWdodGVvdXNuZXNzLg0KDQombHQ7RSZndDsgIFVzZSBTdWJzcGFjZSBFdGhlciBQcm9iZS4gIExhdW5jaCB0aGUgUHJvYmUgeW91IHB1cmNoYXNlZCBhdA0KICAgICB0aGUgSGFyZHdhcmUgRW1wb3JpdW0uICBTZW5kIHRoZSB1bm1hbm5lZCBzcHkgb2ZmIHRvIGl0cw0KICAgICBkZXN0aW5hdGlvbiBzZW5kaW5nIGluZm9ybWF0aW9uIGJhY2sgdG8geW91IGZyb20gZXZlcnkNCiAgICAgc2VjdG9yIGl0IHBhc3NlcyB0aHJvdWdoLiAgUmVtZW1iZXIgdGhhdCB0aGlzIGRldmljZSBoYXMNCiAgICAgbm8gZGVmZW5zaXZlIGNhcGFiaWxpdGllcyBzbyBpZiBpdCBlbmNvdW50ZXJzIGFueSBlbmVteQ0KICAgICBmaWdodGVycywgaXQgd2lsbCBiZSBkZXN0cm95ZWQuDQoNCiZsdDtGJmd0OyAgVGFrZSBvciBMZWF2ZSBGaWdodGVycy4gIFRoaXMgZW5hYmxlcyB5b3UgdG8gZGVwbG95IHlvdXINCiAgICAgZmlnaHRlcnMuICBZb3Ugd2lsbCBoYXZlIHNldmVyYWwgb3B0aW9ucyBzbyB5b3UgY2FuDQogICAgIGN1c3RvbWl6ZSB5b3VyIGRlZmVuc2VzLiAgWW91IGNhbiBsZWF2ZSBmaWdodGVycyBhcw0KICAgICBlaXRoZXIgUGVyc29uYWwgc28gdGhleSByZWNvZ25pemUgb25seSB5b3UgYXMgYW4gYWxseSBvcg0KICAgICB5b3UgY2FuIGxlYXZlIHRoZW0gYXMgQ29ycG9yYXRlIHNvIGFueSBtZW1iZXIgb2YgeW91cg0KICAgICBjb3Jwb3JhdGlvbiB3aWxsIGJlIHRyZWF0ZWQgd2l0aCByZXNwZWN0LiAgRmlnaHRlcnMgY2FuDQogICAgIGJlIE9mZmVuc2l2ZSwgRGVmZW5zaXZlIG9yIFRvbGwuICBEZWZlbnNpdmUgZmlnaHRlcnMNCiAgICAgZGVmZW5kIHlvdXIgdGVycml0b3J5LiAgVGhleSBiYXIgb3Bwb25lbnRzIGZyb20gZW50ZXJpbmcNCiAgICAgYSBzZWN0b3IgYW5kIHdpbGwgZmlnaHQgd2hlbiBhdHRhY2tlZC4gIE9mZmVuc2l2ZQ0KICAgICBmaWdodGVycyB3aWxsIHNlbmQgb3V0IGFuIGF0dGFjayBncm91cCBvbiBhbnkgcG9vciBzb3VsDQogICAgIHdobyBoYXBwZW5zIGludG8gdGhlaXIgc2VjdG9yLiAgVGhlIHNpemUgb2YgdGhlIGF0dGFjaw0KICAgICBncm91cCBkZXBlbmRzIG9uIHRoZSBmaWdodGVyIHN1cHBvcnQgZXNjb3J0aW5nIHRoZQ0KICAgICBpbnRydWRlci4gIEFmdGVyIHRoZSBpbml0aWFsIGF0dGFjaywgb2ZmZW5zaXZlIGZpZ2h0ZXJzDQogICAgIGZhbGwgYmFjayB0byBkZWZlbmQgdGhlaXIgdGVycml0b3J5LiAgVG9sbCBmaWdodGVycw0KICAgICBzaW1wbHkgc3RvcCB0aGUgY2FzdWFsIHBhc3NlcnMtYnkgYW5kIGFzayB0aGVtIGZvciBtb25leQ0KICAgICB0byBoZWxwIHdpdGggeW91ciBjYXVzZS4gIFRoZSBudW1iZXIgb2YgVG9sbCBGaWdodGVycw0KICAgICBkZXBsb3llZCB3aWxsIGRldGVybWluZSB0aGUgYW1vdW50IG9mIHRoZSB0b2xsIGNoYXJnZWQuDQogICAgIFRvbGwgZmlnaHRlcnMsIGFzIGFsbCBvdGhlciBmaWdodGVycywgd2lsbCBmaWdodCBiYWNrIGlmDQogICAgIGF0dGFja2VkLg0KDQombHQ7RyZndDsgIFNob3cgRGVwbG95ZWQgRmlnaHRlcnMuICBUaGlzIGRpc3BsYXkgY2FuIGJlIGEgdmVyeQ0KICAgICB1c2VmdWwgdG9vbCBhcyB5b3UgcGxhbiB5b3VyIG1pbGl0YXJ5IHN0cmF0ZWdpZXMuICBUaGUNCiAgICAgaW5mb3JtYXRpb24gc2hvd24gY29udGFpbnMgdGhlIHNlY3RvciBudW1iZXIgd2hlcmUgdGhlDQogICAgIGZpZ2h0ZXJzIGFyZSBsb2NhdGVkLCB0aGUgcXVhbnRpdHkgb2YgZmlnaHRlcnMgdGhlcmUsDQogICAgIHdoZXRoZXIgdGhlIGZpZ2h0ZXJzIGFyZSBQZXJzb25hbCBvciBDb3Jwb3JhdGUsIHRoZQ0KICAgICBzdHJhdGVnaWMgbW9kZSB0aGV5IGFyZSBpbiAoT2ZmZW5zaXZlLCBEZWZlbnNpdmUgb3IgVG9sbCkNCiAgICAgYW5kIGFueSB0b2xscyB0aGV5IGhhdmUgY29sbGVjdGVkLg0KDQombHQ7SCZndDsgIEhhbmRsZSBTcGFjZSBNaW5lcy4gIE1pbmVzIGNhbiBiZSBhIHZlcnkgY29udmluY2luZyB3YXkNCiAgICAgb2YgbWFya2luZyB5b3VyIHRlcnJpdG9yeS4gIFRoaXMgc2VsZWN0aW9uIHdpbGwgbGV0IHBsYWNlDQogICAgIGJvdGggTGltcGV0IGFuZCBBcm1pZCBtaW5lcyBhbmQgYWxsb3dzIHlvdSBwbGFjZSBvciBwaWNrIHVwDQogICAgIHRoZSBtaW5lcy4gIFlvdSB3aWxsIGJlIGFibGUgdG8gY2hvb3NlIHdoZXRoZXIgdG8gc2V0IHRoZQ0KICAgICBtaW5lcyBhcyBQZXJzb25hbCBvciBDb3Jwb3JhdGUuIFBlcnNvbmFsIG1pbmVzIHdpbGwNCiAgICAgcmVjb2duaXplIG9ubHkgeW91IGFuZCBDb3Jwb3JhdGUgbWluZXMgd2lsbCByZWNvZ25pemUgYW55DQogICAgIG1lbWJlciBvZiB5b3VyIGNvcnBvcmF0aW9uLiBNaW5lcyBkb24ndCBhbHdheXMgd29yaywgYnV0IGl0DQogICAgIHN0YW5kcyB0byByZWFzb24gdGhhdCB0aGUgbW9yZSBtaW5lcyB0aGVyZSBhcmUgaW4gYSBzZWN0b3IsDQogICAgIHRoZSBtb3JlIGxpa2VseSBvbmUgaXMgdG8gZGV0b25hdGUgKG9yIGF0dGFjaCBpbiB0aGUgY2FzZSBvZg0KICAgICBMaW1wZXQgbWluZXMpLg0KDQombHQ7SyZndDsgIFNob3cgRGVwbG95ZWQgTWluZXMuICBUaGlzIGRpc3BsYXkgaXMgc2ltaWxhciB0byB0aGUgU2hvdw0KICAgICBEZXBsb3llZCBGaWdodGVycy4gIFlvdSBnZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlY3RvcnMNCiAgICAgY29udGFpbmluZyB5b3VyIFBlcnNvbmFsIGFuZC9vciBDb3Jwb3JhdGUgTGltcGV0IGFuZCBBcmFtaWQNCiAgICAgbWluZXMgYW5kIGhvdyBtYW55IG1pbmVzIGFyZSBsb2NhdGVkIGluIGVhY2ggb2YgdGhvc2UNCiAgICAgc2VjdG9ycy4gIEluIHRoZSBjYXNlIG9mIExpbXBldCBtaW5lcywgeW91IHdpbGwgZ2V0IHR3bw0KICAgICBkaXNwbGF5cy4gIE9uZSB3aWxsIHNob3cgdGhlIGRlcGxveWVkIG1pbmVzIGp1c3Qgd2FpdGluZyBmb3INCiAgICAgeW91ciB1bnN1c3BlY3RpbmcgZW5lbXkuICBUaGUgb3RoZXIgZGlzcGxheSBpcyBBY3RpdmF0ZWQNCiAgICAgbWluZXMgLSBpdCBzaG93cyB0aG9zZSBtaW5lcyB3aGljaCBoYXZlIGF0dGFjaGVkIHRvIHNoaXBzDQogICAgIGFuZCB3aGVyZSB0aGV5IGFyZS4NCg0KJmx0O08mZ3Q7ICBTdGFycG9ydCBDb25zdHJ1Y3Rpb24uICBJZiB0aGVyZSBpcyBub3QgYSBTdGFycG9ydCBpbiB0aGUNCiAgICAgc2VjdG9yLCB0aGlzIG1lbnUgc2VsZWN0aW9uIHdpbGwgZGlzcGxheSB0aGUgU3RhcnBvcnQNCiAgICAgQ29uc3RydWN0aW9uIE1lbnUuICBTdGFycG9ydHMgYXJlIGF2YWlsYWJsZSB0aHJvdWdob3V0DQogICAgIHRoZSB1bml2ZXJzZS4gIFlvdSBtYXkgZGVjaWRlIHRoYXQgeW91IHdhbnQgeW91ciBvd24NCiAgICAgY3VzdG9taXplZCBjb21tZXJjZSBjZW50ZXIgaW4gYSBwbGFjZSB5b3Ugc3BlY2lmeSBpbnN0ZWFkDQogICAgIG9mIHVzaW5nIHRoZSBvbmVzIGJ1aWx0IGJ5IG90aGVycy4gIFlvdSB3aWxsIHNlZSBhDQogICAgIGRldGFpbGVkIGdyYXBoIG9mIHRoZSBkaWZmZXJlbnQgcG9ydCBjbGFzc2VzLCB0aGUNCiAgICAgcHJvZHVjdHMgdGhleSBjYW4gaW1wb3J0L2V4cG9ydCBhbmQgdGhlIGluaXRpYWwNCiAgICAgY29uc3RydWN0aW9uIGNvc3RzLiAgVGhlIGxpY2Vuc2UgYnVyZWF1IHdpbGwgY2hlY2sgdG8gc2VlDQogICAgIHRoYXQgdGhlcmUgaXMgYSBwbGFuZXQgaW4gdGhlIHNlY3RvciB0byBwcm92aWRlIG1hdGVyaWFscw0KICAgICBmb3IgdGhlIGNvbnN0cnVjdGlvbi4gIFRoZXkgd2lsbCBhbHNvIGNoZWNrIGZvcg0KICAgICBzdWZmaWNpZW50IGZ1bmRpbmcgdG8gc3VwcG9ydCB0aGUgdW5kZXJ0YWtpbmcuICBCZSBzdXJlDQogICAgIHRvIGxlYXZlIHRoZSBzcGVjaWZpZWQgYW1vdW50IG9mIG1hdGVyaWFscyBvbiB0aGUgcGxhbmV0DQogICAgIGV2ZXJ5IGRheSBkdXJpbmcgdGhlIGNvbnN0cnVjdGlvbiBwaGFzZSBvciB0aGUgYnVpbGRpbmcNCiAgICAgd2lsbCBub3QgcHJvZ3Jlc3MuICBJZiB0aGVyZSBpcyBhbHJlYWR5IGEgU3RhcnBvcnQgaW4gdGhlDQogICAgIHNlY3RvciwgdGhlIFVwZ3JhZGUgU3RhcnBvcnQgTWVudSB3aWxsIGJlIGRpc3BsYXllZC4NCiAgICAgVGhpcyBhbGxvd3MgeW91IHRvIGluY3JlYXNlIHRoZSB0cmFkaW5nIGxldmVscyBvZiBhbnkgb3INCiAgICAgYWxsIG9mIHRoZSBjb21tb2RpdGllcy4gIFRoZSB1bml2ZXJzZSBjYW4gc3VwcG9ydCBvbmx5IHNvDQogICAgIG1hbnkgcG9ydHMuICBJZiB0aGUgU3RhcnBvcnQgQ29uc3RydWN0aW9uIHJlcXVlc3QgdGVsbHMNCiAgICAgeW91IHRoYXQgdGhlIHVuaXZlcnNlIGlzIGZ1bGwsIHRoZW4geW91IGhhdmUgdG8gZGVzdHJveQ0KICAgICBhbiBleGlzdGluZyBwb3J0IGJlZm9yZSB5b3UgY2FuIGJlZ2luIGNvbnN0cnVjdGlvbiBvbg0KICAgICB5b3VyIG5ldyBvbmUuICAoU2VlIFBPUlQgQU5EIFRSQURFKQ0KDQombHQ7WSZndDsgIFNldCBOYXZQb2ludHMuICBVc2UgdGhpcyBvcHRpb24gdG8gbG9nIGltcG9ydGFudCBzZWN0b3JzIHRvDQogICAgIHlvdXIgbmF2aWdhdGlvbiB1bml0LiAgWW91IGNhbiB0aGVuIHBsb3QgYSBjb3Vyc2UgdG8gb25lIG9mDQogICAgIHRoZXNlIHNlY3RvcnMgYXQgYW55IHRpbWUgZnJvbSB0aGUgTmF2UG9pbnQgbWVudSAoJmx0O04mZ3Q7IGZyb20NCiAgICAgbWFpbiBtZW51KS4NCg0KR2xvYmFsIENvbW1hbmRzDQoNCiAgICAgVGhlc2UgZmVhdHVyZXMgY2FuIGJlIGFjY2Vzc2VkIGZyb20gYW55IHByb21wdCBpbiB0aGUgZ2FtZS4gIFRoZQ0KICAgICBjb21tYW5kIG11c3QgYmUgdGhlIGZpcnN0IGNoYXJhY3RlciBvbiBhbnkgcHJvbXB0IGxpbmUsIGFuZA0KICAgICBhIGdpdmVuIGNvbW1hbmQgY2Fubm90IGJlIGFjY2Vzc2VkIGZyb20gd2l0aGluIGl0c2VsZi4NCg0KJmx0O2AmZ3Q7ICBGZWQuIENvbW0tTGluay4gIFRoaXMgZW5hYmxlcyB5b3UgdG8gc2VuZCBhIG1lc3NhZ2UgdG8gYWxsDQogICAgIG90aGVyIHBsYXllcnMgaW4gdGhlIGdhbWUgb3ZlciB0aGUgZ2xvYmFsIEZlZGVyYXRpb24gY29tbS1saW5rLg0KICAgICBQbGF5ZXJzIGNhbiB0dXJuIG9mZiB0aGUgRmVkLiBjb21tLWxpbmsgaW4gdGhlIGNvbXB1dGVyIG1lbnUNCiAgICAgKFBlcnNvbmFsIFNldHRpbmdzKSwgYW5kIHdpbGwgbm8gbG9uZ2VyIHJlY2VpdmUgZ2xvYmFsIG1lc3NhZ2VzLg0KDQogICAgIFlvdSB1c2UgdGhpcyBmZWF0dXJlIGluIGVpdGhlciBvZiB0d28gd2F5czoNCg0KICAgICAxKSBUeXBlIGAgYW5kIHByZXNzICZsdDtFTlRFUiZndDsuICBZb3Ugd2lsbCBiZSBwcm9tcHRlZCB0byB0eXBlIGluDQogICAgICAgIHlvdXIgbWVzc2FnZSwgcHJlc3NpbmcgJmx0O0VOVEVSJmd0OyB0byBzZW5kIGVhY2ggbGluZS4gIFNlbmRpbmcNCiAgICAgICAgYSBibGFuayBsaW5lIHdpbGwgdGVybWluYXRlIHRoZSB0cmFuc21pc3Npb24uICBJbiB0aGlzIHdheSwNCiAgICAgICAgeW91IGNhbiBzZW5kIGFueSBudW1iZXIgb2YgbGluZXMsIGVhY2ggMTU1IGNoYXJhY3RlcnMgb3INCiAgICAgICAgbGVzcy4NCg0KICAgICAyKSBUeXBlIGAgZm9sbG93ZWQgaW1tZWRpYXRlbHkgYnkgeW91ciBvbmUgbGluZSBtZXNzYWdlLg0KDQogICAgICAgIEV4YW1wbGU6IGBJcyBhbnlvbmUgbGlzdGVuaW5nPw0KDQogICAgICAgIFVwb24gcHJlc3NpbmcgJmx0O0VOVEVSJmd0OywgdGhpcyBvbmUgbGluZSBtZXNzYWdlIHdpbGwgYmUgc2VudCwNCiAgICAgICAgYW5kIHRoZSB0cmFuc21pc3Npb24gd2lsbCBiZSB0ZXJtaW5hdGVkLCByZXR1cm5pbmcgeW91IHRvIHRoZQ0KICAgICAgICBwcmV2aW91c2x5IGFjdGl2ZSBwcm9tcHQuICBBcyBiZWZvcmUsIHRoaXMgbGluZSBjYW4gYmUgdXAgdG8NCiAgICAgICAgMTU1IGNoYXJhY3RlcnMgaW4gbGVuZ3RoLg0KDQombHQ7JyZndDsgIFN1Yi1zcGFjZSBSYWRpby4gIFRoaXMgZW5hYmxlcyB5b3UgdG8gc2VuZCBhIG1lc3NhZ2UgdG8gYWxsDQogICAgIG90aGVyIHBsYXllcnMgaW4gdGhlIGdhbWUgd2hvIGFyZSB0dW5lZCB0byB5b3VyIHJhZGlvIGNoYW5uZWwuICBCeQ0KICAgICBkZWZhdWx0LCBldmVyeW9uZSBzdGFydHMgb24gcmFkaW8gY2hhbm5lbCB6ZXJvIHVudGlsIGNoYW5nZWQNCiAgICAgaW4gdGhlIGNvbXB1dGVyIG1lbnUgKFBlcnNvbmFsIFNldHRpbmdzKS4NCg0KICAgICBZb3UgdXNlIHRoaXMgZmVhdHVyZSBpbiBlaXRoZXIgb2YgdHdvIHdheXM6DQoNCiAgICAgMSkgVHlwZSAnIGFuZCBwcmVzcyAmbHQ7RU5URVImZ3Q7LiAgWW91IHdpbGwgYmUgcHJvbXB0ZWQgdG8gdHlwZSBpbg0KICAgICAgICB5b3VyIG1lc3NhZ2UsIHByZXNzaW5nICZsdDtFTlRFUiZndDsgdG8gc2VuZCBlYWNoIGxpbmUuICBTZW5kaW5nDQogICAgICAgIGEgYmxhbmsgbGluZSB3aWxsIHRlcm1pbmF0ZSB0aGUgdHJhbnNtaXNzaW9uLiAgSW4gdGhpcyB3YXksDQogICAgICAgIHlvdSBjYW4gc2VuZCBhbnkgbnVtYmVyIG9mIGxpbmVzLCBlYWNoIDE1NSBjaGFyYWN0ZXJzIG9yDQogICAgICAgIGxlc3MuDQoNCiAgICAgMikgVHlwZSAnIGZvbGxvd2VkIGltbWVkaWF0ZWx5IGJ5IHlvdXIgb25lIGxpbmUgbWVzc2FnZS4NCg0KICAgICAgICBFeGFtcGxlOiAnSXMgYW55b25lIGxpc3RlbmluZz8NCg0KICAgICAgICBVcG9uIHByZXNzaW5nICZsdDtFTlRFUiZndDssIHRoaXMgb25lIGxpbmUgbWVzc2FnZSB3aWxsIGJlIHNlbnQsDQogICAgICAgIGFuZCB0aGUgdHJhbnNtaXNzaW9uIHdpbGwgYmUgdGVybWluYXRlZC4gIEFzIGJlZm9yZSwgdGhpcw0KICAgICAgICBsaW5lIGNhbiBiZSB1cCB0byAxNTUgY2hhcmFjdGVycyBpbiBsZW5ndGguDQoNCiZsdDs9Jmd0OyAgSGFpbGluZyBGcmVxdWVuY2llcy4gIFRoaXMgZW5hYmxlcyB5b3UgdG8gc2VuZCBhIG1lc3NhZ2Ugb3ZlciBhDQogICAgIHNlY3VyZWQgY2hhbm5lbCB0byBhbm90aGVyIHRyYWRlci4gIFRoaXMgaXMgbm90IHRvIGJlIGNvbmZ1c2VkIHdpdGgNCiAgICAgcHJpdmF0ZSBtYWlsLiAgTWVzc2FnZXMgc2VudCBoZXJlIGFyZSBub3Qgc3RvcmVkIGluIHRoZSB0cmFkZXJzDQogICAgIG1haWwgbG9nLg0KDQogICAgIFlvdSB1c2UgdGhpcyBmZWF0dXJlIGluIGFueSBvZiB0aHJlZSB3YXlzOg0KDQogICAgIDEpIFR5cGUgPSBhbmQgcHJlc3MgJmx0O0VOVEVSJmd0Oy4gIFlvdSB3aWxsIGJlIHByb21wdGVkIHRvIHR5cGUgaW4NCiAgICAgICAgdGhlIG5hbWUgb2YgdGhlIHRyYWRlciB5b3UgYXJlIGNvbnRhY3RpbmcuICBBc3N1bWluZyB0aGlzIHRyYWRlcg0KDQogICAgICAgIGlzIHZhbGlkLCB5b3VyIGNvbXB1dGVyIHdpbGwgc2VuZCBhIGhhaWxpbmcgbWVzc2FnZS4gIElmIHRoZQ0KICAgICAgICB1c2VyIGlzIG9ubGluZSwgYSBwcml2YXRlIGNoYW5uZWwgd2lsbCBiZSBvcGVuZWQuICBZb3Ugd2lsbCB0aGVuDQogICAgICAgIGJlIHByb21wdGVkIHRvIHR5cGUgaW4geW91ciBtZXNzYWdlLCBwcmVzc2luZyAmbHQ7RU5URVImZ3Q7IHRvIHNlbmQgZWFjaA0KICAgICAgICBsaW5lLiAgU2VuZGluZyBhIGJsYW5rIGxpbmUgd2lsbCB0ZXJtaW5hdGUgdGhlIHRyYW5zbWlzc2lvbi4gIEluDQogICAgICAgIHRoaXMgd2F5LCB5b3UgY2FuIHNlbmQgYW55IG51bWJlciBvZiBsaW5lcywgZWFjaCAxNTUgY2hhcmFjdGVycyBvcg0KICAgICAgICBsZXNzLg0KDQogICAgIDIpIFR5cGUgPSBmb2xsb3dlZCBpbW1lZGlhdGVseSBieSB0aGUgdHJhZGVyIHlvdSBhcmUgY29udGFjdGluZy4NCg0KICAgICAgICBFeGFtcGxlOiA9S2FsIER1cmFrDQoNCiAgICAgICAgVXBvbiBwcmVzc2luZyAmbHQ7RU5URVImZ3Q7LCBhc3N1bWluZyB0aGlzIHRyYWRlciBpcyB2YWxpZCwgeW91ciBjb21wdXRlcg0KICAgICAgICB3aWxsIHNlbmQgYSBoYWlsaW5nIG1lc3NhZ2UuICBJZiB0aGUgdXNlciBpcyBvbmxpbmUsIGEgcHJpdmF0ZQ0KICAgICAgICBjaGFubmVsIHdpbGwgYmUgb3BlbmVkLiAgWW91IHdpbGwgdGhlbiBiZSBwcm9tcHRlZCB0byB0eXBlIHlvdXINCiAgICAgICAgbWVzc2FnZSwgcHJlc3NpbmcgJmx0O0VOVEVSJmd0OyB0byBzZW5kIGVhY2ggbGluZS4gIEFzIGJlZm9yZSwgc2VuZGluZyBhDQogICAgICAgIGJsYW5rIGxpbmUgd2lsbCB0ZXJtaW5hdGUgdGhlIHRyYW5zbWlzc2lvbiwgYW5kIHlvdSBjYW4gc2VuZCBhbnkNCiAgICAgICAgbnVtYmVyIG9mIGxpbmVzLCBlYWNoIDE1NSBjaGFyYWN0ZXJzIG9yIGxlc3MuDQoNCiAgICAgMykgVHlwZSA9IGZvbGxvd2VkIGltbWVkaWF0ZWx5IGJ5IHRoZSB0cmFkZXIgeW91IGFyZSBjb250YWN0aW5nLA0KICAgICAgICBmb2xsb3dlZCB0aGVuIGJ5IGEgY29tbWEsIGFuZCB0aGUgb25lIGxpbmUgbWVzc2FnZSB0byBiZSBzZW50Lg0KDQogICAgICAgIEV4YW1wbGU6ID1LYWwgRHVyYWssIE1lZXQgbWUgYXQgU3RhcmRvY2shDQoNCg0KICAgICAgICBVcG9uIHByZXNzaW5nICZsdDtFTlRFUiZndDssIHlvdXIgY29tcHV0ZXIgd2lsbCBhdHRlbXB0IHRvIGNvbnRhY3QNCiAgICAgICAgdGhpcyB0cmFkZXIuICBJZiB0aGlzIGlzIGEgdmFsaWQgdHJhZGVyIG5hbWUsIHRoZSBvbmUgbGluZQ0KICAgICAgICBtZXNzYWdlIHdpbGwgYmUgdHJhbnNtaXR0ZWQsIGFuZCB0aGUgdHJhbnNtaXNzaW9uIHdpbGwgZW5kLg0KICAgICAgICBUaGlzIGxpbmUsIGluY2x1ZGluZyB0cmFkZXIgbmFtZSwgaXMgbGltaXRlZCB0byAxNTUgY2hhcmFjdGVycy4NCiAgICAgICAgSWYgdGhhdCB0cmFkZXIgaXMgbm90IGF2YWlsYWJsZSBhdCB0aGUgbW9tZW50LCB0aGUgbWVzc2FnZSB3aWxsIG5vdA0KICAgICAgICBiZSByZWNlaXZlZC4NCg0KICAgICBJbiBhbGwgb2YgdGhlIGFib3ZlIGNhc2VzLCBpZiB0aGUgdHJhZGVyIGlzIG5vdCBvbmxpbmUsIHRoZSBtZXNzYWdlDQogICAgIHdpbGwgYmUgcm91dGVkIHRvIHRoZSBHYWxhY3RpYyBNLkEuSS5MLiBTZXJ2aWNlLg0KDQogICAgIEVzdGFibGlzaGluZyBhIHR3by13YXkgc2VjdXJlZCBjb21tLWxpbms6DQoNCiAgICAgICAgT25jZSB0aGUgY29tcHV0ZXIgZXN0YWJsaXNoZXMgdGhlIGlkZW50aXR5IG9mIHRoZSB0cmFkZXIgeW91IGFyZQ0KICAgICAgICBjb250YWN0aW5nLCBhICJoYWlsaW5nIiBtZXNzYWdlIGlzIHNlbnQuICBJZiB0aGF0IHRyYWRlciB3aXNoZXMsDQogICAgICAgIGhlIG9yIHNoZSBtYXkgdGhlbiBjb250YWN0IHlvdSB3aXRoIHRoZSAiSGFpbGluZyBGcmVxdWVuY2llcyINCiAgICAgICAgY29tbWFuZC4gIEluIHRoaXMgd2F5LCBhIHNlY3VyZWQgdHdvLXdheSBjb21tLWxpbmsgY2FuIGJlDQogICAgICAgIGVzdGFibGlzaGVkIGJldHdlZW4gdHdvIHRyYWRlcnMuICBUaGUgdHJhbnNtaXNzaW9uIHdvcmtzIGp1c3QgYXMNCiAgICAgICAgYmVmb3JlLCBhY2NlcHQgdGhhdCB0aGUgaW5jb21pbmcgbWVzc2FnZSBiYW5uZXIgZm9yIHRoaXMgdHJhZGVyDQogICAgICAgIHdpbGwgYmUgc2hvcnRlbmVkIHRvIHRoZSB0cmFkZXIncyBuYW1lIGFuZCBhIGNvbG9uLiAgRm9yIGV4YW1wbGUsDQoNCiAgICAgICAgS2FsIER1cmFrOg0KICAgICAgICBJJ20gYWxyZWFkeSBhdCBTdGFyZG9jay4uLg0KDQogICAgICAgIFRoaXMgaXMgbWVhbnQgdG8gZmFjaWxpdGF0ZSBsZW5ndGh5IGNoYXQgc2Vzc2lvbnMgYmV0d2VlbiB0cmFkZXJzLg0KDQombHQ7IyZndDsgIFdobydzIHBsYXlpbmcuICBUaGlzIGRpc3BsYXlzIGEgbGlzdCBvZiBvdGhlciBhbGwgdXNlcnMgaW4gdGhlDQogICAgIGdhbWUgYXQgdGhpcyB0aW1lLg0KDQombHQ7LyZndDsgIFF1aWNrLXN0YXRzLiAgRGlzcGxheXMgYSBjb21wYWN0IG92ZXJ2aWV3IG9mIHlvdXIgc3RhdHMsIGluY2x1ZGluZw0KICAgICB0dXJucywgY3JlZGl0cywgYWxpZ25tZW50LCBleHBlcmllbmNlLCBhbmQgaW5mbyBhYm91dCB5b3VyIHNoaXAuDQoNCk1pc2NlbGxhbmVvdXMNCg0KJmx0O1EmZ3Q7ICBRdWl0IGFuZCBFeGl0LiAgVGhpcyBleGl0cyB5b3UgZnJvbSB0aGUgZ2FtZSBhbmQgcmV0dXJucw0KICAgICB5b3UgdG8gdGhlIEJCUy4NCg0KJmx0OyEmZ3Q7ICBNYWluIE1lbnUgSGVscC4gIERpc3BsYXkgdGhlIHBvcnRpb24gb2YgdGhlIGRvY3VtZW50YXRpb24NCiAgICAgZGVzY3JpYmluZyB0aGUgTWFpbiBNZW51IGZ1bmN0aW9ucy4NCg0KJmx0O1omZ3Q7ICBUcmFkZSBXYXJzIERvY3MuICBEaXNwbGF5IHRoaXMgZW50aXJlIGRvY3VtZW50LiAgVXNlZnVsDQogICAgIG1lbnVzIGFyZSBhdmFpbGFibGUgYW55dGltZSBhID8gYXBwZWFycyBpbiB0aGUgcHJvbXB0Lg0KICAgICBTcGVjaWZpYyBoZWxwIGZpbGVzIGFyZSBhdmFpbGFibGUgd2hlcmV2ZXIgYW4gISBhcHBlYXJzDQogICAgIGluIHRoZSBtZW51cy4NCg0KJmx0O1YmZ3Q7ICBWaWV3IEdhbWUgU3RhdHVzLiAgVHJhZGUgV2FycyAyMDAyIGNhbiBiZSBjb25maWd1cmVkIGluDQogICAgIGEgdmFyaWV0eSBvZiB3YXlzIGJ5IHlvdXIgU3lzT3AuICBUaGlzIGRpc3BsYXkgd2lsbCBzaG93DQogICAgIHlvdSB0aGUgc3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoZSBnYW1lIGFzIHdlbGwgYXMgdGhlDQogICAgIGN1cnJlbnQgaW5mb3JtYXRpb24uICBTdGF0aWMgaW5mb3JtYXRpb24gaW5jbHVkZXMgdGhlDQogICAgIHZlcnNpb24gbnVtYmVyLCBtYXhpbXVtIG51bWJlciBvZiBzZWN0b3JzLCBwbGF5ZXJzLCBldGMuLA0KICAgICB3aGV0aGVyIG9yIG5vdCB0aGUgbG9jYWwgZGlzcGxheSBpcyBvbiwgYW5kIGlmIHRoaXMgaXMgYQ0KICAgICByZWdpc3RlcmVkIHZlcnNpb24gb2YgdGhlIGdhbWUuICBUaGUgU3RhckRvY2sgbG9jYXRpb24NCiAgICAgbWF5IGFsc28gYXBwZWFyIG9uIHRoaXMgc2NyZWVuIGlmIHRoZSBTeXNPcCBoYXMgY29uZmlndXJlZA0KICAgICB0aGUgZ2FtZSB0aGF0IHdheS4gIFRoZSBjdXJyZW50IGluZm9ybWF0aW9uIHdpbGwgc2hvdyBob3cNCiAgICAgbWFueSBwbGF5ZXJzIGFyZSBub3cgaW4gdGhlIGdhbWUgd2l0aCB0aGUgcGVyY2VudGFnZSBvZg0KICAgICBnb29kLCBob3cgbWFueSBwbGFuZXRzIGhhdmUgYmVlbiBidWlsdCwgaG93IG1hbnkNCiAgICAgY29ycG9yYXRpb25zIGFyZSByZWdpc3RlcmVkLCB0aGUgYW1vdW50IG9mIGNyZWRpdHMNCiAgICAgYWNjdW11bGF0ZWQgYXQgdGhlIHBvcnRzLCB0aGUgdG90YWwgZmlnaHRlcnMgYW5kIG1pbmVzIGluDQogICAgIHRoZSB1bml2ZXJzZSBhbmQgaG93IGxvbmcgdGhlIGdhbWUgaGFzIGJlZW4gcnVubmluZy4NCg0KSGlkZGVuIEtleXMgKE5vdCBvbiBtZW51KQ0KDQombHQ7Jmx0OyZndDsgIFJldHVybiB0byBQcmV2aW91cyBTZWN0b3IuICBUaGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIHRvIHF1aWNrbHkNCiAgICAgcmV0dXJuIHRvIHRoZSBzZWN0b3IgZnJvbSB3aGljaCB5b3UganVzdCBjYW1lLiAgUGFydGljdWxhcmx5DQogICAgIHVzZWZ1bCBpbiBwb3J0LXBhaXIgc2l0dWF0aW9ucywgd2hlcmUgeW91IGNhbiBlZmZvcnRsZXNzbHkNCiAgICAgbW92ZSBiZXR3ZWVuIHR3byBhZGphY2VudCBwYWlyZWQgcG9ydHMuDQoNCiAgICAgTk9URTogIFVzZSBvZiAmbHQ7LCZndDsgKG5vIHNoaWZ0KSBoYXMgYmVlbiBkaXNjb250aW51ZWQgYXMgb2YgdjMuMDUuDQoNCiZsdDtAJmd0OyAgR2FtZSBEZXRhaWxzLiAgU3lzb3Agb25seS4gIFNlZSBUV1NZU09QLkRPQyBmb3IgZGV0YWlscy4NCg0KJmx0O3wmZ3Q7ICBHbG9iYWwgdG8gdG9nZ2xlIHNpbGVuY2UgbW9kZS4gIFNhbWUgYXMgQ29tcHV0ZXIvUGVyc29uYWwgU2V0dGluZ3MvDQogICAgIFNpbGVuY2UgQUxMIE1lc3NhZ2VzLg==') + '</pre>')
    el.append(sectorPrompt.replace('#SECTORNUMBER', data.sector.number))
  }

  var computerMenu = function(data) {
    el.append('<br /><br />')

    var navigationMenu = $('<ul></ul>').addClass('list-unstyled')
    var otherMenu = $('<ul></ul>').addClass('list-unstyled')
    var miscMenu = $('<ul></ul>').addClass('list-unstyled')
    var displaysMenu = $('<ul></ul>').addClass('list-unstyled')

    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="plotter">F</a>&gt;</span> <span class="ansi-bright-cyan-fg">Course Plotter</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="warps">I</a>&gt;</span> <span class="ansi-bright-cyan-fg">Inter Sector Warps</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="explored">K</a>&gt;</span> <span class="ansi-bright-cyan-fg">Your Known Universe</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="report">R</a>&gt;</span> <span class="ansi-bright-cyan-fg">Port Report</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="twarp">U</a>&gt;</span> <span class="ansi-bright-cyan-fg">T-warp preference</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="avoid">V</a>&gt;</span> <span class="ansi-bright-cyan-fg">Avoid Sectors</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="listavoids">X</a>&gt;</span> <span class="ansi-bright-cyan-fg">List Current Avoids</span>'))

    otherMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-bright-cyan-fg">Computer Help</span>'))
    otherMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-bright-cyan-fg">Exit Computer</span>'))

    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="announce">A</a>&gt;</span> <span class="ansi-bright-cyan-fg">Make Announcement</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="selfdestruct">B</a>&gt;</span> <span class="ansi-yellow-fg">Begin Self Destruct</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="personalsettings">N</a>&gt;</span> <span class="ansi-bright-cyan-fg">Personal Settings</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="shipsettings">O</a>&gt;</span> <span class="ansi-bright-cyan-fg">Change Ship Settings</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="photon">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Fire Photon Missile</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="readmail">M</a>&gt;</span> <span class="ansi-bright-cyan-fg">Read Your Mail</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="sendmail">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">Send Mail</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="time">T</a>&gt;</span> <span class="ansi-bright-cyan-fg">Current Ship Time</span>'))
    miscMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="disrupt">W</a>&gt;</span> <span class="ansi-bright-cyan-fg">Use Mine Disruptor</span>'))

    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="shipcatalog">C</a>&gt;</span> <span class="ansi-bright-cyan-fg">View Ship Catalog</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="dailylog">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Scan Daily Log</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="evilclasses">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Evil Trader Class</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="goodclasses">G</a>&gt;</span> <span class="ansi-bright-cyan-fg">Good Trader Class</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="listaliens">H</a>&gt;</span> <span class="ansi-bright-cyan-fg">Alien Trader Rank</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="planetspecs">J</a>&gt;</span> <span class="ansi-bright-cyan-fg">Planetary Specs</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="listtraders">L</a>&gt;</span> <span class="ansi-bright-cyan-fg">List Trader Rank</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="planets">Y</a>&gt;</span> <span class="ansi-bright-cyan-fg">Personal Planets</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="activeship">Z</a>&gt;</span> <span class="ansi-bright-cyan-fg">Active Ship Scan</span>'))
    displaysMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="scan">;</a>&gt;</span> <span class="ansi-bright-cyan-fg">Scan Current Ship</span>'))

    var menuContainer = $('<div></div>').addClass('row')
    menuContainer.append($('<div></div>').addClass('col-md-3').html('<div class="col-xs-3 ansi-bright-yellow-fg">-=-</div><div class="col-xs-6 text-center ansi-magenta-fg">Navigation</div><div class="col-xs-3 ansi-bright-yellow-fg">-=-</div>').append(navigationMenu).append('<div class="col-xs-3 ansi-bright-yellow-fg">-=-</div><div class="col-xs-6 text-center ansi-magenta-fg">Other</div><div class="col-xs-3 ansi-bright-yellow-fg">-=-</div>').append(otherMenu))
    menuContainer.append($('<div></div>').addClass('col-md-3').html('<div class="col-xs-3 ansi-bright-yellow-fg">-=-</div><div class="col-xs-6 text-center ansi-magenta-fg">Misc</div><div class="col-xs-3 ansi-bright-yellow-fg">-=-</div>').append(miscMenu))
    menuContainer.append($('<div></div>').addClass('col-md-3').html('<div class="col-xs-3 ansi-bright-yellow-fg">-=-</div><div class="col-xs-6 text-center ansi-magenta-fg">Displays</div><div class="col-xs-3 ansi-bright-yellow-fg">-=-</div>').append(displaysMenu))
    el.append(menuContainer)
    el.append(computerPrompt.replace('#SECTORNUMBER', data.sector.number))
    window.scrollTo(0, document.body.scrollHeight)
  }

  var sectorMenu = function(data) {
    el.append('<br /><br />')

    var navigationMenu = $('<ul></ul>').addClass('list-unstyled')
    var computerMenu = $('<ul></ul>').addClass('list-unstyled')
    var tacticalMenu = $('<ul></ul>').addClass('list-unstyled')

    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="display">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Re-Display Sector</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="port">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Port and Trade</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="move">M</a>&gt;</span> <span class="ansi-bright-cyan-fg">Move to a Sector</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="land">L</a>&gt;</span> <span class="ansi-bright-cyan-fg">Land on a Planet</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="scan">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">Long Range Scan</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="beacon">R</a>&gt;</span> <span class="ansi-bright-cyan-fg">Release Beacon</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="tow">W</a>&gt;</span> <span class="ansi-bright-cyan-fg">Tow SpaceCraft</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="move">N</a>&gt;</span> <span class="ansi-bright-cyan-fg">Move to NavPoint</span>'))
    navigationMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-bright-yellow-fg">Quit and Exit</span>'))

    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="computer">C</a>&gt;</span> <span class="ansi-bright-cyan-fg">Onboard Computer</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="transporter">X</a>&gt;</span> <span class="ansi-bright-cyan-fg">Transporter Pad</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="shipinfo">I</a>&gt;</span> <span class="ansi-bright-cyan-fg">Ship Information</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="corp">T</a>&gt;</span> <span class="ansi-bright-cyan-fg">Corporate Menu</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="genesis">U</a>&gt;</span> <span class="ansi-bright-cyan-fg">Use Genesis Torp</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="jettison">J</a>&gt;</span> <span class="ansi-bright-cyan-fg">Jettison Cargo</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="interdict">B</a>&gt;</span> <span class="ansi-bright-cyan-fg">Interdict Ctrl</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-bright-yellow-fg">Main Menu Help</span>'))
    computerMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="docs">Z</a>&gt;</span> <span class="ansi-bright-yellow-fg">TradeWars Docs</span>'))

    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="attack">A</a>&gt;</span> <span class="ansi-bright-cyan-fg">Attack Enemy Ship</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="probe">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Sub-space EtherProbe</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="figs">F</a>&gt;</span> <span class="ansi-bright-cyan-fg">Take or Leave Fighters</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="showfigs">G</a>&gt;</span> <span class="ansi-bright-cyan-fg">Show Deployed Fighters</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="mines">H</a>&gt;</span> <span class="ansi-bright-cyan-fg">Handle Space Mines</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="showmines">K</a>&gt;</span> <span class="ansi-bright-cyan-fg">Show Deployed Mines</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="buildport">O</a>&gt;</span> <span class="ansi-bright-cyan-fg">Starport Construction</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="navpoint">Y</a>&gt;</span> <span class="ansi-bright-cyan-fg">Set NavPoints</span>'))
    tacticalMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="status">V</a>&gt;</span> <span class="ansi-bright-yellow-fg">View Game Status</span>'))

    var menuContainer = $('<div></div>').addClass('row')
    menuContainer.append($('<div></div>').addClass('col-md-3').html('<div style="text-align: center" class="ansi-magenta-fg">Navigation</span><br /><span class="ansi-bright-yellow-fg">=<span class="ansi-green-fg">-</span>=<span class="ansi-green-fg">-</span>==<span class="ansi-green-fg">-</span>=<span class="ansi-green-fg">-</span>=</div>').append(navigationMenu))
    menuContainer.append($('<div></div>').addClass('col-md-3').html('<div style="text-align: center" class="ansi-magenta-fg">Computer</span><br /><span class="ansi-bright-yellow-fg">=<span class="ansi-green-fg">-</span>=<span class="ansi-green-fg">-</span><span class="ansi-green-fg">-</span>=<span class="ansi-green-fg">-</span>=</span></div>').append(computerMenu))
    menuContainer.append($('<div></div>').addClass('col-md-3').html('<div style="text-align: center" class="ansi-magenta-fg">Tactical</span><br /><span class="ansi-bright-yellow-fg">=<span class="ansi-green-fg">-</span>=<span class="ansi-green-fg">-</span><span class="ansi-green-fg">-</span>=<span class="ansi-green-fg">-</span>=</div>').append(tacticalMenu))
    el.append(menuContainer)
    el.append(sectorPrompt.replace('#SECTORNUMBER', data.sector.number))
    window.scrollTo(0, document.body.scrollHeight)
  }

  var sectorMove = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Move&gt;</span><br />')
    el.append('<span class="ansi-bright-green-fg">Warps to Sector(s)</span> <span class="ansi-bright-yellow-fg">:</span> ' + formatWarpsList(data.sector.warps) + '<br />')
    el.append('<span class="ansi-magenta-fg show-entry">To which Sector <span class="ansi-bright-yellow-fg">[<a href="" class="ansi-bright-yellow-fg" data-attribute="sector" data-id="' + (config.last_sector ? config.last_sector.id : data.sector.id ) + '">' + (config.last_sector ? config.last_sector.number : data.sector.number ) + '</a>]</span> ? ')
    menuEventHandler([
      { 'nextFunction': moveToSector, 'nextFunctionArgs': [ data ], 'failure': true, 'max': universe.sectors },
      { 'nextFunction': moveToSector, 'nextFunctionArgs': [ data, (config.last_sector ? config.last_sector.number : data.sector.number) ], 'key': 13 },
      { 'nextFunction': moveToSector, 'nextFunctionArgs': [ data ], 'attribute': 'sector', 'get_id_from_attribute': true }
    ])
  }

  var moveToSector = function(data, id) {
    if (id == data.sector.number) {
      el.append('<br /><br />You are already in that sector!<br />')
      displaySectorCommand(data)
    } else if (typeof id !== 'number' && (id % 1) === 0) {
      el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">Illegal number.</span><br />')
      displaySectorCommand(data)
    } else {
      for (var i in data.sector.warps) {
        if (data.sector.warps[i].number == id) {
          moveToSectorID(data, id, id, 'adjacent', [])
          return;
        }
      }
      el.append('<br /><br />That Warp Lane is not adjacent.<br />')
      el.append('<br /><span class="ansi-bright-blue-fg ansi-bright-black-bg processing">Computing shortest path...</span>')
      $.post('/sector/', { 'task': 'getpath', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'destination': id }, function(result) {
        $('.processing').removeClass('ansi-bright-black-bg processing').html('Computed.')
        var nextHop = ''
        el.append('<br /><br />The shortest path <span class="ansi-magenta-fg">(' + (result.length - 1) + ' hops, ' + ((result.length - 1) * data.ship.type.turns_per_warp) + ' turns)</span> from sector <span class="ansi-bright-yellow-fg">' + data.sector.number + '</span> to sector <span class="ansi-bright-yellow-fg">' + id + '</span> is<span class="ansi-bright-yellow-fg">:</span><br />')
        for (var i in result) {
          if (i == 0)
            el.append('<span class="ansi-yellow-fg">' + result[i] + '</span>')
          else
            el.append((data.trader.explored.indexOf(result[i]) > -1 ? result[i] : '<span class="ansi-bright-red-fg">(' + result[i] + ')</span>'))
          if (i < result.length - 1)
            el.append(' <span class="ansi-bright-yellow-fg">&gt;</span> ')
        }
        result.shift()
        nextHop = result[0]
        el.append('<br /><br /><span class="ansi-magenta-fg">Engage the Autopilot? <span class="ansi-bright-yellow-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="yes">Y</a>/<a href="" class="ansi-bright-yellow-fg" data-attribute="no">N</a>/<a href="" class="ansi-bright-yellow-fg" data-attribute="step">Single step</a>/<a href="" class="ansi-bright-yellow-fg" data-attribute="express">Express</a>)</span> [Y]</span> ')
        menuEventHandler([
          { 'nextFunction': function() { el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Auto Pilot Engaging&gt;</span><br /><br />'); moveToSectorID(data, id, nextHop, 'autopilot', result) }, 'attribute': 'yes', 'key': 'Y'.charCodeAt(), 'addbreak': true },
          { 'nextFunction': function() { el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Auto Pilot Engaging&gt;</span><br /><br />'); moveToSectorID(data, id, nextHop, 'autopilot', result) }, 'attribute': 'yes', 'key': 13, 'addbreak': true },
          { 'nextFunction': function() { el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Auto Pilot Engaging&gt;</span><br /><br />'); moveToSectorID(data, id, nextHop, 'single', result) }, 'attribute': 'single', 'key': 'S'.charCodeAt(), 'addbreak': true },
          { 'nextFunction': function() { el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Auto Pilot Engaging&gt;</span><br /><br />'); moveToSectorID(data, id, nextHop, 'express', result) }, 'attribute': 'express', 'key': 'E'.charCodeAt(), 'addbreak': true },
          { 'nextFunction': displaySectorCommand, 'nextFunctionArgs': [ data ], 'attribute': 'no', 'key': 'N'.charCodeAt(), 'addbreak': true }
        ])
      }).fail(function(result) {
        el.append('<br />*** <span class="ansi-bright-red-fg ansi-bright-black-bg">Error</span> - ')
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
        // TODO clear avoids boolean and redisplay prompt
        displaySectorCommand(data)
      })
    }
  }

  var sectorScan = function(data, destination, nextHop, method, route) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">Long Range Scan</span><br />')
    switch (data.ship.scanner) {
      case 0:
        el.append('You don\'t have a long range scanner.<br />')
        if (destination)
          autopilotMenuEventHandler(data, destination, nextHop, method, route)
        else
          displaySectorCommand(data)
        break
      case 1:
        densityScan(data, destination, nextHop, method, route)
        break
      case 2:
        if (data.trader.turns == 0) {
          densityScan(data, destination, nextHop, method, route)
          break
        } else {
          el.append('<span class="ansi-magenta-fg">Select (<a href="" class="ansi-bright-yellow-fg" data-id="holo">H</a>)olo Scan or (<a href="" class="ansi-bright-yellow-fg" data-id="density">D</a>)ensity Scan or (<a href="" class="ansi-bright-yellow-fg" data-id="quit">Q</a>)uit? [<span class="ansi-bright-cyan-fg">D</span>] </span>')
          menuEventHandler([
            { 'nextFunction': holoScan, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'holo', 'key': 'H'.charCodeAt() },
            { 'nextFunction': densityScan, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'density', 'key': 'D'.charCodeAt(), 'addbreak': true },
            { 'nextFunction': densityScan, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'key': 13, 'addbreak': true },
            { 'nextFunction': displaySectorCommand, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true }
          ])
          break
        }
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var densityScan = function(data, destination, nextHop, method, route) {
    var scan = $('<br /><div class="row col-xs-9"></div>')
    scan.append('<div class="row"><div class="col-xs-12 ansi-yellow-fg text-center" style="border-bottom: 1px dashed rgb(255,85,85); margin-left: 18px; margin-bottom: 10px; padding-bottom: 10px">Relative Density Scan</div></div>')
    for (var i in data.sector.warps.sort(function(a, b) { return a.number - b.number })) {
      scan.append('<div class="row"><div class="col-xs-1">Sector</div><div class="col-xs-1 ' + (data.sector.warps[i].explored ? 'ansi-bright-cyan-fg' : 'ansi-bright-red-fg unexplored') + ' text-right">' + data.sector.warps[i].number + '</div><div class="col-xs-1">==&gt;</div><div class="col-xs-2 ansi-magenta-fg text-right">' + addCommas(data.sector.warps[i].density) + '</div><div class="col-xs-1 text-right">Warps</div><div class="col-xs-1 ansi-bright-yellow-fg addseparator-cyan">' + data.sector.warps[i].warps + '</div><div class="col-xs-1 text-right">NavHaz</div><div class="col-xs-1 ansi-magenta-fg addseparator-cyan">' + (!data.sector.warps[i].navhaz ? 0 : data.sector.warps[i].navhaz) + '%</div><div class="col-xs-1 text-right">Anom</div><div class="col-xs-1 ansi-bright-yellow-fg addseparator-cyan">' + (!data.sector.warps[i].anomaly ? 'No' : 'Yes') + '</div></div>')
    }
    el.append(scan)
    el.append('<div class="clearfix"></div>')
    if (destination)
      autopilotMenuEventHandler(data, destination, nextHop, method, route)
    else
      displaySectorCommand(data)
  }

  var holoScan = function(data, destination, nextHop, method, route) {
    deductTurn(data)
    for (var i in data.sector.warps.sort(function(a, b) { return a.number - b.number }))
      displaySector(data, data.sector.warps[i])

    $.post('/sector/', { 'task': 'holoScan', 'sector_id': data.sector.id, 'ship_id': data.ship.id })

    displaySector(data, data.sector)

    if (destination)
      autopilotMenuEventHandler(data, destination, nextHop, method, route)
    else
      displaySectorCommand(data)
  }

  var autopilotMenuEventHandler = function(data, destination, nextHop, method, route) {
    el.append(autopilotPrompt)
    menuEventHandler([
      { 'nextFunction': displaySectorCommand, 'nextFunctionArgs': [ data ], 'attribute': 'yes', 'key': 'Y'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': moveToSectorID, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'no', 'key': 'N'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': moveToSectorID, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'key': 13, 'addbreak': true },
      { 'nextFunction': moveToSectorID, 'nextFunctionArgs': [ data, destination, nextHop, 'express', route ], 'attribute': 'express', 'key': 'E'.charCodeAt() },
      { 'nextFunction': function() { informationTable(data); el.append(autopilotPrompt); window.scrollTo(0, document.body.scrollHeight) }, 'attribute': 'shipinfo', 'key': 'I'.charCodeAt(), 'noreset': true },
      { 'nextFunction': sectorScan, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'scan', 'key': 'S'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': function() { displaySector(data); el.append(autopilotPrompt); window.scrollTo(0, document.body.scrollHeight) }, 'attribute': 'display', 'key': 'D'.charCodeAt(), 'noreset': true },
      { 'nextFunction': portDock, 'nextFunctionArgs': [ data, destination, nextHop, method, route ], 'attribute': 'port', 'key': 'P'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': autopilotMenu, 'attribute': 'menu', 'key': 63, 'noreset': true },
      { 'nextFunction': autopilotHelp, 'attribute': 'help', 'key': 33, 'noreset': true }
    ])
  }

  var moveToSectorID = function(data, destination, nextHop, method, route) {
    if (method != 'adjacent')
      el.append('<span class="ansi-yellow-fg">Auto Warping to sector</span> <span class="ansi-bright-yellow-fg">' + nextHop + '</span>')
    el.append('<div id="progress-bar" style="padding-top: 2em"></div>')
    $('#progress-bar').progressTimer({
      timeLimit: data.ship.type.turns_per_warp,
      onFinish: function() {
        $.post('/sector/', { 'task': 'move', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'destination': nextHop }, function(data) {
          $('#progress-bar').remove()
          route.shift()
          nextHop = route[0]
          displaySector(data)
          if (data.sector.number == destination) {
            displaySectorCommand(data)
            return
          } else if ((method == 'autopilot' && (data.sector.port || data.sector.planets.length > 0 || data.sector.traders.length > 0 || data.sector.ships.length > 0 || data.sector.fighters || data.sector.navhaz > 0 || data.sector.mines.length > 0)) || method == 'single') {
            autopilotMenuEventHandler(data, destination, nextHop, method, route)
          } else {
            el.append('<br />')
            moveToSectorID(data, destination, nextHop, method, route)
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          window.scrollTo(0, document.body.scrollHeight)
        })
      }
    })
  }

  var autopilotMenu = function() {
    el.append('<br /><br /><span class="ansi-bright-yellow-fg">-=- <span class="ansi-magenta-fg">AutoPilot Help</span> -=-</span>')
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="yes">Y</a>&gt;</span> <span class="ansi-bright-cyan-fg">Yes, stop here</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="no">N</a>&gt;</span> <span class="ansi-bright-cyan-fg">No, continue on</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="express">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Express Non-Stop</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="shipinfo">I</a>&gt;</span> <span class="ansi-bright-cyan-fg">Ship Information</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="report">R</a>&gt;</span> <span class="ansi-bright-cyan-fg">Port Report</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="scan">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">Long Range Scan</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="display">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Re-Display Sector</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="port">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Port and Trade</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-bright-cyan-fg">AutoPilot Help</span>'))
    el.append(menu)
    el.append(autopilotPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var autopilotHelp = function() {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;AUTOPILOT MENU&gt;</span>')
    el.append('<pre>' + atob('QVVUT1BJTE9UIE1FTlUNCg0KJmx0O1kmZ3Q7ICBZZXMsIHN0b3AgaGVyZS4gIFRoaXMgd2lsbCBkaXNlbmdhZ2UgdGhlIEF1dG9waWxvdCBhbmQNCiAgICAgd2lsbCBzdG9wIHlvdSBpbiB0aGUgY3VycmVudCBzZWN0b3IuDQoNCiZsdDtOJmd0OyAgTm8sIGNvbnRpbnVlIG9uLiAgQ29udGludWVzIG9uIHRoZSBwcmUtZGVmaW5lZCByb3V0ZS4NCg0KJmx0O0UmZ3Q7ICBFeHByZXNzIE5vbi1zdG9wLiAgVGhpcyB3aWxsIHNwZWVkIHlvdSB0aHJvdWdoIHRoZQ0KICAgICBzZWN0b3JzIHdpdGhvdXQgcGF1c2luZyB0byBhc2sgaWYgeW91IHdhbnQgdG8gc3RvcCBpbiB0aGUNCiAgICAgc2VjdG9ycyB3aXRoIHBsYW5ldHMgb3IgcG9ydHMuICBIaXR0aW5nIHRoZSBzcGFjZSBiYXINCiAgICAgd2hpbGUgaW4gRXhwcmVzcyBtb2RlIHdpbGwgcHV0IHlvdSBpbnRvIHdhcnAgc3BlZWQuICBJZg0KICAgICB5b3UgZW5jb3VudGVyIGVuZW15IGZvcmNlcyB5b3Ugd2lsbCBoYXZlIHRvIHJlYWN0LiAgSWYNCiAgICAgeW91IHJldHJlYXQsIHRoZSBjb21wdXRlciB3aWxsIHJlLXBsb3QgeW91ciBjb3Vyc2UNCiAgICAgYXZvaWRpbmcgdGhhdCBzZWN0b3IgZnJvbSB3aGljaCB5b3UgcmV0cmVhdGVkLg0KDQombHQ7SSZndDsgIFNoaXAgSW5mb3JtYXRpb24uICBUaGlzIGRpc3BsYXlzIGFsbCB5b3VyIGN1cnJlbnQNCiAgICAgc3RhdGlzdGljcy4gIFRoZSBkaXNwbGF5IGlzIHRoZSBzYW1lIGFzIG9wdGlvbiAmbHQ7SSZndDsgZnJvbQ0KICAgICB0aGUgTWFpbiBNZW51Lg0KDQombHQ7UiZndDsgIFBvcnQgUmVwb3J0LiAgVGhpcyB3aWxsIGRpc3BsYXkgdGhlIHBvcnQgcmVwb3J0DQogICAgIGluZm9ybWF0aW9uIGFzIGlmIHlvdSBjaG9zZSAmbHQ7UiZndDsgZnJvbSB5b3VyIG9uLWJvYXJkDQogICAgIGNvbXB1dGVyLg0KDQombHQ7UyZndDsgIExvbmcgUmFuZ2UgU2Nhbi4gIElmIHlvdSBoYXZlIHB1cmNoYXNlZCBhIExvbmcgUmFuZ2UNCiAgICAgU2Nhbm5lciBmcm9tIHRoZSBIYXJkd2FyZSBFbXBvcml1bSwgeW91IGNhbiB1c2UgaXQgZHVyaW5nDQogICAgIHlvdXIgQXV0b1BpbG90IHZveWFnZSB3aXRob3V0IGhhdmluZyB0byBzdG9wIGluIHRoZQ0KICAgICBzZWN0b3IuDQoNCiZsdDtEJmd0OyAgUmUtRGlzcGxheSBTZWN0b3IuICBUaGlzIGlzIHRoZSBzYW1lIHNlY3RvciBkaXNwbGF5IHRoYXQNCiAgICAgY2FuIGJlIGFjY2Vzc2VkIGJ5IGNob29zaW5nIG9wdGlvbiAmbHQ7RCZndDsgZnJvbSB0aGUgTWFpbg0KICAgICBNZW51Lg0KDQombHQ7UCZndDsgIFBvcnQgYW5kIFRyYWRlLiAgVGhpcyB3aWxsIGFsbG93IHlvdSB0byBkb2NrIGF0IGEgVHJhZGluZw0KICAgICBQb3J0IGFuZCBjb25kdWN0IHlvdXIgYnVzaW5lc3Mgd2l0aG91dCBoYXZpbmcgdG8NCiAgICAgcmVjYWxjdWxhdGUgeW91ciBBdXRvcGlsb3QgY291cnNlIHdoZW4geW91J3JlIGRvbmUuICBZb3UNCiAgICAgd2lsbCBiZSBzZWxlY3RpbmcgdGhlIHNhbWUgb3B0aW9ucyBhcyB5b3Ugd291bGQgaWYgeW91DQogICAgIGNob3NlIHRoZSAmbHQ7UCZndDsgc2VsZWN0aW9uIGZyb20gdGhlIE1haW4gTWVudS4NCg0KJmx0OyEmZ3Q7ICBBdXRvcGlsb3QgSGVscC4gIERpc3BsYXlzIHRoaXMgZmlsZS4NCg') + '</pre>')
    el.append(autopilotPrompt)
  }

  var resolveTitle = function(exp, align) {
    for (var i in config.titles)
      if (config.titles[i].alignment == (align >= 0 ? 'positive' : 'negative') && exp < config.titles[i].experience)
        return config.titles[i - 2].title
  }

  var resolveRank = function(align) {
    for (var i in config.ranks) {
      if (align >= 0 && config.ranks[i].alignment >= 0 && align <= config.ranks[i].alignment)
        return config.ranks[i].rank
      else if (align < 0 && config.ranks[i].alignment < 0 && align >= config.ranks[i].alignment)
        return config.ranks[i].rank
    }
  }

  var getTitles = function(alignment) {
/*    var titles = []
    for (var i in config.titles) {
      if (config.titles[i].alignment == alignment)
        
    switch(alignment) {
      case 'positive':

        break
      case 'negative':

        break
    }
    } */
    return config.titles.filter(function(entry) { return entry.alignment === alignment })
  }

  var resolveFighterMode = function(mode) {
    switch(mode) {
      case 0:
        return 'Offensive'
      case 1:
        return 'Defensive'
      case 2:
        return 'Toll'
    }
  }

  var resolveMineType = function(type) {
    switch (type) {
      case 1:
        return 'Armid'
      case 2:
        return 'Limpet'
    }
  }

  var resolvePortClass = function(id, plain) {
    var s = (plain ? 'S' : '<span class="ansi-bright-cyan-fg">S</span>')
    var b = (plain ? 'B' : '<span class="ansi-green-fg">B</span>')
    var special = (plain ? 'BBB' : '<span class="ansi-bright-cyan-fg">Special</span>')
    switch (id) {
      case 0:
        return special
      case 1:
        return b + b + s
      case 2:
        return b + s + b
      case 3:
        return s + b + b
      case 4:
        return s + s + b
      case 5:
        return s + b + s
      case 6:
        return b + s + s
      case 7:
        return s + s + s
      case 8:
        return b + b + b
      case 9:
        return special
    }
  }

  var createReplacementShip = function() {
    config.replacement_ship_manufacturer = getRandom(config.manufacturers)
    el.append('<span class="ansi-bright-cyan-fg">You must now christen your new ' + config.replacement_ship_manufacturer.name + ' ' + config.replacement_ship.class + '<br />Choose a name carefully as you will have it for a while!<br /><br />')
    createReplacementShipName()
  }

  var createReplacementShipName = function() {
    el.append('<form id="createReplacementShip"><div class="form-group"><label for="name"><span class="ansi-bright-cyan-fg">What do you want to name your ship? (30 letters)</span></label><input type="text" class="form-control ansi-yellow-fg" id="name"></div></form>')
    $('#createReplacementShip #name').focus()
    $(document).on('submit.replacementShip', '#createReplacementShip', function(e) {
      e.preventDefault()
      $(document).off('.replacementShip')
      $('#createReplacementShip #name').blur()
      config.replacement_ship_name = $('<div />').text($('#createReplacementShip #name').val()).html()
      el.append('<br />' + config.replacement_ship_name + ' <span class="ansi-bright-cyan-fg">is what you want? (<a href="" class="ansi-cyan-fg" data-attribute="yes">Y</a>/<a href="" class="ansi-cyan-fg" data-attribute="no">N</a>)</span> ')
      $('#createReplacementShip').replaceWith(' <span class="ansi-yellow-fg">' + config.replacement_ship_name + '</span><br />')
      booleanKey(createReplacementShipComplete, createReplacementShipName)
    })
  }

  var createReplacementShipComplete = function() {
    $.post('/ship/', { 'task': 'replacementship', 'replacement_ship_manufacturer': config.replacement_ship_manufacturer.id, 'replacement_ship_name': config.replacement_ship_name }, function(result) {
      if (result.status == 'ok') {
        el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">You are being moved to sector 1</span><br />')
        getSectorData(displayCurrentSector)
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
      createReplacementShipName()
    })
  }

  var landOnTerra = function(data) {
    var controller = AnsiLove.render('/ANSI/LANDEART.ANS', function(canvas, sauce) {
      el.html(canvas)
      //controller.play(28800, function() { })
      el.append('<br /><span class="ansi-yellow-fg">There are currently <span class="ansi-bright-yellow-fg">' + data.sector.terra.cols + '</span> colonists ready to leave Terra.<br />')
      el.append('<span class="ansi-magenta-fg">Do you wish to (<a href="" class="ansi-bright-yellow-fg" data-attribute="leave">L</a>)eave or (<a href="" class="ansi-bright-yellow-fg" data-attribute="take">T</a>)ake Colonists? <span class="ansi-bright-yellow-fg">[T] (<a href="" class="ansi-bright-yellow-fg" data-attribute="quit">Q</a> to leave) ')
    }, { 'bits': 9, '2x': (retina ? 1 : 0) })
    menuEventHandler([
      { 'nextFunction': changePopulationTerra, 'nextFunctionArgs': [ data, 'take' ], 'attribute': 'take', 'key': 'T'.charCodeAt() },
      { 'nextFunction': changePopulationTerra, 'nextFunctionArgs': [ data, 'take' ], 'attribute': 'take', 'key': 13 },
      { 'nextFunction': changePopulationTerra, 'nextFunctionArgs': [ data, 'leave' ], 'attribute': 'leave', 'key': 'L'.charCodeAt() },
      { 'nextFunction': leaveTerra, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt() }
    ])
  }

  var leaveTerra = function(data) {
    el.append('<br />You return to your ship and leave the planet.<br /><br />')
    displaySectorCommand(data)
  }

  var changePopulationTerra = function(data, task) {
    el.append('<form id="changePopulationTerra"><div class="form-group"><label for="quantity"><span class="ansi-magenta-fg">How many groups of Colonists do you want to ' + task + ' (<span class="ansi-bright-cyan-fg">[<span class="ansi-bright-yellow-fg">' + (task == 'take' ? getShipEmptyHolds(data) : data.ship.colonists) + '</span>]</span> ' + (task == 'take' ? 'empty holds' : 'on board') + ' ?</span></label><input type="text" class="form-control ansi-magenta-fg" id="quantity"></div></form>')
    $('#changePopulationTerra #quantity').focus()

    var max = (task == 'take' ? (data.sector.terra.cols > getShipEmptyHolds(data) ? getShipEmptyHolds(data) : data.sector.terra.cols) : data.ship.colonists)
    $('#changePopulationTerra').validate({
      rules: {
        quantity: {
          required: true,
          digits: true,
          min: 0,
          max: max
        }
      },
      submitHandler: function(form) {
        var quantity = parseInt($('#changePopulationTerra #quantity').val())
        $.post('/planet/', { 'task': 'changepopulationterra', 'ship_id': data.ship.id, 'which': task, 'quantity': quantity }, function(result) {
          if (result.status == 'ok') {
            switch (task) {
              case 'take':
                data.sector.terra.cols -= quantity
                data.ship.colonists += quantity
                el.append('The Colonists file abaord your ship, eager to head out to new frontiers.<br />')
                break
              case 'leave':
                data.sector.terra.cols += quantity
                data.ship.colonists -= quantity
                el.append('The Colonists disembark, saddened to not be heading out to space.<br />')
                break
            }
            el.append('You return to your ship and leave the planet.<br />')
            deductTurn(data)
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
          el.append('You return to your ship and leave the planet.<br />')
        }).always(function() {
          $('#changePopulationTerra').replaceWith('<br /><span class="ansi-magenta-fg">How many groups of Colonists do you want to ' + task + ' (<span class="ansi-bright-cyan-fg">[<span class="ansi-bright-yellow-fg">' + (task == 'take' ? getShipEmptyHolds(data) : data.ship.colonists) + '</span>]</span> ' + (task == 'take' ? 'empty holds' : 'on board') + ' ? ' + quantity + '</span><br />')
          displaySectorCommand(data)
        })
        return false
      }
    })
  }

  var deductTurn = function(data) {
    data.trader.turns--;
    el.append('<br /><span class="ansi-bright-yellow-fg">One turn deducted, <span class="ansi-bright-cyan-fg">' + data.trader.turns + '</span> turns left.<br />')
  }

  var landOnPlanet = function(data) {
    el.append('<br /><span class="ansi-bright-cyan-fg">&lt;Preparing ship to land on planet surface&gt;<br /><br />&lt;Atmospheric maneuvering system engaged&gt;<br />')
    if (data.sector.planets.length === 0) {
      el.append('There isn\'t a planet in this sector.<br />You can create one with a Genesis Torpedo.')
      displaySectorCommand(data)
    } else if (data.sector.planets.length === 1) {
      landOnPlanetID(data, data.sector.planets[0].id)
    } else {
      var landPrompt = $('<span class="ansi-magenta-fg"></span>').html('Land on which planet <span class="ansi-bright-yellow-fg">&lt;Q to abort&gt;</span> ? ')
      el.append('Registry# and Planet Name<br /><span class="ansi-bright-yellow-fg">------------------------------------------------------</span><br />')
      var menuEvents = [
        { 'nextFunction': displaySectorCommand, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 'Q'.charCodeAt() },
        { 'nextFunction': displaySectorCommand, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 13 },
      ]
      menuEvents.push({ 'nextFunction': function() { el.append('<br />That planet is not in this sector.<br /><br />'); el.append(landPrompt.addClass('show-entry')); }, 'nextFunctionArgs': [], 'failure': true, 'noreset': true })
      for (var i in data.sector.planets) {
        el.append(' &nbsp; <span class="ansi-magenta-fg">&lt;<span class="ansi-green-fg">' + pad(data.sector.planets[i].number, 4).replace(' ', '&nbsp;') + '</span>&gt;</span> <span class="ansi-bright-cyan-fg">' + data.sector.planets[i].name + '</span><br />')
        menuEvents.push({ 'nextFunction': landOnPlanetID, 'nextFunctionArgs': [ data ], 'attribute': 'planet_id', 'id': data.sector.planets[i].id, 'number': data.sector.planets[i].number })
      }
      el.append('<br /><span class="ansi-magenta-fg show-entry">Land on which planet <span class="ansi-bright-yellow-fg">&lt;Q to abort&gt;</span> ? ')
      menuEventHandler(menuEvents)
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var landOnPlanetID = function (data, id) {
    $.post('/planet/', { 'task': 'land', 'planet_id': id, 'ship_id': data.ship.id }, function(data) {
      el.append('<br /><span class="ansi-bright-red-fg ansi-bright-black-bg">Landing sequence engaged...</span><br />')
      displayPlanet(data)      
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    })
  }

  var pad = function(str, len) {
    return str.toString().length < len ? pad(' ' + str, len) : str
  }

  var displayPlanetTable = function(data) {
    el.append('<br /><br />Planet <span class="ansi-bright-yellow-fg">#</span><span class="ansi-bright-cyan-fg">' + data.planet.number + '</span> in sector <span class="ansi-bright-yellow-fg">' + data.sector.number + '</span>: <span class="ansi-cyan-fg">' + data.planet.name + '</span><br />')
    el.append('<span class="ansi-magenta-fg">Class <span class="ansi-bright-white-fg ansi-blue-bg">' + data.planet.type.class + '</span>, ' + data.planet.type.desc + '</span><br />')
    el.append('<span class="ansi-magenta-fg">Created by:</span> <span class="ansi-bright-cyan-fg">' + (data.planet.created_by ? data.planet.created_by : '&lt;UNKNOWN&gt;') + '</span><br />')
    el.append('<span class="ansi-magenta-fg">Claimed by:</span> <span class="ansi-bright-yellow-fg">' + (data.planet.trader ? data.planet.trader.name : '<span class="ansi-bright-red-fg">Abandoned</span>' ) + '</span><br /><br />')

    var table = $('<table></table>').addClass('table table-condensed planet')
    table.append($('<thead></thead>').addClass('ansi-green-fg').html('<tr><td>Item</td><td>Colonists<br />(1000s)</td><td>Colonists<br />2 Build 1</td><td>Daily<br />Product</td><td>Planet<br />Amount</td><td>Ship<br />Amount</td><td>Planet<br />Maximum</td></tr>'));
    table.append($('<tr></tr>').html('<td class="ansi-green-fg" style="text-align: left">Fuel Ore</td><td class="ansi-bright-yellow-fg">' + addCommas(data.planet.fuel_cols) + '</td><td class="ansi-red-fg">' + addCommas(data.planet.type.col_to_fuel_ratio) + '</td><td class="ansi-bright-blue-fg">' + addCommas(Math.floor(data.planet.fuel_cols / data.planet.type.col_to_fuel_ratio)) + '</td><td class="ansi-bright-cyan-fg">' + addCommas(data.planet.fuel) + '</td><td class="ansi-magenta-fg">' + data.ship.fuel + '</td><td class="ansi-yellow-fg">' + addCommas(data.planet.type.max_units_fuel) + '</td>'))
    table.append($('<tr></tr>').html('<td class="ansi-green-fg" style="text-align: left">Organics</td><td class="ansi-bright-yellow-fg">' + addCommas(data.planet.organics_cols) + '</td><td class="ansi-red-fg">' + addCommas(data.planet.type.col_to_organics_ratio) + '</td><td class="ansi-bright-blue-fg">' + addCommas(Math.floor(data.planet.organics_cols / data.planet.type.col_to_organics_ratio)) + '</td><td class="ansi-bright-cyan-fg">' + addCommas(data.planet.organics) + '</td><td class="ansi-magenta-fg">' + data.ship.organics + '</td><td class="ansi-yellow-fg">' + addCommas(data.planet.type.max_units_organics) + '</td>'))
    table.append($('<tr></tr>').html('<td class="ansi-green-fg" style="text-align: left">Equipment</td><td class="ansi-bright-yellow-fg">' + addCommas(data.planet.equipment_cols) + '</td><td class="ansi-red-fg">' + addCommas(data.planet.type.col_to_equipment_ratio) + '</td><td class="ansi-bright-blue-fg">' + addCommas(Math.floor(data.planet.equipment_cols / data.planet.type.col_to_equipment_ratio)) + '</td><td class="ansi-bright-cyan-fg">' + addCommas(data.planet.equipment) + '</td><td class="ansi-magenta-fg">' + data.ship.equipment + '</td><td class="ansi-yellow-fg">' + addCommas(data.planet.type.max_units_equipment) + '</td>'))
    var figsDaily = Math.floor(((data.planet.fuel_cols / data.planet.type.col_to_fuel_ratio) + (data.planet.organics_cols / data.planet.type.col_to_organics_ratio) + (data.planet.equipment_cols / data.planet.type.col_to_equipment_ratio)) / data.planet.type.col_to_fighter_ratio)
    var figs2build1 = Math.floor((data.planet.fuel_cols + data.planet.organics_cols + data.planet.equipment_cols) / figsDaily)

    table.append($('<tr></tr>').html('<td class="ansi-green-fg" style="text-align: left">Fighters</td><td class="ansi-bright-yellow-fg">N/A</td><td class="ansi-red-fg">' + (figs2build1 === 0 ? 'N/A' : addCommas(figs2build1)) + '</td><td class="ansi-bright-blue-fg">' + addCommas(figsDaily) + '</td><td class="ansi-bright-cyan-fg">' + addCommas(data.planet.fighters) + '</td><td class="ansi-magenta-fg">' + data.ship.fighters + '</td><td class="ansi-yellow-fg">' + addCommas(data.planet.type.max_fighters) + '</td>'))
    el.append(table)

    if (data.planet.citadel == 0 && data.planet.upgrade_completion > 0)
      el.append('Citadel under construction, <span class="ansi-bright-yellow-fg">' + data.planet.upgrade_completion + '</span> day(s) till complete.')
    else if (data.planet.citadel >= 1) {
      el.append('<span class="ansi-yellow-fg">Planet has a level <span class="ansi-bright-yellow-fg">' + data.planet.citadel + '</span> Citadel, treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.</span><br />')
      switch (data.planet.citadel) {
        case 1:
          el.append('<span class="ansi-magenta-fg">No defenses armed or deployed.</span><br />')
          break
        case 2:
          el.append('<span class="ansi-yellow-fg">Military reaction=<span class="ansi-bright-yellow-fg">' + data.planet.military_reaction + '</span>%</span><br />')
          break
        case 3:
          el.append('<span class="ansi-yellow-fg">Military reaction=<span class="ansi-bright-yellow-fg">' + data.planet.military_reaction + '</span>%, <span class="ansi-bright-cyan-fg">QCannon</span> power=<span class="ansi-bright-yellow-fg">' + Math.floor((data.planet.fuel / data.planet.type.max_units_fuel) * 100) + '</span>%, AtmosLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_atmos + '</span>%, SectLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_sector + '</span>%</span><br />')
          break
        case 4:
          el.append('<span class="ansi-yellow-fg">Military reaction=<span class="ansi-bright-yellow-fg">' + data.planet.military_reaction + '</span>%, <span class="ansi-bright-cyan-fg">QCannon</span> power=<span class="ansi-bright-yellow-fg">' + Math.floor((data.planet.fuel / data.planet.type.max_units_fuel) * 100) + '</span>%, AtmosLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_atmos + '</span>%, SectLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_sector + '</span>%</span><br />')
          el.append(' &nbsp; &nbsp; &nbsp; <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span> <span class="ansi-bright-cyan-fg">TransWarp</span> <span class="ansi-magenta-fg">power</span> <span class="ansi-bright-yellow-fg">=</span> <span class="ansi-bright-cyan-fg">' + data.planet.fuel % 400 + '</span> hops <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span><br />')
          break
        case 5:
          el.append('<span class="ansi-yellow-fg">Military reaction=<span class="ansi-bright-yellow-fg">' + data.planet.military_reaction + '</span>%, <span class="ansi-bright-cyan-fg">QCannon</span> power=<span class="ansi-bright-yellow-fg">' + Math.floor((data.planet.fuel / data.planet.type.max_units_fuel) * 100) + '</span>%, AtmosLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_atmos + '</span>%, SectLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_sector + '</span>%</span><br />')
          el.append(' &nbsp; &nbsp; &nbsp; <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span> <span class="ansi-bright-cyan-fg">TransWarp</span> <span class="ansi-magenta-fg">power</span> <span class="ansi-bright-yellow-fg">=</span> <span class="ansi-bright-cyan-fg">' + data.planet.fuel % 400 + '</span> hops <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span><br />')
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; <span class="ansi-red-fg">Planetary Defense Shielding Power Level</span> <span class="ansi-bright-yellow-fg">=</span> <span class="ansi-bright-cyan-fg">' + data.planet.shields + '</span><br />')
          break
        case 6:
          el.append('<span class="ansi-yellow-fg">Military reaction=<span class="ansi-bright-yellow-fg">' + data.planet.military_reaction + '</span>%, <span class="ansi-bright-cyan-fg">QCannon</span> power=<span class="ansi-bright-yellow-fg">' + Math.floor((data.planet.fuel / data.planet.type.max_units_fuel) * 100) + '</span>%, AtmosLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_atmos + '</span>%, SectLvl=<span class="ansi-bright-yellow-fg">' + data.planet.quasar_sector + '</span>%</span><br />')
          el.append(' &nbsp; &nbsp; &nbsp; <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span> <span class="ansi-bright-cyan-fg">TransWarp</span> <span class="ansi-magenta-fg">power</span> <span class="ansi-bright-yellow-fg">=</span> <span class="ansi-bright-cyan-fg">' + data.planet.fuel % 400 + '</span> hops <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span><br />')
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; <span class="ansi-red-fg">Planetary Defense Shielding Power Level</span> <span class="ansi-bright-yellow-fg">=</span> <span class="ansi-bright-cyan-fg">' + data.planet.shields + '</span><br />')
          el.append(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <span class="ansi-red-fg">Planetary Inderdictor Generator = </span><span class="ansi-bright-cyan-fg">' + (data.planet.interdictor ? 'ACTIVE' : 'INACTIVE') + '</span><br />')
          break
      }
      if (data.planet.transporter)
        el.append(' &nbsp; &nbsp; &nbsp; <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span> <span class="ansi-bright-cyan-fg">TransPort</span> <span class="ansi-magenta-fg">power</span> <span class="ansi-bright-yellow-fg">=</span> <span class="ansi-bright-cyan-fg">' + data.planet.transporter + '</span> hops <span class="ansi-bright-cyan-fg">-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-red-fg ansi-bright-black-bg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-<span class="ansi-bright-yellow-fg">=</span>-</span><br />')
      if (data.planet.upgrade_completion > 0)
        el.append('<br />' + citadelNames[data.planet.citadel] + ' under construction, <span class="ansi-bright-yellow-fg">' + data.planet.upgrade_completion + '</span> day(s) till complete.')
    }
  }

  var displayPlanet = function(data) {
    displayPlanetTable(data)
    el.append('<br />You have <span class="ansi-bright-yellow-fg">' + getShipEmptyHolds(data) + '</span> free cargo holds.<br />');
    displayPlanetCommand(data)
  }

  var redisplayPlanet = function(data) {
    displayPlanetTable(data)
    displayPlanetCommand(data)
  }

  var getShipEmptyHolds = function(data) {
    return (data.ship.holds - data.ship.fuel - data.ship.organics - data.ship.equipment - data.ship.colonists)
  }

  var displayPlanetCommand = function(data) {
    el.append(planetPrompt)
    menuEventHandler([
      { 'nextFunction': planetTakeAll, 'nextFunctionArgs': [ data ], 'attribute': 'take', 'key': 'A'.charCodeAt(), 'noreset': true },
      { 'nextFunction': planetEnterCitadel, 'nextFunctionArgs': [ data ], 'attribute': 'citadel', 'key': 'C'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': redisplayPlanet, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 'D'.charCodeAt() },
      { 'nextFunction': redisplayPlanet, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 13 },
      { 'nextFunction': planetChangeMilitary, 'nextFunctionArgs': [ data ], 'attribute': 'military', 'key': 'M'.charCodeAt() },
      { 'nextFunction': planetChangeOwnership, 'nextFunctionArgs': [ data ], 'attribute': 'claim', 'key': 'O'.charCodeAt() },
      { 'nextFunction': planetChangePopulation, 'nextFunctionArgs': [ data ], 'attribute': 'population', 'key': 'P'.charCodeAt() },
      { 'nextFunction': planetChangeColonists, 'nextFunctionArgs': [ data ], 'attribute': 'colonists', 'key': 'S'.charCodeAt() },
      { 'nextFunction': planetChangeProduct, 'nextFunctionArgs': [ data ], 'attribute': 'product', 'key': 'T'.charCodeAt() },
      { 'nextFunction': planetDestroy, 'nextFunctionArgs': [ data ], 'attribute': 'destroy', 'key': 'Z'.charCodeAt() },
      { 'nextFunction': planetLeave, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt() },
      { 'nextFunction': planetHelp, 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': planetMenu, 'attribute': 'menu', 'key': 63, 'noreset': true }
    ])
  }

  var planetMenu = function() {
    el.append('<br /><br />')
    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="take">A</a>&gt;</span> <span class="ansi-bright-cyan-fg">Take All Products</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="citadel">C</a>&gt;</span> <span class="ansi-bright-cyan-fg">Enter Citadel</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="display">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Display Planet</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="military">M</a>&gt;</span> <span class="ansi-bright-cyan-fg">Change Military Levels</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="claim">O</a>&gt;</span> <span class="ansi-bright-cyan-fg">Claim Ownership of this planet</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="population">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Change Population Lvls</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="colonists">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">Load/Unload Colonists</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="product">T</a>&gt;</span> <span class="ansi-bright-cyan-fg">Take or Leave Product</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="destroy">Z</a>&gt;</span> <span class="ansi-bright-cyan-fg">Try to Destroy Planet</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-bright-yellow-fg">Planetary Help</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-bright-yellow-fg">Leave this Planet</span>'))
    el.append(menu)
    el.append(planetPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var planetTakeAll = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Take all&gt;</span><br />')
    var holdsFree = parseInt(data.ship.holds) - (parseInt(data.ship.fuel) + parseInt(data.ship.organics) + parseInt(data.ship.equipment) + parseInt(data.ship.colonists))
    var take = {}
    if (holdsFree > 0) {
      if (parseInt(data.planet.equipment) > 0) {
        if (parseInt(data.planet.equipment) >= holdsFree) {
          take['equipment'] = holdsFree
          holdsFree = 0
        } else {
          take['equipment'] = parseInt(data.planet.equipment)
          holdsFree -= take['equipment']
        }
      }
      if (parseInt(data.planet.organics) > 0 && holdsFree > 0) {
        if (parseInt(data.planet.organics) >= holdsFree) {
          take['organics'] = holdsFree
          holdsFree = 0
        } else {
          take['organics'] = parseInt(data.planet.organics)
          holdsFree -= take['organics']
        }
      }
      if (parseInt(data.planet.fuel) > 0 && holdsFree > 0) {
        if (parseInt(data.planet.fuel) >= holdsFree) {
          take['fuel'] = holdsFree
          holdsFree = 0
        } else {
          take['fuel'] = parseInt(data.planet.fuel)
          holdsFree -= take['fuel']
        }
      }
    }

    $.post('/planet/', { 'task': 'takeallproduct', 'planet_id': data.planet.id, 'ship_id': data.ship.id, 'take': take }, function(result) {
      if (result.status == 'ok') {
        if (take['equipment'] > 0) {
          data.ship.equipment = add([data.ship.equipment, take['equipment']])
          data.planet.equipment = sub([data.planet.equipment, take['equipment']])
          el.append('You took <span class="ansi-bright-yellow-fg">' + take['equipment'] + '</span> holds of equipment.<br />')
        }
        if (take['organics'] > 0) {
          data.ship.organics = add([data.ship.organics, take['organics']])
          data.planet.organics = sub([data.planet.organics, take['organics']])
          el.append('You took <span class="ansi-bright-yellow-fg">' + take['organics'] + '</span> holds of organics.<br />')
        }
        if (take['fuel'] > 0) {
          data.ship.fuel = add([data.ship.fuel, take['fuel']])
          data.planet.fuel = sub([data.planet.fuel, take['fuel']])
          el.append('You took <span class="ansi-bright-yellow-fg">' + take['fuel'] + '</span> holds of fuel ore.<br />')
        }
        if (holdsFree === 0)
          el.append('<span class="ansi-magenta-fg">Your holds are full.</span><br />')
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      el.append(planetPrompt)
      window.scrollTo(0, document.body.scrollHeight)
    })
  }

  var planetEnterCitadel = function(data) {
    if (data.planet.citadel == 0) {
      if (data.sector.cluster == 'The Federation') {
        el.append('Citadels are not allowed in FedSpace.<br />')
        displayPlanetCommand(data)
      } else if (data.planet.upgrade_completion > 0) {
        el.append('Be patient, your Citadel is not yet finished.')
        displayPlanetCommand(data)
      } else {
        el.append('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;Build Citadel&gt;</span><br /><br />')
        el.append('<span class="ansi-bright-cyan-fg">This planet does not have a Citadel on it. If you wish to construct one,<br />you must first have the raw materials on the planet to build the Citadel.<br /><br />Once a Citadel is built, you will then have the options of leaving your ship<br />there overnight, storing credits in the treasury, and many other military<br />functions that can turn your planet into a stronghold that is formidable<br />indeed! Addition of a Combat computer will enable your Citadel\'s systems to<br />control all fighters on the planet for defense. Purchase of a Quasar cannon<br />can give your Citadel the power to attack craft in space in the sector the<br />planet is in.</span><br /><br />')
        el.append('Citadel construction on this type of planet requires the following:<br />')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_1_cols * 1000) + '</div><div class="col-xs-9">Colonists to support the construction,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_1_fuel) + '</div><div class="col-xs-9">units of Fuel Ore</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_1_organics) + '</div><div class="col-xs-9">units of Organics,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_1_equipment) + '</div><div class="col-xs-9">units of Equipment and</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_1_days) + '</div><div class="col-xs-9">days to construct.</div></div>')
        el.append('<br /><br /><span class="ansi-magenta-fg">Do you wish to construct one? ')
        booleanKey(function() { planetConstructCitadel(data) }, function() { displayPlanetCommand(data) }, false)
      }
    } else {
      var controller = AnsiLove.render('/ANSI/CITADEL' + data.planet.citadel + '.ANS', function(canvas, sauce) {
        el.html(canvas)
        el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Enter Citadel&gt;</span>')
        citadelDisplay(data)
        citadelEvents(data)
      }, { 'bits': 8, '2x': (retina ? 1 : 0) } )
    }
  }

  var citadelUpgrade = function(data) {

    if (data.planet.upgrade_completion > 0) {
      el.append('<br />You may not upgrade while the ' + citadelNames[data.planet.citadel] + ' is being built.<br /><br />')
      el.append('Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
      el.append(citadelPrompt)
      citadelEvents(data)
      return
    } else if (data.planet.citadel == 6) {
      el.append('<br />This Citadel cannot be upgraded further.<br /><br />')
      el.append('Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
      el.append(citadelPrompt)
      citadelEvents(data)
      return
    }

    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Upgrade Citadel&gt;</span><br /><br />')
    el.append('<span class="ansi-bright-cyan-fg">This Citadel does not have a ' + citadelNames[data.planet.citadel] + '. To construct one,<br />you must first have the raw materials on the planet to build it.</span><br /><br />')

    switch (data.planet.citadel) {
      case 1:
        el.append('<span class="ansi-bright-cyan-fg">Once a Combat Control System is built, you will then have the ability to<br />set the fighters on the planet surface in either defensive or offensive<br />deployment. Traders wishing to attack you or take the products of the<br />planet will have to fight through your fighters first.</span><br /><br />')
        el.append('Construction of a ' + citadelNames[data.planet.citadel] + ' on this type of planet requires<br />the following:<br />')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_2_cols * 1000) + '</div><div class="col-xs-9">Colonists to support the construction,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_2_fuel) + '</div><div class="col-xs-9">units of Fuel Ore</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_2_organics) + '</div><div class="col-xs-9">units of Organics,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_2_equipment) + '</div><div class="col-xs-9">units of Equipment and</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_2_days) + '</div><div class="col-xs-9">days to construct.</div></div>')
        break
      case 2:
        el.append('<span class="ansi-bright-cyan-fg">A properly deployed Quasar Cannon is the most powerful weapon known today.<br />With an adequate fuel supply, a Q-Cannon can outlast even the most powerful<br />fleet and survive with its base planet intact. A Quasar Cannon can only<br />reach ships in the sector its base planet is in, but it reaches them with<br />an effective firepower that only some large BattleShips can match.</span><br /><br />')
        el.append('Construction of a ' + citadelNames[data.planet.citadel] + ' on this type of planet requires<br />the following:<br />')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_3_cols * 1000) + '</div><div class="col-xs-9">Colonists to support the construction,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_3_fuel) + '</div><div class="col-xs-9">units of Fuel Ore</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_3_organics) + '</div><div class="col-xs-9">units of Organics,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_3_equipment) + '</div><div class="col-xs-9">units of Equipment and</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_3_days) + '</div><div class="col-xs-9">days to construct.</div></div>')
        break
      case 3:
        el.append('<span class="ansi-bright-cyan-fg">With a fully operational Planetary TransWarp drive in place, you can move<br />your planets to any sector you defend! Your white dwarf star that provides<br />light and heat for your planet is moved as well in the massive TransWarp<br />field that this awesome engine creates. The amount of fuel required to<br />generate this field is tremendous though, and you will only be able to move<br />your planet once every 9-10 days.</span><br /><br />')
        el.append('Construction of a ' + citadelNames[data.planet.citadel] + ' on this type of planet requires<br />the following:<br />')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_4_cols * 1000) + '</div><div class="col-xs-9">Colonists to support the construction,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_4_fuel) + '</div><div class="col-xs-9">units of Fuel Ore</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_4_organics) + '</div><div class="col-xs-9">units of Organics,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_4_equipment) + '</div><div class="col-xs-9">units of Equipment and</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_4_days) + '</div><div class="col-xs-9">days to construct.</div></div>')
        break
      case 4:
        el.append('<span class="ansi-bright-cyan-fg">With a fully operational Planetary Shielding System in place, you can reset<br />assured that no one will easily take over your planet! Planetary Shields<br />will prevent not only enemy ships from landing, but they will also negate<br />the effects of the Photon Missile. Shielding Control is maintained through<br />a series of geosynchronous satellitees that you transfer shield generators<br />to. You can build this level up to a considerable defensive power.</span><br /><br />')
        el.append('Construction of a ' + citadelNames[data.planet.citadel] + ' on this type of planet requires<br />the following:<br />')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_5_cols * 1000) + '</div><div class="col-xs-9">Colonists to support the construction,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_5_fuel) + '</div><div class="col-xs-9">units of Fuel Ore</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_5_organics) + '</div><div class="col-xs-9">units of Organics,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_5_equipment) + '</div><div class="col-xs-9">units of Equipment and</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_5_days) + '</div><div class="col-xs-9">days to construct.</div></div>')
        break
      case 5:
        el.append('<span class="ansi-bright-cyan-fg">An operational Interdictor Generator is a much feared defense against<br />intruders. The gravity well produced by such a generator prevents an<br />opponent from generating a warp field and subsequently traps them in your<br />sector. (where you can deal with them at your leisure). Be aware that<br />the generation of such a field drains a tremendous amount of Fuel from<br />your planet\'s resources.</span><br /><br />')
        el.append('Construction of a ' + citadelNames[data.planet.citadel] + ' on this type of planet requires<br />the following:<br />')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_6_cols * 1000) + '</div><div class="col-xs-9">Colonists to support the construction,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_6_fuel) + '</div><div class="col-xs-9">units of Fuel Ore</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_6_organics) + '</div><div class="col-xs-9">units of Organics,</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_6_equipment) + '</div><div class="col-xs-9">units of Equipment and</div></div>')
        el.append('<div class="row"><div class="col-xs-3 ansi-bright-yellow-fg text-right">' + addCommas(data.planet.type.citadel_level_6_days) + '</div><div class="col-xs-9">days to construct.</div></div>')
        break
      }

      el.append('<br /><span class="ansi-magenta-fg">Do you wish to construct a ' + citadelNames[data.planet.citadel] + '? ')
      booleanKey(function() { planetConstructCitadel(data) }, function() { el.append('Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.'); el.append(citadelPrompt); citadelEvents(data) }, false)
  }

  var citadelDisplay = function(data) {
    // TODO check for other traders in citadel
    el.append('<br /><br /><br />There are no other Traders in the Citadel.<br /><br />')
    el.append('<br />Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
    el.append(citadelPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var citadelEvents = function(data) {
    menuEventHandler([
      { 'nextFunction': function() { el.append('<br /><span class="ansi-magenta-fg">You leave the citadel and return to your ship.</span>'); displayPlanetCommand(data) }, 'attribute': 'quit', 'key': 'Q'.charCodeAt(), 'addbreak': true },
      { 'nextFunction': citadelMenu, 'nextFunctionArgs': [ data ], 'attribute': 'menu', 'key': 13, 'noreset': true, 'addbreak': true },
      { 'nextFunction': citadelMenu, 'nextFunctionArgs': [ data ], 'attribute': 'menu', 'key': 63, 'noreset': true, 'addbreak': true },
      { 'nextFunction': citadelHelp, 'nextFunctionArgs': [ data ], 'attribute': 'help', 'key': 33, 'noreset': true },
      { 'nextFunction': citadelDisplay, 'nextFunctionArgs': [ data ], 'attribute': 'display', 'key': 'D'.charCodeAt(), 'noreset': true },
      { 'nextFunction': citadelUpgrade, 'nextFunctionArgs': [ data ], 'attribute': 'upgrade', 'key': 'U'.charCodeAt(), 'addbreak': true },
    ])
  }

  var citadelMenu = function(data) {
    el.append('<br /><br />')

    var leftMenu = $('<ul></ul>').addClass('list-unstyled')
    var rightMenu = $('<ul></ul>').addClass('list-unstyled')

    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="transporter">B</a>&gt;</span> <span class="ansi-bright-cyan-fg">Transporter Control</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="computer">C</a>&gt;</span> <span class="ansi-bright-cyan-fg">Engage Ship\'s Computer</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="display">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Display Traders Here</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="exchange">E</a>&gt;</span> <span class="ansi-bright-cyan-fg">Exchange Trader Ships</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="shields">G</a>&gt;</span> <span class="ansi-bright-cyan-fg">Shield Generator Control</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="info">I</a>&gt;</span> <span class="ansi-bright-cyan-fg">Personal Info</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quasar">L</a>&gt;</span> <span class="ansi-bright-cyan-fg">Quasar Cannon R-Level</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="military">M</a>&gt;</span> <span class="ansi-bright-cyan-fg">Military Reaction Level</span>'))
    leftMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-bright-yellow-fg" data-attribute="help">!</a>&gt;</span> <span class="ansi-bright-yellow-fg">Citadel Help</span>'))

    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="interdictor">N</a>&gt;</span> <span class="ansi-bright-cyan-fg">Interdictor Control</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="transwarp">P</a>&gt;</span> <span class="ansi-bright-cyan-fg">Planetary TransWarp</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="remain">R</a>&gt;</span> <span class="ansi-bright-cyan-fg">Remain here overnight</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="scan">S</a>&gt;</span> <span class="ansi-bright-cyan-fg">Scan this sector</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="treasury">T</a>&gt;</span> <span class="ansi-bright-cyan-fg">Treasury Fund Transfers</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="upgrade">U</a>&gt;</span> <span class="ansi-bright-cyan-fg">Upgrade Citadel</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="evict">V</a>&gt;</span> <span class="ansi-bright-cyan-fg">Evict the other Traders</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="corporation">X</a>&gt;</span> <span class="ansi-bright-cyan-fg">Corporation Menu</span>'))
    rightMenu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-bright-cyan-fg">Leave the Citadel</span>'))

    var menuContainer = $('<div></div>').addClass('row')
    menuContainer.append($('<div></div>').addClass('col-md-3').html(leftMenu))
    menuContainer.append($('<div></div>').addClass('col-md-3').html(rightMenu))
    el.append(menuContainer)

    el.append('Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
    el.append(citadelPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var planetConstructCitadel = function(data) {

    var upgradable = true
    var citadel_cols = 0
    var citadel_fuel = 0
    var citadel_organics = 0
    var citadel_equipment = 0
    var citadel_days

    switch (data.planet.citadel) {
      case 0:
        citadel_cols = data.planet.type.citadel_level_1_cols
        citadel_fuel = data.planet.type.citadel_level_1_fuel
        citadel_organics = data.planet.type.citadel_level_1_organics
        citadel_equipment = data.planet.type.citadel_level_1_equipment
        citadel_days = data.planet.type.citadel_level_1_days
        break
      case 1:
        citadel_cols = data.planet.type.citadel_level_2_cols
        citadel_fuel = data.planet.type.citadel_level_2_fuel
        citadel_organics = data.planet.type.citadel_level_2_organics
        citadel_equipment = data.planet.type.citadel_level_2_equipment
        citadel_days = data.planet.type.citadel_level_2_days
        break
      case 2:
        citadel_cols = data.planet.type.citadel_level_3_cols
        citadel_fuel = data.planet.type.citadel_level_3_fuel
        citadel_organics = data.planet.type.citadel_level_3_organics
        citadel_equipment = data.planet.type.citadel_level_3_equipment
        citadel_days = data.planet.type.citadel_level_3_days
        break
      case 3:
        citadel_cols = data.planet.type.citadel_level_4_cols
        citadel_fuel = data.planet.type.citadel_level_4_fuel
        citadel_organics = data.planet.type.citadel_level_4_organics
        citadel_equipment = data.planet.type.citadel_level_4_equipment
        citadel_days = data.planet.type.citadel_level_4_days
        break
      case 4:
        citadel_cols = data.planet.type.citadel_level_5_cols
        citadel_fuel = data.planet.type.citadel_level_5_fuel
        citadel_organics = data.planet.type.citadel_level_5_organics
        citadel_equipment = data.planet.type.citadel_level_5_equipment
        citadel_days = data.planet.type.citadel_level_5_days
        break
      case 5:
        citadel_cols = data.planet.type.citadel_level_6_cols
        citadel_fuel = data.planet.type.citadel_level_6_fuel
        citadel_organics = data.planet.type.citadel_level_6_organics
        citadel_equipment = data.planet.type.citadel_level_6_equipment
        citadel_days = data.planet.type.citadel_level_6_days
        break
      case 6:
        break
    }

    if (data.planet.fuel_cols + data.planet.organics_cols + data.planet.equipment_cols < citadel_cols) {
      el.append('You need <span class="ansi-bright-yellow-fg">' + addCommas(citadel_cols * 1000) + '</span> Colonists' + (data.planet.citadel == 0 ? ' to build a citadel' : '') + '.<br />')
        upgradable = false
    }
    if (data.planet.fuel < citadel_fuel) {
      el.append('You need <span class="ansi-bright-yellow-fg">' + addCommas(citadel_fuel) + '</span> units of <span class="ansi-bright-cyan-fg">Fuel Ore</span>' + (data.planet.citadel == 0 ? ' to build a citadel' : '') + '.<br />')
      upgradable = false
    }
    if (data.planet.organics < citadel_organics) {
      el.append('You need <span class="ansi-bright-yellow-fg">' + addCommas(citadel_organics) + '</span> units of <span class="ansi-bright-cyan-fg">Organics</span>' + (data.planet.citadel == 0 ? ' to build a citadel' : '') + '.<br />')
      upgradable = false
    }
    if (data.planet.equipment < citadel_equipment) {
      el.append('You need <span class="ansi-bright-yellow-fg">' + addCommas(citadel_equipment) + '</span> units of <span class="ansi-bright-cyan-fg">Equipment</span>' + (data.planet.citadel == 0 ? ' to build a citadel' : '') + '.<br />')
      upgradable = false
    }
    if (upgradable == false) {
      el.append('Try again later when you have enough of everything on this planet.')
      if (data.planet.citadel == 0) {
        displayPlanetCommand(data)
      } else {
        el.append('<br /><br />Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
        el.append(citadelPrompt)
        citadelEvents(data)
      }
    } else {
      $.post('/planet/', { 'task': 'citadel', 'sector_id': data.sector.id, 'ship_id': data.ship.id, 'planet_id': data.planet.id }, function(result) {
        if (result.status == 'ok') {
          data.planet.fuel -= citadel_fuel
          data.planet.organics -= citadel_organics
          data.planet.equipment -= citadel_equipment
          data.planet.upgrade_completion = citadel_days
          el.append('Thanks to the miracles of modern technology, your<br />' + citadelNames[data.planet.citadel] + ' will be completed in <span class="ansi-bright-yellow-fg">' + citadel_days + '</span> days!')
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
      }).always(function() {
        if (data.planet.citadel == 0) {
          displayPlanetCommand(data)
        } else {
          el.append('<br /><br />Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
          el.append(citadelPrompt)
          citadelEvents(data)
        }
      })
    }
  }

  var planetChangeProduct = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Take/Leave Products&gt;</span><br /><br />')
    el.append('<span class="ansi-magenta-fg">Display planet?</span>')
    booleanKey(function() { displayPlanetTable(data); planetChangeProductTakeLeave(data) }, function() { planetChangeProductTakeLeave(data) }, false)
  }

  var planetChangeProductTakeLeave = function(data) {
    el.append('<br /><span class="ansi-magenta-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="leave">L</a>)eave or (<a href="" class="ansi-bright-yellow-fg" data-attribute="take">T</a>)ake Product? <span class="ansi-bright-yellow-fg">[T]</span>')
    menuEventHandler([
      { 'nextFunction': planetChangeProductGroup, 'nextFunctionArgs': [ 'leave', data ], 'attribute': 'leave', 'key': 'L'.charCodeAt() },
      { 'nextFunction': planetChangeProductGroup, 'nextFunctionArgs': [ 'take', data ], 'attribute': 'take', 'key': 'T'.charCodeAt() },
      { 'nextFunction': planetChangeProductGroup, 'nextFunctionArgs': [ 'take', data ], 'attribute': 'take', 'key': 13 },
    ])
  }

  var planetChangeProductGroup = function(task, data) {
    el.append('<br />Which product are you taking?<br />')
    el.append('<span class="ansi-magenta-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="fuel">1</a>)Ore, (<a href="" class="ansi-bright-yellow-fg" data-attribute="organics">2</a>)Org or (<a href="" class="ansi-bright-yellow-fg" data-attribute="equipment">3</a>)Equipment ?</span>')
    menuEventHandler([
      { 'nextFunction': planetChangeProductQuantity, 'nextFunctionArgs': [ task, 'fuel', data ], 'attribute': 'fuel', 'key': '1'.charCodeAt() },
      { 'nextFunction': planetChangeProductQuantity, 'nextFunctionArgs': [ task, 'organics', data ], 'attribute': 'organics', 'key': '2'.charCodeAt() },
      { 'nextFunction': planetChangeProductQuantity, 'nextFunctionArgs': [ task, 'equipment', data ], 'attribute': 'equipment', 'key': '3'.charCodeAt() }
    ])
  }

  var prettyProduct = function(group) {
    switch (group) {
      case 'fuel':
        return 'Fuel Ore'
        break
      case 'organics':
        return 'Organics'
        break
      case 'equipment':
        return 'Equipment'
        break
      default:
        return group
    }
  }

  var planetChangeProductQuantity = function(task, group, data) {
    var max = 0
    switch (group) {
      case 'fuel':
        max = (task == 'take' ? getShipEmptyHolds(data) : data.ship.fuel)
        break;
      case 'organics':
        max = (task == 'take' ? getShipEmptyHolds(data) : data.ship.organics)
        break;
      case 'equipment':
        max = (task == 'take' ? getShipEmptyHolds(data) : data.ship.equipment)
        break;
    }
    el.append('<form id="planetChangeProduct"><div class="form-group"><label for="quantity"><span class="ansi-magenta-fg">How many holds of ' + prettyProduct(group) + ' do you want to ' + task + ' (<span class="ansi-bright-cyan-fg">[<span class="ansi-bright-yellow-fg">' + max + '</span>]</span> ' + (task == 'take' ? 'empty holds' : 'on board') + ') ? </span></label><input type="text" class="form-control ansi-magenta-fg" name="quantity" id="quantity" placeholder="' + max + '"></div></form>')
    $('#planetChangeProduct #quantity').focus()
    $('#planetChangeProduct').validate({
      rules: {
        quantity: {
          required: true,
          digits: true,
          min: 0,
          max: max
        }
      },
      submitHandler: function(form) {
        var quantity = $('#planetChangeProduct #quantity').val()
        $.post('/planet/', { 'task': 'changeproduct', 'planet_id': data.planet.id, 'ship_id': data.ship.id, 'which': task, 'group': group, 'quantity': quantity }, function(result) {
          if (result.status == 'ok') {
            switch (group) {
              case 'fuel':
                data.planet.fuel = (task == 'take' ? sub([data.planet.fuel, quantity]) : add([data.planet.fuel, quantity]))
                data.ship.fuel = (task == 'take' ? add([data.ship.fuel, quantity]) : sub([data.ship.fuel, quantity]))
                break
              case 'organics':
                data.planet.organics = (task == 'take' ? sub([data.planet.organics, quantity]) : add([data.planet.organics, quantity]))
                data.ship.organics = (task == 'take' ? add([data.ship.organics, quantity]) : sub([data.ship.organics, quantity]))
                break
              case 'equipment':
                data.planet.equipment = (task == 'take' ? sub([data.planet.equipment, quantity]) : add([data.planet.equipment, quantity]))
                data.ship.equipment = (task == 'take' ? add([data.ship.equipment, quantity]) : sub([data.ship.equipment, quantity]))
                break
            }
            el.append((task == 'take' ? 'You load the ' + prettyProduct(group) + ' aboard your ship.<br />' : 'You unload the ' + prettyProduct(group) + ' from your ship.<br />'))
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          $('#planetChangeProduct').replaceWith(' <span class="ansi-magenta-fg">' + quantity + '</span><br />')
          displayPlanetCommand(data)
        })
        return false
      }
    })
  }

  var planetChangeColonists = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Load/Unload Colonists&gt;</span><br /><br />')
    el.append('<span class="ansi-magenta-fg">Display planet?</span>')
    booleanKey(function() { displayPlanetTable(data); planetChangeColonistsTakeLeave(data) }, function() { planetChangeColonistsTakeLeave(data) }, false)
  }

  var planetChangeColonistsTakeLeave = function(data) {
    el.append('<br /><span class="ansi-magenta-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="leave">L</a>)eave or (<a href="" class="ansi-bright-yellow-fg" data-attribute="take">T</a>)ake Colonists? <span class="ansi-bright-yellow-fg">[L]</span>')
    menuEventHandler([
      { 'nextFunction': planetChangeColonistsGroup, 'nextFunctionArgs': [ 'leave', data ], 'attribute': 'leave', 'key': 'L'.charCodeAt() },
      { 'nextFunction': planetChangeColonistsGroup, 'nextFunctionArgs': [ 'leave', data ], 'attribute': 'take', 'key': 13 },
      { 'nextFunction': planetChangeColonistsGroup, 'nextFunctionArgs': [ 'take', data ], 'attribute': 'take', 'key': 'T'.charCodeAt() }
    ])
  }

  var planetChangeColonistsGroup = function(task, data) {
    el.append('<br />Which production group are you changing?<br />')
    el.append('<span class="ansi-magenta-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="fuel">1</a>)Ore, (<a href="" class="ansi-bright-yellow-fg" data-attribute="organics">2</a>)Org or (<a href="" class="ansi-bright-yellow-fg" data-attribute="equipment">3</a>)Equipment Production?</span>')
    menuEventHandler([
      { 'nextFunction': planetChangeColonistsQuantity, 'nextFunctionArgs': [ task, 'fuel', data ], 'attribute': 'fuel', 'key': '1'.charCodeAt() },
      { 'nextFunction': planetChangeColonistsQuantity, 'nextFunctionArgs': [ task, 'organics', data ], 'attribute': 'organics', 'key': '2'.charCodeAt() },
      { 'nextFunction': planetChangeColonistsQuantity, 'nextFunctionArgs': [ task, 'equipment', data ], 'attribute': 'equipment', 'key': '3'.charCodeAt() }
    ])
  }

  var planetChangeColonistsQuantity = function(task, group, data) {
    var max = (task == 'take' ? getShipEmptyHolds(data) : data.ship.colonists)
    el.append('<form id="planetChangeColonists"><div class="form-group"><label for="quantity"><span class="ansi-magenta-fg">How many groups of Colonists do you want to ' + task + ' (<span class="ansi-bright-cyan-fg">[<span class="ansi-bright-yellow-fg">' + max + '</span>]</span> ' + (task == 'take' ? 'empty holds' : 'on board') + ') ? </span></label><input type="text" class="form-control ansi-magenta-fg" name="quantity" id="quantity" placeholder="' + max + '"></div></form>')
    $('#planetChangeColonists #quantity').focus()
    $('#planetChangeColonists').validate({
      rules: {
        quantity: {
          required: true,
          digits: true,
          min: 0,
          max: max
        }
      },
      submitHandler: function(form) {
        var quantity = $('#planetChangeColonists #quantity').val()
        $.post('/planet/', { 'task': 'changecolonists', 'planet_id': data.planet.id, 'ship_id': data.ship.id, 'which': task, 'group': group, 'quantity': quantity }, function(result) {
          if (result.status == 'ok') {
            data.ship.colonists = (task == 'take' ? add([data.ship.colonists, quantity]) : sub([data.ship.colonists, quantity]))
            switch (group) {
              case 'fuel':
                data.planet.fuel_cols = (task == 'take' ? sub([data.planet.fuel_cols, quantity]) : add([data.planet.fuel_cols, quantity]))
                break
              case 'organics':
                data.planet.organics_cols = (task == 'take' ? sub([data.planet.organics_cols, quantity]) : add([data.planet.organics_cols, quantity]))
                break
              case 'equipment':
                data.planet.equipment_cols = (task == 'take' ? sub([data.planet.equipment_cols, quantity]) : add([data.planet.equipment_cols, quantity]))
                break
            }
            el.append((task == 'take' ? 'The Colonists file aboard your ship, eager to head out.<br />' : 'The Colonists disembark to begin their new life.<br />'))
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          $('#planetChangeColonists').replaceWith('<span class="ansi-magenta-fg">How many groups of Colonists do you want to ' + task + ' (<span class="ansi-bright-cyan-fg">[<span class="ansi-bright-yellow-fg">' + max + '</span>]</span> ' + (task == 'take' ? 'empty holds' : 'on board') + ') ? ' + quantity + '</span><br />')
          displayPlanetCommand(data)
        })
        return false
      }
    })
  }

  var planetChangeMilitary = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Change Military&gt;</span><br /><br />')
    el.append('<span class="ansi-magenta-fg">Display planet?</span>')
    booleanKey(function() { displayPlanetTable(data); planetChangeMilitaryTakeLeaveFighters(data) }, function() { planetChangeMilitaryTakeLeaveFighters(data) }, false)
  }

  var planetChangeMilitaryTakeLeaveFighters = function (data) {
    el.append('<br /><span class="ansi-yellow-fg">There are currently <span class="ansi-bright-yellow-fg">' + data.planet.fighters + '</span> Fighters on this planet.<br />')
    el.append('<span class="ansi-magenta-fg">Do you wish to (<a href="" class="ansi-bright-yellow-fg" data-attribute="leave">L</a>)eave or (<a href="" class="ansi-bright-yellow-fg" data-attribute="take">T</a>)ake Fighters? <span class="ansi-bright-yellow-fg">[T] (Q to Exit)</span>')
    menuEventHandler([
      { 'nextFunction': planetChangeMilitaryLeaveFighters, 'nextFunctionArgs': [ data ], 'attribute': 'leave', 'key': 'L'.charCodeAt() },
      { 'nextFunction': planetChangeMilitaryTakeFighters, 'nextFunctionArgs': [ data ], 'attribute': 'take', 'key': 'T'.charCodeAt() },
      { 'nextFunction': planetChangeMilitaryTakeFighters, 'nextFunctionArgs': [ data ], 'attribute': 'take', 'key': 13 },
      { 'nextFunction': displayPlanetCommand, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt() }
    ])
  }

  var planetChangeMilitaryLeaveFighters = function(data) {
    el.append('<form id="planetChangeMilitaryLeaveFighters"><div class="form-group"><label for="quantity"><span class="ansi-magenta-fg">How many Fighters do you want to leave <span class="ansi-bright-yellow-fg">(' + data.ship.fighters + ' on board)</span> ?</span></label><input type="text" class="form-control ansi-magenta-fg" name="quantity" id="quantity" placeholder="' + data.ship.fighters + '"></div></form>')
    $('#planetChangeMilitaryLeaveFighters #quantity').focus()
    $('#planetChangeMilitaryLeaveFighters').validate({
      rules: {
        quantity: {
          required: true,
          digits: true,
          min: 0,
          max: (data.planet.type.max_fighters >= data.ship.fighters ? data.ship.fighters : data.planet.type.max_fighters)
        }
      },
      submitHandler: function(form) {
        var quantity = $('#planetChangeMilitaryLeaveFighters #quantity').val()
        $.post('/planet/', { 'task': 'leavefighters', 'planet_id': data.planet.id, 'ship_id': data.ship.id, 'quantity': quantity }, function(result) {
          if (result.status == 'ok') {
            data.ship.fighters = sub([data.ship.fighters, quantity])
            data.planet.fighters = add([data.planet.fighters, quantity])
            el.append('Done!<br />')
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          $('#planetChangeMilitaryLeaveFighters').replaceWith(' <span class="ansi-magenta-fg">' + quantity + '</span><br />')
          displayPlanetCommand(data)
        })
        return false
      }
    })
  }

  var planetChangeMilitaryTakeFighters = function(data) {
    el.append('<form id="planetChangeMilitaryTakeFighters"><div class="form-group"><label for="quantity"><span class="ansi-magenta-fg">How many Fighters do you want to take <span class="ansi-bright-yellow-fg">(' + data.planet.fighters + ' Max)</span> ?</span></label><input type="text" class="form-control ansi-magenta-fg" name="quantity" id="quantity" placeholder="' + data.planet.fighters + '"></div></form>')
    $('#planetChangeMilitaryTakeFighters #quantity').focus()
    $('#planetChangeMilitaryTakeFighters').validate({
      rules: {
        quantity: {
          required: true,
          digits: true,
          min: 0,
          max: (data.ship.type.max_fighters >= data.planet.fighters ? data.planet.fighters : data.ship.type.max_fighters)
        }
      },
      submitHandler: function(form) {
        var quantity = $('#planetChangeMilitaryTakeFighters #quantity').val()
        $.post('/planet/', { 'task': 'takefighters', 'planet_id': data.planet.id, 'ship_id': data.ship.id, 'quantity': quantity }, function(result) {
          if (result.status == 'ok') {
            data.ship.fighters = add([data.ship.fighters, quantity])
            data.planet.fighters = sub([data.planet.fighters, quantity])
            el.append('The Fighters join your battle force.<br />')
          }
        }).fail(function(result) {
          if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
            el.append(result.responseJSON.error + '<br />')
        }).always(function() {
          $('#planetChangeMilitaryTakeFighters').replaceWith(' <span class="ansi-magenta-fg">' + quantity + '</span><br />')
          displayPlanetCommand(data)
        })
        return false
      }
    })
  }

  var add = function(n) {
    return parseInt(n[0]) + parseInt(n[1])
  }

  var sub = function(n) {
    return parseInt(n[0]) - parseInt(n[1])
  }

  var planetChangeOwnership = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Claim Ownership of this Planet&gt;</span><br />')
    $.post('/planet/', { 'task': 'claimownership', 'planet_id': data.planet.id, 'ship_id': data.ship.id }, function(result) {
      if (result.status == 'ok') {
        el.append('<br />Done!<br />')
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      getSectorData(displayPlanetCommand)
    })
  }

  var planetChangePopulation = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Change Colonist Population&gt;</span><br /><br />')
    el.append('<span class="ansi-magenta-fg">Display planet?</span> ')
    booleanKey(function() { displayPlanetTable(data); planetChangePopulationFrom(data) }, function() { planetChangePopulationFrom(data) }, false)
  }

  var planetChangePopulationFrom = function(data) {
    el.append('<br />Which production group are you moving Colonists from?<br />')
    el.append('<span class="ansi-magenta-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="fuel">1</a>)Ore, (<a href="" class="ansi-bright-yellow-fg" data-attribute="organics">2</a>)Org or (<a href="" class="ansi-bright-yellow-fg" data-attribute="equipment">3</a>)Equipment?</span>')
    menuEventHandler([
      { 'nextFunction': planetChangePopulationFromType, 'nextFunctionArgs': [ 'fuel', data ], 'attribute': 'fuel', 'key': '1'.charCodeAt() },
      { 'nextFunction': planetChangePopulationFromType, 'nextFunctionArgs': [ 'organics', data ], 'attribute': 'organics', 'key': '2'.charCodeAt() },
      { 'nextFunction': planetChangePopulationFromType, 'nextFunctionArgs': [ 'equipment', data ], 'attribute': 'equipment', 'key': '3'.charCodeAt() }
    ])
  }

  var planetChangePopulationFromType = function(from, data) {
    el.append('<form id="planetChangePopulationFrom"><div class="form-group"><label for="quantity"><span class="ansi-magenta-fg">How many groups of Colonists do you want to move?</span></label><input type="text" class="form-control ansi-magenta-fg" name="quantity" id="quantity"></div></form>')
    $('#planetChangePopulationFrom #quantity').focus()
    var maxColonists = 0
    switch (from) {
      case 'fuel':
        maxColonists = data.planet.fuel_cols
        break
      case 'organics':
        maxColonists = data.planet.organics_cols
        break
      case 'equipment':
        maxColonists = data.planet.equipment_cols
        break
      default:
        maxColonists = 0
    }
    $('#planetChangePopulationFrom').validate({
      rules: {
        quantity: {
          required: true,
          digits: true,
          min: 0,
          max: maxColonists
        }
      },
      submitHandler: function(form) {
        var quantity = $('#planetChangePopulationFrom #quantity').val()
        el.append('<br />And which group are you moving them to?<br />')
        el.append('<span class="ansi-magenta-fg">(<a href="" class="ansi-bright-yellow-fg" data-attribute="fuel">1</a>)Ore, (<a href="" class="ansi-bright-yellow-fg" data-attribute="organics">2</a>)Org or (<a href="" class="ansi-bright-yellow-fg" data-attribute="equipment">3</a>)Equipment?</span>')
        menuEventHandler([
          { 'nextFunction': planetChangePopulationToType, 'nextFunctionArgs': [ from, 'fuel', quantity, data ], 'attribute': 'fuel', 'key': '1'.charCodeAt() },
          { 'nextFunction': planetChangePopulationToType, 'nextFunctionArgs': [ from, 'organics', quantity, data ], 'attribute': 'organics', 'key': '2'.charCodeAt() },
          { 'nextFunction': planetChangePopulationToType, 'nextFunctionArgs': [ from, 'equipment', quantity, data ], 'attribute': 'equipment', 'key': '3'.charCodeAt() }
        ])
        $('#planetChangePopulationFrom').replaceWith(' <span class="ansi-magenta-fg">' + quantity + '</span><br />')
        return false
      }
    })
  }

  var planetChangePopulationToType = function(from, to, quantity, data) {
    $.post('/planet/', { 'task': 'changepopulation', 'planet_id': data.planet.id, 'ship_id': data.ship.id, 'from': from, 'to': to, 'quantity': quantity }, function(result) {
      if (result.status == 'ok') {
        switch (from) {
          case 'fuel':
            data.planet.fuel_cols = sub([data.planet.fuel_cols, quantity])
            break
          case 'organics':
            data.planet.organics_cols = sub([data.planet.organics_cols, quantity])
            break
          case 'equipment':
            data.planet.equipment_cols = sub([data.planet.equipment_cols, quantity])
            break
        }
        switch (to) {
          case 'fuel':
            data.planet.fuel_cols = add([data.planet.fuel_cols, quantity])
            break
          case 'organics':
            data.planet.organics_cols = add([data.planet.organics_cols, quantity])
            break
          case 'equipment':
            data.planet.equipment_cols = add([data.planet.equipment_cols, quantity])
            break
        }
        el.append('<br />The Colonists drop what they were doing and start their new jobs.<br />')
      }
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    }).always(function() {
      displayPlanetCommand(data)
    })
  }

  var planetDestroy = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Destroy Planet&gt;</span><br /><br />')
    planetDestroyMenu(data)
  }

  var planetDestroyMenu = function(data) {

    menuEventHandler([
      { 'nextFunction': planetDestroyDetonate, 'nextFunctionArgs': [ data ], 'attribute': 'detonate', 'key': 'D'.charCodeAt() },
      { 'nextFunction': planetDestroyAttack, 'nextFunctionArgs': [ data ], 'attribute': 'attack', 'key': 'A'.charCodeAt() },
      { 'nextFunction': planetDestroyHelp, 'nextFunctionArgs': [ data ], 'attribute': 'help', 'key': 'Z'.charCodeAt() },
      { 'nextFunction': displayPlanetCommand, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 'Q'.charCodeAt() },
      { 'nextFunction': displayPlanetCommand, 'nextFunctionArgs': [ data ], 'attribute': 'quit', 'key': 13 }
    ])    

    var menu = $('<ul></ul>').addClass('list-unstyled')
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="detonate">D</a>&gt;</span> <span class="ansi-bright-cyan-fg">Use Atomic Detonators</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="attack">A</a>&gt;</span> <span class="ansi-bright-cyan-fg">Attack Colonists</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="help">Z</a>&gt;</span> <span class="ansi-bright-cyan-fg">Help! (What do I do?)</span>'))
    menu.append($('<li></li>').html('<span class="ansi-magenta-fg">&lt;<a href="" class="ansi-green-fg" data-attribute="quit">Q</a>&gt;</span> <span class="ansi-bright-red-fg ansi-bright-black-bg">Never Mind</span>'))
    el.append(menu)
    el.append(planetDestroyPrompt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  var planetDestroyHelp = function(data) {
    el.append('<br /><br />You may either set the Atomic Detonators and hope that the Colonists do not<br />"accidently" set them off trying to disarm them (while you\'re on the planet)<br />or you can first attack and exterminate the Colonist population to assure a<br />safer use of the detonators.<br /><br />')
    planetDestroyMenu(data)
  }

  var planetDestroyDetonate = function(data) {
    el.append('<br /><span class="ansi-bright-white-fg ansi-blue-bg">&lt;Set Atomic Detonators&gt;</span><br /><br />')
    el.append('<span class="ansi-bright-red-fg ansi-bright-black-bg">&lt;DANGER&gt;</span> Are you sure you want to do this?')
    booleanKey(function() { planetDestroyDetonateConfirm(data) }, function() { planetDestroyMenu(data) }, false)
  }

  var planetDestroyDetonateConfirm = function(data) {
    if (data.ship.detonators === 0) {
      el.append('<br />You do not have any Atomic Detonators!<br /><br />')
      planetDestroyMenu(data)
    } else {
      var figsDaily = Math.floor(((data.planet.fuel_cols / data.planet.type.col_to_fuel_ratio) + (data.planet.organics_cols / data.planet.type.col_to_organics_ratio) + (data.planet.equipment_cols / data.planet.type.col_to_equipment_ratio)) / data.planet.type.col_to_fighter_ratio)

      $.post('/planet/', { 'task': 'destroy', 'planet_id': data.planet.id, 'ship_id': data.ship.id }, function(result) {
        if (result.status == 'ok') {
          if (figsDaily > 300) {
            var controller = AnsiLove.animate('/ANSI/PLTBLAL.ANS', function(canvas, sauce) {
              el.html(canvas)
              controller.play(14400, function() { })
              data.trader.deaths_since_extern += 1
              ownShipDestroyed(result.experience, result.alignment, data)
            }, { 'bits': 9, '2x': (retina ? 1 : 0) })
          } else {
            var controller = AnsiLove.animate('/ANSI/PLTBLUP.ANS', function(canvas, sauce) {
              el.html(canvas)
              controller.play(14400, function() { })
              el.append('<br />For blowing up this planet you receive <span class="ansi-bright-yellow-fg">' + result.experience + '</span> experience point(s).<br />')
              el.append('and your alignment went ' + (parseInt(result.alignment) > 0 ? 'up' : 'down') + ' by <span class="ansi-bright-yellow-fg">' + result.alignment + '</span> point(s).<br /><br />')
              getSectorData(displayCurrentSector)
            }, { 'bits': 9, '2x': (retina ? 1 : 0) })
          }
        }
      }).fail(function(result) {
        if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
          el.append(result.responseJSON.error + '<br />')
      })
    }
  }

  var ownShipDestroyed = function(experience, alignment, data) {
    el.append('<br /><span class="ansi-bright-cyan-fg">Your ' + data.ship.type.class + ' has been destroyed!<br /><br />')
    if (data.ship.type.has_escapepod && data.trader.deaths_since_extern < 3) {
      el.append('Your trusty Escape Pod is functioning normally.<br />For getting blown up you LOSE <span class="ansi-bright-yellow-fg">' + experience + '</span> experience point(s).<br />Sector <span class="ansi-bright-yellow-fg">' + data.sector.number + '</span> will now be avoided in future navigation calculations.<br />')
      getSectorData(displayCurrentSector)
    } else {
      universe.user_login_delay = 1
      el.append('You will have to start over from scratch!<br />Maybe you\'ll have better luck with a different ship!<br /><br />')
      showMainMenu()
    }
    window.scrollTo(0, document.body.scrollHeight)
  }

  var planetDestroyAttack = function(data) {
  }

  var planetLeave = function(data) {
    window.scrollTo(0, document.body.scrollHeight)
    $.post('/planet/', { 'task': 'leave', 'planet_id': data.planet.id, 'ship_id': data.ship.id }, function(result) {
      el.append('<br />Blasting off from <span class="ansi-bright-cyan-fg">' + data.planet.name + '</span><br />')
      if (result.status == 'ok')
        getSectorData(displaySectorCommand)
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
    })
  }

  var planetHelp = function() {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;PLANET MENU&gt;</span>')
    el.append('<pre>' + atob('Jmx0O0EmZ3Q7ICBUYWtlIEFsbCBQcm9kdWN0cy4gIFRoaXMgd2lsbCBsb2FkIHlvdXIgZW1wdHkgaG9sZHMgd2l0aA0KICAgICB0aGUgcHJvZHVjdHMgYXZhaWxhYmxlIG9uIHRoZSBwbGFuZXQuICBUaGUgZG9jayB3b3JrZXJzDQogICAgIHdpbGwgbG9hZCB5b3VyIHNoaXAgdG8gdGhlIGJyaW0gd2l0aCBhcyBtdWNoIG9mIGVhY2ggb2YNCiAgICAgdGhlIHByb2R1Y3RzIHRoYXQgaXMgYXZhaWxhYmxlIGJlZ2lubmluZyB3aXRoIHRoZSBjYXJnbw0KICAgICBvZiBncmVhdGVzdCB2YWx1ZSAoRXF1aXBtZW50KSB0byB0aGUgbGVhc3QgdmFsdWUgKEZ1ZWwNCiAgICAgT3JlKS4NCg0KJmx0O0MmZ3Q7ICBFbnRlciBDaXRhZGVsLiAgWW91IGVudGVyIHRoZSBDaXRhZGVsIChhbmQgZGlzcGxheSB0aGUNCiAgICAgQ2l0YWRlbCBNZW51KS4gIElmIHRoZXJlIGlzIG5vIGNpdGFkZWwgb24gdGhpcyBwbGFuZXQsDQogICAgIHlvdSB3aWxsIGhhdmUgdGhlIG9wdGlvbiB0byBidWlsZCBvbmUuICBUaGUgbmVjZXNzYXJ5DQogICAgIHByb2R1Y3RzIGFuZCBsYWJvciBmb3JjZSBuZWVkZWQgaW4gdGhlIGNvbnN0cnVjdGlvbiB3aWxsDQogICAgIGRpc3BsYXkuICBZb3Ugd2lsbCBub3QgYmUgaXNzdWVkIGEgYnVpbGRpbmcgcGVybWl0IGlmIHlvdQ0KICAgICBkb24ndCBoYXZlIHRoZSBuZWNlc3NhcnkgcGVvcGxlIGFuZCBjb21tb2RpdGllcy4NCg0KJmx0O0QmZ3Q7ICBEaXNwbGF5IFBsYW5ldC4gIFRoaXMgd2lsbCBzaG93IHRoZSBwbGFuZXQgbnVtYmVyLCB0eXBlLA0KICAgICBuYW1lIGFuZCB0aGUgYWxpYXMgb2YgdGhlIHBsYXllciB3aG8gY3JlYXRlZCBpdC4gIFRoZXJlDQogICAgIGlzIGFsc28gYW4gaW5mb3JtYXRpdmUgY2hhcnQgc2hvd2luZyBob3cgbWFueSBjb2xvbmlzdHMNCiAgICAgYXJlIHdvcmtpbmcgaW4gZWFjaCBwcm9kdWN0aW9uIGFyZWEsIGhvdyBtYW55IHVuaXRzIG9mDQogICAgIGVhY2ggcHJvZHVjdCBhcmUgYmVpbmcgcHJvZHVjZWQgZGFpbHksIHRoZSBxdWFudGl0eSBvZg0KICAgICBlYWNoIHByb2R1Y3QgY3VycmVudGx5IGF2YWlsYWJsZSBvbiB0aGUgcGxhbmV0LCBhbmQgaG93DQogICAgIG1hbnkgb2YgZWFjaCB5b3UgaGF2ZSBvbiB5b3VyIHNoaXAuICBDaXRhZGVsIGluZm9ybWF0aW9uDQogICAgIGluY2x1ZGluZyBsZXZlbCwgY29uc3RydWN0aW9uIHVuZGVyd2F5IGFuZCBjcmVkaXRzIGluIHRoZQ0KICAgICB2YXVsdCBpcyBhbHNvIGF2YWlsYWJsZS4NCg0KJmx0O00mZ3Q7ICBDaGFuZ2UgTWlsaXRhcnkgTGV2ZWxzLiAgWW91IHdpbGwgd2FudCB0byBtb3ZlIHlvdXINCiAgICAgZmlnaHRlcnMgYXJvdW5kIHRvIHByb3RlY3QgeW91ciB0ZXJyaXRvcnkuICBUaGlzIG9wdGlvbg0KICAgICB3aWxsIGFsbG93IHlvdSB0byB0YWtlIGZpZ2h0ZXJzIGN1cnJlbnRseSBvbiB0aGUgcGxhbmV0DQogICAgIG9yIHRvIGxlYXZlIGZpZ2h0ZXJzIHlvdSBoYXZlIGVzY29ydGluZyB5b3UuICBUaGUNCiAgICAgZmlnaHRlcnMgb24gdGhlIHBsYW5ldCBhcmUgY29udHJvbGxlZCBieSB0aGUgQ29tYmF0DQogICAgIENvbnRyb2wgQ29tcHV0ZXIgKGxldmVsIDIpIGluIHRoZSBDaXRhZGVsLiAgSWYgdGhlcmUgaXMNCiAgICAgbm8gQ29tYmF0IENvbnRyb2wgQ29tcHV0ZXIgdGhlcmUsIHRoZSBmaWdodGVycyB3b3VsZA0KICAgICBiZXR0ZXIgc2VydmUgeW91IHBhdHJvbGxpbmcgdGhlIHNlY3RvciBvdXRzaWRlIHRoZQ0KICAgICBwbGFuZXQuICBMZWF2aW5nIGZpZ2h0ZXJzIG9uIGEgcGxhbmV0IHdpbGwgZGVzaWduYXRlIHRoZQ0KICAgICBwbGFuZXQgYXMgeW91cnMuDQoNCiZsdDtPJmd0OyAgQ2xhaW0gT3duZXJzaGlwLiAgTGV0IHRoZSBlbnRpcmUgdW5pdmVyc2Uga25vdyB3aG8NCiAgICAgY29udHJvbHMgdGhlIHBsYW5ldC4gIFVzZSB0aGlzIG9wdGlvbiB0byBzZXQgdGhlIHBsYW5ldA0KICAgICBhcyBlaXRoZXIgUGVyc29uYWwgb3IgQ29ycG9yYXRlLiAgVGhpcyBpcyBhIG11c3Qgd2hlbg0KICAgICB5b3UndmUgZ29uZSB0byBhbGwgdGhlIHRyb3VibGUgdG8gY2FwdHVyZSBvbmUgb2YgeW91cg0KICAgICBvcHBvbmVudCdzIHBsYW5ldHMuDQoNCiZsdDtQJmd0OyAgQ2hhbmdlIFBvcHVsYXRpb24gTGV2ZWxzLiAgVGhyb3VnaG91dCB0aGUgY291cnNlIG9mIHRoZQ0KICAgICBnYW1lIHlvdSBtYXkgd2lzaCB0byBjaGFuZ2UgdGhlIGRpc3RyaWJ1dGlvbiBvZiB5b3VyDQogICAgIHdvcmtmb3JjZSBhbW9uZyB0aGUgY29tbW9kaXRpZXMuICBUaGlzIHNlbGVjdGlvbiBwcm92aWRlcw0KICAgICB5b3Ugd2l0aCBhbiBlYXN5LCBlZmZpY2llbnQgd2F5IHRvIG9yZGVyIHlvdXIgd29ya2VycyB0bw0KICAgICB0aGUgam9iIHlvdSBuZWVkIGRvbmUuDQoNCiZsdDtTJmd0OyAgTG9hZC9VbmxvYWQgQ29sb25pc3RzLiAgQ29sb25pemluZyB5b3VyIHBsYW5ldHMgY2FuDQogICAgIGNvbnRyaWJ1dGUgZ3JlYXRseSB0byB5b3VyIHRyYWRpbmcgcHJvZml0cy4gIFRoaXMgd2lsbA0KICAgICBlbmFibGUgeW91IHRvIGxlYXZlIHRoZSBjb2xvbmlzdHMgeW91J3ZlIGJyb3VnaHQgZnJvbQ0KICAgICBUZXJyYSBvciBwYWNrIGV2ZXJ5b25lIHVwIGFuZCBtb3ZlIHRoZW0gdG8gYW5vdGhlcg0KICAgICBwbGFuZXQuICBLZWVwIGEgY2xvc2Ugd2F0Y2ggb24geW91ciBwbGFuZXQncyBwb3B1bGF0aW9uDQogICAgIGJlY2F1c2UgbWFueSBwbGFuZXRzIGV4cGVyaWVuY2UgYSBncm93dGgvZGVhdGggY3ljbGUuICBJZg0KICAgICB5b3VyIHBsYW5ldCBoYXMgdG9vIG1hbnkgcGVvcGxlIHRvIHN1cHBvcnQsIHRoZSByYXcNCiAgICAgbWF0ZXJpYWxzIG5lZWRlZCB0byBwcm9kdWNlIHlvdXIgY29tbW9kaXRpZXMgd2lsbCBiZSB1c2VkDQogICAgIHVwIGJ5IHRoZSBzdXJwbHVzIHBvcHVsYXRpb24gYW5kIHlvdXIgcHJvZHVjdGlvbiByYXRlcw0KICAgICB3aWxsIGJlIGFkdmVyc2VseSBhZmZlY3RlZC4NCg0KJmx0O1QmZ3Q7ICBUYWtlIG9yIExlYXZlIFByb2R1Y3QuICBUaGlzIHdpbGwgbGV0IHlvdSBzcGVjaWZ5IHRvIHRoZQ0KICAgICBkb2NrIHdvcmtlcnMgd2hpY2ggdHlwZSBvZiBwcm9kdWN0cyB5b3Ugd2FudCB0byBsZWF2ZSBhbmQNCiAgICAgd2hpY2ggb25lcyB5b3Ugd2FudCBsb2FkZWQgb24geW91ciBzaGlwLg0KDQombHQ7WiZndDsgIFRyeSB0byBEZXN0cm95IFBsYW5ldC4gIEZpcnN0IHlvdSBwdXJjaGFzZSBBdG9taWMNCiAgICAgRGV0b25hdG9ycyBmcm9tIHRoZSBIYXJkd2FyZSBFbXBvcml1bS4gIFRoYXQgaXMgdGhlIGVhc3kNCiAgICAgcGFydC4gIFlvdSB0aGVuIGhhdmUgdG8gZmlnaHQgeW91ciB3YXkgaW50byB0aGUgc2VjdG9yDQogICAgIGNvbnRhaW5pbmcgdGhlIHBsYW5ldC4gIEFmdGVyIGJhdHRsaW5nIHRoZSBmaWdodGVycywNCiAgICAgUXVhc2FyIENhbm5vbnMsIGFuZCBhbnkgb3RoZXIgbWlsaXRhcnkgZGVmZW5zZXMgdGhhdCBtYXkNCiAgICAgYmUgdGhlcmUsIHlvdSBoYXZlIHRoZSBhYmlsaXR5IHRvIGxheSB5b3VyIEF0b21pYw0KICAgICBEZXRvbmF0b3JzLiAgQ29sb25pc3RzIGhhdmUgYmVlbiB0cmFpbmVkIGluIHRoZSBkaXNhcm1pbmcNCiAgICAgb2YgZGV0b25hdG9ycy4gIE1vc3Qgb2YgdGhlIHRyYWluaW5nIHdhcyBydXNoZWQgYW5kDQogICAgIHByb3ZpZGVkIGJ5IGluZXhwZXJpZW5jZWQgdGVhY2hlcnMsIHNvIHRoZXkgYXJlbid0IHZlcnkNCiAgICAgZ29vZCBhdCBpdC4gIE1vc3Qgb2YgdGhlaXIgYXR0ZW1wdHMgbGl0ZXJhbGx5IGdvIHVwIGluDQogICAgIHNtb2tlLCBhbmQgaWYgeW91IGFyZSBzdGlsbCBvbiB0aGUgcGxhbmV0IHdoZW4gdGhlaXINCiAgICAgYXR0ZW1wdCBnb2VzIGF3cnksIHlvdSBnbyBhd3J5IHdpdGggaXQuICBZb3UgaGF2ZSB0aGUNCiAgICAgb3B0aW9uIG9mIHN1aW5nIHlvdXIgY29udmVudGlvbmFsIHdlYXBvbnMgdG8ga2lsbCBvZmYgdGhlDQogICAgIGNvbG9uaXN0cyBiZWZvcmUgeW91IGxheSB0aGUgZGV0b25hdG9ycyBzbyB5b3UgZG9uJ3QgcnVuDQogICAgIHRoZSByaXNrIG9mIGdldHRpbmcga2lsbGVkIGJ5IHRoZWlyIGxhY2sgb2Ygc2tpbGwuICBJZg0KICAgICB5b3UncmUgd2lsbGluZyB0byByaXNrIHRoZSBiYWQgS2FybWEgdG8gYmUgYSBsaXR0bGUNCiAgICAgc2FmZXIsIHRoaXMgbWlnaHQgYmUgdGhlIGNvcnJlY3Qgb3B0aW9uIGZvciB5b3UuDQoNCiZsdDtRJmd0OyAgTGVhdmUgVGhpcyBQbGFuZXQuICBUYWtlIG9mZiBmcm9tIHRoZSBwbGFuZXQuDQoNCiZsdDshJmd0OyAgUGxhbmV0YXJ5IEhlbHAuICBEaXNwbGF5IHRoZSBwb3J0aW9uIG9mIHRoZSBkb2N1bWVudGF0aW9uDQogICAgIGRlc2NyaWJpbmcgdGhlIFBsYW5ldGFyeSBmdW5jdGlvbnMu') + '</pre>')
    el.append(planetPrompt)
  }

  var starDockHelp = function() {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;STARDOCK MENU&gt;</span>')
    el.append('<pre>' + atob('U1RBUkRPQ0sgTUVOVQ0KDQombHQ7QyZndDsgIFRoZSBDaW5lUGxleCBWaWRlb24gVGhlYXRyZXMuICBZb3UgY2FuIHNtZWxsIHRoZSBwb3Bjb3JuDQogICAgIGZyb20gdGhlIEhhcmR3YXJlIEVtcG9yaXVtLiAgQ29tZSByaWdodCBpbiB0byBzZWUgdGhlDQogICAgIGxhdGVzdCByZWxlYXNlcyBmcm9tIEhvbGx5V29ybGQuICBZb3UgY2FuIGNob29zZSBmcm9tDQogICAgIHNldmVyYWwgZmlyc3QtcnVuIG9mZmVyaW5ncyBvciB5b3UgY2FuIG9wdCBmb3Igb25lIG9mIHRoZQ0KICAgICBjbGFzc2ljcy4gIERvbid0IHRha2UgdG9vIGxvbmcgdG8gbWFrZSB1cCB5b3VyIG1pbmQNCiAgICAgYmVjYXVzZSB0aGVyZSBhcmUgb3RoZXJzIHdhaXRpbmcgaW4gbGluZSBiZWhpbmQgeW91Lg0KDQombHQ7RyZndDsgIFRoZSAybmQgTmF0aW9uYWwgR2FsYWN0aWMgQmFuay4gIEhlcmUgaXMgdGhlIHBsYWNlIHRvDQogICAgIGVuZ2FnZSBpbiBtYXR0ZXJzIG9mIGhpZ2ggZmluYW5jZS4gIFlvdSB3aWxsIGJlIGFibGUgdG8NCiAgICAgcHV0IGNyZWRpdHMgaW50byB5b3VyIG9yIGFub3RoZXIgdHJhZGVyJ3MgYWNjb3VudC4gIFlvdQ0KICAgICBjYW4gdGFrZSBjcmVkaXRzIG91dCBvZiB5b3VyIGFjY291bnQuICBZb3UgY2FuIGV4YW1pbmUNCiAgICAgdGhlIGJhbGFuY2UgaW4geW91ciBhY2NvdW50LiAgVGhlIGJhbmsgYWxsb3dzIG9ubHkNCiAgICAgcGVyc29uYWwgYWNjb3VudHMuICBDb3Jwb3JhdGUgZnVuZHMgc2hvdWxkIGJlIHN0b3JlZCBpbg0KICAgICBzZWN1cmVkIENpdGFkZWxzLg0KDQombHQ7SCZndDsgIFRoZSBTdGVsbGFyIEhhcmR3YXJlIEVtcG9yaXVtLiAgVGhpcyBpcyB0aGUgR2VuZXJhbCBTdG9yZQ0KICAgICBvZiB0aGUgVHJhZGUgV2FycyBVbml2ZXJzZS4gIElmIHlvdSB3YW50IGl0LCB0aGV5IGhhdmUgaXQNCiAgICAgYW5kIGlmIHlvdSBoYXZlIGVub3VnaCBtb25leSwgdGhleSdsbCBzZWxsIGl0IHRvIHlvdS4NCg0KJmx0O1AmZ3Q7ICBUaGUgRmVkZXJhbCBTcGFjZSBQb2xpY2UgSFEuICBUaGUgaG9tZSBvZiBsYXcgZW5mb3JjZW1lbnQNCiAgICAgaW4gdGhlIGdhbGF4eS4gIEhlcmUgeW91IGNhbiByZWdpc3RlciBjb21wbGFpbnRzIGFnYWluc3QNCiAgICAgb3RoZXIgcGxheWVycywgY29sbGVjdCByZXdhcmRzIG9yIHNlZSB0aGUgd2FudGVkIHBvc3RlcnMuDQoNCiZsdDtTJmd0OyAgVGhlIEZlZGVyYXRpb24gU2hpcHlhcmRzLiAgVGhpcyBpcyB0aGUgcGxhY2Ugd2hlcmUgeW91DQogICAgIGNhbiB0cmFkZSB5b3VyIHNoaXAgaW4gZm9yIGEgbmV3ZXIgbW9kZWwgb3Igc2VsbCBvZmYgc29tZSBvZg0KICAgICB0aG9zZSBqdW5rIHNoaXBzIHlvdSd2ZSBnYXRoZXJlZCBhcyBzcG9pbHMgZnJvbSB5b3VyDQogICAgIHZpY3Rvcmllcy4gIFlvdSBjYW4gc2VlIGFsbCB0aGUgbW9kZWxzIGF2YWlsYWJsZSBhbmQgYWxsIHRoZQ0KICAgICBzcGVjaWZpY2F0aW9ucyBmb3IgZWFjaCBzdHlsZS4NCg0KJmx0O1QmZ3Q7ICBUaGUgTG9zdCBUcmFkZXIncyBUYXZlcm4uICBUcmFkZXJzIGNvbWUgaGVyZSBmb3IgbW9yZQ0KICAgICB0aGFuIGp1c3QgYSBkcmluayBhbmQgYSBtZWFsLiAgU29tZSBvZiB0aGUgbW9yZQ0KICAgICBpbnRlcmVzdGluZyBmZWF0dXJlcyBvZiB0aGlzIGdhbWUgY2FuIGJlIGZvdW5kIGhlcmUgaWYNCiAgICAgeW91IGFzayB0aGUgcmlnaHQgcXVlc3Rpb25zLg0KDQombHQ7ISZndDsgIFN0YXJEb2NrIEhlbHAuICBEaXNwbGF5IHRoZSBwb3J0aW9uIG9mIHRoZSBkb2N1bWVudGF0aW9uDQogICAgIGRlc2NyaWJpbmcgdGhlIFN0YXJEb2NrIGZ1bmN0aW9ucy4NCg0KJmx0O1EmZ3Q7ICBSZXR1cm4gdG8gWW91ciBTaGlwIGFuZCBMZWF2ZS4gIExlYXZlIHRoZSBTdGFyZG9jayBhbmQNCiAgICAgcmV0dXJuIHRvIHRoZSBzZWN0b3IuDQo=') + '</pre>')
    el.append(starDockPrompt)
  }

  var policeHelp = function() {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;FEDSPACE HEADQUARTERS MENU&gt;</span>')
    el.append('<pre>' + atob('RkVEUE9MSUNFIEhFQURRVUFSVEVSUyBNRU5VDQoNCiZsdDtBJmd0OyAgQXBwbHkgZm9yIGEgRmVkZXJhbCBDb21taXNzaW9uLiAgVGhlIEZlZGVyYXRpb24gYXdhcmRzDQogICAgIGNvbW1pc3Npb25zIHRvIHRob3NlIGluZGl2aWR1YWxzIHdobyBoYXZlIHNob3duDQogICAgIHRoZW1zZWx2ZXMgdG8gYmUgaGlnaGx5IGV4cGVyaWVuY2VkIGFuZCBsYXcgYWJpZGluZy4gIElmDQogICAgIHlvdSBiZWxpZXZlIHlvdXJzZWxmIHRvIHF1YWxpZnksIGFwcGx5IGF0IHRoZSBQb2xpY2UNCiAgICAgSGVhZHF1YXJ0ZXJzLiAgSWYgdGhlIEZlZHMgZ3JhbnQgeW91IGEgY29tbWlzc2lvbiwgeW91DQogICAgIHdpbGwgYmUgYWJsZSB0byBwcm9jdXJlIGFuIEltcGVyaWFsIFN0YXJzaGlwLiAgVGhpcyBpcyBhDQogICAgIHZlcnkgcG93ZXJmdWwgc2hpcCBidXQgd2l0aCBpdCBjb21lcyBhIGxvdCBvZg0KICAgICByZXNwb25zaWJpbGl0eS4gIFRoZSBGZWRlcmF0aW9uIG1heSBjYWxsIHVwb24geW91IHRvIGFpZA0KICAgICB0aGVpciBjYXVzZSBvZiBtYWludGFpbmluZyBsYXcgYW5kIG9yZGVyIHRocm91Z2hvdXQgdGhlDQogICAgIHVuaXZlcnNlLiAgVGhlcmUgYXJlIGEgbGltaXRlZCBudW1iZXIgb2YgU3RhcnNoaXBzDQogICAgIGF2YWlsYWJsZSwgc28gYXBwbHkgZm9yIHlvdXIgY29tbWlzc2lvbiBhcyBzb29uIGFzIHlvdQ0KICAgICBjYW4uDQoNCiZsdDtDJmd0OyAgQ2xhaW0gYSBGZWRlcmF0aW9uIFJld2FyZC4gIEFmdGVyIHlvdSBoYXZlIGRvbmUgeW91ciBkdXR5DQogICAgIGFzIGEgZ29vZCBGZWRMYXcgYWJpZGluZyBjaXRpemVuLCB5b3Ugd2lsbCB3YW50IHRvIGNsYWltDQogICAgIHRoZSByZXdhcmQgdGhhdCBpcyByaWdodGZ1bGx5IHlvdXJzLiAgTWFyY2ggcmlnaHQgaW50bw0KICAgICB0aGUgUG9saWNlIEhRIGFuZCB0ZWxsIHRoZSBzZXJnZWFudCB0aGF0IGhlIG5vIGxvbmdlciBoYXMNCiAgICAgdG8gd29ycnkgYWJvdXQgdGhlIHNjdW1iYWcgeW91IHRlcm1pbmF0ZWQuICBCZSBzdXJlIHRvDQogICAgIHB1dCB0aGUgcmV3YXJkIG1vbmV5IHRvIGdvb2QgdXNlLg0KDQombHQ7RSZndDsgIEV4YW1pbmUgdGhlIFRlbiBNb3N0IFdhbnRlZCBMaXN0LiAgVGhlcmUgaXMgYSBsaXN0aW5nDQogICAgIGF2YWlsYWJsZSBpbiB0aGUgRmVkUG9saWNlIGJ1aWxkaW5nIG9mIHRoZSBtb3N0IGNvcnJ1cHQNCiAgICAgcGxheWVycyBpbiB0aGUgZ2FtZS4gIFRoaXMgbGlzdCBzaG93cyB0aGUgbGV2ZWwgb2YgZXZpbA0KICAgICB0aGUgcGxheWVyIGhhcyBhY2hpZXZlZCwgdGhlIGNvcnBvcmF0aW9uIHRvIHdoaWNoIGhlL3NoZQ0KICAgICBiZWxvbmdzLCB0aGUgbnVtYmVyIG9mIGJvdW50aWVzIHBvc3RlZCBvbiB0aGF0IHBsYXllciBhbmQNCiAgICAgdGhlIHRvdGFsIHJld2FyZCBmb3IgdGhhdCBwbGF5ZXIncyBkZW1pc2UuDQoNCiZsdDtQJmd0OyAgUG9zdCBhIFJld2FyZCBvbiBTb21lb25lLiAgV291bGQgeW91IGxpa2UgdG8gbWFrZSBpdCBhDQogICAgIGxpdHRsZSBtb3JlIHJld2FyZGluZyBmb3Igc29tZW9uZSB0byBnZXQgb25lIG9mIHRoZQ0KICAgICBwbGF5ZXJzIG9uIHRoZSBNb3N0IFdhbnRlZCBsaXN0PyAgWW91IGNhbiBvZmZlciBhcyBzbWFsbA0KICAgICBvciBhcyBsYXJnZSBhIHBheW1lbnQgYXMgeW91IHdvdWxkIGxpa2UuICBKdXN0IHNlZSB0aGUNCiAgICAgb2ZmaWNlciBvbiBkdXR5IGFuZCB0ZWxsIGhpbSB5b3Ugd2FudCB0byBwb3N0IGEgcmV3YXJkLg0KICAgICBZb3Ugd2lsbCBiZSBzaG93biB0aGUgbGlzdCBvZiB0aGUgTW9zdCBXYW50ZWQgY3JpbWluYWxzLg0KICAgICBUZWxsIHRoZSBuaWNlIG9mZmljZXIgd2hpY2ggb25lIHlvdSB3b3VsZCBtb3N0IGxpa2UgdG8NCiAgICAgc2VlIGJyb3VnaHQgdG8ganVzdGljZSBhbmQgaG93IG11Y2ggeW91IHdhbnQgdG8gZ2l2ZSB0bw0KICAgICBoZWxwIGluIHRoZSBjYXVzZS4NCg0KJmx0OyEmZ3Q7ICBGZWRQb2xpY2UgSGVscC4gIERpc3BsYXkgdGhlIHBvcnRpb24gb2YgdGhlIGRvY3VtZW50YXRpb24NCiAgICAgZGVzY3JpYmluZyB0aGUgRmVkUG9saWNlIGZ1bmN0aW9ucy4NCg0KJmx0O1EmZ3Q7ICBMZWF2ZSB0aGUgUG9saWNlIFN0YXRpb24uICBFeGl0IHRoZSBidWlsZGluZyBhbmQgcmV0dXJuDQogICAgIHRvIHRoZSBtYWluIGFyZWEgb2YgdGhlIFN0YXJEb2NrLg==') + '</pre>')
    el.append(policePrompt)
  }

  var shipyardHelp = function(data) {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;SHIPYARDS MENU&gt;</span>')
    el.append('<pre>' + atob('U0hJUFlBUkRTIE1FTlUNCg0KJmx0O0ImZ3Q7ICBCdXkgYSBOZXcgU2hpcC4gIFdoZW4geW91IGFyZSByZWFkeSB0byB1cGdyYWRlLCBvciBpZiB5b3UNCiAgICAgbmVlZCBhIHNwZWNpYWxpemVkIHNoaXAsIGNvbWUgdG8gdGhlIFNoaXB5YXJkcyBhbmQgdGFsaw0KICAgICB0byBDYWwgV29ydGhpbmd0b24gWFhJIGFib3V0IGEgdHJhZGUtaW4uICBZb3Ugd2lsbCBiZQ0KICAgICBvZmZlcmVkIGEgZmFpciBwcmljZSBmb3IgeW91ciBjdXJyZW50IHNoaXAuICBUaGV5IHdpbGwNCiAgICAgdGFrZSBhbnl0aGluZyBpbiB5b3VyIHRyYWRlIHN1Y2ggYXMgZmlnaHRlcnMsDQogICAgIGFjY2Vzc29yaWVzLCBtaW5lcywgZXRjLiBzbyBpZiB5b3UncmUgdHJ5aW5nIHRvIGdldCBhIGxvdA0KICAgICBvbiB5b3VyIHRyYWRlLWluLCBsb2FkIHlvdXIgc2hpcCB1cCBiZWZvcmUgeW91IHRhbGsgdG8NCiAgICAgdGhlbS4gIElmIHlvdSBkb24ndCB3YW50IHRvIHVzZSBhbGwgeW91ciBleHRyYXMgaW4gdGhlDQogICAgIHRyYWRlLCB5b3UgbWlnaHQgd2FudCB0byBsZWF2ZSBhcyBtdWNoIGFzIHlvdSBjYW4gaW4gYQ0KICAgICBzZWN1cmUgcGxhY2UgYW5kIHBpY2sgaXQgdXAgYWZ0ZXIgeW91IHB1cmNoYXNlIHlvdXIgbmV3DQogICAgIHNoaXAuICBOZXcgc2hpcHMgYXJlIHZlcnkgYmFzaWMgbW9kZWxzLiAgVGhlIGV4dHJhcyBhcmUNCiAgICAgYXZhaWxhYmxlIGF0IHRoZSBIYXJkd2FyZSBFbXBvcml1bSBhbmQgdGhlIENsYXNzIDAgcG9ydHMuDQoNCiZsdDtTJmd0OyAgU2VsbCBFeHRyYSBTaGlwcy4gIEEgZGlzcGxheSB3aXRoIGFsbCB5b3VyIHNoaXBzIGluIG9yYml0DQogICAgIHdpbGwgYXBwZWFyLiAgQ2hvb3NlIHdoaWNoIG9uZXMgdG8gc2VsbCBvZmYuICBZb3Ugd2lsbCBiZQ0KICAgICBhYmxlIHRvIHNlZSB0aGUgc2hpcCBudW1iZXIsIG5hbWUsIHR5cGUsIGxvY2F0aW9uIGFuZCBob3cNCiAgICAgbWFueSBmaWdodGVycyBhbmQgc2hpZWxkcyBhcmUgb24gZWFjaCBzaGlwLg0KDQombHQ7RSZndDsgIEV4YW1pbmUgU2hpcCBTcGVjcy4gIFRoaXMgaXMgdGhlIHNhbWUgaW5mb3JtYXRpb24NCiAgICAgYXZhaWxhYmxlIHRvIHlvdSBmcm9tIHlvdXIgc2hpcCdzIG9uLWJvYXJkIGNvbXB1dGVyLCBidXQNCiAgICAgaW4gaW5jbHVkZXMgKGZvciBBTlNJIHVzZXJzIG9ubHkpIGEgcGljdHVyZSBvZiBlYWNoIHNoaXAsDQogICAgIGJvdGggdG9wIGFuZCBmcm9udCB2aWV3LiAgWW91IG1heSB3YW50IHRvIHJldmlldyB0aGUgc2hpcA0KICAgICBzcGVjaWZpY2F0aW9ucyBvbmUgbGFzdCB0aW1lIGJlZm9yZSB5b3UgbWFrZSB5b3VyDQogICAgIHB1cmNoYXNlLg0KDQombHQ7UCZndDsgIEJ1eSBDbGFzcyAwIEl0ZW1zLiAgQWZ0ZXIgeW91IHB1cmNoYXNlIHlvdXIgc2hpcCwgeW91IG1heQ0KICAgICBuZWVkIHRvIGVxdWlwIGl0IHdpdGggYSBmZXcgb2YgdGhlIGl0ZW1zIG5vcm1hbGx5DQogICAgIHB1cmNoYXNlZCBhdCB0aGUgQ2xhc3MgMCBwb3J0cy4gIFlvdSB3b3VsZG4ndCB3YW50IHRvDQogICAgIHRha2UgdGhhdCBicmFuZCBuZXcgYmVhdXR5IG91dCB1bnByb3RlY3RlZCwgd291bGQgeW91Pw0KICAgICBUaGUgbWVyY2hhbnRzIGluIHRoZSBzaGlweWFyZHMgaGF2ZSBvYnRhaW5lZCBmaWdodGVycywNCiAgICAgc2hpZWxkcyBhbmQgaG9sZHMgZnJvbSAidHJhZGUtaW5zIiBzbyB0aGV5IGFyZSBvZmZlcmluZw0KICAgICB0aGVtIHJpZ2h0IGhlcmUgd2hlcmUgeW91IGJ1eSB5b3VyIHNoaXAgYXMgYSBjb252ZW5pZW5jZQ0KICAgICB0byB5b3UuICBCZSBmb3Jld2FybmVkIHRoYXQgeW91IHdpbGwgYmUgcGF5aW5nIGEgcHJlbWl1bQ0KICAgICBwcmljZSBmb3IgdGhpcyBjb252ZW5pZW5jZS4NCg0KJmx0O1ImZ3Q7ICBDaGFuZ2UgU2hpcCBSZWdpc3RyYXRpb24uICBJdCdzIG5vdCBwYXJhbm9pYSB3aGVuIHRoZXkncmUNCiAgICAgcmVhbGx5IG91dCB0byBnZXQgeW91LiAgSWYgeW91ciBmb2VzIGFyZSB0cmFja2luZyB5b3UNCiAgICAgZG93biBieSByZWFkaW5nIHRoZSBsb2dzIGF0IHRoZSBTdGFyUG9ydHMgb3IgdGhleSd2ZQ0KICAgICByZWNlaXZlZCBpbmZvcm1hdGlvbiBvbiB5b3VyIHNoaXAgZnJvbSBhIGxvb3NlLXRvbmd1ZWQNCiAgICAgZm9vbCBhdCB0aGUgdGF2ZXJuLCBnbyB0byB0aGlzIGJhY2sgcm9vbSBpbiB0aGUgb2ZmaWNlcw0KICAgICBvZiB0aGUgU2hpcHlhcmRzLiAgRm9yIGEgaGVmdHkgZmVlLCB5b3UgY2FuIGdldCByZXZpc2VkDQogICAgIHJlZ2lzdHJhdGlvbiBwYXBlcnMgb24geW91ciBzaGlwIGFuZCBjaHJpc3RlbiBpdCB3aXRoIGENCiAgICAgbmV3LCB1bnRyYWNlYWJsZSBuYW1lLg0KDQombHQ7ISZndDsgIFNoaXB5YXJkcyBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUgZG9jdW1lbnRhdGlvbg0KICAgICBkZXNjcmliaW5nIHRoZSBTaGlweWFyZHMgZnVuY3Rpb25zLg0KDQombHQ7USZndDsgIExlYXZlIHRoZSBTaGlweWFyZHMuICBSZXR1cm4gdG8gdGhlIG1haW4gYXJlYSBvZiB0aGUNCiAgICAgU3RhckRvY2suDQo=') + '</pre>')
    el.append('<br />You have <span class="ansi-bright-yellow-fg">' + addCommas(data.trader.credits) + '</span> credits.')
    el.append(shipyardPrompt)
  }

  var citadelHelp = function(data) {
    window.scrollTo(0, 0)
    el.html('<span class="ansi-bright-white-fg ansi-blue-bg">&lt;CITADEL MENU&gt;</span>')
    el.append('<pre>' + atob('Q0lUQURFTCBNRU5VDQoNCiZsdDtCJmd0OyAgVHJhbnNwb3J0ZXIgQ29udHJvbC4gIEhlcmUgaXMgd2hlcmUgeW91IGdvIHRvIGJlYW0geW91IGFuZA0KICAgICB5b3VyIHNoaXAgdG8gYW5vdGhlciBzZWN0b3IuICBUaGUgdHJhbnNwb3J0ZXIgcmFuZ2UgaXMNCiAgICAgbGltaXRlZCwgYnV0IHdpdGggZW5vdWdoIGNyZWRpdHMsIHlvdSBjYW4gYWxzbyB1c2UgdGhpcw0KICAgICBvcHRpb24gdG8gdXBncmFkZSBpdCdzIHJhbmdlLg0KDQombHQ7QyZndDsgIEVuZ2FnZSBTaGlwJ3MgQ29tcHV0ZXIuICBVc2UgdGhpcyBmdW5jdGlvbiB0byB1c2UgYWxsDQogICAgIHlvdXIgQ3JhaSdzIHBvd2VyIGp1c3QgYXMgeW91IHdvdWxkIGJ5IGNob29zaW5nICZsdDtDJmd0OyBmcm9tDQogICAgIHRoZSBNYWluIE1lbnUuDQoNCiZsdDtEJmd0OyAgRGlzcGxheSBUcmFkZXJzIEhlcmUuICBUaGlzIHdpbGwgc2hvdyB5b3UgdGhlIGd1ZXN0DQogICAgIHJlZ2lzdGVyIG9mIHRoZSBvdGhlciBwbGF5ZXJzIHdobyBhcmUgcGFya2VkIGluIHRoZQ0KICAgICBDaXRhZGVsLiAgVGhlIHJlZ2lzdGVyIGdpdmVzIHlvdSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyLA0KICAgICB0aGVpciBzaGlwIHR5cGUgYW5kIGhvdyBtYW55IGZpZ2h0ZXJzLCBzaGllbGRzIGFuZCBob2xkcw0KICAgICB0aGV5IGhhdmUuICBUaGlzIGluZm9ybWF0aW9uIGNvdWxkIHByb3ZlIHZlcnkgdXNlZnVsIGlmDQogICAgIHlvdSBoYXZlIGp1c3QgY2FwdHVyZWQgdGhlIHBsYW5ldCBmcm9tIG9uZSBvZiB5b3VyDQogICAgIG9wcG9uZW50cy4NCg0KJmx0O0UmZ3Q7ICBFeGNoYW5nZSBUcmFkZXIgU2hpcHMuICBJZiB0aGUgb3RoZXIgcGxheWVycyBwYXJrZWQgaW4NCiAgICAgdGhlIENpdGFkZWwgaGF2ZSBzcGVjaWZpZWQgdGhlaXIgdmVoaWNsZSBhcyBhdmFpbGFibGUgZm9yDQogICAgIHRyYWRlLCB0aGVuIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgZXhjaGFuZ2luZyB5b3VyIHNoaXANCiAgICAgZm9yIHRoZWlycy4gIEJlIHN1cmUgdG8gY29vcmRpbmF0ZSB0aGlzIGNhcmVmdWxseSB3aXRoDQogICAgIHRoZSBvdGhlciBtZW1iZXJzIG9mIHlvdXIgY29ycG9yYXRpb24uICBPbmx5IEMuRS5PLidzIGNhbg0KICAgICB1c2UgQ29ycG9yYXRlIEZsYWdzaGlwcyBzbyB0aGV5IGFyZSBub3QgYXZhaWxhYmxlIGZvcg0KICAgICB0cmFkZS4gIElmIHlvdSBoYXZlIHNlaXplZCB0aGlzIHBsYW5ldCBmcm9tIGFuIG9wcG9uZW50DQogICAgIHN0aWxsIHBhcmtlZCBpbiB0aGUgQ2l0YWRlbCwgeW91IG1heSB3YW50IHRvIGNvbW1hbmRlZXINCiAgICAgaGlzIHNoaXAgZm9yIHlvdXIgb3duIHVzZS4NCg0KJmx0O0cmZ3Q7ICBTaGllbGQgR2VuZXJhdG9yIENvbnRyb2wuICBJZiB5b3UgaGF2ZSB5b3VyIGxldmVsIDUNCiAgICAgQ2l0YWRlbCBjb21wbGV0ZWQsIHlvdSBjYW4gdXNlIHRoaXMgb3B0aW9uIHRvIHN0b3JlIHlvdXINCiAgICAgc2hpZWxkcy4gIFlvdSB0cmFuc2ZlciB5b3VyIFNoaXAncyBzaGllbGRzIHRvIHRoZQ0KICAgICBQbGFuZXRhcnkgU2hpZWxkaW5nIFN5c3RlbSB1c2luZyB0aGlzIG9wdGlvbiAoMTAgc2hpcA0KICAgICBzaGllbGRzID0gMSBwbGFuZXRhcnkgc2hpZWxkKS4gIFN0b3JlZCBzaGllbGRzIHdpbGwgYmUNCiAgICAgdXNlZCBpbiB0aGUgZGVmZW5zZSBvZiB5b3VyIHBsYW5ldC4gIFRoZSBQbGFuZXRhcnkNCiAgICAgU2hpZWxkaW5nIFN5c3RlbSB3aWxsIHByb3RlY3QgeW91ciBwbGFuZXQgZnJvbSB5b3VyDQogICAgIGVuZW1pZXMuICBZb3Ugd2lsbCB0aHdhcnQgeW91ciByaXZhbHMnIGF0dGVtcHRzIHRvDQogICAgIGluY2FwYWNpdGF0ZSB5b3VyIGRlZmVuc2VzIHdpdGggUGhvdG9uIE1pc3NpbGVzLiAgWW91cg0KICAgICBvcHBvbmVudHMgd2lsbCBiZSB1bmFibGUgdG8gc2NhbiB5b3VyIHBsYW5ldC4NCg0KJmx0O0kmZ3Q7ICBQZXJzb25hbCBJbmZvLiAgVGhpcyBzZWxlY3Rpb24gd2lsbCBlbmFibGUgeW91IHRvIHNlZSBhbGwNCiAgICAgb2YgeW91ciBjdXJyZW50IHN0YXRpc3RpY3MuICBUaGUgaW5mb3JtYXRpb24gd2lsbCBkaXNwbGF5DQogICAgIHNhbWUgYXMgaXQgZG9lcyB3aGVuIHlvdSBjaG9vc2Ugb3B0aW9uICZsdDtJJmd0OyBmcm9tIHRoZSBNYWluDQogICAgIE1lbnUuDQoNCiZsdDtMJmd0OyAgUXVhc2FyIENhbm5vbiBSLWxldmVsLiAgVXNlIHRoaXMgb3B0aW9uIHRvIHNldCBib3RoIHRoZQ0KICAgICBBdG1vc3BoZXJpYyBhbmQgU2VjdG9yIHJlYWN0aW9uIGxldmVscy4gIFRoZSBRdWFzYXINCiAgICAgQ2Fubm9uIGluIHlvdXIgTGV2ZWwgVGhyZWUgQ2l0YWRlbCB1c2VzIG1hc3NpdmUgYW1vdW50cw0KICAgICBvZiBGdWVsIE9yZS4gIFVzZSB0aGlzIG9wdGlvbiB0byBhZGp1c3QgdGhlIHBlcmNlbnRhZ2Ugb2YNCiAgICAgT3JlIG9uIHRoZSBwbGFuZXQgdXNlZCBpbiB0aGlzIHdlYXBvbidzIGNhcGFiaWxpdHkuDQogICAgIFBMRUFTRSBOT1RFOiBUaGUgUXVhc2FyIENhbm5vbiB3aWxsIHVzZSB0aGUgZW50ZXJlZA0KICAgICBwZXJjZW50YWdlIG9mIEZ1ZWwgT3JlIHJlbWFpbmluZyBvbiB0aGUgcGxhbmV0IGZvciBFQUNIDQogICAgIFNIT1QgaXQgZmlyZXMuICBJZiB5b3Ugc2V0IHRoZSBTZWN0b3IgdmFsdWUgdG8gMTAwJSBhbmQNCiAgICAgYSBTY291dCBNYXJhdWRlciB3aXRoIDUgZmlnaHRlcnMgd2FuZGVycyBpbnRvIHlvdXINCiAgICAgc2VjdG9yLCB0aGUgQ2Fubm9uIHdpbGwgdXNlIGFsbCB0aGUgRnVlbCBPcmUgb24geW91cg0KICAgICBwbGFuZXQgdG8gYmxvdyB0aGUgaW50cnVkZXIgaW50byBzcGFjZSBkdXN0LiAgSWYgYW5vdGhlcg0KICAgICBwbGF5ZXIgbGF0ZXIgdHJhbXBzIGludG8geW91ciBzZWN0b3IgaW4gYSB3ZWxsLWFybWVkDQogICAgIEJhdHRsZVNoaXAgeW91ciBDYW5ub24gd2lsbCBzaXQgaWRsZSBkdWUgdG8gbGFjayBvZg0KICAgICBhbW11bml0aW9uLiAgQW5vdGhlciBjb25zaWRlcmF0aW9uIHdoZW4gc2V0dGluZyB5b3VyDQogICAgIHBlcmNlbnRhZ2VzIGlzIHRoYXQgdGhlIGFjY3VyYWN5IG9mIHRoZSBDYW5ub24gaXMgbXVjaA0KICAgICBiZXR0ZXIgYW5kIHRoZSBkYW1hZ2UgY2F1c2VkIGJ5IHRoZSBibGFzdCBpcyBncmVhdGVyIHdoZW4NCiAgICAgdGhlIHRhcmdldCBpcyBpbiB0aGUgcGxhbmV0J3MgYXRtb3NwaGVyZS4NCg0KDQombHQ7TSZndDsgIE1pbGl0YXJ5IFJlYWN0aW9uIExldmVsLiAgQW5vdGhlciBtZXRob2Qgb2YgY3VzdG9taXppbmcNCiAgICAgeW91ciBwcm90ZWN0aW9uLCB0aGlzIHdpbGwgbGV0IHlvdSBzZXQgdGhlIHBlcmNlbnRhZ2Ugb2YNCiAgICAgZmlnaHRlcnMgc3RhdGlvbmVkIHRoZXJlIHRvIGJlIHVzZWQgYXMgb2ZmZW5zaXZlIG9yDQogICAgIGRlZmVuc2l2ZSBpbiBjYXNlIG9mIGFuIGF0dGFjayBvbiB0aGUgcGxhbmV0LiAgWW91IG11c3QNCiAgICAgaGF2ZSBhIENvbWJhdCBDb250cm9sIENvbXB1dGVyIChMZXZlbCBUd28gQ2l0YWRlbCBvcg0KICAgICBoaWdoZXIpIHRvIHVzZSB0aGlzIG9wdGlvbi4gIFRoZSB2YWx1ZSB5b3UgZW50ZXIgd2lsbCBiZQ0KICAgICB0aGUgcGVyY2VudGFnZSBvZiBmaWdodGVycyB0aGF0IHdpbGwgYXR0YWNrIG9mZmVuc2l2ZWx5DQogICAgIGFzIHNvbWVvbmUgYXR0ZW1wdHMgdG8gbGFuZCBvbiB5b3VyIHBsYW5ldC4gIFRoZSBiYWxhbmNlDQogICAgIG9mIHlvdXIgZmlnaHRlcnMgd2lsbCBmYWxsIGJhY2sgZm9yIGRlZmVuc2Ugb2YgdGhlIHBsYW5ldA0KICAgICBhbmQgQ2l0YWRlbC4NCg0KJmx0O04mZ3Q7ICBJbnRlcmRpY3RvciBDb250cm9sLiAgSWYgeW91IGhhdmUgdXBncmFkZWQgeW91ciBjaXRhZGVsIHRvDQogICAgIGxldmVsIDYsIHRoaXMgd2lsbCBhbGxvdyB5b3UgdG8gY29udHJvbCB0aGUgSW50ZXJkaWN0b3INCiAgICAgZ2VuZXJhdG9yIG9uIHRoZSBwbGFuZXQuICAgIFlvdSB3aWxsIHdhbnQgdG8gdXNlIHRoaXMgaW4NCiAgICAgY29uanVuY3Rpb24gd2l0aCBhIFF1YXNhciBDYW5ub24uICBJZiB0aGUgZ2VuZXJhdG9yIGlzIG9uLA0KICAgICBhbiBlbmVteSBzaGlwIGNhbm5vdCBsZWF2ZSB0aGUgc2VjdG9yLiAgVGhpcyBnZW5lcmF0b3INCiAgICAgY29uc3VtZXMgYSBsb3Qgb2YgZnVlbCBvcmUgd2hlbiB1c2VkLiAgTWFrZSBzdXJlIHlvdXIgUS0NCiAgICAgY2Fubm9uIGlzIHNldCBtb3N0IGNhcmVmdWxseS4gIE90aGVyd2lzZSwgdGhlIGVuZW15IGNhbiB0cnkNCiAgICAgdG8gZXNjYXBlIGFuZCBkZXBsZXRlIGFsbCB0aGUgZnVlbCBvcmUgb24geW91ciBwbGFuZXQuDQoNCiZsdDtQJmd0OyAgUGxhbmV0YXJ5IFRyYW5zV2FycC4gIFRoZSBpbnN0cnVjdGlvbnMgZm9yIHRoaXMgZmVhdHVyZQ0KICAgICBhcmUgaW4geW91ciBMZXZlbCBGb3VyIENpdGFkZWwuICBQcm92aWRlZCB5b3UgaGF2ZSBlbm91Z2gNCiAgICAgRnVlbCBPcmUgdG8gcG93ZXIgdGhlIG1hbW1vdGggZW5naW5lLCB5b3UgY2FuIG1vdmUgeW91cg0KICAgICBwbGFuZXQgdG8gYW55IHNlY3RvciB3aGVyZSB5b3UgY3VycmVudGx5IGhhdmUgZmlnaHRlcnMNCiAgICAgc3RhdGlvbmVkLg0KDQombHQ7UiZndDsgIFJlbWFpbiBIZXJlIE92ZXJuaWdodC4gIFlvdSBjYW4gc2xlZXAgZmVlbGluZyBzYWZlIGFuZA0KICAgICBzZWN1cmUgaWYgeW91IGJlZCBkb3duIGluc2lkZSB0aGUgQ2l0YWRlbCwgb3V0IG9mIHRoZSByYXQNCiAgICAgcmFjZS4gIFlvdSB3aWxsIGhhdmUgdGhlIHByb3RlY3Rpb24gb2YgeW91ciBwbGFuZXRhcnkNCiAgICAgZm9yY2VzIHRvIGd1YXJkIHlvdS4gIFdoZW4geW91IGxlYXZlIHlvdXIgc2hpcCwgdGhlIHZhbGV0DQogICAgIHdpbGwgYXNrIGlmIHlvdSB3YW50IG90aGVycyB3aG8gZW50ZXIgdGhlIENpdGFkZWwgdG8gaGF2ZQ0KICAgICB0aGUgcHJpdmlsZWdlIG9mIGV4Y2hhbmdpbmcgc2hpcHMgd2l0aCB5b3UuICBJdCdzDQogICAgIHBlcmZlY3RseSB3aXRoaW4geW91ciByaWdodHMgdG8ga2VlcCB5b3VyIHNoaXAgZm9yDQogICAgIHBlcnNvbmFsIHVzZSBvbmx5Lg0KDQombHQ7UyZndDsgIFNjYW4gVGhpcyBTZWN0b3IuICBUaGlzIG9wdGlvbiB3aWxsIGxldCB5b3Ugc2VlDQogICAgIGV2ZXJ5dGhpbmcgaW4gdGhlIHNlY3RvciBhcm91bmQgdGhpcyBwbGFuZXQuICBUaGUgZGlzcGxheQ0KICAgICB3aWxsIGJlIHRoZSBzYW1lIGFzIHlvdSBnZXQgZnJvbSBvcHRpb24gJmx0O0QmZ3Q7IGluIHRoZSBNYWluDQogICAgIE1lbnUuDQoNCiZsdDtUJmd0OyAgVHJlYXN1cnkgRnVuZCBUcmFuc2ZlcnMuICBJZiB5b3UgZG9uJ3QgbGlrZSB0byBjYXJyeSBhDQogICAgIGxvdCBvZiBjcmVkaXRzIG9uIHlvdSB3aGVuIHlvdSdyZSBvdXQgZXhwbG9yaW5nIHRoZQ0KICAgICB1bml2ZXJzZSwgeW91IGNhbiBkZXBvc2l0IHlvdXIgZXhjZXNzIGluIHRoZSBDaXRhZGVsLg0KICAgICBZb3UgY2FuIHdpdGhkcmF3IHRoZSBjcmVkaXRzIHdoZW5ldmVyIHlvdSBuZWVkIHRoZW0uICBCZQ0KICAgICBhZHZpc2VkIHRoYXQgdGhlIFRyZWFzdXJ5IHdvcmtlcnMgYXJlIHF1aXRlIGxheCBpbiB0aGVpcg0KICAgICBzZWN1cml0eSBtZWFzdXJlcyBhbmQgYW55b25lIHdobyBlbnRlcnMgdGhlIENpdGFkZWwgY2FuDQogICAgIHdpdGhkcmF3IGFueSBhbmQgYWxsIG9mIHRoZSBjcmVkaXRzLg0KDQombHQ7VSZndDsgIFVwZ3JhZGUgQ2l0YWRlbC4gIE9uY2UgeW91ciBDaXRhZGVsIGNvbnN0cnVjdGlvbiBpcw0KICAgICBjb21wbGV0ZSwgeW91IG1heSBmaW5kIHlvdSB3aXNoIHRvIHVwZ3JhZGUuICBWZXJ5IGZldw0KICAgICBwZW9wbGUgYXJlIGNvbnRlbnQgd2l0aCBhIExldmVsIE9uZSBDaXRhZGVsLiAgWW91IHdpbGwNCiAgICAgbmVlZCBtb3JlIGNvbG9uaXN0cyBhbmQgbWF0ZXJpYWxzIGZvciBlYWNoIGxldmVsIG9mDQogICAgIGltcHJvdmVtZW50cy4gIExldmVsIFR3byBoYXMgYSBDb21iYXQgQ29udHJvbCBTeXN0ZW0NCiAgICAgd2hpY2ggZW5hYmxlcyB5b3UgdG8gc2V0IHRoZSBmaWdodGVycyBkZXBsb3llZCBvbiB0aGUNCiAgICAgcGxhbmV0IGFzIG9mZmVuc2l2ZSBvciBkZWZlbnNpdmUuICBMZXZlbCBUaHJlZSBjb250YWlucw0KICAgICBhIFF1YXNhciBDYW5ub24gd2hpY2ggaXMgYSB2ZXJ5IHBvd2VyZnVsIHdlYXBvbiwgYnV0IHVzZXMNCiAgICAgYSBjb25zaWRlcmFibGUgYW1vdW50IG9mIEZ1ZWwgT3JlIHRvIG9wZXJhdGUuICBMZXZlbCBGb3VyDQogICAgIGVuY2xvc2VzIHRoZSBtYXNzaXZlIGVuZ2luZSB1c2VkIGZvciB0aGUgVHJhbnNXYXJwIERyaXZlLg0KICAgICBMZXZlbCBGaXZlIHByb3ZpZGVzIHRoZSBwb3dlciBmb3IgdGhlIFBsYW5ldGFyeSBTaGllbGRpbmcNCiAgICAgU3lzdGVtLiAgVGhlIFBTUyB3aWxsIHByb3ZpZGUgYSBzdHVyZHkgc2hpZWxkIGZvciB5b3VyDQogICAgIHBsYW5ldCB3aGljaCB5b3VyIGVuZW1pZXMgd2lsbCBoYXZlIGEgaGFyZCB0aW1lDQogICAgIHBlbmV0cmF0aW5nIHdpdGggZmlnaHRlcnMgb3IgcGhvdG9uIG1pc3NpbGVzLiAgTGV2ZWwgNg0KICAgICBlcXVpcHMgdGhlIHBsYW5ldCB3aXRoIGFuIEludGVyZGljdG9yIEdlbmVyYXRvci4gIElmIHR1cm5lZA0KICAgICBvbiwgdGhpcyBnZW5lcmF0b3Igd2lsbCBtYWtlIGl0IGltcG9zc2libGUgZm9yIHlvdXIgZW5lbXkgdG8NCiAgICAgZXNjYXBlIGZyb20geW91ciBRdWFzYXIgQ2Fubm9uLg0KDQombHQ7ViZndDsgIEV2aWN0IE90aGVyIFRyYWRlcnMuICBOb3cgdGhhdCB5b3UndmUgc3Vydml2ZWQgYWxsIHRoZQ0KICAgICBkZWZlbnNlcyB5b3VyIG9wcG9uZW50IHBsYWNlZCB0byBrZWVwIHlvdSBvdXQsIHlvdSBzaG91bGQNCiAgICAgYmUgYWJsZSB0byBjb21lIGluIGFuZCB0YWtlIG92ZXIsIHJpZ2h0PyAgT2NjYXNpb25hbGx5DQogICAgIHlvdSBnbyBpbnRvIGEgbmV3bHkgY2FwdHVyZWQgQ2l0YWRlbCBvbmx5IHRvIGZpbmQgdGhlDQogICAgIHRyYWRlciAob3IgdHJhZGVycykgd2hvIHByZXZpb3VzbHkgY29udHJvbGxlZCB0aGUgcGxhbmV0Lg0KICAgICBObyBuZWVkIHRvIGhhdmUgdGhlbSBpbiB5b3VyIHdheS4gIFNpbXBseSBzZWxlY3QgdGhpcw0KICAgICBvcHRpb24gdG8gYWN0aXZhdGUgdGhlIEVtZXJnZW5jeSBXYXJuaW5nIFN5c3RlbSBpbiB0aGUNCiAgICAgQ2l0YWRlbC4gIEl0IHdpbGwgYWxlcnQgdGhlc2UgdW53YW50ZWQgZ3Vlc3RzIHRvIHNvbWUNCiAgICAgaW1wZW5kaW5nIGRvb20gYW5kIHRoZWlyIHNoaXBzIHdpbGwgYmxhc3Qgb2ZmIGludG8gb3JiaXQNCiAgICAgYXJvdW5kIHRoZSBwbGFuZXQuICBUaGUgc3lzdGVtIHdpbGwgbGlzdCB0aGUgdHJhZGVycyBhcw0KICAgICB0aGV5IGVzY2FwZS4gIFlvdSB0aGVuIG1heSBlaXRoZXIgc3RheSBpbiB0aGUgQ2l0YWRlbCBvdXQNCiAgICAgb2YgaGFybSdzIHdheSBvciB5b3UgY2FuIGdvIG91dCBpbnRvIHRoZSBzZWN0b3IgdG8NCiAgICAgaW5mbGljdCBtb3JlIGRhbWFnZSBvbiB5b3VyIGVuZW15Lg0KDQombHQ7WCZndDsgIENvcnBvcmF0aW9uIE1lbnUuICBUaGlzIG9wdGlvbiBpcyB0aGUgc2FtZSBhcyBvcHRpb24gJmx0O1QmZ3Q7DQogICAgIGZyb20gdGhlIE1haW4gTWVudS4NCg0KJmx0OyEmZ3Q7ICBDaXRhZGVsIEhlbHAuICBEaXNwbGF5IHRoZSBwb3J0aW9uIG9mIHRoZSBkb2N1bWVudGF0aW9uDQogICAgIGRlc2NyaWJpbmcgdGhlIENpdGFkZWwgZnVuY3Rpb25zLg0KDQombHQ7USZndDsgIExlYXZlIHRoZSBDaXRhZGVsLiAgRXhpdCB0aGUgQ2l0YWRlbCBhbmQgcmV0dXJuIHRvIHRoZQ0KICAgICBwbGFuZXQuDQo=') + '</pre>')
    el.append('<br />Citadel treasury contains <span class="ansi-bright-yellow-fg">' + addCommas(data.planet.treasury) + '</span> credits.')
    el.append(citadelPrompt)
  }

  var gameDocs = function() {
    el.html('<pre>' + atob('DQogICAgICAgICAgICAgICAgICAgICBUUkFERSBXQVJTIDIwMDINCiAgICAgICAgICAgICAgICAgICAgICAgIFZlcnNpb24gMw0KDQogICAoQykgQ29weXJpZ2h0IDE5OTAgLSAyMDAwIGJ5IEVwaWMgSW50ZXJhY3RpdmUgU3RyYXRlZ3kNCiBXcml0dGVuIGJ5IEdhcnkgTWFydGluLCBNYXJ5IEFubiBNYXJ0aW4sIGFuZCBKb2huIFByaXRjaGV0dA0KICAgICAgICAgICBDcmVhdGVkIGJ5IEdhcnkgYW5kIE1hcnkgQW5uIE1hcnRpbg0KDQogICAgICAgICAgICAgICAgICAgIFRyYWRlIFdhcnMgU3VwcG9ydA0KDQogICAgICAgICAgICAgICAgIGh0dHA6Ly93d3cuZWlzb25saW5lLmNvbQ0KDQogICAgICAgICAgICAgICAgICAgICAgICAtLS0tLS0tLS0NCg0KVHJhZGUgV2FycyAyMDAyIGNvbWJpbmVzIGFkdmVudHVyZSBhbmQgZXhwbG9yYXRpb24gd2l0aCBzdHJhdGVneQ0KYW5kIGNvb3BlcmF0aXZlIHBsYXkgaW4gYW4gZW50ZXJ0YWluaW5nIGFuZCBleGNpdGluZyBvbi1saW5lDQpnYW1lLiAgWW91IGNvbXBldGUgYWdhaW5zdCBvdGhlciBCQlNlcnMgdG8gYmUgdGhlIG1vc3QgcG93ZXJmdWwNCnRyYWRlciAob3IgY29ycG9yYXRpb24gb2YgdHJhZGVycykgaW4gdGhlIHVuaXZlcnNlLiAgSW5kZXBlbmRlbnQNCnRyYWRlcnMgY2FuIGNvbXBldGUgcXVpdGUgZWZmZWN0aXZlbHkgYWdhaW5zdCBsYXJnZSBjb3Jwb3JhdGlvbnMuDQpDb3Jwb3JhdGUgbWVtYmVycyBjYW4gcGVyZm9ybSBzcGVjaWZpYyBkdXRpZXMgKGFzIGRpcmVjdGVkIGJ5DQp0aGVpciBDLkUuTy4pIGluIHNwZWNpYWxpemVkIHNoaXBzLiAgVHJhZGVycyBjYW4gYmUgImdvb2QgZ3V5cyIgb3INCiJiYWQgZ3V5cyIgd2l0aCBkaWZmZXJlbnQgYXZlbnVlcyBmb3IgYWR2YW5jZW1lbnQuICBUaGUgdW5pdmVyc2UNCmNhbiBiZSBkaWZmZXJlbnQgd2l0aCBlYWNoIG5ldyBnYW1lLiAgVGhlcmUgaXMgbm8gcmlnaHQgb3Igd3JvbmcNCndheSB0byBwbGF5IGFuZCB0aGUgcG9zc2libGUgc3RyYXRlZ2llcyBhcmUgbGltaXRlZCBvbmx5IGJ5IG9uZSdzDQppbWFnaW5hdGlvbi4NCg0KDQpQTEFZSU5HIFRIRSBHQU1FDQoNCldoZW4geW91IGVudGVyIHRoZSBnYW1lLCB5b3Ugd2lsbCBiZSBwaWxvdGluZyBhIE1lcmNoYW50IENydWlzZXIuDQpUaGlzIGlzIGNvbnNpZGVyZWQgdGhlIG1vc3QgdmVyc2F0aWxlIHNoaXAgaW4gdGhlIFRyYWRlIFdhcnMNCmFybWFkYS4gIEluIGl0LCBuZXcgcGxheWVycyBoYXZlIGEgY2hhbmNlIHRvIHRyeSBvdXQgYWxsIGFzcGVjdHMNCm9mIHRoZSBnYW1lLg0KDQpVcG9uIGVudGVyaW5nLCB5b3Ugd2lsbCBiZSBhc2tlZCB3aGF0IGFsaWFzIHlvdSB3b3VsZCBsaWtlIHRvIHVzZQ0KaW4gdGhlIGdhbWUgYW5kIHdoYXQgbmFtZSB5b3Ugd291bGQgbGlrZSB0byBjaHJpc3RlbiB5b3VyIHNoaXAuDQpUaGUgYWxpYXMgeW91IGNob29zZSB3aWxsIGRpc3BsYXkgaW4gdGhlIHBsYXllciBhbmQgY29ycG9yYXRlDQpyYW5raW5ncyBhbmQgaW4gc2V2ZXJhbCBjb3Jwb3JhdGUgbGlzdGluZ3MuICBZb3VyIHNoaXAgbmFtZSB3aWxsDQpiZSB1c2VkIGluIHRoZSBkb2NraW5nIGxvZ3MgYXQgdGhlIHBvcnRzLiAgWW91IGNhbiB1c2UgdGhlc2UNCm5hbWVzIHRvIGJlIGFzIGNvbnNwaWN1b3VzIG9yIGFzIGluY29uc3BpY3VvdXMgYXMgeW91IHdhbnQuDQpJZiB5b3VyIHN5c29wIGhhcyBpdCBjb25maWd1cmVkIHRoaXMgd2F5LCB5b3Ugd2lsbCBhbHNvIGJlDQpnaXZlbiBhIHBlcnNvbmFsIHBsYW5ldCB3aGVuIHlvdSBlbnRlciB0aGUgZ2FtZS4gIFlvdSB3aWxsDQpiZSBhc2tlZCB0byBuYW1lIHRoZSBwbGFuZXQgaGVyZS4gIFlvdSBjYW4gdGhlbiB1c2Ugb3B0aW9uDQombHQ7WSZndDsgWW91ciBQZXJzb25hbCBQbGFuZXRzIGZyb20gdGhlIENvbXB1dGVyIE1lbnUgdG8gbG9jYXRlDQp0aGUgcGxhbmV0Lg0KDQpUaGUgZXF1aXBtZW50IGluIHlvdXIgaW5pdGlhbCBzaGlwIHdpbGwgaW5jbHVkZSBzb21lIGhvbGRzIHRvDQpzdG9yZSB0aGUgY2FyZ28gdGhhdCB5b3UgY2FuIHRyYWRlIGF0IHRoZSBwb3J0cyBmb3VuZCB0aHJvdWdob3V0DQp0aGUgdW5pdmVyc2UuICBUcmFkaW5nIGlzIHRoZSBiYXNpYyB3YXkgdG8gYWR2YW5jZSBpbiB0aGUgZ2FtZS4NCkJ5IGdvb2QgdHJhZGluZywgeW91IGNhbiBnYWluIGV4cGVyaWVuY2UgYXMgd2VsbCBhcyBnYWluIGNyZWRpdHMuDQpUaGUgY3JlZGl0cyB5b3UgZWFybiBjYW4gZnVuZCB5b3VyIG1pbGl0YXJ5IGFuZCBjYW4gcHJvdmlkZSB0aGUNCmNhcGl0YWwgeW91IHdpbGwgbmVlZCB0byBleHBhbmQgeW91ciB0cmFkaW5nIGV4cGVkaXRpb25zLiAgWW91DQp3aWxsIGhhdmUgc29tZSBjcmVkaXRzIHdpdGggd2hpY2ggeW91IGNhbiBwdXJjaGFzZSBzb21lDQpjb21tb2RpdGllcyBmb3IgdHJhZGluZy4gIFlvdSB3aWxsIGFkZGl0aW9uYWxseSBoYXZlIHNvbWUNCmZpZ2h0ZXJzIHRvIG9mZmVyIHNvbWUgcHJvdGVjdGlvbiBhcyB5b3UgYmVnaW4geW91ciB2b3lhZ2UuDQoNClRoZSBnYW1lIHdpbGwgZGlmZmVyIHdpdGggZWFjaCBkaWZmZXJlbnQgZ3JvdXAgb2YgcGxheWVycy4NCkluZGl2aWR1YWwgdHJhZGVycyBhcmUgcmFua2VkIGJ5IHRoZWlyIGV4cGVyaWVuY2UuICBZb3UgZ2Fpbg0KZXhwZXJpZW5jZSBzaW1wbHkgYnkgcGxheWluZyB0aGUgZ2FtZS4gIFRoZSBtb3JlIHRoaW5ncyB5b3UgZG8sDQp0aGUgbW9yZSBleHBlcmllbmNlIHlvdSB3aWxsIGdldC4gIEdvb2QgYW5kIEV2aWwgYXJlIHJlcHJlc2VudGVkDQpieSB0aGUgdGl0bGVzIGVhY2ggcGxheWVyIHJlY2VpdmVzLiAgWW91ciBleHBlcmllbmNlIGNvbWJpbmVkDQp3aXRoIHlvdXIgYWxpZ25tZW50IHdpbGwgZGV0ZXJtaW5lIHdoZXRoZXIgeW91IGFyZSBhIExpZXV0ZW5hbnQNCm9yIGEgRHJlYWQgUGlyYXRlLiAgV2hlbiB5b3UgZG8gc29tZXRoaW5nIHRoYXQgYWZmZWN0cyB5b3VyDQphbGlnbm1lbnQsIHlvdSB3aWxsIGdldCBhIG1lc3NhZ2Ugc2F5aW5nIHlvdXIgYWxpZ25tZW50IHdlbnQgdXANCm9yIGRvd24gYW5kIGJ5IGhvdyBtdWNoLg0KDQpUaGVyZSBhcmUgYmVuZWZpdHMgYW5kIGRyYXdiYWNrcyB3aGV0aGVyIHlvdSBjaG9vc2UgdG8gcGxheSB0aGUNCmdhbWUgYXMgYSBnb29kIHRyYWRlciBvciBhbiBldmlsIHRyYWRlci4gIFRyYWRlcnMgd2hvIGZvbGxvdyB0aGUNCkZlZExhd3MgYXJlIG9mZmVyZWQgcHJvdGVjdGlvbiBpbiBGZWRTcGFjZSB1bnRpbCB0aGV5IGFyZQ0KZXhwZXJpZW5jZWQgZW5vdWdoIHRvIHByb3RlY3QgdGhlbXNlbHZlcy4gIFRyYWRlcnMgd2hvIGFzcGlyZSB0bw0KYmUgdmVyeSBnb29kIGNhbiBiZSBhd2FyZGVkIGEgRmVkZXJhbCBDb21taXNzaW9uLiAgVGhpcyBhbGxvd3MNCnRoZW0gdG8gcHVyY2hhc2UgYW4gSW1wZXJpYWwgU3RhcnNoaXAuICBUaGlzIGlzIG9uZSBvZiB0aGUgbW9zdA0KcG93ZXJmdWwgc2hpcHMgaW4gdGhlIHVuaXZlcnNlLiAgT24gdGhlIG90aGVyIGhhbmQsIHRoZSBldmlsDQp0cmFkZXJzIGFyZSBvZmZlcmVkIHNvbWUgb3B0aW9ucyBpbiB0aGUgVW5kZXJncm91bmQuICBUcmFkZXJzIHdobw0KaGF2ZSBwcm92ZWQgdGhhdCB0aGV5IGFyZSB0cnVseSBldmlsIGNhbiBzdGVhbCBwcm9kdWN0IG9yIG1vbmV5DQpmcm9tIHRoZSBwb3J0cy4NCg0KVEhFIFVOSVZFUlNFDQoNCllvdSB3aWxsIGJlIHRyYXZlbGluZyBpbiBhIHVuaXZlcnNlLCB3aG9zZSBzaXplIHdhcyBkZXRlcm1pbmVkIGJ5DQp5b3VyIFN5c09wLiAgU2VjdG9ycyBtYXkgaGF2ZSBwbGFuZXRzLCBwb3J0cywgb3RoZXIgcGxheWVycywNCmVtcHR5IHNoaXBzLCBhbGllbnMsIEZlcnJlbmdpLCBGZWRlcmF0aW9uIFN0YXJzaGlwcywgbWluZXMsDQptZXNzYWdlIGJlYWNvbnMsIGZpZ2h0ZXJzIChiZWxvbmdpbmcgdG8geW91LCBvdGhlciBwbGF5ZXJzLCByb2d1ZQ0KbWVyY2VuYXJpZXMsIG9yIHRoZSBGZXJyZW5naSkgb3IgdGhlIHNlY3RvcnMgbWF5IGNvbnRhaW4gbm90aGluZw0KYXQgYWxsLiAgSWYgaW4geW91ciB0cmF2ZWxzIHlvdSBjb21lIGFjcm9zcyBzb21ldGhpbmcNCnVuZGVzaXJhYmxlLCB5b3VyIGluaXRpYWwgc2hpcCBjb21lcyBlcXVpcHBlZCB3aXRoIDMwDQpmaWdodGVycyB3aXRoIHdoaWNoIHlvdSBjYW4gZGVmZW5kIHlvdXJzZWxmLg0KDQpNYW55IHBsYXllcnMgZmluZCBpdCB1c2VmdWwgdG8gaGF2ZSBhIGhvbWUgc2VjdG9yIG9yIGdyb3VwIG9mDQpzZWN0b3JzLiAgUGxheWVycywgZXNwZWNpYWxseSB0aG9zZSBqdXN0IGpvaW5pbmcgYSBnYW1lLCBuZWVkIGFuDQpvdXQtb2YtdGhlLXdheSBwbGFjZSB0byBzdGF5IHNvIHRoZXkgY2FuIGJ1aWxkIHVwIHRoZWlyIGFzc2V0cy4NCllvdSBjYW4gZXhwbG9yZSB0aGUgdW5pdmVyc2UgYW5kIGxvb2sgZm9yIGRlYWQgZW5kIHNlY3RvcnMgdG8gdXNlDQphcyBhIGhpZGluZyBwbGFjZS4gIENvcnBvcmF0ZSBiYXNlcyBidWlsdCBpbiB0cmFmZmljIGxhbmVzIGRvIG5vdA0KZmFyZSB0b28gd2VsbCBhbmQgdGhvc2UgaW4gdGhlIG1ham9yIHRob3JvdWdoZmFyZXMgKGluIHRoZSBwYXRocw0KYmV0d2VlbiB0aGUgY2xhc3MgMCBhbmQgY2xhc3MgOSBwb3J0cykganVzdCBkbyBub3Qgc3RhbmQgbXVjaCBvZg0KYSBjaGFuY2UuDQoNClBsYW5ldHMgcGxheSBhIGtleSBwYXJ0IGluIHlvdXIgc3VjY2VzcyBhcyBhIHRyYWRlci4gIFRlcnJhLCB0aGUNCmZpcnN0IHBsYW5ldCB5b3UgZW5jb3VudGVyIGFzIHlvdSBlbnRlciB0aGUgZ2FtZSwgaXMgd2hlcmUgdGhlDQpwZW9wbGUgY2FuIGJlIGZvdW5kIHRvIGNvbG9uaXplIGFsbCBvdGhlciBwbGFuZXRzLiAgUmVtZW1iZXIsIHRoZQ0KZW52aXJvbm1lbnQgb24gc29tZSBwbGFuZXQgdHlwZXMgbWF5IGJlIGhhemFyZG91cyB0byBodW1hbnMuICBUaGUNCm90aGVyIHBsYW5ldHMgaW4gdGhlIGdhbWUgd2lsbCwgaWYgaW5oYWJpdGVkLCBwcm9kdWNlIEZ1ZWwgT3JlLA0KT3JnYW5pY3MsIEVxdWlwbWVudCBhbmQgRmlnaHRlcnMuICBUaGUgYW1vdW50cyBvZiB0aGVzZQ0KY29tbW9kaXRpZXMgcHJvZHVjZWQgd2lsbCBiZSBhZmZlY3RlZCBieSB0aGUgdHlwZSBvZiBwbGFuZXQuICBGb3INCmV4YW1wbGUsIGEgTW91bnRhaW5vdXMgcGxhbmV0IHdpbGwgcHJvdmlkZSBtb3JlIEZ1ZWwgT3JlIHRoYW4gYW4NCk9jZWFuaWMgcGxhbmV0LiAgWW91IGFuZCB0aGUgb3RoZXIgdHJhZGVycyBkZWNpZGUgd2hlcmUgdGhlDQpwbGFuZXRzIHdpbGwgYmUuICBZb3UgY2FuIHB1cmNoYXNlIGEgR2VuZXNpcyBUb3JwZWRvIGFuZCB1c2UgaXQNCmluIGFsbW9zdCBhbnkgc2VjdG9yIGluIHRoZSBnYWxheHkuICBJZiB0aGUgcGxhbmV0IGhhcyBlbm91Z2ggb2YNCnRoZSByZXF1aXJlZCBjb21tb2RpdGllcyBhbmQgZW5vdWdoIHBlb3BsZSB0byBzdXBwbHkgdGhlIGxhYm9yIHRvDQpidWlsZCBpdCwgeW91IGNhbiBiZWdpbiBjb25zdHJ1Y3Rpb24gb2YgYSBDaXRhZGVsLiAgVGhlIENpdGFkZWwNCmNhbiBwcm92aWRlIHlvdSBhbmQgdGhlIG90aGVyIG1lbWJlcnMgb2YgeW91ciBjb3Jwb3JhdGlvbiB3aXRoIGENCnNlY3VyZSBwbGFjZSB0byBkb2NrIHlvdXIgc2hpcHMgYW5kIGRlcG9zaXQgdGhlIGNyZWRpdHMgeW91J3ZlDQplYXJuZWQuICBBcyB5b3UgcHJvZ3Jlc3MgaW4gdGhlIGdhbWUsIHlvdXIgQ2l0YWRlbCBjYW4gYmUNCnVwZ3JhZGVkIHRvIHByb3ZpZGUgYWRkaXRpb25hbCBwcm90ZWN0aW9uIHRvIHlvdSBhbmQgeW91cg0KY29ycG9yYXRpb24uICBJZiB5b3UgZGVjaWRlIHRvIGJ1aWxkIGEgcGxhbmV0IGluIHlvdXIgaG9tZQ0Kc2VjdG9yLCBiZSBzdXJlIHlvdSBjYW4gZGVmZW5kIGl0LiAgQSBwbGFuZXQgaXMgdmVyeSB2dWxuZXJhYmxlDQp1bnRpbCBpdCBoYXMgYSBDb21iYXQgQ29udHJvbCBDb21wdXRlciAobGV2ZWwgMiBDaXRhZGVsKSB0bw0Kc2FmZWd1YXJkIGl0Lg0KDQpUaGVyZSBhcmUgdGVuIGRpZmZlcmVudCB0eXBlcyBvZiBwb3J0cyBzY2F0dGVyZWQgYWJvdXQgdGhlDQp1bml2ZXJzZS4gIFRoZSBwb3J0cyBhcmUgY2xhc3NpZmllZCBieSB0aGUgcHJvZHVjdHMgdGhleSBidXkNCmFuZC9vciBzZWxsLiAgUG9ydCBjbGFzc2VzIDEgdGhyb3VnaCA4IHRyYWRlIHRoZSB0aHJlZSBiYXNpYw0KY29tbW9kaXRpZXM6IEZ1ZWwgT3JlLCBPcmdhbmljcyBhbmQgRXF1aXBtZW50LiAgVGhlIHVuaXZlcnNlIGFsc28NCmNvbnRhaW5zIHNwZWNpYWx0eSBwb3J0cyBmb3IgdGhlIG90aGVyIGl0ZW1zIHlvdSB3aWxsIG5lZWQgdG8NCmFkdmFuY2UgaW4gdGhlIGdhbWUuICBUaGVyZSBhcmUgdGhyZWUgQ2xhc3MgMCBwb3J0cyB3aGVyZSB5b3UgY2FuDQpwdXJjaGFzZSBob2xkcyAoYmVuZWZpY2lhbCBmb3IgbW92aW5nIGNvbG9uaXN0cyB0byB5b3VyIHBsYW5ldHMNCmFzIHdlbGwgYXMgdHJhbnNwb3J0aW5nIGdvb2RzIGZvciB0cmFkZSksIGZpZ2h0ZXJzICh0byBoZWxwDQpwcm90ZWN0IHlvdXIgdGVycml0b3J5KSwgb3Igc2hpZWxkcyAodG8gcHJvdGVjdCB5b3VyIHNoaXAgZnJvbQ0KdGhlIHRyYXBzIGxhaWQgYnkgeW91ciBlbmVtaWVzKS4gICVHTUslVGhlcmUgaXMgb25lIENsYXNzIDkgcG9ydA0KdGhhdCBjb250YWlucyBub3Qgb25seSBhIFRyYWRpbmcgUG9ydCwgYnV0IGFsc28gYSBTdGFyRG9jay4gIFRoZQ0KU3RhckRvY2sgaG91c2VzIHRoZSBTdGVsbGFyIEhhcmR3YXJlIEVtcG9yaXVtLCB0aGUgRmVkZXJhdGlvbg0KU2hpcHlhcmRzLCB0aGUgTG9zdCBUcmFkZXIncyBUYXZlcm4sIHRoZSAybmQgTmF0aW9uYWwgR2FsYWN0aWMNCkJhbmssIHRoZSBWaWRlb24gQ2luZXBsZXggYW5kIHRoZSBJbnRlcnN0ZWxsYXIgU3BhY2UgUG9saWNlDQpIZWFkcXVhcnRlcnMuICBUaGVyZSBhcmUgb3RoZXIgcGxhY2VzIG9mIGludGVyZXN0IGxvY2F0ZWQgaW4gdGhlDQpTdGFyRG9jay4gIFRoZXNlIHBsYWNlcyB5b3Ugd2lsbCBoYXZlIHRvIGRpc2NvdmVyIG9uIHlvdXIgb3duLg0KU29tZSBhcmUgbm90IGFkdmVydGlzZWQgYmVjYXVzZSB0aGV5IGFyZSBlc3RhYmxpc2htZW50cyBvZg0KcXVlc3Rpb25hYmxlIHJlcHV0ZS4gIE90aGVycyBhcmUgRmVkZXJhdGlvbiBidWlsZGluZ3MgdGhhdCBob3VzZQ0KdG9wIHNlY3JldCBnb3Zlcm5tZW50IGluZm9ybWF0aW9uLg0KDQoNClBFT1BMRSBJTiBUSEUgVFJBREUgV0FSUyBVTklWRVJTRQ0KDQpBIGxhcmdlIHBhcnQgb2YgcGxheWluZyBpcyBpbnRlcmFjdGluZyB3aXRoIG90aGVycyBpbiB0aGUgZ2FtZS4NCllvdSBjYW4gbWluZ2xlIHdpdGggb3RoZXIgcGxheWVycyBpbiB0aGUgTG9zdCBUcmFkZXJzIFRhdmVybiwNCmdhbWJsaW5nIGFnYWluc3QgdGhlbSwgY29udmVyc2luZyB3aXRoIHRoZW0sIGxlYXZpbmcNCmFubm91bmNlbWVudHMgYXQgdGhlIGRvb3Igb3Igd3JpdGluZyBhIG1lc3NhZ2Ugb24gdGhlIGJhdGhyb29tDQp3YWxsLiAgWW91IGNhbiBjb21iaW5lIHlvdXIgYXNzZXRzIHdpdGggb3RoZXIgcGxheWVycyBvZiB0aGUgc2FtZQ0KYWxpZ25tZW50IHRvIGZvcm0gYSBDb3Jwb3JhdGlvbi4gIEp1c3QgYmUgYXdhcmUgdGhhdCBtb3JlIHRoYW4NCm9uZSBDb3Jwb3JhdGlvbiBoYXMgYmVlbiBicm91Z2h0IGRvd24gYnkgYSBjb24gbWFuIHdobyB3b3JtZWQgaGlzDQp3YXkgaW50byB0aGUgQ29ycG9yYXRlIHN0cnVjdHVyZS4gIFlvdSBjYW4gaGF2ZSBhIGNoYW5jZQ0KZW5jb3VudGVyIHdpdGggb3RoZXIgY3JlYXR1cmVzIG9mIHRoZSB1bml2ZXJzZSwgYm90aCByZWFsIChvdGhlcg0KdXNlcnMpIGFuZCBOb24tUGxheWVyIENoYXJhY3RlcnMgKHRoZSBGZWRlcmFscywgQWxpZW4gdHJhZGVycyBhbmQNCnRoZSBGZXJyZW5naSkuICBDaGFuY2UgZW5jb3VudGVycyBvZmZlciBtYW55IHBvc3NpYmlsaXRpZXMgYW5kDQpjYW4gYWR2YW5jZSB5b3UgaW4geW91ciBjaG9zZW4gY2FyZWVyIHBhdGguICBZb3VyIGFsaWdubWVudCBhbmQNCmV4cGVyaWVuY2UgYW5kIHRoZSBhbGlnbm1lbnQgYW5kIGV4cGVyaWVuY2Ugb2YgdGhlIGNyZWF0dXJlIHlvdQ0KZW5jb3VudGVyIHdpbGwgZGV0ZXJtaW5lIGp1c3QgaG93IHRoYXQgYWR2YW5jZW1lbnQgaWYgYWZmZWN0ZWQuDQoNCk90aGVyIHRyYWRlcnMgYXJlIHVzZXJzIGp1c3QgbGlrZSB5b3UuICBUaGV5IGhhdmUgYWxpZ25tZW50IGFuZA0KZXhwZXJpZW5jZSBwb2ludHMuICBZb3UgY2FuIHNlZSBhbGwgdGhlIG90aGVycyBieSBMaXN0aW5nIFRyYWRlcnMNCmZyb20geW91ciBzaGlwcyBjb21wdXRlci4gIEJ5IHVzaW5nIHRoZSBsaXN0aW5nLCB5b3UgY2FuIHNlZQ0Kd2hpY2ggcGxheWVycyBhcmUgZ29vZCBhbmQgd2hpY2ggYXJlIGV2aWwuICBZb3UgY2FuIGVzdGltYXRlDQp3aGV0aGVyIHRoZSBvdGhlciBwbGF5ZXIgd291bGQgYmV0dGVyIHNlcnZlIHlvdXIgbmVlZHMgYXMgYW4gYWxseQ0Kb3IgYWR2ZXJzYXJ5Lg0KDQpUaGUgRmVkZXJhdGlvbiBpcyB0aGUgbWFpbiBnb3Zlcm5pbmcgYm9keSBvZiB0aGUgY29zbW9zLiAgWW91DQp3aWxsIG1lZXQgdGhlIEZlZHMgaWYgeW91IGdvIHRvIHRoZSBQb2xpY2UgU3RhdGlvbi4gIFlvdSBtaWdodA0KcnVuIGludG8gdGhlbSBhcyB5b3Ugcm9hbSBhcm91bmQgc3BhY2UuICBUaGUgRmVkcyBkb24ndCBsb29rDQpraW5kbHkgb24gcGxheWVycyB3aG8gYnJlYWsgRmVkTGF3cywgc28gaWYgeW91J3JlIG5vdCBjYXJlZnVsLA0KdGhleSBtaWdodCB2aXNpdCB5b3Ugd2hlbiB5b3UgbGVhc3Qgd2FudCB0aGVpciBjb21wYW55Lg0KDQpBbGllbiB0cmFkZXJzIGFyZSB2aXNpdG9ycyBmcm9tIGFub3RoZXIgdW5pdmVyc2Ugd2hvIGFyZSBsb29raW5nDQpmb3IgYmV0dGVyIHBvcnRzLiAgWW91IGNhbiBnZXQgYSBsaXN0aW5nIG9mIHRoZSBBbGllbnMgc2ltaWxhciB0bw0KdGhlIG9uZSB5b3UgZ2V0IGZvciBvdGhlciB0cmFkZXJzLiAgQWxpZW5zIGFsc28gaGF2ZSBleHBlcmllbmNlDQphbmQgYWxpZ25tZW50LCBidXQgeW91IGNhbm5vdCBmb3JtIGEgQ29ycG9yYXRpb24gd2l0aCB0aGVtLg0KDQpUaGUgRmVycmVuZ2kgYXJlIGEgZ3JlZWR5LCBjb3dhcmRseSBncm91cC4gIFRoZWlyIHByaW1hcnkgcHVycG9zZQ0KaXMgdGhlIHNwZWVkeSBhY3F1aXNpdGlvbiBvZiBtb25leS4gIFRoZXkgd2lsbCBzdGVhbCBmcm9tIGFueW9uZQ0Kbm8gbWF0dGVyIHdoYXQgdGhlIHBlcnNvbidzIG9yIGNvcnBvcmF0aW9uJ3MgYWxpZ25tZW50LiAgVGhleQ0Kc2VsZG9tIGVuZ2FnZSBpbiBmYWNlLXRvLWZhY2UgY29tYmF0IGJlY2F1c2UgdGhleSBwcmVmZXIgdGhlDQphZHZhbnRhZ2Ugb2Ygc3VycHJpc2Ugd2hlbiBhbWJ1c2hpbmcgdGhlaXIgb3Bwb25lbnQuICBUaGV5IG9mdGVuDQp0cmF2ZWwgaW4gZ3JvdXBzIGFuZCB3aWxsIHNweSBvbiBwcm9taXNpbmcgdGVycml0b3J5LiAgQWZ0ZXINCnRhcmdldGluZyBhbiBhcmVhLCB0aGV5IHdpbGwgcmFpZCB0aGUgc2VjdG9yIHdoZW4gaXQgaXMgbGVhc3QNCmRlZmVuZGVkLiAgSWYgdGhleSBhcmUgYXR0YWNrZWQsIHRoYXQgZ3JvdXAgd2lsbCBob2xkIGEgZ3J1ZGdlDQphZ2FpbnN0IHRoZSBhdHRhY2tlciBhbmQgdGhleSB3aWxsIG5vdCByZXN0IHVudGlsIHRoZXkgZmVlbCB0aGUNCnNjb3JlIGhhcyBiZWVuIHNldHRsZWQuDQoNCkV4cGxvcmUgdGhlIHVuaXZlcnNlIGFuZCB0YWtlIHBhcnQgaW4gdGhlIGFkdmVudHVyZS4gIFlvdSBjYW4NCmp1c3QgbG9vayBhcm91bmQgb3IgeW91IGNhbiBiZWNvbWUgYSBkb21pbmFudCBmYWN0b3IuICBNb3N0IG9mDQp0aGUgZGlzcGxheXMgYXJlIGZ1bGx5IGV4cGxhaW5lZC4gIFdoZW4geW91IGFyZSBhc2tlZCB0byBtYWtlIGENCnNlbGVjdGlvbiwgYW55dGhpbmcgZGlzcGxheWVkIGluIGJyYWNrZXRzIFtdLCB3aWxsIGJlIHRoZQ0KZGVmYXVsdC4NCg0KTW9zdCBkaXNwbGF5cyBjYW4gYmUgYWJvcnRlZCBieSBoaXR0aW5nIHRoZSBzcGFjZSBiYXIuDQoNCkdvb2QgVHJhZGluZyBhbmQgR29vZCBMdWNrLg0KDQoNCiAgICAgICAgICAgICAgICAgICAgICAgICAgTUVOVSBPUFRJT05TDQoNCk1BSU4gTUVOVQ0KDQpOYXZpZ2F0aW9uDQoNCiZsdDtEJmd0OyAgUmUtZGlzcGxheSBTZWN0b3IuICBUaGlzIHdpbGwgcmUtZGlzcGxheSB0aGUgaW5mb3JtYXRpb24NCiAgICAgYWJvdXQgdGhlIHNlY3RvciB3aGVyZSB5b3UgYXJlIGN1cnJlbnRseSBsb2NhdGVkLg0KICAgICBJbmZvcm1hdGlvbiBpbmNsdWRlcyBzZWN0b3IgbnVtYmVyIGFuZCBuZWJ1bGFlIG5hbWUsDQogICAgIG1hcmtlciBiZWFjb25zLCBwb3J0IG5hbWUgYW5kIGNsYXNzLCBtaW5lcywgZmlnaHRlcnMsDQogICAgIHBsYW5ldHMgYW5kIGFueSBvdGhlciBzaGlwcy4gIE5leHQgdG8gdGhlIGNsYXNzIHlvdSB3aWxsIHNlZQ0KICAgICB0aHJlZSBsZXR0ZXJzIHNpZ25pZnlpbmcgaG93IHRoZSBwb3J0IHRyYWRlcyBpbiB0aGUNCiAgICAgY29tbW9kaXRpZXMuICBGb3IgZXhhbXBsZSBhIFNTQiB3b3VsZCBpbmRpY2F0ZSB0aGF0IHRoZSBwb3J0DQogICAgIHNlbGxzIEZ1ZWwgT3JlLCBzZWxscyBPcmdhbmljcyBhbmQgYnV5cyBFcXVpcG1lbnQuICBUaGUNCiAgICAgYWRqYWNlbnQgc2VjdG9ycyB3aWxsIGFsc28gYmUgc2hvd24uICBXaXRoIGEgY29sb3IgZGlzcGxheSwNCiAgICAgdGhlIHNlY3RvcnMgeW91IGhhdmUgbm90IHlldCB2aXNpdGVkIHdpbGwgc2hvdyB1cCBpbiByZWQuDQoNCiZsdDtQJmd0OyAgUG9ydCBhbmQgVHJhZGUuICBUaGlzIHdpbGwgYWxsb3cgeW91IHRvIGRvY2sgYXQgdGhlIHBvcnQNCiAgICAgaW4geW91ciBjdXJyZW50IHNlY3Rvci4gIFRoaXMgaXMgdGhlIG9ubHkgd2F5IHRvIHRyYWRlDQogICAgIHlvdXIgY29tbW9kaXRpZXMuICBZb3Ugd2lsbCBoYXZlIHNvbWUgY2hvaWNlcyBmb3Igd2hhdA0KICAgICBhY3Rpb24geW91IHdvdWxkIGxpa2UgdG8gdGFrZSBhdCB0aGUgcG9ydC4gIE1vc3Qgb2YgdGhlDQogICAgIGNob2ljZXMgYXJlIHNlbGYtZXhwbGFuYXRvcnkuICBJZiB5b3UgYXJlIHBsYXlpbmcgdGhlIGdhbWUNCiAgICAgYXMgYW4gZXZpbCB0cmFkZXIsIHRoZSBjaG9pY2VzIHlvdSBzZWUgd2lsbCBiZSBkaWZmZXJlbnQgdGhhbg0KICAgICB0aGV5IHdvdWxkIGJlIGlmIHlvdSB3ZXJlIHBsYXlpbmcgdGhlIGdhbWUgYXMgYSBsYXdmdWwgUGxheWVyLg0KICAgICBXaGVuIHlvdSBkb2NrIGF0IHRoZSBwb3J0LCB5b3Ugd2lsbCBiZSBhYmxlIHRvIHNlZSB0aGUgZG9ja2luZw0KICAgICBsb2cuICBUaGlzIHdpbGwgc2hvdyB5b3UgdGhlIG5hbWUgb2YgdGhlIGxhc3Qgc2hpcCB0byBkbyBidXNpbmVzcw0KICAgICB0aGVyZS4gIElmIHRoZXJlIGlzIGEgcGxhbmV0IGluIHRoZSBzZWN0b3Igd2l0aCB0aGlzIHBvcnQsIHlvdQ0KICAgICB3aWxsIGJlIGFibGUgdG8gbmVnb3RpYXRlIGEgUGxhbmV0YXJ5IFRyYWRlIEFncmVlbWVudC4gIFRoaXMgaXMgYQ0KICAgICB0cmFkZSBjb250cmFjdCB0aGF0IHdpbGwgYWxsb3cgeW91IHRvIHRyYWRlIG9mZiBhbGwgeW91ciBleGNlc3MNCiAgICAgY29tbW9kaXRpZXMgdG8gdGhlIHBvcnQgd2l0aG91dCB3YXN0aW5nIHlvdXIgdHVybnMgaGF1bGluZyBvbmUNCiAgICAgc2hpcGxvYWQgYXQgYSB0aW1lLiAgSWYgeW91IHdhbnQgdG8gYnVpbGQgYSBuZXcgU3RhcnBvcnQgYW5kIHRoZQ0KICAgICB1bml2ZXJzZSBpcyBmdWxsIG9yIGlmIHlvdSBkZWNpZGUgdGhhdCB5b3VyIGFkdmVyc2FyaWVzIGhhdmUgdG9vDQogICAgIGJpZyBhbiBhZHZhbnRhZ2UgYW5kIHlvdSBuZWVkIHRvIGdldCByaWQgb2YgdGhhdCBwb3J0IHRoZXkgaGF2ZQ0KICAgICBiZWVuIHVzaW5nLCB5b3UgY2FuIGF0dGFjayBhbmQgZGVzdHJveSBhIHN0YXJwb3J0LiAgVGhpcyBpcyBuZXZlcg0KICAgICBhbiBlYXN5IHRhc2suICBUaGUgc3RhcnBvcnRzIGFyZSB2ZXJ5IGhlYXZpbHkgYXJtZWQgYW5kIHdpbGwNCiAgICAgcmV0YWxpYXRlLCBzbyB5b3Ugd2lsbCBuZWVkIHRvIGhhdmUgcGxlbnR5IG9mIG1pbGl0YXJ5IGZvcmNlcw0KICAgICB3aXRoIHlvdSBpZiB5b3UgZGVjaWRlIHRvIHByb2NlZWQgd2l0aCB0aGlzIHNlbGVjdGlvbi4NCg0KJmx0O00mZ3Q7ICBNb3ZlIHRvIGEgU2VjdG9yLiAgVGhlIHNlY3RvcnMgYWRqYWNlbnQgdG8geW91ciBjdXJyZW50DQogICAgIGxvY2F0aW9uIHdpbGwgYmUgbGlzdGVkIGFzIHdhcnAgbGFuZXMgaW4gdGhlIHNlY3Rvcg0KICAgICBkaXNwbGF5LiAgWW91IGNhbiBtb3ZlIHRvIG9uZSBvZiB0aGVtLCBvciB5b3UgY2FuIGNob29zZQ0KICAgICBhbnkgb3RoZXIgc2VjdG9yIGluIHRoZSB1bml2ZXJzZS4gIElmIHlvdSBkZXNpZ25hdGUgYQ0KICAgICBzZWN0b3IgdGhhdCBkb2Vzbid0IGhhdmUgYSBkaXJlY3Qgd2FycCBsYW5lLCB5b3VyIHNoaXAncw0KICAgICBjb21wdXRlciB3aWxsIHBsb3QgeW91ciBjb3Vyc2UsIHNob3cgdGhlIHBhdGggYW5kIHRoZSBudW1iZXINCiAgICAgb2YgaG9wcyAoYW5kIHR1cm5zKSB0aGUgdHJpcCB3aWxsIHVzZSwgYW5kIGFzayB5b3UgaWYgeW91DQogICAgIHdhbnQgdG8gZW5nYWdlIHlvdXIgQXV0b1BpbG90LiAgWW91IHdpbGwgYmUgYWJsZSB0byB1c2UgdGhlDQogICAgIEF1dG9waWxvdCBpbiB0aHJlZSBkaWZmZXJlbnQgbW9kZXMuICBUaGUgZGVmYXVsdCBpcyBBbGVydA0KICAgICBtb2RlLiAgVGhpcyB3aWxsIHN1c3BlbmQgeW91ciB0cmF2ZWwgaW4gYW55IHNlY3RvciB3aGVyZQ0KICAgICB0aGVyZSBpcyBhIHBsYW5ldCwgcG9ydCwgbmF2YWdhdGlvbmFsIGhhemFyZCBvciBvdGhlcg0KICAgICB0cmFkZXIuICBPbmNlIGFsZXJ0ZWQgdG8gb25lIG9mIHRoZXNlIGl0ZW1zLCB5b3Ugd2lsbCBiZQ0KICAgICBnaXZlbiBzZXZlcmFsIG9wdGlvbnMuICBJdCBpcyB1cCB0byB5b3UgdG8gbWFrZSB0aGUgZGVjaXNpb24NCiAgICAgdGhhdCB3aWxsIGJlc3Qgc2VydmUgeW91IG9yIHlvdXIgY29ycG9yYXRpb24uICBUaGUgc2Vjb25kDQogICAgIG1vZGUgaXMgRXhwcmVzcy4gIFRoaXMgc3BlZWRzIHlvdSB0byB5b3VyIGRlc3RpbmF0aW9uDQogICAgIHByb3ZpZGVkIHRoZXJlIGFyZSBubyBlbmVteSBmb3JjZXMgaW4geW91ciBwYXRoLiAgVGhlIHRoaXJkDQogICAgIG1vZGUgaXMgU2luZ2xlIFN0ZXAuICBUaGlzIHdhcyBkZXZlbG9wZWQgYnkgYW4gZW50ZXJwcmlzaW5nDQogICAgIGdyb3VwIG9mIHBpb25lZXJzLiAgVGhlaXIgZ3JvdXAgd2FzIGdldHRpbmcgc21hbGxlciBkdWUgdG8NCiAgICAgYm9sZCBleHBsb3JhdGlvbiBvZiBzZWN0b3JzIGZpbGxlZCB3aXRoIG1pbmVzLCBzbyB0aGUNCiAgICAgc3Vydml2b3JzIG1hbnVmYWN0dXJlZCBhbiBBdXRvcGlsb3QgdGhhdCB3b3VsZCBzdG9wIGluIGVhY2gNCiAgICAgc2VjdG9yLiAgVGhpcyBhbGxvd2VkIHRoZW0gdG8gc2NhbiB0aGUgbmV4dCBzZWN0b3IgZm9yDQogICAgIGhhemFyZHMgYmVmb3JlIHByb2NlZWRpbmcgaW50byBpdC4gIFNlbGVjdCB0aGlzIG9wdGlvbiBpZg0KICAgICB5b3UgZmVlbCB0aGUgbmVlZCBmb3IgY2F1dGlvbi4NCg0KJmx0O0wmZ3Q7ICBMYW5kIG9uIGEgUGxhbmV0LiAgVGhpcyBvcHRpb24gd2lsbCBlbmFibGUgeW91IHRvIGNvbG9uaXplDQogICAgIHlvdXIgcGxhbmV0cywgYnVpbGQgYSBDaXRhZGVsIGFuZCBkbyBidXNpbmVzcyB0aGVyZSwgcGljayB1cA0KICAgICB0aGUgZmlnaHRlcnMgYnVpbHQgYnkgeW91ciBjb2xvbmlzdHMgb3IgcGljayB1cCB0aGUNCiAgICAgcHJvZHVjdGlvbiBvZiBGdWVsIE9yZSwgT3JnYW5pY3MgYW5kL29yIEVxdWlwbWVudC4gIFlvdSB3aWxsDQogICAgIHNlZSBhIGxpc3Qgb2YgYWxsIHRoZSBwbGFuZXRzLiAgU2ltcGx5IGVudGVyIHRoZSBudW1iZXIgZm9yDQogICAgIHRoZSBvbmUgeW91IHdhbnQgdG8gdmlzaXQuICBJZiB5b3UgaGF2ZSBwdXJjaGFzZWQgYSBQbGFuZXQNCiAgICAgU2Nhbm5lciBhdCB0aGUgSGFyZHdhcmUgRW1wb3JpdW0sIGl0IHdpbGwgYXV0b21hdGljYWxseQ0KICAgICBwcm92aWRlIHlvdSB3aXRoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHBsYW5ldC4NCiAgICAgVGhlIFBsYW5ldCBTY2FubmVyIHdpbGwgYWxzbyBhbGxvdyB5b3UgdG8gYWJvcnQgdGhlIGxhbmRpbmcNCiAgICAgcHJvY2VkdXJlIGlmLCBhZnRlciBsb29raW5nIGF0IHRoZSBkZWZlbnNlcywgeW91IGZlZWwgeW91DQogICAgIG1heSBub3QgYmUgYWJsZSB0byBsYW5kIHN1Y2Nlc3NmdWxseS4gIFRoZSBkaXNwbGF5LCBvbmNlIHlvdQ0KICAgICBoYXZlIGxhbmRlZCwgc2hvd3MgdGhlIHBsYW5ldCBudW1iZXIsIGxvY2F0aW9uLCBuYW1lLCBjbGFzcw0KICAgICBhbmQgYSBjaGFydCBkZXRhaWxpbmcgdGhlIGNvbW1vZGl0aWVzLCBwcm9kdWN0aW9uDQogICAgIHJlcXVpcmVtZW50cyBhbmQgY3VycmVudCBpbnZlbnRvcmllcy4gIFlvdSB3aWxsIGFsc28gc2VlIHRoZQ0KICAgICBjaXRhZGVsIGluZm9ybWF0aW9uIGFuZCBhbnkgcGxhbmV0YXJ5IGRlZmVuc2VzLg0KDQombHQ7UyZndDsgIExvbmcgUmFuZ2UgU2Nhbi4gIElmIHlvdSBoYXZlIHB1cmNoYXNlZCBhIHNjYW5uZXIgZnJvbSB0aGUNCiAgICAgSGFyZHdhcmUgRW1wb3JpdW0sIHlvdSBjYW4gdXNlIGl0IHRvIHZpZXcgYWRqYWNlbnQgc2VjdG9ycy4NCiAgICAgQWxsIHRoaW5ncyBpbiB0aGUgVHJhZGUgV2FycyB1bml2ZXJzZSBoYXZlIGEgZGVuc2l0eSB2YWx1ZQ0KICAgICBhbmQgeW91IGNhbiB1c2UgeW91ciBEZW5zaXR5IFNjYW5uZXIgdG8gZGlzcGxheSB0aGUgcmVsYXRpdmUNCiAgICAgZGVuc2l0eSBvZiB0aGUgbmVpZ2hib3Jpbmcgc2VjdG9ycyBhbmQgZGV0ZXJtaW5lIGlmIHRoZXJlDQogICAgIGFyZSBhbnkgTmF2YWdhdGlvbmFsIEhhemFyZHMuICBZb3Ugd2lsbCBhbHNvIGJlIHdhcm5lZCBvZg0KICAgICBhbnkgbm9uLXN0YW5kYXJkLCB1bmRlZmluYWJsZSBtYXNzLiAgWW91IGNhbiB0aGVuIHVzZSB0aGF0DQogICAgIGluZm9ybWF0aW9uIHRvIGRldGVybWluZSB3aGF0J3MgbmV4dCBkb29yLiAgSWYgeW91IGhhdmUgYQ0KICAgICBIb2xvZ3JhcGhpYyBTY2FubmVyLCB5b3Ugd2lsbCBiZSBhYmxlIHRvIHNlZSBwb3J0cywgcGxhbmV0cywNCiAgICAgaGF6YXJkcyBhbmQgb3RoZXIgcGxheWVycyBhbGwgZm9yIGp1c3QgdGhlIGNvc3Qgb2Ygb25lIHR1cm4uDQoNCiZsdDtSJmd0OyAgUmVsZWFzZSBCZWFjb24uICBDaG9vc2UgdGhpcyB3aGVuIHlvdSB3YW50IHRvIGxhdW5jaCBvbmUNCiAgICAgb2YgdGhlIE1hcmtlciBCZWFjb25zIHlvdSBwdXJjaGFzZWQgYXQgdGhlIEhhcmR3YXJlDQogICAgIEVtcG9yaXVtLiAgWW91IHdpbGwgbmVlZCB0byBkZWNpZGUgd2hhdCBtZXNzYWdlIHlvdXINCiAgICAgYmVhY29uIHdpbGwgc2VuZCB3aGVuIHlvdSBsYXVuY2ggaXQuIChMaW1pdCA0MSBjaGFyYWN0ZXJzKQ0KDQombHQ7VyZndDsgIFRvdyBTcGFjZUNyYWZ0LiAgVGhpcyBvcHRpb24gbGV0cyB5b3UgdG9nZ2xlIHlvdXIgdHJhY3Rvcg0KICAgICBiZWFtIG9uIGFuZCBvZmYuICBUaGUgY29tcHV0ZXIgd2lsbCBhc2sgeW91IHdoaWNoIHRyYWRlciBpbg0KICAgICB5b3VyIGN1cnJlbnQgc2VjdG9yIHlvdSB3aXNoIHRvIHRvdy4gIFlvdSBjYW4gdG93IGFuDQogICAgIHVubWFubmVkIHNoaXAgb25seSBpZiB5b3Ugb3duIHRoZSBzaGlwIGFuZCBrbm93IHRoZSBzaGlwJ3MNCiAgICAgcGFzc3dvcmQuICBUaGUgY29tcHV0ZXIgd2lsbCB0aGVuIGNhbGN1bGF0ZSAodXNpbmcgdGhlIHNpemUNCiAgICAgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSB0d28gc2hpcHMpIHRoZSBudW1iZXIgb2YgdHVybnMgeW91DQogICAgIHdpbGwgdXNlIGZvciBlYWNoIHNlY3RvciB5b3UgdG93IHRoaXMgdHJhZGVyIGFuZCBoaXMvaGVyDQogICAgIHNoaXAuICBZb3UgY2FuIHRoZW4gdXNlIHRoZSBNb3ZlIG9wdGlvbiB0byBnbyB0byBhbiBhZGphY2VudA0KICAgICBzZWN0b3Igb3IgeW91IGNhbiBlbmdhZ2UgeW91ciBBdXRvUGlsb3QgdG8gbW92ZSB5b3UgYW5kIHlvdXINCiAgICAgInBhc3NlbmdlciIuICBUeXBlIDEgVHJhbnNXYXJwIGRyaXZlcyB3ZXJlIG5vdCBtYWRlIHRvIGJlIHVzZWQNCiAgICAgaW4gY29uanVuY3Rpb24gd2l0aCB0cmFjdG9yIGJlYW1zLCBzbyBpZiB5b3UgdXNlIHlvdXIgVHlwZSAxDQogICAgIFRyYW5zV2FycCwgdGhlIHRyYWN0b3IgYmVhbSB3aWxsIGF1dG9tYXRpY2FsbHkgc2h1dCBkb3duLg0KICAgICBUeXBlIDIgVHJhbnNXYXJwIGRyaXZlcyBjYW4gYmUgdXNlZCB3aXRoIGEgc2hpcCBpbiB0b3cuDQogICAgIFRoZSBwZXJzb24geW91IGFyZSB0b3dpbmcgd2lsbCBub3QgZW50ZXIgYSBzZWN0b3IgdW50aWwgeW91DQogICAgIGhhdmUgc2FmZWx5IGVudGVyZWQuICBUaGUgdHJhY3RvciBiZWFtIHdpbGwgYWN0IGFzIGENCiAgICAgcHJvdGVjdGl2ZSBzaGllbGQgYW5kIHdpbGwgc2FmZWd1YXJkIHRoZSB0b3dlZSBmcm9tIGFueQ0KICAgICBkYW1hZ2UgZnJvbSBtaW5lcywgb2ZmZW5zaXZlIGZpZ2h0ZXJzIG9yIFF1YXNhciBjYW5ub25zLiAgSWYNCiAgICAgeW91ciBzaGlwIGlzIGRlc3Ryb3llZCwgdGhlIHRyYWN0b3IgYmVhbSB3aWxsIGFsc28gYmUNCiAgICAgZGVzdHJveWVkIGFuZCB0aGUgcGVyc29uIHlvdSBhcmUgdG93aW5nIHdpbGwgYmUgbGVmdA0KICAgICBzdHJhbmRlZC4gIFRvIGRpc2VuZ2FnZSB0aGUgYmVhbSBhdCBhbnkgcG9pbnQsIHVzZSB0aGlzDQogICAgIG9wdGlvbiBhZ2Fpbi4NCg0KJmx0O04mZ3Q7ICBNb3ZlIHRvIE5hdlBvaW50LiAgTmF2aWdhdGlvbiBQb2ludHMgYXJlIHNlY3RvcnMgb2YgcGFydGljdWxhcg0KICAgICByZWxldmFuY2UgdG8geW91IG9yIHlvdXIgY29ycG9yYXRpb24uICBUaGV5IGFyZSBhc3NpZ25lZCBmcm9tDQogICAgIHRoZSBtYWluIG1lbnUgd2l0aCB0aGUgIiZsdDtZJmd0OyBTZXQgTmF2UG9pbnRzIiBvcHRpb24uICBBbGwgTmF2IHVuaXRzDQogICAgIGFyZSBwcmUtcHJvZ3JhbW1lZCB3aXRoIGluZm8gb24gU2VjdG9yIDEgKFRlcnJhKSwgYW5kIChpZiB0aGUNCiAgICAgc3lzb3Agd2lzaGVzKSBTdGFyRG9jayBTZWN0b3IsIGFuZCB0aGVyZSBhcmUgZm91ciBvdGhlciBkZWZpbmFibGUNCiAgICAgcG9pbnRzLiAgTmF2aWdhdGlvbiBpbmZvIGlzIGF2YWlsYWJsZSBvbiBhbnkgc2VjdG9yIGluIEZlZFNwYWNlLA0KICAgICBvciBhbnkgc2VjdG9yIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgb2YgeW91ciBmaWdodGVycy4gIFRoaXMgaW5mbw0KICAgICBpbmNsdWRlcyBhbnkgcGxhbmV0IG9yIHBvcnQgZGV0YWlscyBmb3IgdGhhdCBzZWN0b3IuDQoNCkNvbXB1dGVyIGFuZCBJbmZvcm1hdGlvbg0KDQombHQ7QyZndDsgIE9uYm9hcmQgQ29tcHV0ZXIuICBUaGlzIGNvbW1hbmQgd2lsbCBhY3RpdmF0ZSB5b3VyIG9uLWJvYXJkDQogICAgIGNvbXB1dGVyLg0KDQombHQ7WCZndDsgIFRyYW5zcG9ydGVyIFBhZC4gIFRoZSBkaXNwbGF5IHdpbGwgc2hvdyB0aGUgdHJhbnNwb3J0IHJhbmdlDQogICAgIG9mIHlvdXIgc2hpcCBhbmQgYSBsaXN0IG9mIHNoaXBzIGFuZCB0aGVpciBsb2NhdGlvbnMgdG8NCiAgICAgd2hpY2ggeW91IGNhbiBiZWFtIHlvdXJzZWxmLiAgTWFrZSBzdXJlIHlvdSBrbm93IHRoZQ0KICAgICBwYXNzd29yZCENCg0KJmx0O0kmZ3Q7ICBTaGlwIEluZm9ybWF0aW9uLiAgVGhpcyB3aWxsIGRpc3BsYXkgeW91ciBzdGF0aXN0aWNzLg0KDQogICAgIFRyYWRlciBOYW1lLi4uLi4uWW91ciBhbGlhcyBpbiB0aGUgZ2FtZQ0KICAgICBSYW5rIGFuZCBFeHAuLi4uLlRoZSBleHBlcmllbmNlIHBvaW50cyB5b3UgaGF2ZQ0KICAgICAgICAgICAgICAgICAgICAgIGFjY3VtdWxhdGVkLCB0aGUgbnVtYmVyIG9mIGFsaWdubWVudA0KICAgICAgICAgICAgICAgICAgICAgIHBvaW50cyB5b3UgaGF2ZSBhY2N1bXVsYXRlZCBhbmQgdGhlDQogICAgICAgICAgICAgICAgICAgICAgdGl0bGUgeW91IGhhdmUgcmVjZWl2ZWQNCiAgICAgVGltZXMgQmxvd24gVXAuLi5UaGUgbnVtYmVyIG9mIHRpbWVzIHlvdXIgc2hpcCBoYXMgYmVlbg0KICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3llZA0KICAgICBTaGlwIE5hbWUuLi4uLi4uLlRoZSBuYW1lIG9mIHRoZSBzaGlwIHlvdSBhcmUgbm93IHVzaW5nDQogICAgIFNoaXAgSW5mby4uLi4uLi4uTWFudWZhY3R1cmVyIGFuZCBtb2RlbA0KICAgICAgICAgICAgICAgICAgICAgIFBvcnRlZCA9IFRoZSBudW1iZXIgb2YgdGltZXMgdGhpcyBzaGlwDQogICAgICAgICAgICAgICAgICAgICAgaGFzIGRvY2tlZCBhdCBhIFRyYWRpbmcgUG9ydA0KICAgICAgICAgICAgICAgICAgICAgIEtpbGxzID0gTnVtYmVyIG9mIG90aGVyIHBsYXllcidzIHNoaXBzDQogICAgICAgICAgICAgICAgICAgICAgZGVzdHJveWVkIGJ5IHRoaXMgc2hpcA0KICAgICBUdXJucyB0byBXYXJwLi4uLkhvdyBtYW55IHR1cm5zIHVzZWQgdG8gbW92ZSB0aGlzIHNoaXANCiAgICAgICAgICAgICAgICAgICAgICBvbmUgc2VjdG9yDQogICAgIERhdGUgQnVpbHQuLi4uLi4uVGhlIGRhdGUgdGhpcyBzaGlwIHdhcyBwdXJjaGFzZWQNCiAgICAgQ3VycmVudCBTZWN0b3IuLi5Zb3VyIGN1cnJlbnQgbG9jYXRpb24NCiAgICAgVHVybnMgdG8gV2FycC4uLi5UaGUgbnVtYmVyIG9mIHR1cm5zIHlvdSB3aWxsIHVzZQ0KICAgICAgICAgICAgICAgICAgICAgIG1vdmluZyB0aGlzIHNoaXAgdG8gYW4gYWRqYWNlbnQgc2VjdG9yDQogICAgIFR1cm5zIExlZnQuLi4uLi4uTnVtYmVyIG9mIHR1cm5zIHJlbWFpbmluZyBmb3IgdGhpcw0KICAgICAgICAgICAgICAgICAgICAgIHNoaXANCiAgICAgVG90YWwgSG9sZHMuLi4uLi5OdW1iZXIgb2YgaG9sZHMgdGhpcyBzaGlwIGlzIGNhcnJ5aW5nDQogICAgICAgICAgICAgICAgICAgICAgKFRoaXMgZGlzcGxheSBhbHNvIHNob3dzIHRoZSBicmVha2Rvd24NCiAgICAgICAgICAgICAgICAgICAgICAgb2YgdGhlIGNhcmdvIGluIHRoZSBob2xkcykNCiAgICAgQWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbmNsdWRlcyBhbGwgdGhlIHNwZWNpYWwgZXF1aXBtZW50DQogICAgIHlvdXIgc2hpcCBoYXMgYW5kIHRoZSBudW1iZXIgb2YgY3JlZGl0cyB5b3UgaGF2ZSBvbiB5b3VyDQogICAgIHNoaXAuDQoNCiZsdDtUJmd0OyAgQ29ycG9yYXRlIE1lbnUuICBUaGlzIHdpbGwgZ2l2ZSB5b3UgaW5mb3JtYXRpb24gYWJvdXQgYWxsDQogICAgIHRoZSBjb3Jwb3JhdGlvbnMgaW4gdGhlIGdhbWUuDQoNCiZsdDtVJmd0OyAgVXNlIEdlbmVzaXMgVG9ycGVkby4gIElmIHlvdSBhcmUgY2FycnlpbmcgYSBHZW5lc2lzDQogICAgIFRvcnBlZG8sIHlvdSB3aWxsIGJlIGFibGUgdG8gZGV0b25hdGUgaXQgYW5kIGNyZWF0ZSBvbmUgb2YNCiAgICAgdGhlIHNldmVyYWwgdHlwZXMgb2YgcGxhbmV0cyB1c2luZyB0aGlzIGNvbW1hbmQuICBUaGVzZSB3aWxsDQogICAgIGNyZWF0ZSB5b3VyIG5ldyB3b3JsZCBxdWlja2x5LiAgWW91IHdpbGwgYmUgYWR2aXNlZCBvZiB0aGUNCiAgICAgcGxhbmV0IHR5cGUgYmVmb3JlIHlvdSBoYXZlIHRvIG5hbWUgaXQgc28geW91IGNhbiBhc3NpZ24gYW4NCiAgICAgYXBwcm9wcmlhdGUgbmFtZS4NCg0KJmx0O0omZ3Q7ICBKZXR0aXNvbiBDYXJnby4gIElmIHlvdXIgaG9sZHMgYXJlIGZ1bGwgb2Ygc29tZSBjYXJnbyB5b3UNCiAgICAganVzdCBjYW4ndCB1bmxvYWQgb24gYW55IG5lYXJieSBwb3J0IG9yIHBsYW5ldCwgeW91IG1heQ0KICAgICB1c2UgdGhpcyBzZWxlY3Rpb24gdG8gdW5jZXJlbW9uaW91c2x5IGR1bXAgeW91ciBob2xkcw0KICAgICBpbnRvIHNwYWNlLiAgUmVtZW1iZXIgdGhhdCBGZWRMYXcgcHJvaGliaXRzIGxpdHRlcmluZyBpbg0KICAgICBGZWRTcGFjZS4gIER1bXBpbmcgaG9sZHMgZmlsbGVkIHdpdGggY29sb25pc3RzIHdpbGwgbGVhdmUNCiAgICAgYSBuZWdhdGl2ZSBpbXByZXNzaW9uIG9uIHlvdXIgYWxpZ25tZW50Lg0KDQombHQ7QiZndDsgIEludGVyZGljdCBDb250cm9sLiAgSWYgeW91IGFyZSBwaWxvdGluZyBhbiBJbnRlcmRpY3Rvcg0KICAgICBDcnVpc2VyLCB1c2UgdGhpcyBvcHRpb24gdG8gc2V0IHRoZSBnZW5lcmF0b3IgcG93ZXJpbmcgdGhlDQogICAgIEludGVyZGljdG9yIG9uIG9yIG9mZi4gIElmIGl0IGlzIG9uLCBhbiBlbmVteSB3aWxsIG5vdCBiZQ0KICAgICBhYmxlIHRvIHdhcnAgb3V0IG9mIHRoZSBzZWN0b3IgZHVyaW5nIGFuIGF0dGFjay4NCg0KVGFjdGljYWwNCg0KJmx0O0EmZ3Q7ICBBdHRhY2sgRW5lbXkgU3BhY2VDcmFmdC4gIFdoZW4geW91IGVuY291bnRlciBhbiBvcHBvbmVudCwNCiAgICAgb3RoZXIgY3JlYXR1cmUgb3IgdW5tYW5uZWQgc2hpcCBpbiBhIHNlY3RvciB5b3UgaGF2ZSB0aGUNCiAgICAgb3B0aW9uIG9mIGdvaW5nIG9uIHRoZSBvZmZlbnNlIGFuZCBhdHRhY2tpbmcuICBUaGUNCiAgICAgY29udHJvbGxlciB3aWxsIGFzayB5b3UgaG93IG1hbnkgb2YgeW91ciBmaWdodGVycyB5b3Ugd2FudA0KICAgICB0byB1c2UgaW4gdGhlIGF0dGFjay4gIFdoZW4geW91IGFyZSBtdWNoIHN0cm9uZ2VyIHRoYW4geW91cg0KICAgICBvcHBvbmVudCwgdGhlcmUgaXMgYSBjaGFuY2UgdGhhdCB0aGUgb3Bwb25lbnQgd2lsbCB3YXJwIG91dA0KICAgICBvZiB0aGUgc2VjdG9yLiAgSWYgeW91IGFyZSB2ZXJ5IGNhcmVmdWwgd2l0aCB0aGUgYW1vdW50IG9mDQogICAgIGZpcmVwb3dlciB5b3UgdXNlIGluIHlvdXIgYXR0YWNrLCB0aGVyZSBtYXkgYmUgc2lnbmlmaWNhbnQNCiAgICAgc2FsdmFnZSBhdmFpbGFibGUgYWZ0ZXIgeW91IHdpbi4gIEF0dGFja2luZyBvdGhlcnMgY2FuIChhbmQNCiAgICAgcHJvYmFibHkgd2lsbCkgYWZmZWN0IHlvdXIgYWxpZ25tZW50LiAgSWYgeW91IGF0dGFjayBhDQogICAgIHBpcmF0ZSBvciBrbm93biB0ZXJyb3IgeW91IHdpbGwgZ2V0IGdvb2QgcG9pbnRzLiAgT24gdGhlDQogICAgIG90aGVyIGhhbmQsIGlmIHlvdSBkZWNpZGUgdG8gcGljayBvbiBzb21lIGdvb2Qgc291bCB5b3Ugd2lsbA0KICAgICBnbyBkb3duIHRoZSBsYWRkZXIgb2YgcmlnaHRlb3VzbmVzcy4NCg0KJmx0O0UmZ3Q7ICBVc2UgU3Vic3BhY2UgRXRoZXIgUHJvYmUuICBMYXVuY2ggdGhlIFByb2JlIHlvdSBwdXJjaGFzZWQgYXQNCiAgICAgdGhlIEhhcmR3YXJlIEVtcG9yaXVtLiAgU2VuZCB0aGUgdW5tYW5uZWQgc3B5IG9mZiB0byBpdHMNCiAgICAgZGVzdGluYXRpb24gc2VuZGluZyBpbmZvcm1hdGlvbiBiYWNrIHRvIHlvdSBmcm9tIGV2ZXJ5DQogICAgIHNlY3RvciBpdCBwYXNzZXMgdGhyb3VnaC4gIFJlbWVtYmVyIHRoYXQgdGhpcyBkZXZpY2UgaGFzDQogICAgIG5vIGRlZmVuc2l2ZSBjYXBhYmlsaXRpZXMgc28gaWYgaXQgZW5jb3VudGVycyBhbnkgZW5lbXkNCiAgICAgZmlnaHRlcnMsIGl0IHdpbGwgYmUgZGVzdHJveWVkLg0KDQombHQ7RiZndDsgIFRha2Ugb3IgTGVhdmUgRmlnaHRlcnMuICBUaGlzIGVuYWJsZXMgeW91IHRvIGRlcGxveSB5b3VyDQogICAgIGZpZ2h0ZXJzLiAgWW91IHdpbGwgaGF2ZSBzZXZlcmFsIG9wdGlvbnMgc28geW91IGNhbg0KICAgICBjdXN0b21pemUgeW91ciBkZWZlbnNlcy4gIFlvdSBjYW4gbGVhdmUgZmlnaHRlcnMgYXMNCiAgICAgZWl0aGVyIFBlcnNvbmFsIHNvIHRoZXkgcmVjb2duaXplIG9ubHkgeW91IGFzIGFuIGFsbHkgb3INCiAgICAgeW91IGNhbiBsZWF2ZSB0aGVtIGFzIENvcnBvcmF0ZSBzbyBhbnkgbWVtYmVyIG9mIHlvdXINCiAgICAgY29ycG9yYXRpb24gd2lsbCBiZSB0cmVhdGVkIHdpdGggcmVzcGVjdC4gIEZpZ2h0ZXJzIGNhbg0KICAgICBiZSBPZmZlbnNpdmUsIERlZmVuc2l2ZSBvciBUb2xsLiAgRGVmZW5zaXZlIGZpZ2h0ZXJzDQogICAgIGRlZmVuZCB5b3VyIHRlcnJpdG9yeS4gIFRoZXkgYmFyIG9wcG9uZW50cyBmcm9tIGVudGVyaW5nDQogICAgIGEgc2VjdG9yIGFuZCB3aWxsIGZpZ2h0IHdoZW4gYXR0YWNrZWQuICBPZmZlbnNpdmUNCiAgICAgZmlnaHRlcnMgd2lsbCBzZW5kIG91dCBhbiBhdHRhY2sgZ3JvdXAgb24gYW55IHBvb3Igc291bA0KICAgICB3aG8gaGFwcGVucyBpbnRvIHRoZWlyIHNlY3Rvci4gIFRoZSBzaXplIG9mIHRoZSBhdHRhY2sNCiAgICAgZ3JvdXAgZGVwZW5kcyBvbiB0aGUgZmlnaHRlciBzdXBwb3J0IGVzY29ydGluZyB0aGUNCiAgICAgaW50cnVkZXIuICBBZnRlciB0aGUgaW5pdGlhbCBhdHRhY2ssIG9mZmVuc2l2ZSBmaWdodGVycw0KICAgICBmYWxsIGJhY2sgdG8gZGVmZW5kIHRoZWlyIHRlcnJpdG9yeS4gIFRvbGwgZmlnaHRlcnMNCiAgICAgc2ltcGx5IHN0b3AgdGhlIGNhc3VhbCBwYXNzZXJzLWJ5IGFuZCBhc2sgdGhlbSBmb3IgbW9uZXkNCiAgICAgdG8gaGVscCB3aXRoIHlvdXIgY2F1c2UuICBUaGUgbnVtYmVyIG9mIFRvbGwgRmlnaHRlcnMNCiAgICAgZGVwbG95ZWQgd2lsbCBkZXRlcm1pbmUgdGhlIGFtb3VudCBvZiB0aGUgdG9sbCBjaGFyZ2VkLg0KICAgICBUb2xsIGZpZ2h0ZXJzLCBhcyBhbGwgb3RoZXIgZmlnaHRlcnMsIHdpbGwgZmlnaHQgYmFjayBpZg0KICAgICBhdHRhY2tlZC4NCg0KJmx0O0cmZ3Q7ICBTaG93IERlcGxveWVkIEZpZ2h0ZXJzLiAgVGhpcyBkaXNwbGF5IGNhbiBiZSBhIHZlcnkNCiAgICAgdXNlZnVsIHRvb2wgYXMgeW91IHBsYW4geW91ciBtaWxpdGFyeSBzdHJhdGVnaWVzLiAgVGhlDQogICAgIGluZm9ybWF0aW9uIHNob3duIGNvbnRhaW5zIHRoZSBzZWN0b3IgbnVtYmVyIHdoZXJlIHRoZQ0KICAgICBmaWdodGVycyBhcmUgbG9jYXRlZCwgdGhlIHF1YW50aXR5IG9mIGZpZ2h0ZXJzIHRoZXJlLA0KICAgICB3aGV0aGVyIHRoZSBmaWdodGVycyBhcmUgUGVyc29uYWwgb3IgQ29ycG9yYXRlLCB0aGUNCiAgICAgc3RyYXRlZ2ljIG1vZGUgdGhleSBhcmUgaW4gKE9mZmVuc2l2ZSwgRGVmZW5zaXZlIG9yIFRvbGwpDQogICAgIGFuZCBhbnkgdG9sbHMgdGhleSBoYXZlIGNvbGxlY3RlZC4NCg0KJmx0O0gmZ3Q7ICBIYW5kbGUgU3BhY2UgTWluZXMuICBNaW5lcyBjYW4gYmUgYSB2ZXJ5IGNvbnZpbmNpbmcgd2F5DQogICAgIG9mIG1hcmtpbmcgeW91ciB0ZXJyaXRvcnkuICBUaGlzIHNlbGVjdGlvbiB3aWxsIGxldCBwbGFjZQ0KICAgICBib3RoIExpbXBldCBhbmQgQXJtaWQgbWluZXMgYW5kIGFsbG93cyB5b3UgcGxhY2Ugb3IgcGljayB1cA0KICAgICB0aGUgbWluZXMuICBZb3Ugd2lsbCBiZSBhYmxlIHRvIGNob29zZSB3aGV0aGVyIHRvIHNldCB0aGUNCiAgICAgbWluZXMgYXMgUGVyc29uYWwgb3IgQ29ycG9yYXRlLiBQZXJzb25hbCBtaW5lcyB3aWxsDQogICAgIHJlY29nbml6ZSBvbmx5IHlvdSBhbmQgQ29ycG9yYXRlIG1pbmVzIHdpbGwgcmVjb2duaXplIGFueQ0KICAgICBtZW1iZXIgb2YgeW91ciBjb3Jwb3JhdGlvbi4gTWluZXMgZG9uJ3QgYWx3YXlzIHdvcmssIGJ1dCBpdA0KICAgICBzdGFuZHMgdG8gcmVhc29uIHRoYXQgdGhlIG1vcmUgbWluZXMgdGhlcmUgYXJlIGluIGEgc2VjdG9yLA0KICAgICB0aGUgbW9yZSBsaWtlbHkgb25lIGlzIHRvIGRldG9uYXRlIChvciBhdHRhY2ggaW4gdGhlIGNhc2Ugb2YNCiAgICAgTGltcGV0IG1pbmVzKS4NCg0KJmx0O0smZ3Q7ICBTaG93IERlcGxveWVkIE1pbmVzLiAgVGhpcyBkaXNwbGF5IGlzIHNpbWlsYXIgdG8gdGhlIFNob3cNCiAgICAgRGVwbG95ZWQgRmlnaHRlcnMuICBZb3UgZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBzZWN0b3JzDQogICAgIGNvbnRhaW5pbmcgeW91ciBQZXJzb25hbCBhbmQvb3IgQ29ycG9yYXRlIExpbXBldCBhbmQgQXJhbWlkDQogICAgIG1pbmVzIGFuZCBob3cgbWFueSBtaW5lcyBhcmUgbG9jYXRlZCBpbiBlYWNoIG9mIHRob3NlDQogICAgIHNlY3RvcnMuICBJbiB0aGUgY2FzZSBvZiBMaW1wZXQgbWluZXMsIHlvdSB3aWxsIGdldCB0d28NCiAgICAgZGlzcGxheXMuICBPbmUgd2lsbCBzaG93IHRoZSBkZXBsb3llZCBtaW5lcyBqdXN0IHdhaXRpbmcgZm9yDQogICAgIHlvdXIgdW5zdXNwZWN0aW5nIGVuZW15LiAgVGhlIG90aGVyIGRpc3BsYXkgaXMgQWN0aXZhdGVkDQogICAgIG1pbmVzIC0gaXQgc2hvd3MgdGhvc2UgbWluZXMgd2hpY2ggaGF2ZSBhdHRhY2hlZCB0byBzaGlwcw0KICAgICBhbmQgd2hlcmUgdGhleSBhcmUuDQoNCiZsdDtPJmd0OyAgU3RhcnBvcnQgQ29uc3RydWN0aW9uLiAgSWYgdGhlcmUgaXMgbm90IGEgU3RhcnBvcnQgaW4gdGhlDQogICAgIHNlY3RvciwgdGhpcyBtZW51IHNlbGVjdGlvbiB3aWxsIGRpc3BsYXkgdGhlIFN0YXJwb3J0DQogICAgIENvbnN0cnVjdGlvbiBNZW51LiAgU3RhcnBvcnRzIGFyZSBhdmFpbGFibGUgdGhyb3VnaG91dA0KICAgICB0aGUgdW5pdmVyc2UuICBZb3UgbWF5IGRlY2lkZSB0aGF0IHlvdSB3YW50IHlvdXIgb3duDQogICAgIGN1c3RvbWl6ZWQgY29tbWVyY2UgY2VudGVyIGluIGEgcGxhY2UgeW91IHNwZWNpZnkgaW5zdGVhZA0KICAgICBvZiB1c2luZyB0aGUgb25lcyBidWlsdCBieSBvdGhlcnMuICBZb3Ugd2lsbCBzZWUgYQ0KICAgICBkZXRhaWxlZCBncmFwaCBvZiB0aGUgZGlmZmVyZW50IHBvcnQgY2xhc3NlcywgdGhlDQogICAgIHByb2R1Y3RzIHRoZXkgY2FuIGltcG9ydC9leHBvcnQgYW5kIHRoZSBpbml0aWFsDQogICAgIGNvbnN0cnVjdGlvbiBjb3N0cy4gIFRoZSBsaWNlbnNlIGJ1cmVhdSB3aWxsIGNoZWNrIHRvIHNlZQ0KICAgICB0aGF0IHRoZXJlIGlzIGEgcGxhbmV0IGluIHRoZSBzZWN0b3IgdG8gcHJvdmlkZSBtYXRlcmlhbHMNCiAgICAgZm9yIHRoZSBjb25zdHJ1Y3Rpb24uICBUaGV5IHdpbGwgYWxzbyBjaGVjayBmb3INCiAgICAgc3VmZmljaWVudCBmdW5kaW5nIHRvIHN1cHBvcnQgdGhlIHVuZGVydGFraW5nLiAgQmUgc3VyZQ0KICAgICB0byBsZWF2ZSB0aGUgc3BlY2lmaWVkIGFtb3VudCBvZiBtYXRlcmlhbHMgb24gdGhlIHBsYW5ldA0KICAgICBldmVyeSBkYXkgZHVyaW5nIHRoZSBjb25zdHJ1Y3Rpb24gcGhhc2Ugb3IgdGhlIGJ1aWxkaW5nDQogICAgIHdpbGwgbm90IHByb2dyZXNzLiAgSWYgdGhlcmUgaXMgYWxyZWFkeSBhIFN0YXJwb3J0IGluIHRoZQ0KICAgICBzZWN0b3IsIHRoZSBVcGdyYWRlIFN0YXJwb3J0IE1lbnUgd2lsbCBiZSBkaXNwbGF5ZWQuDQogICAgIFRoaXMgYWxsb3dzIHlvdSB0byBpbmNyZWFzZSB0aGUgdHJhZGluZyBsZXZlbHMgb2YgYW55IG9yDQogICAgIGFsbCBvZiB0aGUgY29tbW9kaXRpZXMuICBUaGUgdW5pdmVyc2UgY2FuIHN1cHBvcnQgb25seSBzbw0KICAgICBtYW55IHBvcnRzLiAgSWYgdGhlIFN0YXJwb3J0IENvbnN0cnVjdGlvbiByZXF1ZXN0IHRlbGxzDQogICAgIHlvdSB0aGF0IHRoZSB1bml2ZXJzZSBpcyBmdWxsLCB0aGVuIHlvdSBoYXZlIHRvIGRlc3Ryb3kNCiAgICAgYW4gZXhpc3RpbmcgcG9ydCBiZWZvcmUgeW91IGNhbiBiZWdpbiBjb25zdHJ1Y3Rpb24gb24NCiAgICAgeW91ciBuZXcgb25lLiAgKFNlZSBQT1JUIEFORCBUUkFERSkNCg0KJmx0O1kmZ3Q7ICBTZXQgTmF2UG9pbnRzLiAgVXNlIHRoaXMgb3B0aW9uIHRvIGxvZyBpbXBvcnRhbnQgc2VjdG9ycyB0bw0KICAgICB5b3VyIG5hdmlnYXRpb24gdW5pdC4gIFlvdSBjYW4gdGhlbiBwbG90IGEgY291cnNlIHRvIG9uZSBvZg0KICAgICB0aGVzZSBzZWN0b3JzIGF0IGFueSB0aW1lIGZyb20gdGhlIE5hdlBvaW50IG1lbnUgKCZsdDtOJmd0OyBmcm9tDQogICAgIG1haW4gbWVudSkuDQoNCkdsb2JhbCBDb21tYW5kcw0KDQogICAgIFRoZXNlIGZlYXR1cmVzIGNhbiBiZSBhY2Nlc3NlZCBmcm9tIGFueSBwcm9tcHQgaW4gdGhlIGdhbWUuICBUaGUNCiAgICAgY29tbWFuZCBtdXN0IGJlIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb24gYW55IHByb21wdCBsaW5lLCBhbmQNCiAgICAgYSBnaXZlbiBjb21tYW5kIGNhbm5vdCBiZSBhY2Nlc3NlZCBmcm9tIHdpdGhpbiBpdHNlbGYuDQoNCiZsdDtgJmd0OyAgRmVkLiBDb21tLUxpbmsuICBUaGlzIGVuYWJsZXMgeW91IHRvIHNlbmQgYSBtZXNzYWdlIHRvIGFsbA0KICAgICBvdGhlciBwbGF5ZXJzIGluIHRoZSBnYW1lIG92ZXIgdGhlIGdsb2JhbCBGZWRlcmF0aW9uIGNvbW0tbGluay4NCiAgICAgUGxheWVycyBjYW4gdHVybiBvZmYgdGhlIEZlZC4gY29tbS1saW5rIGluIHRoZSBjb21wdXRlciBtZW51DQogICAgIChQZXJzb25hbCBTZXR0aW5ncyksIGFuZCB3aWxsIG5vIGxvbmdlciByZWNlaXZlIGdsb2JhbCBtZXNzYWdlcy4NCg0KICAgICBZb3UgdXNlIHRoaXMgZmVhdHVyZSBpbiBlaXRoZXIgb2YgdHdvIHdheXM6DQoNCiAgICAgMSkgVHlwZSBgIGFuZCBwcmVzcyAmbHQ7RU5URVImZ3Q7LiAgWW91IHdpbGwgYmUgcHJvbXB0ZWQgdG8gdHlwZSBpbg0KICAgICAgICB5b3VyIG1lc3NhZ2UsIHByZXNzaW5nICZsdDtFTlRFUiZndDsgdG8gc2VuZCBlYWNoIGxpbmUuICBTZW5kaW5nDQogICAgICAgIGEgYmxhbmsgbGluZSB3aWxsIHRlcm1pbmF0ZSB0aGUgdHJhbnNtaXNzaW9uLiAgSW4gdGhpcyB3YXksDQogICAgICAgIHlvdSBjYW4gc2VuZCBhbnkgbnVtYmVyIG9mIGxpbmVzLCBlYWNoIDE1NSBjaGFyYWN0ZXJzIG9yDQogICAgICAgIGxlc3MuDQoNCiAgICAgMikgVHlwZSBgIGZvbGxvd2VkIGltbWVkaWF0ZWx5IGJ5IHlvdXIgb25lIGxpbmUgbWVzc2FnZS4NCg0KICAgICAgICBFeGFtcGxlOiBgSXMgYW55b25lIGxpc3RlbmluZz8NCg0KICAgICAgICBVcG9uIHByZXNzaW5nICZsdDtFTlRFUiZndDssIHRoaXMgb25lIGxpbmUgbWVzc2FnZSB3aWxsIGJlIHNlbnQsDQogICAgICAgIGFuZCB0aGUgdHJhbnNtaXNzaW9uIHdpbGwgYmUgdGVybWluYXRlZCwgcmV0dXJuaW5nIHlvdSB0byB0aGUNCiAgICAgICAgcHJldmlvdXNseSBhY3RpdmUgcHJvbXB0LiAgQXMgYmVmb3JlLCB0aGlzIGxpbmUgY2FuIGJlIHVwIHRvDQogICAgICAgIDE1NSBjaGFyYWN0ZXJzIGluIGxlbmd0aC4NCg0KJmx0OycmZ3Q7ICBTdWItc3BhY2UgUmFkaW8uICBUaGlzIGVuYWJsZXMgeW91IHRvIHNlbmQgYSBtZXNzYWdlIHRvIGFsbA0KICAgICBvdGhlciBwbGF5ZXJzIGluIHRoZSBnYW1lIHdobyBhcmUgdHVuZWQgdG8geW91ciByYWRpbyBjaGFubmVsLiAgQnkNCiAgICAgZGVmYXVsdCwgZXZlcnlvbmUgc3RhcnRzIG9uIHJhZGlvIGNoYW5uZWwgemVybyB1bnRpbCBjaGFuZ2VkDQogICAgIGluIHRoZSBjb21wdXRlciBtZW51IChQZXJzb25hbCBTZXR0aW5ncykuDQoNCiAgICAgWW91IHVzZSB0aGlzIGZlYXR1cmUgaW4gZWl0aGVyIG9mIHR3byB3YXlzOg0KDQogICAgIDEpIFR5cGUgJyBhbmQgcHJlc3MgJmx0O0VOVEVSJmd0Oy4gIFlvdSB3aWxsIGJlIHByb21wdGVkIHRvIHR5cGUgaW4NCiAgICAgICAgeW91ciBtZXNzYWdlLCBwcmVzc2luZyAmbHQ7RU5URVImZ3Q7IHRvIHNlbmQgZWFjaCBsaW5lLiAgU2VuZGluZw0KICAgICAgICBhIGJsYW5rIGxpbmUgd2lsbCB0ZXJtaW5hdGUgdGhlIHRyYW5zbWlzc2lvbi4gIEluIHRoaXMgd2F5LA0KICAgICAgICB5b3UgY2FuIHNlbmQgYW55IG51bWJlciBvZiBsaW5lcywgZWFjaCAxNTUgY2hhcmFjdGVycyBvcg0KICAgICAgICBsZXNzLg0KDQogICAgIDIpIFR5cGUgJyBmb2xsb3dlZCBpbW1lZGlhdGVseSBieSB5b3VyIG9uZSBsaW5lIG1lc3NhZ2UuDQoNCiAgICAgICAgRXhhbXBsZTogJ0lzIGFueW9uZSBsaXN0ZW5pbmc/DQoNCiAgICAgICAgVXBvbiBwcmVzc2luZyAmbHQ7RU5URVImZ3Q7LCB0aGlzIG9uZSBsaW5lIG1lc3NhZ2Ugd2lsbCBiZSBzZW50LA0KICAgICAgICBhbmQgdGhlIHRyYW5zbWlzc2lvbiB3aWxsIGJlIHRlcm1pbmF0ZWQuICBBcyBiZWZvcmUsIHRoaXMNCiAgICAgICAgbGluZSBjYW4gYmUgdXAgdG8gMTU1IGNoYXJhY3RlcnMgaW4gbGVuZ3RoLg0KDQombHQ7PSZndDsgIEhhaWxpbmcgRnJlcXVlbmNpZXMuICBUaGlzIGVuYWJsZXMgeW91IHRvIHNlbmQgYSBtZXNzYWdlIG92ZXIgYQ0KICAgICBzZWN1cmVkIGNoYW5uZWwgdG8gYW5vdGhlciB0cmFkZXIuICBUaGlzIGlzIG5vdCB0byBiZSBjb25mdXNlZCB3aXRoDQogICAgIHByaXZhdGUgbWFpbC4gIE1lc3NhZ2VzIHNlbnQgaGVyZSBhcmUgbm90IHN0b3JlZCBpbiB0aGUgdHJhZGVycw0KICAgICBtYWlsIGxvZy4NCg0KICAgICBZb3UgdXNlIHRoaXMgZmVhdHVyZSBpbiBhbnkgb2YgdGhyZWUgd2F5czoNCg0KICAgICAxKSBUeXBlID0gYW5kIHByZXNzICZsdDtFTlRFUiZndDsuICBZb3Ugd2lsbCBiZSBwcm9tcHRlZCB0byB0eXBlIGluDQogICAgICAgIHRoZSBuYW1lIG9mIHRoZSB0cmFkZXIgeW91IGFyZSBjb250YWN0aW5nLiAgQXNzdW1pbmcgdGhpcyB0cmFkZXINCiAgICAgICAgaXMgdmFsaWQsIHlvdXIgY29tcHV0ZXIgd2lsbCBzZW5kIGEgaGFpbGluZyBtZXNzYWdlLiAgSWYgdGhlDQogICAgICAgIHVzZXIgaXMgb25saW5lLCBhIHByaXZhdGUgY2hhbm5lbCB3aWxsIGJlIG9wZW5lZC4gIFlvdSB3aWxsIHRoZW4NCiAgICAgICAgYmUgcHJvbXB0ZWQgdG8gdHlwZSBpbiB5b3VyIG1lc3NhZ2UsIHByZXNzaW5nICZsdDtFTlRFUiZndDsgdG8gc2VuZCBlYWNoDQogICAgICAgIGxpbmUuICBTZW5kaW5nIGEgYmxhbmsgbGluZSB3aWxsIHRlcm1pbmF0ZSB0aGUgdHJhbnNtaXNzaW9uLiAgSW4NCiAgICAgICAgdGhpcyB3YXksIHlvdSBjYW4gc2VuZCBhbnkgbnVtYmVyIG9mIGxpbmVzLCBlYWNoIDE1NSBjaGFyYWN0ZXJzIG9yDQogICAgICAgIGxlc3MuDQoNCiAgICAgMikgVHlwZSA9IGZvbGxvd2VkIGltbWVkaWF0ZWx5IGJ5IHRoZSB0cmFkZXIgeW91IGFyZSBjb250YWN0aW5nLg0KDQogICAgICAgIEV4YW1wbGU6ID1LYWwgRHVyYWsNCg0KICAgICAgICBVcG9uIHByZXNzaW5nICZsdDtFTlRFUiZndDssIGFzc3VtaW5nIHRoaXMgdHJhZGVyIGlzIHZhbGlkLCB5b3VyIGNvbXB1dGVyDQogICAgICAgIHdpbGwgc2VuZCBhIGhhaWxpbmcgbWVzc2FnZS4gIElmIHRoZSB1c2VyIGlzIG9ubGluZSwgYSBwcml2YXRlDQogICAgICAgIGNoYW5uZWwgd2lsbCBiZSBvcGVuZWQuICBZb3Ugd2lsbCB0aGVuIGJlIHByb21wdGVkIHRvIHR5cGUgeW91cg0KICAgICAgICBtZXNzYWdlLCBwcmVzc2luZyAmbHQ7RU5URVImZ3Q7IHRvIHNlbmQgZWFjaCBsaW5lLiAgQXMgYmVmb3JlLCBzZW5kaW5nIGENCiAgICAgICAgYmxhbmsgbGluZSB3aWxsIHRlcm1pbmF0ZSB0aGUgdHJhbnNtaXNzaW9uLCBhbmQgeW91IGNhbiBzZW5kIGFueQ0KICAgICAgICBudW1iZXIgb2YgbGluZXMsIGVhY2ggMTU1IGNoYXJhY3RlcnMgb3IgbGVzcy4NCg0KICAgICAzKSBUeXBlID0gZm9sbG93ZWQgaW1tZWRpYXRlbHkgYnkgdGhlIHRyYWRlciB5b3UgYXJlIGNvbnRhY3RpbmcsDQogICAgICAgIGZvbGxvd2VkIHRoZW4gYnkgYSBjb21tYSwgYW5kIHRoZSBvbmUgbGluZSBtZXNzYWdlIHRvIGJlIHNlbnQuDQoNCiAgICAgICAgRXhhbXBsZTogPUthbCBEdXJhaywgTWVldCBtZSBhdCBTdGFyZG9jayENCg0KICAgICAgICBVcG9uIHByZXNzaW5nICZsdDtFTlRFUiZndDssIHlvdXIgY29tcHV0ZXIgd2lsbCBhdHRlbXB0IHRvIGNvbnRhY3QNCiAgICAgICAgdGhpcyB0cmFkZXIuICBJZiB0aGlzIGlzIGEgdmFsaWQgdHJhZGVyIG5hbWUsIHRoZSBvbmUgbGluZQ0KICAgICAgICBtZXNzYWdlIHdpbGwgYmUgdHJhbnNtaXR0ZWQsIGFuZCB0aGUgdHJhbnNtaXNzaW9uIHdpbGwgZW5kLg0KICAgICAgICBUaGlzIGxpbmUsIGluY2x1ZGluZyB0cmFkZXIgbmFtZSwgaXMgbGltaXRlZCB0byAxNTUgY2hhcmFjdGVycy4NCiAgICAgICAgSWYgdGhhdCB0cmFkZXIgaXMgbm90IGF2YWlsYWJsZSBhdCB0aGUgbW9tZW50LCB0aGUgbWVzc2FnZSB3aWxsIG5vdA0KICAgICAgICBiZSByZWNlaXZlZC4NCg0KICAgICBJbiBhbGwgb2YgdGhlIGFib3ZlIGNhc2VzLCBpZiB0aGUgdHJhZGVyIGlzIG5vdCBvbmxpbmUsIHRoZSBtZXNzYWdlDQogICAgIHdpbGwgYmUgcm91dGVkIHRvIHRoZSBHYWxhY3RpYyBNLkEuSS5MLiBTZXJ2aWNlLg0KDQogICAgIEVzdGFibGlzaGluZyBhIHR3by13YXkgc2VjdXJlZCBjb21tLWxpbms6DQoNCiAgICAgICAgT25jZSB0aGUgY29tcHV0ZXIgZXN0YWJsaXNoZXMgdGhlIGlkZW50aXR5IG9mIHRoZSB0cmFkZXIgeW91IGFyZQ0KICAgICAgICBjb250YWN0aW5nLCBhICJoYWlsaW5nIiBtZXNzYWdlIGlzIHNlbnQuICBJZiB0aGF0IHRyYWRlciB3aXNoZXMsDQogICAgICAgIGhlIG9yIHNoZSBtYXkgdGhlbiBjb250YWN0IHlvdSB3aXRoIHRoZSAiSGFpbGluZyBGcmVxdWVuY2llcyINCiAgICAgICAgY29tbWFuZC4gIEluIHRoaXMgd2F5LCBhIHNlY3VyZWQgdHdvLXdheSBjb21tLWxpbmsgY2FuIGJlDQogICAgICAgIGVzdGFibGlzaGVkIGJldHdlZW4gdHdvIHRyYWRlcnMuICBUaGUgdHJhbnNtaXNzaW9uIHdvcmtzIGp1c3QgYXMNCiAgICAgICAgYmVmb3JlLCBhY2NlcHQgdGhhdCB0aGUgaW5jb21pbmcgbWVzc2FnZSBiYW5uZXIgZm9yIHRoaXMgdHJhZGVyDQogICAgICAgIHdpbGwgYmUgc2hvcnRlbmVkIHRvIHRoZSB0cmFkZXIncyBuYW1lIGFuZCBhIGNvbG9uLiAgRm9yIGV4YW1wbGUsDQoNCiAgICAgICAgS2FsIER1cmFrOg0KICAgICAgICBJJ20gYWxyZWFkeSBhdCBTdGFyZG9jay4uLg0KDQogICAgICAgIFRoaXMgaXMgbWVhbnQgdG8gZmFjaWxpdGF0ZSBsZW5ndGh5IGNoYXQgc2Vzc2lvbnMgYmV0d2VlbiB0cmFkZXJzLg0KDQombHQ7IyZndDsgIFdobydzIHBsYXlpbmcuICBUaGlzIGRpc3BsYXlzIGEgbGlzdCBvZiBvdGhlciBhbGwgdXNlcnMgaW4gdGhlDQogICAgIGdhbWUgYXQgdGhpcyB0aW1lLg0KDQombHQ7LyZndDsgIFF1aWNrLXN0YXRzLiAgRGlzcGxheXMgYSBjb21wYWN0IG92ZXJ2aWV3IG9mIHlvdXIgc3RhdHMsIGluY2x1ZGluZw0KICAgICB0dXJucywgY3JlZGl0cywgYWxpZ25tZW50LCBleHBlcmllbmNlLCBhbmQgaW5mbyBhYm91dCB5b3VyIHNoaXAuDQoNCk1pc2NlbGxhbmVvdXMNCg0KJmx0O1EmZ3Q7ICBRdWl0IGFuZCBFeGl0LiAgVGhpcyBleGl0cyB5b3UgZnJvbSB0aGUgZ2FtZSBhbmQgcmV0dXJucw0KICAgICB5b3UgdG8gdGhlIEJCUy4NCg0KJmx0OyEmZ3Q7ICBNYWluIE1lbnUgSGVscC4gIERpc3BsYXkgdGhlIHBvcnRpb24gb2YgdGhlIGRvY3VtZW50YXRpb24NCiAgICAgZGVzY3JpYmluZyB0aGUgTWFpbiBNZW51IGZ1bmN0aW9ucy4NCg0KJmx0O1omZ3Q7ICBUcmFkZSBXYXJzIERvY3MuICBEaXNwbGF5IHRoaXMgZW50aXJlIGRvY3VtZW50LiAgVXNlZnVsDQogICAgIG1lbnVzIGFyZSBhdmFpbGFibGUgYW55dGltZSBhID8gYXBwZWFycyBpbiB0aGUgcHJvbXB0Lg0KICAgICBTcGVjaWZpYyBoZWxwIGZpbGVzIGFyZSBhdmFpbGFibGUgd2hlcmV2ZXIgYW4gISBhcHBlYXJzDQogICAgIGluIHRoZSBtZW51cy4NCg0KJmx0O1YmZ3Q7ICBWaWV3IEdhbWUgU3RhdHVzLiAgVHJhZGUgV2FycyAyMDAyIGNhbiBiZSBjb25maWd1cmVkIGluDQogICAgIGEgdmFyaWV0eSBvZiB3YXlzIGJ5IHlvdXIgU3lzT3AuICBUaGlzIGRpc3BsYXkgd2lsbCBzaG93DQogICAgIHlvdSB0aGUgc3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoZSBnYW1lIGFzIHdlbGwgYXMgdGhlDQogICAgIGN1cnJlbnQgaW5mb3JtYXRpb24uICBTdGF0aWMgaW5mb3JtYXRpb24gaW5jbHVkZXMgdGhlDQogICAgIHZlcnNpb24gbnVtYmVyLCBtYXhpbXVtIG51bWJlciBvZiBzZWN0b3JzLCBwbGF5ZXJzLCBldGMuLA0KICAgICB3aGV0aGVyIG9yIG5vdCB0aGUgbG9jYWwgZGlzcGxheSBpcyBvbiwgYW5kIGlmIHRoaXMgaXMgYQ0KICAgICByZWdpc3RlcmVkIHZlcnNpb24gb2YgdGhlIGdhbWUuICBUaGUgU3RhckRvY2sgbG9jYXRpb24NCiAgICAgbWF5IGFsc28gYXBwZWFyIG9uIHRoaXMgc2NyZWVuIGlmIHRoZSBTeXNPcCBoYXMgY29uZmlndXJlZA0KICAgICB0aGUgZ2FtZSB0aGF0IHdheS4gIFRoZSBjdXJyZW50IGluZm9ybWF0aW9uIHdpbGwgc2hvdyBob3cNCiAgICAgbWFueSBwbGF5ZXJzIGFyZSBub3cgaW4gdGhlIGdhbWUgd2l0aCB0aGUgcGVyY2VudGFnZSBvZg0KICAgICBnb29kLCBob3cgbWFueSBwbGFuZXRzIGhhdmUgYmVlbiBidWlsdCwgaG93IG1hbnkNCiAgICAgY29ycG9yYXRpb25zIGFyZSByZWdpc3RlcmVkLCB0aGUgYW1vdW50IG9mIGNyZWRpdHMNCiAgICAgYWNjdW11bGF0ZWQgYXQgdGhlIHBvcnRzLCB0aGUgdG90YWwgZmlnaHRlcnMgYW5kIG1pbmVzIGluDQogICAgIHRoZSB1bml2ZXJzZSBhbmQgaG93IGxvbmcgdGhlIGdhbWUgaGFzIGJlZW4gcnVubmluZy4NCg0KSGlkZGVuIEtleXMgKE5vdCBvbiBtZW51KQ0KDQombHQ7Jmx0OyZndDsgIFJldHVybiB0byBQcmV2aW91cyBTZWN0b3IuICBUaGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIHRvIHF1aWNrbHkNCiAgICAgcmV0dXJuIHRvIHRoZSBzZWN0b3IgZnJvbSB3aGljaCB5b3UganVzdCBjYW1lLiAgUGFydGljdWxhcmx5DQogICAgIHVzZWZ1bCBpbiBwb3J0LXBhaXIgc2l0dWF0aW9ucywgd2hlcmUgeW91IGNhbiBlZmZvcnRsZXNzbHkNCiAgICAgbW92ZSBiZXR3ZWVuIHR3byBhZGphY2VudCBwYWlyZWQgcG9ydHMuDQoNCiAgICAgTk9URTogIFVzZSBvZiAmbHQ7LCZndDsgKG5vIHNoaWZ0KSBoYXMgYmVlbiBkaXNjb250aW51ZWQgYXMgb2YgdjMuMDUuDQoNCiZsdDtAJmd0OyAgR2FtZSBEZXRhaWxzLiAgU3lzb3Agb25seS4gIFNlZSBUV1NZU09QLkRPQyBmb3IgZGV0YWlscy4NCg0KJmx0O3wmZ3Q7ICBHbG9iYWwgdG8gdG9nZ2xlIHNpbGVuY2UgbW9kZS4gIFNhbWUgYXMgQ29tcHV0ZXIvUGVyc29uYWwgU2V0dGluZ3MvDQogICAgIFNpbGVuY2UgQUxMIE1lc3NhZ2VzLg0KDQpBVVRPUElMT1QgTUVOVQ0KDQombHQ7WSZndDsgIFllcywgc3RvcCBoZXJlLiAgVGhpcyB3aWxsIGRpc2VuZ2FnZSB0aGUgQXV0b3BpbG90IGFuZA0KICAgICB3aWxsIHN0b3AgeW91IGluIHRoZSBjdXJyZW50IHNlY3Rvci4NCg0KJmx0O04mZ3Q7ICBObywgY29udGludWUgb24uICBDb250aW51ZXMgb24gdGhlIHByZS1kZWZpbmVkIHJvdXRlLg0KDQombHQ7RSZndDsgIEV4cHJlc3MgTm9uLXN0b3AuICBUaGlzIHdpbGwgc3BlZWQgeW91IHRocm91Z2ggdGhlDQogICAgIHNlY3RvcnMgd2l0aG91dCBwYXVzaW5nIHRvIGFzayBpZiB5b3Ugd2FudCB0byBzdG9wIGluIHRoZQ0KICAgICBzZWN0b3JzIHdpdGggcGxhbmV0cyBvciBwb3J0cy4gIEhpdHRpbmcgdGhlIHNwYWNlIGJhcg0KICAgICB3aGlsZSBpbiBFeHByZXNzIG1vZGUgd2lsbCBwdXQgeW91IGludG8gd2FycCBzcGVlZC4gIElmDQogICAgIHlvdSBlbmNvdW50ZXIgZW5lbXkgZm9yY2VzIHlvdSB3aWxsIGhhdmUgdG8gcmVhY3QuICBJZg0KICAgICB5b3UgcmV0cmVhdCwgdGhlIGNvbXB1dGVyIHdpbGwgcmUtcGxvdCB5b3VyIGNvdXJzZQ0KICAgICBhdm9pZGluZyB0aGF0IHNlY3RvciBmcm9tIHdoaWNoIHlvdSByZXRyZWF0ZWQuDQoNCiZsdDtJJmd0OyAgU2hpcCBJbmZvcm1hdGlvbi4gIFRoaXMgZGlzcGxheXMgYWxsIHlvdXIgY3VycmVudA0KICAgICBzdGF0aXN0aWNzLiAgVGhlIGRpc3BsYXkgaXMgdGhlIHNhbWUgYXMgb3B0aW9uICZsdDtJJmd0OyBmcm9tDQogICAgIHRoZSBNYWluIE1lbnUuDQoNCiZsdDtSJmd0OyAgUG9ydCBSZXBvcnQuICBUaGlzIHdpbGwgZGlzcGxheSB0aGUgcG9ydCByZXBvcnQNCiAgICAgaW5mb3JtYXRpb24gYXMgaWYgeW91IGNob3NlICZsdDtSJmd0OyBmcm9tIHlvdXIgb24tYm9hcmQNCiAgICAgY29tcHV0ZXIuDQoNCiZsdDtTJmd0OyAgTG9uZyBSYW5nZSBTY2FuLiAgSWYgeW91IGhhdmUgcHVyY2hhc2VkIGEgTG9uZyBSYW5nZQ0KICAgICBTY2FubmVyIGZyb20gdGhlIEhhcmR3YXJlIEVtcG9yaXVtLCB5b3UgY2FuIHVzZSBpdCBkdXJpbmcNCiAgICAgeW91ciBBdXRvUGlsb3Qgdm95YWdlIHdpdGhvdXQgaGF2aW5nIHRvIHN0b3AgaW4gdGhlDQogICAgIHNlY3Rvci4NCg0KJmx0O0QmZ3Q7ICBSZS1EaXNwbGF5IFNlY3Rvci4gIFRoaXMgaXMgdGhlIHNhbWUgc2VjdG9yIGRpc3BsYXkgdGhhdA0KICAgICBjYW4gYmUgYWNjZXNzZWQgYnkgY2hvb3Npbmcgb3B0aW9uICZsdDtEJmd0OyBmcm9tIHRoZSBNYWluDQogICAgIE1lbnUuDQoNCiZsdDtQJmd0OyAgUG9ydCBhbmQgVHJhZGUuICBUaGlzIHdpbGwgYWxsb3cgeW91IHRvIGRvY2sgYXQgYSBUcmFkaW5nDQogICAgIFBvcnQgYW5kIGNvbmR1Y3QgeW91ciBidXNpbmVzcyB3aXRob3V0IGhhdmluZyB0bw0KICAgICByZWNhbGN1bGF0ZSB5b3VyIEF1dG9waWxvdCBjb3Vyc2Ugd2hlbiB5b3UncmUgZG9uZS4gIFlvdQ0KICAgICB3aWxsIGJlIHNlbGVjdGluZyB0aGUgc2FtZSBvcHRpb25zIGFzIHlvdSB3b3VsZCBpZiB5b3UNCiAgICAgY2hvc2UgdGhlICZsdDtQJmd0OyBzZWxlY3Rpb24gZnJvbSB0aGUgTWFpbiBNZW51Lg0KDQombHQ7ISZndDsgIEF1dG9waWxvdCBIZWxwLiAgRGlzcGxheXMgdGhpcyBmaWxlLg0KDQoNCkNPTVBVVEVSIE1FTlUNCg0KTmF2aWdhdGlvbg0KDQombHQ7RiZndDsgIENvdXJzZSBQbG90dGVyLiAgVGhpcyB3aWxsIHNob3cgdGhlIG51bWJlciBvZiB0dXJucyBhbmQgaG9wcw0KICAgICBpdCAgd2lsbCB0YWtlIHRvIGdldCBmcm9tIGFueSBzZWN0b3IgaW4gdGhlIHVuaXZlcnNlIHRvDQogICAgIGFub3RoZXIuICBZb3UgY2FuIHVzZSB0aGlzIHRvb2wgdG8gYXZvaWQgYW55IHN1cnByaXNlIGFzDQogICAgIHlvdSB0cmF2ZWwgYmV0d2VlbiBzZWN0b3JzLiAgWW91IGtub3cgdGhlIHVuaXZlcnNlIGlzDQogICAgIGZ1bGwgb2YgdW5leHBsYWluZWQgcGhlbm9tZW5vbiBhbmQganVzdCBiZWNhdXNlIHlvdSBnb3QNCiAgICAgZnJvbSB5b3VyIGhvbWUgc2VjdG9yIHRvIHRoaXMgc2VjdG9yIHdpdGggYSBncmVhdCBwb3J0IGluDQogICAgIGZpdmUgbW92ZXMgZG9lc24ndCBtZWFuIHlvdSdsbCBnZXQgYmFjayBpbiBmaXZlIG1vdmVzLg0KDQombHQ7SSZndDsgIEludGVyLVNlY3RvciBXYXJwcy4gIFRoaXMgc2VsZWN0aW9uIHdpbGwgc2hvdyB5b3UgdGhlDQogICAgIHdhcnBzIGxhbmVzIGNvbm5lY3RlZCB0byBhbnkgc2VjdG9yIGluIHRoZSB1bml2ZXJzZSB0aGF0DQogICAgIHlvdSBoYXZlIGV4cGxvcmVkLiAgWW91IGp1c3QgZW50ZXIgdGhlIHNlY3RvciBudW1iZXIgYW5kDQogICAgIHRoZSBjb21wdXRlciB3aWxsIHNob3cgeW91IGV2ZXJ5IHNlY3RvciBkaXJlY3RseSBsaW5rZWQNCiAgICAgdG8gdGhhdCBzZWN0b3IuICBUaGUgY29tcHV0ZXIgd2lsbCBub3QgaGF2ZSBkYXRhIHRvDQogICAgIGRpc3BsYXkgZm9yIHRob3NlIHNlY3RvcnMgeW91IGhhdmUgeWV0IHRvIGV4cGxvcmUuDQoNCiZsdDtLJmd0OyAgWW91ciBLbm93biBVbml2ZXJzZS4gIEFzIHlvdSB0cmF2ZWwgdGhyb3VnaCBzcGFjZSwgeW91DQogICAgIHdpbGwgYmUgY3JlYXRpbmcgeW91ciBwZXJzb25hbCB0cmF2ZWxvZ3VlLiAgVGhpcyB3aWxsDQogICAgIHN0b3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzZWN0b3JzIHlvdSd2ZSBleHBsb3JlZC4NCiAgICAgWW91ciBjb21wdXRlciB3aWxsIHVzZSB0aGlzIGluZm9ybWF0aW9uIHRvIGdpdmUgeW91IHlvdXINCiAgICAgUG9ydCBSZXBvcnRzIGFuZCBJbnRlci1TZWN0b3IgV2FycHMuICBZb3UgbWF5IHdpc2ggdG8gc2VlDQogICAgIHdoYXQgc2VjdG9ycyB5b3UgaGF2ZSAob3IgZG9uJ3QgaGF2ZSkgaW4geW91ciB0cmF2ZWxvZ3VlLg0KICAgICBUaGlzIG9wdGlvbiB3aWxsIHRlbGwgeW91LiAgWW91IHdpbGwgc2VlIHdoYXQgcGVyY2VudGFnZQ0KICAgICBvZiB0aGUgdW5pdmVyc2UgeW91IGhhdmUgdmlzaXRlZCBhbmQgdGhlIGNvbXB1dGVyIHdpbGwNCiAgICAgYXNrIGlmIHlvdSB3YW50IHRoZSBsaXN0IG9mIEV4cGxvcmVkIG9yIFVuZXhwbG9yZWQNCiAgICAgc2VjdG9ycy4gIFdoZW4geW91IHJlcGx5LCB5b3Ugd2lsbCBnZXQgYSBsaXN0IG9mIHNlY3Rvcg0KICAgICBudW1iZXJzLg0KDQombHQ7UiZndDsgIFBvcnQgUmVwb3J0LiAgVGhpcyByZXBvcnQgZ2l2ZXMgeW91IHJlbGF0aXZlbHkgdXAtdG8tZGF0ZQ0KICAgICBpbmZvcm1hdGlvbiBhYm91dCBhbnkgcG9ydCBsb2NhdGVkIGluIGEgc2VjdG9yIHdoaWNoIHlvdQ0KICAgICBoYXZlIGV4cGxvcmVkLiAgQWxsIHlvdSBoYXZlIHRvIGRvIGlzIGVudGVyIHRoZSBzZWN0b3INCiAgICAgbnVtYmVyIGluIHdoaWNoIHRoZSBwb3J0IGlzIGxvY2F0ZWQuICBZb3Ugd2lsbCBzZWUgaXRlbXMNCiAgICAgYmVpbmcgdHJhZGVkIGF0IHRoZSBwb3J0LCB0aGUgc3RhdHVzIG9mIGVhY2ggb2YgdGhvc2UNCiAgICAgaXRlbXMgKHdoZXRoZXIgdGhlIHBvcnQgaXMgYnV5aW5nIHRoZW0gb3Igc2VsbGluZyB0aGVtKSwNCiAgICAgdGhlIG51bWJlciBvZiB1bml0cyB0aGUgcG9ydCBpcyB3aWxsaW5nIHRvIHRyYWRlIChhbmQNCiAgICAgd2hhdCBwZXJjZW50YWdlIG9mIG1heGltdW0gdGhhdCBudW1iZXIgcmVwcmVzZW50cykgYW5kDQogICAgIGhvdyBtYW55IG9mIGVhY2ggb2YgdGhlIGNvbW1vZGl0aWVzIHlvdSBoYXZlIGluIHlvdXINCiAgICAgaG9sZHMuICBJZiBmb3Igc29tZSByZWFzb24geW91IGdldCB0aGUgbWVzc2FnZSB0aGF0IHRoZQ0KICAgICBjb21wdXRlciBoYXMgbm8gaW5mb3JtYXRpb24gb24gdGhhdCBwb3J0IGFuZCB5b3UgYXJlIHN1cmUNCiAgICAgdGhlcmUgaXMgYSBwb3J0IGluIHRoZSBzZWN0b3IgeW91IGluZGljYXRlZCwgdGhlcmUgbWF5IGJlDQogICAgIGVuZW15IGZvcmNlcyBpbiB0aGF0IHNlY3RvciBpbnRlcmZlcmluZyB3aXRoIHlvdXINCiAgICAgY29tcHV0ZXIncyBzY2FuLg0KDQombHQ7VSZndDsgIFQtV2FycCBQcmVmZXJlbmNlLiAgT25jZSB5b3UgaGF2ZSBhIFRyYW5zV2FycCBkcml2ZSwgdGhpcw0KICAgICBvcHRpb24gd2lsbCBsZXQgeW91IGNob3NlIHdoZXRoZXIgb3Igbm90IHlvdSB3YW50IHRvIGhhdmUNCiAgICAgdGhlIHByb21wdCB0byB1c2UgdGhpcyBmZWF0dXJlIGVhY2ggdGltZSB5b3UgdHJ5IHRvIG1vdmUgdG8NCiAgICAgYSBub24tYWRqYWNlbnQgc2VjdG9yLiAgSWYgeW91IHNheSAiWWVzIiwgeW91IHdpbGwgZ2V0IHRoZQ0KICAgICBwcm9tcHQuICBJZiB5b3Ugc2F5ICJObyIsIHlvdSB3aWxsIHNpbXBseSBnZXQgdGhlIGF1dG9waWxvdA0KICAgICBwcm9tcHQuICBUaGUgbmV4dCB0aW1lIHlvdSB3YW50IHRvIHVzZSB0aGUgVFdhcnAgZHJpdmUsIHlvdQ0KICAgICB3aWxsIGhhdmUgdG8gZ28gaW50byB0aGlzIG9wdGlvbiB0byByZXN0YXJ0IGl0Lg0KDQombHQ7ViZndDsgIEF2b2lkIFNlY3RvcnMuICBZb3Ugd2lsbCBzb21ldGltZXMgZmluZCBzZWN0b3JzDQogICAgIGNvbnRhaW5pbmcgdGhpbmdzIHRoYXQgYXJlIGRldHJpbWVudGFsIHRvIHlvdXIgc3VjY2VzcyBpbg0KICAgICB0aGUgZ2FtZS4gIFRoaXMgZnVuY3Rpb24gd2lsbCBhdm9pZCB0aG9zZSBzZWN0b3JzIHdoZW4NCiAgICAgZG9pbmcgYW55IGNvdXJzZSBwbG90dGluZy4gIFlvdSBqdXN0IGhhdmUgdG8gZW50ZXIgdGhlDQogICAgIHNlY3RvciBvciBzZWN0b3JzIHRvIGJlIGJ5LXBhc3NlZCBiZWZvcmUgeW91IHVzZSB0aGUNCiAgICAgY29tcHV0ZXIgdG8gcGxvdCBhIGNvdXJzZSBvciB0byBlc3RhYmxpc2ggYSByb3V0ZSBmb3INCiAgICAgeW91ciBBdXRvUGlsb3QuICBJZiB0aGUgY29tcHV0ZXIgZW5jb3VudGVycyBhIHNpdHVhdGlvbg0KICAgICB3aGVyZSB0aGVyZSBpcyBub3QgcG9zc2libGUgcm91dGUgYmV0d2VlbiB0aGUgc2VjdG9ycyB5b3UNCiAgICAgcmVxdWVzdGVkLCB0aGVuIGFsbCB2b2lkcyB3aWxsIGJlIGNsZWFyZWQgYW5kIHdpbGwgaGF2ZQ0KICAgICB0byBiZSByZS1lbnRlcmVkIGJlZm9yZSBhbnkgZnV0dXJlIGNvdXJzZSBjYWxjdWxhdGlvbnMuDQoNCiZsdDtYJmd0OyAgTGlzdCBDdXJyZW50IEF2b2lkcy4gIFdoZW4geW91IHdhbnQgdG8gc2VlIGp1c3Qgd2hhdA0KICAgICBzZWN0b3JzIGFyZSBiZWluZyBhdm9pZGVkIHdoZW4gdGhlIGNvbXB1dGVyIGNoYXJ0cyB5b3VyDQogICAgIGNvdXJzZSwgdXNlIHRoaXMgc2VsZWN0aW9uLiAgWW91IGNhbiB1c2UgdGhpcyBpbmZvcm1hdGlvbg0KICAgICB0byBkZXRlcm1pbmUgaWYgeW91IHdhbnQgdG8gbWFrZSBhbnkgY2hhbmdlcy4gIER1ZSB0byB0aGUNCiAgICAgbGltaXRlZCBmdW5jdGlvbmFsaXR5IG9mIHRoaXMgbW9kdWxlIG9mIHRoZSBjb21wdXRlciwgaWYNCiAgICAgeW91IHdhbnQgdG8gcmVtb3ZlIG9uZSBvciBtb3JlIGF2b2lkZWQgc2VjdG9ycyBmcm9tIHRoZQ0KICAgICBsaXN0LCB5b3UgbXVzdCBjbGVhciB0aGUgZW50aXJlIGxpc3QgYW5kIHJlLWVudGVyIHRoZQ0KICAgICBzZWN0b3IgbnVtYmVycyB5b3Ugc3RpbGwgd2FudCB0byBieXBhc3MuDQoNCiZsdDshJmd0OyAgQ29tcHV0ZXIgSGVscC4gIERpc3BsYXkgdGhlIHBvcnRpb24gb2YgdGhlIGRvY3VtZW50YXRpb24NCiAgICAgZGVzY3JpYmluZyB0aGUgQ29tcHV0ZXIgZnVuY3Rpb25zLg0KDQombHQ7USZndDsgIEV4aXQgQ29tcHV0ZXIuICBUaGlzIG9wdGlvbiB3aWxsIHJldHVybiB5b3UgdG8gdGhlIGJyaWRnZQ0KICAgICBvZiB5b3VyIHNoaXAuDQoNCk1pc2NlbGxhbmVvdXMNCg0KJmx0O0EmZ3Q7ICBNYWtlIEFubm91bmNlbWVudC4gIERvIHlvdSBoYXZlIHNvbWV0aGluZyB5b3Ugd2FudCB0bw0KICAgICB0ZWxsIGV2ZXJ5b25lIGluIHRoZSBnYW1lPyAgSWYgc28sIHByZXBhcmUgeW91cg0KICAgICBwcm9jbGFtYXRpb24gYW5kIGVudGVyIGl0LiAgWW91IHdpbGwgaGF2ZSAxNTUgY2hhcmFjdGVycw0KICAgICBmb3IgeW91ciBhbm5vdW5jZW1lbnQgYW5kIGl0IHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZQ0KICAgICBEYWlseSBMb2cgZm9yIGV2ZXJ5b25lIHRvIHJlYWQgYXMgdGhleSBlbnRlciB0aGUgZ2FtZS4NCg0KJmx0O0ImZ3Q7ICBCZWdpbiBTZWxmLWRlc3RydWN0IFNlcXVlbmNlLiAgSWYgeW91IGhhdmUgbWFuYWdlZCB0bw0KICAgICBtYWtlIGEgcmVhbCBtZXNzIG9mIHRoaW5ncyBhbmQgdGhlIG9ubHkgd2F5IHRvIGNvbnRpbnVlDQogICAgIGlzIHRvIHN0YXJ0IGZyb20gc2NyYXRjaCwgdGhlbiBnbyBhaGVhZCBhbmQgdXNlIHRoaXMNCiAgICAgY29tbWFuZC4gIFlvdSB3aWxsIGVzY2FwZSBmcm9tIHlvdXIgc2hpcCBtb21lbnRzIGJlZm9yZQ0KICAgICBpdCBzZWxmLWRlc3RydWN0cy4gIFRoaW5rIGl0IG92ZXIgY2FyZWZ1bGx5IGJlZm9yZSB5b3UNCiAgICAgaGl0IHRoZSBidXR0b24uICBUaGlzIHdpbGwgbm90IG9ubHkgZGVzdHJveSB5b3VyIHNoaXAgYW5kDQogICAgIGFsbCBpdHMgaW52ZW50b3J5LCBidXQgaXQgd2lsbCBhbHNvIGFmZmVjdCB5b3VyIHJhbmsgYW5kDQogICAgIGFsaWdubWVudC4gIFlvdXIgc3Bpcml0IHRha2VzIHR3byBkYXlzIHRvIG1pZ3JhdGUgYmFjayB0bw0KICAgICBTZWN0b3IgMSwgc28geW91IHdvbid0IGhhdmUgYW55IHR1cm5zIHRoZSBkYXkgYWZ0ZXIgeW91DQogICAgIHNlbGYtZGVzdHJ1Y3QuDQoNCiZsdDtOJmd0OyAgUGVyc29uYWwgU2V0dGluZ3MuDQoNCiAgICAgQU5TSSBncmFwaGljcw0KDQogICAgICAgVG9nZ2xlcyB0aGUgZGlzcGxheSBvZiBjb2xvcnMgYW5kIEFOU0kgZGlzcGxheXMuICBUdXJuaW5nIGlmIG9mZg0KICAgICAgIHdpbGwgcmVwbGFjZSB0aGUgZGlzcGxheXMgd2l0aCB0ZXh0LW9ubHkgYWx0ZXJuYXRpdmVzLg0KDQogICAgIEFuaW1hdGlvbiBkaXNwbGF5DQoNCiAgICAgICBCeSB0dXJuaW5nIG9mZiBhbmltYXRpb24sIG1hbnkgb2YgdGhlIGxvbmdlciBtZW51cyBhbmQgZ3JhcGhpY3Mgd2lsbA0KICAgICAgIGJlIHNraXBwZWQsIG1ha2luZyB0aGUgZ2FtZSBkaXNwbGF5IGZhc3Rlci4NCg0KICAgICBQYWdlIG9uIG1lc3NhZ2UNCg0KICAgICAgIElmIHlvdSB3YW50IHRvIHJlY2VpdmUgYSBiZWVwIHdoZW4gc29tZW9uZSBzZW5kcyB5b3UgYSBtZXNzYWdlLCB0dXJuDQogICAgICAgdGhpcyBvcHRpb24gb24uICBJZiB0aGUgYmVlcCBhbm5veXMgeW91LCB0dXJuIGl0IG9mZi4NCg0KICAgICBTdWItc3BhY2UgcmFkaW8gY2hhbm5lbA0KDQogICAgICAgU3BlY2lmeSB3aGljaCBjaGFubmVsIChpZiBhbnkpIHlvdSB3aXNoIHRvIHVzZSBmb3Igc3ViLXNwYWNlIHJhZGlvDQogICAgICAgdHJhbnNtaXNzaW9uIGFuZCByZWNlcHRpb24uICBTZXR0aW5nIHRoaXMgdG8gMCB0dXJucyBvZmYgdXNlIG9mIHRoZQ0KICAgICAgIHJhZGlvLg0KDQogICAgIEZlZGVyYXRpb24gY29tbS1saW5rDQoNCiAgICAgICBJZiB0aGUgY29tbS1saW5rIG1lc3NhZ2VzIGFyZSBqdXN0IGdldHRpbmcgaW4geW91ciB3YXksIHlvdSBjYW4gdHVybg0KICAgICAgIHRoZW0gb2ZmIHdpdGggdGhpcyBvcHRpb24uDQoNCiAgICAgUmVjZWl2ZSBwcml2YXRlIGhhaWxzDQoNCiAgICAgICBJZiB5b3UnZCByYXRoZXIgbm90IGJlIGJvdGhlcmVkIGJ5IG90aGVyIFRyYWRlcnMsIHlvdSBjYW4gZGlzYWJsZSB0aGUNCiAgICAgICBoYWlsaW5nIG5vdGlmaWNhdGlvbi4gIFVzZSB3aXRoIGNhdXRpb24sIGJlY2F1c2UgeW91IG1pZ2h0IG1pc3MgYW4NCiAgICAgICBpbXBvcnRhbnQgbWVzc2FnZSBub3cgYW5kIHRoZW4uDQoNCiAgICAgUGVyc2lzdGVudCBpbmZvIGRpc3BsYXkNCg0KICAgICAgIElmIHRoaXMgb3B0aW9uIGlzIGVuYWJsZWQsIHRoZSAiUXVpY2stc3RhdHMiIGtleSwgJmx0Oy8mZ3Q7LCB3aWxsIHRvZ2dsZSB0aGUNCiAgICAgICBkaXNwbGF5IG9uIGFuZCBvZmYuICBXaGlsZSBvbiwgdGhlIGluZm8gd2lsbCBiZSBkaXNwbGF5ZWQgYXQgdGhlIHRvcA0KICAgICAgIG9mIHRoZSBzY3JlZW4uDQoNCiAgICAgICBJZiB0aGlzIG9wdGlvbiBpcyBkaXNhYmxlZCwgdGhlICJRdWljay1zdGF0cyIga2V5IHdpbGwgc2ltcGx5IGRpc3BsYXkNCiAgICAgICB0aGUgaW5mb3JtYXRpb24gb24gdGhlIG5leHQgZmV3IGxpbmVzLg0KDQogICAgIFNpbGVuY2UgQUxMIG1lc3NhZ2VzDQoNCiAgICAgICBJZiB5b3UganVzdCBkb24ndCBsaWtlIHRvIGJlIGJvdGhlcmVkLCBvciBpZiB5b3UncmUgdXNpbmcgc2Vuc2l0aXZlDQogICAgICAgc2NyaXB0cywgeW91IGNhbiB0dXJuIG9mZiBhbGwgZ2FtZSBtZXNzYWdlcy4gIFRoaXMgaW5jbHVkZXMgYWxsDQogICAgICAgbXVsdGlwbGF5ZXIgbm90aWZpY2F0aW9ucyAoUGxheWVyIGVudGVycyBzZWN0b3IsIGV0YyksIGFuZCBhbnkgbWVzc2FnZXMNCiAgICAgICBzZW50IGJ5IG90aGVyIHBsYXllcnMuICBZb3UncmUgZmx5aW5nIGJsaW5kIGhlcmUsIHNvIGJlIHdhcm5lZC4NCg0KJmx0O08mZ3Q7ICBDaGFuZ2UgU2hpcCBTZXR0aW5ncy4gIFRoaXMgb3B0aW9uIG9mZmVycyB5b3UgYW4gYWRkaXRpb25hbA0KICAgICBsZXZlbCBvZiBwcm90ZWN0aW9uIGZvciBhbGwgdGhlIHNoaXBzIHlvdSBvd24uICBUaGlzIGxldHMNCiAgICAgeW91IGVzdGFibGlzaCBhIHBhc3N3b3JkIHRoYXQgcGxheWVycyB3aWxsIG5lZWQgdG8ga25vdyB0bw0KICAgICBiZSBhYmxlIHRvIHVzZSB5b3VyIHNoaXAuDQoNCiZsdDtQJmd0OyAgRmlyZSBQaG90b24gTWlzc2lsZS4gIFlvdSBjYW4gZmlyZSB5b3VyIFBob3RvbiBNaXNzaWxlDQogICAgIGludG8gdGhlIGFkamFjZW50IHNlY3RvciBhbmQgcnVuIGluIHRvIGRvIHlvdXIgZGFtYWdlLg0KICAgICBSZW1lbWJlciB0aGF0IHRoZSB0aW1lciBpcyBydW5uaW5nIGFzIHNvb24gYXMgdGhlIG1pc3NpbGUNCiAgICAgaXMgbGF1bmNoZWQgc28gYmUgcXVpY2shDQoNCiZsdDtNJmd0OyAgUmVhZCBZb3VyIE1haWwuICBDaGVjayB5b3VyIG1lc3NhZ2VzLiAgVGhpcyBnaXZlcyB5b3UgYSBjaGFuY2UgdG8NCiAgICAgdmlldyBhbnkgbmV3IHBlcnNvbmFsIG1lc3NhZ2VzIGN1cnJlbnRseSBsb2dnZWQgd2l0aCB0aGUgR2FsYWN0aWMNCiAgICAgTS5BLkkuTC4gKE11dHVhbCBBbmFjaHJvbm91cyBJbnRlcmNoYW5nZSBMb2cpLiAgVGhlc2UgbWVzc2FnZXMgYXJlDQogICAgIG9ubHkgcmVtb3ZlZCBmcm9tIHRoZSBsb2cgYWZ0ZXIgeW91IGV4aXQgdGhlIGdhbWUgSUYgWU9VIEhBVkUgUkVBRA0KICAgICBUSEVNIEhFUkUuICBNYWlsIGdlbmVyYXRlZCBieSBUcmFkZSBXYXJzIChub3QgcGxheWVycykgd2hpbGUgeW91IGFyZQ0KICAgICBvbmxpbmUgd2lsbCBiZSBkaXNwbGF5ZWQgdG8geW91ciBzY3JlZW4gaW4gcmVhbC10aW1lLCBhbmQgYWxzbyBwbGFjZWQNCiAgICAgaW50byB5b3VyIG1haWwgd2hlcmUgdGhleSB3aWxsIHJlbWFpbiB1bnRpbCByZWFkLg0KDQombHQ7UyZndDsgIFNlbmQgTWFpbC4gIExvZyBhIG1lc3NhZ2Ugd2l0aCB0aGUgR01TIChHYWxhY3RpYyBNLkEuSS5MLiBTZXJ2aWNlKS4NCiAgICAgV2hlbiB5b3UgbmVlZCB0byBnZXQgYSBtZXNzYWdlIHRvIG9uZSBvZiB0aGUgb3RoZXIgcGxheWVycywgdGhpcyB3aWxsDQogICAgIHNlcnZlIHlvdXIgbmVlZC4gIEtlZXAgZW50ZXJpbmcgdGhlIGxpbmVzIG9mIHlvdXIgbWVzc2FnZSB1bnRpbCB5b3UNCiAgICAgYXJlIGRvbmUuICBUbyBjb21wbGV0ZSB5b3VyIG1lc3NhZ2UsIHNpbXBseSBwcmVzcyB0aGUgZW50ZXIga2V5IG9uIGENCiAgICAgYmxhbmsgbGluZS4gIFlvdSBkbyBub3QgbmVlZCB0byBrbm93IHRoZSBwbGF5ZXIncyBlbnRpcmUgbmFtZS4gIElmIHlvdQ0KICAgICBoYXZlIHBhcnQgb2YgaXQsIHlvdXIgY29tcHV0ZXIgd2lsbCBzZWFyY2ggdGhlIEdNUyBkYXRhYmFzZSBhbmQgcHJvbXB0DQogICAgIHlvdSB3aGVuIGl0IGZpbmRzIGEgbWF0Y2guDQoNCiZsdDtUJmd0OyAgQ3VycmVudCBTaGlwIFRpbWUuICBUaGlzIHdpbGwgZGlzcGxheSB0aGUgdGltZSBhbmQgZGF0ZQ0KICAgICBzdG9yZWQgaW4geW91ciBzaGlwJ3MgY29tcHV0ZXIuICAoUmVtZW1iZXIsIHRoZSBnYW1lDQogICAgIGJlZ2FuIGluIHRoZSB5ZWFyIDIwMDIuKQ0KDQombHQ7VyZndDsgIFVzZSBNaW5lIERpc3J1cHRlci4gIFlvdSBhcmUgZXhwbG9yaW5nIGEgbmV3IHJlZ2lvbiBvZg0KICAgICB0aGUgdW5pdmVyc2UgYW5kIGFzIHlvdSBzaW5nbGUtc3RlcCB5b3VyIHdheSBhbG9uZywgeW91cg0KICAgICBzY2FubmVyIHNob3dzIGEgbnVtYmVyIG9mIG1pbmVzIGluIHRoZSBuZXh0IHNlY3Rvci4gIFNlbmQNCiAgICAgb25lIG9mIHRoZSBNaW5lIERpc3J1cHRlcnMgeW91IHB1cmNoYXNlZCBhdCB0aGUgSGFyZHdhcmUNCiAgICAgRW1wb3JpdW0gaW50byB0aGlzIG1pbmVkIHNlY3RvciBzbyB5b3UgZG9uJ3QgaGF2ZSB0byB0YWtlDQogICAgIHRoZSBkYW1hZ2UgdG8geW91ciBzaGlwLiAgVGhlIGRpc3J1cHRlcnMgd2lsbCBhbHNvIGRpc2FybQ0KICAgICBhbnkgTGltcGV0IG1pbmVzIHRoYXQgbWF5IGJlIGluIHRoZSBzZWN0b3IuICBJZiB0aGUgZmlyc3QNCiAgICAgRGlzcnVwdGVyIGRvZXNuJ3QgZGlzYXJtIGFsbCB0aGUgbWluZXMsIHlvdSBjYW4gc2VuZCBpbg0KICAgICBhbm90aGVyLg0KDQpEaXNwbGF5cw0KDQombHQ7QyZndDsgIFZpZXcgU2hpcCBDYXRhbG9nLiAgVGhpcyB0b29sIGxldHMgeW91IHZpZXcgdGhlDQogICAgIHNwZWNpZmljYXRpb25zIGZvciBhbGwgdGhlIGF2YWlsYWJsZSBzaGlwcyBpbiB0aGUgZ2FtZS4NCiAgICAgWW91IGNhbiBnZXQgYSBsaXN0IG9mIHRoZSBzaGlwcyBhbmQgY2hvb3NlIHdoaWNoIGV2ZXIgb25lDQogICAgIHN0cmlrZXMgeW91ciBmYW5jeS4gIFRoZSBkaXNwbGF5IHdpbGwgc2hvdyB0aGUgZm9sbG93aW5nDQogICAgIGluZm9ybWF0aW9uIC0NCg0KICAgICAgICAgICAgICAgQmFzaWMgSG9sZCBDb3N0DQogICAgICAgICAgICAgICBNYWluIERyaXZlIENvc3QNCiAgICAgICAgICAgICAgIENvbXB1dGVyIENvc3QNCiAgICAgICAgICAgICAgIFNoaXAgSHVsbCBDb3N0DQogICAgICAgICAgICAgICBCYXNlIENvc3QNCiAgICAgICAgICAgICAgIE1pbmltdW0gYW5kIE1heGltdW0gSG9sZHMNCiAgICAgICAgICAgICAgIE1heGltdW0gRmlnaHRlcnMNCiAgICAgICAgICAgICAgIE1heGltdW0gU2hpZWxkcw0KICAgICAgICAgICAgICAgTnVtYmVyIG9mIE1vdmVzIHBlciBEYXkNCiAgICAgICAgICAgICAgIE1heGltdW0gTnVtYmVyIG9mIE1pbmVzDQogICAgICAgICAgICAgICBNYXhpbXVtIE51bWJlciBvZiBHZW5lc2lzIFRvcnBlZG9lcw0KICAgICAgICAgICAgICAgT2ZmZW5zaXZlIE9kZHMgZm9yIENvbWJhdA0KICAgICAgICAgICAgICAgTWF4aW11bSBOdW1iZXIgb2YgTWFya2VyIEJlYWNvbnMNCiAgICAgICAgICAgICAgIFRyYW5zV2FycCBEcml2ZSBDYXBhYmlsaXR5DQogICAgICAgICAgICAgICBMb25nIFJhbmdlIFNjYW5uZXIgQ2FwYWJpbGl0eQ0KICAgICAgICAgICAgICAgUGxhbmV0IFNjYW5uZXIgQ2FwYWJpbGl0eQ0KDQogICAgIEluIGFkZGl0aW9uIHRvIGFsbCB0aGlzIGluZm9ybWF0aW9uLCB0aGVyZSBpcyBhIGJyaWVmDQogICAgIG5hcnJhdGl2ZSBhYm91dCB0aGUgY2FwYWJpbGl0aWVzIGFuZCBzaG9ydGNvbWluZ3Mgb2YgZWFjaA0KICAgICBtb2RlbC4NCg0KJmx0O0QmZ3Q7ICBTY2FuIERhaWx5IExvZy4gIFRoaXMgd2lsbCByZS1kaXNwbGF5IHRoZSBEYWlseSBKb3VybmFsDQogICAgIHRoYXQgeW91IHNlZSB3aGVuIHlvdSBlbnRlciB0aGUgZ2FtZS4NCg0KJmx0O0UmZ3Q7ICBFdmlsIFRyYWRlciBDbGFzcy4gIFRoaXMgaXMgYSBkaXNwbGF5IG9mIHRoZSB0aXRsZXMgdG8NCiAgICAgd2hpY2ggeW91IGNhbiBhc3BpcmUgaWYgeW91IGFyZSBvZiBuZWdhdGl2ZSBhbGlnbm1lbnQuDQogICAgIEl0IHNob3dzIHRoZSBsZXZlbHMsIHRpdGxlcyBhbmQgdGhlIG51bWJlciBvZiBleHBlcmllbmNlDQogICAgIHBvaW50cyBuZWVkZWQgdG8gYXR0YWluIHRoYXQgbGV2ZWwuDQoNCiZsdDtHJmd0OyAgR29vZCBUcmFkZXIgQ2xhc3MuICBUaGlzIGlzIGEgZGlzcGxheSBvZiB0aGUgdGl0bGVzIHRvDQogICAgIHdoaWNoIHlvdSBjYW4gYXNwaXJlIGlmIHlvdSBhcmUgb2YgcG9zaXRpdmUgYWxpZ25tZW50Lg0KICAgICBJdCBzaG93cyB0aGUgbGV2ZWxzLCB0aXRsZXMgYW5kIHRoZSBudW1iZXIgb2YgZXhwZXJpZW5jZQ0KICAgICBwb2ludHMgbmVlZGVkIHRvIGF0dGFpbiB0aGF0IGxldmVsLg0KDQombHQ7SCZndDsgIEFsaWVuIFRyYWRlciBSYW5rcy4gIFlvdSB3aWxsIGVuY291bnRlciB0cmFkZXJzIGZyb20gb3RoZXINCiAgICAgZ2FsYXhpZXMgYXMgeW91IG1ha2UgeW91ciB3YXkgdGhyb3VnaCB0aGUgdW5pdmVyc2UuICBZb3UNCiAgICAgY2FuIGludGVyYWN0IHdpdGggdGhlc2UgY3JlYXR1cmVzIHRoZSBzYW1lIGFzIHlvdSBkbyB3aXRoDQogICAgIHRoZSBUcmFkZXJzIG5hdGl2ZSB0byB5b3VyIDEwMDAgc2VjdG9ycy4gIE9mIGNvdXJzZSwNCiAgICAgYWxpZW5zIGFyZSBlaXRoZXIgZ29vZCBvciBiYWQuICBUaGVpciBhbGlnbm1lbnQgKGdvb2Qgb3INCiAgICAgZXZpbCkgY2FuIG1ha2UgYSBiaWcgZGlmZmVyZW5jZSBpbiBob3cgeW91IHdhbnQgdG8NCiAgICAgYXNzb2NpYXRlIChvciBub3QgYXNzb2NpYXRlKSB3aXRoIHRoZW0uICBXaGVuIHlvdSB1c2UNCiAgICAgdGhpcyBzZWxlY3Rpb24sIHlvdXIgY29tcHV0ZXIgd2lsbCB0ZWxsIHlvdSBldmVyeXRoaW5nDQogICAgIHlvdSBuZWVkIHRvIGtub3cuDQoNCiZsdDtKJmd0OyAgUGxhbmV0YXJ5IFNwZWNzLiAgVGhlIHVzZSBvZiB0aGlzIGRpc3BsYXkgaXMgdmVyeSBzaW1pbGFyIHRvDQogICAgIHRoYXQgb2YgdGhlIFNoaXAgQ2F0YWxvZy4gIEEgPyB3aWxsIHNob3cgeW91IGEgbGlzdCBvZiBhbGwNCiAgICAgdGhlIHBsYW5ldCB0eXBlcy4gIENob29zZSB0aGUgb25lIHlvdSB3b3VsZCBsaWtlIHRvIGtub3cNCiAgICAgbW9yZSBhYm91dCBhbmQgdGhlIGRpc3BsYXkgd2lsbCBwcm9kdWNlIGEgcGljdHVyZSBhbmQgYQ0KICAgICBicmllZiBkZXNjcmlwdGlvbiBvZiB0aGUgcGxhbmV0LiAgSXQgd2lsbCBhbHNvIGRldGFpbCBzb21lDQogICAgIG9mIHRoZSBwcm9zIGFuZCBjb25zIG9mIHRoYXQgcGxhbmV0IHR5cGUuDQoNCiZsdDtMJmd0OyAgTGlzdCBUcmFkZXIgUmFuay4gIFRoaXMgY2hvaWNlIHdpbGwgc2hvdyB5b3UgYWxsIHRoZSBwbGF5ZXJzDQogICAgIGluIHRoZSBnYW1lIGluIG9yZGVyIG9mIGV4cGVyaWVuY2UuICBZb3VyIHByb21wdCB3aWxsIGFzaw0KICAgICBpZiB5b3Ugd291bGQgbGlrZSB0aGUgbGlzdCB0byBzaG93IHRoZSBUaXRsZXMgb2YgdGhlDQogICAgIHBsYXllcnMgb3IgdGhlaXIgVmFsdWVzIGluIEV4cGVyaWVuY2UgcG9pbnRzLiAgRWFjaA0KICAgICB0cmFkZXIgd2lsbCBiZSBkaXNwbGF5ZWQgd2l0aCBoaXMgb3IgaGVyIHRpdGxlIG9yIHZhbHVlLA0KICAgICB0aGUgbnVtYmVyIG9mIHRoZSBDb3Jwb3JhdGlvbiB0byB3aGljaCBoZS9zaGUgYmVsb25ncywNCiAgICAgYW5kIHRoZSB0eXBlIG9mIHNoaXAgY3VycmVudGx5IGJlaW5nIHVzZWQuDQoNCiZsdDtZJmd0OyAgUGVyc29uYWwgUGxhbmV0cy4gIElmIHlvdSBoYXZlIHBsYW5ldHMgdGhhdCB5b3Ugd2FudCB0bw0KICAgICBrZWVwIGFzIHBlcnNvbmFsLCB5b3UgY2FuIHZpZXcgdGhlbSB1c2luZyB0aGlzIG9wdGlvbiBqdXN0DQogICAgIGFzIHlvdSBjYW4gdmlldyBDb3Jwb3JhdGUgUGxhbmV0cyB1c2luZyB0aGUgJmx0O0wmZ3Q7IG9wdGlvbiBpbg0KICAgICB0aGUgQ29ycG9yYXRpb24gTWVudS4NCg0KJmx0O1omZ3Q7ICBBY3RpdmUgU2hpcCBTY2FuLiAgVGhpcyBkaXNwbGF5IHdpbGwgc2hvdyBhIGxpc3Qgb2YgYWxsIHlvdXINCiAgICAgc2hpcHMsIHRoZSBzaGlwIG51bWJlciwgbG9jYXRpb24sIHNoaXAgdHlwZSwgZmlnaHRlcnMgJg0KICAgICBzaGllbGRzIGFuZCB0aGUgbnVtYmVyIG9mIGhvcHMgdG8gZ2V0IHRvIGl0Lg0KDQoNClBMQU5FVCBNRU5VDQoNCiZsdDtBJmd0OyAgVGFrZSBBbGwgUHJvZHVjdHMuICBUaGlzIHdpbGwgbG9hZCB5b3VyIGVtcHR5IGhvbGRzIHdpdGgNCiAgICAgdGhlIHByb2R1Y3RzIGF2YWlsYWJsZSBvbiB0aGUgcGxhbmV0LiAgVGhlIGRvY2sgd29ya2Vycw0KICAgICB3aWxsIGxvYWQgeW91ciBzaGlwIHRvIHRoZSBicmltIHdpdGggYXMgbXVjaCBvZiBlYWNoIG9mDQogICAgIHRoZSBwcm9kdWN0cyB0aGF0IGlzIGF2YWlsYWJsZSBiZWdpbm5pbmcgd2l0aCB0aGUgY2FyZ28NCiAgICAgb2YgZ3JlYXRlc3QgdmFsdWUgKEVxdWlwbWVudCkgdG8gdGhlIGxlYXN0IHZhbHVlIChGdWVsDQogICAgIE9yZSkuDQoNCiZsdDtDJmd0OyAgRW50ZXIgQ2l0YWRlbC4gIFlvdSBlbnRlciB0aGUgQ2l0YWRlbCAoYW5kIGRpc3BsYXkgdGhlDQogICAgIENpdGFkZWwgTWVudSkuICBJZiB0aGVyZSBpcyBubyBjaXRhZGVsIG9uIHRoaXMgcGxhbmV0LA0KICAgICB5b3Ugd2lsbCBoYXZlIHRoZSBvcHRpb24gdG8gYnVpbGQgb25lLiAgVGhlIG5lY2Vzc2FyeQ0KICAgICBwcm9kdWN0cyBhbmQgbGFib3IgZm9yY2UgbmVlZGVkIGluIHRoZSBjb25zdHJ1Y3Rpb24gd2lsbA0KICAgICBkaXNwbGF5LiAgWW91IHdpbGwgbm90IGJlIGlzc3VlZCBhIGJ1aWxkaW5nIHBlcm1pdCBpZiB5b3UNCiAgICAgZG9uJ3QgaGF2ZSB0aGUgbmVjZXNzYXJ5IHBlb3BsZSBhbmQgY29tbW9kaXRpZXMuDQoNCiZsdDtEJmd0OyAgRGlzcGxheSBQbGFuZXQuICBUaGlzIHdpbGwgc2hvdyB0aGUgcGxhbmV0IG51bWJlciwgdHlwZSwNCiAgICAgbmFtZSBhbmQgdGhlIGFsaWFzIG9mIHRoZSBwbGF5ZXIgd2hvIGNyZWF0ZWQgaXQuICBUaGVyZQ0KICAgICBpcyBhbHNvIGFuIGluZm9ybWF0aXZlIGNoYXJ0IHNob3dpbmcgaG93IG1hbnkgY29sb25pc3RzDQogICAgIGFyZSB3b3JraW5nIGluIGVhY2ggcHJvZHVjdGlvbiBhcmVhLCBob3cgbWFueSB1bml0cyBvZg0KICAgICBlYWNoIHByb2R1Y3QgYXJlIGJlaW5nIHByb2R1Y2VkIGRhaWx5LCB0aGUgcXVhbnRpdHkgb2YNCiAgICAgZWFjaCBwcm9kdWN0IGN1cnJlbnRseSBhdmFpbGFibGUgb24gdGhlIHBsYW5ldCwgYW5kIGhvdw0KICAgICBtYW55IG9mIGVhY2ggeW91IGhhdmUgb24geW91ciBzaGlwLiAgQ2l0YWRlbCBpbmZvcm1hdGlvbg0KICAgICBpbmNsdWRpbmcgbGV2ZWwsIGNvbnN0cnVjdGlvbiB1bmRlcndheSBhbmQgY3JlZGl0cyBpbiB0aGUNCiAgICAgdmF1bHQgaXMgYWxzbyBhdmFpbGFibGUuDQoNCiZsdDtNJmd0OyAgQ2hhbmdlIE1pbGl0YXJ5IExldmVscy4gIFlvdSB3aWxsIHdhbnQgdG8gbW92ZSB5b3VyDQogICAgIGZpZ2h0ZXJzIGFyb3VuZCB0byBwcm90ZWN0IHlvdXIgdGVycml0b3J5LiAgVGhpcyBvcHRpb24NCiAgICAgd2lsbCBhbGxvdyB5b3UgdG8gdGFrZSBmaWdodGVycyBjdXJyZW50bHkgb24gdGhlIHBsYW5ldA0KICAgICBvciB0byBsZWF2ZSBmaWdodGVycyB5b3UgaGF2ZSBlc2NvcnRpbmcgeW91LiAgVGhlDQogICAgIGZpZ2h0ZXJzIG9uIHRoZSBwbGFuZXQgYXJlIGNvbnRyb2xsZWQgYnkgdGhlIENvbWJhdA0KICAgICBDb250cm9sIENvbXB1dGVyIChsZXZlbCAyKSBpbiB0aGUgQ2l0YWRlbC4gIElmIHRoZXJlIGlzDQogICAgIG5vIENvbWJhdCBDb250cm9sIENvbXB1dGVyIHRoZXJlLCB0aGUgZmlnaHRlcnMgd291bGQNCiAgICAgYmV0dGVyIHNlcnZlIHlvdSBwYXRyb2xsaW5nIHRoZSBzZWN0b3Igb3V0c2lkZSB0aGUNCiAgICAgcGxhbmV0LiAgTGVhdmluZyBmaWdodGVycyBvbiBhIHBsYW5ldCB3aWxsIGRlc2lnbmF0ZSB0aGUNCiAgICAgcGxhbmV0IGFzIHlvdXJzLg0KDQombHQ7TyZndDsgIENsYWltIE93bmVyc2hpcC4gIExldCB0aGUgZW50aXJlIHVuaXZlcnNlIGtub3cgd2hvDQogICAgIGNvbnRyb2xzIHRoZSBwbGFuZXQuICBVc2UgdGhpcyBvcHRpb24gdG8gc2V0IHRoZSBwbGFuZXQNCiAgICAgYXMgZWl0aGVyIFBlcnNvbmFsIG9yIENvcnBvcmF0ZS4gIFRoaXMgaXMgYSBtdXN0IHdoZW4NCiAgICAgeW91J3ZlIGdvbmUgdG8gYWxsIHRoZSB0cm91YmxlIHRvIGNhcHR1cmUgb25lIG9mIHlvdXINCiAgICAgb3Bwb25lbnQncyBwbGFuZXRzLg0KDQombHQ7UCZndDsgIENoYW5nZSBQb3B1bGF0aW9uIExldmVscy4gIFRocm91Z2hvdXQgdGhlIGNvdXJzZSBvZiB0aGUNCiAgICAgZ2FtZSB5b3UgbWF5IHdpc2ggdG8gY2hhbmdlIHRoZSBkaXN0cmlidXRpb24gb2YgeW91cg0KICAgICB3b3JrZm9yY2UgYW1vbmcgdGhlIGNvbW1vZGl0aWVzLiAgVGhpcyBzZWxlY3Rpb24gcHJvdmlkZXMNCiAgICAgeW91IHdpdGggYW4gZWFzeSwgZWZmaWNpZW50IHdheSB0byBvcmRlciB5b3VyIHdvcmtlcnMgdG8NCiAgICAgdGhlIGpvYiB5b3UgbmVlZCBkb25lLg0KDQombHQ7UyZndDsgIExvYWQvVW5sb2FkIENvbG9uaXN0cy4gIENvbG9uaXppbmcgeW91ciBwbGFuZXRzIGNhbg0KICAgICBjb250cmlidXRlIGdyZWF0bHkgdG8geW91ciB0cmFkaW5nIHByb2ZpdHMuICBUaGlzIHdpbGwNCiAgICAgZW5hYmxlIHlvdSB0byBsZWF2ZSB0aGUgY29sb25pc3RzIHlvdSd2ZSBicm91Z2h0IGZyb20NCiAgICAgVGVycmEgb3IgcGFjayBldmVyeW9uZSB1cCBhbmQgbW92ZSB0aGVtIHRvIGFub3RoZXINCiAgICAgcGxhbmV0LiAgS2VlcCBhIGNsb3NlIHdhdGNoIG9uIHlvdXIgcGxhbmV0J3MgcG9wdWxhdGlvbg0KICAgICBiZWNhdXNlIG1hbnkgcGxhbmV0cyBleHBlcmllbmNlIGEgZ3Jvd3RoL2RlYXRoIGN5Y2xlLiAgSWYNCiAgICAgeW91ciBwbGFuZXQgaGFzIHRvbyBtYW55IHBlb3BsZSB0byBzdXBwb3J0LCB0aGUgcmF3DQogICAgIG1hdGVyaWFscyBuZWVkZWQgdG8gcHJvZHVjZSB5b3VyIGNvbW1vZGl0aWVzIHdpbGwgYmUgdXNlZA0KICAgICB1cCBieSB0aGUgc3VycGx1cyBwb3B1bGF0aW9uIGFuZCB5b3VyIHByb2R1Y3Rpb24gcmF0ZXMNCiAgICAgd2lsbCBiZSBhZHZlcnNlbHkgYWZmZWN0ZWQuDQoNCiZsdDtUJmd0OyAgVGFrZSBvciBMZWF2ZSBQcm9kdWN0LiAgVGhpcyB3aWxsIGxldCB5b3Ugc3BlY2lmeSB0byB0aGUNCiAgICAgZG9jayB3b3JrZXJzIHdoaWNoIHR5cGUgb2YgcHJvZHVjdHMgeW91IHdhbnQgdG8gbGVhdmUgYW5kDQogICAgIHdoaWNoIG9uZXMgeW91IHdhbnQgbG9hZGVkIG9uIHlvdXIgc2hpcC4NCg0KJmx0O1omZ3Q7ICBUcnkgdG8gRGVzdHJveSBQbGFuZXQuICBGaXJzdCB5b3UgcHVyY2hhc2UgQXRvbWljDQogICAgIERldG9uYXRvcnMgZnJvbSB0aGUgSGFyZHdhcmUgRW1wb3JpdW0uICBUaGF0IGlzIHRoZSBlYXN5DQogICAgIHBhcnQuICBZb3UgdGhlbiBoYXZlIHRvIGZpZ2h0IHlvdXIgd2F5IGludG8gdGhlIHNlY3Rvcg0KICAgICBjb250YWluaW5nIHRoZSBwbGFuZXQuICBBZnRlciBiYXR0bGluZyB0aGUgZmlnaHRlcnMsDQogICAgIFF1YXNhciBDYW5ub25zLCBhbmQgYW55IG90aGVyIG1pbGl0YXJ5IGRlZmVuc2VzIHRoYXQgbWF5DQogICAgIGJlIHRoZXJlLCB5b3UgaGF2ZSB0aGUgYWJpbGl0eSB0byBsYXkgeW91ciBBdG9taWMNCiAgICAgRGV0b25hdG9ycy4gIENvbG9uaXN0cyBoYXZlIGJlZW4gdHJhaW5lZCBpbiB0aGUgZGlzYXJtaW5nDQogICAgIG9mIGRldG9uYXRvcnMuICBNb3N0IG9mIHRoZSB0cmFpbmluZyB3YXMgcnVzaGVkIGFuZA0KICAgICBwcm92aWRlZCBieSBpbmV4cGVyaWVuY2VkIHRlYWNoZXJzLCBzbyB0aGV5IGFyZW4ndCB2ZXJ5DQogICAgIGdvb2QgYXQgaXQuICBNb3N0IG9mIHRoZWlyIGF0dGVtcHRzIGxpdGVyYWxseSBnbyB1cCBpbg0KICAgICBzbW9rZSwgYW5kIGlmIHlvdSBhcmUgc3RpbGwgb24gdGhlIHBsYW5ldCB3aGVuIHRoZWlyDQogICAgIGF0dGVtcHQgZ29lcyBhd3J5LCB5b3UgZ28gYXdyeSB3aXRoIGl0LiAgWW91IGhhdmUgdGhlDQogICAgIG9wdGlvbiBvZiBzdWluZyB5b3VyIGNvbnZlbnRpb25hbCB3ZWFwb25zIHRvIGtpbGwgb2ZmIHRoZQ0KICAgICBjb2xvbmlzdHMgYmVmb3JlIHlvdSBsYXkgdGhlIGRldG9uYXRvcnMgc28geW91IGRvbid0IHJ1bg0KICAgICB0aGUgcmlzayBvZiBnZXR0aW5nIGtpbGxlZCBieSB0aGVpciBsYWNrIG9mIHNraWxsLiAgSWYNCiAgICAgeW91J3JlIHdpbGxpbmcgdG8gcmlzayB0aGUgYmFkIEthcm1hIHRvIGJlIGEgbGl0dGxlDQogICAgIHNhZmVyLCB0aGlzIG1pZ2h0IGJlIHRoZSBjb3JyZWN0IG9wdGlvbiBmb3IgeW91Lg0KDQombHQ7USZndDsgIExlYXZlIFRoaXMgUGxhbmV0LiAgVGFrZSBvZmYgZnJvbSB0aGUgcGxhbmV0Lg0KDQombHQ7ISZndDsgIFBsYW5ldGFyeSBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUgZG9jdW1lbnRhdGlvbg0KICAgICBkZXNjcmliaW5nIHRoZSBQbGFuZXRhcnkgZnVuY3Rpb25zLg0KDQoNCkNJVEFERUwgTUVOVQ0KDQombHQ7QiZndDsgIFRyYW5zcG9ydGVyIENvbnRyb2wuICBIZXJlIGlzIHdoZXJlIHlvdSBnbyB0byBiZWFtIHlvdSBhbmQNCiAgICAgeW91ciBzaGlwIHRvIGFub3RoZXIgc2VjdG9yLiAgVGhlIHRyYW5zcG9ydGVyIHJhbmdlIGlzDQogICAgIGxpbWl0ZWQsIGJ1dCB3aXRoIGVub3VnaCBjcmVkaXRzLCB5b3UgY2FuIGFsc28gdXNlIHRoaXMNCiAgICAgb3B0aW9uIHRvIHVwZ3JhZGUgaXQncyByYW5nZS4NCg0KJmx0O0MmZ3Q7ICBFbmdhZ2UgU2hpcCdzIENvbXB1dGVyLiAgVXNlIHRoaXMgZnVuY3Rpb24gdG8gdXNlIGFsbA0KICAgICB5b3VyIENyYWkncyBwb3dlciBqdXN0IGFzIHlvdSB3b3VsZCBieSBjaG9vc2luZyAmbHQ7QyZndDsgZnJvbQ0KICAgICB0aGUgTWFpbiBNZW51Lg0KDQombHQ7RCZndDsgIERpc3BsYXkgVHJhZGVycyBIZXJlLiAgVGhpcyB3aWxsIHNob3cgeW91IHRoZSBndWVzdA0KICAgICByZWdpc3RlciBvZiB0aGUgb3RoZXIgcGxheWVycyB3aG8gYXJlIHBhcmtlZCBpbiB0aGUNCiAgICAgQ2l0YWRlbC4gIFRoZSByZWdpc3RlciBnaXZlcyB5b3UgdGhlIG5hbWUgb2YgdGhlIHBsYXllciwNCiAgICAgdGhlaXIgc2hpcCB0eXBlIGFuZCBob3cgbWFueSBmaWdodGVycywgc2hpZWxkcyBhbmQgaG9sZHMNCiAgICAgdGhleSBoYXZlLiAgVGhpcyBpbmZvcm1hdGlvbiBjb3VsZCBwcm92ZSB2ZXJ5IHVzZWZ1bCBpZg0KICAgICB5b3UgaGF2ZSBqdXN0IGNhcHR1cmVkIHRoZSBwbGFuZXQgZnJvbSBvbmUgb2YgeW91cg0KICAgICBvcHBvbmVudHMuDQoNCiZsdDtFJmd0OyAgRXhjaGFuZ2UgVHJhZGVyIFNoaXBzLiAgSWYgdGhlIG90aGVyIHBsYXllcnMgcGFya2VkIGluDQogICAgIHRoZSBDaXRhZGVsIGhhdmUgc3BlY2lmaWVkIHRoZWlyIHZlaGljbGUgYXMgYXZhaWxhYmxlIGZvcg0KICAgICB0cmFkZSwgdGhlbiB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIGV4Y2hhbmdpbmcgeW91ciBzaGlwDQogICAgIGZvciB0aGVpcnMuICBCZSBzdXJlIHRvIGNvb3JkaW5hdGUgdGhpcyBjYXJlZnVsbHkgd2l0aA0KICAgICB0aGUgb3RoZXIgbWVtYmVycyBvZiB5b3VyIGNvcnBvcmF0aW9uLiAgT25seSBDLkUuTy4ncyBjYW4NCiAgICAgdXNlIENvcnBvcmF0ZSBGbGFnc2hpcHMgc28gdGhleSBhcmUgbm90IGF2YWlsYWJsZSBmb3INCiAgICAgdHJhZGUuICBJZiB5b3UgaGF2ZSBzZWl6ZWQgdGhpcyBwbGFuZXQgZnJvbSBhbiBvcHBvbmVudA0KICAgICBzdGlsbCBwYXJrZWQgaW4gdGhlIENpdGFkZWwsIHlvdSBtYXkgd2FudCB0byBjb21tYW5kZWVyDQogICAgIGhpcyBzaGlwIGZvciB5b3VyIG93biB1c2UuDQoNCiZsdDtHJmd0OyAgU2hpZWxkIEdlbmVyYXRvciBDb250cm9sLiAgSWYgeW91IGhhdmUgeW91ciBsZXZlbCA1DQogICAgIENpdGFkZWwgY29tcGxldGVkLCB5b3UgY2FuIHVzZSB0aGlzIG9wdGlvbiB0byBzdG9yZSB5b3VyDQogICAgIHNoaWVsZHMuICBZb3UgdHJhbnNmZXIgeW91ciBTaGlwJ3Mgc2hpZWxkcyB0byB0aGUNCiAgICAgUGxhbmV0YXJ5IFNoaWVsZGluZyBTeXN0ZW0gdXNpbmcgdGhpcyBvcHRpb24gKDEwIHNoaXANCiAgICAgc2hpZWxkcyA9IDEgcGxhbmV0YXJ5IHNoaWVsZCkuICBTdG9yZWQgc2hpZWxkcyB3aWxsIGJlDQogICAgIHVzZWQgaW4gdGhlIGRlZmVuc2Ugb2YgeW91ciBwbGFuZXQuICBUaGUgUGxhbmV0YXJ5DQogICAgIFNoaWVsZGluZyBTeXN0ZW0gd2lsbCBwcm90ZWN0IHlvdXIgcGxhbmV0IGZyb20geW91cg0KICAgICBlbmVtaWVzLiAgWW91IHdpbGwgdGh3YXJ0IHlvdXIgcml2YWxzJyBhdHRlbXB0cyB0bw0KICAgICBpbmNhcGFjaXRhdGUgeW91ciBkZWZlbnNlcyB3aXRoIFBob3RvbiBNaXNzaWxlcy4gIFlvdXINCiAgICAgb3Bwb25lbnRzIHdpbGwgYmUgdW5hYmxlIHRvIHNjYW4geW91ciBwbGFuZXQuDQoNCiZsdDtJJmd0OyAgUGVyc29uYWwgSW5mby4gIFRoaXMgc2VsZWN0aW9uIHdpbGwgZW5hYmxlIHlvdSB0byBzZWUgYWxsDQogICAgIG9mIHlvdXIgY3VycmVudCBzdGF0aXN0aWNzLiAgVGhlIGluZm9ybWF0aW9uIHdpbGwgZGlzcGxheQ0KICAgICBzYW1lIGFzIGl0IGRvZXMgd2hlbiB5b3UgY2hvb3NlIG9wdGlvbiAmbHQ7SSZndDsgZnJvbSB0aGUgTWFpbg0KICAgICBNZW51Lg0KDQombHQ7TCZndDsgIFF1YXNhciBDYW5ub24gUi1sZXZlbC4gIFVzZSB0aGlzIG9wdGlvbiB0byBzZXQgYm90aCB0aGUNCiAgICAgQXRtb3NwaGVyaWMgYW5kIFNlY3RvciByZWFjdGlvbiBsZXZlbHMuICBUaGUgUXVhc2FyDQogICAgIENhbm5vbiBpbiB5b3VyIExldmVsIFRocmVlIENpdGFkZWwgdXNlcyBtYXNzaXZlIGFtb3VudHMNCiAgICAgb2YgRnVlbCBPcmUuICBVc2UgdGhpcyBvcHRpb24gdG8gYWRqdXN0IHRoZSBwZXJjZW50YWdlIG9mDQogICAgIE9yZSBvbiB0aGUgcGxhbmV0IHVzZWQgaW4gdGhpcyB3ZWFwb24ncyBjYXBhYmlsaXR5Lg0KICAgICBQTEVBU0UgTk9URTogVGhlIFF1YXNhciBDYW5ub24gd2lsbCB1c2UgdGhlIGVudGVyZWQNCiAgICAgcGVyY2VudGFnZSBvZiBGdWVsIE9yZSByZW1haW5pbmcgb24gdGhlIHBsYW5ldCBmb3IgRUFDSA0KICAgICBTSE9UIGl0IGZpcmVzLiAgSWYgeW91IHNldCB0aGUgU2VjdG9yIHZhbHVlIHRvIDEwMCUgYW5kDQogICAgIGEgU2NvdXQgTWFyYXVkZXIgd2l0aCA1IGZpZ2h0ZXJzIHdhbmRlcnMgaW50byB5b3VyDQogICAgIHNlY3RvciwgdGhlIENhbm5vbiB3aWxsIHVzZSBhbGwgdGhlIEZ1ZWwgT3JlIG9uIHlvdXINCiAgICAgcGxhbmV0IHRvIGJsb3cgdGhlIGludHJ1ZGVyIGludG8gc3BhY2UgZHVzdC4gIElmIGFub3RoZXINCiAgICAgcGxheWVyIGxhdGVyIHRyYW1wcyBpbnRvIHlvdXIgc2VjdG9yIGluIGEgd2VsbC1hcm1lZA0KICAgICBCYXR0bGVTaGlwIHlvdXIgQ2Fubm9uIHdpbGwgc2l0IGlkbGUgZHVlIHRvIGxhY2sgb2YNCiAgICAgYW1tdW5pdGlvbi4gIEFub3RoZXIgY29uc2lkZXJhdGlvbiB3aGVuIHNldHRpbmcgeW91cg0KICAgICBwZXJjZW50YWdlcyBpcyB0aGF0IHRoZSBhY2N1cmFjeSBvZiB0aGUgQ2Fubm9uIGlzIG11Y2gNCiAgICAgYmV0dGVyIGFuZCB0aGUgZGFtYWdlIGNhdXNlZCBieSB0aGUgYmxhc3QgaXMgZ3JlYXRlciB3aGVuDQogICAgIHRoZSB0YXJnZXQgaXMgaW4gdGhlIHBsYW5ldCdzIGF0bW9zcGhlcmUuDQoNCg0KJmx0O00mZ3Q7ICBNaWxpdGFyeSBSZWFjdGlvbiBMZXZlbC4gIEFub3RoZXIgbWV0aG9kIG9mIGN1c3RvbWl6aW5nDQogICAgIHlvdXIgcHJvdGVjdGlvbiwgdGhpcyB3aWxsIGxldCB5b3Ugc2V0IHRoZSBwZXJjZW50YWdlIG9mDQogICAgIGZpZ2h0ZXJzIHN0YXRpb25lZCB0aGVyZSB0byBiZSB1c2VkIGFzIG9mZmVuc2l2ZSBvcg0KICAgICBkZWZlbnNpdmUgaW4gY2FzZSBvZiBhbiBhdHRhY2sgb24gdGhlIHBsYW5ldC4gIFlvdSBtdXN0DQogICAgIGhhdmUgYSBDb21iYXQgQ29udHJvbCBDb21wdXRlciAoTGV2ZWwgVHdvIENpdGFkZWwgb3INCiAgICAgaGlnaGVyKSB0byB1c2UgdGhpcyBvcHRpb24uICBUaGUgdmFsdWUgeW91IGVudGVyIHdpbGwgYmUNCiAgICAgdGhlIHBlcmNlbnRhZ2Ugb2YgZmlnaHRlcnMgdGhhdCB3aWxsIGF0dGFjayBvZmZlbnNpdmVseQ0KICAgICBhcyBzb21lb25lIGF0dGVtcHRzIHRvIGxhbmQgb24geW91ciBwbGFuZXQuICBUaGUgYmFsYW5jZQ0KICAgICBvZiB5b3VyIGZpZ2h0ZXJzIHdpbGwgZmFsbCBiYWNrIGZvciBkZWZlbnNlIG9mIHRoZSBwbGFuZXQNCiAgICAgYW5kIENpdGFkZWwuDQoNCiZsdDtOJmd0OyAgSW50ZXJkaWN0b3IgQ29udHJvbC4gIElmIHlvdSBoYXZlIHVwZ3JhZGVkIHlvdXIgY2l0YWRlbCB0bw0KICAgICBsZXZlbCA2LCB0aGlzIHdpbGwgYWxsb3cgeW91IHRvIGNvbnRyb2wgdGhlIEludGVyZGljdG9yDQogICAgIGdlbmVyYXRvciBvbiB0aGUgcGxhbmV0LiAgICBZb3Ugd2lsbCB3YW50IHRvIHVzZSB0aGlzIGluDQogICAgIGNvbmp1bmN0aW9uIHdpdGggYSBRdWFzYXIgQ2Fubm9uLiAgSWYgdGhlIGdlbmVyYXRvciBpcyBvbiwNCiAgICAgYW4gZW5lbXkgc2hpcCBjYW5ub3QgbGVhdmUgdGhlIHNlY3Rvci4gIFRoaXMgZ2VuZXJhdG9yDQogICAgIGNvbnN1bWVzIGEgbG90IG9mIGZ1ZWwgb3JlIHdoZW4gdXNlZC4gIE1ha2Ugc3VyZSB5b3VyIFEtDQogICAgIGNhbm5vbiBpcyBzZXQgbW9zdCBjYXJlZnVsbHkuICBPdGhlcndpc2UsIHRoZSBlbmVteSBjYW4gdHJ5DQogICAgIHRvIGVzY2FwZSBhbmQgZGVwbGV0ZSBhbGwgdGhlIGZ1ZWwgb3JlIG9uIHlvdXIgcGxhbmV0Lg0KDQombHQ7UCZndDsgIFBsYW5ldGFyeSBUcmFuc1dhcnAuICBUaGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGlzIGZlYXR1cmUNCiAgICAgYXJlIGluIHlvdXIgTGV2ZWwgRm91ciBDaXRhZGVsLiAgUHJvdmlkZWQgeW91IGhhdmUgZW5vdWdoDQogICAgIEZ1ZWwgT3JlIHRvIHBvd2VyIHRoZSBtYW1tb3RoIGVuZ2luZSwgeW91IGNhbiBtb3ZlIHlvdXINCiAgICAgcGxhbmV0IHRvIGFueSBzZWN0b3Igd2hlcmUgeW91IGN1cnJlbnRseSBoYXZlIGZpZ2h0ZXJzDQogICAgIHN0YXRpb25lZC4NCg0KJmx0O1ImZ3Q7ICBSZW1haW4gSGVyZSBPdmVybmlnaHQuICBZb3UgY2FuIHNsZWVwIGZlZWxpbmcgc2FmZSBhbmQNCiAgICAgc2VjdXJlIGlmIHlvdSBiZWQgZG93biBpbnNpZGUgdGhlIENpdGFkZWwsIG91dCBvZiB0aGUgcmF0DQogICAgIHJhY2UuICBZb3Ugd2lsbCBoYXZlIHRoZSBwcm90ZWN0aW9uIG9mIHlvdXIgcGxhbmV0YXJ5DQogICAgIGZvcmNlcyB0byBndWFyZCB5b3UuICBXaGVuIHlvdSBsZWF2ZSB5b3VyIHNoaXAsIHRoZSB2YWxldA0KICAgICB3aWxsIGFzayBpZiB5b3Ugd2FudCBvdGhlcnMgd2hvIGVudGVyIHRoZSBDaXRhZGVsIHRvIGhhdmUNCiAgICAgdGhlIHByaXZpbGVnZSBvZiBleGNoYW5naW5nIHNoaXBzIHdpdGggeW91LiAgSXQncw0KICAgICBwZXJmZWN0bHkgd2l0aGluIHlvdXIgcmlnaHRzIHRvIGtlZXAgeW91ciBzaGlwIGZvcg0KICAgICBwZXJzb25hbCB1c2Ugb25seS4NCg0KJmx0O1MmZ3Q7ICBTY2FuIFRoaXMgU2VjdG9yLiAgVGhpcyBvcHRpb24gd2lsbCBsZXQgeW91IHNlZQ0KICAgICBldmVyeXRoaW5nIGluIHRoZSBzZWN0b3IgYXJvdW5kIHRoaXMgcGxhbmV0LiAgVGhlIGRpc3BsYXkNCiAgICAgd2lsbCBiZSB0aGUgc2FtZSBhcyB5b3UgZ2V0IGZyb20gb3B0aW9uICZsdDtEJmd0OyBpbiB0aGUgTWFpbg0KICAgICBNZW51Lg0KDQombHQ7VCZndDsgIFRyZWFzdXJ5IEZ1bmQgVHJhbnNmZXJzLiAgSWYgeW91IGRvbid0IGxpa2UgdG8gY2FycnkgYQ0KICAgICBsb3Qgb2YgY3JlZGl0cyBvbiB5b3Ugd2hlbiB5b3UncmUgb3V0IGV4cGxvcmluZyB0aGUNCiAgICAgdW5pdmVyc2UsIHlvdSBjYW4gZGVwb3NpdCB5b3VyIGV4Y2VzcyBpbiB0aGUgQ2l0YWRlbC4NCiAgICAgWW91IGNhbiB3aXRoZHJhdyB0aGUgY3JlZGl0cyB3aGVuZXZlciB5b3UgbmVlZCB0aGVtLiAgQmUNCiAgICAgYWR2aXNlZCB0aGF0IHRoZSBUcmVhc3VyeSB3b3JrZXJzIGFyZSBxdWl0ZSBsYXggaW4gdGhlaXINCiAgICAgc2VjdXJpdHkgbWVhc3VyZXMgYW5kIGFueW9uZSB3aG8gZW50ZXJzIHRoZSBDaXRhZGVsIGNhbg0KICAgICB3aXRoZHJhdyBhbnkgYW5kIGFsbCBvZiB0aGUgY3JlZGl0cy4NCg0KJmx0O1UmZ3Q7ICBVcGdyYWRlIENpdGFkZWwuICBPbmNlIHlvdXIgQ2l0YWRlbCBjb25zdHJ1Y3Rpb24gaXMNCiAgICAgY29tcGxldGUsIHlvdSBtYXkgZmluZCB5b3Ugd2lzaCB0byB1cGdyYWRlLiAgVmVyeSBmZXcNCiAgICAgcGVvcGxlIGFyZSBjb250ZW50IHdpdGggYSBMZXZlbCBPbmUgQ2l0YWRlbC4gIFlvdSB3aWxsDQogICAgIG5lZWQgbW9yZSBjb2xvbmlzdHMgYW5kIG1hdGVyaWFscyBmb3IgZWFjaCBsZXZlbCBvZg0KICAgICBpbXByb3ZlbWVudHMuICBMZXZlbCBUd28gaGFzIGEgQ29tYmF0IENvbnRyb2wgU3lzdGVtDQogICAgIHdoaWNoIGVuYWJsZXMgeW91IHRvIHNldCB0aGUgZmlnaHRlcnMgZGVwbG95ZWQgb24gdGhlDQogICAgIHBsYW5ldCBhcyBvZmZlbnNpdmUgb3IgZGVmZW5zaXZlLiAgTGV2ZWwgVGhyZWUgY29udGFpbnMNCiAgICAgYSBRdWFzYXIgQ2Fubm9uIHdoaWNoIGlzIGEgdmVyeSBwb3dlcmZ1bCB3ZWFwb24sIGJ1dCB1c2VzDQogICAgIGEgY29uc2lkZXJhYmxlIGFtb3VudCBvZiBGdWVsIE9yZSB0byBvcGVyYXRlLiAgTGV2ZWwgRm91cg0KICAgICBlbmNsb3NlcyB0aGUgbWFzc2l2ZSBlbmdpbmUgdXNlZCBmb3IgdGhlIFRyYW5zV2FycCBEcml2ZS4NCiAgICAgTGV2ZWwgRml2ZSBwcm92aWRlcyB0aGUgcG93ZXIgZm9yIHRoZSBQbGFuZXRhcnkgU2hpZWxkaW5nDQogICAgIFN5c3RlbS4gIFRoZSBQU1Mgd2lsbCBwcm92aWRlIGEgc3R1cmR5IHNoaWVsZCBmb3IgeW91cg0KICAgICBwbGFuZXQgd2hpY2ggeW91ciBlbmVtaWVzIHdpbGwgaGF2ZSBhIGhhcmQgdGltZQ0KICAgICBwZW5ldHJhdGluZyB3aXRoIGZpZ2h0ZXJzIG9yIHBob3RvbiBtaXNzaWxlcy4gIExldmVsIDYNCiAgICAgZXF1aXBzIHRoZSBwbGFuZXQgd2l0aCBhbiBJbnRlcmRpY3RvciBHZW5lcmF0b3IuICBJZiB0dXJuZWQNCiAgICAgb24sIHRoaXMgZ2VuZXJhdG9yIHdpbGwgbWFrZSBpdCBpbXBvc3NpYmxlIGZvciB5b3VyIGVuZW15IHRvDQogICAgIGVzY2FwZSBmcm9tIHlvdXIgUXVhc2FyIENhbm5vbi4NCg0KJmx0O1YmZ3Q7ICBFdmljdCBPdGhlciBUcmFkZXJzLiAgTm93IHRoYXQgeW91J3ZlIHN1cnZpdmVkIGFsbCB0aGUNCiAgICAgZGVmZW5zZXMgeW91ciBvcHBvbmVudCBwbGFjZWQgdG8ga2VlcCB5b3Ugb3V0LCB5b3Ugc2hvdWxkDQogICAgIGJlIGFibGUgdG8gY29tZSBpbiBhbmQgdGFrZSBvdmVyLCByaWdodD8gIE9jY2FzaW9uYWxseQ0KICAgICB5b3UgZ28gaW50byBhIG5ld2x5IGNhcHR1cmVkIENpdGFkZWwgb25seSB0byBmaW5kIHRoZQ0KICAgICB0cmFkZXIgKG9yIHRyYWRlcnMpIHdobyBwcmV2aW91c2x5IGNvbnRyb2xsZWQgdGhlIHBsYW5ldC4NCiAgICAgTm8gbmVlZCB0byBoYXZlIHRoZW0gaW4geW91ciB3YXkuICBTaW1wbHkgc2VsZWN0IHRoaXMNCiAgICAgb3B0aW9uIHRvIGFjdGl2YXRlIHRoZSBFbWVyZ2VuY3kgV2FybmluZyBTeXN0ZW0gaW4gdGhlDQogICAgIENpdGFkZWwuICBJdCB3aWxsIGFsZXJ0IHRoZXNlIHVud2FudGVkIGd1ZXN0cyB0byBzb21lDQogICAgIGltcGVuZGluZyBkb29tIGFuZCB0aGVpciBzaGlwcyB3aWxsIGJsYXN0IG9mZiBpbnRvIG9yYml0DQogICAgIGFyb3VuZCB0aGUgcGxhbmV0LiAgVGhlIHN5c3RlbSB3aWxsIGxpc3QgdGhlIHRyYWRlcnMgYXMNCiAgICAgdGhleSBlc2NhcGUuICBZb3UgdGhlbiBtYXkgZWl0aGVyIHN0YXkgaW4gdGhlIENpdGFkZWwgb3V0DQogICAgIG9mIGhhcm0ncyB3YXkgb3IgeW91IGNhbiBnbyBvdXQgaW50byB0aGUgc2VjdG9yIHRvDQogICAgIGluZmxpY3QgbW9yZSBkYW1hZ2Ugb24geW91ciBlbmVteS4NCg0KJmx0O1gmZ3Q7ICBDb3Jwb3JhdGlvbiBNZW51LiAgVGhpcyBvcHRpb24gaXMgdGhlIHNhbWUgYXMgb3B0aW9uICZsdDtUJmd0Ow0KICAgICBmcm9tIHRoZSBNYWluIE1lbnUuDQoNCiZsdDshJmd0OyAgQ2l0YWRlbCBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUgZG9jdW1lbnRhdGlvbg0KICAgICBkZXNjcmliaW5nIHRoZSBDaXRhZGVsIGZ1bmN0aW9ucy4NCg0KJmx0O1EmZ3Q7ICBMZWF2ZSB0aGUgQ2l0YWRlbC4gIEV4aXQgdGhlIENpdGFkZWwgYW5kIHJldHVybiB0byB0aGUNCiAgICAgcGxhbmV0Lg0KDQoNCkNPUlBPUkFUSU9OIE1FTlUNCg0KJmx0O0QmZ3Q7ICBEaXNwbGF5IENvcnBvcmF0aW9ucy4gIElmIHlvdSB3YW50IHRvIHNlZSBob3cgeW91IGFuZA0KICAgICB5b3VyIGNvcnBvcmF0aW9uIGNvbXBhcmUgd2l0aCBvdGhlcnMgaW4gdGhlIGdhbWUgb3IgaWYNCiAgICAgeW91IHdhbnQgdG8gc2VlIHdobyB0aGUgbWVtYmVycyBhcmUgb2YgYSBzcGVjaWZpYw0KICAgICBjb3Jwb3JhdGlvbiwgdXNlIHRoaXMgc2VsZWN0aW9uLiAgWW91IHdpbGwgYXNrZWQgaWYgeW91DQogICAgIHdhbnQgdG8gTGlzdCBDb3Jwb3JhdGlvbnMgb3IgUmFuayBDb3Jwb3JhdGlvbnMuICBMIHdpbGwNCiAgICAgZ2l2ZSB5b3UgYSBsaXN0aW5nIG9mIGFsbCBjb3Jwb3JhdGlvbnMgcmVnaXN0ZXJlZCBhdA0KICAgICBGZWRlcmF0aW9uIEhhbGwgc2hvd2luZyB0aGUgY29ycG9yYXRpb24ncyByZWdpc3RyYXRpb24NCiAgICAgbnVtYmVyIGFuZCB0aGUgZGF0ZSBvZiBpbmNvcnBvcmF0aW9uIGFuZCBhbGwgY29ycG9yYXRlDQogICAgIG1lbWJlcnMgd2l0aCB0aGUgQy5FLk8uIGxhYmVsZWQuICBSIHdpbGwgZGlzcGxheSBhIGxpc3QNCiAgICAgb2YgYWxsIGNvcnBvcmF0aW9ucyByYW5rZWQgYnkgZXhwZXJpZW5jZS4gIFRoZSBsaXN0IHNob3dzDQogICAgIHRoZSByYW5rLCB0aGUgY29ycG9yYXRlIHJlZ2lzdHJhdGlvbiBudW1iZXIgYW5kIG5hbWUsIHRoZQ0KICAgICBDLkUuTy4ncyBuYW1lLCB0aGUgY29ycG9yYXRlIGFsaWdubWVudCBhbmQgdGhlIGNvcnBvcmF0ZQ0KICAgICBleHBlcmllbmNlLg0KDQombHQ7SiZndDsgIEpvaW4gYSBDb3Jwb3JhdGlvbi4gIFdoZW4geW91IHdhbnQgdG8gam9pbiBmb3JjZXMgd2l0aCBhDQogICAgIGNvcnBvcmF0aW9uIG9mIHRoZSBvdGhlciB0cmFkZXJzLCB5b3Ugd2lsbCBuZWVkIHRvIG1ha2UNCiAgICAgYXJyYW5nZW1lbnRzIHRvIGdldCB5b3VyIGNvcnBvcmF0ZSBzZWN1cml0eSBwYXNzLiAgV2hlbg0KICAgICBhIG1lbWJlciBvZiB0aGF0IGNvcnBvcmF0aW9uIGhhcyBhcHByb3ZlZCB5b3VyDQogICAgIG1lbWJlcnNoaXAsIHVzZSB0aGlzIG9wdGlvbiB0byBqb2luLiAgWW91IHdpbGwgbmVlZCB0byBiZQ0KICAgICBvZiB0aGUgc2FtZSBhbGlnbm1lbnQgYXMgdGhlIEMuRS5PLiAgSWYgYXQgYW55IHRpbWUNCiAgICAgZHVyaW5nIHlvdXIgdGVudXJlIHdpdGggdGhlIGNvcnBvcmF0aW9uLCB5b3VyIGFsaWdubWVudA0KICAgICBpcyBvcHBvc2l0ZSB0aGF0IG9mIHRoZSBDaGFpcm1hbiwgeW91IHdpbGwgYmUNCiAgICAgYXV0b21hdGljYWxseSBvdXN0ZWQgZnJvbSB0aGUgQ29ycG9yYXRpb24uDQoNCiZsdDtNJmd0OyAgTWFrZSBhIE5ldyBDb3Jwb3JhdGlvbi4gIFdoZW4geW91IGFyZSBwcmVwYXJlZCB0byBtYWtlIHRvDQogICAgIG1vdmUgZnJvbSBpbmRlcGVuZGVudCB0cmFkZXIgdG8gQ29ycG9yYXRlIEMuRS5PLiwgdGhpcw0KICAgICBvcHRpb24gd2lsbCBmaWxlIHlvdXIgQ29ycG9yYXRlIENoYXJ0ZXIgaW4gdGhlDQogICAgIEZlZGVyYXRpb24ncyBIYWxsIG9mIFJlY29yZHMuICBBcyBDLkUuTy4geW91IHdpbGwgaGF2ZQ0KICAgICBwcml2aWxlZ2VzIHRoYXQgb3RoZXIgcGxheWVycyBkb24ndCBoYXZlIHN1Y2ggYXMgb3duaW5nDQogICAgIGFuIENvcnBvcmF0ZSBGbGFnc2hpcCBhbmQgc2VuZGluZyBDb3Jwb3JhdGUgTWVtb3MgdG8gYWxsDQogICAgIG1lbWJlcnMgb2YgeW91ciBDb3Jwb3JhdGlvbi4gIFlvdSB3aWxsIGJlIHRoZSBvbmUgdG8NCiAgICAgZGV0ZXJtaW5lIHdoZXRoZXIgeW91ciBDb3Jwb3JhdGlvbiBpcyBnb29kIG9yIGV2aWwuICBBcw0KICAgICB5b3UgZ28sIHNvIGdvZXMgdGhlIENvcnBvcmF0aW9uLiAgQSBwcm9zcGVjdGl2ZSBtZW1iZXINCiAgICAgd2lsbCBoYXZlIHRvIGJlIG9mIHRoZSBzYW1lIGFsaWdubWVudCBhcyB5b3UgdG8gam9pbi4NCg0KJmx0OyEmZ3Q7ICBDb3Jwb3JhdGlvbiBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUNCiAgICAgZG9jdW1lbnRhdGlvbiBkZXNjcmliaW5nIHRoZSBDb3Jwb3JhdGlvbiBmdW5jdGlvbnMuDQoNCiZsdDtRJmd0OyAgUXVpdCBDb3Jwb3JhdGlvbiBNZW51LiAgUmV0dXJuIHRvIHRoZSBnYW1lLg0KDQpDb3Jwb3JhdGlvbnMgT25seQ0KDQombHQ7QyZndDsgIENyZWRpdCBUcmFuc2Zlci4gIFVzZSB0aGlzIG9wdGlvbiB0byB0cmFuc2ZlciBjcmVkaXRzIHRvDQogICAgIG9yIGZyb20geW91ciBjb3Jwb3JhdGUgYXNzb2NpYXRlLiAgWW91IGhhdmUgdG8gYmUgaW4gdGhlDQogICAgIHNhbWUgc2VjdG9yIGFzIHRoZSBjb3Jwb3JhdGlvbiBtZW1iZXIgd2l0aCB3aG9tIHlvdSB3YW50DQogICAgIHRvIGV4Y2hhbmdlIGNyZWRpdHMuDQoNCiZsdDtGJmd0OyAgRmlnaHRlciBUcmFuc2Zlci4gIFVzZSB0aGlzIG9wdGlvbiB0byB0cmFuc2ZlciBmaWdodGVycw0KICAgICB0byBvciBmcm9tIHlvdXIgY29ycG9yYXRlIGFzc29jaWF0ZS4gIFlvdSBoYXZlIHRvIGJlIGluDQogICAgIHRoZSBzYW1lIHNlY3RvciBhcyB0aGUgY29ycG9yYXRpb24gbWVtYmVyIHdpdGggd2hvbSB5b3UNCiAgICAgd2FudCB0byBleGNoYW5nZSBmaWdodGVycy4NCg0KJmx0O0gmZ3Q7ICBNaW5lcyBUcmFuc2Zlci4gIFVzZSB0aGlzIG9wdGlvbiB0byB0cmFuc2ZlciBtaW5lcyB0byBvcg0KICAgICBmcm9tIHlvdXIgY29ycG9yYXRlIGFzc29jaWF0ZS4gIFlvdSBoYXZlIHRvIGJlIGluIHRoZQ0KICAgICBzYW1lIHNlY3RvciBhcyB0aGUgY29ycG9yYXRpb24gbWVtYmVyIHdpdGggd2hvbSB5b3Ugd2FudA0KICAgICB0byBleGNoYW5nZSBtaW5lcy4NCg0KJmx0O1MmZ3Q7ICBTaGllbGRzIFRyYW5zZmVyLiAgVXNlIHRoaXMgb3B0aW9uIHRvIHRyYW5zZmVyIHNoaWVsZHMgdG8NCiAgICAgb3IgZnJvbSB5b3VyIGNvcnBvcmF0ZSBhc3NvY2lhdGUuICBZb3UgaGF2ZSB0byBiZSBpbiB0aGUNCiAgICAgc2FtZSBzZWN0b3IgYXMgdGhlIGNvcnBvcmF0aW9uIG1lbWJlciB3aXRoIHdob20geW91IHdhbnQNCiAgICAgdG8gZXhjaGFuZ2Ugc2hpZWxkcy4NCg0KJmx0O1gmZ3Q7ICBMZWF2ZSBZb3VyIENvcnBvcmF0aW9uLiAgVGhlcmUgbWF5IGNvbWUgYSB0aW1lIHdoZW4geW91DQogICAgIGZlZWwgeW91IGhhdmUgdG8gbWFrZSBhIGJyZWFrIHdpdGggeW91ciBjdXJyZW50DQogICAgIGNvcnBvcmF0aW9uLiAgWW91IG1heSB3YW50IHRvIGZvcm0geW91ciBvd24gbmV3DQogICAgIGNvcnBvcmF0aW9uLiAgWW91IG1heSB3YW50IHRvIHBsYXkgdGhlIGdhbWUgd2l0aCBhbg0KICAgICBhbGlnbm1lbnQgZGlmZmVyZW50IGZyb20gdGhhdCBvZiB5b3VyIGNvcnBvcmF0aW9uJ3MNCiAgICAgbWVtYmVycy4gIFRoaXMgd2lsbCBhbGxvdyB5b3UgdG8gdmFjYXRlIHlvdXIgcG9zaXRpb24gaW4NCiAgICAgeW91ciBjb3Jwb3JhdGlvbi4gIFJlbWVtYmVyIHRoYXQgeW91IHdpbGwgbm8gbG9uZ2VyIGhhdmUNCiAgICAgYWNjZXNzIHRvIGFueSBvZiB0aGUgY29ycG9yYXRpb24ncyBhc3NldHMuICBJZiB5b3UgYXJlDQogICAgIHRoZSBDLkUuTy4gdGhlIGNvcnBvcmF0aW9uIHdpbGwgYmUgZGlzc29sdmVkIGFuZCBhbGwNCiAgICAgY29ycG9yYXRlIGZpZ2h0ZXJzIHdpbGwgYmVjb21lIHJvZ3VlIG1lcmNlbmFyaWVzLg0KDQombHQ7TCZndDsgIExpc3QgQ29ycG9yYXRlIFBsYW5ldHMuICBUaGlzIHdpbGwgZGlzcGxheSBhIGRldGFpbGVkDQogICAgIGdyYXBoIG9mIHlvdXIgY29ycG9yYXRpb24ncyBwbGFuZXRzLiAgVGhlIGluZm9ybWF0aW9uDQogICAgIGluY2x1ZGVzDQogICAgIC10aGUgc2VjdG9yIHdoZXJlIHRoZSBwbGFuZXQgaXMgbG9jYXRlZA0KICAgICAtdGhlIHBsYW5ldCdzIG5hbWUNCiAgICAgLXRoZSBjdXJyZW50IHBvcHVsYXRpb24NCiAgICAgLXRoZSBwcm9kdWN0aW9uIHJhdGUgZm9yIEZ1ZWwgT3JlLCBPcmdhbmljcyBhbmQgRXF1aXBtZW50DQogICAgIC10aGUgY3VycmVudCBpbnZlbnRvcmllcyBvZiB0aGUgY29tbW9kaXRpZXMNCiAgICAgLXRoZSBudW1iZXIgb2YgZmlnaHRlcnMgc3RhdGlvbmVkIHRoZXJlDQogICAgIC10aGUgbGV2ZWwgb2YgdGhlIENpdGFkZWwgKGlmIGFueSkNCiAgICAgLXRoZSBudW1iZXIgb2Ygc2hpZWxkcyAoaWYgYW55KQ0KICAgICAtdGhlIGFtb3VudCBvZiBjcmVkaXRzIGluIHRoZSBDaXRhZGVsIChpZiBhbnkpDQoNCiZsdDtBJmd0OyAgU2hvdyBjb3Jwb3JhdGUgQXNzZXRzIGFuZCBNZW1iZXIgTG9jYXRpb25zLiAgVGhpcyBpcyBhDQogICAgIHZlcnkgaGFuZHkgdG9vbCB0byB1c2UgaW4gb3JnYW5pemluZyB5b3VyIHN0cmF0ZWd5IHdpdGgNCiAgICAgdGhhdCBvZiB0aGUgb3RoZXJzIGluIHlvdXIgQ29ycG9yYXRpb24uICBUaGUgaW5mb3JtYXRpb24NCiAgICAgc2hvd24gb24gdGhpcyBkaXNwbGF5IGlzDQogICAgIC10aGUgQ29ycG9yYXRpb24gbWVtYmVyJ3MgbmFtZQ0KICAgICAtdGhlIHNlY3RvciB3aGVyZSB0aGF0IG1lbWJlciBpcyBsb2NhdGVkDQogICAgIC13aGV0aGVyIG9yIG5vdCB0aGUgbWVtYmVyIGlzIG9uIGEgcGxhbmV0IGluIHRoYXQgc2VjdG9yDQogICAgIC10aGUgbnVtYmVyIG9mIGZpZ2h0ZXJzLCBzaGllbGRzLCBtaW5lcyBhbmQgY3JlZGl0cyBvbg0KICAgICAgaGltL2hlcg0KDQpDLkUuTy4ncyBPbmx5DQoNCiZsdDtUJmd0OyAgU2VuZCBDb3Jwb3JhdGUgTWVtby4gIFdoZW4geW91IHdhbnQgdG8gZ2l2ZSBpbmZvcm1hdGlvbg0KICAgICB0byBhbGwgdGhvc2UgaW4geW91ciBvcmdhbml6YXRpb24sIHVzZSB0aGlzIG9wdGlvbi4NCiAgICAgV2hldGhlciBpdCBpcyBpbnN0cnVjdGlvbnMgb24gd2hlcmUgeW91IHdhbnQgdG8gZXN0YWJsaXNoDQogICAgIGEgbmV3IGNvbG9ueSBvciBhIGNvbmdyYXR1bGF0b3J5IGRpc3BhdGNoIGZvciBhIGpvYiB3ZWxsDQogICAgIGRvbmUsIHlvdSBjYW4gc2VuZCB5b3VyIG1lc3NhZ2UgcXVpY2tseSBhbmQgZWZmaWNpZW50bHkuDQoNCiZsdDtQJmd0OyAgQ29ycG9yYXRlIFNlY3VyaXR5LiAgSW4gYSB3b3JsZCB3aGVyZSBpbnN0YW5jZXMgb2YNCiAgICAgY29tcHV0ZXIgY3JpbWUgcnVuIHJhbXBhbnQsIGEgQy5FLk8uIGNhbiBuZXZlciBiZSB0b28NCiAgICAgY2FyZWZ1bC4gIEJlIHN1cmUgeW91IHRydXN0IGEgcGxheWVyIGJlZm9yZSB5b3UgbGV0IGhpbQ0KICAgICBvciBoZXIgaW4geW91ciBvcmdhbml6YXRpb24uICBBbmQganVzdCBhcyB3aXRoIHlvdXIgQkJTDQogICAgIGFjY291bnQsIHlvdSBjYW4gYmV0dGVyIG1haW50YWluIHNlY3VyaXR5IGlmIHlvdSBjaGFuZ2UNCiAgICAgcGFzc3dvcmRzIG9jY2FzaW9uYWxseS4NCg0KJmx0O1ImZ3Q7ICBEcm9wIENvcnBvcmF0ZSBNZW1iZXIuICBEbyB5b3UgaGF2ZSBhIHByb2JsZW0gd2l0aCBhDQogICAgIG1lbWJlciBvZiB5b3VyIENvcnBvcmF0aW9uPyAgSXMgdGhhdCBtZW1iZXIgc2hvd2luZyBzaWducw0KICAgICBvZiBpbnN1Ym9yZGluYXRpb24/ICBZb3UgZG9uJ3QgaGF2ZSB0byBwdXQgdXAgd2l0aCB0aGUNCiAgICAgc3RyZXNzLiAgU2ltcGx5IGRyb3AgdGhpcyB0cm91YmxlIG1ha2VyLiAgUmVtZW1iZXIgdGhhdA0KICAgICB0aGUgbWVtYmVyIGNhbiB0YWtlIGFueSBjb3Jwb3JhdGUgYXNzZXRzIG9uIGhpcy9oZXIgc2hpcA0KICAgICB3aGVuIGtpY2tlZCBvdXQuDQoNCg0KU1RBUkRPQ0sgTUVOVQ0KDQombHQ7QyZndDsgIFRoZSBDaW5lUGxleCBWaWRlb24gVGhlYXRyZXMuICBZb3UgY2FuIHNtZWxsIHRoZSBwb3Bjb3JuDQogICAgIGZyb20gdGhlIEhhcmR3YXJlIEVtcG9yaXVtLiAgQ29tZSByaWdodCBpbiB0byBzZWUgdGhlDQogICAgIGxhdGVzdCByZWxlYXNlcyBmcm9tIEhvbGx5V29ybGQuICBZb3UgY2FuIGNob29zZSBmcm9tDQogICAgIHNldmVyYWwgZmlyc3QtcnVuIG9mZmVyaW5ncyBvciB5b3UgY2FuIG9wdCBmb3Igb25lIG9mIHRoZQ0KICAgICBjbGFzc2ljcy4gIERvbid0IHRha2UgdG9vIGxvbmcgdG8gbWFrZSB1cCB5b3VyIG1pbmQNCiAgICAgYmVjYXVzZSB0aGVyZSBhcmUgb3RoZXJzIHdhaXRpbmcgaW4gbGluZSBiZWhpbmQgeW91Lg0KDQombHQ7RyZndDsgIFRoZSAybmQgTmF0aW9uYWwgR2FsYWN0aWMgQmFuay4gIEhlcmUgaXMgdGhlIHBsYWNlIHRvDQogICAgIGVuZ2FnZSBpbiBtYXR0ZXJzIG9mIGhpZ2ggZmluYW5jZS4gIFlvdSB3aWxsIGJlIGFibGUgdG8NCiAgICAgcHV0IGNyZWRpdHMgaW50byB5b3VyIG9yIGFub3RoZXIgdHJhZGVyJ3MgYWNjb3VudC4gIFlvdQ0KICAgICBjYW4gdGFrZSBjcmVkaXRzIG91dCBvZiB5b3VyIGFjY291bnQuICBZb3UgY2FuIGV4YW1pbmUNCiAgICAgdGhlIGJhbGFuY2UgaW4geW91ciBhY2NvdW50LiAgVGhlIGJhbmsgYWxsb3dzIG9ubHkNCiAgICAgcGVyc29uYWwgYWNjb3VudHMuICBDb3Jwb3JhdGUgZnVuZHMgc2hvdWxkIGJlIHN0b3JlZCBpbg0KICAgICBzZWN1cmVkIENpdGFkZWxzLg0KDQombHQ7SCZndDsgIFRoZSBTdGVsbGFyIEhhcmR3YXJlIEVtcG9yaXVtLiAgVGhpcyBpcyB0aGUgR2VuZXJhbCBTdG9yZQ0KICAgICBvZiB0aGUgVHJhZGUgV2FycyBVbml2ZXJzZS4gIElmIHlvdSB3YW50IGl0LCB0aGV5IGhhdmUgaXQNCiAgICAgYW5kIGlmIHlvdSBoYXZlIGVub3VnaCBtb25leSwgdGhleSdsbCBzZWxsIGl0IHRvIHlvdS4NCg0KJmx0O1AmZ3Q7ICBUaGUgRmVkZXJhbCBTcGFjZSBQb2xpY2UgSFEuICBUaGUgaG9tZSBvZiBsYXcgZW5mb3JjZW1lbnQNCiAgICAgaW4gdGhlIGdhbGF4eS4gIEhlcmUgeW91IGNhbiByZWdpc3RlciBjb21wbGFpbnRzIGFnYWluc3QNCiAgICAgb3RoZXIgcGxheWVycywgY29sbGVjdCByZXdhcmRzIG9yIHNlZSB0aGUgd2FudGVkIHBvc3RlcnMuDQoNCiZsdDtTJmd0OyAgVGhlIEZlZGVyYXRpb24gU2hpcHlhcmRzLiAgVGhpcyBpcyB0aGUgcGxhY2Ugd2hlcmUgeW91DQogICAgIGNhbiB0cmFkZSB5b3VyIHNoaXAgaW4gZm9yIGEgbmV3ZXIgbW9kZWwgb3Igc2VsbCBvZmYgc29tZSBvZg0KICAgICB0aG9zZSBqdW5rIHNoaXBzIHlvdSd2ZSBnYXRoZXJlZCBhcyBzcG9pbHMgZnJvbSB5b3VyDQogICAgIHZpY3Rvcmllcy4gIFlvdSBjYW4gc2VlIGFsbCB0aGUgbW9kZWxzIGF2YWlsYWJsZSBhbmQgYWxsIHRoZQ0KICAgICBzcGVjaWZpY2F0aW9ucyBmb3IgZWFjaCBzdHlsZS4NCg0KJmx0O1QmZ3Q7ICBUaGUgTG9zdCBUcmFkZXIncyBUYXZlcm4uICBUcmFkZXJzIGNvbWUgaGVyZSBmb3IgbW9yZQ0KICAgICB0aGFuIGp1c3QgYSBkcmluayBhbmQgYSBtZWFsLiAgU29tZSBvZiB0aGUgbW9yZQ0KICAgICBpbnRlcmVzdGluZyBmZWF0dXJlcyBvZiB0aGlzIGdhbWUgY2FuIGJlIGZvdW5kIGhlcmUgaWYNCiAgICAgeW91IGFzayB0aGUgcmlnaHQgcXVlc3Rpb25zLg0KDQombHQ7ISZndDsgIFN0YXJEb2NrIEhlbHAuICBEaXNwbGF5IHRoZSBwb3J0aW9uIG9mIHRoZSBkb2N1bWVudGF0aW9uDQogICAgIGRlc2NyaWJpbmcgdGhlIFN0YXJEb2NrIGZ1bmN0aW9ucy4NCg0KJmx0O1EmZ3Q7ICBSZXR1cm4gdG8gWW91ciBTaGlwIGFuZCBMZWF2ZS4gIExlYXZlIHRoZSBTdGFyZG9jayBhbmQNCiAgICAgcmV0dXJuIHRvIHRoZSBzZWN0b3IuDQoNCg0KSEFSRFdBUkUgTUVOVQ0KDQombHQ7QSZndDsgIEF0b21pYyBEZXRvbmF0b3JzLiAgVGhlc2UgZGV0b25hdG9ycyBhcmUgdXNlZCBpbiB0aGUNCiAgICAgZGVzdHJ1Y3Rpb24gb2YgcGxhbmV0cy4gIElmIHlvdSBkb24ndCBoYXZlIGVub3VnaA0KICAgICBtaWxpdGFyeSB0byB0YWtlIG91dCBhIHBsYW5ldCwgeW91IGNhbiBzZXQgQXRvbWljDQogICAgIERldG9uYXRvcnMgYW5kIHJ1biBsaWtlIGhlbGwuICBXYXJuaW5nOiBjb2xvbmlzdHMgaGF2ZQ0KICAgICBiZWVuIHRyYWluZWQgdG8gZGlzYXJtIHRoZXNlIGRldG9uYXRvcnMuICBUaGVzZSB1bml0cyBhcmUNCiAgICAgYXMgdW5zdGFibGUgYXMgdGhleSBhcmUgcG93ZXJmdWwuICBUaGV5IGNhbiByZWFjdCBsaWtlDQogICAgIENvcmJvbWl0ZSBEZXZpY2VzIHdoZW4gYW4gZW5lbXkgYXR0YWNrcyB5b3VyIHNoaXAsIGFuZA0KICAgICB0aGV5IGNhbiBhbHNvIGRldG9uYXRlIGJ5IGhpdHRpbmcgbWluZXMgb3Igb2ZmZW5zaXZlDQogICAgIGZpZ2h0ZXJzIGFzIHlvdSBqb3VybmV5IHRocm91Z2ggdGhlIGdhbGF4eS4NCg0KJmx0O0ImZ3Q7ICBNYXJrZXIgQmVhY29ucy4gIE1hcmtlciBCZWFjb25zIGFyZSB0aGUgYmlsbGJvYXJkcyBvZiB0aGUNCiAgICAgVHJhZGUgV2FycyB1bml2ZXJzZS4gIFRoZXkgYXJlIGFuIGluZXhwZW5zaXZlIHdheSB0byBtYWtlDQogICAgIGEgc3RhdGVtZW50LiAgVGhleSBzdGF5IGluIHRoZSBzZWN0b3Igd2hlcmUgdGhleSBhcmUNCiAgICAgbGF1bmNoZWQgdW50aWwgdGhleSBhcmUgZGVzdHJveWVkLiAgVGhleSBoYXZlIGFic29sdXRlbHkNCiAgICAgbm8gZGVmZW5zaXZlIGNhcGFiaWxpdHkuICBUaGV5IGFyZSBzbyBmcmFnaWxlIHRoYXQgaWYgdHdvDQogICAgIGFyZSBsYXVuY2hlZCBpbiB0aGUgc2FtZSBzZWN0b3IsIHRoZXkgYm90aCBleHBsb2RlLg0KDQombHQ7QyZndDsgIENvcmJvbWl0ZSBEZXZpY2VzLiAgQ29yYm9taXRlIGRldmljZXMgYXJlIHdlYXBvbnMgdG8NCiAgICAgYXZlbmdlIHRoZSBkZXN0cnVjdGlvbiBvZiB5b3VyIHNoaXAuICBJZiBvbmUgb2YgeW91cg0KICAgICBvcHBvbmVudHMgc3VjY2VlZHMgaW4gb2JsaXRlcmF0aW5nIHlvdXIgY3JhZnQsIHRoYXQNCiAgICAgcGVyc29uIG1heSBzdWZmZXIgc3Vic3RhbnRpYWwgZGFtYWdlIGFzIHdlbGwgd2hlbiB5b3VyDQogICAgIHNoaXAgaXMgZXF1aXBwZWQgd2l0aCBvbmUgb3IgbW9yZSBvZiB0aGVzZS4gIENvcmJvbWl0ZQ0KICAgICBkZXZpY2VzIGNhbiBhbHNvIGJlIHZpZXdlZCBhcyBwcm90ZWN0aW9uLiAgWW91ciBlbmVtaWVzDQogICAgIG1heSB0aGluayB0d2ljZSBhYm91dCBhdHRhY2tpbmcgeW91IGlmIHlvdSBhcmUgYXJtZWQgd2l0aA0KICAgICB0aGVzZS4gIFdpdGggZWFjaCBhZGRpdGlvbmFsIGRldmljZSB5b3UgYWRkIHRvIHlvdXINCiAgICAgdmVzc2VsLCB5b3UgaW5jcmVhc2UgeW91ciBwcm90ZWN0aW9uIGxldmVsLiAgWW91IGNhbiBoYXZlDQogICAgIHVwIHRvIGEgTGV2ZWwgMTUwMCBDb3Jib21pdGUgRGV2aWNlIG9uIHNvbWUgc2hpcHMgYW5kIHRoZQ0KICAgICBuaWNlIHBhcnQgaXMsIHlvdXIgZm9lIGhhcyBubyB3YXkgdG8gZGV0ZWN0IHRoZSBkZXZpY2Uncw0KICAgICBwcmVzZW5jZSBvbiB5b3VyIHNoaXAuDQoNCiZsdDtEJmd0OyAgQ2xvYWtpbmcgRGV2aWNlLiAgQ2xvYWtpbmcgZGV2aWNlcyBjYW4gaGlkZSB5b3UgZnJvbSB5b3VyDQogICAgIHJpdmFscyB3aGVuIHlvdSBhcmUgYXdheSBmcm9tIHlvdXIgaG9tZSBzZWN0b3IuICBJZiB5b3UNCiAgICAgZmVlbCB5b3Ugd2lsbCBiZSB2dWxuZXJhYmxlLCB1c2UgeW91ciBDbG9ha2luZyBEZXZpY2UgdG8NCiAgICAgY29uY2VhbCB5b3VyIHNoaXAuICBZb3VyIGxvY2F0aW9uIHdpbGwgYmUgdW5rbm93biB0byBldmVuDQogICAgIHlvdXIgQ29ycG9yYXRlIGFzc29jaWF0ZXMgd2hvIHZpZXcgdGhlIE1lbWJlciBMb2NhdGlvbg0KICAgICBkaXNwbGF5LiAgUmVtZW1iZXIgdGhhdCB0aGUgQ2xvYWtpbmcgRGV2aWNlIHdpbGwgdXNlIGENCiAgICAgbG90IG9mIHlvdXIgZW5lcmd5IHJlc2VydmVzIGFuZCBpdHMgZWZmZWN0aXZlbmVzcw0KICAgICBkZWNyZWFzZXMgdGhlIGxvbmdlciBpdCdzIHVzZWQuICBBIHdlbGwta25vd24gY29uc3VtZXINCiAgICAgZ3JvdXAgaGFzIHRlc3RlZCB0aGVzZSBkZXZpY2VzIGFuZCBmb3VuZCB0aGF0IG9uIHRoZQ0KICAgICBhdmVyYWdlLCBhZnRlciAyNCBob3VycyBvZiB1c2UsIHlvdSBzdGFuZCBhIGdvb2QgY2hhbmNlIG9mDQogICAgIGJlaW5nIGRldGVjdGVkLiAgQ2xvYWtpbmcgRGV2aWNlcyBhcmUgcmVsYXRpdmVseQ0KICAgICBpbmV4cGVuc2l2ZSwgYnV0IGJlY2F1c2Ugc29tZSBvZiB0aGUgY29tcG9uZW50cyBkZWNvbXBvc2UNCiAgICAgcXVpY2tseSwgdGhleSBhcmUgYSBvbmUtdGltZSB1c2UgaXRlbS4NCg0KJmx0O0UmZ3Q7ICBTdWJTcGFjZSBFdGhlciBQcm9iZXMuICBFdGhlcmVhbCBQcm9iZXMgYXJlIHF1aXRlIHVzZWZ1bA0KICAgICB3aGVuIHlvdSB3YW50IHRvIGtub3cgd2hhdCB3b25kZXJzIGxpZSBvbiB0aGUgb3RoZXIgc2lkZQ0KICAgICBvZiB0aGUgdW5pdmVyc2UsIGJ1dCB5b3UgZG9uJ3Qgd2FudCB0byB1c2UgdXAgeW91ciB0dXJucw0KICAgICB0byBleHBsb3JlLiAgWW91IGNhbiBsYXVuY2ggdGhlIHVubWFubmVkIHByb2JlcyB3aXRoIGENCiAgICAgcHJlc2V0IGRlc3RpbmF0aW9uLiAgQXMgdGhleSBtYW5ldXZlciB0aGVpciB3YXkgYWNyb3NzDQogICAgIHRoZSBjb3Ntb3MsIHRoZXkgcmVwb3J0IGJhY2sgc2VjdG9yIGJ5IHNlY3Rvci4gIFRoZXkgYXJlDQogICAgIHF1aXRlIGluZXhwZW5zaXZlIGZvciB0aGUgYW1vdW50IG9mIGluZm9ybWF0aW9uIHRoYXQgY2FuDQogICAgIGJlIG9idGFpbmVkLCBidXQgdGhleSBhcmUgbm90IHN0dXJkeS4gIFRoZXkgY29udGFpbiBhDQogICAgIHNlbGYtZGVzdHJ1Y3QgbWVjaGFuaXNtIHRoYXQgaXMgdHJpZ2dlcmVkIHdoZW4gdGhlIHByb2JlDQogICAgIHJlYWNoZXMgaXRzIGRlc3RpbmF0aW9uLiAgVGhlIGRlc2lnbmVycyBvZiB0aGUgcHJvYmUNCiAgICAgdGhvdWdodCB0aGlzIHdvdWxkIHByb3ZpZGUgYW5vbnltaXR5IGZvciBhbnlvbmUgdXNpbmcgdGhlDQogICAgIGdhZGdldC4gIFRoaXMgbWVjaGFuaXNtIGlzIHNvIHNlbnNpdGl2ZSB0aGF0IGl0IGRldG9uYXRlcw0KICAgICB3aGVuIHRoZSBwcm9iZSBlbmNvdW50ZXJzIGFueSBlbmVteSBmaWdodGVycy4gIFNpbmNlIGl0DQogICAgIGhhcyBubyBzaGllbGRpbmcgY2FwYWJpbGl0aWVzLCBhbnkgc2hpcCBpdCBwYXNzZXMgd2lsbCBiZQ0KICAgICBhYmxlIHRvIGRldGVjdCBpdHMgcHJlc2VuY2UuDQoNCiZsdDtGJmd0OyAgUGxhbmV0IFNjYW5uZXJzLiAgSWYgeW91IGFyZSBwbGFubmluZyBhbiBpbnZhc2lvbiBvZg0KICAgICBhbm90aGVyIHBsYXllcidzIHBsYW5ldCwgdGhpcyBzY2FubmVyIGNhbiBzaG93IHlvdSB0aGUNCiAgICAgbWlsaXRhcnkgc3lzdGVtIG9uIHRoZSBwbGFuZXQgd2l0aG91dCBsYW5kaW5nLiAgT25jZSB5b3UNCiAgICAgYXJlIGluIHRoZSBzZWN0b3IsIHNjYW4gdGhlIHBsYW5ldC4gIFlvdSBjYW4gc2VlIHdobw0KICAgICBjcmVhdGVkIHRoZSBwbGFuZXQsIHdobyBjdXJyZW50bHkgY29udHJvbHMgdGhlIHBsYW5ldCwNCiAgICAgYW5kIHRoZSBtaWxpdGFyeSBkZWZlbnNlcyBpbnN0YWxsZWQgdGhlcmUuICBZb3Ugd29uJ3QNCiAgICAgZmluZCBvdXQgdGhlIGhhcmQgd2F5IHRoYXQgeW91IGRvbid0IGhhdmUgZW5vdWdoIHdlYXBvbnMNCiAgICAgdG8gdGFrZSBvdmVyIHRoZSBlbmVteSBmb3JjZXMuDQoNCiZsdDtNJmd0OyAgU3BhY2UgTWluZXMuICBOZXcgdGVjaG5vbG9neSBoYXMgYmVlbiBkZXZlbG9wZWQgdG8gcHJvdmlkZQ0KICAgICB0cmFkZXJzIHdpdGggdHdvIHR5cGVzIG9mIG1pbmVzLiAgVGhlIEFyYW1pZCBtaW5lcyBjYW4gYmUgYQ0KICAgICB2ZXJ5IGVmZmVjdGl2ZSB3YXkgb2YgZXN0YWJsaXNoaW5nIHlvdXIgdGVycml0b3J5LiAgU3BhY2UNCiAgICAgbWluZXMgY2FuIGNhdXNlIHNlcmlvdXMgZGFtYWdlIHRvIHNtYWxsZXIgY3JhZnQgYW5kIGNhbiBiZSBhDQogICAgIHJlYWwgbnVpc2FuY2UgdG8gbGFyZ2VyIHZlc3NlbHMuICBUaGUgTGltcGV0IG1pbmVzIGFyZSBhDQogICAgIGNsZXZlciBkZXZlbG9wbWVudCBvZiB0aGUgRG9ubmVsbHkgVW5kZXJncm91bmQgRGV2ZWxvcG1lbnQNCiAgICAgR3JvdXAuICBUaGV5IHNpbXBseSBzaXQgYWxtb3N0IGludmlzaWJsZSBpbiBhIHNlY3RvciB1bnRpbA0KICAgICBhbiBlbmVteSBzaGlwIHBhc3NlcyBieS4gIE9uY2UgdGhlIGVuZW15IGlzIGNsb3NlIGVub3VnaCwNCiAgICAgdGhleSBhdHRhY2ggdGhlbXNlbHZlcyB0byB0aGUgc2hpcC4gIFRoZSBhY3RpdmF0ZWQgbWluZXMNCiAgICAgd2lsbCByZXBvcnQgdGhlaXIgd2hlcmVhYm91dHMgdG8geW91IHdoZW4geW91IGRvIHNjYW4gZm9yDQogICAgIGRlcGxveWVkIG1pbmVzLiAgVGhpcyBpcyBhIGNsZXZlciB3YXkgdG8gZmluZCBvdXQgd2hlcmUgeW91cg0KICAgICBlbmVteSBpcy4gIFRoZSBMaW1wZXRzIGNhbiBiZSByZW1vdmVkIGJ5IGNyZXdzIGF0IHRoZQ0KICAgICBTdGFyZG9jay4gIFRoZSBsYXRlc3QgdGVjaG5vbG9neSBoYXMgcHJvdmlkZWQgbWluZXMgd2l0aA0KICAgICBzZW5zb3JzIGNhcGFibGUgb2YgcmVjb2duaXppbmcgdGhlIEZlZGVyYWwgSS5ELiBjb2Rlcy4gIFRoaXMNCiAgICAgd2lsbCBrZWVwIHRoZSBtaW5lcyBmcm9tIGRldG9uYXRpbmcgYnkgeW91ciBzaGlwIG9yIHlvdXINCiAgICAgQ29ycG9yYXRpb24ncyBzaGlwcyAobW9zdCBvZiB0aGUgdGltZSkuDQoNCiZsdDtQJmd0OyAgUGhvdG9uIE1pc3NpbGVzLiAgT25seSBvd25lcnMgb2YgTWlzc2lsZSBGcmlnYXRlcyBvcg0KICAgICBJbXBlcmlhbCBTdGFyc2hpcHMgY2FuIHVzZSB0aGVzZSBwb3dlcmZ1bCB3ZWFwb25zLiANCiAgICAgU2hpZWxkcywgYm90aCBTaGlwIGFuZCBQbGFuZXRhcnksIGFyZSBleGNlbGxlbnQNCiAgICAgcHJvdGVjdGlvbiBmcm9tIHRoZSBpbXBhY3Qgb2YgdGhpcyB3ZWFwb24uICAgSG93ZXZlciwNCiAgICAgb25jZSBzaGllbGRzIGhhdmUgYmVlbiBkZXN0cm95ZWQsIFBob3RvbiBNaXNzaWxlcyBjYW4gYmUNCiAgICAgdXNlZCB0byBkaXNhYmxlIGFsbCBDb21iYXQgQ29udHJvbCBDb21wdXRlcnMgKExldmVsIDINCiAgICAgQ2l0YWRlbHMpIGFuZCBRdWFzYXIgQ2Fubm9ucyAoTGV2ZWwgMyBDaXRhZGVscykgYW5kDQogICAgIEludGVyZGljdG9yIEdlbmVyYXRvcnMgKExldmVsIDYgQ2l0YWRlbHMpIG9uIHBsYW5ldHMuICBJdA0KICAgICBuZXV0cmFsaXplcyBhbGwgbWluZXMgYW5kIGZpZ2h0ZXJzIHN0YXRpb25lZCBpbiBhIHNlY3Rvci4gDQogICAgIEJlIGFkdmlzZWQgdGhhdCB0aGUgZWZmZWN0IG9mIHRoZXNlIG1pc3NpbGVzIGlzIHNob3J0LWxpdmVkLiANCiAgICAgR2V0IGluLCB0YWtlIGNhcmUgb2YgeW91ciBidXNpbmVzcyBhbmQgZ2V0IG91dCBiZWZvcmUgdGhlDQogICAgIGVmZmVjdCB3ZWFycyBvZmYuICBZb3UgZG9uJ3Qgd2FudCB0byBzdGlsbCBiZSBpbiB0aGUgc2VjdG9yDQogICAgIHdoZW4gdGhlIFF1YXNhciBDYW5ub25zIHJlZ2FpbiB0aGVpciBzdHJlbmd0aC4gIEdyZWF0IGNhcmUNCiAgICAgc2hvdWxkIGJlIHVzZWQgaW4gdHJhbnNwb3J0aW5nIHRoZXNlIHZvbGF0aWxlIHdlYXBvbnMgb2YNCiAgICAgZGVzdHJ1Y3Rpb24uICANCg0KJmx0O1ImZ3Q7ICBMb25nIFJhbmdlIFNjYW5uZXJzLiAgVGhlc2Ugc2Nhbm5lcnMgY2FuIHByb3ZpZGUgdGhlDQogICAgIGV4cGxvcmVyIHdpdGggbXVsdGktc2VjdG9yIHZpc2lvbi4gIFlvdXIgdHdvIG9wdGlvbnMgYXJlDQogICAgIGEgRGVuc2l0eSBTY2FubmVyIG9yIGEgSG9sb2dyYXBoaWMgU2Nhbm5lci4gIFRoZSBEZW5zaXR5DQogICAgIFNjYW5uZXIgaXMgdGhlIGNoZWFwZXIgYW5kIGl0IHByb3ZpZGVzIHRoZSB1c2VyIHdpdGggdGhlDQogICAgIHJlbGF0aXZlIGRlbnNpdHkgb2YgdGhlIHN1cnJvdW5kaW5nIHNlY3RvcnMuICBJdCB3aWxsIGFsc28NCiAgICAgaW5kaWNhdGUgYSB3YXJuaW5nIGlmIHRoZXJlIGlzIGEgbm9uLXN0YW5kYXJkIHVuZGVmaW5hbGJsZQ0KICAgICBtYXNzLiAgWW91IGNhbiB1c2UgdGhhdCBpbmZvcm1hdGlvbiB0byBkZXRlcm1pbmUgd2hhdCBtYXkgYmUNCiAgICAgaW4gdGhlIG5laWdoYm9yaG9vZC4gIElmIHlvdSBoYXZlIHN1ZmZpY2llbnQgZnVuZHMsIHlvdSBjYW4NCiAgICAgcHVyY2hhc2UgYSBIb2xvZ3JhcGhpYyBTY2FubmVyIHdoaWNoIGhhcyBib3RoIERlbnNpdHkgYW5kDQogICAgIEhvbG9ncmFwaGljIGNhcGFiaWxpdGllcy4gIFVzaW5nIHRoZSBIb2xvZ3JhcGhpYyBtb2RlLA0KICAgICB5b3UgY2FuIHNlZSB3aGF0IGFuZCB3aG8gaXMgaW4gdGhlIHNlY3RvcnMgYWRqYWNlbnQgdG8NCiAgICAgdGhlIG9uZSB5b3UgYXJlIGN1cnJlbnRseSBvY2N1cHlpbmcuICBUaGUgc2Nhbm5lciBpbg0KICAgICBIb2xvZ3JhcGhpYyBtb2RlIHVzZXMgYSBzbWFsbCBhbW91bnQgb2YgeW91ciBzaGlwJ3MgZnVlbA0KICAgICAob25lIHR1cm4ncyB3b3J0aCkgYnV0IHRoYXQgaXMgYSBzbWFsbCBwcmljZSB0byBwYXkgd2hlbg0KICAgICB5b3UgY29uc2lkZXIgdGhlIGluZm9ybWF0aW9uIGFuZCBzZWN1cml0eSBpdCBjYW4gcHJvdmlkZS4NCg0KJmx0O1MmZ3Q7ICBNaW5lIERpc3J1cHRlcnMuICBJZiB5b3UgcnVuIGFjcm9zcyBhIGhlYXZpbHkgbWluZWQNCiAgICAgc2VjdG9yIGJ1dCB5b3UgcmVhbGx5IG5lZWQgdG8gZ28gaW4gdGhlcmUsIHNlbmQgaW4gYSBNaW5lDQogICAgIFN3ZWVwZXIgdG8gY2xlYXIgeW91ciBwYXRoLiAgVGhleSBjYW4gYWJzb3JiIHRoZSBkYW1hZ2UNCiAgICAgc28geW91IGRvbid0IGhhdmUgdG8gb3IgdGhleSBjYW4gZGVhY3RpdmF0ZSB0aGUgbGltcGV0cy4NCg0KJmx0O1QmZ3Q7ICBHZW5lc2lzIFRvcnBlZG9lcy4gIE11Y2ggaW1wcm92ZWQgc2luY2UgdGhlIGZpcnN0IG1vZGVscywNCiAgICAgdGhlc2UgdG9ycGVkb2VzIGNhbiBwcm92aWRlIHRoZSBmb3VuZGF0aW9uIGZvciB0aGUNCiAgICAgcHJvZHVjdGlvbiBvZiB5b3VyIHRyYWRpbmcgY29tbW9kaXRpZXMuICBEZXBlbmRpbmcgb24gdGhlICAgDQogICAgIHBsYW5ldCB0eXBlIGNyZWF0ZWQgYnkgdGhlIHRvcnBlZG8sIHBsYW5ldCB3aWxsIGJlIGFibGUgdG8NCiAgICAgc3VwcG9ydCBhIHZhcnlpbmcgbnVtYmVyIG9mIGNvbG9uaXN0cy4gIFRoZSBjb2xvbmlzdHMgY2FuDQogICAgIHByb3ZpZGUgdGhlIGxhYm9yIG5lZWRlZCB0byBtaW5lIHRoZSBGdWVsIE9yZSwgZ3JvdyB0aGUNCiAgICAgT3JnYW5pY3MgYW5kIG1hbnVmYWN0dXJlIHRoZSBFcXVpcG1lbnQgYW5kIEZpZ2h0ZXJzIHlvdQ0KICAgICB3aWxsIHVzZSBpbiB5b3VyIHRyYWRpbmcgY29tcGFueS4gIFNvbWUgcGxhbmV0IHR5cGVzDQogICAgIGFyZSBiZXR0ZXIgdGhhbiBvdGhlcnMgYXQgcHJvZHVjaW5nIHRoZSBjb21tb2RpdGllcy4gIFlvdQ0KICAgICBtaWdodCB3YW50IHRvIGNoZWNrIHRoZSBQbGFuZXRhcnkgU3BlY3MgaW4geW91ciBPbmJvYXJkDQogICAgIENvbXB1dGVyLiAgWW91IGhhdmUgbm8gY29udHJvbCBvdmVyIHdoYXQgcGxhbmV0IHR5cGUgcmVzdWx0cw0KICAgICBmcm9tIHRoZSBUb3JwZWRvJ3MgZXhwbG9zaW9uLiAgVGhhdCBpcyBkZXRlcm1pbmVkIGJ5DQogICAgIGNvbmRpdGlvbnMgaW4gdGhlIHNlY3Rvci4NCg0KJmx0O1cmZ3Q7ICBUcmFuc1dhcnAgRHJpdmVzLiAgT25seSBJbXBlcmlhbCBTdGFyc2hpcHMsIENvcnBvcmF0ZQ0KICAgICBGbGFnc2hpcHMgYW5kIEhhdm9jIEd1bnN0YXJzIGNhbiBiZSBmaXR0ZWQgd2l0aCB0aGVzZSBtYXNzaXZlDQogICAgIGRyaXZlcy4gIFRyYW5zV2FycCBjb25zdW1lcyBhbiBlbm9ybW91cyBhbW91bnQgb2YgRnVlbCBPcmUgc28NCiAgICAgbWFrZSBzdXJlIHlvdSBoYXZlIGEgc291cmNlIG9mIE9yZSBmb3IgeW91ciByZXR1cm4gdHJpcCwgdG9vLg0KICAgICBUaGUgVHJhbnNXYXJwIERyaXZlIHVzZXMgYSBob21pbmcgZGV2aWNlLCBzbyB5b3Ugc2hvdWxkIGhhdmUNCiAgICAgYXQgbGVhc3Qgb25lIGZpZ2h0ZXIgaW4geW91ciBkZXN0aW5hdGlvbiBzZWN0b3IuDQoNCiAgICAgVGhlIFR5cGUgMSBUcmFuc1dhcnAgZHJpdmUgaXMgc3RhbmRhcmQsIGFuZCB3aWxsIG5vdCBmdW5jdGlvbg0KICAgICB3aXRoIGEgdHJhY3RvciBiZWFtIGVuZ2FnZWQuDQoNCiAgICAgVGhlIFR5cGUgMiBUcmFuc1dhcnAgZHJpdmUgaXMgVHJhbnNXYXJwIFRvdyBjYXBhYmxlLg0KDQombHQ7WSZndDsgIFBzeWNoaWMgUHJvYmVzLiAgQmFydGVyaW5nIGF0IHRoZSBwb3J0cyBpcyBvbmUgb2YgdGhlDQogICAgIG1haW4gZWxlbWVudHMgb2YgdGhpcyBnYW1lLiAgWW91IGdldCBleHBlcmllbmNlIHBvaW50cw0KICAgICBmb3IgbWFraW5nIGEgZ29vZCBkZWFsLiAgVGhlIGJldHRlciB0aGUgZGVhbCwgdGhlIG1vcmUNCiAgICAgcG9pbnRzIHlvdSBnZXQuICBQc3ljaGljIFByb2JlcyBhcmUgdGhlIG5leHQgYmVzdCB0aGluZw0KICAgICB0byBpbnNpZGVyIHRyYWRpbmcsIGFuZCB0aGV5J3JlIGxlZ2FsLiAgSWYgeW91IHdhbnQgdG8NCiAgICAgc2VlIGV4YWN0bHkgd2hlcmUgeW91ciBvZmZlciBpcyBjb21wYXJlZCB0byB3aGF0IHRoZXkNCiAgICAgd291bGQgaGF2ZSBhY2NlcHRlZCwgeW91IG5lZWQgb25lIG9mIHRoZXNlIHByb2Jlcy4gIEl0DQogICAgIHdpbGwgbm90IG9ubHkgc2hvdyB5b3Ugd2hlcmUgeW91IHdlbnQgd3JvbmcsIGJ1dCBpdCB3aWxsDQogICAgIGFsc28gaGVscCB5b3UgaW1wcm92ZSB5b3VyIHRyYWRpbmcgc2tpbGxzLg0KDQombHQ7ISZndDsgIEhhcmR3YXJlIEVtcG9yaXVtIEhlbHAuICBEaXNwbGF5IHRoZSBwb3J0aW9uIG9mIHRoZQ0KICAgICBkb2N1bWVudGF0aW9uIGRlc2NyaWJpbmcgdGhlIEhhcmR3YXJlIEVtcG9yaXVtIGZ1bmN0aW9ucy4NCg0KJmx0O1EmZ3Q7ICBMZWF2ZSB0aGUgRW1wb3JpdW0uICBSZXR1cm4gdG8gdGhlIG1haW4gYXJlYSBvZiB0aGUNCiAgICAgU3RhckRvY2suDQoNCg0KU0hJUFlBUkRTIE1FTlUNCg0KJmx0O0ImZ3Q7ICBCdXkgYSBOZXcgU2hpcC4gIFdoZW4geW91IGFyZSByZWFkeSB0byB1cGdyYWRlLCBvciBpZiB5b3UNCiAgICAgbmVlZCBhIHNwZWNpYWxpemVkIHNoaXAsIGNvbWUgdG8gdGhlIFNoaXB5YXJkcyBhbmQgdGFsaw0KICAgICB0byBDYWwgV29ydGhpbmd0b24gWFhJIGFib3V0IGEgdHJhZGUtaW4uICBZb3Ugd2lsbCBiZQ0KICAgICBvZmZlcmVkIGEgZmFpciBwcmljZSBmb3IgeW91ciBjdXJyZW50IHNoaXAuICBUaGV5IHdpbGwNCiAgICAgdGFrZSBhbnl0aGluZyBpbiB5b3VyIHRyYWRlIHN1Y2ggYXMgZmlnaHRlcnMsDQogICAgIGFjY2Vzc29yaWVzLCBtaW5lcywgZXRjLiBzbyBpZiB5b3UncmUgdHJ5aW5nIHRvIGdldCBhIGxvdA0KICAgICBvbiB5b3VyIHRyYWRlLWluLCBsb2FkIHlvdXIgc2hpcCB1cCBiZWZvcmUgeW91IHRhbGsgdG8NCiAgICAgdGhlbS4gIElmIHlvdSBkb24ndCB3YW50IHRvIHVzZSBhbGwgeW91ciBleHRyYXMgaW4gdGhlDQogICAgIHRyYWRlLCB5b3UgbWlnaHQgd2FudCB0byBsZWF2ZSBhcyBtdWNoIGFzIHlvdSBjYW4gaW4gYQ0KICAgICBzZWN1cmUgcGxhY2UgYW5kIHBpY2sgaXQgdXAgYWZ0ZXIgeW91IHB1cmNoYXNlIHlvdXIgbmV3DQogICAgIHNoaXAuICBOZXcgc2hpcHMgYXJlIHZlcnkgYmFzaWMgbW9kZWxzLiAgVGhlIGV4dHJhcyBhcmUNCiAgICAgYXZhaWxhYmxlIGF0IHRoZSBIYXJkd2FyZSBFbXBvcml1bSBhbmQgdGhlIENsYXNzIDAgcG9ydHMuDQoNCiZsdDtTJmd0OyAgU2VsbCBFeHRyYSBTaGlwcy4gIEEgZGlzcGxheSB3aXRoIGFsbCB5b3VyIHNoaXBzIGluIG9yYml0DQogICAgIHdpbGwgYXBwZWFyLiAgQ2hvb3NlIHdoaWNoIG9uZXMgdG8gc2VsbCBvZmYuICBZb3Ugd2lsbCBiZQ0KICAgICBhYmxlIHRvIHNlZSB0aGUgc2hpcCBudW1iZXIsIG5hbWUsIHR5cGUsIGxvY2F0aW9uIGFuZCBob3cNCiAgICAgbWFueSBmaWdodGVycyBhbmQgc2hpZWxkcyBhcmUgb24gZWFjaCBzaGlwLg0KDQombHQ7RSZndDsgIEV4YW1pbmUgU2hpcCBTcGVjcy4gIFRoaXMgaXMgdGhlIHNhbWUgaW5mb3JtYXRpb24NCiAgICAgYXZhaWxhYmxlIHRvIHlvdSBmcm9tIHlvdXIgc2hpcCdzIG9uLWJvYXJkIGNvbXB1dGVyLCBidXQNCiAgICAgaW4gaW5jbHVkZXMgKGZvciBBTlNJIHVzZXJzIG9ubHkpIGEgcGljdHVyZSBvZiBlYWNoIHNoaXAsDQogICAgIGJvdGggdG9wIGFuZCBmcm9udCB2aWV3LiAgWW91IG1heSB3YW50IHRvIHJldmlldyB0aGUgc2hpcA0KICAgICBzcGVjaWZpY2F0aW9ucyBvbmUgbGFzdCB0aW1lIGJlZm9yZSB5b3UgbWFrZSB5b3VyDQogICAgIHB1cmNoYXNlLg0KDQombHQ7UCZndDsgIEJ1eSBDbGFzcyAwIEl0ZW1zLiAgQWZ0ZXIgeW91IHB1cmNoYXNlIHlvdXIgc2hpcCwgeW91IG1heQ0KICAgICBuZWVkIHRvIGVxdWlwIGl0IHdpdGggYSBmZXcgb2YgdGhlIGl0ZW1zIG5vcm1hbGx5DQogICAgIHB1cmNoYXNlZCBhdCB0aGUgQ2xhc3MgMCBwb3J0cy4gIFlvdSB3b3VsZG4ndCB3YW50IHRvDQogICAgIHRha2UgdGhhdCBicmFuZCBuZXcgYmVhdXR5IG91dCB1bnByb3RlY3RlZCwgd291bGQgeW91Pw0KICAgICBUaGUgbWVyY2hhbnRzIGluIHRoZSBzaGlweWFyZHMgaGF2ZSBvYnRhaW5lZCBmaWdodGVycywNCiAgICAgc2hpZWxkcyBhbmQgaG9sZHMgZnJvbSAidHJhZGUtaW5zIiBzbyB0aGV5IGFyZSBvZmZlcmluZw0KICAgICB0aGVtIHJpZ2h0IGhlcmUgd2hlcmUgeW91IGJ1eSB5b3VyIHNoaXAgYXMgYSBjb252ZW5pZW5jZQ0KICAgICB0byB5b3UuICBCZSBmb3Jld2FybmVkIHRoYXQgeW91IHdpbGwgYmUgcGF5aW5nIGEgcHJlbWl1bQ0KICAgICBwcmljZSBmb3IgdGhpcyBjb252ZW5pZW5jZS4NCg0KJmx0O1ImZ3Q7ICBDaGFuZ2UgU2hpcCBSZWdpc3RyYXRpb24uICBJdCdzIG5vdCBwYXJhbm9pYSB3aGVuIHRoZXkncmUNCiAgICAgcmVhbGx5IG91dCB0byBnZXQgeW91LiAgSWYgeW91ciBmb2VzIGFyZSB0cmFja2luZyB5b3UNCiAgICAgZG93biBieSByZWFkaW5nIHRoZSBsb2dzIGF0IHRoZSBTdGFyUG9ydHMgb3IgdGhleSd2ZQ0KICAgICByZWNlaXZlZCBpbmZvcm1hdGlvbiBvbiB5b3VyIHNoaXAgZnJvbSBhIGxvb3NlLXRvbmd1ZWQNCiAgICAgZm9vbCBhdCB0aGUgdGF2ZXJuLCBnbyB0byB0aGlzIGJhY2sgcm9vbSBpbiB0aGUgb2ZmaWNlcw0KICAgICBvZiB0aGUgU2hpcHlhcmRzLiAgRm9yIGEgaGVmdHkgZmVlLCB5b3UgY2FuIGdldCByZXZpc2VkDQogICAgIHJlZ2lzdHJhdGlvbiBwYXBlcnMgb24geW91ciBzaGlwIGFuZCBjaHJpc3RlbiBpdCB3aXRoIGENCiAgICAgbmV3LCB1bnRyYWNlYWJsZSBuYW1lLg0KDQombHQ7ISZndDsgIFNoaXB5YXJkcyBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUgZG9jdW1lbnRhdGlvbg0KICAgICBkZXNjcmliaW5nIHRoZSBTaGlweWFyZHMgZnVuY3Rpb25zLg0KDQombHQ7USZndDsgIExlYXZlIHRoZSBTaGlweWFyZHMuICBSZXR1cm4gdG8gdGhlIG1haW4gYXJlYSBvZiB0aGUNCiAgICAgU3RhckRvY2suDQoNCg0KVEFWRVJOIE1FTlUNCg0KJmx0O0EmZ3Q7ICBNYWtlIGFuIEFubm91bmNlbWVudC4gIERvIHlvdSBoYXZlIHNvbWV0aGluZyBvZiBpbnRlcmVzdA0KICAgICBmb3IgYWxsIHRoZSBwYXRyb25zIG9mIHRoZSB0YXZlcm4/ICBJZiBzbywgcGF5IHRoZSBmZWUNCiAgICAgYW5kIHBvc3QgeW91ciBhbm5vdW5jZW1lbnQuICBJdCB3aWxsIHN0YXkgdGhlcmUgdW50aWwgdGhlDQogICAgIG5leHQgYW5ub3VuY2VtZW50IGlzIHBvc3RlZC4NCg0KJmx0O0ImZ3Q7ICBCdXkgU29tZXRoaW5nIGZyb20gdGhlIEJhci4gIEhhZCBhIHRyeWluZyBkYXk/ICBXYW50IGENCiAgICAgbGl0dGxlIHNvbWV0aGluZyB0byBzb290aGUgeW91ciBuZXJ2ZXM/ICBPcmRlciB1cA0KICAgICB3aGF0ZXZlciB5b3VyIGhlYXJ0IGRlc2lyZXMuICBZb3UgbWlnaHQgZXZlbiBnZXQgaXQgaW4gYQ0KICAgICBjbGVhbiBnbGFzcy4gIFJlbWVtYmVyIEZlZExhdyBzYXlzLCBkb24ndCBkcmluayBhbmQgZmx5Lg0KDQombHQ7QyZndDsgIEVhdmVzZHJvcCBvbiBDb252ZXJzYXRpb25zLiAgU2VlIHRoYXQgZ3JvdXAgb2YNCiAgICAgaW5kaXZpZHVhbHMgZ2F0aGVyZWQgYXQgdGhlIHRhYmxlIGluIHRoZSBkYXJrZXN0IGNvcm5lcg0KICAgICBvZiB0aGUgdGF2ZXJuPyAgVGhleSBzZWVtIHRvIGJlIGVuZ2FnZWQgaW4gc29tZSB2ZXJ5DQogICAgIGVuZ3Jvc3NpbmcgZGlhbG9ndWUuICBJZiB5b3Ugd291bGQgY2FyZSB0byBsaXN0ZW4gaW4gYW5kDQogICAgIG1heWJlIGV2ZW4gYWRkIHNvbWUgcmVtYXJrcyBvZiB5b3VyIG93biwgdXNlIHRoaXMgb3B0aW9uLg0KDQombHQ7RSZndDsgIE9yZGVyIFNvbWUgRm9vZC4gIFlvdSByZWFsbHkgbmVlZCB0byBrZWVwIHlvdXIgc3RyZW5ndGgNCiAgICAgdXAgc28geW91IGNhbiB0YWtlIG9uIHRoZSBjaGFsbGVuZ2VzIG9mIHRoZSBjb3Ntb3MuDQogICAgIE9yZGVyIHVwIHRoZSBCbHVlIFBsYXRlIFNwZWNpYWwgKHRoZSBmb29kIGlzIGJsdWUsIG5vdA0KICAgICB0aGUgcGxhdGUpIGFuZCBub3VyaXNoIHlvdXJzZWxmIHdpdGggc29tZSBvZiB0aGUgbW9zdA0KICAgICBtZW1vcmFibGUgZWRpYmxlcyB0aGlzIHNpZGUgb2YgQmFybGFhbS4NCg0KJmx0O0cmZ3Q7ICBUcnkgWW91ciBIYW5kIGF0IFRyaS1Dcm9uLiAgRG8geW91IGZlZWwgbHVja3ksIFB1bms/ICBQdXQNCiAgICAgeW91ciBtb25leSBkb3duIGFuZCBzZWUgaWYgeW91IGNhbiBiZWF0IHRoZSBvZGRzLiAgQQ0KICAgICBzaW1wbGUgZ2FtZSBvZiBjaGFuY2UgbWlnaHQgcmVsYXggeW91IGFuZCB5b3UgbmV2ZXIga25vdywNCiAgICAgeW91IG1pZ2h0IGNvbWUgYXdheSBhIGJpZyB3aW5uZXIuICBUaGUgZ2FtZSBpcyBlYXN5IC0gdGhlDQogICAgIGRldGFpbGVkIGluc3RydWN0aW9ucyBhcmUgYXZhaWxhYmxlIGluIHRoZSBUYXZlcm4uICBUaGUNCiAgICAgY29zdCBvZiBwbGF5aW5nIGlzIGJhc2VkIG9uIHRoZSBzaXplIG9mIHRoZSBUb3AgV2lubmVyJ3MNCiAgICAgSmFja3BvdC4gIFlvdSdsbCBoYXZlIDEwIHJvdW5kcyBhZ2FpbnN0IHRoZSBob3VzZS4gIElmDQogICAgIHlvdSB3aW4sIHRoZSBwYXliYWNrIGlzIDIgdG8gMS4gIElmIHlvdSdyZSB0aGUgdG9wDQogICAgIHdpbm5lciwgeW91IHJlY2VpdmUgdGhlIGFjY3VtdWxhdGVkIGphY2twb3QuDQoNCiZsdDtUJmd0OyAgVGFsayB0byB0aGUgR3JpbXkgVHJhZGVyIGluIEJhY2suICBOb3QgbXVjaCB0byBsb29rIGF0LA0KICAgICBidXQgaGUgY2FuIGJlIGEgd2VhbHRoIG9mIGluZm9ybWF0aW9uLiAgRGVwZW5kaW5nIG9uIGhvdw0KICAgICBtYW55IGRyaW5rcyBoZSdzIGhhZCwgaGlzIGZhY3RzIG1heSBiZSBhIGJpdCBzdXNwZWN0Lg0KICAgICBKdXN0IGFzayBoaW0gYWJvdXQgYSBzcGVjaWZpYyB0b3BpYywgZ2l2ZSBoaW0gYSBsaXR0bGUNCiAgICAgaW5kdWNlbWVudCBhbmQgaGUnbGwgdGVsbCB5b3Ugd2hhdCBoZSBrbm93cy4gIElmIHlvdQ0KICAgICBzcGVhayB0byBoaW0gcmVzcGVjdGZ1bGx5LCBoZSdsbCBiZSBmYWlyIHRvIHlvdS4NCiAgICAgT3RoZXJ3aXNlIGhlIG1pZ2h0IHRyeSB0byB0YWtlIGFkdmFudGFnZSBvZiB5b3VyIG5lZWQgZm9yDQogICAgIGluZm9ybWF0aW9uLiAgWW91J2xsIGhhdmUgdG8gcGF5IGRlYXJseSBmb3IgaXQsIGJ1dCBoZQ0KICAgICBjYW4gc29tZXRpbWVzIGdldCB5b3UgaW5mb3JtYXRpb24gb24gc3BlY2lmaWMgVHJhZGVycy4NCg0KJmx0O1UmZ3Q7ICBVc2UgdGhlIEZhY2lsaXRpZXMuICBXaGVuIE1vdGhlciBOYXR1cmUgY2FsbHMsIHRoaXMNCiAgICAgb3B0aW9uIHdpbGwgYWxsb3cgeW91IHRvIGFuc3dlci4gIEZlZWwgZnJlZSB0byByZWFkIHRoZQ0KICAgICBncmFmZml0aSB0byBrZWVwIHlvdXJzZWxmIGVudGVydGFpbmVkLiAgWW91IGNhbiBldmVuIGFkZA0KICAgICBzb21lIG9mIHlvdXIgb3duIHByb3NlIG9yIHBvZXRyeSBidXQgYmV3YXJlIG9mIHdoYXQgbWF5DQogICAgIGJlIGx1cmtpbmcgaW4gdGhlIG5leHQgc3RhbGwuDQoNCiZsdDs7Jmd0OyAgSm9pbiBjb252ZXJzYXRpb24uICBUaGlzIGlzIGEgZ2xvYmFsIGNvbW1hbmQgd2hpbGUgeW91J3JlDQogICAgIHZpc2l0aW5nIHRoZSB0YXZlcm4uICBTaW1wbHkgdHlwZSB0aGlzIGNvbW1hbmQsIGZvbGxvd2VkDQogICAgIGJ5IHRoZSB0ZXh0IHlvdSB3YW50IG90aGVycyBpbiB0aGUgdGF2ZXJuIHRvIHNlZS4gIFlvdSBjYW4NCiAgICAgZW50ZXIgYSBtdWx0aS1saW5lIG1vZGUgYnkgcHJlc3NpbmcgdGhpcyBrZXkgYW5kIHRoZW4gYQ0KICAgICBjYXJyaWFnZSByZXR1cm4uICBSZW1lbWJlciB0aGF0IHRoaXMgaXMgYSBwdWJsaWMgZXN0YWJsaXNobWVudCwNCiAgICAgc28gZG9uJ3Qgc2F5IGFueXRoaW5nIHlvdSB3b3VsZG4ndCB3YW50IGFueW9uZSBlbHNlIHRvIGhlYXIuDQogICAgIFlvdSBuZXZlciBrbm93IHdobyBjb3VsZCBiZSBsdXJraW5nIGluIHRoZSBjcm93ZC4uLg0KDQombHQ7ISZndDsgIFRhdmVybiBIZWxwLiAgRGlzcGxheSB0aGUgcG9ydGlvbiBvZiB0aGUgZG9jdW1lbnRhdGlvbg0KICAgICBkZXNjcmliaW5nIHRoZSBUYXZlcm4gZnVuY3Rpb25zLg0KDQombHQ7USZndDsgIExlYXZlIHRoZSBUYXZlcm4uICBFeGl0IGJhY2sgdG8gdGhlIG1haW4gYXJlYSBvZiB0aGUNCiAgICAgU3RhcmRvY2suDQoNCg0KRkVEUE9MSUNFIEhFQURRVUFSVEVSUyBNRU5VDQoNCiZsdDtBJmd0OyAgQXBwbHkgZm9yIGEgRmVkZXJhbCBDb21taXNzaW9uLiAgVGhlIEZlZGVyYXRpb24gYXdhcmRzDQogICAgIGNvbW1pc3Npb25zIHRvIHRob3NlIGluZGl2aWR1YWxzIHdobyBoYXZlIHNob3duDQogICAgIHRoZW1zZWx2ZXMgdG8gYmUgaGlnaGx5IGV4cGVyaWVuY2VkIGFuZCBsYXcgYWJpZGluZy4gIElmDQogICAgIHlvdSBiZWxpZXZlIHlvdXJzZWxmIHRvIHF1YWxpZnksIGFwcGx5IGF0IHRoZSBQb2xpY2UNCiAgICAgSGVhZHF1YXJ0ZXJzLiAgSWYgdGhlIEZlZHMgZ3JhbnQgeW91IGEgY29tbWlzc2lvbiwgeW91DQogICAgIHdpbGwgYmUgYWJsZSB0byBwcm9jdXJlIGFuIEltcGVyaWFsIFN0YXJzaGlwLiAgVGhpcyBpcyBhDQogICAgIHZlcnkgcG93ZXJmdWwgc2hpcCBidXQgd2l0aCBpdCBjb21lcyBhIGxvdCBvZg0KICAgICByZXNwb25zaWJpbGl0eS4gIFRoZSBGZWRlcmF0aW9uIG1heSBjYWxsIHVwb24geW91IHRvIGFpZA0KICAgICB0aGVpciBjYXVzZSBvZiBtYWludGFpbmluZyBsYXcgYW5kIG9yZGVyIHRocm91Z2hvdXQgdGhlDQogICAgIHVuaXZlcnNlLiAgVGhlcmUgYXJlIGEgbGltaXRlZCBudW1iZXIgb2YgU3RhcnNoaXBzDQogICAgIGF2YWlsYWJsZSwgc28gYXBwbHkgZm9yIHlvdXIgY29tbWlzc2lvbiBhcyBzb29uIGFzIHlvdQ0KICAgICBjYW4uDQoNCiZsdDtDJmd0OyAgQ2xhaW0gYSBGZWRlcmF0aW9uIFJld2FyZC4gIEFmdGVyIHlvdSBoYXZlIGRvbmUgeW91ciBkdXR5DQogICAgIGFzIGEgZ29vZCBGZWRMYXcgYWJpZGluZyBjaXRpemVuLCB5b3Ugd2lsbCB3YW50IHRvIGNsYWltDQogICAgIHRoZSByZXdhcmQgdGhhdCBpcyByaWdodGZ1bGx5IHlvdXJzLiAgTWFyY2ggcmlnaHQgaW50bw0KICAgICB0aGUgUG9saWNlIEhRIGFuZCB0ZWxsIHRoZSBzZXJnZWFudCB0aGF0IGhlIG5vIGxvbmdlciBoYXMNCiAgICAgdG8gd29ycnkgYWJvdXQgdGhlIHNjdW1iYWcgeW91IHRlcm1pbmF0ZWQuICBCZSBzdXJlIHRvDQogICAgIHB1dCB0aGUgcmV3YXJkIG1vbmV5IHRvIGdvb2QgdXNlLg0KDQombHQ7RSZndDsgIEV4YW1pbmUgdGhlIFRlbiBNb3N0IFdhbnRlZCBMaXN0LiAgVGhlcmUgaXMgYSBsaXN0aW5nDQogICAgIGF2YWlsYWJsZSBpbiB0aGUgRmVkUG9saWNlIGJ1aWxkaW5nIG9mIHRoZSBtb3N0IGNvcnJ1cHQNCiAgICAgcGxheWVycyBpbiB0aGUgZ2FtZS4gIFRoaXMgbGlzdCBzaG93cyB0aGUgbGV2ZWwgb2YgZXZpbA0KICAgICB0aGUgcGxheWVyIGhhcyBhY2hpZXZlZCwgdGhlIGNvcnBvcmF0aW9uIHRvIHdoaWNoIGhlL3NoZQ0KICAgICBiZWxvbmdzLCB0aGUgbnVtYmVyIG9mIGJvdW50aWVzIHBvc3RlZCBvbiB0aGF0IHBsYXllciBhbmQNCiAgICAgdGhlIHRvdGFsIHJld2FyZCBmb3IgdGhhdCBwbGF5ZXIncyBkZW1pc2UuDQoNCiZsdDtQJmd0OyAgUG9zdCBhIFJld2FyZCBvbiBTb21lb25lLiAgV291bGQgeW91IGxpa2UgdG8gbWFrZSBpdCBhDQogICAgIGxpdHRsZSBtb3JlIHJld2FyZGluZyBmb3Igc29tZW9uZSB0byBnZXQgb25lIG9mIHRoZQ0KICAgICBwbGF5ZXJzIG9uIHRoZSBNb3N0IFdhbnRlZCBsaXN0PyAgWW91IGNhbiBvZmZlciBhcyBzbWFsbA0KICAgICBvciBhcyBsYXJnZSBhIHBheW1lbnQgYXMgeW91IHdvdWxkIGxpa2UuICBKdXN0IHNlZSB0aGUNCiAgICAgb2ZmaWNlciBvbiBkdXR5IGFuZCB0ZWxsIGhpbSB5b3Ugd2FudCB0byBwb3N0IGEgcmV3YXJkLg0KICAgICBZb3Ugd2lsbCBiZSBzaG93biB0aGUgbGlzdCBvZiB0aGUgTW9zdCBXYW50ZWQgY3JpbWluYWxzLg0KICAgICBUZWxsIHRoZSBuaWNlIG9mZmljZXIgd2hpY2ggb25lIHlvdSB3b3VsZCBtb3N0IGxpa2UgdG8NCiAgICAgc2VlIGJyb3VnaHQgdG8ganVzdGljZSBhbmQgaG93IG11Y2ggeW91IHdhbnQgdG8gZ2l2ZSB0bw0KICAgICBoZWxwIGluIHRoZSBjYXVzZS4NCg0KJmx0OyEmZ3Q7ICBGZWRQb2xpY2UgSGVscC4gIERpc3BsYXkgdGhlIHBvcnRpb24gb2YgdGhlIGRvY3VtZW50YXRpb24NCiAgICAgZGVzY3JpYmluZyB0aGUgRmVkUG9saWNlIGZ1bmN0aW9ucy4NCg0KJmx0O1EmZ3Q7ICBMZWF2ZSB0aGUgUG9saWNlIFN0YXRpb24uICBFeGl0IHRoZSBidWlsZGluZyBhbmQgcmV0dXJuDQogICAgIHRvIHRoZSBtYWluIGFyZWEgb2YgdGhlIFN0YXJEb2NrLg0KDQoNCkJBTksgTUVOVQ0KDQombHQ7RCZndDsgIE1ha2UgYSBEZXBvc2l0LiAgWW91IGNhbiBpbmZvcm0gdGhlIFRlbGxCb3JnIHRoYXQgeW91DQogICAgIHdpc2ggdG8gZGVwb3NpdCBzb21lIG9yIGFsbCBvZiB0aGUgY3JlZGl0cyB5b3UgaGF2ZSB3aXRoDQogICAgIHlvdS4gIFRoZSB0cmFuc2FjdGlvbiBpcyByZWNvcmRlZCBpbnN0YW50bHkgc28geW91IGRvbid0DQogICAgIGhhdmUgdG8gd2FpdCB0aHJlZSBkYXlzIGZvciB5b3VyIGRlcG9zaXQgdG8gYmUgcmVmbGVjdGVkDQogICAgIGluIHlvdXIgYWNjb3VudC4NCg0KJmx0O0UmZ3Q7ICBFeGFtaW5lIEJhbGFuY2UuICBZb3UgbWlnaHQgd2FudCB0byBzZWUgaWYgdGhhdCBvdGhlcg0KICAgICB0cmFkZXIgd2hvIHByb21pc2VkIHlvdSBhIHJld2FyZCBmb3IgaGVscGluZyBvdXQgd2l0aCB0aGUNCiAgICAgRmVycmVuZ2kgaGFzIGNvbWUgdGhyb3VnaCB3aXRoIHRoZSBjcmVkaXRzLiAgWW91IG1pZ2h0DQogICAgIG9ubHkgd2FudCB0byBjaGVjayB5b3VyIGZ1bmRzIHRvIHNlZSBpZiB5b3UgY2FuIGdvIG9uIGENCiAgICAgc3BlbmRpbmcgc3ByZWUgYXQgdGhlIEhhcmR3YXJlIEVtcG9yaXVtLiAgVGhpcyBzZWxlY3Rpb24NCiAgICAgY2FuIHB1dCB0aGUgYW5zd2VyIGF0IHlvdXIgZmluZ2VydGlwcy4NCg0KJmx0O1QmZ3Q7ICBUcmFuc2ZlciBGdW5kcy4gIElmIHlvdSBuZWVkIHRvIGdldCBmdW5kcyB0byBhIFRyYWRlciB3aG8NCiAgICAgaXMgbm90IGluIHlvdXIgY29ycG9yYXRpb24sIHRoaXMgb3B0aW9uIHdpbGwgYXV0aG9yaXplDQogICAgIHlvdSB0byBtYWtlIGEgZGVwb3NpdCBpbiB0aGF0IG90aGVyIFRyYWRlcidzIGFjY291bnQuDQogICAgIE5hdHVyYWxseSwgeW91IG11c3QgaGF2ZSB0aGUgY3JlZGl0cyB0byBiZSBhYmxlIHRvDQogICAgIHRyYW5zZmVyIHRoZW0uDQoNCiZsdDtXJmd0OyAgV2l0aGRyYXcgRnVuZHMuICBTYXZpbmcgY2FuIHJlYWxseSBwYXkgb2ZmLiAgSWYgeW91ciBzaGlwDQogICAgIGhhcyBiZWVuIGRlc3Ryb3llZCBhbmQgeW91IGRvbid0IHdhbnQgdG8gc3RhcnQgZnJvbQ0KICAgICBzY3JhdGNoIGluIGEgU2NvdXQsIGEgbmVzdCBlZ2cgaW4gdGhlIEdhbGFjdGljIEJhbmsgY2FuDQogICAgIGFsbG93IHlvdSB0byBjb21lIHJpZ2h0IGJhY2sgd2l0aCB0aGUgc2hpcCBvZiB5b3VyDQogICAgIGNob2ljZS4gIFVzZSB0aGlzIG9wdGlvbiB0byB0YWtlIHlvdXIgc2F2aW5ncyBhbmQgc3BlbmQNCiAgICAgdGhlbSBhbnkgd2F5IHlvdSBjaG9vc2UuICBZb3UgYW5kIG9ubHkgeW91IGhhdmUgdGhlDQogICAgIGF1dGhvcml6YXRpb24gdG8gd2l0aGRyYXcgY3JlZGl0cyBmcm9tIHlvdXIgYWNjb3VudC4NCg0KJmx0OyEmZ3Q7ICBCYW5rIEhlbHAuICBEaXNwbGF5IHRoZSBwb3J0aW9uIG9mIHRoZSBkb2N1bWVudGF0aW9uDQogICAgIGRlc2NyaWJpbmcgdGhlIEJhbmsgZnVuY3Rpb25zLg0KDQombHQ7USZndDsgIExlYXZlIHRoZSBCYW5rLiAgUmV0dXJuIHRvIHRoZSBtYWluIGFyZWEgb2YgdGhlIFN0YXJEb2NrLg0K') + '</pre>')
    window.scrollTo(0,0)
  }

  var formatWarpsList = function(warps) {
    var warpString = ''
    for (var i in warps.sort(function(a, b) { return a.number - b.number })) {
      warpString += '<a href="" class="' + (warps[i].explored == false ? 'ansi-bright-red-fg unexplored' : 'ansi-bright-cyan-fg') + '" data-attribute="move" data-id="' + warps[i].number + '">' + warps[i].number + '</a>'
      if (i < warps.length - 1)
        warpString += ' <span class="ansi-green-fg">-</span> '
    }
    return warpString      
  }

  var showHelp = function(nextFunction) {
    gameDocs()
    pressAnyKey(nextFunction)
  }

  var showScoresByValue = function(nextFunction, thisUserID) {
    $.get('/score/', function(result) {
      var table = $('<table></table>').addClass('table table-condensed scores')
      table.append($('<thead></thead>').addClass('ansi-magenta-fg').html('<tr><td>#</td><td style="text-align: right">Rank</td><td style="text-align: right">Alignment</td><td>Corp</td><td>Trader Name</td><td>Ship type</td></tr>'));
      for (var i in result)
        table.append($('<tr></tr>').html('<td>' + (result[i].rank === 1 || thisUserID == result[i].id ? '<span class="ansi-bright-white-fg ansi-blue-bg">&nbsp;' + result[i].rank + '&nbsp;</span>' : result[i].rank + '&nbsp;' ) + '</td><td' + (result[i].alignment < 0 ? ' class="ansi-bright-red-fg"' : '') + '>' + addCommas(result[i].experience) + '</td><td' + (result[i].alignment < 0 ? ' class="ansi-bright-red-fg"' : '') + '>' + addCommas(result[i].alignment) + '</td><td>' + (result[i].corp ? result[i].corp : '<span class="ansi-bright-blue-fg">**</span>') + '</td><td class="ansi-bright-cyan-fg" style="text-align: left">' + result[i].name + '</td><td style="text-align: left">' + (!result[i].ship ? '<span class="ansi-bright-blue-fg"># <span class="ansi-yellow-fg">Ship Destroyed</span> #</span>' : result[i].ship) + '</td>'))
      el.html('<span class="ansi-bright-cyan-fg">Trade Wars 2015 Trader Rankings : </span><span class="ansi-yellow-fg">' + getStarDate() + '</span><br /><br />')
      el.append(table)
      if (thisUserID)
        nextFunction()
      else
        pressAnyKey(nextFunction)
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
      pressAnyKey(nextFunction)
    })
  }

  var showScoresByTitle = function(nextFunction, thisUserID) {
    $.get('/score/', function(result) {
      var table = $('<table></table>').addClass('table table-condensed scores')
      table.append($('<thead></thead>').addClass('ansi-magenta-fg').html('<tr><td>#</td><td style="text-align: right">Rank Title</td><td>Corp</td><td>Trader Name</td><td>Ship type</td></tr>'));
      for (var i in result)
        table.append($('<tr></tr>').html('<td>' + (result[i].rank === 1 || thisUserID == result[i].id ? '<span class="ansi-bright-white-fg ansi-blue-bg">&nbsp;' + result[i].rank + '&nbsp;</span>' : result[i].rank + '&nbsp;' ) + '</td><td' + (result[i].alignment < 0 ? ' class="ansi-bright-red-fg"' : '') + ' style="text-align: left">' + resolveTitle(result[i].experience, result[i].alignment) + '</td><td>' + (result[i].corp ? result[i].corp : '<span class="ansi-bright-blue-fg">**</span>') + '</td><td class="ansi-bright-cyan-fg" style="text-align: left">' + result[i].name + '</td><td style="text-align: left">' + (!result[i].ship ? '<span class="ansi-bright-blue-fg"># <span class="ansi-yellow-fg">Ship Destroyed</span> #</span>' : result[i].ship) + '</td>'))
      el.html('<span class="ansi-bright-cyan-fg">Trade Wars 2015 Trader Rankings : </span><span class="ansi-yellow-fg">' + getStarDate() + '</span><br /><br />')
      el.append(table)
      if (thisUserID)
        nextFunction()
      else
        pressAnyKey(nextFunction)
    }).fail(function(result) {
      if (typeof result.responseJSON !== 'undefined' && typeof result.responseJSON.error !== 'undefined')
        el.append(result.responseJSON.error + '<br />')
      pressAnyKey(nextFunction)
    })
  }

  var getDate = function(dateTime) {
    var date = new Date(dateTime)
    return $.format.date(date.setFullYear(date.getFullYear() + 28), 'MM/dd/yy')
  }

  var getLogDate = function(dateTime) {
    var date = new Date(dateTime)
    return '<span class="ansi-red-fg">--</span> <span class="ansi-magenta-fg">' + $.format.date(date.setFullYear(date.getFullYear() + 28), 'MM/dd/yy') + '</span> <span class="ansi-red-fg">--</span> <span class="ansi-magenta-fg">' + $.format.date(date.setFullYear(date.getFullYear() + 28), 'hh:mm:ss a') + '</span> <span class="ansi-red-fg">--</span>'
  }

  var getStarDate = function() {
    var date = new Date()
    return $.format.date(date.setFullYear(date.getFullYear() + 28), 'MM/dd/yy hh:mm:ss a')
  }

  var getPortReportDate = function() {
    var date = new Date()
    return $.format.date(date.setFullYear(date.getFullYear() + 28), 'hh:mm:ss a E MMM dd, yyyy')
  }

  var paginate = function(data, page, nextFunction) {
    el.append('<br />')
    for (var i = page * lineHeight; i < (page * lineHeight) + lineHeight; i++) {
      if (typeof data[i] === 'undefined')
        break
      el.append(data[i] + '<br />')
    }
    el.append('<span class="ansi-magenta-fg">[Pause]</span>')
    pageTimer = setTimeout(function() { el.append('<span class="ansi-magenta-fg"> - <strong>[Press Space or Enter to continue]</strong></span>') }, 10000)
    window.scrollTo(0, document.body.scrollHeight)
    $(document).one('keyup.paginate', null, function(e) {
      clearTimeout(pageTimer)
      if (typeof data[i] === 'undefined')
        return
      paginate(data, page + 1)
    })
    if (typeof nextFunction !== 'undefined')
      nextFunction()
  }

  var addCommas = function(str) {
    str += ''
    x = str.split('.')
    x1 = x[0]
    x2 = x.length > 1 ? '.' + x[1] : ''
    var rgx = /(\d+)(\d{3})/
    while (rgx.test(x1))
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    return x1 + x2
  }

  var getRandom = function(array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  return {
    init: function() {
      showUniverses()
    },
    show: function() {
      getSectorData(displayCurrentSector)
    }
  }
}()

jQuery(document).ready(function() {
  Tradewars.init()
})
