$(function(){
  // Construstor
  var Visuals = function(selector) {
    this.init(selector)
  }

  var NO_LABEL_COLOR = 'ccc'
    , NO_LABEL_TITLE = 'no label'
    , MARGIN_RIGHT = 30
    , MARGIN_LEFT = 0
    , STROKE_OPACITY = 0.4
    , STROKE_OPACITY_ACTIVE = 0.9
    ;

  /**
   * Init visuals. One time call
   * @param  {String} selector
   */
  Visuals.prototype.init = function(selector) {
    var that = this
      , $svg1 = $('#stackedArea svg')
      , $svg2 = $('#semiCircles svg')
      , $graphs = $('#graphs')

    // Init semicircles container
    d3.select('#semiCircles')
      // .style('margin-left', MARGIN_LEFT)
      // .style('margin-right', MARGIN_RIGHT + 'px')

    // On resize
    var onResize = function(ev){
      if (that.lastData != null) {
        that.showSemiCircles(that.lastData, false)
      }

      var width = $graphs.width()
        , svg1Height = Math.ceil(Math.max(200, width / 3))
        , svg2Height = Math.ceil(Math.max(200, width / 2.5))

      $svg1.height(svg1Height)
      $svg2.height(svg2Height)
    }
    // Trigger on resize for the first time
    onResize()

    window.addEventListener('resize', onResize)
  }

  Visuals.prototype.emptyGraphs = function() {
    d3.selectAll('#stackedArea > svg > *').remove()
    d3.selectAll('#semiCircles > svg > *').remove()
  }

  /**
   * Transforms a date of type YYYY-MM-DD into timestamp
   * @param  {String} str
   * @return {Integer}     timestamp
   */
  function dateToTimestamp(str) {
    if (str == null) {
      // Today
      return Math.ceil(Date.now() / 86400000) * 86400000
    } else {
      var d = str.match(/\d+/g)
      return Date.UTC(d[0], d[1] - 1, d[2])
    }
  }

  Visuals.prototype.showData = function(data) {
    console.log(data)
    this.showStackedArea(data)
    this.showSemiCircles(data)

    this.lastData = data
  }

  Visuals.prototype.showStackedArea = function(data) {
    // Bootstrap stacked area object
    var processedData = bootstrapStackedAreaObject(data)

    // Add time-values to each issue
    fillTimeValues(processedData, data)

    // Object to Array
    var processedDataArray = []
    for (var p in processedData) {
      processedDataArray.push(processedData[p])
    }

    drawStackedArea(processedDataArray)
  }

  function bootstrapStackedAreaObject(data) {
    var datesMilisecondsRange = {}
      , start = dateToTimestamp(data.created_at)
      , today = dateToTimestamp(null) + 1

    // Fill dates range
    while (start < today) {
      datesMilisecondsRange[start] = 0
      start += 86400 * 1000
    }

    var processedData = {}
      , label
      , i

    // Add all labels
    for (i in data.labels) {
      label = data.labels[i]

      processedData[label.name] = {key: label.name, values: [], time: Object.create(datesMilisecondsRange), color: '#' + label.color}
    }

    // Add no label
    processedData[NO_LABEL_TITLE] = {key: NO_LABEL_TITLE, values: [], time: Object.create(datesMilisecondsRange), color: '#' + NO_LABEL_COLOR}

    return processedData
  }

  function fillTimeValues(processedData, data) {
    var i
      , issue
      , l
      , label
      , o
      , open
      , d
      , from
      , to

    // Go throuch all issues
    for (i in data.issues) {
      issue = data.issues[i]

      // If issue has no labels than assign 'no label' label
      if (issue.labels.length === 0) {
        issue.labels.push(NO_LABEL_TITLE)
      }

      // For each label
      for (l in issue.labels) {
        label = issue.labels[l]

        // For each open range
        for (o in issue.open) {
          open = issue.open[o]

          from = dateToTimestamp(open.from)
          to = dateToTimestamp(open.to)

          // Fill label time-value object
          while(from <= to) {
            processedData[label].time[from] += 1
            from += 86400 * 1000 // 3600 * 24 * 1000
          }
        }
      }
    }

    var p
      , _data
      , t

    for (p in processedData) {
      _data = processedData[p]

      // Add tuples of timeKey-value to values array
      for (t in _data.time) {
        _data.values.push([+t, _data.time[t]])
      }

      // Sort values by timeKey
      _data.values.sort(function(a, b){
        return a[0] - b[0]
      })

      // Get rid of time array
      delete _data.time
    }
  }

  function drawStackedArea(processedDataArray) {
    nv.addGraph(function() {
      var chart = nv.models.stackedAreaChart()
        .margin({
          right: MARGIN_RIGHT
        , left: 0
        , bottom: 10
        })
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .useInteractiveGuideline(true)    // Tooltips which show all data points
        .rightAlignYAxis(true)            // Let's move the y-axis to the right side.
        .transitionDuration(500)
        .showControls(false)              // Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
        .clipEdge(true)
        // .showLegend(false)
        .showXAxis(false)                 // Hide X Axis (dates)
        // .showYAxis(false)
        .showLegend(false)                // Hide legend

      //Format x-axis labels with custom function.
      chart.xAxis.tickFormat(function(d) {
        return d3.time.format('%x')(new Date(d))
      });

      chart.yAxis.tickFormat(d3.format(',.0f'));

      d3.select('#stackedArea svg')
        .datum(processedDataArray)
        .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  }

  function dateToDays(str) {
    return dateToTimestamp(str) / 86400000
  }

  function getLabelColor(data, labelName) {
    for (var l in data.labels) {
      if (data.labels[l].name === labelName) {
        return data.labels[l].color
      }
    }

    return NO_LABEL_COLOR
  }

  function getIssuesColors(data) {
    var issuesColors = []
      , issue

    for (var i in data.issues) {
      issue = data.issues[i]

      if (issue.labels.length === 0) {
        issuesColors[issue.number] = ['#' + NO_LABEL_COLOR]
      } else {
        issuesColors[issue.number] = issue.labels.map(function(label){
          return '#' + getLabelColor(data, label)
        })
      }
    }

    return issuesColors
  }

  function splitIssuesByOpenTime(data) {
    var issue
      , splitIssues = data.issues.slice()
      , length = splitIssues.length
      , i, l

    for (i = 0; i < length; i++) {
      issue = splitIssues[i]

      if (issue.open.length > 1) {
        for (l = issue.open.length - 1; l > 0; l--) {
          splitIssues.push({
            labels: issue.labels
          , number: issue.number
          , open: [issue.open[l]]
          , state: issue.state
          , title: issue.title
          , url: issue.url
          })

          delete issue.open[l]

          // Update length after removing
          issue.open.length -= 1
        }

      }
    }

    return splitIssues
  }

  Visuals.prototype.showSemiCircles = function(data, createNew) {
    var container = d3.select('#semiCircles')
      , svg = container.select('svg')
      , width = svg[0][0].offsetWidth
      , start = dateToDays(data.created_at)
      , today = dateToDays(null)
      , scale = d3.scale.linear().domain([0, today - start]).range([MARGIN_LEFT, width + MARGIN_LEFT])
      , issuesColors = getIssuesColors(data)
      , splitIssues = splitIssuesByOpenTime(data)

    // By default create new is true
    createNew = createNew === void 0 ? true : createNew

    if (createNew) {
      this.semiCircles = svg
        .selectAll("circle")
        .data(splitIssues)
        .enter()
        .append('circle')
        .attr("cy", 0)
        .attr('cy', 0)
        .attr('r', 0)
        .style("fill", 'none')
        .style('stroke', function(d) {
          if (issuesColors.length >= d.number) {
            return issuesColors[d.number][0]
          } else {
            return NO_LABEL_COLOR
          }
        })
        .style('stroke-opacity', 0.5)
        .style('stroke-width', 2)
        .on('mouseover', function(d){
          d3.select(this).style({'stroke-opacity': STROKE_OPACITY_ACTIVE})
        })
        .on('mouseout', function(d){
          d3.select(this).style({'stroke-opacity': STROKE_OPACITY})
        })
    }

    // Only if we have semicircles
    if (this.semiCircles != null) {
      // Attributes that vary on window resize
      this.semiCircles
        .data(splitIssues)
        .transition()
          .duration(500)
        .attr("cx", function (d) {
          var from = dateToDays(d.open[0].from)
            , closed_at = d.open[d.open.length - 1].to
            , to = dateToDays(closed_at)

          if (closed_at !== null) {
            return scale((to + from)/2 - start)
          } else {
            // Make it quater of the circle with today as center
            return scale(to - start)
          }
        })
        .attr("r", function (d) {
          var from = dateToDays(d.open[0].from)
            , closed_at = d.open[d.open.length - 1].to
            , to = dateToDays(closed_at)

          if (closed_at !== null) {
            return scale(to - from + 1) / 2
          } else {
            // Make it quater of the circle if it is still open
            return scale(to - from + 0.5)
          }
        })
    }
  }

  window.Visuals = Visuals
})
