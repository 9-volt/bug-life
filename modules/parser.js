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
 * @param  {String} repository_uri
 */
Parser.prototype.parse = function(repository_uri) {
  var that = this

  this.beforeParse()

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
