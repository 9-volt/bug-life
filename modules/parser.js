// Construstor
var Parser = function() {
  this.init()
}

/**
 * Init parser. One time call
 */
Parser.prototype.init = function() {

}

/**
 * Before parse callback
 */
Parser.prototype.beforeParse = function () {}

/**
 * After parse callback
 * @param {Object} data
 */
Parser.prototype.afterParse = function (data) {}

/**
 * When error happens execute this callback
 * @param {String} message
 */
Parser.prototype.onError = function (message) {}

/**
 * Parser starting point
 * @param  {String} repository_uri - username:reponame
 */
Parser.prototype.parse = function(repository_uri) {
  var that = this

  this.beforeParse()
  var github = this.auth()
  var repository_uri_splitted = repository_uri.split("/")
  var username = repository_uri_splitted[0]
  var reponame = repository_uri_splitted[1]

  var repo = github.getRepo(username, reponame);
  var final_repo_info = {}
  repo.show(function(err, repo) {
    final_repo_info.name = repo.name
    final_repo_info.created_at = formatDate(new Date(repo.created_at))
    final_repo_info.url = repo.url
  })

  var issues = github.getIssues(username, reponame)
  issues.list({}, function(err, issues) {
    final_repo_info.labels = that.get_labels(issues)
  })

  // Send afterParse after 500 ms
  setTimeout(function(){
    // Once in a while fake an error
    if (Math.random() > 0.9) {
      that.onError()
    } else {
      that.afterParse({
        name: 'Repository Title',
        created_at: '2011-01-26',
        url: 'https://github.com/TUM-FAF/FAFSite',
        labels: [
          {
            url: 'https://github.com/TUM-FAF/FAFSite/labels/suggestion',
            name: 'Suggestion',
            color: '#FFDC00'
          },
          {
            url: 'https://github.com/TUM-FAF/FAFSite/labels/front-end',
            name: 'Front-end',
            color: '#02e10c'
          }
        ],
        issues: [
          {
            number: 40,
            url: 'https://github.com/TUM-FAF/FAFSite/issues/40',
            title: 'Create a site monitor',
            state: 'open',
            open: [
              {
                from: '2011-01-27',
                to: '2011-01-29'
              },
              {
                from: '2011-02-04',
                to: '2011-03-24'
              },
              {
                from: '2012-03-12',
                to: null
              }
            ],
            labels: [
              {
                url: 'https://github.com/TUM-FAF/FAFSite/labels/suggestion',
                name: 'Suggestion',
                color: '#FFDC00',
                assigned: [
                  {
                    from: '2011-01-27',
                    to: null
                  }
                ]
              },{
                url: 'https://github.com/TUM-FAF/FAFSite/labels/front-end',
                name: 'Front-end',
                color: '#02e10c',
                assigned: [
                  {
                    from: '2011-02-04',
                    to: '2012-03-12'
                  },{
                    from: '2014-02-02',
                    to: null
                  }
                ]
              }
            ]
          },{
            number: 39,
            url: 'https://github.com/TUM-FAF/FAFSite/issues/39',
            title: 'Deploy site to new host',
            state: 'open',
            open: [
              {
                from: '2012-02-12',
                to: null
              }
            ]
          },{
            number: 28,
            url: 'https://github.com/TUM-FAF/FAFSite/issues/28',
            title: 'jQuery update',
            state: 'closed',
            open: [
              {
                from: '2013-07-20',
                to: '2014-02-04'
              }
            ]
          }
        ]
      })
    }
  }, 500)
}

/**
 * Github authentication
 * @return {Object}
 */
Parser.prototype.auth = function() {
  var github = new Github({
    // insert here github token
    // can't be set as env vars, because it's client-side javascript
    // therefore hardcode all the tokens!
    token: ""
    , auth: "oauth"
  })
  return github
}

/**
 * Get all issues' labels from a repo
 * @param  {Object} issues
 * @return {Array}
 */
Parser.prototype.get_labels = function(issues) {
  var labels = []
  for (var i = 0; i < issues.length; i++) {
    var issue_labels = issues[i].labels
    for (var j = 0; j < issue_labels.length; j++) {
      if (!inArrayByName(labels, issue_labels[j].name))
        labels.push(issue_labels[j])
    }
  }
  return labels
}

/**
 * Check if a value is in an array of objects with property "name"
 * @param  {Array} list
 * @param  {String} name
 * @return {Boolean}
 */
function inArrayByName(list, value) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].name === value)
      return true
  }
  return false
}

/**
 * Return a string representation of the date in format year-date-month
 * @param  {Date} date_obj
 * @return {String}
 */
function formatDate(date_obj) {
  var date = date_obj.getDate()
  var month = date_obj.getMonth()
  var year = date_obj.getFullYear()
  return year + "-" + date + "-" + month
}

/**
 * Helper function to debug prints
 * @param  {Object} value
 */
function c(value) {
  console.log(value)
}