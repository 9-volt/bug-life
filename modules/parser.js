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
    if (err !== null) {
      return that.onError("unknown-error")
    }
    final_repo_info.name = repo.name
    final_repo_info.created_at = formatDate(new Date(repo.created_at))
    final_repo_info.url = repo.url
  })

  var issues = github.getIssues(username, reponame)
  var issues_events = github.getIssuesEvents(username, reponame)
  issues.list_all({"state": "all", "per_page": "100"}, function(err, issues) {
    if (err !== null) {
      return that.onError("unknown-error")
    }
    final_repo_info.labels = that.get_labels(issues)
    var all_issues = issues.filter(is_not_pull_request)
    if (all_issues.length === 0) {
      return that.onError("no-issues")
    }

    issues_events.list_all({"per_page": "100"}, function(err, issues_events) {
      if (err !== null) {
        return that.onError("unknown-error")
      }
      issues_events.reverse()
      var issues = that.get_issues_from_events(issues_events)
      var events = issues_events.filter(is_of_type)
      events = events.filter(is_not_pull_request_event)
      final_repo_info.labels = that.get_labels(issues, final_repo_info.labels)
      var hash_issues = that.prepare_issues(all_issues)
      that.add_issue_events(hash_issues, events)
      final_repo_info.issues = that.tranform_issues(hash_issues)
      that.afterParse(final_repo_info)
    })
  })
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
 * @param  {Array} issues
 * @param  {Array} labels
 * @return {Array}
 */
Parser.prototype.get_labels = function(issues, labels) {
  labels = typeof labels !== 'undefined' ? labels : [];
  for (var i = 0; i < issues.length; i++) {
    var issue_labels = issues[i].labels
    for (var j = 0; j < issue_labels.length; j++) {
      if (!inArrayByName(labels, issue_labels[j].name)) {
        labels.push(issue_labels[j])
      }
    }
  }
  return labels
}

/**
 * Extract issues from events
 * @param  {Array} events
 * @return {Array}
 */
Parser.prototype.get_issues_from_events = function(events) {
  var issues = []
  for (var i = 0; i < events.length; i++) {
    issues.push(events[i].issue)
  }
  return issues
}

/**
 * Transform issues into an Array of hashes tables with minimum necessary info
 * about the issues
 * @param  {Array} issues
 * @return {Object}
 */
Parser.prototype.prepare_issues = function(issues) {
  var issues_obj = {}
  for (var i = 0; i < issues.length; i++) {
    issues_obj[issues[i].number] = {
      "url": issues[i].url
      , "title": issues[i].title
      , "state": issues[i].state 
      , "open": [{
        "from": formatDate(new Date(issues[i].created_at))
        , "to": issues[i].closed_at === null ? null : formatDate(new Date(issues[i].closed_at))
      }]
      , "labels": issues[i].labels
    }
  }
  return issues_obj
}

/**
 * Add events info about issues
 * @param {Object} issues
 * @param {Array} events
 */
Parser.prototype.add_issue_events = function(issues, events) {
  for (var i = 0; i < events.length; i++) {
    var number = events[i].issue.number
    if (events[i].event === "closed") {
      this.add_closed_event(issues[number], events[i])
    } else if (events[i].event === "reopened") {
      this.add_reopened_event(issues[number], events[i])
    } else {
      continue
    }
  }
  return issues
}

/**
 * Add closed issue event to issue object
 * @param {Object} issue
 * @param {Object} event
 */
Parser.prototype.add_closed_event = function(issue, event) {
  var event_created_at = formatDate(new Date(event.created_at))
  issue.open[issue.open.length - 1].to = event_created_at
}

/**
 * Add reopened issue event to issue object
 * @param {Object} issue
 * @param {Object} event
 */
Parser.prototype.add_reopened_event = function(issue, event) {
  var event_created_at = formatDate(new Date(event.created_at))
  issue.open.push({"from": event_created_at, "to": null})
}

/**
 * Transform issues data from a hash table to an array to objects
 * @param  {Object} hash_issues
 * @return {Array}
 */
Parser.prototype.tranform_issues = function(hash_issues) {
  var issues = []
  for (number in hash_issues) {
    var issue = hash_issues[number]
    issue.number = parseInt(number)
    issues.push(issue)
  }
  return issues
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
  var month = date_obj.getMonth() + 1
  var year = date_obj.getFullYear()
  return year + "-" + pad2(month) + "-" + pad2(date)
}

/**
 * Check if an element is of one of the types: closed, reopened, labeled, unlabeled
 * @param  {Object}  element
 * @return {Boolean}
 */
function is_of_type(element) {
  var types = ["closed", "reopened", "labeled", "unlabeled"]
  if (types.indexOf(element.event) > -1) {
    return true
  }
  return false
}

/**
 * Check if an element is a issue and not a pull request
 * @param  {Object}  element
 * @return {Boolean}
 */
function is_not_pull_request(element) {
  return !element.hasOwnProperty('pull_request')
}

/**
 * Check is an event is not a pull request event
 * @param  {Object}  element
 * @return {Boolean}
 */
function is_not_pull_request_event(element) {
  return !element.issue.hasOwnProperty('pull_request')
}

/**
 * Pad a number to 2 digits
 * @param  {Number} number
 * @return {Number}
 */
function pad2(number) {
  return (number < 10 ? '0' : '') + number
}

/**
 * Helper function to debug prints
 * @param  {Object} value
 */
function c(value) {
  console.log(value)
}
