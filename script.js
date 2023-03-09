function print(x) {
    return console.log(x)
}

function cumsum(values) {
    if (values.length > 0) {
        return values.reduce(
            (accumulator, currentValue) => accumulator + currentValue)
    } else {
        return 0
    }
}

function sortByDateAscending(a, b) {
    return a.date - b.date;
}

function formatDateLongToShort(date) {
    return d3.timeFormat("%Y-%m-%d")(date)
}

function today() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;

    return today
}

function random_rgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + r().toFixed(1) + ')';
}



// ----------------------------------------------------------------------------------------------//
// --------------------------------- Global variables -------------------------------------------//
// ----------------------------------------------------------------------------------------------//


selectedYearMAIN = "2020"
selectedCountryMAIN = "Czechia"
selectedDatasetMAIN = "dataCases2020"
selectedDateMAIN = new Date("2020-01-01")
selectedCategoryMAIN = null;
selectedRestrictionMAIN = null;
showTravelPossibitilites = false;

var colorBrewer = {"red": "#d7191c", "blue": "#2c7bb6", "gray": "#f7f7f7", "darkblue": "#313695"}


// ----------------------------------------------------------------------------------------------//
// --------------------------------------- Data -------------------------------------------------//
// ----------------------------------------------------------------------------------------------//


d3.queue()
    .defer(d3.csv, "./data/response_graphs_data_2021-06-09.csv")
    .defer(d3.csv, "./data/cases2020.csv")
    .defer(d3.csv, "./data/cases2021.csv")
    .defer(d3.csv, "./data/population.csv")
    .defer(d3.csv, "./data/mobilityDataEurope.csv")
    .defer(d3.csv, "./data/tourism_possibility.csv")
    .defer(d3.json, "./data/countries_coordinates.json")

    .await(function (error, dataResponse, dataCases2020, dataCases2021, dataPopulation, dataMobility, dataTourism, dataGeoLocations) {
        if (error) {
            print('Oh dear, something went wrong with loading the data file ' + error);
        } else {

            /* EXTERNAL */
            addTitlesForIcons();
            var countryCodeNamesMapping = getCountryCodeNamesMapping();
            var restrictionNamesMapping = getRestrictionNamesMapping();
            var countryFlags = getCountryFlags();


            // ------------------- Data transformation ---------------------//            

            function transform_data(d) {
                return {
                    date: d3.timeParse("%d/%m/%Y")(d.dateRep),
                    year: d.dateRep.slice(-4),
                    value: d.cases,
                    country: d.countriesAndTerritories,
                    continent: d.continentExp
                }
            }


            for (i in dataCases2020) {
                try {
                    dataCases2020[i] = transform_data(dataCases2020[i])
                } catch (error) {
                    //print('whops, this one record one didnt work => ' +  dataCases2020[i])
                }
            }

            for (i in dataCases2021) {
                try {
                    dataCases2021[i] = transform_data(dataCases2021[i])
                } catch (error) {
                    //print('whops, this one record one didnt work => ' +  dataCases2020[i])
                }
            }


            function transform_population_data(d) {
                return {
                    country: d["Country_new"],
                    population: d["Population (2020)"]
                }
            }


            for (i in dataPopulation) {
                try {
                    dataPopulation[i] = transform_population_data(dataPopulation[i])
                } catch (error) {
                    print('whops, this one record (population data) one didnt work => ' + dataPopulation[i])
                }
            }


            // Filter out non-european countries
            dataCases2020 = dataCases2020.filter(item => item.continent == "Europe")
            dataCases2021 = dataCases2021.filter(item => item.continent == "Europe")

            // Flatten the population data array to dictionary
            var dataPopulationFlat = {};
            for (var i = 0; i < dataPopulation.length; i++) {
                let key = dataPopulation[i]["country"],
                    value = dataPopulation[i]["population"]

                dataPopulationFlat[key] = value;
            }


            // ----------------------------------------------------------------------------------------------//
            // --------------------------------------- Brick chart ------------------------------------------//
            // ----------------------------------------------------------------------------------------------//


            // ------------------- Months mapping and drawing ---------------------//

            var months = { "2020-1": 0, "2020-2": 0, "2020-3": 0, "2020-4": 0, "2020-5": 0, "2020-6": 0, "2020-7": 0, "2020-8": 0, "2020-9": 0, "2020-10": 0, "2020-11": 0, "2020-12": 0, "2021-1": 0, "2021-2": 0, "2021-3": 0, "2021-4": 0, "2021-5": 0, "2021-6": 0, "2021-7": 0, "2021-8": 0, "2021-9": 0, "2021-10": 0, "2021-11": 0, "2021-12": 0 }


            monthsNum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            d3.selectAll(".boxes").selectAll(".firstRow")
                .data(monthsNum)
                .enter()
                .append("div")
                .attr("class", "restrictionNum")
                .attr("id", function (d) { return "monthNum-" + +d; })
                .style("background-color", "rgb(245, 255display: inline-block;, 255)")
                .style("border", "0.01em solid rgba(83, 83, 83, .05)")

                .text("*")


            monthsChar = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            d3.selectAll(".labels").selectAll(".secondRow")
                .data(monthsChar)
                .enter()
                .append("div")
                .attr("class", "monthsTitles")
                .text(item => item)

            years = ["2020", "2021"]
            d3.select(".input-year")
                .selectAll('myOptions')
                .data(years)
                .enter()
                .append('option')
                .text(function (d) { return d; }) // text showed in the menu
                .attr("value", function (d) { return d; })


            // ------------------- Intercation Buttons ---------------------//

            function colorBricks() {
                const monthsReady = JSON.parse(JSON.stringify(months));
                var items = dataResponse.filter(item => item.country == selectedCountryMAIN)

                // Get counts of restrictions in months
                aggregated = items.reduce(
                    (res, { dateStart }) => {
                        const year = new Date(dateStart).getFullYear()
                        const month = new Date(dateStart).getMonth() + 1

                        res[`${year}-${month}`] = (res[`${year}-${+month}`] || 0) + 1
                        return res
                    }, {}
                )

                // Push aggregated values to the empty months list
                for (i = 0; i < d3.keys(aggregated).length; i++) {
                    key = d3.keys(aggregated)[i]
                    monthsReady[key] = aggregated[key]
                }

                // Remove records with not selected years
                for (var key in monthsReady) {
                    if (key.includes(selectedYearMAIN, 0)) {
                        //isokayy
                    } else {
                        delete monthsReady[key];
                    }
                }

                // Filling block with color
                var palette = d3.scaleLinear()
                    .domain([0, 25
                        //d3.min(d3.values(monthsReady)),
                        //d3.max(d3.values(monthsReady))
                    ])
                    .range(["white", colorBrewer.darkblue])//"blue"])

                d3.selectAll(".restrictionNum")
                    .text(function (d) { return d3.values(monthsReady)[d - 1] })
                    .style("background-color", function (d) {
                        return palette(d3.values(monthsReady)[d - 1])
                    })
                    // If tile too dark, make text white
                    .style("color", function(d){
                        if(d3.values(monthsReady)[d - 1] >= 20){
                            return "white"
                        } else {
                            return "black"
                        }
                    })

            }



            // ----------------------------------------------------------------------------------------------//
            // --------------------------------------- Slider  ----------------------------------------------//
            // ----------------------------------------------------------------------------------------------//


            var formatDateIntoYear = d3.timeFormat("%Y");
            var formatDate = d3.timeFormat("%d %b %Y");
            var parseDate = d3.timeParse("%m/%d/%y");

            var startDate = new Date("2020-01-01"),
                endDate = new Date("2020-12-31");

            var margin3 = { top: 0, right: 50, bottom: 0, left: 50 },
                width3 = 800 - margin3.left - margin3.right,
                height3 = 100 - margin3.top - margin3.bottom;

            var svgSlider = d3.select(".slider")
                .append("svg")
                .attr("class", "slider-container")
                .attr("width", 50 + width3 + margin3.left + margin3.right)
                .attr("height", height3)
                .attr("viewBox", "0 0 790 100")

            var x = d3.scaleTime()
                .domain([
                    new Date(selectedYearMAIN + "-01-01"),
                    new Date(selectedYearMAIN + "-12-31")
                ])
                .range([0, width3])
                .clamp(true);



            var slider = svgSlider.append("g")
                .attr("class", "slider")
                .attr("transform", "translate(" + margin3.left + "," + height3 / 2 + ")");


            slider.append("line")
                .attr("class", "track")
                .attr("x1", x.range()[0])
                .attr("x2", x.range()[1])
                .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "track-inset")
                .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "track-overlay")
                .call(d3.drag()
                    .on("start.interrupt", function () { slider.interrupt(); })
                    .on("start drag", function () {
                        selectedDateMAIN = x.invert(d3.event.x)
                        updateIndicatorLine(selectedDateMAIN)
                        updateHandlePosition(selectedDateMAIN)
                        colourCountries(selectedDateMAIN)
                        updateAllCharts()
                    }))

            slider.insert("g", ".track-overlay")
                .attr("class", "ticks")
                .attr("transform", "translate(0," + 18 + ")")
                .selectAll("text")
                // Ticks for slider
                .data(x.ticks(12))
                .enter()
                .append("text")
                .attr("x", x)
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .text(function (d) { return d3.timeFormat("%b")(d) })

            var handle = slider.insert("circle", ".track-overlay")
                .attr("class", "handle")
                .attr("r", 9);

            var label = slider.append("text")
                .attr("class", "label")
                .attr("text-anchor", "middle")
                .text(formatDate(startDate))
                .attr("transform", "translate(0," + (-25) + ")")


            // ----------------------------------------------------------------------------------------------//
            // --------------------------------------- Line chart -------------------------------------------//
            // ----------------------------------------------------------------------------------------------//


            function updateMAINParameters(year) {
                selectedDatasetMAIN = "dataCases" + year
            }

            function updateIndicatorLine(date) {
                d3.select("#indicatorLine").remove()
                var indicatorLine = d3.select("#lineChart")
                    .append("line")
                    .attr("id", "indicatorLine")
                    .attr("x1", xLineChart(date))
                    .attr("y1", y(1800))
                    .attr("x2", xLineChart(date))
                    .attr("y2", heightLineChart)
                    .attr("transform", "translate(110, 50) ")

                    .style("stroke-width", 1.5)
                    .style("stroke", colorBrewer.blue)//"blue")
                    .style("fill", "none");
            }

            function updateHandlePosition(sliderDate) {
                handle.attr("cx", x(sliderDate));
                label
                    .attr("x", x(sliderDate))
                    .text(formatDate(sliderDate));
            }


            var marginLineChart = { top: 50, right: 80, bottom: 100, left: 110 }
            var widthLineChart = 900 - marginLineChart.left - marginLineChart.right
            var heightLineChart = 600 - marginLineChart.top - marginLineChart.bottom


            var svg = d3.select(".lineChart")
                .append("svg")
                .attr("id", "lineChart")
                .attr("width", widthLineChart + marginLineChart.left + marginLineChart.right)
                .attr("height", heightLineChart + marginLineChart.top + marginLineChart.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + marginLineChart.left + "," + marginLineChart.top + ")");



            // ------------------- cation Buttons ---------------------//

            function updateAllCharts() {
                let currentDate = String(d3.timeFormat("%d-%m-%Y")(selectedDateMAIN)) // => 2020-08-05
                let changedDate = currentDate.replace(currentDate.slice(-4), selectedYearMAIN) // => 2021-08-05
                selectedDateMAIN = d3.timeParse("%d-%m-%Y")(changedDate)


                // Domain of line chart axis
                xLineChart.domain([new Date(selectedYearMAIN + "-01-01"),
                new Date(selectedYearMAIN + "-12-30")])


                // Domain of slider
                x.domain([new Date(selectedYearMAIN + "-01-01"),
                new Date(selectedYearMAIN + "-12-30")])

                // Date of slider
                label.text(d3.timeFormat("%d %b %Y")(selectedDateMAIN))


                // Update cahrts
                updateLineChart(selectedCountryMAIN, selectedYearMAIN)
                updateScatter(selectedDateMAIN, selectedCountryMAIN)
                drawRestrictionLines(selectedRestrictionMAIN)
                drawRestrictionRange(selectedRestrictionMAIN)
                colorBricks()
                colourIcons(selectedDateMAIN)
            }


            d3.selectAll(".input-country,.input-year").on("change", function () {
                //selectedCountryMAIN = d3.select(".input-country").property("value")
                selectedYearMAIN = d3.select(".input-year").property("value")
                selectedDatasetMAIN = "dataCases" + selectedYearMAIN

                updateAllCharts()
                // Fix: date data span (if unupdated, stays the color)
                colourCountries(selectedDateMAIN);

            })


            // ------------------- Draw line chart ---------------------//    

            var selectedYear = d3.select(".input-year").property("value")
            var allGroup = d3.map(eval(selectedDatasetMAIN), function (d) { return (d.country) }).keys()



            var myColor = d3.scaleOrdinal()
                .domain(allGroup)
                .range(d3.schemeSet2);


            var xLineChart = d3.scaleTime()
                //.domain(d3.extent(eval(selectedDatasetMAIN), function (k) { return k.date }))
                .domain([
                    new Date(selectedYearMAIN + "-01-01"),
                    new Date(selectedYearMAIN + "-12-30")
                ])
                .range([0, widthLineChart]);


            svg.append("g")
                .attr("transform", "translate(0," + heightLineChart + ")")
                .call(d3.axisBottom(xLineChart));

            // Axis X name
            svg.append("text")
                .attr("text-anchor", "end")
                .attr("x", widthLineChart)
                .attr("y", heightLineChart + marginLineChart.top - 10)
                .text("Time");

            // Add Y axis
            var y = d3.scaleLinear()
                .domain([0, 2000])
                .range([heightLineChart, 0]);

            svg.append("g")
                .call(d3.axisLeft(y));

            // Axis Y name
            svg.append("text")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -marginLineChart.left + 30)
                .attr("x", -marginLineChart.top + 50)
                .text("Cases per 1 million")

            /* var previousDataPoint = 0 */


            // Initialize line
            var line = svg
                .append('g')
                .append("path")
                .datum(eval(selectedDatasetMAIN).filter(item => item.country == "Czechia" && item.year == selectedYear))
                .style("stroke", "gray")
                .style("stroke-width", 1)
                .style("fill", "none")
                .style("opacity", 0)

            // Initialize circles
            svg.selectAll("myCircles")
                .data(eval(selectedDatasetMAIN).filter(
                    item => item.country == selectedCountryMAIN && item.year == selectedYearMAIN))
                .enter()
                    .append("circle")
                    .attr("class", "cases-circle")
                    .attr("fill", colorBrewer.darkblue)//"blue")
                    .attr("stroke", "none")
                   /*  .attr("cx", function (d) { return xLineChart(d.date) })
                    .attr("cy", function (d) {
                        return y(+d.value / dataPopulationFlat[selectedCountryMAIN] * 1000000)
                    }) */
                    .attr("cx", (d) => Math.random() * (widthLineChart - 1) + 1)
                    .attr("cy", (d) => Math.random() * (heightLineChart - 1) + 1)
                    .attr("r", 2)
                    .style("opacity", 0)

            
            var firstToggleLineChart = true


            function updateLineChart(selectedCountry, selectedYear) {

                selectedDatasetMAIN = "dataCases" + selectedYear

                var dataFilter = eval(selectedDatasetMAIN).filter(
                    item => item.country == selectedCountry && item.year == selectedYear)

                // Removing the first high point
                dataFilter = dataFilter.slice(0, dataFilter.length - 1)

                // Update line
                line
                    .datum(dataFilter)
                    .transition()
                    .duration(500)
                    .style("stroke", "gray")
                    .style("stroke-width", 0.5)
                    .attr("d", d3.line()
                        .x(function (d) { return xLineChart(d.date) })
                        .y(function (d) {
                            return y(+d.value / dataPopulationFlat[selectedCountry] * 1000000)
                        })
                    )
                    .style("opacity", 100)

                // Update circles
                svg.selectAll("circle")
                    .data(dataFilter)
                    .transition()
                    .duration(800)
                    .attr("cx", function (d) { return xLineChart(d.date) })
                    .attr("cy", function (d) {
                        return y(+d.value / dataPopulationFlat[selectedCountry] * 1000000)
                    })
                    .delay(function (d) {
                        time = dataFilter.indexOf(d, 0)
                        return 2 * time
                    })
                    .style("opacity", 100)

                // Update circles
                svg.selectAll("circle")
                    .data(dataFilter)
                    .exit()
                    .transition()
                    .duration(200)
                    .style("opacity", 0)


            }






            // ----------------------------------------------------------------------------------------------//
            // -------------------------------------- Scatter plot ------------------------------------------//
            // <----------------------------------------------------------------------------------------------//


            var draw_scatter_plot = function () {

                var svg = d3.select('.scatterPlot')
                    .append('svg')
                    .attr("viewBox", "0 0 900 900")


                var numRows = 10
                var numCols = 10

                var y = d3.scaleBand()
                    .range([0, 800])
                    .domain(d3.range(10));

                var x = d3.scaleBand()
                    .range([0, 800])
                    .domain(d3.range(10));

                var data = d3.range(numCols * numRows);

                var container = svg.append("g")
                    .attr("transform", "translate(60,60)")


                container.selectAll("circle")
                    .data(data)
                    .enter()
                    .append("path")
                    .attr("class", "percentPoint")
                    .attr("id", function (d) { return +d + 1; })
                    .attr("transform", function (d) {
                        return ("translate(" + x(d % numCols) + "," + y(Math.floor(d / numCols)) + ")")
                    })
                    // Person icon 👤
                    .attr('d', "M46 26c0 6.1-3.4 11.5-7 14.8V44c0 2 1 5.1 11 7a15.5 15.5 0 0 1 12 11H2a13.4 13.4 0 0 1 11-11c10-1.8 12-5 12-7v-3.2c-3.6-3.3-7-8.6-7-14.8v-9.6C18 6 25.4 2 32 2s14 4 14 14.4z")
                    .attr('stroke', "#202020")
                    .attr('stroke-miterlimit', '10')
                    .attr('stroke-width', '1')
                    .attr('fill', 'white')

                container
                    .append("text")
                    .attr("id", "percentSickNumber")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("fill", "gray")
                    .attr("transform", "translate(600, -20)")
                    .text((d) => "Population sick: 0%")


            }
            draw_scatter_plot();


            function updateScatter(sliderDate, country) {
                let filteredData = eval(selectedDatasetMAIN).filter(item =>
                    item.country == country && item.date <= new Date(sliderDate))

                let arrayOfCases = filteredData.map(d => parseInt(d.value))
                let cumulativeCases = cumsum(arrayOfCases)
                let population = dataPopulationFlat[country]
                let cases = cumulativeCases
                let percentSick = (cases / population) / 0.01


                d3.select("#percentSickNumber")
                    .text("Population sick: " + percentSick.toFixed(2) + "%")
                    .attr("fill", "gray")

                // Draw dots based on number of percent
                let percentSickWhole = Math.floor(percentSick)
                let percentSickFraction = percentSick - percentSickWhole

                d3.selectAll(".percentPoint")
                    .style("fill", function (d) {
                        return this.id <= percentSickWhole ? /* "blue" */ colorBrewer.darkblue : "white"
                    })

                d3.selectAll(".percentPoint")
                    .style("fill", function (d) {
                        return this.id == percentSickWhole + 1 ? /* "blue" */ colorBrewer.darkblue : 0
                    })

                    .style("fill-opacity", function (d) {
                        return this.id == percentSickWhole + 1 ? percentSickFraction : ""
                    })
                    .style("stroke", "black")
                    .style("stroke-opacity", "100%")



                // Hightlight boxes
                let highlightedMonthNumber = ("x" + d3.timeFormat("%m")(sliderDate))
                    .replace("x0", "")
                    .replace("x", "")


                let monthNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
                let notSelectedMonths = monthNumbers.filter(item => item !== highlightedMonthNumber)

                d3.selectAll("#monthNum-" + highlightedMonthNumber)
                    .style("box-shadow", "rgba(0, 0, 0, 0.45) 0px 0px 10px")

                for (var index in notSelectedMonths) {
                    d3.select("#monthNum-" + notSelectedMonths[index])
                        .style("box-shadow", "none")
                }
            }









            // -----------------------------------------------------------------------------------------------//
            // ------------------------------------- Restrictions --------------------------------------------//
            // -----------------------------------------------------------------------------------------------//


            // ------------------- Restrictions groups ---------------------//  

            for (i = 0; i < dataResponse.length; i++) {
                var restrictionName = String(dataResponse[i].Response_measure)

                if (restrictionName.includes("Stay")) {
                    dataResponse[i].mainCategory = "Stay Restriction"
                } else if (restrictionName.includes("Clos")) {
                    dataResponse[i].mainCategory = "Close Restriction"
                } else if (restrictionName.includes("Mask")) {
                    dataResponse[i].mainCategory = "Mask Restriction"
                } else if (restrictionName.includes("Indoor")) {
                    dataResponse[i].mainCategory = "Indoor Restriction"
                } else if (restrictionName.includes("Outdoor")) {
                    dataResponse[i].mainCategory = "Outdoor Restriction"
                } else if (restrictionName.includes("Workplace")) {
                    dataResponse[i].mainCategory = "Workplace Restriction"
                } else if (restrictionName.includes("Transport")) {
                    dataResponse[i].mainCategory = "Transport Restriction"
                } else if (restrictionName.includes("Mass")) {
                    dataResponse[i].mainCategory = "Mass Restriction"
                } else if (restrictionName.includes("Hotel")) {
                    dataResponse[i].mainCategory = "Hotel Restriction"
                } else if (restrictionName.includes("Gym")) {
                    dataResponse[i].mainCategory = "Gym Restriction"
                } else if (restrictionName.includes("Worship")) {
                    dataResponse[i].mainCategory = "Places of Worship Restriction"
                } else if (restrictionName.includes("Entertainment")) {
                    dataResponse[i].mainCategory = "Entertainment Restriction"
                } else if (restrictionName.includes("RestaurantsCafes")) {
                    dataResponse[i].mainCategory = "Restaurants and Cafés Restriction"
                } else if (restrictionName.includes("Private")) {
                    dataResponse[i].mainCategory = "Private gatherings Restriction"
                } else {
                    dataResponse[i].mainCategory = "Other Restriction"
                }
            }


            // ------------------- Data structure ---------------------//  

            function tranformResponseData(d) {
                return {
                    dateStart: d3.timeParse("%Y-%m-%d")(d.date_start),
                    dateEnd: d3.timeParse("%Y-%m-%d")(d.date_end),
                    year: String(d.date_start).slice(0, 4),
                    measure: d.Response_measure,
                    country: d.Country,
                    mainCategory: d.mainCategory
                }
            }


            for (index in dataResponse) {
                try {
                    dataResponse[index] = tranformResponseData(dataResponse[index])
                } catch (error) {
                    print('whops, this one record one didnt work => ' + dataResponse[index])
                }
            }


            // ------------------- List of (sub)restrictions ---------------------// 

            var restrictionIcons = {
                "Stay Restriction": "🏡",
                "Close Restriction": "⛔️",
                "Mask Restriction": "😷",
                "Indoor Restriction": "🏢",
                "Outdoor Restriction": "🎢",
                "Workplace Restriction": "👩‍💼",
                "Transport Restriction": "🚎",
                "Mass Restriction": "👯‍♀️",
                "Hotel Restriction": "🏨",
                "Gym Restriction": "🏋️",
                "Places of Worship Restriction": "🙏",
                "Entertainment Restriction": "🍿",
                "Restaurants and Cafés Restriction": "🍽",
                "Private gatherings Restriction": "🤫",
                "Other Restriction": "🚧"

            }

            // Show main categories
            var mainCategoryList = d3.map(dataResponse, function (d) { return d.mainCategory }).keys()
            var restricionMeasuresList = d3.map(dataResponse, function (d) { return d.measure }).keys()

            for (index in mainCategoryList) {
                d3.select(".restrictionCategoriesList")
                    .append("div")
                    .attr("class", "restrictionCategory")
                    .attr("id", mainCategoryList[index].replaceAll(" ", "-"))
                    .text(function () {
                        let icon = restrictionIcons[mainCategoryList[index]]
                        let text = icon + " " + String(mainCategoryList[index])

                        return text
                    })

            }


            // Show subcategories on click
            d3.selectAll(".restrictionCategory").on("click", function () {

                d3.selectAll(".restrictionMeasure").remove()
                d3.selectAll("#restrictionLine").remove()
                d3.selectAll('#dataPointText').remove()

                d3.selectAll(".restrictionRange").remove()

                selectedCategoryMAIN = (this.id).replaceAll(" ", "-")

                let restrictionList = dataResponse.filter(item =>
                    item.mainCategory.replaceAll(" ", "-") == selectedCategoryMAIN)

                restrictionList = d3.map(restrictionList, function (d) { return d.measure }).keys()


                for (index in restrictionList) {
                    d3.select(".restrictionMeasuresList")
                        .append("div")
                        .attr("class", "restrictionMeasure")
                        .attr("id", restrictionList[index])
                        .text(restrictionNamesMapping[restrictionList[index]])


                }

                darkenUnactiveRestrictionMeasures()


            })


            function drawRestrictionLines(selectedRestriction) {

                selectedRestrictionMAIN = selectedRestriction

                // Remove previous elements and color to default
                d3.selectAll("#restrictionLine").remove()
                d3.selectAll('#dataPointText').remove()


                let filteredDataResponse = dataResponse.filter(item =>
                    item.mainCategory.replaceAll(" ", "-") == selectedCategoryMAIN
                    && item.measure == selectedRestrictionMAIN
                    && item.country == selectedCountryMAIN
                    && item.year == selectedYearMAIN)


                let lengthOfLine = 525


                for (index in filteredDataResponse) {
                    let dateStart = filteredDataResponse[index].dateStart
                    let dateEnd = filteredDataResponse[index].dateEnd


                    // Draw line start
                    d3.select("#lineChart")
                        .append("line")
                        .attr("transform", "translate(110, 10) ")
                        .attr("id", "restrictionLine")
                        .attr("x1", xLineChart(dateStart))
                        .attr("y1", 50)
                        .attr("x2", xLineChart(dateStart))
                        .attr("y2", lengthOfLine)
                        .style("stroke-width", "1")
                        .style("opacity", 0.5)
                        .style("stroke", "gray")
                        .style("fill", "none")

                    // Draw line end
                    d3.select("#lineChart")
                        .append("line")
                        .attr("transform", "translate(110, 10) ")
                        .attr("id", "restrictionLine")
                        .attr("x1", xLineChart(dateEnd))
                        .attr("y1", 50)
                        .attr("x2", xLineChart(dateEnd))
                        .attr("y2", lengthOfLine)
                        .style("stroke-width", "1")
                        .style("opacity", 0.5)
                        .style("stroke", "gray")
                        .style("fill", "none")
                }

                // Date start title below
                svg.selectAll("#dataPointTexts")
                    .data(filteredDataResponse)
                    .enter()
                    .append("text")
                    .attr("id", "dataPointText")
                    .attr("x", function (d) { return xLineChart(d.dateStart) })
                    .attr("y", 500)
                    .style("fill", "gray")
                    .attr("transform", "translate(-40, 10)")
                    .text(function (d) {
                        return d3.timeFormat("%d.%m.%y")(d.dateStart)
                    })

                // Date start title below
                svg.selectAll("#dataPointTexts")
                    .data(filteredDataResponse)
                    .enter()
                    .append("text")
                    .attr("id", "dataPointText")
                    .attr("x", function (d) { return xLineChart(d.dateEnd) })
                    .attr("y", 500)
                    .style("fill", "gray")
                    .attr("transform", function (d) {
                        // If too close, move down
                        if (xLineChart(d.dateEnd) - xLineChart(d.dateStart) < 70) {
                            return "translate(-40, 30)"
                        } else {
                            return "translate(-40, 10)"
                        }

                    })
                    .text(function (d) {
                        return d3.timeFormat("%d.%m.%y")(d.dateEnd)
                    })


                // Icon under
                svg.selectAll("#dataPointTexts")
                    .data(filteredDataResponse)
                    .enter()
                    .append("text")
                    .attr("id", "dataPointText")
                    /* .attr("x", function (d) {
                        let beginDate = xLineChart(d.dateStart)
                        let offset = xLineChart(d.dateEnd) - xLineChart(d.dateStart)
                        return beginDate + offset / 2
                    }) */
                    .attr("x", (d) => xLineChart(d.dateStart))
                    .attr("y", 0)

                    .attr("transform", "translate(-40, 0)")
                    .text((d) => restrictionIcons[String(d.mainCategory)] + " " + restrictionNamesMapping[selectedRestrictionMAIN]
                    )
                    .style("font-size", "13px")
                    .style("fill", "gray")

            }



            function drawRestrictionRange(selectedRestriction) {
                d3.selectAll(".restrictionRange").remove()
                selectedRestrictionMAIN = selectedRestriction

                let filteredDataResponse = dataResponse.filter(item =>
                    item.mainCategory.replaceAll(" ", "-") == selectedCategoryMAIN
                    && item.measure == selectedRestrictionMAIN
                    && item.country == selectedCountryMAIN)


                for (index in filteredDataResponse) {


                    // Resetting var for overlapping year (if set to 'true' will set x to 0)
                    xZeroTrigger = false


                    restrictionInterval = d3.select("#lineChart")
                        .append("rect")
                        .attr("class", "restrictionRange")
                        .attr("id", String(parseInt(index) + 1))
                        .attr("transform", "translate(110, 60) ")
                        .attr("height", heightLineChart - 10)
                        .style("fill", "lightgray")
                        .style("opacity", 0.4)
                        .attr("width", function () {

                            let width = null
                            let curretYear = today().slice(0, 4)
                            let selectedYear = selectedYearMAIN
                            let dateStart = filteredDataResponse[index].dateStart
                            let dateEnd = filteredDataResponse[index].dateEnd
                            let yearStart = formatDateLongToShort(filteredDataResponse[index].dateStart).slice(0, 4)
                            let yearEnd = filteredDataResponse[index].dateEnd != null ? formatDateLongToShort(filteredDataResponse[index].dateEnd).slice(0, 4) : null

                            // print("start - " + dateStart)
                            // print("end - " + dateEnd) 

                            // Only relevant records to selected year
                            if (yearStart == selectedYear || yearEnd == selectedYear || yearEnd == null) {

                                // In this year
                                if (yearStart == yearEnd) {
                                    //print("=> In this year")
                                    width = xLineChart(dateEnd) - xLineChart(dateStart)
                                }

                                // Overlap from to next year
                                if (yearStart == selectedYear && yearEnd > selectedYear) {
                                    //print("=> Overlap from to next year")
                                    width = (widthLineChart /* - 20 */) - xLineChart(dateStart)

                                }

                                // Overlap from last year
                                if (yearStart < selectedYear && yearEnd == selectedYear) {
                                    //print("=> Overlap from last year")
                                    width = xLineChart(dateEnd)
                                    xZeroTrigger = true
                                }

                                // Overlap from last year, no ending date
                                if (yearStart < selectedYear && yearEnd == null) {
                                    //print("=> Overlap from last year, no ending date")
                                    width = xLineChart(new Date(today()))
                                    xZeroTrigger = true
                                }

                                // This year, no ending date, is this year
                                if (yearStart == selectedYear && yearEnd == null && yearStart == curretYear) {
                                    //print("=> This year, no ending date, is this year")
                                    width = xLineChart(new Date(today())) - xLineChart(dateStart)
                                }

                                // This year, no ending date, is not this year
                                if (yearStart == selectedYear && yearEnd == null && yearStart != curretYear) {
                                    //print("=> This year, no ending date, is not this year")
                                    width = (widthLineChart /* - 20 */) - xLineChart(dateStart)
                                }


                            } else { print("=> not in this year") }

                            return width


                        })
                        .attr("x", function () {
                            if (xZeroTrigger == false) { return xLineChart(filteredDataResponse[index].dateStart) }
                            else { return 0 }
                        })




                    //xLineChart(filteredDataResponse[index].dateStart))



                }
            }



            function darkenUnactiveRestrictionCategories() {
                let availableMainCategories = null;

                let filteredDataResponse = dataResponse.filter(item =>
                    item.country == selectedCountryMAIN
                    && item.year == selectedYearMAIN
                )

                availableMainCategories = d3.map(filteredDataResponse, (item) =>
                    (item.mainCategory)).keys()


                // Color the available restrictions
                for (_ in mainCategoryList) {

                    if (availableMainCategories.includes(mainCategoryList[_])) {
                        d3.select("#" + mainCategoryList[_].replaceAll(" ", "-"))
                            .transition()
                            .duration(350)
                            .style("color", "black")
                    }
                    else {
                        d3.select("#" + mainCategoryList[_].replaceAll(" ", "-"))
                            .transition()
                            .duration(350)
                            .style("color", "lightgray")
                    }
                }
            }




            function darkenUnactiveRestrictionMeasures() {
                let availableMeasures = null;

                let filteredDataResponse = dataResponse.filter(item =>
                    item.country == selectedCountryMAIN
                    && item.year == selectedYearMAIN
                    && item.mainCategory.replaceAll(" ", "-") == selectedCategoryMAIN
                )

                availableMeasures = d3.map(filteredDataResponse, (item) =>
                    (item.measure)).keys()

                // Color the available restrictions measures
                for (_ in restricionMeasuresList) {

                    if (availableMeasures.includes(restricionMeasuresList[_])) {
                        d3.select("#" + restricionMeasuresList[_].replaceAll(" ", "-"))
                            .transition()
                            .duration(350)
                            .style("color", "black")
                    }
                    else {
                        d3.select("#" + restricionMeasuresList[_].replaceAll(" ", "-"))
                            .transition()
                            .duration(350)
                            .style("color", "lightgray")
                    }
                }

            }













            var previousClickedRestriction = null;

            // On restriction click, plot lines
            d3.selectAll(".restrictionMeasuresList").on("click", function () {
                let clickedRestriciton = d3.event.target.id

                // If clicked on same restriction, remove
                if (previousClickedRestriction == clickedRestriciton) {
                    d3.selectAll(".restrictionRange").remove()
                    d3.selectAll("#restrictionLine").remove()
                    d3.selectAll('#dataPointText').remove()

                    d3.select("#" + clickedRestriciton).style("background-color", "white")


                    previousClickedRestriction = null;
                    selectedRestrictionMAIN = null;

                }
                else {
                    d3.select("#" + previousClickedRestriction).style("background-color", "white")
                    d3.select("#" + clickedRestriciton).style("background-color", "lightgray")

                    previousClickedRestriction = clickedRestriciton
                    drawRestrictionLines(d3.event.target.id)
                    drawRestrictionRange(d3.event.target.id)
                }

                darkenUnactiveRestrictionMeasures()

            })




            // -----------------------------------------------------------------------------------------------//
            // ---------------------------------------- Icons ------------------------------------------------//
            // -----------------------------------------------------------------------------------------------//

            //---------------------- Drawing city map ----------------------//
            var svgImage = getSvgImageCode()

            d3.select(".iconChart")
                .append("div")
                .attr("class", "svg-container")
                .html(svgImage)

            d3.select(".svg-container")
                .style("transform", "translate(0%,-20%)")

            d3.selectAll(".icons")
                .attr("height", 480)
                .attr("width", 780)
                .attr("viewBox", "-400 0 4600 2200")
            
            d3.select(".icons").selectAll("g").selectAll("g").selectAll("g").selectAll("g").selectAll("path")
                .attr("fill", "lightgray")

            var imageMapping = {
                "groceryAndPharmacy": "#url\\(-clip12\\), #url\\(-clip3\\), #url\\(-clip30\\)",
                "retailAndRecreation": "#url\\(-clip24\\), #url\\(-clip27\\)",
                "workplace": "#url\\(-clip9\\), #url\\(-clip21\\)",
                "park": "#url\\(-clip6\\), #url\\(-clip18\\)",
                "residential": "#url\\(-clip15\\)",
                "transitStations":
                    "#url\\(-clip33\\), #url\\(-clip36\\), #url\\(-clip48\\), #url\\(-clip57\\), #url\\(-clip45\\), #url\\(-clip54\\), #url\\(-clip39\\), #url\\(-clip66\\), #url\\(-clip51\\), #url\\(-clip60\\), #url\\(-clip42\\), #url\\(-clip63\\)"
            }


            //--------------- Data filtering and selection ------------------//
            var locations = d3.keys(dataMobility[0]).slice(-6)

            // TODO: shades
            var colorSequenceNegative = d3.scaleSequential() // blue
                .domain([0, -5])
                .interpolator(d3.interpolateRgb(colorBrewer.gray, colorBrewer.darkblue))

            var colorSequencePositive = d3.scaleSequential() // red
                .domain([5, 0])
                .interpolator(d3.interpolateRgb(colorBrewer.red, colorBrewer.gray)) 


            function colourScale(percentChange) {
                let chosenColor = null;
                let binnedChange = null;


                if (percentChange > 0) {
                    binnedChange = Math.ceil(percentChange / 20)
                    chosenColor = colorSequencePositive(binnedChange)
                }
                else if (percentChange < 0) {
                    binnedChange = Math.floor(percentChange / 20)
                    chosenColor = colorSequenceNegative(binnedChange)
                }
                else if (percentChange == 0) {
                    chosenColor = colorSequenceNegative(0.01)
                }

                /*  print("original => " + percentChange + " percent")
                 print("binned => " + binnedChange)
                 print("---------------") */

                return (chosenColor)
            }


            function colourIcons(sliderDate) {
                let filteredDataset = dataMobility.filter(item =>
                    item.date == formatDateLongToShort(sliderDate)
                    && item.country_region == selectedCountryMAIN)[0] //only one element


                // Display data if available
                if (typeof filteredDataset != "undefined") {
                    // Color the icons by the percent changes
                    d3.selectAll(imageMapping.transitStations)
                        .selectAll("path")
                        .attr("fill", colourScale(filteredDataset["transit_stations_percent_change_from_baseline"]))

                    d3.selectAll(imageMapping.groceryAndPharmacy)
                        .selectAll("path")
                        .attr("fill", colourScale(filteredDataset["grocery_and_pharmacy_percent_change_from_baseline"]))

                    d3.selectAll(imageMapping.retailAndRecreation)
                        .selectAll("path")
                        .attr("fill", colourScale(filteredDataset["retail_and_recreation_percent_change_from_baseline"]))


                    d3.selectAll(imageMapping.workplace)
                        .selectAll("path")
                        .attr("fill", colourScale(filteredDataset["workplaces_percent_change_from_baseline"]))

                    d3.selectAll(imageMapping.park)
                        .selectAll("path")
                        .attr("fill", colourScale(filteredDataset["parks_percent_change_from_baseline"]))

                    d3.selectAll(imageMapping.residential)
                        .selectAll("path")
                        .attr("fill", colourScale(filteredDataset["residential_percent_change_from_baseline"]))
                }

            }



            //--------------------------- Legend ----------------------------//

            var legendRangeData = d3.range(-100, 120, 20)

            var legendXScale = d3.scaleLinear()
                .domain([-100, 100])
                .range([0, 250]);

            d3.select(".legend")
                .attr("viewBox", "100 -20 100 200")

            d3.select(".legend")
                .selectAll("rect")
                .data(legendRangeData)
                .enter()
                .append("rect")
                .attr("x", (d) => Math.floor(legendXScale(d)))
                .attr("y", 0)
                .attr("height", 10)
                .attr("width", 25)
                .attr("fill", (d) => colourScale(d))

            d3.select(".legend")
                .attr("transform", "translate(460, 30)")
            //.attr('transform', 'translate(500, 100), rotate(90)')

            d3.select(".legend")
                .append("text")
                .attr("x", 3)
                .attr("y", 3)
                .attr("dx", 0)
                .attr("dy", -10)
                .text("Activity compared to baseline")
                .attr("id", "high")

            d3.select(".legend")
                .append("text")
                .attr("x", 3)
                .attr("y", 3)
                .attr("dx", -5)
                .attr("dy", 30)
                .text("❄️ 100% ⬇")
                .attr("id", "high")
                .attr("fill", colorBrewer.blue)

            d3.select(".legend")
                .append("text")
                .attr("x", 3)
                .attr("y", 3)
                .attr("dx", 195)
                .attr("dy", 30)
                .text("🔥 100% ⬆")
                .attr("id", "low")
                .attr("fill", colorBrewer.red)


            // -----------------------------------------------------------------------------------------------//
            // ---------------------------------------- Word Map ---------------------------------------------//
            // -----------------------------------------------------------------------------------------------//

            var mapSvg = d3.select(".mapChart"),
                mapWidth = +mapSvg.attr("width"),
                mapHeight = +mapSvg.attr("height");


            var projection = d3.geoMercator()
                .scale(600)
                .center([33, 48])



            var path = d3.geoPath()
                .projection(projection)

            var mapColor = { default: "#b8b8b8", highlighted: "lightgray", selected: "gray" }
            var previousCountry = null;
            var currentCountry = null;    
            var savedColorHover = null;
            var savedColorClick = null;


            // Leave color if clicked country, otherwise change to default
            let mouseOverCountry = function (d) {
                d3.select(this)
                    .style("fill", function(d){
                        savedColorHover = d3.select(this).style("fill")

                        let newColor = d3.rgb(savedColorHover)
                        newColor.r = newColor.r * 1.2
                        newColor.g = newColor.g * 1.2
                        newColor.b = newColor.b * 1.2
                        
                        return newColor
                    })
            }

            let mouseLeaveCountry = function (d) {
                d3.select(this)
                    .style("fill", savedColorHover)
                //savedColorHover = "blue"
            }


            mapSvg.append("g")
                .attr("transform", "translate(300,0)")
                .selectAll("path")
                .data(dataGeoLocations.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("id", function (d) {
                    return (d.properties.name).split(" ").join("-")
                })
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "#fff")
                .style("stroke-width", 0.8)
                .on("mouseover", mouseOverCountry)
                .on("mouseleave", mouseLeaveCountry)
                .on("click", function (d) {


                    /* ORIGINAL CLICK ON COUNTRY  */
                    previousCountry = currentCountry

                    // Assign new country
                    selectedCountryMAIN = d3.select(this).property("id")
                    currentCountry = d3.select(this).property("id")


                    // Color the available restriction categories
                    darkenUnactiveRestrictionCategories()
                    darkenUnactiveRestrictionMeasures()


                    // Display the selected country
                    d3.select(".selectedCountry")
                        .style("color", "black")
                        .text(selectedCountryMAIN)


                    // Flag
                    d3.select(".flag")
                        .style("background-image", function(){
                            let link = countryFlags.filter(item => item.Country == selectedCountryMAIN)[0].URL

                            return "url(" + String(countryFlags.filter(item => item.Country == selectedCountryMAIN)[0].URL) + ")";
                        })
                    
                    

                    // If click on the same country, lift
                    if (previousCountry == currentCountry) {

                        selectedCountryMAIN = null;
                        
                        // Remove the name from main display
                        d3.select(".selectedCountry")
                        .text("no country selected")
                        .style("color", "gray")



                        d3.select('#' + currentCountry)
                            .style("fill", savedColorClick)
                            //.on("mouseover", mouseOverCountry)
                            //.on("mouseleave", mouseLeaveCountry)

                        currentCountry = null;
                        savedColorHover = savedColorClick;



                    }
                    // If click on different country, lift previous, color new
                    else if (previousCountry != currentCountry) {

                        // Lift previous country
                        d3.select('#' + previousCountry)
                            .style("fill", savedColorClick)
                        //.on("mouseover", mouseOverCountry)
                        //.on("mouseleave", mouseLeaveCountry)

                        // Darken selected country
                        d3.select('#' + currentCountry)
                            //.style("fill", savedColorHover)
                            .style("fill", function (d) {
                                savedColorClick = savedColorHover // d3.select(this).style("fill")

                                let newColor = d3.rgb(savedColorClick)
                                newColor.r = newColor.r * 0.8//1.2
                                newColor.g = newColor.g * 0.8//1.2
                                newColor.b = newColor.b * 0.8//1.2

                                savedColorHover = newColor

                                return newColor
                            })
                            //.on("mouseover", null)
                            //.on("mouseleave", null)
                    }


                    // Update charts
                    updateAllCharts()

                })


            function colourCountries(selectedDate) {
                let filteredTourismData = dataTourism.filter(item =>
                    item.LastUpdate.split(" ")[0] == d3.timeFormat("%d.%m.%Y")(selectedDate))

                for (_ in filteredTourismData) {

                    let country = countryCodeNamesMapping[filteredTourismData[_].Country]

                    if (typeof country == "undefined") {
                        // do nothing
                    } else {

                        country = country.name

                        let color = ""

                        if (filteredTourismData[_].value == "Y") {
                            color = "#2c7bb6"
                        } else if (filteredTourismData[_].value == "WL") {
                            color = "#fdae61"
                        } else if (filteredTourismData[_].value == "N") {
                            color = "#d7191c"
                        } else { color = "purple" }

                        d3.select("#" + country)
                            .style("fill", "#b8b8b8")
                            .transition()
                            .duration(100)
                            .style("fill", color)
                    }


                }

            }





            // ----------------------------------------------------------------------------------------------//
            function setDefaultValues() {

                colorBricks();

                d3.selectAll(imageMapping.transitStations)
                    .selectAll("path")
                    .attr("fill", "rgb(233, 233, 233)")

                d3.selectAll(imageMapping.groceryAndPharmacy)
                    .selectAll("path")
                    .attr("fill", "rgb(233, 233, 233)")

                d3.selectAll(imageMapping.retailAndRecreation)
                    .selectAll("path")
                    .attr("fill", "rgb(233, 233, 233)")


                d3.selectAll(imageMapping.workplace)
                    .selectAll("path")
                    .attr("fill", "rgb(233, 233, 233)")

                d3.selectAll(imageMapping.park)
                    .selectAll("path")
                    .attr("fill", "rgb(233, 233, 233)")

                d3.selectAll(imageMapping.residential)
                    .selectAll("path")
                    .attr("fill", "rgb(233, 233, 233)")
            }
            //setDefaultValues();





            // -------- DATA END ----------
        }
    })
    // ------------------------------------


