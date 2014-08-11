// Construstor
var Visuals = function(selector) {
  this.init(selector)
}

/**
 * Init visuals. One time call
 * @param  {String} selector
 */
Visuals.prototype.init = function(selector) {

}

Visuals.prototype.showLoading = function() {
  console.log('Visual Loading')
}

Visuals.prototype.showError = function(message) {
  console.log('Visual Error', message)
}

Visuals.prototype.showData = function(data) {
  console.log('Visual Data is', data)
}
