$(function(){
  var parser = new Parser()
    , visuals = new Visuals('graph')
    , $repository = $('#repository')
    , $repoTitle = $('#repo-title')
    , $repoDescription = $('#repo-description')
    , loadingText = 'Loading...'
    , errorText = 'Error'

  parser.beforeParse = function(){
    $repoTitle.text(loadingText)
    $repoDescription.text(loadingText)

    visuals.showLoading()
  }

  parser.afterParse = function(data){
    $repoTitle.text(data.name || '')
    $repoDescription.text(data.description || '')

    visuals.showData(data)
  }

  parser.onError = function(){
    $repoTitle.text(errorText)
    $repoDescription.text(errorText)

    visuals.showError()
  }

  parser.onProgress = function(progress){
    console.log('Progress', progress)
  }

  // On form submit
  $('#repository-form').submit(function(ev){
    ev.preventDefault()

    if ($repository.val()) {
      parser.parse($repository.val())
    }
  })

  $('#examples').on('click', 'a', function(ev){
    ev.preventDefault()

    var $this = $(this)

    $repository.val($this.data('github'))
    parser.parse($this.data('github'))
  })

  // If initial form has a value
  if ($repository.val()) {
    parser.parse($repository.val())
  }

  // Init authentication
  hello.init({github : "baf32f7bbb8d975e64f3"})

  // Show the popup with auth
  var repo_uri = ''
  parser.onAuthRequired = function(repository_uri) {
    $("#login-popup").show()
    repo_uri = repository_uri
  }

  // Authenticate with github
  $("#login").on("click", function(event) {
    hello('github').login({redirect_uri:'redirect.html'}, function(ev) {
      if (!ev.hasOwnProperty("error")) {
        var github = hello("github").getAuthResponse()
        parser.token = github.access_token
        document.cookie = "token=" + github.access_token
        parser.parse(repo_uri)
      }
    })
  })
})
