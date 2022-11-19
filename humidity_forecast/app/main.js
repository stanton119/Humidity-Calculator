function getURLParameters() {
    var params = {};
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0]) {
                params[tmp[0]] = decodeURIComponent(tmp[1]);
            }
        });
    return params;
}

function getURLParameter(parameterName) {
    var params = getURLParameters()
    return params[parameterName];
}

function setURLParameter(parameterName, value) {
    var page_search = window.location.search
    if (page_search == "") {
        page_search = "?" + parameterName + "=" + value
    } else {
        var params = getURLParameters()
        params[parameterName] = value
        page_search = "?"
        for (const param in params) {
            page_search = page_search + param + "=" + params[param] + "&"
        }
        page_search = page_search.slice(0, -1)
    }

    var path = window.location.pathname;
    var page = path.split("/").pop();

    history.pushState({}, null, page + page_search)
}

class ForecastParams {
    self = this;

    constructor(postCode = 'SW7', indoorTemp = 21) {
        this._postCode = this.formatPostcode(postCode);
        this._indoorTemp = indoorTemp;
    }

    get postCode() {
        return this._postCode;
    }

    set postCode(x) {
        this._postCode = this.formatPostcode(x)
    }

    formatPostcode(x) {
        var spacePos = x.search(' ')
        if (spacePos > -1) {
            x = x.substring(0, spacePos)
        }
        return x;
    }

    get indoorTemp() {
        return this._indoorTemp;
    }

    set indoorTemp(x) {
        var regex = /^-?[0-9]*\.?[0-9]*$/;

        if (x.length > 0 && !regex.test(x)) {
            return "";
        }
        this._indoorTemp = x
    }

    updateFromURL() {
        var _postCode = getURLParameter('postCode')
        if (_postCode != null) {
            this.postCode = _postCode
        }
        var _indoorTemp = getURLParameter('indoorTemp')
        if (_indoorTemp != null) {
            this.indoorTemp = _indoorTemp
        }
    }

    setForm() {
        document.getElementById("postcodeInput").value = this.postCode
        document.getElementById("indoorTempInput").value = this.indoorTemp
    }

    validateForm() {
        this.postCode = document.getElementById("postcodeInput").value
        this.indoorTemp = document.getElementById("indoorTempInput").value

        setURLParameter('postCode', this.postCode)
        setURLParameter('indoorTemp', this.indoorTemp)
        this.setForm()
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

class HumidityData {
    constructor(source = 'bbc') {
        this.source = source;
    }

    getForecast(postcode) {
        if (source == 'bbc') {
            return getBBCForecast(postcode, plottingFcn)
        }
    }
}


function getForecast(postcode, plottingFcn, source = 'bbc') {
    if (source == 'bbc') {
        return getBBCForecast(postcode, plottingFcn)
    }
}

function processForcast(data, standardiseFcn, plottingFcn) {
    var standardisedData = standardiseFcn(data)
    var processedData = addInsideHumidity(standardisedData)

    var traces = createTraces(processedData)
    plottingFcn(traces)
}


function saturatePressure(temp) {
    var pressure = 6.122 * Math.exp(17.62 * temp / (243.12 + temp))
    return pressure
}

function getInsideHumidity(outside_temp, outside_humidity) {
    var indoorTemperature = parseFloat(document.getElementById("indoorTempInput").value);

    return (
        (indoorTemperature + 273)
        * outside_humidity
        * saturatePressure(outside_temp)
        / ((outside_temp + 273) * saturatePressure(indoorTemperature))
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
        legend: {
            x: 0
        }
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

function submitPostcode(plottingFcn = adjustPlot) {
    var postCode = forecastParams.postCode
    getForecast(postCode, plottingFcn)
}


function defaultSetup() {
    var postCode = findGetParameter('postcode')
    if (postCode != null) {
        postCode = formatPostcode(postCode)
        document.getElementById("postcodeInput").value = postCode
    }
    submitPostcode(createPlot)
}


function handleForm(event) {
    event.preventDefault(); // prevents submit button refreshing page
    // forecastParams.validateForm();
    submitPostcode();
}


// setup params as singleton
let forecastParams = new ForecastParams();
forecastParams.updateFromURL()
forecastParams.setForm()

// setup form callbacks
var form = document.getElementById("postCodeForm");
form.addEventListener('submit', handleForm);
form.addEventListener('input', function () {
    forecastParams.validateForm()
});



const plotDiv = 'plotDiv'
const plotTitle = ''
var plotData = []
submitPostcode(createPlot)