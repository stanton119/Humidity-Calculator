function submitPostcode(plottingFcn=adjustPlot) {
  var postCode = getPostcodeForm()
  postCode = formatPostcode(postCode)
  // document.getElementById("postcodeInput").value = postCode

  getForecast(postCode, plottingFcn)
}

function getPostcodeForm() {
  var postCode = document.getElementById("postcodeInput").value;
  if (postCode == "") {
    postCode = document.getElementById("postcodeInput").getAttribute("placeholder");
  }
  return postCode
}

function formatPostcode(postCode) {
  // limit to first part of the postcode
  var spacePos = postCode.search(' ')
  if (spacePos > -1) {
    postCode = postCode.substring(0, spacePos)
  }
  return postCode
}

function getForecast(postcode, plottingFcn, source = 'bbc') {
  if (source == 'bbc') {
    return getBBCForecast(postcode, plottingFcn)
  }
}

function getBBCForecast(postcode, plottingFcn) {
  var url = "https://weather-broker-cdn.api.bbci.co.uk/en/forecast/aggregated/" + postcode;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(data => processForcast(data, standardiseBBCWeather, plottingFcn))
    .catch(err => { throw err });
}

function processForcast(data, standardiseFcn, plottingFcn) {
  var standardisedData = standardiseFcn(data)
  var processedData = addInsideHumidity(standardisedData)

  var traces = createTraces(processedData)
  plottingFcn(traces)
}

function standardiseBBCWeather(data) {
  return processBBCForcasts(data['forecasts'])
}

function processBBCForcasts(forecasts) {
  var list = []
  for (var key in forecasts) {
    result = processBBCReports(forecasts[key]["detailed"]["reports"])
    list = list.concat(result)
  }
  return list
}

function processBBCReports(reports) {
  var reportOutput = []
  reports.forEach(function (report) {
    var date = new Date(report['localDate'])
    date.setHours(Number(report['timeslot'].substring(0, 2)))

    reportOutput.push({ date: date, outside_humidity: report['humidity'], outside_temp: report['temperatureC'] })
  })
  return reportOutput
}

function saturatePressure(temp) {
  var pressure = 6.122 * Math.exp(17.62 * temp / (243.12 + temp))
  return pressure
}

function getInsideHumidity(outside_temp, outside_humidity) {
  return (
    (inside_temp + 273)
    * outside_humidity
    * saturatePressure(outside_temp)
    / ((outside_temp + 273) * saturatePressure(inside_temp))
  )
}

function addInsideHumidity(data) {
  data.forEach(function (row) {
    row['inside_humidity'] = getInsideHumidity(row['outside_temp'], row['outside_humidity'], row['inside_temp'])
  })
  return data
}

function createTraces(data) {
  var dateList = listFromDicts(data, 'date')

  var traceInHum = createTrace(dateList, listFromDicts(data, 'inside_humidity'), 'Inside humidity')
  var traceOutHum = createTrace(dateList, listFromDicts(data, 'outside_humidity'), 'Outside humidity')
  var traceOutTemp = createTrace(dateList, listFromDicts(data, 'outside_temp'), 'Outside temperature', 'legendonly')

  var traces = [traceInHum, traceOutHum, traceOutTemp]
  return traces
}

function listFromDicts(data, key) {
  var list = []
  data.forEach(function (element) {
    list.push(element[key])
  })
  return list
}

function createTrace(x, y, name, visible = true) {
  var trace = {
    type: "scatter",
    mode: "lines",
    name: name,
    x: x,
    y: y,
    visible: visible,
  }
  return trace
}

function createPlot(traces) {
  var xrangemin = new Date;
  var xrangemax = new Date(xrangemin.getTime()).setDate(xrangemin.getDate() + 3);
  var layout = {
    title: plotTitle,
    height: 800,
    xaxis: {
      range: [xrangemin, xrangemax],
      rangeslider: {}
    },
  };
  updatePlotData(traces)
  Plotly.newPlot(plotDiv, plotData, layout);
}

function updatePlotData(traces) {
  plotData.length = 0
  traces.forEach(trace => {
    plotData.push(trace)
  });
}

function adjustPlot(traces) {
  updatePlotData(traces)
  Plotly.redraw(plotDiv);
}

function findGetParameter(parameterName) {
  // https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
  var result = null,
      tmp = [];
  location.search
      .substr(1)
      .split("&")
      .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
      });
  return result;
}

function defaultSetup() {
  var postCode = findGetParameter('postcode')
  if (postCode != null) {
    postCode = formatPostcode(postCode)
    document.getElementById("postcodeInput").value = postCode
  }
  submitPostcode(createPlot)
}

// page setup
var form = document.getElementById("postCodeForm");
function handleForm(event) {
  event.preventDefault();
  submitPostcode();
}
form.addEventListener('submit', handleForm);

const plotDiv = 'plotDiv'
const plotTitle = ''
var plotData = []
const inside_temp = 21

defaultSetup()