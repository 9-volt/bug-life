$(function(){
  var parser = new Parser()
    , visuals = new Visuals('graph')
    , $repositoryInput = $('#repository-input')
    , $repositoryButton = $('#repository-button')
    , $repoTitle = $('#repo-title')
    , $repoDescription = $('#repo-description')
    , loadingText = 'Loading...'
    , errorText = 'Error'
    , $repositoryAlert = $('#repository-alert')
    , parsingLocked = false
    , $graphs = $('#graphs')
    , $progress = $('#progress')
    , $progressBar = $progress.children('.progress-bar')
    , $tokenForm = $('#token-form')
    , $tokenInput = $('#token-input')
    , $tokenButton = $('#token-button')

  /*
    Alert
  */

  /**
   * Display alert message
   * @param  {String} message Message may contain html elements
   * @param  {String} type    success, info, warning or danger. info by default
   */
  function showAlert(message, type) {
    type = type !== void 0 ? type : 'info'

    $repositoryAlert
      .html(message)
      .removeClass('alert-success alert-info alert-warning alert-danger')
      .addClass('alert-' + type)
      .show()
  }

  function hideAlert() {
    $repositoryAlert.hide()
  }

  function setProgress(progress) {
    $progressBar
      .attr('aria-valuenow', progress)
      .width(progress + '%')
      .text(progress + '%')
  }


  /*
    Parser callbacks
  */
  parser.beforeParse = function(){
    $repoTitle.text(loadingText)
    $repoDescription.text(loadingText)
    lockInput()

    $graphs.hide()
    visuals.emptyGraphs()
    $progress.show()
  }

  parser.afterParse = function(data){
    $repoTitle.text(data.name || '')
    $repoDescription.text(data.description || '')
    unlockInput()

    $progress.hide()
    setProgress(0)
    $graphs.show()

    visuals.showData(data)
  }

  parser.onError = function(message){
    $repoTitle.text(errorText)
    $repoDescription.text(errorText)
    unlockInput()
    lastInputValue = null

    $progress.hide()
    setProgress(0)

    showAlert('<strong>Error occured!</strong> ' + message, 'danger')
  }

  parser.onProgress = function(progress){
    setProgress(progress)
  }

  /*
    Lock input while loading
  */
  function lockInput() {
    parsingLocked = true
    $repositoryInput.attr('disabled', 'disabled')
    $repositoryButton.button('loading')
  }

  function unlockInput() {
    parsingLocked = false
    $repositoryInput.removeAttr('disabled')
    $repositoryButton.button('reset')
  }

  /*
    On page processing
  */
  var lastInputValue = null

  function parseInput(str) {
    var fullRegexp = /^https?\:\/\/github.com\/([a-z0-9\-\_\.]+\/[a-z0-9\-\_\.]+)\/?/i
      , simpleRegexp = /([a-z0-9\-\_\.]+\/[a-z0-9\-\_\.]+)\/?/i
      , match

    // Check if full repo url was passed (http://github.com/user/name)
    if ((match = fullRegexp.exec(str)) != null) {
      return match[1]
    } else if ((match = simpleRegexp.exec(str)) != null) {
      return match[1]
    } else {
      return null
    }
  }

  function checkAndParse() {
    // Do not check if script is still working
    if (parsingLocked) {
      return
    }

    var val = parseInput($repositoryInput.val())

    // Update input value with parsed value
    if (val !== null && $repositoryInput.val() !== val) {
      $repositoryInput.val(val)
    }

    if (val !== null && val !== lastInputValue) {
      // Update browser history
      window.history.pushState({}, "", document.location.href.replace(/\?.*/i, '').replace(/\/$/i, '') + '/?repo=' + val)

      hideAlert()

      // Cache last value
      lastInputValue = val

      // Run parser
      parser.parse(val)

      // Change button state
      checkButtonState()
    } else if (val === null) {
      // Display warning
      showAlert('<strong>Wrong format!</strong> Please insert repository slug as <code>user/name</code> or <code>https://github.com/user/name</code>', 'warning')
    }
  }

  // On form submit
  $('#repository-form').submit(function(ev){
    ev.preventDefault()
    checkAndParse()
  })

  // On clicking examples links
  $('.examples').on('click', 'a', function(ev){
    $repositoryInput.val($(this).data('github'))
    checkAndParse()
  })

  function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}
      , tokens
      , re = /[?&]?([^=]+)=([^&]*)/g
      ;

    while (tokens = re.exec(qs)) {
      params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
  }

  // If repo is passed trough URI then assign it to input
  if (document.location.search && getQueryParams(document.location.search).hasOwnProperty('repo')) {
    $repositoryInput.val(getQueryParams(document.location.search).repo)
  }

  window.onpopstate = function() {
    if (getQueryParams(document.location.search).hasOwnProperty('repo')) {
      $repositoryInput.val(getQueryParams(document.location.search).repo)
      checkAndParse()
    }
  }

  // If initial form has a value
  if ($repositoryInput.val()) {
    checkAndParse()
  }

  function checkButtonState(){
    var val = parseInput($repositoryInput.val())

    if (val !== null && val !== lastInputValue) {
      $repositoryButton.addClass('btn-primary')
    } else {
      $repositoryButton.removeClass('btn-primary')
    }
  }

  // On input content changes (but is not submitted)
  $repositoryInput.on('change paste keyup', function(ev){
    // Do not process when Enter is pressed
    if (ev.type === 'keyup' && ev.keyCode === 13) {
      return;
    }

    checkButtonState()
  })

  /*
    Authentication
  */
  // Init authentication
  hello.init({github : "baf32f7bbb8d975e64f3"})

  // Show the message with auth request
  parser.onAuthRequired = function(repositoryUri) {
    unlockInput()
    showAlert('<strong>API rate limit exceeded</strong> You have exceeded your API requests rate limit or you have no permissions to view this repository issues. In order to increase limit please <a href="#" class="authorization-request">authorize</a> this application. Alternatively you can <a href="https://help.github.com/articles/creating-an-access-token-for-command-line-use" target="_blank">generate a token</a> and <a href="#" class="toggle-token-input">set it manually</a>.<br><br><a class="btn btn-warning authorization-request">Click here to authorize application</a>', 'warning')
  }

  // Auth request
  $('#repository-alert').on('click', '.authorization-request', function(ev){
    ev.preventDefault()

    hello('github').login({redirect_uri:'redirect.html'}, function(ev) {
      if (!ev.hasOwnProperty("error")) {
        var github = hello("github").getAuthResponse()

        parser.token = github.access_token
        // Save into cookies
        document.cookie = "token=" + github.access_token

        // Continue with parsing
        lastInputValue = null
        checkAndParse()
      }
    })
  })

  /*
  Token input
   */

  $('body').on('click', '.toggle-token-input', function(ev){
    ev.preventDefault()

    $tokenForm.toggle(function(){
      if ($(this).css('display') !== 'none') {
        // Update token input
        $tokenInput.val(parser.token)
      }
    })
  })

  $tokenForm.submit(function(ev){
    ev.preventDefault()

    var token = $tokenInput.val()

    // Update token
    parser.token = token
    // Save into cookies
    document.cookie = "token=" + token

    $tokenForm.hide()
  })

  // display-token-input
})
