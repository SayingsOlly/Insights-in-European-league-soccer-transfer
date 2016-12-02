function YearTrendDiagram() {
    this.yearValues = years.map(function (d) { return parseInt(d.split('-')[0]); });
    this.yearTransferMetrix = [];
    this.leagueAcSums = [];

    var me = this;

    var count = {value: 0};
    this.yearValues.forEach(function (year) {
        loadYears([year+'-'+(year+1)], function (d) {
            var sum = 0;
            var leagueSums = [],
                acSum = {v:0};
            d.forEach(function (dd, i) {
                dd.forEach(function (ddd) {
                    sum += ddd / 1000;
                });
            });

            d.forEach(function (dd, i) {
                var tmpSum = 0;
                dd.forEach(function (ddd) {
                    tmpSum += ddd / 1000;
                });
                leagueSums.push(tmpSum);
                me.leagueAcSums[i] || me.leagueAcSums.push([]);
                me.leagueAcSums[i].push({
                    acSum: sum - acSum.v - tmpSum,
                    value: tmpSum
                });
                acSum.v += tmpSum;
            });

            me.yearTransferMetrix.push({
                metrix: d,
                sumValue: sum,
                year: year,
                leagueSums: leagueSums,
            });

            count.value++;
            if(count.value == me.yearValues.length) {
                me.leagueAcSums.forEach(function (d) {
                    d.push(me.yearValues.length - 1);
                    d.push(0);
                });
                me.init();
            }
        })
    });
}
YearTrendDiagram.prototype.init = function (yearTransferMetrix) {
    this.svg = d3.select('#year-trend-svg');

    var svgBounds = this.svg.node().getBoundingClientRect(),
        xAxisWidth = 40,
        yAxisHeight = 40,
        figureWidth = svgBounds.width - xAxisWidth,
        figureHeight = svgBounds.height - yAxisHeight,
        dataLength = years.length,
        me = this;

    this.xScale = d3.scaleLinear()
        .domain(this.yearValues)
        .range(this.yearValues.map(function (d, i) {
            return xAxisWidth + i * (figureWidth - xAxisWidth) / (dataLength - 1);
        }));

    this.iScale = d3.scaleLinear()
        .domain([0, dataLength])
        .range([this.xScale(this.yearValues[0]), this.xScale(this.yearValues[dataLength - 1] + 1)]);

    var xAxis = d3.axisBottom();
    xAxis.ticks(dataLength)
        .scale(this.xScale);

    this.xAxis = this.svg.select("#xAxis")
        .style("transform", "translate(" + 0 + "px," + (yAxisHeight-1) + "px) scaleY(-1)")
        .transition().duration(1000)
        .call(xAxis);

    this.yScale = d3.scaleLinear()
        .domain([0, d3.max(this.yearTransferMetrix, function (d) {return d.sumValue;})])
        .range([yAxisHeight, figureHeight + 20]);

    this.yAxisScale = d3.scaleLinear()
        .domain([0, d3.max(this.yearTransferMetrix, function (d) {return d.sumValue;})])
        .range([figureHeight, 20]);

    console.log("original " + d3.max(this.yearTransferMetrix, function (d) {return d.sumValue;}));
    this.yAxis = d3.axisLeft();
    this.yAxis.ticks(10)
        .scale(this.yAxisScale);

    this.svg.select("#yAxis")
        .style("transform", "translate(" + (xAxisWidth-2) + "px," + svgBounds.height + "px) scaleY(-1)")
        .transition().duration(1000)
        .call(this.yAxis);

    this.aclineGenerator = d3.line()
        .x(function (d, i) {
            return i < dataLength ? me.iScale(i) : me.iScale(d);
        })
        .y(function (d, i) {
            return i < dataLength ? me.yScale(d.acSum + d.value) : me.yScale(0);
        });

    this.path = this.svg.select('.paths').selectAll('path').data(this.leagueAcSums);
    var newPath = this.path.enter().append('path')
        .attr('d', this.aclineGenerator)
        .style('fill', function (d, i) {
            return utils.color(i);
        });
    newPath.on('click', function (d, i) {
            var tmp = new Set();
            tmp.add(i);
            leagueSelectionBar.selectLeague(tmp, true, true);
        });
    this.path.exit().remove();
    this.path = newPath.merge(this.path);

    //this.lineGenerator = d3.line()
    //    .x(function (d, i) {
    //        return i < dataLength ? me.iScale(i) : me.iScale(d);
    //    })
    //    .y(function (d, i) {
    //        return i < dataLength ? me.yScale(d.value) : me.yScale(0);
    //    });
}


YearTrendDiagram.prototype.showLeagues = function (leagues) {
    var max = this.buildACfromValue(leagues),
        me = this;
    this.yScale = this.yScale.domain([0, max]);
    this.yAxisScale = this.yAxisScale.domain([0, max]);

    this.svg.select("#yAxis")
        .transition().duration(1000)
        .call(this.yAxis);

    this.path.style('display', function (d, i) {
        return leagues.size == 0 || leagues.has(i) ? 'inherit' : 'none';
    }).filter(function (d, i) {
        return leagues.size == 0 || leagues.has(i);
    }).transition().duration(1300)
        .attr('d', this.aclineGenerator);
};

YearTrendDiagram.prototype.buildACfromValue = function (leagues) {
    var me = this;
    var max = {v:0};
    this.yearTransferMetrix.forEach(function (d, yearIndex) {
        d = d.metrix;
        var sum = 0;
        var acSum = {v:0};

        d.forEach(function (dd, i) {
            if (leagues.size != 0 && !leagues.has(i))
                return ;
            dd.forEach(function (ddd) {
                sum += ddd / 1000;
            });
        });

        d.forEach(function (dd, i) {
            if (leagues.size != 0 && !leagues.has(i))
                return ;
            var tmpSum = 0;
            dd.forEach(function (ddd) {
                tmpSum += ddd / 1000;
            });
            me.leagueAcSums[i][yearIndex].acSum = sum - acSum.v - tmpSum;
            acSum.v += tmpSum;
        });
        max.v = Math.max(max.v, sum);
    });
    return max.v;
};