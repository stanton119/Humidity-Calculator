# Humidity forecast webpage


*   Operation
    *   client side HTTP request
    *   BBC weather presents in local clock time
    *   Need function to return BBC results into generic format of:
    *   date(clock time) | outside humidity | outside temp
*   interface
    *   search box for location
    *   plot for humidity over time
    *   default plot location used to show case results
*   tools
    *   Inside docker, install node, npm
        *   All server side, no need if just one library
    *   vue/react based?
    *   http requests library - fetch/angular
    *   plotting library
        *   d3, chartjs, plotly
        *   npm install plotly.js-dist
    *   npm for library management
*   data structure
    *   dict of dict?
    *   json structure
    *   List of dict
    *   [
			{ x: new Date(2017,6,24), y: 31 },
			{ x: new Date(2017,6,25), y: 31 },
			{ x: new Date(2017,6,26), y: 29 },
			{ x: new Date(2017,6,27), y: 29 },
			{ x: new Date(2017,6,28), y: 31 },
			{ x: new Date(2017,6,29), y: 30 },
			{ x: new Date(2017,6,30), y: 29 }
		]
    *   plotly:
        *   x: [1, 23, 4]
        *   y: [1, 23, 4]
*   code structure
    *   weather data request
    *   standardisation step
    *   function to add on inside humiditiy
    *   function to plot
    *   On location change
        *   Callback - run everything else
    *   On page load
        *   Callback - run everything with defualt lcoation
