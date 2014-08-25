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
    $progress.show()

    visuals.showLoading()
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

    $progress.hide()
    setProgress(0)

    showAlert('<strong>Error occured!</strong> ' + message, 'danger')

    visuals.showError()
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
  $('#examples').on('click', 'a', function(ev){
    $repositoryInput.val($(this).data('github'))
    checkAndParse()
  })

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

  // Show the popup with auth
  var repositoryUri = ''
  parser.onAuthRequired = function(_repositoryUri) {
    repositoryUri = _repositoryUri
    $('#authModal').modal($('#authModal').data())
  }

  // Proceed with GitHub authentication
  $('#authModal').on('click', '#proceed-to-auth', function(ev){
    console.log(ev)
    ev.preventDefault()

    hello('github').login({redirect_uri:'redirect.html'}, function(ev) {
      if (!ev.hasOwnProperty("error")) {
        var github = hello("github").getAuthResponse()

        parser.token = github.access_token
        document.cookie = "token=" + github.access_token

        // Continue with parsing
        parser.parse(repositoryUri)
      }
    })
  })
})
